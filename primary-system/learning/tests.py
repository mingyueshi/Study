from django.contrib.auth import get_user_model
from django.test import Client
from catalog.tests import PlatformFixture
from catalog.models import ContentItem
from .models import Progress


# Run this on PostgreSQL as well: two requests must not both accept revision 0.
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from unittest import skipUnless
from django.core.management import call_command
from django.db import connection, connections
from django.test import TransactionTestCase
from catalog.importing import import_snapshot
from catalog.tests import minimal_snapshot
from .services import ProgressConflict, save_progress
import io


@skipUnless(connection.vendor == 'postgresql', 'Requires real PostgreSQL row locking')
class ConcurrentProgressTests(TransactionTestCase):
    def test_simultaneous_first_saves_accept_only_one_revision(self):
        call_command('seed_platform', stdout=io.StringIO())
        import_snapshot(minimal_snapshot(), publish=True)
        item = ContentItem.objects.get(title='认识数字')
        user = get_user_model().objects.create_user('concurrent-student')
        barrier = Barrier(2)

        def write(note):
            try:
                barrier.wait(timeout=10)
                save_progress(user, item, {'revision': 0, 'status': 'learning', 'bookmarked': False, 'note': note})
                return 'saved'
            except ProgressConflict:
                return 'conflict'
            finally:
                connections.close_all()

        with ThreadPoolExecutor(max_workers=2) as pool:
            self.assertCountEqual(list(pool.map(write, ['first', 'second'])), ['saved', 'conflict'])
        self.assertEqual(Progress.objects.count(), 1)
        self.assertEqual(Progress.objects.get().revision, 1)


class ProgressTests(PlatformFixture):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.alice = get_user_model().objects.create_user('alice', password='Strong-local-test-2026!')
        cls.bob = get_user_model().objects.create_user('bob', password='Strong-local-test-2026!')

    def setUp(self):
        self.url = f'/api/v1/me/progress/{self.item.pk}/'
        self.data = {'revision': 0, 'status': 'mastered', 'bookmarked': True, 'note': 'Alice 的私人笔记'}

    def post(self, data=None, client=None):
        return (client or self.client).post(self.url, self.data if data is None else data, content_type='application/json')

    def test_anonymous_cannot_read_or_write_and_get_is_side_effect_free(self):
        self.assertEqual(self.client.get(self.url).status_code, 401)
        self.assertEqual(self.post().status_code, 401)
        self.client.force_login(self.alice)
        self.assertEqual(self.client.get(self.url).json()['revision'], 0)
        self.assertFalse(Progress.objects.exists())

    def test_user_isolation_and_owner_injection(self):
        self.client.force_login(self.alice)
        self.assertEqual(self.post().status_code, 200)
        self.client.force_login(self.bob)
        self.assertEqual(self.client.get(self.url).json()['note'], '')
        self.assertNotContains(self.client.get('/me/'), 'Alice 的私人笔记')
        self.assertEqual(self.post({**self.data, 'user_id': self.alice.pk}).status_code, 400)
        self.assertEqual(self.post({**self.data, 'note': 'Bob 笔记'}).status_code, 200)
        self.assertEqual(Progress.objects.get(user=self.alice).note, 'Alice 的私人笔记')
        self.assertEqual(Progress.objects.count(), 2)

    def test_stale_and_duplicate_requests_do_not_overwrite(self):
        self.client.force_login(self.alice)
        self.assertEqual(self.post().json()['revision'], 1)
        self.assertEqual(self.post({**self.data, 'note': '旧页面覆盖'}).status_code, 409)
        self.assertEqual(Progress.objects.get().note, self.data['note'])
        self.assertEqual(self.post({**self.data, 'revision': 1, 'status': 'learning'}).json()['revision'], 2)
        self.assertEqual(Progress.objects.count(), 1)

    def test_csrf_is_enforced_and_valid_token_works(self):
        client = Client(enforce_csrf_checks=True)
        client.force_login(self.alice)
        self.assertEqual(self.post(client=client).status_code, 403)
        client.get(f'/items/{self.item.pk}/')
        token = client.cookies['primary_csrftoken'].value
        response = client.post(self.url, self.data, content_type='application/json', HTTP_X_CSRFTOKEN=token)
        self.assertEqual(response.status_code, 200)

    def test_payload_validation(self):
        self.client.force_login(self.alice)
        for overrides in [{'status': 'invalid'}, {'revision': True}, {'revision': -1}, {'bookmarked': 'false'}, {'note': 'x' * 4001}]:
            self.assertEqual(self.post({**self.data, **overrides}).status_code, 400)
        self.assertEqual(self.post([]).status_code, 400)
        self.assertEqual(self.client.post(self.url, '{', content_type='application/json').status_code, 400)
        self.assertEqual(self.client.post(self.url, 'x' * 33000, content_type='application/json').status_code, 413)
        self.assertFalse(Progress.objects.exists())

    def test_unpublished_records_not_visible_or_mutable(self):
        self.client.force_login(self.alice)
        self.post()
        ContentItem.objects.filter(pk=self.item.pk).update(status='draft')
        self.assertEqual(self.client.get(self.url).status_code, 404)
        self.assertEqual(self.post().status_code, 404)
        self.assertNotContains(self.client.get('/me/'), self.item.title)
        self.assertEqual(Progress.objects.count(), 1)

    def test_html_form_save_and_conflict(self):
        self.client.force_login(self.alice)
        url = f'/items/{self.item.pk}/'
        self.assertEqual(self.client.post(url, self.data).status_code, 302)
        self.assertContains(self.client.get(url), self.data['note'])
        self.assertEqual(self.client.post(url, self.data).status_code, 409)

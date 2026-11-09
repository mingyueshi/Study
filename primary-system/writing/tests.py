from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase

from .catalog import load_curriculum, validate
from .models import WritingDraft
from .services import MAX_CONTENT, DraftConflict, owner_filter, save_draft


class CurriculumDataTests(SimpleTestCase):
    """数据契约：镜像原型作文坊的 test-writing.js 下限。"""

    def setUp(self):
        self.curriculum = load_curriculum()

    def test_schema_and_source(self):
        self.assertEqual(self.curriculum['schema_version'], 1)
        self.assertEqual(self.curriculum['source_code'], 'primary-writing')

    def test_categories_and_unique_titles(self):
        categories = self.curriculum['categories']
        self.assertGreaterEqual(len(categories), 5)
        titles = []
        for category in categories:
            self.assertGreaterEqual(len(category['topics']), 2, category['name'])
            for topic in category['topics']:
                titles.append(topic['title'])
        self.assertEqual(len(titles), len(set(titles)))

    def test_topic_shape(self):
        for category in self.curriculum['categories']:
            for topic in category['topics']:
                outline = topic['outline']
                labels = ''.join(step['label'] for step in outline)
                self.assertEqual(len(outline), 3, topic['title'])
                self.assertIn('开头', labels)
                self.assertIn('结尾', labels)
                self.assertGreaterEqual(len(topic['words']), 3, topic['title'])
                self.assertGreaterEqual(len(topic['sentences']), 2, topic['title'])
                self.assertGreaterEqual(len(topic['model']), 120, topic['title'])
                self.assertTrue(topic['goal'] and topic['comment'] and topic['task'])

    def test_materials_minimums(self):
        materials = self.curriculum['materials']
        self.assertGreaterEqual(len(materials['starts']), 5)
        self.assertGreaterEqual(len(materials['ends']), 4)
        self.assertGreaterEqual(len(materials['wordGroups']), 3)
        self.assertGreaterEqual(len(materials['sentences']), 5)

    def test_validate_rejects_drift(self):
        bad = {'schema_version': 2, 'source_code': 'primary-writing', 'categories': [], 'materials': {}}
        with self.assertRaises(Exception):
            validate(bad)


class DraftApiTests(TestCase):
    """草稿双轨 API：游客会话、登录账号、revision 并发、隔离与上限。"""

    def create_draft(self, client, **overrides):
        payload = {'title': '我的自画像', 'content': '镜子里站着一个瘦瘦的男孩。', 'topic_title': '我的自画像'}
        payload.update(overrides)
        return client.post('/writing/api/drafts/', payload, content_type='application/json')

    def test_guest_create_list_update_delete(self):
        response = self.create_draft(self.client)
        self.assertEqual(response.status_code, 201, response.content)
        draft = response.json()
        self.assertEqual(draft['revision'], 1)
        self.assertTrue(draft['id'])

        listing = self.client.get('/writing/api/drafts/').json()
        self.assertEqual([d['id'] for d in listing['drafts']], [draft['id']])

        updated = self.client.patch(f"/writing/api/drafts/{draft['id']}/",
                                     {'title': '我的自画像（改）', 'content': '改好了。', 'revision': 1},
                                     content_type='application/json')
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()['revision'], 2)

        deleted = self.client.delete(f"/writing/api/drafts/{draft['id']}/")
        self.assertEqual(deleted.status_code, 200)
        self.assertEqual(self.client.get('/writing/api/drafts/').json()['drafts'], [])

    def test_revision_conflict_returns_409(self):
        draft = self.create_draft(self.client).json()
        conflict = self.client.patch(f"/writing/api/drafts/{draft['id']}/",
                                      {'title': 'x', 'content': 'y', 'revision': 0},
                                      content_type='application/json')
        self.assertEqual(conflict.status_code, 409)

    def test_oversized_content_rejected(self):
        response = self.create_draft(self.client, content='字' * (MAX_CONTENT + 1))
        self.assertEqual(response.status_code, 413)
        self.assertEqual(WritingDraft.objects.count(), 0)

    def test_owner_isolation_between_guests(self):
        draft = self.create_draft(self.client).json()
        other = self.client_class()
        other.get('/writing/')  # 触发另一份会话
        self.assertEqual(other.get('/writing/api/drafts/').json()['drafts'], [])
        self.assertEqual(other.patch(f"/writing/api/drafts/{draft['id']}/",
                                     {'title': 'x', 'content': 'y', 'revision': 1},
                                     content_type='application/json').status_code, 404)
        self.assertEqual(other.delete(f"/writing/api/drafts/{draft['id']}/").status_code, 404)
        self.assertEqual(WritingDraft.objects.count(), 1)

    def test_logged_in_user_owns_drafts_by_account(self):
        user = get_user_model().objects.create_user(username='writer', password='pw-123456')
        self.client.force_login(user)
        draft = self.create_draft(self.client).json()
        row = WritingDraft.objects.get(pk=draft['id'])
        self.assertEqual(row.user, user)
        self.assertEqual(row.guest_key, '')

    def test_guest_draft_can_be_resumed_after_register_and_logout(self):
        draft = self.create_draft(self.client).json()
        response = self.client.post('/accounts/register/', {
            'username': 'new-writer', 'password1': 'family-test', 'password2': 'family-test',
        })
        self.assertEqual(response.status_code, 302)
        self.assertEqual(self.client.get('/writing/api/drafts/').json()['drafts'], [])
        self.create_draft(self.client, title='账号草稿')
        self.assertEqual(self.client.post('/accounts/logout/').status_code, 302)
        self.assertEqual(self.client.get('/writing/api/drafts/').json()['drafts'], [draft])

    def test_service_conflict_exception(self):
        user = get_user_model().objects.create_user(username='w2', password='pw-123456')
        from django.test import RequestFactory
        request = RequestFactory().post('/writing/api/drafts/')
        request.user = user
        request.session = {}
        first = save_draft(request, {'title': 't', 'content': 'c', 'revision': 0})
        with self.assertRaises(DraftConflict):
            save_draft(request, {'title': 't', 'content': 'c2', 'revision': 0}, draft=first)


class WritingPageTests(TestCase):
    def test_page_renders_topics_and_materials(self):
        response = self.client.get('/writing/')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '作文坊')
        self.assertContains(response, '素材百宝箱')
        self.assertContains(response, '我的自画像')
        self.assertContains(response, '我的作文本')
        self.assertContains(response, 'data-say=')  # 中文点读

    def test_page_is_session_safe_for_drafts(self):
        # 页面本身不含草稿数据（草稿经 API 拉取）；不登录也能完整浏览。
        response = self.client.get('/writing/')
        self.assertNotContains(response, 'writing_draft')
        self.assertEqual(owner_filter(response.wsgi_request), {'guest_key': response.wsgi_request.session.session_key})

from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from unittest import skipUnless
from django.core.exceptions import ValidationError
from django.db import connection, connections
from django.test import TransactionTestCase
from lexicon.importing import stage_manifest
from lexicon.models import LexiconAudit, LexiconSource, SourceRelease
from lexicon.services import activate_release
from .helpers import manifest, row


@skipUnless(connection.vendor == 'postgresql', 'Requires real PostgreSQL row locks')
class ActivationConcurrencyTests(TransactionTestCase):
    def test_two_stale_review_pages_cannot_both_activate(self):
        first, _ = stage_manifest(manifest())
        second, _ = stage_manifest(manifest([row(meaning='新版')], version='v2'))
        barrier = Barrier(2)

        def activate(pk):
            try:
                barrier.wait(timeout=10)
                activate_release(pk, expected_current='', reason='并发审核测试')
                return 'activated'
            except ValidationError:
                return 'conflict'
            finally:
                connections.close_all()

        with ThreadPoolExecutor(max_workers=2) as pool:
            self.assertCountEqual(list(pool.map(activate, [first.pk, second.pk])), ['activated', 'conflict'])
        self.assertEqual(LexiconAudit.objects.filter(action='activate_release').count(), 1)
        self.assertIn(LexiconSource.objects.get().active_release_id, [first.pk, second.pk])

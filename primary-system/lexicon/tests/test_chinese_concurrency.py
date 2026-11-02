from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from unittest import skipUnless
from django.core.exceptions import ValidationError
from django.db import connection, close_old_connections
from django.test import TransactionTestCase
from lexicon.chinese import create_chinese, review_chinese, adopt_chinese
from lexicon.models import ChineseSenseVersion, editorial_values
from lexicon.services import revise
from words.models import Scenario, ScenarioWord, WordProgress, LearningTarget
from words.services import set_learned, state_payload, ProgressConflict
from words.test_targets import release, target
from words.tests import word_row


@skipUnless(connection.vendor == 'postgresql', 'Requires real PostgreSQL row locks')
class ChineseConcurrencyTests(TransactionTestCase):
    def setUp(self):
        self.release = release('race', [word_row('bank', '/b/', 'financial institution')])
        self.record = self.release.records.get()
        self.target = target(self.record)
        scene = Scenario.objects.create(code='race', name='Race', zh='竞争')
        ScenarioWord.objects.create(en='bank', target=self.target, scenario=scene)
        self.snapshot = self.target.editorial_snapshot

    def draft(self):
        return create_chinese(evidence_id=self.record.pk, expected_snapshot=self.snapshot, text='银行机构',
            kind='translation', learning_effect='same', author_label='a', provenance='合成样例', change_reason='明确同义')

    def race(self, *actions):
        barrier = Barrier(len(actions))
        def run(action):
            close_old_connections()
            try:
                barrier.wait(timeout=15)
                try:
                    action()
                    return 'saved'
                except (ValidationError, ProgressConflict):
                    return 'conflict'
            finally:
                close_old_connections()
        with ThreadPoolExecutor(max_workers=len(actions)) as pool:
            return list(pool.map(run, actions))

    def confirmed(self):
        v = self.draft()
        return review_chinese(v.pk, expected_revision=0, decision='confirmed', reviewer='a', note='确认')

    def test_two_confirmations_of_same_seen_revision_have_one_winner(self):
        v = self.draft()
        action = lambda: review_chinese(v.pk, expected_revision=0, decision='confirmed', reviewer='a', note='确认')
        self.assertCountEqual(self.race(action, action), ['saved', 'conflict'])
        v.refresh_from_db(); self.assertEqual(v.review_revision, 1)
        self.assertEqual(v.reviews.count(), 1)

    def test_create_vs_source_revision_never_captures_unseen_latest_snapshot(self):
        result = self.race(self.draft, lambda: revise(self.target.sense, value='changed source', note='并发修订', expected_revision=0))
        self.assertEqual(result[1], 'saved')
        for v in ChineseSenseVersion.objects.all():
            self.assertEqual(v.editorial_snapshot, self.snapshot)
            with self.assertRaises(ValidationError):
                review_chinese(v.pk, expected_revision=0, decision='confirmed', reviewer='a', note='旧页确认')
        if result[0] == 'conflict': self.assertFalse(ChineseSenseVersion.objects.exists())

    def test_adoption_vs_old_page_write_only_records_actually_seen_legacy(self):
        v = self.confirmed()
        result = self.race(
            lambda: adopt_chinese(target_id=self.target.pk, version_id=v.pk, expected_revision=0, expected_review_revision=1, reason='选择'),
            lambda: set_learned({'guest_key':'same-browser'}, self.target.pk, True, 0, chinese_version_id=None, presentation_revision=0))
        self.assertEqual(result[0], 'saved')
        for row in WordProgress.objects.all():
            self.assertIsNone(row.seen_chinese_version_id)
            self.assertEqual(row.seen_presentation_revision, 0)
        if result[1] == 'conflict': self.assertFalse(WordProgress.objects.exists())
        self.target.refresh_from_db(); self.assertEqual(self.target.chinese_version_id, v.pk)

    def test_adoption_vs_source_revision_keeps_fixed_evidence_and_hides_invalid_body(self):
        v = self.confirmed()
        result = self.race(
            lambda: adopt_chinese(target_id=self.target.pk, version_id=v.pk, expected_revision=0, expected_review_revision=1, reason='选择'),
            lambda: revise(self.target.sense, value='changed source', note='并发改义', expected_revision=0))
        self.assertEqual(result[1], 'saved')
        self.target.refresh_from_db()
        self.assertEqual(self.target.editorial_snapshot, self.snapshot)
        self.assertEqual(state_payload({'guest_key':'reader'})['words'][0]['zh'], '')
        if result[0] == 'conflict': self.assertIsNone(self.target.chinese_version_id)

    def test_withdrawal_vs_chinese_write_is_serial_and_does_not_fake_new_view(self):
        v = self.confirmed()
        adopt_chinese(target_id=self.target.pk, version_id=v.pk, expected_revision=0, expected_review_revision=1, reason='选择')
        result = self.race(
            lambda: review_chinese(v.pk, expected_revision=1, decision='withdrawn', reviewer='a', note='撤回'),
            lambda: set_learned({'guest_key':'reader'}, self.target.pk, True, 0, chinese_version_id=v.pk, presentation_revision=1))
        self.assertEqual(result[0], 'saved')
        self.assertEqual(state_payload({'guest_key':'reader'})['words'][0]['zh'], '')
        for row in WordProgress.objects.all():
            self.assertEqual(row.seen_chinese_version_id, v.pk)
            self.assertEqual(row.seen_presentation_revision, 1)

    def test_first_link_and_placement_share_parent_lock_and_never_reset_established_semantics(self):
        import io
        from django.core.management import call_command
        from catalog.importing import import_snapshot
        from catalog.tests import minimal_snapshot
        from catalog.models import ContentItem, Placement, Unit
        from lexicon.models import ContentEntryLink
        call_command('seed_platform', stdout=io.StringIO())
        import_snapshot(minimal_snapshot(), publish=True)
        unit = Unit.objects.get(code='test-unit')
        item = ContentItem.objects.create(module=unit.textbook_book.module, kind='word', title='bank')
        result = self.race(
            lambda: ContentEntryLink.objects.create(content=item, sense_id=self.target.sense_id,
                pronunciation_id=self.target.pronunciation_id, evidence=self.record),
            lambda: Placement.objects.create(item=item, unit=unit))
        self.assertEqual(result, ['saved', 'saved'])
        link = ContentEntryLink.objects.get(content=item)
        self.assertTrue(link.semantic_established)
        changed = create_chinese(evidence_id=self.record.pk, expected_snapshot=self.snapshot, text='纠错变义的新概念',
            kind='correction', learning_effect='changed', author_label='a', provenance='合成样例', change_reason='变义')
        changed = review_chinese(changed.pk, expected_revision=0, decision='confirmed', reviewer='a', note='明确变义')
        Placement.objects.filter(item=item).delete()
        with self.assertRaises(ValidationError):
            adopt_chinese(link_id=link.pk, version_id=changed.pk, expected_revision=0, expected_review_revision=1, reason='不能重置旧语义')

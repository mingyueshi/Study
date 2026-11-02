"""学习对象、来源生命周期、编排与并发的领域回归。"""
import io
import json
import tempfile
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest import skipUnless

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.db import connection, close_old_connections
from django.test import TestCase, TransactionTestCase

from lexicon.importing import stage_manifest
from lexicon.models import EntryMatch, LexicalEntry
from lexicon.services import activate_release, merge_match, revise
from words.models import LearningTarget, Scenario, ScenarioWord, WordProgress
from words.services import ProgressConflict, set_learned, state_payload
from words.tests import word_row


def release(version, rows, expected=''):
    value, _ = stage_manifest({'schema_version': 1, 'source': {'code': 'primary-words', 'name': '教学'},
        'version': version, 'adapter': 'test-v1', 'records': rows})
    activate_release(value.pk, expected_current=str(expected), reason='测试来源')
    return value


def target(record):
    return LearningTarget.objects.create(label=record.headword, sense=record.binding.sense,
        pronunciation=record.binding.pronunciation, evidence=record)


class TargetTests(TestCase):
    def setUp(self):
        self.release = release('one', [word_row('bank', '/bæŋk/', '银行'), word_row('river', '/r/', '河')])
        self.record = self.release.records.get(headword='bank')
        self.target = target(self.record)
        self.scenario = Scenario.objects.create(code='money', name='Money', zh='钱')
        self.word = ScenarioWord.objects.create(scenario=self.scenario, target=self.target,
            en='bank', entry=self.target.sense.entry, memo='人工提示')
        self.owner = {'guest_key': 'test-guest'}

    def import_snapshot(self, units, dry=False):
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / 'snapshot.json'
            file.write_text(json.dumps({'schema_version': 2, 'units': units}))
            out = io.StringIO()
            call_command('import_scenarios', input=str(file), dry_run=dry, stdout=out)
            return json.loads(out.getvalue())

    def units(self, word=None):
        return [{'id': code, 'name': code, 'zh': code, 'words': [word or {'en': 'bank', 'memo': '导入覆盖'}]}
                for code in ('money', 'river')]

    def test_two_scenarios_share_target_and_deletion_preserves_progress(self):
        stats = self.import_snapshot(self.units())
        self.assertEqual(stats['created_placements'], 1)
        self.assertEqual(LearningTarget.objects.count(), 1)
        self.word.refresh_from_db()
        self.assertEqual(self.word.memo, '人工提示')
        set_learned(self.owner, self.target.pk, True, 0)
        self.assertTrue(all(w['learned'] for w in state_payload(self.owner)['words']))
        self.word.delete()
        self.assertEqual(WordProgress.objects.get().target_id, self.target.pk)
        self.assertTrue(state_payload(self.owner)['words'][0]['learned'])
        self.assertTrue(LearningTarget.objects.filter(pk=self.target.pk).exists())

    def test_dry_run_reports_same_work_and_leaves_everything_unchanged(self):
        before = list(ScenarioWord.objects.values())
        dry = self.import_snapshot(self.units(), dry=True)
        self.assertEqual(list(ScenarioWord.objects.values()), before)
        self.assertEqual(Scenario.objects.count(), 1)
        actual = self.import_snapshot(self.units())
        self.assertEqual(dry['created_placements'], actual['created_placements'])
        again = self.import_snapshot(self.units())
        self.assertEqual(again['created_placements'], 0)
        self.assertEqual(again['created_targets'], 0)

    def test_same_spelling_distinct_sense_same_scenario_no_progress_leak(self):
        # 新来源身份，不能按拼写合并义项。
        other = word_row('bank-river', '/bæŋk/', '河岸')
        other['headword'] = 'bank'
        other['raw']['en'] = 'bank'
        new = release('two', [word_row('bank', '/bæŋk/', '银行'), other], self.release.pk)
        records = list(new.records.filter(headword='bank'))
        self.assertEqual(len(records), 2)
        dry = self.import_snapshot(self.units(), dry=True)
        self.assertEqual(dry['ambiguous'], 2)
        other_record = new.records.get(binding__external_key='bank-river')
        new_target = target(other_record)
        self.import_snapshot(self.units({'en': 'bank', 'target_id': str(new_target.pk)}))
        self.assertEqual(self.scenario.words.count(), 2)
        set_learned(self.owner, self.target.pk, True, 0)
        cards = state_payload(self.owner)['words']
        self.assertTrue(next(w for w in cards if w['target_id'] == str(self.target.pk))['learned'])
        self.assertFalse(any(w['learned'] for w in cards if w['target_id'] == str(new_target.pk)))

    def test_version_changes_deletion_disable_rollback_and_editorial(self):
        set_learned(self.owner, self.target.pk, True, 0)
        changed = release('changed', [word_row('bank', '/bæŋk/', '新含义')], self.release.pk)
        self.assertEqual(state_payload(self.owner)['words'][0]['zh'], '')
        missing = release('missing', [word_row('river', '/r/', '河')], changed.pk)
        self.assertEqual(state_payload(self.owner)['words'][0]['zh'], '')
        activate_release(self.release.pk, expected_current=str(missing.pk), reason='回退')
        self.assertEqual(state_payload(self.owner)['words'][0]['zh'], '银行')
        revise(self.target.sense, value='银行（修订）', note='教学纠错', expected_revision=0)
        self.assertEqual(state_payload(self.owner)['words'][0]['zh'], '')
        reviewed = target(self.record)
        ScenarioWord.objects.create(en='bank', scenario=self.scenario, target=reviewed, entry=reviewed.sense.entry)
        new_card = next(w for w in state_payload(self.owner)['words'] if w['target_id'] == str(reviewed.pk))
        self.assertEqual(new_card['zh'], '银行（修订）')
        self.assertFalse(new_card['learned'])
        source = self.release.source
        source.enabled = False
        source.save(update_fields=['enabled'])
        self.assertEqual(state_payload(self.owner)['words'][0]['zh'], '')
        self.assertTrue(state_payload(self.owner)['words'][0]['learned'])
        self.target.refresh_from_db()
        self.assertEqual(self.target.evidence_id, self.record.pk)

    def test_manual_revision_requires_explicit_new_goal_and_import_does_not_rebind(self):
        set_learned(self.owner, self.target.pk, True, 0)
        revise(self.target.sense, value='重大修订', note='修订待复核', expected_revision=0)
        stats = self.import_snapshot(self.units())
        self.assertEqual(stats['conflicts'], 2)
        self.assertEqual(LearningTarget.objects.count(), 1)
        card = state_payload(self.owner)['words'][0]
        self.assertEqual(card['zh'], '')
        self.assertTrue(card['learned'])
        self.assertIn('人工', card['source_status'])
        self.assertEqual(card['selected_editorial_revision'], 0)
        self.assertEqual(card['editorial_revision'], 1)
        # 读音人工改写亦不能悄悄改变旧目标。
        pronunciation = self.target.pronunciation
        revise(pronunciation, value='/changed/', note='读音修订', expected_revision=pronunciation.revision)
        self.assertEqual(state_payload(self.owner)['words'][0]['ipa'], '')
        self.target.refresh_from_db()
        self.assertEqual(self.target.editorial_snapshot['definition'], '')

    def test_direct_manual_value_change_without_revision_cannot_bypass_snapshot(self):
        from lexicon.models import Sense
        Sense.objects.filter(pk=self.target.sense_id).update(editorial_definition='未按修订流程改写')
        self.assertEqual(state_payload(self.owner)['words'][0]['zh'], '')
        stats = self.import_snapshot(self.units())
        self.assertEqual(stats['conflicts'], 2)
        self.assertEqual(LearningTarget.objects.count(), 1)

    def test_merge_follows_sense_and_keeps_progress(self):
        keep = LexicalEntry.objects.create(language='en', headword='bank', kind='word')
        match = EntryMatch.objects.create(left=keep, right=self.target.sense.entry)
        set_learned(self.owner, self.target.pk, True, 0)
        merge_match(match.pk, reason='测试归并保留义项')
        card = state_payload(self.owner)['words'][0]
        self.assertEqual(card['zh'], '银行')
        self.assertTrue(card['learned'])
        self.target.refresh_from_db()
        self.assertEqual(self.target.sense.entry_id, keep.pk)

    def test_archived_sense_hides_fields_and_legacy_placement_deletion_is_safe(self):
        WordProgress.objects.create(target=self.target, word=self.word, legacy_word_id=self.word.pk,
            guest_key='test-guest', learned=True)
        old_id = self.word.pk
        sense = self.target.sense
        sense.status = 'archived'
        sense.save(update_fields=['status'])
        self.assertEqual(state_payload(self.owner)['words'][0]['zh'], '')
        self.word.delete()
        row = WordProgress.objects.get()
        self.assertIsNone(row.word_id)
        self.assertEqual(row.legacy_word_id, old_id)
        self.assertTrue(row.learned)
        self.assertEqual(row.target_id, self.target.pk)

    def test_admin_add_placement_derives_legacy_entry_from_selected_target(self):
        from django.contrib import admin
        from django.test import RequestFactory
        from words.admin import ScenarioWordAdmin
        user = get_user_model().objects.create_superuser('admin-fixture', password='!')
        request = RequestFactory().get('/admin/words/scenarioword/add/')
        request.user = user
        new_scenario = Scenario.objects.create(code='admin-place', name='Admin', zh='维护')
        form_type = ScenarioWordAdmin(ScenarioWord, admin.site).get_form(request)
        form = form_type(data={'en': 'bank', 'target': str(self.target.pk), 'scenario': new_scenario.pk,
                              'order': 0, 'segments': '[]', 'related': '[]'})
        self.assertTrue(form.is_valid(), form.errors)
        added = form.save()
        self.assertEqual(added.entry_id, self.target.sense.entry_id)
        with self.assertRaises(ValidationError):
            LearningTarget.objects.create(label='unselected')

    def test_illegal_binding_and_identity_rewrite_rejected(self):
        other = self.release.records.get(headword='river')
        with self.assertRaises(ValidationError):
            LearningTarget.objects.create(label='bank', sense=self.target.sense,
                pronunciation=other.binding.pronunciation, evidence=self.record)
        with self.assertRaises(ValidationError):
            LearningTarget.objects.create(label='bank', sense=self.target.sense, evidence=other)
        self.target.evidence = other
        with self.assertRaises(ValidationError):
            self.target.save()

    def test_revision_and_owner_isolation_and_old_schema(self):
        row = set_learned(self.owner, self.target.pk, True, 0)
        self.assertEqual(row.revision, 1)
        with self.assertRaises(ProgressConflict):
            set_learned(self.owner, self.target.pk, False, 0)
        self.assertTrue(WordProgress.objects.get().learned)
        for name in ('one', 'two'):
            user = get_user_model().objects.create_user(name)
            self.assertFalse(state_payload({'user': user})['words'][0]['learned'])
            set_learned({'user': user}, self.target.pk, False, 0)
        self.assertFalse(state_payload({'guest_key': 'another'})['words'][0]['learned'])
        response = self.client.post('/words/api/learn/', json.dumps({'word_id': str(self.word.pk), 'learned': True}), content_type='application/json')
        self.assertEqual(response.status_code, 409)


@skipUnless(connection.vendor == 'postgresql', 'PostgreSQL row locks')
class TargetConcurrencyTests(TransactionTestCase):
    def test_concurrent_first_write_has_one_winner_and_stale_conflict(self):
        r = release('concurrent', [word_row('bank', '/b/', '银行')])
        goal = target(r.records.get())
        barrier = threading.Barrier(2)
        def write(learned):
            close_old_connections()
            try:
                barrier.wait(timeout=10)
                try:
                    set_learned({'guest_key': 'shared-browser'}, goal.pk, learned, 0)
                    return 'saved'
                except ProgressConflict:
                    return 'conflict'
            finally:
                close_old_connections()
        with ThreadPoolExecutor(max_workers=2) as pool:
            outcomes = list(pool.map(write, (True, False)))
        self.assertCountEqual(outcomes, ['saved', 'conflict'])
        self.assertEqual(WordProgress.objects.count(), 1)
        self.assertEqual(WordProgress.objects.get().revision, 1)

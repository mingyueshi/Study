import copy
import io
import json
import tempfile
from pathlib import Path
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.test import TestCase
from lexicon.importing import ImportProblem, stage_manifest
from lexicon.models import (ContentEntryLink, EntryForm, EntryMatch, LexicalEntry,
                            LexiconSource, Pronunciation, Sense, SourceBinding, SourceRecord, SourceRelease)
from lexicon.services import activate_release, build_matches, merge_match, revise
from .helpers import manifest, row


class ImportTests(TestCase):
    def test_staged_data_not_activated_or_published_and_trace_is_kept(self):
        release, report = stage_manifest(manifest())
        record = release.records.get()
        self.assertFalse(release.source.public_allowed)  # Manifest cannot grant rights.
        self.assertIsNone(release.source.active_release_id)
        self.assertEqual(record.raw, {'word': 'bank', 'meaning': '银行', 'reading': '/bæŋk/'})
        self.assertEqual(record.field_paths['definition'], '/meaning')
        self.assertEqual(record.binding.sense.entry.status, 'draft')
        self.assertEqual(EntryForm.objects.get().lookup_key, 'bank')
        self.assertEqual(report['entries_created'], 1)

    def test_idempotence_and_immutable_version_checksum(self):
        release, _ = stage_manifest(manifest())
        repeated, result = stage_manifest(manifest())
        self.assertEqual(repeated.pk, release.pk)
        self.assertTrue(result['already_staged'])
        self.assertEqual(result['entries_created'], 0)
        self.assertEqual(result['version_totals']['entries_created'], 1)
        self.assertEqual(SourceRecord.objects.count(), 1)
        changed = manifest([row(meaning='河岸')])
        with self.assertRaises(ImportProblem):
            stage_manifest(changed)
        self.assertEqual(SourceRecord.objects.get().definition, '银行')

    def test_dry_run_and_invalid_final_row_write_nothing(self):
        stage_manifest(manifest(), dry_run=True)
        _, missing = stage_manifest(manifest([row(reading='无')]), dry_run=True)
        self.assertEqual(missing['missing_pronunciation'], 1)
        self.assertFalse(LexiconSource.objects.exists())
        broken = manifest([row(), row(key='other')])
        broken['records'][1]['field_paths']['definition'] = '/missing'
        with self.assertRaises(ImportProblem):
            stage_manifest(broken)
        self.assertFalse(LexiconSource.objects.exists())

    def test_raw_provenance_cannot_point_at_different_text(self):
        changed = manifest()
        changed['records'][0]['definition'] = '并非原文'
        with self.assertRaises(ImportProblem):
            stage_manifest(changed)
        self.assertEqual(SourceRecord.objects.count(), 0)

    def test_interrupted_batch_resumes_and_active_version_is_unchanged(self):
        first, _ = stage_manifest(manifest())
        activate_release(first.pk, expected_current='', reason='测试启用')
        incoming = manifest([row(), row('river', 'river', '河流'), row('tree', 'tree', '树')], version='v2')

        def interrupt(release):
            raise RuntimeError('simulated interruption')

        with self.assertRaises(RuntimeError):
            stage_manifest(incoming, batch_size=1, on_batch=interrupt)
        failed = SourceRelease.objects.get(version='v2')
        self.assertEqual((failed.status, failed.processed), ('failed', 1))
        self.assertEqual(failed.source.active_release_id, first.pk)
        resumed, _ = stage_manifest(incoming, batch_size=1)
        self.assertEqual((resumed.status, resumed.records.count()), ('ready', 3))
        self.assertEqual(resumed.source.active_release_id, first.pk)
        self.assertEqual(LexicalEntry.objects.count(), 3)

    def test_source_update_does_not_overwrite_editorial_revision(self):
        first, _ = stage_manifest(manifest())
        sense = first.records.get().binding.sense
        revise(sense, value='适合小学生的人工解释', note='测试修订', expected_revision=0)
        second, _ = stage_manifest(manifest([row(meaning='来源新版解释')], version='v2'))
        self.assertEqual(first.records.get().binding.sense_id, second.records.get().binding.sense_id)
        activate_release(second.pk, expected_current='', reason='核对新来源')
        activate_release(first.pk, expected_current=second.pk, reason='回退来源')
        sense.refresh_from_db()
        self.assertEqual(sense.editorial_definition, '适合小学生的人工解释')
        self.assertEqual(sense.revision, 1)
        with self.assertRaises(ValidationError):
            revise(sense, value='旧页面覆盖', note='冲突', expected_revision=0)

    def test_exact_reuse_requires_all_core_fields_and_preserves_both_evidence_rows(self):
        first, _ = stage_manifest(manifest(), exact_reuse=True)
        same, report = stage_manifest(manifest(source='second-source'), exact_reuse=True)
        self.assertEqual(first.records.get().binding.sense_id, same.records.get().binding.sense_id)
        self.assertEqual(report['exact_reused'], 1)
        stage_manifest(manifest([row(meaning='河岸')], source='third-source'), exact_reuse=True)
        self.assertEqual(LexicalEntry.objects.count(), 2)
        self.assertEqual(SourceRecord.objects.count(), 3)

    def test_homographs_case_and_polyphonic_characters_stay_separate(self):
        data = [row('US', 'US', '美国'), row('us', 'us', '我们'),
                row('xing', '行', '行走', 'xíng', language='zh', kind='character', pronunciation={'value': 'xíng', 'system': 'pinyin'}),
                row('hang', '行', '行业', 'háng', language='zh', kind='character', pronunciation={'value': 'háng', 'system': 'pinyin'})]
        stage_manifest(manifest(data), exact_reuse=True)
        self.assertEqual(LexicalEntry.objects.count(), 4)
        self.assertEqual(build_matches(), 2)
        self.assertEqual(EntryMatch.objects.filter(status='pending').count(), 2)

    def test_extended_han_and_variation_selector_are_preserved(self):
        text = '\U00020000\U000e0100'
        stage_manifest(manifest([row(word=text, language='zh', kind='character')]))
        self.assertEqual(LexicalEntry.objects.get().headword, text)

    def test_explicit_replacement_source_keeps_sense_id(self):
        first, _ = stage_manifest(manifest())
        sense = first.records.get().binding.sense
        replacement = row(meaning='另一来源核对后的说明', target_sense=str(sense.pk))
        second, report = stage_manifest(manifest([replacement], source='replacement'))
        self.assertEqual(second.records.get().binding.sense_id, sense.pk)
        self.assertEqual(report['explicitly_aligned'], 1)
        self.assertEqual(LexicalEntry.objects.count(), 1)
        self.assertNotEqual(first.records.get().binding_id, second.records.get().binding_id)

    def test_identity_change_or_silent_rebinding_is_rejected(self):
        stage_manifest(manifest())
        with self.assertRaises(ImportProblem):
            stage_manifest(manifest([row(word='bank2')], version='v2'))
        self.assertEqual(SourceRelease.objects.count(), 1)

    def test_source_records_and_audits_are_append_only(self):
        release, _ = stage_manifest(manifest())
        record = release.records.get()
        record.definition = '篡改来源'
        with self.assertRaises(ValidationError):
            record.save()
        with self.assertRaises(ValidationError):
            record.delete()
        record.refresh_from_db()
        self.assertEqual(record.definition, '银行')

    def test_confirmed_merge_preserves_all_senses_and_future_imports(self):
        first, _ = stage_manifest(manifest([row(), row('bank-river', meaning='河岸')]))
        build_matches()
        candidate = EntryMatch.objects.get()
        ids = set(Sense.objects.values_list('id', flat=True))
        merge_match(candidate.pk, reason='同一词头，不合并其不同义项')
        self.assertEqual(set(Sense.objects.values_list('id', flat=True)), ids)
        self.assertEqual(Sense.objects.filter(entry=candidate.left).count(), 2)
        stage_manifest(manifest([row(), row('bank-river', meaning='河岸的新版解释')], version='v2'))
        self.assertEqual(LexicalEntry.objects.count(), 2)
        self.assertEqual(Sense.objects.count(), 2)

    def test_json_command_reports_and_refuses_input_overwrite(self):
        with tempfile.TemporaryDirectory() as temp:
            file = Path(temp) / 'input.json'
            report = Path(temp) / 'report.json'
            file.write_text(json.dumps(manifest()))
            call_command('import_lexicon', adapter='json', input=file, report=report, stdout=io.StringIO())
            self.assertFalse(json.loads(report.read_text())['activated'])
            from django.core.management.base import CommandError
            with self.assertRaises(CommandError):
                call_command('import_lexicon', adapter='json', input=file, report=file, stdout=io.StringIO())

import gzip
import io
import json
import tempfile
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from zipfile import ZipFile
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from lexicon.importing import ImportProblem, stage_manifest
from lexicon.models import EntryForm, LexicalEntry, LexiconAudit, Pronunciation, Sense
from lexicon.open_sources import parse_oewn, parse_unihan, registry, release_notices, verified_file
from lexicon.services import activate_release, review_objects, revise
from .helpers import allow_public, manifest, row


class OpenAdapterTests(TestCase):
    def test_unihan_fields_radicals_variants_and_missing_data_keep_evidence(self):
        data = '# Unicode Version 18.0.0\nU+5B66\tkIICore\tAGJ\nU+5B66\tkMandarin\txué\nU+5B66\tkDefinition\tlearning\nU+5B66\tkRSUnicode\t39.5\nU+5B66\tkTotalStrokes\t8\nU+5B66\tkTraditionalVariant\tU+5B78\nU+20000\tkIICore\tAG\n'
        with tempfile.TemporaryDirectory() as folder:
            file = Path(folder) / 'Unihan.zip'
            with ZipFile(file, 'w') as z:
                z.writestr('Unihan_Readings.txt', data)
            rows = parse_unihan(file, version='18.0.0', radicals={'39': {'character': '子', 'source_line': '39; 2F26; 5B50'}})
        release, _ = stage_manifest(manifest(rows))
        record = release.records.get(headword='学')
        self.assertEqual(record.properties['radicals'], ['子 · 部外5画'])
        self.assertEqual(record.properties['traditional'], ['學'])
        self.assertEqual(record.raw['source_lines']['kDefinition']['text'], 'U+5B66\tkDefinition\tlearning')
        self.assertEqual(record.pronunciation_key, 'xue')
        self.assertEqual(release.records.get(headword='\U00020000').definition, '')

    def test_oewn_source_entry_groups_senses_and_preserves_form_definition_and_example(self):
        xml = b'''<LexicalResource><Lexicon version="2025" language="en"><LexicalEntry id="foot-n"><Lemma writtenForm="foot" partOfSpeech="n"/><Form writtenForm="feet"/><Sense id="foot-1" synset="s1"/><Sense id="foot-2" synset="s2"/></LexicalEntry><Synset id="s1"><Definition>A body part.</Definition><Definition>Another source wording.</Definition><Example>My foot.</Example></Synset><Synset id="s2"><Definition>A unit.</Definition></Synset></Lexicon></LexicalResource>'''
        with tempfile.TemporaryDirectory() as folder:
            file = Path(folder) / 'data.xml.gz'; file.write_bytes(gzip.compress(xml))
            rows = parse_oewn(file, version='2025', headwords={'feet'})
        release, _ = stage_manifest(manifest(rows), batch_size=1)
        self.assertEqual(LexicalEntry.objects.count(), 1)
        self.assertEqual(Sense.objects.count(), 2)
        self.assertEqual(release.records.get(binding__external_key='foot-1').definition, 'A body part.\n\nAnother source wording.')
        self.assertEqual(EntryForm.objects.filter(text='feet').count(), 2)
        from lexicon.queries import record_order
        records = list(release.records.select_related('release__source', 'binding'))
        # Source order, rather than alphabetical key or UUID, determines previews.
        for record in records:
            record.raw['source_entry']['children'] = [
                {'tag': 'Sense', 'attributes': {'id': 'foot-2'}}, {'tag': 'Sense', 'attributes': {'id': 'foot-1'}}]
        self.assertEqual(sorted(records, key=record_order)[0].binding.external_key, 'foot-2')
        new, _ = stage_manifest(manifest(rows, version='v2'))
        self.assertEqual(set(release.records.values_list('binding__sense_id', flat=True)), set(new.records.values_list('binding__sense_id', flat=True)))
        self.assertEqual(LexicalEntry.objects.count(), 1)

    def test_pinned_download_rejects_changed_file_without_overwrite(self):
        with tempfile.TemporaryDirectory() as folder:
            file = Path(folder) / registry()['unihan']['file']; file.write_bytes(b'changed')
            with self.assertRaises(ImportProblem): verified_file('unihan', file)
            with self.assertRaises(CommandError): call_command('fetch_lexicon', 'unihan', output_dir=Path(folder), stdout=io.StringIO())
            self.assertEqual(file.read_bytes(), b'changed')

    def test_xml_entity_declarations_are_not_processed(self):
        with tempfile.TemporaryDirectory() as folder:
            file = Path(folder) / 'data.gz'; file.write_bytes(gzip.compress(b'<!DOCTYPE x [<!ENTITY bad SYSTEM "file:///etc/passwd">]><x/>'))
            with self.assertRaises(ImportProblem): parse_oewn(file, version='2025', headwords={'x'})

    def test_archived_notices_survive_registry_upgrade_and_detect_file_changes(self):
        spec = registry()['oewn']
        release = SimpleNamespace(source=SimpleNamespace(code=spec['source']['code']),
                                  source_files={spec['file']: {'sha256': spec['sha256']}})
        with patch('lexicon.open_sources.registry', return_value={}):
            self.assertEqual({name for name, _ in release_notices(release)}, set(spec['notices']))
        with patch.object(Path, 'read_bytes', return_value=b'changed license'):
            with self.assertRaises(ImportProblem): release_notices(release)

    def test_group_identity_conflict_fails_before_any_version_is_created(self):
        first = row(entry_key='group-1')
        release, _ = stage_manifest(manifest([first]))
        wrong = row(key='new', word='wrong', entry_key='group-1')
        with self.assertRaises(ImportProblem): stage_manifest(manifest([first, wrong], version='v2'))
        with self.assertRaises(ImportProblem): stage_manifest(manifest([wrong], version='v2'))
        self.assertEqual(release.source.releases.count(), 1)

    def test_public_source_cannot_switch_to_unreviewed_different_license(self):
        first = manifest(); first['source']['data_license'] = 'Synthetic test data'
        release, _ = stage_manifest(first); allow_public(release.source)
        activate_release(release.pk, expected_current='', reason='初始审查')
        second = manifest(version='v2'); second['source']['data_license'] = 'Changed terms'
        replacement, _ = stage_manifest(second)
        with self.assertRaises(ValidationError): activate_release(replacement.pk, expected_current=release.pk, reason='旧依据')

    def test_release_publication_checks_digest_and_keeps_manual_revisions_pending(self):
        data = manifest([row(), row('tree', 'tree', '树')])
        data['source'].update({'url': 'https://example.org/', 'attribution': 'Synthetic', 'data_license': 'Synthetic',
                              'license_url': 'https://example.org/license', 'changes': '测试', 'rights_evidence': '测试'})
        data['source'].pop('public_allowed')
        data['source_files'] = {'test.json': {'sha256': 'a' * 64}}
        release, _ = stage_manifest(data)
        sense = release.records.get(headword='bank').binding.sense
        revise(sense, value='保留人工值', note='独立修订', expected_revision=0)
        spec = {'source': data['source'], 'file': 'test.json', 'sha256': 'a' * 64}
        with patch('lexicon.management.commands.publish_lexicon.registry', return_value={'test': spec}):
            with self.assertRaises(CommandError):
                call_command('publish_lexicon', str(release.pk), expected_checksum='bad', expected_current='none', reason='测试', stdout=io.StringIO())
            call_command('publish_lexicon', str(release.pk), expected_checksum=release.checksum, expected_current='none', reason='测试版本审查', stdout=io.StringIO())
        sense.refresh_from_db(); release.source.refresh_from_db()
        self.assertEqual(sense.status, 'draft')
        self.assertEqual(sense.editorial_definition, '保留人工值')
        self.assertTrue(release.source.public_allowed)
        self.assertEqual(self.client.get('/api/v1/lexicon/').json()['total'], 1)
        self.assertTrue(LexiconAudit.objects.filter(action='review_release').exists())


class DictionaryPageTests(TestCase):
    def setUp(self):
        rows = [row(entry_key='bank-n'), row('river-bank', meaning='The river bank.', entry_key='bank-n')]
        self.release, _ = stage_manifest(manifest(rows))
        self.source = self.release.source
        allow_public(self.source)
        activate_release(self.release.pk, expected_current='', reason='测试公开')
        review_objects(LexicalEntry.objects.all(), publish=True)
        review_objects(Sense.objects.all(), publish=True)
        review_objects(Pronunciation.objects.all(), publish=True)
        self.entry = LexicalEntry.objects.get()

    def test_search_detail_and_sources_render_without_login(self):
        response = self.client.get('/dictionary/?q=bank&scope=english')
        self.assertContains(response, 'bank')
        self.assertContains(response, f'/dictionary/{self.entry.pk}/')
        detail = self.client.get(f'/dictionary/{self.entry.pk}/')
        self.assertContains(detail, 'The river bank.')
        self.assertContains(detail, '银行')
        self.assertContains(self.client.get('/dictionary/sources/'), self.source.attribution)
        self.assertIn('no-store', detail.headers['Cache-Control'])

    def test_private_data_never_appears_in_pages_and_withdrawal_is_immediate(self):
        stage_manifest(manifest([row('secret', 'bank-secret', '<script>private-secret</script>')], source='private'))
        self.assertNotContains(self.client.get('/dictionary/?q=bank'), 'private-secret')
        self.source.enabled = False; self.source.save(update_fields=['enabled'])
        self.assertEqual(self.client.get(f'/dictionary/{self.entry.pk}/').status_code, 404)
        self.assertNotContains(self.client.get('/dictionary/?q=bank'), f'/dictionary/{self.entry.pk}/')
        self.assertNotContains(self.client.get('/dictionary/sources/'), self.source.attribution)

    def test_source_page_and_api_keep_the_active_release_metadata(self):
        data = manifest(source='snapshot-source')
        data['source'].update(attribution='Original contributor', data_license='Original license',
                              url='https://example.org/old', changes='Original scope')
        release, _ = stage_manifest(data)
        allow_public(release.source)
        release.source.attribution = 'Later contributor'
        release.source.data_license = 'Original license'
        release.source.changes = 'Later scope'
        release.source.save()
        activate_release(release.pk, expected_current='', reason='测试快照')
        review_objects(LexicalEntry.objects.all(), publish=True)
        review_objects(Sense.objects.all(), publish=True)
        response = self.client.get('/dictionary/sources/')
        self.assertContains(response, 'Original contributor')
        self.assertContains(response, 'Original scope')
        self.assertNotContains(response, 'Later contributor')
        entry = release.records.first().binding.sense.entry
        payload = self.client.get(f'/api/v1/lexicon/{entry.pk}/').json()
        self.assertEqual(payload['definitions'][0]['source']['attribution'], 'Original contributor')

    def test_invalid_input_and_empty_results(self):
        self.assertEqual(self.client.get('/dictionary/', {'q': 'a' * 201}).status_code, 400)
        self.assertEqual(self.client.get('/dictionary/?scope=private').status_code, 400)
        self.assertEqual(self.client.get('/api/v1/lexicon/', {'q': '\x00'}).status_code, 400)
        self.assertEqual(self.client.get('/dictionary/?q=U%2B0000').status_code, 200)
        self.assertContains(self.client.get('/dictionary/?q=never-match'), '暂时没有找到')
        self.assertNotContains(self.client.get('/dictionary/', {'q': '<script>alert(1)</script>'}), '<script>alert(1)</script>')

    def test_character_attribute_only_pinyin_and_codepoint_lookup(self):
        character = row('U+5B66', '学', '', 'xué', language='zh', kind='character', pronunciation={'value': 'xué', 'system': 'pinyin', 'region': 'CN'})
        char_release, _ = stage_manifest(manifest([character], source='characters'))
        allow_public(char_release.source); activate_release(char_release.pk, expected_current='', reason='字形资料')
        review_objects(LexicalEntry.objects.all(), publish=True); review_objects(Sense.objects.all(), publish=True)
        review_objects(Pronunciation.objects.all(), publish=True)
        for query in ['学', 'xue', 'xué', 'U+5B66']:
            response = self.client.get('/dictionary/', {'q': query, 'scope': 'character'})
            self.assertContains(response, '学')
            self.assertEqual(response.context['page'].paginator.count, 1)
        from lexicon.models import pinyin_key
        self.assertEqual(pinyin_key('lǜ'), pinyin_key('lü'))
        self.assertEqual(pinyin_key('lǜ'), 'lv')

    def test_reading_properties_obey_the_same_review_gate(self):
        record = self.release.records.first()
        # Simulates structured auxiliary readings; no public bypass through properties.
        type(record).objects.filter(pk=record.pk).update(properties={'readings': [{'value': 'secret-reading'}]})
        record.binding.pronunciation.is_reviewed = False
        record.binding.pronunciation.save()
        self.assertNotContains(self.client.get(f'/dictionary/{self.entry.pk}/'), 'secret-reading')

    def test_page_and_api_rank_exact_match_before_prefix(self):
        second, _ = stage_manifest(manifest([row('banker', 'banker', 'person')], source='second'))
        allow_public(second.source); activate_release(second.pk, expected_current='', reason='测试')
        review_objects(LexicalEntry.objects.all(), publish=True); review_objects(Sense.objects.all(), publish=True)
        self.assertEqual(self.client.get('/api/v1/lexicon/?q=bank').json()['results'][0]['headword'], 'bank')
        self.assertEqual(self.client.get('/dictionary/?q=bank').context['cards'][0]['entry'].headword, 'bank')

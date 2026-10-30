import io
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.test import TestCase
from catalog.models import Collection, ContentItem, Module, Placement, Unit
from learning.models import Progress
from lexicon.adapters import primary_manifest
from lexicon.importing import stage_manifest
from lexicon.models import ContentEntryLink, EntryMatch, LexicalEntry, LexiconSource, Sense
from lexicon.services import activate_release, build_matches, link_primary_records, link_state, merge_match, review_objects, revise
from .helpers import manifest, row, allow_public


class PublicationTests(TestCase):
    def setUp(self):
        self.release, _ = stage_manifest(manifest())
        self.source = self.release.source
        self.record = self.release.records.select_related('binding__sense__entry', 'binding__pronunciation').get()
        self.sense, self.entry = self.record.binding.sense, self.record.binding.sense.entry

    def publish(self):
        allow_public(self.source)
        activate_release(self.release.pk, expected_current='', reason='测试审查')
        review_objects(LexicalEntry.objects.all(), publish=True)
        review_objects(Sense.objects.all(), publish=True)

    def test_all_three_publication_gates_are_required(self):
        path = f'/api/v1/lexicon/{self.entry.pk}/'
        self.assertEqual(self.client.get('/api/v1/lexicon/').json()['total'], 0)
        review_objects(LexicalEntry.objects.all(), publish=True)
        review_objects(Sense.objects.all(), publish=True)
        self.assertEqual(self.client.get(path).status_code, 404)
        activate_release(self.release.pk, expected_current='', reason='内部启用')
        self.assertEqual(self.client.get(path).status_code, 404)
        allow_public(self.source)
        response = self.client.get(path)
        self.assertEqual(response.status_code, 200)
        value = response.json()['definitions'][0]
        self.assertEqual(value['definition'], '银行')
        self.assertIsNone(value['pronunciation'])
        self.assertNotIn('raw', value)
        self.assertIn('no-store', response.headers['Cache-Control'])

    def test_source_revocation_hides_detail_search_and_reading_immediately(self):
        self.publish()
        self.assertEqual(self.client.get('/api/v1/lexicon/?q=ban').json()['total'], 1)
        for field in ['enabled', 'public_allowed']:
            self.source.refresh_from_db()
            setattr(self.source, field, False)
            self.source.save(update_fields=[field])
            self.assertEqual(self.client.get('/api/v1/lexicon/?q=ban').json()['total'], 0)
            self.assertEqual(self.client.get(f'/api/v1/lexicon/{self.entry.pk}/').status_code, 404)
            setattr(self.source, field, True)
            self.source.save(update_fields=[field])

    def test_unreviewed_reading_is_not_public_and_revision_requires_review(self):
        self.publish()
        pronunciation = self.record.binding.pronunciation
        from lexicon.models import Pronunciation
        review_objects(Pronunciation.objects.all(), publish=True)
        path = f'/api/v1/lexicon/{self.entry.pk}/'
        self.assertEqual(self.client.get(path).json()['definitions'][0]['pronunciation']['value'], '/bæŋk/')
        revise(pronunciation, value='/test/', note='测试修订', expected_revision=0)
        self.assertIsNone(self.client.get(path).json()['definitions'][0]['pronunciation'])
        revise(self.sense, value='新修订', note='释义修订', expected_revision=0)
        self.assertEqual(self.client.get(path).status_code, 404)

    def test_activation_cas_rejects_stale_review_and_incomplete_release(self):
        second, _ = stage_manifest(manifest([row(meaning='新版说明')], version='v2'))
        activate_release(self.release.pk, expected_current='', reason='第一次审核')
        with self.assertRaises(ValidationError):
            activate_release(second.pk, expected_current='', reason='过时的确认页面')
        second.status = 'failed'
        second.save(update_fields=['status'])
        with self.assertRaises(ValidationError):
            activate_release(second.pk, expected_current=self.release.pk, reason='不完整版本')

    def test_replacement_source_and_rollback_do_not_erase_edits(self):
        self.publish()
        second, _ = stage_manifest(manifest([row(meaning='经审查的替代来源', target_sense=str(self.sense.pk))], source='replacement'))
        allow_public(second.source)
        activate_release(second.pk, expected_current='', reason='采用新来源')
        self.source.enabled = False
        self.source.save(update_fields=['enabled'])
        values = self.client.get(f'/api/v1/lexicon/{self.entry.pk}/').json()['definitions']
        self.assertEqual(len(values), 1)
        self.assertEqual(values[0]['source']['code'], 'replacement')

    def test_source_public_approval_requires_evidence(self):
        self.source.public_allowed = True
        with self.assertRaises(ValidationError):
            self.source.full_clean()

    def test_merged_uuid_redirects_only_while_destination_is_public(self):
        other, _ = stage_manifest(manifest([row(meaning='河岸')], source='river-source'))
        build_matches()
        candidate = EntryMatch.objects.get()
        self.publish()
        merge_match(candidate.pk, reason='保留词头的两个不同义项')
        allow_public(other.source)
        activate_release(other.pk, expected_current='', reason='测试来源')
        old_url = f'/api/v1/lexicon/{candidate.right_id}/'
        response = self.client.get(old_url)
        self.assertRedirects(response, f'/api/v1/lexicon/{candidate.left_id}/')
        self.assertIn('no-store', response.headers['Cache-Control'])
        LexiconSource.objects.update(enabled=False)
        self.assertEqual(self.client.get(old_url).status_code, 404)


class ExistingContentTests(TestCase):
    def setUp(self):
        call_command('seed_platform', stdout=io.StringIO())
        module = Module.objects.get(code='words')
        collection = Collection.objects.create(code='test-words', name='词卡测试', module=module, is_published=True)
        unit = Unit.objects.create(collection=collection, code='u1', title='测试单元')
        self.content = ContentItem.objects.create(module=module, kind='word', title='bank', summary='人工教学简释',
            sections=[{'title': '音标', 'text': '/bæŋk/'}], source_key='primary:words:u1:bank',
            source_payload={'en': 'bank', 'zh': '原教学释义', 'ipa': '/old/'}, source_hash='a' * 64,
            source_file='primary/words-data.js', status='published', import_locked=True)
        Placement.objects.create(unit=unit, item=self.content)
        self.user = get_user_model().objects.create_user('learner')
        self.progress = Progress.objects.create(user=self.user, item=self.content, status='mastered', note='我的笔记', revision=3)

    def test_existing_manual_content_and_progress_remain_identical(self):
        before = ContentItem.objects.values().get(pk=self.content.pk)
        progress = Progress.objects.values().get(pk=self.progress.pk)
        release, _ = stage_manifest(primary_manifest('words'), exact_reuse=True)
        result = link_primary_records(release)
        self.assertEqual(result['created'], 1)
        self.assertEqual(link_primary_records(release)['preserved'], 1)
        self.assertEqual(ContentItem.objects.values().get(pk=self.content.pk), before)
        self.assertEqual(Progress.objects.values().get(pk=self.progress.pk), progress)
        record = release.records.get()
        self.assertEqual(record.definition, '人工教学简释')
        self.assertEqual(record.pronunciation_value, '/bæŋk/')
        self.assertEqual(record.raw['source_payload']['zh'], '原教学释义')

    def test_version_change_does_not_silently_retarget_teaching_meaning(self):
        release, _ = stage_manifest(primary_manifest('words'), exact_reuse=True)
        link_primary_records(release)
        link = ContentEntryLink.objects.get()
        allow_public(release.source)
        activate_release(release.pk, expected_current='', reason='测试来源')
        review_objects(LexicalEntry.objects.all(), publish=True)
        review_objects(Sense.objects.all(), publish=True)
        url = f'/api/v1/items/{self.content.pk}/lexicon/'
        self.assertEqual(len(self.client.get(url).json()['links']), 1)
        self.content.summary = '修改后的教学解释'
        self.content.save()
        new, _ = stage_manifest(primary_manifest('words'), exact_reuse=True)
        link_primary_records(new)
        self.assertEqual(ContentEntryLink.objects.get().evidence_id, link.evidence_id)
        activate_release(new.pk, expected_current=release.pk, reason='更新来源')
        link.refresh_from_db()
        self.assertIn('需复核', link_state(link))
        self.assertEqual(self.client.get(url).json()['links'], [])

    def test_private_sources_and_draft_cards_have_no_public_link_leak(self):
        release, _ = stage_manifest(primary_manifest('words'))
        link_primary_records(release)
        url = f'/api/v1/items/{self.content.pk}/lexicon/'
        self.assertEqual(self.client.get(url).json()['links'], [])
        self.content.status = 'draft'
        self.content.save(update_fields=['status'])
        self.assertEqual(self.client.get(url).status_code, 404)

from unittest.mock import patch
from uuid import UUID

from django.conf import settings
from django.contrib.sessions.models import Session
from django.db import connection
from django.test import SimpleTestCase, TestCase
from django.test.utils import CaptureQueriesContext
from django.urls import reverse

from lexicon.models import LexicalEntry, LexiconSource, Pronunciation, Sense, SourceBinding, SourceRecord, SourceRelease, editorial_values

from .catalog import SOURCE_CODE, load_curriculum


class CurriculumTests(SimpleTestCase):
    def test_manifest_has_unique_identities_and_resolvable_scene_items(self):
        curriculum = load_curriculum()
        groups = {group['code'] for group in curriculum['groups']}
        pins = {pin['id']: pin for pin in curriculum['idioms']}
        scenes = curriculum['scenes']
        self.assertEqual(len(groups), len(curriculum['groups']))
        self.assertEqual(len(pins), len(curriculum['idioms']))
        self.assertEqual(len({scene['code'] for scene in scenes}), len(scenes))
        referenced = set()
        for pin in pins.values():
            self.assertEqual(pin['id'], pin['binding_id'])
            self.assertEqual(pin['source_code'], SOURCE_CODE)
            for key in ('entry_id', 'sense_id', 'binding_id', 'evidence_id', 'pronunciation_id'):
                if key != 'pronunciation_id' or pin[key] is not None:
                    self.assertEqual(str(UUID(pin[key])), pin[key])
        for scene in scenes:
            self.assertIn(scene['group'], groups)
            ids = [item['idiom_id'] for item in scene['items']]
            self.assertTrue(ids)
            self.assertEqual(len(ids), len(set(ids)))
            referenced.update(ids)
            for item in scene['items']:
                self.assertIn(pins[item['idiom_id']]['headword'], item['example'])
                self.assertTrue(item['note'])
        self.assertEqual(referenced, set(pins))


class IdiomPageTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.source = LexiconSource.objects.create(code=SOURCE_CODE, name='成语测试来源', url='javascript:alert(1)')
        cls.release = SourceRelease.objects.create(source=cls.source, version='v1', status=SourceRelease.Status.READY)
        LexiconSource.objects.filter(pk=cls.source.pk).update(active_release=cls.release)
        cls.binding = cls.make_binding('兴高采烈', '开心词条')
        cls.record = cls.make_record(cls.release, cls.binding, definition='兴致很高', lexical_hash='first')
        pin = {
            'id': str(cls.binding.pk),
            'entry_id': str(cls.binding.sense.entry_id),
            'sense_id': str(cls.binding.sense_id),
            'binding_id': str(cls.binding.pk),
            'pronunciation_id': str(cls.binding.pronunciation_id),
            'evidence_id': str(cls.record.pk),
            'headword': cls.binding.sense.entry.headword,
            'source_code': SOURCE_CODE,
            'source_key': cls.binding.external_key,
            'source_version': cls.release.version,
            'lexical_hash': cls.record.lexical_hash,
            'editorial_snapshot': editorial_values(cls.binding.sense, cls.binding.pronunciation),
        }
        cls.curriculum = {
            'schema_version': 1, 'source_code': SOURCE_CODE, 'version': 'test-scenes',
            'groups': [{'code': 'mood', 'title': '心情变化', 'icon': 'heart'}],
            'idioms': [pin],
            'scenes': [{
                'code': code, 'group': 'mood', 'title': title, 'description': '讲讲高兴的事。',
                'prompt': '想起一个好消息。', 'items': [{
                    'idiom_id': pin['id'], 'example': '同学们兴高采烈地去春游。', 'note': '适合写兴致很高。',
                }],
            } for code, title in [('happy', '开心时刻'), ('friends', '同伴相处')]],
        }
        cls.scene_url = reverse('idiom-scene', args=['happy'])
        cls.entry_url = reverse('idiom-entry', args=[cls.binding.sense.entry_id])

    @classmethod
    def make_binding(cls, word, key):
        entry = LexicalEntry.objects.create(language='zh', kind='idiom', headword=word)
        sense = Sense.objects.create(entry=entry)
        pronunciation = Pronunciation.objects.create(entry=entry, system='pinyin')
        return SourceBinding.objects.create(source=cls.source, sense=sense, pronunciation=pronunciation, external_key=key)

    @staticmethod
    def make_record(release, binding, definition, lexical_hash, **fields):
        return SourceRecord.objects.create(
            release=release, binding=binding, headword=binding.sense.entry.headword,
            definition=definition, lexical_hash=lexical_hash, **{
                'pronunciation_value': 'xìng gāo cǎi liè',
                'properties': {'example': '词典例句', 'derivation': '词典出处文本'},
                **fields,
            },
        )

    def setUp(self):
        curriculum = patch('idioms.views.load_curriculum', return_value=self.curriculum)
        curriculum.start()
        self.addCleanup(curriculum.stop)

    def activate(self, version):
        release = SourceRelease.objects.create(source=self.source, version=version, status=SourceRelease.Status.READY)
        LexiconSource.objects.filter(pk=self.source.pk).update(active_release=release)
        return release

    def assert_paused(self):
        response = self.client.get(self.scene_url)
        self.assertContains(response, '场景词卡待核对')
        self.assertNotContains(response, '同学们兴高采烈地去春游。')

    def test_internal_source_and_multiple_scene_links(self):
        self.assertFalse(self.source.public_allowed)
        self.assertEqual(self.binding.sense.status, LexicalEntry.Status.DRAFT)
        self.assertContains(self.client.get(self.scene_url), '同学们兴高采烈地去春游。')
        response = self.client.get(self.entry_url)
        for text in ('开心时刻', '同伴相处', '成语测试来源', '词典出处文本', '词典例句', '词典拼音'):
            self.assertContains(response, text)
        for code in ('happy', 'friends'):
            scene_url = reverse('idiom-scenes') + f'?scene={code}'
            self.assertContains(response, f'{scene_url}#word-{self.binding.pk}')
        self.assertNotContains(response, '已核对读音')
        self.assertNotContains(response, 'javascript:')
        self.assertEqual(self.client.get(reverse('dictionary-entry', args=[self.binding.sense.entry_id])).status_code, 404)

    def test_topic_shows_current_scene_cards_without_an_entry_click(self):
        index = reverse('idiom-scenes')
        first = self.client.get(index)
        self.assertContains(first, '同学们兴高采烈地去春游。')
        self.assertContains(first, '兴致很高')
        self.assertContains(first, '?scene=friends#idiom-practice')
        second = self.client.get(index, {'scene': 'friends'})
        self.assertEqual(second.context['scene']['code'], 'friends')
        self.assertContains(second, '同学们兴高采烈地去春游。')
        self.assertEqual(self.client.get(index, {'scene': 'unknown'}).status_code, 404)

    def test_active_release_uses_current_record_and_suspends_changed_meaning(self):
        refreshed = self.activate('v2')
        self.make_record(refreshed, self.binding, '兴致很高', 'first', properties={'example': '新版原例句'})
        self.assertContains(self.client.get(self.scene_url), '新版原例句')
        self.assertNotContains(self.client.get(self.entry_url), '词典出处文本')

        changed = self.activate('v3')
        self.make_record(changed, self.binding, '新版不同释义', 'changed')
        self.assert_paused()
        response = self.client.get(self.entry_url)
        self.assertContains(response, '新版不同释义')
        self.assertNotContains(response, '在哪些场景能用？')

    def test_source_disabled_or_release_not_ready(self):
        for kind in ('disabled', 'unready'):
            with self.subTest(kind=kind):
                LexiconSource.objects.filter(pk=self.source.pk).update(enabled=(kind != 'disabled'))
                SourceRelease.objects.filter(pk=self.release.pk).update(
                    status=SourceRelease.Status.FAILED if kind == 'unready' else SourceRelease.Status.READY,
                )
                self.assert_paused()
                self.assertEqual(self.client.get(self.entry_url).status_code, 404)
                empty = self.client.get(reverse('idiom-scenes'), {'q': '兴高采烈'})
                self.assertContains(empty, '共找到 0 个词条')
                self.assertContains(empty, '暂时没有找到匹配的词条')

    def test_editorial_snapshots_guard_definition_and_reading(self):
        Pronunciation.objects.filter(pk=self.binding.pronunciation_id).update(
            editorial_value='xìng gāo cǎi liè', revision=1, is_reviewed=True,
        )
        self.assert_paused()
        self.assertContains(self.client.get(self.entry_url), '已核对读音')

        Pronunciation.objects.filter(pk=self.binding.pronunciation_id).update(editorial_value='', revision=0)
        Sense.objects.filter(pk=self.binding.sense_id).update(editorial_definition='<b>新的义项</b>', revision=1)
        self.assert_paused()
        response = self.client.get(self.entry_url)
        self.assertContains(response, '&lt;b&gt;新的义项&lt;/b&gt;')
        self.assertNotContains(response, '<b>新的义项</b>')

    def test_archived_or_merged_records_do_not_rebind_by_headword(self):
        other = self.make_binding('兴高采烈', '另一条义项')
        self.make_record(self.release, other, '同形的另一条义项', 'first')
        for status in (LexicalEntry.Status.ARCHIVED, LexicalEntry.Status.MERGED):
            with self.subTest(status=status):
                LexicalEntry.objects.filter(pk=self.binding.sense.entry_id).update(
                    status=status, merged_into_id=other.sense.entry_id if status == 'merged' else None,
                )
                self.assert_paused()
                self.assertEqual(self.client.get(self.entry_url).status_code, 404)
        LexicalEntry.objects.filter(pk=self.binding.sense.entry_id).update(status='draft', merged_into=None)
        Sense.objects.filter(pk=self.binding.sense_id).update(status='archived')
        self.assert_paused()
        self.assertEqual(self.client.get(self.entry_url).status_code, 404)
        self.assertContains(self.client.get(reverse('idiom-entry', args=[other.sense.entry_id])), '同形的另一条义项')

    def test_invalid_reading_identity_is_excluded(self):
        other = self.make_binding('兴致勃勃', '其他词条')
        SourceBinding.objects.filter(pk=self.binding.pk).update(pronunciation=other.pronunciation)
        self.assert_paused()
        self.assertEqual(self.client.get(self.entry_url).status_code, 404)

    def test_search_uses_full_dictionary_and_paginates_unique_entries(self):
        words = ['成语样本'] + [f'成语样本{i:02}' for i in range(25)]
        for word in words:
            binding = self.make_binding(word, word)
            self.make_record(self.release, binding, '不在场景清单里', word)
        index = reverse('idiom-scenes')
        first = self.client.get(index, {'q': '成语样本'}).context['page']
        second = self.client.get(index, {'q': '成语样本', 'page': '2'}).context['page']
        self.assertEqual(first.paginator.count, 26)
        self.assertEqual(len(first.object_list), 24)
        self.assertEqual(first.object_list[0].headword, '成语样本')
        self.assertEqual(len(second.object_list), 2)
        self.assertTrue(set(first.object_list).isdisjoint(second.object_list))
        self.assertIsNone(self.client.get(index).context['page'])
        self.assertEqual(self.client.get(index, {'q': '字' * 101}).status_code, 400)

    def test_get_routes_only_read(self):
        index = reverse('idiom-scenes')
        routes = (index, index + '?q=兴', self.scene_url, self.entry_url)
        with CaptureQueriesContext(connection) as queries:
            for route in routes:
                response = self.client.get(route)
                self.assertEqual(response.status_code, 200)
                self.assertNotIn(settings.SESSION_COOKIE_NAME, response.cookies)
        self.assertTrue(all(query['sql'].lstrip().upper().startswith('SELECT') for query in queries))
        self.assertFalse(Session.objects.exists())
        self.assertEqual(self.client.post(self.scene_url).status_code, 405)

from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase, TestCase

from lexicon.models import LexicalEntry, LexiconSource, Pronunciation, Sense, SourceBinding, SourceRecord, \
    SourceRelease

from .catalog import EXAMPLE_SOURCES, PHONEME_COUNT, example_index, grouped_phonemes, load_curriculum, \
    phoneme_cards, pronunciation_theory, validate

AUDIO_DIR = Path(__file__).resolve().parent.parent / 'static' / 'phonetics' / 'audio'


class CurriculumDataTests(SimpleTestCase):
    """数据契约：44 音素、分组引用、音标格式、例词齐备且与自身音标一致。"""

    def setUp(self):
        self.curriculum = load_curriculum()

    def test_schema_and_source(self):
        self.assertEqual(self.curriculum['schema_version'], 1)
        self.assertEqual(self.curriculum['source_code'], 'primary-phonetics')

    def test_forty_four_unique_phonemes(self):
        phonemes = self.curriculum['phonemes']
        self.assertEqual(len(phonemes), PHONEME_COUNT)
        symbols = [p['symbol'] for p in phonemes]
        self.assertEqual(len(set(symbols)), PHONEME_COUNT)
        for symbol in symbols:
            self.assertTrue(symbol.startswith('/') and symbol.endswith('/'))

    def test_groups_and_examples_complete(self):
        groups = {g['code'] for g in self.curriculum['groups']}
        for phoneme in self.curriculum['phonemes']:
            self.assertIn(phoneme['group'], groups)
            self.assertTrue(phoneme['tip'].strip())
            self.assertTrue(phoneme['spellings'])
            self.assertTrue(phoneme['examples'])
            for example in phoneme['examples']:
                self.assertTrue(example['ipa'].startswith('/') and example['ipa'].endswith('/'))
                self.assertTrue(example['en'].strip())
                if not example['extended']:
                    # 非拓展例词必须真实包含本音素（纯数据自洽，不依赖词库）。
                    self.assertIn(phoneme['symbol'].strip('/'), example['ipa'].strip('/'),
                                  f"{phoneme['symbol']} 例词 {example['en']} 不含目标音素")

    def test_validate_rejects_drift(self):
        bad = {'schema_version': 2, 'source_code': 'primary-phonetics', 'groups': [], 'phonemes': []}
        with self.assertRaises(ImproperlyConfigured):
            validate(bad)
        curriculum = load_curriculum()
        curriculum['phonemes'][0]['symbol'] = curriculum['phonemes'][1]['symbol']
        with self.assertRaises(ImproperlyConfigured):
            validate(curriculum)


class PhonemeAudioTests(SimpleTestCase):
    """每个音素都要有预生成的原声文件（scripts/generate_phoneme_audio.py 产物）。"""

    def test_every_phoneme_has_audio_asset(self):
        missing = [p['id'] for p in load_curriculum()['phonemes']
                   if not (AUDIO_DIR / f"{p['id']}.m4a").is_file()]
        self.assertEqual(missing, [], f'缺少音素音频：{missing}')


class TheoryDataTests(SimpleTestCase):
    def test_lessons_have_practice_and_reuse_existing_sounds(self):
        phonemes = load_curriculum()['phonemes']
        theory = pronunciation_theory([{'phonemes': phonemes}])
        lessons = theory['lessons']
        self.assertEqual(len(lessons), 6)
        self.assertEqual(len({lesson['id'] for lesson in lessons}), len(lessons))
        for lesson in lessons:
            with self.subTest(lesson=lesson['id']):
                for field in ('title', 'explanation', 'practice'):
                    self.assertTrue(lesson[field].strip())
                self.assertTrue(lesson['sounds'])
                self.assertTrue(lesson['examples'])
                for sound in lesson['sounds']:
                    self.assertIn(sound, phonemes)
                for example in lesson['examples']:
                    self.assertRegex(example['ipa'], r'^/[^/]+/$')
                    self.assertTrue(example['word'].strip() and example['meaning'].strip())
        self.assertTrue(theory['sources'])
        self.assertTrue(all(source['url'].startswith('https://') for source in theory['sources']))


class ExampleResolutionTests(TestCase):
    """例词回查词库：用夹具验证解析与降级（测试库不含基线数据）。"""

    @classmethod
    def setUpTestData(cls):
        cls.source = LexiconSource.objects.create(code=EXAMPLE_SOURCES[0], name='场景单词测试', url='x-test:')
        cls.release = SourceRelease.objects.create(source=cls.source, version='v1', status=SourceRelease.Status.READY)
        LexiconSource.objects.filter(pk=cls.source.pk).update(active_release=cls.release)
        entry = LexicalEntry.objects.create(language='en', kind='word', headword='ship')
        sense = Sense.objects.create(entry=entry)
        pronunciation = Pronunciation.objects.create(entry=entry, system='ipa', editorial_value='/ʃɪp/')
        binding = SourceBinding.objects.create(source=cls.source, sense=sense, pronunciation=pronunciation,
                                               external_key='test:ship')
        cls.record = SourceRecord.objects.create(release=cls.release, binding=binding, headword='ship',
                                                 definition='n. 船', lexical_hash='first',
                                                 pronunciation_value='/ʃɪp/')

    def test_resolved_example_carries_lexicon_reading_and_source(self):
        cards = phoneme_cards(load_curriculum())
        ship = next(example for card in cards for example in card['examples'] if example['en'] == 'ship')
        self.assertTrue(ship['resolved'])
        self.assertEqual(ship['reading'], '/ʃɪp/')
        self.assertEqual(ship['source_name'], self.source.name)

    def test_unresolved_examples_degrade_to_extended(self):
        cards = phoneme_cards(load_curriculum())
        # 测试库没有其余基线数据：除夹具 ship 外全部应降级为拓展例词。
        others = [e for card in cards for e in card['examples'] if e['en'] != 'ship']
        self.assertTrue(others)
        self.assertTrue(all(not e['resolved'] for e in others))

    def test_index_skips_empty_readings(self):
        entry = LexicalEntry.objects.create(language='en', kind='word', headword='ghost')
        sense = Sense.objects.create(entry=entry)
        binding = SourceBinding.objects.create(source=self.source, sense=sense,
                                               pronunciation=Pronunciation.objects.create(
                                                   entry=entry, system='ipa'), external_key='test:ghost')
        SourceRecord.objects.create(release=self.release, binding=binding, headword='ghost',
                                    definition='', lexical_hash='ghost', pronunciation_value='')
        self.assertNotIn(('ghost', ''), example_index())

    def test_grouped_phonemes_covers_all_cards(self):
        groups = grouped_phonemes()
        self.assertEqual(sum(len(g['phonemes']) for g in groups), PHONEME_COUNT)
        self.assertEqual([g['code'] for g in groups],
                         [g['code'] for g in load_curriculum()['groups']])
        for group in groups:
            for card in group['phonemes']:
                self.assertTrue(card['key_word'].strip())


class PhoneticsPageTests(TestCase):
    def test_theory_tab_renders_practice_with_existing_audio(self):
        response = self.client.get('/phonetics/')
        self.assertContains(response, 'href="#group-theory"', count=1)
        self.assertContains(response, 'id="group-theory"', count=1)
        self.assertContains(response, 'class="ph-theory-card"', count=6)
        self.assertContains(response, 'data-say="banana"')
        self.assertContains(response, 'data-audio="/static/phonetics/audio/07-schwa.m4a"')
        self.assertContains(response, '/bəˈnɑː.nə/')

    def test_index_renders_all_groups(self):
        response = self.client.get('/phonetics/')
        self.assertEqual(response.status_code, 200)
        for symbol in ('/iː/', '/æ/', '/eɪ/', '/θ/', '/ŋ/'):
            self.assertContains(response, symbol)
        self.assertContains(response, '连读本组')
        self.assertContains(response, '拓展例词')  # 测试库无基线数据，例词降级为虚线拓展词卡（悬停提示注明来源待核对）

    def test_symbol_buttons_play_phoneme_audio_with_fallback(self):
        response = self.client.get('/phonetics/')
        self.assertContains(response, 'data-audio=')
        self.assertContains(response, 'data-fallback=')

    def test_index_is_read_only(self):
        before = SourceRecord.objects.count()
        response = self.client.get('/phonetics/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(SourceRecord.objects.count(), before)

import io
import json

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import Client, TestCase
from django.utils.crypto import get_random_string

from lexicon.importing import stage_manifest
from lexicon.services import activate_release
from lexicon.tests.helpers import row

from .models import LearningTarget, Scenario, ScenarioWord, WordProgress


def word_row(en, ipa, zh):
    return row(en, word=en, meaning=zh, reading=ipa, language='en',
               pronunciation={'value': ipa, 'system': 'ipa', 'region': ''},
               raw={'en': en, 'ipa': ipa, 'zh': zh},
               field_paths={'headword': '/en', 'definition': '/zh', 'pronunciation': '/ipa'})


class ScenarioImportTests(TestCase):
    """场景导入：46 场景 577 词位全部挂接词典词条，幂等。"""

    @classmethod
    def setUpTestData(cls):
        call_command_cls = __import__('django.core.management', fromlist=['call_command']).call_command
        call_command_cls('seed_platform', stdout=io.StringIO())
        cls.release, _ = stage_manifest({
            'schema_version': 1,
            'source': {'code': 'primary-words', 'name': '现有场景英语词卡（场景单词全量）'},
            'version': 'scenario-test', 'adapter': 'test-v1',
            'records': [
                word_row('dance', '/dɑːns/', 'v. 跳舞'), word_row('sing', '/sɪŋ/', 'v. 唱歌'),
                word_row('classroom', '/ˈklɑːsruːm/', 'n. 教室'),
            ],
        })
        activate_release(cls.release.pk, expected_current='', reason='测试启用场景词源')

    def test_import_creates_scenarios_words_and_links_entries(self):
        snapshot = {'schema_version': 1, 'sha256': 'a' * 64, 'units': [
            {'id': 'u-actions', 'name': 'Action Words', 'zh': '动作', 'emoji': '🏃', 'color': '#f15bb5', 'words': [
                {'en': 'dance', 'ipa': '/dɑːns/', 'zh': 'v. 跳舞', 'emoji': '💃',
                 'parts': [{'t': 'dan', 'd': '/dɑːn/'}, {'t': 'ce', 'd': 'ce 读 /s/'}],
                 'memo': 'ce 结尾读 /s/。', 'related': ['sing', 'June']},
                {'en': 'sing', 'ipa': '/sɪŋ/', 'zh': 'v. 唱歌', 'emoji': '🎤', 'parts': [], 'memo': '', 'related': []},
            ]},
            {'id': 'u-classroom', 'name': 'My Classroom', 'zh': '教室', 'emoji': '🏫', 'color': '#4d96ff', 'words': [
                {'en': 'classroom', 'ipa': '/ˈklɑːsruːm/', 'zh': 'n. 教室', 'emoji': '🏫', 'parts': [], 'memo': '', 'related': []},
            ]},
        ]}
        import json as jsonlib
        from pathlib import Path
        import tempfile
        with tempfile.TemporaryDirectory() as temp:
            file = Path(temp) / 'words.json'
            file.write_text(jsonlib.dumps(snapshot), encoding='utf-8')
            from django.core.management import call_command
            out = io.StringIO()
            call_command('import_scenarios', '--input', str(file), stdout=out)
            stats = json.loads(out.getvalue())
        self.assertEqual(stats['scenarios'], 2)
        self.assertEqual(stats['scenario_words'], 3)
        self.assertEqual(stats['unmatched_no_entry'], 0)
        self.assertEqual(Scenario.objects.count(), 2)
        self.assertEqual(ScenarioWord.objects.count(), 3)
        word = ScenarioWord.objects.get(en='dance')
        self.assertEqual(word.entry.headword, 'dance')
        self.assertEqual(word.scenario.zh, '动作')
        # 幂等重跑：不新建、不丢挂接。
        with tempfile.TemporaryDirectory() as temp:
            file = Path(temp) / 'words.json'
            file.write_text(jsonlib.dumps(snapshot), encoding='utf-8')
            from django.core.management import call_command
            out = io.StringIO()
            call_command('import_scenarios', '--input', str(file), stdout=out)
            stats = json.loads(out.getvalue())
        self.assertEqual(stats['scenario_words'], 3)
        self.assertEqual(Scenario.objects.count(), 2)

    def test_word_without_dictionary_entry_is_skipped(self):
        snapshot = {'schema_version': 1, 'sha256': 'b' * 64, 'units': [
            {'id': 'u-x', 'name': 'X', 'zh': '未知', 'emoji': '', 'color': '#fff', 'words': [
                {'en': 'nonexistent-word', 'ipa': '/x/', 'zh': '无词条', 'emoji': '', 'parts': [], 'memo': '', 'related': []},
            ]},
        ]}
        import json as jsonlib
        from pathlib import Path
        import tempfile
        with tempfile.TemporaryDirectory() as temp:
            file = Path(temp) / 'words.json'
            file.write_text(jsonlib.dumps(snapshot), encoding='utf-8')
            from django.core.management import call_command
            out = io.StringIO()
            call_command('import_scenarios', '--input', str(file), stdout=out)
            stats = json.loads(out.getvalue())
        self.assertEqual(stats['unmatched_no_entry'], 1)
        self.assertEqual(stats['scenario_words'], 0)


class ScenarioPlayTests(TestCase):
    """玩法 API：全量 state 与掌握标记双轨（游客会话 / 登录账号）。"""

    @classmethod
    def setUpTestData(cls):
        import io
        from django.core.management import call_command
        from lexicon.importing import stage_manifest
        from lexicon.services import activate_release
        call_command('seed_platform', stdout=io.StringIO())
        cls.release, _ = stage_manifest({
            'schema_version': 1,
            'source': {'code': 'primary-words', 'name': '现有场景英语词卡（场景单词全量）'},
            'version': 'scenario-play-test', 'adapter': 'test-v1',
            'records': [word_row('dance', '/dɑːns/', 'v. 跳舞'), word_row('sing', '/sɪŋ/', 'v. 唱歌')],
        })
        activate_release(cls.release.pk, expected_current='', reason='测试启用场景词源')
        cls.scenario = Scenario.objects.create(code='u-actions', name='Action Words', zh='动作', emoji='🏃',
                                               color='#f15bb5', order=0)
        records = {r.headword: r for r in cls.release.records.select_related('binding__sense')}
        entries = {en: r.binding.sense.entry_id for en, r in records.items()}
        targets = {en: LearningTarget.objects.create(label=en, sense=r.binding.sense, pronunciation=r.binding.pronunciation, evidence=r) for en, r in records.items()}
        cls.word_a = ScenarioWord.objects.create(en='dance', target=targets['dance'], entry_id=entries['dance'], scenario=cls.scenario, emoji='💃')
        cls.word_b = ScenarioWord.objects.create(en='sing', target=targets['sing'], entry_id=entries['sing'], scenario=cls.scenario, emoji='🎤')
        cls.user = get_user_model().objects.create_user('words-player', password=get_random_string(24))

    def write_data(self, word_id, learned, client=None):
        word = next(w for w in (client or self.client).get('/words/api/state/').json()['words'] if w['id'] == word_id)
        return {'schema_version': 3, 'target_id': word['target_id'], 'revision': word['revision'], 'learned': learned, 'chinese_version_id': word['chinese_version_id'], 'presentation_revision': word['presentation_revision']}

    def setUp(self):
        self.client = Client()

    def test_state_is_full_for_guest(self):
        state = self.client.get('/words/api/state/').json()
        self.assertEqual(len(state['scenarios']), 1)
        self.assertEqual(len(state['words']), 2)
        self.assertTrue(state['guest'])
        self.assertFalse(any(w['learned'] for w in state['words']))

    def test_internal_source_shows_editorial_definition_in_card_and_related_word(self):
        from lexicon.services import revise
        record = self.release.records.get(headword='sing')
        revise(record.binding.sense, value='唱歌；歌唱', note='家庭教学纠正', expected_revision=0)
        # 显式选用修订后的新词卡目标，旧掌握目标不能被改写。
        self.word_b.target = LearningTarget.objects.create(label='sing', sense=record.binding.sense,
            pronunciation=record.binding.pronunciation, evidence=record)
        self.word_b.save(update_fields=['target'])
        self.word_a.related = ['sing']
        self.word_a.save(update_fields=['related'])
        self.assertFalse(self.release.source.public_allowed)
        words = {w['en']: w for w in self.client.get('/words/api/state/').json()['words']}
        self.assertEqual(words['sing']['zh'], '唱歌；歌唱')
        self.assertEqual(words['dance']['related'][0]['zh'], '唱歌；歌唱')

    def test_disabled_source_hides_dictionary_fields_but_keeps_learning_progress(self):
        from lexicon.models import Pronunciation
        from .models import RelatedGloss
        Pronunciation.objects.update(is_reviewed=True)
        RelatedGloss.objects.create(en='sing', zh='旧拓展词表的唱歌释义')
        self.client.force_login(self.user)
        WordProgress.objects.create(user=self.user, word=self.word_a, target=self.word_a.target, learned=True)
        self.word_a.related = ['sing']
        self.word_a.save(update_fields=['related'])
        before = {w['en']: w for w in self.client.get('/words/api/state/').json()['words']}
        self.assertEqual(before['dance']['ipa'], '/dɑːns/')
        source = self.release.source
        source.enabled = False
        source.save(update_fields=['enabled'])
        words = {w['en']: w for w in self.client.get('/words/api/state/').json()['words']}
        self.assertEqual((words['dance']['ipa'], words['dance']['zh']), ('', ''))
        self.assertEqual((words['dance']['related'][0]['ipa'], words['dance']['related'][0]['zh']), ('', ''))
        self.assertTrue(words['dance']['learned'])
        self.assertEqual(WordProgress.objects.get(user=self.user, word=self.word_a).learned, True)

    def test_archived_entry_and_unready_release_do_not_supply_word_fields(self):
        from lexicon.models import LexicalEntry
        LexicalEntry.objects.filter(pk=self.word_a.entry_id).update(status='archived')
        words = {w['en']: w for w in self.client.get('/words/api/state/').json()['words']}
        self.assertEqual(words['dance']['zh'], '')
        self.assertEqual(words['sing']['zh'], 'v. 唱歌')
        self.release.status = 'failed'
        self.release.save(update_fields=['status'])
        self.assertFalse(any(w['zh'] for w in self.client.get('/words/api/state/').json()['words']))

    def test_learn_roundtrip_guest_and_account_isolation(self):
        # 游客标记掌握：API 生效、状态可见。
        state = self.client.get('/words/api/state/').json()
        word_id = state['words'][0]['id']
        response = self.client.post('/words/api/learn/', data=json.dumps(
            self.write_data(word_id, True)), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        state = self.client.get('/words/api/state/').json()
        self.assertTrue(next(w for w in state['words'] if w['id'] == word_id)['learned'])
        guest_row = WordProgress.objects.get(target_id=self.write_data(word_id, True)['target_id'])
        self.assertIsNone(guest_row.user)
        self.assertTrue(guest_row.guest_key)
        # 登录用户的 state 与游客互不可见。
        self.client.force_login(self.user)
        state = self.client.get('/words/api/state/').json()
        self.assertFalse(state['guest'])
        self.assertFalse(any(w['learned'] for w in state['words']))
        # 账号标记后游客会话仍保持自己的标记。
        response = self.client.post('/words/api/learn/', data=json.dumps(
            self.write_data(word_id, True)), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(WordProgress.objects.filter(target_id=self.write_data(word_id, True)['target_id'], learned=True).count(), 2)

    def test_learn_toggle_and_invalid_word(self):
        state = self.client.get('/words/api/state/').json()
        word_id = state['words'][0]['id']
        for expected in (True, False):
            response = self.client.post('/words/api/learn/', data=json.dumps(
                self.write_data(word_id, expected)), content_type='application/json')
            self.assertEqual(response.json()['learned'], expected)
        response = self.client.post('/words/api/learn/', data=json.dumps(
            {'schema_version': 3, 'target_id': '00000000-0000-0000-0000-000000000000', 'revision': 0, 'learned': True, 'chinese_version_id': None, 'presentation_revision': 0}), content_type='application/json')
        self.assertEqual(response.status_code, 404)
        response = self.client.post('/words/api/learn/', data='{"word_id": 3}', content_type='application/json')
        self.assertEqual(response.status_code, 409)

    def test_page_renders_state_and_csrf_path(self):
        from django.test import Client
        self.client.logout()
        enforced = Client(enforce_csrf_checks=True)
        page = enforced.get('/words/')
        self.assertEqual(page.status_code, 200)
        self.assertContains(page, 'words-state')
        self.assertContains(page, 'data-sidebar-side="right"')
        self.assertContains(page, 'id="english-sidebar-toggle"')
        self.assertContains(page, 'data-tts-sequence="#words-cards"')
        self.assertContains(page, 'data-tts-pausable="true"')
        self.assertContains(page, 'id="tts-interval"')
        self.assertContains(page, 'id="tts-repeat"')
        self.assertContains(page, 'id="tts-sequence-status"', count=1)
        token = enforced.cookies['primary_csrftoken'].value
        state = enforced.get('/words/api/state/').json()
        response = enforced.post('/words/api/learn/', data=json.dumps(
            self.write_data(state['words'][0]['id'], True, client=enforced)),
            content_type='application/json', HTTP_X_CSRFTOKEN=token)
        self.assertEqual(response.status_code, 200)

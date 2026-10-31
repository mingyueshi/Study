import io
import json

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import Client, TestCase
from django.utils.crypto import get_random_string

from lexicon.importing import stage_manifest
from lexicon.services import activate_release
from lexicon.tests.helpers import row

from .models import Scenario, ScenarioWord, WordProgress

from .models import Scenario, ScenarioWord, WordProgress


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
        entry_ids = [r.binding.sense.entry_id for r in cls.release.records.order_by('pk')]
        cls.word_a = ScenarioWord.objects.create(en='dance', entry_id=entry_ids[0], scenario=cls.scenario, emoji='💃')
        cls.word_b = ScenarioWord.objects.create(en='sing', entry_id=entry_ids[1], scenario=cls.scenario, emoji='🎤')
        cls.user = get_user_model().objects.create_user('words-player', password=get_random_string(24))

    def setUp(self):
        self.client = Client()

    def test_state_is_full_for_guest(self):
        state = self.client.get('/words/api/state/').json()
        self.assertEqual(len(state['scenarios']), 1)
        self.assertEqual(len(state['words']), 2)
        self.assertTrue(state['guest'])
        self.assertFalse(any(w['learned'] for w in state['words']))

    def test_learn_roundtrip_guest_and_account_isolation(self):
        # 游客标记掌握：API 生效、状态可见。
        state = self.client.get('/words/api/state/').json()
        word_id = state['words'][0]['id']
        response = self.client.post('/words/api/learn/', data=json.dumps(
            {'word_id': word_id, 'learned': True}), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        state = self.client.get('/words/api/state/').json()
        self.assertTrue(next(w for w in state['words'] if w['id'] == word_id)['learned'])
        guest_row = WordProgress.objects.get(word_id=word_id)
        self.assertIsNone(guest_row.user)
        self.assertTrue(guest_row.guest_key)
        # 登录用户的 state 与游客互不可见。
        self.client.force_login(self.user)
        state = self.client.get('/words/api/state/').json()
        self.assertFalse(state['guest'])
        self.assertFalse(any(w['learned'] for w in state['words']))
        # 账号标记后游客会话仍保持自己的标记。
        response = self.client.post('/words/api/learn/', data=json.dumps(
            {'word_id': word_id, 'learned': True}), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(WordProgress.objects.filter(word_id=word_id, learned=True).count(), 2)

    def test_learn_toggle_and_invalid_word(self):
        state = self.client.get('/words/api/state/').json()
        word_id = state['words'][0]['id']
        for expected in (True, False):
            response = self.client.post('/words/api/learn/', data=json.dumps(
                {'word_id': word_id, 'learned': expected}), content_type='application/json')
            self.assertEqual(response.json()['learned'], expected)
        response = self.client.post('/words/api/learn/', data=json.dumps(
            {'word_id': '999999', 'learned': True}), content_type='application/json')
        self.assertEqual(response.status_code, 404)
        response = self.client.post('/words/api/learn/', data='{"word_id": 3}', content_type='application/json')
        self.assertEqual(response.status_code, 400)

    def test_page_renders_state_and_csrf_path(self):
        from django.test import Client
        self.client.logout()
        enforced = Client(enforce_csrf_checks=True)
        page = enforced.get('/words/')
        self.assertEqual(page.status_code, 200)
        self.assertContains(page, 'words-state')
        token = enforced.cookies['primary_csrftoken'].value
        state = enforced.get('/words/api/state/').json()
        response = enforced.post('/words/api/learn/', data=json.dumps(
            {'word_id': state['words'][0]['id'], 'learned': True}),
            content_type='application/json', HTTP_X_CSRFTOKEN=token)
        self.assertEqual(response.status_code, 200)

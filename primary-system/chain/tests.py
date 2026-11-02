import io
import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.test import TestCase
from django.utils.crypto import get_random_string

from lexicon.importing import stage_manifest
from lexicon.models import LexicalEntry
from lexicon.services import activate_release
from lexicon.tests.helpers import row

from . import services
from .models import ChainWord, GameRound
from .services import eligible_chain_records


def idiom_row(key, word, reading):
    return row(key, word=word, meaning=f'{word}的释义', reading=reading, kind='idiom', language='zh')


def idiom_manifest(rows, *, source='test-idiom-source', version='v1', public=False):
    return {'schema_version': 1,
            'source': {'code': source, 'name': '测试成语来源', 'public_allowed': public},
            'version': version, 'adapter': 'test-v1', 'records': rows}


def stage_active(rows, **kwargs):
    release, _ = stage_manifest(idiom_manifest(rows, **kwargs))
    activate_release(release.pk, expected_current='', reason='测试启用', actor=None)
    return release


def make_chain(entry, **kwargs):
    word = ChainWord(entry=entry, **kwargs)
    word.full_clean()
    word.save()
    return word


def entries_of(release):
    return {r.binding.sense.entry.headword: r.binding.sense.entry for r in release.records.all()}


class ChainWordModelTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.release = stage_active([idiom_row('a', '守株待兔', 'shǒu zhū dài tù')])
        cls.entry = cls.release.records.get().binding.sense.entry

    def test_chars_derive_when_blank_and_allow_manual_override(self):
        word = make_chain(self.entry)
        self.assertEqual((word.first_char, word.last_char), ('守', '兔'))
        word.first_char = '株'
        word.full_clean()
        word.save()
        word.refresh_from_db()
        self.assertEqual(word.first_char, '株')

    def test_only_idiom_entries_accepted(self):
        entry = LexicalEntry.objects.create(language='zh', headword='苹果', kind='word')
        with self.assertRaises(ValidationError):
            ChainWord(entry=entry).full_clean()

    def test_merged_or_archived_entry_rejected(self):
        self.entry.status = 'archived'
        self.entry.save(update_fields=['status'])
        with self.assertRaises(ValidationError):
            ChainWord(entry=self.entry).full_clean()


class ChainPoolTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.release = stage_active([
            idiom_row('a', '守株待兔', 'shǒu zhū dài tù'),
            idiom_row('b', '画蛇添足', 'huà shé tiān zú'),
        ])
        entries = entries_of(cls.release)
        make_chain(entries['守株待兔'], game_eligible=True)
        make_chain(entries['画蛇添足'], game_eligible=False)
        # 第二个来源只暂存未启用：词条存在但不得进入取词范围。
        cls.staged, _ = stage_manifest(idiom_manifest(
            [idiom_row('c', '亡羊补牢', 'wáng yáng bǔ láo')], source='test-second-source'))
        make_chain(cls.staged.records.get().binding.sense.entry, game_eligible=True)

    def test_pool_follows_eligible_flag(self):
        heads = {r.binding.sense.entry.headword for r in eligible_chain_records()}
        self.assertEqual(heads, {'守株待兔'})

    def test_internal_source_counts_without_public_clearance(self):
        self.assertFalse(self.release.source.public_allowed)
        self.assertEqual(eligible_chain_records().count(), 1)

    def test_staged_release_never_enters_pool(self):
        # 版本已就绪但来源从未启用，记录不得进入取词范围。
        self.assertIsNone(self.staged.source.active_release_id)
        self.assertEqual(eligible_chain_records().count(), 1)

    def test_actual_game_pool_excludes_staged_and_manually_disabled_words(self):
        self.assertEqual({r[1] for r in services.chain_pool()}, {'守株待兔'})

    def test_actual_pool_immediately_follows_source_and_entry_state(self):
        self.assertEqual(len(services.chain_pool()), 1)
        source = self.release.source
        source.enabled = False
        source.save(update_fields=['enabled'])
        self.assertEqual(services.chain_pool(), [])
        source.enabled = True
        source.save(update_fields=['enabled'])
        self.assertEqual(len(services.chain_pool()), 1)
        entry = self.release.records.get(headword='守株待兔').binding.sense.entry
        for status in ('archived', 'merged'):
            entry.status = status
            entry.save(update_fields=['status'])
            self.assertEqual(services.chain_pool(), [])
            entry.status = 'draft'
            entry.save(update_fields=['status'])
            self.assertEqual(len(services.chain_pool()), 1)

    def test_actual_pool_follows_release_switch_and_rollback(self):
        self.assertEqual({r[1] for r in services.chain_pool()}, {'守株待兔'})
        second, _ = stage_manifest(idiom_manifest(
            [idiom_row('b', '画蛇添足', 'huà shé tiān zú')], version='v2'))
        activate_release(second.pk, expected_current=self.release.pk, reason='新版删除原可接龙词')
        self.assertEqual(services.chain_pool(), [])
        activate_release(self.release.pk, expected_current=second.pk, reason='回退')
        self.assertEqual({r[1] for r in services.chain_pool()}, {'守株待兔'})

    def test_equal_size_bulk_flag_swap_changes_actual_pool(self):
        self.assertEqual({r[1] for r in services.chain_pool()}, {'守株待兔'})
        ChainWord.objects.filter(entry__headword='守株待兔').update(game_eligible=False)
        ChainWord.objects.filter(entry__headword='画蛇添足').update(game_eligible=True)
        self.assertEqual({r[1] for r in services.chain_pool()}, {'画蛇添足'})

    def test_homographs_use_one_eligible_entry_by_source_priority(self):
        preferred = stage_active(
            [idiom_row('same', '守株待兔', 'shǒu zhū dài tù')], source='preferred-idioms')
        source = preferred.source
        source.priority = 1
        source.save(update_fields=['priority'])
        entry = preferred.records.get().binding.sense.entry
        word = make_chain(entry, game_eligible=True)
        self.assertEqual([(r[0], r[1]) for r in services.chain_pool()], [(str(entry.pk), '守株待兔')])
        # 禁用首选词位后仍可使用其它已启用来源的同形成语，词库实体不合并。
        word.game_eligible = False
        word.save(update_fields=['game_eligible'])
        self.assertEqual(len(services.chain_pool()), 1)
        self.assertNotEqual(services.chain_pool()[0][0], str(entry.pk))
        self.assertEqual(LexicalEntry.objects.filter(headword='守株待兔').count(), 2)


class ChainAdminTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.release = stage_active([
            idiom_row('a', '守株待兔', 'shǒu zhū dài tù'),
            idiom_row('b', '画蛇添足', 'huà shé tiān zú'),
        ])
        entries = entries_of(cls.release)
        make_chain(entries['守株待兔'], game_eligible=False)
        cls.free_entry = entries['画蛇添足']
        call_command('seed_platform', stdout=io.StringIO())
        user = get_user_model()
        cls.admin = user.objects.create_superuser('chain-admin', password=get_random_string(24))
        cls.curator = user.objects.create_user('chain-curator', is_staff=True)
        cls.curator.groups.add(Group.objects.get(name='游戏管理'))
        cls.editor = user.objects.create_user('chain-editor', is_staff=True)
        cls.editor.groups.add(Group.objects.get(name='内容编辑'))

    def test_admin_lists_and_forms_render(self):
        self.client.force_login(self.admin)
        for path in ('/admin/chain/chainword/', '/admin/chain/chainword/add/'):
            self.assertEqual(self.client.get(path).status_code, 200, path)
        pk = ChainWord.objects.get().pk
        self.assertEqual(self.client.get(f'/admin/chain/chainword/{pk}/change/').status_code, 200)

    def test_bulk_actions_toggle_eligibility(self):
        self.client.force_login(self.admin)
        pk = str(ChainWord.objects.get().pk)
        self.client.post('/admin/chain/chainword/', {'action': 'mark_eligible', '_selected_action': pk})
        self.assertTrue(ChainWord.objects.get(pk=pk).game_eligible)
        self.client.post('/admin/chain/chainword/', {'action': 'mark_ineligible', '_selected_action': pk})
        self.assertFalse(ChainWord.objects.get(pk=pk).game_eligible)

    def test_game_group_curates_but_content_editor_cannot(self):
        self.client.force_login(self.curator)
        response = self.client.post('/admin/chain/chainword/add/', {
            'entry': str(self.free_entry.pk), 'game_eligible': 'on',
            'first_char': '', 'last_char': '', 'note': '开学第一周用',
        })
        self.assertEqual(response.status_code, 302)
        word = ChainWord.objects.get(entry=self.free_entry)
        self.assertEqual((word.first_char, word.last_char), ('画', '足'))
        self.client.force_login(self.editor)
        self.assertEqual(self.client.get('/admin/chain/chainword/').status_code, 403)


class SeedChainPoolTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.release = stage_active([
            idiom_row('a', '守株待兔', 'shǒu zhū dài tù'),
            idiom_row('b', '画蛇添足', 'huà shé tiān zú'),
            idiom_row('c', '爱则加诸膝，恶则坠诸渊', 'cháng jù'),
        ])
        # 第二来源只暂存未启用，其词条不得入池。
        stage_manifest(idiom_manifest([idiom_row('d', '亡羊补牢', 'wáng yáng bǔ láo')], source='test-staged-source'))

    def test_seeds_four_char_idioms_idempotently_and_skips_others(self):
        output = io.StringIO()
        call_command('seed_chain_pool', stdout=output)
        first = json.loads(output.getvalue())
        self.assertEqual(first['playable'], 2)
        self.assertEqual(first['to_create'], 2)
        self.assertEqual(first['skipped_not_playable'], 1)
        self.assertEqual(first['dry_run'], False)
        self.assertEqual(ChainWord.objects.filter(game_eligible=True).count(), 2)
        self.assertFalse(ChainWord.objects.filter(entry__headword='爱则加诸膝，恶则坠诸渊').exists())
        self.assertFalse(ChainWord.objects.filter(entry__headword='亡羊补牢').exists())
        second_output = io.StringIO()
        call_command('seed_chain_pool', stdout=second_output)
        second = json.loads(second_output.getvalue())
        self.assertEqual(second['to_create'], 0)
        self.assertEqual(ChainWord.objects.count(), 2)

    def test_dry_run_creates_nothing(self):
        output = io.StringIO()
        call_command('seed_chain_pool', '--dry-run', stdout=output)
        self.assertEqual(json.loads(output.getvalue())['to_create'], 2)
        self.assertEqual(ChainWord.objects.count(), 0)


class ChainPlayTests(TestCase):
    """对局全链路：固定小词池走开局、接龙、陪练、提示、终局与并发防护。"""

    CHAIN_WORDS = ['一心一意', '意气风发', '发扬光大', '大功告成', '大快人心', '表里如一']

    @classmethod
    def setUpTestData(cls):
        rows = [idiom_row(str(i), word, f'{word} pinyin') for i, word in enumerate(cls.CHAIN_WORDS)]
        rows.append(idiom_row('dead', '一鸣惊人', '一鸣惊人 pinyin'))  # 接「人」无候选 → 陪练卡死
        cls.release = stage_active(rows)
        cls.entries = entries_of(cls.release)
        for word, entry in cls.entries.items():
            make_chain(entry, game_eligible=word in cls.CHAIN_WORDS or word == '一鸣惊人')
        cls.user = get_user_model().objects.create_user('chain-player', password=get_random_string(24))
        cls.other = get_user_model().objects.create_user('chain-other', password=get_random_string(24))

    def fixed_round(self, headword):
        """手工开局：绕开随机起点，构造确定的对局链。"""
        entry = self.entries[headword]
        chain_word = ChainWord.objects.get(entry=entry)
        return GameRound.objects.create(user=self.user, chain=[{
            'entry_id': str(entry.pk), 'word': headword, 'pinyin': '', 'meaning': '',
            'by': 'start', 'last_char': chain_word.last_char,
        }])

    def setUp(self):
        self.client.force_login(self.user)

    def state(self):
        response = self.client.get('/chain/api/state/')
        self.assertEqual(response.status_code, 200)
        return response.json()

    def play(self, word, state=None):
        state = state or self.state()
        return self.client.post('/chain/api/play/', data=json.dumps(
            {'round_id': state['id'], 'revision': state['revision'], 'word': word}), content_type='application/json')

    def test_guest_flow_survives_real_csrf_enforcement(self):
        # test client 默认关闭 CSRF 校验；本用例显式开启，守住「页面必须种 cookie、
        # POST 必须携带 token」的真实浏览器路径（曾因模板丢 csrf_token 而全线 403）。
        from django.test import Client
        self.client.logout()
        enforced = Client(enforce_csrf_checks=True)
        page = enforced.get('/chain/')
        self.assertEqual(page.status_code, 200)
        token = enforced.cookies['primary_csrftoken'].value
        state = enforced.get('/chain/api/state/').json()
        tail = state['next_char']
        word = next(w for w in self.CHAIN_WORDS if w[0] == tail)
        response = enforced.post('/chain/api/play/', data=json.dumps(
            {'round_id': state['id'], 'revision': state['revision'], 'word': word}),
            content_type='application/json', HTTP_X_CSRFTOKEN=token)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['score'], 10)
        # 无 token 的请求仍被拒绝。
        rejected = enforced.post('/chain/api/play/', data=json.dumps(
            {'round_id': state['id'], 'revision': state['revision'], 'word': word}),
            content_type='application/json')
        self.assertEqual(rejected.status_code, 403)

    def test_guest_plays_without_account(self):
        self.client.logout()
        self.assertEqual(self.client.get('/chain/').status_code, 200)
        state = self.client.get('/chain/api/state/').json()
        self.assertEqual(state['status'], 'playing')
        round = GameRound.objects.get(pk=state['id'])
        self.assertIsNone(round.user)
        self.assertTrue(round.guest_key)
        # 游客可出招、提示、重开。
        tail = state['next_char']
        word = next(w for w in self.CHAIN_WORDS if w[0] == tail)
        response = self.client.post('/chain/api/play/', data=json.dumps(
            {'round_id': state['id'], 'revision': state['revision'], 'word': word}), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['score'], 10)

    def test_guest_cannot_touch_account_round(self):
        state = self.state()
        self.client.logout()
        response = self.client.post('/chain/api/play/', data=json.dumps(
            {'round_id': state['id'], 'revision': state['revision'], 'word': '一心一意'}),
            content_type='application/json')
        self.assertEqual(response.status_code, 409)

    def test_guest_rounds_are_isolated_per_browser(self):
        self.client.logout()
        first = self.client.get('/chain/api/state/').json()
        self.client.logout()  # 清空会话 = 另一位游客
        second = self.client.get('/chain/api/state/').json()
        self.assertNotEqual(first['id'], second['id'])
        self.assertEqual(GameRound.objects.filter(status=GameRound.Status.PLAYING).count(), 2)

    def test_page_renders_with_state(self):
        response = self.client.get('/chain/')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'chain-state')

    def test_start_round_comes_from_pool(self):
        state = self.state()
        self.assertEqual(state['status'], 'playing')
        self.assertEqual(len(state['chain']), 1)
        self.assertIn(state['chain'][0]['word'], self.CHAIN_WORDS + ['一鸣惊人'])
        self.assertTrue(state['pool_count'] >= 5)

    def test_full_chain_with_partner_and_scoring(self):
        state = self.state()
        # 起点随机，因此沿链走到死局为止，断言每一步的计分与陪练回应。
        while state['status'] == 'playing':
            tail = state['next_char']
            word = next((w for w in self.CHAIN_WORDS + ['一鸣惊人'] if w[0] == tail and w not in
                         {item['word'] for item in state['chain']}), None)
            if word is None:
                self.fail('测试词池意外断链')
            before = len(state['chain'])
            response = self.play(word, state)
            self.assertEqual(response.status_code, 200)
            state = response.json()
            if state['status'] == 'playing':
                # 对局继续 = 陪练接上了：玩家+陪练各一手，最后一手必是陪练。
                self.assertEqual(len(state['chain']), before + 2)
                self.assertEqual(state['chain'][-1]['by'], 'partner')
            elif state['ended_reason'] == '陪练无词可接，玩家获胜':
                self.assertEqual(len(state['chain']), before + 1)
                self.assertEqual(state['chain'][-1]['by'], 'player')
            else:
                # 玩家无词可接：陪练接完最后一手后终局。
                self.assertEqual(state['ended_reason'], '玩家无词可接，本局结束')
                self.assertEqual(len(state['chain']), before + 2)
                self.assertEqual(state['chain'][-1]['by'], 'partner')
            self.assertEqual(state['score'], 10 * sum(1 for item in state['chain'] if item['by'] == 'player'))
        self.assertIn(state['status'], ('finished',))
        self.assertTrue(state['ended_reason'])

    def test_rejected_moves(self):
        state = self.state()
        opener = state['chain'][0]['word']
        for word, message in [
            ('三字经', '请输入四字成语。'),
            (opener, '这个成语已经用过了，换一个吧。'),
            ('守株待兔', '未收录这个成语，请尝试词库中的其他成语。'),
        ]:
            response = self.play(word, state)
            self.assertEqual(response.status_code, 400, word)
            self.assertEqual(response.json()['error'], message)

    def test_wrong_head_char_rejected_without_homophone(self):
        state = self.state()
        tail = state['next_char']
        opener = state['chain'][0]['word']
        other = next(w for w in self.CHAIN_WORDS if w[0] != tail and w != opener)
        response = self.play(other, state)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['error'], f'请以“{tail}”字开头，不使用谐音。')

    def test_not_eligible_entry_rejected(self):
        state = self.state()
        response = self.play('亡羊补牢', state)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['error'], '未收录这个成语，请尝试词库中的其他成语。')

    def test_stale_revision_conflicts(self):
        state = self.state()
        tail = state['next_char']
        word = next(w for w in self.CHAIN_WORDS if w[0] == tail)
        stale = json.dumps({'round_id': state['id'], 'revision': state['revision'] - 1, 'word': word})
        response = self.client.post('/chain/api/play/', data=stale, content_type='application/json')
        self.assertEqual(response.status_code, 409)

    def test_other_user_cannot_touch_round(self):
        state = self.state()
        self.client.force_login(self.other)
        response = self.client.post('/chain/api/play/', data=json.dumps(
            {'round_id': state['id'], 'revision': state['revision'], 'word': '一心一意'}),
            content_type='application/json')
        self.assertEqual(response.status_code, 409)

    def test_hint_costs_five_and_lists_all_candidates(self):
        # 固定开局：尾字「大」在词池中有两个可接成语，提示必须全部列出。
        self.fixed_round('发扬光大')
        state = self.state()
        response = self.client.post('/chain/api/hint/', data=json.dumps(
            {'round_id': state['id'], 'revision': state['revision']}), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['score'], max(0, state['score'] - 5))
        self.assertEqual(data['hints'], 1)
        self.assertEqual({item['word'] for item in data['hint']}, {'大功告成', '大快人心'})
        for item in data['hint']:
            self.assertEqual(item['word'][0], '大')
            self.assertNotIn(item['word'], {c['word'] for c in state['chain']})

    def test_partner_dead_end_finishes_round(self):
        round = self.fixed_round('表里如一')  # 尾字「一」→ 一鸣惊人；「人」无候选
        state = self.state()
        response = self.play('一鸣惊人', state)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'finished')
        self.assertEqual(data['ended_reason'], '陪练无词可接，玩家获胜')

    def test_restart_finishes_and_starts_new_round(self):
        state = self.state()
        response = self.client.post('/chain/api/restart/', data=json.dumps(
            {'round_id': state['id'], 'revision': state['revision']}), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        fresh = response.json()
        self.assertEqual(fresh['status'], 'playing')
        self.assertNotEqual(fresh['id'], state['id'])
        self.assertEqual(GameRound.objects.get(pk=state['id']).status, GameRound.Status.FINISHED)
        self.assertEqual(GameRound.objects.filter(user=self.user, status=GameRound.Status.PLAYING).count(), 1)

    def test_history_lists_recent_finished_rounds(self):
        self.test_restart_finishes_and_starts_new_round()
        state = self.state()
        self.assertEqual(len(state['history']), 1)
        self.assertEqual(state['history'][0]['length'], 0)

    def switched_release_round(self, *, complete_loop):
        """旧链已使用的词在新版更换来源键和 UUID，游戏仍须按词形判重。"""
        words = ['一心一意', '意气风发', '发扬光大', '大快人心']
        round = self.fixed_round(words[0])
        for headword in words[1:]:
            entry = self.entries[headword]
            word = ChainWord.objects.get(entry=entry)
            round.chain.append({'entry_id': str(entry.pk), 'word': headword, 'pinyin': '', 'meaning': '',
                                'by': 'partner', 'last_char': word.last_char})
        rows = [idiom_row('replacement' if i == 0 else str(i), word, f'{word} pinyin')
                for i, word in enumerate(self.CHAIN_WORDS)]
        rows += [idiom_row('dead', '一鸣惊人', '一鸣惊人 pinyin'), idiom_row('loop', '心口如一', '心口如一 pinyin')]
        replacement, _ = stage_manifest(idiom_manifest(rows, version='v2'))
        activate_release(replacement.pk, expected_current=self.release.pk, reason='新版更换第一词的来源身份')
        entries = entries_of(replacement)
        make_chain(entries['一心一意'], game_eligible=True)
        make_chain(entries['心口如一'], game_eligible=True)
        if complete_loop:
            round.chain.append({'entry_id': str(entries['心口如一'].pk), 'word': '心口如一', 'pinyin': '', 'meaning': '',
                                'by': 'partner', 'last_char': '一'})
        round.save()
        return round

    def test_hint_excludes_used_spelling_after_entry_identity_changes(self):
        round = self.switched_release_round(complete_loop=True)
        response = self.client.post('/chain/api/hint/', data=json.dumps(
            {'round_id': str(round.pk), 'revision': round.revision}), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        state = response.json()
        self.assertEqual([item['word'] for item in state['hint']], ['一鸣惊人'])
        response = self.play('一心一意', state)
        self.assertEqual(response.status_code, 400)
        self.assertIn('已经用过', response.json()['error'])

    def test_partner_does_not_repeat_spelling_after_entry_identity_changes(self):
        self.switched_release_round(complete_loop=False)
        ChainWord.objects.filter(entry__headword='一鸣惊人').update(game_eligible=False)
        response = self.play('心口如一')
        self.assertEqual(response.status_code, 200)
        state = response.json()
        self.assertEqual(state['status'], 'finished')
        self.assertEqual(state['ended_reason'], GameRound.EndedReason.PARTNER_STUCK.label)
        self.assertEqual(len(state['chain']), 5)
        self.assertEqual(len({item['word'] for item in state['chain']}), 5)

    def test_hint_and_play_reuse_their_pool_for_response_statistics(self):
        self.fixed_round('发扬光大')
        state = self.state()
        with patch('chain.services.chain_pool', wraps=services.chain_pool) as load_pool:
            response = self.client.post('/chain/api/hint/', data=json.dumps(
                {'round_id': state['id'], 'revision': state['revision']}), content_type='application/json')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(load_pool.call_count, 1)
        with patch('chain.services.chain_pool', wraps=services.chain_pool) as load_pool:
            response = self.play('大快人心', response.json())
            self.assertEqual(response.status_code, 200)
            self.assertEqual(load_pool.call_count, 1)


class EmptyChainTests(TestCase):
    def test_empty_pool_has_page_empty_state_and_explicit_api_error(self):
        response = self.client.get('/chain/')
        self.assertContains(response, '成语接龙正在准备中')
        self.assertNotContains(response, 'chain-state')
        self.assertEqual(GameRound.objects.count(), 0)
        response = self.client.get('/chain/api/state/')
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()['status'], 'unavailable')
        self.assertIn('no-store', response.headers['Cache-Control'])



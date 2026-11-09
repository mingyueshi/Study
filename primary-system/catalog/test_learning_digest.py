"""全学科学习总览（catalog.learning_digest）与首页/「我的学习」的汇总展示测试。

覆盖：各领域计数与本周口径、最近学习行合并排序、首页登录/游客两态、
「我的学习」的总览卡与动态流。
"""
import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from chain.models import GameRound
from hanzi.models import PolyphoneAnswer
from idioms.models import PlayRecord
from learning.models import Progress
from mathbook.models import BookProgress
from phrases.models import PhraseAnswer
from poetry.models import FeihualingRound
from plurals.models import PluralAnswer
from questionbank import types as qb_types
from questionbank.models import AnswerRecord as QbAnswerRecord
from questionbank.models import Question as QbQuestion
from words.models import LearningTarget, WordProgress
from writing.models import WritingDraft

from .learning_digest import learning_digest
from .models import ContentItem
from .tests import PlatformFixture


class DigestDataTests(PlatformFixture):
    """聚合口径：每个领域只算自己含义明确的指标，最近行按时间合并。"""

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.user = get_user_model().objects.create_user('learner', password='digest-pass')
        cls.item2 = ContentItem.objects.create(module=cls.item.module, kind='knowledge',
                                               title='第二条知识', status='published')
        from .models import Placement
        Placement.objects.create(unit=cls.unit, item=cls.item2)
        Progress.objects.create(user=cls.user, item=cls.item, status='mastered', note='掌握第一条')
        Progress.objects.create(user=cls.user, item=cls.item2, status='learning')
        target = LearningTarget.objects.create(label='bank', legacy={'word_id': 1})
        WordProgress.objects.create(user=cls.user, target=target, learned=True)
        target2 = LearningTarget.objects.create(label='book', legacy={'word_id': 2})
        WordProgress.objects.create(user=cls.user, target=target2, learned=False)
        GameRound.objects.create(user=cls.user, chain=[], score=12, status='finished',
                                 ended_reason='partner_stuck', finished_at=timezone.now())
        GameRound.objects.create(user=cls.user, chain=[], score=3, status='playing')
        GameRound.objects.create(user=cls.user, chain=[], score=14, p2_score=8, mode='duel',
                                 first_player='p2', status='finished',
                                 ended_reason='p2_stuck', finished_at=timezone.now())
        WritingDraft.objects.create(user=cls.user, title='我的假期')
        PlayRecord.objects.create(user=cls.user, game=PlayRecord.Game.QUIZ, size=1, correct=1,
                                  extra={'headword': '守株待兔', 'level': 3, 'source': 'common'})
        PlayRecord.objects.create(user=cls.user, game=PlayRecord.Game.PAIRS, size=5, correct=5,
                                  extra={'attempts': 7})
        FeihualingRound.objects.create(user=cls.user, keyword='月', independent=3, learning=2,
                                       result=FeihualingRound.Result.COMPLETED)
        PolyphoneAnswer.objects.create(user=cls.user, char='乐', word='音乐', chosen='yuè',
                                       answer='yuè', correct=True)
        question = QbQuestion(
            uuid=qb_types.question_uuid('primary-math', 'math:digest:example'), type='choice',
            area='math', grade=4, stem='10 个一万是多少？',
            payload={'options': ['十万', '一万'], 'answer': 0, 'explanation': '10 个一万是十万。'},
            tags=['数学'], source_key='primary-math', source_ref='math:digest:example')
        question.save()
        QbAnswerRecord.objects.create(user=cls.user, question=question, given={'value': 0}, correct=True)
        PluralAnswer.objects.create(user=cls.user, singular='man', chosen='men', answer='men', correct=True)
        PhraseAnswer.objects.create(user=cls.user, phrase='ph-digest', chosen='Good job!', answer='Good job!',
                                    correct=True)

    def test_areas_cover_eleven_domains_with_own_metrics(self):
        digest = learning_digest(self.user)
        self.assertEqual([card['key'] for card in digest['areas']],
                         ['textbook', 'mathbook', 'words', 'chain', 'writing', 'idioms', 'feihualing', 'polyphones',
                          'questionbank', 'plurals', 'phrases'])
        by_key = {card['key']: card for card in digest['areas']}
        self.assertEqual(by_key['textbook']['headlines'], [(2, '开始学习'), (1, '已经掌握'), (0, '我的收藏')])
        self.assertIn('数学 1', by_key['textbook']['footnote'])
        self.assertEqual(by_key['mathbook']['headlines'], [(0, '已读'), (0, '自评掌握'), (43, '知识点')])
        self.assertEqual(by_key['words']['headlines'], [(1, '已掌握'), (2, '学过')])
        # 对决局的 score 同为孩子得分，计入完成数与最高分。
        self.assertEqual(by_key['chain']['headlines'], [(2, '完成对局'), (14, '最高分')])
        self.assertEqual(by_key['writing']['headlines'], [(1, '草稿')])
        self.assertEqual(by_key['idioms']['headlines'], [(1, '猜成语答题'), (1, '猜对'), (1, '完成局数')])
        self.assertEqual(by_key['feihualing']['headlines'], [(1, '完成次数'), (1, '集满五句')])
        self.assertEqual(by_key['polyphones']['headlines'], [(1, '练习题数'), (1, '答对')])
        self.assertEqual(by_key['questionbank']['headlines'], [(1, '答题'), (1, '答对')])
        self.assertEqual(by_key['plurals']['headlines'], [(1, '练习题数'), (1, '答对')])
        self.assertEqual(by_key['phrases']['headlines'], [(1, '练习题数'), (1, '答对')])
        # 新鲜记录都落在近 7 天：本周文案非空。
        for card in digest['areas']:
            if card['key'] != 'mathbook':
                self.assertTrue(card['week'], card['key'])

    def test_week_only_counts_recent_records(self):
        past = timezone.now() - datetime.timedelta(days=30)
        GameRound.objects.filter(user=self.user, status='finished').update(updated_at=past, finished_at=past)
        digest = learning_digest(self.user)
        chain = next(card for card in digest['areas'] if card['key'] == 'chain')
        self.assertEqual(chain['headlines'], [(2, '完成对局'), (14, '最高分')])
        self.assertEqual(chain['week'], '')

    def test_recent_merges_and_sorts_desc(self):
        rows = learning_digest(self.user)['recent']
        self.assertLessEqual(len(rows), 10)
        self.assertEqual([row['when'] for row in rows], sorted((row['when'] for row in rows), reverse=True))
        titles = {row['title'] for row in rows}
        self.assertIn('守株待兔', titles)          # 猜成语记录带词头
        self.assertIn('成语接龙', titles)
        self.assertIn('我的假期', titles)
        self.assertIn('「月」字飞花令', titles)
        quiz_row = next(row for row in rows if row['title'] == '守株待兔')
        self.assertEqual(quiz_row['note'], '看释义猜成语 · 答对')
        self.assertTrue(quiz_row['url'].endswith('/idioms/quiz/'))
        # 接龙动态行按模式分支文案：对决局显示比分与胜负。
        duel_row = next(row for row in rows if row['note'].startswith('对决家长'))
        self.assertEqual(duel_row['note'], '对决家长获胜 · 14:8')

    def test_guest_has_no_cross_account_rows(self):
        other = get_user_model().objects.create_user('other')
        self.assertTrue(all(card['headlines'] for card in learning_digest(other)['areas']))


class DigestViewTests(PlatformFixture):
    """首页登录/游客两态与「我的学习」的完整版总览。"""

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.user = get_user_model().objects.create_user('learner', password='digest-pass')
        Progress.objects.create(user=cls.user, item=cls.item, status='mastered')
        PlayRecord.objects.create(user=cls.user, game=PlayRecord.Game.QUIZ, size=1, correct=1,
                                  extra={'headword': '守株待兔'})

    def test_home_hides_overview_for_logged_in_user(self):
        """首页不再放学习总览与足迹（完整版在「我的学习」）；两种状态都不出现。"""
        self.client.force_login(self.user)
        response = self.client.get('/')
        self.assertNotContains(response, '学习总览')
        self.assertNotContains(response, '查看完整学习足迹')
        self.assertNotContains(response, '登录后，收藏、笔记和掌握记录会跟着你的账号走')
        self.assertContains(response, '挑战题库')

    def test_home_keeps_guest_strip(self):
        response = self.client.get('/')
        self.assertContains(response, '登录后，收藏、笔记和掌握记录会跟着你的账号走')
        self.assertNotContains(response, '学习总览')

    def test_my_learning_renders_cards_feed_and_list(self):
        draft = WritingDraft.objects.create(user=self.user, title='我的假期')
        target = LearningTarget.objects.create(label='book', legacy={'word_id': 1})
        WordProgress.objects.create(user=self.user, target=target, learned=True)
        self.client.force_login(self.user)
        response = self.client.get('/me/')
        self.assertContains(response, '最近学了什么')
        self.assertContains(response, '教材内容记录')
        self.assertContains(response, '守株待兔')
        self.assertContains(response, '认识数字')
        draft_url = reverse('writing', query={'draft': draft.pk}, fragment='notebook')
        target_url = reverse('scenario-words', query={'target': target.pk})
        self.assertContains(response, f'href="{draft_url}"')
        self.assertContains(response, f'href="{target_url}"')

    def test_my_learning_requires_login(self):
        response = self.client.get('/me/')
        self.assertEqual(response.status_code, 302)
        self.assertIn('login', response.url)

    def test_mathbook_progress_is_separate_and_links_to_the_last_unit(self):
        BookProgress.objects.create(user=self.user, book='4a', last_unit='mu2',
                                    read_points=['mu2-2'], learned=['mu2-1', 'removed-point'])
        other = get_user_model().objects.create_user('other-math')
        BookProgress.objects.create(user=other, book='4a', last_unit='mu3', learned=['mu3-1', 'mu3-2'])
        self.client.force_login(self.user)
        response = self.client.get('/me/')
        resume_url = reverse('mathbook-book', args=['4a'], fragment='mu2')
        self.assertContains(response, f'href="{resume_url}">接着学')
        digest = learning_digest(self.user)
        math = next(card for card in digest['areas'] if card['key'] == 'mathbook')
        self.assertEqual(math['headlines'], [(1, '已读'), (1, '自评掌握'), (43, '知识点')])
        self.assertEqual([row['url'] for row in digest['recent'] if row['note'].startswith('数学教材')], [resume_url])

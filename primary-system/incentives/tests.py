"""激励系统测试：规则表自检、record_event 发分/上限/打卡/勋章、兑换核销、
奖励页渲染与代表性端点集成（plurals 上报）。口径：答错不给分；游客零激励。"""
from datetime import date, timedelta
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from unittest import skipUnless

from django.db import connection, connections
from django.test import RequestFactory, TestCase, TransactionTestCase
from django.urls import reverse
from django.utils import timezone

from .models import BadgeAward, CheckIn, PointEvent, Redemption, RewardItem
from .rules import BADGES, validate_rules
from . import services


def auth_request(user, path='/x/'):
    request = RequestFactory().post(path)
    request.user = user
    return request


class RulesTests(TestCase):
    """规则表自身的一致性：改规则先过这关。"""

    def test_rules_valid(self):
        self.assertTrue(validate_rules())

    def test_badge_codes_unique(self):
        codes = [badge['code'] for badge in BADGES]
        self.assertEqual(len(codes), len(set(codes)))

    def test_every_badge_key_is_a_stats_key(self):
        from django.contrib.auth import get_user_model
        user = get_user_model().objects.create_user('stats-probe', password='x')
        stats = services.stats_for(user)
        missing = [badge['key'] for badge in BADGES if badge['key'] not in stats]
        self.assertEqual(missing, [])


class RecordEventTests(TestCase):
    """record_event：发分、每日上限、自动打卡、游客与非法 code 静默。"""

    def setUp(self):
        from django.contrib.auth import get_user_model
        self.user = get_user_model().objects.create_user('kid', password='x')

    def test_points_and_checkin_and_first_badge(self):
        awards = services.record_event(self.user, 'polyphone_correct')
        self.assertEqual([a['type'] for a in awards], ['points', 'checkin', 'badge'])
        self.assertEqual(PointEvent.objects.filter(user=self.user).count(), 1)
        self.assertEqual(CheckIn.objects.filter(user=self.user).count(), 1)
        self.assertTrue(BadgeAward.objects.filter(user=self.user, badge='checkin_first').exists())

    def test_same_day_checkin_not_duplicated(self):
        services.record_event(self.user, 'polyphone_correct')
        awards = services.record_event(self.user, 'polyphone_correct')
        self.assertNotIn('checkin', [a['type'] for a in awards])
        self.assertEqual(CheckIn.objects.filter(user=self.user).count(), 1)

    def test_daily_cap_stops_points_but_checkin_remains(self):
        for _ in range(10):  # polyphone_correct 每日上限 10
            services.record_event(self.user, 'polyphone_correct')
        awards = services.record_event(self.user, 'polyphone_correct')
        self.assertNotIn('points', [a['type'] for a in awards])
        self.assertEqual(PointEvent.objects.filter(user=self.user).count(), 10)
        self.assertEqual(CheckIn.objects.filter(user=self.user).count(), 1)

    def test_rule_points_for_polyphone(self):
        """逐题答错的上报端点自己不调 record_event；这里只保证码表口径。"""
        from .rules import EVENT_RULES
        self.assertEqual(EVENT_RULES['polyphone_correct']['points'], 1)

    def test_guest_and_invalid_code_are_silent(self):
        from django.contrib.auth.models import AnonymousUser
        self.assertEqual(services.record_event(AnonymousUser(), 'polyphone_correct'), [])
        self.assertEqual(services.record_event(self.user, 'no_such_code'), [])
        self.assertEqual(services.record_event(self.user, 'redeem'), [])  # 手动事件不走 record_event
        self.assertEqual(PointEvent.objects.count(), 0)

    def test_take_awards_and_summarize(self):
        request = auth_request(self.user)
        services.record_event(self.user, 'polyphone_correct', request=request)
        awards = services.take_awards(request)
        self.assertTrue(awards)
        self.assertIsNone(services.take_awards(request))  # 取走即清空
        text = services.summarize_awards(awards)
        self.assertIn('1 积分', text)
        self.assertIn('第一次打卡', text)
        self.assertEqual(services.summarize_awards([]), '')


@skipUnless(connection.vendor == 'postgresql', '需要 PostgreSQL 行锁')
class ConcurrentRecordEventTests(TransactionTestCase):
    def test_parallel_awards_share_one_daily_limit(self):
        from django.contrib.auth import get_user_model

        user = get_user_model().objects.create_user('parallel-learner')
        for _ in range(9):
            services.record_event(user, 'plural_correct')
        barrier = Barrier(2)

        def award():
            try:
                barrier.wait(timeout=5)
                return services.record_event(user, 'plural_correct')
            finally:
                connections.close_all()

        with ThreadPoolExecutor(max_workers=2) as pool:
            requests = [pool.submit(award) for _ in range(2)]
            results = [request.result(timeout=10) for request in requests]
        self.assertEqual(sum(bool(awards) for awards in results), 1)
        self.assertEqual(PointEvent.objects.filter(user=user, code='plural_correct').count(), 10)
        self.assertEqual(CheckIn.objects.filter(user=user).count(), 1)


class CheckinStatusTests(TestCase):
    """连击计算：含跨月边界、断签、最长连击。"""

    def setUp(self):
        from django.contrib.auth import get_user_model
        self.user = get_user_model().objects.create_user('streaky', password='x')
        self.today = timezone.localdate()

    def _checkin(self, *days_ago):
        for day in days_ago:
            CheckIn.objects.create(user=self.user, date=self.today - timedelta(days=day))

    def test_empty(self):
        status = services.checkin_status(self.user)
        self.assertEqual((status['current'], status['best'], status['days']), (0, 0, 0))

    def test_current_and_best(self):
        for day in (0, 1, 2, 4, 9, 10, 11, 12):
            self._checkin(day)
        status = services.checkin_status(self.user)
        self.assertEqual((status['current'], status['best'], status['days']), (3, 4, 8))

    def test_cross_month_boundary(self):
        """10月30日、31日与11月1日（锚定日）算连续 3 天。"""
        CheckIn.objects.create(user=self.user, date=date(2026, 10, 30))
        CheckIn.objects.create(user=self.user, date=date(2026, 10, 31))
        CheckIn.objects.create(user=self.user, date=date(2026, 11, 1))
        status = services.checkin_status(self.user, today=date(2026, 11, 1))
        self.assertEqual(status['current'], 3)

    def test_gap_today_resets_current_but_keeps_best(self):
        self._checkin(1, 2, 5)  # 今天还没打卡
        status = services.checkin_status(self.user)
        self.assertEqual((status['current'], status['best']), (2, 2))
        self.assertFalse(status['checked_today'])


class BadgeTests(TestCase):
    """勋章按源数据计数判定：追溯补发、未达阈值只显示进度。"""

    def setUp(self):
        from django.contrib.auth import get_user_model
        self.user = get_user_model().objects.create_user('collector', password='x')
        self.today = timezone.localdate()

    def test_streak_badge_from_backdated_checkins(self):
        for days_ago in range(7):
            CheckIn.objects.create(user=self.user, date=self.today - timedelta(days=days_ago))
        fresh = services.refresh_badges(self.user)
        self.assertIn('streak_7', {badge['code'] for badge in fresh})
        self.assertNotIn('streak_21', {badge['code'] for badge in fresh})
        # 已点亮的不再重复发
        self.assertEqual(services.refresh_badges(self.user), [])

    def test_points_badge_counts_positive_events_only(self):
        PointEvent.objects.create(user=self.user, code='redeem', points=-30, note='兑换')
        for _ in range(10):
            PointEvent.objects.create(user=self.user, code='questionbank_correct', points=10, note='答对')
        fresh = services.refresh_badges(self.user)
        self.assertIn('points_100', {badge['code'] for badge in fresh})

    def test_badge_overview_progress(self):
        overview = services.badge_overview(self.user)
        by_code = {badge['code']: badge for badge in overview}
        self.assertFalse(by_code['qb_500']['earned'])
        self.assertEqual((by_code['qb_500']['current'], by_code['qb_500']['target']), (0, 500))


class RedeemTests(TestCase):
    """兑换闭环：扣分下单、余额不足拒绝、下架拒绝、核销与退回。"""

    def setUp(self):
        from django.contrib.auth import get_user_model
        self.user = get_user_model().objects.create_user('saver', password='x')
        self.item = RewardItem.objects.create(name='公园郊游', icon='🎡', cost=50)

    def _grant(self, points):
        PointEvent.objects.create(user=self.user, code='questionbank_correct', points=points, note='答题')

    def test_redeem_success_and_balance(self):
        self._grant(60)
        redemption = services.redeem(self.user, self.item.pk)
        self.assertEqual(redemption.status, Redemption.Status.PENDING)
        self.assertEqual(services.stats_for(self.user)['balance'], 10)
        self.assertEqual(redemption.item_name, '公园郊游')

    def test_redeem_insufficient(self):
        self._grant(10)
        with self.assertRaises(services.RedemptionError):
            services.redeem(self.user, self.item.pk)
        self.assertEqual(Redemption.objects.count(), 0)
        self.assertEqual(services.stats_for(self.user)['balance'], 10)

    def test_redeem_inactive_item(self):
        self.item.is_active = False
        self.item.save()
        self._grant(100)
        with self.assertRaises(services.RedemptionError):
            services.redeem(self.user, self.item.pk)

    def test_cancel_refunds_points(self):
        self._grant(50)
        redemption = services.redeem(self.user, self.item.pk)
        stale = Redemption.objects.get(pk=redemption.pk)
        self.assertEqual(services.stats_for(self.user)['balance'], 0)
        services.cancel_redemption(redemption, note='下雨改期')
        self.assertIsNone(services.cancel_redemption(stale))
        self.assertIsNone(services.mark_redemption_done(stale))
        self.assertEqual(redemption.refresh_from_db() or redemption.status, Redemption.Status.CANCELLED)
        self.assertEqual(services.stats_for(self.user)['balance'], 50)
        self.assertEqual(services.home_summary(self.user)['earned'], 50)
        self.assertEqual(services.stats_for(self.user)['points_earned'], 50)
        self.assertEqual(PointEvent.objects.filter(user=self.user, code='redeem_refund').count(), 1)

    def test_mark_done_keeps_balance_deducted(self):
        self._grant(50)
        redemption = services.redeem(self.user, self.item.pk)
        services.mark_redemption_done(redemption)
        self.assertEqual(redemption.status, Redemption.Status.DONE)
        self.assertEqual(services.stats_for(self.user)['balance'], 0)


class LevelTests(TestCase):
    def test_level_for(self):
        current, nxt = services.level_for(0)
        self.assertEqual(current['name'], '新芽学者')
        current, nxt = services.level_for(600)
        self.assertEqual(current['name'], '学习小达人')
        self.assertEqual(nxt['name'], '博学之星')
        current, nxt = services.level_for(9999)
        self.assertEqual(current['name'], '智慧大师')
        self.assertIsNone(nxt)


class RewardsPageTests(TestCase):
    """奖励页登录门、渲染与首页激励条。"""

    def setUp(self):
        from django.contrib.auth import get_user_model
        self.user = get_user_model().objects.create_user('viewer', password='x-test-123')
        RewardItem.objects.create(name='多读一本课外书', icon='📚', cost=20)

    def test_login_required(self):
        response = self.client.get(reverse('rewards'))
        self.assertEqual(response.status_code, 302)
        self.assertIn('login', response.url)

    def test_page_renders_sections(self):
        self.client.force_login(self.user)
        services.record_event(self.user, 'textbook_mastered')
        response = self.client.get(reverse('rewards'))
        self.assertEqual(response.status_code, 200)
        for text in ('我的奖励', '打卡日历', '勋章墙', '兑换专区', '积分明细', '积分怎么攒', '教材一课标掌握'):
            self.assertContains(response, text)

    def test_home_shows_incentive_strip_when_logged_in(self):
        self.client.force_login(self.user)
        response = self.client.get(reverse('home'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'incentive-strip')

    def test_home_keeps_guest_strip(self):
        response = self.client.get(reverse('home'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'study-strip')


class PluralsReportIntegrationTests(TestCase):
    """端点集成：不规则复数上报，答对发分+打卡+首枚勋章，答错不发，游客零激励。"""

    def setUp(self):
        from django.contrib.auth import get_user_model
        self.user = get_user_model().objects.create_user('player', password='x-test-123')
        from plurals.plurals import practice_items
        self.question = practice_items()[0]
        self.answer = self.question['plural']

    def post_report(self, chosen=None):
        return self.client.post('/plurals/api/report/', data={
            'singular': self.question['singular'],
            'chosen': chosen if chosen is not None else self.answer,
            'answer': self.answer,
        }, content_type='application/json')

    def test_correct_answer_awards(self):
        self.client.force_login(self.user)
        response = self.post_report()
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload['ok'], True)
        types = [award['type'] for award in payload['rewards']]
        self.assertIn('points', types)
        self.assertIn('badge', types)  # 首次打卡勋章
        self.assertTrue(PointEvent.objects.filter(user=self.user, code='plural_correct').exists())
        self.assertTrue(CheckIn.objects.filter(user=self.user).exists())

    def test_wrong_answer_records_without_rewards(self):
        self.client.force_login(self.user)
        wrong = next(option for option in self.question['options'] if option != self.answer)
        response = self.post_report(chosen=wrong)
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('rewards', response.json())
        self.assertEqual(PointEvent.objects.count(), 0)
        self.assertEqual(CheckIn.objects.count(), 0)  # 没有被记分的学习动作就不打卡

    def test_guest_gets_nothing(self):
        response = self.post_report()
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('rewards', response.json())
        self.assertEqual(PointEvent.objects.count(), 0)
        self.assertEqual(CheckIn.objects.count(), 0)
        self.assertEqual(BadgeAward.objects.count(), 0)


class HookServiceTests(TestCase):
    """代表性挂钩服务层：成语 record_play 与作文 save_draft 的跃迁口径。"""

    def setUp(self):
        from django.contrib.auth import get_user_model
        self.user = get_user_model().objects.create_user('hooked', password='x-test-123')

    def _request(self):
        return auth_request(self.user, '/idioms/quiz/api/report/')

    def test_quiz_correct_only(self):
        from idioms.records import record_play
        from idioms.models import PlayRecord
        record_play(self._request(), game=PlayRecord.Game.QUIZ, size=1, correct=1, extra={})
        record_play(self._request(), game=PlayRecord.Game.QUIZ, size=1, correct=0, extra={})
        self.assertEqual(PointEvent.objects.filter(user=self.user, code='idiom_quiz_correct').count(), 1)

    def test_pairs_round_awards_on_finish(self):
        from idioms.records import record_play
        from idioms.models import PlayRecord
        record_play(self._request(), game=PlayRecord.Game.PAIRS, size=5, correct=4, extra={})
        self.assertEqual(PointEvent.objects.filter(user=self.user, code='idiom_pairs_round').count(), 1)

    def test_textbook_rewards_transition_matrix(self):
        from learning.views import _textbook_rewards
        # 掌握跃迁：new → mastered 发掌握分
        awards = _textbook_rewards(self._request(), 'new', 'mastered', False, {})
        self.assertEqual([a['type'] for a in awards], ['points', 'checkin', 'badge'])
        self.assertEqual(PointEvent.objects.filter(user=self.user, code='textbook_mastered').count(), 1)
        # 再次保存 mastered 不重发；开始学习也不再发（已是掌握态）
        self.assertEqual(_textbook_rewards(self._request(), 'mastered', 'mastered', False, {}), [])
        # 收藏/笔记单独保存（update_learning 未勾选）不发分
        self.assertEqual(_textbook_rewards(self._request(), 'new', 'mastered', True, {'update_learning': False}), [])
        # new → learning 发开始分
        PointEvent.objects.all().delete()
        awards = _textbook_rewards(self._request(), 'new', 'learning', False, {})
        self.assertEqual(PointEvent.objects.filter(user=self.user, code='textbook_started').count(), 1)

    def test_writing_draft_new_only(self):
        from writing.services import save_draft
        request = auth_request(self.user, '/writing/api/drafts/')
        data = {'title': '我的周末', 'content': '今天我和家人去了公园，玩得很开心。'}
        draft = save_draft(request, data)
        self.assertEqual(PointEvent.objects.filter(user=self.user, code='writing_draft').count(), 1)
        save_draft(request, {'title': '我的周末（改）', 'content': '改一句。', 'revision': draft.revision}, draft=draft)
        self.assertEqual(PointEvent.objects.filter(user=self.user, code='writing_draft').count(), 1)

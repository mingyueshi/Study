from datetime import datetime, timedelta
from unittest.mock import patch
from uuid import uuid4
from zoneinfo import ZoneInfo

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.db import connection
from django.test import RequestFactory, override_settings
from django.test.utils import CaptureQueriesContext

from catalog.models import ContentItem
from catalog.tests import PlatformFixture
from incentives.models import CheckIn, Redemption, RewardItem
from learning.models import Progress
from questionbank.models import AnswerRecord, Question

from .admin_dashboard import build_dashboard
from .admin_navigation import badges


class AdminDashboardTests(PlatformFixture):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.manager = get_user_model().objects.create_superuser('dashboard-manager', password=None)
        cls.learner = get_user_model().objects.create_user('dashboard-learner')
        cls.editor = get_user_model().objects.create_user('dashboard-editor', is_staff=True)
        cls.editor.user_permissions.add(Permission.objects.get(codename='view_contentitem'))
        cls.now = datetime(2026, 11, 14, 12, tzinfo=ZoneInfo('Asia/Shanghai'))
        cls.start = datetime(2026, 11, 8, tzinfo=ZoneInfo('Asia/Shanghai'))
        cls.end = datetime(2026, 11, 15, tzinfo=ZoneInfo('Asia/Shanghai'))
        ContentItem.objects.create(module=cls.item.module, title='待整理', status='draft')
        Progress.objects.create(user=cls.learner, item=cls.item, status='mastered')
        CheckIn.objects.create(user=cls.learner, date=cls.start.date())
        CheckIn.objects.create(user=cls.learner, date=cls.now.date())
        CheckIn.objects.create(user=cls.learner, date=cls.start.date() - timedelta(days=1))
        CheckIn.objects.create(user=cls.learner, date=cls.end.date())
        cls.question = Question.objects.create(uuid=uuid4(), type='choice', area='math',
                                               stem='一加一', payload={}, source_key='test', source_ref='q1')
        selfcheck = Question.objects.create(uuid=uuid4(), type='selfcheck', area='chinese',
                                             stem='试着朗读', payload={}, source_key='test', source_ref='q2')
        for question, when, correct, guest in [
            (cls.question, cls.start, True, False),
            (cls.question, cls.now, False, True),
            (selfcheck, cls.now, True, False),
            (cls.question, cls.start - timedelta(microseconds=1), True, False),
            (cls.question, cls.end, True, False),
        ]:
            answer = AnswerRecord.objects.create(question=question, correct=correct,
                                                 user=None if guest else cls.learner,
                                                 guest_key='test-guest' if guest else '')
            AnswerRecord.objects.filter(pk=answer.pk).update(created_at=when)
        reward = RewardItem.objects.create(name='公园散步', cost=10)
        for when, status in [(cls.now, 'done'), (cls.start - timedelta(days=1), 'pending')]:
            redemption = Redemption.objects.create(user=cls.learner, item=reward,
                                                    item_name=reward.name, cost=10, status=status)
            Redemption.objects.filter(pk=redemption.pk).update(requested_at=when)

    def build(self, user=None, period='7'):
        request = RequestFactory().get('/admin/', {'period': period})
        request.user = user or self.manager
        return build_dashboard(request, admin.site, now=self.now)

    def test_counts_date_boundaries_guests_and_self_assessment(self):
        data = self.build()
        metrics = {row['key']: row for row in data['metrics']}
        charts = {row['key']: row for row in data['charts']}
        self.assertEqual(metrics['learners']['value'], 1)
        self.assertEqual(metrics['active']['value'], 1)
        self.assertEqual(metrics['answers']['value'], 3)
        self.assertEqual(metrics['accuracy']['value'], '50.0%')
        self.assertEqual(metrics['pending']['value'], 1)  # 全部待办，不受所选时段限制。
        self.assertEqual(charts['activity']['series'][0]['data'], [1, 0, 0, 0, 0, 0, 1])
        self.assertEqual(charts['answers']['series'][0]['data'], [1, 0, 0, 0, 0, 0, 0])
        self.assertEqual(charts['answers']['series'][1]['data'], [0, 0, 0, 0, 0, 0, 1])
        self.assertEqual(charts['answers']['series'][2]['data'], [0, 0, 0, 0, 0, 0, 1])
        self.assertEqual(charts['rewards']['series'][0]['data'], [0, 1, 0])
        self.assertEqual(charts['progress']['series'][0]['data'], [0, 0, 1])
        for chart in data['charts']:
            self.assertTrue(all(len(series['data']) == len(chart['labels']) for series in chart['series']))

    def test_editor_cannot_read_or_query_private_statistics(self):
        with CaptureQueriesContext(connection) as queries:
            data = self.build(self.editor)
        self.assertEqual([row['key'] for row in data['metrics']], ['published'])
        self.assertEqual([row['key'] for row in data['charts']], ['content'])
        for query in queries:
            self.assertNotIn('"learning_progress"', query['sql'])
            self.assertNotIn('"incentives_', query['sql'])
            self.assertNotIn('"questionbank_', query['sql'])
        self.client.force_login(self.editor)
        for path in ['/admin/', '/admin/_dashboard/data/?period=7']:
            response = self.client.get(path)
            self.assertEqual(response.status_code, 200)
            body = response.json()['html'] if path.startswith('/admin/_') else response.content.decode()
            self.assertIn('内容发布情况', body)
            self.assertNotIn('教材掌握情况', body)
            self.assertNotIn('打卡人数', body)
            self.assertNotIn('题库作答', body)

    def test_model_admin_restrictions_override_granted_progress_permission(self):
        self.editor.user_permissions.add(Permission.objects.get(codename='view_progress'))
        self.assertNotIn('progress', [row['key'] for row in self.build(self.editor)['charts']])

    def test_model_admin_queryset_also_limits_aggregate_counts(self):
        scoped = ContentItem.objects.filter(status='draft')
        with patch.object(admin.site._registry[ContentItem], 'get_queryset', return_value=scoped):
            data = self.build(self.editor)
        self.assertEqual(data['metrics'][0]['value'], 0)
        self.assertEqual(data['charts'][0]['series'][0]['data'], [1, 0, 0])

    def test_staff_without_model_permissions_gets_empty_state(self):
        staff = get_user_model().objects.create_user('no-permissions', is_staff=True)
        data = self.build(staff)
        self.assertEqual(data['metrics'], [])
        self.assertEqual(data['charts'], [])
        self.client.force_login(staff)
        self.assertContains(self.client.get('/admin/'), '当前账号还没有可查看的统计数据')

    def test_anonymous_and_learners_cannot_access_refresh_endpoint(self):
        self.assertEqual(self.client.get('/admin/_dashboard/data/').status_code, 302)
        self.client.force_login(self.learner)
        self.assertEqual(self.client.get('/admin/_dashboard/data/').status_code, 302)

    def test_index_refresh_and_metric_links_use_same_admin_permissions(self):
        self.client.force_login(self.manager)
        response = self.client.get('/admin/?period=7')
        self.assertContains(response, '学习数据总览')
        self.assertContains(response, 'study-dashboard.js')
        self.assertContains(response, '全部管理入口')
        refresh = self.client.get('/admin/_dashboard/data/?period=7')
        self.assertEqual(refresh.status_code, 200)
        self.assertIn('no-store', refresh['Cache-Control'])
        self.assertEqual(refresh.json()['period'], 7)
        self.assertIn('study-dashboard-charts', refresh.json()['html'])
        self.assertEqual(self.client.post('/admin/_dashboard/data/').status_code, 405)
        for metric in response.context['dashboard']['metrics']:
            self.assertEqual(self.client.get(metric['url']).status_code, 200, metric['url'])

    def test_empty_records_show_no_fabricated_accuracy(self):
        AnswerRecord.objects.all().delete()
        data = self.build()
        self.assertEqual(next(row['value'] for row in data['metrics'] if row['key'] == 'accuracy'), '—')
        self.assertFalse(next(row for row in data['charts'] if row['key'] == 'answers')['has_data'])

    def test_period_is_bounded_and_query_count_does_not_grow_with_days(self):
        self.assertEqual(self.build(period='100000000')['period'], 30)
        self.assertEqual(self.build(period='bad')['period'], 30)
        with CaptureQueriesContext(connection) as queries:
            data = self.build(period='90')
        self.assertEqual(len(next(row for row in data['charts'] if row['key'] == 'activity')['rows']), 90)
        self.assertLessEqual(len(queries), 20)

    def test_native_mode_and_disabled_theme_keep_original_index(self):
        self.client.force_login(self.manager)
        with override_settings(NOVA_ADMIN_ENABLED=False):
            with patch('config.admin_site.build_dashboard', side_effect=AssertionError('应跳过统计查询')):
                self.assertNotContains(self.client.get('/admin/'), 'study-dashboard.js')
        session = self.client.session
        session['nova_admin_mode'] = 'native'
        session.save()
        self.assertNotContains(self.client.get('/admin/'), 'study-dashboard.js')

    def test_lists_do_not_load_print_controls_or_assets(self):
        self.client.force_login(self.manager)
        for path in ['/admin/catalog/contentitem/', '/admin/questionbank/question/', '/admin/accounts/user/']:
            response = self.client.get(path)
            self.assertEqual(response.status_code, 200)
            self.assertNotContains(response, '打印当前页')
            self.assertNotContains(response, 'nova_admin/print.js')
            self.assertNotContains(response, 'nova_admin/print.css')

    def test_navigation_redemption_count_respects_model_permissions(self):
        request = RequestFactory().get('/admin/')
        request.user = self.manager
        self.assertEqual(badges(request, [])['incentives.redemption'], 1)
        request.user = self.editor
        self.assertNotIn('incentives.redemption', badges(request, []))

    def test_appearance_route_is_mounted_and_retains_print_setting(self):
        self.client.force_login(self.manager)
        self.assertContains(self.client.get('/admin/'), '/admin/_nova/preference/')
        response = self.client.post('/admin/_nova/preference/', {'mode': 'dark', 'palette': 'violet', 'next': '/admin/'})
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, '/admin/')
        self.assertContains(self.client.get('/admin/'), 'nova-mode-dark nova-palette-violet')
        self.assertNotContains(self.client.get('/admin/catalog/contentitem/'), 'nova_admin/print.js')

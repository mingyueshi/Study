"""不规则复数专题测试：数据契约、出题确定性、页面只读与 report 拒伪。"""
import json
import random

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db import IntegrityError, transaction
from django.test import SimpleTestCase, TestCase
from django.urls import reverse

from . import plurals
from .models import PluralAnswer


class PluralDataTests(SimpleTestCase):
    def test_schema_and_scale(self):
        data = plurals.load_data()
        self.assertEqual(data['schema_version'], 1)
        self.assertEqual(data['source']['name'], '乐学堂教学词表')
        self.assertGreaterEqual(len(data['items']), 60)
        self.assertGreaterEqual(len(data['groups']), 4)

    def test_items_unique_and_tiered(self):
        data = plurals.load_data()
        singulars = [item['singular'] for item in data['items']]
        self.assertEqual(len(singulars), len(set(singulars)))
        core = [item for item in data['items'] if item['tier'] == 'core']
        self.assertGreaterEqual(len(core), 20)
        for item in data['items']:
            self.assertTrue(item['plural'], item['singular'])
            self.assertTrue(item['zh'], item['singular'])
            self.assertIn(item['group'], {group['code'] for group in data['groups']})

    def test_same_form_group_consistent(self):
        # 单复同形组的词 plural == singular；其余组必须变形。
        for item in plurals.load_data()['items']:
            if item['group'] == 'same':
                self.assertEqual(item['singular'], item['plural'], item['singular'])
            else:
                self.assertNotEqual(item['singular'], item['plural'], item['singular'])

    def test_text_is_chinese_punctuation_and_tag_free(self):
        for item in plurals.load_data()['items']:
            for text in plurals._walk_strings(item):
                self.assertNotIn('"', text, item['singular'])
                self.assertNotRegex(text, r'[\n\r]', item['singular'])
                self.assertNotRegex(text, r'<[a-zA-Z]', item['singular'])

    def test_practice_options_contain_answer(self):
        for item in plurals.practice_items():
            self.assertIn(item['plural'], item['options'], item['singular'])
            self.assertGreaterEqual(len(item['options']), 2, item['singular'])
            self.assertEqual(len(item['options']), len(set(item['options'])), item['singular'])

    def test_option_set_is_deterministic(self):
        items = plurals.load_data()['items']
        first = plurals.option_forms(items[0], items)
        self.assertEqual(first, plurals.option_forms(items[0], items))

    def test_validate_rejects_drift(self):
        data = plurals.load_data()
        with self.assertRaises(ImproperlyConfigured):
            plurals.validate({**data, 'schema_version': 2})
        with self.assertRaises(ImproperlyConfigured):
            plurals.validate({**data, 'items': data['items'][:5]})
        broken = {**data['items'][0], 'tier': 'premium'}
        with self.assertRaises(ImproperlyConfigured):
            plurals.validate({**data, 'items': [broken] + data['items'][1:]})


class PluralRoundTests(SimpleTestCase):
    def test_seeded_round_is_reproducible(self):
        first = plurals.practice_round(random.Random('x1'))
        second = plurals.practice_round(random.Random('x1'))
        self.assertEqual(first['singular'], second['singular'])
        self.assertEqual(first['options'], second['options'])

    def test_round_comes_from_core_pool(self):
        pool = plurals.practice_pool()
        for _ in range(20):
            self.assertIn(plurals.practice_round(random.Random())['singular'], pool)


class PluralPageTests(TestCase):
    def test_page_renders_browse_and_practice(self):
        response = self.client.get(reverse('plurals'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '不规则复数')
        self.assertContains(response, 'data-plural-option')
        self.assertContains(response, 'data-plural-card')
        self.assertEqual(response.context['total'], 70)
        self.assertEqual(response.context['core_count'], 27)

    def test_seeded_page_is_reproducible(self):
        first = self.client.get(reverse('plurals'), {'q_seed': 'abc'}).context['round']
        second = self.client.get(reverse('plurals'), {'q_seed': 'abc'}).context['round']
        self.assertEqual(first['singular'], second['singular'])
        self.assertEqual(first['options'], second['options'])

    def test_page_is_read_only(self):
        # 只读浏览：GET 不得创建会话（记录只走 report POST 路径）。
        response = self.client.get(reverse('plurals'))
        self.assertNotIn(settings.SESSION_COOKIE_NAME, response.cookies)


class PluralReportTests(TestCase):
    def post_report(self, payload):
        return self.client.post(reverse('plurals-report'), data=json.dumps(payload),
                                content_type='application/json')

    def test_report_recomputes_correctness(self):
        response = self.post_report({'singular': 'man', 'chosen': 'men', 'answer': 'men'})
        self.assertEqual(response.status_code, 200)
        record = PluralAnswer.objects.get()
        self.assertTrue(record.correct)
        self.assertEqual(record.chosen, 'men')

    def test_report_ignores_frontend_verdict(self):
        # 前端谎报 correct=False：服务端按 chosen == answer 重算为答对。
        self.post_report({'singular': 'foot', 'chosen': 'feet', 'answer': 'feet', 'correct': False})
        self.assertTrue(PluralAnswer.objects.get().correct)

    def test_report_rejects_fakes(self):
        # 池外词（拓展层 ox）、伪形态、非选项答案都拒绝且不落库。
        self.assertEqual(self.post_report({'singular': 'ox', 'chosen': 'oxen', 'answer': 'oxen'}).status_code, 400)
        self.assertEqual(self.post_report({'singular': 'man', 'chosen': 'womans', 'answer': 'men'}).status_code, 400)
        self.assertEqual(self.post_report({'singular': 'man', 'chosen': 'xyzz', 'answer': 'men'}).status_code, 400)
        self.assertEqual(self.post_report({'singular': 'man', 'chosen': 'men'}).status_code, 400)
        self.assertEqual(self.client.get(reverse('plurals-report')).status_code, 405)
        self.assertEqual(PluralAnswer.objects.count(), 0)

    def test_guest_session_created_on_first_post(self):
        response = self.post_report({'singular': 'man', 'chosen': 'men', 'answer': 'men'})
        self.assertIn(settings.SESSION_COOKIE_NAME, response.cookies)
        record = PluralAnswer.objects.get()
        self.assertTrue(record.guest_key)
        self.assertEqual(record.answer, 'men')


class PluralAnswerModelTests(TestCase):
    def test_owner_exclusive_constraint(self):
        from accounts.models import User

        user = User.objects.create_user(username='kid', password='x' * 12)
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                PluralAnswer.objects.create(user=user, guest_key='g-1', singular='man',
                                            chosen='men', answer='men', correct=True)

    def test_str(self):
        record = PluralAnswer.objects.create(guest_key='g-1', singular='man', chosen='mans', answer='men')
        self.assertIn('答错', str(record))

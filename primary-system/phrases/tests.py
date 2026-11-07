"""日常用语专题测试：数据契约、出题确定性、页面只读与 report 拒伪。"""
import json
import random

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db import IntegrityError, transaction
from django.test import SimpleTestCase, TestCase
from django.urls import reverse

from . import phrases
from .models import PhraseAnswer


class PhraseDataTests(SimpleTestCase):
    def test_schema_and_scale(self):
        data = phrases.load_data()
        self.assertEqual(data['schema_version'], 1)
        self.assertEqual(data['source']['name'], 'primary-english-phrases')
        self.assertGreaterEqual(len(data['items']), 400)
        self.assertGreaterEqual(len(data['scenarios']), 4)
        self.assertGreaterEqual(len(data['patterns']), 10)

    def test_items_unique_and_valid(self):
        data = phrases.load_data()
        ids = [item['id'] for item in data['items']]
        ens = [item['en'] for item in data['items']]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertEqual(len(ens), len(set(ens)))
        scenarios = {scenario['code'] for scenario in data['scenarios']}
        patterns = {pattern['code'] for pattern in data['patterns']} | {None}
        core = 0
        for item in data['items']:
            self.assertIn(item['scenario'], scenarios, item['id'])
            self.assertIn(item['pattern'], patterns, item['id'])
            self.assertIn(item['tier'], ('core', 'extended'), item['id'])
            self.assertTrue(item['en'] and item['zh'], item['id'])
            if item['tier'] == 'core':
                core += 1
                self.assertTrue(item['pattern'], item['id'])
        self.assertGreaterEqual(core, 50)

    def test_text_is_chinese_punctuation_and_tag_free(self):
        for item in phrases.load_data()['items']:
            for text in phrases._walk_strings(item):
                self.assertNotIn('"', text, item['id'])
                self.assertNotRegex(text, r'[\n\r]', item['id'])
                self.assertNotRegex(text, r'<[a-zA-Z]', item['id'])

    def test_practice_options_contain_answer(self):
        for item in phrases.practice_items():
            self.assertIn(item['en'], item['options'], item['id'])
            self.assertGreaterEqual(len(item['options']), 2, item['id'])
            self.assertLessEqual(len(item['options']), 4, item['id'])
            self.assertEqual(len(item['options']), len(set(item['options'])), item['id'])

    def test_option_set_is_deterministic(self):
        items = phrases.load_data()['items']
        first = phrases.option_forms(items[0], items)
        self.assertEqual(first, phrases.option_forms(items[0], items))

    def test_validate_rejects_drift(self):
        data = phrases.load_data()
        with self.assertRaises(ImproperlyConfigured):
            phrases.validate({**data, 'schema_version': 2})
        with self.assertRaises(ImproperlyConfigured):
            phrases.validate({**data, 'items': data['items'][:5]})
        broken = {**data['items'][0], 'scenario': 'u-nowhere'}
        with self.assertRaises(ImproperlyConfigured):
            phrases.validate({**data, 'items': [broken] + data['items'][1:]})


class PhraseRoundTests(SimpleTestCase):
    def test_seeded_round_is_reproducible(self):
        first = phrases.practice_round(random.Random('x1'))
        second = phrases.practice_round(random.Random('x1'))
        self.assertEqual(first['id'], second['id'])
        self.assertEqual(first['options'], second['options'])

    def test_round_comes_from_core_pool(self):
        pool = phrases.practice_pool()
        for _ in range(20):
            self.assertIn(phrases.practice_round(random.Random())['id'], pool)


class PhrasePageTests(TestCase):
    def test_page_renders_practice_and_view_chips(self):
        response = self.client.get(reverse('phrases'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '日常用语')
        self.assertContains(response, 'data-phrases-option')
        self.assertContains(response, 'data-phrases-view')
        self.assertEqual(response.context['total'], 597)
        self.assertEqual(response.context['core_count'], 141)

    def test_seeded_page_is_reproducible(self):
        first = self.client.get(reverse('phrases'), {'q_seed': 'abc'}).context['round']
        second = self.client.get(reverse('phrases'), {'q_seed': 'abc'}).context['round']
        self.assertEqual(first['id'], second['id'])
        self.assertEqual(first['options'], second['options'])

    def test_page_is_read_only(self):
        response = self.client.get(reverse('phrases'))
        self.assertNotIn(settings.SESSION_COOKIE_NAME, response.cookies)


class PhraseReportTests(TestCase):
    def post_report(self, payload):
        return self.client.post(reverse('phrases-report'), data=json.dumps(payload),
                                content_type='application/json')

    def test_report_recomputes_correctness(self):
        item = phrases.practice_items()[0]
        response = self.post_report({'id': item['id'], 'chosen': item['en'], 'answer': item['en']})
        self.assertEqual(response.status_code, 200)
        record = PhraseAnswer.objects.get()
        self.assertTrue(record.correct)

    def test_report_ignores_frontend_verdict(self):
        item = phrases.practice_items()[0]
        self.post_report({'id': item['id'], 'chosen': item['en'], 'answer': item['en'], 'correct': False})
        self.assertTrue(PhraseAnswer.objects.get().correct)

    def test_report_rejects_fakes(self):
        item = phrases.practice_items()[0]
        self.assertEqual(self.post_report({'id': 'ph-notreal', 'chosen': item['en'], 'answer': item['en']}).status_code, 400)
        self.assertEqual(self.post_report({'id': item['id'], 'chosen': 'Not an option', 'answer': item['en']}).status_code, 400)
        self.assertEqual(self.post_report({'id': item['id'], 'chosen': item['en']}).status_code, 400)
        self.assertEqual(self.client.get(reverse('phrases-report')).status_code, 405)
        self.assertEqual(PhraseAnswer.objects.count(), 0)

    def test_guest_session_created_on_first_post(self):
        item = phrases.practice_items()[0]
        response = self.post_report({'id': item['id'], 'chosen': item['en'], 'answer': item['en']})
        self.assertIn(settings.SESSION_COOKIE_NAME, response.cookies)
        self.assertTrue(PhraseAnswer.objects.get().guest_key)


class PhraseAnswerModelTests(TestCase):
    def test_owner_exclusive_constraint(self):
        from accounts.models import User

        user = User.objects.create_user(username='kid', password='x' * 12)
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                PhraseAnswer.objects.create(user=user, guest_key='g-1', phrase='ph-1',
                                            chosen='a', answer='a', correct=True)

    def test_str(self):
        record = PhraseAnswer.objects.create(guest_key='g-1', phrase='ph-1', chosen='a', answer='b')
        self.assertIn('答错', str(record))

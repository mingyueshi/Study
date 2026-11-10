import json
from copy import deepcopy

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase, TestCase
from django.urls import reverse

from .clinics import SOURCE, load_clinics, sentence_rounds, word_rounds
from .content import load_book


class ClinicDataTests(SimpleTestCase):
    def setUp(self):
        self.data = json.loads(SOURCE.read_text(encoding='utf-8'))
        self.book = load_book('4a')['kb']

    def test_cases_use_textbook_options(self):
        hospital, clinic = load_clinics()
        self.assertEqual(len(hospital['cases']), 18)
        shapes = [case for case in clinic['cases'] if case['cause'] == 'shape']
        readings = [case for case in clinic['cases'] if case['cause'] == 'reading']
        self.assertEqual(len(shapes), 20)
        self.assertEqual(len(readings), 16)
        embankment = next(case for case in shapes if case['id'] == 'shape-embankment')
        self.assertEqual(embankment['options'], ['堤', '提', '题'])
        self.assertIn('江提', embankment['prompt'])
        self.assertIn('江堤', embankment['result'])
        tie = next(case for case in readings if case['id'] == 'reading-tie')
        self.assertEqual(tie['options'], ['jì', 'xì'])
        self.assertEqual(tie['answer'], 'jì')

    def test_rejects_invalid_options_and_unregistered_cause(self):
        case = self.data['sentences'][0]
        for changes in ({'cause': 'unknown'}, {'options': ['甲', '乙', '丙']}, {'prompt': '第一行\n第二行'}):
            with self.subTest(changes=changes), self.assertRaises(ImproperlyConfigured):
                sentence_rounds({**self.data, 'sentences': [{**case, **changes}, *self.data['sentences'][1:]]})

    def test_rejects_removed_textbook_word(self):
        book = deepcopy(self.book)
        book['polyphonic'] = [row for row in book['polyphonic'] if row[0] != '系']
        with self.assertRaisesMessage(ImproperlyConfigured, 'reading-tie'):
            word_rounds(self.data, book)


class ClinicPageTests(TestCase):
    def test_chinese_catalog_and_book_link_to_both_clinics(self):
        for url in (reverse('home') + '?area=chinese', reverse('chinesebook-book', args=['4a'])):
            response = self.client.get(url)
            for name in ('sentence-hospital', 'typo-clinic'):
                self.assertContains(response, f'href="{reverse(name)}"')

    def test_clinic_pages_render_for_guests_without_creating_sessions(self):
        for name, title, peer in (
            ('sentence-hospital', '病句医院', 'typo-clinic'),
            ('typo-clinic', '错别字诊所', 'sentence-hospital'),
        ):
            with self.subTest(name=name):
                url = reverse(name)
                response = self.client.get(url)
                self.assertContains(response, title)
                self.assertContains(response, 'id="clinic-data"')
                self.assertContains(response, 'chinesebook/clinic.js')
                self.assertContains(response, reverse(peer))
                self.assertNotIn(settings.SESSION_COOKIE_NAME, response.cookies)
                self.assertEqual(self.client.post(url).status_code, 405)

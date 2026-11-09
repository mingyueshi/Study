from datetime import date
from urllib.parse import urlsplit

from django.contrib.staticfiles import finders
from django.test import SimpleTestCase, TestCase
from django.urls import reverse

from .content import load_cases


def iter_strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for item in value.values():
            yield from iter_strings(item)
    elif isinstance(value, list):
        for item in value:
            yield from iter_strings(item)


class MysteryContentTests(SimpleTestCase):
    def test_case_contract(self):
        cases = load_cases()
        self.assertTrue({'mars-life', 'dark-matter', 'deep-ocean', 'voynich'} <= set(cases))
        self.assertTrue(cases['mars-life']['background'])
        for slug, case in cases.items():
            with self.subTest(slug=slug):
                self.assertRegex(slug, r'^[a-z]+(?:-[a-z]+)*$')
                for field in ('title', 'category', 'icon', 'summary', 'opening', 'known',
                              'unresolved', 'next_step', 'deep_dive'):
                    self.assertTrue(case[field].strip(), field)
                date.fromisoformat(case['checked_on'])
                figure = case['figure']
                self.assertTrue(finders.find(figure['path']))
                self.assertTrue(figure['alt'].strip())
                self.assertTrue(figure['caption'].strip())
                self.assertTrue(figure['credit'].strip())
                if 'detail_path' in figure:
                    self.assertTrue(finders.find(figure['detail_path']))
                    self.assertTrue(figure['detail_alt'].strip())
                    self.assertTrue(figure['detail_label'].strip())
                    self.assertTrue(figure['detail_prompt'].strip())
                sources = case['sources']
                self.assertGreaterEqual(len(sources), 2)
                for source in sources:
                    url = urlsplit(source['url'])
                    self.assertEqual(url.scheme, 'https')
                    self.assertTrue(url.netloc)
                    self.assertTrue(source['title'].strip())
                if 'background' in case:
                    background = case['background']
                    for field in ('title', 'intro', 'transition'):
                        self.assertTrue(background[field].strip(), field)
                    self.assertTrue(background['facts'])
                    for fact in background['facts']:
                        self.assertTrue(fact['title'].strip())
                        self.assertTrue(fact['text'].strip())
                    self.assertTrue(background['sources'])
                    for number in background['sources']:
                        self.assertIn(number, range(1, len(sources) + 1))
                self.assertIn(figure['source'], range(1, len(sources) + 1))
                self.assertIn(len(case['evidence']), range(3, 6))
                for clue in case['evidence']:
                    self.assertIn(clue['source'], range(1, len(sources) + 1))
                    for field in ('title', 'observation', 'meaning'):
                        self.assertTrue(clue[field].strip())
                self.assertTrue(case['challenge']['prompt'].strip())
                choices = case['challenge']['choices']
                self.assertEqual(len(choices), 3)
                self.assertEqual(sum(choice['correct'] is True for choice in choices), 1)
                for choice in choices:
                    self.assertIsInstance(choice['correct'], bool)
                    self.assertTrue(choice['label'].strip())
                    self.assertTrue(choice['feedback'].strip())
                for value in iter_strings(case):
                    self.assertNotRegex(value, r'["\r\n]|<[a-zA-Z/!?]')


class MysteryPageTests(SimpleTestCase):
    def test_index_links_to_all_cases_without_session(self):
        response = self.client.get(reverse('mysteries'))
        self.assertContains(response, '未解之谜研究所')
        self.assertFalse(response.cookies)
        for slug, case in load_cases().items():
            self.assertContains(response, reverse('mystery-case', args=[slug]))
            self.assertContains(response, case['title'])

    def test_cases_render_evidence_feedback_and_sources_without_database(self):
        for slug, case in load_cases().items():
            with self.subTest(slug=slug):
                response = self.client.get(reverse('mystery-case', args=[slug]))
                self.assertContains(response, case['opening'])
                self.assertContains(response, case['unresolved'])
                if 'background' in case:
                    background = case['background']
                    self.assertContains(response, 'href="#background"', count=1)
                    for field in ('title', 'intro', 'transition'):
                        self.assertContains(response, background[field])
                    for fact in background['facts']:
                        self.assertContains(response, fact['title'])
                        self.assertContains(response, fact['text'])
                    html = response.content.decode()
                    self.assertLess(html.index('id="background"'), html.index('id="evidence"'))
                else:
                    self.assertNotContains(response, 'id="background"')
                self.assertContains(response, 'name="mystery-choice"', count=3)
                for choice in case['challenge']['choices']:
                    self.assertContains(response, choice['feedback'])
                for number in range(1, len(case['sources']) + 1):
                    self.assertContains(response, f'id="source-{number}"', count=1)
                    self.assertContains(response, f'href="#source-{number}"')
                self.assertFalse(response.cookies)

    def test_missing_case_and_unsafe_methods(self):
        self.assertEqual(self.client.get(reverse('mystery-case', args=['missing'])).status_code, 404)
        self.assertEqual(self.client.post(reverse('mystery-case', args=['mars-life'])).status_code, 405)


class MysteryHomeEntryTests(TestCase):
    def test_home_science_filter_links_to_mysteries(self):
        response = self.client.get(reverse('home'), {'area': 'science'})
        self.assertContains(response, '未解之谜研究所')
        self.assertContains(response, f'href="{reverse("mysteries")}"')

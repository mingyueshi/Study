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
    def assert_local_figure(self, figure, sources):
        self.assertTrue(finders.find(figure['path']))
        for field in ('alt', 'caption', 'credit'):
            self.assertTrue(figure[field].strip(), field)
        self.assertIn(figure['source'], range(1, len(sources) + 1))

    def assert_local_media(self, item, sources):
        self.assert_local_figure(item, sources)
        self.assertTrue(item['title'].strip())
        kind = item['kind']
        self.assertIn(kind, ('video', 'animation', 'audio', 'diagram'))
        if kind == 'diagram':
            self.assertIn(len(item['steps']), range(2, 5))
            for step in item['steps']:
                self.assertTrue(step['label'].strip())
                self.assertTrue(step['text'].strip())
                for axis in ('x', 'y'):
                    self.assertIs(type(step[axis]), int)
                    self.assertIn(step[axis], range(5, 96))
        else:
            self.assertTrue(finders.find(item['poster']))
            extension = {'video': '.mp4', 'animation': '.gif', 'audio': '.mp3'}[kind]
            self.assertTrue(item['path'].endswith(extension))

    def assert_depth_explorer(self, explorer, sources):
        for field in ('title', 'intro', 'scale_note'):
            self.assertTrue(explorer[field].strip(), field)
        self.assertIn(explorer['source'], range(1, len(sources) + 1))
        self.assertEqual(explorer['approximate_limit'], 11000)
        layers = explorer['layers']
        self.assertEqual(
            [(layer['minimum'], layer['maximum']) for layer in layers],
            [(0, 200), (200, 1000), (1000, 4000), (4000, 6000), (6000, None)],
        )
        for layer in layers:
            for field in ('name', 'condition', 'description'):
                self.assertTrue(layer[field].strip(), field)
            self.assertIn(len(layer['animals']), range(1, 4))
            for animal in layer['animals']:
                self.assert_local_figure(animal, sources)
                self.assertTrue(animal['title'].strip())
                self.assertTrue(animal['depth_note'].strip())

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
                sources = case['sources']
                self.assertIn(len(case['open_questions']), range(2, 4))
                for question in case['open_questions']:
                    for field in ('question', 'gap'):
                        self.assertTrue(question[field].strip(), field)
                    self.assertIn(question['source'], range(1, len(sources) + 1))
                self.assert_local_figure(figure, sources)
                if 'detail_path' in figure:
                    self.assertTrue(finders.find(figure['detail_path']))
                    self.assertTrue(figure['detail_alt'].strip())
                    self.assertTrue(figure['detail_label'].strip())
                    self.assertTrue(figure['detail_prompt'].strip())
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
                self.assertIn(len(case['evidence']), range(3, 6))
                for clue in case['evidence']:
                    self.assertIn(clue['source'], range(1, len(sources) + 1))
                    for field in ('title', 'observation', 'meaning'):
                        self.assertTrue(clue[field].strip())
                    if 'image' in clue:
                        self.assert_local_figure(clue['image'], sources)
                for item in case.get('media', []):
                    self.assert_local_media(item, sources)
                if 'depth_explorer' in case:
                    self.assert_depth_explorer(case['depth_explorer'], sources)
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
        cases = load_cases()
        self.assertContains(response, f'{len(cases)} 份案卷')
        for number, category in enumerate(dict.fromkeys(case['category'] for case in cases.values()), 1):
            self.assertContains(response, f'href="#case-group-{number}"')
            self.assertContains(response, f'id="case-group-{number}"')
            self.assertContains(response, category)
        for slug, case in cases.items():
            self.assertContains(response, reverse('mystery-case', args=[slug]))
            self.assertContains(response, case['title'])
            self.assertContains(response, case['open_questions'][0]['question'])

    def test_cases_render_evidence_feedback_and_sources_without_database(self):
        for slug, case in load_cases().items():
            with self.subTest(slug=slug):
                response = self.client.get(reverse('mystery-case', args=[slug]))
                self.assertContains(response, case['opening'])
                self.assertContains(response, case['unresolved'])
                self.assertContains(response, 'href="#open-questions"', count=1)
                html = response.content.decode()
                self.assertLess(html.index('id="open-questions"'), html.index('id="evidence"'))
                for question in case['open_questions']:
                    self.assertContains(response, question['question'])
                    self.assertContains(response, question['gap'])
                for clue in case['evidence']:
                    if 'image' in clue:
                        self.assertContains(response, clue['image']['alt'])
                        self.assertContains(response, clue['image']['caption'])
                if case.get('media'):
                    self.assertContains(response, 'href="#field-notes"', count=1)
                    for item in case['media']:
                        self.assertContains(response, item['title'])
                        self.assertContains(response, f'/static/{item["path"]}')
                        if item['kind'] == 'diagram':
                            for step in item['steps']:
                                self.assertContains(response, step['text'])
                        else:
                            self.assertContains(response, f'/static/{item["poster"]}')
                else:
                    self.assertNotContains(response, 'id="field-notes"')
                if 'depth_explorer' in case:
                    self.assertContains(response, 'href="#ocean-depths"', count=1)
                    for layer in case['depth_explorer']['layers']:
                        marker = f'ocean-depth-{layer["minimum"]}'
                        self.assertContains(response, f'href="#{marker}"', count=1)
                        self.assertContains(response, f'id="{marker}"', count=1)
                        for animal in layer['animals']:
                            self.assertContains(response, f'/static/{animal["path"]}')
                            self.assertContains(response, animal['depth_note'])
                else:
                    self.assertNotContains(response, 'id="ocean-depths"')
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

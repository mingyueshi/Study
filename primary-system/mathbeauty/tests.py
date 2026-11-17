from copy import deepcopy
from pathlib import Path

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase, TestCase
from django.urls import reverse

from .content import LABS, TOPICS, load_data, validate


class ContentTests(SimpleTestCase):
    def test_five_topics_eight_labs_fifteen_questions(self):
        data = load_data()
        self.assertEqual(tuple(t['id'] for t in data['topics']), TOPICS)
        self.assertEqual({lab['kind'] for t in data['topics'] for lab in t['labs']}, LABS)
        self.assertEqual(sum(len(t['quiz']) for t in data['topics']), 15)
        for topic in data['topics']:
            for lab in topic['labs']:
                self.assertTrue((settings.BASE_DIR / 'static' / lab['figure']).is_file())

    def test_rejects_broken_content_controls_and_answers(self):
        for problem in ('topic', 'control', 'control-id', 'readout', 'message', 'answer', 'html', 'figure', 'source', 'duplicate'):
            data = deepcopy(load_data())
            topic = data['topics'][0]
            if problem == 'topic':
                topic['id'] = 'unknown'
            elif problem == 'control':
                topic['labs'][0]['controls'][0]['value'] = 1000
            elif problem == 'control-id':
                topic['labs'][0]['controls'][0]['id'] = 'unknown'
            elif problem == 'readout':
                topic['labs'][0]['readouts'][0]['id'] = 'unknown'
            elif problem == 'message':
                del topic['labs'][0]['messages']['close']
            elif problem == 'answer':
                topic['quiz'][0]['answer'] = True
            elif problem == 'html':
                topic['opening'][0] = '<script>bad</script>'
            elif problem == 'figure':
                topic['labs'][0]['figure'] = '../other.svg'
            elif problem == 'source':
                topic['sources'][0]['url'] = 'javascript:bad'
            else:
                topic['quiz'][1]['id'] = topic['quiz'][0]['id']
            with self.subTest(problem=problem), self.assertRaises(ImproperlyConfigured):
                validate(data)


class PageTests(TestCase):
    def test_home_is_linked_from_math_square(self):
        page = self.client.get(reverse('home'), {'area': 'math'})
        self.assertContains(page, '数学之美')
        self.assertContains(page, reverse('math-beauty'))

    def test_index_and_all_five_stations_are_read_only(self):
        for url in [reverse('math-beauty'), *(reverse('math-beauty-topic', args=[topic]) for topic in TOPICS)]:
            with self.subTest(url=url):
                page = self.client.get(url)
                self.assertEqual(page.status_code, 200)
                self.assertNotIn(settings.SESSION_COOKIE_NAME, page.cookies)
                self.assertContains(page, '数学之美')

    def test_static_diagrams_explanations_sources_and_quiz_are_present(self):
        for topic in load_data()['topics']:
            page = self.client.get(reverse('math-beauty-topic', args=[topic['id']]))
            self.assertContains(page, topic['deep']['formula'])
            self.assertContains(page, 'data-sidebar-layout=".mb-side"')
            for lab in topic['labs']:
                self.assertContains(page, lab['figure'])
                self.assertContains(page, lab['fallback'])
            self.assertEqual(len(page.context['quiz']), 3)
            self.assertEqual(self.client.post(reverse('math-beauty-topic', args=[topic['id']])).status_code, 405)

    def test_unknown_station_returns_404(self):
        self.assertEqual(self.client.get(reverse('math-beauty-topic', args=['unknown'])).status_code, 404)

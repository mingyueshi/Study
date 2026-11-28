import json
from itertools import combinations

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase
from django.urls import reverse

from . import comparison


class EnglishComparisonTests(SimpleTestCase):
    def test_all_two_and_three_item_choices_compare_the_selected_sizes(self):
        for scene in comparison.load_comparison()['scenes'].values():
            items = scene['items']
            for direction, choice in scene['directions'].items():
                for count in comparison.COUNTS:
                    for group in combinations(items, count):
                        key = ','.join(sorted(item['id'] for item in group))
                        with self.subTest(scene=scene['id'], direction=direction, items=key):
                            result = choice['results'][key]
                            ranked = sorted(group, key=lambda item: item['value'])
                            winner = ranked[-1] if direction == 'high' else ranked[0]
                            self.assertEqual(result['winner'], winner['id'])
                            self.assertIn(winner['id'], result['en'])
                            if count == 2:
                                self.assertIn(' than ', result['en'])
                                for item in group:
                                    self.assertIn(item['id'], result['en'])
                            else:
                                self.assertTrue(result['en'].endswith(' of the three.'))

    def test_sentence_families_and_model_ratios(self):
        scenes = comparison.load_comparison()['scenes']
        pencils = scenes['pencils']
        self.assertEqual(pencils['directions']['high']['results']['blue,red']['en'],
                         'The red pencil is longer than the blue pencil.')
        self.assertEqual(pencils['directions']['high']['results']['blue,green,red']['cn'],
                         '在这三支铅笔中，绿色铅笔最长。')
        balls = scenes['balls']
        self.assertEqual(balls['directions']['low']['results']['blue,green,red']['en'],
                         'The red ball is the smallest of the three.')
        for scene in scenes.values():
            largest = max(item['value'] for item in scene['items'])
            for item in scene['items']:
                self.assertAlmostEqual(item['percent'], item['value'] / largest * 100, places=3)

    def test_render_shows_different_degrees_and_handles_partial_selection(self):
        route = reverse('english-comparison')
        response = self.client.get(route)
        self.assertContains(response, '听整句 The red pencil is longer than the blue pencil.')
        self.assertContains(response, '/ˈlɑːŋ.ɡɚ/')
        self.assertContains(response, '亲子开口练')
        self.assertContains(response, 'data-ec-question', count=4)
        response = self.client.get(route, {'scene': 'balls', 'count': '3', 'direction': 'low',
                                           'item': ['', 'blue', 'green', 'red']})
        self.assertEqual(response.context['result']['cn'], '在这三个球中，红色球最小。')
        self.assertContains(response, '找最小的')
        response = self.client.get(route, {'count': '3', 'item': ['blue', 'blue', 'missing']})
        self.assertEqual(response.context['selected'], ['blue'])
        self.assertIsNone(response.context['result'])
        response = self.client.get(route, {'item': ''})
        self.assertEqual(response.context['selected'], [])
        self.assertIsNone(response.context['result'])

    def test_rejects_equal_measurements_and_missing_pronunciations(self):
        data = json.loads(comparison.DATA_PATH.read_text(encoding='utf-8'))
        items = data['scenes'][0]['items']
        value = items[1]['value']
        items[1]['value'] = items[0]['value']
        with self.assertRaisesMessage(ImproperlyConfigured, '模型尺寸或颜色无效'):
            comparison.prepare_comparison(data)
        items[1]['value'] = value
        data['families'][0]['forms'][1]['ipa'] = ''
        with self.assertRaisesMessage(ImproperlyConfigured, '需要三种词形、音标和双语例句'):
            comparison.prepare_comparison(data)

    def test_original_grammar_chapter_links_to_the_comparison(self):
        response = self.client.get(reverse('grammar'), {'chapter': 'adjectives'})
        self.assertContains(response, reverse('english-comparison'))
        self.assertContains(response, 'id="lesson-gr7-2"')
        self.assertContains(response, 'id="lesson-gr7-3"')
        self.assertContains(response, reverse('questionbank-grammar-practice', args=['adjectives']))

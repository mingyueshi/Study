from django.contrib.staticfiles import finders
from django.test import SimpleTestCase, TestCase
from django.urls import reverse


class RhetoricPageTests(SimpleTestCase):
    def test_examples_and_answer_explanations_render_without_javascript(self):
        response = self.client.get(reverse('rhetoric-gallery'))
        self.assertContains(response, 'id="rhetoric-techniques-title"')
        self.assertContains(response, 'id="rhetoric-cases-title"')
        self.assertContains(response, 'class="site-header"', count=1)
        course = response.context['course']
        self.assertEqual(len(course['techniques']), 8)
        self.assertEqual(len(response.context['cases']), 16)
        self.assertContains(response, '<mark>像一把撑开的绿伞</mark>')
        self.assertContains(response, '水面上那片荷叶，像一把撑开的绿伞。')
        self.assertContains(response, '看答案与理由', count=16)
        for case in response.context['cases']:
            self.assertContains(response, f'id="case-{case["id"]}"')
            self.assertContains(response, case['explanation'])
        for suffix in ('css', 'js'):
            asset = f'study_topics/rhetoric.{suffix}'
            self.assertTrue(finders.find(asset))
            self.assertContains(response, f'/static/{asset}?v=')

    def test_filter_preserves_multitechnique_cases_and_other_reading_cards(self):
        url = reverse('rhetoric-gallery')
        response = self.client.get(url, {'technique': 'hyperbole'})
        self.assertContains(response, 'id="technique-simile"')
        self.assertContains(response, 'id="case-drum-sound"')
        self.assertNotContains(response, 'id="case-lotus-pair"')
        self.assertEqual({case['id'] for case in response.context['cases']}, {
            'loud-or-literal', 'drum-sound', 'choose-a-rewrite',
        })
        unknown = self.client.get(url, {'technique': 'unknown'})
        self.assertEqual(len(unknown.context['cases']), 16)
        self.assertEqual(self.client.post(url).status_code, 405)


class RhetoricEntryTests(TestCase):
    def test_learning_square_lists_gallery_in_chinese(self):
        link = f'href="{reverse("rhetoric-gallery")}"'
        chinese = self.client.get(reverse('home'), {'area': 'chinese'})
        self.assertContains(chinese, link)
        self.assertContains(chinese, '修辞手法馆')
        science = self.client.get(reverse('home'), {'area': 'science'})
        self.assertNotContains(science, link)

from django.test import SimpleTestCase
from django.urls import reverse

from .rumors import load_content


class ScienceRumorsTests(SimpleTestCase):
    def test_directory_and_all_cases_are_readable_by_visitors(self):
        directory_url = reverse('science-rumors')
        response = self.client.get(directory_url)
        self.assertContains(response, '科学流言粉碎机')
        self.assertEqual(self.client.post(directory_url).status_code, 405)

        cases = load_content()['cases']
        for case in cases:
            with self.subTest(slug=case['slug']):
                detail_url = reverse('science-rumor-case', args=[case['slug']])
                self.assertContains(response, f'href="{detail_url}"')
                detail = self.client.get(detail_url)
                self.assertContains(detail, case['claim'])
                self.assertContains(detail, f'data-verdict="{case["verdict"]}"')
                self.assertContains(detail, 'id="rumor-answer"')
                self.assertContains(detail, case['challenge']['prompt'])
                self.assertContains(detail, 'data-quiz-fallback')
                self.assertContains(detail, f'data-notebook="{case["slug"]}"')
                self.assertContains(detail, f'href="{directory_url}#rumor-cases"')
                self.assertEqual(self.client.post(detail_url).status_code, 405)

    def test_unknown_case_returns_404(self):
        url = reverse('science-rumor-case', args=['missing'])
        self.assertEqual(self.client.get(url).status_code, 404)

    def test_filter_and_search_keep_original_numbers_and_complete_progress_list(self):
        cases = load_content()['cases']
        case = next(case for case in cases if case['slug'] == 'penguins')
        response = self.client.get(reverse('science-rumors'), {
            'category': case['category'], 'q': '企鹅',
        })
        self.assertEqual([item['slug'] for item in response.context['cases']], ['penguins'])
        self.assertEqual(response.context['cases'][0]['number'], cases.index(case) + 1)
        self.assertEqual(response.context['total_count'], len(cases))
        self.assertEqual(response.context['all_slugs'], [item['slug'] for item in cases])
        self.assertContains(response, '显示全部任务')

    def test_search_handles_empty_results_and_escapes_input(self):
        response = self.client.get(reverse('science-rumors'), {'q': '<script>找不到</script>'})
        self.assertContains(response, '这次没找到')
        self.assertNotContains(response, '<script>找不到</script>')
        response = self.client.get(reverse('science-rumors'), {'category': '不存在的分类'})
        self.assertEqual(len(response.context['cases']), len(load_content()['cases']))

    def test_training_route_precedes_case_route_and_deck_links_back_to_cases(self):
        url = reverse('science-rumors-training')
        response = self.client.get(url, {'mode': 'review'})
        self.assertContains(response, '五题判断训练')
        self.assertEqual(response.context['mode'], 'review')
        deck = response.context['deck']
        self.assertEqual(len(deck), len(load_content()['cases']))
        for item in deck:
            self.assertEqual(item['url'], reverse('science-rumor-case', args=[item['slug']]))
            self.assertIn(item['challenge']['answer'], [option['id'] for option in item['challenge']['options']])
        self.assertContains(response, '逐项练习也可以')
        self.assertEqual(self.client.post(url).status_code, 405)
        self.assertEqual(self.client.head(url).status_code, 200)
        self.assertEqual(self.client.get(url, {'mode': '<script>'}).context['mode'], '')

    def test_learning_filter_preserves_server_search_and_uses_known_values(self):
        url = reverse('science-rumors')
        response = self.client.get(url, {'view': 'saved', 'q': '企鹅'})
        self.assertEqual(response.context['progress_filter'], 'saved')
        self.assertEqual([case['slug'] for case in response.context['cases']], ['penguins'])
        self.assertEqual(len(response.context['directory_data']), len(load_content()['cases']))
        self.assertEqual(self.client.get(url, {'view': 'bad'}).context['progress_filter'], 'all')

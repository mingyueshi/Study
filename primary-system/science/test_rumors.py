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
                self.assertContains(detail, f'href="{directory_url}#rumor-cases"')
                self.assertEqual(self.client.post(detail_url).status_code, 405)

    def test_unknown_case_returns_404(self):
        url = reverse('science-rumor-case', args=['missing'])
        self.assertEqual(self.client.get(url).status_code, 404)

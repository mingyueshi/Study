from django.test import TestCase
from django.urls import reverse

from poetry.models import PoetryDocument, PoetryText
from reference_library.models import Dataset


class SolarTermsTests(TestCase):
    def test_calendar_and_learning_links_work_before_poetry_is_imported(self):
        response = self.client.get(reverse('solar-terms'))
        self.assertContains(response, '<article class="solar-card"', count=24)
        self.assertContains(response, 'class="solar-phase-number"', count=72)
        self.assertContains(response, '当前诗词库暂时读不到这首诗。', count=24)
        self.assertNotContains(response, f'href="{reverse("poetry-seasons")}"')
        for route, fragment in (
            ('geography-study', 'lesson-gu4-1'),
            ('geography-study', 'lesson-gu4-3'),
            ('literature-study', 'lesson-lu6-5'),
        ):
            self.assertContains(response, f'href="{reverse(route, fragment=fragment)}"')
        self.assertEqual(self.client.post(reverse('solar-terms')).status_code, 405)

    def test_cards_read_the_current_simplified_poem_on_every_request(self):
        Dataset.objects.create(code='poetry', title='古诗文', version='current', state='ready')
        for version, layer in (('previous', 'simplified'), ('current', 'raw'), ('current', 'simplified')):
            document = PoetryDocument.objects.create(
                version=version, path=f'poems/{layer}.json', layer=layer, collection='全唐诗',
                original_data=[],
            )
            poem = PoetryText.objects.create(
                document=document, locator='/1', title='春夜喜雨', author='杜甫',
                paragraphs=['首段', f'{version} {layer} 次段'],
            )

        url = reverse('solar-terms')
        response = self.client.get(url)
        self.assertContains(response, '<blockquote>current simplified 次段</blockquote>')
        self.assertNotContains(response, 'previous simplified 次段')
        self.assertNotContains(response, 'current raw 次段')
        self.assertContains(response, f'href="{reverse("poetry-detail", args=[poem.pk])}?solar_term=yushui"')
        self.assertContains(response, f'href="{reverse("poetry-seasons")}"')
        self.assertContains(response, f'href="{reverse("poetry-theme", args=["chun"])}"')

        poem.paragraphs[1] = '已更新的段落'
        poem.save(update_fields=['paragraphs'])
        response = self.client.get(url)
        self.assertContains(response, '<blockquote>已更新的段落</blockquote>')
        self.assertNotContains(response, 'current simplified 次段')

        poem.paragraphs = ['首段']
        poem.save(update_fields=['paragraphs'])
        self.assertContains(self.client.get(url), '当前诗词库暂时读不到这首诗。', count=24)

    def test_all_cards_have_specific_learning_tasks(self):
        from .solar_terms_content import load_content

        content = load_content()
        response = self.client.get(reverse('solar-terms'))
        self.assertContains(response, '<details class="solar-learning">', count=24)
        for season in content['seasons']:
            for term in season['terms']:
                for subject in ('geography', 'literature'):
                    link = term['learning'][subject]
                    self.assertContains(response, f'href="{link["url"]}"')
                    self.assertContains(response, link['question'])
                self.assertContains(response, term['learning']['poetry'])
                # 没有 ready 语料时，课程仍可读，但不引向会返回 404 的诗词页。
                self.assertNotContains(response, f'href="{term["poetry_url"]}"')

    def test_courses_keep_term_context_and_ignore_unknown_ids(self):
        for route in ('geography-study', 'literature-study'):
            response = self.client.get(reverse(route), {'solar_term': 'yushui'})
            self.assertContains(response, '从雨水出发，串起来学')
            self.assertContains(response, 'href="/geography/solar-terms/#yushui"')
            self.assertContains(response, '?solar_term=yushui#lesson-gu4-2')
            self.assertContains(response, '?solar_term=yushui#lesson-lu2-2')
            self.assertNotContains(response, 'href="/poetry/themes/chun/?solar_term=yushui"')
            for code in ('', 'unknown', 'https://example.com', '<script>'):
                response = self.client.get(reverse(route), {'solar_term': code})
                self.assertNotContains(response, 'class="solar-journey"')

    def test_poem_page_keeps_exact_card_return_and_other_reading_links(self):
        Dataset.objects.create(code='poetry', title='古诗文', version='current', state='ready')
        document = PoetryDocument.objects.create(version='current', path='poems/test.json', layer='simplified', collection='全唐诗', original_data=[])
        poem = PoetryText.objects.create(document=document, locator='/1', title='春夜喜雨', author='杜甫', paragraphs=['第一句', '第二句'])
        next_poem = PoetryText.objects.create(document=document, locator='/2', title='春日', author='测试', paragraphs=['另一首诗'])
        response = self.client.get(reverse('poetry-detail', args=[poem.pk]), {'solar_term': 'yushui'})
        self.assertContains(response, '从雨水出发，串起来学')
        self.assertContains(response, 'href="/geography/solar-terms/#yushui"')
        self.assertContains(response, 'href="/poetry/themes/chun/?solar_term=yushui"')
        self.assertContains(response, f'href="{reverse("poetry-detail", args=[next_poem.pk])}?solar_term=yushui"')

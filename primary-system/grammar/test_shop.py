import json

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase
from django.urls import reverse

from . import shop


class EnglishShopTests(SimpleTestCase):
    def test_countable_products_change_with_initial_sound_and_quantity(self):
        products = shop.load_shop()['products']
        apple = products['apple']['dialogues']
        banana = products['banana']['dialogues']
        self.assertEqual([round_['customer']['en'] for round_ in apple.values()], [
            'Can I have an apple, please?',
            'Can I have two apples, please?',
            'Can I have three apples, please?',
            'Can I have some apples, please?',
        ])
        self.assertEqual(apple['1']['customer']['ipa'], '/ən ˈæp.əl/')
        self.assertEqual(banana['1']['customer']['en'], 'Can I have a banana, please?')
        self.assertEqual(banana['1']['label'], '一根')

    def test_quantities_change_the_unit_for_uncountable_products(self):
        products = shop.load_shop()['products']
        expected = {
            'water': ('bottle', 'bottles', '瓶'),
            'milk': ('carton', 'cartons', '盒'),
            'bread': ('slice', 'slices', '片'),
            'rice': ('bowl', 'bowls', '碗'),
        }
        for name, (singular, plural, counter) in expected.items():
            with self.subTest(product=name):
                order = products[name]['dialogues']
                self.assertEqual(order['1']['customer']['en'], f'Can I have a {singular} of {name}, please?')
                self.assertEqual(order['2']['customer']['en'], f'Can I have two {plural} of {name}, please?')
                self.assertEqual(order['3']['customer']['en'], f'Can I have three {plural} of {name}, please?')
                self.assertEqual(order['some']['customer']['en'], f'Can I have some {name}, please?')
                self.assertEqual(order['2']['label'], f'两{counter}')

    def test_confirmation_refers_to_the_chosen_order(self):
        products = shop.load_shop()['products']
        apple = products['apple']['dialogues']
        self.assertEqual(apple['1']['clerk']['en'], "Sure. I'll get the apple for you.")
        self.assertEqual(apple['1']['clerk']['ipa'], '/ði ˈæp.əl/')
        self.assertEqual(apple['3']['clerk']['lead'], 'the three')
        milk = products['milk']['dialogues']
        self.assertEqual(milk['some']['clerk']['en'], "Sure. I'll get the milk for you.")
        self.assertEqual(milk['some']['clerk']['ipa'], '/ðə mɪlk/')
        self.assertEqual(milk['2']['clerk']['phrase'], 'cartons of milk')

    def test_page_deep_link_updates_bilingual_dialogue_and_quantities(self):
        response = self.client.get(reverse('english-shop'), {'product': 'bread', 'quantity': '2'})
        self.assertContains(response, 'name="product" value="bread" checked')
        self.assertContains(response, 'name="quantity" value="2" checked')
        self.assertContains(response, '听短语 two slices of bread')
        self.assertContains(response, '请给我两片面包，好吗？')
        self.assertContains(response, '亲子开口练')
        self.assertContains(response, 'data-shop-question', count=6)
        fallback = self.client.get(reverse('english-shop'), {'product': 'nobody', 'quantity': '10'})
        self.assertContains(fallback, 'name="product" value="apple" checked')
        self.assertContains(fallback, '听短语 an apple')

    def test_missing_plural_pronunciation_and_wrong_quiz_choice_fail_validation(self):
        data = json.loads(shop.DATA_PATH.read_text(encoding='utf-8'))
        unit = data['products'][4]['unit']
        plural_ipa = unit.pop('plural_ipa')
        with self.assertRaisesMessage(ImproperlyConfigured, '缺单复数或读音'):
            shop.prepare_shop(data)
        unit['plural_ipa'] = plural_ipa
        data['quiz'][0]['options'] = ['a banana', 'an banana', 'the banana']
        with self.assertRaisesMessage(ImproperlyConfigured, '练习选项无效'):
            shop.prepare_shop(data)

    def test_original_noun_and_article_chapters_keep_links_and_practice(self):
        for chapter, lesson in [('nouns', 'gr2-1'), ('articles', 'gr3-1')]:
            with self.subTest(chapter=chapter):
                response = self.client.get(reverse('grammar'), {'chapter': chapter})
                self.assertContains(response, reverse('english-shop'))
                self.assertContains(response, f'id="lesson-{lesson}"')
                self.assertContains(response, reverse('questionbank-grammar-practice', args=[chapter]))

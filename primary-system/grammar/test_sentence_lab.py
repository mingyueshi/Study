import json

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase
from django.urls import reverse

from . import sentence_lab


class SentenceLabTests(SimpleTestCase):
    def test_negative_and_question_keep_the_main_verb_in_base_form(self):
        examples = sentence_lab.load_lab()['examples']
        expected = {
            'apples': ['She likes apples.', 'She does not like apples.', 'Does she like apples?'],
            'soccer': ['They play soccer after school.', 'They do not play soccer after school.',
                       'Do they play soccer after school?'],
            'library': ['He went to the library yesterday.', 'He did not go to the library yesterday.',
                        'Did he go to the library yesterday?'],
            'homework': ['He does his homework every evening.', 'He does not do his homework every evening.',
                         'Does he do his homework every evening?'],
        }
        for key, sentences in expected.items():
            with self.subTest(example=key):
                self.assertEqual([form['en'] for form in examples[key]['forms']], sentences)

    def test_be_and_modal_forms_use_the_existing_verb(self):
        examples = sentence_lab.load_lab()['examples']
        expected = {
            'happy': ['She is happy now.', 'She is not happy now.', 'Is she happy now?'],
            'reading': ['They are reading a book.', 'They are not reading a book.', 'Are they reading a book?'],
            'swim': ['She can swim.', 'She cannot swim.', 'Can she swim?'],
            'grandma': ['They will visit Grandma tomorrow.', 'They will not visit Grandma tomorrow.',
                        'Will they visit Grandma tomorrow?'],
        }
        for key, sentences in expected.items():
            with self.subTest(example=key):
                self.assertEqual([form['en'] for form in examples[key]['forms']], sentences)
        self.assertEqual(examples['swim']['forms'][1]['spoken'], "She can't swim.")
        self.assertEqual([word['role'] for word in examples['happy']['forms'][2]['focus']], ['be'])

    def test_all_words_highlighted_for_practice_have_ipa(self):
        examples = sentence_lab.load_lab()['examples']
        for example in examples.values():
            for form in example['forms']:
                self.assertTrue(form['cn'])
                self.assertTrue(form['focus'])
                self.assertTrue(all(word['ipa'] for word in form['focus']))
        question = examples['apples']['forms'][2]
        self.assertEqual([(word['text'], word['ipa']) for word in question['focus']],
                         [('Does', 'dʌz'), ('like', 'laɪk')])

    def test_deep_links_and_fallback(self):
        route = reverse('english-sentence-lab')
        page = self.client.get(route, {'example': 'library', 'mode': 'question'})
        self.assertContains(page, 'name="example" value="library" checked')
        self.assertContains(page, 'name="mode" value="question" checked')
        self.assertContains(page, 'data-lab-say="Did he go to the library yesterday?"')
        self.assertContains(page, '他昨天去图书馆了吗？')
        self.assertContains(page, '亲子开口练')
        self.assertContains(page, 'data-lab-question', count=4)
        fallback = self.client.get(route, {'example': 'unknown', 'mode': 'unknown'})
        self.assertContains(fallback, 'name="example" value="apples" checked')
        self.assertContains(fallback, 'name="mode" value="affirmative" checked')

    def test_malformed_examples_fail_validation(self):
        data = json.loads(sentence_lab.DATA_PATH.read_text(encoding='utf-8'))
        data['examples'][0]['helper'] = 'do'
        with self.assertRaisesMessage(ImproperlyConfigured, '助动词与主语不匹配'):
            sentence_lab.prepare_lab(data)
        data['examples'][0]['helper'] = 'does'
        data['ipa'].pop('like')
        with self.assertRaisesMessage(ImproperlyConfigured, '主要动词或音标无效'):
            sentence_lab.prepare_lab(data)

    def test_original_sentence_chapter_links_to_lab_and_retains_deep_links(self):
        page = self.client.get(reverse('grammar'), {'chapter': 'sentences'})
        self.assertContains(page, reverse('english-sentence-lab'))
        for number in range(1, 5):
            self.assertContains(page, f'id="lesson-gr8-{number}"')
        self.assertContains(page, reverse('questionbank-grammar-practice', args=['sentences']))

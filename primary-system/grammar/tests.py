"""语法专题测试：数据契约（镜像静态版 test-grammar.js）+ 页面只读。"""
import json

from django.core.exceptions import ImproperlyConfigured
from django.conf import settings
from django.test import SimpleTestCase, TestCase
from django.urls import reverse

from . import catalog, pronouns


class CurriculumDataTests(SimpleTestCase):
    def test_loads_and_matches_scale(self):
        data = catalog.load_grammar()
        self.assertEqual(data['schema_version'], 1)
        self.assertEqual(data['source_code'], 'primary-grammar')
        self.assertEqual(len(data['chapters']), 8)
        self.assertEqual(len(data['lessons']), 31)
        self.assertEqual({chapter['no'] for chapter in data['chapters']},
                         {f'{order:02d}' for order in range(1, 9)})

    def test_lessons_have_required_fields(self):
        for lesson in catalog.load_grammar()['lessons']:
            self.assertGreaterEqual(len(lesson['essentials']), 2, lesson['id'])
            self.assertTrue(lesson['example']['question'] and lesson['example']['answer']
                            and lesson['example']['steps'], lesson['id'])
            self.assertTrue(lesson['misconception']['wrong'] and lesson['misconception']['right'], lesson['id'])
            quiz = lesson['quiz']
            self.assertTrue(quiz['question'] and quiz['explanation'], lesson['id'])
            self.assertGreaterEqual(len(quiz['options']), 2, lesson['id'])
            self.assertTrue(0 <= quiz['answer'] < len(quiz['options']), lesson['id'])
            for source in lesson['sources']:
                self.assertTrue(source['url'].startswith('https://'), lesson['id'])

    def test_optional_fields_shape(self):
        counts = {'facts': 0, 'formula': 0, 'comparison': 0}
        for lesson in catalog.load_grammar()['lessons']:
            if lesson['facts'] is not None:
                counts['facts'] += 1
                self.assertTrue(all(fact['label'] and fact['value'] for fact in lesson['facts']), lesson['id'])
            if lesson['formula'] is not None:
                counts['formula'] += 1
                self.assertIsInstance(lesson['formula'], str, lesson['id'])
            if lesson['comparison'] is not None:
                counts['comparison'] += 1
                self.assertGreaterEqual(len(lesson['comparison']['headers']), 2, lesson['id'])
        # 生成物与静态版规模一致：这些数字漂移说明源头内容变了，应同步核对。
        self.assertEqual(counts, {'facts': 5, 'formula': 12, 'comparison': 21})

    def test_chapter_assignment_is_exact(self):
        data = catalog.load_grammar()
        claimed = [lesson_id for chapter in data['chapters'] for lesson_id in chapter['lesson_ids']]
        self.assertEqual(sorted(claimed), sorted(lesson['id'] for lesson in data['lessons']))

    def test_text_is_chinese_punctuation_and_tag_free(self):
        def walk(value):
            if isinstance(value, str):
                yield value
            elif isinstance(value, list):
                for item in value:
                    yield from walk(item)
            elif isinstance(value, dict):
                for item in value.values():
                    yield from walk(item)

        for lesson in catalog.load_grammar()['lessons']:
            for text in walk(lesson):
                self.assertNotIn('"', text, lesson['id'])
                self.assertNotRegex(text, r'[\n\r]', lesson['id'])
                self.assertNotRegex(text, r'<[a-zA-Z/]', lesson['id'])

    def test_validate_rejects_drift(self):
        data = catalog.load_grammar()
        with self.assertRaises(ImproperlyConfigured):
            catalog.validate({**data, 'schema_version': 2})
        with self.assertRaises(ImproperlyConfigured):
            catalog.validate({**data, 'chapters': data['chapters'][:4]})
        broken_lesson = {**data['lessons'][0], 'essentials': ['只有一条']}
        with self.assertRaises(ImproperlyConfigured):
            catalog.validate({**data, 'lessons': [broken_lesson] + data['lessons'][1:]})

    def test_chapters_assembly_keeps_order(self):
        chapters = catalog.chapters_with_lessons()
        self.assertEqual(chapters[0]['id'], 'basics')
        self.assertEqual([lesson['id'] for lesson in chapters[0]['lessons']],
                         ['gr1-1', 'gr1-2', 'gr1-3', 'gr1-4'])
        self.assertEqual(chapters[-1]['id'], 'sentences')


class GrammarPageTests(TestCase):
    def test_index_shows_topic_hub_and_first_reference(self):
        response = self.client.get(reverse('grammar'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '语法初认识')
        self.assertContains(response, '专题学习')
        self.assertNotContains(response, 'data-grammar-quiz')
        self.assertEqual(response.context['first_chapter']['id'], 'basics')
        basics = self.client.get(reverse('grammar'), {'chapter': 'basics'})
        self.assertContains(basics, '什么是语法')
        self.assertContains(basics, 'id="lesson-gr1-1"')

    def test_chapter_filter(self):
        response = self.client.get(reverse('grammar'), {'chapter': 'tenses'})
        self.assertEqual(response.context['current']['id'], 'tenses')
        self.assertContains(response, '一般现在时与三单')
        self.assertNotContains(response, 'am is are 怎么选')  # gr5-1 属于 be 动词章，不在 tenses

    def test_invalid_chapter_falls_back_to_first(self):
        response = self.client.get(reverse('grammar'), {'chapter': 'no-such'})
        self.assertEqual(response.context['current']['id'], 'basics')

    def test_page_is_read_only(self):
        # 只读浏览：GET 不得创建会话或写任何记录（无模型应用，会话即泄漏渠道）。
        response = self.client.get(reverse('grammar'))
        self.assertNotIn(settings.SESSION_COOKIE_NAME, response.cookies)

    def test_pronoun_chapter_keeps_old_anchors_and_links_to_topic(self):
        response = self.client.get(reverse('grammar'), {'chapter': 'pronouns'})
        for number in range(1, 5):
            self.assertContains(response, f'id="lesson-gr4-{number}"')
        self.assertContains(response, reverse('pronouns'))
        self.assertContains(response, reverse('questionbank-grammar-practice', args=['pronouns']))


class PronounTopicTests(SimpleTestCase):
    def test_topic_directory_and_all_lessons(self):
        directory = self.client.get(reverse('pronouns'))
        self.assertContains(directory, '英语代词')
        self.assertContains(directory, 'data-pronoun-say="I help Dad."')
        for chapter in pronouns.load_curriculum()['chapters']:
            with self.subTest(chapter=chapter['id']):
                url = reverse('pronoun-lesson', args=[chapter['id']])
                self.assertContains(directory, url)
                response = self.client.get(url)
                self.assertContains(response, chapter['title'])
                self.assertContains(response, '返回英语语法', count=1)
                self.assertTemplateUsed(response, 'grammar/_topic_hero.html', count=1)
                self.assertContains(response, '亲子开口练')
                self.assertContains(response, 'data-pronoun-question', count=2)
                for group in chapter['groups']:
                    cards = [card for pair in group['rows'] for card in pair] if 'rows' in group else group['items']
                    for card in cards:
                        if 'word' in card:
                            self.assertContains(response, f"/{card['ipa']}/")
                            self.assertContains(response, card['cn'])
        self.assertEqual(self.client.get(reverse('pronoun-lesson', args=['unknown'])).status_code, 404)

    def test_incomplete_example_or_invalid_answer_is_rejected(self):
        data = json.loads(pronouns.DATA_PATH.read_text(encoding='utf-8'))
        chapter = data['chapters'][0]
        card = chapter['groups'][0]['rows'][0][1]
        sentence = card['en']
        card['en'] = 'Dad helps us.'
        with self.assertRaisesMessage(ImproperlyConfigured, '例句应恰好含一个目标词'):
            pronouns.prepare_curriculum(data)
        card['en'] = sentence
        chapter['quiz'][0]['answer'] = 'mine'
        with self.assertRaisesMessage(ImproperlyConfigured, '填空或选项无效'):
            pronouns.prepare_curriculum(data)

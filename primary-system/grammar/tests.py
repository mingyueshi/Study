"""语法专题测试：数据契约（镜像静态版 test-grammar.js）+ 页面只读。"""
from django.core.exceptions import ImproperlyConfigured
from django.conf import settings
from django.test import SimpleTestCase, TestCase
from django.urls import reverse

from . import catalog


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
    def test_index_shows_first_chapter(self):
        response = self.client.get(reverse('grammar'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '语法初认识')
        self.assertContains(response, '什么是语法')
        self.assertEqual(response.context['current']['id'], 'basics')

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

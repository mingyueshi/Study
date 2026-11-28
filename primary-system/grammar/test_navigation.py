import json

from django.core.exceptions import ImproperlyConfigured
from django.test import TestCase
from django.urls import reverse

from . import catalog, navigation


class GrammarNavigationTests(TestCase):
    def test_hub_exposes_full_topics_and_reference_chapters(self):
        response = self.client.get(reverse('grammar'))
        self.assertContains(response, '专题学习')
        self.assertContains(response, '语法速查')
        self.assertNotContains(response, 'class="grammar-rule"')
        self.assertNotContains(response, 'data-grammar-quiz')
        for topic in navigation.load_navigation()['directory']:
            with self.subTest(topic=topic['route']):
                self.assertContains(response, topic['name'])
                self.assertContains(response, f'href="{topic["url"]}"', count=1)
                topic_page = self.client.get(topic['url'])
                self.assertContains(topic_page, '返回英语语法', count=1)
                self.assertTemplateUsed(topic_page, 'grammar/_topic_hero.html', count=1)
        for chapter in catalog.chapters_with_lessons():
            self.assertContains(response, reverse('grammar', query={'chapter': chapter['id']}))

    def test_chapter_handoffs_link_once_to_each_entire_topic(self):
        expected = {
            'nouns': ['english-shop', 'plurals'],
            'articles': ['english-shop'],
            'pronouns': ['pronouns'],
            'be-verb': ['english-sentence-lab'],
            'tenses': ['english-timeline'],
            'adjectives': ['english-comparison'],
            'sentences': ['english-sentence-lab'],
        }
        for chapter_id, routes in expected.items():
            with self.subTest(chapter=chapter_id):
                response = self.client.get(reverse('grammar'), {'chapter': chapter_id})
                self.assertContains(response, 'data-grammar-chapter-topics', count=1)
                self.assertEqual([topic['route'] for topic in response.context['current']['topics']], routes)
                for route in routes:
                    self.assertContains(response, f'href="{reverse(route)}"', count=1)
        pronunciation = self.client.get(reverse('grammar'), {'chapter': 'pronouns'})
        self.assertNotContains(pronunciation, reverse('pronoun-lesson', args=['personal']))

    def test_reference_keeps_unique_rules_and_moves_existing_quizzes_into_one_panel(self):
        notes = navigation.load_navigation()['notes']
        for chapter in catalog.chapters_with_lessons():
            with self.subTest(chapter=chapter['id']):
                response = self.client.get(reverse('grammar'), {'chapter': chapter['id']})
                self.assertContains(response, 'id="chapter-review"', count=1)
                for lesson in chapter['lessons']:
                    lesson_id = lesson['id']
                    self.assertContains(response, f'id="lesson-{lesson_id}"', count=1)
                    self.assertContains(response, f'data-lesson="{lesson_id}"', count=1)
                    reading = f'<p class="grammar-definition">{lesson["definition"]}</p>'
                    if lesson_id in notes:
                        self.assertNotContains(response, reading, html=True)
                        for note in notes[lesson_id]:
                            self.assertContains(response, note)
                    else:
                        self.assertContains(response, reading, html=True)
                self.assertContains(response, reverse('questionbank-grammar-practice', args=[chapter['id']]))

    def test_navigation_rejects_unknown_topic_and_lesson(self):
        grammar = catalog.load_grammar()
        chapter_ids = {chapter['id'] for chapter in grammar['chapters']}
        lesson_ids = {lesson['id'] for lesson in grammar['lessons']}
        data = json.loads(navigation.LINKS_PATH.read_text(encoding='utf-8'))
        data['chapters']['nouns']['topics'].append('unknown')
        with self.assertRaisesMessage(ImproperlyConfigured, '专题入口无效'):
            navigation.prepare_navigation(data, chapter_ids, lesson_ids)
        data['chapters']['nouns']['topics'].pop()
        data['transferred_lessons']['unknown'] = []
        with self.assertRaisesMessage(ImproperlyConfigured, '知识点 ID 或内容无效'):
            navigation.prepare_navigation(data, chapter_ids, lesson_ids)

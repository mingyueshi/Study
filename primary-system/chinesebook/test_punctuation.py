from django.contrib.auth import get_user_model
from django.contrib.staticfiles import finders
from django.test import SimpleTestCase, TestCase
from django.urls import reverse


class PunctuationPageTests(SimpleTestCase):
    def test_all_sections_use_platform_shell_and_local_assets(self):
        for view, text in [('usage', '先看意思，再选标点'), ('errors', '差一个标点'), ('practice', '让标点回到合适的位置')]:
            with self.subTest(view=view):
                response = self.client.get(reverse('punctuation-lab'), {'view': view})
                self.assertContains(response, '标点符号实验室')
                self.assertContains(response, text)
                self.assertContains(response, 'class="site-header"', count=1)
                self.assertContains(response, '<main ', count=1)
                self.assertContains(response, 'id="reading-settings"', count=1)
                self.assertContains(response, 'data-storage-scope="guest"')
                self.assertContains(response, f'href="{reverse("home")}?area=chinese#modules-title"')
                for suffix in ('css', 'js'):
                    self.assertContains(response, f'/static/study_topics/punctuation.{suffix}?v=')
                    self.assertTrue(finders.find(f'study_topics/punctuation.{suffix}'))
                self.assertIn('no-store', response['Cache-Control'])

    def test_deep_links_and_no_script_references_are_available(self):
        response = self.client.get(reverse('punctuation-lab'), {'view': 'practice', 'question': 'event-name'})
        course = response.context['course']
        self.assertEqual(len(course['marks']), 12)
        self.assertEqual(len(course['pitfalls']), 12)
        self.assertEqual(len(course['questions']), 24)
        for question in course['questions']:
            self.assertEqual(len(question['revision']), 16)
            self.assertContains(response, question['explanation'])
            self.assertContains(response, f'id="question-{question["id"]}"')
        event = next(question for question in course['questions'] if question['id'] == 'event-name')
        self.assertEqual(event['references'], ['学校举行读书分享会活动。', '学校举行“读书分享会”活动。'])

    def test_unknown_view_falls_back_to_usage_and_only_safe_methods_are_allowed(self):
        response = self.client.get(reverse('punctuation-lab'), {'view': '<script>'})
        self.assertEqual(response.context['view'], 'usage')
        self.assertEqual(self.client.head(reverse('punctuation-lab')).status_code, 200)
        self.assertEqual(self.client.post(reverse('punctuation-lab')).status_code, 405)


class PunctuationEntryTests(TestCase):
    def test_entry_is_listed_under_chinese_and_storage_is_scoped_by_account(self):
        url = reverse('punctuation-lab')
        response = self.client.get(reverse('home'), {'area': 'chinese'})
        self.assertContains(response, f'href="{url}"')
        self.assertContains(response, '标点符号实验室')
        self.assertTrue(finders.find('icons/punctuation.svg'))
        self.assertNotContains(self.client.get(reverse('home'), {'area': 'science'}), f'href="{url}"')
        user = get_user_model().objects.create_user(username='punctuation-learner')
        self.client.force_login(user)
        self.assertContains(self.client.get(url), f'data-storage-scope="user-{user.pk}"')

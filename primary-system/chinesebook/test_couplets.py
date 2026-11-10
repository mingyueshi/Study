from django.contrib.staticfiles import finders
from django.test import SimpleTestCase, TestCase
from django.urls import reverse


class CoupletsWorkshopTests(SimpleTestCase):
    def test_visitors_can_read_the_course_and_answers(self):
        url = reverse('couplets')
        response = self.client.get(url)
        self.assertContains(response, '对联工坊')
        self.assertContains(response, f'href="{reverse("home")}?area=chinese#modules-title"')
        self.assertContains(response, f'href="{reverse("literature-study")}"')
        for fragment in ('rules', 'examples', 'practice', 'studio'):
            self.assertContains(response, f'href="#{fragment}"')
            self.assertContains(response, f'id="{fragment}"')
        for question in response.context['course']['questions']:
            with self.subTest(question=question['id']):
                self.assertContains(response, f'id="question-{question["id"]}"')
                self.assertContains(response, question['choices'][question['answer']])
                self.assertContains(response, question['explanation'])
        for filename in ('study_topics/couplets.css', 'study_topics/couplets.js'):
            self.assertContains(response, f'/static/{filename}')
            self.assertTrue(finders.find(filename), filename)
        self.assertEqual(self.client.post(url).status_code, 405)


class CoupletsEntryTests(TestCase):
    def test_learning_square_lists_workshop_under_chinese(self):
        url = reverse('couplets')
        chinese = self.client.get(reverse('home'), {'area': 'chinese'})
        self.assertContains(chinese, f'href="{url}"')
        self.assertContains(chinese, '对联工坊')
        self.assertTrue(finders.find('icons/couplets.svg'))
        science = self.client.get(reverse('home'), {'area': 'science'})
        self.assertNotContains(science, f'href="{url}"')

from django.contrib.staticfiles import finders
from django.test import SimpleTestCase
from django.urls import reverse


class HumanBodyStationTests(SimpleTestCase):
    def test_index_and_six_lessons_are_public(self):
        index = self.client.get(reverse('science-body'))
        self.assertContains(index, '人体奥秘站')
        lab = reverse('science-lab')
        self.assertContains(index, f'href="{lab}#lesson-su6-5"')
        self.assertContains(self.client.get(lab), f'data-body-station="{reverse("science-body")}"')
        for slug, label in (
            ('breathing', '呼吸'), ('digestion', '消化'),
            ('circulation', '血液循环'), ('movement', '骨骼肌肉'),
            ('nerves', '大脑与神经'), ('senses', '眼耳与感官'),
        ):
            with self.subTest(slug=slug):
                lesson_url = reverse('science-body-lesson', args=[slug])
                self.assertContains(index, f'href="{lesson_url}"')
                lesson = self.client.get(lesson_url)
                self.assertContains(lesson, f'{label} · 人体奥秘站')
                self.assertContains(lesson, '/static/science/body.js?v=20261114b7')
                self.assertContains(lesson, 'role="img"')
                self.assertContains(lesson, 'id="gallery"')
                self.assertContains(lesson, 'id="checkup"')
                self.assertContains(lesson, '翻开答案')
                self.assertContains(lesson, 'aria-current="page"', count=1)

    def test_circulation_has_both_activities_and_local_assets(self):
        url = reverse('science-body-lesson', args=['circulation'])
        response = self.client.get(url)
        self.assertContains(response, 'id="heart"')
        self.assertContains(response, 'id="pulse"')
        self.assertContains(response, 'data-heart-motion-status role="status"')
        self.assertContains(response, 'data-seconds="30"')
        self.assertContains(response, '心脏正面简化剖面')
        for asset in ('science/body.css', 'science/body.js'):
            self.assertContains(response, f'/static/{asset}')
            self.assertTrue(finders.find(asset))

    def test_unknown_lesson_and_unsupported_method(self):
        self.assertEqual(self.client.get(reverse('science-body-lesson', args=['missing'])).status_code, 404)
        self.assertEqual(self.client.post(reverse('science-body')).status_code, 405)

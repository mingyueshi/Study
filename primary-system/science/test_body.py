from django.contrib.staticfiles import finders
from django.test import SimpleTestCase
from django.urls import reverse


class HumanBodyStationTests(SimpleTestCase):
    def test_index_and_twelve_lessons_are_public(self):
        index = self.client.get(reverse('science-body'))
        self.assertContains(index, '人体奥秘站')
        lab = reverse('science-lab')
        self.assertContains(index, f'href="{lab}#lesson-su6-5"')
        self.assertContains(self.client.get(lab), f'data-body-station="{reverse("science-body")}"')
        for slug, label in (
            ('breathing', '呼吸'), ('digestion', '消化'),
            ('circulation', '血液循环'), ('movement', '骨骼肌肉'),
            ('nerves', '大脑与神经'), ('senses', '眼耳与感官'),
            ('endocrine', '内分泌'), ('urinary', '泌尿'),
            ('immunity', '免疫'), ('skin', '皮肤'),
            ('nutrition', '食物与营养'), ('sleep', '睡眠与生物钟'),
        ):
            with self.subTest(slug=slug):
                lesson_url = reverse('science-body-lesson', args=[slug])
                self.assertContains(index, f'href="{lesson_url}"')
                lesson = self.client.get(lesson_url)
                self.assertContains(lesson, f'{label} · 人体奥秘站')
                self.assertContains(lesson, '/static/science/body.js?v=8512878a18b7')
                if lesson.context['process_observation_id']:
                    self.assertContains(lesson, 'role="img"')
                    self.assertContains(lesson, f'data-body-process="{slug}"')
                    self.assertContains(lesson, 'data-process-progress')
                    self.assertContains(lesson, 'data-process-speed')
                    self.assertContains(lesson, 'science/body-process.js')
                else:
                    self.assertContains(lesson, 'id="explore"', count=1)
                    self.assertContains(lesson, 'name="body-route"', count=3)
                    self.assertContains(lesson, 'data-body-photo', count=1)
                    self.assertNotContains(lesson, 'science/body-process.js')
                self.assertContains(lesson, 'id="gallery"')
                self.assertContains(lesson, 'id="checkup"')
                self.assertContains(lesson, '翻开答案')
                self.assertContains(lesson, 'aria-current="page"', count=1)

    def test_circulation_has_both_activities_and_local_assets(self):
        url = reverse('science-body-lesson', args=['circulation'])
        response = self.client.get(url)
        for anchor in ('heart', 'pulse', 'notebook', 'gallery', 'experiment', 'checkup'):
            self.assertContains(response, f'id="{anchor}"', count=1)
        self.assertContains(response, 'data-process-status role="status"')
        self.assertContains(response, 'data-seconds="30"')
        self.assertContains(response, '心脏正面简化剖面')
        self.assertContains(response, 'id="circulation-observation" data-process-settings')
        self.assertContains(response, 'data-process-mode="pump"', count=1)
        self.assertContains(response, 'data-process-mode="circuit"', count=1)
        self.assertContains(response, 'data-process-speed', count=1)
        self.assertContains(response, 'data-process-phases', count=1)
        self.assertContains(response, 'data-circuit-oxygen')
        self.assertContains(response, 'data-circuit-track=', count=8)
        for asset in ('science/body.css', 'science/body.js'):
            self.assertContains(response, f'/static/{asset}')
            self.assertTrue(finders.find(asset))

    def test_experiment_sidebar_preserves_bookmarks_and_static_diagrams(self):
        for slug, settings_id in (
            ('breathing', 'breath-observation'),
            ('digestion', 'digestion-observation'),
            ('movement', 'movement-observation'),
            ('nerves', 'nerves-observation'),
            ('senses', 'senses-observation'),
        ):
            with self.subTest(slug=slug):
                response = self.client.get(reverse('science-body-lesson', args=[slug]))
                for anchor in ('explore', 'gallery', 'experiment', 'checkup', 'body-notes-title', f'{slug}-title'):
                    self.assertContains(response, f'id="{anchor}"', count=1)
                self.assertContains(response, f'id="{settings_id}" data-process-settings')
                self.assertContains(response, 'data-process-speed', count=1)
                self.assertContains(response, 'data-process-phases', count=1)
                self.assertContains(response, '当前显示静态图')
                if slug == 'breathing':
                    self.assertContains(response, 'class="body-breath-thorax"')
                    self.assertContains(response, 'class="body-breath-alveoli"')
                elif slug == 'digestion':
                    self.assertContains(response, 'href="#digestion-intestine-path"', count=2)
                elif slug == 'movement':
                    self.assertContains(response, 'data-arm-angle', count=1)
                    self.assertContains(response, 'data-arm-value', count=1)
                    self.assertContains(response, 'class="body-triceps-tendon"')
                elif slug == 'nerves':
                    self.assertContains(response, 'id="reaction"', count=1)
                    self.assertContains(response, 'href="#reaction"', count=1)
                    self.assertContains(response, 'class="body-stage body-process-stage body-nerves-stage"')
                    self.assertContains(response, '<figcaption data-process-caption>', count=1)
                else:
                    self.assertContains(response, 'id="blindspot"', count=1)
                    self.assertContains(response, 'href="#blindspot"', count=1)
                    self.assertContains(response, 'class="body-stage body-process-stage body-senses-stage"')
                    for mode in ('eye', 'ear', 'smell', 'taste'):
                        self.assertContains(response, f'data-process-mode="{mode}"', count=1)

    def test_unknown_lesson_and_unsupported_method(self):
        self.assertEqual(self.client.get(reverse('science-body-lesson', args=['missing'])).status_code, 404)
        self.assertEqual(self.client.post(reverse('science-body')).status_code, 405)

    def test_missions_progress_and_notebook_are_connected(self):
        index = self.client.get(reverse('science-body'))
        self.assertContains(index, 'id="missions"')
        self.assertContains(index, 'data-map-organ=', count=7)
        self.assertContains(index, 'data-organ-shape=', count=7)
        self.assertContains(index, 'data-organ-dialog>')
        self.assertContains(index, 'data-mission-mode="anatomy" aria-pressed="true"')
        self.assertContains(index, 'data-scene=', count=3)
        self.assertContains(index, 'data-stamp=', count=12)
        progress = index.context['body_progress']
        self.assertEqual(len(progress['challenges']), 7)
        self.assertEqual(sum(len(item['questions']) for item in progress['lessons']), 36)
        self.assertContains(index, '<noscript>')
        for lesson in index.context['lessons']:
            response = self.client.get(reverse('science-body-lesson', args=[lesson['slug']]))
            for question in lesson['checkup']:
                self.assertContains(response, f'data-body-question="{question["id"]}"')
            if lesson['slug'] == 'circulation':
                self.assertContains(response, 'id="notebook"')
                self.assertContains(response, 'data-notebook-export')
            else:
                self.assertNotContains(response, 'id="notebook"')
        for asset in ('science/body-lab.js', 'science/body-lab.css',
                      'science/body-progress.js', 'science/body-notebook.js'):
            self.assertTrue(finders.find(asset))

    def test_system_layers_and_health_scenarios_are_linked(self):
        station_url = reverse('science-body')
        response = self.client.get(station_url)
        self.assertContains(response, 'id="healthy-life"', count=1)
        for layer in ('organs', 'skeleton', 'muscles', 'vessels', 'nerves'):
            self.assertContains(response, f'data-atlas-select="{layer}"', count=1)
            if layer != 'organs':
                self.assertContains(response, f'data-atlas-art="{layer}" hidden', count=1)
        for scene in response.context['health']['scenarios']:
            anchor = f'health-{scene["id"]}'
            self.assertContains(response, f'id="{anchor}"', count=1)
            for link in scene['links']:
                url = reverse('science-body-lesson', args=[link['lesson']])
                fragment = f'#{link["anchor"]}' if link.get('anchor') else ''
                self.assertContains(response, f'href="{url}{fragment}">{link["label"]}')
                self.assertContains(self.client.get(url), f'href="{station_url}#{anchor}"')

    def test_growth_and_organ_reading_are_available_without_javascript(self):
        response = self.client.get(reverse('science-body'))
        self.assertContains(response, 'href="#growth"')
        self.assertContains(response, 'id="growth"')
        growth = response.context['growth']
        self.assertEqual(len(growth['stages']), 5)
        for stage in growth['stages']:
            self.assertContains(response, f'id="growth-{stage["id"]}"')
            self.assertContains(response, stage['body'])
        self.assertContains(response, growth['note'])
        for source in growth['sources']:
            self.assertContains(response, f'href="{source["url"]}"')
        for organ in response.context['expedition']['organs']:
            self.assertContains(response, organ['location'])
            self.assertContains(response, organ['description'])

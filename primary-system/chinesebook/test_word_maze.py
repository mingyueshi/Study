from django.contrib.auth import get_user_model
from django.contrib.staticfiles import finders
from django.test import SimpleTestCase, TestCase
from django.urls import reverse


class WordMazePageTests(SimpleTestCase):
    def test_each_route_renders_its_own_gates_and_paper_fallback(self):
        url = reverse('word-maze')
        for route, name in [('synonym', '近义词'), ('antonym', '反义词'), ('polysemy', '多义词辨析')]:
            with self.subTest(route=route):
                response = self.client.get(url, {'route': route})
                self.assertContains(response, f'{name}路线')
                self.assertContains(response, 'data-maze-gate ', count=6)
                self.assertContains(response, '参考答案与理由', count=6)
                self.assertTrue(all(len(gate['revision']) == 16 for gate in response.context['gates']))
                self.assertContains(response, f'href="?route={route}#play" aria-current="location"')
                self.assertIn('no-store', response['Cache-Control'])
                for suffix in ('css', 'js'):
                    asset = f'study_topics/word-maze.{suffix}'
                    self.assertTrue(finders.find(asset))
                    self.assertContains(response, f'/static/{asset}?v=')
        self.assertContains(self.client.get(url, {'route': 'polysemy'}), '水很<mark>深</mark>。')
        self.assertEqual(self.client.get(url, {'route': 'unknown'}).context['route']['id'], 'synonym')
        self.assertEqual(self.client.post(url).status_code, 405)


class WordMazeEntryTests(TestCase):
    def test_entry_and_browser_storage_scope(self):
        url = reverse('word-maze')
        self.assertContains(self.client.get(reverse('home'), {'area': 'chinese'}), f'href="{url}"')
        self.assertNotContains(self.client.get(reverse('home'), {'area': 'science'}), f'href="{url}"')
        self.assertContains(self.client.get(url), 'data-storage-scope="guest"')
        user = get_user_model().objects.create_user(username='word-maze-learner')
        self.client.force_login(user)
        self.assertContains(self.client.get(url), f'data-storage-scope="user-{user.pk}"')

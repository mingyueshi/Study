from datetime import date
from urllib.parse import urlsplit

from django.contrib.staticfiles import finders
from django.test import SimpleTestCase, TestCase
from django.urls import reverse

from .content import load_stations


class OriginsContentTests(SimpleTestCase):
    def test_station_order_and_content(self):
        stations = load_stations()
        self.assertEqual([station['slug'] for station in stations], [
            'footprints', 'family-tree', 'early-life', 'migration', 'china-sites',
        ])
        for station in stations:
            with self.subTest(station=station['slug']):
                self.assert_text_fields(station, 'label', 'title', 'summary', 'opening', 'takeaway')
                date.fromisoformat(station['checked_on'])
                self.assertGreaterEqual(len(station['sources']), 2)
                source_numbers = range(1, len(station['sources']) + 1)
                for source in station['sources']:
                    self.assert_text_fields(source, 'title')
                    url = urlsplit(source['url'])
                    self.assertEqual(url.scheme, 'https')
                    self.assertTrue(url.netloc)

                for figure in station['figures']:
                    self.assert_text_fields(figure, 'alt', 'caption', 'credit')
                    self.assertTrue(finders.find(figure['path']), figure['path'])
                    self.assertIn(figure['source'], source_numbers)
                self.assertTrue(station['figures'])
                self.assertEqual(len(station['clues']), 3)
                for clue in station['clues']:
                    self.assert_text_fields(clue, 'title', 'observation', 'meaning')
                    self.assertIn(clue['source'], source_numbers)

                quiz = station['quiz']
                self.assert_text_fields(quiz, 'prompt')
                self.assertEqual(len(quiz['choices']), 3)
                self.assertEqual(sum(choice['correct'] is True for choice in quiz['choices']), 1)
                for choice in quiz['choices']:
                    self.assertIsInstance(choice['correct'], bool)
                    self.assert_text_fields(choice, 'label', 'feedback')

    def test_timeline_bounds_and_china_map_markers(self):
        stations = {station['slug']: station for station in load_stations()}
        self.assert_text_fields(stations['footprints']['figures'][0], 'place', 'age')
        timeline = stations['family-tree']['timeline']
        self.assert_text_fields(timeline, 'title', 'note')
        self.assertEqual(len(timeline['bars']), 4)
        for bar in timeline['bars']:
            self.assert_text_fields(bar, 'label', 'period')
            self.assertLessEqual(0, bar['start'])
            self.assertLess(bar['start'], bar['end'])
            self.assertLessEqual(bar['end'], 100)
            self.assertIn(bar['source'], range(1, len(stations['family-tree']['sources']) + 1))

        sites = stations['china-sites']['clues']
        self.assertEqual([site['title'] for site in sites], ['元谋人', '北京人', '田园洞人'])
        self.assertTrue(finders.find('poetry/china-map.svg'))
        for site in sites:
            self.assert_text_fields(site, 'place', 'period')
        pins = stations['china-sites']['map_pins']
        self.assertEqual([pin['label'] for pin in pins], ['1', '2、3'])
        for pin in pins:
            for axis in ('x', 'y'):
                self.assertLessEqual(0, pin[axis])
                self.assertLessEqual(pin[axis], 100)

    def assert_text_fields(self, item, *fields):
        for field in fields:
            self.assertTrue(item[field].strip(), field)
            self.assertNotRegex(item[field], r'["\r\n]|<[a-zA-Z/!?]')


class OriginsPageTests(SimpleTestCase):
    def test_index_and_all_stations_are_readable_without_database_or_session(self):
        stations = load_stations()
        index = self.client.get(reverse('human-origins'))
        self.assertContains(index, '人类起源')
        self.assertFalse(index.cookies)
        for station in stations:
            with self.subTest(station=station['slug']):
                url = reverse('human-origins-station', args=[station['slug']])
                self.assertContains(index, f'href="{url}"')
                response = self.client.get(url)
                self.assertContains(response, station['opening'])
                self.assertContains(response, station['takeaway'])
                for figure in station['figures']:
                    self.assertContains(response, figure['path'])
                for choice in station['quiz']['choices']:
                    self.assertContains(response, choice['feedback'])
                for number in range(1, len(station['sources']) + 1):
                    self.assertContains(response, f'id="source-{number}"', count=1)
                self.assertFalse(response.cookies)

    def test_station_navigation_and_china_map_links(self):
        first = self.client.get(reverse('human-origins-station', args=['footprints']))
        self.assertContains(first, '下一站')
        self.assertNotContains(first, '上一站')
        last = self.client.get(reverse('human-origins-station', args=['china-sites']))
        self.assertContains(last, '上一站')
        self.assertNotContains(last, '下一站')
        for number in range(1, 4):
            self.assertContains(last, f'href="#clue-{number}"', count=1)
            self.assertContains(last, f'id="clue-{number}"', count=1)

    def test_missing_station_and_unsafe_methods(self):
        self.assertEqual(
            self.client.get(reverse('human-origins-station', args=['missing'])).status_code, 404,
        )
        self.assertEqual(
            self.client.post(reverse('human-origins-station', args=['footprints'])).status_code, 405,
        )


class OriginsHomeEntryTests(TestCase):
    def test_home_science_filter_links_to_origins(self):
        response = self.client.get(reverse('home'), {'area': 'science'})
        self.assertContains(response, f'href="{reverse("human-origins")}"')
        self.assertContains(response, '未解之谜研究所')
        response = self.client.get(reverse('home'), {'area': 'english'})
        self.assertNotContains(response, f'href="{reverse("human-origins")}"')

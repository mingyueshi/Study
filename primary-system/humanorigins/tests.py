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
                self.assertEqual(len(station['clues']), 5 if station['slug'] == 'china-sites' else 3)
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
        self.assertEqual([site['title'] for site in sites[:3]], ['元谋人', '北京人', '田园洞人'])
        self.assertTrue(finders.find('poetry/china-map.svg'))
        for site in sites:
            self.assert_text_fields(site, 'place', 'period')
        pins = stations['china-sites']['map_pins']
        self.assertEqual(len(pins), 4)
        for pin in pins:
            for axis in ('x', 'y'):
                self.assertLessEqual(0, pin[axis])
                self.assertLessEqual(pin[axis], 100)

    def test_china_sites_stable_links_and_minimum_age_record(self):
        stations = {station['slug']: station for station in load_stations()}
        china = stations['china-sites']
        atlas = stations['migration']['atlas']
        markers = {marker['id']: marker for marker in atlas['map_markers']}
        people = {person['id'] for person in atlas['groups']}
        sites = {site['id']: site for site in china['clues']}
        self.assertEqual(len(sites), 5)
        self.assertEqual([site['anchor'] for site in china['clues'][:3]], ['clue-1', 'clue-2', 'clue-3'])
        self.assertEqual(sorted(site['order'] for site in sites.values()), list(range(1, 6)))
        self.assert_text_fields(china['site_map'], 'title', 'alt', 'note', 'list_label')
        pinned = []
        for pin in china['map_pins']:
            self.assertTrue(pin['sites'])
            self.assertTrue(set(pin['sites']) <= sites.keys())
            pinned.extend(pin['sites'])
        self.assertEqual(sorted(pinned), sorted(sites))
        for site in sites.values():
            self.assertRegex(site['id'], r'^[a-z-]+$')
            self.assertRegex(site['anchor'], r'^[a-z0-9-]+$')
            if 'group' in site:
                self.assertIn(site['group'], people)
                self.assertEqual(markers[site['marker']]['group'], site['group'])
                self.assertEqual(markers[site['marker']]['site'], site['id'])
                self.assertIn(site['year'], [step['years_ago'] for step in atlas['steps']])
                self.assert_text_fields(site['figure'], 'caption', 'alt', 'credit')
                self.assertTrue(finders.find(site['figure']['path']))
                self.assertIn(site['figure']['source'], range(1, len(china['sources']) + 1))
                self.assert_text_fields(site['figure']['observation'], 'prompt', 'answer')
            for number in site.get('supplementary_sources', []):
                self.assertIn(number, range(1, len(china['sources']) + 1))
        harbin = markers['denisovans-harbin']
        self.assertEqual(harbin['record_type'], 'minimum_age')
        self.assertEqual(harbin['oldest'], 146000)
        self.assertEqual(harbin['youngest'], 146000)
        self.assertEqual(harbin['status'], 'unknown')

    def assert_text_fields(self, item, *fields):
        for field in fields:
            self.assertTrue(item[field].strip(), field)
            self.assertNotRegex(item[field], r'["\r\n]|<[a-zA-Z/!?]')

    def test_family_comparison_and_guided_evidence(self):
        stations = {station['slug']: station for station in load_stations()}
        family = stations['family-tree']
        atlas = stations['migration']['atlas']
        groups = {group['id']: group for group in atlas['groups']}
        markers = {marker['id']: marker for marker in atlas['map_markers']}
        comparison = family['comparison']
        self.assert_text_fields(comparison, 'title', 'intro', 'note', 'timeline_title', 'timeline_note')
        self.assertEqual({card['group'] for card in comparison['cards']}, set(groups))
        self.assertEqual(len(comparison['cards']), len(groups))
        for card in comparison['cards']:
            self.assert_text_fields(card, 'evidence', 'observation')
            self.assertIn(card['source'], range(1, len(family['sources']) + 1))
            marker = markers[card['marker']]
            self.assertEqual(marker['group'], card['group'])
            self.assertIn(card['year'], [step['years_ago'] for step in atlas['steps']])
            self.assertLessEqual(marker['youngest'], card['year'])
            self.assertLessEqual(card['year'], marker['oldest'])
        for bar in family['timeline']['bars']:
            if 'group' in bar:
                self.assertIn(bar['group'], groups)

        figures = [comparison['figure']]
        figures += [clue['figure'] for clue in stations['early-life']['clues'] if 'figure' in clue]
        self.assertEqual(len(figures), 3)
        for figure in figures:
            self.assert_text_fields(figure, 'alt', 'caption', 'credit')
            self.assertTrue(finders.find(figure['path']), figure['path'])
            self.assert_text_fields(figure['observation'], 'prompt', 'answer')
        self.assertIn(comparison['figure']['source'], range(1, len(family['sources']) + 1))
        for clue in stations['early-life']['clues']:
            if 'figure' in clue:
                self.assertIn(clue['figure']['source'], range(1, len(stations['early-life']['sources']) + 1))
        for station in stations.values():
            for resource in station.get('resources', []):
                self.assert_text_fields(resource, 'title', 'prompt')
                self.assertIn(resource['source'], range(1, len(station['sources']) + 1))

    def test_migration_atlas_structure_and_evidence_boundaries(self):
        station = next(item for item in load_stations() if item['slug'] == 'migration')
        atlas = station['atlas']
        self.assert_text_fields(atlas, 'title', 'intro', 'note', 'identity_note', 'extinction_note',
                                'known_status', 'later_status')
        self.assertTrue(finders.find(atlas['basemap']))
        steps = atlas['steps']
        years = [step['years_ago'] for step in steps]
        self.assertEqual(years, sorted(set(years), reverse=True))
        self.assertEqual(years[-1], 0)
        for step in steps:
            self.assert_text_fields(step, 'label', 'summary')
        regions = {region['id']: region for region in atlas['regions']}
        self.assertEqual(len(regions), len(atlas['regions']))
        groups = {group['id']: group for group in atlas['groups']}
        self.assertEqual(len(groups), len(atlas['groups']))
        for step in steps:
            self.assertIn(step['focus_region'], regions)
            self.assertGreaterEqual(len(step['events']), 1)
            for event in step['events']:
                self.assert_text_fields(event, 'text')
                self.assertIn(event['group'], groups)
                self.assertIn(event['source'], range(1, len(station['sources']) + 1))
        playback = atlas['playback']
        for field in ('play', 'pause', 'resume', 'replay', 'ready', 'playing', 'paused', 'ended',
                      'before', 'known', 'last', 'unknown', 'extinct', 'living', 'note'):
            self.assert_text_fields(playback, field)
        speeds = [item['milliseconds'] for item in playback['speeds']]
        self.assertEqual(len(speeds), len(set(speeds)))
        self.assertTrue(all(2000 <= duration <= 15000 for duration in speeds))
        self.assertIn(playback['default_milliseconds'], speeds)
        for speed in playback['speeds']:
            self.assert_text_fields(speed, 'label')
        for region in regions.values():
            self.assertRegex(region['id'], r'^[a-z-]+$')
            self.assert_text_fields(region, 'label', 'date', 'date_short', 'evidence', 'people_note')
            self.assertIn(region['years_ago'], years)
            self.assertTrue(region['groups'])
            self.assertTrue(set(region['groups']) <= groups.keys())
            self.assertTrue(set(region['sources']) <= set(range(1, len(station['sources']) + 1)))
            self.assertTrue(region['sources'])
            for axis in ('x', 'y'):
                self.assertLessEqual(0, region[axis])
                self.assertLessEqual(region[axis], 100)
        for group in groups.values():
            self.assertRegex(group['id'], r'^[a-z-]+$')
            self.assert_text_fields(group, 'label', 'period', 'place', 'ending', 'note')
            self.assertIn(group['status'], ('living', 'approximate', 'unknown'))
            self.assertGreater(group['oldest'], group['youngest'])
            self.assertGreaterEqual(group['youngest'], 0)
            self.assertIn(group['source'], range(1, len(station['sources']) + 1))
            self.assertRegex(group['color'], r'^#[0-9a-f]{6}$')
        self.assertEqual(len({group['color'] for group in groups.values()}), len(groups))
        markers = atlas['map_markers']
        self.assertEqual(len({marker['id'] for marker in markers}), len(markers))
        for marker in markers:
            self.assertRegex(marker['id'], r'^[a-z-]+$')
            self.assertIn(marker.get('record_type', 'range'), ('range', 'minimum_age'))
            self.assert_text_fields(marker, 'place', 'period', 'note')
            self.assertIn(marker['group'], groups)
            self.assertIn(marker['region'], regions)
            if marker.get('record_type') == 'minimum_age':
                self.assertEqual(marker['oldest'], marker['youngest'])
            else:
                self.assertGreater(marker['oldest'], marker['youngest'])
            self.assertGreaterEqual(marker['youngest'], 0)
            self.assertIn(marker['status'], ('living', 'approximate', 'unknown'))
            if marker['status'] == 'approximate':
                self.assertEqual(groups[marker['group']]['status'], 'approximate')
            self.assertIn(marker['source'], range(1, len(station['sources']) + 1))
            for axis in ('x', 'y', 'label_x', 'label_y'):
                self.assertLessEqual(0, marker[axis])
                self.assertLessEqual(marker[axis], 100)
            if marker['group'] == 'sapiens':
                region = regions[marker['region']]
                self.assertEqual(marker['oldest'], region['years_ago'])
                self.assertEqual(marker['youngest'], 0)
                self.assertEqual(marker['status'], 'living')
                self.assertEqual((marker['x'], marker['y']), (region['x'], region['y']))
        self.assertEqual({marker['group'] for marker in markers}, set(groups))
        self.assertEqual({marker['region'] for marker in markers if marker['group'] == 'sapiens'}, set(regions))
        self.assert_text_fields(atlas['map_key'], 'note', 'known', 'last', 'unknown', 'extinct',
                                'living', 'uncertain_heading', 'none_uncertain', 'unknown_today',
                                'selected', 'back_to_map', 'minimum_age', 'site_link', 'family_link')
        self.assertEqual(groups['sapiens']['status'], 'living')
        self.assertEqual(groups['sapiens']['youngest'], 0)
        self.assertEqual(groups['denisovans']['status'], 'unknown')
        self.assertEqual(groups['luzonensis']['status'], 'unknown')
        for route in atlas['routes']:
            self.assertIn(route['from'], regions)
            self.assertIn(route['to'], regions)
            self.assertIn(route['years_ago'], years)
            self.assertLessEqual(route['years_ago'], regions[route['from']]['years_ago'])
            self.assertLessEqual(route['years_ago'], regions[route['to']]['years_ago'])
            for point in route['via']:
                self.assertEqual(len(point), 2)
                self.assertTrue(all(0 <= value <= 100 for value in point))


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
            self.assertContains(last, f'href="#clue-{number}"')
            self.assertContains(last, f'id="clue-{number}"', count=1)

    def test_missing_station_and_unsafe_methods(self):
        self.assertEqual(
            self.client.get(reverse('human-origins-station', args=['missing'])).status_code, 404,
        )
        self.assertEqual(
            self.client.post(reverse('human-origins-station', args=['footprints'])).status_code, 405,
        )

    def test_migration_map_and_no_script_region_records(self):
        response = self.client.get(reverse('human-origins-station', args=['migration']))
        self.assertContains(response, 'id="migration-atlas"', count=1)
        self.assertContains(response, 'id="origins-atlas-data"', count=1)
        self.assertContains(response, 'humanorigins/migration.js')
        self.assertTrue(finders.find('humanorigins/migration.js'))
        self.assertContains(response, 'id="atlas-play"', count=1)
        self.assertContains(response, 'id="atlas-local-people"', count=1)
        self.assertContains(response, 'id="atlas-speed"', count=1)
        self.assertContains(response, 'id="atlas-uncertain-records"', count=1)
        self.assertContains(response, 'class="origins-hominin-pin"', count=17)
        station = next(item for item in load_stations() if item['slug'] == 'migration')
        for region in station['atlas']['regions']:
            self.assertContains(response, f'id="region-{region["id"]}"', count=1)
            self.assertContains(response, region['evidence'])
        for group in station['atlas']['groups']:
            self.assertContains(response, group['ending'])
        self.assertContains(self.client.get(reverse('human-origins')), 'migration/#migration-atlas')

    def test_comparison_photos_resources_and_map_feedback(self):
        family = self.client.get(reverse('human-origins-station', args=['family-tree']))
        migration = next(item for item in load_stations() if item['slug'] == 'migration')
        for person in migration['atlas']['groups']:
            self.assertContains(family, f'id="family-{person["id"]}"', count=1)
            self.assertContains(family, person['period'])
            self.assertContains(family, person['color'])
        self.assertContains(family, 'humanorigins/skull-comparison.jpg')
        self.assertContains(family, 'https://humanorigins.si.edu/evidence/3d-collection')
        self.assertContains(family, '需联网')
        early = self.client.get(reverse('human-origins-station', args=['early-life']))
        self.assertContains(early, 'humanorigins/cutmarked-bone.webp')
        self.assertContains(early, 'humanorigins/burned-flint.webp')
        self.assertContains(early, 'humanorigins/figures.js')
        self.assertContains(early, 'id="origins-image-dialog"', count=1)
        atlas = self.client.get(reverse('human-origins-station', args=['migration']))
        text = atlas.content.decode()
        self.assertLess(text.index('id="atlas-map"'), text.index('id="atlas-marker-detail"'))
        self.assertLess(text.index('id="atlas-marker-detail"'), text.index('class="origins-era-panel"'))

    def test_china_sites_and_family_cross_links_keep_legacy_anchors(self):
        china = self.client.get(reverse('human-origins-station', args=['china-sites']))
        family = self.client.get(reverse('human-origins-station', args=['family-tree']))
        for site, year in [('baishiya', 160000), ('harbin', 146000)]:
            self.assertContains(china, f'id="site-{site}"', count=1)
            self.assertContains(china, f'?year={year}&amp;marker=denisovans-{site}#migration-atlas')
            self.assertContains(family, f'/human-origins/china-sites/#site-{site}')
        self.assertContains(china, '/human-origins/family-tree/#family-denisovans')
        self.assertContains(china, 'humanorigins/xiahe-mandible.jpg')
        self.assertContains(china, 'humanorigins/harbin-cranium.jpg')
        text = china.content.decode()
        self.assertLess(text.index('id="clue-2"'), text.index('id="site-baishiya"'))
        self.assertLess(text.index('id="site-harbin"'), text.index('id="clue-3"'))


class OriginsHomeEntryTests(TestCase):
    def test_home_science_filter_links_to_origins(self):
        response = self.client.get(reverse('home'), {'area': 'science'})
        self.assertContains(response, f'href="{reverse("human-origins")}"')
        self.assertContains(response, '未解之谜研究所')
        response = self.client.get(reverse('home'), {'area': 'english'})
        self.assertNotContains(response, f'href="{reverse("human-origins")}"')

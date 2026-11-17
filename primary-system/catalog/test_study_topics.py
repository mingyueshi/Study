from html.parser import HTMLParser
from hashlib import sha256
from pathlib import Path

from django.contrib.staticfiles import finders
from django.test import SimpleTestCase, TestCase
from django.urls import reverse


HISTORY_PAGES = (
    'history-study', 'history-timeline', 'history-timeline-timeline',
    'history-timeline-era', 'history-timeline-event', 'history-timeline-dynasties',
    'history-timeline-people', 'history-timeline-person',
    'history-timeline-civilizations', 'history-timeline-civilization',
    'history-timeline-ancient-science', 'history-timeline-technology',
    'history-timeline-silk-road', 'history-timeline-silk-city', 'history-timeline-territory',
)
GEOGRAPHY_PAGES = (
    'geography-study', 'geography-atlas', 'geography-atlas-china', 'geography-atlas-china-3d',
    'geography-atlas-world', 'geography-atlas-world-3d', 'geography-atlas-province', 'geography-atlas-places',
    'geography-atlas-routes', 'geography-atlas-gallery', 'geography-atlas-animals', 'geography-atlas-world-animals',
    'geography-atlas-plants', 'geography-atlas-world-plants',
)
COURSES = (
    ('geography', 'astronomy-explore', 'astro', '天文探索', ('astronomy-index', 'mysteries')),
    ('chinese', 'literature-study', 'lit', '文学常识', ('poetry-index', 'idiom-stories')),
    ('science', 'science-lab', 'sci', '科学实验室', ('science-elements',)),
    ('chinese', 'hanzi-evolution', 'hanzi-evo', '汉字演变馆', ('dictionary', 'hanzi-polyphones')),
)


class TopicMarkup(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.main_count = 0
        self.assets = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'main':
            self.main_count += 1
        if tag == 'script' and 'src' in attrs:
            self.assets.append(attrs['src'])
        if tag == 'link' and attrs.get('rel') == 'stylesheet':
            self.assets.append(attrs['href'])


class StudyTopicPageTests(SimpleTestCase):
    def test_shared_controls_and_learning_settings_across_topics(self):
        routes = HISTORY_PAGES + GEOGRAPHY_PAGES + tuple(course[1] for course in COURSES) + (
            'human-origins', 'science-body', 'science-rumors', 'mysteries',
        )
        for route in routes:
            with self.subTest(route=route):
                response = self.client.get(reverse(route))
                self.assertContains(response, 'id="reading-settings"', count=1)
                self.assertContains(response, '<span>学习设置</span>', count=1)
                self.assertNotContains(response, '<details id="study-effects-settings"')
                self.assertContains(response, '<fieldset id="study-effects-settings"', count=1)
                self.assertContains(response, 'id="study-motion"', count=1)
                self.assertContains(response, 'id="study-sound"', count=1)
                self.assertContains(response, 'data-reading-theme="warm"')
                self.assertContains(response, 'data-reading-size="large"')
                assets = TopicMarkup(response.content.decode()).assets
                self.assertTrue(any('/static/reading-preferences.js?' in asset for asset in assets))
                self.assertTrue(any('/static/reading-preferences.css?' in asset for asset in assets))
                self.assertTrue(any('/static/select-controls.css?' in asset for asset in assets))
                self.assertTrue(any('/static/disclosure-controls.css?' in asset for asset in assets))

    def test_3d_maps_version_local_dependencies_with_their_contents(self):
        for route in ('geography-atlas-china-3d', 'geography-atlas-world-3d'):
            page = TopicMarkup(self.client.get(reverse(route)).content.decode())
            assets = [url for url in page.assets if url.startswith('/static/study_topics/geo-map/')]
            self.assertTrue(any('assets/vendor/three-map.js?' in url for url in assets))
            for url in assets:
                with self.subTest(route=route, asset=url):
                    asset_path = url.removeprefix('/static/').split('?')[0]
                    digest = sha256(Path(finders.find(asset_path)).read_bytes()).hexdigest()[:12]
                    self.assertEqual(url.split('?', 1)[1:], [f'v={digest}'])

    def test_science_and_geography_share_local_process_observation_assets(self):
        for route, consumer in (('science-lab', 'sci/sci-figures.js'), ('geography-study', 'geo/lab.js')):
            with self.subTest(route=route):
                page = TopicMarkup(self.client.get(reverse(route)).content.decode())
                assets = [url.split('?')[0] for url in page.assets]
                for filename in ('sci-process.css', 'sci-process-data.js', 'sci-process.js'):
                    self.assertIn(f'/static/study_topics/sci/{filename}', assets)
                self.assertLess(assets.index('/static/study_topics/sci/sci-process-data.js'),
                                assets.index('/static/study_topics/sci/sci-process.js'))
                self.assertLess(assets.index('/static/study_topics/sci/sci-process.js'),
                                assets.index(f'/static/study_topics/{consumer}'))
                if route == 'science-lab':
                    data = '/static/study_topics/sci/sci-experiments-data.js'
                    player = '/static/study_topics/sci/sci-experiments.js'
                    self.assertIn(data, assets)
                    self.assertIn(player, assets)
                    self.assertLess(assets.index(data), assets.index(player))
                    self.assertLess(assets.index(player), assets.index(f'/static/study_topics/{consumer}'))
                else:
                    data = '/static/study_topics/geo/earth-data.js'
                    player = '/static/study_topics/geo/earth.js'
                    self.assertIn(data, assets)
                    self.assertIn(player, assets)
                    self.assertLess(assets.index(data), assets.index(player))
                    self.assertLess(assets.index(player), assets.index('/static/study_topics/geo/lab.js'))

    def test_pages_render_in_platform_shell_with_local_assets(self):
        for name in (*HISTORY_PAGES, *GEOGRAPHY_PAGES, *(course[1] for course in COURSES)):
            with self.subTest(name=name):
                response = self.client.get(reverse(name))
                self.assertContains(response, 'class="site-header"', count=1)
                self.assertContains(response, 'class="site-footer"', count=1)
                self.assertFalse(response.cookies)
                page = TopicMarkup(response.content.decode())
                self.assertEqual(page.main_count, 1)
                self.assertTrue(any(url.startswith('/static/study_topics/') for url in page.assets))
                for url in page.assets:
                    self.assertTrue(url.startswith('/static/'), url)
                    self.assertTrue(finders.find(url.removeprefix('/static/').split('?')[0]), url)

    def test_original_internal_links_and_unknown_pages(self):
        for name, target, query in (
            ('history-timeline', 'timeline.html', ''),
            ('history-timeline-timeline', 'era.html', '?era=dawn'),
            ('history-timeline-era', 'event.html', '?event=tc35'),
            ('history-timeline-timeline', 'territory.html', '?map=western-han#territory-maps'),
            ('history-timeline-people', 'people.html', '?view=network&person=li-bai'),
            ('history-timeline-people', 'person.html', '?person=li-bai#decisions'),
            ('history-timeline-civilizations', 'civilization.html', '?civilization=maya#station-maya-writing'),
            ('history-timeline-civilizations', 'civilizations.html', '?view=compare&left=egypt&right=maya&theme=writing'),
            ('history-timeline-ancient-science', 'technology.html', '?topic=pi&sides=96#principle'),
            ('history-timeline-technology', 'ancient-science.html', '?category=mathematics'),
            ('history-timeline-silk-road', 'silk-city.html', '?city=quanzhou#city-evidence'),
            ('history-timeline-silk-city', 'silk-road.html', '?route=sea&city=quanzhou#route-map'),
            ('geography-atlas', 'china.html', '?place=f20'),
            ('geography-atlas-china', 'province.html', '?adcode=110000'),
            ('geography-atlas-china', 'china-3d.html', '?place=p710000'),
            ('geography-atlas-china-3d', 'province.html', '?adcode=810000'),
            ('geography-atlas-china', 'animals.html', '?animal=giant-panda'),
            ('geography-atlas-world', 'world-animals.html', '?animal=emperor-penguin'),
            ('geography-atlas-world', 'world-3d.html', '?place=China'),
            ('geography-atlas-world-3d', 'world-3d.html', '?continent=antarctica'),
            ('geography-atlas-china', 'plants.html', '?plant=lotus'),
            ('geography-atlas-world', 'world-plants.html', '?plant=antarctic-hair-grass'),
            ('geography-atlas-places', 'gallery.html', '?place=f20'),
        ):
            with self.subTest(name=name, target=target):
                base = reverse(name).rsplit('/', 1)[0] + '/'
                self.assertEqual(self.client.get(base + target + query).status_code, 200)
        for name in ('history-timeline', 'geography-atlas'):
            self.assertEqual(self.client.get(reverse(name) + 'missing.html').status_code, 404)
            self.assertEqual(self.client.post(reverse(name)).status_code, 405)

    def test_reference_geography_keeps_its_own_route(self):
        self.assertEqual(reverse('geography-index'), '/geography/')
        self.assertEqual(reverse('geography-detail', args=['CHN']), '/geography/CHN/')

    def test_astronomy_portal_has_short_url_and_preserves_old_entry_parameters(self):
        self.assertEqual(reverse('astronomy-explore'), '/astronomy/')
        self.assertEqual(reverse('astronomy-index'), '/astronomy/stars/')
        self.assertEqual(reverse('astronomy-detail', args=[42]), '/astronomy/42/')
        self.assertRedirects(self.client.get('/astronomy/study/?view=lab&solar_term=lichun'),
                             '/astronomy/?view=lab&solar_term=lichun', status_code=301)
        self.assertRedirects(self.client.get('/astronomy/?q=%E5%A4%AA%E9%98%B3&named=1&con=Ori'),
                             '/astronomy/stars/?q=%E5%A4%AA%E9%98%B3&named=1&con=Ori',
                             status_code=301, fetch_redirect_response=False)
        portal = self.client.get('/astronomy/')
        self.assertTemplateUsed(portal, 'study_topics/astronomy_portal.html')
        self.assertContains(portal, 'id="astro-topics"')
        self.assertNotContains(portal, 'class="sidebar"')
        self.assertNotContains(portal, 'astronomy.browser.min.js')
        for view in ('au1', 'au9', 'lab', 'universe', 'facts', 'clinic'):
            response = self.client.get('/astronomy/', {'view': view})
            self.assertTemplateUsed(response, 'study_topics/course.html')
            self.assertContains(response, 'id="cards"')

    def test_main_views_link_to_related_topics(self):
        for main, lesson, label in (
            ('history-timeline-timeline', 'history-study', '历史精讲'),
            ('history-study', 'history-timeline-people', '历史人物馆'),
            ('history-study', 'history-timeline-civilizations', '世界文明巡礼'),
            ('history-study', 'history-timeline-silk-road', '丝绸之路'),
            ('geography-atlas-china', 'geography-study', '地理小课堂'),
            ('geography-atlas-china', 'geography-atlas-china-3d', '3D 中国地图'),
            ('geography-atlas-world', 'geography-atlas-world-3d', '3D 世界地图'),
            ('geography-atlas-china', 'geography-atlas-animals', '中国动物地图'),
            ('geography-atlas-world', 'geography-atlas-world-animals', '世界动物地图'),
            ('geography-atlas-china', 'geography-atlas-plants', '中国植物地图'),
            ('geography-atlas-world', 'geography-atlas-world-plants', '世界植物地图'),
        ):
            with self.subTest(main=main):
                response = self.client.get(reverse(main))
                self.assertContains(response, f'href="{reverse(lesson)}"')
                self.assertContains(response, label)

    def test_history_people_entry_and_data_load_before_consumers(self):
        response = self.client.get(reverse('history-timeline-timeline'))
        self.assertContains(response, 'href="people.html"')
        self.assertContains(response, '历史人物馆')
        for name, consumer in (
            ('history-timeline-people', 'people-app.js'),
            ('history-timeline-person', 'person-app.js'),
            ('history-timeline-event', 'event-app.js'),
        ):
            with self.subTest(name=name):
                response = self.client.get(reverse(name))
                assets = TopicMarkup(response.content.decode()).assets
                prefix = '/static/study_topics/history-timeline/'
                for dependency in ('people-data.js', 'people-shared.js'):
                    self.assertLess(assets.index(prefix + dependency), assets.index(prefix + consumer))

    def test_civilization_data_and_images_are_loaded_before_page_apps(self):
        for name, consumer in (
            ('history-timeline-civilizations', 'civilizations-app.js'),
            ('history-timeline-civilization', 'civilization-app.js'),
            ('history-timeline-event', 'event-app.js'),
        ):
            with self.subTest(name=name):
                assets = TopicMarkup(self.client.get(reverse(name)).content.decode()).assets
                prefix = '/static/study_topics/history-timeline/'
                for dependency in ('media-data.js', 'civilizations-data.js', 'civilizations-shared.js'):
                    self.assertLess(assets.index(prefix + dependency), assets.index(prefix + consumer))

    def test_ancient_science_dependencies_and_active_navigation(self):
        prefix = '/static/study_topics/history-timeline/'
        for name, consumer in (
            ('history-timeline-ancient-science', 'ancient-science-app.js'),
            ('history-timeline-technology', 'technology-app.js'),
            ('history-timeline-event', 'event-app.js'),
            ('history-timeline-person', 'person-app.js'),
        ):
            with self.subTest(name=name):
                response = self.client.get(reverse(name))
                assets = TopicMarkup(response.content.decode()).assets
                for dependency in ('media-data.js', 'people-data.js', 'ancient-science-data.js', 'ancient-science-shared.js'):
                    self.assertLess(assets.index(prefix + dependency), assets.index(prefix + consumer))
                self.assertContains(response, '中国古代科技')
        response = self.client.get(reverse('history-timeline-technology') + '?topic=pi')
        self.assertContains(response, f'href="{reverse("history-timeline-ancient-science")}" aria-current="location"')

    def test_silk_road_reuses_lesson_assets_and_loads_data_before_apps(self):
        prefix = '/static/study_topics/'
        for route, consumer in (
            ('history-timeline-silk-road', 'silk-road-app.js'),
            ('history-timeline-silk-city', 'silk-city-app.js'),
        ):
            with self.subTest(route=route):
                response = self.client.get(reverse(route))
                assets = [asset.split('?')[0] for asset in TopicMarkup(response.content.decode()).assets]
                for dependency in ('history/knowledge-dynasties.js', 'history/media.js', 'history-timeline/silk-road-data.js', 'history-timeline/silk-road-geo.js', 'history-timeline/silk-road-shared.js'):
                    self.assertLess(assets.index(prefix + dependency), assets.index(prefix + 'history-timeline/' + consumer))
                self.assertContains(response, '丝绸之路')
        response = self.client.get(reverse('history-timeline-silk-city') + '?city=quanzhou')
        self.assertContains(response, f'href="{reverse("history-timeline-silk-road")}" aria-current="location"')
        self.assertContains(response, f'data-silk-road="{reverse("history-timeline-silk-road")}"')

    def test_territory_is_the_single_map_page_and_dynasties_keeps_legacy_routing(self):
        prefix = '/static/study_topics/history-timeline/'
        response = self.client.get(reverse('history-timeline-territory'))
        self.assertContains(response, '<h1>历史疆域地图</h1>')
        self.assertContains(response, 'id="territory-svg"', count=1)
        self.assertContains(response, 'id="territory-play"', count=1)
        assets = [url.split('?')[0] for url in TopicMarkup(response.content.decode()).assets]
        for name in ('content.js', 'dynasty-data.js', 'territory-data.js', 'territory-geo.js', 'shared.js'):
            self.assertLess(assets.index(prefix + name), assets.index(prefix + 'territory-app.js'))
        self.assertNotIn(prefix + 'dynasty-app.js', assets)
        self.assertContains(response, f'href="{reverse("history-timeline-territory")}" aria-current="page"')
        old = self.client.get(reverse('history-timeline-dynasties'))
        self.assertNotContains(old, 'id="territory-svg"')
        old_assets = [url.split('?')[0] for url in TopicMarkup(old.content.decode()).assets]
        self.assertLess(old_assets.index(prefix + 'territory-links.js'), old_assets.index(prefix + 'dynasty-app.js'))
        self.assertNotIn(prefix + 'territory-geo.js', old_assets)
        self.assertContains(old, 'id="cal-title"')
        self.assertContains(old, 'id="dyn-flow"')

    def test_calendar_hosts_local_audio_and_atlas_links_to_map_skills(self):
        response = self.client.get(reverse('history-timeline-dynasties'))
        self.assertContains(response, 'id="cal-title"')
        self.assertContains(response, 'study_topics/history/assets/audio/chronology.m4a', count=1)
        for page in ('geography-atlas-china', 'geography-atlas-world'):
            response = self.client.get(reverse(page))
            self.assertContains(response, f'href="{reverse("geography-study")}#lesson-gu2-3"')

    def test_course_pages_have_their_own_assets_and_reference_links(self):
        for area, name, slug, title, references in COURSES:
            with self.subTest(name=name):
                response = self.client.get(reverse(name))
                self.assertContains(response, title)
                self.assertContains(response, f'/static/study_topics/{slug}/{slug}-data.js')
                self.assertContains(response, f'href="{reverse("home")}?area={area}#modules-title"')
                self.assertContains(response, 'id="astro-topics"' if slug == 'astro' else 'id="cards"')
                for reference in references:
                    self.assertContains(response, f'href="{reverse(reference)}"')
                self.assertEqual(self.client.post(reverse(name)).status_code, 405)


class StudyTopicEntryTests(TestCase):
    def test_science_includes_the_evidence_topics_and_accepts_the_old_filter(self):
        urls = [reverse(name) for name in ('science-lab', 'science-body', 'human-origins', 'mysteries', 'science-rumors')]
        for area in ('science', 'exploration'):
            with self.subTest(area=area):
                response = self.client.get(reverse('home'), {'area': area})
                self.assertEqual([card['url'] for card in response.context['entry_cards']], urls)
                self.assertNotContains(response, 'href="?area=exploration"')
                self.assertContains(response, 'href="?area=science" class="on"')
        for name in ('science-body', 'human-origins', 'mysteries', 'science-rumors'):
            response = self.client.get(reverse(name))
            self.assertContains(response, f'href="{reverse("home")}?area=science#modules-title"')

    def test_courses_show_under_their_learning_areas(self):
        for area, route, _, title, _ in COURSES:
            with self.subTest(area=area):
                response = self.client.get(reverse('home'), {'area': area})
                self.assertContains(response, f'href="{reverse(route)}"')
                self.assertContains(response, title)
                self.assertNotContains(response, 'href="?area=astronomy"')
                self.assertNotContains(response, 'href="?area=literature"')

    def test_history_and_geography_keep_their_primary_cards_first(self):
        for area, shown, hidden in (
            ('history', ('history-timeline-timeline', 'history-timeline-territory', 'history-timeline-people', 'history-timeline-civilizations', 'history-timeline-ancient-science', 'history-timeline-silk-road'), ('geography-atlas-china', 'astronomy-explore')),
            ('geography', ('geography-atlas-china', 'astronomy-explore', 'solar-terms'), ('history-timeline-timeline', 'literature-study')),
        ):
            with self.subTest(area=area):
                response = self.client.get(reverse('home'), {'area': area})
                self.assertEqual([card['url'] for card in response.context['entry_cards']], [reverse(name) for name in shown])
                for name in (*hidden, 'history-study', 'geography-study'):
                    self.assertNotContains(response, f'href="{reverse(name)}"')

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
    'geography-study', 'geography-atlas', 'geography-atlas-china', 'geography-china-terrain',
    'geography-atlas-world', 'geography-globe', 'geography-atlas-province', 'geography-atlas-places',
    'geography-atlas-routes', 'geography-atlas-gallery',
    'geography-life-maps', 'geography-life-maps-animals', 'geography-life-maps-plants',
    'geography-life-maps-world-animals', 'geography-life-maps-world-plants', 'geography-province-culture',
    'geography-china-landscapes', 'geography-voyages',
    'geography-earth', 'geography-earth-rocks', 'geography-earth-quakes', 'geography-earth-plates', 'geography-earth-age',
    'geography-ocean', 'geography-ocean-currents', 'geography-ocean-tides', 'geography-ocean-life', 'geography-ocean-seafloor',
    'geography-climate', 'geography-climate-weather', 'geography-climate-types', 'geography-climate-china',
    'geography-map-skills', 'geography-map-skills-scale', 'geography-map-skills-direction',
    'geography-map-skills-legend', 'geography-map-skills-contours', 'geography-map-skills-profile',
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
    def test_energy_environment_has_five_stations_with_local_media_and_demos(self):
        response = self.client.get(reverse('energy-environment'))
        self.assertContains(response, '<h1>能源与环境</h1>', html=True)
        for station in response.context['course']['stations']:
            self.assertContains(response, f'href="#{station["id"]}"')
            self.assertContains(response, f'id="{station["id"]}"')
            self.assertContains(response, station['answer'])
            for link in station.get('links', ()):
                fragment = f'#{link["fragment"]}' if link.get('fragment') else ''
                self.assertContains(response, f'href="{reverse(link["route"])}{fragment}"')
        for tool in ('energy-turbine', 'energy-electricity', 'energy-carbon'):
            self.assertContains(response, f'id="{tool}"')
        for asset in ('energy-turbine.js', 'energy-environment.js', 'energy-environment.css', 'geo-map/assets/three-gorges.jpg'):
            self.assertTrue(finders.find(f'study_topics/{asset}'), asset)
            self.assertContains(response, f'study_topics/{asset}')

    def test_money_trade_links_all_five_stations_and_loads_local_lab_assets(self):
        response = self.client.get(reverse('money-trade'))
        self.assertContains(response, '<h1>货币与贸易</h1>', html=True)
        for station in response.context['course']['stations']:
            self.assertContains(response, f'href="#{station["id"]}"')
            self.assertContains(response, f'id="{station["id"]}"')
            self.assertContains(response, station['answer'])
        for name in ('basket', 'market'):
            self.assertContains(response, f'id="money-{name}-data" type="application/json"')
        for asset in ('money-trade/banliang.jpg', 'money-trade.js', 'money-trade.css'):
            asset = f'study_topics/{asset}'
            self.assertTrue(finders.find(asset), asset)
            self.assertContains(response, asset)
        self.assertContains(response, reverse('mathbook-book', args=['4a']) + '#mu7-2')
        self.assertContains(response, reverse('history-timeline-silk-city') + '?city=quanzhou')

    def test_great_works_directory_and_illustrated_files(self):
        directory = self.client.get(reverse('great-works'))
        self.assertContains(directory, '<h1>伟大工程</h1>', html=True)
        self.assertEqual(len(directory.context['course']['works']), 6)
        for work in directory.context['course']['works']:
            with self.subTest(work=work['id']):
                url = reverse('great-work-detail', args=[work['id']])
                self.assertContains(directory, f'href="{url}"')
                page = self.client.get(url)
                self.assertContains(page, f'<h1>{work["name"]}</h1>', html=True)
                self.assertContains(page, f'great-works.svg#{work["id"]}')
                self.assertContains(page, work['answer'])
                related = work['related']
                self.assertContains(page, f'href="{reverse(related["route"])}{related["suffix"]}"')
                for number in (1, 2, 3):
                    self.assertContains(page, f'href="#clue-{number}"')
                    self.assertContains(page, f'id="clue-{number}"')
        self.assertEqual(self.client.get(reverse('great-work-detail', args=['unknown'])).status_code, 404)
        for asset in ('icons/great-works.svg', 'study_topics/great-works.svg', 'study_topics/great-works.css'):
            self.assertTrue(finders.find(asset), asset)

    def test_great_works_compares_only_two_distinct_known_works(self):
        url = reverse('great-works')
        for query, pair in (({}, ('zhaozhou-bridge', 'hzmb')),
                            ({'left': 'grand-canal', 'right': 'dujiangyan'}, ('grand-canal', 'dujiangyan'))):
            page = self.client.get(url, query)
            self.assertEqual((page.context['left']['id'], page.context['right']['id']), pair)
            self.assertContains(page, '<table')
            self.assertContains(page, page.context['right']['tradeoff'])
        for other in ('grand-canal', 'not-a-work', ''):
            page = self.client.get(url, {'left': 'grand-canal', 'right': other})
            self.assertIn('right', page.context['form'].errors)
            self.assertNotContains(page, '<table')

    def test_time_story_stations_tools_and_crosslinks(self):
        response = self.client.get(reverse('time-story'))
        self.assertContains(response, '<h1>时间的故事</h1>', html=True)
        for station in response.context['course']['stations']:
            self.assertContains(response, f'href="#{station["id"]}"')
            self.assertContains(response, f'id="{station["id"]}"')
            for link in station['links']:
                self.assertContains(response, f'href="{link["url"]}"')
        for slug in ('chunfen', 'xiazhi', 'qiufen', 'dongzhi'):
            self.assertContains(response, f'href="{reverse("solar-terms")}#{slug}"')
        for tool in ('leap', 'zone', 'era'):
            self.assertContains(response, f'id="{tool}-tool"')
        for asset in ('icons/time-story.svg', 'study_topics/time-story.js', 'study_topics/time-story.css'):
            self.assertTrue(finders.find(asset), asset)
            self.assertContains(response, asset)

    def test_map_skills_connects_existing_lessons_and_terrain_tool(self):
        for suffix, target in (
            ('scale', reverse('geography-study') + '#lesson-gu2-3'),
            ('direction', '../study/#lesson-gu2-2'),
            ('legend', '../study/#lesson-gu2-4'),
            ('contours', 'profile.html'),
            ('profile', reverse('geography-china-terrain') + '#gm3-section-draw'),
        ):
            with self.subTest(suffix=suffix):
                response = self.client.get(reverse('geography-map-skills-' + suffix))
                self.assertContains(response, 'href="/geography/map-skills/"')
                self.assertContains(response, f'href="{target}"')
                self.assertContains(response, 'id="skills-map"')
                if suffix in ('scale', 'contours', 'profile'):
                    self.assertContains(response, 'data-sidebar-layout=".experiment-side"')
                    self.assertContains(response, 'study_topics/map-skills/experiment.js?v=')

    def test_climate_map_and_station_charts_use_local_data(self):
        for route, data_files in (
            ('geography-climate-china', ('geo-map/china-geo.js', 'climate/china-climate-grid.js', 'climate/station-normals.js')),
            ('geography-climate-types', ('climate/station-normals.js',)),
        ):
            with self.subTest(route=route):
                response = self.client.get(reverse(route))
                self.assertContains(response, 'href="/geography/climate/"')
                assets = [url.split('?')[0] for url in TopicMarkup(response.content.decode()).assets]
                for filename in data_files:
                    self.assertLess(assets.index('/static/study_topics/' + filename),
                                    assets.index('/static/study_topics/climate/climate-app.js'))
        for route in ('geography-climate-weather', 'geography-climate-china'):
            with self.subTest(route=route):
                response = self.client.get(reverse(route))
                self.assertContains(response, 'data-sidebar-layout=".experiment-side"')
                self.assertContains(response, f'href="{reverse("geography-atlas-china")}"')
                self.assertContains(response, 'study_topics/map-skills/experiment.js?v=')

    def test_ocean_uses_local_outline_and_links_related_stations(self):
        for route in ('geography-ocean', 'geography-ocean-currents'):
            response = self.client.get(reverse(route))
            assets = TopicMarkup(response.content.decode()).assets
            outline = next(url for url in assets if 'geo-map/world-geo.js' in url)
            script = next(url for url in assets if 'ocean/ocean-app.js' in url)
            self.assertLess(assets.index(outline), assets.index(script))
            self.assertContains(response, 'href="/geography/ocean/"')
        for slug, link in (
            ('tides', '../../astronomy/'),
            ('life', reverse('geography-life-maps-world-animals')),
            ('seafloor', '../earth/plates.html?boundary=subduction'),
        ):
            self.assertContains(self.client.get(reverse(f'geography-ocean-{slug}')), f'href="{link}"')
        for slug in ('currents', 'tides'):
            with self.subTest(slug=slug):
                response = self.client.get(reverse(f'geography-ocean-{slug}'))
                self.assertContains(response, 'data-sidebar-layout=".experiment-side"')
                self.assertContains(response, f'href="{reverse("geography-atlas-world")}"')
                assets = TopicMarkup(response.content.decode()).assets
                player = next(url for url in assets if 'earth/earth-motion.js?v=' in url)
                app = next(url for url in assets if 'ocean/ocean-app.js?v=' in url)
                self.assertLess(assets.index(player), assets.index(app))

    def test_earth_interior_routes_share_local_versioned_assets(self):
        for suffix in ('', '-rocks', '-quakes', '-plates', '-age'):
            route = 'geography-earth' + suffix
            response = self.client.get(reverse(route))
            sidebar = '.experiment-side' if suffix == '-plates' else '.earth-sidebar'
            self.assertContains(response, f'data-sidebar-layout="{sidebar}"')
            self.assertContains(response, 'href="/geography/earth/"')
            self.assertContains(response, 'href="rocks.html"')
            topic = response.content.decode().split('data-earth-page=', 1)[1].split('</noscript>', 1)[0]
            self.assertNotIn('<select', topic)
            assets = [url for url in TopicMarkup(response.content.decode()).assets
                      if url.startswith(('/static/study_topics/earth/', '/static/study_topics/map-skills/experiment.'))]
            self.assertEqual(len(assets), 7 if suffix == '-plates' else 5)
            for url in assets:
                asset_path = url.removeprefix('/static/').split('?')[0]
                digest = sha256(Path(finders.find(asset_path)).read_bytes()).hexdigest()[:12]
                self.assertEqual(url.split('?', 1)[1:], [f'v={digest}'])
        self.assertContains(self.client.get(reverse('geography-earth-plates')),
                            f'href="{reverse("geography-globe")}?lab=plates"')

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
        for route in ('geography-china-terrain', 'geography-globe'):
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
            ('geography-atlas-china', 'province.html', '?adcode=810000'),
            ('geography-life-maps', 'animals.html', '?animal=giant-panda'),
            ('geography-life-maps', 'world-animals.html', '?animal=emperor-penguin'),
            ('geography-life-maps', 'plants.html', '?plant=lotus'),
            ('geography-life-maps', 'world-plants.html', '?plant=antarctic-hair-grass'),
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

    def test_province_culture_uses_map_assets_and_has_integrated_entries(self):
        route = reverse('geography-province-culture')
        self.assertEqual(route, '/geography/province-culture/')
        response = self.client.get(route + '?adcode=810000')
        self.assertContains(response, '中国省份文化')
        self.assertContains(response, 'id="culture-map"', count=1)
        self.assertContains(response, 'id="culture-picker"', count=1)
        assets = [url.split('?')[0] for url in TopicMarkup(response.content.decode()).assets]
        for filename in ('china-geo.js', 'map-data.js', 'map-discovery-data.js', 'shared.js', 'province-culture-data.js', 'province-culture.js'):
            self.assertIn('/static/study_topics/geo-map/' + filename, assets)
        self.assertLess(assets.index('/static/study_topics/geo-map/province-culture-data.js'),
                        assets.index('/static/study_topics/geo-map/province-culture.js'))
        for page in ('geography-atlas', 'geography-atlas-china', 'geography-atlas-province'):
            self.assertContains(self.client.get(reverse(page)), f'href="{route}"')
        self.assertContains(response, f'data-atlas-base="{reverse("geography-atlas")}"')

    def test_atlas_bookmarks_redirect_to_independent_topics(self):
        for slug, target, query in (
            ('china-3d', 'geography-china-terrain', '?river=f20&tour=yangtze&stop=yibin'),
            ('world-3d', 'geography-globe', '?voyage=zhenghe&port=malacca'),
            ('animals', 'geography-life-maps-animals', '?animal=giant-panda&bookmark=%2Fmap%2BX'),
            ('plants', 'geography-life-maps-plants', '?plant=ginkgo'),
            ('world-animals', 'geography-life-maps-world-animals', '?animal=emperor-penguin'),
            ('world-plants', 'geography-life-maps-world-plants', '?plant=antarctic-hair-grass'),
            ('province-culture', 'geography-province-culture',
             '?adcode=810000&q=%E9%A6%99%E6%B8%AF&type=%E7%89%B9%E5%88%AB%E8%A1%8C%E6%94%BF%E5%8C%BA'),
        ):
            with self.subTest(slug=slug):
                old_url = reverse(f'geography-atlas-{slug}')
                self.assertEqual(old_url, f'/geography/atlas/{slug}.html')
                for suffix in ('', query):
                    new_url = reverse(target) + suffix
                    response = self.client.get(old_url + suffix)
                    self.assertRedirects(response, new_url, status_code=301)
                    self.assertEqual(response['Location'], new_url)

    def test_terrain_and_voyage_guides_link_to_canonical_map_tools(self):
        terrain_tool = reverse('geography-china-terrain')
        globe = reverse('geography-globe')
        terrain_url = reverse('geography-china-landscapes')
        voyage_url = reverse('geography-voyages')
        terrain = self.client.get(terrain_url)
        voyages = self.client.get(voyage_url)
        self.assertContains(terrain, 'data-routes="mountains rivers"')
        self.assertContains(terrain, f'href="{terrain_tool}#gm3-section"')
        self.assertContains(voyages, 'id="voyage-map"')
        self.assertContains(voyages, f'data-history-event="{reverse("history-timeline-event")}"')
        self.assertContains(voyages, f'data-globe-url="{globe}"')
        self.assertContains(voyages, f'href="{globe}?voyage=zhenghe&amp;port=liujiagang#gw-viewport"')
        self.assertContains(voyages, f'href="{globe}?voyage=magellan-elcano&amp;port=sanlucar#gw-viewport"')
        for guide, filename in ((terrain, 'china-landscapes.js'), (voyages, 'voyages-guide.js')):
            self.assertContains(guide, f'/static/study_topics/geo-map/{filename}?v=')
        for target, url in (
            ('geography-atlas-routes', terrain_url + '#field-trails'),
            ('geography-china-terrain', terrain_url + '#terrain-steps'),
            ('geography-globe', voyage_url + '#compare'),
        ):
            self.assertContains(self.client.get(reverse(target)), f'href="{url}"')
        self.assertEqual(self.client.get(reverse('geography-atlas-routes')).status_code, 200)

    def test_atlas_and_3d_topics_link_directly_to_each_other(self):
        atlas = self.client.get(reverse('geography-atlas-china'))
        for route, flat in (
            ('geography-china-terrain', 'geography-atlas-china'),
            ('geography-globe', 'geography-atlas-world'),
        ):
            with self.subTest(route=route):
                url = reverse(route)
                self.assertContains(atlas, f'href="{url}"')
                page = self.client.get(url)
                self.assertContains(page, f'href="{reverse(flat)}#map"')
                self.assertContains(page, f'data-atlas-base="{reverse("geography-atlas")}"')
                self.assertNotContains(page, 'class="gm-atlas-more"')

    def test_china_terrain_retains_tool_and_observation_anchors(self):
        page = self.client.get(reverse('geography-china-terrain'))
        for anchor in (
            'gm3-section', 'gm3-section-draw', 'gm3-section-hint',
            'gm3-river-title', 'gm3-tour-route-label',
            'gm3-directory', 'gm3-directory-title', 'gm3-observe-title',
        ):
            with self.subTest(anchor=anchor):
                self.assertContains(page, f'id="{anchor}"', count=1)

    def test_globe_links_layers_and_tools_to_existing_topic_sections(self):
        globe = self.client.get(reverse('geography-globe'))
        for modes, route, anchor in (
            ('rain', 'geography-climate-types', 'charts-heading'),
            ('summer winter', 'geography-climate-china', 'zone-choices'),
            ('typhoon', 'geography-climate-weather', 'climate-knowledge'),
            ('plates', 'geography-earth-plates', 'plate-lab'),
            ('pangaea', 'geography-earth-plates', 'earth-explain'),
        ):
            with self.subTest(modes=modes):
                url = reverse(route)
                self.assertContains(globe, f'data-lab-modes="{modes}" href="{url}#{anchor}"')
                self.assertContains(self.client.get(url), f'id="{anchor}"')
        for route, anchor in (
            ('geography-map-skills-scale', 'measure-title'),
            ('geography-map-skills-direction', 'skills-knowledge'),
        ):
            url = reverse(route)
            self.assertContains(globe, f'href="{url}#{anchor}"')
            self.assertContains(self.client.get(url), f'id="{anchor}"')
        astronomy = reverse('astronomy-explore')
        self.assertContains(globe, f'href="{astronomy}?view=au4#lesson-au4-5"')
        self.assertContains(globe, f'data-lab-modes="sky" href="{astronomy}?view=au1"')

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
            self.assertContains(response, 'study_topics/map-skills/experiment.css?v=')
            self.assertContains(response, 'study_topics/map-skills/experiment.js?v=')

    def test_main_views_link_to_related_topics(self):
        for main, lesson, label in (
            ('history-timeline-timeline', 'history-study', '历史精讲'),
            ('history-study', 'history-timeline-people', '历史人物馆'),
            ('history-study', 'history-timeline-civilizations', '世界文明巡礼'),
            ('history-study', 'history-timeline-silk-road', '丝绸之路'),
            ('geography-atlas-china', 'geography-study', '地理小课堂'),
            ('geography-atlas-china', 'geography-life-maps', '动植物地图'),
            ('geography-atlas-china', 'geography-province-culture', '中国省份文化'),
            ('geography-life-maps', 'geography-life-maps-animals', '中国动物地图'),
            ('geography-life-maps', 'geography-life-maps-world-animals', '世界动物地图'),
            ('geography-life-maps', 'geography-life-maps-plants', '中国植物地图'),
            ('geography-life-maps', 'geography-life-maps-world-plants', '世界植物地图'),
        ):
            with self.subTest(main=main):
                response = self.client.get(reverse(main))
                self.assertContains(response, f'href="{reverse(lesson)}"')
                self.assertContains(response, label)

    def test_history_people_entry_and_data_load_before_consumers(self):
        response = self.client.get(reverse('history-timeline-timeline'))
        for anchor in ('timeline-tools', 'timeline-results', 'timeline-flow', 'timeline-pairs', 'era-nav'):
            self.assertContains(response, f'id="{anchor}"', count=1)
        for label in ('事件筛选', '时代与年代', '相关专题'):
            self.assertContains(response, f'<summary>{label}</summary>', html=True)
        self.assertContains(response, 'history-timeline/timeline.css?v=')
        self.assertContains(response, 'history-timeline/timeline-app.js?v=')
        self.assertContains(response, 'href="people.html"')
        self.assertContains(response, '历史人物馆')
        for name, consumer in (
            ('history-timeline-people', 'people-app.js'),
            ('history-timeline-person', 'person-app.js'),
            ('history-timeline-event', 'event-app.js'),
        ):
            with self.subTest(name=name):
                response = self.client.get(reverse(name))
                assets = [url.split("?")[0] for url in TopicMarkup(response.content.decode()).assets]
                prefix = '/static/study_topics/history-timeline/'
                for dependency in ('people-data.js', 'people-shared.js'):
                    self.assertLess(assets.index(prefix + dependency), assets.index(prefix + consumer))

    def test_history_reading_pages_group_tools_and_keep_entry_points(self):
        prefix = '/static/study_topics/history-timeline/'
        for page, query in (('era', '?era=voyage'), ('event', '?event=tc27')):
            with self.subTest(page=page):
                response = self.client.get(reverse(f'history-timeline-{page}') + query)
                for anchor in ('top', f'{page}-page', f'{page}-stations', f'{page}-directory'):
                    self.assertContains(response, f'id="{anchor}"', count=1)
                for label in ('时代切换', '事件目录', '相关专题'):
                    self.assertContains(response, f'<summary>{label}</summary>', html=True)
                self.assertContains(response, f'href="{reverse("history-study")}"', count=1)
                assets = [url.split("?")[0] for url in TopicMarkup(response.content.decode()).assets]
                helper = assets.index(prefix + 'reading-layout.js')
                self.assertLess(assets.index(prefix + 'shared.js'), helper)
                self.assertLess(helper, assets.index(prefix + f'{page}-app.js'))

    def test_civilization_data_and_images_are_loaded_before_page_apps(self):
        for name, consumer in (
            ('history-timeline-civilizations', 'civilizations-app.js'),
            ('history-timeline-civilization', 'civilization-app.js'),
            ('history-timeline-event', 'event-app.js'),
        ):
            with self.subTest(name=name):
                response = self.client.get(reverse(name))
                assets = [url.split("?")[0] for url in TopicMarkup(response.content.decode()).assets]
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
                assets = [url.split("?")[0] for url in TopicMarkup(response.content.decode()).assets]
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
        self.assertContains(response, 'data-sidebar-layout=".experiment-side"')
        self.assertContains(response, 'study_topics/map-skills/experiment.js?v=')
        self.assertContains(response, f'href="{reverse("history-study")}"', count=1)
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

    def test_reading_courses_use_the_reading_sidebar_and_current_assets(self):
        courses = (
            ('literature-study', 'lit', 'lit', ('classical', 'poetry-index', 'idiom-stories'), ()),
            ('hanzi-evolution', 'hanzi-evo', 'hanzi', ('dictionary', 'hanzi-polyphones'), ('hanzi-evo/hanzi-evo-player.js',)),
        )
        for route, slug, prefix, links, extra_assets in courses:
            with self.subTest(route=route):
                response = self.client.get(reverse(route))
                self.assertContains(response, f'data-sidebar-layout=".{prefix}-sidebar"')
                self.assertNotContains(response, 'class="study-topic-nav"')
                html = response.content.decode()
                sidebar = html.split(f'<aside class="{prefix}-sidebar ', 1)[1].split('</aside>', 1)[0]
                for section in ('chips', f'{prefix}-points', f'{prefix}-extras', 'search'):
                    self.assertIn(f'id="{section}"', sidebar)
                for name in links:
                    self.assertIn(f'href="{reverse(name)}"', sidebar)
                self.assertNotIn('id="cards"', sidebar)
                assets = TopicMarkup(html).assets
                for asset in ('reading.css', f'{slug}/{slug}.css', f'{slug}/{slug}-app.js', *extra_assets):
                    path = f'study_topics/{asset}'
                    digest = sha256(Path(finders.find(path)).read_bytes()).hexdigest()[:12]
                    self.assertIn(f'/static/{path}?v={digest}', assets)


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
            ('geography', ('geography-atlas-china', 'geography-china-terrain', 'geography-globe', 'geography-map-skills', 'geography-life-maps', 'geography-province-culture', 'geography-china-landscapes', 'geography-voyages', 'geography-earth', 'geography-ocean', 'geography-climate', 'astronomy-explore', 'solar-terms'), ('history-timeline-timeline', 'literature-study')),
        ):
            with self.subTest(area=area):
                response = self.client.get(reverse('home'), {'area': area})
                self.assertEqual([card['url'] for card in response.context['entry_cards']], [reverse(name) for name in shown])
                for name in (*hidden, 'history-study', 'geography-study'):
                    self.assertNotContains(response, f'href="{reverse(name)}"')

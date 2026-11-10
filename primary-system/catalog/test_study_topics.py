from html.parser import HTMLParser

from django.contrib.staticfiles import finders
from django.test import SimpleTestCase, TestCase
from django.urls import reverse


HISTORY_PAGES = (
    'history-study', 'history-timeline', 'history-timeline-timeline',
    'history-timeline-era', 'history-timeline-event', 'history-timeline-dynasties',
)
GEOGRAPHY_PAGES = (
    'geography-study', 'geography-atlas', 'geography-atlas-china',
    'geography-atlas-world', 'geography-atlas-province', 'geography-atlas-places',
    'geography-atlas-routes', 'geography-atlas-gallery', 'geography-atlas-animals', 'geography-atlas-world-animals',
)
COURSES = (
    ('geography', 'astronomy-study', 'astro', '天文探索', ('astronomy-index', 'mysteries')),
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
            ('geography-atlas', 'china.html', '?place=f20'),
            ('geography-atlas-china', 'province.html', '?adcode=110000'),
            ('geography-atlas-china', 'animals.html', '?animal=giant-panda'),
            ('geography-atlas-world', 'world-animals.html', '?animal=emperor-penguin'),
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

    def test_main_views_link_to_related_topics(self):
        for main, lesson, label in (
            ('history-timeline-timeline', 'history-study', '历史精讲'),
            ('geography-atlas-china', 'geography-study', '地理小课堂'),
            ('geography-atlas-china', 'geography-atlas-animals', '中国动物地图'),
            ('geography-atlas-world', 'geography-atlas-world-animals', '世界动物地图'),
        ):
            with self.subTest(main=main):
                response = self.client.get(reverse(main))
                self.assertContains(response, f'href="{reverse(lesson)}"')
                self.assertContains(response, label)

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
                self.assertContains(response, 'id="cards"')
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
            ('history', ('history-timeline-timeline',), ('geography-atlas-china', 'astronomy-study')),
            ('geography', ('geography-atlas-china', 'astronomy-study', 'solar-terms'), ('history-timeline-timeline', 'literature-study')),
        ):
            with self.subTest(area=area):
                response = self.client.get(reverse('home'), {'area': area})
                self.assertEqual([card['url'] for card in response.context['entry_cards']], [reverse(name) for name in shown])
                for name in (*hidden, 'history-study', 'geography-study'):
                    self.assertNotContains(response, f'href="{reverse(name)}"')

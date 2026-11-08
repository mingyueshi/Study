"""数学教材册测试：数据契约（镜像静态版 test-math-knowledge.js 的加载期部分）
+ 页面只读。内容源头在 primary/，静态版测试管源头质量；这里管生成物与页面
的契约，按册遍历（册次注册在 scripts/build_mathbook.cjs 的 BOOKS 映射）。"""
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase, TestCase
from django.urls import reverse, NoReverseMatch

from .content import available_books, load_book, validate


class MathbookDataTests(SimpleTestCase):
    def setUp(self):
        self.books = available_books()

    def test_known_books_are_registered(self):
        # 册次注册表至少有四上；新增册在 build 脚本 BOOKS 里加行即入列。
        codes = {b['book'] for b in self.books}
        self.assertIn('4a', codes)
        for item in self.books:
            self.assertTrue(item['textbook'])
            self.assertTrue(item['meta'])

    def test_manifest_matches_data_for_every_book(self):
        for item in self.books:
            data = load_book(item['book'])
            manifest, mkb = data['manifest'], data['mkb']
            self.assertEqual(manifest['book'], item['book'])
            self.assertEqual(manifest['units'], len(mkb['units']))
            self.assertEqual(manifest['points'], sum(len(u['points']) for u in mkb['units']))
            self.assertEqual({v['id'] for v in mkb['videos']['list']}, set(manifest['video_ids']))
            self.assertEqual(set(mkb['banners']), set(manifest['banner_ids']))
            fig_ids = {p['fig'] for u in mkb['units'] for p in u['points']}
            self.assertEqual(fig_ids, set(manifest['fig_ids']))

    def test_points_reference_known_ids(self):
        for item in self.books:
            data = load_book(item['book'])
            manifest, mkb = data['manifest'], data['mkb']
            video_ids = set(manifest['video_ids'])
            for unit in mkb['units']:
                for point in unit['points']:
                    self.assertIn(point['fig'], set(manifest['fig_ids']), f'{point["id"]} 图示未注册')
                    if point.get('video'):
                        self.assertIn(point['video'], video_ids, f'{point["id"]} 关联视频不存在')

    def test_text_is_chinese_punctuation_and_tag_free(self):
        # 数学内容允许比较符号 <、>（渲染统一转义），只拦截形如标签的 <字母。
        for item in self.books:
            data = load_book(item['book'])
            validate(data['manifest'], data['mkb'])  # 不抛即通过

    def test_validate_rejects_drift(self):
        data = load_book('4a')
        manifest, mkb = data['manifest'], data['mkb']
        with self.assertRaises(ImproperlyConfigured):
            validate({**manifest, 'points': manifest['points'] - 1}, mkb)
        with self.assertRaises(ImproperlyConfigured):
            validate({**manifest, 'fig_ids': []}, mkb)
        with self.assertRaises(ImproperlyConfigured):
            validate({**manifest, 'units': manifest['units'] + 1}, mkb)


class MathbookPageTests(TestCase):
    def test_index_lists_books(self):
        # 教材卡先进册次列表，再进具体册页（多册后同一直入口径）。
        response = self.client.get(reverse('mathbook'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '选一册开始')
        for book in available_books():
            self.assertContains(response, reverse('mathbook-book', args=[book['book']]))

    def test_reader_renders_mount_points(self):
        response = self.client.get(reverse('mathbook-book', args=['4a']))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'id="cards"')
        self.assertContains(response, 'id="chips"')
        self.assertContains(response, 'id="search"')
        self.assertContains(response, 'mathbook/books/4a.js?v=')
        self.assertContains(response, 'mathbook/math-app.js?v=1')
        self.assertContains(response, 'figures/figures.js?v=2')
        self.assertContains(response, '北师大版')

    def test_unknown_book_is_404(self):
        with self.assertRaises(NoReverseMatch):
            reverse('mathbook-book', args=['Not A Slug'])
        response = self.client.get('/mathbook/9z/')
        self.assertEqual(response.status_code, 404)

    def test_page_is_read_only(self):
        # 只读浏览：GET 不得创建会话或写任何记录（无模型应用，会话即泄漏渠道）。
        response = self.client.get(reverse('mathbook'))
        self.assertNotIn(settings.SESSION_COOKIE_NAME, response.cookies)
        response = self.client.get(reverse('mathbook-book', args=['4a']))
        self.assertNotIn(settings.SESSION_COOKIE_NAME, response.cookies)

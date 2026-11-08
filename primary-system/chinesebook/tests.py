"""语文教材册测试：数据契约（镜像静态版 test-knowledge.js 的加载期部分）
+ 页面只读。内容源头在 primary/，静态版测试管源头质量；这里管生成物与页面
的契约，按册遍历（册次注册在 scripts/build_chinesebook.cjs 的 BOOKS 映射）。"""
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase, TestCase
from django.urls import reverse, NoReverseMatch

from .content import available_books, load_book, validate


class ChinesebookDataTests(SimpleTestCase):
    def setUp(self):
        self.books = available_books()

    def test_known_books_are_registered(self):
        # 册次注册表至少有四上；新增册在 build 脚本 BOOKS 里加行即入列。
        codes = {b['book'] for b in self.books}
        self.assertIn('4a', codes)
        for item in self.books:
            self.assertTrue(item['textbook'])
            self.assertTrue(item['banner_subject'])

    def test_manifest_matches_data_for_every_book(self):
        for item in self.books:
            data = load_book(item['book'])
            manifest, kb = data['manifest'], data['kb']
            self.assertEqual(manifest['book'], item['book'])
            self.assertEqual(manifest['units'], len(kb['units']))
            self.assertEqual(manifest['lessons'], sum(len(u['lessons']) for u in kb['units']))
            self.assertEqual(manifest['poems'], len(kb['poems']))
            self.assertEqual(manifest['polyphonic'], len(kb['polyphonic']))
            self.assertEqual(manifest['similar'], len(kb['similar']))
            fig_ids = set(manifest['fig_ids'])
            for unit in kb['units']:
                if unit.get('banner'):
                    self.assertIn(unit['banner'], fig_ids)
                for lesson in unit['lessons']:
                    if lesson.get('fig'):
                        self.assertIn(lesson['fig'], fig_ids, f"课文{lesson['id']} 图示未注册")
            for poem in kb['poems']:
                if poem.get('fig'):
                    self.assertIn(poem['fig'], fig_ids, f"《{poem['title']}》图示未注册")

    def test_images_exist_for_every_reference(self):
        for item in self.books:
            data = load_book(item['book'])
            for img in data['manifest']['image_refs']:
                self.assertTrue(img.startswith('images/'), img)
                # 文件存在性在 validate() 内已查，这里核对清单口径
                self.assertIn(img.split('/')[1], ('lessons', 'poems'))

    def test_text_is_punctuation_and_tag_free(self):
        # 语文正文比数学更严：不允许任何尖括号（无比较符号需求）。
        for item in self.books:
            data = load_book(item['book'])
            validate(data['manifest'], data['kb'])  # 不抛即通过

    def test_validate_rejects_drift(self):
        data = load_book('4a')
        manifest, kb = data['manifest'], data['kb']
        with self.assertRaises(ImproperlyConfigured):
            validate({**manifest, 'lessons': manifest['lessons'] - 1}, kb)
        with self.assertRaises(ImproperlyConfigured):
            validate({**manifest, 'fig_ids': []}, kb)
        with self.assertRaises(ImproperlyConfigured):
            validate({**manifest, 'units': manifest['units'] + 1}, kb)


class ChinesebookPageTests(TestCase):
    def test_index_lists_books(self):
        # 教材卡先进册次列表，再进具体册页（多册后同一直入口径）。
        response = self.client.get(reverse('chinesebook'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '选一册开始')
        for book in available_books():
            self.assertContains(response, reverse('chinesebook-book', args=[book['book']]))

    def test_reader_renders_mount_points(self):
        response = self.client.get(reverse('chinesebook-book', args=['4a']))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'id="cards"')
        self.assertContains(response, 'id="chips"')
        self.assertContains(response, 'id="search"')
        self.assertContains(response, 'chinesebook/books/4a.js?v=')
        self.assertContains(response, 'chinesebook/knowledge-app.js?v=1')
        self.assertContains(response, 'figures/figures.js?v=2')
        self.assertContains(response, '人教版')
        self.assertContains(response, '四年级上册')

    def test_unknown_book_is_404(self):
        with self.assertRaises(NoReverseMatch):
            reverse('chinesebook-book', args=['Not A Slug'])
        response = self.client.get('/chinesebook/9z/')
        self.assertEqual(response.status_code, 404)

    def test_page_is_read_only(self):
        # 只读浏览：GET 不得创建会话或写任何记录（无模型应用，会话即泄漏渠道）。
        response = self.client.get(reverse('chinesebook'))
        self.assertNotIn(settings.SESSION_COOKIE_NAME, response.cookies)
        response = self.client.get(reverse('chinesebook-book', args=['4a']))
        self.assertNotIn(settings.SESSION_COOKIE_NAME, response.cookies)

"""数学教材册测试：数据契约（镜像静态版 test-math-knowledge.js 的加载期部分）
+ 页面和账号进度。内容源头在 content_sources/，源数据测试管源头质量；这里管生成物与页面
的契约，按册遍历（册次注册在 scripts/build_mathbook.cjs 的 BOOKS 映射）。"""
import json

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ImproperlyConfigured
from django.test import Client, SimpleTestCase, TestCase
from django.urls import reverse, NoReverseMatch

from questionbank.importing import import_batch
from questionbank.models import AnswerRecord, Question

from .content import available_books, load_book, validate
from .models import BookProgress


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
        self.assertContains(response, 'mathbook/math-app.js?v=3')
        self.assertContains(response, 'figures/figures.js?v=2')
        self.assertContains(response, '北师大版')

    def test_unknown_book_is_404(self):
        with self.assertRaises(NoReverseMatch):
            reverse('mathbook-book', args=['Not A Slug'])
        response = self.client.get('/mathbook/9z/')
        self.assertEqual(response.status_code, 404)

    def test_page_is_read_only(self):
        # 游客只读浏览不分配会话或写任何记录。
        response = self.client.get(reverse('mathbook'))
        self.assertNotIn(settings.SESSION_COOKIE_NAME, response.cookies)
        response = self.client.get(reverse('mathbook-book', args=['4a']))
        self.assertNotIn(settings.SESSION_COOKIE_NAME, response.cookies)
        self.assertNotContains(response, 'id="mathbook-progress"')
        self.assertFalse(BookProgress.objects.exists())


class MathbookProgressTests(TestCase):
    def setUp(self):
        self.reader = reverse('mathbook-book', args=['4a'])
        self.url = reverse('mathbook-progress', args=['4a'])
        self.user = get_user_model().objects.create_user(username='math-learner')
        self.client.force_login(self.user)
        self.headers = {'X-Mathbook-Scope': self.client.get(self.reader).context['progress']['scope']}

    def save(self, revision, action, **fields):
        return self.client.post(self.url, {'revision': revision, 'action': action, **fields},
                                content_type='application/json', headers=self.headers)

    def test_progress_survives_another_browser_and_rejects_stale_updates(self):
        self.assertFalse(BookProgress.objects.exists())
        marked = self.save(0, 'learn', point='mu2-1', learned=True)
        self.assertEqual(marked.json(), {
            'revision': 1, 'learned': ['mu2-1'], 'read_points': [], 'last_unit': 'mu2', 'local_imported': False,
        })
        later = self.save(1, 'resume', unit='mu3')
        self.assertEqual(later.json()['revision'], 2)
        stale = self.save(1, 'learn', point='mu2-1', learned=False)
        self.assertEqual(stale.status_code, 409)
        self.assertEqual(stale.json()['learned'], ['mu2-1'])

        other_browser = Client()
        other_browser.force_login(self.user)
        progress = other_browser.get(self.reader).context['progress']
        self.assertEqual(progress['last_unit'], 'mu3')
        self.assertEqual(progress['learned'], ['mu2-1'])
        self.assertEqual(self.save(2, 'learn', point='mu2-1', learned=False).json()['learned'], [])

    def test_explicit_import_merges_known_marks_once_and_keeps_account_resume(self):
        self.save(0, 'learn', point='mu2-1', learned=True)
        imported = self.save(1, 'import', unit='mu3', learned=['mu3-1'], read_points=['mu3-2'])
        self.assertEqual(imported.json(), {
            'revision': 2, 'learned': ['mu2-1', 'mu3-1'], 'read_points': ['mu3-2'],
            'last_unit': 'mu2', 'local_imported': True,
        })
        self.save(2, 'learn', point='mu3-1', learned=False)
        retry = self.save(3, 'import', unit='mu3', learned=['mu3-1'])
        self.assertEqual(retry.status_code, 409)
        self.assertEqual(retry.json()['learned'], ['mu2-1'])

    def test_import_can_restore_last_unit_before_any_account_progress(self):
        self.assertEqual(self.save(0, 'import', unit='mu3', learned=[]).json()['last_unit'], 'mu3')

    def test_explicit_read_mark_is_independent_of_mastery_and_restores_after_reopen(self):
        read = self.save(0, 'read', point='mu2-1', read=True)
        self.assertEqual(read.json()['read_points'], ['mu2-1'])
        self.assertEqual(read.json()['learned'], [])
        self.save(1, 'learn', point='mu2-1', learned=True)
        reader = self.client.get(self.reader).context['progress']
        self.assertEqual(reader['read_points'], ['mu2-1'])
        self.assertEqual(reader['last_unit'], 'mu2')
        reset = self.save(2, 'read', point='mu2-1', read=False)
        self.assertEqual(reset.json()['read_points'], [])
        self.assertEqual(reset.json()['learned'], ['mu2-1'])

    def test_validates_points_and_rejects_guest_and_stale_account(self):
        self.assertEqual(self.save(0, 'learn', point='missing', learned=True).status_code, 400)
        self.assertEqual(self.save(0, 'resume', unit='formulas').status_code, 400)
        self.assertEqual(self.save(0, 'import', unit='mu2', learned=[{}]).status_code, 400)
        self.assertFalse(BookProgress.objects.exists())
        self.save(0, 'learn', point='mu2-1', learned=True)
        guest = Client().get(self.url, headers=self.headers)
        self.assertEqual(guest.status_code, 409)
        self.assertNotIn(settings.SESSION_COOKIE_NAME, guest.cookies)

        self.client.force_login(get_user_model().objects.create_user(username='another-learner'))
        self.assertEqual(self.client.get(self.reader).context['progress']['learned'], [])
        self.assertEqual(self.client.get(self.url, headers=self.headers).json()['code'], 'owner_changed')
        self.assertEqual(self.save(1, 'resume', unit='mu3').status_code, 409)
        self.assertEqual(BookProgress.objects.get(user=self.user).last_unit, 'mu2')
        self.assertEqual(BookProgress.objects.count(), 1)

    def test_writes_require_csrf(self):
        client = Client(enforce_csrf_checks=True)
        client.force_login(self.user)
        client.get(self.reader)
        data = {'action': 'resume', 'unit': 'mu2', 'revision': 0}
        response = client.post(self.url, data, content_type='application/json', headers=self.headers)
        self.assertEqual(response.status_code, 403)
        csrf = client.cookies[settings.CSRF_COOKIE_NAME].value
        response = client.post(self.url, data, content_type='application/json',
                               headers={**self.headers, 'X-CSRFToken': csrf})
        self.assertEqual(response.status_code, 200)


class MathbookPracticeTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        folder = settings.BASE_DIR / 'questionbank/data/questions'
        for name in ('2026-11-internal-core.json', '2026-11-math-mistakes-correct.json'):
            import_batch(json.loads((folder / name).read_text(encoding='utf-8')))

    def test_reading_card_opens_exact_example_and_returns_to_the_same_point(self):
        reader = reverse('mathbook-book', args=['4a'])
        url = reverse('questionbank-mathbook-practice', args=['4a', 'mu2-1'])
        page = self.client.get(reader)
        self.assertEqual(page.context['practice_links']['mu2-1'], url)
        self.assertNotIn(settings.SESSION_COOKIE_NAME, page.cookies)
        practice = self.client.get(url, {'area': 'english', 'count': 20})
        question = Question.objects.get(source_key='primary-math', source_ref='math:mu2-1:example')
        items = practice.context['questions']
        self.assertEqual([row['uuid'] for row in items], [str(question.uuid)])
        self.assertContains(practice, f'href="{reader}#mu2-1"')
        self.assertContains(practice, '例题自评')
        self.assertNotContains(practice, '20 题')
        self.assertNotIn(settings.SESSION_COOKIE_NAME, practice.cookies)

        answer = self.client.post(reverse('questionbank-answer'), {
            'uuid': items[0]['uuid'], 'attempt_id': items[0]['attempt_id'], 'given': {'self': 'right'},
        }, content_type='application/json')
        self.assertIs(answer.json()['correct'], True)
        self.assertFalse(BookProgress.objects.exists())

    def test_diagnostic_practice_only_draws_objective_math_questions_from_the_book(self):
        reader = reverse('mathbook-book', args=['4a'])
        url = reverse('questionbank-mathbook-practice', args=['4a', 'mistakes'])
        self.assertEqual(self.client.get(reader).context['practice_links']['mistakes'], url)
        practice = self.client.get(url, {'count': 20})
        self.assertContains(practice, f'href="{reader}#mistakes"')
        items = practice.context['questions']
        self.assertTrue(items)
        self.assertEqual({row['type'] for row in items}, {'truefalse'})
        self.assertTrue(all('answer' not in row for row in items))
        expected = Question.objects.filter(source_key='primary-math', type='truefalse').count()
        self.assertEqual(len(items), min(20, expected))
        question = Question.objects.get(uuid=items[0]['uuid'])
        answer = self.client.post(reverse('questionbank-answer'), {
            'uuid': items[0]['uuid'], 'attempt_id': items[0]['attempt_id'], 'given': {'value': question.payload['answer']},
        }, content_type='application/json')
        self.assertIs(answer.json()['correct'], True)

    def test_unavailable_questions_never_fall_back_to_a_different_pool(self):
        Question.objects.filter(source_key='primary-math', source_ref='math:mu2-1:example').update(active=False)
        reader = self.client.get(reverse('mathbook-book', args=['4a']))
        self.assertNotIn('mu2-1', reader.context['practice_links'])
        url = reverse('questionbank-mathbook-practice', args=['4a', 'mu2-1'])
        self.assertContains(self.client.get(url), '这里暂时没有可练的题')
        for args in (['4a', 'unknown-point'], ['5a', 'mu2-1']):
            self.assertEqual(self.client.get(reverse('questionbank-mathbook-practice', args=args)).status_code, 404)

    def test_self_assessment_is_not_counted_as_objective_correct_in_the_dashboard(self):
        user = get_user_model().objects.create_user(username='math-reader')
        self.client.force_login(user)
        rows = Question.objects.filter(source_key='primary-math')
        selfcheck = rows.filter(type='selfcheck').first()
        objective = rows.filter(type='truefalse').first()
        AnswerRecord.objects.create(user=user, question=selfcheck, given={'self': 'right'}, correct=True)
        AnswerRecord.objects.create(user=user, question=objective, given={'value': False}, correct=True)
        home = self.client.get(reverse('questionbank'))
        self.assertEqual((home.context['summary']['answered'], home.context['summary']['correct'],
                          home.context['summary']['selfchecked']), (2, 1, 1))
        self.assertContains(home, '我答过 2 题 · 答对 1 题 · 自评 1 题')
        me = self.client.get(reverse('my-learning'))
        self.assertContains(me, '挑战题库 · 自评做对')
        self.assertContains(me, '挑战题库 · 答对')

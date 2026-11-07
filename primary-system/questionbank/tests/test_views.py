"""视图：页面 GET 零写入、判分端点、游客会话双轨与错题本。"""
import json

from django.conf import settings
from django.test import TestCase
from django.urls import reverse

from questionbank.models import AnswerRecord

from .test_models import make_question

CHOICE = {'options': ['háo', 'hào'], 'answer': 0, 'explanation': '「号」读 háo。'}


def seed_choice():
    question = make_question(payload=CHOICE)
    question.save()
    return question


OLYMPIAD = {'options': ['6 只', '3 只'], 'answer': 0, 'explanation': '假设全是鸡，差出的脚除以 2。'}


def seed_olympiad(**overrides):
    fields = dict(track='olympiad', tags=['鸡兔同笼'], payload=OLYMPIAD,
                  source_key='primary-olympiad', source_ref='olympiad:jitu:01')
    fields.update(overrides)
    question = make_question(**fields)
    question.save()
    return question


def post_answer(client, payload):
    return client.post(reverse('questionbank-answer'), data=json.dumps(payload),
                       content_type='application/json')


class HomeViewTests(TestCase):
    def test_home_renders_and_keeps_guest_session_free(self):
        seed_choice()
        response = self.client.get(reverse('questionbank'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '挑战题库')
        # 页面 GET 不得创建会话：响应里不应有 Set-Cookie 会话。
        self.assertNotIn(settings.SESSION_COOKIE_NAME, response.cookies)

    def test_home_counts_zero_for_fresh_owner(self):
        seed_choice()
        page = self.client.get(reverse('questionbank'))
        self.assertEqual(page.context['summary']['answered'], 0)


class PracticeViewTests(TestCase):
    def test_page_embeds_questions_without_answers(self):
        question = seed_choice()
        response = self.client.get(reverse('questionbank-practice'))
        self.assertEqual(response.status_code, 200)
        items = response.context['questions']
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]['uuid'], str(question.uuid))
        self.assertNotIn(CHOICE['explanation'], response.content.decode())

    def test_area_filter_and_size(self):
        seed_choice()
        chinese = make_question(area='chinese', source_ref='chinese:u1-1:poly:号')
        chinese.save()
        response = self.client.get(reverse('questionbank-practice'), {'area': 'math'})
        self.assertEqual(len(response.context['questions']), 1)
        self.assertEqual(response.context['questions'][0]['area'], 'math')
        self.assertEqual(response.context['area'], 'math')

    def test_unknown_area_falls_back_to_all(self):
        seed_choice()
        response = self.client.get(reverse('questionbank-practice'), {'area': 'history'})
        self.assertEqual(response.context['area'], '')
        self.assertEqual(len(response.context['questions']), 1)

    def test_wrong_mode_without_history_shows_empty(self):
        seed_choice()
        response = self.client.get(reverse('questionbank-practice'), {'mode': 'wrong'})
        self.assertTrue(response.context['empty_wrong'])
        self.assertEqual(response.context['questions'], [])
        self.assertNotIn(settings.SESSION_COOKIE_NAME, response.cookies)


class AnswerApiTests(TestCase):
    def test_correct_choice_answer_creates_record(self):
        question = seed_choice()
        response = post_answer(self.client, {'uuid': str(question.uuid), 'given': {'value': 0}})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['correct'])
        self.assertEqual(response.json()['reveal'], 'háo')
        self.assertEqual(AnswerRecord.objects.count(), 1)

    def test_wrong_answer_records_and_reveals(self):
        question = seed_choice()
        response = post_answer(self.client, {'uuid': str(question.uuid), 'given': {'value': 1}})
        self.assertFalse(response.json()['correct'])
        self.assertEqual(AnswerRecord.objects.get().correct, False)

    def test_guest_session_created_on_first_post(self):
        question = seed_choice()
        response = post_answer(self.client, {'uuid': str(question.uuid), 'given': {'value': 0}})
        self.assertIn(settings.SESSION_COOKIE_NAME, response.cookies, 'POST 写入路径才允许建会话。')
        self.assertTrue(AnswerRecord.objects.get().guest_key)

    def test_logged_in_answer_belongs_to_user(self):
        from accounts.models import User

        user = User.objects.create_user(username='kid', password='x' * 12)
        self.client.force_login(user)
        question = seed_choice()
        post_answer(self.client, {'uuid': str(question.uuid), 'given': {'value': 0}})
        record = AnswerRecord.objects.get()
        self.assertEqual(record.user, user)
        self.assertEqual(record.guest_key, '')

    def test_rejects_bad_requests(self):
        question = seed_choice()
        self.assertEqual(self.client.post(reverse('questionbank-answer'), data='[]',
                                          content_type='application/json').status_code, 400)
        self.assertEqual(self.client.post(reverse('questionbank-answer'), data='not json',
                                          content_type='application/json').status_code, 400)
        self.assertEqual(post_answer(self.client, {'uuid': str(question.uuid)}).status_code, 400)
        self.assertEqual(post_answer(self.client, {'uuid': str(question.uuid), 'given': {'value': 9}}).status_code, 400)
        unknown = make_question(source_ref='math:not-imported').uuid
        self.assertEqual(post_answer(self.client, {'uuid': str(unknown), 'given': {'value': 0}}).status_code, 400)
        self.assertEqual(AnswerRecord.objects.count(), 0)


class WrongViewTests(TestCase):
    def test_wrong_book_lists_latest_wrong(self):
        question = seed_choice()
        post_answer(self.client, {'uuid': str(question.uuid), 'given': {'value': 1}})
        response = self.client.get(reverse('questionbank-wrong'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual([row['stem'] for row in response.context['rows']], [question.stem])
        self.assertEqual(response.context['rows'][0]['reveal'], 'háo')

    def test_wrong_book_empty_for_fresh_guest(self):
        seed_choice()
        response = self.client.get(reverse('questionbank-wrong'))
        self.assertEqual(response.context['rows'], [])
        self.assertNotIn(settings.SESSION_COOKIE_NAME, response.cookies)


class OlympiadViewTests(TestCase):
    def test_landing_renders_track_stats(self):
        seed_olympiad()
        response = self.client.get(reverse('questionbank-olympiad'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '奥数挑战')
        self.assertEqual(response.context['total'], 1)
        self.assertEqual(response.context['tags'], [{'tag': '鸡兔同笼', 'count': 1}])

    def test_olympiad_practice_serves_only_olympiad(self):
        seed_choice()
        olympiad = seed_olympiad()
        response = self.client.get(reverse('questionbank-olympiad-practice'))
        self.assertEqual([item['uuid'] for item in response.context['questions']],
                         [str(olympiad.uuid)])
        self.assertEqual(response.context['area_chips'], [])

    def test_regular_practice_excludes_olympiad(self):
        regular = seed_choice()
        seed_olympiad()
        response = self.client.get(reverse('questionbank-practice'))
        self.assertEqual([item['uuid'] for item in response.context['questions']],
                         [str(regular.uuid)])
        self.assertIsNone(response.context['tag_chips'])

    def test_tag_filter_and_unknown_tag_ignored(self):
        seed_olympiad()
        seed_olympiad(tags=['行程问题'], source_ref='olympiad:xingcheng:01')
        response = self.client.get(reverse('questionbank-olympiad-practice'), {'tag': '鸡兔同笼'})
        self.assertEqual(response.context['tag'], '鸡兔同笼')
        self.assertEqual(len(response.context['questions']), 1)
        stray = self.client.get(reverse('questionbank-practice'), {'tag': '鸡兔同笼'})
        self.assertEqual(stray.context['tag'], '', '普通轨不接受主题过滤。')
        unknown = self.client.get(reverse('questionbank-olympiad-practice'), {'tag': '数论'})
        self.assertEqual(unknown.context['tag'], '')
        self.assertEqual(len(unknown.context['questions']), 2)

    def test_home_counts_lock_to_regular(self):
        seed_choice()
        seed_olympiad()
        response = self.client.get(reverse('questionbank'))
        self.assertEqual(response.context['total'], 1)
        self.assertEqual(response.context['olympiad_count'], 1)


class WrongTrackTests(TestCase):
    def test_wrong_rows_carry_track_and_filter(self):
        regular = seed_choice()
        olympiad = seed_olympiad()
        post_answer(self.client, {'uuid': str(regular.uuid), 'given': {'value': 1}})
        post_answer(self.client, {'uuid': str(olympiad.uuid), 'given': {'value': 1}})
        page = self.client.get(reverse('questionbank-wrong'))
        self.assertEqual(page.context['regular_count'], 1)
        self.assertEqual(page.context['olympiad_count'], 1)
        badges = [row['track'] for row in page.context['rows']]
        self.assertEqual(badges.count('奥数'), 1)
        filtered = self.client.get(reverse('questionbank-wrong'), {'track': 'olympiad'})
        self.assertEqual(len(filtered.context['rows']), 1)
        self.assertIn('/olympiad/practice/', filtered.context['practice_url'])
        regular_view = self.client.get(reverse('questionbank-wrong'), {'track': 'regular'})
        self.assertEqual(len(regular_view.context['rows']), 1)
        self.assertIn(reverse('questionbank-practice'), regular_view.context['practice_url'])

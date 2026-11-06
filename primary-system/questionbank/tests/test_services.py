"""服务层：抽题、内嵌题目形状、错题本口径、判分落库与统计。"""
from django.test import TestCase

from questionbank import services, types
from questionbank.models import AnswerRecord, Question

from .test_models import make_question

CHOICE = {'options': ['háo', 'hào'], 'answer': 1, 'explanation': '「号召」读 hào。'}
SELF_CHECK = {'answer': '十万', 'steps': '一万一万地数。'}


def seed_questions():
    math_choice = make_question(type='choice', payload=CHOICE,
                                source_key='primary-math', source_ref='math:mu1-1:poly:号')
    math_self = make_question(type='selfcheck', payload=SELF_CHECK,
                              source_key='primary-math', source_ref='math:mu1-2:example')
    chinese = make_question(area='chinese', type='choice', payload=CHOICE,
                            source_key='primary-chinese', source_ref='chinese:u1-1:poly:号')
    for question in (math_choice, math_self, chinese):
        question.save()
    return math_choice, math_self, chinese


class PickTests(TestCase):
    def test_pick_filters_area_and_active(self):
        math_choice, math_self, chinese = seed_questions()
        chinese.active = False
        chinese.save()
        picked = services.pick_questions(area='math', count=10)
        self.assertEqual({question.pk for question in picked}, {math_choice.pk, math_self.pk})
        self.assertEqual(len(services.pick_questions(count=10)), 2)

    def test_pick_respects_count_and_ids(self):
        seed_questions()
        self.assertEqual(len(services.pick_questions(count=1)), 1)
        self.assertEqual(len(services.pick_questions(ids=[])), 0)

    def test_client_question_hides_answer(self):
        math_choice, _, _ = seed_questions()
        item = services.client_question(math_choice)
        self.assertEqual(item['options'], CHOICE['options'])
        self.assertNotIn('answer', item)
        self.assertNotIn('explanation', str(item))


class WrongBookTests(TestCase):
    def test_empty_scope(self):
        self.assertEqual(services.latest_wrong_ids(None), [])

    def test_latest_answer_wins(self):
        from accounts.models import User

        user = User.objects.create_user(username='kid', password='x' * 12)
        math_choice, _, _ = seed_questions()
        AnswerRecord.objects.create(user=user, question=math_choice, given={}, correct=False)
        AnswerRecord.objects.create(user=user, question=math_choice, given={}, correct=True)
        self.assertEqual(services.latest_wrong_ids({'user': user}), [])

    def test_wrong_questions_newest_first(self):
        from accounts.models import User

        user = User.objects.create_user(username='kid', password='x' * 12)
        math_choice, math_self, _ = seed_questions()
        first = AnswerRecord.objects.create(user=user, question=math_choice, given={}, correct=False)
        second = AnswerRecord.objects.create(user=user, question=math_self, given={}, correct=False)
        wrong = services.latest_wrong_ids({'user': user})
        self.assertEqual(wrong, [math_self.pk, math_choice.pk])
        self.assertGreater(second.created_at, first.created_at)


class RecordAnswerTests(TestCase):
    def test_choice_answer_recorded(self):
        from accounts.models import User

        user = User.objects.create_user(username='kid', password='x' * 12)
        math_choice, _, _ = seed_questions()
        record, result = services.record_answer(math_choice, {'value': 1}, {'user': user})
        self.assertTrue(record.correct)
        self.assertEqual(result['reveal'], 'hào')
        self.assertEqual(result['explanation'], CHOICE['explanation'])
        self.assertEqual(AnswerRecord.objects.count(), 1)

    def test_invalid_answer_raises_before_write(self):
        from accounts.models import User

        user = User.objects.create_user(username='kid', password='x' * 12)
        math_choice, _, _ = seed_questions()
        with self.assertRaises(types.InvalidAnswer):
            services.record_answer(math_choice, {'value': 'háo'}, {'user': user})
        self.assertEqual(AnswerRecord.objects.count(), 0)


class SummaryTests(TestCase):
    def test_empty_scope_summary(self):
        self.assertEqual(services.owner_summary(None)['answered'], 0)

    def test_summary_counts_by_area(self):
        from accounts.models import User

        user = User.objects.create_user(username='kid', password='x' * 12)
        math_choice, _, chinese = seed_questions()
        AnswerRecord.objects.create(user=user, question=math_choice, given={}, correct=True)
        AnswerRecord.objects.create(user=user, question=chinese, given={}, correct=False)
        summary = services.owner_summary({'user': user})
        self.assertEqual(summary['answered'], 2)
        self.assertEqual(summary['correct'], 1)
        self.assertEqual(summary['areas']['math'], {'answered': 1, 'correct': 1})
        self.assertEqual(summary['areas']['chinese'], {'answered': 1, 'correct': 0})

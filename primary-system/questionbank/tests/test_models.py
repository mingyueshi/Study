"""模型行为：指纹推导、schema 校验、归属独占约束。"""
import uuid

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase

from questionbank import types
from questionbank.models import AnswerRecord, Question

from .test_types import CHOICE_PAYLOAD


def make_question(**overrides):
    fields = dict(type='choice', area='math', grade=4, stem='10 个一万是多少？',
                  payload=CHOICE_PAYLOAD, tags=['数学'],
                  source_key='primary-math', source_ref='math:mu1-1:example')
    fields.update(overrides)
    fields.setdefault('uuid', types.question_uuid(fields['source_key'], fields['source_ref']))
    return Question(**fields)


class QuestionTests(TestCase):
    def test_save_derives_checksum(self):
        question = make_question()
        question.save()
        expected = types.content_checksum(
            question_type=question.type, area=question.area, grade=question.grade, stem=question.stem,
            payload=question.payload, tags=question.tags, source_key=question.source_key,
            source_ref=question.source_ref)
        self.assertEqual(question.checksum, expected)

    def test_clean_rejects_bad_payload(self):
        question = make_question(payload={'options': ['只有一个']})
        with self.assertRaises(ValidationError):
            question.full_clean()

    def test_clean_accepts_valid_payload(self):
        make_question().full_clean()

    def test_uuid_unique(self):
        question = make_question()
        question.save()
        twin = make_question(uuid=question.uuid, source_ref='math:mu1-9:example')
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                twin.save()

    def test_track_defaults_to_regular(self):
        question = make_question()
        self.assertEqual(question.track, Question.Track.REGULAR)
        question.save()
        self.assertEqual(Question.objects.get(pk=question.pk).track, 'regular')

    def test_track_olympiad_round_trips(self):
        question = make_question(track=Question.Track.OLYMPIAD)
        question.save()
        self.assertEqual(Question.objects.get(pk=question.pk).track, 'olympiad')


class AnswerRecordTests(TestCase):
    def test_owner_exclusive_constraint(self):
        question = make_question()
        question.save()
        from accounts.models import User

        user = User.objects.create_user(username='kid', password='x' * 12)
        with self.assertRaises(IntegrityError):
            AnswerRecord.objects.create(user=user, guest_key='g-1', question=question, given={}, correct=True)

    def test_given_defaults_empty_dict(self):
        question = make_question()
        question.save()
        record = AnswerRecord.objects.create(guest_key='g-1', question=question, correct=True)
        self.assertEqual(record.given, {})

    def test_uuid_field_is_uuid(self):
        question = make_question()
        question.save()
        self.assertIsInstance(question.uuid, uuid.UUID)

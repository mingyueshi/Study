"""题型注册表：schema 校验、判分与答案呈现。"""
from django.test import SimpleTestCase

from questionbank import types

CHOICE_PAYLOAD = {'options': ['háo', 'hào'], 'answer': 0, 'explanation': '「号」读 háo 时可组「风号浪吼」。'}
TRUE_FALSE_PAYLOAD = {'answer': False, 'explanation': '钝角大于 90° 且小于 180°。'}
SELFCHECK_PAYLOAD = {'answer': '十万', 'steps': '相邻两个计数单位的进率是 10。'}


class ValidateTests(SimpleTestCase):
    def test_choice_ok(self):
        types.validate('choice', CHOICE_PAYLOAD)

    def test_choice_rejects_single_and_duplicate_options(self):
        with self.assertRaises(types.InvalidPayload):
            types.validate('choice', {'options': ['háo'], 'answer': 0, 'explanation': 'x'})
        with self.assertRaises(types.InvalidPayload):
            types.validate('choice', {'options': ['háo', 'háo'], 'answer': 0, 'explanation': 'x'})

    def test_choice_rejects_out_of_range_and_boolean_answer(self):
        with self.assertRaises(types.InvalidPayload):
            types.validate('choice', {**CHOICE_PAYLOAD, 'answer': 2})
        with self.assertRaises(types.InvalidPayload):
            types.validate('choice', {**CHOICE_PAYLOAD, 'answer': True})

    def test_choice_rejects_missing_explanation_and_quotes(self):
        with self.assertRaises(types.InvalidPayload):
            types.validate('choice', {'options': ['a', 'b'], 'answer': 0})
        with self.assertRaises(types.InvalidPayload):
            types.validate('choice', {'options': ['"a"', 'b'], 'answer': 0, 'explanation': 'x'})

    def test_truefalse_shape(self):
        types.validate('truefalse', TRUE_FALSE_PAYLOAD)
        with self.assertRaises(types.InvalidPayload):
            types.validate('truefalse', {'answer': 'False', 'explanation': 'x'})
        with self.assertRaises(types.InvalidPayload):
            types.validate('truefalse', {'answer': True})
        with self.assertRaises(types.InvalidPayload):
            types.validate('truefalse', {'answer': True, 'explanation': '有"引号"'})

    def test_selfcheck_shape(self):
        types.validate('selfcheck', SELFCHECK_PAYLOAD)
        types.validate('selfcheck', {'answer': '十万'})
        with self.assertRaises(types.InvalidPayload):
            types.validate('selfcheck', {'steps': '只有步骤'})
        with self.assertRaises(types.InvalidPayload):
            types.validate('selfcheck', {'answer': ['列表']})

    def test_unknown_type_rejected(self):
        with self.assertRaises(types.InvalidPayload):
            types.validate('match', {})


class JudgeTests(SimpleTestCase):
    def test_choice_judge(self):
        self.assertTrue(types.judge('choice', CHOICE_PAYLOAD, {'value': 0}))
        self.assertFalse(types.judge('choice', CHOICE_PAYLOAD, {'value': 1}))
        for bad in ({'value': True}, {'value': 5}, {}, {'value': '0'}):
            with self.assertRaises(types.InvalidAnswer):
                types.judge('choice', CHOICE_PAYLOAD, bad)

    def test_truefalse_judge(self):
        self.assertTrue(types.judge('truefalse', TRUE_FALSE_PAYLOAD, {'value': False}))
        self.assertFalse(types.judge('truefalse', TRUE_FALSE_PAYLOAD, {'value': True}))
        with self.assertRaises(types.InvalidAnswer):
            types.judge('truefalse', TRUE_FALSE_PAYLOAD, {'value': 'False'})

    def test_selfcheck_judge(self):
        self.assertTrue(types.judge('selfcheck', SELFCHECK_PAYLOAD, {'self': 'right'}))
        self.assertFalse(types.judge('selfcheck', SELFCHECK_PAYLOAD, {'self': 'wrong'}))
        with self.assertRaises(types.InvalidAnswer):
            types.judge('selfcheck', SELFCHECK_PAYLOAD, {'self': 'maybe'})

    def test_reveal(self):
        self.assertEqual(types.reveal('choice', CHOICE_PAYLOAD), 'háo')
        self.assertEqual(types.reveal('truefalse', TRUE_FALSE_PAYLOAD), '错')
        self.assertEqual(types.reveal('selfcheck', SELFCHECK_PAYLOAD), '十万')


class IdentityTests(SimpleTestCase):
    def test_question_uuid_deterministic(self):
        first = types.question_uuid('primary-math', 'math:mu1-1:example')
        self.assertEqual(first, types.question_uuid('primary-math', 'math:mu1-1:example'))
        self.assertNotEqual(first, types.question_uuid('primary-math', 'math:mu1-2:example'))

    def test_content_checksum_tracks_payload(self):
        base = dict(question_type='choice', area='math', grade=4, stem='题干',
                    payload=CHOICE_PAYLOAD, tags=['标签'], source_key='primary-math', source_ref='math:mu1-1:example')
        other = {**base, 'payload': {**CHOICE_PAYLOAD, 'answer': 1}}
        self.assertNotEqual(types.content_checksum(**base), types.content_checksum(**other))
        self.assertEqual(types.content_checksum(**base), types.content_checksum(**base))

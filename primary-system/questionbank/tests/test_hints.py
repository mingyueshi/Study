import json

from django.core.exceptions import ValidationError
from django.test import SimpleTestCase

from questionbank.hints import load_hints, validate_hints
from .test_data import load_batches


class OlympiadHintsTests(SimpleTestCase):
    def test_every_playable_olympiad_question_has_hints(self):
        batches = load_batches()
        retired = {key for _, batch in batches for key in batch.get('retire', {})}
        expected = {entry['uuid'] for _, batch in batches for entry in batch['questions']
                    if entry.get('track') == 'olympiad' and entry['uuid'] not in retired}
        self.assertEqual(set(load_hints()), expected)

    def test_rejects_invalid_shape_and_text(self):
        key = 'db0faf39-f5ac-43c1-81bc-d6b4dd289d3c'
        valid = {'schema_version': 1, 'questions': {key: ['先找条件。', '再试着列式。']}}
        self.assertEqual(validate_hints(valid), valid['questions'])
        for data in ([], {}, {'schema_version': 1, 'questions': []},
                     {'schema_version': 1, 'questions': {'bad': ['一', '二']}},
                     *({'schema_version': 1, 'questions': {key: steps}}
                       for steps in ([], ['只有一步。'], ['一', '二', '三', '四', '五'],
                                     ['提示', ''], ['提示', 12], ['提示', '换\n行'],
                                     ['提示', '英文"引号']))):
            with self.subTest(data=json.dumps(data, ensure_ascii=False)), self.assertRaises(ValidationError):
                validate_hints(data)

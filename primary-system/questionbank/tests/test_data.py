"""Git 跟踪批次 JSON 的数据契约：规模、字段、题型覆盖与来源白名单。

按 AGENTS.md 约定「新增数据结构时先写测试再填数据」：这里断言的是已提交
批次文件的形状与规模下限，数据更新后跑 ``manage.py test questionbank``。
"""
import json
from pathlib import Path

from django.test import SimpleTestCase

from questionbank import importing

DATA_DIR = Path(__file__).resolve().parent.parent / 'data' / 'questions'
SOURCE_KEYS = {'primary-math', 'primary-chinese', 'primary-english'}
AREA_FLOORS = {'math': 55, 'chinese': 20, 'english': 35}
TOTAL_FLOOR = 150


def load_batches():
    files = sorted(DATA_DIR.glob('*.json'))
    batches = [(path, json.loads(path.read_text(encoding='utf-8'))) for path in files]
    return batches


class BatchContractTests(SimpleTestCase):
    def test_batches_exist(self):
        self.assertTrue(DATA_DIR.is_dir(), '缺少 data/questions/ 目录。')
        self.assertTrue(load_batches(), '题库还没有任何批次文件。')

    def test_batch_shape(self):
        for path, batch in load_batches():
            self.assertEqual(batch.get('schema_version'), 1, f'{path.name} schema_version 应为 1')
            self.assertTrue(isinstance(batch.get('batch_id'), str) and batch['batch_id'],
                            f'{path.name} 缺少 batch_id')
            self.assertTrue(isinstance(batch.get('questions'), list) and batch['questions'],
                            f'{path.name} 没有题目')

    def test_entries_pass_import_validation(self):
        for path, batch in load_batches():
            for index, entry in enumerate(batch['questions']):
                importing.validate_entry(entry, index)

    def test_source_keys_are_known(self):
        for path, batch in load_batches():
            for entry in batch['questions']:
                self.assertIn(entry['source_key'], SOURCE_KEYS,
                              f'{path.name} 出现未知来源 {entry["source_key"]}')

    def test_scale_floors(self):
        entries = [entry for _, batch in load_batches() for entry in batch['questions']]
        self.assertGreaterEqual(len(entries), TOTAL_FLOOR, f'题库总量低于 {TOTAL_FLOOR}。')
        by_area = {}
        for entry in entries:
            by_area[entry['area']] = by_area.get(entry['area'], 0) + 1
        for area, floor in AREA_FLOORS.items():
            self.assertGreaterEqual(by_area.get(area, 0), floor,
                                    f'{area} 题量低于 {floor}（当前 {by_area.get(area, 0)}）。')

    def test_type_coverage(self):
        entries = [entry for _, batch in load_batches() for entry in batch['questions']]
        for question_type in ('choice', 'truefalse', 'selfcheck'):
            self.assertTrue(any(entry['type'] == question_type for entry in entries),
                            f'批次里缺少题型 {question_type}。')

    def test_tags_present(self):
        for _, batch in load_batches():
            for entry in batch['questions']:
                self.assertTrue(entry['tags'], f'{entry["source_ref"]} 缺少知识点标签。')

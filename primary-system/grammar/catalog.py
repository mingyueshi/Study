"""英语语法专题的数据加载与契约校验。

数据是生成物：``scripts/build_grammar.cjs`` 从 primary/grammar/ 静态版确定性
转换而来——内容源头在静态版，改内容去那里改、重跑脚本再提交。加载期校验
与静态版 test-grammar.js 同契约（8 章 31 点、id 归属、字段完整性、中文标点、
来源全 https），坏数据直接拒绝上线。
"""
import json
import re
from functools import lru_cache
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

DATA_PATH = Path(__file__).resolve().parent / 'data' / 'grammar.json'
SCHEMA_VERSION = 1
SOURCE_CODE = 'primary-grammar'
CHAPTER_COUNT = 8
LESSON_COUNT = 31
LESSON_ID_RE = re.compile(r'^gr\d+-\d+$')
CHAPTER_NO_RE = re.compile(r'^\d{2}$')


@lru_cache(maxsize=1)
def load_grammar():
    with DATA_PATH.open(encoding='utf-8') as file:
        data = json.load(file)
    validate(data)
    return data


def _require(condition, message):
    if not condition:
        raise ImproperlyConfigured('语法数据异常：' + message)


def _walk_strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, list):
        for item in value:
            yield from _walk_strings(item)
    elif isinstance(value, dict):
        for item in value.values():
            yield from _walk_strings(item)


def validate(data):
    _require(data.get('schema_version') == SCHEMA_VERSION, f'不支持的 schema_version：{data.get("schema_version")}。')
    _require(data.get('source_code') == SOURCE_CODE, 'source_code 不正确。')
    chapters = data.get('chapters')
    lessons = data.get('lessons')
    _require(isinstance(chapters, list) and len(chapters) == CHAPTER_COUNT, f'章节数应为 {CHAPTER_COUNT}。')
    _require(isinstance(lessons, list) and len(lessons) == LESSON_COUNT, f'知识点数应为 {LESSON_COUNT}。')

    lesson_ids = set()
    for lesson in lessons:
        lesson_id = lesson.get('id', '')
        _require(LESSON_ID_RE.match(lesson_id), f'知识点 id 不合法：{lesson_id}。')
        _require(lesson_id not in lesson_ids, f'知识点 id 重复：{lesson_id}。')
        lesson_ids.add(lesson_id)
        _require(bool(lesson.get('title')) and bool(lesson.get('definition')), f'{lesson_id} 缺 title/definition。')
        essentials = lesson.get('essentials')
        _require(isinstance(essentials, list) and len(essentials) >= 2
                 and all(isinstance(item, str) and item.strip() for item in essentials),
                 f'{lesson_id} essentials 须为至少 2 条非空文本。')
        example = lesson.get('example') or {}
        _require(bool(example.get('question')) and bool(example.get('answer'))
                 and isinstance(example.get('steps'), list) and len(example['steps']) >= 1,
                 f'{lesson_id} example 不完整。')
        misconception = lesson.get('misconception') or {}
        _require(bool(misconception.get('wrong')) and bool(misconception.get('right')),
                 f'{lesson_id} misconception 不完整。')
        quiz = lesson.get('quiz') or {}
        options = quiz.get('options')
        _require(bool(quiz.get('question')) and isinstance(options, list) and len(options) >= 2
                 and isinstance(quiz.get('answer'), int) and not isinstance(quiz.get('answer'), bool)
                 and 0 <= quiz['answer'] < len(options) and bool(quiz.get('explanation')),
                 f'{lesson_id} quiz 不完整。')
        sources = lesson.get('sources')
        _require(isinstance(sources, list) and len(sources) >= 1
                 and all(isinstance(source, dict) and source.get('label')
                         and str(source.get('url', '')).startswith('https://') for source in sources),
                 f'{lesson_id} sources 须非空且全为 https。')
        facts = lesson.get('facts')
        _require(facts is None or (isinstance(facts, list) and all(
            isinstance(fact, dict) and fact.get('label') and fact.get('value') for fact in facts)),
            f'{lesson_id} facts 形状不正确。')
        formula = lesson.get('formula')
        _require(formula is None or isinstance(formula, str), f'{lesson_id} formula 须为文本或空。')
        comparison = lesson.get('comparison')
        _require(comparison is None or (isinstance(comparison, dict)
                 and isinstance(comparison.get('headers'), list) and len(comparison['headers']) >= 2
                 and isinstance(comparison.get('rows'), list)
                 and all(isinstance(row, list) for row in comparison['rows'])),
                 f'{lesson_id} comparison 形状不正确。')
        for text in _walk_strings(lesson):
            _require('"' not in text and chr(10) not in text and chr(13) not in text,
                     f'{lesson_id} 的文本里出现英文双引号或裸换行，请用中文标点。')
            _require(not re.search(r'<[a-zA-Z/]', text), f'{lesson_id} 的文本里出现 HTML 标签形态。')

    claimed = set()
    chapter_ids = set()
    for chapter in chapters:
        chapter_id = chapter.get('id', '')
        _require(bool(chapter_id) and chapter_id not in chapter_ids, f'章节 id 缺失或重复：{chapter_id}。')
        chapter_ids.add(chapter_id)
        _require(bool(chapter.get('title')) and bool(chapter.get('description')), f'{chapter_id} 缺标题或描述。')
        _require(CHAPTER_NO_RE.match(chapter.get('no', '')), f'章节 {chapter_id} 的 no 不是两位序号。')
        chapter_lessons = chapter.get('lesson_ids')
        _require(isinstance(chapter_lessons, list) and len(chapter_lessons) >= 1,
                 f'章节 {chapter_id} 没有知识点。')
        for lesson_id in chapter_lessons:
            _require(lesson_id in lesson_ids, f'章节 {chapter_id} 引用了不存在的 {lesson_id}。')
            _require(lesson_id not in claimed, f'知识点 {lesson_id} 被多章引用。')
            claimed.add(lesson_id)
    _require(claimed == lesson_ids, '每个知识点必须恰好归入一章。')


def chapters_with_lessons():
    """章节装配知识点，保持静态版的章内顺序。"""
    data = load_grammar()
    lesson_by_id = {lesson['id']: lesson for lesson in data['lessons']}
    return [{'id': chapter['id'], 'no': chapter['no'], 'title': chapter['title'],
             'description': chapter['description'],
             'lessons': [lesson_by_id[lesson_id] for lesson_id in chapter['lesson_ids']]}
            for chapter in data['chapters']]

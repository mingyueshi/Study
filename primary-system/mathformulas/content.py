"""数学公式专题的内容加载与契约校验（零模型只读，数据在本目录 formulas.json）。

每条公式带稳定 ID、使用场景和例题，再按学段（小学/初中/高中）组织章节。文本契约与 plurals
同口径：字符串值里禁英文双引号、裸换行与 HTML 标签，改数据先过校验。
"""
import json
import re
from functools import lru_cache
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

DATA_PATH = Path(__file__).resolve().parent / 'data' / 'formulas.json'

STAGE_CODES = ('primary', 'junior', 'senior')
TAG_PATTERN = re.compile(r'<[a-zA-Z/!?]')


def _walk_strings(value, path):
    """遍历校验文本契约：禁英文双引号、裸换行、HTML 标签。"""
    if isinstance(value, str):
        if '"' in value:
            raise ImproperlyConfigured(f'{path} 含英文双引号，请用中文引号。')
        if '\n' in value or '\r' in value:
            raise ImproperlyConfigured(f'{path} 含裸换行。')
        if TAG_PATTERN.search(value):
            raise ImproperlyConfigured(f'{path} 含 HTML 标签。')
    elif isinstance(value, list):
        for index, item in enumerate(value):
            _walk_strings(item, f'{path}[{index}]')
    elif isinstance(value, dict):
        for key, item in value.items():
            _walk_strings(item, f'{path}.{key}')


def _require_text(value, path, limit):
    if not isinstance(value, str) or not value.strip():
        raise ImproperlyConfigured(f'{path} 必须是非空字符串。')
    if len(value) > limit:
        raise ImproperlyConfigured(f'{path} 超过 {limit} 字。')


def validate(data):
    """契约校验：结构、学段归属、公式组形状与规模下限；违规抛 ImproperlyConfigured。"""
    if not isinstance(data, dict):
        raise ImproperlyConfigured('数据顶层必须是对象。')
    if data.get('schema_version') != 2:
        raise ImproperlyConfigured('schema_version 必须是 2。')
    stages = data.get('stages')
    if not isinstance(stages, list) or [s.get('code') for s in stages] != list(STAGE_CODES):
        raise ImproperlyConfigured(f'stages 必须依次包含 {STAGE_CODES}。')
    for stage in stages:
        _require_text(stage.get('name'), 'stage.name', 12)
        _require_text(stage.get('blurb'), 'stage.blurb', 120)
        if not isinstance(stage.get('wip'), bool):
            raise ImproperlyConfigured('stage.wip 必须是布尔值。')

    chapters = data.get('chapters')
    if not isinstance(chapters, list) or not chapters:
        raise ImproperlyConfigured('chapters 不能为空。')
    seen_chapters = set()
    per_stage = {code: 0 for code in STAGE_CODES}
    for chapter in chapters:
        code, stage = chapter.get('code'), chapter.get('stage')
        if not isinstance(code, str) or not re.fullmatch(r'[a-z][a-z0-9-]{1,20}', code or ''):
            raise ImproperlyConfigured(f'章节 code 不合法：{code!r}')
        if code in seen_chapters:
            raise ImproperlyConfigured(f'章节 code 重复：{code}')
        if stage not in STAGE_CODES:
            raise ImproperlyConfigured(f'章节 {code} 的学段未知：{stage}')
        seen_chapters.add(code)
        per_stage[stage] += 1
        _require_text(chapter.get('title'), f'{code}.title', 24)
        _require_text(chapter.get('intro'), f'{code}.intro', 100)
        _require_text(chapter.get('emoji'), f'{code}.emoji', 8)
    if per_stage['primary'] < 8:
        raise ImproperlyConfigured('小学章节太少（至少 8 章）。')

    groups = data.get('groups')
    if not isinstance(groups, list) or not groups:
        raise ImproperlyConfigured('groups 不能为空。')
    per_stage_groups = {code: 0 for code in STAGE_CODES}
    per_stage_items = {code: 0 for code in STAGE_CODES}
    seen_items = set()
    for group in groups:
        chapter = group.get('chapter')
        if chapter not in seen_chapters:
            raise ImproperlyConfigured(f'公式组挂在了未知章节：{chapter}')
        stage = next(c['stage'] for c in chapters if c['code'] == chapter)
        per_stage_groups[stage] += 1
        _require_text(group.get('title'), f'{chapter}/{group.get("title")}', 40)
        note = group.get('note', '')
        if not isinstance(note, str):
            raise ImproperlyConfigured(f'{chapter} 组 note 必须是字符串。')
        if note:
            _require_text(note, f'{chapter}.note', 160)
        items = group.get('items')
        if not isinstance(items, list) or not items:
            raise ImproperlyConfigured(f'{chapter}/{group.get("title")} 的 items 不能为空。')
        per_stage_items[stage] += len(items)
        for item in items:
            if not isinstance(item, dict):
                raise ImproperlyConfigured(f'{chapter} 的公式条必须是对象。')
            item_id = item.get('id')
            if not isinstance(item_id, str) or not re.fullmatch(r'[a-z][a-z0-9-]{2,63}', item_id):
                raise ImproperlyConfigured(f'{chapter} 的公式 ID 不合法。')
            if item_id in seen_items:
                raise ImproperlyConfigured(f'公式 ID 重复：{item_id}')
            seen_items.add(item_id)
            for field, limit in (('name', 30), ('formula', 140), ('usage', 120)):
                _require_text(item.get(field), f'{item_id}.{field}', limit)
            example = item.get('example')
            if not isinstance(example, dict):
                raise ImproperlyConfigured(f'{item_id} 缺少例题。')
            for field, limit in (('question', 180), ('solution', 240)):
                _require_text(example.get(field), f'{item_id}.example.{field}', limit)
    if per_stage_groups['primary'] < 36 or per_stage_items['primary'] < 150:
        raise ImproperlyConfigured('小学公式规模不足（至少 36 组、150 条）。')
    if per_stage_groups['junior'] < 4 or per_stage_groups['senior'] < 4:
        raise ImproperlyConfigured('初中与高中至少各 4 组打底公式。')
    _walk_strings(data, 'formulas')
    return True


@lru_cache(maxsize=1)
def load_data():
    """加载并校验公式数据；数据坏时直接拒绝上线（照 plurals 同纪律）。"""
    with open(DATA_PATH, encoding='utf-8') as handle:
        data = json.load(handle)
    validate(data)
    return data


def stages_with_counts():
    """三个学段的概览：章节数、组数、公式条数（hero 学段切换用）。"""
    data = load_data()
    chapter_stage = {c['code']: c['stage'] for c in data['chapters']}
    counts = {code: {'chapters': 0, 'groups': 0, 'items': 0} for code in STAGE_CODES}
    for chapter in data['chapters']:
        counts[chapter['stage']]['chapters'] += 1
    for group in data['groups']:
        stage = chapter_stage[group['chapter']]
        counts[stage]['groups'] += 1
        counts[stage]['items'] += len(group['items'])
    return [dict(stage, **counts[stage['code']]) for stage in data['stages']]


def chapter_groups(chapter_code):
    """某章节下的公式组列表（保持数据文件顺序）。"""
    return [group for group in load_data()['groups'] if group['chapter'] == chapter_code]


def searchable_groups():
    """为全库搜索补上章节出处；不修改缓存的源数据。"""
    data = load_data()
    chapters = {chapter['code']: chapter for chapter in data['chapters']}
    stages = {stage['code']: stage['name'] for stage in data['stages']}
    groups = []
    for group in data['groups']:
        chapter = chapters[group['chapter']]
        label = f"{stages[chapter['stage']]} · {chapter['title']}"
        items = []
        for item in group['items']:
            search_text = ' '.join((label, group['title'], item['name'], item['formula'],
                                    item['usage'], item['example']['question'], item['example']['solution']))
            items.append({**item, 'search_text': search_text.lower()})
        groups.append({**group, 'items': items, 'stage': chapter['stage'], 'source_label': label})
    return groups

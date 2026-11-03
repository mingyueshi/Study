"""读取作文坊课程数据（独立于教材编排；纯静态，无词库依赖）。"""

import json
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

SOURCE_CODE = 'primary-writing'
CURRICULUM_PATH = Path(__file__).parent / 'data' / 'topics.json'


def validate(curriculum):
    if curriculum.get('schema_version') != 1 or curriculum.get('source_code') != SOURCE_CODE:
        raise ImproperlyConfigured('Unsupported writing curriculum.')
    categories = curriculum.get('categories', [])
    if len(categories) < 5:
        raise ImproperlyConfigured('作文坊至少需要 5 个题材分类。')
    titles = set()
    for category in categories:
        if not category.get('id') or not category.get('name'):
            raise ImproperlyConfigured('分类缺 id 或 name。')
        topics = category.get('topics', [])
        if len(topics) < 2:
            raise ImproperlyConfigured(f'分类 {category["name"]} 题目不足。')
        for topic in topics:
            title = topic.get('title', '')
            if not title:
                raise ImproperlyConfigured(f'分类 {category["name"]} 有题目缺 title。')
            if title in titles:
                raise ImproperlyConfigured(f'题目重复：{title}')
            titles.add(title)
            if not topic.get('goal') or not topic.get('comment') or not topic.get('task') or not topic.get('model'):
                raise ImproperlyConfigured(f'{title} 缺必填字段（goal/model/comment/task）。')
            outline = topic.get('outline', [])
            labels = ''.join(step.get('label', '') for step in outline)
            if len(outline) != 3 or '开头' not in labels or '结尾' not in labels:
                raise ImproperlyConfigured(f'{title} 结构锦囊必须 3 步且含开头/结尾。')
            if len(topic.get('words', [])) < 3 or len(topic.get('sentences', [])) < 2:
                raise ImproperlyConfigured(f'{title} 好词好句不足。')
    materials = curriculum.get('materials', {})
    for key, minimum in (('starts', 5), ('ends', 4), ('wordGroups', 3), ('sentences', 5)):
        if len(materials.get(key, [])) < minimum:
            raise ImproperlyConfigured(f'素材 {key} 不足。')


def load_curriculum():
    with CURRICULUM_PATH.open(encoding='utf-8') as file:
        curriculum = json.load(file)
    validate(curriculum)
    return curriculum


def grouped_categories():
    """分类列表（topics 就位），顺序与 data/topics.json 一致。"""
    return load_curriculum()['categories']

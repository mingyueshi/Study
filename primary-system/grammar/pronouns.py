"""独立代词专题。课文直接读内容源，题目在浏览器即时判分。"""
import json
import re
from functools import lru_cache
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from django.http import Http404
from django.shortcuts import render
from django.views.decorators.http import require_safe

DATA_PATH = Path(__file__).resolve().parents[1] / 'content_sources' / 'english-pronouns.json'
CHAPTER_IDS = (
    'personal', 'possessive', 'demonstrative', 'reflexive',
    'interrogative', 'indefinite', 'reciprocal', 'relative',
)


def _require(condition, message):
    if not condition:
        raise ImproperlyConfigured(f'英语代词数据异常：{message}')


def _text(value):
    return isinstance(value, str) and bool(value.strip())


def _example(card, location):
    _require(isinstance(card, dict) and all(_text(card.get(key))
             for key in ('word', 'ipa', 'zh', 'en', 'cn')), f'{location} 缺单词、音标或双语例句')
    _require('/' not in card['ipa'], f'{location} 的音标不应带斜线')
    pattern = rf"(?<![\w'’]){re.escape(card['word'])}(?![\w'’])"
    matches = list(re.finditer(pattern, card['en'], re.IGNORECASE))
    _require(len(matches) == 1, f'{location} 的例句应恰好含一个目标词 {card["word"]}')
    match = matches[0]
    return {
        **card,
        'before': card['en'][:match.start()],
        'target': match.group(),
        'after': card['en'][match.end():],
    }


def _group(group, location):
    _require(isinstance(group, dict) and _text(group.get('title')), f'{location} 缺词组标题')
    if 'rows' not in group:
        items = group.get('items')
        _require(isinstance(items, list) and items, f'{location} 缺词形及例句')
        return {**group, 'items': [_example(card, location) for card in items]}

    roles = group.get('roles')
    rows = group['rows']
    _require(isinstance(roles, list) and len(roles) == 2 and all(map(_text, roles)),
             f'{location} 的对照组须有两个角色标签')
    _require(isinstance(rows, list) and rows and all(isinstance(row, list) and len(row) == 2
             for row in rows), f'{location} 的每组对照须有两项')
    pairs = []
    for left, right in rows:
        first = _example(left, location)
        _require(right is not None or (location == 'possessive' and first['word'] == 'its'),
                 f'{location} 的独立物主形式只有 its 可以缺省')
        pairs.append([
            {'role': roles[0], **first},
            {'role': roles[1], **(_example(right, location) if right is not None else {})},
        ])
    return {**group, 'rows': pairs}


def _quiz(question, location):
    _require(isinstance(question, dict) and all(_text(question.get(key))
             for key in ('en', 'cn', 'answer', 'why')), f'{location} 缺题干、译文或答案解析')
    options = question.get('options')
    _require(question['en'].count('___') == 1 and isinstance(options, list)
             and len(options) >= 2 and all(map(_text, options))
             and len(set(options)) == len(options) and question['answer'] in options,
             f'{location} 的填空或选项无效')
    return {**question, 'sentence': question['en'].replace('___', question['answer'])}


def prepare_curriculum(data):
    chapters = data.get('chapters')
    _require(isinstance(chapters, list) and all(isinstance(chapter, dict) for chapter in chapters)
             and tuple(chapter.get('id') for chapter in chapters) == CHAPTER_IDS,
             '章节 ID 或顺序不正确')
    sources = data.get('sources')
    _require(isinstance(sources, list) and sources and all(isinstance(source, dict)
             and _text(source.get('label')) and str(source.get('url', '')).startswith('https://')
             for source in sources), '缺少参考资料或资料链接无效')

    prepared = []
    for chapter in chapters:
        location = chapter['id']
        _require(all(_text(chapter.get(key)) for key in ('title', 'prompt', 'rule', 'activity')),
                 f'{location} 缺标题、讲解或亲子活动')
        groups, tips, quiz = (chapter.get(key) for key in ('groups', 'tips', 'quiz'))
        _require(isinstance(groups, list) and groups and isinstance(tips, list) and tips
                 and all(map(_text, tips)) and isinstance(quiz, list) and quiz,
                 f'{location} 缺词卡、用法提示或练习')
        prepared.append({
            **chapter,
            'groups': [_group(group, location) for group in groups],
            'quiz': [_quiz(question, location) for question in quiz],
        })
    _require('rows' in prepared[0]['groups'][0], '首页示例需要人称代词的首组主格和宾格对照')
    return {**data, 'chapters': prepared}


@lru_cache(maxsize=1)
def load_curriculum():
    with DATA_PATH.open(encoding='utf-8') as file:
        return prepare_curriculum(json.load(file))


@require_safe
def index(request):
    chapters = load_curriculum()['chapters']
    return render(request, 'pronouns/index.html', {
        'essentials': chapters[:4],
        'more': chapters[4:],
        'preview': chapters[0]['groups'][0]['rows'][0],
        'study_area': 'english',
    })


@require_safe
def lesson(request, chapter_id):
    data = load_curriculum()
    chapters = data['chapters']
    if chapter_id not in CHAPTER_IDS:
        raise Http404
    position = CHAPTER_IDS.index(chapter_id)
    chapter = chapters[position]
    return render(request, 'pronouns/lesson.html', {
        'chapter': chapter,
        'chapters': chapters,
        'next_chapter': chapters[position + 1] if position + 1 < len(chapters) else None,
        'groups': chapter['groups'][:4] if chapter_id == 'indefinite' else chapter['groups'],
        'extra_groups': chapter['groups'][4:] if chapter_id == 'indefinite' else (),
        'sources': data['sources'],
        'study_area': 'english',
    })

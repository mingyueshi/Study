"""语法总览、整章专题入口与速查笔记。"""
import json
from functools import lru_cache
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from django.urls import reverse

from catalog.entry_registry import SPECIAL_ENTRIES

from .catalog import load_grammar

LINKS_PATH = Path(__file__).resolve().parents[1] / 'content_sources' / 'grammar' / 'topic-links.json'


def _require(condition, message):
    if not condition:
        raise ImproperlyConfigured(f'语法导航数据异常：{message}')


def _text(value):
    return isinstance(value, str) and bool(value.strip())


def prepare_navigation(data, chapter_ids, lesson_ids):
    _require(isinstance(data, dict), '文件应包含专题、章节和补充笔记')
    entries = {entry['route']: entry for entry in SPECIAL_ENTRIES if entry['area'] == 'english'}
    topics = data.get('topics')
    _require(isinstance(topics, list) and topics and all(
        isinstance(topic, dict) and _text(topic.get('route')) and topic['route'] in entries
        and _text(topic.get('focus')) and _text(topic.get('sample')) for topic in topics
    ), '专题目录缺路由、主题或例词')
    directory = {}
    for topic in topics:
        route = topic['route']
        _require(route not in directory, f'{route} 在专题目录中重复')
        entry = entries[route]
        directory[route] = {
            **topic, 'name': entry['name'], 'icon': entry['icon'], 'blurb': entry['blurb'], 'url': reverse(route),
        }

    chapters = data.get('chapters')
    _require(isinstance(chapters, dict) and set(chapters) == chapter_ids, '章节关联与课程目录不一致')
    by_chapter = {}
    for chapter_id, chapter in chapters.items():
        _require(isinstance(chapter, dict) and _text(chapter.get('reference')), f'{chapter_id} 缺速查说明')
        routes = chapter.get('topics')
        _require(isinstance(routes, list) and all(_text(route) and route in directory for route in routes)
                 and len(set(routes)) == len(routes), f'{chapter_id} 的专题入口无效')
        by_chapter[chapter_id] = {
            'reference': chapter['reference'],
            'topics': [directory[route] for route in routes],
        }

    notes = data.get('transferred_lessons')
    _require(isinstance(notes, dict) and set(notes) <= lesson_ids and all(
        isinstance(group, list) and all(map(_text, group)) for group in notes.values()
    ), '补充笔记的知识点 ID 或内容无效')
    return {'directory': list(directory.values()), 'by_chapter': by_chapter, 'notes': notes}


@lru_cache(maxsize=1)
def load_navigation():
    with LINKS_PATH.open(encoding='utf-8') as file:
        data = json.load(file)
    grammar = load_grammar()
    return prepare_navigation(data, {chapter['id'] for chapter in grammar['chapters']},
                              {lesson['id'] for lesson in grammar['lessons']})

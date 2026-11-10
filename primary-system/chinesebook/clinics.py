"""四年级语文诊室的题目契约与教材词条关联。"""
import json
import re
from collections import Counter
from functools import lru_cache

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.shortcuts import render
from django.views.decorators.http import require_safe

from .content import load_book

SOURCE = settings.BASE_DIR / 'content_sources' / 'chinese-clinics.json'


def require(condition, message):
    if not condition:
        raise ImproperlyConfigured(f'语文诊室数据异常：{message}')


def rows(data, key):
    items = data.get(key)
    require(isinstance(items, list) and items and all(isinstance(row, dict) for row in items), key)
    return items


def check_text(row, *keys):
    for key in keys:
        value = row.get(key)
        require(isinstance(value, str) and bool(value.strip()) and not re.search(r'[<>"\r\n]', value),
                f'{key} 缺失或含非法标点：{row}')


def check_ids(items):
    for row in items:
        check_text(row, 'id')
        require(re.fullmatch(r'[a-z]+(?:-[a-z0-9]+)*', row['id']), row['id'])
    require(len({row['id'] for row in items}) == len(items), '编号重复')


def sentence_rounds(data):
    groups, cases = rows(data, 'causes'), rows(data, 'sentences')
    check_ids(groups + cases)
    counts = Counter()
    group_ids = {group['id'] for group in groups}
    for group in groups:
        check_text(group, 'name', 'tip')
    require(len({group['name'] for group in groups}) == len(groups) >= 3, '病因名称重复或分类太少')
    for case in cases:
        check_text(case, 'cause', 'prompt', 'answer', 'explanation')
        options = case.get('options')
        require(isinstance(options, list) and len(options) == 3, case['id'])
        for option in options:
            check_text({'option': option}, 'option')
        require(len(set(options)) == len(options) and case['answer'] in options
                and case['prompt'] not in options and case['cause'] in group_ids, case['id'])
        counts[case['cause']] += 1
    require(all(counts[group_id] >= 3 for group_id in group_ids), '每种病因至少需要三张病例')
    return {'groups': groups, 'cases': cases}


def textbook_index(book):
    """按组词找目标字，避免复制教材里的候选字和拼音。"""
    similar = {}
    for group in book['similar']:
        for char, words in group:
            for word in words.split('、'):
                if word.count(char) == 1:
                    similar[word] = (char, group)
    readings = {}
    for char, first, first_words, second, second_words in book['polyphonic']:
        pairs = [(first, first_words), (second, second_words)]
        counts = Counter(word for _, words in pairs for word in words.split('、'))
        for pinyin, words in pairs:
            for word in words.split('、'):
                if counts[word] == 1 and word.count(char) == 1:
                    readings[word] = (char, pinyin, pairs)
    return similar, readings


def word_rounds(data, book):
    groups = rows(data, 'word_groups')
    check_ids(groups)
    require({group['id'] for group in groups} == {'shape', 'reading'}, '字词分类应为形近字和多音字')
    for group in groups:
        check_text(group, 'name', 'tip')
    shape_cases, reading_cases = rows(data, 'shapes'), rows(data, 'readings')
    check_ids(shape_cases + reading_cases)
    similar, readings = textbook_index(book)
    cases = []
    for row in shape_cases:
        check_text(row, 'word', 'wrong', 'sentence', 'explanation')
        word = row['word']
        require(word in similar and row['sentence'].count(word) == 1, row['id'])
        char, group = similar[word]
        options = [entry[0] for entry in group]
        require(len(options) == len(set(options)) >= 2 and row['wrong'] in options
                and row['wrong'] != char, row['id'])
        wrong_word = word.replace(char, row['wrong'])
        prompt = row['sentence'].replace(word, wrong_word)
        require(prompt.count(wrong_word) == 1 and wrong_word.count(row['wrong']) == 1
                and all(wrong_word not in words.split('、') for _, words in group), row['id'])
        cases.append({
            'id': row['id'], 'cause': 'shape', 'prompt': prompt,
            'focus': wrong_word, 'target': row['wrong'], 'result': row['sentence'], 'answer': char, 'options': options,
            'explanation': row['explanation'], 'compare': group,
        })
    for row in reading_cases:
        check_text(row, 'word', 'sentence', 'explanation')
        word = row['word']
        require(word in readings and row['sentence'].count(word) == 1, row['id'])
        char, pinyin, pairs = readings[word]
        cases.append({
            'id': row['id'], 'cause': 'reading', 'prompt': row['sentence'], 'focus': word, 'target': char,
            'result': f'「{word}」的「{char}」读 {pinyin}。', 'answer': pinyin,
            'options': [reading for reading, _ in pairs], 'compare': pairs,
            'explanation': row['explanation'],
        })
    require(len(shape_cases) >= 3 and len(reading_cases) >= 3, '每种字词练习至少需要三张病例')
    return {'groups': groups, 'cases': cases}


@lru_cache(maxsize=1)
def load_clinics():
    data = json.loads(SOURCE.read_text(encoding='utf-8'))
    require(isinstance(data, dict) and data.get('schema_version') == 1, '不支持的版本')
    return sentence_rounds(data), word_rounds(data, load_book('4a')['kb'])


@require_safe
def sentence_hospital(request):
    hospital, _ = load_clinics()
    return render(request, 'chinesebook/clinic.html', {
        'clinic': hospital, 'hospital': True, 'study_area': 'chinese',
    })


@require_safe
def typo_clinic(request):
    _, clinic = load_clinics()
    return render(request, 'chinesebook/clinic.html', {
        'clinic': clinic, 'study_area': 'chinese',
    })

"""比较台的比例、句子和练习直接从课程源装配。"""
import json
import re
from functools import lru_cache
from itertools import combinations
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from django.shortcuts import render
from django.views.decorators.http import require_safe

DATA_PATH = Path(__file__).resolve().parents[1] / 'content_sources' / 'english-comparison.json'
DEGREES = ('原级', '比较级', '最高级')
COLORS = ('blue', 'red', 'green', 'yellow')
DIRECTIONS = ('high', 'low')
COUNTS = (2, 3)


def _require(condition, message):
    if not condition:
        raise ImproperlyConfigured(f'比一比数据异常：{message}')


def _has_text(record, fields):
    return isinstance(record, dict) and all(
        isinstance(record.get(field), str) and record[field].strip() for field in fields
    )


def _records(records, fields, name):
    _require(isinstance(records, list) and records and all(
        _has_text(record, ('id', *fields)) and re.fullmatch(r'[a-z][a-z0-9-]*', record['id'])
        for record in records
    ), f'{name}缺少有效的 ID 或内容')
    _require(len({record['id'] for record in records}) == len(records), f'{name} ID 重复')
    return records


def _family(family):
    forms = family.get('forms')
    family_id = family['id']
    _require(isinstance(forms, list) and len(forms) == len(DEGREES) and all(
        _has_text(form, ('word', 'ipa', 'zh', 'en', 'cn')) and '/' not in form['ipa'] for form in forms
    ), f'{family_id} 需要三种词形、音标和双语例句')
    _require(len({form['word'] for form in forms}) == len(DEGREES) and forms[-1]['word'].startswith('the '),
             f'{family_id} 词形重复或最高级缺少 the')
    examples = []
    for degree, form in zip(DEGREES, forms):
        matches = list(re.finditer(rf"\b{re.escape(form['word'])}\b", form['en'], re.IGNORECASE))
        _require(len(matches) == 1, f'{family_id} 的{degree}例句应恰好含一个目标词形')
        match = matches[0]
        examples.append({**form, 'degree': degree, 'before': form['en'][:match.start()],
                         'focus': match.group(), 'after': form['en'][match.end():]})
    return {**family, 'forms': examples}


def _result(scene, direction, items, family):
    rank = max if direction == 'high' else min
    winner = rank(items, key=lambda item: item['value'])
    form = family['forms'][len(items) - 1]
    before = f"The {winner['id']} {scene['noun']} is "
    if len(items) == 2:
        other = next(item for item in items if item != winner)
        focus = f"{form['word']} than"
        after = f" the {other['id']} {scene['noun']}."
        cn = f"{winner['name']}比{other['name']}{form['zh'].removesuffix('的').removeprefix('更')}。"
    else:
        focus = form['word']
        after = ' of the three.'
        cn = f"在这三{scene['counter']}{scene['noun_zh']}中，{winner['name']}{form['zh'].removesuffix('的')}。"
    return {'before': before, 'focus': focus, 'after': after, 'en': before + focus + after,
            'cn': cn, 'winner': winner['id'], 'degree': form['degree']}


def _scene(scene, families):
    scene_id = scene['id']
    items = scene.get('items')
    _require(scene['shape'] in {'pencil', 'ball'} and isinstance(items, list)
             and all(_has_text(item, ('id', 'zh')) and type(item.get('value')) is int
                     and item['value'] > 0 for item in items)
             and tuple(item['id'] for item in items) == COLORS
             and len({item['value'] for item in items}) == len(items), f'{scene_id} 的模型尺寸或颜色无效')
    directions = scene.get('directions')
    _require(isinstance(directions, dict) and set(directions) == set(DIRECTIONS) and all(
        _has_text(entry, ('family', 'label', 'super_label')) and entry['family'] in families
        for entry in directions.values()
    ) and len({entry['family'] for entry in directions.values()}) == len(DIRECTIONS),
        f'{scene_id} 的比较方向缺少词形')
    largest = max(item['value'] for item in items)
    items = [{**item, 'name': item['zh'] + scene['noun_zh'], 'percent': round(100 * item['value'] / largest, 3)}
             for item in items]
    return {**scene, 'items': items, 'directions': {
        direction: {**entry, 'results': {
            ','.join(sorted(item['id'] for item in group)): _result(scene, direction, group, families[entry['family']])
            for count in COUNTS for group in combinations(items, count)
        }} for direction, entry in directions.items()
    }}


def prepare_comparison(data):
    families = {family['id']: _family(family) for family in _records(data.get('families'), ('note',), '词组')}
    scenes = {scene['id']: _scene(scene, families) for scene in _records(
        data.get('scenes'), ('title', 'shape', 'noun', 'noun_zh', 'counter', 'measure', 'hint'), '场景'
    )}
    used = {direction['family'] for scene in scenes.values() for direction in scene['directions'].values()}
    sources = data.get('sources')
    _require(isinstance(sources, list) and sources and all(
        _has_text(source, ('label', 'url')) and source['url'].startswith('https://') for source in sources
    ), '参考资料链接无效')
    questions = data.get('quiz')
    _require(isinstance(questions, list) and questions and all(
        _has_text(q, ('family', 'why')) and q['family'] in families
        and type(q.get('degree')) is int and 0 <= q['degree'] < len(DEGREES)
        and type(q.get('answer_position')) is int and 0 <= q['answer_position'] < len(DEGREES)
        for q in questions
    ), '练习引用的词组、词形或选项位置无效')
    quiz = []
    for question in questions:
        forms = families[question['family']]['forms']
        answer = forms[question['degree']]
        options = [form['word'] for form in forms if form != answer]
        options.insert(question['answer_position'], answer['word'])
        quiz.append({**answer, 'options': options, 'why': question['why']})

    return {
        'scenes': scenes,
        'active_families': [family for key, family in families.items() if key in used],
        'extra_families': [family for key, family in families.items() if key not in used],
        'sources': sources,
        'quiz': quiz,
    }


@lru_cache(maxsize=1)
def load_comparison():
    with DATA_PATH.open(encoding='utf-8') as file:
        return prepare_comparison(json.load(file))


@require_safe
def index(request):
    data = load_comparison()
    scenes = data['scenes']
    scene_id = request.GET.get('scene')
    scene = scenes.get(scene_id, next(iter(scenes.values())))
    count = 3 if request.GET.get('count') == '3' else 2
    direction = request.GET.get('direction')
    if direction not in DIRECTIONS:
        direction = 'high'
    if 'item' in request.GET:
        selected = list(dict.fromkeys(item for item in request.GET.getlist('item') if item in COLORS))[:count]
    else:
        selected = list(COLORS[:count])
    choice = scene['directions'][direction]
    result = choice['results'].get(','.join(sorted(selected))) if len(selected) == count else None
    return render(request, 'english_comparison/index.html', {
        **data,
        'scene': scene,
        'count': count,
        'direction': direction,
        'selected': selected,
        'current_family': choice['family'],
        'result': result,
        'study_area': 'english',
    })

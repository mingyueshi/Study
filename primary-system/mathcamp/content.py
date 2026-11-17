"""数学思维训练营 schema 1；先校验结构，再校验题目可解性。"""
from functools import lru_cache
import json
from pathlib import Path
import re
from urllib.parse import urlparse

from django.core.exceptions import ImproperlyConfigured

from .puzzles import logic_solutions, magic_valid, mental_answer, pattern_terms, sudoku_solutions

DATA_PATH = Path(__file__).parent / 'data' / 'camp.json'
TRACKS = ('logic', 'sudoku', 'magic', 'patterns', 'mental')
KINDS = dict(zip(TRACKS, ('logic', 'sudoku', 'magic', 'sequence', 'mental')))
ID = re.compile(r'[a-z][a-z0-9-]{1,50}')


def require(ok, message):
    if not ok:
        raise ImproperlyConfigured(message)


def text(value):
    require(isinstance(value, str) and 0 < len(value.strip()) <= 1200, '正文应为非空短文本。')
    require(not any(c in value for c in ('\n', '\r', '"')) and not re.search(r'<[a-zA-Z/!?]', value), '正文包含非法标点或标签。')


def texts(value, minimum=1):
    require(isinstance(value, list) and len(value) >= minimum, '文本列表不完整。')
    for item in value:
        text(item)


def integer(value, low, high):
    require(type(value) is int and low <= value <= high, '整数超出范围。')


def numbers(value, length, low, high):
    require(isinstance(value, list) and len(value) == length, '数字列表长度不正确。')
    for item in value:
        integer(item, low, high)


def validate(data):
    require(isinstance(data, dict) and type(data.get('schema_version')) is int and data['schema_version'] == 1, '训练营版本不正确。')
    text(data.get('title')); text(data.get('lead'))
    tracks = data.get('tracks')
    require(isinstance(tracks, list) and all(isinstance(t, dict) for t in tracks), '训练路线必须是对象列表。')
    require(tuple(t.get('id') for t in tracks) == TRACKS, '训练路线稳定 ID 或顺序不正确。')
    ids = set()
    for track in tracks:
        for key in ('title', 'symbol', 'lead', 'foundation', 'transfer'):
            text(track.get(key))
        texts(track.get('habits'), 3)
        methods = track.get('methods')
        require(isinstance(methods, list) and len(methods) == 3, '每条路线应有三个方法。')
        for method in methods:
            require(isinstance(method, dict), '方法必须是对象。')
            for key in ('title', 'when', 'example'):
                text(method.get(key))
            texts(method.get('steps'), 2)
        drills = track.get('drills')
        require(isinstance(drills, list) and len(drills) == 3, '每条路线应有入门、进阶、挑战三关。')
        for level, drill in enumerate(drills, 1):
            require(isinstance(drill, dict), '训练题必须是对象。')
            qid = drill.get('id')
            require(isinstance(qid, str) and ID.fullmatch(qid) and qid not in ids, '训练 ID 不合法或重复。')
            ids.add(qid)
            require(type(drill.get('level')) is int and drill['level'] == level and drill.get('kind') == KINDS[track['id']], '训练难度或类型不正确。')
            for key in ('title', 'goal', 'prompt', 'answer_text', 'reflection'):
                text(drill.get(key))
            texts(drill.get('hints'), 3); texts(drill.get('explanation'), 2)
            p = drill.get('puzzle')
            require(isinstance(p, dict), '缺少题目配置。')
            if drill['kind'] == 'logic':
                texts(p.get('labels'), 3); texts(p.get('choices'), 3)
                n = len(p['labels'])
                require(n <= 5 and len(p['choices']) == n and len(set(p['labels'])) == n and len(set(p['choices'])) == n, '逻辑题须为三至五项一一匹配。')
                cs = p.get('constraints')
                require(isinstance(cs, list) and cs, '逻辑题缺少线索。')
                for c in cs:
                    require(isinstance(c, dict) and c.get('op') in ('eq', 'ne', 'before', 'next', 'apart'), '逻辑线索类型不合法。')
                    text(c.get('text')); integer(c.get('a'), 0, n - 1)
                    integer(c.get('value') if c['op'] in ('eq', 'ne') else c.get('b'), 0, n - 1)
                numbers(p.get('solution'), n, 0, n - 1)
                require(logic_solutions(p) == [p['solution']], '逻辑线索必须恰有一个解，且与答案一致。')
            elif drill['kind'] in ('sudoku', 'magic'):
                n = p.get('size'); integer(n, 3, 9)
                require(n in ((4, 6, 9) if drill['kind'] == 'sudoku' else (3, 4)), '棋盘尺寸未登记。')
                maximum = n if drill['kind'] == 'sudoku' else n * n
                numbers(p.get('givens'), n * n, 0, maximum)
                numbers(p.get('solution'), n * n, 1, maximum)
                require(0 in p['givens'] and any(p['givens']), '棋盘应保留题设与空格。')
                require(all(not g or g == s for g, s in zip(p['givens'], p['solution'])), '题设与参考解冲突。')
                if drill['kind'] == 'sudoku':
                    integer(p.get('box_rows'), 2, 3); integer(p.get('box_cols'), 2, 3)
                    require(p['box_rows'] * p['box_cols'] == n, '数独宫格尺寸不正确。')
                    require(sudoku_solutions(p) == [p['solution']], '数独必须恰有一个解，且与参考解一致。')
                else:
                    require(magic_valid(p['solution'], n), '幻方参考解不满足行列与两条对角线条件。')
            elif drill['kind'] == 'sequence':
                model = p.get('model')
                require(model in ('difference', 'growing', 'interleave'), '规律模型未登记。')
                fields = {'difference': ('start', 'step'), 'growing': ('start', 'first_delta', 'delta_step'),
                          'interleave': ('odd_start', 'odd_step', 'even_start', 'even_step')}[model]
                for field in fields:
                    integer(p.get(field), 1, 100)
                text(p.get('rule'))
                require(isinstance(p.get('shown'), list) and 5 <= len(p['shown']) <= 8, '规律题需要五至八个已知项。')
                numbers(p['shown'], len(p['shown']), 1, 100000)
                numbers(p.get('answer'), 2, 1, 100000)
                require(p['shown'] + p['answer'] == pattern_terms(p, len(p['shown']) + 2), '规律模型与答案不一致。')
            else:
                model = p.get('model')
                require(model in ('complement', 'distribute', 'series'), '巧算模型未登记。')
                if model == 'complement':
                    numbers(p.get('numbers'), 4, 1, 10000)
                elif model == 'distribute':
                    integer(p.get('factor'), 1, 1000); integer(p.get('multiplier'), 1, 1000)
                else:
                    integer(p.get('first'), 1, 1000); integer(p.get('last'), p['first'] + 2, 10000)
                integer(p.get('answer'), 1, 100000000)
                require(p['answer'] == mental_answer(p), '巧算题模型与答案不一致。')
        sources = track.get('sources')
        require(isinstance(sources, list) and sources, '每条路线应有资料出处。')
        for source in sources:
            require(isinstance(source, dict), '出处必须是对象。'); text(source.get('title'))
            url = source.get('url')
            require(isinstance(url, str) and urlparse(url).scheme == 'https' and bool(urlparse(url).netloc), '出处应为 HTTPS 链接。')
    return data


@lru_cache(maxsize=1)
def load_data():
    return validate(json.loads(DATA_PATH.read_text(encoding='utf-8')))

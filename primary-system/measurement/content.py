"""Validate measurement content and cross-references before rendering."""
from functools import lru_cache
from fractions import Fraction
import json
from pathlib import Path
import re
from urllib.parse import urlsplit

from django.core.exceptions import ImproperlyConfigured

from .calculations import convert, parse_amount

DATA_PATH = Path(__file__).parent / 'data' / 'topics.json'
DIMENSIONS = ('length', 'area', 'volume', 'mass', 'time')
SLUG = re.compile(r'[a-z][a-z0-9-]{0,45}')


def require(condition, message):
    if not condition:
        raise ImproperlyConfigured(f'单位与测量：{message}')


def text(value):
    require(isinstance(value, str) and 0 < len(value.strip()) <= 1000, '文字须为非空短文本。')
    require(not re.search(r'[\n\r"]|<[a-zA-Z/!?]', value), '文字不能包含裸换行、英文双引号或 HTML。')


def items(value, minimum):
    require(isinstance(value, list) and len(value) >= minimum and all(isinstance(item, dict) for item in value), '对象列表不完整。')
    return value


def stable_id(item, used):
    code = item.get('id')
    require(isinstance(code, str) and SLUG.fullmatch(code) and code not in used, 'ID 不合法或重复。')
    used.add(code)


def amount(value):
    parsed = parse_amount(value)
    require(parsed is not None, '数值必须是支持范围内的非负十进制数。')
    return parsed


def validate(data):
    require(isinstance(data, dict) and type(data.get('schema_version')) is int and data['schema_version'] == 1, '数据版本不正确。')
    for key in ('title', 'lead', 'estimate_lead'):
        text(data.get(key))
    dimensions = items(data.get('dimensions'), 5)
    require(tuple(item.get('id') for item in dimensions) == DIMENSIONS, '五类换算 ID 或顺序不正确。')
    units_by_dimension, exercise_ids = {}, set()
    for dimension in dimensions:
        for key in ('title', 'lead', 'rule', 'boundary', 'activity'):
            text(dimension.get(key))
        units = items(dimension.get('units'), 3)
        unit_ids = set()
        for unit in units:
            stable_id(unit, unit_ids)
            for key in ('name', 'symbol', 'scene'):
                text(unit.get(key))
            factor = unit.get('factor')
            require(type(factor) is int and 1 <= factor <= 10**12, '单位进率超出范围。')
        require(units[0]['factor'] == 1 and all(a['factor'] <= b['factor'] for a, b in zip(units, units[1:])), '单位应从基准单位按大小递增。')
        units_by_dimension[dimension['id']] = mapping = {unit['id']: unit for unit in units}
        example = dimension.get('example')
        require(isinstance(example, dict), '缺少换算示例。')
        source, target = example.get('from'), example.get('to')
        require(isinstance(source, str) and source in mapping and isinstance(target, str) and target in mapping and source != target, '换算示例引用了错误的单位。')
        require(convert(amount(example.get('amount')), mapping[source], mapping[target]) == amount(example.get('result')), '换算示例答案与进率不符。')
        for question in items(dimension.get('practice'), 2):
            stable_id(question, exercise_ids)
            for key in ('question', 'hint', 'answer'):
                text(question.get(key))
    for case in items(data.get('estimates'), 5):
        stable_id(case, exercise_ids)
        for key in ('title', 'question', 'hint', 'explanation', 'try'):
            text(case.get(key))
        dimension, unit = case.get('dimension'), case.get('unit')
        require(isinstance(dimension, str) and dimension in units_by_dimension and isinstance(unit, str) and unit in units_by_dimension[dimension], '估算题单位与类别不匹配。')
        lower, upper = amount(case.get('lower')), amount(case.get('upper'))
        reference = amount(case.get('reference'))
        require(0 < lower < upper and lower <= reference <= upper, '参考值应为正数且位于参考范围内。')
        terms = case.get('terms')
        require(isinstance(terms, list) and terms and all(isinstance(term, list) and len(term) == 2 for term in terms), '估算参考量应由乘积之和组成。')
        divisor = amount(case.get('divisor', '1'))
        require(divisor > 0 and sum((amount(a) * amount(b) for a, b in terms), Fraction()) / divisor == reference, '估算参考量与题设算式不符。')
    for source in items(data.get('sources'), 1):
        text(source.get('title'))
        url = source.get('url')
        require(isinstance(url, str) and urlsplit(url).scheme == 'https' and bool(urlsplit(url).hostname), '出处应为 HTTPS 链接。')
    return data


@lru_cache(maxsize=1)
def load_data():
    return validate(json.loads(DATA_PATH.read_text(encoding='utf-8')))

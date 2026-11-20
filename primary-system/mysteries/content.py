"""专题案卷随代码发布，数据库无需导入。"""
import json
from datetime import date
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured


PROGRESS_LABELS = {
    'new-evidence': '有新线索',
    'partial': '局部已破解',
    'open': '仍待解',
}


def validate_investigation(case):
    slug = case['slug']
    clues = case['challenge'].get('clues')
    if (not isinstance(clues, list) or not 2 <= len(clues) <= 3
            or any(type(number) is not int or not 1 <= number <= len(case['evidence']) for number in clues)
            or len(set(clues)) != len(clues)):
        raise ImproperlyConfigured(f'{slug} 的推理线索须引用两至三条不同的案卷线索。')

    if 'progress' not in case:
        return
    progress = case['progress']
    if not isinstance(progress, dict) or progress.get('status') not in ('new-evidence', 'partial'):
        raise ImproperlyConfigured(f'{slug} 的研究进展标签无效。')
    for field in ('date', 'title', 'summary'):
        if not isinstance(progress.get(field), str) or not progress[field].strip():
            raise ImproperlyConfigured(f'{slug} 的研究进展缺少 {field}。')
    try:
        if date.fromisoformat(progress['date']).isoformat() != progress['date']:
            raise ValueError
    except ValueError as error:
        raise ImproperlyConfigured(f'{slug} 的研究进展日期须使用 YYYY-MM-DD。') from error
    source = progress.get('source')
    if type(source) is not int or not 1 <= source <= len(case['sources']):
        raise ImproperlyConfigured(f'{slug} 的研究进展须引用案卷中的资料出处。')


def load_cases():
    data = json.loads((Path(__file__).parent / 'data' / 'cases.json').read_text(encoding='utf-8'))
    if data['schema_version'] != 1:
        raise ImproperlyConfigured('未解之谜案卷的数据版本不受支持。')
    cases = {}
    for case in data['cases']:
        slug = case['slug']
        if slug in cases:
            raise ImproperlyConfigured(f'未解之谜案卷编号重复：{slug}')
        validate_investigation(case)
        cases[slug] = case
    return cases

"""专题案卷随代码发布，数据库无需导入。"""
import json
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured


def load_cases():
    data = json.loads((Path(__file__).parent / 'data' / 'cases.json').read_text(encoding='utf-8'))
    if data['schema_version'] != 1:
        raise ImproperlyConfigured('未解之谜案卷的数据版本不受支持。')
    cases = {}
    for case in data['cases']:
        slug = case['slug']
        if slug in cases:
            raise ImproperlyConfigured(f'未解之谜案卷编号重复：{slug}')
        cases[slug] = case
    return cases

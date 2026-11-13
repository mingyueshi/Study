"""兑换目录的文件结构校验；导入前完整校验，不在学习请求中写入奖励。"""
import json
from pathlib import Path

from django.conf import settings
from .categories import CATEGORY_CODES, LEGACY_CATEGORY_ALIASES


DEFAULT_SOURCE = settings.BASE_DIR / 'content_sources' / 'rewards.json'
FIELDS = {'name', 'icon', 'cost', 'note'}


def load_reward_catalog(source=DEFAULT_SOURCE, *, for_retirement=False):
    data = json.loads(Path(source).read_text(encoding='utf-8'))
    if not isinstance(data, dict) or set(data) != {'schema_version', 'rewards'}:
        raise ValueError('奖励目录需要 schema_version 和 rewards 两个字段。')
    if type(data['schema_version']) is not int or data['schema_version'] not in (1, 2):
        raise ValueError('奖励目录版本必须为 1 或 2。')
    fields = FIELDS | {'category'} if data['schema_version'] == 2 else FIELDS
    if not isinstance(data['rewards'], list) or not data['rewards']:
        raise ValueError('奖励目录至少需要一个项目。')
    names = set()
    for index, row in enumerate(data['rewards'], 1):
        prefix = f'第 {index} 项奖励'
        row_fields = fields | {'sort'} if for_retirement and isinstance(row, dict) and 'sort' in row else fields
        if not isinstance(row, dict) or set(row) != row_fields:
            raise ValueError(f'{prefix}的字段需要为：{"、".join(sorted(fields))}。')
        allowed_categories = CATEGORY_CODES | LEGACY_CATEGORY_ALIASES.keys() if for_retirement else CATEGORY_CODES
        if data['schema_version'] == 2 and (not isinstance(row['category'], str) or row['category'] not in allowed_categories):
            raise ValueError(f'{prefix}的 category 必须属于已定义的奖励分类。')
        if 'sort' in row and (type(row['sort']) is not int or not 0 <= row['sort'] <= 100000):
            raise ValueError(f'{prefix}的 sort 必须是 0～100000 的整数。')
        for field, limit in (('name', 50), ('icon', 16), ('note', 200)):
            value = row[field]
            if not isinstance(value, str) or not value.strip() or value != value.strip() or len(value) > limit:
                raise ValueError(f'{prefix}的 {field} 必须是 1～{limit} 字的文本，首尾不留空格。')
            if any(char in value for char in ('\n', '\r', '"')):
                raise ValueError(f'{prefix}请使用中文标点，不要使用英文双引号或换行。')
        if type(row['cost']) is not int or not 1 <= row['cost'] <= 100000:
            raise ValueError(f'{prefix}的 cost 必须是 1～100000 的整数。')
        if row['name'] in names:
            raise ValueError(f'{prefix}的名称重复：{row["name"]}。')
        names.add(row['name'])
    return data['rewards']

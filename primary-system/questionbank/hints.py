"""独立于已发布题库批次的奥数分步提示，按稳定 UUID 关联。"""
from functools import lru_cache
import json
from pathlib import Path
from uuid import UUID

from django.core.exceptions import ValidationError

DATA_PATH = Path(__file__).parent / 'data' / 'olympiad-hints.json'


def validate_hints(data):
    if not isinstance(data, dict) or data.get('schema_version') != 1:
        raise ValidationError('奥数提示版本不正确。')
    entries = data.get('questions')
    if not isinstance(entries, dict) or not entries:
        raise ValidationError('奥数提示必须包含题目映射。')
    for key, steps in entries.items():
        try:
            valid_id = isinstance(key, str) and str(UUID(key)) == key
        except ValueError:
            valid_id = False
        if not valid_id:
            raise ValidationError('奥数提示的题目标识不正确。')
        if not isinstance(steps, list) or not 2 <= len(steps) <= 4:
            raise ValidationError('每题应有 2～4 步提示。')
        if any(not isinstance(step, str) or not step.strip() or len(step) > 240
               or any(char in step for char in ('"', '\n', '\r')) for step in steps):
            raise ValidationError('提示须为简短的中文标点文本。')
    return entries


@lru_cache(maxsize=1)
def load_hints():
    return validate_hints(json.loads(DATA_PATH.read_text(encoding='utf-8')))


def question_hints(question):
    if question.track != 'olympiad' or question.source_key != 'primary-olympiad':
        return []
    return load_hints().get(str(question.uuid), [])

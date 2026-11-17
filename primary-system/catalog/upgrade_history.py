"""随项目保存的升级记录；页面运行时不依赖 Git 或数据库。"""
import json
import re
from datetime import date
from pathlib import Path

HISTORY_PATH = Path(__file__).resolve().parent / 'data' / 'upgrade_history.json'


def validate_history(data):
    if not isinstance(data, dict) or type(data.get('schema_version')) is not int or data['schema_version'] != 1:
        raise ValueError('升级记录的结构版本必须为 1。')
    records = data.get('records')
    if not isinstance(records, list) or not records:
        raise ValueError('升级记录不能为空。')
    revisions = set()
    previous_date = '9999-12-31'
    for record in records:
        if not isinstance(record, dict) or set(record) != {'revision', 'date', 'title'}:
            raise ValueError('每条升级记录必须包含提交编号、日期和标题。')
        revision, day, title = (record[key] for key in ('revision', 'date', 'title'))
        if not isinstance(revision, str) or not re.fullmatch(r'[0-9a-f]{40}', revision) or revision in revisions:
            raise ValueError('升级记录的提交编号无效或重复。')
        if not isinstance(day, str) or date.fromisoformat(day).isoformat() != day or day > previous_date:
            raise ValueError('升级记录须使用有效日期，并按日期倒序排列。')
        if not isinstance(title, str) or not title.strip() or title != title.strip() or any(c in title for c in '\n\r\t'):
            raise ValueError('升级记录的标题必须是非空的单行文字。')
        revisions.add(revision)
        previous_date = day
    return data


def load_history():
    return validate_history(json.loads(HISTORY_PATH.read_text(encoding='utf-8')))['records']

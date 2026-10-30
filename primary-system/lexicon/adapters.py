"""Adapters preserve source fields; they never grant public-use rights."""
import hashlib
import json
from pathlib import Path
from catalog.models import ContentItem
from .importing import ImportProblem, digest

XINHUA_SHA256 = '1d4b4f454ce1c416d6a1ab2369d6e66c0ff99e04390172eef70790499e21ce19'
XINHUA_VERSION = '8de1001aa499cd65fb97ef8712550188c0297a08'


def primary_manifest(module):
    if module not in ('english', 'words', 'idioms'):
        raise ImportProblem('只支持现有教材单词、场景单词和成语卡片。')
    items = ContentItem.objects.filter(module__code=module, kind__in=['word', 'idiom']).order_by('source_key', 'pk')
    records, source_files = [], {}
    for item in items:
        if not item.source_key or not isinstance(item.source_payload, dict):
            raise ImportProblem(f'{item.pk} 缺少原教学资料标识，请先补全来源。')
        raw = {'content_id': str(item.pk), 'source_key': item.source_key, 'source_file': item.source_file,
               'source_hash': item.source_hash, 'source_payload': item.source_payload,
               'title': item.title, 'summary': item.summary, 'body': item.body,
               'sections': item.sections, 'import_locked': item.import_locked}
        idiom = module == 'idioms'
        headword = item.source_payload.get('idiom' if idiom else 'en')
        if not headword:
            raise ImportProblem(f'{item.pk} 的来源中没有词形。')
        value = item.source_payload.get('pinyin' if idiom else 'ipa', '')
        pron_path = '/source_payload/' + ('pinyin' if idiom else 'ipa')
        # Preserve pronunciation corrections already made in the current teaching card.
        for index, section in enumerate(item.sections):
            if section.get('title') == ('拼音' if idiom else '音标'):
                value = section['text']
                pron_path = f'/sections/{index}/text'
                break
        records.append({
            'key': item.source_key, 'language': 'zh' if idiom else 'en', 'kind': 'idiom' if idiom else ('phrase' if ' ' in headword else 'word'),
            'headword': headword, 'definition': item.summary, 'gloss_language': 'zh', 'pos': '',
            'pronunciation': {'value': value, 'system': 'pinyin' if idiom else 'ipa', 'region': ''},
            'raw': raw, 'field_paths': {'headword': '/source_payload/' + ('idiom' if idiom else 'en'), 'definition': '/summary', 'pronunciation': pron_path},
        })
        source_files.setdefault(item.source_file, set()).add(item.source_hash)
    if not records:
        raise ImportProblem(f'{module} 尚无可关联内容，请先运行 import_primary。')
    return {'schema_version': 1, 'source': {
        'code': f'primary-{module}', 'name': {'english': '现有教材英语词卡', 'words': '现有场景英语词卡', 'idioms': '现有教学成语卡'}[module],
        'attribution': 'Study / primary 原教学资料及后台人工修订。',
        'rights_evidence': '来源为现有项目教学内容；待逐项补全公开使用依据，当前仅内部整理。',
    }, 'version': 'cards-' + digest(records)[:24], 'adapter': 'primary-cards-v1',
            'source_files': {k: sorted(v) for k, v in source_files.items()}, 'records': records}


def xinhua_manifest(filename):
    data = Path(filename).read_bytes()
    if hashlib.sha256(data).hexdigest() != XINHUA_SHA256:
        raise ImportProblem('仅接受当前仓库固定的 chinese-xinhua 快照，摘要不符。')
    rows = json.loads(data)
    records = []
    for row in rows:
        records.append({
            'key': row['word'], 'language': 'zh', 'kind': 'idiom', 'headword': row['word'],
            'definition': row.get('explanation', ''), 'gloss_language': 'zh', 'pos': '',
            'pronunciation': {'value': row.get('pinyin', ''), 'system': 'pinyin', 'region': ''},
            'properties': {k: row.get(k, '') for k in ('derivation', 'example', 'abbreviation')},
            'raw': row, 'field_paths': {'headword': '/word', 'definition': '/explanation', 'pronunciation': '/pinyin',
                                      'properties.derivation': '/derivation', 'properties.example': '/example', 'properties.abbreviation': '/abbreviation'},
        })
    return {'schema_version': 1, 'source': {
        'code': 'chinese-xinhua-idioms', 'name': 'chinese-xinhua 成语（内部评估）',
        'url': 'https://github.com/pwxcoo/chinese-xinhua', 'code_license': 'MIT',
        'attribution': 'pwxcoo/chinese-xinhua；Copyright (c) 2018 PWXCOO。',
        'rights_evidence': '上游说明为网络采集；仓库代码许可不能替代第三方释义内容的使用依据。尚未核准公开展示。',
    }, 'version': XINHUA_VERSION, 'adapter': 'chinese-xinhua-v1',
            'source_files': {'idiom.json': [XINHUA_SHA256]}, 'records': records}

"""读取音标课程数据，并把例词解析到词库当前生效的教学读音。

编排与教学标注（分组、要领、拼读、中文、图标）留在 data/phonemes.json；
读音永远以词库当前生效版本为准，例词按「词头 + 音标完全一致」回查
primary-words / primary-english 两个已核对来源，解析不到的例词标记
extended 由模板降级为「拓展例词」。
"""

import json
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

from lexicon.models import active_records

SOURCE_CODE = 'primary-phonetics'
CURRICULUM_PATH = Path(__file__).parent / 'data' / 'phonemes.json'
THEORY_PATH = CURRICULUM_PATH.with_name('theory.json')
PHONEME_COUNT = 44
EXAMPLE_SOURCES = ('primary-words', 'primary-english')


def validate(curriculum):
    if curriculum.get('schema_version') != 1 or curriculum.get('source_code') != SOURCE_CODE:
        raise ImproperlyConfigured('Unsupported phonetics curriculum.')
    groups = {group['code'] for group in curriculum.get('groups', [])}
    phonemes = curriculum.get('phonemes', [])
    if len(phonemes) != PHONEME_COUNT:
        raise ImproperlyConfigured(f'音标课程需要 {PHONEME_COUNT} 个音素，当前 {len(phonemes)} 个。')
    symbols = set()
    for phoneme in phonemes:
        symbol = phoneme.get('symbol', '')
        if not (symbol.startswith('/') and symbol.endswith('/') and len(symbol) >= 3):
            raise ImproperlyConfigured(f'音标需为 /.../ 格式：{symbol}')
        if symbol in symbols:
            raise ImproperlyConfigured(f'重复音标：{symbol}')
        symbols.add(symbol)
        if phoneme.get('group') not in groups:
            raise ImproperlyConfigured(f'未知分组：{phoneme.get("group")}')
        if not phoneme.get('examples'):
            raise ImproperlyConfigured(f'{symbol} 没有例词。')
        for example in phoneme['examples']:
            ipa = example.get('ipa', '')
            if not (ipa.startswith('/') and ipa.endswith('/') and len(ipa) >= 3):
                raise ImproperlyConfigured(f'{symbol} 例词 {example.get("en")} 音标需为 /.../ 格式。')


def load_curriculum():
    with CURRICULUM_PATH.open(encoding='utf-8') as file:
        curriculum = json.load(file)
    validate(curriculum)
    return curriculum


def example_index():
    """词库已核对读音索引：(词头, 音标) -> 生效记录；一次查询复用于全部例词。"""
    records = active_records().filter(release__source__code__in=EXAMPLE_SOURCES).select_related(
        'release__source', 'binding__sense__entry', 'binding__pronunciation')
    index = {}
    for record in records:
        reading = (record.pronunciation_value or '').strip()
        if reading:
            index.setdefault((record.headword, reading), record)
    return index


def phoneme_cards(curriculum):
    """给每个例词补上解析结果：来源名与词库当前读音；解析不到标记 extended。"""
    index = example_index()
    cards = []
    for phoneme in curriculum['phonemes']:
        examples = []
        for example in phoneme['examples']:
            record = None if example.get('extended') else index.get((example['en'], example['ipa']))
            examples.append({
                **example,
                'resolved': record is not None,
                'reading': (record.pronunciation_value if record else example['ipa']),
                'source_name': record.release.source.name if record else '',
            })
        cards.append({**phoneme, 'examples': examples,
                      'key_word': next((e['en'] for e in examples if e['resolved']), examples[0]['en']),
                      'audio': f'phonetics/audio/{phoneme["id"]}.m4a'})
    return cards


def grouped_phonemes():
    """分组 → 音标卡列表；顺序与 data/phonemes.json 一致。"""
    curriculum = load_curriculum()
    cards = phoneme_cards(curriculum)
    return [
        {**group, 'phonemes': [card for card in cards if card['group'] == group['code']]}
        for group in curriculum['groups']
    ]


def pronunciation_theory(groups):
    """发音基础引用已编排的音素卡，复用原声与例词回退。"""
    with THEORY_PATH.open(encoding='utf-8') as file:
        theory = json.load(file)
    cards = {card['id']: card for group in groups for card in group['phonemes']}
    for lesson in theory['lessons']:
        try:
            lesson['sounds'] = [cards[ident] for ident in lesson['phoneme_ids']]
        except KeyError as error:
            raise ImproperlyConfigured(f'发音基础 {lesson["id"]} 引用了未知音素：{error}') from error
    return theory

"""文件编排的辨音与自测；音频、例词和理论沿用各自主出处。"""
import json
import re
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured


def load_practice():
    return json.loads((Path(__file__).parent / 'data' / 'practice.json').read_text(encoding='utf-8'))


def validate_practice(data, phonemes, lessons):
    def require(condition, message):
        if not condition:
            raise ImproperlyConfigured(f'音标练习：{message}')

    def text(value):
        return isinstance(value, str) and bool(value.strip()) and '\n' not in value and '"' not in value

    def identifiers(items):
        ids = [item.get('id', '') for item in items]
        require(all(re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', ident) for ident in ids)
                and len(set(ids)) == len(ids), '编号为空、重复或格式错误。')

    require(data.get('schema_version') == 1, '不支持的结构版本。')
    sounds = {p['id'] for p in phonemes}
    lesson_ids = {lesson['id'] for lesson in lessons}
    contrasts, questions = data.get('contrasts', []), data.get('questions', [])
    require(bool(contrasts) and bool(questions), '需要对比组和理论题。')
    identifiers(contrasts)
    identifiers(questions)
    for contrast in contrasts:
        pair = contrast.get('phoneme_ids', [])
        require(len(pair) == 2 and len(set(pair)) == 2 and set(pair) <= sounds, '对比组需要两个有效且不同的音素。')
        require(all(text(contrast.get(key)) for key in ('title', 'focus', 'practice')), '对比组缺少讲解或练习。')
    for question in questions:
        choices = question.get('choices', [])
        require(question.get('lesson_id') in lesson_ids, '理论课引用无效。')
        require(all(text(question.get(key)) for key in ('prompt', 'explanation')), '题干或解析为空。')
        require(2 <= len(choices) <= 4, '每题需要二至四个选项。')
        identifiers(choices)
        require(all(text(c.get('text')) for c in choices), '选项文字为空。')
        require(question.get('answer_id') in {c['id'] for c in choices}, '答案未指向有效选项。')
    require(bool(data.get('sources')), '需要资料出处。')
    for source in data['sources']:
        require(text(source.get('label')) and source.get('url', '').startswith('https://'), '资料出处无效。')


def practice_material(groups, theory):
    data = load_practice()
    cards = {card['id']: card for group in groups for card in group['phonemes']}
    validate_practice(data, list(cards.values()), theory['lessons'])
    questions = []
    for contrast in data['contrasts']:
        contrast['sounds'] = [cards[ident] for ident in contrast['phoneme_ids']]
        for sound in contrast['sounds']:
            questions.append({
                'id': f'listen-{contrast["id"]}-{sound["id"]}', 'kind': 'listening',
                'prompt': '先听一个音，再选出你听到的音标。',
                'choices': [{'id': p['id'], 'text': p['symbol']} for p in contrast['sounds']],
                'answer_id': sound['id'], 'audio': sound['audio'],
                'explanation': contrast['focus'], 'review': f'#contrast-{contrast["id"]}',
            })
    questions.extend({**q, 'id': f'theory-{q["id"]}', 'kind': 'theory',
                      'review': f'#theory-{q["lesson_id"]}'} for q in data['questions'])
    return {**data, 'questions': questions}

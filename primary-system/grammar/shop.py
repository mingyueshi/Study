"""从商品词形编排点单和确认，供货架、对话和练习共用。"""
import json
import re
from functools import lru_cache
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from django.shortcuts import render
from django.views.decorators.http import require_safe

DATA_PATH = Path(__file__).resolve().parents[1] / 'content_sources' / 'english-shop.json'
QUANTITIES = {
    '1': ('', '', '一'),
    '2': ('two', 'tuː', '两'),
    '3': ('three', 'θriː', '三'),
    'some': ('some', 'səm', '一些'),
}


def _require(condition, message):
    if not condition:
        raise ImproperlyConfigured(f'英语小商店数据异常：{message}')


def _has_text(record, fields):
    return isinstance(record, dict) and all(
        isinstance(record.get(field), str) and record[field].strip() for field in fields
    )


def _check_countable(item, name):
    _require(_has_text(item, ('word', 'ipa', 'plural', 'plural_ipa', 'counter'))
             and type(item.get('vowel')) is bool and item['plural'] != item['word']
             and '/' not in item['plural_ipa'] and '/' not in item['ipa'], f'{name} 缺单复数或读音')


def _line(before, prefix, phrase, after, ipa, cn):
    return {
        'before': before, 'lead': prefix, 'phrase': phrase, 'after': after,
        'en': before + ' ' + prefix + ' ' + phrase + after,
        'cn': cn, 'ipa': f'/{ipa}/',
    }


def _dialogue(product, quantity):
    unit = product.get('unit')
    measured = unit is not None and quantity != 'some'
    noun = unit if measured else product
    prefix, prefix_ipa, quantity_zh = QUANTITIES[quantity]
    plural = quantity != '1' and (unit is None or measured)
    word, ipa = (noun['plural'], noun['plural_ipa']) if plural else (noun['word'], noun['ipa'])
    vowel = noun.get('vowel', False)
    core = f'{word} of {product["word"]}' if measured else word
    core_ipa = f'{ipa} əv {product["ipa"]}' if measured else ipa

    if quantity == '1':
        prefix, prefix_ipa = ('an', 'ən') if vowel else ('a', 'ə')
    counter = (unit or product)['counter'] if quantity != 'some' else ''
    order_zh = quantity_zh + counter + product['name']
    confirm_prefix = 'the'
    confirm_ipa = 'ði' if vowel and quantity in {'1', 'some'} else 'ðə'
    if quantity in {'2', '3'}:
        confirm_prefix = f'the {prefix}'
        confirm_ipa = f'{confirm_ipa} {prefix_ipa}'

    if quantity == 'some':
        note = (f'{product["word"]} 在这里不可数。some 表示「一些」，{product["word"]} 保持原样。'
                if unit else f'some 表示「一些」。{product["word"]} 可以一个一个数，所以这里用复数 {word}。')
    elif measured:
        note = f'数的是{counter}数。{noun["word"]} 有单复数，后面的 {product["word"]} 保持原样。'
    elif quantity == '1':
        sound = '元音' if vowel else '辅音'
        note = f'要{order_zh}，先听 {word} 的开头。第一个音是{sound}，所以用 {prefix}。'
    else:
        note = f'数量超过一，直接用数量加复数 {word}。'

    return {
        'quantity': quantity,
        'label': quantity_zh + counter,
        'note': note,
        'customer': _line('Can I have', prefix, core, ', please?', f'{prefix_ipa} {core_ipa}',
                          f'请给我{order_zh}，好吗？'),
        'clerk': _line("Sure. I'll get", confirm_prefix, core, ' for you.', f'{confirm_ipa} {core_ipa}',
                       f'好的，我这就给你拿刚才说的{order_zh}。'),
    }


def prepare_shop(data):
    products = data.get('products')
    _require(isinstance(products, list) and len(products) > 1 and all(
        _has_text(p, ('id', 'name', 'word', 'ipa')) and '/' not in p['ipa']
        and re.fullmatch(r'[a-z][a-z0-9-]*', p['id'])
        and isinstance(p.get('photo'), list) and len(p['photo']) == 2
        and all(type(position) is int for position in p['photo'])
        and 0 <= p['photo'][0] < 4 and 0 <= p['photo'][1] < 2 for p in products
    ), '缺少商品、音标或商品图位置')
    _require(len({p['id'] for p in products}) == len(products)
             and len({tuple(p['photo']) for p in products}) == len(products), '商品 ID 或图片位置重复')
    prepared = {}
    for product in products:
        unit = product.get('unit')
        if 'unit' in product:
            _check_countable(unit, product['id'] + '的计量单位')
            _require(not {'plural', 'plural_ipa', 'vowel', 'counter'} & product.keys(),
                     f'{product["id"]} 不应给不可数商品配置复数')
        else:
            _check_countable(product, product['id'])
        prepared[product['id']] = {
            **product,
            'type_label': '不可数名词' if unit else '可数名词',
            'dialogues': {quantity: _dialogue(product, quantity) for quantity in QUANTITIES},
        }

    sources = data.get('sources')
    _require(isinstance(sources, list) and sources and all(
        _has_text(source, ('label', 'url')) and source['url'].startswith('https://') for source in sources
    ), '参考资料链接无效')
    questions = data.get('quiz')
    _require(isinstance(questions, list) and questions and all(
        _has_text(q, ('product', 'quantity', 'line', 'cue', 'why')) and q['product'] in prepared
        and q['quantity'] in QUANTITIES and q['line'] in {'customer', 'clerk'} for q in questions
    ), '练习引用了无效的商品或对话')
    quiz = []
    for question in questions:
        line = prepared[question['product']]['dialogues'][question['quantity']][question['line']]
        answer = line['lead'] + ' ' + line['phrase']
        options = question.get('options')
        _require(isinstance(options, list) and len(options) >= 2 and options.count(None) == 1
                 and all(option is None or (isinstance(option, str) and option.strip()) for option in options)
                 and len(set(options)) == len(options) and answer not in options, '练习选项无效')
        quiz.append({**question, **line, 'answer': answer,
                     'options': [answer if option is None else option for option in options]})
    return {'products': prepared, 'quiz': quiz, 'sources': sources}


@lru_cache(maxsize=1)
def load_shop():
    with DATA_PATH.open(encoding='utf-8') as file:
        return prepare_shop(json.load(file))


@require_safe
def index(request):
    data = load_shop()
    products = data['products']
    product = products.get(request.GET.get('product'), next(iter(products.values())))
    quantity = request.GET.get('quantity')
    if quantity not in QUANTITIES:
        quantity = '1'
    return render(request, 'english_shop/index.html', {
        **data,
        'product': product,
        'quantity': quantity,
        'round': product['dialogues'][quantity],
        'shelves': [
            ('一个一个数', [item for item in products.values() if 'unit' not in item]),
            ('说一些，或借单位来数', [item for item in products.values() if 'unit' in item]),
        ],
        'study_area': 'english',
    })

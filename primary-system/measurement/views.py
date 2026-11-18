from fractions import Fraction

from django.http import Http404
from django.shortcuts import render
from django.views.decorators.http import require_safe

from .calculations import comparison, convert, display, parse_amount
from .content import load_data

INPUT_ERROR = '请输入非负数，整数部分最多 8 位，小数部分最多 6 位。'


def page_context():
    return {'data': load_data(), 'study_area': 'math'}


def display_value(value, places=18):
    number, exact = display(value, places)
    return {'number': number, 'exact': exact, 'fraction': str(value) if not exact else ''}


def factor_expression(source, target):
    ratio = Fraction(source['factor'], target['factor'])
    if ratio.denominator == 1:
        return f'× {ratio.numerator:,}'
    if ratio.numerator == 1:
        return f'÷ {ratio.denominator:,}'
    return f'× {ratio.numerator:,} ÷ {ratio.denominator:,}'


def unit_rows(units):
    rows = [dict(units[0])]
    for previous, unit in zip(units, units[1:]):
        multiple, exact = display(convert(1, unit, previous))
        sign = '＝' if exact else '≈'
        rows.append(dict(unit, relation=f"1 {unit['symbol']} {sign} {multiple} {previous['symbol']}"))
    return rows


@require_safe
def index(request):
    return render(request, 'measurement/index.html', page_context())


@require_safe
def dimension(request, topic_id):
    ctx = page_context()
    topic = next((topic for topic in ctx['data']['dimensions'] if topic['id'] == topic_id), None)
    if topic is None:
        raise Http404('没有找到这种单位。')
    units = {unit['id']: unit for unit in topic['units']}
    example = topic['example']
    sample = dict(example, source=units[example['from']], target=units[example['to']])
    submitted = any(key in request.GET for key in ('amount', 'from', 'to', 'op'))
    raw = request.GET.get('amount', '' if submitted else example['amount'])
    source_id = request.GET.get('from', '' if submitted else example['from'])
    target_id = request.GET.get('to', '' if submitted else example['to'])
    errors = []
    if source_id not in units or target_id not in units:
        errors.append('请选择本站的两个单位。同类量才能相互换算。')
    if request.GET.get('op') == 'swap':
        source_id, target_id = target_id, source_id
    source, target = units.get(source_id, sample['source']), units.get(target_id, sample['target'])
    amount = parse_amount(raw)
    if amount is None:
        errors.append(INPUT_ERROR)
    result = None if errors else {
        'input': display(amount)[0],
        'value': display_value(convert(amount, source, target)),
        'factor': factor_expression(source, target),
    }
    ctx.update(topic=topic, sample=sample, source=source, target=target, raw=raw[:32],
               result=result, errors=errors, unit_rows=unit_rows(topic['units']))
    return render(request, 'measurement/dimension.html', ctx)


@require_safe
def estimates(request):
    ctx = page_context()
    units = {(dimension['id'], unit['id']): unit
             for dimension in ctx['data']['dimensions'] for unit in dimension['units']}
    cases = [dict(case, measure=units[case['dimension'], case['unit']]) for case in ctx['data']['estimates']]
    code = request.GET.get('case')
    active = next((case for case in cases if case['id'] == code), None)
    error = ''
    if active is not None:
        raw = request.GET.get('guess', '')
        guess = parse_amount(raw)
        active['raw'] = raw[:32]
        if guess is None:
            active['error'] = INPUT_ERROR
        else:
            reference = parse_amount(active['reference'])
            gap, percent, direction = comparison(guess, reference)
            active['feedback'] = {
                'guess': display(guess)[0], 'gap': display(gap)[0],
                'percent': display_value(percent, 1), 'small_percent': 0 < percent < Fraction(1, 10),
                'direction': direction,
                'inside': parse_amount(active['lower']) <= guess <= parse_amount(active['upper']),
            }
    elif code is not None:
        error = '请选择下方的一项生活估算来比较。'
    ctx.update(cases=cases, estimate_error=error)
    return render(request, 'measurement/estimates.html', ctx)

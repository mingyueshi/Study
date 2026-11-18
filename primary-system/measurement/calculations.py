"""Convert nonnegative quantities exactly, rounding only for display."""
from decimal import Decimal, localcontext
from fractions import Fraction
import re
from unicodedata import normalize


def parse_amount(value):
    if not isinstance(value, str) or len(value) > 32:
        return None
    value = normalize('NFKC', value).strip()
    if not re.fullmatch(r'(?:[0-9]{1,8}(?:\.[0-9]{1,6})?|\.[0-9]{1,6})', value):
        return None
    return Fraction(value)


def display(value, places=18):
    value = Fraction(value)
    with localcontext() as context:
        context.prec = 64
        decimal = Decimal(value.numerator) / Decimal(value.denominator)
        rounded = round(decimal, places)
    if rounded == 0 and value != 0:
        return f'{"−" if value < 0 else ""}{abs(decimal):.6E}', False
    formatted = format(rounded, 'f')
    if '.' in formatted:
        formatted = formatted.rstrip('0').rstrip('.')
    return formatted, Fraction(rounded) == value


def convert(amount, source, target):
    return amount * Fraction(source['factor'], target['factor'])


def comparison(amount, reference):
    delta = amount - reference
    return abs(delta), abs(delta / reference) * 100, (delta > 0) - (delta < 0)

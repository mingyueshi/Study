import re
from django.db.models import Case, IntegerField, Q, Value, When
from django.db.models.functions import Trim
from .models import LexicalEntry, active_records, pinyin_key, search_key


def public_records():
    return active_records(public=True).annotate(
        clean_definition=Trim('definition'), clean_editorial=Trim('binding__sense__editorial_definition'),
    ).filter(
        Q(binding__sense__entry__kind='character') |
        ~(Q(clean_definition__in=['', '无']) & Q(clean_editorial__in=['', '无']))
    ).select_related('release__source', 'binding__sense__entry', 'binding__pronunciation')


def query_text(text):
    text = text.strip()
    if re.fullmatch(r'[Uu]\+[0-9A-Fa-f]{4,6}', text):
        code = int(text[2:], 16)
        if 0x20 <= code <= 0x10ffff and not 0x7f <= code <= 0x9f and not 0xd800 <= code <= 0xdfff:
            return chr(code)
    return text


def matching_entries(q='', language='', kind=''):
    text = query_text(q)
    normalized = search_key(text)
    records = public_records()
    if text:
        records = records.filter(Q(forms__lookup_key__startswith=normalized) |
                                 Q(binding__pronunciation__is_reviewed=True, pronunciation_key__startswith=normalized) |
                                 Q(binding__pronunciation__is_reviewed=True, binding__pronunciation__system='pinyin', pronunciation_key__startswith=pinyin_key(text)))
    items = LexicalEntry.objects.filter(senses__bindings__records__in=records)
    if language:
        items = items.filter(language=language)
    if kind:
        items = items.filter(kind=kind)
    return items.annotate(exact_rank=Case(When(lookup_key=normalized, then=Value(0)), default=Value(1), output_field=IntegerField())).distinct().order_by('exact_rank', 'headword', 'id')


def record_order(record):
    """Respect an explicit upstream sense order; never sort meaning by random UUID."""
    source = record.release.source
    entry = record.raw.get('source_entry', {})
    order = 0
    if isinstance(entry, dict):
        keys = [node.get('attributes', {}).get('id') for node in entry.get('children', [])
                if isinstance(node, dict) and node.get('tag') == 'Sense']
        if record.binding.external_key in keys:
            order = keys.index(record.binding.external_key)
    return (source.priority, source.code, order, record.binding.external_key)

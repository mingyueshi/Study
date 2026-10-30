import re
from django.db.models import Case, IntegerField, Q, Value, When
from django.db.models.functions import Trim
from .models import LexicalEntry, LexiconSource, active_records, pinyin_key, search_key


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


def public_sources_healthy():
    """任一公开来源被禁用或失去生效版本时返回 False，浏览全集必须退回逐记录校验。"""
    return not LexiconSource.objects.filter(public_allowed=True).exclude(
        enabled=True, active_release__status='ready').exists()


def matching_entries(q='', language='', kind=''):
    text = query_text(q)
    normalized = search_key(text)
    if not text:
        # 浏览全集：审核状态是发布操作的直接结果，无需逐记录 join；
        # 但来源被禁用或回退时不改状态，必须退回精确路径保证撤回立即生效。
        if public_sources_healthy():
            items = LexicalEntry.objects.filter(status='published', senses__status='published').distinct()
        else:
            items = LexicalEntry.objects.filter(pk__in=active_records(public=True).values('binding__sense__entry_id'))
    else:
        # 三个检索分支分别走各自的索引前缀，再在 Python 侧并集：
        # 跨 join 的 OR（词形 join OR 读音 join）会让 SQLite 放弃索引、
        # 扫描全部来源记录，数据量大后无法接受。
        branches = [
            public_records().filter(forms__lookup_key__startswith=normalized),
            public_records().filter(binding__pronunciation__is_reviewed=True, pronunciation_key__startswith=normalized),
        ]
        pinyin = pinyin_key(text)
        if pinyin != normalized:
            branches.append(public_records().filter(
                binding__pronunciation__is_reviewed=True, binding__pronunciation__system='pinyin',
                pronunciation_key__startswith=pinyin))
        entry_ids = set()
        for branch in branches:
            entry_ids.update(branch.values_list('binding__sense__entry_id', flat=True))
        # 两阶段查询：主键物化为字面量列表，避免 SQLite 把 IN 子查询去关联展开回多表 join。
        items = LexicalEntry.objects.filter(pk__in=entry_ids)
    if language:
        items = items.filter(language=language)
    if kind:
        items = items.filter(kind=kind)
    return items.annotate(exact_rank=Case(When(lookup_key=normalized, then=Value(0)), default=Value(1), output_field=IntegerField())).order_by('exact_rank', 'headword', 'id')


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

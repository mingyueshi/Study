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
    if not text:
        # 浏览与搜索、详情共用展示条件；词条审核状态不能代替来源当前版本。
        items = LexicalEntry.objects.filter(
            pk__in=public_records().order_by().values('binding__sense__entry_id'))
    else:
        # 三个检索分支分别走各自的索引前缀，再在 Python 侧并集：
        # 跨 join 的 OR（词形 join OR 读音 join）会让 SQLite 放弃索引、
        # 扫描全部来源记录，数据量大后无法接受。
        branches = [
            public_records().filter(forms__lookup_key__startswith=normalized),
            public_records().filter(binding__pronunciation__is_reviewed=True, pronunciation_key__startswith=normalized),
        ]
        # 无空格紧缩键同时覆盖分写（'a bi di yu'→'abidiyu'）与连写（'abidiyu'）两种输入，
        # 恒定尝试：英文输入在此分支自然空匹配，无副作用。
        compact = pinyin_key(text).replace(' ', '')
        if compact:
            branches.append(public_records().filter(
                binding__pronunciation__is_reviewed=True, binding__pronunciation__system='pinyin',
                pronunciation_key_compact__startswith=compact))
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

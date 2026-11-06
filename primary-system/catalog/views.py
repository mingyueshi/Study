import re

from django.core.paginator import Paginator
from django.db.models import Q, Count
from django.http import Http404, JsonResponse
from django.shortcuts import render, get_object_or_404, reverse
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET
from .forms import CatalogFilter
from .entry_registry import entry_for, special_entries
from lexicon.chinese import safe_word_item, safe_search, request_resolver, LessonResolver
from .models import ENGLISH_RELATION_TAGS, Grade, Module, Placement, Subject, TextbookEdition, TextbookBook, \
    ContentItem, published_items, published_textbook_books, published_units


def published_books():
    """已发布教材同步册（鸭子接口：code/name/kind/subject/subtitle）。"""
    books = list(published_textbook_books().select_related('module__subject', 'textbook__grade', 'textbook__edition'))
    books.sort(key=lambda b: (b.order, b.name))
    return books


def filter_books(request):
    """目录筛选（Python 侧按对象属性过滤；册数量级小，清晰优先）。"""
    params = request.GET.copy()
    if 'grade' not in params and request.user.is_authenticated and request.user.grade_id:
        params['grade'] = request.user.grade.code
    form = CatalogFilter(params)
    books = published_books()
    if not form.is_valid():
        return form, []
    grade, subject, edition, q = (form.cleaned_data[k] for k in ('grade', 'subject', 'edition', 'q'))
    if grade:
        books = [b for b in books if b.textbook.grade_id == grade.pk]
    if subject:
        books = [b for b in books if b.subject.code == subject.code]
    if edition:
        books = [b for b in books if b.textbook.edition_id == edition.pk]
    if q:
        matching = safe_search(published_items(), q, request_resolver(request))
        matched_units = set(published_units().filter(placements__item__in=matching).values_list('pk', flat=True))
        books = [b for b in books if q.lower() in b.name.lower()
                 or matched_units & set(b.units.values_list('pk', flat=True))]
    return form, books


def units_of_books(books):
    """筛选后册集合覆盖的单元查询集。"""
    return published_units().filter(textbook_book__in=[b.pk for b in books])


def _entry_cards(request, modules, counts):
    """首页入口卡装配：模块卡与专题卡（entry_registry.special_entries）同形，
    模板一个循环渲染；新增玩法只改注册表，不动模板。"""
    params = request.GET.copy()
    params.pop('area', None)  # 专题筛选不跟着进模块页链接
    query = ('?' + params.urlencode()) if params else ''
    cards = []
    for module in modules:
        entry = entry_for(module.code)
        url = reverse(entry['route_name']) if entry else reverse('module', args=[module.code])
        if not entry and query:
            # 普通模块页延续当前筛选（原模板 {% querystring %} 的行为）。
            url += query
        count = counts.get(module.pk, 0)
        cards.append({
            'url': url, 'icon': module.icon, 'color_code': module.subject.code,
            'subject_label': module.subject.name, 'area': module.subject.code,
            'name': module.name, 'blurb': module.description,
            'badge': f'{count} 本学习册' if count else (entry['tag'] if entry else '暂无匹配学习册'),
        })
    cards.extend(special_entries())
    return cards


def _area_url(request, area):
    """单选筛选的切换链接：替换 area 参数，保留书架的其他筛选。"""
    params = request.GET.copy()
    if area:
        params['area'] = area
    else:
        params.pop('area', None)
    return ('?' + params.urlencode()) if params else reverse('home')


def _area_chips(request, cards, selected):
    """单选筛选 chips：全部 + 按卡片出现顺序的分组计数。"""
    chips = [{'area': '', 'label': '全部', 'count': len(cards),
              'url': _area_url(request, ''), 'on': not selected}]
    seen = {}
    for card in cards:
        key = card['area']
        if key not in seen:
            seen[key] = {'area': key, 'label': card['subject_label'], 'count': 0,
                         'url': _area_url(request, key), 'on': key == selected}
            chips.append(seen[key])
        seen[key]['count'] += 1
    return chips


@never_cache
@require_GET
def home(request):
    form, books = filter_books(request)
    modules = list(Module.objects.filter(is_active=True).select_related('subject'))
    counts = {}
    for book in books:
        counts[book.module_id] = counts.get(book.module_id, 0) + 1
    all_cards = _entry_cards(request, modules, counts)
    area = request.GET.get('area', '')
    selected = area if area in {card['area'] for card in all_cards} else ''
    textbook_shelf = books
    digest = None
    if request.user.is_authenticated:
        from .learning_digest import learning_digest
        digest = learning_digest(request.user)
    return render(request, 'catalog/home.html', {
        'form': form,
        'entry_cards': [card for card in all_cards if not selected or card['area'] == selected],
        'entry_total': len(all_cards),
        'area_chips': _area_chips(request, all_cards, selected),
        'digest': digest,
        'textbook_shelf': textbook_shelf,
        'item_count': published_items().filter(placements__unit__in=units_of_books(books)).count(),
    }, status=200 if form.is_valid() else 400)


@never_cache
@require_GET
def module_detail(request, code):
    module = get_object_or_404(Module, code=code, is_active=True)
    module.entry = entry_for(module.code)
    form, books = filter_books(request)
    return render(request, 'catalog/module.html', {
        'module': module, 'form': form,
        'collections': [b for b in books if b.module_id == module.pk],
    }, status=200 if form.is_valid() else 400)


# 教材单元词卡按单元顺序取一组明快底色，跨册循环使用。
UNIT_CARD_COLORS = ('#4d96ff', '#9b5de5', '#00a8a8', '#f15bb5', '#fee440', '#43aa8b')

# 学习目录单元卡图标：取自教材原型数据（primary/english-data.js），新册补录。
ENGLISH_UNIT_EMOJI = {
    '4a-u1': '⚽', '4a-u2': '🏠', '4a-u3': '🌦️', '4a-u4': '🍂', '4a-u5': '🚌', '4a-u6': '🗺️',
    '4b-u1': '👩‍⚕️', '4b-u2': '😊', '4b-u3': '🌟', '4b-u4': '🌻', '4b-u5': '🎨', '4b-u6': '👕',
}


def english_link_pronunciations(placements):
    """关联词读音索引：词头 -> 已核对 IPA（来自 primary-english/primary-words 生效记录）。

    关联词芯片的音标与词卡本体同源——运行时批量查词库，缺失的如实留空，
    不用数据里缓存的历史音标冒充。
    """
    headwords = set()
    for placement in placements:
        raw = placement.item.source_payload if isinstance(placement.item.source_payload, dict) else {}
        for link in raw.get('links') or []:
            if isinstance(link, dict) and str(link.get('en') or '').strip():
                headwords.add(link['en'].strip())
    index = {}
    if not headwords:
        return index
    from lexicon.models import active_records
    rows = active_records().filter(
        release__source__code__in=('primary-english', 'primary-words'),
        headword__in=headwords,
    ).select_related('binding__pronunciation')
    for record in rows:
        pron = record.binding.pronunciation
        if pron is None or not pron.is_reviewed:
            continue
        reading = (pron.editorial_value or record.pronunciation_value or '').strip()
        if reading:
            index.setdefault(record.headword, reading)
    return index


def attach_english_link_chips(placements):
    """解析教材英语词的关联词（相反/相近/同根/组词/同类），点击即发音。"""
    pronunciations = english_link_pronunciations(placements)
    for placement in placements:
        raw = placement.item.source_payload if isinstance(placement.item.source_payload, dict) else {}
        links = raw.get('links') if isinstance(raw.get('links'), list) else []
        chips = []
        for link in links:
            if not isinstance(link, dict) or not str(link.get('en') or '').strip():
                continue
            chips.append({
                'type': link.get('type') if link.get('type') in ENGLISH_RELATION_TAGS else 'group',
                'tag': ENGLISH_RELATION_TAGS.get(link.get('type'), ENGLISH_RELATION_TAGS['group']),
                'en': link['en'], 'zh': link.get('zh') or '',
                'ipa': pronunciations.get(link['en'].strip(), ''),
            })
        placement.link_chips = chips
    return placements


@never_cache
@require_GET
def collection_detail(request, code):
    book = published_textbook_books().filter(code=code).select_related(
        'module', 'textbook__grade', 'textbook__edition').first()
    if not book:
        raise Http404('学习册不存在或未发布。')
    units = list(book.units.annotate(word_count=Count('placements', filter=Q(placements__item__status='published'))))
    unit_code = request.GET.get('unit')
    # 模板里的单元与选中单元共用同一批实例（英语分支要在单元对象上挂词卡底色）。
    for index, unit in enumerate(units):
        unit.color = UNIT_CARD_COLORS[index % len(UNIT_CARD_COLORS)]
        if book.module_id and book.module.code == 'english':
            unit.emoji = ENGLISH_UNIT_EMOJI.get(unit.code, '📖')
            match = re.search(r'Unit\s*(\d+)', unit.title)
            unit.unit_no = match.group(1) if match else str(index + 1)
    selected_unit = next((u for u in units if u.code == unit_code), None) if unit_code else (units[0] if units else None)
    if unit_code and selected_unit is None:
        raise Http404('单元不存在。')
    placements = selected_unit.placements.select_related('item').filter(item__status='published', item__module=book.module) if selected_unit else []
    is_english = book.module.code == 'english'
    tab = request.GET.get('tab', '')
    dialogue_items = []
    if is_english:
        # 英语教材同步 = 单词 + 课文两个视图；课文段按编排顺序整段呈现。
        tab = tab if tab in ('words', 'texts') else 'words'
        dialogue_items = [p.item for p in
                          selected_unit.placements.select_related('item').filter(
                              item__status='published', item__module=book.module, item__kind='dialogue')
                          ] if selected_unit else []
    # 英语单元整页呈现词卡（最大单元 40 词），一屏可连读；其余模块保持 30 条分页。
    page = Paginator(placements, 60 if is_english else 30).get_page(request.GET.get('page'))
    resolver = LessonResolver([p.item for p in page])
    for placement in page:
        safe_word_item(placement.item, resolver)
    if is_english:
        attach_english_link_chips(list(page))
    return render(request, 'catalog/collection.html', {
        'book': book, 'units': units, 'selected_unit': selected_unit, 'page': page,
        'is_english': is_english, 'tab': tab, 'dialogue_items': dialogue_items,
    })


@never_cache
@require_GET
def catalog_api(request):
    form, books = filter_books(request)
    if not form.is_valid():
        return JsonResponse({'errors': form.errors.get_json_data()}, status=400)
    page = Paginator(books, 30).get_page(request.GET.get('page'))
    return JsonResponse({
        'schema_version': 1,
        'grades': list(Grade.objects.values('code', 'name', 'stage__code')),
        'subjects': list(Subject.objects.values('code', 'name')),
        'editions': list(TextbookEdition.objects.values('code', 'name', 'subject__code', 'publisher', 'version')),
        'modules': list(Module.objects.filter(is_active=True).values('code', 'name', 'subject__code', 'interactive_ready')),
        'collections': [{'code': b.code, 'name': b.name, 'module': b.module.code, 'kind': b.kind,
                         'textbook': b.textbook.code} for b in page],
        'page': page.number, 'pages': page.paginator.num_pages, 'total': page.paginator.count,
    })


@never_cache
@require_GET
def items_api(request):
    form, books = filter_books(request)
    if not form.is_valid():
        return JsonResponse({'errors': form.errors.get_json_data()}, status=400)
    items = published_items().filter(placements__unit__in=units_of_books(books)).select_related('module')
    code = request.GET.get('collection')
    if code:
        book = next((b for b in books if b.code == code), None)
        if not book:
            return JsonResponse({'results': [], 'page': 1, 'pages': 0, 'total': 0})
        items = items.filter(placements__unit__in=book.units.all())
    q = form.cleaned_data['q']
    if q:
        items = safe_search(items, q, request_resolver(request))
    page = Paginator(items.distinct(), 30).get_page(request.GET.get('page'))
    resolver = request_resolver(request) if q else LessonResolver(list(page))
    return JsonResponse({'results': [{'id': str(i.pk), 'title': i.title, 'summary': i.summary, 'kind': i.kind, 'module': i.module.code} for i in [safe_word_item(x, resolver) for x in page]],
                         'page': page.number, 'pages': page.paginator.num_pages, 'total': page.paginator.count})


@never_cache
@require_GET
def item_api(request, pk):
    item = get_object_or_404(published_items().select_related('module'), pk=pk)
    resolver = LessonResolver([item])
    safe_word_item(item, resolver)
    references = [resolver.payloads[l.pk] for l in resolver.by_content.get(item.pk, [])]
    return JsonResponse({'lexical_references': references, 'lexicon_schema_version': 2, 'word_selections': getattr(item, 'word_selections', []), 'word_selection': getattr(item, 'word_selection', None), 'id': str(item.pk), 'title': item.title, 'summary': item.summary, 'body': item.body,
                         'sections': item.sections, 'kind': item.kind, 'module': item.module.code, 'schema_version': item.schema_version})

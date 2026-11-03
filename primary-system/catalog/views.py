from django.core.paginator import Paginator
from django.db.models import Q, Count
from django.http import Http404, JsonResponse
from django.shortcuts import render, get_object_or_404, reverse
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET
from .forms import CatalogFilter
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


# 玩法模块的入口是各自应用的页面；首页卡片一次直达（不经过目录中转页）。
GAME_ROUTES = {'chain': 'chain', 'words': 'scenario-words', 'phonetics': 'phonetics', 'writing': 'writing'}


@never_cache
@require_GET
def home(request):
    form, books = filter_books(request)
    modules = list(Module.objects.filter(is_active=True).select_related('subject'))
    counts = {}
    for book in books:
        counts[book.module_id] = counts.get(book.module_id, 0) + 1
    for module in modules:
        module.available_count = counts.get(module.pk, 0)
        route = GAME_ROUTES.get(module.code)
        module.entry_url = reverse(route) if route else reverse('module', args=[module.code])
    textbook_shelf = books
    progress = None
    if request.user.is_authenticated:
        from learning.models import Progress
        from learning.services import effective_status
        rows = list(Progress.objects.filter(user=request.user, item__in=published_items()).select_related('item'))
        resolver = LessonResolver([p.item for p in rows])
        progress = {'started': sum(p.status != 'new' for p in rows),
                    'mastered': sum(effective_status(p, resolver) == 'mastered' for p in rows),
                    'bookmarked': sum(p.bookmarked for p in rows)}
    return render(request, 'catalog/home.html', {
        'form': form, 'modules': modules, 'progress': progress,
        'textbook_shelf': textbook_shelf,
        'item_count': published_items().filter(placements__unit__in=units_of_books(books)).count(),
    }, status=200 if form.is_valid() else 400)


@never_cache
@require_GET
def module_detail(request, code):
    module = get_object_or_404(Module, code=code, is_active=True)
    form, books = filter_books(request)
    return render(request, 'catalog/module.html', {
        'module': module, 'form': form,
        'collections': [b for b in books if b.module_id == module.pk],
    }, status=200 if form.is_valid() else 400)


# 教材单元词卡按单元顺序取一组明快底色，跨册循环使用。
UNIT_CARD_COLORS = ('#4d96ff', '#9b5de5', '#00a8a8', '#f15bb5', '#fee440', '#43aa8b')


def attach_english_link_chips(placements):
    """解析教材英语词的关联词（相反/相近/同根/组词/同类），点击即发音。"""
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
    selected_unit = next((u for u in units if u.code == unit_code), None) if unit_code else (units[0] if units else None)
    if unit_code and selected_unit is None:
        raise Http404('单元不存在。')
    placements = selected_unit.placements.select_related('item').filter(item__status='published', item__module=book.module) if selected_unit else []
    is_english = book.module.code == 'english'
    # 英语单元整页呈现词卡（最大单元 40 词），一屏可连读；其余模块保持 30 条分页。
    page = Paginator(placements, 60 if is_english else 30).get_page(request.GET.get('page'))
    resolver = LessonResolver([p.item for p in page])
    for placement in page:
        safe_word_item(placement.item, resolver)
    if is_english:
        attach_english_link_chips(list(page))
    return render(request, 'catalog/collection.html', {
        'book': book, 'units': units, 'selected_unit': selected_unit, 'page': page,
        'is_english': is_english,
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

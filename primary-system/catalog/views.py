from django.core.paginator import Paginator
from django.db.models import Q, Count
from django.http import Http404, JsonResponse
from django.shortcuts import render, get_object_or_404
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET
from .forms import CatalogFilter
from .models import Grade, Module, Subject, TextbookEdition, TextbookBook, ContentItem, published_items, \
    published_textbook_books, published_topic_books, published_units


def published_books(kind=None):
    """两种学习册的合并视图（鸭子接口：code/name/kind/subject/subtitle）。"""
    books = list(published_textbook_books().select_related('module__subject', 'textbook__grade', 'textbook__edition'))
    books += list(published_topic_books().select_related('module__subject'))
    books.sort(key=lambda b: (b.order, b.name))
    if kind in ('textbook', 'topic'):
        books = [b for b in books if b.kind == kind]
    return books


def filter_books(request, *, kind=None):
    """目录筛选（Python 侧按对象属性过滤；册数量级小，清晰优先）。"""
    params = request.GET.copy()
    if 'grade' not in params and request.user.is_authenticated and request.user.grade_id:
        params['grade'] = request.user.grade.code
    form = CatalogFilter(params)
    books = published_books(kind=kind)
    if not form.is_valid():
        return form, []
    grade, subject, edition, q = (form.cleaned_data[k] for k in ('grade', 'subject', 'edition', 'q'))
    if grade:
        matched = []
        for book in books:
            if book.kind == 'textbook':
                keep = book.textbook.grade_id == grade.pk
            else:
                grades = list(book.grades.all())
                keep = not grades or grade in grades
            if keep:
                matched.append(book)
        books = matched
    if subject:
        books = [b for b in books if b.subject.code == subject.code]
    if edition:
        books = [b for b in books if b.kind == 'textbook' and b.textbook.edition_id == edition.pk]
    if q:
        matching = published_items().filter(Q(title__icontains=q) | Q(summary__icontains=q) | Q(body__icontains=q))
        matched_units = set(published_units().filter(placements__item__in=matching).values_list('pk', flat=True))
        books = [b for b in books if q.lower() in b.name.lower()
                 or matched_units & set(b.units.values_list('pk', flat=True))]
    return form, books


def units_of_books(books):
    """筛选后册集合覆盖的单元查询集。"""
    textbook_ids = [b.pk for b in books if b.kind == 'textbook']
    topic_ids = [b.pk for b in books if b.kind == 'topic']
    return published_units().filter(
        Q(textbook_book_id__in=textbook_ids) | Q(topic_book_id__in=topic_ids))


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
    # 学习册按语义分区：教材同步（跟课本走）与主题探索（自由专题）分别成架。
    textbook_shelf = [b for b in books if b.kind == 'textbook']
    topic_shelf = [b for b in books if b.kind == 'topic']
    progress = None
    if request.user.is_authenticated:
        from learning.models import Progress
        progress = Progress.objects.filter(user=request.user, item__in=published_items()).aggregate(
            started=Count('pk', filter=~Q(status='new')), mastered=Count('pk', filter=Q(status='mastered')),
            bookmarked=Count('pk', filter=Q(bookmarked=True)),
        )
    return render(request, 'catalog/home.html', {
        'form': form, 'modules': modules, 'progress': progress,
        'textbook_shelf': textbook_shelf, 'topic_shelf': topic_shelf,
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


@never_cache
@require_GET
def collection_detail(request, code):
    book = (published_textbook_books().filter(code=code).first()
            or published_topic_books().filter(code=code).first())
    if not book:
        raise Http404('学习册不存在或未发布。')
    units = book.units.all()
    unit_code = request.GET.get('unit')
    selected_unit = get_object_or_404(units, code=unit_code) if unit_code else units.first()
    placements = selected_unit.placements.select_related('item').filter(item__status='published', item__module=book.module) if selected_unit else []
    page = Paginator(placements, 30).get_page(request.GET.get('page'))
    return render(request, 'catalog/collection.html', {'book': book, 'units': units, 'selected_unit': selected_unit, 'page': page})


@never_cache
@require_GET
def catalog_api(request):
    kind = request.GET.get('kind', '').strip()
    if kind not in ('', 'textbook', 'topic'):
        return JsonResponse({'errors': {'kind': ['kind 仅支持 textbook 或 topic。']}}, status=400)
    form, books = filter_books(request, kind=kind)
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
                         'textbook': b.textbook.code if b.kind == 'textbook' else None} for b in page],
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
        items = items.filter(Q(title__icontains=q) | Q(summary__icontains=q) | Q(body__icontains=q))
    page = Paginator(items.distinct(), 30).get_page(request.GET.get('page'))
    return JsonResponse({'results': [{'id': str(i.pk), 'title': i.title, 'summary': i.summary, 'kind': i.kind, 'module': i.module.code} for i in page],
                         'page': page.number, 'pages': page.paginator.num_pages, 'total': page.paginator.count})


@never_cache
@require_GET
def item_api(request, pk):
    item = get_object_or_404(published_items().select_related('module'), pk=pk)
    return JsonResponse({'id': str(item.pk), 'title': item.title, 'summary': item.summary, 'body': item.body,
                         'sections': item.sections, 'kind': item.kind, 'module': item.module.code, 'schema_version': item.schema_version})

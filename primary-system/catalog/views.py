from django.core.paginator import Paginator
from django.db.models import Q, Count
from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET
from .forms import CatalogFilter
from .models import Grade, Module, Subject, TextbookEdition, ContentItem, published_collections, published_items


def filter_catalog(request):
    params = request.GET.copy()
    if 'grade' not in params and request.user.is_authenticated and request.user.grade_id:
        params['grade'] = request.user.grade.code
    form = CatalogFilter(params)
    collections = published_collections().select_related('module__subject', 'textbook__edition', 'textbook__grade')
    if not form.is_valid():
        return form, collections.none()
    grade, subject, edition, q = (form.cleaned_data[k] for k in ('grade', 'subject', 'edition', 'q'))
    if grade:
        collections = collections.filter(Q(textbook__grade=grade) | Q(textbook__isnull=True, grades=grade) | Q(textbook__isnull=True, grades__isnull=True))
    if subject:
        collections = collections.filter(module__subject=subject)
    if edition:
        collections = collections.filter(textbook__edition=edition)
    if q:
        matching = published_items().filter(Q(title__icontains=q) | Q(summary__icontains=q) | Q(body__icontains=q))
        collections = collections.filter(Q(name__icontains=q) | Q(units__placements__item__in=matching))
    return form, collections.distinct()


@never_cache
@require_GET
def home(request):
    form, collections = filter_catalog(request)
    modules = list(Module.objects.filter(is_active=True).select_related('subject'))
    counts = dict(collections.order_by().values('module_id').annotate(total=Count('pk', distinct=True)).values_list('module_id', 'total'))
    for module in modules:
        module.available_count = counts.get(module.pk, 0)
    progress = None
    if request.user.is_authenticated:
        from learning.models import Progress
        progress = Progress.objects.filter(user=request.user, item__in=published_items()).aggregate(
            started=Count('pk', filter=~Q(status='new')), mastered=Count('pk', filter=Q(status='mastered')),
            bookmarked=Count('pk', filter=Q(bookmarked=True)),
        )
    return render(request, 'catalog/home.html', {
        'form': form, 'modules': modules, 'collections': collections, 'progress': progress,
        'item_count': published_items().filter(placements__unit__collection__in=collections).count(),
    }, status=200 if form.is_valid() else 400)


@never_cache
@require_GET
def module_detail(request, code):
    module = get_object_or_404(Module, code=code, is_active=True)
    form, collections = filter_catalog(request)
    return render(request, 'catalog/module.html', {
        'module': module, 'form': form, 'collections': collections.filter(module=module),
    }, status=200 if form.is_valid() else 400)


@never_cache
@require_GET
def collection_detail(request, code):
    collection = get_object_or_404(published_collections().select_related('module', 'textbook__edition', 'textbook__grade'), code=code)
    units = collection.units.all()
    unit_code = request.GET.get('unit')
    selected_unit = get_object_or_404(units, code=unit_code) if unit_code else units.first()
    placements = selected_unit.placements.select_related('item').filter(item__status='published', item__module=collection.module) if selected_unit else []
    page = Paginator(placements, 30).get_page(request.GET.get('page'))
    return render(request, 'catalog/collection.html', {'collection': collection, 'units': units, 'selected_unit': selected_unit, 'page': page})


@never_cache
@require_GET
def catalog_api(request):
    form, collections = filter_catalog(request)
    if not form.is_valid():
        return JsonResponse({'errors': form.errors.get_json_data()}, status=400)
    page = Paginator(collections, 30).get_page(request.GET.get('page'))
    return JsonResponse({
        'schema_version': 1,
        'grades': list(Grade.objects.values('code', 'name', 'stage__code')),
        'subjects': list(Subject.objects.values('code', 'name')),
        'editions': list(TextbookEdition.objects.values('code', 'name', 'subject__code', 'publisher', 'version')),
        'modules': list(Module.objects.filter(is_active=True).values('code', 'name', 'subject__code', 'interactive_ready')),
        'collections': [{'code': c.code, 'name': c.name, 'module': c.module.code, 'textbook': c.textbook.code if c.textbook else None} for c in page],
        'page': page.number, 'pages': page.paginator.num_pages, 'total': page.paginator.count,
    })


@never_cache
@require_GET
def items_api(request):
    form, collections = filter_catalog(request)
    if not form.is_valid():
        return JsonResponse({'errors': form.errors.get_json_data()}, status=400)
    items = published_items().filter(placements__unit__collection__in=collections).select_related('module')
    code = request.GET.get('collection')
    if code:
        collection = get_object_or_404(collections, code=code)
        items = items.filter(placements__unit__collection=collection)
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

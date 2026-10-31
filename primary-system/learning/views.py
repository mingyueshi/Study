import json
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db import OperationalError
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET, require_http_methods
from catalog.models import Placement, published_items
from lexicon.models import ContentEntryLink, SourceRecord
from lexicon.services import link_state
from lexicon.views import record_payload
from .forms import ProgressForm
from .models import Progress
from .services import ProgressConflict, progress_data, save_progress

# 图示库按模块分配：六个 legacy 自包含库，loader.js 按全局名注入。
FIGURE_LIBS = {
    'knowledge': 'Figures', 'math': 'Figures', 'sci': 'SciFigures', 'geo': 'GeoFigures',
    'astro': 'AstroFigures', 'history': 'HistoryFigures', 'lit': 'LitFigures',
}
FIGURE_SCRIPTS = {
    'Figures': 'figures/figures.js', 'SciFigures': 'figures/sci-figures.js',
    'GeoFigures': 'figures/geo-figures.js', 'AstroFigures': 'figures/astro-figures.js',
    'HistoryFigures': 'figures/history-figures.js', 'LitFigures': 'figures/lit-figures.js',
}


def figure_context(item):
    """内容含图示块时返回对应图示库与脚本路径；其余情况不加载图示资产。"""
    sections = item.sections if isinstance(item.sections, list) else []
    if not any(isinstance(s, dict) and s.get('type') == 'figure' for s in sections):
        return {}
    lib = FIGURE_LIBS.get(item.module.code)
    script = FIGURE_SCRIPTS.get(lib) if lib else None
    return {'figure_lib': lib, 'figure_script': script} if script else {}


def word_card_context(item):
    """场景词卡：词典为内容源（经教学关联选定），教学标注与关联词仍在卡上。

    来源未激活、关联缺失或来源更新后未对上时返回空字典，页面降级为教学标注渲染。
    """
    link = ContentEntryLink.objects.filter(content=item, slot='main').select_related(
        'sense__entry', 'evidence__release__source').first()
    if not link:
        return {}
    source = link.evidence.release.source
    if not source.enabled or not source.active_release_id:
        return {}
    record = SourceRecord.objects.filter(
        release_id=source.active_release_id, binding_id=link.evidence.binding_id,
        lexical_hash=link.evidence.lexical_hash).select_related(
        'binding__sense__entry', 'binding__pronunciation', 'release__source').first()
    context = {'lexicon_state': link_state(link)}
    if record:
        context['word_lexicon'] = record_payload(record)
    payload = item.source_payload if isinstance(item.source_payload, dict) else {}
    related = [w for w in payload.get('related', []) if isinstance(w, str) and w.strip()]
    if related:
        cards = {card.title: card for card in published_items().filter(
            module__code='words', title__in=related).select_related('module')}
        context['related_links'] = [{'word': word, 'item': cards.get(word)} for word in related]
    placement = item.placements.select_related('unit').first()
    if placement:
        context['scenario_unit'] = placement.unit.title
        context['scenario_siblings'] = [p.item for p in Placement.objects.filter(
            unit=placement.unit, item__status='published', item__kind='word'
        ).exclude(item_id=item.pk).select_related('item').order_by('order', 'pk')]
    return context


@never_cache
@require_http_methods(['GET', 'POST'])
def item_detail(request, pk):
    item = get_object_or_404(published_items().select_related('module'), pk=pk)
    progress = Progress.objects.filter(user=request.user, item=item).first() if request.user.is_authenticated else None
    form = ProgressForm(initial=progress_data(progress))
    status = 200
    if request.method == 'POST':
        if not request.user.is_authenticated:
            from django.contrib.auth.views import redirect_to_login
            return redirect_to_login(request.path)
        form = ProgressForm(request.POST)
        if form.is_valid():
            try:
                save_progress(request.user, item, form.cleaned_data)
            except ProgressConflict as exc:
                form.add_error(None, str(exc))
                status = 409
            except OperationalError:
                form.add_error(None, '数据库暂忙。请重新打开页面核对保存状态，再进行操作。')
                status = 503
            else:
                messages.success(request, '学习记录已保存到你的账号。')
                return redirect('item', pk=item.pk)
        else:
            status = 400
    lookup_term = item.source_payload.get('en' if item.kind == 'word' else 'idiom', item.title) if isinstance(item.source_payload, dict) else item.title
    context = {'item': item, 'form': form, 'progress': progress, 'lookup_term': lookup_term,
               **figure_context(item)}
    if item.kind == 'word':
        card = word_card_context(item)
        if card.get('word_lexicon'):
            # 词典数据可用才走词典驱动；关联缺失或来源异常时降级为教学标注渲染。
            context['is_dictionary_word'] = True
            context.update(card)
    return render(request, 'learning/item.html', context, status=status)


@never_cache
@login_required
@require_GET
def my_learning(request):
    records = Progress.objects.filter(user=request.user, item__in=published_items()).select_related('item__module')
    selected = request.GET.get('status', '')
    if selected in Progress.Status.values:
        records = records.filter(status=selected)
    if request.GET.get('bookmarked') == '1':
        records = records.filter(bookmarked=True)
    page = Paginator(records, 30).get_page(request.GET.get('page'))
    return render(request, 'learning/mine.html', {'page': page, 'selected': selected})


@never_cache
@require_http_methods(['GET', 'POST'])
def progress_api(request, pk):
    if not request.user.is_authenticated:
        return JsonResponse({'error': '请先登录。'}, status=401)
    item = get_object_or_404(published_items(), pk=pk)
    if request.method == 'GET':
        return JsonResponse(progress_data(Progress.objects.filter(user=request.user, item=item).first()))
    if request.content_type != 'application/json':
        return JsonResponse({'error': '请使用 application/json。'}, status=415)
    if len(request.body) > 32000:
        return JsonResponse({'error': '请求过大。'}, status=413)
    try:
        data = json.loads(request.body)
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({'error': 'JSON 格式不正确。'}, status=400)
    if not isinstance(data, dict) or set(data) != {'revision', 'status', 'bookmarked', 'note'} or type(data['revision']) is not int or type(data['bookmarked']) is not bool or not isinstance(data['note'], str) or not isinstance(data['status'], str):
        return JsonResponse({'error': '需要 revision 整数、status 字符串、bookmarked 布尔值与 note 字符串。'}, status=400)
    form = ProgressForm(data)
    if not form.is_valid():
        return JsonResponse({'errors': form.errors.get_json_data()}, status=400)
    try:
        progress = save_progress(request.user, item, form.cleaned_data)
    except ProgressConflict as exc:
        return JsonResponse({'error': str(exc)}, status=409)
    except OperationalError:
        return JsonResponse({'error': '数据库暂忙，请重新读取状态后再操作。'}, status=503)
    return JsonResponse(progress_data(progress))

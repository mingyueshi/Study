import json
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db import OperationalError
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET, require_http_methods
from catalog.entry_registry import learning_overview
from catalog.models import ENGLISH_RELATION_TAGS, Placement, published_items
from lexicon.models import ContentEntryLink, SourceRecord
from lexicon.services import link_state
from lexicon.views import record_payload
from .forms import ProgressForm
from .models import Progress
from .services import ProgressConflict, progress_data, save_progress, effective_status
from lexicon.chinese import safe_word_item, content_presentation, LessonResolver

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


def word_card_context(item, resolver=None):
    """场景词卡：词典为内容源（经教学关联选定），教学标注与关联词仍在卡上。

    来源未激活、关联缺失或来源更新后未对上时返回空字典，页面降级为教学标注渲染。
    """
    resolver = resolver or LessonResolver([item])
    links = resolver.by_content.get(item.pk, [])
    if not links:
        return {}
    link = next((l for l in links if l.slot == 'main'), links[0])
    data = resolver.payloads[link.pk]
    context = {'lexicon_state': data['state'], 'word_lexicon': data,
               'secondary_selections': [resolver.payloads[l.pk] for l in links if l.pk != link.pk]}
    payload = item.source_payload if isinstance(item.source_payload, dict) else {}
    # 场景单词的关联词是英文字符串列表；教材英语词的 links 是带类型的对象列表，
    # 归一化成 {word, item, zh, tag} 后共用一套关联词模板。
    related = [w for w in payload.get('related', []) if isinstance(w, str) and w.strip()]
    related += [link['en'] for link in payload.get('links', []) if isinstance(link, dict) and str(link.get('en') or '').strip()]
    if related:
        cards = {card.title: card for card in published_items().filter(
            module__code=item.module.code, title__in=related).select_related('module')}
        links_by_word = {link['en']: link for link in payload.get('links', [])
                         if isinstance(link, dict) and link.get('en') in related}
        context['related_links'] = [{
            'word': word, 'item': cards.get(word),
            'zh': links_by_word.get(word, {}).get('zh', ''),
            'tag': ENGLISH_RELATION_TAGS.get(links_by_word.get(word, {}).get('type'), ''),
        } for word in related]
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
    links, presentation = content_presentation(item)
    form = ProgressForm(initial={**progress_data(progress), 'presentation': presentation if links else None})
    if not links:
        form.fields.pop('update_learning', None)
    status = 200
    if request.method == 'POST':
        if not request.user.is_authenticated:
            from django.contrib.auth.views import redirect_to_login
            return redirect_to_login(request.path)
        form = ProgressForm(request.POST)
        if not links:
            form.fields.pop('update_learning', None)
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
    resolver = LessonResolver([item])
    safe_word_item(item, resolver)
    lookup_term = item.source_payload.get('en' if item.kind == 'word' else 'idiom', item.title) if isinstance(item.source_payload, dict) else item.title
    context = {'item': item, 'form': form, 'progress': progress, 'lookup_term': lookup_term, 'protected_selection': bool(links),
               **figure_context(item)}
    if item.kind == 'word':
        card = word_card_context(item, resolver)
        if card.get('word_lexicon'):
            # 固定关联失效时仍走受保护词卡；不能降级到旧中文副本。
            context['is_dictionary_word'] = True
            context.update({'lexicon_state': '尚未确认词义关联，待复核', **card})
    context['lexical_references'] = [resolver.payloads[l.pk] for l in resolver.by_content.get(item.pk, [])] if item.kind != 'word' else []
    context['progress_effective'] = effective_status(progress) if progress else 'new'
    return render(request, 'learning/item.html', context, status=status)


@never_cache
@login_required
@require_GET
def my_learning(request):
    records = Progress.objects.filter(user=request.user, item__in=published_items()).select_related('item__module')
    selected = request.GET.get('status', '')
    records = list(records)
    resolver = LessonResolver([r.item for r in records])
    for record in records:
        record.effective = effective_status(record, resolver)
        record.effective_label = '历史掌握，依据待确认' if record.effective == 'needs_confirmation' else record.get_status_display()
    if selected in Progress.Status.values:
        records = [r for r in records if r.effective == selected]
    if request.GET.get('bookmarked') == '1':
        records = [r for r in records if r.bookmarked]
    page = Paginator(records, 30).get_page(request.GET.get('page'))
    return render(request, 'learning/mine.html', {'page': page, 'selected': selected, 'activity': learning_overview(request.user)})


@never_cache
@require_http_methods(['GET', 'POST'])
def progress_api(request, pk):
    if not request.user.is_authenticated:
        return JsonResponse({'error': '请先登录。'}, status=401)
    item = get_object_or_404(published_items(), pk=pk)
    if request.method == 'GET':
        links, tokens = content_presentation(item)
        return JsonResponse({**progress_data(Progress.objects.filter(user=request.user, item=item).first()), 'presentation': tokens if links else None})
    if request.content_type != 'application/json':
        return JsonResponse({'error': '请使用 application/json。'}, status=415)
    if len(request.body) > 32000:
        return JsonResponse({'error': '请求过大。'}, status=413)
    try:
        data = json.loads(request.body)
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({'error': 'JSON 格式不正确。'}, status=400)
    if not isinstance(data, dict) or not {'revision', 'status', 'bookmarked', 'note'} <= set(data) or set(data) - {'revision', 'status', 'bookmarked', 'note', 'presentation', 'update_learning'} or type(data['revision']) is not int or type(data['bookmarked']) is not bool or not isinstance(data['note'], str) or not isinstance(data['status'], str):
        return JsonResponse({'error': '需要 revision 整数、status 字符串、bookmarked 布尔值与 note 字符串。'}, status=400)
    if ContentEntryLink.objects.filter(content=item).exists() and ('presentation' not in data or type(data.get('update_learning')) is not bool):
        return JsonResponse({'error': '教材呈现接口已升级，请刷新页面。'}, status=409)
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

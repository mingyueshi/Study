import json
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db import OperationalError
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET, require_http_methods
from catalog.models import published_items
from .forms import ProgressForm
from .models import Progress
from .services import ProgressConflict, progress_data, save_progress


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
    return render(request, 'learning/item.html', {'item': item, 'form': form, 'progress': progress, 'lookup_term': lookup_term}, status=status)


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

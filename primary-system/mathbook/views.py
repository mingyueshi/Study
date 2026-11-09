"""数学教材册的文件编排与账号进度。GET 保持只读。"""
import json

from django.db import OperationalError
from django.http import Http404, JsonResponse
from django.shortcuts import render
from django.templatetags.static import static as static_url
from django.urls import reverse
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods, require_safe

from . import exercises, records
from .content import BOOKS_DIR, available_books, book_exists, load_book

MAX_BODY = 12000


@never_cache
@require_safe
def index(request):
    return render(request, 'mathbook/book_list.html', {'books': available_books()})


@require_safe
def geometry_lab(request):
    modes = json.loads((BOOKS_DIR.parent / 'geometry-lab.json').read_text(encoding='utf-8'))
    return render(request, 'mathbook/geometry_lab.html', {'modes': modes, 'study_area': 'math'})


@never_cache
@ensure_csrf_cookie
@require_safe
def reader(request, book):
    if not book_exists(book):
        raise Http404('未注册的教材册次。')
    data = load_book(book)
    manifest, mkb = data['manifest'], data['mkb']
    # 数据文件版本号取来源内容 sha256 前 8 位：源头变了缓存自动失效。
    data_src = static_url(f'mathbook/books/{book}.js') + f"?v={manifest['source_sha256'][:8]}"
    progress = None
    if request.user.is_authenticated:
        progress = {
            **records.payload(records.read_progress(request.user, book)),
            'scope': records.account_scope(request.user),
            'url': reverse('mathbook-progress', args=[book]),
        }
    return render(request, 'mathbook/reader.html', {
        'book': book,
        'data_src': data_src,
        'textbook': mkb.get('textbook', ''),
        'meta': mkb.get('meta', {}),
        'unit_total': manifest['units'],
        'point_total': manifest['points'],
        'progress': progress,
        'practice_links': exercises.reader_links(book),
    })


@never_cache
@require_http_methods(['GET', 'POST'])
def progress(request, book):
    if not book_exists(book):
        raise Http404('未注册的教材册次。')
    if not request.user.is_authenticated or request.headers.get('X-Mathbook-Scope') != records.account_scope(request.user):
        return JsonResponse({'code': 'owner_changed', 'error': '登录状态已变化，请刷新数学教材。'}, status=409)
    if request.method == 'GET':
        return JsonResponse(records.payload(records.read_progress(request.user, book)))
    if request.content_type != 'application/json' or len(request.body) > MAX_BODY:
        return JsonResponse({'error': '进度格式有误。'}, status=400)
    try:
        data = json.loads(request.body)
    except (ValueError, UnicodeError, RecursionError):
        return JsonResponse({'error': '进度格式有误。'}, status=400)
    try:
        records.validate_change(book, data)
    except ValueError as error:
        return JsonResponse({'error': str(error)}, status=400)
    try:
        row, saved = records.save_progress(request.user, book, data)
    except OperationalError:
        return JsonResponse({'error': '暂时保存不了，请再试一次。'}, status=503)
    state = records.payload(row)
    if not saved:
        return JsonResponse({**state, 'code': 'conflict', 'error': '进度已在别处更新，请核对后再操作。'}, status=409)
    return JsonResponse(state)

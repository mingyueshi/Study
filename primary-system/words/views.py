"""场景单词 API：全量 state 下发（与 legacy 同构），掌握标记双轨。"""
import json

from django.db import OperationalError
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from . import services

MAX_BODY = 2000


@ensure_csrf_cookie
@never_cache
@require_GET
def page(request):
    return render(request, 'words/play.html', {'state': services.state_payload(services.owner_filter(request))})


@never_cache
@require_GET
def state(request):
    return JsonResponse(services.state_payload(services.owner_filter(request)))


@never_cache
@require_POST
def learn(request):
    if len(request.body) > MAX_BODY:
        return JsonResponse({'error': '请求过大。'}, status=413)
    try:
        data = json.loads(request.body)
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({'error': '请求格式不正确。'}, status=400)
    if not isinstance(data, dict) or not isinstance(data.get('word_id'), str) \
            or not data['word_id'].isdigit() or not isinstance(data.get('learned'), bool):
        return JsonResponse({'error': '需要 word_id 与 learned。'}, status=400)
    try:
        from words.models import ScenarioWord
        if not ScenarioWord.objects.filter(pk=data['word_id']).exists():
            return JsonResponse({'error': '单词不存在。'}, status=404)
        row = services.set_learned(services.owner_filter(request), data['word_id'], data['learned'])
    except OperationalError:
        return JsonResponse({'error': '数据库暂忙，请重试。'}, status=503)
    return JsonResponse({'word_id': str(row.word_id), 'learned': row.learned})

"""练习页与逐题判分端点。

页面 GET 渲染一组题（不带答案与解析，内嵌 JSON 给前端），作答逐题 POST
到 ``api/answer/``，由服务端按题型注册表判分并落一条记录；对错都记。
游客沿用会话键双轨，键只在 POST 写入路径生成——GET 保持零写入、零会话。
"""
import json

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST, require_safe

from . import records, services
from . import types as question_types
from .models import Question

MAX_BODY = 4000  # 作答是小 JSON，超限直接拒绝


def _clean_area(value):
    return value if value in Question.Area.values else ''


def _clean_size(value):
    try:
        size = int(value)
    except (TypeError, ValueError):
        return services.DEFAULT_SIZE
    return size if size in services.SIZES else services.DEFAULT_SIZE


AREA_CHIPS = [{'area': area, 'label': label} for area, label in Question.Area.choices]


@ensure_csrf_cookie
@never_cache
@require_safe
def page(request):
    area = _clean_area(request.GET.get('area', ''))
    size = _clean_size(request.GET.get('count', ''))
    mode_wrong = request.GET.get('mode') == 'wrong'
    pool = None
    if mode_wrong:
        pool = services.latest_wrong_ids(records.read_scope(request))
        if not pool:
            return render(request, 'questionbank/practice.html', {
                'questions': [], 'area': area,
                'area_label': dict(Question.Area.choices).get(area) or '全科混合挑战',
                'area_chips': AREA_CHIPS,
                'sizes': services.SIZES,
                'size': size, 'mode_wrong': True, 'empty_wrong': True,
            }, status=200)
    questions = services.pick_questions(area=area, count=size, ids=pool)
    return render(request, 'questionbank/practice.html', {
        'questions': [services.client_question(question) for question in questions],
        'area': area,
        'area_label': dict(Question.Area.choices).get(area) or '全科混合挑战',
        'area_chips': AREA_CHIPS,
        'sizes': services.SIZES,
        'size': size, 'mode_wrong': mode_wrong, 'empty_wrong': False,
    })


@never_cache
@require_POST
def answer(request):
    """逐题判分：校验请求形状 → 服务端判分 → 落记录 → 返回判定与解析。"""
    if request.content_type != 'application/json' or len(request.body) > MAX_BODY:
        return JsonResponse({'error': '请求格式不正确。'}, status=400)
    try:
        data = json.loads(request.body)
    except (ValueError, UnicodeError, RecursionError):
        return JsonResponse({'error': '请求格式不正确。'}, status=400)
    if not isinstance(data, dict) or not isinstance(data.get('uuid'), str) \
            or not isinstance(data.get('given'), dict):
        return JsonResponse({'error': '请求格式不正确。'}, status=400)
    question = Question.objects.filter(active=True, uuid=data['uuid']).first()
    if question is None:
        return JsonResponse({'error': '这道题不在题库里，请刷新页面后再试。'}, status=400)
    try:
        _, result = services.record_answer(question, data['given'], records.owner_filter(request))
    except question_types.InvalidAnswer as error:
        return JsonResponse({'error': str(error)}, status=400)
    return JsonResponse(result)

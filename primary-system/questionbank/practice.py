"""练习页与逐题判分端点。

页面 GET 渲染一组题（不带答案与解析，内嵌 JSON 给前端），作答逐题 POST
到 ``api/answer/``，由服务端按题型注册表判分并落一条记录；对错都记。
游客沿用会话键双轨，键只在 POST 写入路径生成——GET 保持零写入、零会话。

题库分普通与奥数两条轨：普通路由（``questionbank-practice``）只从普通轨
抽题，奥数路由（``questionbank-olympiad-practice``）只从奥数轨抽题并支持
``?tag=`` 主题过滤。判分端点共用，按题目 uuid 定位，不区分轨别。
"""
import json
from uuid import UUID

from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST, require_safe

from . import records, services
from . import types as question_types
from .models import Question

MAX_BODY = 4000  # 作答是小 JSON，超限直接拒绝

AREA_CHIPS = [{'area': area, 'label': label} for area, label in Question.Area.choices]

# 各轨别的页面语境：落地页文案；具体 URL 在请求时解析（olympiad 的错题
# 本带 ?track=olympiad 过滤）。
TRACK_PAGES = {
    Question.Track.REGULAR: {
        'eyebrow': '挑战练习', 'mix_label': '全科混合挑战', 'home_label': '题库',
    },
    Question.Track.OLYMPIAD: {
        'eyebrow': '奥数挑战', 'mix_label': '奥数混合挑战', 'home_label': '奥数挑战',
    },
}


def _page_urls(track):
    if track == Question.Track.OLYMPIAD:
        return {'home_url': reverse('questionbank-olympiad'),
                'practice_url': reverse('questionbank-olympiad-practice'),
                'wrong_url': reverse('questionbank-wrong') + '?track=olympiad'}
    return {'home_url': reverse('questionbank'),
            'practice_url': reverse('questionbank-practice'),
            'wrong_url': reverse('questionbank-wrong')}


def _clean_area(value):
    return value if value in Question.Area.values else ''


def _clean_size(value):
    try:
        size = int(value)
    except (TypeError, ValueError):
        return services.DEFAULT_SIZE
    return size if size in services.SIZES else services.DEFAULT_SIZE


def _clean_tag(value, track):
    """主题过滤只在奥数轨生效，且值须属于当前在库标签；其余忽略。"""
    if track != Question.Track.OLYMPIAD:
        return ''
    tags = {tag for tag, _ in services.tag_counts(track)}
    return value if value in tags else ''


def _practice(request, *, track):
    page = TRACK_PAGES.get(track, TRACK_PAGES[Question.Track.REGULAR])
    page = {**page, **_page_urls(track)}
    area = _clean_area(request.GET.get('area', ''))
    tag = _clean_tag(request.GET.get('tag', ''), track)
    size = _clean_size(request.GET.get('count', ''))
    mode_wrong = request.GET.get('mode') == 'wrong'
    pool = None
    if mode_wrong:
        pool = services.track_wrong_ids(records.read_scope(request), track)
        if not pool:
            return render(request, 'questionbank/practice.html', {
                'questions': [], 'area': area, 'tag': tag,
                'area_label': dict(Question.Area.choices).get(area) or page['mix_label'],
                'area_chips': AREA_CHIPS,
                'sizes': services.SIZES,
                'size': size, 'mode_wrong': True, 'empty_wrong': True,
                'track': track, **page,
            }, status=200)
    questions = services.pick_questions(area=area, track=track, count=size, ids=pool, tag=tag)
    return render(request, 'questionbank/practice.html', {
        'questions': [services.client_question(question) for question in questions],
        'area': area, 'tag': tag,
        'area_label': tag or (dict(Question.Area.choices).get(area) or page['mix_label']),
        'area_chips': [] if track == Question.Track.OLYMPIAD else AREA_CHIPS,
        'tag_chips': ([{'tag': name} for name, _ in services.tag_counts(track)]
                      if track == Question.Track.OLYMPIAD else None),
        'sizes': services.SIZES,
        'size': size, 'mode_wrong': mode_wrong, 'empty_wrong': False,
        'track': track, **page,
    })


@ensure_csrf_cookie
@never_cache
@require_safe
def page(request):
    """普通轨练习：只从普通轨抽题。"""
    return _practice(request, track=Question.Track.REGULAR)


@ensure_csrf_cookie
@never_cache
@require_safe
def olympiad_page(request):
    """奥数轨练习：只从奥数轨抽题，支持 ?tag= 主题过滤。"""
    return _practice(request, track=Question.Track.OLYMPIAD)


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
    attempt_id = data.get('attempt_id')
    try:
        question_id = UUID(data['uuid'])
        if 'attempt_id' in data:
            if not isinstance(attempt_id, str):
                raise ValueError
            attempt_id = UUID(attempt_id)
    except ValueError:
        return JsonResponse({'error': '题目标识或作答标识不正确。'}, status=400)
    question = Question.objects.filter(active=True, uuid=question_id).first()
    if question is None:
        return JsonResponse({'error': '这道题不在题库里，请刷新页面后再试。'}, status=400)
    from incentives.services import take_awards
    try:
        with transaction.atomic():
            _, result = services.record_answer(
                question, data['given'], records.owner_filter(request), attempt_id, request=request,
            )
    except question_types.InvalidAnswer as error:
        return JsonResponse({'error': str(error)}, status=400)
    except services.AttemptConflict as error:
        return JsonResponse({'error': str(error)}, status=409)
    rewards = take_awards(request)
    if rewards:
        result['rewards'] = rewards
    return JsonResponse(result)

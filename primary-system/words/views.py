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
    if not isinstance(data, dict) or data.get('schema_version') != 3:
        return JsonResponse({'error': '词卡接口已升级，请刷新页面。', 'schema_version': 3}, status=409)
    import uuid
    try:
        target_id = uuid.UUID(data.get('target_id', ''))
    except (ValueError, TypeError, AttributeError):
        return JsonResponse({'error': '需要有效 target_id。'}, status=400)
    if not isinstance(data.get('learned'), bool) or type(data.get('revision')) is not int or not 0 <= data['revision'] < 2147483647:
        return JsonResponse({'error': '需要 learned 与非负 revision。'}, status=400)
    if type(data.get('presentation_revision')) is not int or data['presentation_revision'] < 0 or 'chinese_version_id' not in data:
        return JsonResponse({'error': '中文呈现信息缺失，请刷新页面。'}, status=409)
    try:
        if data['chinese_version_id'] is not None:
            uuid.UUID(data['chinese_version_id'])
    except (ValueError, TypeError, AttributeError):
        return JsonResponse({'error': '呈现版本无效。'}, status=400)
    from words.models import LearningTarget
    try:
        row = services.set_learned(services.owner_filter(request), target_id, data['learned'], data['revision'], chinese_version_id=data['chinese_version_id'], presentation_revision=data['presentation_revision'])
    except LearningTarget.DoesNotExist:
        return JsonResponse({'error': '学习目标不存在。'}, status=404)
    except services.ProgressConflict as error:
        return JsonResponse({'error': str(error)}, status=409)
    except OperationalError:
        return JsonResponse({'error': '数据库暂忙，请重试。'}, status=503)
    return JsonResponse({'schema_version': 3, 'target_id': str(row.target_id), 'learned': row.learned, 'revision': row.revision})

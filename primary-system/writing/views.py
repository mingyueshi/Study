from django.db import OperationalError
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_http_methods

from .catalog import grouped_categories, load_curriculum
from .models import WritingDraft
from .services import DraftConflict, draft_payload, list_drafts, owner_filter, parse_draft_payload, save_draft


@never_cache
@ensure_csrf_cookie
@require_GET
def page(request):
    # 题目与素材服务端渲染（只读）；草稿由前端通过 API 拉取，与页面缓存解耦。
    return render(request, 'writing/index.html',
                  {'groups': grouped_categories(), 'materials': load_curriculum()['materials']})


@never_cache
@require_http_methods(['GET', 'POST'])
def drafts_api(request):
    if request.method == 'POST':
        data, error = parse_draft_payload(request, require_revision=False)
        if error:
            return error
        try:
            draft = save_draft(request, data)
        except OperationalError:
            return JsonResponse({'error': '数据库暂忙，请稍后再试。'}, status=503)
        payload = draft_payload(draft)
        if request.user.is_authenticated:
            from incentives.services import take_awards
            rewards = take_awards(request)
            if rewards:
                payload['rewards'] = rewards
        return JsonResponse(payload, status=201)
    return JsonResponse({'schema_version': 1, 'drafts': [draft_payload(d) for d in list_drafts(request)]})


def _owned_draft(request, pk):
    """取当前归属者的草稿；不存在或他人草稿一律 404，不泄露存在性。"""
    try:
        return WritingDraft.objects.filter(pk=pk, **owner_filter(request)).get()
    except (WritingDraft.DoesNotExist, ValueError):
        return None


@never_cache
@require_http_methods(['PATCH', 'DELETE'])
def drafts_detail(request, pk):
    draft = _owned_draft(request, pk)
    if draft is None:
        return JsonResponse({'error': '草稿不存在。'}, status=404)
    if request.method == 'DELETE':
        draft.delete()
        return JsonResponse({'deleted': True})
    data, error = parse_draft_payload(request, require_revision=True)
    if error:
        return error
    try:
        draft = save_draft(request, data, draft=draft)
    except DraftConflict:
        return JsonResponse({'error': '草稿已在别处保存，请刷新后核对。', 'revision': draft.revision}, status=409)
    except OperationalError:
        return JsonResponse({'error': '数据库暂忙，请重新读取状态后再试。'}, status=503)
    return JsonResponse(draft_payload(draft))

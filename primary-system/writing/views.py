from django.db import OperationalError
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_http_methods

from .catalog import grouped_categories, load_curriculum
from .models import WritingDraft
from .services import (
    DraftConflict, autosave_scope, draft_payload, list_drafts, owner_filter,
    parse_draft_payload, save_draft,
)


def _owner_changed(request):
    # 旧页面传来的标识只能核对归属，实际权限仍由当前会话与草稿查询决定。
    expected = request.headers.get('X-Writing-Scope')
    if expected is None or expected == autosave_scope(request):
        return None
    if request.method == 'GET' and expected == 'guest' and not request.user.is_authenticated:
        return None
    return JsonResponse({'error': '登录状态已变化，请刷新作文坊。', 'code': 'owner_changed'}, status=409)


@never_cache
@ensure_csrf_cookie
@require_GET
def page(request):
    # 题目与素材服务端渲染（只读）；草稿由前端通过 API 拉取，与页面缓存解耦。
    return render(request, 'writing/index.html',
                  {'groups': grouped_categories(), 'materials': load_curriculum()['materials'],
                   'autosave_scope': autosave_scope(request)})


@never_cache
@require_http_methods(['GET', 'POST'])
def drafts_api(request):
    error = _owner_changed(request)
    if error:
        return error
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
    drafts = [draft_payload(draft) for draft in list_drafts(request)]
    return JsonResponse({'schema_version': 1, 'drafts': drafts, 'autosave_scope': autosave_scope(request)})


def _owned_draft(request, pk):
    """取当前归属者的草稿；不存在或他人草稿一律 404，不泄露存在性。"""
    try:
        return WritingDraft.objects.filter(pk=pk, **owner_filter(request)).get()
    except (WritingDraft.DoesNotExist, ValueError):
        return None


@never_cache
@require_http_methods(['GET', 'PATCH', 'DELETE'])
def drafts_detail(request, pk):
    error = _owner_changed(request)
    if error:
        return error
    # 没有游客归属键就没有可读草稿，读取单篇时无须创建会话。
    if request.method == 'GET' and not autosave_scope(request):
        return JsonResponse({'error': '草稿不存在。'}, status=404)
    draft = _owned_draft(request, pk)
    if draft is None:
        return JsonResponse({'error': '草稿不存在。'}, status=404)
    if request.method == 'GET':
        return JsonResponse(draft_payload(draft))
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

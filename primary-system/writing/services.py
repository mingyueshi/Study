"""作文草稿的双轨归属与保存（仿 words.services 的场景单词模式）。"""

import json

from django.db import transaction

from .models import WritingDraft

GUEST_KEY = 'writing_guest'
MAX_TITLE = 120
MAX_CONTENT = 20000
MAX_BODY = 32000


class DraftConflict(Exception):
    """revision 不匹配：别人或另一标签页已保存更新版本。"""


def owner_filter(request):
    """登录挂账号，游客挂会话键；与接龙、场景单词同约定，不合并账号。"""
    if request.user.is_authenticated:
        return {'user': request.user}
    if not request.session.session_key:
        request.session.create()
    key = request.session.get(GUEST_KEY)
    if not key:
        key = request.session.session_key
        request.session[GUEST_KEY] = key
    return {'guest_key': key}


def parse_draft_payload(request, require_revision):
    """校验 JSON 请求体；返回 (data, error_response)。"""
    from django.http import JsonResponse

    if request.content_type != 'application/json':
        return None, JsonResponse({'error': '请使用 application/json。'}, status=415)
    if len(request.body) > MAX_BODY:
        return None, JsonResponse({'error': '请求过大。'}, status=413)
    try:
        data = json.loads(request.body)
    except (ValueError, UnicodeDecodeError):
        return None, JsonResponse({'error': 'JSON 格式不正确。'}, status=400)
    if not isinstance(data, dict):
        return None, JsonResponse({'error': 'JSON 格式不正确。'}, status=400)
    if type(data.get('title')) is not str or type(data.get('content')) is not str:
        return None, JsonResponse({'error': '需要 title 与 content 字符串。'}, status=400)
    if len(data['title']) > MAX_TITLE:
        return None, JsonResponse({'error': f'标题不超过 {MAX_TITLE} 字。'}, status=400)
    if len(data['content']) > MAX_CONTENT:
        return None, JsonResponse({'error': f'正文不超过 {MAX_CONTENT} 字。'}, status=400)
    if 'topic_title' in data and (type(data['topic_title']) is not str or len(data['topic_title']) > 120):
        return None, JsonResponse({'error': 'topic_title 需为不超过 120 字的字符串。'}, status=400)
    if require_revision and (type(data.get('revision')) is not int or data['revision'] < 0):
        return None, JsonResponse({'error': '需要 revision 非负整数。'}, status=400)
    return data, None


def draft_payload(draft):
    """草稿的对外 JSON 形状（revision 用于并发保护）。"""
    return {
        'id': str(draft.pk), 'topic_title': draft.topic_title, 'title': draft.title,
        'content': draft.content, 'revision': draft.revision,
        'created_at': draft.created_at.isoformat(timespec='seconds'),
        'updated_at': draft.updated_at.isoformat(timespec='seconds'),
    }


def list_drafts(request):
    return WritingDraft.objects.filter(**owner_filter(request)).order_by('-updated_at', '-pk')[:100]


@transaction.atomic
def save_draft(request, data, draft=None):
    """新建或更新草稿；更新时按 revision 乐观并发，冲突抛 DraftConflict。"""
    if draft is None:
        draft = WritingDraft(**owner_filter(request))
    else:
        draft = WritingDraft.objects.select_for_update().get(pk=draft.pk)
        if draft.revision != data['revision']:
            raise DraftConflict
    draft.topic_title = data.get('topic_title', draft.topic_title)
    draft.title = data['title'].strip()[:MAX_TITLE]
    draft.content = data['content'][:MAX_CONTENT]
    draft.revision += 1
    draft.full_clean(exclude=('user', 'guest_key'))
    draft.save()
    return draft

"""日常用语练习记录的归属、写入与汇总适配（与不规则复数 records 同式）。

判分在前端展示，但上报端点按词表确定性选项集复核并重算对错（不信任前端
结论），每题落一条。游客沿用「会话键」双轨，键只在 POST 写入路径生成——
页面 GET 保持零写入、零会话。
"""
from datetime import timedelta

from django.urls import reverse
from django.utils import timezone

GUEST_KEY = 'phrases_guest'


def owner_filter(request):
    """归属过滤字典：登录用户挂账号，游客挂浏览器会话键（与不规则复数同式）。"""
    if request.user.is_authenticated:
        return {'user': request.user}
    if not request.session.session_key:
        request.session.create()
    key = request.session.get(GUEST_KEY)
    if not key:
        key = request.session.session_key
        request.session[GUEST_KEY] = key
    return {'guest_key': key}


def read_scope(request):
    """只读归属：GET 页面用它查统计，绝不创建会话——游客没答过题就返回 None。"""
    if request.user.is_authenticated:
        return {'user': request.user}
    key = request.session.get(GUEST_KEY)
    return {'guest_key': key} if key else None


def _row(answer):
    from .phrases import item_index

    item = item_index().get(answer.phrase)
    zh = item['zh'] if item else ''
    return {'title': zh or answer.answer,
            'note': f'日常用语 · 答对（{answer.answer}）' if answer.correct
            else f'日常用语 · 答错（正确 {answer.answer}）',
            'when': answer.created_at, 'url': reverse('phrases')}


def learning_summary(user):
    from .models import PhraseAnswer

    rows = PhraseAnswer.objects.filter(user=user)
    week_cutoff = timezone.now() - timedelta(days=7)
    return {'asked': rows.count(),
            'correct': rows.filter(correct=True).count(),
            'week': rows.filter(created_at__gte=week_cutoff).count()}


def recent(user, limit=8):
    from .models import PhraseAnswer

    return [_row(answer) for answer in PhraseAnswer.objects.filter(user=user)[:limit]]

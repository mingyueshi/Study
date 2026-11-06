"""多音字练习记录的写入与汇总适配。

判分在前端，但上报端点按读音表复核并重算对错（不信任前端结论），每题
落一条。游客沿用「会话键」双轨，键只在 POST 写入路径生成——页面 GET
保持零写入、零会话。
"""
from datetime import timedelta

from django.urls import reverse
from django.utils import timezone

GUEST_KEY = 'hanzi_guest'


def owner_filter(request):
    """归属过滤字典：登录玩家挂账号，游客挂浏览器会话键（与场景单词同式）。"""
    if request.user.is_authenticated:
        return {'user': request.user}
    if not request.session.session_key:
        request.session.create()
    key = request.session.get(GUEST_KEY)
    if not key:
        key = request.session.session_key
        request.session[GUEST_KEY] = key
    return {'guest_key': key}


def _row(answer):
    title = f'「{answer.word}」里的「{answer.char}」' if answer.word else f'多音字「{answer.char}」'
    return {'title': title,
            'note': '多音字 · 答对' if answer.correct else f'多音字 · 答错（正确 {answer.answer}）',
            'when': answer.created_at, 'url': reverse('hanzi-polyphones')}


def learning_summary(user):
    from .models import PolyphoneAnswer

    rows = PolyphoneAnswer.objects.filter(user=user)
    week_cutoff = timezone.now() - timedelta(days=7)
    return {'asked': rows.count(),
            'correct': rows.filter(correct=True).count(),
            'week': rows.filter(created_at__gte=week_cutoff).count()}


def recent(user, limit=8):
    from .models import PolyphoneAnswer

    return [_row(answer) for answer in PolyphoneAnswer.objects.filter(user=user)[:limit]]

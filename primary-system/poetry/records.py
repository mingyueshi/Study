"""飞花令完成记录的写入与汇总适配。

完成判定在服务端（``feihualing.act``）：集满五句或令字语料耗尽时由视图
落一条，每局恰好一次。游客沿用「会话键」双轨，键只在 POST 写入路径生成
——页面 GET 保持零写入、零会话。
"""
from datetime import timedelta

from django.urls import reverse
from django.utils import timezone

GUEST_KEY = 'poetry_guest'


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


def _row(round_):
    return {'title': f'「{round_.keyword}」字飞花令',
            'note': f'{round_.get_result_display()} · 独立作答 {round_.independent} 句',
            'when': round_.created_at, 'url': reverse('feihualing')}


def learning_summary(user):
    from .models import FeihualingRound

    rows = FeihualingRound.objects.filter(user=user)
    week_cutoff = timezone.now() - timedelta(days=7)
    return {'rounds': rows.count(),
            'completed': rows.filter(result=FeihualingRound.Result.COMPLETED).count(),
            'week': rows.filter(created_at__gte=week_cutoff).count()}


def recent(user, limit=8):
    from .models import FeihualingRound

    return [_row(round_) for round_ in FeihualingRound.objects.filter(user=user)[:limit]]

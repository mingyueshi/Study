"""题库作答记录的归属、写入与汇总适配。

判分一律在服务端完成（自评题照记自评结论），每题落一条。游客沿用
「会话键」双轨，键只在 POST 写入路径生成——页面 GET 保持零写入、零会话。
汇总口径含义明确：答题数、答对数、本周新增，不合成跨学科掌握百分比。
"""
from datetime import timedelta

from django.urls import reverse
from django.utils import timezone

GUEST_KEY = 'questionbank_guest'


def owner_filter(request):
    """归属过滤字典：登录用户挂账号，游客挂浏览器会话键（与成语小游戏同式）。"""
    if request.user.is_authenticated:
        return {'user': request.user}
    if not request.session.session_key:
        request.session.create()
    key = request.session.get(GUEST_KEY)
    if not key:
        # 同一已存在会话的多标签页首写使用同一个稳定键；不与账号合并。
        key = request.session.session_key
        request.session[GUEST_KEY] = key
    return {'guest_key': key}


def read_scope(request):
    """只读归属：GET 页面用它查统计，绝不创建会话——游客没答过题就返回 None。"""
    if request.user.is_authenticated:
        return {'user': request.user}
    key = request.session.get(GUEST_KEY)
    return {'guest_key': key} if key else None


def _row(record):
    stem = record.question.stem
    return {'title': stem if len(stem) <= 24 else stem[:24] + '…',
            'note': f'挑战题库 · {"答对" if record.correct else "答错"}',
            'when': record.created_at, 'url': reverse('questionbank')}


def learning_summary(user):
    from .models import AnswerRecord

    rows = AnswerRecord.objects.filter(user=user)
    week_cutoff = timezone.now() - timedelta(days=7)
    return {'answered': rows.count(),
            'correct': rows.filter(correct=True).count(),
            'week': rows.filter(created_at__gte=week_cutoff).count()}


def recent(user, limit=8):
    from .models import AnswerRecord

    return [_row(record) for record in
            AnswerRecord.objects.filter(user=user).select_related('question')[:limit]]

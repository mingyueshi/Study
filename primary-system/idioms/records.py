"""成语小游戏学习记录的写入与汇总适配。

写入只发生在服务端判定的动作里：成语配对与表情猜猜看在一局完成时由
action 落一条，看释义猜成语由上报端点逐题落一条（对错都记）。游客沿用
「会话键」双轨，键只在 POST 写入路径生成——页面 GET 保持零写入、零会话。
汇总口径各自含义明确：答题数、完成局数，不把三个游戏合成一个百分比。
"""
from datetime import timedelta

from django.db import transaction
from django.db.models import Count, Q, Sum
from django.urls import reverse
from django.utils import timezone

GUEST_KEY = 'idioms_guest'

# 汇总行里展示的入口：三个游戏各自回到自己的页面。
GAME_URLS = {'quiz': 'idiom-quiz', 'pairs': 'idiom-pairs', 'emoji': 'idiom-emoji'}


def owner_filter(request, *, initial_guest_key=None):
    """归属过滤字典：登录玩家挂账号，游客挂浏览器会话键（与场景单词同式）。"""
    if request.user.is_authenticated:
        return {'user': request.user}
    if not request.session.session_key:
        request.session.create()
    key = request.session.get(GUEST_KEY)
    if not key:
        # 同一已存在会话的多标签页首写使用同一个稳定键；不合并账号。
        key = initial_guest_key or request.session.session_key
        request.session[GUEST_KEY] = key
    return {'guest_key': key}


def record_play(request, *, game, size, correct, extra=None):
    """落一条小游戏记录；由服务端判定完成/判分的动作调用。"""
    from .models import PlayRecord

    record = PlayRecord.objects.create(game=game, size=size, correct=correct,
                                       extra=extra or {}, **owner_filter(request))
    _reward(request, game, bool(correct))
    return record


@transaction.atomic
def record_quiz_attempt(request, attempt_id, correct, extra, *, initial_guest_key):
    """同一道签名题只记首次判分，并在同一事务里发放积分。"""
    from .models import PlayRecord

    owner = owner_filter(request, initial_guest_key=initial_guest_key)
    record, created = PlayRecord.objects.get_or_create(
        attempt_id=attempt_id,
        defaults={**owner, 'game': PlayRecord.Game.QUIZ, 'size': 1,
                  'correct': int(correct), 'extra': extra},
    )
    if (record.user_id != getattr(owner.get('user'), 'pk', None)
            or record.guest_key != owner.get('guest_key', '')):
        return None
    if created:
        _reward(request, PlayRecord.Game.QUIZ, correct)
    return record


def quiz_score(request):
    """同一账号或游客会话内的累计成绩，查询不会创建游客会话。"""
    from .models import PlayRecord

    rows = PlayRecord.objects.filter(game=PlayRecord.Game.QUIZ)
    if request.user.is_authenticated:
        rows = rows.filter(user=request.user)
    else:
        key = request.session.get(GUEST_KEY)
        if not key:
            return {'asked': 0, 'correct': 0, 'streak': 0}
        rows = rows.filter(guest_key=key)
    score = rows.aggregate(asked=Count('pk'), correct=Count('pk', filter=Q(correct=1)))
    last_wrong = rows.filter(correct=0).order_by('-pk').values_list('pk', flat=True).first()
    score['streak'] = rows.filter(pk__gt=last_wrong).count() if last_wrong else score['correct']
    return score


def _reward(request, game, correct):
    """登录玩家的小游戏激励：看释义猜成语按答对逐题，配对与表情按完成局；游客静默跳过。"""
    if not request.user.is_authenticated:
        return
    from .models import PlayRecord
    from incentives.services import record_event

    code = {PlayRecord.Game.QUIZ: 'idiom_quiz_correct',
            PlayRecord.Game.PAIRS: 'idiom_pairs_round',
            PlayRecord.Game.EMOJI: 'idiom_emoji_round'}.get(game)
    if code == 'idiom_quiz_correct' and not correct:
        return  # 答错不记激励（记录本身对错都落）
    record_event(request.user, code, request=request)


def _row(record):
    """一条记录 → 学习足迹行（汇总卡「最近」与动态流共用）。"""
    from .models import PlayRecord

    if record.game == PlayRecord.Game.QUIZ:
        headword = (record.extra or {}).get('headword') or ''
        title = headword or '看释义猜成语'
        note = '看释义猜成语 · 答对' if record.correct else '看释义猜成语 · 再想想'
    elif record.game == PlayRecord.Game.PAIRS:
        title = '成语配对'
        note = f'配对 {record.correct} 对 · {record.extra.get("attempts", record.correct)} 次尝试'
    else:
        title = '表情猜猜看'
        note = f'答对 {record.correct}/{record.size}'
        if record.extra.get('revealed'):
            note += f' · 看提示 {record.extra["revealed"]} 题'
    return {'title': title, 'note': note, 'when': record.created_at,
            'url': reverse(GAME_URLS[record.game])}


def learning_summary(user):
    """总览卡数字：看释义猜成语按题、配对与表情按局，各算各的。"""
    from .models import PlayRecord

    rows = PlayRecord.objects.filter(user=user)
    week_cutoff = timezone.now() - timedelta(days=7)
    per_game = {game: rows.filter(game=game) for game in PlayRecord.Game.values}
    quiz_agg = per_game['quiz'].aggregate(asked=Sum('size'), correct=Sum('correct'))
    emoji_agg = per_game['emoji'].aggregate(correct=Sum('correct'))
    return {
        'quiz_asked': quiz_agg['asked'] or 0,
        'quiz_correct': quiz_agg['correct'] or 0,
        'pairs_rounds': per_game['pairs'].count(),
        'emoji_rounds': per_game['emoji'].count(),
        'emoji_correct': emoji_agg['correct'] or 0,
        'week': rows.filter(created_at__gte=week_cutoff).count(),
    }


def recent(user, limit=8):
    from .models import PlayRecord

    return [_row(record) for record in PlayRecord.objects.filter(user=user)[:limit]]

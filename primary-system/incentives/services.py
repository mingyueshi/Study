"""激励服务层：记一笔学习动作、算打卡连击、判定勋章、兑换与核销。

纪律：``record_event`` 绝不抛异常——激励故障只记日志，绝不影响学习主流程；
发分与兑换全部在服务端原子完成；勋章判定取源数据表计数（对存量学习记录
天然追溯补发），只有「全科探索」按积分流水的家族统计。激励只服务登录用户，
未登录一律静默返回。
"""
import logging
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import connection, transaction
from django.db.models import Q, Sum
from django.utils import timezone

from .models import BadgeAward, CheckIn, PointEvent, Redemption, RewardItem
from .rules import BADGES, EVENT_RULES, FAMILY_CATS, LEVELS, event_cats

logger = logging.getLogger(__name__)


class RedemptionError(Exception):
    """兑换失败（余额不足、奖励下架等）；异常文案是给孩子的中文提示。"""


def _lock_account(user_id):
    # PostgreSQL 的较弱行锁仍能串行记账，也允许其他学习记录引用这个账号。
    get_user_model().objects.select_for_update(
        no_key=connection.features.has_select_for_no_key_update,
    ).get(pk=user_id)


# ---------------------------------------------------------------------------
# 记一笔学习动作
# ---------------------------------------------------------------------------

def record_event(user, code, *, request=None, note=None):
    """学习动作完成后记一笔激励：发分 → 自动打卡 → 刷新勋章。

    返回 awards 列表（供响应提示）：
    - {'type': 'points', 'points': int, 'label': str}
    - {'type': 'checkin', 'streak': int}
    - {'type': 'badge', 'code': str, 'name': str, 'icon': str}
    未登录、code 未知或发生异常时返回 []（异常只记日志，不影响学习流程）。
    """
    if not getattr(user, 'is_authenticated', False):
        return []
    rule = EVENT_RULES.get(code)
    if rule is None or rule.get('manual'):
        logger.warning('激励事件 code 无效或为手动事件：%s', code)
        return []
    awards = []
    try:
        with transaction.atomic():
            _lock_account(user.pk)
            today = timezone.localdate()
            if rule['points'] > 0:
                used = PointEvent.objects.filter(user=user, code=code, created_at__date=today).count()
                if used < rule['daily_cap']:
                    PointEvent.objects.create(user=user, code=code, points=rule['points'],
                                              note=note or rule['label'])
                    awards.append({'type': 'points', 'points': rule['points'], 'label': rule['label']})
            _, created = CheckIn.objects.get_or_create(user=user, date=today)
            if created:
                awards.append({'type': 'checkin', 'streak': checkin_status(user)['current']})
            for badge in _badge_awards(user, cats={rule['cat'], 'core'}):
                awards.append({'type': 'badge', 'code': badge['code'], 'name': badge['name'],
                               'icon': badge['icon']})
    except Exception:
        logger.exception('激励记录失败 code=%s user=%s', code, getattr(user, 'pk', None))
        return []
    _attach(request, awards)
    return awards


def _attach(request, awards):
    """把本次 awards 挂到请求上，AJAX 视图用 take_awards 取走放进响应。"""
    if request is not None and awards:
        if not hasattr(request, 'incentive_awards'):
            request.incentive_awards = []
        request.incentive_awards.extend(awards)


def take_awards(request):
    """取出并清空本次请求累积的 awards；没有则返回 None（视图可不带 rewards 字段）。"""
    awards = getattr(request, 'incentive_awards', None)
    if awards:
        request.incentive_awards = []
        return awards
    return None


def summarize_awards(awards):
    """awards → 一句话（表单保存路径拼进 messages 用）；没有则空字符串。"""
    if not awards:
        return ''
    parts = []
    points = sum(item['points'] for item in awards if item['type'] == 'points')
    if points:
        parts.append(f'获得 {points} 积分')
    for item in awards:
        if item['type'] == 'checkin':
            parts.append(f'连续打卡 {item["streak"]} 天')
        elif item['type'] == 'badge':
            parts.append(f'点亮勋章「{item["name"]}」{item["icon"]}')
    return '，' + '，'.join(parts) + '！'


def _badge_awards(user, stats=None, *, cats=None):
    """补发满足条件的勋章（可按事件分类定向刷新），返回新点亮的定义列表。"""
    if stats is None:
        stats = stats_for(user)
    owned = set(BadgeAward.objects.filter(user=user).values_list('badge', flat=True))
    fresh = []
    for badge in BADGES:
        if badge['code'] in owned:
            continue
        if cats is not None and not set(badge['cats']) & cats:
            continue
        if stats.get(badge['key'], 0) >= badge['target']:
            _, created = BadgeAward.objects.get_or_create(user=user, badge=badge['code'])
            if created:
                fresh.append(badge)
    return fresh


def refresh_badges(user):
    """全量补发勋章（首页/奖励页不用，管理命令与测试用）。"""
    return _badge_awards(user)


# ---------------------------------------------------------------------------
# 口径与统计
# ---------------------------------------------------------------------------

def checkin_status(user, *, today=None):
    """打卡概览：今天是否已打卡、当前连续、最长连续、总天数与日期集合。"""
    today = today or timezone.localdate()
    dates = set(CheckIn.objects.filter(user=user).values_list('date', flat=True))
    current = 0
    day = today if today in dates else today - timedelta(days=1)
    while day in dates:
        current += 1
        day -= timedelta(days=1)
    best = run = 0
    previous = None
    for date in sorted(dates):
        run = run + 1 if previous is not None and date == previous + timedelta(days=1) else 1
        best = max(best, run)
        previous = date
    return {'checked_today': today in dates, 'current': current, 'best': best,
            'days': len(dates), 'dates': dates, 'today': today}


def stats_for(user):
    """勋章判定与展示的口径集合：全部取源数据表计数，各项含义各自明确。"""
    from chain.models import GameRound
    from hanzi.models import PolyphoneAnswer
    from idioms.models import PlayRecord
    from learning.models import Progress
    from phrases.models import PhraseAnswer
    from plurals.models import PluralAnswer
    from poetry.models import FeihualingRound
    from questionbank.models import AnswerRecord
    from words.models import WordProgress
    from writing.models import WritingDraft

    points = PointEvent.objects.filter(user=user).aggregate(
        earned=Sum('points', filter=Q(points__gt=0) & ~Q(code='redeem_refund')), balance=Sum('points'))
    checkin = checkin_status(user)
    quiz = PlayRecord.objects.filter(user=user, game=PlayRecord.Game.QUIZ).aggregate(total=Sum('correct'))
    finished = GameRound.objects.filter(user=user, status=GameRound.Status.FINISHED).exclude(ended_reason='')
    codes = set(PointEvent.objects.filter(user=user).values_list('code', flat=True))
    return {
        'points_earned': points['earned'] or 0,
        'balance': points['balance'] or 0,
        'checkin_days': checkin['days'],
        'streak_best': checkin['best'],
        'streak_current': checkin['current'],
        'textbook_mastered': Progress.objects.filter(user=user, status='mastered').count(),
        'words_learned': WordProgress.objects.filter(user=user, learned=True).count(),
        'idiom_quiz_correct': quiz['total'] or 0,
        'idiom_rounds': PlayRecord.objects.filter(
            user=user, game__in=(PlayRecord.Game.PAIRS, PlayRecord.Game.EMOJI)).count(),
        'chain_best': finished.order_by('-score').values_list('score', flat=True).first() or 0,
        'chain_rounds': finished.count(),
        'feihualing_completed': FeihualingRound.objects.filter(user=user, result='completed').count(),
        'polyphone_correct': PolyphoneAnswer.objects.filter(user=user, correct=True).count(),
        'plural_correct': PluralAnswer.objects.filter(user=user, correct=True).count(),
        'phrase_correct': PhraseAnswer.objects.filter(user=user, correct=True).count(),
        'questionbank_correct': AnswerRecord.objects.filter(user=user, correct=True).count(),
        'writing_drafts': WritingDraft.objects.filter(user=user).count(),
        'families': len(event_cats(codes) & set(FAMILY_CATS)),
    }


def level_for(points_earned):
    """累计获得分 → (当前称号, 下一称号或 None)。"""
    current = LEVELS[0]
    for level in LEVELS:
        if points_earned >= level['since']:
            current = level
    nxt = next((level for level in LEVELS if level['since'] > points_earned), None)
    return current, nxt


def badge_overview(user, stats=None):
    """勋章墙数据：每枚勋章附已点亮与否与进度 (current, target)。"""
    stats = stats if stats is not None else stats_for(user)
    owned = set(BadgeAward.objects.filter(user=user).values_list('badge', flat=True))
    return [{'code': badge['code'], 'name': badge['name'], 'icon': badge['icon'],
             'tier': badge['tier'], 'tier_label': {'bronze': '铜', 'silver': '银', 'gold': '金'}[badge['tier']],
             'description': badge['description'], 'earned': badge['code'] in owned,
             'current': min(stats.get(badge['key'], 0), badge['target']),
             'target': badge['target']}
            for badge in BADGES]


def home_summary(user):
    """首页激励条的轻量汇总（积分、称号、打卡连击），不碰勋章墙。"""
    points = PointEvent.objects.filter(user=user).aggregate(
        earned=Sum('points', filter=Q(points__gt=0) & ~Q(code='redeem_refund')), balance=Sum('points'))
    checkin = checkin_status(user)
    current, _ = level_for(points['earned'] or 0)
    return {'balance': points['balance'] or 0, 'earned': points['earned'] or 0,
            'level': current, 'checkin': checkin}


# ---------------------------------------------------------------------------
# 兑换与核销
# ---------------------------------------------------------------------------

@transaction.atomic
def redeem(user, item_id):
    """兑换一个奖励：扣积分、落兑换记录（待核销）。失败抛 RedemptionError。"""
    item = RewardItem.objects.select_for_update().filter(pk=item_id, is_active=True).first()
    if item is None:
        raise RedemptionError('这个奖励现在不能兑换，请看看别的奖励吧。')
    # 锁用户行串行化同一账号的并发兑换；余额来自流水求和，账实永不分离。
    _lock_account(user.pk)
    balance = PointEvent.objects.filter(user=user).aggregate(total=Sum('points'))['total'] or 0
    if balance < item.cost:
        raise RedemptionError(f'积分还差 {item.cost - balance} 分，再学一学就能兑换啦。')
    redemption = Redemption.objects.create(user=user, item=item, item_name=item.name, cost=item.cost)
    PointEvent.objects.create(user=user, code='redeem', points=-item.cost, note=f'兑换「{item.name}」')
    return redemption


def _resolve_pending(redemption, status, note):
    resolved = {'status': status, 'resolved_at': timezone.now(), 'resolved_note': note or ''}
    if not Redemption.objects.filter(pk=redemption.pk, status=Redemption.Status.PENDING).update(**resolved):
        return None
    for field, value in resolved.items():
        setattr(redemption, field, value)
    return redemption


def mark_redemption_done(redemption, note=''):
    """家长核销：只有仍在等待的兑换可标记完成。"""
    return _resolve_pending(redemption, Redemption.Status.DONE, note)


@transaction.atomic
def cancel_redemption(redemption, note=''):
    """家长取消：记录退回，并把积分原路退回流水。"""
    _lock_account(redemption.user_id)
    if not _resolve_pending(redemption, Redemption.Status.CANCELLED, note):
        return None
    PointEvent.objects.create(user=redemption.user, code='redeem_refund', points=redemption.cost,
                              note=f'退回「{redemption.item_name}」')
    return redemption

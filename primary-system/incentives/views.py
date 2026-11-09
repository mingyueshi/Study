"""「我的奖励」页与兑换端点。

页面 GET 只读（打卡由学习动作自动产生，没有手动签到端点）；兑换是普通
表单 POST，成功与失败都走 Django messages 提示后回到本页。
"""
import calendar
from datetime import timedelta

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from django.utils import timezone
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_POST

from . import services
from .models import PointEvent, Redemption, RewardItem
from .rules import EVENT_RULES

# 日历表头：周一 → 周日
WEEK_HEADERS = ('一', '二', '三', '四', '五', '六', '日')


def _calendar_rows(checked_dates, today):
    """当月打卡日历：周一开头的月历格，前后补相邻月的占位格。"""
    first = today.replace(day=1)
    total = calendar.monthrange(first.year, first.month)[1]
    row = [{'in_month': False, 'checked': False, 'is_today': False, 'day': ''}
           for _ in range(first.weekday())]  # 周一=0
    rows = []
    for day in range(1, total + 1):
        current = first.replace(day=day)
        row.append({'in_month': True, 'checked': current in checked_dates,
                    'is_today': current == today, 'day': day})
        if len(row) == 7:
            rows.append(row)
            row = []
    if row:
        row += [{'in_month': False, 'checked': False, 'is_today': False, 'day': ''}] * (7 - len(row))
        rows.append(row)
    return rows


@never_cache
@login_required
def rewards(request):
    user = request.user
    stats = services.stats_for(user)
    checkin = services.checkin_status(user)
    current_level, next_level = services.level_for(stats['points_earned'])
    today = timezone.localdate()
    # 各事件今日已发次数：规则说明区展示「每日上限（今日已用）」。
    used_today = {code: PointEvent.objects.filter(user=user, code=code, created_at__date=today).count()
                  for code, rule in EVENT_RULES.items() if not rule.get('manual')}
    rules_rows = [{'label': rule['label'], 'points': rule['points'], 'cap': rule['daily_cap'],
                   'today_used': used_today.get(code, 0)}
                  for code, rule in EVENT_RULES.items() if not rule.get('manual')]
    badges = services.badge_overview(user, stats=stats)
    balance = stats['balance']
    context = {
        'summary': {
            'balance': balance,
            'earned': stats['points_earned'],
            'level': current_level,
            'next_level': next_level,
            'level_progress': (min(stats['points_earned'], next_level['since']) - current_level['since'])
            if next_level else None,
            'level_span': (next_level['since'] - current_level['since']) if next_level else None,
            'next_gap': (next_level['since'] - stats['points_earned']) if next_level else None,
        },
        'checkin': {'current': stats['streak_current'], 'best': stats['streak_best'],
                    'days': stats['checkin_days']},
        'checked_today': checkin['checked_today'],
        'calendar_rows': _calendar_rows(checkin['dates'], today),
        'week_headers': WEEK_HEADERS,
        'badges': badges,
        'earned_badges': sum(1 for badge in badges if badge['earned']),
        'items': [{'item': item, 'can_redeem': balance >= item.cost}
                  for item in RewardItem.objects.filter(is_active=True)],
        'redemptions': Redemption.objects.filter(user=user)[:10],
        'events': PointEvent.objects.filter(user=user)[:20],
        'rules_rows': rules_rows,
    }
    return render(request, 'incentives/rewards.html', context)


@never_cache
@login_required
@require_POST
def redeem_view(request):
    try:
        item_id = int(request.POST.get('item', ''))
    except ValueError:
        messages.error(request, '没有选中要兑换的奖励。')
        return redirect('rewards')
    try:
        redemption = services.redeem(request.user, item_id)
    except services.RedemptionError as error:
        messages.error(request, str(error))
    else:
        messages.success(request, f'兑换成功！「{redemption.item_name}」已提交，请告诉家长来核销。')
    return redirect('rewards')

"""「我的奖励」页与兑换端点。

页面 GET 只读（打卡由学习动作自动产生，没有手动签到端点）；兑换是普通
表单 POST，成功与失败都走 Django messages 提示后回到本页。
"""
import calendar
from datetime import timedelta
from urllib.parse import urlencode

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Sum
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET, require_POST

from . import services
from .categories import CATEGORY_CODES, OTHER_CATEGORY, REWARD_CATEGORIES, canonical_category
from .models import PointEvent, Redemption, RewardItem
from .rules import EVENT_RULES

# 日历表头：周一 → 周日
WEEK_HEADERS = ('一', '二', '三', '四', '五', '六', '日')


def _shop_url(category='', *, anchor=False):
    category = canonical_category(category)
    path = reverse('rewards-shop')
    if category in CATEGORY_CODES or category == 'other':
        path += '?' + urlencode({'category': category})
    return path + ('#reward-shop' if anchor else '')


def _shop_context(user, balance, category=''):
    rows = [{'item': item, 'can_redeem': user.is_authenticated and balance >= item.cost}
            for item in RewardItem.objects.filter(is_active=True)]
    grouped = {code: [] for code in (*CATEGORY_CODES, 'other')}
    for row in rows:
        code = canonical_category(row['item'].category)
        code = code if code in CATEGORY_CODES else 'other'
        grouped[code].append(row)
    categories = (*REWARD_CATEGORIES, OTHER_CATEGORY) if grouped['other'] else REWARD_CATEGORIES
    category = canonical_category(category)
    selected = category if category in {code for code, _name, _icon in categories} else ''
    filters = [{'code': code, 'name': name, 'icon': icon, 'count': len(grouped[code]),
                'url': _shop_url(code, anchor=True)} for code, name, icon in categories]
    groups = [{**entry, 'items': grouped[entry['code']]} for entry in filters
              if grouped[entry['code']] and (not selected or selected == entry['code'])]
    return {
        'items': grouped[selected] if selected else rows,
        'category_filters': filters, 'category_groups': groups,
        'selected_category': selected,
        'selected_category_name': next((entry['name'] for entry in filters if entry['code'] == selected), ''),
        'all_categories_url': _shop_url(anchor=True),
        'shop_login_url': reverse('login') + '?' + urlencode({'next': _shop_url(selected)}),
        'total_rewards': len(rows), 'has_rewards': bool(rows),
        'redemptions': Redemption.objects.filter(user=user)[:10] if user.is_authenticated else Redemption.objects.none(),
    }


@never_cache
@require_GET
def shop(request):
    balance = None
    if request.user.is_authenticated:
        balance = PointEvent.objects.filter(user=request.user).aggregate(value=Sum('points'))['value'] or 0
    return render(request, 'incentives/shop.html', {
        'summary': {'balance': balance}, 'shop_page': True,
        **_shop_context(request.user, balance, request.GET.get('category', '')),
    })


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
        'calendar_month': today,
        'calendar_rows': _calendar_rows(checkin['dates'], today),
        'week_headers': WEEK_HEADERS,
        'badges': badges,
        'earned_badges': sum(1 for badge in badges if badge['earned']),
        **_shop_context(user, balance),
        'events': PointEvent.objects.filter(user=user)[:20],
        'rules_rows': rules_rows,
    }
    return render(request, 'incentives/rewards.html', context)


@never_cache
@login_required
@require_POST
def redeem_view(request):
    destination = 'rewards-shop' if request.POST.get('return_to') == 'shop' else 'rewards'
    if destination == 'rewards-shop':
        destination = _shop_url(request.POST.get('category', ''))
    try:
        item_id = int(request.POST.get('item', ''))
    except ValueError:
        messages.error(request, '没有选中要兑换的奖励。')
        return redirect(destination)
    try:
        redemption = services.redeem(request.user, item_id)
    except services.RedemptionError as error:
        messages.error(request, str(error))
    else:
        messages.success(request, f'兑换成功！「{redemption.item_name}」已提交，请告诉家长来核销。')
    return redirect(destination)

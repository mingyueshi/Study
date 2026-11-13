"""后台动态统计：只聚合当前管理员可查看的模型，不读取个人正文或答案。"""
from datetime import datetime, time, timedelta
from urllib.parse import urlencode

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.urls import reverse
from django.utils import timezone

from catalog.models import ContentItem
from incentives.models import CheckIn, Redemption
from learning.models import Progress
from questionbank.models import AnswerRecord, Question


PERIODS = (7, 30, 90)


def build_dashboard(request, site, *, now=None):
    raw_period = request.GET.get('period', '30')
    period = int(raw_period) if raw_period in {'7', '30', '90'} else 30
    now = now or timezone.localtime()
    today = now.date()
    first_day = today - timedelta(days=period - 1)
    dates = [first_day + timedelta(days=offset) for offset in range(period)]
    start = timezone.make_aware(datetime.combine(first_day, time.min))
    end = timezone.make_aware(datetime.combine(today + timedelta(days=1), time.min))
    metrics, charts, tasks = [], [], []

    def visible(model):
        model_admin = site._registry.get(model)
        if model_admin and model_admin.has_module_permission(request) and (
            model_admin.has_view_permission(request) or model_admin.has_change_permission(request)
        ):
            return model_admin.get_queryset(request)
        return None

    def model_url(model, **filters):
        opts = model._meta
        url = reverse(f'{site.name}:{opts.app_label}_{opts.model_name}_changelist')
        return f'{url}?{urlencode(filters)}' if filters else url

    def metric(key, label, value, note, model, **filters):
        metrics.append({'key': key, 'label': label, 'value': value, 'note': note,
                        'url': model_url(model, **filters)})

    def chart(key, title, note, kind, labels, series):
        # 图表与无脚本数据表共用同一份聚合结果，日期零补齐。
        charts.append({
            'key': key, 'title': title, 'note': note, 'type': kind, 'labels': labels,
            'series': [{'label': label, 'data': values} for label, values in series],
            'rows': [{'label': label, 'values': [values[i] for _, values in series]}
                     for i, label in enumerate(labels)],
            'has_data': any(value for _, values in series for value in values),
        })

    users = visible(get_user_model())
    if users is not None:
        metric('learners', '学习账号', users.filter(is_staff=False, is_active=True).count(),
               '当前启用的非管理账号', get_user_model(), is_staff__exact=0, is_active__exact=1)

    checkins = visible(CheckIn)
    if checkins is not None:
        window = checkins.filter(date__gte=first_day, date__lte=today)
        metric('active', '打卡人数', window.values('user_id').distinct().count(),
               f'近 {period} 天按账号去重', CheckIn, date__gte=first_day, date__lte=today)
        by_day = dict(window.order_by().values('date').annotate(total=Count('pk')).values_list('date', 'total'))
        chart('activity', '每天有多少人在学习', '有计分的学习动作自动打卡，同一账号每天只记一次。',
              'line', [day.isoformat() for day in dates], [('打卡人数', [by_day.get(day, 0) for day in dates])])

    answers = visible(AnswerRecord)
    if answers is not None:
        window = answers.filter(created_at__gte=start, created_at__lt=end)
        scored = ~Q(question__type=Question.Type.SELFCHECK)
        counts = window.aggregate(total=Count('pk'), scored=Count('pk', filter=scored),
                                  correct=Count('pk', filter=scored & Q(correct=True)))
        date_filters = {'created_at__gte': start.isoformat(), 'created_at__lt': end.isoformat()}
        metric('answers', '题库作答', counts['total'], f'近 {period} 天，含游客与自评题', AnswerRecord, **date_filters)
        rate = f"{counts['correct'] / counts['scored'] * 100:.1f}%" if counts['scored'] else '—'
        metric('accuracy', '客观题正确率', rate, '选择题与判断题，自评题不计入', AnswerRecord, **date_filters)
        grouped = window.order_by().annotate(day=TruncDate('created_at')).values('day').annotate(
            correct_count=Count('pk', filter=scored & Q(correct=True)),
            wrong_count=Count('pk', filter=scored & Q(correct=False)),
            self_count=Count('pk', filter=Q(question__type=Question.Type.SELFCHECK)),
        )
        by_day = {row['day']: row for row in grouped}
        chart('answers', '题库练习趋势', '按作答时间统计，含游客；自评题单独展示，不用于正确率。',
              'bar', [day.isoformat() for day in dates],
              [(label, [by_day.get(day, {}).get(field, 0) for day in dates])
               for label, field in [('答对', 'correct_count'), ('答错', 'wrong_count'), ('自评', 'self_count')]])

    content = visible(ContentItem)
    if content is not None:
        counts = dict(content.order_by().values('status').annotate(total=Count('pk')).values_list('status', 'total'))
        metric('published', '已发布内容', counts.get(ContentItem.Status.PUBLISHED, 0),
               '当前数据库内容，不含文件型专题', ContentItem, status__exact=ContentItem.Status.PUBLISHED)
        chart('content', '内容发布情况', '当前内容状态快照；已发布内容能否在前台展示还取决于教材编排和入口状态。',
              'doughnut', [label for _, label in ContentItem.Status.choices],
              [('内容数', [counts.get(value, 0) for value, _ in ContentItem.Status.choices])])
        tasks.append({'label': '待整理的内容草稿', 'count': counts.get(ContentItem.Status.DRAFT, 0),
                      'url': model_url(ContentItem, status__exact=ContentItem.Status.DRAFT)})

    questions = visible(Question)
    if questions is not None:
        counts = dict(questions.filter(active=True).order_by().values('area').annotate(total=Count('pk')).values_list('area', 'total'))
        chart('questions', '可用题目储备', '当前启用的题库题目，按学科统计，包含普通与奥数题目。',
              'bar', [label for _, label in Question.Area.choices],
              [('启用题数', [counts.get(value, 0) for value, _ in Question.Area.choices])])

    progress = visible(Progress)
    if progress is not None:
        counts = dict(progress.order_by().values('status').annotate(total=Count('pk')).values_list('status', 'total'))
        chart('progress', '教材掌握情况', '当前已建立的学习进度记录；未建立记录的账号与内容组合不计入。',
              'doughnut', [label for _, label in Progress.Status.choices],
              [('进度记录', [counts.get(value, 0) for value, _ in Progress.Status.choices])])

    redemptions = visible(Redemption)
    if redemptions is not None:
        pending = redemptions.filter(status=Redemption.Status.PENDING).count()
        metric('pending', '待核销兑换', pending, '全部尚未处理的兑换记录', Redemption, status__exact=Redemption.Status.PENDING)
        tasks.append({'label': '等待安排的奖励兑换', 'count': pending,
                      'url': model_url(Redemption, status__exact=Redemption.Status.PENDING)})
        window = redemptions.filter(requested_at__gte=start, requested_at__lt=end)
        counts = dict(window.order_by().values('status').annotate(total=Count('pk')).values_list('status', 'total'))
        chart('rewards', '奖励兑换进展', f'近 {period} 天申请的兑换，按当前处理状态统计。',
              'bar', [label for _, label in Redemption.Status.choices],
              [('兑换次数', [counts.get(value, 0) for value, _ in Redemption.Status.choices])])

    return {
        'period': period, 'periods': PERIODS, 'start': first_day.isoformat(), 'end': today.isoformat(),
        'updated_at': now.strftime('%Y-%m-%d %H:%M:%S'), 'metrics': metrics, 'charts': charts, 'tasks': tasks,
    }

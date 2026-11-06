from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import transaction
from django.urls import reverse
from django.utils import timezone
from .models import Progress

class ProgressConflict(Exception):
    pass


def effective_status(progress, resolver=None):
    if progress.status != 'mastered':
        return progress.status
    from lexicon.chinese import LessonResolver
    resolver = resolver or LessonResolver([progress.item])
    links = resolver.by_content.get(progress.item_id, [])
    if not links:
        return progress.status
    if progress.seen_lexicon is None:
        return 'needs_confirmation'
    # Existing selections can only move through explicitly equivalent changes.
    if {x['link_id'] for x in progress.seen_lexicon} != {l.pk for l in links}:
        return 'needs_confirmation'
    if not all(resolver.payloads[l.pk]['available'] for l in links):
        return 'needs_confirmation'
    return 'mastered'


def progress_data(progress=None):
    return {'revision': progress.revision if progress else 0,
            'status': progress.status if progress else 'new',
            'effective_status': effective_status(progress) if progress else 'new',
            'bookmarked': progress.bookmarked if progress else False,
            'note': progress.note if progress else ''}


def effective_label(progress, resolver=None):
    """对外展示的状态文案：与「我的学习」列表同一口径。"""
    effective = effective_status(progress, resolver)
    return '历史掌握，依据待确认' if effective == 'needs_confirmation' else progress.get_status_display()


def textbook_summary(user):
    """总览卡口径：教材掌握数与学科分布，复用 effective_status 的当前有效状态。

    首页与「我的学习」共用这份汇总（设计基线：详情、个人页、首页共用当前
    有效状态计算），只展示含义明确的计数，不做跨学科掌握百分比。
    """
    from catalog.models import published_items
    from lexicon.chinese import LessonResolver

    rows = list(Progress.objects.filter(user=user, item__in=published_items())
                .select_related('item__module__subject'))
    resolver = LessonResolver([row.item for row in rows])
    week_cutoff = timezone.now() - timedelta(days=7)
    started = mastered = bookmarked = week = 0
    subjects = {}
    for row in rows:
        started += row.status != 'new'
        bookmarked += row.bookmarked
        week += row.updated_at >= week_cutoff
        if effective_status(row, resolver) == 'mastered':
            mastered += 1
            name = row.item.module.subject.name
            subjects[name] = subjects.get(name, 0) + 1
    return {'started': started, 'mastered': mastered, 'bookmarked': bookmarked, 'week': week,
            'subjects': sorted(subjects.items(), key=lambda kv: (-kv[1], kv[0]))}


def textbook_recent(user, limit=8):
    """教材最近学习行（学习足迹动态流用），按更新时间取最近的若干条。"""
    from catalog.models import published_items
    from lexicon.chinese import LessonResolver

    rows = list(Progress.objects.filter(user=user, item__in=published_items())
                .select_related('item').order_by('-updated_at')[:limit])
    resolver = LessonResolver([row.item for row in rows])
    return [{'title': row.item.title, 'note': effective_label(row, resolver),
             'when': row.updated_at, 'url': reverse('item', args=[row.item.pk])}
            for row in rows]


@transaction.atomic
def save_progress(user, item, data):
    from lexicon.chinese import content_presentation, selected_payload
    from lexicon.models import ContentEntryLink
    from django.core.exceptions import ValidationError
    try:
        links, tokens = content_presentation(item, lock=True)
    except ValidationError as exc:
        raise ProgressConflict('; '.join(exc.messages)) from exc
    import json
    if links and json.dumps(data.get('presentation'), sort_keys=True) != json.dumps(tokens, sort_keys=True):
        raise ProgressConflict('所见教材词义或中文呈现已更新，请刷新后重新确认。')
    get_user_model().objects.select_for_update().get(pk=user.pk)
    progress = Progress.objects.filter(user=user, item=item).first()
    if data['revision'] != (progress.revision if progress else 0):
        raise ProgressConflict('这条记录已在其他页面更新。请重新打开页面核对后再保存。')
    if progress is None:
        progress = Progress(user=user, item=item)
    update_learning = data.get('update_learning') is True if links else True
    if update_learning:
        if links and not all(selected_payload(l)[0] for l in links):
            raise ProgressConflict('词义或中文待复核，暂不能确认新的学习状态；收藏和笔记可单独保存。')
        progress.status = data['status']
        if links:
            progress.seen_lexicon = tokens
    for field in ('bookmarked', 'note'):
        setattr(progress, field, data[field])
    if links:
        ContentEntryLink.objects.filter(pk__in=[l.pk for l in links]).update(semantic_established=True)
    progress.revision += 1
    progress.full_clean()
    progress.save()
    return progress

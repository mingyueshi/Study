from django.contrib.auth import get_user_model
from django.db import transaction
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

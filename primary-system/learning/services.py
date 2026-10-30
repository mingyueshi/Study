from django.contrib.auth import get_user_model
from django.db import transaction
from .models import Progress

class ProgressConflict(Exception):
    pass


def progress_data(progress=None):
    return {
        'revision': progress.revision if progress else 0,
        'status': progress.status if progress else 'new',
        'bookmarked': progress.bookmarked if progress else False,
        'note': progress.note if progress else '',
    }


@transaction.atomic
def save_progress(user, item, data):
    # Serialize first-write creation as well as updates. SQLite uses IMMEDIATE;
    # PostgreSQL locks the account row. The client never chooses the owner.
    get_user_model().objects.select_for_update().get(pk=user.pk)
    progress = Progress.objects.filter(user=user, item=item).first()
    if data['revision'] != (progress.revision if progress else 0):
        raise ProgressConflict('这条记录已在其他页面更新。请重新打开页面核对后再保存。')
    if progress is None:
        progress = Progress(user=user, item=item)
    for field in ('status', 'bookmarked', 'note'):
        setattr(progress, field, data[field])
    progress.revision += 1
    progress.full_clean()
    progress.save()
    return progress

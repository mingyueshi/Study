from django.conf import settings
from django.db import models


class BookProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    book = models.CharField('册次', max_length=12)
    read_points = models.JSONField('已读知识点', default=list)
    learned = models.JSONField('已掌握知识点', default=list)
    last_unit = models.CharField('上次学习的单元', max_length=64, blank=True)
    local_imported = models.BooleanField('已导入本机进度', default=False)
    revision = models.PositiveIntegerField('版本', default=0)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=('user', 'book'), name='mathbook_progress_user_book_unique'),
        ]

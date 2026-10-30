from django.conf import settings
from django.db import models

class Progress(models.Model):
    class Status(models.TextChoices):
        NEW = 'new', '未开始'
        LEARNING = 'learning', '学习中'
        MASTERED = 'mastered', '已掌握'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='学习账号', on_delete=models.CASCADE)
    item = models.ForeignKey('catalog.ContentItem', verbose_name='学习内容', on_delete=models.PROTECT)
    status = models.CharField('掌握状态', max_length=12, choices=Status.choices, default=Status.NEW)
    bookmarked = models.BooleanField('已收藏', default=False)
    note = models.TextField('个人笔记', blank=True, max_length=4000)
    revision = models.PositiveIntegerField('版本', default=0)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '学习进度'
        verbose_name_plural = '学习进度'
        ordering = ('-updated_at',)
        constraints = [
            models.UniqueConstraint(fields=('user', 'item'), name='progress_user_item_unique'),
            models.CheckConstraint(condition=models.Q(status__in=['new', 'learning', 'mastered']), name='progress_valid_status'),
        ]
        indexes = [models.Index(fields=('user', 'status'), name='progress_user_status')]

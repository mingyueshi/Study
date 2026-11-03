import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q


class WritingDraft(models.Model):
    """作文草稿：登录写作挂账号，游客挂浏览器会话键（与场景单词/接龙同双轨）。

    游客草稿不合并进账号；题目通过 topic_title 字符串弱引用，题目改名不影响草稿。
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='作者', null=True, blank=True,
                             on_delete=models.CASCADE, related_name='writing_drafts')
    guest_key = models.CharField('游客会话键', max_length=64, blank=True, db_index=True)
    topic_title = models.CharField('题目引用', max_length=120, blank=True)
    title = models.CharField('草稿标题', max_length=120, blank=True)
    content = models.TextField('正文', blank=True)
    revision = models.PositiveIntegerField('版本号', default=0)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '作文草稿'
        verbose_name_plural = '作文草稿'
        ordering = ('-updated_at', '-pk')
        constraints = [
            models.CheckConstraint(
                condition=(Q(user__isnull=False) & Q(guest_key=''))
                          | (Q(user__isnull=True) & ~Q(guest_key='')),
                name='writing_draft_owner_exclusive'),
        ]
        indexes = [models.Index(fields=('guest_key',), name='writing_draft_guest_idx')]

    def __str__(self):
        return f'{self.title or "未命名"}（{self.user or "游客 " + self.guest_key[:8]}）'

    def clean(self):
        if self.content and len(self.content) > 20000:
            raise ValidationError({'content': '正文不超过 20000 字。'})
        if self.title and len(self.title) > 120:
            raise ValidationError({'title': '标题不超过 120 字。'})

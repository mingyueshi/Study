"""日常用语练习记录：与不规则复数 PluralAnswer 同范式，一题一条、服务端复核。"""
from django.conf import settings
from django.db import models
from django.db.models import Q


class PhraseAnswer(models.Model):
    """一次「看中文选英文」作答：对错都记，correct 由服务端重算。"""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='答题人', null=True, blank=True,
                             on_delete=models.CASCADE, related_name='phrase_answers')
    guest_key = models.CharField('游客会话键', max_length=64, blank=True, db_index=True)
    phrase = models.CharField('短语编号', max_length=16)
    chosen = models.CharField('所选英文', max_length=200)
    answer = models.CharField('正确英文', max_length=200)
    correct = models.BooleanField('答对', default=False)
    created_at = models.DateTimeField('时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '日常用语作答记录'
        verbose_name_plural = '日常用语作答记录'
        ordering = ('-created_at',)
        indexes = [models.Index(fields=('user', '-updated_at'), name='phrases_user_idx')]
        constraints = [
            models.CheckConstraint(
                condition=(Q(user__isnull=False) & Q(guest_key='')) | (Q(user__isnull=True) & ~Q(guest_key='')),
                name='phrases_owner_exclusive'),
        ]

    def __str__(self):
        owner = self.user or '游客'
        return f'{owner} · {self.phrase} · {"答对" if self.correct else "答错"}'

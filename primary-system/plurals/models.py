"""不规则复数练习记录：与多音字 PolyphoneAnswer 同范式，一题一条、服务端复核。"""
from django.conf import settings
from django.db import models
from django.db.models import Q


class PluralAnswer(models.Model):
    """一次「给单数选复数」作答：对错都记，correct 由服务端重算。"""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='答题人', null=True, blank=True,
                             on_delete=models.CASCADE, related_name='plural_answers')
    guest_key = models.CharField('游客会话键', max_length=64, blank=True, db_index=True)
    singular = models.CharField('单数', max_length=40)
    chosen = models.CharField('所填复数', max_length=40)
    answer = models.CharField('正确复数', max_length=40)
    correct = models.BooleanField('答对', default=False)
    created_at = models.DateTimeField('时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '不规则复数作答记录'
        verbose_name_plural = '不规则复数作答记录'
        ordering = ('-created_at',)
        indexes = [models.Index(fields=('user', '-updated_at'), name='plurals_user_idx')]
        constraints = [
            models.CheckConstraint(
                condition=(Q(user__isnull=False) & Q(guest_key='')) | (Q(user__isnull=True) & ~Q(guest_key='')),
                name='plurals_owner_exclusive'),
        ]

    def __str__(self):
        owner = self.user or '游客'
        return f'{owner} · {self.singular}→{self.chosen} · {"答对" if self.correct else "答错"}'

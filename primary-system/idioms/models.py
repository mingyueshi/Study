"""成语小游戏学习记录：看释义猜成语、成语配对、表情猜猜看。

三个小游戏原先只在前端判分、不落库；这里给每次「完成的题/局」记一条轻量
记录，登录挂账号、游客挂会话键（与接龙对局同双轨）。记录只描述事实——
答了几题、答对几题——不做跨游戏合成。
"""
from django.conf import settings
from django.db import models
from django.db.models import Q


class PlayRecord(models.Model):
    """一题/一局成语小游戏记录：quiz 按题记，pairs 与 emoji 按局记。"""

    class Game(models.TextChoices):
        QUIZ = 'quiz', '看释义猜成语'
        PAIRS = 'pairs', '成语配对'
        EMOJI = 'emoji', '表情猜猜看'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='玩家', null=True, blank=True,
                             on_delete=models.CASCADE, related_name='idiom_plays')
    guest_key = models.CharField('游客会话键', max_length=64, blank=True, db_index=True)
    game = models.CharField('游戏', max_length=10, choices=Game.choices)
    size = models.PositiveSmallIntegerField('题数', default=1)
    correct = models.PositiveSmallIntegerField('答对', default=0)
    extra = models.JSONField('补充信息', default=dict, blank=True)
    created_at = models.DateTimeField('时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '成语小游戏记录'
        verbose_name_plural = '成语小游戏记录'
        ordering = ('-created_at',)
        indexes = [models.Index(fields=('user', '-updated_at'), name='idioms_play_user_idx'),
                   models.Index(fields=('user', 'game'), name='idioms_play_user_game')]
        constraints = [
            models.CheckConstraint(
                condition=(Q(user__isnull=False) & Q(guest_key='')) | (Q(user__isnull=True) & ~Q(guest_key='')),
                name='idioms_play_owner_exclusive'),
            models.CheckConstraint(condition=Q(correct__lte=models.F('size')), name='idioms_play_correct_within_size'),
        ]

    def __str__(self):
        owner = self.user or '游客'
        return f'{owner} · {self.get_game_display()} · {self.correct}/{self.size}'

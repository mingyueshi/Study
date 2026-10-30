import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class ChainWord(models.Model):
    """接龙词池：只登记接龙属性，不改动词库数据；取词始终走词库生效版本。"""

    entry = models.OneToOneField('lexicon.LexicalEntry', verbose_name='基础词条', on_delete=models.PROTECT,
                                 related_name='chain_word', limit_choices_to={'kind': 'idiom'})
    game_eligible = models.BooleanField('可接龙', default=False,
                                        help_text='开启后才会进入成语接龙取词范围。')
    first_char = models.CharField('首字', max_length=1, blank=True,
                                  help_text='留空时保存自动取词头第一个字，可人工改。')
    last_char = models.CharField('尾字', max_length=1, blank=True,
                                 help_text='留空时保存自动取词头最后一个字，可人工改。')
    note = models.TextField('备注', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '接龙词池'
        verbose_name_plural = '接龙词池'
        ordering = ('entry__headword', 'pk')
        indexes = [
            models.Index(fields=('game_eligible', 'first_char'), name='games_eligible_first'),
            models.Index(fields=('game_eligible', 'last_char'), name='games_eligible_last'),
        ]

    def __str__(self):
        return self.entry.headword

    def clean(self):
        if not self.entry_id:
            return
        entry = self.entry
        if entry.kind != 'idiom':
            raise ValidationError({'entry': '接龙词池只收成语词条。'})
        if entry.status in ('merged', 'archived'):
            raise ValidationError({'entry': '已归并或停用的词条不能进入接龙词池。'})
        headword = entry.headword.strip()
        if len(headword) < 2:
            raise ValidationError({'entry': '成语词头至少要有两个字才能参与接龙。'})
        if not self.first_char:
            self.first_char = headword[0]
        if not self.last_char:
            self.last_char = headword[-1]


class GameRound(models.Model):
    """统一账号下的接龙对局；链上每一手都是词池中的成语，首尾字以词池登记为准。"""

    class Status(models.TextChoices):
        PLAYING = 'playing', '进行中'
        FINISHED = 'finished', '已结束'

    class EndedReason(models.TextChoices):
        PARTNER_STUCK = 'partner_stuck', '陪练无词可接，玩家获胜'
        PLAYER_STUCK = 'player_stuck', '玩家无词可接，本局结束'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='玩家', on_delete=models.CASCADE,
                             related_name='chain_rounds')
    chain = models.JSONField('接龙链', default=list)
    score = models.PositiveIntegerField('得分', default=0)
    hints = models.PositiveIntegerField('提示次数', default=0)
    revision = models.PositiveIntegerField('版本', default=0)
    status = models.CharField('状态', max_length=10, choices=Status.choices, default=Status.PLAYING)
    ended_reason = models.CharField('结束原因', max_length=20, blank=True, choices=EndedReason.choices)
    created_at = models.DateTimeField('开始时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    finished_at = models.DateTimeField('结束时间', null=True, blank=True)

    class Meta:
        verbose_name = '成语接龙对局'
        verbose_name_plural = '成语接龙对局'
        ordering = ('-created_at',)
        indexes = [models.Index(fields=('user', 'status', '-updated_at'), name='games_round_user_status')]

    def __str__(self):
        return f'{self.user} · {len(self.chain)} 手 · {self.get_status_display()}'

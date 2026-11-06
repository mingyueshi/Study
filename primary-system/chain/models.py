import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q


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
    """接龙对局：登录玩家挂账号，游客挂浏览器会话键；链上每一手都是词池中的成语。

    mode=solo 时 score 是玩家对小龙陪练的得分；mode=duel（家长对决，同屏轮流）
    时 score 记孩子（p1）、p2_score 记家长（p2），chain 每手 by 为 p1/p2。
    """

    class Status(models.TextChoices):
        PLAYING = 'playing', '进行中'
        FINISHED = 'finished', '已结束'

    class Mode(models.TextChoices):
        SOLO = 'solo', '和小龙陪练'
        DUEL = 'duel', '家长对决'

    class FirstPlayer(models.TextChoices):
        P1 = 'p1', '孩子'
        P2 = 'p2', '家长'

    class EndedReason(models.TextChoices):
        PARTNER_STUCK = 'partner_stuck', '陪练无词可接，玩家获胜'
        PLAYER_STUCK = 'player_stuck', '玩家无词可接，本局结束'
        P2_STUCK = 'p2_stuck', '家长无词可接，孩子获胜'
        P1_STUCK = 'p1_stuck', '孩子无词可接，家长获胜'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='玩家', null=True, blank=True,
                             on_delete=models.CASCADE, related_name='chain_rounds')
    guest_key = models.CharField('游客会话键', max_length=64, blank=True, db_index=True,
                                 help_text='未登录对局的归属标识；随浏览器会话过期失效。')
    mode = models.CharField('模式', max_length=5, choices=Mode.choices, default=Mode.SOLO)
    first_player = models.CharField('先手方', max_length=2, choices=FirstPlayer.choices,
                                    default=FirstPlayer.P1, help_text='家长对决专用：开局词之后谁先接。')
    chain = models.JSONField('接龙链', default=list)
    score = models.PositiveIntegerField('得分', default=0)
    p2_score = models.PositiveIntegerField('家长得分', default=0)
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
        constraints = [models.CheckConstraint(
            condition=(Q(user__isnull=False) & Q(guest_key='')) | (Q(user__isnull=True) & ~Q(guest_key='')),
            name='games_round_owner_exclusive')]

    def __str__(self):
        owner = self.user or '游客'
        return f'{owner} · {len(self.chain)} 手 · {self.get_status_display()}'

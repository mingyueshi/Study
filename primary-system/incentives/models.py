"""激励系统的五张表：积分流水、打卡、勋章、奖励项与兑换记录。

积分是单一账本（PointEvent 正负流水，余额即求和），兑换只追加流水不动历史；
勋章定义在 ``rules.py`` 代码里，库里只存「谁点亮了哪枚」；打卡由学习动作
自动产生（学习即打卡），没有手动签到端点。激励只服务登录用户——游客没有
积分，与「游客数据永不合并进账号」的既有约定一致。
"""
from django.conf import settings
from django.db import models
from .categories import CATEGORY_CHOICES


class PointEvent(models.Model):
    """一条积分流水：正数为学习所得，负数为兑换扣除；余额是全部流水之和。"""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='玩家',
                             on_delete=models.CASCADE, related_name='point_events')
    code = models.CharField('事件码', max_length=32, db_index=True)
    points = models.IntegerField('积分变动')
    note = models.CharField('说明', max_length=120)
    created_at = models.DateTimeField('时间', auto_now_add=True)

    class Meta:
        verbose_name = '积分流水'
        verbose_name_plural = '积分流水'
        ordering = ('-created_at',)
        indexes = [models.Index(fields=('user', '-created_at'), name='incentive_pt_user_idx'),
                   models.Index(fields=('user', 'code', 'created_at'), name='incentive_pt_code_idx')]

    def __str__(self):
        return f'{self.user} · {self.code} · {self.points:+d}'


class CheckIn(models.Model):
    """一天一条打卡：当天有任何被记分的学习动作即自动打卡。"""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='玩家',
                             on_delete=models.CASCADE, related_name='checkins')
    date = models.DateField('打卡日期')
    created_at = models.DateTimeField('首次活动时间', auto_now_add=True)

    class Meta:
        verbose_name = '学习打卡'
        verbose_name_plural = '学习打卡'
        ordering = ('-date',)
        constraints = [models.UniqueConstraint(fields=('user', 'date'), name='incentives_checkin_user_date')]

    def __str__(self):
        return f'{self.user} · {self.date}'


class BadgeAward(models.Model):
    """一枚已点亮的勋章；勋章定义（名字、图标、条件）在 rules.py 里。"""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='玩家',
                             on_delete=models.CASCADE, related_name='badge_awards')
    badge = models.CharField('勋章代码', max_length=32, db_index=True)
    awarded_at = models.DateTimeField('点亮时间', auto_now_add=True)

    class Meta:
        verbose_name = '勋章'
        verbose_name_plural = '勋章'
        ordering = ('-awarded_at',)
        constraints = [models.UniqueConstraint(fields=('user', 'badge'), name='incentives_badge_user_code')]

    def __str__(self):
        return f'{self.user} · {self.badge}'


class RewardItem(models.Model):
    """家长在后台配置的兑换奖励（如「公园郊游」），孩子用积分兑换。"""

    name = models.CharField('奖励名称', max_length=50)
    category = models.CharField('奖励分类', max_length=20, choices=CATEGORY_CHOICES, blank=True, default='')
    icon = models.CharField('图标', max_length=16, default='🎁')
    cost = models.PositiveIntegerField('所需积分')
    note = models.CharField('说明', max_length=200, blank=True)
    is_active = models.BooleanField('上架中', default=True)
    sort = models.PositiveIntegerField('排序', default=0)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '兑换奖励'
        verbose_name_plural = '兑换奖励'
        ordering = ('sort', 'pk')

    def __str__(self):
        return f'{self.name}（{self.cost} 积分）'


class Redemption(models.Model):
    """一次兑换：下单扣分，家长核销或取消退分。cost 是下单时的积分快照。"""

    class Status(models.TextChoices):
        PENDING = 'pending', '待核销'
        DONE = 'done', '已完成'
        CANCELLED = 'cancelled', '已退回'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='玩家',
                             on_delete=models.CASCADE, related_name='redemptions')
    item = models.ForeignKey(RewardItem, verbose_name='奖励项', on_delete=models.PROTECT,
                             related_name='redemptions')
    item_name = models.CharField('奖励名称快照', max_length=50)
    cost = models.PositiveIntegerField('消耗积分')
    status = models.CharField('状态', max_length=10, choices=Status.choices, default=Status.PENDING)
    requested_at = models.DateTimeField('兑换时间', auto_now_add=True)
    resolved_at = models.DateTimeField('处理时间', null=True, blank=True)
    resolved_note = models.CharField('处理备注', max_length=200, blank=True)

    class Meta:
        verbose_name = '兑换记录'
        verbose_name_plural = '兑换记录'
        ordering = ('-requested_at',)

    def __str__(self):
        return f'{self.user} · {self.item_name} · {self.get_status_display()}'

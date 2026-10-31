from django.conf import settings
from django.db import models
from django.db.models import Q


class Scenario(models.Model):
    """场景：legacy words.html 的一个生活场景（教室/书包/农场……）。"""

    code = models.SlugField('场景标识', max_length=80, unique=True)
    name = models.CharField('场景名（英文）', max_length=120)
    zh = models.CharField('场景名（中文）', max_length=60)
    emoji = models.CharField('场景图标', max_length=8, blank=True)
    color = models.CharField('主题色', max_length=9, default='#4d96ff')
    order = models.PositiveIntegerField('排序', default=0)

    class Meta:
        ordering = ('order', 'pk')
        verbose_name = '场景'
        verbose_name_plural = '场景'

    def __str__(self):
        return f'{self.zh} {self.name}'


class ScenarioWord(models.Model):
    """场景词位：词典为内容源（entry 必挂），教学标注（emoji/拆分/记忆提示/关联词）留在卡上。"""

    en = models.CharField('单词', max_length=80, unique=True)
    entry = models.ForeignKey('lexicon.LexicalEntry', verbose_name='词典词条', on_delete=models.PROTECT,
                              related_name='scenario_words')
    scenario = models.ForeignKey(Scenario, verbose_name='场景', on_delete=models.PROTECT, related_name='words')
    emoji = models.CharField('配图 emoji', max_length=8, blank=True)
    segments = models.JSONField('拆分记忆', default=list, blank=True)
    memo = models.TextField('记忆提示', blank=True)
    related = models.JSONField('关联词原清单', default=list, blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        ordering = ('scenario__order', 'pk')
        verbose_name = '场景单词'
        verbose_name_plural = '场景单词'

    def __str__(self):
        return self.en


class WordProgress(models.Model):
    """掌握标记：登录玩家挂账号，游客挂浏览器会话键（与接龙对局同双轨）。"""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='玩家', null=True, blank=True,
                             on_delete=models.CASCADE, related_name='word_progress')
    guest_key = models.CharField('游客会话键', max_length=64, blank=True, db_index=True)
    word = models.ForeignKey(ScenarioWord, verbose_name='场景单词', on_delete=models.CASCADE,
                             related_name='progress_rows')
    learned = models.BooleanField('已掌握', default=False)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '场景单词掌握记录'
        verbose_name_plural = '场景单词掌握记录'
        constraints = [
            models.UniqueConstraint(fields=('user', 'word'), condition=Q(user__isnull=False),
                                    name='words_progress_user_unique'),
            models.UniqueConstraint(fields=('guest_key', 'word'), condition=Q(guest_key__isnull=False) & ~Q(guest_key=''),
                                    name='words_progress_guest_unique'),
            models.CheckConstraint(
                condition=(Q(user__isnull=False) & Q(guest_key=''))
                          | (Q(user__isnull=True) & ~Q(guest_key='')),
                name='words_progress_owner_exclusive'),
        ]
        indexes = [models.Index(fields=('guest_key', 'word'), name='words_progress_guest_idx')]

    def __str__(self):
        owner = self.user or self.guest_key
        return f'{owner} · {self.word.en} · {"已掌握" if self.learned else "未掌握"}'

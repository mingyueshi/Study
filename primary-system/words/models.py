import uuid
from django.core.exceptions import ValidationError
from django.conf import settings
from django.db import models, transaction
from django.db.models import Q


from lexicon.models import editorial_values


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


class LearningTarget(models.Model):
    """稳定词卡身份；改变词义必须新建目标，不能转移旧掌握记录。"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    label = models.CharField('教学词形', max_length=80)
    capability = models.CharField(max_length=16, default='card', editable=False)
    sense = models.ForeignKey('lexicon.Sense', on_delete=models.PROTECT, null=True, blank=True)
    pronunciation = models.ForeignKey('lexicon.Pronunciation', on_delete=models.PROTECT, null=True, blank=True)
    evidence = models.ForeignKey('lexicon.SourceRecord', on_delete=models.PROTECT, null=True, blank=True)
    editorial_snapshot = models.JSONField('选用时人工修订快照', default=dict, blank=True, editable=False)
    chinese_version = models.ForeignKey('lexicon.ChineseSenseVersion', on_delete=models.PROTECT, null=True, blank=True, editable=False)
    presentation_revision = models.PositiveIntegerField(default=0, editable=False)
    semantic_established = models.BooleanField(default=False, editable=False)
    legacy = models.JSONField('原词卡映射', default=dict, blank=True, editable=False)
    review_note = models.TextField('复核说明', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = '词卡学习目标'
        verbose_name_plural = '词卡学习目标'
        constraints = [models.CheckConstraint(condition=Q(capability='card'), name='words_target_card_only'),
                       models.CheckConstraint(condition=(Q(sense__isnull=True, evidence__isnull=True, pronunciation__isnull=True) | Q(sense__isnull=False, evidence__isnull=False)), name='words_target_evidence_pair')]

    def __str__(self):
        return f'{self.label} / {str(self.pk)[:8]}'

    def clean(self):
        if not self.sense_id and not self.legacy.get('word_id'):
            raise ValidationError('新学习目标必须明确选择义项与来源证据。')
        if bool(self.sense_id) != bool(self.evidence_id):
            raise ValidationError('必须同时选择义项和来源证据。')
        if self.pronunciation_id and (not self.sense_id or self.pronunciation.entry_id != self.sense.entry_id):
            raise ValidationError('读音与义项必须属于同一词条。')
        if self.evidence_id:
            binding = self.evidence.binding
            if (binding.sense_id, binding.pronunciation_id) != (self.sense_id, self.pronunciation_id):
                raise ValidationError('证据必须对应选定的义项和读音。')
        if not self._state.adding:
            old = type(self).objects.get(pk=self.pk)
            if any(getattr(old, field) != getattr(self, field) for field in ('sense_id', 'pronunciation_id', 'evidence_id', 'capability', 'label', 'legacy', 'editorial_snapshot', 'chinese_version_id', 'presentation_revision', 'semantic_established')):
                raise ValidationError('学习目标身份不可改写；请创建新目标，保留原进度。')

    @transaction.atomic
    def save(self, *args, **kwargs):
        if self._state.adding:
            if self.chinese_version_id or self.presentation_revision:
                raise ValidationError('请先建目标，再经显式采用服务选中文。')
            from lexicon.models import Sense, Pronunciation
            # 不能采用调用者缓存的旧修订；与词库修订使用相同行锁。
            if self.sense_id:
                self.sense = Sense.objects.select_for_update().get(pk=self.sense_id)
            if self.pronunciation_id:
                self.pronunciation = Pronunciation.objects.select_for_update().get(pk=self.pronunciation_id)
            self.editorial_snapshot = editorial_values(self.sense, self.pronunciation)
        self.full_clean()
        return super().save(*args, **kwargs)


class ScenarioWord(models.Model):
    """场景编排：target 为学习身份；entry 保留旧引用用于追溯，不用于释义读取。"""

    en = models.CharField('单词', max_length=80)
    target = models.ForeignKey(LearningTarget, on_delete=models.PROTECT, related_name='placements')
    order = models.PositiveIntegerField('词位排序', default=0)
    import_baseline = models.JSONField(default=dict, blank=True, editable=False)
    entry = models.ForeignKey('lexicon.LexicalEntry', verbose_name='词典词条', on_delete=models.PROTECT,
                              related_name='scenario_words')
    scenario = models.ForeignKey(Scenario, verbose_name='场景', on_delete=models.PROTECT, related_name='words')
    emoji = models.CharField('配图 emoji', max_length=8, blank=True)
    segments = models.JSONField('拆分记忆', default=list, blank=True)
    memo = models.TextField('记忆提示', blank=True)
    related = models.JSONField('关联词原清单', default=list, blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        ordering = ('scenario__order', 'order', 'pk')
        constraints = [models.UniqueConstraint(fields=('scenario', 'target'), name='words_scenario_target_unique')]
        verbose_name = '场景单词'
        verbose_name_plural = '场景单词'

    def __str__(self):
        return self.en

    def clean(self):
        if self.target_id and not self.entry_id and self.target.sense_id:
            self.entry_id = self.target.sense.entry_id
        if self.target_id and self.en != self.target.label:
            raise ValidationError('词位词形必须与学习目标一致。')

    @transaction.atomic
    def save(self, *args, **kwargs):
        LearningTarget.objects.filter(pk=self.target_id).update(semantic_established=True)
        self.clean()
        self.full_clean()
        return super().save(*args, **kwargs)


class RelatedGloss(models.Model):
    """拓展词中文释义（legacy WORD_ZH 词典）：关联词不在场景库时的中文翻译来源。"""

    en = models.CharField('拓展词', max_length=80, unique=True)
    zh = models.CharField('中文释义', max_length=120)

    class Meta:
        verbose_name = '拓展词释义'
        verbose_name_plural = '拓展词释义'

    def __str__(self):
        return f'{self.en} = {self.zh}'


class WordProgress(models.Model):
    """掌握标记：登录玩家挂账号，游客挂浏览器会话键（与接龙对局同双轨）。"""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='玩家', null=True, blank=True,
                             on_delete=models.CASCADE, related_name='word_progress')
    guest_key = models.CharField('游客会话键', max_length=64, blank=True, db_index=True)
    target = models.ForeignKey(LearningTarget, on_delete=models.PROTECT, related_name='progress_rows')
    legacy_word_id = models.PositiveBigIntegerField(null=True, blank=True, editable=False)
    revision = models.PositiveIntegerField(default=0)
    word = models.ForeignKey(ScenarioWord, verbose_name='原场景词位', on_delete=models.SET_NULL, null=True, blank=True,
                             related_name='progress_rows')
    seen_chinese_version = models.ForeignKey('lexicon.ChineseSenseVersion', on_delete=models.PROTECT, null=True, blank=True, related_name='+')
    seen_presentation_revision = models.PositiveIntegerField(null=True, blank=True)
    learned = models.BooleanField('已掌握', default=False)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '场景单词掌握记录'
        verbose_name_plural = '场景单词掌握记录'
        constraints = [
            models.UniqueConstraint(fields=('user', 'target'), condition=Q(user__isnull=False),
                                    name='words_progress_user_unique'),
            models.UniqueConstraint(fields=('guest_key', 'target'), condition=Q(guest_key__isnull=False) & ~Q(guest_key=''),
                                    name='words_progress_guest_unique'),
            models.CheckConstraint(
                condition=(Q(user__isnull=False) & Q(guest_key=''))
                          | (Q(user__isnull=True) & ~Q(guest_key='')),
                name='words_progress_owner_exclusive'),
        ]
        indexes = [models.Index(fields=('guest_key', 'target'), name='words_progress_guest_idx')]

    @transaction.atomic
    def save(self, *args, **kwargs):
        LearningTarget.objects.filter(pk=self.target_id).update(semantic_established=True)
        return super().save(*args, **kwargs)

    def __str__(self):
        owner = self.user or self.guest_key
        return f'{owner} · {self.target.label} · {"已掌握" if self.learned else "未掌握"}'


class TargetChineseAdoption(models.Model):
    target = models.ForeignKey(LearningTarget, on_delete=models.PROTECT, related_name='chinese_adoptions')
    version = models.ForeignKey('lexicon.ChineseSenseVersion', on_delete=models.PROTECT)
    revision = models.PositiveIntegerField()
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=('target', 'revision'), name='words_chinese_adoption_revision')]

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise ValidationError('采用历史不可改写。')
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError('采用历史不可删除。')

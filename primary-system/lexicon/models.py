import uuid
import unicodedata
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q


def search_key(text):
    """Search only. Never use this case-folded value as an identity key."""
    return ' '.join(unicodedata.normalize('NFC', text).split()).casefold()


def pinyin_key(text):
    text = unicodedata.normalize('NFD', search_key(text)).replace('u\u0308', 'v')
    return ''.join(c for c in text if not unicodedata.combining(c))


class UUIDModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class LexiconSource(models.Model):
    code = models.SlugField('来源标识', unique=True, max_length=80)
    name = models.CharField('来源名称', max_length=200)
    url = models.URLField('来源网址', blank=True, max_length=500)
    attribution = models.TextField('署名说明', blank=True)
    code_license = models.CharField('代码许可', max_length=120, blank=True)
    data_license = models.CharField('数据许可', max_length=200, blank=True)
    license_url = models.URLField('许可正文链接', max_length=500, blank=True)
    changes = models.TextField('加工与范围说明', blank=True)
    rights_evidence = models.TextField('使用依据与审查记录', blank=True)
    public_allowed = models.BooleanField('已核准公开展示', default=False)
    enabled = models.BooleanField('启用来源', default=True)
    priority = models.PositiveIntegerField('展示优先级（越小越优先）', default=100)
    active_release = models.ForeignKey('SourceRelease', verbose_name='当前生效版本', null=True, blank=True,
                                       on_delete=models.PROTECT, related_name='+', editable=False)

    class Meta:
        verbose_name = '词库来源'
        verbose_name_plural = '词库来源'
        ordering = ('priority', 'code')
        permissions = [('manage_sources', '审查来源、切换版本与公开准入'), ('publish_lexicon', '发布词条与义项')]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self._state.adding:
            fields = kwargs.get('update_fields')
            if fields is not None and ('active_release' in fields or 'active_release_id' in fields):
                raise ValidationError('生效版本只能通过审核切换流程修改。')
            if fields is None:
                # A stale policy form must never roll back a concurrently activated release.
                kwargs['update_fields'] = [f.name for f in self._meta.concrete_fields if not f.primary_key and f.name != 'active_release']
        return super().save(*args, **kwargs)

    def clean(self):
        if self.public_allowed and not all(str(x).strip() for x in (self.data_license, self.rights_evidence, self.attribution)):
            raise ValidationError('公开展示必须填写数据许可、使用依据和署名说明。')
        if self.active_release_id and (self.active_release.source_id != self.pk or self.active_release.status != 'ready'):
            raise ValidationError('只能启用本来源的完整就绪版本。')


class SourceRelease(UUIDModel):
    class Status(models.TextChoices):
        IMPORTING = 'importing', '导入中'
        READY = 'ready', '待审核／可启用'
        FAILED = 'failed', '中断／可重试'

    source = models.ForeignKey(LexiconSource, verbose_name='来源', on_delete=models.PROTECT, related_name='releases')
    version = models.CharField('版本标识', max_length=120)
    checksum = models.CharField('输入 SHA256', max_length=64)
    adapter = models.CharField('适配器与版本', max_length=80)
    source_files = models.JSONField('原始文件摘要', default=dict, blank=True)
    source_snapshot = models.JSONField('导入时来源与许可快照', default=dict, blank=True)
    status = models.CharField('状态', max_length=12, choices=Status.choices, default=Status.IMPORTING)
    total = models.PositiveIntegerField('记录总数', default=0)
    processed = models.PositiveIntegerField('已导入', default=0)
    report = models.JSONField('差异与质量报告', default=dict, blank=True)
    error = models.TextField('中断原因', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    completed_at = models.DateTimeField('完成时间', null=True, blank=True)

    class Meta:
        verbose_name = '来源版本与导入任务'
        verbose_name_plural = '来源版本与导入任务'
        ordering = ('-created_at',)
        constraints = [
            models.UniqueConstraint(fields=('source', 'version'), name='lex_source_version_unique'),
            models.CheckConstraint(condition=Q(processed__lte=F('total')), name='lex_release_progress_valid'),
            models.CheckConstraint(condition=~Q(status='ready') | Q(processed=F('total')), name='lex_release_ready_complete'),
        ]

    def __str__(self):
        return f'{self.source.code} / {self.version}'


class LexicalEntry(UUIDModel):
    class Kind(models.TextChoices):
        CHARACTER = 'character', '汉字'
        WORD = 'word', '词语／单词'
        PHRASE = 'phrase', '短语'
        IDIOM = 'idiom', '成语'

    class Status(models.TextChoices):
        DRAFT = 'draft', '待审'
        PUBLISHED = 'published', '已审可展示'
        ARCHIVED = 'archived', '停用'
        MERGED = 'merged', '已归并'

    language = models.CharField('语言', max_length=20)
    headword = models.CharField('词头／字形', max_length=200)
    lookup_key = models.CharField('检索键（非唯一）', max_length=240, db_index=True, editable=False)
    kind = models.CharField('类型', max_length=12, choices=Kind.choices)
    status = models.CharField('审查状态', max_length=12, choices=Status.choices, default=Status.DRAFT)
    merged_into = models.ForeignKey('self', verbose_name='归并到', on_delete=models.PROTECT, null=True, blank=True, editable=False)
    notes = models.TextField('编辑备注', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '基础词条'
        verbose_name_plural = '基础词条'
        ordering = ('headword', 'id')
        indexes = [models.Index(fields=('language', 'lookup_key'), name='lex_language_lookup')]

    def __str__(self):
        return f'{self.headword} [{self.language}]'

    def save(self, *args, **kwargs):
        self.lookup_key = search_key(self.headword)
        if kwargs.get('update_fields') is not None:
            kwargs['update_fields'] = set(kwargs['update_fields']) | {'lookup_key'}
        return super().save(*args, **kwargs)


class Sense(UUIDModel):
    entry = models.ForeignKey(LexicalEntry, verbose_name='词条', on_delete=models.PROTECT, related_name='senses')
    gloss_language = models.CharField('释义语言', max_length=20, default='zh')
    editorial_definition = models.TextField('人工修订释义', blank=True, help_text='留空使用当前来源；原文不会被覆盖。保存修改后需重新发布。')
    editorial_note = models.TextField('修订说明', blank=True)
    revision = models.PositiveIntegerField('人工修订版本', default=0, editable=False)
    status = models.CharField('审查状态', max_length=12, choices=LexicalEntry.Status.choices[:3], default='draft')

    class Meta:
        verbose_name = '词义与人工修订'
        verbose_name_plural = '词义与人工修订'

    def __str__(self):
        return f'{self.entry.headword} / {str(self.pk)[:8]}'


class Pronunciation(UUIDModel):
    entry = models.ForeignKey(LexicalEntry, verbose_name='词条', on_delete=models.PROTECT, related_name='pronunciations')
    system = models.CharField('音系', max_length=24, choices=[('pinyin', '汉语拼音'), ('ipa', '国际音标'), ('other', '来源标注')])
    region = models.CharField('地区／口音', max_length=40, blank=True, help_text='来源未标明时留空。')
    editorial_value = models.CharField('人工修订读音', max_length=300, blank=True)
    editorial_note = models.TextField('修订说明', blank=True)
    revision = models.PositiveIntegerField('人工修订版本', default=0, editable=False)
    is_reviewed = models.BooleanField('读音已人工核对', default=False)

    class Meta:
        verbose_name = '读音与人工修订'
        verbose_name_plural = '读音与人工修订'

    def __str__(self):
        return f'{self.entry.headword} / {self.system} / {str(self.pk)[:8]}'


class SourceBinding(UUIDModel):
    """Stable source identity. All versions refer to the same semantic slots."""
    source = models.ForeignKey(LexiconSource, verbose_name='来源', on_delete=models.PROTECT)
    external_key = models.CharField('来源内稳定标识', max_length=300)
    entry_key = models.CharField('来源词头组标识', max_length=300, blank=True, db_index=True)
    identity = models.JSONField('来源身份字段（固定）', default=dict)
    sense = models.ForeignKey(Sense, verbose_name='关联义项', on_delete=models.PROTECT, related_name='bindings')
    pronunciation = models.ForeignKey(Pronunciation, verbose_name='关联读音', on_delete=models.PROTECT, null=True, blank=True, related_name='bindings')

    class Meta:
        verbose_name = '来源身份映射'
        verbose_name_plural = '来源身份映射'
        constraints = [models.UniqueConstraint(fields=('source', 'external_key'), name='lex_binding_unique')]

    def __str__(self):
        return f'{self.source.code}: {self.external_key}'

    def clean(self):
        if self.sense_id and self.pronunciation_id and self.sense.entry_id != self.pronunciation.entry_id:
            raise ValidationError('义项和读音必须属于同一词条。')


class ImmutableModel(UUIDModel):
    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise ValidationError('历史记录不可修改，请创建新的来源版本或修订。')
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError('历史记录不可删除。')


class SourceRecord(ImmutableModel):
    release = models.ForeignKey(SourceRelease, verbose_name='来源版本', on_delete=models.PROTECT, related_name='records')
    binding = models.ForeignKey(SourceBinding, verbose_name='来源身份映射', on_delete=models.PROTECT, related_name='records')
    raw = models.JSONField('原始记录', default=dict)
    raw_hash = models.CharField('原记录摘要', max_length=64)
    lexical_hash = models.CharField('核心字段摘要', max_length=64, db_index=True)
    headword = models.CharField('来源词头', max_length=200)
    definition = models.TextField('来源释义', blank=True)
    part_of_speech = models.CharField('来源词性', max_length=80, blank=True)
    pronunciation_value = models.CharField('来源读音', max_length=300, blank=True)
    pronunciation_key = models.CharField('读音检索键', max_length=300, blank=True, db_index=True)
    properties = models.JSONField('来源属性', default=dict, blank=True)
    field_paths = models.JSONField('规范化字段对应的原文路径', default=dict)

    class Meta:
        verbose_name = '原始记录与字段证据'
        verbose_name_plural = '原始记录与字段证据'
        constraints = [models.UniqueConstraint(fields=('release', 'binding'), name='lex_release_binding_unique')]

    def __str__(self):
        return f'{self.headword} / {self.release.version}'


class EntryForm(UUIDModel):
    record = models.ForeignKey(SourceRecord, verbose_name='来源证据', on_delete=models.PROTECT, related_name='forms')
    text = models.CharField('词形', max_length=200)
    lookup_key = models.CharField('检索键', max_length=240, db_index=True)
    role = models.CharField('词形关系', max_length=24, choices=[('headword', '词头'), ('alias', '别名'), ('inflection', '词形变化'), ('variant', '字形变体')])
    source_path = models.CharField('原字段路径', max_length=240)

    class Meta:
        verbose_name = '词形与检索'
        verbose_name_plural = '词形与检索'
        constraints = [models.UniqueConstraint(fields=('record', 'text', 'role'), name='lex_record_form_unique')]


class ContentEntryLink(models.Model):
    content = models.ForeignKey('catalog.ContentItem', verbose_name='教学内容', on_delete=models.PROTECT, related_name='lexicon_links')
    slot = models.CharField('关联位置', max_length=80, default='main')
    sense = models.ForeignKey(Sense, verbose_name='选用义项', on_delete=models.PROTECT, related_name='content_links')
    pronunciation = models.ForeignKey(Pronunciation, verbose_name='选用读音', on_delete=models.PROTECT, null=True, blank=True)
    evidence = models.ForeignKey(SourceRecord, verbose_name='关联时来源快照', on_delete=models.PROTECT)
    method = models.CharField('关联依据', max_length=24, choices=[('inherited', '沿用原教学记录'), ('exact', '核心字段完全一致'), ('manual', '人工确认')], default='inherited')
    review_note = models.TextField('关联说明', blank=True)
    updated_at = models.DateTimeField('关联时间', auto_now=True)

    class Meta:
        verbose_name = '教学内容关联'
        verbose_name_plural = '教学内容关联'
        constraints = [models.UniqueConstraint(fields=('content', 'slot'), name='lex_content_slot_unique')]

    def __str__(self):
        return f'{self.content.title} → {self.sense.entry.headword}'

    def clean(self):
        if self.sense_id and self.pronunciation_id and self.sense.entry_id != self.pronunciation.entry_id:
            raise ValidationError('读音与义项必须属于同一词条。')
        if self.evidence_id and (self.evidence.binding.sense_id != self.sense_id or self.evidence.binding.pronunciation_id != self.pronunciation_id):
            raise ValidationError('关联必须选用证据记录对应的义项和读音。')


class EntryMatch(models.Model):
    left = models.ForeignKey(LexicalEntry, verbose_name='保留词条', on_delete=models.PROTECT, related_name='+')
    right = models.ForeignKey(LexicalEntry, verbose_name='候选词条', on_delete=models.PROTECT, related_name='+')
    status = models.CharField('判定', max_length=12, choices=[('pending', '待核对'), ('distinct', '保留为不同词条'), ('merged', '已归并（保留各义项）')], default='pending')
    note = models.TextField('判定说明', blank=True)

    class Meta:
        verbose_name = '同形词对齐候选'
        verbose_name_plural = '同形词对齐候选'
        constraints = [models.UniqueConstraint(fields=('left', 'right'), name='lex_entry_pair_unique'),
                       models.CheckConstraint(condition=~Q(left=F('right')), name='lex_entry_pair_distinct')]


class LexiconAudit(ImmutableModel):
    action = models.CharField('操作', max_length=40)
    source = models.ForeignKey(LexiconSource, verbose_name='来源', on_delete=models.PROTECT, null=True, blank=True)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='操作人（空为管理命令）', on_delete=models.SET_NULL, null=True, blank=True)
    reason = models.TextField('说明')
    before = models.JSONField('变更前', default=dict, blank=True)
    after = models.JSONField('变更后', default=dict, blank=True)
    created_at = models.DateTimeField('操作时间', auto_now_add=True)

    class Meta:
        verbose_name = '词库操作与修订历史'
        verbose_name_plural = '词库操作与修订历史'
        ordering = ('-created_at',)


def active_records(public=False):
    records = SourceRecord.objects.filter(
        release__status='ready', release_id=F('release__source__active_release_id'),
        release__source__enabled=True,
    ).exclude(binding__sense__entry__status__in=['merged', 'archived'])
    if public:
        records = records.filter(release__source__public_allowed=True,
                                 binding__sense__status='published', binding__sense__entry__status='published')
    return records

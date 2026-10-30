import uuid
from django.core.exceptions import ValidationError
from django.db import models


class NamedModel(models.Model):
    code = models.SlugField('标识', max_length=80, unique=True)
    name = models.CharField('名称', max_length=160)
    order = models.PositiveIntegerField('排序', default=0)

    class Meta:
        abstract = True
        ordering = ('order', 'pk')

    def __str__(self):
        return self.name


class Stage(NamedModel):
    class Meta(NamedModel.Meta):
        verbose_name = '学段'
        verbose_name_plural = '学段'


class Grade(NamedModel):
    stage = models.ForeignKey(Stage, verbose_name='学段', on_delete=models.PROTECT, related_name='grades')

    class Meta(NamedModel.Meta):
        verbose_name = '年级'
        verbose_name_plural = '年级'


class Subject(NamedModel):
    class Meta(NamedModel.Meta):
        verbose_name = '学科'
        verbose_name_plural = '学科'


class TextbookEdition(NamedModel):
    subject = models.ForeignKey(Subject, verbose_name='学科', on_delete=models.PROTECT)
    publisher = models.CharField('出版社', max_length=160)
    version = models.CharField('版本／课程标准', max_length=120)

    class Meta(NamedModel.Meta):
        verbose_name = '教材版本'
        verbose_name_plural = '教材版本'

    def clean(self):
        if self.pk and TextbookEdition.objects.filter(pk=self.pk).exclude(subject_id=self.subject_id).exists():
            if self.textbooks.exists():
                raise ValidationError({'subject': '已有教材册次，请新建版本以更换学科。'})


class Textbook(NamedModel):
    class Term(models.TextChoices):
        FIRST = 'first', '上册'
        SECOND = 'second', '下册'
        FULL = 'full', '全册'

    edition = models.ForeignKey(TextbookEdition, verbose_name='教材版本', on_delete=models.PROTECT, related_name='textbooks')
    grade = models.ForeignKey(Grade, verbose_name='年级', on_delete=models.PROTECT)
    term = models.CharField('册次', max_length=8, choices=Term.choices)
    revision = models.CharField('修订标识', max_length=40, default='2026', help_text='同一版本可保留不同修订年份。')

    class Meta(NamedModel.Meta):
        verbose_name = '教材册次'
        verbose_name_plural = '教材册次'
        constraints = [models.UniqueConstraint(fields=('edition', 'grade', 'term', 'revision'), name='textbook_version_unique')]

    def clean(self):
        if self.pk and self.edition_id and self.collections.exclude(module__subject_id=self.edition.subject_id).exists():
            raise ValidationError({'edition': '该册次的学习册与新版本学科不一致。'})


class Module(NamedModel):
    subject = models.ForeignKey(Subject, verbose_name='学科', on_delete=models.PROTECT, related_name='modules')
    description = models.TextField('介绍', blank=True)
    icon = models.CharField('图标文件名', max_length=40, default='book', help_text='static/icons/ 中的文件名，不含 .svg')
    is_active = models.BooleanField('显示入口', default=True)
    interactive_ready = models.BooleanField('专门互动玩法已接入', default=False)

    class Meta(NamedModel.Meta):
        verbose_name = '学习模块'
        verbose_name_plural = '学习模块'

    def clean(self):
        if self.pk and Module.objects.filter(pk=self.pk).exclude(subject_id=self.subject_id).exists():
            if self.collections.exists() or self.items.exists():
                raise ValidationError({'subject': '已有内容，请新建模块以更换学科。'})


class Collection(NamedModel):
    module = models.ForeignKey(Module, verbose_name='学习模块', on_delete=models.PROTECT, related_name='collections')
    textbook = models.ForeignKey(Textbook, verbose_name='同步教材（专题可不填）', null=True, blank=True,
                                 on_delete=models.PROTECT, related_name='collections')
    grades = models.ManyToManyField(Grade, verbose_name='专题适用年级', blank=True,
                                    help_text='仅无教材的专题使用；留空表示全年级。教材学习册以教材年级为准。')
    description = models.TextField('介绍', blank=True)
    is_published = models.BooleanField('发布', default=False)

    class Meta(NamedModel.Meta):
        verbose_name = '学习册'
        verbose_name_plural = '学习册'

    def clean(self):
        if self.textbook_id and self.module_id and self.textbook.edition.subject_id != self.module.subject_id:
            raise ValidationError({'textbook': '教材学科必须与模块学科一致。'})
        if self.pk and self.module_id and self.units.filter(placements__item__isnull=False).exclude(placements__item__module_id=self.module_id).exists():
            raise ValidationError({'module': '已有单元内容属于其他模块，请先调整内容编排。'})


class Unit(models.Model):
    collection = models.ForeignKey(Collection, verbose_name='学习册', on_delete=models.PROTECT, related_name='units')
    code = models.SlugField('单元标识', max_length=80)
    title = models.CharField('单元名称', max_length=200)
    description = models.TextField('单元介绍', blank=True)
    order = models.PositiveIntegerField('排序', default=0)

    class Meta:
        ordering = ('order', 'pk')
        verbose_name = '单元'
        verbose_name_plural = '单元'
        constraints = [models.UniqueConstraint(fields=('collection', 'code'), name='unit_collection_code_unique')]

    def __str__(self):
        return f'{self.collection} / {self.title}'

    def clean(self):
        if self.pk and self.collection_id and self.placements.exclude(item__module_id=self.collection.module_id).exists():
            raise ValidationError({'collection': '已有内容与目标学习册的模块不一致。'})


class ContentItem(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', '草稿'
        PUBLISHED = 'published', '已发布'
        ARCHIVED = 'archived', '已归档'

    class Kind(models.TextChoices):
        KNOWLEDGE = 'knowledge', '知识卡'
        WORD = 'word', '单词'
        IDIOM = 'idiom', '成语'
        WRITING = 'writing', '写作'
        REFERENCE = 'reference', '复习资料'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(Module, verbose_name='学习模块', on_delete=models.PROTECT, related_name='items')
    kind = models.CharField('内容类型', max_length=16, choices=Kind.choices, default=Kind.KNOWLEDGE)
    title = models.CharField('标题', max_length=240)
    summary = models.TextField('概要', blank=True)
    body = models.TextField('正文', blank=True, help_text='纯文本；支持换行。')
    sections = models.JSONField('内容分节', default=list, blank=True,
        help_text='格式：[{"title": "知识要点", "text": "正文"}]；纯文本，不执行 HTML。')
    schema_version = models.PositiveSmallIntegerField('内容结构版本', default=1, editable=False)
    status = models.CharField('发布状态', max_length=12, choices=Status.choices, default=Status.DRAFT)
    source_key = models.CharField('来源唯一标识', max_length=240, unique=True, null=True, blank=True, editable=False)
    source_file = models.CharField('来源文件', max_length=240, blank=True, editable=False)
    source_hash = models.CharField('来源文件 SHA256', max_length=64, blank=True, editable=False)
    source_payload = models.JSONField('来源原记录', default=dict, blank=True, editable=False)
    import_locked = models.BooleanField('保护人工修改', default=False)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        ordering = ('title', 'pk')
        verbose_name = '学习内容'
        verbose_name_plural = '学习内容'
        indexes = [models.Index(fields=('module', 'status'), name='content_module_status')]

    def __str__(self):
        return self.title

    def clean(self):
        if not isinstance(self.sections, list) or any(
            not isinstance(s, dict) or set(s) != {'title', 'text'} or
            not isinstance(s['title'], str) or not isinstance(s['text'], str) for s in self.sections
        ):
            raise ValidationError({'sections': '分节必须是只包含 title、text 字符串的对象列表。'})
        if self.pk and self.module_id and self.placements.exclude(unit__collection__module_id=self.module_id).exists():
            raise ValidationError({'module': '内容已被其他模块的学习册引用。'})


class Placement(models.Model):
    unit = models.ForeignKey(Unit, verbose_name='单元', on_delete=models.CASCADE, related_name='placements')
    item = models.ForeignKey(ContentItem, verbose_name='学习内容', on_delete=models.PROTECT, related_name='placements')
    order = models.PositiveIntegerField('排序', default=0)

    class Meta:
        ordering = ('order', 'pk')
        verbose_name = '内容编排'
        verbose_name_plural = '内容编排'
        constraints = [models.UniqueConstraint(fields=('unit', 'item'), name='placement_unique')]

    def __str__(self):
        return f'{self.unit.title} / {self.item.title}'

    def clean(self):
        if self.unit_id and self.item_id and self.unit.collection.module_id != self.item.module_id:
            raise ValidationError({'item': '内容与学习册必须属于同一个模块。'})


def published_collections():
    return Collection.objects.filter(is_published=True, module__is_active=True)


def published_items():
    return ContentItem.objects.filter(
        status=ContentItem.Status.PUBLISHED, module__is_active=True,
        placements__unit__collection__in=published_collections(),
    ).distinct()

import uuid
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import Q


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
        if self.pk and self.edition_id and self.books.exclude(module__subject_id=self.edition.subject_id).exists():
            raise ValidationError({'edition': '该册次的学习册与新版本学科不一致。'})

    @property
    def books(self):
        """该册次下的学习册（教材同步册，跨两种表聚合）。"""
        return TextbookBook.objects.filter(textbook=self)


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
            if self.textbook_books.exists() or self.items.exists():
                raise ValidationError({'subject': '已有内容，请新建模块以更换学科。'})


class TextbookBook(NamedModel):
    """教材同步册：跟课本走，单元对齐教材册次；题库与学习计划的教材锚点。"""

    module = models.ForeignKey(Module, verbose_name='学习模块', on_delete=models.PROTECT, related_name='textbook_books')
    textbook = models.ForeignKey(Textbook, verbose_name='同步教材', on_delete=models.PROTECT, related_name='books')
    description = models.TextField('介绍', blank=True)
    is_published = models.BooleanField('发布', default=False)

    class Meta(NamedModel.Meta):
        verbose_name = '教材同步册'
        verbose_name_plural = '教材同步册'
        constraints = [models.UniqueConstraint(fields=('textbook',), name='textbook_book_unique',
                                               condition=Q(textbook__isnull=False))]

    def __str__(self):
        return str(self.textbook)

    @property
    def kind(self):
        return 'textbook'

    @property
    def subject(self):
        return self.module.subject

    @property
    def subtitle(self):
        return f'{self.textbook.grade} · {self.textbook.get_term_display()} · {self.textbook.edition.publisher}'

    def clean(self):
        if self.textbook_id and self.module_id and self.textbook.edition.subject_id != self.module.subject_id:
            raise ValidationError({'textbook': '教材学科必须与模块学科一致。'})
        if self.pk and self.module_id and self.units.filter(placements__item__isnull=False).exclude(placements__item__module_id=self.module_id).exists():
            raise ValidationError({'module': '已有单元内容属于其他模块，请先调整内容编排。'})


class Unit(models.Model):
    textbook_book = models.ForeignKey(TextbookBook, verbose_name='教材同步册', on_delete=models.PROTECT,
                                      related_name='units')
    code = models.SlugField('单元标识', max_length=80)
    title = models.CharField('单元名称', max_length=200)
    description = models.TextField('单元介绍', blank=True)
    order = models.PositiveIntegerField('排序', default=0)

    class Meta:
        ordering = ('order', 'pk')
        verbose_name = '单元'
        verbose_name_plural = '单元'
        constraints = [
            models.UniqueConstraint(fields=('textbook_book', 'code'), name='unit_textbook_code_unique'),
        ]

    def __str__(self):
        return f'{self.textbook_book.name} / {self.title}'

    @property
    def book(self):
        """归属教材同步册（目录编排只服务教材管线；专题是各自独立的玩法应用）。"""
        return self.textbook_book

    @property
    def book_kind(self):
        return 'textbook'

    @property
    def book_module_id(self):
        return self.textbook_book.module_id

    def clean(self):
        if self.pk and self.textbook_book_id and self.placements.exclude(
            item__module_id=self.textbook_book.module_id
        ).exists():
            raise ValidationError({'textbook_book': '已有单元内容属于其他模块的学习册，请先调整内容编排。'})


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
        help_text='v1：[{"title": "知识要点", "text": "正文"}]；v2 类型化块：{"type": "text", "title": "...", "text": "..."} 或 {"type": "figure", "fig": "图示标识", "caption": "可选说明"}。纯文本，不执行 HTML。')
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
        if not isinstance(self.sections, list):
            raise ValidationError({'sections': '分节必须是块对象列表。'})
        for section in self.sections:
            if not isinstance(section, dict):
                raise ValidationError({'sections': '每个分节必须是对象。'})
            if 'type' not in section:
                # v1 兼容：纯文本分节，1,219 条既有内容零迁移读取。
                if set(section) != {'title', 'text'} or not isinstance(section['title'], str) or not isinstance(section['text'], str):
                    raise ValidationError({'sections': 'v1 分节必须是只包含 title、text 字符串的对象。'})
            elif section['type'] == 'text':
                if set(section) != {'type', 'title', 'text'} or not isinstance(section['title'], str) or not isinstance(section['text'], str):
                    raise ValidationError({'sections': 'text 块必须是只包含 type、title、text 字符串的对象。'})
            elif section['type'] == 'figure':
                if set(section) - {'type', 'fig', 'caption'} or not isinstance(section.get('fig'), str) \
                        or not section['fig'].strip() or len(section['fig']) > 120:
                    raise ValidationError({'sections': 'figure 块需要不超过 120 字符的 fig 标识。'})
                if 'caption' in section and (not isinstance(section['caption'], str) or len(section['caption']) > 200):
                    raise ValidationError({'sections': 'figure 块的 caption 必须是不超过 200 字符的字符串。'})
            else:
                raise ValidationError({'sections': f'未知分节类型：{section["type"]}'})
        if self.pk and self.module_id and self.placements.exclude(
            unit__textbook_book__module_id=self.module_id
        ).exists():
            raise ValidationError({'module': '内容已被其他模块的学习册引用。'})

    def save(self, *args, **kwargs):
        # schema_version 跟随 sections 实际形状：含类型化块即为 2，纯 v1 分节为 1。
        self.schema_version = 2 if any(isinstance(s, dict) and s.get('type') for s in self.sections or []) else 1
        if kwargs.get('update_fields') is not None:
            kwargs['update_fields'] = set(kwargs['update_fields']) | {'schema_version'}
        return super().save(*args, **kwargs)


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
        if self.unit_id and self.item_id and self.unit.book_module_id != self.item.module_id:
            raise ValidationError({'item': '内容与学习册必须属于同一个模块。'})


    @transaction.atomic
    def save(self, *args, **kwargs):
        from lexicon.models import ContentEntryLink
        ContentItem.objects.select_for_update().get(pk=self.item_id)
        ContentEntryLink.objects.filter(content_id=self.item_id).update(semantic_established=True)
        return super().save(*args, **kwargs)


def published_textbook_books():
    return TextbookBook.objects.filter(is_published=True, module__is_active=True)


def published_units():
    """全部已发布教材同步册下的单元（目录编排只服务教材管线；专题是独立玩法应用）。"""
    return Unit.objects.filter(
        textbook_book__is_published=True, textbook_book__module__is_active=True)


def published_items():
    return ContentItem.objects.filter(
        status=ContentItem.Status.PUBLISHED, module__is_active=True,
        placements__unit__in=published_units(),
    ).distinct()

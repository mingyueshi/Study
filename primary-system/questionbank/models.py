"""挑战题库的数据模型：题目、逐题作答记录、批次导入回执。

题库是跨学科的题目集合：题来自固定批次导入（内部数据规则生成、外部数据
集清洗批次），按题型注册表（``types``）校验与判分。内容 UUID 由来源定位
确定性推导，结构升级中保持稳定；导入只新增、不覆盖，冲突报告后跳过。
"""
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from . import types


class Question(models.Model):
    """一道题：稳定 UUID 内容身份 + 按题型的 payload 数据。"""

    class Type(models.TextChoices):
        CHOICE = 'choice', '选择题'
        TRUE_FALSE = 'truefalse', '判断题'
        SELFCHECK = 'selfcheck', '自评题'

    class Area(models.TextChoices):
        MATH = 'math', '数学'
        CHINESE = 'chinese', '语文'
        ENGLISH = 'english', '英语'

    class Track(models.TextChoices):
        REGULAR = 'regular', '普通'
        OLYMPIAD = 'olympiad', '奥数'

    uuid = models.UUIDField('内容身份', unique=True, editable=False)
    type = models.CharField('题型', max_length=16, choices=Type.choices)
    area = models.CharField('学科', max_length=16, choices=Area.choices, db_index=True)
    track = models.CharField('轨别', max_length=16, choices=Track.choices,
                             default=Track.REGULAR, db_index=True)
    grade = models.PositiveSmallIntegerField('年级', null=True, blank=True)
    stem = models.TextField('题干')
    payload = models.JSONField('题型数据', default=dict)
    tags = models.JSONField('知识点标签', default=list, blank=True)
    source_key = models.CharField('来源', max_length=64, db_index=True)
    source_ref = models.CharField('来源定位', max_length=200)
    checksum = models.CharField('内容指纹', max_length=64, db_index=True, editable=False)
    active = models.BooleanField('启用', default=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '题库题目'
        verbose_name_plural = '题库题目'
        ordering = ('area', 'source_ref')

    def save(self, *args, **kwargs):
        # 指纹始终由内容推导：导入用它检测冲突，后台改题也保持一致。
        self.checksum = self.content_checksum()
        if kwargs.get('update_fields') is not None:
            kwargs['update_fields'] = set(kwargs['update_fields']) | {'checksum'}
        super().save(*args, **kwargs)

    def content_checksum(self):
        return types.content_checksum(
            question_type=self.type, area=self.area, grade=self.grade, stem=self.stem,
            payload=self.payload, tags=self.tags, source_key=self.source_key, source_ref=self.source_ref,
            track=self.track)

    def clean(self):
        try:
            types.validate(self.type, self.payload)
        except types.InvalidPayload as error:
            raise ValidationError({'payload': str(error)}) from error

    def __str__(self):
        return f'{self.get_area_display()}·{self.get_type_display()} {self.stem[:24]}'


class AnswerRecord(models.Model):
    """一次作答：逐题一条、对错都记（服务端判分，自评题照记自评结论）。"""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='答题人', null=True, blank=True,
                             on_delete=models.CASCADE, related_name='questionbank_answers')
    guest_key = models.CharField('游客会话键', max_length=64, blank=True, db_index=True)
    question = models.ForeignKey(Question, verbose_name='题目', on_delete=models.PROTECT,
                                 related_name='answers')
    attempt_id = models.UUIDField('作答标识', null=True, unique=True, editable=False)
    given = models.JSONField('作答内容', default=dict)
    correct = models.BooleanField('答对', default=False)
    created_at = models.DateTimeField('时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '题库作答记录'
        verbose_name_plural = '题库作答记录'
        ordering = ('-created_at',)
        indexes = [models.Index(fields=('user', '-created_at'), name='qb_answer_user_idx'),
                   models.Index(fields=('question', '-created_at'), name='qb_answer_question_idx')]
        constraints = [
            models.CheckConstraint(
                condition=(Q(user__isnull=False) & Q(guest_key='')) | (Q(user__isnull=True) & ~Q(guest_key='')),
                name='qb_answer_owner_exclusive'),
        ]

    def __str__(self):
        owner = self.user or '游客'
        return f'{owner} · {self.question.stem[:16]} · {"答对" if self.correct else "答错"}'


class ImportReceipt(models.Model):
    """批次导入回执：同 batch_id 重复导入幂等跳过，内容变更必须换新批次。"""

    batch_id = models.CharField('批次标识', max_length=100, unique=True)
    digest = models.CharField('批次指纹', max_length=64)
    source = models.CharField('批次文件', max_length=200, blank=True)
    total = models.PositiveIntegerField('题数', default=0)
    imported = models.PositiveIntegerField('新导入', default=0)
    duplicated = models.PositiveIntegerField('已存在跳过', default=0)
    created_at = models.DateTimeField('导入时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '题库导入回执'
        verbose_name_plural = '题库导入回执'
        ordering = ('-created_at',)

    def __str__(self):
        return f'{self.batch_id} · {self.imported}/{self.total}'

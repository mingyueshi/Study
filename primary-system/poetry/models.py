from django.conf import settings
from django.db import models
from django.db.models import Q


class FeihualingRound(models.Model):
    """飞花令完成记录：集满五句或令字语料耗尽即记一次，服务端判定、每局一条。"""

    class Result(models.TextChoices):
        COMPLETED = 'completed', '集满五句'
        EXHAUSTED = 'exhausted', '令字诗句练完'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='玩家', null=True, blank=True,
                             on_delete=models.CASCADE, related_name='feihualing_rounds')
    guest_key = models.CharField('游客会话键', max_length=64, blank=True, db_index=True)
    keyword = models.CharField('令字', max_length=4)
    independent = models.PositiveSmallIntegerField('独立作答句数', default=0)
    learning = models.PositiveSmallIntegerField('提示学习句数', default=0)
    result = models.CharField('完成方式', max_length=10, choices=Result.choices)
    created_at = models.DateTimeField('完成时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '飞花令完成记录'
        verbose_name_plural = '飞花令完成记录'
        ordering = ('-created_at',)
        indexes = [models.Index(fields=('user', '-updated_at'), name='poetry_feihua_user_idx')]
        constraints = [models.CheckConstraint(
            condition=(Q(user__isnull=False) & Q(guest_key='')) | (Q(user__isnull=True) & ~Q(guest_key='')),
            name='poetry_feihua_owner_exclusive')]

    def __str__(self):
        owner = self.user or '游客'
        return f'{owner} · 「{self.keyword}」字 · {self.get_result_display()}'


class PoetryDocument(models.Model):
    version = models.CharField(
        max_length=100, default="b8594f81a89752241442f2ce267d6f66f96704ee+t2s017"
    )
    path = models.CharField(max_length=300)
    sha256 = models.CharField(max_length=64)
    layer = models.CharField(max_length=12)
    collection = models.CharField(max_length=100, db_index=True)
    original_data = models.JSONField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["version", "path"], name="poetry_document_version_path"
            )
        ]


class PoetryText(models.Model):
    document = models.ForeignKey(
        PoetryDocument, on_delete=models.PROTECT, related_name="texts"
    )
    locator = models.CharField(max_length=400)
    original_index = models.IntegerField(null=True, blank=True)
    title = models.CharField(max_length=1000, db_index=True)
    author = models.CharField(max_length=500, blank=True, db_index=True)
    heading_path = models.JSONField(default=list)
    paragraphs = models.JSONField(default=list)
    body = models.TextField()
    source_data = models.JSONField(default=dict)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["document", "locator"], name="poetry_text_document_locator"
            )
        ]


class PoetryNode(models.Model):
    document = models.ForeignKey(
        PoetryDocument, on_delete=models.PROTECT, related_name="nodes"
    )
    locator = models.CharField(max_length=400)
    parent_locator = models.CharField(max_length=400, blank=True)
    label = models.CharField(max_length=1000, blank=True)
    kind = models.CharField(max_length=40)
    position = models.PositiveIntegerField(default=0)
    source_data = models.JSONField(default=dict)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["document", "locator"], name="poetry_node_document_locator"
            )
        ]


class PoetryExclusion(models.Model):
    version = models.CharField(
        max_length=100, default="b8594f81a89752241442f2ce267d6f66f96704ee+t2s017"
    )
    row = models.PositiveIntegerField()
    source_path = models.CharField(max_length=300)
    source_locator = models.CharField(max_length=400)
    source_id = models.CharField(max_length=120, blank=True)
    title = models.CharField(max_length=1000, blank=True, db_index=True)
    author = models.CharField(max_length=500, blank=True)
    reasons = models.TextField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["version", "row"], name="poetry_exclusion_source_row"
            )
        ]

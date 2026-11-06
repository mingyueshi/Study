from django.conf import settings
from django.db import models
from django.db.models import Q


class PolyphoneAnswer(models.Model):
    """多音字练习记录：每道「给词选读音」一题一条，对错由服务端按读音表复核。"""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name='练习者', null=True, blank=True,
                             on_delete=models.CASCADE, related_name='polyphone_answers')
    guest_key = models.CharField('游客会话键', max_length=64, blank=True, db_index=True)
    char = models.CharField('多音字', max_length=4)
    word = models.CharField('例词', max_length=40, blank=True)
    chosen = models.CharField('所选拼音', max_length=40)
    answer = models.CharField('正确拼音', max_length=40)
    correct = models.BooleanField('答对', default=False)
    created_at = models.DateTimeField('作答时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '多音字练习记录'
        verbose_name_plural = '多音字练习记录'
        ordering = ('-created_at',)
        indexes = [models.Index(fields=('user', '-updated_at'), name='hanzi_poly_user_idx')]
        constraints = [models.CheckConstraint(
            condition=(Q(user__isnull=False) & Q(guest_key='')) | (Q(user__isnull=True) & ~Q(guest_key='')),
            name='hanzi_poly_owner_exclusive')]

    def __str__(self):
        owner = self.user or '游客'
        return f'{owner} · {self.char}（{self.word}）· {"对" if self.correct else "错"}'


class HanziAsset(models.Model):
    version = models.CharField(
        max_length=100, default="bddc96d41bef78427ed0e034e9f7e31d71fd1b92"
    )
    character = models.CharField(max_length=4, db_index=True)
    definition_en = models.TextField(blank=True)
    pinyin = models.JSONField(default=list)
    decomposition = models.TextField(blank=True)
    radical = models.CharField(max_length=20, blank=True)
    dictionary_data = models.JSONField(default=dict)
    strokes = models.JSONField(default=list)
    medians = models.JSONField(default=list)
    source_row = models.PositiveIntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["version", "character"], name="hanzi_asset_character_version"
            )
        ]


class UnihanCharacter(models.Model):
    version = models.CharField(max_length=30, default="18.0.0")
    codepoint = models.CharField(max_length=12, db_index=True)
    character = models.CharField(max_length=4, db_index=True)
    mandarin = models.CharField(max_length=1000, blank=True, db_index=True)
    definition_en = models.TextField(blank=True)
    total_strokes = models.CharField(max_length=100, blank=True)
    properties = models.JSONField(default=dict)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["version", "codepoint"], name="hanzi_unihan_codepoint_version"
            )
        ]


class UnihanProperty(models.Model):
    character = models.ForeignKey(
        UnihanCharacter, on_delete=models.PROTECT, related_name="property_rows"
    )
    name = models.CharField(max_length=100, db_index=True)
    value = models.TextField()
    source_file = models.CharField(max_length=100)
    source_line = models.PositiveIntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["character", "name"], name="hanzi_unihan_property_unique"
            )
        ]

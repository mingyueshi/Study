import uuid
from django.db import models
from django.core.exceptions import ValidationError

class Idiom(models.Model):
    word = models.CharField('成语', max_length=64, unique=True)
    meaning = models.TextField('保留释义／人工简释')
    source_explanation = models.TextField('来源完整释义（原文）', blank=True)
    enabled = models.BooleanField('启用', default=True)
    import_locked = models.BooleanField('保护人工修订（不被导入覆盖）', default=False)
    pinyin = models.TextField('拼音原文', blank=True)
    derivation = models.TextField('出处', blank=True)
    example = models.TextField('例句', blank=True)
    abbreviation = models.TextField('拼音缩写', blank=True)
    source = models.CharField('来源', max_length=32, default='curated')
    source_version = models.TextField('来源版本', blank=True)
    source_url = models.TextField('来源地址', blank=True)
    source_raw = models.JSONField('来源原记录', default=dict, blank=True)
    reading_status = models.CharField('读音格式状态', max_length=32, default='unreviewed')
    game_eligible = models.BooleanField('可用于四字接龙', default=True)
    first_char = models.CharField('首字', max_length=4, blank=True)
    last_char = models.CharField('尾字', max_length=4, blank=True)
    def clean(self):
        if self.game_eligible and (len(self.word)!=4 or not all('\u3400'<=c<='\u9fff' for c in self.word)):
            raise ValidationError({'game_eligible':'接龙词必须是四个汉字；其他词可取消此项，仅供查阅。'})
    def save(self,*args,**kwargs):
        self.first_char=self.word[:1]
        self.last_char=self.word[-1:]
        if kwargs.get('update_fields') is not None:
            kwargs['update_fields']=set(kwargs['update_fields']) | {'first_char','last_char'}
        super().save(*args,**kwargs)
    def __str__(self): return self.word
    class Meta:
        verbose_name='成语'; verbose_name_plural='词库'
        indexes=[models.Index(fields=['first_char','game_eligible','enabled','word'],name='idiom_head_game_idx')]

class Round(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.CharField(max_length=64, db_index=True)
    chain = models.JSONField(default=list)
    score = models.PositiveIntegerField(default=0)
    hints = models.PositiveIntegerField(default=0)
    revision = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=12, default='playing')
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        verbose_name='对局'; verbose_name_plural='对局记录'
        indexes=[models.Index(fields=['owner','status','-created_at'],name='round_owner_status_idx'),models.Index(fields=['owner','-created_at'],name='round_owner_time_idx')]

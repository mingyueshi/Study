from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    display_name = models.CharField('显示名称', max_length=50, blank=True)
    grade = models.ForeignKey('catalog.Grade', verbose_name='当前年级', null=True, blank=True,
                              on_delete=models.SET_NULL, related_name='learners')

    def __str__(self):
        return self.display_name or self.username

    class Meta(AbstractUser.Meta):
        verbose_name = '学习账号'
        verbose_name_plural = '学习账号'

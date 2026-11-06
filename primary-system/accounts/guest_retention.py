"""游客（未登录）数据保留期：各玩法的学习记录超期即清理。

各玩法都以「游客会话键」承接未登录数据（user 为空且 guest_key 非空），账号数据
（user 非空）永不进入清理范围。统一按 updated_at 判定活跃度：超过保留期的游客行
删除，未过期与账号数据保留。清理以预演为默认，实际删除须显式 apply。
新增可写学习记录的模型时，把模型登记进 GUEST_MODELS。
"""
from datetime import timedelta

from django.utils import timezone

# 处理顺序无关：这些模型彼此无交叉外键，删除游客行不触发相对依赖。
from chain.models import GameRound
from hanzi.models import PolyphoneAnswer
from idioms.models import PlayRecord
from poetry.models import FeihualingRound
from questionbank.models import AnswerRecord
from words.models import WordProgress
from writing.models import WritingDraft

GUEST_MODELS = (GameRound, WordProgress, WritingDraft, PlayRecord, FeihualingRound, PolyphoneAnswer, AnswerRecord)


def _expired(model, cutoff):
    return model._default_manager.filter(user__isnull=True).exclude(guest_key='').filter(updated_at__lt=cutoff)


def cleanup_guest_data(*, apply=False, days=90):
    """返回预演/实际清理报告；apply=True 才真正删除。"""
    cutoff = timezone.now() - timedelta(days=days)
    planned = {model.__name__: _expired(model, cutoff).count() for model in GUEST_MODELS}
    report = {'days': days, 'cutoff': cutoff.isoformat(), 'dry_run': not apply,
              'planned': planned, 'planned_total': sum(planned.values())}
    if apply:
        deleted = {model.__name__: _expired(model, cutoff).delete()[0] for model in GUEST_MODELS}
        report['deleted'] = deleted
        report['deleted_total'] = sum(deleted.values())
    return report
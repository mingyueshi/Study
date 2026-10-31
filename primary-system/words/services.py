"""场景单词的服务层：全量 state 组装与掌握标记（双轨归属，与接龙对局同模式）。"""
import secrets

from django.db import transaction
from lexicon.models import LexiconSource, SourceRecord
from words.models import Scenario, ScenarioWord, WordProgress

GUEST_KEY = 'words_guest'


def owner_filter(request):
    """归属过滤：登录玩家按账号，游客按浏览器会话内随机键。"""
    if request.user.is_authenticated:
        return {'user': request.user}
    if not request.session.session_key:
        request.session.create()
    key = request.session.get(GUEST_KEY)
    if not key:
        key = secrets.token_hex(16)
        request.session[GUEST_KEY] = key
    return {'guest_key': key}


def _scenario_records():
    """生效版本的场景词来源记录，按词条聚合（577 行单查询）。"""
    source = LexiconSource.objects.filter(
        code='primary-words', active_release__isnull=False).select_related('active_release').first()
    if not source:
        return {}
    records = SourceRecord.objects.filter(release_id=source.active_release_id).select_related(
        'binding__sense__entry', 'binding__pronunciation')
    return {record.binding.sense.entry_id: record for record in records}


def word_payload(word, record, learned_ids):
    """词卡展示数据：读音/释义来自词典生效记录，教学标注来自词位。"""
    pronunciation = ''
    definition = ''
    if record:
        pronunciation_row = record.binding.pronunciation
        if pronunciation_row and pronunciation_row.is_reviewed:
            pronunciation = pronunciation_row.editorial_value or record.pronunciation_value
        definition = record.definition
    return {
        'id': str(word.pk), 'en': word.en, 'emoji': word.emoji,
        'ipa': pronunciation, 'zh': definition,
        'segments': word.segments or [], 'memo': word.memo or '',
        'related': word.related or [],
        'scenario': str(word.scenario_id),
        'learned': word.pk in learned_ids,
    }


def state_payload(owner):
    """全量 state（46 场景 577 词，约 300KB）：与 legacy 全量 JS 数据同构，前端本地切换。"""
    words = list(ScenarioWord.objects.select_related('scenario').order_by('scenario__order', 'pk'))
    records = _scenario_records()
    learned_ids = set(WordProgress.objects.filter(
        word_id__in=[w.pk for w in words], learned=True, **owner).values_list('word_id', flat=True))
    scenarios = list(Scenario.objects.order_by('order', 'pk'))
    by_scenario = {}
    for word in words:
        by_scenario.setdefault(word.scenario_id, []).append(word)
    return {
        'scenarios': [{
            'id': str(s.pk), 'code': s.code, 'name': s.name, 'zh': s.zh, 'emoji': s.emoji, 'color': s.color,
            'total': len(by_scenario.get(s.pk, [])),
            'learned': sum(1 for w in by_scenario.get(s.pk, []) if w.pk in learned_ids),
        } for s in scenarios],
        'words': [word_payload(w, records.get(w.entry_id), learned_ids) for w in words],
        'guest': 'guest_key' in owner,
    }


@transaction.atomic
def set_learned(owner, word_id, learned):
    """标记/取消掌握：幂等切换。"""
    if 'user' in owner:
        row, _ = WordProgress.objects.update_or_create(
            user=owner['user'], word_id=word_id, defaults={'learned': learned})
    else:
        row, _ = WordProgress.objects.update_or_create(
            guest_key=owner['guest_key'], word_id=word_id, defaults={'learned': learned})
    return row

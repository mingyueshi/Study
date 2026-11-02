"""词卡目标与场景编排分离；所有读取遵守固定证据和当前来源策略。"""
from django.db import transaction
from lexicon.models import active_records
from words.models import LearningTarget, RelatedGloss, Scenario, ScenarioWord, WordProgress, editorial_values

GUEST_KEY = 'words_guest'


class ProgressConflict(Exception):
    pass


def owner_filter(request):
    if request.user.is_authenticated:
        return {'user': request.user}
    if not request.session.session_key:
        request.session.create()
    key = request.session.get(GUEST_KEY)
    if not key:
        # 同一已存在会话的多标签页首写使用同一个稳定键；不合并账号。
        key = request.session.session_key
        request.session[GUEST_KEY] = key
    return {'guest_key': key}


def _definition(record):
    value = record.binding.sense.editorial_definition.strip() or record.definition.strip()
    return '' if value == '无' else value


def target_content(target, current):
    if not target.evidence_id:
        return None, '原词卡待复核'
    evidence = target.evidence
    record = current.get(evidence.binding_id)
    if not record:
        return None, '来源停用、缺词或词条停用，待复核'
    if (record.binding.sense_id, record.binding.pronunciation_id) != (target.sense_id, target.pronunciation_id):
        return None, '来源绑定变化，待复核'
    if record.lexical_hash != evidence.lexical_hash:
        return None, '释义或读音变化，待复核'
    if target.editorial_snapshot != editorial_values(record.binding.sense, record.binding.pronunciation):
        return None, '人工释义或读音已修订，需复核'
    if target.chinese_version_id:
        version = target.chinese_version
        if version.status != 'confirmed' or (version.sense_id, version.pronunciation_id, version.evidence_id, version.editorial_snapshot) != (target.sense_id, target.pronunciation_id, target.evidence_id, target.editorial_snapshot):
            return None, '中文尚未核对或已撤回，待复核'
    return record, '来源一致'


def state_payload(owner):
    words = list(ScenarioWord.objects.select_related('scenario', 'target__evidence__binding',
        'target__sense', 'target__pronunciation', 'target__chinese_version').order_by('scenario__order', 'order', 'pk'))
    targets = {w.target_id: w.target for w in words}
    current = {r.binding_id: r for r in active_records().filter(
        binding_id__in=[t.evidence.binding_id for t in targets.values() if t.evidence_id]
    ).exclude(binding__sense__status='archived').select_related('binding__sense', 'binding__pronunciation')}
    content = {key: target_content(target, current) for key, target in targets.items()}
    progress = {p.target_id: p for p in WordProgress.objects.filter(target_id__in=targets, **owner)}
    related_en = {en.lower() for w in words for en in w.related or []}
    by_en = {}
    for key, target in targets.items():
        by_en.setdefault(target.label.lower(), []).append(key)
    related_lookup = {}
    for en, keys in by_en.items():
        if len(keys) == 1:
            record, _ = content[keys[0]]
            if record:
                pron = record.binding.pronunciation
                related_lookup[en] = {'zh': (targets[keys[0]].chinese_version.text if targets[keys[0]].chinese_version_id else _definition(record)), 'ipa': (pron.editorial_value or record.pronunciation_value) if pron and pron.is_reviewed else ''}
    # 基础词库中存在的任何词形都不能从旧拓展表旁路补释义。
    from lexicon.models import LexicalEntry
    known = set(LexicalEntry.objects.filter(language='en', lookup_key__in=related_en).values_list('lookup_key', flat=True))
    for gloss in RelatedGloss.objects.filter(en__in=related_en - known - set(by_en)):
        related_lookup[gloss.en.lower()] = {'zh': gloss.zh, 'ipa': ''}
    payloads = []
    for word in words:
        record, status = content[word.target_id]
        row = progress.get(word.target_id)
        pron = record.binding.pronunciation if record else None
        payloads.append({
            'id': str(word.pk), 'target_id': str(word.target_id), 'revision': row.revision if row else 0,
            'en': word.en, 'emoji': word.emoji, 'scenario': str(word.scenario_id),
            'ipa': (pron.editorial_value or record.pronunciation_value) if pron and pron.is_reviewed else '',
            'zh': (word.target.chinese_version.text if word.target.chinese_version_id else _definition(record)) if record else '', 'source_status': status,
            'chinese_version_id': str(word.target.chinese_version_id) if word.target.chinese_version_id else None,
            'presentation_revision': word.target.presentation_revision,
            'presentation_mode': 'chinese' if word.target.chinese_version_id else 'legacy',
            'chinese_example': word.target.chinese_version.example if record and word.target.chinese_version_id else '',
            'sense_id': str(word.target.sense_id) if word.target.sense_id else None,
            'evidence_id': str(word.target.evidence_id) if word.target.evidence_id else None,
            'pronunciation_id': str(word.target.pronunciation_id) if word.target.pronunciation_id else None,
            'pronunciation_revision': word.target.pronunciation.revision if word.target.pronunciation_id else None,
            'editorial_revision': word.target.sense.revision if word.target.sense_id else None,
            'selected_editorial_revision': word.target.editorial_snapshot.get('sense_revision'),
            'selected_pronunciation_revision': word.target.editorial_snapshot.get('pronunciation_revision'),
            'segments': (word.segments or []) if record else [], 'memo': word.memo if record else '', 'learned': bool(row and row.learned),
            'related': [{'en': en, **related_lookup.get(en.lower(), {'zh': '', 'ipa': ''})} for en in word.related or []],
        })
    return {'schema_version': 3, 'capability': 'card', 'guest': 'guest_key' in owner,
        'scenarios': [{'id': str(s.pk), 'code': s.code, 'name': s.name, 'zh': s.zh, 'emoji': s.emoji,
            'color': s.color, 'total': sum(w.scenario_id == s.pk for w in words),
            'learned': sum(p['learned'] for p in payloads if p['scenario'] == str(s.pk))}
            for s in Scenario.objects.order_by('order', 'pk')], 'words': payloads}


@transaction.atomic
def set_learned(owner, target_id, learned, revision, *, chinese_version_id=None, presentation_revision=0):
    # 锁稳定目标（包括尚无进度的首写）；不同归属的记录仍严格隔离。
    from lexicon.chinese import lock_selection, selected_payload
    from lexicon.models import ChineseSenseVersion
    identity = LearningTarget.objects.get(pk=target_id)
    if identity.evidence_id:
        lock_selection(identity.sense_id, identity.pronunciation_id, identity.evidence_id)
    if identity.chinese_version_id:
        ChineseSenseVersion.objects.select_for_update().get(pk=identity.chinese_version_id)
    target = LearningTarget.objects.select_for_update().get(pk=target_id)
    if str(target.chinese_version_id or '') != str(chinese_version_id or '') or target.presentation_revision != presentation_revision:
        raise ProgressConflict('中文呈现已更新，请刷新后重新确认。')
    if not target.evidence_id or not selected_payload(target)[0]:
        raise ProgressConflict('当前中文或来源已失效，请刷新核对。')
    row = WordProgress.objects.filter(target=target, **owner).first()
    if (row.revision if row else 0) != revision:
        raise ProgressConflict('记录已在其他页面更新，请刷新后再保存。')
    if row is None:
        row = WordProgress(target=target, **owner)
    LearningTarget.objects.filter(pk=target.pk).update(semantic_established=True)
    row.seen_chinese_version_id = target.chinese_version_id
    row.seen_presentation_revision = presentation_revision
    row.learned = learned
    row.revision += 1
    row.save()
    return row

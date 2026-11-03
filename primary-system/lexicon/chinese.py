"""中文版本与具体领域选择；不查询最新译文，不扩大旧学习含义。"""
import hashlib
import json
from django.core.exceptions import ValidationError
from django.db import transaction
from .models import (ChineseSenseVersion, ChineseReview, ContentEntryLink, ContentLinkSelection,
                     LexiconSource, Sense, Pronunciation, SourceRecord, active_records, editorial_values, validate_selection, same_snapshot)


def lock_selection(sense_id, pronunciation_id, evidence_id):
    evidence = SourceRecord.objects.get(pk=evidence_id)
    LexiconSource.objects.select_for_update().get(pk=evidence.release.source_id)
    sense = Sense.objects.select_for_update().get(pk=sense_id)
    pronunciation = Pronunciation.objects.select_for_update().get(pk=pronunciation_id) if pronunciation_id else None
    validate_selection(sense, pronunciation, evidence)
    return sense, pronunciation


def selection_record(selection, current=None):
    """Only live, exact fixed evidence and editorial selection; no fallback data."""
    if not selection.evidence_id:
        return None, '尚未选定义项证据，待复核'
    record = current.get(selection.evidence.binding_id) if current is not None else active_records().filter(binding_id=selection.evidence.binding_id).exclude(
        binding__sense__status='archived').select_related('binding__sense__entry', 'binding__pronunciation', 'release__source').first()
    if not record:
        return None, '来源停用、缺词或义项停用，待复核'
    if (record.binding.sense_id, record.binding.pronunciation_id) != (selection.sense_id, selection.pronunciation_id):
        return None, '义项或读音绑定变化，待复核'
    if record.lexical_hash != selection.evidence.lexical_hash:
        return None, '来源释义或读音变化，需复核'
    if selection.editorial_snapshot != editorial_values(record.binding.sense, record.binding.pronunciation):
        return None, '人工释义或读音已修订，需复核'
    return record, '来源一致'


def chinese_status(version):
    if version.status != 'confirmed':
        return False, '中文尚未核对或已撤回，待复核'
    record, status = selection_record(version)
    return bool(record), status


def validate_version(selection, version):
    if (selection.sense_id, selection.pronunciation_id, selection.evidence_id, selection.editorial_snapshot) != (
            version.sense_id, version.pronunciation_id, version.evidence_id, version.editorial_snapshot):
        raise ValidationError('中文版本与固定义项、读音、证据及修订快照不一致。')
    valid, status = chinese_status(version)
    if not valid:
        raise ValidationError(status)


@transaction.atomic
def create_chinese(*, evidence_id, expected_snapshot, **fields):
    evidence = SourceRecord.objects.select_related('binding').get(pk=evidence_id)
    return ChineseSenseVersion.objects.create(evidence=evidence, sense_id=evidence.binding.sense_id,
        pronunciation_id=evidence.binding.pronunciation_id, editorial_snapshot=expected_snapshot, **fields)


@transaction.atomic
def review_chinese(version_id, *, expected_revision, decision, reviewer, note):
    if type(expected_revision) is not int or decision not in ('confirmed', 'withdrawn') or not reviewer.strip() or not note.strip():
        raise ValidationError('须明确确认／撤回、核对人和核对说明。')
    identity = ChineseSenseVersion.objects.get(pk=version_id)
    lock_selection(identity.sense_id, identity.pronunciation_id, identity.evidence_id)
    version = ChineseSenseVersion.objects.select_for_update().get(pk=version_id)
    if version.review_revision != expected_revision or version.status == 'withdrawn':
        raise ValidationError('核对状态已变化或版本已永久撤回，请重新读取／新建版本。')
    if decision == 'confirmed':
        record, status = selection_record(version)
        if not record or version.learning_effect == 'unknown':
            raise ValidationError(status if not record else '必须先明确是否改变学习含义；新建已判定的版本。')
        if version.previous_id and version.learning_effect == 'same':
            if version.previous.editorial_snapshot != version.editorial_snapshot:
                raise ValidationError('修订依据变化，不能将上版直接声明为纯呈现修改。')
    revision = version.review_revision + 1
    ChineseReview.objects.create(version=version, revision=revision, decision=decision, reviewer=reviewer, note=note)
    ChineseSenseVersion.objects.filter(pk=version.pk).update(status=decision, review_revision=revision)
    version.refresh_from_db()
    return version


def link_snapshot(link):
    return {'sense_id': str(link.sense_id), 'pronunciation_id': str(link.pronunciation_id) if link.pronunciation_id else None,
            'evidence_id': str(link.evidence_id), 'editorial_snapshot': link.editorial_snapshot,
            'headword': link.selected_headword, 'chinese_version_id': str(link.chinese_version_id) if link.chinese_version_id else None,
            'presentation_revision': link.presentation_revision}


@transaction.atomic
def adopt_chinese(*, target_id=None, link_id=None, version_id, expected_revision, expected_review_revision, reason):
    if type(expected_revision) is not int or type(expected_review_revision) is not int or bool(target_id) == bool(link_id) or not reason.strip():
        raise ValidationError('必须选择一个目标／教材关联，并填写采用依据。')
    from words.models import LearningTarget, TargetChineseAdoption
    model = LearningTarget if target_id else ContentEntryLink
    key = target_id or link_id
    identity = model.objects.get(pk=key)
    lock_selection(identity.sense_id, identity.pronunciation_id, identity.evidence_id)
    version = ChineseSenseVersion.objects.select_for_update().get(pk=version_id)
    if link_id:
        from catalog.models import ContentItem
        ContentItem.objects.select_for_update().get(pk=identity.content_id)
    selection = model.objects.select_for_update().get(pk=key)
    if selection.presentation_revision != expected_revision or version.review_revision != expected_review_revision:
        raise ValidationError('采用或核对版本已变化，请重新读取后确认。')
    record, status = selection_record(selection)
    if not record:
        raise ValidationError(status)
    validate_version(selection, version)
    established = selection.semantic_established or (bool(selection.legacy) if target_id else False)
    established = established or (selection.chinese_adoptions.exists() or selection.placements.exists() or selection.progress_rows.exists() if target_id else
                                  selection.presentation_revision > 0 or selection.content.placements.exists() or selection.content.progress_set.exists())
    if selection.chinese_version_id:
        if version.previous_id != selection.chinese_version_id or version.learning_effect != 'same':
            raise ValidationError('只能从当前采用版直接升级到已确认同义的下一版；不得跨越改义链。')
    elif established and version.previous_id:
        raise ValidationError('旧目标首次采用不可从不明中间版本跳入同义链；须新建学习身份。')
    if version.learning_effect != 'same' and established:
        raise ValidationError('纠错变义须新学习目标／新教材内容，不能继承既有掌握。')
    revision = selection.presentation_revision + 1
    changes = {'chinese_version_id': version.pk, 'presentation_revision': revision}
    if link_id:
        changes['selection_revision'] = selection.selection_revision + 1
    model.objects.filter(pk=selection.pk).update(**changes)
    selection.refresh_from_db()
    if target_id:
        TargetChineseAdoption.objects.create(target=selection, version=version, revision=revision, reason=reason)
    else:
        ContentLinkSelection.objects.create(link=selection, revision=selection.selection_revision, selection=link_snapshot(selection), reason=reason)
    return selection


def selected_payload(selection, current=None):
    record, status = selection_record(selection, current)
    version = selection.chinese_version
    if record and version:
        if version.status != 'confirmed' or (selection.sense_id, selection.pronunciation_id, selection.evidence_id, selection.editorial_snapshot) != (version.sense_id, version.pronunciation_id, version.evidence_id, version.editorial_snapshot):
            record, status = None, '中文尚未核对、已撤回或选择不一致，需复核'
    return record, status, version.text if record and version else None


def content_presentation(item, *, lock=False):
    links = list(ContentEntryLink.objects.filter(content=item).order_by('pk'))
    if lock:
        # Stable source/sense order before link locks; all adoption paths use this order.
        for source_id in sorted({l.evidence.release.source_id for l in links}):
            LexiconSource.objects.select_for_update().get(pk=source_id)
        for sense_id in sorted({l.sense_id for l in links}, key=str):
            Sense.objects.select_for_update().get(pk=sense_id)
        for pron_id in sorted({l.pronunciation_id for l in links if l.pronunciation_id}, key=str):
            Pronunciation.objects.select_for_update().get(pk=pron_id)
        # Re-read presentation pointers after source/sense locks; a prior adopter may have won.
        refreshed = list(ContentEntryLink.objects.filter(content=item).order_by('pk'))
        if {l.pk for l in refreshed} != {l.pk for l in links}:
            raise ValidationError('教材关联集合已更新，请刷新后确认。')
        links = refreshed
        for version_id in sorted({l.chinese_version_id for l in links if l.chinese_version_id}, key=str):
            ChineseSenseVersion.objects.select_for_update().get(pk=version_id)
        from catalog.models import ContentItem
        ContentItem.objects.select_for_update().get(pk=item.pk)
        locked = list(ContentEntryLink.objects.select_for_update().filter(content=item).order_by('pk'))
        if {l.pk for l in locked} != {l.pk for l in links}:
            raise ValidationError('教材关联集合已更新，请刷新后确认。')
        links = locked
    tokens = [{'link_id': l.pk, 'selection_revision': l.selection_revision, 'presentation_revision': l.presentation_revision,
               'chinese_version_id': str(l.chinese_version_id) if l.chinese_version_id else None} for l in links]
    return links, tokens


@transaction.atomic
def reconfirm_link(link_id, *, expected_revision, expected_snapshot, same_meaning, reason):
    """Only editorial corrections explicitly confirmed equivalent; other identity stays fixed."""
    if same_meaning is not True or not reason.strip():
        raise ValidationError('变义必须新教材内容；重新确认须明确同义依据。')
    identity = ContentEntryLink.objects.get(pk=link_id)
    sense, pronunciation = lock_selection(identity.sense_id, identity.pronunciation_id, identity.evidence_id)
    from catalog.models import ContentItem
    ContentItem.objects.select_for_update().get(pk=identity.content_id)
    link = ContentEntryLink.objects.select_for_update().get(pk=link_id)
    if type(expected_revision) is not int or link.selection_revision != expected_revision or not same_snapshot(editorial_values(sense, pronunciation), expected_snapshot):
        raise ValidationError('所见选择／修订已变化，不能用锁后最新值代替确认。')
    if any(expected_snapshot.get(key) != link.editorial_snapshot.get(key) for key in ('pronunciation_revision', 'pronunciation')):
        raise ValidationError('读音或其修订版本变化须新教材内容身份，同义声明不能继承旧掌握。')
    if link.chinese_version_id:
        raise ValidationError('已有中文采用不能直接清空或换修订；请新内容明确重新选用，保留旧选择。')
    link.editorial_snapshot = expected_snapshot
    record, status = selection_record(link)
    if not record:
        raise ValidationError(status)
    ContentEntryLink.objects.filter(pk=link.pk).update(editorial_snapshot=expected_snapshot, selection_revision=link.selection_revision + 1)
    link.refresh_from_db()
    ContentLinkSelection.objects.create(link=link, revision=link.selection_revision, selection=link_snapshot(link), reason='明确同义重新确认：'+reason)
    return link


def link_payload(link, current=None):
    from .views import record_payload
    record, status, chinese = selected_payload(link, current)
    base = {'link_id': link.pk, 'slot': link.slot, 'selection_revision': link.selection_revision,
            'presentation_revision': link.presentation_revision, 'chinese_version_id': str(link.chinese_version_id) if link.chinese_version_id else None,
            'presentation_mode': 'chinese' if link.chinese_version_id else 'legacy', 'state': status,
            'headword': link.selected_headword, 'available': bool(record)}
    if not record:
        return base
    payload = record_payload(record)
    # Fixed source metadata, current payload only after full snapshot match.
    if chinese is not None:
        payload['definition'] = chinese
        payload['chinese_example'] = link.chinese_version.example
        payload['definition_origin'] = 'chinese-version'
        payload['gloss_language'] = 'zh-Hans-CN'
    # Original lexical properties can contain copied definitions: don't send through lesson view.
    payload['properties'] = {}
    return {**base, **payload}


class LessonResolver:
    """Request-local batch projection. No process/session cache of source or Chinese state."""
    def __init__(self, items):
        self.items = {item.pk: item for item in items}
        self.by_content = {}
        links = list(ContentEntryLink.objects.filter(content_id__in=self.items).select_related('evidence', 'sense', 'pronunciation', 'chinese_version').order_by('slot', 'pk'))
        bindings = {l.evidence.binding_id for l in links}
        self.current = {r.binding_id: r for r in active_records().filter(binding_id__in=bindings).exclude(
            binding__sense__status='archived').select_related('binding__sense__entry', 'binding__pronunciation', 'release__source')}
        self.payloads = {}
        for link in links:
            self.by_content.setdefault(link.content_id, []).append(link)
            self.payloads[link.pk] = link_payload(link, self.current)
        self.searches = {}

    def project(self, item):
        if item.kind != 'word':
            return item
        links = self.by_content.get(item.pk, [])
        if not links:
            return item  # Independent never-bound manual teaching card.
        main = next((l for l in links if l.slot == 'main'), links[0])
        payload = self.payloads[main.pk]
        raw = item.source_payload if isinstance(item.source_payload, dict) else {}
        item.summary = payload.get('definition', '')
        item.body = ''
        item.sections = []
        # links 是教材英语词的关联词载荷（近/反/根/组/类），与 related 字符串列表并存。
        item.source_payload = {k: raw[k] for k in ('en', 'emoji', 'ipa', 'memo', 'related', 'links', 'phrases') if k in raw}
        item.source_payload['parts'] = raw.get('parts', []) if payload['available'] else []
        if not payload['available']:
            item.source_payload['memo'] = ''
        item.word_selection = payload
        item.word_selections = [self.payloads[l.pk] for l in links]
        return item

    def search_ids(self, text):
        query = text.casefold()
        if query not in self.searches:
            found = []
            for item in self.items.values():
                if item.kind != 'word': continue
                projection = self.project(item)
                # Include all visible selected slots, never stale stored summaries.
                definitions = [self.payloads[l.pk].get('definition', '') for l in self.by_content.get(item.pk, [])]
                if any(query in value.casefold() for value in [projection.summary, projection.body, *definitions]):
                    found.append(item.pk)
            self.searches[query] = found
        return self.searches[query]


def safe_word_item(item, resolver=None):
    if item.kind != 'word': return item
    return (resolver or LessonResolver([item])).project(item)


def request_resolver(request):
    from catalog.models import published_items
    if not hasattr(request, '_lesson_resolver'):
        request._lesson_resolver = LessonResolver(published_items().filter(kind='word'))
    return request._lesson_resolver


def safe_search(items, text, resolver=None):
    from django.db.models import Q
    resolver = resolver or LessonResolver(items.filter(kind='word'))
    return items.filter(Q(title__icontains=text) | Q(pk__in=resolver.search_ids(text)) |
                        (~Q(kind='word') & (Q(summary__icontains=text) | Q(body__icontains=text))))

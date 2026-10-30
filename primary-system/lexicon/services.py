from collections import defaultdict
from itertools import combinations
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from .models import (ContentEntryLink, EntryMatch, LexicalEntry, LexiconAudit,
                     LexiconSource, Pronunciation, Sense, SourceBinding, SourceRecord, SourceRelease)


def authorize(actor, permission):
    # None is reserved for trusted local management commands, never HTTP input.
    if actor is not None and not (actor.is_active and actor.is_staff and actor.has_perm(permission)):
        raise PermissionDenied


def require_reason(reason):
    if not isinstance(reason, str) or not reason.strip():
        raise ValidationError('请填写操作依据。')


def release_diff(release):
    current = release.source.active_release_id
    new = dict(release.records.values_list('binding_id', 'raw_hash'))
    old = dict(SourceRecord.objects.filter(release_id=current).values_list('binding_id', 'raw_hash')) if current else {}
    changed = {key for key in new.keys() & old.keys() if new[key] != old[key]}
    removed = old.keys() - new.keys()
    return {'added': len(new.keys() - old.keys()), 'changed': len(changed),
            'removed': len(removed), 'unchanged': len(new.keys() & old.keys()) - len(changed),
            'affected_links': ContentEntryLink.objects.filter(evidence__binding_id__in=changed | set(removed)).count()}


@transaction.atomic
def activate_release(release_id, *, expected_current, reason, actor=None):
    authorize(actor, 'lexicon.manage_sources')
    require_reason(reason)
    release = SourceRelease.objects.get(pk=release_id)
    source = LexiconSource.objects.select_for_update().get(pk=release.source_id)
    if str(source.active_release_id or '') != str(expected_current or ''):
        raise ValidationError('生效版本已改变，请重新查看差异后再操作。')
    release.refresh_from_db()
    if release.status != 'ready' or release.processed != release.total or release.records.count() != release.total:
        raise ValidationError('导入未完整完成，不能启用。')
    if source.public_allowed and release.source_snapshot.get('data_license') and (
        release.source_snapshot['data_license'] != source.data_license
        or release.source_snapshot.get('license_url', '') != source.license_url
    ):
        raise ValidationError('新版许可与当前准入依据不同，请先撤回公开准入并重新核对来源。')
    if source.active_release_id == release.pk:
        return source
    release.source = source
    impact = release_diff(release)
    previous = str(source.active_release_id or '')
    source.active_release = release
    source.full_clean()
    LexiconSource.objects.filter(pk=source.pk).update(active_release=release)
    LexiconAudit.objects.create(action='activate_release', source=source, actor=actor, reason=reason,
                               before={'release': previous}, after={'release': str(release.pk), 'impact': impact})
    return source


@transaction.atomic
def revise(instance, *, value, note, expected_revision, actor=None):
    if not isinstance(instance, (Sense, Pronunciation)):
        raise ValidationError('不支持的修订类型。')
    model = type(instance)
    authorize(actor, f'lexicon.change_{model._meta.model_name}')
    require_reason(note)
    current = model.objects.select_for_update().get(pk=instance.pk)
    if current.revision != expected_revision:
        raise ValidationError('人工修订已改变，请重新读取后再保存。')
    field = 'editorial_definition' if isinstance(current, Sense) else 'editorial_value'
    old = {'id': str(current.pk), field: getattr(current, field), 'note': current.editorial_note, 'revision': current.revision}
    setattr(current, field, value)
    current.editorial_note = note
    current.revision += 1
    if isinstance(current, Sense):
        current.status = 'draft'
    else:
        current.is_reviewed = False
    current.full_clean()
    current.save()
    LexiconAudit.objects.create(action=f'revise_{model._meta.model_name}', actor=actor, reason=note,
                               before=old, after={'id': str(current.pk), field: value, 'revision': current.revision})
    return current


@transaction.atomic
def review_objects(queryset, *, publish, actor=None, reason='后台审查操作'):
    authorize(actor, 'lexicon.publish_lexicon')
    model = queryset.model
    if model not in (LexicalEntry, Sense, Pronunciation):
        raise ValidationError('此类型不支持发布操作。')
    for obj in queryset.select_for_update().order_by('pk'):
        field = 'is_reviewed' if model is Pronunciation else 'status'
        previous = getattr(obj, field)
        if model is LexicalEntry and obj.merged_into_id:
            raise ValidationError('已归并词条不能重新发布。')
        value = publish if model is Pronunciation else ('published' if publish else 'draft')
        setattr(obj, field, value)
        obj.save(update_fields=[field])
        LexiconAudit.objects.create(action='review', actor=actor, reason=reason,
                                   before={'model': model._meta.label, 'id': str(obj.pk), field: previous},
                                   after={field: value})


def build_matches():
    groups = defaultdict(list)
    for entry in LexicalEntry.objects.exclude(status='merged').order_by('id').values('id', 'language', 'lookup_key', 'kind'):
        groups[(entry['language'], entry['lookup_key'], entry['kind'])].append(entry['id'])
    rows = []
    existing = set(EntryMatch.objects.values_list('left_id', 'right_id'))
    for ids in groups.values():
        # No guesses or quadratic work on unexpectedly huge ambiguity groups.
        if len(ids) > 50:
            continue
        for left, right in combinations(ids, 2):
            if (left, right) not in existing:
                rows.append(EntryMatch(left_id=left, right_id=right))
    EntryMatch.objects.bulk_create(rows, ignore_conflicts=True, batch_size=500)
    return len(rows)


@transaction.atomic
def merge_match(match_id, *, reason, actor=None):
    authorize(actor, 'lexicon.change_entrymatch')
    require_reason(reason)
    # Imports lock their source; lock sources in a stable order before moving slots.
    list(LexiconSource.objects.select_for_update().order_by('pk').values_list('pk', flat=True))
    match = EntryMatch.objects.select_for_update().get(pk=match_id)
    entries = {e.pk: e for e in LexicalEntry.objects.select_for_update().filter(pk__in=[match.left_id, match.right_id]).order_by('pk')}
    left, right = entries[match.left_id], entries[match.right_id]
    if match.status != 'pending' or left.merged_into_id or right.merged_into_id:
        raise ValidationError('此候选已处理，或其中词条已归并。')
    if (left.language, left.kind) != (right.language, right.kind):
        raise ValidationError('不能跨语言或类型归并。')
    # Semantic slots and their provenance stay separate. Never merge senses by spelling.
    Sense.objects.filter(entry=right).update(entry=left)
    Pronunciation.objects.filter(entry=right).update(entry=left)
    right.merged_into = left
    right.status = 'merged'
    right.save(update_fields=['merged_into', 'status'])
    match.status, match.note = 'merged', reason
    match.save(update_fields=['status', 'note'])
    LexiconAudit.objects.create(action='merge_entries', actor=actor, reason=reason,
                               before={'left': str(left.pk), 'right': str(right.pk)},
                               after={'entry': str(left.pk), 'preserved_senses': list(map(str, left.senses.values_list('pk', flat=True)))})


def link_primary_records(release):
    """Add associations only. Never rewrite an existing choice, card or progress."""
    from catalog.models import ContentItem
    counts = {'created': 0, 'preserved': 0, 'missing_content': 0}
    content_map = dict(ContentItem.objects.filter(source_key__startswith='primary:').values_list('source_key', 'pk'))
    for record in release.records.select_related('binding'):
        content_id = content_map.get(record.binding.external_key)
        if not content_id:
            counts['missing_content'] += 1
            continue
        link, created = ContentEntryLink.objects.get_or_create(content_id=content_id, slot='main', defaults={
            'sense_id': record.binding.sense_id, 'pronunciation_id': record.binding.pronunciation_id,
            'evidence': record, 'method': 'inherited', 'review_note': '沿用现有教学词卡的释义与读音；不代表权威词典审校。',
        })
        counts['created' if created else 'preserved'] += 1
    return counts


def link_state(link):
    source = link.evidence.release.source
    if not source.enabled:
        return '来源已停用'
    if not source.active_release_id:
        return '来源尚未启用'
    current = SourceRecord.objects.filter(release_id=source.active_release_id, binding_id=link.evidence.binding_id).first()
    if not current:
        return '新版缺少该词条，需复核'
    if current.lexical_hash != link.evidence.lexical_hash:
        return '释义或读音已变化，需复核'
    return '来源一致（沿用原关联）'

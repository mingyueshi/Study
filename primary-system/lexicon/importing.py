"""Validated, resumable staging. Import never enables a source or publishes text."""
import hashlib
import json
import unicodedata
from collections import Counter
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from .models import (EntryForm, LexicalEntry, LexiconSource, Pronunciation, Sense,
                     SourceBinding, SourceRecord, SourceRelease, pinyin_key, search_key)


class ImportProblem(ValueError):
    pass


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def raw_value(raw, pointer):
    if not isinstance(pointer, str) or not pointer.startswith('/'):
        raise ImportProblem('来源字段必须使用 JSON Pointer，如 /word 或 /sections/0/text。')
    value = raw
    try:
        for part in pointer.split('/')[1:]:
            part = part.replace('~1', '/').replace('~0', '~')
            value = value[int(part)] if isinstance(value, list) and part.isdecimal() else value[part]
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise ImportProblem(f'来源字段路径不存在：{pointer}') from exc
    return value


def normalize_record(row):
    if not isinstance(row, dict):
        raise ImportProblem('记录必须是对象。')
    row = dict(row)
    row.setdefault('entry_key', '')
    if not isinstance(row['entry_key'], str) or len(row['entry_key']) > 300:
        raise ImportProblem('来源词头组标识格式不正确。')
    for field, limit in [('key', 300), ('language', 20), ('kind', 12), ('headword', 200), ('gloss_language', 20)]:
        value = row.get(field)
        if not isinstance(value, str) or not value.strip() or len(value) > limit:
            raise ImportProblem(f'{field} 必须为非空字符串，最长 {limit} 字符。')
    if row['kind'] not in LexicalEntry.Kind.values:
        raise ImportProblem('未知词条类型。')
    for field, limit in [('definition', 100000), ('pos', 80)]:
        row.setdefault(field, '')
        if not isinstance(row[field], str) or len(row[field]) > limit:
            raise ImportProblem(f'{field} 格式不正确。')
    pron = row.get('pronunciation', {})
    if not isinstance(pron, dict):
        raise ImportProblem('读音必须是对象。')
    pron = {'value': pron.get('value', ''), 'system': pron.get('system', 'other'), 'region': pron.get('region', '')}
    for key, limit in [('value', 300), ('system', 24), ('region', 40)]:
        if not isinstance(pron[key], str) or len(pron[key]) > limit:
            raise ImportProblem('读音字段格式不正确。')
    if pron['system'] not in ('pinyin', 'ipa', 'other'):
        raise ImportProblem('未知读音体系。')
    if not isinstance(row.get('raw'), dict) or not isinstance(row.get('field_paths'), dict):
        raise ImportProblem('必须保留原始对象 raw 和字段来源 field_paths。')
    for field in ['headword', 'definition'] + (['pronunciation'] if pron['value'] else []):
        if not isinstance(row['field_paths'].get(field), str) or not row['field_paths'][field].strip():
            raise ImportProblem(f'缺少 {field} 的原字段路径。')
        original = raw_value(row['raw'], row['field_paths'][field])
        supplied = pron['value'] if field == 'pronunciation' else row[field]
        if not isinstance(original, str) or unicodedata.normalize('NFC', original.strip()) != unicodedata.normalize('NFC', supplied.strip()):
            raise ImportProblem(f'{field} 与声明的原字段不一致；人工改写请使用独立修订。')
    row.setdefault('properties', {})
    row.setdefault('forms', [])
    if not isinstance(row['properties'], dict) or not isinstance(row['forms'], list):
        raise ImportProblem('属性或词形结构不正确。')
    if row['pos'] and raw_value(row['raw'], row['field_paths'].get('pos')) != row['pos']:
        raise ImportProblem('词性缺少对应原字段。')
    for key, value in row['properties'].items():
        if raw_value(row['raw'], row['field_paths'].get('properties.' + key)) != value:
            raise ImportProblem(f'属性 {key} 缺少对应原字段。')
    for form in row['forms']:
        if not isinstance(form, dict) or not isinstance(form.get('text'), str) or not form['text'].strip() or len(form['text']) > 200:
            raise ImportProblem('词形格式不正确。')
        if form.get('role') not in ('alias', 'inflection', 'variant') or not isinstance(form.get('source_path'), str) or not form['source_path']:
            raise ImportProblem('词形必须说明关系和来源字段。')
        if raw_value(row['raw'], form['source_path']) != form['text']:
            raise ImportProblem('词形与声明的原字段不一致。')
    row['pronunciation'] = pron
    row['headword'] = unicodedata.normalize('NFC', row['headword'].strip())
    row['raw_hash'] = digest(row['raw'])
    # No lowercasing, guessed POS, or splitting a mixed source gloss into invented senses.
    row['lexical_hash'] = digest([row[k] for k in ('language', 'kind', 'headword', 'gloss_language', 'definition', 'pos')] + [pron])
    if row.get('target_sense'):
        try:
            sense = Sense.objects.select_related('entry').get(pk=row['target_sense'])
        except (Sense.DoesNotExist, ValidationError, ValueError) as exc:
            raise ImportProblem('显式对齐目标义项不存在。') from exc
        if (sense.entry.language, sense.entry.kind, sense.entry.headword, sense.gloss_language) != (row['language'], row['kind'], row['headword'], row['gloss_language']):
            raise ImportProblem('显式对齐目标的语言、词头、类型或释义语言不一致。')
    return row


def validate_manifest(manifest):
    if not isinstance(manifest, dict) or manifest.get('schema_version') != 1:
        raise ImportProblem('不支持的词库清单版本。')
    source = manifest.get('source')
    if not isinstance(source, dict) or not isinstance(source.get('code'), str) or not isinstance(source.get('name'), str):
        raise ImportProblem('缺少来源标识和名称。')
    # Validate with Django field validators, without inspecting or changing existing rights.
    obj = LexiconSource(code=source['code'], name=source['name'], url=source.get('url', ''))
    obj.full_clean(exclude=['id'], validate_unique=False, validate_constraints=False)
    version = manifest.get('version')
    if not isinstance(version, str) or not version.strip() or len(version) > 120:
        raise ImportProblem('版本标识格式不正确。')
    adapter = manifest.get('adapter', 'interchange-v1')
    if not isinstance(adapter, str) or not adapter or len(adapter) > 80:
        raise ImportProblem('适配器标识格式不正确。')
    records = manifest.get('records')
    if not isinstance(records, list) or not records:
        raise ImportProblem('记录列表不能为空；停用来源请使用后台来源开关。')
    prepared, keys, groups = [], set(), {}
    for index, record in enumerate(records, 1):
        try:
            normalized = normalize_record(record)
        except (ImportProblem, ValidationError) as exc:
            raise ImportProblem(f'第 {index} 条：{exc}') from exc
        if normalized['key'] in keys:
            raise ImportProblem(f'来源内重复标识：{normalized["key"]}')
        keys.add(normalized['key'])
        if normalized['entry_key']:
            identity = tuple(normalized[k] for k in ('language', 'headword', 'kind', 'pos'))
            previous = groups.setdefault(normalized['entry_key'], identity)
            if previous != identity:
                raise ImportProblem('同一个来源词头组不能混用语言、词头、类型或词性。')
        prepared.append(normalized)
    return prepared


def stage_manifest(manifest, *, dry_run=False, batch_size=500, exact_reuse=False, on_batch=None):
    if not 1 <= batch_size <= 2000:
        raise ImportProblem('批量大小应在 1–2000 之间。')
    rows = validate_manifest(manifest)
    checksum = digest(manifest)
    report = {'records': len(rows), 'missing_definition': sum(not r['definition'].strip() or r['definition'].strip() == '无' for r in rows),
              'missing_pronunciation': sum(r['pronunciation']['value'].strip() in ('', '无') for r in rows),
              'exact_reuse': exact_reuse, 'dry_run': dry_run}
    if 'selection_report' in manifest:
        report['selection'] = manifest['selection_report']
    source_info = manifest['source']
    existing_release = SourceRelease.objects.filter(source__code=source_info['code'], version=manifest['version']).first()
    if existing_release and existing_release.checksum != checksum:
        raise ImportProblem('同一来源版本已有不同内容；请使用新版本号。')
    if existing_release and existing_release.report.get('exact_reuse', False) != exact_reuse:
        raise ImportProblem('同一版本不能更改词条复用策略。')
    # Validate every existing mapping before any chunk writes, including resumed imports.
    bindings = SourceBinding.objects.filter(source__code=source_info['code']).select_related('sense__entry', 'pronunciation')
    by_key = {b.external_key: b for b in bindings}
    by_group = {b.entry_key: b for b in bindings if b.entry_key}
    for row in rows:
        binding = by_key.get(row['key'])
        if binding:
            assert_binding(binding, row)
        grouped = by_group.get(row['entry_key'])
        if grouped and any(grouped.identity[k] != row[k] for k in ('language', 'headword', 'kind')):
            raise ImportProblem('已有来源词头组身份不一致。')
        if grouped and row.get('target_sense') and str(Sense.objects.get(pk=row['target_sense']).entry_id) != str(grouped.sense.entry_id):
            raise ImportProblem('来源词头组不能对齐到不同词条。')
    if dry_run:
        return None, {**report, 'new_source_keys': sum(r['key'] not in by_key for r in rows)}
    with transaction.atomic():
        source, _ = LexiconSource.objects.get_or_create(code=source_info['code'], defaults={
            'name': source_info['name'], 'url': source_info.get('url', ''),
            'attribution': source_info.get('attribution', ''),
            'code_license': source_info.get('code_license', ''), 'data_license': source_info.get('data_license', ''),
            'license_url': source_info.get('license_url', ''), 'changes': source_info.get('changes', ''),
            'rights_evidence': source_info.get('rights_evidence', '未核准公开展示；本次仅导入暂存区。'),
        })
        LexiconSource.objects.select_for_update().get(pk=source.pk)
        release, _ = SourceRelease.objects.get_or_create(source=source, version=manifest['version'], defaults={
            'checksum': checksum, 'adapter': manifest.get('adapter', 'interchange-v1'),
            'source_files': manifest.get('source_files', {}), 'source_snapshot': source_info,
            'total': len(rows), 'report': report,
        })
        if release.checksum != checksum or release.report.get('exact_reuse', False) != exact_reuse:
            raise ImportProblem('版本内容或导入策略冲突。')
    if release.status == 'ready':
        return release, {**release.report, 'already_staged': True, 'entries_created': 0,
                         'bindings_created': 0, 'exact_reused': 0, 'explicitly_aligned': 0,
                         'version_totals': release.report}
    try:
        while True:
            with transaction.atomic():
                LexiconSource.objects.select_for_update().get(pk=source.pk)
                release.refresh_from_db()
                if release.status == 'ready':
                    break
                batch = rows[release.processed:release.processed + batch_size]
                stats = stage_batch(release, batch, exact_reuse=exact_reuse)
                report = dict(release.report)
                for key, count in stats.items():
                    report[key] = report.get(key, 0) + count
                release.processed += len(batch)
                release.status = 'ready' if release.processed == release.total else 'importing'
                release.report, release.error = report, ''
                if release.status == 'ready':
                    release.completed_at = timezone.now()
                release.save(update_fields=['processed', 'status', 'report', 'error', 'completed_at'])
            if on_batch:
                on_batch(release)
            if release.status == 'ready':
                break
    except Exception as exc:
        # A killed process leaves IMPORTING and its last committed cursor; both states resume.
        SourceRelease.objects.filter(pk=release.pk).exclude(status='ready').update(status='failed', error=str(exc)[:2000])
        raise
    return release, dict(release.report)


def assert_binding(binding, row):
    if binding.entry_key != row.get('entry_key', ''):
        raise ImportProblem('来源词头组标识改变，请用新来源键并人工核对。')
    if binding.identity != {key: row[key] for key in ('language', 'headword', 'kind', 'gloss_language')}:
        raise ImportProblem(f'{row["key"]} 的身份字段改变，请用新来源键并人工对齐。')
    if row.get('target_sense') and str(binding.sense_id) != str(row['target_sense']):
        raise ImportProblem('已有来源身份映射不能静默改绑。')
    if binding.pronunciation and (binding.pronunciation.system, binding.pronunciation.region) != (row['pronunciation']['system'], row['pronunciation']['region']):
        raise ImportProblem('读音体系或地区改变，请创建新的来源键。')


def stage_batch(release, rows, *, exact_reuse):
    source = release.source
    bindings = {b.external_key: b for b in SourceBinding.objects.filter(source=source, external_key__in=[r['key'] for r in rows]).select_related('sense__entry', 'pronunciation')}
    matches = {}
    groups = {}
    for binding in SourceBinding.objects.filter(source=source, entry_key__in=[r['entry_key'] for r in rows if r['entry_key']]).select_related('sense__entry'):
        groups.setdefault(binding.entry_key, (binding.sense.entry, binding.identity))
    if exact_reuse:
        for record in SourceRecord.objects.filter(lexical_hash__in=[r['lexical_hash'] for r in rows]).select_related('binding__sense__entry', 'binding__pronunciation').order_by('pk'):
            matches.setdefault(record.lexical_hash, record.binding)
    new_entries, new_senses, new_pronunciations, new_bindings, records, forms = [], [], [], [], [], []
    stats = Counter()
    for row in rows:
        binding = bindings.get(row['key'])
        if binding:
            assert_binding(binding, row)
        else:
            matching = matches.get(row['lexical_hash']) if exact_reuse else None
            if row.get('target_sense'):
                sense = Sense.objects.select_related('entry').get(pk=row['target_sense'])
                entry, pronunciation = sense.entry, None
                if row['entry_key']:
                    previous = groups.get(row['entry_key'])
                    if previous and previous[0].pk != entry.pk:
                        raise ImportProblem('来源词头组不能对齐到不同词条。')
                    groups[row['entry_key']] = (entry, row)
                stats['explicitly_aligned'] += 1
            elif matching:
                assert_binding(matching, row)
                sense, entry, pronunciation = matching.sense, matching.sense.entry, matching.pronunciation
                stats['exact_reused'] += 1
            else:
                group = groups.get(row['entry_key']) if row['entry_key'] else None
                if group:
                    entry, identity = group
                    if any(identity[k] != row[k] for k in ('language', 'headword', 'kind')):
                        raise ImportProblem('已有来源词头组身份不一致。')
                else:
                    entry = LexicalEntry(language=row['language'], headword=row['headword'], lookup_key=search_key(row['headword']), kind=row['kind'])
                    new_entries.append(entry)
                    stats['entries_created'] += 1
                    if row['entry_key']:
                        groups[row['entry_key']] = (entry, row)
                sense = Sense(entry=entry, gloss_language=row['gloss_language'])
                new_senses.append(sense)
                pronunciation = None
            if pronunciation is None:
                pronunciation = Pronunciation(entry=entry, system=row['pronunciation']['system'], region=row['pronunciation']['region'])
                new_pronunciations.append(pronunciation)
            binding = SourceBinding(source=source, external_key=row['key'], entry_key=row['entry_key'], sense=sense, pronunciation=pronunciation,
                                    identity={key: row[key] for key in ('language', 'headword', 'kind', 'gloss_language')})
            new_bindings.append(binding)
            stats['bindings_created'] += 1
            matches.setdefault(row['lexical_hash'], binding)
        record = SourceRecord(release=release, binding=binding, raw=row['raw'], raw_hash=row['raw_hash'],
                              lexical_hash=row['lexical_hash'], headword=row['headword'], definition=row['definition'],
                              part_of_speech=row['pos'], pronunciation_value=row['pronunciation']['value'],
                              pronunciation_key=(pinyin_key if row['pronunciation']['system'] == 'pinyin' else search_key)(row['pronunciation']['value']), properties=row['properties'], field_paths=row['field_paths'])
        records.append(record)
        all_forms = [{'text': row['headword'], 'role': 'headword', 'source_path': row['field_paths']['headword']}] + row['forms']
        seen = set()
        for form in all_forms:
            key = (form['text'], form['role'])
            if key not in seen:
                forms.append(EntryForm(record=record, text=form['text'], lookup_key=search_key(form['text']), role=form['role'], source_path=form['source_path']))
                seen.add(key)
    for model, objects in [(LexicalEntry, new_entries), (Sense, new_senses), (Pronunciation, new_pronunciations),
                           (SourceBinding, new_bindings), (SourceRecord, records), (EntryForm, forms)]:
        model.objects.bulk_create(objects, batch_size=500)
    return stats

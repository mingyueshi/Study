"""题库批次导入：全有或全无、只新增、回执防重。

批次 JSON 是 Git 跟踪的数据文件（``data/questions/``），经 ``import_questions``
命令导入。约定：

- 批次指纹 = 对整份清单的规范 JSON 做 sha256；同一 ``batch_id`` 重复导入
  同内容幂等跳过，内容变了必须换新批次——不自动覆盖任何已有题。
- 题目 UUID 由 ``source_key``/``source_ref`` 确定性推导，导入时重算比对，
  防止手改来源定位后身份漂移。
- 同 uuid 但内容指纹不同的冲突一律报错中止（保护人工内容），由人工处理。
- 预演（``dry_run``）走完整校验后回滚，不落任何行。
"""
import hashlib
import json

from django.core.exceptions import ValidationError
from django.db import transaction

from . import types
from .models import ImportReceipt, Question

SCHEMA_VERSION = 1
MAX_GRADE = 9


def batch_digest(value):
    encoded = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(encoded.encode()).hexdigest()


def _plain(value, field):
    """题面文案用中文标点：不允许英文双引号与裸换行。"""
    if isinstance(value, str) and ('"' in value or '\n' in value or '\r' in value):
        raise ValidationError(f'第 {field} 处的文本里不能出现英文双引号或裸换行，请用中文标点。')


def validate_entry(entry, index):
    if not isinstance(entry, dict):
        raise ValidationError(f'第 {index + 1} 题不是对象。')
    for key in ('uuid', 'type', 'area', 'stem', 'payload', 'tags', 'source_key', 'source_ref'):
        if key not in entry:
            raise ValidationError(f'第 {index + 1} 题缺少字段 {key}。')
    spec = types.TYPE_REGISTRY.get(entry['type'])
    if spec is None:
        raise ValidationError(f'第 {index + 1} 题题型未知：{entry["type"]}。')
    if entry['area'] not in Question.Area.values:
        raise ValidationError(f'第 {index + 1} 题学科未知：{entry["area"]}。')
    grade = entry.get('grade')
    if grade is not None and (isinstance(grade, bool) or not isinstance(grade, int) or not 1 <= grade <= MAX_GRADE):
        raise ValidationError(f'第 {index + 1} 题年级只能是 1~{MAX_GRADE} 的整数或空。')
    if not isinstance(entry['stem'], str) or not entry['stem'].strip():
        raise ValidationError(f'第 {index + 1} 题题干为空。')
    _plain(entry['stem'], index + 1)
    if not isinstance(entry['tags'], list) or not all(isinstance(tag, str) and tag.strip() for tag in entry['tags']):
        raise ValidationError(f'第 {index + 1} 题标签须是非空字符串列表。')
    for tag in entry['tags']:
        _plain(tag, index + 1)
    if not isinstance(entry['source_key'], str) or not entry['source_key'].strip():
        raise ValidationError(f'第 {index + 1} 题来源为空。')
    if not isinstance(entry['source_ref'], str) or not entry['source_ref'].strip():
        raise ValidationError(f'第 {index + 1} 题来源定位为空。')
    _plain(entry['source_ref'], index + 1)
    try:
        spec['validate'](entry['payload'])
    except types.InvalidPayload as error:
        raise ValidationError(f'第 {index + 1} 题数据不合法：{error}') from error
    expected = str(types.question_uuid(entry['source_key'], entry['source_ref']))
    if entry['uuid'] != expected:
        raise ValidationError(f'第 {index + 1} 题内容身份与来源定位不一致（应为 {expected}）。')


def import_batch(payload, *, source='', dry_run=False):
    """导入一个批次：校验 → 冲突检测 → 事务写入（dry_run 回滚）→ 回执。"""
    if not isinstance(payload, dict):
        raise ValidationError('批次文件必须是对象。')
    if payload.get('schema_version') != SCHEMA_VERSION:
        raise ValidationError(f'不支持的批次 schema_version：{payload.get("schema_version")}。')
    batch_id = payload.get('batch_id')
    if not isinstance(batch_id, str) or not batch_id.strip():
        raise ValidationError('批次缺少 batch_id。')
    questions = payload.get('questions')
    if not isinstance(questions, list) or not questions:
        raise ValidationError('批次没有任何题目。')

    digest = batch_digest(payload)
    existing_receipt = ImportReceipt.objects.filter(batch_id=batch_id).first()
    if existing_receipt is not None:
        if existing_receipt.digest == digest:
            return {'status': 'already', 'batch_id': batch_id,
                    'total': existing_receipt.total, 'imported': 0, 'duplicated': existing_receipt.imported}
        raise ValidationError('批次标识已被不同内容的批次占用，请换新的 batch_id。')

    for index, entry in enumerate(questions):
        validate_entry(entry, index)
    keys = [(entry['source_key'], entry['source_ref']) for entry in questions]
    if len(keys) != len(set(keys)):
        raise ValidationError('批次内来源定位重复。')
    uuids = {entry['uuid'] for entry in questions}
    if len(uuids) != len(questions):
        raise ValidationError('批次内内容身份重复。')

    existing = {str(row.uuid): row for row in Question.objects.filter(uuid__in=uuids)}
    fresh, duplicated, conflicts = [], [], []
    for entry in questions:
        current = existing.get(entry['uuid'])
        if current is None:
            fresh.append(entry)
            continue
        checksum = types.content_checksum(
            question_type=entry['type'], area=entry['area'], grade=entry.get('grade'),
            stem=entry['stem'], payload=entry['payload'], tags=entry['tags'],
            source_key=entry['source_key'], source_ref=entry['source_ref'])
        (duplicated if current.checksum == checksum else conflicts).append(entry)

    if conflicts:
        names = '、'.join(entry['source_ref'] for entry in conflicts[:5])
        raise ValidationError(f'以下题目已存在但内容不同，需人工处理，不做覆盖：{names}')

    with transaction.atomic():
        for entry in fresh:
            Question.objects.create(
                uuid=entry['uuid'], type=entry['type'], area=entry['area'], grade=entry.get('grade'),
                stem=entry['stem'], payload=entry['payload'], tags=entry['tags'],
                source_key=entry['source_key'], source_ref=entry['source_ref'])
        ImportReceipt.objects.create(batch_id=batch_id, digest=digest, source=source[:200],
                                     total=len(questions), imported=len(fresh), duplicated=len(duplicated))
        if dry_run:
            transaction.set_rollback(True)
    return {'status': 'dry-run' if dry_run else 'imported', 'batch_id': batch_id,
            'total': len(questions), 'imported': len(fresh), 'duplicated': len(duplicated)}

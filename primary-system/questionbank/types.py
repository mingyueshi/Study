"""题型注册表：每种题型一个条目，登记 schema 校验、判分与答案呈现。

加新题型（填空 fill、数值 numeric、连线 match、排序 sort……）只在这里
注册新条目，模型、判分接口与导入管线都不用动。约定：

- ``validate``：导入与保存时校验 ``payload`` 的形状，不合法抛 ``InvalidPayload``；
- ``judge``：服务端判分。``given`` 是前端提交的作答字典，形状由题型约定
  （choice/truefalse 用 ``value``，selfcheck 用 ``self``），不可用抛
  ``InvalidAnswer``；判分一律在服务端完成，不信任前端结论；
- ``reveal``：反馈区展示的「正确答案」文本。
"""
import hashlib
import json
import uuid


class InvalidPayload(Exception):
    """题目数据不满足该题型的 schema（导入/保存时）。"""


class InvalidAnswer(Exception):
    """提交的作答不是该题型可判分的形状（上报端点 400）。"""


def _require(condition, message):
    if not condition:
        raise InvalidPayload(message)


def _text(value):
    return isinstance(value, str) and value.strip() != ''


def _no_quotes(payload, *keys):
    """数据字符串用中文标点：题面文案不允许出现英文双引号与裸换行。"""
    for key in keys:
        value = payload.get(key)
        if isinstance(value, str) and ('"' in value or '\n' in value or '\r' in value):
            raise InvalidPayload(f'{key} 里不能出现英文双引号或裸换行，请用中文标点。')


# ── 选择题 choice ────────────────────────────────────────────────────────────

def validate_choice(payload):
    options = payload.get('options')
    _require(isinstance(options, list) and len(options) >= 2,
             '选择题需要至少 2 个选项。')
    _require(len(set(options)) == len(options), '选择题的选项不能重复。')
    _require(all(_text(option) for option in options), '每个选项都需是非空文本。')
    answer = payload.get('answer')
    _require(isinstance(answer, int) and not isinstance(answer, bool) and 0 <= answer < len(options),
             '答案必须是选项范围内的下标。')
    _require(_text(payload.get('explanation')), '选择题需要解析。')
    _no_quotes({'options': ' '.join(options)}, 'options')


def judge_choice(payload, given):
    value = (given or {}).get('value')
    if isinstance(value, bool) or not isinstance(value, int) or not 0 <= value < len(payload['options']):
        raise InvalidAnswer('选择题作答须是选项范围内的下标。')
    return value == payload['answer']


def reveal_choice(payload):
    return payload['options'][payload['answer']]


# ── 判断题 truefalse ─────────────────────────────────────────────────────────

def validate_truefalse(payload):
    _require(isinstance(payload.get('answer'), bool), '判断题答案必须是布尔值。')
    _require(_text(payload.get('explanation')), '判断题需要解析。')
    _no_quotes(payload, 'explanation')


def judge_truefalse(payload, given):
    value = (given or {}).get('value')
    if not isinstance(value, bool):
        raise InvalidAnswer('判断题作答须是布尔值。')
    return value == payload['answer']


def reveal_truefalse(payload):
    return '对' if payload['answer'] else '错'


# ── 自评题 selfcheck ─────────────────────────────────────────────────────────

def validate_selfcheck(payload):
    _require(_text(payload.get('answer')), '自评题需要参考答案。')
    _require(isinstance(payload.get('steps', ''), str), '解题步骤须是文本。')
    _no_quotes(payload, 'answer', 'steps')


def judge_selfcheck(payload, given):
    value = (given or {}).get('self')
    if value not in ('right', 'wrong'):
        raise InvalidAnswer('自评题作答须是 right 或 wrong。')
    return value == 'right'


def reveal_selfcheck(payload):
    return payload['answer']


TYPE_REGISTRY = {
    'choice': {
        'label': '选择题',
        'validate': validate_choice,
        'judge': judge_choice,
        'reveal': reveal_choice,
    },
    'truefalse': {
        'label': '判断题',
        'validate': validate_truefalse,
        'judge': judge_truefalse,
        'reveal': reveal_truefalse,
    },
    'selfcheck': {
        'label': '自评题',
        'validate': validate_selfcheck,
        'judge': judge_selfcheck,
        'reveal': reveal_selfcheck,
    },
}


def validate(question_type, payload):
    """按题型校验 payload；未知题型同样报错，避免静默进库。"""
    spec = TYPE_REGISTRY.get(question_type)
    if spec is None:
        raise InvalidPayload(f'未知题型：{question_type}。')
    if not isinstance(payload, dict):
        raise InvalidPayload('payload 必须是对象。')
    spec['validate'](payload)


def judge(question_type, payload, given):
    """服务端判分，返回是否答对；given 形状不合法抛 InvalidAnswer。"""
    return TYPE_REGISTRY[question_type]['judge'](payload, given)


def reveal(question_type, payload):
    """反馈区展示的正确答案文本。"""
    return TYPE_REGISTRY[question_type]['reveal'](payload)


def question_uuid(source_key, source_ref):
    """稳定内容身份：由来源定位确定性推导，重跑生成物不漂移。"""
    return uuid.uuid5(uuid.NAMESPACE_URL, f'primary-system/questionbank/{source_key}/{source_ref}')


def content_checksum(*, question_type, area, grade, stem, payload, tags, source_key, source_ref):
    """题目内容指纹：导入用它检测「同 uuid 但内容变了」的冲突。"""
    body = {'type': question_type, 'area': area, 'grade': grade, 'stem': stem,
            'payload': payload, 'tags': tags, 'source_key': source_key, 'source_ref': source_ref}
    encoded = json.dumps(body, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(encoded.encode()).hexdigest()

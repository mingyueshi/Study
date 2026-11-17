"""数学之美的只读内容与交互配置；结构校验先于数据发布。"""
from functools import lru_cache
import json
from pathlib import Path
import re
from urllib.parse import urlparse

from django.core.exceptions import ImproperlyConfigured

DATA_PATH = Path(__file__).parent / 'data' / 'topics.json'
TOPICS = ('golden', 'fibonacci', 'symmetry-fractals', 'mobius', 'topology')
LABS = {'golden', 'fibonacci', 'sunflower', 'symmetry', 'fractal', 'mobius', 'topology', 'euler'}
ID = re.compile(r'[a-z][a-z0-9-]{1,50}')
CONTRACTS = {
    'golden': ('split', 'long short whole parts gap', 'close apart'),
    'fibonacci': ('terms', 'sequence addition ratio error', ''),
    'sunflower': ('angle seeds', 'angle golden count', ''),
    'symmetry': ('sides turn axes', 'angle axes overlap', 'yes no'),
    'fractal': ('level', 'level pieces scale area', ''),
    'mobius': ('band travel view', 'laps sides boundaries orientation', 'one two start moving flipped same'),
    'topology': ('shape deform', 'components holes boundaries', ''),
    'euler': ('solid', 'vertices edges faces chi', ''),
}


def require(condition, message):
    if not condition:
        raise ImproperlyConfigured(message)


def text(value):
    require(isinstance(value, str) and bool(value.strip()) and len(value) <= 1200, '正文应为非空短文本。')
    require(not any(c in value for c in ('\n', '\r', '"')) and not re.search(r'<[a-zA-Z/!?]', value), '正文标点或标签不合法。')


def texts(values, minimum=1):
    require(isinstance(values, list) and len(values) >= minimum, '正文列表不能为空。')
    for value in values:
        text(value)


def validate(data):
    require(isinstance(data, dict) and data.get('schema_version') == 1, '数学之美数据版本不正确。')
    for key in ('title', 'lead'):
        text(data.get(key))
    topics = data.get('topics')
    require(isinstance(topics, list) and all(isinstance(t, dict) for t in topics), '专题必须是对象列表。')
    require(tuple(t.get('id') for t in topics) == TOPICS, '五个专题的稳定 ID 或顺序不正确。')
    lab_ids, quiz_ids = set(), set()
    for topic in topics:
        for key in ('title', 'emoji', 'blurb', 'question', 'prerequisite'):
            text(topic.get(key))
        require(topic.get('color') in ('gold', 'teal', 'violet', 'blue', 'coral'), '专题颜色未登记。')
        texts(topic.get('opening'), 2)
        concepts = topic.get('concepts')
        require(isinstance(concepts, list) and len(concepts) >= 3, '每站至少有三个概念。')
        for concept in concepts:
            require(isinstance(concept, dict), '概念必须是对象。')
            text(concept.get('title')); text(concept.get('text'))
            if 'formula' in concept:
                text(concept['formula'])
        labs = topic.get('labs')
        require(isinstance(labs, list) and labs, '每站至少有一个实验。')
        for lab in labs:
            require(isinstance(lab, dict) and lab.get('kind') in LABS, '实验类型未登记。')
            lab_id = lab.get('id')
            require(isinstance(lab_id, str) and ID.fullmatch(lab_id) and lab_id not in lab_ids, '实验 ID 不合法或重复。')
            lab_ids.add(lab_id)
            for key in ('title', 'lead', 'caption', 'fallback'):
                text(lab.get(key))
            require(lab.get('figure') == f"mathbeauty/figures/{lab['kind']}.svg", '图示必须是本专题的本地 SVG。')
            controls = lab.get('controls')
            require(isinstance(controls, list) and controls, '实验缺少操作控件。')
            control_ids = set()
            for control in controls:
                require(isinstance(control, dict), '控件必须是对象。')
                cid = control.get('id')
                require(isinstance(cid, str) and ID.fullmatch(cid) and cid not in control_ids, '控件 ID 不合法或重复。')
                control_ids.add(cid); text(control.get('label'))
                kind = control.get('type')
                require(kind in ('range', 'select', 'checkbox'), '控件类型未登记。')
                if kind == 'range':
                    vals = [control.get(k) for k in ('min', 'max', 'step', 'value')]
                    require(all(isinstance(v, (int, float)) and not isinstance(v, bool) for v in vals), '滑块必须使用数值。')
                    low, high, step, value = vals
                    require(low < high and step > 0 and low <= value <= high, '滑块边界不正确。')
                elif kind == 'select':
                    options = control.get('options')
                    require(isinstance(options, list) and len(options) >= 2, '选择器缺少选项。')
                    values = []
                    for option in options:
                        require(isinstance(option, dict), '选项必须是对象。')
                        text(option.get('label')); text(option.get('value')); values.append(option['value'])
                    require(len(set(values)) == len(values) and control.get('value') in values, '选择器默认值或选项不正确。')
                else:
                    require(isinstance(control.get('value'), bool), '勾选默认值必须是布尔值。')
            expected_controls, expected_outputs, expected_messages = CONTRACTS[lab['kind']]
            require(control_ids == set(expected_controls.split()), '实验控件与模型不匹配。')
            for entry in lab.get('readouts', []):
                require(isinstance(entry, dict) and isinstance(entry.get('id'), str) and ID.fullmatch(entry['id']), '读数 ID 不合法。')
                text(entry.get('label'))
            require(bool(lab.get('readouts')), '实验缺少数值读数。')
            require(sorted(entry['id'] for entry in lab['readouts']) == sorted(expected_outputs.split()), '实验读数与模型不匹配。')
            for action in lab.get('actions', []):
                require(isinstance(action, dict) and action.get('id') in ('snap', 'next', 'reset'), '实验动作未登记。')
                text(action.get('label'))
            messages = lab.get('messages', {})
            require(isinstance(messages, dict), '实验提示应为映射。')
            require(set(expected_messages.split()).issubset(messages), '实验缺少必要的反馈文案。')
            for value in messages.values():
                text(value)
        deep, activity = topic.get('deep'), topic.get('activity')
        require(isinstance(deep, dict) and isinstance(activity, dict), '缺少深入阅读或动手活动。')
        text(deep.get('title')); texts(deep.get('paragraphs'), 2); text(deep.get('formula'))
        text(activity.get('title')); texts(activity.get('steps'), 3); text(activity.get('result'))
        texts(topic.get('cautions'), 2)
        quiz = topic.get('quiz')
        require(isinstance(quiz, list) and len(quiz) == 3, '每站应有三道探索判断题。')
        for question in quiz:
            require(isinstance(question, dict), '题目必须是对象。')
            qid = question.get('id')
            require(isinstance(qid, str) and ID.fullmatch(qid) and qid not in quiz_ids, '题目 ID 不合法或重复。')
            quiz_ids.add(qid); text(question.get('prompt')); texts(question.get('options'), 3)
            answer = question.get('answer')
            require(type(answer) is int and 0 <= answer < len(question['options']), '题目答案超出选项。')
            text(question.get('explanation'))
        sources = topic.get('sources')
        require(isinstance(sources, list) and sources, '每站必须有可核查的出处。')
        for source in sources:
            require(isinstance(source, dict), '出处必须是对象。')
            text(source.get('title')); text(source.get('publisher'))
            url = source.get('url', '')
            require(isinstance(url, str) and urlparse(url).scheme == 'https' and bool(urlparse(url).netloc), '出处必须是 HTTPS 链接。')
    require({lab['kind'] for topic in topics for lab in topic['labs']} == LABS, '八种实验必须全部覆盖。')
    return data


@lru_cache(maxsize=1)
def load_data():
    return validate(json.loads(DATA_PATH.read_text(encoding='utf-8')))

"""从同一个例句的主语和动词生成三种说法，供切换、对照和练习复用。"""
import json
import re
from functools import lru_cache
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from django.shortcuts import render
from django.views.decorators.http import require_safe

DATA_PATH = Path(__file__).resolve().parents[1] / 'content_sources' / 'english-sentence-lab.json'
MODES = {
    'affirmative': ('肯定句', '说一件事'),
    'negative': ('否定句', '说不、没有或不是'),
    'question': ('疑问句', '问是不是'),
}
SUBJECTS = {'I', 'You', 'He', 'She', 'It', 'We', 'They'}
THIRD_PERSON = {'he', 'she', 'it'}
BE_FORMS = {'is', 'are'}
DO_FORMS = {'do', 'does', 'did'}
CONTRACTIONS = {
    'do': "don't", 'does': "doesn't", 'did': "didn't",
    'is': "isn't", 'are': "aren't", 'can': "can't", 'will': "won't",
}
ROLE_LABELS = {'aux': '助动词', 'be': 'be 动词', 'modal': '情态动词', 'verb': '主要动词', 'neg': '否定词'}


def _require(condition, message):
    if not condition:
        raise ImproperlyConfigured(f'英语造句实验室数据异常：{message}')


def _has_text(record, keys):
    return isinstance(record, dict) and all(
        isinstance(record.get(key), str) and record[key].strip() for key in keys
    )


def _form(example, mode, parts, explanation, ipa, *, spoken=''):
    end = '?' if mode == 'question' else '.'
    words = [
        {'text': text, 'role': role, 'label': ROLE_LABELS.get(role, ''), 'ipa': ipa.get(text.lower(), '')}
        for text, role in parts if text
    ]
    return {
        'id': mode,
        'label': MODES[mode][0],
        'en': ' '.join(word['text'] for word in words) + end,
        'cn': example['zh'][mode],
        'parts': words,
        'end': end,
        'focus': [word for word in words if word['label']],
        'explanation': explanation,
        'spoken': spoken,
    }


def _example(entry, ipa):
    example_id, subject, helper = (entry[key] for key in ('id', 'subject', 'helper'))
    verb, affirmative = entry.get('verb', ''), entry.get('positive', '')
    rest = entry.get('rest', '')
    _require(_has_text(entry, ('label', 'context')) and subject in SUBJECTS
             and helper in CONTRACTIONS and _has_text(entry.get('zh'), MODES),
             f'{example_id} 的主题、主语或译文无效')
    _require(isinstance(rest, str) and rest == rest.strip() and not re.search(r'[.?!\r\n]', rest)
             and ('note' not in entry or _has_text(entry, ('note',))), f'{example_id} 的句尾或补充说明无效')
    _require((helper != 'do' or subject.lower() not in THIRD_PERSON)
             and (helper not in {'does', 'is'} or subject.lower() in THIRD_PERSON)
             and (helper != 'are' or subject.lower() in {'you', 'we', 'they'}),
             f'{example_id} 的助动词与主语不匹配')

    needs_do = helper in DO_FORMS
    _require(isinstance(verb, str) and (verb in ipa or (not verb and helper in BE_FORMS and rest))
             and isinstance(affirmative, str) and (affirmative in ipa if needs_do else not affirmative),
             f'{example_id} 的主要动词或音标无效')
    _require(helper in ipa and 'not' in ipa and (helper != 'can' or 'cannot' in ipa),
             f'{example_id} 缺少助动词或否定词音标')

    role = 'aux' if needs_do else 'be' if helper in BE_FORMS else 'modal'
    subject_parts = [(subject, 'subject')]
    verb_parts = [(verb, 'verb'), (rest, 'rest')]
    question_subject = subject if subject == 'I' else subject.lower()

    if needs_do:
        yes_parts = subject_parts + [(affirmative, 'verb'), (rest, 'rest')]
        yes_explain = f'肯定句直接用 {affirmative}。切到否定句或疑问句，再看看 {helper} 出现在哪儿。'
        verb_change = f'{affirmative} 还原成 {verb}' if affirmative != verb else f'主要动词 {verb} 保持原形'
        no_explain = f'在主语后加 {helper} not，{verb_change}。'
        question_explain = f'把 {helper.capitalize()} 放在主语前，{verb_change}，句末加问号。'
    else:
        yes_parts = subject_parts + [(helper, role)] + verb_parts
        yes_explain = f'肯定句里已经有 {helper}。试试切换句型，看看它后面加了什么，或者移到了哪里。'
        no_explain = f'在 {helper} 后加 not。' if helper != 'can' else 'can 和 not 合写成 cannot。'
        question_explain = f'把 {helper.capitalize()} 移到主语前，句末加问号。'
        if verb:
            no_explain += f'后面的 {verb} 保持原样。'
            question_explain += f'后面的 {verb} 保持原样。'

    negative = [('cannot', role)] if helper == 'can' else [(helper, role), ('not', 'neg')]
    spoken = ' '.join(filter(None, (subject, CONTRACTIONS[helper], verb, rest))) + '.'
    return {
        **entry,
        'forms': [
            _form(entry, 'affirmative', yes_parts, yes_explain, ipa),
            _form(entry, 'negative', subject_parts + negative + verb_parts, no_explain, ipa, spoken=spoken),
            _form(entry, 'question', [(helper.capitalize(), role), (question_subject, 'subject')] + verb_parts,
                  question_explain, ipa),
        ],
    }


def prepare_lab(data):
    ipa = data.get('ipa')
    _require(isinstance(ipa, dict) and ipa and all(
        re.fullmatch(r'[a-z]+', word) and isinstance(value, str) and value.strip() and '/' not in value
        for word, value in ipa.items()
    ), '音标词表格式无效')
    examples = data.get('examples')
    _require(isinstance(examples, list) and len(examples) > 1 and all(
        _has_text(entry, ('id', 'subject', 'helper')) and re.fullmatch(r'[a-z][a-z0-9-]*', entry['id'])
        for entry in examples
    ), '缺少例句或例句 ID 无效')
    _require(len({entry['id'] for entry in examples}) == len(examples), '例句 ID 重复')
    examples = {entry['id']: _example(entry, ipa) for entry in examples}

    sources = data.get('sources')
    _require(isinstance(sources, list) and sources and all(_has_text(source, ('label', 'url'))
             and source['url'].startswith('https://') for source in sources), '参考资料链接无效')
    questions = data.get('quiz')
    _require(isinstance(questions, list) and questions and all(
        _has_text(item, ('example', 'mode', 'why')) and item['example'] in examples
        and item['mode'] in {'negative', 'question'} for item in questions
    ), '练习引用了不存在的句子或句型')
    quiz = []
    for item in questions:
        forms = examples[item['example']]['forms']
        answer = next(form for form in forms if form['id'] == item['mode'])
        options = item.get('options')
        _require(isinstance(options, list) and len(options) >= 2 and options.count(None) == 1
                 and all(option is None or (isinstance(option, str) and option.strip()) for option in options)
                 and len(set(options)) == len(options) and answer['en'] not in options, '练习选项无效')
        quiz.append({**item, 'initial': forms[0], 'answer': answer,
                     'options': [answer['en'] if option is None else option for option in options]})
    return {'examples': examples, 'quiz': quiz, 'sources': sources}


@lru_cache(maxsize=1)
def load_lab():
    with DATA_PATH.open(encoding='utf-8') as file:
        return prepare_lab(json.load(file))


@require_safe
def index(request):
    data = load_lab()
    selected_example = request.GET.get('example')
    selected_mode = request.GET.get('mode')
    return render(request, 'sentence_lab/index.html', {
        **data,
        'modes': [{'id': key, 'label': label, 'caption': caption} for key, (label, caption) in MODES.items()],
        'selected_example': selected_example if selected_example in data['examples'] else next(iter(data['examples'])),
        'selected_mode': selected_mode if selected_mode in MODES else 'affirmative',
        'study_area': 'english',
    })

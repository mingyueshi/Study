"""用一组动词词形和时间提示编排可切换的双语例句。"""
import json
import re
from functools import lru_cache
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from django.shortcuts import render
from django.views.decorators.http import require_safe

DATA_PATH = Path(__file__).resolve().parents[1] / 'content_sources' / 'english-timeline.json'
MOMENT_IDS = ('habit', 'now', 'past', 'plan')
FORM_IDS = ('base', 'third', 'ing', 'past')
PEOPLE = {'i': ('I', '我', 'am'), 'she': ('She', '她', 'is')}


def _require(condition, message):
    if not condition:
        raise ImproperlyConfigured(f'英语时间线数据异常：{message}')


def _has_text(record, keys):
    return isinstance(record, dict) and all(
        isinstance(record.get(key), str) and record[key].strip() for key in keys
    )


def _example(action, person_id, moment):
    subject, subject_zh, be = PEOPLE[person_id]
    moment_id = moment['id']
    pattern, form_id = {
        'habit': ('', 'base' if person_id == 'i' else 'third'),
        'now': (f'{be} ', 'ing'),
        'past': ('', 'past'),
        'plan': (f'{be} going to ', 'base'),
        'will': ('will ', 'base'),
    }[moment_id]
    form = action['forms'][form_id]
    word = form['word']
    speech_word = form.get('speech', word)
    cue = action.get('cue', {}).get(moment_id, moment['cue'])
    tail = f" {action['object']} {cue}."
    prefix = f'{subject} '
    phrase = f'{pattern}{word}'
    return {
        **moment,
        'cue': cue,
        'prefix': prefix,
        'phrase': phrase,
        'tail': tail,
        'en': prefix + phrase + tail,
        'cn': subject_zh + action['zh'][moment_id],
        'speech': prefix + pattern + speech_word + tail,
        'word': word,
        'word_speech': speech_word,
        'ipa': f"/{form['ipa']}/",
        'past_note': action['past_note'] if moment_id == 'past' else '',
    }


def prepare_timeline(data):
    moments = data.get('moments')
    _require(isinstance(moments, list) and all(_has_text(m, ('id', 'label', 'cue', 'tense', 'rule'))
             for m in moments) and tuple(m['id'] for m in moments) == MOMENT_IDS, '时间选项或顺序不正确')
    actions = data.get('actions')
    _require(isinstance(actions, list) and len(actions) > 1 and all(
        _has_text(a, ('id', 'label', 'object', 'past_note')) and re.fullmatch(r'[a-z][a-z0-9-]*', a['id'])
        for a in actions), '缺少动作、英语搭配或过去式提示')
    _require(len({a['id'] for a in actions}) == len(actions), '动作 ID 重复')
    sources = data.get('sources')
    _require(isinstance(sources, list) and sources and all(_has_text(source, ('label', 'url'))
             and source['url'].startswith('https://') for source in sources), '缺少参考资料或资料链接无效')

    sample_moments = [*moments, {
        'id': 'will', 'label': '临时决定', 'cue': moments[-1]['cue'],
        'tense': '用 will 说将来', 'rule': '刚作出的决定也可以用 will + 动词原形。下句想象成刚刚决定明天做这件事。',
    }]
    examples = {}
    for action in actions:
        action_id = action['id']
        forms, translations, cues = action.get('forms'), action.get('zh'), action.get('cue', {})
        _require(isinstance(forms, dict) and set(forms) == set(FORM_IDS) and all(
            _has_text(form, ('word', 'ipa')) and re.fullmatch(r'[a-z]+', form['word']) and '/' not in form['ipa']
            and ('speech' not in form or _has_text(form, ('speech',))) for form in forms.values()
        ), f'{action_id} 缺词形或音标')
        _require(_has_text(translations, (*MOMENT_IDS, 'will')), f'{action_id} 缺中文例句')
        _require(isinstance(cues, dict) and set(cues) <= set(MOMENT_IDS) and _has_text(cues, cues),
                 f'{action_id} 的自定义时间提示无效')
        examples[action_id] = {
            person: {moment['id']: _example(action, person, moment) for moment in sample_moments}
            for person in PEOPLE
        }

    quiz = []
    questions = data.get('quiz')
    _require(isinstance(questions, list) and len(questions) == len(MOMENT_IDS) and all(
        _has_text(q, ('action', 'person', 'moment', 'why')) for q in questions
    ) and {q['moment'] for q in questions} == set(MOMENT_IDS), '四种时间各需要一道练习')
    for question in questions:
        action, person, moment = (question[key] for key in ('action', 'person', 'moment'))
        _require(action in examples and person in PEOPLE, '练习引用了不存在的动作或人物')
        example = examples[action][person][moment]
        options = question.get('options')
        _require(isinstance(options, list) and len(options) >= 2 and all(
            isinstance(option, str) and option.strip() for option in options
        ) and len(options) == len(set(options)) and example['phrase'] in options,
            f'{action}/{person}/{moment} 的选项缺正确答案或有重复')
        quiz.append({**example, 'options': options, 'why': question['why']})

    return {
        'moments': moments,
        'actions': [{'id': a['id'], 'label': a['label'], 'word': a['forms']['base']['word']} for a in actions],
        'people': [{'id': key, 'en': en, 'zh': zh} for key, (en, zh, _) in PEOPLE.items()],
        'examples': examples, 'quiz': quiz, 'sources': sources,
    }


@lru_cache(maxsize=1)
def load_timeline():
    with DATA_PATH.open(encoding='utf-8') as file:
        return prepare_timeline(json.load(file))


@require_safe
def index(request):
    data = load_timeline()
    selected_action = request.GET.get('action')
    selected_person = request.GET.get('person')
    selected_moment = request.GET.get('moment')
    if selected_action not in data['examples']:
        selected_action = data['actions'][0]['id']
    if selected_person not in PEOPLE:
        selected_person = 'i'
    if selected_moment not in MOMENT_IDS:
        selected_moment = MOMENT_IDS[0]

    examples = data['examples'][selected_action][selected_person]
    return render(request, 'english_timeline/index.html', {
        **data,
        'selected_action': selected_action,
        'selected_person': selected_person,
        'selected_moment': selected_moment,
        'current': examples[selected_moment],
        'compare': [examples[moment] for moment in MOMENT_IDS],
        'will': examples['will'],
        'study_area': 'english',
    })

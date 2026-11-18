"""修辞手法馆的文件课程与例句辨析。"""
import json

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.shortcuts import render
from django.views.decorators.http import require_safe


@require_safe
def gallery(request):
    course = json.loads((settings.BASE_DIR / 'content_sources' / 'rhetoric.json').read_text(encoding='utf-8'))
    if course['schema_version'] != 1:
        raise ImproperlyConfigured('修辞手法馆的数据版本不受支持。')

    techniques = {item['id']: item for item in course['techniques']}
    examples = {example['id']: example for technique in techniques.values() for example in technique['examples']}
    selected = techniques.get(request.GET.get('technique'))
    cases = []
    for case in course['cases']:
        if selected and selected['id'] not in case['techniques']:
            continue
        sentences = [
            ''.join(part['text'] for part in examples[sample['example']]['parts']) if isinstance(sample, dict) else sample
            for sample in case['sentences']
        ]
        cases.append({
            **case,
            'samples': list(zip('甲乙丙', sentences)),
            'related': [techniques[key] for key in case['techniques']],
            'answer_label': next(choice['label'] for choice in case['choices'] if choice['id'] == case['answer']),
        })

    return render(request, 'study_topics/rhetoric.html', {
        'study_area': 'chinese',
        'course': course,
        'selected': selected,
        'cases': cases,
        'hero_examples': (examples['lotus-umbrella'], examples['lotus-greets']),
    })

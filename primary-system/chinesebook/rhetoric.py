"""修辞手法馆的文件课程与例句辨析。"""
from django.shortcuts import render
from django.views.decorators.http import require_safe

from catalog.file_content import ContentError, choice_label, content_page, read_course


@require_safe
@content_page('修辞手法馆')
def gallery(request):
    course = read_course('rhetoric.json')
    techniques = {item['id']: item for item in course['techniques']}
    examples = {example['id']: example for technique in techniques.values() for example in technique['examples']}
    selected = techniques.get(request.GET.get('technique'))
    cases = []
    hero_examples = []
    for case in course['cases']:
        try:
            related = [techniques[key] for key in case['techniques']]
            samples = [examples[sample['example']] if isinstance(sample, dict) else sample for sample in case['sentences']]
        except (KeyError, TypeError) as error:
            raise ContentError(f'{case["id"]} 的手法或例句引用无效：{error}') from error
        if case['id'] == 'lotus-pair' and len(samples) == 2 and all(isinstance(sample, dict) for sample in samples):
            hero_examples = samples
        if selected and selected['id'] not in case['techniques']:
            continue
        sentences = [
            ''.join(part['text'] for part in sample['parts']) if isinstance(sample, dict) else sample
            for sample in samples
        ]
        cases.append({
            **case,
            'samples': list(zip('甲乙丙', sentences)),
            'related': related,
            'answer_label': choice_label(case),
        })

    return render(request, 'study_topics/rhetoric.html', {
        'study_area': 'chinese',
        'course': course,
        'selected': selected,
        'cases': cases,
        'hero_examples': hero_examples,
    })

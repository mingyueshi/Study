"""从课程文件读取对联工坊的入门线索、例联与练习。"""
import json
from hashlib import sha256

from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe

from catalog.file_content import ContentError, content_page, read_course


@never_cache
@require_safe
@content_page('对联工坊')
def workshop(request):
    content = read_course('couplets.json')
    examples = content.get('examples')
    if not isinstance(examples, list) or not examples:
        raise ContentError('对联工坊缺少例联。')

    for question in content['questions']:
        choices, answer = question.get('choices'), question.get('answer')
        if not isinstance(choices, list) or type(answer) is not int or not 0 <= answer < len(choices):
            raise ContentError(f'{question.get("id")} 的正确选项无效。')
        question['revision'] = sha256(json.dumps(question, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:16]
        question['answer_text'] = choices[answer]
    for example in examples:
        for side in ('upper', 'lower'):
            parts = example.get(side)
            if not isinstance(parts, list) or not parts or any(not isinstance(part, str) or not part.strip() for part in parts):
                raise ContentError(f'{example.get("id")} 的{side}联无效。')
            text = ''.join(parts)
            example[f'{side}_text'] = text
            example[f'{side}_end'] = text[-1]
    return render(request, 'study_topics/couplets.html', {
        'study_area': 'chinese',
        'course': content,
        'demo': examples[0],
    })

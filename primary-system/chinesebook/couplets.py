"""从课程文件读取对联工坊的入门线索、例联与练习。"""
import json
from hashlib import sha256

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe


@never_cache
@require_safe
def workshop(request):
    source = settings.BASE_DIR / 'content_sources' / 'couplets.json'
    content = json.loads(source.read_text(encoding='utf-8'))
    if content['schema_version'] != 1:
        raise ImproperlyConfigured('对联工坊的数据版本不受支持。')

    for question in content['questions']:
        question['revision'] = sha256(json.dumps(question, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:16]
        question['answer_text'] = question['choices'][question['answer']]
    for example in content['examples']:
        example['upper_text'] = ''.join(example['upper'])
        example['lower_text'] = ''.join(example['lower'])
        example['upper_end'] = example['upper_text'][-1]
        example['lower_end'] = example['lower_text'][-1]
    return render(request, 'study_topics/couplets.html', {
        'study_area': 'chinese',
        'course': content,
        'demo': content['examples'][0],
    })

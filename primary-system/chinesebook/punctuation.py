"""标点专题采用文件编排，练习仅在当前浏览器按账号保存。"""
import json
from hashlib import sha256

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe


@never_cache
@require_safe
def laboratory(request):
    course = json.loads((settings.BASE_DIR / 'content_sources' / 'punctuation.json').read_text(encoding='utf-8'))
    if course['schema_version'] != 1:
        raise ImproperlyConfigured('标点符号实验室的数据版本不受支持。')
    view = request.GET.get('view', 'usage')
    if view not in ('usage', 'errors', 'practice'):
        view = 'usage'
    for question in course['questions']:
        question['revision'] = sha256(json.dumps(question, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:16]
        question['references'] = [
            ''.join(chunk + (answer[i] if i < len(answer) else '') for i, chunk in enumerate(question['chunks']))
            for answer in question['answers']
        ]
    assets = {}
    for suffix in ('css', 'js'):
        path = f'study_topics/punctuation.{suffix}'
        assets[suffix] = {
            'path': path,
            'version': sha256((settings.BASE_DIR / 'static' / path).read_bytes()).hexdigest()[:12],
        }
    return render(request, 'study_topics/punctuation.html', {
        'study_area': 'chinese', 'course': course, 'view': view, 'assets': assets,
    })

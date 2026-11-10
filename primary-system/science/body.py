"""文件编排的人体奥秘站。"""
import json

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.http import Http404
from django.shortcuts import render
from django.views.decorators.http import require_safe


def load_content():
    source = settings.BASE_DIR / 'content_sources' / 'human-body.json'
    content = json.loads(source.read_text(encoding='utf-8'))
    if content['schema_version'] != 1:
        raise ImproperlyConfigured('人体奥秘站的数据版本不受支持。')
    return {**content, 'study_area': 'science'}


@require_safe
def index(request):
    return render(request, 'science/body/index.html', load_content())


@require_safe
def detail(request, slug):
    content = load_content()
    lessons = content['lessons']
    for index, lesson in enumerate(lessons):
        if lesson['slug'] == slug:
            return render(request, 'science/body/detail.html', {
                **content,
                'lesson': lesson,
                'number': index + 1,
                'next_lesson': lessons[index + 1] if index + 1 < len(lessons) else None,
            })
    raise Http404('没有找到这节人体课。')

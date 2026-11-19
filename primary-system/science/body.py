"""文件编排的人体奥秘站。"""
import json

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.http import Http404
from django.shortcuts import render
from django.views.decorators.http import require_safe


PROCESS_OBSERVATION_IDS = {
    'breathing': 'breath-observation',
    'digestion': 'digestion-observation',
    'circulation': 'circulation-observation',
}


def load_content():
    source = settings.BASE_DIR / 'content_sources' / 'human-body.json'
    content = json.loads(source.read_text(encoding='utf-8'))
    if content['schema_version'] != 1:
        raise ImproperlyConfigured('人体奥秘站的数据版本不受支持。')
    return {
        **content,
        'study_area': 'science',
        'lesson_count': len(content['lessons']),
        'media_count': sum(len(lesson['gallery']) for lesson in content['lessons']),
        'question_count': sum(len(lesson['checkup']) for lesson in content['lessons']),
        'body_progress': {
            'lessons': [{'slug': lesson['slug'], 'label': lesson['label'],
                         'questions': [question['id'] for question in lesson['checkup']]}
                        for lesson in content['lessons']],
            'challenges': [item['id'] for item in content['expedition']['challenges']],
        },
    }


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
                'process_observation_id': PROCESS_OBSERVATION_IDS.get(slug),
                'number': index + 1,
                'next_lesson': lessons[index + 1] if index + 1 < len(lessons) else None,
            })
    raise Http404('没有找到这节人体课。')

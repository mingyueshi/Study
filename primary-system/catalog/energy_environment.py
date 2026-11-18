import json

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.shortcuts import render
from django.views.decorators.http import require_safe


@require_safe
def energy_environment(request):
    source = settings.BASE_DIR / 'content_sources' / 'energy-environment.json'
    course = json.loads(source.read_text(encoding='utf-8'))
    if course['schema_version'] != 1:
        raise ImproperlyConfigured('能源与环境的数据版本不受支持。')
    return render(request, 'study_topics/energy_environment.html', {
        'study_area': 'interdisciplinary',
        'course': course,
    })

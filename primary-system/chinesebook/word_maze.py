"""按路线读取近反义词迷宫的文件课程。"""
import json
from hashlib import sha256

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe


@never_cache
@require_safe
def maze(request):
    source = settings.BASE_DIR / 'content_sources' / 'word-maze.json'
    course = json.loads(source.read_text(encoding='utf-8'))
    if course['schema_version'] != 1:
        raise ImproperlyConfigured('近反义词迷宫的数据版本不受支持。')

    routes = {item['id']: item for item in course['routes']}
    route = routes.get(request.GET.get('route'), course['routes'][0])
    gates = []
    for gate in route['gates']:
        revision = sha256(json.dumps(gate, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:16]
        gates.append({
            **gate,
            'revision': revision,
            'samples': list(zip('甲乙', gate['examples'])),
            'answer_label': next(choice['label'] for choice in gate['choices'] if choice['id'] == gate['answer']),
        })
    return render(request, 'study_topics/word_maze.html', {
        'study_area': 'chinese', 'intro': course['intro'], 'sources': course['sources'],
        'routes': course['routes'], 'route': route, 'gates': gates,
        'next_route': course['routes'][(course['routes'].index(route) + 1) % len(routes)],
    })

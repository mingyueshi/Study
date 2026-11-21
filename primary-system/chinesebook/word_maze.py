"""按路线读取近反义词迷宫的文件课程。"""
import json
from hashlib import sha256

from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe

from catalog.file_content import ContentError, choice_label, content_page, read_course


@never_cache
@require_safe
@content_page('近反义词迷宫')
def maze(request):
    course = read_course('word-maze.json')
    route_list = course.get('routes')
    if not isinstance(route_list, list) or not route_list:
        raise ContentError('迷宫缺少路线。')
    routes = {item['id']: item for item in route_list}
    route = routes.get(request.GET.get('route'), route_list[0])
    gates = []
    for gate in route['gates']:
        revision = sha256(json.dumps(gate, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:16]
        gates.append({
            **gate,
            'revision': revision,
            'samples': list(zip('甲乙', gate['examples'])),
            'answer_label': choice_label(gate),
        })
    return render(request, 'study_topics/word_maze.html', {
        'study_area': 'chinese', 'intro': course['intro'], 'sources': course['sources'],
        'routes': course['routes'], 'route': route, 'gates': gates,
        'next_route': route_list[(route_list.index(route) + 1) % len(route_list)],
    })

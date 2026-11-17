from django.http import Http404
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe

from .content import load_data


def context(request):
    return {'data': load_data(), 'study_area': 'math',
            'camp_scope': f'user-{request.user.pk}' if request.user.is_authenticated else 'guest'}


@never_cache
@require_safe
def index(request):
    return render(request, 'mathcamp/index.html', context(request))


@never_cache
@require_safe
def track(request, track_id):
    ctx = context(request)
    tracks = ctx['data']['tracks']
    position = next((i for i, t in enumerate(tracks) if t['id'] == track_id), None)
    if position is None:
        raise Http404('没有找到这条训练路线。')
    current = tracks[position]
    drills = []
    for drill in current['drills']:
        item = dict(drill, level_name=('入门', '进阶', '挑战')[drill['level'] - 1])
        p = drill['puzzle']
        if drill['kind'] in ('sudoku', 'magic'):
            n = p['size']
            item['cells'] = [{'index': i, 'value': value, 'row': i // n + 1, 'col': i % n + 1,
                              'right': (i % n + 1) % p.get('box_cols', n) == 0 and i % n + 1 < n,
                              'bottom': (i // n + 1) % p.get('box_rows', n) == 0 and i // n + 1 < n}
                             for i, value in enumerate(p['givens'])]
        drills.append(item)
    ctx.update(track=current, drills=drills, number=position + 1,
               previous=tracks[position - 1] if position else None,
               next=tracks[position + 1] if position + 1 < len(tracks) else None)
    return render(request, 'mathcamp/track.html', ctx)

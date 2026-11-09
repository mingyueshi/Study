from django.http import Http404
from django.shortcuts import render
from django.views.decorators.http import require_safe

from .content import load_stations


@require_safe
def index(request):
    return render(request, 'humanorigins/index.html', {'stations': load_stations()})


@require_safe
def detail(request, slug):
    stations = load_stations()
    for position, station in enumerate(stations):
        if station['slug'] == slug:
            break
    else:
        raise Http404('没有找到这个学习站。')
    return render(request, 'humanorigins/detail.html', {
        'station': station,
        'stations': stations,
        'number': position + 1,
        'previous': stations[position - 1] if position else None,
        'following': stations[position + 1] if position + 1 < len(stations) else None,
    })

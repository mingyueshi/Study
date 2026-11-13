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
    atlas = station.get('atlas')
    migration = next(item for item in stations if item['slug'] == 'migration')
    china = next(item for item in stations if item['slug'] == 'china-sites')
    shared_groups = {group['id']: group for group in migration['atlas']['groups']}
    reading_clues = [
        {**clue, 'anchor': clue.get('anchor', f'clue-{index}')}
        for index, clue in enumerate(station['clues'], 1)
    ]
    china_pins = []
    if station['slug'] == 'china-sites':
        reading_clues.sort(key=lambda clue: clue['order'])
        for number, clue in enumerate(reading_clues, 1):
            clue['number'] = number
            clue['person'] = shared_groups.get(clue.get('group'))
        site_lookup = {clue['id']: clue for clue in reading_clues}
        china_pins = [{**pin, 'records': [site_lookup[key] for key in pin['sites']]}
                      for pin in station['map_pins']]
    atlas_groups = []
    comparison_groups = []
    if station.get('comparison'):
        for card in station['comparison']['cards']:
            person = shared_groups[card['group']]
            start = (400000 - min(person['oldest'], 400000)) / 4000
            related_sites = [clue for clue in china['clues'] if clue.get('group') == card['group']]
            comparison_groups.append({**card, 'person': person, 'sites': related_sites, 'start': start,
                                      'width': (400000 - person['youngest']) / 4000 - start})
        for bar in station['timeline']['bars']:
            if bar.get('group'):
                bar['color'] = shared_groups[bar['group']]['color']
    if atlas:
        groups = {group['id']: group for group in atlas['groups']}
        site_anchors = {clue['id']: clue['anchor'] for clue in china['clues']}
        for marker in atlas['map_markers']:
            marker['person'] = groups[marker['group']]
            if marker.get('site'):
                marker['site_anchor'] = site_anchors[marker['site']]
        for region in atlas['regions']:
            region['people'] = [groups[key] for key in region['groups']]
        for group in atlas['groups']:
            # 在共同的近 40 万年刻度上裁切更早的记录，不改变正文年代。
            start = (400000 - min(group['oldest'], 400000)) / 4000
            atlas_groups.append({**group, 'start': start,
                                 'width': (400000 - group['youngest']) / 4000 - start})
    return render(request, 'humanorigins/detail.html', {
        'station': station,
        'stations': stations,
        'number': position + 1,
        'previous': stations[position - 1] if position else None,
        'following': stations[position + 1] if position + 1 < len(stations) else None,
        'atlas_groups': atlas_groups,
        'comparison_groups': comparison_groups,
        'reading_clues': reading_clues,
        'china_pins': china_pins,
        'guided_resources': [
            {**resource, 'url': station['sources'][resource['source'] - 1]['url']}
            for resource in station.get('resources', [])
        ],
    })

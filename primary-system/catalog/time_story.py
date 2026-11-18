import json

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.http import require_safe

from geographystudy.solar_terms_content import load_content as load_solar_terms


@require_safe
def time_story(request):
    source = settings.BASE_DIR / 'content_sources' / 'time-story.json'
    course = json.loads(source.read_text(encoding='utf-8'))
    if course['schema_version'] != 1:
        raise ImproperlyConfigured('时间的故事的数据版本不受支持。')
    for station in course['stations']:
        for link in station['links']:
            args = [link['argument']] if 'argument' in link else []
            link['url'] = reverse(link['route'], args=args) + link.get('suffix', '')
    markers = [term for season in load_solar_terms()['seasons'] for term in season['terms']
               if term['solarLongitude'] in (0, 90, 180, 270)]
    offsets = []
    for minutes in course['offsets']:
        hours, remainder = divmod(abs(minutes), 60)
        label = f'UTC{"+" if minutes >= 0 else "−"}{hours:02}:{remainder:02}'
        offsets.append({'minutes': minutes, 'label': label})
    return render(request, 'study_topics/time_story.html', {
        'study_area': 'interdisciplinary', 'course': course, 'markers': markers, 'offsets': offsets,
    })

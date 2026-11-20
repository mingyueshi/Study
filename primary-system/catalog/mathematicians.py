import json

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.http import Http404
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.http import require_safe


@require_safe
def mathematicians(request, person_id=None):
    source = settings.BASE_DIR / 'content_sources' / 'mathematicians.json'
    course = json.loads(source.read_text(encoding='utf-8'))
    if course['schema_version'] != 1:
        raise ImproperlyConfigured('数学家的故事数据版本不受支持。')

    people = {item['id']: item for item in course['people']}
    groups = [
        {**group, 'people': [item for item in people.values() if item['group'] == group['id']]}
        for group in course['groups']
    ]
    trails = [
        {**trail, 'people': [people[key] for key in trail['people'] if key != person_id]}
        for trail in course['trails'] if person_id is None or person_id in trail['people']
    ]
    context = {'study_area': 'math', 'groups': groups, 'trails': trails}

    if person_id is None:
        context['featured'] = people[course['featured']]
        return render(request, 'mathematicians/index.html', context)

    if person_id not in people:
        raise Http404('没有找到这位数学家。')
    person = people[person_id]
    context['person'] = person
    if extension := person.get('extension'):
        context['extension_url'] = reverse(extension['route'], args=extension['args']) + extension['suffix']
    if model := person.get('bridges'):
        places = {place['id']: place['label'] for place in model['places']}
        context['bridges'] = [(start, end, places[start], places[end]) for start, end in model['edges']]
    return render(request, 'mathematicians/person.html', context)

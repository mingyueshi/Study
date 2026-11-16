"""节气卡从课程文件读取，应景诗句在请求时从已发布语料中取出。"""
from functools import reduce
from itertools import count
from operator import or_

from django.db.models import Q
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe

from poetry.models import PoetryText
from reference_library.models import Dataset
from .solar_terms_content import load_content


def _resolve_poems(seasons, version):
    references = {
        (term['poem']['title'], term['poem']['author']): term['poem']['paragraph']
        for season in seasons for term in season['terms']
    }
    matches = reduce(or_, (Q(title=title, author=author) for title, author in references))
    candidates = PoetryText.objects.filter(
        matches, document__layer='simplified', document__version=version,
    ).order_by('pk').values('pk', 'title', 'author', 'paragraphs')
    poems = {}
    for row in candidates:
        key = (row['title'], row['author'])
        paragraphs = row['paragraphs']
        index = references[key]
        if index < len(paragraphs) and paragraphs[index].strip():
            poems.setdefault(key, {
                'pk': row['pk'], 'title': row['title'], 'author': row['author'],
                'line': paragraphs[index],
            })
    return poems


@never_cache
@require_safe
def index(request):
    content = load_content()
    seasons = content['seasons']
    dataset = Dataset.objects.filter(code='poetry', state='ready').only('version').first()
    poems = _resolve_poems(seasons, dataset.version) if dataset else {}
    numbers = count(1)
    for season in seasons:
        for term in season['terms']:
            poem = term['poem']
            term['quote'] = poems.get((poem['title'], poem['author']))
            term['number'] = next(numbers)
    return render(request, 'study_topics/solar_terms.html', {
        'study_area': 'geography',
        'seasons': seasons,
        'sources': content['sources'],
        'challenges': content['challenges'],
        'experience': content['experience'],
        'term_experience': [
            {key: term[key] for key in ('id', 'name', 'date', 'solarLongitude', 'phenology', 'custom', 'custom_scene')}
            for season in seasons for term in season['terms']
        ],
        'poetry_ready': dataset is not None,
    })

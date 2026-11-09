"""四上试点的教材与题库来源定位。"""
from hashlib import md5

from django.db.models import Q
from django.http import Http404
from django.urls import reverse

from questionbank.models import Question

from .content import load_book

PILOT_BOOK = '4a'


def _sources():
    mkb = load_book(PILOT_BOOK)['mkb']
    points = {point['id']: point['title'] for unit in mkb['units'] for point in unit['points']}
    mistakes = []
    for item in mkb['mistakes']:
        # 与 build_questionbank.cjs 的来源定位一致。
        identity = f"{item['unit']}|{item['wrong']}".encode()
        reference = f'math:mistakes:{md5(identity, usedforsecurity=False).hexdigest()[:8]}'
        mistakes.extend((reference, f'{reference}:correct'))
    return points, mistakes


def _active():
    return Question.objects.filter(active=True, area=Question.Area.MATH, track=Question.Track.REGULAR,
                                   source_key='primary-math')


def _example_ref(point):
    return f'math:{point}:example'


def reader_links(book):
    if book != PILOT_BOOK:
        return {}
    points, mistakes = _sources()
    refs = set(_active().filter(
        Q(type=Question.Type.SELFCHECK, source_ref__in=[_example_ref(point) for point in points])
        | Q(type=Question.Type.TRUE_FALSE, source_ref__in=mistakes),
    ).values_list('source_ref', flat=True))
    topics = [point for point in points if _example_ref(point) in refs]
    if refs.intersection(mistakes):
        topics.append('mistakes')
    return {topic: reverse('questionbank-mathbook-practice', args=[book, topic]) for topic in topics}


def practice_scope(book, topic):
    if book != PILOT_BOOK:
        raise Http404('这册教材还没有配套练习。')
    points, mistakes = _sources()
    if topic == 'mistakes':
        title = '易错诊所 · 判断练习'
        rows = _active().filter(type=Question.Type.TRUE_FALSE, source_ref__in=mistakes)
    elif topic in points:
        title = f'{points[topic]} · 例题自评'
        rows = _active().filter(type=Question.Type.SELFCHECK, source_ref=_example_ref(topic))
    else:
        raise Http404('找不到这个知识点。')
    return title, rows.values_list('pk', flat=True)

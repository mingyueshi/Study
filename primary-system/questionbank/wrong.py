"""错题本：每人每题最近一次作答答错的题，可一键重练。页面 GET 零写入。

错题本是普通与奥数两轨共用的记账本：默认全部展示并标注轨别，``?track=``
可只看某一轨；重练按钮按轨别指向对应的练习路由（各自只从本轨抽题）。
"""
from collections import Counter

from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe

from . import records, services, types
from .models import Question

TRACK_FILTERS = {'': '全部', Question.Track.REGULAR: '普通', Question.Track.OLYMPIAD: '奥数'}


def book_url(track, size, chapter=None, *, fragment=None):
    query = {'count': size} if size != services.DEFAULT_SIZE else {}
    if chapter:
        return reverse('questionbank-grammar-wrong', args=[chapter['id']], query=query, fragment=fragment)
    if track:
        query['track'] = track
    return reverse('questionbank-wrong', query=query, fragment=fragment)


@never_cache
@require_safe
def page(request):
    track = request.GET.get('track', '')
    if track not in Question.Track.values:
        track = ''
    return _page(request, track=track)


@never_cache
@require_safe
def grammar_page(request, chapter_id):
    return _page(request, track=Question.Track.REGULAR, grammar_chapter_id=chapter_id)


def _page(request, *, track, grammar_chapter_id=None):
    chapter = pool = None
    if grammar_chapter_id is not None:
        chapter, pool = services.grammar_pool(grammar_chapter_id)
    size = services.practice_size(request.GET.get('count'))
    wrong_ids = services.latest_wrong_ids(records.read_scope(request), ids=pool)
    questions_by_id = Question.objects.filter(active=True).in_bulk(wrong_ids)
    questions = [questions_by_id[pk] for pk in wrong_ids if pk in questions_by_id]
    counts = Counter(question.track for question in questions)
    counts[''] = len(questions)
    rows = [
        {'stem': question.stem, 'type': question.get_type_display(), 'area': question.get_area_display(),
         'track': question.get_track_display() if question.track == Question.Track.OLYMPIAD else '',
         'tags': question.tags or [], 'selfcheck': question.type == Question.Type.SELFCHECK,
         'reveal': types.reveal(question.type, question.payload),
         'explanation': question.payload.get('explanation', ''), 'steps': question.payload.get('steps', '')}
        for question in questions if not track or question.track == track
    ]

    chapter_practice_url = ''
    retry_choices = []
    regular_url = reverse('questionbank-practice')
    olympiad_url = reverse('questionbank-olympiad-practice')
    if chapter:
        chapter_practice_url = reverse('questionbank-grammar-practice', args=[chapter['id']])
        if rows:
            retry_choices.append({'url': chapter_practice_url, 'label': '重练本章错题'})
    else:
        for value, url in ((Question.Track.REGULAR, regular_url), (Question.Track.OLYMPIAD, olympiad_url)):
            if counts[value] and (not track or track == value):
                retry_choices.append({'url': url, 'label': f'重练{TRACK_FILTERS[value]}错题'})
    filters = [] if chapter else [
        {'label': label, 'count': counts[value], 'selected': value == track,
         'url': book_url(value, size, fragment='qb-wrong')}
        for value, label in TRACK_FILTERS.items()
    ]
    return render(request, 'questionbank/wrong.html', {
        'rows': rows, 'count': len(rows), 'track': track, 'track_label': TRACK_FILTERS[track],
        'filters': filters, 'retry_choices': retry_choices, 'size': size, 'sizes': services.SIZES,
        'grammar_chapter': chapter, 'chapter_practice_url': chapter_practice_url,
        'chapter_url': reverse('grammar', query={'chapter': chapter['id']}) if chapter else '',
        'all_url': book_url('', size, fragment='qb-wrong'),
    })

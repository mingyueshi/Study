"""错题本：每人每题最近一次作答答错的题，可一键重练。页面 GET 零写入。

错题本是普通与奥数两轨共用的记账本：默认全部展示并标注轨别，``?track=``
可只看某一轨；重练按钮按轨别指向对应的练习路由（各自只从本轨抽题）。
"""
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe

from . import records, services, types
from .models import Question


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
    scope = records.read_scope(request)
    wrong_ids = services.latest_wrong_ids(scope, track=track, ids=pool)
    questions = list(Question.objects.filter(pk__in=wrong_ids, active=True))
    # 保持「新错在前」的顺序：按错题列表排序取回。
    order = {question_id: index for index, question_id in enumerate(wrong_ids)}
    questions.sort(key=lambda question: order.get(question.pk, len(order)))
    rows = [{'stem': question.stem, 'type': question.get_type_display(),
             'area': question.get_area_display(),
             'track': question.get_track_display() if question.track == Question.Track.OLYMPIAD else '',
             'tags': question.tags or [],
             'reveal': types.reveal(question.type, question.payload),
             'explanation': question.payload.get('explanation', '')}
            for question in questions]
    regular_count = sum(1 for row in rows if not row['track'])
    olympiad_count = len(rows) - regular_count
    params = {'mode': 'wrong', 'count': services.DEFAULT_SIZE}
    chapter_practice_url = ''
    if chapter:
        chapter_practice_url = reverse('questionbank-grammar-practice', args=[chapter['id']])
        practice_url = reverse('questionbank-grammar-practice', args=[chapter['id']], query=params)
    elif track == Question.Track.OLYMPIAD:
        practice_url = reverse('questionbank-olympiad-practice', query=params)
    elif track == Question.Track.REGULAR:
        practice_url = reverse('questionbank-practice', query=params)
    else:
        practice_url = ''
    return render(request, 'questionbank/wrong.html', {
        'rows': rows, 'count': len(rows),
        'track': track, 'regular_count': regular_count, 'olympiad_count': olympiad_count,
        'practice_url': practice_url, 'grammar_chapter': chapter,
        'chapter_practice_url': chapter_practice_url,
    })

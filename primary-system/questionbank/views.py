"""挑战题库主页（普通轨）：题量概览、我的答题统计与练习入口。页面 GET 保持零写入。

题库拆成普通与奥数两条轨后，本页只展示普通轨（``track='regular'``）的题，
奥数轨走独立的「奥数挑战」入口，这里只放一条导流条。
"""
from django.db.models import Count
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe

from . import records, services
from .models import Question

AREA_META = [
    {'area': Question.Area.MATH, 'icon': 'math', 'color': 'math',
     'title': '数学', 'intro': '易错诊所改成的判断题、课本例题自评——答错进错题本，再来一遍。'},
    {'area': Question.Area.CHINESE, 'icon': 'polyphone', 'color': 'chinese',
     'title': '语文', 'intro': '课文里的多音字：「号」在「风号浪吼」里读哪个音？'},
    {'area': Question.Area.ENGLISH, 'icon': 'english', 'color': 'english',
     'title': '英语', 'intro': '教材同步单词的词义四选一，选对收进成绩单。'},
]


@never_cache
@require_safe
def index(request):
    questions = {row['area']: row['total'] for row in
                 Question.objects.filter(active=True, track=Question.Track.REGULAR)
                 .values('area').annotate(total=Count('id'))}
    olympiad_count = Question.objects.filter(
        active=True, track=Question.Track.OLYMPIAD).count()
    scope = records.read_scope(request)
    summary = services.owner_summary(scope, track=Question.Track.REGULAR)
    cards = []
    for meta in AREA_META:
        counts = summary['areas'].get(meta['area'], {'answered': 0, 'correct': 0})
        cards.append({**meta,
                      'count': questions.get(meta['area'], 0),
                      'answered': counts['answered'], 'correct': counts['correct']})
    return render(request, 'questionbank/home.html', {
        'cards': cards,
        'total': sum(questions.values()),
        'summary': summary,
        'wrong_count': len(services.track_wrong_ids(scope, Question.Track.REGULAR)),
        'olympiad_count': olympiad_count,
        'olympiad_url': reverse('questionbank-olympiad'),
        'sizes': services.SIZES,
    })

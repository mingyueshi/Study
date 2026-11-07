"""挑战题库主页：全库题量概览、我的答题统计与练习入口。页面 GET 保持零写入。

题库内部分四个同级领域卡：数学、语文、英语（普通轨）与奥数（奥数轨）。
奥数与学科同级展示，练习与错题链接指向奥数轨路由；首页（学习广场）的
专题区标题右侧有直达本页的特殊入口。
"""
from django.db.models import Count
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe

from . import records, services
from .models import Question

AREA_META = [
    {'area': Question.Area.MATH, 'icon': 'math',
     'title': '数学', 'intro': '易错诊所改成的判断题、课本例题自评——答错进错题本，再来一遍。'},
    {'area': Question.Area.CHINESE, 'icon': 'polyphone',
     'title': '语文', 'intro': '课文里的多音字：「号」在「风号浪吼」里读哪个音？'},
    {'area': Question.Area.ENGLISH, 'icon': 'english',
     'title': '英语', 'intro': '教材同步单词的词义四选一，选对收进成绩单。'},
    {'area': Question.Track.OLYMPIAD, 'icon': 'quiz', 'track': Question.Track.OLYMPIAD,
     'title': '奥数', 'intro': '课本外的思维题：速算巧算、鸡兔同笼、盈亏还原、行程与逻辑推理，每题带思路解析。',
     'practice_url': 'questionbank-olympiad-practice', 'wrong_query': '?track=olympiad'},
]


@never_cache
@require_safe
def index(request):
    questions = {row['area']: row['total'] for row in
                 Question.objects.filter(active=True, track=Question.Track.REGULAR)
                 .values('area').annotate(total=Count('id'))}
    olympiad_total = Question.objects.filter(active=True, track=Question.Track.OLYMPIAD).count()
    scope = records.read_scope(request)
    summary = services.owner_summary(scope)
    olympiad_summary = services.owner_summary(scope, track=Question.Track.OLYMPIAD)
    cards = []
    for meta in AREA_META:
        if meta.get('track'):
            counts = {'answered': olympiad_summary['answered'], 'correct': olympiad_summary['correct']}
            count = olympiad_total
            meta = {**meta, 'practice_url': reverse(meta['practice_url'])}
        else:
            counts = summary['areas'].get(meta['area'], {'answered': 0, 'correct': 0})
            count = questions.get(meta['area'], 0)
        cards.append({**meta, 'count': count,
                      'answered': counts['answered'], 'correct': counts['correct']})
    return render(request, 'questionbank/home.html', {
        'cards': cards,
        'total': sum(questions.values()) + olympiad_total,
        'summary': summary,
        'wrong_count': len(services.latest_wrong_ids(scope)),
        'olympiad_wrong_url': reverse('questionbank-wrong') + '?track=olympiad',
        'sizes': services.SIZES,
    })

"""奥数挑战落地页：奥数轨题量、主题一览、我的答题统计与练习入口。

挑战题库拆成普通与奥数两条轨后，这里承载奥数轨的独立入口；数据都在同一
张题库表上（``track='olympiad'``），判分与错题本沿用题库共用设施。页面
GET 保持零写入。
"""
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe

from . import records, services
from .models import Question

HERO_TAG = ('课本外的思维题：速算巧算、鸡兔同笼、盈亏还原、行程与逻辑推理。'
            '每题四个选项，答完马上看思路解析，答错自动收进奥数错题本。')


@never_cache
@require_safe
def page(request):
    track = Question.Track.OLYMPIAD
    scope = records.read_scope(request)
    summary = services.owner_summary(scope, track=track)
    total = Question.objects.filter(active=True, track=track).count()
    return render(request, 'questionbank/olympiad.html', {
        'total': total,
        'summary': summary,
        'tags': [{'tag': tag, 'count': count} for tag, count in services.tag_counts(track)],
        'wrong_count': len(services.track_wrong_ids(scope, track)),
        'practice_url': reverse('questionbank-olympiad-practice'),
        'wrong_url': reverse('questionbank-wrong') + '?track=olympiad',
        'hero_tag': HERO_TAG,
    })

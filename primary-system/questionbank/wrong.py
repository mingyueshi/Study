"""错题本：每人每题最近一次作答答错的题，可一键重练。页面 GET 零写入。"""
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe

from . import records, services, types
from .models import Question


@never_cache
@require_safe
def page(request):
    scope = records.read_scope(request)
    wrong_ids = services.latest_wrong_ids(scope)
    questions = list(Question.objects.filter(pk__in=wrong_ids, active=True))
    # 保持「新错在前」的顺序：按错题列表排序取回。
    order = {question_id: index for index, question_id in enumerate(wrong_ids)}
    questions.sort(key=lambda question: order.get(question.pk, len(order)))
    rows = [{'stem': question.stem, 'type': question.get_type_display(), 'area': question.get_area_display(),
             'tags': question.tags or [],
             'reveal': types.reveal(question.type, question.payload),
             'explanation': question.payload.get('explanation', '')}
            for question in questions]
    return render(request, 'questionbank/wrong.html', {
        'rows': rows, 'count': len(rows),
    })

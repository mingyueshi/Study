from django.http import Http404
from django.shortcuts import render
from django.views.decorators.http import require_safe

from .content import load_cases


@require_safe
def index(request):
    cases = load_cases()
    groups = {}
    for case in cases.values():
        groups.setdefault(case['category'], []).append(case)
    return render(request, 'mysteries/index.html', {
        'groups': groups,
        'case_count': len(cases),
    })


@require_safe
def detail(request, slug):
    cases = load_cases()
    case = cases.get(slug)
    if case is None:
        raise Http404('没有找到这份案卷。')
    return render(request, 'mysteries/detail.html', {
        'case': case,
        'other_cases': [item for key, item in cases.items() if key != slug],
    })

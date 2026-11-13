"""文件编排的科学查证任务。"""
import json

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.http import Http404
from django.shortcuts import render
from django.views.decorators.http import require_safe


def load_content():
    source = settings.BASE_DIR / 'content_sources' / 'science-rumors.json'
    content = json.loads(source.read_text(encoding='utf-8'))
    if content['schema_version'] != 1:
        raise ImproperlyConfigured('科学流言粉碎机的数据版本不受支持。')
    return content


@require_safe
def index(request):
    all_cases = load_content()['cases']
    categories = list(dict.fromkeys(case['category'] for case in all_cases))
    category = request.GET.get('category', '')
    if category not in categories:
        category = ''
    query = request.GET.get('q', '').strip()[:100]
    cases = [
        dict(case, number=number)
        for number, case in enumerate(all_cases, 1)
        if (not category or case['category'] == category)
        and query.casefold() in f'{case["claim"]} {case["teaser"]} {case["category"]}'.casefold()
    ]
    return render(request, 'science/rumors/index.html', {
        'cases': cases,
        'categories': categories,
        'category': category,
        'query': query,
        'all_slugs': [case['slug'] for case in all_cases],
        'total_count': len(all_cases),
        'study_area': 'science',
    })


@require_safe
def detail(request, slug):
    content = load_content()
    cases = content['cases']
    for index, case in enumerate(cases):
        if case['slug'] == slug:
            return render(request, 'science/rumors/detail.html', {
                'case': case,
                'number': index + 1,
                'verdicts': content['verdicts'],
                'verdict_label': content['verdicts'][case['verdict']],
                'next_case': cases[index + 1] if index + 1 < len(cases) else None,
                'study_area': 'science',
            })
    raise Http404('没有找到这份查证任务。')

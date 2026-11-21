"""文件编排的科学查证任务。"""
from django.http import Http404
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.http import require_safe

from catalog.file_content import ContentError, content_page, read_course


def load_content():
    content = read_course('science-rumors.json')
    verdicts = content.get('verdicts')
    skill_ids = {skill['id'] for skill in content['skills']}
    for case in content['cases']:
        verdict, skill = case.get('verdict'), case.get('skill')
        if not isinstance(verdicts, dict) or not isinstance(verdict, str) or verdict not in verdicts:
            raise ContentError(f'{case["slug"]} 的结论引用无效。')
        if not isinstance(skill, str) or skill not in skill_ids:
            raise ContentError(f'{case["slug"]} 的查证方法引用无效。')
    return content


@require_safe
@content_page('科学流言粉碎机')
def index(request):
    content = load_content()
    all_cases = content['cases']
    categories = list(dict.fromkeys(case['category'] for case in all_cases))
    category = request.GET.get('category', '')
    if category not in categories:
        category = ''
    query = request.GET.get('q', '').strip()[:100]
    progress_filter = request.GET.get('view', 'all')
    if progress_filter not in {'all', 'unseen', 'review', 'saved'}:
        progress_filter = 'all'
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
        'progress_filter': progress_filter,
        'skills': content['skills'],
        'toolkit_sources': content['toolkit_sources'],
        'directory_data': [
            {'slug': case['slug'], 'claim': case['claim'],
             'url': reverse('science-rumor-case', args=[case['slug']])}
            for case in all_cases
        ],
        'study_area': 'science',
    })


@require_safe
@content_page('科学流言粉碎机')
def detail(request, slug):
    content = load_content()
    cases = content['cases']
    for index, case in enumerate(cases):
        if case['slug'] == slug:
            skills = {skill['id']: skill for skill in content['skills']}
            return render(request, 'science/rumors/detail.html', {
                'case': case,
                'number': index + 1,
                'verdicts': content['verdicts'],
                'verdict_label': content['verdicts'][case['verdict']],
                'skill': skills[case['skill']],
                'next_case': cases[index + 1] if index + 1 < len(cases) else None,
                'study_area': 'science',
            })
    raise Http404('没有找到这份查证任务。')


@require_safe
@content_page('科学流言粉碎机')
def training(request):
    content = load_content()
    skills = {skill['id']: skill for skill in content['skills']}
    deck = [
        {'slug': case['slug'], 'claim': case['claim'], 'skill': skills[case['skill']]['title'],
         'url': reverse('science-rumor-case', args=[case['slug']]), 'challenge': case['challenge']}
        for case in content['cases']
    ]
    mode = 'review' if request.GET.get('mode') == 'review' else ''
    return render(request, 'science/rumors/training.html', {
        'deck': deck, 'mode': mode, 'study_area': 'science',
    })

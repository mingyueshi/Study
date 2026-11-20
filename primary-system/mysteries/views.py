from django.http import Http404
from django.shortcuts import render
from django.templatetags.static import static
from django.urls import reverse
from django.views.decorators.http import require_safe

from .content import PROGRESS_LABELS, load_cases


MEDIA_LABELS = {
    'video': '实拍短视频', 'animation': '观测动图', 'audio': '实录声音',
    'diagram': '互动读图', 'depth': '立体深海',
}


def directory_item(case, progress_status):
    """筛选与对照复用案卷正文，不另存一份学习内容。"""
    kinds = list(dict.fromkeys(item['kind'] for item in case.get('media', [])))
    if case.get('depth_explorer'):
        kinds.append('depth')
    search = [case[field] for field in ('title', 'category', 'summary', 'known', 'unresolved')]
    search.extend(value for question in case['open_questions'] for value in (question['question'], question['gap']))
    search.extend(value for clue in case['evidence'] for value in (clue['title'], clue['observation'], clue['meaning']))
    search.append(PROGRESS_LABELS[progress_status])
    if 'progress' in case:
        search.extend(case['progress'][field] for field in ('title', 'summary'))
    return {
        **{key: case[key] for key in ('slug', 'title', 'category', 'known', 'unresolved', 'next_step')},
        'questions': [question['question'] for question in case['open_questions']],
        'search': ' '.join(search),
        'kinds': kinds,
        'labels': [MEDIA_LABELS[kind] for kind in kinds],
        'progress': progress_status,
        'url': reverse('mystery-case', args=[case['slug']]),
        'image': static(case['figure']['path']),
        'alt': case['figure']['alt'],
    }


@require_safe
def index(request):
    cases = load_cases()
    groups = {}
    directory = []
    for case in cases.values():
        progress_status = case.get('progress', {}).get('status', 'open')
        item = directory_item(case, progress_status)
        directory.append(item)
        groups.setdefault(case['category'], []).append({
            **case, 'media_labels': item['labels'],
            'progress_status': progress_status, 'progress_label': PROGRESS_LABELS[progress_status],
        })
    return render(request, 'mysteries/index.html', {
        'groups': groups,
        'case_count': len(cases),
        'directory_data': directory,
        'media_filters': MEDIA_LABELS,
        'progress_filters': PROGRESS_LABELS,
    })


@require_safe
def detail(request, slug):
    cases = load_cases()
    case = cases.get(slug)
    if case is None:
        raise Http404('没有找到这份案卷。')
    progress_status = case.get('progress', {}).get('status', 'open')
    return render(request, 'mysteries/detail.html', {
        'case': case,
        'progress_status': progress_status,
        'progress_label': PROGRESS_LABELS[progress_status],
        'reasoning_clues': [
            {'number': number, 'observation': case['evidence'][number - 1]['observation']}
            for number in case['challenge']['clues']
        ],
        'other_cases': [item for key, item in cases.items()
                        if key != slug and item['category'] == case['category']][:3],
        'notebook_data': {'slug': slug, 'title': case['title'], 'slugs': list(cases)},
    })

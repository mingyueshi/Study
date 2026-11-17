from django.http import Http404
from django.shortcuts import render
from django.views.decorators.http import require_safe

from .content import load_data


@require_safe
def index(request):
    return render(request, 'mathbeauty/index.html', {'data': load_data(), 'study_area': 'math'})


@require_safe
def topic(request, topic_id):
    data = load_data()
    topics = data['topics']
    position = next((i for i, value in enumerate(topics) if value['id'] == topic_id), None)
    if position is None:
        raise Http404('没有找到这一站。')
    value = topics[position]
    quiz = [{**q, 'correct_label': q['options'][q['answer']]} for q in value['quiz']]
    return render(request, 'mathbeauty/topic.html', {
        'data': data, 'topic': value, 'quiz': quiz, 'number': position + 1,
        'previous': topics[position - 1] if position else None,
        'next': topics[position + 1] if position + 1 < len(topics) else None,
        'study_area': 'math',
    })

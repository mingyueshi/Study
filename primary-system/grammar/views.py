"""英语语法总览与速查。原巩固题的进度保存在当前浏览器。"""
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe

from . import catalog, navigation


@never_cache
@require_safe
def index(request):
    chapters = catalog.chapters_with_lessons()
    nav = navigation.load_navigation()
    reference = [
        {
            **chapter,
            **nav['by_chapter'][chapter['id']],
            'url': reverse('grammar', query={'chapter': chapter['id']}),
        }
        for chapter in chapters
    ]
    context = {
        'chapters': reference,
        'lesson_total': sum(len(chapter['lessons']) for chapter in chapters),
        'study_area': 'english',
    }

    chapter_id = request.GET.get('chapter')
    if not chapter_id:
        return render(request, 'grammar/index.html', {
            **context,
            'topic_directory': nav['directory'],
            'first_chapter': reference[0],
        })

    current = next((chapter for chapter in reference if chapter['id'] == chapter_id), reference[0])
    notes = nav['notes']
    reading = []
    reviews = []
    for lesson in current['lessons']:
        lesson_id = lesson['id']
        transferred = lesson_id in notes
        has_reading = not transferred or bool(notes[lesson_id])
        if has_reading:
            reading.append({**lesson, 'notes': notes.get(lesson_id, [])})
        reviews.append({**lesson, 'anchor': f'review-{lesson_id}' if has_reading else f'lesson-{lesson_id}'})
    return render(request, 'grammar/reference.html', {
        **context,
        'current': current,
        'reading': reading,
        'reviews': reviews,
    })

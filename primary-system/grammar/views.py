"""英语语法精讲页：只读浏览，不写学习记录；页面 GET 保持零写入。

巩固题在页内前端判分、进度只存浏览器 localStorage；同题已作为
``primary-grammar`` 批次进入挑战题库，练习记录与错题本统一沉淀在题库侧。
"""
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe

from . import catalog


@never_cache
@require_safe
def index(request):
    chapters = catalog.chapters_with_lessons()
    chapter_id = request.GET.get('chapter', '')
    position = next((order for order, chapter in enumerate(chapters) if chapter['id'] == chapter_id), 0)
    current = chapters[position]
    return render(request, 'grammar/index.html', {
        'chapters': [{'id': chapter['id'], 'no': chapter['no'], 'title': chapter['title'],
                      'lesson_count': len(chapter['lessons'])} for chapter in chapters],
        'current': current,
        'prev_chapter': chapters[position - 1] if position > 0 else None,
        'next_chapter': chapters[position + 1] if position + 1 < len(chapters) else None,
        'lesson_total': sum(len(chapter['lessons']) for chapter in chapters),
    })

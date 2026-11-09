"""数学公式专题页：只读浏览，不写学习记录；页面 GET 保持零写入零会话。

学段（小学/初中/高中）与章节都走服务端 ``?stage=`` ``?chapter=`` 分视图，
非法参数一律回退，保证 URL 可收藏、可分享；页内搜索是纯前端渐进增强。
"""
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe

from . import content


@never_cache
@require_safe
def index(request):
    stages = content.stages_with_counts()
    stage_code = request.GET.get('stage', '')
    stage = next((s for s in stages if s['code'] == stage_code), stages[0])

    chapters = [c for c in content.load_data()['chapters'] if c['stage'] == stage['code']]
    chapter_code = request.GET.get('chapter', '')
    position = next((n for n, c in enumerate(chapters) if c['code'] == chapter_code), 0)
    chapter = chapters[position]
    groups = content.chapter_groups(chapter['code'])
    nav = [{'code': c['code'], 'emoji': c['emoji'], 'title': c['title'],
            'group_count': len(content.chapter_groups(c['code']))} for c in chapters]
    return render(request, 'mathformulas/index.html', {
        'stages': stages,
        'stage': stage,
        'chapters': nav,
        'chapter': dict(chapter, group_count=len(groups), item_count=sum(len(g['items']) for g in groups),
                        no=position + 1),
        'groups': groups,
        'chapter_total': len(chapters),
        'prev_chapter': chapters[position - 1] if position > 0 else None,
        'next_chapter': chapters[position + 1] if position + 1 < len(chapters) else None,
    })

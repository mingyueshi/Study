import json

from django.conf import settings
from django.views.generic import TemplateView
from django.shortcuts import redirect
from django.urls import reverse

from astronomy.constellations import ATLAS


ASTRONOMY_CONTEXT = {
    'study_area': 'geography', 'study_label': '地理',
    'course_slug': 'astro', 'course_title': '天文探索', 'course_section': '专题',
    'course_intro': '从太阳系到银河系和深空，看大图、动画，动手比较宇宙尺度。',
    'course_links': (('astronomy-index', '查恒星与星座'), ('mysteries', '未解之谜研究所')),
}


class AstronomyExploreView(TemplateView):
    extra_context = ASTRONOMY_CONTEXT

    field_pages = {
        'constellations': '星座识别',
        'sky': '实时天象',
        'telescope': '望远镜使用入门',
    }

    def get(self, request, *args, **kwargs):
        # 保留原星表筛选书签；无筛选的根地址现在是天文总入口。
        if 'view' not in request.GET and any(key in request.GET for key in ('q', 'con', 'named', 'page')):
            return redirect(reverse('astronomy-index') + '?' + request.META['QUERY_STRING'], permanent=True)
        return super().get(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        view = self.request.GET.get('view')
        if view in self.field_pages:
            context.update(field_view=view, field_title=self.field_pages[view], field_pages=self.field_pages)
        if view == 'constellations':
            context['atlas'] = ATLAS
        elif view == 'telescope':
            source = settings.BASE_DIR / 'content_sources' / 'astro-telescope.json'
            context['guide'] = json.loads(source.read_text(encoding='utf-8'))
        return context

    def get_template_names(self):
        view = self.request.GET.get('view')
        if view in self.field_pages:
            return [f'study_topics/astro_{view}.html']
        views = {f'au{i}' for i in range(1, 10)} | {'universe', 'lab', 'facts', 'clinic'}
        if view in views:
            return ['study_topics/course.html']
        return ['study_topics/astronomy_portal.html']


astronomy_explore = AstronomyExploreView.as_view()

literature_study = TemplateView.as_view(template_name='study_topics/course.html', extra_context={
    'study_area': 'chinese', 'study_label': '语文',
    'course_slug': 'lit', 'course_title': '文学常识', 'course_section': '阅读主题',
    'course_intro': '沿着体裁、名著和作家读作品，学会在文章里寻找线索。',
    'course_links': (('classical', '古文精读馆'), ('poetry-index', '查古诗文原文'), ('idiom-stories', '成语典故馆')),
})

science_lab = TemplateView.as_view(template_name='study_topics/course.html', extra_context={
    'study_area': 'science', 'study_label': '科学',
    'course_slug': 'sci', 'course_title': '科学实验室', 'course_section': '实验主题',
    'course_intro': '从身边的现象提出问题，用图示、观察和小实验寻找答案。',
    'course_links': (('science-elements', '查元素周期表'),),
})

hanzi_evolution = TemplateView.as_view(template_name='study_topics/course.html', extra_context={
    'study_area': 'chinese', 'study_label': '语文',
    'course_slug': 'hanzi-evo', 'course_title': '汉字演变馆', 'course_section': '字族',
    'course_intro': '100 个常用字从甲骨文走到楷书：先猜字，再读字理小故事。',
    'course_links': (('dictionary', '查字查词'), ('hanzi-polyphones', '多音字')),
})

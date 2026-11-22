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

matter_lab = TemplateView.as_view(template_name='study_topics/course.html', extra_context={
    'study_area': 'science', 'study_label': '科学',
    'course_slug': 'matter', 'course_title': '物质实验室', 'course_section': '化学启蒙',
    'course_intro': '东西是由什么组成的？混在一起会怎样？五个化学启蒙室，从三态变化一路做到元素周期表。',
    'course_links': (('science-elements', '查元素周期表'), ('science-rumors', '科学流言粉碎机')),
})

microbes_lab = TemplateView.as_view(template_name='study_topics/course.html', extra_context={
    'study_area': 'science', 'study_label': '科学',
    'course_slug': 'microbes', 'course_title': '微生物·看不见的世界', 'course_section': '微生物',
    'course_intro': '一滴水里有什么？细菌是好还是坏？从四大家族到尺度缩放台，再到发酵厨房和免疫防线。',
    'course_links': (('science-body', '人体奥秘站'), ('science-rumors', '科学流言粉碎机')),
})

probability_lab = TemplateView.as_view(template_name='study_topics/course.html', extra_context={
    'study_area': 'math', 'study_label': '数学',
    'course_slug': 'probability', 'course_title': '概率与统计乐园', 'course_section': '概率统计',
    'course_intro': '掷两个骰子，哪个点数最容易出现？别猜——掷它一千次。频率柱、小调查和蒙特卡洛估 π 都在这里。',
    'course_links': (('math-camp', '数学训练营'), ('math-beauty', '数学之美')),
})

computing_lab = TemplateView.as_view(template_name='study_topics/course.html', extra_context={
    'study_area': 'computing', 'study_label': '信息科技',
    'course_slug': 'computing', 'course_title': '电脑与 AI 怎样工作', 'course_section': '计算启蒙',
    'course_intro': '电脑为什么会算？AI 是怎样学会的？从拨比特开关、排指令程序，到亲手训练分类器，再到网上查证消息。',
    'course_links': (('math-beauty', '数学之美'), ('science-rumors', '科学流言粉碎机')),
})

food_journey = TemplateView.as_view(template_name='study_topics/course.html', extra_context={
    'study_area': 'interdisciplinary', 'study_label': '跨学科',
    'course_slug': 'food', 'course_title': '食物的旅行', 'course_section': '食物站点',
    'course_intro': '我们吃的东西从哪里来，又怎样变成身体的一部分？从农场到餐桌、作物的环球传播、营养与消化，一路吃到餐桌文化和食物化学。',
    'course_links': (('history-timeline-silk-road', '丝绸之路'), ('science-body', '人体奥秘站'), ('money-trade', '货币与贸易')),
})

hanzi_evolution = TemplateView.as_view(template_name='study_topics/course.html', extra_context={
    'study_area': 'chinese', 'study_label': '语文',
    'course_slug': 'hanzi-evo', 'course_title': '汉字演变馆', 'course_section': '字族',
    'course_intro': '100 个常用字从甲骨文走到楷书：先猜字，再读字理小故事。',
    'course_links': (('dictionary', '查字查词'), ('hanzi-polyphones', '多音字')),
})

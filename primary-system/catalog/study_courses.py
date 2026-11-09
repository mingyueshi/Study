from django.views.generic import TemplateView


astronomy_study = TemplateView.as_view(template_name='study_topics/course.html', extra_context={
    'study_area': 'geography', 'study_label': '地理',
    'course_slug': 'astro', 'course_title': '天文探索', 'course_section': '太空基地',
    'course_intro': '从太阳系出发，读星图、看实景照片，认识更远的宇宙。',
    'course_links': (('astronomy-index', '查恒星与星座'), ('mysteries', '未解之谜研究所')),
})

literature_study = TemplateView.as_view(template_name='study_topics/course.html', extra_context={
    'study_area': 'chinese', 'study_label': '语文',
    'course_slug': 'lit', 'course_title': '文学常识', 'course_section': '阅读主题',
    'course_intro': '沿着体裁、名著和作家读作品，学会在文章里寻找线索。',
    'course_links': (('poetry-index', '查古诗文原文'), ('idiom-stories', '成语典故馆')),
})

science_lab = TemplateView.as_view(template_name='study_topics/course.html', extra_context={
    'study_area': 'science', 'study_label': '科学',
    'course_slug': 'sci', 'course_title': '科学实验室', 'course_section': '实验主题',
    'course_intro': '从身边的现象提出问题，用图示、观察和小实验寻找答案。',
    'course_links': (('science-elements', '查元素周期表'),),
})

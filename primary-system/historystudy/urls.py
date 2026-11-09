from django.urls import path
from django.views.generic import TemplateView


def page(name):
    return TemplateView.as_view(
        template_name=f'study_topics/{name}.html',
        extra_context={'study_area': 'history', 'study_label': '历史'},
    )


urlpatterns = [
    path('', page('history/index'), name='history-study'),
    path('timeline/', page('history-timeline/index'), name='history-timeline'),
    *[
        path(f'timeline/{name}.html', page(f'history-timeline/{name}'), name=f'history-timeline-{name}')
        for name in ('timeline', 'era', 'event', 'dynasties')
    ],
]

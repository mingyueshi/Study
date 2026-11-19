from django.urls import path
from django.views.generic import TemplateView


def page(name):
    return TemplateView.as_view(
        template_name=f'study_topics/{name}.html',
        extra_context={
            'study_area': 'history',
            'study_label': '历史',
            'local_navigation': name in (
                'history-timeline/timeline', 'history-timeline/era',
                'history-timeline/event', 'history-timeline/territory',
            ),
        },
    )


urlpatterns = [
    path('', page('history/index'), name='history-study'),
    path('timeline/', page('history-timeline/index'), name='history-timeline'),
    *[
        path(f'timeline/{name}.html', page(f'history-timeline/{name}'), name=f'history-timeline-{name}')
        for name in ('timeline', 'era', 'event', 'dynasties', 'people', 'person', 'civilizations', 'civilization', 'ancient-science', 'technology', 'silk-road', 'silk-city', 'territory')
    ],
]

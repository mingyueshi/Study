from django.urls import path
from django.views.generic import TemplateView

from . import solar_terms


def page(name):
    return TemplateView.as_view(
        template_name=f'study_topics/{name}.html',
        extra_context={'study_area': 'geography', 'study_label': '地理'},
    )


urlpatterns = [
    path('study/', page('geo/index'), name='geography-study'),
    path('solar-terms/', solar_terms.index, name='solar-terms'),
    path('atlas/', page('geo-map/index'), name='geography-atlas'),
    *[
        path(f'atlas/{name}.html', page(f'geo-map/{name}'), name=f'geography-atlas-{name}')
        for name in ('china', 'animals', 'plants', 'world', 'world-animals', 'world-plants', 'province', 'places', 'routes', 'gallery')
    ],
]

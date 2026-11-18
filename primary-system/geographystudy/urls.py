from django.urls import path
from django.views.generic import RedirectView, TemplateView

from . import solar_terms


def page(name, *, local_navigation=False):
    return TemplateView.as_view(
        template_name=f'study_topics/{name}.html',
        extra_context={
            'study_area': 'geography',
            'study_label': '地理',
            'local_navigation': local_navigation,
        },
    )


LIFE_MAPS = ('animals', 'plants', 'world-animals', 'world-plants')


urlpatterns = [
    path('study/', page('geo/index'), name='geography-study'),
    path('solar-terms/', solar_terms.index, name='solar-terms'),
    path('atlas/', page('geo-map/index', local_navigation=True), name='geography-atlas'),
    path('life-maps/', page('geo-map/life-maps', local_navigation=True), name='geography-life-maps'),
    path('province-culture/', page('geo-map/province-culture', local_navigation=True), name='geography-province-culture'),
    path('china-landscapes/', page('geo-map/china-landscapes', local_navigation=True), name='geography-china-landscapes'),
    path('voyages/', page('geo-map/voyages', local_navigation=True), name='geography-voyages'),
    path('earth/', page('earth/index'), name='geography-earth'),
    path('ocean/', page('ocean/index'), name='geography-ocean'),
    path('climate/', page('climate/index'), name='geography-climate'),
    path('map-skills/', page('map-skills/index'), name='geography-map-skills'),
    *[
        path(f'map-skills/{name}.html', page(f'map-skills/{name}'), name=f'geography-map-skills-{name}')
        for name in ('scale', 'direction', 'legend', 'contours', 'profile')
    ],
    *[
        path(f'climate/{name}.html', page(f'climate/{name}'), name=f'geography-climate-{name}')
        for name in ('weather', 'types', 'china')
    ],
    *[
        path(f'ocean/{name}.html', page(f'ocean/{name}'), name=f'geography-ocean-{name}')
        for name in ('currents', 'tides', 'life', 'seafloor')
    ],
    *[
        path(f'earth/{name}.html', page(f'earth/{name}'), name=f'geography-earth-{name}')
        for name in ('rocks', 'quakes', 'plates', 'age')
    ],
    *[
        path(f'atlas/{name}.html', page(f'geo-map/{name}', local_navigation=True), name=f'geography-atlas-{name}')
        for name in ('china', 'china-3d', 'world', 'world-3d', 'province', 'places', 'routes', 'gallery')
    ],
    *[
        path(f'life-maps/{name}.html', page(f'geo-map/{name}', local_navigation=True), name=f'geography-life-maps-{name}')
        for name in LIFE_MAPS
    ],
    *[
        path(
            f'atlas/{name}.html',
            RedirectView.as_view(pattern_name=f'geography-life-maps-{name}', permanent=True, query_string=True),
            name=f'geography-atlas-{name}',
        )
        for name in LIFE_MAPS
    ],
    path(
        'atlas/province-culture.html',
        RedirectView.as_view(pattern_name='geography-province-culture', permanent=True, query_string=True),
        name='geography-atlas-province-culture',
    ),
]

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
ATLAS_REDIRECTS = {
    'china-3d': 'geography-china-terrain',
    'world-3d': 'geography-globe',
    **{name: f'geography-life-maps-{name}' for name in LIFE_MAPS},
    'province-culture': 'geography-province-culture',
}


urlpatterns = [
    path('study/', page('geo/index'), name='geography-study'),
    path('solar-terms/', solar_terms.index, name='solar-terms'),
    path('atlas/', page('geo-map/index', local_navigation=True), name='geography-atlas'),
    path('china-terrain/', page('geo-map/china-3d', local_navigation=True), name='geography-china-terrain'),
    path('globe/', page('geo-map/world-3d', local_navigation=True), name='geography-globe'),
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
        for name in ('china', 'world', 'province', 'places', 'routes', 'gallery')
    ],
    *[
        path(f'life-maps/{name}.html', page(f'geo-map/{name}', local_navigation=True), name=f'geography-life-maps-{name}')
        for name in LIFE_MAPS
    ],
    *[
        path(
            f'atlas/{name}.html',
            RedirectView.as_view(pattern_name=target, permanent=True, query_string=True),
            name=f'geography-atlas-{name}',
        )
        for name, target in ATLAS_REDIRECTS.items()
    ],
]

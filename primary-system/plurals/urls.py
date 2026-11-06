from django.urls import path

from . import plurals

urlpatterns = [
    path('', plurals.page, name='plurals'),
    path('api/report/', plurals.report, name='plurals-report'),
]

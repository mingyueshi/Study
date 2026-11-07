from django.urls import path

from . import phrases

urlpatterns = [
    path('', phrases.page, name='phrases'),
    path('api/report/', phrases.report, name='phrases-report'),
]

from django.urls import path

from . import practice, views, wrong

urlpatterns = [
    path('', views.index, name='questionbank'),
    path('practice/', practice.page, name='questionbank-practice'),
    path('api/answer/', practice.answer, name='questionbank-answer'),
    path('wrong/', wrong.page, name='questionbank-wrong'),
]

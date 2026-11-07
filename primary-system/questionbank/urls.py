from django.urls import path

from . import olympiad, practice, views, wrong

urlpatterns = [
    path('', views.index, name='questionbank'),
    path('practice/', practice.page, name='questionbank-practice'),
    path('olympiad/', olympiad.page, name='questionbank-olympiad'),
    path('olympiad/practice/', practice.olympiad_page, name='questionbank-olympiad-practice'),
    path('api/answer/', practice.answer, name='questionbank-answer'),
    path('wrong/', wrong.page, name='questionbank-wrong'),
]

from django.urls import path

from . import quiz, stories, views

urlpatterns = [
    path('', views.index, name='idiom-scenes'),
    path('scenes/<slug:code>/', views.index, name='idiom-scene'),
    path('stories/', stories.page, name='idiom-stories'),
    path('quiz/', quiz.page, name='idiom-quiz'),
    path('entries/<uuid:pk>/', views.entry_detail, name='idiom-entry'),
]

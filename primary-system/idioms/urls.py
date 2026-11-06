from django.urls import path

from . import emoji, pairs, quiz, stories, views

urlpatterns = [
    path('', views.index, name='idiom-scenes'),
    path('scenes/<slug:code>/', views.index, name='idiom-scene'),
    path('stories/', stories.page, name='idiom-stories'),
    path('emoji/', emoji.page, name='idiom-emoji'),
    path('emoji/api/action/', emoji.action, name='idiom-emoji-action'),
    path('quiz/', quiz.page, name='idiom-quiz'),
    path('quiz/api/report/', quiz.report, name='idiom-quiz-report'),
    path('pairs/', pairs.page, name='idiom-pairs'),
    path('pairs/api/action/', pairs.action, name='idiom-pairs-action'),
    path('entries/<uuid:pk>/', views.entry_detail, name='idiom-entry'),
]

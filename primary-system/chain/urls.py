from django.urls import path

from . import views

urlpatterns = [
    path('', views.page, name='chain'),
    path('api/state/', views.state, name='chain-state'),
    path('api/start/', views.start, name='chain-start'),
    path('api/play/', views.play, name='chain-play'),
    path('api/hint/', views.hint, name='chain-hint'),
    path('api/restart/', views.restart, name='chain-restart'),
]

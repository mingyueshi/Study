from django.urls import path

from . import views

urlpatterns = [
    path('', views.page, name='chain'),
    path('api/state/', views.state, name='chain-state'),
    path('api/play/', views.play, name='chain-play'),
    path('api/hint/', views.hint, name='chain-hint'),
    path('api/restart/', views.restart, name='chain-restart'),
]

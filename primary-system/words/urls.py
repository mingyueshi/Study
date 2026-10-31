from django.urls import path

from . import views

urlpatterns = [
    path('', views.page, name='scenario-words'),
    path('api/state/', views.state, name='scenario-words-state'),
    path('api/learn/', views.learn, name='scenario-words-learn'),
]

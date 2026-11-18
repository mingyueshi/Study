from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='measurement'),
    path('estimation/', views.estimates, name='measurement-estimates'),
    path('<slug:topic_id>/', views.dimension, name='measurement-dimension'),
]

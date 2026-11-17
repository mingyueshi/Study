from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='math-beauty'),
    path('<slug:topic_id>/', views.topic, name='math-beauty-topic'),
]

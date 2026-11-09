from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='human-origins'),
    path('<slug:slug>/', views.detail, name='human-origins-station'),
]

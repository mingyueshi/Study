from django.urls import path

from . import views


urlpatterns = [
    path('', views.index, name='mysteries'),
    path('<slug:slug>/', views.detail, name='mystery-case'),
]

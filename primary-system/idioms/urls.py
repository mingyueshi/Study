from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='idiom-scenes'),
    path('scenes/<slug:code>/', views.index, name='idiom-scene'),
    path('entries/<uuid:pk>/', views.entry_detail, name='idiom-entry'),
]

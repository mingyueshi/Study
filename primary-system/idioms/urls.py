from django.urls import path

from . import stories, views

urlpatterns = [
    path('', views.index, name='idiom-scenes'),
    path('scenes/<slug:code>/', views.index, name='idiom-scene'),
    path('stories/', stories.page, name='idiom-stories'),
    path('entries/<uuid:pk>/', views.entry_detail, name='idiom-entry'),
]

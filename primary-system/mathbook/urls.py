from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='mathbook'),
    path('geometry-lab/', views.geometry_lab, name='geometry-lab'),
    path('<slug:book>/', views.reader, name='mathbook-book'),
    path('<slug:book>/progress/', views.progress, name='mathbook-progress'),
]

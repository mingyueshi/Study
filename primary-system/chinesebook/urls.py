from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='chinesebook'),
    path('<slug:book>/', views.reader, name='chinesebook-book'),
]

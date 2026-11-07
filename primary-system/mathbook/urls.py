from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='mathbook'),
    path('<slug:book>/', views.reader, name='mathbook-book'),
]

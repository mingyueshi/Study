from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='math-camp'),
    path('<slug:track_id>/', views.track, name='math-camp-track'),
]

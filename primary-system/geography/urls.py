from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="geography-index"),
    path("<str:code>/", views.detail, name="geography-detail"),
]

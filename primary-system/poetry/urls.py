from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="poetry-index"),
    path("excluded/", views.exclusions, name="poetry-exclusions"),
    path("<int:pk>/", views.detail, name="poetry-detail"),
]

from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="astronomy-index"),
    path("<int:ident>/", views.detail, name="astronomy-detail"),
]

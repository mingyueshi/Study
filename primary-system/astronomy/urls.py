from django.urls import path
from catalog.study_courses import astronomy_study
from . import views

urlpatterns = [
    path("", views.index, name="astronomy-index"),
    path("study/", astronomy_study, name="astronomy-study"),
    path("<int:ident>/", views.detail, name="astronomy-detail"),
]

from django.urls import path
from django.views.generic import RedirectView
from catalog.study_courses import astronomy_explore
from . import views

urlpatterns = [
    path("", astronomy_explore, name="astronomy-explore"),
    path("study/", RedirectView.as_view(pattern_name="astronomy-explore", permanent=True, query_string=True), name="astronomy-study"),
    path("stars/", views.index, name="astronomy-index"),
    path("<int:ident>/", views.detail, name="astronomy-detail"),
]

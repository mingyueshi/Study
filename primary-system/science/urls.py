from django.urls import path
from catalog.study_courses import matter_lab, science_lab
from . import body, rumors, views

urlpatterns = [
    path("lab/", science_lab, name="science-lab"),
    path("matter/", matter_lab, name="science-matter"),
    path("body/", body.index, name="science-body"),
    path("body/<slug:slug>/", body.detail, name="science-body-lesson"),
    path("rumors/", rumors.index, name="science-rumors"),
    path("rumors/training/", rumors.training, name="science-rumors-training"),
    path("rumors/<slug:slug>/", rumors.detail, name="science-rumor-case"),
    path("elements/", views.elements, name="science-elements"),
    path("elements/<int:number>/", views.element, name="science-element"),
]

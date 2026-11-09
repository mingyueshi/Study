from django.urls import path
from catalog.study_courses import science_lab
from . import views

urlpatterns = [
    path("lab/", science_lab, name="science-lab"),
    path("elements/", views.elements, name="science-elements"),
    path("elements/<int:number>/", views.element, name="science-element"),
]

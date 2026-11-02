from django.urls import path
from . import views

urlpatterns = [
    path("elements/", views.elements, name="science-elements"),
    path("elements/<int:number>/", views.element, name="science-element"),
]

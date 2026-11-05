from django.urls import path

from . import polyphones, views

urlpatterns = [
    path("", views.index, name="hanzi-index"),
    path("polyphones/", polyphones.page, name="hanzi-polyphones"),
    path("<str:character>/", views.detail, name="hanzi-detail"),
]

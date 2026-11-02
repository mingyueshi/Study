from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="hanzi-index"),
    path("<str:character>/", views.detail, name="hanzi-detail"),
]

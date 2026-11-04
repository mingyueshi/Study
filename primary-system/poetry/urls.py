from django.urls import path
from . import views, feihualing_views, theme_views

urlpatterns = [
    path("feihualing/", feihualing_views.page, name="feihualing"),
    path("feihualing/api/action/", feihualing_views.action, name="feihualing-action"),
    path("themes/", theme_views.index, name="poetry-themes"),
    path("themes/<slug:code>/", theme_views.detail, name="poetry-theme"),
    path("", views.index, name="poetry-index"),
    path("excluded/", views.exclusions, name="poetry-exclusions"),
    path("<int:pk>/", views.detail, name="poetry-detail"),
]

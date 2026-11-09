from django.urls import path

from . import views

urlpatterns = [
    path('', views.rewards, name='rewards'),
    path('redeem/', views.redeem_view, name='rewards-redeem'),
]

from django.urls import path

from . import views

urlpatterns = [
    path('', views.rewards, name='rewards'),
    path('shop/', views.shop, name='rewards-shop'),
    path('redeem/', views.redeem_view, name='rewards-redeem'),
]

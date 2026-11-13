from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='classical'),
    path('books/<slug:slug>/', views.book, name='classical-book'),
    path('<slug:slug>/', views.detail, name='classical-detail'),
    path('<slug:slug>/print/', views.print_article, name='classical-print'),
    path('<slug:slug>/source/', views.source, name='classical-source'),
]

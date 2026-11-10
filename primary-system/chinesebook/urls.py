from django.urls import path

from . import clinics, views

urlpatterns = [
    path('', views.index, name='chinesebook'),
    path('sentence-hospital/', clinics.sentence_hospital, name='sentence-hospital'),
    path('typo-clinic/', clinics.typo_clinic, name='typo-clinic'),
    path('<slug:book>/', views.reader, name='chinesebook-book'),
]

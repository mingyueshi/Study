from django.urls import path

from . import views

urlpatterns = [
    path('', views.page, name='writing'),
    path('api/drafts/', views.drafts_api, name='writing-drafts'),
    path('api/drafts/<uuid:pk>/', views.drafts_detail, name='writing-draft-detail'),
]

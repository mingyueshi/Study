from django.urls import path

from . import tree, views

urlpatterns = [
    path('', views.page, name='scenario-words'),
    path('tree/', tree.tree_page, name='words-tree'),
    path('api/state/', views.state, name='scenario-words-state'),
    path('api/learn/', views.learn, name='scenario-words-learn'),
]

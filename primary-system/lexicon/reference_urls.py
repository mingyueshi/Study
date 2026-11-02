from django.urls import path
from . import reference_views as v

urlpatterns = [
    path("", v.index, name="reference-lexicon"),
    path("cedict/", v.cedict, name="reference-cedict"),
    path("cedict/<int:pk>/", v.cedict_detail, name="reference-cedict-detail"),
    path("cmu/", v.cmu, name="reference-cmu"),
    path("cmu/<path:word>/", v.cmu_detail, name="reference-cmu-detail"),
]

from django.shortcuts import render
from django.views.decorators.cache import never_cache
from .models import Dataset


@never_cache
def index(request):
    return render(
        request,
        "reference_library/index.html",
        {"datasets": Dataset.objects.filter(state="ready").order_by("code")},
    )

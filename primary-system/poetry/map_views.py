"""诗词地图视图：只读浏览，不写学习记录。"""
from pathlib import Path

from django.http import Http404
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET

from reference_library.models import Dataset

from . import map

MAP_SVG = Path(__file__).resolve().parent.parent / "static" / "poetry" / "china-map.svg"


@never_cache
@require_GET
def page(request):
    if not Dataset.objects.filter(code="poetry", state="ready").exists():
        raise Http404("诗词语料尚未就绪。")
    places = map.place_panels()
    if not places:
        raise Http404("诗词地图还没有整理出地点。")
    code = request.GET.get("place", "")
    selected = next((p for p in places if p["id"] == code), places[0])
    provinces = []
    for place in places:
        if place["province"] not in provinces:
            provinces.append(place["province"])
    params = map.load_projection()
    return render(request, "poetry/map.html", {
        "places": places, "selected": selected, "provinces": provinces,
        "map_svg": MAP_SVG.read_text(encoding="utf-8") if MAP_SVG.is_file() else "",
        "map_width": params["width"], "map_height": params["height"],
    })

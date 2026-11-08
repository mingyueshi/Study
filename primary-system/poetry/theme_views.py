"""诗词题材分类专题页：只负责组装配置与分页，分类规则在 themes.py 与 data/themes.json。"""
from django.core.paginator import Paginator
from django.http import Http404
from django.shortcuts import get_object_or_404, render
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET

from reference_library.models import Dataset

from . import themes as theme_data

PER_PAGE = 24


@never_cache
@require_GET
def index(request):
    get_object_or_404(Dataset, code="poetry", state="ready")
    dynasty = theme_data.normalize_dynasty(request.GET.get("dynasty", "all"))
    groups = theme_data.groups(dynasty)
    total = sum(item["counts"][dynasty] for group in groups for item in group["themes"])
    theme_total = sum(len(group["themes"]) for group in groups)
    return render(
        request,
        "poetry/themes_index.html",
        {
            "groups": groups,
            "dynasty": dynasty,
            "dynasty_labels": theme_data.dynasty_labels(),
            "total": total,
            "theme_total": theme_total,
        },
    )


@never_cache
@require_GET
def seasons(request):
    """诗词四季入口：四季大卡置顶，情感与题材分组紧随其后。"""
    get_object_or_404(Dataset, code="poetry", state="ready")
    dynasty = theme_data.normalize_dynasty(request.GET.get("dynasty", "all"))
    groups = theme_data.groups(dynasty)
    season_group = next((group for group in groups if group["code"] == "siji"), None)
    if season_group is None:
        raise Http404("四季分类尚未配置")
    season_emoji = {"chun": "🌸", "xia": "☀️", "qiu": "🍂", "dong": "❄️"}
    seasons = [
        {**item["meta"], "counts": item["counts"], "emoji": season_emoji.get(item["meta"]["code"], "📖")}
        for item in season_group["themes"]
    ]
    emotion_groups = [group for group in groups if group["code"] != "siji"]
    emotion_total = sum(
        item["counts"][dynasty] for group in emotion_groups for item in group["themes"]
    )
    return render(
        request,
        "poetry/seasons.html",
        {
            "seasons": seasons,
            "emotion_groups": emotion_groups,
            "dynasty": dynasty,
            "dynasty_labels": theme_data.dynasty_labels(),
            "emotion_total": emotion_total,
        },
    )


@never_cache
@require_GET
def detail(request, code):
    get_object_or_404(Dataset, code="poetry", state="ready")
    theme = theme_data.theme_meta(code)
    if theme is None:
        raise Http404("题材分类不存在")
    dynasty = theme_data.normalize_dynasty(request.GET.get("dynasty", "all"))
    query = request.GET.get("q", "").strip()[:60]
    theme, rows = theme_data.entries(code, dynasty, query)
    featured = [row for row in rows if row["featured"]]
    auto_rows = [row for row in rows if not row["featured"]]
    page = Paginator(auto_rows, PER_PAGE).get_page(request.GET.get("page"))
    group = next(
        (
            group
            for group in theme_data.groups()
            if code in {item["meta"]["code"] for item in group["themes"]}
        ),
        None,
    )
    # 侧栏全量导航：四季与全部情感题材组（与 seasons 页同源同口径）。
    all_groups = theme_data.groups()
    season_group = next((g for g in all_groups if g["code"] == "siji"), None)
    season_emoji = {"chun": "🌸", "xia": "☀️", "qiu": "🍂", "dong": "❄️"}
    seasons = (
        [
            {**item["meta"], "counts": item["counts"], "emoji": season_emoji.get(item["meta"]["code"], "📖")}
            for item in season_group["themes"]
        ]
        if season_group
        else []
    )
    emotion_groups = [g for g in all_groups if g["code"] != "siji"]
    return render(
        request,
        "poetry/theme_detail.html",
        {
            "theme": theme["meta"],
            "group": group,
            "page": page,
            "featured": featured,
            "auto_total": len(auto_rows),
            "total": len(rows),
            "counts": theme["counts"],
            "dynasty": dynasty,
            "dynasty_labels": theme_data.dynasty_labels(),
            "q": query,
            "seasons": seasons,
            "emotion_groups": emotion_groups,
        },
    )

from django.core.paginator import Paginator
from django.db.models import Q
from django.http import Http404
from django.shortcuts import render, get_object_or_404
from django.views.decorators.cache import never_cache
from reference_library.models import Dataset
from .models import CountryRegion
from .importing import VERSION

REGIONS = {
    "Africa": "非洲",
    "Americas": "美洲",
    "Asia": "亚洲",
    "Europe": "欧洲",
    "Oceania": "大洋洲",
    "Antarctic": "南极地区",
}
SUBREGIONS = {
    "Caribbean": "加勒比地区",
    "Southern Asia": "南亚",
    "Middle Africa": "中部非洲",
    "Southern Europe": "南欧",
    "South America": "南美洲",
    "Polynesia": "波利尼西亚",
    "Western Europe": "西欧",
    "Eastern Africa": "东非",
    "Australia and New Zealand": "澳大利亚与新西兰",
    "Western Asia": "西亚",
    "Western Africa": "西非",
    "Eastern Europe": "东欧",
    "Central America": "中美洲",
    "Northern America": "北美洲",
    "South-Eastern Asia": "东南亚",
    "Southern Africa": "南部非洲",
    "Northern Europe": "北欧",
    "Eastern Asia": "东亚",
    "Northern Africa": "北非",
    "Micronesia": "密克罗尼西亚",
    "Melanesia": "美拉尼西亚",
    "Central Asia": "中亚",
}
from .chinese_names import CAPITALS, LANGUAGES, CURRENCIES

SUBREGIONS.update(
    {"Central Europe": "中欧", "North America": "北美洲", "Southeast Europe": "东南欧"}
)


def rows():
    return (
        CountryRegion.objects.filter(source_version=VERSION)
        if Dataset.objects.filter(code="countries", state="ready").exists()
        else CountryRegion.objects.none()
    )


def decorate(country):
    country.region_zh = REGIONS.get(country.region, country.region or "来源未提供")
    country.subregion_zh = SUBREGIONS.get(
        country.subregion, country.subregion or "来源未提供"
    )
    # 面积加千分位便于孩子朗读；格式属展示层，来源数值不动。
    country.area_label = (
        f"{country.area_km2:,.0f}" if country.area_km2 is not None else None
    )
    country.capital_labels = [
        {"original": name, "zh": CAPITALS.get(name, "中文名暂缺")}
        for name in country.capitals
    ]
    country.language_labels = [
        {"code": code, "original": name, "zh": LANGUAGES.get(code, "中文名暂缺")}
        for code, name in country.languages.items()
    ]
    country.currency_labels = [
        {
            "code": code,
            "original": item.get("name", ""),
            "symbol": item.get("symbol", ""),
            "zh": CURRENCIES.get(code, "中文名暂缺"),
        }
        for code, item in country.currencies.items()
    ]
    country.independence_label = (
        "来源记为独立"
        if country.independent is True
        else "来源记为非独立／属地" if country.independent is False else "来源未明确"
    )
    country.un_label = "是（来源值）" if country.un_member else "否／未加入（来源值）"
    return country


@never_cache
def index(request):
    q = request.GET.get("q", "").strip()
    region = request.GET.get("region", "")
    if len(q) > 150 or "\x00" in q or region and region not in REGIONS:
        return render(
            request, "geography/index.html", {"error": "查询条件不正确。"}, status=400
        )
    countries = rows()
    total = countries.count()
    if q:
        countries = countries.filter(
            Q(name_zh__icontains=q)
            | Q(editorial_name_zh__icontains=q)
            | Q(name_en__icontains=q)
            | Q(code__iexact=q)
            | Q(code2__iexact=q)
        )
    if region:
        countries = countries.filter(region=region)
    page = Paginator(countries.defer("raw", "derived"), 30).get_page(
        request.GET.get("page")
    )
    for item in page:
        decorate(item)
    return render(
        request,
        "geography/index.html",
        {
            "page": page,
            "q": q,
            "total": total,
            "regions": REGIONS.items(),
            "region": region,
        },
    )


@never_cache
def detail(request, code):
    country = decorate(get_object_or_404(rows(), code=code))
    neighbours = [
        decorate(c)
        for c in rows().filter(code__in=country.borders).defer("raw", "derived")
    ]
    return render(
        request, "geography/detail.html", {"country": country, "neighbours": neighbours}
    )

from django.core.paginator import Paginator
from django.db.models import Q
from django.shortcuts import render, get_object_or_404
from django.views.decorators.cache import never_cache
from reference_library.models import Dataset
from .models import CelestialRecord
from .constellations import CONSTELLATIONS
from .importing import VERSION


def rows():
    return (
        CelestialRecord.objects.filter(source_version=VERSION)
        if Dataset.objects.filter(code="hyg", state="ready").exists()
        else CelestialRecord.objects.none()
    )


def decorate(row):
    row.constellation_zh = CONSTELLATIONS.get(row.constellation, "未提供／中文名暂缺")
    return row


@never_cache
def index(request):
    q = request.GET.get("q", "").strip()
    named = request.GET.get("named", "")
    con = request.GET.get("con", "")
    if (
        len(q) > 100
        or "\x00" in q
        or named not in ("", "1")
        or con
        and con not in CONSTELLATIONS
    ):
        return render(
            request, "astronomy/index.html", {"error": "查询条件不正确。"}, status=400
        )
    objects = rows()
    total = objects.count()
    if named:
        objects = objects.filter(named_selection__isnull=False)
    if con:
        objects = objects.filter(constellation=con)
    if q:
        term = (
            Q(proper_name__icontains=q)
            | Q(designation__icontains=q)
            | Q(name_zh__icontains=q)
        )
        if q.isdecimal():
            term |= Q(catalogue_id=int(q)) | Q(hip=q) | Q(hd=q)
        objects = objects.filter(term)
    page = Paginator(objects.defer("raw"), 30).get_page(request.GET.get("page"))
    for record in page:
        decorate(record)
    return render(
        request,
        "astronomy/index.html",
        {
            "page": page,
            "total": total,
            "q": q,
            "named": named,
            "con": con,
            "constellations": CONSTELLATIONS.items(),
        },
    )


@never_cache
def detail(request, ident):
    record = decorate(get_object_or_404(rows(), catalogue_id=ident))
    fields = [
        ("赤经", record.ra_hours, "小时，J2000.0"),
        ("赤纬", record.dec_degrees, "度，J2000.0"),
        ("视星等", record.magnitude, "mag"),
        ("绝对星等", record.absolute_magnitude, "mag"),
        ("色指数", record.color_index, "B−V"),
        ("相对光度", record.luminosity_solar, "太阳光度"),
    ]
    return render(
        request, "astronomy/detail.html", {"record": record, "fields": fields}
    )

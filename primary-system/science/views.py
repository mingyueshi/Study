from django.core.paginator import Paginator
from django.db.models import Q
from django.http import Http404
from django.shortcuts import get_object_or_404, render
from django.views.decorators.cache import never_cache
from reference_library.models import Dataset
from .labels import ELEMENT_NAME_COMPONENTS, ELEMENT_NAME_SOURCE
from .models import Element


def check_ready():
    if not Dataset.objects.filter(code="periodic-elements", state="ready").exists():
        raise Http404("元素资料尚未完成导入")


@never_cache
def elements(request):
    check_ready()
    q = request.GET.get("q", "").strip()[:100]
    category = request.GET.get("category", "")[:80]
    rows = Element.objects.filter(valid=True)
    if q:
        filters = (
            Q(name__icontains=q) | Q(symbol__iexact=q) | Q(chinese_name__icontains=q)
        )
        if q.isdecimal():
            filters |= Q(number=int(q))
        rows = rows.filter(filters)
    if category:
        rows = rows.filter(category=category)
    categories = list(
        Element.objects.filter(valid=True)
        .values_list("category", "category_zh")
        .distinct()
        .order_by("category")
    )
    return render(
        request,
        "science/elements.html",
        {
            "page": Paginator(rows.order_by("number"), 30).get_page(
                request.GET.get("page")
            ),
            "q": q,
            "category": category,
            "categories": categories,
        },
    )


@never_cache
def element(request, number):
    check_ready()
    row = get_object_or_404(Element, number=number, valid=True)
    fields = [
        ("相对原子质量", row.atomic_mass, "（不是质量数）"),
        ("原始密度", row.density_original, row.density_unit),
        ("归一化密度", row.density_g_cm3, "g/cm³"),
        ("来源熔点字段", row.melt_k, "K（部分来源实际为三相点，教学前需核对条件）"),
        ("来源沸点字段", row.boil_k, "K"),
    ]
    return render(
        request,
        "science/element.html",
        {
            "element": row,
            "fields": fields,
            "name_components": ELEMENT_NAME_COMPONENTS.get(number, ""),
            "name_source": ELEMENT_NAME_SOURCE,
        },
    )

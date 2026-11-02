from django.core.paginator import Paginator
from django.db.models import Q
from django.shortcuts import render, get_object_or_404
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET
from reference_library.models import Dataset
from .models import PoetryDocument, PoetryText, PoetryExclusion


@never_cache
@require_GET
def index(request):
    q = request.GET.get("q", "").strip()[:120]
    collection = request.GET.get("collection", "")[:100]
    layer = request.GET.get("layer", "")
    rows = (
        PoetryText.objects.select_related("document")
        .defer("document__original_data", "paragraphs", "source_data")
        .all()
        if Dataset.objects.filter(code="poetry", state="ready").exists()
        else PoetryText.objects.none()
    )
    if q:
        rows = rows.filter(Q(title__contains=q) | Q(author__contains=q))
    if collection:
        rows = rows.filter(document__collection=collection)
    if layer in ("raw", "derived"):
        rows = rows.filter(document__layer=layer)
    page = Paginator(rows.order_by("document__path", "pk"), 30).get_page(
        request.GET.get("page")
    )
    return render(
        request,
        "poetry/index.html",
        {
            "page": page,
            "q": q,
            "selected_collection": collection,
            "layer": layer,
            "collections": PoetryDocument.objects.order_by("collection")
            .values_list("collection", flat=True)
            .distinct(),
            "document_count": PoetryDocument.objects.count(),
            "excluded_count": PoetryExclusion.objects.count(),
        },
    )


@never_cache
@require_GET
def detail(request, pk):
    get_object_or_404(Dataset, code="poetry", state="ready")
    row = get_object_or_404(
        PoetryText.objects.select_related("document").defer("document__original_data"),
        pk=pk,
    )
    siblings = row.document.texts.exclude(pk=pk).only("id", "title").order_by("pk")[:12]
    spells = row.source_data.get("spells", [])
    line_rows = [
        {"text": line, "pinyin": spells[i] if i < len(spells) else ""}
        for i, line in enumerate(row.paragraphs)
    ]
    origins = row.source_data.get("origin", [])
    field_labels = {
        "title": "原题名",
        "author": "原作者",
        "chapter": "篇章",
        "section": "分部",
        "subchapter": "子篇编号",
        "rhythmic": "词牌",
        "type": "体裁",
        "tags": "来源标签",
        "source_record_index": "来源记录索引",
        "id": "来源编号",
    }
    metadata = [
        {"label": field_labels.get(key, "来源原字段：" + key), "value": value}
        for key, value in row.source_data.items()
        if key not in ("paragraphs", "content", "spells", "origin")
    ]
    return render(
        request,
        "poetry/detail.html",
        {
            "record": row,
            "siblings": siblings,
            "line_rows": line_rows,
            "origins": origins,
            "metadata": metadata,
        },
    )


@never_cache
@require_GET
def exclusions(request):
    get_object_or_404(Dataset, code="poetry", state="ready")
    q = request.GET.get("q", "").strip()[:120]
    rows = PoetryExclusion.objects.all()
    if q:
        rows = rows.filter(Q(title__contains=q) | Q(author__contains=q))
    return render(
        request,
        "poetry/exclusions.html",
        {
            "page": Paginator(rows.order_by("row"), 40).get_page(
                request.GET.get("page")
            ),
            "q": q,
        },
    )

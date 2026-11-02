"""Compatible source detail URLs; all lists lead to the unified dictionary."""

from django.http import Http404, HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from django.urls import reverse
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET
from urllib.parse import urlencode
from .lookup_sources import ready_sources, source_rows


def redirect_lookup(
    request,
    *,
    browse="",
    scope="",
    page_key="page",
    allowed_scopes=("", "character", "chinese", "english", "idiom")
):
    values = {}
    if request.GET.get("q"):
        values["q"] = request.GET["q"]
    supplied = request.GET.get("scope", scope)
    selected = supplied if supplied in allowed_scopes else scope
    if selected:
        values["scope"] = selected
    if browse:
        values["browse"] = browse
    if request.GET.get("page"):
        values[page_key] = request.GET["page"]
    return HttpResponseRedirect(
        reverse("dictionary") + ("?" + urlencode(values) if values else "")
    )


@never_cache
@require_GET
def index(request):
    return redirect_lookup(request)


@never_cache
@require_GET
def cedict(request):
    return redirect_lookup(
        request,
        browse="cedict",
        scope="chinese",
        page_key="cedict_page",
        allowed_scopes=("", "chinese", "character"),
    )


@never_cache
@require_GET
def cmu(request):
    return redirect_lookup(
        request,
        browse="cmu",
        scope="english",
        page_key="cmu_page",
        allowed_scopes=("", "english"),
    )


@never_cache
@require_GET
def cedict_detail(request, pk):
    ready = ready_sources()
    record = get_object_or_404(source_rows("cc-cedict", ready), pk=pk)
    return render(request, "lexicon/reference/cedict_detail.html", {"record": record})


@never_cache
@require_GET
def cmu_detail(request, word):
    ready = ready_sources()
    rows = list(
        source_rows("cmudict", ready)
        .filter(search_word=word.casefold())
        .order_by("variant", "source_row")
    )
    if not rows:
        raise Http404
    return render(
        request,
        "lexicon/reference/cmu_detail.html",
        {"rows": rows, "word": rows[0].word},
    )

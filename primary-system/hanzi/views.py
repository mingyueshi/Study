from django.shortcuts import render
from django.http import Http404
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET
from lexicon.lookup_sources import ready_sources, source_rows
from lexicon.reference_views import redirect_lookup

from .property_labels import LABELS
from .strokes import writer_data

try:
    from .evolution_chars import CHARS as EVOLUTION_HALL_CHARS
except ImportError:  # 汉字演变馆数据尚未生成时照常工作
    EVOLUTION_HALL_CHARS = frozenset()

GROUPS = {
    "Unihan_DictionaryIndices.txt": "字典索引",
    "Unihan_DictionaryLikeData.txt": "字典资料",
    "Unihan_IRGSources.txt": "来源字形与编码",
    "Unihan_NumericValues.txt": "数值属性",
    "Unihan_OtherMappings.txt": "其他编码对照",
    "Unihan_RadicalStrokeCounts.txt": "部首与笔画",
    "Unihan_Readings.txt": "读音与释义",
    "Unihan_Variants.txt": "异体关系",
}


@never_cache
@require_GET
def index(request):
    return redirect_lookup(
        request,
        browse="hanzi",
        scope="character",
        page_key="hanzi_page",
        allowed_scopes=("", "character", "chinese"),
    )


@never_cache
@require_GET
def detail(request, character):
    ready = ready_sources()
    row = source_rows("unihan18", ready).filter(character=character).first()
    asset = source_rows("makemeahanzi", ready).filter(character=character).first()
    if row is None and asset is None:
        raise Http404("来源未收录此字形")
    properties = (
        [
            {
                "label": LABELS.get(
                    p.name, GROUPS.get(p.source_file, "来源属性") + "对照"
                )
                + "（"
                + p.name
                + "）",
                "value": p.value,
                "file": p.source_file,
                "line": p.source_line,
            }
            for p in row.property_rows.order_by("source_file", "name")
        ]
        if row
        else []
    )
    return render(
        request,
        "hanzi/detail.html",
        {
            "character": row
            or {
                "character": asset.character,
                "codepoint": f"U+{ord(asset.character):04X}",
            },
            "has_unihan": row is not None,
            "asset": asset,
            "stroke_data": writer_data(asset),
            "properties": properties,
            "in_evolution_hall": character in EVOLUTION_HALL_CHARS,
        },
    )

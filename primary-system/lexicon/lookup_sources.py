"""Read-only projections of imported reference versions for the unified dictionary."""

from urllib.parse import urlencode
from django.core.paginator import Paginator
from django.db.models import Case, Exists, IntegerField, Q, Value, When
from django.db.models.functions import Length
from reference_library.models import Dataset
from hanzi.models import HanziAsset, UnihanCharacter
from .reference_models import CedictRecord, CmuPronunciation
from .queries import matching_entries, public_records
from .models import LexicalEntry

SPECS = {
    "cc-cedict": (
        CedictRecord,
        "CC-CEDICT",
        "汉语词头、简繁、拼音与英文原释义",
        "https://cc-cedict.org/",
        "CC BY-SA 4.0",
        "https://creativecommons.org/licenses/by-sa/4.0/",
    ),
    "cmudict": (
        CmuPronunciation,
        "CMU Pronouncing Dictionary",
        "美式英语ARPAbet读音；不提供义项或录音",
        "https://github.com/cmusphinx/cmudict",
        "BSD-2-Clause",
        "https://github.com/cmusphinx/cmudict/blob/master/LICENSE",
    ),
    "unihan18": (
        UnihanCharacter,
        "Unihan 18",
        "补充字形、读音与原始属性，与正式词库版本分别标注",
        "https://www.unicode.org/versions/Unicode18.0.0/",
        "Unicode License v3",
        "https://www.unicode.org/license.txt",
    ),
    "makemeahanzi": (
        HanziAsset,
        "Make Me a Hanzi",
        "字形、来源拼音与逐笔图示",
        "https://github.com/skishore/makemeahanzi",
        "字典LGPL-3.0-or-later；图形Arphic Public License",
        "https://github.com/skishore/makemeahanzi/blob/master/COPYING",
    ),
}


def ready_sources():
    """Only the supported, fully ready version may contribute rows or metadata."""
    result = {}
    for dataset in Dataset.objects.filter(code__in=SPECS, state="ready").only(
        "code", "version", "title"
    ):
        model, title, description, url, license_name, license_url = SPECS[dataset.code]
        if dataset.version != model._meta.get_field("version").get_default():
            continue
        result[dataset.code] = {
            "code": dataset.code,
            "version": dataset.version,
            "title": title,
            "description": description,
            "url": url,
            "license": license_name,
            "license_url": license_url,
        }
    return result


def source_rows(code, ready):
    model = SPECS[code][0]
    if code not in ready:
        return model.objects.none()
    version = ready[code]["version"]
    return model.objects.filter(version=version).filter(
        Exists(Dataset.objects.filter(code=code, state="ready", version=version))
    )


def formal_query(text, scope):
    language = "en" if scope == "english" else "zh" if scope == "chinese" else ""
    kind = scope if scope in ("character", "idiom") else ""
    # Canonical search keys use NFC. Preserve the literal CJK codepoints here,
    # including canonically decomposable compatibility ideographs.
    if any(
        0x2E80 <= ord(char) <= 0x9FFF
        or 0xF900 <= ord(char) <= 0xFAFF
        or 0x20000 <= ord(char) <= 0x3347F
        for char in text
    ):
        ids = (
            public_records()
            .filter(forms__text__startswith=text)
            .values_list("binding__sense__entry_id", flat=True)
        )
        rows = LexicalEntry.objects.filter(pk__in=set(ids))
        if language:
            rows = rows.filter(language=language)
        if kind:
            rows = rows.filter(kind=kind)
        return rows.annotate(
            exact_rank=Case(
                When(headword=text, then=Value(0)),
                default=Value(1),
                output_field=IntegerField(),
            )
        ).order_by("exact_rank", "headword", "id")
    return matching_entries(text, language, kind)


def section(rows, *, key, title, description, params, version="", kind="", size=8):
    page = Paginator(rows, size).get_page(params.get(key))

    def link(number):
        values = {
            name: params[name]
            for name in (
                "q",
                "scope",
                "browse",
                "page",
                "cedict_page",
                "cmu_page",
                "hanzi_page",
            )
            if params.get(name)
        }
        values[key] = number
        return "?" + urlencode(values)

    return {
        "page": page,
        "title": title,
        "description": description,
        "version": version,
        "kind": kind,
        "previous_url": (
            link(page.previous_page_number()) if page.has_previous() else ""
        ),
        "next_url": link(page.next_page_number()) if page.has_next() else "",
    }


def reference_results(text, scope, params, *, exact=False, ready=None):
    ready = ready_sources() if ready is None else ready
    result = {
        "ready": ready,
        "cedict": None,
        "cmu": None,
        "hanzi": None,
        "asset_only": None,
        "stroke_asset": None,
    }
    browse = params.get("browse", "") if not text and not exact else ""
    chinese = scope in ("", "chinese", "character")
    if "cc-cedict" in ready and chinese and (text or browse == "cedict"):
        rows = source_rows("cc-cedict", ready)
        if text:
            filters = (
                Q(simplified=text) | Q(traditional=text)
                if exact
                else Q(simplified__startswith=text)
                | Q(traditional__startswith=text)
                | Q(pinyin_numbered__istartswith=text)
            )
            rows = rows.filter(filters)
        if scope == "character":
            rows = rows.annotate(
                simplified_length=Length("simplified"),
                traditional_length=Length("traditional"),
            ).filter(Q(simplified_length=1) | Q(traditional_length=1))
        rows = (
            rows.annotate(
                exact_rank=Case(
                    When(Q(simplified=text) | Q(traditional=text), then=Value(0)),
                    default=Value(1),
                    output_field=IntegerField(),
                )
            )
            .order_by("exact_rank", "source_line")
            .defer("definition_text")
        )
        result["cedict"] = section(
            rows,
            key="cedict_page",
            title="汉英参考词义",
            description="CC-CEDICT中文词头与英文原释义；同形记录分别保留。",
            params=params,
            version=ready["cc-cedict"]["version"],
        )
    if "cmudict" in ready and scope in ("", "english") and (text or browse == "cmu"):
        rows = source_rows("cmudict", ready)
        if text:
            rows = (
                rows.filter(search_word=text.casefold())
                if exact
                else rows.filter(search_word__startswith=text.casefold())
            )
        rows = (
            rows.annotate(
                exact_rank=Case(
                    When(search_word=text.casefold(), then=Value(0)),
                    default=Value(1),
                    output_field=IntegerField(),
                )
            )
            .order_by("exact_rank", "search_word", "variant", "source_row")
            .defer("note")
        )
        result["cmu"] = section(
            rows,
            key="cmu_page",
            title="英语读音",
            description="CMU美式ARPAbet音素。保留不同读音和来源变体，未提供录音。",
            params=params,
            version=ready["cmudict"]["version"],
        )
    if chinese and (text or browse in ("hanzi", "strokes")):
        use_assets = browse == "strokes" or "unihan18" not in ready
        code = "makemeahanzi" if use_assets else "unihan18"
        if code in ready:
            rows = source_rows(code, ready)
            if text:
                if use_assets:
                    rows = rows.filter(character=text)
                else:
                    rows = (
                        rows.filter(character=text)
                        if exact
                        else rows.filter(
                            Q(character=text)
                            | Q(codepoint__istartswith=text)
                            | Q(mandarin__istartswith=text)
                        )
                    )
            rows = rows.annotate(
                exact_rank=Case(
                    When(character=text, then=Value(0)),
                    default=Value(1),
                    output_field=IntegerField(),
                )
            ).order_by("exact_rank", "character")
            rows = (
                rows.defer("dictionary_data", "strokes", "medians")
                if use_assets
                else rows.defer("properties")
            )
            result["hanzi"] = section(
                rows,
                key="hanzi_page",
                title="汉字与笔顺资料",
                description=(
                    "Make Me a Hanzi字形资料"
                    if use_assets
                    else "Unihan 18补充属性；与正式来源的版本分别保留。"
                ),
                params=params,
                version=ready[code]["version"],
                kind="strokes" if use_assets else "unihan",
            )
        if len(text) == 1 and "makemeahanzi" in ready:
            asset = (
                source_rows("makemeahanzi", ready)
                .filter(character=text)
                .only(
                    "character",
                    "version",
                    "pinyin",
                    "decomposition",
                    "strokes",
                    "definition_en",
                    "radical",
                )
                .first()
            )
            result["stroke_asset"] = asset
            if (
                asset
                and "unihan18" in ready
                and not source_rows("unihan18", ready).filter(character=text).exists()
            ):
                result["asset_only"] = asset
    result["has_results"] = any(
        item and item["page"].paginator.count
        for item in (result["cedict"], result["cmu"], result["hanzi"])
    ) or bool(result["stroke_asset"])
    return result

"""诗词题材分类：加载配置、精选篇目定位与关键词自动归档。

分类规则全部来自 ``data/themes.json``，视图只负责取用这里整理好的结果。
自动归档是保守的关键词匹配，不等同于逐首人工校订；页面会如实标注。
"""
import json
import re
from functools import lru_cache
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

from .models import PoetryText

CONFIG_PATH = Path(__file__).resolve().parent / "data" / "themes.json"
SOURCE_CODE = "poetry-themes"
DYNASTY_ORDER = ("all", "tang", "song")
TITLE_PREFIXES = (
    "相和歌辞 ", "鼓吹曲辞 ", "杂曲歌辞 ", "横吹曲辞 ", "琴曲歌辞 ",
    "舞曲歌辞 ", "郊庙歌辞 ", "杂歌谣辞 ", "近代曲辞 ", "乐府杂曲 ",
    "新乐府 ",
)


def _clean_title(title):
    for prefix in TITLE_PREFIXES:
        if title.startswith(prefix):
            return title[len(prefix):]
    return title


def load_config():
    with CONFIG_PATH.open(encoding="utf-8") as file:
        config = json.load(file)
    if config.get("schema_version") != 1 or config.get("source_code") != SOURCE_CODE:
        raise ImproperlyConfigured("Unsupported poetry theme curriculum.")
    theme_codes = [theme["code"] for theme in config["themes"]]
    if len(theme_codes) != len(set(theme_codes)):
        raise ImproperlyConfigured("Duplicate poetry theme code.")
    known = set(theme_codes)
    for group in config["groups"]:
        missing = [code for code in group["themes"] if code not in known]
        if missing:
            raise ImproperlyConfigured(
                "Poetry theme group references unknown code: " + ", ".join(missing)
            )
    group_codes = {group["code"] for group in config["groups"]}
    for theme in config["themes"]:
        if theme.get("group") not in group_codes:
            raise ImproperlyConfigured(
                "Poetry theme has unknown group: " + theme["code"]
            )
    return config


def _compile_terms(terms):
    ordered = sorted(set(terms), key=len, reverse=True)
    if not ordered:
        return re.compile("(?!)")
    return re.compile("|".join(re.escape(term) for term in ordered))


def _excerpt(body, size=90):
    return " ".join((body or "").split())[:size]


def _resolve_featured(theme, collection_names):
    """按题名、作者（必要时首句）定位精选篇目，返回 (row, 展示题名)。"""
    resolved = []
    for item in theme.get("featured", []):
        rows = (
            PoetryText.objects.filter(
                document__layer="simplified",
                document__collection__in=collection_names,
                title__contains=item["title"],
                author__contains=item["author"],
            )
            .select_related("document")
            .only("id", "title", "author", "paragraphs", "body", "document__collection")
        )
        chosen = None
        for row in rows:
            if item.get("first_line") and item["first_line"] not in "".join(row.paragraphs):
                continue
            chosen = row
            break
        if chosen is not None:
            resolved.append((chosen, item.get("display") or _clean_title(chosen.title)))
    return resolved


@lru_cache(maxsize=1)
def _catalog():
    config = load_config()
    collection_names = tuple(config["collections"].values())
    collection_to_dynasty = {
        name: code for code, name in config["collections"].items()
    }
    themes = config["themes"]
    theme_by_code = {theme["code"]: theme for theme in themes}
    title_pattern = _compile_terms(
        term for theme in themes for term in theme["title_terms"]
    )
    body_pattern = _compile_terms(
        term for theme in themes for term in theme["body_terms"]
    )
    theme_rules = {
        theme["code"]: (
            set(theme["title_terms"]),
            set(theme["body_terms"]),
            int(theme.get("min_body_hits", 2)),
            tuple(theme.get("exclude_terms", [])),
        )
        for theme in themes
    }

    featured_by_pk = {}
    featured_keys = set()
    for theme in themes:
        for item in theme.get("featured", []):
            featured_keys.add((_clean_title(item["title"]), item["author"]))
        for row, display in _resolve_featured(theme, collection_names):
            featured_by_pk.setdefault(row.pk, (theme["code"], display))

    buckets = {theme["code"]: [] for theme in themes}
    rows = PoetryText.objects.filter(
        document__layer="simplified",
        document__collection__in=collection_names,
    ).values_list("pk", "title", "author", "body", "document__collection")
    for pk, title, author, body, collection in rows.iterator(chunk_size=2000):
        if pk in featured_by_pk:
            code, display = featured_by_pk[pk]
            buckets[code].append(
                {
                    "pk": pk,
                    "title": display,
                    "raw_title": title or "",
                    "author": author or "",
                    "collection": collection,
                    "dynasty": collection_to_dynasty.get(collection, ""),
                    "excerpt": _excerpt(body),
                    "score": 1000,
                    "featured": True,
                }
            )
            continue
        title = title or ""
        body = body or ""
        if (_clean_title(title), author or "") in featured_keys:
            continue
        matched_title = set(title_pattern.findall(title))
        matched_body = set(body_pattern.findall(body))
        best_code = ""
        best_score = 0
        for theme in themes:
            code = theme["code"]
            title_terms, body_terms, min_body_hits, excludes = theme_rules[code]
            if any(term in title or term in body for term in excludes):
                continue
            title_hits = len(matched_title & title_terms)
            body_hits = len(matched_body & body_terms)
            accepted = (
                title_hits >= 1 and body_hits >= min_body_hits
            ) or (
                title_hits == 0
                and body_hits >= max(min_body_hits * 2, 4)
                # 长诗关键词密度高，容易误判；没有题名线索时不参与自动归档。
                and len(body) <= 320
            )
            if not accepted:
                continue
            score = title_hits * 3 + body_hits
            if score > best_score:
                best_code = code
                best_score = score
        if not best_code:
            continue
        buckets[best_code].append(
            {
                "pk": pk,
                "title": _clean_title(title),
                "raw_title": title,
                "author": author or "",
                "collection": collection,
                "dynasty": collection_to_dynasty.get(collection, ""),
                "excerpt": _excerpt(body),
                "score": best_score,
                "featured": False,
            }
        )

    catalog = {}
    for theme in themes:
        code = theme["code"]
        entries = sorted(
            buckets[code],
            key=lambda item: (not item["featured"], -item["score"], item["pk"]),
        )
        seen = set()
        unique = []
        for item in entries:
            key = (item["author"], item["excerpt"][:24])
            if key in seen:
                continue
            seen.add(key)
            unique.append(item)
        counts = {
            dynasty: sum(1 for item in unique if item["dynasty"] == dynasty)
            for dynasty in ("tang", "song")
        }
        counts["all"] = counts["tang"] + counts["song"]
        catalog[code] = {
            "meta": theme,
            "entries": unique,
            "counts": counts,
        }

    groups = []
    for group in config["groups"]:
        groups.append(
            {
                "code": group["code"],
                "title": group["title"],
                "description": group["description"],
                "themes": [
                    {"meta": theme_by_code[code], "counts": catalog[code]["counts"]}
                    for code in group["themes"]
                ],
            }
        )
    return {
        "config": config,
        "groups": groups,
        "catalog": catalog,
        "dynasty_labels": config["dynasty_labels"],
    }


def normalize_dynasty(value):
    return value if value in DYNASTY_ORDER else "all"


def dynasty_labels():
    return _catalog()["dynasty_labels"]


def groups(dynasty="all"):
    dynasty = normalize_dynasty(dynasty)
    return _catalog()["groups"]


def theme_meta(code):
    return _catalog()["catalog"].get(code)


def entries(code, dynasty="all", query=""):
    theme = _catalog()["catalog"].get(code)
    if theme is None:
        return None, []
    dynasty = normalize_dynasty(dynasty)
    rows = theme["entries"]
    if dynasty in ("tang", "song"):
        rows = [row for row in rows if row["dynasty"] == dynasty]
    if query:
        rows = [
            row
            for row in rows
            if query in row["title"] or query in row["author"]
        ]
    return theme, rows

"""词根词缀树：校验人工编排的构词数据，转换为共用词树节点。"""
import json
import re
from functools import lru_cache
from urllib.parse import urlsplit

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

SOURCE = settings.BASE_DIR / "content_sources" / "word-morphology.json"
ROOT_KEY = "morphology"
KINDS = {"prefix", "suffix", "root", "base", "component"}


def require(condition, message):
    if not condition:
        raise ImproperlyConfigured(f"词根词缀数据异常：{message}")


def text(value):
    return isinstance(value, str) and bool(value.strip()) and not re.search(r'[<>"\r\n]', value)


def validate(data):
    require(isinstance(data, dict) and data.get("schema_version") == 1, "版本")
    for field in ("title", "intro"):
        require(text(data.get(field)), field)
    for field in ("steps", "limits"):
        require(isinstance(data.get(field), list) and data[field] and all(map(text, data[field])), field)
    sources = data.get("sources")
    require(isinstance(sources, list) and sources, "缺少出处")
    source_ids = set()
    for source in sources:
        require(isinstance(source, dict), "出处格式")
        sid = source.get("id")
        require(text(sid) and sid not in source_ids, "出处 ID 无效或重复")
        require(text(source.get("title")) and text(source.get("url")), f"出处信息：{sid}")
        url = urlsplit(source["url"])
        require(url.scheme == "https" and bool(url.netloc), f"出处链接：{sid}")
        source_ids.add(sid)
    categories = data.get("categories")
    require(isinstance(categories, list) and len(categories) == 3, "需要前缀、后缀和词根三类")
    category_ids, family_ids, word_ids = set(), set(), set()
    for category in categories:
        require(isinstance(category, dict), "分类格式")
        kind = category.get("id")
        require(isinstance(kind, str) and kind in {"prefix", "suffix", "root"} and kind not in category_ids, "分类 ID")
        category_ids.add(kind)
        for field in ("zh", "en", "emoji", "intro"):
            require(text(category.get(field)), f"分类 {kind} 的 {field}")
        families = category.get("families")
        require(isinstance(families, list) and families, f"分类没有家族：{kind}")
        for family in families:
            require(isinstance(family, dict), "家族格式")
            fid = family.get("id")
            require(isinstance(fid, str) and re.fullmatch(kind + r"-[a-z]+", fid)
                    and fid not in family_ids, "家族 ID 无效或重复")
            family_ids.add(fid)
            for field in ("form", "meaning", "origin", "hint"):
                require(text(family.get(field)), f"家族 {fid} 的 {field}")
            forms = family.get("forms")
            require(isinstance(forms, list) and forms and all(isinstance(form, str)
                    and re.fullmatch(r"[a-z]+", form) for form in forms)
                    and len(forms) == len(set(forms)), f"构词成分拼写：{fid}")
            refs = family.get("sources")
            require(isinstance(refs, list) and refs and all(isinstance(ref, str)
                    and ref in source_ids for ref in refs), f"出处引用：{fid}")
            words = family.get("words")
            require(isinstance(words, list) and len(words) >= 3, f"家族至少三个词：{fid}")
            spellings = set()
            for word in words:
                require(isinstance(word, dict), f"例词格式：{fid}")
                en, wid = word.get("en"), word.get("id")
                require(isinstance(en, str) and re.fullmatch(r"[a-z]+", en)
                        and en not in spellings, f"例词拼写或重复：{fid}")
                require(wid == f"{fid}-{en}" and wid not in word_ids, f"例词稳定 ID：{en}")
                word_ids.add(wid)
                spellings.add(en)
                for field in ("zh", "pos", "build", "note"):
                    require(text(word.get(field)), f"例词 {wid} 的 {field}")
                require(word["build"].endswith("→ " + en), f"构词式结果不符：{wid}")
                example = word.get("example")
                require(isinstance(example, dict) and text(example.get("en"))
                        and text(example.get("zh")), f"双语例句：{wid}")
                require(re.search(r"\b" + en + r"\b", example["en"], re.I), f"例句未使用目标词：{wid}")
                parts = word.get("parts")
                require(isinstance(parts, list) and len(parts) >= 2, f"拆词至少两部分：{wid}")
                for part in parts:
                    require(isinstance(part, dict) and isinstance(part.get("kind"), str) and part["kind"] in KINDS
                            and isinstance(part.get("text"), str)
                            and re.fullmatch(r"[a-z]+", part["text"])
                            and text(part.get("meaning")), f"拆词成分：{wid}")
                require("".join(part["text"] for part in parts) == en, f"拆词无法还原拼写：{wid}")
                focus = [i for i, part in enumerate(parts) if part["kind"] == kind and part["text"] in forms]
                require(focus, f"例词缺少本家族成分：{wid}")
                require(kind != "prefix" or 0 in focus, f"前缀位置：{wid}")
                require(kind != "suffix" or len(parts) - 1 in focus, f"后缀位置：{wid}")


@lru_cache(maxsize=1)
def load_data():
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    validate(data)
    return data


def load_morphology_root():
    data = load_data()
    source_index = {source["id"]: source for source in data["sources"]}
    categories = []
    for category in data["categories"]:
        families = []
        for family in category["families"]:
            branch_id = "morph-" + family["id"]
            words = [{**word, "morph_id": word["id"], "family_id": branch_id,
                      "family_form": family["form"], "family_meaning": family["meaning"],
                      "sources": [source_index[ref] for ref in family["sources"]],
                      "parts": [{**part, "focus": part["kind"] == category["id"]
                                 and part["text"] in family["forms"]} for part in word["parts"]]}
                     for word in family["words"]]
            families.append({"id": branch_id, "zh": family["form"], "en": "",
                             "meaning": family["meaning"], "hint": family["hint"],
                             "origin": family["origin"], "forms": family["forms"],
                             "kind": category["id"], "words": words, "children": [], "total": len(words)})
        categories.append({"id": "morph-" + category["id"], "zh": category["zh"],
                           "en": category["en"], "hint": category["intro"],
                           "words": [], "children": families,
                           "total": sum(family["total"] for family in families)})
    return {"id": ROOT_KEY, "key": ROOT_KEY, "zh": data["title"], "emoji": "🧩",
            "words": [], "children": categories, "total": sum(node["total"] for node in categories),
            "family_count": sum(len(node["children"]) for node in categories)}

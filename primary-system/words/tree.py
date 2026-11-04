"""词以类聚：WordNet 上下位树（只读浏览；掌握仍走 /words/ 场景页）。

树来自 ``tree_data/tree.json``（开发期从 OEWN 2025 生成）；叶词按词头连接
场景单词，运行时复用 ``state_payload`` 的同一套词典口径（中文、音标、状态），
保证树页词卡与场景页完全一致。不做义项级自动对齐。
"""
import json
from functools import lru_cache
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET

from .services import state_payload

TREE_PATH = Path(__file__).resolve().parent / "tree_data" / "tree.json"
MAX_DEPTH = 3
SOURCE_CODE = "primary-words-tree"


def load_tree():
    with TREE_PATH.open(encoding="utf-8") as file:
        tree = json.load(file)
    validate(tree)
    return tree


def validate(tree):
    if tree.get("schema_version") != 1 or tree.get("source", {}).get("name") != "Open English Wordnet 2025":
        raise ImproperlyConfigured("Unsupported word tree curriculum.")
    roots = tree.get("roots", [])
    if len(roots) < 5:
        raise ImproperlyConfigured("词树至少需要 5 条根枝干。")

    def walk(node, seen, depth):
        if depth > MAX_DEPTH:
            raise ImproperlyConfigured(f"节点超深：{node['id']}")
        if node["id"] in seen:
            raise ImproperlyConfigured(f"节点循环引用：{node['id']}")
        seen.add(node["id"])
        for child in node["children"]:
            walk(child, seen, depth + 1)
        seen.discard(node["id"])

    for root in roots:
        if not root.get("key") or not root.get("zh"):
            raise ImproperlyConfigured("根枝干缺 key 或中文。")
        walk(root, set(), 0)
    keys = [root["key"] for root in roots]
    if len(keys) != len(set(keys)):
        raise ImproperlyConfigured("根枝干 key 重复。")


@lru_cache(maxsize=1)
def load_tree_cached():
    return load_tree()


def enrich(roots):
    """把树里的叶词按词头连到场景词：zh/ipa/emoji/场景码与 /words/ 页同一口径。"""
    state = state_payload({"guest_key": "words-tree-read"})
    by_en = {}
    for word in state["words"]:
        by_en.setdefault(word["en"].lower(), word)
    scenarios = {scenario["id"]: scenario for scenario in state["scenarios"]}

    def enrich_node(node):
        rows = []
        for word in node["words"]:
            match = by_en.get(word["en"].lower())
            row = {
                "en": word["en"],
                "scenario_id": word["scenario"],
                "zh": "", "ipa": "", "emoji": "", "scenario_code": "", "scenario_zh": "",
                "source_status": "",
            }
            if match:
                scenario = scenarios.get(match["scenario"], {})
                row.update({
                    "zh": match["zh"], "ipa": match["ipa"], "emoji": match["emoji"],
                    "scenario_code": scenario.get("code", ""),
                    "scenario_zh": scenario.get("zh", ""),
                    "source_status": match["source_status"],
                })
            rows.append(row)
        children = [enrich_node(child) for child in node["children"]]
        return {
            **node,
            "words": rows, "children": children,
            "total": sum(child["total"] for child in children) + len(rows),
        }

    return [enrich_node(root) for root in roots]


def find_path(roots, word):
    """返回包含该词头的 (root, path_ids)；找不到返回 (None, [])。"""
    target = word.strip().lower()

    def walk(node, path):
        if target in {w["en"].lower() for w in node["words"]}:
            return path + [node["id"]]
        for child in node["children"]:
            found = walk(child, path + [node["id"]])
            if found:
                return found
        return None

    for root in roots:
        found = walk(root, [])
        if found:
            return root, found
    return None, []


@never_cache
@require_GET
def tree_page(request):
    tree = load_tree_cached()
    roots = enrich(tree["roots"])
    word = request.GET.get("word", "").strip()[:60]
    selected_root = None
    path_ids = []
    if word:
        selected_root, path_ids = find_path(roots, word)
    if selected_root is None:
        root_key = request.GET.get("root", "")
        selected_root = next((r for r in roots if r["key"] == root_key), roots[0] if roots else None)
    if selected_root is None:
        raise ImproperlyConfigured("词树没有任何根枝干。")
    selected_word = None
    if word and selected_root is not None:
        selected_word = next(
            (w for w in iter_words([selected_root]) if w["en"].lower() == word.lower()), None)
    return render(request, "words/tree.html", {
        "roots": roots, "selected_root": selected_root, "path_ids": path_ids,
        "word": word, "selected_word": selected_word,
    })


def iter_words(nodes):
    for node in nodes:
        yield from node["words"]
        yield from iter_words(node["children"])

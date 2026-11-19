"""词以类聚：WordNet 上下位树、拼写家族与词根词缀树。

词义树来自 ``tree_data/tree.json``（开发期从 OEWN 2025 生成）。叶词按词头连接
场景单词，运行时复用 ``state_payload`` 的中文、音标和状态。
拼写家族自带拼读例词，词根词缀树使用单独校验的构词内容源。
"""
import json
from functools import lru_cache
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET

from .families import ROOT_KEY as SPELLING_ROOT_KEY, load_spelling_root
from .morphology import ROOT_KEY as MORPHOLOGY_ROOT_KEY, load_data as load_morphology_data, load_morphology_root
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


def find_branch(roots, branch_id):
    """返回包含该枝干的 (root, path_ids)；找不到返回 (None, [])。"""
    target = branch_id.strip()

    def walk(node, path):
        if node["id"] == target:
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


def node_at_path(root, path):
    node = root
    for node_id in path[1:]:
        node = next(child for child in node['children'] if child['id'] == node_id)
    return node


def search_words(roots, query, within):
    """从当前关系类型的词树查词，保留同形词各自所在的枝干。"""
    if not query:
        return [], 0
    needle = query.casefold()
    matches = []

    def walk(root, node, labels, in_scope):
        in_scope = in_scope or node['id'] == within
        labels = (*labels, node['zh'] or node['en'])
        if in_scope:
            for word in node['words']:
                en, zh = word['en'].casefold(), word['zh'].casefold()
                if needle in en or needle in zh:
                    matches.append((needle not in (en, zh), root, node, labels, word))
        for child in node['children']:
            walk(root, child, labels, in_scope)

    for root in roots:
        walk(root, root, (), not within)
    matches.sort(key=lambda match: match[0])
    results = []
    for _, root, node, labels, word in matches[:30]:
        params = {'root': root['key'], 'q': query}
        if within:
            params['within'] = within
        if word.get('morph_id'):
            params['entry'] = word['morph_id']
        else:
            params.update(word=word['en'], branch=node['id'])
        results.append({'en': word['en'], 'zh': word['zh'], 'path': ' › '.join(labels),
                        'url': reverse('words-tree', query=params, fragment='tree-panel')})
    return results, len(matches)


@never_cache
@require_GET
def tree_page(request):
    word = request.GET.get("word", "").strip()[:60]
    branch = request.GET.get("branch", "").strip()[:80]
    root_key = request.GET.get("root", "")
    entry_id = request.GET.get("entry", "").strip()[:100]
    query = request.GET.get('q', '').strip()[:60]
    within = request.GET.get('within', '').strip()[:80]
    spelling_root = load_spelling_root()
    morphology_root = load_morphology_root()
    spelling_branch, _ = find_branch([spelling_root], branch) if branch else (None, [])
    morphology_branch, _ = find_branch([morphology_root], branch) if branch else (None, [])
    is_spelling = root_key == SPELLING_ROOT_KEY or (not root_key and spelling_branch is not None)
    is_morphology = not is_spelling and (root_key == MORPHOLOGY_ROOT_KEY or (not root_key and (
        morphology_branch is not None or bool(entry_id))))
    roots = ([spelling_root] if is_spelling else [morphology_root] if is_morphology
             else enrich(load_tree_cached()["roots"]))

    entry = next((row for row in iter_words(roots) if row.get("morph_id") == entry_id), None) if is_morphology and entry_id else None

    preferred_root = next((root for root in roots if root['key'] == root_key), None)
    branch_root, branch_path = find_branch(roots, branch) if branch else (None, [])
    selected_root, path_ids = None, []
    if word:
        if branch_root and preferred_root in (None, branch_root):
            node = node_at_path(branch_root, branch_path)
            _, relative_path = find_path([node], word)
            if relative_path:
                selected_root, path_ids = branch_root, branch_path[:-1] + relative_path
        if selected_root is None and preferred_root:
            selected_root, path_ids = find_path([preferred_root], word)
        if selected_root is None:
            selected_root, path_ids = find_path(roots, word)
    if selected_root is None and branch:
        selected_root, path_ids = branch_root, branch_path
    if selected_root is None:
        selected_root = preferred_root or roots[0]
    selected_word = None
    if word and path_ids:
        selected_word = next((row for row in node_at_path(selected_root, path_ids)['words']
                              if row['en'].lower() == word.lower()), None)
    if entry:
        selected_root, path_ids = find_branch(roots, entry["family_id"])
        selected_word = entry
    if within and find_branch(roots, within)[0] is None:
        within = ''
    results, match_count = search_words(roots, query, within)
    active_branch = path_ids[-1] if len(path_ids) > 1 else ''
    clear_params = {'root': selected_root['key']}
    if active_branch:
        clear_params['branch'] = active_branch
    if selected_word:
        if selected_word.get('morph_id'):
            clear_params['entry'] = selected_word['morph_id']
        else:
            clear_params['word'] = selected_word['en']
    morphology_payload = None
    if is_morphology:
        morphology_payload = {
            "entries": list(iter_words(roots)),
            "families": [{"id": family["id"], "kind": family["kind"], "form": family["zh"],
                          "forms": family["forms"], "meaning": family["meaning"]}
                         for category in morphology_root["children"] for family in category["children"]],
        }
    return render(request, "words/tree.html", {
        "roots": roots, "selected_root": selected_root, "path_ids": path_ids,
        "active_branch": active_branch,
        "query": query, "within": within, "search_results": results, "match_count": match_count,
        "clear_search_url": reverse('words-tree', query=clear_params, fragment='tree-panel' if selected_word else 'tree-workspace'),
        "selected_word": selected_word, "is_spelling": is_spelling,
        "spelling_root": spelling_root, "is_morphology": is_morphology,
        "is_wordnet": not is_spelling and not is_morphology,
        "morphology_root": morphology_root, "morphology_data": load_morphology_data() if is_morphology else None,
        "morphology_payload": morphology_payload,
    })


def iter_words(nodes):
    for node in nodes:
        yield from node["words"]
        yield from iter_words(node["children"])

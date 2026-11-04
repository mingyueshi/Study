#!/usr/bin/env python3
"""生成「词以类聚」的 WordNet 上下位树（开发期工具，产物提交进仓库）。

来源：data/lexicon/english-wordnet-2025.xml.gz（Open English Wordnet 2025，
CC-BY-4.0，sha256 见 lexicon/sources/registry.json），WN-LMF XML 流式解析。
从约 12 条孩子友好的根枝干（动物/食物/交通工具……）向下走 hypernym 关系，
深度 ≤5；只保留枝干节点与「词头在场景词(577)或 OEWN scope(499)」的叶节点。

用法：.venv/bin/python scripts/build_word_tree.py
产物：words/tree_data/tree.json（运行时只读展示，掌握仍在 /words/ 场景页）。
"""

import gzip
import json
import os
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()

from words.models import ScenarioWord  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "data" / "lexicon" / "english-wordnet-2025.xml.gz"
OUT = ROOT / "words" / "tree_data" / "tree.json"
MAX_DEPTH = 3

# 儿童场景不收录的词形（酒类、肉部位等）；命中的同义集视为无命中。
EXCLUDE_LEMMAS = {
    "alcohol", "booze", "whisky", "vodka", "cocktail", "wine", "beer", "vino",
    "lager", "sake", "rum", "brandy", "gin", "tequila", "home_brew", "wineglass",
    "organs", "game", "hamburger", "haschisch", "popcorn",
}

# 整棵剪掉的同义集（酒类枝干等，即使有子树也不展开）。
PRUNE_SYNSETS = {"oewn-07900542-n", "oewn-07907701-n", "oewn-07917827-n"}

# 根枝干：按「成员词形 + 释义关键词」在语料中解析具体同义集，避免手写 synset id。
ROOTS = [
    {"key": "animal", "lemma": "animal", "def": "living organism", "zh": "动物", "emoji": "🐾"},
    {"key": "food", "lemma": "food", "def": "any substance that can be metabolized", "zh": "食物", "emoji": "🍎"},
    {"key": "fruit", "lemma": "fruit", "def": "the ripened reproductive body of a seed plant", "zh": "水果", "emoji": "🍓"},
    {"key": "vegetable", "lemma": "vegetable", "def": "edible seeds or roots or stems or leaves", "zh": "蔬菜", "emoji": "🥕"},
    {"key": "plant", "lemma": "plant", "def": "living organism lacking the power of locomotion", "zh": "植物", "emoji": "🌿"},
    {"key": "vehicle", "lemma": "vehicle", "def": "conveyance that transports people or objects", "zh": "交通工具", "emoji": "🚌"},
    {"key": "clothing", "lemma": "clothing", "def": "covering designed to be worn", "zh": "衣物", "emoji": "👕"},
    {"key": "tool", "lemma": "tool", "def": "implement used in the practice of a vocation", "zh": "工具", "emoji": "🔧"},
    {"key": "furniture", "lemma": "furniture", "def": "furnishings that make a room ready for use", "zh": "家具", "emoji": "🛋️"},
    {"key": "instrument", "lemma": "musical instrument", "def": "musical instrument", "zh": "乐器", "emoji": "🎻"},
    {"key": "building", "lemma": "building", "def": "structure with a roof and walls", "zh": "建筑", "emoji": "🏫"},
    {"key": "container", "lemma": "container", "def": "object that can hold things", "zh": "容器", "emoji": "🧺"},
]

# 枝干节点中文标注：写在 words/tree_data/zh-editorial.json（按 synset id），
# 生成时缺失项会自动补进档案文件，人工填 zh 后重跑即可生效。


def iter_synsets(path):
    """流式解析 WN-LMF：产出 (synset_id, definition, hypernym_ids, lemmas)。"""
    lemmas_by_synset = {}
    synsets = {}
    parser = ET.iterparse(gzip.open(path, "rb"), events=("end",))
    for event, element in parser:
        tag = element.tag.split("}")[-1]
        if tag == "LexicalEntry":
            lemma = element.find("Lemma")
            if lemma is not None:
                entry_form = (lemma.get("writtenForm") or "").lower()
                for sense in element.findall("Sense"):
                    synset = sense.get("synset")
                    if synset and synset.endswith("-n"):
                        lemmas_by_synset.setdefault(synset, set()).add(entry_form)
        elif tag == "Synset":
            if element.get("id", "").endswith("-n"):
                definition = ""
                hypernyms = []
                for child in element:
                    child_tag = child.tag.split("}")[-1]
                    if child_tag == "Definition" and not definition:
                        definition = (child.text or "").strip()
                    elif child_tag == "SynsetRelation" and child.get("relType") == "hypernym":
                        hypernyms.append(child.get("target"))
                synsets[element.get("id")] = {
                    "definition": definition, "hypernyms": hypernyms,
                }
        if tag in ("LexicalEntry", "Synset"):
            # 只在顶层元素末尾清理；嵌套 Definition 的文本还要等 Synset 处理时读取。
            element.clear()
    for synset_id, data in synsets.items():
        data["lemmas"] = sorted(lemmas_by_synset.get(synset_id, ()))
    return synsets


def resolve_root(synsets, spec):
    hits = []
    for synset_id, data in synsets.items():
        if spec["lemma"] in data["lemmas"]:
            hits.append(synset_id)
    if len(hits) > 1:
        # 同名词形歧义时才用释义片段筛（如 plant 工厂/植物）。
        filtered = [sid for sid in hits if spec["def"] in synsets[sid]["definition"]]
        if filtered:
            hits = filtered
    if not hits:
        raise SystemExit(f"根枝干未解析：{spec['key']}（{spec['lemma']} / {spec['def']}）")
    return min(hits), hits


def main():
    if not SOURCE.is_file():
        raise SystemExit(f"缺少语料：{SOURCE}")
    synsets = iter_synsets(SOURCE)
    print(f"名词同义集：{len(synsets)}")

    scenario_words = {
        word.en: {"zh": "", "emoji": word.emoji, "scenario": word.scenario_id}
        for word in ScenarioWord.objects.select_related("scenario")
    }
    print(f"场景词：{len(scenario_words)}")

    children = {}
    for synset_id, data in synsets.items():
        for parent in data["hypernyms"]:
            children.setdefault(parent, set()).add(synset_id)

    # 根解析（同词形多义时避开已占用的根，避免同名词歧义）。
    resolved_roots = []
    taken = set()
    for spec in ROOTS:
        best, hits = resolve_root(synsets, spec)
        if best in taken:
            best = min((h for h in hits if h not in taken), default=best)
        taken.add(best)
        resolved_roots.append({**spec, "synset": best})

    # DFS 保留：枝干（子树内有命中）或含命中词的叶；深度 ≤3，更深的词上浮到边界节点。
    scope = set(scenario_words) - EXCLUDE_LEMMAS
    kept = {}

    def subtree_words(synset_id, path):
        """收集边界深度以下的全部场景词（含排除过滤），用于上浮。"""
        if synset_id in path or synset_id not in synsets:
            return []
        data = synsets[synset_id]
        rows = [lemma for lemma in data["lemmas"] if lemma in scope]
        path.add(synset_id)
        for child in children.get(synset_id, ()):
            rows.extend(subtree_words(child, path))
        path.discard(synset_id)
        return rows

    def walk(synset_id, depth, path):
        if depth > MAX_DEPTH or synset_id in kept or synset_id in path:
            return False
        data = synsets.get(synset_id)
        if data is None or synset_id in PRUNE_SYNSETS:
            return False
        words = [lemma for lemma in data["lemmas"] if lemma in scope]
        path.add(synset_id)
        kept_children = []
        for child in sorted(children.get(synset_id, ())):
            if depth == MAX_DEPTH:
                # 到达边界：更深的场景词直接上浮到本节点，不再展开分类学内部层。
                deep = subtree_words(child, path)
                if deep:
                    words.extend(deep)
            elif walk(child, depth + 1, path):
                kept_children.append(child)
        path.discard(synset_id)
        if kept_children or words:
            kept[synset_id] = {
                "definition": data["definition"], "lemmas": data["lemmas"],
                "words": sorted(set(words)), "children": kept_children, "depth": depth,
            }
            return True
        return False

    roots = []
    for spec in resolved_roots:
        if walk(spec["synset"], 0, set()):
            roots.append(spec)

    # 链坍缩：无词、单子链的纯分类节点合并掉（chordate→craniate 这类只留一层）。
    def collapse(synset_id):
        data = kept[synset_id]
        while (
            not data["words"] and len(data["children"]) == 1
            and synset_id not in {spec["synset"] for spec in roots}
        ):
            synset_id = data["children"][0]
            data = kept[synset_id]
        return synset_id

    # 中文标注档案：按 synset id 人工维护（避免同名词形歧义），缺失项自动补进档案待填。
    zh_file = OUT.parent / "zh-editorial.json"
    editorial = {}
    if zh_file.is_file():
        editorial = json.loads(zh_file.read_text(encoding="utf-8"))

    def node_words(synset_id):
        data = kept[synset_id]
        rows = []
        for lemma in data["words"]:
            scenario = scenario_words.get(lemma)
            rows.append({"en": lemma, "scenario": scenario["scenario"] if scenario else None})
        return rows

    def to_node(synset_id):
        data = kept[synset_id]
        zh = editorial.get(synset_id, {}).get("zh", "")
        headword = min(data["lemmas"], key=len) if data["lemmas"] else synset_id
        label = zh or headword.replace("_", " ")
        return {
            "id": synset_id, "en": headword, "zh": zh, "emoji": "",
            "gloss": data["definition"][:160],
            "label": label,
            "children": [to_node(child) for child in data["children"]],
            "words": node_words(synset_id),
        }

    tree_roots = []
    for spec in roots:
        node = to_node(collapse(spec["synset"]))
        node["key"] = spec["key"]
        node["emoji"] = spec["emoji"]
        node["zh"] = spec["zh"]
        node["label"] = spec["zh"]
        tree_roots.append(node)

    # 把仍缺中文的枝干补进档案文件，人工填写 zh 后重跑即可生效。
    candidates = dict(editorial)

    def gather_missing(nodes):
        for node in nodes:
            if not node["zh"] and node["id"] not in candidates:
                candidates[node["id"]] = {"en": node["en"], "gloss": node["gloss"][:110], "zh": ""}
            gather_missing(node["children"])

    gather_missing(tree_roots)
    if candidates != editorial:
        zh_file.write_text(json.dumps(candidates, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print(f"中文标注档案已更新：{zh_file}（待填 zh 字段）")

    def count_nodes(nodes):
        return sum(count_nodes(n["children"]) + 1 for n in nodes)

    leaf_words = []

    def collect_words(nodes):
        for node in nodes:
            leaf_words.extend(node["words"])
            collect_words(node["children"])

    collect_words(tree_roots)
    hits = [w for w in leaf_words if w["scenario"]]
    payload = {
        "schema_version": 1,
        "source": {
            "name": "Open English Wordnet 2025",
            "license": "CC-BY-4.0",
            "file": "data/lexicon/english-wordnet-2025.xml.gz",
            "max_depth": MAX_DEPTH,
        },
        "roots": tree_roots,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"枝干根：{len(tree_roots)} | 节点：{count_nodes(tree_roots)} | 叶词：{len(leaf_words)} | 场景命中：{len(hits)}")
    print(f"已写入 {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""日常用语专题：句式与话题双视图浏览 + 「看中文选英文」练习。

数据是生成物：``scripts/build_phrases.cjs`` 从 primary/english-data.js 的
ENGLISH_PHRASES（教材词卡短语）确定性转换而来，en/zh 文本不改写。判分在
前端展示，每题由 ``report`` 按词表确定性选项集复核并重算对错后落一条记录
（``records``，对错都记）。游客沿用会话键双轨，键只在 POST 写入路径生成
——页面 GET 保持零写入、零会话。
"""
import hashlib
import json
import random
import re
import secrets
from functools import lru_cache
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST, require_safe

DATA_PATH = Path(__file__).resolve().parent / "data" / "phrases.json"
TIERS = ('core', 'extended')


@lru_cache(maxsize=1)
def load_data():
    with DATA_PATH.open(encoding="utf-8") as file:
        data = json.load(file)
    validate(data)
    return data


def _walk_strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, list):
        for item in value:
            yield from _walk_strings(item)
    elif isinstance(value, dict):
        for item in value.values():
            yield from _walk_strings(item)


def validate(data):
    if data.get("schema_version") != 1:
        raise ImproperlyConfigured("Unsupported phrase dataset.")
    patterns = {pattern["code"] for pattern in data.get("patterns", [])} | {'misc', None}
    scenarios = {scenario["code"] for scenario in data.get("scenarios", [])}
    items = data.get("items", [])
    if len(data.get("scenarios", [])) < 4 or len(items) < 400:
        raise ImproperlyConfigured("日常用语数据不足。")
    seen = set()
    core = 0
    for item in items:
        phrase_id = item.get("id", "")
        if not phrase_id or phrase_id in seen or item.get("en", "") in seen:
            raise ImproperlyConfigured("日常用语数据异常：" + repr(phrase_id))
        seen.add(phrase_id)
        seen.add(item["en"])
        if item.get("scenario") not in scenarios or item.get("pattern") not in patterns:
            raise ImproperlyConfigured(f"{phrase_id} 的句式或情景不合法。")
        if item.get("tier") not in TIERS:
            raise ImproperlyConfigured(f"{phrase_id} 的层级不合法。")
        if item["tier"] == "core":
            core += 1
            if not item.get("pattern"):
                raise ImproperlyConfigured(f"{phrase_id} 是句子但缺句式分组。")
        for text in _walk_strings(item):
            if '"' in text or "\n" in text or "\r" in text:
                raise ImproperlyConfigured(f"{phrase_id} 的文本出现英文双引号或裸换行。")
            if re.search(r"<[a-zA-Z]", text):
                raise ImproperlyConfigured(f"{phrase_id} 的文本出现 HTML 标签形态。")
    if core < 50:
        raise ImproperlyConfigured("练习句子不足 50 句。")


@lru_cache(maxsize=1)
def item_index():
    return {item["id"]: item for item in load_data()["items"]}


def option_forms(item, items):
    """确定性选项集：正确句 + 两个同句式干扰 + 一个同话题干扰。"""
    pool_by_pattern = {}
    pool_by_scenario = {}
    for other in items:
        if other["tier"] != "core" or other["id"] == item["id"] or other["en"] == item["en"]:
            continue
        pool_by_pattern.setdefault(other["pattern"], []).append(other["en"])
        pool_by_scenario.setdefault(other["scenario"], []).append(other["en"])

    def pick(pool, seed):
        if not pool:
            return None
        return pool[int(hashlib.md5(seed.encode()).hexdigest(), 16) % len(pool)]

    forms = {item["en"]}
    same_pattern = pool_by_pattern.get(item["pattern"], [])
    same_scenario = pool_by_scenario.get(item["scenario"], [])
    for seed, pool in (("p1", same_pattern), ("p2", same_pattern), ("s1", same_scenario)):
        chosen = pick(pool, f"{item['id']}:{seed}")
        if chosen and chosen not in forms and len(forms) < 4:
            forms.add(chosen)
    fallback = [en for en in sorted(pool_by_scenario.get(item["scenario"], [])) if en not in forms]
    for en in fallback:
        if len(forms) >= 4:
            break
        forms.add(en)
    return sorted(forms)


@lru_cache(maxsize=1)
def practice_items():
    """练习题池：core 层每句一条，选项集加载期确定，换一题只换展示顺序。"""
    items = load_data()["items"]
    return tuple({"id": item["id"], "en": item["en"], "zh": item["zh"],
                  "options": option_forms(item, items)}
                 for item in items if item["tier"] == "core")


@lru_cache(maxsize=1)
def practice_pool():
    return {item["id"] for item in practice_items()}


def practice_round(rng):
    item = rng.choice(practice_items())
    options = list(item["options"])
    rng.shuffle(options)
    return {**item, "options": options}


@ensure_csrf_cookie
@never_cache
@require_safe
def page(request):
    data = load_data()
    seed = request.GET.get("q_seed", "")[:40]
    rng = random.Random(seed) if seed else random.SystemRandom()
    pattern_counts = {pattern["code"]: 0 for pattern in data["patterns"]}
    scenario_counts = {scenario["code"]: 0 for scenario in data["scenarios"]}
    for item in data["items"]:
        if item["pattern"] in pattern_counts:
            pattern_counts[item["pattern"]] += 1
        scenario_counts[item["scenario"]] += 1
    patterns = [{**pattern, "count": pattern_counts[pattern["code"]]}
                for pattern in data["patterns"] if pattern_counts[pattern["code"]]]
    scenarios = [{**scenario, "count": scenario_counts[scenario["code"]]}
                 for scenario in data["scenarios"]]
    return render(request, "phrases/index.html", {
        "patterns": patterns,
        "scenarios": scenarios,
        "items": [{"id": item["id"], "en": item["en"], "zh": item["zh"],
                   "pattern": item["pattern"], "scenario": item["scenario"],
                   "tier": item["tier"], "unit": item["unit_id"], "head": item["head"]}
                  for item in data["items"]],
        "total": len(data["items"]),
        "core_count": sum(1 for item in data["items"] if item["tier"] == "core"),
        "round": practice_round(rng),
        "next_href": "?q_seed=" + secrets.token_hex(4) + "#practice",
    })


@never_cache
@require_POST
def report(request):
    """逐题上报练习结果：服务端按确定性选项集复核并重算对错，不信任前端结论。"""
    from .models import PhraseAnswer
    from .records import owner_filter

    if request.content_type != "application/json" or len(request.body) > 4000:
        return JsonResponse({"error": "请求格式不正确。"}, status=400)
    try:
        data = json.loads(request.body)
    except (ValueError, UnicodeError, RecursionError):
        return JsonResponse({"error": "请求格式不正确。"}, status=400)
    phrase_id, chosen, answer = (data.get(key) for key in ("id", "chosen", "answer"))
    if not isinstance(data, dict) or not all(isinstance(value, str) for value in (phrase_id, chosen, answer)):
        return JsonResponse({"error": "请求格式不正确。"}, status=400)
    pool_options = {item["id"]: set(item["options"]) for item in practice_items()}
    if phrase_id not in practice_pool() or chosen not in pool_options[phrase_id] \
            or answer not in pool_options[phrase_id]:
        return JsonResponse({"error": "这道题不在练习范围，请刷新页面后再试。"}, status=400)
    PhraseAnswer.objects.create(
        phrase=phrase_id, chosen=chosen[:200], answer=answer,
        correct=chosen == answer, **owner_filter(request),
    )
    return JsonResponse({"ok": True})

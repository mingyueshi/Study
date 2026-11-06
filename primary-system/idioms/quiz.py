"""看释义猜成语：从词库实时出题，释义补字，难度就是提示字数 0~3。

题池按质量过滤后全部来自当前生效词典记录（chinese-xinhua-idioms），
「常用」池再取场景课程里通过钉词校验的成语。判分、提示与连对计数在前端
完成；每题第一次检查后由 ``report`` 上报一次结果（对错都记，逐题一条），
服务端按题池校验词头与难度后再落库。
"""
import json
import random
from functools import lru_cache

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST, require_safe

from lexicon.views import record_payload

from .catalog import SOURCE_CODE, dictionary_records, load_curriculum, matches_pin, with_details

LEVELS = (3, 2, 1, 0)  # 提示字数：3 最易（只剩一个空），0 全猜
LEVEL_LABELS = {3: "入门 · 提示 3 字", 2: "普通 · 提示 2 字", 1: "进阶 · 提示 1 字", 0: "挑战 · 无提示"}
DISTRACTOR_COUNT = 8
MIN_DEFINITION = 8  # 释义至少这么长才算能出题
SOURCES = ("common", "all")


@lru_cache(maxsize=1)
def question_pool():
    """全量题池：{词头: 卡片}；四字成语、释义合格且不泄漏词头。"""
    pool = {}
    for record in with_details(dictionary_records()):
        entry = record.binding.sense.entry
        headword = entry.headword
        if len(headword) != 4 or headword in pool:
            continue
        payload = record_payload(record)
        definition = payload["definition"]
        if len(definition) < MIN_DEFINITION or headword in definition or "「" in definition:
            continue
        pronunciation = payload["pronunciation"]
        pool[headword] = {
            "headword": headword,
            "definition": definition,
            "pinyin": pronunciation["value"] if pronunciation else "",
            "example": payload["properties"].get("example", ""),
            "entry_id": str(entry.pk),
        }
    return pool


@lru_cache(maxsize=1)
def char_bank():
    """干扰字库：题池词头里出现过的所有单字。"""
    return tuple(sorted({char for item in question_pool().values() for char in item["headword"]}))


@lru_cache(maxsize=1)
def common_pool():
    """场景课程的常用成语题池（逐条过钉词校验，漂移即弃用）。"""
    curriculum = load_curriculum()
    records = {str(record.binding_id): record for record in with_details(dictionary_records())}
    pool = question_pool()
    items = []
    for pin in curriculum["idioms"]:
        record = records.get(pin["binding_id"])
        if record and matches_pin(record, pin):
            item = pool.get(record.headword)
            if item:
                items.append(item)
    return tuple(items)


def build_round(rng, items, level):
    """一道题：选成语、按 level 任选提示位、生成候选键盘。"""
    item = rng.choice(items)
    chars = list(item["headword"])
    hint_positions = set(rng.sample(range(len(chars)), level))
    blank_positions = [index for index in range(len(chars)) if index not in hint_positions]
    slots = [
        {"shown": chars[index] if index in hint_positions else "", "answer": chars[index]}
        for index in range(len(chars))
    ]
    answer_chars = {chars[index] for index in blank_positions}
    keys = set(answer_chars)
    while len(keys) < len(answer_chars) + DISTRACTOR_COUNT and len(keys) < len(char_bank()):
        keys.add(rng.choice(char_bank()))
    ordered = list(keys)
    rng.shuffle(ordered)
    return {**item, "slots": slots, "keys": ordered, "level": level}


def pick_pool(source):
    items = common_pool() if source == "common" else tuple(question_pool().values())
    # 常用池意外为空（词库整体漂移）时退回全量，宁可出难一点也不开天窗。
    return items or tuple(question_pool().values())


@ensure_csrf_cookie
@never_cache
@require_safe
def page(request):
    raw_level = request.GET.get("level", "")
    level = int(raw_level) if raw_level.isdigit() and int(raw_level) in LEVELS else 3
    source = request.GET.get("source", "")
    if source not in SOURCES:
        source = "common"
    seed = request.GET.get("seed", "")[:40]
    rng = random.Random(seed) if seed else random.SystemRandom()
    current = build_round(rng, pick_pool(source), level)
    query = f"level={level}&source={source}"
    sizes = {"common": len(common_pool()), "all": len(question_pool())}
    return render(request, "idioms/quiz.html", {
        "round": current,
        "level": level,
        "level_chips": [(value, LEVEL_LABELS[value]) for value in LEVELS],
        "source": source,
        "source_chips": [
            {"value": value, "label": label, "size": sizes[value], "on": value == source}
            for value, label in (("common", "常用题库"), ("all", "大全题库"))
        ],
        "next_href": f"?{query}",
    })


@never_cache
@require_POST
def report(request):
    """逐题上报结果：对错都记，每题一条（与前端「首次检查才计数」同节奏）。"""
    from .models import PlayRecord
    from .records import record_play

    if request.content_type != "application/json" or len(request.body) > 2000:
        return JsonResponse({"error": "请求格式不正确。"}, status=400)
    try:
        data = json.loads(request.body)
    except (ValueError, UnicodeError, RecursionError):
        return JsonResponse({"error": "请求格式不正确。"}, status=400)
    headword, level, source = data.get("headword"), data.get("level"), data.get("source")
    if (
        not isinstance(data, dict)
        or not isinstance(headword, str)
        or headword not in question_pool()
        or type(level) is not int or level not in LEVELS
        or source not in SOURCES
        or type(data.get("correct")) is not bool
        or type(data.get("used_hint")) is not bool
    ):
        return JsonResponse({"error": "上报内容不完整，请刷新页面后再试。"}, status=400)
    record_play(request, game=PlayRecord.Game.QUIZ, size=1,
                correct=1 if data["correct"] else 0,
                extra={"headword": headword, "level": level, "source": source,
                       "used_hint": data["used_hint"]})
    return JsonResponse({"ok": True})

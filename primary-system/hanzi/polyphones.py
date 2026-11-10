"""多音字专题：浏览与练习。数据见 polyphone_data/README.md。

「给词选读音」练习判分在前端，但每题由 ``report`` 上报一次，服务端按读音表
复核并重算对错后落一条练习记录（``records``，对错都记）。游客沿用会话键
双轨，键只在 POST 写入路径生成——页面 GET 保持零写入、零会话。
"""
import json
import random
import unicodedata
from collections import defaultdict
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlencode

from django.core.exceptions import ImproperlyConfigured
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST, require_safe

DATA_PATH = Path(__file__).resolve().parent / "polyphone_data" / "polyphones.json"
STARTERS_PATH = DATA_PATH.with_name("starters.json")
MAX_PRACTICE_CHARS = 60  # 练习选题池：证据最厚的常见字

try:
    from .evolution_chars import CHARS as EVOLUTION_HALL_CHARS
except ImportError:  # 汉字演变馆数据尚未生成时照常工作
    EVOLUTION_HALL_CHARS = frozenset()


@lru_cache(maxsize=1)
def load_polyphones():
    with DATA_PATH.open(encoding="utf-8") as file:
        data = json.load(file)
    validate(data)
    return data


def validate(data):
    if data.get("schema_version") != 1:
        raise ImproperlyConfigured("Unsupported polyphone dataset.")
    chars = data.get("chars", [])
    if len(chars) < 800:
        raise ImproperlyConfigured("多音字数据不足。")
    seen = set()
    for item in chars:
        char = item.get("char", "")
        if not char or len(char) != 1 or char in seen:
            raise ImproperlyConfigured("多音字数据异常：" + repr(char))
        seen.add(char)
        readings = item.get("readings", [])
        if len(readings) < 2:
            raise ImproperlyConfigured(f"{char} 不足两个读音。")
        for reading in readings:
            if not reading.get("pinyin") or not reading.get("words"):
                raise ImproperlyConfigured(f"{char} 读音缺拼音或组词。")


def common_chars():
    """练习选题池：按组词证据总量排序的前 60 个字（常见度代理）。"""
    chars = load_polyphones()["chars"]
    ranked = sorted(chars, key=lambda item: -sum(r["count"] for r in item["readings"]))
    return ranked[:MAX_PRACTICE_CHARS]


@lru_cache(maxsize=1)
def starter_readings():
    """核对入门读音，并把教学组词转换成词库通用格式。"""
    data = json.loads(STARTERS_PATH.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or not data:
        raise ImproperlyConfigured("缺少多音字入门数据。")
    for char, rows in data.items():
        if char not in char_index() or not isinstance(rows, list) or len(rows) < 2:
            raise ImproperlyConfigured(f"{char} 的入门读音不足两个或不在词库里。")
        readings = {row["pinyin"]: row["tone"] for row in char_index()[char]["readings"]}
        seen = set()
        for row in rows:
            if not isinstance(row, dict) or not all(
                isinstance(row.get(key), str) and row[key].strip() for key in ("pinyin", "meaning", "example")
            ) or not isinstance(row.get("words"), list) or not row["words"]:
                raise ImproperlyConfigured(f"{char} 的入门读音、提示、例句或组词异常。")
            pinyin = row["pinyin"]
            if pinyin not in readings or pinyin in seen:
                raise ImproperlyConfigured(f"{char} 的入门读音重复或不在词库里。")
            seen.add(pinyin)
            words = []
            for pair in row["words"]:
                if not isinstance(pair, list) or len(pair) != 2 or not all(isinstance(value, str) for value in pair):
                    raise ImproperlyConfigured(f"{char} 的入门组词缺少词语或拼音。")
                word, pronunciation = pair
                syllables = pronunciation.split()
                if word.count(char) != 1 or len(word) != len(syllables) or syllables[word.index(char)] != pinyin:
                    raise ImproperlyConfigured(f"{word} 的入门组词与读音未对齐。")
                words.append({"word": word, "position": word.index(char), "pinyin": pronunciation})
            if words[0]["word"] not in row["example"]:
                raise ImproperlyConfigured(f"{char} 的入门例句缺少首个组词。")
            row.update(tone=readings[pinyin], words=words)
    return data


def question(char, word, reading, readings):
    return {
        "char": char,
        "word": word["word"],
        "position": word["position"],
        "syllables": word["pinyin"].split(),
        "answer": reading["pinyin"],
        "options": [{"pinyin": row["pinyin"], "tone": row["tone"]} for row in readings],
        "example": reading.get("example", ""),
    }


@lru_cache(maxsize=1)
def starter_questions():
    return tuple(
        question(char, reading["words"][0], reading, readings)
        for char, readings in starter_readings().items()
        for reading in readings
    )


@lru_cache(maxsize=1)
def practice_items():
    """词库拓展题池，排除组词相同但目标读音不同的题。"""
    items = []
    for item in common_chars():
        char = item["char"]
        readings = item["readings"]
        word_readings = defaultdict(set)
        for reading in readings:
            for word in reading["words"]:
                word_readings[word["word"]].add(reading["pinyin"])
        for reading in readings:
            for word in reading["words"]:
                syllables = word["pinyin"].split()
                position = word["position"]
                if (word["word"].count(char) == 1 and len(word_readings[word["word"]]) == 1
                        and len(syllables) == len(word["word"]) and position == word["word"].index(char)
                        and syllables[position] == reading["pinyin"]):
                    items.append(question(char, word, reading, readings))
    return tuple(items)


@lru_cache(maxsize=1)
def char_index():
    return {item["char"]: item for item in load_polyphones()["chars"]}


def word_parts(word):
    """组词按位置拆三段，模板直接高亮目标字。"""
    position = word["position"]
    return {
        "before": word["word"][:position],
        "target": word["word"][position],
        "after": word["word"][position + 1:],
        "word": word["word"],
        "pinyin": word["pinyin"],
    }


def reading_rows(item):
    starters = {row["pinyin"]: row for row in starter_readings().get(item["char"], [])}
    readings = {row["pinyin"]: row for row in item["readings"]}
    rows = []
    for pinyin in starters | readings:
        row = readings[pinyin]
        starter = starters.get(pinyin, {})
        preferred = starter.get("words", [])
        preferred_words = {word["word"] for word in preferred}
        extra = [word for word in row["words"] if word["word"] not in preferred_words]
        rows.append({
            "pinyin": pinyin,
            "tone": row["tone"],
            "meaning": starter.get("meaning", ""),
            "example": starter.get("example", ""),
            "words": [word_parts(word) for word in (preferred or extra)],
            "extra": [word_parts(word) for word in extra] if preferred else [],
        })
    return rows


def initial_letter(pinyin):
    """取拼音首字母（去掉声调符号、小写），零声母的 ā/ò 等归到对应元音。"""
    ch = pinyin[0]
    if "a" <= ch.lower() <= "z":
        return ch.lower()
    base = unicodedata.normalize("NFD", ch)
    return base[0].lower() if base else "#"


def readings_bucket(count):
    """按读音数分桶：2 / 3 / 4+。"""
    return "4+" if count >= 4 else str(count)


def chip_rows(chars):
    return [
        {"char": item["char"],
         "readings_text": " · ".join(reading["pinyin"] for reading in item["readings"]),
         "words_text": " ".join(word["word"] for row in reading_rows(item) for word in row["words"] + row["extra"]),
         "bucket": readings_bucket(len(item["readings"])),
         "initial": initial_letter(item["readings"][0]["pinyin"])}
        for item in chars
    ]


def grouped_chars(chars):
    """按拼音首字母分组，保留原始顺序；返回有序列表。"""
    buckets = defaultdict(list)
    for row in chip_rows(chars):
        buckets[row["initial"]].append(row)
    return [{"initial": letter, "chips": buckets[letter]}
            for letter in sorted(buckets.keys())]


def bucket_counts(chars):
    counts = {"2": 0, "3": 0, "4+": 0}
    for item in chars:
        counts[readings_bucket(len(item["readings"]))] += 1
    return counts


def practice_round(rng, mode="", avoid=""):
    pool = practice_items() if mode == "more" else starter_questions()
    item = rng.choice([item for item in pool if item["word"] != avoid] or pool)
    options = list(item["options"])
    rng.shuffle(options)
    return {
        **item,
        "options": options,
        "target": item["char"],
        "cells": list(zip(item["word"], item["syllables"])),
    }


@ensure_csrf_cookie
@never_cache
@require_safe
def page(request):
    data = load_polyphones()
    char = request.GET.get("char", "")
    if char not in char_index():
        char = next(iter(starter_readings()))
    part = request.GET.get("part")
    context = {}
    if part != "practice":
        context = {
            "current_char": {"char": char, "rows": reading_rows(char_index()[char])},
            "in_evolution_hall": char in EVOLUTION_HALL_CHARS,
        }
    if part == "detail":
        return render(request, "hanzi/polyphone_detail.html", context)

    seed = request.GET.get("q_seed", "")[:40]
    rng = random.Random(seed) if seed else random.SystemRandom()
    mode = "more" if request.GET.get("mode") == "more" else ""
    current = practice_round(rng, mode, request.GET.get("avoid", "")[:40])
    context.update({
        "round": current,
        "more_practice": mode == "more",
        "next_href": "?" + urlencode({"char": char, "mode": mode, "avoid": current["word"]}),
        "mode_href": "?" + urlencode({"char": char, "mode": "" if mode else "more", "avoid": current["word"]}),
    })
    if part == "practice":
        return render(request, "hanzi/polyphone_practice.html", context)

    counts = bucket_counts(data["chars"])
    return render(request, "hanzi/polyphones.html", {
        **context,
        "chars": grouped_chars(data["chars"]),
        "total": len(data["chars"]),
        "starters": starter_readings(),
        "buckets": [
            {"bucket": "all", "label": "全部", "count": len(data["chars"])},
            {"bucket": "2", "label": "2 个读音", "count": counts["2"]},
            {"bucket": "3", "label": "3 个读音", "count": counts["3"]},
            {"bucket": "4+", "label": "4 个及以上", "count": counts["4+"]},
        ],
    })


@never_cache
@require_POST
def report(request):
    """逐题上报练习结果：服务端按读音表复核并重算对错，不信任前端结论。"""
    from .models import PolyphoneAnswer
    from .records import owner_filter

    if request.content_type != "application/json" or len(request.body) > 2000:
        return JsonResponse({"error": "请求格式不正确。"}, status=400)
    try:
        data = json.loads(request.body)
    except (ValueError, UnicodeError, RecursionError):
        return JsonResponse({"error": "请求格式不正确。"}, status=400)
    if not isinstance(data, dict) or not all(isinstance(data.get(key), str) for key in ("char", "word", "chosen", "answer")):
        return JsonResponse({"error": "请求格式不正确。"}, status=400)
    char, word, chosen, answer = (data[key] for key in ("char", "word", "chosen", "answer"))
    practice_chars = {item["char"] for item in common_chars()} | starter_readings().keys()
    readings = {reading["pinyin"] for reading in char_index()[char]["readings"]} if char in char_index() else set()
    if char not in practice_chars or chosen not in readings or answer not in readings:
        return JsonResponse({"error": "这道题不在练习范围，请刷新页面后再试。"}, status=400)
    answer = PolyphoneAnswer.objects.create(
        char=char, word=word[:40], chosen=chosen, answer=answer,
        correct=chosen == answer, **owner_filter(request),
    )
    if request.user.is_authenticated and answer.correct:
        from incentives.services import record_event
        record_event(request.user, "polyphone_correct", request=request)
    from incentives.services import take_awards
    rewards = take_awards(request)
    return JsonResponse({"ok": True} | ({"rewards": rewards} if rewards else {}))

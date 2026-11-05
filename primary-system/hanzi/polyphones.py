"""多音字专题：浏览与练习。数据见 polyphone_data/README.md。"""
import json
import random
import unicodedata
from collections import defaultdict
from functools import lru_cache
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe

DATA_PATH = Path(__file__).resolve().parent / "polyphone_data" / "polyphones.json"
MAX_PRACTICE_CHARS = 60  # 练习选题池：证据最厚的常见字


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
def practice_items():
    """练习题池：常见字的每个读音组词一条，答案与选项为该字全部读音。"""
    items = []
    for item in common_chars():
        readings = item["readings"]
        for reading in readings:
            for word in reading["words"]:
                if word["position"] >= len(word["word"]):
                    continue
                syllables = word["pinyin"].split()
                if len(syllables) != len(word["word"]):
                    continue
                items.append({
                    "char": item["char"],
                    "word": word["word"],
                    "position": word["position"],
                    "syllables": syllables,
                    "answer": reading["pinyin"],
                    "options": [{"pinyin": r["pinyin"], "tone": r["tone"]} for r in readings],
                    "english": word.get("english", ""),
                })
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
        "pinyin": word["pinyin"],
        "english": word.get("english", ""),
    }


def reading_rows(item):
    return [
        {
            "pinyin": reading["pinyin"],
            "tone": reading["tone"],
            "words": [word_parts(word) for word in reading["words"]],
        }
        for reading in item["readings"]
    ]


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
         "readings_count": len(item["readings"]),
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


def practice_round(rng):
    item = rng.choice(practice_items())
    options = list(item["options"])
    rng.shuffle(options)
    parts = word_parts({"word": item["word"], "position": item["position"], "pinyin": "", "english": item["english"]})
    return {**item, "options": options,
            "before": parts["before"], "target": parts["target"], "after": parts["after"]}


def compact_chars(chars):
    """内嵌给 JS 的紧凑数据：无 JS 时详情由服务端渲染，选字后前端无刷新切换。"""
    return [
        {
            "char": item["char"],
            "readings": [
                {
                    "pinyin": reading["pinyin"],
                    "tone": reading["tone"],
                    "words": [
                        {
                            "word": word["word"],
                            "position": word["position"],
                            "pinyin": word["pinyin"],
                            "english": word.get("english", ""),
                        }
                        for word in reading["words"]
                    ],
                }
                for reading in item["readings"]
            ],
        }
        for item in chars
    ]


@never_cache
@require_safe
def page(request):
    data = load_polyphones()
    char = request.GET.get("char", "")
    if char and char not in char_index():
        char = ""
    if not char:
        char = data["chars"][0]["char"]
    seed = request.GET.get("q_seed", "")[:40]
    rng = random.Random(seed) if seed else random.SystemRandom()
    current = practice_round(rng)
    counts = bucket_counts(data["chars"])
    return render(request, "hanzi/polyphones.html", {
        "chars": grouped_chars(data["chars"]),
        "total": len(data["chars"]),
        "buckets": [
            {"bucket": "all", "label": "全部", "count": len(data["chars"])},
            {"bucket": "2", "label": "二读", "count": counts["2"]},
            {"bucket": "3", "label": "三读", "count": counts["3"]},
            {"bucket": "4+", "label": "四读及以上", "count": counts["4+"]},
        ],
        "compact": compact_chars(data["chars"]),
        "current_char": {**char_index()[char], "rows": reading_rows(char_index()[char])},
        "round": current,
        "next_href": "?char=" + char,
    })
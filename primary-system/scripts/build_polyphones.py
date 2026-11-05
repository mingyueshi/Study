#!/usr/bin/env python3
"""生成「多音字」数据：从 CC-CEDICT 按字位↔音节对齐推导一字多音（开发期工具，产物提交进仓库）。

来源：词库参考表 CedictRecord（CC-CEDICT，CC-BY-4.0，随基础包入库）。
取 2~4 字、音字数对齐的词条，过滤机构/地名类噪声词；某字出现 2+ 种
读音即收录，每种读音附 4~6 个组词（2 字词优先，含声调拼音、目标字
位置与英文释义首条）。数字调（zhong1）转声调符（zhōng），u: 视作 ü，
第 5 声为轻声、不标调。

用法：.venv/bin/python scripts/build_polyphones.py
产物：hanzi/polyphone_data/polyphones.json（运行时只读展示与选读音练习）。
"""

import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django  # noqa: E402

django.setup()

from lexicon.reference_models import CedictRecord  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "hanzi" / "polyphone_data" / "polyphones.json"

MIN_WORD, MAX_WORD = 2, 4
WORDS_PER_READING = 6
# 专有名词偏重的后缀与机构词；组词优先给孩子的日常词。
NOISE_PATTERN = re.compile(
    "县|省|市|镇|州|村|屯|乡|寨|党|军|学院|大学|中学|小学|公司|协会|主义|政策|委员会"
    "|政府|遗址|机场|车站|大桥|广场|公园|医院|银行|饭店|宾馆|酒店|大厦|大楼|基金|集团|乐队|乐团"
)
TONE_MARKS = {
    "a": "āáǎà", "e": "ēéěè", "i": "īíǐì",
    "o": "ōóǒò", "u": "ūúǔù", "ü": "ǖǘǚǜ",
}


def normalize_syllable(raw):
    return raw.strip().lower().replace("u:", "ü")


def marked_syllable(syllable):
    """zhong1 → zhōng；lü4 → lǜ；第 5 声（轻声）不标调，返回字母本身。"""
    match = re.fullmatch(r"([a-zü]+)([1-5])", normalize_syllable(syllable))
    if not match:
        return None
    letters, tone = match.group(1), int(match.group(2))
    if tone == 5:
        return letters
    position, vowel = -1, ""
    for pattern in ("a", "e", "ou"):
        index = letters.find(pattern)
        if index >= 0:
            position, vowel = index, pattern[0]
            break
    if position < 0:
        for index in range(len(letters) - 1, -1, -1):
            if letters[index] in TONE_MARKS:
                position, vowel = index, letters[index]
                break
    if position < 0:
        return letters
    return letters[:position] + TONE_MARKS[vowel][tone - 1] + letters[position + 1:]


def marked_pinyin(syllables):
    parts = [marked_syllable(syllable) for syllable in syllables]
    if any(part is None for part in parts):
        return None
    return " ".join(parts)


def collect():
    """char -> 归一读音 -> 词 -> {位置, 音节列表, 英文首条}。"""
    table = defaultdict(lambda: defaultdict(dict))
    for record in CedictRecord.objects.iterator(chunk_size=2000):
        word = record.simplified
        syllables = record.pinyin_numbered.split()
        if not MIN_WORD <= len(word) == len(syllables) <= MAX_WORD:
            continue
        if word.isascii() or NOISE_PATTERN.search(word):
            continue
        english = (record.definitions_en or [""])[0].strip()[:80]
        for position, (char, syllable) in enumerate(zip(word, syllables)):
            if not "\u4e00" <= char <= "\u9fff" or len(normalize_syllable(syllable)) < 2:
                continue
            table[char][normalize_syllable(syllable)].setdefault(word, {
                "position": position, "syllables": syllables, "english": english,
            })
    return table


def main():
    table = collect()
    chars = []
    for char in sorted(table):
        readings = []
        for raw, words in sorted(table[char].items()):
            pinyin = marked_syllable(raw)
            if pinyin is None:
                continue
            examples = []
            for word, item in sorted(words.items(), key=lambda pair: (len(pair[0]), pair[0])):
                word_pinyin = marked_pinyin(item["syllables"])
                if word_pinyin is None:
                    continue
                examples.append({
                    "word": word,
                    "position": item["position"],
                    "pinyin": word_pinyin,
                    "english": item["english"],
                })
                if len(examples) >= WORDS_PER_READING:
                    break
            if not examples:
                continue
            readings.append({
                "pinyin": pinyin,
                "tone": int(raw[-1]),
                "count": len(words),
                "words": examples,
            })
        readings.sort(key=lambda item: (-item["count"], item["pinyin"]))
        if len(readings) >= 2:
            chars.append({"char": char, "readings": readings})
    payload = {
        "schema_version": 1,
        "source": {
            "name": "CC-CEDICT",
            "license": "CC-BY-4.0",
            "version": CedictRecord.objects.order_by().values("version").first()["version"],
            "method": "2~4字词字位音节对齐；过滤机构地名类噪声词；每读音至多6个组词",
        },
        "chars": chars,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=1)
        file.write("\n")
    total_readings = sum(len(item["readings"]) for item in chars)
    print(f"多音字 {len(chars)} 个，读音 {total_readings} 种 → {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

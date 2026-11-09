"""看释义猜成语：从词库实时出题，释义补字，难度就是提示字数 0~3。

题池按质量过滤后全部来自当前生效词典记录（chinese-xinhua-idioms），
「常用」池再取场景课程里通过钉词校验的成语。服务端为每题签发标识、
提供提示并核对填字，首次判分写入学习记录。
"""
import json
import random
from uuid import uuid4

from django.core import signing
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import render
from django.urls import reverse
from django.utils.crypto import salted_hmac
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST, require_safe

from lexicon.views import record_payload

from .catalog import dictionary_records, load_curriculum, matches_pin, pinned_records, with_details
from .records import quiz_score, record_quiz_attempt

LEVELS = (3, 2, 1, 0)  # 提示字数：3 最易（只剩一个空），0 全猜
LEVEL_LABELS = {3: "入门 · 提示 3 字", 2: "普通 · 提示 2 字", 1: "进阶 · 提示 1 字", 0: "挑战 · 无提示"}
DISTRACTOR_COUNT = 8
MIN_DEFINITION = 8  # 释义至少这么长才算能出题
SOURCES = ("common", "all")
SALT = "idioms.quiz.question.v1"
MAX_AGE = 3600


def question_pool():
    """全量题池：{词头: 卡片}；四字成语、释义合格且不泄漏词头。"""
    pool = {}
    fields = dictionary_records().values_list(
        "pk", "binding__sense__entry__headword", "binding__sense__entry_id", "definition",
        "binding__sense__editorial_definition", "binding__pronunciation__is_reviewed",
        "binding__pronunciation__editorial_value", "pronunciation_value", "properties",
    )
    for record_id, word, entry, definition, edited, reviewed, edited_pinyin, pinyin, properties in fields.iterator():
        if word not in pool:
            card = _card(word, entry, edited.strip() or definition.strip(),
                         (edited_pinyin or pinyin) if reviewed else "", properties.get("example", ""), record_id)
            if card:
                pool[word] = card
    return pool


def _card(word, entry, definition, pinyin, example, record_id):
    if len(word) != 4 or len(definition) < MIN_DEFINITION or word in definition or "「" in definition:
        return None
    if isinstance(example, str):
        example = example.strip()
    return {"headword": word, "entry_id": str(entry), "record_id": str(record_id), "definition": definition,
            "pinyin": pinyin if pinyin.strip() not in ("", "无") else "",
            "example": example if example != "无" else ""}


def char_bank(pool=None):
    """干扰字库：题池词头里出现过的所有单字。"""
    return tuple(sorted({char for word in (question_pool() if pool is None else pool) for char in word}))


def _record_card(record):
    payload = record_payload(record)
    return _card(record.binding.sense.entry.headword, record.binding.sense.entry_id, payload["definition"],
                 (payload["pronunciation"] or {}).get("value", ""),
                 payload["properties"].get("example", ""), record.pk)


def common_pool():
    """场景课程的常用成语题池（逐条过钉词校验，漂移即弃用）。"""
    curriculum = load_curriculum()
    records = pinned_records(pin["binding_id"] for pin in curriculum["idioms"])
    items = []
    for pin in curriculum["idioms"]:
        record = records.get(pin["binding_id"])
        if record and matches_pin(record, pin):
            item = _record_card(record)
            if item:
                items.append(item)
    return tuple(items)


def build_round(rng, items, level, *, bank=None):
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
    bank = char_bank() if bank is None else bank
    distractors = [char for char in bank if char not in keys]
    keys.update(rng.sample(distractors, min(DISTRACTOR_COUNT, len(distractors))))
    ordered = sorted(keys)
    rng.shuffle(ordered)
    return {**item, "slots": slots, "keys": ordered, "level": level}


def _owner(request):
    if request.user.is_authenticated:
        return f"user:{request.user.pk}"
    # 游客可直接浏览。用同一浏览器的 CSRF 密钥绑定题目，首次作答才创建会话。
    get_token(request)
    return salted_hmac(SALT, request.META["CSRF_COOKIE"], algorithm="sha256").hexdigest()


def _card_fingerprint(card):
    return salted_hmac(SALT + ".card", card["headword"] + "\0" + card["definition"]).hexdigest()


@ensure_csrf_cookie
@never_cache
@require_safe
def page(request):
    raw_level = request.GET.get("level", "")
    level = int(raw_level) if raw_level in ("0", "1", "2", "3") else 3
    source = request.GET.get("source", "")
    if source not in SOURCES:
        source = "common"
    seed = request.GET.get("seed", "")[:40]
    rng = random.Random(seed) if seed else random.SystemRandom()
    pool = question_pool()
    common = common_pool()
    items = common if source == "common" and common else tuple(pool.values())
    current = build_round(rng, items, level, bank=char_bank(pool)) if items else None
    token = None
    if current:
        token = signing.dumps({
            "attempt": uuid4().hex, "owner": _owner(request), "record": current["record_id"],
            "fingerprint": _card_fingerprint(current), "source": source, "hints": [],
            "blanks": [index for index, slot in enumerate(current["slots"]) if not slot["shown"]],
        }, salt=SALT)
    query = f"level={level}&source={source}"
    sizes = {"common": len(common), "all": len(pool)}
    return render(request, "idioms/quiz.html", {
        "round": current,
        "token": token,
        "score": quiz_score(request) if current else None,
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
    """根据服务端签发的题目提示或判分，首次检查才记成绩。"""
    if request.content_type != "application/json" or len(request.body) > 2000:
        return JsonResponse({"error": "请求格式不正确。"}, status=400)
    try:
        data = json.loads(request.body)
    except (ValueError, UnicodeError, RecursionError):
        return JsonResponse({"error": "请求格式不正确。"}, status=400)
    if not isinstance(data, dict) or not isinstance(data.get("token"), str):
        return JsonResponse({"error": "请求格式不正确。"}, status=400)
    try:
        state = signing.loads(data["token"], salt=SALT, max_age=MAX_AGE)
    except signing.SignatureExpired:
        return JsonResponse({"error": "这道题已过期，请换一题。"}, status=409)
    except signing.BadSignature:
        return JsonResponse({"error": "题目标识不正确，请换一题。"}, status=400)
    if state["owner"] != _owner(request):
        return JsonResponse({"error": "登录状态变了，请换一题。"}, status=409)

    record = with_details(dictionary_records().filter(pk=state["record"])).first()
    card = _record_card(record) if record else None
    if not card or _card_fingerprint(card) != state["fingerprint"]:
        return JsonResponse({"error": "这道题的内容已更新，请换一题。"}, status=409)
    blanks = state["blanks"]
    if data.get("action") == "hint":
        position = data.get("position")
        if type(position) is not int or position not in blanks:
            return JsonResponse({"error": "请选择要提示的空格。"}, status=400)
        if position not in state["hints"]:
            state["hints"].append(position)
        return JsonResponse({
            "char": card["headword"][position],
            "token": signing.dumps(state, salt=SALT),
        })

    answer = data.get("answer")
    if data.get("action") != "answer" or not isinstance(answer, str) or len(answer) != len(blanks):
        return JsonResponse({"error": "请填完空格再检查。"}, status=400)
    marks = [char == card["headword"][position] for char, position in zip(answer, blanks)]
    correct = all(marks)
    attempt = record_quiz_attempt(request, state["attempt"], correct, {
        "headword": card["headword"], "level": 4 - len(blanks),
        "source": state["source"], "used_hint": bool(state["hints"]),
    }, initial_guest_key=state["owner"])
    if attempt is None:
        return JsonResponse({"error": "这道题已在另一个会话作答，请换一题。"}, status=409)
    result = {"correct": correct, "marks": marks, "first_correct": bool(attempt.correct),
              "score": quiz_score(request)}
    if correct:
        result["card"] = {key: card[key] for key in ("headword", "pinyin", "definition", "example")}
        result["card"]["url"] = reverse("idiom-entry", args=[card["entry_id"]])
    from incentives.services import take_awards
    rewards = take_awards(request)
    if rewards:
        result["rewards"] = rewards
    return JsonResponse(result)

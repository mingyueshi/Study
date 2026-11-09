"""成语表情猜猜看：emoji 四选一猜谜（飞花令式签名页状态）。

emoji 映射是编辑内容（``data/emoji.json``，AI 辅助生成、人工核对）；成语的
拼音与释义实时来自词库生效记录，逐条经 ``matches_pin`` 校验，漂移降级。
正确答案不入签名状态——选项由服务端在每次 ``question`` 时实时生成。
一局猜满由服务端判定，完成时落一条学习记录（``records.record_play``）。
"""
import json
import secrets
from dataclasses import dataclass
from pathlib import Path
import re

from django.core import signing
from django.core.exceptions import ImproperlyConfigured
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from .catalog import SOURCE_CODE, matches_pin, pinned_records
from .models import PlayRecord
from .records import record_play

ENTRIES_PATH = Path(__file__).resolve().parent / "data" / "emoji.json"
ROUND_SIZE = 8
DISTRACTOR_COUNT = 3
MAX_AGE = 3600
SALT = "idioms.emoji.page.v1"


class QuizError(ValueError):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


def load_entries():
    with ENTRIES_PATH.open(encoding="utf-8") as file:
        curriculum = json.load(file)
    validate(curriculum)
    return curriculum


def validate(curriculum):
    if curriculum.get("schema_version") != 1 or curriculum.get("source_code") != SOURCE_CODE:
        raise ImproperlyConfigured("Unsupported emoji quiz curriculum.")
    headwords = set()
    for entry in curriculum.get("entries", []):
        headword = entry.get("headword", "")
        if not headword:
            raise ImproperlyConfigured("条目缺 headword。")
        if headword in headwords:
            raise ImproperlyConfigured(f"成语重复：{headword}")
        headwords.add(headword)
        if not str(entry.get("emoji") or "").strip():
            raise ImproperlyConfigured(f"{headword} 缺 emoji。")
        if not str(entry.get("hint") or "").strip():
            raise ImproperlyConfigured(f"{headword} 缺类别提示。")
        for field in ("binding_id", "entry_id", "evidence_id", "lexical_hash", "editorial_snapshot"):
            if not entry.get(field):
                raise ImproperlyConfigured(f"{headword} 缺钉词字段 {field}。")
    if len(headwords) < 40:
        raise ImproperlyConfigured("表情题库至少需要 40 个成语。")


def quiz_pool():
    """题库：钉词校验通过的条目 + 词典 payload（拼音/释义/entry 链接）。"""
    curriculum = load_entries()
    records = pinned_records(entry["binding_id"] for entry in curriculum["entries"])
    pool = []
    for entry in curriculum["entries"]:
        record = records.get(entry["binding_id"])
        valid = matches_pin(record, {**entry, "source_code": SOURCE_CODE})
        pool.append({**entry, "record": record, "valid": valid})
    return pool


def digest(value):
    import hashlib

    return hashlib.sha256(
        json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()


def fresh(pool, size=ROUND_SIZE):
    valid = [entry for entry in pool if entry["valid"]]
    size = min(size, len(valid))
    if size < 2:
        raise QuizError("表情题库正在核对，暂时开不了新局。", 503)
    nonce = secrets.token_hex(16)
    picked = sorted(valid, key=lambda entry: digest([nonce, entry["headword"]]))[:size]
    return {
        "v": 1, "nonce": nonce, "size": size,
        "ids": [entry["headword"] for entry in picked],
        "answers": [],
    }


def restore(pool, token):
    if not isinstance(token, str) or not 1 <= len(token) <= 8000:
        raise QuizError("这一局的信息不完整，请重新开始。", 409)
    try:
        state = signing.loads(token, salt=SALT, max_age=MAX_AGE)
    except signing.SignatureExpired:
        raise QuizError("这一局已过期，请重新开始。", 409) from None
    except (signing.BadSignature, ValueError, TypeError, UnicodeError):
        raise QuizError("这一局的信息无法核对，请重新开始。", 409) from None
    if (
        not isinstance(state, dict)
        or state.get("v") != 1
        or state.get("nonce", "") == ""
        or not re.fullmatch(r"[0-9a-f]{32}", str(state.get("nonce") or ""))
        or not isinstance(state.get("ids"), list)
        or len(state["ids"]) != state.get("size", 0)
        or not isinstance(state.get("answers"), list)
        or len(state["answers"]) > state["size"]
    ):
        raise QuizError("题库或本局状态已变化，请重新开始。", 409)
    by_headword = {entry["headword"]: entry for entry in pool if entry["valid"]}
    for answer in state["answers"]:
        if (
            not isinstance(answer, dict)
            or answer.get("headword") not in by_headword
            or answer.get("outcome") not in ("correct", "wrong", "revealed")
        ):
            raise QuizError("本局作答需要重新核对，请重新开始。", 409)
    if [answer["headword"] for answer in state["answers"]] != state["ids"][: len(state["answers"])]:
        raise QuizError("本局题序已变化，请重新开始。", 409)
    return state, by_headword


def options_for(pool, headword, nonce, index):
    """当前题的四选一：正确项 + 同字数干扰项（nonce 抖动，答案不留痕）。

    题库收缩（测试夹具）时允许少于三个干扰项，正式题库始终四选一。
    """
    entry = next(item for item in pool if item["headword"] == headword and item["valid"])
    same_length = [item for item in pool if item["valid"] and item["headword"] != headword
                   and len(item["headword"]) == len(headword)]
    ordered = sorted(same_length, key=lambda item: digest([nonce, index, item["headword"]]))
    distractors = [item["headword"] for item in ordered[:DISTRACTOR_COUNT]]
    if len(distractors) < DISTRACTOR_COUNT:
        fallback = [item["headword"] for item in pool if item["valid"]
                    and item["headword"] != headword and item["headword"] not in distractors]
        distractors.extend(fallback[:DISTRACTOR_COUNT - len(distractors)])
    seed = int(digest([nonce, index])[:8], 16)
    position = seed % (len(distractors) + 1)
    options = distractors[:position] + [headword] + distractors[position:]
    return [
        {"key": digest([nonce, index, text])[:16], "text": text}
        for text in options
    ], seed


def current_question(pool, state, by_headword, index):
    headword = state["ids"][index]
    options, seed = options_for(pool, headword, state["nonce"], index)
    entry = by_headword[headword]
    reading = record_payload_for(entry["record"]) if entry["valid"] else None
    return {
        "index": index, "size": state["size"], "emoji": entry["emoji"],
        "hint": entry["hint"], "options": options,
        "answered": index < len(state["answers"]),
        "seed": f"{seed:08x}",
    }


def record_payload_for(record):
    from lexicon.views import record_payload

    return record_payload(record)


def public_card(entry, record, outcome=None, chosen=None):
    payload = {
        "headword": entry["headword"], "emoji": entry["emoji"], "hint": entry["hint"],
        "pinyin": "", "definition": "", "entry_id": "",
        "outcome": outcome, "chosen": chosen,
    }
    if record is not None:
        payload["entry_id"] = str(record.binding.sense.entry_id)
        pron = record.binding.pronunciation
        payload["pinyin"] = (
            (pron.editorial_value or record.pronunciation_value)
            if pron and pron.is_reviewed else ""
        )
        payload["definition"] = record_payload_for(record).get("definition", "")
    return payload


def summary(pool, state, by_headword, message=""):
    rows = []
    for answer in state["answers"]:
        entry = by_headword[answer["headword"]]
        rows.append(public_card(entry, entry["record"], answer["outcome"], answer.get("chosen")))
    correct = sum(row["outcome"] == "correct" for row in rows)
    return {
        "available": True,
        "token": signing.dumps(state, salt=SALT, compress=True),
        "size": state["size"], "index": len(state["answers"]),
        "answers": rows, "correct": correct,
        "revealed": sum(row["outcome"] == "revealed" for row in rows),
        "finished": len(state["answers"]) >= state["size"],
        "message": message,
    }


def page_state(pool, state, by_headword, message=""):
    result = summary(pool, state, by_headword, message)
    result["current"] = (
        None if result["finished"]
        else current_question(pool, state, by_headword, len(state["answers"]))
    )
    return result


def act(pool, state, by_headword, action, data):
    index = len(state["answers"])
    if index >= state["size"]:
        return summary(pool, state, by_headword, message="这一局已经猜完，再来一局吧。")
    entry = by_headword[state["ids"][index]]
    if action == "answer":
        chosen = data.get("chosen")
        if not isinstance(chosen, str) or not chosen.strip():
            raise QuizError("先选一个成语。")
        correct = bool(entry["valid"]) and chosen.strip() == entry["headword"]
        outcome = "correct" if correct else "wrong"
        state["answers"].append(
            {"headword": entry["headword"], "outcome": outcome, "chosen": chosen.strip()}
        )
        result = summary(
            pool, state, by_headword,
            message="猜对啦！就是这么画。" if correct
            else f"正确答案是「{entry['headword']}」，记住它。",
        )
        result["card"] = public_card(entry, entry["record"], outcome, chosen.strip())
        result["current"] = (
            None if result["finished"]
            else current_question(pool, state, by_headword, index + 1)
        )
        return result
    if action == "reveal":
        state["answers"].append(
            {"headword": entry["headword"], "outcome": "revealed", "chosen": ""}
        )
        result = summary(
            pool, state, by_headword,
            message=f"答案是「{entry['headword']}」，下次一定猜中。",
        )
        result["card"] = public_card(entry, entry["record"], "revealed")
        result["current"] = (
            None if result["finished"]
            else current_question(pool, state, by_headword, index + 1)
        )
        return result
    raise QuizError("暂不支持这个操作。")


@ensure_csrf_cookie
@never_cache
@require_GET
def page(request):
    try:
        pool = quiz_pool()
        context = {"total": sum(1 for entry in pool if entry["valid"])}
        state = fresh(pool)
        context.update(page_state(pool, state, {e["headword"]: e for e in pool if e["valid"]}))
    except QuizError as error:
        context = {"available": False, "message": str(error), "total": context["total"]}
    return render(request, "idioms/emoji.html", {"state": context})


@never_cache
@require_POST
def action(request):
    try:
        if request.content_type != "application/json" or len(request.body) > 12000:
            raise QuizError("请求格式不正确，请刷新页面后再试。")
        try:
            data = json.loads(request.body)
        except (ValueError, UnicodeError, RecursionError):
            raise QuizError("请求格式不正确。") from None
        if not isinstance(data, dict) or not isinstance(data.get("action"), str):
            raise QuizError("请求格式不正确。")
        pool = quiz_pool()
        if data["action"] == "new":
            state = fresh(pool)
            result = page_state(pool, state, {e["headword"]: e for e in pool if e["valid"]})
        else:
            if data["action"] not in ("question", "answer", "reveal"):
                raise QuizError("暂不支持这个操作。")
            state, by_headword = restore(pool, data.get("token"))
            if data["action"] == "question":
                index = data.get("index")
                if type(index) is not int or not 0 <= index < state["size"]:
                    raise QuizError("题目序号不正确，请刷新页面。")
                if index != len(state["answers"]):
                    raise QuizError("这一题已经作答，请继续下一题。", 409)
                result = {"available": True, "current": current_question(pool, state, by_headword, index)}
            else:
                result = act(pool, state, by_headword, data["action"], data)
                if result.get("finished"):
                    record_play(request, game=PlayRecord.Game.EMOJI, size=result["size"],
                                correct=result["correct"], extra={"revealed": result["revealed"]})
        return JsonResponse(result, json_dumps_params={"ensure_ascii": False})
    except QuizError as error:
        return JsonResponse(
            {"error": str(error), "restart_required": error.status == 409},
            status=error.status,
        )

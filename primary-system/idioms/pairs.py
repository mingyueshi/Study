"""成语近义/反义配对：连线配对玩法（签名页状态）。

配对关系是编辑内容（``data/pairs.json``，AI 辅助起草、人工核对），两侧成语
逐条经 ``matches_pin`` 校验词库生效记录；释义与拼音实时取自词库。正确配对
关系必须经服务端判定（``match`` 动作），前端不留答案。一局配满由服务端
判定，完成时落一条学习记录（``records.record_play``）。
"""
import json
import secrets
from pathlib import Path
import re

from django.core import signing
from django.core.exceptions import ImproperlyConfigured
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from .models import PlayRecord
from .records import record_play


@ensure_csrf_cookie
@never_cache
@require_GET
def page(request):
    try:
        pool = pairs_pool()
        context = {"total": sum(1 for pair in pool if pair["valid"])}
        state = fresh(pool)
        context.update(page_state(pool, state, {pair["id"]: pair for pair in pool if pair["valid"]}))
    except PairError as error:
        context = {"available": False, "message": str(error), "total": context["total"]}
    return render(request, "idioms/pairs.html", {"state": context})


@never_cache
@require_POST
def action(request):
    try:
        if request.content_type != "application/json" or len(request.body) > 12000:
            raise PairError("请求格式不正确，请刷新页面后再试。")
        try:
            data = json.loads(request.body)
        except (ValueError, UnicodeError, RecursionError):
            raise PairError("请求格式不正确。") from None
        if not isinstance(data, dict) or not isinstance(data.get("action"), str):
            raise PairError("请求格式不正确。")
        pool = pairs_pool()
        if data["action"] == "new":
            state = fresh(pool)
            result = page_state(pool, state, {pair["id"]: pair for pair in pool if pair["valid"]})
        else:
            if data["action"] not in ("match",):
                raise PairError("暂不支持这个操作。")
            state, by_id = restore(pool, data.get("token"))
            result = act(pool, state, by_id, data)
            if result.get("finished"):
                record_play(request, game=PlayRecord.Game.PAIRS, size=result["size"],
                            correct=result["matched"], extra={"attempts": result["attempts"]})
        return JsonResponse(result, json_dumps_params={"ensure_ascii": False})
    except PairError as error:
        return JsonResponse(
            {"error": str(error), "restart_required": error.status == 409},
            status=error.status,
        )

from .catalog import SOURCE_CODE, matches_pin, pinned_records

PAIRS_PATH = Path(__file__).resolve().parent / "data" / "pairs.json"
ROUND_SIZE = 5
MAX_AGE = 3600
SALT = "idioms.pairs.page.v1"
RELATION_LABELS = {"near": "近义", "opp": "反义"}


class PairError(ValueError):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


def load_pairs():
    with PAIRS_PATH.open(encoding="utf-8") as file:
        curriculum = json.load(file)
    validate(curriculum)
    return curriculum


def validate(curriculum):
    if curriculum.get("schema_version") != 1 or curriculum.get("source_code") != SOURCE_CODE:
        raise ImproperlyConfigured("Unsupported idiom pairs curriculum.")
    seen_pairs, headword_uses = set(), {}
    for pair in curriculum.get("pairs", []):
        relation = pair.get("relation")
        if relation not in RELATION_LABELS:
            raise ImproperlyConfigured(f"配对关系不合法：{relation}")
        a, b = pair.get("headword_a"), pair.get("headword_b")
        if not a or not b or a == b:
            raise ImproperlyConfigured(f"配对两侧词头缺失或相同：{a}/{b}")
        key = tuple(sorted((a, b)))
        if key in seen_pairs:
            raise ImproperlyConfigured(f"配对重复：{a}/{b}")
        seen_pairs.add(key)
        for side in ("a", "b"):
            headword = pair.get(f"headword_{side}")
            if not headword:
                raise ImproperlyConfigured(f"{a}/{b} 缺 {side} 侧词头。")
            headword_uses.setdefault(headword, []).append(pair["id"])
            for field in ("entry_id", "binding_id", "evidence_id", "lexical_hash", "editorial_snapshot"):
                if not pair.get(f"{side}_{field}"):
                    raise ImproperlyConfigured(f"{headword} 缺钉词字段 {side}_{field}。")
    if len(seen_pairs) < 30:
        raise ImproperlyConfigured("配对题库至少需要 30 对。")
    # 单一成语可以出现在多个配对里，但同局抽取需词头不相交（抽局时处理）。


def pairs_pool():
    """双侧钉词校验通过的配对题库；漂移的配对不出题。"""
    curriculum = load_pairs()
    records = pinned_records(pair[f"{side}_binding_id"] for pair in curriculum["pairs"] for side in ("a", "b"))

    def side_pin(pair, side):
        pin = {k[len(side) + 1:]: v for k, v in pair.items() if k.startswith(f"{side}_")}
        pin["source_code"] = SOURCE_CODE
        pin["headword"] = pair[f"headword_{side}"]
        return pin

    pool = []
    for pair in curriculum["pairs"]:
        record_a = records.get(pair["a_binding_id"])
        record_b = records.get(pair["b_binding_id"])
        valid = matches_pin(record_a, side_pin(pair, "a")) and matches_pin(record_b, side_pin(pair, "b"))
        pool.append({**pair, "record_a": record_a, "record_b": record_b, "valid": valid})
    return pool


def fresh(pool, size=ROUND_SIZE):
    valid = [pair for pair in pool if pair["valid"]]
    if len(valid) < size:
        raise PairError("配对题库正在核对，暂时开不了新局。", 503)
    nonce = secrets.token_hex(16)
    # 同局配对必须词头不相交：按 nonce 随机排序后贪心抽取。
    ordered = sorted(valid, key=lambda pair: digest([nonce, pair["id"]]))
    chosen, used = [], set()
    for pair in ordered:
        if size - len(chosen) > len(ordered) - ordered.index(pair):
            break
        headwords = {pair["headword_a"], pair["headword_b"]}
        if headwords & used:
            continue
        used |= headwords
        chosen.append(pair["id"])
        if len(chosen) == size:
            break
    if len(chosen) < size:
        raise PairError("这一局的配对暂时凑不齐，请重新开始。", 503)
    return {"v": 1, "nonce": nonce, "pair_ids": chosen, "matches": [], "attempts": 0}


def digest(value):
    import hashlib

    return hashlib.sha256(
        json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()


def restore(pool, token):
    if not isinstance(token, str) or not 1 <= len(token) <= 8000:
        raise PairError("这一局的信息不完整，请重新开始。", 409)
    try:
        state = signing.loads(token, salt=SALT, max_age=MAX_AGE)
    except signing.SignatureExpired:
        raise PairError("这一局已过期，请重新开始。", 409) from None
    except (signing.BadSignature, ValueError, TypeError, UnicodeError):
        raise PairError("这一局的信息无法核对，请重新开始。", 409) from None
    by_id = {pair["id"]: pair for pair in pool if pair["valid"]}
    if (
        not isinstance(state, dict)
        or state.get("v") != 1
        or not re.fullmatch(r"[0-9a-f]{32}", str(state.get("nonce") or ""))
        or not isinstance(state.get("pair_ids"), list)
        or not state["pair_ids"]
        or not all(pair_id in by_id for pair_id in state["pair_ids"])
        or len(set(state["pair_ids"])) != len(state["pair_ids"])
        or not isinstance(state.get("matches"), list)
        or len(state["matches"]) > len(state["pair_ids"])
        or not isinstance(state.get("attempts"), int)
        or state["attempts"] < 0
    ):
        raise PairError("题库或本局状态已变化，请重新开始。", 409)
    if any(
        not isinstance(match, dict)
        or match.get("pair_id") not in by_id
        or match.get("left") not in (by_id[match["pair_id"]]["headword_a"], by_id[match["pair_id"]]["headword_b"])
        or match.get("right") not in (by_id[match["pair_id"]]["headword_a"], by_id[match["pair_id"]]["headword_b"])
        or match.get("left") == match.get("right")
        for match in state["matches"]
    ):
        raise PairError("本局配对需要重新核对，请重新开始。", 409)
    return state, by_id


def round_view(pool, state, by_id):
    """当前局的双栏词卡：左右各一张来自同一对的词头，按 nonce 洗牌。"""
    matched_ids = {match["pair_id"] for match in state["matches"]}
    left, right = [], []
    for pair_id in state["pair_ids"]:
        pair = by_id[pair_id]
        pick_left_a = int(digest([state["nonce"], pair_id])[:8], 16) % 2 == 0
        first, second = (pair["headword_a"], pair["headword_b"]) if pick_left_a else (pair["headword_b"], pair["headword_a"])
        if pair_id not in matched_ids:
            left.append(first)
            right.append(second)
    return {
        "left": sorted(left, key=lambda w: digest([state["nonce"], "left", w])),
        "right": sorted(right, key=lambda w: digest([state["nonce"], "right", w])),
    }


def relation_card(pair):
    def card(side, record):
        pron = record.binding.pronunciation if record else None
        return {
            "headword": pair[f"headword_{side}"],
            "pinyin": ((pron.editorial_value or record.pronunciation_value) if pron and pron.is_reviewed else ""),
            "definition": "", "entry_id": "",
        }

    from lexicon.views import record_payload

    card_a, card_b = card("a", pair["record_a"]), card("b", pair["record_b"])
    for card_side, record in ((card_a, pair["record_a"]), (card_b, pair["record_b"])):
        if record is not None:
            card_side["definition"] = record_payload_for(record).get("definition", "")
            card_side["entry_id"] = str(record.binding.sense.entry_id)
    return card_a, card_b


def record_payload_for(record):
    from lexicon.views import record_payload

    return record_payload(record)


def summary(pool, state, by_id, message=""):
    rows = []
    for match in state["matches"]:
        pair = by_id[match["pair_id"]]
        card_a, card_b = relation_card(pair)
        rows.append({
            "pair_id": match["pair_id"], "relation": pair["relation"],
            "relation_label": RELATION_LABELS[pair["relation"]],
            "a": card_a, "b": card_b, "attempts": match["attempts"],
        })
    matched = len(state["matches"])
    return {
        "available": True,
        "token": signing.dumps(state, salt=SALT, compress=True),
        "size": len(state["pair_ids"]), "matched": matched,
        "attempts": state["attempts"],
        "finished": matched >= len(state["pair_ids"]),
        "rows": rows,
        "tiles": round_view(pool, state, by_id) if matched < len(state["pair_ids"]) else {"left": [], "right": []},
        "message": message,
    }


def act(pool, state, by_id, data):
    left = data.get("left")
    right = data.get("right")
    if not isinstance(left, str) or not isinstance(right, str) or not left.strip() or not right.strip():
        raise PairError("先从两边各选一个成语。")
    left, right = left.strip(), right.strip()
    if left == right:
        raise PairError("两边选了同一个成语，换一个试试。")
    matched_ids = {match["pair_id"] for match in state["matches"]}
    open_pairs = [by_id[pair_id] for pair_id in state["pair_ids"] if pair_id not in matched_ids]
    hit = next((pair for pair in open_pairs if {left, right} == {pair["headword_a"], pair["headword_b"]}), None)
    state["attempts"] += 1
    if hit is None:
        return summary(pool, state, by_id, message="这两个不是一对，再想想。")
    state["matches"].append({
        "pair_id": hit["id"], "left": left, "right": right,
        "attempts": state["attempts"],
    })
    card_a, card_b = relation_card(hit)
    result = summary(pool, state, by_id, message=f"配对成功！它们是{RELATION_LABELS[hit['relation']]}。")
    result["matched_pair"] = {
        "relation": hit["relation"], "relation_label": RELATION_LABELS[hit["relation"]],
        "a": card_a, "b": card_b,
    }
    return result


def page_state(pool, state, by_id, message=""):
    return summary(pool, state, by_id, message)

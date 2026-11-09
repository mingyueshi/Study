"""不规则复数专题：浏览与练习。数据见 plural_data/README.md。

「给单数选复数」练习判分在前端展示，但每题由 ``report`` 上报一次，服务端
按词表的确定性选项集复核并重算对错后落一条作答记录（``records``，对错都
记）。游客沿用会话键双轨，键只在 POST 写入路径生成——页面 GET 保持零写入、
零会话。
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

DATA_PATH = Path(__file__).resolve().parent / "plural_data" / "plurals.json"
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
        raise ImproperlyConfigured("Unsupported plural dataset.")
    groups = data.get("groups", [])
    items = data.get("items", [])
    if len(groups) < 4 or len(items) < 60:
        raise ImproperlyConfigured("不规则复数数据不足。")
    group_codes = {group.get("code") for group in groups}
    seen = set()
    core = 0
    for item in items:
        singular, plural = item.get("singular", ""), item.get("plural", "")
        if not singular or not plural or singular in seen:
            raise ImproperlyConfigured("不规则复数数据异常：" + repr(singular))
        seen.add(singular)
        if item.get("group") not in group_codes or item.get("tier") not in TIERS:
            raise ImproperlyConfigured(f"{singular} 的分组或层级不合法。")
        if item["tier"] == "core":
            core += 1
        for text in _walk_strings(item):
            if '"' in text or "\n" in text or "\r" in text:
                raise ImproperlyConfigured(f"{singular} 的文本出现英文双引号或裸换行。")
            if re.search(r"<[a-zA-Z]", text):
                raise ImproperlyConfigured(f"{singular} 的文本出现 HTML 标签形态。")
    if core < 20:
        raise ImproperlyConfigured("核心练习词不足 20 个。")


@lru_cache(maxsize=1)
def item_index():
    return {item["singular"]: item for item in load_data()["items"]}


def option_forms(item, items):
    """确定性选项集：正确复数 + 机械规则误推形态（典型错误）+ 一个他词复数。"""
    singular, plural = item["singular"], item["plural"]
    forms = {plural, singular + "s", singular + "es"}
    others = sorted(other["plural"] for other in items
                    if other["singular"] != singular and other["plural"] != plural
                    and other["plural"] not in forms)
    if others:
        forms.add(others[int(hashlib.md5(singular.encode()).hexdigest(), 16) % len(others)])
    return sorted(forms)


@lru_cache(maxsize=1)
def practice_items():
    """练习题池：core 层每词一条，选项集加载期确定，换一题只换展示顺序。"""
    items = load_data()["items"]
    return tuple({"singular": item["singular"], "plural": item["plural"], "zh": item.get("zh", ""),
                  "options": option_forms(item, items)}
                 for item in items if item["tier"] == "core")


@lru_cache(maxsize=1)
def practice_pool():
    return {item["singular"] for item in practice_items()}


def practice_round(rng):
    item = rng.choice(practice_items())
    options = list(item["options"])
    rng.shuffle(options)
    return {**item, "options": options}


def _ipa_index(items):
    """词头 -> 已核对 IPA（primary-english/primary-words 生效记录）。

    与 catalog.english_link_pronunciations 同源同口径：运行时批量查词库，
    缺失的如实留空，不用数据里缓存的历史音标冒充。
    """
    headwords = {word for item in items for word in (item["singular"], item["plural"])}
    if not headwords:
        return {}
    from lexicon.models import active_records
    rows = active_records().filter(
        release__source__code__in=('primary-english', 'primary-words'),
        headword__in=headwords,
    ).select_related('binding__pronunciation')
    index = {}
    for record in rows:
        pron = record.binding.pronunciation
        if pron is None or not pron.is_reviewed:
            continue
        reading = (pron.editorial_value or record.pronunciation_value or '').strip()
        if reading:
            index.setdefault(record.headword, reading)
    return index


def card_rows(items, ipa=None):
    ipa = ipa or {}
    return [{"singular": item["singular"], "plural": item["plural"], "zh": item.get("zh", ""),
             "emoji": item.get("emoji", ""), "tier": item["tier"], "note": item.get("note", ""),
             "group": item["group"],
             "singular_ipa": ipa.get(item["singular"], ""), "plural_ipa": ipa.get(item["plural"], "")}
            for item in items]


@ensure_csrf_cookie
@never_cache
@require_safe
def page(request):
    data = load_data()
    items = data["items"]
    groups = data["groups"]
    seed = request.GET.get("q_seed", "")[:40]
    rng = random.Random(seed) if seed else random.SystemRandom()
    ipa = _ipa_index(items)
    group_rows = []
    for group in groups:
        rows = card_rows([item for item in items if item["group"] == group["code"]], ipa)
        group_rows.append({**group, "rows": rows, "count": len(rows)})
    round_item = practice_round(rng)
    return render(request, "plurals/index.html", {
        "groups": group_rows,
        "total": len(items),
        "core_count": sum(1 for item in items if item["tier"] == "core"),
        "round": {**round_item, "singular_ipa": ipa.get(round_item["singular"], "")},
        "next_href": "?q_seed=" + secrets.token_hex(4) + "#practice",
    })


@never_cache
@require_POST
def report(request):
    """逐题上报练习结果：服务端按确定性选项集复核并重算对错，不信任前端结论。"""
    from .models import PluralAnswer
    from .records import owner_filter

    if request.content_type != "application/json" or len(request.body) > 2000:
        return JsonResponse({"error": "请求格式不正确。"}, status=400)
    try:
        data = json.loads(request.body)
    except (ValueError, UnicodeError, RecursionError):
        return JsonResponse({"error": "请求格式不正确。"}, status=400)
    singular, chosen, answer = (data.get(key) for key in ("singular", "chosen", "answer"))
    if not isinstance(data, dict) or not all(isinstance(value, str) for value in (singular, chosen, answer)):
        return JsonResponse({"error": "请求格式不正确。"}, status=400)
    pool_options = {item["singular"]: set(item["options"]) for item in practice_items()}
    if singular not in practice_pool() or chosen not in pool_options[singular] \
            or answer not in pool_options[singular]:
        return JsonResponse({"error": "这道题不在练习范围，请刷新页面后再试。"}, status=400)
    answer = PluralAnswer.objects.create(
        singular=singular, chosen=chosen[:40], answer=answer,
        correct=chosen == answer, **owner_filter(request),
    )
    if request.user.is_authenticated and answer.correct:
        from incentives.services import record_event
        record_event(request.user, "plural_correct", request=request)
    from incentives.services import take_awards
    rewards = take_awards(request)
    return JsonResponse({"ok": True} | ({"rewards": rewards} if rewards else {}))

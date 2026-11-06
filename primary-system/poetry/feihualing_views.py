"""飞花令页面与动作端点。完成判定在服务端（``feihualing.act``）：集满五句
或令字语料耗尽的那一刻落一条完成记录（``records``，每局恰好一次）；游客
沿用会话键双轨，键只在 POST 写入路径生成，页面 GET 仍零写入。"""

import json
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST
from . import feihualing as game
from .models import FeihualingRound
from .records import owner_filter


@ensure_csrf_cookie
@never_cache
@require_GET
def page(request):
    try:
        with game.load_corpus() as corpus:
            enabled = [row["char"] for row in corpus.keywords() if row["enabled"]]
            if not enabled:
                raise game.ExerciseError(
                    "常见诗句正在核对，暂时没有足够的可用诗句。", 503
                )
            keyword = "月" if "月" in enabled else enabled[0]
            state = game.payload(corpus, game.fresh(corpus, keyword))
    except game.ExerciseError as error:
        state = {"available": False, "message": str(error), "keywords": []}
    return render(request, "poetry/feihualing.html", {"state": state})


@never_cache
@require_POST
def action(request):
    try:
        if request.content_type != "application/json" or len(request.body) > 12000:
            raise game.ExerciseError("请求格式不正确，请刷新页面后再试。")
        try:
            data = json.loads(request.body)
        except (ValueError, UnicodeError, RecursionError):
            raise game.ExerciseError("请求格式不正确。") from None
        if not isinstance(data, dict) or not isinstance(data.get("action"), str):
            raise game.ExerciseError("请求格式不正确。")
        if data["action"] not in ("new", "answer", "hint", "reveal"):
            raise game.ExerciseError("暂不支持这个操作。")
        # Validate untrusted input even for completed rounds.
        if data["action"] == "answer" and (
            not isinstance(data.get("answer"), str)
            or not 1 <= len(data["answer"]) <= 100
        ):
            raise game.ExerciseError("请输入一至一百字的诗句。")
        with game.load_corpus() as corpus:
            if data["action"] == "new":
                result = game.payload(corpus, game.fresh(corpus, data.get("keyword")))
            else:
                result = game.act(
                    corpus,
                    game.restore(corpus, data.get("token")),
                    data["action"],
                    data.get("answer"),
                )
        # 刚好收满五句（或令字诗句用尽）才算完成一局；此后重放请求 outcome=finished，不会重复记。
        if result.get("outcome") in ("accepted", "revealed") and result.get("status") in ("completed", "exhausted"):
            FeihualingRound.objects.create(
                keyword=result["keyword"], independent=result["independent"],
                learning=result["learning"], result=result["status"], **owner_filter(request),
            )
        return JsonResponse(result, json_dumps_params={"ensure_ascii": False})
    except game.ExerciseError as error:
        return JsonResponse(
            {"error": str(error), "restart_required": error.status == 409},
            status=error.status,
        )

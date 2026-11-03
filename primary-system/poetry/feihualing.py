"""A small source-checked poetry exercise. Signed page state, no database writes."""

from dataclasses import dataclass
import hashlib
import json
import re
import secrets

from django.core import signing

KEYWORDS = ("花", "月", "春", "山", "水", "风")
TARGET = 5
MAX_AGE = 3600
SALT = "poetry.feihualing.page.v1"
PUNCTUATION = frozenset("，。！？；：、,.!?;:「」『』“”‘’\"'")


class ExerciseError(ValueError):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


def clean(text):
    # Preserve letters, digits, symbols and wrong characters: no fuzzy/sub-string match.
    return "".join(c for c in text if c not in PUNCTUATION and not c.isspace())


def digest(value):
    return hashlib.sha256(
        json.dumps(
            value, ensure_ascii=False, sort_keys=True, separators=(",", ":")
        ).encode()
    ).hexdigest()


@dataclass(frozen=True)
class Answer:
    key: str
    text: str
    canonical: str
    clauses: tuple
    title: str
    author: str
    url: str
    editorial_note: str = ""

    def targets(self, keyword):
        return {key for key, text in self.clauses if keyword in text}

    def public(self, mode):
        return {
            "text": self.text,
            "title": self.title,
            "author": self.author,
            "url": self.url,
            "mode": mode,
            "label": "独立作答" if mode == "independent" else "提示学习",
            "editorial_note": self.editorial_note,
        }


def load_corpus():
    from .feihualing_index import load

    return load()


def fresh(corpus, keyword="月"):
    if not isinstance(keyword, str) or keyword not in KEYWORDS:
        raise ExerciseError("请选择页面上的一个令字。")
    if corpus.count(keyword) < TARGET:
        raise ExerciseError("这枚令字目前不足五句可用诗句，请换一个。", 503)
    return {
        "v": 1,
        "corpus": corpus.fingerprint,
        "keyword": keyword,
        "nonce": secrets.token_hex(16),
        "history": [],
        "hint": None,
    }


def used_keys(corpus, state):
    return (
        set().union(
            *(
                corpus.answers[item["key"]].targets(state["keyword"])
                for item in state["history"]
            )
        )
        if state["history"]
        else set()
    )


def restore(corpus, token):
    if not isinstance(token, str) or not 1 <= len(token) <= 8000:
        raise ExerciseError("这局练习信息不完整，请重新开始。", 409)
    try:
        state = signing.loads(token, salt=SALT, max_age=MAX_AGE)
    except signing.SignatureExpired:
        raise ExerciseError("这局练习已过期，请重新开始。", 409) from None
    except (signing.BadSignature, ValueError, TypeError, UnicodeError):
        raise ExerciseError("这局练习信息无法核对，请重新开始。", 409) from None
    if (
        not isinstance(state, dict)
        or type(state.get("v")) is not int
        or state["v"] != 1
        or state.get("corpus") != corpus.fingerprint
        or not isinstance(state.get("keyword"), str)
        or state["keyword"] not in KEYWORDS
        or not isinstance(state.get("nonce"), str)
        or not re.fullmatch(r"[0-9a-f]{32}", state["nonce"])
        or not isinstance(state.get("history"), list)
        or len(state["history"]) > TARGET
    ):
        raise ExerciseError("诗句资料或本局状态已变化，请重新开始。", 409)
    used = set()
    for item in state["history"]:
        if (
            not isinstance(item, dict)
            or not isinstance(item.get("key"), str)
            or item["key"] not in corpus.answers
            or item.get("mode") not in ("independent", "learning")
        ):
            raise ExerciseError("本局诗单需要重新核对，请重新开始。", 409)
        targets = corpus.answers[item["key"]].targets(state["keyword"])
        if not targets or targets & used:
            raise ExerciseError("本局诗单重复，请重新开始。", 409)
        used.update(targets)
    hint = state.get("hint")
    if hint is not None and (
        not isinstance(hint, str)
        or hint not in corpus.lines
        or bool(corpus.lines[hint].targets(state["keyword"]) & used)
        or not corpus.lines[hint].targets(state["keyword"])
    ):
        raise ExerciseError("本局提示需要重新核对，请重新开始。", 409)
    return state


def payload(corpus, state, *, message="", outcome="ready"):
    used = used_keys(corpus, state)
    remaining = corpus.count(state["keyword"], used)
    history = [
        corpus.answers[item["key"]].public(item["mode"]) for item in state["history"]
    ]
    count = len(history)
    hint = None
    if state["hint"]:
        line = corpus.lines[state["hint"]]
        first = next(
            (
                i
                for i, char in enumerate(line.text)
                if char not in PUNCTUATION and not char.isspace()
            ),
            0,
        )
        hint = {
            "title": line.title,
            "author": line.author,
            "masked": "".join(
                (
                    char
                    if i == first
                    or char == state["keyword"]
                    or char in PUNCTUATION
                    or char.isspace()
                    else "□"
                )
                for i, char in enumerate(line.text)
            ),
        }
    return {
        "available": True,
        "token": signing.dumps(state, salt=SALT, compress=True),
        "nonce": state["nonce"],
        "keyword": state["keyword"],
        "keywords": corpus.keywords(),
        "history": history,
        "count": count,
        "target": TARGET,
        "independent": sum(item["mode"] == "independent" for item in state["history"]),
        "learning": sum(item["mode"] == "learning" for item in state["history"]),
        "remaining": remaining,
        "status": (
            "completed"
            if count >= TARGET
            else ("playing" if remaining else "exhausted")
        ),
        "hint": hint,
        "message": message,
        "outcome": outcome,
        "corpus_version": corpus.version,
        "poem_count": corpus.poem_count,
        "sentence_count": corpus.sentence_count,
        "disabled_poems": corpus.disabled_count,
    }


def act(corpus, state, action, answer=None):
    if len(state["history"]) >= TARGET or not corpus.count(
        state["keyword"], used_keys(corpus, state)
    ):
        return payload(
            corpus, state, message="这局已经练完，开启新局继续吧。", outcome="finished"
        )
    used = used_keys(corpus, state)
    if action == "answer":
        if not isinstance(answer, str) or not 1 <= len(answer) <= 100:
            raise ExerciseError("请输入一至一百字的诗句。")
        value = clean(answer)
        if not value:
            raise ExerciseError("先写一句诗，再提交吧。")
        if not corpus.contains_keyword(value, state["keyword"]):
            return payload(
                corpus,
                state,
                message=f'这句还没有令字“{state["keyword"]}”，再想一句吧。',
                outcome="missing_keyword",
            )
        match = corpus.match(value)
        if not match:
            return payload(
                corpus,
                state,
                message="这句暂未收录，可以换一句，或借一张提示笺。",
                outcome="unknown",
            )
        targets = match.targets(state["keyword"])
        if not targets:
            return payload(
                corpus,
                state,
                message=f'这句还没有令字“{state["keyword"]}”，再想一句吧。',
                outcome="missing_keyword",
            )
        if targets & used:
            return payload(
                corpus,
                state,
                message="其中含令字的诗句已经用过啦，换一句新的吧。",
                outcome="duplicate",
            )
        state["history"].append({"key": match.key, "mode": "independent"})
        state["hint"] = None
        return payload(
            corpus, state, message="接住这句诗了！已收入本局诗单。", outcome="accepted"
        )
    if action not in ("hint", "reveal"):
        raise ExerciseError("暂不支持这个操作。")
    if action == "hint":
        if not state["hint"]:
            choice = corpus.choose(state["keyword"], used, state["nonce"])
            state["hint"] = choice.key
        return payload(
            corpus,
            state,
            message="想想这首诗。也可以揭晓一句，一起学习。",
            outcome="hint",
        )
    if not state["hint"]:
        raise ExerciseError("先借一张提示笺，再揭晓诗句。")
    line = corpus.lines[state["hint"]]
    state["history"].append({"key": line.key, "mode": "learning"})
    state["hint"] = None
    return payload(
        corpus,
        state,
        message="已收入诗单，并标为“提示学习”。下一句试着自己想。",
        outcome="revealed",
    )

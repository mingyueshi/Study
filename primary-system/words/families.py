"""把按共同词尾编排的词族转换成词以类聚使用的枝干。"""
import json
import re
from functools import lru_cache

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

SOURCE = settings.BASE_DIR / "content_sources" / "word-families.json"
ROOT_KEY = "spelling"


def require(condition, message):
    if not condition:
        raise ImproperlyConfigured(f"拼写家族数据异常：{message}")


def matches(pattern, value):
    return isinstance(value, str) and re.fullmatch(pattern, value) is not None


def validate(data):
    require(isinstance(data, dict) and data.get("schema_version") == 1, "版本")
    groups = data.get("families")
    require(isinstance(groups, list) and groups, "缺少词族")
    endings, spellings = set(), set()
    for group in groups:
        require(isinstance(group, dict), "词族格式")
        ending, sound = group.get("ending"), group.get("ipa")
        require(matches(r"[a-z]+", ending) and ending not in endings, f"词尾无效或重复：{ending}")
        require(matches(r'/[^/\s<>"]+/', sound), f"词尾音标：{ending}")
        endings.add(ending)
        words = group.get("words")
        require(isinstance(words, list) and len(words) >= 3, f"词族至少需要三个例词：{ending}")
        for word in words:
            require(isinstance(word, dict), f"例词格式：{ending}")
            en, zh, ipa = word.get("en"), word.get("zh"), word.get("ipa")
            require(matches(r"[a-z]+", en) and en.endswith(ending) and en != ending
                    and en not in spellings, f"例词拼写不符或重复：{en}")
            require(matches(r'/[^/\s<>"]+/', ipa) and ipa[1:-1].endswith(sound[1:-1])
                    and ipa != sound, f"例词音标与词尾不符：{en}")
            require(matches(r'[^<>"\r\n]+', zh) and bool(zh.strip()), f"例词释义：{en}")
            spellings.add(en)


@lru_cache(maxsize=1)
def load_spelling_root():
    with SOURCE.open(encoding="utf-8") as file:
        data = json.load(file)
    validate(data)
    children = []
    for group in data["families"]:
        ending = group["ending"]
        words = [{**word, "ending": ending, "stem": word["en"].removesuffix(ending)}
                 for word in group["words"]]
        children.append({
            "id": f"spelling-{ending}", "zh": f"-{ending}", "en": "", "ipa": group["ipa"],
            "words": words, "children": [], "total": len(words),
        })
    return {
        "id": ROOT_KEY, "key": ROOT_KEY, "zh": "拼写家族", "emoji": "🔤",
        "children": children, "words": [], "total": sum(child["total"] for child in children),
    }

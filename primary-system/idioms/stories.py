"""成语典故馆：故事卡、人物线索与钉词校验（只读浏览，不写学习记录）。

故事复述、简明释义和人物档案来自 ``data/stories.json``。
词库生效记录经 ``matches_pin`` 校验后提供读音和例句，漂移的卡片显示「待核对」。
"""
import json
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe

from .catalog import SOURCE_CODE, matches_pin, pinned_records
from .views import reading

STORIES_PATH = Path(__file__).resolve().parent / "data" / "stories.json"


def load_stories():
    with STORIES_PATH.open(encoding="utf-8") as file:
        curriculum = json.load(file)
    validate(curriculum)
    return curriculum


def validate(curriculum):
    if curriculum.get("schema_version") != 1 or curriculum.get("source_code") != SOURCE_CODE:
        raise ImproperlyConfigured("Unsupported idiom story curriculum.")
    figure_ids = set()
    for figure in curriculum.get("figures", []):
        for field in ("id", "name", "era", "role", "blurb"):
            if not str(figure.get(field) or "").strip():
                raise ImproperlyConfigured("人物档案缺字段。")
        if figure["id"] in figure_ids:
            raise ImproperlyConfigured(f"人物 id 重复：{figure['id']}")
        figure_ids.add(figure["id"])
    if len(figure_ids) < 10:
        raise ImproperlyConfigured("人物档案不足。")
    headwords = set()
    for story in curriculum.get("stories", []):
        if story.get("id") in headwords:
            raise ImproperlyConfigured(f"故事 id 重复：{story['id']}")
        headwords.add(story["id"])
        for field in ("headword", "source_book", "source_chapter", "quote", "story", "meaning", "clue"):
            if not str(story.get(field) or "").strip():
                raise ImproperlyConfigured(f"{story.get('headword')} 故事缺字段 {field}。")
        if len(story.get("story", "")) < 100:
            raise ImproperlyConfigured(f"{story['headword']} 故事复述太短。")
        unknown = [fid for fid in story.get("figure_ids", []) if fid not in figure_ids]
        if unknown:
            raise ImproperlyConfigured(f"{story['headword']} 引用未知人物：{unknown}")
        for field in ("binding_id", "entry_id", "evidence_id", "lexical_hash", "editorial_snapshot"):
            if not story.get(field):
                raise ImproperlyConfigured(f"{story['headword']} 缺词库钉词字段 {field}。")


def story_cards(curriculum=None):
    """全部典故故事卡：词典 payload + 故事编辑内容 + 人物档案；钉词漂移即降级。"""
    if curriculum is None:
        curriculum = load_stories()
    records = pinned_records(story["binding_id"] for story in curriculum["stories"])
    figures = {figure["id"]: figure for figure in curriculum["figures"]}
    cards = []
    for story in curriculum["stories"]:
        record = records.get(story["binding_id"])
        valid = matches_pin(record, {**story, "source_code": SOURCE_CODE})
        cards.append({
            **story,
            "figures": [figures[fid] for fid in story.get("figure_ids", [])],
            "reading": reading(record) if valid else None,
            "valid": valid,
        })
    return cards


def books(cards):
    """典籍分组列表（按卡序）。"""
    seen = []
    for card in cards:
        if card["source_book"] not in seen:
            seen.append(card["source_book"])
    return seen


def figure_clues(cards, figures=None):
    """人物线索：每个人物 + 参与的典故卡 + 同出处提示。"""
    if figures is None:
        figures = load_stories()["figures"]
    clues = []
    for figure in figures:
        stories = [card for card in cards if figure["id"] in card.get("figure_ids", [])]
        if not stories:
            continue
        books_ = sorted({card["source_book"] for card in stories})
        clues.append({**figure, "stories": stories, "books": books_})
    return clues


def matches_query(card, query):
    fields = [
        card["headword"], card["source_book"], card["source_chapter"],
        *(figure["name"] for figure in card["figures"]),
    ]
    if card["valid"]:
        fields.extend((card["quote"], card["story"], card["meaning"], card["reading"]["properties"].get("example") or ""))
    return any(query in str(value).casefold() for value in fields)


@never_cache
@require_safe
def page(request):
    """按典籍或人物筛选，检索当前范围中的典故。"""
    curriculum = load_stories()
    cards = story_cards(curriculum)
    figure_id = request.GET.get("figure", "")
    book = request.GET.get("book", "")
    q = request.GET.get("q", "").strip()[:80]
    clues = figure_clues(cards, curriculum["figures"])
    clue = next((c for c in clues if c["id"] == figure_id), None)
    if clue is not None:
        shown = clue["stories"]
        book = ""
    elif book:
        shown = [card for card in cards if card["source_book"] == book]
    else:
        shown = cards
    if q:
        query = q.casefold()
        shown = [card for card in shown if matches_query(card, query)]
        shown.sort(key=lambda card: (card["headword"] != q, q not in card["headword"]))
    return render(request, "idioms/hall.html", {
        "shown": shown, "books": books(cards), "book": book, "q": q,
        "clues": clues, "clue": clue,
    })

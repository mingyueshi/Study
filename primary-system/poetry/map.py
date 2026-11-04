"""诗词地图：地点编排与诗篇定位（只读浏览，不写学习记录）。

地点、诗文链接与教学标注全部来自 ``map_data/places.json``；诗篇按
「题名 + 作者（必要时首句）」定位 simplified 层语料，定位不到的如实降级，
不猜、不换来源。地图标记坐标用生成底图时的同一投影换算。
"""
import json
import math
from functools import lru_cache
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

from .models import PoetryText

MAP_DATA = Path(__file__).resolve().parent / "map_data"
PLACES_PATH = MAP_DATA / "places.json"
PROJECTION_PATH = MAP_DATA / "map_projection.json"
SOURCE_CODE = "primary-poetry-map"
# 重名诗篇优先取蒙学（千家诗）文本，其次题名更短（如「绝句」先于「绝句四首 三」），最后按主键。
COLLECTION_ORDER = {"蒙学": 0}


def _project_albers(lng, lat, params):
    """Albers 等积圆锥投影；与 scripts/build_china_map_svg.py 同一公式。"""
    phi1, phi2 = math.radians(params["lat1"]), math.radians(params["lat2"])
    n = (math.sin(phi1) + math.sin(phi2)) / 2
    c = math.cos(phi1) ** 2 + 2 * n * math.sin(phi1)
    rho0 = math.sqrt(c) / n
    phi, lam = math.radians(lat), math.radians(lng - params["lon0"])
    rho = math.sqrt(c - 2 * n * math.sin(phi)) / n
    theta = n * lam
    x = rho * math.sin(theta) * params["scale"] - params["offset_x"]
    # 底图生成时把 y 翻转成 SVG 方向（向下增长）并平移到包围盒，这里保持同一公式。
    y = -(rho0 - rho * math.cos(theta)) * params["scale"] - params["offset_y"]
    return round(x, 1), round(y, 1)


def load_projection():
    with PROJECTION_PATH.open(encoding="utf-8") as file:
        return json.load(file)


def validate(curriculum):
    if curriculum.get("schema_version") != 1 or curriculum.get("source_code") != SOURCE_CODE:
        raise ImproperlyConfigured("Unsupported poetry map curriculum.")
    places = curriculum.get("places", [])
    if len(places) < 10:
        raise ImproperlyConfigured("诗词地图至少需要 10 个地点。")
    ids = set()
    for place in places:
        for field in ("id", "name", "kind", "city", "province", "blurb"):
            if not str(place.get(field) or "").strip():
                raise ImproperlyConfigured(f"地点缺字段 {field}。")
        if place["id"] in ids:
            raise ImproperlyConfigured(f"地点 id 重复：{place['id']}")
        ids.add(place["id"])
        lat, lng = place.get("lat"), place.get("lng")
        if not (isinstance(lat, (int, float)) and isinstance(lng, (int, float))):
            raise ImproperlyConfigured(f"{place['name']} 坐标必须是数字。")
        if not (15 <= lat <= 55 and 70 <= lng <= 140):
            raise ImproperlyConfigured(f"{place['name']} 坐标不在中国范围内。")
    links = curriculum.get("links", [])
    if len(links) < 20:
        raise ImproperlyConfigured("诗词地图至少需要 20 首诗。")
    featured_by_place = {}
    for link in links:
        place_id = link.get("place_id")
        if place_id not in ids:
            raise ImproperlyConfigured(f"诗篇引用未知地点：{place_id}")
        for field in ("title", "author", "note"):
            if not str(link.get(field) or "").strip():
                raise ImproperlyConfigured(f"{place_id} 的诗篇缺字段 {field}。")
        if link.get("featured"):
            if place_id in featured_by_place:
                raise ImproperlyConfigured(f"{place_id} 有多首代表诗。")
            featured_by_place[place_id] = True
    for place_id in ids:
        if place_id not in featured_by_place:
            raise ImproperlyConfigured(f"{place_id} 缺代表诗（featured）。")


@lru_cache(maxsize=1)
def load_places():
    with PLACES_PATH.open(encoding="utf-8") as file:
        curriculum = json.load(file)
    validate(curriculum)
    return curriculum


def _rank(row):
    return (COLLECTION_ORDER.get(row.document.collection, 1), len(row.title), row.pk)


def resolve_links():
    """把数据里的诗篇定位到 simplified 层语料；返回 [(link, row_or_None)]。"""
    curriculum = load_places()
    links = curriculum["links"]
    rows = (
        PoetryText.objects.filter(document__layer="simplified")
        .select_related("document")
        .only("id", "title", "author", "paragraphs", "document__collection")
    )
    # 语料题名常带组诗编号与乐府前缀（「凉州词二首 一」「横吹曲辞 出塞 一」），
    # 且同名异诗并存（《从军行》与《从军行七首》），必须按作者聚合后包含匹配，
    # 再用首句挑出具体某一首。
    by_author = {}
    for row in rows.iterator(chunk_size=2000):
        by_author.setdefault(row.author, []).append(row)

    def candidates_for(link):
        # 同一作者在语料里有「王维」与「（唐）王维」两种署名，必须合并所有匹配组。
        pool = []
        for author, group in by_author.items():
            if link["author"] in author:
                pool.extend(group)
        return [row for row in pool if link["title"] in row.title]

    resolved = []
    for link in links:
        candidates = candidates_for(link)
        if link.get("first_line"):
            candidates = [row for row in candidates
                          if link["first_line"] in "".join(row.paragraphs)]
        row = min(candidates, key=_rank) if candidates else None
        resolved.append((link, row))
    return resolved


def place_panels():
    """按地点聚合已定位诗篇，并算出每个地点的地图标记坐标。"""
    params = load_projection()
    resolved = resolve_links()
    by_place = {}
    for link, row in resolved:
        poem = None
        if row is not None:
            first_line = "".join(row.paragraphs).split("。")[0] + "。" if row.paragraphs else ""
            poem = {
                "pk": row.pk, "title": row.title, "author": row.author,
                "quote": first_line, "note": link["note"], "featured": link.get("featured", False),
            }
        by_place.setdefault(link["place_id"], []).append(poem)
    places = []
    for place in load_places()["places"]:
        poems = [poem for poem in by_place.get(place["id"], []) if poem]
        featured = next((poem for poem in poems if poem["featured"]), poems[0] if poems else None)
        others = [poem for poem in poems if poem is not featured]
        x, y = _project_albers(place["lng"], place["lat"], params)
        places.append({
            **place, "x": x, "y": y,
            "featured": featured, "others": others, "poem_count": len(poems),
        })
    return places

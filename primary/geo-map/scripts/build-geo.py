#!/usr/bin/env python3
"""生成 ../china-geo.js：全国省级行政区边界的教学简化版。

数据源：阿里云 DataV GeoJSON（全国·含省界与十段线）
  https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json

用法：
  python3 scripts/build-geo.py <100000_full.json 路径>
  python3 scripts/build-geo.py            # 未给路径则自动下载到临时目录

输出为自包含 JS（浏览器 file:// 双击可加载，故不用 fetch + JSON）。
原始源文件不入库，本目录只提交生成的 china-geo.js。
"""

import json
import sys
import tempfile
import urllib.request
from pathlib import Path

SOURCE_URL = "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json"
OUT = Path(__file__).resolve().parent.parent / "china-geo.js"

# 简化容差（单位：经纬度度）。0.02° 约 2 千米，教学演示足够。
TOL = 0.02
TOL_TINY = 0.05          # 南海诸岛与十段线等小地物用更大容差
MIN_RING_POINTS = 3      # 少于 3 个点的环直接丢弃（小岛多为三点闭合环）
SMALL_RING_POINTS = 8    # 小于该点数的环不做简化
HAINAN_MAIN_LAT = 20.0   # 海南本岛（纬度不低于此）与南海诸岛的分界


def perp_dist(pt, a, b):
    """点 pt 到线段 ab 的垂线距离（按平面坐标近似即可）。"""
    (x, y), (x1, y1), (x2, y2) = pt, a, b
    dx, dy = x2 - x1, y2 - y1
    if dx == dy == 0:
        return ((x - x1) ** 2 + (y - y1) ** 2) ** 0.5
    t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    px, py = x1 + t * dx, y1 + t * dy
    return ((x - px) ** 2 + (y - py) ** 2) ** 0.5


def simplify(ring, tol):
    """Douglas–Peucker 迭代简化，保留闭合环两端点。"""
    if len(ring) <= SMALL_RING_POINTS:
        return ring[:]
    keep = [False] * len(ring)
    keep[0] = keep[-1] = True
    stack = [(0, len(ring) - 1)]
    while stack:
        lo, hi = stack.pop()
        if hi - lo < 2:
            continue
        idx, dist = -1, -1.0
        for i in range(lo + 1, hi):
            d = perp_dist(ring[i], ring[lo], ring[hi])
            if d > dist:
                idx, dist = i, d
        if dist > tol:
            keep[idx] = True
            stack.append((lo, idx))
            stack.append((idx, hi))
    return [pt for pt, k in zip(ring, keep) if k]


def clean_ring(ring):
    """去重相邻点、去掉与首点重复的末点（闭合交给 SVG 的 Z）。"""
    out = []
    for pt in ring:
        if out and pt == out[-1]:
            continue
        out.append(pt)
    while len(out) > 1 and out[0] == out[-1]:
        out.pop()
    return out


def round_ring(ring):
    return [[round(x, 2), round(y, 2)] for x, y in ring]


def load_source(argv):
    if len(argv) > 1:
        text = Path(argv[1]).read_text(encoding="utf-8")
        return json.loads(text)
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "100000_full.json"
        print(f"下载 {SOURCE_URL} …")
        with urllib.request.urlopen(SOURCE_URL, timeout=120) as resp:
            path.write_bytes(resp.read())
        return json.loads(path.read_text(encoding="utf-8"))


def main():
    data = load_source(sys.argv)

    provinces = {}       # adcode -> [ring, ...]（外环与内环混排，渲染用 evenodd）
    sea_dash = []        # 十段线示意（南海小图用）
    south_islands = []   # 南海诸岛（从海南省拆出，小图用）

    for feat in data["features"]:
        props = feat.get("properties") or {}
        geom = feat.get("geometry") or {}
        if geom.get("type") == "Polygon":
            polys = [geom["coordinates"]]
        elif geom.get("type") == "MultiPolygon":
            polys = geom["coordinates"]
        else:
            continue
        if props.get("adcode") == "100000_JD":
            for poly in polys:
                ring = round_ring(clean_ring(poly[0]))   # 十段线是细长条，不简化
                if len(ring) >= MIN_RING_POINTS:
                    sea_dash.append(ring)
            continue
        adcode = str(props.get("adcode") or "")
        name = props.get("name")
        if not adcode or not name:
            continue
        rings = []
        for poly in polys:
            for raw in poly:            # 外环 + 内环（如河北境内京津两处内环）
                pts = [[float(x), float(y)] for x, y in raw]
                ring = clean_ring(simplify(pts, TOL))
                if len(ring) >= MIN_RING_POINTS:
                    rings.append(round_ring(ring))
        if adcode == "460000":          # 海南：本岛留下，诸岛拆去小图
            for ring in rings:
                lat = max(p[1] for p in ring)
                (south_islands if lat < HAINAN_MAIN_LAT else provinces.setdefault("460000", [])).append(ring)
        else:
            provinces[adcode] = rings

    if len(provinces) != 34:
        sys.exit(f"省级数量异常：{len(provinces)}，应为 34")

    payload = {
        "meta": {
            "source": "阿里云 DataV 全国边界 GeoJSON 教学简化版",
            "toleranceDeg": TOL,
            "note": "外环与内环混排渲染（evenodd）；南海诸岛与十段线拆至小图数据",
        },
        "provinces": provinces,
        "seaDash": sea_dash,
        "southSeaIslands": south_islands,
    }
    js = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    OUT.write_text(
        "/* 由 scripts/build-geo.py 生成，请勿手工编辑；重新生成见目录 README。 */\n"
        "window.GEO_CHINA_GEO = " + js + ";\n",
        encoding="utf-8",
    )
    size = OUT.stat().st_size
    pts = sum(len(r) for rs in provinces.values() for r in rs)
    print(f"已生成 {OUT}（{size / 1024:.0f} KB，34 省，共 {pts} 个坐标点，"
          f"南海诸岛 {len(south_islands)} 环，十段线 {len(sea_dash)} 段）")


if __name__ == "__main__":
    main()

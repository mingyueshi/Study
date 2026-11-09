#!/usr/bin/env python3
"""生成 ../world-geo.js：世界国家边界的教学简化版（110m 比例尺）。

数据源：world-atlas 项目的 countries-110m（Natural Earth 数据的 TopoJSON 封装）
  https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json

用法：
  python3 scripts/build-world.py <countries-110m.json 路径>
  python3 scripts/build-world.py          # 未给路径则自动下载到临时目录

TopoJSON 为差分量化坐标，这里解码回经纬度；南极洲按制图惯例截至南纬 73°。
输出为自包含 JS；原始源文件不入库，本目录只提交生成的 world-geo.js。
"""

import json
import sys
import tempfile
import urllib.request
from pathlib import Path

SOURCE_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
OUT = Path(__file__).resolve().parent.parent / "world-geo.js"

ANTARCTICA_LAT = -73.0   # 南极洲在图上截至该纬度


def load_source(argv):
    if len(argv) > 1:
        text = Path(argv[1]).read_text(encoding="utf-8")
        return json.loads(text)
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "countries-110m.json"
        print(f"下载 {SOURCE_URL} …")
        with urllib.request.urlopen(SOURCE_URL, timeout=120) as resp:
            path.write_bytes(resp.read())
        return json.loads(path.read_text(encoding="utf-8"))


def decode_arcs(topo):
    """把量化差分弧段解码为经纬度坐标列表。"""
    scale = topo["transform"]["scale"]
    translate = topo["transform"]["translate"]
    arcs = []
    for arc in topo["arcs"]:
        x, y = 0, 0
        pts = []
        for dx, dy in arc:
            x += dx
            y += dy
            pts.append([round(x * scale[0] + translate[0], 2),
                        round(y * scale[1] + translate[1], 2)])
        arcs.append(pts)
    return arcs


def ring_from_indices(indices, arcs):
    """按 TopoJSON 规则拼接弧段索引（负数表示反向）为闭合环。"""
    pts = []
    for idx in indices:
        arc = arcs[idx] if idx >= 0 else arcs[~idx][::-1]
        if pts and arc and pts[-1] == arc[0]:
            pts.extend(arc[1:])
        else:
            pts.extend(arc)
    # 去掉与首点重复的末点（闭合交给 SVG 的 Z）
    while len(pts) > 1 and pts[0] == pts[-1]:
        pts.pop()
    return pts


def dedupe(pts):
    out = []
    for pt in pts:
        if out and pt == out[-1]:
            continue
        out.append(pt)
    return out


def main():
    topo = load_source(sys.argv)
    if topo.get("type") != "Topology" or "countries" not in topo.get("objects", {}):
        sys.exit("源文件不是预期的 world-atlas countries TopoJSON")
    arcs = decode_arcs(topo)

    countries = []
    for geom in topo["objects"]["countries"]["geometries"]:
        name = (geom.get("properties") or {}).get("name") or ""
        rings = []

        def collect(g):
            t = g.get("type")
            if t == "Polygon":
                for ring in g["arcs"]:
                    rings.append(ring_from_indices(ring, arcs))
            elif t == "MultiPolygon":
                for poly in g["arcs"]:
                    for ring in poly:
                        rings.append(ring_from_indices(ring, arcs))

        collect(geom)
        if name == "Antarctica":
            rings = [dedupe([[pt[0], max(pt[1], ANTARCTICA_LAT)] for pt in ring]) for ring in rings]
        rings = [dedupe(ring) for ring in rings if len(dedupe(ring)) >= 3]
        if rings:
            countries.append({"name": name, "rings": rings})

    if len(countries) < 150:
        sys.exit(f"国家数量异常：{len(countries)}，应接近 177")

    payload = {
        "meta": {
            "source": "world-atlas countries-110m（Natural Earth）教学简化版",
            "note": "南极洲截至南纬 73°；环混排渲染（evenodd）",
        },
        "countries": countries,
    }
    js = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    OUT.write_text(
        "/* 由 scripts/build-world.py 生成，请勿手工编辑；重新生成见目录 README。 */\n"
        "window.GEO_WORLD_GEO = " + js + ";\n",
        encoding="utf-8",
    )
    pts = sum(len(r["rings"][0]) for r in countries)
    print(f"已生成 {OUT}（{OUT.stat().st_size / 1024:.0f} KB，{len(countries)} 个国家/地区）")
    names = sorted(c["name"] for c in countries)
    print("\n".join(names))


if __name__ == "__main__":
    main()

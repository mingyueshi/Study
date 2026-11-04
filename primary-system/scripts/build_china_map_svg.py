#!/usr/bin/env python3
"""生成诗词地图的中国底图 SVG（开发期工具，产物提交进仓库）。

来源：阿里 DataV.GeoAtlas 公开中国轮廓（含省级边界与九段线），
https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json
下载后做 Douglas-Peucker 简化与 Albers 等积圆锥投影（中国地图教科书标准，
中央经线 105°E，标准纬线 25°/47°N），输出 static/poetry/china-map.svg 与
poetry/map_data/map_projection.json（运行时标记点用同一投影换算）。

用法：python3 scripts/build_china_map_svg.py [geojson路径]
重新生成底图时必须与 poetry/map_data/map_projection.json 一起提交。
"""

import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_SVG = ROOT / 'static' / 'poetry' / 'china-map.svg'
OUT_PARAMS = ROOT / 'poetry' / 'map_data' / 'map_projection.json'

# Albers 等积圆锥：标准纬线与中央经线（中国全图惯例）。
LAT1, LAT2, LON0 = 25.0, 47.0, 105.0
SCALE = 1000.0         # 投影平面缩放（像素/弧度量纲），最终按内容包围盒归一。
TOLERANCE = 0.002      # Douglas-Peucker 简化容差（度），控制 SVG 体积（约 2px）。


def albers(lng, lat):
    """Albers 等积圆锥投影；返回未缩放的投影平面坐标。"""
    phi1, phi2 = math.radians(LAT1), math.radians(LAT2)
    n = (math.sin(phi1) + math.sin(phi2)) / 2
    c = math.cos(phi1) ** 2 + 2 * n * math.sin(phi1)
    rho0 = math.sqrt(c) / n
    phi, lam = math.radians(lat), math.radians(lng - LON0)
    rho = math.sqrt(c - 2 * n * math.sin(phi)) / n
    theta = n * lam
    return rho * math.sin(theta), rho0 - rho * math.cos(theta)


def simplify(points, tolerance):
    """Douglas-Peucker 简化（按投影后平面距离）；闭合环首尾重合时按离起点最远点分裂。"""
    if len(points) < 3:
        return points
    stack = [(0, len(points) - 1)]
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    while stack:
        start, end = stack.pop()
        ax, ay = points[start]
        bx, by = points[end]
        dx, dy = bx - ax, by - ay
        length = math.hypot(dx, dy)
        best, index = -1.0, start
        for i in range(start + 1, end):
            px, py = points[i]
            if length < 1e-9:
                dist = math.hypot(px - ax, py - ay)  # 闭合环退化弦：改按点到起点距离。
            else:
                dist = abs(dx * (ay - py) - dy * (ax - px)) / length
            if dist > best:
                best, index = dist, i
        if best > tolerance:
            keep[index] = True
            stack.append((start, index))
            stack.append((index, end))
    return [point for point, flag in zip(points, keep) if flag]


def main():
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/tmp/poetrymap/china_full.json')
    geo = json.loads(source.read_text(encoding='utf-8'))

    features = []
    for feature in geo['features']:
        props = feature['properties']
        name = props.get('name') or ''
        adcode = props.get('adcode')
        polygons = []
        geometry = feature['geometry']
        if geometry['type'] == 'Polygon':
            polygons = [geometry['coordinates']]
        elif geometry['type'] == 'MultiPolygon':
            polygons = geometry['coordinates']
        features.append({'name': name, 'adcode': adcode, 'polygons': polygons})

    # 投影并简化，收集全局包围盒。
    paths = []
    min_x = min_y = math.inf
    max_x = max_y = -math.inf
    for feature in features:
        parts = []
        for polygon in feature['polygons']:
            for ring in polygon:
                projected = [albers(lng, lat) for lng, lat in ring]
                projected = [(x * SCALE, -y * SCALE) for x, y in projected]
                simplified = simplify(projected, TOLERANCE * SCALE)
                if len(simplified) < 4:
                    # 澳门、九段线窄条等极小图形：简化塌缩时保留原始细节，不能整块丢失。
                    simplified = projected if len(projected) >= 4 else []
                if len(simplified) < 4:
                    continue
                for x, y in simplified:
                    min_x, max_x = min(min_x, x), max(max_x, x)
                    min_y, max_y = min(min_y, y), max(max_y, y)
                parts.append('M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in simplified) + 'Z')
        if parts:
            paths.append({'name': feature['name'], 'adcode': feature['adcode'], 'd': ''.join(parts)})

    pad = 8
    width = math.ceil(max_x - min_x) + pad * 2
    height = math.ceil(max_y - min_y) + pad * 2
    offset_x, offset_y = min_x - pad, min_y - pad

    def to_view(x, y):
        return x - offset_x, y - offset_y

    # 九段线单独一条虚线 path（adcode 100000_JD）。
    import re
    mainland, dotted = [], []
    for path in paths:
        target = dotted if str(path['adcode']).endswith('_JD') else mainland

        def shift(match):
            x, y = to_view(float(match.group(1)), float(match.group(2)))
            return f'{x:.1f} {y:.1f}'

        target.append(re.sub(r'([-\d.]+) ([-\d.]+)', shift, path['d']))

    body = [f'<path class="map-province" d="{d}"/>' for d in mainland]
    body += [f'<path class="map-dotted" d="{d}"/>' for d in dotted]

    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '
           f'{width} {height}" role="img" aria-label="中国地图底图（示意图，用于诗词地点定位）">'
           + ''.join(body) + '</svg>')
    OUT_SVG.parent.mkdir(parents=True, exist_ok=True)
    OUT_SVG.write_text(svg, encoding='utf-8')

    params = {
        'projection': 'albers-equal-area-conic',
        'lat1': LAT1, 'lat2': LAT2, 'lon0': LON0, 'scale': SCALE,
        'offset_x': offset_x, 'offset_y': offset_y, 'width': width, 'height': height,
    }
    OUT_PARAMS.parent.mkdir(parents=True, exist_ok=True)
    OUT_PARAMS.write_text(json.dumps(params, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f'底图: {OUT_SVG.relative_to(ROOT)} ({OUT_SVG.stat().st_size // 1024}KB, viewBox {width}x{height})')
    print(f'投影: {OUT_PARAMS.relative_to(ROOT)}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

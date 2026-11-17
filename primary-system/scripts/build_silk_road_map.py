#!/usr/bin/env python3
"""从随项目保存的 Natural Earth 陆地输入生成丝路自然底图，无需联网。"""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'content_sources/history-timeline'
INPUT = ROOT / 'assets/silk-road/ne-110m-land.geojson'
OUTPUT = ROOT / 'silk-road-geo.js'
BOUNDS = (40, -8, 126, 49)


def clip(ring):
    points = [tuple(p[:2]) for p in ring]
    if points[0] == points[-1]:
        points.pop()
    for axis, bound, keep_greater in ((0, 40, True), (0, 126, False), (1, -8, True), (1, 49, False)):
        if not points:
            break
        result = []
        inside = lambda p: p[axis] >= bound if keep_greater else p[axis] <= bound
        for i, current in enumerate(points):
            previous = points[i - 1]
            a, b = inside(previous), inside(current)
            if a != b:
                ratio = (bound - previous[axis]) / (current[axis] - previous[axis])
                result.append(tuple(previous[j] + ratio * (current[j] - previous[j]) for j in (0, 1)))
            if b:
                result.append(current)
        points = result
    if len(points) < 3:
        return None
    rounded = [[round(x, 3), round(y, 3)] for x, y in points]
    return rounded + [rounded[0]]


def build():
    land = []
    for feature in json.loads(INPUT.read_text())['features']:
        geometry = feature['geometry']
        polygons = [geometry['coordinates']] if geometry['type'] == 'Polygon' else geometry['coordinates']
        for polygon in polygons:
            for ring in polygon:
                if result := clip(ring):
                    land.append(result)
    data = {
        'meta': {
            'source': 'Natural Earth 110m land', 'license': 'Public domain',
            'url': 'https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson',
            'bounds': BOUNDS, 'note': '仅绘制自然陆地与海岸，不表示任何时期的国界；城市为概略定位。',
        },
        'land': land,
        'labels': [
            {'text': text, 'point': point} for text, point in (
                ('中亚', [67, 45]), ('河西走廊', [103, 42]), ('塔里木盆地', [83, 38]),
                ('印度洋', [80, -2]), ('阿拉伯海', [62, 15]), ('南海', [116, 12]),
                ('马六甲海峡', [99, 3]), ('北 ↑', [122, 46]),
            )
        ],
    }
    return '/* Natural Earth 自然底图；由 scripts/build_silk_road_map.py 从本地输入生成。 */\nwindow.SILK_ROAD_GEO = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n'


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    expected = build()
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text() != expected:
            raise SystemExit('丝路自然底图需重生成')
    else:
        OUTPUT.write_text(expected)
    print('丝路自然底图已同步' if args.check else '丝路自然底图已生成')

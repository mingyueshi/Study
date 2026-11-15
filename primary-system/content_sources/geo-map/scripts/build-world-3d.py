#!/usr/bin/env python3
"""从与平面图同源的 world-atlas 2.0.2 补全地球仪南极洲，保留其余国家 ID。"""
import hashlib
import importlib.util
import json
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json'
spec = importlib.util.spec_from_file_location('world_builder', HERE / 'build-world.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
raw = Path(sys.argv[1]).read_bytes() if len(sys.argv) > 1 else urllib.request.urlopen(URL, timeout=60).read()
topo = json.loads(raw)
arcs = builder.decode_arcs(topo)
geom = next(g for g in topo['objects']['countries']['geometries'] if g['properties']['name'] == 'Antarctica')
polygons = [geom['arcs']] if geom['type'] == 'Polygon' else geom['arcs']
rings = [builder.ring_from_indices(ring, arcs) for polygon in polygons for ring in polygon]
assert min(p[1] for ring in rings for p in ring) < -85
# TopoJSON 的南极海岸沿日期变更线切开，球面闭合隐含南极点。
# 转为矩形纹理时显式沿两侧接到南极，不能直接沿海岸纬度连线。
for ring in rings:
    if abs(ring[-1][0] - ring[0][0]) > 359:
        ring.extend([[ring[-1][0], -90], [ring[0][0], -90]])
payload = {'source': {'url': URL, 'sha256': hashlib.sha256(raw).hexdigest()}, 'rings': rings}
(HERE.parent / 'world-3d-polar.js').write_text(
    '/* 由 scripts/build-world-3d.py 生成：完整南极轮廓，未作平面图纬度裁切。 */\nwindow.GM_WORLD_3D_POLAR = ' +
    json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')

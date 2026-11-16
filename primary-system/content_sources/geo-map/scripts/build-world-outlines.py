#!/usr/bin/env python3
"""从 Natural Earth geography_regions_polys GeoJSON 构建七洲无国界轮廓。"""
import hashlib
import json
import math
from pathlib import Path
import subprocess
import sys

BASE = Path(__file__).resolve().parents[1]

def simplify(points, epsilon=.22):
    if len(points) < 5:
        return points
    a, b = points[0], points[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    def distance(p):
        if not dx and not dy:
            return math.hypot(p[0] - a[0], p[1] - a[1])
        t = max(0, min(1, ((p[0] - a[0])*dx + (p[1] - a[1])*dy)/(dx*dx + dy*dy)))
        return math.hypot(p[0] - a[0] - t*dx, p[1] - a[1] - t*dy)
    i = max(range(1, len(points)-1), key=lambda i: distance(points[i]))
    if distance(points[i]) <= epsilon:
        return [a, b]
    return simplify(points[:i+1], epsilon)[:-1] + simplify(points[i:], epsilon)

def rings(geometry):
    polygons = geometry['coordinates'] if geometry['type'] == 'MultiPolygon' else [geometry['coordinates']]
    result = []
    for polygon in polygons:
        for ring in polygon:
            continuous = []
            for lon, lat, *_ in ring:
                if continuous:
                    lon += 360 * round((continuous[-1][0] - lon) / 360)
                continuous.append([lon, lat])
            reduced = simplify(continuous)
            if len(reduced) >= 4:
                result.append([[round((x+180)%360-180, 3), round(y, 3)] for x,y in reduced])
    return result

raw = Path(sys.argv[1]).read_bytes()
geo = json.loads(raw)
rows = [('asia','ASIA','半岛和岛屿多，西边与另一个大洲相连。'), ('europe','EUROPE','陆地向海洋伸出许多半岛，海岸曲折。'), ('africa','AFRICA','轮廓整体较紧凑，北宽南窄。'), ('northamerica','NORTH AMERICA','北部宽阔，向南逐渐收窄。'), ('southamerica','SOUTH AMERICA','像向南收尖的叶片，东侧鼓出。'), ('oceania','AUSTRALIA','最大的大陆轮廓四面临海，周边还有许多岛屿。'), ('antarctica','ANTARCTICA','这张卡从南极上空看，留意突出的长半岛。')]
output = []
for id, name, hint in rows:
    geometry = next(f['geometry'] for f in geo['features'] if f['properties'].get('FEATURECLA') == 'Continent' and f['properties']['NAME'] == name)
    output.append(dict(id=id, rings=rings(geometry), hint=hint))
# 大洋洲补入原底图中的新西兰、新几内亚东部及太平洋代表岛屿。
script = "global.window=global;require('./world-geo.js');require('./world-data.js');process.stdout.write(JSON.stringify(GEO_WORLD_GEO.countries.filter(c=>GM_COUNTRY_META[c.name]?.[1]==='oceania'&&c.name!=='Australia').flatMap(c=>c.rings)))"
output[5]['rings'] += json.loads(subprocess.check_output(['node','-e',script],cwd=BASE,text=True))
data = dict(continents=output, note='轮廓来自 Natural Earth 地理区域数据，已简化并隐藏国界。通常北朝上；南极洲从南极上空看。大洋洲展示澳大利亚大陆与部分代表岛屿，不表示完整海域范围。', source=dict(label='Natural Earth · Geography Regions', url='https://www.naturalearthdata.com/downloads/110m-physical-vectors/110m-geography-regions/', sha256=hashlib.sha256(raw).hexdigest()))
(BASE/'world-outlines-data.js').write_text('/* 由 scripts/build-world-outlines.py 生成；大洲轮廓只用于辨形。 */\nwindow.GM_WORLD_OUTLINES = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
print('生成七洲教学轮廓：', sum(len(r) for c in output for r in c['rings']), '个顶点')

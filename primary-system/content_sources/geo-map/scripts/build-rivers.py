#!/usr/bin/env python3
"""提取真实河道源。依赖 pyshp==2.3.1、shapely==2.1.2；原始文件放仓库外。

python scripts/build-rivers.py --cache /tmp
所需文件与公开下载地址见 RIVER-SOURCES.md。不会联网或改动原始文件。
"""
import argparse
import hashlib
import json
import xml.etree.ElementTree as ET
from pathlib import Path

import shapefile
import shapely
from shapely.geometry import LineString, MultiLineString, box

ROOT = Path(__file__).resolve().parent.parent


def parts(geom):
    if geom.geom_type == 'LineString':
        yield list(geom.coords)
    elif hasattr(geom, 'geoms'):
        for item in geom.geoms:
            yield from parts(item)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache', type=Path, required=True)
    args = parser.parse_args()
    sources = []
    hydro_path = next((args.cache / 'study-hydrorivers-asia').rglob('*.shp'))
    reader = shapefile.Reader(str(hydro_path))
    archive = args.cache / 'study-hydrorivers-asia.zip'
    sources.append(dict(id='hydrorivers', name='HydroRIVERS v1.0',
                        url='https://www.hydrosheds.org/products/hydrorivers',
                        download='https://data.hydrosheds.org/file/HydroRIVERS/HydroRIVERS_v10_as_shp.zip',
                        sha256=hashlib.sha256(archive.read_bytes()).hexdigest(), license='HydroSHEDS License Agreement',
                        resolution='15 arc-seconds', accessed='2026-11-15'))

    def hydro_chain(start):
        ids, points = [], []
        while start:
            if start in ids:
                raise ValueError('水文河网出现环路')
            record = reader.record(start - 40000001).as_dict()
            if record['HYRIV_ID'] != start:
                raise ValueError('水文 ID 与数据版本不符')
            segment = list(reader.shape(start - 40000001).points)
            if points and max(abs(points[-1][i] - segment[0][i]) for i in (0, 1)) > 1e-7:
                raise ValueError('上下游节点不连续')
            points.extend(segment if not points else segment[1:])
            ids.append(start)
            start = record['NEXT_DOWN']
        return points, ids

    def osm(name, relation_id):
        path = args.cache / f'study-{name}-osm.xml'
        root = ET.parse(path).getroot()
        relation = root.find(f'relation[@id="{relation_id}"]')
        nodes = {n.attrib['id']: (float(n.attrib['lon']), float(n.attrib['lat'])) for n in root.findall('node')}
        ways = {w.attrib['id']: w for w in root.findall('way')}
        members = [m.attrib['ref'] for m in relation.findall('member')
                   if m.attrib['type'] == 'way' and m.attrib.get('role', '') in ('main_stream', '')]
        lines = [[nodes[n.attrib['ref']] for n in ways[way].findall('nd')] for way in members]
        # 仅合并端点完全相同的真实河段，不以距离猜测或跨缺口补线。
        merged = shapely.line_merge(shapely.union_all(MultiLineString(lines)))
        sources.append(dict(id='osm-' + name, name='© OpenStreetMap contributors',
                            url=f'https://www.openstreetmap.org/relation/{relation_id}',
                            download=f'https://api.openstreetmap.org/api/0.6/relation/{relation_id}/full',
                            sha256=hashlib.sha256(path.read_bytes()).hexdigest(), license='ODbL-1.0',
                            version=int(relation.attrib['version']), timestamp=relation.attrib['timestamp'],
                            accessed='2026-11-15', wayIds=[int(way) for way in members]))
        return list(parts(merged))

    yangtze_upper, yangtze_ids = hydro_chain(40563869)
    yangtze_lower = max(osm('yangtze', 9392345), key=len)
    # OSM 长江主关系自宜宾起；上游由真实水文链补充，在共同河段接合。
    if yangtze_lower[0][0] > yangtze_lower[-1][0]:
        yangtze_lower.reverse()
    first = yangtze_lower[0]
    joint = min(range(len(yangtze_upper)), key=lambda i: sum((yangtze_upper[i][k] - first[k])**2 for k in (0, 1)))
    gap = sum((yangtze_upper[joint][k] - first[k])**2 for k in (0, 1))**.5
    if gap > .012:
        raise ValueError(f'长江两资料接合距离过大：{gap}')
    # 保留接合处实际距离与两端坐标，方便复核；不做任意平滑或移线。
    yangtze = [yangtze_upper[:joint + 1] + yangtze_lower]
    yellow = osm('yellow', 171843)
    pearl, pearl_ids = hydro_chain(40937757)
    huai, huai_ids = hydro_chain(40598630)
    # 淮河显示至洪泽湖，不把水文拓扑中的入江通道和长江误标为淮河。
    end = min(range(len(huai)), key=lambda i: (huai[i][0] - 118.62)**2 + (huai[i][1] - 33.20)**2)
    huai = [huai[:end + 1]]
    amur = list(parts(shapely.intersection(MultiLineString(osm('amur', 197653)), box(73, 17, 134.78, 54))))
    canal = osm('canal', 1112801)
    configs = [
        ('f20', yangtze, ['hydrorivers', 'osm-yangtze'], [108.5, 30.5], '长江源区经通天河、金沙江、宜宾至入海口。', yangtze_ids),
        ('f21', yellow, ['osm-yellow'], [109.8, 40.6], '黄河源区至入海口，资料中的湖区缺口保留分段。', []),
        ('f41', [pearl], ['hydrorivers'], [109.8, 23.5], '珠江水系的南盘江—红水河—西江主干，未绘出全部分汊。', pearl_ids),
        ('f40', amur, ['osm-amur'], [125.5, 52.3], '黑龙江中俄边境段，止于抚远附近。', []),
        ('f42', huai, ['hydrorivers'], [116.5, 32.5], '淮河上游至洪泽湖，未将入江水道和长江算作淮河。', huai_ids),
        ('f43', canal, ['osm-canal'], [116.5, 38.5], '京杭大运河主线，原始资料中的缺口保留分段。', []),
    ]
    rivers = {}
    for id, lines, source_ids, anchor, coverage, reaches in configs:
        # 不超过约 30 米的制图简化，远小于地形采样间隔；不改变河道走向。
        paths = [list(LineString(line).simplify(.00025, preserve_topology=True).coords) for line in lines if len(line) >= 2]
        paths = [[[round(x, 6), round(y, 6)] for x, y in line] for line in paths]
        label = min((p for line in paths for p in line), key=lambda p: sum((p[k] - anchor[k])**2 for k in (0, 1)))
        rivers[id] = dict(paths=paths, labelPoint=label, sourceIds=source_ids, coverage=coverage,
                          provenance=dict(reachIds=reaches))
        print(id, len(paths), sum(map(len, paths)), 'label', label, flush=True)
    output = dict(version=1, crs='EPSG:4326', sources=sources, rivers=rivers,
                  processing=dict(simplificationDegrees=.00025, yangtzeJointDegrees=gap))
    (ROOT / 'river-centerlines.json').write_text(json.dumps(output, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()

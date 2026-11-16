#!/usr/bin/env python3
"""从仓库外的 HydroBASINS 和 Natural Earth 快照生成离线水文图层。

uv run --with pyshp==2.3.1 --with shapely==2.1.2 python scripts/build-hydrology.py --cache /tmp
"""
import argparse
import base64
import hashlib
import json
import subprocess
import zipfile
from pathlib import Path

import numpy as np
import shapefile
import shapely
from shapely.geometry import Polygon, LineString

ROOT = Path(__file__).resolve().parent.parent


def parts(geometry, kind):
    if geometry.geom_type == kind:
        yield geometry
    elif hasattr(geometry, 'geoms'):
        for item in geometry.geoms:
            yield from parts(item, kind)


def rings_geometry(rings):
    geometry = Polygon()
    for ring in rings:
        geometry = shapely.symmetric_difference(geometry, shapely.make_valid(Polygon(ring)))
    return geometry


def coordinates(ring):
    return [[round(x, 6), round(y, 6)] for x, y in ring.coords]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache', type=Path, required=True)
    args = parser.parse_args()
    script = "global.window={};for(const f of ['china-geo','china-adventures-data','china-hydrology-data'])require('./'+f+'.js');console.log(JSON.stringify({provinces:window.GEO_CHINA_GEO.provinces,lakes:window.GM_CHINA_ADVENTURES.lakes,meta:window.GM_CHINA_HYDROLOGY}));"
    content = json.loads(subprocess.check_output(['node', '-e', script], cwd=ROOT))
    terrain_file = ROOT / 'china-terrain-data.js'
    terrain = json.loads(terrain_file.read_text().split(' = ', 1)[1].rstrip().removesuffix(';'))
    provinces = {code: rings_geometry(rings) for code, rings in content['provinces'].items()}
    country = shapely.union_all(list(provinces.values()))
    sources = []
    readers = {}
    for key, filename, url in [
        ('basins', 'study-hybas-as-05.zip', 'https://data.hydrosheds.org/file/hydrobasins/standard/hybas_as_lev05_v1c.zip'),
        ('rivers', 'study-ne-rivers.zip', 'https://naciscdn.org/naturalearth/10m/physical/ne_10m_rivers_lake_centerlines.zip'),
    ]:
        archive = args.cache / filename
        destination = args.cache / filename.removesuffix('.zip')
        with zipfile.ZipFile(archive) as z:
            for entry in z.infolist():
                if '..' in Path(entry.filename).parts or Path(entry.filename).is_absolute():
                    raise ValueError('压缩包包含不安全路径')
            z.extractall(destination)
        readers[key] = shapefile.Reader(str(next(destination.glob('*.shp'))))
        sources.append(dict(id=key, url=url, sha256=hashlib.sha256(archive.read_bytes()).hexdigest(), accessed='2026-11-16'))
    records = [(s.record.as_dict(), shapely.make_valid(shapely.geometry.shape(s.shape.__geo_interface__))) for s in readers['basins'].iterShapeRecords()]
    basin_shapes, basins = {}, {}
    for feature, mains in [('f20', [4050009880]), ('f21', [4050007850]), ('f41', [4050012990, 4050012770]), ('f40', [4050000880]), ('f42', [4050009880])]:
        chosen = []
        for record, polygon in records:
            if record['MAIN_BAS'] not in mains or record['ENDO'] != 0:
                continue
            huai = str(record['PFAF_ID']).startswith('4342')
            if feature == 'f20' and huai or feature == 'f42' and not huai:
                continue
            chosen.append((record, polygon))
        geometry = shapely.intersection(shapely.union_all([g for _, g in chosen]), country)
        basin_shapes[feature] = geometry
        simple = geometry.simplify(.018, preserve_topology=True)
        basins[feature] = dict(basinIds=[r['HYBAS_ID'] for r, _ in chosen],
                               polygons=[[coordinates(p.exterior), *[coordinates(h) for h in p.interiors]] for p in parts(simple, 'Polygon') if p.area > .0001],
                               provinceMasks={})
    lake_shapes = {lake['feature']: rings_geometry(lake['rings']) for lake in content['lakes']}
    bed_masks = {id: {} for id in lake_shapes}
    # 掩膜绑定既有地形三角形，运行时直接复用地形顶点，不再用宽泛矩形代替流域。
    for code, record in terrain['provinces'].items():
        packed = np.frombuffer(base64.b64decode(record['vertices']), dtype='<u2').reshape(-1, 3)
        coords = packed[:, :2].astype(float) / terrain['quantization'] + terrain['origin']
        indices = np.frombuffer(base64.b64decode(record['triangles']), dtype='<u2' if record['indexBytes'] == 2 else '<u4').reshape(-1, 3)
        centroids = coords[indices].mean(axis=1)
        for feature, geometry in basin_shapes.items():
            mask = shapely.contains_xy(geometry, centroids[:, 0], centroids[:, 1])
            if not mask.any():
                continue
            basins[feature]['provinceMasks']['p' + code] = dict(triangleCount=len(indices), selectedCount=int(mask.sum()), bits=base64.b64encode(np.packbits(mask, bitorder='little').tobytes()).decode())
        triangles = coords[indices]
        for feature, geometry in lake_shapes.items():
            if not geometry.intersects(provinces[code]):
                continue
            x0,y0,x1,y1 = geometry.bounds
            candidates = np.where((triangles[:,:,0].max(axis=1)>=x0) & (triangles[:,:,0].min(axis=1)<=x1) & (triangles[:,:,1].max(axis=1)>=y0) & (triangles[:,:,1].min(axis=1)<=y1))[0]
            mask = np.zeros(len(indices), dtype=bool)
            mask[candidates] = shapely.intersects(shapely.polygons(triangles[candidates]), geometry)
            if mask.any():
                bed_masks[feature]['p' + code] = dict(triangleCount=len(indices), selectedCount=int(mask.sum()), bits=base64.b64encode(np.packbits(mask, bitorder='little').tobytes()).decode())
    tributaries = {}
    river_records = list(readers['rivers'].iterShapeRecords())
    for branch in content['meta']['tributaries']:
        chosen = [s for s in river_records if s.record['rivernum'] in branch['neNumbers']]
        paths = []
        for record in chosen:
            geometry = shapely.intersection(shapely.geometry.shape(record.shape.__geo_interface__), country)
            paths.extend(coordinates(line.simplify(.002, preserve_topology=True)) for line in parts(geometry, 'LineString') if line.length > .02)
        if not paths:
            raise ValueError('支流资料缺失：' + branch['id'])
        tributaries[branch['id']] = dict(neIds=[s.record['ne_id'] for s in chosen], paths=paths)
    # 湖面按真实轮廓和省界裁切；同一湖的各块共享一个水平高度。
    lakes = {}
    for lake in content['lakes']:
        geometry = lake_shapes[lake['feature']]
        patches = []
        for code, province in provinces.items():
            clipped = shapely.intersection(geometry, province)
            triangles = []
            for triangle in parts(shapely.constrained_delaunay_triangles(clipped), 'Polygon'):
                if triangle.area <= 1e-10:
                    continue
                points = coordinates(triangle.exterior)[:3]
                a,b,c = points
                if (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]) < 0:
                    points[1],points[2] = points[2],points[1]
                triangles.append(points)
            if triangles:
                patches.append(dict(province='p' + code, triangles=triangles))
        lakes[lake['feature']] = dict(patches=patches, bedMasks=bed_masks[lake['feature']])
    output = dict(version=1, terrainSha256=hashlib.sha256(terrain_file.read_bytes()).hexdigest(), sources=sources,
                  basins=basins, tributaries=tributaries, lakes=lakes)
    (ROOT / 'china-hydrology-geo.js').write_text('/* 本地水文几何与地形掩膜；由 scripts/build-hydrology.py 生成。 */\nwindow.GM_CHINA_HYDROLOGY_GEO = ' + json.dumps(output, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print(f'流域 {len(basins)} 处，支流 {len(tributaries)} 条，湖面 {len(lakes)} 处。')


if __name__ == '__main__':
    main()

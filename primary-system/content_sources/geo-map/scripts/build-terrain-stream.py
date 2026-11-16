#!/usr/bin/env python3
"""将已校验的全国 DEM 拆成四度块；概览保留块边界，详细块保留原三角面。

仅构建时依赖 numpy==2.2.6、shapely==2.1.2、scipy==1.16.3、pillow==11.3.0。
随后运行 node scripts/bake-terrain-water.cjs，预计算两级河线，不在浏览器切分全国河道。
"""
import base64
from collections import defaultdict
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess

import numpy as np
import shapely

ROOT = Path(__file__).resolve().parent.parent
SIZE = 4


def read_data(file):
    return json.loads((ROOT / file).read_text().split(' = ', 1)[1].rstrip().removesuffix(';'))


def encode(array):
    return base64.b64encode(array.tobytes()).decode()


def unpack(record):
    vertices = np.frombuffer(base64.b64decode(record['vertices']), dtype='<u2').reshape(-1, 3)
    dtype = '<u2' if record['indexBytes'] == 2 else '<u4'
    triangles = np.frombuffer(base64.b64decode(record['triangles']), dtype=dtype).reshape(-1, 3)
    edges = np.frombuffer(base64.b64decode(record['edges']), dtype=dtype).reshape(-1, 2)
    return vertices, triangles, edges


def pack(vertices, triangles, edges, basins, lakes):
    dtype = '<u2' if len(vertices) < 65536 else '<u4'
    heights = vertices[:, 2].view('<i2')
    return dict(vertexCount=len(vertices), triangleCount=len(triangles), indexBytes=np.dtype(dtype).itemsize,
                minMeters=int(heights.min()), maxMeters=int(heights.max()), vertices=encode(vertices.astype('<u2')),
                triangles=encode(np.asarray(triangles, dtype=dtype)), edges=encode(np.asarray(edges, dtype=dtype)),
                basinFlags=encode(np.asarray(basins, dtype='u1')), lakeFlags=encode(np.asarray(lakes, dtype='u1')),
                render=dict(rivers={}, tributaries={}))


def main():
    full = read_data('china-terrain-data.js')
    hydro = read_data('china-hydrology-geo.js')
    script = "global.window={};require('./china-hydrology-data.js');require('./china-adventures-data.js');console.log(JSON.stringify({basins:window.GM_CHINA_HYDROLOGY.basins.map(b=>b.feature),lakes:window.GM_CHINA_ADVENTURES.lakes}));"
    meta = json.loads(subprocess.check_output(['node', '-e', script], cwd=ROOT))
    source_hash = hashlib.sha256((ROOT / 'china-terrain-data.js').read_bytes()).hexdigest()
    if hydro['terrainSha256'] != source_hash:
        raise ValueError('请先根据当前 DEM 重新生成水文掩膜。')
    spec = importlib.util.spec_from_file_location('terrain_builder', ROOT / 'scripts/build-terrain.py')
    builder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(builder)
    builder.SPACING = .4
    class OverviewDetail:
        def triangles(self, x, y):
            return None
    index = dict(version=1, size=SIZE, origin=full['origin'], quantization=full['quantization'], sourceSha256=source_hash,
                 source={key: full['source'][key] for key in ('name', 'url', 'attribution', 'boundarySHA256')},
                 basinOrder=meta['basins'], lakeOrder=[l['feature'] for l in meta['lakes']], tiles={}, outside={})
    fine_tiles = defaultdict(dict)
    lake_shapes = {l['feature']: builder.province_polygon(l['rings']) for l in meta['lakes']}
    for code, record in full['provinces'].items():
        vertices, triangles, edges = unpack(record)
        coords = vertices[:, :2].astype(float) / full['quantization'] + full['origin']
        heights = vertices[:, 2].view('<i2')
        polygons = shapely.polygons(coords[triangles])
        tree = shapely.STRtree(polygons)
        flags = np.zeros(len(triangles), dtype='u1')
        beds = np.zeros(len(triangles), dtype='u1')
        for bit, name in enumerate(meta['basins']):
            mask = hydro['basins'][name]['provinceMasks'].get('p' + code)
            if mask:
                flags |= np.unpackbits(np.frombuffer(base64.b64decode(mask['bits']), dtype='u1'), bitorder='little')[:len(triangles)] << bit
        for bit, lake in enumerate(meta['lakes']):
            mask = hydro['lakes'][lake['feature']]['bedMasks'].get('p' + code)
            if mask:
                beds |= np.unpackbits(np.frombuffer(base64.b64decode(mask['bits']), dtype='u1'), bitorder='little')[:len(triangles)] << bit
        point_heights = {tuple(v[:2]): int(h) for v, h in zip(vertices, heights)}

        def locate(points):
            matches = tree.query(shapely.points(points), predicate='intersects')
            owners = np.full(len(points), -1, dtype=int)
            owners[matches[0]] = matches[1]
            if np.any(owners < 0):
                # GEOS 运算边缘取整仅用于概览采样，详细块从不改写原顶点。
                owners[owners < 0] = tree.nearest(shapely.points(points[owners < 0]))
            return owners

        def sample(xs, ys):
            points = np.column_stack([xs, ys])
            owners = locate(points)
            abc = coords[triangles[owners]]
            a, b, c = abc[:, 0], abc[:, 1], abc[:, 2]
            den = (b[:, 1]-c[:, 1])*(a[:, 0]-c[:, 0])+(c[:, 0]-b[:, 0])*(a[:, 1]-c[:, 1])
            u = ((b[:, 1]-c[:, 1])*(points[:, 0]-c[:, 0])+(c[:, 0]-b[:, 0])*(points[:, 1]-c[:, 1]))/den
            v = ((c[:, 1]-a[:, 1])*(points[:, 0]-c[:, 0])+(a[:, 0]-c[:, 0])*(points[:, 1]-c[:, 1]))/den
            result = u*heights[triangles[owners, 0]]+v*heights[triangles[owners, 1]]+(1-u-v)*heights[triangles[owners, 2]]
            keys = np.rint((points-full['origin'])*full['quantization']).astype(int)
            return np.asarray([point_heights.get(tuple(key), value) for key, value in zip(keys, result)])

        centers = coords[triangles].mean(axis=1)
        cells = np.floor((centers-full['origin'])/SIZE).astype(int)
        delta = coords[edges[:, 1]]-coords[edges[:, 0]]
        inward = np.column_stack([-delta[:, 1], delta[:, 0]])
        inward /= np.maximum(np.linalg.norm(inward, axis=1)[:, None], 1e-12)
        edge_cells = np.floor((coords[edges].mean(axis=1)+inward*1e-7-full['origin'])/SIZE).astype(int)
        for gx, gy in np.unique(cells, axis=0):
            key = f't{gx}-{gy}'
            chosen = np.flatnonzero((cells[:, 0] == gx) & (cells[:, 1] == gy))
            # 原网格与四度边缘对齐，边界上省界线归入相邻任一实际有面的块。
            selected_edges = edges[(edge_cells[:, 0] == gx) & (edge_cells[:, 1] == gy)]
            selected_edges = selected_edges[np.all(np.isin(selected_edges, triangles[chosen]), axis=1)]
            used = np.unique(np.concatenate([triangles[chosen].ravel(), selected_edges.ravel()]))
            remap = np.zeros(len(vertices), dtype=np.uint32)
            remap[used] = np.arange(len(used))
            fine_tiles[key][code] = pack(vertices[used], remap[triangles[chosen]], remap[selected_edges], flags[chosen], beds[chosen])
            try:
                polygon = shapely.make_valid(shapely.coverage_union_all(polygons[chosen]))
            except shapely.errors.GEOSException:
                polygon = shapely.make_valid(shapely.union_all(polygons[chosen], grid_size=.001))
            polygon = shapely.union_all(list(builder.polygons(polygon)))
            if not polygon.is_valid:
                polygon = shapely.union_all(polygons[chosen], grid_size=.001)
            coarse = builder.mesh_for(polygon, sample, OverviewDetail())
            cv, ct, _ = unpack(coarse)
            cc = cv[:, :2].astype(float)/full['quantization']+full['origin']
            # 概览修复极小面片时仍保留全部原省界线，省界和侧壁不随细节级别消失。
            coarse_vertices = list(cv)
            coarse_lookup = {tuple(v[:2]): i for i, v in enumerate(coarse_vertices)}
            coarse_edges = []
            for edge in selected_edges:
                pair = []
                for vertex_id in edge:
                    point = tuple(vertices[vertex_id, :2])
                    if point not in coarse_lookup:
                        coarse_lookup[point] = len(coarse_vertices)
                        coarse_vertices.append(vertices[vertex_id])
                    pair.append(coarse_lookup[point])
                coarse_edges.append(pair)
            owners = locate(cc[ct].mean(axis=1))
            lake_flags = np.zeros(len(ct), dtype='u1')
            for bit, lake in enumerate(meta['lakes']):
                shape = lake_shapes[lake['feature']]
                if shape.intersects(polygon):
                    lake_flags |= shapely.intersects(shapely.polygons(cc[ct]), shape).astype('u1') << bit
            item = index['tiles'].setdefault(key, dict(bounds=[full['origin'][0]+int(gx)*SIZE, full['origin'][1]+int(gy)*SIZE,
                                                               full['origin'][0]+(int(gx)+1)*SIZE, full['origin'][1]+(int(gy)+1)*SIZE],
                                                       file=f'assets/terrain/{key}.js', coarse={}))
            item['coarse'][code] = pack(np.asarray(coarse_vertices), ct, coarse_edges, flags[owners], lake_flags)
        print('已拆分省份', code, flush=True)
    directory = ROOT / 'assets/terrain'
    directory.mkdir(exist_ok=True)
    for key, records in fine_tiles.items():
        payload = dict(version=1, key=key, sourceSha256=source_hash, provinces=records)
        data = ("window.GMChinaTerrainStream.receive("+json.dumps(key)+","+json.dumps(payload, separators=(',', ':'))+");\n").encode()
        (ROOT/index['tiles'][key]['file']).write_bytes(data)
        index['tiles'][key].update(bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
    (ROOT/'china-terrain-index.js').write_text('/* 本地概览与详细块目录，由 scripts/build-terrain-stream.py 生成。 */\nwindow.GM_CHINA_TERRAIN_INDEX = '+json.dumps(index, ensure_ascii=False, separators=(',', ':'))+';\n')
    print('概览与详细块已生成，下一步预烘焙河线。', len(index['tiles']), flush=True)


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""裁切真实 DEM 为本地中国地形网格，不在学习页面请求网络。

构建依赖：numpy==2.2.6 shapely==2.1.2 pillow==11.3.0 scipy==1.16.3。
用法：python scripts/build-terrain.py --cache /tmp/study-terrain-tiles
缓存存放原 PNG 与来源头；--offline 可只用已有缓存重建。
"""
import argparse
import base64
import hashlib
import io
import json
import math
import time
import urllib.request
from collections import Counter
from bisect import bisect_right, bisect_left
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
import shapely
from PIL import Image
from shapely.geometry import Polygon, box
from scipy.spatial import Delaunay, cKDTree
from scipy.ndimage import median_filter

ROOT = Path(__file__).resolve().parent.parent
SPACING = .08
ORIGIN = (73, 17)
ZOOM = 6
RIVER_ZOOM = 9
RIVER_SPACING = .01
URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'


def tile_xy(lon, lat, zoom=ZOOM):
    return ((lon + 180) / 360 * 2**zoom,
            (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * 2**zoom)


def load_tile(task, cache, offline):
    zoom, x, y = task
    path = cache / f'{zoom}-{x}-{y}.png'
    meta = path.with_suffix('.json')
    url = URL.format(z=zoom, x=x, y=y)
    if not path.exists() or not meta.exists():
        if offline:
            raise ValueError(f'缺少离线源瓦片：{path}')
        for attempt in range(3):
            try:
                with urllib.request.urlopen(url, timeout=40) as response:
                    raw = response.read()
                    record = dict(url=url, version=response.headers.get('x-amz-version-id', ''),
                                  imagery=response.headers.get('x-amz-meta-x-imagery-sources', ''),
                                  modified=response.headers.get('Last-Modified', ''),
                                  sha256=hashlib.sha256(raw).hexdigest())
                # 写缓存前校验尺寸，错误响应不得成为高程源。
                with Image.open(io.BytesIO(raw)) as image:
                    if image.size != (256, 256):
                        raise ValueError(f'瓦片尺寸异常：{url}')
                path.write_bytes(raw)
                meta.write_text(json.dumps(record, ensure_ascii=False), encoding='utf-8')
                break
            except Exception:
                if attempt == 2:
                    raise
                time.sleep(attempt + 1)
    record = json.loads(meta.read_text(encoding='utf-8'))
    raw = path.read_bytes()
    if hashlib.sha256(raw).hexdigest() != record['sha256']:
        raise ValueError(f'瓦片校验和不符：{path}')
    rgb = np.asarray(Image.open(io.BytesIO(raw)).convert('RGB'), dtype=np.float32)
    # Terrarium 的 G 通道单位是米；不能使用 Mapbox Terrain-RGB 的解码公式。
    elevation = rgb[:, :, 0] * 256 + rgb[:, :, 1] + rgb[:, :, 2] / 256 - 32768
    if np.any(elevation < -12000) or np.any(elevation > 9000):
        raise ValueError(f'瓦片缺值或高程异常：{url}')
    return x, y, elevation, record


def province_polygon(rings):
    # 原轮廓以 even-odd 表达外环和内环；异或保留孔洞、飞地与独立小岛。
    result = Polygon()
    for ring in rings:
        polygon = shapely.make_valid(Polygon(ring))
        if polygon.area > 1e-9:
            result = result.symmetric_difference(polygon)
    return result


def polygons(geometry):
    if geometry.geom_type == 'Polygon':
        yield geometry
    elif hasattr(geometry, 'geoms'):
        for part in geometry.geoms:
            yield from polygons(part)


class RiverDetail:
    """河谷局部加密；在相邻粗细单元间增加相同边界节点，避免接缝。"""
    def __init__(self, rivers):
        dense, self.vertices = [], {}
        for river in rivers.values():
            for line in river['paths']:
                for a, b in zip(line, line[1:]):
                    steps = max(1, math.ceil(math.dist(a, b) / .005))
                    dense.extend(np.linspace(a, b, steps + 1).tolist())
                for point in line:
                    qx, qy = (round((point[i] - ORIGIN[i]) * 1000) for i in (0, 1))
                    xs = [qx // 80] + ([qx // 80 - 1] if qx % 80 == 0 else [])
                    ys = [qy // 80] + ([qy // 80 - 1] if qy % 80 == 0 else [])
                    # 位于单元边上的河道节点必须同时交给两侧，避免 T 形接缝。
                    for ix in xs:
                        for iy in ys:
                            self.vertices.setdefault((ix, iy), []).append(point)
        self.points = np.asarray(dense)
        self.tree = cKDTree(self.points)
        candidates = set()
        for point in self.points:
            ix, iy = (math.floor((point[i] - ORIGIN[i]) / SPACING) for i in range(2))
            candidates.update((ix + dx, iy + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1))
        ordered = sorted(candidates)
        centers = np.asarray(ordered) * SPACING + ORIGIN + np.array([SPACING / 2] * 2)
        distances = self.tree.query(centers)[0]
        self.cells = {key for key, distance in zip(ordered, distances) if distance < .07}
        self.cache = {}

    def triangles(self, x, y):
        key = tuple(round((v - ORIGIN[i]) / SPACING) for i, v in enumerate((x, y)))
        ix, iy = key
        refined = key in self.cells
        near = [(ix - 1, iy) in self.cells, (ix + 1, iy) in self.cells,
                (ix, iy - 1) in self.cells, (ix, iy + 1) in self.cells]
        if not refined and not any(near):
            return None
        if key in self.cache:
            return self.cache[key]
        qx, qy = ix * 80, iy * 80
        points = [(qx, qy), (qx + 80, qy), (qx + 80, qy + 80), (qx, qy + 80)]
        if refined:
            points.extend((qx + dx, qy + dy) for dx in range(0, 81, 10) for dy in range(0, 81, 10))
            points.extend(tuple(round((p[i] - ORIGIN[i]) * 1000) for i in (0, 1)) for p in self.vertices.get(key, []))
        else:
            for value in range(10, 80, 10):
                if near[0]: points.append((qx, qy + value))
                if near[1]: points.append((qx + 80, qy + value))
                if near[2]: points.append((qx + value, qy))
                if near[3]: points.append((qx + value, qy + 80))
        points = np.asarray(sorted(set(points))) / 1000 + ORIGIN
        triangles = points[Delaunay(points).simplices]
        self.cache[key] = triangles
        return triangles


def mesh_for(polygon, sample, detail):
    # 在网格的实际存储精度上做裁切，避免事后取整让细小边界三角形重叠。
    polygon = shapely.set_precision(polygon, .001)
    west, south, east, north = polygon.bounds
    xs = ORIGIN[0] + np.arange(math.floor((west - ORIGIN[0]) / SPACING), math.ceil((east - ORIGIN[0]) / SPACING)) * SPACING
    ys = ORIGIN[1] + np.arange(math.floor((south - ORIGIN[1]) / SPACING), math.ceil((north - ORIGIN[1]) / SPACING)) * SPACING
    gx, gy = np.meshgrid(xs, ys)
    cells = shapely.set_precision(shapely.box(gx.ravel(), gy.ravel(), gx.ravel() + SPACING, gy.ravel() + SPACING), .001)
    covered = shapely.covers(polygon, cells)
    partial = shapely.intersects(polygon, cells) & ~covered
    coordinates, lookup, triangles = [], {}, []

    def vertex(point):
        key = tuple(int(round((point[i] - ORIGIN[i]) * 1000)) for i in range(2))
        if key not in lookup:
            lookup[key] = len(coordinates)
            coordinates.append(key)
        return lookup[key]

    def triangle(points):
        ids = [vertex(point) for point in points]
        a, b, c = (coordinates[i] for i in ids)
        cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
        if cross:
            triangles.append(ids if cross > 0 else [ids[0], ids[2], ids[1]])

    for x, y in zip(gx.ravel()[covered], gy.ravel()[covered]):
        detailed = detail.triangles(x, y)
        if detailed is not None:
            for tri in detailed:
                triangle(tri)
            continue
        a, b, c, d = (x, y), (x + SPACING, y), (x + SPACING, y + SPACING), (x, y + SPACING)
        triangle([a, b, c])
        triangle([a, c, d])
    for cell in cells[partial]:
        x, y, _, _ = cell.bounds
        detailed = detail.triangles(x, y)
        pieces = shapely.intersection(polygon, shapely.polygons(detailed), grid_size=.001) if detailed is not None else [shapely.intersection(polygon, cell, grid_size=.001)]
        for piece in pieces:
            for part in polygons(piece):
                if part.area < 1e-10:
                    continue
                for tri in shapely.constrained_delaunay_triangles(part).geoms:
                    triangle(list(tri.exterior.coords)[:3])
    # 裁切省界也会在单元边上添点；将这些点补进相邻完整三角形，封闭 T 形接缝。
    vertical, horizontal = {}, {}
    for index, (x, y) in enumerate(coordinates):
        if x % 80 == 0: vertical.setdefault(x, []).append((y, index))
        if y % 80 == 0: horizontal.setdefault(y, []).append((x, index))
    for entries in [*vertical.values(), *horizontal.values()]: entries.sort()
    old_triangles, triangles = triangles, []
    for tri in old_triangles:
        ring = []
        for a, b in zip(tri, tri[1:] + tri[:1]):
            ax, ay = coordinates[a]; bx, by = coordinates[b]
            ring.append(coordinates[a])
            entries, low, high = [], 0, 0
            if ax == bx and ax % 80 == 0: entries, low, high = vertical[ax], ay, by
            if ay == by and ay % 80 == 0: entries, low, high = horizontal[ay], ax, bx
            if entries:
                extra = entries[bisect_right(entries, (min(low, high), float('inf'))):bisect_left(entries, (max(low, high), -1))]
                if high < low: extra = extra[::-1]
                ring.extend(coordinates[index] for _, index in extra)
        if len(ring) == 3:
            triangles.append(tri)
        else:
            for part in shapely.constrained_delaunay_triangles(Polygon(ring)).geoms:
                points = np.asarray(part.exterior.coords[:3]) / 1000 + ORIGIN
                triangle(points)
    coords = np.asarray(coordinates, dtype='<u2')
    lonlat = coords.astype(float) / 1000 + ORIGIN
    heights = sample(lonlat[:, 0], lonlat[:, 1])
    # 顶点各 6 字节：经度偏移 uint16、纬度偏移 uint16、海拔 int16。
    vertices = np.empty((len(coords), 3), dtype='<u2')
    vertices[:, :2] = coords
    vertices[:, 2] = np.rint(heights).astype('<i2').view('<u2')
    index_bytes = 2 if len(coords) < 65536 else 4
    dtype = '<u2' if index_bytes == 2 else '<u4'
    edge_counts = Counter()
    oriented = {}
    for tri in triangles:
        for a, b in zip(tri, tri[1:] + tri[:1]):
            key = tuple(sorted((a, b)))
            edge_counts[key] += 1
            oriented[key] = (a, b)
    if any(count > 2 for count in edge_counts.values()):
        edge = next(edge for edge, count in edge_counts.items() if count > 2)
        related = [tri for tri in triangles if all(v in tri for v in edge)]
        raise ValueError(f'地形出现重叠三角形：{[coordinates[i] for i in edge]}，{[[coordinates[i] for i in tri] for tri in related]}')
    edges = [oriented[key] for key, count in edge_counts.items() if count == 1]
    encode = lambda array: base64.b64encode(array.tobytes()).decode('ascii')
    return dict(vertexCount=len(coords), triangleCount=len(triangles), indexBytes=index_bytes,
                minMeters=int(np.min(heights)), maxMeters=int(np.max(heights)),
                vertices=encode(vertices), triangles=encode(np.asarray(triangles, dtype=dtype)),
                edges=encode(np.asarray(edges, dtype=dtype)))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache', required=True, type=Path)
    parser.add_argument('--offline', action='store_true')
    args = parser.parse_args()
    args.cache.mkdir(parents=True, exist_ok=True)
    geo_source = (ROOT / 'china-geo.js').read_text(encoding='utf-8')
    geo = json.loads(geo_source.split('=', 1)[1].strip().rstrip(';'))
    regions = {code: province_polygon(rings) for code, rings in geo['provinces'].items()}
    mainland = shapely.union_all(list(regions.values()))
    inland = mainland.buffer(-.12)
    centerline_path = ROOT / 'river-centerlines.json'
    rivers = json.loads(centerline_path.read_text(encoding='utf-8'))
    centerlines_hash = hashlib.sha256(centerline_path.read_bytes()).hexdigest()
    detail = RiverDetail(rivers['rivers'])
    print(f'河谷加密单元：{len(detail.cells)}', flush=True)
    x0, y0 = map(math.floor, tile_xy(73, 54))
    x1, y1 = map(math.floor, tile_xy(136, 17))
    raster = np.empty(((y1 - y0 + 1) * 256, (x1 - x0 + 1) * 256), dtype=np.float32)
    tasks = [(ZOOM, x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]
    records = []
    with ThreadPoolExecutor(max_workers=6) as executor:
        for count, (x, y, tile, record) in enumerate(executor.map(lambda task: load_tile(task, args.cache, args.offline), tasks), 1):
            raster[(y - y0) * 256:(y - y0 + 1) * 256, (x - x0) * 256:(x - x0 + 1) * 256] = tile
            records.append(record)
            if count % 10 == 0:
                print(f'高程瓦片 {count}/{len(tasks)}', flush=True)

    river_tasks = set()
    # 以真实河线为中心预取高分辨率 DEM，包含插值和渐变过渡所需边缘。
    for lon, lat in detail.points[::2]:
        left, top = map(math.floor, tile_xy(lon - .16, lat + .16, RIVER_ZOOM))
        right, bottom = map(math.floor, tile_xy(lon + .16, lat - .16, RIVER_ZOOM))
        river_tasks.update((RIVER_ZOOM, x, y) for x in range(left, right + 1) for y in range(top, bottom + 1))
    river_tiles, river_records = {}, []
    with ThreadPoolExecutor(max_workers=6) as executor:
        for count, (x, y, tile, record) in enumerate(executor.map(lambda task: load_tile(task, args.cache, args.offline), sorted(river_tasks)), 1):
            # SRTM 少数陆地像元有极端负值毛刺，不能把它画成峡谷中的深洞。
            rows, columns = np.where(tile < -500)
            if len(rows):
                lon = (x + (columns + .5) / 256) / 2**RIVER_ZOOM * 360 - 180
                mercator = np.pi * (1 - 2 * (y + (rows + .5) / 256) / 2**RIVER_ZOOM)
                lat = np.degrees(np.arctan(np.sinh(mercator)))
                invalid = shapely.contains_xy(inland, lon, lat)
                if np.any(invalid):
                    filtered = median_filter(tile, size=5, mode='nearest')
                    tile[rows[invalid], columns[invalid]] = filtered[rows[invalid], columns[invalid]]
                    record['invalidLandPixelsRepaired'] = int(invalid.sum())
            river_tiles[x, y] = tile
            river_records.append(record)
            if count % 20 == 0:
                print(f'河谷 DEM {count}/{len(river_tasks)}', flush=True)

    def river_sample(lon, lat):
        px = (lon + 180) / 360 * 2**RIVER_ZOOM * 256 - .5
        py = (1 - np.arcsinh(np.tan(np.radians(lat))) / np.pi) / 2 * 2**RIVER_ZOOM * 256 - .5
        ix, iy = np.floor(px).astype(int), np.floor(py).astype(int)
        dx, dy = px - ix, py - iy
        result = np.zeros(len(lon))
        for ox, oy, weight in [(0, 0, (1-dx)*(1-dy)), (1, 0, dx*(1-dy)), (0, 1, (1-dx)*dy), (1, 1, dx*dy)]:
            tx, ty = (ix + ox) // 256, (iy + oy) // 256
            for x, y in np.unique(np.column_stack((tx, ty)), axis=0):
                mask = (tx == x) & (ty == y)
                result[mask] += river_tiles[x, y][(iy[mask] + oy) % 256, (ix[mask] + ox) % 256] * weight[mask]
        return result

    def sample(lon, lat):
        # 像元中心的双线性插值，瓦片边缘也从同一拼接栅格读取。
        px = ((lon + 180) / 360 * 2**ZOOM - x0) * 256 - .5
        py = ((1 - np.arcsinh(np.tan(np.radians(lat))) / np.pi) / 2 * 2**ZOOM - y0) * 256 - .5
        ix, iy = np.floor(px).astype(int), np.floor(py).astype(int)
        dx, dy = px - ix, py - iy
        z = ((1 - dx) * (1 - dy) * raster[iy, ix] + dx * (1 - dy) * raster[iy, ix + 1] +
             (1 - dx) * dy * raster[iy + 1, ix] + dx * dy * raster[iy + 1, ix + 1])
        distance = detail.tree.query(np.column_stack((lon, lat)))[0]
        weight = np.clip((.12 - distance) / .08, 0, 1)
        high = weight > 0
        if np.any(high):
            z[high] = z[high] * (1 - weight[high]) + river_sample(lon[high], lat[high]) * weight[high]
        # 简化海岸与 DEM 像元不完全吻合，海岸负值收至海平面，内陆洼地保留。
        coastal_negative = (z < 0) & ~shapely.contains_xy(inland, lon, lat)
        return np.where(coastal_negative, 0, z)

    meshes = {}
    for code, polygon in regions.items():
        meshes[code] = mesh_for(polygon, sample, detail)
        print(f'{code}：{meshes[code]["vertexCount"]} 顶点，{meshes[code]["triangleCount"]} 三角形', flush=True)
    # 验收点只作数据方向与高低检查，不作为山峰的精确高度。
    checks = dict(plateau=[86, 33.5], plain=[116, 36], basin=[83, 39.5], himalaya=[86.9, 28.1], tianShan=[84, 43.2], turpan=[89.2, 42.7])
    probes = {key: dict(point=point, meters=int(round(sample(np.array([point[0]]), np.array([point[1]]))[0]))) for key, point in checks.items()}
    output = dict(version=2, encoding='base64-le', quantization=1000, spacing=SPACING, riverSpacing=RIVER_SPACING, origin=ORIGIN,
                  source=dict(name='Mapzen Terrain Tiles', url='https://registry.opendata.aws/terrain-tiles/',
                              attribution='https://github.com/tilezen/joerd/blob/master/docs/attribution.md',
                              accessed='2026-11-15', zoom=ZOOM, tiles=records, riverZoom=RIVER_ZOOM, riverTiles=river_records,
                              centerlinesSHA256=centerlines_hash,
                              qualityControl='陆地低于负 500 米的异常像元使用邻域中值替代，原瓦片校验和保留。',
                              boundarySHA256=hashlib.sha256((ROOT / 'china-geo.js').read_bytes()).hexdigest()),
                  probes=probes, provinces=meshes)
    target = ROOT / 'china-terrain-data.js'
    target.write_text('/* 真实高程采样网格，由 scripts/build-terrain.py 生成。出处与瓦片校验和见 source。 */\nwindow.GM_CHINA_TERRAIN = ' + json.dumps(output, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
    print(f'已生成 {target.name}，{target.stat().st_size / 1024 / 1024:.2f} MiB；采样检查：{probes}')
    for river in rivers['rivers'].values():
        paths = []
        for line in river['paths']:
            points = np.asarray(line)
            heights = sample(points[:, 0], points[:, 1])
            paths.append([[*point, round(float(z))] for point, z in zip(line, heights)])
        river['paths'] = paths
        river['labelPoint'] = next(p for line in paths for p in line if p[:2] == river['labelPoint'])
    rivers['centerlinesSHA256'] = centerlines_hash
    (ROOT / 'china-rivers-data.js').write_text('/* 真实河道中心线及 DEM 高程。来源、许可与版本随数据保存。 */\nwindow.GM_CHINA_RIVERS = ' + json.dumps(rivers, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')


if __name__ == '__main__':
    main()

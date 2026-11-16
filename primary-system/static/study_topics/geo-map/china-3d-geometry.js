/* 真实高程网格的解码、着色与采样。无 DOM、无联网，供浏览器和回归测试共用。 */
window.GMChina3DGeometry = (() => {
  'use strict';
  const T = window.GMThree;
  // 沿用原地图的等经距示意投影；纵向一单位约为 111.32 / 1.22 千米。
  const metersPerUnit = 111320 / 1.22;
  const datum = .9; // 模型基座，不计入海拔。
  const xy = ([lng, lat]) => [lng - 104.5, (lat - 35.8) * 1.22];
  const heightToZ = (meters, exaggeration) => datum + meters / metersPerUnit * exaggeration;
  const elevationFromZ = (z, exaggeration) => (z - datum) * metersPerUnit / exaggeration;
  const bytes = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));
  const colorStops = window.GM_CHINA_3D.terrain.stops.map(stop => ({ ...stop, color: new T.Color(stop.color) }));
  function terrainColor(meters) {
    if (meters <= colorStops[0].meters) return colorStops[0].color.clone();
    for (let i = 1; i < colorStops.length; i++) {
      const low = colorStops[i - 1], high = colorStops[i];
      if (meters <= high.meters) return low.color.clone().lerp(high.color, (meters - low.meters) / (high.meters - low.meters));
    }
    return colorStops.at(-1).color.clone();
  }
  function decode(record, source = window.GM_CHINA_TERRAIN) {
    const raw = bytes(record.vertices), trianglesRaw = bytes(record.triangles), edgesRaw = bytes(record.edges);
    if (raw.length !== record.vertexCount * 6 || trianglesRaw.length !== record.triangleCount * 3 * record.indexBytes) throw new Error('高程网格长度不符');
    const view = new DataView(raw.buffer);
    const positions = new Float32Array(record.vertexCount * 3), elevations = new Int16Array(record.vertexCount);
    for (let i = 0; i < record.vertexCount; i++) {
      const point = [source.origin[0] + view.getUint16(i * 6, true) / source.quantization,
        source.origin[1] + view.getUint16(i * 6 + 2, true) / source.quantization];
      const [x, y] = xy(point), meters = view.getInt16(i * 6 + 4, true);
      positions.set([x, y, meters / metersPerUnit], i * 3);
      elevations[i] = meters;
    }
    const readIndices = buffer => {
      if (![2, 4].includes(record.indexBytes) || buffer.length % record.indexBytes) throw new Error('高程索引格式无效');
      const sourceView = new DataView(buffer.buffer);
      const indices = new (record.indexBytes === 2 ? Uint16Array : Uint32Array)(buffer.length / record.indexBytes);
      for (let i = 0; i < indices.length; i++) {
        indices[i] = record.indexBytes === 2 ? sourceView.getUint16(i * 2, true) : sourceView.getUint32(i * 4, true);
        if (indices[i] >= record.vertexCount) throw new Error('高程索引越界');
      }
      return indices;
    };
    return { positions, elevations, indices: readIndices(trianglesRaw), edges: readIndices(edgesRaw) };
  }
  function buildTerrain(record) {
    const decoded = decode(record);
    const { positions, elevations, indices, edges } = decoded;
    const top = new T.BufferGeometry();
    top.setAttribute('position', new T.BufferAttribute(positions, 3));
    top.setIndex(new T.BufferAttribute(indices, 1));
    const colors = new Float32Array(positions.length);
    for (let i = 0; i < elevations.length; i++) terrainColor(elevations[i]).toArray(colors, i * 3);
    top.setAttribute('color', new T.BufferAttribute(colors, 3));
    top.computeVertexNormals();
    top.computeBoundingSphere();
    const edgePoints = [], walls = [];
    const bottom = -1000 / metersPerUnit;
    for (let i = 0; i < edges.length; i += 2) {
      const a = Array.from(positions.subarray(edges[i] * 3, edges[i] * 3 + 3));
      const b = Array.from(positions.subarray(edges[i + 1] * 3, edges[i + 1] * 3 + 3));
      // 侧壁沿真实边界向下切，省份之间不抬高、不横移，地势保持连续。
      edgePoints.push(...a, ...b);
      walls.push(...a, a[0], a[1], bottom, b[0], b[1], bottom,
        ...a, b[0], b[1], bottom, ...b);
    }
    const outline = new T.BufferGeometry();
    outline.setAttribute('position', new T.Float32BufferAttribute(edgePoints, 3));
    const side = new T.BufferGeometry();
    side.setAttribute('position', new T.Float32BufferAttribute(walls, 3));
    side.computeVertexNormals();
    return { ...decoded, top, side, outline };
  }
  function heightAt(mesh, point) {
    const [x, y] = xy(point), p = mesh.positions, ids = mesh.indices;
    for (let i = 0; i < ids.length; i += 3) {
      const ia = ids[i] * 3, ib = ids[i + 1] * 3, ic = ids[i + 2] * 3;
      const ax = p[ia], ay = p[ia + 1], bx = p[ib], by = p[ib + 1], cx = p[ic], cy = p[ic + 1];
      if (x < Math.min(ax, bx, cx) - 1e-5 || x > Math.max(ax, bx, cx) + 1e-5 || y < Math.min(ay, by, cy) - 1e-5 || y > Math.max(ay, by, cy) + 1e-5) continue;
      const denominator = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
      if (Math.abs(denominator) < 1e-12) continue;
      const a = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / denominator;
      const b = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / denominator;
      if (a >= -1e-5 && b >= -1e-5 && a + b <= 1.00001) return a * mesh.elevations[ids[i]] + b * mesh.elevations[ids[i + 1]] + (1 - a - b) * mesh.elevations[ids[i + 2]];
    }
    return null;
  }
  function labelHeight(mesh, point) {
    const actual = heightAt(mesh, point);
    if (actual !== null) return actual;
    // 省名的排版中心可能落在凹形省界之外；只为标签选最近顶点，不当作读数。
    const [x, y] = xy(point);
    let nearest = 0, distance = Infinity;
    for (let i = 0; i < mesh.elevations.length; i++) {
      const next = (mesh.positions[i * 3] - x) ** 2 + (mesh.positions[i * 3 + 1] - y) ** 2;
      if (next < distance) { distance = next; nearest = i; }
    }
    return mesh.elevations[nearest];
  }
  function createSurfaceSampler(meshes) {
    // 建立三角形空间索引，河流的密集采样不逐点扫描全国网格。
    const cells = new Map(), cellSize = .1;
    const cell = value => Math.floor(value / cellSize);
    for (const mesh of meshes) {
      const p = mesh.positions, ids = mesh.indices;
      for (let i = 0; i < ids.length; i += 3) {
        const a = ids[i] * 3, b = ids[i + 1] * 3, c = ids[i + 2] * 3;
        const entry = { mesh, i };
        for (let x = cell(Math.min(p[a], p[b], p[c])); x <= cell(Math.max(p[a], p[b], p[c])); x++) {
          for (let y = cell(Math.min(p[a + 1], p[b + 1], p[c + 1])); y <= cell(Math.max(p[a + 1], p[b + 1], p[c + 1])); y++) {
            const key = `${x},${y}`;
            if (!cells.has(key)) cells.set(key, []);
            cells.get(key).push(entry);
          }
        }
      }
    }
    const locate = point => {
      const [x, y] = xy(point);
      let highest = null, owner = null;
      for (const { mesh, i } of cells.get(`${cell(x)},${cell(y)}`) || []) {
        const p = mesh.positions, ids = mesh.indices;
        const a = ids[i] * 3, b = ids[i + 1] * 3, c = ids[i + 2] * 3;
        const denominator = (p[b + 1] - p[c + 1]) * (p[a] - p[c]) + (p[c] - p[b]) * (p[a + 1] - p[c + 1]);
        if (Math.abs(denominator) < 1e-12) continue;
        const u = ((p[b + 1] - p[c + 1]) * (x - p[c]) + (p[c] - p[b]) * (y - p[c + 1])) / denominator;
        const v = ((p[c + 1] - p[a + 1]) * (x - p[c]) + (p[a] - p[c]) * (y - p[c + 1])) / denominator;
        if (u >= -1e-5 && v >= -1e-5 && u + v <= 1.00001) {
          const meters = u * mesh.elevations[ids[i]] + v * mesh.elevations[ids[i + 1]] + (1 - u - v) * mesh.elevations[ids[i + 2]];
          // 简化省界可能微量重叠，河道应贴可见的上表面。
          if (highest === null || meters > highest) { highest = meters; owner = mesh; }
        }
      }
      return highest === null ? null : { meters: highest, mesh: owner };
    };
    const sample = point => locate(point)?.meters ?? null;
    sample.locate = locate;
    // 将河段在地形三角形边上切开，线段中部也贴住表面，而非只贴住两个端点。
    sample.cuts = (from, to) => {
      const [x0, y0] = xy(from), [x1, y1] = xy(to), candidates = new Set();
      for (let x = cell(Math.min(x0, x1)); x <= cell(Math.max(x0, x1)); x++) {
        for (let y = cell(Math.min(y0, y1)); y <= cell(Math.max(y0, y1)); y++) {
          for (const entry of cells.get(`${x},${y}`) || []) candidates.add(entry);
        }
      }
      const cuts = [0, 1];
      for (const { mesh, i } of candidates) {
        const p = mesh.positions, ids = mesh.indices;
        const a = ids[i] * 3, b = ids[i + 1] * 3, c = ids[i + 2] * 3;
        const d = (p[b + 1] - p[c + 1]) * (p[a] - p[c]) + (p[c] - p[b]) * (p[a + 1] - p[c + 1]);
        if (Math.abs(d) < 1e-12) continue;
        const weights = (x, y) => {
          const u = ((p[b + 1] - p[c + 1]) * (x - p[c]) + (p[c] - p[b]) * (y - p[c + 1])) / d;
          const v = ((p[c + 1] - p[a + 1]) * (x - p[c]) + (p[a] - p[c]) * (y - p[c + 1])) / d;
          return [u, v, 1 - u - v];
        };
        const start = weights(x0, y0), end = weights(x1, y1);
        let lo = 0, hi = 1;
        for (let j = 0; j < 3 && lo <= hi; j++) {
          const delta = end[j] - start[j];
          if (Math.abs(delta) < 1e-12) { if (start[j] < -1e-9) hi = -1; }
          else if (delta > 0) lo = Math.max(lo, -start[j] / delta);
          else hi = Math.min(hi, -start[j] / delta);
        }
        if (lo < hi && hi >= 0 && lo <= 1) cuts.push(Math.max(0, lo), Math.min(1, hi));
      }
      return cuts.sort((a, b) => a - b).filter((t, i, all) => i === 0 || t - all[i - 1] > 1e-8);
    };
    return sample;
  }
  function drapeLine(line, sample, spacing = .02) {
    const paths = [], samples = [];
    let path = [];
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1], b = line[i];
      const steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / spacing));
      for (let j = i === 1 ? 0 : 1; j <= steps; j++) {
        const point = [a[0] + (b[0] - a[0]) * j / steps, a[1] + (b[1] - a[1]) * j / steps];
        const meters = sample(point);
        // 数据范围外不编造高程，也不跨过空白连接河段。
        if (meters === null) {
          if (path.length >= 2) paths.push(path);
          path = [];
        } else {
          const entry = { point, meters };
          path.push(entry); samples.push(entry);
        }
      }
    }
    if (path.length >= 2) paths.push(path);
    return { paths, samples };
  }
  function drapeRiver(parts, sample) {
    const paths = [], samples = [];
    const entry = (point, fallback) => {
      const surface = sample(point);
      return { point, meters: surface === null ? fallback : surface, onTerrain: surface !== null };
    };
    const append = (path, next, depth = 0) => {
      const previous = path.at(-1);
      if (previous && previous.onTerrain && next.onTerrain) {
        const point = previous.point.map((value, i) => (value + next.point[i]) / 2);
        const middle = entry(point, (previous.meters + next.meters) / 2);
        // 省界裁切的取整、微量重叠可能让一个三角边附近出现不同表面；继续细分。
        // 小于约 0.1 米的水平跨度视为省界数值接缝，避免无限递归。
        if (middle.onTerrain && Math.abs(middle.meters - (previous.meters + next.meters) / 2) > 2 &&
            Math.hypot(next.point[0] - previous.point[0], next.point[1] - previous.point[1]) > 1e-6 && depth < 20) {
          append(path, middle, depth + 1);
          append(path, next, depth + 1);
          return;
        }
      }
      path.push(next);
    };
    for (const part of parts) {
      const path = [];
      for (let i = 1; i < part.length; i++) {
        const a = part[i - 1], b = part[i];
        for (const t of sample.cuts(a, b)) {
          if (i > 1 && t === 0) continue;
          const point = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
          // 边境与河口在简化模型以外时使用该河段实际 DEM 高程，保留真实位置。
          append(path, entry(point, a[2] + (b[2] - a[2]) * t));
        }
      }
      if (path.length >= 2) { paths.push(path); samples.push(...path); }
    }
    return { paths, samples };
  }
  return { xy, metersPerUnit, datum, heightToZ, elevationFromZ, decode, buildTerrain, heightAt, labelHeight, terrainColor, createSurfaceSampler, drapeLine, drapeRiver };
})();

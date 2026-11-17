/* 可独立验证的数学模型与 SVG 图示；不访问 DOM、不联网。 */
(function (root) {
  'use strict';
  const PHI = (1 + Math.sqrt(5)) / 2;
  const TAU = Math.PI * 2;
  const palette = ['#ffc857', '#57c5b6', '#b69ae8', '#7ab9e4', '#f49f83', '#a9cf80'];
  const clamp = (value, low, high) => Math.max(low, Math.min(high, Number.isFinite(Number(value)) ? Number(value) : low));
  const n = value => Number(value.toFixed(3));
  const point = p => p.slice(0, 2).map(n).join(',');
  const svg = (body, height = 420) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 ${height}" role="img" aria-label="数学实验示意图"><rect width="760" height="${height}" rx="18" fill="#f5f9fb"/>${body}</svg>`;
  const label = (x, y, value, size = 22) => `<text x="${n(x)}" y="${n(y)}" fill="#24443f" font-size="${size}" text-anchor="middle" font-family="system-ui,sans-serif">${value}</text>`;

  function golden(percent) {
    const a = clamp(percent, 50, 80), b = 100 - a;
    return {a, b, whole: 100 / a, parts: a / b, gap: Math.abs(100 / a - a / b)};
  }
  function goldenSVG(percent) {
    const g = golden(percent), split = 40 + 680 * g.a / 100;
    const height = 180, width = height * g.whole, x = (760 - width) / 2, y = 195;
    return svg(`<rect x="40" y="55" width="${n(split - 40)}" height="55" rx="8" fill="${palette[0]}"/><rect x="${n(split)}" y="55" width="${n(720 - split)}" height="55" rx="8" fill="${palette[1]}"/>
      <line x1="${n(split)}" y1="35" x2="${n(split)}" y2="130" stroke="#334a47" stroke-width="3"/>
      ${label((40 + split) / 2, 91, 'a')}${label((720 + split) / 2, 91, 'b')}${label(380, 151, 'a + b = 100')}
      <rect x="${n(x)}" y="${y}" width="${n(width)}" height="${height}" fill="${palette[2]}" stroke="#374c56" stroke-width="2"/>
      <rect x="${n(x)}" y="${y}" width="${height}" height="${height}" fill="${palette[0]}" stroke="#374c56" stroke-width="2"/>
      ${label(x + height / 2, y + 103, 'a × a')}${label(x + height + (width - height) / 2, y + 103, 'a × b', 18)}`);
  }

  function fibonacci(count) {
    const length = Math.round(clamp(count, 3, 12)), values = [1, 1];
    while (values.length < length) values.push(values.at(-1) + values.at(-2));
    return values;
  }
  function fibonacciTiles(count) {
    const values = fibonacci(count), tiles = [];
    let left = 0, top = 0, right = 1, bottom = 1;
    values.forEach((size, index) => {
      let x = 0, y = 0;
      const side = (index - 1 + 4) % 4;
      if (index) {
        if (side === 0) { x = right; y = top; right += size; }
        if (side === 1) { x = left; y = bottom; bottom += size; }
        if (side === 2) { x = left - size; y = top; left -= size; }
        if (side === 3) { x = left; y = top - size; top -= size; }
      }
      let start, end;
      if (!index || side === 3) { start = [x, y + size]; end = [x + size, y]; }
      if (index && side === 0) { start = [x, y]; end = [x + size, y + size]; }
      if (index && side === 1) { start = [x + size, y]; end = [x, y + size]; }
      if (index && side === 2) { start = [x + size, y + size]; end = [x, y]; }
      tiles.push({x, y, size, start, end});
    });
    return {values, tiles, bounds: {left, top, right, bottom}};
  }
  function fibonacciSVG(count) {
    const {tiles, bounds: b} = fibonacciTiles(count);
    const scale = Math.min(680 / (b.right - b.left), 340 / (b.bottom - b.top));
    const dx = (760 - (b.right - b.left) * scale) / 2 - b.left * scale;
    const dy = (420 - (b.bottom - b.top) * scale) / 2 - b.top * scale;
    const p = v => [v[0] * scale + dx, v[1] * scale + dy];
    let body = tiles.map((tile, i) => `<rect x="${n(tile.x * scale + dx)}" y="${n(tile.y * scale + dy)}" width="${n(tile.size * scale)}" height="${n(tile.size * scale)}" fill="${palette[i % palette.length]}" stroke="#fff" stroke-width="1.5"/>`).join('');
    body += tiles.map(tile => `<path d="M${point(p(tile.start))} A${n(tile.size * scale)},${n(tile.size * scale)} 0 0 1 ${point(p(tile.end))}" fill="none" stroke="#264c4a" stroke-width="3"/>`).join('');
    body += tiles.filter(tile => tile.size * scale > 24).map(tile => label(...p([tile.x + tile.size / 2, tile.y + tile.size / 2]), tile.size, tile.size * scale < 44 ? 14 : 23)).join('');
    return svg(body);
  }
  function seeds(count, angle) {
    const total = Math.round(clamp(count, 40, 300)), radians = clamp(angle, 110, 150) * Math.PI / 180;
    return Array.from({length: total}, (_, i) => {
      const radius = 170 * Math.sqrt((i + 1) / (total + 1)), theta = i * radians;
      return [380 + radius * Math.cos(theta), 210 + radius * Math.sin(theta)];
    });
  }
  function sunflowerSVG(count, angle) {
    return svg(seeds(count, angle).map((p, i) => `<circle cx="${n(p[0])}" cy="${n(p[1])}" r="${count > 200 ? 4 : 5}" fill="${palette[i % 3]}" stroke="#466654" stroke-width=".7"/>`).join(''));
  }

  function regularPolygon(sides, angle = 0) {
    const total = Math.round(clamp(sides, 3, 10)), turn = angle * Math.PI / 180;
    return Array.from({length: total}, (_, i) => [380 + 150 * Math.cos(-Math.PI / 2 + TAU * i / total + turn), 210 + 150 * Math.sin(-Math.PI / 2 + TAU * i / total + turn)]);
  }
  function symmetry(sides, angle) {
    const total = Math.round(clamp(sides, 3, 10)), step = 360 / total;
    const distance = Math.abs(angle - Math.round(angle / step) * step);
    return {sides: total, step, overlaps: distance <= .050001};
  }
  function symmetrySVG(sides, angle, axes) {
    const s = symmetry(sides, angle);
    let body = `<polygon points="${regularPolygon(s.sides).map(point).join(' ')}" fill="none" stroke="#607b87" stroke-width="5" stroke-dasharray="9 7"/>`;
    if (axes) for (let i = 0; i < s.sides; i++) {
      const t = -Math.PI / 2 + i * Math.PI / s.sides, x = 177 * Math.cos(t), y = 177 * Math.sin(t);
      body += `<path d="M${point([380 - x, 210 - y])}L${point([380 + x, 210 + y])}" stroke="#cf8c28" stroke-width="1.8" stroke-dasharray="5 6"/>`;
    }
    return svg(body + `<polygon points="${regularPolygon(s.sides, angle).map(point).join(' ')}" fill="#a994dd55" stroke="#7757ad" stroke-width="4"/><circle cx="380" cy="210" r="5" fill="#334b45"/>`);
  }
  function sierpinski(level) {
    const depth = Math.round(clamp(level, 0, 6));
    let triangles = [[[380, 30], [175, 385], [585, 385]]];
    const midpoint = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    for (let step = 0; step < depth; step++) triangles = triangles.flatMap(([a, b, c]) => {
      const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
      return [[a, ab, ca], [ab, b, bc], [ca, bc, c]];
    });
    return {depth, triangles, count: 3 ** depth, scale: 2 ** depth, area: (3 / 4) ** depth};
  }
  const fractalSVG = level => svg(sierpinski(level).triangles.map(triangle => `<polygon points="${triangle.map(point).join(' ')}" fill="#7563b7"/>`).join(''));

  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const minus = (a, b) => a.map((v, i) => v - b[i]);
  function rotate(p, angle = 35, tilt = 58) {
    const a = angle * Math.PI / 180, t = tilt * Math.PI / 180;
    const x = p[0] * Math.cos(a) - p[1] * Math.sin(a), y = p[0] * Math.sin(a) + p[1] * Math.cos(a);
    return [x, y * Math.cos(t) - p[2] * Math.sin(t), y * Math.sin(t) + p[2] * Math.cos(t)];
  }
  const project = p => [380 + p[0] * 105, 210 + p[1] * 105, p[2]];
  function bandPoint(theta, width, twisted = true) {
    const half = twisted ? theta / 2 : 0;
    return [(2 + width * Math.cos(half)) * Math.cos(theta), (2 + width * Math.cos(half)) * Math.sin(theta), width * Math.sin(half)];
  }
  function bandNormal(theta, twisted = true) {
    const half = twisted ? theta / 2 : 0;
    return [Math.cos(theta) * Math.sin(half), Math.sin(theta) * Math.sin(half), -Math.cos(half)];
  }
  function bandSVG(twisted, travel, view) {
    const faces = [];
    for (let i = 0; i < 72; i++) for (let j = 0; j < 6; j++) {
      const u = TAU * i / 72, next = TAU * (i + 1) / 72, v = -.58 + 1.16 * j / 6, w = -.58 + 1.16 * (j + 1) / 6;
      const corners = [[u, v], [next, v], [next, w], [u, w]].map(([theta, width]) => rotate(bandPoint(theta, width, twisted), view));
      faces.push({corners, depth: corners.reduce((sum, p) => sum + p[2], 0) / 4, hue: 195 + 48 * j / 6});
    }
    faces.sort((a, b) => a.depth - b.depth);
    let body = faces.map(face => `<polygon points="${face.corners.map(p => point(project(p))).join(' ')}" fill="hsl(${n(face.hue)},58%,${n(66 + 10 * face.depth / 3)}%)" stroke="#407b9d" stroke-width=".35"/>`).join('');
    const theta = clamp(travel, 0, 200) / 100 * TAU, p = bandPoint(theta, 0, twisted), normal = bandNormal(theta, twisted);
    const a = project(rotate(p, view)), b = project(rotate(p.map((v, i) => v + normal[i] * .58), view));
    const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy) || 1, ux = dx / length, uy = dy / length;
    const wing1 = [b[0] - ux * 13 - uy * 6, b[1] - uy * 13 + ux * 6], wing2 = [b[0] - ux * 13 + uy * 6, b[1] - uy * 13 - ux * 6];
    body += `<path d="M${point(a)} L${point(b)} M${point(wing1)} L${point(b)} L${point(wing2)}" fill="none" stroke="#b24036" stroke-width="5" stroke-linecap="round"/><circle cx="${n(a[0])}" cy="${n(a[1])}" r="9" fill="#ffc857" stroke="#6d5523" stroke-width="2"/>`;
    return svg(body);
  }

  function rubber(shape, deformation) {
    const power = 2 + 6 * clamp(deformation, 0, 100) / 100;
    const outline = scale => Array.from({length: 128}, (_, i) => {
      const t = TAU * i / 128, c = Math.cos(t), s = Math.sin(t);
      const r = 126 * scale / (Math.abs(c) ** power + Math.abs(s) ** power) ** (1 / power);
      return [380 + r * c, 210 + r * s];
    });
    return {outer: outline(1), inner: shape === 'ring' ? outline(.42) : [], holes: shape === 'ring' ? 1 : 0, boundaries: shape === 'ring' ? 2 : 1, components: 1};
  }
  function topologySVG(shape, deformation) {
    const r = rubber(shape, deformation);
    const path = points => points.length ? `M${points.map(point).join('L')}Z` : '';
    return svg(`<path d="${path(r.outer)}${path(r.inner)}" fill="#f3a888" fill-rule="evenodd" stroke="#a5543c" stroke-width="3"/>`);
  }
  function polyhedron(kind) {
    let vertices, faces;
    if (kind === 'tetra') {
      vertices = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]];
      faces = [[0, 1, 2], [0, 3, 1], [0, 2, 3], [1, 3, 2]];
    } else if (kind === 'octa') {
      vertices = [[1.5, 0, 0], [0, 1.5, 0], [-1.5, 0, 0], [0, -1.5, 0], [0, 0, 1.5], [0, 0, -1.5]];
      faces = Array.from({length: 4}, (_, i) => [[i, (i + 1) % 4, 4], [(i + 1) % 4, i, 5]]).flat();
    } else if (kind === 'torus') {
      vertices = Array.from({length: 16}, (_, k) => {
        const u = TAU * Math.floor(k / 4) / 4, v = TAU * (k % 4) / 4 + Math.PI / 4;
        return [(2 + .65 * Math.cos(v)) * Math.cos(u), (2 + .65 * Math.cos(v)) * Math.sin(u), .65 * Math.sin(v)];
      });
      const at = (i, j) => (i % 4) * 4 + j % 4;
      faces = Array.from({length: 16}, (_, k) => { const i = Math.floor(k / 4), j = k % 4; return [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)]; });
    } else {
      vertices = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
      faces = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
      if (kind === 'tri-cube') faces = faces.flatMap(([a, b, c, d]) => [[a, b, c], [a, c, d]]);
    }
    const edges = new Map();
    faces.forEach((face, index) => face.forEach((v, i) => {
      const pair = [v, face[(i + 1) % face.length]].sort((a, b) => a - b), key = pair.join('-');
      if (!edges.has(key)) edges.set(key, {pair, faces: []});
      edges.get(key).faces.push(index);
    }));
    return {vertices, faces, edges: [...edges.values()], V: vertices.length, E: edges.size, F: faces.length, chi: vertices.length - edges.size + faces.length};
  }
  function eulerSVG(kind) {
    const model = polyhedron(kind), points = model.vertices.map(p => rotate(p.map(v => v * (kind === 'torus' ? .82 : 1)), 28, 25));
    const projected = points.map(project);
    const faces = model.faces.map((indices, index) => {
      const p = indices.map(i => points[i]), original = indices.map(i => model.vertices[i]);
      let normal = cross(minus(original[1], original[0]), minus(original[2], original[0]));
      const center = original.reduce((sum, v) => sum.map((x, i) => x + v[i]), [0, 0, 0]);
      if (kind !== 'torus' && normal.reduce((sum, v, i) => sum + v * center[i], 0) < 0) normal = normal.map(v => -v);
      return {index, p, visible: rotate(normal, 28, 25)[2] >= 0, depth: p.reduce((sum, v) => sum + v[2], 0) / p.length};
    });
    const visible = new Map(faces.map(face => [face.index, face.visible]));
    let body = faces.sort((a, b) => a.depth - b.depth).map(face => `<polygon points="${face.p.map(p => point(project(p))).join(' ')}" fill="${palette[face.index % 6]}" fill-opacity=".3"/>`).join('');
    body += model.edges.map(edge => `<path d="M${point(projected[edge.pair[0]])}L${point(projected[edge.pair[1]])}" fill="none" stroke="#376461" stroke-width="2.5"${edge.faces.some(i => visible.get(i)) ? '' : ' stroke-dasharray="6 5"'}/>`).join('');
    body += projected.map(p => `<circle cx="${n(p[0])}" cy="${n(p[1])}" r="5" fill="#714a93" stroke="#fff" stroke-width="1.5"/>`).join('');
    return svg(body);
  }

  const api = {PHI, TAU, clamp, golden, goldenSVG, fibonacci, fibonacciTiles, fibonacciSVG, seeds, sunflowerSVG, regularPolygon, symmetry, symmetrySVG, sierpinski, fractalSVG, bandPoint, bandNormal, bandSVG, rubber, topologySVG, polyhedron, eulerSVG};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MathBeautyModels = api;
})(typeof window === 'undefined' ? globalThis : window);

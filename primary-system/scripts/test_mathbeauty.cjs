const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const M = require('../static/mathbeauty/models.js');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../mathbeauty/data/topics.json'), 'utf8'));
const near = (a, b, message = '') => assert.ok(Math.abs(a - b) < 1e-9, `${message} ${a} != ${b}`);
const pointNear = (a, b) => a.forEach((v, i) => near(v, b[i]));

test('golden split keeps total length and satisfies both ratio definitions at phi', () => {
  const g = M.golden(100 / M.PHI);
  near(g.a + g.b, 100); near(g.whole, M.PHI); near(g.parts, M.PHI); near(g.gap, 0);
  assert.equal(M.golden(50).parts, 1);
  assert.equal(M.golden(80).parts, 4);
  assert.ok(Number.isFinite(M.golden(Infinity).whole));
});

test('Fibonacci squares tile their bounding rectangle without overlap and their arcs join', () => {
  assert.deepEqual(M.fibonacci(12), [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144]);
  for (let count = 3; count <= 12; count++) {
    const {tiles, bounds: b} = M.fibonacciTiles(count);
    near(tiles.reduce((sum, t) => sum + t.size ** 2, 0), (b.right - b.left) * (b.bottom - b.top));
    tiles.forEach((tile, i) => {
      if (i) pointNear(tiles[i - 1].end, tile.start);
      for (const other of tiles.slice(i + 1)) {
        const width = Math.min(tile.x + tile.size, other.x + other.size) - Math.max(tile.x, other.x);
        const height = Math.min(tile.y + tile.size, other.y + other.size) - Math.max(tile.y, other.y);
        assert.ok(width <= 0 || height <= 0, 'squares overlap');
      }
    });
  }
});

test('seed model stays bounded and gives each new point a larger radius', () => {
  const points = M.seeds(300, 360 / M.PHI ** 2);
  assert.equal(points.length, 300);
  const radii = points.map(p => Math.hypot(p[0] - 380, p[1] - 210));
  assert.ok(radii.every((r, i) => r < 170 && (!i || r > radii[i - 1])));
  radii.forEach((r, i) => near(r ** 2 / radii[0] ** 2, i + 1));
});

test('regular polygons coincide after one symmetry step, but not a half step', () => {
  for (let sides = 3; sides <= 10; sides++) {
    const a = M.regularPolygon(sides), b = M.regularPolygon(sides, 360 / sides);
    a.forEach((p, i) => pointNear(p, b[(i + sides - 1) % sides]));
    assert.equal(M.symmetry(sides, 360 / sides).overlaps, true);
    assert.equal(M.symmetry(sides, 180 / sides).overlaps, false);
  }
});

test('finite Sierpinski geometry has the predicted count, side scale and total area', () => {
  const area = ([a, b, c]) => Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
  const original = area(M.sierpinski(0).triangles[0]);
  for (let level = 0; level <= 6; level++) {
    const state = M.sierpinski(level);
    assert.equal(state.triangles.length, 3 ** level);
    near(state.triangles.reduce((sum, triangle) => sum + area(triangle), 0) / original, (3 / 4) ** level);
    near(area(state.triangles[0]) / original, 1 / 4 ** level);
  }
});

test('Mobius seam reverses width and normal after one loop and restores them after two', () => {
  for (const width of [-.58, 0, .58]) {
    pointNear(M.bandPoint(0, width), M.bandPoint(M.TAU, -width));
    pointNear(M.bandPoint(0, width), M.bandPoint(2 * M.TAU, width));
    pointNear(M.bandPoint(0, width, false), M.bandPoint(M.TAU, width, false));
  }
  pointNear(M.bandNormal(0), M.bandNormal(M.TAU).map(v => -v));
  pointNear(M.bandNormal(0), M.bandNormal(2 * M.TAU));
  pointNear(M.bandNormal(0, false), M.bandNormal(M.TAU, false));
});

test('rubber deformation keeps a simple radial boundary and preserves each chosen hole', () => {
  for (const deformation of [0, 25, 50, 75, 100]) {
    const disk = M.rubber('disk', deformation), ring = M.rubber('ring', deformation);
    assert.equal(disk.inner.length, 0);
    assert.equal(ring.inner.length, ring.outer.length);
    ring.outer.forEach((p, i) => near(Math.hypot(p[0] - 380, p[1] - 210) * .42,
      Math.hypot(ring.inner[i][0] - 380, ring.inner[i][1] - 210)));
  }
});

test('closed polyhedral meshes have two faces per edge and the correct Euler numbers', () => {
  for (const [kind, expected] of [['tetra', [4, 6, 4, 2]], ['cube', [8, 12, 6, 2]], ['octa', [6, 12, 8, 2]], ['tri-cube', [8, 18, 12, 2]], ['torus', [16, 32, 16, 0]]]) {
    const mesh = M.polyhedron(kind);
    assert.deepEqual([mesh.V, mesh.E, mesh.F, mesh.chi], expected);
    assert.ok(mesh.edges.every(edge => edge.faces.length === 2));
    const connected = new Set([0]);
    for (let pass = 0; pass < mesh.V; pass++) for (const edge of mesh.edges) {
      if (edge.pair.some(vertex => connected.has(vertex))) edge.pair.forEach(vertex => connected.add(vertex));
    }
    assert.equal(connected.size, mesh.V);
  }
});

function element() {
  return {value: '', checked: false, disabled: false, hidden: true, textContent: '', innerHTML: '', dataset: {}, handlers: {}, attrs: {},
    addEventListener(type, fn) { this.handlers[type] = fn; }, setAttribute(key, value) { this.attrs[key] = value; }};
}
function station(topicId) {
  const topic = data.topics.find(topic => topic.id === topicId), labs = new Map(), quizzes = new Map();
  for (const def of topic.labs) {
    const fields = new Map(), buttons = new Map(), controls = new Map();
    const get = selector => { if (!fields.has(selector)) fields.set(selector, element()); return fields.get(selector); };
    for (const control of def.controls) {
      const node = element();
      let current = control.value;
      Object.defineProperty(node, 'value', {get: () => String(current), set(value) {
        current = control.type === 'range' ? Math.max(control.min, Math.min(control.max, control.min + Math.round((Number(value) - control.min) / control.step) * control.step)) : value;
      }});
      node.checked = control.value === true;
      controls.set(control.id, node); fields.set(`[data-mb-control="${control.id}"]`, node);
    }
    for (const action of def.actions) {
      const button = element(); button.dataset.mbAction = action.id;
      buttons.set(action.id, button); fields.set(`[data-mb-action="${action.id}"]`, button);
    }
    const root = {querySelector: get, querySelectorAll: selector => selector === '[data-mb-action]' ? [...buttons.values()] : []};
    labs.set(def.id, {get, buttons, controls, root});
  }
  for (const def of topic.quiz) {
    const buttons = def.options.map((_, i) => Object.assign(element(), {dataset: {mbAnswer: String(i)}}));
    const feedback = element();
    quizzes.set(def.id, {buttons, feedback, root: {querySelectorAll: () => buttons, querySelector: () => feedback}});
  }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../static/mathbeauty/app.js'), 'utf8'), {
    window: {MathBeautyModels: M},
    document: {getElementById: () => ({textContent: JSON.stringify(topic)}), querySelector(selector) {
      const id = selector.match(/="([^"]+)"/)[1]; return (labs.get(id) || quizzes.get(id))?.root;
    }},
  });
  return {labs, quizzes,
    set(lab, control, value) { const node = labs.get(lab).controls.get(control); node.value = value; (node.handlers.input || node.handlers.change)(); },
    click(lab, action) { labs.get(lab).buttons.get(action).handlers.click(); },
    output(lab, id) { return String(labs.get(lab).get(`[data-mb-output="${id}"]`).textContent); },
  };
}

test('golden snap and reset update both geometric ratios and feedback', () => {
  const s = station('golden');
  s.click('golden', 'snap');
  assert.match(s.output('golden', 'whole'), /1\.618/);
  assert.match(s.labs.get('golden').get('[data-mb-status]').textContent, /非常接近/);
  s.click('golden', 'reset');
  assert.equal(s.output('golden', 'long'), '65');
});

test('Fibonacci and fractal stepping stop at their bounded last iteration and can reset', () => {
  const f = station('fibonacci');
  for (let i = 0; i < 20; i++) f.click('fibonacci', 'next');
  assert.equal(f.labs.get('fibonacci').buttons.get('next').disabled, true);
  assert.match(f.output('fibonacci', 'sequence'), /144$/);
  f.click('fibonacci', 'reset'); assert.match(f.output('fibonacci', 'sequence'), /21$/);
  const s = station('symmetry-fractals');
  for (let i = 0; i < 20; i++) s.click('fractal', 'next');
  assert.equal(s.output('fractal', 'pieces'), '729');
  s.click('fractal', 'reset'); assert.equal(s.output('fractal', 'pieces'), '1');
  s.set('fractal', 'level', 0); assert.equal(s.output('fractal', 'area'), '1／1 ≈ 100%');
});

test('non-integer polygon steps stay aligned despite range rounding, and half steps do not', () => {
  const s = station('symmetry-fractals'); s.set('symmetry', 'sides', 7);
  for (let i = 0; i < 20; i++) {
    s.click('symmetry', 'next'); assert.equal(s.output('symmetry', 'overlap'), '重合（按滑块精度）');
  }
  s.set('symmetry', 'turn', 15); assert.equal(s.output('symmetry', 'overlap'), '尚未重合');
});

test('Mobius progress distinguishes position from orientation and ordinary annulus', () => {
  const s = station('mobius'); s.set('mobius', 'travel', 100);
  assert.match(s.output('mobius', 'orientation'), /相反/); assert.equal(s.output('mobius', 'boundaries'), '1');
  s.set('mobius', 'travel', 200); assert.match(s.output('mobius', 'orientation'), /相同/);
  assert.equal(s.labs.get('mobius').buttons.get('next').disabled, true);
  s.set('mobius', 'band', 'annulus'); s.set('mobius', 'travel', 100);
  assert.equal(s.output('mobius', 'boundaries'), '2'); assert.match(s.output('mobius', 'orientation'), /相同/);
});

test('topology counters preserve holes during deformation and separate the torus Euler value', () => {
  const s = station('topology'); s.set('topology', 'deform', 100);
  assert.equal(s.output('topology', 'boundaries'), '2');
  s.set('topology', 'shape', 'disk'); assert.equal(s.output('topology', 'holes'), '0');
  s.set('euler', 'solid', 'tri-cube'); assert.equal(s.output('euler', 'chi'), '8－18＋12＝2');
  s.set('euler', 'solid', 'torus'); assert.equal(s.output('euler', 'chi'), '16－32＋16＝0');
});

test('all fifteen exploration questions show correct and incorrect reasoning without saving', () => {
  for (const topic of data.topics) {
    const s = station(topic.id);
    for (const q of topic.quiz) {
      const question = s.quizzes.get(q.id);
      question.buttons[(q.answer + 1) % q.options.length].handlers.click();
      assert.equal(question.feedback.dataset.correct, 'false');
      question.buttons[q.answer].handlers.click();
      assert.equal(question.feedback.dataset.correct, 'true');
      assert.match(question.feedback.textContent, /判断正确/);
      assert.ok(question.feedback.textContent.includes(q.explanation));
    }
  }
});

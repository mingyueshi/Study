const { test } = require("node:test");
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm");
const c = vm.createContext({ console, atob, AbortController });
c.window = c;
const base = path.join(__dirname, "../static/study_topics/geo-map");
for (const f of [
  "assets/vendor/three-map",
  "china-3d-data",
  "china-3d-geometry",
  "china-terrain-visual",
])
  vm.runInContext(fs.readFileSync(path.join(base, f + ".js"), "utf8"), c);
const V = c.GMChinaTerrainVisual,
  G = c.GMChina3DGeometry;
const mesh = (xy, h, indices) => ({
  positions: new Float32Array(
    xy.flatMap(([x, y], i) => [x, y, h[i] / G.metersPerUnit]),
  ),
  elevations: new Int16Array(h),
  indices: new Uint16Array(indices),
});
test("等高线在线性山坡上插值到准确位置，每 500 米一档，不改原坐标或海拔", () => {
  const m = mesh(
      [
        [0, 0],
        [2, 0],
        [0, 2],
      ],
      [0, 1000, 1000],
      [0, 1, 2],
    ),
    before = Array.from(m.positions),
    r = V.contours(m, 500, 0);
  assert.equal(r.length, 12);
  const level500 = Array.from(r.slice(0, 6));
  assert.ok(Math.abs(level500[2] * G.metersPerUnit - 500) < 1e-4);
  assert.ok(Math.abs(level500[5] * G.metersPerUnit - 500) < 1e-4);
  assert.deepEqual([level500.slice(0, 2), level500.slice(3, 5)].sort(), [
    [0, 1],
    [1, 0],
  ]);
  assert.deepEqual(Array.from(m.positions), before);
  assert.deepEqual(Array.from(m.elevations), [0, 1000, 1000]);
});
test("全平地不产生线；孤立等高顶点不产生零长度线，共用等高边只保留一次", () => {
  assert.equal(
    V.contours(
      mesh(
        [
          [0, 0],
          [1, 0],
          [0, 1],
        ],
        [500, 500, 500],
        [0, 1, 2],
      ),
    ).length,
    0,
  );
  assert.equal(
    V.contours(
      mesh(
        [
          [0, 0],
          [1, 0],
          [0, 1],
        ],
        [0, 0, 500],
        [0, 1, 2],
      ),
    ).length,
    0,
  );
  const m = mesh(
    [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
    [0, 500, 500, 0],
    [0, 1, 2, 3, 2, 1],
  );
  assert.equal(V.contours(m, 500, 0).length, 6);
});
test("鞍部依照原三角面保持穿过中心的四支线，不用方格的二义连接猜测地形", () => {
  const m = mesh(
      [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
        [0, 0],
      ],
      [0, 1000, 0, 1000, 500],
      [0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4],
    ),
    r = V.contours(m, 500, 0);
  assert.equal(r.length, 24);
  for (let i = 0; i < r.length; i += 6) {
    assert.ok([i, i + 3].some((k) => r[k] === 0 && r[k + 1] === 0));
    assert.ok(Math.abs(r[i + 2] * G.metersPerUnit - 500) < 1e-4);
  }
});
test("负海拔保留零米线，海拔线加的显示偏移不受地图倍率输入影响", () => {
  const m = mesh(
      [
        [0, 0],
        [1, 0],
        [0, 1],
      ],
      [-100, 100, 100],
      [0, 1, 2],
    ),
    r = V.contours(m, 500, 2);
  assert.equal(r.length, 6);
  assert.ok(Math.abs(r[2] * G.metersPerUnit - 2) < 1e-5);
  assert.throws(() => V.contours(m, 0));
  assert.throws(() => V.contours(m, NaN));
});
test("东南西北光照按地理轴对应，保持同一高度角，不跟随镜头", () => {
  const directions = [
    [90, 1, 0],
    [180, 0, -1],
    [270, -1, 0],
    [0, 0, 1],
  ];
  for (const [a, x, y] of directions) {
    const p = V.lightVector(a, 55);
    assert.ok(Math.abs(p[0] - 80 * x) < 1e-8);
    assert.ok(Math.abs(p[1] - 80 * y) < 1e-8);
    assert.ok(
      Math.abs(
        (Math.atan2(p[2], Math.hypot(p[0], p[1])) * 180) / Math.PI - 55,
      ) < 1e-8,
    );
  }
});

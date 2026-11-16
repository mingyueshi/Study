const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  vm = require("node:vm"),
  path = require("node:path");
const c = vm.createContext({
  console,
  atob,
  AbortController,
  setTimeout,
  clearTimeout,
});
c.window = c;
const base = path.join(__dirname, "../static/study_topics/geo-map");
for (const f of [
  "assets/vendor/three-map",
  "china-3d-data",
  "china-3d-geometry",
  "china-terrain-stream",
])
  vm.runInContext(fs.readFileSync(path.join(base, f + ".js"), "utf8"), c);
const G = c.GMChina3DGeometry,
  S = c.GMChinaTerrainStream;
const index = {
  sourceSha256: "source",
  tiles: Object.fromEntries(
    Array.from({ length: 5 }, (_, i) => [
      "t" + i,
      {
        bounds: [i * 4, 0, i * 4 + 4, 4],
        coarse: { 230000: { kind: "coarse" } },
      },
    ]),
  ),
};
const payload = (id) => ({
  version: 1,
  key: id,
  sourceSha256: "source",
  provinces: { 230000: { kind: "fine" } },
});
const tick = () => new Promise((r) => setImmediate(r));
test("整米海拔查表保持旧线性颜色和负海拔色阶，批量填色复用目标数组", () => {
  const heights = new Int16Array([
    -500, -151, 0, 40, 500, 1500, 4000, 7880, 9000,
  ]);
  const target = new Float32Array(heights.length * 3);
  assert.equal(G.fillTerrainColors(heights, target), target);
  heights.forEach((m, i) =>
    G.terrainColor(m)
      .toArray()
      .forEach((n, j) => assert.ok(Math.abs(n - target[i * 3 + j]) < 1e-7)),
  );
});
const triangle = (meters) => ({
  positions: new Float32Array([0, 0, meters, 1, 0, meters, 0, 1, meters]),
  indices: new Uint16Array([0, 1, 2]),
  edges: new Uint16Array([0, 1, 1, 2, 2, 0]),
  elevations: new Int16Array([meters, meters, meters]),
  basinFlags: new Uint8Array([1]),
  lakeFlags: new Uint8Array([2]),
});
test("替换局部网格同步更新空间索引，不残留旧海拔，移除后保留空白", () => {
  const first = triangle(10),
    next = triangle(20),
    sample = G.createSurfaceSampler([first]),
    point = [104.6, 35.8 + 0.1 / 1.22];
  assert.equal(Math.round(sample(point)), 10);
  sample.replace(first, next);
  assert.equal(Math.round(sample(point)), 20);
  sample.replace(next, null);
  assert.equal(sample(point), null);
});
test("拼装按省分组的详细块保留独立索引偏移、原高程与水文掩膜", () => {
  const a = triangle(10),
    b = triangle(20),
    r = G.mergeDecoded([a, b]);
  assert.deepEqual(Array.from(r.indices), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(Array.from(r.elevations), [10, 10, 10, 20, 20, 20]);
  assert.deepEqual(
    Array.from(G.maskedIndices(r, "basin", 0)),
    [0, 1, 2, 3, 4, 5],
  );
  assert.deepEqual(
    Array.from(G.maskedIndices(r, "lake", 1)),
    [0, 1, 2, 3, 4, 5],
  );
  assert.deepEqual(Array.from(a.indices), [0, 1, 2]);
});
test("概览不请求详细块，视口外不请求，放大后按离画面中心的距离限量选择", () => {
  const project = ([x, y]) => ({ x: (x - 2) / 2, y: (y - 2) / 2 });
  assert.deepEqual(Array.from(S.visibleTiles(index, project, 50, 50)), []);
  assert.deepEqual(Array.from(S.visibleTiles(index, project, 800, 600, 1)), [
    "t0",
  ]);
});
test("并发有上限，重复视口不重复请求，离开视口取消旧工作", async () => {
  const waiting = new Map(),
    calls = [];
  const m = S.create({
    index,
    concurrency: 2,
    load: (id, item, signal) =>
      new Promise((resolve, reject) => {
        calls.push(id);
        waiting.set(id, () => resolve(payload(id)));
        signal.addEventListener("abort", () => reject(new Error("abort")));
      }),
  });
  m.setVisible(["t0", "t1", "t2"]);
  m.setVisible(["t0", "t1", "t2"]);
  await tick();
  assert.equal(calls.length, 2);
  m.setVisible(["t4"]);
  await tick();
  await tick();
  assert.ok(calls.includes("t4"));
  assert.ok(m.snapshot().pending.length <= 2);
  waiting.get("t4")();
  await tick();
  assert.equal(m.snapshot().failed.length, 0);
  m.dispose();
});
test("精确采样请求去重并暂时保留块，读数完成后缓存按上限淘汰", async () => {
  const calls = [];
  const m = S.create({
    index,
    maxCache: 2,
    load: async (id) => {
      calls.push(id);
      return payload(id);
    },
  });
  await Promise.all([
    m.withPoints([[1, 1]], () =>
      assert.equal(m.records("230000")[0].kind, "fine"),
    ),
    m.withPoints([[1, 1]], () => {}),
  ]);
  assert.equal(calls.filter((id) => id === "t0").length, 1);
  for (const x of [5, 9, 13, 17]) await m.withPoints([[x, 1]], () => {});
  assert.ok(m.snapshot().cached.length <= 2);
  m.dispose();
});
test("版本损坏不会替换概览或执行读数回调，重试后可恢复", async () => {
  let bad = true,
    called = false;
  const m = S.create({
    index,
    load: async (id) => ({
      ...payload(id),
      sourceSha256: bad ? "wrong" : "source",
    }),
  });
  await assert.rejects(
    m.withPoints([[1, 1]], () => {
      called = true;
    }),
  );
  assert.equal(called, false);
  assert.equal(m.records("230000")[0].kind, "coarse");
  bad = false;
  await m.withPoints([[1, 1]], () => {
    called = true;
  });
  assert.equal(called, true);
  m.dispose();
});
test("关闭页面使尚未完成的精确采样失效，迟到数据不再修改场景", async () => {
  let resolve,
    changed = 0,
    called = false;
  const m = S.create({
    index,
    changed: () => changed++,
    load: (id) =>
      new Promise((r) => {
        resolve = () => r(payload(id));
      }),
  });
  const work = m.withPoints([[1, 1]], () => {
    called = true;
  });
  await tick();
  m.dispose();
  await assert.rejects(work);
  resolve();
  await tick();
  assert.equal(called, false);
  assert.equal(changed, 0);
});

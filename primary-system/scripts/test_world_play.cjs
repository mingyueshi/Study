const { test } = require("node:test");
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm");
const c = vm.createContext({ console });
c.window = c;
const base = path.join(__dirname, "../static/study_topics/geo-map");
for (const name of [
  "world-3d-geometry",
  "world-play",
  "world-lab",
  "world-voyages",
])
  vm.runInContext(fs.readFileSync(path.join(base, name + ".js"), "utf8"), c);
const P = c.GMWorldPlay,
  G = c.GMWorld3DGeometry,
  L = c.GMWorldLab;
const trip = {
  name: "我的环线",
  stops: [
    { name: "北京", point: [116.4, 39.9] },
    { name: "东京", point: [139.7, 35.7] },
    { name: "北京", point: [116.4, 39.9] },
  ],
};
test("旅行只恢复合法名字和 2—20 个有效站点，过滤损坏存储，保留回到起点的环线", () => {
  const clean = P.cleanTrip({
    ...trip,
    stops: trip.stops.map((s) => ({ ...s, extra: "discard" })),
    extra: "discard",
  });
  assert.equal(clean.stops.length, 3);
  assert.equal(clean.extra, undefined);
  assert.equal(clean.stops[0].extra, undefined);
  assert.equal(
    P.cleanTrip({ ...trip, stops: [trip.stops[0], trip.stops[0]] }),
    null,
  );
  for (const bad of [
    {},
    null,
    { ...trip, name: " " },
    { ...trip, name: "字".repeat(31) },
    { ...trip, stops: [{ name: "坏点", point: [Infinity, 0] }, trip.stops[0]] },
    { ...trip, stops: [{ name: "坏点", point: ["1", 2] }, trip.stops[0]] },
    { ...trip, stops: [{ name: "坏点", point: [181, 0] }, trip.stops[0]] },
  ])
    assert.equal(P.cleanTrip(bad), null);
  assert.equal(P.readTrips("not-json").length, 0);
  assert.equal(P.readTrips("{}").length, 0);
  assert.equal(P.readTrips(JSON.stringify([null, trip])).length, 1);
  assert.equal(P.readTrips(JSON.stringify(Array(15).fill(trip))).length, 8);
});
test("计时按本轮独立任务去重，历史完成与无关任务不增加成绩，完成时冻结耗时", () => {
  let now = 100;
  const t = P.createTimer(() => now);
  t.start(["a", "b", "a"]);
  now = 1600;
  t.answer("old");
  t.answer("a");
  t.answer("a");
  assert.equal(t.snapshot().count, 1);
  now = 2100;
  t.answer("b");
  assert.equal(t.snapshot().complete, true);
  assert.equal(t.snapshot().elapsed, 2000);
  now = 100000;
  assert.equal(t.snapshot().elapsed, 2000);
  assert.equal(P.formatTime(90000), "1 分 30 秒");
});
test("暂停期间不计时也不计成绩，继续后累计；看答案使本轮失效，重开清除本轮状态", () => {
  let now = 0;
  const t = P.createTimer(() => now);
  t.start(["a", "b"]);
  now = 1000;
  t.pause();
  now = 10000;
  t.answer("a");
  assert.equal(t.snapshot().count, 0);
  assert.equal(t.snapshot().elapsed, 1000);
  t.resume();
  now = 11000;
  t.answer("a");
  t.answer("b", true);
  assert.equal(t.snapshot().invalid, true);
  assert.equal(t.snapshot().elapsed, 2000);
  t.resume();
  assert.equal(t.snapshot().running, false);
  t.start(["c"]);
  assert.equal(t.snapshot().count, 0);
  assert.equal(t.snapshot().invalid, false);
});
test("人口圆面积对应人数比例；降水缺测不着雨量颜色，干湿色阶有区别", () => {
  assert.ok(
    Math.abs(
      L.populationRadius(2000000) ** 2 / L.populationRadius(8000000) ** 2 -
        0.25,
    ) < 1e-10,
  );
  assert.notEqual(L.rainColor(null), L.rainColor(0));
  assert.notEqual(L.rainColor(200), L.rainColor(3500));
});
test("倾斜相对首次姿态校准，屏幕旋转交换轴，过大角度限幅，无数据不移动", () => {
  assert.deepEqual(Array.from(P.tiltDelta(30, 10, [30, 10])), [0, 0]);
  const rotated = P.tiltDelta(40, 10, [30, 10], 90);
  assert.ok(Math.abs(rotated[0] - 10) < 1e-8);
  assert.ok(Math.abs(rotated[1]) < 1e-8);
  assert.ok(P.tiltDelta(130, 110, [30, 10]).every((x) => Math.abs(x) <= 35));
  assert.equal(P.tiltDelta(null, 1, [0, 0]), null);
});
test("自定义航线跨日期线与对跖点的中途位置有限，等距采样保持匀速球面路程", () => {
  const V = c.GMWorldVoyages;
  for (const endpoints of [
    [
      [170, 10],
      [-170, 10],
    ],
    [
      [0, 0],
      [180, 0],
    ],
  ]) {
    const r = V.buildRoute({
      stops: [
        { point: endpoints[0] },
        { point: endpoints[1], via: [endpoints[1]] },
      ],
    });
    const p = [0.2, 0.3, 0.4].map((k) => V.position(r, r.length * k).point);
    assert.ok(p.flat().every(Number.isFinite));
    assert.ok(Math.abs(G.angle(p[0], p[1]) - G.angle(p[1], p[2])) < 1e-7);
  }
});

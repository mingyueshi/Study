/* 扩展图层先校验口径、坐标、来源和本地发布契约。 */
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path");
global.window = {};
require("../geo-map/world-lab-data.js");
const D = window.GM_WORLD_LAB;
const point = (p) =>
  Array.isArray(p) &&
  p.length === 2 &&
  p.every(Number.isFinite) &&
  Math.abs(p[0]) <= 180 &&
  Math.abs(p[1]) <= 90;
const text = (s) => typeof s === "string" && s.trim() && !/["';\r\n]/.test(s);
const unique = (a) => assert.equal(new Set(a.map((x) => x.id)).size, a.length);
assert.equal(D.version, 1);
assert.equal(D.population.year, 2025);
assert.match(D.population.sourceSha256, /^[a-f0-9]{64}$/);
assert.match(D.plateSourceSha256, /^[a-f0-9]{64}$/);
assert.ok(text(D.population.note));
assert.ok(D.population.cities.length >= 12);
unique(D.population.cities);
for (const c of D.population.cities)
  assert.ok(
    point(c.point) &&
      text(c.name) &&
      Number.isFinite(c.people) &&
      c.people > 100000,
  );
assert.equal(D.plates.length, 6);
unique(D.plates);
for (const p of D.plates) {
  assert.ok(text(p.name) && text(p.note) && point(p.point));
  assert.ok(/^#[a-f0-9]{6}$/i.test(p.color));
  assert.ok(
    p.rings.length && p.rings.every((r) => r.length >= 4 && r.every(point)),
  );
}
assert.ok(text(D.plateNote) && text(D.ancientNote));
assert.ok(D.pangaea.length >= 6);
for (const p of D.pangaea)
  assert.ok(
    text(p.name) && point(p.point) && p.ring.length >= 4 && p.ring.every(point),
  );
assert.ok(D.weather.monsoons.length >= 4);
for (const a of D.weather.monsoons)
  assert.ok(
    ["summer", "winter"].includes(a.season) &&
      a.points.length >= 2 &&
      a.points.every(point) &&
      text(a.name),
  );
assert.ok(
  D.weather.typhoon.points.length >= 5 && D.weather.typhoon.points.every(point),
);
assert.ok(text(D.weather.note));
const {pressure, winds, note, source} = D.circulation;
assert.deepEqual(pressure.flatMap(band => band.latitudes).sort((a, b) => a - b), [-90, -60, -30, 0, 30, 60, 90]);
assert.deepEqual(winds.map(band => band.shift.map(Math.sign)), [[-1, -1], [1, 1], [-1, -1]]);
for (const band of [...pressure, ...winds]) {
  assert.ok(text(band.name) && text(band.text));
  assert.match(band.color, /^#[a-f0-9]{6}$/i);
}
assert.ok(winds.every(({latitudes: [north, south]}) => north > 0 && north === -south));
assert.ok(text(note) && /^https:\/\//.test(source.url));
assert.equal(D.rain.width, 72);
assert.equal(D.rain.height, 36);
assert.equal(D.rain.mm.length, 72 * 36);
assert.ok(
  D.rain.mm.every(
    (n) => n === null || (Number.isFinite(n) && n >= 0 && n < 20000),
  ),
);
assert.ok(text(D.rain.period) && text(D.rain.note));
assert.match(D.rain.sourceSha256, /^[a-f0-9]{64}$/);
assert.ok(D.sky.constellations.length >= 4);
unique(D.sky.constellations);
for (const c of D.sky.constellations)
  assert.ok(
    text(c.name) &&
      point(c.point) &&
      c.lines.every((l) => l.length >= 2 && l.every(point)),
  );
assert.ok(text(D.sky.note));
for (const s of D.sources) assert.ok(text(s.name) && /^https:\/\//.test(s.url));
const base = path.join(__dirname, "../geo-map");
const html = fs.readFileSync(path.join(base, "world-3d.html"), "utf8");
assert.ok(html.includes("world-3d-pack.js"));
assert.ok((html.match(/<script /g) || []).length <= 3);
console.log("世界地球仪扩展图层、人口口径与离线合并入口校验通过");

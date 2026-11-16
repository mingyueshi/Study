/* 新增显示参数先校验；不改写 DEM 或原始判题数值。 */
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path");
global.window = {};
require("../geo-map/china-terrain-visual-data.js");
const D = window.GM_CHINA_TERRAIN_VISUAL;
const prose = (s) => typeof s === "string" && s.trim() && !/["';\r\n]/.test(s);
assert.equal(D.version, 1);
assert.equal(D.contours.interval, 500);
assert.ok(D.contours.opacity > 0 && D.contours.opacity < 1);
assert.match(D.contours.color, /^#[a-f0-9]{6}$/i);
assert.ok(prose(D.contours.note));
assert.ok(D.light.elevation > 15 && D.light.elevation < 80);
assert.ok(D.light.azimuth >= 0 && D.light.azimuth < 360);
assert.equal(
  new Set(D.light.presets.map((p) => p.id)).size,
  D.light.presets.length,
);
for (const p of D.light.presets)
  assert.ok(
    prose(p.name) &&
      Number.isFinite(p.azimuth) &&
      p.azimuth >= 0 &&
      p.azimuth < 360,
  );
assert.ok(
  D.light.presets.some((p) => p.azimuth === 90) &&
    D.light.presets.some((p) => p.azimuth === 180),
);
assert.ok(prose(D.light.note));
assert.ok(D.snow.min >= 0 && D.snow.max <= 9000 && D.snow.step > 0);
assert.equal(D.snow.initial, 5000);
assert.ok(
  D.snow.initial >= D.snow.min &&
    D.snow.initial <= D.snow.max &&
    prose(D.snow.note),
);
assert.equal(D.opacity.initial, 100);
assert.ok(prose(D.opacity.note));
assert.ok(prose(D.mountainIcon));
for (const s of D.sources)
  assert.ok(prose(s.name) && /^https:\/\//.test(s.url));
const html = fs.readFileSync(
  path.join(__dirname, "../geo-map/china-3d.html"),
  "utf8",
);
for (const name of ["china-terrain-visual-data.js", "china-terrain-visual.js"])
  assert.ok(html.includes(name));
for (const id of [
  "gm3-contours",
  "gm3-light-azimuth",
  "gm3-snow-altitude",
  "gm3-terrain-opacity",
])
  assert.ok(html.includes(`id="${id}"`));
console.log("中国地形视觉参数、文案与入口契约通过");

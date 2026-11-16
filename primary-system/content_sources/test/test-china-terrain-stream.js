/* 瓦片发布契约：概览不引用全国详细 DEM，详细块保持原始三角面和高程。 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createHash } = require("node:crypto");
const base = path.join(__dirname, "../geo-map");
global.window = {};
require("../geo-map/china-terrain-data.js");
require("../geo-map/china-terrain-index.js");
require("../geo-map/china-hydrology-data.js");
require("../geo-map/china-adventures-data.js");
const full = window.GM_CHINA_TERRAIN,
  index = window.GM_CHINA_TERRAIN_INDEX;
assert.equal(index.version, 1);
assert.equal(index.size, 4);
assert.deepEqual(index.origin, full.origin);
assert.equal(index.quantization, full.quantization);
assert.equal(
  index.sourceSha256,
  createHash("sha256")
    .update(fs.readFileSync(path.join(base, "china-terrain-data.js")))
    .digest("hex"),
);
assert.ok(Object.keys(index.tiles).length > 50);
assert.equal(index.waterBaked, true, "两级河线必须已预计算");
assert.deepEqual(index.basinOrder, window.GM_CHINA_HYDROLOGY.basins.map(b=>b.feature));
assert.deepEqual(index.lakeOrder, window.GM_CHINA_ADVENTURES.lakes.map(l=>l.feature));
assert.equal(Object.keys(index.lakeLevels).length, 6);
Object.values(index.lakeLevels).forEach(n=>assert.ok(Number.isFinite(n)));
for(const file of ['china-rivers-data.js','china-hydrology-data.js','china-hydrology-geo.js','china-adventures-data.js','china-3d-geometry.js'])assert.equal(index.waterSourceHashes[file],createHash('sha256').update(fs.readFileSync(path.join(base,file))).digest('hex'),'河线烘焙输入已变化：'+file);
const totals = new Map();
const originals = new Map();
function original(code) {
  if (originals.has(code)) return originals.get(code);
  const record = full.provinces[code],
    v = Buffer.from(record.vertices, "base64"),
    t = Buffer.from(record.triangles, "base64");
  const vertices = new Map();
  for (let i = 0; i < record.vertexCount; i++)
    vertices.set(v.readUInt16LE(i * 6) + "," + v.readUInt16LE(i * 6 + 2), {
      id: i,
      meters: v.readInt16LE(i * 6 + 4),
    });
  const read = (buffer, i) =>
    record.indexBytes === 2
      ? buffer.readUInt16LE(i * 2)
      : buffer.readUInt32LE(i * 4);
  const triangles = new Set();
  for (let i = 0; i < record.triangleCount * 3; i += 3)
    triangles.add([read(t, i), read(t, i + 1), read(t, i + 2)].join(","));
  const result = { vertices, triangles };
  originals.set(code, result);
  return result;
}
let coarse = 0,
  fine = 0;
let coarseEdges = 0,
  fineEdges = 0;
for (const [id, tile] of Object.entries(index.tiles)) {
  assert.match(id, /^t\d+-\d+$/);
  assert.equal(tile.bounds.length, 4);
  assert.match(tile.file, /^assets\/terrain\/t\d+-\d+\.js$/);
  const bytes = fs.readFileSync(path.join(base, tile.file));
  assert.equal(bytes.length, tile.bytes);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), tile.sha256);
  let payload;
  vm.runInNewContext(bytes.toString(), {
    window: {
      GMChinaTerrainStream: {
        receive: (key, data) => {
          assert.equal(key, id);
          payload = data;
        },
      },
    },
  });
  assert.equal(payload.sourceSha256, index.sourceSha256);
  for (const [kind, records] of [
    ["coarse", tile.coarse],
    ["fine", payload.provinces],
  ])
    for (const [code, r] of Object.entries(records)) {
      assert.ok(full.provinces[code]);
      assert.ok(
        r.vertexCount > 0 &&
          r.triangleCount > 0 &&
          [2, 4].includes(r.indexBytes),
      );
      assert.equal(Buffer.from(r.vertices, "base64").length, r.vertexCount * 6);
      assert.equal(
        Buffer.from(r.triangles, "base64").length,
        r.triangleCount * 3 * r.indexBytes,
      );
      for (const flag of ["basinFlags", "lakeFlags"])
        assert.equal(Buffer.from(r[flag], "base64").length, r.triangleCount);
      for (const positions of Object.values(r.render?.rivers || {}).concat(
        Object.values(r.render?.tributaries || {}),
      ))
        assert.equal(Buffer.from(positions, "base64").length % 24, 0);
      const edgeCount =
        Buffer.from(r.edges, "base64").length / (r.indexBytes * 2);
      if (kind === "fine") {
        const source = original(code),
          v = Buffer.from(r.vertices, "base64"),
          t = Buffer.from(r.triangles, "base64"),
          ids = [];
        for (let i = 0; i < r.vertexCount; i++) {
          const point = source.vertices.get(
            v.readUInt16LE(i * 6) + "," + v.readUInt16LE(i * 6 + 2),
          );
          assert.ok(point);
          assert.equal(
            point.meters,
            v.readInt16LE(i * 6 + 4),
            "详细块不能改写原高程",
          );
          ids.push(point.id);
        }
        const read = (i) =>
          r.indexBytes === 2 ? t.readUInt16LE(i * 2) : t.readUInt32LE(i * 4);
        for (let i = 0; i < r.triangleCount * 3; i += 3)
          assert.ok(
            source.triangles.delete(
              [ids[read(i)], ids[read(i + 1)], ids[read(i + 2)]].join(","),
            ),
            "详细三角形应与原网格一一对应",
          );
        totals.set(code, (totals.get(code) || 0) + r.triangleCount);
        fine += r.triangleCount;
        fineEdges += edgeCount;
      } else {
        coarse += r.triangleCount;
        coarseEdges += edgeCount;
      }
    }
}
for (const [code, r] of Object.entries(full.provinces)) {
  assert.equal(totals.get(code), r.triangleCount);
  assert.equal(original(code).triangles.size, 0);
}
assert.equal(fineEdges, 51482);
assert.equal(coarseEdges, fineEdges, "概览与细节都保留全部省界");
assert.ok(coarse < fine / 3, "概览应实质减少三角形");
const html = fs.readFileSync(path.join(base, "china-3d.html"), "utf8");
assert.ok(
  !html.includes('src="china-terrain-data.js"'),
  "首屏不加载全国详细 DEM",
);
assert.ok(
  html.includes("china-terrain-index.js") &&
    html.includes("china-terrain-stream.js"),
);
console.log(
  `地形瓦片契约通过：${Object.keys(index.tiles).length} 块，概览 ${coarse} 面，详细 ${fine} 面`,
);

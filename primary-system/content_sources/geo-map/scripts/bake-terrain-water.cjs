/* 用原采样器离线烘焙两级河线，浏览器只拼装已贴地的线段。 */
const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  { createHash } = require("node:crypto");
const root = path.join(__dirname, ".."),
  c = vm.createContext({ console, atob, AbortController });
c.window = c;
for (const file of [
  "assets/vendor/three-map",
  "china-3d-data",
  "china-terrain-data",
  "china-terrain-index",
  "china-3d-geometry",
  "china-rivers-data",
  "china-adventures-data",
  "china-hydrology-data",
  "china-hydrology-geo",
  "china-terrain-play",
])
  vm.runInContext(fs.readFileSync(path.join(root, file + ".js"), "utf8"), c);
const G = c.GMChina3DGeometry,
  I = c.GM_CHINA_TERRAIN_INDEX,
  full = c.GM_CHINA_TERRAIN;
const fine = {},
  coarse = Object.fromEntries(
    Object.entries(I.tiles).map(([key, t]) => [key, t.coarse]),
  );
for (const [key, t] of Object.entries(I.tiles))
  vm.runInNewContext(fs.readFileSync(path.join(root, t.file), "utf8"), {
    window: {
      GMChinaTerrainStream: {
        receive: (id, p) => {
          fine[id] = p.provinces;
        },
      },
    },
  });
const decoded = (parts) =>
  Object.entries(parts).map(([code, rows]) => ({
    ...G.mergeDecoded(rows.map((r) => G.decode(r))),
    province: "p" + code,
  }));
const all = {};
for (const rows of Object.values(coarse))
  for (const [code, r] of Object.entries(rows)) (all[code] ??= []).push(r);
const samplers = {
  fine: G.createSurfaceSampler(
    Object.entries(full.provinces).map(([code, r]) => ({
      ...G.decode(r),
      province: "p" + code,
    })),
  ),
  coarse: G.createSurfaceSampler(decoded(all)),
};
I.lakeLevels = Object.fromEntries(
  c.GM_CHINA_ADVENTURES.lakes.map((l) => [
    l.feature,
    c.GMChinaTerrainPlay.lakeLevel(l.rings, samplers.fine, 0),
  ]),
);
const floats = (values) => {
  const bytes = Buffer.alloc(values.length * 4);
  values.forEach((n, i) => bytes.writeFloatLE(n, i * 4));
  return bytes.toString("base64");
};
I.outside = { rivers: {}, tributaries: {} };
for (const [level, tiles] of Object.entries({ fine, coarse })) {
  for (const rows of Object.values(tiles))
    for (const r of Object.values(rows))
      r.render = { rivers: {}, tributaries: {} };
  const sample = samplers[level];
  function bake(id, paths, kind) {
    const output = G.drapeRiver(paths, sample),
      outside = [];
    for (const line of output.paths)
      for (let i = 1; i < line.length; i++) {
        const a = line[i - 1],
          b = line[i];
        if (kind === "tributaries" && (!a.onTerrain || !b.onTerrain)) continue;
        const point = a.point.map((n, j) => (n + b.point[j]) / 2),
          owner = sample.locate(point)?.mesh.province?.slice(1);
        const x = Math.floor((point[0] - I.origin[0]) / I.size),
          y = Math.floor((point[1] - I.origin[1]) / I.size),
          key = `t${x}-${y}`;
        let record = tiles[key]?.[owner];
        if (!record && owner)
          record = Object.entries(I.tiles).find(
            ([k, t]) =>
              tiles[k][owner] &&
              point[0] >= t.bounds[0] - 1e-6 &&
              point[0] <= t.bounds[2] + 1e-6 &&
              point[1] >= t.bounds[1] - 1e-6 &&
              point[1] <= t.bounds[3] + 1e-6,
          )?.[0];
        if (typeof record === "string") record = tiles[record][owner];
        const bucket = record ? (record.render[kind][id] ??= []) : outside;
        for (const p of [a, b])
          bucket.push(
            ...G.xy(p.point),
            (p.meters + (kind === "rivers" ? 3 : 5)) / G.metersPerUnit,
          );
      }
    if (level === "fine" && outside.length)
      I.outside[kind][id] = floats(outside);
    console.log(level, kind, id, output.samples.length);
  }
  for (const [id, r] of Object.entries(c.GM_CHINA_RIVERS.rivers))
    bake(id, r.paths, "rivers");
  for (const b of c.GM_CHINA_HYDROLOGY.tributaries)
    bake(
      b.id,
      c.GM_CHINA_HYDROLOGY_GEO.tributaries[b.id].paths.map((line) =>
        line.map((p) => [...p, sample(p) ?? 0]),
      ),
      "tributaries",
    );
  for (const rows of Object.values(tiles))
    for (const r of Object.values(rows))
      for (const kind of ["rivers", "tributaries"])
        for (const [id, p] of Object.entries(r.render[kind]))
          r.render[kind][id] = floats(p);
}
for (const [key, rows] of Object.entries(fine)) {
  const payload = {
    version: 1,
    key,
    sourceSha256: I.sourceSha256,
    provinces: rows,
  };
  const data = Buffer.from(
    "window.GMChinaTerrainStream.receive(" +
      JSON.stringify(key) +
      "," +
      JSON.stringify(payload) +
      ");\n",
  );
  fs.writeFileSync(path.join(root, I.tiles[key].file), data);
  I.tiles[key].bytes = data.length;
  I.tiles[key].sha256 = createHash("sha256").update(data).digest("hex");
}
I.waterBaked = true;
I.waterSourceHashes = Object.fromEntries(['china-rivers-data.js','china-hydrology-data.js','china-hydrology-geo.js','china-adventures-data.js','china-3d-geometry.js'].map(file=>[file,createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
fs.writeFileSync(
  path.join(root, "china-terrain-index.js"),
  "/* 本地概览、河线与详细块目录；由地形拆分和河线烘焙脚本生成。 */\nwindow.GM_CHINA_TERRAIN_INDEX = " +
    JSON.stringify(I) +
    ";\n",
);
console.log("两级贴地河线烘焙完成");

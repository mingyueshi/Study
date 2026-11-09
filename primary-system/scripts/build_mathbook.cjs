/* 把 content_sources/ 的数学教材静态数据与图示资产确定性同步到 mathbook 应用。
   数学教材按册编排：BOOKS 映射一行一册（册次码对齐 catalog 教材码后缀，
   如 bnu-math-4a-2026 → '4a'），新增册次 = 加源数据文件 + 这里加一行。

   每册产出：
   1. static/mathbook/books/<册>.js —— 规范化为 `const MKB = <JSON>;`（浏览器
      直接加载；Python 端剥壳解析校验，见 mathbook/content.py）；
   2. mathbook/data/books/<册>.json —— 结构摘要（册次码、来源 sha256、
      单元/知识点计数、图示/横幅/视频 id 清单），供加载期校验与测试对账。

   另同步共享资产（与册次无关）：
   3. static/mathbook/math-figures.js 与 static/figures/figures.js、figures.css ——
      图示库（figures 是语文/数学共用库，DB 阅读器的图示块同样消费）；
   4. static/images/math/ —— 情境照片、单元横幅、视频封面（只增不删）。

   内容源头在 content_sources/：先跑该册声明的源数据测试
   （本脚本会先代跑作为审计门），再重跑本脚本。
   与 build_grammar.cjs 同纪律：确定性产出、重跑无 diff。 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const SOURCES = path.resolve(__dirname, '../content_sources');
const TARGET_DIR = path.resolve(__dirname, '../static/mathbook');
const SHARED_FIG_DIR = path.resolve(__dirname, '../static/figures');
const IMAGE_TARGET = path.resolve(__dirname, '../static/images/math');
const BOOKS_DIR = path.resolve(__dirname, '../mathbook/data/books');

/* 册次注册表：册次码 → { file: 源数据文件, test: 源头测试, textbook_code: catalog 教材码 } */
const BOOKS = {
  '4a': { file: 'math-data.js', test: 'test/test-math-knowledge.js', textbook_code: 'bnu-math-4a-2026' },
};

/* ---------- 源头审计：先跑各册声明的静态版测试 ---------- */
for (const testFile of [...new Set(Object.values(BOOKS).map((b) => b.test))]) {
  const audit = spawnSync('node', [path.join(SOURCES, testFile)], { encoding: 'utf8' });
  if (audit.status !== 0) {
    console.error(audit.stdout || '');
    console.error(audit.stderr || '');
    console.error(`源头审计未通过（content_sources/${testFile}），已停止同步。`);
    process.exit(1);
  }
}

/* ---------- 加载图示库（静态文件无 module.exports 的部分照静态版桩加载） ---------- */
globalThis.window = {};
const FIGS = require(path.join(SOURCES, 'figures.js'));
const MFIGS = require(path.join(SOURCES, 'math-figures.js'));

/* ---------- 每册：加载 → 引用审计 → 产出数据与 manifest ---------- */
fs.mkdirSync(TARGET_DIR, { recursive: true });
fs.mkdirSync(BOOKS_DIR, { recursive: true });
const summary = [];
for (const [book, spec] of Object.entries(BOOKS)) {
  const MKB = require(path.join(SOURCES, spec.file));
  const errors = [];
  const hasFig = (id) => FIGS.has(id) || MFIGS.has(id);
  const figIds = [];
  const videoIds = [];
  const videoById = new Map(((MKB.videos && MKB.videos.list) || []).map((v) => [v.id, v]));
  for (const unit of MKB.units) {
    if (unit.banner && !MFIGS.has(unit.banner)) errors.push(`单元 ${unit.id} 横幅未注册：${unit.banner}`);
    for (const point of unit.points) {
      if (!hasFig(point.fig)) errors.push(`知识点 ${point.id} 图示未注册：${point.fig}`);
      figIds.push(point.fig);
      if (point.video && !videoById.has(point.video)) errors.push(`知识点 ${point.id} 关联视频不存在：${point.video}`);
    }
  }
  for (const video of (MKB.videos && MKB.videos.list) || []) {
    videoIds.push(video.id);
    if (!fs.existsSync(path.join(SOURCES, video.cover))) errors.push(`视频 ${video.id} 封面缺失：${video.cover}`);
  }
  for (const [bannerId, bannerPath] of Object.entries(MKB.banners || {})) {
    if (!fs.existsSync(path.join(SOURCES, bannerPath))) errors.push(`横幅照片缺失：${bannerId} → ${bannerPath}`);
  }
  if (errors.length) {
    console.error(`[${book}] 引用审计未通过：`);
    errors.forEach((line) => console.error('  ❌ ' + line));
    process.exit(1);
  }

  const dataTarget = path.join(TARGET_DIR, 'books', `${book}.js`);
  fs.mkdirSync(path.dirname(dataTarget), { recursive: true });
  fs.writeFileSync(dataTarget, '/* 生成物：由 scripts/build_mathbook.cjs 从 content_sources/ 生成，勿手改。 */\n'
    + 'const MKB = ' + JSON.stringify(MKB, null, 2) + ';\n', 'utf8');

  const sourceSha = crypto.createHash('sha256')
    .update(fs.readFileSync(path.join(SOURCES, spec.file))).digest('hex');
  const manifest = {
    schema_version: 1,
    book,
    textbook_code: spec.textbook_code,
    source_file: `content_sources/${spec.file}`,
    source_sha256: sourceSha,
    units: MKB.units.length,
    points: MKB.units.reduce((n, u) => n + u.points.length, 0),
    fig_ids: figIds,
    banner_ids: Object.keys(MKB.banners || {}),
    video_ids: videoIds,
  };
  fs.writeFileSync(path.join(BOOKS_DIR, `${book}.json`), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  summary.push(`[${book}] units=${manifest.units} points=${manifest.points} figs=${figIds.length} videos=${videoIds.length}`);
}

/* ---------- 共享资产：图示库与图片（只增不删，字节级拷贝） ---------- */
function copyFile(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const incoming = fs.readFileSync(source);
  if (fs.existsSync(target) && incoming.equals(fs.readFileSync(target))) return;
  fs.writeFileSync(target, incoming);
}
copyFile(path.join(SOURCES, 'math-figures.js'), path.join(TARGET_DIR, 'math-figures.js'));
copyFile(path.join(SOURCES, 'figures.js'), path.join(SHARED_FIG_DIR, 'figures.js'));
copyFile(path.join(SOURCES, 'figures.css'), path.join(SHARED_FIG_DIR, 'figures.css'));
function syncImages(dir, targetDir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const source = path.join(dir, entry.name);
    if (entry.isDirectory()) { syncImages(source, path.join(targetDir, entry.name)); continue; }
    if (!/\.(jpg|jpeg|png|webp)$/i.test(entry.name)) continue;
    copyFile(source, path.join(targetDir, entry.name));
  }
}
syncImages(path.join(SOURCES, 'images/math'), IMAGE_TARGET);

console.log('✅ mathbook 同步完成：' + summary.join('，'));

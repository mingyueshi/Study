/* 把 content_sources/ 的语文教材静态数据与图片资产确定性同步到 chinesebook 应用。
   语文教材按册编排：BOOKS 映射一行一册（册次码对齐 catalog 教材码后缀，
   如 pep-chinese-4a-2026 → '4a'），新增册次 = primary 加数据文件 + 这里加一行。

   每册产出：
   1. static/chinesebook/books/<册>.js —— 规范化为 `const KB = <JSON>;`（浏览器
      直接加载；Python 端剥壳解析校验，见 chinesebook/content.py）；
   2. chinesebook/data/books/<册>.json —— 结构摘要（册次码、来源 sha256、
      单元/课文/古诗文/字词计数、图示 id 清单），供加载期校验与测试对账。

   另同步共享资产（与册次无关，与 build_mathbook.cjs 同源同产物）：
   3. static/chinesebook/knowledge-figures.js?（语文无专属图示库，共用 figures）——
      static/figures/figures.js、figures.css 图示库；
   4. static/images/lessons/、static/images/poems/ —— 课文照片与古诗意境图
      （只增不删）。

   内容源头在 content_sources/：先跑该册声明的源数据测试
   （本脚本会先代跑作为审计门），再重跑本脚本。
   与 build_mathbook.cjs 同纪律：确定性产出、重跑无 diff。 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const SOURCES = path.resolve(__dirname, '../content_sources');
const TARGET_DIR = path.resolve(__dirname, '../static/chinesebook');
const SHARED_FIG_DIR = path.resolve(__dirname, '../static/figures');
const BOOKS_DIR = path.resolve(__dirname, '../chinesebook/data/books');

/* 册次注册表：册次码 → { file: primary 数据文件, test: 源头测试, textbook_code: catalog 教材码 } */
const BOOKS = {
  '4a': { file: 'knowledge-data.js', test: 'test/test-knowledge.js', textbook_code: 'pep-chinese-4a-2026' },
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

/* ---------- 每册：加载 → 引用审计 → 产出数据与 manifest ---------- */
fs.mkdirSync(TARGET_DIR, { recursive: true });
fs.mkdirSync(BOOKS_DIR, { recursive: true });
const summary = [];
for (const [book, spec] of Object.entries(BOOKS)) {
  const KB = require(path.join(SOURCES, spec.file));
  const errors = [];
  const figIds = [];
  const imageRefs = [];
  for (const unit of KB.units) {
    if (unit.banner) {
      if (!FIGS.has(unit.banner)) errors.push(`单元 ${unit.id} 横幅图示未注册：${unit.banner}`);
      figIds.push(unit.banner);
    }
    for (const lesson of unit.lessons) {
      if (lesson.fig) {
        if (!FIGS.has(lesson.fig)) errors.push(`课文 ${lesson.id} 图示未注册：${lesson.fig}`);
        figIds.push(lesson.fig);
      }
      if (lesson.img) imageRefs.push(lesson.img);
    }
  }
  for (const poem of KB.poems) {
    if (poem.fig) {
      if (!FIGS.has(poem.fig)) errors.push(`古诗文《${poem.title}》图示未注册：${poem.fig}`);
      figIds.push(poem.fig);
    }
    if (poem.img) imageRefs.push(poem.img);
  }
  for (const img of imageRefs) {
    if (!fs.existsSync(path.join(SOURCES, img))) errors.push(`图片缺失：${img}`);
  }
  if (errors.length) {
    console.error(`[${book}] 引用审计未通过：`);
    errors.forEach((line) => console.error('  ❌ ' + line));
    process.exit(1);
  }

  const dataTarget = path.join(TARGET_DIR, 'books', `${book}.js`);
  fs.mkdirSync(path.dirname(dataTarget), { recursive: true });
  fs.writeFileSync(dataTarget, '/* 生成物：由 scripts/build_chinesebook.cjs 从 content_sources/ 生成，勿手改。 */\n'
    + 'const KB = ' + JSON.stringify(KB, null, 2) + ';\n', 'utf8');

  const sourceSha = crypto.createHash('sha256')
    .update(fs.readFileSync(path.join(SOURCES, spec.file))).digest('hex');
  const manifest = {
    schema_version: 1,
    book,
    textbook_code: spec.textbook_code,
    source_file: `content_sources/${spec.file}`,
    source_sha256: sourceSha,
    units: KB.units.length,
    lessons: KB.units.reduce((n, u) => n + u.lessons.length, 0),
    poems: KB.poems.length,
    sayings: KB.sayings.reduce((n, s) => n + s.items.length, 0),
    polyphonic: KB.polyphonic.length,
    similar: KB.similar.length,
    fig_ids: figIds,
    image_refs: imageRefs,
  };
  fs.writeFileSync(path.join(BOOKS_DIR, `${book}.json`), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  summary.push(`[${book}] units=${manifest.units} lessons=${manifest.lessons} poems=${manifest.poems} figs=${figIds.length} imgs=${imageRefs.length}`);
}

/* ---------- 共享资产：图示库与图片（只增不删，字节级拷贝） ---------- */
function copyFile(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const incoming = fs.readFileSync(source);
  if (fs.existsSync(target) && incoming.equals(fs.readFileSync(target))) return;
  fs.writeFileSync(target, incoming);
}
copyFile(path.join(SOURCES, 'figures.js'), path.join(SHARED_FIG_DIR, 'figures.js'));
copyFile(path.join(SOURCES, 'figures.css'), path.join(SHARED_FIG_DIR, 'figures.css'));
function syncImages(dir, targetRoot) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const source = path.join(dir, entry.name);
    if (entry.isDirectory()) { syncImages(source, path.join(targetRoot, entry.name)); continue; }
    if (!/\.(jpg|jpeg|png|webp)$/i.test(entry.name)) continue;
    copyFile(source, path.join(targetRoot, entry.name));
  }
}
syncImages(path.join(SOURCES, 'images/lessons'), path.resolve(__dirname, '../static/images/lessons'));
syncImages(path.join(SOURCES, 'images/poems'), path.resolve(__dirname, '../static/images/poems'));

console.log('✅ chinesebook 同步完成：' + summary.join('，'));

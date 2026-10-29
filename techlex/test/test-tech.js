/* ============================================================
   TechLex 数据完整性测试
   运行：node test/test-tech.js
   ============================================================ */
'use strict';
const D = require('../tech-data.js');
const UNITS = D.TECH_UNITS;
const ZH = D.TECH_ZH || {};

let fails = 0;
let checked = 0;
const ok = (cond, msg) => { checked++; if (!cond) { fails++; console.error('  ❌ ' + msg); } };

console.log('— 分类结构 —');
ok(Array.isArray(UNITS) && UNITS.length >= 6, '至少 6 个分类，实际 ' + UNITS.length);
const unitIds = new Set();
const seen = new Map();   // term -> 分类 id
let count = 0;
let abbrCount = 0;
let inBookRelated = 0, allRelated = 0;

const ipaRe = /^\/[a-zɑːæʌəɜːɪʊɒeɪaʊɔɪʃʒθðŋɡˈˌ\.ː\s-]+\/$/i;
const latinRe = /[a-zA-Z]/;

for (const u of UNITS) {
  ok(u.id && !unitIds.has(u.id), '分类 id 唯一：' + u.id);
  unitIds.add(u.id);
  ok(u.name && u.emoji && u.color, '分类 ' + u.id + ' 缺少 name/emoji/color');
  ok(Array.isArray(u.terms) && u.terms.length >= 9, '分类 ' + u.id + ' 至少 9 个术语，实际 ' + (u.terms ? u.terms.length : 0));

  for (const w of u.terms) {
    count++;
    const tag = '[' + u.id + '] ' + w.term;
    ok(w.term && typeof w.term === 'string' && w.term.length >= 2, tag + ' term 必填');
    ok(!seen.has(w.term), tag + ' 全书重复（' + seen.get(w.term) + ' 已有）');
    seen.set(w.term, u.id);
    if (w.ipa) ok(ipaRe.test(w.ipa), tag + ' 音标格式异常：' + w.ipa);
    if (w.abbr) {
      abbrCount++;
      ok(w.abbr.length >= 4, tag + ' 缩写展开太短');
      ok(typeof w.say === 'string' && w.say.length >= 1, tag + ' 缩写术语需要 say 字段指定朗读');
    } else {
      ok(!!w.ipa, tag + ' 非缩写术语必须有音标');
    }
    ok(w.zh && w.zh.length >= 4, tag + ' 中文释义太短或缺失');
    ok(Array.isArray(w.parts) && w.parts.length >= 1 && w.parts.length <= 4, tag + ' 构词拆分 1~4 段');
    for (const p of w.parts || []) {
      ok(p && p.t && typeof p.t === 'string' && p.t.length > 0, tag + ' 拆分段缺 t');
      ok(p && p.d && typeof p.d === 'string' && p.d.length > 0, tag + ' 拆分段缺 d：' + (p && p.t));
    }
    ok(latinRe.test(w.example || ''), tag + ' 例句应为英文');
    ok(w.example && w.example.length >= 15, tag + ' 例句太短');
    ok(w.exampleZh && w.exampleZh.length >= 4, tag + ' 缺少例句中文翻译');
    ok(Array.isArray(w.related) && w.related.length >= 1, tag + ' 至少 1 个关联术语');
    for (const r of w.related || []) {
      allRelated++;
      if (seen.has(r) || UNITS.some(x => x.terms.some(y => y.term === r))) inBookRelated++;
    }
  }
}

console.log('— 关联术语中文解释覆盖 —');
ok(Object.keys(ZH).length >= 50, 'TECH_ZH 词典应不少于 50 条，实际 ' + Object.keys(ZH).length);
const referenced = new Set();
const missing = [];
for (const u of UNITS) {
  for (const w of u.terms) {
    for (const r of w.related || []) {
      referenced.add(r);
      const inBook = seen.has(r);
      const zh = inBook
        ? (UNITS.reduce((acc, x) => acc.concat(x.terms), []).find(v => v.term === r) || {}).zh
        : ZH[r];
      if (!(zh && String(zh).length)) missing.push(u.id + ':' + w.term + ' → ' + r);
    }
  }
}
ok(missing.length === 0, '以下关联术语缺少中文解释：' + missing.join('；'));
const unreferenced = Object.keys(ZH).filter(k => !referenced.has(k));
if (unreferenced.length) console.log('  ⚠️ TECH_ZH 中未被引用（可留作备用）：' + unreferenced.join('、'));

console.log('— 覆盖情况 —');
console.log('  分类数: ' + UNITS.length + '，术语总数: ' + count + '（其中缩写 ' + abbrCount + ' 个）');
console.log('  关联引用共 ' + allRelated + ' 个，其中 ' + inBookRelated + ' 个在书内（显示 ◆ 角标）');
ok(inBookRelated >= 20, '关联术语应与书内形成网络（当前 ' + inBookRelated + '）');

console.log(fails === 0
  ? '\n✅ 全部通过（共断言 ' + checked + ' 项）'
  : '\n❌ 共 ' + fails + ' / ' + checked + ' 项失败');
process.exit(fails === 0 ? 0 : 1);

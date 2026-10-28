/* ============================================================
   乐学堂 · 成语本数据完整性测试
   运行：node test/test-idioms.js
   ============================================================ */
'use strict';
const D = require('../idioms-data.js');
const UNITS = D.IDIOM_UNITS;
const ZH = D.IDIOM_ZH || {};

let fails = 0;
let checked = 0;
const ok = (cond, msg) => { checked++; if (!cond) { fails++; console.error('  ❌ ' + msg); } };

console.log('— 分类结构 —');
ok(Array.isArray(UNITS) && UNITS.length >= 5, '至少 5 个分类，实际 ' + UNITS.length);
const unitIds = new Set();
const seen = new Map();   // 成语 -> 分类 id（全书不得重复）
let count = 0;
let inBookSynAnt = 0, allSynAnt = 0;

for (const u of UNITS) {
  ok(u.id && !unitIds.has(u.id), '分类 id 唯一：' + u.id);
  unitIds.add(u.id);
  ok(u.name && u.emoji && u.color, '分类 ' + u.id + ' 缺少 name/emoji/color');
  ok(Array.isArray(u.idioms) && u.idioms.length >= 8, '分类 ' + u.id + ' 至少 8 条，实际 ' + (u.idioms ? u.idioms.length : 0));

  for (const w of u.idioms) {
    count++;
    const tag = '[' + u.id + '] ' + w.idiom;
    ok(/^[\u4e00-\u9fff]{4}$/.test(w.idiom || ''), tag + ' 应为 4 个汉字');
    ok(!seen.has(w.idiom), tag + ' 全书重复（' + seen.get(w.idiom) + ' 已有）');
    seen.set(w.idiom, u.id);

    // 拼音：4 个音节、只含拼音字母和声调符号
    const syl = String(w.pinyin || '').trim().split(/\s+/);
    ok(syl.length === 4, tag + ' 拼音应为 4 个音节：' + w.pinyin);
    const pinyinRe = /^[a-zāáǎàēéěèīíǐìōóǒòūúǔùüǖǘǚǜ]+$/i;
    syl.forEach((s, i) => ok(pinyinRe.test(s), tag + ' 第 ' + (i + 1) + ' 个音节异常：' + s));

    ok(w.zh && w.zh.length >= 8, tag + ' 释义太短或缺失');
    ok(Array.isArray(w.chars) && w.chars.length === 4, tag + ' 逐字拆分应为 4 项');
    (w.chars || []).forEach((c, i) => {
      ok(c && c.t === w.idiom[i], tag + ' 第 ' + (i + 1) + ' 个字应为「' + w.idiom[i] + '」，实际：' + (c && c.t));
      ok(c && c.d && typeof c.d === 'string' && c.d.length > 0, tag + ' 「' + w.idiom[i] + '」缺少字义');
    });
    ok(w.example && w.example.length >= 6, tag + ' 缺少例句');
    if (w.story !== undefined) ok(String(w.story).length >= 10, tag + ' story 太短');
    if (w.source !== undefined) ok(String(w.source).length >= 2, tag + ' source 太短');

    for (const key of ['syn', 'ant']) {
      if (w[key]) {
        ok(Array.isArray(w[key]), tag + ' ' + key + ' 应为数组');
        for (const r of w[key] || []) {
          allSynAnt++;
          if (seen.has(r) || UNITS.some(x => x.idioms.some(y => y.idiom === r))) inBookSynAnt++;
        }
      }
    }
  }
}

console.log('— 近反义成语中文解释覆盖 —');
ok(Object.keys(ZH).length >= 50, 'IDIOM_ZH 词典应不少于 50 条，实际 ' + Object.keys(ZH).length);
const referenced = new Set();
const missing = [];
for (const u of UNITS) {
  for (const w of u.idioms) {
    for (const key of ['syn', 'ant']) {
      for (const r of w[key] || []) {
        referenced.add(r);
        const inBook = seen.has(r);
        const zh = inBook
          ? (UNITS.reduce((acc, x) => acc.concat(x.idioms), []).find(v => v.idiom === r) || {}).zh
          : ZH[r];
        if (!(zh && String(zh).length)) missing.push(u.id + ':' + w.idiom + ' → ' + r);
      }
    }
  }
}
ok(missing.length === 0, '以下近反义成语缺少中文解释：' + missing.join('；'));
const unreferenced = Object.keys(ZH).filter(k => !referenced.has(k));
if (unreferenced.length) console.log('  ⚠️ IDIOM_ZH 中未被引用（可留作备用）：' + unreferenced.join('、'));

console.log('— 覆盖情况 —');
console.log('  分类数: ' + UNITS.length + '，成语总数: ' + count);
console.log('  近反义引用共 ' + allSynAnt + ' 个，其中 ' + inBookSynAnt + ' 个在书内（显示 📖 角标）');
ok(inBookSynAnt >= 10, '近反义应与书内成语形成网络（当前 ' + inBookSynAnt + '）');

console.log(fails === 0
  ? '\n✅ 全部通过（共断言 ' + checked + ' 项）'
  : '\n❌ 共 ' + fails + ' / ' + checked + ' 项失败');
process.exit(fails === 0 ? 0 : 1);

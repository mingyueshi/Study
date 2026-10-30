/* ============================================================
   乐学堂 · 单词本数据完整性测试
   运行：node test/test-words.js
   ============================================================ */
'use strict';
const WORDS = require('../words-data.js');
const D = WORDS.WORD_UNITS;

let fails = 0;
let checked = 0;
const ok = (cond, msg) => { checked++; if (!cond) { fails++; console.error('  ❌ ' + msg); } };

console.log('— 单元结构 —');
ok(Array.isArray(D) && D.length >= 5, '至少 5 个单元，实际 ' + D.length);
const unitIds = new Set();
const seen = new Map();   // en -> unit id（全书不得重复）
let wordCount = 0;
let inBookRelated = 0, allRelated = 0;

for (const u of D) {
  ok(u.id && !unitIds.has(u.id), '单元 id 唯一：' + u.id);
  unitIds.add(u.id);
  ok(u.name && u.zh && u.emoji && u.color, '单元 ' + u.id + ' 缺少 name/zh/emoji/color');
  ok(Array.isArray(u.words) && u.words.length >= 8, '单元 ' + u.id + ' 至少 8 词，实际 ' + (u.words ? u.words.length : 0));

  for (const w of u.words) {
    wordCount++;
    const tag = '[' + u.id + '] ' + w.en;
    ok(w.en && typeof w.en === 'string', tag + ' en 必填');
    ok(!seen.has(w.en), tag + ' 全书重复（' + seen.get(w.en) + ' 已有）');
    seen.set(w.en, u.id);
    ok(/^\/.+\/$/.test(w.ipa || ''), tag + ' 音标需以 / 包裹：' + w.ipa);
    ok(w.zh && w.zh.length > 0, tag + ' 缺少中文注释');
    ok(Array.isArray(w.parts) && w.parts.length >= 1 && w.parts.length <= 4, tag + ' 拆分 1~4 段');
    for (const p of w.parts || []) {
      ok(p && p.t && typeof p.t === 'string' && p.t.length > 0, tag + ' 拆分段缺 t');
      ok(p && p.d && typeof p.d === 'string' && p.d.length > 0, tag + ' 拆分段缺 d：' + (p && p.t));
      if (p && p.say !== undefined) ok(typeof p.say === 'string' && p.say.length > 0, tag + ' say 应为非空字符串：' + (p && p.t));
    }
    ok(w.memo && w.memo.length >= 4, tag + ' 缺少拆分解释 memo');
    ok(Array.isArray(w.related) && w.related.length >= 1, tag + ' 至少 1 个相关词');
    ok(typeof w.emoji === 'string' && (w.emoji === '' ? true : w.emoji.length >= 1), tag + ' emoji 应为字符串（可空）');
    if (w.img !== undefined) ok(typeof w.img === 'string', tag + ' img 应为字符串');
    for (const r of w.related || []) {
      allRelated++;
      if (seen.has(r) || D.some(x => x.words.some(y => y.en === r))) inBookRelated++;
    }
  }
}

console.log('— 相关词中文解释覆盖 —');
const WORD_ZH = WORDS.WORD_ZH || {};
ok(Object.keys(WORD_ZH).length >= 100, 'WORD_ZH 词典应不少于 100 条，实际 ' + Object.keys(WORD_ZH).length);
const bookWords = new Set();
D.forEach(u => u.words.forEach(w => bookWords.add(w.en)));
const referenced = new Set();
const missingZh = [];
for (const u of D) {
  for (const w of u.words) {
    for (const r of w.related || []) {
      referenced.add(r);
      const inBook = bookWords.has(r);
      const zh = inBook ? (D.reduce((acc, x) => acc.concat(x.words), []).find(v => v.en === r) || {}).zh : WORD_ZH[r];
      if (!(zh && String(zh).length)) missingZh.push(u.id + ':' + w.en + ' → ' + r);
    }
  }
}
ok(missingZh.length === 0, '以下相关词缺少中文解释（在书内需有 zh，书外需在 WORD_ZH 中）：' + missingZh.join('；'));
const unreferenced = Object.keys(WORD_ZH).filter(k => !referenced.has(k));
if (unreferenced.length) console.log('  ⚠️ WORD_ZH 中未被任何相关词引用（可留作备用）：' + unreferenced.join('、'));

console.log('— 覆盖情况 —');
console.log('  单元数: ' + D.length + '，单词总数: ' + wordCount);
console.log('  相关词共 ' + allRelated + ' 个，其中 ' + inBookRelated + ' 个在书内（显示 📖 角标）');
ok(inBookRelated >= 40, '书内相关词应有一定规模（当前 ' + inBookRelated + '）');

console.log('— 主题全面性抽查 —');
const find = en => { for (const u of D) { const w = u.words.find(x => x.en === en); if (w) return w; } return null; };
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
for (const d of days) {
  ok(!!find(d), '星期单元包含 ' + d);
  const rel = find(d) ? find(d).related : [];
  for (const other of days) {
    if (other !== d) ok(rel.includes(other), d + ' 的相关词应包含 ' + other);
  }
}
ok(days.every(d => relOf('week', d)), 'week 的相关词包含全部七天');
function relOf(en, target) { const w = find(en); return w && w.related.includes(target); }
for (const s of ['spring', 'summer', 'autumn', 'winter']) {
  ok(!!find(s), '季节单元包含 ' + s);
  const w = find(s);
  for (const other of ['spring', 'summer', 'autumn', 'winter']) {
    if (other !== s) ok(w.related.includes(other), s + ' 的相关词应包含 ' + other);
  }
}

console.log(fails === 0
  ? '\n✅ 全部通过（共断言 ' + checked + ' 项）'
  : '\n❌ 共 ' + fails + ' / ' + checked + ' 项失败');
process.exit(fails === 0 ? 0 : 1);

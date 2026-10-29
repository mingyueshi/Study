/* ============================================================
   乐学堂 · 作文坊数据完整性测试
   运行：node test/test-writing.js
   ============================================================ */
'use strict';
const D = require('../writing-data.js');
const UNITS = D.WRITING_UNITS;
const M = D.WRITING_MATERIALS;

let fails = 0;
let checked = 0;
const ok = (cond, msg) => { checked++; if (!cond) { fails++; console.error('  ❌ ' + msg); } };

console.log('— 分类与题目结构 —');
ok(Array.isArray(UNITS) && UNITS.length >= 5, '至少 5 个分类，实际 ' + UNITS.length);
const seen = new Map();
let count = 0;
for (const u of UNITS) {
  ok(u.id && u.name && u.emoji && u.color, '分类 ' + u.id + ' 缺少 name/emoji/color');
  ok(Array.isArray(u.topics) && u.topics.length >= 2, '分类 ' + u.id + ' 至少 2 个题目，实际 ' + (u.topics ? u.topics.length : 0));
  for (const t of u.topics) {
    count++;
    const tag = '[' + u.id + '] ' + t.title;
    ok(t.title && !seen.has(t.title), tag + ' 题目重复或为空');
    seen.set(t.title, u.id);
    ok(t.goal && t.goal.length >= 8, tag + ' 缺少写作目标');
    ok(Array.isArray(t.outline) && t.outline.length === 3, tag + ' 结构锦囊应为 3 步');
    (t.outline || []).forEach((o, i) => {
      ok(o && o.label && o.text && o.text.length >= 8, tag + ' 第 ' + (i + 1) + ' 步锦囊不完整');
    });
    ok(/开头/.test((t.outline || [])[0] ? t.outline[0].label : ''), tag + ' 第一步应为「开头」');
    ok(/结尾/.test((t.outline || [])[2] ? t.outline[2].label : ''), tag + ' 第三步应为「结尾」');
    ok(Array.isArray(t.words) && t.words.length >= 3, tag + ' 好词至少 3 个');
    ok(Array.isArray(t.sentences) && t.sentences.length >= 2, tag + ' 好句至少 2 句');
    ok(t.model && countWords(t.model) >= 120, tag + ' 范文太短（' + countWords(t.model) + ' 字，应 ≥120）');
    ok(t.comment && t.comment.length >= 10, tag + ' 缺少点评');
    ok(t.task && t.task.length >= 8, tag + ' 缺少小练笔');
  }
}
function countWords(s) { return String(s || '').replace(/\s/g, '').length; }

console.log('— 素材百宝箱 —');
ok(M && Array.isArray(M.starts) && M.starts.length >= 5, '好开头至少 5 个');
M.starts.forEach((s, i) => ok(s.type && s.text && s.text.length >= 8, '好开头第 ' + (i + 1) + ' 条不完整'));
ok(Array.isArray(M.ends) && M.ends.length >= 4, '好结尾至少 4 个');
M.ends.forEach((s, i) => ok(s.type && s.text && s.text.length >= 6, '好结尾第 ' + (i + 1) + ' 条不完整'));
ok(Array.isArray(M.wordGroups) && M.wordGroups.length >= 3, '好词分组至少 3 组');
M.wordGroups.forEach((g, i) => {
  ok(g.name && Array.isArray(g.words) && g.words.length >= 4, '好词第 ' + (i + 1) + ' 组不完整');
});
ok(Array.isArray(M.sentences) && M.sentences.length >= 5, '好句至少 5 句');

console.log('— 覆盖情况 —');
console.log('  分类数: ' + UNITS.length + '，题目总数: ' + count);
console.log('  范文总字数: ' + UNITS.reduce((n, u) => n + u.topics.reduce((m, t) => m + countWords(t.model), 0), 0));
ok(count >= 10, '题目总数应不少于 10，实际 ' + count);

console.log(fails === 0
  ? '\n✅ 全部通过（共断言 ' + checked + ' 项）'
  : '\n❌ 共 ' + fails + ' / ' + checked + ' 项失败');
process.exit(fails === 0 ? 0 : 1);

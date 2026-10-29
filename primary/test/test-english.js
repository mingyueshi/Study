/* ============================================================
   乐学堂 · 外研版教材同步英语数据测试
   运行：node test/test-english.js
   ============================================================ */
'use strict';
const { ENGLISH_UNITS, ENGLISH_BOOKS, ENGLISH_WORDS } = require('../english-data.js');

let fails = 0;
let checked = 0;
const ok = (condition, message) => {
  checked++;
  if (!condition) { fails++; console.error('  ❌ ' + message); }
};
const normalize = text => text.toLowerCase().replace(/[^a-z]/g, '');

console.log('— 教材结构 —');
ok(ENGLISH_UNITS.length === 12, '四年级上下册应有 12 个单元，实际 ' + ENGLISH_UNITS.length);
ok(ENGLISH_BOOKS.length === 2 && ENGLISH_BOOKS[0] === '四年级上册' && ENGLISH_BOOKS[1] === '四年级下册', '册别顺序应为四年级上册、下册');
for (const book of ENGLISH_BOOKS) {
  ok(ENGLISH_UNITS.filter(unit => unit.book === book).length === 6, book + ' 应有 6 个单元');
}
const expectedTitles = [
  'I love sports', 'Helping at home', "What's the weather like?", 'Wonderful seasons', "Let's go!", 'Find your way',
  'People at work', 'How do you feel today?', "Everyone's got talent!", 'Plant life', 'School activities', 'Cool clothes',
];
ENGLISH_UNITS.forEach((unit, index) => {
  ok(unit.name.includes(expectedTitles[index]), '单元顺序或标题不符：' + unit.id + ' / ' + unit.name);
});

console.log('— 词卡完整性 —');
const unitIds = new Set();
const keys = new Set();
let total = 0;
for (const unit of ENGLISH_UNITS) {
  ok(unit.id && !unitIds.has(unit.id), '单元 id 唯一：' + unit.id);
  unitIds.add(unit.id);
  ok(unit.words.length >= 10, unit.id + ' 至少 10 条词汇，实际 ' + unit.words.length);
  ok(!unit.patterns, unit.id + ' 不应再包含句型数据');
  const localWords = new Set(unit.words.map(word => word.en));
  for (const word of unit.words) {
    total++;
    const tag = '[' + unit.id + '] ' + word.en;
    ok(word.key === unit.id + ':' + word.en, tag + ' key 应由单元和英文组成');
    ok(!keys.has(word.key), tag + ' key 重复');
    keys.add(word.key);
    ok(/^\/.+\/$/.test(word.ipa || ''), tag + ' 音标需用 / / 包裹');
    ok(word.zh && word.zh.length > 0, tag + ' 缺少中文释义');
    ok(typeof word.emoji === 'string', tag + ' emoji 应为字符串');
    ok(Array.isArray(word.parts) && word.parts.length >= 1 && word.parts.length <= 4, tag + ' 拆分段应为 1～4 段');
    ok(normalize(word.parts.map(part => part.t).join('')) === normalize(word.en), tag + ' 拆分后不能还原原词');
    for (const part of word.parts) ok(part.t && part.d, tag + ' 拆分段缺少文本或说明');
    ok(word.memo && word.memo.length >= 4, tag + ' 缺少记忆提示');
    ok(Array.isArray(word.related) && word.related.length >= 3, tag + ' 至少 3 个单元内关联词');
    for (const related of word.related) ok(localWords.has(related), tag + ' 关联词不在本单元：' + related);
  }
}
ok(total === 306, '总词数应为 306，实际 ' + total);
ok(ENGLISH_WORDS.length === total, '练习索引导出数应与词卡数一致');

console.log(fails === 0
  ? '\n✅ 全部通过（' + ENGLISH_UNITS.length + ' 单元，' + total + ' 条词卡，共断言 ' + checked + ' 项）'
  : '\n❌ 共 ' + fails + ' / ' + checked + ' 项失败');
process.exit(fails === 0 ? 0 : 1);

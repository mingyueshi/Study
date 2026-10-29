/* ============================================================
   语文知识点数据测试
   运行：node test/test-knowledge.js
   验证单元/课文结构与教材目录一致、知识点字段完整、拼音格式正确。
   ============================================================ */
'use strict';
const KB = require('../knowledge-data.js');
const FIGS = require('../figures.js');

let fails = 0;
let checked = 0;
function check(cond, msg) {
  checked++;
  if (!cond) { fails++; console.error('  ❌ ' + msg); }
}
function isStr(v) { return typeof v === 'string' && v.trim().length > 0; }
const PY_RE = /^[a-zāáǎàēéěèīíǐìōóǒòūúǔù]+$/i;

/* ---------- 总体结构 ---------- */
console.log('— 单元与课文结构 —');
check(Array.isArray(KB.units) && KB.units.length === 8, '应有 8 个单元，实际 ' + (KB.units || []).length);
check(isStr(KB.textbook), '缺少 textbook');
check(isStr(KB.edition), '缺少 edition');

const seenLessons = new Set();
const PER_UNIT = [3, 4, 3, 4, 2, 3, 4, 4];
KB.units.forEach((u, i) => {
  const tag = '[' + (u.id || 'u?') + ']';
  check(/^u[1-8]$/.test(u.id), tag + ' 单元 id 应为 u1-u8');
  check(u.id === 'u' + (i + 1), tag + ' 单元顺序错误');
  check(isStr(u.no) && u.no.includes('单元'), tag + ' 缺少单元编号');
  check(isStr(u.name), tag + ' 缺少单元名');
  check(typeof u.emoji === 'string' && u.emoji.length > 0, tag + ' 缺少 emoji');
  check(/^#[0-9a-f]{6}$/i.test(u.color), tag + ' 颜色格式: ' + u.color);
  check(isStr(u.intro), tag + ' 缺少单元导语');
  check(Array.isArray(u.goals) && u.goals.length >= 2 && u.goals.every(isStr), tag + ' 学习重点至少 2 条');
  check(u.writing && isStr(u.writing.title) && u.writing.points.every(isStr) && u.writing.points.length >= 2,
    tag + ' 习作板块不完整');
  if (u.oral) check(isStr(u.oral.title) && u.oral.points.every(isStr), tag + ' 口语交际板块不完整');
  if (u.garden) check(Array.isArray(u.garden) && u.garden.every(isStr), tag + ' 园地板块不完整');
  if (u.book) check(isStr(u.book.title) && u.book.points.every(isStr), tag + ' 快乐读书吧板块不完整');

  if (u.banner) check(FIGS.has(u.banner), tag + ' 横幅图示未注册: ' + u.banner);
  check(u.lessons.length === PER_UNIT[i], tag + ' 课数应为 ' + PER_UNIT[i] + '，实际 ' + u.lessons.length);
  u.lessons.forEach(l => {
    const t = tag + ' 第' + l.id + '课';
    check(!seenLessons.has(l.id), t + ' 课文编号重复');
    seenLessons.add(l.id);
    check(isStr(l.title), t + ' 缺少题目');
    if (l.fig) check(FIGS.has(l.fig), t + ' 图示未注册: ' + l.fig);
    check(['精读', '略读'].includes(l.tag), t + ' 课型应为 精读/略读: ' + l.tag);
    check(typeof l.author === 'string', t + ' author 应为字符串（可为空）');
    check(isStr(l.overview), t + ' 缺少课文概览');
    check(Array.isArray(l.main) && l.main.length >= 2 && l.main.every(isStr), t + ' 内容梳理至少 2 条');
    check(isStr(l.theme), t + ' 缺少主题感悟');
    check(isStr(l.craft), t + ' 缺少写法点睛');
    check(Array.isArray(l.tips) && l.tips.length >= 2 && l.tips.every(isStr), t + ' 考点提示至少 2 条');
    if (l.words) check(l.words.every(w => Array.isArray(w) && w.length === 2 && w.every(isStr)), t + ' 重点词语格式应为 [词, 释义]');
    if (l.fourWords) check(l.fourWords.every(isStr), t + ' 四字词语应为字符串');
    if (l.poly) check(l.poly.every(r => r.length === 5 && isStr(r[0]) && PY_RE.test(r[1]) && isStr(r[2]) && PY_RE.test(r[3]) && isStr(r[4])),
      t + ' 多音字格式应为 [字, 拼音1, 词1, 拼音2, 词2]');
    if (l.synant) check(l.synant.every(r => r.length === 3 && r.every(isStr)), t + ' 近反义词格式应为 [词, 近义, 反义]');
    if (l.recite) check(isStr(l.recite), t + ' 背诵标注应为字符串');
  });
});
check(seenLessons.size === 27, '全册应为 27 课，实际 ' + seenLessons.size);
for (let i = 1; i <= 27; i++) check(seenLessons.has(String(i)), '缺少第 ' + i + ' 课');

/* ---------- 必背古诗文 ---------- */
console.log('— 必背古诗文 —');
check(Array.isArray(KB.poems) && KB.poems.length >= 9, '必背古诗文至少 9 篇');
check(KB.poems.filter(p => p.kind === '古诗').length === 9, '应有 9 首古诗');
check(KB.poems.filter(p => p.kind === '文言文').length === 2, '应有 2 篇文言文（精卫填海、王戎不取道旁李）');
const seenPoems = new Set();
KB.poems.forEach(p => {
  const t = '《' + p.title + '》';
  check(!seenPoems.has(p.title), t + ' 重复收录');
  seenPoems.add(p.title);
  check(isStr(p.title) && isStr(p.dynasty) && isStr(p.note), t + ' 缺少标题/朝代/诗意');
  check(['古诗', '文言文'].includes(p.kind), t + ' kind 应为 古诗/文言文');
  check(Array.isArray(p.lines) && p.lines.length >= 2 && p.lines.every(isStr), t + ' 诗句不完整');
  if (p.kind === '古诗') check(isStr(p.author), t + ' 古诗缺少作者');
  if (p.notes) check(p.notes.every(n => Array.isArray(n) && n.length === 2 && n.every(isStr)), t + ' 注释格式应为 [字, 释义]');
});
['暮江吟', '题西林壁', '雪梅', '凉州词', '出塞', '夏日绝句', '鹿柴', '嫦娥', '别董大'].forEach(t =>
  check(seenPoems.has(t), '缺少必背古诗《' + t + '》'));

/* ---------- 日积月累 / 多音字 / 形近字 ---------- */
console.log('— 日积月累与字词复习 —');
check(Array.isArray(KB.sayings) && KB.sayings.length >= 3, '日积月累至少 3 组');
KB.sayings.forEach(g => {
  check(isStr(g.title) && ['名句', '谚语'].includes(g.kind), g.title + ' 分组信息不完整');
  check(Array.isArray(g.items) && g.items.length >= 3 && g.items.every(isStr), g.title + ' 至少 3 条');
  check(isStr(g.note), g.title + ' 缺少说明');
});
check(Array.isArray(KB.polyphonic) && KB.polyphonic.length >= 10, '多音字复习至少 10 个');
KB.polyphonic.forEach(r => {
  check(r.length === 5 && isStr(r[0]) && PY_RE.test(r[1]) && isStr(r[2]) && PY_RE.test(r[3]) && isStr(r[4]),
    '多音字格式错误: ' + JSON.stringify(r));
  check(r[1] !== r[3], r[0] + ' 两个读音不应相同');
});
check(Array.isArray(KB.similar) && KB.similar.length >= 10, '形近字至少 10 组');
KB.similar.forEach(group => {
  check(group.length >= 2 && group.every(p => Array.isArray(p) && p.length === 2 && p.every(isStr)),
    '形近字组格式错误: ' + JSON.stringify(group));
  const chars = group.map(p => p[0]);
  check(new Set(chars).size === chars.length, '形近字组内有重复字: ' + chars.join(''));
});

/* ---------- HTML 注入安全（点读属性不得带裸引号/尖括号） ---------- */
console.log('— 数据内容安全 —');
const dangerous = /<|>"(?=[^"]*$)/;
function walk(v, path) {
  if (typeof v === 'string') {
    check(!dangerous.test(v) && !/</.test(v), path + ' 含有 < 或异常引号: ' + v.slice(0, 24));
  } else if (Array.isArray(v)) {
    v.forEach((x, i) => walk(x, path + '[' + i + ']'));
  } else if (v && typeof v === 'object') {
    Object.keys(v).forEach(k => walk(v[k], path + '.' + k));
  }
}
walk(KB.units, 'units');
walk(KB.poems, 'poems');
walk(KB.sayings, 'sayings');

console.log(fails === 0
  ? '\n✅ 全部通过（共断言 ' + checked + ' 项：8 单元 27 课 + 古诗文 + 字词复习）'
  : '\n❌ 共 ' + fails + ' / ' + checked + ' 项失败');
process.exit(fails === 0 ? 0 : 1);

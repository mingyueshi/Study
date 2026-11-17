/* ============================================================
   文学常识数据测试
   运行：node test/test-lit.js
   验证八大文学苑结构、字段完整、图示注册、内容安全。
   ============================================================ */
'use strict';
const LIT = require('../lit-data.js');
const FIGS = require('../lit-figures.js');

let fails = 0;
let checked = 0;
function check(cond, msg) {
  checked++;
  if (!cond) { fails++; console.error('  ❌ ' + msg); }
}
function isStr(v) { return typeof v === 'string' && v.trim().length > 0; }

/* ---------- 总体结构 ---------- */
console.log('— 文学苑与知识点结构 —');
check(Array.isArray(LIT.units) && LIT.units.length === 8, '应有 8 个文学苑，实际 ' + (LIT.units || []).length);
check(isStr(LIT.textbook), '缺少 textbook');
check(isStr(LIT.edition), '缺少 edition');

const EXPECT_IDS = ['lu1', 'lu2', 'lu3', 'lu4', 'lu5', 'lu6', 'lu7', 'lu8'];
const EXPECT_NAMES = ['认识文学', '诗歌殿堂', '四大名著', '古代文豪', '名家名篇', '文化常识', '名句典故', '文学问号'];
const seenPoints = new Set();
const unitNames = new Set();
LIT.units.forEach((u, i) => {
  const tag = '[' + (u.id || 'u?') + ']';
  check(u.id === EXPECT_IDS[i], tag + ' 文学苑顺序应为 ' + EXPECT_IDS[i]);
  check(u.name === EXPECT_NAMES[i], tag + ' 文学苑名称应为 ' + EXPECT_NAMES[i]);
  check(u.no === '第' + '一二三四五六七八'[i] + '苑', tag + ' 编号应为第' + '一二三四五六七八'[i] + '苑');
  check(typeof u.emoji === 'string' && u.emoji.length > 0, tag + ' 缺少 emoji');
  check(/^#[0-9a-f]{6}$/i.test(u.color), tag + ' 颜色格式: ' + u.color);
  check(isStr(u.intro), tag + ' 缺少文学苑导语');
  check(Array.isArray(u.goals) && u.goals.length >= 1 && u.goals.every(isStr), tag + ' 学习重点至少 1 条');
  check(Array.isArray(u.points) && u.points.length >= 1, tag + ' 至少 1 个知识点');
  unitNames.add(u.name);

  u.points.forEach(p => {
    const t = tag + ' ' + (p.id || '?');
    check(!seenPoints.has(p.id), t + ' 知识点 id 重复');
    seenPoints.add(p.id);
    check(new RegExp('^' + u.id + '-').test(p.id), t + ' id 应以文学苑 id 为前缀');
    check(isStr(p.title), t + ' 缺少标题');
    if (p.fig) check(FIGS.has(p.fig), t + ' 图示未注册: ' + p.fig);
    check(isStr(p.overview), t + ' 缺少概述');
    check(Array.isArray(p.items) && p.items.length >= 2 && p.items.every(isStr), t + ' 知识要点至少 2 条');
    check(p.example && isStr(p.example.q) && isStr(p.example.a) && isStr(p.example.steps), t + ' 想一想不完整（q/a/steps）');
    if (p.mistakes) check(p.mistakes.every(isStr), t + ' 易错提醒应为字符串');
    if (p.recall) check(isStr(p.recall), t + ' 口诀应为字符串');
  });
});
check(seenPoints.size === 41, '全册应为 41 个知识点，实际 ' + seenPoints.size);

/* ---------- 作家名片与人物关系树：先校验字段和稳定引用 ---------- */
console.log('— 作家名片与名著关系 —');
const authors = Array.isArray(LIT.authors) ? LIT.authors : [];
const classics = Array.isArray(LIT.classics) ? LIT.classics : [];
const authorIds = new Set();
function sourceOK(source) {
  return source && isStr(source.title) && /^https:\/\//.test(source.url);
}
check(authors.length >= 30, '作家名片应覆盖课程中的主要中外作家');
authors.forEach(a => {
  const tag = '作家 ' + a.id;
  check(/^[a-z][a-z-]+$/.test(a.id) && !authorIds.has(a.id), tag + ' ID 非法或重复');
  authorIds.add(a.id);
  ['name', 'era', 'group', 'funFact'].forEach(key => check(isStr(a[key]), tag + ' 缺少 ' + key));
  check(['古代作家', '近现代作家', '外国作家'].includes(a.group), tag + ' 分组无效');
  check(Array.isArray(a.works) && a.works.length >= 1 && a.works.every(isStr), tag + ' 缺代表作');
  check(Array.isArray(a.lessonIds) && a.lessonIds.length >= 1 && a.lessonIds.every(id => seenPoints.has(id)), tag + ' 课程引用无效');
  check(sourceOK(a.source), tag + ' 缺少可查阅的出处');
});
['吴承恩', '罗贯中', '施耐庵', '曹雪芹', '孔子', '司马迁', '李白', '杜甫', '白居易', '李贺', '王维',
  '李清照', '辛弃疾', '马致远', '关汉卿', '韩愈', '柳宗元', '欧阳修', '苏洵', '苏轼', '苏辙', '王安石', '曾巩',
  '鲁迅', '老舍', '冰心', '叶圣陶', '朱自清', '安徒生', '雅各布·格林', '威廉·格林']
  .forEach(name => check(authors.some(a => a.name === name), '缺少作家名片：' + name));
check(classics.length === 4, '四大名著各有一棵关系树');
const classicIds = new Set();
classics.forEach(book => {
  const tag = '名著 ' + book.id;
  check(/^[a-z][a-z-]+$/.test(book.id) && !classicIds.has(book.id), tag + ' ID 非法或重复');
  classicIds.add(book.id);
  ['title', 'emoji', 'intro', 'note'].forEach(key => check(isStr(book[key]), tag + ' 缺少 ' + key));
  check(/^#[0-9a-f]{6}$/i.test(book.color), tag + ' 颜色无效');
  check(authorIds.has(book.authorId), tag + ' 作者引用无效');
  check(seenPoints.has(book.lessonId), tag + ' 课程引用无效');
  check(sourceOK(book.source), tag + ' 缺少版本出处');
  const characters = Array.isArray(book.characters) ? book.characters : [];
  const ids = new Set();
  check(characters.length >= 5, tag + ' 至少五位人物');
  characters.forEach(c => {
    check(/^[a-z][a-z-]+$/.test(c.id) && !ids.has(c.id), tag + ' 人物 ID 非法或重复');
    ids.add(c.id);
    check(isStr(c.name) && isStr(c.role), tag + ' 人物名片不完整');
    check(c.episode && ['title', 'summary', 'chapter'].every(key => isStr(c.episode[key])), tag + ' 人物情节缺少标题、说明或回目');
    check(c.episode && /^https:\/\//.test(c.episode.url), tag + ' 情节缺少原著链接');
  });
  const branches = Array.isArray(book.branches) ? book.branches : [];
  check(branches.length >= 2, tag + ' 至少两组可展开分支');
  const covered = new Set(), branchIds = new Set();
  branches.forEach(branch => {
    check(/^[a-z][a-z-]+$/.test(branch.id) && !branchIds.has(branch.id), tag + ' 分支 ID 非法或重复');
    branchIds.add(branch.id);
    check(isStr(branch.title) && isStr(branch.intro), tag + ' 分支缺少说明');
    check(ids.has(branch.rootId), tag + ' 分支起点不存在');
    const reached = new Set([branch.rootId]);
    const links = Array.isArray(branch.links) ? branch.links : [];
    const targets = new Set();
    check(links.length >= 1, tag + ' 分支缺少关系');
    links.forEach(link => {
      check(ids.has(link.from) && ids.has(link.to) && link.from !== link.to && isStr(link.label), tag + ' 人物关系无效');
      check(link.to !== branch.rootId && !targets.has(link.to), tag + ' 树中出现重复父节点或环');
      targets.add(link.to);
    });
    for (let i = 0; i < characters.length; i++) links.forEach(link => { if (reached.has(link.from)) reached.add(link.to); });
    check(links.every(link => reached.has(link.from) && reached.has(link.to)), tag + ' 分支不连通或存在环');
    reached.forEach(id => { check(!covered.has(id), tag + ' 人物在多个分支重复'); covered.add(id); });
  });
  check(covered.size === ids.size && [...ids].every(id => covered.has(id)), tag + ' 有人物未出现在关系树中');
});
['sanguo', 'shuihu', 'xiyou', 'honglou'].forEach(id => check(classicIds.has(id), '缺少名著关系树：' + id));

/* ---------- 与其他模块分开：独立的数据与苑地结构 ---------- */
console.log('— 模块独立检查 —');
check(seenPoints.size !== 37, '不应是地理 / 历史模块的 37 个知识点');
const allIds = [...seenPoints].join(',');
check(!allIds.includes('gu') && !allIds.includes('au') && !allIds.includes('hu'), '知识点 id 前缀应独立（lu）');

/* ---------- 文学速查与文学小诊所 ---------- */
console.log('— 文学速查与文学小诊所 —');
check(Array.isArray(LIT.facts) && LIT.facts.length >= 3, '文学速查至少 3 组');
LIT.facts.forEach(f => {
  check(isStr(f.title), f.title + ' 分组缺少标题');
  check(Array.isArray(f.items) && f.items.length >= 2 &&
    f.items.every(it => Array.isArray(it) && it.length === 2 && it.every(isStr)), f.title + ' 格式应为 [名称, 内容]');
  check(isStr(f.note), f.title + ' 缺少说明');
});
check(Array.isArray(LIT.mistakes) && LIT.mistakes.length >= 10, '文学小诊所至少 10 条');
LIT.mistakes.forEach(m => {
  check(isStr(m.unit) && isStr(m.wrong) && isStr(m.right), '易错条目不完整: ' + JSON.stringify(m));
  check(unitNames.has(m.unit), '易错条目的文学苑名不在文学苑中: ' + m.unit);
});

/* ---------- 关键内容覆盖 ---------- */
console.log('— 关键内容覆盖 —');
const allText = JSON.stringify(LIT);
['吴承恩', '罗贯中', '施耐庵', '曹雪芹', '诗仙', '诗圣', '司马迁', '苏轼', '安徒生',
  '唐宋八大家', '十二生肖', '二十四节气', '花甲', '歇后语', '对联', '状元']
  .forEach(k => check(allText.includes(k), '关键内容缺失: ' + k));

/* ---------- 内容安全与标点 ---------- */
console.log('— 数据内容安全 —');
function walk(v, path) {
  if (typeof v === 'string') {
    /* 文学内容允许全角符号与书名号，只拦截形如标签的 <字母 */
    check(!/<[a-zA-Z/]/.test(v), path + ' 含有疑似 HTML 标签: ' + v.slice(0, 24));
    check(!/"|\n/.test(v), path + ' 含有 ASCII 双引号或换行: ' + v.slice(0, 24));
  } else if (Array.isArray(v)) {
    v.forEach((x, i) => walk(x, path + '[' + i + ']'));
  } else if (v && typeof v === 'object') {
    Object.keys(v).forEach(k => walk(v[k], path + '.' + k));
  }
}
walk(LIT.units, 'units');
walk(LIT.facts, 'facts');
walk(LIT.mistakes, 'mistakes');
walk(LIT.authors, 'authors');
walk(LIT.classics, 'classics');

/* ---------- 图示库 ---------- */
console.log('— 文学图示库 —');
check(FIGS.FIG_IDS.length >= 17, '图示库应有 17 个以上图示，实际 ' + FIGS.FIG_IDS.length);
check(FIGS.has('demo-lit-classics') && FIGS.has('demo-lit-zodiac'), '缺少互动演示图示');

console.log(fails === 0
  ? '\n✅ 全部通过（共断言 ' + checked + ' 项：8 文学苑 41 知识点 + 速查 + 小诊所 + 图示库）'
  : '\n❌ 共 ' + fails + ' / ' + checked + ' 项失败');
process.exit(fails === 0 ? 0 : 1);

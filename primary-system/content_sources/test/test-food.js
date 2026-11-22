/* ============================================================
   食物的旅行数据测试
   运行：node test/test-food.js
   验证五站结构、图示注册、溯源数据、传播时间线、营养评价口径。
   ============================================================ */
'use strict';
const FOOD = require('../food-data.js');
const LABS = require('../food-labs-data.js');
const FIGS = require('../food-figures.js');
const {mealById, farthestIngredient, nearestIngredient, activeEvents, stopYear,
  dishById, mealEnergy, evaluateMeal} = require('../food-labs.js');

let fails = 0;
let checked = 0;
function check(cond, msg) {
  checked++;
  if (!cond) { fails++; console.error('  ❌ ' + msg); }
}
function isStr(v) { return typeof v === 'string' && v.trim().length > 0; }

/* ---------- 站点与知识点结构 ---------- */
console.log('— 站点与知识点结构 —');
const EXPECT_IDS = ['fd1', 'fd2', 'fd3', 'fd4', 'fd5'];
const EXPECT_NAMES = ['一粒米的旅行', '作物的环球旅行', '吃进去之后', '餐桌上的文化', '食物里的科学'];
check(Array.isArray(FOOD.units) && FOOD.units.length === 5, '应有 5 个站点，实际 ' + (FOOD.units || []).length);
check(isStr(FOOD.textbook), '缺少 textbook');
check(isStr(FOOD.edition), '缺少 edition');

const seenPoints = new Set();
FOOD.units.forEach((u, i) => {
  const tag = '[' + (u.id || 'u?') + ']';
  check(u.id === EXPECT_IDS[i], tag + ' 站点顺序应为 ' + EXPECT_IDS[i]);
  check(u.name === EXPECT_NAMES[i], tag + ' 站点名称应为 ' + EXPECT_NAMES[i]);
  check(u.no === '第' + '一二三四五'[i] + '站', tag + ' 编号应为第' + '一二三四五'[i] + '站');
  check(typeof u.emoji === 'string' && u.emoji.length > 0, tag + ' 缺少 emoji');
  check(/^#[0-9a-f]{6}$/i.test(u.color), tag + ' 颜色格式: ' + u.color);
  check(FIGS.has(u.banner), tag + ' 横幅未注册: ' + u.banner);
  check(isStr(u.intro), tag + ' 缺少站点导语');
  check(Array.isArray(u.goals) && u.goals.length >= 1 && u.goals.every(isStr), tag + ' 学习重点至少 1 条');
  check(Array.isArray(u.points) && u.points.length >= 1, tag + ' 至少 1 个知识点');

  u.points.forEach(p => {
    const t = tag + ' ' + (p.id || '?');
    check(!seenPoints.has(p.id), t + ' 知识点 id 重复');
    seenPoints.add(p.id);
    check(new RegExp('^' + u.id + '-').test(p.id), t + ' id 应以站点 id 为前缀');
    check(isStr(p.title), t + ' 缺少标题');
    if (p.fig) check(FIGS.has(p.fig), t + ' 图示未注册: ' + p.fig);
    check(isStr(p.overview), t + ' 缺少概述');
    check(Array.isArray(p.items) && p.items.length >= 2 && p.items.every(isStr), t + ' 知识要点至少 2 条');
    check(p.example && isStr(p.example.q) && isStr(p.example.a) && isStr(p.example.steps), t + ' 想一想不完整（q/a/steps）');
    if (p.mistakes) check(p.mistakes.every(isStr), t + ' 易错提醒应为字符串');
    if (p.recall) check(isStr(p.recall), t + ' 口诀应为字符串');
  });
});
check(seenPoints.size === 20, '全册应为 20 个知识点，实际 ' + seenPoints.size);
for (const fig of ['fd-origin-lab', 'fd-spread-lab', 'fd-meal-lab']) {
  check(FOOD.units.some(u => u.points.some(p => p.fig === fig)), fig + ' 应挂在一个知识点上');
}

/* ---------- 速查 ---------- */
console.log('— 食物速查 —');
check(Array.isArray(FOOD.facts) && FOOD.facts.length === 5, '应有 5 组速查');
FOOD.facts.forEach(f => {
  check(isStr(f.title) && isStr(f.note), '[' + (f.title || '?') + '] 标题与说明');
  check(Array.isArray(f.items) && f.items.length >= 4 && f.items.every(it =>
    Array.isArray(it) && it.length === 2 && isStr(it[0]) && isStr(it[1])), '[' + f.title + '] 每行两栏');
});

/* ---------- 溯源台数据 ---------- */
console.log('— 溯源台 —');
check(Array.isArray(LABS.origin.meals) && LABS.origin.meals.length === 3, '应有 3 顿示例餐');
LABS.origin.meals.forEach(meal => {
  const tag = '[餐:' + meal.id + ']';
  check(isStr(meal.name) && isStr(meal.emoji) && isStr(meal.note), tag + ' 基本信息');
  check(meal.quiz && isStr(meal.quiz.q) && Array.isArray(meal.quiz.options)
    && meal.quiz.options.length >= 2 && meal.quiz.answer < meal.quiz.options.length
    && isStr(meal.quiz.explain), tag + ' 小问题完整');
  check(meal.quiz.options[meal.quiz.answer] !== undefined, tag + ' 答案索引有效');
  check(Array.isArray(meal.ingredients) && meal.ingredients.length >= 3, tag + ' 至少 3 样食材');
  meal.ingredients.forEach(ing => {
    const t = tag + '[' + ing.id + ']';
    check(isStr(ing.name) && isStr(ing.emoji), t + ' 名称');
    check(Number.isFinite(ing.distance) && ing.distance > 0, t + ' 概略距离应大于 0');
    check(Array.isArray(ing.chain) && ing.chain.length === 5, t + ' 旅程应为 5 站（产地→加工→运输→市场→厨房）');
    ing.chain.forEach(seg => check(isStr(seg.place) && isStr(seg.step), t + ' 每站有地点与说明'));
  });
  const far = farthestIngredient(meal);
  check(far && meal.ingredients.some(i => i === far), tag + ' 最远食材可查');
});
check(farthestIngredient(mealById('dinner')).id === 'rice', '家常晚餐里大米走得最远');
check(nearestIngredient(mealById('noodle')).id === 'cucumber', '牛肉面里黄瓜就在城郊');
check(farthestIngredient(mealById('pizza')).id === 'import-wheat', '披萨之夜里进口小麦海运最远');

/* ---------- 传播时间线数据 ---------- */
console.log('— 传播时间线 —');
check(Array.isArray(LABS.spread.stops) && LABS.spread.stops.length >= 8, '时间线至少 8 档');
check(LABS.spread.stops.every((y, i) => i === 0 || y > LABS.spread.stops[i - 1]), '年代档严格递增');
check(LABS.spread.stopLabels.length === LABS.spread.stops.length, '档位标签与档数一致');
check(Array.isArray(LABS.spread.crops) && LABS.spread.crops.length === 4, '应有 4 种作物');
const mapRange = ev => ev.to && ev.to.x >= 20 && ev.to.x <= 620 && ev.to.y >= 20 && ev.to.y <= 280;
LABS.spread.crops.forEach(crop => {
  const tag = '[作物:' + crop.id + ']';
  check(/^#[0-9a-f]{6}$/i.test(crop.color), tag + ' 颜色格式');
  check(isStr(crop.origin.label), tag + ' 老家标注');
  check(crop.origin.x >= 20 && crop.origin.x <= 620 && crop.origin.y >= 20 && crop.origin.y <= 280, tag + ' 老家坐标在图内');
  check(Array.isArray(crop.events) && crop.events.length >= 3, tag + ' 至少 3 站传播');
  crop.events.forEach(ev => {
    check(Number.isFinite(ev.year) && ev.year >= -9500 && ev.year <= 1750, tag + ' 年代在范围内: ' + ev.year);
    check(isStr(ev.text), tag + ' 事件说明');
    if (ev.to) check(mapRange(ev), tag + ' 终点坐标在图内');
  });
  check(crop.events[0].year === crop.events.reduce((m, e) => Math.min(m, e.year), 0), tag + ' 首条事件应最早（驯化）');
  check(activeEvents(crop, -9500).length === 0, tag + ' 最早档前不点亮');
  check(activeEvents(crop, 1750).length === crop.events.length, tag + ' 拖到最后全部点亮');
  const sorted = crop.events.every((ev, i) => i === 0 || ev.year >= crop.events[i - 1].year);
  check(sorted, tag + ' 事件按年代递增');
});
check(stopYear(0) === LABS.spread.stops[0], 'stopYear(0) 取首档');
check(stopYear(99) === LABS.spread.stops[LABS.spread.stops.length - 1], 'stopYear 越界取末档');
/* 玉米马铃薯必须晚于 1492 年才离开美洲（地图上美洲 Blob 的 x ≤ 210） */
['maize', 'potato'].forEach(id => {
  const crop = LABS.spread.crops.find(c => c.id === id);
  const escaped = crop.events.filter(ev => ev.to && ev.year < 1400 && ev.to.x > 210);
  check(escaped.length === 0, '[作物:' + id + '] 1492 年前不应有离开美洲的传播事件');
});

/* ---------- 营养搭配模拟器 ---------- */
console.log('— 营养搭配 —');
check(LABS.meal.dishes.length >= 18, '菜品应不少于 18 道');
LABS.meal.dishes.forEach(d => {
  check(isStr(d.id) && isStr(d.name) && isStr(d.emoji), '[菜品:' + d.id + '] 基本信息');
  check(LABS.meal.cats.some(c => c.id === d.cat), '[菜品:' + d.id + '] 分类有效: ' + d.cat);
  check(Number.isFinite(d.energy) && d.energy >= 0, '[菜品:' + d.id + '] 能量非负');
});
LABS.meal.cats.forEach(cat => {
  check(LABS.meal.dishes.some(d => d.cat === cat.id), '[类别:' + cat.id + '] 至少一道菜品');
  check(isStr(cat.name) && typeof cat.must === 'boolean', '[类别:' + cat.id + '] 名称与必选标记');
});
check(LABS.meal.cats.filter(c => c.must).length === 4, '必选类应为 4 类（主食/蛋白/蔬菜/饮品）');
check(LABS.meal.energyMin < LABS.meal.energyMax, '能量参考区间有效');
LABS.meal.checks.forEach(c => check(isStr(c.id) && isStr(c.label) && isStr(c.tip), '[检查:' + c.id + '] 完整'));

const selOf = (...ids) => ids.reduce((s, id) => { const d = dishById(id); s[d.cat] = id; return s; }, {});
const full = evaluateMeal(LABS.meal.dishes, selOf('m-grain', 'm-fish', 'm-greens', 'm-apple', 'm-milk'));
check(full.stars === 5, '全搭齐应 5 星，实际 ' + full.stars);
check(full.energy >= LABS.meal.energyMin && full.energy <= LABS.meal.energyMax, '全搭齐能量应在区间内: ' + full.energy);
check(full.hits.length === LABS.meal.checks.length, '全搭齐应点亮全部检查项');
const bare = evaluateMeal(LABS.meal.dishes, selOf('m-rice', 'm-egg', 'm-greens', 'm-water'));
check(bare.stars < 5, '缺水果应不满星');
check(!bare.hits.includes('fruit-dairy'), '缺水果应缺水果或奶检查');
check(bare.tips.length >= 1, '缺项应给建议');
const cola = evaluateMeal(LABS.meal.dishes, selOf('m-rice', 'm-chicken', 'm-cucumber', 'm-apple', 'm-cola'));
check(!cola.hits.includes('light-drink'), '可乐应判饮品少糖不过');
check(mealEnergy(LABS.meal.dishes, selOf('m-water')) === 0, '空餐盘能量为 0');
/* 粗粮加星：同为全搭齐，杂粮饭比白米饭多半星收成整星 */
const plain = evaluateMeal(LABS.meal.dishes, selOf('m-rice', 'm-fish', 'm-greens', 'm-apple', 'm-milk'));
check(plain.stars === full.stars, '水果加奶补足后同为 5 星');

/* ---------- 图示库渲染 ---------- */
console.log('— 图示库 —');
FIGS.FIG_IDS.forEach(id => {
  const html = FIGS.figHTML(id);
  check(html && html.length > 40, '图示渲染过短: ' + id);
});
check(FIGS.figHTML('不存在的图') === '', '未注册图示应返回空串');
check(!FIGS.figHTML('fd-table-manners').includes('foreignObject'), '礼仪图示应使用纯 SVG 文本');

console.log('');
if (fails) {
  console.error('❌ 食物的旅行数据有 ' + fails + ' 处问题（断言 ' + checked + ' 项）');
  process.exit(1);
} else {
  console.log('✅ 全部通过（共断言 ' + checked + ' 项：5 站 20 知识点 + 速查 + 溯源三餐 + 传播时间线 + 营养评价口径）');
}

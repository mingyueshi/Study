/* ============================================================
   汉字演变馆数据测试
   运行：node test/test-hanzi-evo.js
   验证十个字族结构、四段演变、图片存在、多音字标记、内容安全。
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const D = require('../hanzi-evo-data.js');
const FIGS = require('../hanzi-evo-figures.js');

let fails = 0;
let checked = 0;
function check(cond, msg) {
  checked++;
  if (!cond) { fails++; console.error('  ❌ ' + msg); }
}
function isStr(v) { return typeof v === 'string' && v.trim().length > 0; }

const FAMILY_IDS = ['hf1', 'hf2', 'hf3', 'hf4', 'hf5', 'hf6', 'hf7', 'hf8', 'hf9', 'hf10'];
const FAMILY_NAMES = ['天文气象', '大地山川', '飞禽走兽', '草木禾稼', '身体密码', '一举一动', '身边器物', '数字从哪来', '四方与上下', '家里的时光'];
const STAGES = ['ob', 'bronze', 'seal'];

/* ---------- 总体结构 ---------- */
console.log('— 字族与选字结构 —');
check(Array.isArray(D.units) && D.units.length === 10, '应有 10 个字族，实际 ' + (D.units || []).length);
check(isStr(D.textbook), '缺少 textbook');
check(isStr(D.edition), '缺少 edition');

const seenChars = new Set();
const seenIds = new Set();
const allPolys = [];
D.units.forEach((u, i) => {
  const tag = '[' + (u.id || 'u?') + ']';
  check(u.id === FAMILY_IDS[i], tag + ' 字族顺序应为 ' + FAMILY_IDS[i]);
  check(u.name === FAMILY_NAMES[i], tag + ' 字族名称应为 ' + FAMILY_NAMES[i]);
  check(u.no === '第' + '一二三四五六七八九十'[i] + '族', tag + ' 编号应为第' + '一二三四五六七八九十'[i] + '族');
  check(typeof u.emoji === 'string' && u.emoji.length > 0, tag + ' 缺少 emoji');
  check(/^#[0-9a-f]{6}$/i.test(u.color), tag + ' 颜色格式: ' + u.color);
  check(isStr(u.intro), tag + ' 缺少字族导语');
  check(Array.isArray(u.goals) && u.goals.length >= 1 && u.goals.every(isStr), tag + ' 学习重点至少 1 条');
  check(Array.isArray(u.points) && u.points.length >= 5, tag + ' 至少 5 个字');

  u.points.forEach(p => {
    const t = tag + ' ' + (p.id || '?');
    check(!seenIds.has(p.id), t + ' 字卡 id 重复');
    seenIds.add(p.id);
    check(new RegExp('^' + u.id + '-').test(p.id), t + ' id 应以字族 id 为前缀');
    check(typeof p.char === 'string' && p.char.length === 1, t + ' char 应为单字: ' + p.char);
    check(!seenChars.has(p.char), t + ' 选字重复: ' + p.char);
    seenChars.add(p.char);
    check(isStr(p.pinyin), t + ' 缺少拼音');
    check(Number.isInteger(p.strokes) && p.strokes >= 1 && p.strokes <= 30, t + ' 笔画数异常: ' + p.strokes);
    check(['象形', '指事', '会意', '形声', '假借'].includes(p.type), t + ' 造字法未知: ' + p.type);
    check(Array.isArray(p.forms) && p.forms.length >= 1, t + ' 古字形至少 1 段');
    const present = new Set();
    p.forms.forEach(f => {
      check(STAGES.includes(f.stage), t + ' 段名未知: ' + f.stage);
      check(!present.has(f.stage), t + ' 段重复: ' + f.stage);
      present.add(f.stage);
      if (f.img) {
        check(/^images\/glyphs\/[a-z0-9-]+\.svg$/.test(f.img), t + ' 图片路径应为 images/glyphs 下的 ASCII 文件名: ' + f.img);
        check(fs.existsSync(path.join(__dirname, '..', f.img)), t + ' 图片不存在: ' + f.img);
      } else {
        check(isStr(f.text) && f.text.length === 1, t + ' 非图片段缺少单字 text');
      }
      check(isStr(f.note), t + ' 段缺少看图提示: ' + f.stage);
    });
    check(!present.has('kai'), t + ' 楷书由界面渲染，数据里不应有 kai 段');
    check(isStr(p.story) && p.story.length >= 30, t + ' 字理小故事太短');
    check(Array.isArray(p.words) && p.words.length >= 2 && p.words.every(isStr), t + ' 组词至少 2 个');
    if (p.forms.length === 1) {
      check(p.forms[0].stage === 'seal', t + ' 单段古形只允许小篆兜底（如「秋」）');
    }
    if (p.poly) allPolys.push(p.char);
  });
});
check(seenChars.size === 100, '全馆应为 100 个不重复的字，实际 ' + seenChars.size);

/* ---------- 多音字标记与数据集一致 ---------- */
console.log('— 多音字标记 —');
const POLY_FILE = path.join(__dirname, '..', '..', 'hanzi', 'polyphone_data', 'polyphones.json');
const POLY = new Set(JSON.parse(fs.readFileSync(POLY_FILE, 'utf-8')).chars.map(c => c.char));
D.units.forEach(u => u.points.forEach(p => {
  if (p.poly && !POLY.has(p.char)) console.error('  ❌ [' + p.id + '] poly 标记不在多音字库: ' + p.char), fails++, checked++;
  if (!p.poly && POLY.has(p.char)) console.error('  ❌ [' + p.id + '] 多音字库中的字未标 poly: ' + p.char), fails++, checked++;
}));
checked += 2;

/* ---------- 馆前必读与六书速查 ---------- */
console.log('— 馆前必读与六书速查 —');
check(isStr(D.hall.lead), '缺少馆前导语');
check(isStr(D.hall.discovery.title) && isStr(D.hall.discovery.text), '甲骨文发现故事不完整');
check(Array.isArray(D.hall.stages) && D.hall.stages.length === 4, '四段年表应有 4 段');
D.hall.stages.forEach(s => {
  check(['ob', 'bronze', 'seal', 'kai'].includes(s.id), '年表段名未知: ' + s.id);
  check(isStr(s.name) && isStr(s.when) && isStr(s.text), '年表条目不完整: ' + s.name);
});
check(isStr(D.hall.credit) && D.hall.credit.includes('hanziyuan.net'), '缺少古字形出处标注');
check(Array.isArray(D.sixbooks) && D.sixbooks.length === 6, '六书速查应有 6 条');
D.sixbooks.forEach(b => {
  check(isStr(b.name) && isStr(b.text), '六书条目不完整: ' + b.name);
  b.examples.forEach(ch => check(seenChars.has(ch), '六书示例字不在馆藏中: ' + ch));
});

/* ---------- 图示库 ---------- */
console.log('— 图示库 —');
check(Array.isArray(FIGS.FIG_IDS) && FIGS.FIG_IDS.length >= 3, '图示库应有 3 个以上图示');
check(FIGS.has('demo-he-turtle') && FIGS.has('demo-he-bronze') && FIGS.has('demo-he-bamboo'), '缺少馆前必读图示');

/* ---------- 关键内容覆盖 ---------- */
console.log('— 关键内容覆盖 —');
const allText = JSON.stringify(D);
['王懿荣', '甲骨文', '金文', '小篆', '楷书', '象形', '指事', '会意', '形声', '蝎子', '月牙']
  .forEach(k => check(allText.includes(k), '关键内容缺失: ' + k));

/* ---------- 内容安全与标点 ---------- */
console.log('— 数据内容安全 —');
function walk(v, pathStr) {
  if (typeof v === 'string') {
    check(!/<[a-zA-Z/]/.test(v), pathStr + ' 含有疑似 HTML 标签: ' + v.slice(0, 24));
    check(!/"|\n/.test(v), pathStr + ' 含有 ASCII 双引号或换行: ' + v.slice(0, 24));
  } else if (Array.isArray(v)) {
    v.forEach((x, i) => walk(x, pathStr + '[' + i + ']'));
  } else if (v && typeof v === 'object') {
    Object.keys(v).forEach(k => walk(v[k], pathStr + '.' + k));
  }
}
walk(D.units, 'units');
walk(D.hall, 'hall');
walk(D.sixbooks, 'sixbooks');

/* ---------- 可得性报告与数据一致 ---------- */
console.log('— 可得性报告核对 —');
const REPORT_FILE = path.join(__dirname, '..', 'hanzi-evo-availability.json');
check(fs.existsSync(REPORT_FILE), '缺少 hanzi-evo-availability.json');
const report = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf-8'));
check(report.length === 100, '可得性报告应有 100 条');
const reportChars = report.map(r => r.char).join('');
const dataChars = [...seenChars].join('');
check(reportChars === dataChars, '报告选字顺序与数据文件不一致');

console.log(fails === 0
  ? '\n✅ 全部通过（共断言 ' + checked + ' 项：10 字族 100 字 + 馆前必读 + 六书 + 图示库）'
  : '\n❌ 共 ' + fails + ' / ' + checked + ' 项失败');
process.exit(fails === 0 ? 0 : 1);

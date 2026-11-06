/* ============================================================
   乐学堂 · 数学知识点 —— 界面逻辑
   单元切换 / 知识点卡（图示 → 一句话 → 要点·例题·易错 分段）/ 公式速查 / 易错诊所
   搜索 / 点读 / 已掌握标记 / 打印
   ============================================================ */
'use strict';

/* ---------- 学习档案 ----------
   存储键从教材名派生，不同册次（四年级上/下册……）互不覆盖。 */
function mkStoreKey() {
  const base = (MKB.textbook || 'math').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
  return 'mathbook_' + (base || 'v2');
}
const MATH_STORE_KEY = mkStoreKey();
let mkState = { last: 'mu1', learned: {}, pane: {} };
try {
  const raw = localStorage.getItem(MATH_STORE_KEY);
  if (raw) mkState = { ...{ last: 'mu1', learned: {}, pane: {} }, ...JSON.parse(raw) };
} catch (e) { /* 仅用内存状态 */ }
if (!mkState.pane) mkState.pane = {};
function mkSave() { try { localStorage.setItem(MATH_STORE_KEY, JSON.stringify(mkState)); } catch (e) {} }

/* ---------- 索引与视图状态 ---------- */
const MUNIT_BY_ID = {};
MKB.units.forEach(u => { MUNIT_BY_ID[u.id] = u; });
const TOTAL_POINTS = MKB.units.reduce((n, u) => n + u.points.length, 0);
const MEXTRA_VIEWS = [
  { id: 'formulas', name: '公式法则', emoji: '📐', color: '#2f9bd6', banner: 'mban-formulas', count: MKB.formulas.reduce((n, f) => n + f.items.length, 0) },
  { id: 'mistakes', name: '易错诊所', emoji: '⚠️', color: '#c2557d', banner: 'mban-mistakes', count: MKB.mistakes.length },
  { id: 'videos', name: '教学视频', emoji: '🎬', color: '#e25563', banner: 'mban-videos', count: ((MKB.videos && MKB.videos.list) || []).length },
];
const MEXTRA_BY_ID = {};
MEXTRA_VIEWS.forEach(v => { MEXTRA_BY_ID[v.id] = v; });

let curView = MUNIT_BY_ID[mkState.last] ? mkState.last : 'mu1';
/* 支持 URL 锚点直达单元，如 math.html#mu5 */
try {
  const h = (location.hash || '').slice(1);
  if (h && (MUNIT_BY_ID[h] || MEXTRA_BY_ID[h])) curView = h;
} catch (e) {}
let query = '';
let cardSeq = 0;

function munitById(id) { return MUNIT_BY_ID[id]; }
function pointKey(u, p) { return u.id + '-' + p.id; }
function totalLearned() { return MKB.units.reduce((n, u) => n + u.points.filter(p => mkState.learned[pointKey(u, p)]).length, 0); }
function unitLearned(u) { return u.points.filter(p => mkState.learned[pointKey(u, p)]).length; }

/* ---------- 朗读 ---------- */
function speak(text) {
  if (!window.SpeechKit) return;
  SpeechKit.speak(String(text), { rate: 0.85 });
}

/* ---------- 工具 ---------- */
function esc(s) {
  return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function sayBtn(text) {
  return '<button class="say" data-act="say" data-t="' + esc(text) + '" title="朗读" aria-label="朗读">🔊</button>';
}

/* ---------- 图示：优先数学专属库，其次通用库 ---------- */
function figFor(id) {
  if (!id) return '';
  if (window.MathFigures && MathFigures.has(id)) return MathFigures.figHTML(id);
  if (window.Figures && Figures.has(id)) return Figures.figHTML(id);
  return '';
}
function bannerFor(id) {
  if (!id || !window.MathFigures) return '';
  return MathFigures.bannerHTML(id);
}
/* 情境照片（Pexels，本地存放）：单元横幅 + 知识点「生活中的数学」，均来自 MKB */
function unitPhoto(id) {
  return (MKB.banners && MKB.banners[id]) || '';
}
function pointPhoto(p) {
  if (!p || !p.life) return null;
  return { img: 'images/math/p-' + p.id + '.jpg', life: p.life };
}

/* ---------- 公开教学视频（MKB.videos） ---------- */
function videoById(id) {
  const list = (MKB.videos && MKB.videos.list) || [];
  return list.find(v => v.id === id) || null;
}
function vidEmbedUrl(id) {
  const v = videoById(id);
  return v ? 'https://player.bilibili.com/player.html?bvid=' + encodeURIComponent(v.bvid) +
    '&autoplay=1&danmaku=0&high_quality=1' : '';
}
function durText(sec) {
  const m = Math.round(sec / 60);
  return m >= 60 ? Math.floor(m / 60) + ' 小时 ' + (m % 60) + ' 分' : m + ' 分钟';
}

/* ---------- 侧栏目录 ---------- */
function renderChips() {
  const unitChips = MKB.units.map(u => {
    const learned = unitLearned(u);
    const done = learned === u.points.length;
    const shortName = u.no.indexOf('单元') >= 0 ? u.no.replace('单元', '') + ' ' + u.name : u.name;
    return '<button class="chip' + (u.id === curView && !query ? ' on' : '') + '" style="--c:' + u.color + '" data-act="unit" data-id="' + u.id + '">' +
      '<span class="chip-emoji">' + u.emoji + '</span><span class="chip-name">' + esc(shortName) + '</span>' +
      '<span class="chip-num' + (done ? ' full' : '') + '">' + learned + '/' + u.points.length + '</span></button>';
  });
  const extraChips = MEXTRA_VIEWS.map(v =>
    '<button class="chip' + (v.id === curView && !query ? ' on' : '') + '" style="--c:' + v.color + '" data-act="unit" data-id="' + v.id + '">' +
    '<span class="chip-emoji">' + v.emoji + '</span><span class="chip-name">' + esc(v.name) + '</span>' +
    '<span class="chip-num">' + v.count + '</span></button>');
  document.getElementById('chips').innerHTML = unitChips.join('') + extraChips.join('');
}

function renderStats() {
  const el = document.getElementById('stats');
  if (el) el.textContent = '已掌握 ' + totalLearned() + ' / ' + TOTAL_POINTS + ' 个知识点';
}

/* ---------- 知识点编号 ----------
   通用单元简称：第一单元→一，第十二单元→十二；非「第X单元」原样返回。 */
const CN_DIGITS = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10 };
function unitShort(u) {
  const m = /^第(.+?)单元$/.exec(u.no);
  if (m) {
    const cn = m[1];
    if (cn.length === 1) return cn;
    if (/^十/.test(cn)) return '十' + (cn.length > 1 ? cn.slice(1) : '');
    if (/十$/.test(cn)) return cn;
    return cn;
  }
  return u.no;
}
function pointSeq(u, p) { return u.points.indexOf(p) + 1; }

/* ---------- 知识点卡 ----------
   一卡只露出「图示 + 一句话 + 一类信息」，
   要点 / 例题 / 易错 用标签页切换，眼睛一次只看一块。 */
const PANES = [
  { id: 'items', label: '要点', icon: '📘' },
  { id: 'example', label: '例题', icon: '📌' },
  { id: 'mistakes', label: '易错', icon: '⚠️' },
];

function paneBody(u, p, id) {
  if (id === 'items') {
    if (!p.items || !p.items.length) return '';
    return '<ul class="klist">' + p.items.map(m =>
      '<li><button class="kli" data-act="say" data-t="' + esc(m) + '"><span class="kli-dot"></span>' + esc(m) + '</button></li>').join('') + '</ul>';
  }
  if (id === 'example') {
    if (!p.example) return '';
    return '<div class="mex">' +
      '<button class="mex-q" data-act="say" data-t="' + esc(p.example.q) + '"><span class="mex-tag">题目</span>' + esc(p.example.q) + '</button>' +
      '<button class="mex-steps" data-act="say" data-t="' + esc(p.example.steps) + '"><span class="mex-tag">思路</span>' + esc(p.example.steps) + '</button>' +
      '<button class="mex-a" data-act="say" data-t="' + esc(p.example.a) + '"><span class="mex-tag">答案</span>' + esc(p.example.a) + '</button>' +
      '</div>';
  }
  if (!p.mistakes || !p.mistakes.length) return '';
  return '<ul class="klist mis">' + p.mistakes.map(m =>
    '<li><button class="kli" data-act="say" data-t="' + esc(m) + '"><span class="kli-dot warn"></span>' + esc(m) + '</button></li>').join('') + '</ul>';
}

function pointCard(u, p, idx) {
  const key = pointKey(u, p);
  const learned = !!mkState.learned[key];
  const active = mkState.pane[key] || 'items';
  const has = {};
  PANES.forEach(t => { has[t.id] = !!paneBody(u, p, t.id); });
  const tabs = PANES.filter(t => has[t.id]);
  const seq = idx == null ? cardSeq++ : idx;

  const out = [];
  out.push('<article class="kcard' + (learned ? ' learned' : '') + '" style="--c:' + u.color + ';--i:' + seq + '" data-key="' + esc(key) + '">');

  /* 头部：编号 + 标题 + 朗读 + 已掌握 */
  out.push('<div class="khead">' +
    '<span class="k-idx">' + esc(unitShort(u) + '-' + pointSeq(u, p)) + '</span>' +
    '<h3 class="ktitle">' + esc(p.title) + '</h3>' +
    '<span class="khead-gap"></span>' + sayBtn(p.title + '。' + p.overview) +
    '<button class="learn-btn' + (learned ? ' on' : '') + '" data-act="learn" data-unit="' + u.id + '" data-id="' + esc(p.id) + '" title="标记已掌握" aria-pressed="' + learned + '" aria-label="已掌握 ' + esc(p.title) + '">' + (learned ? '✓' : '') + '</button>' +
    '</div>');

  /* 图示：先看图，再读字 */
  const figHTML = figFor(p.fig);
  if (figHTML) out.push('<div class="k-fig">' + figHTML + '</div>');

  /* 一句话要点：配一张「生活中的数学」情境照片 */
  const pp = pointPhoto(p);
  if (pp) {
    out.push('<div class="k-overview has-photo">' +
      '<img class="ov-photo" src="' + pp.img + '" alt="" loading="lazy">' +
      '<div class="ov-txt"><div class="ov-main">' + esc(p.overview) + '</div>' +
      '<div class="ov-life">🏠 ' + esc(pp.life) + '</div></div></div>');
  } else {
    out.push('<p class="k-overview">' + esc(p.overview) + '</p>');
  }

  /* 分段标签页 */
  if (tabs.length) {
    out.push('<div class="ktabs" role="tablist">' + tabs.map(t =>
      '<button class="ktab' + (t.id === active ? ' on' : '') + '" role="tab" aria-selected="' + (t.id === active) + '" data-act="kpane" data-key="' + esc(key) + '" data-p="' + t.id + '">' +
      '<span>' + t.icon + '</span>' + t.label + '</button>').join('') + '</div>');
    out.push('<div class="kpanes">' + tabs.map(t =>
      '<div class="kpane' + (t.id === active ? ' on' : '') + '" data-p="' + t.id + '">' + paneBody(u, p, t.id) + '</div>').join('') + '</div>');
  }

  /* 记忆锚：口诀 */
  if (p.recall) out.push('<div class="krecite"><span class="kr-ico">💡</span><span class="kr-text">' + esc(p.recall) + '</span>' + sayBtn(p.recall) + '</div>');

  /* 关联教学视频（可选） */
  if (p.video) {
    const v = videoById(p.video);
    if (v) {
      out.push('<button class="k-video" data-act="play-video" data-vid="' + esc(p.video) + '" aria-label="看动画：' + esc(v.title) + '">' +
        '<span class="kv-ico">🎬</span><span class="kv-txt">看动画 · ' + esc(v.title) + '</span>' +
        '<span class="kv-dur">⏱ ' + durText(v.dur) + '</span></button>');
    }
  }

  out.push('</article>');
  return out.join('');
}

/* ---------- 单元头 ---------- */
function unitHead(u, learned, total) {
  const pct = total ? Math.round(learned / total * 100) : 0;
  const photo = unitPhoto(u.id);
  return '<div class="unit-head' + (photo ? ' has-photo' : '') + '" style="--c:' + u.color +
    (photo ? ';background-image:url(' + photo + ')' : '') + '">' +
    '<div class="unit-head-main">' +
    '<div class="unit-title-row"><span class="unit-emoji">' + u.emoji + '</span>' +
    '<h1>' + esc(u.no) + ' · ' + esc(u.name) + '</h1></div>' +
    '<p>' + esc(u.intro) + '</p>' +
    '<div class="goal-tags">' + u.goals.map(g => '<span>🎯 ' + esc(g) + '</span>').join('') + '</div>' +
    '<div class="unit-progress"><div class="up-bar"><i style="width:' + pct + '%"></i></div>' +
    '<span class="up-text">已掌握 ' + learned + '/' + total + '</span></div>' +
    '</div>' +
    (photo ? '' : '<div class="unit-head-fig">' + bannerFor(u.banner) + '</div>') +
    '</div>' +
    '<div class="view-bar" role="group" aria-label="整页切换显示的内容">' +
    '<span class="vb-label">整页看</span>' +
    PANES.map(t => '<button class="vb-btn" data-act="allpane" data-p="' + t.id + '">' + t.icon + ' ' + t.label + '</button>').join('') +
    '</div>';
}

function renderUnit(u) {
  cardSeq = 0;
  return unitHead(u, unitLearned(u), u.points.length) +
    u.points.map((p, i) => pointCard(u, p, i)).join('');
}

/* ---------- 公式法则速查 ---------- */
function formulaCard(f, i) {
  return '<article class="formula-card" style="--c:#2f9bd6;--i:' + i + '">' +
    '<div class="phead"><h3>' + esc(f.title) + '</h3>' + sayBtn(f.title) + '</div>' +
    '<div class="frows">' + f.items.map(it =>
      '<button class="frow" data-act="say" data-t="' + esc(it[0] + '，' + it[1]) + '"><b>' + esc(it[0]) + '</b><span>' + esc(it[1]) + '</span></button>').join('') + '</div>' +
    '<p class="pnote">' + esc(f.note) + '</p></article>';
}

function renderFormulas() {
  const v = MEXTRA_BY_ID.formulas;
  const photo = unitPhoto('formulas');
  return '<div class="unit-head' + (photo ? ' has-photo' : '') + '" style="--c:' + v.color +
    (photo ? ';background-image:url(' + photo + ')' : '') + '">' +
    '<div class="unit-head-main"><div class="unit-title-row"><span class="unit-emoji">' + v.emoji + '</span><h1>公式法则速查</h1></div>' +
    '<p>' + MKB.formulas.length + ' 组 · 点一行读一行</p></div>' +
    (photo ? '' : '<div class="unit-head-fig">' + bannerFor(v.banner) + '</div>') + '</div>' +
    MKB.formulas.map(formulaCard).join('');
}

/* ---------- 易错诊所 ---------- */
function renderMistakes() {
  const v = MEXTRA_BY_ID.mistakes;
  const photo = unitPhoto('mistakes');
  return '<div class="unit-head' + (photo ? ' has-photo' : '') + '" style="--c:' + v.color +
    (photo ? ';background-image:url(' + photo + ')' : '') + '">' +
    '<div class="unit-head-main"><div class="unit-title-row"><span class="unit-emoji">' + v.emoji + '</span><h1>易错诊所</h1></div>' +
    '<p>考前把这张「错处清单」过一遍</p></div>' +
    (photo ? '' : '<div class="unit-head-fig">' + bannerFor(v.banner) + '</div>') + '</div>' +
    '<div class="wgrid">' + MKB.mistakes.map(m =>
      '<article class="mistake-card" style="--c:#c2557d">' +
      '<span class="unit-tag" style="background:#c2557d">' + esc(m.unit) + '</span>' +
      '<button class="mist-row wrong-row-text" data-act="say" data-t="' + esc(m.wrong) + '"><span class="mist-mark">❌</span>' + esc(m.wrong) + '</button>' +
      '<button class="mist-row right-row-text" data-act="say" data-t="' + esc(m.right) + '"><span class="mist-mark">✅</span>' + esc(m.right) + '</button>' +
      '</article>').join('') + '</div>';
}

/* ---------- 教学视频（数学小影院） ---------- */
function vidCard(v) {
  return '<article class="vid-card" style="--c:' + (v.color || '#e25563') + '">' +
    '<button class="vid-screen" data-act="play-video" data-vid="' + esc(v.id) + '" aria-label="播放：' + esc(v.title) + '">' +
    '<img class="vid-cover" src="' + esc(v.cover) + '" alt="" loading="lazy" onerror="this.style.opacity=\'0\'">' +
    '<span class="vid-shade"></span><span class="vid-play">▶</span>' +
    '<span class="vid-dur">⏱ ' + durText(v.dur) + '</span></button>' +
    '<div class="vid-meta"><h4>' + esc(v.title) + '</h4>' +
    '<p>' + esc(v.up) + ' · ' + esc(v.note || '') + '</p>' +
    '<a class="vid-link" href="https://www.bilibili.com/video/' + esc(v.bvid) + '" target="_blank" rel="noopener">↗ 去B站看高清</a></div>' +
    '</article>';
}

function renderVideos() {
  const videos = MKB.videos || { groups: [], list: [] };
  if (!videos.list.length) {
    return '<div class="empty">🎬 视频整理中，先去别的单元逛逛吧～</div>';
  }
  const v = MEXTRA_BY_ID.videos;
  const photo = unitPhoto('videos');
  let s = '<div class="unit-head' + (photo ? ' has-photo' : '') + '" style="--c:' + v.color +
    (photo ? ';background-image:url(' + photo + ')' : '') + '">' +
    '<div class="unit-head-main"><div class="unit-title-row"><span class="unit-emoji">' + v.emoji + '</span><h1>教学视频</h1></div>' +
    '<p>' + videos.list.length + ' 部好片 · 点封面在线看（需要联网），只挑适合小朋友的</p></div>' +
    (photo ? '' : '<div class="unit-head-fig">' + bannerFor(v.banner) + '</div>') + '</div>';
  videos.groups.forEach(g => {
    const items = videos.list.filter(it => it.group === g.id);
    if (!items.length) return;
    s += '<h2 class="cinema-group">' + g.emoji + ' ' + esc(g.name) + '<span>' + esc(g.desc) + '</span></h2>' +
      '<div class="vid-grid">' + items.map(vidCard).join('') + '</div>';
  });
  s += '<ul class="cinema-print-list">' + videos.list.map(it =>
    '<li>《' + esc(it.title) + '》— ' + esc(it.up) + '（' + durText(it.dur) + '，B站搜标题或 BV' + esc(it.bvid.replace(/^BV/, '')) + '）</li>').join('') + '</ul>';
  return s;
}

/* ---------- 视频播放 / 收起 ---------- */
function playVideo(id) {
  const v = videoById(id);
  const screen = document.querySelector('.vid-screen[data-vid="' + id + '"], .k-video[data-vid="' + id + '"]');
  if (!v || !screen || screen.dataset.playing) return;
  screen.dataset.playing = '1';
  if (screen.classList.contains('k-video')) {
    screen.innerHTML = '<iframe class="vid-iframe" src="' + vidEmbedUrl(id) +
      '" scrolling="no" frameborder="0" allowfullscreen="true" title="' + esc(v.title) + '" allow="autoplay; fullscreen"></iframe>' +
      '<span class="vid-close" title="收起视频">✕</span>';
  } else {
    screen.innerHTML = '<iframe class="vid-iframe" src="' + vidEmbedUrl(id) +
      '" scrolling="no" frameborder="0" allowfullscreen="true" title="' + esc(v.title) + '" allow="autoplay; fullscreen"></iframe>' +
      '<span class="vid-close" title="收起视频">✕</span>';
  }
}
function closeVideo(screen) {
  const v = videoById(screen.dataset.vid);
  if (!v || !screen) return;
  delete screen.dataset.playing;
  if (screen.classList.contains('k-video')) {
    screen.innerHTML = '<span class="kv-ico">🎬</span><span class="kv-txt">看动画 · ' + esc(v.title) + '</span>' +
      '<span class="kv-dur">⏱ ' + durText(v.dur) + '</span>';
  } else {
    screen.innerHTML = '<img class="vid-cover" src="' + esc(v.cover) + '" alt="" loading="lazy" onerror="this.style.opacity=\'0\'">' +
      '<span class="vid-shade"></span><span class="vid-play">▶</span>' +
      '<span class="vid-dur">⏱ ' + durText(v.dur) + '</span>';
  }
}

/* ---------- 搜索 ---------- */
function searchResults(q) {
  const ql = q.toLowerCase();
  const pointHits = [];
  MKB.units.forEach(u => u.points.forEach(p => {
    const hay = [p.title, p.overview, (p.items || []).join(''), p.recall || '',
      p.example ? p.example.q + p.example.a + p.example.steps : '', (p.mistakes || []).join('')].join(' ').toLowerCase();
    if (hay.includes(ql)) pointHits.push({ u, p });
  }));
  const formulaHits = MKB.formulas.map(f => ({
    title: f.title, note: f.note,
    items: f.items.filter(it => (it[0] + ' ' + it[1]).toLowerCase().includes(ql)),
  })).filter(f => f.items.length);
  const mistakeHits = MKB.mistakes.filter(m =>
    (m.unit + m.wrong + m.right).toLowerCase().includes(ql));

  const out = [];
  cardSeq = 0;
  if (pointHits.length) {
    out.push('<div class="search-head">🔎 找到 ' + pointHits.length + ' 个知识点</div>');
    MKB.units.forEach(u => {
      const hits = pointHits.filter(h => h.u === u);
      if (hits.length) out.push(hits.map(h => pointCard(u, h.p)).join(''));
    });
  }
  if (formulaHits.length) {
    out.push('<div class="search-head">📐 匹配的公式</div>' + formulaHits.map((f, i) =>
      '<article class="formula-card" style="--c:#2f9bd6;--i:' + i + '"><div class="phead"><h3>' + esc(f.title) + '</h3></div>' +
      '<div class="frows">' + f.items.map(it =>
        '<button class="frow" data-act="say" data-t="' + esc(it[0] + '，' + it[1]) + '"><b>' + esc(it[0]) + '</b><span>' + esc(it[1]) + '</span></button>').join('') + '</div></article>').join(''));
  }
  if (mistakeHits.length) {
    out.push('<div class="search-head">⚠️ 匹配的易错点</div><div class="wgrid">' + mistakeHits.map(m =>
      '<article class="mistake-card" style="--c:#c2557d">' +
      '<span class="unit-tag" style="background:#c2557d">' + esc(m.unit) + '</span>' +
      '<button class="mist-row wrong-row-text" data-act="say" data-t="' + esc(m.wrong) + '"><span class="mist-mark">❌</span>' + esc(m.wrong) + '</button>' +
      '<button class="mist-row right-row-text" data-act="say" data-t="' + esc(m.right) + '"><span class="mist-mark">✅</span>' + esc(m.right) + '</button>' +
      '</article>').join('') + '</div>');
  }
  if (!out.length) out.push('<div class="empty">🔢 没有找到「' + esc(q) + '」，换个词试试～</div>');
  return out.join('');
}

/* ---------- 渲染 ---------- */
function renderMain() {
  const box = document.getElementById('cards');
  if (query) {
    box.innerHTML = searchResults(query);
    return;
  }
  if (curView === 'formulas') { box.innerHTML = renderFormulas(); return; }
  if (curView === 'mistakes') { box.innerHTML = renderMistakes(); return; }
  if (curView === 'videos') { box.innerHTML = renderVideos(); return; }
  const u = munitById(curView);
  box.innerHTML = u ? renderUnit(u) : '';
}

function render() {
  renderChips();
  renderMain();
  renderStats();
}

/* ---------- 页头 / 侧栏文案（由 MKB.meta 驱动，换 data 文件即换文案） ---------- */
function applyMeta() {
  const meta = MKB.meta || {};
  const vol = (meta.grade || '') + (meta.volume || '');
  const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
  set('mk-banner-textbook', (meta.textbook ? meta.textbook + ' ' : '') + (meta.subject || '数学'));
  set('mk-banner-vol', vol || MKB.textbook);
  set('mk-edition', MKB.textbook);
  document.title = (meta.subject || '数学') + '知识点 · ' + (vol || MKB.textbook);
}

/* ---------- 交互 ---------- */
function selectView(id) {
  curView = id;
  if (MUNIT_BY_ID[id]) mkState.last = id;
  mkSave();
  try { history.replaceState(null, '', '#' + id); } catch (e) {}
  query = '';
  const search = document.getElementById('search');
  if (search) search.value = '';
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleLearn(unitId, pointId) {
  const key = unitId + '-' + pointId;
  if (mkState.learned[key]) delete mkState.learned[key];
  else mkState.learned[key] = true;
  mkSave();
  render();
}

/* 切换单张卡片显示的内容（不重绘，保留图示的互动状态） */
function setPane(btn) {
  const card = btn.closest('.kcard');
  if (!card) return;
  const key = btn.dataset.key;
  const p = btn.dataset.p;
  mkState.pane[key] = p;
  mkSave();
  applyPane(card, p);
}

function applyPane(card, p) {
  card.querySelectorAll('.kpane').forEach(el => el.classList.toggle('on', el.dataset.p === p));
  card.querySelectorAll('.ktab').forEach(el => {
    const on = el.dataset.p === p;
    el.classList.toggle('on', on);
    el.setAttribute('aria-selected', on ? 'true' : 'false');
  });
}

/* 整页切换：把当前视图里所有卡片翻到同一段 */
function setAllPanes(p) {
  const box = document.getElementById('cards');
  box.querySelectorAll('.kcard').forEach(card => {
    const key = card.dataset.key;
    if (!key) return;
    const tabs = card.querySelectorAll('.ktab');
    let target = p;
    if (!Array.prototype.some.call(tabs, t => t.dataset.p === p)) target = tabs.length ? tabs[0].dataset.p : p;
    mkState.pane[key] = target;
    applyPane(card, target);
  });
  mkSave();
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  try {
    if (act === 'say') { e.preventDefault(); speak(el.dataset.t); }
    else if (act === 'learn') { e.preventDefault(); toggleLearn(el.dataset.unit, el.dataset.id); }
    else if (act === 'unit') { e.preventDefault(); selectView(el.dataset.id); }
    else if (act === 'kpane') { e.preventDefault(); setPane(el); }
    else if (act === 'allpane') { e.preventDefault(); setAllPanes(el.dataset.p); }
    else if (act === 'play-video') {
      e.preventDefault();
      if (e.target.classList.contains('vid-close')) { closeVideo(el); return; }
      playVideo(el.dataset.vid);
    }
    else if (act === 'print') { e.preventDefault(); window.print(); }
    else if (act === 'home') { e.preventDefault(); window.location.href = 'index.html'; }
  } catch (err) {
    console.error('[数学知识点] 操作出错:', err);
  }
});

document.addEventListener('input', e => {
  if (e.target && e.target.id === 'search') {
    query = e.target.value.trim();
    renderChips();
    renderMain();
  }
});

/* 供自动化测试使用 */
window.MathPoints = {
  get state() { return mkState; },
  get view() { return curView; },
  get query() { return query; },
  data: MKB,
  units: MKB.units,
  render, selectView, toggleLearn, searchResults, setPane, setAllPanes,
};

applyMeta();
render();

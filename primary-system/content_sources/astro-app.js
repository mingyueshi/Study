/* ============================================================
   乐学堂 · 天文探索 —— 界面逻辑
   站点切换 / 知识点卡（要点·想一想·易错·口诀）/ 宇宙数据速查 / 天文小诊所
   搜索 / 点读 / 已掌握标记 / 打印
   ============================================================ */
'use strict';

const ASTRO_STORE_KEY = 'astrobook_v1';

/* ---------- 学习档案 ---------- */
let akState = { last: 'universe', learned: {} };
try {
  const raw = localStorage.getItem(ASTRO_STORE_KEY);
  if (raw) akState = { ...{ last: 'au1', learned: {} }, ...JSON.parse(raw) };
} catch (e) { /* 仅用内存状态 */ }
function akSave() { try { localStorage.setItem(ASTRO_STORE_KEY, JSON.stringify(akState)); } catch (e) {} }

/* ---------- 索引与视图状态 ---------- */
const AUNIT_BY_ID = {};
ASTRO.units.forEach(u => { AUNIT_BY_ID[u.id] = u; });
const ATOTAL_POINTS = ASTRO.units.reduce((n, u) => n + u.points.length, 0);
const AEXTRA_VIEWS = [
  { id: 'universe', name: '宇宙漫游 · 图像与动画', emoji: '🌌', color: '#4766b5', count: 3 },
  { id: 'facts', name: '宇宙数据速查', emoji: '🏆', color: '#b5893a', count: ASTRO.facts.reduce((n, f) => n + f.items.length, 0) },
  { id: 'clinic', name: '天文小诊所', emoji: '🩺', color: '#c2557d', count: ASTRO.mistakes.length },
];

const validView = id => Boolean(AUNIT_BY_ID[id] || AEXTRA_VIEWS.some(v => v.id === id));
const requestedView = new URLSearchParams(location.search).get('view');
let curView = validView(requestedView) ? requestedView : validView(akState.last) ? akState.last : 'universe';
let query = '';

function aunitById(id) { return AUNIT_BY_ID[id]; }
function pointKey(u, p) { return u.id + '-' + p.id; }
function totalLearned() { return ASTRO.units.reduce((n, u) => n + u.points.filter(p => akState.learned[pointKey(u, p)]).length, 0); }

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

/* ---------- 侧栏目录 ---------- */
function renderChips() {
  const unitChips = ASTRO.units.map(u => {
    const learned = u.points.filter(p => akState.learned[pointKey(u, p)]).length;
    const done = learned === u.points.length;
    const shortName = u.no.replace('第', '').replace('站', '') + ' ' + u.name;
    return '<button class="chip' + (u.id === curView && !query ? ' on' : '') + '" style="--c:' + u.color + '" data-act="unit" data-id="' + u.id + '">' +
      '<span class="chip-emoji">' + u.emoji + '</span><span class="chip-name">' + esc(shortName) + '</span>' +
      '<span class="chip-num' + (done ? ' full' : '') + '">' + learned + '/' + u.points.length + '</span></button>';
  });
  const extraChips = AEXTRA_VIEWS.map(v =>
    '<button class="chip' + (v.id === curView && !query ? ' on' : '') + '" style="--c:' + v.color + '" data-act="unit" data-id="' + v.id + '">' +
    '<span class="chip-emoji">' + v.emoji + '</span><span class="chip-name">' + esc(v.name) + '</span>' +
    '<span class="chip-num">' + v.count + '</span></button>');
  document.getElementById('chips').innerHTML = extraChips[0] + unitChips.join('') + extraChips.slice(1).join('');
}

function renderStats() {
  const el = document.getElementById('stats');
  if (el) el.textContent = '已掌握 ' + totalLearned() + ' / ' + ATOTAL_POINTS + ' 个知识点';
}

/* ---------- 知识点卡 ---------- */
function msec(label, inner) {
  return '<div class="ksec"><span class="seclabel">' + label + '</span>' + inner + '</div>';
}

/* 单元/特殊视图横幅照片，无则 '' */
function abanner(id) {
  return (window.ASTRO_PHOTOS && ASTRO_PHOTOS.banner(id)) || '';
}

function pointCard(u, p) {
  const key = pointKey(u, p);
  const learned = !!akState.learned[key];
  const parts = [];

  parts.push('<article class="kcard' + (learned ? ' learned' : '') + '" style="--c:' + u.color + '">');
  parts.push('<div class="khead"><h3 class="ktitle">' + esc(p.title) + '</h3>' +
    '<span class="khead-gap"></span>' + sayBtn(p.title + '。' + p.overview) +
    '<button class="learn-btn' + (learned ? ' on' : '') + '" data-act="learn" data-unit="' + u.id + '" data-id="' + esc(p.id) + '" title="标记已掌握" aria-pressed="' + learned + '" aria-label="已掌握 ' + esc(p.title) + '">' + (learned ? '✓' : '') + '</button></div>');
  const pp = (window.ASTRO_PHOTOS && ASTRO_PHOTOS.point(p.id)) || null;
  if (pp) {
    parts.push('<div class="k-overview has-photo">' +
      '<img class="ov-photo" src="' + pp.img + '" alt="" loading="lazy">' +
      '<div class="ov-txt"><div class="ov-main">' + esc(p.overview) + '</div>' +
      '<div class="ov-life">🔭 ' + esc(pp.life) + '</div></div></div>');
  } else {
    parts.push('<p class="k-overview">' + esc(p.overview) + '</p>');
  }
  if (p.fig && window.AstroFigures) parts.push(AstroFigures.figHTML(p.fig));

  if (p.items && p.items.length) {
    parts.push(msec('纲', '<ul class="klist">' + p.items.map(m =>
      '<li><button class="kli" data-act="say" data-t="' + esc(m) + '">' + esc(m) + '</button></li>').join('') + '</ul>'));
  }
  if (p.example) {
    parts.push(msec('想', '<div class="mex">' +
      '<button class="mex-q" data-act="say" data-t="' + esc(p.example.q) + '">📌 ' + esc(p.example.q) + '</button>' +
      '<button class="mex-steps" data-act="say" data-t="' + esc(p.example.steps) + '">' + esc(p.example.steps) + '</button>' +
      '<button class="mex-a" data-act="say" data-t="' + esc(p.example.a) + '">✅ ' + esc(p.example.a) + '</button>' +
      '</div>'));
  }
  if (p.mistakes && p.mistakes.length) {
    parts.push(msec('错', '<ul class="klist mis">' + p.mistakes.map(m =>
      '<li><button class="kli" data-act="say" data-t="' + esc(m) + '">⚠️ ' + esc(m) + '</button></li>').join('') + '</ul>'));
  }
  if (p.recall) {
    parts.push('<div class="krecite">💡 口诀：' + esc(p.recall) + '</div>');
  }
  parts.push('</article>');
  return parts.join('');
}

function renderUnit(u) {
  const photo = abanner(u.id);
  const banner = !photo && window.AstroFigures ? AstroFigures.unitBanner(u.id) : '';
  return '<div class="unit-head' + (photo ? ' has-photo' : '') + '" style="--c:' + u.color +
    (photo ? ';background-image:url(' + photo + ')' : '') + '">' +
    '<span class="unit-emoji">' + u.emoji + '</span>' +
    '<div><h1>' + esc(u.no) + ' · ' + esc(u.name) + '</h1>' +
    '<p>' + esc(u.intro) + '</p>' +
    '<div class="goal-tags">' + u.goals.map(g => '<span>🎯 ' + esc(g) + '</span>').join('') + '</div></div></div>' +
    banner +
    (u.id === 'au1' || u.id === 'au5' ? '<p class="roam-course-link">🌌 <a href="?view=universe#roam-' + (u.id === 'au1' ? 'solar' : 'galaxy') + '">打开宇宙漫游：看大图、动画与外部资料 →</a></p>' : '') +
    u.points.map(p => pointCard(u, p)).join('');
}

/* ---------- 宇宙数据速查 ---------- */
function factCard(f) {
  return '<article class="formula-card" style="--c:#b5893a">' +
    '<div class="phead"><h3>' + esc(f.title) + '</h3>' + sayBtn(f.title) + '</div>' +
    '<div class="frows">' + f.items.map(it =>
      '<button class="frow" data-act="say" data-t="' + esc(it[0] + '，' + it[1]) + '"><b>' + esc(it[0]) + '</b><span>' + esc(it[1]) + '</span></button>').join('') + '</div>' +
    '<p class="pnote">' + esc(f.note) + '</p></article>';
}

function renderFacts() {
  const photo = abanner('facts');
  return '<div class="unit-head' + (photo ? ' has-photo' : '') + '" style="--c:#b5893a' +
    (photo ? ';background-image:url(' + photo + ')' : '') + '">' +
    '<span class="unit-emoji">🏆</span><div><h1>宇宙数据速查</h1>' +
    '<p>' + ASTRO.facts.length + ' 组 · 点一行读一行</p></div></div>' +
    ASTRO.facts.map(factCard).join('');
}

/* ---------- 天文小诊所 ---------- */
function renderClinic() {
  const photo = abanner('clinic');
  return '<div class="unit-head' + (photo ? ' has-photo' : '') + '" style="--c:#c2557d' +
    (photo ? ';background-image:url(' + photo + ')' : '') + '">' +
    '<span class="unit-emoji">🩺</span><div><h1>天文小诊所</h1>' +
    '<p>考前把这张「错处清单」过一遍</p></div></div>' +
    '<div class="wgrid">' + ASTRO.mistakes.map(m =>
      '<article class="mistake-card" style="--c:#c2557d">' +
      '<span class="unit-tag" style="background:#c2557d">' + esc(m.unit) + '</span>' +
      '<button class="mist-row wrong-row-text" data-act="say" data-t="' + esc(m.wrong) + '"><span class="mist-mark">❌</span>' + esc(m.wrong) + '</button>' +
      '<button class="mist-row right-row-text" data-act="say" data-t="' + esc(m.right) + '"><span class="mist-mark">✅</span>' + esc(m.right) + '</button>' +
      '</article>').join('') + '</div>';
}

/* ---------- 搜索 ---------- */
function searchResults(q) {
  const ql = q.toLowerCase();
  const pointHits = [];
  ASTRO.units.forEach(u => u.points.forEach(p => {
    const hay = [p.title, p.overview, (p.items || []).join(''), p.recall || '',
      p.example ? p.example.q + p.example.a + p.example.steps : '', (p.mistakes || []).join('')].join(' ').toLowerCase();
    if (hay.includes(ql)) pointHits.push({ u, p });
  }));
  const factHits = ASTRO.facts.map(f => ({
    title: f.title, note: f.note,
    items: f.items.filter(it => (it[0] + ' ' + it[1]).toLowerCase().includes(ql)),
  })).filter(f => f.items.length);
  const mistakeHits = ASTRO.mistakes.filter(m =>
    (m.unit + m.wrong + m.right).toLowerCase().includes(ql));

  const out = [];
  if (window.AstroMedia) {
    const mediaHits = ASTRO_MEDIA.chapters.filter(c => [c.title, c.intro, ...c.images.map(i => i.title + i.caption)].join(' ').toLowerCase().includes(ql));
    if (mediaHits.length) out.push('<nav class="roam-search" aria-label="匹配的影像资料"><h2>🌌 图像与动画</h2>' + mediaHits.map(c => '<a href="?view=universe#roam-' + c.id + '">' + esc(c.title) + ' →</a>').join('') + '</nav>');
  }
  if (pointHits.length) {
    out.push('<div class="search-head">🔎 找到 ' + pointHits.length + ' 个知识点</div>');
    ASTRO.units.forEach(u => {
      const hits = pointHits.filter(h => h.u === u);
      if (hits.length) out.push(hits.map(h => pointCard(u, h.p)).join(''));
    });
  }
  if (factHits.length) {
    out.push('<div class="search-head">🏆 匹配的速查数据</div>' + factHits.map(f =>
      '<article class="formula-card" style="--c:#b5893a"><div class="phead"><h3>' + esc(f.title) + '</h3></div>' +
      '<div class="frows">' + f.items.map(it =>
        '<button class="frow" data-act="say" data-t="' + esc(it[0] + '，' + it[1]) + '"><b>' + esc(it[0]) + '</b><span>' + esc(it[1]) + '</span></button>').join('') + '</div></article>').join(''));
  }
  if (mistakeHits.length) {
    out.push('<div class="search-head">🩺 匹配的易错点</div><div class="wgrid">' + mistakeHits.map(m =>
      '<article class="mistake-card" style="--c:#c2557d">' +
      '<span class="unit-tag" style="background:#c2557d">' + esc(m.unit) + '</span>' +
      '<button class="mist-row wrong-row-text" data-act="say" data-t="' + esc(m.wrong) + '"><span class="mist-mark">❌</span>' + esc(m.wrong) + '</button>' +
      '<button class="mist-row right-row-text" data-act="say" data-t="' + esc(m.right) + '"><span class="mist-mark">✅</span>' + esc(m.right) + '</button>' +
      '</article>').join('') + '</div>');
  }
  if (!out.length) out.push('<div class="empty">🔭 没有找到「' + esc(q) + '」，换个词试试～</div>');
  return out.join('');
}

/* ---------- 渲染 ---------- */
function renderMain() {
  const box = document.getElementById('cards');
  if (window.AstroMedia) AstroMedia.dispose();
  if (query) {
    box.innerHTML = searchResults(query);
    return;
  }
  if (curView === 'facts') { box.innerHTML = renderFacts(); return; }
  if (curView === 'clinic') { box.innerHTML = renderClinic(); return; }
  if (curView === 'universe' && window.AstroMedia) {
    box.innerHTML = AstroMedia.render();
    AstroMedia.mount();
    return;
  }
  const u = aunitById(curView);
  box.innerHTML = u ? renderUnit(u) : '';
}

function render() {
  renderChips();
  renderMain();
  renderStats();
}

/* ---------- 交互 ---------- */
function selectView(id) {
  if (!validView(id)) return;
  curView = id;
  akState.last = id;
  const url = new URL(location.href);
  url.searchParams.set('view', id);
  url.hash = '';
  history.replaceState(null, '', url);
  akSave();
  query = '';
  const search = document.getElementById('search');
  if (search) search.value = '';
  render();
  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}

function toggleLearn(unitId, pointId) {
  const key = unitId + '-' + pointId;
  if (akState.learned[key]) delete akState.learned[key];
  else akState.learned[key] = true;
  akSave();
  render();
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  try {
    if (act === 'say') { e.preventDefault(); speak(el.dataset.t); }
    else if (act === 'learn') { e.preventDefault(); toggleLearn(el.dataset.unit, el.dataset.id); }
    else if (act === 'unit') { e.preventDefault(); selectView(el.dataset.id); }
    else if (act === 'print') { e.preventDefault(); window.print(); }
    else if (act === 'home') { e.preventDefault(); window.location.href = 'index.html'; }
  } catch (err) {
    console.error('[天文探索] 操作出错:', err);
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
window.AstroExplore = {
  get state() { return akState; },
  get view() { return curView; },
  get query() { return query; },
  data: ASTRO,
  units: ASTRO.units,
  render, selectView, toggleLearn, searchResults,
};

render();
if (location.hash.startsWith('#roam-')) {
  requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({behavior: 'instant'}));
}

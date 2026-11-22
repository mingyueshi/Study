/* ============================================================
   乐学堂 · 电脑与 AI 怎样工作 —— 界面逻辑
   站点切换 / 知识点卡（要点·想一想·易错·口诀）/ 计算机速查
   搜索 / 点读 / 已掌握标记 / 打印
   ============================================================ */
'use strict';

COMPUTING.units.forEach(unit => {
  unit.points = unit.points.map(window.StudyTopicConnections.lesson);
});

const CP_STORE_KEY = 'computingbook_v1';

/* ---------- 学习档案 ---------- */
let cpState = { last: 'cp1', learned: {} };
try {
  const raw = localStorage.getItem(CP_STORE_KEY);
  if (raw) cpState = { ...{ last: 'cp1', learned: {} }, ...JSON.parse(raw) };
} catch (e) { /* 仅用内存状态 */ }
function cpSave() { try { localStorage.setItem(CP_STORE_KEY, JSON.stringify(cpState)); } catch (e) {} }

/* ---------- 索引与视图状态 ---------- */
const CUNIT_BY_ID = {};
COMPUTING.units.forEach(u => { CUNIT_BY_ID[u.id] = u; });
const CTOTAL_POINTS = COMPUTING.units.reduce((n, u) => n + u.points.length, 0);
const CExtra_VIEWS = [
  { id: 'facts', name: '计算机速查', emoji: '🗂️', color: '#4d96ff', count: COMPUTING.facts.reduce((n, f) => n + f.items.length, 0) },
];

let curView = CUNIT_BY_ID[cpState.last] ? cpState.last : 'cp1';
let query = '';

function cunitById(id) { return CUNIT_BY_ID[id]; }
function pointKey(u, p) { return u.id + '-' + p.id; }
function totalLearned() { return COMPUTING.units.reduce((n, u) => n + u.points.filter(p => cpState.learned[pointKey(u, p)]).length, 0); }

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
function chipsHTML() {
  const unitChips = COMPUTING.units.map(u => {
    const learned = u.points.filter(p => cpState.learned[pointKey(u, p)]).length;
    const done = learned === u.points.length;
    const shortName = u.no.replace('第', '').replace('站', '') + ' ' + u.name;
    const active = u.id === curView && !query;
    return '<button type="button" class="chip' + (active ? ' on' : '') + '"' + (active ? ' aria-current="true"' : '') + ' style="--c:' + u.color + '" data-act="unit" data-id="' + u.id + '">' +
      '<span class="chip-emoji">' + u.emoji + '</span><span class="chip-name">' + esc(shortName) + '</span>' +
      '<span class="chip-num' + (done ? ' full' : '') + '">' + learned + '/' + u.points.length + '</span></button>';
  });
  const extraChips = CExtra_VIEWS.map(v =>
    '<button class="chip' + (v.id === curView && !query ? ' on' : '') + '" style="--c:' + v.color + '" data-act="unit" data-id="' + v.id + '">' +
    '<span class="chip-emoji">' + v.emoji + '</span><span class="chip-name">' + esc(v.name) + '</span>' +
    '<span class="chip-num">' + v.count + '</span></button>');
  return unitChips.join('') + extraChips.join('');
}

function renderChips() {
  const html = chipsHTML();
  document.querySelectorAll('#chips').forEach(nav => { nav.innerHTML = html; });
}

function renderStats() {
  const text = '已掌握 ' + totalLearned() + ' / ' + CTOTAL_POINTS + ' 个知识点';
  document.querySelectorAll('#stats').forEach(el => { el.textContent = text; });
}

/* ---------- 知识点卡 ---------- */
function msec(label, inner) {
  return '<div class="ksec"><span class="seclabel">' + label + '</span>' + inner + '</div>';
}

function pointCard(u, p) {
  const key = pointKey(u, p);
  const learned = !!cpState.learned[key];
  const parts = [];

  parts.push('<article id="lesson-' + esc(p.id) + '" class="kcard' + (learned ? ' learned' : '') + '" style="--c:' + u.color + '">');
  parts.push('<div class="khead"><h3 class="ktitle">' + esc(p.title) + '</h3>' +
    '<span class="khead-gap"></span>' + sayBtn(p.title + '。' + p.overview) +
    '<button class="learn-btn' + (learned ? ' on' : '') + '" data-act="learn" data-unit="' + u.id + '" data-id="' + esc(p.id) + '" title="标记已掌握" aria-pressed="' + learned + '" aria-label="已掌握 ' + esc(p.title) + '">' + (learned ? '✓' : '') + '</button></div>');
  parts.push('<p class="k-overview">' + esc(p.overview) + '</p>');
  if (p.fig && window.ComputingFigures) parts.push(ComputingFigures.figHTML(p.fig));

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
  parts.push(window.StudyTopicConnections.references(p.id, '接着学'));
  parts.push('</article>');
  return parts.join('');
}

function renderUnit(u) {
  const bannerSvg = u.banner && window.ComputingFigures
    ? ComputingFigures.figHTML(u.banner)
    : '';
  const banner = bannerSvg
    ? '<div class="unit-banner">' + bannerSvg + '</div>'
    : '';
  return '<div class="unit-head" style="--c:' + u.color + '">' +
    '<span class="unit-emoji">' + u.emoji + '</span>' +
    '<div><h1>' + esc(u.no) + ' · ' + esc(u.name) + '</h1>' +
    '<p>' + esc(u.intro) + '</p>' +
    '<div class="goal-tags">' + u.goals.map(g => '<span>🎯 ' + esc(g) + '</span>').join('') + '</div></div></div>' +
    banner +
    u.points.map(p => pointCard(u, p)).join('');
}

/* ---------- 计算机速查 ---------- */
function factCard(f) {
  return '<article class="formula-card" style="--c:#4d96ff">' +
    '<div class="phead"><h3>' + esc(f.title) + '</h3>' + sayBtn(f.title) + '</div>' +
    '<div class="frows">' + f.items.map(it =>
      '<button class="frow" data-act="say" data-t="' + esc(it[0] + '，' + it[1]) + '"><b>' + esc(it[0]) + '</b><span>' + esc(it[1]) + '</span></button>').join('') + '</div>' +
    '<p class="pnote">' + esc(f.note) + '</p></article>';
}

function renderFacts() {
  return '<div class="unit-head" style="--c:#4d96ff">' +
    '<span class="unit-emoji">🗂️</span><div><h1>计算机速查</h1>' +
    '<p>' + COMPUTING.facts.length + ' 组 · 点一行读一行</p></div></div>' +
    COMPUTING.facts.map(factCard).join('');
}

/* ---------- 搜索 ---------- */
function searchResults(q) {
  const ql = q.toLowerCase();
  const pointHits = [];
  COMPUTING.units.forEach(u => u.points.forEach(p => {
    const hay = [p.title, p.overview, (p.items || []).join(''), p.recall || '',
      p.example ? p.example.q + p.example.a + p.example.steps : '', (p.mistakes || []).join('')].join(' ').toLowerCase();
    if (hay.includes(ql)) pointHits.push({ u, p });
  }));
  const factHits = COMPUTING.facts.map(f => ({
    title: f.title, note: f.note,
    items: f.items.filter(it => (it[0] + ' ' + it[1]).toLowerCase().includes(ql)),
  })).filter(f => f.items.length);

  const out = [];
  if (pointHits.length) {
    out.push('<div class="search-head">🔎 找到 ' + pointHits.length + ' 个知识点</div>');
    COMPUTING.units.forEach(u => {
      const hits = pointHits.filter(h => h.u === u);
      if (hits.length) out.push(hits.map(h => pointCard(u, h.p)).join(''));
    });
  }
  if (factHits.length) {
    out.push('<div class="search-head">🗂️ 匹配的速查</div>' + factHits.map(f =>
      '<article class="formula-card" style="--c:#4d96ff"><div class="phead"><h3>' + esc(f.title) + '</h3></div>' +
      '<div class="frows">' + f.items.map(it =>
        '<button class="frow" data-act="say" data-t="' + esc(it[0] + '，' + it[1]) + '"><b>' + esc(it[0]) + '</b><span>' + esc(it[1]) + '</span></button>').join('') + '</div></article>').join(''));
  }
  if (!out.length) out.push('<div class="empty">🤖 没有找到「' + esc(q) + '」，换个词试试～</div>');
  return out.join('');
}

/* ---------- 渲染 ---------- */
function renderMain() {
  window.ComputingLabs?.dispose?.();
  const box = document.getElementById('cards');
  if (query) {
    box.innerHTML = searchResults(query);
    return;
  }
  if (curView === 'facts') { box.innerHTML = renderFacts(); return; }
  const u = cunitById(curView);
  box.innerHTML = u ? renderUnit(u) : '';
}

function render() {
  renderMain();
  renderChips();
  renderStats();
}

/* ---------- 交互 ---------- */
function selectView(id) {
  curView = id;
  if (CUNIT_BY_ID[id]) cpState.last = id;
  cpSave();
  query = '';
  const search = document.getElementById('search');
  if (search) search.value = '';
  if (location.hash.startsWith('#lesson-')) history.replaceState(history.state, '', location.pathname + location.search);
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleLearn(unitId, pointId) {
  const key = unitId + '-' + pointId;
  const learned = !cpState.learned[key];
  if (learned) cpState.learned[key] = true;
  else delete cpState.learned[key];
  cpSave();
  const card = document.getElementById('lesson-' + pointId);
  if (card) {
    const button = card.querySelector('.learn-btn');
    card.classList.toggle('learned', learned);
    button.classList.toggle('on', learned);
    button.setAttribute('aria-pressed', String(learned));
    button.textContent = learned ? '✓' : '';
  }
  renderChips();
  renderStats();
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
  } catch (err) {
    console.error('[计算乐园] 操作出错:', err);
  }
});

document.addEventListener('input', e => {
  if (e.target && e.target.id === 'search') {
    query = e.target.value.trim();
    render();
  }
});

/* 供自动化测试使用 */
window.ComputingExplore = {
  get state() { return cpState; },
  get view() { return curView; },
  get query() { return query; },
  data: COMPUTING,
  units: COMPUTING.units,
  render, selectView, toggleLearn, searchResults,
};

function openLessonFromHash() {
  const anchor = window.location.hash.slice(1);
  if (!anchor.startsWith('lesson-')) return false;
  const id = anchor.slice('lesson-'.length);
  const unit = COMPUTING.units.find(item => item.points.some(point => point.id === id));
  if (!unit) return false;
  const current = unit.id === curView && !query && document.getElementById(anchor);
  if (current) {
    current.scrollIntoView();
    return true;
  }
  curView = unit.id;
  query = '';
  document.getElementById('search').value = '';
  render();
  document.getElementById(anchor).scrollIntoView();
  return true;
}

window.addEventListener('hashchange', openLessonFromHash);
if (!openLessonFromHash()) render();

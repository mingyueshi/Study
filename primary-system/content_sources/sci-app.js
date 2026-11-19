/* ============================================================
   乐学堂 · 科学实验室 —— 界面逻辑
   实验室切换 / 知识点卡（要点·想一想·易错·口诀）/ 科学速查 / 科学小诊所
   搜索 / 点读 / 已掌握标记 / 打印
   ============================================================ */
'use strict';

const SCI_STORE_KEY = 'scibook_v1';

/* ---------- 学习档案 ---------- */
let scState = { last: 'su1', learned: {} };
try {
  const raw = localStorage.getItem(SCI_STORE_KEY);
  if (raw) scState = { ...{ last: 'su1', learned: {} }, ...JSON.parse(raw) };
} catch (e) { /* 仅用内存状态 */ }
function scSave() { try { localStorage.setItem(SCI_STORE_KEY, JSON.stringify(scState)); } catch (e) {} }

/* ---------- 索引与视图状态 ---------- */
const SUNIT_BY_ID = {};
SCI.units.forEach(u => { SUNIT_BY_ID[u.id] = u; });
const TOTAL_POINTS = SCI.units.reduce((n, u) => n + u.points.length, 0);
const SExtra_VIEWS = [
  { id: 'facts', name: '科学速查', emoji: '🗂️', color: '#b5893a', count: SCI.facts.reduce((n, f) => n + f.items.length, 0) },
  { id: 'clinic', name: '科学小诊所', emoji: '🩺', color: '#c2557d', count: SCI.mistakes.length },
];
const ELECTRIC_EXPERIMENTS = ['demo-sci-circuit', 'sci-magnet', 'sci-electromagnet'];
const ELECTRIC_NAVIGATION = {id:'sci-electric-navigation', label:'切换实验'};
const CIRCUIT_SETTINGS = {id:'sci-circuit-settings', label:'选择电路接法'};
const COIL_SETTINGS = {id:'sci-coil-settings', label:'调整电流与线圈匝数'};

let curView = SUNIT_BY_ID[scState.last] ? scState.last : 'su1';
let query = '';

function sunitById(id) { return SUNIT_BY_ID[id]; }
function pointKey(u, p) { return u.id + '-' + p.id; }
function totalLearned() { return SCI.units.reduce((n, u) => n + u.points.filter(p => scState.learned[pointKey(u, p)]).length, 0); }

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
  const unitChips = SCI.units.map(u => {
    const learned = u.points.filter(p => scState.learned[pointKey(u, p)]).length;
    const done = learned === u.points.length;
    const shortName = u.no.replace('第', '').replace('实验室', '') + ' ' + u.name;
    const active = u.id === curView && !query;
    return '<button type="button" class="chip' + (active ? ' on' : '') + '"' + (active ? ' aria-current="true"' : '') + ' style="--c:' + u.color + '" data-act="unit" data-id="' + u.id + '">' +
      '<span class="chip-emoji">' + u.emoji + '</span><span class="chip-name">' + esc(shortName) + '</span>' +
      '<span class="chip-num' + (done ? ' full' : '') + '">' + learned + '/' + u.points.length + '</span></button>';
  });
  const extraChips = SExtra_VIEWS.map(v =>
    '<button class="chip' + (v.id === curView && !query ? ' on' : '') + '" style="--c:' + v.color + '" data-act="unit" data-id="' + v.id + '">' +
    '<span class="chip-emoji">' + v.emoji + '</span><span class="chip-name">' + esc(v.name) + '</span>' +
    '<span class="chip-num">' + v.count + '</span></button>');
  return unitChips.join('') + extraChips.join('');
}

function renderChips() {
  const html = chipsHTML();
  document.querySelectorAll('#chips, #sci-circuit-chips').forEach(nav => { nav.innerHTML = html; });
}

function renderStats() {
  const text = '已掌握 ' + totalLearned() + ' / ' + TOTAL_POINTS + ' 个知识点';
  document.querySelectorAll('#stats, #sci-circuit-stats').forEach(el => { el.textContent = text; });
}

/* ---------- 知识点卡 ---------- */
function msec(label, inner) {
  return '<div class="ksec"><span class="seclabel">' + label + '</span>' + inner + '</div>';
}

function pointCard(u, p, {experiment = false, settings = null} = {}) {
  const key = pointKey(u, p);
  const learned = !!scState.learned[key];
  const parts = [];

  parts.push('<article id="lesson-' + esc(p.id) + '" class="kcard' + (learned ? ' learned' : '') + '" style="--c:' + u.color + '">');
  const titleTag = experiment ? 'h2' : 'h3';
  const titleId = settings === CIRCUIT_SETTINGS ? ' id="sci-circuit-diagram"' : '';
  parts.push('<div class="khead"><' + titleTag + ' class="ktitle"' + titleId + '>' + esc(p.title) + '</' + titleTag + '>' +
    '<span class="khead-gap"></span>' + sayBtn(p.title + '。' + p.overview) +
    '<button class="learn-btn' + (learned ? ' on' : '') + '" data-act="learn" data-unit="' + u.id + '" data-id="' + esc(p.id) + '" title="标记已掌握" aria-pressed="' + learned + '" aria-label="已掌握 ' + esc(p.title) + '">' + (learned ? '✓' : '') + '</button></div>');
  parts.push('<p class="k-overview">' + esc(p.overview) + '</p>');
  const jump = settings || (experiment && p.fig === 'sci-magnet' ? ELECTRIC_NAVIGATION : null);
  if (jump) parts.push(`<a class="experiment-jump" href="#${jump.id}" data-experiment-jump>${jump.label} ↗</a>`);
  if (p.fig && window.SciFigures) parts.push(SciFigures.figHTML(p.fig, undefined, {
    sideCircuitSettings: settings === CIRCUIT_SETTINGS,
    coilSettingsId: settings === COIL_SETTINGS ? COIL_SETTINGS.id : '',
  }));

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
  const bannerSvg = u.banner && window.SciFigures
    ? SciFigures.figHTML(u.banner)
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

function renderElectricUnit(u, circuitSettings) {
  const experiments = u.points.filter(point => ELECTRIC_EXPERIMENTS.includes(point.fig));
  const otherPoints = u.points.filter(point => !experiments.includes(point));
  const electromagnet = experiments.find(point => point.fig === 'sci-electromagnet');
  const coilSettings = electromagnet && window.SciExperiments?.coilSettingsHTML?.();
  const firstExperiment = experiments.find(point => location.hash === `#lesson-${point.id}`);
  const circuitFirst = !firstExperiment || firstExperiment.fig === 'demo-sci-circuit';
  const pointLinks = points => points.map(point => `<a href="#lesson-${esc(point.id)}">${esc(point.title)}</a>`).join('');
  const topicLinks = document.querySelector('.study-topic-nav')?.innerHTML || '';
  return `<div class="sci-electric-topic geo-experiment">
    <header class="experiment-heading">
      <h1>电与磁实验</h1>
      <p>比较串联与并联，翻转磁极，再用线圈和电流观察电磁铁。</p>
    </header>
    <div class="experiment-workspace" data-sidebar-layout=".experiment-side" data-sidebar-width="clamp(260px, 24vw, 320px)"
         data-sidebar-label="电与磁实验工具" data-sidebar-collapse-key="sci_circuit_sidebar_collapsed_v1">
      <aside class="experiment-side" aria-label="电与磁实验参数与专题导航">
        <details class="experiment-tools" id="${ELECTRIC_NAVIGATION.id}" open>
          <summary>切换实验</summary>
          <nav class="experiment-links" aria-label="电与磁实验">${pointLinks(experiments)}</nav>
        </details>
        <details class="experiment-tools" id="${CIRCUIT_SETTINGS.id}"${circuitFirst ? ' open' : ''}>
          <summary>电路接法</summary>
          <div class="experiment-controls">
            ${circuitSettings}
            <a class="experiment-return" href="#sci-circuit-diagram" data-experiment-return>返回电路图 ↓</a>
          </div>
        </details>
        ${coilSettings ? `<details class="experiment-tools" id="${COIL_SETTINGS.id}"${firstExperiment === electromagnet ? ' open' : ''}>
          <summary>电磁铁参数</summary>
          <div class="experiment-controls">
            ${coilSettings}
            <a class="experiment-return" href="#lesson-${esc(electromagnet.id)}" data-experiment-return>返回电磁铁图 ↓</a>
          </div>
        </details>` : ''}
        <details class="experiment-tools">
          <summary>其他知识点</summary>
          <nav class="experiment-links" aria-label="电与磁其他知识点">${pointLinks(otherPoints)}</nav>
        </details>
        <details class="experiment-tools">
          <summary>科学实验室目录</summary>
          <nav class="sci-circuit-courses experiment-controls" id="sci-circuit-chips" aria-label="科学实验室目录"></nav>
          <p class="sci-circuit-progress" id="sci-circuit-stats" role="status"></p>
        </details>
        ${topicLinks ? `<details class="experiment-tools">
          <summary>相关专题</summary>
          <nav class="experiment-links" aria-label="科学相关专题">${topicLinks}</nav>
        </details>` : ''}
      </aside>
      <div class="experiment-content">
        ${experiments.map(point => pointCard(u, point, {experiment:true,
          settings:point.fig === 'demo-sci-circuit' ? CIRCUIT_SETTINGS : point === electromagnet && coilSettings ? COIL_SETTINGS : null,
        })).join('')}
        <section aria-labelledby="sci-circuit-reading">
          <div class="unit-head" style="--c:${u.color}">
            <div><h2 id="sci-circuit-reading">电与磁的其他知识点</h2>
              <p>${esc(u.intro)}</p>
              <div class="goal-tags">${u.goals.map(goal => `<span>🎯 ${esc(goal)}</span>`).join('')}</div>
            </div>
          </div>
          ${otherPoints.map(point => pointCard(u, point)).join('')}
        </section>
      </div>
    </div>
  </div>`;
}

/* ---------- 科学速查 ---------- */
function factCard(f) {
  return '<article class="formula-card" style="--c:#b5893a">' +
    '<div class="phead"><h3>' + esc(f.title) + '</h3>' + sayBtn(f.title) + '</div>' +
    '<div class="frows">' + f.items.map(it =>
      '<button class="frow" data-act="say" data-t="' + esc(it[0] + '，' + it[1]) + '"><b>' + esc(it[0]) + '</b><span>' + esc(it[1]) + '</span></button>').join('') + '</div>' +
    '<p class="pnote">' + esc(f.note) + '</p></article>';
}

function renderFacts() {
  return '<div class="unit-head" style="--c:#b5893a">' +
    '<span class="unit-emoji">🗂️</span><div><h1>科学速查</h1>' +
    '<p>' + SCI.facts.length + ' 组 · 点一行读一行</p></div></div>' +
    SCI.facts.map(factCard).join('');
}

/* ---------- 科学小诊所 ---------- */
function renderClinic() {
  return '<div class="unit-head" style="--c:#c2557d">' +
    '<span class="unit-emoji">🩺</span><div><h1>科学小诊所</h1>' +
    '<p>考前把这张「错处清单」过一遍</p></div></div>' +
    '<div class="wgrid">' + SCI.mistakes.map(m =>
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
  SCI.units.forEach(u => u.points.forEach(p => {
    const hay = [p.title, p.overview, (p.items || []).join(''), p.recall || '',
      p.example ? p.example.q + p.example.a + p.example.steps : '', (p.mistakes || []).join('')].join(' ').toLowerCase();
    if (hay.includes(ql)) pointHits.push({ u, p });
  }));
  const factHits = SCI.facts.map(f => ({
    title: f.title, note: f.note,
    items: f.items.filter(it => (it[0] + ' ' + it[1]).toLowerCase().includes(ql)),
  })).filter(f => f.items.length);
  const mistakeHits = SCI.mistakes.filter(m =>
    (m.unit + m.wrong + m.right).toLowerCase().includes(ql));

  const out = [];
  if (pointHits.length) {
    out.push('<div class="search-head">🔎 找到 ' + pointHits.length + ' 个知识点</div>');
    SCI.units.forEach(u => {
      const hits = pointHits.filter(h => h.u === u);
      if (hits.length) out.push(hits.map(h => pointCard(u, h.p)).join(''));
    });
  }
  if (factHits.length) {
    out.push('<div class="search-head">🗂️ 匹配的速查</div>' + factHits.map(f =>
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
  if (!out.length) out.push('<div class="empty">🧪 没有找到「' + esc(q) + '」，换个词试试～</div>');
  return out.join('');
}

/* ---------- 渲染 ---------- */
function renderMain() {
  window.SciDemoMotion?.dispose();
  window.SciProcess?.dispose();
  window.SciExperiments?.dispose();
  const box = document.getElementById('cards');
  if (query) {
    box.innerHTML = searchResults(query);
    return;
  }
  if (curView === 'facts') { box.innerHTML = renderFacts(); return; }
  if (curView === 'clinic') { box.innerHTML = renderClinic(); return; }
  const u = sunitById(curView);
  const hasCircuit = u?.points.some(point => point.fig === 'demo-sci-circuit');
  const settings = hasCircuit && window.SciFigures?.circuitSettingsHTML?.();
  box.innerHTML = settings ? renderElectricUnit(u, settings) : u ? renderUnit(u) : '';
}

function render() {
  renderMain();
  renderChips();
  renderStats();
}

/* ---------- 交互 ---------- */
function selectView(id) {
  curView = id;
  if (SUNIT_BY_ID[id]) scState.last = id;
  scSave();
  query = '';
  const search = document.getElementById('search');
  if (search) search.value = '';
  if (location.hash.startsWith('#lesson-')) history.replaceState(history.state, '', location.pathname + location.search);
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleLearn(unitId, pointId) {
  const key = unitId + '-' + pointId;
  const learned = !scState.learned[key];
  if (learned) scState.learned[key] = true;
  else delete scState.learned[key];
  scSave();
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
    else if (act === 'home') { e.preventDefault(); window.location.href = 'index.html'; }
  } catch (err) {
    console.error('[科学实验室] 操作出错:', err);
  }
});

document.addEventListener('input', e => {
  if (e.target && e.target.id === 'search') {
    query = e.target.value.trim();
    render();
  }
});

/* 供自动化测试使用 */
window.SciExplore = {
  get state() { return scState; },
  get view() { return curView; },
  get query() { return query; },
  data: SCI,
  units: SCI.units,
  render, selectView, toggleLearn, searchResults,
};

function openLessonFromHash() {
  const anchor = window.location.hash.slice(1);
  if (!anchor.startsWith('lesson-')) return false;
  const id = anchor.slice('lesson-'.length);
  const unit = SCI.units.find(item => item.points.some(point => point.id === id));
  if (!unit) return false;
  const current = unit.id === curView && !query && document.getElementById(anchor);
  if (current) {
    const jump = current.querySelector('[data-experiment-jump]');
    const group = jump && document.getElementById(jump.hash.slice(1));
    if (group) group.open = true;
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

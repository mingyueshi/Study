/* ============================================================
   乐学堂 · 汉字演变馆 —— 界面逻辑
   字族切换 / 字卡（四段演变·字理故事·组词·查一查）/
   馆前必读 / 六书速查 / 搜索 / 猜字模式 / 朗读 / 已认全标记 / 打印
   ============================================================ */
'use strict';

const HE_STORE_KEY = 'hanziEvolution_v1';
const courseAssets = new URL('.', document.currentScript.src);

/* ---------- 学习档案 ---------- */
let heState = { last: 'hall', learned: {}, guess: false };
try {
  const raw = localStorage.getItem(HE_STORE_KEY);
  if (raw) heState = { ...{ last: 'hall', learned: {}, guess: false }, ...JSON.parse(raw) };
} catch (e) { /* 仅用内存状态 */ }
function heSave() { try { localStorage.setItem(HE_STORE_KEY, JSON.stringify(heState)); } catch (e) {} }

/* ---------- 索引与视图状态 ---------- */
const D = window.HANZI_EVO;
const HUNIT_BY_ID = {};
D.units.forEach(u => { HUNIT_BY_ID[u.id] = u; });
const POINT_BY_CHAR = {};
D.units.forEach(u => u.points.forEach(p => { POINT_BY_CHAR[p.char] = { u, p }; }));
const HE_TOTAL = D.units.reduce((n, u) => n + u.points.length, 0);
const STAGE_META = {
  ob: { name: '甲骨文', era: '商朝' },
  bronze: { name: '金文', era: '商周' },
  seal: { name: '小篆', era: '秦朝' },
  kai: { name: '楷书', era: '今天' },
};
const HEXTRA_VIEWS = [
  { id: 'hall', name: '馆前必读', emoji: '🏛️', color: '#9a3412', count: D.hall.stages.length },
  { id: 'sixbooks', name: '六书速查', emoji: '🧩', color: '#5b21b6', count: D.sixbooks.length },
];

let curView = HUNIT_BY_ID[heState.last] || HEXTRA_VIEWS.some(v => v.id === heState.last) ? heState.last : 'hall';
let query = '';

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

function normPinyin(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/* 查找页外链基址：page.html 在专题框上挂好了三个 {% url %} 地址 */
function frameLinks() {
  const frame = document.querySelector('.study-topic-frame');
  const attr = name => (frame ? frame.dataset[name] || '' : '');
  const strokeBase = attr('stroke') || '/hanzi/日/';
  return {
    dictionary: attr('dictionary') || '/dictionary/',
    strokes: strokeBase.replace(/\/[^/]*\/$/, '/'),
    polyphones: attr('polyphones') || '/hanzi/polyphones/',
  };
}

/* ---------- 侧栏目录 ---------- */
function renderChips() {
  const unitChips = D.units.map(u => {
    const learned = u.points.filter(p => heState.learned[p.id]).length;
    const done = learned === u.points.length;
    const shortName = u.no.replace('第', '').replace('族', '') + ' ' + u.name;
    return '<button class="chip' + (u.id === curView && !query ? ' on' : '') + '" style="--c:' + u.color + '" data-act="unit" data-id="' + u.id + '">' +
      '<span class="chip-emoji">' + u.emoji + '</span><span class="chip-name">' + esc(shortName) + '</span>' +
      '<span class="chip-num' + (done ? ' full' : '') + '">' + learned + '/' + u.points.length + '</span></button>';
  });
  const extraChips = HEXTRA_VIEWS.map(v =>
    '<button class="chip' + (v.id === curView && !query ? ' on' : '') + '" style="--c:' + v.color + '" data-act="unit" data-id="' + v.id + '">' +
    '<span class="chip-emoji">' + v.emoji + '</span><span class="chip-name">' + esc(v.name) + '</span>' +
    '<span class="chip-num">' + v.count + '</span></button>');
  document.getElementById('chips').innerHTML = extraChips.join('') + unitChips.join('');
}

function renderStats() {
  const el = document.getElementById('stats');
  if (el) el.textContent = '已认全 ' + totalLearned() + ' / ' + HE_TOTAL + ' 个字';
}

function totalLearned() {
  return D.units.reduce((n, u) => n + u.points.filter(p => heState.learned[p.id]).length, 0);
}

/* ---------- 字形演变条 ---------- */
function stageCell(stage, entry, color) {
  const meta = STAGE_META[stage];
  const body = entry.img
    ? '<img src="' + esc(new URL(entry.img, courseAssets).href) + '" alt="' + esc(meta.name) + '字形" loading="lazy">'
    : '<span class="stage-kai">' + esc(entry.text) + '</span>';
  return '<div class="stage-cell stage-' + stage + '" style="--c:' + color + '">' +
    '<div class="stage-box">' + body + '</div>' +
    '<span class="stage-name">' + meta.name + '</span>' +
    '<span class="stage-era">' + meta.era + '</span>' +
    (entry.note ? '<span class="stage-note">' + esc(entry.note) + '</span>' : '') +
    '</div>';
}

function evoStrip(p, color) {
  const byStage = {};
  (p.forms || []).forEach(f => { byStage[f.stage] = f; });
  const cells = [];
  ['ob', 'bronze', 'seal', 'kai'].forEach(stage => {
    if (stage === 'kai') {
      cells.push(stageCell(stage, { text: p.char }, color));
    } else if (byStage[stage]) {
      cells.push(stageCell(stage, byStage[stage], color));
    } else {
      cells.push('<div class="stage-cell stage-missing" style="--c:' + color + '">' +
        '<div class="stage-box"><span class="stage-none">未见于' + STAGE_META[stage].name + '</span></div>' +
        '<span class="stage-name">' + STAGE_META[stage].name + '</span>' +
        '<span class="stage-era">—</span></div>');
    }
    if (stage !== 'kai') cells.push('<span class="stage-arrow" aria-hidden="true">→</span>');
  });
  return '<div class="evo-strip">' + cells.join('') + '</div>';
}

/* ---------- 字卡 ---------- */
function wordChips(p, links) {
  const words = (p.words || []).map(w =>
    '<a class="word-chip" href="' + esc(links.dictionary) + '?q=' + encodeURIComponent(w) + '&scope=chinese" target="_blank" rel="noopener">' + esc(w) + '</a>');
  return words.join('');
}

function charCard(p, color, links) {
  const learned = !!heState.learned[p.id];
  const parts = [];
  parts.push('<article class="hanzi-card' + (learned ? ' learned' : '') + '" id="char-' + esc(p.char) + '" style="--c:' + color + '">');
  parts.push('<div class="hhead">' +
    '<div class="hchar-block"><span class="hchar">' + esc(p.char) + '</span><span class="hpinyin">' + esc(p.pinyin) + '</span>' +
    '<button class="reveal-btn" data-act="reveal" data-id="' + esc(p.char) + '">👀 揭晓</button></div>' +
    '<div class="hmeta"><div class="hbadges">' +
    '<span class="hbadge type-badge">' + esc(p.type) + '</span>' +
    '<span class="hbadge">' + p.strokes + ' 画</span>' +
    (p.poly ? '<a class="hbadge poly-badge" href="' + esc(links.polyphones) + '?char=' + encodeURIComponent(p.char) + '">多音字 ↗</a>' : '') +
    '</div>' +
    '<div class="htools">' + sayBtn('「' + p.char + '」，' + p.pinyin + '。' + p.story) +
    '<button class="learn-btn' + (learned ? ' on' : '') + '" data-act="learn" data-id="' + esc(p.id) + '" title="标记已认全" aria-pressed="' + learned + '" aria-label="已认全 ' + esc(p.char) + '">' + (learned ? '✓' : '') + '</button></div>' +
    '</div></div>');
  parts.push(evoStrip(p, color));
  parts.push('<div class="hstory"><span class="seclabel">📖 字理小故事</span>' +
    '<p>' + esc(p.story) + '</p></div>');
  parts.push('<div class="hwords"><span class="seclabel">组词</span>' + wordChips(p, links) + '</div>');
  parts.push('<div class="hlinks">' +
    '<a class="hlink" href="' + esc(links.dictionary) + '?q=' + encodeURIComponent(p.char) + '&scope=character" target="_blank" rel="noopener">📖 查字查词 ↗</a>' +
    '<a class="hlink" href="' + esc(links.strokes) + encodeURIComponent(p.char) + '" target="_blank" rel="noopener">✍️ 看笔顺 ↗</a>' +
    '</div>');
  parts.push('</article>');
  return parts.join('');
}

/* ---------- 字族视图 ---------- */
function renderUnit(u, links) {
  return '<div class="unit-head" style="--c:' + u.color + '">' +
    '<span class="unit-emoji">' + u.emoji + '</span>' +
    '<div><h1>' + esc(u.no) + ' · ' + esc(u.name) + '</h1>' +
    '<p>' + esc(u.intro) + '</p>' +
    '<div class="goal-tags">' + u.goals.map(g => '<span>🎯 ' + esc(g) + '</span>').join('') + '</div></div></div>' +
    u.points.map(p => charCard(p, u.color, links)).join('');
}

/* ---------- 馆前必读 ---------- */
function renderHall() {
  const stageCards = D.hall.stages.map((s, i) =>
    '<article class="stage-timeline" style="--c:' + ['#9a3412', '#8a5a2b', '#b5893a', '#4c8a1f'][i] + '">' +
    '<div class="tl-head"><span class="tl-emoji">' + s.emoji + '</span>' +
    '<div><h3>' + esc(s.name) + '</h3><span class="tl-when">' + esc(s.when) + '</span></div></div>' +
    '<p>' + esc(s.text) + '</p></article>');
  return '<div class="unit-head" style="--c:#9a3412">' +
    '<span class="unit-emoji">🏛️</span>' +
    '<div><h1>馆前必读</h1><p>' + esc(D.hall.lead) + '</p></div></div>' +
    '<article class="hall-card" style="--c:#9a3412">' +
    '<h3>🏛️ ' + esc(D.hall.discovery.title) + '</h3><p>' + esc(D.hall.discovery.text) + '</p></article>' +
    stageCards.join('') +
    '<p class="credit-line">' + esc(D.hall.credit) + '</p>';
}

/* ---------- 六书速查 ---------- */
function renderSixbooks() {
  const cards = D.sixbooks.map(b => {
    const examples = (b.examples || []).map(ch => {
      const hit = POINT_BY_CHAR[ch];
      if (!hit) return '';
      return '<button class="ex-char" data-act="char" data-char="' + esc(ch) + '" style="--c:' + hit.u.color + '" title="到「' + esc(hit.u.name) + '」看这个字">' + esc(ch) + '</button>';
    }).join('');
    return '<article class="book-card" style="--c:#5b21b6">' +
      '<div class="bk-head"><span class="bk-emoji">' + b.emoji + '</span><h3>' + esc(b.name) + '</h3>' + sayBtn(b.name + '。' + b.text) + '</div>' +
      '<p>' + esc(b.text) + '</p>' +
      (examples ? '<div class="bk-examples">' + examples + '</div>' : '') +
      '</article>';
  });
  return '<div class="unit-head" style="--c:#5b21b6">' +
    '<span class="unit-emoji">🧩</span><div><h1>六书速查</h1>' +
    '<p>古人造字的六种办法，馆里的每个字都能归进其中一两类</p></div></div>' +
    '<div class="wgrid">' + cards.join('') + '</div>';
}

/* ---------- 搜索 ---------- */
function searchResults(q) {
  const ql = normPinyin(q);
  const hits = [];
  D.units.forEach(u => u.points.forEach(p => {
    const hay = [p.char, normPinyin(p.pinyin), p.type, p.story, (p.words || []).join(''),
      (p.forms || []).map(f => f.note || '').join('')].join(' ').toLowerCase();
    if (hay.includes(ql)) hits.push({ u, p });
  }));
  if (!hits.length) return '<div class="empty">🏛️ 没有找到「' + esc(q) + '」，试试字、拼音或故事里的词～</div>';
  const links = frameLinks();
  return '<div class="search-head">🔎 找到 ' + hits.length + ' 个字</div>' +
    hits.map(h => charCard(h.p, h.u.color, links)).join('');
}

/* ---------- 渲染 ---------- */
function guessClass() { return heState.guess ? ' guessing' : ''; }

function renderMain() {
  const box = document.getElementById('cards');
  box.className = 'hanzi-cards' + guessClass();
  if (query) { box.innerHTML = searchResults(query); return; }
  if (curView === 'hall') { box.innerHTML = renderHall(); return; }
  if (curView === 'sixbooks') { box.innerHTML = renderSixbooks(); return; }
  const u = HUNIT_BY_ID[curView];
  box.innerHTML = u ? renderUnit(u, frameLinks()) : '';
}

function render() {
  renderChips();
  renderMain();
  renderStats();
  const btn = document.getElementById('guess-toggle');
  if (btn) {
    btn.classList.toggle('on', heState.guess);
    btn.textContent = heState.guess ? '🙈 猜字模式：开' : '🙈 猜字模式：关';
  }
}

/* ---------- 交互 ---------- */
function selectView(id) {
  curView = id;
  if (HUNIT_BY_ID[id]) heState.last = id;
  heSave();
  query = '';
  const search = document.getElementById('search');
  if (search) search.value = '';
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function jumpToChar(ch) {
  const hit = POINT_BY_CHAR[ch];
  if (!hit) return false;
  heSave();
  query = '';
  const search = document.getElementById('search');
  if (search) search.value = '';
  curView = hit.u.id;
  render();
  const card = document.getElementById('char-' + ch);
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('flash');
    setTimeout(() => card.classList.remove('flash'), 2200);
  }
  return true;
}

function toggleLearn(pointId) {
  if (heState.learned[pointId]) delete heState.learned[pointId];
  else heState.learned[pointId] = true;
  heSave();
  render();
}

function toggleGuess() {
  heState.guess = !heState.guess;
  heSave();
  render();
}

function installGuessToggle() {
  const toolbar = document.querySelector('.toolbar');
  if (!toolbar || document.getElementById('guess-toggle')) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'guess-toggle';
  btn.className = 'play-btn guess-btn';
  btn.dataset.act = 'guess';
  btn.setAttribute('aria-pressed', String(!!heState.guess));
  toolbar.insertBefore(btn, toolbar.firstChild);
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  try {
    if (act === 'say') { e.preventDefault(); speak(el.dataset.t); }
    else if (act === 'learn') { e.preventDefault(); toggleLearn(el.dataset.id); }
    else if (act === 'unit') { e.preventDefault(); selectView(el.dataset.id); }
    else if (act === 'reveal') {
      e.preventDefault();
      const card = document.getElementById('char-' + el.dataset.id);
      if (card) card.dataset.revealed = '1';
    }
    else if (act === 'guess') { e.preventDefault(); toggleGuess(); }
    else if (act === 'char') { e.preventDefault(); jumpToChar(el.dataset.char); }
    else if (act === 'print') { e.preventDefault(); window.print(); }
    else if (act === 'home') { e.preventDefault(); window.location.href = 'index.html'; }
  } catch (err) {
    console.error('[汉字演变馆] 操作出错:', err);
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
window.HanziEvolution = {
  get state() { return heState; },
  get view() { return curView; },
  get query() { return query; },
  data: D,
  units: D.units,
  render, selectView, toggleLearn, toggleGuess, jumpToChar, searchResults,
};

installGuessToggle();

/* 深链接：/hanzi-evolution/?char=日 直达该字并高亮 */
const deepChar = new URLSearchParams(location.search).get('char');
if (deepChar && POINT_BY_CHAR[deepChar]) {
  jumpToChar(deepChar);
} else {
  render();
}

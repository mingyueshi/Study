/* ============================================================
   乐学堂 · 汉字演变馆 —— 界面逻辑
   字族切换 / 字卡（四段演变·字理故事·组词·查一查）/
   馆前必读 / 六书速查 / 搜索 / 猜字模式 / 朗读 / 已认全标记 / 打印
   ============================================================ */
'use strict';

HANZI_EVO.units.forEach(unit => {
  unit.points = unit.points.map(window.StudyTopicConnections.lesson);
});

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
const HUNIT_BY_ID = Object.create(null);
D.units.forEach(u => { HUNIT_BY_ID[u.id] = u; });
const POINT_BY_CHAR = Object.create(null);
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

function validView(id) { return !!HUNIT_BY_ID[id] || HEXTRA_VIEWS.some(v => v.id === id); }

const initialView = validView(heState.last) ? heState.last : 'hall';
let curView = initialView;
let currentChar = '';
let query = '';
let renderedUrl = '';

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
function viewChip(view, label, count, done = false) {
  const active = view.id === curView && !query;
  return '<button type="button" class="chip' + (active ? ' on' : '') + '" style="--c:' + view.color + '" data-act="unit" data-id="' + view.id + '"' +
    (active ? ' aria-current="true"' : '') + '><span class="chip-emoji" aria-hidden="true">' + view.emoji + '</span>' +
    '<span class="chip-name">' + esc(label) + '</span><span class="chip-num' + (done ? ' full' : '') + '">' + count + '</span></button>';
}

function renderChips() {
  document.getElementById('chips').innerHTML = D.units.map(u => {
    const learned = u.points.filter(p => heState.learned[p.id]).length;
    return viewChip(u, u.no + ' · ' + u.name, learned + '/' + u.points.length, learned === u.points.length);
  }).join('');
  document.getElementById('hanzi-extras').innerHTML = HEXTRA_VIEWS.map(v => viewChip(v, v.name, v.count)).join('');
}

function charHref(ch) { return '#char-' + encodeURIComponent(ch); }

function renderDirectory() {
  const unit = !query && HUNIT_BY_ID[curView];
  document.getElementById('hanzi-directory').hidden = !unit;
  document.querySelector('[data-act="open-directory"]').hidden = !unit;
  document.querySelector('#hanzi-search-form button').hidden = !query;
  document.getElementById('hanzi-points').innerHTML = unit ? unit.points.map((p, i) => {
    const label = heState.guess ? '第 ' + (i + 1) + ' 字' : p.char + ' · ' + p.pinyin;
    return '<a href="' + charHref(p.char) + '" data-act="char" data-char="' + esc(p.char) + '"' +
      (p.char === currentChar ? ' aria-current="location"' : '') + '>' + esc(label) + ' <span aria-hidden="true">↓</span></a>';
  }).join('') : '';
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
  return '<button type="button" disabled data-evo-stage="' + stage + '" aria-pressed="false" class="stage-cell stage-kind-' + stage + '" style="--c:' + color + '">' +
    '<span class="stage-box">' + body + '</span>' +
    '<span class="stage-name">' + meta.name + '</span>' +
    '<span class="stage-era">' + meta.era + '</span>' +
    (entry.note ? '<span class="stage-note">' + esc(entry.note) + '</span>' : '') +
    '</button>';
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
      cells.push('<button type="button" disabled data-evo-stage="' + stage + '" aria-pressed="false" class="stage-cell stage-missing" style="--c:' + color + '">' +
        '<span class="stage-box"><span class="stage-none">未见于' + STAGE_META[stage].name + '</span></span>' +
        '<span class="stage-name">' + STAGE_META[stage].name + '</span>' +
        '<span class="stage-era">—</span></button>');
    }
    if (stage !== 'kai') cells.push('<span class="stage-arrow" aria-hidden="true">→</span>');
  });
  return '<div class="evo-player"><div class="evo-strip" role="group" aria-label="选择观察的字形阶段">' + cells.join('') + '</div>' +
    '<div class="evo-controls" hidden><div class="evo-buttons">' +
    '<button type="button" data-evo-action="play" aria-pressed="false">顺着看变化</button>' +
    '<button type="button" data-evo-action="previous">← 上一段</button>' +
    '<button type="button" data-evo-action="next">下一段 →</button>' +
    '<button type="button" data-evo-action="reset">回到开头</button></div>' +
    '<p data-evo-status role="status">点一个字形，看看它属于哪个时期。</p><small data-evo-motion-note></small></div></div>';
}

/* ---------- 字卡 ---------- */
function wordChips(p, links) {
  const words = (p.words || []).map(w =>
    '<a class="word-chip" href="' + esc(links.dictionary) + '?q=' + encodeURIComponent(w) + '&scope=chinese" target="_blank" rel="noopener">' + esc(w) + '</a>');
  return words.join('');
}

function charCard(p, color, links, family) {
  const learned = !!heState.learned[p.id];
  const parts = [];
  parts.push('<article class="hanzi-card' + (learned ? ' learned' : '') + '" id="char-' + esc(p.char) + '" tabindex="-1" style="--c:' + color + '">');
  parts.push('<div class="hhead">' +
    '<div class="hchar-block"><span class="hchar">' + esc(p.char) + '</span><span class="hpinyin">' + esc(p.pinyin) + '</span>' +
    '<button class="reveal-btn" data-act="reveal" data-id="' + esc(p.char) + '">👀 揭晓</button></div>' +
    '<div class="hmeta"><div class="hbadges">' +
    '<span class="hbadge type-badge">' + esc(p.type) + '</span>' +
    '<span class="hbadge">' + p.strokes + ' 画</span>' +
    (p.poly ? '<a class="hbadge poly-badge" href="' + esc(links.polyphones) + '?char=' + encodeURIComponent(p.char) + '">多音字 ↗</a>' : '') +
    '</div>' +
    '<div class="htools">' + sayBtn('「' + p.char + '」，' + p.pinyin + '。' + p.story) +
    '<button type="button" class="learn-btn" data-act="learn" data-id="' + esc(p.id) + '" aria-pressed="' + learned + '" aria-label="标记已认全 ' + esc(p.char) + '">' + (learned ? '✓ 已认全' : '标记认全') + '</button></div>' +
    '</div></div>');
  parts.push(evoStrip(p, color));
  parts.push('<div class="hstory"><span class="seclabel">📖 字理小故事</span>' +
    '<p>' + esc(p.story) + '</p></div>');
  parts.push('<div class="hwords"><span class="seclabel">组词</span>' + wordChips(p, links) + '</div>');
  parts.push('<div class="hlinks">' +
    '<a class="hlink" href="' + esc(links.dictionary) + '?q=' + encodeURIComponent(p.char) + '&scope=character" target="_blank" rel="noopener">📖 查字查词 ↗</a>' +
    '<a class="hlink" href="' + esc(links.strokes) + encodeURIComponent(p.char) + '" target="_blank" rel="noopener">✍️ 看笔顺 ↗</a>' +
    (family ? '<a class="hlink" href="' + charHref(p.char) + '" data-act="char" data-char="' + esc(p.char) + '">在「' + esc(family) + '」字族中查看 ↓</a>' : '') +
    '</div>');
  parts.push(window.StudyTopicConnections.references(p.id, '接着学'));
  parts.push('</article>');
  return parts.join('');
}

/* ---------- 字族视图 ---------- */
function renderUnit(u, links) {
  return '<div class="unit-head" style="--c:' + u.color + '">' +
    '<span class="unit-emoji">' + u.emoji + '</span>' +
    '<div><h2>' + esc(u.no) + ' · ' + esc(u.name) + '</h2>' +
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
    '<div><h2>馆前必读</h2><p>' + esc(D.hall.lead) + '</p></div></div>' +
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
      return '<a class="ex-char" href="' + charHref(ch) + '" data-act="char" data-char="' + esc(ch) + '" style="--c:' + hit.u.color + '" title="到「' + esc(hit.u.name) + '」看这个字">' + esc(ch) + '</a>';
    }).join('');
    return '<article class="book-card" style="--c:#5b21b6">' +
      '<div class="bk-head"><span class="bk-emoji">' + b.emoji + '</span><h3>' + esc(b.name) + '</h3>' + sayBtn(b.name + '。' + b.text) + '</div>' +
      '<p>' + esc(b.text) + '</p>' +
      (examples ? '<div class="bk-examples">' + examples + '</div>' : '') +
      '</article>';
  });
  return '<div class="unit-head" style="--c:#5b21b6">' +
    '<span class="unit-emoji">🧩</span><div><h2>六书速查</h2>' +
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
  if (!hits.length) return '<div class="empty">没有找到「' + esc(q) + '」。试试汉字、拼音或故事里的词。</div>';
  const links = frameLinks();
  return '<h2 class="search-head">找到 ' + hits.length + ' 个字</h2>' +
    hits.map(h => charCard(h.p, h.u.color, links, h.u.name)).join('');
}

/* ---------- 渲染 ---------- */
function renderMain() {
  window.HanziEvolutionPlayer?.dispose();
  const box = document.getElementById('cards');
  box.classList.add('hanzi-cards');
  box.classList.toggle('guessing', heState.guess);
  if (query) box.innerHTML = searchResults(query);
  else if (curView === 'hall') box.innerHTML = renderHall();
  else if (curView === 'sixbooks') box.innerHTML = renderSixbooks();
  else {
    const u = HUNIT_BY_ID[curView];
    box.innerHTML = u ? renderUnit(u, frameLinks()) : '';
  }
  window.HanziEvolutionPlayer?.mount(box);
}

function render() {
  renderChips();
  renderDirectory();
  renderMain();
  renderStats();
  renderGuessToggle();
}

function renderGuessToggle() {
  const btn = document.getElementById('guess-toggle');
  btn.setAttribute('aria-pressed', String(heState.guess));
  btn.textContent = heState.guess ? '猜字模式：开' : '猜字模式：关';
}

/* ---------- 交互 ---------- */
function focusReading(target) {
  document.querySelector('.hanzi-workspace[data-sl-mode="compact"][data-sl-open="true"] .sl-toggle:not(.sl-collapse)')?.click();
  target.setAttribute('tabindex', '-1');
  target.scrollIntoView({ block: 'start', behavior: 'instant' });
  target.focus({ preventScroll: true });
}

function openDirectory() {
  document.querySelector(
    '.hanzi-workspace[data-sl-mode="compact"][data-sl-open="false"] .sl-toggle:not(.sl-collapse), ' +
    '.hanzi-workspace[data-sl-mode="wide"][data-sl-collapsed="true"] .sl-collapse'
  )?.click();
  const directory = document.getElementById('hanzi-directory');
  directory.open = true;
  const summary = directory.querySelector('summary');
  window.requestAnimationFrame(() => {
    summary.scrollIntoView({ block: 'nearest' });
    summary.focus({ preventScroll: true });
  });
}

function showView(id, ch = '') {
  curView = id;
  currentChar = ch;
  query = '';
  document.getElementById('search').value = '';
  document.getElementById(HUNIT_BY_ID[id] ? 'hanzi-families' : 'hanzi-reference').open = true;
  render();
  const target = ch ? document.getElementById('char-' + ch) : document.querySelector('#cards .unit-head h2');
  focusReading(target);
}

function navigate(id, ch = '') {
  const url = new URL(window.location.href);
  if (url.searchParams.has('char')) url.searchParams.delete('char');
  url.hash = ch ? charHref(ch) : '#view-' + id;
  if (url.href !== window.location.href) window.history.pushState(null, '', url);
  renderedUrl = window.location.href;
  if (HUNIT_BY_ID[id]) {
    heState.last = id;
    heSave();
  }
  showView(id, ch);
}

function selectView(id) {
  if (validView(id)) navigate(id);
}

function jumpToChar(ch) {
  const hit = POINT_BY_CHAR[ch];
  if (hit) navigate(hit.u.id, ch);
  return !!hit;
}

function toggleLearn(pointId) {
  const learned = !heState.learned[pointId];
  if (learned) heState.learned[pointId] = true;
  else delete heState.learned[pointId];
  heSave();
  renderChips();
  renderStats();
  const button = document.querySelector('#cards [data-act="learn"][data-id="' + CSS.escape(pointId) + '"]');
  if (button) {
    button.closest('.hanzi-card').classList.toggle('learned', learned);
    button.setAttribute('aria-pressed', String(learned));
    button.textContent = learned ? '✓ 已认全' : '标记认全';
  }
}

function toggleGuess() {
  heState.guess = !heState.guess;
  heSave();
  const cards = document.getElementById('cards');
  cards.classList.toggle('guessing', heState.guess);
  cards.querySelectorAll('[data-revealed]').forEach(card => card.removeAttribute('data-revealed'));
  renderGuessToggle();
  renderDirectory();
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
    else if (act === 'char' && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      jumpToChar(el.dataset.char);
    }
    else if (act === 'open-directory') openDirectory();
    else if (act === 'print') { e.preventDefault(); window.print(); }
  } catch (err) {
    console.error('[汉字演变馆] 操作出错:', err);
  }
});

document.addEventListener('input', e => {
  if (e.target && e.target.id === 'search') {
    query = e.target.value.trim();
    renderChips();
    renderDirectory();
    renderMain();
  }
});

document.getElementById('hanzi-search-form').addEventListener('submit', event => {
  event.preventDefault();
  if (query) focusReading(document.getElementById('cards'));
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

/* 原有 ?char=日 与新目录书签均直接定位字卡。 */
function syncLocation(initial = false) {
  const url = new URL(window.location.href);
  if (url.href === renderedUrl) return;
  renderedUrl = url.href;
  let hash = url.hash;
  try { hash = decodeURIComponent(hash); } catch { /* 无效片段保留浏览器行为 */ }
  const view = hash.startsWith('#view-') ? hash.slice(6) : '';
  const char = hash.startsWith('#char-') ? hash.slice(6) : '';
  const oldChar = url.searchParams.get('char');
  const linkedChar = (initial || !hash) && POINT_BY_CHAR[oldChar] ? oldChar : '';
  const targetChar = POINT_BY_CHAR[char] ? char : linkedChar;
  if (validView(view)) showView(view);
  else if (targetChar) showView(POINT_BY_CHAR[targetChar].u.id, targetChar);
  else if (initial) {
    document.getElementById(HUNIT_BY_ID[curView] ? 'hanzi-families' : 'hanzi-reference').open = true;
    render();
  } else if (!hash) showView(initialView);
}

document.addEventListener('DOMContentLoaded', () => syncLocation(true));
window.addEventListener('popstate', () => syncLocation());
window.addEventListener('hashchange', () => syncLocation());

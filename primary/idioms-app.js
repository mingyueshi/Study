/* ============================================================
   乐学堂 · 成语本 —— 界面逻辑
   分类切换 / 印章卡片 / 逐字点读 / 典故例句点读 / 连读 / 已掌握标记
   ============================================================ */
'use strict';

const IDIOM_STORE_KEY = 'idiombook_v1';

/* ---------- 学习档案 ---------- */
let ibState = { learned: {}, lastUnit: null, sound: true };
try {
  const raw = localStorage.getItem(IDIOM_STORE_KEY);
  if (raw) ibState = { ...{ learned: {}, lastUnit: null, sound: true }, ...JSON.parse(raw) };
} catch (e) { /* 仅用内存状态 */ }
function ibSave() { try { localStorage.setItem(IDIOM_STORE_KEY, JSON.stringify(ibState)); } catch (e) {} }

/* ---------- 索引与视图状态 ---------- */
const IDIOM_INDEX = {};   // 成语 -> { ...成语记录, unit }
IDIOM_UNITS.forEach(u => u.idioms.forEach(w => { if (!IDIOM_INDEX[w.idiom]) IDIOM_INDEX[w.idiom] = { ...w, unit: u }; }));

let curUnit = IDIOM_UNITS.some(u => u.id === ibState.lastUnit) ? ibState.lastUnit : IDIOM_UNITS[0].id;
let query = '';
let playTimer = null;
let playing = false;

function unitById(id) { return IDIOM_UNITS.find(u => u.id === id); }
function unitLearned(u) { return u.idioms.filter(w => ibState.learned[w.idiom]).length; }
function totalIdioms() { return IDIOM_UNITS.reduce((n, u) => n + u.idioms.length, 0); }
function totalLearned() { return Object.keys(ibState.learned).length; }

/* ---------- 朗读（中文自动走中文发音人） ---------- */
function speak(text, rate) {
  if (!window.SpeechKit) return;
  SpeechKit.speak(text, { rate: rate || 0.85 });
}

/* ---------- 渲染 ---------- */
function esc(s) {
  return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function renderChips() {
  document.getElementById('chips').innerHTML = IDIOM_UNITS.map(u => {
    const n = unitLearned(u);
    const done = n === u.idioms.length;
    return '<button class="chip' + (u.id === curUnit && !query ? ' on' : '') + '" style="--c:' + u.color + '" data-act="unit" data-id="' + u.id + '">' +
      '<span class="chip-emoji">' + u.emoji + '</span><span class="chip-name">' + u.name + '</span>' +
      '<span class="chip-num' + (done ? ' full' : '') + '">' + n + '/' + u.idioms.length + '</span></button>';
  }).join('');
}

/* 近反义成语的中文解释：书内取其 zh，书外查 IDIOM_ZH */
function idiomZh(id) {
  const inBook = IDIOM_INDEX[id];
  const zh = inBook ? inBook.zh : (typeof IDIOM_ZH !== 'undefined' ? IDIOM_ZH[id] : '');
  return zh || '拓展成语';
}

function relPills(list) {
  return (list || []).map(r => {
    const inBook = !!IDIOM_INDEX[r];
    return '<button class="rel' + (inBook ? ' inbook' : '') + '" data-act="say" data-t="' + esc(r) + '">' +
      '<b>' + esc(r) + '</b><i>' + esc(idiomZh(r)) + (inBook ? ' <span class="rel-book">📖</span>' : '') + '</i></button>';
  }).join('');
}

function cardHTML(w, u, showUnitTag) {
  const learned = !!ibState.learned[w.idiom];
  const chars = (w.chars || []).map(c =>
    '<button class="part" data-act="say" data-t="' + esc(c.t) + '"><b>' + esc(c.t) + '</b><i>' + esc(c.d) + '</i></button>'
  ).join('<span class="plus">＋</span>');

  const storyText = (w.story || '') + (w.source ? '（' + w.source + '）' : '');
  const story = storyText.trim()
    ? '<button class="story" data-act="say" data-t="' + esc(storyText) + '">📜 ' + esc(storyText) + '　🔊</button>'
    : '';
  const example = w.example
    ? '<div class="wsec"><span class="seclabel">例</span><div class="example-line">' +
      '<button class="example" data-act="say" data-t="' + esc(w.example) + '">' + esc(w.example) + ' 🔊</button></div></div>'
    : '';
  const synRow = (w.syn && w.syn.length)
    ? '<div class="wsec"><span class="seclabel">近</span><div class="rels">' + relPills(w.syn) + '</div></div>' : '';
  const antRow = (w.ant && w.ant.length)
    ? '<div class="wsec"><span class="seclabel">反</span><div class="rels">' + relPills(w.ant) + '</div></div>' : '';

  return '<article class="wcard' + (learned ? ' learned' : '') + '" style="--c:' + u.color + '" data-id="' + esc(w.idiom) + '">' +
    (showUnitTag ? '<span class="unit-tag" style="background:' + u.color + '">' + u.emoji + ' ' + esc(u.name) + '</span>' : '') +
    '<button class="learn-btn' + (learned ? ' on' : '') + '" data-act="learn" data-id="' + esc(w.idiom) + '" title="标记已掌握">' + (learned ? '✓' : '') + '</button>' +
    '<div class="wtop">' +
      '<button class="pic seal" data-act="say" data-t="' + esc(w.idiom) + '"><span class="seal-char">' + esc(w.idiom[0]) + '</span></button>' +
      '<div class="winfo">' +
        '<div class="wline"><span class="idiom">' + esc(w.idiom) + '</span>' +
        '<button class="say" data-act="say" data-t="' + esc(w.idiom) + '">🔊</button></div>' +
        '<div class="pinyin">' + esc(w.pinyin) + '</div>' +
        '<div class="zh">' + esc(w.zh) + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="wsec"><span class="seclabel">记</span><div class="parts">' + chars + '</div></div>' +
    story +
    example +
    synRow + antRow +
    '</article>';
}

function renderCards() {
  const box = document.getElementById('cards');
  if (query) {
    const q = query.toLowerCase();
    const hits = [];
    IDIOM_UNITS.forEach(u => u.idioms.forEach(w => {
      const hay = (w.idiom + w.pinyin + w.zh + (w.story || '')).toLowerCase();
      if (hay.includes(q) || u.name.includes(query)) hits.push({ w, u });
    }));
    if (!hits.length) {
      box.innerHTML = '<div class="empty">🏮 没有找到「' + esc(query) + '」，换个词试试～</div>';
      return;
    }
    box.innerHTML = '<div class="search-head">🔎 找到 ' + hits.length + ' 条成语</div>' +
      '<div class="wgrid">' + hits.map(h => cardHTML(h.w, h.u, true)).join('') + '</div>';
    return;
  }
  const u = unitById(curUnit);
  if (!u) { box.innerHTML = ''; return; }
  box.innerHTML =
    '<div class="unit-head" style="--c:' + u.color + '">' +
      '<span class="unit-emoji">' + u.emoji + '</span>' +
      '<div><h2>' + esc(u.name) + '</h2>' +
      '<p>已掌握 ' + unitLearned(u) + ' / ' + u.idioms.length + ' 条 · 点印章或 🔊 听读音，逐字、典故、例句都能点读</p></div>' +
    '</div>' +
    '<div class="wgrid">' + u.idioms.map(w => cardHTML(w, u, false)).join('') + '</div>';
}

function renderStats() {
  const el = document.getElementById('stats');
  if (el) el.textContent = '已掌握 ' + totalLearned() + ' / ' + totalIdioms();
}

function render() {
  renderChips();
  renderCards();
  renderStats();
  const playBtn = document.getElementById('playBtn');
  if (playBtn) playBtn.textContent = playing ? '⏹ 停止连读' : '▶️ 连读本单元';
}

/* ---------- 交互 ---------- */
function toggleLearn(id) {
  if (ibState.learned[id]) delete ibState.learned[id];
  else { ibState.learned[id] = true; speak('Great!', 0.9); }
  ibSave();
  render();
}

function stopPlay() {
  playing = false;
  if (playTimer) { clearTimeout(playTimer); playTimer = null; }
  try { speechSynthesis.cancel(); } catch (e) {}
  document.querySelectorAll('.wcard.playing').forEach(el => el.classList.remove('playing'));
  const playBtn = document.getElementById('playBtn');
  if (playBtn) playBtn.textContent = '▶️ 连读本单元';
}

function playUnit() {
  if (playing) { stopPlay(); return; }
  const u = unitById(curUnit);
  if (!u || !u.idioms.length) return;
  playing = true;
  const playBtn = document.getElementById('playBtn');
  if (playBtn) playBtn.textContent = '⏹ 停止连读';
  let i = 0;
  const step = () => {
    if (!playing) return;
    if (i >= u.idioms.length) { stopPlay(); return; }
    const w = u.idioms[i];
    document.querySelectorAll('.wcard.playing').forEach(el => el.classList.remove('playing'));
    const card = document.querySelector('.wcard[data-id="' + w.idiom.replace(/"/g, '\\"') + '"]');
    if (card) {
      card.classList.add('playing');
      card.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    speak(w.idiom + '，' + w.zh, 0.85);
    i++;
    playTimer = setTimeout(step, 5000);
  };
  step();
}

function selectUnit(id) {
  curUnit = id;
  ibState.lastUnit = id;
  ibSave();
  query = '';
  const search = document.getElementById('search');
  if (search) search.value = '';
  stopPlay();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  try {
    if (act === 'say') { e.preventDefault(); speak(el.dataset.t); }
    else if (act === 'learn') { e.preventDefault(); toggleLearn(el.dataset.id); }
    else if (act === 'unit') { e.preventDefault(); selectUnit(el.dataset.id); }
    else if (act === 'play') { e.preventDefault(); playUnit(); }
    else if (act === 'home') { e.preventDefault(); stopPlay(); window.location.href = 'index.html'; }
    else if (act === 'words') { e.preventDefault(); stopPlay(); window.location.href = 'words.html'; }
  } catch (err) {
    console.error('[成语本] 操作出错:', err);
  }
});

document.addEventListener('input', e => {
  if (e.target && e.target.id === 'search') {
    query = e.target.value.trim();
    renderCards();
  }
});

window.addEventListener('beforeunload', stopPlay);

/* 供自动化测试使用 */
window.Idioms = {
  get state() { return ibState; },
  get unit() { return curUnit; },
  get query() { return query; },
  index: IDIOM_INDEX,
  units: IDIOM_UNITS,
  render, selectUnit, toggleLearn, playUnit, stopPlay,
};

render();

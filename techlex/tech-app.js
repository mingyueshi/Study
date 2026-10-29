/* ============================================================
   TechLex · 计算机英语 —— 界面逻辑
   分类切换 / 术语卡 / 构词与例句点读 / 连读 / 已掌握标记 / 搜索
   ============================================================ */
'use strict';

const TECH_STORE_KEY = 'techlex_v1';

/* ---------- 学习档案 ---------- */
let tlState = { learned: {}, lastUnit: null, sound: true };
try {
  const raw = localStorage.getItem(TECH_STORE_KEY);
  if (raw) tlState = { ...{ learned: {}, lastUnit: null, sound: true }, ...JSON.parse(raw) };
} catch (e) { /* 仅用内存状态 */ }
function tlSave() { try { localStorage.setItem(TECH_STORE_KEY, JSON.stringify(tlState)); } catch (e) {} }

/* ---------- 索引与视图状态 ---------- */
const TECH_INDEX = {};   // term -> { ...术语, unit }
TECH_UNITS.forEach(u => u.terms.forEach(w => { if (!TECH_INDEX[w.term]) TECH_INDEX[w.term] = { ...w, unit: u }; }));

let curUnit = TECH_UNITS.some(u => u.id === tlState.lastUnit) ? tlState.lastUnit : TECH_UNITS[0].id;
let query = '';
let playTimer = null;
let playing = false;

function unitById(id) { return TECH_UNITS.find(u => u.id === id); }
function unitLearned(u) { return u.terms.filter(w => tlState.learned[w.term]).length; }
function totalTerms() { return TECH_UNITS.reduce((n, u) => n + u.terms.length, 0); }
function totalLearned() { return Object.keys(tlState.learned).length; }

/* ---------- 朗读 ---------- */
function speak(text, rate) {
  if (!tlState.sound || !window.SpeechKit) return;
  SpeechKit.speak(text, { rate: rate || 0.88 });
}
function sayTerm(w) {
  const t = (w && w.say) ? w.say : (w && w.term) || '';
  SpeechKit.speak(t, { rate: 0.82 });
}

/* ---------- 渲染 ---------- */
function esc(s) {
  return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function renderChips() {
  document.getElementById('chips').innerHTML = TECH_UNITS.map(u => {
    const n = unitLearned(u);
    const done = n === u.terms.length;
    return '<button class="chip' + (u.id === curUnit && !query ? ' on' : '') + '" style="--c:' + u.color + '" data-act="unit" data-id="' + u.id + '">' +
      '<span class="chip-emoji">' + esc(u.emoji) + '</span><span class="chip-name">' + esc(u.name) + '</span>' +
      '<span class="chip-num' + (done ? ' full' : '') + '">' + n + '/' + u.terms.length + '</span></button>';
  }).join('');
}

/* 关联术语的中文解释：书内取其 zh，书外查 TECH_ZH */
function techZh(term) {
  const inBook = TECH_INDEX[term];
  const zh = inBook ? inBook.zh : (typeof TECH_ZH !== 'undefined' ? TECH_ZH[term] : '');
  return zh || '拓展术语';
}

function metaLine(w) {
  if (w.abbr) return '<span class="meta">' + esc(w.abbr) + '</span>';
  return '<span class="meta">' + esc(w.ipa || '') + '</span>';
}

function cardHTML(w, u, showUnitTag) {
  const learned = !!tlState.learned[w.term];
  const parts = (w.parts || []).map(p =>
    '<button class="part" data-act="say" data-t="' + esc(p.say || p.t) + '"><b>' + esc(p.t) + '</b><i>' + esc(p.d) + '</i></button>'
  ).join('<span class="plus">+</span>');
  const related = (w.related || []).map(r => {
    const inBook = !!TECH_INDEX[r];
    return '<button class="rel' + (inBook ? ' inbook' : '') + '" data-act="say" data-t="' + esc(r) + '">' +
      '<b>' + esc(r) + '</b><i>' + esc(techZh(r)) + (inBook ? ' <span class="rel-book">◆</span>' : '') + '</i></button>';
  }).join('');

  return '<article class="tcard wcard' + (learned ? ' learned' : '') + '" style="--c:' + u.color + '" data-term="' + esc(w.term) + '">' +
    (showUnitTag ? '<span class="unit-tag">' + esc(u.name) + '</span>' : '') +
    '<button class="learn-btn' + (learned ? ' on' : '') + '" data-act="learn" data-term="' + esc(w.term) + '" title="标记已掌握" aria-label="已掌握 ' + esc(w.term) + '" aria-pressed="' + learned + '">✓</button>' +
    '<div class="wtop">' +
      '<div class="winfo">' +
        '<div class="wline"><span class="word">' + esc(w.term) + '</span>' +
        '<button class="say" data-act="sayTerm" data-term="' + esc(w.term) + '" aria-label="朗读 ' + esc(w.term) + '">🔊</button>' +
        (w.abbr ? '<span class="chip-tag">缩写</span>' : '') + '</div>' +
        metaLine(w) +
        '<div class="zh">' + esc(w.zh) + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="wsec"><span class="seclabel">构词</span><div class="parts">' + parts + '</div></div>' +
    '<div class="wsec"><span class="seclabel">例句</span><div class="example-line">' +
      '<button class="example" data-act="say" data-t="' + esc(w.example) + '">' + esc(w.example) + '</button>' +
      '<button class="example example-zh" data-act="say" data-t="' + esc(w.exampleZh) + '">' + esc(w.exampleZh) + '</button>' +
    '</div></div>' +
    '<div class="wsec"><span class="seclabel">关联</span><div class="rels">' + related + '</div></div>' +
    '</article>';
}

function renderCards() {
  const box = document.getElementById('cards');
  if (query) {
    const q = query.toLowerCase();
    const hits = [];
    TECH_UNITS.forEach(u => u.terms.forEach(w => {
      const hay = (w.term + ' ' + (w.abbr || '') + ' ' + w.zh + ' ' + w.example + ' ' + w.exampleZh).toLowerCase();
      if (hay.includes(q) || u.name.includes(query)) hits.push({ w, u });
    }));
    if (!hits.length) {
      box.innerHTML = '<div class="empty">没有找到「' + esc(query) + '」——试试英文术语、中文释义或例句里的词。</div>';
      return;
    }
    box.innerHTML = '<div class="search-head">找到 ' + hits.length + ' 个术语</div>' +
      '<div class="wgrid">' + hits.map(h => cardHTML(h.w, h.u, true)).join('') + '</div>';
    return;
  }
  const u = unitById(curUnit);
  if (!u) { box.innerHTML = ''; return; }
  box.innerHTML =
    '<div class="unit-head" style="--c:' + u.color + '">' +
      '<span class="unit-emoji">' + esc(u.emoji) + '</span>' +
      '<div><h1>' + esc(u.name) + '</h1>' +
      '<p>' + unitLearned(u) + ' / ' + u.terms.length + ' 已掌握 · 术语、构词与例句均可点读</p></div>' +
    '</div>' +
    '<div class="wgrid">' + u.terms.map(w => cardHTML(w, u, false)).join('') + '</div>';
}

function renderStats() {
  const el = document.getElementById('stats');
  if (el) el.textContent = '已掌握 ' + totalLearned() + ' / ' + totalTerms();
}

function render() {
  renderChips();
  renderCards();
  renderStats();
  const playBtn = document.getElementById('playBtn');
  if (playBtn) playBtn.textContent = playing ? '■ 停止连读' : '▶ 连读本单元';
  const sb = document.getElementById('soundBtn');
  if (sb) {
    sb.textContent = tlState.sound ? '🔊' : '🔇';
    sb.setAttribute('aria-label', tlState.sound ? '关闭声音' : '开启声音');
  }
}

/* ---------- 交互 ---------- */
function toggleLearn(term) {
  if (tlState.learned[term]) delete tlState.learned[term];
  else tlState.learned[term] = true;
  tlSave();
  render();
}

function stopPlay() {
  playing = false;
  if (playTimer) { clearTimeout(playTimer); playTimer = null; }
  try { speechSynthesis.cancel(); } catch (e) {}
  document.querySelectorAll('.wcard.playing').forEach(el => el.classList.remove('playing'));
  const playBtn = document.getElementById('playBtn');
  if (playBtn) playBtn.textContent = '▶ 连读本单元';
}

function playUnit() {
  if (playing) { stopPlay(); return; }
  const u = unitById(curUnit);
  if (!u || !u.terms.length) return;
  playing = true;
  const playBtn = document.getElementById('playBtn');
  if (playBtn) playBtn.textContent = '■ 停止连读';
  let i = 0;
  const step = () => {
    if (!playing) return;
    if (i >= u.terms.length) { stopPlay(); return; }
    const w = u.terms[i];
    document.querySelectorAll('.wcard.playing').forEach(el => el.classList.remove('playing'));
    const card = document.querySelector('.wcard[data-term="' + w.term.replace(/"/g, '\\"') + '"]');
    if (card) {
      card.classList.add('playing');
      card.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    const spoken = (w.say || w.term) + '。' + w.zh;
    SpeechKit.speak(spoken, { rate: 0.9 });
    i++;
    playTimer = setTimeout(step, 3600);
  };
  step();
}

function selectUnit(id) {
  curUnit = id;
  tlState.lastUnit = id;
  tlSave();
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
    if (act === 'home') { e.preventDefault(); selectUnit(TECH_UNITS[0].id); }
    else if (act === 'say') { e.preventDefault(); speak(el.dataset.t, 0.88); }
    else if (act === 'sayTerm') { e.preventDefault(); sayTerm(TECH_INDEX[el.dataset.term]); }
    else if (act === 'learn') { e.preventDefault(); toggleLearn(el.dataset.term); }
    else if (act === 'unit') { e.preventDefault(); selectUnit(el.dataset.id); }
    else if (act === 'play') { e.preventDefault(); playUnit(); }
    else if (act === 'toggleSound') { e.preventDefault(); tlState.sound = !tlState.sound; tlSave(); render(); }
    else if (act === 'primary') { e.preventDefault(); stopPlay(); window.location.href = '../primary/index.html'; }
  } catch (err) {
    console.error('[TechLex] 操作出错:', err);
  }
});

document.addEventListener('input', e => {
  if (e.target && e.target.id === 'search') {
    query = e.target.value.trim();
    renderChips();
    renderCards();
  }
});

window.addEventListener('beforeunload', stopPlay);

/* 供自动化测试使用 */
window.TechLex = {
  get state() { return tlState; },
  get unit() { return curUnit; },
  get query() { return query; },
  index: TECH_INDEX,
  units: TECH_UNITS,
  render, selectUnit, toggleLearn, playUnit, stopPlay,
};

render();

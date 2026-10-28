/* ============================================================
   乐学堂 · 单词本 —— 界面逻辑
   单元切换 / 大图卡片 / 拆分点读 / 相关词点读 / 连读 / 已掌握标记
   ============================================================ */
'use strict';

const WORD_STORE_KEY = 'wordbook_v1';

/* ---------- 学习档案 ---------- */
let wbState = { learned: {}, lastUnit: null, sound: true };
try {
  const raw = localStorage.getItem(WORD_STORE_KEY);
  if (raw) wbState = { ...{ learned: {}, lastUnit: null, sound: true }, ...JSON.parse(raw) };
} catch (e) { /* 仅用内存状态 */ }
function wbSave() { try { localStorage.setItem(WORD_STORE_KEY, JSON.stringify(wbState)); } catch (e) {} }

/* ---------- 索引与视图状态 ---------- */
const WORD_INDEX = {};   // en -> { ...word, unit }
WORD_UNITS.forEach(u => u.words.forEach(w => { if (!WORD_INDEX[w.en]) WORD_INDEX[w.en] = { ...w, unit: u }; }));

let curUnit = WORD_UNITS.some(u => u.id === wbState.lastUnit) ? wbState.lastUnit : WORD_UNITS[0].id;
let query = '';
let playTimer = null;
let playing = false;

function unitById(id) { return WORD_UNITS.find(u => u.id === id); }
function unitLearned(u) { return u.words.filter(w => wbState.learned[w.en]).length; }
function totalWords() { return WORD_UNITS.reduce((n, u) => n + u.words.length, 0); }
function totalLearned() { return Object.keys(wbState.learned).length; }

/* ---------- 朗读（统一走 speech.js，自动挑最优发音人） ---------- */
function speak(text, lang, rate) {
  if (!window.SpeechKit) return;
  SpeechKit.speak(text, { rate: rate || 0.85 });
}

function sayWord(en) {
  const rec = WORD_INDEX[en];
  SpeechKit.speak(rec ? rec.en : en, { rate: 0.8 });
}

/* ---------- 渲染 ---------- */
function renderChips() {
  document.getElementById('chips').innerHTML = WORD_UNITS.map(u => {
    const n = unitLearned(u);
    const done = n === u.words.length;
    return '<button class="chip' + (u.id === curUnit && !query ? ' on' : '') + '" style="--c:' + u.color + '" data-act="unit" data-id="' + u.id + '">' +
      '<span class="chip-emoji">' + u.emoji + '</span><span class="chip-name">' + u.zh + '</span>' +
      '<span class="chip-num' + (done ? ' full' : '') + '">' + n + '/' + u.words.length + '</span></button>';
  }).join('');
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function picHTML(w) {
  if (w.img) return '<img class="pic-img" src="' + esc(w.img) + '" alt="' + esc(w.en) + '">';
  if (w.emoji) return '<span class="pic-emoji">' + w.emoji + '</span>';
  const letters = esc(w.en.split(' ')[0].slice(0, 2));
  return '<span class="pic-fallback">' + letters + '</span>';
}

/* 相关词的中文解释：书内词取其 zh（去掉词性前缀），书外词查 WORD_ZH */
function shortZh(zh) {
  return String(zh || '').replace(/^(n|adj|adv|v|prep|num|pron|conj|interj)\.\s*/, '');
}
function relatedZh(en) {
  const inBook = WORD_INDEX[en];
  return shortZh(inBook ? inBook.zh : (typeof WORD_ZH !== 'undefined' ? WORD_ZH[en] : '')) || '拓展词';
}

function cardHTML(w, u, showUnitTag) {
  const learned = !!wbState.learned[w.en];
  const parts = (w.parts || []).map(p =>
    '<button class="part" data-act="say" data-t="' + esc(p.say || p.t) + '"><b>' + esc(p.t) + '</b><i>' + esc(p.d) + '</i></button>'
  ).join('<span class="plus">＋</span>');
  const related = (w.related || []).map(r => {
    const inBook = !!WORD_INDEX[r];
    return '<button class="rel' + (inBook ? ' inbook' : '') + '" data-act="say" data-t="' + esc(r) + '">' +
      '<b>' + esc(r) + '</b><i>' + esc(relatedZh(r)) + (inBook ? ' <span class="rel-book">📖</span>' : '') + '</i></button>';
  }).join('');
  return '<article class="wcard' + (learned ? ' learned' : '') + '" style="--c:' + u.color + '" data-en="' + esc(w.en) + '">' +
    (showUnitTag ? '<span class="unit-tag" style="background:' + u.color + '">' + u.emoji + ' ' + esc(u.zh) + '</span>' : '') +
    '<button class="learn-btn' + (learned ? ' on' : '') + '" data-act="learn" data-en="' + esc(w.en) + '" title="标记已掌握">' + (learned ? '✓' : '') + '</button>' +
    '<div class="wtop">' +
      '<button class="pic" data-act="say" data-t="' + esc(w.en) + '">' + picHTML(w) + '</button>' +
      '<div class="winfo">' +
        '<div class="wline"><span class="word">' + esc(w.en) + '</span>' +
        '<button class="say" data-act="say" data-t="' + esc(w.en) + '">🔊</button></div>' +
        '<div class="ipa">' + esc(w.ipa) + '</div>' +
        '<div class="zh">' + esc(w.zh) + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="wsec"><span class="seclabel">记</span><div class="parts">' + parts + '</div></div>' +
    '<div class="memo">💡 ' + esc(w.memo) + '</div>' +
    '<div class="wsec"><span class="seclabel">联</span><div class="rels">' + related + '</div></div>' +
    '</article>';
}

function renderCards() {
  const box = document.getElementById('cards');
  if (query) {
    const q = query.toLowerCase();
    const hits = [];
    WORD_UNITS.forEach(u => u.words.forEach(w => {
      if (w.en.toLowerCase().includes(q) || w.zh.includes(query) || u.zh.includes(query) || u.name.toLowerCase().includes(q)) {
        hits.push({ w, u });
      }
    }));
    if (!hits.length) {
      box.innerHTML = '<div class="empty">🐣 没有找到「' + esc(query) + '」，检查一下拼写，或换个词试试～</div>';
      return;
    }
    box.innerHTML = '<div class="search-head">🔎 找到 ' + hits.length + ' 个单词</div>' +
      '<div class="wgrid">' + hits.map(h => cardHTML(h.w, h.u, true)).join('') + '</div>';
    return;
  }
  const u = unitById(curUnit);
  if (!u) { box.innerHTML = ''; return; }
  box.innerHTML =
    '<div class="unit-head" style="--c:' + u.color + '">' +
      '<span class="unit-emoji">' + u.emoji + '</span>' +
      '<div><h2>' + esc(u.name) + ' · ' + esc(u.zh) + '</h2>' +
      '<p>已掌握 ' + unitLearned(u) + ' / ' + u.words.length + ' 词 · 点图或 🔊 听发音，点拆分和相关词也能读</p></div>' +
    '</div>' +
    '<div class="wgrid">' + u.words.map(w => cardHTML(w, u, false)).join('') + '</div>';
}

function renderStats() {
  const el = document.getElementById('stats');
  if (el) el.textContent = '已掌握 ' + totalLearned() + ' / ' + totalWords();
}

function render() {
  renderChips();
  renderCards();
  renderStats();
  const playBtn = document.getElementById('playBtn');
  if (playBtn) playBtn.textContent = playing ? '⏹ 停止连读' : '▶️ 连读本单元';
}

/* ---------- 交互 ---------- */
function toggleLearn(en) {
  if (wbState.learned[en]) delete wbState.learned[en];
  else { wbState.learned[en] = true; speak('Great!', 'en-US', 0.9); }
  wbSave();
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
  if (!u || !u.words.length) return;
  playing = true;
  const playBtn = document.getElementById('playBtn');
  if (playBtn) playBtn.textContent = '⏹ 停止连读';
  let i = 0;
  const step = () => {
    if (!playing) return;
    if (i >= u.words.length) { stopPlay(); return; }
    const w = u.words[i];
    document.querySelectorAll('.wcard.playing').forEach(el => el.classList.remove('playing'));
    const card = document.querySelector('.wcard[data-en="' + w.en.replace(/"/g, '\\"') + '"]');
    if (card) {
      card.classList.add('playing');
      card.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    speak(w.en, 'en-US', 0.78);
    i++;
    playTimer = setTimeout(step, 2100);
  };
  step();
}

function selectUnit(id) {
  curUnit = id;
  wbState.lastUnit = id;
  wbSave();
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
    if (act === 'say') { e.preventDefault(); sayWord(el.dataset.t); }
    else if (act === 'learn') { e.preventDefault(); toggleLearn(el.dataset.en); }
    else if (act === 'unit') { e.preventDefault(); selectUnit(el.dataset.id); }
    else if (act === 'play') { e.preventDefault(); playUnit(); }
    else if (act === 'home') { e.preventDefault(); stopPlay(); window.location.href = 'index.html'; }
    else if (act === 'idioms') { e.preventDefault(); stopPlay(); window.location.href = 'idioms.html'; }
  } catch (err) {
    console.error('[单词本] 操作出错:', err);
  }
});

document.addEventListener('input', e => {
  if (e.target && e.target.id === 'search') {
    query = e.target.value.trim();
    renderCards();
  }
});

/* ---------- 发音人选择 ---------- */
function populateVoices() {
  const sel = document.getElementById('voiceSel');
  if (!sel || !window.SpeechKit) return;
  const list = SpeechKit.englishVoiceList();
  const cur = SpeechKit.pref || ((SpeechKit.pickVoice('en') || {}).name || '');
  sel.innerHTML = list.length
    ? list.map(v => '<option value="' + esc(v.name) + '"' + (v.name === cur ? ' selected' : '') + '>' +
        esc(v.name) + '（' + esc(v.lang) + '）</option>').join('')
    : '<option value="">系统默认</option>';
}

document.addEventListener('change', e => {
  if (e.target && e.target.id === 'voiceSel' && window.SpeechKit) {
    SpeechKit.setVoicePref(e.target.value);
    SpeechKit.speak('Hello! Nice to meet you.', { rate: 0.9 });
  }
});

if ('speechSynthesis' in window) {
  if (typeof speechSynthesis.addEventListener === 'function') {
    speechSynthesis.addEventListener('voiceschanged', populateVoices);
  } else {
    speechSynthesis.onvoiceschanged = populateVoices;
  }
}

window.addEventListener('beforeunload', stopPlay);

/* 供自动化测试使用 */
window.Words = {
  get state() { return wbState; },
  get unit() { return curUnit; },
  get query() { return query; },
  index: WORD_INDEX,
  units: WORD_UNITS,
  render, selectUnit, toggleLearn, playUnit, stopPlay, populateVoices,
};

populateVoices();
render();

/* ============================================================
   乐学堂 · 教材同步英语 —— 界面逻辑
   上下册单元 / 单词点读 / 单词卡 / 连读 / 搜索 / 掌握记录
   ============================================================ */
'use strict';

const ENGLISH_STORE_KEY = 'english_textbook_v1';
let enState = { learned: {}, lastUnit: null };
try {
  const raw = localStorage.getItem(ENGLISH_STORE_KEY);
  if (raw) enState = { ...{ learned: {}, lastUnit: null }, ...JSON.parse(raw) };
} catch (e) { /* 存储不可用时仅保留当前页面状态 */ }
function enSave() {
  try { localStorage.setItem(ENGLISH_STORE_KEY, JSON.stringify(enState)); } catch (e) {}
}

let curUnit = ENGLISH_UNITS.some(u => u.id === enState.lastUnit) ? enState.lastUnit : ENGLISH_UNITS[0].id;
let query = '';
let playTimer = null;
let playing = false;

function unitById(id) { return ENGLISH_UNITS.find(u => u.id === id); }
function unitLearned(unit) { return unit.words.filter(word => enState.learned[word.key]).length; }
function totalWords() { return ENGLISH_UNITS.reduce((sum, unit) => sum + unit.words.length, 0); }
function totalLearned() { return Object.values(enState.learned).filter(Boolean).length; }
function esc(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function speak(text, rate) {
  if (window.SpeechKit) SpeechKit.speak(text, { rate: rate || 0.82 });
}

function renderChips() {
  let book = '';
  document.getElementById('chips').innerHTML = ENGLISH_UNITS.map(unit => {
    const heading = unit.book !== book ? '<div class="book-label">' + esc(unit.book) + '</div>' : '';
    book = unit.book;
    const learned = unitLearned(unit);
    const done = learned === unit.words.length;
    return heading + '<button class="chip' + (unit.id === curUnit && !query ? ' on' : '') + '" style="--c:' + unit.color + '" data-act="unit" data-id="' + unit.id + '">' +
      '<span class="chip-emoji">' + unit.emoji + '</span><span class="chip-name">' + esc(unit.zh) + '</span>' +
      '<span class="chip-num' + (done ? ' full' : '') + '">' + learned + '/' + unit.words.length + '</span></button>';
  }).join('');
}

function picHTML(word) {
  if (word.emoji) return '<span class="pic-emoji">' + word.emoji + '</span>';
  const letters = esc(word.en.split(' ')[0].slice(0, 2));
  return '<span class="pic-fallback">' + letters + '</span>';
}
function relChipHTML(link) {
  const meta = RELATION_META[link.type] || RELATION_META.group;
  const tag = '<span class="rel-tag">' + meta.tag + '</span>';
  const style = ' style="--rc:' + meta.color + '"';
  if (link.inBook) {
    return '<button class="rel t-' + link.type + '"' + style + ' data-act="rel" data-t="' + esc(link.en) +
      '" title="' + meta.name + '：课内词，点一下听发音"><b>' + esc(link.en) + '</b><i>' + tag + esc(link.zh) + '<span class="rel-book">📖</span></i></button>';
  }
  return '<button class="rel t-' + link.type + '"' + style + ' data-act="say" data-t="' + esc(link.en) +
    '" title="' + meta.name + '：课外拓展词，点一下听发音"><b>' + esc(link.en) + '</b><i>' + tag + esc(link.zh) + '</i></button>';
}
function relLegendHTML() {
  return '<div class="rel-legend"><b>关联词</b>' + RELATION_ORDER.map(type => {
    const meta = RELATION_META[type];
    return '<span class="lg t-' + type + '" style="--rc:' + meta.color + '"><em>' + meta.tag + '</em>' + meta.name + '</span>';
  }).join('') + '<span class="lg-tip">📖 课内词，点一下听发音</span></div>';
}
function phraseHTML(word) {
  const list = word.phrases || [];
  if (!list.length) return '';
  const items = list.map(p =>
    '<button class="phrase" data-act="say" data-t="' + esc(p.en) + '" aria-label="朗读 ' + esc(p.en) + '" title="点一下朗读英文">' +
    '<b>' + esc(p.en) + '</b><i>' + esc(p.zh) + '</i></button>'
  ).join('');
  return '<div class="wsec"><span class="seclabel" title="常见短语与句式，点一下听发音">例</span><div class="phrases">' + items + '</div></div>';
}
function cardHTML(word, unit, showUnitTag) {
  const learned = !!enState.learned[word.key];
  const parts = word.parts.map(part =>
    '<button class="part" data-act="say" data-t="' + esc(part.t) + '" aria-label="跟读 ' + esc(part.t) + '"><b>' + esc(part.t) + '</b><i>' + esc(part.d) + '</i></button>'
  ).join('<span class="plus">＋</span>');
  const related = (word.links || []).map(relChipHTML).join('');
  return '<article class="wcard' + (learned ? ' learned' : '') + '" style="--c:' + unit.color + '" data-key="' + esc(word.key) + '">' +
    (showUnitTag ? '<span class="unit-tag" style="background:' + unit.color + '">' + esc(unit.book + ' · ' + unit.zh) + '</span>' : '') +
    '<button class="learn-btn' + (learned ? ' on' : '') + '" data-act="learn" data-key="' + esc(word.key) + '" title="标记已掌握" aria-label="已掌握 ' + esc(word.en) + '" aria-pressed="' + learned + '">' + (learned ? '✓' : '') + '</button>' +
    '<div class="wtop"><button class="pic" data-act="say" data-t="' + esc(word.en) + '" aria-label="朗读 ' + esc(word.en) + '">' + picHTML(word) + '</button>' +
    '<div class="winfo"><div class="wline"><span class="word">' + esc(word.en) + '</span>' +
    '<button class="say" data-act="say" data-t="' + esc(word.en) + '" aria-label="朗读 ' + esc(word.en) + '">🔊</button></div>' +
    '<div class="ipa">' + esc(word.ipa) + '</div><div class="zh">' + esc(word.zh) + '</div></div></div>' +
    '<div class="wsec"><span class="seclabel">记</span><div class="parts">' + parts + '</div></div>' +
    '<div class="memo">💡 ' + esc(word.memo) + '</div>' +
    phraseHTML(word) +
    '<div class="wsec"><span class="seclabel" title="关联词：相反 / 相近 / 同根 / 组词 / 同类">联</span><div class="rels">' + related + '</div></div></article>';
}
function unitHeadHTML(unit) {
  return '<div class="unit-head" style="--c:' + unit.color + '"><span class="unit-emoji">' + unit.emoji + '</span>' +
    '<div class="unit-main"><h1>' + esc(unit.name) + '</h1><p class="unit-subtitle">' + esc(unit.book + ' · ' + unit.zh) + '</p>' +
    '<p>已掌握 ' + unitLearned(unit) + ' / ' + unit.words.length + ' 条 · 点读发音，拆分记忆</p>' + relLegendHTML() + '</div></div>';
}
function renderCards() {
  const box = document.getElementById('cards');
  if (query) {
    const q = query.toLowerCase();
    const hits = [];
    ENGLISH_UNITS.forEach(unit => unit.words.forEach(word => {
      if (word.en.toLowerCase().includes(q) || word.zh.includes(query) || unit.zh.includes(query) || unit.name.toLowerCase().includes(q) || unit.book.includes(query)) {
        hits.push({ word, unit });
      }
    }));
    box.innerHTML = hits.length
      ? '<div class="search-head">🔎 找到 ' + hits.length + ' 条词汇或短语</div>' + relLegendHTML() +
        '<div class="wgrid">' + hits.map(hit => cardHTML(hit.word, hit.unit, true)).join('') + '</div>'
      : '<div class="empty">🐣 没有找到「' + esc(query) + '」，检查一下拼写，或换个词试试～</div>';
    return;
  }
  const unit = unitById(curUnit);
  if (!unit) { box.innerHTML = ''; return; }
  box.innerHTML = unitHeadHTML(unit) + '<div class="wgrid">' + unit.words.map(word => cardHTML(word, unit, false)).join('') + '</div>' +
    '<p class="textbook-source">词汇与单元顺序依据外研版《英语（新标准）》三年级起点新课标四年级教材整理；中文释义与记忆提示用于辅助学习。</p>';
}
function renderStats() {
  document.getElementById('stats').textContent = '已掌握 ' + totalLearned() + ' / ' + totalWords();
}
function render() {
  renderChips();
  renderCards();
  renderStats();
  document.getElementById('playBtn').textContent = playing ? '⏹ 停止连读' : '▶️ 连读本单元';
}

function toggleLearn(key) {
  if (enState.learned[key]) delete enState.learned[key];
  else { enState.learned[key] = true; speak('Great!', 0.9); }
  enSave();
  render();
}
function stopPlay() {
  playing = false;
  if (playTimer) { clearTimeout(playTimer); playTimer = null; }
  try { speechSynthesis.cancel(); } catch (e) {}
  document.querySelectorAll('.wcard.playing').forEach(el => el.classList.remove('playing'));
  const button = document.getElementById('playBtn');
  if (button) button.textContent = '▶️ 连读本单元';
}
function playUnit() {
  if (playing) { stopPlay(); return; }
  const unit = unitById(curUnit);
  if (!unit || !unit.words.length) return;
  playing = true;
  document.getElementById('playBtn').textContent = '⏹ 停止连读';
  let index = 0;
  const step = () => {
    if (!playing) return;
    if (index >= unit.words.length) { stopPlay(); return; }
    const word = unit.words[index];
    document.querySelectorAll('.wcard.playing').forEach(el => el.classList.remove('playing'));
    const card = Array.from(document.querySelectorAll('.wcard')).find(el => el.dataset.key === word.key);
    if (card) {
      card.classList.add('playing');
      card.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    speak(word.en, 0.78);
    index++;
    playTimer = setTimeout(step, 2200);
  };
  step();
}
/* 点关联词：课内词跳到对应词卡并朗读，跨单元时自动切换单元。 */
function gotoWord(key) {
  const unitId = String(key || '').split(':')[0];
  const unit = unitById(unitId);
  if (!unit) return;
  if (curUnit !== unitId || query) {
    curUnit = unitId;
    enState.lastUnit = unitId;
    enSave();
    query = '';
    const input = document.getElementById('search');
    if (input) input.value = '';
    stopPlay();
    render();
  }
  const word = unit.words.find(item => item.key === key);
  const card = Array.from(document.querySelectorAll('.wcard')).find(el => el.dataset.key === key);
  if (card) {
    card.classList.remove('flash');
    void card.offsetWidth;
    card.classList.add('flash');
    setTimeout(() => card.classList.remove('flash'), 1600);
    card.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  if (word) speak(word.en);
}
function selectUnit(id) {
  if (!unitById(id)) return;
  curUnit = id;
  enState.lastUnit = id;
  enSave();
  query = '';
  document.getElementById('search').value = '';
  stopPlay();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('click', event => {
  const el = event.target.closest('[data-act]');
  if (!el) return;
  const action = el.dataset.act;
  try {
    if (action === 'say') { event.preventDefault(); speak(el.dataset.t); }
    else if (action === 'learn') { event.preventDefault(); toggleLearn(el.dataset.key); }
    else if (action === 'unit') { event.preventDefault(); selectUnit(el.dataset.id); }
    else if (action === 'play') { event.preventDefault(); playUnit(); }
    else if (action === 'rel') { event.preventDefault(); speak(el.dataset.t); }
    else if (action === 'home') { event.preventDefault(); stopPlay(); window.location.href = 'index.html'; }
  } catch (error) { console.error('[教材同步英语] 操作出错:', error); }
});
document.addEventListener('input', event => {
  if (event.target && event.target.id === 'search') {
    query = event.target.value.trim();
    stopPlay();
    renderChips();
    renderCards();
  }
});

function populateVoices() {
  const select = document.getElementById('voiceSel');
  if (!select || !window.SpeechKit) return;
  const list = SpeechKit.englishVoiceList();
  const current = SpeechKit.pref || ((SpeechKit.pickVoice('en') || {}).name || '');
  select.innerHTML = list.length
    ? list.map(voice => '<option value="' + esc(voice.name) + '"' + (voice.name === current ? ' selected' : '') + '>' + esc(voice.name) + '（' + esc(voice.lang) + '）</option>').join('')
    : '<option value="">系统默认</option>';
}
document.addEventListener('change', event => {
  if (event.target && event.target.id === 'voiceSel' && window.SpeechKit) {
    SpeechKit.setVoicePref(event.target.value);
    SpeechKit.speak('Hello! Nice to meet you.', { rate: 0.9 });
  }
});
if ('speechSynthesis' in window) {
  if (typeof speechSynthesis.addEventListener === 'function') speechSynthesis.addEventListener('voiceschanged', populateVoices);
  else speechSynthesis.onvoiceschanged = populateVoices;
}
window.addEventListener('beforeunload', stopPlay);

window.English = {
  get state() { return enState; },
  get unit() { return curUnit; },
  get query() { return query; },
  units: ENGLISH_UNITS,
  render, selectUnit, toggleLearn, playUnit, stopPlay, populateVoices, gotoWord,
};
populateVoices();
render();

/* TechLex · 分类学习 / 全库搜索 / 进度 / 双语点读 */
'use strict';

const TECH_STORE_KEY = 'techlex_v1';
const TECH_INDEX = Object.create(null);
const TECH_ENTRIES = [];
TECH_UNITS.forEach(unit => unit.terms.forEach(w => {
  TECH_INDEX[w.term] = { ...w, unit };
  TECH_ENTRIES.push({ w, u: unit });
}));

// 沿用旧存储键，接收旧入口转交的档案，并保留新位置已掌握的词条。
let tlState = window.LearningProgress.consume(TECH_UNITS);
function tlSave() {
  try { localStorage.setItem(TECH_STORE_KEY, JSON.stringify(tlState)); } catch (e) { /* 内存模式 */ }
}

let curUnit = TECH_UNITS.some(u => u.id === tlState.lastUnit) ? tlState.lastUnit : TECH_UNITS[0].id;
let query = '';
let learningFilter = 'all';
let sortOrder = 'default';
let playing = false;
let playTimer = null;
let playRun = 0;

const $ = id => document.getElementById(id);
const unitById = id => TECH_UNITS.find(u => u.id === id);
const unitLearned = u => u.terms.filter(w => tlState.learned[w.term]).length;
const totalTerms = () => TECH_ENTRIES.length;
const totalLearned = () => TECH_ENTRIES.filter(({ w }) => tlState.learned[w.term]).length;
const soundIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>';
const mutedIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 6 6m0-6-6 6"/></svg>';
const speechAvailable = () => !!(window.SpeechKit && 'speechSynthesis' in window);

function esc(value) {
  return String(value).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
function highlight(value) {
  const text = String(value);
  if (!query) return esc(text);
  const at = text.toLowerCase().indexOf(query.toLowerCase());
  if (at < 0) return esc(text);
  return esc(text.slice(0, at)) + '<mark>' + esc(text.slice(at, at + query.length)) + '</mark>' + esc(text.slice(at + query.length));
}
function baseEntries() {
  if (!query) return TECH_ENTRIES.filter(({ u }) => u.id === curUnit);
  const q = query.toLowerCase();
  return TECH_ENTRIES.filter(({ w, u }) =>
    [w.term, w.abbr || '', w.zh, w.example, w.exampleZh, u.name].join(' ').toLowerCase().includes(q));
}
function visibleEntries() {
  const entries = baseEntries().filter(({ w }) => learningFilter === 'all' ||
    (learningFilter === 'learned' ? !!tlState.learned[w.term] : !tlState.learned[w.term]));
  if (sortOrder === 'alpha') entries.sort((a, b) => a.w.term.localeCompare(b.w.term, 'en', { sensitivity: 'base' }));
  return entries;
}

function speak(text, rate) {
  if (!tlState.sound || !speechAvailable()) return;
  stopPlay();
  window.SpeechKit.speak(text, { rate: rate || 0.88 });
}
function sayTerm(w) { if (w) speak(w.say || w.term, 0.82); }
function techZh(term) { return TECH_INDEX[term] ? TECH_INDEX[term].zh : (TECH_ZH[term] || '拓展术语'); }

function renderChips() {
  $('chips').innerHTML = TECH_UNITS.map((u, i) => {
    const n = unitLearned(u);
    const active = u.id === curUnit && !query;
    return '<button class="chip' + (active ? ' on' : '') + '" style="--c:' + u.color + '" data-act="unit" data-id="' + u.id + '"' + (active ? ' aria-current="true"' : '') + '>' +
      '<span class="chip-emoji" aria-hidden="true">' + esc(u.emoji) + '</span><span class="chip-name">' + esc(u.name) + (i >= 9 ? '<span class="new-dot" aria-label="新增分类"></span>' : '') + '</span>' +
      '<span class="chip-num' + (n === u.terms.length ? ' full' : '') + '">' + n + '<span>/</span>' + u.terms.length + '</span></button>';
  }).join('');
}

function cardHTML(w, u, position) {
  const learned = !!tlState.learned[w.term];
  const parts = w.parts.map(p => '<button class="part" data-act="say" data-t="' + esc(p.say || p.t) + '"><b lang="en">' + esc(p.t) + '</b><i>' + esc(p.d) + '</i></button>').join('<span class="plus" aria-hidden="true">+</span>');
  const related = w.related.map(term => '<button class="rel' + (TECH_INDEX[term] ? ' inbook' : '') + '" data-act="sayRelated" data-term="' + esc(term) + '" title="' + esc(techZh(term)) + '"><b lang="en">' + esc(term) + '</b><i>' + esc(techZh(term)) + '</i></button>').join('');
  return '<article class="tcard wcard' + (learned ? ' learned' : '') + '" style="--c:' + u.color + '" data-term="' + esc(w.term) + '">' +
    '<div class="card-topline"><span class="card-number">' + String(position + 1).padStart(2, '0') + ' <span>/ ' + (query ? esc(u.name) : 'TERM') + '</span></span>' +
    '<button class="learn-btn' + (learned ? ' on' : '') + '" data-act="learn" data-term="' + esc(w.term) + '" title="' + (learned ? '取消掌握标记' : '标记已掌握') + '" aria-label="已掌握 ' + esc(w.term) + '" aria-pressed="' + learned + '"><span aria-hidden="true">✓</span></button></div>' +
    '<div class="wtop"><div class="wline"><h3 class="word" lang="en">' + highlight(w.term) + '</h3><button class="say" data-act="sayTerm" data-term="' + esc(w.term) + '" aria-label="朗读 ' + esc(w.term) + '">' + soundIcon + '</button>' + (w.abbr ? '<span class="chip-tag">缩写</span>' : '') + '</div>' +
    '<p class="meta ' + (w.abbr ? 'abbreviation' : 'phonetic') + '">' + esc(w.abbr || w.ipa) + '</p><p class="zh">' + highlight(w.zh) + '</p></div>' +
    '<div class="wsec"><span class="seclabel">拆词助记</span><div class="parts">' + parts + '</div></div>' +
    '<div class="wsec example-section"><span class="seclabel">工作例句 <span aria-hidden="true">↗</span></span><div class="example-line"><button class="example" lang="en" data-act="say" data-t="' + esc(w.example) + '">' + highlight(w.example) + '</button><button class="example example-zh" data-act="say" data-t="' + esc(w.exampleZh) + '">' + highlight(w.exampleZh) + '</button></div></div>' +
    '<div class="wsec related-section"><span class="seclabel">关联词汇</span><div class="rels">' + related + '</div></div></article>';
}

function renderGuide() {
  const guide = TECH_GUIDES[curUnit];
  $('unitGuide').hidden = !!query;
  if (!guide) return;
  $('guideTitle').textContent = guide.scene + ' · 工作中这样说';
  $('guideContent').innerHTML = '<div class="phrase-list">' + guide.phrases.map((p, i) =>
    '<div class="phrase"><span class="phrase-number">0' + (i + 1) + '</span><div><button lang="en" data-act="say" data-t="' + esc(p.en) + '">' + esc(p.en) + ' <span aria-hidden="true">▷</span></button><p>' + esc(p.zh) + '</p></div></div>').join('') +
    '</div><div class="usage-tip"><p class="tip-label">用词小提醒</p><p>' + esc(guide.tip) + '</p>' +
    (guide.sources ? '<div class="source-links"><span>概念参考</span>' + guide.sources.map(source => '<a href="' + esc(source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(source.title) + ' ↗</a>').join('') + '</div>' : '') + '</div>';
}

function renderOverview() {
  const u = unitById(curUnit);
  const base = baseEntries();
  const learned = base.filter(({ w }) => tlState.learned[w.term]).length;
  $('unitIcon').textContent = query ? '⌕' : u.emoji;
  $('viewKicker').textContent = query ? 'SEARCH THE LIBRARY' : 'COLLECTION ' + String(TECH_UNITS.indexOf(u) + 1).padStart(2, '0');
  $('viewHeading').textContent = query ? '“' + query + '” 的搜索结果' : u.name;
  $('viewDescription').textContent = query ? '在全部 ' + TECH_UNITS.length + ' 个分类中找到 ' + base.length + ' 个术语，可继续按学习状态筛选。' : TECH_GUIDES[curUnit].description;
  $('unitProgress').innerHTML = '<span><b>' + learned + '</b> / ' + base.length + ' 已掌握</span><progress max="' + Math.max(1, base.length) + '" value="' + learned + '" aria-label="当前范围掌握进度"></progress>';
  document.querySelector('.unit-head').style.setProperty('--c', query ? '#a3dfbb' : u.color);
  $('countAll').textContent = base.length;
  $('countLearned').textContent = learned;
  $('countUnlearned').textContent = base.length - learned;
  document.querySelectorAll('.filter-tab').forEach(button => {
    const active = button.dataset.filter === learningFilter;
    button.classList.toggle('on', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $('clearSearch').hidden = !query;
  document.querySelector('.search-shortcut').hidden = !!query;
  renderGuide();
}

function renderCards() {
  const entries = visibleEntries();
  if (!entries.length) {
    const noMatches = query && !baseEntries().length;
    const title = noMatches ? '暂时没有找到这个术语' : learningFilter === 'learned' ? '你的第一个掌握标记，从这里开始' : '这个范围的术语都已掌握';
    const description = noMatches ? '试试更短的英文关键词、中文释义，或例句里的词。' : learningFilter === 'learned' ? '点击术语卡右上角的 ✓，把学会的词留在这里。' : '切换到全部术语，再读一遍例句，巩固一下吧。';
    $('cards').innerHTML = '<div class="empty"><span class="empty-symbol" aria-hidden="true">' + (noMatches ? '⌕' : '✓') + '</span><h3>' + title + '</h3><p>' + description + '</p><button data-act="resetView">' + (noMatches ? '清空搜索' : '查看全部术语') + ' <span aria-hidden="true">↗</span></button></div>';
  } else {
    $('cards').innerHTML = '<div class="wgrid">' + entries.map(({ w, u }, i) => cardHTML(w, u, i)).join('') + '</div>';
  }
  $('listFoot').textContent = entries.length ? '已展示 ' + entries.length + ' 个术语 · 点击发音图标跟读，点击 ✓ 标记掌握' : '';
  $('resultStatus').textContent = (query ? '搜索结果' : unitById(curUnit).name) + '，显示 ' + entries.length + ' 个术语';
  renderPlayback();
}

function renderStats() {
  const n = totalLearned();
  const percentage = Math.round(n / totalTerms() * 100);
  $('stats').textContent = '已掌握 ' + n + ' / ' + totalTerms() + ' 个术语';
  $('progressPercent').textContent = percentage + '%';
  $('totalProgress').value = percentage;
  $('libraryStats').innerHTML = '<span><strong>' + totalTerms() + '</strong> 实用术语</span><span><strong>' + TECH_UNITS.length + '</strong> 工作场景</span><span><strong>' + n + '</strong> 已掌握</span>';
  $('soundBtn').innerHTML = tlState.sound ? soundIcon : mutedIcon;
  $('soundBtn').setAttribute('aria-label', tlState.sound ? '关闭声音' : '开启声音');
  $('soundBtn').setAttribute('aria-pressed', String(tlState.sound));
  $('soundBtn').title = tlState.sound ? '关闭声音' : '开启声音';
  renderVoicePreviewState();
}
function renderVoicePreviewState() {
  document.querySelectorAll('[data-act="previewVoice"]').forEach(button => {
    button.disabled = !tlState.sound || !speechAvailable();
    button.title = !tlState.sound ? '请先在右上角开启声音' : !speechAvailable() ? '当前浏览器不支持语音朗读' : '试听当前发音人与语速';
  });
}
function renderVoiceSettings() {
  const kit = window.SpeechKit;
  if (!kit) return;
  const english = kit.englishVoiceList();
  const chinese = kit.chineseVoiceList();
  const missing = [];
  function options(id, voices, preference, language) {
    const select = $(id);
    const identity = voice => voice.voiceURI || voice.name;
    const distinct = [...new Map(voices.map(voice => [identity(voice), voice])).values()];
    const selected = distinct.find(voice => identity(voice) === preference || voice.name === preference);
    select.innerHTML = '<option value="">自动推荐</option>' + distinct.map(voice => '<option value="' + esc(identity(voice)) + '">' + esc(voice.name + ' · ' + voice.lang + (voice.localService === true ? ' · 本机' : voice.localService === false ? ' · 在线' : '')) + '</option>').join('');
    select.value = selected ? identity(selected) : '';
    select.disabled = !speechAvailable() || !distinct.length;
    if (preference && !selected) missing.push(language);
  }
  options('englishVoice', english, kit.pref, '英语');
  options('chineseVoice', chinese, kit.zhPref, '中文');
  const rate = $('speechRate');
  if (![...rate.options].some(option => Number(option.value) === kit.rate)) {
    const option = document.createElement('option'); option.value = kit.rate; option.textContent = kit.rate + '×（已保存）'; rate.append(option);
  }
  rate.value = String(kit.rate);
  rate.disabled = !speechAvailable();
  $('voiceSummary').textContent = (kit.pref && !missing.includes('英语') ? '英语：' : '自动推荐：') + (kit.chosenEn || '浏览器默认发音') + ' · ' + kit.rate + '×';
  $('voiceAvailability').textContent = !speechAvailable() ? '当前浏览器不支持系统朗读，仍可阅读词汇与例句。' :
    (english.length || chinese.length ? '可选 ' + english.length + ' 个英语、' + chinese.length + ' 个中文发音人。' : '浏览器尚未提供可选发音人，试听将尝试浏览器默认发音。') +
    (missing.length ? '上次的' + missing.join('、') + '发音人当前不可用，已自动回退推荐。' : '') + '语音由当前系统与浏览器提供，设置自动保存在本机。';
  $('voiceSettings').querySelector('[data-act="refreshVoices"]').disabled = !speechAvailable();
  renderVoicePreviewState();
}
function renderPlayback() {
  const button = $('playBtn');
  button.textContent = playing ? '■ 停止连读' : '▶ 连读当前列表';
  button.disabled = !tlState.sound || !speechAvailable() || !visibleEntries().length;
  button.setAttribute('aria-pressed', String(playing));
  button.title = !tlState.sound ? '开启声音后即可连读' : !speechAvailable() ? '当前浏览器不支持语音朗读' : '依次朗读当前筛选结果中的术语与中文释义';
}
function render() { renderChips(); renderOverview(); renderCards(); renderStats(); }

function stopPlay() {
  playing = false;
  playRun++;
  if (playTimer !== null) { clearTimeout(playTimer); playTimer = null; }
  if (window.SpeechKit && window.SpeechKit.stop) window.SpeechKit.stop();
  else if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  document.querySelectorAll('.wcard.playing').forEach(el => el.classList.remove('playing'));
  $('voiceStatus').textContent = '';
  renderPlayback();
}

function toggleLearn(term) {
  if (!TECH_INDEX[term]) return;
  stopPlay();
  const oldEntries = visibleEntries();
  const position = oldEntries.findIndex(({ w }) => w.term === term);
  if (tlState.learned[term]) delete tlState.learned[term];
  else tlState.learned[term] = true;
  tlSave();
  render();
  // 卡片重绘后把键盘焦点留在当前项，筛选移除它时移到相邻卡片。
  const buttons = [...document.querySelectorAll('.learn-btn')];
  const target = buttons.find(button => button.dataset.term === term) || buttons[Math.max(0, Math.min(position, buttons.length - 1))] || document.querySelector('.empty button');
  if (target) target.focus({ preventScroll: true });
}

function playUnit() {
  if (playing) { stopPlay(); return; }
  const entries = visibleEntries();
  if (!tlState.sound || !speechAvailable() || !entries.length) return;
  playing = true;
  const run = ++playRun;
  renderPlayback();
  let position = 0;
  const schedule = callback => { playTimer = setTimeout(() => { if (playing && run === playRun) callback(); }, 450); };
  const step = () => {
    if (!playing || run !== playRun) return;
    if (position >= entries.length) { stopPlay(); return; }
    const { w } = entries[position++];
    document.querySelectorAll('.wcard.playing').forEach(el => el.classList.remove('playing'));
    const card = [...document.querySelectorAll('.wcard')].find(el => el.dataset.term === w.term);
    if (card) {
      card.classList.add('playing');
      card.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
    // 中英文分开读，等待语音结束后再开始下一段，避免定时截断长词释义。
    window.SpeechKit.speak(w.say || w.term, { rate: 0.82, lang: 'en-US', onend: () => {
      if (!playing || run !== playRun) return;
      schedule(() => window.SpeechKit.speak(w.zh, { rate: 0.95, lang: 'zh-CN', onend: () => schedule(step), onerror: stopPlay }));
    }, onerror: stopPlay });
  };
  step();
}

function setSearch(value, focus = false) {
  stopPlay();
  query = value.trim();
  $('search').value = value;
  renderChips();
  renderOverview();
  renderCards();
  if (focus) $('search').focus();
}
function selectUnit(id, scrollToContent = true) {
  if (!unitById(id)) return;
  const directoryFocused = document.activeElement && document.activeElement.matches('.chip');
  stopPlay();
  curUnit = id;
  tlState.lastUnit = id;
  tlSave();
  query = '';
  learningFilter = 'all';
  $('search').value = '';
  $('unitGuide').open = false;
  const compact = window.matchMedia('(max-width: 720px)').matches;
  if (compact) document.querySelector('.category-nav').open = false;
  render();
  if (!compact && directoryFocused) {
    $('chips').querySelector('[data-id="' + id + '"]').focus({ preventScroll: true });
  }
  if (scrollToContent && (compact || window.scrollY > document.querySelector('.unit-head').offsetTop)) {
    document.querySelector('.unit-head').scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
}

document.addEventListener('click', event => {
  const button = event.target.closest('[data-act]');
  if (!button) return;
  const act = button.dataset.act;
  if (act === 'home') {
    selectUnit(TECH_UNITS[0].id, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (act === 'say') speak(button.dataset.t);
  else if (act === 'sayTerm') sayTerm(TECH_INDEX[button.dataset.term]);
  else if (act === 'sayRelated') {
    const term = button.dataset.term;
    if (TECH_INDEX[term]) sayTerm(TECH_INDEX[term]);
    else speak(term);
  } else if (act === 'learn') toggleLearn(button.dataset.term);
  else if (act === 'unit') selectUnit(button.dataset.id);
  else if (act === 'play') playUnit();
  else if (act === 'refreshVoices') {
    window.SpeechKit.refreshVoices();
    $('voiceStatus').textContent = '已刷新系统语音列表。';
  } else if (act === 'previewVoice') {
    if (!tlState.sound || !speechAvailable()) return;
    stopPlay();
    const chinese = button.dataset.lang === 'zh';
    $('voiceStatus').textContent = '正在试听' + (chinese ? '中文' : '英语') + '…';
    window.SpeechKit.speak(chinese ? '每天学习一点，把知识放进实际场景。' : "Hello! Let's learn something new today.", {
      lang: chinese ? 'zh-CN' : 'en-US', rate: .9,
      onend: () => { $('voiceStatus').textContent = '试听结束，可以更换发音人或语速继续比较。'; },
      onerror: () => { $('voiceStatus').textContent = '当前发音暂不可用，请换一个发音人或检查系统语音设置。'; },
    });
  }
  else if (act === 'toggleSound') {
    stopPlay();
    tlState.sound = !tlState.sound;
    tlSave();
    renderStats();
    renderPlayback();
  } else if (act === 'filter') {
    stopPlay();
    learningFilter = button.dataset.filter;
    renderOverview();
    renderCards();
  } else if (act === 'search') setSearch(button.dataset.query, true);
  else if (act === 'clearSearch') setSearch('', true);
  else if (act === 'resetView') {
    if (query && !baseEntries().length) setSearch('', true);
    else { learningFilter = 'all'; renderOverview(); renderCards(); }
  } else if (act === 'guide') {
    if (query) setSearch('');
    $('unitGuide').open = true;
    $('unitGuide').scrollIntoView({ block: 'start', behavior: 'smooth' });
    $('unitGuide').querySelector('summary').focus({ preventScroll: true });
  }
});
document.addEventListener('input', event => {
  if (event.target.id === 'search') setSearch(event.target.value);
});
$('sort').addEventListener('change', event => {
  stopPlay();
  sortOrder = event.target.value;
  renderCards();
});
[['englishVoice', 'en'], ['chineseVoice', 'zh']].forEach(([id, kind]) => {
  $(id).addEventListener('change', event => {
    stopPlay();
    window.SpeechKit.setVoicePref(event.target.value, kind);
    renderVoiceSettings();
    $('voiceStatus').textContent = '已保存' + (kind === 'en' ? '英语' : '中文') + '发音设置，可点击试听。';
  });
});
$('speechRate').addEventListener('change', event => {
  stopPlay();
  window.SpeechKit.setRatePref(event.target.value);
  $('voiceSummary').textContent = $('voiceSummary').textContent.replace(/ · [\d.]+×$/, ' · ' + window.SpeechKit.rate + '×');
  $('voiceStatus').textContent = '已保存语速，点读与连读都会使用这个设置。';
});
document.addEventListener('keydown', event => {
  const typing = event.target.closest('input, textarea, select, [contenteditable="true"]');
  if (event.key === '/' && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    $('search').focus();
  } else if (event.key === 'Escape') {
    stopPlay();
    if (event.target === $('search') && query) setSearch('', true);
  }
});
window.addEventListener('pagehide', stopPlay);

window.TechLex = {
  get state() { return tlState; }, get unit() { return curUnit; }, get query() { return query; },
  get filter() { return learningFilter; }, get playing() { return playing; },
  index: TECH_INDEX, units: TECH_UNITS, render, selectUnit, toggleLearn, playUnit, stopPlay,
};
render();
renderVoiceSettings();
if (window.SpeechKit) window.SpeechKit.onVoicesChanged(renderVoiceSettings);

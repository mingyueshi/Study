/* ============================================================
   乐学堂 · 作文坊 —— 界面逻辑
   分类锦囊 / 范文与点评 / 素材百宝箱 / 灵感抽签 / 我的作文本
   ============================================================ */
'use strict';

const WRITING_STORE_KEY = 'writingbook_v1';
const WRITING_AUTOSAVE_KEY = 'writingbook_autosave_v1';
const BOX_UNIT_ID = 'w-box';

/* ---------- 学习档案 ---------- */
let wrState = { drafts: [], lastUnit: null };
try {
  const raw = localStorage.getItem(WRITING_STORE_KEY);
  if (raw) wrState = { ...{ drafts: [], lastUnit: null }, ...JSON.parse(raw) };
} catch (e) { /* 仅用内存状态 */ }
function wrSave() { try { localStorage.setItem(WRITING_STORE_KEY, JSON.stringify(wrState)); } catch (e) {} }

/* ---------- 索引与视图状态 ---------- */
const TOPIC_INDEX = {};   // 题目 -> { ...题目, unit }
WRITING_UNITS.forEach(u => u.topics.forEach(t => { if (!TOPIC_INDEX[t.title]) TOPIC_INDEX[t.title] = { ...t, unit: u }; }));
const ALL_TOPICS = Object.values(TOPIC_INDEX);
const ALL_GOOD_WORDS = [];
WRITING_MATERIALS.wordGroups.forEach(g => g.words.forEach(w => ALL_GOOD_WORDS.push(w)));
WRITING_UNITS.forEach(u => u.topics.forEach(t => (t.words || []).forEach(w => { if (!ALL_GOOD_WORDS.includes(w)) ALL_GOOD_WORDS.push(w); })));

const unitList = () => WRITING_UNITS.concat([{ id: BOX_UNIT_ID, name: '素材百宝箱', emoji: '🎁', color: '#f59f00' }]);

let curUnit = unitList().some(u => u.id === wrState.lastUnit) ? wrState.lastUnit : WRITING_UNITS[0].id;
let query = '';
let view = 'unit';          // unit | box | drafts
const expanded = new Set(); // 已展开范文的题目（本页会话内）
let editor = { title: '', content: '', index: null }; // 作文本编辑器

function unitById(id) { return unitList().find(u => u.id === id); }
function countWords(s) { return String(s || '').replace(/\s/g, '').length; }
function esc(s) {
  return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
function speak(text, rate) {
  if (!window.SpeechKit) return;
  SpeechKit.speak(text, { rate: rate || 0.9 });
}

/* ---------- 渲染 ---------- */
function renderChips() {
  document.getElementById('chips').innerHTML = unitList().map(u => {
    const n = u.id === BOX_UNIT_ID ? '' :
      '<span class="chip-num">' + u.topics.length + ' 题</span>';
    return '<button class="chip' + (u.id === curUnit && !query && view !== 'drafts' ? ' on' : '') + '" style="--c:' + u.color + '" data-act="unit" data-id="' + u.id + '">' +
      '<span class="chip-emoji">' + u.emoji + '</span><span class="chip-name">' + u.name + '</span>' + n + '</button>';
  }).join('');
}

function topicCard(t, showUnitTag, colorOverride) {
  const color = colorOverride || (t.unit || {}).color || '#4d96ff';
  const open = expanded.has(t.title);
  const outline = (t.outline || []).map(o =>
    '<div class="wsec"><span class="seclabel">' + esc(o.label.slice(0, 1)) + '</span>' +
    '<button class="step-text" data-act="say" data-t="' + esc(o.label + '：' + o.text) + '"><b>' + esc(o.label) + '：</b>' + esc(o.text) + ' 🔊</button></div>'
  ).join('');
  const words = (t.words || []).map(w =>
    '<button class="rel" data-act="say" data-t="' + esc(w) + '"><b>' + esc(w) + '</b></button>').join('');
  const sentences = (t.sentences || []).map(s =>
    '<button class="good-sent" data-act="say" data-t="' + esc(s) + '">🗣 ' + esc(s) + '</button>').join('');

  const modelBox = open
    ? '<div class="model-box">' +
      '<button class="model-essay" data-act="say" data-t="' + esc(t.model) + '">' + esc(t.model) + '\n\n🔊 点我听全文</button>' +
      '<button class="comment" data-act="say" data-t="' + esc(t.comment) + '">💡 ' + esc(t.comment) + '</button></div>'
    : '';

  return '<article class="wcard' + (open ? '' : '') + '" style="--c:' + color + '">' +
    (showUnitTag && t.unit ? '<span class="unit-tag" style="background:' + t.unit.color + '">' + t.unit.emoji + ' ' + esc(t.unit.name) + '</span>' : '') +
    '<div class="wline"><span class="word">' + esc(t.title) + '</span>' +
    '<button class="toggle-btn" data-act="toggle" data-title="' + esc(t.title) + '">' + (open ? '收起范文 ▲' : '📄 看范文') + '</button></div>' +
    '<div class="hint-box" style="margin-top:8px">🎯 ' + esc(t.goal) + '</div>' +
    '<div style="margin-top:6px"></div>' + outline +
    '<div class="wsec"><span class="seclabel">词</span><div class="rels">' + words + '</div></div>' +
    '<div class="wsec"><span class="seclabel">句</span><div class="rels" style="flex-direction:column;align-items:stretch">' + sentences + '</div></div>' +
    modelBox +
    '<div class="wsec"><span class="seclabel">练</span><div class="task-line">' +
    '<span class="task-text">✍️ ' + esc(t.task) + '</span>' +
    '<button class="mini-btn" data-act="write" data-title="' + esc(t.title) + '">去写 ➜</button></div></div>' +
    '</article>';
}

function renderUnit() {
  const u = unitById(curUnit);
  if (!u) return '';
  if (u.id === BOX_UNIT_ID) return renderBox();
  return '<div class="unit-head" style="--c:' + u.color + '">' +
    '<span class="unit-emoji">' + u.emoji + '</span>' +
    '<div><h1>' + esc(u.name) + '写作锦囊</h1>' +
    '<p>' + u.topics.length + ' 个题目 · 看锦囊，读范文，动笔试一试</p></div></div>' +
    '<div class="wgrid">' + u.topics.map(t => topicCard(t, false, u.color)).join('') + '</div>';
}

function renderBox() {
  const M = WRITING_MATERIALS;
  const starts = M.starts.map(s =>
    '<div class="wsec"><span class="seclabel">' + esc(s.type.slice(0, 2)) + '</span>' +
    '<button class="good-sent" data-act="say" data-t="' + esc(s.text) + '">🗣 ' + esc(s.text) + '<br><span class="dim" style="font-size:12px;color:#9a94a8">「' + esc(s.type) + '」</span></button></div>').join('');
  const ends = M.ends.map(s =>
    '<div class="wsec"><span class="seclabel">' + esc(s.type.slice(0, 2)) + '</span>' +
    '<button class="good-sent" data-act="say" data-t="' + esc(s.text) + '">🗣 ' + esc(s.text) + '<br><span class="dim" style="font-size:12px;color:#9a94a8">「' + esc(s.type) + '」</span></button></div>').join('');
  const wordCards = M.wordGroups.map(g =>
    '<div class="wsec"><span class="seclabel">' + esc(g.name.slice(1, 2)) + '</span><div class="rels">' +
    g.words.map(w => '<button class="rel" data-act="say" data-t="' + esc(w) + '"><b>' + esc(w) + '</b></button>').join('') +
    '</div></div>').join('');
  const sents = M.sentences.map(s =>
    '<button class="good-sent" data-act="say" data-t="' + esc(s) + '">🗣 ' + esc(s) + '</button>').join('');

  return '<div class="unit-head" style="--c:#f59f00">' +
    '<span class="unit-emoji">🎁</span>' +
    '<div><h1>素材百宝箱</h1><p>好开头、好结尾、好词与好句，点一下就能听</p></div></div>' +
    '<div class="wgrid">' +
    '<article class="wcard" style="--c:#f59f00"><div class="wline"><span class="word">🚪 好开头</span></div>' + starts + '</article>' +
    '<article class="wcard" style="--c:#f59f00"><div class="wline"><span class="word">🏁 好结尾</span></div>' + ends + '</article>' +
    '<article class="wcard" style="--c:#f59f00"><div class="wline"><span class="word">🧺 好词</span></div>' + wordCards + '</article>' +
    '<article class="wcard" style="--c:#f59f00"><div class="wline"><span class="word">✨ 好句（比喻·拟人）</span></div><div class="rels" style="flex-direction:column;align-items:stretch">' + sents + '</div></article>' +
    '</div>';
}

/* ---------- 我的作文本 ---------- */
function draftHints(title, content) {
  const n = countWords(content);
  const paras = String(content || '').split(/\n+/).filter(s => s.trim()).length;
  const hints = [];
  if (!title.trim()) hints.push('先给作文起一个<b>题目</b>吧！');
  if (n > 0 && n < 60) hints.push('现在 ' + n + ' 个字，把事情<b>写具体</b>：发生了什么？怎么做的？说了什么话？');
  if (n >= 60 && paras < 3) hints.push('试着分成 <b>3 段</b>：开头、中间、结尾（空一行分段）。');
  const used = ALL_GOOD_WORDS.filter(w => content.includes(w));
  if (n >= 60 && used.length === 0) hints.push('试着用一两个<b>好词</b>，让文章更生动（去素材百宝箱翻翻）。');
  else if (used.length) hints.push('用到了 <b>' + used.length + '</b> 个好词：' + esc(used.slice(0, 6).join('、')) + (used.length > 6 ? '…' : ''), '好样的！');
  if (!/[。！？]/.test(content) && n > 20) hints.push('别忘了加<b>标点</b>：句号、感叹号……');
  if (n >= 150 && paras >= 3 && used.length >= 2) hints.push('🎉 段落清楚、有好词，已经很像一篇像样的作文啦！');
  return {
    n, paras, used,
    html: hints.length
      ? '<div class="hint-box">' + hints.map(h => '· ' + h).join('<br>') + '</div>'
      : '<div class="hint-box">开始动笔吧，写完记得点「保存」！</div>',
  };
}

function renderDrafts() {
  const list = wrState.drafts.slice().sort((a, b) => b.ts - a.ts).map((d, i) => {
    const realIdx = wrState.drafts.indexOf(d);
    return '<div class="draft-item"><span class="di-title">📄 ' + esc(d.title || '无题') + '</span>' +
      '<span class="di-meta">' + countWords(d.content) + ' 字 · ' + new Date(d.ts).toLocaleDateString('zh-CN') + '</span>' +
      '<span class="spacer"></span>' +
      '<button class="di-btn" data-act="openDraft" data-i="' + realIdx + '">打开</button>' +
      '<button class="di-btn" data-act="readDraft" data-i="' + realIdx + '">🔊 读</button>' +
      '<button class="di-btn ghost" data-act="delDraft" data-i="' + realIdx + '">删除</button></div>';
  }).join('');

  return '<div class="draft-layout">' +
    '<article class="wcard draft-editor" style="--c:#3b7dd8">' +
    '<h1 class="editor-heading">📓 我的作文本</h1>' +
    '<input id="draftTitle" class="draft-title" aria-label="作文题目" placeholder="作文题目（比如：记一次游戏）" value="' + esc(editor.title) + '">' +
    '<textarea id="draftContent" class="draft-textarea" aria-label="作文正文" placeholder="在这里开始写作文……写完记得点「保存」">' + esc(editor.content) + '</textarea>' +
    '<div id="draftStats">' + draftStatsHTML() + '</div>' +
    '<div class="row-center" style="display:flex;gap:12px;justify-content:center;margin-top:16px;flex-wrap:wrap">' +
    '<button class="ok-btn" data-act="saveDraft">💾 保存</button>' +
    '<button class="mini-btn" data-act="readMine">🔊 读一读我的作文</button>' +
    '<button class="mini-btn ghost" data-act="clearEditor">🧹 重新写</button></div>' +
    '</article>' +
    '<article class="wcard draft-library" style="--c:#3b7dd8"><h2 class="library-heading">📚 已保存的作文 <span>' + wrState.drafts.length + '</span></h2>' +
    (list || '<p class="dim" style="padding:10px 0">还没有保存过作文，写一篇试试吧！</p>') +
    '</article></div>';
}

function draftStatsHTML() {
  const h = draftHints(editor.title, editor.content);
  return '<div class="stat-line">字数：<b>' + h.n + '</b> · 段落：<b>' + h.paras + '</b> · 用到好词：<b>' + h.used.length + '</b> 个</div>' + h.html;
}

function render() {
  const el = document.getElementById('cards');
  if (view === 'drafts') el.innerHTML = renderDrafts();
  else if (query) {
    const q = query.toLowerCase();
    const hits = ALL_TOPICS.filter(t =>
      (t.title + t.goal + t.model + (t.words || []).join('') + (t.sentences || []).join('')).toLowerCase().includes(q) ||
      t.unit.name.includes(query));
    el.innerHTML = hits.length
      ? '<div class="search-head">🔎 找到 ' + hits.length + ' 个题目</div><div class="wgrid">' + hits.map(t => topicCard(t, true)).join('') + '</div>'
      : '<div class="empty">✏️ 没有找到「' + esc(query) + '」，换个词试试～</div>';
  } else if (view === 'box') el.innerHTML = renderBox();
  else el.innerHTML = renderUnit();
  renderChips();
  const stats = document.getElementById('stats');
  if (stats) stats.textContent = '我的作文 ' + wrState.drafts.length + ' 篇';
}

/* ---------- 交互 ---------- */
function selectUnit(id) {
  curUnit = id;
  wrState.lastUnit = id;
  wrSave();
  query = '';
  const search = document.getElementById('search');
  if (search) search.value = '';
  view = id === BOX_UNIT_ID ? 'box' : 'unit';
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openDrafts(title) {
  view = 'drafts';
  query = '';
  const search = document.getElementById('search');
  if (search) search.value = '';
  if (title !== undefined) { editor = { title: title || '', content: '', index: null }; }
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function saveDraft() {
  const t = (document.getElementById('draftTitle') || {}).value || '';
  const c = (document.getElementById('draftContent') || {}).value || '';
  if (!c.trim()) { alert('先写一点内容再保存吧！'); return; }
  const entry = { title: t.trim() || '无题', content: c, ts: Date.now() };
  if (editor.index != null && wrState.drafts[editor.index]) wrState.drafts[editor.index] = entry;
  else wrState.drafts.push(entry);
  editor = { title: entry.title, content: c, index: editor.index != null ? editor.index : wrState.drafts.length - 1 };
  wrSave();
  try { localStorage.removeItem(WRITING_AUTOSAVE_KEY); } catch (e) {}
  render();
  speak('保存成功，真棒！', 0.95);
}

function lottery() {
  const t = ALL_TOPICS[Math.floor(Math.random() * ALL_TOPICS.length)];
  document.getElementById('modal').innerHTML =
    '<div class="modal-mask" data-act="closeModal"><div class="modal">' +
    '<div class="lottery-emoji">🎲</div>' +
    '<h3>' + esc(t.title) + '</h3>' +
    '<div class="lottery-goal">🎯 ' + esc(t.goal) + '</div>' +
    '<div class="row-center">' +
    '<button class="ok-btn" data-act="lotteryWrite" data-title="' + esc(t.title) + '">✍️ 就写它！</button>' +
    '<button class="mini-btn" data-act="lottery">再抽一签 🔄</button>' +
    '<button class="mini-btn ghost" data-act="closeModal">先不写</button></div>' +
    '</div></div>';
  speak(t.title, 0.9);
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  try {
    if (act === 'say') { e.preventDefault(); speak(el.dataset.t); }
    else if (act === 'unit') { e.preventDefault(); selectUnit(el.dataset.id); }
    else if (act === 'home') { e.preventDefault(); window.location.href = 'index.html'; }
    else if (act === 'words') { e.preventDefault(); window.location.href = 'words.html'; }
    else if (act === 'idioms') { e.preventDefault(); window.location.href = 'idioms.html'; }
    else if (act === 'toggle') {
      e.preventDefault();
      const t = el.dataset.title;
      expanded.has(t) ? expanded.delete(t) : expanded.add(t);
      render();
    } else if (act === 'drafts') { e.preventDefault(); openDrafts(); }
    else if (act === 'write') { e.preventDefault(); openDrafts(el.dataset.title); }
    else if (act === 'lottery') { e.preventDefault(); lottery(); }
    else if (act === 'lotteryWrite') { e.preventDefault(); document.getElementById('modal').innerHTML = ''; openDrafts(el.dataset.title); }
    else if (act === 'closeModal') { if (e.target === el) document.getElementById('modal').innerHTML = ''; }
    else if (act === 'saveDraft') { e.preventDefault(); saveDraft(); }
    else if (act === 'readMine') {
      e.preventDefault();
      const t = (document.getElementById('draftTitle') || {}).value || '';
      const c = (document.getElementById('draftContent') || {}).value || '';
      if (!c.trim()) return;
      speak((t ? t + '。' : '') + c, 0.9);
    } else if (act === 'clearEditor') {
      e.preventDefault();
      if (confirm('确定清空当前内容，重新写一篇吗？')) { editor = { title: '', content: '', index: null }; try { localStorage.removeItem(WRITING_AUTOSAVE_KEY); } catch (err) {} render(); }
    } else if (act === 'openDraft') {
      e.preventDefault();
      const d = wrState.drafts[Number(el.dataset.i)];
      if (d) { editor = { title: d.title, content: d.content, index: Number(el.dataset.i) }; view = 'drafts'; render(); }
    } else if (act === 'readDraft') {
      e.preventDefault();
      const d = wrState.drafts[Number(el.dataset.i)];
      if (d) speak(d.title + '。' + d.content, 0.9);
    } else if (act === 'delDraft') {
      e.preventDefault();
      const i = Number(el.dataset.i);
      if (confirm('确定删除《' + (wrState.drafts[i].title || '无题') + '》吗？')) {
        wrState.drafts.splice(i, 1); wrSave(); render();
      }
    }
  } catch (err) {
    console.error('[作文坊] 操作出错:', err);
  }
});

document.addEventListener('input', e => {
  if (e.target && e.target.id === 'search') {
    query = e.target.value.trim();
    if (view === 'drafts' && query) view = 'unit';
    render();
    return;
  }
  if (view !== 'drafts') return;
  if (e.target && e.target.id === 'draftTitle') {
    editor.title = e.target.value;
  } else if (e.target && e.target.id === 'draftContent') {
    editor.content = e.target.value;
    try { localStorage.setItem(WRITING_AUTOSAVE_KEY, JSON.stringify(editor)); } catch (err) {}
  } else return;
  /* 只刷新统计与提示，保持输入焦点 */
  const box = document.getElementById('draftStats');
  if (box) box.innerHTML = draftStatsHTML();
});

window.addEventListener('beforeunload', () => { try { speechSynthesis.cancel(); } catch (e) {} });

/* 供自动化测试使用 */
window.Writing = {
  get state() { return wrState; },
  get view() { return view; },
  get unit() { return curUnit; },
  get query() { return query; },
  units: WRITING_UNITS, materials: WRITING_MATERIALS, topics: ALL_TOPICS,
  render, selectUnit, openDrafts, lottery, saveDraft, draftHints,
};

/* 启动：恢复未保存的草稿 */
try {
  const auto = JSON.parse(localStorage.getItem(WRITING_AUTOSAVE_KEY) || 'null');
  if (auto && (auto.title || auto.content)) editor = { title: auto.title || '', content: auto.content || '', index: null };
} catch (e) {}

render();

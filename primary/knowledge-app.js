/* ============================================================
   乐学堂 · 语文知识点 —— 界面逻辑
   单元切换 / 课文知识卡 / 必背古诗文 / 日积月累 / 字词复习
   搜索 / 点读 / 已复习标记 / 打印
   ============================================================ */
'use strict';

const KB_STORE_KEY = 'knowbook_v1';

/* ---------- 学习档案 ---------- */
let kbState = { last: 'u1', learned: {} };
try {
  const raw = localStorage.getItem(KB_STORE_KEY);
  if (raw) kbState = { ...{ last: 'u1', learned: {} }, ...JSON.parse(raw) };
} catch (e) { /* 仅用内存状态 */ }
function kbSave() { try { localStorage.setItem(KB_STORE_KEY, JSON.stringify(kbState)); } catch (e) {} }

/* ---------- 索引与视图状态 ---------- */
const UNIT_BY_ID = {};
KB.units.forEach(u => { UNIT_BY_ID[u.id] = u; });
const TOTAL_LESSONS = KB.units.reduce((n, u) => n + u.lessons.length, 0);
const EXTRA_VIEWS = [
  { id: 'poems', name: '必背古诗文', emoji: '📜', color: '#8b65c9', count: KB.poems.length },
  { id: 'sayings', name: '日积月累', emoji: '🗒️', color: '#d96c2f', count: KB.sayings.reduce((n, s) => n + s.items.length, 0) },
  { id: 'words', name: '字词复习', emoji: '🔁', color: '#3f8fbf', count: KB.polyphonic.length },
];

let curView = UNIT_BY_ID[kbState.last] ? kbState.last : 'u1';
let query = '';

function unitById(id) { return UNIT_BY_ID[id]; }
function lessonKey(u, l) { return u.id + '-' + l.id; }
function totalLearned() { return KB.units.reduce((n, u) => n + u.lessons.filter(l => kbState.learned[lessonKey(u, l)]).length, 0); }

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
function renderChips() {
  const unitChips = KB.units.map(u => {
    const learned = u.lessons.filter(l => kbState.learned[lessonKey(u, l)]).length;
    const done = learned === u.lessons.length;
    return '<button class="chip' + (u.id === curView && !query ? ' on' : '') + '" style="--c:' + u.color + '" data-act="unit" data-id="' + u.id + '">' +
      '<span class="chip-emoji">' + u.emoji + '</span><span class="chip-name">' + esc(u.no.replace('单元', '') + ' ' + u.name) + '</span>' +
      '<span class="chip-num' + (done ? ' full' : '') + '">' + learned + '/' + u.lessons.length + '</span></button>';
  });
  const extraChips = EXTRA_VIEWS.map(v =>
    '<button class="chip' + (v.id === curView && !query ? ' on' : '') + '" style="--c:' + v.color + '" data-act="unit" data-id="' + v.id + '">' +
    '<span class="chip-emoji">' + v.emoji + '</span><span class="chip-name">' + esc(v.name) + '</span>' +
    '<span class="chip-num">' + v.count + '</span></button>');
  document.getElementById('chips').innerHTML = unitChips.join('') + extraChips.join('');
}

function renderStats() {
  const el = document.getElementById('stats');
  if (el) el.textContent = '已复习 ' + totalLearned() + ' / ' + TOTAL_LESSONS + ' 课';
}

/* ---------- 课文知识卡 ---------- */
function wordPills(words) {
  return '<div class="pills">' + words.map(w =>
    '<button class="wpill" data-act="say" data-t="' + esc(w[0]) + '"><b>' + esc(w[0]) + '</b><i>' + esc(w[1]) + '</i></button>'
  ).join('') + '</div>';
}

function fourWordChips(list) {
  return '<div class="pills">' + list.map(w =>
    '<button class="fw" data-act="say" data-t="' + esc(w) + '">' + esc(w) + '</button>'
  ).join('') + '</div>';
}

function polyRows(rows, styleVar) {
  return '<div class="polys">' + rows.map(r =>
    '<div class="poly-row"' + (styleVar ? ' style="--c:' + styleVar + '"' : '') + '><b class="poly-char">' + esc(r[0]) + '</b>' +
    '<button class="poly-half" data-act="say" data-t="' + esc(r[2]) + '"><span class="poly-py">' + esc(r[1]) + '</span><span class="poly-w">' + esc(r[2]) + '</span></button>' +
    '<button class="poly-half" data-act="say" data-t="' + esc(r[4]) + '"><span class="poly-py">' + esc(r[3]) + '</span><span class="poly-w">' + esc(r[4]) + '</span></button>' +
    '</div>').join('') + '</div>';
}

function synantRows(rows) {
  return '<div class="sas">' + rows.map(r =>
    '<button class="sa-row" data-act="say" data-t="' + esc(r[0] + '。近义词' + r[1] + '。反义词' + r[2]) + '">' +
    '<b>' + esc(r[0]) + '</b><span class="sa-n">近 ' + esc(r[1]) + '</span><span class="sa-a">反 ' + esc(r[2]) + '</span></button>'
  ).join('') + '</div>';
}

function ksec(label, inner) {
  return '<div class="ksec"><span class="seclabel">' + label + '</span>' + inner + '</div>';
}

function lessonCard(u, l) {
  const key = lessonKey(u, l);
  const learned = !!kbState.learned[key];
  const parts = [];

  parts.push('<article class="kcard' + (learned ? ' learned' : '') + '" style="--c:' + u.color + '" data-key="' + key + '">');
  parts.push('<div class="khead"><span class="kno">' + esc(u.no.replace('单元', '')) + '</span>' +
    '<h3 class="ktitle">' + esc(l.title) + '</h3>' +
    '<span class="ktag">' + esc(l.tag) + '</span>' +
    (l.author ? '<span class="kauthor">' + esc(l.author) + '</span>' : '') +
    '<span class="khead-gap"></span>' + sayBtn(l.title + '。' + l.overview) +
    '<button class="learn-btn' + (learned ? ' on' : '') + '" data-act="learn" data-unit="' + u.id + '" data-id="' + esc(l.id) + '" title="标记已复习" aria-pressed="' + learned + '" aria-label="已复习 ' + esc(l.title) + '">' + (learned ? '✓' : '') + '</button></div>');
  parts.push('<p class="k-overview">' + esc(l.overview) + '</p>');
  if (l.fig && window.Figures) parts.push(Figures.figHTML(l.fig));

  if (l.main && l.main.length) {
    parts.push(ksec('梳', '<ul class="klist">' + l.main.map(m =>
      '<li><button class="kli" data-act="say" data-t="' + esc(m) + '">' + esc(m) + '</button></li>').join('') + '</ul>'));
  }
  if (l.theme) {
    parts.push(ksec('旨', '<button class="ktheme" data-act="say" data-t="' + esc(l.theme) + '">' + esc(l.theme) + '</button>'));
  }
  if (l.words && l.words.length) parts.push(ksec('词', wordPills(l.words)));
  if (l.fourWords && l.fourWords.length) parts.push(ksec('汇', fourWordChips(l.fourWords)));
  if (l.poly && l.poly.length) parts.push(ksec('音', polyRows(l.poly)));
  if (l.synant && l.synant.length) parts.push(ksec('反', synantRows(l.synant)));
  if (l.craft) {
    parts.push(ksec('法', '<button class="kcraft" data-act="say" data-t="' + esc(l.craft) + '">' + esc(l.craft) + '</button>'));
  }
  if (l.tips && l.tips.length) {
    parts.push(ksec('考', '<ul class="klist tips">' + l.tips.map(t =>
      '<li><button class="kli" data-act="say" data-t="' + esc(t) + '">⭐ ' + esc(t) + '</button></li>').join('') + '</ul>'));
  }
  if (l.recite) {
    parts.push('<div class="krecite">📖 背诵：' + esc(l.recite) + '</div>');
  }
  parts.push('</article>');
  return parts.join('');
}

/* ---------- 单元板块（口语交际 / 习作 / 园地 / 快乐读书吧） ---------- */
function unitBlocks(u) {
  const blocks = [];
  if (u.oral) {
    blocks.push('<section class="ublock" style="--c:' + u.color + '"><h3>🗣️ 口语交际：' + esc(u.oral.title) + '</h3><ul>' +
      u.oral.points.map(p => '<li>' + esc(p) + '</li>').join('') + '</ul></section>');
  }
  if (u.writing) {
    blocks.push('<section class="ublock writing" style="--c:' + u.color + '"><h3>✏️ 习作：' + esc(u.writing.title) + '</h3><ul>' +
      u.writing.points.map(p => '<li>' + esc(p) + '</li>').join('') + '</ul></section>');
  }
  if (u.garden) {
    blocks.push('<section class="ublock garden" style="--c:' + u.color + '"><h3>🏡 语文园地</h3><ul>' +
      u.garden.map(g => '<li>' + esc(g) + '</li>').join('') + '</ul></section>');
  }
  if (u.book) {
    blocks.push('<section class="ublock book" style="--c:' + u.color + '"><h3>📚 快乐读书吧：' + esc(u.book.title) + '</h3><ul>' +
      u.book.points.map(p => '<li>' + esc(p) + '</li>').join('') + '</ul></section>');
  }
  return blocks.join('');
}

function renderUnit(u) {
  const banner = u.banner && window.Figures ? '<div class="unit-banner">' + Figures.figHTML(u.banner) + '</div>' : '';
  return '<div class="unit-head" style="--c:' + u.color + '">' +
    '<span class="unit-emoji">' + u.emoji + '</span>' +
    '<div><h1>' + esc(u.no) + ' · ' + esc(u.name) + '</h1>' +
    '<p>' + esc(u.intro) + '</p>' +
    '<div class="goal-tags">' + u.goals.map(g => '<span>🎯 ' + esc(g) + '</span>').join('') + '</div></div></div>' +
    banner +
    u.lessons.map(l => lessonCard(u, l)).join('') +
    unitBlocks(u);
}

/* ---------- 必背古诗文 ---------- */
function poemCard(p) {
  const meta = p.kind === '文言文' ? esc(p.dynasty) : esc(p.dynasty + ' · ' + p.author);
  return '<article class="poem-card" style="--c:#8b65c9">' +
    '<div class="phead"><h3>' + esc(p.title) + '</h3><span class="pmeta">' + meta +
    '<span class="pkind">' + esc(p.kind) + '</span></span>' + sayBtn(p.title + '。' + p.lines.join('')) + '</div>' +
    '<div class="plines">' + p.lines.map(line =>
      '<button class="pline" data-act="say" data-t="' + esc(line) + '">' + esc(line) + '</button>').join('') + '</div>' +
    '<p class="pnote">' + esc(p.note) + '</p>' +
    (p.notes ? '<div class="pnotes">' + p.notes.map(n =>
      '<span class="pnote-row"><b>' + esc(n[0]) + '</b>' + esc(n[1]) + '</span>').join('') + '</div>' : '') +
    '</article>';
}

function renderPoems() {
  return '<div class="unit-head" style="--c:#8b65c9">' +
    '<span class="unit-emoji">📜</span><div><h1>必背古诗文</h1>' +
    '<p>古诗 ' + KB.poems.filter(p => p.kind === '古诗').length + ' 首 · 文言文 ' + KB.poems.filter(p => p.kind === '文言文').length + ' 篇 · 点一行读一行</p></div></div>' +
    '<div class="wgrid">' + KB.poems.map(p => poemCard(p)).join('') + '</div>';
}

/* ---------- 日积月累 ---------- */
function renderSayings() {
  return '<div class="unit-head" style="--c:#d96c2f">' +
    '<span class="unit-emoji">🗒️</span><div><h1>日积月累</h1>' +
    '<p>名句与谚语 · 点一句读一句</p></div></div>' +
    KB.sayings.map(g =>
      '<section class="saying-card" style="--c:#d96c2f"><div class="shead"><h3>' + esc(g.title) + '</h3>' +
      '<span class="pkind">' + esc(g.kind) + '</span></div>' +
      '<div class="sitems">' + g.items.map(item =>
        '<button class="sitem" data-act="say" data-t="' + esc(item) + '">' + esc(item) + '</button>').join('') + '</div>' +
      '<p class="pnote">' + esc(g.note) + '</p></section>').join('');
}

/* ---------- 字词复习 ---------- */
function renderWords() {
  return '<div class="unit-head" style="--c:#3f8fbf">' +
    '<span class="unit-emoji">🔁</span><div><h1>字词复习</h1>' +
    '<p>多音字 ' + KB.polyphonic.length + ' 个 · 形近字 ' + KB.similar.length + ' 组</p></div></div>' +
    '<h2 class="wsub">🔁 多音字</h2>' +
    '<div class="wgrid polygrid">' + KB.polyphonic.map(r =>
      '<article class="poly-card" style="--c:#3f8fbf"><span class="big-char">' + esc(r[0]) + '</span>' +
      '<div class="poly-readings">' +
      '<button class="poly-half" data-act="say" data-t="' + esc(r[2]) + '"><span class="poly-py">' + esc(r[1]) + '</span><span class="poly-w">' + esc(r[2]) + '</span></button>' +
      '<button class="poly-half" data-act="say" data-t="' + esc(r[4]) + '"><span class="poly-py">' + esc(r[3]) + '</span><span class="poly-w">' + esc(r[4]) + '</span></button>' +
      '</div></article>').join('') + '</div>' +
    '<h2 class="wsub">🧩 形近字</h2>' +
    '<div class="wgrid">' + KB.similar.map(group =>
      '<article class="similar-card" style="--c:#3f8fbf">' + group.map(p =>
        '<button class="sim-row" data-act="say" data-t="' + esc(p[1]) + '"><b>' + esc(p[0]) + '</b><i>' + esc(p[1]) + '</i></button>').join('') +
      '</article>').join('') + '</div>';
}

/* ---------- 搜索 ---------- */
function searchResults(q) {
  const ql = q.toLowerCase();
  const lessonHits = [];
  KB.units.forEach(u => u.lessons.forEach(l => {
    const hay = [l.title, l.author, l.overview, l.theme, l.craft, (l.main || []).join(''), (l.tips || []).join(''),
      (l.words || []).map(w => w[0]).join(''), (l.fourWords || []).join('')].join(' ').toLowerCase();
    if (hay.includes(ql)) lessonHits.push({ u, l });
  }));
  const poemHits = KB.poems.filter(p =>
    (p.title + p.author + p.dynasty + p.note + p.lines.join('')).toLowerCase().includes(ql));
  const sayingHits = KB.sayings.map(g => ({
    ...g, items: g.items.filter(item => (item + g.title).toLowerCase().includes(ql)),
  })).filter(g => g.items.length);
  const polyHits = KB.polyphonic.filter(r => r.join(' ').toLowerCase().includes(ql));
  const simHits = KB.similar.filter(group =>
    group.some(p => (p[0] + p[1]).toLowerCase().includes(ql)));

  const out = [];
  if (lessonHits.length) {
    out.push('<div class="search-head">🔎 找到 ' + lessonHits.length + ' 篇课文</div>');
    KB.units.forEach(u => {
      const hits = lessonHits.filter(h => h.u === u);
      if (hits.length) out.push(hits.map(h => lessonCard(u, h.l)).join(''));
    });
  }
  if (poemHits.length) {
    out.push('<div class="search-head">📜 匹配的古诗文 ' + poemHits.length + ' 篇</div><div class="wgrid">' +
      poemHits.map(p => poemCard(p)).join('') + '</div>');
  }
  if (sayingHits.length) {
    out.push('<div class="search-head">🗒️ 匹配的名句</div>' + sayingHits.map(g =>
      '<section class="saying-card" style="--c:#d96c2f"><div class="shead"><h3>' + esc(g.title) + '</h3></div>' +
      '<div class="sitems">' + g.items.map(item =>
        '<button class="sitem" data-act="say" data-t="' + esc(item) + '">' + esc(item) + '</button>').join('') + '</div></section>').join(''));
  }
  if (polyHits.length || simHits.length) {
    out.push('<div class="search-head">🔁 匹配的字词</div>');
    if (polyHits.length) out.push('<div class="wgrid polygrid">' + polyHits.map(r =>
      '<article class="poly-card" style="--c:#3f8fbf"><span class="big-char">' + esc(r[0]) + '</span>' +
      '<div class="poly-readings">' +
      '<button class="poly-half" data-act="say" data-t="' + esc(r[2]) + '"><span class="poly-py">' + esc(r[1]) + '</span><span class="poly-w">' + esc(r[2]) + '</span></button>' +
      '<button class="poly-half" data-act="say" data-t="' + esc(r[4]) + '"><span class="poly-py">' + esc(r[3]) + '</span><span class="poly-w">' + esc(r[4]) + '</span></button>' +
      '</div></article>').join('') + '</div>');
    if (simHits.length) out.push('<div class="wgrid">' + simHits.map(group =>
      '<article class="similar-card" style="--c:#3f8fbf">' + group.map(p =>
        '<button class="sim-row" data-act="say" data-t="' + esc(p[1]) + '"><b>' + esc(p[0]) + '</b><i>' + esc(p[1]) + '</i></button>').join('') +
      '</article>').join('') + '</div>');
  }
  if (!out.length) out.push('<div class="empty">📖 没有找到「' + esc(q) + '」，换个词试试～</div>');
  return out.join('');
}

/* ---------- 渲染 ---------- */
function renderMain() {
  const box = document.getElementById('cards');
  if (query) {
    box.innerHTML = searchResults(query);
    return;
  }
  if (curView === 'poems') { box.innerHTML = renderPoems(); return; }
  if (curView === 'sayings') { box.innerHTML = renderSayings(); return; }
  if (curView === 'words') { box.innerHTML = renderWords(); return; }
  const u = unitById(curView);
  box.innerHTML = u ? renderUnit(u) : '';
}

function render() {
  renderChips();
  renderMain();
  renderStats();
}

/* ---------- 交互 ---------- */
function selectView(id) {
  curView = id;
  if (UNIT_BY_ID[id]) kbState.last = id;
  kbSave();
  query = '';
  const search = document.getElementById('search');
  if (search) search.value = '';
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleLearn(unitId, lessonId) {
  const key = unitId + '-' + lessonId;
  if (kbState.learned[key]) delete kbState.learned[key];
  else kbState.learned[key] = true;
  kbSave();
  render();
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
    console.error('[语文知识点] 操作出错:', err);
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
window.Knowledge = {
  get state() { return kbState; },
  get view() { return curView; },
  get query() { return query; },
  data: KB,
  units: KB.units,
  poems: KB.poems,
  render, selectView, toggleLearn, searchResults,
};

render();

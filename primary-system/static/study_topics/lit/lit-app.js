/* ============================================================
   乐学堂 · 文学常识 —— 界面逻辑
   文学苑切换 / 知识点卡（要点·想一想·易错·口诀）/ 文学速查 / 文学小诊所
   搜索 / 点读 / 已掌握标记 / 打印
   ============================================================ */
'use strict';
const courseAssets = new URL('.', document.currentScript.src);

LIT.units.forEach(unit => {
  unit.points = unit.points.map(window.StudyTopicConnections.lesson);
});

const LIT_STORE_KEY = 'litbook_v1';

/* ---------- 学习档案 ---------- */
let lkState = { last: 'lu1', learned: {} };
try {
  const raw = localStorage.getItem(LIT_STORE_KEY);
  if (raw) lkState = { ...{ last: 'lu1', learned: {} }, ...JSON.parse(raw) };
} catch (e) { /* 仅用内存状态 */ }
function lkSave() { try { localStorage.setItem(LIT_STORE_KEY, JSON.stringify(lkState)); } catch (e) {} }

/* ---------- 索引与视图状态 ---------- */
const LUNIT_BY_ID = Object.create(null);
LIT.units.forEach(u => { LUNIT_BY_ID[u.id] = u; });
const LTOTAL_POINTS = LIT.units.reduce((n, u) => n + u.points.length, 0);
const LEXTRA_VIEWS = [
  { id: 'relationships', name: '人物关系图', emoji: '🌳', color: '#ce6538', count: LIT.classics.length },
  { id: 'authors', name: '作家名片', emoji: '✉️', color: '#8b65c9', count: LIT.authors.length },
  { id: 'facts', name: '文学速查', emoji: '🏆', color: '#b5893a', count: LIT.facts.reduce((n, f) => n + f.items.length, 0) },
  { id: 'clinic', name: '文学小诊所', emoji: '🩺', color: '#c2557d', count: LIT.mistakes.length },
];

function validView(id) { return !!LUNIT_BY_ID[id] || LEXTRA_VIEWS.some(v => v.id === id); }
let curView = validView(lkState.last) ? lkState.last : 'lu1';
const initialView = curView;
let query = '';
let currentLesson = '';
let selectedBook = LIT.classics[0].id;
let selectedCharacter = LIT.classics[0].characters[0].id;
let authorGroup = '全部';

function lunitById(id) { return LUNIT_BY_ID[id]; }
function pointKey(u, p) { return u.id + '-' + p.id; }
function totalLearned() { return LIT.units.reduce((n, u) => n + u.points.filter(p => lkState.learned[pointKey(u, p)]).length, 0); }

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
  const unitChips = LIT.units.map(u => {
    const learned = u.points.filter(p => lkState.learned[pointKey(u, p)]).length;
    const done = learned === u.points.length;
    const shortName = u.no.replace('第', '').replace('苑', '') + ' ' + u.name;
    const active = u.id === curView && !query;
    return '<button type="button" class="chip' + (active ? ' on' : '') + '" style="--c:' + u.color + '" data-act="unit" data-id="' + u.id + '"' +
      (active ? ' aria-current="true"' : '') + '><span class="chip-emoji" aria-hidden="true">' + u.emoji + '</span><span class="chip-name">' + esc(shortName) + '</span>' +
      '<span class="chip-num' + (done ? ' full' : '') + '">' + learned + '/' + u.points.length + '</span></button>';
  });
  const extraChips = LEXTRA_VIEWS.map(v => {
    const active = v.id === curView && !query;
    return '<button type="button" class="chip' + (active ? ' on' : '') + '" style="--c:' + v.color + '" data-act="unit" data-id="' + v.id + '"' +
      (active ? ' aria-current="true"' : '') + '><span class="chip-emoji" aria-hidden="true">' + v.emoji + '</span><span class="chip-name">' + esc(v.name) + '</span>' +
      '<span class="chip-num">' + v.count + '</span></button>';
  });
  document.getElementById('chips').innerHTML = unitChips.join('');
  document.getElementById('lit-extras').innerHTML = extraChips.join('');
}

function renderDirectory() {
  const unit = !query && lunitById(curView);
  document.getElementById('lit-directory').hidden = !unit;
  document.querySelector('[data-act="open-directory"]').hidden = !unit;
  document.querySelector('[data-act="show-results"]').hidden = !query;
  document.getElementById('lit-points').innerHTML = unit ? unit.points.map(p =>
    '<a href="#lesson-' + esc(p.id) + '" data-act="lesson"' +
    (p.id === currentLesson ? ' aria-current="location"' : '') + '>' + esc(p.title) + ' <span aria-hidden="true">↓</span></a>'
  ).join('') : '';
}

function renderStats() {
  const el = document.getElementById('stats');
  if (el) el.textContent = '已掌握 ' + totalLearned() + ' / ' + LTOTAL_POINTS + ' 个知识点';
}

/* ---------- 知识点卡 ---------- */
function msec(label, inner) {
  return '<div class="ksec"><span class="seclabel">' + label + '</span>' + inner + '</div>';
}

function pointCard(u, p) {
  const key = pointKey(u, p);
  const learned = !!lkState.learned[key];
  const parts = [];

  parts.push('<article id="lesson-' + esc(p.id) + '" tabindex="-1" class="kcard' +
    (learned ? ' learned' : '') + '" style="--c:' + u.color + '">');
  parts.push('<div class="khead"><h3 class="ktitle">' + esc(p.title) + '</h3>' +
    '<span class="khead-gap"></span>' + sayBtn(p.title + '。' + p.overview) +
    '<button class="learn-btn' + (learned ? ' on' : '') + '" data-act="learn" data-unit="' + u.id + '" data-id="' + esc(p.id) + '" title="标记已掌握" aria-pressed="' + learned + '" aria-label="已掌握 ' + esc(p.title) + '">' + (learned ? '✓' : '') + '</button></div>');
  parts.push('<p class="k-overview">' + esc(p.overview) + '</p>');
  if (p.fig && window.LitFigures) parts.push(LitFigures.figHTML(p.fig));
  if (p.img) parts.push('<figure class="fig point-photo"><img src="' + esc(new URL(p.img, courseAssets).href) + '" alt="' + esc(p.title) + '配图" loading="lazy"></figure>');

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
  const book = LIT.classics.find(b => b.lessonId === p.id);
  const writers = LIT.authors.filter(a => a.lessonIds.includes(p.id));
  if (book || writers.length) parts.push('<nav class="lit-lesson-links" aria-label="' + esc(p.title) + '延伸阅读">' +
    (book ? '<a href="#relationships-' + book.id + '">🌳 展开人物关系图</a>' : '') +
    writers.map(a => '<a href="#author-' + a.id + '">✉️ ' + esc(a.name) + '的名片</a>').join('') + '</nav>');
  parts.push(window.StudyTopicConnections.references(p.id, '接着学'));
  parts.push('</article>');
  return parts.join('');
}

function renderUnit(u) {
  const bannerSvg = u.banner && window.LitFigures
    ? LitFigures.figHTML(u.banner)
    : '';
  const hero = u.hero
    ? '<img class="unit-hero" src="' + esc(new URL(u.hero, courseAssets).href) + '" alt="' + esc(u.name) + '配图" loading="lazy">'
    : '';
  const banner = (bannerSvg || hero)
    ? '<div class="unit-banner">' + hero + bannerSvg + '</div>'
    : '';
  return '<div class="unit-head" style="--c:' + u.color + '">' +
    '<span class="unit-emoji">' + u.emoji + '</span>' +
    '<div><h2>' + esc(u.no) + ' · ' + esc(u.name) + '</h2>' +
    '<p>' + esc(u.intro) + '</p>' +
    '<div class="goal-tags">' + u.goals.map(g => '<span>🎯 ' + esc(g) + '</span>').join('') + '</div></div></div>' +
    banner + u.points.map(p => pointCard(u, p)).join('');
}

/* ---------- 作家名片 ---------- */
function sourceLink(title, url) {
  return '<a class="lit-source" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(title) + ' ↗（需联网）</a>';
}

function authorCard(a) {
  return '<article class="lit-author-card" id="author-' + a.id + '" tabindex="-1">' +
    '<div class="lit-author-heading"><span class="lit-monogram" aria-hidden="true">' + esc(a.name[0]) + '</span>' +
    '<div><p class="lit-eyebrow">' + esc(a.group) + '</p><h2>' + esc(a.name) + '</h2></div>' +
    sayBtn(a.name + '。' + a.era + '。代表作：' + a.works.join('、') + '。' + a.funFact) + '</div>' +
    '<p class="lit-author-era"><b>年代</b> ' + esc(a.era) + '</p>' +
    '<div class="lit-author-works"><h3>代表作</h3><ul>' + a.works.map(w => '<li>' + esc(w) + '</li>').join('') + '</ul></div>' +
    '<p class="lit-fun-fact"><b>💡 一句趣闻</b>' + esc(a.funFact) + '</p>' +
    '<nav class="lit-lesson-links" aria-label="' + esc(a.name) + '相关课程">' + a.lessonIds.map(id => {
      const point = LIT.units.flatMap(u => u.points).find(p => p.id === id);
      return '<a href="#lesson-' + id + '">' + esc(point.title) + ' →</a>';
    }).join('') + '</nav><details class="lit-source-note"><summary>看看出处</summary>' +
    sourceLink(a.source.title, a.source.url) + '</details></article>';
}

function renderAuthors() {
  const groups = ['全部', '古代作家', '近现代作家', '外国作家'];
  const authors = LIT.authors.filter(a => authorGroup === '全部' || a.group === authorGroup);
  return '<div class="unit-head" style="--c:#8b65c9"><span class="unit-emoji">✉️</span><div><h2>作家名片收藏册</h2>' +
    '<p>' + LIT.authors.length + ' 张名片 · 把年代、代表作和一句趣闻连在一起记。</p></div></div>' +
    '<div class="lit-filters" role="group" aria-label="按作家类别筛选">' + groups.map(g =>
      '<button type="button" data-act="author-group" data-group="' + g + '" aria-pressed="' + (g === authorGroup) + '">' + g + '</button>').join('') +
    '</div><p class="lit-result-count" role="status">正在看 ' + authors.length + ' 位作家 · 也可以用上方搜索框找人名或作品。</p>' +
    '<div class="lit-author-grid">' + authors.map(authorCard).join('') + '</div>';
}

/* ---------- 可展开的人物关系树 ---------- */
function characterButton(book, id) {
  const c = book.characters.find(c => c.id === id);
  return '<button type="button" class="lit-person" data-act="character" data-id="' + id + '" aria-pressed="' + (selectedCharacter === id) +
    '" aria-controls="lit-character-detail">' + esc(c.name) + '</button>';
}

function relationshipNode(book, branch, id, label) {
  const children = branch.links.filter(link => link.from === id);
  return '<li>' + (label ? '<span class="lit-edge-label">' + esc(label) + '</span>' : '') + characterButton(book, id) +
    (children.length ? '<ul>' + children.map(link => relationshipNode(book, branch, link.to, link.label)).join('') + '</ul>' : '') + '</li>';
}

function characterDetail(book, c) {
  const links = book.branches.flatMap(branch => branch.links).filter(link => link.from === c.id || link.to === c.id);
  return '<article class="lit-character-card" tabindex="-1" id="character-' + book.id + '-' + c.id + '">' +
    '<div class="lit-character-heading"><div><p class="lit-eyebrow">' + esc(book.title) + ' · 人物档案</p><h2>' + esc(c.name) + '</h2></div>' +
    sayBtn(c.name + '。' + c.role + '。' + c.episode.title + '。' + c.episode.summary) + '</div><p>' + esc(c.role) + '</p>' +
    '<ul class="lit-person-relations">' + links.map(link => {
      const from = book.characters.find(c => c.id === link.from).name;
      const to = book.characters.find(c => c.id === link.to).name;
      return '<li>' + esc(from) + ' <span>— ' + esc(link.label) + ' →</span> ' + esc(to) + '</li>';
    }).join('') + '</ul><section class="lit-episode"><h3>📖 典型情节：' + esc(c.episode.title) + '</h3><p>' + esc(c.episode.summary) +
    '</p><p class="lit-chapter"><b>出处：</b>' + esc(book.title) + ' · ' + esc(c.episode.chapter) + '</p>' +
    sourceLink('读这一回原文', c.episode.url) + '</section></article>';
}

function renderRelationships() {
  const book = LIT.classics.find(b => b.id === selectedBook);
  const person = book.characters.find(c => c.id === selectedCharacter) || book.characters[0];
  selectedCharacter = person.id;
  return '<div class="unit-head" style="--c:#ce6538"><span class="unit-emoji">🌳</span><div><h2>四大名著人物关系图</h2>' +
    '<p>选一本书 → 展开分支 → 点人物，看看他和谁有关、在哪个故事出场。</p></div></div>' +
    '<div class="lit-book-picker" role="group" aria-label="选择名著">' + LIT.classics.map(b =>
      '<button type="button" data-act="book" data-id="' + b.id + '" aria-pressed="' + (b.id === book.id) + '"><span aria-hidden="true">' + b.emoji + '</span> ' + esc(b.title) + '</button>').join('') + '</div>' +
    '<section class="lit-relationship-book" style="--c:' + book.color + '" aria-label="' + esc(book.title) + '人物关系">' +
    '<div class="lit-book-heading"><div><h2>' + book.emoji + ' ' + esc(book.title) + '</h2><p>' + esc(book.intro) + '</p></div>' +
    '<nav class="lit-lesson-links"><a href="#lesson-' + book.lessonId + '">读名著小课堂 →</a><a href="#author-' + book.authorId + '">看作者名片 →</a></nav></div>' +
    '<p class="lit-reading-note">' + esc(book.note) + '</p><div class="lit-tree-tools"><span>' + book.characters.length + ' 位人物 · 连线上写着关系</span>' +
    '<button type="button" data-act="branches" data-open="true">全部展开</button><button type="button" data-act="branches" data-open="false">全部收起</button></div>' +
    '<div class="lit-tree-grid">' + book.branches.map(branch => '<details class="lit-tree-branch" open><summary>' + esc(branch.title) +
      '<span>展开／收起</span></summary><p>' + esc(branch.intro) + '</p><ul class="lit-tree">' + relationshipNode(book, branch, branch.rootId) + '</ul></details>').join('') +
    '</div><div id="lit-character-detail" aria-live="polite">' + characterDetail(book, person) + '</div>' +
    '<details class="lit-source-note"><summary>版本与回目说明</summary><p>本图按' + esc(book.source.title) + '整理，改编本或节选本的回目可能不同。</p>' +
    sourceLink('核对原著目录', book.source.url) + '</details></section>';
}

/* ---------- 文学速查 ---------- */
function factCard(f) {
  return '<article class="formula-card" style="--c:#b5893a">' +
    '<div class="phead"><h3>' + esc(f.title) + '</h3>' + sayBtn(f.title) + '</div>' +
    '<div class="frows">' + f.items.map(it =>
      '<button class="frow" data-act="say" data-t="' + esc(it[0] + '，' + it[1]) + '"><b>' + esc(it[0]) + '</b><span>' + esc(it[1]) + '</span></button>').join('') + '</div>' +
    '<p class="pnote">' + esc(f.note) + '</p></article>';
}

function renderFacts() {
  return '<div class="unit-head" style="--c:#b5893a">' +
    '<span class="unit-emoji">🏆</span><div><h2>文学速查</h2>' +
    '<p>' + LIT.facts.length + ' 组 · 点一行读一行</p></div></div>' +
    LIT.facts.map(factCard).join('');
}

/* ---------- 文学小诊所 ---------- */
function mistakeCard(m) {
  return '<article class="mistake-card">' +
    '<span class="unit-tag">' + esc(m.unit) + '</span>' +
    '<button class="mist-row wrong-row-text" data-act="say" data-t="' + esc(m.wrong) + '"><span class="mist-mark">❌</span>' + esc(m.wrong) + '</button>' +
    '<button class="mist-row right-row-text" data-act="say" data-t="' + esc(m.right) + '"><span class="mist-mark">✅</span>' + esc(m.right) + '</button>' +
    '</article>';
}

function renderClinic() {
  return '<div class="unit-head" style="--c:#c2557d">' +
    '<span class="unit-emoji">🩺</span><div><h2>文学小诊所</h2>' +
    '<p>考前把这张「错处清单」过一遍</p></div></div>' +
    '<div class="wgrid">' + LIT.mistakes.map(mistakeCard).join('') + '</div>';
}

/* ---------- 搜索 ---------- */
function searchResults(q) {
  const ql = q.toLowerCase();
  const authorHits = LIT.authors.filter(a => [a.name, a.era, a.group, ...a.works, a.funFact].join(' ').toLowerCase().includes(ql));
  const characterHits = LIT.classics.flatMap(book => book.characters.filter(c =>
    [book.title, c.name, c.role, c.episode.title, c.episode.summary, c.episode.chapter].join(' ').toLowerCase().includes(ql)
  ).map(c => ({ book, c })));
  const pointHits = [];
  LIT.units.forEach(u => u.points.forEach(p => {
    const hay = [p.title, p.overview, (p.items || []).join(''), p.recall || '',
      p.example ? p.example.q + p.example.a + p.example.steps : '', (p.mistakes || []).join('')].join(' ').toLowerCase();
    if (hay.includes(ql)) pointHits.push({ u, p });
  }));
  const factHits = LIT.facts.map(f => ({
    title: f.title, note: f.note,
    items: f.items.filter(it => (it[0] + ' ' + it[1]).toLowerCase().includes(ql)),
  })).filter(f => f.items.length);
  const mistakeHits = LIT.mistakes.filter(m =>
    (m.unit + m.wrong + m.right).toLowerCase().includes(ql));

  const out = [];
  if (characterHits.length) out.push('<div class="search-head">🌳 找到 ' + characterHits.length + ' 位名著人物</div><div class="lit-character-results">' +
    characterHits.map(({ book, c }) => '<a href="#relationships-' + book.id + '-' + c.id + '"><b>' + esc(c.name) + '</b><span>' +
      esc(book.title) + ' · ' + esc(c.episode.title) + '</span><small>打开关系图与出处 →</small></a>').join('') + '</div>');
  if (authorHits.length) out.push('<div class="search-head">✉️ 找到 ' + authorHits.length + ' 张作家名片</div><div class="lit-author-grid">' + authorHits.map(authorCard).join('') + '</div>');
  if (pointHits.length) {
    out.push('<div class="search-head">🔎 找到 ' + pointHits.length + ' 个知识点</div>');
    LIT.units.forEach(u => {
      const hits = pointHits.filter(h => h.u === u);
      if (hits.length) out.push(hits.map(h => pointCard(u, h.p)).join(''));
    });
  }
  if (factHits.length) {
    out.push('<div class="search-head">🏆 匹配的速查条目</div>' + factHits.map(f =>
      '<article class="formula-card" style="--c:#b5893a"><div class="phead"><h3>' + esc(f.title) + '</h3></div>' +
      '<div class="frows">' + f.items.map(it =>
        '<button class="frow" data-act="say" data-t="' + esc(it[0] + '，' + it[1]) + '"><b>' + esc(it[0]) + '</b><span>' + esc(it[1]) + '</span></button>').join('') + '</div></article>').join(''));
  }
  if (mistakeHits.length) {
    out.push('<div class="search-head">🩺 匹配的易错点</div><div class="wgrid">' + mistakeHits.map(mistakeCard).join('') + '</div>');
  }
  if (!out.length) out.push('<div class="empty">📚 没有找到「' + esc(q) + '」，换个词试试～</div>');
  return out.join('');
}

/* ---------- 渲染 ---------- */
function renderMain() {
  const box = document.getElementById('cards');
  if (query) {
    box.innerHTML = '<h2 class="lit-search-heading">“' + esc(query) + '”的搜索结果</h2>' + searchResults(query);
    return;
  }
  if (curView === 'facts') { box.innerHTML = renderFacts(); return; }
  if (curView === 'clinic') { box.innerHTML = renderClinic(); return; }
  if (curView === 'relationships') { box.innerHTML = renderRelationships(); return; }
  if (curView === 'authors') { box.innerHTML = renderAuthors(); return; }
  const u = lunitById(curView);
  box.innerHTML = u ? renderUnit(u) : '';
}

function render() {
  renderChips();
  renderDirectory();
  renderMain();
  renderStats();
}

/* ---------- 交互 ---------- */
function focusReading(target) {
  const compactSidebar = document.querySelector('.lit-workspace[data-sl-mode="compact"][data-sl-open="true"] .sl-toggle:not(.sl-collapse)');
  compactSidebar?.click();
  target.setAttribute('tabindex', '-1');
  target.scrollIntoView({ block: 'start', behavior: 'instant' });
  target.focus({ preventScroll: true });
}

function openDirectory() {
  const group = document.getElementById('lit-directory');
  const closedSidebar = document.querySelector(
    '.lit-workspace[data-sl-mode="compact"][data-sl-open="false"] .sl-toggle:not(.sl-collapse), ' +
    '.lit-workspace[data-sl-mode="wide"][data-sl-collapsed="true"] .sl-collapse'
  );
  closedSidebar?.click();
  group.open = true;
  const summary = group.querySelector('summary');
  window.requestAnimationFrame(() => {
    summary.scrollIntoView({ block: 'nearest' });
    summary.focus({ preventScroll: true });
  });
}

function followReadingLink(hash) {
  if (window.location.hash !== hash) window.history.pushState(null, '', hash);
  openLinkedContent();
}

function selectView(id) {
  if (validView(id)) followReadingLink('#view-' + id);
}

function selectBook(id) {
  const book = LIT.classics.find(b => b.id === id);
  if (!book) return;
  selectedBook = id;
  selectedCharacter = book.characters[0].id;
  renderMain();
  window.history.pushState(null, '', '#relationships-' + id);
  document.querySelector('.lit-book-picker [aria-pressed="true"]')?.focus({ preventScroll: true });
}

function selectCharacter(id) {
  const book = LIT.classics.find(b => b.id === selectedBook);
  const person = book.characters.find(c => c.id === id);
  if (!person) return;
  selectedCharacter = id;
  document.querySelectorAll('.lit-person').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.id === id)));
  document.getElementById('lit-character-detail').innerHTML = characterDetail(book, person);
  window.history.pushState(null, '', '#relationships-' + book.id + '-' + id);
  const card = document.getElementById('character-' + book.id + '-' + id);
  card?.focus({ preventScroll: true });
  card?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function toggleLearn(unitId, pointId) {
  const key = unitId + '-' + pointId;
  if (lkState.learned[key]) delete lkState.learned[key];
  else lkState.learned[key] = true;
  lkSave();
  renderChips();
  renderStats();
  const card = document.getElementById('lesson-' + pointId);
  const button = card?.querySelector('.learn-btn');
  if (button) {
    const learned = !!lkState.learned[key];
    card.classList.toggle('learned', learned);
    button.classList.toggle('on', learned);
    button.setAttribute('aria-pressed', String(learned));
    button.textContent = learned ? '✓' : '';
  }
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) {
    const link = e.target.closest('#cards a[href^="#"]');
    if (link && query && link.hash === window.location.hash &&
        !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && openLinkedContent()) e.preventDefault();
    return;
  }
  const act = el.dataset.act;
  try {
    if (act === 'say') { e.preventDefault(); speak(el.dataset.t); }
    else if (act === 'learn') { e.preventDefault(); toggleLearn(el.dataset.unit, el.dataset.id); }
    else if (act === 'unit') { e.preventDefault(); selectView(el.dataset.id); }
    else if (act === 'lesson' && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      followReadingLink(el.hash);
    }
    else if (act === 'open-directory') openDirectory();
    else if (act === 'show-results') focusReading(document.getElementById('cards'));
    else if (act === 'book') { e.preventDefault(); selectBook(el.dataset.id); }
    else if (act === 'character') { e.preventDefault(); selectCharacter(el.dataset.id); }
    else if (act === 'branches') {
      document.querySelectorAll('.lit-tree-branch').forEach(branch => { branch.open = el.dataset.open === 'true'; });
    }
    else if (act === 'author-group') {
      authorGroup = el.dataset.group;
      renderMain();
      document.querySelector('.lit-filters [aria-pressed="true"]')?.focus({ preventScroll: true });
    }
    else if (act === 'print') { e.preventDefault(); window.print(); }
  } catch (err) {
    console.error('[文学常识] 操作出错:', err);
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

/* 供自动化测试使用 */
window.LitExplore = {
  get state() { return lkState; },
  get view() { return curView; },
  get query() { return query; },
  get selectedBook() { return selectedBook; },
  get selectedCharacter() { return selectedCharacter; },
  data: LIT,
  units: LIT.units,
  render, selectView, selectBook, selectCharacter, toggleLearn, searchResults,
};

function openLinkedContent() {
  const hash = window.location.hash;
  const lessonId = hash.match(/^#lesson-(lu\d+-\d+)$/)?.[1];
  const unit = LIT.units.find(unit => unit.points.some(point => point.id === lessonId));
  const viewId = hash.match(/^#view-([a-z0-9]+)$/)?.[1];
  const authorId = hash.match(/^#author-([a-z-]+)$/)?.[1];
  const author = LIT.authors.find(a => a.id === authorId);
  const relation = hash.match(/^#relationships-([a-z]+)(?:-([a-z]+))?$/);
  const book = relation && LIT.classics.find(b => b.id === relation[1]);
  let targetId = '';
  if (unit) { curView = unit.id; targetId = 'lesson-' + lessonId; }
  else if (author) { curView = 'authors'; authorGroup = '全部'; targetId = 'author-' + author.id; }
  else if (book) {
    curView = 'relationships';
    selectedBook = book.id;
    selectedCharacter = book.characters.find(c => c.id === relation[2])?.id || book.characters[0].id;
    if (relation[2]) targetId = 'character-' + book.id + '-' + selectedCharacter;
  }
  else if (validView(viewId)) curView = viewId;
  else if (!hash) curView = initialView;
  else return false;
  currentLesson = unit ? lessonId : '';
  lkState.last = curView;
  lkSave();
  query = '';
  document.getElementById('search').value = '';
  render();
  document.getElementById(lunitById(curView) ? 'lit-library' : 'lit-reference').open = true;
  const card = targetId && document.getElementById(targetId);
  focusReading(card || document.querySelector('#cards .unit-head h2') || document.getElementById('cards'));
  return true;
}

window.addEventListener('hashchange', openLinkedContent);
document.addEventListener('DOMContentLoaded', () => {
  if (!window.location.hash || !openLinkedContent()) {
    render();
    if (!lunitById(curView)) document.getElementById('lit-reference').open = true;
  }
});

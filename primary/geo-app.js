/* ============================================================
   乐学堂 · 地理探索 —— 界面逻辑
   站点切换 / 知识点卡（要点·想一想·易错·口诀）/ 之最速查 /
   地理小影院（B站点播）/ 地理小诊所
   搜索 / 点读 / 已掌握标记 / 撒花 / 滚动渐现 / 进度条 / 打印
   ============================================================ */
'use strict';

const GEO_STORE_KEY = 'geobook_v1';

/* ---------- 学习档案 ---------- */
let gkState = { last: 'gu1', learned: {} };
try {
  const raw = localStorage.getItem(GEO_STORE_KEY);
  if (raw) gkState = { ...{ last: 'gu1', learned: {} }, ...JSON.parse(raw) };
} catch (e) { /* 仅用内存状态 */ }
function gkSave() { try { localStorage.setItem(GEO_STORE_KEY, JSON.stringify(gkState)); } catch (e) {} }

/* ---------- 索引与视图状态 ---------- */
const GUNIT_BY_ID = {};
GEO.units.forEach(u => { GUNIT_BY_ID[u.id] = u; });
const TOTAL_POINTS = GEO.units.reduce((n, u) => n + u.points.length, 0);
const GEXTRA_VIEWS = [
  { id: 'facts', name: '之最速查', emoji: '🏆', color: '#b5893a', count: GEO.facts.reduce((n, f) => n + f.items.length, 0) },
  { id: 'cinema', name: '地理小影院', emoji: '🎬', color: '#0e7a8a', count: (window.GEO_VIDEOS && GEO_VIDEOS.list.length) || 0 },
  { id: 'clinic', name: '地理小诊所', emoji: '🩺', color: '#c2557d', count: GEO.mistakes.length },
];

/* ---------- 配图（站点横幅 + 知识点小照片） ---------- */
function gbanner(id) {
  return (window.GEO_PHOTOS && GEO_PHOTOS.banner(id)) || '';
}
function gpointPhoto(pid) {
  return (window.GEO_PHOTOS && GEO_PHOTOS.point(pid)) || null;
}

let curView = GUNIT_BY_ID[gkState.last] ? gkState.last : 'gu1';
let query = '';

function gunitById(id) { return GUNIT_BY_ID[id]; }
function pointKey(u, p) { return u.id + '-' + p.id; }
function totalLearned() { return GEO.units.reduce((n, u) => n + u.points.filter(p => gkState.learned[pointKey(u, p)]).length, 0); }

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
  const unitChips = GEO.units.map(u => {
    const learned = u.points.filter(p => gkState.learned[pointKey(u, p)]).length;
    const done = learned === u.points.length;
    const shortName = u.no.replace('第', '').replace('站', '') + ' ' + u.name;
    return '<button class="chip' + (u.id === curView && !query ? ' on' : '') + '" style="--c:' + u.color + '" data-act="unit" data-id="' + u.id + '">' +
      '<span class="chip-emoji">' + u.emoji + '</span><span class="chip-name">' + esc(shortName) + '</span>' +
      '<span class="chip-num' + (done ? ' full' : '') + '">' + learned + '/' + u.points.length + '</span></button>';
  });
  const extraChips = GEXTRA_VIEWS.map(v =>
    '<button class="chip' + (v.id === curView && !query ? ' on' : '') + '" style="--c:' + v.color + '" data-act="unit" data-id="' + v.id + '">' +
    '<span class="chip-emoji">' + v.emoji + '</span><span class="chip-name">' + esc(v.name) + '</span>' +
    '<span class="chip-num">' + v.count + '</span></button>');
  document.getElementById('chips').innerHTML = unitChips.join('') + extraChips.join('');
}

function renderStats() {
  const el = document.getElementById('stats');
  if (el) el.textContent = '已掌握 ' + totalLearned() + ' / ' + TOTAL_POINTS + ' 个知识点';
}

/* ---------- 知识点卡 ---------- */
function msec(label, inner) {
  return '<div class="ksec"><span class="seclabel">' + label + '</span>' + inner + '</div>';
}

function pointCard(u, p) {
  const key = pointKey(u, p);
  const learned = !!gkState.learned[key];
  const parts = [];

  parts.push('<article class="kcard' + (learned ? ' learned' : '') + '" style="--c:' + u.color + '">');
  parts.push('<div class="khead"><h3 class="ktitle">' + esc(p.title) + '</h3>' +
    '<span class="khead-gap"></span>' + sayBtn(p.title + '。' + p.overview) +
    '<button class="learn-btn' + (learned ? ' on' : '') + '" data-act="learn" data-unit="' + u.id + '" data-id="' + esc(p.id) + '" title="标记已掌握" aria-pressed="' + learned + '" aria-label="已掌握 ' + esc(p.title) + '">' + (learned ? '✓' : '') + '</button></div>');
  /* 概述 + 「世界真面目」实景小照片 */
  const pp = gpointPhoto(p.id);
  if (pp) {
    parts.push('<div class="k-overview has-photo">' +
      '<img class="ov-photo" src="' + pp.img + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' +
      '<div class="ov-txt"><div class="ov-main">' + esc(p.overview) + '</div>' +
      '<div class="ov-life">🌏 ' + esc(pp.life) + '</div></div></div>');
  } else {
    parts.push('<p class="k-overview">' + esc(p.overview) + '</p>');
  }
  if (p.fig && window.GeoFigures) parts.push(GeoFigures.figHTML(p.fig));

  if (p.items && p.items.length) {
    parts.push(msec('📖 要点', '<ul class="klist">' + p.items.map(m =>
      '<li><button class="kli" data-act="say" data-t="' + esc(m) + '">' + esc(m) + '</button></li>').join('') + '</ul>'));
  }
  if (p.example) {
    parts.push(msec('🤔 想一想', '<div class="mex">' +
      '<button class="mex-q" data-act="say" data-t="' + esc(p.example.q) + '">📌 ' + esc(p.example.q) + '</button>' +
      '<button class="mex-steps" data-act="say" data-t="' + esc(p.example.steps) + '">' + esc(p.example.steps) + '</button>' +
      '<button class="mex-a" data-act="say" data-t="' + esc(p.example.a) + '">✅ ' + esc(p.example.a) + '</button>' +
      '</div>'));
  }
  if (p.mistakes && p.mistakes.length) {
    parts.push(msec('⚠️ 易错', '<ul class="klist mis">' + p.mistakes.map(m =>
      '<li><button class="kli" data-act="say" data-t="' + esc(m) + '">⚠️ ' + esc(m) + '</button></li>').join('') + '</ul>'));
  }
  if (p.recall) {
    parts.push('<div class="krecite">💡 口诀：' + esc(p.recall) + '</div>');
  }
  parts.push('</article>');
  return parts.join('');
}

function renderUnit(u) {
  const photo = gbanner(u.id);
  const bannerSvg = !photo && u.banner && window.GeoFigures
    ? GeoFigures.figHTML(u.banner)
    : '';
  const banner = bannerSvg
    ? '<div class="unit-banner">' + bannerSvg + '</div>'
    : '';
  return '<div class="unit-head' + (photo ? ' has-photo' : '') + '" style="--c:' + u.color +
    (photo ? ';background-image:url(' + photo + ')' : '') + '">' +
    '<span class="unit-emoji">' + u.emoji + '</span>' +
    '<div><h1>' + esc(u.no) + ' · ' + esc(u.name) + '</h1>' +
    '<p>' + esc(u.intro) + '</p>' +
    '<div class="goal-tags">' + u.goals.map(g => '<span>🎯 ' + esc(g) + '</span>').join('') + '</div></div></div>' +
    banner +
    u.points.map(p => pointCard(u, p)).join('');
}

/* ---------- 之最速查 ---------- */
function factCard(f) {
  return '<article class="formula-card" style="--c:#b5893a">' +
    '<div class="phead"><h3>' + esc(f.title) + '</h3>' + sayBtn(f.title) + '</div>' +
    '<div class="frows">' + f.items.map(it =>
      '<button class="frow" data-act="say" data-t="' + esc(it[0] + '，' + it[1]) + '"><b>' + esc(it[0]) + '</b><span>' + esc(it[1]) + '</span></button>').join('') + '</div>' +
    '<p class="pnote">' + esc(f.note) + '</p></article>';
}

function renderFacts() {
  const photo = gbanner('facts');
  return '<div class="unit-head' + (photo ? ' has-photo' : '') + '" style="--c:#b5893a' +
    (photo ? ';background-image:url(' + photo + ')' : '') + '">' +
    '<span class="unit-emoji">🏆</span><div><h1>世界与中国之最速查</h1>' +
    '<p>' + GEO.facts.length + ' 组 · 点一行读一行</p></div></div>' +
    GEO.facts.map(factCard).join('');
}

/* ---------- 地理小影院 ---------- */
function durText(sec) {
  const m = Math.round(sec / 60);
  return m >= 60 ? Math.floor(m / 60) + ' 小时 ' + (m % 60) + ' 分' : m + ' 分钟';
}

function vidScreen(v) {
  return '<button class="vid-screen" data-act="play-video" data-vid="' + esc(v.id) + '" aria-label="播放：' + esc(v.title) + '">' +
    '<img class="vid-cover" src="' + esc(v.cover) + '" alt="" loading="lazy" onerror="this.style.opacity=\'0\'">' +
    '<span class="vid-shade"></span><span class="vid-play">▶</span>' +
    '<span class="vid-dur">⏱ ' + durText(v.dur) + '</span></button>';
}

function vidCard(v) {
  return '<article class="vid-card" style="--c:' + (v.color || '#0e7a8a') + '">' +
    vidScreen(v) +
    '<div class="vid-meta"><h4>' + esc(v.title) + '</h4>' +
    '<p>' + esc(v.up) + ' · ' + esc(v.note || '') + '</p>' +
    '<a class="vid-link" href="https://www.bilibili.com/video/' + esc(v.bvid) + '" target="_blank" rel="noopener">↗ 去B站看高清</a></div>' +
    '</article>';
}

function renderCinema() {
  if (!window.GEO_VIDEOS || !GEO_VIDEOS.list.length) {
    return '<div class="empty">🎬 视频整理中，先去别的站点逛逛吧～</div>';
  }
  const photo = gbanner('cinema');
  let s = '<div class="unit-head' + (photo ? ' has-photo' : '') + '" style="--c:#0e7a8a' +
    (photo ? ';background-image:url(' + photo + ')' : '') + '">' +
    '<span class="unit-emoji">🎬</span><div><h1>地理小影院</h1>' +
    '<p>' + GEO_VIDEOS.list.length + ' 部好片 · 点封面在线看（需要联网），只挑适合小朋友的</p></div></div>';
  GEO_VIDEOS.groups.forEach(g => {
    const items = GEO_VIDEOS.list.filter(v => v.group === g.id);
    if (!items.length) return;
    s += '<h2 class="cinema-group">' + g.emoji + ' ' + esc(g.name) + '<span>' + esc(g.desc) + '</span></h2>' +
      '<div class="vid-grid">' + items.map(vidCard).join('') + '</div>';
  });
  /* 打印时用片名清单代替视频卡片 */
  s += '<ul class="cinema-print-list">' + GEO_VIDEOS.list.map(v =>
    '<li>《' + esc(v.title) + '》— ' + esc(v.up) + '（' + durText(v.dur) + '，B站搜标题或 BV' + esc(v.bvid.replace(/^BV/, '')) + '）</li>').join('') + '</ul>';
  return s;
}

/* ---------- 地理小诊所 ---------- */
function renderClinic() {
  const photo = gbanner('clinic');
  return '<div class="unit-head' + (photo ? ' has-photo' : '') + '" style="--c:#c2557d' +
    (photo ? ';background-image:url(' + photo + ')' : '') + '">' +
    '<span class="unit-emoji">🩺</span><div><h1>地理小诊所</h1>' +
    '<p>考前把这张「错处清单」过一遍</p></div></div>' +
    '<div class="wgrid">' + GEO.mistakes.map(m =>
      '<article class="mistake-card" style="--c:#c2557d">' +
      '<span class="unit-tag" style="background:#c2557d">' + esc(m.unit) + '</span>' +
      '<button class="mist-row wrong-row-text" data-act="say" data-t="' + esc(m.wrong) + '"><span class="mist-mark">❌</span>' + esc(m.wrong) + '</button>' +
      '<button class="mist-row right-row-text" data-act="say" data-t="' + esc(m.right) + '"><span class="mist-mark">✅</span>' + esc(m.right) + '</button>' +
      '</article>').join('') + '</div>';
}

/* ---------- 搜索 ---------- */
function searchResults(q) {
  const ql = q.toLowerCase();
  const pointHits = [];
  GEO.units.forEach(u => u.points.forEach(p => {
    const hay = [p.title, p.overview, (p.items || []).join(''), p.recall || '',
      p.example ? p.example.q + p.example.a + p.example.steps : '', (p.mistakes || []).join('')].join(' ').toLowerCase();
    if (hay.includes(ql)) pointHits.push({ u, p });
  }));
  const factHits = GEO.facts.map(f => ({
    title: f.title, note: f.note,
    items: f.items.filter(it => (it[0] + ' ' + it[1]).toLowerCase().includes(ql)),
  })).filter(f => f.items.length);
  const mistakeHits = GEO.mistakes.filter(m =>
    (m.unit + m.wrong + m.right).toLowerCase().includes(ql));

  const out = [];
  if (pointHits.length) {
    out.push('<div class="search-head">🔎 找到 ' + pointHits.length + ' 个知识点</div>');
    GEO.units.forEach(u => {
      const hits = pointHits.filter(h => h.u === u);
      if (hits.length) out.push(hits.map(h => pointCard(u, h.p)).join(''));
    });
  }
  if (factHits.length) {
    out.push('<div class="search-head">🏆 匹配的之最</div>' + factHits.map(f =>
      '<article class="formula-card" style="--c:#b5893a"><div class="phead"><h3>' + esc(f.title) + '</h3></div>' +
      '<div class="frows">' + f.items.map(it =>
        '<button class="frow" data-act="say" data-t="' + esc(it[0] + '，' + it[1]) + '"><b>' + esc(it[0]) + '</b><span>' + esc(it[1]) + '</span></button>').join('') + '</div></article>').join(''));
  }
  if (mistakeHits.length) {
    out.push('<div class="search-head">🩺 匹配的易错点</div><div class="wgrid">' + mistakeHits.map(m =>
      '<article class="mistake-card" style="--c:#c2557d">' +
      '<span class="unit-tag" style="background:#c2557d">' + esc(m.unit) + '</span>' +
      '<button class="mist-row wrong-row-text" data-act="say" data-t="' + esc(m.wrong) + '"><span class="mist-mark">❌</span>' + esc(m.wrong) + '</button>' +
      '<button class="mist-row right-row-text" data-act="say" data-t="' + esc(m.right) + '"><span class="mist-mark">✅</span>' + esc(m.right) + '</button>' +
      '</article>').join('') + '</div>');
  }
  if (!out.length) out.push('<div class="empty">🌍 没有找到「' + esc(q) + '」，换个词试试～</div>');
  return out.join('');
}

/* ---------- 渲染 ---------- */
function renderMain() {
  const box = document.getElementById('cards');
  if (query) {
    box.innerHTML = searchResults(query);
    return;
  }
  if (curView === 'facts') { box.innerHTML = renderFacts(); return; }
  if (curView === 'cinema') { box.innerHTML = renderCinema(); return; }
  if (curView === 'clinic') { box.innerHTML = renderClinic(); return; }
  const u = gunitById(curView);
  box.innerHTML = u ? renderUnit(u) : '';
}

/* ---------- 滚动渐现：内容像画卷一样展开 ---------- */
let revealIO = null;
function setupReveal() {
  const els = document.querySelectorAll('#cards .kcard, #cards .formula-card, #cards .mistake-card, #cards .vid-card, #cards .unit-head');
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('in-view'));
    return;
  }
  if (revealIO) revealIO.disconnect();
  revealIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('in-view');
        revealIO.unobserve(en.target);
      }
    });
  }, { rootMargin: '0px 0px -4% 0px', threshold: .04 });
  els.forEach(el => {
    el.classList.add('reveal');
    revealIO.observe(el);
  });
}

/* ---------- 顶部进度条 ---------- */
function updateProgress() {
  const bar = document.getElementById('progress-bar');
  if (!bar) return;
  const pct = TOTAL_POINTS ? Math.round(totalLearned() / TOTAL_POINTS * 100) : 0;
  bar.style.width = pct + '%';
}

/* ---------- 掌握撒花 ---------- */
function confettiBurst(x, y) {
  const bits = ['⭐', '🎉', '✨', '🎊', '🏆'];
  const colors = ['#f6b93b', '#e25563', '#2fbf71', '#2f9bd6', '#8b65c9'];
  for (let i = 0; i < 18; i++) {
    const s = document.createElement('span');
    s.className = 'confetti';
    s.textContent = i % 2 ? bits[i % bits.length] : '●';
    if (!(i % 2)) s.style.color = colors[i % colors.length];
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    s.style.setProperty('--dx', (Math.random() * 220 - 110).toFixed(0) + 'px');
    s.style.setProperty('--dy', (-70 - Math.random() * 150).toFixed(0) + 'px');
    s.style.setProperty('--rot', (Math.random() * 340 - 170).toFixed(0) + 'deg');
    s.style.animationDelay = (Math.random() * .12).toFixed(2) + 's';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1200);
  }
}

function render() {
  renderChips();
  renderMain();
  renderStats();
  setupReveal();
  updateProgress();
}

/* ---------- 交互 ---------- */
function selectView(id) {
  curView = id;
  if (GUNIT_BY_ID[id]) gkState.last = id;
  gkSave();
  query = '';
  const search = document.getElementById('search');
  if (search) search.value = '';
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleLearn(unitId, pointId) {
  const key = unitId + '-' + pointId;
  const wasLearned = !!gkState.learned[key];
  let cx = window.innerWidth / 2, cy = window.innerHeight / 3;
  const btn = document.querySelector('[data-act="learn"][data-unit="' + unitId + '"][data-id="' + pointId + '"]');
  if (btn) {
    const r = btn.getBoundingClientRect();
    cx = r.left + r.width / 2;
    cy = r.top + r.height / 2;
  }
  if (wasLearned) delete gkState.learned[key];
  else { gkState.learned[key] = true; confettiBurst(cx, cy); }
  gkSave();
  render();
}

function playVideo(id) {
  const v = (window.GEO_VIDEOS && GEO_VIDEOS.byId(id)) || null;
  const screen = document.querySelector('.vid-screen[data-vid="' + id + '"]');
  if (!v || !screen || screen.dataset.playing) return;
  screen.dataset.playing = '1';
  screen.innerHTML = '<iframe class="vid-iframe" src="' + GEO_VIDEOS.embedUrl(v.bvid) +
    '" scrolling="no" frameborder="0" allowfullscreen="true" title="' + esc(v.title) + '" allow="autoplay; fullscreen"></iframe>' +
    '<span class="vid-close" title="收起视频">✕</span>';
}

function closeVideo(screen) {
  const v = (window.GEO_VIDEOS && GEO_VIDEOS.byId(screen.dataset.vid)) || null;
  if (!v || !screen) return;
  delete screen.dataset.playing;
  screen.innerHTML = '<img class="vid-cover" src="' + esc(v.cover) + '" alt="" loading="lazy" onerror="this.style.opacity=\'0\'">' +
    '<span class="vid-shade"></span><span class="vid-play">▶</span>' +
    '<span class="vid-dur">⏱ ' + durText(v.dur) + '</span>';
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  try {
    if (act === 'say') { e.preventDefault(); speak(el.dataset.t); }
    else if (act === 'learn') { e.preventDefault(); toggleLearn(el.dataset.unit, el.dataset.id); }
    else if (act === 'unit') { e.preventDefault(); selectView(el.dataset.id); }
    else if (act === 'play-video') {
      e.preventDefault();
      if (e.target.classList.contains('vid-close')) { closeVideo(el); return; }
      playVideo(el.dataset.vid);
    }
    else if (act === 'print') { e.preventDefault(); window.print(); }
    else if (act === 'home') { e.preventDefault(); window.location.href = 'index.html'; }
  } catch (err) {
    console.error('[地理探索] 操作出错:', err);
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
window.GeoExplore = {
  get state() { return gkState; },
  get view() { return curView; },
  get query() { return query; },
  data: GEO,
  units: GEO.units,
  render, selectView, toggleLearn, searchResults, playVideo, renderCinema,
};

render();

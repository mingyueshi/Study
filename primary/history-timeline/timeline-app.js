/* 历史双轨时间轴页：渲染时代带与双轨事件卡，提供筛选与同期对照跳转。
   事件卡渲染与对照工具在 shared.js，时代站详情页为 era.html?era=时代id。 */
(() => {
  'use strict';
  const root = document.querySelector('.timeline-topic');
  if (!root) return;
  const $ = id => root.querySelector(`#${id}`);
  const esc = window.TLShared.esc;

  const eras = window.TIMELINE_ERAS || [];
  const events = window.TIMELINE_EVENTS || [];
  const pairs = window.TIMELINE_PAIRS || [];
  const spotlights = window.TIMELINE_SPOTLIGHTS || [];
  if (!eras.length || !events.length) {
    $('timeline-flow').innerHTML = '<p class="tl-notice">数据文件尚未完整加载。请确认已保存整个目录，并重新打开页面。</p>';
    return;
  }

  const ctx = window.TLShared.makeContext(events, pairs);
  const eventMap = ctx.eventMap;
  const pairMap = ctx.pairMap;
  const pairNo = ctx.pairNo;
  const eraMap = new Map(eras.map(e => [e.id, e]));

  /* 事件按时代归位，各自轨内按年代排序，渲染顺序以 sort 为准。 */
  const byEra = new Map(eras.map(e => [e.id, { china: [], world: [] }]));
  events.forEach(ev => {
    const bucket = byEra.get(ev.era);
    if (!bucket || !bucket[ev.track]) return;
    bucket[ev.track].push(ev);
  });
  Object.values(byEra).forEach(bucket => {
    bucket.china.sort((a, b) => a.sort - b.sort);
    bucket.world.sort((a, b) => a.sort - b.sort);
  });

  let statusTimer;
  const status = message => {
    const el = $('tl-status');
    el.textContent = message;
    el.classList.add('visible');
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => el.classList.remove('visible'), 4200);
  };

  function cardHTML(ev) {
    return ctx.cardHTML(ev);
  }

  function pairOfEvent(id) {
    return ctx.pairOfEvent(id);
  }

  function eraHTML(era) {
    const bucket = byEra.get(era.id) || { china: [], world: [] };
    return `<section class="tl-era" id="era-${esc(era.id)}" style="--era-accent:${esc(era.accent)}">` +
      `<header class="tl-era-head">` +
        `<div class="tl-era-title"><span class="tl-era-no" aria-hidden="true">${era.no}</span>` +
        `<div><h2>${esc(era.name)}</h2><p class="tl-era-span">${esc(era.span)}</p></div>` +
        `<a class="tl-era-link" href="era.html?era=${esc(era.id)}">进时代站细看 →</a></div>` +
        `<p class="tl-era-compare"><span aria-hidden="true">⇄</span>${esc(era.compare)}</p>` +
      `</header>` +
      `<div class="tl-era-grid">` +
        `<div class="tl-track tl-track-china"><p class="tl-track-label china-label"><span aria-hidden="true">🏮</span>中国线</p>${bucket.china.map(cardHTML).join('')}</div>` +
        `<div class="tl-spine" aria-hidden="true"><span class="tl-spine-node"></span><span class="tl-spine-tail">▼</span></div>` +
        `<div class="tl-track tl-track-world"><p class="tl-track-label world-label"><span aria-hidden="true">🌍</span>世界线</p>${bucket.world.map(cardHTML).join('')}</div>` +
      `</div></section>`;
  }

  function spotlightHTML(pairId) {
    const pair = pairMap.get(pairId);
    if (!pair) return '';
    const a = eventMap.get(pair.china);
    const b = eventMap.get(pair.world);
    return `<button class="tl-spotlight" data-spotlight="${esc(pair.id)}">` +
      `<span class="tl-pair-badge">对照 ${pairNo(pair.id)}</span>` +
      `<span class="tl-spotlight-row china"><span class="tl-spotlight-year">${esc(a.year)}</span><b>${esc(a.title)}</b></span>` +
      `<span class="tl-spotlight-row world"><span class="tl-spotlight-year">${esc(b.year)}</span><b>${esc(b.title)}</b></span>` +
      `<span class="tl-spotlight-label">${esc(pair.label)}</span></button>`;
  }

  /* ---------- 渲染 ---------- */
  $('stat-eras').textContent = eras.length;
  $('stat-events').textContent = events.length;
  $('stat-pairs').textContent = pairs.length;
  $('spotlights').innerHTML = spotlights.map(spotlightHTML).join('');
  $('era-nav').innerHTML = eras.map(e =>
    `<a class="tl-era-chip" href="#era-${esc(e.id)}" style="--era-accent:${esc(e.accent)}"><span aria-hidden="true">${e.no}</span>${esc(e.name)}</a>`).join('');
  const dynasties = window.TIMELINE_DYNASTIES || [];
  $('dynasty-strip').innerHTML = dynasties.map(d => {
    const era = eraMap.get(d.era);
    return `<a class="tl-dynasty-chip" href="#era-${esc(d.era)}" style="--era-accent:${esc(era ? era.accent : '#b07d3a')}">` +
      `<b>${esc(d.name)}</b><small>${esc(d.span)}</small>${d.note ? `<span class="tl-dynasty-note">${esc(d.note)}</span>` : ''}</a>`;
  }).join('');
  $('timeline-flow').innerHTML =
    '<p class="tl-flow-hint">⬇ 时间向下流动，越往下越接近现在</p>' +
    eras.map(eraHTML).join('') +
    '<p class="tl-flow-end">时间追到了今天——接下来的故事，正等着你们去书写。</p>';

  /* ---------- 筛选 ---------- */
  const MODE_LABEL = { all: '全部', china: '中国史', world: '世界史', pair: '对照时刻' };
  let mode = 'all';
  function setMode(next, announce = true) {
    mode = next;
    $('timeline-flow').dataset.mode = next;
    root.querySelectorAll('.tl-filters button').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.mode === next)));
    if (announce) status(next === 'all' ? '已显示完整双轨时间轴。' : `已切换到「${MODE_LABEL[next]}」视角。`);
  }
  root.querySelectorAll('.tl-filters button').forEach(b =>
    b.addEventListener('click', () => setMode(b.dataset.mode)));

  /* ---------- 对照跳转 ---------- */
  function flashCard(id) {
    const card = $(`card-${id}`);
    if (!card) return null;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.remove('flash');
    void card.offsetWidth;
    card.classList.add('flash');
    return card;
  }
  function ensureVisible(targetId) {
    /* 目标轨被当前视角隐藏时，先回到完整双轨再跳转。 */
    const target = eventMap.get(targetId);
    if (!target) return;
    const hidden = (mode === 'china' && target.track === 'world') || (mode === 'world' && target.track === 'china');
    if (hidden) setMode('all', false);
  }
  root.addEventListener('click', event => {
    const pairBtn = event.target.closest('.tl-pair-btn');
    if (pairBtn) {
      const pair = pairMap.get(pairBtn.dataset.pair);
      const other = pair.china === pairBtn.dataset.from ? pair.world : pair.china;
      ensureVisible(other);
      flashCard(other);
      status(`同期对照 ${pairNo(pair.id)}：${pair.label}`);
      return;
    }
    const spotBtn = event.target.closest('.tl-spotlight');
    if (spotBtn) {
      const pair = pairMap.get(spotBtn.dataset.spotlight);
      ensureVisible(pair.china);
      flashCard(pair.china);
      flashCard(pair.world);
      status(`同期对照 ${pairNo(pair.id)}：${pair.label}`);
    }
  });

  setMode('all', false);
})();

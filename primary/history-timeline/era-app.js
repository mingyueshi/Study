/* 时代站详情页：按 ?era=时代id 渲染单个时代的双轨事件与同期对照。
   事件卡渲染复用 shared.js，数据来自 content.js 与 timeline-data.js。 */
(() => {
  'use strict';
  const root = document.querySelector('.era-topic');
  if (!root) return;
  const $ = id => root.querySelector(`#${id}`);
  const esc = window.TLShared.esc;

  const eras = window.TIMELINE_ERAS || [];
  const events = window.TIMELINE_EVENTS || [];
  const pairs = window.TIMELINE_PAIRS || [];
  const ctx = window.TLShared.makeContext(events, pairs);
  const slot = $('era-page');

  const eraId = new URLSearchParams(location.search).get('era');
  const index = eras.findIndex(e => e.id === eraId);
  if (index < 0) {
    $('crumb-here').textContent = '没有找到这个时代';
    slot.innerHTML = '<section class="tl-era-head era-missing"><h2>没有找到这个时代站</h2>' +
      '<p>从下面的列表重新进站：</p><div class="tl-station-grid">' +
      eras.map(e => `<a class="tl-station" href="era.html?era=${esc(e.id)}" style="--era-accent:${esc(e.accent)}">` +
        `<span class="tl-station-no" aria-hidden="true">${e.no}</span><b>${esc(e.name)}</b><small>${esc(e.span)}</small>` +
        `<span class="tl-station-go" aria-hidden="true">进站 →</span></a>`).join('') +
      '</div></section>';
    return;
  }
  const era = eras[index];
  const prev = eras[index - 1];
  const next = eras[index + 1];
  document.title = `时代站 · ${era.name} · 历史时间轴`;
  $('crumb-here').textContent = `第 ${era.no} 站 · ${era.name}`;
  /* 页头渐变、编号圆点与脊轴都依赖 --era-accent，挂在容器上统一供给。 */
  slot.style.setProperty('--era-accent', era.accent);

  const bucket = { china: [], world: [] };
  events.forEach(ev => { if (ev.era === era.id && bucket[ev.track]) bucket[ev.track].push(ev); });
  bucket.china.sort((a, b) => a.sort - b.sort);
  bucket.world.sort((a, b) => a.sort - b.sort);
  const eraPairs = pairs.filter(p => {
    const a = ctx.eventMap.get(p.china);
    const b = ctx.eventMap.get(p.world);
    return a && b && a.era === era.id;
  });

  let html = `<header class="tl-era-head era-page-head">` +
    `<div class="tl-era-title"><span class="tl-era-no" aria-hidden="true">${era.no}</span>` +
    `<div><h2>${esc(era.name)}</h2><p class="tl-era-span">${esc(era.span)}</p></div>` +
    `<a class="tl-era-link" href="timeline.html#era-${esc(era.id)}">在完整时间轴中查看 ↗</a></div>` +
    `<p class="tl-era-compare"><span aria-hidden="true">⇄</span>${esc(era.compare)}</p></header>` +
    `<div class="tl-era-grid">` +
    `<div class="tl-track tl-track-china"><p class="tl-track-label china-label"><span aria-hidden="true">🏮</span>中国线</p>${bucket.china.map(ctx.cardHTML).join('')}</div>` +
    `<div class="tl-spine" aria-hidden="true"><span class="tl-spine-node"></span><span class="tl-spine-tail">▼</span></div>` +
    `<div class="tl-track tl-track-world"><p class="tl-track-label world-label"><span aria-hidden="true">🌍</span>世界线</p>${bucket.world.map(ctx.cardHTML).join('')}</div>` +
    `</div>`;

  if (eraPairs.length) {
    html += `<section class="era-pairs" aria-labelledby="era-pairs-title"><h2 id="era-pairs-title">这一站的同期对照</h2>` +
      `<div class="era-pairs-grid">${eraPairs.map(p => {
        const a = ctx.eventMap.get(p.china);
        const b = ctx.eventMap.get(p.world);
        return `<button class="tl-spotlight" data-spotlight="${esc(p.id)}">` +
          `<span class="tl-pair-badge">对照 ${ctx.pairNo(p.id)}</span>` +
          `<span class="tl-spotlight-row china"><span class="tl-spotlight-year">${esc(a.year)}</span><b>${esc(a.title)}</b></span>` +
          `<span class="tl-spotlight-row world"><span class="tl-spotlight-year">${esc(b.year)}</span><b>${esc(b.title)}</b></span>` +
          `<span class="tl-spotlight-label">${esc(p.label)}</span></button>`;
      }).join('')}</div></section>`;
  }

  html += `<nav class="era-pager" aria-label="上一站下一站">` +
    (prev ? `<a class="era-pager-btn" href="era.html?era=${esc(prev.id)}"><small>上一站</small><b>${esc(prev.name)}</b></a>` : '<span></span>') +
    `<a class="era-pager-btn era-pager-home" href="timeline.html">↩ 回双轨时间轴</a>` +
    (next ? `<a class="era-pager-btn" href="era.html?era=${esc(next.id)}"><small>下一站</small><b>${esc(next.name)}</b></a>` : '<span></span>') +
    `</nav>`;

  slot.innerHTML = html;

  let statusTimer;
  const status = message => {
    const el = $('tl-status');
    el.textContent = message;
    el.classList.add('visible');
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => el.classList.remove('visible'), 4200);
  };
  const flashCard = id => {
    const card = $(`card-${id}`);
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.remove('flash');
    void card.offsetWidth;
    card.classList.add('flash');
  };
  root.addEventListener('click', event => {
    const btn = event.target.closest('.tl-pair-btn, .tl-spotlight');
    if (!btn) return;
    const pair = ctx.pairMap.get(btn.dataset.pair || btn.dataset.spotlight);
    if (!pair) return;
    flashCard(pair.china);
    flashCard(pair.world);
    status(`同期对照 ${ctx.pairNo(pair.id)}：${pair.label}`);
  });
})();

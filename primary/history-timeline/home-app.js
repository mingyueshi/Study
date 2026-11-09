/* 系统门户：渲染数据规模与八个时代站导航（页面入口卡为静态 HTML）。 */
(() => {
  'use strict';
  const root = document.querySelector('.home-topic');
  if (!root) return;
  const $ = id => root.querySelector(`#${id}`);
  const esc = window.TLShared.esc;

  const eras = window.TIMELINE_ERAS || [];
  const events = window.TIMELINE_EVENTS || [];
  const pairs = window.TIMELINE_PAIRS || [];
  const dynasties = window.TIMELINE_DYNASTIES || [];

  $('stat-eras').textContent = eras.length;
  $('stat-events').textContent = events.length;
  $('stat-pairs').textContent = pairs.length;
  $('stat-dynasties').textContent = dynasties.length;
  $('station-grid').innerHTML = eras.map(e =>
    `<a class="tl-station" href="era.html?era=${esc(e.id)}" style="--era-accent:${esc(e.accent)}">` +
    `<span class="tl-station-no" aria-hidden="true">${e.no}</span>` +
    `<b>${esc(e.name)}</b><small>${esc(e.span)}</small>` +
    `<span class="tl-station-go" aria-hidden="true">进站 →</span></a>`).join('');
})();

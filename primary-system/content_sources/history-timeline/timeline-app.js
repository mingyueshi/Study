/* 总时间轴按时代展现共用年代行，视角与搜索可叠加。 */
(() => {
  'use strict';
  const root = document.querySelector('.timeline-topic');
  const $ = id => document.getElementById(id);
  const { esc, makeContext, eraHref, dynastyHref, mediaFor, bindAnchors } = window.TLShared;
  const eras = window.TIMELINE_ERAS;
  const events = window.TIMELINE_EVENTS;
  const pairs = window.TIMELINE_PAIRS;
  const flow = $('timeline-flow');
  if (!eras?.length || !events?.length) {
    flow.innerHTML = '<p class="tl-notice">数据文件尚未完整加载。请确认已保存整个目录，再重新打开页面。</p>';
    return;
  }

  const ctx = makeContext(eras, events, pairs);
  $('stat-eras').textContent = eras.length;
  $('stat-events').textContent = events.length;
  $('stat-pairs').textContent = pairs.length;
  $('spotlights').innerHTML = window.TIMELINE_SPOTLIGHTS.map(id => ctx.spotlightHTML(ctx.pairMap.get(id))).join('');
  $('era-nav').innerHTML = eras.map(era =>
    `<a class="tl-era-chip" href="#era-${esc(era.id)}" style="--era-accent:${esc(era.accent)}"><span aria-hidden="true">${era.no}</span>${esc(era.name)}</a>`).join('');
  $('dynasty-strip').innerHTML = window.DYNASTY_BANDS.map(band =>
    `<a class="tl-dynasty-chip" href="${dynastyHref(band)}" style="--era-accent:${esc(ctx.eraMap.get(band.era).accent)}">
      <b>${esc(band.name)}</b><small>${esc(band.span)}</small>
    </a>`).join('');
  flow.innerHTML = eras.map(era => `<section class="tl-era" id="era-${esc(era.id)}" style="--era-accent:${esc(era.accent)}" data-tl-anchor tabindex="-1">
    <header class="tl-era-head">
      <div class="tl-era-title">
        <span class="tl-era-no" aria-hidden="true">${era.no}</span>
        <div><h2>${esc(era.name)}</h2><p class="tl-era-span">${esc(era.span)}</p></div>
        <a class="tl-era-link" href="${eraHref(era)}">进入时代站 →</a>
      </div>
      <p class="tl-era-compare">${esc(era.compare)}</p>
    </header>
    ${ctx.rowsHTML(era, { compact: true })}
  </section>`).join('');

  const search = $('event-search');
  const mediaOnly = $('media-only');
  const tools = $('timeline-tools');
  const results = $('timeline-results');
  const narrow = matchMedia('(width < 720px)');

  function syncTools() {
    tools.open = !narrow.matches || location.hash === '#timeline-tools';
  }
  syncTools();
  narrow.addEventListener('change', syncTools);
  window.addEventListener('hashchange', () => {
    if (location.hash === '#timeline-tools') tools.open = true;
  });
  const buttons = [...root.querySelectorAll('.tl-filters button')];
  const sections = [...flow.querySelectorAll('.tl-era')];
  const rows = [...flow.querySelectorAll('.tl-date-row')];
  const cards = [...flow.querySelectorAll('.tl-card')];
  const normalize = value => value.normalize('NFKC').replace(/\s/g, '').toLowerCase();
  const searchIndex = new Map(events.map(ev => [ev.id, normalize(ev.title + ' ' + ev.tag + ' ' + ev.year + ' ' + ev.text)]));
  let mode = 'all';

  function filter() {
    const query = normalize(search.value);
    let count = 0;
    for (const card of cards) {
      const ev = ctx.eventMap.get(card.dataset.event);
      const matchesTrack = mode === 'all' || mode === ev.track || (mode === 'pair' && ctx.pairOfEvent.has(ev.id));
      card.hidden = !matchesTrack || !searchIndex.get(ev.id).includes(query) || (mediaOnly.checked && !mediaFor(ev).length);
      count += Number(!card.hidden);
    }
    for (const row of rows) row.hidden = !row.querySelector('.tl-card:not([hidden])');
    sections.forEach((section, i) => {
      section.hidden = !section.querySelector('.tl-date-row:not([hidden])');
      $('era-nav').children[i].hidden = section.hidden;
    });
    flow.dataset.mode = mode;
    $('event-count').textContent = `显示 ${count} / ${events.length} 件大事`;
    $('no-events').hidden = count > 0;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  }

  function resetFilters() {
    search.value = '';
    mediaOnly.checked = false;
    mode = 'all';
    filter();
  }

  function showFilteredResults() {
    filter();
    if (!narrow.matches) results.scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  search.addEventListener('input', showFilteredResults);
  mediaOnly.addEventListener('change', showFilteredResults);
  $('reset-filters').addEventListener('click', () => {
    resetFilters();
    tools.open = true;
    search.focus();
  });
  buttons.forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.mode;
    showFilteredResults();
  }));
  filter();

  // 动态片段在 file:// 下也能定位。对照事件被筛掉时，恢复全览再跳转。
  bindAnchors(root, target => {
    if (narrow.matches) tools.open = false;
    if (target.closest('[hidden]')) resetFilters();
  });
})();

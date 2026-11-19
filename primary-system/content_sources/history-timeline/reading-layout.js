/* 时代站与大事详情共用阅读目录，离线页面使用原生折叠。 */
window.TLReadingLayout = (() => {
  'use strict';
  const {esc, trackName, eraHref, eventHref, bindAnchors} = window.TLShared;

  function stationsHTML(eras, current, eventPage = false) {
    return eras.map(era => `<a class="tl-era-chip" href="${eraHref(era)}" style="--era-accent:${esc(era.accent)}"
      ${era === current ? (eventPage ? 'id="event-era" data-tl-anchor aria-current="location"' : 'aria-current="page"') : ''}>
      <span aria-hidden="true">${era.no}</span>${esc(era.name)}
    </a>`).join('');
  }

  function eventsHTML(events, current) {
    return `<nav class="timeline-event-directory" aria-label="本时代事件">${events.map(ev =>
      `<a href="${current ? eventHref(ev) : '#card-' + encodeURIComponent(ev.id)}" ${ev === current ? 'aria-current="page"' : ''}>
        <small>${trackName[ev.track]} · ${esc(ev.year)}</small>
        <b>${esc(ev.title)}</b>
      </a>`).join('')}</nav>`;
  }

  function bind(root) {
    const workspace = root.querySelector('.timeline-topic');
    const sidebar = workspace.querySelector('.timeline-sidebar');
    const localTools = sidebar.querySelector('.timeline-local-tools');
    const standalone = !root.closest('.study-timeline');
    const narrow = matchMedia('(width < 900px)');
    const hashTarget = () => document.getElementById(location.hash.slice(1));

    if (standalone) {
      const syncTools = () => { localTools.open = !narrow.matches || sidebar.contains(hashTarget()); };
      syncTools();
      narrow.addEventListener('change', syncTools);
    }
    bindAnchors(root, target => {
      const button = workspace.querySelector('.sl-toggle:not(.sl-collapse)');
      if (sidebar.contains(target)) {
        for (let details = target.closest('details'); details; details = details.parentElement.closest('details')) {
          details.open = true;
        }
        if (workspace.dataset.slMode === 'compact' && workspace.dataset.slOpen !== 'true') button?.click();
        if (workspace.dataset.slMode === 'wide' && workspace.dataset.slCollapsed === 'true') workspace.querySelector('.sl-collapse')?.click();
      } else {
        if (standalone && narrow.matches) localTools.open = false;
        if (workspace.dataset.slMode === 'compact' && workspace.dataset.slOpen === 'true') button?.click();
      }
    });
    window.addEventListener('load', () => requestAnimationFrame(() => {
      const target = hashTarget();
      if (root.contains(target) && target.hasAttribute('data-tl-anchor')) target.scrollIntoView({block: 'nearest', behavior: 'instant'});
    }), {once: true});
  }

  return {stationsHTML, eventsHTML, bind};
})();

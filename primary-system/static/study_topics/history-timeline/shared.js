/* 多页面共用的事件索引、时间轴和链接。 */
window.TLShared = (() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const circled = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳㉑㉒㉓㉔㉕㉖㉗㉘㉙㉚㉛㉜㉝㉞㉟㊱㊲㊳㊴㊵㊶㊷㊸㊹㊺㊻㊼㊽㊾㊿';
  const trackName = { china: '中国史', world: '世界史' };
  const eraHref = era => 'era.html?era=' + encodeURIComponent(era.id);
  const eventHref = ev => 'event.html?event=' + encodeURIComponent(ev.id);
  const mediaFor = ev => window.TIMELINE_MEDIA?.[ev.id] || [];
  const mediaHref = ev => eventHref(ev) + '#event-media';
  const dynastyHref = band => 'dynasties.html#dyn-' + encodeURIComponent(band.id);

  function makeContext(eras, events, pairs) {
    const eraMap = new Map(eras.map(era => [era.id, era]));
    const eventMap = new Map(events.map(ev => [ev.id, ev]));
    const pairMap = new Map(pairs.map(pair => [pair.id, pair]));
    const pairNumbers = new Map(pairs.map((pair, i) => [pair.id, circled[i] || String(i + 1)]));
    const pairOfEvent = new Map();
    pairs.forEach(pair => {
      pairOfEvent.set(pair.china, pair);
      pairOfEvent.set(pair.world, pair);
    });

    // 按时代分组，两轨共用年代行。同一行按 sort 对齐，年代间距不按比例。
    const byEra = new Map(eras.map(era => [era.id, []]));
    const ordered = [...events].sort((a, b) => a.sort - b.sort);
    for (const ev of ordered) {
      const rows = byEra.get(ev.era);
      const row = rows.at(-1);
      if (row?.[0].sort === ev.sort) row.push(ev);
      else rows.push([ev]);
    }

    const pairNo = pair => pairNumbers.get(pair.id);
    const counterpart = (pair, ev) => eventMap.get(pair.china === ev.id ? pair.world : pair.china);

    function cardHTML(ev, compact) {
      const pair = pairOfEvent.get(ev.id);
      const other = pair && counterpart(pair, ev);
      const pairLink = pair
        ? `<a class="tl-pair-btn" href="#card-${esc(other.id)}" aria-label="同期对照 ${pairNo(pair)}，跳到${esc(other.title)}">同期对照 ${pairNo(pair)} ↗</a>`
        : '';
      return `<article class="tl-card ${ev.track}" id="card-${esc(ev.id)}" data-event="${esc(ev.id)}" data-tl-anchor tabindex="-1">
        <div class="tl-card-top"><span class="tl-year">${esc(ev.year)}</span><span class="tl-tag">${trackName[ev.track]} · ${esc(ev.tag)}</span>
          ${mediaFor(ev).length ? `<a class="tl-media-badge" href="${mediaHref(ev)}" aria-label="看素材：${esc(ev.title)}">看素材 ↗</a>` : ''}
        </div>
        <h3 class="tl-card-title"><span class="tl-icon" aria-hidden="true">${esc(ev.icon || '•')}</span><a href="${eventHref(ev)}">${esc(ev.title)}</a></h3>
        ${compact ? '' : `<p class="tl-card-text">${esc(ev.text)}</p>`}
        ${pair ? `<p class="tl-pair-caption">${esc(pair.label)}</p>` : ''}
        ${pairLink}
      </article>`;
    }

    function rowsHTML(era, { compact = false } = {}) {
      return `<div class="tl-date-flow">
        <div class="tl-date-legend"><span class="tl-track-label china-label">中国史</span><span class="tl-track-label world-label">世界史</span></div>
        ${byEra.get(era.id).map(row => `<div class="tl-date-row">
          ${['china', 'world'].map(track => `<div class="tl-date-track ${track}">${row.filter(ev => ev.track === track).map(ev => cardHTML(ev, compact)).join('')}</div>`).join('')}
        </div>`).join('')}
      </div>`;
    }

    function spotlightHTML(pair) {
      const china = eventMap.get(pair.china);
      const world = eventMap.get(pair.world);
      return `<a class="tl-spotlight" href="${eventHref(china)}#comparison">
        <span class="tl-pair-badge">对照 ${pairNo(pair)}</span>
        ${[china, world].map(ev => `<span class="tl-spotlight-row ${ev.track}"><span class="tl-spotlight-year">${esc(ev.year)}</span><b>${esc(ev.title)}</b></span>`).join('')}
        <span class="tl-spotlight-label">${esc(pair.label)}</span>
      </a>`;
    }

    return { eraMap, eventMap, pairMap, pairOfEvent, byEra, pairNo, counterpart, rowsHTML, spotlightHTML };
  }

  function stationsHTML(eras, ctx) {
    return eras.map(era => `<a class="tl-station" href="${eraHref(era)}" style="--era-accent:${esc(era.accent)}">
      <span class="tl-station-no" aria-hidden="true">${era.no}</span>
      <div><b>${esc(era.name)}</b><small>${esc(era.span)}</small></div>
      <span class="tl-station-go">${ctx.byEra.get(era.id).flat().length} 件大事 <span aria-hidden="true">→</span></span>
    </a>`).join('');
  }

  function bindAnchors(root, reveal) {
    function jump() {
      const target = document.getElementById(location.hash.slice(1));
      if (!target?.hasAttribute('data-tl-anchor') || !root.contains(target)) return;
      reveal?.(target);
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
      return true;
    }
    root.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest('a[href^="#"]');
      // 重复点当前片段时，浏览器不会触发 hashchange。
      if (link?.hash === location.hash && jump()) event.preventDefault();
    });
    window.addEventListener('hashchange', jump);
    jump();
  }

  return { esc, trackName, makeContext, eraHref, eventHref, mediaFor, mediaHref, dynastyHref, stationsHTML, bindAnchors };
})();

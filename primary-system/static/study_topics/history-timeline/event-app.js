/* 每件大事使用稳定 id，详情、对照和前后大事共用时间轴的数据。 */
(() => {
  'use strict';
  const mediaBase = new URL('.', document.currentScript.src);
  const root = document.querySelector('.event-topic');
  const slot = document.getElementById('event-page');
  const { esc, trackName, makeContext, eraHref, eventHref, mediaFor, bindAnchors } = window.TLShared;
  const ctx = makeContext(window.TIMELINE_ERAS, window.TIMELINE_EVENTS, window.TIMELINE_PAIRS);
  const ev = ctx.eventMap.get(new URLSearchParams(location.search).get('event'));
  if (!ev) {
    slot.innerHTML = `<section class="tl-hero"><h1>没有找到这件大事</h1>
      <p>回到时间轴，可以按事件、朝代或年代查找。</p>
      <a class="tl-primary-action" href="timeline.html#timeline-tools">去时间轴找大事 →</a>
    </section>`;
    return;
  }

  const era = ctx.eraMap.get(ev.era);
  const materials = mediaFor(ev);
  const pair = ctx.pairOfEvent.get(ev.id);
  const neighbor = pair ? ctx.counterpart(pair, ev) : null;
  const events = ctx.byEra.get(era.id).flat();
  const index = events.indexOf(ev);
  const cardHash = '#card-' + encodeURIComponent(ev.id);
  document.title = ev.title + ' · 历史大事';
  const eraCrumb = document.getElementById('event-era');
  eraCrumb.textContent = era.name;
  eraCrumb.href = eraHref(era);
  eraCrumb.hidden = false;

  function nearby(item, label) {
    return item ? `<a class="era-pager-btn" href="${eventHref(item)}">
      <small>${label} · ${esc(item.year)}</small><b>${esc(item.title)}</b>
    </a>` : '<span></span>';
  }

  function materialHTML(item) {
    const image = item.type === 'image';
    return `<figure class="event-material ${image ? 'image-material' : 'audio-material'}">
      ${image ? `<a class="event-material-image" href="${esc(new URL(item.src, mediaBase).href)}" target="_blank" rel="noopener">
        <img src="${esc(new URL(item.src, mediaBase).href)}" alt="${esc(item.alt)}" width="${item.width}" height="${item.height}" decoding="async">
        <span>查看大图 ↗</span>
      </a>` : ''}
      <figcaption>
        <p class="tl-eyebrow">${esc(item.kind)}</p>
        <h3>${esc(item.title)}</h3>
        ${image ? '' : `<audio controls preload="none" src="${esc(new URL(item.src, mediaBase).href)}" aria-label="${esc(item.title)}">
          <a href="${esc(new URL(item.src, mediaBase).href)}">打开录音文件</a>
        </audio>`}
        <p>${esc(item.caption)}</p>
        <p class="media-prompt"><b>${image ? '观察一下' : '听一听'}</b> ${esc(item.prompt)}</p>
        <p class="media-credit">${esc(item.credit)} · ${esc(item.license)} ·
          <a href="${esc(item.source)}" target="_blank" rel="noopener noreferrer">原始出处（需联网）↗</a>
        </p>
        ${item.further ? `<a class="media-further" href="${esc(item.further.url)}" target="_blank" rel="noopener noreferrer">${esc(item.further.label)}（需联网）↗</a>` : ''}
      </figcaption>
    </figure>`;
  }

  slot.innerHTML = `<article class="tl-hero event-hero ${ev.track}">
    <p class="tl-eyebrow">第 ${era.no} 站 · ${trackName[ev.track]} · ${esc(ev.tag)}</p>
    <p class="event-year">${esc(ev.year)}</p>
    <h1><span aria-hidden="true">${esc(ev.icon || '•')}</span> ${esc(ev.title)}</h1>
    <p class="event-text">${esc(ev.text)}</p>
    <nav class="tl-related" aria-label="继续了解这件大事">
      <a href="timeline.html${cardHash}">在总轴上找到这件大事 ↗</a>
      <a href="${eraHref(era)}${cardHash}">在时代站继续读 →</a>
      ${materials.length ? '<a href="#event-media">看这件大事的素材 ↓</a>' : ''}
    </nav>
    ${window.StudyTopicConnections.related('events', ev.id)}
  </article>
  ${materials.length ? `<section class="event-media" id="event-media" data-tl-anchor tabindex="-1" aria-labelledby="event-media-title">
    <h2 id="event-media-title">看图听档案</h2>
    ${materials.map(materialHTML).join('')}
  </section>` : ''}
  ${pair ? `<section class="event-comparison" id="comparison" data-tl-anchor tabindex="-1" aria-labelledby="comparison-title">
    <p class="tl-eyebrow">同期对照 ${ctx.pairNo(pair)}</p>
    <h2 id="comparison-title">同一时期，另一边发生了什么？</h2>
    <p>${esc(pair.label)}</p>
    <div class="event-compare-grid">
      <div class="event-compare-side ${ev.track}"><small>${trackName[ev.track]} · ${esc(ev.year)}</small><b>${esc(ev.title)}</b></div>
      <a class="event-compare-side ${neighbor.track}" href="${eventHref(neighbor)}">
        <small>${trackName[neighbor.track]} · ${esc(neighbor.year)}</small><b>${esc(neighbor.title)} →</b>
      </a>
    </div>
  </section>` : ''}
  <nav class="era-pager" aria-label="本时代前后的大事">
    ${nearby(events[index - 1], '上一件')}
    <a class="era-pager-btn era-pager-home" href="${eraHref(era)}">回到时代站</a>
    ${nearby(events[index + 1], '下一件')}
  </nav>`;
  bindAnchors(root);
})();

/* 时代站按时代 id 取出完整双轨故事、同期对照和相关朝代。 */
(() => {
  'use strict';
  const mediaBase = new URL('.', document.currentScript.src);
  const root = document.querySelector('.era-topic');
  const slot = document.getElementById('era-page');
  const { esc, makeContext, eraHref, dynastyHref, mediaFor, mediaHref, stationsHTML, bindAnchors } = window.TLShared;
  const eras = window.TIMELINE_ERAS;
  const ctx = makeContext(eras, window.TIMELINE_EVENTS, window.TIMELINE_PAIRS);
  const eraId = new URLSearchParams(location.search).get('era');
  const index = eras.findIndex(era => era.id === eraId);
  const crumb = document.getElementById('crumb-here');
  if (index < 0) {
    const title = eraId ? '没有找到这个时代站' : '九个时代站';
    crumb.textContent = '时代站目录';
    slot.innerHTML = `<section class="tl-era-head era-missing"><h1>${title}</h1>
      <p>选一站，看看那时的中国和世界各发生了什么。</p>
      <div class="tl-station-grid">${stationsHTML(eras, ctx)}</div>
    </section>`;
    return;
  }

  const era = eras[index];
  const pairs = window.TIMELINE_PAIRS.filter(pair => ctx.eventMap.get(pair.china).era === era.id);
  const bands = window.DYNASTY_BANDS.filter(band => band.era === era.id);
  const previews = ctx.byEra.get(era.id).flat()
    .map(ev => ({ ev, image: mediaFor(ev).find(item => item.type === 'image') }))
    .filter(({ image }) => image);
  const timelineHref = 'timeline.html#era-' + encodeURIComponent(era.id);
  document.title = era.name + ' · 时代站 · 历史时间轴';
  crumb.textContent = '第 ' + era.no + ' 站 · ' + era.name;
  slot.style.setProperty('--era-accent', era.accent);

  function pageLink(neighbor, label) {
    return neighbor ? `<a class="era-pager-btn" href="${eraHref(neighbor)}"><small>${label}</small><b>${esc(neighbor.name)}</b></a>` : '<span></span>';
  }

  slot.innerHTML = `<header class="tl-era-head era-page-head">
      <div class="tl-era-title"><span class="tl-era-no" aria-hidden="true">${era.no}</span>
        <div><h1>${esc(era.name)}</h1><p class="tl-era-span">${esc(era.span)}</p></div>
        <a class="tl-era-link" href="${timelineHref}">回总轴这一站 ↗</a>
      </div>
      <p class="tl-era-compare">${esc(era.compare)}</p>
      <nav class="era-section-links" aria-label="时代站内容">
        ${previews.length ? '<a href="#era-media">看这站的素材 ↓</a>' : ''}
        <a href="#era-events">沿时间读大事 ↓</a>
        ${pairs.length ? '<a href="#era-pairs">看同期对照 ↓</a>' : ''}
      </nav>
    </header>
    ${window.StudyTopicConnections.related('eras', era.id)}
    ${bands.length ? `<nav class="tl-related" aria-label="这一站的朝代"><b>这一站的朝代</b>
      ${bands.map(band => `<a href="${dynastyHref(band)}">${esc(band.name)} →</a>`).join('')}
    </nav>` : ''}
    ${previews.length ? `<section class="era-media" id="era-media" data-tl-anchor tabindex="-1" aria-labelledby="era-media-title">
      <h2 id="era-media-title">从素材看这段历史</h2>
      <p>选一张图，看看它给我们留下了什么线索。</p>
      <div class="era-media-grid">${previews.map(({ ev, image }) => `<a class="era-media-card" href="${mediaHref(ev)}">
        <img src="${esc(new URL(image.src, mediaBase).href)}" alt="" width="${image.width}" height="${image.height}" decoding="async">
        <small>${esc(image.kind)}</small><strong>${esc(image.title)}</strong>
      </a>`).join('')}</div>
    </section>` : ''}
    <section class="era-events" id="era-events" data-tl-anchor tabindex="-1" aria-labelledby="era-events-title">
      <h2 id="era-events-title">沿时间读大事</h2>
      <p class="tl-stations-note">从早到晚读。点标题打开大事详情，也能从那里回到总轴。</p>
      ${ctx.rowsHTML(era, { compact: true })}
    </section>
    ${pairs.length ? `<section class="era-pairs" id="era-pairs" data-tl-anchor tabindex="-1" aria-labelledby="era-pairs-title"><h2 id="era-pairs-title">这时，中国和世界</h2>
      <div class="era-pairs-grid">${pairs.map(ctx.spotlightHTML).join('')}</div>
    </section>` : ''}
    <nav class="era-pager" aria-label="上一站下一站">
      ${pageLink(eras[index - 1], '上一站')}
      <a class="era-pager-btn era-pager-home" href="${timelineHref}">回总轴这一站</a>
      ${pageLink(eras[index + 1], '下一站')}
    </nav>`;
  bindAnchors(root);
})();

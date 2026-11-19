/* 时代站按时代 id 取出完整双轨故事、同期对照和相关朝代。 */
(() => {
  'use strict';
  const root = document.querySelector('.era-topic');
  const slot = root.querySelector('.timeline-content');
  const heading = root.querySelector('.timeline-heading');
  const { esc, makeContext, dynastyHref, mediaFor, mediaHref, stationsHTML } = window.TLShared;
  const layout = window.TLReadingLayout;
  const eras = window.TIMELINE_ERAS;
  const ctx = makeContext(eras, window.TIMELINE_EVENTS, window.TIMELINE_PAIRS);
  const eraId = new URLSearchParams(location.search).get('era');
  const index = eras.findIndex(era => era.id === eraId);
  const era = eras[index];
  document.getElementById('era-stations').innerHTML = layout.stationsHTML(eras, era);
  heading.hidden = false;
  if (index < 0) {
    const title = eraId ? '没有找到这个时代站' : '九个时代站';
    heading.innerHTML = `<p class="tl-eyebrow">时代站</p><h1 id="crumb-here" data-tl-anchor tabindex="-1">${title}</h1>
      <p class="timeline-lead">选一站，看看那时的中国和世界各发生了什么。</p>`;
    slot.innerHTML = `<div class="tl-station-grid">${stationsHTML(eras, ctx)}</div>`;
    layout.bind(root);
    return;
  }

  const events = ctx.byEra.get(era.id).flat();
  const pairs = window.TIMELINE_PAIRS.filter(pair => ctx.eventMap.get(pair.china).era === era.id);
  const bands = window.DYNASTY_BANDS.filter(band => band.era === era.id);
  const previews = events
    .map(ev => ({ ev, image: mediaFor(ev).find(item => item.type === 'image') }))
    .filter(({ image }) => image);
  const timelineHref = 'timeline.html#era-' + encodeURIComponent(era.id);
  document.title = era.name + ' · 时代站 · 历史时间轴';
  slot.style.setProperty('--era-accent', era.accent);
  heading.innerHTML = `<p class="tl-eyebrow">第 ${era.no} 站 · ${esc(era.span)}</p>
    <h1 id="crumb-here" data-tl-anchor tabindex="-1">${esc(era.name)}</h1>
    <p class="timeline-lead">${esc(era.compare)}</p>`;
  document.getElementById('era-directory-content').innerHTML = `<nav class="timeline-section-links" aria-label="时代站内容">
    ${previews.length ? '<a class="timeline-side-link" href="#era-media">看素材 ↓</a>' : ''}
    <a class="timeline-side-link" href="#era-events">沿时间读大事 ↓</a>
    ${pairs.length ? '<a class="timeline-side-link" href="#era-pairs">看同期对照 ↓</a>' : ''}
  </nav>${layout.eventsHTML(events)}`;
  document.getElementById('era-directory').hidden = false;
  slot.innerHTML = `<nav class="timeline-reading-actions" aria-label="时代站阅读工具">
      <a class="timeline-side-link" href="${timelineHref}">回总轴这一站 ↗</a>
      <a class="timeline-side-link" href="#era-directory">打开事件目录 ↗</a>
    </nav>
    ${bands.length ? `<nav class="tl-related" aria-label="这一站的朝代"><b>这一站的朝代</b>
      ${bands.map(band => `<a href="${dynastyHref(band)}">${esc(band.name)} →</a>`).join('')}
    </nav>` : ''}
    ${previews.length ? `<section class="era-media" id="era-media" data-tl-anchor tabindex="-1" aria-labelledby="era-media-title">
      <h2 id="era-media-title">从素材看这段历史</h2>
      <p>选一张图，看看它给我们留下了什么线索。</p>
      <div class="era-media-grid">${previews.map(({ ev, image }) => `<a class="era-media-card" href="${mediaHref(ev)}">
        <img src="${esc(image.src)}" alt="" width="${image.width}" height="${image.height}" decoding="async">
        <small>${esc(image.kind)}</small><strong>${esc(image.title)}</strong>
      </a>`).join('')}</div>
    </section>` : ''}
    <section class="era-events" id="era-events" data-tl-anchor tabindex="-1" aria-labelledby="era-events-title">
      <h2 id="era-events-title">沿时间读大事</h2>
      <p class="tl-stations-note">从早到晚读。点标题打开大事详情，也能从那里回到总轴。</p>
      ${ctx.rowsHTML(era)}
    </section>
    ${pairs.length ? `<section class="era-pairs" id="era-pairs" data-tl-anchor tabindex="-1" aria-labelledby="era-pairs-title"><h2 id="era-pairs-title">这时，中国和世界</h2>
      <div class="era-pairs-grid">${pairs.map(ctx.spotlightHTML).join('')}</div>
    </section>` : ''}
    <nav class="timeline-reading-actions" aria-label="继续浏览">
      <a class="timeline-side-link" href="#era-stations">选择其他时代 ↑</a>
      <a class="timeline-side-link" href="${timelineHref}">回总轴这一站 ↗</a>
    </nav>`;
  layout.bind(root);
})();

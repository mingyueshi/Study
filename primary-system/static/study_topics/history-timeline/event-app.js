/* 每件大事使用稳定 id，详情、对照和前后大事共用时间轴的数据。 */
(() => {
  'use strict';
  const mediaBase = new URL('.', document.currentScript.src);
  const root = document.querySelector('.event-topic');
  const slot = root.querySelector('.timeline-content');
  const heading = root.querySelector('.timeline-heading');
  const { esc, trackName, makeContext, eraHref, eventHref, mediaFor } = window.TLShared;
  const layout = window.TLReadingLayout;
  const eras = window.TIMELINE_ERAS;
  const ctx = makeContext(eras, window.TIMELINE_EVENTS, window.TIMELINE_PAIRS);
  const ev = ctx.eventMap.get(new URLSearchParams(location.search).get('event'));
  const era = ev && ctx.eraMap.get(ev.era);
  document.getElementById('event-stations').innerHTML = layout.stationsHTML(eras, era, true);
  heading.hidden = false;
  if (!ev) {
    heading.innerHTML = '<p class="tl-eyebrow">历史大事</p><h1>没有找到这件大事</h1>';
    slot.innerHTML = '<p>回到时间轴，可以按事件、朝代或年代查找。</p><a class="tl-primary-action" href="timeline.html#timeline-tools">去时间轴找大事 →</a>';
    layout.bind(root);
    return;
  }

  const materials = mediaFor(ev);
  const pair = ctx.pairOfEvent.get(ev.id);
  const neighbor = pair ? ctx.counterpart(pair, ev) : null;
  const events = ctx.byEra.get(era.id).flat();
  const index = events.indexOf(ev);
  const cardHash = '#card-' + encodeURIComponent(ev.id);
  const next = window.TLNavigation.nextReading(ev, window.TIMELINE_EVENTS, window.TIMELINE_READING_LINKS);
  const people = window.HistoryPeople.peopleForEvent(ev.id);
  const civilizations = window.HistoryCivilizations.forEvent(ev.id);
  const technologies = window.AncientScience.forEvent(ev.id);
  const silkRoutes = window.SilkRoad.forEvent(ev.id);
  document.title = ev.title + ' · 历史大事';
  heading.dataset.track = ev.track;
  heading.innerHTML = `<p class="tl-eyebrow">${esc(era.name)} · ${trackName[ev.track]} · ${esc(ev.tag)}</p>
    <h1 id="event-title"><span aria-hidden="true">${esc(ev.icon || '•')}</span> ${esc(ev.title)}</h1>
    <p class="timeline-totals">${esc(ev.year)}</p>`;
  document.getElementById('event-directory-content').innerHTML = layout.eventsHTML(events, ev);
  document.getElementById('event-directory').hidden = false;

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

  slot.innerHTML = `<article class="timeline-event-story ${ev.track}" aria-labelledby="event-title">
    <p class="event-text">${esc(ev.text)}</p>
    <nav class="timeline-reading-actions" aria-label="继续了解这件大事">
      <a href="timeline.html${cardHash}">在总轴上找到这件大事 ↗</a>
      <a href="${eraHref(era)}${cardHash}">在时代站继续读 →</a>
      <a href="#event-directory">打开事件目录 ↗</a>
      ${materials.length ? '<a href="#event-media">看图听档案 ↓</a>' : ''}
      ${pair ? '<a href="#comparison">看同期对照 ↓</a>' : ''}
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
  ${people.length ? `<section class="hp-event-people" aria-labelledby="event-people-title"><h2 id="event-people-title">走进这件大事里的人物</h2><nav aria-label="相关人物名片">${people.map(person=>`<a href="${window.HistoryPeople.personHref(person)}">${esc(person.name)} · 关系与关键决策 →</a>`).join('')}</nav></section>` : ''}
  ${civilizations.length ? `<section class="hp-event-people" aria-labelledby="event-civilizations-title"><h2 id="event-civilizations-title">走进相关文明</h2><nav aria-label="相关文明档案">${civilizations.map(c=>`<a href="${window.HistoryCivilizations.detailHref(c)}">${esc(c.name)} · 建筑、文字与制度 →</a>`).join('')}</nav></section>` : ''}
  ${technologies.length ? `<section class="hp-event-people" aria-labelledby="event-science-title"><h2 id="event-science-title">走进相关科技</h2><nav aria-label="相关科技档案">${technologies.map(t=>`<a href="${window.AncientScience.detailHref(t)}">${esc(t.title)} →</a>`).join('')}</nav></section>` : ''}
  ${silkRoutes.length?`<section class="hp-event-people" aria-labelledby="event-silk-title"><h2 id="event-silk-title">沿丝路继续探索</h2><nav aria-label="相关丝路路线">${silkRoutes.map(r=>`<a href="${window.SilkRoad.routeHref(r.id)}">${esc(r.title)} · 城市、贸易品与文化交流 →</a>`).join('')}</nav></section>`:''}
  <section class="event-reading-chain" aria-labelledby="reading-next-title">
    <p class="tl-eyebrow">顺着线索继续读</p>
    <h2 id="reading-next-title">${next ? '下一件相关大事' : '这条阅读线索读到这里'}</h2>
    ${next ? `<p>${esc(next.reason)}</p>
      <a class="event-reading-link ${next.event.track}" href="${eventHref(next.event)}">
        <small>${next.curated ? '相关线索' : '按时间继续'} · ${trackName[next.event.track]} · ${esc(next.event.year)}</small>
        <b>${esc(next.event.icon || '•')} ${esc(next.event.title)} →</b>
      </a>` : '<p>已经读到目前收录的最后年代。回时间轴选择另一个时代或新的线索。</p><a class="tl-primary-action" href="timeline.html">回到双轨时间轴 →</a>'}
  </section>
  <nav class="era-pager" aria-label="本时代前后的大事">
    ${nearby(events[index - 1], '上一件')}
    <a class="era-pager-btn era-pager-home" href="${eraHref(era)}">回到时代站</a>
    ${nearby(events[index + 1], '下一件')}
  </nav>`;
  layout.bind(root);
})();

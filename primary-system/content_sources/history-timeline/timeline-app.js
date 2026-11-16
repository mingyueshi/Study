/* 双轨年代窗口、同期并列对比与随阅读位置同步的朝代色带。 */
(() => {
  'use strict';
  const root = document.querySelector('.timeline-topic');
  const $ = id => document.getElementById(id);
  const {esc, makeContext, eraHref, eventHref, mediaFor, bindAnchors} = window.TLShared;
  const {ordinal, calendar, formatYear, normalize, parseTarget, yearRange, inRange, pairInRange, nearest, bandsAt} = window.TLNavigation;
  const eras = window.TIMELINE_ERAS, events = window.TIMELINE_EVENTS, pairs = window.TIMELINE_PAIRS;
  const bands = window.DYNASTY_BANDS;
  const flow = $('timeline-flow');
  if (!eras?.length || !events?.length) {
    flow.innerHTML = '<p class="tl-notice">数据文件尚未完整加载。请确认已保存整个目录，再重新打开页面。</p>';
    return;
  }
  const ctx = makeContext(eras, events, pairs);
  const search = $('event-search'), mediaOnly = $('media-only'), tools = $('timeline-tools');
  const results = $('timeline-results'), slider = $('year-slider'), ribbon = $('dynasty-ribbon');
  const narrow = matchMedia('(width < 720px)');
  const minYear = Math.min(...events.map(ev => ev.sort)), maxYear = Math.max(...events.map(ev => ev.sort));
  const inBounds = year => Number.isInteger(year) && year !== 0 && year >= minYear && year <= maxYear;
  let mode = 'all', radius = 'all', focusYear = minYear, band = null, readingYear = minYear;
  let frame = 0, activeBandKey = null;
  $('stat-eras').textContent = eras.length;
  $('stat-events').textContent = events.length;
  $('stat-pairs').textContent = pairs.length;
  $('spotlights').innerHTML = window.TIMELINE_SPOTLIGHTS.map(id => ctx.spotlightHTML(ctx.pairMap.get(id))).join('');
  $('era-nav').innerHTML = eras.map(era =>
    `<a class="tl-era-chip" href="#era-${esc(era.id)}" style="--era-accent:${esc(era.accent)}"><span aria-hidden="true">${era.no}</span>${esc(era.name)}</a>`).join('');
  $('dynasty-strip').innerHTML = bands.map(item =>
    `<button class="tl-dynasty-chip" type="button" data-band="${esc(item.id)}" style="--era-accent:${esc(ctx.eraMap.get(item.era).accent)}" title="${esc(item.span)}，查看这一时期的中外大事">
      <b>${esc(item.name)}</b><small>${esc(item.span)}</small>
    </button>`).join('');
  flow.innerHTML = eras.map(era => `<section class="tl-era" id="era-${esc(era.id)}" style="--era-accent:${esc(era.accent)}" data-tl-anchor tabindex="-1">
    <header class="tl-era-head"><div class="tl-era-title">
      <span class="tl-era-no" aria-hidden="true">${era.no}</span>
      <div><h2>${esc(era.name)}</h2><p class="tl-era-span">${esc(era.span)}</p></div>
      <a class="tl-era-link" href="${eraHref(era)}">进入时代站 →</a>
    </div><p class="tl-era-compare">${esc(era.compare)}</p></header>
    ${ctx.rowsHTML(era, {compact: true})}
  </section>`).join('');

  function pairHTML(pair) {
    const china = ctx.eventMap.get(pair.china), world = ctx.eventMap.get(pair.world);
    return `<article class="timeline-pair" id="pair-${esc(pair.id)}" data-pair="${esc(pair.id)}" data-year="${china.sort}" data-tl-anchor tabindex="-1">
      <header><span class="tl-pair-badge">同期对比 ${ctx.pairNo(pair)}</span><h3>${esc(pair.label)}</h3></header>
      <div class="timeline-pair-cards">${[china, world].map(ev => `<section class="timeline-pair-card ${ev.track}">
        <p class="timeline-pair-date">${ev.track === 'china' ? '中国史' : '世界史'} · ${esc(ev.year)}</p>
        <h4><a href="${eventHref(ev)}">${esc(ev.icon || '•')} ${esc(ev.title)} →</a></h4>
        <p>${esc(ev.text)}</p>
        <a class="timeline-pair-locate" href="#card-${esc(ev.id)}">在时间轴上找位置 ↗</a>
      </section>`).join('')}</div>
    </article>`;
  }
  $('timeline-pair-groups').innerHTML = eras.map(era => `<section class="timeline-pair-era" id="pair-era-${esc(era.id)}" data-tl-anchor tabindex="-1">
    <h2>${esc(era.name)} <small>${esc(era.span)}</small></h2>
    ${pairs.filter(pair => ctx.eventMap.get(pair.china).era === era.id)
      .sort((a, b) => Math.min(ctx.eventMap.get(a.china).sort, ctx.eventMap.get(a.world).sort) - Math.min(ctx.eventMap.get(b.china).sort, ctx.eventMap.get(b.world).sort))
      .map(pairHTML).join('')}
  </section>`).join('');
  const buttons = [...root.querySelectorAll('.tl-filters button')];
  const zoomButtons = [...root.querySelectorAll('[data-zoom]')];
  const sections = [...flow.querySelectorAll('.tl-era')], rows = [...flow.querySelectorAll('.tl-date-row')];
  const cards = [...flow.querySelectorAll('.tl-card')];
  const pairCards = [...$('timeline-pairs').querySelectorAll('.timeline-pair')];
  const pairSections = [...$('timeline-pairs').querySelectorAll('.timeline-pair-era')];
  const bandButtons = [...$('dynasty-strip').querySelectorAll('[data-band]')];
  const searchIndex = new Map(events.map(ev => [ev.id, normalize(ev.title + ev.tag + ev.year + ev.text)]));
  slider.min = ordinal(minYear); slider.max = ordinal(maxYear);

  function readURL() {
    const params = new URLSearchParams(location.search);
    mode = ['all', 'china', 'world', 'pair'].includes(params.get('view')) ? params.get('view') : 'all';
    radius = ['100', '500'].includes(params.get('zoom')) ? params.get('zoom') : 'all';
    const year = Number(params.get('year'));
    focusYear = inBounds(year) ? year : minYear;
    band = bands.find(item => item.id === params.get('dynasty')) || null;
    if (band) focusYear = band.startYear;
  }
  function saveURL() {
    const url = new URL(location.href);
    for (const [key, value] of [['view', mode === 'all' ? null : mode], ['year', focusYear === minYear && !band ? null : focusYear],
      ['zoom', radius === 'all' ? null : radius], ['dynasty', band?.id || null]]) {
      if (value === null) url.searchParams.delete(key); else url.searchParams.set(key, value);
    }
    history.replaceState(null, '', url);
  }
  function syncTools() { tools.open = !narrow.matches || location.hash === '#timeline-tools'; }
  function closeCompactTools() {
    if (narrow.matches) tools.open = false;
    if (root.dataset.slMode === 'compact' && root.dataset.slOpen === 'true') root.querySelector('.sl-header .sl-toggle:not(.sl-collapse)')?.click();
  }
  function measureRibbon() {
    root.style.setProperty('--tl-anchor-offset', Math.ceil(ribbon.getBoundingClientRect().height) + 24 + 'px');
  }
  function settleAnchor() {
    const target = document.getElementById(location.hash.slice(1));
    if (!target?.hasAttribute('data-tl-anchor') || !root.contains(target) || target.closest('[hidden]')) return;
    measureRibbon();
    target.scrollIntoView({block: 'start', behavior: 'instant'});
    queuePosition();
  }
  function syncPosition() {
    frame = 0;
    const list = (mode === 'pair' ? pairCards : rows).filter(item => !item.closest('[hidden]'));
    // 跳过吸顶色带下面仅剩一小截的上一张卡片，跟随实际阅读区域。
    const line = Math.max(0, ribbon.getBoundingClientRect().bottom) + 64;
    const current = list.find(item => item.getBoundingClientRect().bottom > line) || list.at(-1);
    if (!current) { $('dynasty-current').textContent = '当前筛选没有大事'; bandButtons.forEach(button => button.removeAttribute('aria-current')); activeBandKey = null; return; }
    readingYear = Number(current.dataset.year);
    const active = bandsAt(bands, readingYear);
    $('dynasty-current').textContent = `${formatYear(readingYear)} · ${active.length ? active.map(item => item.name).join('、') : readingYear < bands[0].startYear ? '早于夏朝' : readingYear > bands.at(-1).endYear ? '近现代' : '朝代交接之间'}`;
    const key = active.map(item => item.id).join(',');
    if (key === activeBandKey) return;
    activeBandKey = key;
    bandButtons.forEach(button => {
      if (active.some(item => item.id === button.dataset.band)) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    const first = bandButtons.find(button => button.hasAttribute('aria-current'));
    if (first) {
      const strip = $('dynasty-strip'), box = first.getBoundingClientRect(), parent = strip.getBoundingClientRect();
      if (box.left < parent.left || box.right > parent.right) strip.scrollTo({left: strip.scrollLeft + box.left - parent.left - 8, behavior: 'instant'});
    }
  }
  function queuePosition() { if (!frame) frame = requestAnimationFrame(syncPosition); }

  function filter(save = true) {
    const query = normalize(search.value), range = yearRange(focusYear, radius, band);
    let count = 0, pairCount = 0;
    for (const card of cards) {
      const ev = ctx.eventMap.get(card.dataset.event);
      card.hidden = !inRange(ev, range) || !(mode === 'all' || mode === 'pair' || mode === ev.track)
        || !searchIndex.get(ev.id).includes(query) || (mediaOnly.checked && !mediaFor(ev).length);
      count += Number(!card.hidden);
    }
    for (const row of rows) row.hidden = !row.querySelector('.tl-card:not([hidden])');
    sections.forEach(section => { section.hidden = !section.querySelector('.tl-date-row:not([hidden])'); });
    for (const card of pairCards) {
      const pair = ctx.pairMap.get(card.dataset.pair), china = ctx.eventMap.get(pair.china), world = ctx.eventMap.get(pair.world);
      card.hidden = !pairInRange(china, world, range)
        || ![searchIndex.get(china.id), searchIndex.get(world.id), normalize(pair.label)].some(text => text.includes(query))
        || (mediaOnly.checked && !mediaFor(china).length && !mediaFor(world).length);
      pairCount += Number(!card.hidden);
    }
    pairSections.forEach(section => { section.hidden = !section.querySelector('.timeline-pair:not([hidden])'); });
    [...$('era-nav').children].forEach((link, i) => {
      link.hidden = (mode === 'pair' ? pairSections : sections)[i].hidden;
      link.href = '#' + (mode === 'pair' ? 'pair-era-' : 'era-') + eras[i].id;
    });
    flow.hidden = mode === 'pair'; $('timeline-pairs').hidden = mode !== 'pair'; flow.dataset.mode = mode;
    $('event-count').textContent = mode === 'pair' ? `显示 ${pairCount} / ${pairs.length} 组中外对比` : `显示 ${count} / ${events.length} 件大事`;
    $('no-events').hidden = (mode === 'pair' ? pairCount : count) > 0;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
    zoomButtons.forEach(button => button.setAttribute('aria-pressed', String(!band && button.dataset.zoom === radius)));
    slider.value = ordinal(focusYear); slider.setAttribute('aria-valuetext', formatYear(focusYear));
    $('year-slider-label').textContent = formatYear(focusYear);
    $('time-window-status').textContent = range ? `${band ? band.name + ' · ' : ''}${formatYear(range[0])}—${formatYear(range[1])}，查看这一时期的${mode === 'pair' ? '中外对比' : '大事'}。` : `全历史 · ${formatYear(minYear)}—${formatYear(maxYear)}`;
    $('reset-time').hidden = !range;
    if (save) saveURL();
    queuePosition();
  }
  function resetFilters() { search.value = ''; mediaOnly.checked = false; mode = 'all'; radius = 'all'; band = null; filter(); }
  function showFilteredResults() { filter(); if (!narrow.matches && root.dataset.slMode !== 'compact') results.scrollIntoView({block: 'start', behavior: 'instant'}); }
  function locate(year, focus = true) {
    const visible = mode === 'pair'
      ? pairCards.filter(card => !card.hidden).flatMap(card => { const pair = ctx.pairMap.get(card.dataset.pair); return [ctx.eventMap.get(pair.china), ctx.eventMap.get(pair.world)]; })
      : cards.filter(card => !card.hidden).map(card => ctx.eventMap.get(card.dataset.event));
    const item = (band && mode !== 'world' ? nearest(visible.filter(ev => ev.track === 'china'), year) : null) || nearest(visible, year);
    if (!item) { $('year-jump-status').textContent = '这一时期没有符合条件的已收录大事，可查看全部年代或切换视角。'; return; }
    const target = mode === 'pair' ? $('pair-' + ctx.pairOfEvent.get(item.id).id) : $('card-' + item.id);
    readingYear = item.sort;
    closeCompactTools(); measureRibbon();
    const url = new URL(location.href); url.hash = target.id; history.replaceState(null, '', url);
    if (focus) target.focus({preventScroll: true});
    target.scrollIntoView({block: 'start', behavior: 'instant'});
    requestAnimationFrame(settleAnchor);
    $('year-jump-status').textContent = band ? `已选择${band.name}：${band.span}，从「${item.title}」附近开始读。`
      : `已定位到${formatYear(year)}${item.sort === year ? '' : '附近'}：${item.title}（${item.year}）。长时段按代表年代定位。`;
    queuePosition();
  }
  function chooseTarget(target) {
    $('year-jump').removeAttribute('aria-invalid');
    focusYear = target.year; band = target.band; search.value = ''; mediaOnly.checked = false;
    filter(); locate(focusYear);
  }
  $('year-jump-form').addEventListener('submit', event => {
    event.preventDefault();
    const target = parseTarget($('year-jump').value, bands);
    if (!target || !inBounds(target.year)) {
      $('year-jump-status').textContent = `请输入${formatYear(minYear)}至${formatYear(maxYear)}之间的年份或朝代，例如「公元前 221 年」「唐朝」。没有公元 0 年。`;
      $('year-jump').setAttribute('aria-invalid', 'true'); return;
    }
    chooseTarget(target);
  });
  slider.addEventListener('input', () => { focusYear = calendar(Number(slider.value)); band = null; filter(); });
  slider.addEventListener('change', () => locate(focusYear, false));
  zoomButtons.forEach(button => button.addEventListener('click', () => {
    focusYear = readingYear; band = null; radius = button.dataset.zoom; filter(); locate(focusYear);
  }));
  $('dynasty-strip').addEventListener('click', event => {
    const button = event.target.closest('[data-band]');
    const selected = button && bands.find(item => item.id === button.dataset.band);
    if (selected) { $('year-jump').value = selected.name; chooseTarget({year: selected.startYear, band: selected}); }
  });
  $('reset-time').addEventListener('click', () => { band = null; radius = 'all'; filter(); });
  search.addEventListener('input', showFilteredResults);
  mediaOnly.addEventListener('change', showFilteredResults);
  $('reset-filters').addEventListener('click', () => {
    resetFilters(); tools.open = true;
    if (root.dataset.slMode === 'compact' && root.dataset.slOpen !== 'true') root.querySelector('.sl-header .sl-toggle:not(.sl-collapse)')?.click();
    search.focus();
  });
  buttons.forEach(button => button.addEventListener('click', () => { mode = button.dataset.mode; showFilteredResults(); }));
  syncTools(); narrow.addEventListener('change', syncTools);
  window.addEventListener('hashchange', () => { if (location.hash === '#timeline-tools') tools.open = true; });
  window.addEventListener('scroll', queuePosition, {passive: true});
  window.addEventListener('resize', queuePosition);
  window.addEventListener('popstate', () => { readURL(); filter(false); });
  new ResizeObserver(() => { measureRibbon(); queuePosition(); }).observe(ribbon);
  readURL(); filter(false); measureRibbon();
  bindAnchors(root, target => {
    closeCompactTools();
    if (target.closest('[hidden]')) resetFilters();
    requestAnimationFrame(settleAnchor);
  });
  // 统一侧栏在初始化时会重排页面；完成后再对齐一次已有书签。
  window.addEventListener('load', () => requestAnimationFrame(settleAnchor), {once: true});
  const params = new URLSearchParams(location.search);
  if (!location.hash && (params.has('year') || params.has('dynasty'))) locate(focusYear, false);
})();

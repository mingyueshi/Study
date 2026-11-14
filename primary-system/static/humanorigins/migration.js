/* 本地年代地图：正文与证据均来自 stations.json，断网仍可使用。 */
(() => {
  'use strict';
  const root = document.getElementById('migration-atlas');
  const source = document.getElementById('origins-atlas-data');
  if (!root || !source) return;
  const atlas = JSON.parse(source.textContent);
  const regions = new Map(atlas.regions.map(region => [region.id, region]));
  const people = new Map(atlas.groups.map(group => [group.id, group]));
  const mapMarkers = new Map(atlas.map_markers.map(marker => [marker.id, marker]));
  const markerLabels = [...root.querySelectorAll('[data-map-marker]')];
  const words = atlas.playback;
  const range = document.getElementById('atlas-year');
  const previous = document.getElementById('atlas-previous');
  const next = document.getElementById('atlas-next');
  const play = document.getElementById('atlas-play');
  const speed = document.getElementById('atlas-speed');
  const steps = [...root.querySelectorAll('[data-atlas-step]')];
  const links = [...root.querySelectorAll('[data-region-link]')];
  const records = [...root.querySelectorAll('[data-region-record]')];
  const groups = [...document.querySelectorAll('[data-population]')];
  const routeLayer = document.getElementById('atlas-routes');
  let stepIndex = atlas.steps.length - 1;
  let regionId = atlas.regions[0].id;
  let markerId = null;
  let playing = false, timer = null, generation = 0, playbackState = 'ready';
  let lastYear = null;
  let remaining = null, deadline = 0, fill = null, displayedStep = null;
  const clock = () => Date.now();
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const canPlay = () => window.StudyEffects ? window.StudyEffects.motion === 'full' : !reduced?.matches;
  const duration = () => words.speeds.find(item => String(item.milliseconds) === speed.value)?.milliseconds || words.default_milliseconds;
  const readingBar = document.getElementById('atlas-reading-fill');
  speed.value = String(words.default_milliseconds);

  function readLocation() {
    const url = new URL(window.location.href);
    const year = url.searchParams.get('year');
    const index = year === null ? -1 : atlas.steps.findIndex(step => String(step.years_ago) === year);
    stepIndex = index < 0 ? atlas.steps.length - 1 : index;
    const requested = url.searchParams.get('region');
    const anchor = url.hash.startsWith('#region-') ? url.hash.slice(8) : null;
    regionId = regions.has(anchor) ? anchor : regions.has(requested) ? requested : atlas.regions[0].id;
    markerId = mapMarkers.has(url.searchParams.get('marker')) ? url.searchParams.get('marker') : null;
    if (markerId) regionId = mapMarkers.get(markerId).region;
  }

  function drawRoutes(year) {
    routeLayer.replaceChildren();
    for (const route of atlas.routes) {
      if (year > route.years_ago) continue;
      const from = regions.get(route.from), to = regions.get(route.to);
      const points = [[from.x, from.y], ...route.via, [to.x, to.y]];
      // 穿过地图边缘时分段，避免把东北亚至美洲的箭头横穿欧亚大陆。
      const segments = [[]];
      for (const point of points) {
        const last = segments.at(-1).at(-1);
        if (last && Math.abs(point[0] - last[0]) > 50) segments.push([]);
        segments.at(-1).push(point);
      }
      segments.forEach((segment, index) => {
        if (segment.length < 2) return;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', segment.map(([x, y], i) => `${i ? 'L' : 'M'}${x * 7.2} ${y * 2.92}`).join(' '));
        if (canPlay() && lastYear !== null && lastYear > route.years_ago) {
          path.setAttribute('class', 'origins-route-arriving');
          path.setAttribute('pathLength', '1');
        }
        if (index === segments.length - 1) path.setAttribute('marker-end', 'url(#atlas-arrow)');
        routeLayer.append(path);
      });
    }
    lastYear = year;
  }

  function populationState(person, year) {
    if (year > person.oldest) return 'before';
    if (person.record_type === 'minimum_age' && year === person.oldest) return 'known';
    if (person.status === 'living' && year === 0) return 'living';
    if (person.status === 'approximate' && year <= person.youngest) return 'extinct';
    if (year < person.youngest) return 'unknown';
    if (person.status === 'unknown' && year === person.youngest) return 'last';
    return 'known';
  }

  function appendText(parent, tag, text, className = '') {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    parent.append(node);
    return node;
  }

  function selectMarker(id) {
    pause();
    markerId = id;
    regionId = mapMarkers.get(id).region;
    render();
    // 只在主动点选时定位，自动播放与刷新深链接不抢走阅读焦点。
    const detail = document.getElementById('atlas-marker-detail');
    detail.focus({preventScroll: true});
    detail.scrollIntoView({block: 'nearest', behavior: 'instant'});
  }

  function mapStateLabel(state, year, marker) {
    if (marker?.record_type === 'minimum_age' && state === 'known') return atlas.map_key.minimum_age;
    return state === 'unknown' && year === 0 ? atlas.map_key.unknown_today : atlas.map_key[state];
  }

  function renderMapMarkers(year) {
    const layer = document.getElementById('atlas-marker-points');
    const uncertain = document.getElementById('atlas-uncertain-records');
    layer.replaceChildren();
    uncertain.replaceChildren();
    let knownCount = 0, uncertainCount = 0, extinctCount = 0;
    if (markerId && ['before', 'extinct'].includes(populationState(mapMarkers.get(markerId), year))) markerId = null;
    markerLabels.forEach(label => {
      const marker = mapMarkers.get(label.dataset.mapMarker);
      const person = people.get(marker.group);
      const state = populationState(marker, year);
      const isUncertain = state === 'unknown' || state === 'last';
      label.hidden = state === 'before' || state === 'extinct';
      label.dataset.mapState = state;
      if (markerId === marker.id) label.setAttribute('aria-current', 'location');
      else label.removeAttribute('aria-current');
      const stateLabel = mapStateLabel(state, year, marker);
      label.querySelector('[data-map-state-label]').textContent = stateLabel || '';
      label.setAttribute('aria-label', `${person.label} · ${marker.place}：${stateLabel || ''}，${marker.period}`);
      if (state === 'extinct') extinctCount++;
      if (label.hidden) return;
      if (isUncertain) uncertainCount++; else knownCount++;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      for (const [key, value] of Object.entries({x1: marker.x * 7.2, y1: marker.y * 2.92,
        x2: marker.label_x * 7.2, y2: marker.label_y * 2.92, stroke: person.color})) line.setAttribute(key, String(value));
      line.setAttribute('class', isUncertain ? 'origins-marker-line origins-marker-line-unknown' : 'origins-marker-line');
      layer.append(line);
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      for (const [key, value] of Object.entries({cx: marker.x * 7.2, cy: marker.y * 2.92, r: 3.5,
        fill: state === 'unknown' ? '#fffdf4' : person.color, stroke: person.color})) circle.setAttribute(key, String(value));
      circle.setAttribute('class', 'origins-marker-location');
      circle.setAttribute('data-map-point', marker.id);
      circle.addEventListener('click', () => selectMarker(marker.id));
      layer.append(circle);
      if (isUncertain) {
        const button = appendText(uncertain, 'button', `${person.label} · ${marker.place} · ${stateLabel}`);
        button.type = 'button';
        button.setAttribute('style', `--person-color: ${person.color}`);
        button.addEventListener('click', () => selectMarker(marker.id));
      }
    });
    if (!uncertainCount) appendText(uncertain, 'p', atlas.map_key.none_uncertain);
    document.getElementById('atlas-map-summary').textContent =
      `本年代：${knownCount} 处有线索，${uncertainCount} 处灭绝时间未定，${extinctCount} 处按约略消失年代退场。`;
    const detail = document.getElementById('atlas-marker-detail');
    detail.replaceChildren();
    detail.hidden = !markerId;
    if (markerId) {
      const marker = mapMarkers.get(markerId), person = people.get(marker.group);
      detail.setAttribute('style', `--person-color: ${person.color}`);
      appendText(detail, 'p', atlas.map_key.selected, 'origins-kicker');
      appendText(detail, 'h3', `${person.label} · ${marker.place}`).id = 'atlas-selected-heading';
      appendText(detail, 'strong', mapStateLabel(populationState(marker, year), year, marker));
      appendText(detail, 'p', marker.period);
      appendText(detail, 'p', marker.note);
      const sourceLink = appendText(detail, 'a', '查看这个点位的资料 ↘');
      sourceLink.href = `#source-${marker.source}`;
      const related = document.createElement('nav');
      related.className = 'origins-related-links';
      related.setAttribute('aria-label', `${marker.place}的关联线索`);
      if (marker.site_anchor) appendText(related, 'a', atlas.map_key.site_link).href = `${root.dataset.sitesUrl}#${marker.site_anchor}`;
      appendText(related, 'a', atlas.map_key.family_link).href = `${root.dataset.familyUrl}#family-${marker.group}`;
      detail.append(related);
      const back = appendText(detail, 'button', atlas.map_key.back_to_map, 'origins-map-return');
      back.type = 'button';
      back.addEventListener('click', () => {
        const label = markerLabels.find(item => item.dataset.mapMarker === markerId && !item.hidden);
        const target = label || document.getElementById('atlas-map');
        target.focus({preventScroll: true});
        target.scrollIntoView({block: 'center', inline: 'nearest', behavior: 'instant'});
      });
    }
  }

  function renderEra(step, selected) {
    const events = document.getElementById('atlas-era-events');
    events.replaceChildren();
    for (const event of step.events) {
      const paragraph = appendText(events, 'p', event.text);
      const link = appendText(paragraph, 'a', ' ↘');
      link.href = `#source-${event.source}`;
      link.setAttribute('aria-label', `查看资料 ${event.source}`);
    }
    document.getElementById('atlas-era-heading').textContent = step.label;
    document.getElementById('atlas-local-heading').textContent = `${selected.label} · 出现过的古人类`;
    const list = document.getElementById('atlas-local-people');
    list.replaceChildren();
    for (const id of selected.groups) {
      const person = people.get(id), state = populationState(person, step.years_ago);
      const item = document.createElement('li');
      item.dataset.eraState = state;
      item.setAttribute('style', `--person-color: ${person.color}`);
      const link = appendText(item, 'a', person.label);
      link.href = `#population-${id}`;
      appendText(item, 'strong', state === 'unknown' && step.years_ago === 0 ? atlas.map_key.unknown_today : words[state]);
      appendText(item, 'small', person.period);
      list.append(item);
    }
  }

  function renderPlayback() {
    play.textContent = playing ? words.pause : playbackState === 'ended' ? words.replay
      : playbackState === 'paused' ? words.resume : words.play;
    play.setAttribute('aria-pressed', String(playing));
    root.dataset.playing = String(playing);
    document.getElementById('atlas-playback-status').textContent = words[playbackState];
    document.getElementById('atlas-progress').textContent = `${stepIndex + 1} / ${atlas.steps.length} 站`;
    document.getElementById('atlas-route-progress').value = stepIndex + 1;
    document.getElementById('atlas-next-preview').textContent = stepIndex + 1 < atlas.steps.length
      ? `下一站：${atlas.steps[stepIndex + 1].label}` : '已经看到今天，回顾一下人们走过的地方吧。';
    play.disabled = !canPlay();
    document.getElementById('atlas-motion-note').hidden = canPlay();
  }

  function render(updateLocation = true) {
    if (displayedStep !== stepIndex) {
      remaining = null; fill?.cancel(); fill = null; displayedStep = stepIndex;
    }
    const step = atlas.steps[stepIndex];
    const selected = regions.get(regionId);
    range.value = String(stepIndex);
    range.setAttribute('aria-valuetext', step.label);
    document.getElementById('atlas-year-label').textContent = step.label;
    document.getElementById('atlas-step-summary').textContent = step.summary;
    previous.disabled = stepIndex === 0;
    next.disabled = stepIndex === atlas.steps.length - 1;
    steps.forEach((button, index) => button.setAttribute('aria-pressed', String(index === stepIndex)));
    links.forEach(link => {
      const region = regions.get(link.dataset.regionLink);
      link.dataset.reached = String(step.years_ago <= region.years_ago);
      if (region.id === regionId) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    records.forEach(record => {
      record.hidden = record.dataset.regionRecord !== regionId;
      if (!record.hidden) record.querySelector('[data-region-status]').textContent =
        step.years_ago <= selected.years_ago ? atlas.known_status : atlas.later_status;
    });
    groups.forEach(group => {
      group.dataset.related = String(selected.groups.includes(group.dataset.population));
      const state = populationState(people.get(group.dataset.population), step.years_ago);
      group.dataset.eraState = state;
      const label = group.querySelector('[data-population-era]');
      label.hidden = false;
      label.textContent = `${step.label} · ${state === 'unknown' && step.years_ago === 0 ? atlas.map_key.unknown_today : words[state]}`;
    });
    renderEra(step, selected);
    renderMapMarkers(step.years_ago);
    renderPlayback();
    drawRoutes(step.years_ago);
    const mapViewport = root.querySelector('.origins-world-scroll');
    const mapCanvas = root.querySelector('.origins-world');
    if (mapCanvas.scrollWidth > mapViewport.clientWidth) {
      const focus = markerId ? mapMarkers.get(markerId)
        : atlas.map_markers.find(marker => marker.region === regionId && marker.group === 'sapiens');
      mapViewport.scrollLeft = Math.max(0, Math.min(mapCanvas.scrollWidth - mapViewport.clientWidth,
        focus.label_x / 100 * mapCanvas.clientWidth - mapViewport.clientWidth / 2));
    }
    if (updateLocation) {
      const url = new URL(window.location.href);
      url.searchParams.set('year', String(step.years_ago));
      url.searchParams.set('region', regionId);
      if (markerId) url.searchParams.set('marker', markerId);
      else url.searchParams.delete('marker');
      if (url.hash.startsWith('#region-')) url.hash = `region-${regionId}`;
      try { window.history.replaceState(null, '', url); } catch (_) { /* 受限浏览器仍可读图 */ }
    }
  }

  function cancelTimer() {
    generation++;
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }

  function pause() {
    if (playing && timer !== null) remaining = Math.max(0, deadline - clock());
    fill?.pause();
    [...routeLayer.children].forEach(path => { path.classList.remove('origins-route-arriving'); path.removeAttribute('pathLength'); });
    cancelTimer();
    if (playing) playbackState = 'paused';
    playing = false;
    renderPlayback();
  }

  function schedule() {
    cancelTimer();
    const token = generation;
    const wait = remaining ?? duration();
    remaining = null;
    deadline = clock() + wait;
    fill?.cancel();
    fill = readingBar.animate?.([{transform: `scaleX(${1 - wait / duration()})`}, {transform: 'scaleX(1)'}], {duration: wait, fill: 'forwards'});
    timer = setTimeout(() => {
      if (!playing || token !== generation || !canPlay() || document.hidden) return;
      timer = null;
      stepIndex++;
      markerId = null;
      regionId = atlas.steps[stepIndex].focus_region;
      if (stepIndex === atlas.steps.length - 1) {
        playing = false;
        playbackState = 'ended';
      }
      render();
      if (playing) schedule();
    }, wait);
  }

  function start(fromBeginning = false) {
    if (document.hidden) return;
    cancelTimer();
    if (fromBeginning || stepIndex === atlas.steps.length - 1) { stepIndex = 0; remaining = null; fill?.cancel(); }
    regionId = atlas.steps[stepIndex].focus_region;
    markerId = null;
    playing = canPlay();
    playbackState = playing ? 'playing' : 'paused';
    render();
    if (playing) schedule();
  }

  play.addEventListener('click', () => { if (playing) pause(); else start(); });
  document.getElementById('atlas-restart').addEventListener('click', () => start(true));
  speed.addEventListener('change', () => { remaining = null; fill?.cancel(); if (playing) schedule(); });
  range.addEventListener('input', () => { pause(); stepIndex = Number(range.value); render(); });
  previous.addEventListener('click', () => { pause(); stepIndex = Math.max(0, stepIndex - 1); render(); });
  next.addEventListener('click', () => { pause(); stepIndex = Math.min(atlas.steps.length - 1, stepIndex + 1); render(); });
  steps.forEach((button, index) => button.addEventListener('click', () => { pause(); stepIndex = index; render(); }));
  links.forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    pause();
    regionId = link.dataset.regionLink;
    markerId = null;
    render();
  }));
  markerLabels.forEach(label => label.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    selectMarker(label.dataset.mapMarker);
  }));
  window.addEventListener('popstate', () => { pause(); readLocation(); render(false); });
  window.addEventListener('hashchange', () => {
    pause();
    const target = window.location.hash.slice(8);
    if (window.location.hash.startsWith('#region-') && regions.has(target)) {
      regionId = target;
      markerId = null;
      render();
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);
  const preference = () => {
    if (!canPlay()) {
      pause();
    }
    renderPlayback();
  };
  document.addEventListener('study:effects-change', preference);
  reduced?.addEventListener('change', preference);
  if (window.StudyEffects) window.StudyEffects.watch(document.getElementById('atlas-player'), pause);
  else if (typeof IntersectionObserver === 'function') {
    new IntersectionObserver(entries => { if (entries.some(entry => !entry.isIntersecting)) pause(); }).observe(document.getElementById('atlas-player'));
  }

  readLocation();
  render(false);
  root.querySelector('.origins-atlas-controls').hidden = false;
  root.querySelector('.origins-era-panel').hidden = false;
  root.querySelector('.origins-map-uncertain').hidden = false;
})();

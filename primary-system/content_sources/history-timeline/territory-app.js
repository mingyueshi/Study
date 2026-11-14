/* 共用经纬度底图，在地图上圈出各阶段范围。切换阶段保持视角，便于观察变化。 */
(() => {
  'use strict';
  const root = document.getElementById('territory-maps');
  if (!root) return;
  const $ = id => document.getElementById(id);
  const { esc, eraHref } = window.TLShared;
  const maps = window.TERRITORY_MAPS;
  const geo = window.TERRITORY_GEO;
  const bands = window.DYNASTY_BANDS;
  const eras = new Map(window.TIMELINE_ERAS.map(era => [era.id, era]));
  const assetBase = new URL('.', document.currentScript.src);
  const slider = $('territory-range');
  const compare = $('territory-compare');
  const compareSelect = $('territory-compare-select');
  const svg = $('territory-svg');
  const fullView = { x: 0, y: 0, w: 1000, h: 830 };
  const project = ([lng, lat]) => [(lng - 64) * 1000 / 81, (64 - lat) * 830 / 56];
  const pathOf = (points, close = true) => points.map((point, i) =>
    `${i ? 'L' : 'M'}${project(point).map(n => n.toFixed(2)).join(' ')}`).join('') + (close ? 'Z' : '');
  const regionPath = id => geo.regions[id].rings.map(ring => pathOf(ring)).join('');
  const yearText = year => year < 0 ? `约前 ${-year} 年` : `约 ${year} 年`;
  let index = 0;
  let compareIndex = 0;
  let selected = '';
  let view = { ...fullView };
  let drag = null;
  let moved = false;
  let playing = false, timer = null, generation = 0, transition = null;
  const play = $('territory-play');
  const speed = $('territory-speed');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canPlay = () => window.StudyEffects ? window.StudyEffects.motion === 'full' : !reduced.matches;

  function playbackState() {
    play.disabled = !canPlay();
    play.setAttribute('aria-pressed', String(playing));
    play.textContent = playing ? '暂停播放' : index === maps.length - 1 ? '从头再看' : '播放版图变化';
    $('territory-progress').max = maps.length;
    $('territory-progress').value = index + 1;
    $('territory-play-status').textContent = !canPlay() ? '已减少连续运动，可以用「上一张／下一张」逐张比较。'
      : playing ? `正在看第 ${index + 1} 张。点地图、拖动视角或选择对照阶段都会暂停。`
      : index === maps.length - 1 ? '已经看到最后一个阶段。可以从头再看，或选择两张版图比较。'
      : '准备好后点播放；暂停后可以慢慢读，离开演示区域也会暂停。';
  }
  function pause() {
    generation++; clearTimeout(timer); timer = null; playing = false;
    transition?.cancel(); transition = null;
    playbackState();
  }
  function schedule() {
    clearTimeout(timer);
    const token = ++generation;
    timer = setTimeout(() => {
      if (!playing || token !== generation || !canPlay() || document.hidden) return;
      timer = null;
      select(index + 1);
      if (index === maps.length - 1) { playing = false; playbackState(); }
      else schedule();
    }, speed.value === '10000' ? 10000 : 6000);
  }

  $('territory-dynasties').innerHTML = bands.map(band =>
    `<button type="button" data-dynasty="${esc(band.id)}" aria-pressed="false">${esc(band.name)}</button>`).join('');
  slider.max = maps.length - 1;
  // 已打开的页面可能仍在使用上一版模板，补上新增的出处位置。
  const credit = $('territory-credit') || document.createElement('p');
  credit.id = 'territory-credit';
  credit.className = 'territory-credit';
  $('territory-note').after(credit);
  credit.innerHTML = `轮廓 · <a href="${esc(geo.meta.source)}" target="_blank" rel="noopener noreferrer">Cliopatria v0.2.1（需联网）↗</a> ·
    底图 · <a href="${esc(geo.meta.baseSource)}" target="_blank" rel="noopener noreferrer">Natural Earth（需联网）↗</a>`;

  const grid = [];
  for (let lng = 70; lng <= 140; lng += 10) {
    grid.push(`<path d="${pathOf([[lng, 8], [lng, 64]], false)}"/>`);
  }
  for (let lat = 10; lat <= 60; lat += 10) {
    grid.push(`<path d="${pathOf([[64, lat], [145, lat]], false)}"/>`);
  }
  svg.innerHTML = `<title>中国历代范围交互地图</title>
    <rect class="territory-water" x="-2000" y="-2000" width="5000" height="5000"/>
    <g class="territory-land"><path d="${geo.land.map(ring => pathOf(ring)).join('')}" fill-rule="evenodd"/></g>
    <g class="territory-graticule">${grid.join('')}</g>
    <g class="territory-rivers">${geo.rivers.flatMap(river => river.lines.map(line =>
      `<path d="${pathOf(line, false)}"><title>${esc(river.name)}</title></path>`)).join('')}</g>
    <g id="territory-regions"></g><g id="territory-outlines"></g>
    <g class="territory-water-labels">${[[[109,37], '黄河'], [[113,29.6], '长江'], [[128,29], '东海'], [[118,17], '南海'], [[134,52], '黑龙江']].map(([point,name]) =>
      `<text x="${project(point)[0]}" y="${project(point)[1]}">${name}</text>`).join('')}</g>
    <g id="territory-region-labels"></g><g id="territory-capitals"></g>`;

  function updateView() {
    svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${view.h}`);
    const scale = Math.max(.1, Math.min(svg.clientWidth / view.w, svg.clientHeight / view.h));
    svg.style.setProperty('--territory-label-size', `${14 / scale}px`);
    svg.style.setProperty('--territory-place-size', `${12 / scale}px`);
    $('territory-zoom-in').disabled = view.w <= fullView.w / 8;
    $('territory-zoom-out').disabled = view.w >= fullView.w;
  }

  function zoomAt(factor, center = [view.x + view.w / 2, view.y + view.h / 2]) {
    pause();
    const width = Math.max(fullView.w / 8, Math.min(fullView.w, view.w * factor));
    const ratio = width / view.w;
    view = { x: center[0] - (center[0] - view.x) * ratio,
      y: center[1] - (center[1] - view.y) * ratio, w: width, h: width * fullView.h / fullView.w };
    updateView();
  }

  function highlight(id) {
    selected = selected === id ? '' : id;
    svg.querySelectorAll('[data-region]').forEach(path => path.classList.toggle('is-selected', path.dataset.region === selected));
    $('territory-legend').querySelectorAll('button').forEach(button =>
      button.setAttribute('aria-pressed', String(button.dataset.region === selected)));
    $('territory-selection').textContent = selected ? `${geo.regions[selected].name} · 已突出显示圈线范围` : '点地图色块或图例，可突出一个区域。★ 表示都城或中心地点。';
  }

  function render(animate = false) {
    const map = maps[index];
    const band = bands.find(band => band.id === map.dynasty);
    $('territory-period').textContent = `${map.period} · 示意年份 ${yearText(map.year)}`;
    $('territory-map-title').textContent = map.title;
    $('territory-count').textContent = `${index + 1} / ${maps.length} 个阶段`;
    slider.value = index;
    slider.setAttribute('aria-valuetext', `${map.title}，${yearText(map.year)}`);
    $('territory-prev').disabled = index === 0;
    $('territory-next').disabled = index === maps.length - 1;
    root.querySelectorAll('[data-dynasty]').forEach(button =>
      button.setAttribute('aria-pressed', String(button.dataset.dynasty === map.dynasty)));
    compareSelect.innerHTML = maps.map((other, i) =>
      `<option value="${i}" ${i === index ? 'disabled' : ''}>${esc(other.title)} · ${esc(yearText(other.year))}</option>`).join('');
    compareSelect.value = compareIndex;
    $('territory-compare-label').hidden = !compare.checked;
    $('territory-compare-note').hidden = !compare.checked;
    $('territory-compare-note').textContent = compare.checked
      ? `紫色虚线是${maps[compareIndex].title}（${yearText(maps[compareIndex].year)}），彩色填色是当前阶段。两者共用同一底图和视角。` : '';
    $('territory-outlines').innerHTML = compare.checked ? maps[compareIndex].regions.map(id =>
      `<path class="territory-old-range" d="${regionPath(id)}" fill-rule="evenodd"><title>对照 · ${esc(geo.regions[id].name)}</title></path>`).join('') : '';
    $('territory-regions').innerHTML = map.regions.map(id => {
      const region = geo.regions[id];
      return `<path class="territory-region${map.id === 'xia' ? ' is-approximate' : ''}" data-region="${esc(id)}" tabindex="0" role="button" aria-label="突出${esc(region.name)}的范围" d="${regionPath(id)}" fill="${region.color}" stroke="${region.color}" fill-rule="evenodd"><title>${esc(region.name)}</title></path>`;
    }).join('');
    $('territory-region-labels').innerHTML = map.regions.map(id => {
      const region = geo.regions[id];
      const [x, y] = project(region.label);
      return `<text x="${x}" y="${y}">${esc(region.name)}</text>`;
    }).join('');
    $('territory-capitals').innerHTML = map.capitals.map(capital => {
      const [x, y] = project(capital.point);
      return `<g><text class="territory-capital-star" x="${x}" y="${y}">★</text><text class="territory-capital-name" x="${x + 9}" y="${y - 10}">${esc(capital.name)}</text></g>`;
    }).join('');
    $('territory-legend').innerHTML = map.regions.map(id => {
      const region = geo.regions[id];
      return `<button type="button" data-region="${esc(id)}" aria-pressed="false"><span style="background:${region.color}"></span>${esc(region.name)}</button>`;
    }).join('') + (compare.checked ? '<span class="territory-old-key">┄ 对照阶段范围</span>' : '');
    selected = '';
    highlight('');
    $('territory-note').textContent = map.note;
    $('territory-observe').innerHTML = map.observe.map(text => `<li>${esc(text)}</li>`).join('');
    $('territory-question').open = false;
    $('territory-question-text').textContent = map.question;
    $('territory-answer').textContent = map.answer;
    $('territory-related').innerHTML = `<a href="#dyn-${esc(band.id)}">读${esc(band.name)}的朝代故事 ↓</a>
      <a href="${eraHref(eras.get(band.era))}">回时代站看大事 →</a>`;
    const image = new URL(map.src, assetBase).href;
    $('territory-reference-image').href = image;
    const preview = $('territory-reference-preview');
    preview.src = image; preview.alt = map.alt; preview.width = map.width; preview.height = map.height;
    $('territory-reference-credit').innerHTML = `${esc(map.credit)} · <a href="${esc(map.source)}" target="_blank" rel="noopener noreferrer">原图出处（需联网）↗</a>`;
    transition?.cancel();
    transition = animate && canPlay() ? $('territory-regions').animate?.([{opacity: .25}, {opacity: 1}], {duration: 240, easing: 'ease-out'}) : null;
    playbackState();
  }

  function select(next, save = true) {
    index = Math.max(0, Math.min(maps.length - 1, next));
    compareIndex = index > 0 ? index - 1 : 1;
    render(save);
    if (save) {
      const url = new URL(location.href);
      url.searchParams.set('map', maps[index].id);
      url.hash = 'territory-maps';
      history.replaceState(null, '', url);
    }
  }

  function restore() {
    pause();
    const value = new URLSearchParams(location.search).get('map');
    const match = maps.findIndex(map => map.id === value || map.dynasty === value);
    select(match < 0 ? 0 : match, false);
  }

  const manualSelect = next => { pause(); select(next); };
  slider.addEventListener('input', () => manualSelect(Number(slider.value)));
  $('territory-prev').addEventListener('click', () => manualSelect(index - 1));
  $('territory-next').addEventListener('click', () => manualSelect(index + 1));
  $('territory-dynasties').addEventListener('click', event => {
    const button = event.target.closest('[data-dynasty]');
    if (button) manualSelect(maps.findIndex(map => map.dynasty === button.dataset.dynasty));
  });
  compare.addEventListener('change', () => { pause(); render(); });
  compareSelect.addEventListener('change', () => { pause(); compareIndex = Number(compareSelect.value); render(); });
  $('territory-legend').addEventListener('click', event => {
    const button = event.target.closest('[data-region]');
    if (button) { pause(); highlight(button.dataset.region); }
  });
  $('territory-zoom-in').addEventListener('click', () => zoomAt(.75));
  $('territory-zoom-out').addEventListener('click', () => zoomAt(1 / .75));
  $('territory-map-reset').addEventListener('click', () => { pause(); view = { ...fullView }; updateView(); });
  $('territory-map-focus').addEventListener('click', () => {
    pause();
    const points = maps[index].regions.flatMap(id => geo.regions[id].rings.flat()).map(project);
    const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    const center = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
    const width = Math.max(160, Math.max(...xs) - Math.min(...xs) + 80, (Math.max(...ys) - Math.min(...ys) + 80) * fullView.w / fullView.h);
    view = { x: center[0] - width / 2, y: center[1] - width * fullView.h / fullView.w / 2, w: width, h: width * fullView.h / fullView.w };
    updateView();
  });

  function pointAt(event) {
    const point = svg.createSVGPoint();
    point.x = event.clientX; point.y = event.clientY;
    return point.matrixTransform(svg.getScreenCTM().inverse());
  }
  svg.addEventListener('wheel', event => {
    event.preventDefault();
    const point = pointAt(event);
    zoomAt(event.deltaY > 0 ? 1.16 : 1 / 1.16, [point.x, point.y]);
  }, { passive: false });
  svg.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    pause();
    drag = { point: pointAt(event), region: event.target.closest('[data-region]')?.dataset.region }; moved = false;
    svg.setPointerCapture(event.pointerId);
  });
  svg.addEventListener('pointermove', event => {
    if (!drag) return;
    const point = pointAt(event);
    const dx = point.x - drag.point.x, dy = point.y - drag.point.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
    view.x -= dx; view.y -= dy;
    updateView();
  });
  svg.addEventListener('pointerup', () => {
    if (drag?.region && !moved) highlight(drag.region);
    drag = null;
  });
  svg.addEventListener('pointercancel', () => { drag = null; });
  svg.addEventListener('lostpointercapture', () => { drag = null; });
  svg.addEventListener('keydown', event => {
    if (['Enter', ' ', '+', '=', '-', 'Home', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) pause();
    const region = event.target.closest('[data-region]');
    if (region && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault(); highlight(region.dataset.region); return;
    }
    if (['+', '=', '-', 'Home', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
    if (event.key === '+' || event.key === '=') zoomAt(.75);
    if (event.key === '-') zoomAt(1 / .75);
    if (event.key === 'Home') { view = { ...fullView }; updateView(); }
    if (event.key === 'ArrowLeft') view.x -= view.w * .08;
    if (event.key === 'ArrowRight') view.x += view.w * .08;
    if (event.key === 'ArrowUp') view.y -= view.h * .08;
    if (event.key === 'ArrowDown') view.y += view.h * .08;
    updateView();
  });
  window.addEventListener('popstate', restore);
  play.addEventListener('click', () => {
    if (playing) { pause(); return; }
    if (!canPlay() || document.hidden) return;
    if (index === maps.length - 1) select(0);
    playing = true; playbackState(); schedule();
  });
  $('territory-restart').addEventListener('click', () => manualSelect(0));
  speed.addEventListener('change', () => { if (playing) schedule(); });
  $('territory-question').addEventListener('toggle', () => { if ($('territory-question').open) pause(); });
  root.querySelector('.territory-reference').addEventListener('toggle', event => { if (event.currentTarget.open) pause(); });
  const preference = () => { if (!canPlay()) pause(); else playbackState(); };
  document.addEventListener('study:effects-change', preference);
  reduced.addEventListener('change', preference);
  if (window.StudyEffects) window.StudyEffects.watch(root.querySelector('.territory-stage'), pause);
  else if (typeof IntersectionObserver === 'function') {
    new IntersectionObserver(entries => { if (entries.some(entry => !entry.isIntersecting)) pause(); }).observe(root.querySelector('.territory-stage'));
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);
  restore();
  $('territory-playback').hidden = false;
  updateView();
  new ResizeObserver(updateView).observe(svg);
})();

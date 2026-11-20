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
  const changes = $('territory-changes');
  const stageChoices = $('territory-stages');
  const svg = $('territory-svg');
  const {fullView, project, pathOf, regionPath, yearText, landHTML, riversHTML} = window.TerritoryRender;
  let index = 0;
  let chosenComparison = null;
  let selected = '';
  let view = { ...fullView };
  let drag = null;
  let moved = false;
  let playing = false, timer = null, generation = 0, transition = null;
  let remaining = null, deadline = 0;
  const play = $('territory-play');
  const speed = $('territory-speed');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canPlay = () => window.StudyEffects ? window.StudyEffects.motion === 'full' : !reduced.matches;
  const duration = () => speed.value === '10000' ? 10000 : 6000;

  function playbackState() {
    play.disabled = !canPlay();
    play.setAttribute('aria-pressed', String(playing));
    play.textContent = playing ? '暂停播放' : index === maps.length - 1 ? '从头再看' : remaining !== null ? '继续播放' : '自动播放';
    $('territory-restart').textContent = canPlay() ? '从头播放' : '回到第一张';
    $('territory-progress').max = maps.length;
    $('territory-progress').value = index + 1;
    const next = maps[index + 1];
    $('territory-play-status').textContent = !canPlay() ? '已减少连续运动，可以用「上一张／下一张」逐张比较。'
      : !next ? '已经看到最后一个阶段，播放已停止。可以从头再看，或选择两张版图比较。'
      : playing ? `正在看第 ${index + 1} 个阶段，接下来：${next.title}。点地图或「暂停播放」可停下查看。`
      : remaining !== null ? `已暂停在${maps[index].title}，可以慢慢读。继续后接着看：${next.title}。`
      : `按时间顺序播放，接下来：${next.title}。播放时地图视角保持不变。`;
  }
  function cancelTimer() {
    generation++; clearTimeout(timer); timer = null;
  }
  function pause() {
    if (playing && timer !== null) remaining = Math.max(0, deadline - performance.now());
    cancelTimer(); playing = false;
    transition?.cancel(); transition = null;
    playbackState();
  }
  function schedule() {
    cancelTimer();
    const token = generation;
    const wait = remaining ?? duration();
    remaining = null;
    deadline = performance.now() + wait;
    timer = setTimeout(() => {
      if (!playing || token !== generation || !canPlay() || document.hidden) return;
      timer = null;
      if (index + 1 === maps.length - 1) playing = false;
      select(index + 1);
      if (playing) schedule();
    }, wait);
  }
  function start(fromBeginning = false) {
    if (document.hidden) return;
    cancelTimer();
    if (fromBeginning || index === maps.length - 1) { remaining = null; select(0); }
    playing = canPlay();
    playbackState();
    if (playing) schedule();
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
    ${landHTML()}
    <g class="territory-graticule">${grid.join('')}</g>
    ${riversHTML()}
    <defs id="territory-change-defs"></defs>
    <g id="territory-regions"></g><g id="territory-differences" pointer-events="none" aria-hidden="true"></g><g id="territory-outlines"></g>
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

  function renderChanges() {
    const previous = maps[index - 1];
    const active = changes.checked && !!previous;
    $('territory-change-panel').hidden = !changes.checked;
    $('territory-change-key').hidden = !previous;
    $('territory-change-title').textContent = previous
      ? `${previous.title} → ${maps[index].title}` : '第一阶段 · 先记住起点';
    $('territory-change-summary').textContent = maps[index].change;
    svg.classList.toggle('is-showing-changes', active);
    if (!active) {
      $('territory-change-defs').innerHTML = '';
      $('territory-differences').innerHTML = '';
      return;
    }
    // 每个阶段先合看全部政权的覆盖范围，再扣除另一阶段；同一范围内更换政权不算增减。
    // 各区域分别使用 evenodd 保留孔洞，蒙版叠加则保留各区域的并集。
    const paths = (map, fill) => map.regions.map(id =>
      `<path d="${regionPath(id)}" fill="${fill}" fill-rule="evenodd"/>`).join('');
    const mask = (id, excluded) => `<mask id="${id}" maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="5000" height="5000" style="mask-type:luminance">
      <rect x="-2000" y="-2000" width="5000" height="5000" fill="white"/>${paths(excluded, 'black')}</mask>`;
    $('territory-change-defs').innerHTML = mask('territory-gain-mask', previous) + mask('territory-loss-mask', maps[index]) +
      '<pattern id="territory-loss-pattern" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#f6ae62"/><path d="M0 0V9" stroke="#9b4513" stroke-width="3"/></pattern>';
    $('territory-differences').innerHTML =
      `<g class="territory-loss" mask="url(#territory-loss-mask)">${paths(previous, 'url(#territory-loss-pattern)')}</g>` +
      `<g class="territory-gain" mask="url(#territory-gain-mask)">${paths(maps[index], '#0b9e86')}</g>`;
  }

  function renderComparison() {
    const compareIndex = chosenComparison !== null && chosenComparison !== index
      ? chosenComparison : index > 0 ? index - 1 : 1;
    compareSelect.innerHTML = maps.map((other, i) =>
      `<option value="${i}" ${i === index ? 'disabled' : ''}>${esc(other.title)} · ${esc(yearText(other.year))}</option>`).join('');
    compareSelect.value = compareIndex;
    $('territory-compare-label').hidden = !compare.checked;
    $('territory-compare-note').hidden = !compare.checked;
    $('territory-compare-note').textContent = compare.checked
      ? `紫色虚线是${maps[compareIndex].title}（${yearText(maps[compareIndex].year)}），彩色填色是当前阶段。两者共用同一底图和视角。` : '';
    $('territory-outlines').innerHTML = compare.checked ? maps[compareIndex].regions.map(id =>
      `<path class="territory-old-range" d="${regionPath(id)}" fill-rule="evenodd"><title>对照 · ${esc(geo.regions[id].name)}</title></path>`).join('') : '';
    $('territory-compare-key').hidden = !compare.checked;
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
    if (stageChoices.dataset.stageDynasty !== map.dynasty) {
      stageChoices.dataset.stageDynasty = map.dynasty;
      stageChoices.innerHTML = maps.filter(stage => stage.dynasty === map.dynasty).map(stage =>
        `<button type="button" data-stage="${esc(stage.id)}">${esc(stage.title)}<small>${esc(yearText(stage.year))}</small></button>`).join('');
    }
    for (const button of stageChoices.querySelectorAll('[data-stage]')) {
      button.setAttribute('aria-pressed', String(button.dataset.stage === map.id));
    }
    $('territory-regions').innerHTML = map.regions.map(id => {
      const region = geo.regions[id];
      return `<path class="territory-region${map.id === 'xia' ? ' is-approximate' : ''}" data-region="${esc(id)}" tabindex="0" role="button" aria-label="突出${esc(region.name)}的范围" d="${regionPath(id)}" fill="${region.color}" stroke="${region.color}" fill-rule="evenodd"><title>${esc(region.name)}</title></path>`;
    }).join('');
    renderChanges();
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
    }).join('') + '<span id="territory-compare-key" class="territory-old-key" hidden>┄ 对照阶段范围</span>';
    renderComparison();
    selected = '';
    highlight('');
    $('territory-note').textContent = map.note;
    $('territory-observe').innerHTML = map.observe.map(text => `<li>${esc(text)}</li>`).join('');
    $('territory-question').open = false;
    $('territory-question-text').textContent = map.question;
    $('territory-answer').textContent = map.answer;
    $('territory-related').innerHTML = `<a href="dynasties.html#dyn-${esc(band.id)}">读${esc(band.name)}的朝代故事 →</a>
      <a href="${eraHref(eras.get(band.era))}">回时代站看大事 →</a>
      <a href="timeline.html?year=${map.year}&zoom=500">看这个年代前后的中外大事 →</a>`;
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
    render(save);
    if (save) {
      const url = new URL(location.href);
      url.searchParams.set('map', maps[index].id);
      if (!url.hash) url.hash = 'territory-maps';
      try { history.replaceState(history.state, '', url); } catch { /* 本地文件仍可切换阶段。 */ }
    }
  }

  function restore() {
    pause();
    remaining = null;
    const value = new URLSearchParams(location.search).get('map');
    const match = maps.findIndex(map => map.id === value || map.dynasty === value);
    select(match < 0 ? 0 : match, false);
  }

  const manualSelect = next => { pause(); remaining = null; select(next); };
  slider.addEventListener('input', () => manualSelect(Number(slider.value)));
  $('territory-prev').addEventListener('click', () => manualSelect(index - 1));
  $('territory-next').addEventListener('click', () => manualSelect(index + 1));
  $('territory-dynasties').addEventListener('click', event => {
    const button = event.target.closest('[data-dynasty]');
    if (button) manualSelect(maps.findIndex(map => map.dynasty === button.dataset.dynasty));
  });
  stageChoices.addEventListener('click', event => {
    const button = event.target.closest('[data-stage]');
    if (button) manualSelect(maps.findIndex(map => map.id === button.dataset.stage));
  });
  compare.addEventListener('change', () => { pause(); renderComparison(); });
  changes.addEventListener('change', () => { pause(); renderChanges(); });
  compareSelect.addEventListener('change', () => { pause(); chosenComparison = Number(compareSelect.value); renderComparison(); });
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
    start();
  });
  $('territory-restart').addEventListener('click', () => start(true));
  speed.addEventListener('change', () => { remaining = null; if (playing) schedule(); playbackState(); });
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
  window.TLShared.bindAnchors?.(root);
})();

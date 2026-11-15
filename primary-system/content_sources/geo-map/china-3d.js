/* 真实 DEM 地形与省份联动；地形按需绘制，流向由用户播放，无运行时外部请求。 */
(() => {
  'use strict';
  const root = document.querySelector('.china-3d-topic');
  if (!root) return;
  const $ = id => root.querySelector(`#${id}`);
  const S = window.GMShared;
  const data = window.GM_CHINA_3D;
  const provinces = window.GM_PROVINCES;
  const regions = new Map(window.GM_REGIONS.map(r => [r.id, r]));
  const byId = new Map(provinces.map(p => [p.id, p]));
  const esc = S.esc;
  const picker = $('gm3-province');
  const canvas = $('gm3-canvas');
  const viewport = $('gm3-viewport');
  const profile = $('gm3-profile');
  const featureProfile = $('gm3-feature-profile');
  let selected = '', renderer, scene, camera, controls, frame = 0, failed = false;
  let width = 1, height = 1, showLabels = true, showLandforms = true, showRivers = true;
  let exaggeration = data.terrain.defaultExaggeration, colorMode = 'terrain', focusedLandform = '';
  const features = new Map(window.GM_FEATURES.map(f => [f.id, f]));
  const models = new Map(), labels = [];
  const rivers = new Map();
  let focusedRiver = '';
  let flowRiver = 'f20', showEnds = true, flowPlayback, inView = true;
  const flowLayer = $('gm3-flow-layer'), flowArrows = [], flowEndpoints = [];
  const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fullMotion = () => !motionMedia.matches && (!window.StudyEffects || window.StudyEffects.motion === 'full');
  const flowConfig = () => data.rivers.find(item => item.feature === flowRiver).flow;
  const flowAvailable = () => !failed && Boolean(renderer) && showRivers && flowConfig().mode === 'downstream' && rivers.has(flowRiver);
  const tourData = window.GM_CHINA_RIVER_TOURS;
  let tourController = null, tourRoute = null, tourView = null, tourPoint = null, tourLastDistance = null, tourStory = '';
  let tourZoom = 6, tourOffset, tourWritingURL = false;
  const tourRoutes = new Map();
  const tourMarker = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  tourMarker.style.display = 'none';
  tourMarker.innerHTML = '<circle class="gm3-tour-marker" r="8"/><text class="gm3-tour-map-name" x="14" y="-12"></text>';
  flowLayer.append(tourMarker);

  const T = window.GMThree;
  const leaders = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  leaders.classList.add('gm3-label-leaders');
  leaders.setAttribute('aria-hidden', 'true');
  $('gm3-label-layer').append(leaders);

  $('gm3-intro').textContent = data.intro;
  $('gm3-model-note').innerHTML = `${esc(data.modelNote)} <a href="${esc(window.GM_CHINA_TERRAIN?.source.url || '#')}" target="_blank" rel="noopener">高程来源（需联网）↗</a>`;
  $('gm3-region-note').textContent = data.terrain.note;
  $('gm3-inset').innerHTML = S.insetSVG();
  updateLegend();
  $('gm3-height').value = exaggeration;
  $('gm3-river-note').innerHTML = `${esc(data.riverNote)}<br>` + data.riverCredits.map(credit => `<a href="${esc(credit.url)}" target="_blank" rel="noopener">${esc(credit.label)}（需联网）↗</a>`).join(' · ');
  $('gm3-flow-legend').textContent = data.flowNote;
  $('gm3-flow-river').innerHTML = data.rivers.map(item => `<option value="${item.feature}">${esc(features.get(item.feature).name)}</option>`).join('');
  $('gm3-landmarks').innerHTML = data.featureGroups.map(group => {
    const entries = group.kind === 'river' ? data.rivers : data.terrain.landmarks.filter(mark => features.get(mark.feature).kind === group.kind);
    return `<div class="gm3-feature-group"><h3>${esc(group.label)}</h3><div class="gm3-landmark-tools" role="group" aria-label="${esc(group.label)}">` + entries.map(mark => `<button type="button" data-${group.kind === 'river' ? 'river' : 'landform'}="${mark.feature}" aria-pressed="false">${esc(features.get(mark.feature).name)}</button>`).join('') + '</div></div>';
  }).join('');
  picker.insertAdjacentHTML('beforeend', [...regions.values()].map(r => `<optgroup label="${esc(r.name)}">` +
    provinces.filter(p => p.region === r.id).map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('') + '</optgroup>').join(''));
  $('gm3-observations').innerHTML = data.observations.map((item, i) => `<article class="gm3-observation"><span>观察 ${String(i + 1).padStart(2, '0')}</span><h3>${esc(item.title)}</h3><p>${esc(item.prompt)}</p><button type="button" data-landform="${item.landform}">去看看 →</button></article>`).join('');

  function select(id, updateURL = true, meters = null) {
    const p = byId.get(id);
    if (!p) return;
    closeTour(false, false);
    selected = id;
    focusedLandform = '';
    focusedRiver = '';
    profile.hidden = false;
    featureProfile.hidden = true;
    delete root.dataset.feature;
    updateRivers();
    showElevation(meters);
    root.querySelectorAll('[data-landform], [data-river]').forEach(b => b.setAttribute('aria-pressed', 'false'));
    const region = regions.get(p.region);
    picker.value = id;
    profile.style.setProperty('--province-color', region.color);
    profile.innerHTML = `<span class="gm3-kicker">已点亮 · ${esc(region.name)}</span><h2>${esc(p.name)}</h2>` +
      `<dl><dt>简称</dt><dd>${esc(p.short)}</dd><dt>类型</dt><dd>${esc(p.type)}</dd>` +
      (p.capital ? `<dt>${p.type === '自治区' ? '首府' : '省会'}</dt><dd>${esc(p.capital)}</dd>` : '') +
      `</dl><p><strong>${esc(p.where)}</strong><br>${esc(p.note)}</p>` +
      `<a href="province.html?adcode=${p.adcode}">进省域站细看 →</a><a href="china.html?place=${p.id}#map">在平面地图上看 ↗</a>`;
    $('gm3-flat-link').href = `china.html?place=${p.id}#map`;
    $('gm3-selection').textContent = `${p.name} · 简称${p.short}`;
    root.dataset.selected = id;
    // 深链接可能先于公共侧栏初始化；等待接入后再展开档案。
    if (root.dataset.slReady) revealProfile();
    else document.addEventListener('DOMContentLoaded', revealProfile, { once: true });
    updateProvinces();
    if (updateURL) {
      const url = new URL(location.href);
      url.searchParams.set('place', id);
      url.searchParams.delete('landform');
      url.searchParams.delete('river');
      url.searchParams.delete('tour'); url.searchParams.delete('stop');
      // file:// 下浏览器可能限制 History API，不影响选中与档案。
      try { history.replaceState(null, '', url); } catch (_) { /* 保留当前地址 */ }
    }
    requestDraw();
  }
  function revealProfile() {
    if (root.dataset.slMode === 'compact' && root.dataset.slOpen !== 'true') {
      root.querySelector('.sl-toggle:not(.sl-collapse)')?.click();
    } else if (root.dataset.slMode === 'wide' && root.dataset.slCollapsed === 'true') {
      root.querySelector('.sl-collapse')?.click();
    }
  }
  picker.addEventListener('change', () => { if (picker.value) select(picker.value); else picker.value = selected; });
  function showElevation(meters) {
    $('gm3-elevation').textContent = meters === null ? '在地形上点一下，读出该处网格海拔。' :
      `此处网格海拔约 ${Math.round(meters / 10) * 10} 米 · 高度放大不改变读数`;
    if (meters === null) delete root.dataset.sampleMeters;
    else root.dataset.sampleMeters = String(Math.round(meters));
  }
  function updateLegend() {
    const items = colorMode === 'terrain' ? data.terrain.stops.map(s => ({ name: s.label, color: s.color })) : [...regions.values()];
    $('gm3-legend').innerHTML = items.map(r => `<li><i style="--region:${esc(r.color)}"></i>${esc(r.name)}</li>`).join('');
    $('gm3-legend').hidden = colorMode === 'province';
    $('gm3-region-note').textContent = colorMode === 'terrain' ? data.terrain.note : colorMode === 'province' ? data.provinceNote : data.regionNote;
  }
  function updateProvinces() {
    for (const [id, model] of models) {
      const active = id === selected;
      model.top.vertexColors = colorMode === 'terrain';
      model.top.color.set(colorMode === 'terrain' ? '#ffffff' : colorMode === 'province' ? data.provinceColors[id] : model.color);
      model.top.emissive.set(active ? '#352000' : '#000000');
      model.top.needsUpdate = true;
      model.edge.color.set(active ? '#b94b10' : '#5c584b');
      model.edge.linewidth = active ? 3.5 : 1.6;
      model.halo.linewidth = active ? 6.5 : 3.8;
      model.border.renderOrder = active ? 4 : 1;
      model.outline.renderOrder = active ? 5 : 1.5;
    }
  }
  function focusLandform(id, updateURL = true) {
    const mark = data.terrain.landmarks.find(item => item.feature === id);
    if (!mark) return;
    const model = models.get(mark.province);
    const meters = model ? heightAt(model.geometry, mark.point) : null;
    select(mark.province, false, meters);
    focusedLandform = id;
    showLandforms = true;
    $('gm3-landform-labels').setAttribute('aria-pressed', 'true');
    showFeature(id);
    root.querySelectorAll('[data-landform]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.landform === id)));
    if (controls && !failed) {
      const [x, y] = xy(mark.point), z = heightToZ(meters || 0, exaggeration);
      controls.target.set(x, y, z);
      camera.position.set(x, y - 65, z + 75);
      camera.zoom = 2;
      camera.updateProjectionMatrix();
      controls.update();
      markCustomView();
    }
    if (updateURL) {
      const url = new URL(location.href);
      url.searchParams.set('place', mark.province);
      url.searchParams.set('landform', id);
      url.searchParams.delete('river');
      url.searchParams.delete('tour'); url.searchParams.delete('stop');
      try { history.replaceState(null, '', url); } catch (_) { /* file 协议保持可用 */ }
    }
    requestDraw();
  }
  function showFeature(id) {
    const feature = features.get(id);
    featureProfile.hidden = false;
    featureProfile.innerHTML = `<span class="gm3-kicker">${esc(data.featureGroups.find(group => group.kind === feature.kind).label)}</span><h2>${esc(feature.name)}</h2><p><strong>${esc(feature.where)}</strong><br>${esc(feature.note)}</p><a href="china.html?place=${id}#map">在平面地图上细看 ↗</a>`;
    const coverage = window.GM_CHINA_RIVERS?.rivers[id]?.coverage;
    if (coverage) featureProfile.insertAdjacentHTML('beforeend', `<p class="gm3-coverage">本图河道：${esc(coverage)}</p>`);
    const flow = data.rivers.find(item => item.feature === id)?.flow;
    if (flow) featureProfile.insertAdjacentHTML('beforeend', `<p class="gm3-coverage">${esc(flow.summary)}<br>${esc(flow.note)}</p>`);
    root.dataset.feature = id;
    if (root.dataset.slReady) revealProfile();
    else document.addEventListener('DOMContentLoaded', revealProfile, { once: true });
  }
  function updateRivers() {
    for (const [id, river] of rivers) {
      river.group.visible = showRivers;
      river.group.scale.z = exaggeration;
      const active = focusedRiver === id;
      river.ink.linewidth = active ? 4.5 : ['f20', 'f21'].includes(id) ? 3.2 : 2.6;
      river.halo.linewidth = river.ink.linewidth + 2;
      river.ink.color.set(active ? '#004eae' : '#1477cf');
    }
  }
  function focusRiver(id, updateURL = true) {
    const config = data.rivers.find(item => item.feature === id);
    if (!config) return;
    closeTour(false, false);
    chooseFlow(id);
    focusedRiver = id; focusedLandform = ''; selected = '';
    root.dataset.selected = '';
    picker.value = '';
    profile.hidden = true;
    showElevation(null);
    showFeature(id);
    showRivers = true;
    $('gm3-rivers').setAttribute('aria-pressed', 'true');
    root.querySelectorAll('[data-landform], [data-river]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.river === id)));
    updateProvinces();
    const feature = features.get(id), river = rivers.get(id);
    $('gm3-selection').textContent = `${feature.name} · 真实河道`;
    $('gm3-flat-link').href = `china.html?place=${id}#map`;
    if (river && controls && !failed) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const sample of river.samples) {
        const [x, y] = xy(sample.point);
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
      const x = (minX + maxX) / 2, y = (minY + maxY) / 2;
      controls.target.set(x, y, datum);
      camera.position.set(x, y - 72, 75);
      camera.zoom = Math.min(2, (camera.right - camera.left) / (maxX - minX + 10), (camera.top - camera.bottom) / (maxY - minY + 12));
      camera.updateProjectionMatrix(); controls.update(); markCustomView();
    }
    updateRivers();
    syncFlow();
    if (updateURL) {
      const url = new URL(location.href);
      url.searchParams.set('river', id);
      url.searchParams.delete('place'); url.searchParams.delete('landform');
      url.searchParams.delete('tour'); url.searchParams.delete('stop');
      try { history.replaceState(null, '', url); } catch (_) { /* 保留当前地址 */ }
    }
    requestDraw();
  }
  for (const id of ['gm3-observations', 'gm3-landmarks']) $(id).addEventListener('click', e => {
    const button = e.target.closest('[data-landform], [data-river]');
    if (!button) return;
    if (button.dataset.river) focusRiver(button.dataset.river);
    else focusLandform(button.dataset.landform);
    $('map').scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  function readLocation() {
    closeTour(false, false);
    const params = new URLSearchParams(location.search);
    const id = params.get('place') || (params.has('adcode') ? `p${params.get('adcode')}` : '');
    const landform = params.get('landform');
    const river = params.get('river');
    if (data.rivers.some(mark => mark.feature === river)) focusRiver(river, false);
    else if (data.terrain.landmarks.some(mark => mark.feature === landform)) focusLandform(landform, false);
    else if (byId.has(id)) select(id, false);
    else if (id) $('gm3-selection').textContent = '没有找到这个省份，请从列表重新选择。';
    const route = tourData.routes.find(item => item.id === params.get('tour'));
    if (route) startTour(route.id, false, params.get('stop'));
  }
  window.addEventListener('popstate', readLocation);

  const { xy, buildTerrain, datum, metersPerUnit, heightToZ, elevationFromZ, heightAt, labelHeight, createSurfaceSampler, drapeRiver } = window.GMChina3DGeometry || {};
  function syncFlow() {
    const flow = flowConfig(), available = flowAvailable(), playing = Boolean(flowPlayback?.playing);
    $('gm3-flow-river').value = flowRiver;
    $('gm3-flow-play').disabled = !available || !fullMotion();
    $('gm3-flow-play').textContent = playing ? '暂停流向' : '播放流向';
    $('gm3-flow-play').setAttribute('aria-pressed', String(playing));
    $('gm3-flow-step').disabled = !available;
    $('gm3-flow-ends').disabled = failed || !showRivers;
    $('gm3-flow-summary').textContent = flow.summary;
    $('gm3-flow-note').innerHTML = esc(flow.note) + ' ' + flow.sources.map(source => `<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.label)}（需联网）↗</a>`).join(' · ');
    $('gm3-flow-status').textContent = failed ? '立体画面不可用，仍可阅读源头与去向。' : !showRivers ? '打开「主要河流」后可观察。' :
      flow.mode === 'managed' ? '人工运河没有统一的全线流向。' : !fullMotion() ? '已减少动效，可点「前进一步」。' :
      playing ? '箭头向下游走 · 演示速度' : '箭头指向下游 · 可播放或单步观察';
    root.dataset.flowRiver = flowRiver;
    root.dataset.flowPlaying = String(playing);
    syncTour();
  }
  function chooseFlow(id) {
    if (!data.rivers.some(item => item.feature === id)) return;
    flowRiver = id;
    flowPlayback?.reset();
    syncFlow();
    requestDraw();
  }
  function projectFlow(sample) {
    const [x, y] = xy(sample.point);
    const vector = new T.Vector3(x, y, heightToZ(sample.meters + 3, exaggeration) + .001).project(camera);
    return { x: (vector.x + 1) * width / 2, y: (1 - vector.y) * height / 2,
      visible: vector.z > -1 && vector.z < 1 && Math.abs(vector.x) < .99 && Math.abs(vector.y) < .99 };
  }
  function drawFlow(seconds = flowPlayback?.seconds || 0) {
    if (!camera || failed) return;
    for (const arrow of flowArrows) {
      if (!showRivers || arrow.id !== flowRiver) { arrow.el.style.visibility = 'hidden'; continue; }
      const distance = (seconds * 90 + arrow.offset) % arrow.track.length;
      const a = projectFlow(window.GMRiverFlow.atDistance(arrow.track, distance));
      const before = projectFlow(window.GMRiverFlow.atDistance(arrow.track, Math.max(0, distance - 3)));
      const after = projectFlow(window.GMRiverFlow.atDistance(arrow.track, Math.min(arrow.track.length, distance + 3)));
      const angle = Math.atan2(after.y - before.y, after.x - before.x) * 180 / Math.PI;
      arrow.el.style.visibility = a.visible ? 'visible' : 'hidden';
      arrow.el.setAttribute('transform', `translate(${a.x.toFixed(2)} ${a.y.toFixed(2)}) rotate(${angle.toFixed(2)})`);
    }
    for (const endpoint of flowEndpoints) {
      const point = projectFlow(endpoint);
      endpoint.el.style.visibility = showRivers && showEnds && endpoint.id === flowRiver && point.visible ? 'visible' : 'hidden';
      endpoint.el.setAttribute('cx', point.x); endpoint.el.setAttribute('cy', point.y);
    }
    root.dataset.flowSeconds = seconds.toFixed(3);
    if (tourPoint && tourController && showRivers) {
      const point = projectFlow(tourPoint);
      tourMarker.style.display = point.visible ? '' : 'none';
      tourMarker.setAttribute('transform', `translate(${point.x} ${point.y})`);
    } else tourMarker.style.display = 'none';
  }
  function writeTourURL() {
    if (!tourController || tourWritingURL) return;
    const state = tourController.snapshot();
    const url = new URL(location.href);
    url.searchParams.set('river', tourRoute.river);
    url.searchParams.set('tour', tourRoute.id);
    url.searchParams.set('stop', tourRoute.stops[state.index].id);
    url.searchParams.delete('place'); url.searchParams.delete('landform');
    try { history.replaceState(null, '', url); } catch (_) { /* 保留手动漫游 */ }
  }
  function syncTour(state = tourController?.snapshot()) {
    $('gm3-tour-start').hidden = !tourData.routes.some(route => route.river === flowRiver);
    if (!tourController || !state) return;
    const target = state.phase === 'travel' ? Math.min(state.index + 1, tourRoute.stops.length - 1) : state.index;
    const stop = tourRoute.stops[target];
    $('gm3-tour-phase').textContent = `${tourRoute.name} · ${state.phase === 'travel' ? '前往' : '第'} ${target + 1}／${tourRoute.stops.length} 站 · ${stop.terrain}`;
    $('gm3-tour-title').textContent = stop.name;
    $('gm3-tour-play').textContent = state.playing ? '暂停漫游' : state.phase === 'complete' ? '重新漫游' : '继续漫游';
    $('gm3-tour-play').setAttribute('aria-pressed', String(state.playing));
    $('gm3-tour-play').disabled = failed || !showRivers || !fullMotion();
    $('gm3-tour-prev').disabled = state.index === 0 && state.phase !== 'travel';
    $('gm3-tour-next').disabled = state.index === tourRoute.stops.length - 1;
    $('gm3-tour-stop').value = String(state.index);
    $('gm3-tour-speed').value = String(state.speed);
    $('gm3-tour-status').textContent = failed ? '立体画面不可用，仍可逐站阅读介绍。' : !showRivers ? '河流已隐藏，打开「主要河流」后可继续。' :
      !fullMotion() ? '已减少动效，可用「上一站／下一站」静态查看。' : state.phase === 'complete' ? '已到达入海口，这次沿河漫游完成啦！' :
      !state.playing ? '已暂停，可慢慢阅读、转动地图，或继续沿河前进。' : state.phase === 'stop' ? '停站观察约 8 秒，再继续向下游走。' : `沿河前进，下一站是${stop.name}。`;
    const storyKey = `${tourRoute.id}:${stop.id}`;
    if (tourStory !== storyKey) {
      tourStory = storyKey;
      const links = stop.related.map(id => `<a href="china.html?place=${id}#map">${esc(features.get(id).name)}档案 ↗</a>`);
      const sources = stop.sources.map(id => tourData.sources.find(source => source.id === id));
      $('gm3-tour-story').innerHTML = `<p>${esc(stop.description)}</p><p><strong>看一看：</strong>${esc(stop.observe)}</p><div class="gm3-tour-links">${links.join('')}${sources.map(source => `<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.label)}（需联网）↗</a>`).join('')}</div>`;
    }
    tourMarker.querySelector('text').textContent = state.phase === 'travel' ? '沿河前进' : tourRoute.stops[state.index].name;
    root.dataset.tourPlaying = String(state.playing);
    root.dataset.tourPhase = state.phase;
    root.dataset.tourStation = tourRoute.stops[state.index].id;
    writeTourURL();
  }
  function followTour(force = false) {
    if (!tourPoint || !camera || failed || !tourController) return;
    const state = tourController.snapshot();
    if (!force && state.distance === tourLastDistance) return;
    tourLastDistance = state.distance;
    const [x, y] = xy(tourPoint.point), z = heightToZ(tourPoint.meters, exaggeration);
    controls.target.set(x, y, z);
    camera.position.copy(controls.target).add(tourOffset);
    camera.zoom = tourZoom;
    camera.updateProjectionMatrix(); controls.update();
    root.dataset.tourLongitude = tourPoint.point[0].toFixed(6);
    root.dataset.tourLatitude = tourPoint.point[1].toFixed(6);
    requestDraw();
  }
  function closeTour(restore = true, updateURL = true) {
    if (!tourController) return;
    const saved = tourView;
    tourWritingURL = true;
    tourController.dispose(); tourController = null;
    tourWritingURL = false;
    tourRoute = tourView = tourPoint = null; tourLastDistance = null; tourStory = '';
    $('gm3-tour-panel').hidden = true;
    root.dataset.tourActive = 'false'; root.dataset.tourPlaying = 'false';
    tourMarker.style.display = 'none';
    if (controls && saved) {
      controls.maxZoom = saved.maxZoom;
      if (restore && !failed) {
        camera.position.copy(saved.position); controls.target.copy(saved.target); camera.zoom = saved.zoom;
      } else camera.zoom = Math.min(camera.zoom, controls.maxZoom);
      camera.updateProjectionMatrix(); controls.update();
    }
    if (updateURL) {
      const url = new URL(location.href); url.searchParams.delete('tour'); url.searchParams.delete('stop');
      try { history.replaceState(null, '', url); } catch (_) { /* file 协议 */ }
    }
    requestDraw();
  }
  function startTour(id, autoplay = true, stopId = null) {
    const config = tourData.routes.find(route => route.id === id);
    if (!config || !window.GMRiverTour) return;
    const saved = tourView || (controls && !failed ? { position: camera.position.clone(), target: controls.target.clone(), zoom: camera.zoom, maxZoom: controls.maxZoom } : null);
    closeTour(false, false);
    focusRiver(config.river, false);
    flowPlayback?.pause();
    if (!tourRoutes.has(id)) {
      const paths = rivers.get(config.river)?.paths || window.GM_CHINA_RIVERS.rivers[config.river].paths.map(path => path.map(p => ({ point: p.slice(0, 2), meters: p[2] })));
      const directions = data.rivers.find(river => river.feature === config.river).flow.directions;
      tourRoutes.set(id, { ...config, ...window.GMRiverTour.buildRoute(paths, config.stops, directions) });
    }
    tourRoute = tourRoutes.get(id); tourView = saved;
    flowLayer.append(tourMarker);
    tourOffset = new T.Vector3(0, -28, 42); tourZoom = width < 700 ? 4 : 6;
    if (controls) controls.maxZoom = 8;
    $('gm3-tour-panel').hidden = false;
    root.dataset.tourActive = 'true'; root.dataset.tourRoute = id;
    $('gm3-tour-route').innerHTML = tourData.routes.map(route => `<option value="${route.id}">${esc(route.name)}</option>`).join('');
    $('gm3-tour-route').value = id;
    $('gm3-tour-stop').innerHTML = tourRoute.stops.map((stop, i) => `<option value="${i}">${i + 1} · ${esc(stop.name)}</option>`).join('');
    $('gm3-tour-note').textContent = tourData.note;
    tourController = window.GMRiverTour.createTour({
      route: tourRoute, holdSeconds: tourData.holdSeconds, travelSeconds: tourData.travelSeconds,
      request: callback => requestAnimationFrame(callback), cancel: id => cancelAnimationFrame(id),
      canPlay: () => !failed && showRivers && fullMotion() && !document.hidden && inView,
      changed: syncTour,
      moved: (point, state) => {
        tourPoint = point;
        $('gm3-tour-progress').value = state.progress;
        $('gm3-tour-progress-text').textContent = `${Math.round(state.progress * 100)}％ · ${state.index + 1}／${tourRoute.stops.length} 站`;
        root.dataset.tourProgress = state.progress.toFixed(6);
        followTour();
      },
    });
    tourController.jump(Math.max(0, tourRoute.stops.findIndex(stop => stop.id === stopId)));
    root.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', 'false'));
    if (autoplay) {
      viewport.scrollIntoView({ block: 'start', behavior: 'instant' });
      const rect = viewport.getBoundingClientRect(); inView = rect.bottom > 0 && rect.top < innerHeight;
      tourController.play();
      $('gm3-tour-play').focus({ preventScroll: true });
    }
    requestDraw();
  }
  function makeLabel(id, name, point, meters = 0, kind = 'province') {
    const el = document.createElement(kind === 'province' ? 'button' : 'span');
    el.className = `gm3-map-label${kind === 'island' ? ' is-island' : ''}${kind === 'terrain' ? ' is-terrain' : ''}${kind === 'river' ? ' is-river' : ''}${kind === 'endpoint' ? ' is-endpoint' : ''}`;
    el.dataset.feature = id;
    el.dataset.kind = features.get(id)?.kind || kind;
    el.textContent = name;
    if (kind === 'province') {
      el.type = 'button';
      el.setAttribute('aria-label', `查看${byId.get(id).name}`);
      el.addEventListener('click', () => select(id));
    } else el.setAttribute('aria-hidden', 'true');
    $('gm3-label-layer').append(el);
    const leader = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    leader.setAttribute('stroke', kind === 'river' ? '#1477cf' : kind === 'province' ? '#554735' : '#7b725b');
    if (kind === 'province') leader.classList.add('is-province');
    leaders.append(leader);
    const anchor = kind === 'province' ? document.createElementNS('http://www.w3.org/2000/svg', 'circle') : null;
    if (anchor) {
      anchor.setAttribute('r', '2.5');
      anchor.setAttribute('fill', '#554735');
      anchor.setAttribute('stroke', '#fffdf5');
      anchor.setAttribute('stroke-width', '1');
      leaders.append(anchor);
    }
    const [x, y] = xy(point);
    const label = { id, el, leader, anchor, point: new T.Vector3(x, y, 0), meters, kind };
    labels.push(label);
    return label;
  }
  function requestDraw() {
    if (!renderer || failed || frame) return;
    frame = requestAnimationFrame(draw);
  }
  function draw() {
    frame = 0;
    if (!renderer || failed) return;
    renderer.render(scene, camera);
    const occupied = [];
    if (tourController) occupied.push([width / 2 - 25, height / 2 - 30, width / 2 + 180, height / 2 + 12]);
    // 省名默认优先，给小省区提供引线避让；聚焦山河时仍优先展示该地点。
    const priority = label => {
      if (label.id === selected) return 20;
      if (label.id === focusedLandform || label.id === focusedRiver) return 18;
      // 大省区先保留地理中心，小省区通过短引线寻找空位。
      if (label.kind === 'province') return 14 + Math.min(S.provLabel.get(label.id)?.[2] || 1, 500) / 1000;
      if (label.kind === 'endpoint') return 12;
      if (['f20', 'f21'].includes(label.id)) return 7;
      if (label.kind === 'river') return 5;
      if (label.kind === 'terrain') {
        const kind = features.get(label.id).kind;
        return ['plateau', 'plain'].includes(kind) ? 6 : kind === 'mountain' ? 5.5 : 3;
      }
      return 0;
    };
    for (const label of [...labels].sort((a, b) => priority(b) - priority(a))) {
      label.el.classList.toggle('is-selected', label.id === selected);
      if (label.kind === 'province') label.el.setAttribute('aria-pressed', String(label.id === selected));
      label.el.classList.toggle('is-focused', label.id === focusedLandform || label.id === focusedRiver);
      const point = label.point.clone();
      point.z = heightToZ(label.meters, exaggeration) + .2;
      point.project(camera);
      const x = (point.x + 1) * width / 2, y = (1 - point.y) * height / 2;
      const labelWidth = label.el.offsetWidth || 50, labelHeight = label.el.offsetHeight || 20;
      const enabled = label.kind === 'endpoint' ? showRivers && showEnds && label.riverId === flowRiver : label.kind === 'terrain' ? showLandforms : label.kind === 'river' ? showRivers : showLabels || label.id === selected;
      const gapX = labelWidth + 8, gapY = labelHeight + 8;
      const provinceOffsets = [[0, 0], [0, -gapY], [0, gapY], [gapX, 0], [-gapX, 0], [-gapX, -gapY], [gapX, gapY], [gapX, -gapY], [-gapX, gapY], [0, -gapY * 2], [0, gapY * 2], [gapX * 2, 0], [-gapX * 2, 0], [gapX * 2, -gapY], [gapX * 2, gapY], [-gapX * 2, -gapY], [-gapX * 2, gapY], [gapX * 3, 0], [-gapX * 3, 0]];
      const offsets = label.kind === 'province' ? provinceOffsets : label.kind === 'endpoint' ? [[0, -27], [0, 27], [-65, -27], [65, 27], [-100, 0], [100, 0], [0, -55], [0, 55], [140, 0], [-140, 0], [170, 0], [-170, 0]] : label.kind === 'terrain' || label.kind === 'river' ? [[0, 0], [0, -30], [0, 30], [-24, -48], [24, 48], [-38, 0], [38, 0], [0, -60], [0, 60], [-60, -30], [60, 30]] : [[0, 0]];
      let placement;
      if (enabled && point.z > -1 && point.z < 1 && x > 10 && x < width - 10 && y > 14 && y < height - 14) {
        for (const [dx, dy] of offsets) {
          const box = [x + dx - labelWidth / 2 - 3, y + dy - labelHeight / 2 - 3, x + dx + labelWidth / 2 + 3, y + dy + labelHeight / 2 + 3];
          if (box[0] < 6 || box[2] > width - 6 || box[1] < 6 || box[3] > height - 6) continue;
          if (occupied.some(b => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
          placement = { dx, dy, box }; break;
        }
      }
      const visible = Boolean(placement);
      label.el.style.visibility = visible ? 'visible' : 'hidden';
      label.el.style.left = `${x + (placement?.dx || 0)}px`;
      label.el.style.top = `${y + (placement?.dy || 0)}px`;
      label.leader.style.visibility = visible && (placement.dx || placement.dy) ? 'visible' : 'hidden';
      if (label.anchor) {
        label.anchor.style.visibility = label.leader.style.visibility;
        label.anchor.setAttribute('cx', x); label.anchor.setAttribute('cy', y);
      }
      if (visible) {
        occupied.push(placement.box);
        label.leader.setAttribute('x1', x); label.leader.setAttribute('y1', y);
        label.leader.setAttribute('x2', x + placement.dx); label.leader.setAttribute('y2', y + placement.dy);
      }
    }
    const origin = new T.Vector3(0, 0, 0).project(camera);
    const north = new T.Vector3(0, 10, 0).project(camera);
    const angle = Math.atan2((north.x - origin.x) * width, (north.y - origin.y) * height) * 180 / Math.PI;
    $('gm3-north').setAttribute('transform', `translate(40 43) rotate(${angle})`);
    root.dataset.azimuth = controls.getAzimuthalAngle().toFixed(3);
    root.dataset.zoom = camera.zoom.toFixed(2);
    root.dataset.exaggeration = String(exaggeration);
    root.dataset.colorMode = colorMode;
    root.dataset.riversVisible = String(showRivers);
    drawFlow();
  }
  function resize() {
    if (!renderer) return;
    width = Math.max(1, viewport.clientWidth);
    height = Math.max(1, viewport.clientHeight);
    const aspect = width / height;
    // 窄画布按宽度完整容纳中国，宽屏按高度展示；横竖屏切换不会裁掉国土。
    const span = Math.max(23, 34 / aspect);
    camera.left = -span * aspect;
    camera.right = span * aspect;
    camera.top = span;
    camera.bottom = -span;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    requestDraw();
  }
  function setView(view) {
    if (!controls || failed) return;
    camera.position.set(0, view === 'top' ? -.001 : -72, view === 'top' ? 110 : 75);
    camera.zoom = 1;
    controls.target.set(0, 0, 0);
    camera.updateProjectionMatrix();
    controls.update();
    root.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
    requestDraw();
  }
  function rotate(horizontal, vertical = 0) {
    if (!controls || failed) return;
    let theta = controls.getAzimuthalAngle() + horizontal;
    const phi = Math.max(.04, Math.min(1.25, controls.getPolarAngle() + vertical));
    const distance = camera.position.distanceTo(controls.target);
    // OrbitControls 以 Z 为上轴；其内部方位角坐标由 Y-up 旋转而来。
    camera.position.set(distance * Math.sin(phi) * Math.sin(theta), -distance * Math.sin(phi) * Math.cos(theta), distance * Math.cos(phi)).add(controls.target);
    controls.update();
    markCustomView();
  }
  function zoom(factor) {
    if (!camera || failed) return;
    camera.zoom = Math.max(.65, Math.min(controls.maxZoom, camera.zoom * factor));
    camera.updateProjectionMatrix();
    controls.update();
    requestDraw();
  }
  function markCustomView() {
    tourController?.pause();
    root.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', 'false'));
    requestDraw();
  }
  function fallback(message) {
    failed = true;
    root.dataset.renderer = 'unavailable';
    flowPlayback?.pause();
    tourController?.pause();
    flowLayer.style.display = 'none';
    syncFlow();
    $('gm3-fallback').hidden = false;
    if (message) $('gm3-fallback').firstChild.textContent = message;
    $('gm3-label-layer').hidden = true;
    canvas.hidden = true;
    root.querySelectorAll('.gm3-toolbar button, .gm3-terrain-tools button, #gm3-height').forEach(b => { b.disabled = true; });
  }
  try {
    renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    scene = new T.Scene();
    camera = new T.OrthographicCamera(-40, 40, 30, -30, .1, 400);
    camera.up.set(0, 0, 1);
    controls = new T.OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.enableDamping = false;
    controls.minPolarAngle = .001;
    controls.maxPolarAngle = 1.25;
    controls.minZoom = .65;
    controls.maxZoom = 3.5;
    controls.rotateSpeed = .65;
    controls.addEventListener('change', requestDraw);
    controls.addEventListener('start', markCustomView);
    scene.add(new T.AmbientLight('#ffffff', .9));
    const sun = new T.DirectionalLight('#fff5e5', 2.6);
    sun.position.set(-35, -45, 90);
    scene.add(sun);
    const grid = new T.GridHelper(100, 20, '#b1ced4', '#c2dce0');
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -.25;
    scene.add(grid);
    if (!window.GM_CHINA_TERRAIN) throw new Error('高程数据未加载');
    for (const p of provinces) {
      const color = regions.get(p.region).color;
      const geometry = buildTerrain(window.GM_CHINA_TERRAIN.provinces[p.adcode]);
      const group = new T.Group();
      group.position.z = datum;
      group.scale.z = exaggeration;
      const top = new T.MeshLambertMaterial({ vertexColors: true });
      const side = new T.MeshLambertMaterial({ color: '#65745c' });
      const mesh = new T.Mesh(geometry.top, top);
      mesh.userData.province = p.id;
      // 屏幕像素宽度保持省界清楚；浅色衬边隔开地形纹理，轮廓随真实地形起伏。
      const boundary = new T.LineSegmentsGeometry().setPositions(geometry.outline.getAttribute('position').array);
      const halo = new T.LineMaterial({ color: '#fff9e9', linewidth: 3.8, depthTest: false, depthWrite: false });
      const edge = new T.LineMaterial({ color: '#5c584b', linewidth: 1.6, depthTest: false, depthWrite: false });
      const border = new T.LineSegments2(boundary, halo), outline = new T.LineSegments2(boundary, edge);
      border.position.z = outline.position.z = .00025;
      border.renderOrder = 1; outline.renderOrder = 1.5;
      group.add(mesh, new T.Mesh(geometry.side, side), border, outline);
      models.set(p.id, { group, mesh, top, edge, halo, border, outline, color, geometry });
      scene.add(group);
      const point = data.labelPoints[p.id] || S.provLabel.get(p.id);
      makeLabel(p.id, S.displayName(p.name), point, labelHeight(geometry, point));
    }
    for (const mark of data.terrain.landmarks) {
      const geometry = models.get(mark.province).geometry;
      makeLabel(mark.feature, features.get(mark.feature).name, mark.point, labelHeight(geometry, mark.point), 'terrain');
    }
    const sampleSurface = createSurfaceSampler([...models.values()].map(model => model.geometry));
    for (const config of data.rivers) {
      const feature = features.get(config.feature), record = window.GM_CHINA_RIVERS?.rivers[config.feature];
      if (!record) throw new Error(`真实河道未加载：${feature.name}`);
      const draped = drapeRiver(record.paths, sampleSurface);
      if (!draped.paths.length) throw new Error(`水系未能贴合地形：${feature.name}`);
      const group = new T.Group();
      group.position.z = datum + .001;
      const halo = new T.LineMaterial({ color: '#effbff', linewidth: 5.2, depthWrite: false });
      const ink = new T.LineMaterial({ color: '#1477cf', linewidth: 3.2, depthWrite: false });
      for (const path of draped.paths) {
        const positions = path.flatMap(sample => [...xy(sample.point), (sample.meters + 3) / metersPerUnit]);
        const geometry = new T.LineGeometry(); geometry.setPositions(positions);
        const border = new T.Line2(geometry, halo), line = new T.Line2(geometry, ink);
        border.renderOrder = 2; line.renderOrder = 3;
        group.add(border, line);
      }
      rivers.set(config.feature, { group, halo, ink, samples: draped.samples, paths: draped.paths });
      for (let i = 0; i < draped.paths.length; i++) {
        if (config.flow.directions[i] === 0) continue;
        const track = window.GMRiverFlow.createTrack(draped.paths[i], config.flow.directions[i]);
        if (track.length < 5) continue;
        const count = Math.max(1, Math.min(24, Math.floor(track.length / 180)));
        for (let n = 0; n < count; n++) {
          const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          el.setAttribute('d', 'M-7 -4 L1 0 L-7 4 L-4 0 Z');
          el.setAttribute('class', 'gm3-flow-arrow');
          el.dataset.river = config.feature;
          flowLayer.append(el);
          flowArrows.push({ id: config.feature, track, offset: (n + .5) * track.length / count, el });
        }
      }
      config.flow.endpoints.forEach((endpoint, index) => {
        const meters = sampleSurface(endpoint.point) ?? 0;
        const label = makeLabel(`${config.feature}:endpoint:${index}`, endpoint.label, endpoint.point, meters, 'endpoint');
        label.riverId = config.feature;
        label.el.dataset.endpointKind = endpoint.kind;
        label.el.classList.toggle('is-downstream', index === 1);
        label.leader.setAttribute('stroke', index === 0 ? '#21824b' : '#d2661a');
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        el.setAttribute('r', '6');
        el.setAttribute('class', `gm3-flow-point is-${index === 0 ? 'upstream' : 'downstream'}`);
        flowLayer.append(el);
        flowEndpoints.push({ id: config.feature, point: endpoint.point, meters, el });
      });
      scene.add(group);
      const point = record.labelPoint;
      const meters = sampleSurface(point) ?? point[2];
      makeLabel(config.feature, feature.name, point, meters, 'river');
    }
    updateRivers();
    for (const feature of window.GM_FEATURES.filter(f => ['钓鱼岛', '赤尾屿'].includes(f.name))) {
      makeLabel(feature.id, `· ${feature.name}`, feature.point, 0, 'island');
    }
    root.dataset.renderer = 'webgl';
    root.dataset.provinceCount = String(models.size);
    root.dataset.riverCount = String(rivers.size);
    setView('perspective');
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(viewport);
    const raycaster = new T.Raycaster();
    let gesture = null;
    canvas.addEventListener('pointerdown', e => {
      tourController?.pause();
      if (!e.isPrimary || e.button !== 0) { gesture = null; return; }
      gesture = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false };
    });
    canvas.addEventListener('pointermove', e => {
      if (gesture && Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) > 6) gesture.moved = true;
    });
    canvas.addEventListener('pointercancel', () => { gesture = null; });
    canvas.addEventListener('pointerup', e => {
      const start = gesture;
      gesture = null;
      if (!start || start.id !== e.pointerId || start.moved || failed) return;
      const rect = canvas.getBoundingClientRect();
      raycaster.setFromCamera(new T.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1), camera);
      const hit = raycaster.intersectObjects([...models.values()].map(m => m.mesh), false)[0];
      if (hit) select(hit.object.userData.province, true, elevationFromZ(hit.point.z, exaggeration));
    });
    canvas.addEventListener('webglcontextlost', e => {
      e.preventDefault();
      fallback('立体画面暂时中断，刷新页面可重试。仍可从省份列表或山河目录阅读档案，或');
    });
    canvas.addEventListener('webglcontextrestored', () => {
      failed = false;
      root.dataset.renderer = 'webgl';
      $('gm3-fallback').hidden = true;
      $('gm3-label-layer').hidden = false;
      flowLayer.style.display = '';
      canvas.hidden = false;
      root.querySelectorAll('.gm3-toolbar button, .gm3-terrain-tools button, #gm3-height').forEach(b => { b.disabled = false; });
      resize();
      syncFlow();
      syncTour();
    });
    window.addEventListener('pagehide', e => {
      cancelAnimationFrame(frame); frame = 0;
      flowPlayback?.pause();
      tourController?.pause();
      if (e.persisted) return;
      flowPlayback?.dispose();
      tourController?.dispose();
      observer.disconnect(); controls.dispose();
      const materials = new Set(), geometries = new Set();
      scene.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
      });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); renderer.dispose();
    });
    window.addEventListener('pageshow', resize);
  } catch (error) {
    controls?.dispose();
    renderer?.dispose();
    fallback();
    console.warn('立体地图不可用，已保留省份档案。', error.message);
  }
  root.querySelector('.gm3-toolbar').addEventListener('click', e => {
    const button = e.target.closest('button');
    if (!button || button.disabled) return;
    if (button.dataset.view || button.dataset.action) tourController?.pause();
    if (button.dataset.view) setView(button.dataset.view);
    const action = button.dataset.action;
    if (action === 'left') rotate(-Math.PI / 8);
    if (action === 'right') rotate(Math.PI / 8);
    if (action === 'zoom-in') zoom(1.2);
    if (action === 'zoom-out') zoom(1 / 1.2);
    if (action === 'reset') setView('perspective');
    if (button.id === 'gm3-rivers') {
      showRivers = !showRivers;
      button.setAttribute('aria-pressed', String(showRivers));
      updateRivers(); requestDraw();
      flowPlayback?.refresh();
      tourController?.refresh();
    }
    if (button.id === 'gm3-landform-labels') {
      showLandforms = !showLandforms;
      button.setAttribute('aria-pressed', String(showLandforms));
      requestDraw();
    }
    if (button.id === 'gm3-labels') {
      showLabels = !showLabels;
      button.setAttribute('aria-pressed', String(showLabels));
      requestDraw();
    }
  });
  $('gm3-height').addEventListener('input', e => {
    exaggeration = Math.max(1, Math.min(80, Number(e.target.value)));
    $('gm3-height-output').value = `${exaggeration}×`;
    $('gm3-stamp-height').textContent = `${exaggeration}×`;
    for (const model of models.values()) model.group.scale.z = exaggeration;
    updateRivers();
    followTour(true);
    requestDraw();
  });
  root.querySelector('.gm3-terrain-tools').addEventListener('click', e => {
    const button = e.target.closest('[data-color]');
    if (!button || button.disabled) return;
    colorMode = button.dataset.color;
    updateProvinces();
    root.querySelectorAll('[data-color]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.color === colorMode)));
    updateLegend(); requestDraw();
  });
  canvas.addEventListener('keydown', e => {
    const actions = { ArrowLeft: () => rotate(-.12), ArrowRight: () => rotate(.12), ArrowUp: () => rotate(0, -.12), ArrowDown: () => rotate(0, .12), '+': () => zoom(1.2), '=': () => zoom(1.2), '-': () => zoom(1 / 1.2), Home: () => setView('perspective') };
    if (actions[e.key]) { e.preventDefault(); tourController?.pause(); actions[e.key](); }
  });
  readLocation();
  if (!window.GMRiverFlow) { syncFlow(); return; }
  flowPlayback = window.GMRiverFlow.createPlayback({
    request: callback => requestAnimationFrame(callback), cancel: id => cancelAnimationFrame(id),
    available: flowAvailable, canAnimate: () => fullMotion() && !document.hidden && inView,
    render: drawFlow, changed: syncFlow,
  });
  const refreshFlow = () => { flowPlayback.refresh(); tourController?.refresh(); };
  const flowObserver = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    refreshFlow();
  });
  flowObserver.observe(viewport);
  document.addEventListener('visibilitychange', refreshFlow);
  document.addEventListener('study:effects-change', refreshFlow);
  motionMedia.addEventListener('change', refreshFlow);
  window.addEventListener('pagehide', event => {
    flowPlayback.pause();
    tourController?.pause();
    if (event.persisted) return;
    flowObserver.disconnect();
    document.removeEventListener('visibilitychange', refreshFlow);
    document.removeEventListener('study:effects-change', refreshFlow);
    motionMedia.removeEventListener('change', refreshFlow);
  });
  window.addEventListener('pageshow', refreshFlow);
  $('gm3-flow-river').addEventListener('change', event => focusRiver(event.target.value));
  $('gm3-flow-play').addEventListener('click', () => { tourController?.pause(); flowPlayback.playing ? flowPlayback.pause() : flowPlayback.play(); });
  $('gm3-flow-step').addEventListener('click', () => { tourController?.pause(); flowPlayback.step(); });
  $('gm3-flow-ends').addEventListener('click', () => {
    showEnds = !showEnds;
    $('gm3-flow-ends').setAttribute('aria-pressed', String(showEnds));
    requestDraw();
  });
  $('gm3-tour-start').addEventListener('click', () => startTour(tourData.routes.find(route => route.river === flowRiver)?.id));
  $('gm3-tour-close').addEventListener('click', () => { closeTour(); $('gm3-tour-start').focus({ preventScroll: true }); });
  $('gm3-tour-route').addEventListener('change', event => startTour(event.target.value, false));
  $('gm3-tour-play').addEventListener('click', () => {
    if (!tourController) return;
    if (tourController.snapshot().playing) tourController.pause();
    else {
      flowPlayback.pause();
      if (controls && !failed) { tourOffset.copy(camera.position).sub(controls.target); tourZoom = camera.zoom; }
      tourLastDistance = null;
      tourController.play();
    }
  });
  const jumpTour = index => { if (!tourController) return; tourLastDistance = null; tourController.jump(index); };
  $('gm3-tour-prev').addEventListener('click', () => {
    const state = tourController?.snapshot();
    if (state) jumpTour(state.phase === 'travel' ? state.index : state.index - 1);
  });
  $('gm3-tour-next').addEventListener('click', () => { if (tourController) jumpTour(tourController.snapshot().index + 1); });
  $('gm3-tour-stop').addEventListener('change', event => jumpTour(Number(event.target.value)));
  $('gm3-tour-speed').addEventListener('change', event => tourController?.setSpeed(Number(event.target.value)));
  syncFlow();
})();

/* 本地球面地球仪：复用世界档案，静止时按需绘制，自转由孩子主动开启。 */
(() => {
  'use strict';
  const root = document.querySelector('.world-3d-topic');
  if (!root) return;
  const $ = id => root.querySelector(`#${id}`);
  root.dataset.globeAssets = new URL('.', document.currentScript.src).href;
  const D = window.GM_WORLD_3D, G = window.GMWorld3DGeometry, T = window.GMThree;
  const L = window.GM_WORLD_LEARNING;
  const countries = window.GEO_WORLD_GEO?.countries || [];
  const continents = window.GM_CONTINENTS || [], oceans = window.GM_OCEANS || [], features = window.GM_WORLD_FEATURES || [];
  const meta = window.GM_COUNTRY_META || {}, esc = window.GMShared?.esc;
  if (!D || !G || !L || !esc || !countries.length || !window.GM_WORLD_3D_POLAR || !window.GM_WORLD_VISUAL || !window.GMWorldVisual) {
    $('gw-fallback').hidden = false;
    $('gw-status').textContent = '地图资料没有完整加载，请刷新页面，或打开平面世界地图。';
    return;
  }
  const countryMap = new Map(countries.map(c => [c.name, c]));
  const continentMap = new Map(continents.map(c => [c.id, c]));
  const zh = id => meta[id]?.[0] || id;
  const featurePoint = f => f.point || f.line[Math.floor((f.line.length - 1) / 2)];
  let selected = '', selectedContinent = '', renderer, scene, camera, controls, globe, texture, marker, frame = 0, visible = true, lost = false, disposed = false;
  let layer = 'continent', activeLine = '';
  let addons, toolbox, toolOverlay, referencePoint = D.home;
  let sunLab, ambient, sunlight, sunRing, sunSpot, visuals, rotation, sunModel;
  let lab, gyro, skyGroup, shipPoint = null, textureKey = '', texturePaints = 0;
  let overlayState = {points: [], route: null}, markerPoint;
  const surface = (point, clearance = 0) => visuals ? visuals.radius(point, clearance) : 1 + clearance;
  let detectiveCountry = '';
  const canvas = $('gw-canvas'), viewport = $('gw-viewport'), profile = $('gw-profile'), picker = $('gw-place');
  const workspace = root.querySelector('.gw-workspace'), content = $('gw-content-panels');
  const panels = [...content.querySelectorAll('[data-gw-panel]')];
  const contentLink = $('gw-profile-link'), toolsLink = $('gw-map-tools-link');
  const flatLink = $('gw-flat-link'), flatMapStart = flatLink.getAttribute('href');
  let activePanel = '';
  let addressSearch, restoringAddress = false;
  function replaceMapAddress(url) {
    if (restoringAddress || url.href === location.href) return;
    try {
      history.replaceState(null, '', url);
      addressSearch = location.search;
    } catch { /* file:// 下仍可在本页操作。 */ }
  }
  function showContent(id = '') {
    activePanel = id;
    for (const panel of panels) panel.hidden = panel.id !== id;
    content.hidden = !id;
    contentLink.hidden = !id;
    if (id) contentLink.textContent = `查看${$(id).dataset.gwPanel} ↓`;
    const [target, title] = {
      'gw-tools': ['gw-activity-tools', '探索控制'],
      'gw-tour-panel': ['gw-tour-tools', '导览控制'],
      'gw-lab': ['gw-layer-tools', '图层控制'],
    }[id] || ['gw-view-tools', '地球仪工具'];
    toolsLink.href = '#' + target;
    toolsLink.textContent = title;
  }
  function closeContent(id) {
    if (activePanel === id) showContent();
  }
  const paths = new Map(), tex = document.createElement('canvas');
  tex.width = 3072; tex.height = 1536;
  const ctx = tex.getContext('2d');
  const px = ([lon, lat]) => [(lon + 180) / 360 * tex.width, (90 - lat) / 180 * tex.height];

  function countryPath(country) {
    const path = new Path2D();
    const rings = country.name === 'Antarctica' ? window.GM_WORLD_3D_POLAR.rings : country.rings;
    for (const ring of rings) {
      const continuous = country.name === 'Antarctica' ? ring : G.unwrap(ring);
      for (const shift of [-360, 0, 360]) {
        continuous.forEach(([lon, lat], i) => {
          const [x, y] = px([lon + shift, lat]);
          if (i) path.lineTo(x, y); else path.moveTo(x, y);
        });
        path.closePath();
      }
    }
    return path;
  }
  if (ctx && typeof Path2D === 'function') countries.forEach(c => paths.set(c.name, countryPath(c)));

  function paint() {
    if (!ctx || !paths.size) return;
    const key=JSON.stringify([layer,activeLine,$('gw-ice').checked,$('gw-grid').checked,$('gw-features').checked,selected,selectedContinent,root.dataset.tool==='detective',detectiveCountry,lab?.mode]);
    if(key===textureKey)return;
    textureKey=key;root.dataset.texturePaints=String(++texturePaints);
    if(lab?.ancient){lab.paint(ctx,px);if(texture)texture.needsUpdate=true;requestRender();return;}
    ctx.fillStyle = '#80cce1'; ctx.fillRect(0, 0, tex.width, tex.height);
    for (const country of countries) {
      const continent = continentMap.get(meta[country.name]?.[1]);
      const dim = root.dataset.tool !== 'detective' && selectedContinent && continent?.id !== selectedContinent;
      ctx.fillStyle = layer === 'zones' ? '#f5f3dd' : dim ? '#dce3da' : (continent?.color || '#e5d5aa');
      ctx.fill(paths.get(country.name), 'evenodd');
      ctx.strokeStyle = '#536b665f'; ctx.lineWidth = 1.25; ctx.stroke(paths.get(country.name));
    }
    if (layer === 'zones') {
      ctx.globalAlpha = .72;
      for (const zone of L.zones) {
        ctx.fillStyle = zone.color;
        ctx.fillRect(0, px([0, zone.max])[1], tex.width, (zone.max - zone.min) / 180 * tex.height);
      }
      ctx.globalAlpha = 1;
      for (const path of paths.values()) { ctx.strokeStyle = '#365b6080'; ctx.lineWidth = 1.4; ctx.stroke(path); }
    }
    if ($('gw-ice').checked) for (const cap of window.GM_WORLD_VISUAL.iceCaps) {
      const gradient = ctx.createLinearGradient(0, 0, 0, tex.height);
      gradient.addColorStop(0, '#f1fcffed'); gradient.addColorStop(.5, '#b8dfedda'); gradient.addColorStop(1, '#f5fdfff2');
      ctx.save(); ctx.clip(paths.get(cap.country), 'evenodd'); ctx.fillStyle = gradient;
      if (cap.ring) {
        ctx.beginPath(); cap.ring.forEach((p, i) => { const [x, y] = px(p); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.closePath(); ctx.fill();
      } else ctx.fillRect(0, 0, tex.width, tex.height);
      ctx.restore();
    }
    if ($('gw-grid').checked) {
      ctx.beginPath();
      for (let lon = -180; lon <= 180; lon += 30) { const x = px([lon, 0])[0]; ctx.moveTo(x, 0); ctx.lineTo(x, tex.height); }
      for (let lat = -60; lat <= 60; lat += 30) { const y = px([0, lat])[1]; ctx.moveTo(0, y); ctx.lineTo(tex.width, y); }
      ctx.strokeStyle = '#245c6945'; ctx.lineWidth = 1.3; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, tex.height / 2); ctx.lineTo(tex.width, tex.height / 2);
      ctx.strokeStyle = '#ffe294'; ctx.lineWidth = 4; ctx.stroke();
    }
    for (const line of L.lines.filter(line => line.id === activeLine || (layer === 'zones' && line.axis === 'latitude'))) {
      ctx.beginPath();
      if (line.axis === 'latitude') { const y = px([0, line.value])[1]; ctx.moveTo(0, y); ctx.lineTo(tex.width, y); }
      else { const x = px([line.value, 0])[0]; ctx.moveTo(x, 0); ctx.lineTo(x, tex.height); }
      ctx.strokeStyle = line.color; ctx.lineWidth = line.id === activeLine ? 7 : 3; ctx.stroke();
    }
    if ($('gw-features').checked) {
      ctx.strokeStyle = '#a9551a'; ctx.lineWidth = 3;
      features.filter(f => f.line).forEach(f => {
        ctx.beginPath(); G.unwrap(f.line).forEach((point, i) => { const [x, y] = px(point); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.stroke();
      });
    }
    const marked = root.dataset.tool === 'detective' ? detectiveCountry : selected;
    if (paths.has(marked)) {
      ctx.fillStyle = '#fff3b26b'; ctx.fill(paths.get(marked), 'evenodd');
      ctx.strokeStyle = '#9b411a'; ctx.lineWidth = 4; ctx.stroke(paths.get(marked));
    }
    lab?.paint(ctx,px);
    if (texture) texture.needsUpdate = true;
    requestRender();
  }

  const worldMapUrl = esc((root.dataset.atlasBase || '') + 'world.html');
  function showProfile(id) {
    const country = countryMap.get(id), continent = continentMap.get(id);
    const ocean = oceans.find(o => o.id === id), feature = features.find(f => f.id === id);
    let html = '';
    if (continent) {
      html = `<p class="gw-eyebrow">七大洲 · ${esc(continent.hint)}</p><h2>${esc(continent.name)}</h2><p>${esc(continent.location)}</p>` +
        continent.facts.map(f => `<p><b>${esc(f.title)}：</b>${esc(f.text)}</p>`).join('') +
        `<p><b>看图想一想：</b>${esc(continent.observe)}</p><a href="${worldMapUrl}?continent=${encodeURIComponent(id)}#map">在平面地图上对照${esc(continent.name)} →</a>`;
    } else if (country) {
      const c = continentMap.get(meta[id]?.[1]);
      html = `<p class="gw-eyebrow">国家与地区 · ${esc(c?.name || '')}</p><h2>${esc(zh(id))}</h2><p>${esc(c?.hint || '')}</p>` +
        ((id === 'China' || id === 'Taiwan') ? window.GM_CHINA_CARD.facts.map(f => `<p>${esc(f)}</p>`).join('') : '') +
        `<a href="${worldMapUrl}?place=${encodeURIComponent(id)}#map">在平面地图上查看${esc(zh(id))} →</a>` +
        (c ? `<p><button type="button" class="gw-profile-continent" data-continent="${esc(c.id)}">认识${esc(c.name)} →</button></p>` : '');
    } else if (ocean || feature) {
      const place = ocean || feature;
      html = `<p class="gw-eyebrow">${ocean ? '四大洋' : '世界地标'}</p><h2>${esc(place.name)}</h2><p><b>在哪里：</b>${esc(place.where)}</p><p>${esc(place.note)}</p><a href="${worldMapUrl}?place=${encodeURIComponent(id)}#map">在平面地图上查看${esc(place.name)} →</a>`;
    }
    profile.innerHTML = html;
    flatLink.href = `${worldMapUrl}?${new URLSearchParams({[continent ? 'continent' : 'place']: id})}#map`;
    picker.value = id;
  }
  function revealSidebar(target) {
    const side = target.closest('.gm-sidebar');
    if (!side) return;
    for (let group = target.closest('details'); group && side.contains(group); group = group.parentElement.closest('details')) group.open = true;
    if (workspace.dataset.slMode === 'compact' && workspace.dataset.slOpen !== 'true') workspace.querySelector('.sl-toggle:not(.sl-collapse)')?.click();
    if (workspace.dataset.slMode === 'wide' && workspace.dataset.slCollapsed === 'true') workspace.querySelector('.sl-collapse')?.click();
  }
  const toolEntries = {'gw-tools':'gw-activity-tools', 'gw-tour-panel':'gw-tour-tools', 'gw-lab':'gw-layer-tools', 'gw-tool-panel':'gw-activity-tools'};
  function jumpTo(target) {
    if (!target) return;
    const panel = target.closest('[data-gw-panel]');
    if (panel?.hidden) {
      if (toolEntries[panel.id]) target = $(toolEntries[panel.id]);
      else if (['gw-quiz', 'gw-records', 'gw-observe', 'gw-map-sources', 'gw-tour-directory'].includes(panel.id)) {
        root.dispatchEvent(new CustomEvent('gm-world-free-view'));
        showContent(panel.id);
        target = content;
      } else return;
    }
    revealSidebar(target);
    target.scrollIntoView({block: target === viewport ? 'center' : 'start', behavior: 'instant'});
    (target.matches('details') ? target.querySelector('summary') : target).focus({preventScroll: true});
  }
  function address() {
    const url = new URL(location.href);
    url.searchParams.delete('continent'); url.searchParams.delete('place');
    url.searchParams.delete('tour'); url.searchParams.delete('stop');
    if (selectedContinent) url.searchParams.set('continent', selectedContinent);
    else if (selected) url.searchParams.set('place', selected);
    replaceMapAddress(url);
  }
  function syncContinents() {
    $('gw-continents').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.continent === selectedContinent)));
  }
  function focus(point, title) {
    rotation?.pause();
    $('gw-view-label').textContent = title;
    $('gw-views').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false'));
    if (!camera || !controls || lost) return;
    camera.position.set(...G.xyz(point, 5)); camera.up.set(0, 1, 0); camera.lookAt(0, 0, 0);
    controls.update(); requestRender();
  }
  function choose(id, writeURL = true, origin = '') {
    const country = countryMap.get(id), continent = continentMap.get(id), ocean = oceans.find(o => o.id === id), feature = features.find(f => f.id === id);
    if (!country && !continent && !ocean && !feature) return false;
    if (origin !== 'address') lab?.modern();
    selected = continent ? '' : id; selectedContinent = continent ? id : '';
    const point = continent ? D.continentViews[id] : country ? G.center(country) : ocean ? ocean.point : featurePoint(feature);
    referencePoint = point;
    if (feature && !$('gw-features').checked) $('gw-features').checked = true;
    showProfile(id); syncContinents(); paint();
    focus(point, continent?.name || ocean?.name || feature?.name || zh(id));
    $('gw-status').textContent = `已定位${continent?.name || ocean?.name || feature?.name || zh(id)}。`;
    if (marker) { markerPoint = point; marker.position.set(...G.xyz(point, surface(point, .012))); marker.visible = !continent; }
    readCoordinates(point, '定位参考点');
    if (writeURL) address();
    root.dispatchEvent(new CustomEvent('gm-world-selection', {detail: {id, origin}}));
    if (origin !== 'tour') showContent('gw-profile');
    return true;
  }

  function readCoordinates(point, label) {
    const zone = G.zoneAt(point[1], L.zones);
    $('gw-coordinates').textContent = `${label}：约${G.coordinates(point)}${zone ? ' · ' + zone.name : ''}。`;
  }
  function studyAddress() {
    const url = new URL(location.href);
    if (layer === 'zones') url.searchParams.set('layer', layer); else url.searchParams.delete('layer');
    if (activeLine) url.searchParams.set('line', activeLine); else url.searchParams.delete('line');
    replaceMapAddress(url);
  }
  function setLayer(value, writeURL = true, reveal = true) {
    layer = value === 'zones' ? 'zones' : 'continent';
    for (const button of $('gw-layer').children) button.setAttribute('aria-pressed', String(button.value === layer));
    if (reveal && layer === 'zones') showContent('gw-zone-legend');
    else if (layer !== 'zones') closeContent('gw-zone-legend');
    paint(); if (writeURL) studyAddress();
  }
  function setLine(id, turn = true, writeURL = true, reveal = true) {
    const line = L.lines.find(l => l.id === id); activeLine = line?.id || '';
    for (const button of $('gw-line').children) button.setAttribute('aria-pressed', String(button.value === activeLine));
    if (line) {
      $('gw-line-note').innerHTML = `<b>${esc(line.name)} · ${line.axis === 'latitude' ? G.coordinates([0, line.value]).split('，')[0] : '经度 0°'}</b><p>${esc(line.text)}</p><p>看图想一想：${esc(line.observe)}</p>`;
      if (turn) { focus(line.point, line.name); if (marker) marker.visible = false; }
      if (reveal) showContent('gw-line-note');
    } else closeContent('gw-line-note');
    paint(); if (writeURL) studyAddress();
  }
  $('gw-line').insertAdjacentHTML('beforeend', L.lines.map(l =>
    `<button type="button" value="${l.id}" aria-pressed="false">${esc(l.name)}</button>`).join(''));
  $('gw-zone-legend').innerHTML = `<div>${[...L.zones].reverse().map(z => `<p style="--zone-color:${z.color}"><b>${esc(z.name)}</b><span>${esc(z.text)}</span></p>`).join('')}</div><p>${esc(L.zoneNote)}</p>`;
  $('gw-layer').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.getAttribute('aria-pressed') === 'true' && button.value !== 'zones') return;
    root.dispatchEvent(new CustomEvent('gm-world-free-view'));
    setLayer(button.value);
  });
  $('gw-line').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.getAttribute('aria-pressed') === 'true' && !button.value) return;
    root.dispatchEvent(new CustomEvent('gm-world-free-view'));
    setLine(button.value);
  });

  picker.innerHTML += `<optgroup label="七大洲">${continents.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</optgroup>` +
    `<optgroup label="四大洋">${oceans.map(o => `<option value="${o.id}">${esc(o.name)}</option>`).join('')}</optgroup>` +
    `<optgroup label="世界地标">${features.map(f => `<option value="${f.id}">${esc(f.name)}</option>`).join('')}</optgroup>` +
    continents.map(c => `<optgroup label="${esc(c.name)}的国家与地区">${countries.filter(p => meta[p.name]?.[1] === c.id).sort((a, b) => zh(a.name).localeCompare(zh(b.name), 'zh-CN')).map(p => `<option value="${esc(p.name)}">${esc(zh(p.name))}</option>`).join('')}</optgroup>`).join('');
  picker.addEventListener('change', () => { if (picker.value) choose(picker.value); });
  const searchable = [
    ...continents.map(c => ({id: c.id, name: c.name})), ...oceans, ...features,
    ...countries.map(c => ({id: c.name, name: zh(c.name)}))
  ];
  $('gw-search').addEventListener('input', () => {
    const query = $('gw-search').value.trim().toLowerCase();
    const results = query ? searchable.filter(p => `${p.name} ${p.id}`.toLowerCase().includes(query)) : [];
    $('gw-search-results').innerHTML = results.slice(0, 8).map(p => `<button type="button" data-place="${esc(p.id)}">${esc(p.name)}</button>`).join('');
    $('gw-search-status').textContent = !query ? '' : results.length ? `找到 ${results.length} 处${results.length > 8 ? '，先显示前 8 处，请再多输入几个字' : ''}。` : '暂时没找到，试试国家、大洲、大洋或地标名称。';
  });
  $('gw-search-results').addEventListener('click', event => { const b = event.target.closest('[data-place]'); if (b) choose(b.dataset.place); });
  $('gw-continents').innerHTML = continents.map(c => `<button type="button" data-continent="${c.id}" style="--continent-color:${esc(c.color)}" aria-pressed="false">${esc(c.name)}</button>`).join('');
  $('gw-views').innerHTML = D.views.map(v => `<button type="button" data-view="${v.id}" aria-pressed="false">${esc(v.name)}</button>`).join('');
  $('gw-observations').innerHTML = D.observations.map((o, i) => `<article><h3>${esc(o.title)}</h3><p>${esc(o.text)}</p><button type="button" data-observe="${i}">转过去看看 →</button></article>`).join('');
  $('gw-note').textContent = D.note;
  function hashTarget(hash) {
    try {
      const id = decodeURIComponent(hash.slice(1));
      const target = document.getElementById(['gw-voyage-inline', 'gw-voyage-toggle', 'gw-voyage-forward'].includes(id) ? 'gw-activity-tools' : id);
      return root.contains(target) ? target : null;
    } catch { return null; }
  }
  $('gw-content-close').addEventListener('click', () => {
    root.dispatchEvent(new CustomEvent('gm-world-free-view'));
    showContent();
    jumpTo(viewport);
  });
  root.addEventListener('click', event => {
    const jump = event.target.closest('[data-globe-jump]');
    if (jump) {
      const target = $(jump.dataset.globeJump);
      if (target?.id === 'gw-lab' && root.dataset.lab !== 'none') {
        root.dispatchEvent(new CustomEvent('gm-world-free-view'));
        showContent('gw-lab');
      }
      jumpTo(target);
    }
    const link = event.target.closest('a[href^="#"]');
    if (link && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      const target = hashTarget(link.hash);
      if (target) { event.preventDefault(); jumpTo(target); }
    }
    const continent = event.target.closest('button[data-continent]');
    if (continent) choose(continent.dataset.continent);
    const view = event.target.closest('button[data-view]');
    if (view) { root.dispatchEvent(new CustomEvent('gm-world-free-view', {detail: {origin: 'camera'}})); const v = D.views.find(v => v.id === view.dataset.view); focus(v.point, v.name); view.setAttribute('aria-pressed', 'true'); }
    const observe = event.target.closest('button[data-observe]');
    if (observe) { choose(D.observations[Number(observe.dataset.observe)].place); viewport.scrollIntoView({block: 'center'}); }
  });
  $('gw-grid').addEventListener('change', paint);
  $('gw-ice').addEventListener('change', paint);
  $('gw-names').addEventListener('change', requestRender);
  $('gw-features').addEventListener('change', () => { paint(); requestRender(); });

  const labelData = [
    ...continents.map(c => ({id: c.id, name: c.name, point: c.id === 'antarctica' ? [30, -78] : D.continentViews[c.id], kind: 'continent'})),
    ...oceans.map(o => ({...o, kind: 'ocean'})),
    ...features.map(f => ({...f, point: featurePoint(f), kind: 'feature'}))
  ];
  const labelNodes = labelData.map(label => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'gw-label'; button.dataset.kind = label.kind; button.textContent = label.name; button.hidden = true;
    button.addEventListener('click', () => choose(label.id)); $('gw-labels').append(button);
    return {label, button};
  });
  const selectedLabel = document.createElement('button'); selectedLabel.type = 'button'; selectedLabel.className = 'gw-label gw-label-selected'; selectedLabel.hidden = true;
  selectedLabel.addEventListener('click', () => choose(selected)); $('gw-labels').append(selectedLabel);
  function placeLabels() {
    if (!camera) return;
    const facing = camera.position.clone().normalize(), width = viewport.clientWidth, height = viewport.clientHeight, occupied = [];
    const list = [...labelNodes].sort((a, b) => Number(b.label.id === selected || b.label.id === selectedContinent) - Number(a.label.id === selected || a.label.id === selectedContinent));
    const country = countryMap.get(selected); selectedLabel.hidden = true;
    if (country) {
      selectedLabel.textContent = zh(selected);
      list.unshift({label: {id: selected, point: G.center(country), kind: 'country'}, button: selectedLabel});
    }
    for (const {label, button} of list) {
      const point = new T.Vector3(...G.xyz(label.point));
      const isVisible = !lab?.ancient && !['life','outline'].includes(root.dataset.tool) && !lost && $('gw-names').checked && (label.kind !== 'feature' || $('gw-features').checked) && point.dot(facing) > .19;
      if (!isVisible) { button.hidden = true; continue; }
      point.multiplyScalar(surface(label.point, .025)).project(camera);
      const x = (point.x + 1) / 2 * width, y = (1 - point.y) / 2 * height;
      button.hidden = false;
      const w = button.offsetWidth, h = button.offsetHeight;
      const rect = {left: x - w / 2 - 3, right: x + w / 2 + 3, top: y - h / 2 - 3, bottom: y + h / 2 + 3};
      if (rect.left < 0 || rect.right > width || rect.top < 0 || rect.bottom > height || occupied.some(r => rect.left < r.right && rect.right > r.left && rect.top < r.bottom && rect.bottom > r.top)) { button.hidden = true; continue; }
      occupied.push(rect); button.style.left = x + 'px'; button.style.top = y + 'px';
    }
  }
  function requestRender() {
    if (!renderer || lost || disposed || !visible || document.hidden || frame) return;
    frame = requestAnimationFrame(() => { frame = 0; if (lost || disposed || !visible || document.hidden) return; visuals?.update(camera); renderer.render(scene, camera); placeLabels(); addons?.life.position(); lab?.position(); positionShip(); });
  }
  function projectPoint(point,radius=null) {
    if(!camera||lost)return null;
    const v=new T.Vector3(...G.xyz(point)),front=v.dot(camera.position.clone().normalize())>.16;
    v.multiplyScalar(radius??surface(point,.045)).project(camera);
    const x=(v.x+1)/2*viewport.clientWidth,y=(1-v.y)/2*viewport.clientHeight;
    return {x,y,visible:front&&x>10&&y>10&&x<viewport.clientWidth-10&&y<viewport.clientHeight-10};
  }
  function positionShip(){const p=shipPoint?projectPoint(shipPoint):null;$('gw-ship').hidden=!p?.visible;if(p?.visible){$('gw-ship').style.left=p.x+'px';$('gw-ship').style.top=p.y+'px';}}
  function attachSky(on){
    if(!scene)return;
    if(!on&&!skyGroup)return;
    if(!skyGroup){
      skyGroup=new T.Group();
      function line(points,color){const positions=[];for(let i=1;i<points.length;i++){const arc=G.arc(points[i-1],points[i],12);for(let k=1;k<arc.length;k++)positions.push(...arc[k-1].map(n=>n*1.55),...arc[k].map(n=>n*1.55));}const geo=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(positions,3));skyGroup.add(new T.LineSegments(geo,new T.LineBasicMaterial({color,transparent:true,opacity:.85})));}
      line(Array.from({length:181},(_,i)=>[i*2-180,0]),'#95e6ff');
      const tilt=23.44*Math.PI/180;
      line(Array.from({length:181},(_,i)=>{const a=i*2*Math.PI/180;return G.lonLat({x:Math.sin(a),y:Math.sin(tilt)*Math.cos(a),z:Math.cos(tilt)*Math.cos(a)});}), '#ffdc7c');
      for(const c of window.GM_WORLD_LAB.sky.constellations)for(const l of c.lines)line(l,'#f1dfb8');scene.add(skyGroup);
    }
    skyGroup.visible=on;requestRender();
  }
  function clearOverlay() {
    if (!toolOverlay) return;
    toolOverlay.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });
    scene.remove(toolOverlay); toolOverlay = null;
  }
  function overlay(points, route = null) {
    overlayState = {points, route};
    if (!scene || lost || disposed) return;
    clearOverlay(); toolOverlay = new T.Group();
    for (const {point, color} of points) {
      const dot = new T.Mesh(G.sphere(T, 16, 8), new T.MeshLambertMaterial({color}));
      dot.scale.setScalar(.019); dot.position.set(...G.xyz(point, surface(point, .015))); toolOverlay.add(dot);
    }
    if (route) {
      const positions = [];
      for (let leg = 1; leg < route.length; leg++) {
        const vertices = G.arc(route[leg-1],route[leg]);
        for (let i = 1; i < vertices.length; i++) for (const v of [vertices[i - 1], vertices[i]]) positions.push(...v.map(x => x * surface(G.lonLat({x:v[0], y:v[1], z:v[2]}), .008)));
      }
      const geometry = new T.BufferGeometry(); geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
      toolOverlay.add(new T.LineSegments(geometry, new T.LineBasicMaterial({color: '#903d16'})));
    }
    scene.add(toolOverlay);
    if (marker) marker.visible = root.dataset.tool === 'browse' && !!selected && !selectedContinent;
    requestRender();
  }
  function illuminate(model) {
    sunModel = model;
    if (!scene || lost || disposed) return;
    visuals?.illuminate(model);
    if (!model) {
      if (sunlight.parent !== camera) camera.add(sunlight);
      sunlight.position.set(-3, 4, 5); sunlight.intensity = 2.4; ambient.intensity = 1.15;
      if (sunRing) sunRing.visible = false; if (sunSpot) sunSpot.visible = false;
    } else {
      if (sunlight.parent !== scene) scene.add(sunlight);
      sunlight.position.set(...G.xyz(model.sunPoint, 5)); sunlight.intensity = 3; ambient.intensity = .12;
      if (!sunRing) {
        const geometry = new T.LineGeometry().setPositions(new Float32Array(129 * 3));
        sunRing = new T.Line2(geometry, new T.LineMaterial({color: '#ffd66a', linewidth: 3})); scene.add(sunRing);
        sunSpot = new T.Mesh(G.sphere(T, 16, 8), new T.MeshLambertMaterial({color: '#ffe38a', emissive: '#cc851a'}));
        sunSpot.scale.setScalar(.018); scene.add(sunSpot);
      }
      const circle = window.GMWorldSun.terminator(model.sunPoint), segments = sunRing.geometry.getAttribute('instanceStart').data;
      const lift = p => p.map(v => v * surface(G.lonLat({x:p[0], y:p[1], z:p[2]}), .008));
      circle.forEach((p, i) => { segments.array.set(lift(p), i * 6); segments.array.set(lift(circle[(i + 1) % circle.length]), i * 6 + 3); });
      segments.needsUpdate = true; sunRing.geometry.computeBoundingBox(); sunRing.geometry.computeBoundingSphere(); sunRing.visible = true;
      sunSpot.position.set(...G.xyz(model.sunPoint, surface(model.sunPoint, .02))); sunSpot.visible = true;
    }
    requestRender();
  }
  function fallback(message) {
    lost = true; root.dataset.renderer = 'fallback';
    rotation?.pause();
    if (frame) cancelAnimationFrame(frame); frame = 0;
    canvas.hidden = true; $('gw-fallback').hidden = false;
    $('gw-fallback').firstChild.textContent = message + '仍可从「想去哪里」选择地点阅读档案，或';
    for (const {button} of labelNodes) button.hidden = true;
    selectedLabel.hidden = true;
    for (const button of root.querySelectorAll('.gw-toolbar button')) button.disabled = true;
    for (const control of root.querySelectorAll('.gw-visual-tools input, #gw-rotate')) control.disabled = true;
    $('gw-sun-direction').hidden = true;
    $('gw-ship').hidden=true;lab?.position();
    root.dispatchEvent(new CustomEvent('gm-world-renderer-change'));
  }
  function resize() {
    if (!renderer || lost || disposed) return;
    const width = viewport.clientWidth, height = viewport.clientHeight;
    const aspect = width / Math.max(1, height), halfY = aspect < 1 ? 1.3 / aspect : 1.3;
    camera.left = -halfY * aspect; camera.right = halfY * aspect; camera.top = halfY; camera.bottom = -halfY; camera.updateProjectionMatrix();
    renderer.setSize(width, height, false); requestRender();
  }
  function zoom(gain) {
    rotation?.pause();
    if (!camera || lost) return;
    camera.zoom = Math.max(.8, Math.min(3.2, camera.zoom * gain)); camera.updateProjectionMatrix(); controls.update(); requestRender();
  }
  function reset() { root.dispatchEvent(new CustomEvent('gm-world-free-view', {detail: {origin: 'camera'}})); if (camera) { camera.zoom = 1; camera.updateProjectionMatrix(); } focus(D.home, '从中国出发'); }
  $('gw-in').addEventListener('click', () => zoom(1.2)); $('gw-out').addEventListener('click', () => zoom(1 / 1.2)); $('gw-reset').addEventListener('click', reset);
  let resizeObserver, intersectionObserver;
  try {
    if (!T || !ctx || !paths.size) throw new Error('本地渲染能力不可用');
    renderer = new T.WebGLRenderer({canvas, alpha: true, antialias: true});
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    scene = new T.Scene(); camera = new T.OrthographicCamera(-2, 2, 1.3, -1.3, .1, 30);
    camera.position.set(...G.xyz(D.home, 5)); camera.lookAt(0, 0, 0);
    ambient = new T.AmbientLight('#ffffff', 1.15); scene.add(ambient);
    sunlight = new T.DirectionalLight('#fff9e4', 2.4); camera.add(sunlight); sunlight.position.set(-3, 4, 5); scene.add(camera);
    texture = new T.CanvasTexture(tex); texture.colorSpace = T.SRGBColorSpace;
    const landMask = document.createElement('canvas'); landMask.width = tex.width; landMask.height = tex.height;
    const mask = landMask.getContext('2d'); mask.fillStyle = '#fff'; for (const path of paths.values()) mask.fill(path, 'evenodd');
    visuals = window.GMWorldVisual.create({T, G, scene, texture, landMask, assets: root.dataset.globeAssets, root, render: requestRender, terrainChanged: () => {
      const markerVisible = marker?.visible;
      if (marker && markerPoint) marker.position.set(...G.xyz(markerPoint, surface(markerPoint, .018)));
      overlay(overlayState.points, overlayState.route); if (marker) marker.visible = markerVisible; illuminate(sunModel);
    }});
    globe = new T.Mesh(visuals.geometry, visuals.material); scene.add(globe);
    marker = new T.Mesh(G.sphere(T, 16, 8), new T.MeshLambertMaterial({color: '#aa4517'})); marker.scale.setScalar(.013); marker.visible = false; scene.add(marker);
    controls = new T.OrbitControls(camera, canvas); controls.enablePan = false; controls.enableDamping = false; controls.minZoom = .8; controls.maxZoom = 3.2; controls.rotateSpeed = .65;
    controls.addEventListener('change', requestRender);
    controls.addEventListener('start', () => { rotation?.pause(); root.dispatchEvent(new CustomEvent('gm-world-manual-camera')); $('gw-view-label').textContent = '自由探索'; $('gw-views').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false')); });
    const raycaster = new T.Raycaster(); let pointer;
    canvas.addEventListener('pointerdown', event => {
      pointer = event.isPrimary && event.button === 0 ? {x: event.clientX, y: event.clientY, id: event.pointerId, moved: false} : null;
    });
    canvas.addEventListener('pointermove', event => {
      if (pointer && event.pointerId === pointer.id && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 6) pointer.moved = true;
    });
    canvas.addEventListener('pointercancel', () => { pointer = null; });
    canvas.addEventListener('pointerup', event => {
      const start = pointer; pointer = null;
      if (lost || !start || start.moved || start.id !== event.pointerId || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) return;
      const rect = canvas.getBoundingClientRect();
      raycaster.setFromCamera(new T.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2), camera);
      const hit = raycaster.intersectObject(globe)[0]; if (!hit) return;
      const point = G.lonLat(hit.point), [x, y] = px(point);
      if(lab?.ancient){$('gw-status').textContent=window.GM_WORLD_LAB.ancientNote;return;}
      const country = countries.find(c => ctx.isPointInPath(paths.get(c.name), x, y, 'evenodd'));
      if (toolbox?.handlePoint(point, country?.name)) { readCoordinates(point, '点击位置'); return; }
      if (country) choose(country.name); else $('gw-status').textContent = '这里是海洋。点大洋名称，或从侧栏选择一片大洋。';
      readCoordinates(point, '点击位置');
    });
    canvas.addEventListener('keydown', event => {
      if (lost) return;
      root.dispatchEvent(new CustomEvent('gm-world-manual-camera'));
      if (['+', '=', '-', '_'].includes(event.key)) { event.preventDefault(); zoom(['+', '='].includes(event.key) ? 1.15 : 1 / 1.15); }
      else if (event.key === 'Home') { event.preventDefault(); reset(); }
      else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault(); const [lon, lat] = G.lonLat(camera.position);
        focus([G.wrap(lon + (event.key === 'ArrowLeft' ? -10 : event.key === 'ArrowRight' ? 10 : 0)), Math.max(-89.9, Math.min(89.9, lat + (event.key === 'ArrowUp' ? 10 : event.key === 'ArrowDown' ? -10 : 0)))], '自由探索');
      }
    });
    canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); fallback('3D 显示已中断，请刷新页面重试。'); });
    resizeObserver = new ResizeObserver(resize); resizeObserver.observe(viewport);
    intersectionObserver = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (rotation) { rotation.refresh(); rotationStatus(rotation.running()); } if (visible) requestRender(); }); intersectionObserver.observe(viewport);
    root.dataset.renderer = 'webgl'; resize();
  } catch (error) {
    fallback('当前浏览器无法显示 3D 地球仪。');
  }
  function restoreLocation(params) {
    const id = params.get('place') || params.get('continent');
    if (!choose(id || 'China', false, 'address')) { choose('China', false, 'address'); $('gw-status').textContent = '没有找到链接里的地点，已回到中国。请从列表重新选择。'; }
    if (!id) {
      focus(D.home, '从中国出发');
      picker.value = '';
      flatLink.setAttribute('href', flatMapStart);
      showContent();
    }
    setLayer(params.get('layer'), false, !id);
    setLine(params.get('line'), false, false, !id);
  }
  sunLab = window.GMWorldSun.mount({root, focus, overlay, illuminate, currentPoint: () => referencePoint, readCoordinates});
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const rotationAllowed = () => !disposed && !lost && !document.hidden && !motion.matches && (!window.StudyEffects || window.StudyEffects.motion === 'full') && root.dataset.renderer === 'webgl';
  const canRotate = () => visible && rotationAllowed();
  function rotationStatus(running) {
    if (controls) controls.autoRotate = running;
    $('gw-rotate').setAttribute('aria-pressed', String(running)); $('gw-rotate').textContent = running ? '⏸ 暂停自转' : '🌍 让地球自己转';
    $('gw-rotate').disabled = !rotationAllowed();
    $('gw-rotate-status').textContent = !rotationAllowed() ? '当前已暂停动态效果，可拖动或单步观察。' : running ? '正在慢慢转动' : '已暂停，可随时开始';
  }
  rotation = window.GMWorldVisual.createRotation({request: requestAnimationFrame, cancel: cancelAnimationFrame, available: canRotate,
    advance: seconds => { controls.update(seconds); sunLab.advance(seconds / 5); requestRender(); }, changed: rotationStatus});
  if (controls) controls.autoRotateSpeed = .5;
  $('gw-rotate').addEventListener('click', () => {
    if (rotation.running()) rotation.pause();
    else {
      root.dispatchEvent(new CustomEvent('gm-world-free-view', {detail: {origin: 'camera'}})); sunLab.pause();
      viewport.scrollIntoView({block:'center', behavior:'instant'});
      const bounds = viewport.getBoundingClientRect();
      visible = bounds.bottom > 0 && bounds.top < innerHeight;
      rotation.play();
    }
  });
  const refreshRotation = () => { rotation.refresh(); rotationStatus(rotation.running()); };
  for (const event of ['gm-world-free-view', 'gm-world-manual-camera', 'gm-world-sun-play', 'gm-world-selection']) root.addEventListener(event, rotation.pause);
  for (const node of [$('gw-tool-panel'), $('gw-sun-inline')]) for (const event of ['pointerdown', 'click', 'input', 'change']) node.addEventListener(event, rotation.pause, true);
  document.addEventListener('visibilitychange', refreshRotation); document.addEventListener('study:effects-change', refreshRotation); motion.addEventListener('change', refreshRotation);
  const visualData = window.GM_WORLD_VISUAL;
  $('gw-visual-note').textContent = visualData.note; $('gw-rotate-note').textContent = visualData.rotationNote; $('gw-visual-sun-note').textContent = visualData.sunNote;
  $('gw-visual-sources').innerHTML = visualData.sources.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a>`).join('');
  rotationStatus(false);
  const detective = window.GMWorldDetective.mount({root, countries, name: zh, choose, overlay, revealProfile: () => jumpTo(profile),
    highlight: id => { detectiveCountry = id; paint(); },
    locate: id => { const country = countryMap.get(id); if (country) focus(G.center(country), zh(id)); }
  });
  const activate = mode => toolbox?.activate(mode);
  const voyages = window.GMWorldVoyages.mount({root, focus, overlay, activate, replaceMapAddress,
    follow: (point,title)=>{if(!camera||lost)return;camera.position.set(...G.xyz(point,5));camera.up.set(0,1,0);camera.lookAt(0,0,0);controls.update();if($('gw-view-label').textContent!==title)$('gw-view-label').textContent=title;requestRender();},
    ship: point => {shipPoint=point; if (marker) { markerPoint = point; marker.visible = Boolean(point); if (point) marker.position.set(...G.xyz(point,surface(point,.018))); requestRender(); } }
  });
  const life = window.GMWorldExplorers.mountLife({root,focus,activate,render:requestRender,
    project: point => {
      if (!camera || lost) return null;
      const v = new T.Vector3(...G.xyz(point)), facing = camera.position.clone().normalize();
      const front = v.dot(facing) > .18; v.multiplyScalar(surface(point, .024)).project(camera);
      const x = (v.x+1)/2*viewport.clientWidth, y=(1-v.y)/2*viewport.clientHeight;
      return {x,y,visible:front && x>20 && y>20 && x<viewport.clientWidth-20 && y<viewport.clientHeight-20};
    }
  });
  const outlines = window.GMWorldExplorers.mountOutline({root,activate,choose});
  addons = {life, setActive: mode => {
    if (['voyage','life','outline'].includes(mode)) { selectedContinent=''; selected=''; paint(); }
    voyages.setActive(mode==='voyage'); life.setActive(mode==='life'); outlines.setActive(mode==='outline');
  }, handlePoint: (mode,point) => mode==='life' ? life.pick(point) : mode==='outline'};
  window.GMWorldExplorers.mountTime({root,setUTC:sunLab.setUTC});
  root.addEventListener('gm-world-tool-change', ({detail: {mode}}) => {
    for (const group of workspace.querySelectorAll('[data-gw-mode]')) group.hidden = group.dataset.gwMode !== mode;
    if (mode === 'browse') closeContent('gw-tools');
    else showContent('gw-tools');
  });
  toolbox = window.GMWorldTools.mount({root, focus, overlay, currentPoint: () => referencePoint, repaint: paint, readCoordinates, sun: sunLab, detective,
    extras:addons, replayTrip:trip=>voyages.custom(trip), prepareDetective: () => { setLayer('continent'); setLine('', false); $('gw-view-label').textContent = '转动地球，寻找线索'; }
  });
  $('gw-tool-modes').addEventListener('click', event => {
    if (event.target.closest('button[data-tool]') && activePanel === 'gw-tools') jumpTo(content);
  });
  lab=window.GMWorldLab.mount({root,focus,render:requestRender,repaint:paint,project:projectPoint,attachSky,replaceMapAddress,
    prepare:()=>{rotation.pause();toolbox.activate('browse');},
    ancientChanged:on=>{visuals?.setAncient(on);if(on){overlay([]);shipPoint=null;if(marker)marker.visible=false;}},
    changed: (mode, interactive) => {
      $('gw-lab-info').hidden = mode === 'none';
      if (mode === 'none') closeContent('gw-lab');
      else if (interactive || !activePanel || mode === 'pangaea') showContent('gw-lab');
    }
  });paint();
  window.GMWorldPlay.mountTimer({root,start:kind=>toolbox.startTimed(kind)});
  gyro=window.GMWorldPlay.mountGyro({root,prepare:()=>{rotation.pause();toolbox.activate('browse');root.dispatchEvent(new CustomEvent('gm-world-manual-camera'));$('gw-view-label').textContent='轻轻倾斜手机转地球';return camera?G.lonLat(camera.position):[0,0];},move:(delta,origin)=>{if(!camera||lost)return;const p=[G.wrap(origin[0]-delta[0]*1.5),Math.max(-85,Math.min(85,origin[1]+delta[1]*1.1))];camera.position.set(...G.xyz(p,5));camera.up.set(0,1,0);camera.lookAt(0,0,0);controls.update();requestRender();}});
  const learning = window.GMWorldLearning.mount({root, choose, setLine, setLayer, startSun: toolbox.startSun, showContent, closeContent, replaceMapAddress});
  window.GMWorldDetective.mountProgress({root, open: kind => {
    toolbox.resume(kind);
    if (kind === 'quiz') learning.resumeQuiz();
    else jumpTo(content);
  }});
  function restoreAddress() {
    if (location.search === addressSearch) return;
    addressSearch = location.search;
    const params = new URLSearchParams(addressSearch);
    restoringAddress = true;
    try {
      if (root.dataset.tool !== 'browse') toolbox.activate('browse');
      restoreLocation(params);
      lab.restore(params);
      learning.restore(params);
      voyages.restore(params);
    } finally { restoringAddress = false; }
  }
  restoreAddress();
  window.addEventListener('popstate', restoreAddress);
  document.addEventListener('DOMContentLoaded', () => {
    const target = hashTarget(location.hash);
    if (target) jumpTo(target);
  }, {once: true});
  window.addEventListener('hashchange', () => {
    const target = hashTarget(location.hash);
    if (target) jumpTo(target);
  });
  document.addEventListener('visibilitychange', requestRender);
  window.addEventListener('pagehide', event => {
    rotation.pause();
    if (frame) cancelAnimationFrame(frame); frame = 0;
    if (event.persisted) return;
    disposed = true; resizeObserver?.disconnect(); intersectionObserver?.disconnect(); controls?.dispose();
    visuals?.dispose(); motion.removeEventListener('change', refreshRotation); document.removeEventListener('visibilitychange', refreshRotation); document.removeEventListener('study:effects-change', refreshRotation);
    skyGroup?.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
    clearOverlay(); globe?.geometry.dispose(); globe?.material.dispose(); marker?.geometry.dispose(); marker?.material.dispose(); texture?.dispose(); renderer?.dispose();
    sunRing?.geometry.dispose(); sunRing?.material.dispose(); sunSpot?.geometry.dispose(); sunSpot?.material.dispose();
  });
  window.addEventListener('pageshow', requestRender);
})();

/* 本地球面地球仪：复用世界档案，按需绘制，不持续播放。 */
(() => {
  'use strict';
  const root = document.querySelector('.world-3d-topic');
  if (!root) return;
  const $ = id => root.querySelector(`#${id}`);
  const D = window.GM_WORLD_3D, G = window.GMWorld3DGeometry, T = window.GMThree;
  const L = window.GM_WORLD_LEARNING;
  const countries = window.GEO_WORLD_GEO?.countries || [];
  const continents = window.GM_CONTINENTS || [], oceans = window.GM_OCEANS || [], features = window.GM_WORLD_FEATURES || [];
  const meta = window.GM_COUNTRY_META || {}, esc = window.GMShared?.esc;
  if (!D || !G || !L || !esc || !countries.length || !window.GM_WORLD_3D_POLAR) {
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
  const canvas = $('gw-canvas'), viewport = $('gw-viewport'), profile = $('gw-profile'), picker = $('gw-place');
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
    ctx.fillStyle = '#80cce1'; ctx.fillRect(0, 0, tex.width, tex.height);
    for (const country of countries) {
      const continent = continentMap.get(meta[country.name]?.[1]);
      const dim = selectedContinent && continent?.id !== selectedContinent;
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
    if (paths.has(selected)) {
      ctx.fillStyle = '#fff3b26b'; ctx.fill(paths.get(selected), 'evenodd');
      ctx.strokeStyle = '#9b411a'; ctx.lineWidth = 4; ctx.stroke(paths.get(selected));
    }
    if (texture) texture.needsUpdate = true;
    requestRender();
  }

  function showProfile(id) {
    const country = countryMap.get(id), continent = continentMap.get(id);
    const ocean = oceans.find(o => o.id === id), feature = features.find(f => f.id === id);
    let html = '';
    if (continent) {
      html = `<p class="gw-eyebrow">七大洲 · ${esc(continent.hint)}</p><h2>${esc(continent.name)}</h2><p>${esc(continent.location)}</p>` +
        continent.facts.map(f => `<p><b>${esc(f.title)}：</b>${esc(f.text)}</p>`).join('') +
        `<p><b>看图想一想：</b>${esc(continent.observe)}</p><a href="world.html?continent=${encodeURIComponent(id)}#map">在平面地图上对照${esc(continent.name)} →</a>`;
    } else if (country) {
      const c = continentMap.get(meta[id]?.[1]);
      html = `<p class="gw-eyebrow">国家与地区 · ${esc(c?.name || '')}</p><h2>${esc(zh(id))}</h2><p>${esc(c?.hint || '')}</p>` +
        ((id === 'China' || id === 'Taiwan') ? window.GM_CHINA_CARD.facts.map(f => `<p>${esc(f)}</p>`).join('') : '') +
        `<a href="world.html?place=${encodeURIComponent(id)}#map">在平面地图上查看${esc(zh(id))} →</a>` +
        (c ? `<p><button type="button" class="gw-profile-continent" data-continent="${esc(c.id)}">认识${esc(c.name)} →</button></p>` : '');
    } else if (ocean || feature) {
      const place = ocean || feature;
      html = `<p class="gw-eyebrow">${ocean ? '四大洋' : '世界地标'}</p><h2>${esc(place.name)}</h2><p><b>在哪里：</b>${esc(place.where)}</p><p>${esc(place.note)}</p><a href="world.html?place=${encodeURIComponent(id)}#map">在平面地图上查看${esc(place.name)} →</a>`;
    }
    profile.innerHTML = html;
    picker.value = id;
  }
  function address() {
    const url = new URL(location.href);
    url.searchParams.delete('continent'); url.searchParams.delete('place');
    url.searchParams.delete('tour'); url.searchParams.delete('stop');
    if (selectedContinent) url.searchParams.set('continent', selectedContinent);
    else if (selected) url.searchParams.set('place', selected);
    history.replaceState(null, '', url);
  }
  function syncContinents() {
    $('gw-continents').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.continent === selectedContinent)));
  }
  function focus(point, title) {
    $('gw-view-label').textContent = title;
    $('gw-views').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false'));
    if (!camera || !controls || lost) return;
    camera.position.set(...G.xyz(point, 5)); camera.up.set(0, 1, 0); camera.lookAt(0, 0, 0);
    controls.update(); requestRender();
  }
  function choose(id, writeURL = true, origin = '') {
    const country = countryMap.get(id), continent = continentMap.get(id), ocean = oceans.find(o => o.id === id), feature = features.find(f => f.id === id);
    if (!country && !continent && !ocean && !feature) return false;
    selected = continent ? '' : id; selectedContinent = continent ? id : '';
    const point = continent ? D.continentViews[id] : country ? G.center(country) : ocean ? ocean.point : featurePoint(feature);
    if (feature && !$('gw-features').checked) $('gw-features').checked = true;
    showProfile(id); syncContinents(); paint();
    focus(point, continent?.name || ocean?.name || feature?.name || zh(id));
    $('gw-status').textContent = `已定位${continent?.name || ocean?.name || feature?.name || zh(id)}，下方可以阅读档案。`;
    if (marker) { marker.position.set(...G.xyz(point, 1.012)); marker.visible = !continent; }
    readCoordinates(point, '定位参考点');
    if (writeURL) address();
    root.dispatchEvent(new CustomEvent('gm-world-selection', {detail: {id, origin}}));
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
    history.replaceState(null, '', url);
  }
  function setLayer(value, writeURL = true) {
    layer = value === 'zones' ? 'zones' : 'continent'; $('gw-layer').value = layer;
    $('gw-zone-legend').hidden = layer !== 'zones';
    paint(); if (writeURL) studyAddress();
  }
  function setLine(id, turn = true, writeURL = true) {
    const line = L.lines.find(l => l.id === id); activeLine = line?.id || ''; $('gw-line').value = activeLine;
    $('gw-line-note').hidden = !line;
    if (line) {
      $('gw-line-note').innerHTML = `<b>${esc(line.name)} · ${line.axis === 'latitude' ? G.coordinates([0, line.value]).split('，')[0] : '经度 0°'}</b><p>${esc(line.text)}</p><p>看图想一想：${esc(line.observe)}</p>`;
      if (turn) { focus(line.point, line.name); if (marker) marker.visible = false; }
    }
    paint(); if (writeURL) studyAddress();
  }
  $('gw-line').insertAdjacentHTML('beforeend', L.lines.map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join(''));
  $('gw-zone-legend').innerHTML = `<div>${[...L.zones].reverse().map(z => `<p style="--zone-color:${z.color}"><b>${esc(z.name)}</b><span>${esc(z.text)}</span></p>`).join('')}</div><p>${esc(L.zoneNote)}</p>`;
  $('gw-layer').addEventListener('change', () => { root.dispatchEvent(new CustomEvent('gm-world-free-view')); setLayer($('gw-layer').value); });
  $('gw-line').addEventListener('change', () => { root.dispatchEvent(new CustomEvent('gm-world-free-view')); setLine($('gw-line').value); });

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
  root.addEventListener('click', event => {
    const continent = event.target.closest('button[data-continent]');
    if (continent) choose(continent.dataset.continent);
    const view = event.target.closest('button[data-view]');
    if (view) { root.dispatchEvent(new CustomEvent('gm-world-free-view')); const v = D.views.find(v => v.id === view.dataset.view); focus(v.point, v.name); view.setAttribute('aria-pressed', 'true'); }
    const observe = event.target.closest('button[data-observe]');
    if (observe) { choose(D.observations[Number(observe.dataset.observe)].place); viewport.scrollIntoView({block: 'center'}); }
  });
  $('gw-grid').addEventListener('change', paint);
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
      const isVisible = !lost && $('gw-names').checked && (label.kind !== 'feature' || $('gw-features').checked) && point.dot(facing) > .19;
      if (!isVisible) { button.hidden = true; continue; }
      point.multiplyScalar(1.015).project(camera);
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
    frame = requestAnimationFrame(() => { frame = 0; if (lost || disposed) return; renderer.render(scene, camera); placeLabels(); });
  }
  function fallback(message) {
    lost = true; root.dataset.renderer = 'fallback';
    if (frame) cancelAnimationFrame(frame); frame = 0;
    canvas.hidden = true; $('gw-fallback').hidden = false;
    $('gw-fallback').firstChild.textContent = message + '仍可从「想去哪里」选择地点阅读档案，或';
    for (const {button} of labelNodes) button.hidden = true;
    selectedLabel.hidden = true;
    for (const button of root.querySelectorAll('.gw-toolbar button')) button.disabled = true;
  }
  function resize() {
    if (!renderer || lost || disposed) return;
    const width = viewport.clientWidth, height = viewport.clientHeight;
    const aspect = width / Math.max(1, height), halfY = aspect < 1 ? 1.3 / aspect : 1.3;
    camera.left = -halfY * aspect; camera.right = halfY * aspect; camera.top = halfY; camera.bottom = -halfY; camera.updateProjectionMatrix();
    renderer.setSize(width, height, false); requestRender();
  }
  function zoom(gain) {
    if (!camera || lost) return;
    camera.zoom = Math.max(.8, Math.min(3.2, camera.zoom * gain)); camera.updateProjectionMatrix(); controls.update(); requestRender();
  }
  function reset() { root.dispatchEvent(new CustomEvent('gm-world-free-view')); if (camera) { camera.zoom = 1; camera.updateProjectionMatrix(); } focus(D.home, '从中国出发'); }
  $('gw-in').addEventListener('click', () => zoom(1.2)); $('gw-out').addEventListener('click', () => zoom(1 / 1.2)); $('gw-reset').addEventListener('click', reset);
  let resizeObserver, intersectionObserver;
  try {
    if (!T || !ctx || !paths.size) throw new Error('本地渲染能力不可用');
    renderer = new T.WebGLRenderer({canvas, alpha: true, antialias: true});
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    scene = new T.Scene(); camera = new T.OrthographicCamera(-2, 2, 1.3, -1.3, .1, 30);
    camera.position.set(...G.xyz(D.home, 5)); camera.lookAt(0, 0, 0);
    scene.add(new T.AmbientLight('#ffffff', 1.15));
    const sun = new T.DirectionalLight('#fff9e4', 2.4); camera.add(sun); sun.position.set(-3, 4, 5); scene.add(camera);
    texture = new T.CanvasTexture(tex); texture.colorSpace = T.SRGBColorSpace;
    globe = new T.Mesh(G.sphere(T), new T.MeshLambertMaterial({map: texture})); scene.add(globe);
    marker = new T.Mesh(G.sphere(T, 16, 8), new T.MeshLambertMaterial({color: '#aa4517'})); marker.scale.setScalar(.013); marker.visible = false; scene.add(marker);
    controls = new T.OrbitControls(camera, canvas); controls.enablePan = false; controls.enableDamping = false; controls.minZoom = .8; controls.maxZoom = 3.2; controls.rotateSpeed = .65;
    controls.addEventListener('change', requestRender);
    controls.addEventListener('start', () => { $('gw-view-label').textContent = '自由探索'; $('gw-views').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false')); });
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
      const country = countries.find(c => ctx.isPointInPath(paths.get(c.name), x, y, 'evenodd'));
      if (country) choose(country.name); else $('gw-status').textContent = '这里是海洋。点大洋名称，或从「想去哪里」选择一片大洋。';
      readCoordinates(point, '点击位置');
    });
    canvas.addEventListener('keydown', event => {
      if (lost) return;
      if (['+', '=', '-', '_'].includes(event.key)) { event.preventDefault(); zoom(['+', '='].includes(event.key) ? 1.15 : 1 / 1.15); }
      else if (event.key === 'Home') { event.preventDefault(); reset(); }
      else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault(); const [lon, lat] = G.lonLat(camera.position);
        focus([G.wrap(lon + (event.key === 'ArrowLeft' ? -10 : event.key === 'ArrowRight' ? 10 : 0)), Math.max(-89.9, Math.min(89.9, lat + (event.key === 'ArrowUp' ? 10 : event.key === 'ArrowDown' ? -10 : 0)))], '自由探索');
      }
    });
    canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); fallback('3D 显示已中断，请刷新页面重试。'); });
    resizeObserver = new ResizeObserver(resize); resizeObserver.observe(viewport);
    intersectionObserver = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) requestRender(); }); intersectionObserver.observe(viewport);
    root.dataset.renderer = 'webgl'; resize();
  } catch (error) {
    fallback('当前浏览器无法显示 3D 地球仪。');
  }
  function fromAddress() {
    const params = new URLSearchParams(location.search), id = params.get('place') || params.get('continent');
    if (!choose(id || 'China', false)) { choose('China', false); $('gw-status').textContent = '没有找到链接里的地点，已回到中国。请从列表重新选择。'; }
    if (!id) focus(D.home, '从中国出发');
    setLayer(params.get('layer'), false); setLine(params.get('line'), false, false);
  }
  fromAddress(); window.addEventListener('popstate', fromAddress);
  window.GMWorldLearning?.mount({root, choose, setLine, setLayer});
  document.addEventListener('visibilitychange', requestRender);
  window.addEventListener('pagehide', event => {
    if (frame) cancelAnimationFrame(frame); frame = 0;
    if (event.persisted) return;
    disposed = true; resizeObserver?.disconnect(); intersectionObserver?.disconnect(); controls?.dispose();
    globe?.geometry.dispose(); globe?.material.dispose(); marker?.geometry.dispose(); marker?.material.dispose(); texture?.dispose(); renderer?.dispose();
  });
  window.addEventListener('pageshow', requestRender);
})();

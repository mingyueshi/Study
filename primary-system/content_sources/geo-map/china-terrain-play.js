/* 只改变显示姿态与表面颜色；原始高程、坐标与判题始终独立。 */
window.GMChinaTerrainPlay = (() => {
  'use strict';
  function inside(point, rings) {
    let result = false;
    for (const ring of rings) for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [x, y] = ring[i], [a, b] = ring[j];
      if ((y > point[1]) !== (b > point[1]) && point[0] < (a - x) * (point[1] - y) / (b - y) + x) result = !result;
    }
    return result;
  }
  function lakeTriangles(rings, sample, spacing = .025) {
    const all = rings.flat(), xs = all.map(p => p[0]), ys = all.map(p => p[1]), output = [];
    const minX = Math.min(...xs), minY = Math.min(...ys), maxX = Math.max(...xs), maxY = Math.max(...ys);
    for (let x = minX; x < maxX; x += spacing) for (let y = minY; y < maxY; y += spacing) {
      const points = [[x, y], [x + spacing, y], [x + spacing, y + spacing], [x, y + spacing]];
      const samples = points.map(p => inside(p, rings) ? sample(p) : null);
      for (const ids of [[0, 1, 2], [0, 2, 3]]) if (ids.every(i => samples[i] !== null)) output.push(ids.map(i => ({ point: points[i], meters: samples[i] })));
    }
    return output;
  }
  function lakeLevel(rings, sample, minimum = -Infinity) {
    const values = lakeTriangles(rings, sample).flat().map(p => p.meters).sort((a,b) => a-b);
    return values.length ? Math.max(minimum, values[Math.floor((values.length - 1) * .3)]) : null;
  }
  function create({ root, models, rivers, scene, sample, locate, requestDraw, fullMotion, canAnimate, gain }) {
    const T = window.GMThree, G = window.GMChina3DGeometry, D = window.GM_CHINA_ADVENTURES;
    let selected = '', lifted = true, flat = false, start = null, rise = 1, moving = false, entrancePending = true;
    const lakeGroup = new T.Group(); scene.add(lakeGroup);
    const snow = new T.Color('#f4fcff');
    const originals = new Map([...models].map(([id, m]) => [id, m.geometry.top.getAttribute('color').array.slice()]));
    const owner = point => locate(point)?.mesh.province || '';
    const waterOriginals = new Map(), waterBeds = new Map(), levels = {};
    for (const lake of D.lakes) {
      const level = lakeLevel(lake.rings, sample, window.GM_CHINA_HYDROLOGY?.lakeFloorMeters ?? 0); if (level === null) continue;
      levels[lake.feature] = Math.round(level);
      const buckets = new Map();
      const record = window.GM_CHINA_HYDROLOGY_GEO?.lakes[lake.feature];
      if (record) {
        for (const patch of record.patches) buckets.set(patch.province, patch.triangles.flatMap(t => t.flatMap(p => [...G.xy(p), (level + 3) / G.metersPerUnit])));
        for (const [id, mask] of Object.entries(record.bedMasks)) {
          const model = models.get(id); if (!model) continue;
          if (!waterOriginals.has(id)) {
            const positions = model.geometry.top.getAttribute('position').array;
            waterOriginals.set(id, positions.slice()); waterBeds.set(id, positions.slice());
          }
          const bed = waterBeds.get(id);
          for (const index of window.GMChinaHydrology.maskIndices(mask, model.geometry.indices)) bed[index * 3 + 2] = Math.min(bed[index * 3 + 2], (level - 25) / G.metersPerUnit);
        }
      } else for (const triangle of lakeTriangles(lake.rings, sample)) {
        const id = owner(triangle[0].point); if (!buckets.has(id)) buckets.set(id, []);
        buckets.get(id).push(...triangle.flatMap(p => [...G.xy(p.point), (level + 3) / G.metersPerUnit]));
      }
      for (const [id, positions] of buckets) {
        const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); geo.computeVertexNormals();
        const mesh = new T.Mesh(geo, new T.MeshLambertMaterial({ color: '#269cc8', emissive: '#073044', transparent: true, opacity: .82, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
        mesh.userData.province = id; mesh.userData.feature = lake.feature; lakeGroup.add(mesh);
      }
    }
    root.dataset.lakeCount = String(D.lakes.length);
    root.dataset.lakeSurface = 'level'; root.dataset.lakeLevels = JSON.stringify(levels);
    root.querySelector('#gm3-lake-note').innerHTML = window.GMShared.esc(window.GM_CHINA_HYDROLOGY?.lakeNote || D.lakeNote) + ` <a href="${D.lakeSource.url}" target="_blank" rel="noopener">${window.GMShared.esc(D.lakeSource.label)}（需联网）↗</a>`;
    function applyWater(on) {
      lakeGroup.visible = on;
      for (const [id, original] of waterOriginals) {
        const geo = models.get(id).geometry.top;
        // 只替换显示顶点。原始 positions、elevations 与采样器保留原始高程。
        let positions = geo.getAttribute('position');
        if (positions.array === models.get(id).geometry.positions) { positions = new T.BufferAttribute(original.slice(), 3); geo.setAttribute('position', positions); }
        positions.array.set(on ? waterBeds.get(id) : original); positions.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
      }
      root.dataset.lakesVisible = String(on); requestDraw();
    }
    applyWater(true);
    root.querySelector('#gm3-snow-note').textContent = D.snowNote;
    const offset = id => (models.get(id)?.group.position.z || G.datum) - G.datum;
    function tick(now) {
      const animate = fullMotion() && canAnimate();
      if (entrancePending && (!fullMotion() || canAnimate())) {
        entrancePending = false; start = fullMotion() ? now : null;
      }
      if (start !== null) {
        const t = animate ? Math.min(1, (now - start) / 1400) : 1;
        rise = t * t * (3 - 2 * t);
        if (t === 1) start = null;
      }
      moving = start !== null;
      for (const [id, model] of models) {
        const goal = lifted && !flat && id === selected ? G.datum + .9 : G.datum;
        const delta = goal - model.group.position.z;
        model.group.position.z = animate && Math.abs(delta) > .002 ? model.group.position.z + delta * .2 : goal;
        if (Math.abs(goal - model.group.position.z) > .002) moving = true;
        model.group.scale.z = gain() * rise;
      }
      for (const river of rivers.values()) {
        river.group.scale.z = gain() * rise;
        for (const line of river.group.children) line.position.z = offset(line.userData.province) / (gain() * rise || 1);
      }
      for (const lake of lakeGroup.children) { lake.position.z = G.datum + .001 + offset(lake.userData.province); lake.scale.z = gain() * rise; }
      root.dataset.rise = rise.toFixed(3); root.dataset.lifted = selected && lifted && !flat ? selected : '';
      if (moving) requestDraw();
    }
    function settle(stopEntrance = false) { if (stopEntrance) entrancePending = false; start = null; rise = 1; moving = false; tick(performance.now()); }
    root.querySelector('#gm3-lift').addEventListener('click', e => { lifted = !lifted; e.currentTarget.setAttribute('aria-pressed', String(lifted)); requestDraw(); });
    root.querySelector('#gm3-lakes').addEventListener('click', e => { applyWater(!lakeGroup.visible); e.currentTarget.setAttribute('aria-pressed', String(lakeGroup.visible)); });
    root.querySelector('#gm3-snow').addEventListener('click', e => {
      const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', String(on));
      for (const [id, model] of models) {
        const attr = model.geometry.top.getAttribute('color'); attr.array.set(originals.get(id));
        if (on) for (let i = 0; i < model.geometry.elevations.length; i++) if (model.geometry.elevations[i] >= D.snowMeters) snow.toArray(attr.array, i * 3);
        attr.needsUpdate = true;
      }
      root.dataset.snow = String(on); requestDraw();
    });
    function stand() { entrancePending = false; start = fullMotion() ? performance.now() : null; rise = start === null ? 1 : 0; requestDraw(); }
    root.querySelector('#gm3-stand').addEventListener('click', stand);
    requestDraw();
    return { tick, settle, owner, offset, get gain() { return gain() * rise; },
      select(id) { selected = id; requestDraw(); },
      flatten(on) { if (flat === on) return; flat = on; if (on) { entrancePending = false; start = null; rise = 1; for (const m of models.values()) m.group.position.z = G.datum; } requestDraw(); },
    };
  }
  return { inside, lakeTriangles, lakeLevel, create };
})();

/* 流域着色复用原地形三角面；支流沿既有高程贴地，不改原始海拔。 */
window.GMChinaHydrology = (() => {
  'use strict';
  function maskIndices(record, indices) {
    if (record.triangleCount * 3 !== indices.length) throw new Error('流域掩膜与地形不匹配');
    const bytes = Uint8Array.from(atob(record.bits), c => c.charCodeAt(0)), selected = [];
    if (bytes.length !== Math.ceil(record.triangleCount / 8)) throw new Error('流域掩膜长度无效');
    for (let i = 0; i < record.triangleCount; i++) if (bytes[i >> 3] & (1 << (i & 7))) selected.push(indices[i * 3], indices[i * 3 + 1], indices[i * 3 + 2]);
    if (selected.length !== record.selectedCount * 3) throw new Error('流域掩膜计数无效');
    return selected;
  }
  function mount({root, focusRiver, focusPoint, focusEstuary, requestDraw, available, reveal}) {
    const D = window.GM_CHINA_HYDROLOGY, source = window.GM_CHINA_HYDROLOGY_GEO, esc = window.GMShared.esc;
    const $ = id => root.querySelector('#' + id);
    let river = 'f20', basinVisible = false, tributariesVisible = true, activeBranch = '', context = null;
    const basinGroups = new Map(), branches = new Map(); let puzzleMissing = new Set();
    $('gm3-hydro-intro').textContent = D.intro; $('gm3-basin-note').textContent = D.basinNote;
    $('gm3-tributary-note').textContent = D.tributaryNote;
    $('gm3-basin').innerHTML = D.basins.map(b => `<option value="${b.feature}">${esc(b.name)}</option>`).join('') + '<option value="f43">京杭大运河 · 跨流域水路</option>';
    $('gm3-estuaries').innerHTML = D.estuaries.map(e => `<button type="button" data-estuary="${e.id}" aria-pressed="false">🔍 ${esc(e.name)}</button>`).join('');
    $('gm3-water-legend').innerHTML = [ ['main','主要干流'], ['tributary','支流／水系支干'], ['lake','湖泊水面'] ].map(([key,name]) => `<span><i style="--water-color:${D.colors[key]}"></i>${name}</span>`).join('');
    function writeBasinURL() {
      const url = new URL(location.href);
      if (basinVisible && D.basins.some(b => b.feature === river)) url.searchParams.set('basin', river); else url.searchParams.delete('basin');
      try { history.replaceState(null, '', url); } catch (_) { /* 文件页面仍可观察 */ }
    }
    function render() {
      const basin = D.basins.find(b => b.feature === river);
      $('gm3-basin').value = river;
      $('gm3-basin-area').textContent = basin?.areaLabel || '人工水路 · 跨越流域';
      $('gm3-basin-scope').textContent = basin?.scope || D.canalNote;
      $('gm3-basin-text').textContent = basin?.text || D.canalNote;
      $('gm3-basin-observe').textContent = basin ? '看图想一想：' + basin.observe : '';
      $('gm3-basin-source').hidden = !basin;
      if (basin) $('gm3-basin-source').href = basin.source;
      $('gm3-basins').disabled = !available() || !basin;
      $('gm3-basins').setAttribute('aria-pressed', String(Boolean(basin && basinVisible && available())));
      $('gm3-basins').textContent = basin && basinVisible ? '隐藏流域范围' : '显示流域范围';
      $('gm3-tributaries').disabled = !available();
      $('gm3-tributaries').setAttribute('aria-pressed', String(tributariesVisible));
      $('gm3-tributaries').textContent = tributariesVisible ? '隐藏支流' : '显示支流';
      const list = D.tributaries.filter(b => b.river === river);
      $('gm3-tributary-list').innerHTML = list.map(b => `<button type="button" data-tributary="${b.id}" aria-pressed="${b.id === activeBranch}">${esc(b.name)}</button>`).join('');
      $('gm3-tributary-empty').hidden = list.length > 0;
      root.dataset.basin = basinVisible && basin && available() ? river : '';
      root.dataset.tributariesVisible = String(tributariesVisible);
      root.dataset.tributary = activeBranch;
      if (basinVisible && basin && context && available() && !basinGroups.has(river)) buildBasin(river);
      for (const [id, group] of basinGroups) group.visible = basinVisible && id === river;
      for (const [id, record] of branches) {
        record.ink.color.set(id === activeBranch ? '#168cc5' : D.colors.tributary);
        record.ink.linewidth = id === activeBranch ? 3.2 : 2;
      }
      requestDraw();
    }
    function buildBasin(id) {
      const {T, models, scene} = context, group = new T.Group();
      for (const [province, record] of Object.entries(source.basins[id].provinceMasks)) {
        const model = models.get(province); if (!model) continue;
        const geometry = new T.BufferGeometry();
        geometry.setAttribute('position', model.geometry.top.getAttribute('position'));
        geometry.setAttribute('normal', model.geometry.top.getAttribute('normal'));
        geometry.setIndex(maskIndices(record, model.geometry.indices));
        const material = new T.MeshBasicMaterial({color: '#41b2d1', transparent: true, opacity: .32, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2});
        const mesh = new T.Mesh(geometry, material); mesh.userData.province = province; group.add(mesh);
      }
      group.renderOrder = 1; scene.add(group); basinGroups.set(id, group);
    }
    function attach(options) {
      context = options;
      const {T, G, sample, scene} = context;
      for (const branch of D.tributaries) {
        const record = source.tributaries[branch.id], group = new T.Group();
        const ink = new T.LineMaterial({color: D.colors.tributary, linewidth: 2, depthWrite: false});
        const halo = new T.LineMaterial({color: '#e7faff', linewidth: 3.5, depthWrite: false});
        const paths = record.paths.map(path => path.map(p => [...p, sample(p) ?? 0]));
        const draped = G.drapeRiver(paths, sample), buckets = new Map();
        for (const path of draped.paths) for (let i = 1; i < path.length; i++) {
          if (!path[i - 1].onTerrain || !path[i].onTerrain) continue;
          const owner = sample.locate(path[i].point)?.mesh.province || '';
          if (!buckets.has(owner)) buckets.set(owner, []);
          buckets.get(owner).push(...[path[i - 1], path[i]].flatMap(p => [...G.xy(p.point), (p.meters + 5) / G.metersPerUnit]));
        }
        for (const [province, positions] of buckets) {
          const geometry = new T.LineSegmentsGeometry().setPositions(positions);
          const border = new T.LineSegments2(geometry, halo), line = new T.LineSegments2(geometry, ink);
          for (const object of [border,line]) { object.userData.province = province; group.add(object); }
          border.renderOrder = 2; line.renderOrder = 3;
        }
        scene.add(group); branches.set(branch.id, {group, ink, halo});
      }
      root.dataset.tributaryCount = String(branches.size); render();
    }
    function tick(gain, offset, showRivers) {
      if (!context) return;
      const {G} = context;
      for (const group of basinGroups.values()) for (const mesh of group.children) { mesh.scale.z = gain; mesh.position.z = G.datum + .002 + offset(mesh.userData.province); }
      for (const [id,record] of branches) {
        record.group.visible = tributariesVisible && showRivers && !puzzleMissing.has(id);
        for (const line of record.group.children) { line.scale.z = gain; line.position.z = G.datum + .002 + offset(line.userData.province); }
      }
    }
    function select(id) { river = id; activeBranch = ''; $('gm3-hydro-detail').hidden = true; render(); }
    function setVisible(on, writeURL = true) { basinVisible = Boolean(on); render(); if (writeURL) writeBasinURL(); }
    function showEstuary(id) {
      const e = D.estuaries.find(e => e.id === id); if (!e) return;
      $('gm3-hydro-detail').hidden = false;
      $('gm3-hydro-detail').innerHTML = `<h3>${esc(e.name)}</h3><p>${esc(e.text)}</p><p><b>想一想：</b>${esc(e.observe)}</p><p>这里的地形与河道经过简化，不表示实时岸线、潮位或泥沙沉积速度。</p><a href="${esc(e.source)}" target="_blank" rel="noopener">资料出处（需联网）↗</a>`;
      root.querySelectorAll('[data-estuary]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.estuary === id)));
    }
    $('gm3-basin').addEventListener('change', event => { focusRiver(event.target.value); writeBasinURL(); reveal(); });
    $('gm3-basins').addEventListener('click', () => { setVisible(!basinVisible); reveal(); });
    $('gm3-tributaries').addEventListener('click', () => { tributariesVisible = !tributariesVisible; render(); reveal(); });
    $('gm3-tributary-list').addEventListener('click', event => {
      const button = event.target.closest('[data-tributary]'); if (!button) return;
      const branch = D.tributaries.find(b => b.id === button.dataset.tributary);
      focusRiver(branch.river); activeBranch = branch.id; tributariesVisible = true; render();
      const path = [...source.tributaries[branch.id].paths].sort((a,b) => b.length - a.length)[0];
      focusPoint(path[Math.floor(path.length / 2)], 4, branch.name);
      $('gm3-hydro-detail').hidden = false; $('gm3-hydro-detail').innerHTML = `<h3>${esc(branch.name)} · ${esc(branch.relation)}</h3><p>${esc(branch.text)}</p>`;
    });
    $('gm3-estuaries').addEventListener('click', event => { const button = event.target.closest('[data-estuary]'); if (button) focusEstuary(button.dataset.estuary); });
    $('gm3-estuary-overview').addEventListener('click', () => focusRiver(river));
    render();
    return {attach, tick, select, setVisible, showEstuary, refresh: render, setPuzzleMissing(ids) {puzzleMissing=new Set(ids);requestDraw();}, get basin() {return basinVisible ? river : '';}};
  }
  return {maskIndices, mount};
})();

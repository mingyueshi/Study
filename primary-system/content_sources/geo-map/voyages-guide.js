/* 两条线和停靠点沿用地球仪的路线数据与采样，平面图使用图谱底图。 */
(() => {
  'use strict';
  const root = document.querySelector('.voyages-topic');
  const {esc, worldMap, wrapRing} = window.GMShared;
  const {voyages, sources} = window.GM_WORLD_EXPEDITIONS;
  const {m, W, H, paths, ringPath} = worldMap();
  const {lonLat} = window.GMWorld3DGeometry;
  const map = document.getElementById('voyage-map');
  const atlasBase = root.dataset.atlasBase || '';
  const historyBase = root.dataset.historyEvent;

  function drawRoute(voyage) {
    const route = window.GMWorldVoyages.buildRoute(voyage);
    const line = route.points.map(([x, y, z]) => lonLat({x, y, z}));
    const segments = wrapRing(line).map(points => ringPath(points).slice(0, -1));
    const stations = voyage.stops.map(stop => {
      const [x, y] = m(...stop.point);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.5"/>`;
    });
    return `<g class="geo-voyage-${esc(voyage.id)}">` +
      segments.map(path => `<path class="geo-voyage-line" d="${path}"/>`).join('') +
      stations.join('') + '</g>';
  }

  map.setAttribute('viewBox', `0 0 ${W} ${H.toFixed(2)}`);
  map.innerHTML = '<g class="geo-voyage-land">' +
    [...paths.values()].map(path => `<path d="${path}"/>`).join('') + '</g>' +
    voyages.map(drawRoute).join('');

  for (const voyage of voyages) {
    const panel = root.querySelector(`[data-voyage-guide="${voyage.id}"]`);
    if (!panel) continue;
    const history = historyBase + '?' + new URLSearchParams({event: voyage.stops[0].history});
    const links = [...new Set(voyage.stops.flatMap(stop => stop.sources))]
      .map(id => sources.find(source => source.id === id))
      .map(source => `<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.name)}（需联网）↗</a>`);
    const ports = voyage.stops.map((stop, index) => {
      const query = new URLSearchParams({voyage: voyage.id, port: stop.id});
      const href = atlasBase + 'world-3d.html?' + query + '#gw-viewport';
      return `<li>
        <h3>${index + 1} · ${esc(stop.name)}</h3>
        <p>${esc(stop.text)}</p>
        <p><strong>观察</strong> ${esc(stop.observe)}</p>
        <a href="${esc(href)}">到地球仪看本站 →</a>
      </li>`;
    });
    panel.innerHTML = `
      <p class="geo-guide-note">${esc(voyage.note)}</p>
      <p class="geo-guide-actions">
        <a href="${esc(history)}">阅读原历史档案 →</a>
        ${links.join('')}
      </p>
      <details class="geo-guide-details">
        <summary>查看 ${voyage.stops.length} 个代表站</summary>
        <ol class="geo-guide-grid geo-voyage-stops">${ports.join('')}</ol>
      </details>`;
  }
})();

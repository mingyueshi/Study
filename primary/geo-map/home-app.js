/* 门户使用与中国地图相同的省界与区域色。 */
(() => {
  'use strict';
  const root = document.querySelector('.home-topic');
  const $ = (id) => root.querySelector('#' + id);
  const S = window.GMShared;
  const A = window.GMAtlas;
  const regions = window.GM_REGIONS;
  const provinces = window.GM_PROVINCES;
  const colors = new Map(regions.map(r => [r.id, r.color]));

  $('stat-stations').textContent = provinces.length;
  $('stat-places').textContent = A.places.length;
  $('stat-routes').textContent = A.routes.length;
  $('station-grid').innerHTML = provinces.map(p => S.stationCard(p, colors.get(p.region))).join('');

  const svg = $('gm-home-svg');
  svg.setAttribute('viewBox', `94 5 1100 ${S.H.toFixed(0)}`);
  svg.innerHTML = S.mapPrelude() + S.provincePathsSVG(p => colors.get(p.region)) + S.insetSVG();
})();

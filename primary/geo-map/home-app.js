/* 系统门户：渲染数据规模与三十四个省域站格子（入口卡为静态 HTML）。 */
(() => {
  'use strict';
  const root = document.querySelector('.home-topic');
  if (!root) return;
  const $ = (id) => root.querySelector(`#${id}`);
  const S = window.GMShared;

  const REGIONS = window.GM_REGIONS || [];
  const PROVINCES = window.GM_PROVINCES || [];
  const FEATURES = window.GM_FEATURES || [];
  const NEIGHBORS = window.GM_NEIGHBORS || [];
  const RHYMES = window.GM_RHYMES || [];

  const color = Object.fromEntries(REGIONS.map((r) => [r.id, r.color]));
  $('stat-stations').textContent = PROVINCES.length;
  $('stat-features').textContent = FEATURES.length;
  $('stat-neighbors').textContent = NEIGHBORS.length;
  $('stat-rhymes').textContent = RHYMES.length;
  $('station-grid').innerHTML = PROVINCES.map((p) => S.stationCard(p, color[p.region] || '#8a7a55')).join('');
})();

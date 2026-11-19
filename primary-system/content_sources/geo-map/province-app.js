/* 省域站目录与详情共用地区筛选和站点链接。 */
(() => {
  'use strict';
  const root = document.querySelector('.province-topic');
  if (!root) return;
  const $ = id => root.querySelector('#' + id);
  const S = window.GMShared;
  const {esc} = S;
  const A = window.GMAtlas;
  const cultureUrl = root.dataset.cultureUrl || 'province-culture.html';
  const terrainUrl = root.dataset.terrainUrl || 'china-3d.html';
  const regions = window.GM_REGIONS;
  const provinces = [...window.GM_PROVINCES].sort((a, b) => a.adcode.localeCompare(b.adcode));
  const regionMap = new Map(regions.map(region => [region.id, region]));
  const adcode = new URLSearchParams(location.search).get('adcode');
  const index = provinces.findIndex(province => province.adcode === adcode);
  const p = provinces[index];
  const slot = $('province-page');
  const nav = $('province-nav');
  const tools = $('province-tools');
  const workspace = tools.closest('.gm-flat-workspace');
  const search = $('province-search');
  const filters = $('province-regions');
  const matchesNav = $('province-matches');
  const reset = $('province-filter-reset');
  const stationHref = province => 'province.html?adcode=' + encodeURIComponent(province.adcode);
  const stationCard = province => S.stationCard(province, regionMap.get(province.region).color);
  const filterOptions = [{id: '', name: '全部区域'}, ...regions];
  let activeRegion = '';

  function renderDirectory() {
    slot.innerHTML = (adcode ? '<p class="gm-notice">没有找到这个省域站，可以从目录重新选。</p>' : '') +
      regions.map(region => {
        const stations = provinces.filter(province => province.region === region.id);
        return '<section class="gm-stations" id="region-' + esc(region.id) + '"><h2>' + esc(region.name) +
          '</h2><div class="gm-station-grid">' + stations.map(stationCard).join('') + '</div></section>';
      }).join('') + '<p id="province-empty" class="gm-notice" hidden>没有符合条件的省域站，可以换个词或清除筛选。</p>';
  }

  function renderDetail() {
    const region = regionMap.get(p.region);
    const prev = provinces[(index - 1 + provinces.length) % provinces.length];
    const next = provinces[(index + 1) % provinces.length];
    const capLabel = p.type === '自治区' ? '首府' : '省会';
    const badge = (text, color) => '<span class="gm-badge" style="--badge:' + esc(color) + '">' + esc(text) + '</span>';
    document.title = p.name + ' · 省域站 · 地理图谱';
    root.querySelector('.gm-province-heading-text').innerHTML =
      '<p class="gm-eyebrow">省域站 · 第 ' + (index + 1) + '／' + provinces.length + ' 站</p>' +
      '<h1 class="gm-title">' + esc(p.name) + '</h1>' +
      '<div class="gm-chips">' + badge('简称 ' + p.short, region.color) + badge(p.type, '#8a7a55') +
      badge(region.name, region.color) + (p.capital ? badge(capLabel + ' ' + p.capital, region.color) : '') + '</div>';

    tools.open = false;
    $('province-related').open = true;
    root.querySelector('.gm-flat-back').hidden = true;
    nav.insertAdjacentHTML('afterbegin',
      '<a href="' + stationHref(prev) + '">上一站 · ' + esc(prev.name) + '</a>' +
      '<a href="' + stationHref(next) + '">下一站 · ' + esc(next.name) + '</a>' +
      '<a href="province.html">全部省域站</a>');
    $('province-map-link').href = A.mapHref(A.get(p.id));
    $('province-map-link').textContent = '在中国地图上看';
    $('province-terrain-link').href = terrainUrl + '?place=' + encodeURIComponent(p.id);
    $('province-terrain-link').textContent = '在 3D 中国地形上看';
    $('province-culture-link').href = cultureUrl + '?adcode=' + encodeURIComponent(p.adcode);
    $('province-culture-link').textContent = '看特产、民俗与景观';

    slot.innerHTML =
      '<div class="gm-prov-overview"><figure class="gm-map-mini">' +
      '<svg id="gm-prov-svg" role="group" aria-label="' + esc(p.name) + '在中国地图上的位置示意"></svg>' +
      '<figcaption class="gm-map-note">橙色是' + esc(S.displayName(p.name)) + '；点其他省份可以跳到它的省域站，南海诸岛与十段线见右下小图。</figcaption>' +
      '</figure><section class="gm-facts" aria-labelledby="facts-title">' +
      '<h2 id="facts-title">记一记</h2><p class="gm-prov-where">' + esc(p.where) + '。' + esc(p.note) + '</p>' +
      '<ol>' + p.facts.map(fact => '<li>' + esc(fact) + '</li>').join('') + '</ol>' +
      (region.hint ? '<p class="gm-card-foot">它属于' + esc(region.name) + '：' + esc(region.hint) + '</p>' : '') +
      '</section></div><div class="gm-prov-resources">' +
      window.GMMedia.preview(p.id) +
      '</div>';

    const mapSvg = $('gm-prov-svg');
    mapSvg.setAttribute('viewBox', '0 0 ' + S.W + ' ' + S.H.toFixed(0));
    mapSvg.innerHTML = S.mapPrelude() +
      S.provincePathsSVG(province => province.adcode === p.adcode ? '#e26d3c' : '#eae3cf', {interactive: true}) +
      '<path d="' + S.provD.get(p.adcode) + '" fill="none" stroke="#c95a2e" stroke-width="3" stroke-linejoin="round" pointer-events="none"/>' +
      S.insetSVG() + S.compass();

    function gotoStation(event) {
      const id = event.target.closest('[data-id]')?.dataset.id;
      const province = provinces.find(station => station.id === id);
      if (province && province !== p) location.href = stationHref(province);
    }
    mapSvg.addEventListener('click', gotoStation);
    mapSvg.addEventListener('keydown', event => {
      if (!['Enter', ' '].includes(event.key) || !event.target.matches('[data-id]')) return;
      event.preventDefault();
      if (!event.repeat) gotoStation(event);
    });
  }

  if (p) renderDetail();
  else renderDirectory();

  const directoryGroups = [...slot.querySelectorAll('.gm-stations')].map(group => ({
    group,
    links: [...group.querySelectorAll('.gm-station')].map(link => ({
      link,
      code: new URL(link.href).searchParams.get('adcode')
    }))
  }));

  filters.innerHTML = filterOptions.map(({id, name}) =>
    '<button type="button" data-region="' + esc(id) + '" aria-pressed="false">' + esc(name) + '</button>').join('');

  function applyFilters() {
    const found = new Set(A.search(search.value, 'province').map(station => station.id));
    const matches = provinces.filter(station => (!activeRegion || station.region === activeRegion) && found.has(station.id));
    for (const button of filters.children) button.setAttribute('aria-pressed', String(button.dataset.region === activeRegion));
    $('province-filter-status').textContent = matches.length ? '找到 ' + matches.length + ' 个省域站' : '没有符合条件的省域站';
    reset.hidden = !activeRegion && !search.value.trim();
    if (p) {
      matchesNav.innerHTML = matches.map(station =>
        '<a href="' + stationHref(station) + '"' + (station === p ? ' aria-current="page"' : '') + '>' +
        esc(station.name) + '</a>').join('');
      matchesNav.hidden = matches.length === 0;
    } else {
      const codes = new Set(matches.map(station => station.adcode));
      for (const {group, links} of directoryGroups) {
        for (const {link, code} of links) link.hidden = !codes.has(code);
        group.hidden = links.every(({link}) => link.hidden);
      }
      $('province-empty').hidden = matches.length > 0;
    }
  }

  search.addEventListener('input', applyFilters);
  filters.addEventListener('click', event => {
    const button = event.target.closest('[data-region]');
    if (!button) return;
    activeRegion = button.dataset.region;
    applyFilters();
  });
  reset.addEventListener('click', () => {
    search.value = '';
    activeRegion = '';
    applyFilters();
    search.focus();
  });
  applyFilters();

  function openTargetGroup() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    const group = target?.closest('.gm-flat-tools');
    if (group && workspace.contains(group)) group.open = true;
  }
  window.addEventListener('hashchange', openTargetGroup);
  openTargetGroup();

  root.querySelector('.gm-tools-jump').addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    tools.open = true;
    // 同一锚点再点一次时不会触发 hashchange。
    if (workspace.dataset.slMode === 'compact' && workspace.dataset.slOpen === 'false') {
      workspace.querySelector('.sl-toggle:not(.sl-collapse)').click();
    } else if (workspace.dataset.slMode === 'wide' && workspace.dataset.slCollapsed === 'true') {
      workspace.querySelector('.sl-collapse').click();
    }
    requestAnimationFrame(() => tools.querySelector('summary').focus());
  });
})();

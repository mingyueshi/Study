/* 省域站详情页：按 ?adcode= 渲染单省档案、记一记要点与迷你地图。
   迷你地图基座复用 shared.js，本省高亮，其余省份可点击跳站；无效参数回退为省域站列表。 */
(() => {
  'use strict';
  const root = document.querySelector('.province-topic');
  if (!root) return;
  const $ = (id) => root.querySelector(`#${id}`);
  const S = window.GMShared;
  const esc = S.esc;

  const REGIONS = window.GM_REGIONS || [];
  /* 站序按行政区划代码排列，从华北出发一路游览全国。 */
  const PROVINCES = (window.GM_PROVINCES || []).slice().sort((a, b) => a.adcode.localeCompare(b.adcode));
  const regionMap = Object.fromEntries(REGIONS.map((r) => [r.id, r]));
  const slot = $('province-page');

  const adcode = new URLSearchParams(location.search).get('adcode');
  const index = PROVINCES.findIndex((p) => p.adcode === adcode);
  if (index < 0) {
    $('crumb-here').textContent = '没有找到这个省域站';
    const color = Object.fromEntries(REGIONS.map((r) => [r.id, r.color]));
    slot.innerHTML = '<section class="gm-missing"><h2>没有找到这个省域站</h2>' +
      '<p>可能链接少了一段地址，从下面的列表重新进站：</p>' +
      '<div class="gm-station-grid">' +
      PROVINCES.map((p) => S.stationCard(p, color[p.region] || '#8a7a55')).join('') +
      '</div></section>';
    return;
  }

  const p = PROVINCES[index];
  const region = regionMap[p.region] || {};
  const prev = PROVINCES[index - 1];
  const next = PROVINCES[index + 1];
  const capLabel = p.type === '自治区' ? '首府' : '省会';
  document.title = `${p.name} · 省域站 · 中国地图`;
  $('crumb-here').textContent = p.name;

  const badge = (text, color) => `<span class="gm-badge" style="--badge:${esc(color)}">${esc(text)}</span>`;
  slot.innerHTML =
    `<header class="gm-prov-head" style="--accent:${esc(region.color || '#2e7d64')}">` +
    `<p class="gm-card-eyebrow">省域站 · 第 ${index + 1}／${PROVINCES.length} 站</p>` +
    `<h2 class="gm-prov-name">${esc(p.name)}</h2>` +
    `<div class="gm-chips">${badge(`简称 ${p.short}`, region.color)}${badge(p.type, '#8a7a55')}${badge(region.name || '', region.color)}${p.capital ? badge(`${capLabel} ${p.capital}`, region.color) : ''}</div>` +
    `<p class="gm-prov-where">它${esc(p.where)}。${esc(p.note)}</p>` +
    `</header>` +

    `<figure class="gm-map-mini">` +
    `<svg id="gm-prov-svg" role="group" aria-label="${esc(p.name)}在中国地图上的位置示意"></svg>` +
    `<figcaption class="gm-map-note">橙色是${esc(S.displayName(p.name))}；点其他省份可以跳到它的省域站，南海诸岛与十段线见右下小图。</figcaption>` +
    `</figure>` +

    `<section class="gm-facts" aria-labelledby="facts-title">` +
    `<h2 id="facts-title">记一记</h2>` +
    `<ol>${(p.facts || []).map((f) => `<li>${esc(f)}</li>`).join('')}</ol>` +
    (region.hint ? `<p class="gm-card-foot">它属于${esc(region.name)}：${esc(region.hint)}</p>` : '') +
    `</section>` +

    `<nav class="gm-pager" aria-label="上一站下一站">` +
    (prev ? `<a class="gm-pager-btn" href="province.html?adcode=${esc(prev.adcode)}"><small>上一站</small><b>${esc(prev.name)}</b></a>` : '<span></span>') +
    `<a class="gm-pager-btn gm-pager-home" href="china.html">↩ 回中国地图</a>` +
    (next ? `<a class="gm-pager-btn" href="province.html?adcode=${esc(next.adcode)}"><small>下一站</small><b>${esc(next.name)}</b></a>` : '<span></span>') +
    `</nav>` +

    `<details class="gm-all-stations">` +
    `<summary>📋 全部省域站（点开直达任意一站）</summary>` +
    `<div class="gm-station-grid">` +
    PROVINCES.map((x) => S.stationCard(x, (regionMap[x.region] || {}).color || '#8a7a55')).join('') +
    `</div></details>`;

  /* ---------- 迷你地图：本省高亮，其余省份可点击跳站 ---------- */
  const mapSvg = $('gm-prov-svg');
  mapSvg.setAttribute('viewBox', `0 0 ${S.W} ${S.H.toFixed(0)}`);
  mapSvg.innerHTML = S.mapPrelude() +
    S.provincePathsSVG((pp) => (pp.adcode === p.adcode ? '#e26d3c' : '#eae3cf'), { interactive: true }) +
    `<path d="${S.provD.get(p.adcode)}" fill="none" stroke="#c95a2e" stroke-width="3" stroke-linejoin="round"/>` +
    S.insetSVG() + S.compass();

  const gotoStation = (id) => {
    const target = id.slice(1);
    if (target && target !== p.adcode) location.href = `province.html?adcode=${target}`;
  };
  mapSvg.addEventListener('click', (e) => {
    const el = e.target.closest('[data-id]');
    if (el) gotoStation(el.dataset.id);
  });
  mapSvg.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target.closest('[data-id]');
    if (el) { e.preventDefault(); gotoStation(el.dataset.id); }
  });
})();

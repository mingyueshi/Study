/* 世界地图页：投影、三层渲染（七大洲 / 世界地标 / 中国与世界）、档案卡与找一找。
   国家几何来自 world-geo.js（脚本生成）；条目与国家映射来自 world-data.js；
   路径、图层交互与找一找复用共享模块。 */
(() => {
  'use strict';
  const root = document.querySelector('.world-topic');
  if (!root) return;
  const $ = (id) => root.querySelector(`#${id}`);
  const S = window.GMShared;
  const esc = S.esc;
  const A = window.GMAtlas;

  const GEO = window.GEO_WORLD_GEO;
  const LAYERS = window.GM_WORLD_LAYERS || [];
  const CONTINENTS = window.GM_CONTINENTS || [];
  const OCEANS = window.GM_OCEANS || [];
  const FEATURES = window.GM_WORLD_FEATURES || [];
  const META = window.GM_COUNTRY_META || {};
  const MAJOR = window.GM_MAJOR_LABELS || [];
  const CHINA_CARD = window.GM_CHINA_CARD || { facts: [] };
  const POOL = window.GM_WORLD_POOL || [];
  const TEASERS = window.GM_WORLD_TEASERS || [];

  const svg = $('gm-svg');
  if (!svg || !GEO || !GEO.countries || !LAYERS.length) {
    const target = $('gm-map-note');
    if (target) target.textContent = '数据文件尚未完整加载。请确认已保存整个目录，并重新打开页面。';
    return;
  }

  const { W, H, m: mp, ringPath, countries, paths, gridSVG } = S.worldMap();
  const continentColor = Object.fromEntries(CONTINENTS.map((r) => [r.id, r.color]));
  const continentName = Object.fromEntries(CONTINENTS.map((r) => [r.id, r.name]));
  const continentHint = Object.fromEntries(CONTINENTS.map((r) => [r.id, r.hint]));
  const zhOf = (name) => (META[name] || [])[0] || name;
  const continentOf = (name) => (META[name] || [])[1];
  const KIND_CN = { mountain: '山脉', peak: '山峰', river: '大河', desert: '沙漠', plateau: '高原', trench: '海沟', reef: '珊瑚礁', island: '岛屿' };
  const KIND_ICON = { mountain: '⛰️', peak: '🗻', river: '🛶', desert: '🏜️', plateau: '🌄', trench: '🕳️', reef: '🐠', island: '🏝️' };
  const KIND_COLOR = { mountain: '#7c5a40', peak: '#8a6fae', river: '#3b82c4', desert: '#c98a4b', plateau: '#5f8f45', trench: '#2e5f8e', reef: '#3aaf9f', island: '#3a8f7a' };

  /* ---------- 渲染 ---------- */
  const oceanSVG = () => OCEANS.map((o) => {
    const p = mp(o.point[0], o.point[1]);
    return `<g data-id="${o.id}" tabindex="0" role="button" aria-label="${esc(o.name)}">` +
      `<circle class="gm-hit" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="26"/>` +
      `<text class="gm-ocean-label" x="${p[0].toFixed(1)}" y="${p[1].toFixed(1)}" text-anchor="middle">${esc(o.name)}</text></g>`;
  }).join('');

  const countryPaths = () => countries.map(c => {
    const name = c.name;
    const isChina = name === 'China' || name === 'Taiwan';
    const color = continentColor[continentOf(name)] || '#d9d2b8';
    return `<path class="gm-country${isChina ? ' gm-country--china' : ''}" data-id="${esc(name)}" tabindex="0" role="button" ` +
      `aria-label="${esc(zhOf(name))}" style="--continent:${color}" fill-rule="evenodd" d="${paths.get(name)}"/>`;
  }).join('');

  const majorLabels = () => MAJOR.map((m) => {
    const at = mp(m.at[0], m.at[1]);
    const isChina = m.name === 'China';
    const cls = isChina ? ' gm-cn-label' : '';
    return `<text class="gm-major-label${cls}" x="${at[0].toFixed(1)}" y="${at[1].toFixed(1)}" text-anchor="middle">${esc(zhOf(m.name))}</text>`;
  }).join('');

  const featureSVG = () => FEATURES.map((f) => {
    const color = KIND_COLOR[f.kind] || '#666';
    if (f.line) {
      const d = ringPath(f.line).slice(0, -1);
      const at = S.midOf(f.line);
      const lp = mp(at[0], at[1]);
      return `<g data-id="${f.id}" tabindex="0" role="button" aria-label="${esc(f.name)}">` +
        `<path class="gm-river-hit" d="${d}"/>` +
        `<path class="gm-river" d="${d}" stroke="${color}"/>` +
        `<text class="gm-mark-label" x="${lp[0].toFixed(1)}" y="${(lp[1] - 9).toFixed(1)}" text-anchor="middle" fill="${color}">${esc(f.name)}</text></g>`;
    }
    const p = mp(f.point[0], f.point[1]);
    return `<g data-id="${f.id}" tabindex="0" role="button" aria-label="${esc(f.name)}">` +
      `<circle class="gm-hit" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="16"/>` +
      `<circle class="gm-mark" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="9" stroke="${color}"/>` +
      `<text class="gm-mark-icon" x="${p[0].toFixed(1)}" y="${(p[1] + 3.8).toFixed(1)}" text-anchor="middle">${KIND_ICON[f.kind] || '📍'}</text>` +
      `<text class="gm-mark-label" x="${p[0].toFixed(1)}" y="${(p[1] + 22).toFixed(1)}" text-anchor="middle" fill="${color}">${esc(f.name)}</text></g>`;
  }).join('');

  svg.setAttribute('viewBox', `0 0 ${W} ${H.toFixed(0)}`);
  svg.innerHTML =
    `<rect x="0" y="0" width="${W}" height="${H.toFixed(0)}" class="gm-sea"/>` +
    gridSVG() + countryPaths() +
    `<g class="gm-major-labels">${majorLabels()}</g>` +
    `<g data-g="extreme">${featureSVG()}</g>` +
    oceanSVG() + S.compass();

  /* ---------- 档案卡 ---------- */
  const badge = (text, color) => `<span class="gm-badge" style="--badge:${esc(color)}">${esc(text)}</span>`;
  const row = (label, value) => `<div class="gm-row"><span class="gm-row-label">${esc(label)}</span><span class="gm-row-value">${esc(value)}</span></div>`;
  const list = (items) => items.map((f) => `<p class="gm-card-text">${esc(f)}</p>`).join('');

  function openCard(id) {
    const place = A.get(id);
    const card = $('gm-card');
    if (place.category === 'ocean') {
      const o = place;
      card.innerHTML =
        `<p class="gm-card-eyebrow">大洋</p>` +
        `<h2 class="gm-card-title"><span aria-hidden="true">🌊</span>${esc(o.name)}</h2>` +
        `<div class="gm-chips">${badge('大洋', '#2e6f9e')}</div>` +
        row('在哪里', o.where) +
        `<p class="gm-card-text">${esc(o.note)}</p>` +
        `<p class="gm-card-foot">通行口径讲四大洋：太平洋、大西洋、印度洋、北冰洋。</p>`;
    } else if (place.category === 'world-feature') {
      const f = place;
      card.innerHTML =
        `<p class="gm-card-eyebrow">世界地标 · ${esc(KIND_CN[f.kind] || '')}</p>` +
        `<h2 class="gm-card-title"><span aria-hidden="true">${KIND_ICON[f.kind] || '📍'}</span>${esc(f.name)}</h2>` +
        `<div class="gm-chips">${badge(KIND_CN[f.kind] || '', KIND_COLOR[f.kind])}</div>` +
        row('在哪里', f.where) +
        `<p class="gm-card-text">${esc(f.note)}</p>`;
    } else if (place.category === 'country') {
      const name = id;
      const zh = zhOf(name);
      const cont = continentOf(name);
      const isChinaHome = root.dataset.layer === 'home' && (name === 'China' || name === 'Taiwan');
      if (isChinaHome) {
        card.innerHTML =
          `<p class="gm-card-eyebrow">中国与世界</p>` +
          `<h2 class="gm-card-title"><span aria-hidden="true">🇨🇳</span>中国</h2>` +
          `<div class="gm-chips">${badge('亚洲东部', '#f0c75e')}${badge('面积世界第三', '#b04a3a')}</div>` +
          list(CHINA_CARD.facts) +
          `<a class="gm-card-link" href="china.html#map">去中国地图细看 →</a>`;
      } else {
        card.innerHTML =
          `<p class="gm-card-eyebrow">国家与地区</p>` +
          `<h2 class="gm-card-title">${esc(zh)}</h2>` +
          `<div class="gm-chips">${badge(name, '#8a7a55')}${badge(continentName[cont] || '', continentColor[cont])}</div>` +
          row('属于', continentName[cont] || '') +
          (continentHint[cont] ? `<p class="gm-card-text">${esc(continentHint[cont])}</p>` : '') +
          `<p class="gm-card-foot">英文名「${esc(name)}」就是它在世界地图集里的通行写法。</p>`;
      }
    }
    card.classList.remove('gm-card--blank');
  }

  const hintFor = (id) => {
    const p = A.get(id);
    return p.category === 'country' ? `它属于${p.context}` : `看看${p.where}一带`;
  };
  window.GMMapUI.mount({
    root, svg, map: 'world', layers: LAYERS, pool: POOL, openCard, hintFor,
    legends: {
      continent: CONTINENTS,
      extreme: [{ name: '地标', color: '#fffdf5' }, { name: '河流', color: KIND_COLOR.river }],
      home: [{ name: '中国', color: '#e2a13c' }]
    }
  });

  /* ---------- 静态区块 ---------- */
  $('stat-continents').textContent = CONTINENTS.length;
  $('stat-oceans').textContent = OCEANS.length;
  $('stat-worlds').textContent = FEATURES.length;
  $('stat-countries').textContent = countries.length;

  $('gm-teasers').innerHTML = TEASERS.map((t) =>
    `<article class="gm-teaser">` +
    `<div class="gm-teaser-cols"><a class="gm-teaser-china" href="${esc(A.mapHref(A.get(t.places[0])))}">${esc(t.chinaLabel)}</a>` +
    `<span class="gm-teaser-vs">与</span><a class="gm-teaser-world" href="${esc(A.mapHref(A.get(t.places[1])))}">${esc(t.worldLabel)}</a></div>` +
    `<p>${esc(t.note)}</p></article>`).join('');
})();

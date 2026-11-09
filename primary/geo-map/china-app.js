/* 中国地图主页：投影渲染、图层切换、档案卡与找一找游戏。
   地图基座与投影来自 shared.js；数据来自 content.js 与 map-data.js。 */
(() => {
  'use strict';
  const root = document.querySelector('.china-topic');
  if (!root) return;
  const $ = (id) => root.querySelector(`#${id}`);
  const S = window.GMShared;
  const esc = S.esc;
  const A = window.GMAtlas;

  const LAYERS = window.GM_LAYERS || [];
  const REGIONS = window.GM_REGIONS || [];
  const STEPS = window.GM_STEPS || [];
  const STEP_LINES = window.GM_STEP_LINES || [];
  const PROVINCES = window.GM_PROVINCES || [];
  const FEATURES = window.GM_FEATURES || [];
  const NEIGHBORS = window.GM_NEIGHBORS || [];
  const CAPITAL = window.GM_CAPITAL || null;
  const RHYMES = window.GM_RHYMES || [];
  const POOL = window.GM_FIND_POOL || [];

  const svg = $('gm-svg');
  if (!svg || !S.provD.size || !LAYERS.length) {
    const target = $('gm-map-note');
    if (target) target.textContent = '数据文件尚未完整加载。请确认已保存整个目录，并重新打开页面。';
    return;
  }

  const regionColor = Object.fromEntries(REGIONS.map((r) => [r.id, r.color]));
  const SIDE_CN = { north: '北', northeast: '东北', northwest: '西北', west: '西', southwest: '西南', south: '南', sea: '海上' };

  /* 标签位置微调：避开省份名与相邻标记的重叠。 */
  const RIVER_LABEL_AT = {
    f20: [110.5, 31.9], f21: [103.9, 36.4],
    f42: [115.2, 32.4], f43: [117.8, 34.6]
  };
  const MARK_OFF = { f31: { dx: -18, dy: 20 }, f32: { dx: 20, dy: -12 } };
  const PROV_LABEL_AT = {
    p120000: [118.3, 38.6], p130000: [114.8, 38.2],
    p320000: [119.3, 32.5], p430000: [113.4, 28.2],
    p710000: [121.1, 24.8], p460000: [110.3, 19.8]
  };
  const PROV_LABEL_SKIP = { p110000: true };   // 北京由首都星标的「首都北京」标注
  const PROV_LABEL_SKIP_AREA = 0.4;   // 行政区外接框过小的不放名字（如港澳），靠点击认识

  /* ---------- 渲染 ---------- */
  const provLabels = () => PROVINCES
    .filter((p) => S.provLabel.has(p.id) && !PROV_LABEL_SKIP[p.id] && S.provLabel.get(p.id)[2] >= PROV_LABEL_SKIP_AREA)
    .map((p) => {
      const at = PROV_LABEL_AT[p.id] || S.provLabel.get(p.id);
      return `<text class="gm-prov-label" x="${S.MX(at[0]).toFixed(1)}" y="${S.MY(at[1]).toFixed(1)}" text-anchor="middle">${esc(S.displayName(p.name))}</text>`;
    }).join('');

  const stepShade = () => {
    const l12 = (STEP_LINES.find((l) => l.id === 'line12') || {}).line || [];
    const l23 = (STEP_LINES.find((l) => l.id === 'line23') || {}).line || [];
    if (!l12.length || !l23.length || STEPS.length < 3) return '';
    return `<g clip-path="url(#gm-clip-china)">` +
      `<rect x="0" y="0" width="${S.W}" height="${S.H.toFixed(0)}" fill="${STEPS[1].color}" opacity="0.55"/>` +
      `<path d="${S.ringPath([...l12, [73, 25.2], [73, 55]])}" fill="${STEPS[0].color}" opacity="0.55"/>` +
      `<path d="${S.ringPath([...l23, [110.2, 17.8], [135, 17.8], [135, 53.8]])}" fill="${STEPS[2].color}" opacity="0.55"/>` +
      `</g>` +
      `<path d="${S.lineD(l12)}" class="gm-boundary"/>` +
      `<path d="${S.lineD(l23)}" class="gm-boundary"/>` +
      STEPS.map((s, i) => {
        const at = [[80, 35.8], [103.5, 41.2], [121.5, 42.8]][i];
        return `<text class="gm-step-label" x="${S.MX(at[0]).toFixed(1)}" y="${S.MY(at[1]).toFixed(1)}" text-anchor="middle">${esc(s.name)}</text>` +
          `<text class="gm-step-alt" x="${S.MX(at[0]).toFixed(1)}" y="${(S.MY(at[1]) + 15).toFixed(1)}" text-anchor="middle">${esc(s.altitude)}</text>`;
      }).join('');
  };

  const featureSVG = () => FEATURES.filter(f => f.id !== 'f28').map((f) => {
    const color = S.KIND_COLOR[f.kind] || '#666';
    if (f.kind === 'river') {
      const d = S.lineD(f.line);
      const at = RIVER_LABEL_AT[f.id] || S.midOf(f.line);
      return `<g data-id="${f.id}" tabindex="0" role="button" aria-label="${esc(f.name)}">` +
        `<path class="gm-river-hit" d="${d}"/>` +
        `<path class="gm-river" d="${d}" stroke="${color}"/>` +
        `<text class="gm-mark-label" x="${S.MX(at[0]).toFixed(1)}" y="${S.MY(at[1]).toFixed(1)}" text-anchor="middle" fill="${color}">${esc(f.name)}</text></g>`;
    }
    if (f.kind === 'mountain') {
      const d = S.lineD(f.line);
      const at = S.midOf(f.line);
      return `<g data-id="${f.id}" tabindex="0" role="button" aria-label="${esc(f.name)}">` +
        `<path class="gm-mtn-hit" d="${d}"/>` +
        `<path class="gm-mtn" d="${d}" stroke="${color}"/>` +
        `<text class="gm-mark-label" x="${S.MX(at[0]).toFixed(1)}" y="${(S.MY(at[1]) - 9).toFixed(1)}" text-anchor="middle" fill="${color}">${esc(f.name)}</text></g>`;
    }
    const p = S.m(f.point[0], f.point[1]);
    if (f.kind === 'sea') {
      return `<g data-id="${f.id}" tabindex="0" role="button" aria-label="${esc(f.name)}">` +
        `<circle class="gm-hit" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="18"/>` +
        `<text class="gm-sea-label" x="${p[0].toFixed(1)}" y="${p[1].toFixed(1)}" text-anchor="middle" fill="${color}">${esc(f.name)}</text></g>`;
    }
    const off = MARK_OFF[f.id] || { dx: 0, dy: 21 };
    return `<g data-id="${f.id}" tabindex="0" role="button" aria-label="${esc(f.name)}">` +
      `<circle class="gm-hit" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="14"/>` +
      `<circle class="gm-mark" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="9" stroke="${color}"/>` +
      `<text class="gm-mark-icon" x="${p[0].toFixed(1)}" y="${(p[1] + 3.8).toFixed(1)}" text-anchor="middle">${S.KIND_ICON[f.kind] || '📍'}</text>` +
      `<text class="gm-mark-label" x="${(p[0] + off.dx).toFixed(1)}" y="${(p[1] + off.dy).toFixed(1)}" text-anchor="middle" fill="${color}">${esc(f.name)}</text></g>`;
  }).join('');

  const chip = (n, at) => {
    const w = Math.round(n.name.length * 12.5 + 24);
    return `<g class="gm-chip" data-id="${n.id}" tabindex="0" role="button" aria-label="${esc(n.name)}（${esc(n.rel === 'sea' ? '隔海相望' : '陆上邻国')}）">` +
      `<rect x="${at[0] - w / 2}" y="${at[1] - 15}" width="${w}" height="30" rx="15"/>` +
      `<text x="${at[0]}" y="${at[1] + 5}" text-anchor="middle">${esc(n.name)}</text></g>`;
  };
  const CHIP_AT = {
    n1: [300, 26], n2: [520, 26], n3: [1020, 250],
    n4: [70, 150], n5: [70, 215], n6: [70, 280], n7: [70, 345], n8: [70, 410],
    n9: [70, 615], n10: [70, 480], n11: [70, 545],
    n12: [450, 645], n13: [500, 712], n14: [650, 706],
    n15: [1225, 300], n16: [1225, 360], n17: [1225, 420], n18: [1225, 480], n19: [1225, 540], n20: [1225, 602]
  };
  const neighborSVG = () => {
    const caption = `<text class="gm-sea-cap" x="1225" y="262" text-anchor="middle">隔海相望</text>`;
    const chips = NEIGHBORS.filter((n) => CHIP_AT[n.id]).map((n) => chip(n, CHIP_AT[n.id])).join('');
    return chips + caption;
  };

  const capitalSVG = () => {
    if (!CAPITAL) return '';
    const p = S.m(CAPITAL.lng, CAPITAL.lat);
    return `<g class="gm-capital" data-id="capital" tabindex="0" role="button" aria-label="首都北京星标">` +
      `<circle class="gm-hit" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="14"/>` +
      `<path transform="translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})" fill="#e2b23c" stroke="#a8791f" stroke-width="1" ` +
      `d="M 0,-10 L 2.9,-3.1 10,-3.1 4.3,1.2 6.5,8.1 0,3.9 -6.5,8.1 -4.3,1.2 -10,-3.1 -2.9,-3.1 Z"/>` +
      `<text class="gm-cap-label" x="${p[0].toFixed(1)}" y="${(p[1] + 24).toFixed(1)}" text-anchor="middle">首都${esc(CAPITAL.name)}</text></g>`;
  };

  const neutral = (fill) => S.provincePathsSVG(() => fill);
  const colored = () => S.provincePathsSVG((p) => regionColor[p.region] || '#d9d2b8', { interactive: true });

  svg.setAttribute('viewBox', `0 0 ${S.W} ${S.H.toFixed(0)}`);
  svg.innerHTML =
    S.clipDefs() + S.mapPrelude() +
    `<g data-g="province">${colored()}${provLabels()}${capitalSVG()}</g>` +
    `<g data-g="land">${neutral('#f3ecd9')}${stepShade()}${featureSVG()}</g>` +
    `<g data-g="neighbor">${neutral('#e3e7d2')}${neighborSVG()}${capitalSVG()}</g>` +
    S.insetSVG({ interactive: true }) + S.compass();

  /* ---------- 详情卡 ---------- */
  const badge = (text, color) => `<span class="gm-badge" style="--badge:${esc(color)}">${esc(text)}</span>`;
  const row = (label, value) => `<div class="gm-row"><span class="gm-row-label">${esc(label)}</span><span class="gm-row-value">${esc(value)}</span></div>`;

  function openCard(id) {
    const kind = id === 'capital' ? id : id[0];
    const card = $('gm-card');
    if (kind === 'p') {
      const p = A.get(id);
      if (!p) return;
      const r = REGIONS.find((x) => x.id === p.region) || {};
      const capLabel = p.type === '自治区' ? '首府' : '省会';
      card.innerHTML =
        `<p class="gm-card-eyebrow">省级行政区</p>` +
        `<h2 class="gm-card-title">${esc(p.name)}</h2>` +
        `<div class="gm-chips">${badge(`简称 ${p.short}`, r.color)}${badge(p.type, '#8a7a55')}${badge(r.name || '', r.color)}</div>` +
        row('在哪里', p.where) +
        (p.capital ? row(capLabel, p.capital) : '') +
        `<p class="gm-card-text">${esc(p.note)}</p>` +
        (r.hint ? `<p class="gm-card-foot">${esc(r.name)}：${esc(r.hint)}</p>` : '') +
        `<a class="gm-card-link" href="province.html?adcode=${esc(p.adcode)}">进省域站细看 →</a>`;
    } else if (kind === 'f') {
      const f = A.get(id);
      if (!f) return;
      card.innerHTML =
        `<p class="gm-card-eyebrow">山河大地 · ${esc(S.KIND_CN[f.kind] || '')}</p>` +
        `<h2 class="gm-card-title"><span aria-hidden="true">${S.KIND_ICON[f.kind] || '📍'}</span>${esc(f.name)}</h2>` +
        `<div class="gm-chips">${badge(S.KIND_CN[f.kind] || '', S.KIND_COLOR[f.kind])}</div>` +
        row('在哪里', f.where) +
        `<p class="gm-card-text">${esc(f.note)}</p>`;
    } else if (kind === 'n') {
      const n = A.get(id);
      if (!n) return;
      const rel = n.rel === 'sea' ? '隔海相望' : '陆上接壤';
      card.innerHTML =
        `<p class="gm-card-eyebrow">我们的邻居</p>` +
        `<h2 class="gm-card-title">${esc(n.name)}</h2>` +
        `<div class="gm-chips">${badge(rel, n.rel === 'sea' ? '#1f6f8b' : '#b07d3a')}${badge(`${SIDE_CN[n.side] || ''}方向`, '#8a7a55')}</div>` +
        `<p class="gm-card-text">${esc(n.note)}</p>` +
        `<p class="gm-card-foot">我国有 14 个陆上邻国和 6 个隔海相望的国家。${n.rel === 'sea' ? n.name + '与我国没有共同的陆地边界。' : ''}</p>`;
    } else if (kind === 'capital' && CAPITAL) {
      card.innerHTML =
        `<p class="gm-card-eyebrow">首都星标</p>` +
        `<h2 class="gm-card-title"><span aria-hidden="true">⭐</span>首都${esc(CAPITAL.name)}</h2>` +
        `<p class="gm-card-text">${esc(CAPITAL.text)}</p>`;
    }
    card.classList.remove('gm-card--blank');
  }

  const hintFor = (id) => {
    const p = A.get(id);
    if (p.category === 'neighbor') {
      return p.rel === 'sea' ? '在地图右侧找隔海相望的邻居' : `它在我国的${SIDE_CN[p.side]}方向`;
    }
    return `看看${p.where}一带`;
  };

  window.GMMapUI.mount({
    root, svg, map: 'china', layers: LAYERS, pool: POOL, openCard, hintFor,
    legends: {
      province: REGIONS,
      land: STEPS,
      neighbor: [{ name: '牌子按大致方位摆放', color: '#fff' }, { name: '右侧一列隔海相望', color: '#cfe3f0' }]
    }
  });

  /* ---------- 静态区块 ---------- */
  $('stat-provinces').textContent = PROVINCES.length;
  $('stat-features').textContent = FEATURES.length;
  $('stat-neighbors').textContent = NEIGHBORS.length;
  $('stat-rhymes').textContent = RHYMES.length;

  const RHYME_ACCENT = { r1: '#8a6fae', r2: '#b04a3a', r3: '#2e6f9e', r4: '#5f8f45', r5: '#b07d3a', r6: '#2e93a8', r7: '#3a8f7a' };
  $('gm-rhymes').innerHTML = RHYMES.map((r) =>
    `<article class="gm-rhyme" style="--accent:${esc(RHYME_ACCENT[r.id] || '#b07d3a')}">` +
    `<h3><span aria-hidden="true">${esc(r.icon)}</span>${esc(r.title)}</h3>` +
    r.lines.map((l) => `<p>${esc(l)}</p>`).join('') +
    `<p class="gm-rhyme-note">${esc(r.note)}</p></article>`).join('');
})();

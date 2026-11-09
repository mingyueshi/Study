/* 中国地图导览多页面共享工具：投影、地图基座 SVG 与通用渲染片段。
   各页面的 *-app.js 复用本文件，不复制地图绘制代码。 */
window.GMShared = (() => {
  'use strict';
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- 投影：等经距示意，纬向按中纬度拉伸 ---------- */
  const LNG0 = 73, LAT_TOP = 53.8, LAT_BOT = 17.8;
  const KX = 1000 / 63, KY = KX * 1.22;
  const OX = 140, OY = 40;               // 版图在画布中的偏移，四周留给邻居与南海小图
  const W = 1280, H = OY + (LAT_TOP - LAT_BOT) * KY + 0.5;
  const MX = (lng) => OX + (lng - LNG0) * KX;
  const MY = (lat) => OY + (LAT_TOP - lat) * KY;
  const m = (lng, lat) => [MX(lng), MY(lat)];

  /* 南海诸岛小图：右下角独立小比例尺。 */
  const IB = { x: 1010, y: 540, w: 150, h: 190 };
  const IX = (lng) => IB.x + 4 + (lng - 105.5) * 7.6;
  const IY = (lat) => IB.y + 26 + (25.4 - lat) * 7.25;

  const SHORTEN = [[/壮族自治区$/, ''], [/回族自治区$/, ''], [/维吾尔自治区$/, ''], [/自治区$/, ''], [/特别行政区$/, ''], [/省$/, ''], [/市$/, '']];
  const displayName = (name) => { for (const [re, rep] of SHORTEN) if (re.test(name)) return name.replace(re, rep); return name; };

  const KIND_CN = { mountain: '山脉', plateau: '高原', plain: '平原', basin: '盆地', river: '大河', lake: '湖泊', sea: '海域', island: '岛屿' };
  const KIND_ICON = { mountain: '⛰️', plateau: '🏔️', plain: '🌾', basin: '🏺', river: '🛶', lake: '💧', sea: '🌊', island: '🏝️' };
  const KIND_COLOR = { mountain: '#7c5a40', plateau: '#8a6fae', plain: '#5f8f45', basin: '#a3683c', river: '#3b82c4', lake: '#3b9ec4', sea: '#2e6f9e', island: '#3a8f7a' };

  const ringPath = (ring, map = m) => {
    let d = '';
    ring.forEach((pt, i) => { const p = map(pt[0], pt[1]); d += (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); });
    return d + 'Z';
  };
  const lineD = (line) => ringPath(line, m).replace(/Z$/, '');
  const midOf = (line) => line[Math.floor((line.length - 1) / 2)];

  /* 跨日期变更线的环沿连续经度绘制，在另一侧画平移副本。SVG 视窗裁掉图外部分。 */
  function wrapRing(ring) {
    let previous = ring[0][0];
    const continuous = ring.map(([lng, lat]) => {
      previous = lng + 360 * Math.round((previous - lng) / 360);
      return [previous, lat];
    });
    const copies = [continuous];
    if (continuous.some(([lng]) => lng > 180)) copies.push(continuous.map(([lng, lat]) => [lng - 360, lat]));
    if (continuous.some(([lng]) => lng < -180)) copies.push(continuous.map(([lng, lat]) => [lng + 360, lat]));
    return copies;
  }

  /* 世界底图：等经距投影，南极洲截至南纬 73°。 */
  function worldMap() {
    const LNG0 = -180, LAT_TOP = 87, LAT_BOT = -73;
    const K = 1280 / 360;
    const W = 1280, H = (LAT_TOP - LAT_BOT) * K;
    const WX = (lng) => (lng - LNG0) * K;
    const WY = (lat) => (LAT_TOP - lat) * K;
    const m = (lng, lat) => [WX(lng), WY(lat)];

    const worldRingPath = (ring) => ringPath(ring, m);
    const countries = window.GEO_WORLD_GEO.countries;
    const paths = new Map(countries.map(c => {
      // 南极洲已经裁到图底，底边应在两端之间闭合。
      const rings = c.name === 'Antarctica' ? c.rings : c.rings.flatMap(wrapRing);
      return [c.name, rings.map(worldRingPath).join('')];
    }));

    const gridSVG = () => {
      let out = '';
      for (let lng = -150; lng <= 180; lng += 30) {
        out += `<line x1="${WX(lng).toFixed(1)}" y1="${WY(LAT_TOP).toFixed(1)}" x2="${WX(lng).toFixed(1)}" y2="${WY(LAT_BOT).toFixed(1)}"/>`;
        if (lng !== -180 && lng !== 180) {
          out += `<text class="gm-grid-label gm-longitude-label" x="${WX(lng).toFixed(1)}" y="${(H - 6).toFixed(1)}" text-anchor="middle">${Math.abs(lng)}°${lng < 0 ? 'W' : 'E'}</text>`;
        }
      }
      for (let lat = -60; lat <= 60; lat += 30) {
        out += `<line x1="0" y1="${WY(lat).toFixed(1)}" x2="${W.toFixed(1)}" y2="${WY(lat).toFixed(1)}"/>`;
        if (lat !== 0) {
          out += `<text class="gm-grid-label" x="6" y="${(WY(lat) - 5).toFixed(1)}">${Math.abs(lat)}°${lat < 0 ? 'S' : 'N'}</text>`;
        } else {
          out += `<line class="gm-equator" x1="0" y1="${WY(0).toFixed(1)}" x2="${W.toFixed(1)}" y2="${WY(0).toFixed(1)}"/>`;
          out += `<text class="gm-equator-label" x="${(WX(90)).toFixed(1)}" y="${(WY(0) - 6).toFixed(1)}" text-anchor="middle">赤道 0°</text>`;
        }
      }
      return `<g class="gm-grid">${out}</g>`;
    };
    return { W, H, m, ringPath: worldRingPath, countries, paths, gridSVG };
  }

  /* 省份路径与外接框中心：数据来自 china-geo.js 与 map-data.js（须先于本文件加载）。 */
  const GEO = window.GEO_CHINA_GEO;
  const provD = new Map();      // adcode -> path d
  const provLabel = new Map();  // id -> [中心经度, 中心纬度, 外接框面积]
  if (GEO && GEO.provinces) {
    (window.GM_PROVINCES || []).forEach((p) => {
      const rings = GEO.provinces[p.adcode];
      if (!rings) return;
      provD.set(p.adcode, rings.map((r) => ringPath(r)).join(''));
      let best = null, bestArea = -1;
      for (const ring of rings) {
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
        for (const pt of ring) { if (pt[0] < x0) x0 = pt[0]; if (pt[0] > x1) x1 = pt[0]; if (pt[1] < y0) y0 = pt[1]; if (pt[1] > y1) y1 = pt[1]; }
        const area = (x1 - x0) * (y1 - y0);
        if (area > bestArea) { bestArea = area; best = [(x0 + x1) / 2, (y0 + y1) / 2, area]; }
      }
      if (best) provLabel.set(p.id, best);
    });
  }

  const clipDefs = () => '<defs><clipPath id="gm-clip-china">' +
    [...provD.values()].map((d) => `<path clip-rule="evenodd" d="${d}"/>`).join('') +
    '</clipPath></defs>';

  /* ---------- 地图基座：海域与经纬网 / 省份路径 / 南海小图与指北针 ---------- */
  const mapPrelude = () => {
    let grid = '';
    for (let lng = 80; lng <= 130; lng += 10) {
      grid += `<line x1="${MX(lng).toFixed(1)}" y1="${MY(LAT_TOP).toFixed(1)}" x2="${MX(lng).toFixed(1)}" y2="${MY(LAT_BOT).toFixed(1)}"/>`;
      grid += `<text class="gm-grid-label" x="${MX(lng).toFixed(1)}" y="${(MY(LAT_BOT) + 16).toFixed(1)}" text-anchor="middle">${lng}°E</text>`;
    }
    for (let lat = 20; lat <= 50; lat += 10) {
      grid += `<line x1="${MX(LNG0).toFixed(1)}" y1="${MY(lat).toFixed(1)}" x2="${MX(136).toFixed(1)}" y2="${MY(lat).toFixed(1)}"/>`;
      grid += `<text class="gm-grid-label" x="${(MX(LNG0) - 12).toFixed(1)}" y="${(MY(lat) + 3).toFixed(1)}" text-anchor="end">${lat}°N</text>`;
    }
    return `<rect x="0" y="0" width="${W}" height="${H.toFixed(0)}" class="gm-sea"/><g class="gm-grid">${grid}</g>`;
  };

  const provincePathsSVG = (fillFor, { interactive = false } = {}) =>
    (window.GM_PROVINCES || [])
      .filter((p) => provD.has(p.adcode))
      .map((p) => {
        const hit = interactive
          ? ' data-id="' + esc(p.id) + '" tabindex="0" role="button" aria-label="' + esc(p.name) + '"'
          : ' aria-label="' + esc(p.name) + '"';
        return `<path class="${interactive ? 'gm-prov' : 'gm-neutral'}"${hit} fill="${fillFor(p)}" fill-rule="evenodd" d="${provD.get(p.adcode)}"/>`;
      }).join('');

  const insetSVG = ({ interactive = false } = {}) => {
    const islands = (GEO && GEO.southSeaIslands || []).map((ring) => {
      let sx = 0, sy = 0;
      ring.forEach((pt) => { sx += IX(pt[0]); sy += IY(pt[1]); });
      return `<circle class="gm-islet" cx="${(sx / ring.length).toFixed(1)}" cy="${(sy / ring.length).toFixed(1)}" r="1.8"/>`;
    }).join('');
    const dashes = (GEO && GEO.seaDash || []).map((ring) =>
      `<path class="gm-dash" d="${ringPath(ring, (lng, lat) => [IX(lng), IY(lat)])}" fill="#7fa8c9" opacity="0.85"/>`).join('');
    const sea = (window.GM_FEATURES || []).find((f) => f.id === 'f28');
    const seaLabel = sea
      ? `<text class="gm-sea-label" x="${IX(sea.point[0]).toFixed(1)}" y="${IY(sea.point[1]).toFixed(1)}" text-anchor="middle" fill="#2e6f9e">${esc(sea.name)}</text>`
      : '';
    const seaMark = interactive && sea
      ? `<g data-g="land" data-id="${sea.id}" tabindex="0" role="button" aria-label="${esc(sea.name)}">` +
        `<circle class="gm-hit" cx="${IX(sea.point[0]).toFixed(1)}" cy="${IY(sea.point[1]).toFixed(1)}" r="19"/>` + seaLabel + '</g>'
      : seaLabel;
    return `<g class="gm-inset">` +
      `<rect x="${IB.x}" y="${IB.y}" width="${IB.w}" height="${IB.h}" rx="10" class="gm-inset-frame"/>` +
      `<text class="gm-inset-title" x="${IB.x + 10}" y="${IB.y + 17}">南海诸岛</text>` +
      `<g class="gm-inset-body">` + islands + dashes +
      seaMark +
      `</g></g>`;
  };

  const compass = () => `<g class="gm-compass" transform="translate(1240 44)">` +
    `<path d="M 0 12 L 0 -12 M -7 -4 L 0 -14 L 7 -4" fill="none"/>` +
    `<text x="0" y="30" text-anchor="middle">北</text></g>`;

  /* 省域站卡片：门户格子和无效参数回退列表共用。 */
  const stationCard = (p, color) =>
    `<a class="gm-station" href="province.html?adcode=${esc(p.adcode)}" style="--region:${esc(color)}">` +
    `<b>${esc(p.name)}</b><small>简称${esc(p.short)}${p.capital ? ' · ' + esc(p.capital) : ''}</small>` +
    `<span class="gm-station-go" aria-hidden="true">进站 →</span></a>`;

  return {
    esc, W, H, MX, MY, m, ringPath, lineD, midOf, wrapRing, worldMap,
    KIND_CN, KIND_ICON, KIND_COLOR, displayName,
    provD, provLabel, clipDefs, mapPrelude, provincePathsSVG, insetSVG, compass, stationCard
  };
})();

/* ============================================================
   乐学堂 · 天文图示库（天文探索专属）
   - 纯 SVG 插图，离线可用，打印友好
   - 互动演示（行星档案 / 月相变化）事件用委托绑定，
     页面重渲染后无需重新挂载
   - 数据里用 fig: 'astro-xxx' / 'demo-astro-xxx' 引用
   ============================================================ */
'use strict';

const AstroFigures = (() => {
  const INK = '#34384d';
  const MUT = '#73788b';
  const LINE = '#dfe5f0';
  const SUN = '#f6b93b';
  const EARTH_BLUE = '#3d7fd9';
  const MOON_GRAY = '#9aa0a8';
  const PURPLE = '#8b65c9';

  /* ---------- 小工具 ---------- */
  const txt = (x, y, s, opt) => {
    opt = opt || {};
    return `<text x="${x}" y="${y}" fill="${opt.fill || INK}" font-size="${opt.fs || 14}"` +
      ` font-weight="${opt.fw || 700}" text-anchor="${opt.anchor || 'middle'}"` +
      (opt.cls ? ` class="${opt.cls}"` : '') + `>${s}</text>`;
  };
  const arrow = (x1, y1, x2, y2, color) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color || PURPLE}" stroke-width="2.5" marker-end="url(#afig-arrow)"/>`;
  const starDots = (list) => list.map(p =>
    `<circle cx="${p[0]}" cy="${p[1]}" r="${p[2] || 1.6}" fill="#c9c2f2" opacity="0.9"/>`).join('');
  const rays = (cx, cy, r1, r2, color, step) => {
    let s = '';
    for (let a = 0; a < 360; a += (step || 30)) {
      const rad = a * Math.PI / 180;
      s += `<line x1="${(cx + r1 * Math.cos(rad)).toFixed(1)}" y1="${(cy + r1 * Math.sin(rad)).toFixed(1)}" x2="${(cx + r2 * Math.cos(rad)).toFixed(1)}" y2="${(cy + r2 * Math.sin(rad)).toFixed(1)}" stroke="${color}" stroke-width="2.5"/>`;
    }
    return s;
  };
  const DEFS = `<defs><marker id="afig-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${PURPLE}"/></marker></defs>`;

  /* ================= 静态图示 ================= */

  /* 太阳的数字档案 */
  const sunFacts = () => {
    const cx = 110, cy = 88, R = 52;
    let s = `<svg class="fig-svg" viewBox="0 0 640 186">`;
    s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#fdd77a" stroke="${SUN}" stroke-width="2.5"/>`;
    s += rays(cx, cy, R + 4, R + 13, SUN, 24);
    s += `<circle cx="${cx}" cy="${cy}" r="24" fill="#f8b84e" stroke="#e2943a" stroke-width="1.6"/>`;
    s += txt(cx, cy - 3, '核心', { fs: 10.5, fill: '#8a5a12' });
    s += txt(cx, cy + 13, '1500万℃', { fs: 10.5, fill: '#8a5a12' });
    s += txt(cx, cy + R + 26, '表面约 5500℃', { fill: '#c98a12', fs: 13 });
    /* 右侧数字 */
    s += txt(292, 44, '直径约 139 万千米', { anchor: 'start', fs: 15 });
    s += txt(292, 68, '≈ 109 个地球排成一排', { anchor: 'start', fs: 13, fill: MUT });
    s += txt(292, 92, '质量占整个太阳系 99.8% 以上', { anchor: 'start', fs: 13, fill: MUT });
    s += txt(292, 116, '一颗自己发光发热的恒星', { anchor: 'start', fs: 13, fill: '#c98a12' });
    /* 光跑到地球 */
    s += arrow(178, 146, 540, 146, '#e2943a');
    s += txt(360, 136, '阳光跑过来约 8 分 20 秒', { fill: '#c98a12', fs: 13 });
    s += `<circle cx="562" cy="146" r="14" fill="${EARTH_BLUE}" stroke="${INK}" stroke-width="1.5"/>`;
    s += txt(562, 176, '地球', { fs: 12, fill: MUT });
    return s + '</svg>';
  };

  /* 八大行星直径排行 */
  const planetBars = () => {
    const rows = [
      ['木星', 139800, '#d9a86c'], ['土星', 116460, '#e0c48f'], ['天王星', 50720, '#9fd8e0'],
      ['海王星', 49240, '#4a6fd9'], ['地球', 12742, '#3d7fd9'], ['金星', 12104, '#e8c46a'],
      ['火星', 6779, '#d0654a'], ['水星', 4879, '#9aa0a8'],
    ];
    let s = `<svg class="fig-svg" viewBox="0 0 640 214">`;
    s += txt(320, 16, '八大行星直径排行（千米）', { fs: 14 });
    rows.forEach((r, i) => {
      const y = 28 + i * 19;
      const w = Math.max(r[1] / 139800 * 380, 12);
      const hot = i === 4;
      s += txt(62, y + 11, r[0], { anchor: 'end', fs: 13, fill: hot ? '#3d7fd9' : INK, fw: hot ? 900 : 700 });
      s += `<rect x="70" y="${y}" width="${w.toFixed(1)}" height="13" rx="6" fill="${r[2]}${hot ? '' : 'cc'}"/>`;
      s += txt(78 + w, y + 11, r[1], { anchor: 'start', fs: 11.5, fill: MUT });
    });
    s += txt(320, 206, '木星能装下 1300 多个地球；地球在行星里只排第五', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 小行星带位置示意 */
  const asteroidBelt = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 132">`;
    /* 太阳 */
    s += `<circle cx="44" cy="76" r="30" fill="${SUN}"/>`;
    s += rays(44, 76, 32, 40, SUN, 45);
    s += txt(44, 126, '太阳', { fill: '#c98a12', fs: 12.5 });
    /* 轨道线 */
    s += `<line x1="80" y1="76" x2="612" y2="76" stroke="${LINE}" stroke-width="2"/>`;
    /* 小行星带 */
    s += `<rect x="310" y="64" width="92" height="24" rx="12" fill="#b5893a26"/>`;
    for (let i = 0; i < 34; i++) {
      const x = 314 + ((i * 29) % 86);
      const y = 67 + ((i * 17) % 18);
      s += `<circle cx="${x}" cy="${y}" r="1.7" fill="#a5713c"/>`;
    }
    s += txt(356, 44, '小行星带', { fill: '#a5713c', fs: 13.5 });
    s += arrow(356, 50, 356, 62, '#a5713c');
    /* 行星 */
    const dots = [
      ['水星', 110, 6, '#9aa0a8'], ['金星', 165, 9, '#e8c46a'], ['地球', 220, 10, EARTH_BLUE],
      ['火星', 275, 7, '#d0654a'], ['木星', 430, 15, '#d9a86c'], ['土星', 487, 13, '#e0c48f'],
      ['天王星', 544, 10, '#9fd8e0'], ['海王星', 596, 10, '#4a6fd9'],
    ];
    dots.forEach((d, i) => {
      const above = i % 2 === 0;
      s += `<circle cx="${d[1]}" cy="76" r="${d[2]}" fill="${d[3]}"/>`;
      s += txt(d[1], above ? 100 : 108, d[0], { fs: 12, fill: d[0] === '地球' ? '#3d7fd9' : MUT, fw: d[0] === '地球' ? 900 : 700 });
    });
    s += txt(220, 122, '（我们在这里）', { fs: 10.5, fill: '#3d7fd9' });
    return s + '</svg>';
  };

  /* 月球数字档案 */
  const moonFacts = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 178">`;
    /* 地球 */
    s += `<circle cx="92" cy="84" r="34" fill="${EARTH_BLUE}" stroke="${INK}" stroke-width="2"/>`;
    s += `<path d="M 74 66 Q 88 60 98 72 Q 90 84 76 80 Z" fill="#7ba05b"/>`;
    s += `<path d="M 100 96 Q 112 92 116 102 Q 108 110 98 106 Z" fill="#7ba05b"/>`;
    s += txt(92, 140, '地球', { fs: 12.5, fill: MUT });
    /* 月球 */
    s += `<circle cx="238" cy="84" r="14" fill="#d9dbe6" stroke="${MOON_GRAY}" stroke-width="2"/>`;
    s += `<circle cx="233" cy="80" r="3" fill="${MOON_GRAY}"/><circle cx="243" cy="88" r="2.2" fill="${MOON_GRAY}"/>`;
    s += txt(238, 140, '月球', { fs: 12.5, fill: MUT });
    s += arrow(132, 84, 218, 84, '#6b7fb3');
    s += txt(176, 72, '约 38 万千米', { fill: '#6b7fb3', fs: 13 });
    s += txt(176, 122, '高铁不停跑也要 50 多天', { fs: 11.5, fill: MUT });
    /* 右侧数字 */
    s += txt(340, 48, '月球直径约 3476 千米', { anchor: 'start', fs: 15 });
    s += txt(340, 72, '≈ 地球的四分之一', { anchor: 'start', fs: 13, fill: MUT });
    s += txt(340, 100, '月球引力 ≈ 地球的六分之一', { anchor: 'start', fs: 13, fill: MUT });
    s += txt(340, 128, '没有空气，也没有液态水', { anchor: 'start', fs: 13, fill: MUT });
    s += txt(340, 156, '月光是月球反射的太阳光', { anchor: 'start', fs: 13, fill: '#c98a12' });
    return s + '</svg>';
  };

  /* 日食与月食 */
  const eclipse = () => {
    const interactive = typeof window !== 'undefined' && window.AstroObservation?.html('eclipse');
    if (interactive) return interactive;
    const sun = (cx, cy) =>
      `<circle cx="${cx}" cy="${cy}" r="26" fill="${SUN}"/>` + rays(cx, cy, 30, 38, SUN, 30);
    const earth = (cx, cy) =>
      `<circle cx="${cx}" cy="${cy}" r="20" fill="${EARTH_BLUE}" stroke="${INK}" stroke-width="1.8"/>`;
    const moon = (cx, cy) =>
      `<circle cx="${cx}" cy="${cy}" r="9" fill="#d9dbe6" stroke="${MOON_GRAY}" stroke-width="1.6"/>`;
    let s = `<svg class="fig-svg" viewBox="0 0 640 224">`;
    /* 日食行 */
    s += sun(90, 62) + moon(300, 62) + earth(470, 62);
    s += `<path d="M 300 55 L 470 47 L 470 77 L 300 69 Z" fill="#34384d22"/>`;
    s += txt(320, 18, '日食：月球在中间 · 农历初一 · 白天发生', { fill: '#e25563', fs: 13.5 });
    s += txt(90, 112, '太阳', { fs: 12, fill: MUT });
    s += txt(300, 92, '月球', { fs: 12, fill: MUT });
    s += txt(470, 100, '地球', { fs: 12, fill: MUT });
    /* 月食行 */
    s += sun(90, 168) + earth(330, 168) + moon(480, 168);
    s += `<path d="M 330 155 L 480 159 L 480 177 L 330 181 Z" fill="#34384d22"/>`;
    s += txt(320, 134, '月食：地球在中间 · 农历十五 · 夜里发生', { fill: '#e25563', fs: 13.5 });
    s += txt(90, 218, '太阳', { fs: 12, fill: MUT });
    s += txt(330, 204, '地球', { fs: 12, fill: MUT });
    s += txt(480, 204, '月球', { fs: 12, fill: MUT });
    s += txt(574, 150, '月全食时', { fs: 12, fill: '#a5713c', anchor: 'start' });
    s += txt(574, 168, '月亮变', { fs: 12, fill: '#a5713c', anchor: 'start' });
    s += txt(574, 186, '红月亮', { fs: 12, fill: '#a5713c', anchor: 'start' });
    return s + '</svg>';
  };

  /* 恒星的一生 */
  const starLife = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 214">`;
    const stage = (cx, cy, rx, ry, fill, stroke, label, sub) => {
      let g = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
      g += txt(cx, cy + 4, label, { fs: 13.5, fw: 900 });
      if (sub) g += txt(cx, cy + ry + 16, sub, { fs: 11, fill: MUT });
      return g;
    };
    /* 主线：星云 → 恒星 → 红巨星 → 白矮星 */
    s += stage(85, 62, 46, 27, '#8b65c926', PURPLE, '星云', '恒星的摇篮');
    s += stage(240, 62, 42, 25, '#f6b93b33', '#c98a12', '恒星', '稳定燃烧氢');
    s += stage(400, 62, 46, 28, '#e2556326', '#e25563', '红巨星', '膨胀变大变红');
    s += stage(556, 62, 40, 24, '#eef0f8', '#9aa0a8', '白矮星', '小恒星路线');
    s += arrow(136, 62, 192, 62); s += arrow(287, 62, 348, 62); s += arrow(451, 62, 510, 62);
    /* 分支：大质量恒星 → 超新星 → 中子星 / 黑洞 */
    s += arrow(400, 96, 400, 132, '#e25563');
    s += txt(412, 124, '大质量恒星', { anchor: 'start', fs: 11.5, fill: '#e25563' });
    s += stage(400, 158, 52, 22, '#e2556333', '#e25563', '超新星爆炸', '');
    s += arrow(458, 158, 512, 158, '#e25563');
    s += txt(566, 152, '中子星', { fs: 13, fw: 900 });
    s += txt(566, 172, '或黑洞', { fs: 13, fw: 900, fill: '#34384d' });
    s += txt(320, 206, '太阳的路线：恒星 → 红巨星 → 白矮星（约 50 亿年后）', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 光年 */
  const lightyear = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 196">`;
    /* 顶部：阳光 8 分钟 */
    s += `<circle cx="92" cy="64" r="20" fill="${SUN}"/>` + rays(92, 64, 23, 30, SUN, 30);
    s += arrow(120, 64, 148, 64, '#e2943a');
    s += `<circle cx="162" cy="64" r="10" fill="${EARTH_BLUE}" stroke="${INK}" stroke-width="1.5"/>`;
    s += txt(134, 42, '约 8 分 20 秒', { fill: '#c98a12', fs: 11.5 });
    s += txt(162, 94, '地球', { fs: 11.5, fill: MUT });
    /* 到比邻星 */
    s += `<line x1="180" y1="64" x2="432" y2="64" stroke="${PURPLE}" stroke-width="2.5" stroke-dasharray="7 5"/>`;
    s += `<circle cx="450" cy="64" r="11" fill="#e25563"/>` + rays(450, 64, 14, 20, '#e25563', 30);
    s += txt(310, 42, '约 4.2 光年', { fill: '#e25563', fs: 13 });
    s += txt(450, 94, '比邻星', { fs: 11.5, fill: MUT });
    /* 底部：尺度条 */
    const bar = (y, label, w, color, val) => {
      let g = txt(246, y + 11, label, { anchor: 'end', fs: 12.5 });
      g += `<rect x="256" y="${y}" width="${w}" height="12" rx="6" fill="${color}"/>`;
      g += txt(264 + w, y + 11, val, { anchor: 'start', fs: 12, fill: MUT });
      return g;
    };
    s += txt(320, 122, '同样是「一段路」，长度差别巨大（条长为示意）', { fs: 12.5, fill: MUT });
    s += bar(132, '阳光到地球', 10, '#e2943a', '8 分 20 秒');
    s += bar(154, '到最近的恒星', 120, '#e25563', '比邻星 · 约 4.2 光年');
    s += bar(176, '银河系直径', 250, PURPLE, '约 10 万光年');
    return s + '</svg>';
  };

  /* 流星 · 陨石 · 彗星 */
  const meteor = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 178">`;
    const atmo = (x0) =>
      `<path d="M ${x0} 84 Q ${x0 + 100} 44 ${x0 + 204} 84" fill="none" stroke="#9db4d6" stroke-width="1.8" stroke-dasharray="5 4"/>` +
      txt(x0 + 100, 34, '大气层', { fs: 10.5, fill: MUT });
    /* 面板一：流星 */
    let x0 = 6;
    s += atmo(x0);
    s += `<circle cx="${x0 + 74}" cy="52" r="3" fill="${MOON_GRAY}"/>`;
    s += `<line x1="${x0 + 82}" y1="58" x2="${x0 + 132}" y2="108" stroke="${SUN}" stroke-width="3.5" marker-end="url(#afig-arrow)"/>`;
    s += txt(x0 + 102, 140, '流星', { fs: 14.5, fill: '#c98a12' });
    s += txt(x0 + 102, 160, '在大气中烧出的光迹', { fs: 11, fill: MUT });
    /* 面板二：陨石 */
    x0 = 218;
    s += atmo(x0);
    s += `<line x1="${x0 + 82}" y1="58" x2="${x0 + 128}" y2="116" stroke="${SUN}" stroke-width="3.5" marker-end="url(#afig-arrow)"/>`;
    s += `<line x1="${x0 + 30}" y1="122" x2="${x0 + 174}" y2="122" stroke="${INK}" stroke-width="2.5"/>`;
    s += `<path d="M ${x0 + 118} 122 L ${x0 + 124} 110 L ${x0 + 134} 108 L ${x0 + 142} 118 L ${x0 + 136} 122 Z" fill="${MOON_GRAY}" stroke="${INK}" stroke-width="1.5"/>`;
    s += txt(x0 + 102, 140, '陨石', { fs: 14.5 });
    s += txt(x0 + 102, 160, '没烧完，落到地面', { fs: 11, fill: MUT });
    /* 面板三：彗星 */
    x0 = 430;
    s += `<circle cx="${x0 + 34}" cy="80" r="15" fill="${SUN}"/>` + rays(x0 + 34, 80, 18, 24, SUN, 30);
    s += `<circle cx="${x0 + 150}" cy="80" r="8" fill="#8f95a8"/>`;
    s += `<path d="M ${x0 + 158} 76 Q ${x0 + 190} 62 ${x0 + 202} 52" fill="none" stroke="#9db4d6" stroke-width="5" stroke-linecap="round" opacity="0.75"/>`;
    s += `<path d="M ${x0 + 158} 84 Q ${x0 + 192} 84 ${x0 + 204} 96" fill="none" stroke="#b9c7de" stroke-width="4" stroke-linecap="round" opacity="0.75"/>`;
    s += txt(x0 + 102, 140, '彗星', { fs: 14.5, fill: '#6b7fb3' });
    s += txt(x0 + 102, 160, '彗尾永远背向太阳', { fs: 11, fill: MUT });
    return s + '</svg>';
  };

  /* 银河系 */
  const milkyway = () => {
    const cx = 230, cy = 108;
    let s = `<svg class="fig-svg" viewBox="0 0 640 216">`;
    /* 外界虚线 */
    s += `<ellipse cx="${cx}" cy="${cy}" rx="172" ry="66" fill="none" stroke="${LINE}" stroke-width="1.6" stroke-dasharray="6 5" transform="rotate(-33 ${cx} ${cy})"/>`;
    /* 旋臂 */
    s += `<ellipse cx="${cx}" cy="${cy}" rx="150" ry="52" fill="none" stroke="#cfc4f0" stroke-width="20" opacity="0.45" transform="rotate(-33 ${cx} ${cy})"/>`;
    s += `<ellipse cx="${cx}" cy="${cy}" rx="118" ry="40" fill="none" stroke="#b9a8e8" stroke-width="14" opacity="0.4" transform="rotate(35 ${cx} ${cy})"/>`;
    /* 核心 */
    s += `<ellipse cx="${cx}" cy="${cy}" rx="30" ry="18" fill="#f6e3b0" stroke="#e2c274" stroke-width="2"/>`;
    s += txt(cx, cy + 4, '银心', { fs: 11, fill: '#8a5a12' });
    /* 太阳系位置 */
    s += `<circle cx="348" cy="58" r="4.5" fill="#e2943a"/>`;
    s += arrow(352, 54, 420, 30, '#e2943a');
    s += txt(426, 28, '太阳系在这里', { anchor: 'start', fs: 13, fill: '#e2943a' });
    /* 右侧说明 */
    s += txt(460, 66, '旋涡状的「星星大漩涡」', { anchor: 'start', fs: 13.5 });
    s += txt(460, 92, '1000 多亿颗恒星', { anchor: 'start', fs: 13, fill: MUT });
    s += txt(460, 118, '直径约 10 万光年', { anchor: 'start', fs: 13, fill: MUT });
    s += txt(460, 144, '中心有超大质量黑洞', { anchor: 'start', fs: 13, fill: MUT });
    s += txt(230, 200, '夏夜看到的「天河」，就是这层星盘的平面', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 宇宙的尺度阶梯 */
  const universeScale = () => {
    const baseY = 200, cx = 320;
    const rings = [
      [18, '#9db4d6', '地月系'],
      [52, '#6b7fb3', '太阳系（海王星轨道约 45 亿千米）'],
      [98, PURPLE, '银河系（直径约 10 万光年）'],
      [148, '#7a5ab8', '本星系群（仙女座星系等）'],
      [178, '#c2557d', '可观测宇宙（直径约 930 亿光年）'],
    ];
    let s = `<svg class="fig-svg" viewBox="0 0 640 218">`;
    rings.forEach(r => {
      s += `<path d="M ${cx - r[0]} ${baseY} A ${r[0]} ${r[0]} 0 0 1 ${cx + r[0]} ${baseY}" fill="none" stroke="${r[1]}" stroke-width="2.2"${r[0] === 178 ? ' stroke-dasharray="7 5"' : ''}/>`;
    });
    rings.forEach(r => {
      s += `<circle cx="${cx}" cy="${baseY - r[0]}" r="3" fill="${r[1]}"/>`;
      s += txt(cx + 10, baseY - r[0] - 6, r[2], { anchor: 'start', fs: 12.5, fill: r[1] === '#9db4d6' ? MUT : r[1], fw: 800 });
    });
    s += `<circle cx="${cx}" cy="${baseY}" r="4" fill="#e25563"/>`;
    s += txt(cx, baseY + 14, '地球在中心，一层层向外放大（尺度示意）', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 火箭的原理 */
  const rocket = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 196">`;
    /* 火箭本体 */
    s += `<path d="M 320 8 L 338 46 L 302 46 Z" fill="#e25563" stroke="${INK}" stroke-width="1.6"/>`;
    s += `<rect x="302" y="46" width="36" height="66" rx="9" fill="#eef0f8" stroke="${INK}" stroke-width="1.6"/>`;
    s += `<circle cx="320" cy="68" r="8" fill="#9fd8e0" stroke="${INK}" stroke-width="1.4"/>`;
    s += `<path d="M 302 98 L 284 126 L 302 120 Z" fill="#e25563" stroke="${INK}" stroke-width="1.4"/>`;
    s += `<path d="M 338 98 L 356 126 L 338 120 Z" fill="#e25563" stroke="${INK}" stroke-width="1.4"/>`;
    /* 火焰 */
    s += `<path d="M 308 112 Q 320 162 332 112 Z" fill="${SUN}"/>`;
    s += `<path d="M 315 112 Q 320 142 325 112 Z" fill="#e25563"/>`;
    /* 喷气与反作用力 */
    s += arrow(320, 168, 320, 190, '#e2943a');
    s += txt(340, 186, '燃气向下喷', { anchor: 'start', fs: 13, fill: '#c98a12' });
    s += arrow(282, 172, 282, 36, '#2fbf71');
    s += txt(270, 30, '反作用力向上推', { anchor: 'end', fs: 13, fill: '#2fbf71' });
    /* 右侧速度 */
    s += txt(430, 74, '每秒 7.9 千米：绕地球飞行', { anchor: 'start', fs: 14 });
    s += txt(430, 102, '每秒 11.2 千米：飞向深空', { anchor: 'start', fs: 14 });
    s += txt(430, 130, '烧完一级丢一级，越飞越轻', { anchor: 'start', fs: 12.5, fill: MUT });
    s += txt(430, 158, '自带氧化剂，太空里也能燃烧', { anchor: 'start', fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* 人造卫星（HTML 卡片流） */
  const satellites = () => {
    const stops = [
      ['📡', '通信卫星', '转播电视与电话'],
      ['🌦️', '气象卫星', '拍云图、报台风'],
      ['🧭', '导航卫星', '北斗 · GPS 定位'],
      ['🔭', '太空望远镜', '哈勃 · 韦布'],
      ['🌏', '对地观测', '资源环境灾害'],
      ['🛰️', '空间站', '宇航员太空之家'],
    ];
    return '<div class="fig-flow">' + stops.map(st =>
      `<div class="fig-stop"><span class="fig-stop-ico">${st[0]}</span><b>${st[1]}</b><i>${st[2]}</i></div>`
    ).join('') + '</div>';
  };

  /* ================= 互动演示 ================= */

  /* 太阳系行星档案 */
  const PLANET_DEMO = {
    mercury: { name: '水星', r: 6, c: '#9aa0a8', type: '岩质行星', note: '离太阳最近，表面布满环形山，昼夜温差极大' },
    venus: { name: '金星', r: 9, c: '#e8c46a', type: '岩质行星', note: '最亮的行星，表面约 460℃，古人叫它启明星' },
    earth: { name: '地球', r: 10, c: '#3d7fd9', type: '岩质行星', note: '我们的家园，71% 的表面被海洋覆盖' },
    mars: { name: '火星', r: 7, c: '#d0654a', type: '岩质行星', note: '红色星球，有太阳系最高的山峰奥林帕斯山' },
    jupiter: { name: '木星', r: 26, c: '#d9a86c', type: '气态巨行星', note: '八兄弟中的大块头，大红斑是比地球还大的风暴' },
    saturn: { name: '土星', r: 21, c: '#e0c48f', type: '气态巨行星', note: '光环最美，密度比水还小，能浮在大水池上' },
    uranus: { name: '天王星', r: 14, c: '#9fd8e0', type: '冰巨星', note: '躺着自转，像滚着绕太阳走，淡蓝色' },
    neptune: { name: '海王星', r: 13, c: '#4a6fd9', type: '冰巨星', note: '离太阳最远，风速最快，深蓝色的世界' },
  };
  const demoPlanets = () => {
    const baseY = 96;
    const pos = { mercury: 122, venus: 182, earth: 244, mars: 306, jupiter: 402, saturn: 476, uranus: 542, neptune: 602 };
    let s = `<svg class="fig-svg" viewBox="0 0 640 196">`;
    /* 太阳 */
    s += `<circle cx="26" cy="${baseY}" r="34" fill="${SUN}"/>`;
    s += rays(26, baseY, 37, 44, SUN, 45);
    /* 轨道虚线 */
    s += `<line x1="66" y1="${baseY}" x2="622" y2="${baseY}" stroke="${LINE}" stroke-width="2" stroke-dasharray="4 5"/>`;
    Object.keys(PLANET_DEMO).forEach(k => {
      const p = PLANET_DEMO[k], x = pos[k];
      if (k === 'saturn') {
        s += `<ellipse cx="${x}" cy="${baseY}" rx="${p.r + 11}" ry="7" fill="none" stroke="#c9b280" stroke-width="3" transform="rotate(-18 ${x} ${baseY})"/>`;
      }
      s += `<circle class="planet-dot" data-planet="${k}" cx="${x}" cy="${baseY}" r="${p.r}" fill="${p.c}" stroke="${INK}" stroke-opacity="0.18" stroke-width="1"/>`;
    });
    s += `<g class="planet-hi"></g>`;
    s += `<text class="planet-name" x="320" y="152" text-anchor="middle" font-size="15" font-weight="900" fill="${INK}"></text>`;
    s += `<text class="planet-note" x="320" y="180" text-anchor="middle" font-size="12.5" font-weight="700" fill="#73788b"></text>`;
    return s + '</svg>' +
      `<div class="fig-ctrl">` +
      Object.keys(PLANET_DEMO).map(k =>
        `<button class="fig-btn" data-fig-act="astro-planet" data-v="${k}">${PLANET_DEMO[k].name}</button>`).join('') +
      `</div>`;
  };
  function planetApply(fig, key, btn) {
    const p = PLANET_DEMO[key];
    if (!p) return;
    const baseY = 96;
    const pos = { mercury: 122, venus: 182, earth: 244, mars: 306, jupiter: 402, saturn: 476, uranus: 542, neptune: 602 };
    const x = pos[key];
    fig.querySelector('.planet-hi').innerHTML =
      `<circle cx="${x}" cy="${baseY}" r="${p.r + 6}" fill="none" stroke="#e25563" stroke-width="3"/>`;
    fig.querySelector('.planet-name').textContent = p.name + ' · ' + p.type;
    fig.querySelector('.planet-note').textContent = p.note;
    fig.querySelectorAll('[data-fig-act="astro-planet"]').forEach(b => b.classList.toggle('fig-on', b === btn));
    fig.dataset.init = '1';
  }

  /* 月相变化 */
  // 月相说明只有一份，动效不可用时仍可点选静态图。
  const MOON_PHASES = (typeof ASTRO_OBSERVATION === 'undefined' ? [] : ASTRO_OBSERVATION.phases).map((phase, i) => ({
    ...phase, n1: phase.note, n2: phase.cal, full: i === 4, half: i === 2 || i === 6,
    w: i === 0 ? 0 : Math.abs(Math.cos(i * Math.PI / 4)), bow: i > 2 && i < 6 ? 1 : 0, side: i < 4 ? 'right' : 'left',
  }));
  /* 右侧受亮的月面路径；左侧受亮时整体镜像 */
  function moonLitPath(cx, cy, R, ph) {
    if (ph.full) {
      return `M ${cx - R} ${cy} A ${R} ${R} 0 1 1 ${cx + R} ${cy} A ${R} ${R} 0 1 1 ${cx - R} ${cy} Z`;
    }
    if (ph.half) {
      return `M ${cx} ${cy - R} A ${R} ${R} 0 0 1 ${cx} ${cy + R} Z`;
    }
    const w = ph.w * R;
    /* bow: 0 → 明暗界线朝受亮侧弯（月牙）；1 → 背离受亮侧弯（凸月） */
    return `M ${cx} ${cy - R} A ${R} ${R} 0 0 1 ${cx} ${cy + R} A ${w.toFixed(1)} ${R} 0 0 ${ph.bow} ${cx} ${cy - R} Z`;
  }
  const demoMoonphases = () => {
    const interactive = typeof window !== 'undefined' && window.AstroObservation?.html('moon');
    if (interactive) return interactive;
    if (!MOON_PHASES.length) return '<p>月相资料暂未加载，请先阅读下方知识要点。</p>';
    const cx = 170, cy = 100, R = 70;
    let s = `<svg class="fig-svg" viewBox="0 0 640 215">`;
    s += starDots([[300, 30, 2], [360, 58, 1.5], [420, 24, 2.2], [500, 44, 1.6], [560, 26, 2], [610, 60, 1.5], [470, 84, 1.4], [600, 100, 1.8]]);
    s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#3b405e" stroke="#565d85" stroke-width="2.5"/>`;
    s += `<g class="moon-lit"></g>`;
    s += txt(cx, cy + R + 30, '月相这样变，约 29.5 天一轮', { fs: 12.5, fill: MUT });
    /* 右侧信息 */
    s += `<text class="moon-name" x="330" y="66" font-size="18" font-weight="900" fill="${INK}"></text>`;
    return s + '</svg><p class="moon-cal astro-observe-cause"></p><p class="moon-n1 astro-observe-note"></p><p class="moon-n2 astro-observe-model"></p>' +
      `<div class="fig-ctrl">` +
      MOON_PHASES.map(ph =>
        `<button class="fig-btn" data-fig-act="astro-moon" data-v="${ph.key}">${ph.label}</button>`).join('') +
      `</div>`;
  };
  function moonApply(fig, key, btn) {
    const ph = MOON_PHASES.find(p => p.key === key);
    if (!ph) return;
    const cx = 170, cy = 100, R = 70;
    let lit = '';
    if (ph.full) {
      lit = `<path d="${moonLitPath(cx, cy, R, ph)}" fill="#f7e9b0"/>`;
    } else if (ph.half || ph.w > 0) {
      const d = moonLitPath(cx, cy, R, ph);
      lit = ph.side === 'right' ? `<path d="${d}" fill="#f7e9b0"/>`
        : `<g transform="translate(${2 * cx} 0) scale(-1 1)"><path d="${d}" fill="#f7e9b0"/></g>`;
    }
    /* 新月：不画亮面 */
    fig.querySelector('.moon-lit').innerHTML = lit;
    fig.querySelector('.moon-name').textContent = ph.label;
    fig.querySelector('.moon-cal').textContent = '亮面比例在变，不是地球影子挡住。';
    fig.querySelector('.moon-n1').textContent = '🌙 ' + ph.n1;
    fig.querySelector('.moon-n2').textContent = '⏰ ' + ph.n2;
    fig.querySelectorAll('[data-fig-act="astro-moon"]').forEach(b => b.classList.toggle('fig-on', b === btn));
    fig.dataset.init = '1';
  }

  /* ================= 新增图示（第二站·月球等） ================= */

  /* 冥王星为什么被降级：行星三条件 */
  const plutoDowngrade = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 200">`;
    s += txt(320, 22, '成为行星的三个条件（2006 年新标准）', { fs: 15 });
    const conds = [
      ['① 绕太阳转', '冥王星 ✓', '#2fbf71'],
      ['② 个头大到被引力压圆', '冥王星 ✓', '#2fbf71'],
      ['③ 清空轨道附近其他天体', '冥王星 ✗', '#e25563'],
    ];
    conds.forEach((c, i) => {
      const x = 120 + i * 200;
      s += `<rect x="${x - 86}" y="40" width="172" height="100" rx="14" fill="${c[2]}14" stroke="${c[2]}" stroke-width="1.8"/>`;
      s += txt(x, 70, c[0], { fs: 14, fw: 900 });
      s += txt(x, 100, c[1], { fs: 16, fw: 900, fill: c[2] });
      s += txt(x, 124, i === 2 ? '轨道附近还有同类天体' : '满足', { fs: 11.5, fill: MUT });
    });
    s += txt(320, 172, '冥王星只满足前两条 → 被划为「矮行星」，太阳系从此只有八大行星', { fs: 13.5, fill: '#c98a12', fw: 800 });
    return s + '</svg>';
  };

  /* 月球环形山 */
  const craters = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    /* 月球表面 */
    s += `<ellipse cx="180" cy="110" rx="150" ry="60" fill="#e8e6dc" stroke="${MOON_GRAY}" stroke-width="2"/>`;
    /* 环形山 */
    const cs = [[100, 96, 16], [150, 110, 10], [200, 100, 22], [250, 116, 12], [130, 124, 8], [225, 88, 14]];
    cs.forEach(c => {
      s += `<ellipse cx="${c[0]}" cy="${c[1]}" rx="${c[2]}" ry="${c[2] * 0.42}" fill="#c9c4b6" stroke="${MOON_GRAY}" stroke-width="1.4"/>`;
      s += `<ellipse cx="${c[0]}" cy="${c[1]}" rx="${c[2] * 0.5}" ry="${c[2] * 0.2}" fill="#b8b3a5"/>`;
    });
    /* 月海 */
    s += `<ellipse cx="170" cy="118" rx="55" ry="18" fill="#c7c2b3" opacity="0.7"/>`;
    s += txt(180, 166, '月球没有大气保护，陨石直接砸出环形山', { fs: 13, fill: MUT });
    /* 右侧说明 */
    s += txt(420, 52, '环形山', { anchor: 'start', fs: 16, fw: 900 });
    s += txt(420, 76, '大小不一，小的像碗口', { anchor: 'start', fs: 13, fill: MUT });
    s += txt(420, 96, '大的直径超过 200 千米', { anchor: 'start', fs: 13, fill: MUT });
    s += txt(420, 124, '月海', { anchor: 'start', fs: 16, fw: 900, fill: '#8a7a5a' });
    s += txt(420, 148, '古代熔岩冷却的平原', { anchor: 'start', fs: 13, fill: MUT });
    s += txt(420, 168, '一滴水也没有', { anchor: 'start', fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 潮汐与月球 */
  const tides = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    /* 地球 */
    s += `<circle cx="220" cy="96" r="52" fill="${EARTH_BLUE}" stroke="${INK}" stroke-width="2"/>`;
    s += `<path d="M 195 70 Q 210 64 220 76 Q 210 88 196 82 Z" fill="#7ba05b"/>`;
    s += `<path d="M 230 110 Q 244 106 248 116 Q 240 124 230 120 Z" fill="#7ba05b"/>`;
    /* 潮汐鼓起 */
    s += `<ellipse cx="168" cy="96" rx="14" ry="30" fill="#6ba3e6" opacity="0.55"/>`;
    s += `<ellipse cx="272" cy="96" rx="14" ry="30" fill="#6ba3e6" opacity="0.55"/>`;
    s += arrow(160, 96, 150, 96, '#2f9bd6');
    s += arrow(280, 96, 290, 96, '#2f9bd6');
    s += txt(140, 76, '涨潮', { fs: 12.5, fill: '#2f9bd6', fw: 800 });
    s += txt(298, 76, '涨潮', { fs: 12.5, fill: '#2f9bd6', fw: 800 });
    /* 月球 */
    s += `<circle cx="500" cy="96" r="22" fill="#d9dbe6" stroke="${MOON_GRAY}" stroke-width="2"/>`;
    s += `<circle cx="494" cy="90" r="4" fill="${MOON_GRAY}"/>`;
    s += arrow(470, 96, 290, 96, '#6b7fb3');
    s += txt(380, 82, '月球引力拉起海水', { fs: 13, fill: '#6b7fb3', fw: 700 });
    s += txt(500, 140, '月球', { fs: 12.5, fill: MUT });
    s += txt(220, 170, '一天约两次涨潮：朝向和背向月球的一侧都会鼓起', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 阿波罗与嫦娥探月时间线 */
  const moonMissions = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    s += `<line x1="40" y1="96" x2="600" y2="96" stroke="${LINE}" stroke-width="3"/>`;
    const evs = [
      [1969, '阿波罗 11 号', '人类首次登月', '#c2557d'],
      [2007, '嫦娥一号', '中国绕月', '#d97745'],
      [2013, '嫦娥三号', '玉兔号落月', '#d97745'],
      [2019, '嫦娥四号', '月背软着陆', '#d97745'],
      [2020, '嫦娥五号', '带回月壤', '#d97745'],
      [2024, '嫦娥六号', '月背采样', '#d97745'],
    ];
    evs.forEach((e, i) => {
      const x = 60 + i * 106;
      s += `<circle cx="${x}" cy="96" r="9" fill="${e[3]}" stroke="#fff" stroke-width="2.5"/>`;
      s += txt(x, 76, e[0], { fs: 13, fw: 900, fill: e[3] });
      s += txt(x, 120, e[1], { fs: 12, fw: 800 });
      s += txt(x, 138, e[2], { fs: 10.5, fill: MUT });
    });
    s += txt(320, 166, '从阿姆斯特朗的「一小步」到嫦娥月背采样，人类不断走近月球', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* ================= 新增图示（第三站·恒星与星星） ================= */

  /* 恒星 vs 行星 */
  const starVsPlanet = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    /* 恒星 */
    s += `<circle cx="150" cy="90" r="42" fill="${SUN}"/>` + rays(150, 90, 45, 56, SUN, 30);
    s += txt(150, 158, '恒星（如太阳）', { fs: 15, fw: 900, fill: '#c98a12' });
    s += txt(150, 176, '自己发光发热', { fs: 12.5, fill: MUT });
    /* VS */
    s += txt(320, 96, 'VS', { fs: 26, fw: 900, fill: '#7a5b18' });
    /* 行星 */
    s += `<circle cx="490" cy="90" r="30" fill="${EARTH_BLUE}" stroke="${INK}" stroke-width="2"/>`;
    s += `<path d="M 475 78 Q 486 73 492 82 Q 486 92 474 86 Z" fill="#7ba05b"/>`;
    /* 反射光 */
    s += `<line x1="430" y1="60" x2="466" y2="80" stroke="${SUN}" stroke-width="2" stroke-dasharray="5 4"/>`;
    s += `<line x1="430" y1="120" x2="466" y2="100" stroke="${SUN}" stroke-width="2" stroke-dasharray="5 4"/>`;
    s += txt(490, 158, '行星（如地球）', { fs: 15, fw: 900, fill: '#3d7fd9' });
    s += txt(490, 176, '反射太阳光才发亮', { fs: 12.5, fill: MUT });
    s += txt(320, 140, '恒星会眨眼，行星的光比较稳', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* 北斗七星找北极星 */
  const constellations = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    s += starDots([[60, 40, 1.5], [120, 130, 1.2], [540, 50, 1.4], [580, 120, 1.6], [300, 30, 1.3], [400, 150, 1.2]]);
    /* 北斗七星 */
    const bei = [[160, 80], [200, 70], [240, 78], [278, 92], [310, 108], [350, 104], [386, 92]];
    bei.forEach((p, i) => s += `<circle cx="${p[0]}" cy="${p[1]}" r="${i === 0 || i === 6 ? 5.5 : 4.5}" fill="#f6e3b0" stroke="#c9a64a" stroke-width="1.5"/>`);
    for (let i = 0; i < bei.length - 1; i++)
      s += `<line x1="${bei[i][0]}" y1="${bei[i][1]}" x2="${bei[i + 1][0]}" y2="${bei[i + 1][1]}" stroke="#c9a64a" stroke-width="1.6"/>`;
    /* 勺口两颗星连线延长5倍到北极星 */
    const p1 = bei[0], p2 = bei[1];
    const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
    const nx = p2[0] + dx * 5, ny = p2[1] + dy * 5;
    s += `<line x1="${p2[0]}" y1="${p2[1]}" x2="${nx}" y2="${ny}" stroke="#e25563" stroke-width="2" stroke-dasharray="6 5"/>`;
    s += `<circle cx="${nx}" cy="${ny}" r="7" fill="#fff" stroke="#e25563" stroke-width="3"/>`;
    s += txt(nx, ny - 16, '北极星', { fs: 14, fw: 900, fill: '#e25563' });
    s += txt(200, 140, '北斗七星（大熊座）', { fs: 13, fill: '#c9a64a', fw: 800 });
    s += txt(200, 158, '勺口两颗星连线向外延约 5 倍 = 北极星', { fs: 12, fill: MUT });
    s += txt(520, 160, '找到北极星 = 找到正北', { fs: 12.5, fill: MUT, anchor: 'start' });
    return s + '</svg>';
  };

  /* 星星颜色与温度 */
  const starColor = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    const stars = [
      ['蓝色', '#4a6fd9', '最热', '>1万℃', 0],
      ['白色', '#eef0f8', '次之', '约1万℃', 1],
      ['黄色', SUN, '中等', '约5500℃', 2],
      ['红色', '#e25563', '相对最冷', '约3000℃', 3],
    ];
    stars.forEach(st => {
      const x = 90 + st[4] * 160;
      s += `<circle cx="${x}" cy="72" r="26" fill="${st[1]}"${st[1] === '#eef0f8' ? ' stroke="#9aa0a8" stroke-width="1.5"' : ''}/>`;
      s += rays(x, 72, 29, 36, st[1], 45);
      s += txt(x, 120, st[0], { fs: 15, fw: 900, fill: st[1] === '#eef0f8' ? INK : st[1] });
      s += txt(x, 140, st[2], { fs: 13, fill: MUT });
      s += txt(x, 158, st[3], { fs: 12, fill: MUT });
    });
    s += txt(320, 178, '颜色越蓝温度越高，越红温度越低（参宿七蓝、参宿四红）', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* ================= 新增图示（第四站·仰望星空） ================= */

  /* 天文望远镜 */
  const telescope = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 190">`;
    /* 镜筒 */
    s += `<rect x="120" y="66" width="200" height="34" rx="10" fill="#9aa0a8" stroke="${INK}" stroke-width="2"/>`;
    s += `<rect x="100" y="60" width="34" height="46" rx="6" fill="#6b7380" stroke="${INK}" stroke-width="2"/>`;
    s += `<ellipse cx="100" cy="83" rx="14" ry="20" fill="#3d7fd9" opacity="0.5"/>`;
    /* 三脚架 */
    s += `<line x1="220" y1="100" x2="190" y2="166" stroke="${INK}" stroke-width="4"/>`;
    s += `<line x1="220" y1="100" x2="220" y2="166" stroke="${INK}" stroke-width="4"/>`;
    s += `<line x1="220" y1="100" x2="250" y2="166" stroke="${INK}" stroke-width="4"/>`;
    /* 光线汇聚 */
    s += `<line x1="30" y1="40" x2="108" y2="76" stroke="${SUN}" stroke-width="1.8" opacity="0.7"/>`;
    s += `<line x1="30" y1="126" x2="108" y2="90" stroke="${SUN}" stroke-width="1.8" opacity="0.7"/>`;
    s += `<line x1="30" y1="83" x2="108" y2="83" stroke="${SUN}" stroke-width="1.8" opacity="0.7"/>`;
    s += txt(60, 30, '收集光线', { fs: 12, fill: '#c98a12' });
    /* 右侧说明 */
    s += txt(380, 56, '望远镜的本领', { anchor: 'start', fs: 16, fw: 900 });
    s += txt(380, 82, '🔭 口径越大，聚光越多', { anchor: 'start', fs: 13.5, fill: MUT });
    s += txt(380, 104, '🌌 太空望远镜避开大气', { anchor: 'start', fs: 13.5, fill: MUT });
    s += txt(380, 126, '🇨🇳 中国天眼 500 米口径', { anchor: 'start', fs: 13.5, fill: MUT });
    s += txt(380, 148, '📅 伽利略 1609 年首次望星空', { anchor: 'start', fs: 13.5, fill: MUT });
    s += txt(320, 180, '倍数不是关键，口径和成像质量才重要', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* 怎样观星 */
  const stargazing = () => {
    const tips = [
      ['🌙', '选晴朗无月的夜晚', '月光太亮会盖住暗星'],
      ['🏙️', '远离城市灯光', '光污染越少，星星越多'],
      ['👀', '暗适应 20 分钟', '别急着看手机白光'],
      ['🔴', '用红光手电看图', '红光不影响夜视'],
      ['🧭', '先找北斗、猎户', '亮星带路认星座'],
      ['🧥', '注意保暖和安全', '野外要大人陪同'],
    ];
    return '<div class="fig-flow">' + tips.map(t =>
      `<div class="fig-stop"><span class="fig-stop-ico">${t[0]}</span><b>${t[1]}</b><i>${t[2]}</i></div>`).join('') + '</div>';
  };

  /* 安全看太阳 */
  const safeSun = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    /* 危险方法 */
    s += `<circle cx="110" cy="76" r="32" fill="${SUN}"/>` + rays(110, 76, 35, 42, SUN, 30);
    s += `<circle cx="110" cy="76" r="42" fill="none" stroke="#e25563" stroke-width="4" stroke-dasharray="6 5"/>`;
    s += `<line x1="70" y1="40" x2="150" y2="112" stroke="#e25563" stroke-width="5"/>`;
    s += txt(110, 146, '❌ 肉眼 / 墨镜 / 烟熏玻璃', { fs: 13, fill: '#e25563', fw: 800 });
    s += txt(110, 166, '会灼伤眼睛！', { fs: 12, fill: MUT });
    /* 箭头 */
    s += arrow(200, 76, 280, 76, '#c98a12');
    s += txt(240, 62, '换成', { fs: 13, fill: '#c98a12' });
    /* 安全方法 */
    s += `<circle cx="360" cy="76" r="32" fill="${SUN}"/>` + rays(360, 76, 35, 42, SUN, 30);
    s += `<rect x="340" y="62" width="40" height="28" rx="6" fill="#3d7fd9" opacity="0.5" stroke="#2767a8" stroke-width="2"/>`;
    s += txt(360, 146, '✅ 专用太阳观测镜', { fs: 13, fill: '#2fbf71', fw: 800 });
    /* 小孔成像 */
    s += `<rect x="470" y="50" width="70" height="52" rx="6" fill="#9aa0a8" stroke="${INK}" stroke-width="1.6"/>`;
    s += `<circle cx="488" cy="76" r="3" fill="${INK}"/>`;
    s += `<rect x="552" y="58" width="56" height="36" rx="4" fill="#fdf6e9" stroke="${INK}" stroke-width="1.4"/>`;
    s += `<circle cx="580" cy="76" r="10" fill="${SUN}" opacity="0.8"/>`;
    s += `<line x1="488" y1="76" x2="572" y2="76" stroke="${SUN}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    s += txt(580, 146, '✅ 小孔成像投影', { fs: 13, fill: '#2fbf71', fw: 800 });
    s += txt(580, 166, '把太阳像投到纸上', { fs: 11.5, fill: MUT });
    return s + '</svg>';
  };

  /* 星空会转动 */
  const skyRotation = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    /* 地球自转 */
    s += `<circle cx="120" cy="92" r="46" fill="${EARTH_BLUE}" stroke="${INK}" stroke-width="2"/>`;
    s += `<path d="M 100 72 Q 112 66 120 78 Q 112 90 100 84 Z" fill="#7ba05b"/>`;
    s += `<path d="M 128 102 Q 140 98 144 108 Q 136 116 128 112 Z" fill="#7ba05b"/>`;
    s += `<path d="M 120 36 A 46 46 0 0 1 120 148" fill="none" stroke="#e25563" stroke-width="2.5" stroke-dasharray="5 4"/>`;
    s += arrow(100, 40, 140, 40, '#e25563');
    s += txt(120, 166, '地球自西向东自转', { fs: 13, fill: '#e25563', fw: 700 });
    /* 星空向西转 */
    s += starDots([[300, 50, 2], [360, 40, 1.5], [420, 60, 2.2], [380, 110, 1.6], [320, 130, 1.8], [440, 130, 1.4]]);
    s += arrow(480, 70, 300, 70, PURPLE);
    s += arrow(480, 110, 300, 110, PURPLE);
    s += txt(390, 60, '星空看起来向西转', { fs: 13, fill: PURPLE, fw: 700 });
    s += txt(390, 130, '每小时约 15°', { fs: 13, fill: PURPLE, fw: 700 });
    /* 四季 */
    s += txt(540, 50, '🌏 公转 → 四季星空不同', { anchor: 'start', fs: 13, fw: 800 });
    s += txt(540, 76, '冬夜：猎户座', { anchor: 'start', fs: 12, fill: MUT });
    s += txt(540, 98, '夏夜：天蝎座', { anchor: 'start', fs: 12, fill: MUT });
    s += txt(540, 120, '夏夜标志：夏季大三角', { anchor: 'start', fs: 12, fill: MUT });
    s += txt(320, 176, '不是星星在绕我们跑，是地球在自转和公转', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* ================= 新增图示（第五站·银河系与宇宙） ================= */

  /* 星系类型 */
  const galaxies = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    /* 旋涡星系（银河系） */
    const cx1 = 110, cy1 = 84;
    s += `<ellipse cx="${cx1}" cy="${cy1}" rx="72" ry="22" fill="none" stroke="#b9a8e8" stroke-width="14" opacity="0.5" transform="rotate(-25 ${cx1} ${cy1})"/>`;
    s += `<ellipse cx="${cx1}" cy="${cy1}" rx="56" ry="16" fill="none" stroke="#cfc4f0" stroke-width="10" opacity="0.5" transform="rotate(25 ${cx1} ${cy1})"/>`;
    s += `<ellipse cx="${cx1}" cy="${cy1}" rx="16" ry="10" fill="#f6e3b0" stroke="#e2c274" stroke-width="1.6"/>`;
    s += txt(cx1, 150, '旋涡星系', { fs: 14, fw: 900 });
    s += txt(cx1, 170, '银河系 · 仙女座', { fs: 11.5, fill: MUT });
    /* 椭圆星系 */
    s += `<ellipse cx="320" cy="84" rx="64" ry="42" fill="#e8e0c8" stroke="#c9b88a" stroke-width="2"/>`;
    s += txt(320, 150, '椭圆星系', { fs: 14, fw: 900 });
    s += txt(320, 170, '恒星多、气体少', { fs: 11.5, fill: MUT });
    /* 不规则星系 */
    s += `<path d="M 470 60 Q 500 44 530 60 Q 556 74 538 96 Q 510 112 486 96 Q 456 80 470 60 Z" fill="#9fd8e0" opacity="0.6" stroke="#5fa8b0" stroke-width="1.6"/>`;
    s += `<circle cx="510" cy="80" r="4" fill="#e25563"/>`;
    s += `<circle cx="490" cy="92" r="3" fill="${SUN}"/>`;
    s += txt(510, 150, '不规则星系', { fs: 14, fw: 900 });
    s += txt(510, 170, '形状不规则', { fs: 11.5, fill: MUT });
    s += txt(320, 14, '宇宙中有上千亿个星系，银河系只是普通的一座', { fs: 13.5, fill: '#c98a12', fw: 700 });
    return s + '</svg>';
  };

  /* 宇宙大爆炸时间线 */
  const bigBang = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    /* 膨胀的气球示意 */
    const cx = 110, cy = 90;
    for (let i = 0; i < 5; i++) {
      const r = 16 + i * 14;
      s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${PURPLE}" stroke-width="${i === 4 ? 2.5 : 1.2}" opacity="${0.3 + i * 0.15}"${i === 4 ? ' stroke-dasharray="6 5"' : ''}/>`;
    }
    s += `<circle cx="${cx}" cy="${cy}" r="4" fill="#e25563"/>`;
    s += txt(cx, 158, '空间本身在膨胀', { fs: 13, fill: PURPLE, fw: 700 });
    s += txt(cx, 176, '不是碎片乱飞', { fs: 11.5, fill: MUT });
    /* 时间线 */
    const evs = [
      ['138亿年前', '大爆炸开始', PURPLE],
      ['38万年后', '宇宙变透明', '#6b7fb3'],
      ['几亿年后', '第一批恒星', '#c98a12'],
      ['46亿年前', '太阳系形成', '#e2943a'],
      ['今天', '还在膨胀', '#2fbf71'],
    ];
    evs.forEach((e, i) => {
      const x = 270 + i * 74;
      s += `<circle cx="${x}" cy="90" r="6" fill="${e[2]}"/>`;
      s += txt(x, 60, e[0], { fs: 11.5, fw: 900, fill: e[2] });
      s += txt(x, 112, e[1], { fs: 11, fill: INK, fw: 700 });
      if (i < evs.length - 1) s += `<line x1="${x + 8}" y1="90" x2="${x + 66}" y2="90" stroke="${LINE}" stroke-width="2"/>`;
    });
    s += txt(450, 156, '证据：星系互相远离 · 微波背景辐射', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* 黑洞 */
  const blackhole = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    const cx = 180, cy = 92;
    /* 吸积盘 */
    s += `<ellipse cx="${cx}" cy="${cy}" rx="80" ry="28" fill="none" stroke="#e2943a" stroke-width="16" opacity="0.45"/>`;
    s += `<ellipse cx="${cx}" cy="${cy}" rx="60" ry="20" fill="none" stroke="#e25563" stroke-width="12" opacity="0.4"/>`;
    /* 事件视界（黑洞本体） */
    s += `<circle cx="${cx}" cy="${cy}" r="26" fill="#1a1830" stroke="#3d2a5a" stroke-width="2.5"/>`;
    s += txt(cx, cy + 5, '黑洞', { fs: 13, fw: 900, fill: '#b9a8e8' });
    s += txt(cx, 170, '事件视界内连光都逃不出', { fs: 12.5, fill: MUT });
    /* 光被弯折 */
    s += `<path d="M 300 50 Q 250 70 230 92" fill="none" stroke="${SUN}" stroke-width="2.5" opacity="0.7"/>`;
    s += `<path d="M 300 134 Q 250 114 230 92" fill="none" stroke="${SUN}" stroke-width="2.5" opacity="0.7"/>`;
    s += arrow(300, 50, 260, 68, SUN);
    /* 右侧说明 */
    s += txt(380, 48, '黑洞不是「洞」', { anchor: 'start', fs: 16, fw: 900 });
    s += txt(380, 74, '它是被压缩到极致的天体', { anchor: 'start', fs: 13, fill: MUT });
    s += txt(380, 98, '🌌 星系中心常有超大质量黑洞', { anchor: 'start', fs: 13, fill: MUT });
    s += txt(380, 120, '📸 2019 年拍到 M87 黑洞照片', { anchor: 'start', fs: 13, fill: MUT });
    s += txt(380, 142, '🚫 太阳将来不会变成黑洞', { anchor: 'start', fs: 13, fill: MUT });
    s += txt(380, 164, '影响范围有限，不会乱吸', { anchor: 'start', fs: 12, fill: '#c98a12' });
    return s + '</svg>';
  };

  /* ================= 新增图示（第六站·飞出地球） ================= */

  /* 空间站 */
  const spaceStation = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    /* 核心舱 */
    s += `<rect x="260" y="72" width="120" height="36" rx="14" fill="#eef0f8" stroke="${INK}" stroke-width="2"/>`;
    s += `<circle cx="320" cy="90" r="8" fill="#9fd8e0" stroke="${INK}" stroke-width="1.5"/>`;
    /* 实验舱 */
    s += `<rect x="180" y="76" width="80" height="28" rx="10" fill="#e8e6dc" stroke="${INK}" stroke-width="1.8"/>`;
    s += `<rect x="380" y="76" width="80" height="28" rx="10" fill="#e8e6dc" stroke="${INK}" stroke-width="1.8"/>`;
    /* 太阳能板 */
    s += `<rect x="100" y="80" width="80" height="22" rx="4" fill="#3d7fd9" stroke="${INK}" stroke-width="1.4"/>`;
    s += `<rect x="460" y="80" width="80" height="22" rx="4" fill="#3d7fd9" stroke="${INK}" stroke-width="1.4"/>`;
    for (let i = 1; i < 4; i++) {
      s += `<line x1="${100 + i * 20}" y1="80" x2="${100 + i * 20}" y2="102" stroke="#2767a8" stroke-width="1"/>`;
      s += `<line x1="${460 + i * 20}" y1="80" x2="${460 + i * 20}" y2="102" stroke="#2767a8" stroke-width="1"/>`;
    }
    /* 对接飞船 */
    s += `<rect x="150" y="82" width="30" height="16" rx="4" fill="#e25563" stroke="${INK}" stroke-width="1.2"/>`;
    s += txt(320, 44, '天宫空间站', { fs: 16, fw: 900, fill: '#157d73' });
    s += txt(320, 132, '天和核心舱 + 问天、梦天实验舱', { fs: 13, fill: MUT });
    s += txt(320, 152, '约 90 分钟绕地球一圈，一天看 16 次日出', { fs: 12.5, fill: MUT });
    /* 地球在下方 */
    s += `<path d="M 0 170 Q 320 140 640 170" fill="${EARTH_BLUE}" opacity="0.3"/>`;
    s += txt(60, 162, '🌍 地球', { fs: 12, fill: '#3d7fd9' });
    return s + '</svg>';
  };

  /* 宇航员太空生活 */
  const astroLife = () => {
    const items = [
      ['🍽️', '吃饭', '闭嘴防碎屑，用吸管喝水'],
      ['🛌', '睡觉', '钻进竖挂的睡袋'],
      ['🚶', '行走', '失重飘来飘去'],
      ['💪', '锻炼', '每天约 2 小时防肌肉萎缩'],
      ['🧑‍🚀', '出舱', '穿宇航服像小飞船'],
    ];
    return '<div class="fig-flow">' + items.map(t =>
      `<div class="fig-stop"><span class="fig-stop-ico">${t[0]}</span><b>${t[1]}</b><i>${t[2]}</i></div>`).join('') + '</div>';
  };

  /* 载人航天里程碑 */
  const milestones = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    s += `<line x1="40" y1="96" x2="600" y2="96" stroke="${LINE}" stroke-width="3"/>`;
    const evs = [
      [1961, '加加林', '人类进太空第一人', '#c2557d'],
      [1969, '阿波罗 11 号', '人类首次登月', '#6b7fb3'],
      [2003, '杨利伟', '中国载人首飞', '#d97745'],
      [2012, '刘洋', '中国首位女航天员', '#d97745'],
      [2021, '王亚平', '太空课开讲', '#d97745'],
    ];
    evs.forEach((e, i) => {
      const x = 80 + i * 130;
      s += `<circle cx="${x}" cy="96" r="10" fill="${e[3]}" stroke="#fff" stroke-width="2.5"/>`;
      s += txt(x, 72, e[0], { fs: 13, fw: 900, fill: e[3] });
      s += txt(x, 122, e[1], { fs: 13, fw: 800 });
      s += txt(x, 142, e[2], { fs: 10.5, fill: MUT });
    });
    s += txt(320, 170, '从加加林到中国航天员，人类走向太空的脚步越来越稳', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* ================= 新增图示（第七站·中国航天足迹） ================= */

  /* 东方红一号 */
  const dongfanghong = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    /* 卫星 */
    s += `<circle cx="180" cy="84" r="30" fill="#e8c46a" stroke="${INK}" stroke-width="2"/>`;
    s += `<rect x="148" y="78" width="64" height="12" rx="3" fill="#9aa0a8" stroke="${INK}" stroke-width="1.2"/>`;
    s += `<circle cx="168" cy="84" r="4" fill="#e25563"/>`;
    s += `<circle cx="192" cy="84" r="4" fill="#e25563"/>`;
    s += txt(180, 140, '东方红一号', { fs: 15, fw: 900, fill: '#c98a12' });
    s += txt(180, 160, '1970 年 4 月 24 日', { fs: 12.5, fill: MUT });
    /* 音符 */
    s += txt(320, 60, '🎵 《东方红》乐曲响彻太空', { fs: 15, fw: 900, fill: '#d97745' });
    s += txt(380, 86, '📅 4 月 24 日 = 中国航天日', { anchor: 'start', fs: 14, fill: MUT });
    s += txt(380, 110, '⚖️ 重 173 千克', { anchor: 'start', fs: 14, fill: MUT });
    s += txt(380, 134, '🌍 中国第五个独立发射卫星的国家', { anchor: 'start', fs: 14, fill: MUT });
    s += txt(380, 158, '👨‍🔬 钱学森等科学家接力奋斗', { anchor: 'start', fs: 14, fill: MUT });
    return s + '</svg>';
  };

  /* 嫦娥探月 */
  const change = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    s += `<line x1="40" y1="100" x2="600" y2="100" stroke="${LINE}" stroke-width="3"/>`;
    const evs = [
      [2007, '嫦娥一号', '绕月', '#d97745'],
      [2013, '嫦娥三号', '玉兔落月', '#d97745'],
      [2019, '嫦娥四号', '月背着陆', '#d97745'],
      [2020, '嫦娥五号', '带回月壤', '#d97745'],
      [2024, '嫦娥六号', '月背采样', '#d97745'],
    ];
    evs.forEach((e, i) => {
      const x = 90 + i * 118;
      s += `<circle cx="${x}" cy="100" r="9" fill="${e[3]}" stroke="#fff" stroke-width="2.5"/>`;
      s += txt(x, 78, e[0], { fs: 12.5, fw: 900, fill: e[3] });
      s += txt(x, 124, e[1], { fs: 12, fw: 800 });
      s += txt(x, 142, e[2], { fs: 10.5, fill: MUT });
    });
    /* 三步走 */
    s += txt(320, 38, '绕 → 落 → 回 三步走圆满完成', { fs: 15, fw: 900, fill: '#d97745' });
    s += txt(320, 170, '月球车叫玉兔，中继卫星叫鹊桥，都来自中国神话', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* 天问探火 */
  const tianwen = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    /* 火星 */
    s += `<circle cx="130" cy="90" r="44" fill="#d0654a" stroke="${INK}" stroke-width="2"/>`;
    s += `<ellipse cx="110" cy="78" rx="16" ry="8" fill="#b5513a"/>`;
    s += `<ellipse cx="150" cy="102" rx="12" ry="6" fill="#b5513a"/>`;
    s += `<path d="M 90 70 Q 120 64 150 72" fill="none" stroke="#9aa0a8" stroke-width="2" opacity="0.5"/>`;
    s += txt(130, 156, '火星', { fs: 14, fw: 900, fill: '#d0654a' });
    /* 祝融号 */
    s += `<rect x="300" y="74" width="60" height="28" rx="6" fill="#9aa0a8" stroke="${INK}" stroke-width="1.6"/>`;
    s += `<rect x="280" y="82" width="24" height="14" rx="3" fill="#3d7fd9" stroke="${INK}" stroke-width="1.2"/>`;
    s += `<rect x="356" y="82" width="24" height="14" rx="3" fill="#3d7fd9" stroke="${INK}" stroke-width="1.2"/>`;
    s += `<circle cx="306" cy="104" r="5" fill="${INK}"/>`;
    s += `<circle cx="354" cy="104" r="5" fill="${INK}"/>`;
    s += txt(330, 130, '祝融号火星车', { fs: 14, fw: 900 });
    s += txt(330, 148, '太阳能板供电', { fs: 11.5, fill: MUT });
    /* 右侧 */
    s += txt(470, 56, '天问一号（2021）', { anchor: 'start', fs: 15, fw: 900, fill: '#d97745' });
    s += txt(470, 80, '一次任务完成', { anchor: 'start', fs: 13.5, fill: MUT });
    s += txt(470, 100, '环绕 · 着陆 · 巡视', { anchor: 'start', fs: 14, fw: 800, fill: '#2fbf71' });
    s += txt(470, 124, '着陆在乌托邦平原', { anchor: 'start', fs: 13, fill: MUT });
    s += txt(470, 146, '名字来自屈原《天问》', { anchor: 'start', fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 北斗与天宫 */
  const beidouTiangong = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    /* 北斗导航 */
    s += `<circle cx="140" cy="84" r="8" fill="#2fbf71"/>`;
    for (let i = 0; i < 8; i++) {
      const a = i * 45 * Math.PI / 180;
      s += `<circle cx="${140 + 46 * Math.cos(a)}" cy="${84 + 46 * Math.sin(a)}" r="5" fill="#3d7fd9"/>`;
    }
    s += txt(140, 160, '北斗导航（2020 全球组网）', { fs: 13, fw: 900, fill: '#2fbf71' });
    s += txt(140, 176, '独特本领：短报文通信', { fs: 11.5, fill: MUT });
    /* 天宫空间站 */
    s += `<rect x="380" y="70" width="100" height="28" rx="10" fill="#eef0f8" stroke="${INK}" stroke-width="2"/>`;
    s += `<rect x="320" y="76" width="60" height="16" rx="4" fill="#3d7fd9" stroke="${INK}" stroke-width="1.2"/>`;
    s += `<rect x="480" y="76" width="60" height="16" rx="4" fill="#3d7fd9" stroke="${INK}" stroke-width="1.2"/>`;
    s += txt(430, 160, '天宫空间站（2022 全面建成）', { fs: 13, fw: 900, fill: '#157d73' });
    s += txt(430, 176, '天舟送补给，神舟接送人', { fs: 11.5, fill: MUT });
    s += txt(320, 18, '中国太空基础设施：北斗指路 + 天宫筑家', { fs: 14, fw: 900, fill: '#c98a12' });
    return s + '</svg>';
  };

  /* 未来航天梦 */
  const futureSpace = () => {
    const items = [
      ['🚀', '2030 前载人登月', '新一代运载火箭'],
      ['🌙', '月球科研站', '嫦娥七号八号勘察'],
      ['☄️', '天问二号探小行星', '计划采样返回'],
      ['🌱', '太空育种', '宇宙射线诱变筛选'],
      ['👩‍🚀', '未来宇航员', '可能就是正在看书的你'],
    ];
    return '<div class="fig-flow">' + items.map(t =>
      `<div class="fig-stop"><span class="fig-stop-ico">${t[0]}</span><b>${t[1]}</b><i>${t[2]}</i></div>`).join('') + '</div>';
  };

  /* ================= 新增图示（第八站·宇宙里的问号） ================= */

  /* 邻居们适合住吗 */
  const habitable = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    const planets = [
      ['金星', '#e8c46a', '约 460℃', '太热', '#e25563'],
      ['地球', EARTH_BLUE, '约 15℃', '正好', '#2fbf71'],
      ['火星', '#d0654a', '约 -60℃', '太冷', '#e25563'],
    ];
    planets.forEach((p, i) => {
      const x = 120 + i * 200;
      s += `<circle cx="${x}" cy="76" r="34" fill="${p[1]}" stroke="${INK}" stroke-width="2"/>`;
      if (p[0] === '地球') {
        s += `<path d="M ${x - 14} 64 Q ${x - 4} 58 ${x + 2} 68 Q ${x - 6} 78 ${x - 16} 72 Z" fill="#7ba05b"/>`;
      }
      s += txt(x, 132, p[0], { fs: 16, fw: 900 });
      s += txt(x, 152, p[2], { fs: 13, fill: p[4] });
      s += txt(x, 170, p[3], { fs: 12.5, fill: p[4], fw: 800 });
    });
    s += txt(320, 18, '生命需要：液态水 + 能量 + 合适的温度', { fs: 14, fw: 900, fill: '#c98a12' });
    return s + '</svg>';
  };

  /* 系外行星凌星法 */
  const exoplanet = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    /* 恒星 */
    s += `<circle cx="160" cy="90" r="40" fill="${SUN}"/>` + rays(160, 90, 43, 50, SUN, 30);
    s += txt(160, 158, '恒星', { fs: 13, fill: '#c98a12', fw: 800 });
    /* 行星凌星 */
    s += `<circle cx="220" cy="90" r="12" fill="#9aa0a8" stroke="${INK}" stroke-width="1.5"/>`;
    s += txt(220, 120, '行星', { fs: 12, fill: MUT });
    /* 光度曲线 */
    s += txt(420, 40, '恒星亮度', { anchor: 'start', fs: 13, fw: 800 });
    s += `<line x1="300" y1="90" x2="600" y2="90" stroke="${LINE}" stroke-width="2"/>`;
    s += `<path d="M 300 80 L 380 80 L 390 100 L 470 100 L 480 80 L 600 80" fill="none" stroke="#2fbf71" stroke-width="3"/>`;
    s += txt(430, 118, '行星经过 → 星光微微变暗', { anchor: 'start', fs: 12.5, fill: '#2fbf71' });
    s += txt(430, 140, '据此算出行星大小和轨道', { anchor: 'start', fs: 12, fill: MUT });
    s += txt(320, 176, '已发现 5000 多颗系外行星，比邻星 b 在宜居带', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* 火星上有生命吗 */
  const marsLife = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    /* 火星 */
    s += `<circle cx="130" cy="90" r="44" fill="#d0654a" stroke="${INK}" stroke-width="2"/>`;
    s += `<path d="M 86 76 Q 110 66 134 74 Q 156 84 160 96 Q 140 108 110 100 Q 90 90 86 76 Z" fill="#5a8fb8" opacity="0.4"/>`;
    s += txt(130, 156, '远古火星可能有水', { fs: 12.5, fill: MUT });
    /* 证据 */
    const evs = [
      ['🏔️', '干涸河床', '流水痕迹'],
      ['🧪', '有机分子', '好奇号发现'],
      ['💧', '水的线索', '祝融号探测'],
      ['🔬', '样品返回', '未来带回研究'],
    ];
    evs.forEach((e, i) => {
      const x = 310 + (i % 2) * 160;
      const y = 50 + Math.floor(i / 2) * 56;
      s += `<rect x="${x - 70}" y="${y - 18}" width="140" height="36" rx="10" fill="#fff" stroke="${LINE}" stroke-width="1.5"/>`;
      s += txt(x - 48, y + 5, e[0], { fs: 20, anchor: 'start' });
      s += txt(x - 20, y + 2, e[1], { fs: 12.5, anchor: 'start', fw: 800 });
      s += txt(x - 20, y + 16, e[2], { fs: 11, anchor: 'start', fill: MUT });
    });
    s += txt(470, 170, '有水只是条件之一，还要找生命直接证据', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* 向宇宙打招呼 */
  const greeting = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    /* 旅行者号 */
    s += `<circle cx="110" cy="90" r="22" fill="#e8c46a" stroke="${INK}" stroke-width="2"/>`;
    s += `<circle cx="110" cy="90" r="14" fill="#9aa0a8" stroke="${INK}" stroke-width="1.2"/>`;
    s += `<line x1="88" y1="68" x2="88" y2="50" stroke="${INK}" stroke-width="2"/>`;
    s += `<line x1="132" y1="68" x2="132" y2="50" stroke="${INK}" stroke-width="2"/>`;
    s += txt(110, 150, '旅行者号金唱片', { fs: 13, fw: 800 });
    s += txt(110, 168, '55 种语言问候', { fs: 11, fill: MUT });
    /* 信号波 */
    for (let i = 0; i < 4; i++) {
      s += `<path d="M ${150 + i * 6} ${90 - 30 - i * 10} Q ${250} ${90} ${150 + i * 6} ${90 + 30 + i * 10}" fill="none" stroke="${PURPLE}" stroke-width="1.5" opacity="${0.8 - i * 0.15}"/>`;
    }
    /* 天眼 */
    s += `<ellipse cx="500" cy="100" rx="80" ry="20" fill="#9aa0a8" stroke="${INK}" stroke-width="2"/>`;
    s += `<ellipse cx="500" cy="100" rx="64" ry="14" fill="none" stroke="#6b7380" stroke-width="1.2"/>`;
    s += txt(500, 140, '中国天眼 FAST', { fs: 13, fw: 800 });
    s += txt(500, 158, '聆听宇宙无线电信号', { fs: 11, fill: MUT });
    s += txt(320, 30, '👋 人类一直在寻找「同伴」', { fs: 15, fw: 900, fill: PURPLE });
    s += txt(320, 180, '旅行者号已飞出太阳系，到别的恒星还要几万年', { fs: 12, fill: MUT });
    return s + '</svg>';
  };

  /* UFO 不等于外星人 */
  const ufo = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    /* UFO 问号 */
    s += txt(130, 40, '天上出现发光物？', { fs: 15, fw: 900 });
    s += txt(130, 64, 'UFO = 不明飞行物', { fs: 13.5, fill: PURPLE, fw: 800 });
    s += txt(130, 86, '不明 ≠ 外星飞船', { fs: 13.5, fill: '#e25563', fw: 800 });
    /* 常见解释 */
    const items = [
      ['✈️', '飞机'],
      ['🎈', '气球'],
      ['🪁', '风筝'],
      ['☄️', '流星'],
      ['🌫️', '大气现象'],
      ['🛰️', '卫星'],
    ];
    s += txt(380, 40, '常见原因', { fs: 14, fw: 900, anchor: 'start' });
    items.forEach((it, i) => {
      const x = 360 + (i % 3) * 90;
      const y = 70 + Math.floor(i / 3) * 50;
      s += `<rect x="${x - 34}" y="${y - 16}" width="68" height="32" rx="10" fill="#fff" stroke="${LINE}" stroke-width="1.5"/>`;
      s += txt(x, y + 5, `${it[0]} ${it[1]}`, { fs: 12.5, fw: 700 });
    });
    s += txt(320, 160, '科学态度：先怀疑、再求证，用证据说话', { fs: 13.5, fw: 800, fill: '#c98a12' });
    return s + '</svg>';
  };

  /* 宇宙成分饼图：暗能量 / 暗物质 / 普通物质（未解之谜站） */
  const darkPie = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 230">`;
    s += txt(320, 18, '宇宙里都有什么？（按能量成分估算）', { fs: 14.5 });
    /* 饼图三等分：暗能量 68% / 暗物质 27% / 普通物质 5%，从 12 点钟顺时针 */
    s += `<path d="M200 120 L200 32 A88 88 0 1 1 120.4 157.5 Z" fill="${PURPLE}"/>`;
    s += `<path d="M200 120 L120.4 157.5 A88 88 0 0 1 172.8 36.3 Z" fill="#4a5fc1"/>`;
    s += `<path d="M200 120 L172.8 36.3 A88 88 0 0 1 200 32 Z" fill="${SUN}"/>`;
    s += txt(252, 152, '68%', { fs: 15, fill: '#fff', fw: 900 });
    s += txt(148, 102, '27%', { fs: 14, fill: '#fff', fw: 900 });
    /* 图例 */
    const legend = [
      ['#8b65c9', '暗能量 约 68%', '让宇宙越胀越快的神秘推力'],
      ['#4a5fc1', '暗物质 约 27%', '不发光不反光，只用引力「露面」'],
      ['#f6b93b', '普通物质 约 5%', '星星、星云、地球和我们'],
    ];
    legend.forEach((it, i) => {
      const y = 64 + i * 44;
      s += `<rect x="330" y="${y - 12}" width="18" height="18" rx="5" fill="${it[0]}"/>`;
      s += txt(358, y + 2, it[1], { anchor: 'start', fs: 14, fw: 800 });
      s += txt(358, y + 20, it[2], { anchor: 'start', fs: 12, fill: MUT, fw: 400 });
    });
    s += txt(320, 220, '会发光的普通物质只是「零头」，宇宙的绝大部分还是未解之谜', { fs: 13, fill: '#c98a12', fw: 800 });
    return s + '</svg>';
  };

  /* ================= 单元主题横幅 ================= */

  const UNIT_BANNERS = {
    au1: () => {
      let s = `<svg viewBox="0 0 640 110" preserveAspectRatio="xMidYMid slice">`;
      s += `<rect width="640" height="110" fill="url(#g-au1)"/>`;
      s += `<defs><linearGradient id="g-au1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3e0"/><stop offset="1" stop-color="#ffe0b2"/></linearGradient></defs>`;
      /* 太阳 */
      s += `<circle cx="540" cy="40" r="30" fill="#f6b93b"/>` + rays(540, 40, 33, 42, SUN, 30);
      /* 行星轨道 */
      for (let i = 0; i < 4; i++) {
        s += `<ellipse cx="540" cy="40" rx="${50 + i * 22}" ry="${20 + i * 9}" fill="none" stroke="#e2943a" stroke-width="1.2" opacity="${0.5 - i * 0.1}"/>`;
      }
      const dots = [[490, 40, 4, '#9aa0a8'], [468, 40, 6, '#e8c46a'], [440, 40, 7, EARTH_BLUE], [410, 40, 5, '#d0654a']];
      dots.forEach(d => s += `<circle cx="${d[0]}" cy="${d[1]}" r="${d[2]}" fill="${d[3]}"/>`);
      s += `<text x="30" y="68" font-size="28" font-weight="900" fill="#c98a12">☀️ 太阳系大家庭</text>`;
      return s + '</svg>';
    },
    au2: () => {
      let s = `<svg viewBox="0 0 640 110" preserveAspectRatio="xMidYMid slice">`;
      s += `<rect width="640" height="110" fill="url(#g-au2)"/>`;
      s += `<defs><linearGradient id="g-au2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8ebf5"/><stop offset="1" stop-color="#d0d7ee"/></linearGradient></defs>`;
      s += starDots([[50, 20, 1.5], [100, 40, 1.2], [580, 30, 1.4], [610, 60, 1.6], [560, 80, 1.2]]);
      /* 月亮 */
      s += `<circle cx="540" cy="55" r="28" fill="#d9dbe6" stroke="#9aa0a8" stroke-width="2"/>`;
      s += `<circle cx="530" cy="48" r="5" fill="#b8b3a5"/><circle cx="550" cy="62" r="4" fill="#b8b3a5"/>`;
      s += `<text x="30" y="68" font-size="28" font-weight="900" fill="#4a5680">🌙 我们的月球</text>`;
      return s + '</svg>';
    },
    au3: () => {
      let s = `<svg viewBox="0 0 640 110" preserveAspectRatio="xMidYMid slice">`;
      s += `<rect width="640" height="110" fill="url(#g-au3)"/>`;
      s += `<defs><linearGradient id="g-au3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde8ea"/><stop offset="1" stop-color="#f8d0d5"/></linearGradient></defs>`;
      s += starDots([[60, 25, 2], [120, 50, 1.5], [500, 20, 2.2], [560, 45, 1.6], [440, 70, 1.8], [600, 75, 1.4]]);
      /* 大恒星 */
      s += `<circle cx="540" cy="55" r="26" fill="#e25563"/>` + rays(540, 55, 29, 36, '#e25563', 30);
      s += `<text x="30" y="68" font-size="28" font-weight="900" fill="#a23545">⭐ 恒星与星星</text>`;
      return s + '</svg>';
    },
    au4: () => {
      let s = `<svg viewBox="0 0 640 110" preserveAspectRatio="xMidYMid slice">`;
      s += `<rect width="640" height="110" fill="url(#g-au4)"/>`;
      s += `<defs><linearGradient id="g-au4" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3edff"/><stop offset="1" stop-color="#c8daff"/></linearGradient></defs>`;
      s += starDots([[80, 20, 1.8], [150, 50, 1.4], [520, 25, 2], [580, 50, 1.5], [460, 75, 1.6]]);
      /* 望远镜 */
      s += `<rect x="480" y="44" width="90" height="20" rx="6" fill="#6b7380" stroke="#34384d" stroke-width="1.5"/>`;
      s += `<line x1="525" y1="64" x2="525" y2="92" stroke="#34384d" stroke-width="3"/>`;
      s += `<text x="30" y="68" font-size="28" font-weight="900" fill="#2a5298">🔭 仰望星空</text>`;
      return s + '</svg>';
    },
    au5: () => {
      let s = `<svg viewBox="0 0 640 110" preserveAspectRatio="xMidYMid slice">`;
      s += `<rect width="640" height="110" fill="url(#g-au5)"/>`;
      s += `<defs><linearGradient id="g-au5" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ece4fb"/><stop offset="1" stop-color="#d4c5f0"/></linearGradient></defs>`;
      s += starDots([[60, 20, 1.6], [120, 45, 1.3], [560, 25, 1.8], [600, 60, 1.4], [500, 80, 1.5]]);
      /* 旋涡星系 */
      const cx = 540, cy = 55;
      s += `<ellipse cx="${cx}" cy="${cy}" rx="60" ry="20" fill="none" stroke="#b9a8e8" stroke-width="12" opacity="0.5" transform="rotate(-20 ${cx} ${cy})"/>`;
      s += `<ellipse cx="${cx}" cy="${cy}" rx="44" ry="14" fill="none" stroke="#cfc4f0" stroke-width="8" opacity="0.5" transform="rotate(25 ${cx} ${cy})"/>`;
      s += `<ellipse cx="${cx}" cy="${cy}" rx="12" ry="8" fill="#f6e3b0"/>`;
      s += `<text x="30" y="68" font-size="28" font-weight="900" fill="#6a4c9c">🌌 银河系与宇宙</text>`;
      return s + '</svg>';
    },
    au6: () => {
      let s = `<svg viewBox="0 0 640 110" preserveAspectRatio="xMidYMid slice">`;
      s += `<rect width="640" height="110" fill="url(#g-au6)"/>`;
      s += `<defs><linearGradient id="g-au6" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dff3ee"/><stop offset="1" stop-color="#b8e0d6"/></linearGradient></defs>`;
      s += starDots([[80, 20, 1.5], [140, 50, 1.2], [580, 30, 1.6], [560, 70, 1.3]]);
      /* 火箭 */
      s += `<path d="M 540 18 L 556 50 L 524 50 Z" fill="#e25563"/>`;
      s += `<rect x="524" y="50" width="32" height="36" rx="8" fill="#eef0f8" stroke="#34384d" stroke-width="1.5"/>`;
      s += `<path d="M 524 76 L 510 96 L 524 90 Z" fill="#e25563"/>`;
      s += `<path d="M 556 76 L 570 96 L 556 90 Z" fill="#e25563"/>`;
      s += `<path d="M 532 86 Q 540 108 548 86 Z" fill="#f6b93b"/>`;
      s += `<text x="30" y="68" font-size="28" font-weight="900" fill="#157d73">🚀 飞出地球</text>`;
      return s + '</svg>';
    },
    au7: () => {
      let s = `<svg viewBox="0 0 640 110" preserveAspectRatio="xMidYMid slice">`;
      s += `<rect width="640" height="110" fill="url(#g-au7)"/>`;
      s += `<defs><linearGradient id="g-au7" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fdeede"/><stop offset="1" stop-color="#f9d9ba"/></linearGradient></defs>`;
      s += starDots([[80, 20, 1.5], [140, 50, 1.2], [560, 25, 1.6], [600, 60, 1.3]]);
      /* 中国国旗色卫星 */
      s += `<circle cx="540" cy="50" r="22" fill="#e25563"/>`;
      s += `<rect x="518" y="44" width="44" height="12" rx="2" fill="#9aa0a8"/>`;
      s += `<text x="530" y="55" font-size="10" fill="#fff" font-weight="900">★</text>`;
      s += `<text x="30" y="68" font-size="28" font-weight="900" fill="#a0522d">🇨🇳 中国航天足迹</text>`;
      return s + '</svg>';
    },
    au8: () => {
      let s = `<svg viewBox="0 0 640 110" preserveAspectRatio="xMidYMid slice">`;
      s += `<rect width="640" height="110" fill="url(#g-au8)"/>`;
      s += `<defs><linearGradient id="g-au8" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e0f5e6"/><stop offset="1" stop-color="#bfe5cb"/></linearGradient></defs>`;
      s += starDots([[60, 20, 1.6], [120, 50, 1.3], [500, 20, 1.8], [560, 50, 1.5], [440, 75, 1.4], [600, 75, 1.6]]);
      /* 问号 */
      s += `<text x="520" y="72" font-size="56" font-weight="900" fill="#2fbf71">?</text>`;
      s += `<text x="30" y="68" font-size="28" font-weight="900" fill="#1d7a48">👽 宇宙里的问号</text>`;
      return s + '</svg>';
    },
    au9: () => {
      let s = `<svg viewBox="0 0 640 110" preserveAspectRatio="xMidYMid slice">`;
      s += `<rect width="640" height="110" fill="url(#g-au9)"/>`;
      s += `<defs><linearGradient id="g-au9" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3e7f7"/><stop offset="1" stop-color="#c3cdf0"/></linearGradient></defs>`;
      s += starDots([[70, 22, 1.6], [130, 55, 1.3], [480, 24, 1.8], [540, 58, 1.5], [430, 78, 1.4], [600, 30, 1.6], [200, 30, 1.2]]);
      /* 大问号 */
      s += `<text x="520" y="76" font-size="56" font-weight="900" fill="#4a5fc1">?</text>`;
      s += `<text x="30" y="68" font-size="28" font-weight="900" fill="#33418f">❓ 未解之谜</text>`;
      return s + '</svg>';
    },
  };

  function unitBanner(unitId) {
    const fn = UNIT_BANNERS[unitId];
    if (!fn) return '';
    return `<div class="unit-banner">${fn()}</div>`;
  }

  /* ---------- 注册表 ---------- */
  const REG = {
    'astro-sun-facts': sunFacts,
    'astro-planet-bars': planetBars,
    'astro-asteroid-belt': asteroidBelt,
    'astro-moon-facts': moonFacts,
    'astro-eclipse': eclipse,
    'astro-star-life': starLife,
    'astro-lightyear': lightyear,
    'astro-meteor': meteor,
    'astro-milkyway': milkyway,
    'astro-universe-scale': universeScale,
    'astro-rocket': rocket,
    'astro-satellites': satellites,
    'demo-astro-planets': demoPlanets,
    'demo-astro-moonphases': demoMoonphases,
    /* 新增图示 */
    'astro-pluto-downgrade': plutoDowngrade,
    'astro-craters': craters,
    'astro-tides': tides,
    'astro-moon-missions': moonMissions,
    'astro-star-vs-planet': starVsPlanet,
    'astro-constellations': constellations,
    'astro-star-color': starColor,
    'astro-telescope': telescope,
    'astro-stargazing': stargazing,
    'astro-safe-sun': safeSun,
    'astro-sky-rotation': skyRotation,
    'astro-galaxies': galaxies,
    'astro-big-bang': bigBang,
    'astro-blackhole': blackhole,
    'astro-space-station': spaceStation,
    'astro-astro-life': astroLife,
    'astro-milestones': milestones,
    'astro-dongfanghong': dongfanghong,
    'astro-change': change,
    'astro-tianwen': tianwen,
    'astro-beidou-tiangong': beidouTiangong,
    'astro-future-space': futureSpace,
    'astro-habitable': habitable,
    'astro-exoplanet': exoplanet,
    'astro-mars-life': marsLife,
    'astro-greeting': greeting,
    'astro-ufo': ufo,
    'astro-dark-pie': darkPie,
  };

  const DEFAULT_CAPS = {
    'demo-astro-planets': '互动演示：点行星按钮，看它的档案和特点',
    'demo-astro-moonphases': '月相观察：看位置关系与月面亮暗怎样一起变化',
    'astro-sun-facts': '太阳的数字档案：直径约 139 万千米，质量占太阳系 99.8% 以上',
    'astro-planet-bars': '八大行星直径排行：木星最大，能装下 1300 多个地球',
    'astro-asteroid-belt': '八大行星排队绕太阳，小行星带卡在火星和木星之间（不按真实比例）',
    'astro-moon-facts': '月球离地球约 38 万千米，直径约是地球的四分之一',
    'astro-eclipse': '日食月球在中间，月食地球在中间；是否发生还要看影子有没有对准',
    'astro-star-life': '恒星的一生：太阳约 50 亿年后会变成红巨星，最后成为白矮星',
    'astro-lightyear': '光年是距离单位：光走一年约 9.5 万亿千米',
    'astro-meteor': '流星烧在大气里，陨石落在地面上，彗尾永远背向太阳',
    'astro-milkyway': '银河系是旋涡星系，太阳系在一条旋臂上（示意图）',
    'astro-universe-scale': '从地月系到可观测宇宙，一层层放大（尺度示意）',
    'astro-rocket': '燃气向下喷，反作用力向上推——真空里照样能飞',
    'astro-satellites': '头顶的人造卫星：通信、气象、导航、观测各显神通',
    'astro-pluto-downgrade': '行星三条件：绕日、够圆、清轨道——冥王星差第三条',
    'astro-craters': '月球没有大气保护，陨石直接砸出环形山；月海是熔岩平原不是海',
    'astro-tides': '月球引力拉起海水，朝向和背向月球的一侧都会涨潮',
    'astro-moon-missions': '从阿波罗登月到嫦娥采样，人类探月的大脚印',
    'astro-star-vs-planet': '恒星自己发光会眨眼，行星反射太阳光比较稳',
    'astro-constellations': '北斗七星勺口两星连线向外延约 5 倍，找到北极星辨正北',
    'astro-star-color': '蓝色星最热，红色星相对最冷——颜色透露表面温度',
    'astro-telescope': '口径越大聚光越多，太空望远镜避开大气干扰',
    'astro-stargazing': '观星六要点：晴朗无月、远离灯光、暗适应、红光看图、先找亮星、注意安全',
    'astro-safe-sun': '绝不能用肉眼或墨镜看太阳，用专用观测镜或小孔成像',
    'astro-sky-rotation': '地球自转让星空西移，公转让四季星空不同',
    'astro-galaxies': '宇宙中有上千亿个星系，银河系只是普通的一座',
    'astro-big-bang': '138 亿年前空间开始膨胀，不是炸弹爆炸',
    'astro-blackhole': '黑洞引力极强连光都逃不出，但影响范围有限不会乱吸',
    'astro-space-station': '天宫空间站：天和核心舱 + 问天、梦天实验舱',
    'astro-astro-life': '失重太空生活：吃饭防碎屑、睡觉钻睡袋、每天锻炼',
    'astro-milestones': '加加林首飞、阿波罗登月、杨利伟圆中国飞天梦',
    'astro-dongfanghong': '1970 年东方红一号升空，4 月 24 日成为中国航天日',
    'astro-change': '嫦娥绕落回三步走，玉兔落月、月背采样创历史',
    'astro-tianwen': '天问一号一次完成环绕着陆巡视，祝融号在火星工作',
    'astro-beidou-tiangong': '北斗全球组网 + 天宫空间站，中国太空基础设施',
    'astro-future-space': '载人登月、月球科研站、探小行星、太空育种——未来可期',
    'astro-habitable': '金星太热、火星太冷，地球正好适合生命居住',
    'astro-exoplanet': '凌星法：行星经过恒星前方，星光微微变暗就能发现它',
    'astro-mars-life': '火星有干涸河床和有机分子，但是否有生命还需证据',
    'astro-greeting': '旅行者号带金唱片飞出太阳系，中国天眼聆听宇宙',
    'astro-ufo': 'UFO 只是不明飞行物，绝大多数都有普通解释',
    'astro-dark-pie': '宇宙成分估算：暗能量约 68%、暗物质约 27%，会发光的普通物质只占约 5%',
  };

  function figHTML(id, cap) {
    const fn = REG[id];
    if (!fn) return '';
    const capText = cap || DEFAULT_CAPS[id] || '';
    return `<figure class="fig" data-fig="${id}">${DEFS}${fn()}${capText ? `<figcaption class="fig-cap">${capText}</figcaption>` : ''}</figure>`;
  }

  /* ---------- 互动演示的事件委托 ---------- */
  function bindDelegates(doc) {
    doc.addEventListener('click', e => {
      const b = e.target.closest('[data-fig-act]');
      if (!b || b.disabled) return;
      const fig = b.closest('.fig');
      if (!fig) return;
      const act = b.dataset.figAct;
      if (act === 'astro-planet') planetApply(fig, b.dataset.v, b);
      else if (act === 'astro-moon') moonApply(fig, b.dataset.v, b);
    });
  }

  /* 初始化静态演示（渲染后无需再调用；委托自动工作） */
  if (typeof document !== 'undefined') {
    bindDelegates(document);
    const initIn = root => {
      root.querySelectorAll('.fig').forEach(fig => {
        const id = fig.dataset.fig;
        if (fig.querySelector('.astro-observation')) { window.AstroObservation?.mount(fig); return; }
        if (id === 'demo-astro-planets' && !fig.dataset.init) { planetApply(fig, 'earth', fig.querySelector('[data-fig-act="astro-planet"][data-v="earth"]')); fig.dataset.init = '1'; }
        else if (id === 'demo-astro-moonphases' && !fig.dataset.init) { moonApply(fig, 'full', fig.querySelector('[data-fig-act="astro-moon"][data-v="full"]')); fig.dataset.init = '1'; }
      });
    };
    const mo = new MutationObserver(muts => {
      window.AstroObservation?.prune();
      muts.forEach(m => m.addedNodes.forEach(n => {
        if (n.nodeType === 1) {
          if (n.matches && n.matches('.fig')) initIn(n.parentElement || document);
          else if (n.querySelectorAll) initIn(n);
        }
      }));
    });
    mo.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('DOMContentLoaded', () => initIn(document));
  }

  return {
    figHTML,
    unitBanner,
    get FIG_IDS() { return Object.keys(REG); },
    has(id) { return Object.prototype.hasOwnProperty.call(REG, id); },
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FIG_IDS: AstroFigures.FIG_IDS, has: AstroFigures.has, unitBanner: AstroFigures.unitBanner };
}
if (typeof window !== 'undefined') {
  window.AstroFigures = AstroFigures;
}

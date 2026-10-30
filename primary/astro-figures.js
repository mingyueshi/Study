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
  const MOON_PHASES = [
    { key: 'new', label: '新月', cal: '农历初一', w: 0, bow: 0, side: 'right', n1: '月亮在地球和太阳之间，亮面背对我们', n2: '整晚几乎看不见月亮' },
    { key: 'waxcres', label: '峨眉月', cal: '农历初三初四', w: 0.78, bow: 0, side: 'right', n1: '弯弯的月牙，亮面朝西（右）', n2: '日落后挂在西边天空' },
    { key: 'firstq', label: '上弦月', cal: '农历初七初八', w: 0, bow: 0, side: 'right', half: true, n1: '右半边亮，亮面朝西', n2: '正午月出、半夜月落，前半夜可见' },
    { key: 'waxgib', label: '盈凸月', cal: '农历十一十二', w: 0.5, bow: 1, side: 'right', n1: '大半个月亮亮着', n2: '傍晚升起，大半夜都能看到' },
    { key: 'full', label: '满月', cal: '农历十五十六', full: true, n1: '亮面全对地球，通宵可见', n2: '这时地球在太阳和月球中间' },
    { key: 'wanggib', label: '亏凸月', cal: '农历十八十九', w: 0.5, bow: 1, side: 'left', n1: '亮面从西边开始亏', n2: '月出推迟，后半夜可见' },
    { key: 'lastq', label: '下弦月', cal: '农历廿二廿三', w: 0, bow: 0, side: 'left', half: true, n1: '左半边亮，亮面朝东（左）', n2: '半夜月出、正午月落，后半夜可见' },
    { key: 'wancres', label: '残月', cal: '农历廿六廿七', w: 0.78, bow: 0, side: 'left', n1: '弯弯的月牙，亮面朝东', n2: '黎明前挂在东边天空' },
  ];
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
    const cx = 170, cy = 100, R = 70;
    let s = `<svg class="fig-svg" viewBox="0 0 640 196">`;
    s += starDots([[300, 30, 2], [360, 58, 1.5], [420, 24, 2.2], [500, 44, 1.6], [560, 26, 2], [610, 60, 1.5], [470, 84, 1.4], [600, 100, 1.8]]);
    s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#3b405e" stroke="#565d85" stroke-width="2.5"/>`;
    s += `<g class="moon-lit"></g>`;
    s += txt(cx, cy + R + 30, '月相这样变，约 29.5 天一轮', { fs: 12.5, fill: MUT });
    /* 右侧信息 */
    s += `<text class="moon-name" x="330" y="66" font-size="18" font-weight="900" fill="${INK}"></text>`;
    s += `<text class="moon-cal" x="330" y="94" font-size="13.5" font-weight="800" fill="#7a5b18"></text>`;
    s += `<text class="moon-n1" x="330" y="126" font-size="13" font-weight="700" fill="#4a4f63"></text>`;
    s += `<text class="moon-n2" x="330" y="150" font-size="13" font-weight="700" fill="#4a4f63"></text>`;
    return s + '</svg>' +
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
    fig.querySelector('.moon-cal').textContent = ph.cal + ' · 亮面比例在变，不是影子挡住';
    fig.querySelector('.moon-n1').textContent = '🌙 ' + ph.n1;
    fig.querySelector('.moon-n2').textContent = '⏰ ' + ph.n2;
    fig.querySelectorAll('[data-fig-act="astro-moon"]').forEach(b => b.classList.toggle('fig-on', b === btn));
    fig.dataset.init = '1';
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
  };

  const DEFAULT_CAPS = {
    'demo-astro-planets': '互动演示：点行星按钮，看它的档案和特点',
    'demo-astro-moonphases': '互动演示：点月相名称，看月亮的样子和农历日期',
    'astro-sun-facts': '太阳的数字档案：直径约 139 万千米，质量占太阳系 99.8% 以上',
    'astro-planet-bars': '八大行星直径排行：木星最大，能装下 1300 多个地球',
    'astro-asteroid-belt': '八大行星排队绕太阳，小行星带卡在火星和木星之间（不按真实比例）',
    'astro-moon-facts': '月球离地球约 38 万千米，直径约是地球的四分之一',
    'astro-eclipse': '日食月球在中间（农历初一），月食地球在中间（农历十五）',
    'astro-star-life': '恒星的一生：太阳约 50 亿年后会变成红巨星，最后成为白矮星',
    'astro-lightyear': '光年是距离单位：光走一年约 9.5 万亿千米',
    'astro-meteor': '流星烧在大气里，陨石落在地面上，彗尾永远背向太阳',
    'astro-milkyway': '银河系是旋涡星系，太阳系在一条旋臂上（示意图）',
    'astro-universe-scale': '从地月系到可观测宇宙，一层层放大（尺度示意）',
    'astro-rocket': '燃气向下喷，反作用力向上推——真空里照样能飞',
    'astro-satellites': '头顶的人造卫星：通信、气象、导航、观测各显神通',
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
      if (!b) return;
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
        if (id === 'demo-astro-planets' && !fig.dataset.init) { planetApply(fig, 'earth', fig.querySelector('[data-fig-act="astro-planet"][data-v="earth"]')); fig.dataset.init = '1'; }
        else if (id === 'demo-astro-moonphases' && !fig.dataset.init) { moonApply(fig, 'full', fig.querySelector('[data-fig-act="astro-moon"][data-v="full"]')); fig.dataset.init = '1'; }
      });
    };
    const mo = new MutationObserver(muts => {
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
    get FIG_IDS() { return Object.keys(REG); },
    has(id) { return Object.prototype.hasOwnProperty.call(REG, id); },
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FIG_IDS: AstroFigures.FIG_IDS, has: AstroFigures.has };
}
if (typeof window !== 'undefined') {
  window.AstroFigures = AstroFigures;
}

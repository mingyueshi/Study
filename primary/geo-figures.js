/* ============================================================
   乐学堂 · 地理图示库（地理探索专属）
   - 纯 SVG 插图，离线可用，打印友好
   - 互动演示（方向罗盘 / 四季公转）事件用委托绑定，
     页面重渲染后无需重新挂载
   - 数据里用 fig: 'geo-xxx' / 'demo-geo-xxx' 引用
   ============================================================ */
'use strict';

const GeoFigures = (() => {
  const INK = '#34384d';
  const MUT = '#73788b';
  const LINE = '#dfe5f0';
  const SEA = '#2f9bd6';
  const LAND = '#7ba05b';
  const EARTH = '#b5893a';

  /* ---------- 小工具 ---------- */
  const txt = (x, y, s, opt) => {
    opt = opt || {};
    return `<text x="${x}" y="${y}" fill="${opt.fill || INK}" font-size="${opt.fs || 14}"` +
      ` font-weight="${opt.fw || 700}" text-anchor="${opt.anchor || 'middle'}"` +
      (opt.cls ? ` class="${opt.cls}"` : '') + `>${s}</text>`;
  };
  const arrow = (x1, y1, x2, y2, color) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color || SEA}" stroke-width="2.5" marker-end="url(#gfig-arrow)"/>`;
  const DEFS = `<defs><marker id="gfig-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${SEA}"/></marker></defs>`;

  /* ================= 地球 · 静态图示 ================= */

  /* 地球的数字档案 */
  const earthSize = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 178">`;
    /* 左：地球与赤道 */
    const cx = 150, cy = 88, R = 62;
    s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#e8f3fc" stroke="${SEA}" stroke-width="2.5"/>`;
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${R}" ry="16" fill="none" stroke="#e25563" stroke-width="2" stroke-dasharray="4 3"/>`;
    s += `<line x1="${cx - R}" y1="${cy}" x2="${cx + R}" y2="${cy}" stroke="#e25563" stroke-width="2.5"/>`;
    s += txt(cx, cy + 30, '赤道', { fill: '#e25563', fs: 13 });
    s += arrow(cx + R * 0.7071, cy - R * 0.7071, cx, cy, '#b5893a');
    s += txt(cx + R + 14, cy - 34, '半径', { fill: EARTH, fs: 12, anchor: 'start' });
    s += txt(cx + R + 14, cy - 16, '约 6400 千米', { fill: EARTH, fs: 12.5, anchor: 'start' });
    s += txt(cx, cy + R + 18, '赤道周长约 4 万千米', { fs: 14 });
    /* 右：海洋陆地占比环 */
    const dx = 460, dy = 80, r = 42, C = 2 * Math.PI * r;
    s += `<circle cx="${dx}" cy="${dy}" r="${r}" fill="none" stroke="#e9e2d3" stroke-width="16"/>`;
    s += `<circle cx="${dx}" cy="${dy}" r="${r}" fill="none" stroke="${SEA}" stroke-width="16" stroke-linecap="butt"` +
      ` stroke-dasharray="${C * 0.71} ${C}" transform="rotate(-90 ${dx} ${dy})"/>`;
    s += txt(dx, dy - 4, '海洋', { fs: 13, fill: SEA });
    s += txt(dx, dy + 16, '约 71%', { fs: 15 });
    s += txt(dx + r + 30, dy - 14, '陆地约 29%', { fill: LAND, fs: 13, anchor: 'start' });
    s += txt(dx + r + 30, dy + 8, '从太空看地球', { fill: MUT, fs: 12.5, anchor: 'start' });
    s += txt(dx + r + 30, dy + 28, '是一颗蓝色星球', { fill: MUT, fs: 12.5, anchor: 'start' });
    s += txt(320, 168, '绕赤道一圈 4 万千米：高铁不停跑也要五六天', { fs: 13.5, fill: MUT });
    return s + '</svg>';
  };

  /* 地球仪与经纬线 */
  const globe = () => {
    const cx = 180, cy = 90, R = 68;
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#e8f3fc" stroke="${SEA}" stroke-width="2.5"/>`;
    /* 纬线 */
    [0.45, -0.45].forEach(k => {
      s += `<ellipse cx="${cx}" cy="${cy + R * k * 0.72}" rx="${R * Math.sqrt(1 - k * k * 0.72 * 0.72) * 0.96}" ry="7" fill="none" stroke="${MUT}" stroke-width="1.4"/>`;
    });
    /* 经线（竖椭圆） */
    [0.35, 0.68, 1].forEach(k => {
      s += `<ellipse cx="${cx}" cy="${cy}" rx="${R * k}" ry="${R}" fill="none" stroke="${MUT}" stroke-width="1.4"/>`;
    });
    /* 赤道与地轴 */
    s += `<line x1="${cx - R}" y1="${cy}" x2="${cx + R}" y2="${cy}" stroke="#e25563" stroke-width="2.5"/>`;
    s += `<line x1="${cx}" y1="${cy - R - 14}" x2="${cx}" y2="${cy + R + 14}" stroke="${EARTH}" stroke-width="2" stroke-dasharray="6 3"/>`;
    s += `<circle cx="${cx}" cy="${cy - R}" r="4" fill="${EARTH}"/><circle cx="${cx}" cy="${cy + R}" r="4" fill="${EARTH}"/>`;
    s += txt(cx, cy - R - 20, '北极', { fill: EARTH, fs: 13 });
    s += txt(cx, cy + R + 26, '南极', { fill: EARTH, fs: 13 });
    s += txt(cx + R + 12, cy - 6, '赤道', { fill: '#e25563', fs: 13, anchor: 'start' });
    s += txt(cx - R - 12, cy - 30, '纬线', { fill: MUT, fs: 12.5, anchor: 'end' });
    s += txt(cx - R - 12, cy + 26, '经线', { fill: MUT, fs: 12.5, anchor: 'end' });
    s += txt(cx - R - 12, cy + 44, '（地轴）', { fill: EARTH, fs: 11.5, anchor: 'end' });
    /* 右侧说明 */
    s += txt(370, 46, '纬线：横着绕圈，指示东西方向', { anchor: 'start', fs: 14 });
    s += txt(370, 74, '经线：竖着连两极，指示南北方向', { anchor: 'start', fs: 14 });
    s += txt(370, 102, '赤道：最长的纬线，分南北半球', { anchor: 'start', fs: 14, fill: '#e25563' });
    s += txt(370, 130, '经纬交叉定位，导航就是这么找路', { anchor: 'start', fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 七大洲面积排行 */
  const continentBars = () => {
    const rows = [
      ['亚洲', 4400, '#2f9bd6'], ['非洲', 3000, '#2fbf71'], ['北美洲', 2400, '#d97745'],
      ['南美洲', 1800, '#8b65c9'], ['南极洲', 1400, '#6fa8c9'], ['欧洲', 1000, '#e25563'], ['大洋洲', 900, EARTH],
    ];
    let s = `<svg class="fig-svg" viewBox="0 0 640 168">`;
    s += txt(320, 16, '七大洲面积（万平方千米 · 约数）', { fs: 14 });
    rows.forEach((r, i) => {
      const y = 30 + i * 18;
      const w = r[1] / 4400 * 380;
      s += txt(96, y + 11, r[0], { anchor: 'end', fs: 13, fill: i === 0 ? '#2f9bd6' : INK, fw: i === 0 ? 900 : 700 });
      s += `<rect x="104" y="${y}" width="${w}" height="13" rx="6" fill="${r[2]}${i === 0 ? '' : 'cc'}"/>`;
      s += txt(112 + w, y + 11, r[1], { anchor: 'start', fs: 12, fill: MUT });
    });
    s += txt(320, 162, '亚洲最大，大洋洲最小；我们中国就在亚洲东部', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 四大洋面积排行 */
  const oceanBars = () => {
    const rows = [
      ['太平洋', 18000, SEA], ['大西洋', 9300, '#4d96ff'], ['印度洋', 7500, '#6fa8c9'], ['北冰洋', 1300, '#9db4d6'],
    ];
    let s = `<svg class="fig-svg" viewBox="0 0 640 130">`;
    s += txt(320, 16, '四大洋面积（万平方千米 · 约数）', { fs: 14 });
    rows.forEach((r, i) => {
      const y = 28 + i * 19;
      const w = Math.max(r[1] / 18000 * 380, 14);
      s += txt(96, y + 11, r[0], { anchor: 'end', fs: 13 });
      s += `<rect x="104" y="${y}" width="${w}" height="13" rx="6" fill="${r[2]}"/>`;
      s += txt(112 + w, y + 11, r[1], { anchor: 'start', fs: 12, fill: MUT });
    });
    s += txt(320, 122, '太平洋最大最深：马里亚纳海沟约 11000 米，比珠峰还深 2000 多米', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 早晨面向太阳辨方向 */
  const sunCompass = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 156">`;
    s += `<line x1="30" y1="128" x2="610" y2="128" stroke="${INK}" stroke-width="2"/>`;
    /* 右侧：升起的太阳（东） */
    s += `<circle cx="510" cy="108" r="26" fill="#f6b93b"/>`;
    for (let a = 0; a < 360; a += 30) {
      const rad = a * Math.PI / 180;
      s += `<line x1="${510 + 32 * Math.cos(rad)}" y1="${108 + 32 * Math.sin(rad)}" x2="${510 + 42 * Math.cos(rad)}" y2="${108 + 42 * Math.sin(rad)}" stroke="#f6b93b" stroke-width="3"/>`;
    }
    s += txt(510, 148, '太阳升起 → 东', { fill: '#c98a12', fs: 14 });
    /* 小朋友面向右（东） */
    s += `<circle cx="250" cy="86" r="15" fill="#f3d3b5" stroke="${INK}" stroke-width="2"/>`;
    s += `<circle cx="256" cy="84" r="2" fill="${INK}"/>`;
    s += `<path d="M 250 101 L 250 124" stroke="${INK}" stroke-width="3"/>`;
    s += `<line x1="250" y1="108" x2="228" y2="100" stroke="${INK}" stroke-width="2.5"/>`;
    s += `<line x1="250" y1="108" x2="272" y2="100" stroke="${INK}" stroke-width="2.5"/>`;
    s += `<line x1="250" y1="124" x2="240" y2="128" stroke="${INK}" stroke-width="2.5"/>`;
    s += `<line x1="250" y1="124" x2="260" y2="128" stroke="${INK}" stroke-width="2.5"/>`;
    /* 方向标注 */
    s += arrow(285, 92, 468, 92, '#e25563');
    s += txt(372, 84, '前面是东', { fill: '#e25563', fs: 13.5 });
    s += arrow(215, 92, 150, 92, SEA);
    s += txt(180, 84, '背后是西', { fill: SEA, fs: 13.5 });
    s += arrow(250, 68, 250, 30, '#2fbf71');
    s += txt(280, 36, '左臂是北', { fill: '#2fbf71', fs: 13.5, anchor: 'start' });
    s += arrow(250, 108, 250, 146, '#d97745');
    s += txt(280, 142, '右臂是南', { fill: '#d97745', fs: 13.5, anchor: 'start' });
    s += txt(96, 66, '早晨', { fill: MUT, fs: 13 });
    s += txt(96, 86, '面向太阳', { fill: MUT, fs: 13 });
    return s + '</svg>';
  };

  /* 比例尺 */
  const scaleBar = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 140">`;
    s += txt(320, 20, '比例尺 1:100000 —— 图上 1 厘米 ＝ 实际 1 千米', { fs: 15 });
    /* 图上距离 */
    s += `<line x1="140" y1="58" x2="350" y2="58" stroke="#e25563" stroke-width="5"/>`;
    s += `<line x1="140" y1="50" x2="140" y2="66" stroke="#e25563" stroke-width="2"/>`;
    s += `<line x1="350" y1="50" x2="350" y2="66" stroke="#e25563" stroke-width="2"/>`;
    s += txt(245, 44, '地图上量得 3 厘米', { fill: '#e25563', fs: 13.5 });
    /* 换算箭头 */
    s += arrow(245, 74, 245, 96, SEA);
    s += txt(268, 90, '× 100000', { fill: SEA, fs: 13.5, anchor: 'start' });
    /* 实际距离：比例尺尺条 */
    for (let i = 0; i < 3; i++) {
      s += `<rect x="${140 + i * 70}" y="100" width="70" height="12" fill="${i % 2 ? '#fff' : INK}" stroke="${INK}" stroke-width="1.5"/>`;
    }
    [0, 1, 2, 3].forEach(i => s += txt(140 + i * 70, 128, i + ' 千米', { fs: 12, fill: MUT }));
    s += arrow(350, 106, 420, 106, '#2fbf71');
    s += txt(432, 110, '实际 3 千米', { fill: '#2fbf71', fs: 14, anchor: 'start' });
    return s + '</svg>';
  };

  /* 常用图例 */
  const legend = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 150">`;
    const items = [
      /* [绘制函数, 名称] */
      [g => { g += `<circle cx="0" cy="0" r="6" fill="${INK}"/>`; return g; }, '城市'],
      [g => { g += `<text x="0" y="6" text-anchor="middle" font-size="16" fill="#c2557d" font-weight="900">★</text>`; return g; }, '首都'],
      [g => { g += `<path d="M -8 6 L 0 -8 L 8 6 Z" fill="${EARTH}"/>`; return g; }, '山峰'],
      [g => { g += `<path d="M -14 0 Q -7 -8 0 0 Q 7 8 14 0" fill="none" stroke="${SEA}" stroke-width="2.5"/>`; return g; }, '河流'],
      [g => { g += `<line x1="-14" y1="0" x2="14" y2="0" stroke="${INK}" stroke-width="4"/>` +
        `<line x1="-14" y1="0" x2="-6" y2="0" stroke="#fff" stroke-width="1.6"/><line x1="0" y1="0" x2="8" y2="0" stroke="#fff" stroke-width="1.6"/>`; return g; }, '铁路'],
      [g => { g += `<line x1="-14" y1="0" x2="14" y2="0" stroke="#c2557d" stroke-width="2" stroke-dasharray="6 3 2 3"/>`; return g; }, '省界 / 国界'],
    ];
    items.forEach((it, i) => {
      const cx = 100 + (i % 3) * 200, cy = 52 + Math.floor(i / 3) * 62;
      s += `<g transform="translate(${cx} ${cy})">${it[0]('')}</g>`;
      s += txt(cx, cy + 26, it[1], { fs: 13 });
    });
    /* 颜色含义 */
    s += txt(320, 138, '颜色也有含义：蓝色＝水，绿色＝平原森林，棕色＝山地高原', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 五种基本地形（纵切面） */
  const landforms = () => {
    const W = 124, GAP = 2, ox = 4;
    const panels = [
      ['山地', '坡陡谷深', '#a5713c', 'M 0 96 L 24 34 L 40 58 L 62 16 L 86 52 L 104 30 L 124 96 Z'],
      ['高原', '顶平海拔高', '#7ba05b', 'M 0 96 L 14 96 L 18 40 L 106 40 L 110 96 L 124 96 Z'],
      ['平原', '低平宽阔', '#5da05b', 'M 0 96 L 10 74 L 114 74 L 124 96 Z'],
      ['丘陵', '和缓起伏', '#8fae5f', 'M 0 96 Q 20 54 42 70 Q 62 84 80 58 Q 102 40 124 96 Z'],
      ['盆地', '四周高中间低', '#b5893a', 'M 0 96 L 12 34 L 34 34 Q 62 92 90 34 L 112 34 L 124 96 Z'],
    ];
    let s = `<svg class="fig-svg" viewBox="0 0 640 150">`;
    panels.forEach((p, i) => {
      const x = ox + i * (W + GAP);
      s += `<g transform="translate(${x} 6)">`;
      s += `<line x1="0" y1="96" x2="124" y2="96" stroke="${LINE}"/>`;
      s += `<path d="${p[3]}" fill="${p[2]}33" stroke="${p[2]}" stroke-width="2.5"/>`;
      s += txt(62, 116, p[0], { fs: 14, fill: p[2] });
      s += txt(62, 134, p[1], { fs: 11.5, fill: MUT });
      s += '</g>';
    });
    return s + '</svg>';
  };

  /* 我国地势三级阶梯 */
  const stairs = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 212">`;
    /* 第一级：青藏高原 */
    s += `<path d="M 26 148 L 26 46 Q 56 32 86 42 L 146 46 L 146 148 Z" fill="#e5dccb" stroke="${EARTH}" stroke-width="2"/>`;
    s += `<path d="M 62 46 L 78 24 L 94 46 Z M 88 46 L 104 28 L 120 46 Z" fill="#fff" stroke="${EARTH}" stroke-width="1.6"/>`;
    s += txt(86, 68, '第一级阶梯', { fs: 12, fill: EARTH });
    s += txt(86, 86, '青藏高原', { fs: 14, fw: 900 });
    s += txt(86, 102, '海拔 4000 米以上', { fs: 10.5, fill: MUT });
    /* 第二级 */
    s += `<path d="M 146 148 L 146 88 L 330 88 L 330 148 Z" fill="#eef0e2" stroke="#8fae5f" stroke-width="2"/>`;
    s += txt(238, 108, '第二级阶梯', { fs: 12.5, fill: '#6c8a45' });
    s += txt(238, 126, '高原、盆地', { fs: 10.5, fill: MUT });
    s += txt(238, 140, '海拔 1000—2000 米', { fs: 10.5, fill: MUT });
    /* 第三级 */
    s += `<path d="M 330 148 L 330 116 L 500 116 L 500 148 Z" fill="#e3f0dd" stroke="#5da05b" stroke-width="2"/>`;
    s += txt(415, 133, '第三级阶梯', { fs: 11, fill: '#4a7c48' });
    s += txt(415, 146, '平原、丘陵 500 米以下', { fs: 10, fill: MUT });
    /* 海洋 */
    s += `<path d="M 500 148 L 500 132 Q 545 126 585 134 Q 615 140 640 132 L 640 148 Z" fill="#cfe8f7" stroke="none"/>`;
    s += `<path d="M 500 140 Q 545 134 640 140" fill="none" stroke="${SEA}" stroke-width="2"/>`;
    s += txt(578, 122, '大 海', { fill: SEA, fs: 13 });
    /* 阶梯分界虚线 */
    s += `<line x1="146" y1="34" x2="146" y2="152" stroke="#e25563" stroke-width="1.6" stroke-dasharray="5 4"/>`;
    s += `<line x1="330" y1="76" x2="330" y2="152" stroke="#e25563" stroke-width="1.6" stroke-dasharray="5 4"/>`;
    /* 江河东流（放在剖面下方，避免压住文字） */
    s += txt(320, 168, '大江大河自西向东，奔流入海', { fill: SEA, fs: 13 });
    s += arrow(80, 182, 610, 182, SEA);
    s += txt(320, 206, '西高东低，像三级大台阶——水往低处流', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 常用天气符号 */
  const weather = () => {
    const items = [['☀️', '晴'], ['⛅', '多云'], ['☁️', '阴'], ['🌧️', '雨'], ['⛈️', '雷阵雨'], ['❄️', '雪'], ['🌫️', '雾'], ['💨', '大风']];
    let s = `<svg class="fig-svg" viewBox="0 0 640 118">`;
    items.forEach((it, i) => {
      const cx = 48 + i * 78;
      s += `<circle cx="${cx}" cy="46" r="27" fill="#fff" stroke="${LINE}" stroke-width="1.5"/>`;
      s += `<text x="${cx}" y="55" text-anchor="middle" font-size="24">${it[0]}</text>`;
      s += txt(cx, 94, it[1], { fs: 13 });
    });
    s += txt(320, 112, '风向＝风来的方向：北风就是从北方吹来的风', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 水循环 */
  const watercycle = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 188">`;
    /* 太阳 */
    s += `<circle cx="86" cy="42" r="20" fill="#f6b93b"/>`;
    for (let a = 0; a < 360; a += 45) {
      const rad = a * Math.PI / 180;
      s += `<line x1="${86 + 25 * Math.cos(rad)}" y1="${42 + 25 * Math.sin(rad)}" x2="${86 + 33 * Math.cos(rad)}" y2="${42 + 33 * Math.sin(rad)}" stroke="#f6b93b" stroke-width="2.5"/>`;
    }
    /* 海洋 */
    s += `<path d="M 0 150 L 0 160 Q 120 148 240 160 L 300 160 L 300 176 L 0 176 Z" fill="#cfe8f7"/>`;
    s += `<path d="M 0 160 Q 120 148 240 160" fill="none" stroke="${SEA}" stroke-width="2"/>`;
    s += txt(120, 144, '海 洋', { fill: SEA, fs: 14 });
    /* 山与河流 */
    s += `<path d="M 470 160 L 545 52 L 620 160 Z" fill="#e5dccb" stroke="${EARTH}" stroke-width="2"/>`;
    s += `<path d="M 545 52 L 566 84 Q 545 96 524 84 Z" fill="#fff"/>`;
    s += `<path d="M 545 100 Q 520 140 480 160 L 452 160" fill="none" stroke="${SEA}" stroke-width="3"/>`;
    s += txt(560, 178, '山地河流', { fill: MUT, fs: 12 });
    /* 云与雨 */
    s += `<ellipse cx="330" cy="46" rx="44" ry="18" fill="#e7ecf5" stroke="#b9c7de" stroke-width="1.5"/>`;
    s += `<ellipse cx="368" cy="38" rx="26" ry="14" fill="#f2f5fa" stroke="#b9c7de" stroke-width="1.5"/>`;
    for (let i = 0; i < 5; i++) s += `<line x1="${306 + i * 14}" y1="66" x2="${300 + i * 14}" y2="84" stroke="${SEA}" stroke-width="2"/>`;
    s += txt(330, 106, '降水', { fill: SEA, fs: 13 });
    /* 循环箭头 */
    s += arrow(170, 128, 260, 62, '#e2943a');
    s += txt(178, 86, '蒸发', { fill: '#e2943a', fs: 13.5 });
    s += arrow(400, 60, 480, 46, '#8fae5f');
    s += txt(444, 42, '成云移动', { fill: '#8fae5f', fs: 12.5 });
    s += arrow(460, 152, 320, 152, '#6fa8c9');
    s += txt(388, 146, '汇流入海', { fill: '#6fa8c9', fs: 13 });
    s += txt(320, 182, '水循环：蒸发 → 成云 → 降水 → 汇流，循环不息', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 长江黄河流向示意 */
  const rivers = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 178">`;
    s += txt(320, 16, '长江、黄河流向示意图（不按真实比例）', { fs: 13.5, fill: MUT });
    /* 黄河：几字形 */
    s += `<path d="M 60 60 L 190 60 L 190 34 L 400 34 L 400 62 L 560 62" fill="none" stroke="#d9a13c" stroke-width="4.5" stroke-linejoin="round" marker-end="url(#gfig-arrow)"/>`;
    s += `<circle cx="60" cy="60" r="5" fill="#d9a13c"/>`;
    s += txt(60, 44, '发源：青藏高原', { fs: 12, fill: '#a97b22' });
    s += txt(295, 26, '流经黄土高原，带走大量泥沙', { fs: 12, fill: '#a97b22' });
    s += txt(588, 66, '渤海', { fill: '#a97b22', fs: 13, anchor: 'start' });
    s += txt(320, 88, '黄河 · 全长约 5464 千米 · 我国第二长河', { fs: 13.5, fill: '#a97b22' });
    /* 长江 */
    s += `<path d="M 60 128 Q 170 108 260 124 Q 350 140 450 120 Q 520 108 560 118" fill="none" stroke="${SEA}" stroke-width="4.5" marker-end="url(#gfig-arrow)"/>`;
    s += `<circle cx="60" cy="128" r="5" fill="${SEA}"/>`;
    s += txt(60, 152, '发源：唐古拉山', { fs: 12, fill: SEA });
    s += txt(300, 152, '三峡', { fs: 12, fill: MUT });
    s += txt(588, 122, '东海', { fill: SEA, fs: 13, anchor: 'start' });
    s += txt(320, 172, '长江 · 全长约 6300 千米 · 我国第一大河', { fs: 13.5, fill: SEA });
    return s + '</svg>';
  };

  /* 昼夜与时差 */
  const dayNight = () => {
    const cx = 330, cy = 92, R = 56;
    let s = `<svg class="fig-svg" viewBox="0 0 640 184">`;
    /* 太阳 */
    s += `<circle cx="80" cy="92" r="26" fill="#f6b93b"/>`;
    for (let a = 0; a < 360; a += 30) {
      const rad = a * Math.PI / 180;
      s += `<line x1="${80 + 32 * Math.cos(rad)}" y1="${92 + 32 * Math.sin(rad)}" x2="${80 + 42 * Math.cos(rad)}" y2="${92 + 42 * Math.sin(rad)}" stroke="#f6b93b" stroke-width="3"/>`;
    }
    s += txt(80, 140, '太阳光', { fill: '#c98a12', fs: 13 });
    s += arrow(122, 92, cx - R - 12, 92, '#e2943a');
    /* 地球：亮面朝太阳（左），暗面在右 */
    s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#e8f3fc" stroke="${SEA}" stroke-width="2.5"/>`;
    s += `<path d="M ${cx} ${cy - R} A ${R} ${R} 0 0 0 ${cx} ${cy + R} Z" fill="#f7d774" opacity="0.55"/>`;
    s += `<path d="M ${cx} ${cy - R} A ${R} ${R} 0 0 1 ${cx} ${cy + R} Z" fill="#2b2f4a" opacity="0.5"/>`;
    s += txt(cx - 26, cy - 34, '昼半球', { fs: 12.5, fill: '#a97b22' });
    s += txt(cx + 28, cy + 40, '夜半球', { fs: 12.5, fill: '#cdd2e4' });
    /* 自转箭头 */
    s += `<path d="M ${cx + R + 16} ${cy - 20} A ${R + 16} ${R + 16} 0 0 1 ${cx + R + 16} ${cy + 20}" fill="none" stroke="#e25563" stroke-width="2.5" marker-end="url(#gfig-arrow)"/>`;
    s += txt(cx + R + 44, cy, '自转', { fill: '#e25563', fs: 13 });
    /* 城市点 */
    s += `<circle cx="${cx - 34}" cy="${cy - 12}" r="4" fill="#e25563"/>`;
    s += txt(cx - 34, cy + 14, '北京（白天）', { fs: 11.5 });
    s += `<circle cx="${cx + 36}" cy="${cy + 4}" r="4" fill="#73788b"/>`;
    s += txt(cx + 40, cy - 12, '伦敦（黑夜）', { fs: 11.5, fill: MUT, anchor: 'start' });
    s += txt(320, 172, '地球自西向东自转，东边先看到日出——所以各地时间有早有晚', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 世界地标（HTML 卡片流） */
  const landmarks = () => {
    const stops = [
      ['🔺', '金字塔', '埃及'],
      ['🗼', '埃菲尔铁塔', '法国'],
      ['🐉', '长城', '中国'],
      ['🗻', '富士山', '日本'],
      ['🎭', '悉尼歌剧院', '澳大利亚'],
      ['🗽', '自由女神像', '美国'],
      ['🏟️', '罗马斗兽场', '意大利'],
      ['🏔️', '珠穆朗玛峰', '中国 / 尼泊尔'],
    ];
    return '<div class="fig-flow">' + stops.map(st =>
      `<div class="fig-stop"><span class="fig-stop-ico">${st[0]}</span><b>${st[1]}</b><i>${st[2]}</i></div>`
    ).join('') + '</div>';
  };

  /* ================= 互动演示 ================= */

  /* 方向罗盘 */
  const DIRS = {
    'north': { label: '北', ang: -90, note: '北：地图的上方通常就是它，晚上北极星指向这里' },
    'northeast': { label: '东北', ang: -45, note: '东北：在北和东之间，也叫北偏东 45°' },
    'east': { label: '东', ang: 0, note: '东：太阳升起的方向' },
    'southeast': { label: '东南', ang: 45, note: '东南：在东和南之间，也叫南偏东 45°' },
    'south': { label: '南', ang: 90, note: '南：面向东方时，它在你的右边' },
    'southwest': { label: '西南', ang: 135, note: '西南：在南和西之间，也叫南偏西 45°' },
    'west': { label: '西', ang: 180, note: '西：太阳落山的方向' },
    'northwest': { label: '西北', ang: -135, note: '西北：在北和西之间，也叫北偏西 45°' },
  };
  const demoCompass = () => {
    const cx = 320, cy = 96, R = 66;
    let s = `<svg class="fig-svg" viewBox="0 0 640 176">`;
    s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#fbfcff" stroke="${LINE}" stroke-width="2"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="5" fill="#e25563"/>`;
    Object.keys(DIRS).forEach(k => {
      const d = DIRS[k];
      const rad = d.ang * Math.PI / 180;
      const tx = cx + (R - 16) * Math.cos(rad), ty = cy + (R - 16) * Math.sin(rad);
      const major = k.length === 5; /* 四个正方向 id 长度 5，斜角 9 */
      s += `<line x1="${cx + 10 * Math.cos(rad)}" y1="${cy + 10 * Math.sin(rad)}" x2="${cx + (R - (major ? 18 : 26)) * Math.cos(rad)}" y2="${cy + (R - (major ? 18 : 26)) * Math.sin(rad)}" stroke="${major ? '#9db4d6' : LINE}" stroke-width="${major ? 2 : 1.4}"/>`;
      s += `<text x="${tx}" y="${ty + 5}" text-anchor="middle" font-size="${major ? 14 : 11.5}" font-weight="800" fill="${major ? INK : MUT}" data-dir-label="${k}">${d.label}</text>`;
    });
    s += `<g class="compass-hi"></g>`;
    s += `<text class="compass-note" x="320" y="168" text-anchor="middle" font-size="14" font-weight="800" fill="#2f9bd6"></text>`;
    return s + '</svg>' +
      `<div class="fig-ctrl">` +
      Object.keys(DIRS).map(k =>
        `<button class="fig-btn" data-fig-act="geo-compass" data-v="${k}">${DIRS[k].label}</button>`).join('') +
      `</div>`;
  };
  function compassApply(fig, dir, btn) {
    const d = DIRS[dir];
    if (!d) return;
    const cx = 320, cy = 96, R = 66;
    const rad = d.ang * Math.PI / 180;
    const ex = cx + (R - 8) * Math.cos(rad), ey = cy + (R - 8) * Math.sin(rad);
    fig.querySelector('.compass-hi').innerHTML =
      `<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="#e25563" stroke-width="3.5"/>` +
      `<circle cx="${ex}" cy="${ey}" r="5" fill="#e25563"/>`;
    fig.querySelector('.compass-note').textContent = d.note;
    fig.querySelectorAll('[data-dir-label]').forEach(t => {
      t.setAttribute('fill', t.dataset.dirLabel === dir ? '#e25563' : (t.textContent.length === 1 ? '#34384d' : '#73788b'));
    });
    fig.querySelectorAll('[data-fig-act="geo-compass"]').forEach(b => b.classList.toggle('fig-on', b === btn));
  }

  /* 四季的成因 */
  const SEASONS = {
    spring: { label: '春分 · 3 月', pos: 'top', note: '太阳直射赤道——北半球春季，全球昼夜差不多等长' },
    summer: { label: '夏至 · 6 月', pos: 'left', note: '太阳直射北回归线（23.5°N）——北半球夏季，白昼最长' },
    autumn: { label: '秋分 · 9 月', pos: 'bottom', note: '太阳直射赤道——北半球秋季，全球昼夜差不多等长' },
    winter: { label: '冬至 · 12 月', pos: 'right', note: '太阳直射南回归线（23.5°S）——北半球冬季，白昼最短' },
  };
  const demoSeasons = () => {
    const cx = 320, cy = 96, rx = 205, ry = 62;
    const posMap = { top: [cx, cy - ry], bottom: [cx, cy + ry], left: [cx - rx, cy], right: [cx + rx, cy] };
    let s = `<svg class="fig-svg" viewBox="0 0 640 196">`;
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${LINE}" stroke-width="1.8" stroke-dasharray="6 4"/>`;
    /* 太阳 */
    s += `<circle cx="${cx}" cy="${cy}" r="24" fill="#f6b93b"/>`;
    for (let a = 0; a < 360; a += 45) {
      const rad = a * Math.PI / 180;
      s += `<line x1="${cx + 29 * Math.cos(rad)}" y1="${cy + 29 * Math.sin(rad)}" x2="${cx + 37 * Math.cos(rad)}" y2="${cy + 37 * Math.sin(rad)}" stroke="#f6b93b" stroke-width="2.5"/>`;
    }
    s += txt(cx + 42, cy - 16, '太阳', { fill: '#c98a12', fs: 12.5, anchor: 'start' });
    /* 四个位置的地轴都朝同一方向倾斜（约 23.5°，向右上） */
    Object.keys(SEASONS).forEach(k => {
      const [px, py] = posMap[SEASONS[k].pos];
      s += `<g class="season-earth" data-season="${k}">`;
      s += `<line x1="${px - 8}" y1="${py + 15}" x2="${px + 8}" y2="${py - 15}" stroke="#b5893a" stroke-width="1.8" stroke-dasharray="3 2"/>`;
      s += `<circle cx="${px}" cy="${py}" r="13" fill="#e8f3fc" stroke="${SEA}" stroke-width="2"/>`;
      /* 直射标记：小太阳点 */
      s += `<circle class="season-dot" cx="${px}" cy="${py}" r="3" fill="#e25563"/>`;
      s += `</g>`;
      let lx = px, ly = py - 26, anchor = 'middle';
      if (SEASONS[k].pos === 'bottom') { lx = px + 22; ly = py + 4; anchor = 'start'; } /* 避开底部提示文字 */
      else if (SEASONS[k].pos === 'left' || SEASONS[k].pos === 'right') { ly = py + 34; }
      s += txt(lx, ly, SEASONS[k].label, { fs: 13, cls: 'season-label', fill: MUT, anchor });
    });
    s += txt(cx, cy - ry - 40, '地轴都朝同一方向倾斜 —— 直射点在南北回归线之间移动', { fs: 12.5, fill: MUT });
    s += `<text class="season-note" x="320" y="190" text-anchor="middle" font-size="14" font-weight="800" fill="#2f9bd6"></text>`;
    return s + '</svg>' +
      `<div class="fig-ctrl">` +
      Object.keys(SEASONS).map(k =>
        `<button class="fig-btn" data-fig-act="geo-season" data-v="${k}">${SEASONS[k].label}</button>`).join('') +
      `</div>`;
  };
  function seasonApply(fig, season, btn) {
    if (!SEASONS[season]) return;
    fig.querySelector('.season-note').textContent = SEASONS[season].note;
    fig.querySelectorAll('.season-earth').forEach(g => {
      const on = g.dataset.season === season;
      g.querySelector('circle').setAttribute('stroke', on ? '#e25563' : SEA);
      g.querySelector('circle').setAttribute('stroke-width', on ? 3.5 : 2);
    });
    fig.querySelectorAll('[data-fig-act="geo-season"]').forEach(b => b.classList.toggle('fig-on', b === btn));
  }

  /* ---------- 注册表 ---------- */
  const REG = {
    'geo-earth-size': earthSize,
    'geo-globe': globe,
    'geo-continent-bars': continentBars,
    'geo-ocean-bars': oceanBars,
    'geo-sun-compass': sunCompass,
    'geo-scale': scaleBar,
    'geo-legend': legend,
    'geo-landforms': landforms,
    'geo-stairs': stairs,
    'geo-weather': weather,
    'geo-watercycle': watercycle,
    'geo-rivers': rivers,
    'geo-day-night': dayNight,
    'geo-landmarks': landmarks,
    'demo-geo-compass': demoCompass,
    'demo-geo-seasons': demoSeasons,
  };

  const DEFAULT_CAPS = {
    'demo-geo-compass': '互动演示：点方向按钮，看它在哪里、怎么说',
    'demo-geo-seasons': '互动演示：切换节气，看太阳直射点在哪里、北半球是什么季节',
    'geo-globe': '地球仪：纬线横着绕圈，经线竖着连两极（经纬线是假想的线）',
    'geo-earth-size': '地球的数字档案：半径约 6400 千米，海洋约占七成',
    'geo-landforms': '五种基本地形（纵切面示意）',
    'geo-stairs': '我国地势西高东低，像三级大台阶',
    'geo-watercycle': '水循环：蒸发 → 成云 → 降水 → 汇流，循环不息',
    'geo-rivers': '长江、黄河都发源于青藏高原，自西向东奔流入海',
    'geo-day-night': '地球自转产生昼夜交替，东边的城市先看到日出',
    'geo-sun-compass': '早晨面向太阳：前面是东，背后是西，左臂是北，右臂是南',
    'geo-scale': '比例尺 1:100000：图上 1 厘米代表实际 1 千米',
    'geo-legend': '常见地图图例',
    'geo-weather': '常用天气符号',
    'geo-continent-bars': '七大洲按面积排行',
    'geo-ocean-bars': '四大洋按面积排行',
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
      if (act === 'geo-compass') compassApply(fig, b.dataset.v, b);
      else if (act === 'geo-season') seasonApply(fig, b.dataset.v, b);
    });
  }

  /* 初始化静态演示（渲染后无需再调用；委托自动工作） */
  if (typeof document !== 'undefined') {
    bindDelegates(document);
    const initIn = root => {
      root.querySelectorAll('.fig').forEach(fig => {
        const id = fig.dataset.fig;
        if (id === 'demo-geo-compass' && !fig.dataset.init) { compassApply(fig, 'north', fig.querySelector('[data-fig-act="geo-compass"]')); fig.dataset.init = '1'; }
        else if (id === 'demo-geo-seasons' && !fig.dataset.init) { seasonApply(fig, 'summer', fig.querySelector('[data-fig-act="geo-season"]')); fig.dataset.init = '1'; }
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
  module.exports = { FIG_IDS: GeoFigures.FIG_IDS, has: GeoFigures.has };
}
if (typeof window !== 'undefined') {
  window.GeoFigures = GeoFigures;
}

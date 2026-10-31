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

  /* ================= 单元横幅（八大学习站点） ================= */

  /* 通用横幅底色 + 圆角矩形 */
  const banner = (bg, inner) =>
    `<svg class="fig-svg" viewBox="0 0 720 120" preserveAspectRatio="xMidYMid slice">` +
    `<rect x="0" y="0" width="720" height="120" rx="14" fill="${bg}"/>${inner}</svg>`;

  /* 第一站：认识地球 —— 旋转的地球 + 经纬线 */
  const bnEarth = () => banner('#e6f3fb',
    `<g transform="translate(360 60)">` +
    `<g class="anim-spin-slow"><circle r="46" fill="#2f9bd6" opacity=".18"/>` +
    `<ellipse rx="46" ry="12" fill="none" stroke="#2f9bd6" stroke-width="1.6"/>` +
    `<ellipse rx="46" ry="28" fill="none" stroke="#2f9bd6" stroke-width="1.2" opacity=".6"/>` +
    `<ellipse rx="14" ry="46" fill="none" stroke="#2f9bd6" stroke-width="1.2" opacity=".6"/>` +
    `<ellipse rx="30" ry="46" fill="none" stroke="#2f9bd6" stroke-width="1.2" opacity=".5"/>` +
    `</g>` +
    `<circle r="42" fill="#7ec9ee" opacity=".35" stroke="#2f9bd6" stroke-width="2"/>` +
    `<path d="M -28 -10 Q -14 -26 6 -18 Q 22 -8 18 10 Q 4 24 -16 14 Q -32 4 -28 -10 Z" fill="#7ba05b" opacity=".8"/>` +
    `<path d="M 14 18 Q 28 14 30 26 Q 20 30 14 24 Z" fill="#7ba05b" opacity=".7"/>` +
    `</g>` +
    txt(120, 64, '🌍 认识地球', { fs: 22, fw: 900, fill: '#1d5e8c', anchor: 'start' }) +
    txt(120, 90, '地球仪 · 经纬线 · 七大洲四大洋', { fs: 13.5, fill: '#3d7aa8', anchor: 'start' })
  );

  /* 第二站：方向与地图 —— 罗盘 + 地图 */
  const bnMap = () => banner('#e8f6ef',
    `<g transform="translate(600 60)">` +
    `<circle r="42" fill="#fff" stroke="#2fbf71" stroke-width="2"/>` +
    `<polygon points="0,-34 7,0 0,34 -7,0" fill="#e25563"/>` +
    `<polygon points="0,-34 7,0 0,0" fill="#c2414d"/>` +
    `<text x="0" y="-46" text-anchor="middle" font-size="14" font-weight="900" fill="#2fbf71">北</text>` +
    `<text x="0" y="56" text-anchor="middle" font-size="14" font-weight="900" fill="#73788b">南</text>` +
    `<text x="-52" y="5" text-anchor="middle" font-size="14" font-weight="900" fill="#73788b">西</text>` +
    `<text x="52" y="5" text-anchor="middle" font-size="14" font-weight="900" fill="#73788b">东</text>` +
    `</g>` +
    txt(120, 64, '🧭 方向与地图', { fs: 22, fw: 900, fill: '#1d7d4e', anchor: 'start' }) +
    txt(120, 90, '八向定位 · 比例尺 · 图例', { fs: 13.5, fill: '#3d9d6e', anchor: 'start' })
  );

  /* 第三站：地形地貌 —— 山脉 + 阶梯 */
  const bnLand = () => banner('#f5efe2',
    `<g transform="translate(560 70)">` +
    `<path d="M -120 40 L -70 -20 L -40 10 L 0 -40 L 40 5 L 80 -25 L 120 40 Z" fill="#c9a26b" stroke="#a5713c" stroke-width="2"/>` +
    `<path d="M -70 -20 L -58 -6 L -46 -16 Z M 0 -40 L -12 -18 L 8 -22 Z M 80 -25 L 68 -4 L 92 -8 Z" fill="#fff" stroke="#a5713c" stroke-width="1.2"/>` +
    `</g>` +
    txt(120, 64, '🏔️ 地形地貌', { fs: 22, fw: 900, fill: '#7a5327', anchor: 'start' }) +
    txt(120, 90, '五种地形 · 三级阶梯 · 沙漠绿洲', { fs: 13.5, fill: '#9a7340', anchor: 'start' })
  );

  /* 第四站：天气与气候 —— 太阳 + 云 + 雨 */
  const bnWeather = () => banner('#fdeef0',
    `<g transform="translate(600 56)">` +
    `<g class="anim-sun-rays"><circle r="22" fill="#f6b93b"/>` +
    `<g stroke="#f6b93b" stroke-width="3">` +
    `<line x1="0" y1="-30" x2="0" y2="-38"/><line x1="0" y1="30" x2="0" y2="38"/>` +
    `<line x1="-30" y1="0" x2="-38" y2="0"/><line x1="30" y1="0" x2="38" y2="0"/>` +
    `<line x1="-21" y1="-21" x2="-27" y2="-27"/><line x1="21" y1="21" x2="27" y2="27"/>` +
    `<line x1="-21" y1="21" x2="-27" y2="27"/><line x1="21" y1="-21" x2="27" y2="-27"/>` +
    `</g></g>` +
    `</g>` +
    `<g transform="translate(470 78)" class="anim-float">` +
    `<ellipse cx="0" cy="0" rx="34" ry="14" fill="#e7ecf5" stroke="#b9c7de" stroke-width="1.5"/>` +
    `<ellipse cx="22" cy="-6" rx="18" ry="11" fill="#f2f5fa" stroke="#b9c7de" stroke-width="1.5"/>` +
    `</g>` +
    txt(120, 64, '🌦️ 天气与气候', { fs: 22, fw: 900, fill: '#a8354a', anchor: 'start' }) +
    txt(120, 90, '天气预报 · 四季成因 · 气温降水', { fs: 13.5, fill: '#c8556a', anchor: 'start' })
  );

  /* 第五站：江河湖海 —— 河流 + 波浪 */
  const bnRiver = () => banner('#e3f4f1',
    `<g transform="translate(560 60)">` +
    `<path d="M -140 30 Q -80 -10 -20 10 Q 40 30 120 -6" fill="none" stroke="#157d73" stroke-width="5" stroke-linecap="round" class="anim-flow"/>` +
    `<circle cx="-140" cy="30" r="5" fill="#157d73"/>` +
    `<path d="M 120 -6 L 132 -12 M 120 -6 L 128 4" stroke="#157d73" stroke-width="3" fill="none"/>` +
    `<g class="anim-wave" opacity=".5">` +
    `<path d="M -120 50 Q -90 44 -60 50 Q -30 56 0 50 Q 30 44 60 50" fill="none" stroke="#6fa8c9" stroke-width="2.5"/>` +
    `</g>` +
    `</g>` +
    txt(120, 64, '🌊 江河湖海', { fs: 22, fw: 900, fill: '#0f5f57', anchor: 'start' }) +
    txt(120, 90, '水循环 · 长江黄河 · 湖泊海域', { fs: 13.5, fill: '#2f8a80', anchor: 'start' })
  );

  /* 第六站：我们的祖国 —— 中国轮廓 + 五星 */
  const bnChina = () => banner('#fbeee4',
    `<g transform="translate(580 60) scale(0.62)">` +
    `<path d="M -120 -40 Q -80 -60 -30 -50 Q 0 -55 30 -40 Q 70 -50 110 -30 Q 140 -10 130 20 Q 120 50 80 55 Q 40 60 0 50 Q -50 60 -90 40 Q -130 20 -120 -40 Z" fill="#e8a87c" stroke="#d97745" stroke-width="2.5"/>` +
    `<path d="M -100 -20 L -80 -30 L -70 -10 L -90 0 Z" fill="#d97745" opacity=".5"/>` +
    `<text x="-30" y="10" font-size="28">🇨🇳</text>` +
    `</g>` +
    txt(120, 64, '🇨🇳 我们的祖国', { fs: 22, fw: 900, fill: '#9c5a2c', anchor: 'start' }) +
    txt(120, 90, '疆域 · 34省区 · 56民族 · 邻国', { fs: 13.5, fill: '#b97a48', anchor: 'start' })
  );

  /* 第七站：环游世界 —— 地球 + 飞机 */
  const bnWorld = () => banner('#efeafb',
    `<g transform="translate(590 60)">` +
    `<circle r="40" fill="#8b65c9" opacity=".15" stroke="#8b65c9" stroke-width="2"/>` +
    `<path d="M -30 -8 Q -16 -20 0 -14 Q 16 -6 12 8 Q 0 18 -16 10 Q -30 2 -30 -8 Z" fill="#7ba05b" opacity=".7"/>` +
    `<path d="M 10 12 Q 24 8 26 20 Q 14 24 10 18 Z" fill="#7ba05b" opacity=".6"/>` +
    `<line x1="-40" y1="0" x2="40" y2="0" stroke="#8b65c9" stroke-width="1" stroke-dasharray="3 3"/>` +
    `</g>` +
    `<g transform="translate(470 40)" class="anim-bob">` +
    `<text font-size="28">✈️</text>` +
    `</g>` +
    txt(120, 64, '🌏 环游世界', { fs: 22, fw: 900, fill: '#5e3fa0', anchor: 'start' }) +
    txt(120, 90, '国家地区 · 世界之最 · 时差地标', { fs: 13.5, fill: '#7c5cc0', anchor: 'start' })
  );

  /* 第八站：生活与地理 —— 房屋 + 树 + 回收标志 */
  const bnLife = () => banner('#fbe9f0',
    `<g transform="translate(590 64)">` +
    `<rect x="-40" y="-10" width="80" height="40" fill="#e8b8c8" stroke="#c2557d" stroke-width="2" rx="3"/>` +
    `<polygon points="-46,-10 0,-40 46,-10" fill="#c2557d"/>` +
    `<rect x="-12" y="6" width="14" height="24" fill="#a8456a"/>` +
    `<rect x="14" y="2" width="16" height="14" fill="#fdeef0" stroke="#c2557d" stroke-width="1.5"/>` +
    `</g>` +
    `<g transform="translate(470 70)" class="anim-bob">` +
    `<text font-size="26">🌳</text>` +
    `</g>` +
    `<g transform="translate(520 30)" class="anim-pulse">` +
    `<text font-size="22">♻️</text>` +
    `</g>` +
    txt(120, 64, '🏙️ 生活与地理', { fs: 22, fw: 900, fill: '#9c3a62', anchor: 'start' }) +
    txt(120, 90, '衣食住行 · 资源灾害 · 环保', { fs: 13.5, fill: '#bc5a82', anchor: 'start' })
  );

  /* ================= 新增知识点图示 ================= */

  /* 地球的形状：天圆地方 vs 球体 + 麦哲伦航线 */
  const earthShape = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    /* 左：天圆地方 */
    s += `<g transform="translate(130 80)">`;
    s += `<path d="M -70 -30 A 70 70 0 0 1 70 -30" fill="none" stroke="#b5893a" stroke-width="2.5"/>`;
    s += `<rect x="-60" y="-30" width="120" height="22" fill="#e8dcc4" stroke="#a5713c" stroke-width="2"/>`;
    s += `<line x1="-60" y1="-30" x2="60" y2="-30" stroke="#a5713c" stroke-width="2"/>`;
    s += `<text x="0" y="-44" text-anchor="middle" font-size="13" font-weight="800" fill="#7a5327">古人：天圆地方</text>`;
    s += `</g>`;
    s += arrow(220, 80, 290, 80, '#e25563');
    /* 右：蓝色星球 + 帆船 */
    s += `<g transform="translate(440 80)">`;
    s += `<circle r="52" fill="#7ec9ee" opacity=".4" stroke="#2f9bd6" stroke-width="2.5" class="anim-spin-slow"/>`;
    s += `<circle r="52" fill="#2f9bd6" opacity=".12"/>`;
    s += `<path d="M -28 -14 Q -12 -28 8 -18 Q 24 -8 18 12 Q 4 26 -18 16 Q -34 4 -28 -14 Z" fill="#7ba05b" opacity=".8"/>`;
    s += `<path d="M 16 16 Q 30 12 32 26 Q 20 30 14 22 Z" fill="#7ba05b" opacity=".7"/>`;
    /* 帆船在弧面上 */
    s += `<g transform="translate(38 14)" class="anim-bob">`;
    s += `<path d="M -10 0 L 10 0 L 6 8 L -6 8 Z" fill="#a5713c"/>`;
    s += `<line x1="0" y1="0" x2="0" y2="-18" stroke="#5a4020" stroke-width="1.5"/>`;
    s += `<path d="M 0 -18 L 10 -4 L 0 -4 Z" fill="#f3d3b5" stroke="#5a4020" stroke-width="1"/>`;
    s += `</g>`;
    s += `</g>`;
    s += txt(440, 156, '今天：蓝色星球（两极稍扁、赤道略鼓）', { fs: 13, fill: MUT });
    s += txt(320, 24, '麦哲伦船队环球航行（1519—1522）证明地球是球体', { fs: 13.5, fill: INK });
    return s + '</svg>';
  };

  /* 画平面图与路线 */
  const floorplan = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 200">`;
    s += txt(320, 18, '画平面图四步：定方向 → 定地点 → 画路线 → 加图例', { fs: 13.5, fill: MUT });
    /* 指向标 */
    s += `<g transform="translate(70 70)">`;
    s += `<circle r="26" fill="#fff" stroke="#2fbf71" stroke-width="2"/>`;
    s += `<polygon points="0,-20 5,0 0,20 -5,0" fill="#e25563"/>`;
    s += `<text x="0" y="-30" text-anchor="middle" font-size="13" font-weight="800" fill="#2fbf71">北</text>`;
    s += `</g>`;
    /* 平面图主体 */
    s += `<g transform="translate(250 50)">`;
    s += `<rect x="0" y="0" width="300" height="120" fill="#fafbfe" stroke="#b9c7de" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    /* 家 */
    s += `<rect x="20" y="20" width="50" height="40" fill="#eef7f3" stroke="#2fbf71" stroke-width="2"/>`;
    s += txt(45, 44, '家', { fs: 13, fill: '#2c6e54' });
    /* 商店 */
    s += `<rect x="140" y="20" width="50" height="40" fill="#fff3e0" stroke="#d97745" stroke-width="2"/>`;
    s += txt(165, 44, '商店', { fs: 12, fill: '#9c5a2c' });
    /* 学校 */
    s += `<rect x="230" y="60" width="50" height="40" fill="#e8f0fd" stroke="#2f9bd6" stroke-width="2"/>`;
    s += txt(255, 84, '学校', { fs: 13, fill: '#1d5e8c' });
    /* 路线箭头：先向东再向北 */
    s += `<path d="M 70 40 L 140 40" fill="none" stroke="#e25563" stroke-width="3" marker-end="url(#gfig-arrow)" class="anim-flow"/>`;
    s += txt(105, 32, '东 200 米', { fs: 11.5, fill: '#e25563' });
    s += `<path d="M 165 60 L 165 80 L 230 80" fill="none" stroke="#2f9bd6" stroke-width="3" marker-end="url(#gfig-arrow)" class="anim-flow2"/>`;
    s += txt(200, 74, '北 100 米', { fs: 11.5, fill: '#2f9bd6' });
    s += `</g>`;
    /* 图例 */
    s += txt(70, 140, '图例', { fs: 13, fw: 800, anchor: 'start' });
    s += `<rect x="70" y="150" width="14" height="10" fill="#eef7f3" stroke="#2fbf71"/>` + txt(90, 160, '家', { fs: 12, anchor: 'start', fill: MUT });
    s += `<rect x="130" y="150" width="14" height="10" fill="#fff3e0" stroke="#d97745"/>` + txt(150, 160, '商店', { fs: 12, anchor: 'start', fill: MUT });
    s += `<rect x="200" y="150" width="14" height="10" fill="#e8f0fd" stroke="#2f9bd6"/>` + txt(220, 160, '学校', { fs: 12, anchor: 'start', fill: MUT });
    s += `<line x1="280" y1="155" x2="310" y2="155" stroke="#e25563" stroke-width="3"/>` + txt(316, 160, '路线', { fs: 12, anchor: 'start', fill: MUT });
    return s + '</svg>';
  };

  /* 名山、高原和平原 */
  const chinaLandscape = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    /* 左：珠峰 */
    s += `<g transform="translate(110 90)">`;
    s += `<path d="M -70 50 L -10 -50 L 20 -10 L 50 -38 L 80 50 Z" fill="#e5dccb" stroke="#a5713c" stroke-width="2"/>`;
    s += `<path d="M -10 -50 L -26 -22 L 6 -28 Z M 50 -38 L 36 -14 L 60 -18 Z" fill="#fff" stroke="#a5713c" stroke-width="1.4"/>`;
    s += txt(0, 70, '珠穆朗玛峰', { fs: 13, fill: '#7a5327' });
    s += txt(0, 86, '约 8848.86 米', { fs: 11.5, fill: MUT });
    s += `</g>`;
    /* 中：青藏高原 */
    s += `<g transform="translate(320 90)">`;
    s += `<rect x="-80" y="-10" width="160" height="50" fill="#e8dcc4" stroke="#a5713c" stroke-width="2"/>`;
    s += `<path d="M -60 -10 L -44 -34 L -28 -10 Z M -10 -10 L 6 -38 L 22 -10 Z M 36 -10 L 52 -28 L 68 -10 Z" fill="#fff" stroke="#a5713c" stroke-width="1.3"/>`;
    s += txt(0, 64, '青藏高原', { fs: 13, fill: '#7a5327' });
    s += txt(0, 80, '世界屋脊 · 4000 米以上', { fs: 11.5, fill: MUT });
    s += `</g>`;
    /* 右：东北平原 */
    s += `<g transform="translate(530 90)">`;
    s += `<path d="M -80 40 L -70 20 L 70 20 L 80 40 Z" fill="#cfe8c8" stroke="#5da05b" stroke-width="2"/>`;
    s += `<path d="M -70 20 Q -40 14 -10 20 Q 20 26 50 18 Q 70 14 70 20" fill="none" stroke="#5da05b" stroke-width="1.5"/>`;
    s += txt(0, 60, '东北平原', { fs: 13, fill: '#3d7a3d' });
    s += txt(0, 76, '我国最大平原', { fs: 11.5, fill: MUT });
    s += `</g>`;
    s += txt(320, 168, '四大高原：青藏、内蒙古、黄土、云贵　三大平原：东北、华北、长江中下游', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* 沙漠与绿洲 */
  const desertOasis = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    /* 沙漠 */
    s += `<path d="M 0 140 Q 120 110 240 130 Q 360 150 480 120 Q 560 105 640 125 L 640 170 L 0 170 Z" fill="#f0d9a8" stroke="#d9a13c" stroke-width="2"/>`;
    s += `<path d="M 0 150 Q 160 130 320 145 Q 480 160 640 140" fill="none" stroke="#d9a13c" stroke-width="1.5" opacity=".6"/>`;
    /* 太阳 */
    s += `<circle cx="540" cy="40" r="20" fill="#f6b93b" class="anim-pulse"/>`;
    /* 仙人掌 */
    s += `<g transform="translate(80 110)">`;
    s += `<rect x="-6" y="-40" width="12" height="44" rx="6" fill="#5da05b"/>`;
    s += `<rect x="-20" y="-26" width="10" height="20" rx="5" fill="#5da05b"/>`;
    s += `<rect x="10" y="-32" width="10" height="24" rx="5" fill="#5da05b"/>`;
    s += `</g>`;
    /* 绿洲 */
    s += `<g transform="translate(400 120)">`;
    s += `<ellipse cx="0" cy="10" rx="70" ry="20" fill="#7ec9ee" opacity=".6" stroke="#2f9bd6" stroke-width="1.5"/>`;
    s += `<ellipse cx="0" cy="6" rx="70" ry="20" fill="#2f9bd6" opacity=".15"/>`;
    s += txt(0, 14, '绿洲', { fs: 13, fill: '#1d5e8c' });
    /* 棕榈树 */
    s += `<g transform="translate(-50 -10)">`;
    s += `<line x1="0" y1="0" x2="0" y2="-36" stroke="#8b5a2b" stroke-width="3"/>`;
    s += `<path d="M 0 -36 Q -16 -44 -22 -32 M 0 -36 Q 16 -44 22 -32 M 0 -36 Q -10 -50 -2 -52 M 0 -36 Q 10 -50 2 -52" fill="none" stroke="#5da05b" stroke-width="3"/>`;
    s += `</g>`;
    s += `<g transform="translate(46 -8)">`;
    s += `<line x1="0" y1="0" x2="0" y2="-30" stroke="#8b5a2b" stroke-width="2.5"/>`;
    s += `<path d="M 0 -30 Q -14 -38 -18 -26 M 0 -30 Q 14 -38 18 -26" fill="none" stroke="#5da05b" stroke-width="2.5"/>`;
    s += `</g>`;
    s += `</g>`;
    s += txt(320, 30, '沙漠昼夜温差大，绿洲靠高山冰雪融水滋养', { fs: 13, fill: MUT });
    s += arrow(170, 130, 330, 130, '#2f9bd6');
    s += txt(250, 120, '冰雪融水', { fs: 12, fill: '#2f9bd6' });
    return s + '</svg>';
  };

  /* 天气与气候对比 */
  const weatherClimate = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 170">`;
    /* 左：天气 */
    s += `<g transform="translate(160 80)">`;
    s += `<rect x="-120" y="-56" width="240" height="100" rx="14" fill="#eef7f3" stroke="#2fbf71" stroke-width="2"/>`;
    s += txt(0, -36, '天气（短时间）', { fs: 15, fw: 900, fill: '#2c6e54' });
    s += `<text x="-60" y="0" font-size="30">☀️</text><text x="-20" y="4" font-size="13" fill="#4a4f63">今天晴</text>`;
    s += `<text x="20" y="0" font-size="30">🌧️</text><text x="60" y="4" font-size="13" fill="#4a4f63">明天雨</text>`;
    s += txt(0, 28, '变化快 · 出门带不带伞', { fs: 12.5, fill: MUT });
    s += `</g>`;
    /* 右：气候 */
    s += `<g transform="translate(480 80)">`;
    s += `<rect x="-120" y="-56" width="240" height="100" rx="14" fill="#e8f0fd" stroke="#2f9bd6" stroke-width="2"/>`;
    s += txt(0, -36, '气候（多年规律）', { fs: 15, fw: 900, fill: '#1d5e8c' });
    s += `<text x="-70" y="2" font-size="26">🌸</text><text x="-30" y="4" font-size="12" fill="#4a4f63">春</text>`;
    s += `<text x="0" y="2" font-size="26">☀️</text><text x="38" y="4" font-size="12" fill="#4a4f63">夏</text>`;
    s += `<text x="-70" y="30" font-size="26">🍂</text><text x="-30" y="32" font-size="12" fill="#4a4f63">秋</text>`;
    s += `<text x="0" y="30" font-size="26">❄️</text><text x="38" y="32" font-size="12" fill="#4a4f63">冬</text>`;
    s += txt(0, 28, '昆明四季如春 · 海南长夏无冬', { fs: 12.5, fill: MUT });
    s += `</g>`;
    return s + '</svg>';
  };

  /* 我国气温差异 */
  const tempDiff = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 170">`;
    s += txt(320, 18, '冬季南北温差大（1 月），夏季普遍高温', { fs: 14 });
    /* 温度计对比 */
    const temps = [
      ['漠河', '-30℃', '#9db4d6', -30],
      ['北京', '0℃ 左右', '#b9c7de', 0],
      ['广州', '15℃ 左右', '#f6b93b', 15],
      ['海南', '20℃ 以上', '#e25563', 20],
    ];
    temps.forEach((t, i) => {
      const x = 80 + i * 150;
      s += `<g transform="translate(${x} 100)">`;
      s += `<rect x="-8" y="-60" width="16" height="80" rx="8" fill="#f0f2f7" stroke="#b9c7de" stroke-width="1.5"/>`;
      const h = Math.max(6, (t[3] + 32) / 52 * 70);
      s += `<rect x="-6" y="${20 - h}" width="12" height="${h}" rx="6" fill="${t[2]}"/>`;
      s += `<circle cx="0" cy="20" r="9" fill="${t[2]}"/>`;
      s += txt(0, -68, t[1], { fs: 12.5, fw: 800, fill: t[2] });
      s += txt(0, 44, t[0], { fs: 12.5, fill: INK });
      s += `</g>`;
    });
    s += txt(320, 162, '秦岭—淮河一线大致是一月 0℃ 等温线，以北河流冬季结冰', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* 降水与干湿差异 */
  const rainfall = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    s += txt(320, 18, '降水从东南沿海向西北内陆递减', { fs: 14 });
    /* 中国轮廓简化 */
    s += `<path d="M 120 70 Q 160 50 220 56 Q 280 48 340 60 Q 420 50 500 70 Q 560 86 550 120 Q 520 150 440 148 Q 360 156 280 148 Q 200 154 140 138 Q 100 118 120 70 Z" fill="#fafbfe" stroke="#b9c7de" stroke-width="2"/>`;
    /* 降水区：东南多雨（蓝）→ 西北少雨（黄） */
    s += `<path d="M 440 70 Q 500 64 540 90 Q 555 118 520 140 Q 470 150 430 142 Q 400 110 440 70 Z" fill="#2f9bd6" opacity=".35"/>`;
    s += `<path d="M 320 70 Q 380 60 440 70 Q 430 110 380 140 Q 320 150 280 138 Q 260 100 320 70 Z" fill="#2f9bd6" opacity=".22"/>`;
    s += `<path d="M 180 70 Q 240 56 320 70 Q 260 100 200 130 Q 150 130 140 108 Q 150 80 180 70 Z" fill="#f6b93b" opacity=".3"/>`;
    /* 降雨动画点 */
    for (let i = 0; i < 6; i++) {
      const rx = 420 + Math.random() * 100, ry = 60 + Math.random() * 70;
      s += `<line x1="${rx}" y1="${ry}" x2="${rx - 3}" y2="${ry + 8}" stroke="#2f9bd6" stroke-width="2" class="anim-rain" style="animation-delay:${i * 0.18}s"/>`;
    }
    s += txt(480, 100, '东南', { fs: 13, fill: '#1d5e8c' });
    s += txt(480, 116, '多雨', { fs: 12, fill: '#1d5e8c' });
    s += txt(200, 104, '西北', { fs: 13, fill: '#9c7320' });
    s += txt(200, 120, '少雨', { fs: 12, fill: '#9c7320' });
    s += arrow(540, 110, 160, 110, '#e2943a');
    s += txt(350, 104, '降水递减 →', { fs: 12.5, fill: '#9c7320' });
    s += txt(320, 170, '800 毫米等降水量线大致经过秦岭—淮河一线', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* 湖泊：咸水湖与淡水湖 */
  const lakes = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 170">`;
    /* 左：咸水湖（只进不出） */
    s += `<g transform="translate(180 90)">`;
    s += `<ellipse cx="0" cy="10" rx="90" ry="34" fill="#e8dcc4" stroke="#a5713c" stroke-width="2"/>`;
    s += `<ellipse cx="0" cy="6" rx="80" ry="28" fill="#7ec9ee" opacity=".5"/>`;
    s += txt(0, 12, '咸水湖', { fs: 14, fill: '#7a5327', fw: 800 });
    s += txt(0, 30, '青海湖（最大）', { fs: 11.5, fill: MUT });
    /* 河流只进 */
    s += `<path d="M -60 -30 Q -30 -10 -10 0" fill="none" stroke="#2f9bd6" stroke-width="3" marker-end="url(#gfig-arrow)" class="anim-flow"/>`;
    s += txt(-60, -36, '河流流入', { fs: 11, fill: SEA });
    s += txt(0, -24, '无流出河道', { fs: 11, fill: '#a4453f' });
    s += `</g>`;
    /* 右：淡水湖（有进有出） */
    s += `<g transform="translate(470 90)">`;
    s += `<ellipse cx="0" cy="10" rx="90" ry="34" fill="#e3f0dd" stroke="#5da05b" stroke-width="2"/>`;
    s += `<ellipse cx="0" cy="6" rx="80" ry="28" fill="#7ec9ee" opacity=".6"/>`;
    s += txt(0, 12, '淡水湖', { fs: 14, fill: '#3d7a3d', fw: 800 });
    s += txt(0, 30, '鄱阳湖（最大淡水湖）', { fs: 11.5, fill: MUT });
    s += `<path d="M -60 -30 Q -30 -10 -10 0" fill="none" stroke="#2f9bd6" stroke-width="3" marker-end="url(#gfig-arrow)" class="anim-flow"/>`;
    s += `<path d="M 10 6 Q 40 14 70 6" fill="none" stroke="#2f9bd6" stroke-width="3" marker-end="url(#gfig-arrow)" class="anim-flow2"/>`;
    s += txt(-60, -36, '流入', { fs: 11, fill: SEA });
    s += txt(60, -2, '流出', { fs: 11, fill: SEA });
    s += `</g>`;
    s += txt(320, 162, '咸水湖「只进不出」盐分积累；淡水湖「有进有出」盐分随水带走', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* 我国的海域与岛屿 */
  const chinaSeas = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    /* 简化中国东部海岸线 */
    s += `<path d="M 60 60 Q 120 50 180 70 Q 220 90 240 120 Q 250 140 220 160 L 60 160 Z" fill="#f5efe2" stroke="#a5713c" stroke-width="2"/>`;
    s += txt(120, 110, '中国大陆', { fs: 12, fill: '#7a5327' });
    /* 四大海域 */
    const seas = [
      ['渤海', 250, 70, '#9db4d6'],
      ['黄海', 320, 90, '#b9c7de'],
      ['东海', 410, 110, '#6fa8c9'],
      ['南海', 470, 150, '#2f9bd6'],
    ];
    seas.forEach(se => {
      s += `<g transform="translate(${se[1]} ${se[2]})">`;
      s += `<ellipse cx="0" cy="0" rx="44" ry="22" fill="${se[3]}" opacity=".5" stroke="${se[3]}" stroke-width="1.5"/>`;
      s += txt(0, 4, se[0], { fs: 12.5, fw: 800, fill: '#1d4e7c' });
      s += `</g>`;
    });
    /* 台湾岛 */
    s += `<ellipse cx="540" cy="120" rx="14" ry="26" fill="#e8a87c" stroke="#d97745" stroke-width="1.5"/>`;
    s += txt(560, 116, '台湾岛', { fs: 11, fill: '#9c5a2c', anchor: 'start' });
    /* 海南岛 */
    s += `<ellipse cx="300" cy="155" rx="12" ry="14" fill="#e8a87c" stroke="#d97745" stroke-width="1.5"/>`;
    s += txt(320, 158, '海南岛', { fs: 11, fill: '#9c5a2c', anchor: 'start' });
    /* 南海诸岛点 */
    s += `<circle cx="450" cy="165" r="3" fill="#d97745"/><circle cx="480" cy="168" r="3" fill="#d97745"/><circle cx="510" cy="162" r="3" fill="#d97745"/>`;
    s += txt(490, 176, '南海诸岛', { fs: 10.5, fill: '#9c5a2c' });
    s += txt(320, 30, '从北到南：渤海 → 黄海 → 东海 → 南海', { fs: 13.5, fill: INK });
    arrow(260, 60, 470, 150, SEA);
    return s + '</svg>';
  };

  /* 我国的位置与疆域 */
  const chinaTerritory = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    /* 简化中国轮廓 */
    s += `<path d="M 140 50 Q 200 36 280 42 Q 360 34 440 48 Q 520 60 540 96 Q 548 130 500 150 Q 420 162 340 156 Q 260 164 190 150 Q 130 132 120 100 Q 116 72 140 50 Z" fill="#fbeee4" stroke="#d97745" stroke-width="2.5"/>`;
    /* 四至点 */
    s += `<circle cx="540" cy="96" r="5" fill="#e25563" class="anim-pulse"/>`;
    s += txt(556, 100, '最东：乌苏里江', { fs: 11, fill: '#a4453f', anchor: 'start' });
    s += `<circle cx="120" cy="100" r="5" fill="#e25563" class="anim-pulse"/>`;
    s += txt(70, 100, '最西：帕米尔高原', { fs: 11, fill: '#a4453f', anchor: 'end' });
    s += `<circle cx="260" cy="42" r="5" fill="#e25563" class="anim-pulse"/>`;
    s += txt(260, 32, '最北：漠河', { fs: 11, fill: '#a4453f' });
    s += `<circle cx="430" cy="156" r="5" fill="#e25563" class="anim-pulse"/>`;
    s += txt(430, 172, '最南：曾母暗沙', { fs: 11, fill: '#a4453f' });
    /* 面积标注 */
    s += txt(330, 96, '960 万', { fs: 22, fw: 900, fill: '#d97745' });
    s += txt(330, 116, '平方千米', { fs: 12, fill: MUT });
    s += txt(320, 178, '陆地面积世界第三（俄、加、中），既是陆地大国也是海洋大国', { fs: 12, fill: MUT });
    return s + '</svg>';
  };

  /* 34 个省级行政区分类 */
  const provinces = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 170">`;
    const groups = [
      ['23 个省', '#2f9bd6', ['河北', '山西', '辽宁', '吉林', '黑龙江', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南', '广东', '海南', '四川', '贵州', '云南', '陕西', '甘肃', '青海', '台湾']],
      ['5 个自治区', '#2fbf71', ['内蒙古', '广西', '西藏', '宁夏', '新疆']],
      ['4 个直辖市', '#e25563', ['北京', '天津', '上海', '重庆']],
      ['2 个特别行政区', '#b5893a', ['香港', '澳门']],
    ];
    let y = 24;
    groups.forEach(g => {
      s += txt(40, y, g[0], { fs: 13.5, fw: 800, fill: g[1], anchor: 'start' });
      s += `<line x1="40" y1="${y + 4}" x2="150" y2="${y + 4}" stroke="${g[1]}" stroke-width="2"/>`;
      g[2].forEach((name, i) => {
        const x = 160 + (i % 12) * 38;
        const yy = y - 4 + Math.floor(i / 12) * 18;
        s += `<rect x="${x - 16}" y="${yy - 11}" width="32" height="16" rx="4" fill="${g[1]}18" stroke="${g[1]}" stroke-width="1"/>`;
        s += txt(x, yy, name, { fs: 10.5, fill: INK, fw: 700 });
      });
      y += 36;
    });
    s += txt(320, 164, '23 ＋ 5 ＋ 4 ＋ 2 ＝ 34 个省级行政区', { fs: 13, fw: 800, fill: MUT });
    return s + '</svg>';
  };

  /* 56 个民族大家庭 */
  const ethnic = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 160">`;
    /* 石榴 */
    s += `<g transform="translate(130 80)">`;
    s += `<circle r="48" fill="#e8707a" opacity=".25" stroke="#c2557d" stroke-width="2"/>`;
    s += `<circle cx="0" cy="0" r="48" fill="#c2557d" opacity=".12"/>`;
    /* 石榴籽 */
    const seeds = [[-18,-10],[-6,-22],[8,-14],[20,-4],[-10,6],[4,16],[18,8],[-24,14],[-14,24],[10,28],[-26,-4],[-30,6]];
    seeds.forEach((p, i) => {
      s += `<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="#e8707a" stroke="#c2557d" stroke-width="1" class="anim-pulse" style="animation-delay:${i * 0.15}s"/>`;
    });
    s += `<path d="M -6 -44 L 0 -52 L 6 -44" fill="#5da05b" stroke="#3d7a3d" stroke-width="1.5"/>`;
    s += `</g>`;
    s += txt(130, 148, '56 个民族像石榴籽', { fs: 13, fill: '#9c3a62' });
    /* 民族分布 */
    s += txt(340, 36, '民族分布特点', { fs: 14, fw: 800, fill: INK, anchor: 'start' });
    s += txt(340, 60, '大杂居 · 小聚居 · 交错居住', { fs: 13.5, fill: '#c2557d', anchor: 'start' });
    s += txt(340, 88, '汉族人口最多', { fs: 13, fill: MUT, anchor: 'start' });
    s += txt(340, 108, '壮族是人口最多的少数民族（广西）', { fs: 13, fill: MUT, anchor: 'start' });
    s += txt(340, 130, '那达慕 · 泼水节 · 火把节 · 雪顿节', { fs: 12.5, fill: '#8b65c9', anchor: 'start' });
    return s + '</svg>';
  };

  /* 邻国与海上相望 */
  const neighbors = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    /* 中国居中 */
    s += `<rect x="270" y="60" width="100" height="70" rx="8" fill="#fbeee4" stroke="#d97745" stroke-width="2.5"/>`;
    s += txt(320, 92, '中国', { fs: 16, fw: 900, fill: '#9c5a2c' });
    s += txt(320, 112, '🇨🇳', { fs: 20 });
    /* 陆上邻国（简化） */
    const land = [
      ['朝鲜', 400, 40], ['俄罗斯', 470, 70], ['蒙古', 460, 110],
      ['哈萨克', 200, 40], ['吉尔吉斯', 170, 70], ['塔吉克', 160, 100],
      ['阿富汗', 180, 130], ['巴基斯坦', 240, 150], ['印度', 320, 158],
      ['尼泊尔', 380, 152], ['不丹', 430, 148], ['缅甸', 460, 130],
      ['老挝', 470, 100], ['越南', 460, 70],
    ];
    land.forEach(n => {
      s += `<circle cx="${n[1]}" cy="${n[2]}" r="11" fill="#fff" stroke="#2fbf71" stroke-width="1.5"/>`;
    });
    s += txt(120, 30, '陆上邻国 14 个', { fs: 13, fw: 800, fill: '#2c6e54', anchor: 'start' });
    /* 海上邻国 */
    const sea = [['韩国', 560, 50], ['日本', 590, 80], ['菲律宾', 580, 120], ['马来西亚', 540, 150], ['文莱', 510, 160], ['印尼', 470, 168]];
    sea.forEach(n => {
      s += `<circle cx="${n[1]}" cy="${n[2]}" r="9" fill="#e8f0fd" stroke="#2f9bd6" stroke-width="1.5"/>`;
    });
    s += txt(510, 30, '隔海相望 6 国', { fs: 13, fw: 800, fill: '#1d5e8c', anchor: 'start' });
    s += txt(320, 176, '世界上邻国最多的国家之一', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* 首都北京 */
  const beijing = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 160">`;
    /* 天安门 */
    s += `<g transform="translate(120 110)">`;
    s += `<rect x="-50" y="-20" width="100" height="30" fill="#c2557d" stroke="#9c3a62" stroke-width="2"/>`;
    s += `<rect x="-56" y="-32" width="112" height="14" fill="#a4453f"/>`;
    s += `<polygon points="-56,-32 0,-52 56,-32" fill="#8b3030"/>`;
    for (let i = -1; i <= 1; i++) {
      s += `<rect x="${i * 20 - 5}" y="-10" width="10" height="20" fill="#5a2020"/>`;
    }
    s += txt(0, 30, '天安门', { fs: 13, fill: '#9c3a62' });
    s += `</g>`;
    /* 故宫 */
    s += `<g transform="translate(300 110)">`;
    s += `<rect x="-44" y="-14" width="88" height="24" fill="#e8a87c" stroke="#a5713c" stroke-width="2"/>`;
    s += `<polygon points="-50,-14 0,-36 50,-14" fill="#c2557d"/>`;
    s += `<rect x="-8" y="-4" width="16" height="14" fill="#7a3b1a"/>`;
    s += txt(0, 30, '故宫', { fs: 13, fill: '#7a5327' });
    s += `</g>`;
    /* 长城 */
    s += `<g transform="translate(490 110)">`;
    s += `<path d="M -50 10 L -30 -14 L -10 -10 L 10 -24 L 30 -16 L 50 6" fill="none" stroke="#a5713c" stroke-width="5"/>`;
    s += `<path d="M -50 10 L -30 -14 L -10 -10 L 10 -24 L 30 -16 L 50 6 L 50 14 L 30 -8 L 10 0 L -10 -2 L -30 -6 L -50 18 Z" fill="#c9a26b" stroke="#a5713c" stroke-width="2"/>`;
    s += txt(0, 30, '长城', { fs: 13, fill: '#7a5327' });
    s += `</g>`;
    s += txt(320, 22, '北京：首都 · 政治文化中心 · 历史古都', { fs: 14, fw: 800, fill: INK });
    s += txt(320, 160, '上海是我国最大城市；深圳是经济特区', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* 世界的国家和地区 */
  const worldCountries = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 170">`;
    /* 简化世界地图 */
    s += `<ellipse cx="320" cy="85" rx="280" ry="70" fill="#cfe8f7" stroke="#2f9bd6" stroke-width="1.5"/>`;
    /* 大洲色块 */
    s += `<path d="M 120 50 Q 180 40 240 50 Q 260 70 220 80 Q 160 78 120 70 Z" fill="#e8a87c" opacity=".7"/>`;
    s += txt(180, 64, '北美洲', { fs: 11, fill: '#7a5327' });
    s += `<path d="M 220 90 Q 250 80 270 100 Q 260 130 230 130 Q 210 115 220 90 Z" fill="#5da05b" opacity=".7"/>`;
    s += txt(240, 112, '南美', { fs: 10.5, fill: '#3d7a3d' });
    s += `<path d="M 300 40 Q 380 32 440 50 Q 460 80 420 90 Q 340 88 300 70 Z" fill="#e25563" opacity=".5"/>`;
    s += txt(370, 64, '欧洲', { fs: 11, fill: '#a4453f' });
    s += `<path d="M 360 70 Q 440 60 500 80 Q 510 110 460 120 Q 380 118 360 95 Z" fill="#f6b93b" opacity=".6"/>`;
    s += txt(430, 96, '非洲', { fs: 11, fill: '#9c7320' });
    s += `<path d="M 460 40 Q 540 36 580 56 Q 590 80 540 86 Q 480 80 460 60 Z" fill="#8b65c9" opacity=".6"/>`;
    s += txt(520, 64, '亚洲', { fs: 11, fill: '#5e3fa0' });
    s += `<path d="M 500 120 Q 560 116 580 130 Q 570 148 520 148 Q 490 140 500 120 Z" fill="#9db4d6" opacity=".7"/>`;
    s += txt(540, 138, '大洋洲', { fs: 10, fill: '#3d5a8c' });
    s += `<path d="M 100 130 Q 160 126 200 138 Q 190 152 140 152 Q 100 146 100 130 Z" fill="#cdd6e4" opacity=".8"/>`;
    s += txt(150, 144, '南极洲', { fs: 10, fill: '#5a6577' });
    s += txt(320, 20, '世界 200 多个国家和地区 · 190 多个联合国会员国', { fs: 13.5, fill: INK });
    s += txt(320, 166, '面积最大：俄罗斯　人口最多：中国、印度　最小：梵蒂冈', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* 世界之最 */
  const worldRecords = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    const items = [
      ['🏔️', '最高峰', '珠穆朗玛峰', '#a5713c'],
      ['🌊', '最长河', '尼罗河', '#2f9bd6'],
      ['🏜️', '最大沙漠', '撒哈拉', '#d9a13c'],
      ['🌲', '最大平原', '亚马孙', '#5da05b'],
      ['⛰️', '最大高原', '巴西高原', '#8b65c9'],
      ['🗻', '最高高原', '青藏高原', '#e25563'],
    ];
    items.forEach((it, i) => {
      const x = 60 + (i % 3) * 200;
      const y = 40 + Math.floor(i / 3) * 70;
      s += `<g transform="translate(${x} ${y})">`;
      s += `<circle cx="0" cy="0" r="26" fill="${it[3]}18" stroke="${it[3]}" stroke-width="2"/>`;
      s += `<text x="0" y="8" text-anchor="middle" font-size="24">${it[0]}</text>`;
      s += txt(0, 42, it[1], { fs: 12.5, fw: 800, fill: it[3] });
      s += txt(0, 58, it[2], { fs: 11.5, fill: INK });
      s += `</g>`;
    });
    s += txt(320, 172, '「最高」看海拔，「最大」看面积——别弄反啦', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* 一方水土养一方人 */
  const localLife = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 170">`;
    /* 南 */
    s += `<g transform="translate(160 80)">`;
    s += `<rect x="-100" y="-50" width="200" height="100" rx="12" fill="#e8f0fd" stroke="#2f9bd6" stroke-width="2"/>`;
    s += txt(0, -34, '南方', { fs: 16, fw: 900, fill: '#1d5e8c' });
    s += `<text x="-70" y="0" font-size="22">🍚</text>`;
    s += txt(-40, 4, '米饭', { fs: 12.5, anchor: 'start', fill: MUT });
    s += `<text x="10" y="0" font-size="22">🏠</text>`;
    s += txt(40, 4, '斜顶房', { fs: 12.5, anchor: 'start', fill: MUT });
    s += `<text x="-70" y="28" font-size="22">🚣</text>`;
    s += txt(-40, 32, '船多', { fs: 12.5, anchor: 'start', fill: MUT });
    s += `<text x="10" y="28" font-size="22">🐉</text>`;
    s += txt(40, 32, '赛龙舟', { fs: 12.5, anchor: 'start', fill: MUT });
    s += `</g>`;
    /* 北 */
    s += `<g transform="translate(480 80)">`;
    s += `<rect x="-100" y="-50" width="200" height="100" rx="12" fill="#fdf6e9" stroke="#d97745" stroke-width="2"/>`;
    s += txt(0, -34, '北方', { fs: 16, fw: 900, fill: '#9c5a2c' });
    s += `<text x="-70" y="0" font-size="22">🍜</text>`;
    s += txt(-40, 4, '面食', { fs: 12.5, anchor: 'start', fill: MUT });
    s += `<text x="10" y="0" font-size="22">🏘️</text>`;
    s += txt(40, 4, '平顶房', { fs: 12.5, anchor: 'start', fill: MUT });
    s += `<text x="-70" y="28" font-size="22">🐴</text>`;
    s += txt(-40, 32, '车马', { fs: 12.5, anchor: 'start', fill: MUT });
    s += `<text x="10" y="28" font-size="22">⛷️</text>`;
    s += txt(40, 32, '滑冰', { fs: 12.5, anchor: 'start', fill: MUT });
    s += `</g>`;
    s += txt(320, 162, '南稻北麦 · 南船北马 · 南斜北平 —— 自然环境决定生活方式', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* 自然资源与节约 */
  const resources = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 170">`;
    /* 不可再生 */
    s += `<g transform="translate(160 85)">`;
    s += `<rect x="-120" y="-54" width="240" height="96" rx="12" fill="#f8f0e0" stroke="#b5893a" stroke-width="2"/>`;
    s += txt(0, -34, '不可再生（用一点少一点）', { fs: 14, fw: 800, fill: '#7a5b18' });
    [`⛏️煤`, `🛢️石油`, `🔥天然气`].forEach((t, i) => {
      s += `<text x="${-70 + i * 70}" y="8" font-size="22">${t[0]}</text>`;
      s += txt(-70 + i * 70, 28, t.slice(1), { fs: 12.5, fill: MUT });
    });
    s += `</g>`;
    /* 可再生 */
    s += `<g transform="translate(480 85)">`;
    s += `<rect x="-120" y="-54" width="240" height="96" rx="12" fill="#eef7f3" stroke="#2fbf71" stroke-width="2"/>`;
    s += txt(0, -34, '可再生（绿色能源）', { fs: 14, fw: 800, fill: '#2c6e54' });
    [`☀️太阳能`, `💨风能`, `💧水能`].forEach((t, i) => {
      s += `<text x="${-70 + i * 70}" y="8" font-size="22">${t[0]}</text>`;
      s += txt(-70 + i * 70, 28, t.slice(1), { fs: 12.5, fill: MUT });
    });
    s += `</g>`;
    s += txt(320, 162, '随手关灯 · 双面用纸 · 绿色出行 · 光盘行动', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* 自然灾害与自护 */
  const disasters = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 180">`;
    const items = [
      ['🌋', '地震', '蹲下·掩护·抓牢', '#a5713c'],
      ['🌀', '台风', '不出门·关门窗', '#2f9bd6'],
      ['🌧️', '暴雨', '远离低洼河道', '#6fa8c9'],
      ['⚡', '雷电', '不站树下', '#f6b93b'],
    ];
    items.forEach((it, i) => {
      const x = 80 + i * 150;
      s += `<g transform="translate(${x} 80)">`;
      s += `<circle r="34" fill="${it[3]}18" stroke="${it[3]}" stroke-width="2"/>`;
      s += `<text x="0" y="8" text-anchor="middle" font-size="28">${it[0]}</text>`;
      s += txt(0, 54, it[1], { fs: 14, fw: 800, fill: it[3] });
      s += txt(0, 72, it[2], { fs: 11.5, fill: MUT });
      s += `</g>`;
    });
    s += txt(320, 168, '预警信号：蓝 → 黄 → 橙 → 红，颜色越深级别越高', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 环保小卫士 */
  const environment = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 170">`;
    /* 地球 */
    s += `<g transform="translate(110 85)">`;
    s += `<circle r="40" fill="#7ec9ee" opacity=".4" stroke="#2f9bd6" stroke-width="2"/>`;
    s += `<path d="M -22 -10 Q -10 -20 4 -14 Q 18 -6 12 10 Q 2 20 -14 12 Q -26 4 -22 -10 Z" fill="#5da05b" opacity=".8"/>`;
    s += `<path d="M 10 12 Q 22 8 24 22 Q 12 26 8 18 Z" fill="#5da05b" opacity=".7"/>`;
    s += `</g>`;
    /* 四个行动 */
    const acts = [
      ['♻️', '垃圾分类', '#2fbf71'],
      ['💧', '节约用水', '#2f9bd6'],
      ['🚲', '低碳出行', '#8b65c9'],
      ['🌳', '植树造林', '#5da05b'],
    ];
    acts.forEach((a, i) => {
      const x = 250 + (i % 2) * 170;
      const y = 50 + Math.floor(i / 2) * 60;
      s += `<g transform="translate(${x} ${y})">`;
      s += `<circle r="22" fill="${a[2]}18" stroke="${a[2]}" stroke-width="2" class="anim-pulse" style="animation-delay:${i * 0.3}s"/>`;
      s += `<text x="0" y="7" text-anchor="middle" font-size="22">${a[0]}</text>`;
      s += txt(34, 4, a[1], { fs: 13, fw: 700, fill: INK, anchor: 'start' });
      s += `</g>`;
    });
    s += txt(320, 162, '6 月 5 日世界环境日 · 3 月 12 日植树节 · 绿水青山就是金山银山', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* 黄河——母亲河：几字形 + 泥沙 + 地上河 */
  const yellowRiver = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 190">`;
    /* 几字形河道 */
    s += txt(320, 18, '黄河：「几」字形河道 · 含沙量大 · 下游「地上河」', { fs: 13.5, fill: INK });
    s += `<path d="M 60 56 L 150 56 L 150 30 L 360 30 L 360 60 L 540 60" fill="none" stroke="#d9a13c" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" class="anim-flow"/>`;
    s += `<circle cx="60" cy="56" r="6" fill="#d9a13c"/>`;
    s += txt(60, 44, '发源：巴颜喀拉山', { fs: 11, fill: '#a97b22', anchor: 'start' });
    s += txt(560, 56, '渤海', { fs: 13, fill: '#a97b22', anchor: 'start' });
    /* 黄土高原段泥沙标注 */
    s += `<g transform="translate(255 30)">`;
    s += `<path d="M 0 14 Q -10 30 0 44 Q 10 30 0 14 Z" fill="#d9a13c" opacity=".5"/>`;
    s += txt(0, 62, '流经黄土高原', { fs: 11.5, fill: '#a97b22' });
    s += txt(0, 76, '带走大量泥沙', { fs: 11, fill: MUT });
    s += `</g>`;
    /* 下游地上河示意 */
    s += `<g transform="translate(440 120)">`;
    s += `<rect x="-90" y="0" width="180" height="36" fill="#e8dcc4" stroke="#a5713c" stroke-width="1.5"/>`;
    s += txt(0, -8, '下游「地上河」', { fs: 12.5, fill: '#7a5327', fw: 800 });
    /* 河床高出两岸 */
    s += `<rect x="-70" y="8" width="140" height="10" fill="#d9a13c" opacity=".6"/>`;
    s += `<path d="M -70 8 L -70 -2 M 70 8 L 70 -2" stroke="#a5713c" stroke-width="1.5" stroke-dasharray="3 2"/>`;
    s += txt(-78, 4, '地面', { fs: 10, fill: MUT, anchor: 'end' });
    s += txt(78, 4, '地面', { fs: 10, fill: MUT });
    s += txt(0, 30, '泥沙淤积，河床高出两岸', { fs: 11, fill: MUT });
    s += `</g>`;
    s += txt(320, 180, '黄河是世界含沙量最大的河流，宁夏一带有「塞上江南」美称', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

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
    'geo-yellow-river': yellowRiver,
    'geo-day-night': dayNight,
    'geo-landmarks': landmarks,
    'demo-geo-compass': demoCompass,
    'demo-geo-seasons': demoSeasons,
    /* 单元横幅 */
    'geo-bn-earth': bnEarth,
    'geo-bn-map': bnMap,
    'geo-bn-land': bnLand,
    'geo-bn-weather': bnWeather,
    'geo-bn-river': bnRiver,
    'geo-bn-china': bnChina,
    'geo-bn-world': bnWorld,
    'geo-bn-life': bnLife,
    /* 新增知识点图示 */
    'geo-earth-shape': earthShape,
    'geo-floorplan': floorplan,
    'geo-china-landscape': chinaLandscape,
    'geo-desert-oasis': desertOasis,
    'geo-weather-climate': weatherClimate,
    'geo-temp-diff': tempDiff,
    'geo-rainfall': rainfall,
    'geo-lakes': lakes,
    'geo-china-seas': chinaSeas,
    'geo-china-territory': chinaTerritory,
    'geo-provinces': provinces,
    'geo-ethnic': ethnic,
    'geo-neighbors': neighbors,
    'geo-beijing': beijing,
    'geo-world-countries': worldCountries,
    'geo-world-records': worldRecords,
    'geo-local-life': localLife,
    'geo-resources': resources,
    'geo-disasters': disasters,
    'geo-environment': environment,
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
    'geo-yellow-river': '黄河「几」字形，流经黄土高原含沙量大，下游形成「地上河」',
    'geo-day-night': '地球自转产生昼夜交替，东边的城市先看到日出',
    'geo-sun-compass': '早晨面向太阳：前面是东，背后是西，左臂是北，右臂是南',
    'geo-scale': '比例尺 1:100000：图上 1 厘米代表实际 1 千米',
    'geo-legend': '常见地图图例',
    'geo-weather': '常用天气符号',
    'geo-continent-bars': '七大洲按面积排行',
    'geo-ocean-bars': '四大洋按面积排行',
    /* 新增图示说明 */
    'geo-earth-shape': '从「天圆地方」到蓝色星球：麦哲伦环球航行证明地球是球体',
    'geo-floorplan': '画平面图四步法：定方向 → 定地点 → 画路线 → 加图例',
    'geo-china-landscape': '珠峰世界最高峰，青藏高原有「世界屋脊」之称，三大平原是粮仓',
    'geo-desert-oasis': '沙漠里昼夜温差大，绿洲靠高山冰雪融水滋养',
    'geo-weather-climate': '天气是短时间的大气状况，气候是多年的天气规律',
    'geo-temp-diff': '冬季南北温差大（秦岭—淮河是一月 0℃ 等温线），夏季普遍高温',
    'geo-rainfall': '降水从东南沿海向西北内陆递减（800 毫米线过秦岭—淮河）',
    'geo-lakes': '咸水湖「只进不出」（青海湖），淡水湖「有进有出」（鄱阳湖）',
    'geo-china-seas': '四大海域从北到南：渤海、黄海、东海、南海；台湾岛是第一大岛',
    'geo-china-territory': '我国陆地面积约 960 万平方千米，世界第三；东西南北四至点',
    'geo-provinces': '23 省 ＋ 5 自治区 ＋ 4 直辖市 ＋ 2 特别行政区 ＝ 34 个省级行政区',
    'geo-ethnic': '56 个民族像石榴籽紧紧抱在一起：大杂居、小聚居、交错居住',
    'geo-neighbors': '陆上邻国 14 个，隔海相望 6 国，是世界上邻国最多的国家之一',
    'geo-beijing': '北京是首都：天安门、故宫、长城；上海是最大城市',
    'geo-world-countries': '世界 200 多个国家和地区，面积最大俄罗斯，人口最多中印',
    'geo-world-records': '世界之最：「最高」看海拔，「最大」看面积，别弄反',
    'geo-local-life': '南稻北麦、南船北马、南斜北平——自然环境决定生活方式',
    'geo-resources': '煤石油天然气不可再生；太阳风、水是可再生的绿色能源',
    'geo-disasters': '地震蹲下掩护抓牢；台风暴雨雷电要远离危险，预警颜色越深越严重',
    'geo-environment': '垃圾分类、节约用水、低碳出行、植树造林——人人都是环保小卫士',
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

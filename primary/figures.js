/* ============================================================
   乐学堂 · 知识点图示库（语文 / 数学共用）
   - 纯 SVG 插图，离线可用，打印友好
   - 部分图示带互动演示（滑块 / 按钮），事件用委托绑定，
     页面重渲染后无需重新挂载
   - 数据里用 fig: '图示id' / banner: '图示id' 引用
   ============================================================ */
'use strict';

const Figures = (() => {
  const INK = '#34384d';
  const MUT = '#73788b';
  const LINE = '#dfe5f0';

  /* ---------- 小工具 ---------- */
  const txt = (x, y, s, opt) => {
    opt = opt || {};
    return `<text x="${x}" y="${y}" fill="${opt.fill || INK}" font-size="${opt.fs || 14}"` +
      ` font-weight="${opt.fw || 700}" text-anchor="${opt.anchor || 'middle'}"` +
      (opt.mono ? ' font-family="ui-monospace,Menlo,monospace"' : '') +
      (opt.cls ? ` class="${opt.cls}"` : '') + `>${s}</text>`;
  };
  const emo = (x, y, s, fs) => txt(x, y, s, { fs: fs || 26 });
  const arrow = (x1, y1, x2, y2, color) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color || '#4d96ff'}" stroke-width="2.5" marker-end="url(#fig-arrow)"/>`;
  const DEFS = `<defs><marker id="fig-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#4d96ff"/></marker></defs>`;

  /* ================= 数学 · 静态图示 ================= */

  /* 数位顺序表 */
  const pvTable = () => {
    const cols = ['亿位', '千万位', '百万位', '十万位', '万位', '千位', '百位', '十位', '个位'];
    const units = ['亿', '千万', '百万', '十万', '万', '千', '百', '十', '个（一）'];
    const groups = [['亿级', 0, 1, '#c2557d'], ['万级', 1, 5, '#2f9bd6'], ['个级', 5, 9, '#2fbf71']];
    const cw = 62, ox = 60, oy = 30;
    let s = `<svg class="fig-svg" viewBox="0 0 640 158">`;
    groups.forEach(g => {
      s += `<rect x="${ox + g[1] * cw}" y="${oy}" width="${(g[2] - g[1]) * cw}" height="26" rx="6" fill="${g[3]}22" stroke="${g[3]}" stroke-width="1.5"/>`;
      s += txt(ox + (g[1] + g[2]) / 2 * cw, oy + 18, g[0], { fill: g[3], fs: 13 });
    });
    cols.forEach((c, i) => {
      s += `<rect x="${ox + i * cw}" y="${oy + 32}" width="${cw - 4}" height="30" rx="6" fill="#f4f7fd" stroke="${LINE}"/>`;
      s += txt(ox + i * cw + (cw - 4) / 2, oy + 52, c, { fs: 13 });
      s += `<rect x="${ox + i * cw}" y="${oy + 68}" width="${cw - 4}" height="30" rx="6" fill="#fff" stroke="${LINE}"/>`;
      s += txt(ox + i * cw + (cw - 4) / 2, oy + 88, units[i], { fs: 12.5, fill: '#5a5570' });
    });
    s += txt(56, oy + 52, '数位', { anchor: 'end', fs: 13, fill: MUT });
    s += txt(56, oy + 88, '计数单位', { anchor: 'end', fs: 13, fill: MUT });
    s += txt(320, oy + 124, '从右往左，每四位分一级；相邻计数单位的进率都是 10', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 大数分级读法 */
  const pvGrade = () => {
    const digits = ['3', '0', '4', '5', '0', '0', '0', '0'];
    const w = 54, ox = 150;
    let s = `<svg class="fig-svg" viewBox="0 0 640 150">`;
    digits.forEach((d, i) => {
      const inWan = i < 4;
      s += `<rect x="${ox + i * w}" y="34" width="${w - 8}" height="44" rx="8" fill="${inWan ? '#2f9bd618' : '#2fbf7118'}" stroke="${inWan ? '#2f9bd6' : '#2fbf71'}" stroke-width="1.5"/>`;
      s += txt(ox + i * w + (w - 8) / 2, 64, d, { fs: 24, mono: true });
    });
    s += `<path d="M ${ox} 26 Q ${ox + 2 * w} -6 ${ox + 4 * w - 8} 26" fill="none" stroke="#2f9bd6" stroke-width="2" marker-end="url(#fig-arrow)"/>`;
    s += txt(ox + 2 * w - 4, 16, '万级', { fill: '#2f9bd6', fs: 13 });
    s += `<path d="M ${ox + 4 * w} 26 Q ${ox + 6 * w} -6 ${ox + 8 * w - 8} 26" fill="none" stroke="#2fbf71" stroke-width="2" marker-end="url(#fig-arrow)"/>`;
    s += txt(ox + 6 * w - 4, 16, '个级', { fill: '#2fbf71', fs: 13 });
    s += txt(ox + 2 * w, 106, '按个级读：三千零四十五 + 万', { fill: '#2f9bd6', fs: 14 });
    s += txt(ox + 6 * w, 106, '末尾 0 不读', { fill: '#2fbf71', fs: 14 });
    s += txt(320, 138, '读作：三千零四十五万', { fs: 17 });
    return s + '</svg>';
  };

  /* 四舍五入数轴 */
  const rounding = () => {
    const x0 = 80, x1 = 560;
    const px = v => x0 + (v - 17800000) / 20000 * (x1 - x0);
    let s = `<svg class="fig-svg" viewBox="0 0 640 130">`;
    s += `<line x1="${x0 - 20}" y1="70" x2="${x1 + 20}" y2="70" stroke="${INK}" stroke-width="2"/>`;
    [17800000, 17810000].forEach((v, i) => {
      s += `<line x1="${px(v)}" y1="64" x2="${px(v)}" y2="76" stroke="${INK}" stroke-width="2"/>`;
      s += txt(px(v), 96, (i ? '1781 万' : '1780 万'), { fs: 13 });
    });
    [0.25, 0.5, 0.75].forEach(k => {
      const x = x0 + k * (x1 - x0);
      s += `<line x1="${x}" y1="66" x2="${x}" y2="74" stroke="${MUT}"/>`;
    });
    s += `<circle cx="${px(17805000)}" cy="70" r="6" fill="#e25563"/>`;
    s += txt(px(17805000), 52, '17805000', { fill: '#e25563', fs: 13 });
    s += arrow(px(17805000) + 12, 62, px(17810000) - 10, 62, '#2fbf71');
    s += txt(320, 122, '千位是 5，满 5 进 1 → ≈ 1781 万', { fs: 14 });
    return s + '</svg>';
  };

  /* 线段、直线、射线 */
  const lines3 = () => {
    const rows = [
      ['线段', 46, '<circle cx="180" cy="0" r="5" fill="#2f9bd6"/><circle cx="440" cy="0" r="5" fill="#2f9bd6"/>', '2 个端点 · 有限长'],
      ['射线', 96, '<circle cx="180" cy="0" r="5" fill="#2fbf71"/>', '1 个端点 · 无限长'],
      ['直线', 146, '', '没有端点 · 无限长 · 不可测量'],
    ];
    let s = `<svg class="fig-svg" viewBox="0 0 640 172">`;
    rows.forEach(r => {
      const cls = r[0] === '线段' ? '#2f9bd6' : r[0] === '射线' ? '#2fbf71' : '#d97745';
      s += txt(120, r[1] + 5, r[0], { fill: cls, fs: 16, anchor: 'end' });
      s += `<g transform="translate(0 ${r[1]})">` +
        `<line x1="180" y1="0" x2="440" y2="0" stroke="${cls}" stroke-width="3"${r[0] !== '线段' ? ' marker-end="url(#fig-arrow)"' : ''}${r[0] === '直线' ? ' marker-start="url(#fig-arrow)"' : ''}/>` +
        r[2] + `</g>`;
      s += txt(470, r[1] + 5, r[3], { anchor: 'start', fs: 13, fill: MUT });
    });
    return s + '</svg>';
  };

  /* 平行与垂直 */
  const parPerp = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 150">`;
    for (let i = 0; i < 8; i++) s += `<line x1="${40 + i * 72}" y1="14" x2="${40 + i * 72}" y2="136" stroke="#eef2f9" stroke-width="1"/>`;
    for (let i = 0; i < 4; i++) s += `<line x1="40" y1="${14 + i * 40}" x2="616" y2="${14 + i * 40}" stroke="#eef2f9" stroke-width="1"/>`;
    s += `<line x1="90" y1="44" x2="300" y2="44" stroke="#2f9bd6" stroke-width="3.5" marker-start="url(#fig-arrow)" marker-end="url(#fig-arrow)"/>`;
    s += `<line x1="90" y1="86" x2="300" y2="86" stroke="#2f9bd6" stroke-width="3.5" marker-start="url(#fig-arrow)" marker-end="url(#fig-arrow)"/>`;
    s += txt(195, 118, '互相平行 a ∥ b', { fill: '#2f9bd6', fs: 14 });
    s += `<line x1="400" y1="24" x2="400" y2="122" stroke="#e25563" stroke-width="3.5"/>`;
    s += `<line x1="352" y1="74" x2="606" y2="74" stroke="#e25563" stroke-width="3.5"/>`;
    s += `<path d="M 400 60 L 414 60 L 414 74" fill="none" stroke="#e25563" stroke-width="2.5"/>`;
    s += txt(520, 116, '互相垂直 a ⊥ b', { fill: '#e25563', fs: 14 });
    return s + '</svg>';
  };

  /* 量角器示意 */
  const protractor = () => {
    const cx = 200, cy = 128, R = 96;
    let s = `<svg class="fig-svg" viewBox="0 0 640 168">`;
    s += `<path d="M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy} Z" fill="#eef4fd" stroke="#4d96ff" stroke-width="2"/>`;
    for (let a = 0; a <= 180; a += 10) {
      const rad = a * Math.PI / 180;
      const x1 = cx + (R - 10) * Math.cos(rad), y1 = cy - (R - 10) * Math.sin(rad);
      const x2 = cx + R * Math.cos(rad), y2 = cy - R * Math.sin(rad);
      s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#9db4d6" stroke-width="1.5"/>`;
      if (a % 90 === 0) s += txt(cx + (R - 24) * Math.cos(rad), cy - (R - 24) * Math.sin(rad) + 4, a + '°', { fs: 11, fill: '#4d96ff' });
    }
    s += `<circle cx="${cx}" cy="${cy}" r="4" fill="#e25563"/>`;
    s += `<line x1="${cx}" y1="${cy}" x2="${cx + 120}" y2="${cy}" stroke="${INK}" stroke-width="2.5"/>`;
    const rad = 50 * Math.PI / 180;
    s += `<line x1="${cx}" y1="${cy}" x2="${cx + 110 * Math.cos(rad)}" y2="${cy - 110 * Math.sin(rad)}" stroke="#e25563" stroke-width="2.5"/>`;
    s += `<path d="M ${cx + 44} ${cy} A 44 44 0 0 0 ${cx + 44 * Math.cos(rad)} ${cy - 44 * Math.sin(rad)}" fill="#e2556318" stroke="#e25563" stroke-width="1.5"/>`;
    s += txt(cx + 66, cy - 26, '50°', { fill: '#e25563', fs: 15 });
    s += txt(cx, cy + 18, '中心对顶点', { fs: 12, fill: MUT });
    s += txt(430, 70, '0° 刻度线对一条边', { fs: 13, fill: MUT, anchor: 'start' });
    s += txt(430, 94, '0° 在内圈就读内圈', { fs: 13, fill: MUT, anchor: 'start' });
    s += txt(430, 118, '读出另一边对准的刻度', { fs: 13, fill: MUT, anchor: 'start' });
    return s + '</svg>';
  };

  /* 积的变化规律 */
  const productRule = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 132">`;
    s += txt(150, 40, '20 × 4 = 80', { fs: 21, mono: true });
    s += txt(470, 40, '20 × 8 = 160', { fs: 21, mono: true, fill: '#2fbf71' });
    s += arrow(240, 34, 390, 34, '#d97745');
    s += txt(315, 24, '4 变成 8（×2）', { fill: '#d97745', fs: 13 });
    s += txt(315, 76, '积也 ×2：80 → 160', { fill: '#d97745', fs: 14 });
    s += txt(320, 116, '一个因数 20 不变，另一个因数乘几（0 除外），积也乘几', { fs: 13.5, fill: MUT });
    return s + '</svg>';
  };

  /* 观察范围（路灯影子） */
  const sightRange = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 160">`;
    s += `<line x1="10" y1="140" x2="630" y2="140" stroke="${INK}" stroke-width="2"/>`;
    s += `<line x1="320" y1="140" x2="320" y2="26" stroke="#5a5570" stroke-width="5"/>`;
    s += `<circle cx="320" cy="26" r="10" fill="#ffb75e"/>`;
    s += txt(320, 16, '路灯', { fs: 12, fill: MUT });
    s += emo(240, 134, '🧍', 22);
    s += `<polygon points="320,30 240,138 292,138" fill="#34384d14"/>`;
    s += txt(252, 156, '近 · 影子短', { fs: 13, fill: '#2fbf71' });
    s += emo(120, 134, '🧍', 22);
    s += `<polygon points="320,30 120,138 168,138" fill="#34384d0f"/>`;
    s += txt(122, 156, '远 · 影子长', { fs: 13, fill: '#e25563' });
    s += txt(470, 70, '观察点越高、越近', { anchor: 'start', fs: 13, fill: MUT });
    s += txt(470, 90, '看到的范围越大', { anchor: 'start', fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 乘法分配律面积模型 */
  const areaModel = () => {
    const ox = 70, oy = 30, h = 70, w1 = 380, w2 = 40;
    let s = `<svg class="fig-svg" viewBox="0 0 640 158">`;
    s += `<rect x="${ox}" y="${oy}" width="${w1}" height="${h}" rx="8" fill="#2f9bd618" stroke="#2f9bd6" stroke-width="2"/>`;
    s += `<rect x="${ox + w1 + 8}" y="${oy}" width="${w2}" height="${h}" rx="8" fill="#2fbf7118" stroke="#2fbf71" stroke-width="2"/>`;
    s += txt(ox + w1 / 2, oy + 30, '100 × 45', { fill: '#2f9bd6', fs: 17 });
    s += txt(ox + w1 / 2, oy + 54, '= 4500', { fill: '#2f9bd6', fs: 15 });
    s += txt(ox + w1 + 8 + w2 / 2, oy + 30, '2', { fill: '#2fbf71', fs: 14 });
    s += txt(ox + w1 + 8 + w2 / 2, oy + 54, '×45', { fill: '#2fbf71', fs: 14 });
    s += `<path d="M ${ox} ${oy + h + 14} L ${ox + w1 + 8 + w2} ${oy + h + 14}" stroke="#d97745" stroke-width="2" marker-start="url(#fig-arrow)" marker-end="url(#fig-arrow)"/>`;
    s += txt(ox + (w1 + 48) / 2, oy + h + 34, '102 × 45 = 4500 + 90 = 4590', { fill: '#d97745', fs: 15 });
    s += txt(ox - 14, oy + h / 2 + 5, '45', { anchor: 'end', fs: 14, fill: MUT });
    s += txt(320, 148, '(100 + 2) × 45 = 100 × 45 + 2 × 45', { fs: 13.5, fill: MUT });
    return s + '</svg>';
  };

  /* 切开正方体 */
  const cubeCut = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 160">`;
    const faces = [
      ['110,40 210,20 310,40 210,60', '#dfe9f7'],
      ['110,40 210,60 210,150 110,130', '#c6d8ef'],
      ['210,60 310,40 310,130 210,150', '#aec7e6'],
    ];
    faces.forEach(f => s += `<polygon points="${f[0]}" fill="${f[1]}" stroke="#8fb0d8" stroke-width="2"/>`);
    s += `<polygon points="160,25 290,25 340,95 210,95" fill="#2fbf7133" stroke="#2fbf71" stroke-width="2.5" stroke-dasharray="6 4"/>`;
    s += txt(278, 118, '切面', { fill: '#2fbf71', fs: 14 });
    s += txt(500, 60, '与面平行地切', { anchor: 'start', fs: 13.5, fill: MUT });
    s += txt(500, 82, '切面是正方形', { anchor: 'start', fs: 13.5, fill: MUT });
    s += txt(500, 104, '斜着切，形状会不同', { anchor: 'start', fs: 13.5, fill: MUT });
    s += txt(500, 126, '先想象，再验证', { anchor: 'start', fs: 13.5, fill: '#2fbf71' });
    return s + '</svg>';
  };

  /* ================= 数学 · 互动演示 ================= */

  /* 角的分类演示 */
  const demoAngle = () => {
    const cx = 150, cy = 132, R = 92, R2 = 118;
    let s = `<svg class="fig-svg" viewBox="0 0 340 176">`;
    for (let a = 0; a <= 180; a += 30) {
      const rad = a * Math.PI / 180;
      s += `<line x1="${cx + (R2 - 6) * Math.cos(rad)}" y1="${cy - (R2 - 6) * Math.sin(rad)}" x2="${cx + R2 * Math.cos(rad)}" y2="${cy - R2 * Math.sin(rad)}" stroke="${MUT}" stroke-width="1.5"/>`;
      if (a % 90 === 0) s += txt(cx + (R2 + 14) * Math.cos(rad), cy - (R2 + 14) * Math.sin(rad) + 4, a + '°', { fs: 11, fill: MUT });
    }
    s += `<path class="ang-arc" d="M ${cx + R} ${cy} A ${R} ${R} 0 0 0 ${cx + R} ${cy} Z" fill="#e2556322" stroke="#e25563" stroke-width="1.5"/>`;
    s += `<line x1="${cx}" y1="${cy}" x2="${cx + R2}" y2="${cy}" stroke="${INK}" stroke-width="3"/>`;
    s += `<g class="ang-ray" transform="rotate(-60 ${cx} ${cy})"><line x1="${cx}" y1="${cy}" x2="${cx + R2}" y2="${cy}" stroke="#e25563" stroke-width="3"/></g>`;
    s += `<circle cx="${cx}" cy="${cy}" r="5" fill="${INK}"/>`;
    s += `<text class="ang-read" x="238" y="66" fill="#e25563" font-size="20" font-weight="800">60°</text>`;
    s += `<text class="ang-kind" x="238" y="92" fill="${MUT}" font-size="15" font-weight="700">锐角</text>`;
    s += txt(238, 118, '拖动滑块转一转', { fs: 12, fill: MUT });
    return s + '</svg>' +
      `<input class="fig-range" type="range" data-fig-input="angle" min="0" max="360" step="1" value="60" aria-label="旋转角的另一条边">` +
      `<div class="fig-ctrl">` +
      `<button class="fig-btn" data-fig-act="set-angle" data-v="60">锐角 60°</button>` +
      `<button class="fig-btn" data-fig-act="set-angle" data-v="90">直角 90°</button>` +
      `<button class="fig-btn" data-fig-act="set-angle" data-v="120">钝角 120°</button>` +
      `<button class="fig-btn" data-fig-act="set-angle" data-v="180">平角 180°</button>` +
      `<button class="fig-btn" data-fig-act="set-angle" data-v="360">周角 360°</button>` +
      `</div>`;
  };
  function angleKind(a) {
    a = ((a % 360) + 360) % 360;
    if (a === 0 || a === 360) return '周角';
    if (a === 90) return '直角';
    if (a === 180) return '平角';
    if (a < 90) return '锐角';
    if (a < 180) return '钝角';
    return '比平角大，还不到周角';
  }
  function setAngle(fig, a) {
    const cx = 150, cy = 132, R = 92;
    const rad = a * Math.PI / 180;
    fig.querySelector('.ang-ray').setAttribute('transform', `rotate(${-a} ${cx} ${cy})`);
    const x = cx + R * Math.cos(rad), y = cy - R * Math.sin(rad);
    const large = a > 180 ? 1 : 0;
    fig.querySelector('.ang-arc').setAttribute('d',
      `M ${cx + R} ${cy} A ${R} ${R} 0 ${large} 0 ${x.toFixed(2)} ${y.toFixed(2)} L ${cx} ${cy} Z`);
    fig.querySelector('.ang-read').textContent = a + '°';
    fig.querySelector('.ang-kind').textContent = angleKind(a);
    const slider = fig.querySelector('[data-fig-input="angle"]');
    if (slider && slider.value !== String(a)) slider.value = a;
  }

  /* 竖式逐步演示：114 × 21 */
  const demoVertical = () => {
    const mono = { mono: true, fs: 21 };
    const dim = { mono: true, fs: 21, fill: '#c6cddd' };
    let s = `<svg class="fig-svg" viewBox="0 0 340 176">`;
    s += `<rect class="v-hl v-hl1" x="120" y="76" width="160" height="26" rx="6" fill="#2f9bd622"/>`;
    s += `<rect class="v-hl v-hl2" x="100" y="104" width="180" height="26" rx="6" fill="#d9774522"/>`;
    s += `<rect class="v-hl v-hl3" x="100" y="132" width="180" height="26" rx="6" fill="#2fbf7122"/>`;
    s += txt(258, 40, '114', mono);
    s += txt(120, 40, '×', mono);
    s += txt(238, 66, '2', mono); s += txt(258, 66, '1', mono);
    s += `<line x1="100" y1="74" x2="280" y2="74" stroke="${INK}" stroke-width="2"/>`;
    s += `<g class="v-r1">${txt(218, 94, '1', dim)}${txt(238, 94, '1', dim)}${txt(258, 94, '4', dim)}${txt(320, 94, '×1', { fs: 12, fill: MUT, anchor: 'end' })}</g>`;
    s += `<g class="v-r2">${txt(178, 122, '2', dim)}${txt(198, 122, '2', dim)}${txt(218, 122, '8', dim)}${txt(320, 122, '×20', { fs: 12, fill: MUT, anchor: 'end' })}</g>`;
    s += `<line x1="100" y1="130" x2="280" y2="130" stroke="${INK}" stroke-width="2"/>`;
    s += `<g class="v-r3">${txt(178, 152, '2', dim)}${txt(198, 152, '3', dim)}${txt(218, 152, '9', dim)}${txt(238, 152, '4', dim)}</g>`;
    return s + '</svg>' +
      `<div class="fig-ctrl"><button class="fig-btn fig-primary" data-fig-act="vstep">下一步 ▶</button><button class="fig-btn" data-fig-act="vreset">↺ 重置</button></div>` +
      `<p class="fig-note" data-v-note>点「下一步」，看竖式的每一步</p>`;
  };
  const V_STEPS = [
    '① 用个位的 1 乘 114：114 × 1 = 114，末位和个位对齐',
    '② 再用十位的 2 乘 114：114 × 20 = 2280，末位和十位对齐',
    '③ 把两部分积加起来：114 + 2280 = 2394',
  ];
  function vApply(fig, step) {
    ['1', '2', '3'].forEach((k, i) => {
      fig.querySelector('.v-hl' + k).style.opacity = i < step ? '1' : '0';
      const row = fig.querySelector('.v-r' + k);
      row.querySelectorAll('text').forEach(t => {
        if (t.getAttribute('fill') === '#c6cddd') t.setAttribute('fill', i < step ? INK : '#c6cddd');
      });
    });
    fig.querySelector('[data-v-note]').textContent =
      step === 0 ? '点「下一步」，看竖式的每一步' : V_STEPS[step - 1];
    const btn = fig.querySelector('[data-fig-act="vstep"]');
    if (btn) { btn.textContent = step >= 3 ? '✓ 完成，可再点「↺ 重置」' : '下一步 ▶'; btn.disabled = step >= 3; }
  }

  /* 路程 = 速度 × 时间 */
  const demoSpeed = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 120">`;
    s += `<line x1="30" y1="78" x2="610" y2="78" stroke="${INK}" stroke-width="3"/>`;
    [0, 360, 720, 1080, 1440].forEach(d => {
      const x = 30 + d / 1440 * 580;
      s += `<line x1="${x}" y1="72" x2="${x}" y2="84" stroke="${INK}" stroke-width="2"/>`;
      s += txt(x, 104, d + ' 千米', { fs: 12, fill: MUT });
    });
    for (let x = 46; x < 604; x += 34) s += `<line x1="${x}" y1="70" x2="${x + 16}" y2="86" stroke="#e8ecf5" stroke-width="6"/>`;
    s += `<text class="sp-car" x="30" y="64" font-size="24">🚗</text>`;
    s += emo(30, 60, '', 1);
    s += txt(606, 56, '🏁', { fs: 18 });
    return s + '</svg>' +
      `<div class="fig-ctrl"><label class="fig-label">速度 <input class="fig-range fig-range-s" type="range" data-fig-input="sp-v" min="10" max="120" step="5" value="85"> <b class="sp-vv">85</b> 千米/时</label>` +
      `<label class="fig-label">时间 <input class="fig-range fig-range-s" type="range" data-fig-input="sp-t" min="1" max="12" step="1" value="4"> <b class="sp-tt">4</b> 时</label></div>` +
      `<p class="fig-note" data-sp-note>85 千米/时 × 4 时 = 340 千米</p>`;
  };
  function speedApply(fig) {
    const v = +fig.querySelector('[data-fig-input="sp-v"]').value;
    const t = +fig.querySelector('[data-fig-input="sp-t"]').value;
    const x = 30 + Math.min(v * t, 1440) / 1440 * 580;
    fig.querySelector('.sp-car').setAttribute('x', x.toFixed(1));
    fig.querySelector('.sp-vv').textContent = v;
    fig.querySelector('.sp-tt').textContent = t;
    fig.querySelector('[data-sp-note]').textContent = `${v} 千米/时 × ${t} 时 = ${v * t} 千米`;
  }

  /* 条形统计图：1 格代表几个单位 */
  const demoBar = () => {
    const data = [['跳绳', 5, '#e25563'], ['踢毽', 3, '#2fbf71'], ['游泳', 6, '#2f9bd6'], ['跑步', 4, '#d97745']];
    const base = 160, cell = 21, ox = 70, bw = 52, gap = 34;
    let s = `<svg class="fig-svg" viewBox="0 0 640 196">`;
    s += `<g class="bar-g1">`;
    for (let k = 1; k <= 6; k++) {
      const y = base - k * cell;
      s += `<line x1="${ox}" y1="${y}" x2="600" y2="${y}" stroke="#eef2f9"/>`;
      s += txt(ox - 10, y + 4, k, { fs: 11, fill: MUT, anchor: 'end' });
    }
    s += txt(ox - 10, base + 4, '0', { fs: 11, fill: MUT, anchor: 'end' });
    s += `</g>`;
    s += `<g class="bar-g2" style="display:none">`;
    [2, 4, 6].forEach(k => {
      const y = base - k * cell;
      s += `<line x1="${ox}" y1="${y}" x2="600" y2="${y}" stroke="#eef2f9"/>`;
      s += txt(ox - 10, y + 4, k, { fs: 11, fill: MUT, anchor: 'end' });
    });
    [1, 3, 5].forEach(k => {
      const y = base - k * cell;
      s += `<line x1="${ox}" y1="${y}" x2="600" y2="${y}" stroke="#f3c8cf" stroke-dasharray="4 4"/>`;
    });
    s += txt(ox - 10, base + 4, '0', { fs: 11, fill: MUT, anchor: 'end' });
    s += txt(ox - 10, base - cell - 8, '虚线是半格', { fs: 10.5, fill: '#c2557d', anchor: 'end' });
    s += `</g>`;
    s += `<line x1="${ox}" y1="${base}" x2="600" y2="${base}" stroke="${INK}" stroke-width="2"/>`;
    data.forEach((d, i) => {
      const x = ox + 30 + i * (bw + gap);
      s += `<rect x="${x}" y="${base - d[1] * cell}" width="${bw}" height="${d[1] * cell}" rx="6" fill="${d[2]}22" stroke="${d[2]}" stroke-width="2"/>`;
      s += txt(x + bw / 2, base - d[1] * cell - 8, d[1] + ' 人', { fs: 12.5, fill: d[2] });
      s += txt(x + bw / 2, base + 20, d[0], { fs: 14 });
    });
    s += txt(320, 20, '每格代表的人数不同，直条的画法也不同', { fs: 13, fill: MUT });
    return s + '</svg>' +
      `<div class="fig-ctrl"><button class="fig-btn fig-on" data-fig-act="bar-mode" data-v="1">1 格代表 1 人</button><button class="fig-btn" data-fig-act="bar-mode" data-v="2">1 格代表 2 人</button></div>` +
      `<p class="fig-note" data-bar-note>1 格代表 1 人：跳绳 5 人就画 5 格</p>`;
  };
  function barApply(fig, mode) {
    fig.querySelector('.bar-g1').style.display = mode === '1' ? '' : 'none';
    fig.querySelector('.bar-g2').style.display = mode === '2' ? '' : 'none';
    fig.querySelector('[data-bar-note]').textContent = mode === '1'
      ? '1 格代表 1 人：跳绳 5 人就画 5 格'
      : '1 格代表 2 人：跳绳 5 人 = 2 格半（到虚线再往上半格）';
    fig.querySelectorAll('[data-fig-act="bar-mode"]').forEach(b => b.classList.toggle('fig-on', b.dataset.v === mode));
  }

  /* 数线段演示 */
  const demoSegCount = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 150">`;
    s += `<g class="seg-arcs"></g>`;
    s += `<line class="seg-base" x1="60" y1="112" x2="580" y2="112" stroke="${INK}" stroke-width="3"/>`;
    s += `<g class="seg-pts"></g>`;
    s += `<text class="seg-read" x="320" y="138" text-anchor="middle" fill="#35567e" font-size="16" font-weight="800"></text>`;
    return s + '</svg>' +
      `<div class="fig-ctrl"><label class="fig-label">点数 <input class="fig-range fig-range-s" type="range" data-fig-input="seg-n" min="3" max="7" step="1" value="5"> <b class="seg-nn">5</b> 个点</label></div>`;
  };
  function segApply(fig) {
    const n = +fig.querySelector('[data-fig-input="seg-n"]').value;
    const x0 = 60, x1 = 580, y = 112;
    const px = i => x0 + i / (n - 1) * (x1 - x0);
    let arcs = '', pts = '';
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const mx = (px(i) + px(j)) / 2, h = (j - i) * 15 + 8;
        arcs += `<path d="M ${px(i)} ${y} Q ${mx} ${y - h} ${px(j)} ${y}" fill="none" stroke="#4d96ff" stroke-width="1.6" opacity=".75"/>`;
      }
    }
    for (let i = 0; i < n; i++) {
      pts += `<circle cx="${px(i)}" cy="${y}" r="6" fill="#2fbf71" stroke="#fff" stroke-width="2"/>`;
    }
    fig.querySelector('.seg-arcs').innerHTML = arcs;
    fig.querySelector('.seg-pts').innerHTML = pts;
    fig.querySelector('.seg-nn').textContent = n;
    const terms = [];
    for (let k = n - 1; k >= 1; k--) terms.push(k);
    fig.querySelector('.seg-read').textContent =
      `${n} 个点：${terms.join(' + ')} = ${n * (n - 1) / 2} 条线段`;
  }

  /* ================= 语文 · 单元横幅 ================= */
  const banner = (e1, mid, e2, color) => {
    let s = `<svg viewBox="0 0 900 96" preserveAspectRatio="xMidYMid slice">`;
    s += `<rect width="900" height="96" rx="12" fill="${color}14"/>`;
    s += `<circle cx="80" cy="48" r="34" fill="${color}22"/><circle cx="820" cy="48" r="34" fill="${color}22"/>`;
    s += `<line x1="130" y1="48" x2="770" y2="48" stroke="${color}" stroke-opacity=".25" stroke-width="2" stroke-dasharray="10 8"/>`;
    s += txt(80, 58, e1, { fs: 30 });
    s += txt(820, 58, e2, { fs: 30 });
    s += txt(450, 58, mid, { fs: 26 });
    return s + '</svg>';
  };
  const banners = {
    'bn-u1': () => banner('🌊', '🐚🪁🌤️', '🌅', '#2f9bd6'),
    'bn-u2': () => banner('💡', '🔍🧠💬', '❓', '#7c5cc4'),
    'bn-u3': () => banner('🔎', '🦗🍃🪴', '🌱', '#2fbf71'),
    'bn-u4': () => banner('✨', '🐉🌊🔥', '🏔️', '#d97745'),
    'bn-u5': () => banner('📝', '🐦🌳⛰️', '✏️', '#e25563'),
    'bn-u6': () => banner('🏛️', '🏯🛕🐉', '🧱', '#b5893a'),
    'bn-u7': () => banner('🪁', '🎡🎠🐯', '🌈', '#157d73'),
    'bn-u8': () => banner('🎖️', '📜🕯️🏛️', '🌅', '#c2557d'),
  };

  /* ================= 语文 · 课文图示 ================= */

  /* 观潮：潮来三阶段 */
  const tide = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 150">`;
    s += `<path d="M0 120 Q 40 104 80 120 T 160 120 T 240 120 T 320 120 T 400 120 T 480 120 T 560 120 T 640 120 V 150 H 0 Z" fill="#2f9bd626"/>`;
    s += `<path d="M0 132 Q 40 120 80 132 T 160 132 T 240 132 T 320 132 T 400 132 T 480 132 T 560 132 T 640 132 V 150 H 0 Z" fill="#2f9bd64d"/>`;
    const stages = [['〰️', '一条白线', 110], ['🧱', '一堵水墙', 320], ['🐎', '战马奔腾', 530]];
    stages.forEach((st, i) => {
      s += txt(st[2], 58, st[0], { fs: 30 });
      s += txt(st[2], 88, st[1], { fs: 14 });
      if (i < 2) s += arrow(st[2] + 52, 52, st[2] + 118, 52, '#2f9bd6');
    });
    s += txt(320, 140, '潮来前人山人海 → 潮来时声音如山崩地裂 → 潮头过后风号浪吼', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* 夜间飞行的秘密：蝙蝠 ↔ 雷达对应表 */
  const batRadar = () => {
    const rows = [['嘴', '发出超声波', '天线', '发出无线电波'], ['超声波', '遇到障碍物反射', '无线电波', '遇到障碍物反射'], ['耳朵', '接收回声探路', '荧光屏', '接收回波定位']];
    let s = `<svg class="fig-svg" viewBox="0 0 640 190">`;
    s += emo(120, 36, '🦇', 26); s += txt(120, 60, '蝙蝠夜里这样探路', { fs: 13, fill: '#7c5cc4' });
    s += emo(520, 36, '📡', 26); s += txt(520, 60, '雷达是这样发明的', { fs: 13, fill: '#2f9bd6' });
    rows.forEach((r, i) => {
      const y = 88 + i * 34;
      s += txt(120, y, r[0], { fs: 15, fill: '#7c5cc4' });
      s += txt(230, y, r[1], { fs: 12.5, fill: MUT });
      s += arrow(300, y - 5, 340, y - 5, '#8fb0d8');
      s += txt(410, y, r[3], { fs: 12.5, fill: MUT });
      s += txt(520, y, r[2], { fs: 15, fill: '#2f9bd6' });
    });
    s += txt(320, 182, '一一对应——这就是「仿生学」', { fs: 13, fill: '#d97745' });
    return s + '</svg>';
  };

  /* 田忌赛马对阵表（HTML 表格） */
  const raceMatrix = () => {
    const rows = [
      ['第一局', '下等马 ❌', '上等马', '输'],
      ['第二局', '上等马 ✅', '中等马', '赢'],
      ['第三局', '中等马 ✅', '下等马', '赢'],
    ];
    let h = '<table class="fig-table"><thead><tr><th>局次</th><th>田忌（孙膑的安排）</th><th>齐威王</th><th>结果</th></tr></thead><tbody>';
    rows.forEach(r => {
      h += `<tr><td>${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td><td class="${r[3] === '赢' ? 'fig-win' : 'fig-lose'}">${r[3]}</td></tr>`;
    });
    h += '</tbody></table><p class="fig-cap">同样的马，调整出场顺序：两胜一负，反败为胜 🏆</p>';
    return h;
  };

  /* 田忌赛马·调兵对阵（互动演示） */
  const demoRace = () => {
    const rows = [
      ['第一局', '下等马', '上等马', '输', '用最弱的马「送」掉对方最强的马'],
      ['第二局', '上等马', '中等马', '赢', '用最强的马稳稳拿下一局'],
      ['第三局', '中等马', '下等马', '赢', '再用中等马再下一城'],
    ];
    let h = '<table class="fig-table"><thead><tr><th>局次</th><th>田忌（孙膑的安排）</th><th>齐威王</th><th>结果</th></tr></thead><tbody>';
    rows.forEach((r, i) => {
      h += `<tr class="race-row" data-i="${i}"><td>${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td><td class="race-res"></td></tr>`;
    });
    h += '</tbody></table>';
    h += '<p class="fig-note race-note">点「下一步」，看孙膑怎么调兵</p>';
    h += '<div class="fig-ctrl"><button class="fig-btn fig-primary" data-fig-act="race-step">下一步 ▶</button><button class="fig-btn" data-fig-act="race-reset">↺ 重置</button></div>';
    return h;
  };
  const RACE_RES = ['输 ❌', '赢 ✅', '赢 ✅'];
  const RACE_NOTES = [
    '点「下一步」，看孙膑怎么调兵',
    '第一局：用最弱的马「送」掉对方最强的马（故意输一场）',
    '第二局：用最强的马，稳稳赢下对方的中等马',
    '第三局：用中等马再下一城——三局两胜，反败为胜 🏆',
  ];
  function raceApply(fig, step) {
    fig.querySelectorAll('.race-row').forEach(row => {
      const i = +row.dataset.i;
      row.style.opacity = i < step ? '1' : '0.25';
      const res = row.querySelector('.race-res');
      if (i < step) {
        res.textContent = RACE_RES[i];
        res.className = 'race-res ' + (RACE_RES[i].indexOf('赢') === 0 ? 'fig-win' : 'fig-lose');
      } else {
        res.textContent = '';
        res.className = 'race-res';
      }
    });
    fig.querySelector('.race-note').textContent = RACE_NOTES[step];
    const btn = fig.querySelector('[data-fig-act="race-step"]');
    if (btn) { btn.textContent = step >= 3 ? '✓ 全部讲完' : '下一步 ▶'; btn.disabled = step >= 3; }
  }

  /* 爬山虎的脚 */
  const ivyFoot = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 176">`;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
      s += `<rect x="${430 + (r % 2) * 26 + c * 52}" y="${14 + r * 32}" width="48" height="28" rx="3" fill="#f3ede2" stroke="#e5d9c4"/>`;
    }
    s += `<path d="M 180 160 C 200 110 210 80 230 40" fill="none" stroke="#2fbf71" stroke-width="5"/>`;
    [[205, 95], [222, 60]].forEach(p => {
      s += `<path d="M ${p[0]} ${p[1]} q 26 -14 40 6 q -22 12 -40 -6" fill="#57c785"/>`;
    });
    s += `<circle cx="238" cy="34" r="26" fill="#fff" stroke="#d97745" stroke-width="2"/>`;
    s += `<line x1="234" y1="52" x2="224" y2="34" stroke="#d97745" stroke-width="2"/>`;
    for (let i = 0; i < 5; i++) {
      const a = -30 - i * 30;
      const rad = a * Math.PI / 180;
      s += `<line x1="238" y1="34" x2="${238 + 18 * Math.cos(rad)}" y2="${34 + 18 * Math.sin(rad)}" stroke="#e25563" stroke-width="2"/>`;
      s += `<circle cx="${238 + 20 * Math.cos(rad)}" cy="${34 + 20 * Math.sin(rad)}" r="3" fill="#e25563"/>`;
    }
    s += txt(238, 12, '放大看「脚」', { fs: 12, fill: '#d97745' });
    const notes = [['嫩茎（会弯，被拉一把）', 176, 36, '#2fbf71'], ['叶柄', 176, 96, '#2fbf71'], ['枝状的六七根细丝——像蜗牛的触角', 296, 132, '#e25563']];
    notes.forEach(n => {
      s += `<circle cx="${n[1]}" cy="${n[2]}" r="4.5" fill="${n[3]}"/>`;
      s += txt(n[1] + 12, n[2] + 5, n[0], { anchor: 'start', fs: 12.5, fill: n[3] });
    });
    s += txt(556, 166, '小圆片巴住墙', { anchor: 'end', fs: 12.5, fill: '#8a8498' });
    return s + '</svg>';
  };

  /* 蟋蟀的住宅剖面 */
  const cricketHome = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 170">`;
    s += `<path d="M0 60 Q 160 30 320 52 T 640 44 V 170 H 0 Z" fill="#8a9a5b26"/>`;
    s += `<path d="M0 60 Q 160 30 320 52 T 640 44" fill="none" stroke="#7d8c50" stroke-width="2.5"/>`;
    s += `<path d="M 210 56 q -8 26 6 44 q 16 20 44 18 q 40 -2 52 -24" fill="none" stroke="#b08968" stroke-width="10" stroke-linecap="round"/>`;
    s += `<ellipse cx="322" cy="92" rx="34" ry="20" fill="#f0e3cd" stroke="#b08968" stroke-width="2"/>`;
    s += `<path d="M 176 52 q 14 -10 28 2 q -12 10 -28 -2" fill="#57c785"/>`;
    s += txt(190, 34, '门口一丛草（半掩）', { fs: 12.5, fill: '#2fbf71' });
    s += txt(320, 132, '大厅', { fs: 13, fill: '#b08968' });
    s += txt(226, 84, '倾斜的隧道', { fs: 12.5, fill: '#8a6a4d' });
    s += txt(420, 70, '平台：蟋蟀在这里弹琴', { anchor: 'start', fs: 12.5, fill: '#e25563' });
    s += `<circle cx="404" cy="54" r="4" fill="#e25563"/>`;
    s += txt(500, 120, '向阳 · 隐蔽 · 排水好', { anchor: 'start', fs: 13, fill: MUT });
    s += txt(500, 142, '「伟大的工程」', { anchor: 'start', fs: 14, fill: '#d97745' });
    return s + '</svg>';
  };

  /* 精卫填海 */
  const jingwei = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 150">`;
    s += `<circle cx="560" cy="34" r="18" fill="#ffb75e"/>`;
    s += `<path d="M0 118 Q 40 106 80 118 T 160 118 T 240 118 T 320 118 T 400 118 T 480 118 T 560 118 T 640 118 V 150 H 0 Z" fill="#2f9bd633"/>`;
    s += `<path d="M0 132 Q 40 122 80 132 T 160 132 T 240 132 T 320 132 T 400 132 T 480 132 T 560 132 T 640 132 V 150 H 0 Z" fill="#2f9bd659"/>`;
    s += `<path d="M 180 70 q 22 -20 44 -6 q 10 6 6 16 q -18 4 -30 -2 q -14 -4 -20 -8 Z" fill="#5a5570"/>`;
    s += `<path d="M 210 84 q 10 14 -4 20" fill="none" stroke="#5a5570" stroke-width="3"/>`;
    s += `<line x1="228" y1="78" x2="258" y2="64" stroke="#8a6a4d" stroke-width="3.5"/>`;
    s += txt(300, 70, '常衔西山之木石', { anchor: 'start', fs: 14, fill: MUT });
    s += emo(430, 112, '🪨', 20);
    s += arrow(470, 104, 520, 116, '#2f9bd6');
    s += txt(556, 142, '以堙于东海', { anchor: 'end', fs: 13, fill: '#2f9bd6' });
    s += txt(320, 40, '炎帝之少女，名曰女娃', { fs: 13.5, fill: '#8a8498' });
    return s + '</svg>';
  };

  /* 长城剖面 */
  const greatwall = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 176">`;
    s += `<path d="M0 150 Q 200 120 640 138 V 176 H 0 Z" fill="#c8ddb433"/>`;
    s += `<path d="M0 150 Q 200 120 640 138" fill="none" stroke="#a5c48a" stroke-width="2.5"/>`;
    s += `<path d="M 60 138 L 60 74 L 300 62 L 300 130 Q 180 128 60 138 Z" fill="#d9d2c4" stroke="#b3a893" stroke-width="2"/>`;
    for (let i = 0; i < 5; i++) s += `<rect x="${70 + i * 48}" y="${i % 2 ? 58 : 46}" width="30" height="20" fill="#c9c1ae" stroke="#b3a893" stroke-width="1.5"/>`;
    s += `<rect x="96" y="88" width="18" height="14" fill="#8a8498"/>`;
    s += txt(105, 122, '瞭望口 / 射口', { fs: 12, fill: '#8a8498' });
    s += `<rect x="330" y="52" width="64" height="76" fill="#cdc5b2" stroke="#b3a893" stroke-width="2"/>`;
    s += `<rect x="344" y="40" width="36" height="14" fill="#cdc5b2" stroke="#b3a893"/>`;
    s += txt(362, 148, '城台（屯兵的堡垒）', { fs: 12.5, fill: MUT });
    s += txt(180, 34, '垛子高 2 米多', { fs: 12.5, fill: '#b3a893' });
    s += txt(520, 70, '像一条长龙', { anchor: 'start', fs: 14, fill: '#b5893a' });
    s += txt(520, 92, '一万三千多里', { anchor: 'start', fs: 14, fill: '#b5893a' });
    s += txt(520, 114, '五六匹马可以并行', { anchor: 'start', fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 颐和园游览路线（HTML） */
  const routeMap = () => {
    const stops = [['🏮', '长廊', '一眼望不到头，横槛上画着画'], ['🏯', '万寿山', '佛香阁耸立在半山腰'], ['🌊', '昆明湖', '湖面像镜子、像碧玉'], ['🌉', '十七孔桥', '石柱上的小狮子姿态不一']];
    let h = '<div class="fig-flow">';
    stops.forEach((s, i) => {
      h += `<div class="fig-stop"><span class="fig-stop-ico">${s[0]}</span><b>${i + 1}. ${s[1]}</b><i>${s[2]}</i></div>`;
      if (i < stops.length - 1) h += '<span class="fig-flow-arrow">➜</span>';
    });
    h += '</div><p class="fig-cap">移步换景：跟着「进了—来到—走完」的句子游览</p>';
    return h;
  };

  /* ================= 语文 · 古诗文场景插画 ================= */

  /* 鹿柴：空山深林，夕阳返照青苔 */
  const poemLuzhai = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 160">`;
    s += `<rect width="640" height="160" fill="#f4f1e8"/>`;
    /* 远山 */
    s += `<path d="M0 110 Q 120 70 220 100 T 440 90 T 640 100 V 160 H 0 Z" fill="#d9d4c4"/>`;
    /* 树林剪影 */
    for (let i = 0; i < 9; i++) {
      const x = 40 + i * 72, h = 50 + (i % 3) * 14;
      s += `<rect x="${x}" y="${130 - h}" width="14" height="${h}" fill="#8a9a7a"/>`;
      s += `<circle cx="${x + 7}" cy="${130 - h}" r="18" fill="#9aaa88"/>`;
    }
    /* 夕阳光柱 */
    s += `<polygon points="300,30 380,30 360,130 320,130" fill="#ffd66b44"/>`;
    s += `<polygon points="300,30 380,30 360,130 320,130" fill="url(#sunray)" opacity=".5"/>`;
    s += `<circle cx="340" cy="30" r="14" fill="#ffb84d"/>`;
    /* 青苔 */
    s += `<ellipse cx="340" cy="138" rx="60" ry="10" fill="#6b8f4f55"/>`;
    s += txt(340, 152, '返景入深林，复照青苔上', { fs: 13, fill: '#7a6a3a' });
    s += txt(120, 50, '空山不见人', { fs: 14, fill: '#8a8478', anchor: 'start' });
    s += txt(120, 72, '但闻人语响', { fs: 14, fill: '#8a8478', anchor: 'start' });
    s += `<path d="M 170 56 q 12 -6 24 0" fill="none" stroke="#8a8478" stroke-width="1.5" stroke-dasharray="3 3"/>`;
    return s + '</svg>';
  };

  /* 暮江吟：残阳铺水，半江瑟瑟半江红，露似珍珠月似弓 */
  const poemMujiang = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 160">`;
    s += `<defs><linearGradient id="sky-mj" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd9a8"/><stop offset="1" stop-color="#ff8a5c"/></linearGradient></defs>`;
    s += `<rect width="640" height="80" fill="url(#sky-mj)"/>`;
    s += `<circle cx="120" cy="70" r="22" fill="#ff5a3c"/>`;
    /* 江水 */
    s += `<path d="M0 80 Q 160 70 320 80 T 640 80 V 160 H 0 Z" fill="#2a6f8f"/>`;
    /* 半江红 */
    s += `<path d="M0 80 Q 160 70 320 80 T 640 80 V 160 H 0 Z" fill="#e25563" opacity=".55" mask="url(#half-mask)"/>`;
    s += `<path d="M 60 110 Q 100 104 140 110 T 220 110" fill="none" stroke="#ffb84d" stroke-width="2"/>`;
    s += `<path d="M 300 120 Q 340 114 380 120 T 460 120" fill="none" stroke="#ffd66b" stroke-width="2"/>`;
    /* 弯月 */
    s += `<path d="M 540 30 a 14 14 0 1 0 16 12 a 10 10 0 1 1 -16 -12 Z" fill="#fff8e0"/>`;
    /* 露珠 */
    s += `<ellipse cx="440" cy="130" rx="5" ry="6" fill="#fff8e0" stroke="#b9d4e0"/>`;
    s += `<ellipse cx="470" cy="134" rx="4" ry="5" fill="#fff8e0" stroke="#b9d4e0"/>`;
    s += `<ellipse cx="500" cy="128" rx="5" ry="6" fill="#fff8e0" stroke="#b9d4e0"/>`;
    s += txt(320, 152, '露似真珠月似弓', { fs: 13, fill: '#7a5a3a' });
    s += txt(320, 20, '一道残阳铺水中，半江瑟瑟半江红', { fs: 13, fill: '#fff', fw: 800 });
    return s + '</svg>';
  };

  /* 题西林壁：庐山横看侧看各不同 */
  const poemLushan = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 170">`;
    s += `<rect width="640" height="170" fill="#eef4fd"/>`;
    /* 横看：连绵山岭 */
    s += `<path d="M20 120 Q 60 70 100 90 Q 140 60 180 100 Q 220 70 260 95 Q 300 65 340 120 Z" fill="#7ba6c9"/>`;
    s += txt(180, 140, '横看 → 连绵山岭', { fs: 12, fill: '#4a6b8a' });
    s += arrow(200, 130, 200, 110, '#4a6b8a');
    /* 侧看：高耸山峰 */
    s += `<path d="M400 120 L 440 40 L 470 80 L 500 30 L 540 90 L 580 60 L 620 120 Z" fill="#c97b7b"/>`;
    s += txt(510, 140, '侧看 → 高耸山峰', { fs: 12, fill: '#8a4a4a' });
    s += arrow(510, 130, 500, 60, '#8a4a4a');
    s += txt(320, 162, '不识庐山真面目，只缘身在此山中', { fs: 13.5, fill: '#35567e' });
    return s + '</svg>';
  };

  /* 雪梅：梅雪争春 */
  const poemXuemei = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 150">`;
    s += `<rect width="640" height="150" fill="#faf6f9"/>`;
    /* 雪花 */
    [[80, 30], [140, 60], [60, 90], [200, 40]].forEach(p => s += txt(p[0], p[1], '❄', { fs: 18, fill: '#b9d4e0' }));
    /* 梅枝 */
    s += `<path d="M 360 130 Q 380 80 420 60 Q 460 40 520 50" fill="none" stroke="#6b4a3a" stroke-width="5"/>`;
    s += `<path d="M 420 60 Q 440 30 470 20" fill="none" stroke="#6b4a3a" stroke-width="3"/>`;
    /* 梅花 */
    [[430, 55], [460, 35], [500, 50], [520, 65], [480, 70]].forEach(p => {
      for (let a = 0; a < 5; a++) {
        const r = a * 72 * Math.PI / 180;
        s += `<circle cx="${p[0] + 5 * Math.cos(r)}" cy="${p[1] + 5 * Math.sin(r)}" r="5" fill="#f2a8c0"/>`;
      }
      s += `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="#fff3b0"/>`;
    });
    s += txt(150, 110, '雪', { fs: 28, fill: '#7ba6c9' });
    s += txt(500, 110, '梅', { fs: 28, fill: '#d95f8a' });
    s += arrow(220, 100, 380, 100, '#d97745');
    s += txt(320, 138, '梅须逊雪三分白，雪却输梅一段香', { fs: 13, fill: '#7a4a5a' });
    return s + '</svg>';
  };

  /* 嫦娥：云母屏风烛影深，碧海青天夜夜心 */
  const poemChange = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 160">`;
    s += `<defs><radialGradient id="moon-g" cx="50%" cy="50%"><stop offset="0" stop-color="#fff8e0"/><stop offset="1" stop-color="#e8d9a8"/></radialGradient></defs>`;
    s += `<rect width="640" height="160" fill="#1a2240"/>`;
    /* 星星 */
    [[60, 30], [120, 50], [200, 25], [560, 40], [600, 80], [500, 20]].forEach(p =>
      s += `<circle cx="${p[0]}" cy="${p[1]}" r="1.5" fill="#fff"/>`);
    /* 月亮 */
    s += `<circle cx="480" cy="60" r="38" fill="url(#moon-g)"/>`;
    s += `<circle cx="470" cy="52" r="6" fill="#d8c890" opacity=".5"/>`;
    s += `<circle cx="492" cy="70" r="4" fill="#d8c890" opacity=".5"/>`;
    /* 屏风 */
    s += `<rect x="60" y="40" width="120" height="110" rx="4" fill="#3a2f5a" stroke="#c9a84a" stroke-width="2"/>`;
    for (let i = 0; i < 4; i++) s += `<line x1="${60 + i * 30}" y1="40" x2="${60 + i * 30}" y2="150" stroke="#c9a84a" stroke-width="1"/>`;
    /* 烛影 */
    s += `<rect x="100" y="100" width="6" height="30" fill="#e8c870"/>`;
    s += `<ellipse cx="103" cy="96" rx="5" ry="10" fill="#ffb84d"/>`;
    s += `<ellipse cx="103" cy="94" rx="3" ry="6" fill="#ffe08a"/>`;
    s += txt(320, 150, '嫦娥应悔偷灵药，碧海青天夜夜心', { fs: 13, fill: '#c9b8e0' });
    return s + '</svg>';
  };

  /* 别董大：千里黄云白日曛，北风吹雁雪纷纷 */
  const poemBiedongda = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 150">`;
    s += `<rect width="640" height="150" fill="#e8dcc0"/>`;
    /* 黄云 */
    s += `<ellipse cx="160" cy="40" rx="120" ry="22" fill="#c9b878" opacity=".7"/>`;
    s += `<ellipse cx="420" cy="30" rx="140" ry="20" fill="#b8a868" opacity=".6"/>`;
    /* 曛日 */
    s += `<circle cx="520" cy="50" r="20" fill="#e8a040" opacity=".8"/>`;
    /* 雪 */
    for (let i = 0; i < 20; i++) s += `<circle cx="${20 + i * 32}" cy="${30 + (i % 4) * 22}" r="2" fill="#fff" opacity=".8"/>`;
    /* 归雁 */
    s += `<path d="M 200 70 q 10 -8 20 0 q 10 -8 20 0" fill="none" stroke="#5a5570" stroke-width="2"/>`;
    s += `<path d="M 260 80 q 8 -6 16 0 q 8 -6 16 0" fill="none" stroke="#5a5570" stroke-width="2"/>`;
    s += `<path d="M 150 86 q 8 -6 16 0 q 8 -6 16 0" fill="none" stroke="#5a5570" stroke-width="2"/>`;
    /* 人物剪影 */
    s += `<circle cx="100" cy="110" r="8" fill="#5a5570"/>`;
    s += `<path d="M 100 118 L 100 140 M 100 124 L 88 134 M 100 124 L 112 130" stroke="#5a5570" stroke-width="3" fill="none"/>`;
    s += txt(320, 140, '莫愁前路无知己，天下谁人不识君', { fs: 13.5, fill: '#7a5a3a', fw: 800 });
    return s + '</svg>';
  };

  /* 凉州词：葡萄美酒夜光杯，欲饮琵琶马上催 */
  const poemLiangzhou = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 150">`;
    s += `<rect width="640" height="150" fill="#f4e8d8"/>`;
    /* 夜光杯 */
    s += `<path d="M 120 70 L 160 70 L 150 120 L 130 120 Z" fill="#2a4a6a" stroke="#c9a84a" stroke-width="2"/>`;
    s += `<ellipse cx="140" cy="70" rx="22" ry="7" fill="#6a2a3a" stroke="#c9a84a" stroke-width="2"/>`;
    s += `<ellipse cx="140" cy="68" rx="18" ry="4" fill="#9a3a5a" opacity=".7"/>`;
    /* 葡萄 */
    [[70, 100], [82, 108], [76, 118], [88, 124], [64, 116]].forEach(p => s += `<circle cx="${p[0]}" cy="${p[1]}" r="7" fill="#7a3a8a" stroke="#5a2a6a"/>`);
    s += txt(75, 142, '葡萄美酒', { fs: 12, fill: '#7a3a8a' });
    /* 马与琵琶 */
    s += `<path d="M 340 120 q 20 -30 60 -20 q 10 4 20 -4 q 8 -6 14 -2 l 6 8 q 4 6 -2 10 l -4 4 l -6 14 l -10 4 l -2 12 l -14 -2 l -2 -10 l -28 0 l -10 -8 Z" fill="#8a6a4a"/>`;
    s += `<circle cx="448" cy="86" r="6" fill="#8a6a4a"/>`;
    s += `<line x1="456" y1="84" x2="466" y2="78" stroke="#5a4a3a" stroke-width="3"/>`;
    s += `<ellipse cx="380" cy="92" rx="16" ry="10" fill="#c9a84a" stroke="#8a6a3a"/>`;
    s += `<line x1="380" y1="82" x2="380" y2="102" stroke="#5a4a3a"/>`;
    s += txt(400, 142, '马上琵琶催', { fs: 12, fill: '#7a5a3a' });
    s += txt(320, 30, '醉卧沙场君莫笑，古来征战几人回', { fs: 13, fill: '#8a4a3a', fw: 800 });
    return s + '</svg>';
  };

  /* 出塞：秦时明月汉时关 */
  const poemChusai = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 150">`;
    s += `<rect width="640" height="150" fill="#2a2a4a"/>`;
    /* 明月 */
    s += `<circle cx="500" cy="40" r="26" fill="#fff8e0"/>`;
    s += `<circle cx="492" cy="34" r="4" fill="#e0d4a8" opacity=".6"/>`;
    /* 关城 */
    s += `<rect x="80" y="80" width="200" height="60" fill="#6a5a4a"/>`;
    for (let i = 0; i < 8; i++) s += `<rect x="${84 + i * 25}" y="70" width="14" height="14" fill="#6a5a4a"/>`;
    s += `<rect x="160" y="96" width="30" height="44" fill="#3a2a1a"/>`;
    /* 远山 */
    s += `<path d="M0 100 Q 120 60 240 90 T 480 80 T 640 90 V 150 H 0 Z" fill="#3a3a5a"/>`;
    /* 长城延伸 */
    s += `<path d="M 280 110 L 360 96 L 440 104 L 520 92 L 600 100" fill="none" stroke="#7a6a5a" stroke-width="6"/>`;
    s += txt(320, 140, '但使龙城飞将在，不教胡马度阴山', { fs: 13, fill: '#e0d4a8', fw: 800 });
    return s + '</svg>';
  };

  /* 夏日绝句：生当作人杰，死亦为鬼雄 */
  const poemXrj = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 150">`;
    s += `<defs><linearGradient id="bg-xrj" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1a2a"/><stop offset="1" stop-color="#7a2a3a"/></linearGradient></defs>`;
    s += `<rect width="640" height="150" fill="url(#bg-xrj)"/>`;
    /* 江水 */
    s += `<path d="M0 110 Q 160 100 320 110 T 640 110 V 150 H 0 Z" fill="#1a2a4a"/>`;
    s += `<path d="M0 120 Q 160 112 320 120 T 640 120" fill="none" stroke="#4a6a8a" stroke-width="2"/>`;
    /* 项羽剪影（佩剑立江岸） */
    s += `<path d="M 300 60 L 320 50 L 340 60 L 336 110 L 304 110 Z" fill="#1a1a1a"/>`;
    s += `<line x1="320" y1="50" x2="320" y2="30" stroke="#c9a84a" stroke-width="3"/>`;
    s += `<line x1="340" y1="70" x2="360" y2="108" stroke="#c9a84a" stroke-width="3"/>`;
    s += `<line x1="356" y1="100" x2="364" y2="108" stroke="#c9a84a" stroke-width="3"/>`;
    s += txt(320, 24, '生当作人杰，死亦为鬼雄', { fs: 15, fill: '#ffd66b', fw: 900 });
    s += txt(320, 140, '至今思项羽，不肯过江东', { fs: 13, fill: '#e8c870' });
    return s + '</svg>';
  };

  /* 王戎不取道旁李：道边李树多子折枝 */
  const poemWangrong = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 150">`;
    s += `<rect width="640" height="150" fill="#f4f1e0"/>`;
    /* 路 */
    s += `<path d="M0 130 Q 320 120 640 135 V 150 H 0 Z" fill="#d4c8a8"/>`;
    /* 李树 */
    s += `<rect x="140" y="80" width="12" height="56" fill="#6b4a3a"/>`;
    s += `<circle cx="146" cy="60" r="40" fill="#6b8f4f"/>`;
    /* 李子累累 */
    for (let i = 0; i < 14; i++) {
      const a = i * 0.5, r = 28 + (i % 3) * 8;
      s += `<circle cx="${146 + r * Math.cos(a)}" cy="${60 + r * Math.sin(a)}" r="6" fill="#b04a4a" stroke="#8a3a3a"/>`;
    }
    s += `<path d="M 120 70 q 30 -16 60 -4 q -30 12 -60 4" fill="#5a7a3f" opacity=".6"/>`;
    /* 众小儿跑 */
    [[320, 120, '#e25563'], [360, 122, '#2f9bd6'], [400, 118, '#2fbf71']].forEach(p => {
      s += `<circle cx="${p[0]}" cy="${p[1] - 20}" r="7" fill="${p[2]}"/>`;
      s += `<path d="M ${p[0]} ${p[1] - 13} l 0 16 M ${p[0]} ${p[1] - 6} l -10 8 M ${p[0]} ${p[1] - 6} l 10 8 M ${p[0]} ${p[1] + 3} l -6 10 M ${p[0]} ${p[1] + 3} l 6 10" stroke="${p[2]}" stroke-width="3" fill="none"/>`;
    });
    /* 王戎不动 */
    s += `<circle cx="520" cy="108" r="8" fill="#7c5cc4"/>`;
    s += `<path d="M 520 116 l 0 16 M 520 122 l -10 6 M 520 122 l 10 6 M 520 132 l -6 8 M 520 132 l 6 8" stroke="#7c5cc4" stroke-width="3" fill="none"/>`;
    s += txt(520, 98, '王戎不动', { fs: 12, fill: '#7c5cc4' });
    s += txt(320, 146, '树在道边而多子，此必苦李', { fs: 13, fill: '#7a5a3a', fw: 800 });
    return s + '</svg>';
  };

  /* ================= 语文 · 补充课文图示 ================= */

  /* 繁星：三次看星 */
  const stars = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 160">`;
    s += `<rect width="640" height="160" fill="#0f1a3a"/>`;
    const scenes = [
      { x: 120, label: '从前·家乡庭院', desc: '密密麻麻的繁星' },
      { x: 320, label: '三年前·南京', desc: '星光微小，光明无处不在' },
      { x: 520, label: '如今·海上', desc: '萤火虫飞舞，睡在母亲怀里' },
    ];
    scenes.forEach((sc, i) => {
      s += `<circle cx="${sc.x}" cy="${i === 2 ? 110 : 70}" r="44" fill="#1a2a5a" stroke="#3a5a8a" stroke-width="1.5"/>`;
      for (let k = 0; k < 12; k++) {
        const a = k * 0.9 + i, r = 14 + (k % 4) * 8;
        s += `<circle cx="${sc.x + r * Math.cos(a)}" cy="${(i === 2 ? 110 : 70) + r * Math.sin(a)}" r="${1 + (k % 2)}" fill="#fff8e0"/>`;
      }
      s += txt(sc.x, 30, sc.label, { fs: 12, fill: '#9ab8e0' });
      s += txt(sc.x, i === 2 ? 150 : 130, sc.desc, { fs: 11, fill: '#7a9ac0' });
      if (i < 2) s += arrow(sc.x + 50, 70, sc.x + 110, 70, '#5a7aaa');
    });
    s += emo(320, 90, '🌙', 22);
    return s + '</svg>';
  };

  /* 现代诗二首：秋晚江上 + 花牛草地 */
  const autumnRiver = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 150">`;
    s += `<defs><linearGradient id="sky-ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd9a8"/><stop offset="1" stop-color="#f4a87a"/></linearGradient></defs>`;
    s += `<rect width="640" height="70" fill="url(#sky-ar)"/>`;
    s += `<circle cx="480" cy="50" r="18" fill="#ff7a4a"/>`;
    /* 归鸟驮斜阳 */
    s += `<path d="M 200 50 q 12 -10 24 0 q 12 -10 24 0" fill="none" stroke="#3a2a1a" stroke-width="2.5"/>`;
    /* 江水 */
    s += `<path d="M0 70 Q 160 64 320 70 T 640 70 V 150 H 0 Z" fill="#3a7a9a"/>`;
    s += `<path d="M 100 96 Q 140 90 180 96 T 260 96" fill="none" stroke="#ffb84d" stroke-width="2"/>`;
    /* 芦苇染红 */
    for (let i = 0; i < 6; i++) {
      const x = 60 + i * 20;
      s += `<line x1="${x}" y1="130" x2="${x}" y2="100" stroke="#c97a5a" stroke-width="2"/>`;
      s += `<ellipse cx="${x}" cy="98" rx="3" ry="8" fill="#d95a4a"/>`;
    }
    /* 花牛在草地 */
    s += `<ellipse cx="420" cy="130" rx="30" ry="10" fill="#6b8f4f"/>`;
    s += `<ellipse cx="410" cy="120" rx="16" ry="12" fill="#8a6a4a"/>`;
    s += `<circle cx="398" cy="116" r="8" fill="#8a6a4a"/>`;
    s += txt(410, 146, '花牛草地坐眠', { fs: 11, fill: '#5a4a3a' });
    s += txt(140, 30, '秋晚的江上', { fs: 14, fill: '#7a3a2a', fw: 800 });
    return s + '</svg>';
  };

  /* 一个豆荚里的五粒豆 */
  const fivePeas = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 150">`;
    s += `<rect width="640" height="150" fill="#f4f8ec"/>`;
    /* 豆荚 */
    s += `<path d="M 120 60 Q 320 30 520 60 Q 520 110 320 130 Q 120 110 120 60 Z" fill="#7bbf5a" stroke="#4a8a3a" stroke-width="2.5"/>`;
    s += `<path d="M 120 60 Q 320 80 520 60" fill="none" stroke="#4a8a3a" stroke-width="1.5" stroke-dasharray="4 4"/>`;
    /* 五粒豆 */
    const peas = [
      { x: 180, y: 80, label: '①' },
      { x: 250, y: 72, label: '②' },
      { x: 320, y: 68, label: '③' },
      { x: 390, y: 72, label: '④' },
      { x: 460, y: 80, label: '⑤' },
    ];
    peas.forEach(p => {
      s += `<circle cx="${p.x}" cy="${p.y}" r="16" fill="#a8d87a" stroke="#5a9a3a" stroke-width="2"/>`;
      s += txt(p.x, p.y + 5, p.label, { fs: 13, fill: '#3a6a2a', fw: 900 });
    });
    s += txt(180, 110, '想飞到广大世界', { fs: 11, fill: '#5a7a3a', anchor: 'start' });
    s += txt(460, 110, '该怎么样就怎么样', { fs: 11, fill: '#5a7a3a', anchor: 'end' });
    s += txt(320, 142, '第五粒豆在裂缝里发芽，给生病的小女孩带来希望', { fs: 12.5, fill: '#3a5a2a' });
    return s + '</svg>';
  };

  /* 方帽子店：方帽子 vs 圆帽子 */
  const squareHats = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 140">`;
    s += `<rect width="640" height="140" fill="#f8f4ec"/>`;
    /* 方帽子 */
    const squareColors = ['#c97b7b', '#d9a04a', '#7ba6c9', '#9a7ac9'];
    squareColors.forEach((c, i) => {
      const x = 60 + i * 70;
      s += `<rect x="${x}" y="60" width="50" height="40" rx="2" fill="${c}" stroke="#5a4a3a" stroke-width="1.5"/>`;
      s += `<rect x="${x - 8}" y="96" width="66" height="8" rx="2" fill="${c}" stroke="#5a4a3a" stroke-width="1.5"/>`;
    });
    s += txt(180, 40, '方帽子店', { fs: 15, fill: '#7a5a3a', fw: 800 });
    s += arrow(350, 80, 410, 80, '#d97745');
    s += txt(380, 70, '→', { fs: 20, fill: '#d97745', fw: 900 });
    /* 圆帽子 */
    const roundColors = ['#2fbf71', '#e25563', '#2f9bd6', '#d97745'];
    roundColors.forEach((c, i) => {
      const x = 430 + i * 50;
      s += `<path d="M ${x} 84 Q ${x + 20} 50 ${x + 40} 84 Z" fill="${c}" stroke="#5a4a3a" stroke-width="1.5"/>`;
      s += `<ellipse cx="${x + 20}" cy="84" rx="24" ry="5" fill="${c}" stroke="#5a4a3a" stroke-width="1.5"/>`;
    });
    s += txt(530, 40, '舒服的圆帽子', { fs: 15, fill: '#2f7a4a', fw: 800 });
    s += txt(320, 128, '日子一天天过去，方帽子慢慢成了古董', { fs: 13, fill: '#7a6a5a' });
    return s + '</svg>';
  };

  /* 盘古开天地：天地分开 */
  const pangu = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 160">`;
    s += `<defs><linearGradient id="sky-pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ab8e8"/><stop offset="1" stop-color="#d4e8f8"/></linearGradient></defs>`;
    s += `<rect width="640" height="70" fill="url(#sky-pg)"/>`;
    s += `<rect width="640" y="70" height="90" fill="#c9a878"/>`;
    s += `<rect width="640" y="70" height="6" fill="#8a6a4a"/>`;
    /* 盘古 */
    s += `<circle cx="320" cy="56" r="12" fill="#e8c8a0"/>`;
    s += `<path d="M 320 68 L 320 120 M 320 80 L 290 60 M 320 80 L 350 60 M 320 120 L 300 150 M 320 120 L 340 150" stroke="#5a4a3a" stroke-width="5" fill="none"/>`;
    s += `<path d="M 320 80 L 290 50 M 320 80 L 350 50" stroke="#5a4a3a" stroke-width="5"/>`;
    /* 斧头 */
    s += `<line x1="282" y1="46" x2="268" y2="30" stroke="#8a6a4a" stroke-width="3"/>`;
    s += `<rect x="258" y="22" width="18" height="12" fill="#9aa8b8"/>`;
    /* 头顶天，脚踩地 */
    s += arrow(320, 44, 320, 16, '#4a8ac9');
    s += txt(340, 24, '天每天升高', { fs: 12, fill: '#3a6a9a', anchor: 'start' });
    s += arrow(320, 120, 320, 150, '#8a6a4a');
    s += txt(340, 142, '地每天加厚', { fs: 12, fill: '#7a5a3a', anchor: 'start' });
    s += txt(320, 156, '盘古顶天立地，天地成形后累倒，身体化为万物', { fs: 12.5, fill: '#5a4a3a' });
    return s + '</svg>';
  };

  /* 普罗米修斯：盗火与受罚 */
  const prometheus = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 150">`;
    s += `<rect width="640" height="150" fill="#f0e8d8"/>`;
    /* 高加索山 */
    s += `<path d="M 0 140 L 120 50 L 200 100 L 280 40 L 360 140 Z" fill="#8a7a6a"/>`;
    /* 被锁的普罗米修斯 */
    s += `<circle cx="200" cy="60" r="10" fill="#e8c8a0"/>`;
    s += `<path d="M 200 70 L 200 110" stroke="#5a4a3a" stroke-width="4"/>`;
    s += `<line x1="180" y1="76" x2="160" y2="66" stroke="#5a4a3a" stroke-width="4"/>`;
    s += `<line x1="220" y1="76" x2="240" y2="66" stroke="#5a4a3a" stroke-width="4"/>`;
    s += `<circle cx="158" cy="64" r="5" fill="#c9a84a" stroke="#8a6a3a" stroke-width="2"/>`;
    s += `<circle cx="242" cy="64" r="5" fill="#c9a84a" stroke="#8a6a3a" stroke-width="2"/>`;
    /* 鹰 */
    s += `<path d="M 360 60 q 20 -16 40 0 q -20 4 -40 0" fill="#5a4a3a"/>`;
    s += `<circle cx="356" cy="58" r="4" fill="#5a4a3a"/>`;
    s += `<line x1="352" y1="58" x2="340" y2="54" stroke="#e8a040" stroke-width="2"/>`;
    /* 火种 */
    s += `<ellipse cx="500" cy="100" rx="14" ry="22" fill="#e25563"/>`;
    s += `<ellipse cx="500" cy="104" rx="8" ry="14" fill="#ffb84d"/>`;
    s += `<ellipse cx="500" cy="110" rx="4" ry="8" fill="#ffe08a"/>`;
    s += txt(500, 140, '火种带给人类', { fs: 12, fill: '#c05f22' });
    s += arrow(470, 100, 440, 80, '#e25563');
    s += txt(320, 140, '为人类盗取天火，被锁高加索山，每日被鹰啄食肝脏', { fs: 12.5, fill: '#7a5a3a' });
    return s + '</svg>';
  };

  /* 女娲补天 */
  const nüwa = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 160">`;
    s += `<defs><linearGradient id="sky-nw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1a3a"/><stop offset="1" stop-color="#5a3a6a"/></linearGradient></defs>`;
    s += `<rect width="640" height="160" fill="url(#sky-nw)"/>`;
    /* 天破洞 */
    s += `<ellipse cx="480" cy="50" rx="80" ry="30" fill="#1a0a2a" stroke="#8a5aaa" stroke-width="2" stroke-dasharray="6 4"/>`;
    /* 女娲 */
    s += `<circle cx="200" cy="70" r="14" fill="#f0d8b8"/>`;
    s += `<path d="M 200 84 Q 170 100 180 140 L 220 140 Q 230 100 200 84 Z" fill="#c97bb8"/>`;
    s += `<path d="M 186 58 q 14 -16 28 0" fill="none" stroke="#3a2a4a" stroke-width="4"/>`;
    /* 五彩石 */
    [[320, 80, '#e25563'], [340, 70, '#2f9bd6'], [330, 92, '#2fbf71'], [354, 84, '#ffb84d'], [316, 88, '#8b65c9']].forEach(p =>
      s += `<polygon points="${p[0]},${p[1] - 8} ${p[0] + 7},${p[1]} ${p[0]},${p[1] + 8} ${p[0] - 7},${p[1]}" fill="${p[2]}" stroke="#fff" stroke-width="1"/>`);
    s += arrow(360, 80, 420, 60, '#ffb84d');
    s += txt(200, 150, '女娲炼五彩石补天', { fs: 13, fill: '#e8c8e0', fw: 800 });
    s += txt(480, 92, '修补天破洞', { fs: 12, fill: '#c9a8e0' });
    return s + '</svg>';
  };

  /* 麻雀：老麻雀掩护小麻雀 */
  const sparrow = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 150">`;
    s += `<rect width="640" height="150" fill="#f4f0e8"/>`;
    /* 地面 */
    s += `<path d="M0 120 Q 320 112 640 120 V 150 H 0 Z" fill="#c9b89a"/>`;
    /* 猎狗 */
    s += `<path d="M 460 100 q 30 -20 70 -10 q 20 6 30 -4 l 8 10 q -4 8 -12 8 l -4 12 l -16 4 l -2 14 l -18 -2 l -4 -12 l -36 0 l -16 -10 Z" fill="#8a6a4a"/>`;
    s += `<circle cx="564" cy="88" r="7" fill="#8a6a4a"/>`;
    s += `<path d="M 566 82 l 8 -4" stroke="#5a4a3a" stroke-width="3"/>`;
    /* 老麻雀（张开翅膀扎煞） */
    s += `<ellipse cx="260" cy="100" rx="20" ry="12" fill="#7a6a5a"/>`;
    s += `<circle cx="244" cy="92" r="8" fill="#7a6a5a"/>`;
    s += `<path d="M 244 96 l -8 2" stroke="#e8a040" stroke-width="2"/>`;
    s += `<path d="M 260 88 q -10 -20 -30 -8 q 12 8 30 8" fill="#8a7a6a"/>`;
    s += `<path d="M 260 88 q 10 -20 30 -8 q -12 8 -30 8" fill="#8a7a6a"/>`;
    /* 小麻雀 */
    s += `<circle cx="280" cy="116" r="7" fill="#9a8a7a"/>`;
    s += `<circle cx="276" cy="114" r="1.5" fill="#1a1a1a"/>`;
    s += arrow(440, 100, 300, 104, '#e25563');
    s += txt(370, 92, '猎狗逼近', { fs: 12, fill: '#b04a4a' });
    s += txt(260, 142, '老麻雀像石头似的落下，用身躯掩护小麻雀', { fs: 12.5, fill: '#5a4a3a' });
    return s + '</svg>';
  };

  /* 爬天都峰：陡峭山峰 */
  const tiandufeng = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 160">`;
    s += `<rect width="640" height="160" fill="#eef4fd"/>`;
    /* 远山 */
    s += `<path d="M0 140 Q 160 100 320 130 T 640 120 V 160 H 0 Z" fill="#b9c8d8"/>`;
    /* 天都峰（笔陡） */
    s += `<path d="M 300 150 L 340 30 L 360 30 L 380 150 Z" fill="#7a8a9a" stroke="#5a6a7a" stroke-width="2"/>`;
    s += `<path d="M 340 30 L 340 150" stroke="#5a6a7a" stroke-width="1" stroke-dasharray="4 4"/>`;
    /* 铁链 */
    s += `<path d="M 340 30 Q 330 80 340 150" fill="none" stroke="#8a7a6a" stroke-width="2"/>`;
    s += `<path d="M 370 30 Q 380 80 370 150" fill="none" stroke="#8a7a6a" stroke-width="2"/>`;
    /* 登山的人 */
    [[350, 70], [355, 100], [345, 130]].forEach((p, i) => {
      s += `<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="${['#e25563', '#2fbf71', '#2f9bd6'][i]}"/>`;
      s += `<line x1="${p[0]}" y1="${p[1] + 6}" x2="${p[0]}" y2="${p[1] + 18}" stroke="${['#e25563', '#2fbf71', '#2f9bd6'][i]}" stroke-width="3"/>`;
    });
    s += txt(350, 20, '峰顶', { fs: 12, fill: '#3a5a7a' });
    s += txt(120, 80, '石级笔陡', { fs: 13, fill: '#5a6a7a', anchor: 'start' });
    s += txt(120, 100, '铁链从天上挂下来', { fs: 13, fill: '#5a6a7a', anchor: 'start' });
    s += txt(320, 156, '汲取力量，互相鼓励，终于爬上天都峰', { fs: 12.5, fill: '#3a5a7a' });
    return s + '</svg>';
  };

  /* 秦兵马俑：军阵 */
  const terracotta = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 150">`;
    s += `<rect width="640" height="150" fill="#f0e8d8"/>`;
    /* 军阵排列 */
    const rows = [
      { y: 40, n: 8, c: '#8a6a4a' },
      { y: 70, n: 7, c: '#7a5a3a' },
      { y: 100, n: 6, c: '#6a4a2a' },
    ];
    rows.forEach(row => {
      for (let i = 0; i < row.n; i++) {
        const x = 60 + i * (520 / row.n);
        s += `<circle cx="${x}" cy="${row.y}" r="9" fill="${row.c}"/>`;
        s += `<rect x="${x - 6}" y="${row.y + 8}" width="12" height="18" fill="${row.c}"/>`;
        s += `<rect x="${x - 9}" y="${row.y + 26}" width="18" height="4" fill="${row.c}"/>`;
      }
    });
    /* 战车 */
    s += `<rect x="270" y="116" width="80" height="14" fill="#5a4a3a"/>`;
    s += `<circle cx="282" cy="132" r="8" fill="#5a4a3a" stroke="#3a2a1a" stroke-width="2"/>`;
    s += `<circle cx="338" cy="132" r="8" fill="#5a4a3a" stroke="#3a2a1a" stroke-width="2"/>`;
    s += txt(320, 20, '规模宏大 · 类型众多 · 个性鲜明', { fs: 13, fill: '#7a5a3a', fw: 800 });
    s += txt(320, 148, '秦始皇陵兵马俑，被誉为「世界第八大奇迹」', { fs: 12, fill: '#8a7a6a' });
    return s + '</svg>';
  };

  /* 牛和鹅：换个角度看问题 */
  const cowGoose = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 150">`;
    s += `<rect width="640" height="150" fill="#f4f8ec"/>`;
    /* 牛（温顺） */
    s += `<ellipse cx="140" cy="100" rx="40" ry="24" fill="#8a6a4a"/>`;
    s += `<circle cx="100" cy="92" r="18" fill="#8a6a4a"/>`;
    s += `<path d="M 88 82 l -8 -10 M 112 82 l 8 -10" stroke="#5a4a3a" stroke-width="3"/>`;
    s += `<circle cx="94" cy="90" r="2" fill="#1a1a1a"/>`;
    s += `<ellipse cx="88" cy="98" rx="5" ry="4" fill="#d9a890"/>`;
    s += txt(140, 140, '牛：怕人，看人大', { fs: 12, fill: '#7a5a3a' });
    /* 鹅（凶猛） */
    s += `<ellipse cx="480" cy="100" rx="36" ry="22" fill="#f0f0f0" stroke="#ccc" stroke-width="1.5"/>`;
    s += `<path d="M 516 88 q 10 -6 16 -14 q 4 4 4 14 q 0 10 -20 14" fill="#f0f0f0" stroke="#ccc" stroke-width="1.5"/>`;
    s += `<circle cx="524" cy="84" r="3" fill="#e25563"/>`;
    s += `<path d="M 532 88 l 10 -2 l -10 4 Z" fill="#e8a040"/>`;
    s += txt(480, 140, '鹅：不怕人，看人小', { fs: 12, fill: '#7a5a3a' });
    s += arrow(280, 100, 400, 100, '#d97745');
    s += txt(340, 88, '换个角度', { fs: 13, fill: '#d97745', fw: 800 });
    s += txt(340, 108, '看问题', { fs: 13, fill: '#d97745', fw: 800 });
    return s + '</svg>';
  };

  /* 一只窝囊的大老虎：台上扮老虎 */
  const tigerCostume = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 150">`;
    s += `<rect width="640" height="150" fill="#f8f0e8"/>`;
    /* 舞台 */
    s += `<rect x="0" y="120" width="640" height="30" fill="#c95a4a"/>`;
    s += `<rect x="0" y="116" width="640" height="6" fill="#8a3a2a"/>`;
    /* 幕布 */
    s += `<rect x="0" y="20" width="40" height="100" fill="#a83a3a"/>`;
    s += `<rect x="600" y="20" width="40" height="100" fill="#a83a3a"/>`;
    for (let i = 0; i < 5; i++) {
      s += `<path d="M ${i * 8} 20 q 4 8 8 0" fill="none" stroke="#7a2a2a" stroke-width="1"/>`;
      s += `<path d="M ${600 + i * 8} 20 q 4 8 8 0" fill="none" stroke="#7a2a2a" stroke-width="1"/>`;
    }
    /* 扮老虎的孩子 */
    s += `<circle cx="320" cy="60" r="22" fill="#e8a84a"/>`;
    /* 王字 */
    s += `<text x="320" y="56" text-anchor="middle" font-size="14" font-weight="900" fill="#1a1a1a">王</text>`;
    /* 耳朵 */
    s += `<circle cx="302" cy="44" r="8" fill="#e8a84a"/>`;
    s += `<circle cx="338" cy="44" r="8" fill="#e8a84a"/>`;
    /* 眼睛 */
    s += `<circle cx="312" cy="62" r="3" fill="#1a1a1a"/>`;
    s += `<circle cx="328" cy="62" r="3" fill="#1a1a1a"/>`;
    /* 嘴（窝囊的嘴） */
    s += `<path d="M 312 74 q 8 -4 16 0" fill="none" stroke="#1a1a1a" stroke-width="2"/>`;
    /* 身体虎纹 */
    s += `<rect x="300" y="82" width="40" height="38" rx="6" fill="#e8a84a"/>`;
    s += `<line x1="308" y1="88" x2="332" y2="88" stroke="#1a1a1a" stroke-width="2"/>`;
    s += `<line x1="308" y1="96" x2="332" y2="96" stroke="#1a1a1a" stroke-width="2"/>`;
    s += `<line x1="308" y1="104" x2="332" y2="104" stroke="#1a1a1a" stroke-width="2"/>`;
    s += txt(320, 144, '本想演个威风的大老虎，结果演得窝囊又好笑', { fs: 12.5, fill: '#7a5a3a' });
    return s + '</svg>';
  };

  /* 陀螺：旋转的陀螺 */
  const spinningTop = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 150">`;
    s += `<rect width="640" height="150" fill="#eef4fd"/>`;
    /* 地面 */
    s += `<ellipse cx="320" cy="130" rx="200" ry="14" fill="#d4dce8"/>`;
    /* 陀螺 */
    s += `<path d="M 300 60 L 340 60 L 330 110 L 310 110 Z" fill="#e25563" stroke="#a03a4a" stroke-width="2"/>`;
    s += `<ellipse cx="320" cy="60" rx="22" ry="7" fill="#c04a5a" stroke="#a03a4a" stroke-width="2"/>`;
    s += `<path d="M 320 110 L 320 124" stroke="#5a4a3a" stroke-width="3"/>`;
    /* 旋转线 */
    s += `<ellipse cx="320" cy="124" rx="14" ry="4" fill="none" stroke="#2f9bd6" stroke-width="2" opacity=".7"/>`;
    s += `<path d="M 280 80 q 40 -20 80 0" fill="none" stroke="#2f9bd6" stroke-width="2" stroke-dasharray="4 4" opacity=".5"/>`;
    /* 鞭子 */
    s += `<line x1="400" y1="50" x2="360" y2="90" stroke="#8a6a4a" stroke-width="3"/>`;
    s += `<path d="M 360 90 q -10 4 -16 -4" fill="none" stroke="#c9a84a" stroke-width="2"/>`;
    s += txt(180, 70, '抽一鞭，转得欢', { fs: 13, fill: '#3a5a7a', anchor: 'start' });
    s += txt(320, 146, '「人不可貌相，海水不可斗量」——小陀螺也能打败大陀螺', { fs: 12.5, fill: '#35567e' });
    return s + '</svg>';
  };

  /* 延安，我把你追寻 */
  const yanan = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 150">`;
    s += `<rect width="640" height="150" fill="#f0e8d8"/>`;
    /* 宝塔山 */
    s += `<path d="M 80 130 L 130 40 L 180 130 Z" fill="#8a7a5a"/>`;
    /* 宝塔 */
    s += `<rect x="118" y="50" width="24" height="60" fill="#c9a84a" stroke="#8a6a3a" stroke-width="1.5"/>`;
    s += `<polygon points="118,50 130,34 142,50" fill="#c95a4a"/>`;
    for (let i = 0; i < 5; i++) s += `<rect x="120" y="${56 + i * 12}" width="20" height="3" fill="#8a6a3a"/>`;
    s += txt(130, 146, '宝塔山', { fs: 12, fill: '#7a5a3a' });
    /* 窑洞 */
    [[320, 100], [380, 100], [440, 100]].forEach(p => {
      s += `<rect x="${p[0] - 22}" y="${p[1]}" width="44" height="30" fill="#c9a878" stroke="#8a6a4a" stroke-width="1.5"/>`;
      s += `<path d="M ${p[0] - 22} ${p[1]} q 22 -16 44 0" fill="#c9a878" stroke="#8a6a4a" stroke-width="1.5"/>`;
      s += `<rect x="${p[0] - 8}" y="${p[1] + 8}" width="16" height="22" fill="#5a3a2a"/>`;
    });
    s += txt(380, 146, '窑洞', { fs: 12, fill: '#7a5a3a' });
    /* 延河 */
    s += `<path d="M 200 130 Q 260 120 320 130 T 580 126" fill="none" stroke="#4a8ac9" stroke-width="6"/>`;
    s += txt(320, 20, '追寻信念、追寻温暖、追寻光明', { fs: 14, fill: '#c0392b', fw: 900 });
    s += txt(320, 40, '延安精神', { fs: 16, fill: '#c0392b', fw: 900 });
    return s + '</svg>';
  };

  /* 为中华之崛起而读书 */
  const zhouEnlai = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 150">`;
    s += `<rect width="640" height="150" fill="#f4f0e8"/>`;
    /* 书桌 */
    s += `<rect x="60" y="100" width="200" height="12" fill="#8a6a4a"/>`;
    s += `<rect x="70" y="112" width="8" height="28" fill="#8a6a4a"/>`;
    s += `<rect x="242" y="112" width="8" height="28" fill="#8a6a4a"/>`;
    /* 书本 */
    s += `<rect x="100" y="82" width="100" height="18" fill="#e25563"/>`;
    s += `<rect x="100" y="82" width="100" height="3" fill="#a03a4a"/>`;
    s += `<line x1="150" y1="82" x2="150" y2="100" stroke="#a03a4a" stroke-width="1"/>`;
    /* 少年读书 */
    s += `<circle cx="320" cy="70" r="16" fill="#f0d8b8"/>`;
    s += `<path d="M 306 60 q 14 -18 28 0" fill="none" stroke="#1a1a1a" stroke-width="5"/>`;
    s += `<circle cx="314" cy="72" r="2" fill="#1a1a1a"/>`;
    s += `<circle cx="326" cy="72" r="2" fill="#1a1a1a"/>`;
    s += `<path d="M 314 80 q 6 3 12 0" fill="none" stroke="#1a1a1a" stroke-width="1.5"/>`;
    s += `<rect x="300" y="86" width="40" height="34" fill="#3a5a8a"/>`;
    s += `<line x1="320" y1="86" x2="320" y2="120" stroke="#2a4a7a" stroke-width="1"/>`;
    /* 中华崛起文字卷轴 */
    s += `<rect x="380" y="60" width="220" height="50" rx="4" fill="#f8e8c8" stroke="#c9a84a" stroke-width="2"/>`;
    s += txt(490, 82, '为中华之崛起', { fs: 16, fill: '#8a3a2a', fw: 900 });
    s += txt(490, 100, '而读书！', { fs: 16, fill: '#8a3a2a', fw: 900 });
    s += txt(320, 140, '少年周恩来立下远大志向——为中华之崛起而读书', { fs: 12.5, fill: '#5a4a3a' });
    return s + '</svg>';
  };

  /* ================= 注册表 ================= */
  const REG = {
    /* 数学 */
    'pv-table': pvTable,
    'pv-grade': pvGrade,
    'rounding': rounding,
    'lines3': lines3,
    'par-perp': parPerp,
    'protractor': protractor,
    'demo-angle': demoAngle,
    'demo-vertical': demoVertical,
    'product-rule': productRule,
    'sight-range': sightRange,
    'area-model': areaModel,
    'cube-cut': cubeCut,
    'demo-speed': demoSpeed,
    'demo-bar': demoBar,
    'demo-segcount': demoSegCount,
    /* 语文 */
    'tide': tide,
    'bat-radar': batRadar,
    'race-matrix': raceMatrix,
    'demo-race': demoRace,
    'ivy-foot': ivyFoot,
    'cricket-home': cricketHome,
    'jingwei': jingwei,
    'greatwall-section': greatwall,
    'route-map': routeMap,
    /* 古诗文场景插画 */
    'poem-luzhai': poemLuzhai,
    'poem-mujiang': poemMujiang,
    'poem-lushan': poemLushan,
    'poem-xuemei': poemXuemei,
    'poem-change': poemChange,
    'poem-biedongda': poemBiedongda,
    'poem-liangzhou': poemLiangzhou,
    'poem-chusai': poemChusai,
    'poem-xrj': poemXrj,
    'poem-wangrong': poemWangrong,
    /* 补充课文图示 */
    'stars': stars,
    'autumn-river': autumnRiver,
    'five-peas': fivePeas,
    'square-hats': squareHats,
    'pangu': pangu,
    'prometheus': prometheus,
    'nüwa': nüwa,
    'sparrow': sparrow,
    'tiandufeng': tiandufeng,
    'terracotta': terracotta,
    'cow-goose': cowGoose,
    'tiger-costume': tigerCostume,
    'spinning-top': spinningTop,
    'yanan': yanan,
    'zhou-enlai': zhouEnlai,
    /* 横幅 */
    'bn-u1': banners['bn-u1'],
    'bn-u2': banners['bn-u2'],
    'bn-u3': banners['bn-u3'],
    'bn-u4': banners['bn-u4'],
    'bn-u5': banners['bn-u5'],
    'bn-u6': banners['bn-u6'],
    'bn-u7': banners['bn-u7'],
    'bn-u8': banners['bn-u8'],
  };

  function figHTML(id, cap) {
    const fn = REG[id];
    if (!fn) return '';
    const capText = cap || DEFAULT_CAPS[id] || '';
    return `<figure class="fig" data-fig="${id}">${DEFS}${fn()}${capText ? `<figcaption class="fig-cap">${capText}</figcaption>` : ''}</figure>`;
  }

  const DEFAULT_CAPS = {
    'demo-angle': '互动演示：拖动滑块或点按钮，看角的分类怎么变',
    'demo-vertical': '互动演示：一步一步看三位数乘两位数的竖式',
    'demo-speed': '互动演示：拖动滑块，小车和路程会跟着变',
    'demo-bar': '互动演示：切换「1 格代表几人」，看直条怎么画',
    'demo-segcount': '互动演示：增减点数，弧线就是所有的线段',
    'demo-race': '互动演示：点「下一步」，看孙膑怎么调换马的出场顺序、反败为胜',
    'pv-table': '数位顺序表：分级读数、写数的依据',
  };

  /* ---------- 互动演示的事件委托 ---------- */
  function bindDelegates(doc) {
    doc.addEventListener('input', e => {
      const t = e.target.closest('[data-fig-input]');
      if (!t) return;
      const fig = t.closest('.fig');
      if (!fig) return;
      const kind = t.dataset.figInput;
      if (kind === 'angle') setAngle(fig, +t.value);
      else if (kind === 'sp-v' || kind === 'sp-t') speedApply(fig);
      else if (kind === 'seg-n') segApply(fig);
    });
    doc.addEventListener('click', e => {
      const b = e.target.closest('[data-fig-act]');
      if (!b) return;
      const fig = b.closest('.fig');
      if (!fig) return;
      const act = b.dataset.figAct;
      if (act === 'set-angle') setAngle(fig, +b.dataset.v);
      else if (act === 'vstep') { const s = Math.min((+fig.dataset.step || 0) + 1, 3); fig.dataset.step = s; vApply(fig, s); }
      else if (act === 'vreset') { fig.dataset.step = 0; vApply(fig, 0); }
      else if (act === 'cube-view') cubeView(fig, b.dataset.v, b);
      else if (act === 'bar-mode') barApply(fig, b.dataset.v);
      else if (act === 'race-step') { const s = Math.min((+fig.dataset.step || 0) + 1, 3); fig.dataset.step = s; raceApply(fig, s); }
      else if (act === 'race-reset') { fig.dataset.step = 0; raceApply(fig, 0); }
    });
  }

  /* 三视图演示 */
  const demoCube = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 190">`;
    s += `<g class="cube-iso"></g>`;
    s += `<g class="cube-view-g" transform="translate(430 30)"></g>`;
    s += `<text class="cube-view-label" x="500" y="180" text-anchor="middle" fill="#7c5cc4" font-size="15" font-weight="800"></text>`;
    return s + '</svg>' +
      `<div class="fig-ctrl">` +
      `<button class="fig-btn" data-fig-act="cube-view" data-v="front">从正面看</button>` +
      `<button class="fig-btn" data-fig-act="cube-view" data-v="top">从上面看</button>` +
      `<button class="fig-btn" data-fig-act="cube-view" data-v="left">从左面看</button>` +
      `</div>`;
  };
  const CUBES = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 1]];
  function cubeView(fig, mode, btn) {
    const iso = fig.querySelector('.cube-iso');
    if (!iso.dataset.drawn) {
      const u = 34, hh = 18, hz = 30, ox = 90, oy = 96;
      const P = (x, y, z) => [ox + (x - y) * u, oy + (x + y) * hh - z * hz];
      let d = '';
      const order = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 0, 1], [1, 1, 0]];
      order.forEach(c => {
        const [x, y, z] = c;
        const t = P(x, y, z + 1), r = P(x + 1, y, z + 1), b = P(x + 1, y, z), l = P(x, y, z);
        const rB = P(x + 1, y + 1, z + 1), rBB = P(x + 1, y + 1, z), lB = P(x, y + 1, z + 1), bB = P(x, y + 1, z);
        d += `<polygon points="${t} ${r} ${rB} ${lB}" fill="#c9b7e8" stroke="#7c5cc4" stroke-width="1.5"/>`;
        d += `<polygon points="${l} ${rB} ${rBB} ${bB}" fill="#a790d4" stroke="#7c5cc4" stroke-width="1.5"/>`;
        d += `<polygon points="${t} ${lB} ${bB} ${l}" fill="#e4daf5" stroke="#7c5cc4" stroke-width="1.5"/>`;
      });
      iso.innerHTML = d;
      iso.dataset.drawn = '1';
    }
    const H = 2, W = 2, cell = 30;
    const filled = mode === 'top'
      ? [[0, 0], [0, 1], [1, 0], [1, 1]]
      : mode === 'front'
        ? [[0, 0], [0, 1], [1, 0]]
        : [[0, 0], [1, 0], [1, 1]];
    let g = '';
    for (let c = 0; c < W; c++) {
      for (let r = 0; r < H; r++) {
        const on = filled.some(f => f[0] === c && f[1] === r);
        g += `<rect x="${c * cell}" y="${(H - 1 - r) * cell}" width="${cell}" height="${cell}" rx="4" fill="${on ? '#7c5cc433' : '#fff'}" stroke="${on ? '#7c5cc4' : LINE}" stroke-width="1.5"/>`;
      }
    }
    fig.querySelector('.cube-view-g').innerHTML = g;
    fig.querySelector('.cube-view-label').textContent =
      mode === 'front' ? '正面：左 1 层、右 2 层' : mode === 'top' ? '上面：田字形' : '左面：前 2 层、后 1 层';
    fig.querySelectorAll('[data-fig-act="cube-view"]').forEach(b => b.classList.toggle('fig-on', b === btn));
  }

  REG['demo-cube'] = demoCube;
  DEFAULT_CAPS['demo-cube'] = '互动演示：点按钮换方向，右边的形状就是看到的画面';

  /* 初始化静态演示（渲染后无需再调用；委托自动工作） */
  if (typeof document !== 'undefined') {
    bindDelegates(document);
    /* 每次渲染后初始化图内的演示状态 */
    const initIn = root => {
      root.querySelectorAll('.fig').forEach(fig => {
        const id = fig.dataset.fig;
        if (id === 'demo-angle' && !fig.dataset.init) { setAngle(fig, 60); fig.dataset.init = '1'; }
        else if (id === 'demo-speed' && !fig.dataset.init) { speedApply(fig); fig.dataset.init = '1'; }
        else if (id === 'demo-segcount' && !fig.dataset.init) { segApply(fig); fig.dataset.init = '1'; }
        else if (id === 'demo-cube' && !fig.dataset.init) {
          cubeView(fig, 'front', fig.querySelector('[data-fig-act="cube-view"]'));
          fig.dataset.init = '1';
        }
        else if (id === 'demo-vertical' && !fig.dataset.init) { fig.dataset.step = 0; vApply(fig, 0); fig.dataset.init = '1'; }
        else if (id === 'demo-bar' && !fig.dataset.init) { barApply(fig, '1'); fig.dataset.init = '1'; }
        else if (id === 'demo-race' && !fig.dataset.init) { fig.dataset.step = 0; raceApply(fig, 0); fig.dataset.init = '1'; }
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
  module.exports = { FIG_IDS: Figures.FIG_IDS, has: Figures.has };
}
if (typeof window !== 'undefined') {
  window.Figures = Figures;
}

/* ============================================================
   乐学堂 · 科学图示库（科学实验室专属）
   - 纯 SVG 插图，离线可用，打印友好
   - 互动演示（水的三态变化 / 电路串联并联）事件用委托绑定，
     页面重渲染后无需重新挂载
   - 数据里用 fig: 'sci-xxx' / 'demo-sci-xxx' 引用
   ============================================================ */
'use strict';

const SciFigures = (() => {
  const INK = '#34384d';
  const MUT = '#73788b';
  const LINE = '#dfe5f0';
  const BLUE = '#4d96ff';
  const RED = '#e25563';
  const GOLD = '#e6b23c';
  const GREEN = '#2fbf71';
  const TEAL = '#157d73';
  const PURPLE = '#8b65c9';
  const ORANGE = '#d97745';
  const SKY = '#2f9bd6';

  /* ---------- 小工具 ---------- */
  const txt = (x, y, s, opt) => {
    opt = opt || {};
    return `<text x="${x}" y="${y}" fill="${opt.fill || INK}" font-size="${opt.fs || 14}"` +
      ` font-weight="${opt.fw || 700}" text-anchor="${opt.anchor || 'middle'}"` +
      (opt.cls ? ` class="${opt.cls}"` : '') + `>${s}</text>`;
  };
  const arrow = (x1, y1, x2, y2, color) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color || MUT}" stroke-width="2" marker-end="url(#sfig-arrow)"/>`;
  const DEFS = `<defs><marker id="sfig-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${MUT}"/></marker></defs>`;

  /* ================= 走进科学 ================= */

  /* 科学探究六步曲 */
  const method = () => {
    const steps = [
      { n: 1, t: '提出问题', d: '发现想弄明白的事', color: BLUE },
      { n: 2, t: '猜想假设', d: '先猜一个答案', color: SKY },
      { n: 3, t: '设计实验', d: '一次只变一个条件', color: TEAL },
      { n: 4, t: '观察记录', d: '数据和现象写下来', color: GREEN },
      { n: 5, t: '得出结论', d: '对照记录判断猜想', color: GOLD },
      { n: 6, t: '分享交流', d: '接受提问再改进', color: PURPLE },
    ];
    let s = `<svg class="fig-svg" viewBox="0 0 640 176">`;
    steps.forEach((st, i) => {
      const x = 14 + (i % 3) * 208, y = 14 + Math.floor(i / 3) * 74;
      s += `<rect x="${x}" y="${y}" width="184" height="58" rx="12" fill="#fafbfe" stroke="${st.color}" stroke-width="2"/>`;
      s += `<circle cx="${x + 24}" cy="${y + 29}" r="14" fill="${st.color}"/>`;
      s += txt(x + 24, y + 34, String(st.n), { fs: 14, fw: 900, fill: '#fff' });
      s += txt(x + 46, y + 26, st.t, { anchor: 'start', fs: 15.5, fw: 900 });
      s += txt(x + 46, y + 45, st.d, { anchor: 'start', fs: 11.5, fill: MUT });
      if (i !== 2 && i !== 5) s += arrow(x + 186, y + 29, x + 206, y + 29, st.color);
    });
    s += arrow(300, 74, 300, 90, TEAL);          /* 设计实验 → 观察记录 */
    s += txt(456, 160, '结论不理想？换个猜想再来一轮——科学就是在循环中进步', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* 常用测量工具 */
  const measure = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 208">`;
    /* 刻度尺 */
    s += `<rect x="40" y="36" width="220" height="34" rx="5" fill="#fdf2cf" stroke="${GOLD}" stroke-width="2.5"/>`;
    for (let i = 0; i <= 10; i++) {
      const x = 52 + i * 19.6;
      s += `<line x1="${x}" y1="36" x2="${x}" y2="${i % 5 === 0 ? 52 : 46}" stroke="${INK}" stroke-width="${i % 5 === 0 ? 2 : 1.4}"/>`;
    }
    s += txt(56, 92, '刻度尺', { anchor: 'start', fs: 14.5, fw: 900 });
    s += txt(56, 110, '量长度 · 单位：米（m）', { anchor: 'start', fs: 12, fill: MUT });
    /* 温度计 */
    s += `<rect x="330" y="22" width="14" height="118" rx="7" fill="#eef3fb" stroke="${INK}" stroke-width="2"/>`;
    s += `<circle cx="337" cy="152" r="13" fill="${RED}" stroke="${INK}" stroke-width="2"/>`;
    s += `<rect x="334" y="66" width="6" height="86" rx="3" fill="${RED}"/>`;
    [30, 50, 70, 90, 110].forEach(y => {
      s += `<line x1="344" y1="${y}" x2="352" y2="${y}" stroke="${INK}" stroke-width="1.5"/>`;
      s += txt(360, y + 4, String((110 - y) * 2 - 20), { anchor: 'start', fs: 10.5, fill: MUT });
    });
    s += txt(337, 190, '温度计', { fs: 14.5, fw: 900 });
    s += txt(337, 205, '测温度 · 单位：摄氏度（℃）', { fs: 12, fill: MUT });
    /* 天平 */
    s += `<line x1="470" y1="40" x2="470" y2="140" stroke="${INK}" stroke-width="4"/>`;
    s += `<line x1="420" y1="40" x2="520" y2="40" stroke="${INK}" stroke-width="4"/>`;
    s += `<circle cx="470" cy="140" r="16" fill="#eef3fb" stroke="${INK}" stroke-width="2"/>`;
    s += `<line x1="420" y1="40" x2="404" y2="66" stroke="${INK}" stroke-width="2.5"/><line x1="520" y1="40" x2="536" y2="66" stroke="${INK}" stroke-width="2.5"/>`;
    s += `<path d="M392,66 a12,12 0 0 0 24,0 Z" fill="#fdf2cf" stroke="${GOLD}" stroke-width="2"/>`;
    s += `<path d="M524,66 a12,12 0 0 0 24,0 Z" fill="#fdf2cf" stroke="${GOLD}" stroke-width="2"/>`;
    s += txt(470, 186, '天平', { fs: 14.5, fw: 900 });
    s += txt(470, 205, '称质量 · 单位：克（g）千克（kg）', { fs: 12, fill: MUT });
    return s + '</svg>';
  };

  /* ================= 物质与变化 ================= */

  /* 空气占据空间（杯子压入水实验） */
  const airSpace = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 210">`;
    /* 水槽 */
    s += `<rect x="120" y="70" width="400" height="120" rx="8" fill="#eaf6fd" stroke="${SKY}" stroke-width="2.5"/>`;
    s += `<rect x="124" y="112" width="392" height="74" rx="6" fill="#c9e8f8"/>`;
    /* 倒扣的杯子（部分压入水中，内含空气层） */
    s += `<path d="M250,22 L250,150 Q250,160 262,160 L338,160 Q350,160 350,150 L350,22" fill="none" stroke="${INK}" stroke-width="4"/>`;
    s += `<rect x="254" y="26" width="92" height="14" rx="6" fill="${INK}"/>`;
    /* 杯内空气隔水 */
    s += `<rect x="252" y="120" width="96" height="38" fill="#fff7dd" stroke="${GOLD}" stroke-width="1.5" stroke-dasharray="5 4"/>`;
    s += txt(300, 144, '空气', { fs: 13, fw: 900, fill: ORANGE });
    /* 纸团（杯底 = 图上方） */
    s += `<circle cx="278" cy="44" r="7" fill="#f4e8cf" stroke="${MUT}" stroke-width="1.5"/>`;
    s += `<circle cx="300" cy="38" r="8" fill="#efe0c0" stroke="${MUT}" stroke-width="1.5"/>`;
    s += `<circle cx="322" cy="45" r="6.5" fill="#f4e8cf" stroke="${MUT}" stroke-width="1.5"/>`;
    /* 水位标注 */
    s += `<line x1="140" y1="112" x2="240" y2="112" stroke="${SKY}" stroke-width="2" stroke-dasharray="6 4"/>`;
    s += txt(112, 116, '水面', { anchor: 'end', fs: 12.5, fill: SKY });
    /* 纸团标注 */
    s += txt(430, 52, '杯底的纸团', { anchor: 'start', fs: 13, fw: 900 });
    s += txt(430, 72, '拿起来是干的！', { anchor: 'start', fs: 12.5, fill: TEAL });
    s += arrow(424, 46, 332, 42, TEAL);
    /* 说明 */
    s += txt(430, 120, '空气占着杯里的空间', { anchor: 'start', fs: 13.5, fw: 900, fill: ORANGE });
    s += txt(430, 140, '水挤不进去，只能停在杯外', { anchor: 'start', fs: 12.5, fill: MUT });
    s += arrow(424, 116, 352, 132, ORANGE);
    s += txt(320, 205, '把杯子竖直压进水再竖直提起——纸团不湿，就是空气的「占位证明」', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 溶解与分离 */
  const dissolve = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 232">`;
    /* 左：搅拌溶解 */
    s += `<rect x="40" y="90" width="90" height="96" rx="6" fill="#eaf6fd" stroke="${SKY}" stroke-width="2.5"/>`;
    s += `<circle cx="68" cy="120" r="4" fill="${SKY}" opacity=".8"/><circle cx="90" cy="132" r="3.5" fill="${SKY}" opacity=".8"/>`;
    s += `<circle cx="76" cy="150" r="3" fill="${SKY}" opacity=".6"/><circle cx="102" cy="152" r="2.8" fill="${SKY}" opacity=".6"/>`;
    s += `<line x1="96" y1="52" x2="76" y2="112" stroke="${ORANGE}" stroke-width="4" stroke-linecap="round"/>`;
    s += `<rect x="88" y="40" width="16" height="14" rx="3" fill="${ORANGE}"/>`;
    s += txt(85, 208, '① 溶解：搅拌更快', { fs: 13, fw: 900 });
    s += txt(85, 226, '颗粒小到看不见', { fs: 11.5, fill: MUT });
    /* 中：过滤 */
    s += `<path d="M280,52 L360,52 L320,100 Z" fill="#f6f8fc" stroke="${INK}" stroke-width="2.5"/>`;
    s += `<path d="M286,56 L320,94 L354,56" fill="none" stroke="${MUT}" stroke-width="1.4" stroke-dasharray="4 3"/>`;
    s += `<path d="M280,52 L268,40 M320,100 L320,40 M360,52 L372,40" stroke="${INK}" stroke-width="2"/>`;
    s += `<rect x="296" y="120" width="48" height="60" rx="5" fill="#eaf6fd" stroke="${SKY}" stroke-width="2.5"/>`;
    s += `<rect x="298" y="140" width="44" height="38" fill="#c9e8f8"/>`;
    s += `<circle cx="252" cy="70" r="5" fill="#b5893a"/><circle cx="390" cy="76" r="4" fill="#b5893a"/>`;
    s += txt(320, 208, '② 过滤：拦住不溶的沙', { fs: 13, fw: 900 });
    s += txt(320, 226, '溶解了的盐能穿过去', { fs: 11.5, fill: MUT });
    /* 右：蒸发结晶 */
    s += `<path d="M480,110 a50,16 0 0 0 100,0 Z" fill="#f6f8fc" stroke="${INK}" stroke-width="2.5"/>`;
    s += `<path d="M486,108 q22,-10 44,0 q22,10 44,0" fill="none" stroke="${SKY}" stroke-width="2"/>`;
    s += `<rect x="516" y="150" width="28" height="8" rx="2" fill="${MUT}"/>`;
    s += `<path d="M520,178 q10,14 20,0 q-10,-10 -20,0 Z" fill="${ORANGE}"/>`;
    s += `<path d="M528,170 l4,-10 M536,172 l3,-8" stroke="${ORANGE}" stroke-width="2" stroke-linecap="round"/>`;
    s += `<circle cx="520" cy="98" r="3" fill="${MUT}"/><circle cx="546" cy="88" r="2.5" fill="${MUT}"/><circle cx="562" cy="98" r="2" fill="${MUT}"/>`;
    s += txt(532, 208, '③ 蒸发：水跑盐留下', { fs: 13, fw: 900 });
    s += txt(532, 226, '白色颗粒就是盐结晶', { fs: 11.5, fill: MUT });
    return s + '</svg>';
  };

  /* 物理变化与化学变化 */
  const change = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 212">`;
    const cards = [
      { title: '物理变化', sub: '样子变了，还是原来的物质', color: BLUE,
        items: ['冰化成水、水结成冰', '捏橡皮泥、剪纸', '糖溶于水、酒精挥发'] },
      { title: '化学变化', sub: '产生了新的物质', color: RED,
        items: ['蜡烛燃烧、木柴烧成灰', '铁生锈、食物变质', '面粉发酵、绿叶光合'] },
    ];
    cards.forEach((c, i) => {
      const x = 24 + i * 306;
      s += `<rect x="${x}" y="16" width="290" height="168" rx="14" fill="#fafbfe" stroke="${c.color}" stroke-width="2"/>`;
      s += `<rect x="${x}" y="16" width="290" height="34" rx="14" fill="${c.color}"/>`;
      s += `<rect x="${x}" y="36" width="290" height="14" fill="${c.color}"/>`;
      s += txt(x + 145, 39, c.title, { fs: 16, fw: 900, fill: '#fff' });
      s += txt(x + 145, 68, c.sub, { fs: 12.5, fill: c.color });
      c.items.forEach((it, j) => {
        s += `<circle cx="${x + 34}" cy="${94 + j * 30}" r="3.5" fill="${c.color}"/>`;
        s += txt(x + 46, 94 + j * 30, it, { anchor: 'start', fs: 13.5 });
      });
    });
    s += txt(320, 205, '判断关键：有没有「新物质」产生——蜡烛燃烧既滴蜡油（物理）又冒烟（化学）', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* ================= 力与运动 ================= */

  /* 简单机械 */
  const machine = () => {
    if (typeof window !== 'undefined') {
      const interactive = window.SciExperiments?.html('machine');
      if (interactive) return interactive;
    }
    let s = `<svg class="fig-svg" viewBox="0 0 640 212">`;
    /* 杠杆 */
    s += `<path d="M60,150 L200,138" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`;
    s += `<path d="M126,150 l-7,14 h14 Z" fill="${INK}"/>`;
    s += txt(130, 186, '支点', { fs: 11.5, fill: MUT });
    s += `<rect x="44" y="118" width="30" height="20" rx="3" fill="${RED}" opacity=".85"/>`;
    s += `<rect x="188" y="106" width="26" height="30" rx="3" fill="${PURPLE}" opacity=".85"/>`;
    s += arrow(96, 92, 96, 116, BLUE);
    s += txt(96, 84, '轻轻松', { fs: 11.5, fill: BLUE });
    s += txt(130, 28, '杠杆：支点靠重物就省力', { fs: 13, fw: 900 });
    /* 定滑轮 */
    s += `<circle cx="360" cy="56" r="18" fill="none" stroke="${INK}" stroke-width="3.5"/>`;
    s += `<circle cx="360" cy="56" r="4" fill="${INK}"/>`;
    s += `<rect x="348" y="30" width="24" height="12" rx="3" fill="#a89e8c"/>`;
    s += `<line x1="342" y1="56" x2="342" y2="140" stroke="${MUT}" stroke-width="2.5"/>`;
    s += `<line x1="378" y1="56" x2="378" y2="96" stroke="${MUT}" stroke-width="2.5"/>`;
    s += `<rect x="328" y="140" width="28" height="22" rx="3" fill="${RED}" opacity=".85"/>`;
    s += `<rect x="366" y="96" width="24" height="18" rx="3" fill="${BLUE}" opacity=".85"/>`;
    s += arrow(402, 84, 402, 108, BLUE);
    s += txt(430, 96, '向下拉', { fs: 11.5, fill: BLUE });
    s += txt(366, 24, '定滑轮：改变方向不省力', { fs: 13, fw: 900 });
    s += txt(356, 186, '旗杆升旗', { fs: 11.5, fill: MUT });
    /* 斜面 */
    s += `<path d="M470,160 L620,160 L620,92 Z" fill="#eef3fb" stroke="${INK}" stroke-width="2.5"/>`;
    s += `<rect x="486" y="128" width="30" height="24" rx="3" fill="${PURPLE}" opacity=".85"/>`;
    s += arrow(548, 116, 578, 128, BLUE);
    s += txt(556, 106, '推着走', { fs: 11.5, fill: BLUE });
    s += txt(546, 40, '斜面：越缓越省力', { fs: 13, fw: 900 });
    s += txt(546, 58, '盘山公路就是斜面', { fs: 11.5, fill: MUT });
    s += txt(320, 206, '机械不省功：省力就要多走距离', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* ================= 光与声 ================= */

  /* 光的直线传播 */
  const lightRay = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 206">`;
    /* 左：影子 */
    s += `<circle cx="120" cy="52" r="20" fill="${GOLD}"/>`;
    [26, 34, 42, 50, 58].forEach(a => {
      s += `<line x1="120" y1="52" x2="${120 + 30 * Math.cos(a * Math.PI / 180)}" y2="${52 + 30 * Math.sin(a * Math.PI / 180)}" stroke="${GOLD}" stroke-width="2.5" stroke-linecap="round"/>`;
    });
    s += `<line x1="120" y1="52" x2="242" y2="150" stroke="${GOLD}" stroke-width="3" stroke-dasharray="7 5"/>`;
    s += `<line x1="120" y1="52" x2="212" y2="150" stroke="${GOLD}" stroke-width="3" stroke-dasharray="7 5"/>`;
    s += `<rect x="0" y="150" width="300" height="30" fill="#eef0e2"/>`;
    s += `<rect x="164" y="86" width="12" height="64" rx="3" fill="${INK}"/>`;
    s += `<path d="M176,150 L242,150 L228,166 L190,166 Z" fill="${MUT}" opacity=".55"/>`;
    s += txt(120, 24, '太阳', { fs: 12, fill: ORANGE });
    s += txt(212, 140, '影子', { fs: 12.5, fill: MUT });
    s += txt(150, 196, '光被挡住，留下影子', { fs: 12.5, fill: MUT });
    /* 中：分隔 */
    s += `<line x1="318" y1="20" x2="318" y2="186" stroke="${LINE}" stroke-width="2"/>`;
    /* 右：小孔成像 */
    s += `<path d="M360,66 q10,22 0,44 q-10,22 0,44 q10,-8 10,-22 q0,-8 -4,-22 q0,-8 4,-22 q4,-8 -4,-18 q-6,-6 -6,-4 Z" fill="#f0f4fa" stroke="${INK}" stroke-width="2.5"/>`;
    s += `<line x1="382" y1="88" x2="382" y2="120" stroke="${ORANGE}" stroke-width="3"/>`;
    s += `<path d="M378,88 l4,-10 4,10 Z" fill="${ORANGE}"/>`;
    s += txt(370, 76, '烛焰', { fs: 11.5, fill: ORANGE });
    s += `<rect x="440" y="40" width="12" height="126" fill="${INK}"/>`;
    s += `<circle cx="446" cy="103" r="4.5" fill="#eaf6fd"/>`;
    s += txt(446, 34, '小孔板', { fs: 11.5, fill: MUT });
    s += `<line x1="380" y1="92" x2="540" y2="76" stroke="${ORANGE}" stroke-width="2" stroke-dasharray="5 4"/>`;
    s += `<line x1="380" y1="114" x2="540" y2="130" stroke="${ORANGE}" stroke-width="2" stroke-dasharray="5 4"/>`;
    s += `<line x1="380" y1="103" x2="540" y2="103" stroke="${GOLD}" stroke-width="1.6" stroke-dasharray="4 4"/>`;
    s += `<path d="M540,76 q8,27 0,54 q-8,-27 0,-54 Z" fill="${ORANGE}" opacity=".85"/>`;
    s += `<rect x="534" y="150" width="12" height="18" fill="${MUT}"/>`;
    s += txt(516, 178, '倒立的像', { fs: 12.5, fw: 900, fill: RED });
    s += txt(486, 196, '光走直线，上下颠倒', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* 声音的产生与传播 */
  const sound = () => {
    if (typeof window !== 'undefined') {
      const interactive = window.SciExperiments?.html('sound');
      if (interactive) return interactive;
    }
    let s = `<svg class="fig-svg" viewBox="0 0 640 200">`;
    /* 音叉 */
    s += `<line x1="96" y1="118" x2="96" y2="86" stroke="#8a6a33" stroke-width="7" stroke-linecap="round"/>`;
    s += `<path d="M76,86 q0,-36 20,-36 q20,0 20,36" fill="none" stroke="#8a6a33" stroke-width="7" stroke-linecap="round"/>`;
    s += `<path d="M60,40 q-10,20 0,40 M132,40 q10,20 0,40" fill="none" stroke="${MUT}" stroke-width="2.5" stroke-dasharray="5 4"/>`;
    s += txt(96, 148, '音叉在振动', { fs: 12.5, fw: 900 });
    s += txt(96, 166, '「嗡——」', { fs: 12, fill: MUT });
    /* 声波圈 */
    [[150, 104, 16], [168, 104, 30], [186, 104, 44]].forEach(([cx, cy, r]) => {
      s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${SKY}" stroke-width="2" opacity=".7"/>`;
    });
    /* 两种波 */
    s += txt(470, 34, '响度看振幅（高低）', { fs: 13, fw: 900, fill: BLUE });
    s += `<line x1="340" y1="76" x2="600" y2="76" stroke="${LINE}" stroke-width="1.5"/>`;
    s += `<path d="M340,76 q13,-26 26,0 q13,26 26,0 q13,-26 26,0 q13,26 26,0 q13,-26 26,0 q13,26 26,0 q13,-26 26,0 q13,26 26,0" fill="none" stroke="${BLUE}" stroke-width="2.8"/>`;
    s += txt(470, 122, '音调看频率（疏密）', { fs: 13, fw: 900, fill: GREEN });
    s += `<line x1="340" y1="150" x2="600" y2="150" stroke="${LINE}" stroke-width="1.5"/>`;
    s += `<path d="M340,150 q6.5,-16 13,0 q6.5,16 13,0 q6.5,-16 13,0 q6.5,16 13,0 q6.5,-16 13,0 q6.5,16 13,0 q6.5,-16 13,0 q6.5,16 13,0 q6.5,-16 13,0 q6.5,16 13,0 q6.5,-16 13,0 q6.5,16 13,0 q6.5,-16 13,0 q6.5,16 13,0" fill="none" stroke="${GREEN}" stroke-width="2.8"/>`;
    s += txt(320, 190, '固体、液体、气体都能传声；真空中没有介质，一片「寂静」', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* ================= 电与磁 ================= */

  /* 磁铁的两极 */
  const magnet = () => {
    if (typeof window !== 'undefined') {
      const interactive = window.SciExperiments?.html('magnet');
      if (interactive) return interactive;
    }
    let s = `<svg class="fig-svg" viewBox="0 0 640 208">`;
    /* 条形磁铁 */
    s += `<rect x="60" y="42" width="200" height="36" rx="6" fill="${RED}"/>`;
    s += `<rect x="200" y="42" width="60" height="36" rx="6" fill="${BLUE}"/>`;
    s += txt(94, 66, 'N 极', { fs: 15, fw: 900, fill: '#fff' });
    s += txt(234, 66, 'S 极', { fs: 15, fw: 900, fill: '#fff' });
    /* 磁感线 */
    s += `<path d="M84,42 Q160,-8 236,42" fill="none" stroke="${MUT}" stroke-width="1.8" stroke-dasharray="5 4" marker-end="url(#sfig-arrow)"/>`;
    s += `<path d="M84,78 Q160,128 236,78" fill="none" stroke="${MUT}" stroke-width="1.8" stroke-dasharray="5 4" marker-end="url(#sfig-arrow)"/>`;
    s += txt(160, 104, '两端磁性最强', { fs: 12, fill: MUT });
    /* 相吸 */
    s += `<rect x="60" y="150" width="70" height="26" rx="5" fill="${RED}"/>`;
    s += `<rect x="130" y="150" width="70" height="26" rx="5" fill="${BLUE}"/>`;
    s += txt(84, 168, 'N', { fs: 13, fw: 900, fill: '#fff' });
    s += txt(182, 168, 'S', { fs: 13, fw: 900, fill: '#fff' });
    s += txt(130, 144, '异极相吸', { fs: 11.5, fill: GREEN });
    /* 相斥 */
    s += `<rect x="250" y="150" width="70" height="26" rx="5" fill="${RED}"/>`;
    s += `<rect x="360" y="150" width="70" height="26" rx="5" fill="${RED}"/>`;
    s += txt(284, 168, 'N', { fs: 13, fw: 900, fill: '#fff' });
    s += txt(394, 168, 'N', { fs: 13, fw: 900, fill: '#fff' });
    s += txt(340, 144, '同极相斥', { fs: 11.5, fill: RED });
    /* 右侧说明 */
    s += txt(520, 52, '指南针是个小磁针', { fs: 13.5, fw: 900 });
    s += `<circle cx="520" cy="110" r="34" fill="#eef3fb" stroke="${INK}" stroke-width="2"/>`;
    s += `<path d="M520,84 L528,110 L520,136 L512,110 Z" fill="${RED}"/>`;
    s += `<path d="M520,136 L512,110 L528,110 Z" fill="${BLUE}"/>`;
    s += txt(520, 70, 'N', { fs: 12, fill: RED });
    s += txt(520, 162, 'S', { fs: 12, fill: BLUE });
    s += txt(566, 104, '地球是大磁体，', { anchor: 'start', fs: 12, fill: MUT });
    s += txt(566, 122, '小磁针总指南北', { anchor: 'start', fs: 12, fill: MUT });
    s += txt(320, 202, '磁铁吸铁、钴、镍；隔着纸和水也能吸', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* ================= 生命世界 ================= */

  /* 食物链 */
  const foodchain = () => {
    if (typeof window !== 'undefined') {
      const interactive = window.SciProcess?.html('foodchain');
      if (interactive) return interactive;
    }
    let s = `<svg class="fig-svg" viewBox="0 0 640 168">`;
    const links = [
      { emoji: '🌾', name: '稻谷', role: '生产者', color: GREEN },
      { emoji: '🦗', name: '蝗虫', role: '初级消费者', color: ORANGE },
      { emoji: '🐸', name: '青蛙', role: '消费者', color: SKY },
      { emoji: '🐍', name: '蛇', role: '消费者', color: PURPLE },
      { emoji: '🦅', name: '鹰', role: '顶级消费者', color: RED },
    ];
    links.forEach((l, i) => {
      const cx = 66 + i * 128;
      s += `<circle cx="${cx}" cy="72" r="34" fill="#fafbfe" stroke="${l.color}" stroke-width="2.5"/>`;
      s += txt(cx, 82, l.emoji, { fs: 30 });
      s += txt(cx, 128, l.name, { fs: 14, fw: 900 });
      s += txt(cx, 146, l.role, { fs: 11, fill: MUT });
      if (i < 4) s += arrow(cx + 40, 72, cx + 88, 72, l.color);
    });
    s += txt(320, 26, '箭头指向「吃」的一方', { fs: 12.5, fill: MUT });
    s += txt(320, 164, '食物链从绿色植物开始；多条食物链交织成食物网', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* ================= 地球家园 ================= */

  /* 岩石与土壤 */
  const rockSoil = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 208">`;
    /* 地面剖面 */
    s += `<rect x="0" y="96" width="400" height="28" fill="#8a6a46"/>`;
    s += `<rect x="0" y="124" width="400" height="34" fill="#a97c50"/>`;
    s += `<rect x="0" y="158" width="400" height="50" fill="#9b9b93"/>`;
    /* 植被 */
    s += `<path d="M40,96 q-6,-24 0,-34 M40,96 q10,-18 18,-26 M40,96 q-14,-14 -20,-20" fill="none" stroke="${GREEN}" stroke-width="3" stroke-linecap="round"/>`;
    s += `<rect x="150" y="60" width="10" height="36" fill="#7a5b3a"/><circle cx="155" cy="52" r="20" fill="${GREEN}" opacity=".85"/>`;
    /* 岩石三兄弟 */
    const rocks = [
      { t: '花岗岩', sub: '岩浆岩', color: '#c9b8a8' },
      { t: '砂岩', sub: '沉积岩', color: '#d9b98a' },
      { t: '大理岩', sub: '变质岩', color: '#dfe5f0' },
    ];
    rocks.forEach((r, i) => {
      const x = 60 + i * 118;
      s += `<path d="M${x},64 l18,-14 22,4 8,16 -12,10 -30,2 Z" fill="${r.color}" stroke="${MUT}" stroke-width="1.8"/>`;
      s += txt(x + 22, 30, r.t, { fs: 12.5, fw: 900 });
      s += txt(x + 22, 46, '（' + r.sub + '）', { fs: 10.5, fill: MUT });
    });
    s += txt(200, 14, '岩石三大家族', { fs: 12.5, fill: MUT });
    /* 分层标注 */
    s += arrow(430, 104, 402, 108, MUT);
    s += txt(436, 108, '表层土：最肥沃，长庄稼', { anchor: 'start', fs: 12.5, fill: INK });
    s += arrow(430, 140, 402, 140, MUT);
    s += txt(436, 144, '下层土：石块多、养分少', { anchor: 'start', fs: 12.5, fill: INK });
    s += arrow(430, 178, 402, 178, MUT);
    s += txt(436, 182, '基岩：土壤的「母体」', { anchor: 'start', fs: 12.5, fill: INK });
    s += txt(320, 202, '岩石风化＋腐殖质，上百年才养出一层薄薄的耕作土', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* ================= 技术与工程 ================= */

  /* 工程设计六步曲 */
  const engineer = () => {
    const steps = [
      { t: '明确问题', d: '要解决什么？有何限制', color: BLUE },
      { t: '调查设计', d: '画图纸、列清单', color: SKY },
      { t: '制作模型', d: '照图纸动手做', color: TEAL },
      { t: '测试改进', d: '哪里不好改哪里', color: GREEN },
      { t: '展示分享', d: '讲思路听建议', color: GOLD },
      { t: '迭代升级', d: '再来一版更好', color: PURPLE },
    ];
    let s = `<svg class="fig-svg" viewBox="0 0 640 190">`;
    steps.forEach((st, i) => {
      const x = 20 + i * 102, y = 40 + (i % 2) * 74;
      s += `<rect x="${x}" y="${y}" width="92" height="58" rx="12" fill="${st.color}" opacity=".14"/>`;
      s += `<rect x="${x}" y="${y}" width="92" height="58" rx="12" fill="none" stroke="${st.color}" stroke-width="2"/>`;
      s += txt(x + 46, y + 25, st.t, { fs: 13.5, fw: 900, fill: st.color });
      s += txt(x + 46, y + 45, st.d, { fs: 10, fill: MUT });
      if (i < 5) s += arrow(x + 94, y + 29, x + 100, y + 29, st.color);
    });
    s += txt(320, 172, '工程讲约束：在有限的材料、成本和时间里，找到最佳方案', { fs: 12.5, fill: MUT });
    s += txt(60, 24, '科学家发现世界', { fs: 12.5, fill: BLUE });
    s += txt(508, 24, '工程师改造世界', { fs: 12.5, fill: PURPLE });
    return s + '</svg>';
  };

  /* 中国超级工程 */
  const chinaBuild = () => {
    const cards = [
      { emoji: '🚄', title: '复兴号高铁', sub: '时速 350 公里，里程世界第一', color: RED },
      { emoji: '🌉', title: '港珠澳大桥', sub: '全长约 55 千米的跨海大桥', color: SKY },
      { emoji: '📡', title: '中国天眼 FAST', sub: '口径 500 米，最大射电望远镜', color: PURPLE },
      { emoji: '🛰️', title: '北斗导航', sub: '全球组网，定位导航服务全球', color: TEAL },
    ];
    let s = `<svg class="fig-svg" viewBox="0 0 640 200">`;
    cards.forEach((c, i) => {
      const x = 20 + (i % 2) * 302, y = 14 + Math.floor(i / 2) * 86;
      s += `<rect x="${x}" y="${y}" width="298" height="74" rx="14" fill="#fafbfe" stroke="#e3e7f2" stroke-width="1.5"/>`;
      s += `<rect x="${x}" y="${y}" width="6" height="74" rx="3" fill="${c.color}"/>`;
      s += txt(x + 40, y + 48, c.emoji, { fs: 30 });
      s += txt(x + 74, y + 32, c.title, { anchor: 'start', fs: 16, fw: 900 });
      s += txt(x + 74, y + 56, c.sub, { anchor: 'start', fs: 12, fill: MUT });
    });
    s += txt(320, 194, '超级工程的背后，是工程设计、新材料与一次次测试改进', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* ================= 单元横幅 ================= */

  const bnCommon = (bg1, bg2, deco) =>
    `<svg class="fig-svg" viewBox="0 0 720 160" xmlns="http://www.w3.org/2000/svg">` +
    `<defs><linearGradient id="bng" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/>` +
    `</linearGradient></defs>` +
    `<rect x="0" y="0" width="720" height="160" rx="14" fill="url(#bng)"/>` + deco + `</svg>`;

  const bannerSu1 = () => bnCommon('#eaf4ff', '#f0faf4',
    `<g opacity=".9">` +
    `<circle cx="90" cy="80" r="30" fill="#fff" opacity=".25"/>` +
    `<circle cx="90" cy="80" r="18" fill="none" stroke="#fff" stroke-width="4"/>` +
    `<line x1="103" y1="93" x2="118" y2="108" stroke="#fff" stroke-width="5" stroke-linecap="round"/>` +
    `<text x="150" y="70" fill="#fff" font-size="26" font-weight="900">走进科学</text>` +
    `<text x="150" y="100" fill="#fff" font-size="14" font-weight="600" opacity=".9">观察 · 提问 · 实验 · 求证</text>` +
    `<g font-size="22">` +
    `<text x="560" y="60">🔬</text><text x="610" y="110">🧪</text><text x="500" y="120">📏</text>` +
    `</g></g>` +
    `<circle class="bn-float" cx="660" cy="40" r="4" fill="#fff" opacity=".7"/>` +
    `<circle class="bn-float bn-d2" cx="540" cy="30" r="3" fill="#fff" opacity=".6"/>` +
    `<circle class="bn-float bn-d3" cx="680" cy="120" r="3.5" fill="#fff" opacity=".6"/>`
  );

  const bannerSu2 = () => bnCommon('#fff2e8', '#eaf6fd',
    `<g opacity=".9">` +
    `<path d="M70,40 L70,110 Q70,120 80,120 L110,120 Q120,120 120,110 L120,40" fill="none" stroke="#d97745" stroke-width="4"/>` +
    `<rect x="74" y="60" width="42" height="56" fill="#ffd9a8" opacity=".7"/>` +
    `<circle cx="95" cy="74" r="4" fill="#fff" opacity=".8"/><circle cx="106" cy="90" r="3" fill="#fff" opacity=".7"/>` +
    `<path d="M150,30 L150,120 L175,120 L175,40 Z" fill="none" stroke="#4d96ff" stroke-width="3.5"/>` +
    `<rect x="153" y="70" width="20" height="48" fill="#b3d9ff" opacity=".7"/>` +
    `<text x="210" y="70" fill="#7a3f1f" font-size="26" font-weight="900">物质与变化</text>` +
    `<text x="210" y="100" fill="#7a3f1f" font-size="14" font-weight="600" opacity=".85">三态 · 溶解 · 物理与化学变化</text>` +
    `<g font-size="22"><text x="560" y="60">🧊</text><text x="610" y="110">💧</text><text x="500" y="120">🔥</text></g></g>` +
    `<circle class="bn-float" cx="660" cy="40" r="4" fill="#d97745" opacity=".5"/>` +
    `<circle class="bn-float bn-d2" cx="540" cy="30" r="3" fill="#4d96ff" opacity=".5"/>`
  );

  const bannerSu3 = () => bnCommon('#ffeef0', '#fff5e8',
    `<g opacity=".9">` +
    `<line x1="60" y1="110" x2="170" y2="95" stroke="#e25563" stroke-width="6" stroke-linecap="round"/>` +
    `<path d="M112,110 l-8,16 h16 Z" fill="#e25563"/>` +
    `<rect x="50" y="86" width="22" height="14" rx="3" fill="#8b65c9"/>` +
    `<rect x="160" y="76" width="20" height="20" rx="3" fill="#4d96ff"/>` +
    `<text x="210" y="70" fill="#8a2a35" font-size="26" font-weight="900">力与运动</text>` +
    `<text x="210" y="100" fill="#8a2a35" font-size="14" font-weight="600" opacity=".85">重力 · 浮力 · 摩擦 · 简单机械</text>` +
    `<g font-size="22"><text x="560" y="60">⚽</text><text x="610" y="110">🎯</text><text x="500" y="120">🚴</text></g></g>` +
    `<circle class="bn-float" cx="660" cy="40" r="4" fill="#e25563" opacity=".5"/>` +
    `<circle class="bn-float bn-d3" cx="520" cy="130" r="3" fill="#8b65c9" opacity=".5"/>`
  );

  const bannerSu4 = () => bnCommon('#fffbe8', '#f0faff',
    `<g opacity=".9">` +
    `<polygon points="70,40 90,40 120,110 60,110" fill="#fff" opacity=".6" stroke="#e6b23c" stroke-width="2.5"/>` +
    `<path d="M120,75 Q200,75 240,40 M120,82 Q200,82 240,60 M120,90 Q200,90 240,82 M120,98 Q200,98 240,104" fill="none" stroke-width="3" stroke-linecap="round">` +
    `<animate attributeName="stroke" values="#e25563;#e6b23c;#2fbf71;#4d96ff;#8b65c9;#e25563" dur="4s" repeatCount="indefinite"/>` +
    `</path>` +
    `<path d="M120,75 Q200,75 240,40" stroke="#e25563" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>` +
    `<path d="M120,98 Q200,98 240,104" stroke="#8b65c9" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>` +
    `<text x="270" y="70" fill="#7a5e12" font-size="26" font-weight="900">光与声</text>` +
    `<text x="270" y="100" fill="#7a5e12" font-size="14" font-weight="600" opacity=".85">直线传播 · 反射折射 · 振动传声</text>` +
    `<g font-size="22"><text x="560" y="60">🌈</text><text x="610" y="110">🔊</text><text x="500" y="120">💡</text></g></g>` +
    `<circle class="bn-float" cx="660" cy="40" r="4" fill="#e6b23c" opacity=".5"/>`
  );

  const bannerSu5 = () => bnCommon('#f3eeff', '#eef9ff',
    `<g opacity=".9">` +
    `<path d="M80,30 L80,120 L110,120 L110,30 Z" fill="#e25563"/>` +
    `<path d="M110,30 L110,120 L140,120 L140,30 Z" fill="#4d96ff"/>` +
    `<text x="95" y="82" fill="#fff" font-size="18" font-weight="900">N</text>` +
    `<text x="125" y="82" fill="#fff" font-size="18" font-weight="900">S</text>` +
    `<path d="M200,60 L180,110 L210,110 L185,140" fill="#e6b23c" stroke="#c99a1f" stroke-width="1.5"/>` +
    `<text x="240" y="70" fill="#5a3d8a" font-size="26" font-weight="900">电与磁</text>` +
    `<text x="240" y="100" fill="#5a3d8a" font-size="14" font-weight="600" opacity=".85">电路 · 导体 · 磁极 · 电磁铁</text>` +
    `<g font-size="22"><text x="560" y="60">⚡</text><text x="610" y="110">🧲</text><text x="500" y="120">💡</text></g></g>` +
    `<circle class="bn-float" cx="660" cy="40" r="4" fill="#8b65c9" opacity=".5"/>` +
    `<circle class="bn-float bn-d2" cx="540" cy="30" r="3" fill="#e6b23c" opacity=".5"/>`
  );

  const bannerSu6 = () => bnCommon('#eafaf0', '#fff8e8',
    `<g opacity=".9">` +
    `<path d="M80,120 L80,70 M70,90 Q90,60 110,80 Q130,100 90,90" fill="none" stroke="#2fbf71" stroke-width="3.5" stroke-linecap="round"/>` +
    `<circle cx="80" cy="60" r="6" fill="#2fbf71"/>` +
    `<path d="M150,110 Q150,70 170,70 Q190,70 190,110" fill="#f5c6c6" stroke="#e25563" stroke-width="2"/>` +
    `<circle cx="170" cy="85" r="4" fill="#fff"/>` +
    `<text x="220" y="70" fill="#1c6b3f" font-size="26" font-weight="900">生命世界</text>` +
    `<text x="220" y="100" fill="#1c6b3f" font-size="14" font-weight="600" opacity=".85">光合 · 食物链 · 身体系统</text>` +
    `<g font-size="22"><text x="560" y="60">🌱</text><text x="610" y="110">🐸</text><text x="500" y="120">🧬</text></g></g>` +
    `<circle class="bn-float" cx="660" cy="40" r="4" fill="#2fbf71" opacity=".5"/>` +
    `<circle class="bn-float bn-d3" cx="520" cy="130" r="3" fill="#e25563" opacity=".5"/>`
  );

  const bannerSu7 = () => bnCommon('#e6f7f4', '#eaf4ff',
    `<g opacity=".9">` +
    `<circle cx="95" cy="80" r="38" fill="#4d96ff" opacity=".25"/>` +
    `<path d="M60,80 Q75,55 95,60 Q115,55 130,80 Q120,105 95,110 Q70,105 60,80 Z" fill="#2fbf71" opacity=".7"/>` +
    `<path d="M80,70 Q90,65 100,72 M100,90 Q110,95 118,88" fill="none" stroke="#1d6f8f" stroke-width="2"/>` +
    `<text x="160" y="70" fill="#0f5c54" font-size="26" font-weight="900">地球家园</text>` +
    `<text x="160" y="100" fill="#0f5c54" font-size="14" font-weight="600" opacity=".85">圈层 · 水循环 · 天气 · 环保</text>` +
    `<g font-size="22"><text x="560" y="60">🌏</text><text x="610" y="110">💧</text><text x="500" y="120">☁️</text></g></g>` +
    `<circle class="bn-float" cx="660" cy="40" r="4" fill="#157d73" opacity=".5"/>` +
    `<circle class="bn-float bn-d2" cx="540" cy="30" r="3" fill="#4d96ff" opacity=".5"/>`
  );

  const bannerSu8 = () => bnCommon('#e8f4ff', '#f0f0fa',
    `<g opacity=".9">` +
    `<g transform="translate(70,80)">` +
    `<circle r="22" fill="none" stroke="#2f9bd6" stroke-width="4"/>` +
    `<circle r="6" fill="#2f9bd6"/>` +
    `<g class="bn-gear"><circle r="22" fill="none" stroke="#2f9bd6" stroke-width="4" transform="translate(34,0)"/><circle r="6" fill="#2f9bd6" transform="translate(34,0)"/></g>` +
    `</g>` +
    `<path d="M160,120 L200,120 L180,90 Z" fill="#8b65c9" opacity=".6"/>` +
    `<text x="230" y="70" fill="#1f5f8f" font-size="26" font-weight="900">技术与工程</text>` +
    `<text x="230" y="100" fill="#1f5f8f" font-size="14" font-weight="600" opacity=".85">设计 · 材料 · 结构 · 超级工程</text>` +
    `<g font-size="22"><text x="560" y="60">🛠️</text><text x="610" y="110">🚄</text><text x="500" y="120">🌉</text></g></g>` +
    `<circle class="bn-float" cx="660" cy="40" r="4" fill="#2f9bd6" opacity=".5"/>` +
    `<circle class="bn-float bn-d3" cx="520" cy="130" r="3" fill="#8b65c9" opacity=".5"/>`
  );

  /* ================= 新增知识点图示 ================= */

  /* 实验安全守则 */
  const safety = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 200">`;
    const rules = [
      { ico: '👂', t: '听清再动手', d: '先懂步骤再操作' },
      { ico: '🚫', t: '不尝不闻', d: '扇闻气味，绝不入口' },
      { ico: '🔥', t: '加热要小心', d: '大人在场，轻拿轻放' },
      { ico: '🧼', t: '实验后洗手', d: '器材归位，意外报告' },
    ];
    rules.forEach((r, i) => {
      const x = 20 + i * 155;
      s += `<rect x="${x}" y="20" width="140" height="120" rx="14" fill="#fafbfe" stroke="#e3e7f2" stroke-width="2"/>`;
      s += `<circle cx="${x + 70}" cy="62" r="26" fill="#eef3fb"/>`;
      s += txt(x + 70, 72, r.ico, { fs: 28 });
      s += txt(x + 70, 108, r.t, { fs: 14, fw: 900 });
      s += txt(x + 70, 128, r.d, { fs: 11.5, fill: MUT });
    });
    s += txt(320, 176, '安全是实验的第一条规则——宁可慢一点，不可冒险一次', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 物质的性质 */
  const properties = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 210">`;
    const items = [
      { ico: '🎨', t: '颜色', d: '金是黄的，铜是红的' },
      { ico: '👃', t: '气味', d: '水无味，醋有酸味' },
      { ico: '💎', t: '软硬', d: '铁硬，棉花软' },
      { ico: '🌊', t: '溶解性', d: '盐溶水，沙不溶' },
      { ico: '🔍', t: '透明度', d: '玻璃透明，木头不透明' },
    ];
    items.forEach((it, i) => {
      const x = 16 + i * 124;
      s += `<rect x="${x}" y="24" width="112" height="100" rx="12" fill="#fafbfe" stroke="${ORANGE}" stroke-width="1.8"/>`;
      s += txt(x + 56, 64, it.ico, { fs: 28 });
      s += txt(x + 56, 90, it.t, { fs: 14, fw: 900, fill: ORANGE });
      s += txt(x + 56, 110, it.d, { fs: 11, fill: MUT });
    });
    s += txt(320, 150, '同是无色液体：水和白醋闻起来不同——性质是区分物质的「身份证」', { fs: 12.5, fill: MUT });
    s += txt(320, 176, '物体 ≠ 物质：木桌是物体，木头是组成它的物质', { fs: 12.5, fw: 700, fill: TEAL });
    return s + '</svg>';
  };

  /* 重力与浮力 */
  const gravity = () => {
    const observation = window.SciExperiments?.html('buoyancy');
    if (observation) return observation;
    let s = `<svg class="fig-svg" viewBox="0 0 640 230">`;
    /* 左：重力 */
    s += `<circle cx="120" cy="60" r="18" fill="#8b65c9"/>`;
    s += arrow(120, 78, 120, 140, RED);
    s += txt(120, 156, '重力向下拉', { fs: 12.5, fw: 900, fill: RED });
    s += txt(120, 174, '方向竖直向下', { fs: 11.5, fill: MUT });
    /* 中：浮力 */
    s += `<rect x="220" y="100" width="200" height="80" rx="6" fill="#eaf6fd" stroke="${SKY}" stroke-width="2"/>`;
    s += `<rect x="222" y="120" width="196" height="58" fill="#c9e8f8"/>`;
    s += `<path d="M260,110 L300,110 L290,140 L270,140 Z" fill="#e6b23c" stroke="#c99a1f" stroke-width="1.5"/>`;
    s += arrow(280, 100, 280, 70, GREEN);
    s += arrow(280, 145, 280, 175, RED);
    s += txt(280, 62, '浮力 ↑', { fs: 12.5, fw: 900, fill: GREEN });
    s += txt(280, 188, '重力 ↓', { fs: 11.5, fill: RED });
    /* 右：沉浮对比 */
    s += `<rect x="450" y="100" width="170" height="80" rx="6" fill="#eaf6fd" stroke="${SKY}" stroke-width="2"/>`;
    s += `<rect x="452" y="120" width="166" height="58" fill="#c9e8f8"/>`;
    s += `<circle cx="480" cy="110" r="10" fill="#2fbf71"/><text x="480" y="114" text-anchor="middle" font-size="11" fill="#fff" font-weight="900">浮</text>`;
    s += `<circle cx="560" cy="150" r="10" fill="#e25563"/><text x="560" y="154" text-anchor="middle" font-size="11" fill="#fff" font-weight="900">沉</text>`;
    s += txt(535, 194, '漂浮稳定：浮力＝重力', { fs: 11, fill: GREEN });
    s += txt(320, 224, '沉下去的物体也受浮力；完全浸水而静止，是悬浮', { fs: 12, fill: MUT });
    return s + '</svg>';
  };

  /* 摩擦力与弹力 */
  const friction = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 200">`;
    /* 左：摩擦 */
    s += `<rect x="40" y="110" width="140" height="40" rx="5" fill="#a97c50"/>`;
    for (let i = 0; i < 12; i++) s += `<line x1="${50 + i * 11}" y1="110" x2="${50 + i * 11}" y2="150" stroke="#7a5b3a" stroke-width="1.2"/>`;
    s += `<rect x="80" y="70" width="50" height="40" rx="4" fill="#8b65c9"/>`;
    s += arrow(105, 90, 60, 90, BLUE);
    s += arrow(105, 90, 150, 90, ORANGE);
    s += txt(105, 60, '推 →', { fs: 12, fill: BLUE });
    s += txt(105, 140, '← 摩擦', { fs: 12, fill: ORANGE });
    s += txt(105, 172, '接触面越粗糙，摩擦越大', { fs: 11.5, fill: MUT });
    /* 中：花纹增摩擦 */
    s += `<circle cx="320" cy="100" r="34" fill="#34384d"/>`;
    for (let i = 0; i < 16; i++) {
      const a = i * 22.5 * Math.PI / 180;
      s += `<line x1="${320 + 22 * Math.cos(a)}" y1="${100 + 22 * Math.sin(a)}" x2="${320 + 32 * Math.cos(a)}" y2="${100 + 32 * Math.sin(a)}" stroke="#5a5f73" stroke-width="3"/>`;
    }
    s += txt(320, 172, '轮胎花纹 · 增大摩擦', { fs: 12, fill: MUT });
    /* 右：弹力 */
    s += `<path d="M510,60 q6,12 0,24 q-6,12 0,24 q6,12 0,24 q-6,12 0,24" fill="none" stroke="#e25563" stroke-width="4"/>`;
    s += arrow(540, 90, 560, 90, GREEN);
    s += arrow(480, 140, 460, 140, GREEN);
    s += txt(550, 84, '拉', { fs: 12, fill: GREEN });
    s += txt(470, 156, '缩', { fs: 12, fill: GREEN });
    s += txt(510, 172, '橡皮筋 · 弹力', { fs: 12, fill: MUT });
    s += txt(320, 192, '摩擦并非总是坏家伙：走路、握笔都靠它；弹簧、蹦床靠弹力', { fs: 12, fill: MUT });
    return s + '</svg>';
  };

  /* 光的反射与折射 */
  const reflect = () => {
    if (typeof window !== 'undefined') {
      const interactive = window.SciProcess?.html('light');
      if (interactive) return interactive;
    }
    let s = `<svg class="fig-svg" viewBox="0 0 640 210">`;
    /* 左：反射 */
    s += txt(150, 30, '反射（照镜子）', { fs: 13, fw: 900, fill: BLUE });
    s += `<line x1="40" y1="150" x2="260" y2="150" stroke="#b0b6c8" stroke-width="6"/>`;
    s += `<line x1="40" y1="150" x2="260" y2="150" stroke="#e3e7f2" stroke-width="2"/>`;
    s += arrow(60, 70, 150, 148, GOLD);
    s += arrow(150, 148, 240, 70, GOLD);
    s += `<line x1="150" y1="150" x2="150" y2="50" stroke="${MUT}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    s += txt(150, 46, '法线', { fs: 11, fill: MUT });
    s += txt(90, 96, '入射', { fs: 11, fill: GOLD });
    s += txt(210, 96, '反射', { fs: 11, fill: GOLD });
    s += txt(150, 174, '反射角 = 入射角', { fs: 12, fw: 700, fill: BLUE });
    /* 右：折射 */
    s += txt(470, 30, '折射（筷子折了）', { fs: 13, fw: 900, fill: TEAL });
    s += `<line x1="360" y1="120" x2="580" y2="120" stroke="#b0b6c8" stroke-width="3"/>`;
    s += `<rect x="362" y="120" width="216" height="60" fill="#eaf6fd" opacity=".8"/>`;
    s += arrow(400, 50, 470, 118, GOLD);
    s += arrow(470, 118, 500, 178, GOLD);
    s += `<line x1="470" y1="120" x2="470" y2="40" stroke="${MUT}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    s += txt(430, 80, '空气', { fs: 11, fill: MUT });
    s += txt(510, 150, '水', { fs: 11, fill: SKY });
    s += txt(470, 196, '光入水偏折，池水看起来更浅', { fs: 12, fw: 700, fill: TEAL });
    return s + '</svg>';
  };

  /* 彩虹与颜色 */
  const rainbow = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 190">`;
    const colors = ['#e25563', '#d97745', '#e6b23c', '#2fbf71', '#2f9bd6', '#4d96ff', '#8b65c9'];
    const names = ['红', '橙', '黄', '绿', '蓝', '靛', '紫'];
    /* 三棱镜 */
    s += `<polygon points="80,40 110,40 150,140 60,140" fill="#fff" opacity=".5" stroke="#b0b6c8" stroke-width="2"/>`;
    s += txt(95, 100, '三棱镜', { fs: 11, fill: MUT });
    /* 白光入射 */
    s += arrow(20, 90, 78, 90, INK);
    s += txt(20, 80, '白光', { fs: 12, fill: INK });
    /* 七色光出射 */
    colors.forEach((c, i) => {
      const y = 60 + i * 12;
      s += `<line x1="150" y1="90" x2="400" y2="${y}" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
      s += `<circle cx="420" cy="${y}" r="8" fill="${c}"/>`;
      s += txt(446, y + 4, names[i], { anchor: 'start', fs: 12, fw: 900, fill: c });
    });
    /* 彩虹弧 */
    colors.forEach((c, i) => {
      s += `<path d="M490,150 A${90 - i * 8},${90 - i * 8} 0 0 1 ${670 - i * 8},150" fill="none" stroke="${c}" stroke-width="6" opacity=".85"/>`;
    });
    s += txt(580, 172, '雨后彩虹', { fs: 12, fill: MUT });
    s += txt(320, 182, '白光由七色组成；不透明物体颜色由它反射的色光决定——红布只反射红光', { fs: 12, fill: MUT });
    return s + '</svg>';
  };

  /* 音调响度与噪声 */
  const soundProps = () => {
    if (typeof window !== 'undefined') {
      const interactive = window.SciExperiments?.html('tone');
      if (interactive) return interactive;
    }
    let s = `<svg class="fig-svg" viewBox="0 0 640 200">`;
    s += txt(160, 28, '音调：振动快慢（频率）', { fs: 13, fw: 900, fill: BLUE });
    s += `<line x1="40" y1="70" x2="280" y2="70" stroke="${LINE}" stroke-width="1.5"/>`;
    s += `<path d="M40,70 q8,-22 16,0 q8,22 16,0 q8,-22 16,0 q8,22 16,0 q8,-22 16,0 q8,22 16,0 q8,-22 16,0 q8,22 16,0 q8,-22 16,0 q8,22 16,0 q8,-22 16,0 q8,22 16,0 q8,-22 16,0 q8,22 16,0" fill="none" stroke="${BLUE}" stroke-width="2.6"/>`;
    s += txt(160, 96, '振动快 → 音调高（尖锐）', { fs: 12, fill: MUT });
    s += `<line x1="40" y1="140" x2="280" y2="140" stroke="${LINE}" stroke-width="1.5"/>`;
    s += `<path d="M40,140 q20,-22 40,0 q20,22 40,0 q20,-22 40,0 q20,22 40,0 q20,-22 40,0 q20,22 40,0" fill="none" stroke="${GREEN}" stroke-width="2.6"/>`;
    s += txt(160, 166, '振动慢 → 音调低（低沉）', { fs: 12, fill: MUT });
    s += txt(470, 28, '响度：振动幅度', { fs: 13, fw: 900, fill: ORANGE });
    s += `<line x1="360" y1="70" x2="580" y2="70" stroke="${LINE}" stroke-width="1.5"/>`;
    s += `<path d="M360,70 q18,-30 36,0 q18,30 36,0 q18,-30 36,0 q18,30 36,0 q18,-30 36,0 q18,30 36,0" fill="none" stroke="${ORANGE}" stroke-width="2.6"/>`;
    s += txt(470, 96, '振幅大 → 声音响', { fs: 12, fill: MUT });
    s += `<line x1="360" y1="140" x2="580" y2="140" stroke="${LINE}" stroke-width="1.5"/>`;
    s += `<path d="M360,140 q18,-10 36,0 q18,10 36,0 q18,-10 36,0 q18,10 36,0 q18,-10 36,0 q18,10 36,0" fill="none" stroke="${PURPLE}" stroke-width="2.6"/>`;
    s += txt(470, 166, '振幅小 → 声音轻', { fs: 12, fill: MUT });
    s += txt(320, 190, '音色是声音的「指纹」——闭眼也能分清钢琴和小提琴', { fs: 12, fill: MUT });
    return s + '</svg>';
  };

  /* 静电小魔术 */
  const staticElec = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 190">`;
    /* 梳子吸纸 */
    s += `<path d="M80,40 L140,40 L130,110 L90,110 Z" fill="#d97745" stroke="#a85a2e" stroke-width="2"/>`;
    s += `<rect x="100" y="30" width="20" height="12" rx="3" fill="#a85a2e"/>`;
    for (let i = 0; i < 4; i++) s += `<line x1="${92 + i * 12}" y1="110" x2="${92 + i * 12}" y2="124" stroke="#a85a2e" stroke-width="2"/>`;
    s += `<rect x="70" y="150" width="10" height="10" fill="#eaf6fd" stroke="${SKY}"/>` +
      `<rect x="100" y="156" width="10" height="10" fill="#eaf6fd" stroke="${SKY}"/>` +
      `<rect x="130" y="150" width="10" height="10" fill="#eaf6fd" stroke="${SKY}"/>`;
    s += arrow(110, 130, 110, 150, ORANGE);
    s += txt(110, 36, '梳子', { fs: 12, fill: MUT });
    s += txt(110, 180, '摩擦起电，吸起小纸屑', { fs: 12, fill: MUT });
    /* 电荷 */
    s += txt(320, 30, '同种电荷相斥，异种电荷相吸', { fs: 13, fw: 900, fill: PURPLE });
    s += `<circle cx="280" cy="100" r="22" fill="#e25563"/><text x="280" y="106" text-anchor="middle" fill="#fff" font-size="18" font-weight="900">−</text>` +
      `<circle cx="360" cy="100" r="22" fill="#4d96ff"/><text x="360" y="106" text-anchor="middle" fill="#fff" font-size="18" font-weight="900">+</text>`;
    s += arrow(302, 100, 338, 100, GREEN);
    s += txt(320, 140, '异名相吸', { fs: 12, fill: GREEN });
    s += `<circle cx="460" cy="100" r="22" fill="#e25563"/><text x="460" y="106" text-anchor="middle" fill="#fff" font-size="18" font-weight="900">−</text>` +
      `<circle cx="540" cy="100" r="22" fill="#e25563"/><text x="540" y="106" text-anchor="middle" fill="#fff" font-size="18" font-weight="900">−</text>`;
    s += arrow(482, 100, 460, 100, RED);
    s += arrow(518, 100, 540, 100, RED);
    s += txt(500, 140, '同名相斥', { fs: 12, fill: RED });
    s += txt(320, 170, '脱毛衣的噼啪声、冬天碰门把被电——都是小小的放电', { fs: 12, fill: MUT });
    return s + '</svg>';
  };

  /* 导体绝缘体与安全用电 */
  const conductor = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 210">`;
    /* 导体 */
    s += txt(160, 26, '导体（易导电）', { fs: 13, fw: 900, fill: GREEN });
    const cond = ['🔩 金属', '🧍 人体', '🌊 不纯净水', '⛰️ 大地'];
    cond.forEach((c, i) => {
      const y = 44 + i * 26;
      s += `<rect x="40" y="${y - 16}" width="240" height="22" rx="8" fill="#e9f9f0" stroke="#2fbf71" stroke-width="1.5"/>`;
      s += txt(60, y, c, { anchor: 'start', fs: 12.5, fw: 700, fill: '#187749' });
    });
    /* 绝缘体 */
    s += txt(480, 26, '绝缘体（难导电）', { fs: 13, fw: 900, fill: BLUE });
    const insu = ['🧴 塑料', '🖤 橡胶', '🪟 玻璃', '🪵 干木头'];
    insu.forEach((c, i) => {
      const y = 44 + i * 26;
      s += `<rect x="360" y="${y - 16}" width="240" height="22" rx="8" fill="#eaf4fb" stroke="#4d96ff" stroke-width="1.5"/>`;
      s += txt(380, y, c, { anchor: 'start', fs: 12.5, fw: 700, fill: '#2767a8' });
    });
    /* 安全用电 */
    s += `<rect x="40" y="156" width="560" height="44" rx="10" fill="#fff5f5" stroke="#e25563" stroke-width="1.5"/>`;
    s += txt(320, 176, '⚠️ 安全用电：湿手不碰电器 · 不捅插座 · 高压线下不放风筝 · 冒烟先断电', { fs: 12.5, fw: 700, fill: '#a4453f' });
    return s + '</svg>';
  };

  /* 电磁铁 */
  const electromagnet = () => {
    if (typeof window !== 'undefined') {
      const interactive = window.SciExperiments?.html('electromagnet');
      if (interactive) return interactive;
    }
    let s = `<svg class="fig-svg" viewBox="0 0 640 200">`;
    /* 铁钉 + 线圈 */
    s += `<rect x="100" y="80" width="180" height="28" rx="14" fill="#8a6a33" stroke="#5a4422" stroke-width="2"/>`;
    s += txt(190, 99, '铁芯', { fs: 12, fill: '#fff', fw: 900 });
    for (let i = 0; i < 10; i++) {
      const x = 112 + i * 16;
      s += `<path d="M${x},74 q8,6 0,40 q-8,-6 0,-40" fill="none" stroke="#e25563" stroke-width="3"/>`;
    }
    s += `<line x1="112" y1="108" x2="112" y2="140" stroke="#e25563" stroke-width="3"/>`;
    s += `<line x1="268" y1="108" x2="268" y2="140" stroke="#e25563" stroke-width="3"/>`;
    /* 电池 */
    s += `<line x1="112" y1="140" x2="112" y2="170" stroke="#34384d" stroke-width="2.5"/>`;
    s += `<line x1="268" y1="140" x2="268" y2="170" stroke="#34384d" stroke-width="2.5"/>`;
    s += `<line x1="112" y1="170" x2="180" y2="170" stroke="#34384d" stroke-width="2.5"/>`;
    s += `<line x1="268" y1="170" x2="200" y2="170" stroke="#34384d" stroke-width="2.5"/>`;
    s += `<line x1="192" y1="162" x2="192" y2="178" stroke="#34384d" stroke-width="3"/>`;
    s += `<line x1="200" y1="158" x2="200" y2="182" stroke="#34384d" stroke-width="7"/>`;
    s += txt(196, 196, '电池', { fs: 11, fill: MUT });
    s += txt(190, 60, '通电 → 有磁性', { fs: 12, fw: 900, fill: GREEN });
    /* 吸铁 */
    s += `<circle cx="100" cy="130" r="6" fill="#b0b6c8"/><circle cx="86" cy="136" r="5" fill="#b0b6c8"/>`;
    s += txt(100, 150, '吸起回形针', { fs: 11, fill: MUT });
    /* 应用 */
    s += txt(470, 30, '电磁铁的应用', { fs: 13, fw: 900, fill: PURPLE });
    const apps = [
      { ico: '🏗️', t: '电磁起重机' },
      { ico: '🔔', t: '电铃' },
      { ico: '🚄', t: '磁悬浮列车' },
    ];
    apps.forEach((a, i) => {
      const x = 370 + i * 86;
      s += `<rect x="${x}" y="56" width="74" height="60" rx="10" fill="#f3eeff" stroke="#8b65c9" stroke-width="1.5"/>`;
      s += txt(x + 37, 84, a.ico, { fs: 24 });
      s += txt(x + 37, 108, a.t, { fs: 10.5, fw: 700, fill: PURPLE });
    });
    s += txt(470, 140, '断电 → 磁性大大减弱', { fs: 12, fw: 900, fill: RED });
    s += txt(320, 178, '电磁铁 = 铁芯 + 线圈 + 电源；其他条件相同，电流、匝数影响磁性', { fs: 12, fill: MUT });
    return s + '</svg>';
  };

  /* 光合作用 */
  const photosynthesis = () => {
    if (typeof window !== 'undefined') {
      const interactive = window.SciProcess?.html('photo');
      if (interactive) return interactive;
    }
    let s = `<svg class="fig-svg" viewBox="0 0 640 210">`;
    /* 太阳 */
    s += `<circle cx="80" cy="60" r="22" fill="${GOLD}"/>`;
    [0, 45, 90, 135, 180, 225, 270, 315].forEach(a => {
      const r = a * Math.PI / 180;
      s += `<line x1="${80 + 26 * Math.cos(r)}" y1="${60 + 26 * Math.sin(r)}" x2="${80 + 34 * Math.cos(r)}" y2="${60 + 34 * Math.sin(r)}" stroke="${GOLD}" stroke-width="2.5"/>`;
    });
    s += txt(80, 110, '阳光 ☀️', { fs: 12, fill: ORANGE, fw: 700 });
    /* 叶子 */
    s += `<path d="M300,110 Q260,70 300,50 Q360,50 380,90 Q360,140 300,110 Z" fill="#2fbf71" stroke="#1c6b3f" stroke-width="2"/>`;
    s += `<line x1="300" y1="110" x2="370" y2="70" stroke="#1c6b3f" stroke-width="2"/>`;
    s += txt(320, 96, '叶绿体', { fs: 11, fill: '#fff', fw: 900 });
    /* 根 */
    s += `<line x1="320" y1="110" x2="320" y2="180" stroke="#7a5b3a" stroke-width="4"/>`;
    s += `<path d="M320,150 q-14,8 -24,18 M320,160 q14,8 24,18 M320,170 q-10,6 -18,12" stroke="#7a5b3a" stroke-width="2.5" fill="none"/>`;
    /* 箭头 */
    s += arrow(130, 60, 250, 80, GOLD);
    s += txt(190, 56, '光能', { fs: 11, fill: ORANGE });
    s += arrow(320, 170, 320, 130, SKY);
    s += txt(340, 150, '水+无机盐', { fs: 11, fill: SKY });
    s += arrow(420, 70, 500, 60, GREEN);
    s += txt(470, 52, '氧气 →', { fs: 11, fill: GREEN });
    s += arrow(420, 100, 500, 110, GOLD);
    s += txt(470, 124, '← 养料', { fs: 11, fill: ORANGE });
    /* 公式 */
    s += `<rect x="380" y="140" width="240" height="46" rx="8" fill="#eaf6fd" stroke="${SKY}" stroke-width="1.5"/>`;
    s += txt(500, 158, '阳光 + 水 + 二氧化碳', { fs: 12, fw: 700 });
    s += txt(500, 176, '→ 养料 + 氧气', { fs: 12, fw: 900, fill: GREEN });
    s += txt(320, 200, '光合作用养活植物自己，也（直接或间接）养活了几乎所有生物', { fs: 12, fill: MUT });
    return s + '</svg>';
  };

  /* 动物大家族 */
  const animalClass = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 220">`;
    s += txt(160, 24, '脊椎动物（有脊柱）', { fs: 13, fw: 900, fill: BLUE });
    const vert = [
      { ico: '🐟', t: '鱼类', d: '水中·鳃·鳞' },
      { ico: '🐸', t: '两栖', d: '幼时水·鳃' },
      { ico: '🐢', t: '爬行', d: '鳞片·甲' },
      { ico: '🐦', t: '鸟类', d: '羽毛·卵生' },
      { ico: '🐳', t: '哺乳', d: '胎生·哺乳' },
    ];
    vert.forEach((v, i) => {
      const x = 20 + i * 122;
      s += `<rect x="${x}" y="36" width="112" height="74" rx="12" fill="#eaf4fb" stroke="${BLUE}" stroke-width="1.5"/>`;
      s += txt(x + 56, 66, v.ico, { fs: 26 });
      s += txt(x + 56, 88, v.t, { fs: 13, fw: 900, fill: BLUE });
      s += txt(x + 56, 104, v.d, { fs: 10.5, fill: MUT });
    });
    s += txt(480, 24, '无脊椎动物', { fs: 13, fw: 900, fill: PURPLE });
    const invert = [
      { ico: '🦋', t: '昆虫', d: '3对足·分头胸腹' },
      { ico: '🐌', t: '软体', d: '蜗牛·贝壳' },
      { ico: '🦀', t: '节肢', d: '虾蟹·蜘蛛' },
    ];
    invert.forEach((v, i) => {
      const x = 380 + i * 84;
      s += `<rect x="${x}" y="36" width="76" height="74" rx="12" fill="#f3eeff" stroke="${PURPLE}" stroke-width="1.5"/>`;
      s += txt(x + 38, 66, v.ico, { fs: 24 });
      s += txt(x + 38, 88, v.t, { fs: 12, fw: 900, fill: PURPLE });
      s += txt(x + 38, 104, v.d, { fs: 9.5, fill: MUT });
    });
    /* 易错 */
    s += `<rect x="20" y="134" width="600" height="72" rx="12" fill="#fff8e8" stroke="${GOLD}" stroke-width="1.5"/>`;
    s += txt(320, 158, '⚠️ 易错：蝙蝠会飞但不是鸟（胎生哺乳）；蜘蛛有 4 对足不是昆虫', { fs: 13, fw: 700, fill: '#7a5e12' });
    s += txt(320, 182, '鲸鱼生活在海里却是哺乳动物；鸵鸟不会飞却是鸟', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* 我们的身体 */
  const body = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 210">`;
    const systems = [
      { ico: '🦷', t: '消化', d: '切碎·搅拌·吸收', color: ORANGE },
      { ico: '🫁', t: '呼吸', d: '吸氧·呼二氧化碳', color: SKY },
      { ico: '❤️', t: '循环', d: '心脏·血管运输', color: RED },
      { ico: '🦴', t: '运动', d: '骨骼·肌肉', color: PURPLE },
      { ico: '🧠', t: '神经', d: '脑是总司令部', color: TEAL },
    ];
    systems.forEach((sys, i) => {
      const x = 20 + i * 122;
      s += `<rect x="${x}" y="24" width="112" height="100" rx="14" fill="#fafbfe" stroke="${sys.color}" stroke-width="1.8"/>`;
      s += txt(x + 56, 62, sys.ico, { fs: 30 });
      s += txt(x + 56, 88, sys.t + '系统', { fs: 13.5, fw: 900, fill: sys.color });
      s += txt(x + 56, 108, sys.d, { fs: 11, fill: MUT });
    });
    s += txt(320, 148, '身体是一台超级机器，各系统分工又合作', { fs: 13, fw: 700, fill: INK });
    s += txt(320, 172, '身体各部分互相配合，才能呼吸、吃饭和运动', { fs: 12, fill: MUT });
    s += txt(320, 194, '运动时呼吸、心跳加快——身体加急送氧气和养料', { fs: 12, fw: 700, fill: TEAL });
    return s + '</svg>';
  };

  /* 地球四大圈层 */
  const earthLayers = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 210">`;
    /* 地球截面 */
    s += `<circle cx="160" cy="110" r="78" fill="#a97c50"/>`;
    s += `<circle cx="160" cy="110" r="56" fill="#4d96ff" opacity=".4"/>`;
    s += `<circle cx="160" cy="110" r="40" fill="#e6b23c" opacity=".6"/>`;
    s += `<circle cx="160" cy="110" r="20" fill="#e25563"/>`;
    /* 大气圈 */
    s += `<circle cx="160" cy="110" r="92" fill="none" stroke="#8fb0d8" stroke-width="8" opacity=".4"/>`;
    /* 标注 */
    s += arrow(250, 50, 170, 60, BLUE);
    s += txt(260, 46, '大气圈', { anchor: 'start', fs: 12, fw: 900, fill: BLUE });
    s += txt(260, 64, '空气的海洋', { anchor: 'start', fs: 10.5, fill: MUT });
    s += arrow(250, 86, 200, 86, SKY);
    s += txt(260, 90, '水圈', { anchor: 'start', fs: 12, fw: 900, fill: SKY });
    s += txt(260, 106, '江河湖海冰川', { anchor: 'start', fs: 10.5, fill: MUT });
    s += arrow(250, 120, 190, 120, ORANGE);
    s += txt(260, 124, '岩石圈', { anchor: 'start', fs: 12, fw: 900, fill: ORANGE });
    s += txt(260, 140, '山脉土壤矿产', { anchor: 'start', fs: 10.5, fill: MUT });
    s += arrow(250, 156, 170, 140, GREEN);
    s += txt(260, 160, '生物圈', { anchor: 'start', fs: 12, fw: 900, fill: GREEN });
    s += txt(260, 176, '所有生物+家园', { anchor: 'start', fs: 10.5, fill: MUT });
    /* 右侧小图 */
    s += txt(490, 36, '四大圈层互相依存', { fs: 13, fw: 900, fill: TEAL });
    s += `<circle cx="440" cy="120" r="22" fill="#8fb0d8" opacity=".5"/><text x="440" y="124" text-anchor="middle" font-size="11">大气</text>`;
    s += `<circle cx="500" cy="100" r="22" fill="#4d96ff" opacity=".4"/><text x="500" y="104" text-anchor="middle" font-size="11">水</text>`;
    s += `<circle cx="470" cy="150" r="22" fill="#a97c50" opacity=".5"/><text x="470" y="154" text-anchor="middle" font-size="11">岩石</text>`;
    s += `<circle cx="540" cy="150" r="22" fill="#2fbf71" opacity=".5"/><text x="540" y="154" text-anchor="middle" font-size="11">生物</text>`;
    s += txt(320, 200, '生物圈渗透在大气圈底部、水圈和岩石圈上层，四大圈层环环相扣', { fs: 12, fill: MUT });
    return s + '</svg>';
  };

  /* 水循环 */
  const waterCycle = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 210">`;
    /* 太阳 */
    s += `<circle cx="80" cy="50" r="18" fill="${GOLD}"/>`;
    [0, 60, 120, 180, 240, 300].forEach(a => {
      const r = a * Math.PI / 180;
      s += `<line x1="${80 + 22 * Math.cos(r)}" y1="${50 + 22 * Math.sin(r)}" x2="${80 + 28 * Math.cos(r)}" y2="${50 + 28 * Math.sin(r)}" stroke="${GOLD}" stroke-width="2.5"/>`;
    });
    s += txt(80, 92, '太阳', { fs: 11, fill: ORANGE });
    /* 海洋 */
    s += `<rect x="20" y="150" width="600" height="46" rx="6" fill="#eaf6fd" stroke="${SKY}" stroke-width="2"/>`;
    s += `<path d="M20,160 q20,8 40,0 q20,-8 40,0 q20,8 40,0 q20,-8 40,0 q20,8 40,0 q20,-8 40,0 q20,8 40,0 q20,-8 40,0 q20,8 40,0 q20,-8 40,0 q20,8 40,0 q20,-8 40,0 q20,8 40,0 q20,-8 40,0 q20,8 40,0 q20,-8 40,0" fill="none" stroke="${SKY}" stroke-width="1.5"/>`;
    s += txt(320, 184, '海洋 / 江河', { fs: 12, fill: SKY });
    /* 蒸发 */
    for (let i = 0; i < 4; i++) {
      const x = 140 + i * 100;
      s += `<path d="M${x},150 q-6,-14 0,-28 q6,-14 0,-28" fill="none" stroke="${SKY}" stroke-width="2" stroke-linecap="round" opacity=".7"/>`;
    }
    s += txt(320, 100, '蒸发 ↑', { fs: 12, fill: SKY });
    /* 云 */
    s += `<ellipse cx="320" cy="50" rx="60" ry="16" fill="#fff" stroke="#c9cdd9" stroke-width="1.5"/>`;
    s += `<ellipse cx="290" cy="44" rx="28" ry="14" fill="#fff"/>`;
    s += `<ellipse cx="350" cy="44" rx="26" ry="13" fill="#fff"/>`;
    s += txt(320, 78, '云（凝结）', { fs: 11, fill: MUT });
    /* 降水 */
    for (let i = 0; i < 5; i++) {
      const x = 280 + i * 20;
      s += `<line x1="${x}" y1="66" x2="${x - 4}" y2="86" stroke="${BLUE}" stroke-width="2" stroke-linecap="round"/>`;
    }
    s += arrow(420, 86, 560, 140, BLUE);
    s += txt(500, 108, '降水 ↓', { fs: 12, fill: BLUE });
    /* 径流 */
    s += arrow(560, 170, 200, 170, SKY);
    s += txt(380, 196, '径流（流回海洋）', { fs: 11, fill: MUT });
    s += txt(320, 204, '水在海洋、天空、陆地间循环；淡水只占约 2.5%，要节约', { fs: 12, fill: MUT });
    return s + '</svg>';
  };

  /* 天气观测与灾害 */
  const weather = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 210">`;
    const tools = [
      { ico: '🌡️', t: '气温计', d: '测温度' },
      { ico: '🌧️', t: '雨量器', d: '测降水' },
      { ico: '🌬️', t: '风向标', d: '测风向' },
      { ico: '💨', t: '风速仪', d: '测风速' },
    ];
    tools.forEach((t, i) => {
      const x = 20 + i * 110;
      s += `<rect x="${x}" y="20" width="100" height="78" rx="12" fill="#fafbfe" stroke="#2f9bd6" stroke-width="1.5"/>`;
      s += txt(x + 50, 54, t.ico, { fs: 26 });
      s += txt(x + 50, 78, t.t, { fs: 12.5, fw: 900, fill: '#2767a8' });
      s += txt(x + 50, 94, t.d, { fs: 10.5, fill: MUT });
    });
    /* 预警颜色 */
    s += txt(320, 124, '预警信号颜色', { fs: 13, fw: 900 });
    const warn = [
      { c: '#4d96ff', t: '蓝', d: '一般' },
      { c: '#e6b23c', t: '黄', d: '较重' },
      { c: '#d97745', t: '橙', d: '严重' },
      { c: '#e25563', t: '红', d: '特别严重' },
    ];
    warn.forEach((w, i) => {
      const x = 470 + i * 42;
      s += `<circle cx="${x}" cy="148" r="14" fill="${w.c}"/>`;
      s += txt(x, 152, w.t, { fs: 12, fw: 900, fill: '#fff' });
      s += txt(x, 178, w.d, { fs: 10.5, fill: MUT });
    });
    /* 自护 */
    s += `<rect x="20" y="160" width="420" height="38" rx="10" fill="#fff5f5" stroke="#e25563" stroke-width="1.5"/>`;
    s += txt(230, 184, '雷雨不站树下 · 台风天不出门 · 暴雨往高处走 · 地震先躲后撤护头颈', { fs: 12, fw: 700, fill: '#a4453f' });
    return s + '</svg>';
  };

  /* 三角形的稳定性 */
  const triangle = () => {
    const observation = window.SciExperiments?.html('structure');
    if (observation) return observation;
    let s = `<svg class="fig-svg" viewBox="0 0 640 210">`;
    /* 左：四边形易变形 */
    s += txt(120, 26, '四边形 · 会变形', { fs: 13, fw: 900, fill: RED });
    s += `<rect x="40" y="60" width="140" height="100" fill="none" stroke="#e25563" stroke-width="3" stroke-dasharray="6 4"/>`;
    s += `<path d="M40,160 L180,160 L210,${160-Math.sqrt(100**2-30**2)} L70,${160-Math.sqrt(100**2-30**2)} Z" fill="none" stroke="#e25563" stroke-width="3"/>`;
    s += txt(120, 186, '一推就歪', { fs: 12, fill: MUT });
    /* 中：加斜杆变三角 */
    s += arrow(240, 110, 300, 110, TEAL);
    s += txt(270, 104, '加斜杆', { fs: 11, fill: TEAL });
    /* 右：三角形稳定 */
    s += txt(450, 26, '加斜杆 · 分成两个三角形', { fs: 13, fw: 900, fill: GREEN });
    s += `<path d="M380,160V60H520V160Z" fill="#e9f9f0" stroke="#2fbf71" stroke-width="3"/><path d="M380,160L520,60" stroke="${TEAL}" stroke-width="3"/>`;
    s += txt(450, 186, '杆件不伸缩，形状保持不变', { fs: 12, fill: MUT });
    /* 应用 */
    s += txt(320, 202, '这里假设杆长不变、接头可转；真实结构还要考虑材料和连接', { fs: 12, fill: MUT });
    return s + '</svg>';
  };

  /* ================= 三态与电路：说明独立于渲染 ================= */
  const DEMOS = typeof SCI_DEMOS === 'undefined' ? null : SCI_DEMOS;
  const STATE_ORDER = ['ice', 'water', 'vapor'];
  const escapeDemo = value => String(value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const unavailable = () => '<p class="sci-model-note">演示资料暂未加载，请先阅读下方知识要点。</p>';
  const sourcesHTML = key => '<details class="sci-demo-sources"><summary>看看资料出处（需联网）</summary>' +
    DEMOS.sources[key].map(source => `<a href="${escapeDemo(source.url)}" target="_blank" rel="noopener noreferrer">${escapeDemo(source.title)}</a>`).join('') + '</details>';
  const motionControls = () => '<div class="sci-motion-controls" hidden>' +
    '<div class="fig-ctrl"><button type="button" class="fig-btn" data-sci-motion="play" aria-pressed="false">播放示意</button>' +
    '<button type="button" class="fig-btn" data-sci-motion="step">前进一步</button>' +
    '<button type="button" class="fig-btn" data-sci-motion="reset">回到起点</button></div>' +
    '<p class="sci-motion-status" data-sci-motion-status role="status"></p></div>';
  const scrollHint = '<p class="sci-scroll-hint">↔ 图示可左右滑动查看，也可以聚焦图示后按左右键。</p>';
  const demoButton = (action, value, label) => `<button type="button" class="fig-btn" data-fig-act="${action}" data-v="${value}" aria-pressed="false">${escapeDemo(label)}</button>`;

  const demoStates = () => {
    if (!DEMOS) return unavailable();
    let s = scrollHint + '<div class="sci-demo-stage" tabindex="0" role="region" aria-label="水的三态微粒示意图，可横向滚动"><svg class="fig-svg" viewBox="0 0 640 170" role="img" aria-label="冰的微粒排列较整齐，水的微粒较靠近，水蒸气的微粒分散开">';
    DEMOS.states.forEach((state, i) => {
      const x = 24 + i * 206, cx = x + 86;
      s += `<rect data-state="${state.id}" x="${x}" y="14" width="172" height="118" rx="14" fill="#fafbfe" stroke="#e3e7f2" stroke-width="2"/>`;
      s += `<g data-sci-particles="${state.id}" data-cx="${cx}" aria-hidden="true">`;
      for (let j = 0; j < 9; j++) s += `<circle cx="${cx + (j % 3 - 1) * (i === 2 ? 50 : 24)}" cy="${72 + (Math.floor(j / 3) - 1) * (i === 2 ? 34 : 22)}" r="5.3" fill="${state.color}"/>`;
      s += '</g>';
      s += `<text class="state-name" data-state-name="${state.id}" x="${cx}" y="155" text-anchor="middle" font-size="15" font-weight="900" fill="${MUT}">${escapeDemo(state.name)}</text>`;
    });
    [[198, 228, '熔化', '凝固'], [404, 434, '汽化', '凝结']].forEach(([a, b, heat, cool]) => {
      s += arrow(a, 72, b, 72, ORANGE) + arrow(b, 96, a, 96, SKY);
      s += txt((a + b) / 2, 62, heat, {fs: 11, fill: ORANGE}) + txt((a + b) / 2, 114, cool, {fs: 11, fill: SKY});
    });
    return s + '</svg></div><div class="fig-ctrl">' +
      '<button type="button" class="fig-btn" data-fig-act="sci-state-cool">❄️ 冷却</button>' +
      DEMOS.states.map(state => demoButton('sci-state', state.id, state.name)).join('') +
      '<button type="button" class="fig-btn" data-fig-act="sci-state-heat">🔥 加热</button></div>' +
      '<p class="sci-observation sci-state-description" role="status"></p>' + motionControls() +
      `<p class="sci-model-note">${escapeDemo(DEMOS.stateModelNote)}</p><p class="sci-model-note">${escapeDemo(DEMOS.temperatureNote)}</p>` + sourcesHTML('states');
  };

  function statesApply(fig, key) {
    const state = DEMOS?.states.find(item => item.id === key);
    if (!state) return;
    window.SciDemoMotion?.pause(fig);
    fig.dataset.stateIdx = String(STATE_ORDER.indexOf(key));
    fig.querySelectorAll('rect[data-state]').forEach(rect => {
      const on = rect.dataset.state === key;
      rect.setAttribute('stroke', on ? state.color : '#e3e7f2');
      rect.setAttribute('stroke-width', on ? 3.5 : 2);
    });
    fig.querySelectorAll('.state-name').forEach(node => node.setAttribute('fill', node.dataset.stateName === key ? state.color : MUT));
    fig.querySelector('.sci-state-description').textContent = state.name + '：' + state.note + state.condition;
    fig.querySelectorAll('[data-fig-act="sci-state"]').forEach(button => {
      const on = button.dataset.v === key;
      button.classList.toggle('fig-on', on);
      button.setAttribute('aria-pressed', String(on));
    });
    fig.querySelector('[data-fig-act="sci-state-cool"]').disabled = key === 'ice';
    fig.querySelector('[data-fig-act="sci-state-heat"]').disabled = key === 'vapor';
    // 仅移动窄屏图示自身，保持整页位置和键盘焦点。
    const stage = fig.querySelector('.sci-demo-stage');
    if (stage.scrollWidth > stage.clientWidth) {
      const rect = fig.querySelector(`rect[data-state="${key}"]`).getBoundingClientRect();
      stage.scrollLeft += rect.left - stage.getBoundingClientRect().left - (stage.clientWidth - rect.width) / 2;
    }
  }

  /* 通断只取决于连接方式与开关；不模拟电阻或定量亮度。 */
  function circuitState(mode, one, two) {
    const lamps = mode === 'parallel' ? [one, two] : [one && two, one && two];
    const status = mode !== 'parallel' ? (lamps[0] ? 'seriesClosed' : 'seriesOpen')
      : lamps.every(Boolean) ? 'parallelBoth' : lamps.some(Boolean) ? 'parallelOne' : 'parallelNone';
    return {lamps, status};
  }
  const bulb = (x, y, lit, number) =>
    `<g data-sci-lamp="${number}" data-lit="${lit}"><circle cx="${x}" cy="${y}" r="16" fill="${lit ? '#ffd94d' : '#c9cdd9'}" stroke="${INK}" stroke-width="2.5"/>` +
    `<path d="M${x - 8} ${y - 8}l16 16m0 -16l-16 16" stroke="${INK}" stroke-width="1.6"/>` +
    txt(x, y + 34, `灯 ${number} · ${lit ? '亮' : '灭'}`, {fs: 13, fw: 800}) + '</g>';
  const battery = () =>
    `<path d="M70 65V123M106 78V110" stroke="${INK}" stroke-width="4"/>` +
    txt(88, 148, '电池', {fs: 13}) + txt(56, 56, '＋', {fs: 16, fill: RED}) + txt(120, 56, '－', {fs: 16, fill: BLUE});
  const wire = points => `<polyline points="${points}" fill="none" stroke="${INK}" stroke-width="2.5"/>`;
  const junction = (x, y) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${INK}"/>`;
  const switchAt = (x, y, closed, number) =>
    `<path d="M${x} ${y}L${x + (closed ? 56 : 50)} ${y - (closed ? 0 : 22)}" stroke="${INK}" stroke-width="3"/>` +
    `<circle cx="${x}" cy="${y}" r="4.5" fill="#fff" stroke="${INK}" stroke-width="2.5"/>` +
    `<circle cx="${x + 56}" cy="${y}" r="4.5" fill="#fff" stroke="${INK}" stroke-width="2.5"/>` +
    txt(x + 28, y - 30, `开关 ${number}`, {fs: 13, fw: 800, fill: closed ? GREEN : RED});
  const flow = (id, path, count) => `<g data-sci-flow="${id}" aria-hidden="true"><path d="${path}" fill="none" stroke="none"/>` +
    Array.from({length: count}, () => '<circle r="4" fill="#d86115" stroke="#fff" stroke-width="1" visibility="hidden"/>').join('') + '</g>';

  function circuitLayout(mode, one, two) {
    const {lamps} = circuitState(mode, one, two);
    if (mode !== 'parallel') return battery() +
      wire('106,94 284,94') + bulb(300, 94, lamps[0], 1) + wire('316,94 440,94') + switchAt(440, 94, one, 1) +
      wire('496,94 560,94 560,180 396,180') + bulb(380, 180, lamps[1], 2) + wire('364,180 266,180') +
      switchAt(210, 180, two, 2) + wire('210,180 70,180 70,94') +
      (lamps[0] ? flow('series', 'M70 94V180H560V94H106', 11) : '');
    return battery() + wire('106,94 220,94') + junction(220, 94) +
      wire('220,94 220,60 300,60') + bulb(316, 60, lamps[0], 1) + wire('332,60 370,60') + switchAt(370, 60, one, 1) + wire('426,60 460,60 460,94') +
      wire('220,94 220,145 300,145') + bulb(316, 145, lamps[1], 2) + wire('332,145 370,145') + switchAt(370, 145, two, 2) + wire('426,145 460,145 460,94') +
      junction(460, 94) + wire('460,94 560,94 560,200 70,200 70,94') +
      (lamps.some(Boolean) ? flow('positive', 'M70 94V200H560V94H460', 8) + flow('negative', 'M220 94H106', 2) : '') +
      (lamps[0] ? flow('branch-1', 'M460 94V60H220V94', 3) : '') +
      (lamps[1] ? flow('branch-2', 'M460 94V145H220V94', 3) : '');
  }
  const demoCircuit = () => {
    if (!DEMOS) return unavailable();
    return '<div class="fig-ctrl">' + DEMOS.circuits.map(item => demoButton('sci-circuit', item.id, item.name)).join('') +
      '</div><p class="sci-circuit-hint sci-model-note"></p>' + scrollHint +
      '<div class="sci-demo-stage" tabindex="0" role="region" aria-label="电路示意图，可横向滚动"><svg class="fig-svg" viewBox="0 0 640 230" role="img" aria-label="电池、两个灯泡和两个开关组成的电路"><g class="circuit-layout"></g></svg></div>' +
      '<div class="fig-ctrl">' + demoButton('sci-switch', '1', '开关 1') + demoButton('sci-switch', '2', '开关 2') + '</div>' +
      '<p class="sci-observation sci-circuit-status" role="status"></p>' + motionControls() +
      `<p class="sci-model-note">${escapeDemo(DEMOS.circuitModelNote)}</p>` + sourcesHTML('circuit');
  };
  function circuitApply(fig, key) {
    if (!DEMOS || !DEMOS.circuits.some(item => item.id === key)) return;
    window.SciDemoMotion?.pause(fig);
    if (key !== fig.dataset.circuitMode) {
      fig.dataset.circuitMode = key;
      fig.dataset.switchOne = String(key !== 'open');
      fig.dataset.switchTwo = 'true';
    }
    const one = fig.dataset.switchOne === 'true', two = fig.dataset.switchTwo === 'true';
    const {status} = circuitState(key, one, two);
    fig.querySelector('.circuit-layout').innerHTML = circuitLayout(key, one, two);
    fig.querySelector('.sci-circuit-hint').textContent = DEMOS.circuits.find(item => item.id === key).note;
    fig.querySelector('.sci-circuit-status').textContent = DEMOS.circuitStatus[status];
    fig.querySelectorAll('[data-fig-act="sci-circuit"]').forEach(button => {
      const on = button.dataset.v === key;
      button.classList.toggle('fig-on', on);
      button.setAttribute('aria-pressed', String(on));
    });
    fig.querySelectorAll('[data-fig-act="sci-switch"]').forEach(button => {
      const closed = button.dataset.v === '1' ? one : two;
      button.textContent = `开关 ${button.dataset.v}：${closed ? '闭合 · 点此断开' : '断开 · 点此闭合'}`;
      button.setAttribute('aria-pressed', String(closed));
      button.classList.toggle('fig-on', closed);
    });
    window.SciDemoMotion?.refresh(fig);
  }

  /* ---------- 注册表 ---------- */
  const REG = {
    'sci-method': method,
    'sci-measure': measure,
    'sci-air-space': airSpace,
    'sci-dissolve': dissolve,
    'sci-change': change,
    'sci-machine': machine,
    'sci-light-ray': lightRay,
    'sci-sound': sound,
    'sci-magnet': magnet,
    'sci-foodchain': foodchain,
    'sci-rock-soil': rockSoil,
    'sci-engineer': engineer,
    'sci-china-build': chinaBuild,
    'demo-sci-states': demoStates,
    'demo-sci-circuit': demoCircuit,
    /* 单元横幅 */
    'sci-bn-su1': bannerSu1,
    'sci-bn-su2': bannerSu2,
    'sci-bn-su3': bannerSu3,
    'sci-bn-su4': bannerSu4,
    'sci-bn-su5': bannerSu5,
    'sci-bn-su6': bannerSu6,
    'sci-bn-su7': bannerSu7,
    'sci-bn-su8': bannerSu8,
    /* 新增知识点图示 */
    'sci-safety': safety,
    'sci-properties': properties,
    'sci-gravity': gravity,
    'sci-friction': friction,
    'sci-reflect': reflect,
    'sci-rainbow': rainbow,
    'sci-sound-props': soundProps,
    'sci-static': staticElec,
    'sci-conductor': conductor,
    'sci-electromagnet': electromagnet,
    'sci-photo': photosynthesis,
    'sci-animal-class': animalClass,
    'sci-body': body,
    'sci-earth-layers': earthLayers,
    'sci-water-cycle': waterCycle,
    'sci-weather': weather,
    'sci-triangle': triangle,
  };

  const DEMO_INIT = {
    'demo-sci-states': { key: 'water', apply: statesApply, act: 'sci-state' },
    'demo-sci-circuit': { key: 'series', apply: circuitApply, act: 'sci-circuit' },
  };

  const DEFAULT_CAPS = {
    'sci-method': '科学探究六步曲：结论不理想就换个猜想再来一轮',
    'sci-measure': '三种常用测量工具：刻度尺、温度计、天平，数据后面要带单位',
    'demo-sci-states': '互动演示：点一个状态（或加热/冷却）看水的三态变化',
    'sci-air-space': '杯子压入水实验：纸团不湿，证明空气占据空间',
    'sci-dissolve': '分离三招：溶解要搅拌，过滤拦沙子，蒸发收结晶',
    'sci-change': '物理变化 vs 化学变化：关键看有没有新物质产生',
    'sci-machine': '三种简单机械：杠杆、滑轮、斜面，省力就要多走距离',
    'sci-light-ray': '光的直线传播：影子的成因与小孔成像',
    'sci-sound': '声音由振动产生：响度看振幅，音调看频率',
    'demo-sci-circuit': '互动演示：切换串联、并联、断路，看灯泡亮灭',
    'sci-magnet': '磁铁两极：同极相斥、异极相吸，指南针就是小磁针',
    'sci-foodchain': '食物链：稻谷 → 蝗虫 → 青蛙 → 蛇 → 鹰',
    'sci-rock-soil': '岩石与土壤分层：表层土最肥沃，毁掉容易恢复难',
    'sci-engineer': '工程设计六步曲：测试改进一轮又一轮',
    'sci-china-build': '中国超级工程：高铁、跨海大桥、天眼与北斗',
    /* 新增知识点图示说明 */
    'sci-safety': '实验安全四守则：听清再动手、不尝不闻、加热要小心、实验后洗手',
    'sci-properties': '物质的性质：颜色、气味、软硬、溶解性、透明度——区分物质的身份证',
    'sci-gravity': '重力竖直向下，浮力向上托；排开水越多浮力越大',
    'sci-friction': '摩擦力可大可小：花纹增摩擦，润滑油减摩擦；弹簧皮筋靠弹力',
    'sci-reflect': '光遇镜面反射（反射角=入射角），入水偏折（折射）使池水看起来更浅',
    'sci-rainbow': '白光经三棱镜色散成七色；物体颜色由它反射的色光决定',
    'sci-sound-props': '音调看振动频率（快慢），响度看振动幅度（大小），音色是声音指纹',
    'sci-static': '摩擦起电：同种电荷相斥，异种电荷相吸；脱毛衣噼啪是放电',
    'sci-conductor': '金属、人体、水是导体；塑料、橡胶、玻璃是绝缘体；安全用电记心中',
    'sci-electromagnet': '电磁铁=铁芯+线圈+电源：通电磁性强、断电磁性弱，应用广泛',
    'sci-photo': '光合作用：阳光+水+二氧化碳 → 养料+氧气，养活了几乎所有生物',
    'sci-animal-class': '动物分脊椎与无脊椎：鱼两栖爬鸟哺乳；蝙蝠是哺乳不是鸟',
    'sci-body': '人体五大系统：消化供能、呼吸供氧、循环运输、运动支撑、神经指挥',
    'sci-earth-layers': '地球四大圈层：大气圈、水圈、岩石圈、生物圈互相依存',
    'sci-water-cycle': '水循环：蒸发→凝结→降水→径流，淡水珍贵要节约',
    'sci-weather': '观测天气四工具 + 预警四色（蓝黄橙红）+ 灾害自护口诀',
    'sci-triangle': '杆长不变时，三角框架保持形状；加斜杆可把四边形分成两个三角形',
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
      if (act === 'sci-state') statesApply(fig, b.dataset.v);
      else if (act === 'sci-state-heat' || act === 'sci-state-cool') {
        const curNum = Number(fig.dataset.stateIdx);
        const cur = Number.isNaN(curNum) ? 1 : curNum;
        const next = act === 'sci-state-heat'
          ? Math.min(STATE_ORDER.length - 1, cur + 1)
          : Math.max(0, cur - 1);
        statesApply(fig, STATE_ORDER[next]);
      } else if (act === 'sci-circuit') {
        // 重新选模式也恢复该模式的起始开关，便于重复比较。
        delete fig.dataset.circuitMode;
        circuitApply(fig, b.dataset.v);
      } else if (act === 'sci-switch') {
        const key = b.dataset.v === '1' ? 'switchOne' : 'switchTwo';
        fig.dataset[key] = String(fig.dataset[key] !== 'true');
        circuitApply(fig, fig.dataset.circuitMode);
      }
    });
  }

  /* 初始化静态演示（渲染后无需再调用；委托自动工作） */
  if (typeof document !== 'undefined') {
    bindDelegates(document);
    const initIn = root => {
      root.querySelectorAll('.fig').forEach(fig => {
        window.SciProcess?.mount(fig);
        window.SciExperiments?.mount(fig);
        const id = fig.dataset.fig;
        const demo = DEMO_INIT[id];
        if (demo && !fig.dataset.init) {
          const btn = fig.querySelector('[data-fig-act="' + demo.act + '"][data-v="' + demo.key + '"]');
          demo.apply(fig, demo.key, btn);
          fig.dataset.init = '1';
          window.SciDemoMotion?.mount(fig);
        }
      });
    };
    const mo = new MutationObserver(muts => {
      window.SciDemoMotion?.prune();
      window.SciProcess?.prune();
      window.SciExperiments?.prune();
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
    figHTML, circuitState, circuitLayout,
    get FIG_IDS() { return Object.keys(REG); },
    has(id) { return Object.prototype.hasOwnProperty.call(REG, id); },
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SciFigures;
}
if (typeof window !== 'undefined') {
  window.SciFigures = SciFigures;
}

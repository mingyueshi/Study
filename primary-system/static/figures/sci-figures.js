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
    s += arrow(402, 108, 402, 84, BLUE);
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

  /* ================= 互动演示：水的三态变化 ================= */
  const STATES = {
    ice: {
      name: '冰（固态）',
      temp: '0℃ 以下',
      note: '水分子排得整整齐齐，冰有固定的形状，摸起来硬邦邦。',
      color: SKY,
    },
    water: {
      name: '水（液态）',
      temp: '0℃ ～ 100℃',
      note: '水分子可以滑来滑去，水会流动，没有固定形状，但体积不变。',
      color: BLUE,
    },
    vapor: {
      name: '水蒸气（气态）',
      temp: '100℃ 以上（标准大气压）',
      note: '水分子到处乱跑，飞散到空气里，看不见也摸不着。',
      color: ORANGE,
    },
  };
  const STATE_ORDER = ['ice', 'water', 'vapor'];

  const dot = (x, y, color) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${color}" opacity=".85"/>`;

  const particles = (kind, cx, cy) => {
    if (kind === 'ice') {
      let out = '';
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out += dot(cx - 24 + c * 24, cy - 22 + r * 22, SKY);
      return out;
    }
    if (kind === 'water') {
      return dot(cx - 20, cy - 12, BLUE) + dot(cx + 4, cy - 20, BLUE) + dot(cx + 22, cy - 4, BLUE) +
        dot(cx - 10, cy + 8, BLUE) + dot(cx + 14, cy + 16, BLUE) + dot(cx - 24, cy + 18, BLUE);
    }
    return dot(cx - 30, cy - 24, ORANGE) + dot(cx + 8, cy - 32, ORANGE) + dot(cx + 30, cy - 8, ORANGE) +
      dot(cx - 12, cy + 2, ORANGE) + dot(cx - 34, cy + 22, ORANGE) + dot(cx + 18, cy + 28, ORANGE);
  };

  const demoStates = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 178">`;
    STATE_ORDER.forEach((k, i) => {
      const x = 24 + i * 206;
      s += `<rect data-state="${k}" x="${x}" y="14" width="172" height="118" rx="14" fill="#fafbfe" stroke="#e3e7f2" stroke-width="2"/>`;
      s += particles(k, x + 86, 62);
      s += `<text class="state-name" data-state-name="${k}" x="${x + 86}" y="152" text-anchor="middle" font-size="14.5" font-weight="900" fill="${MUT}">${STATES[k].name}</text>`;
    });
    s += arrow(198, 72, 228, 72, ORANGE);
    s += arrow(228, 96, 198, 96, SKY);
    s += arrow(404, 72, 434, 72, ORANGE);
    s += arrow(434, 96, 404, 96, SKY);
    s += txt(213, 62, '熔化', { fs: 11, fill: ORANGE });
    s += txt(213, 114, '凝固', { fs: 11, fill: SKY });
    s += txt(419, 62, '汽化', { fs: 11, fill: ORANGE });
    s += txt(419, 114, '凝结', { fs: 11, fill: SKY });
    s += `<text class="state-temp" x="320" y="172" text-anchor="middle" font-size="12.5" font-weight="700" fill="${MUT}"></text>`;
    return s + '</svg>' +
      `<div class="fig-ctrl">` +
      `<button class="fig-btn" data-fig-act="sci-state-cool">❄️ 冷却降温</button>` +
      `<button class="fig-btn" data-fig-act="sci-state" data-v="ice">冰</button>` +
      `<button class="fig-btn" data-fig-act="sci-state" data-v="water">水</button>` +
      `<button class="fig-btn" data-fig-act="sci-state" data-v="vapor">水蒸气</button>` +
      `<button class="fig-btn" data-fig-act="sci-state-heat">🔥 加热升温</button>` +
      `</div>`;
  };

  function statesApply(fig, key) {
    if (!STATES[key]) return;
    fig.dataset.stateIdx = String(STATE_ORDER.indexOf(key));
    fig.querySelectorAll('rect[data-state]').forEach(r => {
      const on = r.dataset.state === key;
      r.setAttribute('stroke', on ? STATES[key].color : '#e3e7f2');
      r.setAttribute('stroke-width', on ? 3.5 : 2);
    });
    fig.querySelectorAll('.state-name').forEach(t => {
      t.setAttribute('fill', t.dataset.stateName === key ? STATES[key].color : MUT);
    });
    const info = fig.parentElement.querySelector('.fig-note');
    if (info) info.textContent = STATES[key].name + '：' + STATES[key].note;
    const temp = fig.querySelector('.state-temp');
    if (temp) temp.textContent = '温度：' + STATES[key].temp;
    fig.querySelectorAll('[data-fig-act="sci-state"]').forEach(b =>
      b.classList.toggle('fig-on', b.dataset.v === key));
  }

  /* ================= 互动演示：电路串联并联 ================= */
  const CIRCUIT = {
    series: { name: '串联电路', note: '电流只有一条路：一处断，处处断，一灯灭全灭。' },
    parallel: { name: '并联电路', note: '电流有多条路：各走各的，关一个另一个照样亮。' },
    open: { name: '断路', note: '开关断开或线松了，电流走不动，灯全都不亮。' },
  };
  const LIT = '#ffd94d';
  const DIM = '#c9cdd9';

  const bulb = (x, y, lit) =>
    `<circle cx="${x}" cy="${y}" r="16" fill="${lit ? LIT : DIM}" stroke="${INK}" stroke-width="2.5"/>` +
    `<line x1="${x - 8}" y1="${y - 8}" x2="${x + 8}" y2="${y + 8}" stroke="${INK}" stroke-width="1.6"/>` +
    `<line x1="${x + 8}" y1="${y - 8}" x2="${x - 8}" y2="${y + 8}" stroke="${INK}" stroke-width="1.6"/>`;

  const battery = () =>
    `<line x1="70" y1="70" x2="70" y2="118" stroke="${INK}" stroke-width="4"/>` +
    `<line x1="88" y1="58" x2="88" y2="130" stroke="${INK}" stroke-width="9"/>` +
    `<line x1="106" y1="70" x2="106" y2="118" stroke="${INK}" stroke-width="4"/>` +
    txt(79, 152, '电池', { fs: 12 }) +
    txt(56, 62, '＋', { fs: 12, fill: RED }) +
    txt(120, 62, '－', { fs: 12, fill: BLUE });

  const wire = pts => `<polyline points="${pts}" fill="none" stroke="${INK}" stroke-width="2.5"/>`;
  const junction = (x, y) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${INK}"/>`;

  /* 接触点 + 开关闸刀：closed 时闸刀水平连通，open 时斜起 */
  const switchAt = (x, y, closed) => {
    const lever = closed
      ? `<line x1="${x}" y1="${y}" x2="${x + 56}" y2="${y}" stroke="${INK}" stroke-width="3"/>`
      : `<line x1="${x}" y1="${y}" x2="${x + 50}" y2="${y - 22}" stroke="${INK}" stroke-width="3"/>`;
    return `<circle cx="${x}" cy="${y}" r="4.5" fill="#fff" stroke="${INK}" stroke-width="2.5"/>` +
      `<circle cx="${x + 56}" cy="${y}" r="4.5" fill="#fff" stroke="${INK}" stroke-width="2.5"/>` + lever;
  };

  /* 主回路：电池 → 顶边（灯泡＋开关）→ 右边 → 底边（灯泡）→ 左边回电池 */
  const loopLayout = (lit, closed) =>
    battery() +
    wire('106,94 284,94') + bulb(300, 94, lit) + wire('316,94 440,94') +
    switchAt(440, 94, closed) +
    wire('496,94 560,94 560,180 380,180') +
    bulb(380, 180, lit) +
    wire('344,180 70,180 70,94');

  const parallelLayout = () =>
    battery() +
    wire('106,94 220,94') + junction(220, 94) +
    /* 上支路 */
    wire('220,94 220,60 300,60') + bulb(316, 60, true) + wire('332,60 460,60 460,94') +
    /* 下支路 */
    wire('220,94 220,150 300,150') + bulb(316, 150, true) + wire('332,150 460,150 460,94') +
    junction(460, 94) +
    /* 回电池 */
    wire('460,94 560,94 560,180 70,180 70,94');

  const circuitLayout = mode => {
    if (mode === 'parallel') return parallelLayout();
    if (mode === 'open') return loopLayout(false, false) +
      txt(468, 56, '开关（断开）', { fs: 11.5, fill: RED });
    return loopLayout(true, true) +
      txt(468, 56, '开关（闭合）', { fs: 11.5, fill: GREEN });
  };

  const demoCircuit = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 208">`;
    s += `<g class="circuit-layout"></g>`;
    s += `<text class="circuit-title" x="320" y="30" text-anchor="middle" font-size="16" font-weight="900" fill="${INK}"></text>`;
    s += `<text class="circuit-note" x="320" y="204" text-anchor="middle" font-size="12.5" font-weight="600" fill="#4a4f63"></text>`;
    return s + '</svg>' +
      `<div class="fig-ctrl">` +
      Object.keys(CIRCUIT).map(k => `<button class="fig-btn" data-fig-act="sci-circuit" data-v="${k}">${CIRCUIT[k].name}</button>`).join('') +
      `</div>`;
  };

  function circuitApply(fig, key, btn) {
    if (!CIRCUIT[key]) return;
    const g = fig.querySelector('.circuit-layout');
    if (g) g.innerHTML = circuitLayout(key);
    const title = fig.querySelector('.circuit-title');
    const note = fig.querySelector('.circuit-note');
    if (title) title.textContent = CIRCUIT[key].name;
    if (note) note.textContent = CIRCUIT[key].note;
    fig.querySelectorAll('[data-fig-act="sci-circuit"]').forEach(b => b.classList.toggle('fig-on', b === btn));
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
      if (act === 'sci-state') statesApply(fig, b.dataset.v);
      else if (act === 'sci-state-heat' || act === 'sci-state-cool') {
        const curNum = Number(fig.dataset.stateIdx);
        const cur = Number.isNaN(curNum) ? 1 : curNum;
        const next = act === 'sci-state-heat'
          ? Math.min(STATE_ORDER.length - 1, cur + 1)
          : Math.max(0, cur - 1);
        statesApply(fig, STATE_ORDER[next]);
      } else if (act === 'sci-circuit') circuitApply(fig, b.dataset.v, b);
    });
  }

  /* 初始化静态演示（渲染后无需再调用；委托自动工作） */
  if (typeof document !== 'undefined') {
    bindDelegates(document);
    const initIn = root => {
      root.querySelectorAll('.fig').forEach(fig => {
        const id = fig.dataset.fig;
        const demo = DEMO_INIT[id];
        if (demo && !fig.dataset.init) {
          const btn = fig.querySelector('[data-fig-act="' + demo.act + '"][data-v="' + demo.key + '"]');
          demo.apply(fig, demo.key, btn);
          fig.dataset.init = '1';
        }
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
  module.exports = { FIG_IDS: SciFigures.FIG_IDS, has: SciFigures.has };
}
if (typeof window !== 'undefined') {
  window.SciFigures = SciFigures;
}

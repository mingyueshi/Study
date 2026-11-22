/* ============================================================
   乐学堂 · 物质实验室 —— 图示库（化学启蒙专属）
   - 纯 SVG 插图，离线可用，打印友好
   - pH 调色卡与反应观察表为内置互动组件
   - 分段观察（溶解/过滤/燃烧）复用 sci-process 播放器
   - 数据里用 fig: 'matter-xxx' / 'process-xxx' 引用
   ============================================================ */
'use strict';

const MatterFigures = (() => {
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
  const PINK = '#e0526d';

  /* ---------- 小工具 ---------- */
  const txt = (x, y, s, opt = {}) =>
    `<text x="${x}" y="${y}" fill="${opt.fill || INK}" font-size="${opt.fs || 14}"` +
    ` font-weight="${opt.fw || 700}" text-anchor="${opt.anchor || 'middle'}"` +
    (opt.cls ? ` class="${opt.cls}"` : '') + `>${s}</text>`;
  const arrow = (d, color = MUT, width = 3) =>
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" marker-end="url(#mfig-arrow)"/>`;
  const card = (x, y, w, h, fill, stroke) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${fill}" stroke="${stroke || 'none'}" stroke-width="2"/>`;
  const DEFS = `<defs><marker id="mfig-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${MUT}"/></marker></defs>`;

  /* ---------- 横幅 ---------- */
  const banner = (emoji, name, color) => {
    const light = color + '26';
    return `<svg class="fig-svg" viewBox="0 0 640 110" role="img" aria-label="${name}横幅">` +
      `<rect width="640" height="110" rx="16" fill="${light}"/>` +
      `<circle cx="590" cy="24" r="34" fill="${color}" opacity=".18"/>` +
      `<circle cx="60" cy="88" r="26" fill="${color}" opacity=".14"/>` +
      `<circle cx="530" cy="86" r="10" fill="${color}" opacity=".2" class="mt-float"/>` +
      `<circle cx="118" cy="30" r="7" fill="${color}" opacity=".22" class="mt-float mt-d2"/>` +
      `<text x="56" y="72" font-size="52">${emoji}</text>` +
      txt(124, 66, name, {fill: color, fs: 30, fw: 900, anchor: 'start'}) + '</svg>';
  };
  const bannerMu1 = () => banner('🌡️', '三态进阶 · 六条变化路', SKY);
  const bannerMu2 = () => banner('🧂', '溶解分离 · 把东西请回来', TEAL);
  const bannerMu3 = () => banner('🥬', '酸碱显色 · 让颜色当裁判', PURPLE);
  const bannerMu4 = () => banner('⚗️', '反应观察 · 新物质出现了吗', ORANGE);
  const bannerMu5 = () => banner('🔬', '元素探秘 · 万物的积木', PINK);

  /* ================= 第一实验室 ================= */

  /* 状态变化的六条路 */
  const sixChanges = () => {
    const box = (x, emoji, label) => card(x, 150, 120, 70, '#fff', LINE) +
      `<text x="${x + 60}" y="186" font-size="26" text-anchor="middle">${emoji}</text>` +
      txt(x + 60, 210, label);
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="固液气三态之间的六条变化路">` + DEFS +
      box(40, '🧊', '固态（冰）') + box(260, '💧', '液态（水）') + box(480, '💨', '气态（水蒸气）') +
      arrow('M100 152Q160 106 258 148', ORANGE) + txt(178, 102, '熔化 · 吸热', {fill: ORANGE, fs: 13}) +
      arrow('M258 222Q160 268 102 224', SKY) + txt(178, 284, '凝固 · 放热', {fill: SKY, fs: 13}) +
      arrow('M380 150Q440 104 478 146', ORANGE) + txt(430, 100, '汽化 · 吸热', {fill: ORANGE, fs: 13}) +
      arrow('M478 224Q440 272 382 226', SKY) + txt(430, 288, '液化 · 放热', {fill: SKY, fs: 13}) +
      arrow('M92 146Q300 26 490 146', ORANGE) + txt(292, 40, '升华 · 吸热（不经过液态）', {fill: ORANGE, fs: 13.5}) +
      arrow('M486 230Q300 316 96 230', SKY) + txt(292, 322, '凝华 · 放热（不经过液态）', {fill: SKY, fs: 13.5}) +
      '</svg>';
  };

  /* 谁吸热谁放热 */
  const heatFlow = () => {
    const step = (y, emoji, label) => card(60, y, 150, 62, '#fff', LINE) +
      `<text x="90" y="${y + 40}" font-size="24" text-anchor="middle">${emoji}</text>` +
      txt(178, y + 40, label, {anchor: 'start'});
    const tag = (x, y, s, color) => `<rect x="${x}" y="${y}" width="120" height="30" rx="15" fill="${color}1c"/>` +
      txt(x + 60, y + 21, s, {fill: color, fs: 13});
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="固液气阶梯：往上吸热，往下放热">` + DEFS +
      step(258, '🧊', '固态（冰）') + step(148, '💧', '液态（水）') + step(38, '💨', '气态（水蒸气）') +
      arrow('M135 256Q92 200 132 214', ORANGE, 3.5) + arrow('M135 146Q92 90 132 104', ORANGE, 3.5) +
      arrow('M135 212Q92 268 132 254', SKY, 3.5) + arrow('M135 102Q92 148 132 146', SKY, 3.5) +
      txt(40, 130, '吸', {fill: ORANGE, fs: 16}) + txt(40, 240, '放', {fill: SKY, fs: 16}) +
      tag(320, 60, '汽化 · 吸热', ORANGE) + tag(320, 108, '熔化 · 吸热', ORANGE) + tag(320, 156, '升华 · 吸热', ORANGE) +
      tag(320, 204, '液化 · 放热', SKY) + tag(320, 252, '凝固 · 放热', SKY) + tag(320, 300, '凝华 · 放热', SKY) +
      txt(470, 92, '温度不变也吸热：', {anchor: 'start', fs: 13.5}) +
      txt(470, 114, '冰熔化停在 0℃', {anchor: 'start', fs: 13.5, fill: MUT}) +
      txt(470, 136, '水沸腾停在沸点', {anchor: 'start', fs: 13.5, fill: MUT}) +
      txt(470, 172, '化雪的天气更冷——', {anchor: 'start', fs: 13.5}) +
      txt(470, 194, '雪从周围吸热', {anchor: 'start', fs: 13.5, fill: MUT}) +
      txt(470, 230, '出汗吹风更凉——', {anchor: 'start', fs: 13.5}) +
      txt(470, 252, '蒸发带走热量', {anchor: 'start', fs: 13.5, fill: MUT}) +
      '</svg>';
  };

  /* 蒸发和沸腾 */
  const evapBoil = () => {
    const beaker = (x, waterTop) => `<path d="M${x} 100V270H${x + 150}V100" fill="none" stroke="#7d93a8" stroke-width="5"/>` +
      `<rect x="${x + 4}" y="${waterTop}" width="142" height="${270 - waterTop - 2}" fill="#bfe3f7"/>` +
      `<line x1="${x + 4}" y1="${waterTop}" x2="${x + 146}" y2="${waterTop}" stroke="#7fb6d8" stroke-width="3"/>`;
    const vapor = x => `<g fill="#9fc9de" opacity=".8"><circle cx="${x + 40}" cy="78" r="5"/><circle cx="${x + 76}" cy="62" r="6"/><circle cx="${x + 110}" cy="76" r="5"/></g>`;
    const bubble = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#7fb6d8" stroke-width="2.5"/>`;
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="蒸发与沸腾的比较">` + DEFS +
      beaker(80, 160) + vapor(80) +
      txt(155, 92, '慢慢上升', {fs: 12.5, fill: MUT}) +
      txt(155, 128, '蒸发', {fs: 18, fill: TEAL}) + txt(155, 152, '约 30℃', {fs: 13, fill: MUT}) +
      txt(155, 300, '只发生在液体表面', {fs: 13.5}) + txt(155, 322, '任何温度都在进行', {fs: 13.5, fill: MUT}) +
      beaker(410, 160) + vapor(410) +
      bubble(470, 240, 8) + bubble(505, 220, 10) + bubble(535, 245, 7) + bubble(488, 195, 9) + bubble(520, 175, 7) +
      txt(485, 128, '沸腾', {fs: 18, fill: ORANGE}) + txt(485, 152, '约 100℃（水）', {fs: 13, fill: MUT}) +
      txt(485, 300, '内部和表面一起翻滚', {fs: 13.5}) + txt(485, 322, '要达到沸点才持续', {fs: 13.5, fill: MUT}) +
      txt(320, 40, '同样是汽化，两条不同的路', {fs: 16}) +
      txt(320, 64, '高原水不到 100℃ 就开——气压低，沸点低', {fs: 13, fill: MUT}) +
      '</svg>';
  };

  /* 生活现象对号入座 */
  const lifeStates = () => {
    const item = (x, y, emoji, title, route, color) => card(x, y, 290, 120, '#fff', LINE) +
      `<text x="${x + 34}" y="${y + 52}" font-size="30">${emoji}</text>` +
      txt(x + 66, y + 48, title, {anchor: 'start', fs: 16}) +
      `<rect x="${x + 20}" y="${y + 72}" width="250" height="32" rx="16" fill="${color}1c"/>` +
      txt(x + 145, y + 93, route, {fill: color, fs: 13});
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="四个生活现象的状态变化归属">` +
      item(20, 26, '❄️', '冬夜窗上的冰花', '水蒸气 → 小冰晶 · 凝华', SKY) +
      item(330, 26, '🌫️', '清晨的雾和露水', '水蒸气 → 小水滴 · 液化', TEAL) +
      item(20, 186, '🧊', '干冰舞台「烟雾」', '干冰升华 + 水汽液化', PURPLE) +
      item(330, 186, '🥤', '冰瓶外壁的水珠', '空气水汽遇冷 · 液化', SKY) +
      '</svg>';
  };

  /* ================= 第二实验室 ================= */

  /* 溶质、溶剂与溶液 */
  const solutions = () => {
    const cup = (x, color, emoji, label) => `<path d="M${x} 120V210H${x + 120}V120" fill="none" stroke="#7d93a8" stroke-width="5"/>` +
      `<rect x="${x + 4}" y="150" width="112" height="56" fill="${color}"/>` +
      `<text x="${x + 60}" y="186" font-size="24" text-anchor="middle">${emoji}</text>` +
      txt(x + 60, 238, label, {fs: 14});
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="溶质加溶剂得到溶液，油水分层是浊液">` + DEFS +
      cup(50, '#f3f6f9', '🧂', '食盐（溶质）') + cup(250, '#a5d5ee', '💧', '水（溶剂）') + cup(460, '#c2dfee', '🥛', '盐水（溶液）') +
      arrow('M176 166H240', MUT) + arrow('M376 166H448', MUT) +
      txt(170, 270, '＋', {fs: 20}) + txt(414, 270, '＝', {fs: 20}) +
      txt(320, 300, '溶液：均匀、透明、放多久都不沉底', {fs: 14.5}) +
      `<rect x="90" y="304" width="460" height="28" rx="14" fill="#fdeaea"/>` +
      txt(320, 323, '食用油＋水＝分层浊液：合不来的不叫溶解', {fs: 13, fill: '#a4453f'}) +
      '</svg>';
  };

  /* 蒸发结晶 */
  const evaporate = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="蒸发皿加热盐水，水分跑掉盐结晶">` + DEFS +
    `<path d="M220 150h200l-24 96q-2 14-18 14H262q-16 0-18-14Z" fill="#e8edf4" stroke="#7d93a8" stroke-width="4"/>` +
    `<rect x="248" y="168" width="144" height="66" fill="#c2dfee"/>` +
    `<circle cx="290" cy="226" r="6" fill="#fff" stroke="#9fb0c0" stroke-width="2"/>` +
    `<circle cx="318" cy="230" r="5" fill="#fff" stroke="#9fb0c0" stroke-width="2"/>` +
    `<circle cx="346" cy="224" r="6" fill="#fff" stroke="#9fb0c0" stroke-width="2"/>` +
    `<path d="M296 156q-8 -14 0 -26q8 -12 0 -24M340 156q-8 -14 0 -26q8 -12 0 -24" fill="none" stroke="#9fc9de" stroke-width="3"/>` +
    txt(320, 88, '水蒸气跑掉了', {fs: 13, fill: MUT}) +
    `<path d="M286 264q-6 26 14 34M354 264q6 26-14 34" stroke="#e25563" stroke-width="5" fill="none"/>` +
    txt(320, 316, '小火慢蒸：快干时收火，靠余温收尾', {fs: 13.5}) +
    txt(90, 190, '盐水', {fs: 15}) + txt(90, 220, '加热', {fs: 13, fill: MUT}) +
    txt(540, 190, '晶体', {fs: 15, fill: TEAL}) + txt(540, 220, '留下', {fs: 13, fill: MUT}) +
    arrow('M128 176H212', MUT) + arrow('M430 176H506', TEAL) +
    '</svg>';

  /* ================= 第三实验室 ================= */

  /* 生活中的酸和碱 */
  const acidBaseLife = () => {
    const chip = (x, y, emoji, label) => `<rect x="${x}" y="${y}" width="250" height="44" rx="12" fill="#fff" stroke="${LINE}"/>` +
      `<text x="${x + 24}" y="${y + 30}" font-size="20" text-anchor="middle">${emoji}</text>` +
      txt(x + 130, y + 29, label, {fs: 13.5, anchor: 'middle'});
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="生活里的酸性和碱性物品">` +
      `<rect x="20" y="20" width="290" height="300" rx="16" fill="#fdecec"/>` +
      `<rect x="330" y="20" width="290" height="300" rx="16" fill="#e8f1fd"/>` +
      txt(165, 54, '酸性 🍋', {fill: RED, fs: 17}) + txt(475, 54, '碱性 🧼', {fill: BLUE, fs: 17}) +
      chip(40, 74, '🍋', '柠檬汁 · pH 约 2') + chip(40, 126, '🍶', '白醋 · pH 约 3') + chip(40, 178, '🥛', '酸奶 · 乳酸') +
      chip(350, 74, '🥄', '小苏打水 · 弱碱') + chip(350, 126, '🧼', '肥皂水 · pH 约 9～10') + chip(350, 178, '🧽', '炉具清洁剂 · 强碱 ⚠️') +
      txt(165, 260, '食物里的弱酸可以吃', {fs: 13, fill: '#a4453f'}) +
      txt(165, 286, '实验室药品一律不尝', {fs: 13, fill: '#a4453f'}) +
      txt(475, 260, '强碱有腐蚀性，别碰皮肤', {fs: 13, fill: '#2b5f8f'}) +
      txt(475, 286, '摸起来滑腻像洗洁精', {fs: 13, fill: '#2b5f8f'}) +
      txt(320, 336, '判断酸碱靠指示剂，不靠舌头', {fs: 14}) +
      '</svg>';
  };

  /* 指示剂 */
  const indicator = () => {
    const cupShow = (x, color, title, sub, emoji) => `<path d="M${x} 110V230H${x + 150}V110" fill="none" stroke="#7d93a8" stroke-width="5"/>` +
      `<rect x="${x + 4}" y="146" width="142" height="80" fill="${color}"/>` +
      `<text x="${x + 75}" y="196" font-size="26" text-anchor="middle">${emoji}</text>` +
      txt(x + 75, 262, title, {fs: 15.5}) + txt(x + 75, 288, sub, {fs: 13, fill: MUT});
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="紫甘蓝汁遇酸变红、中性紫色、遇碱蓝绿">` +
      txt(320, 44, '紫甘蓝汁裁判的三种哨声', {fs: 17}) +
      cupShow(50, '#d3626b', '遇酸 → 变红', '柠檬汁、白醋', '🔴') +
      cupShow(245, '#a67cc8', '中性 → 保持紫', '清水、盐水、糖水', '🟣') +
      cupShow(440, '#4fae9e', '遇碱 → 变蓝绿', '肥皂水、小苏打水', '🟢') +
      txt(320, 318, '石蕊试液也一样：酸红碱蓝', {fs: 14}) +
      txt(320, 336, '指示剂只报酸碱，不报强弱——强弱看 pH', {fs: 13, fill: MUT}) +
      '</svg>';
  };

  /* 中和反应 */
  const neutralize = () => {
    const drop = (x, color) => `<circle cx="${x}" cy="120" r="34" fill="${color}"/>`;
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="酸和碱中和生成盐和水">` + DEFS +
      drop(140, '#f2b7bc') + drop(500, '#a9c8ea') +
      txt(140, 126, '酸', {fs: 18, fill: '#a4453f'}) + txt(500, 126, '碱', {fs: 18, fill: '#2b5f8f'}) +
      arrow('M186 120H262', MUT) + arrow('M454 120H378', MUT) +
      card(288, 78, 66, 84, '#d9ecd4', GREEN) +
      txt(321, 116, '盐', {fs: 16}) + txt(321, 140, '＋水', {fs: 13}) +
      txt(320, 208, '中和：酸和碱互相抵消，常常悄悄发生', {fs: 15}) +
      `<rect x="60" y="236" width="520" height="84" rx="14" fill="#f4f8fd"/>` +
      txt(90, 266, '生活里的中和：', {anchor: 'start', fs: 13.5}) +
      txt(90, 292, '胃酸过多 → 抗酸药；酸性土壤 → 撒熟石灰；蚊虫叮咬 → 涂肥皂水', {anchor: 'start', fs: 13.5, fill: MUT}) +
      txt(90, 312, '判断中和到什么程度 → 请指示剂帮忙', {anchor: 'start', fs: 13.5, fill: MUT}) +
      '</svg>';
  };

  /* ================= 第四实验室 ================= */

  /* 物理变化 vs 化学变化 */
  const changeCompare = () => {
    const row = (x, y, emoji, text) => `<text x="${x + 16}" y="${y + 14}" font-size="15">${emoji}</text>` +
      txt(x + 40, y + 18, text, {anchor: 'start', fs: 13});
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="物理变化与化学变化的比较">` +
      `<rect x="20" y="20" width="290" height="300" rx="16" fill="#eef7f3"/>` +
      `<rect x="330" y="20" width="290" height="300" rx="16" fill="#fdf1ea"/>` +
      txt(165, 56, '物理变化', {fill: TEAL, fs: 18}) + txt(475, 56, '化学变化', {fill: ORANGE, fs: 18}) +
      txt(165, 84, '没有新物质', {fs: 13, fill: MUT}) + txt(475, 84, '诞生了新物质', {fs: 13, fill: MUT}) +
      row(30, 110, '🧊', '冰化成水——还是水') + row(30, 146, '🍬', '糖溶进水——还在水里') + row(30, 182, '📄', '纸折成飞机——还是纸') + row(30, 218, '⚡', '灯丝发光发热——没变新物质') +
      row(340, 110, '⚙️', '铁生锈——变成铁锈') + row(340, 146, '🔥', '燃烧——生成二氧化碳和水') + row(340, 182, '🍶', '醋＋小苏打——冒出二氧化碳') + row(340, 218, '🍬', '糖烧焦——变出新物质') +
      `<rect x="40" y="248" width="250" height="30" rx="15" fill="#dcefe6"/>` +
      txt(165, 268, '形态、位置、状态在变', {fs: 12.5, fill: TEAL}) +
      `<rect x="350" y="248" width="250" height="30" rx="15" fill="#fbe3d3"/>` +
      txt(475, 268, '成分变了，回不去原来的样子', {fs: 12.5, fill: '#a4502b'}) +
      txt(320, 312, '判断标准只有一个：有没有新物质诞生', {fs: 14.5}) +
      txt(320, 332, '两类变化常一起发生：蜡烛熔化是物理，蜡烛燃烧是化学', {fs: 12.5, fill: MUT}) +
      '</svg>';
  };

  /* 醋与小苏打 */
  const vinegarSoda = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="白醋倒进小苏打冒出二氧化碳气泡">` + DEFS +
    `<path d="M120 90V270H300V90" fill="none" stroke="#7d93a8" stroke-width="5"/>` +
    `<rect x="124" y="170" width="172" height="96" fill="#e9e4c2"/>` +
    `<g fill="#fff" stroke="#c9c39a" stroke-width="2">` +
    '<circle cx="160" cy="240" r="8"/><circle cx="196" cy="230" r="11"/><circle cx="234" cy="242" r="8"/><circle cx="266" cy="228" r="9"/><circle cx="178" cy="210" r="7"/><circle cx="214" cy="204" r="9"/><circle cx="248" cy="212" r="6"/></g>' +
    `<path d="M330 60h150l-20 34h-110Z" fill="#e9e4c2" stroke="#b0a884" stroke-width="2"/>` +
    arrow('M405 96Q400 130 380 168', MUT) +
    txt(405, 48, '白醋（酸）', {fs: 14}) +
    txt(210, 76, '小苏打（碱式盐）', {fs: 14}) +
    txt(210, 300, '白泡＝二氧化碳', {fs: 14.5, fill: '#a4453f'}) +
    txt(210, 322, '杯壁微微变凉——反应吸热', {fs: 13, fill: MUT}) +
    `<rect x="380" y="150" width="220" height="120" rx="14" fill="#fff" stroke="${LINE}"/>` +
    txt(490, 180, '安全三条', {anchor: 'middle', fs: 14, fill: ORANGE}) +
    txt(396, 206, '· 敞口杯里做', {anchor: 'start', fs: 13}) +
    txt(396, 228, '· 用量要少', {anchor: 'start', fs: 13}) +
    txt(396, 250, '· 脸别凑近杯口', {anchor: 'start', fs: 13}) +
    '</svg>';

  /* 铁生锈 */
  const rust = () => {
    const tube = (x, fill, label, sub, rusty, color) => `<rect x="${x}" y="80" width="90" height="170" rx="14" fill="${fill}" stroke="#7d93a8" stroke-width="3"/>` +
      (rusty ? `<circle cx="${x + 30}" cy="${140 + rusty * 18}" r="7" fill="#b06a3b"/><circle cx="${x + 58}" cy="${150 + rusty * 14}" r="6" fill="#b06a3b"/><circle cx="${x + 44}" cy="${126 + rusty * 16}" r="5" fill="#c97a45"/>` : '') +
      `<rect x="${x + 12}" y="228" width="20" height="10" rx="3" fill="#8a939e"/>` +
      txt(x + 45, 62, label, {fs: 13.5, fill: color}) + txt(x + 45, 278, sub, {fs: 12.5, fill: MUT});
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="三支试管比较铁钉生锈条件">` +
      txt(320, 40, '三枚一样的铁钉，只改变一个条件', {fs: 16}) +
      tube(70, '#f3ede2', '① 干燥空气', '几天都不生锈', 0, TEAL) +
      tube(280, '#cfe8f5', '② 清水浸泡', '几天后长出锈点', 2, ORANGE) +
      tube(490, '#dbe9f7', '③ 盐水浸泡', '锈得更快更多', 4, '#a4453f') +
      `<rect x="60" y="296" width="520" height="36" rx="14" fill="#fdeaea"/>` +
      txt(320, 320, '防锈＝拆条件：刷漆、涂油、保持干燥；铁锈疏松，保护不了里面的铁', {fs: 13, fill: '#a4453f'}) +
      '</svg>';
  };

  /* ================= 第五实验室 ================= */

  /* 东西由什么组成 */
  const madeOf = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="水分子由两个氢原子和一个氧原子组成">` + DEFS +
    card(40, 110, 170, 120, '#e8f4fb', '#bfdcf0') +
    txt(125, 160, '一杯水', {fs: 16}) + txt(125, 190, 'H₂O', {fs: 20, fill: SKY}) +
    arrow('M216 170H276', MUT) +
    `<circle cx="340" cy="170" r="34" fill="#e25563"/>` + txt(340, 176, 'O', {fs: 18, fill: '#fff'}) +
    `<circle cx="296" cy="132" r="20" fill="#fff" stroke="#8497a9" stroke-width="2.5"/>` + txt(296, 138, 'H', {fs: 13}) +
    `<circle cx="384" cy="132" r="20" fill="#fff" stroke="#8497a9" stroke-width="2.5"/>` + txt(384, 138, 'H', {fs: 13}) +
    txt(340, 232, '1 个水分子', {fs: 14}) +
    txt(340, 258, '2 个氢原子 ＋ 1 个氧原子', {fs: 13, fill: MUT}) +
    `<rect x="470" y="110" width="150" height="120" rx="14" fill="#fdf1ea"/>` +
    txt(545, 146, '元素＝积木', {fs: 14.5, fill: ORANGE}) +
    txt(545, 174, '100 多种元素', {fs: 13}) +
    txt(545, 198, '搭出千万种物质', {fs: 13}) +
    txt(320, 314, '反应前后元素不生不灭：铁生锈是铁和氧「搭」在一起', {fs: 14}) +
    '</svg>';

  /* 元素符号卡 */
  const symbols = () => {
    const cell = (x, sym, zh, no, latin) => card(x, 100, 92, 110, '#fff', LINE) +
      txt(x + 46, 124, String(no), {fs: 12, fill: MUT, anchor: 'middle'}) +
      txt(x + 46, 162, sym, {fs: 26, fw: 900}) +
      txt(x + 46, 190, zh, {fs: 14}) +
      txt(x + 46, 204, latin, {fs: 9.5, fill: MUT});
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="六个常见元素符号卡">` +
      cell(28, 'H', '氢', 1, 'hydrogen') + cell(130, 'O', '氧', 8, 'oxygen') + cell(232, 'C', '碳', 6, 'carbon') +
      cell(334, 'Fe', '铁', 26, 'ferrum') + cell(436, 'Na', '钠', 11, 'natrium') + cell(538, 'Au', '金', 79, 'aurum') +
      txt(320, 60, '符号一大一小写：Fe 是铁，CO 是一氧化碳，Co 是钴', {fs: 14.5}) +
      txt(320, 248, '老元素的符号来自拉丁文名字：钠 Na、钾 K、铁 Fe、金 Au、银 Ag', {fs: 13, fill: MUT}) +
      txt(320, 288, '符号是化学的「拼音」：水 H₂O、二氧化碳 CO₂、食盐 NaCl', {fs: 13.5}) +
      txt(320, 318, '第二个字母必须小写——大小写是两种不同的东西', {fs: 12.5, fill: MUT}) +
      '</svg>';
  };

  /* 迷你周期表 */
  const periodicMini = () => {
    const cellAt = (x, y, sym, no, fill, ink) => `<rect x="${x}" y="${y}" width="52" height="46" rx="8" fill="${fill}"/>` +
      txt(x + 10, y + 15, String(no), {fs: 10, fill: MUT, anchor: 'start'}) +
      txt(x + 26, y + 36, sym, {fs: 16, fw: 900, fill: ink});
    const METAL = '#d7e6fb', NON = '#ddf3e4', BOTH = '#f6ecd7';
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="迷你元素周期表示意，左下金属右上非金属">` +
      txt(320, 38, '元素周期表像一栋大楼：横行叫周期，竖列叫族', {fs: 15}) +
      `<rect x="46" y="66" width="336" height="216" rx="14" fill="#d7e6fb" opacity=".55"/>` +
      `<rect x="398" y="66" width="200" height="150" rx="14" fill="#ddf3e4" opacity=".7"/>` +
      `<path d="M382 216 398 200" stroke="#b5893a" stroke-width="2" stroke-dasharray="4 4"/>` +
      txt(214, 96, '金属区（光泽、能导电）', {fs: 13, fill: '#2b5f8f'}) +
      txt(498, 96, '非金属区', {fs: 13, fill: '#187749'}) +
      cellAt(62, 116, 'Na', 11, METAL, INK) + cellAt(120, 116, 'Mg', 12, METAL, INK) +
      cellAt(178, 116, 'Al', 13, BOTH, INK) + cellAt(236, 116, 'Si', 14, BOTH, INK) +
      cellAt(294, 116, 'Fe', 26, METAL, INK) + cellAt(352, 116, 'Cu', 29, METAL, INK) +
      cellAt(62, 176, 'Li', 3, METAL, INK) + cellAt(294, 176, 'Zn', 30, METAL, INK) + cellAt(352, 176, 'Ag', 47, METAL, INK) +
      cellAt(412, 116, 'C', 6, NON, INK) + cellAt(470, 116, 'N', 7, NON, INK) + cellAt(528, 116, 'O', 8, NON, INK) +
      cellAt(412, 176, 'P', 15, NON, INK) + cellAt(470, 176, 'S', 16, NON, INK) + cellAt(528, 176, 'Cl', 17, NON, INK) +
      cellAt(62, 236, 'H', 1, BOTH, INK) + cellAt(528, 236, 'He', 2, NON, INK) +
      txt(120, 300, '楼梯线附近是「两像都占」的类金属（硅）', {anchor: 'start', fs: 12.5, fill: '#b5893a'}) +
      txt(120, 322, '格子里的数字是原子序数＝质子数，就是元素的门牌号', {anchor: 'start', fs: 12.5, fill: MUT}) +
      '</svg>';
  };

  /* 元素资料入口（HTML 组件） */
  const elementLink = () => `<div class="mt-element-link">` +
    `<p class="mt-element-lead">「查元素周期表」资料库躺着 118 种元素的档案卡：符号、中文名、分类、密度都在。</p>` +
    `<div class="mt-element-cards">` +
    [['1', 'H', '氢', '宇宙里最多的元素'], ['26', 'Fe', '铁', '地球核心的主要成分'], ['8', 'O', '氧', '地壳里含量最多']]
    .map(([no, sym, zh, note]) => `<span class="mt-element-card"><b>${sym}</b><em>${zh}</em><i>序数 ${no}</i><u>${note}</u></span>`).join('') +
    `</div>` +
    `<a class="fig-btn" href="/science/elements/">打开查元素周期表 ↗</a>` +
    `<p class="mt-element-note">资料卡是卡片列表，不是周期表位置图；想看格子布局，对照上面的迷你周期表。</p>` +
    `</div>`;

  /* ---------- pH 调色卡 ---------- */
  const PH_COLORS = ['#8c1f2f', '#a52638', '#c33b4e', '#d95f75', '#e28098', '#c26ca4', '#a67cc8',
    '#8f7cc0', '#7a86cf', '#5e8fd0', '#4fae9e', '#57b48b', '#7dbd63', '#a3c94e', '#c9d43c'];
  const PH_SAMPLES = [
    {id: 'lemon', name: '柠檬汁', ph: 2, text: '酸性较强'},
    {id: 'vinegar', name: '白醋', ph: 3, text: '酸性'},
    {id: 'water', name: '纯水', ph: 7, text: '中性'},
    {id: 'soda', name: '小苏打水', ph: 9, text: '弱碱性'},
    {id: 'soap', name: '肥皂水', ph: 10, text: '碱性'},
    {id: 'cleaner', name: '炉具清洁剂', ph: 13, text: '强碱，只能看不能碰'},
  ];
  const CABBAGE_NOTE = ph => ph < 7 ? `紫甘蓝汁会变${ph <= 3 ? '红' : '浅红'}` :
    ph === 7 ? '紫甘蓝汁保持紫色' : `紫甘蓝汁会变${ph <= 10 ? '蓝绿' : '黄绿'}`;

  function phStrip(selected) {
    const cells = PH_COLORS.map((color, i) =>
      `<rect x="${16 + i * 41}" y="26" width="37" height="64" rx="7" fill="${color}"/>` +
      txt(16 + i * 41 + 18.5, 106, String(i), {fs: 12.5, fill: i === selected ? INK : MUT}));
    const cx = 16 + selected * 41 + 18.5;
    return `<svg class="fig-svg" viewBox="0 0 640 150" role="img" aria-label="pH 0 到 14 的紫甘蓝汁比色条">` +
      cells.join('') +
      `<path d="M${cx} 118v20" stroke="${INK}" stroke-width="3" marker-end="url(#mfig-arrow)"/>` +
      txt(320, 146, '越小越酸 ← pH 0～14 → 越大越碱', {fs: 13.5, fill: MUT}) + '</svg>';
  }

  function phApply(fig, id) {
    const sample = PH_SAMPLES.find(item => item.id === id) || PH_SAMPLES[2];
    fig.dataset.phPick = sample.id;
    fig.querySelector('[data-ph-strip]').innerHTML = phStrip(sample.ph);
    fig.querySelectorAll('[data-ph-sample]').forEach(button =>
      button.setAttribute('aria-pressed', String(button.dataset.phSample === sample.id)));
    const readout = fig.querySelector('[data-ph-readout]');
    readout.innerHTML = `<b>${sample.name}：pH ≈ ${sample.ph}</b><span>${sample.text} · ${CABBAGE_NOTE(sample.ph)}</span>`;
  }

  const phCard = () => `<div class="mt-ph" data-mt-ph>` +
    `<div data-ph-strip>${phStrip(7)}</div>` +
    `<div class="fig-ctrl mt-ph-samples">` +
    PH_SAMPLES.map(sample => `<button type="button" class="fig-btn" data-ph-sample="${sample.id}" aria-pressed="false">${sample.name}</button>`).join('') +
    `</div>` +
    `<p class="mt-ph-readout" data-ph-readout role="status"></p>` +
    `<p class="mt-ph-note">数值为常见约数；测 pH 用试纸或 pH 计滴一滴比一比。</p>` +
    `</div>`;

  /* ---------- 反应观察表 ---------- */
  const REACTION_ROWS = [
    {id: 'soda-vinegar', name: '醋 ＋ 小苏打', safety: '敞口杯、少量，脸别凑近',
      options: [{id: 'bubbles', label: '冒气泡'}, {id: 'color', label: '变色'}, {id: 'nothing', label: '没动静'}],
      answer: 'bubbles', reveal: '白泡涌起、嘶嘶作响，杯壁微凉——醋酸和小苏打反应放出了二氧化碳。'},
    {id: 'nail-rust', name: '铁钉泡水（放几天）', safety: '标注日期，几天后回看',
      options: [{id: 'rust', label: '长锈点'}, {id: 'shiny', label: '依然闪亮'}, {id: 'melt', label: '钉子变小'}],
      answer: 'rust', reveal: '水面附近先出现红棕色锈点——铁＋氧气＋水，三个条件凑齐了。'},
    {id: 'candle-burn', name: '蜡烛燃烧（家长在场）', safety: '家长点火，用玻璃杯罩一罩',
      options: [{id: 'forever', label: '一直烧下去'}, {id: 'out', label: '罩一会儿就灭'}, {id: 'explode', label: '啪地炸开'}],
      answer: 'out', reveal: '杯里的氧气快用完，火焰熄灭；杯壁留有烟灰和水汽——燃烧需要氧气。'},
  ];
  const REACTION_KEY = 'matter_reactions_v1';

  function loadReactions() {
    try {
      const saved = JSON.parse(localStorage.getItem(REACTION_KEY) || '{}');
      return saved && typeof saved === 'object' ? saved : {};
    } catch (e) { return {}; }
  }
  function saveReactions(state) {
    try { localStorage.setItem(REACTION_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function reactionRow(row, state) {
    const guess = state[row.id]?.guess || '';
    const guessed = row.options.some(option => option.id === guess);
    const seen = !!state[row.id]?.seen;
    const done = guessed && seen;
    return `<tr data-reaction-row="${row.id}">` +
      `<th scope="row"><b>${row.name}</b><span class="mt-row-safety">🔒 ${row.safety}</span></th>` +
      `<td><div class="mt-guess">` +
      row.options.map(option => `<button type="button" class="fig-btn mt-guess-btn" data-mt-act="guess" data-row="${row.id}" data-opt="${option.id}" aria-pressed="${option.id === guess}">${option.label}</button>`).join('') +
      `</div></td>` +
      `<td><button type="button" class="fig-btn" data-mt-act="reveal" data-row="${row.id}" ${guessed ? '' : 'disabled'}>${seen ? '再看一遍' : '揭示参考现象'}</button>` +
      (seen ? `<p class="mt-reveal ${guess === row.answer ? 'mt-reveal-hit' : 'mt-reveal-miss'}">${guess === row.answer ? '🎯 猜对了！' : '🧐 再对照看看——'}${row.reveal}</p>` : '') +
      `<label class="mt-observe-label">我的观察<textarea data-mt-act="observe" data-row="${row.id}" rows="2" placeholder="只写看到、听到、摸到的…">${state[row.id]?.note || ''}</textarea></label>` +
      `</td></tr>`;
  }

  function reactionTable(state) {
    const done = REACTION_ROWS.filter(row => state[row.id]?.guess && state[row.id]?.seen).length;
    return `<table class="mt-reaction-table"><thead><tr><th>实验</th><th>我猜会看到</th><th>参考现象与我的记录</th></tr></thead>` +
      `<tbody>${REACTION_ROWS.map(row => reactionRow(row, state)).join('')}</tbody></table>` +
      `<p class="mt-rec-count" role="status">已记录 ${done} / ${REACTION_ROWS.length} 个实验 · 记录只保存在本浏览器</p>`;
  }

  function reactionApply(fig) {
    fig.querySelector('[data-mt-reactions]').innerHTML = reactionTable(loadReactions());
  }

  function reactionAction(fig, button) {
    const state = loadReactions();
    const rowId = button.dataset.row;
    state[rowId] = state[rowId] || {};
    if (button.dataset.mtAct === 'guess') {
      state[rowId].guess = button.dataset.opt;
    } else if (button.dataset.mtAct === 'reveal') {
      state[rowId].seen = true;
    }
    saveReactions(state);
    reactionApply(fig);
  }

  /* ---------- 分段观察：复用 sci-process 播放器，缺播放器时退回静态示意 ---------- */
  const processFallback = (title, hint) => `<svg class="fig-svg" viewBox="0 0 640 350" role="img" aria-label="${title}静态示意">` +
    `<rect x="8" y="8" width="624" height="334" rx="16" fill="#eef7fd"/>` +
    txt(320, 168, title, {fs: 17}) + txt(320, 200, hint, {fs: 13, fill: MUT}) + '</svg>';
  const processDissolve = () => {
    if (typeof window !== 'undefined') {
      const interactive = window.SciProcess?.html('dissolve');
      if (interactive) return interactive;
    }
    return processFallback('溶解分段观察', '食盐入水 → 颗粒变小 → 搅拌扩散 → 均匀分布');
  };
  const processFilter = () => {
    if (typeof window !== 'undefined') {
      const interactive = window.SciProcess?.html('filter');
      if (interactive) return interactive;
    }
    return processFallback('过滤分段观察', '倒入浊液 → 滤纸拦杂质 → 收集滤液');
  };
  const processBurn = () => {
    if (typeof window !== 'undefined') {
      const interactive = window.SciProcess?.html('burn');
      if (interactive) return interactive;
    }
    return processFallback('燃烧条件与灭火', '可燃物 · 氧气 · 达到着火点，缺一就熄灭');
  };

  /* ---------- 注册表 ---------- */
  const REG = {
    'mt-bn-mu1': bannerMu1, 'mt-bn-mu2': bannerMu2, 'mt-bn-mu3': bannerMu3,
    'mt-bn-mu4': bannerMu4, 'mt-bn-mu5': bannerMu5,
    'matter-six-changes': sixChanges, 'matter-heat-flow': heatFlow,
    'matter-evap-boil': evapBoil, 'matter-life-states': lifeStates,
    'matter-solutions': solutions, 'matter-evaporate': evaporate,
    'matter-acid-base-life': acidBaseLife, 'matter-indicator': indicator,
    'matter-neutralize': neutralize, 'matter-change-compare': changeCompare,
    'matter-vinegar-soda': vinegarSoda, 'matter-rust': rust,
    'matter-made-of': madeOf, 'matter-symbols': symbols,
    'matter-periodic-mini': periodicMini, 'matter-element-link': elementLink,
    'matter-ph-card': phCard, 'matter-reaction-table': () =>
      `<div data-mt-reactions>${reactionTable(loadReactions())}</div>`,
    'process-dissolve': processDissolve, 'process-filter': processFilter, 'process-burn': processBurn,
  };

  const DEFAULT_CAPS = {
    'matter-six-changes': '六条变化路：看起点和终点，对号取名字',
    'matter-heat-flow': '往更自由的态走要吸热，往更整齐的态走要放热',
    'matter-evap-boil': '蒸发：表面、任何温度；沸腾：里外一起、要到沸点',
    'matter-life-states': '见水珠想液化，见冰花想凝华',
    'matter-solutions': '溶质＋溶剂＝溶液；合不来分层的叫浊液',
    'matter-evaporate': '蒸发结晶：水走掉，晶体留下；快干时收火',
    'matter-acid-base-life': '醋柠檬是酸，肥皂小苏打是碱；判断交给指示剂',
    'matter-indicator': '紫甘蓝汁裁判：酸红、碱蓝绿、中性紫',
    'matter-ph-card': '互动调色卡：点一种液体，看它落在 pH 尺的哪一格',
    'matter-neutralize': '中和：酸碱手拉手，生成盐和水',
    'matter-change-compare': '有没有新物质，是物理变化和化学变化的分界线',
    'matter-vinegar-soda': '醋＋小苏打：白泡是二氧化碳；敞口、少量、脸别凑近',
    'matter-rust': '生锈三条件：铁＋氧气＋水；防锈就是拆条件',
    'matter-made-of': '元素是积木：100 多种搭出千万种物质',
    'matter-symbols': '一大一小写符号；老元素的符号来自拉丁文',
    'matter-periodic-mini': '横行是周期，竖列是族；左下金属、右上非金属',
    'matter-element-link': '去元素资料卡查一查：118 种元素的档案',
    'matter-ph-card': 'pH 调色卡：7 是中，小酸大碱',
    'matter-reaction-table': '反应观察表：先猜、再对、然后如实记录',
    'process-dissolve': '溶解分段观察：食盐入水、颗粒变小、搅拌扩散、均匀分布',
    'process-filter': '过滤分段观察：倒入浊液、滤纸拦杂质、收集滤液',
    'process-burn': '燃烧条件与灭火：三个条件缺一不可',
    'mt-bn-mu1': '', 'mt-bn-mu2': '', 'mt-bn-mu3': '', 'mt-bn-mu4': '', 'mt-bn-mu5': '',
  };

  function figHTML(id, cap) {
    const fn = REG[id];
    if (!fn) return '';
    const capText = cap || DEFAULT_CAPS[id] || '';
    return `<figure class="fig" data-fig="${id}">${DEFS}${fn()}${capText ? `<figcaption class="fig-cap">${capText}</figcaption>` : ''}</figure>`;
  }

  /* ---------- 互动组件的委托事件与初始化 ---------- */
  function bindDelegates(doc) {
    doc.addEventListener('click', e => {
      const button = e.target.closest('[data-ph-sample],[data-mt-act]');
      if (!button || button.disabled) return;
      const fig = button.closest('.fig');
      if (!fig) return;
      if (button.dataset.phSample) phApply(fig, button.dataset.phSample);
      else if (['guess', 'reveal'].includes(button.dataset.mtAct)) reactionAction(fig, button);
    });
    doc.addEventListener('input', e => {
      if (!e.target.matches?.('textarea[data-mt-act="observe"]')) return;
      const fig = e.target.closest('.fig');
      if (!fig) return;
      const state = loadReactions();
      const rowId = e.target.dataset.row;
      state[rowId] = state[rowId] || {};
      state[rowId].note = e.target.value;
      saveReactions(state);
    });
  }

  if (typeof document !== 'undefined') {
    bindDelegates(document);
    const initIn = root => {
      root.querySelectorAll('.fig').forEach(fig => {
        window.SciProcess?.mount(fig);
        window.MatterMix?.mount(fig);
        const id = fig.dataset.fig;
        if ((id === 'matter-ph-card' || id === 'matter-reaction-table') && !fig.dataset.init) {
          if (id === 'matter-ph-card') phApply(fig, 'water');
          else reactionApply(fig);
          fig.dataset.init = '1';
        }
      });
      /* 混合实验台单独渲染（不在 .fig 里）：根节点就是它时也直接挂载。 */
      if (root.matches?.('[data-matter-mix]')) window.MatterMix?.mount(root);
      root.querySelectorAll('[data-matter-mix]').forEach(section => window.MatterMix?.mount(section));
    };
    const mo = new MutationObserver(muts => {
      window.SciProcess?.prune();
      window.MatterMix?.prune();
      muts.forEach(m => m.addedNodes.forEach(n => {
        if (n.nodeType === 1) {
          if (n.matches && n.matches('.fig')) initIn(n.parentElement || document);
          else if (n.querySelectorAll) initIn(n);
        }
      }));
    });
    mo.observe(document.body, {childList: true, subtree: true});
    document.addEventListener('DOMContentLoaded', () => initIn(document));
  }

  return {
    figHTML,
    get FIG_IDS() { return Object.keys(REG); },
    has(id) { return Object.prototype.hasOwnProperty.call(REG, id); },
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MatterFigures;
}
if (typeof window !== 'undefined') {
  window.MatterFigures = MatterFigures;
}

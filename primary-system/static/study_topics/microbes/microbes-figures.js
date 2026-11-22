/* ============================================================
   乐学堂 · 微生物（看不见的世界）—— 图示库
   - 纯 SVG 插图，离线可用，打印友好
   - 洗手公平比较台为内置互动组件（先猜、再对、记观察）
   - 尺度缩放台由 microbe-scale.js 提供，这里只做包装
   - 数据里用 fig: 'microbe-xxx' 引用
   ============================================================ */
'use strict';

const MicrobeFigures = (() => {
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
  const txt = (x, y, s, opt = {}) =>
    `<text x="${x}" y="${y}" fill="${opt.fill || INK}" font-size="${opt.fs || 14}"` +
    ` font-weight="${opt.fw || 700}" text-anchor="${opt.anchor || 'middle'}"` +
    (opt.cls ? ` class="${opt.cls}"` : '') + `>${s}</text>`;
  const arrow = (d, color = MUT, width = 3) =>
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" marker-end="url(#bfig-arrow)"/>`;
  const card = (x, y, w, h, fill, stroke) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${fill}" stroke="${stroke || 'none'}" stroke-width="2"/>`;
  const bug = (x, y, r, fill, stroke) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>`;
  const DEFS = `<defs><marker id="bfig-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${MUT}"/></marker></defs>`;

  /* ---------- 横幅 ---------- */
  const banner = (emoji, name, color) => {
    const light = color + '26';
    return `<svg class="fig-svg" viewBox="0 0 640 110" role="img" aria-label="${name}横幅">` +
      `<rect width="640" height="110" rx="16" fill="${light}"/>` +
      `<circle cx="588" cy="26" r="34" fill="${color}" opacity=".18"/>` +
      `<circle cx="62" cy="86" r="26" fill="${color}" opacity=".14"/>` +
      `<circle cx="528" cy="88" r="10" fill="${color}" opacity=".2" class="mb-float"/>` +
      `<circle cx="118" cy="30" r="7" fill="${color}" opacity=".22" class="mb-float mb-d2"/>` +
      `<text x="56" y="72" font-size="52">${emoji}</text>` +
      txt(124, 66, name, {fill: color, fs: 30, fw: 900, anchor: 'start'}) + '</svg>';
  };
  const bannerMm1 = () => banner('🦠', '微生物家族 · 看不见的居民', BLUE);
  const bannerMm2 = () => banner('🔬', '看得见的尺度 · 从微米到纳米', TEAL);
  const bannerMm3 = () => banner('🍞', '发酵厨房 · 好菌大厨', ORANGE);
  const bannerMm4 = () => banner('🛡️', '免疫与疫苗 · 身体的防线', PURPLE);
  const bannerMm5 = () => banner('🧼', '健康习惯室 · 手上的科学', SKY);

  /* ================= 第一室 ================= */

  /* 一滴池塘水 */
  const pondDrop = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="一滴池塘水里的微生物居民">` + DEFS +
    `<path d="M150 60Q90 160 130 250Q170 320 250 300Q330 280 320 180Q312 92 240 62Q195 44 150 60Z" fill="#cfe8f7" stroke="#7fb6d8" stroke-width="5"/>` +
    txt(225, 326, '一滴池塘水（示意）', {fs: 14, fill: MUT}) +
    `<g>` +
    [[210, 130, 26, '#bfe6cd', TEAL, 3], [285, 210, 20, '#f6e3b5', GOLD, 0], [185, 235, 17, '#d9c9ee', PURPLE, 1], [265, 130, 14, '#c9bef0', '#6a52b8', 2]].map(([x, y, r, fill, stroke, kind]) => {
      const body = kind === 0 ? `<rect x="${x - r * 1.4}" y="${y - r * .7}" width="${r * 2.8}" height="${r * 1.4}" rx="${r * .7}" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>` : bug(x, y, r, fill, stroke);
      return body;
    }).join('') +
    `<ellipse cx="330" cy="165" rx="34" ry="20" fill="#bfe6cd" stroke="#3e8f63" stroke-width="2.5"/><text x="330" y="171" font-size="11" text-anchor="middle" fill="#1d5c3c">草履虫</text>` +
    `</g>` +
    `<rect x="380" y="60" width="240" height="240" rx="14" fill="#fff" stroke="${LINE}"/>` +
    txt(500, 92, '这栋楼里的常客', {fs: 15}) +
    txt(400, 124, '· 草履虫、变形虫——原生生物', {anchor: 'start', fs: 13}) +
    txt(400, 152, '· 各种藻类——会光合作用的居民', {anchor: 'start', fs: 13}) +
    txt(400, 180, '· 杆菌球菌——细菌家族', {anchor: 'start', fs: 13}) +
    txt(400, 208, '· 真菌孢子——路过或常住', {anchor: 'start', fs: 13}) +
    txt(400, 244, '一滴水＝一座微生物居民楼：', {anchor: 'start', fs: 13.5, fill: MUT}) +
    txt(400, 266, '住客比全世界人口还多。', {anchor: 'start', fs: 13.5, fill: MUT}) +
    txt(500, 300, '形状与数量均为示意', {fs: 11.5, fill: MUT}) +
    '</svg>';

  /* 四大家族 */
  const family = () => {
    const col = (x, color, emoji, name, size, trait) =>
      card(x, 66, 140, 210, '#fff', LINE) +
      `<rect x="${x}" y="66" width="140" height="34" rx="14" fill="${color}"/>` +
      txt(x + 70, 89, name, {fill: '#fff', fs: 15}) +
      `<text x="${x + 70}" y="136" font-size="30">${emoji}</text>` +
      txt(x + 70, 170, size, {fs: 12.5, fill: MUT}) +
      txt(x + 70, 196, trait[0], {fs: 12}) + txt(x + 70, 216, trait[1], {fs: 12}) +
      txt(x + 70, 250, '', {fs: 12});
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="微生物四大家族对比">` + DEFS +
      txt(320, 40, '按典型大小从大到小（数量级示意）', {fs: 15}) +
      col(30, PURPLE, '🫧', '原生生物', '几十微米', ['有细胞核', '草履虫·变形虫']) +
      col(175, ORANGE, '🍄', '真菌', '5～10 微米', ['有细胞核', '酵母·霉菌·蘑菇']) +
      col(320, BLUE, '🦠', '细菌', '1～2 微米', ['无细胞核', '球菌·杆菌·螺旋']) +
      col(465, RED, '👾', '病毒', '约 0.1 微米', ['无细胞结构', '住进细胞才复制']) +
      arrow('M170 320H470', MUT, 2) + txt(320, 310, '原生生物 → 真菌 → 细菌 → 病毒，逐级变小', {fs: 13, fill: MUT}) +
      '</svg>';
  };

  /* 病毒是生命吗 */
  const lifeQuestion = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="病毒是不是生命的天平">` + DEFS +
    `<path d="M320 60V210" stroke="${INK}" stroke-width="5"/>` +
    `<path d="M180 96 320 74 460 96" fill="none" stroke="${INK}" stroke-width="5"/>` +
    `<path d="M180 96v14M460 96v14" stroke="${INK}" stroke-width="3"/>` +
    card(88, 118, 184, 96, '#e9f9f0', GREEN) +
    txt(180, 146, '像生命', {fill: '#187749', fs: 15}) +
    txt(180, 172, '有遗传物质', {fs: 12.5}) + txt(180, 192, '能变异、能进化', {fs: 12.5}) +
    card(368, 118, 184, 96, '#fdeaea', RED) +
    txt(460, 146, '不像生命', {fill: '#a4453f', fs: 15}) +
    txt(460, 172, '没有细胞结构', {fs: 12.5}) + txt(460, 192, '离体不代谢、可结晶', {fs: 12.5}) +
    `<rect x="232" y="216" width="176" height="44" rx="22" fill="#f3edfb"/>` +
    txt(320, 244, '还没有定论', {fill: '#5d3f96', fs: 15}) +
    txt(320, 292, '科学的做法：摆出双方证据，而不是急着给结论', {fs: 13.5}) +
    txt(320, 316, '能遗传、能进化，但必须住进别的细胞才能复制', {fs: 12.5, fill: MUT}) +
    '</svg>';

  /* 好菌坏菌 */
  const goodbad = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="判断细菌好坏的三个问题">` + DEFS +
    txt(320, 40, '先问三件事，再下判断', {fs: 16}) +
    card(30, 66, 190, 120, '#eef7f3', TEAL) +
    txt(125, 96, '① 是谁？', {fill: TEAL, fs: 15}) +
    txt(125, 124, '乳酸菌常是好帮手，', {fs: 12.5}) +
    txt(125, 146, '结核菌是致病菌——', {fs: 12.5}) +
    txt(125, 168, '先认种类。', {fs: 12.5}) +
    card(225, 66, 190, 120, '#eef7f3', TEAL) +
    txt(320, 96, '② 在哪？', {fill: TEAL, fs: 15}) +
    txt(320, 124, '肠道里帮忙消化，', {fs: 12.5}) +
    txt(320, 146, '进了伤口可能捣乱——', {fs: 12.5}) +
    txt(320, 168, '位置改变身份。', {fs: 12.5}) +
    card(420, 66, 190, 120, '#eef7f3', TEAL) +
    txt(515, 96, '③ 有多少？', {fill: TEAL, fs: 15}) +
    txt(515, 124, '少量常驻是门卫，', {fs: 12.5}) +
    txt(515, 146, '大量繁殖才成灾——', {fs: 12.5}) +
    txt(515, 168, '数量决定结果。', {fs: 12.5}) +
    `<rect x="60" y="216" width="520" height="52" rx="14" fill="#fdf3e4"/>` +
    txt(320, 248, '绝大多数细菌无害，很多还有用：分解落叶、固氮肥田、做酸奶面包', {fs: 13.5, fill: '#7a5327'}) +
    txt(320, 306, '「细菌都是坏的」——找一个反例就能推翻：你今天的酸奶就是', {fs: 13}) +
    '</svg>';

  /* ================= 第二室 ================= */

  /* 显微镜 */
  const microscopes = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="从列文虎克到电子显微镜">` + DEFS +
    txt(320, 40, '三代「眼睛」接力', {fs: 16}) +
    card(30, 66, 190, 180, '#fff', LINE) +
    txt(125, 94, '列文虎克的镜片', {fs: 14}) +
    `<ellipse cx="125" cy="140" rx="34" ry="44" fill="#cfe8f7" stroke="#7fb6d8" stroke-width="4"/>` +
    txt(125, 184, '约 17 世纪', {fs: 12, fill: MUT}) +
    txt(125, 206, '放大几百倍', {fs: 12.5}) +
    txt(125, 226, '看清一滴水里的居民', {fs: 12.5}) +
    card(225, 66, 190, 180, '#fff', LINE) +
    txt(320, 94, '光学显微镜', {fs: 14}) +
    `<rect x="292" y="110" width="26" height="90" rx="8" fill="#dbe9f6" stroke="#7fb6d8" stroke-width="3"/><rect x="280" y="200" width="50" height="18" rx="6" fill="#dbe9f6" stroke="#7fb6d8" stroke-width="3"/>` +
    txt(320, 184, '现代教室款', {fs: 12, fill: MUT}) +
    txt(320, 206, '放大几十到上千倍', {fs: 12.5}) +
    txt(320, 226, '分辨率极限约 0.2 微米', {fs: 12.5}) +
    card(420, 66, 190, 180, '#fff', LINE) +
    txt(515, 94, '电子显微镜', {fs: 14}) +
    `<rect x="470" y="108" width="90" height="70" rx="10" fill="#f3edfb" stroke="#b79ae0" stroke-width="3"/><circle cx="515" cy="196" r="22" fill="#c9bef0" stroke="#8b65c9" stroke-width="3"/>` +
    txt(515, 184, '大型设备', {fs: 12, fill: MUT}) +
    txt(515, 206, '电子束代替光', {fs: 12.5}) +
    txt(515, 226, '分辨率到纳米级', {fs: 12.5}) +
    arrow('M225 160H215', MUT) + arrow('M420 160H410', MUT) +
    txt(320, 286, '想看清病毒：光学显微镜做不到，请电子显微镜出场', {fs: 14}) +
    txt(320, 314, '看清的前提不是倍数，是分辨率', {fs: 12.5, fill: MUT}) +
    '</svg>';

  /* 放大与分辨率 */
  const resolution = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="放大倍数与分辨率的比较">` + DEFS +
    txt(320, 40, '放大 ≠ 分辨率', {fs: 17}) +
    card(40, 70, 270, 200, '#fff', LINE) +
    txt(175, 98, '只放大', {fs: 15}) +
    bug(140, 170, 44, '#dbe9f6', '#7fb6d8') + bug(230, 170, 44, '#dbe9f6', '#7fb6d8') +
    txt(175, 238, '两个点变大，但糊成一片', {fs: 12.5, fill: MUT}) +
    txt(175, 258, '没有新信息', {fs: 12.5, fill: MUT}) +
    card(330, 70, 270, 200, '#fff', LINE) +
    txt(465, 98, '分辨率高', {fs: 15}) +
    `<circle cx="420" cy="170" r="44" fill="#d9ecd4" stroke="#3e8f63" stroke-width="3"/>` +
    `<circle cx="436" cy="162" r="10" fill="#3e8f63"/><circle cx="410" cy="182" r="7" fill="#3e8f63"/>` +
    txt(465, 238, '两个点分得清清楚楚', {fs: 12.5, fill: MUT}) +
    txt(465, 258, '信息是真的多了', {fs: 12.5, fill: MUT}) +
    arrow('M310 170H330', MUT) +
    txt(320, 300, '光学显微镜止步约 0.2 微米——多数病毒比这还小', {fs: 14}) +
    txt(320, 324, '照片放大一百倍也不会变清楚：信息在拍摄时就定格了', {fs: 12.5, fill: MUT}) +
    '</svg>';

  /* 微米纳米 */
  const units = () => {
    const step = (x, w, color, label, sub) => `<rect x="${x}" y="110" width="${w}" height="64" rx="12" fill="${color}"/>` +
      txt(x + w / 2, 138, label, {fill: '#fff', fs: 14}) + txt(x + w / 2, 160, sub, {fill: '#fff', fs: 11.5});
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="从毫米到纳米的数量级阶梯">` + DEFS +
      txt(320, 44, '一级一千倍的小阶梯', {fs: 16}) +
      step(40, 150, '#2f9bd6', '毫米 mm', '蚂蚁·沙粒') +
      step(230, 150, '#157d73', '微米 μm', '头发 70·细菌 2') +
      step(420, 150, '#8b65c9', '纳米 nm', '病毒 100·DNA 2') +
      arrow('M195 142H225', MUT) + arrow('M385 142H415', MUT) +
      txt(320, 212, '1 毫米＝1000 微米　1 微米＝1000 纳米', {fs: 15}) +
      txt(320, 252, '从头发丝（70 微米）到病毒（100 纳米）', {fs: 13.5}) +
      txt(320, 274, '大约差 700 倍——数量级是微观世界的语言', {fs: 13.5, fill: MUT}) +
      `<rect x="90" y="296" width="460" height="32" rx="14" fill="#f3edfb"/>` +
      txt(320, 318, '换算口诀：毫到微、微到纳，一级一千倍', {fs: 13.5, fill: '#5d3f96'}) +
      '</svg>';
  };

  /* 尺度缩放台包装 */
  const scaleLab = () => {
    if (typeof window !== 'undefined') {
      const interactive = window.MicrobeScale?.render();
      if (interactive) return interactive;
    }
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="尺度缩放台静态示意">` +
      `<rect x="8" y="8" width="624" height="324" rx="16" fill="#eef7fd"/>` +
      txt(320, 150, '尺度缩放台', {fs: 18}) +
      txt(320, 186, '头发丝 → 皮肤细胞 → 细菌 → 病毒 → 水分子', {fs: 14, fill: MUT}) +
      '</svg>';
  };

  /* ================= 第三室 ================= */

  /* 发酵总图 */
  const fermentMap = () => {
    const lane = (y, color, emoji, who, eats, makes, food) =>
      `<rect x="40" y="${y}" width="560" height="74" rx="14" fill="#fff" stroke="${LINE}"/>` +
      `<text x="70" y="${y + 46}" font-size="26">${emoji}</text>` +
      txt(118, y + 42, who, {anchor: 'start', fs: 14.5, fill: color}) +
      txt(250, y + 30, '吃下', {fs: 12, fill: MUT}) +
      txt(250, y + 52, eats, {fs: 13}) +
      arrow(`M320 ${y + 40}H372`, color) +
      txt(398, y + 30, '产出', {fs: 12, fill: MUT}) +
      txt(398, y + 52, makes, {fs: 13}) +
      txt(560, y + 42, food, {fs: 13.5});
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="三种发酵的菌种、产物与食物对应">` + DEFS +
      txt(320, 36, '发酵＝微生物吃饭，人类收成果', {fs: 16}) +
      lane(60, ORANGE, '🥛', '乳酸菌', '乳糖（糖）', '乳酸', '→ 酸奶') +
      lane(148, GOLD, '🍞', '酵母菌', '糖', '二氧化碳＋酒精', '→ 面包·酒') +
      lane(236, TEAL, '🍶', '醋酸菌', '酒精', '醋酸', '→ 醋') +
      txt(320, 336, '发酵也是保存术：乳酸和酒精能抑制杂菌——泡菜果醋放得久', {fs: 13.5}) +
      '</svg>';
  };

  /* 酸奶 */
  const yogurt = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="自制酸奶的流程">` + DEFS +
    txt(320, 40, '牛奶变酸奶的四步', {fs: 16}) +
    `<rect x="46" y="70" width="120" height="70" rx="12" fill="#e8f4fb" stroke="#7fb6d8" stroke-width="3"/>` +
    txt(106, 112, '① 牛奶煮沸', {fs: 13}) + txt(106, 130, '清掉杂菌', {fs: 11.5, fill: MUT}) +
    `<rect x="206" y="70" width="120" height="70" rx="12" fill="#e8f4fb" stroke="#7fb6d8" stroke-width="3"/>` +
    txt(266, 112, '② 放凉到 40℃', {fs: 13}) + txt(266, 130, '不烫手才接种', {fs: 11.5, fill: MUT}) +
    `<rect x="366" y="70" width="120" height="70" rx="12" fill="#e8f4fb" stroke="#7fb6d8" stroke-width="3"/>` +
    txt(426, 112, '③ 加酸奶引子', {fs: 13}) + txt(426, 130, '两勺活菌种', {fs: 11.5, fill: MUT}) +
    `<rect x="526" y="70" width="88" height="70" rx="12" fill="#e8f4fb" stroke="#7fb6d8" stroke-width="3"/>` +
    txt(570, 112, '④ 保温 6～8h', {fs: 13}) +
    arrow('M170 105H200', MUT) + arrow('M330 105H360', MUT) + arrow('M490 105H520', MUT) +
    `<rect x="150" y="170" width="150" height="90" rx="16" fill="#fdf3e4"/>` +
    txt(225, 214, '🥛 → 🥣', {fs: 22}) + txt(225, 244, '液体牛奶', {fs: 12.5, fill: MUT}) +
    arrow('M304 215H336', ORANGE) +
    `<rect x="340" y="170" width="150" height="90" rx="16" fill="#e9f9f0"/>` +
    txt(415, 214, '🥣 凝固！', {fs: 18}) + txt(415, 244, '乳酸让蛋白抱团', {fs: 12.5, fill: MUT}) +
    `<rect x="110" y="284" width="420" height="38" rx="12" fill="#fdeaea"/>` +
    txt(320, 309, '安全三条：器具烫洗 · 用市售菌种 · 成品冷藏尽快吃', {fs: 13, fill: '#a4453f'}) +
    '</svg>';

  /* 面包 */
  const bread = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="酵母如何让面包蓬松">` + DEFS +
    txt(320, 40, '酵母吃糖，吐出气泡', {fs: 16}) +
    `<rect x="70" y="80" width="220" height="120" rx="18" fill="#f6e3b5" stroke="#c8a35a" stroke-width="4"/>` +
    `<circle cx="130" cy="130" r="12" fill="#fff" opacity=".85"/><circle cx="180" cy="150" r="15" fill="#fff" opacity=".85"/><circle cx="235" cy="125" r="11" fill="#fff" opacity=".85"/>` +
    txt(180, 228, '面团：面筋像气球皮兜住气', {fs: 13}) +
    `<ellipse cx="470" cy="130" rx="110" ry="66" fill="#d8a45e"/>` +
    `<path d="M400 118q24 -18 48 0M455 150q24 -18 48 0" fill="none" stroke="#b9884a" stroke-width="4" stroke-linecap="round"/>` +
    txt(470, 228, '烤好：气泡定型，酵母被烤死', {fs: 13}) +
    arrow('M296 140H356', ORANGE) +
    txt(320, 274, '温水（约 30℃）唤醒酵母；开水直接烫死它', {fs: 14}) +
    `<rect x="100" y="292" width="440" height="34" rx="12" fill="#fdeaea"/>` +
    txt(320, 315, '发过头会塌陷发酸——发酵要掐点，酸味多来自杂菌', {fs: 13, fill: '#a4453f'}) +
    '</svg>';

  /* 酿造家族 */
  const brewing = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="酿造家族的菌种接力与安全边界">` + DEFS +
    txt(320, 40, '菌种接力的长队', {fs: 16}) +
    card(50, 66, 540, 118, '#fff', LINE) +
    txt(320, 94, '酿醋的两棒接力', {fs: 14, fill: TEAL}) +
    txt(90, 124, '糖液', {anchor: 'start', fs: 13}) + arrow('M150 120H210', GOLD) +
    txt(222, 120, '酵母产酒精', {fs: 12.5}) + arrow('M320 120H380', GOLD) +
    txt(392, 120, '醋酸菌变醋酸', {fs: 12.5}) + arrow('M492 120H540', TEAL) +
    txt(548, 124, '醋', {anchor: 'start', fs: 13}) +
    txt(90, 158, '酱油：曲霉先拆豆类的蛋白和淀粉，后续发酵接出咸鲜味——霉菌也能当大厨', {anchor: 'start', fs: 13}) +
    `<rect x="60" y="206" width="520" height="54" rx="14" fill="#fdeaea"/>` +
    txt(320, 230, '安全边界：家庭自酿酒不做——杂菌与甲醇风险真实存在', {fs: 13.5, fill: '#a4453f'}) +
    txt(320, 250, '发霉的粮食花生带毒素，长黑斑绿毛的一律不吃', {fs: 13.5, fill: '#a4453f'}) +
    txt(320, 300, '「长毛豆腐都能吃吗？」——只有特定菌种、可控工艺的能吃', {fs: 13}) +
    txt(320, 324, '自然长霉菌种不明——分清「定向发酵」和「放坏了」', {fs: 12.5, fill: MUT}) +
    '</svg>';

  /* ================= 第四室 ================= */

  /* 三道防线 */
  const defense = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="身体的三道防线">` + DEFS +
    txt(320, 40, '病菌来袭，层层设防', {fs: 16}) +
    card(40, 66, 170, 200, '#eef4fb', BLUE) +
    txt(125, 96, '第一道 · 城墙', {fill: BLUE, fs: 14}) +
    `<rect x="70" y="120" width="110" height="56" rx="8" fill="#c9dff5" stroke="#4d96ff" stroke-width="3"/><path d="M70 120h110M70 134h110" stroke="#4d96ff" stroke-width="2"/>` +
    txt(125, 200, '皮肤与黏膜', {fs: 12.5}) +
    txt(125, 222, '挡门＋杀菌分泌物', {fs: 11.5, fill: MUT}) +
    txt(125, 244, '伤口＝城墙缺口', {fs: 11.5, fill: MUT}) +
    card(235, 66, 170, 200, '#eef7f3', TEAL) +
    txt(320, 96, '第二道 · 巡逻', {fill: TEAL, fs: 14}) +
    bug(290, 150, 24, '#bfe6cd', TEAL) + bug(345, 160, 17, '#9fd8b4', TEAL) +
    txt(320, 200, '吞噬细胞', {fs: 12.5}) +
    txt(320, 222, '来者不拒地吞', {fs: 11.5, fill: MUT}) +
    txt(320, 244, '红肿发热是增援', {fs: 11.5, fill: MUT}) +
    card(430, 66, 170, 200, '#f3edfb', PURPLE) +
    txt(515, 96, '第三道 · 记忆', {fill: PURPLE, fs: 14}) +
    `<circle cx="480" cy="150" r="22" fill="#d9c9ee" stroke="#8b65c9" stroke-width="3"/><circle cx="545" cy="160" r="15" fill="#e5d9f5" stroke="#8b65c9" stroke-width="3"/>` +
    txt(515, 200, '淋巴细胞', {fs: 12.5}) +
    txt(515, 222, '精准狙击特定病原', {fs: 11.5, fill: MUT}) +
    txt(515, 244, '打过的架记住了', {fs: 11.5, fill: MUT}) +
    arrow('M212 170H232', MUT) + arrow('M407 170H427', MUT) +
    txt(320, 306, '一层比一层准：挡门 → 抓现行 → 记档案', {fs: 14}) +
    '</svg>';

  /* 白细胞 */
  const whiteCell = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="吞噬细胞的工作流程">` + DEFS +
    txt(320, 40, '一位吞噬细胞的巡逻记录', {fs: 16}) +
    card(40, 70, 170, 120, '#eef7f3', TEAL) +
    txt(125, 98, '① 收到信号', {fs: 13.5}) +
    txt(125, 124, '伤口释放化学气味', {fs: 11.5}) +
    txt(125, 144, '白细胞顺味游过去', {fs: 11.5}) +
    txt(125, 168, '——趋化', {fs: 11.5, fill: MUT}) +
    card(235, 70, 170, 120, '#eef7f3', TEAL) +
    txt(320, 98, '② 包住吞掉', {fs: 13.5}) +
    bug(320, 136, 30, '#bfe6cd', TEAL) +
    bug(336, 128, 9, '#e25563', '#a4453f') +
    txt(320, 168, '伸出伪足裹进体内', {fs: 11.5}) +
    card(430, 70, 170, 120, '#eef7f3', TEAL) +
    txt(515, 98, '③ 摇旗增援', {fs: 13.5}) +
    txt(515, 124, '消化不了的召唤同伴', {fs: 11.5}) +
    txt(515, 144, '脓＝战斗的痕迹', {fs: 11.5}) +
    txt(515, 168, 'B 细胞随后贴标签', {fs: 11.5, fill: MUT}) +
    arrow('M214 130H232', MUT) + arrow('M409 130H427', MUT) +
    `<rect x="80" y="216" width="480" height="80" rx="14" fill="#fdf1ea"/>` +
    txt(320, 246, '抗体：B 细胞造的「标签纸」', {fs: 14, fill: '#a4502b'}) +
    txt(320, 272, '贴上标签的病菌更容易被吞掉，病毒也更难再进细胞', {fs: 12.5}) +
    txt(320, 318, '想看它们怎么赶到小擦伤现场？去人体奥秘站的免疫课', {fs: 13, fill: MUT}) +
    '</svg>';

  /* 疫苗 */
  const vaccine = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="疫苗的安全演练流程">` + DEFS +
    txt(320, 40, '疫苗＝一场安全的演练', {fs: 16}) +
    card(40, 66, 170, 130, '#fff', LINE) +
    txt(125, 96, '① 见「照片」', {fs: 13.5}) +
    bug(125, 140, 26, '#f6d9dc', RED) +
    txt(125, 176, '削弱/灭活的病原', {fs: 11.5}) +
    txt(125, 194, '认得出、不致病', {fs: 11.5, fill: MUT}) +
    card(235, 66, 170, 130, '#fff', LINE) +
    txt(320, 96, '② 练抗体', {fs: 13.5}) +
    `<path d="M290 150q30 -26 60 0t-30 26Z" fill="#e4f3ee" stroke="#2fbf71" stroke-width="3"/>` +
    txt(320, 176, 'B 细胞开工造抗体', {fs: 11.5}) +
    txt(320, 194, 'T 细胞协调演练', {fs: 11.5, fill: MUT}) +
    card(430, 66, 170, 130, '#fff', LINE) +
    txt(515, 96, '③ 存档案', {fs: 13.5}) +
    `<rect x="470" y="118" width="90" height="40" rx="8" fill="#f3edfb" stroke="#8b65c9" stroke-width="3"/>` +
    txt(515, 144, '记忆细胞', {fs: 12}) +
    txt(515, 176, '真病原来时反应快', {fs: 11.5}) +
    txt(515, 194, '就是抢在前面', {fs: 11.5, fill: MUT}) +
    arrow('M214 130H232', MUT) + arrow('M409 130H427', MUT) +
    `<rect x="80" y="222" width="480" height="44" rx="12" fill="#eef4fb"/>` +
    txt(320, 250, '为什么打好几针？多练几次，把记忆「练厚」', {fs: 13.5}) +
    txt(320, 306, '按时接种是国家免疫规划给防线「配装备」；漏种可补种', {fs: 13}) +
    '</svg>';

  /* 发烧 */
  const fever = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="发烧的恒温器原理">` + DEFS +
    txt(320, 40, '身体调高了「恒温器」', {fs: 16}) +
    `<circle cx="210" cy="150" r="62" fill="#fdecea" stroke="#e25563" stroke-width="4"/>` +
    `<rect x="202" y="100" width="16" height="60" rx="8" fill="#e25563"/><circle cx="210" cy="170" r="14" fill="#e25563"/>` +
    txt(210, 238, '体温 ↑ 约 38～39℃', {fs: 13}) +
    arrow('M282 150H352', RED) +
    card(356, 90, 244, 120, '#fff', LINE) +
    txt(478, 118, '发生了什么', {fs: 14}) +
    txt(378, 144, '免疫细胞释放信号，', {anchor: 'start', fs: 12.5}) +
    txt(378, 164, '下丘脑把调定点上调；', {anchor: 'start', fs: 12.5}) +
    txt(378, 184, '部分病原复制变慢、', {anchor: 'start', fs: 12.5}) +
    txt(378, 204, '免疫细胞更活跃。', {anchor: 'start', fs: 12.5}) +
    `<rect x="80" y="252" width="230" height="64" rx="12" fill="#e9f9f0"/>` +
    txt(195, 278, '你的后勤：多喝水、多休息', {fs: 12.5, fill: '#187749'}) +
    txt(195, 300, '退烧是为了舒适', {fs: 11.5, fill: MUT}) +
    `<rect x="330" y="252" width="230" height="64" rx="12" fill="#fdeaea"/>` +
    txt(445, 278, '就医红线：高烧不退、精神差', {fs: 12.5, fill: '#a4453f'}) +
    txt(445, 300, '捂汗退烧不可取', {fs: 11.5, fill: MUT}) +
    '</svg>';

  /* 群体保护 */
  const herd = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="群体保护示意">` + DEFS +
    txt(320, 40, '接种率高了，病原找不到「下家」', {fs: 16}) +
    Array.from({length: 16}, (_, i) => {
      const x = 90 + (i % 8) * 62, y = 100 + Math.floor(i / 8) * 74;
      const shielded = i !== 5 && i !== 10;
      return `<circle cx="${x}" cy="${y}" r="26" fill="${shielded ? '#e4f3ee' : '#fdeaea'}" stroke="${shielded ? GREEN : RED}" stroke-width="3"/>` +
        `<text x="${x}" y="${y + 8}" font-size="20">${shielded ? '🛡️' : '😷'}</text>`;
    }).join('') +
    txt(320, 268, '🛡️ 有保护的人多，传播链就断 —— 没接种的少数人也跟着安全', {fs: 13.5}) +
    `<rect x="80" y="288" width="480" height="38" rx="12" fill="#eef4fb"/>` +
    txt(320, 313, '开窗通风、生病戴口罩、按时洗手——个人习惯汇成群体防线', {fs: 13}) +
    '</svg>';

  /* ================= 第五室 ================= */

  /* 传播路线 */
  const sneeze = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="病菌的五条旅行路线">` + DEFS +
    txt(320, 38, '微生物自己不跑，全靠搭便车', {fs: 16}) +
    [['🤧', '飞沫', '喷嚏一两米，口罩挡它'], ['🖐️', '手', '中转站：摸完再揉眼'],
     ['🚰', '水', '不洁水入肠道，烧开最稳'], ['🍎', '食物', '没洗净的瓜果带菌'],
     ['🦟', '蚊虫', '疟疾登革热的班车']].map(([emoji, name, note], i) => {
      const bx = 52 + (i % 3) * 184, by = 58 + Math.floor(i / 3) * 116;
      return card(bx, by, 168, 100, '#fff', LINE) +
        `<text x="${bx + 84}" y="${by + 40}" font-size="24" text-anchor="middle">${emoji}</text>` +
        txt(bx + 84, by + 66, name, {fs: 13.5}) +
        txt(bx + 84, by + 86, note.slice(0, 12), {fs: 10.5, fill: MUT});
    }).join('') +
    `<rect x="60" y="292" width="520" height="36" rx="12" fill="#eef4fb"/>` +
    txt(320, 316, '打喷嚏用胳膊肘挡：飞沫留在很少参与中转的地方', {fs: 13}) +
    '</svg>';

  /* 七步洗手法 */
  const sevenSteps = () => {
    const steps = [
      ['内', '掌心相对搓泡泡'], ['外', '手背轮流别忘掉'], ['夹', '十指交叉搓指缝'],
      ['弓', '弓起手指转着搓'], ['大', '大拇指握住旋转'], ['立', '指尖立起搓掌心'], ['腕', '手腕也别漏掉'],
    ];
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="七步洗手法口诀">` + DEFS +
      txt(320, 40, '「内、外、夹、弓、大、立、腕」', {fs: 17}) +
      steps.map(([glyph, note], i) => {
        const x = 40 + (i % 4) * 150, y = 66 + Math.floor(i / 4) * 104;
        return card(x, y, 132, 84, '#eef4fb', SKY) +
          `<circle cx="${x + 66}" cy="${y + 32}" r="22" fill="#fff" stroke="${SKY}" stroke-width="3"/>` +
          txt(x + 66, y + 39, glyph, {fs: 16, fill: SKY}) +
          txt(x + 66, y + 70, note, {fs: 11});
      }).join('') +
      `<rect x="90" y="278" width="460" height="44" rx="12" fill="#e4f3ee"/>` +
      txt(320, 300, '肥皂拆下油脂和病菌，流水冲走——干搓等于干扫', {fs: 13, fill: '#187749'}) +
      txt(320, 318, '约 20 秒：唱两遍生日歌', {fs: 12.5, fill: MUT}) +
      '</svg>';
  };

  /* 总结 */
  const conclusion = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="两个驱动问题的回答">` + DEFS +
    card(40, 60, 270, 150, '#eef4fb', BLUE) +
    txt(175, 94, '一滴水里有什么？', {fill: BLUE, fs: 15}) +
    txt(175, 124, '一座挤满居民的城市：', {fs: 13}) +
    txt(175, 146, '原生生物、藻类、细菌，', {fs: 13}) +
    txt(175, 168, '往深处还有 17 万亿亿个', {fs: 13}) +
    txt(175, 190, '水分子。', {fs: 13}) +
    card(330, 60, 270, 150, '#eef7f3', TEAL) +
    txt(465, 94, '细菌是好还是坏？', {fill: TEAL, fs: 15}) +
    txt(465, 124, '看三样：是谁、在哪、', {fs: 13}) +
    txt(465, 146, '有多少。', {fs: 13}) +
    txt(465, 168, '酸奶与肠道菌群是真实的好，', {fs: 13}) +
    txt(465, 190, '致病菌也是真实的坏。', {fs: 13}) +
    `<rect x="60" y="234" width="520" height="56" rx="14" fill="#fdf3e4"/>` +
    txt(320, 260, '把知识变成手上的习惯：认真洗手 · 按时接种 · 公平比较地做实验', {fs: 13.5, fill: '#7a5327'}) +
    txt(320, 318, '微生物是地球的老管家——我们的生活踩在它们的劳动上', {fs: 13}) +
    '</svg>';

  /* ---------- 洗手公平比较台 ---------- */
  const HANDWASH_ROWS = [
    {id: 'no-wash', name: '① 不洗手摸一次', answer: 0,
      reveal: '通常菌落最多——手上的微生物被「印」到了培养面上，肉眼看不见不代表没有。'},
    {id: 'water-only', name: '② 只用清水冲 20 秒', answer: 1,
      reveal: '通常比不洗少：流水冲走了浮着的部分；但油脂里藏着的菌冲不掉多少。'},
    {id: 'soap-20', name: '③ 肥皂搓泡 20 秒', answer: 2,
      reveal: '通常菌落最少：皂液把油脂和病菌从皮肤上拆下来，流水把它们带走。'},
  ];
  const HANDWASH_OPTIONS = [{id: 'many', label: '菌落很多'}, {id: 'middle', label: '菌落中等'}, {id: 'few', label: '菌落较少'}];
  const HANDWASH_KEY = 'microbe_handwash_v1';

  function loadHandwash() {
    try {
      const saved = JSON.parse(localStorage.getItem(HANDWASH_KEY) || '{}');
      return saved && typeof saved === 'object' ? saved : {};
    } catch (e) { return {}; }
  }
  function saveHandwash(state) {
    try { localStorage.setItem(HANDWASH_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function handwashRow(row, state) {
    const guess = state[row.id]?.guess ?? '';
    const guessed = HANDWASH_OPTIONS.some(o => o.id === guess);
    const seen = !!state[row.id]?.seen;
    return `<tr data-handwash-row="${row.id}">` +
      `<th scope="row"><b>${row.name}</b><span class="mb-row-safety">其余条件保持一样</span></th>` +
      `<td><div class="mb-guess">` +
      HANDWASH_OPTIONS.map(o => `<button type="button" class="fig-btn mb-guess-btn" data-mb-act="guess" data-row="${row.id}" data-opt="${o.id}" aria-pressed="${o.id === guess}">${o.label}</button>`).join('') +
      `</div></td>` +
      `<td><button type="button" class="fig-btn" data-mb-act="reveal" data-row="${row.id}" ${guessed ? '' : 'disabled'}>${seen ? '再看一遍' : '揭示参考结果'}</button>` +
      (seen ? `<p class="mb-reveal">${row.reveal}</p>` : '') +
      `<label class="mb-observe-label">我的观察<textarea data-mb-act="observe" data-row="${row.id}" rows="2" placeholder="只写看到、闻到、摸到的…">${state[row.id]?.note || ''}</textarea></label>` +
      `</td></tr>`;
  }
  function handwashTable(state) {
    const done = HANDWASH_ROWS.filter(row => state[row.id]?.guess !== '' && state[row.id]?.guess != null && state[row.id]?.seen).length;
    return `<table class="mb-handwash-table"><thead><tr><th>对照条件</th><th>我猜菌落</th><th>参考结果与我的记录</th></tr></thead>` +
      `<tbody>${HANDWASH_ROWS.map(row => handwashRow(row, state)).join('')}</tbody></table>` +
      `<p class="mb-rec-count" role="status">已记录 ${done} / ${HANDWASH_ROWS.length} 个条件 · 记录只保存在本浏览器</p>`;
  }
  function handwashApply(fig) {
    fig.querySelector('[data-mb-handwash]').innerHTML = handwashTable(loadHandwash());
  }
  function handwashAction(fig, button) {
    const state = loadHandwash();
    const rowId = button.dataset.row;
    state[rowId] = state[rowId] || {};
    if (button.dataset.mbAct === 'guess') state[rowId].guess = button.dataset.opt;
    else if (button.dataset.mbAct === 'reveal') state[rowId].seen = true;
    saveHandwash(state);
    handwashApply(fig);
  }

  const handwash = () => `<div class="mb-handwash" data-mb-handwash>` +
    `<p class="mb-handwash-safety">🧪 真培养需要家长准备材料；更省事的家庭版是「三片面包」：对照、脏手摸、洗手后摸，各自装袋标日期，几天后比较霉斑。</p>` +
    `<div data-mb-handwash-table>${handwashTable(loadHandwash())}</div>` +
    `<p class="mb-handwash-note">公平比较的规矩：同样的取样地方、同样的温度和时间，只改「怎么洗手」这一个条件；一次结果只是线索，多轮重复才下结论。</p>` +
    `</div>`;

  /* ---------- 注册表 ---------- */
  const REG = {
    'mb-bn-mm1': bannerMm1, 'mb-bn-mm2': bannerMm2, 'mb-bn-mm3': bannerMm3,
    'mb-bn-mm4': bannerMm4, 'mb-bn-mm5': bannerMm5,
    'microbe-pond-drop': pondDrop, 'microbe-family': family,
    'microbe-life-question': lifeQuestion, 'microbe-goodbad': goodbad,
    'microbe-microscopes': microscopes, 'microbe-resolution': resolution,
    'microbe-units': units, 'microbe-scale-lab': scaleLab,
    'microbe-ferment-map': fermentMap, 'microbe-yogurt': yogurt,
    'microbe-bread': bread, 'microbe-brewing': brewing,
    'microbe-defense': defense, 'microbe-white-cell': whiteCell,
    'microbe-vaccine': vaccine, 'microbe-fever': fever,
    'microbe-herd': herd, 'microbe-sneeze': sneeze,
    'microbe-handwash': handwash, 'microbe-seven-steps': sevenSteps,
    'microbe-conclusion': conclusion,
  };

  const DEFAULT_CAPS = {
    'microbe-pond-drop': '一滴水＝一座微生物居民楼',
    'microbe-family': '四大家族按典型大小排：原生 > 真菌 > 细菌 > 病毒',
    'microbe-life-question': '病毒处在生命与非生命的边界，摆证据不背答案',
    'microbe-goodbad': '细菌无好坏：是谁、在哪、有多少',
    'microbe-microscopes': '三代「眼睛」接力：磨镜片 → 光学 → 电子',
    'microbe-resolution': '放大是把图拉大，分辨率才是看得清',
    'microbe-units': '毫到微、微到纳，一级一千倍',
    'microbe-scale-lab': '尺度缩放台：从头发丝放大到水分子',
    'microbe-ferment-map': '发酵＝微生物吃饭，人类收成果',
    'microbe-yogurt': '酸奶四步：煮沸清场 → 放凉接种 → 保温 → 凝固',
    'microbe-bread': '酵母吃糖吐气泡，面筋兜气面包暄',
    'microbe-brewing': '认菌下菜：定向发酵能吃，野霉不请',
    'microbe-defense': '三道防线：挡门 → 抓现行 → 记档案',
    'microbe-white-cell': '趋化赶到、包住吞掉、摇旗增援',
    'microbe-vaccine': '疫苗是演练：见照片、练抗体、存档案',
    'microbe-fever': '发烧是防御反应；后勤是补水休息',
    'microbe-herd': '人人一环，网才结实',
    'microbe-sneeze': '病菌搭便车：沫、手、水、食、虫',
    'microbe-handwash': '洗手公平比较台：先猜、再对、记观察',
    'microbe-seven-steps': '内外夹弓大立腕，皂泡流水二十秒',
    'microbe-conclusion': '一滴水一座城，一菌三问定身份',
    'mb-bn-mm1': '', 'mb-bn-mm2': '', 'mb-bn-mm3': '', 'mb-bn-mm4': '', 'mb-bn-mm5': '',
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
      const button = e.target.closest('[data-mb-act]');
      if (!button || button.disabled || button.dataset.mbAct === 'observe') return;
      const fig = button.closest('.fig');
      if (!fig) return;
      if (['guess', 'reveal'].includes(button.dataset.mbAct)) handwashAction(fig, button);
    });
    doc.addEventListener('input', e => {
      if (!e.target.matches?.('textarea[data-mb-act="observe"]')) return;
      const fig = e.target.closest('.fig');
      if (!fig) return;
      const state = loadHandwash();
      const rowId = e.target.dataset.row;
      state[rowId] = state[rowId] || {};
      state[rowId].note = e.target.value;
      saveHandwash(state);
    });
  }

  if (typeof document !== 'undefined') {
    bindDelegates(document);
    const initIn = root => {
      root.querySelectorAll('.fig').forEach(fig => {
        window.MicrobeScale?.mount?.(fig);
        const id = fig.dataset.fig;
        if (id === 'microbe-handwash' && !fig.dataset.init) {
          handwashApply(fig);
          fig.dataset.init = '1';
        }
      });
    };
    const mo = new MutationObserver(muts => {
      window.MicrobeScale?.prune?.();
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
  module.exports = MicrobeFigures;
}
if (typeof window !== 'undefined') {
  window.MicrobeFigures = MicrobeFigures;
}

/* ============================================================
   乐学堂 · 食物的旅行 —— 图示库
   - 纯 SVG 插图，离线可用，打印友好
   - 三个实验台（溯源/传播地图/营养搭配）由 food-labs.js 渲染
   - 数据里用 fig: 'fd-xxx' 引用
   ============================================================ */
'use strict';

const FoodFigures = (() => {
  const INK = '#34384d';
  const MUT = '#73788b';
  const LINE = '#dfe5f0';
  const BLUE = '#4d96ff';
  const GREEN = '#2fbf71';
  const TEAL = '#157d73';
  const PURPLE = '#8b65c9';
  const ORANGE = '#d97745';
  const GOLD = '#e6b23c';
  const RED = '#e0526d';
  const PINK = '#e0526d';

  /* ---------- 小工具 ---------- */
  const txt = (x, y, s, opt = {}) =>
    `<text x="${x}" y="${y}" fill="${opt.fill || INK}" font-size="${opt.fs || 14}"` +
    ` font-weight="${opt.fw || 700}" text-anchor="${opt.anchor || 'middle'}"${opt.cls ? ` class="${opt.cls}"` : ''}>${s}</text>`;
  const card = (x, y, w, h, fill, stroke, rx = 14) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="2"` : ''}/>`;
  const arrow = (d, color = MUT, width = 3, dash = '') =>
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''} marker-end="url(#fd-arrow)"/>`;
  const DEFS = `<defs><marker id="fd-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${MUT}"/></marker></defs>`;
  /* 简化世界底图（与 food-labs.js 的传播地图共用同一套大陆轮廓）。 */
  const WORLD_BLOBS = [
    {name: '北美洲', d: 'M42,88 L74,52 L128,40 L176,52 L196,84 L184,112 L156,130 L112,126 L76,116 Z', cx: 118, cy: 86},
    {name: '南美洲', d: 'M146,150 L176,142 L198,162 L204,196 L192,232 L172,258 L158,252 L148,220 L138,186 Z', cx: 174, cy: 200},
    {name: '欧洲', d: 'M282,66 L318,48 L348,54 L358,76 L344,96 L312,102 L290,92 Z', cx: 318, cy: 76},
    {name: '非洲', d: 'M288,112 L332,104 L362,124 L372,160 L356,204 L332,228 L310,212 L296,172 L284,142 Z', cx: 328, cy: 168},
    {name: '亚洲', d: 'M356,44 L420,32 L492,44 L540,68 L552,96 L520,116 L478,124 L436,116 L396,104 L362,96 L348,68 Z', cx: 452, cy: 80},
    {name: '大洋洲', d: 'M496,208 L544,200 L572,220 L564,248 L528,258 L502,240 Z', cx: 534, cy: 228},
  ];
  const worldBase = () => WORLD_BLOBS.map(b =>
    `<path d="${b.d}" fill="#cfd8e4" opacity=".6" stroke="#c4cfdf" stroke-width="1.5"/>` +
    `<text x="${b.cx}" y="${b.cy}" fill="#5d6577" font-size="12.5" font-weight="700" text-anchor="middle">${b.name}</text>`).join('');

  /* ---------- 横幅 ---------- */
  const banner = (emoji, name, color) => {
    const light = color + '26';
    return `<svg class="fig-svg" viewBox="0 0 640 110" role="img" aria-label="${name}横幅">` +
      `<rect width="640" height="110" rx="16" fill="${light}"/>` +
      `<circle cx="588" cy="26" r="34" fill="${color}" opacity=".18"/>` +
      `<circle cx="62" cy="86" r="26" fill="${color}" opacity=".14"/>` +
      `<circle cx="528" cy="88" r="10" fill="${color}" opacity=".2" class="fd-float"/>` +
      `<circle cx="118" cy="30" r="7" fill="${color}" opacity=".22" class="fd-float fd-d2"/>` +
      `<text x="56" y="72" font-size="52">${emoji}</text>` +
      txt(124, 66, name, {fill: color, fs: 30, fw: 900, anchor: 'start'}) + '</svg>';
  };
  const bannerFd1 = () => banner('🌾', '一粒米的旅行 · 从田间到餐桌', GREEN);
  const bannerFd2 = () => banner('🗺️', '作物的环球旅行 · 老家与迁徙', ORANGE);
  const bannerFd3 = () => banner('🍽️', '吃进去之后 · 营养与消化', PINK);
  const bannerFd4 = () => banner('🥢', '餐桌上的文化 · 节日与食俗', PURPLE);
  const bannerFd5 = () => banner('⚗️', '食物里的科学 · 厨房实验课', TEAL);

  /* ================= 第一站 ================= */

  const originLab = () => {
    if (typeof window !== 'undefined') {
      const html = window.FoodLabs?.originHTML?.();
      if (html) return html;
    }
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="这餐从哪来溯源台静态示意">` +
      `<rect x="8" y="8" width="624" height="324" rx="16" fill="#eefaf3"/>` +
      txt(320, 150, '这餐从哪来 · 溯源台', {fs: 18}) +
      txt(320, 186, '选一顿饭，点开食材，一步步走完它的旅行', {fs: 14, fill: MUT}) +
      '</svg>';
  };

  const riceJourney = () => {
    const steps = [
      ['1', '育秧', '把稻种先育成小秧苗', '🌱'],
      ['2', '插秧', '秧苗搬进水田安家', '🌿'],
      ['3', '田间管理', '蓄水施肥除虫', '💧'],
      ['4', '收割', '金黄稻穗脱粒', '🌾'],
      ['5', '晾晒', '晒到干燥不发霉', '☀️'],
      ['6', '脱壳', '剥掉外壳变糙米', '🍚'],
      ['7', '碾米', '磨掉米糠变白米', '✨'],
    ];
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="一粒稻谷变成米饭的七道工序">` + DEFS +
      txt(320, 40, '一碗白米饭 = 七道工序 + 大半年', {fs: 16}) +
      steps.slice(0, 4).map(([n, name, note, emoji], i) => {
        const x = 92 + i * 152;
        return card(x - 66, 66, 132, 104, '#eefaf3', GREEN) +
          txt(x, 96, emoji, {fs: 24}) +
          txt(x, 122, `${n}. ${name}`, {fs: 14.5, fill: '#187749'}) +
          txt(x, 146, note, {fs: 10.5, fill: MUT});
      }).join('') +
      steps.slice(4).map(([n, name, note, emoji], i) => {
        const x = 168 + i * 152;
        return card(x - 66, 186, 132, 104, '#eefaf3', GREEN) +
          txt(x, 216, emoji, {fs: 24}) +
          txt(x, 242, `${n}. ${name}`, {fs: 14.5, fill: '#187749'}) +
          txt(x, 266, note, {fs: 10.5, fill: MUT});
      }).join('') +
      txt(320, 316, '糙米只脱壳、保留米糠层；白米再磨掉糠层——口感换软了，纤维维生素少了一截', {fs: 12.5}) +
      '</svg>';
  };

  const farmingYear = () => {
    const seasons = [
      ['春', '春种', '清明前后育秧播种·种瓜点豆', '#2fbf71', '🌱'],
      ['夏', '夏长', '芒种抢收麦抢插秧·田间蓄水', '#4d96ff', '☀️'],
      ['秋', '秋收', '秋分前后收割晾晒入仓', '#d97745', '🍂'],
      ['冬', '冬藏', '粮食进仓土地休整·冬麦盖雪被', '#8b65c9', '❄️'],
    ];
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="跟着节气种庄稼的农事年历">` +
      txt(320, 40, '农事年历：春种·夏长·秋收·冬藏', {fs: 16}) +
      seasons.map(([se, act, note, color, emoji], i) => {
        const y = 66 + i * 62;
        return card(72, y, 496, 50, '#f7fbf8', LINE, 12) +
          `<rect x="72" y="${y}" width="8" height="50" rx="4" fill="${color}"/>` +
          txt(104, y + 32, emoji, {fs: 22}) +
          txt(150, y + 26, `${se}季 · ${act}`, {fill: color, fs: 15, anchor: 'start'}) +
          txt(150, y + 43, note, {fs: 11.5, fill: MUT, fw: 600, anchor: 'start'});
      }).join('') +
      txt(320, 322, '节气是太阳位置的刻度，年年准时；各地农民再按本地冷暖微调农时', {fs: 12.5, fill: MUT}) +
      '</svg>';
  };

  const coldChain = () => {
    const nodes = [
      ['🌿', '产地预冷', '摘下就降温', '果园冷库'],
      ['🚚', '冷藏车', '恒温运输', '全程 0～4℃'],
      ['🏭', '冷库中转', '分拨暂存', '昼夜低温'],
      ['🏪', '超市冷柜', '最后一段', '随手关门'],
      ['🍽️', '你的餐桌', '新鲜到家', '温度不断档'],
    ];
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="冷链不断温的接力">` + DEFS +
      txt(320, 40, '冷链 = 温度全程不断档', {fs: 16}) +
      nodes.map(([emoji, name, note, tag], i) => {
        const x = 84 + i * 118;
        return card(x - 52, 76, 104, 108, '#eef4fb', BLUE, 12) +
          txt(x, 110, emoji, {fs: 24}) +
          txt(x, 134, name, {fs: 13.5}) +
          txt(x, 152, note, {fs: 10.5, fill: MUT}) +
          txt(x, 170, tag, {fs: 10, fill: '#2b5f8f', fw: 800});
      }).join('') +
      [0, 1, 2, 3].map(i => arrow(`M${84 + i * 118 + 54},130 L${84 + (i + 1) * 118 - 56},130`, BLUE, 3)).join('') +
      txt(320, 224, '❄️ 任何一环断了温，细菌就在路上「先吃一口」', {fs: 13.5, fill: '#2b5f8f'}) +
      txt(320, 256, '低温 ≠ 杀菌：冷藏让微生物慢动作，冷冻按暂停键——时间久了风味照样下降', {fs: 12.5, fill: MUT}) +
      txt(320, 288, '荔枝「一日色变」：靠预冷＋气调包装＋冷链空运，两天内进超市', {fs: 12.5, fill: MUT}) +
      '</svg>';
  };

  /* ================= 第二站 ================= */

  const cropOrigins = () => {
    const crops = [
      ['🌾', '小麦', '西亚 · 新月沃地', 355, 103, ORANGE, 96, 128],
      ['🌾', '水稻', '长江流域', 450, 103, GREEN, 486, 128],
      ['🌽', '玉米', '墨西哥一带', 138, 112, GOLD, 118, 148],
      ['🥔', '马铃薯', '安第斯山区', 152, 195, PURPLE, 152, 232],
    ];
    return `<svg class="fig-svg" viewBox="0 0 640 330" role="img" aria-label="四大作物各自的老家">` +
      txt(320, 36, '四大作物的老家：不同大陆，各自驯化', {fs: 16}) +
      worldBase() +
      crops.map(([emoji, name, home, x, y, color, tx, ty]) =>
        `<circle cx="${x}" cy="${y}" r="8" fill="${color}" stroke="#fff" stroke-width="2" class="fd-float"/>` +
        txt(x, ty, `${emoji} ${name} · ${home}`, {fill: color, fs: 12.5, fw: 800, anchor: tx === x ? 'middle' : 'middle'})).join('') +
      txt(320, 292, '驯化 = 把当地最有潜力的野生植物一代代挑着种——几百上千代人的共同工作', {fs: 12.5}) +
      txt(320, 314, '今天它们都已是全球作物：一桌饭，常常是几大洲的合影', {fs: 12, fill: MUT}) +
      '</svg>';
  };

  const silkFood = () => {
    const inItems = ['葡萄 🍇', '核桃 🌰', '石榴 🔴', '胡萝卜 🥕'];
    const outItems = ['桃 🍑', '杏 🟠', '茶 🍵'];
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="丝绸之路上的食物双向交流">` + DEFS +
      txt(320, 40, '丝路餐桌：驼队运来了什么，又带走了什么', {fs: 16}) +
      card(48, 66, 268, 150, '#fbf3ea', ORANGE) +
      txt(182, 96, '传入中国（名字常带「胡」）', {fill: '#a4562e', fs: 14}) +
      inItems.map((it, i) => card(72 + (i % 2) * 118, 112 + Math.floor(i / 2) * 44, 108, 34, '#fff', LINE, 8) +
        txt(126 + (i % 2) * 118, 134 + Math.floor(i / 2) * 44, it, {fs: 12.5})).join('') +
      card(324, 66, 268, 150, '#eef7f0', GREEN) +
      txt(458, 96, '从中国传出（走向西方）', {fill: '#187749', fs: 14}) +
      outItems.map((it, i) => card(348 + i * 84, 118, 74, 34, '#fff', LINE, 8) +
        txt(385 + i * 84, 140, it, {fs: 12.5})).join('') +
      txt(458, 192, '波斯语里桃就叫「中国果」', {fs: 11, fill: MUT}) +
      arrow('M240,246 L400,246', ORANGE, 3.4) + txt(320, 238, '骆驼商队 · 双向流动', {fs: 12, fill: MUT}) +
      txt(320, 282, '小窍门：「胡」字辈汉唐陆路来，「番」「洋」字辈明清海路来——名字就是时间戳', {fs: 12.5}) +
      txt(320, 310, '食物交流也是文化交流：做法、酿法跟着原料一起搬家', {fs: 12, fill: MUT}) +
      '</svg>';
  };

  const columbusSwap = () => {
    const toOld = ['玉米 🌽', '马铃薯 🥔', '红薯 🍠', '花生 🥜', '番茄 🍅', '辣椒 🌶️'];
    const toNew = ['小麦 🌾', '水稻 🌾', '甘蔗 🎍', '马牛羊 🐄'];
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="哥伦布交换：新旧大陆作物互换">` + DEFS +
      txt(320, 40, '哥伦布交换（1492 年后）：两张餐桌互换特产', {fs: 16}) +
      card(40, 62, 190, 210, '#fdf6ec', GOLD) +
      txt(135, 90, '美洲 → 旧大陆', {fill: '#a4741d', fs: 14.5}) +
      toOld.map((it, i) => txt(135, 118 + i * 25, it, {fs: 12.5})).join('') +
      card(410, 62, 190, 210, '#eef4fb', BLUE) +
      txt(505, 90, '旧大陆 → 美洲', {fill: '#2b5f8f', fs: 14.5}) +
      toNew.map((it, i) => txt(505, 124 + i * 30, it, {fs: 13})).join('') +
      arrow('M232,150 L408,110', GOLD, 3.6) + arrow('M408,190 L232,230', BLUE, 3.6) +
      txt(320, 90, '🚢 大西洋航线', {fs: 12.5, fill: MUT}) +
      txt(320, 300, '玉米红薯耐旱耐瘠，山地也能种——明清人口增长的粮食账里有它们；辣椒进中国，才有今天的川菜', {fs: 12}) +
      '</svg>';
  };

  const spreadLab = () => {
    if (typeof window !== 'undefined') {
      const html = window.FoodLabs?.spreadHTML?.();
      if (html) return html;
    }
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="作物传播时间线地图静态示意">` +
      `<rect x="8" y="8" width="624" height="324" rx="16" fill="#fdf6ec"/>` +
      txt(320, 150, '作物传播时间线地图', {fs: 18}) +
      txt(320, 186, '选作物，拖年代滑块，看传播箭头随时间点亮', {fs: 14, fill: MUT}) +
      '</svg>';
  };

  /* ================= 第三站 ================= */

  const nutrients = () => {
    const items = [
      ['🍚', '碳水化合物', '快燃料 · 主食供能', '#d97745'],
      ['🥚', '蛋白质', '建筑材料 · 长肌肉', '#4d96ff'],
      ['🥜', '脂肪', '储备燃料 · 适量最好', '#e6b23c'],
      ['🥦', '维生素', '量小活大的扳手', '#2fbf71'],
      ['🧂', '矿物质', '骨骼血液都要它', '#8b65c9'],
      ['💧', '水', '运输车 · 每天六八杯', '#2f9bd6'],
    ];
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="食物里的六大营养素">` +
      txt(320, 40, '身体的六种原料：三样供能搭房，三样护航', {fs: 16}) +
      items.map(([emoji, name, note, color], i) => {
        const x = 116 + (i % 3) * 204, y = 76 + Math.floor(i / 3) * 116;
        return card(x - 92, y, 184, 96, '#fafbfe', LINE, 12) +
          `<rect x="${x - 92}" y="${y}" width="184" height="96" rx="12" fill="none" stroke="${color}" stroke-width="2.5"/>` +
          txt(x - 56, y + 40, emoji, {fs: 26}) +
          txt(x + 22, y + 36, name, {fs: 14.5, fill: color}) +
          txt(x + 22, y + 60, note, {fs: 11, fill: MUT, fw: 600});
      }).join('') +
      txt(320, 318, '没有「超级食物」——六样原料按比例到货，身体这台机器才转得顺', {fs: 12.5}) +
      '</svg>';
  };

  const digestionMap = () => {
    const stops = [
      ['👄', '口腔', '切碎润湿', '唾液分解淀粉', '几十秒'],
      ['🫲', '食道', '蠕动推挤', '倒立也能吃饭', '几秒'],
      ['🫀', '胃', '胃酸消毒', '搅拌成食糜', '2～4 小时'],
      ['🌀', '小肠', '吸收主战场', '绒毛吸营养', '3～5 小时'],
      ['🧻', '大肠', '回收水分', '细菌收尾', '十几小时'],
    ];
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="一口食物的消化之旅">` + DEFS +
      txt(320, 40, '消化流水线：约 9 米管道，走一整天', {fs: 16}) +
      stops.map(([emoji, name, act, note, time], i) => {
        const x = 84 + i * 118;
        return card(x - 52, 70, 104, 130, '#fdf1f3', PINK, 12) +
          txt(x, 104, emoji, {fs: 24}) +
          txt(x, 128, name, {fs: 14, fill: '#b04a5a'}) +
          txt(x, 148, act, {fs: 11, fw: 700}) +
          txt(x, 166, note, {fs: 10, fill: MUT, fw: 600}) +
          txt(x, 186, time, {fs: 10.5, fill: '#b04a5a', fw: 800});
      }).join('') +
      [0, 1, 2, 3].map(i => arrow(`M${84 + i * 118 + 54},135 L${84 + (i + 1) * 118 - 56},135`, PINK, 3)).join('') +
      txt(320, 244, '吸收主要在小肠——胃只负责搅碎和消毒', {fs: 13, fill: '#b04a5a'}) +
      txt(320, 276, '细嚼 20 下：牙齿多干一点活，胃就少加一次班', {fs: 12.5}) +
      txt(320, 306, '消化腺的酶是化学剪刀，器官蠕动是物理搅拌——双管齐下', {fs: 12, fill: MUT}) +
      '</svg>';
  };

  const nutrientAbsorb = () => {
    const paths = [
      ['糖、氨基酸', '→ 血液 → 先去肝脏质检 → 全身供能与建造', BLUE],
      ['脂肪酸', '→ 淋巴 → 绕行汇入血液 → 供能或入库', GOLD],
    ];
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="营养怎样被吸收利用">` + DEFS +
      txt(320, 40, '小肠绒毛：把吸收面积撑成一个羽毛球场', {fs: 16}) +
      card(60, 66, 240, 150, '#fafbfe', LINE) +
      txt(180, 94, '小肠内壁', {fs: 13.5}) +
      Array.from({length: 7}, (_, r) => Array.from({length: 5}, (_, c) =>
        `<circle cx="${92 + c * 38}" cy="${116 + r * 15}" r="6.5" fill="${(r + c) % 2 ? '#f6c6d0' : '#f2d3da'}"/>`).join('')).join('') +
      txt(180, 206, '绒毛 + 微绒毛 = 「刷毛地毯」', {fs: 11.5, fill: MUT}) +
      card(360, 66, 220, 150, '#eef4fb', BLUE) +
      txt(470, 94, '吸收后的分流', {fs: 13.5}) +
      paths.map(([name, route, color], i) =>
        txt(470, 124 + i * 44, name, {fill: color === BLUE ? '#2b5f8f' : '#a4741d', fs: 13}) +
        txt(470, 142 + i * 44, route, {fs: 9.8, fill: MUT, fw: 600})).join('') +
      arrow('M304,140 L356,140', MUT, 3) +
      txt(320, 252, '三个去向：立刻供能 · 修建造材 · 存进仓库（备用油箱）', {fs: 13}) +
      txt(320, 284, '大脑只认葡萄糖当燃料，约占全身耗能两成——不吃早饭，上午电量不足', {fs: 12.5}) +
      txt(320, 312, '「吃什么补什么」是误会：蛋白质要拆成氨基酸，再由身体重新组装', {fs: 12, fill: MUT}) +
      '</svg>';
  };

  const mealLab = () => {
    if (typeof window !== 'undefined') {
      const html = window.FoodLabs?.mealHTML?.();
      if (html) return html;
    }
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="一餐营养搭配模拟器静态示意">` +
      `<rect x="8" y="8" width="624" height="324" rx="16" fill="#eefaf3"/>` +
      txt(320, 150, '一餐营养搭配模拟器', {fs: 18}) +
      txt(320, 186, '主食 + 蛋白质 + 蔬菜 + 水果 + 饮品，搭好来评价', {fs: 14, fill: MUT}) +
      '</svg>';
  };

  /* ================= 第四站 ================= */

  const festivalFoods = () => {
    const fests = [
      ['春节', '🥟 饺子 / 🍡 年糕', '元宝招财 · 年年高'],
      ['元宵节', '⚪ 汤圆', '团团圆圆'],
      ['清明节', '🟢 青团', '春天的田野味'],
      ['端午节', '🍙 粽子', '叶包米 · 纪念屈原'],
      ['中秋节', '🥮 月饼', '圆如满月 · 分着吃'],
      ['腊八节', '🥣 腊八粥', '一年收成熬一锅'],
    ];
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="节日餐桌上的指定食物">` +
      txt(320, 40, '节日餐桌：把祝福做成可以吃的形状', {fs: 16}) +
      fests.map(([name, food, wish], i) => {
        const x = 116 + (i % 3) * 204, y = 72 + Math.floor(i / 3) * 108;
        return card(x - 92, y, 184, 88, '#f9f6fc', PURPLE, 12) +
          txt(x - 92 + 16, y + 28, name, {fill: '#5f4a8f', fs: 14, anchor: 'start', fw: 900}) +
          txt(x, y + 56, food, {fs: 13.5}) +
          txt(x, y + 76, wish, {fs: 10.5, fill: MUT, fw: 600});
      }).join('') +
      txt(320, 318, '形状圆＝团圆，包起来＝把心愿封存——先看形状，再猜祝福', {fs: 12.5}) +
      '</svg>';
  };

  const stapleMap = () => {
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="南米北面的主食地图">` + DEFS +
      txt(320, 40, '南米北面：主食口味背后是水土', {fs: 16}) +
      card(60, 62, 240, 200, '#eefaf3', GREEN) +
      txt(180, 94, '南方 · 水稻区', {fill: '#187749', fs: 15}) +
      txt(180, 122, '温湿多雨，河网密', {fs: 12, fill: MUT}) +
      txt(180, 152, '🍚 米饭当家', {fs: 15}) +
      txt(180, 180, '米粉 · 米线 · 汤圆', {fs: 12, fill: MUT}) +
      txt(180, 214, '东北水源足，也是大稻区', {fs: 11, fill: '#187749', fw: 600}) +
      card(340, 62, 240, 200, '#fdf6ec', ORANGE) +
      txt(460, 94, '北方 · 小麦区', {fill: '#a4562e', fs: 15}) +
      txt(460, 122, '冬季冷、降水少', {fs: 12, fill: MUT}) +
      txt(460, 152, '🍜 面食坐庄', {fs: 15}) +
      txt(460, 180, '馒头 · 面条 · 饺子 · 烙饼', {fs: 12, fill: MUT}) +
      txt(460, 214, '小麦必须磨粉再塑形', {fs: 11, fill: '#a4562e', fw: 600}) +
      arrow('M304,162 L336,162', '#5f4a8f', 3.4) +
      card(296, 170, 48, 22, '#f2ecf9', '#8b65c9', 6) +
      txt(320, 185, '秦淮线', {fs: 10.5, fill: '#5f4a8f'}) +
      txt(320, 296, '米脱壳就能煮，麦要磨粉再做——面食花样多，是被面粉「逼」出来的创造力', {fs: 12}) +
      '</svg>';
  };

  const termFoods = () => {
    const terms = [
      ['立春', '咬春', '春饼、萝卜，一口脆生迎春天', '🌱'],
      ['清明', '青团', '艾草汁染绿的糯米团子', '🌿'],
      ['冬至', '饺子 · 汤圆', '北捏饺子南搓汤圆，进补充电', '❄️'],
      ['腊八', '腊八粥', '多种谷物豆子熬一锅', '🥣'],
    ];
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="节气里的食俗">` +
      txt(320, 40, '节气食俗：能吃的日历', {fs: 16}) +
      terms.map(([term, food, note, emoji], i) => {
        const y = 64 + i * 60;
        return card(72, y, 496, 50, '#f7f5fb', LINE, 12) +
          `<rect x="72" y="${y}" width="8" height="50" rx="4" fill="${PURPLE}"/>` +
          txt(106, y + 32, emoji, {fs: 22}) +
          txt(148, y + 26, `${term} · 吃${food}`, {fill: '#5f4a8f', fs: 14.5, anchor: 'start'}) +
          txt(148, y + 44, note, {fs: 11.5, fill: MUT, fw: 600, anchor: 'start'});
      }).join('') +
      txt(320, 318, '当季食材最好找也最合身体需要——顺季而食，土地和身体一起省力', {fs: 12.5, fill: MUT}) +
      '</svg>';
  };

  const tableManners = () => {
    const rules = [
      ['🥢', '筷子不插饭、不敲碗', '像祭祀、像乞讨的样子要避开'],
      ['👵', '长辈先动筷', '餐桌是最容易练「礼」的地方'],
      ['🍚', '按量取餐不剩饭', '不够再点，永远比扔掉体面'],
      ['📦', '吃不完就打包', '光盘行动，从一餐练起'],
    ];
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="餐桌礼仪与珍惜粮食">` +
      txt(320, 40, '餐桌上的规矩：对食物和劳动者说谢谢', {fs: 16}) +
      rules.map(([emoji, rule, note], i) => {
        const y = 64 + i * 58;
        return card(72, y, 496, 48, '#fafbfe', LINE, 12) +
          txt(104, y + 31, emoji, {fs: 21}) +
          txt(146, y + 24, rule, {fs: 14, anchor: 'start', fw: 800}) +
          txt(146, y + 42, note, {fs: 11, fill: MUT, fw: 600, anchor: 'start'});
      }).join('') +
      txt(320, 300, '一碗饭 ≈ 4000 粒稻谷 + 几吨水 + 大半年——数字记牢，剩饭难以下咽', {fs: 12.5, fill: '#187749'}) +
      '</svg>';
  };

  /* ================= 第五站 ================= */

  const cookingChem = () => {
    const zones = [
      ['水煮 / 蒸', '约 100℃', '熟了，但不褐变', '#2f9bd6', '蛋清变白 · 蛋白质变性'],
      ['煎 / 炒', '约 140℃ 起', '美拉德反应开工', '#d97745', '焦香、褐色脆皮'],
      ['烤 / 焙', '约 160℃+', '焦糖化 + 美拉德', '#a4562e', '面包外壳 · 拔丝糖衣'],
      ['烧过头', '更高', '碳化发苦', '#5b5b66', '变苦还产生不健康物质'],
    ];
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="烹饪温度与化学反应">` + DEFS +
      txt(320, 40, '厨房温度线：香味是「化学反应开课」的信号', {fs: 16}) +
      arrow('M70,282 L580,282', MUT, 3.4) +
      zones.map(([name, temp, act, color, note], i) => {
        const x = 118 + i * 132;
        return card(x - 62, 74, 124, 96, '#fafbfe', color, 12) +
          txt(x, 100, name, {fill: color, fs: 13.5}) +
          txt(x, 122, temp, {fs: 12, fw: 800, fill: color}) +
          txt(x, 144, act, {fs: 11, fw: 700}) +
          txt(x, 164, note, {fs: 9.6, fill: MUT, fw: 600}) +
          `<rect x="${x - 44}" y="${296 - (i + 1) * 34}" width="88" height="${(i + 1) * 34 - 22}" rx="6" fill="${color}" opacity=".22"/>`;
      }).join('') +
      txt(320, 240, '美拉德反应：糖类 + 氨基酸 → 上百种香气物质（烤煎焙的「香」都归它管）', {fs: 12.5}) +
      txt(320, 318, '大火爆香、小火慢炖——火候就是在选反应条件', {fs: 12, fill: MUT}) +
      '</svg>';
  };

  const fermentation = () => {
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="发酵小厨师的工作原理">` + DEFS +
      txt(320, 40, '看不见的小厨师：酵母与乳酸菌', {fs: 16}) +
      card(48, 66, 268, 176, '#fdf6ec', GOLD) +
      txt(182, 96, '酵母发面', {fill: '#a4741d', fs: 14.5}) +
      txt(182, 124, '吃糖 → 吐二氧化碳', {fs: 13}) +
      Array.from({length: 5}, (_, i) =>
        `<circle cx="${120 + i * 34}" cy="${162 + (i % 2) * 12}" r="${7 + i}" fill="none" stroke="#d9a13c" stroke-width="2" opacity="${0.4 + i * 0.12}"/>`).join('') +
      txt(182, 200, '气泡受热膨胀 → 馒头暄软多孔', {fs: 11.5, fill: MUT}) +
      txt(182, 222, '最爱 28～32℃，60℃ 以上烫死', {fs: 11.5, fill: '#a4741d', fw: 700}) +
      card(324, 66, 268, 176, '#eefaf3', GREEN) +
      txt(458, 96, '乳酸菌做酸奶泡菜', {fill: '#187749', fs: 14.5}) +
      txt(458, 124, '把糖变成乳酸', {fs: 13}) +
      Array.from({length: 6}, (_, i) =>
        `<circle cx="${392 + (i % 3) * 42}" cy="${152 + Math.floor(i / 3) * 34}" r="9" fill="#2fbf71" opacity=".55"/>`).join('') +
      txt(458, 200, '酸环境反过来挡住坏细菌', {fs: 11.5, fill: MUT}) +
      txt(458, 222, '酸奶、泡菜、奶酪都是「好菌上岗」', {fs: 11.5, fill: '#187749', fw: 700}) +
      txt(320, 284, '发酵也是保存：酸城墙一筑好，泡菜能放几个月', {fs: 12.5}) +
      txt(320, 312, '发面放温暖处 = 给酵母开暖气；气泡不是面粉自己发的，是活菌在干活', {fs: 12, fill: MUT}) +
      '</svg>';
  };

  const preserve = () => {
    const ways = [
      ['☀️', '干燥', '抽走水分，细菌没法开伙', '葡萄干 · 米面 · 奶粉'],
      ['🧂', '腌制糖渍', '高盐高糖把水「吸」出来', '咸菜 · 果脯 · 蜂蜜'],
      ['🧊', '低温', '冷藏慢动作 · 冷冻暂停键', '冰箱 · 冷链'],
      ['🥫', '密封灭菌', '高温灭菌后完全封死', '罐头可放数年'],
    ];
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="保存食物的四种科学方法">` +
      txt(320, 40, '把食物留住：卡住微生物的生存条件', {fs: 16}) +
      ways.map(([emoji, name, how, eg], i) => {
        const x = 116 + (i % 2) * 260, y = 66 + Math.floor(i / 2) * 110;
        return card(x - 118, y, 236, 92, '#f0f7fb', TEAL, 12) +
          txt(x - 92, y + 40, emoji, {fs: 25}) +
          txt(x - 40, y + 32, name, {fill: '#10695f', fs: 14.5, anchor: 'start'}) +
          txt(x - 40, y + 52, how, {fs: 10.8, fill: MUT, fw: 600, anchor: 'start'}) +
          txt(x - 40, y + 74, eg, {fs: 11, fill: '#10695f', fw: 700, anchor: 'start'});
      }).join('') +
      txt(320, 300, '共同点：微生物要水、要暖、要养分——条件不给，它就活不成', {fs: 12.5}) +
      txt(320, 322, '几千年的蜂蜜还能吃：糖浓度极高，细菌进去反被「吸干」', {fs: 12, fill: MUT}) +
      '</svg>';
  };

  const tongueTaste = () => {
    const tastes = [
      ['甜', '舌尖也敏感', '#d97745'],
      ['酸', '腮帮子先知道', '#8bbf3f'],
      ['苦', '天生警惕的信号', '#8b65c9'],
      ['咸', '电解质的味道', '#2f9bd6'],
      ['鲜', '肉汤蘑菇都有它', '#e0526d'],
    ];
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="舌头五味与嗅觉合作">` + DEFS +
      txt(320, 40, '风味 = 舌头的五味 + 鼻子的嗅觉', {fs: 16}) +
      `<ellipse cx="230" cy="170" rx="130" ry="108" fill="#f6c6d0" stroke="#e0526d" stroke-width="2.5"/>` +
      tastes.map(([name, note, color], i) => {
        const a = -90 + i * 72;
        const x = 230 + 76 * Math.cos(a * Math.PI / 180), y = 170 + 64 * Math.sin(a * Math.PI / 180);
        return `<circle cx="${x}" cy="${y}" r="17" fill="#fff" stroke="${color}" stroke-width="2.5"/>` +
          txt(x, y + 5, name, {fill: color, fs: 14.5});
      }).join('') +
      txt(230, 306, '「味觉地图」过时了：整条舌头都能尝五味', {fs: 11.5, fill: MUT}) +
      card(400, 84, 200, 170, '#eef4fb', BLUE) +
      txt(500, 112, '鼻子才是主角', {fill: '#2b5f8f', fs: 14}) +
      txt(500, 138, '咀嚼时香气「倒灌」进鼻腔', {fs: 11, fill: MUT, fw: 600}) +
      txt(500, 160, '肉香果香大多来自这里', {fs: 11, fill: MUT, fw: 600}) +
      txt(500, 192, '辣不是味觉', {fill: '#e0526d', fs: 12.5, fw: 800}) +
      txt(500, 212, '是辣椒素「烧」到痛觉神经', {fs: 10.5, fill: MUT, fw: 600}) +
      txt(500, 236, '感冒鼻塞 → 吃饭没味', {fs: 11, fill: '#2b5f8f', fw: 700}) +
      arrow('M398,170 L364,170', BLUE, 3) +
      txt(320, 322, '颜色和脆响也参与「好吃」：换掉颜色，苹果汁能被喝成橙子味', {fs: 12, fill: MUT}) +
      '</svg>';
  };

  /* ---------- 注册 ---------- */
  const REG = {
    'fd-bn-fd1': bannerFd1, 'fd-bn-fd2': bannerFd2, 'fd-bn-fd3': bannerFd3,
    'fd-bn-fd4': bannerFd4, 'fd-bn-fd5': bannerFd5,
    'fd-origin-lab': originLab, 'fd-rice-journey': riceJourney,
    'fd-farming-year': farmingYear, 'fd-cold-chain': coldChain,
    'fd-crop-origins': cropOrigins, 'fd-silk-food': silkFood,
    'fd-columbus-swap': columbusSwap, 'fd-spread-lab': spreadLab,
    'fd-nutrients': nutrients, 'fd-digestion-map': digestionMap,
    'fd-nutrient-absorb': nutrientAbsorb, 'fd-meal-lab': mealLab,
    'fd-festival-foods': festivalFoods, 'fd-staple-map': stapleMap,
    'fd-term-foods': termFoods, 'fd-table-manners': tableManners,
    'fd-cooking-chem': cookingChem, 'fd-fermentation': fermentation,
    'fd-preserve': preserve, 'fd-tongue-taste': tongueTaste,
  };
  const DEFAULT_CAPS = {
    'fd-origin-lab': '选一顿饭，逐站走完每样食材的旅行，再答一道小问题',
    'fd-spread-lab': '选作物、拖年代，看传播箭头点亮——三波浪潮越来越快',
    'fd-meal-lab': '五类各选一样搭一餐，看几颗星、缺什么',
  };

  function figHTML(id, cap) {
    const fn = REG[id];
    if (!fn) return '';
    const capText = cap || DEFAULT_CAPS[id] || '';
    return `<figure class="fig" data-fig="${id}">${DEFS}${fn()}${capText ? `<figcaption class="fig-cap">${capText}</figcaption>` : ''}</figure>`;
  }

  if (typeof document !== 'undefined') {
    const initIn = root => {
      root.querySelectorAll('.fig').forEach(fig => {
        window.FoodLabs?.mount?.(fig);
      });
    };
    const mo = new MutationObserver(muts => {
      window.FoodLabs?.prune?.();
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
  module.exports = FoodFigures;
}
if (typeof window !== 'undefined') {
  window.FoodFigures = FoodFigures;
}

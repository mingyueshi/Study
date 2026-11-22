/* ============================================================
   乐学堂 · 概率与统计乐园 —— 图示库
   - 纯 SVG 插图，离线可用，打印友好
   - 四个实验台（掷骰/调查/估 π/查证）由 probability-labs.js 渲染
   - 数据里用 fig: 'prob-xxx' 引用
   ============================================================ */
'use strict';

const ProbabilityFigures = (() => {
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
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" marker-end="url(#pfig-arrow)"/>`;
  const card = (x, y, w, h, fill, stroke) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${fill}" stroke="${stroke || 'none'}" stroke-width="2"/>`;
  const die = (x, y, r, dots, fill = '#fff', stroke = '#7d93a8') => {
    const off = r * .42;
    const map = {1: [[0, 0]], 2: [[-off, -off], [off, off]], 3: [[-off, -off], [0, 0], [off, off]],
      4: [[-off, -off], [off, -off], [-off, off], [off, off]], 5: [[-off, -off], [off, -off], [0, 0], [-off, off], [off, off]],
      6: [[-off, -off], [off, -off], [-off, 0], [off, 0], [-off, off], [off, off]]};
    return `<rect x="${x - r}" y="${y - r}" width="${r * 2}" height="${r * 2}" rx="${r * .28}" fill="${fill}" stroke="${stroke}" stroke-width="3"/>` +
      (map[dots] || []).map(([dx, dy]) => `<circle cx="${x + dx}" cy="${y + dy}" r="${r * .13}" fill="#34384d"/>`).join('');
  };
  const DEFS = `<defs><marker id="pfig-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${MUT}"/></marker></defs>`;

  /* ---------- 横幅 ---------- */
  const banner = (emoji, name, color) => {
    const light = color + '26';
    return `<svg class="fig-svg" viewBox="0 0 640 110" role="img" aria-label="${name}横幅">` +
      `<rect width="640" height="110" rx="16" fill="${light}"/>` +
      `<circle cx="588" cy="26" r="34" fill="${color}" opacity=".18"/>` +
      `<circle cx="62" cy="86" r="26" fill="${color}" opacity=".14"/>` +
      `<circle cx="528" cy="88" r="10" fill="${color}" opacity=".2" class="pb-float"/>` +
      `<circle cx="118" cy="30" r="7" fill="${color}" opacity=".22" class="pb-float pb-d2"/>` +
      `<text x="56" y="72" font-size="52">${emoji}</text>` +
      txt(124, 66, name, {fill: color, fs: 30, fw: 900, anchor: 'start'}) + '</svg>';
  };
  const bannerPs1 = () => banner('🤔', '随机与可能 · 说不准却算得清', BLUE);
  const bannerPs2 = () => banner('🎲', '实验出真知 · 动手掷一掷', TEAL);
  const bannerPs3 = () => banner('📈', '频率与概率 · 越多越稳', ORANGE);
  const bannerPs4 = () => banner('📊', '数据会说话 · 画出来看', PURPLE);
  const bannerPs5 = () => banner('🌀', '误区粉碎机 · 直觉翻车现场', PINK);

  /* ================= 第一乐园 ================= */

  const randomEvents = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="确定事件与随机事件的比较">` + DEFS +
    txt(320, 40, '结果说不准，范围却说得清', {fs: 16}) +
    card(40, 66, 270, 190, '#eef4fb', BLUE) +
    txt(175, 96, '确定事件', {fill: BLUE, fs: 15}) +
    txt(175, 130, '☀️ 太阳明天升起', {fs: 13.5}) +
    txt(175, 158, '🔥 水烧开到 100℃', {fs: 13.5}) +
    txt(175, 186, '只有一种结果', {fs: 12.5, fill: MUT}) +
    txt(175, 210, '没有悬念', {fs: 12.5, fill: MUT}) +
    card(330, 66, 270, 190, '#eef7f3', TEAL) +
    txt(465, 96, '随机事件', {fill: TEAL, fs: 15}) +
    txt(465, 130, '🌧️ 明早下不下雨', {fs: 13.5}) +
    die(465, 240, 26, 5) +
    txt(465, 186, '🎲 掷骰出几点（1～6）', {fs: 13.5}) +
    txt(465, 210, '不止一种结果，事先说不准', {fs: 12.5, fill: MUT}) +
    txt(320, 296, '随机 ≠ 乱来：可能的结果集合是确定的', {fs: 14}) +
    txt(320, 322, '一枚骰子永远掷不出 7', {fs: 12.5, fill: MUT}) +
    '</svg>';

  const certainPossible = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="一定、可能、不可能三档">` + DEFS +
    txt(320, 40, '先分三档，再谈大小', {fs: 16}) +
    card(30, 66, 190, 170, '#e4f3ee', GREEN) +
    txt(125, 96, '一定', {fill: '#187749', fs: 17}) +
    `<text x="125" y="140" font-size="30">✅</text>` +
    txt(125, 176, '袋里全是红球，', {fs: 12.5}) +
    txt(125, 196, '摸出红球', {fs: 12.5}) +
    txt(125, 222, '必然发生', {fs: 11.5, fill: MUT}) +
    card(225, 66, 190, 170, '#eef4fb', BLUE) +
    txt(320, 96, '可能', {fill: BLUE, fs: 17}) +
    `<text x="320" y="140" font-size="30">🎲</text>` +
    txt(320, 176, '掷硬币正面朝上', {fs: 12.5}) +
    txt(320, 196, '两种结果都可能', {fs: 12.5}) +
    txt(320, 222, '说不准但范围清楚', {fs: 11.5, fill: MUT}) +
    card(420, 66, 190, 170, '#fdeaea', RED) +
    txt(515, 96, '不可能', {fill: '#a4453f', fs: 17}) +
    `<text x="515" y="140" font-size="30">🚫</text>` +
    txt(515, 176, '掷骰子掷出 0 点', {fs: 12.5}) +
    txt(515, 196, '结果集合里没有它', {fs: 12.5}) +
    txt(515, 222, '注意：很难 ≠ 不可能', {fs: 11.5, fill: MUT}) +
    txt(320, 282, '判断三步：列全部结果 → 看目标在不在 → 再谈大小', {fs: 14}) +
    txt(320, 312, '中大奖很难很难，但它「可能」——别把难度当成不可能', {fs: 12.5, fill: MUT}) +
    '</svg>';

  const spinner = () => {
    const wedge = (cx, cy, r, a0, a1, color) => {
      const p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)];
      const p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
      return `<path d="M${cx} ${cy} L${p0[0].toFixed(1)} ${p0[1].toFixed(1)} A${r} ${r} 0 0 1 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} Z" fill="${color}" stroke="#fff" stroke-width="3"/>`;
    };
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="转盘的可能性看扇形面积">` + DEFS +
      txt(320, 40, '转盘说话：面积就是可能性', {fs: 16}) +
      wedge(180, 190, 108, -Math.PI / 2, 0, BLUE) +
      wedge(180, 190, 108, 0, Math.PI / 2, GOLD) +
      wedge(180, 190, 108, Math.PI / 2, Math.PI, TEAL) +
      wedge(180, 190, 108, Math.PI, Math.PI * 1.5, PURPLE) +
      txt(180, 196, '四色平分', {fs: 13, fill: '#fff'}) +
      txt(180, 326, '每色 1/4', {fs: 13, fill: MUT}) +
      wedge(460, 190, 108, -Math.PI / 2, Math.PI / 6, ORANGE) +
      wedge(460, 190, 108, Math.PI / 6, Math.PI * 1.5, SKY) +
      txt(460, 196, '橙 1/3 · 蓝 2/3', {fs: 13, fill: '#fff'}) +
      txt(460, 326, '不等分：按圆心角算', {fs: 13, fill: MUT}) +
      arrow('M296 190H344', MUT) +
      txt(320, 312 - 26, '转到蓝色的可能：蓝占几分之几的圆，就是几分之几', {fs: 13.5}) +
      '</svg>';
  };

  const fairGame = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="游戏公平性的比较">` + DEFS +
    txt(320, 40, '公平问一句：双方赢面等不等？', {fs: 16}) +
    card(40, 66, 270, 200, '#e4f3ee', GREEN) +
    txt(175, 98, '✅ 公平', {fill: '#187749', fs: 16}) +
    die(120, 170, 30, 2) + die(230, 170, 30, 5) +
    txt(175, 226, '抛硬币定先手：正反各 1/2', {fs: 12.5}) +
    txt(175, 248, '偶数甲赢、奇数乙赢：各 1/2', {fs: 12.5}) +
    card(330, 66, 270, 200, '#fdeaea', RED) +
    txt(465, 98, '❌ 不公平', {fill: '#a4453f', fs: 16}) +
    die(420, 170, 30, 6, '#fbe3e6', RED) + die(530, 170, 30, 1, '#fbe3e6', RED) +
    txt(465, 226, '「你掷出 6 你赢，其他我赢」', {fs: 12.5}) +
    txt(465, 248, '你 1/6 · 对方 5/6', {fs: 12.5, fill: MUT}) +
    txt(320, 306, '概率是设计游戏的尺子：先算赢面，再定规则', {fs: 14}) +
    '</svg>';

  /* ================= 第二乐园 ================= */

  const oneDie = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="一枚骰子的六种等可能结果">` + DEFS +
    txt(320, 40, '一枚骰子：六面等可能', {fs: 16}) +
    die(120, 150, 34, 1) + die(230, 150, 34, 2) + die(340, 150, 34, 3) +
    die(450, 150, 34, 4) + die(560, 150, 34, 5) + die(320, 250, 34, 6) +
    txt(120, 210, '1/6', {fs: 13, fill: TEAL}) + txt(230, 210, '1/6', {fs: 13, fill: TEAL}) +
    txt(340, 210, '1/6', {fs: 13, fill: TEAL}) + txt(450, 210, '1/6', {fs: 13, fill: TEAL}) +
    txt(560, 210, '1/6', {fs: 13, fill: TEAL}) + txt(320, 312, '1/6≈16.7%', {fs: 13, fill: TEAL}) +
    txt(320, 66, '单次难说，多次有规律——预测的是长期平均', {fs: 13, fill: MUT}) +
    '</svg>';

  const twoDice = () => {
    const combos = [[1, 6], [2, 5], [3, 4], [4, 3], [5, 2], [6, 1]];
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="两个骰子和的组合数排成小山">` + DEFS +
      txt(320, 40, '36 种组合排成对称小山，山顶是 7', {fs: 16}) +
      [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((sum, i) => {
        const h = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1][i];
        const x = 50 + i * 50, barH = h * 26, base = 240;
        return `<rect x="${x}" y="${base - barH}" width="36" height="${barH}" rx="7" fill="${sum === 7 ? TEAL : '#9db9dd'}"/>` +
          txt(x + 18, base + 22, String(sum), {fs: 13, fill: sum === 7 ? TEAL : MUT}) +
          txt(x + 18, base - barH - 8, String(h), {fs: 12, fill: sum === 7 ? TEAL : MUT});
      }).join('') +
      txt(320, 286, '格子高度＝组合数：7 有 6 种，2 和 12 各 1 种', {fs: 13.5}) +
      combos.map(([a, b], i) => die(70 + i * 92, 312, 13, a === b ? a : a === 6 && b === 1 ? 6 : Math.min(a, b) === a ? a : b, '#fff', '#91a6b8')).join('') +
      txt(320, 66, '(1,6)(2,5)(3,4)(4,3)(5,2)(6,1) 都凑出 7', {fs: 12.5, fill: MUT}) +
      '</svg>';
  };

  const cardsBalls = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="放回与不放回的摸球比较">` + DEFS +
    txt(320, 40, '放回不变味，不放回要更新', {fs: 16}) +
    card(40, 66, 270, 200, '#eef4fb', BLUE) +
    txt(175, 98, '放回再摸', {fill: BLUE, fs: 15}) +
    `<circle cx="110" cy="170" r="18" fill="#e25563"/><circle cx="150" cy="150" r="18" fill="#e25563"/><circle cx="190" cy="180" r="18" fill="#e25563"/><circle cx="240" cy="155" r="18" fill="#e6b23c"/><circle cx="275" cy="185" r="18" fill="#e6b23c"/>` +
    txt(175, 236, '第 1 次红 3/5 → 放回 → 第 2 次仍 3/5', {fs: 12.5}) +
    txt(175, 258, '条件没变，概率不变', {fs: 12, fill: MUT}) +
    card(330, 66, 270, 200, '#fdf1ea', ORANGE) +
    txt(465, 98, '不放回', {fill: ORANGE, fs: 15}) +
    `<circle cx="400" cy="170" r="18" fill="#e25563" opacity=".45"/><circle cx="440" cy="150" r="18" fill="#e25563" opacity=".45"/><circle cx="480" cy="180" r="18" fill="#e25563"/><circle cx="530" cy="155" r="18" fill="#e6b23c"/><circle cx="565" cy="185" r="18" fill="#e6b23c"/>` +
    txt(465, 236, '摸走 1 红 → 剩 2 红 2 黄 → 再摸红 2/4', {fs: 12.5}) +
    txt(465, 258, '边摸边更新条件，一步步乘', {fs: 12, fill: MUT}) +
    txt(320, 306, '扑克同理：52 张抽红桃 1/4；抽走一张后变 12/51', {fs: 13.5}) +
    '</svg>';

  const wheelArea = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="转盘圆心角与可能性">` + DEFS +
    txt(320, 40, '圆心角就是比例尺', {fs: 16}) +
    `<circle cx="180" cy="180" r="100" fill="#eef2f7"/>` +
    `<path d="M180 180 L180 80 A100 100 0 0 1 266.6 130Z" fill="#e25563"/>` +
    `<path d="M180 180 L266.6 130 A100 100 0 0 1 266.6 230Z" fill="#2f9bd6"/>` +
    `<path d="M180 180 L266.6 230 A100 100 0 0 1 180 280Z" fill="#2f9bd6"/>` +
    `<path d="M180 180 L180 280 A100 100 0 0 1 93.4 230Z" fill="#2f9bd6"/>` +
    `<path d="M180 180 L93.4 230 A100 100 0 0 1 93.4 130Z" fill="#2f9bd6"/>` +
    `<path d="M180 180 L93.4 130 A100 100 0 0 1 180 80Z" fill="#2f9bd6"/>` +
    txt(180, 330, '红 120°＝1/3 · 蓝 240°＝2/3', {fs: 13, fill: MUT}) +
    txt(180, 196, '指针', {fs: 12, fill: '#fff'}) +
    `<line x1="180" y1="180" x2="222" y2="122" stroke="#34384d" stroke-width="5" stroke-linecap="round"/><circle cx="180" cy="180" r="10" fill="#34384d"/>` +
    card(340, 80, 260, 190, '#fff', LINE) +
    txt(470, 112, '读转盘三步', {fs: 14.5}) +
    txt(360, 142, '① 量出每个扇形的圆心角', {anchor: 'start', fs: 12.5}) +
    txt(360, 166, '② 角度 ÷ 360°＝可能性', {anchor: 'start', fs: 12.5}) +
    txt(360, 190, '③ 公平转盘要平分角度', {anchor: 'start', fs: 12.5}) +
    txt(360, 222, '想改难度？改角度就是改概率', {anchor: 'start', fs: 12.5, fill: MUT}) +
    txt(360, 246, '——但游戏要公平，别悄悄动手脚', {anchor: 'start', fs: 12.5, fill: MUT}) +
    txt(320, 312, '每次转动独立：上一圈的结果不影响下一圈', {fs: 13.5}) +
    '</svg>';

  /* ================= 第三乐园 ================= */

  const frequencyIdea = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="频率逐渐稳定在概率附近">` + DEFS +
    txt(320, 40, '频率是实验值，概率是理论值', {fs: 16}) +
    card(40, 66, 560, 200, '#fff', LINE) +
    `<line x1="80" y1="220" x2="560" y2="220" stroke="#8497a9" stroke-width="2"/>` +
    `<line x1="80" y1="150" x2="560" y2="150" stroke="#d97745" stroke-width="2.5" stroke-dasharray="7 5"/>` +
    txt(556, 144, '概率 50%', {fs: 12, fill: ORANGE, anchor: 'end'}) +
    `<polyline points="100,196 150,120 200,180 250,168 300,142 350,158 400,146 450,152 500,148 540,151" fill="none" stroke="#4d96ff" stroke-width="3.5"/>` +
    txt(110, 244, '10 次', {fs: 11.5, fill: MUT}) + txt(300, 244, '300 次', {fs: 11.5, fill: MUT}) + txt(540, 244, '600 次', {fs: 11.5, fill: MUT}) +
    txt(320, 96, '掷硬币正面频率的波动：先大后小', {fs: 13.5}) +
    txt(320, 292, '次数少时上蹿下跳，次数多了贴住理论线——这就是「越多越稳」', {fs: 13.5}) +
    txt(320, 318, '判断骰子有没有灌铅：掷上千次，看各面频率是否都靠 1/6', {fs: 12.5, fill: MUT}) +
    '</svg>';

  const diceLab = () => {
    if (typeof window !== 'undefined') {
      const interactive = window.ProbabilityLabs?.diceHTML?.();
      if (interactive) return interactive;
    }
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="模拟掷骰台静态示意">` +
      `<rect x="8" y="8" width="624" height="324" rx="16" fill="#eef7fd"/>` +
      txt(320, 150, '模拟掷骰台', {fs: 18}) +
      txt(320, 186, '掷 10 / 100 / 1000 次，看频率柱贴近理论线', {fs: 14, fill: MUT}) +
      '</svg>';
  };

  const piLab = () => {
    if (typeof window !== 'undefined') {
      const interactive = window.ProbabilityLabs?.piHTML?.();
      if (interactive) return interactive;
    }
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="蒙特卡洛估 π 静态示意">` +
      `<rect x="8" y="8" width="624" height="324" rx="16" fill="#eef7fd"/>` +
      txt(320, 150, '蒙特卡洛估 π', {fs: 18}) +
      txt(320, 186, '随机撒点，圆内比例 ×4 ≈ π', {fs: 14, fill: MUT}) +
      '</svg>';
  };

  const errorRepeat = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="误差与重复的实验规矩">` + DEFS +
    txt(320, 40, '随机误差躲不掉，但可以被稀释', {fs: 16}) +
    card(40, 66, 180, 200, '#eef4fb', BLUE) +
    txt(130, 98, '加次数', {fill: BLUE, fs: 15}) +
    die(130, 160, 32, 3) +
    txt(130, 220, '最有效的一招', {fs: 12.5}) +
    txt(130, 242, '千次比百次稳', {fs: 12, fill: MUT}) +
    card(230, 66, 180, 200, '#eef7f3', TEAL) +
    txt(320, 98, '同条件', {fill: TEAL, fs: 15}) +
    `<text x="320" y="160" font-size="30">⚖️</text>` +
    txt(320, 220, '每次都公平地掷', {fs: 12.5}) +
    txt(320, 242, '别换骰子换桌面', {fs: 12, fill: MUT}) +
    card(420, 66, 180, 200, '#f3edfb', PURPLE) +
    txt(510, 98, '重复并平均', {fill: PURPLE, fs: 15}) +
    `<text x="510" y="160" font-size="30">🔁</text>` +
    txt(510, 220, '几轮各 1000 次', {fs: 12.5}) +
    txt(510, 242, '再平均更稳', {fs: 12, fill: MUT}) +
    txt(320, 296, '诚实报告：写清次数、方法和原始数据', {fs: 14}) +
    txt(320, 322, '数据不怕难看，怕的是挑着报', {fs: 12.5, fill: MUT}) +
    '</svg>';

  /* ================= 第四乐园 ================= */

  const tallyTable = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="正字计数法与统计表">` + DEFS +
    txt(320, 40, '「正」字计数法：五画一组，好数不易错', {fs: 16}) +
    card(60, 66, 520, 190, '#fff', LINE) +
    txt(140, 100, '选项', {fs: 13.5, fill: MUT}) + txt(320, 100, '计数', {fs: 13.5, fill: MUT}) + txt(480, 100, '票数', {fs: 13.5, fill: MUT}) +
    `<line x1="90" y1="112" x2="550" y2="112" stroke="${LINE}" stroke-width="2"/>` +
    txt(140, 142, '🍎 苹果', {fs: 14}) +
    txt(320, 142, '正 正 正 丅', {fs: 15, fill: BLUE}) +
    txt(480, 142, '17', {fs: 15}) +
    txt(140, 176, '🍌 香蕉', {fs: 14}) +
    txt(320, 176, '正 正 正', {fs: 15, fill: BLUE}) +
    txt(480, 176, '15', {fs: 15}) +
    txt(140, 210, '🍇 葡萄', {fs: 14}) +
    txt(320, 210, '正 正', {fs: 15, fill: BLUE}) +
    txt(480, 210, '10', {fs: 15}) +
    txt(140, 240, '🍉 西瓜', {fs: 14}) +
    txt(320, 240, '正 丅', {fs: 15, fill: BLUE}) +
    txt(480, 240, '8', {fs: 15}) +
    txt(320, 290, '收集规矩：问题具体、选项互不重叠、当场记全', {fs: 13.5}) +
    txt(320, 316, '收完核对：总票数 17+15+10+8＝50，和人数对上', {fs: 12.5, fill: MUT}) +
    '</svg>';

  const barChart = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="条形图读图三步">` + DEFS +
    txt(320, 40, '条形图：把「多少」画成高矮', {fs: 16}) +
    `<line x1="80" y1="270" x2="600" y2="270" stroke="#8497a9" stroke-width="2"/>` +
    `<line x1="80" y1="270" x2="80" y2="80" stroke="#8497a9" stroke-width="2"/>` +
    [0, 4, 8, 12, 16].map(v => {
      const y = 270 - v * 11;
      return `<line x1="74" y1="${y}" x2="86" y2="${y}" stroke="#8497a9" stroke-width="2"/><text x="66" y="${y + 4}" font-size="11" text-anchor="end" fill="${MUT}">${v}</text>`;
    }).join('') +
    txt(58, 76, '票数', {fs: 11.5, fill: MUT, anchor: 'end'}) +
    txt(70, 288, '（一格＝4 票）', {fs: 10.5, fill: MUT, anchor: 'start'}) +
    [[130, 17, BLUE, '🍎'], [280, 15, BLUE, '🍌'], [430, 10, BLUE, '🍇'], [560, 8, BLUE, '🍉']].map(([x, v, c, e]) => {
      const hh = v / 4 * 44;
      return `<rect x="${x - 30}" y="${270 - hh}" width="60" height="${hh}" rx="8" fill="${c}" opacity=".85"/>` +
        txt(x, 270 - hh - 8, String(v), {fs: 13}) + txt(x, 296, e, {fs: 16});
    }).join('') +
    txt(320, 316, '读图三步：标题图例 → 刻度（一格 4 票）→ 比条高', {fs: 13.5}) +
    '</svg>';

  const lineChart = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="折线图看变化">` + DEFS +
    txt(320, 40, '折线图：把变化画成起伏', {fs: 16}) +
    `<line x1="80" y1="260" x2="600" y2="260" stroke="#8497a9" stroke-width="2"/>` +
    `<line x1="80" y1="260" x2="80" y2="90" stroke="#8497a9" stroke-width="2"/>` +
    ['一', '二', '三', '四', '五', '六', '日'].map((d, i) => txt(120 + i * 74, 284, d, {fs: 12.5, fill: MUT})).join('') +
    `<polyline points="120,200 194,178 268,120 342,150 416,110 490,132 564,100" fill="none" stroke="${PURPLE}" stroke-width="3.5"/>` +
    [[120, 200], [194, 178], [268, 120], [342, 150], [416, 110], [490, 132], [564, 100]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#fff" stroke="${PURPLE}" stroke-width="3"/>`).join('') +
    txt(268, 106, '骤增', {fs: 12, fill: PURPLE}) +
    txt(342, 172, '回落', {fs: 12, fill: MUT}) +
    txt(320, 312, '线越陡变化越快；拐点说明趋势转变', {fs: 13.5}) +
    txt(320, 332, '两点之间的直段只是示意，不是逐时记录', {fs: 12.5, fill: MUT}) +
    '</svg>';

  const average = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="平均数被极端值拉跑">` + DEFS +
    txt(320, 40, '平均数好算，也怕极端值', {fs: 16}) +
    card(40, 66, 560, 130, '#fff', LINE) +
    txt(320, 96, '9 人每月 3000 元，1 人每月 39000 元', {fs: 14}) +
    [80, 135, 190, 245, 300, 355, 410, 465, 520].map(x => `<rect x="${x}" y="${150 - 44}" width="34" height="44" rx="7" fill="#9db9dd"/><text x="${x + 17}" y="176" font-size="11" text-anchor="middle" fill="#fff">3k</text>`).join('') +
    `<rect x="555" y="${150 - 100}" width="34" height="100" rx="7" fill="#e25563"/><text x="572" y="176" font-size="11" text-anchor="middle" fill="#fff">39k</text>` +
    txt(320, 218, '平均 6600 元——被一个人拉高', {fs: 13.5, fill: '#a4453f'}) +
    card(60, 244, 520, 54, '#f3edfb', PURPLE) +
    txt(320, 278, '中位数：排队后正中间的数＝3000 元，更贴近多数人', {fs: 13.5, fill: '#5d3f96'}) +
    txt(320, 322, '读「平均」先找极端值；找得到，就再看中位数', {fs: 13}) +
    '</svg>';

  const surveyLab = () => {
    if (typeof window !== 'undefined') {
      const interactive = window.ProbabilityLabs?.surveyHTML?.();
      if (interactive) return interactive;
    }
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="小调查生成器静态示意">` +
      `<rect x="8" y="8" width="624" height="324" rx="16" fill="#f4f1fb"/>` +
      txt(320, 150, '小调查生成器', {fs: 18}) +
      txt(320, 186, '点票数，柱状图与占比自动生成', {fs: 14, fill: MUT}) +
      '</svg>';
  };

  /* ================= 第五乐园 ================= */

  const gamblerFallacy = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="赌徒谬误：硬币没有记忆">` + DEFS +
    txt(320, 40, '硬币没有记忆', {fs: 17}) +
    ['正', '正', '正', '正', '正', '？'].map((s, i) => {
      const x = 90 + i * 92;
      const isQ = s === '？';
      return `<circle cx="${x}" cy="140" r="34" fill="${isQ ? '#fdeaea' : '#fff'}" stroke="${isQ ? RED : '#7d93a8'}" stroke-width="3.5"/>` +
        txt(x, 148, s, {fs: 20, fill: isQ ? '#a4453f' : INK});
    }).join('') +
    arrow('M468 140H540', RED) +
    card(120, 210, 400, 66, '#eef4fb', BLUE) +
    txt(320, 238, '直觉说：反面「该来了」？', {fs: 14, fill: '#2b5f8f'}) +
    txt(320, 262, '实验说：第 6 次正面仍是 1/2——前 5 次只是历史', {fs: 13.5}) +
    txt(320, 306, '独立事件不欠任何人；把「该轮到」当规律，是越输越多的开始', {fs: 13}) +
    txt(320, 328 - 6, '验证：在模拟台里数「连开后下一掷」，长期仍是约一半', {fs: 12, fill: MUT}) +
    '</svg>';

  const smallSample = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="小样本陷阱">` + DEFS +
    txt(320, 40, '样本太小，什么结论都能冒出来', {fs: 16}) +
    card(40, 66, 270, 200, '#fdeaea', RED) +
    txt(175, 98, '❌ 不可靠', {fill: '#a4453f', fs: 15}) +
    txt(175, 134, '掷 3 次全正面 → 「正面必胜」？', {fs: 12.5}) +
    txt(175, 162, '问 5 个同学 → 「全班都爱香蕉」？', {fs: 12.5}) +
    txt(175, 190, '3 个高个子坐后排 → 「后排长高」？', {fs: 12.5}) +
    txt(175, 226, '样本小，频率晃得厉害', {fs: 12, fill: MUT}) +
    txt(175, 248, '还可能有别的原因没排除', {fs: 12, fill: MUT}) +
    card(330, 66, 270, 200, '#e4f3ee', GREEN) +
    txt(465, 98, '✅ 先问三句', {fill: '#187749', fs: 15}) +
    txt(465, 140, '① 样本多大？', {fs: 13}) +
    txt(465, 168, '② 怎么选的？', {fs: 13}) +
    txt(465, 196, '③ 重复过吗？', {fs: 13}) +
    txt(465, 232, '对惊人的结论，先查这三样', {fs: 12, fill: MUT}) +
    txt(465, 254, '再决定信不信', {fs: 12, fill: MUT}) +
    txt(320, 306, '查证者的老规矩：反例被滤掉，结论就是假的', {fs: 13.5}) +
    '</svg>';

  const lotteryTrap = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="抽奖期望值的算盘">` + DEFS +
    txt(320, 40, '「百分百中奖」≠ 划算', {fs: 16}) +
    card(40, 66, 270, 200, '#fdf1ea', ORANGE) +
    txt(175, 98, '商家的账本', {fill: ORANGE, fs: 15}) +
    txt(175, 134, '「买一包百分百中奖！」', {fs: 13}) +
    txt(175, 164, '奖品：一张贴纸', {fs: 13}) +
    txt(175, 192, '中奖 ≠ 中大奖', {fs: 13.5, fill: '#a4453f'}) +
    txt(175, 220, '大奖印在中间，', {fs: 12, fill: MUT}) +
    txt(175, 242, '中奖率写在角落', {fs: 12, fill: MUT}) +
    card(330, 66, 270, 200, '#eef7f3', TEAL) +
    txt(465, 98, '你的账本：期望值', {fill: TEAL, fs: 15}) +
    txt(465, 134, '花 2 元抽一次：', {fs: 13}) +
    txt(465, 162, '20% 中 5 元 ＝ 1 元', {fs: 13}) +
    txt(465, 190, '5% 中 20 元 ＝ 1 元', {fs: 13}) +
    txt(465, 226, '期望 2 元＝票价', {fs: 13.5, fill: '#187749'}) +
    txt(465, 248, '长期不赚不亏，还搭上时间', {fs: 12, fill: MUT}) +
    txt(320, 306, '概率 × 价值再加总，才是平均收益——数字摊开来才看清', {fs: 13.5}) +
    '</svg>';

  const mythQuiz = () => {
    if (typeof window !== 'undefined') {
      const interactive = window.ProbabilityLabs?.quizHTML?.();
      if (interactive) return interactive;
    }
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="反直觉查证台静态示意">` +
      `<rect x="8" y="8" width="624" height="324" rx="16" fill="#fdf1f3"/>` +
      txt(320, 150, '反直觉查证台', {fs: 18}) +
      txt(320, 186, '六道题：直觉先选，实验裁决', {fs: 14, fill: MUT}) +
      '</svg>';
  };

  /* ---------- 注册表 ---------- */
  const REG = {
    'pb-bn-ps1': bannerPs1, 'pb-bn-ps2': bannerPs2, 'pb-bn-ps3': bannerPs3,
    'pb-bn-ps4': bannerPs4, 'pb-bn-ps5': bannerPs5,
    'prob-random-events': randomEvents, 'prob-certain-possible': certainPossible,
    'prob-spinner': spinner, 'prob-fair-game': fairGame,
    'prob-one-die': oneDie, 'prob-two-dice': twoDice,
    'prob-cards-balls': cardsBalls, 'prob-wheel-area': wheelArea,
    'prob-frequency-idea': frequencyIdea, 'prob-dice-lab': diceLab,
    'prob-pi-lab': piLab, 'prob-error-repeat': errorRepeat,
    'prob-tally-table': tallyTable, 'prob-bar-chart': barChart,
    'prob-line-chart': lineChart, 'prob-average': average,
    'prob-survey-lab': surveyLab, 'prob-gambler-fallacy': gamblerFallacy,
    'prob-small-sample': smallSample, 'prob-lottery-trap': lotteryTrap,
    'prob-myth-quiz': mythQuiz,
  };

  const DEFAULT_CAPS = {
    'prob-random-events': '随机不是乱：范围确定，结果不定',
    'prob-certain-possible': '先列全部结果，再分一定、可能、不可能',
    'prob-spinner': '面积占比就是可能性；等可能才好算分数',
    'prob-fair-game': '公平问一句：双方赢面等不等？',
    'prob-one-die': '六面各 1/6，预测的是长期平均',
    'prob-two-dice': '36 种组合排成小山：7 有 6 种，山顶最常见',
    'prob-cards-balls': '放回不变味，不放回要更新条件',
    'prob-wheel-area': '圆心角就是比例尺：占几分之几圆＝几分之几机会',
    'prob-frequency-idea': '频率靠近概率：次数少晃，次数多稳',
    'prob-dice-lab': '模拟掷骰台：掷 10/100/1000 次看柱形压平',
    'prob-pi-lab': '蒙特卡洛估 π：撒点越多，4×圆内比例越像 π',
    'prob-error-repeat': '加次数、同条件、重复平均、如实报告',
    'prob-tally-table': '正字计数：当场记全，总数要核对',
    'prob-bar-chart': '条形图比数量：先看刻度再比高',
    'prob-line-chart': '折线图看变化：越陡变化越快',
    'prob-average': '平均数怕极端值：找得到就再看中位数',
    'prob-survey-lab': '小调查生成器：点票数，图表自动出',
    'prob-gambler-fallacy': '硬币没有记忆：连开之后仍各半',
    'prob-small-sample': '先问：样本多大、怎么选、重复没',
    'prob-lottery-trap': '期望值＝概率 × 价值再加总',
    'prob-myth-quiz': '反直觉查证台：首答与订正分开记',
    'pb-bn-ps1': '', 'pb-bn-ps2': '', 'pb-bn-ps3': '', 'pb-bn-ps4': '', 'pb-bn-ps5': '',
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
        window.ProbabilityLabs?.mount?.(fig);
      });
    };
    const mo = new MutationObserver(muts => {
      window.ProbabilityLabs?.prune?.();
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
  module.exports = ProbabilityFigures;
}
if (typeof window !== 'undefined') {
  window.ProbabilityFigures = ProbabilityFigures;
}

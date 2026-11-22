/* ============================================================
   乐学堂 · 电脑与 AI 怎样工作 —— 图示库
   - 纯 SVG 插图，离线可用，打印友好
   - 四个实验台（二进制/排序/二分/分类器）由 computing-labs.js 渲染
   - 数据里用 fig: 'cp-xxx' 引用
   ============================================================ */
'use strict';

const ComputingFigures = (() => {
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
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" marker-end="url(#cfig-arrow)"/>`;
  const card = (x, y, w, h, fill, stroke) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${fill}" stroke="${stroke || 'none'}" stroke-width="2"/>`;
  /* 微型开关：on 时滑块拨到右侧并点亮。 */
  const switchBox = (x, y, on, scale = 1) => {
    const w = 46 * scale, h = 22 * scale, r = 11 * scale, knob = 8 * scale;
    const cx = on ? x + w - h / 2 : x + h / 2;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${on ? GREEN : '#c9d3e0'}" stroke="#7d93a8" stroke-width="2"/>` +
      `<circle cx="${cx}" cy="${y + h / 2}" r="${knob}" fill="#fff"/>`;
  };
  const DEFS = `<defs><marker id="cfig-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${MUT}"/></marker></defs>`;

  /* ---------- 横幅 ---------- */
  const banner = (emoji, name, color) => {
    const light = color + '26';
    return `<svg class="fig-svg" viewBox="0 0 640 110" role="img" aria-label="${name}横幅">` +
      `<rect width="640" height="110" rx="16" fill="${light}"/>` +
      `<circle cx="588" cy="26" r="34" fill="${color}" opacity=".18"/>` +
      `<circle cx="62" cy="86" r="26" fill="${color}" opacity=".14"/>` +
      `<circle cx="528" cy="88" r="10" fill="${color}" opacity=".2" class="cp-float"/>` +
      `<circle cx="118" cy="30" r="7" fill="${color}" opacity=".22" class="cp-float cp-d2"/>` +
      `<text x="56" y="72" font-size="52">${emoji}</text>` +
      txt(124, 66, name, {fill: color, fs: 30, fw: 900, anchor: 'start'}) + '</svg>';
  };
  const bannerCp1 = () => banner('💡', '比特与开关 · 0 和 1 的世界', BLUE);
  const bannerCp2 = () => banner('📜', '指令与程序 · 一步一步说清楚', TEAL);
  const bannerCp3 = () => banner('🔍', '算法思维 · 找得快，排得巧', ORANGE);
  const bannerCp4 = () => banner('🧠', '数据与模型 · AI 怎样学会', PURPLE);
  const bannerCp5 = () => banner('🌐', '网络与真伪 · 消息先查证', PINK);

  /* ================= 第一站 ================= */

  const bitSwitches = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="一盏灯两种消息，两盏灯四种消息">` + DEFS +
    txt(320, 40, '开关越多，能表达的消息越多', {fs: 16}) +
    card(40, 66, 270, 200, '#eef4fb', BLUE) +
    txt(175, 98, '一盏灯：2 种', {fill: BLUE, fs: 15}) +
    `<text x="110" y="150" font-size="34">💡</text>` + `<text x="240" y="150" font-size="34">🌑</text>` +
    txt(110, 184, '亮＝1', {fs: 13}) + txt(240, 184, '灭＝0', {fs: 13}) +
    txt(175, 226, '1 个比特，2 种消息', {fs: 13.5}) +
    txt(175, 248, '信息的最小单位', {fs: 12, fill: MUT}) +
    card(330, 66, 270, 200, '#eef7f3', TEAL) +
    txt(465, 98, '两盏灯：4 种', {fill: TEAL, fs: 15}) +
    txt(390, 138, '🌑🌑', {fs: 24}) + txt(450, 138, '🌑💡', {fs: 24}) +
    txt(390, 172, '💡🌑', {fs: 24}) + txt(450, 172, '💡💡', {fs: 24}) +
    txt(390, 200, '00', {fs: 12, fill: MUT}) + txt(450, 200, '01', {fs: 12, fill: MUT}) +
    txt(390, 226, '10', {fs: 12, fill: MUT}) + txt(450, 226, '11', {fs: 12, fill: MUT}) +
    txt(465, 252, '每加一盏灯，消息翻一倍', {fs: 12, fill: MUT}) +
    txt(320, 296, '电脑里是亿万个这样的小开关：开＝1，关＝0', {fs: 14}) +
    txt(320, 322, '开关每秒翻转几十亿次——海量 0 和 1 高速组合，就是「计算」', {fs: 12.5, fill: MUT}) +
    '</svg>';

  const binaryCount = () => {
    const pairs = [[0, '0'], [1, '1'], [2, '10'], [3, '11'], [4, '100'], [5, '101'], [6, '110'], [7, '111']];
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="十进制 0 到 7 与二进制对照">` + DEFS +
      txt(320, 40, '满二进一：只有 0 和 1，两位就要进位', {fs: 16}) +
      pairs.map(([d, b], i) => {
        const x = 90 + (i % 4) * 156, y = 96 + Math.floor(i / 4) * 96;
        return card(x - 62, y - 26, 124, 62, i % 2 ? '#eef4fb' : '#fff', LINE) +
          txt(x - 34, y, String(d), {fs: 20}) +
          txt(x + 34, y, b, {fs: 20, fill: TEAL}) +
          txt(x - 34, y + 22, '十进制', {fs: 10.5, fill: MUT}) +
          txt(x + 34, y + 22, '二进制', {fs: 10.5, fill: MUT});
      }).join('') +
      txt(320, 268, '注意：二进制的「10」读作「一零」，等于 2', {fs: 14.5, fill: '#187749'}) +
      txt(320, 296, '每加一位，能表达的数翻一倍：8 位就能表达 256 个数（0～255）', {fs: 13.5}) +
      txt(320, 322, '二进制写起来长，电脑不怕——开关最擅长「多而快」', {fs: 12.5, fill: MUT}) +
      '</svg>';
  };

  const binaryLab = () => {
    if (typeof window !== 'undefined') {
      const interactive = window.ComputingLabs?.binaryHTML?.();
      if (interactive) return interactive;
    }
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="二进制开关台静态示意">` +
      `<rect x="8" y="8" width="624" height="324" rx="16" fill="#eef7fd"/>` +
      txt(320, 150, '二进制开关台', {fs: 18}) +
      txt(320, 186, '拨 8 个开关，看 0 和 1 变出十进制数', {fs: 14, fill: MUT}) +
      '</svg>';
  };

  const pixels = () => {
    /* 5×5 心形图案：1 为亮。 */
    const heart = [
      [0, 1, 0, 1, 0],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
      [0, 0, 1, 0, 0],
    ];
    const cell = 26;
    const px = 70, py = 92;
    const grid = heart.flatMap((row, r) => row.map((v, c) => {
      const x = px + c * cell, y = py + r * cell;
      return `<rect x="${x}" y="${y}" width="${cell - 2}" height="${cell - 2}" rx="5" fill="${v ? '#34384d' : '#f2f5fb'}" stroke="#c9d3e0" stroke-width="1"/>` +
        txt(x + 12, y + 17, String(v), {fs: 10.5, fill: v ? '#fff' : MUT});
    })).join('');
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="黑白像素图与字符编码">` + DEFS +
      txt(320, 40, '电脑里没有「真正的」图和字，全是编号和数', {fs: 16}) +
      card(46, 78, 220, 160, '#fff', LINE) +
      grid +
      txt(156, 262, '黑白照片：每像素 1 个比特', {fs: 12.5}) +
      txt(156, 284, '亮＝1，暗＝0', {fs: 11.5, fill: MUT}) +
      card(296, 78, 304, 160, '#eef4fb', BLUE) +
      txt(448, 106, '字有编号（编码）', {fill: BLUE, fs: 14}) +
      arrow('M350 128 L430 128', BLUE) +
      txt(390, 122, 'A', {fs: 16}) + txt(470, 122, '65', {fs: 16}) +
      txt(448, 152, '65 ＝ 1000001（二进制）', {fs: 13.5}) +
      txt(448, 178, '汉字、emoji 也各有编号', {fs: 12.5}) +
      txt(448, 204, '约定好了，全世界电脑都认得', {fs: 11.5, fill: MUT}) +
      card(296, 246, 304, 58, '#fdf1ea', ORANGE) +
      `<circle cx="330" cy="275" r="14" fill="#e25563"/>` +
      `<circle cx="358" cy="275" r="14" fill="#2fbf71"/>` +
      `<circle cx="386" cy="275" r="14" fill="#4d96ff"/>` +
      txt(470, 272, '彩色像素：红绿蓝各一个数', {fs: 12.5}) +
      txt(470, 292, '声音：每秒量几千次高低', {fs: 11.5, fill: MUT}) +
      txt(320, 326, '一切信息皆比特——所以照片、音乐才占存储空间', {fs: 13}) +
      '</svg>';
  };

  /* ================= 第二站 ================= */

  const instructions = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="人话与电脑指令的对比">` + DEFS +
    txt(320, 40, '对人说人话，对电脑要写指令单', {fs: 16}) +
    card(40, 66, 270, 210, '#fdf1ea', ORANGE) +
    txt(175, 98, '对人：「泡一碗面」', {fill: ORANGE, fs: 15}) +
    `<text x="175" y="146" font-size="34">🍜</text>` +
    txt(175, 186, '人自己会补细节：烧水、下面、', {fs: 12.5}) +
    txt(175, 210, '计时、捞面——不必一条条说', {fs: 12.5}) +
    txt(175, 240, '电脑不猜心思，这样说不算数', {fs: 12, fill: MUT}) +
    card(330, 66, 270, 210, '#eef7f3', TEAL) +
    txt(465, 98, '对电脑：指令单', {fill: TEAL, fs: 15}) +
    txt(360, 128, '① 烧水（等烧开）', {anchor: 'start', fs: 13}) +
    txt(360, 152, '② 下面条', {anchor: 'start', fs: 13}) +
    txt(360, 176, '③ 计时 3 分钟', {anchor: 'start', fs: 13}) +
    txt(360, 200, '④ 捞面、加调料', {anchor: 'start', fs: 13}) +
    txt(360, 224, '⑤ 开吃', {anchor: 'start', fs: 13}) +
    txt(465, 256, '每步说清「拿什么、做什么」', {fs: 12, fill: MUT}) +
    txt(320, 304, '漏一步、顺序错一步，结果就不对', {fs: 14}) +
    txt(320, 328 - 4, '「面倒进锅」和「锅倒进面」只差一个词', {fs: 12.5, fill: MUT}) +
    '</svg>';

  const cpu = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="程序从硬盘到 CPU 的执行流程">` + DEFS +
    txt(320, 40, '程序是指令单，CPU 是执行指令的快手', {fs: 16}) +
    card(40, 90, 160, 130, '#f3edfb', PURPLE) +
    txt(120, 130, '硬盘', {fill: PURPLE, fs: 15}) +
    `<text x="120" y="170" font-size="30">💾</text>` +
    txt(120, 202, '程序住在这里', {fs: 11.5, fill: MUT}) +
    card(240, 90, 160, 130, '#eef4fb', BLUE) +
    txt(320, 130, '内存', {fill: BLUE, fs: 15}) +
    `<text x="320" y="170" font-size="30">📦</text>` +
    txt(320, 202, '运行时搬进来', {fs: 11.5, fill: MUT}) +
    card(440, 90, 160, 130, '#e4f3ee', GREEN) +
    txt(520, 130, 'CPU', {fill: '#187749', fs: 15}) +
    `<text x="520" y="170" font-size="30">⚡</text>` +
    txt(520, 202, '一条条执行', {fs: 11.5, fill: MUT}) +
    arrow('M200 155H240') + arrow('M400 155H440') +
    txt(320, 258, 'CPU 每秒执行几十亿条指令——再长的单子也「眨眼做完」', {fs: 13.5}) +
    txt(320, 288, '装画图程序就是画板，装游戏程序就是游戏机', {fs: 13.5}) +
    txt(320, 314, '电脑本身是通用的：换程序，换角色', {fs: 12.5, fill: MUT}) +
    '</svg>';

  const loopBranch = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="循环与判断两个流程">` + DEFS +
    txt(320, 40, '三板斧：顺序、循环、判断', {fs: 16}) +
    card(40, 66, 270, 210, '#eef4fb', BLUE) +
    txt(175, 96, '循环：重复的事说一次', {fill: BLUE, fs: 14.5}) +
    card(90, 116, 170, 40, '#fff', LINE) +
    txt(175, 142, '重复 20 次：', {fs: 13}) +
    card(90, 168, 170, 40, '#fff', LINE) +
    txt(175, 194, '上下刷 🦷', {fs: 13}) +
    arrow('M175 156V168') +
    arrow('M260 188 C296 188 296 136 260 136', BLUE) +
    txt(298, 166, '↻ 回到开头', {fs: 11.5, fill: BLUE}) +
    txt(175, 240, '一句话说完 20 步，还不会数漏', {fs: 12, fill: MUT}) +
    card(330, 66, 270, 210, '#e4f3ee', GREEN) +
    txt(465, 96, '判断：岔路口问一句', {fill: '#187749', fs: 14.5}) +
    `<path d="M465 116 L525 156 L465 196 L405 156 Z" fill="#fff" stroke="#187749" stroke-width="2.5"/>` +
    txt(465, 161, '绿灯吗？', {fs: 12.5}) +
    txt(398, 222, '不是 → 等待', {fs: 12.5, fill: MUT}) +
    txt(532, 222, '绿灯 → 走', {fs: 12.5, fill: '#187749'}) +
    arrow('M425 182 C400 200 400 212 402 214', MUT) +
    arrow('M505 182 C530 200 530 212 528 214', GREEN) +
    txt(465, 254, '「如果……就……否则……」', {fs: 12, fill: MUT}) +
    txt(320, 306, '顺序＋循环＋判断，能搭出几乎所有程序', {fs: 14}) +
    '</svg>';

  const debug = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="第一个 bug 与调试四步">` + DEFS +
    txt(320, 40, '程序出错叫 bug，修它叫调试', {fs: 16}) +
    card(40, 66, 270, 210, '#fdf1ea', ORANGE) +
    txt(175, 98, '1947 年的第一只「虫」', {fill: ORANGE, fs: 15}) +
    `<text x="175" y="146" font-size="34">🐛</text>` +
    txt(175, 186, '工程师从电脑继电器里夹出', {fs: 12.5}) +
    txt(175, 210, '一只卡住的蛾子，贴进工作日志', {fs: 12.5}) +
    txt(175, 240, '从此「虫子」成了出错的名字', {fs: 12, fill: MUT}) +
    card(330, 66, 270, 210, '#eef4fb', BLUE) +
    txt(465, 98, '调试四步：当小侦探', {fill: BLUE, fs: 15}) +
    txt(360, 130, '① 复现：让它再错一次', {anchor: 'start', fs: 13}) +
    txt(360, 158, '② 定位：错在最后哪一步', {anchor: 'start', fs: 13}) +
    txt(360, 186, '③ 修改：改那一条指令', {anchor: 'start', fs: 13}) +
    txt(360, 214, '④ 再试：确认修好了', {anchor: 'start', fs: 13}) +
    txt(465, 246, '先想清楚原因，再动手', {fs: 12, fill: MUT}) +
    txt(320, 306, '错的多是人写的指令：漏一步、条件写反', {fs: 13.5}) +
    txt(320, 328 - 6, '出 bug 不丢人——会找错的人学得最快', {fs: 12.5, fill: MUT}) +
    '</svg>';

  /* ================= 第三站 ================= */

  const algorithmRecipe = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="算法像菜谱：输入步骤输出">` + DEFS +
    txt(320, 40, '算法是解题配方：输入 → 步骤 → 输出', {fs: 16}) +
    card(50, 74, 150, 96, '#f3edfb', PURPLE) +
    txt(125, 110, '输入', {fill: PURPLE, fs: 14.5}) +
    txt(125, 138, '🥕 食材 / 问题', {fs: 12.5}) +
    card(245, 74, 150, 96, '#eef4fb', BLUE) +
    txt(320, 110, '步骤', {fill: BLUE, fs: 14.5}) +
    txt(320, 138, '做法 / 算法', {fs: 12.5}) +
    card(440, 74, 150, 96, '#e4f3ee', GREEN) +
    txt(515, 110, '输出', {fill: '#187749', fs: 14.5}) +
    txt(515, 138, '🍲 成品 / 答案', {fs: 12.5}) +
    arrow('M200 122H245') + arrow('M395 122H440') +
    card(40, 196, 560, 92, '#fff', LINE) +
    txt(320, 224, '同一个问题，不同算法：在 1000 本藏书里找一本书', {fs: 13.5}) +
    txt(90, 254, '从头翻', {anchor: 'start', fs: 12.5, fill: RED}) +
    txt(220, 254, '最多 1000 次', {anchor: 'start', fs: 12.5}) +
    txt(90, 278, '先分类', {anchor: 'start', fs: 12.5, fill: GREEN}) +
    txt(220, 278, '直奔书架，几十本里再翻', {anchor: 'start', fs: 12.5}) +
    txt(320, 320, '好算法两条标准：结果对；步骤省——数据越大越值钱', {fs: 13.5}) +
    '</svg>';

  const searchLab = () => {
    if (typeof window !== 'undefined') {
      const interactive = window.ComputingLabs?.searchHTML?.();
      if (interactive) return interactive;
    }
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="二分查找台静态示意">` +
      `<rect x="8" y="8" width="624" height="324" rx="16" fill="#fdf4ec"/>` +
      txt(320, 150, '二分查找台', {fs: 18}) +
      txt(320, 186, '看电脑一轮轮猜中间数，把范围砍一半', {fs: 14, fill: MUT}) +
      '</svg>';
  };

  const sortLab = () => {
    if (typeof window !== 'undefined') {
      const interactive = window.ComputingLabs?.sortHTML?.();
      if (interactive) return interactive;
    }
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="排序实验台静态示意">` +
      `<rect x="8" y="8" width="624" height="324" rx="16" fill="#fdf4ec"/>` +
      txt(320, 150, '排序实验台', {fs: 18}) +
      txt(320, 186, '冒泡与选择，走一步看比较高亮', {fs: 14, fill: MUT}) +
      '</svg>';
  };

  const fastSlow = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="从头找与二分找的步数对比">` + DEFS +
    txt(320, 40, '数据越大，算法的差距越吓人', {fs: 16}) +
    card(40, 66, 270, 210, '#fdeaea', RED) +
    txt(175, 96, '从头找', {fill: '#a4453f', fs: 15}) +
    [[100, 150], [10000, 168], [1000000, 186]].map(([n, y]) =>
      txt(175, y, `${n} 个 → 最多 ${n} 次`, {fs: 12.5, fill: n >= 1000000 ? '#a4453f' : INK})).join('') +
    txt(175, 226, '数据翻倍，步数跟着翻倍', {fs: 12.5}) +
    txt(175, 254, '100 万人的名单：跑一晚上', {fs: 12, fill: MUT}) +
    card(330, 66, 270, 210, '#e4f3ee', GREEN) +
    txt(465, 96, '二分找', {fill: '#187749', fs: 15}) +
    txt(465, 150, '100 个 → 最多 7 次', {fs: 12.5}) +
    txt(465, 168, '1 万个 → 最多 14 次', {fs: 12.5}) +
    txt(465, 186, '100 万个 → 最多约 20 次', {fs: 12.5, fill: '#187749'}) +
    txt(465, 226, '数据翻倍，只多猜一次', {fs: 12.5}) +
    txt(465, 254, '同一台电脑：一眨眼出结果', {fs: 12, fill: MUT}) +
    txt(320, 306, '排序同理：冒泡比几千万次，聪明的方法只要十几万次', {fs: 13.5}) +
    txt(320, 330 - 4, '先想算法，再动手——电脑的速度要用在刀刃上', {fs: 12.5, fill: MUT}) +
    '</svg>';

  /* ================= 第四站 ================= */

  const aiPattern = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="写规则与看例子两种教法">` + DEFS +
    txt(320, 40, '教电脑认猫：写规则难全，看例子学得会', {fs: 16}) +
    card(40, 66, 270, 210, '#fdf1ea', ORANGE) +
    txt(175, 96, '人写规则 ❌', {fill: ORANGE, fs: 15}) +
    txt(175, 128, '「尖耳朵？有胡须？」', {fs: 12.5}) +
    txt(175, 152, '折耳猫：不算尖 → 漏', {fs: 12.5}) +
    txt(175, 176, '无毛猫：不像猫 → 漏', {fs: 12.5}) +
    txt(175, 204, '规则越写越多，总有余', {fs: 12, fill: MUT}) +
    txt(175, 230, '机器不会「理解」定义', {fs: 12, fill: MUT}) +
    card(330, 66, 270, 210, '#f3edfb', PURPLE) +
    txt(465, 96, '给例子自己学 ✅', {fill: PURPLE, fs: 15}) +
    txt(390, 134, '🐈🐈🐈🐈', {fs: 22}) +
    txt(465, 166, '上万张带标签的照片', {fs: 12.5}) +
    arrow('M465 180V206', PURPLE) +
    txt(465, 228, '电脑自己总结「模式」', {fs: 13, fill: PURPLE}) +
    txt(465, 254, '例子越多越丰富，规律越可靠', {fs: 12, fill: MUT}) +
    txt(320, 306, '这就是机器学习：AI 的本事来自「数据＋算法」，不是魔法', {fs: 13.5}) +
    '</svg>';

  const trainTest = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="AI 学习三步：收集数据、训练、考试">` + DEFS +
    txt(320, 40, 'AI 学习三步走', {fs: 16}) +
    card(40, 78, 170, 130, '#eef4fb', BLUE) +
    txt(125, 110, '① 收集数据', {fill: BLUE, fs: 14.5}) +
    txt(125, 144, '📊 带答案的例子', {fs: 12.5}) +
    txt(125, 170, '越多越多样越好', {fs: 11.5, fill: MUT}) +
    card(235, 78, 170, 130, '#f3edfb', PURPLE) +
    txt(320, 110, '② 训练', {fill: PURPLE, fs: 14.5}) +
    txt(320, 144, '🏀 算错就调参数', {fs: 12.5}) +
    txt(320, 170, '像投篮练姿势', {fs: 11.5, fill: MUT}) +
    card(430, 78, 170, 130, '#e4f3ee', GREEN) +
    txt(515, 110, '③ 考试', {fill: '#187749', fs: 14.5}) +
    txt(515, 144, '📝 用没见过的例子', {fs: 12.5}) +
    txt(515, 170, '背过的题不算数', {fs: 11.5, fill: MUT}) +
    arrow('M210 143H235') + arrow('M405 143H430') +
    txt(320, 252, '考试成绩叫「准确率」：100 题对 90 题，准确率 90%', {fs: 13.5}) +
    txt(320, 282, '数据偏了，模型就跟着偏——数据是 AI 的食谱', {fs: 13.5}) +
    txt(320, 310, '拿训练题当考试成绩＝作弊，看不出真本事', {fs: 12.5, fill: MUT}) +
    '</svg>';

  const classifyLab = () => {
    if (typeof window !== 'undefined') {
      const interactive = window.ComputingLabs?.classifyHTML?.();
      if (interactive) return interactive;
    }
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="分类器训练台静态示意">` +
      `<rect x="8" y="8" width="624" height="324" rx="16" fill="#f4f1fb"/>` +
      txt(320, 150, '分类器训练台', {fs: 18}) +
      txt(320, 186, '挪分界线，看训练对错；再考 5 个新果子', {fs: 14, fill: MUT}) +
      '</svg>';
  };

  const aiMistakes = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="AI 把雪地哈士奇认成狼的错案">` + DEFS +
    txt(320, 40, '著名翻车：雪地里的哈士奇被认成狼', {fs: 16}) +
    card(40, 66, 270, 210, '#eef4fb', BLUE) +
    txt(175, 96, '它学会了什么？', {fill: BLUE, fs: 15}) +
    `<text x="130" y="148" font-size="34">🐕</text>` +
    `<text x="220" y="148" font-size="26">❄️</text>` +
    txt(175, 186, '训练照片里的狼都在雪地', {fs: 12.5}) +
    txt(175, 210, 'AI 学会的是「有雪＝狼」', {fs: 12.5}) +
    txt(175, 238, '看的是背景，不是动物本身', {fs: 12, fill: MUT}) +
    card(330, 66, 270, 210, '#fdf1ea', ORANGE) +
    txt(465, 96, '数据偏，AI 就偏', {fill: ORANGE, fs: 15}) +
    txt(465, 134, '护士照片全是女性 →', {fs: 12.5}) +
    txt(465, 158, '见到男护士可能认错', {fs: 12.5}) +
    txt(465, 192, 'AI 错了还理直气壮，', {fs: 12.5}) +
    txt(465, 216, '说得头头是道', {fs: 12.5}) +
    txt(465, 246, '「语气自信」≠「答案正确」', {fs: 12, fill: MUT}) +
    txt(320, 306, '分界模糊、数据稀少的地方，AI 错得很自然', {fs: 13.5}) +
    txt(320, 332 - 6, '看病、开车、判真假——大事必须有人把关：AI 是助手，不是裁判', {fs: 12.5, fill: MUT}) +
    '</svg>';

  const canCannot = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="AI 擅长与不擅长的事情">` + DEFS +
    txt(320, 40, 'AI 能做什么？不能做什么？', {fs: 16}) +
    card(40, 66, 270, 210, '#e4f3ee', GREEN) +
    txt(175, 96, '✅ 很擅长：模式题', {fill: '#187749', fs: 15}) +
    txt(175, 130, '🖼️ 认照片 · 🎤 听写语音', {fs: 12.5}) +
    txt(175, 158, '🌐 翻译 · ♟️ 下棋 · 📺 推荐', {fs: 12.5}) +
    txt(175, 196, '共同点：规律清楚、数据够多', {fs: 12, fill: MUT}) +
    txt(175, 226, '做起来又快又稳', {fs: 12, fill: MUT}) +
    card(330, 66, 270, 210, '#fdeaea', RED) +
    txt(465, 96, '⛔ 不擅长：理解与负责', {fill: '#a4453f', fs: 15}) +
    txt(465, 130, '🤔 真正理解意思', {fs: 12.5}) +
    txt(465, 158, '❗ 保证答案全对 · 认错担责', {fs: 12.5}) +
    txt(465, 196, '会「一本正经地胡说」', {fs: 12, fill: MUT}) +
    txt(465, 226, '编造不存在的事，要交叉核查', {fs: 12, fill: MUT}) +
    txt(320, 306, '用 AI 的好习惯：先想自己的答案 · 重要结论查来源 · 拿不准问大人', {fs: 13.5}) +
    txt(320, 330 - 4, '作文思路要自己想——「思考」这一步不能外包', {fs: 12.5, fill: MUT}) +
    '</svg>';

  /* ================= 第五站 ================= */

  const packets = () => {
    const pack = (n, y) => `<rect x="204" y="${y}" width="88" height="24" rx="7" fill="#fff" stroke="${SKY}" stroke-width="2"/>` +
      txt(248, y + 16, `第 ${n} 包·序号 ${n}`, {fs: 10.5, fill: SKY});
    const routes = [
      'M296 118 C350 88 410 96 468 132',
      'M296 150 C350 150 410 158 468 158',
      'M296 182 C350 210 410 128 468 184',
      'M296 214 C350 248 410 208 468 210',
    ];
    return `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="大文件切成小包分路旅行">` + DEFS +
      txt(320, 40, '一张照片太大？切成小包分头寄', {fs: 16}) +
      card(50, 100, 120, 150, '#f3edfb', PURPLE) +
      txt(110, 132, '寄出', {fill: PURPLE, fs: 14}) +
      txt(110, 166, '🖼️', {fs: 24}) +
      txt(110, 200, '切成 4 包', {fs: 12}) +
      card(470, 100, 120, 150, '#e4f3ee', GREEN) +
      txt(530, 132, '收件', {fill: '#187749', fs: 14}) +
      txt(530, 166, '🖼️', {fs: 24}) +
      txt(530, 200, '按序号拼回', {fs: 12}) +
      txt(320, 92, '每包贴着地址和序号，各走各的路', {fs: 13, fill: MUT}) +
      pack(1, 108) + pack(2, 136) + pack(3, 164) + pack(4, 192) +
      routes.map(d => arrow(d, SKY, 2.4)).join('') +
      txt(320, 276, '这条路堵了走那条；丢一包？缺号再要一次就行', {fs: 13.5}) +
      txt(320, 304, '小包接力经过路由器、海底光缆——几秒绕地球半圈', {fs: 13}) +
      txt(320, 328, '拆包让网络又快又结实', {fs: 12, fill: MUT}) +
      '</svg>';
  };

  const pageLoad = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="打开网页的五步流水线">` + DEFS +
    txt(320, 40, '输入网址后的一秒钟', {fs: 16}) +
    [['① 查地址簿', 'DNS：网址→门牌号', BLUE], ['② 下单', '向服务器要网页', TEAL], ['③ 寄小包', 'HTML·图片·样式', ORANGE], ['④ 拼装', '浏览器搭积木', GREEN]].map(([t, s, c], i) => {
      const x = 56 + i * 150;
      return card(x, 80, 130, 110, c + '1a', c) +
        txt(x + 65, 112, t, {fill: c, fs: 13.5}) +
        txt(x + 65, 140, s, {fs: 11.5}) +
        txt(x + 65, 168, ['📖', '📡', '📦', '🏗️'][i], {fs: 18});
    }).join('') +
    arrow('M186 135H196') + arrow('M336 135H346') + arrow('M486 135H496') +
    txt(320, 236, '网址只是「名字」，DNS 负责翻译成服务器的 IP 门牌号', {fs: 13.5}) +
    txt(320, 266, '文字的包小、到得早——所以页面常「先出字后出图」', {fs: 13.5}) +
    txt(320, 296, '这一切通常一秒内完成：成千上万个小包一来一回', {fs: 13}) +
    '</svg>';

  const fakeInfo = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="三种常见假消息">` + DEFS +
    txt(320, 40, '「看到的」不再都等于「发生的」', {fs: 16}) +
    card(40, 66, 180, 200, '#fdeaea', RED) +
    txt(130, 96, '📢 标题党', {fill: '#a4453f', fs: 14.5}) +
    txt(130, 128, '「震惊！」「不转不是…」', {fs: 11.5}) +
    txt(130, 156, '情绪钩子，先冷静', {fs: 11.5}) +
    txt(130, 188, '越刺激越要停一停', {fs: 11, fill: MUT}) +
    card(230, 66, 180, 200, '#fdf1ea', ORANGE) +
    txt(320, 96, '✂️ 断章取义', {fill: ORANGE, fs: 14.5}) +
    txt(320, 128, '截半句话、裁半张图', {fs: 11.5}) +
    txt(320, 156, '意思就变了', {fs: 11.5}) +
    txt(320, 188, '找原始出处再看', {fs: 11, fill: MUT}) +
    card(420, 66, 180, 200, '#f3edfb', PURPLE) +
    txt(510, 96, '🤖 AI 合成', {fill: PURPLE, fs: 14.5}) +
    txt(510, 128, '以假乱真的照片视频', {fs: 11.5}) +
    txt(510, 156, '换脸、假新闻稿', {fs: 11.5}) +
    txt(510, 188, '真假不能只靠眼睛', {fs: 11, fill: MUT}) +
    txt(320, 296, '假消息跑得比真消息快——因为它们更「刺激」', {fs: 13.5}) +
    txt(320, 324, '不添一份力：转发前停三秒', {fs: 12.5, fill: MUT}) +
    '</svg>';

  const verify = () => `<svg class="fig-svg" viewBox="0 0 640 340" role="img" aria-label="查证四招">` + DEFS +
    txt(320, 40, '查证四招（流言粉碎机同款）', {fs: 16}) +
    [['🔍', '找来源', '原始出处是谁？', '「听说」不算', '#eef4fb', BLUE], ['⚖️', '多对比', '几家靠谱渠道', '说法一致才可信', '#eef7f3', TEAL], ['📊', '看证据', '照片数据实验，', '还是感叹号？', '#fdf1ea', ORANGE], ['🧑‍🏫', '问大人', '拿不准的事，', '先告诉家长', '#f3edfb', PURPLE]].map(([e, t, s1, s2, bg, c], i) => {
      const x = 46 + i * 144;
      return card(x, 76, 128, 150, bg, c) +
        txt(x + 64, 114, e, {fs: 24}) +
        txt(x + 64, 148, `第${'一二三四'[i]}招 ${t}`, {fill: c, fs: 13.5}) +
        txt(x + 64, 174, s1, {fs: 11, fill: MUT}) +
        txt(x + 64, 192, s2, {fs: 11, fill: MUT});
    }).join('') +
    txt(320, 264, '同学说「明天停课」？问来源 → 对比群和官网 → 看盖章通知 → 拿不准问老师', {fs: 12.5}) +
    txt(320, 294, '保护自己：名字、住址、学校、照片不发陌生平台；密码不外传', {fs: 13.5}) +
    txt(320, 322, '遇到吓人的、要钱的、让你保密的消息——停下来，先告诉大人', {fs: 12.5, fill: '#a4453f'}) +
    '</svg>';

  /* ---------- 注册表 ---------- */
  const REG = {
    'cp-bn-cp1': bannerCp1, 'cp-bn-cp2': bannerCp2, 'cp-bn-cp3': bannerCp3,
    'cp-bn-cp4': bannerCp4, 'cp-bn-cp5': bannerCp5,
    'cp-bit-switches': bitSwitches, 'cp-binary-count': binaryCount,
    'cp-binary-lab': binaryLab, 'cp-pixels': pixels,
    'cp-instructions': instructions, 'cp-cpu': cpu,
    'cp-loop-branch': loopBranch, 'cp-debug': debug,
    'cp-algorithm-recipe': algorithmRecipe, 'cp-search-lab': searchLab,
    'cp-sort-lab': sortLab, 'cp-fast-slow': fastSlow,
    'cp-ai-pattern': aiPattern, 'cp-train-test': trainTest,
    'cp-classify-lab': classifyLab, 'cp-ai-mistakes': aiMistakes,
    'cp-can-cannot': canCannot, 'cp-packets': packets,
    'cp-page-load': pageLoad, 'cp-fake-info': fakeInfo, 'cp-verify': verify,
  };

  const DEFAULT_CAPS = {
    'cp-bit-switches': '开是一关是零；多一个开关，消息翻一倍',
    'cp-binary-count': '满二进一：二进制的「10」等于 2',
    'cp-binary-lab': '二进制开关台：拨开关、摆目标数',
    'cp-pixels': '字有编号、图有格子——一切信息皆比特',
    'cp-instructions': '指令单：每步说清「拿什么、做什么」',
    'cp-cpu': '程序是指令单，CPU 是每秒几十亿条的快手',
    'cp-loop-branch': '重复交给循环，岔路交给判断',
    'cp-debug': '调试四步：复现、定位、修改、再试',
    'cp-algorithm-recipe': '算法是配方：既要结果对，也要步骤省',
    'cp-search-lab': '二分查找台：看范围一轮轮砍半',
    'cp-sort-lab': '排序实验台：冒泡与选择，走一步看一步',
    'cp-fast-slow': '数据翻倍：从头找步数翻倍，二分只多一步',
    'cp-ai-pattern': '不背定义看例子：AI 的老师是数据',
    'cp-train-test': '一收数据二训练，三拿新题来考试',
    'cp-classify-lab': '分类器训练台：挪分界线，再看考试对错',
    'cp-ai-mistakes': '数据偏了 AI 就偏：它学会了「有雪＝狼」',
    'cp-can-cannot': '模式题拿手，理解负责不行——脑子不能省',
    'cp-packets': '大数据切小包：贴地址序号，各走各路',
    'cp-page-load': '查地址簿、下单、寄包、拼装——一秒一条龙',
    'cp-fake-info': '标题党、断章取义、AI 合成——先冷静再判断',
    'cp-verify': '找来源、多对比、看证据、问大人',
    'cp-bn-cp1': '', 'cp-bn-cp2': '', 'cp-bn-cp3': '', 'cp-bn-cp4': '', 'cp-bn-cp5': '',
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
        window.ComputingLabs?.mount?.(fig);
      });
    };
    const mo = new MutationObserver(muts => {
      window.ComputingLabs?.prune?.();
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
  module.exports = ComputingFigures;
}
if (typeof window !== 'undefined') {
  window.ComputingFigures = ComputingFigures;
}

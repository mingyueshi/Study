/* ============================================================
   乐学堂 · 历史图示库（历史长廊专属）
   - 纯 SVG 插图，离线可用，打印友好
   - 互动演示（朝代长河时间轴）事件用委托绑定，
     页面重渲染后无需重新挂载
   - 数据里用 fig: 'history-xxx' / 'demo-history-xxx' 引用
   ============================================================ */
'use strict';

const HistoryFigures = (() => {
  const INK = '#34384d';
  const MUT = '#73788b';
  const LINE = '#dfe5f0';
  const GOLD = '#b5893a';
  const RED = '#e25563';
  const SEA = '#2f9bd6';
  const JADE = '#7ba05b';
  const BRONZE = '#8a6a33';
  const ORACLE = '#7c5a2e';

  /* ---------- 小工具 ---------- */
  const txt = (x, y, s, opt) => {
    opt = opt || {};
    return `<text x="${x}" y="${y}" fill="${opt.fill || INK}" font-size="${opt.fs || 14}"` +
      ` font-weight="${opt.fw || 700}" text-anchor="${opt.anchor || 'middle'}"` +
      (opt.cls ? ` class="${opt.cls}"` : '') + `>${s}</text>`;
  };
  const arrow = (x1, y1, x2, y2, color) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color || MUT}" stroke-width="2" marker-end="url(#hfig-arrow)"/>`;
  const DEFS = `<defs><marker id="hfig-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${MUT}"/></marker></defs>`;

  /* ================= 走进历史 ================= */

  /* 甲骨文与今天的汉字对照 */
  const oracle = () => {
    const stroke = `fill="none" stroke="${ORACLE}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"`;
    const glyphs = [
      { modern: '日', draw: (cx, cy) =>
        `<rect x="${cx - 20}" y="${cy - 20}" width="40" height="40" rx="12" ${stroke}/>` +
        `<line x1="${cx - 20}" y1="${cy}" x2="${cx + 20}" y2="${cy}" stroke="${ORACLE}" stroke-width="4.5" stroke-linecap="round"/>` },
      { modern: '月', draw: (cx, cy) =>
        `<path d="M ${cx + 14} ${cy - 26} Q ${cx - 32} ${cy} ${cx + 14} ${cy + 26} Q ${cx + 2} ${cy} ${cx + 14} ${cy - 26}" ${stroke}/>` +
        `<line x1="${cx + 4}" y1="${cy - 7}" x2="${cx + 4}" y2="${cy + 7}" stroke="${ORACLE}" stroke-width="4" stroke-linecap="round"/>` },
      { modern: '山', draw: (cx, cy) =>
        `<line x1="${cx - 30}" y1="${cy + 18}" x2="${cx + 30}" y2="${cy + 18}" stroke="${ORACLE}" stroke-width="4.5" stroke-linecap="round"/>` +
        `<line x1="${cx - 19}" y1="${cy + 18}" x2="${cx - 19}" y2="${cy - 2}" stroke="${ORACLE}" stroke-width="4.5" stroke-linecap="round"/>` +
        `<line x1="${cx}" y1="${cy + 18}" x2="${cx}" y2="${cy - 24}" stroke="${ORACLE}" stroke-width="4.5" stroke-linecap="round"/>` +
        `<line x1="${cx + 19}" y1="${cy + 18}" x2="${cx + 19}" y2="${cy}" stroke="${ORACLE}" stroke-width="4.5" stroke-linecap="round"/>` },
      { modern: '水', draw: (cx, cy) =>
        `<path d="M ${cx} ${cy - 24} Q ${cx + 13} ${cy - 10} ${cx} ${cy} Q ${cx - 13} ${cy + 10} ${cx} ${cy + 24}" ${stroke}/>` +
        `<line x1="${cx - 15}" y1="${cy - 13}" x2="${cx - 24}" y2="${cy - 20}" stroke="${ORACLE}" stroke-width="4" stroke-linecap="round"/>` +
        `<line x1="${cx - 15}" y1="${cy + 13}" x2="${cx - 24}" y2="${cy + 20}" stroke="${ORACLE}" stroke-width="4" stroke-linecap="round"/>` +
        `<line x1="${cx + 15}" y1="${cy - 13}" x2="${cx + 24}" y2="${cy - 20}" stroke="${ORACLE}" stroke-width="4" stroke-linecap="round"/>` +
        `<line x1="${cx + 15}" y1="${cy + 13}" x2="${cx + 24}" y2="${cy + 20}" stroke="${ORACLE}" stroke-width="4" stroke-linecap="round"/>` },
      { modern: '木', draw: (cx, cy) =>
        `<line x1="${cx}" y1="${cy - 25}" x2="${cx}" y2="${cy + 25}" stroke="${ORACLE}" stroke-width="4.5" stroke-linecap="round"/>` +
        `<path d="M ${cx} ${cy - 8} L ${cx - 16} ${cy - 21} M ${cx} ${cy - 8} L ${cx + 16} ${cy - 21} M ${cx} ${cy + 10} L ${cx - 14} ${cy + 21} M ${cx} ${cy + 10} L ${cx + 14} ${cy + 21}" ${stroke}/>` },
      { modern: '田', draw: (cx, cy) =>
        `<rect x="${cx - 20}" y="${cy - 20}" width="40" height="40" rx="6" ${stroke}/>` +
        `<line x1="${cx}" y1="${cy - 20}" x2="${cx}" y2="${cy + 20}" stroke="${ORACLE}" stroke-width="4.5"/>` +
        `<line x1="${cx - 20}" y1="${cy}" x2="${cx + 20}" y2="${cy}" stroke="${ORACLE}" stroke-width="4.5"/>` },
    ];
    let s = `<svg class="fig-svg" viewBox="0 0 640 186">`;
    s += txt(8, 34, '甲骨文', { anchor: 'start', fs: 12.5, fill: MUT });
    s += txt(8, 148, '今天的汉字', { anchor: 'start', fs: 12.5, fill: MUT });
    glyphs.forEach((g, i) => {
      const cx = 110 + i * 86, cy = 60;
      s += `<g>${g.draw(cx, cy)}</g>`;
      s += arrow(cx, 94, cx, 112, GOLD);
      s += txt(cx, 148, g.modern, { fs: 32, fw: 900 });
    });
    s += txt(320, 178, '甲骨文多是照着实物画出来的象形字，对照一下，认得出吗？', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 后母戊鼎 */
  const bronze = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 208">`;
    /* 鼎身 */
    s += `<rect x="120" y="84" width="180" height="84" rx="4" fill="#c99b57" stroke="${BRONZE}" stroke-width="3"/>`;
    s += `<rect x="114" y="78" width="192" height="16" rx="4" fill="#a3722e" stroke="${BRONZE}" stroke-width="2.5"/>`;
    /* 纹饰带 */
    for (let i = 0; i < 9; i++) s += `<rect x="${128 + i * 19}" y="98" width="11" height="11" fill="#a3722e" opacity=".55"/>`;
    s += `<circle cx="210" cy="134" r="15" fill="none" stroke="${BRONZE}" stroke-width="2.5"/><circle cx="210" cy="134" r="5.5" fill="${BRONZE}"/>`;
    /* 双耳 */
    s += `<path d="M148,80 v-14 a13,13 0 0 1 26,0 v14" fill="none" stroke="${BRONZE}" stroke-width="6"/>`;
    s += `<path d="M246,80 v-14 a13,13 0 0 1 26,0 v14" fill="none" stroke="${BRONZE}" stroke-width="6"/>`;
    /* 柱足 */
    [132, 178, 226, 272].forEach(x => s += `<rect x="${x}" y="168" width="22" height="26" rx="3" fill="#a3722e" stroke="${BRONZE}" stroke-width="2"/>`);
    /* 左侧标注 */
    s += txt(56, 62, '双耳', { anchor: 'start', fs: 12.5, fill: MUT }) + arrow(84, 57, 142, 57);
    s += txt(56, 130, '鼎身', { anchor: 'start', fs: 12.5, fill: MUT }) + arrow(84, 125, 116, 125);
    s += txt(56, 186, '柱足', { anchor: 'start', fs: 12.5, fill: MUT }) + arrow(84, 181, 130, 181);
    /* 右侧说明 */
    s += txt(340, 56, '后母戊鼎', { anchor: 'start', fs: 21, fw: 900 });
    s += txt(340, 80, '商朝 · 我国出土最重的青铜器', { anchor: 'start', fs: 13, fill: MUT });
    [['重约 832.84 千克', GOLD], ['铸造需要二三百人协同', RED], ['内壁有铭文「后母戊」', BRONZE], ['鼎是礼器，也是王权的象征', SEA]].forEach((it, i) => {
      s += `<circle cx="347" cy="${104 + i * 24 - 4}" r="3.5" fill="${it[1]}"/>`;
      s += txt(358, 104 + i * 24, it[0], { anchor: 'start', fs: 14 });
    });
    return s + '</svg>';
  };

  /* ================= 春秋战国 ================= */

  /* 诸子百家 */
  const sages = () => {
    const schools = [
      { key: '儒', name: '孔子 · 儒家', line: '「仁」爱人', sub: '《论语》记录言行', color: '#2f9bd6' },
      { key: '道', name: '老子 · 道家', line: '道法自然', sub: '著有《道德经》', color: '#2fbf71' },
      { key: '墨', name: '墨子 · 墨家', line: '兼爱 · 非攻', sub: '主张和平节用', color: '#d97745' },
      { key: '法', name: '韩非子 · 法家', line: '以法治国', sub: '重视法令赏罚', color: '#8b65c9' },
    ];
    let s = `<svg class="fig-svg" viewBox="0 0 640 192">`;
    schools.forEach((c, i) => {
      const x = 16 + i * 154, cx = x + 73;
      s += `<rect x="${x}" y="16" width="146" height="132" rx="14" fill="#fafbfe" stroke="${c.color}" stroke-width="2"/>`;
      s += `<circle cx="${cx}" cy="50" r="20" fill="${c.color}" opacity=".14"/>`;
      s += `<circle cx="${cx}" cy="50" r="20" fill="none" stroke="${c.color}" stroke-width="2"/>`;
      s += txt(cx, 57, c.key, { fs: 19, fw: 900, fill: c.color });
      s += txt(cx, 96, c.name, { fs: 15.5, fw: 900 });
      s += txt(cx, 118, c.line, { fs: 13.5, fill: c.color });
      s += txt(cx, 137, c.sub, { fs: 11.5, fill: MUT });
    });
    s += txt(320, 178, '战国时期学派众多、互相辩驳，史称「百家争鸣」', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* ================= 秦汉 ================= */

  /* 万里长城 */
  const greatwall = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 190">`;
    s += `<path d="M0,118 Q160,56 320,106 T640,92 L640,190 L0,190 Z" fill="#ecf1e2"/>`;
    s += `<path d="M0,148 Q120,84 240,136 T480,118 Q560,102 640,128 L640,190 L0,190 Z" fill="#dde8cf"/>`;
    /* 城墙：沿山脊蜿蜒 */
    s += `<path d="M0,132 L90,108 L190,132 L300,96 L410,124 L510,104 L640,124" fill="none" stroke="#938b7c" stroke-width="14" stroke-linecap="round"/>`;
    s += `<path d="M0,132 L90,108 L190,132 L300,96 L410,124 L510,104 L640,124" fill="none" stroke="#c3bbab" stroke-width="9" stroke-linecap="round"/>`;
    /* 烽火台 */
    [[90, 108], [300, 96], [510, 104]].forEach(([x, y]) => {
      s += `<rect x="${x - 17}" y="${y - 36}" width="34" height="44" rx="2" fill="#a89e8c" stroke="#857c6c" stroke-width="2"/>`;
      s += `<rect x="${x - 17}" y="${y - 43}" width="8" height="9" fill="#857c6c"/><rect x="${x - 4}" y="${y - 43}" width="8" height="9" fill="#857c6c"/><rect x="${x + 9}" y="${y - 43}" width="8" height="9" fill="#857c6c"/>`;
      s += `<rect x="${x - 4}" y="${y - 18}" width="8" height="11" fill="#6b6252"/>`;
    });
    s += txt(300, 34, '烽火台：白天冒烟、晚上点火，一站传一站', { fs: 12.5, fill: MUT });
    s += arrow(300, 40, 300, 56, MUT);
    s += txt(475, 66, '垛口', { fs: 12.5, fill: MUT });
    s += arrow(490, 70, 448, 84, MUT);
    return s + '</svg>';
  };

  /* 丝绸之路 */
  const silkroad = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 200">`;
    /* 群山 */
    s += `<path d="M336,100 L352,72 L368,100 Z" fill="#cfc8ba"/><path d="M360,102 L378,68 L396,102 Z" fill="#c2bba9"/>`;
    /* 路线 */
    s += `<path d="M70,150 C160,138 200,124 260,114 S400,84 570,58" fill="none" stroke="${GOLD}" stroke-width="3" stroke-dasharray="8 6"/>`;
    /* 骆驼 */
    s += `<g stroke="#a3722e" stroke-width="3" fill="none" stroke-linecap="round">` +
      `<line x1="236" y1="146" x2="236" y2="158"/><line x1="242" y1="146" x2="242" y2="158"/><line x1="250" y1="146" x2="250" y2="158"/><line x1="256" y1="146" x2="256" y2="158"/>` +
      `<path d="M234,140 Q238,128 244,138 Q249,128 256,140"/></g>`;
    s += `<ellipse cx="246" cy="140" rx="16" ry="7" fill="#c98a3d"/>`;
    s += `<path d="M259,138 Q266,128 264,118" fill="none" stroke="#c98a3d" stroke-width="4" stroke-linecap="round"/><circle cx="264" cy="116" r="4" fill="#c98a3d"/>`;
    /* 站点 */
    [[70, 150, '长安', '（今西安）'], [190, 128, '河西走廊', ''], [310, 104, '西域·今新疆', ''], [430, 82, '中亚', ''], [570, 58, '大秦·古罗马', '']].forEach((p, i) => {
      s += `<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="${GOLD}" stroke="#fff" stroke-width="2"/>`;
      const label = txt(p[0], p[1] + (i === 0 ? 26 : 22), p[2], { fs: i === 0 || i === 4 ? 14.5 : 13, fw: i === 0 || i === 4 ? 900 : 700 });
      s += label;
      if (p[3]) s += txt(p[0], p[1] + 42, p[3], { fs: 11.5, fill: MUT });
    });
    s += txt(320, 192, '东有丝绸漆器，西有葡萄核桃；驼铃摇了上千年', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* ================= 三国两晋南北朝 ================= */

  /* 三国鼎立 */
  const threekingdoms = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 200">`;
    s += `<rect x="60" y="28" width="520" height="146" rx="26" fill="#eef0e2" stroke="#cdd2bd" stroke-width="2"/>`;
    /* 分界线：魏 / 蜀吴 */
    s += `<path d="M60,84 Q320,64 580,88" fill="none" stroke="#9aa08a" stroke-width="2" stroke-dasharray="7 5"/>`;
    s += `<path d="M348,84 C354,112 360,142 364,174" fill="none" stroke="#9aa08a" stroke-width="2" stroke-dasharray="7 5"/>`;
    /* 长江 */
    s += `<path d="M84,152 Q160,144 240,152 T400,150 T560,146" fill="none" stroke="${SEA}" stroke-width="3" opacity=".75"/>`;
    s += txt(508, 168, '长江', { fs: 12.5, fill: SEA });
    /* 三国 */
    s += txt(320, 54, '魏 · 曹丕', { fs: 17.5, fw: 900, fill: '#c98a12' });
    s += txt(320, 74, '都城：洛阳', { fs: 12, fill: MUT });
    s += txt(200, 122, '蜀 · 刘备', { fs: 17.5, fw: 900, fill: '#4d7c3a' });
    s += txt(200, 142, '都城：成都', { fs: 12, fill: MUT });
    s += txt(468, 122, '吴 · 孙权', { fs: 17.5, fw: 900, fill: SEA });
    s += txt(468, 142, '都城：建业', { fs: 12, fill: MUT });
    /* 大战标记 */
    s += `<path d="M244,44 L256,56 M256,44 L244,56" stroke="${RED}" stroke-width="2.5" stroke-linecap="round"/>`;
    s += txt(250, 34, '官渡之战 200 年', { fs: 11.5, fill: RED });
    s += `<path d="M356,112 L368,124 M368,112 L356,124" stroke="${RED}" stroke-width="2.5" stroke-linecap="round"/>`;
    s += txt(362, 102, '赤壁之战 208 年', { fs: 11.5, fill: RED });
    s += txt(320, 194, '官渡之战后曹操统一北方；赤壁之战奠定三国鼎立', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* ================= 隋唐 ================= */

  /* 大运河 */
  const canal = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 200">`;
    /* 五大水系 */
    const rivers = [[40, '海河'], [70, '黄河'], [112, '淮河'], [145, '长江'], [185, '钱塘江']];
    rivers.forEach(([y, name]) => {
      s += `<path d="M60,${y} q10,-5 20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0" fill="none" stroke="#9cc8e8" stroke-width="3"/>`;
      s += txt(52, y + 4, name, { anchor: 'end', fs: 12, fill: SEA });
    });
    /* 运河四段 */
    s += `<path d="M300,92 C300,70 305,48 308,30" fill="none" stroke="#4d96ff" stroke-width="4.5"/>`;
    s += `<path d="M300,92 C320,100 330,106 338,112" fill="none" stroke="#4d96ff" stroke-width="4.5"/>`;
    s += `<path d="M338,112 C342,124 344,134 346,145" fill="none" stroke="#4d96ff" stroke-width="4.5"/>`;
    s += `<path d="M346,145 C352,158 360,172 368,185" fill="none" stroke="#4d96ff" stroke-width="4.5"/>`;
    s += txt(314, 58, '永济渠', { anchor: 'start', fs: 12, fill: '#4d96ff' });
    s += txt(312, 110, '通济渠', { anchor: 'start', fs: 12, fill: '#4d96ff' });
    s += txt(350, 130, '邗沟', { anchor: 'start', fs: 12, fill: '#4d96ff' });
    s += txt(320, 168, '江南河', { anchor: 'start', fs: 12, fill: '#4d96ff' });
    /* 城市 */
    s += `<circle cx="308" cy="28" r="5.5" fill="${RED}" stroke="#fff" stroke-width="2"/>`;
    s += `<circle cx="300" cy="92" r="6.5" fill="${RED}" stroke="#fff" stroke-width="2"/>`;
    s += `<circle cx="368" cy="185" r="5.5" fill="${RED}" stroke="#fff" stroke-width="2"/>`;
    s += txt(320, 24, '涿郡（今北京）', { anchor: 'start', fs: 13, fw: 900 });
    s += txt(288, 97, '洛阳（中心）', { anchor: 'end', fs: 13, fw: 900 });
    s += txt(380, 190, '余杭（今杭州）', { anchor: 'start', fs: 13, fw: 900 });
    /* 右侧要点 */
    [['北起涿郡，南至余杭', INK], ['以洛阳为中心', INK], ['沟通五大水系', INK], ['全长两千多千米', MUT]].forEach((it, i) => {
      s += txt(478, 62 + i * 30, it[0], { anchor: 'start', fs: 13.5, fill: it[1] });
    });
    return s + '</svg>';
  };

  /* 科举阶梯 */
  const examStairs = () => {
    const steps = [
      { x: 40, y: 132, exam: '童试（地方）', degree: '秀才', color: '#7ba05b' },
      { x: 170, y: 102, exam: '乡试（省城）', degree: '举人', color: '#2f9bd6' },
      { x: 300, y: 72, exam: '会试（京城）', degree: '贡士', color: '#8b65c9' },
      { x: 430, y: 42, exam: '殿试（皇宫）', degree: '状元·榜眼·探花', color: '#b5893a' },
    ];
    let s = `<svg class="fig-svg" viewBox="0 0 640 198">`;
    steps.forEach((st, i) => {
      const bottom = 178;
      s += `<rect x="${st.x}" y="${st.y}" width="130" height="${bottom - st.y}" rx="6" fill="${st.color}" opacity=".12"/>`;
      s += `<rect x="${st.x}" y="${st.y}" width="130" height="${bottom - st.y}" rx="6" fill="none" stroke="${st.color}" stroke-width="2"/>`;
      s += txt(st.x + 65, st.y + 20, st.exam, { fs: 12, fill: MUT });
      s += txt(st.x + 65, st.y + 44, st.degree, { fs: st.degree.length > 4 ? 13.5 : 17, fw: 900, fill: st.color });
      if (i < 3) s += arrow(st.x + 138, st.y + 30, st.x + 158, st.y + 12, MUT);
    });
    s += txt(495, 32, '★ 金榜题名', { fs: 14, fill: GOLD, anchor: 'start' });
    s += txt(320, 192, '「朝为田舍郎，暮登天子堂」——科举让平民也能凭才学做官', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* ================= 宋元明清 ================= */

  /* 四大发明 */
  const fourInventions = () => {
    const cards = [
      { emoji: '📜', title: '造纸术', sub: '西汉有纸，东汉蔡伦改进', color: '#2f9bd6' },
      { emoji: '🖨️', title: '印刷术', sub: '隋唐雕版，北宋毕昇活字', color: '#e25563' },
      { emoji: '🧭', title: '指南针', sub: '战国司南，北宋用于航海', color: '#2fbf71' },
      { emoji: '💥', title: '火药', sub: '唐代发现，宋代用于军事', color: '#d97745' },
    ];
    let s = `<svg class="fig-svg" viewBox="0 0 640 200">`;
    cards.forEach((c, i) => {
      const x = 20 + (i % 2) * 302, y = 16 + Math.floor(i / 2) * 88;
      s += `<rect x="${x}" y="${y}" width="298" height="76" rx="14" fill="#fafbfe" stroke="#e3e7f2" stroke-width="1.5"/>`;
      s += `<rect x="${x}" y="${y}" width="6" height="76" rx="3" fill="${c.color}"/>`;
      s += txt(x + 40, y + 50, c.emoji, { fs: 30 });
      s += txt(x + 72, y + 34, c.title, { anchor: 'start', fs: 16.5, fw: 900 });
      s += txt(x + 72, y + 58, c.sub, { anchor: 'start', fs: 12.5, fill: MUT });
    });
    s += txt(320, 194, '四大发明先后传向世界，推动了人类文明的发展', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 郑和宝船 vs 哥伦布船队 */
  const zhenghe = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 212">`;
    s += `<rect x="0" y="150" width="640" height="62" fill="#d9edf8"/>`;
    s += `<path d="M0,168 q20,-6 40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0" fill="none" stroke="#b7dcef" stroke-width="2.5"/>`;
    /* 郑和宝船 */
    s += `<path d="M60,150 L330,150 L316,172 Q195,184 74,172 Z" fill="#8a5a2b" stroke="#6d4520" stroke-width="2.5"/>`;
    [120, 195, 270].forEach(x => {
      s += `<line x1="${x}" y1="150" x2="${x}" y2="68" stroke="#6d4520" stroke-width="4"/>`;
      s += `<rect x="${x - 26}" y="76" width="52" height="34" rx="3" fill="#f3e6c8" stroke="#c9b98a" stroke-width="2"/>`;
      s += `<rect x="${x - 22}" y="114" width="44" height="30" rx="3" fill="#f3e6c8" stroke="#c9b98a" stroke-width="2"/>`;
      s += `<line x1="${x - 26}" y1="93" x2="${x + 26}" y2="93" stroke="#c9b98a" stroke-width="1.5"/><line x1="${x - 22}" y1="129" x2="${x + 22}" y2="129" stroke="#c9b98a" stroke-width="1.5"/>`;
    });
    s += `<path d="M120,68 L140,72 L120,77 Z" fill="#c8442e"/>`;
    /* 哥伦布旗舰（小很多） */
    s += `<path d="M420,150 L540,150 L530,166 Q480,172 430,166 Z" fill="#94663c" stroke="#7a5230" stroke-width="2"/>`;
    [[455, 100], [505, 92]].forEach(([x, top]) => {
      s += `<line x1="${x}" y1="150" x2="${x}" y2="${top}" stroke="#7a5230" stroke-width="3"/>`;
      s += `<rect x="${x - 13}" y="${top + 4}" width="26" height="26" rx="2" fill="#f3e6c8" stroke="#c9b98a" stroke-width="1.5"/>`;
    });
    s += `<path d="M455,100 L469,103 L455,107 Z" fill="#c8442e"/>`;
    /* 说明 */
    s += txt(195, 40, '郑和宝船（1405 年）', { fs: 14.5, fw: 900 });
    s += txt(195, 58, '长约 150 米 · 两百多艘 · 两万七千多人', { fs: 12, fill: MUT });
    s += txt(480, 52, '哥伦布船队（1492 年）', { fs: 13, fw: 900 });
    s += txt(480, 70, '旗舰约 20 多米 · 3 艘 · 约 90 人', { fs: 11.5, fill: MUT });
    return s + '</svg>';
  };

  /* 故宫 */
  const palace = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 200">`;
    /* 上层屋顶 */
    s += `<path d="M226,52 Q320,44 414,52 L388,28 Q320,22 252,28 Z" fill="#e6b23c" stroke="#c9962c" stroke-width="2"/>`;
    s += `<rect x="244" y="20" width="12" height="14" rx="3" fill="#c9962c"/><rect x="384" y="20" width="12" height="14" rx="3" fill="#c9962c"/>`;
    /* 下层屋顶 */
    s += `<path d="M150,96 Q320,86 490,96 L458,60 Q320,52 182,60 Z" fill="#e6b23c" stroke="#c9962c" stroke-width="2"/>`;
    /* 红墙与柱 */
    s += `<rect x="200" y="96" width="240" height="44" fill="#c8442e" stroke="#a83524" stroke-width="2"/>`;
    for (let i = 0; i < 6; i++) s += `<rect x="${212 + i * 40}" y="96" width="9" height="44" fill="#b23a26"/>`;
    s += `<rect x="306" y="108" width="28" height="32" rx="2" fill="#8f2c1c"/>`;
    /* 台基 */
    s += `<rect x="170" y="140" width="300" height="12" rx="2" fill="#f2f0ea" stroke="#d9d6cc" stroke-width="1.5"/>`;
    s += `<rect x="140" y="152" width="360" height="26" rx="2" fill="#eceae4" stroke="#d2cfc6" stroke-width="1.5"/>`;
    s += `<rect x="296" y="166" width="48" height="12" fill="#dcd9d0"/>`;
    /* 标注 */
    s += txt(540, 42, '黄琉璃瓦', { anchor: 'start', fs: 12.5, fill: MUT });
    s += arrow(534, 46, 424, 46, MUT);
    s += txt(540, 114, '红墙', { anchor: 'start', fs: 12.5, fill: MUT });
    s += arrow(534, 118, 446, 118, MUT);
    s += txt(540, 162, '汉白玉台基', { anchor: 'start', fs: 12.5, fill: MUT });
    s += arrow(534, 166, 506, 166, MUT);
    s += txt(320, 194, '北京故宫 1420 年建成，是明清两代的皇宫', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* ================= 走进历史：公元与世纪 ================= */
  /* 公元前倒着数，公元顺着数；百年一世纪 */
  const adEra = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 210">`;
    /* 轴线 */
    s += `<line x1="40" y1="110" x2="600" y2="110" stroke="${MUT}" stroke-width="2.5"/>`;
    s += `<polygon points="600,110 588,104 588,116" fill="${MUT}"/>`;
    s += `<line x1="320" y1="100" x2="320" y2="120" stroke="${RED}" stroke-width="3"/>`;
    s += txt(320, 92, '公元元年', { fs: 13, fill: RED, fw: 900 });
    s += txt(320, 138, '（没有公元 0 年）', { fs: 11.5, fill: MUT });
    /* 公元前刻度（倒着数） */
    const bcYears = [['前300', 80], ['前221', 140], ['前200', 190], ['前100', 260]];
    bcYears.forEach(([label, x]) => {
      s += `<line x1="${x}" y1="104" x2="${x}" y2="116" stroke="${MUT}" stroke-width="2"/>`;
      s += txt(x, 152, label, { fs: 12.5, fill: '#c45a4a' });
    });
    s += arrow(190, 100, 80, 100, '#c45a4a');
    s += txt(130, 70, '公元前：数字越大越早', { fs: 13, fill: '#c45a4a', fw: 700 });
    /* 公元刻度（顺着数） */
    const adYears = [['100', 380], ['618', 470], ['1405', 540], ['2024', 590]];
    adYears.forEach(([label, x]) => {
      s += `<line x1="${x}" y1="104" x2="${x}" y2="116" stroke="${MUT}" stroke-width="2"/>`;
      s += txt(x, 152, label, { fs: 12.5, fill: '#2a7a52' });
    });
    s += arrow(450, 100, 560, 100, '#2a7a52');
    s += txt(505, 70, '公元：数字越大越晚', { fs: 13, fill: '#2a7a52', fw: 700 });
    /* 世纪说明 */
    s += `<rect x="40" y="172" width="560" height="28" rx="14" fill="#f6efe2" stroke="${GOLD}" stroke-width="1.5"/>`;
    s += txt(320, 191, '💡 一百年 = 一个世纪：618 年是 7 世纪，2024 年是 21 世纪', { fs: 14, fill: BRONZE, fw: 700 });
    return s + '</svg>';
  };

  /* ================= 上古传说：大禹治水（堵 vs 疏导） ================= */
  const yuFlood = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 210">`;
    /* 左：鲧用堵 */
    s += `<rect x="20" y="20" width="280" height="150" rx="14" fill="#fdecea" stroke="#e4b6b2" stroke-width="1.5"/>`;
    s += txt(160, 48, '鲧：围堵（失败）', { fs: 16, fw: 900, fill: '#a4453f' });
    /* 堤坝 */
    s += `<rect x="50" y="120" width="220" height="14" fill="#a89e8c" stroke="#857c6c" stroke-width="2"/>`;
    for (let i = 0; i < 6; i++) s += `<rect x="${60 + i * 36}" y="108" width="22" height="14" fill="#857c6c"/>`;
    /* 水涨高 */
    s += `<path d="M50,120 Q90,110 130,120 T210,120 T270,120 L270,100 Q230,90 190,100 T110,100 T50,100 Z" fill="#9cc8e8" opacity=".85"/>`;
    s += `<path d="M50,100 Q90,90 130,100 T210,100 T270,100 L270,80 Q230,72 190,80 T110,80 T50,80 Z" fill="#7fb6dd" opacity=".8"/>`;
    s += txt(160, 70, '水越堵越高', { fs: 13, fill: '#a4453f', fw: 700 });
    /* 右：禹用疏导 */
    s += `<rect x="340" y="20" width="280" height="150" rx="14" fill="#e9f9f0" stroke="#bfe5cc" stroke-width="1.5"/>`;
    s += txt(480, 48, '禹：疏导（成功）', { fs: 16, fw: 900, fill: '#187749' });
    /* 河道 */
    s += `<path d="M360,130 Q400,110 440,130 T520,130 T600,130" fill="none" stroke="#4d96ff" stroke-width="10" stroke-linecap="round"/>`;
    s += `<path d="M360,130 Q400,110 440,130 T520,130 T600,130" fill="none" stroke="#7fb6dd" stroke-width="5" stroke-linecap="round"/>`;
    s += `<path d="M360,130 Q400,110 440,130 T520,130 T600,130" fill="none" stroke="#bfe0f5" stroke-width="2" stroke-linecap="round" stroke-dasharray="6 8"/>`;
    /* 流向海的箭头 */
    s += arrow(560, 110, 596, 110, '#2a7a52');
    s += txt(580, 98, '海', { fs: 14, fw: 900, fill: '#187749' });
    s += txt(480, 70, '挖渠引水入大海', { fs: 13, fill: '#187749', fw: 700 });
    s += txt(320, 196, '治水要顺着水性：堵不如疏', { fs: 14, fill: MUT, fw: 700 });
    return s + '</svg>';
  };

  /* ================= 夏商西周：分封制金字塔 ================= */
  const enfeoffment = () => {
    const levels = [
      { name: '天子', sub: '周王', color: '#c2557d', y: 30, w: 120 },
      { name: '诸侯', sub: '分封亲属、功臣', color: '#e2a63a', y: 78, w: 240 },
      { name: '卿大夫', sub: '诸侯再分封', color: '#2f9bd6', y: 126, w: 360 },
      { name: '士', sub: '最低贵族阶层', color: '#2fbf71', y: 174, w: 480 },
    ];
    let s = `<svg class="fig-svg" viewBox="0 0 640 230">`;
    levels.forEach(l => {
      const x = 320 - l.w / 2;
      s += `<rect x="${x}" y="${l.y}" width="${l.w}" height="40" rx="8" fill="${l.color}" opacity=".15"/>`;
      s += `<rect x="${x}" y="${l.y}" width="${l.w}" height="40" rx="8" fill="none" stroke="${l.color}" stroke-width="2.5"/>`;
      s += txt(320, l.y + 26, l.name, { fs: 18, fw: 900, fill: l.color });
      s += txt(x + l.w - 70, l.y + 26, l.sub, { fs: 11.5, fill: MUT, anchor: 'end' });
    });
    s += `<line x1="320" y1="70" x2="320" y2="78" stroke="${MUT}" stroke-width="2"/>`;
    s += `<line x1="320" y1="118" x2="320" y2="126" stroke="${MUT}" stroke-width="2"/>`;
    s += `<line x1="320" y1="166" x2="320" y2="174" stroke="${MUT}" stroke-width="2"/>`;
    s += txt(320, 222, '分封制：层层分封，靠血缘和忠诚维系（「封建」本义）', { fs: 13.5, fill: MUT, fw: 700 });
    return s + '</svg>';
  };

  /* ================= 春秋战国：都江堰结构 ================= */
  const dujiangyan = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 210">`;
    /* 岷江 */
    s += `<path d="M0,100 Q120,80 240,100 T480,100 T640,100 L640,210 L0,210 Z" fill="#d9edf8"/>`;
    s += `<path d="M0,100 Q120,80 240,100 T480,100 T640,100" fill="none" stroke="#7fb6dd" stroke-width="3"/>`;
    s += txt(20, 92, '岷江', { fs: 13, fill: '#2f6fa3', fw: 700, anchor: 'start' });
    /* 鱼嘴分水堤 */
    s += `<path d="M160,100 Q200,80 260,100" fill="none" stroke="#a89e8c" stroke-width="10" stroke-linecap="round"/>`;
    s += `<path d="M160,100 Q200,80 260,100" fill="none" stroke="#c3bbab" stroke-width="5" stroke-linecap="round"/>`;
    s += txt(210, 74, '鱼嘴', { fs: 13, fw: 900, fill: '#6d6252' });
    s += arrow(210, 80, 210, 92, '#6d6252');
    /* 内江（灌溉）与外江（排洪） */
    s += txt(120, 130, '外江（排洪）', { fs: 11.5, fill: '#2f6fa3' });
    s += txt(300, 130, '内江（灌溉）', { fs: 11.5, fill: '#2a7a52' });
    s += arrow(120, 118, 200, 118, '#2f6fa3');
    s += arrow(300, 118, 420, 118, '#2a7a52');
    /* 飞沙堰 */
    s += `<rect x="340" y="100" width="70" height="10" rx="3" fill="#c98a3d" stroke="#a3722e" stroke-width="2"/>`;
    s += txt(375, 92, '飞沙堰', { fs: 11.5, fw: 700, fill: '#a3722e' });
    s += txt(375, 150, '溢洪排沙', { fs: 11, fill: MUT });
    /* 宝瓶口 */
    s += `<rect x="500" y="96" width="10" height="20" fill="#8a6a33"/>`;
    s += `<rect x="500" y="96" width="10" height="20" fill="none" stroke="#6d4520" stroke-width="1.5"/>`;
    s += txt(540, 108, '宝瓶口', { fs: 12, fw: 900, fill: '#6d4520', anchor: 'start' });
    s += txt(540, 126, '引水入成都平原', { fs: 11, fill: MUT, anchor: 'start' });
    s += arrow(510, 140, 540, 160, '#2a7a52');
    s += txt(320, 192, '无坝引水：鱼嘴分水、飞沙堰排沙、宝瓶口控水', { fs: 13.5, fill: MUT, fw: 700 });
    return s + '</svg>';
  };

  /* ================= 秦汉：秦始皇统一 ================= */
  const qinUnify = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 210">`;
    const items = [
      { label: '文字', before: '馬 馬 馬', after: '小篆「馬」', color: '#c2557d' },
      { label: '货币', before: '刀币·布币·圜钱', after: '半两钱', color: '#e2a63a' },
      { label: '度量衡', before: '各地长短不一', after: '统一标准', color: '#2f9bd6' },
    ];
    items.forEach((it, i) => {
      const y = 18 + i * 64;
      s += `<rect x="20" y="${y}" width="600" height="54" rx="12" fill="#fafbfe" stroke="${it.color}" stroke-width="1.5"/>`;
      s += `<rect x="20" y="${y}" width="6" height="54" rx="3" fill="${it.color}"/>`;
      s += txt(48, y + 34, it.label, { fs: 17, fw: 900, fill: it.color, anchor: 'start' });
      /* before */
      s += `<rect x="120" y="${y + 12}" width="200" height="30" rx="8" fill="#fdecea"/>`;
      s += txt(220, y + 32, it.before, { fs: 13, fill: '#a4453f' });
      /* arrow */
      s += arrow(330, y + 27, 380, y + 27, it.color);
      s += txt(355, y + 16, '统一', { fs: 11, fill: it.color });
      /* after */
      s += `<rect x="396" y="${y + 12}" width="210" height="30" rx="8" fill="#e9f9f0"/>`;
      s += txt(501, y + 32, it.after, { fs: 13, fill: '#187749', fw: 700 });
    });
    s += txt(320, 198, '书同文、车同轨、统一度量衡——全国政令畅通', { fs: 13.5, fill: MUT, fw: 700 });
    return s + '</svg>';
  };

  /* ================= 秦汉：蔡伦造纸流程 ================= */
  const papermaking = () => {
    const steps = [
      { icon: '🌲', name: '原料', sub: '树皮·麻头·破布·旧渔网', color: '#7ba05b' },
      { icon: '💧', name: '浸泡·舂捣', sub: '加水捣烂成浆', color: '#2f9bd6' },
      { icon: '🪵', name: '抄纸', sub: '竹帘捞出薄层', color: '#8a6a33' },
      { icon: '☀️', name: '晾晒', sub: '揭下烘干即成纸', color: '#e2a63a' },
    ];
    let s = `<svg class="fig-svg" viewBox="0 0 640 200">`;
    steps.forEach((st, i) => {
      const x = 20 + i * 154;
      s += `<rect x="${x}" y="20" width="138" height="120" rx="14" fill="#fafbfe" stroke="${st.color}" stroke-width="2"/>`;
      s += txt(x + 69, 62, st.icon, { fs: 34 });
      s += txt(x + 69, 92, st.name, { fs: 15, fw: 900, fill: st.color });
      s += txt(x + 69, 114, st.sub, { fs: 11, fill: MUT });
      if (i < 3) s += arrow(x + 140, 80, x + 150, 80, st.color);
    });
    s += txt(320, 166, '蔡伦造纸（105 年）：又轻又便宜，取代竹简和丝帛', { fs: 14, fill: MUT, fw: 700 });
    s += txt(320, 188, '造纸术外传阿拉伯、欧洲，推动世界文化传播', { fs: 12, fill: MUT });
    return s + '</svg>';
  };

  /* ================= 三国两晋：祖冲之与圆周率 ================= */
  const piCircle = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 200">`;
    /* 圆 */
    s += `<circle cx="140" cy="100" r="72" fill="none" stroke="#2f9bd6" stroke-width="3"/>`;
    /* 内接正多边形示意（虚线） */
    const pts = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      pts.push(`${140 + 72 * Math.cos(a)},${100 + 72 * Math.sin(a)}`);
    }
    s += `<polygon points="${pts.join(' ')}" fill="none" stroke="#7ba05b" stroke-width="1.5" stroke-dasharray="4 4" opacity=".7"/>`;
    /* 直径 */
    s += `<line x1="68" y1="100" x2="212" y2="100" stroke="${RED}" stroke-width="2.5"/>`;
    s += txt(140, 92, '直径 d', { fs: 12, fill: RED });
    s += txt(140, 188, '割圆术：多边形边数越多，越接近圆', { fs: 12.5, fill: MUT });
    /* 右侧说明 */
    s += txt(340, 50, '圆周率 π = 周长 ÷ 直径', { fs: 16, fw: 900, anchor: 'start' });
    s += txt(340, 80, '祖冲之算出：', { fs: 14, fill: MUT, anchor: 'start' });
    s += `<rect x="340" y="92" width="270" height="32" rx="8" fill="#e9f9f0" stroke="#2fbf71" stroke-width="1.5"/>`;
    s += txt(475, 113, '3.1415926 ～ 3.1415927', { fs: 16, fw: 900, fill: '#187749' });
    s += txt(340, 144, '领先世界近 1000 年！', { fs: 14, fill: GOLD, fw: 800, anchor: 'start' });
    s += txt(340, 168, '密率 355/113，约率 22/7', { fs: 12.5, fill: MUT, anchor: 'start' });
    return s + '</svg>';
  };

  /* ================= 隋唐：玄奘西行 vs 鉴真东渡 ================= */
  const xuanzangJianzhen = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 200">`;
    /* 中央：唐朝 */
    s += `<circle cx="320" cy="100" r="44" fill="#fff3d8" stroke="#e2a63a" stroke-width="2.5"/>`;
    s += txt(320, 96, '唐朝', { fs: 20, fw: 900, fill: '#8a6a33' });
    s += txt(320, 116, '长安', { fs: 13, fill: MUT });
    /* 左：天竺 */
    s += `<circle cx="90" cy="100" r="40" fill="#ede7ff" stroke="#9b5de5" stroke-width="2"/>`;
    s += txt(90, 96, '天竺', { fs: 16, fw: 900, fill: '#77589c' });
    s += txt(90, 114, '今印度', { fs: 11.5, fill: MUT });
    /* 右：日本 */
    s += `<circle cx="550" cy="100" r="40" fill="#ffe8ed" stroke="#c28097" stroke-width="2"/>`;
    s += txt(550, 96, '日本', { fs: 16, fw: 900, fill: '#a25470' });
    s += txt(550, 114, '奈良', { fs: 11.5, fill: MUT });
    /* 玄奘西行 */
    s += arrow(130, 78, 276, 78, '#9b5de5');
    s += txt(203, 64, '玄奘西行求法', { fs: 13, fw: 700, fill: '#77589c' });
    s += txt(203, 84, '《大唐西域记》', { fs: 11, fill: MUT });
    /* 鉴真东渡 */
    s += arrow(364, 122, 510, 122, '#c28097');
    s += txt(437, 116, '鉴真东渡传法', { fs: 13, fw: 700, fill: '#a25470' });
    s += txt(437, 138, '六次东渡·双目失明', { fs: 11, fill: MUT });
    s += txt(320, 178, '一去一回，都是中外文化交流的佳话', { fs: 13.5, fill: MUT, fw: 700 });
    return s + '</svg>';
  };

  /* ================= 宋元：岳飞精忠报国 ================= */
  const yuefei = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 200">`;
    /* 岳飞跪坐背影 */
    s += `<ellipse cx="220" cy="150" rx="70" ry="20" fill="#ede7ff" opacity=".6"/>`;
    /* 身体 */
    s += `<path d="M170,150 L170,90 Q220,70 270,90 L270,150 Z" fill="#5a6b8a" stroke="#3d4a63" stroke-width="2"/>`;
    /* 头 */
    s += `<circle cx="220" cy="64" r="22" fill="#f0d9b5" stroke="#c9a96e" stroke-width="2"/>`;
    /* 发髻 */
    s += `<path d="M206,46 Q220,34 234,46" fill="none" stroke="#3d4a63" stroke-width="5" stroke-linecap="round"/>`;
    /* 背上刺字 */
    s += txt(220, 118, '精忠', { fs: 16, fw: 900, fill: RED });
    s += txt(220, 138, '报国', { fs: 16, fw: 900, fill: RED });
    /* 岳母持针 */
    s += `<circle cx="360" cy="90" r="18" fill="#f0d9b5" stroke="#c9a96e" stroke-width="2"/>`;
    s += `<path d="M352,72 Q360,60 368,72" fill="none" stroke="#7a5b18" stroke-width="4" stroke-linecap="round"/>`;
    s += `<line x1="342" y1="90" x2="290" y2="110" stroke="#7a5b18" stroke-width="3" stroke-linecap="round"/>`;
    s += `<circle cx="290" cy="110" r="3" fill="#7a5b18"/>`;
    /* 右侧文字 */
    s += txt(460, 56, '岳母刺字', { fs: 18, fw: 900, anchor: 'start' });
    s += txt(460, 82, '「尽忠报国」', { fs: 15, fill: RED, fw: 700, anchor: 'start' });
    [['郾城大败金军', INK], ['冻死不拆屋，饿死不掳掠', MUT], ['「莫须有」冤狱', RED], ['杭州岳王庙纪念', MUT]].forEach((it, i) => {
      s += `<circle cx="468" cy="${104 + i * 20}" r="3" fill="${it[1]}"/>`;
      s += txt(478, 108 + i * 20, it[0], { fs: 12.5, fill: it[1], anchor: 'start' });
    });
    s += txt(320, 190, '「青山有幸埋忠骨，白铁无辜铸佞臣」', { fs: 13, fill: MUT, fw: 700 });
    return s + '</svg>';
  };

  /* ================= 宋元：元朝行省制度 ================= */
  const province = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 200">`;
    /* 中央 */
    s += `<rect x="260" y="20" width="120" height="48" rx="10" fill="#8b65c9" opacity=".15"/>`;
    s += `<rect x="260" y="20" width="120" height="48" rx="10" fill="none" stroke="#8b65c9" stroke-width="2.5"/>`;
    s += txt(320, 42, '中书省', { fs: 16, fw: 900, fill: '#77589c' });
    s += txt(320, 60, '中央', { fs: 11, fill: MUT });
    /* 行省 */
    const provinces = ['岭北', '辽阳', '甘肃', '陕西', '河南', '四川', '云南', '湖广', '江浙', '江西'];
    provinces.forEach((p, i) => {
      const row = Math.floor(i / 5);
      const col = i % 5;
      const x = 40 + col * 120;
      const y = 110 + row * 48;
      s += `<rect x="${x}" y="${y}" width="104" height="36" rx="8" fill="#dff1fb" stroke="#2f9bd6" stroke-width="1.5"/>`;
      s += txt(x + 52, y + 23, p, { fs: 14, fw: 700, fill: '#2767a8' });
      s += arrow(320, 68, x + 52, 108, '#9bb8d8');
    });
    s += txt(320, 188, '行省制度：中央派官管理地方，「省」的名称沿用至今', { fs: 13.5, fill: MUT, fw: 700 });
    return s + '</svg>';
  };

  /* ================= 秦汉：司马迁与《史记》 ================= */
  const shiji = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 200">`;
    /* 卷轴 */
    s += `<rect x="100" y="60" width="300" height="100" rx="4" fill="#f5ecd7" stroke="#c9b98a" stroke-width="2"/>`;
    /* 卷轴两端 */
    s += `<rect x="92" y="52" width="16" height="116" rx="4" fill="#8a6a33" stroke="#6d4520" stroke-width="1.5"/>`;
    s += `<rect x="392" y="52" width="16" height="116" rx="4" fill="#8a6a33" stroke="#6d4520" stroke-width="1.5"/>`;
    /* 文字行 */
    for (let i = 0; i < 5; i++) {
      s += `<line x1="116" y1="${80 + i * 16}" x2="384" y2="${80 + i * 16}" stroke="#8a6a33" stroke-width="2" opacity=".5"/>`;
    }
    s += txt(250, 118, '《史记》', { fs: 24, fw: 900, fill: '#8a6a33' });
    s += txt(250, 142, '司马迁 · 纪传体通史', { fs: 13, fill: MUT });
    /* 右侧要点 */
    s += txt(470, 56, '史家之绝唱', { fs: 16, fw: 900, fill: '#c2557d', anchor: 'start' });
    s += txt(470, 76, '无韵之《离骚》', { fs: 13, fill: MUT, anchor: 'start' });
    [['黄帝 → 汉武帝，约三千年', INK], ['共 130 篇', INK], ['以人物传记为中心', INK], ['鲁迅评语', MUT]].forEach((it, i) => {
      s += `<circle cx="478" cy="${98 + i * 20}" r="3" fill="${it[1]}"/>`;
      s += txt(488, 102 + i * 20, it[0], { fs: 12, fill: it[1], anchor: 'start' });
    });
    s += txt(320, 188, '「人固有一死，或重于泰山，或轻于鸿毛」', { fs: 13, fill: MUT, fw: 700 });
    return s + '</svg>';
  };

  /* ================= 三国两晋：王羲之与墨池 ================= */
  const wangxizhi = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 200">`;
    /* 墨池 */
    s += `<ellipse cx="150" cy="140" rx="110" ry="36" fill="#2a2a3a" opacity=".85"/>`;
    s += `<ellipse cx="150" cy="136" rx="110" ry="36" fill="#1a1a2a" opacity=".7"/>`;
    s += txt(150, 140, '墨池', { fs: 18, fw: 900, fill: '#fff' });
    s += txt(150, 176, '洗笔把池水染黑', { fs: 12, fill: MUT });
    /* 笔 */
    s += `<line x1="100" y1="100" x2="200" y2="120" stroke="#8a6a33" stroke-width="6" stroke-linecap="round"/>`;
    s += `<path d="M200,120 L216,128 L200,136 Z" fill="#1a1a2a"/>`;
    /* 右侧：兰亭集序 */
    s += `<rect x="320" y="30" width="280" height="140" rx="8" fill="#faf6ec" stroke="#c9b98a" stroke-width="2"/>`;
    s += txt(460, 60, '《兰亭集序》', { fs: 18, fw: 900, fill: '#8a6a33' });
    s += txt(460, 82, '天下第一行书', { fs: 13, fill: MUT });
    /* 之字各不相同 */
    s += txt(380, 118, '之', { fs: 22, fw: 900, fill: '#34384d' });
    s += txt(430, 118, '之', { fs: 22, fw: 900, fill: '#34384d' });
    s += txt(480, 118, '之', { fs: 22, fw: 900, fill: '#34384d' });
    s += txt(530, 118, '之', { fs: 22, fw: 900, fill: '#34384d' });
    s += txt(460, 148, '二十多个「之」字写法各不相同', { fs: 11.5, fill: MUT });
    s += txt(320, 188, '入木三分：笔力遒劲，形容见解深刻', { fs: 13.5, fill: MUT, fw: 700 });
    return s + '</svg>';
  };

  /* ================= 互动演示：朝代长河 ================= */
  const DYN = {
    xia:   { name: '夏', years: '约前 2070—前 1600', note: '我国第一个王朝，世袭制开始', color: '#c98a3d' },
    shang: { name: '商', years: '约前 1600—前 1046', note: '甲骨文与青铜文明', color: '#8f6b3d' },
    zhou:  { name: '周', years: '前 1046—前 256', note: '分封制；东周分春秋和战国', color: '#7ba05b' },
    qin:   { name: '秦', years: '前 221—前 207', note: '第一个统一的王朝，秦始皇', color: '#454b63' },
    han:   { name: '汉', years: '前 202—220', note: '丝绸之路；蔡伦改进造纸术', color: '#c2557d' },
    tang:  { name: '唐', years: '618—907', note: '科举完善；唐诗的黄金时代', color: '#e2a63a' },
    song:  { name: '宋', years: '960—1279', note: '活字印刷；指南针用于航海', color: '#2f9bd6' },
    yuan:  { name: '元', years: '1271—1368', note: '行省制度；大一统王朝', color: '#8b65c9' },
    ming:  { name: '明', years: '1368—1644', note: '郑和下西洋；紫禁城建成', color: '#d97745' },
    qing:  { name: '清', years: '1636—1912', note: '我国最后一个王朝', color: '#2fbf71' },
  };
  const DYN_INIT = 'han';

  const demoTimeline = () => {
    const keys = Object.keys(DYN);
    let s = `<svg class="fig-svg" viewBox="0 0 640 172">`;
    keys.forEach((k, i) => {
      const x = 30 + i * 58;
      s += `<rect data-dyn="${k}" x="${x}" y="50" width="58" height="46" fill="${DYN[k].color}" stroke="#ffffff" stroke-width="2"/>`;
      s += txt(x + 29, 80, DYN[k].name, { fs: 17, fw: 900, fill: '#ffffff' });
    });
    s += `<text class="dyn-title" x="320" y="126" text-anchor="middle" font-size="19" font-weight="900" fill="${INK}"></text>`;
    s += `<text class="dyn-note" x="320" y="154" text-anchor="middle" font-size="14" font-weight="600" fill="#4a4f63"></text>`;
    return s + '</svg>' +
      `<div class="fig-ctrl">` +
      keys.map(k => `<button class="fig-btn" data-fig-act="history-dynasty" data-v="${k}">${DYN[k].name}</button>`).join('') +
      `</div>`;
  };
  function dynastyApply(fig, key, btn) {
    if (!DYN[key]) return;
    const title = fig.querySelector('.dyn-title');
    const note = fig.querySelector('.dyn-note');
    if (title) title.textContent = DYN[key].name + ' · ' + DYN[key].years;
    if (note) note.textContent = DYN[key].note;
    fig.querySelectorAll('rect[data-dyn]').forEach(r => {
      const on = r.dataset.dyn === key;
      r.setAttribute('stroke', on ? '#34384d' : '#ffffff');
      r.setAttribute('stroke-width', on ? 3.5 : 2);
    });
    fig.querySelectorAll('[data-fig-act="history-dynasty"]').forEach(b => b.classList.toggle('fig-on', b === btn));
  }

  /* ---------- 注册表 ---------- */
  const REG = {
    'history-oracle': oracle,
    'history-bronze': bronze,
    'history-sages': sages,
    'history-greatwall': greatwall,
    'history-silkroad': silkroad,
    'history-threekingdoms': threekingdoms,
    'history-canal': canal,
    'history-exam': examStairs,
    'history-four-inventions': fourInventions,
    'history-zhenghe': zhenghe,
    'history-palace': palace,
    'history-ad-era': adEra,
    'history-yu-flood': yuFlood,
    'history-enfeoffment': enfeoffment,
    'history-dujiangyan': dujiangyan,
    'history-qin-unify': qinUnify,
    'history-papermaking': papermaking,
    'history-pi': piCircle,
    'history-xuanzang-jianzhen': xuanzangJianzhen,
    'history-yuefei': yuefei,
    'history-province': province,
    'history-shiji': shiji,
    'history-wangxizhi': wangxizhi,
    'demo-history-timeline': demoTimeline,
  };

  const DEFAULT_CAPS = {
    'demo-history-timeline': '互动演示：点一个朝代，看它的起讫年代和代表大事',
    'history-oracle': '甲骨文对照：三千年前的字，今天还认得出',
    'history-bronze': '后母戊鼎：我国出土最重的青铜器，重约 832.84 千克',
    'history-sages': '诸子百家：儒、道、墨、法各开一剂药方',
    'history-greatwall': '长城与烽火台；今天看到的长城大多是明代修建的',
    'history-silkroad': '丝绸之路：从长安出发，经河西走廊、西域通往中亚和欧洲',
    'history-threekingdoms': '三国鼎立：官渡之战与赤壁之战',
    'history-canal': '隋朝大运河：永济渠、通济渠、邗沟、江南河四段，沟通五大水系',
    'history-exam': '科举阶梯：从秀才到状元，一级一级考上去',
    'history-four-inventions': '四大发明在宋元走向成熟与应用',
    'history-zhenghe': '郑和宝船 vs 哥伦布船队：早了近一个世纪，规模大得多',
    'history-palace': '故宫太和殿：黄琉璃瓦、红墙、汉白玉台基',
    'history-ad-era': '公元纪年数轴：公元前倒着数，公元顺着数；百年一个世纪',
    'history-yu-flood': '大禹治水：父亲鲧用「堵」失败，禹用「疏导」成功——堵不如疏',
    'history-enfeoffment': '西周分封制：天子→诸侯→卿大夫→士，层层分封',
    'history-dujiangyan': '都江堰：鱼嘴分水、飞沙堰排沙、宝瓶口控水，无坝引水两千多年',
    'history-qin-unify': '秦始皇统一：书同文、统一货币、统一度量衡',
    'history-papermaking': '蔡伦造纸四步：原料→舂捣→抄纸→晾晒，又轻又便宜',
    'history-pi': '祖冲之把圆周率算到小数点后第七位，领先世界近千年',
    'history-xuanzang-jianzhen': '玄奘西行求法、鉴真东渡传法——一去一回的文化交流',
    'history-yuefei': '岳母刺「尽忠报国」，岳飞「冻死不拆屋，饿死不掳掠」',
    'history-province': '元朝行省制度：中书省管中央，行中书省管地方，「省」沿用至今',
    'history-shiji': '司马迁《史记》：我国第一部纪传体通史，鲁迅赞「史家之绝唱」',
    'history-wangxizhi': '王羲之墨池练字，《兰亭集序》被誉为「天下第一行书」',
  };

  /* ---------- 真实照片图库（Wikimedia Commons 公版/CC，已下载到本地） ---------- */
  const PHOTOS = {
    'photo-houmuwu':     { src: 'images/history/houmuwu-ding.jpg',    cap: '后母戊鼎：我国出土最重的青铜器，重约 832.84 千克（中国国家博物馆藏）' },
    'photo-oracle':      { src: 'images/history/oracle-bone.jpg',     cap: '商代甲骨文：刻在龟甲兽骨上的占卜记录，是已知最早的成熟汉字' },
    'photo-greatwall':   { src: 'images/history/great-wall.jpg',      cap: '万里长城：今天保存完好的长城多为明代修建，蜿蜒于群山之巅' },
    'photo-terracotta':  { src: 'images/history/terracotta-army.jpg', cap: '秦始皇陵兵马俑：千人千面，被誉为「世界第八大奇迹」' },
    'photo-palace':      { src: 'images/history/forbidden-city.jpg',  cap: '北京故宫（紫禁城）：明清两代皇宫，世界现存最大木结构宫殿群' },
    'photo-canal':       { src: 'images/history/grand-canal.jpg',     cap: '京杭大运河：古代世界最长的运河，沟通南北五大水系' },
    'photo-dujiangyan':  { src: 'images/history/dujiangyan.jpg',      cap: '都江堰：战国李冰父子修建，无坝引水两千多年仍在使用' },
    'photo-silkroad':    { src: 'images/history/silk-road-camel.jpg', cap: '丝绸之路：驼队沿河西走廊西行，把丝绸、瓷器带向中亚和欧洲' },
    'photo-lanting':     { src: 'images/history/lanting-xu.jpg',      cap: '《兰亭集序》（摹本）：王羲之「天下第一行书」，二十多个「之」字各不相同' },
    'photo-ship':        { src: 'images/history/ancient-ship.jpg',    cap: '中国古代帆船：郑和宝船长一百五十多米，是当时世界最大的海船' },
  };

  function photoHTML(id) {
    const p = PHOTOS[id];
    if (!p) return '';
    return `<figure class="fig fig-photo" data-photo="${id}">` +
      `<img class="fig-img" src="${p.src}" alt="${p.cap}" loading="lazy" onerror="this.parentElement.style.display='none'">` +
      `<figcaption class="fig-cap">${p.cap}</figcaption></figure>`;
  }

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
      if (act === 'history-dynasty') dynastyApply(fig, b.dataset.v, b);
    });
  }

  /* 初始化静态演示（渲染后无需再调用；委托自动工作） */
  if (typeof document !== 'undefined') {
    bindDelegates(document);
    const initIn = root => {
      root.querySelectorAll('.fig').forEach(fig => {
        const id = fig.dataset.fig;
        if (id === 'demo-history-timeline' && !fig.dataset.init) {
          dynastyApply(fig, DYN_INIT, fig.querySelector('[data-fig-act="history-dynasty"][data-v="' + DYN_INIT + '"]'));
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
    photoHTML,
    get FIG_IDS() { return Object.keys(REG); },
    get PHOTO_IDS() { return Object.keys(PHOTOS); },
    has(id) { return Object.prototype.hasOwnProperty.call(REG, id); },
    hasPhoto(id) { return Object.prototype.hasOwnProperty.call(PHOTOS, id); },
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FIG_IDS: HistoryFigures.FIG_IDS, PHOTO_IDS: HistoryFigures.PHOTO_IDS, has: HistoryFigures.has, hasPhoto: HistoryFigures.hasPhoto };
}
if (typeof window !== 'undefined') {
  window.HistoryFigures = HistoryFigures;
}

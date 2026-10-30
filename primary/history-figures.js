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
    get FIG_IDS() { return Object.keys(REG); },
    has(id) { return Object.prototype.hasOwnProperty.call(REG, id); },
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FIG_IDS: HistoryFigures.FIG_IDS, has: HistoryFigures.has };
}
if (typeof window !== 'undefined') {
  window.HistoryFigures = HistoryFigures;
}

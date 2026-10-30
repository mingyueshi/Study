/* ============================================================
   乐学堂 · 文学图示库（文学常识专属）
   - 纯 SVG 插图，离线可用，打印友好
   - 互动演示（名著档案 / 生肖档案）事件用委托绑定，
     页面重渲染后无需重新挂载
   - 数据里用 fig: 'lit-xxx' / 'demo-lit-xxx' 引用
   ============================================================ */
'use strict';

const LitFigures = (() => {
  const INK = '#34384d';
  const MUT = '#73788b';
  const LINE = '#dfe5f0';
  const GOLD = '#b5893a';
  const RED = '#e25563';
  const PURPLE = '#8b65c9';
  const GREEN = '#2fbf71';
  const BLUE = '#2f9bd6';
  const ORANGE = '#d97745';
  const TEAL = '#157d73';
  const ROSE = '#c2557d';

  /* ---------- 小工具 ---------- */
  const txt = (x, y, s, opt) => {
    opt = opt || {};
    return `<text x="${x}" y="${y}" fill="${opt.fill || INK}" font-size="${opt.fs || 14}"` +
      ` font-weight="${opt.fw || 700}" text-anchor="${opt.anchor || 'middle'}"` +
      (opt.cls ? ` class="${opt.cls}"` : '') + `>${s}</text>`;
  };
  const rad = d => d * Math.PI / 180;
  const px = (cx, cy, r, deg) => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];
  const arcPath = (cx, cy, r, a0, a1) => {
    const [x0, y0] = px(cx, cy, r, a0);
    const [x1, y1] = px(cx, cy, r, a1);
    const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
    return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  };
  const DEFS = `<defs><marker id="lfig-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${GOLD}"/></marker></defs>`;

  /* ================= 认识文学 ================= */

  /* 四大体裁 */
  const genres = () => {
    const cards = [
      { x: 16, name: '诗歌', desc: '分行押韵', color: RED },
      { x: 172, name: '散文', desc: '形散神不散', color: GOLD },
      { x: 328, name: '小说', desc: '人物与故事', color: BLUE },
      { x: 484, name: '戏剧', desc: '对话演出', color: TEAL },
    ];
    let s = `<svg class="fig-svg" viewBox="0 0 640 176">`;
    cards.forEach((c, i) => {
      s += `<rect x="${c.x}" y="30" width="140" height="106" rx="12" fill="#fbfcff" stroke="${c.color}" stroke-width="2"/>`;
      s += txt(c.x + 70, 60, c.name, { fill: c.color, fs: 17, fw: 900 });
      s += txt(c.x + 70, 82, c.desc, { fill: MUT, fs: 12 });
      /* 小图形 */
      if (i === 0) {
        [100, 112, 124].forEach((y, j) => {
          const w = j === 1 ? 64 : 48;
          s += `<line x1="${c.x + 70 - w / 2}" y1="${y - 24}" x2="${c.x + 70 + w / 2}" y2="${y - 24}" stroke="${c.color}" stroke-width="3" stroke-linecap="round" opacity=".75"/>`;
        });
      } else if (i === 1) {
        s += `<path d="M ${c.x + 30} 104 q 20 -16 40 0 t 40 0" fill="none" stroke="${c.color}" stroke-width="3" stroke-linecap="round"/>`;
      } else if (i === 2) {
        s += `<rect x="${c.x + 44}" y="92" width="52" height="10" rx="3" fill="${c.color}" opacity=".85"/>`;
        s += `<rect x="${c.x + 44}" y="108" width="36" height="10" rx="3" fill="${c.color}" opacity=".45"/>`;
      } else {
        s += `<circle cx="${c.x + 56}" cy="98" r="11" fill="none" stroke="${c.color}" stroke-width="2.5"/>`;
        s += `<circle cx="${c.x + 84}" cy="98" r="11" fill="${c.color}" opacity=".55"/>`;
        s += `<path d="M ${c.x + 60} 112 q 10 8 20 0" fill="none" stroke="${c.color}" stroke-width="2.5" stroke-linecap="round"/>`;
      }
    });
    s += txt(320, 164, '四大体裁各有所长，课文里都能遇到', { fs: 13.5, fill: MUT });
    return s + '</svg>';
  };

  /* 神话群像 */
  const myths = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 178">`;
    /* 盘古开天：天地分开 */
    s += `<path d="M 95 46 A 34 34 0 0 0 95 114 Z" fill="#e8f3fc" stroke="${BLUE}" stroke-width="2"/>`;
    s += `<path d="M 95 46 A 34 34 0 0 1 95 114 Z" fill="#f8efe2" stroke="${GOLD}" stroke-width="2"/>`;
    s += `<line x1="95" y1="38" x2="95" y2="122" stroke="${INK}" stroke-width="2" stroke-dasharray="4 3"/>`;
    s += txt(95, 142, '盘古开天', { fs: 13 });
    /* 女娲补天：五彩石补天弧 */
    s += `<path d="M 195 108 A 52 52 0 0 1 299 108" fill="none" stroke="${PURPLE}" stroke-width="3"/>`;
    [[211, 88, RED], [235, 72, GOLD], [261, 71, GREEN], [285, 87, BLUE]].forEach(p => {
      s += `<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="${p[2]}"/>`;
    });
    s += txt(247, 142, '女娲补天', { fs: 13 });
    /* 后羿射日：弓箭与太阳 */
    s += `<path d="M 355 60 Q 383 96 355 132" fill="none" stroke="${ORANGE}" stroke-width="3.5"/>`;
    s += `<line x1="355" y1="60" x2="355" y2="132" stroke="${INK}" stroke-width="1.6"/>`;
    s += `<line x1="355" y1="96" x2="425" y2="60" stroke="${INK}" stroke-width="2.5" marker-end="url(#lfig-arrow)"/>`;
    s += `<circle cx="447" cy="52" r="13" fill="#f6b93b"/>`;
    s += `<circle cx="475" cy="76" r="9" fill="#f6b93b" opacity=".55"/>`;
    s += txt(405, 142, '后羿射日', { fs: 13 });
    /* 精卫填海：小鸟与海浪 */
    s += `<path d="M 500 112 q 12 -10 24 0 t 24 0 t 24 0 t 24 0" fill="none" stroke="${BLUE}" stroke-width="2.5" stroke-linecap="round"/>`;
    s += `<circle cx="545" cy="84" r="9" fill="${GOLD}"/>`;
    s += `<path d="M 553 80 l 12 4 l -12 4 z" fill="${ORANGE}"/>`;
    s += `<path d="M 537 80 q -12 -12 -4 -20" fill="none" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>`;
    s += txt(545, 142, '精卫填海', { fs: 13 });
    s += txt(320, 168, '神话靠想象解释世界，出自《山海经》等古书', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 对联 */
  const duilian = () => {
    const upChars = ['福', '如', '东', '海'];
    const downChars = ['寿', '比', '南', '山'];
    const hbChars = ['吉', '祥', '如', '意'];
    let s = `<svg class="fig-svg" viewBox="0 0 640 200">`;
    /* 门框 */
    s += `<rect x="240" y="18" width="160" height="164" rx="8" fill="#fdf9f2" stroke="${LINE}" stroke-width="2"/>`;
    /* 横批 */
    s += `<rect x="252" y="26" width="136" height="28" rx="4" fill="${RED}"/>`;
    hbChars.forEach((ch, i) => s += txt(270 + i * 34, 46, ch, { fill: '#fff', fs: 15, fw: 900 }));
    /* 上下联 */
    s += `<rect x="252" y="62" width="32" height="112" rx="4" fill="${RED}" opacity=".92"/>`;
    s += `<rect x="356" y="62" width="32" height="112" rx="4" fill="${RED}" opacity=".92"/>`;
    upChars.forEach((ch, i) => s += txt(372, 84 + i * 26, ch, { fill: '#fff', fs: 17, fw: 900 }));
    downChars.forEach((ch, i) => s += txt(268, 84 + i * 26, ch, { fill: '#fff', fs: 17, fw: 900 }));
    /* 门环 */
    s += `<circle cx="314" cy="112" r="4.5" fill="none" stroke="${GOLD}" stroke-width="2"/>`;
    s += `<circle cx="326" cy="112" r="4.5" fill="none" stroke="${GOLD}" stroke-width="2"/>`;
    s += `<circle cx="314" cy="106" r="1.5" fill="${GOLD}"/><circle cx="326" cy="106" r="1.5" fill="${GOLD}"/>`;
    /* 标注 */
    s += `<line x1="390" y1="96" x2="446" y2="86" stroke="${MUT}" stroke-width="1.4" stroke-dasharray="4 3"/>`;
    s += txt(452, 90, '上联 · 贴右边', { anchor: 'start', fs: 14 });
    s += txt(452, 110, '末字仄声', { anchor: 'start', fs: 12, fill: MUT });
    s += `<line x1="250" y1="118" x2="196" y2="128" stroke="${MUT}" stroke-width="1.4" stroke-dasharray="4 3"/>`;
    s += txt(190, 128, '下联 · 贴左边', { anchor: 'end', fs: 14 });
    s += txt(190, 148, '末字平声', { anchor: 'end', fs: 12, fill: MUT });
    s += txt(320, 190, '面对大门：上联在右，下联在左——仄起平收', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* ================= 诗歌殿堂 ================= */

  /* 诗与词 */
  const poemForms = () => {
    const chars = ['床', '前', '明', '月', '光'];
    const bars = [[110, BLUE, .85], [170, BLUE, .55], [76, BLUE, .85], [196, BLUE, .55], [140, BLUE, .85]];
    let s = `<svg class="fig-svg" viewBox="0 0 640 172">`;
    /* 左：诗 */
    s += `<rect x="20" y="24" width="285" height="122" rx="12" fill="#fbfcff" stroke="${LINE}" stroke-width="2"/>`;
    s += txt(162, 46, '诗 · 字数整齐', { fs: 15, fw: 900, fill: RED });
    chars.forEach((ch, i) => {
      s += `<rect x="${52 + i * 44}" y="60" width="36" height="26" rx="5" fill="#fdeef0" stroke="${RED}" stroke-width="1.4"/>`;
      s += txt(70 + i * 44, 79, ch, { fill: RED, fs: 14, fw: 800 });
    });
    [1, 2, 3].forEach(r => {
      for (let i = 0; i < 5; i++) {
        s += `<rect x="${52 + i * 44}" y="${94 + r * 0}" width="36" height="12" rx="4" fill="${RED}" opacity=".22"/>`;
      }
      s += `<rect x="52" y="${94 + (r - 1) * 20}" width="220" height="12" rx="4" fill="${RED}" opacity=".18"/>`;
    });
    s += txt(162, 138, '五言绝句：四句，每句五字', { fs: 11.5, fill: MUT });
    /* 右：词 */
    s += `<rect x="335" y="24" width="285" height="122" rx="12" fill="#fbfcff" stroke="${LINE}" stroke-width="2"/>`;
    s += txt(477, 46, '词 · 长短句', { fs: 15, fw: 900, fill: BLUE });
    bars.forEach((b, i) => {
      s += `<rect x="${477 - b[0] / 2}" y="${60 + i * 18}" width="${b[0]}" height="12" rx="6" fill="${BLUE}" opacity="${b[2]}"/>`;
    });
    s += txt(477, 158 - 24, '按词牌的格律往里填字', { fs: 11.5, fill: MUT });
    s += txt(320, 166, '诗整齐、词长短——词又叫「长短句」', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 诗人雅号牌匾 */
  const poetPlaques = () => {
    const rows = [
      ['诗仙', '李白', RED], ['诗圣', '杜甫', GOLD], ['诗魔', '白居易', GREEN], ['诗鬼', '李贺', PURPLE], ['诗佛', '王维', BLUE],
    ];
    let s = `<svg class="fig-svg" viewBox="0 0 640 152">`;
    s += `<rect x="10" y="20" width="620" height="9" rx="4" fill="${GOLD}" opacity=".8"/>`;
    rows.forEach((r, i) => {
      const cx = 76 + i * 122;
      s += `<line x1="${cx}" y1="29" x2="${cx}" y2="42" stroke="${MUT}" stroke-width="1.6"/>`;
      s += `<rect x="${cx - 52}" y="42" width="104" height="62" rx="10" fill="#fdf9f2" stroke="${r[2]}" stroke-width="2.5"/>`;
      s += txt(cx, 72, r[0], { fill: r[2], fs: 19, fw: 900 });
      s += txt(cx, 94, r[1], { fs: 13, fill: INK });
    });
    s += txt(320, 140, '后人的评价：仙是李白，圣是杜甫，魔是白居易', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* ================= 四大名著 ================= */

  /* 名著档案（互动演示） */
  const CLASSICS = {
    xyj: { t: ['西', '游', '记'], color: RED, note: '吴承恩 · 孙悟空大闹天宫，师徒四人西天取经' },
    sg: { t: ['三', '国', '演', '义'], color: BLUE, note: '罗贯中 · 桃园三结义，诸葛亮三分天下' },
    sh: { t: ['水', '浒', '传'], color: GREEN, note: '施耐庵 · 一百零八位好汉聚义梁山泊' },
    hl: { t: ['红', '楼', '梦'], color: PURPLE, note: '曹雪芹 · 又名《石头记》，写贾府的兴衰' },
  };
  const demoClassics = () => {
    const keys = Object.keys(CLASSICS);
    let s = `<svg class="fig-svg" viewBox="0 0 640 200">`;
    keys.forEach((k, i) => {
      const x = 70 + i * 120;
      const c = CLASSICS[k];
      s += `<g class="classic-spine" data-classic="${k}">`;
      s += `<rect x="${x}" y="44" width="84" height="104" rx="6" fill="${c.color}" stroke="none" opacity=".92"/>`;
      s += `<line x1="${x + 10}" y1="52" x2="${x + 10}" y2="140" stroke="#fff" stroke-width="1.4" opacity=".4"/>`;
      const n = c.t.length;
      const startY = n === 4 ? 72 : 82;
      let t = `<text x="${x + 46}" y="${startY}" text-anchor="middle" font-size="17" font-weight="900" fill="#fff">`;
      c.t.forEach((ch, j) => { t += `<tspan x="${x + 46}" dy="${j === 0 ? 0 : 22}">${ch}</tspan>`; });
      s += t + '</text>';
      s += `<rect x="${x + 24}" y="${n === 4 ? 130 : 126}" width="36" height="12" rx="3" fill="#fff" opacity=".35"/>`;
      s += '</g>';
    });
    /* 书架 */
    s += `<rect x="34" y="150" width="572" height="13" rx="4" fill="${GOLD}" opacity=".85"/>`;
    s += `<rect x="46" y="163" width="18" height="10" fill="${GOLD}" opacity=".6"/>`;
    s += `<rect x="576" y="163" width="18" height="10" fill="${GOLD}" opacity=".6"/>`;
    s += `<text class="classic-note" x="320" y="192" text-anchor="middle" font-size="14" font-weight="800" fill="${GOLD}"></text>`;
    return s + '</svg>' +
      `<div class="fig-ctrl">` +
      keys.map(k => `<button class="fig-btn" data-fig-act="lit-classic" data-v="${k}">《${CLASSICS[k].t.join('')}》</button>`).join('') +
      `</div>`;
  };
  function classicApply(fig, key, btn) {
    const c = CLASSICS[key];
    if (!c) return;
    fig.querySelectorAll('.classic-spine').forEach(g => {
      const on = g.dataset.classic === key;
      const rect = g.querySelector('rect');
      rect.setAttribute('stroke', on ? INK : 'none');
      rect.setAttribute('stroke-width', on ? 4 : 0);
      g.setAttribute('opacity', on ? '1' : '.45');
    });
    fig.querySelector('.classic-note').textContent = c.note;
    fig.querySelectorAll('[data-fig-act="lit-classic"]').forEach(b => b.classList.toggle('fig-on', b === btn));
  }

  /* ================= 古代文豪 ================= */

  /* 孔子与《论语》：杏坛讲学 */
  const lunyu = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 172">`;
    /* 杏树 */
    s += `<rect x="80" y="96" width="14" height="48" rx="4" fill="#9a6b3f"/>`;
    s += `<circle cx="87" cy="70" r="38" fill="${GREEN}" opacity=".8"/>`;
    s += `<circle cx="58" cy="90" r="22" fill="${GREEN}" opacity=".6"/>`;
    s += `<circle cx="118" cy="90" r="22" fill="${GREEN}" opacity=".6"/>`;
    [[70, 60], [98, 52], [56, 84], [120, 82], [86, 92]].forEach(p => {
      s += `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${ORANGE}"/>`;
    });
    s += txt(87, 164, '杏坛', { fs: 13, fill: GREEN });
    /* 老师 */
    s += `<circle cx="205" cy="74" r="12" fill="#f5d7b2" stroke="${PURPLE}" stroke-width="2"/>`;
    s += `<path d="M 191 88 L 219 88 L 205 132 Z" fill="${PURPLE}" opacity=".85"/>`;
    /* 话框 */
    s += `<rect x="242" y="40" width="196" height="42" rx="10" fill="#f3ecfb" stroke="${PURPLE}" stroke-width="1.6"/>`;
    s += `<path d="M 252 82 l -8 12 l 18 -8 z" fill="#f3ecfb" stroke="${PURPLE}" stroke-width="1.6"/>`;
    s += txt(340, 67, '学而时习之，不亦说乎', { fs: 14, fill: '#5d3f8f' });
    /* 弟子三人 */
    [[262, 118], [312, 124], [362, 118]].forEach((p, i) => {
      s += `<circle cx="${p[0]}" cy="${p[1]}" r="9" fill="#f5d7b2" stroke="${TEAL}" stroke-width="2"/>`;
      s += `<path d="M ${p[0] - 12} ${p[1] + 30} L ${p[0] + 12} ${p[1] + 30} L ${p[0]} ${p[1] + 10} Z" fill="${TEAL}" opacity=".7"/>`;
      s += `<ellipse cx="${p[0]}" cy="${p[1] + 34}" rx="16" ry="4" fill="${LINE}"/>`;
    });
    /* 论语书 */
    s += `<rect x="470" y="46" width="120" height="86" rx="8" fill="#fdf9f2" stroke="${GOLD}" stroke-width="2"/>`;
    s += txt(530, 76, '《论语》', { fs: 16, fill: GOLD, fw: 900 });
    s += txt(530, 98, '弟子记录整理', { fs: 12, fill: MUT });
    s += txt(530, 118, '儒家经典', { fs: 12, fill: MUT });
    s += txt(320, 164, '孔子有弟子三千——他们的言行被记成了《论语》', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 《史记》时间轴 */
  const shiji = () => {
    const ticks = [['黄帝', 214], ['夏', 286], ['商', 344], ['周', 402], ['秦', 460], ['汉', 518]];
    let s = `<svg class="fig-svg" viewBox="0 0 640 164">`;
    /* 书卷 */
    s += `<rect x="42" y="42" width="104" height="86" rx="6" fill="#fdf9f2" stroke="${GOLD}" stroke-width="2"/>`;
    s += `<rect x="34" y="36" width="12" height="98" rx="5" fill="${GOLD}"/>`;
    s += `<rect x="142" y="36" width="12" height="98" rx="5" fill="${GOLD}"/>`;
    s += txt(94, 82, '《史记》', { fs: 16, fw: 900, fill: GOLD });
    s += txt(94, 104, '130 篇', { fs: 12.5, fill: MUT });
    s += txt(94, 150, '西汉 · 司马迁', { fs: 12.5, fill: MUT });
    /* 时间轴 */
    s += txt(400, 44, '从黄帝到汉武帝 · 约三千年', { fs: 14, fill: INK });
    s += `<line x1="210" y1="92" x2="592" y2="92" stroke="${GOLD}" stroke-width="3" marker-end="url(#lfig-arrow)"/>`;
    ticks.forEach(t => {
      s += `<line x1="${t[1]}" y1="84" x2="${t[1]}" y2="100" stroke="${GOLD}" stroke-width="2"/>`;
      s += txt(t[1], 120, t[0], { fs: 13 });
    });
    s += txt(576, 120, '汉武帝', { fs: 13, fill: RED, fw: 900 });
    s += txt(400, 150, '鲁迅评：「史家之绝唱，无韵之离骚」', { fs: 13, fill: GOLD });
    return s + '</svg>';
  };

  /* 李白与杜甫 */
  const liDu = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 178">`;
    s += `<line x1="212" y1="86" x2="428" y2="86" stroke="${MUT}" stroke-width="1.6" stroke-dasharray="6 4"/>`;
    /* 太阳：李白 */
    s += `<circle cx="160" cy="86" r="52" fill="#fdf3dd" stroke="${GOLD}" stroke-width="3"/>`;
    for (let a = 0; a < 360; a += 45) {
      const [x0, y0] = px(160, 86, 57, a);
      const [x1, y1] = px(160, 86, 66, a);
      s += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${GOLD}" stroke-width="2.5"/>`;
    }
    s += txt(160, 82, '李白', { fs: 18, fw: 900 });
    s += txt(160, 102, '诗仙 · 浪漫', { fs: 12, fill: GOLD });
    s += txt(160, 158, '「飞流直下三千尺」', { fs: 12.5, fill: MUT });
    /* 印章：李杜 */
    s += `<rect x="300" y="58" width="56" height="56" rx="8" fill="${RED}"/>`;
    s += txt(328, 94, '李杜', { fill: '#fff', fs: 20, fw: 900 });
    /* 月亮：杜甫 */
    s += `<circle cx="480" cy="86" r="52" fill="#eaf2fb" stroke="${BLUE}" stroke-width="3"/>`;
    s += `<circle cx="462" cy="78" r="26" fill="#d8e7f7" opacity=".9"/>`;
    s += txt(480, 82, '杜甫', { fs: 18, fw: 900 });
    s += txt(480, 102, '诗圣 · 现实', { fs: 12, fill: BLUE });
    s += txt(480, 158, '「朱门酒肉臭」', { fs: 12.5, fill: MUT });
    s += txt(320, 172, '一位浪漫似仙，一位忧民如圣，合称「李杜」', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* ================= 名家名篇 ================= */

  /* 现当代作家名片 */
  const modern = () => {
    const cards = [
      ['鲁迅', '呐喊·朝花夕拾', RED], ['老舍', '骆驼祥子·茶馆', GOLD],
      ['冰心', '繁星·寄小读者', BLUE], ['叶圣陶', '稻草人·荷花', GREEN],
      ['安徒生', '卖火柴的小女孩', PURPLE],
    ];
    let s = `<svg class="fig-svg" viewBox="0 0 640 160">`;
    cards.forEach((c, i) => {
      const x = 16 + i * 124;
      s += `<rect x="${x}" y="28" width="116" height="96" rx="12" fill="#fbfcff" stroke="${c[2]}" stroke-width="2"/>`;
      s += `<circle cx="${x + 58}" cy="50" r="14" fill="${c[2]}" opacity=".85"/>`;
      s += txt(x + 58, 56, c[0][0], { fill: '#fff', fs: 13, fw: 900 });
      s += txt(x + 58, 86, c[0], { fs: 15, fw: 900 });
      const parts = c[1].split('·');
      s += txt(x + 58, 104, parts[0], { fs: 10.5, fill: MUT });
      if (parts[1]) s += txt(x + 58, 117, parts[1], { fs: 10.5, fill: MUT });
    });
    s += txt(552, 140, '（丹麦）', { fs: 11, fill: MUT });
    s += txt(320, 152, '近现代作家与外国童话大师，代表作连人记', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* ================= 文化常识 ================= */

  /* 年龄称谓阶梯 */
  const ageLadder = () => {
    const steps = [
      ['垂髫', '幼年'], ['豆蔻', '13·14'], ['弱冠', '20'], ['而立', '30'],
      ['不惑', '40'], ['知天命', '50'], ['花甲', '60'], ['古稀', '70'],
    ];
    let s = `<svg class="fig-svg" viewBox="0 0 640 184">`;
    s += txt(320, 24, '「三十而立，四十不惑……」出自《论语》', { fs: 13.5, fill: MUT });
    steps.forEach((st, i) => {
      const x = 20 + i * 75;
      const top = 148 - i * 15;
      const shade = 0.35 + i * 0.08;
      s += `<rect x="${x}" y="${top}" width="71" height="${162 - top}" rx="4" fill="${GOLD}" opacity="${shade.toFixed(2)}"/>`;
      s += txt(x + 35, top + 20, st[0], { fs: 13, fw: 900, fill: i >= 5 ? '#fff' : INK });
      s += txt(x + 35, top + 36, st[1], { fs: 11, fill: i >= 5 ? '#fff' : MUT });
    });
    s += `<line x1="20" y1="176" x2="608" y2="176" stroke="${LINE}" stroke-width="2"/>`;
    s += txt(320, 174, ' ', { fs: 4 });
    return s + '</svg>';
  };

  /* 科举进阶 */
  const keju = () => {
    const cxm = 350;
    const levels = [
      ['童生', 360, 148], ['秀才', 320, 116], ['举人', 280, 84], ['贡士', 240, 52], ['进士', 200, 20],
    ];
    let s = `<svg class="fig-svg" viewBox="0 0 640 192">`;
    levels.forEach((lv, i) => {
      const w = lv[1], x = cxm - w / 2, y = lv[2];
      s += `<rect x="${x}" y="${y}" width="${w}" height="27" rx="6" fill="${GOLD}" opacity="${(0.35 + i * 0.14).toFixed(2)}"/>`;
      const label = lv[0] === '进士' ? '进士（状元 · 榜眼 · 探花）' : lv[0];
      s += txt(cxm, y + 19, label, { fs: 13.5, fw: 800, fill: i >= 3 ? '#fff' : INK });
    });
    /* 左侧考试名 */
    s += `<line x1="96" y1="160" x2="96" y2="34" stroke="${MUT}" stroke-width="2" marker-end="url(#lfig-arrow)"/>`;
    [['殿试 → 进士', 44], ['会试 → 贡士', 92], ['乡试 → 举人', 140]].forEach(t => {
      s += txt(104, t[1], t[0], { anchor: 'start', fs: 12, fill: MUT });
    });
    /* 右侧连中三元 */
    s += `<rect x="484" y="64" width="146" height="64" rx="10" fill="#fdf3dd" stroke="${GOLD}" stroke-width="1.6"/>`;
    s += txt(557, 90, '连中三元', { fs: 15, fw: 900, fill: GOLD });
    s += txt(557, 110, '乡试·会试·殿试', { fs: 11, fill: MUT });
    s += txt(557, 122, '都考第一名', { fs: 11, fill: MUT });
    s += txt(320, 186, '科举：古代通过考试选拔官员，从童生一路考到状元', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 二十四节气环 */
  const TERMS = ['立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
    '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'];
  const SEASON_COLORS = ['#2fbf71', '#e25563', '#b5893a', '#2f9bd6'];
  const SEASON_NAMES = ['春', '夏', '秋', '冬'];
  const solarTerms = () => {
    const cx = 210, cy = 96, r = 70;
    let s = `<svg class="fig-svg" viewBox="0 0 640 214">`;
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fdfcf9" stroke="${LINE}" stroke-width="2"/>`;
    /* 四季弧 */
    for (let k = 0; k < 4; k++) {
      const a0 = -90 + k * 90 + 3, a1 = -90 + (k + 1) * 90 - 3;
      s += `<path d="${arcPath(cx, cy, r, a0, a1)}" fill="none" stroke="${SEASON_COLORS[k]}" stroke-width="7" opacity=".55"/>`;
      const [lx, ly] = px(cx, cy, 44, -90 + k * 90 + 45);
      s += txt(lx, ly + 6, SEASON_NAMES[k], { fill: SEASON_COLORS[k], fs: 16, fw: 900 });
    }
    /* 24 节气点与标签（内外交错，避免挤在一起） */
    TERMS.forEach((t, i) => {
      const ang = -90 + i * 15;
      const season = Math.floor(i / 6);
      const [dx, dy] = px(cx, cy, r, ang);
      s += `<circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="${t === '清明' ? 6 : 3.5}" fill="${t === '清明' ? RED : SEASON_COLORS[season]}"/>`;
      const labelR = r + (i % 2 === 0 ? 14 : 27);
      const [tx, ty] = px(cx, cy, labelR, ang);
      const c = Math.cos(rad(ang));
      const anchor = c > 0.35 ? 'start' : c < -0.35 ? 'end' : 'middle';
      s += txt(tx.toFixed(1), (ty + 4).toFixed(1), t, { anchor, fs: 10.5, fill: t === '清明' ? RED : INK });
    });
    /* 右侧节气歌 */
    s += `<rect x="418" y="26" width="204" height="126" rx="12" fill="#f4faf6" stroke="${GREEN}" stroke-width="1.6"/>`;
    s += txt(520, 50, '节气歌', { fs: 14, fw: 900, fill: GREEN });
    ['春雨惊春清谷天', '夏满芒夏暑相连', '秋处露秋寒霜降', '冬雪雪冬小大寒'].forEach((l, i) => {
      s += txt(520, 74 + i * 20, l, { fs: 12.5 });
    });
    s += txt(520, 176, '清明既是节气，又是节日', { fs: 11.5, fill: RED });
    s += txt(320, 208, '二十四节气按太阳的位置定，每年公历日期基本固定', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 传统节日年历 */
  const festivals = () => {
    const nodes = [
      ['春节', '正月初一', RED], ['元宵', '正月十五', ORANGE], ['清明', '4 月 5 日前后', GREEN],
      ['端午', '五月初五', TEAL], ['七夕', '七月初七', PURPLE], ['中秋', '八月十五', GOLD],
      ['重阳', '九月初九', BLUE], ['腊八', '腊月初八', MUT],
    ];
    let s = `<svg class="fig-svg" viewBox="0 0 640 190">`;
    s += `<line x1="36" y1="92" x2="606" y2="92" stroke="${LINE}" stroke-width="3"/>`;
    nodes.forEach((n, i) => {
      const x = 48 + i * 78;
      const up = i % 2 === 0;
      s += `<circle cx="${x}" cy="92" r="6.5" fill="${n[2]}"/>`;
      if (up) {
        s += `<line x1="${x}" y1="86" x2="${x}" y2="62" stroke="${n[2]}" stroke-width="1.6" opacity=".6"/>`;
        s += txt(x, 46, n[0], { fs: 14, fw: 900, fill: n[2] });
        s += txt(x, 62, n[1], { fs: 10.5, fill: MUT });
      } else {
        s += `<line x1="${x}" y1="98" x2="${x}" y2="122" stroke="${n[2]}" stroke-width="1.6" opacity=".6"/>`;
        s += txt(x, 140, n[0], { fs: 14, fw: 900, fill: n[2] });
        s += txt(x, 156, n[1], { fs: 10.5, fill: MUT });
      }
    });
    s += txt(320, 182, '春节元宵清明端午，七夕中秋重阳腊八——节日里都藏着古诗', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* ================= 文学问号 ================= */

  /* 美好的代称 */
  const aliases = () => {
    const cards = [
      ['杏林', '医生', '董奉种杏', GREEN], ['杏坛', '教育', '孔子讲学', TEAL],
      ['梨园', '戏曲', '玄宗教乐', GOLD], ['桑梓', '家乡', '宅旁桑梓', ORANGE], ['桃李', '学生', '桃李成蹊', ROSE],
    ];
    let s = `<svg class="fig-svg" viewBox="0 0 640 158">`;
    cards.forEach((c, i) => {
      const x = 30 + i * 124;
      s += `<rect x="${x}" y="24" width="104" height="94" rx="12" fill="#fbfcff" stroke="${c[3]}" stroke-width="2"/>`;
      s += txt(x + 52, 54, c[0], { fill: c[3], fs: 19, fw: 900 });
      s += `<line x1="${x + 30}" y1="66" x2="${x + 74}" y2="66" stroke="${c[3]}" stroke-width="1.4" opacity=".5"/>`;
      s += txt(x + 52, 88, '指 · ' + c[1], { fs: 13.5, fw: 800 });
      s += txt(x + 52, 108, c[2], { fs: 10.5, fill: MUT });
    });
    s += txt(320, 148, '杏林医、杏坛教、梨园戏、桑梓乡、桃李是学生', { fs: 13, fill: MUT });
    return s + '</svg>';
  };

  /* 文房四宝 */
  const fourTreasures = () => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 168">`;
    s += txt(320, 28, '文房四宝', { fs: 14, fw: 900, fill: GOLD });
    /* 笔 */
    s += `<line x1="72" y1="46" x2="118" y2="98" stroke="#9a6b3f" stroke-width="7" stroke-linecap="round"/>`;
    s += `<path d="M 116 96 l 14 20 l -22 -6 z" fill="${INK}"/>`;
    s += `<line x1="66" y1="52" x2="80" y2="38" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>`;
    s += txt(95, 132, '笔', { fs: 15 });
    s += txt(95, 150, '湖笔 · 浙江湖州', { fs: 10.5, fill: MUT });
    /* 墨 */
    s += `<rect x="226" y="52" width="40" height="64" rx="6" fill="#34384d"/>`;
    s += `<rect x="230" y="58" width="32" height="52" rx="4" fill="none" stroke="${GOLD}" stroke-width="1.4"/>`;
    s += txt(246, 132, '墨', { fs: 15 });
    s += txt(246, 150, '徽墨 · 安徽', { fs: 10.5, fill: MUT });
    /* 纸 */
    s += `<rect x="368" y="48" width="72" height="68" rx="4" fill="#fff" stroke="${LINE}" stroke-width="2"/>`;
    s += `<rect x="360" y="52" width="10" height="60" rx="4" fill="#e8dcc4"/>`;
    s += `<rect x="438" y="52" width="10" height="60" rx="4" fill="#e8dcc4"/>`;
    s += `<rect x="420" y="98" width="14" height="14" rx="2" fill="${RED}" opacity=".85"/>`;
    s += txt(406, 132, '纸', { fs: 15 });
    s += txt(406, 150, '宣纸 · 安徽', { fs: 10.5, fill: MUT });
    /* 砚 */
    s += `<ellipse cx="545" cy="86" rx="44" ry="24" fill="#4a4f63"/>`;
    s += `<ellipse cx="545" cy="82" rx="26" ry="11" fill="#262a3d"/>`;
    s += txt(545, 132, '砚', { fs: 15 });
    s += txt(545, 150, '端砚 · 广东', { fs: 10.5, fill: MUT });
    s += txt(320, 166, '笔墨纸砚，读书写字的家当', { fs: 12.5, fill: MUT });
    return s + '</svg>';
  };

  /* 生肖档案（互动演示） */
  const ZODIAC = [
    ['鼠', '子', '23 时到 1 时', '夜半的老鼠最活跃'],
    ['牛', '丑', '1 时到 3 时', '牛吃完草，准备天亮耕田'],
    ['虎', '寅', '3 时到 5 时', '老虎在山林里最威风'],
    ['兔', '卯', '5 时到 7 时', '天亮了，兔子出窝吃草'],
    ['龙', '辰', '7 时到 9 时', '容易起雾降雨，传说是群龙行雨的时辰'],
    ['蛇', '巳', '9 时到 11 时', '太阳升高，蛇出洞晒太阳'],
    ['马', '午', '11 时到 13 时', '午时阳气最盛，马跑得最欢'],
    ['羊', '未', '13 时到 15 时', '午后放羊，羊吃草最勤'],
    ['猴', '申', '15 时到 17 时', '猴子在林中最爱啼叫跳跃'],
    ['鸡', '酉', '17 时到 19 时', '太阳落山，鸡回窝'],
    ['狗', '戌', '19 时到 21 时', '天黑了，狗开始守门'],
    ['猪', '亥', '21 时到 23 时', '夜深了，猪睡得最沉'],
  ];
  const demoZodiac = () => {
    const cx = 200, cy = 98, r = 72;
    let s = `<svg class="fig-svg" viewBox="0 0 640 200">`;
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fdfcf9" stroke="${LINE}" stroke-width="2"/>`;
    s += txt(cx, cy - 6, '十二年', { fs: 13, fill: MUT });
    s += txt(cx, cy + 14, '一轮回', { fs: 13, fill: MUT });
    ZODIAC.forEach((z, i) => {
      const ang = -90 + i * 30;
      const [ax, ay] = px(cx, cy, r - 16, ang);
      const [bx, by] = px(cx, cy, r + 14, ang);
      s += `<text class="zodiac-animal" x="${ax.toFixed(1)}" y="${(ay + 7).toFixed(1)}" text-anchor="middle" font-size="19" font-weight="900" fill="${INK}" data-zodiac="${i}">${z[0]}</text>`;
      s += `<text class="zodiac-branch" x="${bx.toFixed(1)}" y="${(by + 4).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="${MUT}" data-zodiac="${i}">${z[1]}</text>`;
    });
    s += `<text class="zodiac-note" x="460" y="88" text-anchor="middle" font-size="13.5" font-weight="800" fill="${RED}"></text>`;
    s += `<text class="zodiac-note2" x="460" y="112" text-anchor="middle" font-size="12" fill="${MUT}"></text>`;
    s += txt(460, 40, '生肖按农历正月初一换', { fs: 12.5, fill: MUT });
    s += txt(460, 58, '地支也用来计时辰', { fs: 12.5, fill: MUT });
    return s + '</svg>' +
      `<div class="fig-ctrl">` +
      ZODIAC.map((z, i) => `<button class="fig-btn" data-fig-act="lit-zodiac" data-v="${i}">${z[0]}</button>`).join('') +
      `</div>`;
  };
  function zodiacApply(fig, idx, btn) {
    const z = ZODIAC[Number(idx)];
    if (!z) return;
    fig.querySelectorAll('.zodiac-animal').forEach(t => {
      const on = t.dataset.zodiac === String(idx);
      t.setAttribute('fill', on ? RED : INK);
      t.setAttribute('font-size', on ? 23 : 19);
    });
    fig.querySelectorAll('.zodiac-branch').forEach(t => {
      const on = t.dataset.zodiac === String(idx);
      t.setAttribute('fill', on ? RED : MUT);
    });
    fig.querySelector('.zodiac-note').textContent = z[1] + z[0] + '：属相十二年一轮';
    fig.querySelector('.zodiac-note2').textContent = '对应' + z[1] + '时（' + z[2] + '）——' + z[3];
    fig.querySelectorAll('[data-fig-act="lit-zodiac"]').forEach(b => b.classList.toggle('fig-on', b === btn));
  }

  /* ---------- 注册表 ---------- */
  const REG = {
    'lit-genres': genres,
    'lit-myths': myths,
    'lit-duilian': duilian,
    'lit-poem-forms': poemForms,
    'lit-poet-plaques': poetPlaques,
    'demo-lit-classics': demoClassics,
    'lit-lunyu': lunyu,
    'lit-shiji': shiji,
    'lit-li-du': liDu,
    'lit-modern': modern,
    'lit-age-ladder': ageLadder,
    'lit-keju': keju,
    'lit-solar-terms': solarTerms,
    'lit-festivals': festivals,
    'lit-aliases': aliases,
    'lit-four-treasures': fourTreasures,
    'demo-lit-zodiac': demoZodiac,
  };

  const DEFAULT_CAPS = {
    'lit-genres': '诗歌、散文、小说、戏剧——文学的四大体裁',
    'lit-myths': '神话群像：盘古开天、女娲补天、后羿射日、精卫填海',
    'lit-duilian': '对联贴法：面对大门，上联在右（仄声收尾），下联在左（平声收尾）',
    'lit-poem-forms': '诗字数整齐，词是长短句，要按词牌来填',
    'lit-poet-plaques': '诗人雅号牌匾：诗仙李白、诗圣杜甫、诗魔白居易、诗鬼李贺、诗佛王维',
    'demo-lit-classics': '互动演示：点一本名著，看作者是谁、讲了什么',
    'lit-lunyu': '杏坛讲学：孔子和弟子的言行，被弟子记录成《论语》',
    'lit-shiji': '《史记》记载从黄帝到汉武帝约三千年历史，共 130 篇',
    'lit-li-du': '李白如太阳般浪漫，杜甫如月亮般深沉，并称「李杜」',
    'lit-modern': '近现代作家名片：鲁迅、老舍、冰心、叶圣陶与丹麦的安徒生',
    'lit-age-ladder': '年龄称谓阶梯：从小到大，每个年龄都有雅称',
    'lit-keju': '科举进阶：童生 → 秀才 → 举人 → 贡士 → 进士（状元、榜眼、探花）',
    'lit-solar-terms': '二十四节气环：四季各六个节气，清明既是节气又是节日',
    'lit-festivals': '农历传统节日：每个节日都有自己的诗句和习俗',
    'lit-aliases': '美好的代称：杏林、杏坛、梨园、桑梓、桃李',
    'lit-four-treasures': '文房四宝：湖笔、徽墨、宣纸、端砚最有名',
    'demo-lit-zodiac': '互动演示：点生肖，看它的地支和对应的时辰',
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
      if (act === 'lit-classic') classicApply(fig, b.dataset.v, b);
      else if (act === 'lit-zodiac') zodiacApply(fig, b.dataset.v, b);
    });
  }

  /* 初始化静态演示（渲染后无需再调用；委托自动工作） */
  if (typeof document !== 'undefined') {
    bindDelegates(document);
    const initIn = root => {
      root.querySelectorAll('.fig').forEach(fig => {
        const id = fig.dataset.fig;
        if (id === 'demo-lit-classics' && !fig.dataset.init) { classicApply(fig, 'xyj', fig.querySelector('[data-fig-act="lit-classic"]')); fig.dataset.init = '1'; }
        else if (id === 'demo-lit-zodiac' && !fig.dataset.init) { zodiacApply(fig, '6', fig.querySelector('[data-fig-act="lit-zodiac"][data-v="6"]')); fig.dataset.init = '1'; }
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
  module.exports = { FIG_IDS: LitFigures.FIG_IDS, has: LitFigures.has };
}
if (typeof window !== 'undefined') {
  window.LitFigures = LitFigures;
}

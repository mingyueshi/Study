/* ============================================================
   乐学堂 · 数学图示库（数学知识点专属）
   - 纯 SVG 插图，离线可用，打印友好
   - 图示带入场动画（.mf-seq，由 .fig.mf-run 驱动）与互动演示，
     事件用委托绑定，页面重渲染后无需重新挂载
   - 数据里用 fig: 'm-xxx' / banner: 'mban-xxx' 引用
   - 动画关键帧写在 math.css（mfIn / mfPop / mfOut / mfGrow / mfDraw）
   ============================================================ */
'use strict';

const MathFigures = (() => {
  const INK = '#34384d';
  const MUT = '#73788b';
  const LINE = '#dfe5f0';
  const BLUE = '#4d96ff';
  const RED = '#e25563';
  const GREEN = '#2fbf71';
  const GOLD = '#e6b23c';
  const TEAL = '#157d73';
  const PURPLE = '#7c5cc4';
  const ORANGE = '#d97745';
  const SKY = '#2f9bd6';
  const PINK = '#c2557d';
  const VIOLET = '#9b5de5';

  /* ---------- 小工具 ---------- */
  const txt = (x, y, s, opt) => {
    opt = opt || {};
    return `<text x="${x}" y="${y}" fill="${opt.fill || INK}" font-size="${opt.fs || 14}"` +
      ` font-weight="${opt.fw || 700}" text-anchor="${opt.anchor || 'middle'}"` +
      (opt.mono ? ' font-family="ui-monospace,Menlo,monospace"' : '') +
      (opt.cls ? ` class="${opt.cls}"` : '') + `>${s}</text>`;
  };
  const emo = (x, y, s, fs) => txt(x, y, s, { fs: fs || 26 });

  const ARROW = {
    gray: ['#8a93a8', 'mfig-arrow'],
    blue: [BLUE, 'mfig-arrow-b'],
    green: [GREEN, 'mfig-arrow-g'],
    red: [RED, 'mfig-arrow-r'],
  };
  const arrow = (x1, y1, x2, y2, kind) => {
    const a = ARROW[kind] || ARROW.gray;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${a[0]}" stroke-width="2.4" marker-end="url(#${a[1]})"/>`;
  };

  const DEFS = '<defs>' +
    '<marker id="mfig-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#8a93a8"/></marker>' +
    '<marker id="mfig-arrow-b" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="' + BLUE + '"/></marker>' +
    '<marker id="mfig-arrow-g" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="' + GREEN + '"/></marker>' +
    '<marker id="mfig-arrow-r" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="' + RED + '"/></marker>' +
    '</defs>';

  /* 入场序列：delay 秒后浮现 */
  const seq = (delay, inner) =>
    `<g class="mf-seq" style="animation-delay:${delay}s">${inner}</g>`;

  /* 数字/文字格子 */
  const cell = (x, y, w, h, s, o) => {
    o = o || {};
    return seq(o.delay || 0,
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx || 9}" fill="${o.fill || '#fff'}" stroke="${o.stroke || LINE}" stroke-width="${o.sw || 1.6}"/>` +
      txt(x + w / 2, y + h / 2 + (o.fs || 17) * 0.35, s, { fs: o.fs || 17, fill: o.ink || INK, fw: o.fw || 800 }));
  };

  /* 圆角色块（带标题+副标题） */
  const block = (x, y, w, h, o) => {
    o = o || {};
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx || 12}" fill="${o.fill || '#fff'}" stroke="${o.stroke || LINE}" stroke-width="${o.sw || 1.8}"` +
      (o.dash ? ' stroke-dasharray="6 5"' : '') + '/>';
    if (o.title) s += txt(x + w / 2, y + (o.sub ? h / 2 - 2 : h / 2 + 5), o.title, { fs: o.fs || 16, fill: o.ink || INK, fw: 900 });
    if (o.sub) s += txt(x + w / 2, y + h / 2 + 16, o.sub, { fs: 12, fill: MUT, fw: 600 });
    return seq(o.delay || 0, s);
  };

  /* 重播按钮 */
  const replayBtn = () =>
    '<div class="fig-ctrl"><button class="fig-btn" data-fig-act="m-replay" type="button">⟳ 重播动画</button></div>';

  /* ================= 第一单元 · 认识更大的数 ================= */

  /* 大数的写法 */
  const mWrite = () => {
    const groups = [
      ['万级', ['1', '0', '0', '3'], SKY, '一千零三万'],
      ['个级', ['0', '0', '4', '0'], GREEN, '零四十'],
    ];
    let s = '<svg class="fig-svg" viewBox="0 0 640 186">';
    s += seq(0, txt(320, 26, '一千零三万零四十', { fs: 20, fw: 900 }));
    s += seq(0.1, arrow(320, 36, 320, 56, 'gray'));
    let d = 0.2;
    groups.forEach((g, gi) => {
      const ox = 108 + gi * 232;
      s += seq(d, `<rect x="${ox - 10}" y="62" width="220" height="60" rx="12" fill="${g[2]}14" stroke="${g[2]}" stroke-width="1.8"/>` +
        txt(ox - 2, 84, g[0], { anchor: 'start', fs: 13, fill: g[2] }) +
        txt(ox + 200, 84, g[3], { anchor: 'end', fs: 12, fill: MUT }));
      g[1].forEach((n, i) => {
        s += cell(ox + i * 52, 92, 44, 24, n, { fs: 16, delay: d + 0.08 * (gi * 4 + i), fill: '#fff', stroke: g[2] });
      });
    });
    s += seq(0.95, arrow(320, 128, 320, 146, 'blue'));
    s += seq(1.05, txt(320, 172, '10300040', { fs: 22, fw: 900, fill: BLUE }));
    s += seq(1.2, txt(320, 184, '哪一位上没有计数单位，就写 0 占位', { fs: 12, fill: MUT }));
    return s + '</svg>' + replayBtn();
  };

  /* 比较数的大小 */
  const mCompare = () => {
    const a = ['9', '8', '9', '0', '0', '0'];
    const b = ['1', '0', '0', '0', '0', '0', '0'];
    let s = '<svg class="fig-svg" viewBox="0 0 640 176">';
    /* 第一行：位数 */
    s += seq(0, txt(150, 24, '989000', { fs: 17, fw: 900 }));
    s += seq(0, txt(470, 24, '1000000', { fs: 17, fw: 900 }));
    a.forEach((n, i) => s += cell(30 + i * 40, 34, 34, 34, n, { fs: 15, delay: 0.1 + i * 0.06, fill: '#eef4fc', stroke: '#c7d9f2' }));
    b.forEach((n, i) => s += cell(350 + i * 34, 34, 30, 34, n, { fs: 15, delay: 0.1 + i * 0.06, fill: '#f2faf5', stroke: '#bfe3cd' }));
    s += seq(0.6, `<rect x="30" y="76" width="234" height="26" rx="13" fill="#eef1f7" stroke="${LINE}"/>` +
      txt(147, 94, '6 位数', { fs: 13.5, fill: '#5a5570' }));
    s += seq(0.7, `<rect x="350" y="76" width="238" height="26" rx="13" fill="#e6f7ee" stroke="#bfe3cd"/>` +
      txt(469, 94, '7 位数', { fs: 13.5, fill: '#187749' }));
    s += seq(0.85, txt(320, 120, '＜', { fs: 30, fw: 900, fill: RED }));
    s += seq(0.95, txt(320, 148, '第一步先数位数：位数多的数就大', { fs: 14, fill: INK }));
    s += seq(1.1, txt(320, 168, '位数相同时才比最高位，一位一位往下比', { fs: 12, fill: MUT }));
    return s + '</svg>' + replayBtn();
  };

  /* 准确数与近似数 */
  const mExactApprox = () => {
    let s = '<svg class="fig-svg" viewBox="0 0 640 168">';
    const cols = [
      ['=', '准确数', '四年级有 218 人', '正好是多少，一个不多一个不少', GREEN, '#f0faf4', '#bfe3cd'],
      ['≈', '近似数', '全校约 2000 人', '大约是多少，四舍五入得来的', ORANGE, '#fdf5ec', '#f0d9bb'],
    ];
    cols.forEach((c, i) => {
      const x = 24 + i * 312;
      s += block(x, 18, 280, 118, {
        fill: c[5], stroke: c[6], rx: 16, delay: 0.1 + i * 0.15,
      });
      s += seq(0.25 + i * 0.15, txt(x + 44, 62, c[0], { fs: 34, fw: 900, fill: c[4] }));
      s += seq(0.3 + i * 0.15, txt(x + 92, 52, c[1], { anchor: 'start', fs: 17, fw: 900 }));
      s += seq(0.35 + i * 0.15, txt(x + 92, 74, c[2], { anchor: 'start', fs: 14, fill: INK }));
      s += seq(0.4 + i * 0.15, txt(x + 150, 104, c[3], { fs: 12, fill: MUT }));
    });
    s += seq(0.7, txt(320, 158, '看到「约、大约、近」——它就是近似数', { fs: 13.5, fill: SKY }));
    return s + '</svg>' + replayBtn();
  };

  /* ================= 综合实践 · 编码 ================= */

  /* 身份证 / 邮政编码结构 */
  const mCodeId = () => {
    const parts = [
      ['地址码', 0, 6, SKY, '第 1–6 位'],
      ['出生日期', 6, 14, GREEN, '第 7–14 位'],
      ['顺序码', 14, 17, GOLD, '第 15–17 位'],
      ['校验码', 17, 18, PINK, '第 18 位'],
    ];
    const digits = '11010520160901001X'.split('');
    let s = '<svg class="fig-svg" viewBox="0 0 640 196">';
    s += seq(0, txt(320, 22, '身份证号码 18 位', { fs: 16, fw: 900 }));
    s += seq(0.05, txt(320, 40, '110105  20160901  001  X', { fs: 15, fill: MUT, mono: true }));
    digits.forEach((d, i) => {
      const p = parts.find(q => i >= q[1] && i < q[2]);
      s += cell(38 + i * 31, 50, 26, 32, d, { fs: 14, delay: 0.15 + i * 0.03, fill: p[3] + '18', stroke: p[3], rx: 6 });
    });
    parts.forEach((p, i) => {
      const x0 = 38 + p[1] * 31, w = (p[2] - p[1]) * 31 - 5;
      s += seq(0.75 + i * 0.08, `<rect x="${x0}" y="90" width="${w}" height="4" rx="2" fill="${p[3]}"/>` +
        txt(x0 + w / 2, 110, p[0], { fs: 12.5, fill: p[3] }) +
        txt(x0 + w / 2, 126, p[4], { fs: 11, fill: MUT }));
    });
    s += seq(0.9, `<line x1="24" y1="140" x2="616" y2="140" stroke="${LINE}" stroke-width="1.5"/>`);
    s += seq(1, txt(320, 160, '邮政编码 6 位：前两位省 · 第三位邮区 · 第四位县市 · 末两位投递局', { fs: 12.5, fill: INK }));
    ['1', '0', '0', '0', '8', '1'].forEach((d, i) => {
      s += cell(200 + i * 40, 168, 32, 22, d, { fs: 13, delay: 1.1 + i * 0.05, fill: '#f6f7fb', stroke: LINE, rx: 6 });
    });
    return s + '</svg>' + replayBtn();
  };

  /* 编码的规则与设计 */
  const mCodeMake = () => {
    let s = '<svg class="fig-svg" viewBox="0 0 640 182">';
    s += seq(0, txt(320, 24, '四年级 2 班 15 号同学', { fs: 17, fw: 900 }));
    const info = [['年级', '4', SKY], ['班级', '2', GREEN], ['序号', '15', GOLD]];
    info.forEach((it, i) => {
      const x = 90 + i * 160;
      s += block(x, 36, 120, 54, { fill: it[2] + '14', stroke: it[2], delay: 0.1 + i * 0.1 });
      s += seq(0.2 + i * 0.1, txt(x + 60, 58, it[0], { fs: 12.5, fill: it[2] }) + txt(x + 60, 80, it[1], { fs: 19, fw: 900 }));
    });
    s += seq(0.5, arrow(320, 94, 320, 112, 'gray'));
    s += seq(0.55, txt(320, 130, '方案一：4 2 15  →  4215', { fs: 17, fw: 900, fill: BLUE }));
    s += seq(0.75, txt(320, 154, '方案二：04 02 15  →  040215（入学年份也编进去）', { fs: 15, fw: 800, fill: TEAL }));
    s += seq(0.95, txt(320, 176, '位数要够用、规则要简单、一个编号只对应一个人', { fs: 12, fill: MUT }));
    return s + '</svg>' + replayBtn();
  };

  /* ================= 第二单元 · 线与角 ================= */

  /* 画指定度数的角（互动四步） */
  const ANGLE_STEPS = [
    ['画射线', '端点就是角的顶点'],
    ['对中心', '0° 刻度线对准射线'],
    ['点一点', '在 65° 刻度处点点'],
    ['连起来', '再画一条射线并标注'],
  ];
  const ANGLE_O = { x: 150, y: 160 };
  const ANGLE_DEG = 65;
  const rad = d => d * Math.PI / 180;
  const polar = (r, d) => [ANGLE_O.x + r * Math.cos(rad(d)), ANGLE_O.y - r * Math.sin(rad(d))];

  const angleStage = step => {
    let s = '';
    /* 顶点与射线 */
    if (step >= 1) {
      const a = [ANGLE_O.x + 240, ANGLE_O.y];
      s += seq(0, `<line x1="${ANGLE_O.x}" y1="${ANGLE_O.y}" x2="${a[0]}" y2="${a[1]}" stroke="${INK}" stroke-width="3"/>` +
        `<circle cx="${ANGLE_O.x}" cy="${ANGLE_O.y}" r="5" fill="${RED}"/>` +
        txt(ANGLE_O.x, ANGLE_O.y + 20, '顶点', { fs: 12, fill: RED }));
    }
    /* 量角器 */
    if (step >= 2) {
      const R = 120, r2 = 84;
      s += seq(0.05, `<path d="M ${ANGLE_O.x - R} ${ANGLE_O.y} A ${R} ${R} 0 0 1 ${ANGLE_O.x + R} ${ANGLE_O.y} L ${ANGLE_O.x + r2} ${ANGLE_O.y} A ${r2} ${r2} 0 0 0 ${ANGLE_O.x - r2} ${ANGLE_O.y} Z" fill="#eef4fd" stroke="${SKY}" stroke-width="1.8"/>`);
      let ticks = '';
      for (let d = 0; d <= 180; d += 10) {
        const p1 = polar(R, d), p2 = polar(d % 30 === 0 ? R - 14 : R - 8, d);
        ticks += `<line x1="${p1[0].toFixed(1)}" y1="${p1[1].toFixed(1)}" x2="${p2[0].toFixed(1)}" y2="${p2[1].toFixed(1)}" stroke="${SKY}" stroke-width="${d % 30 === 0 ? 2 : 1.2}"/>`;
      }
      s += seq(0.12, ticks);
      s += seq(0.2, txt(ANGLE_O.x + 132, ANGLE_O.y + 16, '0°', { fs: 13, fill: SKY }) +
        txt(ANGLE_O.x - 132, ANGLE_O.y + 16, '180°', { fs: 13, fill: SKY }) +
        txt(ANGLE_O.x, ANGLE_O.y - R - 8, '90°', { fs: 13, fill: SKY }) +
        `<line x1="${ANGLE_O.x - 6}" y1="${ANGLE_O.y}" x2="${ANGLE_O.x + 6}" y2="${ANGLE_O.y}" stroke="${RED}" stroke-width="2.5"/>` +
        `<line x1="${ANGLE_O.x}" y1="${ANGLE_O.y - 6}" x2="${ANGLE_O.x}" y2="${ANGLE_O.y + 6}" stroke="${RED}" stroke-width="2.5"/>`);
    }
    /* 65° 的点 */
    if (step >= 3) {
      const p = polar(120, ANGLE_DEG), pl = polar(136, ANGLE_DEG);
      s += seq(0.1, `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="5.5" fill="${RED}"/>` +
        txt(pl[0].toFixed(1), pl[1].toFixed(1), '65°', { fs: 13, fill: RED }));
    }
    /* 第二条射线与标注 */
    if (step >= 4) {
      const b = polar(158, ANGLE_DEG);
      const arcA = polar(46, 0), arcB = polar(46, ANGLE_DEG);
      s += seq(0.1, `<line x1="${ANGLE_O.x}" y1="${ANGLE_O.y}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${INK}" stroke-width="3"/>` +
        `<path d="M ${arcA[0].toFixed(1)} ${arcA[1].toFixed(1)} A 46 46 0 0 0 ${arcB[0].toFixed(1)} ${arcB[1].toFixed(1)}" fill="none" stroke="${GREEN}" stroke-width="2.5"/>` +
        txt(ANGLE_O.x + 96, ANGLE_O.y - 40, '∠65°', { fs: 15, fill: GREEN, fw: 900 }));
    }
    /* 右侧步骤清单 */
    ANGLE_STEPS.forEach((st, i) => {
      const y = 38 + i * 38;
      const on = i + 1 <= step;
      s += seq(0.3 + i * 0.08,
        `<circle cx="446" cy="${y}" r="14" fill="${on ? SKY : '#e7ebf3'}"/>` +
        txt(446, y + 5, String(i + 1), { fs: 14, fill: on ? '#fff' : '#9aa0b4', fw: 900 }) +
        txt(472, y + 1, st[0], { anchor: 'start', fs: 14.5, fill: on ? INK : '#a8adbe', fw: 900 }) +
        txt(472, y + 19, st[1], { anchor: 'start', fs: 12, fill: on ? MUT : '#c0c4d0' }));
    });
    return s;
  };

  const angleApply = (fig, step, btn) => {
    fig.dataset.step = String(step);
    const g = fig.querySelector('.mf-angle-stage');
    if (g) g.innerHTML = angleStage(+step);
    const note = fig.querySelector('.mf-angle-note');
    if (note) note.textContent = ANGLE_STEPS[step - 1][0] + '：' + ANGLE_STEPS[step - 1][1];
    fig.querySelectorAll('[data-fig-act="m-angle-step"]').forEach(b => b.classList.toggle('fig-on', b === btn));
  };

  const mDrawAngle = () => {
    let s = '<svg class="fig-svg" viewBox="0 0 640 196">';
    s += '<g class="mf-angle-stage"></g>';
    s += '</svg>';
    s += '<p class="fig-note mf-angle-note"></p>';
    s += '<div class="fig-ctrl">' +
      ANGLE_STEPS.map((st, i) => `<button class="fig-btn" data-fig-act="m-angle-step" data-v="${i + 1}" type="button">${i + 1}. ${st[0]}</button>`).join('') +
      '</div>';
    return s;
  };

  /* ================= 第三单元 · 整数乘法 ================= */

  /* 估算 */
  const mEstimate = () => {
    const mapX = v => 60 + (v - 4700) / 400 * 520;
    let s = '<svg class="fig-svg" viewBox="0 0 640 200">';
    s += seq(0, txt(140, 26, '48 × 102', { fs: 19, fw: 900 }));
    s += seq(0.15, arrow(150, 36, 150, 62, 'gray') + arrow(230, 36, 230, 62, 'gray'));
    s += seq(0.25, txt(320, 86, '50 × 100 = 5000', { fs: 19, fw: 900, fill: BLUE }));
    s += seq(0.4, txt(320, 108, '估成整十、整百，先判断「够不够」', { fs: 12, fill: MUT }));
    s += seq(0.5, `<line x1="60" y1="152" x2="580" y2="152" stroke="${LINE}" stroke-width="3" stroke-linecap="round"/>`);
    [4800, 4900, 5000, 5100].forEach((v, i) => {
      const x = mapX(v);
      s += seq(0.55 + i * 0.06, `<line x1="${x}" y1="146" x2="${x}" y2="158" stroke="#b9c2d4" stroke-width="2"/>` + txt(x, 174, String(v), { fs: 12, fill: MUT }));
    });
    const xa = mapX(4896), xb = mapX(5000);
    s += seq(0.85, `<circle cx="${xa}" cy="152" r="7" fill="${GREEN}"/>` + txt(xa, 134, '实际 4896', { fs: 13, fill: GREEN }));
    s += seq(1, `<circle cx="${xb}" cy="152" r="7" fill="${ORANGE}"/>` + txt(xb + 40, 134, '预算 5000', { fs: 13, fill: ORANGE }));
    s += seq(1.15, `<rect x="${xa}" y="180" width="${xb - xa}" height="6" rx="3" fill="${GREEN}55"/>` +
      txt(320, 196, '5000 − 4896 = 104（元）→ 钱够了', { fs: 13.5, fill: '#187749', fw: 800 }));
    return s + '</svg>' + replayBtn();
  };

  /* 末尾有 0 的乘法 */
  const mZeroMult = () => {
    let s = '<svg class="fig-svg" viewBox="0 0 640 180">';
    s += cell(40, 40, 46, 46, '1', { fs: 20, delay: 0 });
    s += cell(88, 40, 46, 46, '6', { fs: 20, delay: 0.06 });
    s += seq(0.12, `<rect x="136" y="40" width="46" height="46" rx="9" fill="${RED}18" stroke="${RED}" stroke-width="1.8"/>` +
      txt(159, 70, '0', { fs: 20, fill: RED, fw: 900 }));
    s += seq(0.2, txt(212, 70, '×', { fs: 26, fw: 900, fill: MUT }));
    s += cell(240, 40, 46, 46, '3', { fs: 20, delay: 0.26 });
    s += seq(0.32, `<rect x="288" y="40" width="46" height="46" rx="9" fill="${RED}18" stroke="${RED}" stroke-width="1.8"/>` +
      txt(311, 70, '0', { fs: 20, fill: RED, fw: 900 }));
    s += seq(0.4, txt(370, 70, '=', { fs: 26, fw: 900, fill: MUT }));
    s += cell(400, 40, 46, 46, '4', { fs: 20, delay: 0.5, fill: '#eef7f1', stroke: GREEN });
    s += cell(448, 40, 46, 46, '8', { fs: 20, delay: 0.56, fill: '#eef7f1', stroke: GREEN });
    const z1 = '<g class="mf-zero-in" style="animation-delay:1s"><rect x="496" y="40" width="46" height="46" rx="9" fill="' + RED + '18" stroke="' + RED + '" stroke-width="1.8"/>' + txt(519, 70, '0', { fs: 20, fill: RED, fw: 900 }) + '</g>';
    const z2 = '<g class="mf-zero-in" style="animation-delay:1.15s"><rect x="544" y="40" width="46" height="46" rx="9" fill="' + RED + '18" stroke="' + RED + '" stroke-width="1.8"/>' + txt(567, 70, '0', { fs: 20, fill: RED, fw: 900 }) + '</g>';
    s += z1 + z2;
    s += seq(1.35, txt(320, 118, '先算 0 前面的数：16 × 3 = 48，再添上 2 个 0', { fs: 14, fill: INK }));
    s += seq(1.5, txt(320, 142, '两个因数末尾一共有几个 0，积的末尾就添几个 0', { fs: 13, fill: RED }));
    s += seq(1.65, `<rect x="120" y="152" width="400" height="24" rx="12" fill="#fdf5ec" stroke="#f0d9bb"/>` +
      txt(320, 168, '中间有 0（如 105 × 24）：那一位也要乘，不能跳过', { fs: 12, fill: '#8a5a1e' }));
    return s + '</svg>' + replayBtn();
  };

  /* 用计算器探索规律 */
  const mCalcPattern = () => {
    let s = '<svg class="fig-svg" viewBox="0 0 640 186">';
    /* 计算器 */
    s += seq(0, `<rect x="24" y="22" width="150" height="162" rx="16" fill="#f5f7fc" stroke="#cfd8e8" stroke-width="2"/>` +
      `<rect x="38" y="34" width="122" height="34" rx="8" fill="#e8f1e9" stroke="#bcd9c1"/>` +
      txt(160, 58, '9876', { anchor: 'end', fs: 20, mono: true, fill: '#2c6b3f' }));
    const keys = [['7', '8', '9', '÷'], ['4', '5', '6', '×'], ['1', '2', '3', '−'], ['0', '=', 'C', '+']];
    keys.forEach((row, r) => row.forEach((k, c) => {
      const x = 38 + c * 32, y = 78 + r * 26;
      s += seq(0.1 + (r * 4 + c) * 0.03, `<rect x="${x}" y="${y}" width="27" height="21" rx="6" fill="#fff" stroke="#dbe2ee"/>` +
        txt(x + 13.5, y + 15, k, { fs: 12.5, fill: '#4a5570' }));
    }));
    /* 规律塔 */
    const rows = [['1 × 8 + 1', '9'], ['12 × 8 + 2', '98'], ['123 × 8 + 3', '987'], ['1234 × 8 + 4', '9876']];
    rows.forEach((r, i) => {
      const y = 44 + i * 34;
      s += seq(0.4 + i * 0.12, txt(250, y, r[0], { anchor: 'start', fs: 16, fw: 800, fill: INK }));
      s += seq(0.48 + i * 0.12, txt(420, y, '=', { fs: 16, fill: MUT }));
      s += seq(0.55 + i * 0.12, txt(470, y, r[1], { anchor: 'start', fs: 19, fw: 900, fill: [SKY, TEAL, GOLD, ORANGE][i] }));
    });
    s += seq(1.1, arrow(520, 90, 520, 150, 'blue'));
    s += seq(1.2, txt(560, 132, '每次', { fs: 12.5, fill: BLUE }) + txt(560, 150, '多一位', { fs: 12.5, fill: BLUE }));
    s += seq(1.35, `<rect x="230" y="160" width="390" height="24" rx="12" fill="#f2f7fd"/>` +
      txt(425, 176, '先用计算器算，再观察数字找规律', { fs: 12.5, fill: '#50617a' }));
    return s + '</svg>' + replayBtn();
  };

  /* ================= 第四单元 · 观察物体 ================= */

  /* 根据视图搭建立体图形（互动） */
  const VIEW3D = {
    top: ['上面', '先看上面：底层 4 块，摆成田字'],
    front: ['正面', '再看正面：左右两列都是 2 层'],
    side: ['侧面', '最后用侧面验证：也是 2 层'],
  };
  const view3dGrid = (x, y) => {
    let g = '';
    for (let c = 0; c < 2; c++) {
      for (let r = 0; r < 2; r++) {
        g += `<rect x="${x + c * 44}" y="${y + r * 44}" width="40" height="40" rx="7" fill="${PURPLE}1f" stroke="${PURPLE}" stroke-width="1.8"/>`;
      }
    }
    return g;
  };
  const view3dStage = key => {
    const order = ['top', 'front', 'side'];
    let s = '';
    order.forEach((k, i) => {
      const x = 40 + i * 200, on = k === key;
      s += seq(i * 0.08, `<rect x="${x}" y="24" width="150" height="132" rx="16" fill="${on ? PURPLE + '14' : '#fff'}" stroke="${on ? PURPLE : LINE}" stroke-width="${on ? 2.6 : 1.6}"/>` +
        txt(x + 75, 48, VIEW3D[k][0], { fs: 15, fill: on ? PURPLE : MUT, fw: 900 }));
      s += seq(0.1 + i * 0.08, view3dGrid(x + 33, 62));
      s += seq(0.2 + i * 0.08, txt(x + 75, 148, on ? '正在看' : '', { fs: 12, fill: PURPLE }));
    });
    s += seq(0.4, txt(320, 182, '底层 4 块 + 上层 4 块 = 最少 8 块', { fs: 15, fill: INK, fw: 900 }));
    return s;
  };
  const view3dApply = (fig, key, btn) => {
    fig.dataset.view = key;
    const g = fig.querySelector('.mf-view3d-stage');
    if (g) g.innerHTML = view3dStage(key);
    const note = fig.querySelector('.mf-view3d-note');
    if (note) note.textContent = VIEW3D[key][1];
    fig.querySelectorAll('[data-fig-act="m-view3d"]').forEach(b => b.classList.toggle('fig-on', b === btn));
  };
  const mBuild3d = () => {
    let s = '<svg class="fig-svg" viewBox="0 0 640 196"><g class="mf-view3d-stage"></g></svg>';
    s += '<p class="fig-note mf-view3d-note"></p>';
    s += '<div class="fig-ctrl">' +
      Object.keys(VIEW3D).map(k => `<button class="fig-btn" data-fig-act="m-view3d" data-v="${k}" type="button">${VIEW3D[k][0]}</button>`).join('') +
      '</div>';
    return s;
  };

  /* ================= 第五单元 · 运算律 ================= */

  /* 加法交换律与结合律（互动） */
  const ADD_STATES = {
    raw: ['115 + 132 + 118 + 85 = ?', '按顺序一个一个加，容易算错'],
    swap: ['115 + 85 + 132 + 118', '用交换律把 85 搬到 115 旁边'],
    group: ['(115 + 85) + (132 + 118) = 450', '用结合律凑整：200 + 250 = 450'],
  };
  const addLawStage = key => {
    let s = '';
    if (key === 'raw') {
      const nums = ['115', '132', '118', '85'];
      nums.forEach((n, i) => {
        const x = 84 + i * 122;
        s += cell(x, 40, 86, 52, n, { fs: 19, delay: i * 0.08, fill: '#fff', stroke: LINE });
        if (i < 3) s += seq(0.1 + i * 0.08, txt(x + 104, 72, '+', { fs: 26, fill: MUT }));
      });
      s += seq(0.5, txt(320, 122, '= ?', { fs: 18, fill: MUT }));
    } else if (key === 'swap') {
      const nums = [['115', 0], ['85', 1], ['132', 0], ['118', 0]];
      nums.forEach((it, i) => {
        const x = 84 + i * 122, hot = it[1] === 1;
        s += cell(x, 40, 86, 52, it[0], {
          fs: 19, delay: i * 0.08,
          fill: hot ? GREEN + '1f' : '#fff', stroke: hot ? GREEN : LINE, ink: hot ? '#187749' : INK,
        });
        if (i < 3) s += seq(0.1 + i * 0.08, txt(x + 104, 72, '+', { fs: 26, fill: MUT }));
      });
      s += seq(0.5, `<path d="M 127 104 q 0 -26 122 -26" fill="none" stroke="${GREEN}" stroke-width="2.4" marker-end="url(#mfig-arrow-g)" stroke-dasharray="6 5"/>`);
      s += seq(0.62, txt(320, 130, '交换律：a + b = b + a，和不变', { fs: 13, fill: '#187749' }));
    } else {
      const groups = [['115 + 85', '200', GREEN], ['132 + 118', '250', SKY]];
      groups.forEach((g, i) => {
        const x = 70 + i * 260;
        s += seq(i * 0.1, `<rect x="${x}" y="34" width="216" height="60" rx="14" fill="${g[2]}12" stroke="${g[2]}" stroke-width="2"/>` +
          txt(x + 108, 62, g[0], { fs: 19, fw: 900, fill: INK }) +
          txt(x + 108, 84, '= ' + g[1], { fs: 14, fill: g[2], fw: 900 }));
        if (i === 0) s += seq(0.2, txt(348, 72, '+', { fs: 28, fill: MUT }));
      });
      s += seq(0.4, arrow(320, 102, 320, 122, 'blue'));
      s += seq(0.5, txt(320, 146, '200 + 250 = 450', { fs: 20, fw: 900, fill: BLUE }));
    }
    return s;
  };
  const addLawApply = (fig, key, btn) => {
    const g = fig.querySelector('.mf-law-stage');
    if (g) g.innerHTML = addLawStage(key);
    const note = fig.querySelector('.mf-law-note');
    if (note) note.textContent = ADD_STATES[key][1];
    fig.querySelectorAll('[data-fig-act="m-addlaw"]').forEach(b => b.classList.toggle('fig-on', b === btn));
  };
  const mAddLaw = () => {
    let s = '<svg class="fig-svg" viewBox="0 0 640 164"><g class="mf-law-stage"></g></svg>';
    s += '<p class="fig-note mf-law-note"></p>';
    s += '<div class="fig-ctrl">' +
      '<button class="fig-btn" data-fig-act="m-addlaw" data-v="raw" type="button">原式</button>' +
      '<button class="fig-btn" data-fig-act="m-addlaw" data-v="swap" type="button">交换</button>' +
      '<button class="fig-btn" data-fig-act="m-addlaw" data-v="group" type="button">凑整</button>' +
      '</div>';
    return s;
  };

  /* 乘法交换律与结合律（互动） */
  const MUL_STATES = {
    raw: ['25 × 7 × 4 = ?', '7 夹在中间，不好算'],
    swap: ['25 × 4 × 7', '用交换律把好朋友 25 和 4 挨在一起'],
    group: ['(25 × 4) × 7 = 700', '先凑成 100，再乘 7'],
  };
  const mulLawStage = key => {
    let s = '';
    if (key === 'raw') {
      ['25', '7', '4'].forEach((n, i) => {
        const x = 134 + i * 132;
        s += cell(x, 40, 86, 52, n, { fs: 19, delay: i * 0.08 });
        if (i < 2) s += seq(0.1 + i * 0.08, txt(x + 109, 72, '×', { fs: 24, fill: MUT }));
      });
      s += seq(0.5, txt(320, 122, '= ?', { fs: 18, fill: MUT }));
    } else if (key === 'swap') {
      [['25', 1], ['4', 1], ['7', 0]].forEach((it, i) => {
        const x = 134 + i * 132, hot = it[1] === 1;
        s += cell(x, 40, 86, 52, it[0], {
          fs: 19, delay: i * 0.08,
          fill: hot ? ORANGE + '1f' : '#fff', stroke: hot ? ORANGE : LINE, ink: hot ? '#b5561f' : INK,
        });
        if (i < 2) s += seq(0.1 + i * 0.08, txt(x + 109, 72, '×', { fs: 24, fill: MUT }));
      });
      s += seq(0.5, txt(320, 128, '交换律：a × b = b × a，积不变', { fs: 13, fill: '#b5561f' }));
    } else {
      s += seq(0, `<rect x="96" y="34" width="200" height="60" rx="14" fill="${ORANGE}14" stroke="${ORANGE}" stroke-width="2"/>` +
        txt(196, 62, '25 × 4', { fs: 19, fw: 900 }) + txt(196, 84, '= 100', { fs: 14, fill: '#b5561f', fw: 900 }));
      s += seq(0.15, txt(324, 72, '×', { fs: 26, fill: MUT }));
      s += seq(0.25, `<rect x="344" y="34" width="90" height="60" rx="14" fill="#fff" stroke="${LINE}" stroke-width="2"/>` +
        txt(389, 72, '7', { fs: 22, fw: 900 }));
      s += seq(0.4, arrow(320, 102, 320, 122, 'blue'));
      s += seq(0.5, txt(320, 146, '100 × 7 = 700', { fs: 20, fw: 900, fill: BLUE }));
    }
    return s;
  };
  const mulLawApply = (fig, key, btn) => {
    const g = fig.querySelector('.mf-law-stage');
    if (g) g.innerHTML = mulLawStage(key);
    const note = fig.querySelector('.mf-law-note');
    if (note) note.textContent = MUL_STATES[key][1];
    fig.querySelectorAll('[data-fig-act="m-mullaw"]').forEach(b => b.classList.toggle('fig-on', b === btn));
  };
  const mMulLaw = () => {
    let s = '<svg class="fig-svg" viewBox="0 0 640 190"><g class="mf-law-stage"></g></svg>';
    const friends = [['5 × 2', '10'], ['25 × 4', '100'], ['50 × 2', '100'], ['125 × 8', '1000']];
    s += '<div class="mf-chips">';
    friends.forEach(f => {
      s += '<span class="mf-chip"><b>' + f[0] + '</b><i>= ' + f[1] + '</i></span>';
    });
    s += '</div>';
    s += '<p class="fig-note mf-law-note"></p>';
    s += '<div class="fig-ctrl">' +
      '<button class="fig-btn" data-fig-act="m-mullaw" data-v="raw" type="button">原式</button>' +
      '<button class="fig-btn" data-fig-act="m-mullaw" data-v="swap" type="button">交换</button>' +
      '<button class="fig-btn" data-fig-act="m-mullaw" data-v="group" type="button">凑整</button>' +
      '</div>';
    return s;
  };

  /* 减法与除法的运算性质 */
  const mSubDiv = () => {
    let s = '<svg class="fig-svg" viewBox="0 0 640 184">';
    s += seq(0, txt(120, 34, '1000 − 268 − 32', { fs: 17, fw: 900 }));
    s += seq(0.15, arrow(230, 28, 280, 28, 'gray'));
    s += seq(0.25, txt(372, 34, '1000 − (268 + 32)', { fs: 17, fw: 900, fill: BLUE }));
    s += seq(0.35, arrow(468, 28, 508, 28, 'gray'));
    s += seq(0.45, txt(566, 34, '= 700', { fs: 17, fw: 900, fill: GREEN }));
    s += seq(0.6, txt(320, 62, '连减两个数 = 减去这两个数的和：a − b − c = a − (b + c)', { fs: 13, fill: MUT }));
    s += seq(0.7, `<line x1="40" y1="80" x2="600" y2="80" stroke="${LINE}" stroke-width="1.5"/>`);
    s += seq(0.8, txt(120, 116, '3900 ÷ 25 ÷ 4', { fs: 17, fw: 900 }));
    s += seq(0.9, arrow(230, 110, 280, 110, 'gray'));
    s += seq(1, txt(372, 116, '3900 ÷ (25 × 4)', { fs: 17, fw: 900, fill: BLUE }));
    s += seq(1.1, arrow(468, 110, 508, 110, 'gray'));
    s += seq(1.2, txt(566, 116, '= 39', { fs: 17, fw: 900, fill: GREEN }));
    s += seq(1.35, txt(320, 144, '连除两个数 = 除以这两个数的积：a ÷ b ÷ c = a ÷ (b × c)', { fs: 13, fill: MUT }));
    s += seq(1.5, `<rect x="150" y="156" width="340" height="24" rx="12" fill="#fdf5ec" stroke="#f0d9bb"/>` +
      txt(320, 172, '先看符号：只有连减、连除才能这样变', { fs: 12, fill: '#8a5a1e' }));
    return s + '</svg>' + replayBtn();
  };

  /* ================= 第六单元 · 图形的奥秘 ================= */

  /* 搭建立体大楼 */
  const mBuilding = () => {
    const layers = [
      ['第三层', 1, VIOLET],
      ['第二层', 2, PURPLE],
      ['底层', 4, SKY],
    ];
    let s = '<svg class="fig-svg" viewBox="0 0 640 192">';
    let d = 0;
    layers.forEach((L, li) => {
      const y = 118 - li * 38;
      const n = L[1];
      s += seq(d, txt(58, y + 25, L[0], { anchor: 'end', fs: 13, fill: L[2], fw: 900 }));
      for (let i = 0; i < n; i++) {
        s += cell(76 + i * 44, y, 38, 34, '', { delay: d + 0.1 + i * 0.06, fill: L[2] + '22', stroke: L[2], rx: 7 });
      }
      s += seq(d + 0.32, txt(76 + n * 44 + 8, y + 25, n + ' 块', { anchor: 'start', fs: 13, fill: MUT }));
      d += 0.45;
    });
    s += seq(1.5, `<line x1="76" y1="160" x2="252" y2="160" stroke="${LINE}" stroke-width="1.6"/>`);
    s += seq(1.65, txt(320, 182, '4 + 2 + 1 = 7（块）  从下往上搭，上层要压在下层上', { fs: 14, fill: INK, fw: 800 }));
    return s + '</svg>' + replayBtn();
  };

  /* 在想象中转一转 */
  const mRotate = () => {
    return '<div class="mf-rot">' +
      '<div class="mf-rot-stage"><div class="mf-rot-cube">' +
      '<span class="mf-rot-face f-front">正</span>' +
      '<span class="mf-rot-face f-back">后</span>' +
      '<span class="mf-rot-face f-right">右</span>' +
      '<span class="mf-rot-face f-left">左</span>' +
      '<span class="mf-rot-face f-top">上</span>' +
      '<span class="mf-rot-face f-bottom">下</span>' +
      '</div></div>' +
      '<div class="mf-rot-copy">' +
      '<p><b>转一转：</b>位置在变，每个面的形状不变</p>' +
      '<p>想不清楚就先画草图：把看到的面一层层拆开画</p>' +
      '</div></div>';
  };

  /* ================= 第七单元 · 数量关系 ================= */

  /* 总价 / 单价 / 数量 */
  const mPrice = () => {
    const T = [320, 44], L = [130, 150], R = [510, 150];
    let s = '<svg class="fig-svg" viewBox="0 0 640 196">';
    s += seq(0, `<path d="M ${L[0]} ${L[1]} L ${T[0]} ${T[1]} L ${R[0]} ${R[1]} Z" fill="#f4f8ff" stroke="${LINE}" stroke-width="1.8"/>`);
    s += block(T[0] - 55, T[1] - 24, 110, 48, { fill: BLUE, stroke: BLUE, delay: 0.1, ink: '#fff' });
    s += seq(0.2, txt(T[0], T[1] + 6, '总价', { fs: 18, fill: '#fff', fw: 900 }));
    s += block(L[0] - 55, L[1] - 22, 110, 46, { fill: '#fff', stroke: SKY, delay: 0.25 });
    s += seq(0.34, txt(L[0], L[1] + 8, '单价', { fs: 17, fill: SKY, fw: 900 }));
    s += block(R[0] - 55, R[1] - 22, 110, 46, { fill: '#fff', stroke: GREEN, delay: 0.4 });
    s += seq(0.5, txt(R[0], R[1] + 8, '数量', { fs: 17, fill: GREEN, fw: 900 }));
    s += seq(0.6, arrow(L[0] + 34, L[1] - 24, T[0] - 40, T[1] + 14, 'blue'));
    s += seq(0.7, arrow(R[0] - 34, R[1] - 24, T[0] + 40, T[1] + 14, 'green'));
    s += seq(0.8, txt(206, 96, '× 数量', { fs: 13, fill: BLUE, anchor: 'end' }));
    s += seq(0.8, txt(434, 96, '× 单价', { fs: 13, fill: GREEN, anchor: 'start' }));
    s += seq(0.9, `<path d="M ${T[0] - 14} ${T[1] + 26} L ${L[0] + 22} ${L[1] - 34}" fill="none" stroke="${MUT}" stroke-width="2" stroke-dasharray="5 5" marker-end="url(#mfig-arrow)"/>`);
    s += seq(1, `<path d="M ${T[0] + 14} ${T[1] + 26} L ${R[0] - 22} ${R[1] - 34}" fill="none" stroke="${MUT}" stroke-width="2" stroke-dasharray="5 5" marker-end="url(#mfig-arrow)"/>`);
    s += seq(1.05, txt(248, 128, '÷ 数量', { fs: 12.5, fill: MUT, anchor: 'end' }));
    s += seq(1.05, txt(392, 128, '÷ 单价', { fs: 12.5, fill: MUT, anchor: 'start' }));
    s += seq(1.2, txt(320, 124, '总价 = 单价 × 数量', { fs: 15, fw: 900, fill: INK }));
    s += seq(1.35, `<rect x="150" y="164" width="340" height="24" rx="12" fill="#f2f7fd"/>` +
      txt(320, 180, '知道其中两个量，就能求出第三个量', { fs: 12.5, fill: '#50617a' }));
    return s + '</svg>' + replayBtn();
  };

  /* 归一问题 */
  const mNormalize = () => {
    const box = (x, y, c) => `<rect x="${x}" y="${y}" width="34" height="30" rx="5" fill="${c}22" stroke="${c}" stroke-width="1.8"/>` +
      `<line x1="${x}" y1="${y + 10}" x2="${x + 34}" y2="${y + 10}" stroke="${c}" stroke-width="1.5"/>`;
    let s = '<svg class="fig-svg" viewBox="0 0 640 176">';
    for (let i = 0; i < 3; i++) s += seq(0.05 * i, box(40 + i * 40, 46, SKY));
    s += seq(0.2, txt(100, 96, '45 千克', { fs: 13.5, fill: SKY }));
    s += seq(0.35, arrow(170, 62, 215, 62, 'gray') + txt(192, 50, '÷ 3', { fs: 13, fill: MUT }));
    s += seq(0.5, box(236, 46, GREEN));
    s += seq(0.6, txt(253, 96, '15 千克', { fs: 13.5, fill: GREEN }));
    s += seq(0.7, txt(253, 112, '每一份', { fs: 12, fill: MUT }));
    s += seq(0.8, arrow(285, 62, 330, 62, 'gray') + txt(308, 50, '× 5', { fs: 13, fill: MUT }));
    for (let i = 0; i < 5; i++) s += seq(0.9 + i * 0.05, box(348 + i * 40, 46, ORANGE));
    s += seq(1.15, txt(448, 96, '75 千克', { fs: 13.5, fill: ORANGE }));
    s += seq(1.3, `<line x1="30" y1="126" x2="610" y2="126" stroke="${LINE}" stroke-width="1.5"/>`);
    s += seq(1.4, txt(320, 150, '先「归一」求出每一份：45 ÷ 3 = 15；再「归总」：15 × 5 = 75', { fs: 14, fill: INK, fw: 800 }));
    s += seq(1.55, txt(320, 170, '关键：必须先求出单一量（每份数）', { fs: 12.5, fill: MUT }));
    return s + '</svg>' + replayBtn();
  };

  /* 归总问题 */
  const mTotalize = () => {
    let s = '<svg class="fig-svg" viewBox="0 0 640 176">';
    s += seq(0, txt(96, 28, '每箱 24 千克 × 5 箱', { fs: 14, fill: SKY }));
    for (let i = 0; i < 5; i++) {
      s += seq(0.05 + i * 0.05, `<rect x="${30 + i * 28}" y="38" width="24" height="26" rx="4" fill="${SKY}22" stroke="${SKY}" stroke-width="1.6"/>`);
    }
    s += seq(0.4, arrow(184, 52, 228, 52, 'gray'));
    s += seq(0.5, `<rect x="240" y="32" width="150" height="52" rx="12" fill="${GREEN}18" stroke="${GREEN}" stroke-width="2"/>` +
      txt(315, 54, '总量 120 千克', { fs: 15, fill: '#187749', fw: 900 }) +
      txt(315, 74, '不变的量', { fs: 12, fill: MUT }));
    s += seq(0.7, arrow(402, 52, 446, 52, 'gray'));
    for (let i = 0; i < 4; i++) {
      s += seq(0.8 + i * 0.05, `<rect x="${460 + i * 32}" y="38" width="28" height="26" rx="4" fill="${ORANGE}22" stroke="${ORANGE}" stroke-width="1.6"/>`);
    }
    s += seq(1, txt(560, 28, '每箱 30 千克', { fs: 14, fill: ORANGE }));
    s += seq(1.15, txt(560, 88, '4 箱', { fs: 13.5, fill: ORANGE }));
    s += seq(1.3, `<line x1="30" y1="108" x2="610" y2="108" stroke="${LINE}" stroke-width="1.5"/>`);
    s += seq(1.4, txt(320, 136, '先「归总」：24 × 5 = 120；再重新分：120 ÷ 30 = 4（箱）', { fs: 14, fill: INK, fw: 800 }));
    s += seq(1.55, txt(320, 160, '找一找题目里「不变的量」，那往往就是总量', { fs: 12.5, fill: MUT }));
    return s + '</svg>' + replayBtn();
  };

  /* 解决问题四步法 */
  const m4Steps = () => {
    const steps = [
      ['🔍', '读', '圈出信息和问题', SKY],
      ['🖍️', '画', '画图、列表分析', GREEN],
      ['🧮', '算', '想清先算什么', ORANGE],
      ['✅', '验', '检验并写答语', RED],
    ];
    let s = '<svg class="fig-svg" viewBox="0 0 640 156">';
    steps.forEach((st, i) => {
      const x = 12 + i * 158;
      s += seq(i * 0.12, `<rect x="${x}" y="20" width="138" height="112" rx="16" fill="${st[3]}12" stroke="${st[3]}" stroke-width="2"/>` +
        txt(x + 69, 52, st[0], { fs: 28 }));
      s += seq(0.1 + i * 0.12, txt(x + 69, 86, st[1], { fs: 20, fill: st[3], fw: 900 }));
      s += seq(0.18 + i * 0.12, txt(x + 69, 106, st[2].slice(0, 5), { fs: 12, fill: INK }) +
        txt(x + 69, 122, st[2].slice(5), { fs: 12, fill: MUT }));
      if (i < 3) s += seq(0.3 + i * 0.12, arrow(x + 140, 76, x + 156, 76, 'gray'));
    });
    return s + '</svg>' + replayBtn();
  };

  /* ================= 第八单元 · 数据统计 ================= */

  /* 画「正」字记录 */
  const mTally = () => {
    const bx = 40, by = 34, U = 1; // 单格尺寸
    const strokes = [
      ['M ' + (bx + 4 * U) + ' ' + (by + 24) + ' L ' + (bx + 116) + ' ' + (by + 24), 120],
      ['M ' + (bx + 40) + ' ' + (by + 12) + ' L ' + (bx + 40) + ' ' + (by + 112), 100],
      ['M ' + (bx + 40) + ' ' + (by + 56) + ' L ' + (bx + 88) + ' ' + (by + 56), 48],
      ['M ' + (bx + 88) + ' ' + (by + 56) + ' L ' + (bx + 88) + ' ' + (by + 112), 56],
      ['M ' + (bx + 4) + ' ' + (by + 112) + ' L ' + (bx + 116) + ' ' + (by + 112), 112],
    ];
    let s = '<svg class="fig-svg" viewBox="0 0 640 186">';
    s += seq(0, `<rect x="${bx - 8}" y="${by - 4}" width="132" height="132" rx="14" fill="#fff" stroke="${LINE}" stroke-width="1.8"/>`);
    strokes.forEach((st, i) => {
      s += `<path class="mf-stroke" style="--len:${st[1]};animation-delay:${0.25 + i * 0.28}s" d="${st[0]}" fill="none" stroke="${BLUE}" stroke-width="7" stroke-linecap="round"/>`;
    });
    s += seq(1.6, txt(106, 178, '一个「正」字 = 5 画 = 5 人', { fs: 13, fill: BLUE }));
    /* 右侧记录表 */
    const rows = [['跳绳', '正正丁', '12 人', GREEN], ['足球', '正一', '6 人', ORANGE], ['篮球', '正', '5 人', SKY]];
    s += seq(0.1, txt(230, 40, '项目', { anchor: 'start', fs: 13, fill: MUT }) +
      txt(400, 40, '画「正」字', { anchor: 'start', fs: 13, fill: MUT }) +
      txt(570, 40, '人数', { anchor: 'end', fs: 13, fill: MUT }));
    rows.forEach((r, i) => {
      const y = 74 + i * 38;
      s += seq(0.2 + i * 0.12, `<rect x="222" y="${y - 24}" width="360" height="32" rx="10" fill="${i % 2 ? '#fafbfe' : '#fff'}" stroke="${LINE}"/>` +
        txt(240, y - 2, r[0], { anchor: 'start', fs: 14, fw: 800 }) +
        txt(400, y - 2, r[1], { anchor: 'start', fs: 15, fw: 900, fill: r[3] }) +
        txt(562, y - 2, r[2], { anchor: 'end', fs: 14, fw: 900 }));
    });
    s += seq(0.8, txt(400, 168, '记录完记得核对总人数，防止漏记、重记', { fs: 12.5, fill: MUT }));
    return s + '</svg>' + replayBtn();
  };

  /* 读图分析与决策 */
  const mReadChart = () => {
    const data = [['跳绳', 12, GREEN], ['篮球', 9, SKY], ['足球', 6, ORANGE], ['跑步', 4, PURPLE]];
    const baseY = 140, unit = 2, h = 12; // 1 格 = 12px 代表 2 人
    let s = '<svg class="fig-svg" viewBox="0 0 640 196">';
    s += seq(0, txt(320, 22, '全班最喜欢的运动项目（1 格表示 2 人）', { fs: 14, fw: 900 }));
    s += seq(0.05, `<line x1="70" y1="${baseY}" x2="600" y2="${baseY}" stroke="#c8cfdd" stroke-width="2.5"/>` +
      `<line x1="70" y1="36" x2="70" y2="${baseY}" stroke="#c8cfdd" stroke-width="2.5"/>`);
    for (let v = 0; v <= 12; v += 2) {
      const y = baseY - v / unit * h;
      s += seq(0.1, `<line x1="66" y1="${y}" x2="600" y2="${y}" stroke="${LINE}" stroke-width="1"/>` +
        txt(58, y + 4, String(v), { anchor: 'end', fs: 11.5, fill: MUT }));
    }
    data.forEach((d, i) => {
      const x = 108 + i * 122, bh = d[1] / unit * h;
      s += `<g class="mf-bar" style="animation-delay:${0.3 + i * 0.13}s">` +
        `<rect x="${x}" y="${baseY - bh}" width="72" height="${bh}" rx="6" fill="${d[2]}"/>` +
        txt(x + 36, baseY - bh - 8, d[1] + ' 人', { fs: 13, fill: d[2], fw: 900 }) + '</g>';
      s += seq(0.9 + i * 0.08, txt(x + 36, baseY + 22, d[0], { fs: 14, fw: 800 }));
    });
    s += seq(1.25, `<path d="M 144 40 q 4 -22 26 -18" fill="none" stroke="${GREEN}" stroke-width="2.2" marker-end="url(#mfig-arrow-g)"/>`);
    s += seq(1.4, `<rect x="196" y="14" width="196" height="30" rx="15" fill="${GREEN}18" stroke="${GREEN}"/>` +
      txt(294, 34, '跳绳直条最高 → 最受欢迎', { fs: 13, fill: '#187749', fw: 800 }));
    s += seq(1.55, txt(320, 182, '读图要说出「谁比谁多多少」，再据此提建议', { fs: 12.5, fill: MUT }));
    return s + '</svg>' + replayBtn();
  };

  /* ================= 单元横幅 ================= */
  const bannerSVG = (o, id) => {
    let s = `<svg class="fig-svg" viewBox="0 0 640 110" role="img" aria-label="${o.title}">`;
    s += `<defs><linearGradient id="mbg-${id}" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="${o.color}" stop-opacity=".2"/>` +
      `<stop offset="1" stop-color="${o.color}" stop-opacity=".06"/></linearGradient></defs>`;
    s += `<rect x="0" y="0" width="640" height="110" rx="16" fill="url(#mbg-${id})" stroke="${o.color}" stroke-opacity=".24"/>`;
    s += o.decor(o.color);
    s += txt(70, 66, o.emoji, { fs: 42 });
    s += `<line x1="122" y1="28" x2="122" y2="82" stroke="${o.color}" stroke-opacity=".25" stroke-width="2"/>`;
    s += txt(232, 58, o.sub, { anchor: 'middle', fs: 16, fw: 900, fill: '#34384d' });
    return s + '</svg>';
  };

  const decDigits = c => {
    let s = '';
    ['1', '0', '0', '0', '0', '0'].forEach((d, i) => {
      s += `<g class="mf-float" style="animation-delay:${i * 0.35}s">` +
        txt(430 + i * 34, 46 + (i % 2 ? 20 : 0), d, { fs: 23, fill: c, fw: 900 }) + '</g>';
    });
    return s + txt(520, 98, '10 个一万是十万', { fs: 12.5, fill: MUT });
  };
  const decCode = c => {
    let s = '';
    for (let i = 0; i < 22; i++) {
      const w = (i * 7 % 3) + 2;
      s += `<rect x="${400 + i * 9}" y="${34 + (i % 3)}" width="${w}" height="48" rx="1.5" fill="${c}" fill-opacity=".55"/>`;
    }
    return s + txt(520, 100, '6 位邮编 · 18 位身份证', { fs: 12.5, fill: MUT });
  };
  const decLines = c => {
    let s = `<path d="M 400 42 L 600 42 M 400 60 L 600 60" stroke="${c}" stroke-width="3"/>` +
      `<path d="M 410 84 L 560 84 L 560 54" stroke="${c}" stroke-width="3" fill="none"/>` +
      `<path d="M 470 84 A 22 22 0 0 0 448 66" fill="none" stroke="${c}" stroke-width="2.4"/>`;
    s += txt(586, 104, '∥ 与 ⊥', { fs: 13, fill: c, fw: 900 });
    return s;
  };
  const decMul = c => {
    let s = txt(430, 68, '×', { fs: 38, fill: c, fw: 900 });
    for (let i = 0; i < 3; i++) s += `<rect x="${480 + i * 40}" y="${34}" width="32" height="52" rx="6" fill="#fff" stroke="${c}" stroke-opacity=".5"/>`;
    return s + txt(520, 104, '三位数 × 两位数', { fs: 12.5, fill: MUT });
  };
  const decBlocks = c => {
    let s = '';
    [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(p => {
      s += `<rect x="${420 + p[0] * 40}" y="${72 - p[1] * 40}" width="36" height="36" rx="6" fill="${c}" fill-opacity=".28" stroke="${c}"/>`;
    });
    for (let i = 0; i < 2; i++) s += `<rect x="${520 + i * 40}" y="32" width="36" height="36" rx="6" fill="${c}" fill-opacity=".28" stroke="${c}"/>`;
    return s + txt(560, 100, '正面 · 上面 · 侧面', { fs: 12.5, fill: MUT });
  };
  const decOps = c => {
    let s = txt(430, 62, '+', { fs: 34, fill: c, fw: 900 }) + txt(478, 62, '×', { fs: 30, fill: c, fw: 900 });
    s += `<rect x="512" y="36" width="46" height="46" rx="10" fill="${c}" fill-opacity=".2" stroke="${c}"/>` +
      txt(535, 66, '100', { fs: 15, fill: c, fw: 900 });
    s += `<rect x="566" y="36" width="46" height="46" rx="10" fill="${c}" fill-opacity=".2" stroke="${c}"/>` +
      txt(589, 66, '1000', { fs: 13, fill: c, fw: 900 });
    return s + txt(520, 100, '凑整好朋友', { fs: 12.5, fill: MUT });
  };
  const decSeg = c => {
    let s = `<line x1="400" y1="78" x2="600" y2="78" stroke="${c}" stroke-width="3"/>`;
    for (let i = 0; i < 6; i++) s += `<circle cx="${400 + i * 40}" cy="78" r="5.5" fill="${c}"/>`;
    let p = '';
    for (let i = 0; i < 5; i++) {
      const a = -((i + 1) * 10) - 12;
      p += `M ${420 + i * 26} ${78 + a} Q 500 ${54 + a} ${580 - i * 26} ${78 + a} `;
    }
    s += `<path d="${p}" fill="none" stroke="${c}" stroke-opacity=".45" stroke-width="1.6"/>`;
    return s + txt(500, 102, '5 + 4 + 3 + 2 + 1 = 15 条', { fs: 12.5, fill: MUT });
  };
  const decCube = c => {
    return `<path d="M 440 42 L 500 24 L 560 42 L 500 60 Z" fill="${c}" fill-opacity=".2" stroke="${c}" stroke-width="2"/>` +
      `<path d="M 440 42 L 440 68 L 500 86 L 500 60 Z" fill="${c}" fill-opacity=".12" stroke="${c}" stroke-width="2"/>` +
      `<path d="M 560 42 L 560 68 L 500 86 L 500 60 Z" fill="${c}" fill-opacity=".28" stroke="${c}" stroke-width="2"/>` +
      txt(500, 102, '切开 · 搭建 · 旋转', { fs: 12.5, fill: MUT });
  };
  const decCar = c => {
    let s = `<rect x="410" y="56" width="86" height="32" rx="10" fill="${c}" fill-opacity=".22" stroke="${c}" stroke-width="2"/>` +
      `<circle cx="432" cy="94" r="8" fill="${c}" fill-opacity=".4" stroke="${c}"/>` +
      `<circle cx="478" cy="94" r="8" fill="${c}" fill-opacity=".4" stroke="${c}"/>`;
    s += arrow(512, 70, 596, 70, 'blue');
    return s + txt(520, 38, '85 千米/时 × 4 时', { fs: 12.5, fill: MUT });
  };
  const decBar = c => {
    let s = '';
    [[0, 52], [1, 34], [2, 64], [3, 24]].forEach(b => {
      s += `<rect x="${410 + b[0] * 46}" y="${92 - b[1]}" width="32" height="${b[1]}" rx="5" fill="${c}" fill-opacity="${0.2 + b[0] * 0.15}"/>`;
    });
    return s + `<line x1="404" y1="92" x2="600" y2="92" stroke="${c}" stroke-width="2"/>` +
      txt(520, 40, '1 格可以表示 2 个单位', { fs: 12.5, fill: MUT });
  };
  const decFormula = c => {
    return txt(452, 64, 'a', { fs: 26, fill: c, fw: 900, mono: true }) +
      txt(486, 64, '+', { fs: 22, fill: c }) +
      txt(514, 64, 'b', { fs: 26, fill: c, fw: 900, mono: true }) +
      txt(546, 64, '=', { fs: 22, fill: c }) +
      txt(578, 64, 'c', { fs: 26, fill: c, fw: 900, mono: true }) +
      txt(500, 96, '公式 · 法则 · 一查就会', { fs: 12.5, fill: MUT });
  };
  const decWarn = c => {
    return txt(452, 66, '❌', { fs: 26 }) + txt(500, 66, '→', { fs: 24, fill: c }) + txt(546, 66, '✅', { fs: 26 }) +
      txt(500, 98, '考前把错处清单过一遍', { fs: 12.5, fill: MUT });
  };

  const BANNERS = {
    'mban-mu1': { emoji: '🔢', title: '认识更大的数', sub: '从万到亿 · 分级读写的秘密', color: BLUE, decor: decDigits },
    'mban-mcode': { emoji: '📮', title: '编码', sub: '一串数字，藏着确定的信息', color: GOLD, decor: decCode },
    'mban-mu2': { emoji: '📏', title: '线与角', sub: '线段、射线、直线与角的度量', color: GREEN, decor: decLines },
    'mban-mu3': { emoji: '✖️', title: '整数乘法（二）', sub: '算得准，还要算得巧', color: ORANGE, decor: decMul },
    'mban-mu4': { emoji: '🏙️', title: '我们生活的空间（二）', sub: '换个方向看一看', color: PURPLE, decor: decBlocks },
    'mban-mu5': { emoji: '➕', title: '运算律', sub: '交换、结合、分配', color: RED, decor: decOps },
    'mban-mplay': { emoji: '🧩', title: '数图形的学问', sub: '按顺序数，不重复不遗漏', color: '#d96c2f', decor: decSeg },
    'mban-mu6': { emoji: '🧊', title: '图形的奥秘', sub: '切开、搭建、转一转', color: TEAL, decor: decCube },
    'mban-mu7': { emoji: '🚗', title: '运用数量关系解决问题', sub: '单价、速度、归一与归总', color: SKY, decor: decCar },
    'mban-mu8': { emoji: '📊', title: '数据的表示和分析（一）', sub: '用图说话', color: VIOLET, decor: decBar },
    'mban-formulas': { emoji: '📐', title: '公式法则速查', sub: '点一行，读一行', color: SKY, decor: decFormula },
    'mban-mistakes': { emoji: '⚠️', title: '易错诊所', sub: '错一次，记一辈子', color: PINK, decor: decWarn },
  };
  const bannerFn = id => () => bannerSVG(BANNERS[id], id);

  /* ================= 注册表 ================= */
  const REG = {
    'm-write': mWrite,
    'm-compare': mCompare,
    'm-exact-approx': mExactApprox,
    'm-code-id': mCodeId,
    'm-code-make': mCodeMake,
    'm-draw-angle': mDrawAngle,
    'm-estimate': mEstimate,
    'm-zero-mult': mZeroMult,
    'm-calc-pattern': mCalcPattern,
    'm-build3d': mBuild3d,
    'm-add-law': mAddLaw,
    'm-mul-law': mMulLaw,
    'm-sub-div': mSubDiv,
    'm-building': mBuilding,
    'm-rotate': mRotate,
    'm-price': mPrice,
    'm-normalize': mNormalize,
    'm-totalize': mTotalize,
    'm-4steps': m4Steps,
    'm-tally': mTally,
    'm-read-chart': mReadChart,
  };
  Object.keys(BANNERS).forEach(id => { REG[id] = bannerFn(id); });

  const DEMO_INIT = {
    'm-draw-angle': { key: '1', apply: angleApply, act: 'm-angle-step' },
    'm-build3d': { key: 'top', apply: view3dApply, act: 'm-view3d' },
    'm-add-law': { key: 'raw', apply: addLawApply, act: 'm-addlaw' },
    'm-mul-law': { key: 'raw', apply: mulLawApply, act: 'm-mullaw' },
  };

  const DEFAULT_CAPS = {
    'm-write': '先分级、再填数：哪一位上没有计数单位就写 0',
    'm-compare': '比大小两步走：先数位数，位数相同再比最高位',
    'm-exact-approx': '带「约、大约、近」的数，是四舍五入得到的近似数',
    'm-code-id': '身份证 18 位分段：地址码 · 出生日期 · 顺序码 · 校验码',
    'm-code-make': '设计编码：先定信息，再定位数，规则要简单唯一',
    'm-draw-angle': '互动演示：点 1～4，一步一步画出一个 65° 的角',
    'm-estimate': '估算：把因数看成整十整百，先判断「够不够」',
    'm-zero-mult': '末尾有 0 先不算，最后把 0 全部添回去',
    'm-calc-pattern': '用计算器算一算，再观察结果找规律',
    'm-build3d': '互动演示：点「上面 / 正面 / 侧面」，看怎么搭出 8 块',
    'm-add-law': '互动演示：原式 → 交换 → 凑整，看 450 是怎么来的',
    'm-mul-law': '互动演示：把 25 和 4 凑到一起，就是简便运算的钥匙',
    'm-sub-div': '连减变减和、连除变除以积，先看符号再动手',
    'm-building': '从下往上搭：4 + 2 + 1 = 7 块，上层要压在下层上',
    'm-rotate': '在脑子里转一转：位置在变，每个面的形状不变',
    'm-price': '总价 = 单价 × 数量，知道两个就能求第三个',
    'm-normalize': '归一：先求出每一份是多少，再求几份是多少',
    'm-totalize': '归总：先求出总量，再按新标准重新分配',
    'm-4steps': '读 → 画 → 算 → 验，四步一个都不能少',
    'm-tally': '画「正」字记录：一个「正」字 5 画，好数又好查',
    'm-read-chart': '比直条高矮，说出「谁比谁多多少」，再提建议',
  };

  function figHTML(id, cap) {
    const fn = REG[id];
    if (!fn) return '';
    const capText = cap || DEFAULT_CAPS[id] || '';
    return '<figure class="fig mf-run" data-fig="' + id + '">' + DEFS + fn() +
      (id in BANNERS ? '' : (capText ? '<figcaption class="fig-cap">' + capText + '</figcaption>' : '')) + '</figure>';
  }

  function bannerHTML(id) {
    const fn = REG[id];
    if (!fn) return '';
    return '<div class="unit-banner mf-run" data-banner="' + id + '">' + DEFS + fn() + '</div>';
  }

  /* ---------- 事件委托 ---------- */
  function bindDelegates(doc) {
    doc.addEventListener('click', e => {
      const b = e.target.closest('[data-fig-act]');
      if (!b) return;
      const fig = b.closest('.fig');
      if (!fig) return;
      const act = b.dataset.figAct;
      if (act === 'm-replay') {
        fig.classList.remove('mf-run');
        void fig.offsetWidth;
        fig.classList.add('mf-run');
      } else if (act === 'm-angle-step') angleApply(fig, b.dataset.v, b);
      else if (act === 'm-view3d') view3dApply(fig, b.dataset.v, b);
      else if (act === 'm-addlaw') addLawApply(fig, b.dataset.v, b);
      else if (act === 'm-mullaw') mulLawApply(fig, b.dataset.v, b);
    });
  }

  /* 初始化（渲染后无需再调用；委托自动工作） */
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
    bannerHTML,
    get FIG_IDS() { return Object.keys(REG); },
    has(id) { return Object.prototype.hasOwnProperty.call(REG, id); },
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FIG_IDS: MathFigures.FIG_IDS, has: MathFigures.has, figHTML: MathFigures.figHTML, bannerHTML: MathFigures.bannerHTML };
}
if (typeof window !== 'undefined') {
  window.MathFigures = MathFigures;
}

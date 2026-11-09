/*
 * Self-contained historical teaching diagrams. No DOM writes or remote dependencies.
 * Sources for details that require an explicit historical convention:
 * https://www.neac.gov.cn/seac/c103391/202308/1166522.shtml (Dujiangyan components)
 * https://www.chnmuseum.cn/portals/0/web/zt/gudai/detail4.html (Qin central/local government)
 * https://www.archives.go.jp/exhibition/digital/rekishitomonogatari/history02.html (imperial accessions and Jin unification)
 * https://www.igsnrr.cas.cn/cbkx/kpyd/zgdl/cnszy/202009/t20200910_5692415.html (canal systems and later changes)
 * https://www.nlc.cn/pcab/zlyj/zlyj_djsh/20190418_177776.shtml (Bi Sheng and clay movable type)
 * https://www.chnmuseum.cn/portals/0/web/zt/202012kxyjs/ (papermaking and technology)
 * https://ihns.cas.cn/kxcb_/kxjd/202212/t20221206_6567192.html (Song navigation compass)
 */
(() => {
  'use strict';
  const C = { ink: '#233e37', muted: '#586b62', green: '#22634c', soft: '#e8f1df', paper: '#f7faf5', blue: '#2d7886', blueSoft: '#e4f0f2', line: '#cfddc9', warm: '#986332', warmSoft: '#f4e8d8' };
  const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const text = (x, y, value, size = 22, color = C.ink, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${esc(value)}</text>`;
  const center = (x, y, value, size = 22, color = C.ink, extra = '') => text(x, y, value, size, color, `text-anchor="middle" ${extra}`);
  const box = (x, y, width, height, fill = C.soft, radius = 15) => `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}"/>`;
  const arrow = (x1, y1, x2, y2, color = C.green, width = 3) => {
    const angle = Math.atan2(y2 - y1, x2 - x1), length = 10;
    const ax = x2 - length * Math.cos(angle - .5), ay = y2 - length * Math.sin(angle - .5);
    const bx = x2 - length * Math.cos(angle + .5), by = y2 - length * Math.sin(angle + .5);
    return `<path d="M${x1} ${y1}L${x2} ${y2}M${ax.toFixed(1)} ${ay.toFixed(1)}L${x2} ${y2}L${bx.toFixed(1)} ${by.toFixed(1)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  };
  const wrap = (key, title, description, body, height = 360) => {
    const id = `hu-diagram-${key}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 ${height}" width="800" height="${height}" role="img" aria-labelledby="${id}-title ${id}-desc" style="display:block;width:100%;height:auto;background:${C.paper}"><title id="${id}-title">${esc(title)}</title><desc id="${id}-desc">${esc(description)}</desc><g font-family="PingFang SC, Microsoft YaHei, Noto Sans CJK SC, system-ui, sans-serif" font-size="22" fill="${C.ink}" stroke-linejoin="round">${body}</g></svg>`;
  };

  const years = wrap('hu1-2', '公元纪年没有零年，世纪从一年开始计算', '时间依次经过公元前3年、前2年、前1年，再到公元1年、2年、3年；没有公元0年，公元前1年到公元1年只经过一年。公元1世纪为1至100年，公元21世纪为2001至2100年；公元前1世纪为前100至前1年，前3世纪为前300至前201年。计算世纪时，年份数字先减1，除以100取整数部分，再加1，并保留公元前的标记。',
    text(25, 33, '先排年代，再算世纪', 28, C.ink, 'font-weight="700"') +
    [3, 2, 1, 1, 2, 3].map((value, index) => {
      const x = 38 + index * 126;
      return box(x, 58, 94, 85, index < 3 ? C.warmSoft : C.soft) + center(x + 47, 88, index < 3 ? '公元前' : '公元', 20, index < 3 ? C.warm : C.green) + center(x + 47, 124, `${value}年`, 27, C.ink, 'font-weight="700"') + (index < 5 ? arrow(x + 100, 103, x + 120, 103, C.muted, 2) : '');
    }).join('') +
    center(400, 183, '没有公元0年；前1年到公元1年，只经过1年。', 24, C.warm, 'font-weight="700"') +
    box(25, 210, 365, 128, C.soft) + box(410, 210, 365, 128, C.blueSoft) +
    text(44, 243, '公元：年份向后增大', 24, C.green, 'font-weight="700"') + text(44, 281, '1世纪：1—100年', 22) + text(44, 317, '21世纪：2001—2100年', 22) +
    text(429, 243, '公元前：年代越早，数越大', 23, C.blue, 'font-weight="700"') + text(429, 281, '前1世纪：前100—前1年', 22) + text(429, 317, '前3世纪：前300—前201年', 22) +
    text(25, 377, '算世纪：年份数字减1 → 除100取整数部分 → 加1。', 22, C.green) +
    text(25, 410, '顺序与算法示意；公元前的世纪名称仍需保留“公元前”。', 20, C.muted), 430);

  const chainRow = (y, entries, widths, number) => {
    let x = 56;
    let result = center(25, y + 43, number, 25, C.green, 'font-weight="750"');
    entries.forEach((entry, index) => {
      const width = widths[index];
      result += box(x, y, width, 68, index % 2 ? C.blueSoft : C.soft);
      if (entry.length === 1) result += center(x + width / 2, y + 43, entry[0], 24, C.ink, 'font-weight="700"');
      else result += center(x + width / 2, y + 29, entry[0], 23, C.ink, 'font-weight="700"') + center(x + width / 2, y + 55, entry[1], 20, C.muted);
      if (index < entries.length - 1) result += arrow(x + width + 3, y + 34, x + width + 15, y + 34, C.muted, 2);
      x += width + 18;
    });
    return result;
  };
  const dynasties = wrap('hu1-3', '朝代顺序同时包含先后和并立', '按三排顺序接着读：夏、商、周、秦、汉；三国、西晋、东晋与十六国、南北朝、隋、唐；五代十国、宋与辽西夏金等政权先后并立、元、明、清。东周包括春秋和战国，汉包括西汉与东汉。框的长度不代表统治时间，并立政权不能简单排成一条互不重叠的接力线。',
    text(25, 33, '朝代骨架：先后与并立', 27, C.ink, 'font-weight="700"') + text(510, 33, '按①→②→③接着读', 20, C.muted) +
    chainRow(58, [['夏'], ['商'], ['周', '西周／东周'], ['秦'], ['汉', '西汉／东汉']], [130, 130, 140, 130, 130], '①') +
    chainRow(151, [['三国', '魏蜀吴并立'], ['西晋'], ['东晋', '与十六国'], ['南北朝', '南北并立'], ['隋'], ['唐']], [105, 105, 115, 115, 95, 95], '②') +
    chainRow(244, [['五代十国'], ['宋与辽夏金等', '并立关系随时期变化'], ['元'], ['明'], ['清']], [143, 225, 98, 98, 98], '③') +
    text(25, 350, '东周包括春秋、战国；“并立”表示不同政权同时存在。', 22, C.green) +
    text(25, 384, '记忆结构示意；框长不代表时间长短，也不表示疆域。', 20, C.muted), 405);

  const evidence = wrap('hu2-1', '神话、传说与证据之间的边界', '神话含有神奇的想象，可以研究古人的观念；传说是代代流传的叙事，人物、年代、事件细节仍需核实；文献、文物、遗址要核对来源、年代和语境后交叉研究。神话传说本身可以成为研究材料，但不能把发现洪水遗迹等同于证实大禹故事全部真实。',
    text(25, 33, '故事能提出问题，证据才能支持具体判断', 27, C.ink, 'font-weight="700"') +
    box(25, 60, 235, 188, C.warmSoft) + box(282, 60, 235, 188, C.soft) + box(539, 60, 236, 188, C.blueSoft) +
    center(142, 101, '神话', 28, C.warm, 'font-weight="750"') + center(142, 143, '如：盘古开天地', 22) + center(142, 186, '含有神奇想象', 22) + center(142, 224, '可研究古人的观念', 21, C.muted) +
    center(399, 101, '传说', 28, C.green, 'font-weight="750"') + center(399, 143, '如：大禹治水叙事', 22) + center(399, 186, '代代流传的故事', 22) + center(399, 224, '人物、细节仍需核实', 21, C.muted) +
    center(657, 101, '史料研究', 28, C.blue, 'font-weight="750"') + center(657, 143, '文献、文物、遗址', 22) + center(657, 186, '核对来源与年代', 22) + center(657, 224, '联系语境，交叉研究', 21, C.muted) +
    text(25, 291, '发现洪水遗迹 ≠ 证实某位传说人物与故事的全部细节。', 23, C.green, 'font-weight="650"') +
    text(25, 335, '故事也可作为研究材料，但“材料存在”不等于“情节已获证实”。', 21) +
    text(25, 371, '分类关系示意，不把神话、传说与已经验证的历史事件画等号。', 20, C.muted), 390);

  const enfeoffment = wrap('hu3-4', '西周分封：受封的权利与对周王的义务', '周王分封宗亲、功臣等，使其建立诸侯国，授予土地与人口的统治权。诸侯对周王承担守疆、从征、朝觐和纳贡等义务。图为关系示意，不能把西周诸侯国当作秦代由中央任免官员治理的郡县。',
    text(25, 33, '西周分封：权利与义务相联系', 28, C.ink, 'font-weight="700"') +
    box(60, 120, 170, 85, C.warmSoft) + box(570, 120, 170, 85, C.soft) +
    center(145, 174, '周王', 32, C.warm, 'font-weight="750"') + center(655, 174, '诸侯', 32, C.green, 'font-weight="750"') +
    center(400, 96, '授予土地、人口的统治权', 24, C.green, 'font-weight="650"') + arrow(244, 145, 555, 145, C.green, 4) +
    `<path d="M570 186H541V236H258V186H244" fill="none" stroke="${C.blue}" stroke-width="3"/>` + arrow(258, 186, 244, 186, C.blue, 3) +
    center(400, 278, '守疆、从征、朝觐、纳贡等', 24, C.blue, 'font-weight="650"') +
    center(655, 101, '宗亲、功臣等受封', 20, C.muted) +
    text(25, 330, '关系示意：诸侯在封国内统治，对周王承担相应义务。', 22) +
    text(25, 368, '这不是秦代郡县制，也不是现代行政层级图。', 20, C.muted), 390);

  const dujiangyan = wrap('hu4-3', '都江堰鱼嘴、飞沙堰、宝瓶口的协作', '鱼嘴把岷江分成内江、外江；内江引水，外江分泄江水。飞沙堰为内江提供侧向溢洪排沙通道，多余水沙可以排入外江。宝瓶口是进入灌区的狭窄进水口，控制入灌区水量。这里仅画功能关系，三者共同发挥作用，不是实际河道位置或工程比例图。',
    text(25, 33, '都江堰：三个部件共同分水、排沙、引水', 27, C.ink, 'font-weight="700"') +
    `<path d="M40 160H215Q310 82 746 82" fill="none" stroke="#abcdd4" stroke-width="30" stroke-linecap="round"/><path d="M215 160Q300 247 535 247H745" fill="none" stroke="#8fbec7" stroke-width="30" stroke-linecap="round"/>` +
    arrow(44, 160, 165, 160, C.blue, 5) + arrow(640, 82, 743, 82, C.blue, 5) + arrow(640, 247, 744, 247, C.blue, 5) +
    `<path d="M210 160L256 140 256 182Z" fill="#b3bd95" stroke="#71865e" stroke-width="3"/>` +
    `<path d="M486 236Q503 163 486 96" fill="none" stroke="${C.blue}" stroke-width="6" stroke-dasharray="8 6"/>` + arrow(490, 115, 486, 96, C.blue, 5) +
    `<path d="M574 218V237M574 257V276M598 218V237M598 257V276" stroke="#8a8d71" stroke-width="12" stroke-linecap="round"/>` +
    text(31, 130, '岷江来水', 22, C.blue) + text(557, 64, '外江', 24, C.blue, 'font-weight="700"') + text(338, 222, '内江', 24, C.blue, 'font-weight="700"') +
    center(244, 120, '鱼嘴', 24, C.green, 'font-weight="700"') + center(402, 177, '飞沙堰', 24, C.blue, 'font-weight="700"') + `<path d="M447 174H480" stroke="${C.blue}" stroke-width="2"/>` + center(590, 290, '宝瓶口', 24, C.warm, 'font-weight="700"') + text(493, 160, '侧向排出', 20, C.blue) + text(493, 190, '多余水沙', 20, C.blue) + text(670, 286, '流向灌区', 22, C.blue) +
    box(25, 305, 235, 77, C.soft) + box(282, 305, 235, 77, C.blueSoft) + box(539, 305, 236, 77, C.warmSoft) +
    center(142, 337, '鱼嘴', 25, C.green, 'font-weight="750"') + center(142, 368, '分内江、外江', 22) +
    center(399, 337, '飞沙堰', 25, C.blue, 'font-weight="750"') + center(399, 368, '侧向溢洪、排沙', 22) +
    center(657, 337, '宝瓶口', 25, C.warm, 'font-weight="750"') + center(657, 368, '控制入灌区水量', 22) +
    text(25, 420, '功能关系示意；河道位置、宽度及距离不按实际比例。', 20, C.muted), 440);

  const counties = wrap('hu5-1', '秦代中央与郡县的管理关系', '秦统一后在全国推行郡县制。皇帝与中央通过官僚体系管理地方，郡下辖县，郡县长官由朝廷任免，不按西周式诸侯封国的王位世袭。图中只示例两郡四县，省略其他机构，不能把数量或名称当作实际政区。',
    text(25, 33, '秦推行郡县制：由中央管理地方', 28, C.ink, 'font-weight="700"') +
    box(25, 132, 205, 93, C.warmSoft) + center(127, 171, '皇帝与中央', 27, C.warm, 'font-weight="750"') + center(127, 207, '制定、传达政令', 20) +
    box(335, 84, 120, 68, C.soft) + center(395, 128, '郡', 28, C.green, 'font-weight="750"') + box(335, 224, 120, 68, C.soft) + center(395, 268, '郡', 28, C.green, 'font-weight="750"') +
    [55, 130, 235, 310].map(y => box(610, y, 160, 56, C.blueSoft) + center(690, y + 37, '县', 26, C.blue, 'font-weight="700"')).join('') +
    `<path d="M230 178H282V118H322M282 178V258H322M455 118H520V83H597M520 118V158H597M455 258H520V263H597M520 263V338H597" fill="none" stroke="${C.green}" stroke-width="3"/>` +
    arrow(322, 118, 332, 118, C.green, 3) + arrow(322, 258, 332, 258, C.green, 3) + [83, 158, 263, 338].map(y => arrow(597, y, 607, y, C.green, 3)).join('') +
    text(35, 279, '官员由朝廷任免', 23, C.green, 'font-weight="650"') + text(35, 313, '不是封国王位世袭', 22) +
    text(25, 402, '管理关系示意；仅示例若干郡县，省略其他机构，不表示真实数量。', 20, C.muted), 422);

  const kingdomScale = year => 100 + (year - 220) * 10;
  const kingdoms = wrap('hu6-1', '魏蜀吴称帝、政权并立与西晋统一', '此图采用称帝纪年：220年曹丕称帝建立魏，221年刘备称帝建立蜀汉，229年孙权称帝。吴在222年已改元黄武，资料可能从此起算。263年魏灭蜀，265年司马炎代魏建晋，280年西晋灭吴，完成统一。时间条采用同一线性刻度，不表示疆域或国力。',
    text(25, 33, '三国并立 → 西晋统一（采用称帝纪年）', 27, C.ink, 'font-weight="700"') +
    `<path d="M100 73H700" stroke="${C.line}" stroke-width="3"/>` +
    [220, 230, 240, 250, 260, 270, 280].map(year => `<path d="M${kingdomScale(year)} 67v12" stroke="${C.muted}" stroke-width="2"/>` + center(kingdomScale(year), 101, year, 20, C.muted)).join('') +
    box(100, 117, 450, 48, C.soft, 9) + text(120, 149, '魏：220年曹丕称帝', 23, C.green, 'font-weight="650"') + box(550, 117, 150, 48, C.warmSoft, 9) + center(625, 149, '西晋', 24, C.warm, 'font-weight="700"') +
    box(110, 190, 420, 48, C.blueSoft, 9) + text(130, 222, '蜀汉：221年刘备称帝', 23, C.blue, 'font-weight="650"') + text(546, 222, '263年魏灭蜀', 21, C.muted) +
    box(190, 263, 510, 48, C.soft, 9) + text(210, 295, '吴：229年孙权称帝', 23, C.green, 'font-weight="650"') +
    text(25, 348, '265年司马炎代魏建晋；280年西晋灭吴，完成统一。', 23, C.warm, 'font-weight="650"') +
    text(25, 386, '吴在222年改元黄武、229年称帝；阅读资料要先看起算口径。', 20) +
    text(25, 420, '时间条按同一刻度；不表示疆域、实力，也未列出全部地方政权。', 20, C.muted), 440);

  const canals = wrap('hu7-1', '隋代运河的四段联系，与今天京杭运河不同', '隋代运河系统以洛阳为中心，北通涿郡、南达余杭。主要联结关系为永济渠、通济渠、邗沟、江南河，利用天然河道和既有渠道，不是全由隋朝从零开挖。后世多次改线疏浚，今天京杭运河的线路不等于隋代原样。本图只画水系与渠道联系，不表示实际地理位置或长度。',
    text(25, 33, '隋代运河：四段联系南北', 28, C.ink, 'font-weight="700"') +
    `<path d="M80 83V323" fill="none" stroke="#a0c6cc" stroke-width="10" stroke-linecap="round"/>` +
    [83, 143, 203, 263, 323].map(y => `<circle cx="80" cy="${y}" r="8" fill="#fffefa" stroke="${C.blue}" stroke-width="3"/>`).join('') +
    text(104, 91, '涿郡', 25, C.blue, 'font-weight="700"') + text(104, 151, '黄河—洛阳联系枢纽', 22, C.green, 'font-weight="650"') + text(104, 211, '淮河', 24) + text(104, 271, '长江', 24) + text(104, 331, '余杭', 25, C.blue, 'font-weight="700"') +
    text(245, 121, '永济渠', 22, C.blue) + text(245, 181, '通济渠', 22, C.blue) + text(245, 241, '邗沟', 22, C.blue) + text(245, 301, '江南河', 22, C.blue) +
    box(435, 65, 340, 285, C.soft) + text(456, 102, '并非原样保留的一条河', 25, C.green, 'font-weight="700"') +
    text(456, 149, '隋：以洛阳为系统中心', 22) + text(456, 194, '后世：多次改线、疏浚', 22) + text(456, 239, '涿郡约当今北京地区', 22) + text(456, 284, '余杭在今杭州一带', 22) + text(456, 326, '旧渠、天然河道也被利用', 21, C.muted) +
    text(25, 386, '水系联结示意，不是地图；渠道位置、走向与段长不按比例。', 20, C.muted), 407);

  const technologyRows = [
    ['造纸术', '西汉已有植物纤维纸', '东汉蔡伦改进工艺与原料'],
    ['印刷术', '雕版：整版刻字印刷', '北宋毕昇发明泥活字'],
    ['指南针', '认识、利用磁石指向性', '宋代磁针用于航海'],
    ['火药', '炼丹实践中积累相关知识', '唐宋火药武器逐步发展'],
  ];
  const inventions = wrap('hu8-1', '四大发明经过长期演进，并非全在宋代诞生', '四项技术经历不同的积累与改进：西汉已有植物纤维纸，东汉蔡伦改进工艺与原料；先有雕版印刷，北宋毕昇发明泥活字；人们利用磁石指向性，宋代磁针应用于航海；火药知识与炼丹实践有关，唐宋时期火药武器逐步发展。箭头表示各技术内部演进，不代表四行同时发生。',
    text(25, 33, '四大发明是长期演进，不能全算到一个朝代', 27, C.ink, 'font-weight="700"') +
    technologyRows.map((row, index) => {
      const y = 61 + index * 78;
      return box(25, y, 95, 59, index % 2 ? C.warmSoft : C.soft) + center(72, y + 39, row[0], 25, index % 2 ? C.warm : C.green, 'font-weight="700"') +
        box(138, y, 278, 59, '#eef3e9') + center(277, y + 38, row[1], 22) + arrow(426, y + 29, 461, y + 29, C.green, 3) +
        box(477, y, 298, 59, C.blueSoft) + center(626, y + 38, row[2], 22, C.blue, 'font-weight="650"');
    }).join('') +
    text(25, 414, '各行是技术演进关系示意，不代表同时发生；对外传播也经历长期过程。', 20, C.muted), 435);

  window.HISTORY_DIAGRAMS = Object.freeze({
    'hu1-2': years,
    'hu1-3': dynasties,
    'hu2-1': evidence,
    'hu3-4': enfeoffment,
    'hu4-3': dujiangyan,
    'hu5-1': counties,
    'hu6-1': kingdoms,
    'hu7-1': canals,
    'hu8-1': inventions,
  });
})();

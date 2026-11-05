/*
 * Source-backed teaching diagrams. No DOM writes, remote assets, scripts or event attributes.
 * Each property is a self-contained SVG string, ready to insert beside its knowledge point.
 * Sources used for the facts that need a convention or an approximate range:
 * - Hong Kong EDB, three landform steps:
 *   https://www.edb.gov.hk/attachment/sc/curriculum-development/kla/pshe/national-geography/national-geography-resource-portal/Infosheets/Info_Sheet_02-relief-chi.pdf
 * - Hong Kong Observatory, weather and climate:
 *   https://www.weather.gov.hk/sc/climate_change/faq/faq011.htm
 * - NDRC, Yangtze River:
 *   https://cjjjd.ndrc.gov.cn/zoujinchangjiang/jingjishehuifazhan/201907/t20190713_941469.htm
 * - State Council, Yellow River basin plan:
 *   https://www.mee.gov.cn/zcwj/zyygwj/202110/t20211009_955779.shtml
 * - Sandia National Laboratories, solar time and longitude:
 *   https://pvpmc.sandia.gov/modeling-guide/1-weather-design-inputs/sun-position/basic-solar-position-models/
 */
(() => {
  'use strict';
  const C = { ink: '#233e37', muted: '#586b62', green: '#22634c', soft: '#e8f1df', paper: '#f7faf5', blue: '#2d7886', blueSoft: '#e4f0f2', line: '#cfddc9', warm: '#986332' };
  const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const text = (x, y, value, size = 22, fill = C.ink, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${esc(value)}</text>`;
  const center = (x, y, value, size = 22, fill = C.ink, extra = '') => text(x, y, value, size, fill, `text-anchor="middle" ${extra}`);
  const box = (x, y, w, h, fill = C.soft, rx = 16) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
  const arrow = (x1, y1, x2, y2, color = C.blue, width = 3) => {
    const angle = Math.atan2(y2 - y1, x2 - x1), len = 10;
    const ax = x2 - len * Math.cos(angle - .5), ay = y2 - len * Math.sin(angle - .5);
    const bx = x2 - len * Math.cos(angle + .5), by = y2 - len * Math.sin(angle + .5);
    return `<path d="M${x1} ${y1}L${x2} ${y2}M${ax.toFixed(1)} ${ay.toFixed(1)}L${x2} ${y2}L${bx.toFixed(1)} ${by.toFixed(1)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  };
  const wrap = (key, title, description, body, height = 340) => {
    const id = `geo-diagram-${key}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 ${height}" width="800" height="${height}" role="img" aria-labelledby="${id}-title ${id}-desc" style="display:block;width:100%;height:auto;background:${C.paper}"><title id="${id}-title">${esc(title)}</title><desc id="${id}-desc">${esc(description)}</desc><g font-family="PingFang SC, Microsoft YaHei, Noto Sans CJK SC, system-ui, sans-serif" font-size="22" fill="${C.ink}" stroke-linejoin="round">${body}</g></svg>`;
  };

  // An orthographic graticule viewed from 20°N, centered on the 0° meridian.
  // Visibility is computed in 3D so the dashed curves really are behind the globe.
  const globe = (() => {
    const cx = 205, cy = 175, radius = 112, beta = 20 * Math.PI / 180;
    const project = (latitude, longitude) => {
      const p = latitude * Math.PI / 180, l = longitude * Math.PI / 180;
      const xx = Math.cos(p) * Math.sin(l), yy = Math.sin(p), zz = Math.cos(p) * Math.cos(l);
      return { x: cx + radius * xx, y: cy - radius * (yy * Math.cos(beta) - zz * Math.sin(beta)), front: yy * Math.sin(beta) + zz * Math.cos(beta) >= 0 };
    };
    const curve = (points, visible) => {
      let path = '', drawing = false;
      points.forEach(point => {
        if (point.front !== visible) { drawing = false; return; }
        path += `${drawing ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
        drawing = true;
      });
      return path;
    };
    const longitude = value => Array.from({ length: 61 }, (_, i) => project(-90 + i * 3, value));
    const latitude = value => Array.from({ length: 73 }, (_, i) => project(value, -180 + i * 5));
    const lines = [
      ...[-60, -30, 30, 60].map(value => ({ points: latitude(value), color: '#84aaa2', width: 1.6 })),
      ...[-120, -60, 60, 120].map(value => ({ points: longitude(value), color: '#84aaa2', width: 1.6 })),
      { points: latitude(0), color: C.blue, width: 3.5 },
      { points: longitude(0), color: C.green, width: 3.5 },
    ];
    const grid = [false, true].map(visible => lines.map(line => `<path d="${curve(line.points, visible)}" fill="none" stroke="${line.color}" stroke-width="${visible ? line.width : 1.5}" ${visible ? '' : 'stroke-dasharray="4 5" opacity=".55"'}/>`).join('')).join('');
    return wrap('gu1-3', '地球仪上的经纬网', '经纬线是人为假想的定位网。蓝色赤道为零度纬线，绿色本初子午线为零度经线；纬线指示东西，经线指示南北。北纬、南纬从赤道向两极量到90度，东经、西经从本初子午线各量到180度。实线在球体前侧，虚线在后侧。',
      `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${C.blueSoft}" stroke="#7fa69d" stroke-width="2"/>${grid}` +
      `<circle cx="205" cy="69.8" r="4" fill="${C.green}"/><circle cx="205" cy="280.2" r="4" fill="${C.green}"/>` +
      center(205, 43, '北极', 22, C.green) + center(205, 315, '南极', 22, C.green) +
      text(20, 90, '0°经线', 20, C.green) + `<path d="M112 85H180L205 114" fill="none" stroke="${C.green}" stroke-width="2"/>` +
      text(20, 257, '赤道', 22, C.blue) + `<path d="M77 251L107 239L133 204" fill="none" stroke="${C.blue}" stroke-width="2"/>` +
      text(355, 45, '人为假想的定位网', 27, C.ink, 'font-weight="700"') +
      box(350, 70, 425, 105, C.soft) + text(370, 103, '纬线 → 东西方向', 24, C.green, 'font-weight="700"') +
      text(370, 135, '北纬 N / 南纬 S', 22) + text(370, 164, '纬度范围：0°—90°', 20, C.muted) +
      box(350, 190, 425, 105, C.blueSoft) + text(370, 223, '经线 → 南北方向', 24, C.blue, 'font-weight="700"') +
      text(370, 255, '东经 E / 西经 W', 22) + text(370, 284, '经度范围：0°—180°', 20, C.muted) +
      text(350, 329, '0°经线叫本初子午线；赤道是0°纬线。', 20, C.muted), 350);
  })();

  const continentOrder = ['亚洲', '非洲', '北美洲', '南美洲', '南极洲', '欧洲', '大洋洲'];
  const continents = wrap('gu1-4', '七大洲的面积顺序', '按面积从大到小为亚洲、非洲、北美洲、南美洲、南极洲、欧洲、大洋洲。本图采用顺序清单，不表示各洲形状，也不把条形长度当作面积比例。',
    text(30, 34, '七大洲：按面积从大到小', 27, C.ink, 'font-weight="700"') +
    continentOrder.map((name, index) => {
      const y = 55 + index * 37;
      return box(30, y, 370, 33, index % 2 ? '#edf4e8' : '#e4eee0', 10) + center(60, y + 24, index + 1, 22, C.green, 'font-weight="700"') + text(100, y + 24, name, 23, C.ink, 'font-weight="650"');
    }).join('') +
    box(440, 55, 330, 254, C.soft) + text(465, 96, '最大：亚洲', 27, C.green, 'font-weight="700"') +
    text(465, 139, '最小：大洋洲', 27, C.blue, 'font-weight="700"') + text(465, 190, '顺口记一记', 20, C.muted) +
    text(465, 229, '亚、非、北南美，', 24) + text(465, 267, '南极、欧、大洋。', 24) +
    text(30, 338, '顺序清单，不是洲形图，也不以图形长度表示面积比例。', 20, C.muted), 355);

  const scale = wrap('gu2-3', '比例尺一比十万：图上3厘米代表实际3千米', '比例尺的分子和分母必须使用相同长度单位。一比十万表示图上1厘米对应实际100000厘米，也就是1000米或1千米。图上3厘米对应300000厘米、3000米、3千米。屏幕上的线段仅作示意，不保证能用实物尺量出3厘米。',
    text(30, 36, '比例尺 1∶100000', 28, C.green, 'font-weight="700"') + text(440, 36, '图上1厘米 → 实际1千米', 23, C.blue, 'font-weight="650"') +
    box(25, 62, 337, 166, C.soft) + box(438, 62, 337, 166, C.blueSoft) +
    center(194, 96, '图上距离：3厘米', 24, C.green, 'font-weight="700"') + center(606, 96, '实际距离：3千米', 24, C.blue, 'font-weight="700"') +
    `<path d="M65 142H320" stroke="${C.green}" stroke-width="4"/><circle cx="65" cy="142" r="6" fill="${C.green}"/><circle cx="320" cy="142" r="6" fill="${C.green}"/>` +
    [0, 1, 2, 3].map(n => `<path d="M${65 + n * 85} 170v15" stroke="${C.green}" stroke-width="2"/>` + center(65 + n * 85, 210, n, 20, C.green)).join('') +
    `<path d="M65 175H320" stroke="${C.green}" stroke-width="2"/>` +
    text(330, 211, 'cm', 20, C.green) + arrow(382, 142, 417, 142, C.muted, 3) +
    `<path d="M480 142H733" stroke="${C.blue}" stroke-width="6" stroke-dasharray="12 6"/><circle cx="480" cy="142" r="6" fill="${C.blue}"/><circle cx="733" cy="142" r="6" fill="${C.blue}"/>` +
    center(606, 201, '3千米 = 3000米', 22, C.blue) +
    text(30, 264, '3厘米 × 100000 = 300000厘米 = 3000米 = 3千米', 24, C.ink, 'font-weight="650"') +
    text(30, 303, '先统一单位：1千米 = 1000米 = 100000厘米。', 22, C.green) +
    text(30, 338, '线段为示意，屏幕上量出的长度不是题目给定的图上长度。', 20, C.muted), 355);

  const forms = [
    { name: '山地', trait: '起伏大、坡较陡', path: 'M15 145L50 88 74 117 106 70 140 145Z' },
    { name: '高原', trait: '较高，顶面较平', path: 'M15 145L38 92 115 92 140 145Z' },
    { name: '盆地', trait: '四周高、中间低', path: 'M15 145L30 85 60 133 101 133 125 85 140 145Z' },
    { name: '丘陵', trait: '起伏较和缓', path: 'M15 145Q35 102 60 135Q88 99 112 135Q126 119 140 145Z' },
    { name: '平原', trait: '较低，地表较平', path: 'M15 145L30 134 80 133 140 135V145Z' },
  ];
  const landforms = wrap('gu3-1', '五种基本地形，以及海拔和相对高度', '山地起伏大、坡较陡；高原海拔较高、顶面较平；盆地四周高而中间低；丘陵起伏较和缓；平原海拔较低、地表较平。海拔从海平面量起，相对高度是两点海拔之差。示例甲点海拔300米、乙点海拔100米，相对高度200米。',
    text(25, 32, '五种地形：先看地面起伏', 27, C.ink, 'font-weight="700"') +
    forms.map((form, index) => `<g transform="translate(${index * 156 + 8} 0)">${center(78, 65, form.name, 24, C.green, 'font-weight="700"')}<path d="${form.path}" fill="${index % 2 ? '#c3d7b6' : '#aac69c'}" stroke="#678b63" stroke-width="2"/>${center(78, 174, form.trait, 20, C.muted)}</g>`).join('') +
    `<path d="M25 192H775" stroke="${C.line}" stroke-width="2"/>` +
    `<path d="M40 319L140 229 300 289 410 319Z" fill="#dfe9d5" stroke="#7b9c70" stroke-width="2"/><path d="M35 319H445" stroke="${C.blue}" stroke-width="2"/>` +
    `<path d="M140 229V319M300 289V319" stroke="${C.blue}" stroke-width="2" stroke-dasharray="5 4"/><circle cx="140" cy="229" r="5" fill="${C.green}"/><circle cx="300" cy="289" r="5" fill="${C.green}"/>` +
    center(140, 216, '甲：300米', 20, C.green) + center(310, 277, '乙：100米', 20, C.green) + text(35, 344, '海平面（0米）', 20, C.blue) +
    text(475, 230, '海拔：从海平面量起', 22, C.green, 'font-weight="650"') +
    text(475, 269, '相对高度：两点海拔之差', 22) +
    text(475, 307, '300米 − 100米 = 200米', 22, C.blue, 'font-weight="650"') +
    text(475, 344, '教学剖面，形状和高度为示意。', 20, C.muted), 365);

  const stairs = wrap('gu3-2', '中国地势西高东低，呈三级阶梯', '这是一幅由西向东的概念剖面，不是疆界图，也不表示真实比例。第一级阶梯以青藏高原为代表，平均海拔4000米以上；第二级阶梯海拔多在1000至2000米，以黄土高原、内蒙古高原等为代表；第三级阶梯海拔多在500米以下，以东北平原等东部平原和丘陵为代表。这些范围是总体概括，各地仍有差异。',
    text(30, 34, '西部较高', 26, C.green, 'font-weight="700"') + arrow(195, 26, 605, 26, C.green, 3) + text(638, 34, '东部较低', 26, C.blue, 'font-weight="700"') +
    `<path d="M35 178H218L254 227H472L512 275H725V316H35Z" fill="#d6e3c8" stroke="#6f8f60" stroke-width="3"/><path d="M725 294q18-10 36 0t27 0v22H725Z" fill="#b7d5dc"/>` +
    center(135, 74, '第一级阶梯', 25, C.green, 'font-weight="700"') + center(135, 105, '平均海拔', 20, C.muted) + center(135, 136, '4000米以上', 25, C.green) + center(135, 165, '青藏高原', 22) +
    center(373, 119, '第二级阶梯', 25, C.green, 'font-weight="700"') + center(373, 150, '海拔多为', 20, C.muted) + center(373, 181, '1000—2000米', 25, C.green) + center(373, 213, '黄土高原等', 22) +
    center(628, 167, '第三级阶梯', 25, C.blue, 'font-weight="700"') + center(628, 198, '海拔多为', 20, C.muted) + center(628, 229, '500米以下', 25, C.blue) + center(628, 261, '东北平原等', 22) +
    text(30, 350, '概念剖面，非疆界图、不按比例；海拔范围是总体概括。', 20, C.muted), 370);

  const weatherClimate = wrap('gu4-1', '天气与气候的时间尺度', '天气描述一个地方瞬时或几小时到几天的大气状态。气候描述长期的平均状况和变化特征，气候标准统计通常使用30年时段。一个地方的一场雨不能代表当地气候，气候还包括变化范围和极端情况。图中的句子只是说明用的例子，没有指向具体城市。',
    text(30, 34, '天气看眼前，气候看多年', 28, C.ink, 'font-weight="700"') +
    box(25, 60, 360, 217, C.blueSoft) + box(415, 60, 360, 217, C.soft) +
    text(45, 100, '天气：短时间的状态', 26, C.blue, 'font-weight="700"') +
    text(45, 143, '小时 → 几天', 24, C.blue) + text(45, 188, '例：今天晴，下午有阵雨。', 22) + text(45, 240, '看某时、某地的阴晴冷暖。', 22, C.muted) +
    text(435, 100, '气候：长期统计特征', 26, C.green, 'font-weight="700"') +
    text(435, 143, '常用30年作为统计时段', 22, C.green) + text(435, 188, '例：某地夏季炎热多雨。', 22) + text(435, 240, '看平均状况，也看变化。', 22, C.muted) +
    text(30, 318, '一次降雨 ≠ 当地气候；气候还包括变化范围和极端情况。', 22, C.green), 340);

  const riverComparison = focus => {
    const key = focus === '长江' ? 'gu5-2' : 'gu5-3';
    const row = (name, source, mouth, length, y, color) => {
      const focused = focus === name;
      return box(18, y - 9, 764, 125, focused ? '#e6efe1' : '#eff4ec', 18) +
        text(30, y + 54, name, 27, color, 'font-weight="750"') +
        box(110, y, 200, 106, '#fffefa') + center(210, y + 29, '源头：青藏高原', 20, C.muted) + center(210, y + 72, source, 24, color, 'font-weight="650"') +
        center(460, y + 28, '干流总体自西向东', 20, C.muted) + arrow(331, y + 55, 584, y + 55, color, 7) + center(460, y + 94, `约${length}千米`, 23, color, 'font-weight="650"') +
        box(612, y, 158, 106, '#fffefa') + center(691, y + 29, '注入', 20, C.muted) + center(691, y + 73, mouth, 29, color, 'font-weight="750"');
    };
    return wrap(key, '长江与黄河的源头、干流和入海口对比', '长江发源于青藏高原唐古拉山脉，干流长度约6300千米，总体自西向东注入东海。黄河发源于青藏高原巴颜喀拉山脉，长度约5464千米，总体向东注入渤海。本图是信息流程，不表示真实河道形状、流向细节或疆界。',
      text(25, 33, '长江、黄河：源头 → 干流 → 入海口', 27, C.ink, 'font-weight="700"') +
      row('长江', '唐古拉山脉', '东海', 6300, 61, C.blue) + row('黄河', '巴颜喀拉山脉', '渤海', 5464, 204, '#886a36') +
      text(25, 352, '信息流程示意，不是真实河道图；河流长度采用通行约数。', 20, C.muted), 373);
  };

  const clock = (cx, hour) => {
    const cy = 183, a = hour * Math.PI / 6 - Math.PI / 2;
    return `<circle cx="${cx}" cy="${cy}" r="45" fill="#fffefa" stroke="${C.blue}" stroke-width="3"/><path d="M${cx} ${cy}V${cy - 32}M${cx} ${cy}L${(cx + Math.cos(a) * 24).toFixed(1)} ${(cy + Math.sin(a) * 24).toFixed(1)}" stroke="${C.green}" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="4" fill="${C.green}"/>`;
  };
  const localTime = wrap('gu7-3', '经度每差15度，地方太阳时相差1小时', '把一天按24小时计算，360度除以24等于每小时15度。同一时刻，越向东地方太阳时数值越大。本例零度经线为10点，东经15度为11点，东经30度为12点。这里比较的是地方太阳时，不能直接当作国家或地区的法定时区。',
    text(30, 34, '同一时刻：经度差15°，地方太阳时差1小时', 26, C.ink, 'font-weight="700"') +
    text(30, 74, '360° ÷ 24小时 = 15°/小时；地球自西向东自转。', 22, C.green) +
    [150, 400, 650].map((cx, i) => box(cx - 80, 92, 160, 175, i % 2 ? C.soft : C.blueSoft) + center(cx, 123, i === 0 ? '0°经线' : `东经${i * 15}°`, 23, C.blue, 'font-weight="650"') + clock(cx, i + 10) + center(cx, 258, `${i + 10}:00`, 26, C.green, 'font-weight="750"')).join('') +
    center(275, 155, '差15°', 20, C.muted) + center(275, 194, '+1小时', 21, C.green) + arrow(243, 218, 307, 218, C.green, 3) +
    center(525, 155, '差15°', 20, C.muted) + center(525, 194, '+1小时', 21, C.green) + arrow(493, 218, 557, 218, C.green, 3) +
    text(30, 308, '往东加，往西减；这里比较的是地方太阳时。', 23, C.green, 'font-weight="650"') +
    text(30, 344, '国家和地区采用的法定时间、时区，不一定与此完全相同。', 20, C.muted), 365);

  window.GEO_DIAGRAMS = Object.freeze({
    'gu1-3': globe,
    'gu1-4': continents,
    'gu2-3': scale,
    'gu3-1': landforms,
    'gu3-2': stairs,
    'gu4-1': weatherClimate,
    'gu5-2': riverComparison('长江'),
    'gu5-3': riverComparison('黄河'),
    'gu7-3': localTime,
  });
})();

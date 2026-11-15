/* 地球仪学习任务；地点正文始终引用 world-data.js 的稳定 ID。 */
window.GM_WORLD_LEARNING = {
  lines: [
    {id: 'equator', name: '赤道', axis: 'latitude', value: 0, point: [20, 0], color: '#ffdf73', text: '赤道是 0° 纬线，把地球分为北半球和南半球。它是最长的一条纬线。', observe: '沿金色线转一圈，找找非洲、南美洲和亚洲的岛屿。'},
    {id: 'cancer', name: '北回归线', axis: 'latitude', value: 23.5, point: [105, 23.5], color: '#b04723', text: '北回归线约在北纬 23.5°，是热带的北边界。太阳能够直射的最北位置就在这附近。', observe: '转到中国南部，看看这条线从哪里经过。'},
    {id: 'capricorn', name: '南回归线', axis: 'latitude', value: -23.5, point: [135, -23.5], color: '#b04723', text: '南回归线约在南纬 23.5°，是热带的南边界。它与北回归线分居赤道两侧。', observe: '找找澳大利亚、非洲和南美洲，哪些大陆被它穿过？'},
    {id: 'arctic', name: '北极圈', axis: 'latitude', value: 66.5, point: [0, 72], color: '#405ba1', text: '北极圈约在北纬 66.5°。从这里再往北，进入北寒带，那里能观察到极昼和极夜。', observe: '把地球转向北极，看看圈内的海洋和陆地。'},
    {id: 'antarctic', name: '南极圈', axis: 'latitude', value: -66.5, point: [0, -78], color: '#405ba1', text: '南极圈约在南纬 66.5°。从这里再往南，进入南寒带，大部分南极大陆就在里面。', observe: '对照北极圈，哪个圈里有一整块大陆？'},
    {id: 'prime', name: '本初子午线', axis: 'longitude', value: 0, point: [0, 25], color: '#774098', text: '本初子午线是 0° 经线，是计算东经、西经的起点。从北极到南极，它是一条半圆。', observe: '找到英国，再向南看非洲。注意：0° 经线不是通常划分东西半球的分界线。'}
  ],
  zones: [
    {id: 'south-polar', name: '南寒带', min: -90, max: -66.5, color: '#c6daef', text: '南极圈以南，有极昼、极夜现象。'},
    {id: 'south-temperate', name: '南温带', min: -66.5, max: -23.5, color: '#a9d4b2', text: '南回归线和南极圈之间，没有太阳直射，也没有极昼、极夜。'},
    {id: 'tropical', name: '热带', min: -23.5, max: 23.5, color: '#f1b96d', text: '南北回归线之间，一年中有机会见到太阳直射。'},
    {id: 'north-temperate', name: '北温带', min: 23.5, max: 66.5, color: '#a9d4b2', text: '北回归线和北极圈之间，没有太阳直射，也没有极昼、极夜。'},
    {id: 'north-polar', name: '北寒带', min: 66.5, max: 90, color: '#c6daef', text: '北极圈以北，有极昼、极夜现象。'}
  ],
  zoneNote: '地球五带按获得太阳热量的纬度差异划分，这里用约 23.5° 和 66.5° 示意边界。实际冷暖还受海拔、海陆位置等影响，同一带里也会有不同的天气与景观；色带不是当天的气温图。',
  tours: [
    {id: 'ocean-trip', name: '从中国去看海', intro: '沿海洋寻找大陆之间的位置关系。每次点下一站，自己掌握探索节奏。', stops: [
      {id: 'china', place: 'China', title: '从亚洲东部出发', text: '先找到中国，看看中国东边的大片蓝色。读完地点档案，再沿着海洋去下一站。', observe: '中国位于哪个大洲？东边靠着哪个大洋？'},
      {id: 'pacific', place: 'o1', title: '转到地球的蓝色一面', text: '面向太平洋时，地球仪上能看到很大一片海洋。转一转，找它两侧的大陆。', observe: '亚洲和美洲之间隔着哪片大洋？'},
      {id: 'mexico', place: 'Mexico', title: '来到北美洲', text: '在北美洲南部找到墨西哥，再沿陆地向北看看美国和加拿大。', observe: '这三个国家从北到南怎样排列？'},
      {id: 'atlantic', place: 'o2', title: '穿过狭长的大洋', text: '来到大西洋中部。转动地球，对照西边的美洲和东边的欧洲、非洲。', observe: '大西洋的形状更像圆盘，还是狭长的水道？'},
      {id: 'indian', place: 'o3', title: '在亚洲南边会合', text: '最后来到印度洋。把亚洲、非洲和澳大利亚都找出来，看看这片海被哪些陆地围着。', observe: '印度洋的大部分在赤道哪一侧？'}
    ]},
    {id: 'latitude-trip', name: '从赤道走向两极', intro: '沿着重要纬线，认识热带、温带和寒带。', stops: [
      {id: 'equator', place: 'Brazil', line: 'equator', title: '赤道附近看南美', text: '打开赤道线，对照巴西北部。赤道把地球分成两半，却不把每一块大陆平分。', observe: '南美洲的大部分陆地在北半球还是南半球？'},
      {id: 'north-tropic', place: 'China', line: 'cancer', title: '到热带的北边界', text: '沿北回归线找到中国南部，再转到非洲。看看同一条纬线能经过多少地方。', observe: '北回归线位于赤道的哪一边？'},
      {id: 'arctic', place: 'o4', line: 'arctic', title: '北极附近是海洋', text: '在北极圈里找北冰洋，也看看周围的陆地。这里的海水上会结冰，海冰下面仍然是海洋。', observe: '北极点附近主要是海洋还是大陆？'},
      {id: 'south-tropic', place: 'Australia', line: 'capricorn', title: '到南半球找对应纬线', text: '沿南回归线找到澳大利亚。它和北回归线到赤道的纬度差一样。', observe: '南北回归线之间是哪一个热量带？'},
      {id: 'antarctic', place: 'Antarctica', line: 'antarctic', title: '南极附近是大陆', text: '从南极上方看这块冰雪大陆，再回想北冰洋。两极都很冷，陆地与海洋的样子却不同。', observe: '南极洲主要位于哪一个热量带？'}
    ]},
    {id: 'landmark-trip', name: '世界地标观察员', intro: '用五处地标认识高山、大河、沙漠和海洋。详细资料沿用地点档案。', stops: [
      {id: 'everest', place: 'wf1', title: '在亚洲找最高的山峰', text: '找到珠穆朗玛峰，看看它附近的青藏高原。地球仪上颜色表示大洲，实际海拔要读档案。', observe: '最高的山峰一定画得最大吗？'},
      {id: 'nile', place: 'wf2', title: '跟着大河向北看', text: '找到尼罗河，对照非洲东北部的海岸。沿着图上的示意河线，看看它通向哪里。', observe: '尼罗河大致向北流，还是向南流？'},
      {id: 'sahara', place: 'wf4', title: '在非洲北部找热沙漠', text: '转到撒哈拉，看看它与赤道的位置关系。地球仪没有画出每一片沙丘，可先用位置认识这片大区域。', observe: '撒哈拉在赤道以北还是以南？'},
      {id: 'amazon', place: 'wf3', title: '到南美洲找大河', text: '对照亚马孙河和赤道，看看河流穿过的大陆，再找东边的大西洋。', observe: '亚马孙河最终流入哪个大洋？'},
      {id: 'reef', place: 'wf7', title: '到海里看珊瑚礁', text: '最后找到澳大利亚东北海上的大堡礁。地标可以在陆地上，也可以在海洋里。', observe: '大堡礁在澳大利亚的哪一侧？'}
    ]}
  ],
  questions: [
    {id: 'china-continent', place: 'China', prompt: '中国位于哪个大洲？', options: ['欧洲', '亚洲', '南美洲'], answer: 1, hint: '找找中国所在的黄色大陆。', explanation: '中国位于亚洲东部，东面靠近太平洋。'},
    {id: 'pacific-between', place: 'o1', prompt: '亚洲与美洲之间主要隔着哪个大洋？', options: ['太平洋', '印度洋', '北冰洋'], answer: 0, hint: '转到地球的大片蓝色一面。', explanation: '太平洋位于亚洲、大洋洲与美洲之间。'},
    {id: 'equator-halves', place: 'Brazil', line: 'equator', prompt: '赤道把地球分成哪两半？', options: ['东西半球', '陆地和海洋', '南北半球'], answer: 2, hint: '赤道是 0° 纬线。', explanation: '赤道以北是北半球，以南是南半球。'},
    {id: 'south-america', place: 'Brazil', line: 'equator', prompt: '南美洲的大部分陆地在哪一半球？', options: ['北半球', '南半球', '两半球各占一半'], answer: 1, hint: '看看赤道穿过南美洲的北部还是中部。', explanation: '赤道穿过南美洲北部，大部分陆地在南半球。'},
    {id: 'north-pole', place: 'o4', prompt: '北极点附近主要是什么？', options: ['海洋', '沙漠', '一整块大陆'], answer: 0, hint: '四大洋里，谁的名字带着「北」？', explanation: '北极点在北冰洋上，海面会结冰，冰下面仍是海洋。'},
    {id: 'south-pole', place: 'Antarctica', prompt: '南极点位于哪里？', options: ['北美洲', '太平洋', '南极洲'], answer: 2, hint: '俯瞰地球最南端的冰雪大陆。', explanation: '南极点位于南极大陆上，与北极点的海洋环境不同。'},
    {id: 'tropics', place: 'Australia', line: 'capricorn', prompt: '南北回归线之间是哪一个热量带？', options: ['北寒带', '热带', '南温带'], answer: 1, hint: '观察五带图中间的橙色带。', explanation: '南北回归线之间是热带，一年中有太阳直射的机会。'},
    {id: 'prime-value', place: 'United Kingdom', line: 'prime', prompt: '本初子午线的经度是多少？', options: ['0°', '90°', '180°'], answer: 0, hint: '它是计算东经、西经的起点。', explanation: '本初子午线为 0° 经线；0° 纬线则是赤道。'},
    {id: 'nile-direction', place: 'wf2', prompt: '尼罗河大致向哪个方向流入地中海？', options: ['向东', '向南', '向北'], answer: 2, hint: '地中海在非洲北边。', explanation: '尼罗河大致由南向北流，最终流入地中海。'},
    {id: 'amazon-ocean', place: 'wf3', prompt: '亚马孙河最终流入哪个大洋？', options: ['印度洋', '大西洋', '北冰洋'], answer: 1, hint: '找南美洲东边的大洋。', explanation: '亚马孙河流经南美洲北部，向东流入大西洋。'},
    {id: 'reef-location', place: 'wf7', prompt: '大堡礁在澳大利亚的哪一侧海上？', options: ['东北侧', '西南侧', '正西侧'], answer: 0, hint: '先找澳大利亚，再看地标在它的右上方还是左下方。', explanation: '大堡礁位于澳大利亚东北侧的海洋中。'},
    {id: 'latitude-weather', place: 'wf5', prompt: '同一纬度的两个地方，气温一定相同吗？', options: ['一定相同', '只看地图颜色就知道', '不一定，还要看海拔等条件'], answer: 2, hint: '想想高山与平原。', explanation: '纬度影响太阳热量，但海拔、海陆位置等也影响冷暖。五带颜色不等于当天的气温。'},
    {id: 'day-night-rotation', place: 'China', sunStudy: 'equal-day', prompt: '许多地方每天交替经历白天和黑夜，主要是因为？', options: ['月亮挡住了太阳', '地球自转', '太阳每天熄灭一次'], answer: 1, hint: '看观察点怎样轮流来到亮面和暗面。', explanation: '地球不停自转，让许多地方轮流朝向或背向太阳，形成昼夜交替。'},
    {id: 'june-direct-sun', place: 'China', sunStudy: 'north-summer', prompt: '夏至前后，太阳直射点在哪条纬线附近？', options: ['北回归线', '南回归线', '北极圈'], answer: 0, hint: '看看黄色的太阳直射点落在赤道哪一侧。', explanation: '夏至前后，太阳直射点在北回归线附近，北半球白昼较长。'},
    {id: 'north-day-length', place: 'United Kingdom', sunStudy: 'north-summer', prompt: '北纬 45° 的地方，夏至前后和冬至前后相比，通常什么时候白昼更长？', options: ['冬至前后', '一样长', '夏至前后'], answer: 2, hint: '保持观察点不变，切换两个时节，比较白昼时长。', explanation: '北半球夏至前后的白昼较长，冬至前后的白昼较短。'},
    {id: 'polar-day-meaning', place: 'o4', sunStudy: 'polar-day', prompt: '极昼时，一个地方会出现什么现象？', options: ['一整天没有太阳升起', '一整天太阳不落到地平线以下', '全世界都是白天'], answer: 1, hint: '播放一天，看看北纬 80° 的点有没有进入暗面。', explanation: '极昼是太阳在一整天里不落到地平线以下，只会在一定时节的极地地区出现。'},
    {id: 'opposite-seasons', place: 'Antarctica', sunStudy: 'south-summer', prompt: '北半球冬至前后，南极附近更可能出现什么现象？', options: ['极夜', '每天昼夜各半', '极昼'], answer: 2, hint: '南北半球的季节相反。', explanation: '北半球冬至前后，南半球朝向太阳的一侧获得更多光照，南极附近会出现极昼。'},
    {id: 'equinox-light', place: 'Brazil', sunStudy: 'equal-day', prompt: '春分、秋分前后，大多数地方的昼夜长短怎样？', options: ['接近等长', '白昼总是 24 小时', '黑夜总是 24 小时'], answer: 0, hint: '太阳直射点在赤道附近，两半球获得的光照较均衡。', explanation: '春分、秋分前后，大多数地方昼夜接近等长；球面模型作了简化，实际日出日落还受其他因素影响。'}
  ],
  sources: [
    {name: '经纬度与重要纬线', url: 'https://education.nationalgeographic.org/resource/mapmaker-latitude-longitude/'},
    {name: '纬度和回归线', url: 'https://oceanservice.noaa.gov/facts/latitude.html'},
    {name: '纬度、热量与环境', url: 'https://www.fao.org/4/Y4351E/y4351e05.htm'},
    {name: 'NASA 地球资料：球面测距采用的平均半径', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html'},
    {name: '美国国家气象局：四季、分至点与昼夜长短', url: 'https://www.weather.gov/twc/Astronomical_Seasons'},
    {name: '美国月球与行星研究所：地轴倾斜、四季和极昼', url: 'https://www.lpi.usra.edu/education/skytellers/seasons/'},
    {name: '国家位置线索：加拿大', url: 'https://kids.nationalgeographic.com/geography/countries/article/canada'},
    {name: '国家位置线索：印度', url: 'https://kids.nationalgeographic.com/geography/countries/article/india'},
    {name: '国家位置线索：意大利', url: 'https://kids.nationalgeographic.com/geography/countries/article/italy'},
    {name: '国家位置线索：南非', url: 'https://kids.nationalgeographic.com/geography/countries/article/south-africa'}
  ]
};

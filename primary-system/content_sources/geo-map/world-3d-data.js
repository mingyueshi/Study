/* 地球仪的视角与观察任务；大洲、国家、大洋和地标档案复用 world-data.js。 */
window.GM_WORLD_3D = {
  home: [110, 22],
  continentViews: {
    asia: [95, 35], europe: [20, 52], africa: [20, 2],
    northamerica: [-105, 42], southamerica: [-60, -20], oceania: [140, -25], antarctica: [0, -89.9]
  },
  views: [
    { id: 'home', name: '从中国出发', point: [110, 22] },
    { id: 'pacific', name: '面向太平洋', point: [-155, 5] },
    { id: 'north', name: '俯瞰北极', point: [0, 89.9] },
    { id: 'south', name: '俯瞰南极', point: [0, -89.9] }
  ],
  observations: [
    { title: '中国的东边是什么？', text: '先找到中国，再把地球转向太平洋。隔着这片大洋，能找到美洲吗？', place: 'China' },
    { title: '赤道穿过哪些陆地？', text: '打开经纬网，沿着金色的赤道找一圈。看看非洲和南美洲分别在哪里。', place: 'Brazil' },
    { title: '两极长得一样吗？', text: '分别俯瞰北极和南极。北极附近主要是海洋，南极附近有一块冰雪覆盖的大陆。', place: 'Antarctica' }
  ],
  note: '这是球面教学地图，陆地轮廓经过简化；大洲分色表示洲别，地球五带表示纬度带，都不表示海拔。普通经纬网每隔 30° 画一条，金线是赤道。跨洲国家沿用平面地图的分组，四大洋采用本课程口径。地球仪展示完整南极轮廓，地形起伏经过夸大，供观察高低；坐标、测距和昼长沿用理想球面。「昼夜与四季」使用简化光照模型，供比较昼夜变化。'
};

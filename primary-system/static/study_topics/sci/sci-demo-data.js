/* 三态与电路演示的说明，交互逻辑在 sci-figures.js 与 sci-demo-motion.js。 */
'use strict';
const SCI_DEMOS = {
  states: [
    {id: 'ice', name: '冰（固态）', color: '#2f9bd6',
      note: '微粒在相对固定的位置附近振动，冰能保持自己的形状。',
      condition: '加热到熔点附近，冰会逐渐熔化成水。'},
    {id: 'water', name: '水（液态）', color: '#4d96ff',
      note: '微粒靠得较近，可以相互移动，所以水能流动。',
      condition: '水装进不同形状的容器，会随容器改变形状。'},
    {id: 'vapor', name: '水蒸气（气态）', color: '#d97745',
      note: '微粒分散开，运动范围更大。水蒸气本身是看不见的。',
      condition: '水在常温下也会蒸发成水蒸气，不必等到沸腾。'},
  ],
  stateModelNote: '小点代表水的微粒。每框只画少量代表，颜色、大小、间距和速度都是观察用的示意，不是真实比例。',
  temperatureNote: '标准大气压下，冰的熔点约为 0℃，水的沸点约为 100℃。加热和冷却按钮只切换状态示意，不是温度计。',
  circuits: [
    {id: 'series', name: '串联电路', note: '两个灯泡连在同一条路上，试着断开任意一个开关。'},
    {id: 'parallel', name: '并联电路', note: '两个灯泡分在两条支路，试着只断开其中一条。'},
    {id: 'open', name: '断路示例', note: '先断开串联电路的开关 1，再试着把它闭合。'},
  ],
  circuitStatus: {
    seriesClosed: '两个开关都闭合，整条路连通，两个灯泡都亮。',
    seriesOpen: '串联电路有一处断开，整条路不通，两个灯泡都灭。',
    parallelBoth: '两条支路都连通，两个灯泡都亮。',
    parallelOne: '一条支路断开，它的灯灭了；另一条仍连通，灯继续亮。',
    parallelNone: '两条支路都断开，两个灯泡都灭。',
  },
  circuitModelNote: '流动的小点表示外电路中从正极到负极的约定电流方向，不是电子运动实拍。速度和灯的颜色只作示意，不用于比较电流大小或灯泡亮度。',
  sources: {
    states: [{title: 'USGS：蒸发与水循环', url: 'https://www.usgs.gov/water-science-school/science/evaporation-and-water-cycle'}],
    circuit: [
      {title: 'OpenStax：串联电路', url: 'https://openstax.org/books/physics/pages/19-2-series-circuits'},
      {title: 'OpenStax：并联电路', url: 'https://openstax.org/books/physics/pages/19-3-parallel-circuits'},
    ],
  },
};
if (typeof module !== 'undefined') module.exports = SCI_DEMOS;

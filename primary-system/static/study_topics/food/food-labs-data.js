/* 食物的旅行三个实验台的数据：这餐从哪来（溯源台）、作物传播时间线地图、
   一餐营养搭配模拟器。距离与年代为概略值，营养数值按常见份量的科普口径。 */
'use strict';
const FOOD_LABS = {
  /* ---------- 这餐从哪来 ---------- */
  origin: {
    storeKey: 'food_origin_v1',
    note: '选一顿饭，点开一样食材，一步步走完它的旅行：从产地到厨房，每一站都有人在忙碌。走完别忘了回答那道小问题。',
    /* distance 为概略运距（公里），只用于「谁走得最远」的比较。 */
    meals: [
      {
        id: 'dinner', name: '家常晚餐', emoji: '🍲',
        note: '米饭＋番茄炒蛋＋清炒时蔬＋一个苹果——最普通的一餐，藏着四条旅行路线。',
        quiz: {
          q: '这餐里，哪种食材走得最远才到你碗里？',
          options: ['大米', '鸡蛋', '苹果'],
          answer: 0,
          explain: '大米从黑龙江五常南下两千多公里；鸡蛋就产在城郊，几乎没怎么旅行——同一个餐桌，旅程能差 50 倍。',
        },
        ingredients: [
          {
            id: 'rice', name: '大米', emoji: '🍚', distance: 2100,
            chain: [
              { place: '黑龙江五常 · 稻田', step: '秋天收割，稻穗脱粒晾晒' },
              { place: '粮库加工厂', step: '烘干、脱壳、碾成白米' },
              { place: '货运列车', step: '装袋封存，一路南下两千公里' },
              { place: '城市超市', step: '上架销售，跟着购物袋回家' },
              { place: '自家厨房', step: '淘米下锅，电饭煲蒸熟端上桌' },
            ],
          },
          {
            id: 'tomato', name: '番茄', emoji: '🍅', distance: 1300,
            chain: [
              { place: '山东寿光 · 蔬菜大棚', step: '清晨采摘，挑八成熟的耐运果' },
              { place: '分拣包装厂', step: '按大小分箱，贴好产地标签' },
              { place: '冷链货车', step: '恒温运输，连夜奔向北方城市' },
              { place: '菜市场 / 超市', step: '凌晨到货，一早摆上摊位' },
              { place: '自家厨房', step: '和鸡蛋一起下锅，变成番茄炒蛋' },
            ],
          },
          {
            id: 'egg', name: '鸡蛋', emoji: '🥚', distance: 40,
            chain: [
              { place: '城郊养鸡场', step: '母鸡下蛋，当天收集' },
              { place: '分拣车间', step: '清洗、照检、装托' },
              { place: '保鲜配送车', step: '短途配送，几十公里直达' },
              { place: '超市冷柜', step: '上架等你来挑' },
              { place: '自家厨房', step: '磕进碗里，和番茄成了搭档' },
            ],
          },
          {
            id: 'apple', name: '苹果', emoji: '🍎', distance: 900,
            chain: [
              { place: '陕西洛川 · 果园', step: '秋季摘果，人工挑选' },
              { place: '产地冷库', step: '打冷保鲜，休眠等发运' },
              { place: '冷链干线', step: '一路向北，保持果箱低温' },
              { place: '超市果架', step: '摆出来的时候又脆又鲜' },
              { place: '餐桌果盘', step: '洗净切开，饭后水果就位' },
            ],
          },
        ],
      },
      {
        id: 'noodle', name: '牛肉面午餐', emoji: '🍜',
        note: '一碗牛肉面：面粉、牛肉、黄瓜、香菜，谁走得远、谁就在家门口？',
        quiz: {
          q: '这餐里，哪样食材几乎没怎么旅行就上了桌？',
          options: ['牛肉', '面粉', '黄瓜'],
          answer: 2,
          explain: '黄瓜产在城郊大棚，几十公里直达；牛肉从草原冷链南下上千公里——新鲜不新鲜，看的是保鲜链，不是距离。',
        },
        ingredients: [
          {
            id: 'wheat', name: '面粉', emoji: '🌾', distance: 700,
            chain: [
              { place: '河南 · 麦田', step: '芒种时节抢收小麦' },
              { place: '磨粉厂', step: '清理麦粒，磨成雪白面粉' },
              { place: '干线运输', step: '袋装面粉运往城市' },
              { place: '面馆后厨', step: '和面醒面，拉成细条' },
              { place: '面锅', step: '一滚三大开，捞面浇汤' },
            ],
          },
          {
            id: 'beef', name: '牛肉', emoji: '🥩', distance: 1100,
            chain: [
              { place: '内蒙古 · 草原牧场', step: '肉牛出栏，检疫合格' },
              { place: '屠宰分割厂', step: '分割装盒，快速冷冻' },
              { place: '冷链专列', step: '零下恒温，一路南下' },
              { place: '面馆冰柜', step: '到店分装，按需取用' },
              { place: '炖锅', step: '慢火炖烂，牛肉汤底就成了' },
            ],
          },
          {
            id: 'cucumber', name: '黄瓜', emoji: '🥒', distance: 60,
            chain: [
              { place: '城郊 · 菜农大棚', step: '清晨带露采摘' },
              { place: '批发早市', step: '当天凌晨批发出摊' },
              { place: '面馆采购', step: '店家一早挑回鲜货' },
              { place: '后厨', step: '拍碎拌料，冰镇更爽脆' },
              { place: '上桌', step: '和牛肉面前后脚到齐' },
            ],
          },
        ],
      },
      {
        id: 'pizza', name: '披萨之夜', emoji: '🍕',
        note: '一张披萨跨了三大洲：面粉、芝士、番茄酱各有各的漂洋过海。',
        quiz: {
          q: '这张披萨的食材里，谁的海运路程最远？',
          options: ['芝士', '进口小麦', '番茄酱'],
          answer: 1,
          explain: '加拿大小麦从北美装船，横跨太平洋上万公里；新西兰芝士也坐过船，但稍近一点——一张披萨，就是一场国际航海。',
        },
        ingredients: [
          {
            id: 'import-wheat', name: '进口小麦', emoji: '🌾', distance: 10000,
            chain: [
              { place: '加拿大大平原', step: '机械收割，等级检验' },
              { place: '温哥华港', step: '装进万吨货轮货舱' },
              { place: '太平洋航线', step: '海运上万公里，半个月航程' },
              { place: '中国口岸磨粉厂', step: '卸货检疫，磨成披萨粉' },
              { place: '披萨店', step: '擀饼抹酱，进炉烘烤' },
            ],
          },
          {
            id: 'cheese', name: '芝士', emoji: '🧈', distance: 9500,
            chain: [
              { place: '新西兰 · 牧场', step: '挤奶当天送乳品厂' },
              { place: '乳品厂', step: '发酵、凝乳、压制成芝士块' },
              { place: '冷链海运', step: '冷藏集装箱漂洋过海' },
              { place: '口岸冷库', step: '报关查验，恒温存放' },
              { place: '披萨店', step: '刨丝铺饼，烤出拉丝效果' },
            ],
          },
          {
            id: 'sauce', name: '番茄酱', emoji: '🥫', distance: 3000,
            chain: [
              { place: '新疆 · 番茄田', step: '日照充足，番茄红透' },
              { place: '加工厂', step: '打浆熬煮，浓缩成酱' },
              { place: '灌装线', step: '装袋装箱，码进仓库' },
              { place: '干线运输', step: '发往全国各地的披萨店' },
              { place: '披萨炉', step: '抹在饼底上，烤出酸甜底味' },
            ],
          },
        ],
      },
    ],
  },

  /* ---------- 作物传播时间线地图 ---------- */
  spread: {
    note: '选一种作物，拖动年代滑块：地图上的箭头会随时间点亮。三波传播浪潮——驯化、丝路、大航海——越来越快。',
    /* 地图坐标对应 figures 里 640×360 的简化世界底图。year 负数 = 公元前。 */
    stops: [-9000, -5000, -3000, -1000, 500, 1200, 1500, 1550, 1600, 1700],
    stopLabels: ['前9000', '前5000', '前3000', '前1000', '500年', '1200年', '1500年', '1550年', '1600年', '1700年'],
    crops: [
      {
        id: 'wheat', name: '小麦', emoji: '🌾', color: '#d97745',
        origin: { x: 355, y: 103, label: '西亚 · 新月沃地' },
        events: [
          { year: -9000, text: '新月沃地驯化野生小麦，面食之路从这里出发' },
          { year: -7000, text: '传入欧洲和中亚', to: { x: 305, y: 78 } },
          { year: -4000, text: '沿草原之路进入中国西北', to: { x: 470, y: 82 } },
          { year: 1500, text: '随欧洲移民跨洋回到美洲', to: { x: 120, y: 82 } },
        ],
      },
      {
        id: 'rice', name: '水稻', emoji: '🌾', color: '#2fbf71',
        origin: { x: 450, y: 103, label: '长江流域' },
        events: [
          { year: -9000, text: '长江流域开始人工栽培水稻（河姆渡遗址的稻谷）' },
          { year: -4000, text: '传入东南亚与南亚', to: { x: 488, y: 152 } },
          { year: -1000, text: '传入朝鲜半岛与日本', to: { x: 522, y: 72 } },
          { year: 1000, text: '占城稻经海上航线来到华南（宋代引种）', to: { x: 468, y: 132 } },
          { year: 1500, text: '随贸易与移民传向美洲', to: { x: 175, y: 128 } },
        ],
      },
      {
        id: 'maize', name: '玉米', emoji: '🌽', color: '#e6b23c',
        origin: { x: 138, y: 112, label: '墨西哥一带' },
        events: [
          { year: -9000, text: '美洲先民驯化野生大刍草，最早的玉米棒只有几厘米' },
          { year: -3000, text: '在美洲大陆南北扩散', to: { x: 172, y: 198 } },
          { year: 1500, text: '哥伦布把它带回欧洲', to: { x: 300, y: 80 } },
          { year: 1550, text: '经海路和陆路传入中国（明代）', to: { x: 452, y: 98 } },
          { year: 1600, text: '传遍非洲，成为重要粮食', to: { x: 318, y: 178 } },
        ],
      },
      {
        id: 'potato', name: '马铃薯', emoji: '🥔', color: '#8b65c9',
        origin: { x: 152, y: 195, label: '安第斯山区' },
        events: [
          { year: -5000, text: '安第斯山区原住民驯化马铃薯，养活印加文明' },
          { year: 1540, text: '西班牙人把它带回欧洲', to: { x: 298, y: 84 } },
          { year: 1600, text: '传入中国西南山地（明末）', to: { x: 455, y: 118 } },
          { year: 1700, text: '成为欧洲多国的当家主粮', to: { x: 292, y: 70 } },
        ],
      },
    ],
  },

  /* ---------- 一餐营养搭配模拟器 ---------- */
  meal: {
    storeKey: 'food_meal_v1',
    note: '搭一餐 = 主食 + 蛋白质 + 蔬菜各选一样，水果可选，饮品选一样。按下「评价这餐」，看五颗星亮几颗、缺了什么。',
    /* energy 为一份的概略能量（千卡）；sugar 标记含糖饮料；whole 标记粗粮。 */
    cats: [
      { id: 'staple', name: '主食', must: true, emoji: '🍚' },
      { id: 'protein', name: '蛋白质', must: true, emoji: '🥚' },
      { id: 'veg', name: '蔬菜', must: true, emoji: '🥦' },
      { id: 'fruit', name: '水果', must: false, emoji: '🍎' },
      { id: 'drink', name: '饮品', must: true, emoji: '🥛' },
    ],
    dishes: [
      { id: 'm-rice', name: '白米饭', emoji: '🍚', cat: 'staple', energy: 200 },
      { id: 'm-noodle', name: '面条', emoji: '🍜', cat: 'staple', energy: 280 },
      { id: 'm-grain', name: '杂粮饭', emoji: '🌾', cat: 'staple', energy: 190, whole: true },
      { id: 'm-sweet-potato', name: '蒸红薯', emoji: '🍠', cat: 'staple', energy: 120, whole: true },
      { id: 'm-fish', name: '清蒸鱼', emoji: '🐟', cat: 'protein', energy: 160 },
      { id: 'm-egg', name: '水煮蛋', emoji: '🥚', cat: 'protein', energy: 80 },
      { id: 'm-chicken', name: '鸡腿', emoji: '🍗', cat: 'protein', energy: 230 },
      { id: 'm-tofu', name: '豆腐', emoji: '🫘', cat: 'protein', energy: 110 },
      { id: 'm-beef', name: '炖牛肉', emoji: '🥩', cat: 'protein', energy: 180 },
      { id: 'm-broccoli', name: '西兰花', emoji: '🥦', cat: 'veg', energy: 50 },
      { id: 'm-cucumber', name: '黄瓜', emoji: '🥒', cat: 'veg', energy: 20 },
      { id: 'm-greens', name: '绿叶菜', emoji: '🥬', cat: 'veg', energy: 30 },
      { id: 'm-tomato', name: '番茄', emoji: '🍅', cat: 'veg', energy: 30 },
      { id: 'm-apple', name: '苹果', emoji: '🍎', cat: 'fruit', energy: 80 },
      { id: 'm-banana', name: '香蕉', emoji: '🍌', cat: 'fruit', energy: 90 },
      { id: 'm-orange', name: '橙子', emoji: '🍊', cat: 'fruit', energy: 70 },
      { id: 'm-water', name: '白开水', emoji: '💧', cat: 'drink', energy: 0 },
      { id: 'm-milk', name: '牛奶', emoji: '🥛', cat: 'drink', energy: 150, dairy: true },
      { id: 'm-soy', name: '豆浆', emoji: '🧋', cat: 'drink', energy: 90 },
      { id: 'm-cola', name: '可乐', emoji: '🥤', cat: 'drink', energy: 140, sugar: true },
    ],
    /* 一餐能量参考区间（小学高年级，不含早餐摊账）。 */
    energyMin: 500,
    energyMax: 900,
    checks: [
      { id: 'staple', label: '有主食', tip: '补一样主食：米饭、面条或杂粮饭都行——它是身体的快燃料。' },
      { id: 'protein', label: '有蛋白质', tip: '补一样蛋白质：鱼、蛋、肉或豆腐——长身体靠它。' },
      { id: 'veg', label: '有蔬菜', tip: '补一样蔬菜：绿叶菜、番茄、黄瓜都很方便。' },
      { id: 'fruit-dairy', label: '有水果或奶', tip: '饭后加一个水果，或配一杯牛奶——维生素和钙就补上了。' },
      { id: 'light-drink', label: '饮品少糖', tip: '把含糖饮料换成白开水、牛奶或豆浆——糖一天别超一小瓶。' },
      { id: 'energy-ok', label: '能量适中', tip: '这餐的能量不合适：太低加份量，太高减点主食和肉。' },
      { id: 'whole-grain', label: '粗细搭配', tip: '主食偶尔换成杂粮饭或红薯——纤维让能量释放更平稳。' },
    ],
    /* energy-ok 在五档之外单独判定：整餐能量须在区间内。 */
    bonusChecks: ['whole-grain'],
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FOOD_LABS;
}
if (typeof window !== 'undefined') {
  window.FOOD_LABS = FOOD_LABS;
}

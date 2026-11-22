/* 尺度缩放台数据：从头发丝一路放大到水分子，向下的「宇宙地址」。
   挑战题的 first/last 记录口径与天文探索的观察挑战一致。 */
'use strict';
const MICROBE_SCALE = {
  storeKey: 'microbe_scale_v1',
  scaleNote: '这是一条从看得见走向看不见的路线，每往下一级，画面就放大一次。图里的相对大小是示意，不按真实比例画出；每级的真实尺寸和放大工具看说明。',
  levels: [
    {
      id: 'hair', name: '头发丝', address: '我的身体 → 头发丝',
      sizeLabel: '直径约 70 微米', tool: '裸眼可见',
      compare: '从这里出发：一根头发丝的宽度，已经能并排放下两三个皮肤细胞。',
      text: '头发是身上少数能用裸眼看清细节、又小得快看不清的东西。它宽约 70 微米——微米是一毫米的一千分之一。往下走，我们要进入一个裸眼完全看不见的世界。',
      link: '#lesson-mm2-3', linkLabel: '认识微米和纳米',
    },
    {
      id: 'cell', name: '皮肤细胞', address: '头发丝 → 皮肤细胞',
      sizeLabel: '宽约 30 微米', tool: '光学显微镜就能看清',
      compare: '两三个皮肤细胞并排，才和一根头发丝一样宽。',
      text: '皮肤的最外层由这样的小细胞铺成，像一面不断更新的砖墙：老细胞掉下去，新细胞补上来。一滴水进不了这面墙，但墙的缝隙和油膜上住着微生物——它们更小得多。',
      link: '#lesson-mm2-2', linkLabel: '分清放大倍数和分辨率',
    },
    {
      id: 'bacteria', name: '细菌', address: '皮肤细胞 → 细菌',
      sizeLabel: '长约 1～2 微米', tool: '光学显微镜（要调到最大倍数）',
      compare: '十几个细菌排成一列，才有一个皮肤细胞那么宽。',
      text: '细菌是单细胞微生物，形状有球、杆、螺旋几种。一小勺土壤里的细菌可以多到几十亿个。多数细菌不惹事，有些还在肠子里帮忙消化——它们是我们这个世界的老住户。',
      link: '#lesson-mm1-2', linkLabel: '对比微生物四大家族',
    },
    {
      id: 'virus', name: '病毒', address: '细菌 → 病毒',
      sizeLabel: '约 0.1 微米（100 纳米）', tool: '电子显微镜才能看清',
      compare: '一个皮肤细胞里能住下上千个病毒；病毒比细菌小几十倍。',
      text: '病毒小到光学显微镜分辨极限（约 0.2 微米）以下，所以学校的光学显微镜看不见它们。它没有细胞结构，必须住进别的生物细胞里才能复制——这是它最特别的地方。',
      link: '#lesson-mm1-3', linkLabel: '聊聊病毒是不是生命',
    },
    {
      id: 'molecule', name: '水分子', address: '病毒 → 水分子',
      sizeLabel: '约 0.3 纳米（1 纳米＝千分之一微米）', tool: '看不见，靠科学仪器推断',
      compare: '一滴水（约 0.05 毫升）里大约有 17 万亿亿个水分子——写出来是一个 21 位数。',
      text: '再往下放大，病毒也「消失」了：组成它的蛋白质和核酸，最终都由分子搭成。一滴水里挤着天文数字般的水分子——「一滴水里有什么？」这个问题的答案，比肉眼能想象的多得多。',
      link: '#lesson-mm5-4', linkLabel: '回头总结微生物与我',
    },
  ],
  challenges: [
    {
      id: 'hair-cell', question: '一根头发丝的宽度，大约能并排放下几个皮肤细胞？',
      options: ['两三个', '三四十个', '上千个'], answer: 0,
      explanation: '头发约 70 微米、皮肤细胞约 30 微米——两三个排一排就满了。数量级估算先比量级，再数个数。',
      link: '#lesson-mm2-3',
    },
    {
      id: 'virus-see', question: '为什么学校的光学显微镜看不见病毒？',
      options: ['病毒是透明的', '多数病毒比光学显微镜能分清的极限还小', '显微镜倍数不够时病毒会躲开'], answer: 1,
      explanation: '光学显微镜分清细节的极限约 0.2 微米，多数病毒只有 0.1 微米上下——要请电子显微镜出场。',
      link: '#lesson-mm2-4',
    },
    {
      id: 'virus-life', question: '病毒必须在别的细胞里才能复制，这说明什么？',
      options: ['它一定不是物质', '它没有细胞结构，靠宿主细胞复制，算不算生命仍有争论', '它比细菌更「高级」'], answer: 1,
      explanation: '病毒由核酸和蛋白质组成，能遗传、能进化，但没有自己的代谢和细胞结构——科学家至今仍在讨论它算不算生命。',
      link: '#lesson-mm1-3',
    },
    {
      id: 'pond', question: '列文虎克在一滴池塘水里看到的「小动物」，最可能是什么？',
      options: ['小昆虫', '原生生物和藻类、细菌等微生物', '灰尘的反光'], answer: 1,
      explanation: '一滴池塘水是一座微生物居民楼：草履虫、变形虫这样的原生生物最显眼，细菌和藻类也在里面。',
      link: '#lesson-mm2-1',
    },
    {
      id: 'yogurt', question: '牛奶变酸奶，主要是哪种微生物在干活？',
      options: ['酵母菌产气', '乳酸菌把糖变成乳酸', '霉菌长出菌丝'], answer: 1,
      explanation: '乳酸菌把乳糖变成乳酸，酸让蛋白质抱团凝固——面包的膨胀才是酵母产气的功劳。',
      link: '#lesson-mm3-2',
    },
    {
      id: 'vaccine', question: '疫苗让身体提前准备的是什么？',
      options: ['直接注射抗体，一辈子免疫', '把病原特征「介绍」给免疫系统，练出抗体和记忆细胞', '把白细胞都消灭重来'], answer: 1,
      explanation: '疫苗像一场安全的「演练」：免疫系统认识病原特征后造出抗体、留下记忆细胞，真遇到时反应更快。',
      link: '#lesson-mm4-3',
    },
  ],
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MICROBE_SCALE;
}
if (typeof window !== 'undefined') {
  window.MICROBE_SCALE = MICROBE_SCALE;
}

/* 概率乐园三个实验台与反直觉查证台的数据：模板、选项、挑战题统一维护。 */
'use strict';
const PROB_LABS = {
  dice: {
    storeKey: 'prob_dice_v1',
    note: '模拟器用浏览器随机数代替真实骰子：每一次都独立，掷 10 次七扭八歪是正常现象，掷上千次频率才贴近理论线。柱形是频率（百分比），虚线是理论值。',
    modes: [
      {id: 'one', name: '一枚骰子', faces: [1, 2, 3, 4, 5, 6], theory: () => 1 / 6,
       theoryNote: '理论值：每面 1/6≈16.7%', title: '六面频率柱', answerNote: '六面等可能，频率应都靠近 16.7%——哪一面也不会特别多。'},
      {id: 'two', name: '两枚骰子求和', faces: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
       theory: sum => [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1][sum - 2] / 36,
       theoryNote: '理论值：7 为 6/36≈16.7%，两端 1/36≈2.8%', title: '两骰和的频率柱', answerNote: '山顶在 7：6 种组合，最容易出；2 和 12 各只有 1 种组合，最难出。'},
    ],
    batches: [{id: 10, name: '掷 10 次'}, {id: 100, name: '掷 100 次'}, {id: 1000, name: '掷 1000 次'}],
  },
  survey: {
    storeKey: 'prob_survey_v1',
    note: '真实调查要有固定问题、互不重叠的选项和如实记录。先把票数收齐，再看柱状图和占比；总票数要和实际参与人数对得上。',
    templates: [
      {id: 'fruit', question: '你最喜欢的水果是？', options: [{id: 'apple', name: '苹果', emoji: '🍎'}, {id: 'banana', name: '香蕉', emoji: '🍌'}, {id: 'grape', name: '葡萄', emoji: '🍇'}, {id: 'melon', name: '西瓜', emoji: '🍉'}]},
      {id: 'transport', question: '你平时怎么上学？', options: [{id: 'walk', name: '步行', emoji: '🚶'}, {id: 'bike', name: '骑车', emoji: '🚲'}, {id: 'bus', name: '公交地铁', emoji: '🚌'}, {id: 'ride', name: '家人接送', emoji: '🚗'}]},
      {id: 'pet', question: '你最想养的宠物是？', options: [{id: 'cat', name: '猫', emoji: '🐱'}, {id: 'dog', name: '狗', emoji: '🐶'}, {id: 'fish', name: '金鱼', emoji: '🐠'}, {id: 'hamster', name: '仓鼠', emoji: '🐹'}]},
    ],
  },
  pi: {
    storeKey: 'prob_pi_v1',
    note: '随机撒点估计 π 的原理：四分之一圆占边长 1 的正方形的面积比是 π/4，所以 π ≈ 4 ×（圆内点数 ÷ 总点数）。显示区最多画出最近 3000 个点，计数不丢。',
    batches: [{id: 10, name: '撒 10 点'}, {id: 100, name: '撒 100 点'}, {id: 1000, name: '撒 1000 点'}],
    drawCap: 3000,
    truth: Math.PI,
  },
  myths: {
    storeKey: 'prob_myths_v1',
    note: '先凭直觉选，再看解析；可以回课文找线索后改答案。首次作答和订正后的结果分开记录，方便对照直觉有没有真的更新。',
    questions: [
      {id: 'coin-streak', question: '硬币连出 5 次正面，第 6 次反面更可能出现吗？',
       options: ['是，反面「该来了」', '不是，每次仍是 1/2', '是，正面连出太久了'], answer: 1,
       explanation: '硬币没有记忆：每次抛掷独立，前面的结果不影响下一次——把「该轮到」当规律就是赌徒谬误。', link: '#lesson-ps5-1'},
      {id: 'two-dice', question: '掷两个骰子，哪个点数（和）最容易出现？',
       options: ['2 到 12 都一样', '7', '12（最大）'], answer: 1,
       explanation: '36 种组合里 7 占 6 种，可能性 6/36＝1/6；2 和 12 各只有 1 种组合——山顶在 7。', link: '#lesson-ps2-2'},
      {id: 'single-six', question: '掷一枚骰子 10 次，一次 6 都没出现，说明什么？',
       options: ['骰子一定有问题', '10 次太少，说明不了问题', '下次 6 更可能出现'], answer: 1,
       explanation: '10 次里 6 的期望次数约 1.7 次，一次不出很正常；判断骰子公平要看上千次的频率。', link: '#lesson-ps3-2'},
      {id: 'lottery', question: '花 2 元抽奖，20% 中 5 元、5% 中 20 元，划算吗？',
       options: ['划算，最高能得 20 元', '期望刚好 2 元，长期不赚不亏', '一定赚，因为中奖率高'], answer: 1,
       explanation: '0.2×5＋0.05×20＝2 元——期望等于票价；只看最高奖品不看概率，是抽奖陷阱的常见开场。', link: '#lesson-ps5-3'},
      {id: 'average', question: '9 人每月 3000 元、1 人每月 39000 元，平均 6600 元说明什么？',
       options: ['大多数人收入 6600 元左右', '平均被 1 个极端值拉高，多数人只有 3000 元', '数据肯定错了'], answer: 1,
       explanation: '平均数会被极端值拉跑：这里中位数 3000 更贴近多数人——读「平均」先找极端值。', link: '#lesson-ps4-4'},
      {id: 'rain', question: '天气预报降水概率 30%，第二天没下雨，说明什么？',
       options: ['预报不准', '正常——30% 表示同样条件下约三成的日子会下雨', '概率是骗人的'], answer: 1,
       explanation: '30% 的日子会下雨、70% 不下——单日结果对不对，要看长期频率；一次没下雨推翻不了概率。', link: '#lesson-ps3-1'},
    ],
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PROB_LABS;
}
if (typeof window !== 'undefined') {
  window.PROB_LABS = PROB_LABS;
}

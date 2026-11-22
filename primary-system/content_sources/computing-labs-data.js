/* 计算乐园四个实验台的数据：二进制开关、排序实验、二分查找、分类器训练。
   训练果子与各项参数统一维护；纯计算部分由 computing-labs.js 导出供 Node 回归测试。 */
'use strict';
const COMPUTING_LABS = {
  binary: {
    storeKey: 'computing_binary_v1',
    note: '拨开关就是拨比特：每个开关是一位，身价从右到左翻倍（1、2、4、8……）。上面的大数字是这些位合起来的十进制值——拨一拨，再接一个「摆数挑战」。',
    width: 8,
  },
  sort: {
    note: '两支队伍用同样的 8 个数字：冒泡相邻两个比一比、大的往后挪；选择每趟先看准最大的再放队尾。走一步看比较高亮，记下比较和交换次数——谁更省？',
    bars: 8,
    maxValue: 10,
    stepMs: 620,
    algorithms: [
      {id: 'bubble', name: '冒泡排序'},
      {id: 'selection', name: '选择排序'},
    ],
  },
  search: {
    storeKey: 'computing_search_v1',
    note: '你心里定一个 1～100 的目标数，电脑用二分法来猜：每一轮猜中间的数，把范围砍一半。看完二分的表现，再看看从头猜要多少次。',
    min: 1,
    max: 100,
    roundMs: 850,
  },
  classify: {
    storeKey: 'computing_classify_v1',
    note: '12 个训练果子已摆好：苹果偏甜、柠檬偏酸。移动阈值这条分界线，电脑就按「甜度 ≥ 阈值判苹果」来分类——训练到全对，再考 5 个新果子看看它学得怎样。',
    thresholdMin: 1,
    thresholdMax: 10,
    examCount: 5,
    /* y 是画布上的摆放高度（0～1），与分类无关，只为把果子摊开看得清。 */
    training: [
      {sweet: 7, label: 'apple', y: .16},
      {sweet: 8, label: 'apple', y: .34},
      {sweet: 9, label: 'apple', y: .52},
      {sweet: 7, label: 'apple', y: .70},
      {sweet: 6, label: 'apple', y: .86},
      {sweet: 9, label: 'apple', y: .22},
      {sweet: 1, label: 'lemon', y: .18},
      {sweet: 2, label: 'lemon', y: .36},
      {sweet: 3, label: 'lemon', y: .54},
      {sweet: 4, label: 'lemon', y: .72},
      {sweet: 5, label: 'lemon', y: .90},
      {sweet: 3, label: 'lemon', y: .30},
    ],
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = COMPUTING_LABS;
}
if (typeof window !== 'undefined') {
  window.COMPUTING_LABS = COMPUTING_LABS;
}

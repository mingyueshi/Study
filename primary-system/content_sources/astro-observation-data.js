/* 复用月相与日月食课程的观察说明，不作为天象预报。 */
'use strict';
const ASTRO_OBSERVATION = {
  cycleDays: 29.5,
  phases: [
    {key: 'new', label: '新月', cal: '约农历初一', note: '月球位于太阳方向，朝着地球的这一面几乎不亮。'},
    {key: 'waxcres', label: '峨眉月', cal: '约农历初三初四', note: '我们看到一弯月牙，亮的部分正在增加。'},
    {key: 'firstq', label: '上弦月', cal: '约农历初七初八', note: '看到半个月面发亮，接下来亮的部分还会增加。'},
    {key: 'waxgib', label: '盈凸月', cal: '约农历十一十二', note: '亮的部分超过一半，正在向满月变化。'},
    {key: 'full', label: '满月', cal: '约农历十五十六', note: '月球位于与太阳相对的方向，朝向地球的月面几乎全亮。'},
    {key: 'wanggib', label: '亏凸月', cal: '约农历十八十九', note: '过了满月，亮的部分开始减少，但仍超过一半。'},
    {key: 'lastq', label: '下弦月', cal: '约农历廿二廿三', note: '又看到半个月面发亮，这次亮的部分正在减少。'},
    {key: 'wancres', label: '残月', cal: '约农历廿六廿七', note: '亮的部分只剩一弯月牙，接下来又回到新月。'},
  ],
  moonCause: '通常太阳照亮月球的一半。月相变化是我们看到的亮面比例在变，不是地球的影子挡住了月亮。',
  moonModel: '左图从地球北极上方看，用固定的太阳方向表示一轮月相的位置关系；右图按北半球常见的朝向画月面，实际倾斜方向会变化。大小、距离、轨道与速度均为示意，天数从一次新月开始估算，农历日期只作大致参照。',
  eclipses: [
    {key: 'solar', label: '日食', order: '太阳 → 月球 → 地球：月球在中间。', steps: [
      {label: '看位置', note: '先找到太阳、月球和地球。月球还没有移到合适的遮挡位置。'},
      {label: '看排列', note: '月球移到太阳与地球之间。先看清谁在中间，下一步再突出影子。'},
      {label: '看影子', note: '月球的影子落到地球的一小片区域，那里的人可能看到太阳被遮挡。'},
      {label: '看离开', note: '月球继续移动，遮挡关系结束。图中只演示位置变化，不代表真实食相和持续时间。'},
    ]},
    {key: 'lunar', label: '月食', order: '太阳 → 地球 → 月球：地球在中间。', steps: [
      {label: '看位置', note: '先找到太阳、地球和月球。月球还没有进入地球的影子。'},
      {label: '看排列', note: '地球位于太阳与月球之间。先看清谁在中间，下一步再突出影子。'},
      {label: '看影子', note: '月球进入地球的影子，照到月面的太阳光受到遮挡，这就是月食。'},
      {label: '看离开', note: '月球继续移动，走出地球的影子。图中颜色只帮助看清遮挡，不模拟红月亮的色彩。'},
    ]},
  ],
  eclipseCondition: '月球轨道是倾斜的，影子通常会错开，所以不是每次新月都有日食，也不是每次满月都有月食。',
  eclipseModel: '这是按讲解顺序分步展示的侧面示意，先看排列，再突出影子。天体大小、距离、移动路线和影区都不按真实比例绘制，不用于判断某地能否看到日月食。',
  solarSafety: '观察太阳或日食要按专业指导使用合格的太阳观测设备；不能直接看太阳，也不能用普通墨镜代替。',
  sources: [
    {title: 'NASA：月相变化', url: 'https://science.nasa.gov/moon/moon-phases/'},
    {title: 'NASA：月球与日月食', url: 'https://science.nasa.gov/moon/eclipses/'},
  ],
};
if (typeof module !== 'undefined') module.exports = ASTRO_OBSERVATION;

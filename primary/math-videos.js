/* ============================================================
   乐学堂 · 数学小影院 —— 公开教学视频/动画清单（自用学习，无版权风险）
   - 只收录适合小学生的数学动画 / 微课，UP主与时长经 B站公开页面核对
   - 点封面用 B站官方播放器在线播放（需联网）
   - 与知识点 point.video 字段联动：在知识点卡上可直接播放关联视频
   ============================================================ */
'use strict';

const MATH_VIDEOS = (function () {
  /* 分组（影院页面按此排序展示） */
  const GROUPS = [
    { id: 'blocks', emoji: '🧱', name: '数字积木动画', desc: '《Numberblocks》用积木变出数字魔法，边玩边学', color: '#e25563' },
    { id: 'sync', emoji: '📚', name: '单元同步微课', desc: '北师大版四年级上册各单元微课，跟着课本走', color: '#4d96ff' },
    { id: 'brain', emoji: '🧠', name: '数学思维动画', desc: '运算律、几何、统计……用动画把难点讲透', color: '#157d73' },
  ];

  /* 视频清单（bvid 经 B站公开页面核对） */
  const LIST = [
    /* —— 数字积木动画 —— */
    { id: 'nb-s1', group: 'blocks', bvid: 'BV15KTx6SEGr', title: '数字积木 第一季（中文配音）', up: 'B站少儿 · Numberblocks', dur: 600, cover: 'images/math/videos/v-nb-s1.jpg', note: '一集一个数字，认识数与运算' },
    { id: 'nb-mul', group: 'blocks', bvid: 'BV1qAWgzeEdH', title: '数字方块学乘法', up: '橘多贝子', dur: 480, cover: 'images/math/videos/v-nb-mul.jpg', note: '用方块理解乘法口诀' },
    { id: 'nb-square', group: 'blocks', bvid: 'BV1KARQYNE4n', title: '数字积木：1² 到 10²', up: 'scenesunIT', dur: 300, cover: 'images/math/videos/v-nb-square.jpg', note: '平方数的几何意义' },

    /* —— 单元同步微课（北师大版四年级上册） —— */
    { id: 'sync-line', group: 'sync', bvid: 'BV132Tg6TEHo', title: '线的认识（第二单元第1课）', up: '北师大版四年级上册微课', dur: 540, cover: 'images/math/videos/v-sync-line.jpg', note: '线段、射线、直线一次分清' },
    { id: 'sync-review', group: 'sync', bvid: 'BV1eKFUzCEz6', title: '四年级上册全册复习（37集）', up: '北师大版小学数学', dur: 2400, cover: 'images/math/videos/v-sync-review.jpg', note: '合集 · 从认识更大的数到数据表示' },

    /* —— 数学思维动画 —— */
    { id: 'ani-mulcombine', group: 'brain', bvid: 'BV16QtCzyEqE', title: '乘法结合律（动画微课）', up: '丫丫老师', dur: 360, cover: 'images/math/videos/v-ani-mulcombine.jpg', note: '运算律动画，一看就懂' },
    { id: 'ani-avg', group: 'brain', bvid: 'BV1qDNuetE1w', title: '平均数（清华附小动画）', up: '清华附小小学数学', dur: 240, cover: 'images/math/videos/v-ani-avg.jpg', note: '移多补少求平均数' },
    { id: 'ani-bar', group: 'brain', bvid: 'BV1rCxLzbEdn', title: '条形统计图（动画微课）', up: '丫丫老师', dur: 320, cover: 'images/math/videos/v-ani-bar.jpg', note: '用直条说话，一眼看出多少' },
  ];

  const byIdMap = {};
  LIST.forEach(v => { byIdMap[v.id] = v; });

  const api = {
    list: LIST,
    groups: GROUPS,
    byId(id) { return byIdMap[id] || null; },
    embedUrl(bvid) {
      return 'https://player.bilibili.com/player.html?bvid=' + encodeURIComponent(bvid) +
        '&autoplay=1&danmaku=0&high_quality=1';
    },
  };
  return api;
})();

if (typeof window !== 'undefined') {
  window.MATH_VIDEOS = MATH_VIDEOS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MATH_VIDEOS;
}

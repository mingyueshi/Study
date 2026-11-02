/* ============================================================
   乐学堂 · 历史小影院 —— B站公开视频清单（自用学习）
   - 只收录适合小学生的历史纪录片 / 动画，UP主与时长经 API 校验
   - 点封面用 B站官方播放器在线播放（需联网）
   - 多集合集默认播第 1 集，可点「去B站看高清」选集
   ============================================================ */
'use strict';

const HISTORY_VIDEOS = (function () {
  /* 分组（影院页面按此排序展示） */
  const GROUPS = [
    { id: 'guobao', emoji: '🏺', name: '国宝会说话', desc: '《如果国宝会说话》一集一件国宝，5 分钟看完', color: '#b5893a' },
    { id: 'miao', emoji: '🐱', name: '历史喵动画片', desc: '《如果历史是一群喵》，跟着猫咪笑看历史', color: '#e25563' },
    { id: 'tongshi', emoji: '📜', name: '朝代故事纪录片', desc: '《中国通史》等央视纪录片，一个朝代一段传奇', color: '#2f9bd6' },
    { id: 'jiaoyou', emoji: '🐫', name: '大道与远航', desc: '河西走廊、玄奘之路、郑和下西洋……跟着镜头走一遍', color: '#157d73' },
  ];

  /* 视频清单（bvid 均经 bilibili API 校验） */
  const LIST = [
    /* —— 国宝会说话 —— */
    { id: 'jiaguwen', group: 'guobao', bvid: 'BV1nEuuzeEtn', title: '殷墟嵌绿松石甲骨', up: '如果国宝会说话·第1季', dur: 285, cover: 'images/history/videos/v-jiaguwen.jpg', note: '刻在骨头上的最早汉字' },
    { id: 'he-zun', group: 'guobao', bvid: 'BV1mToHBjE63', title: '何尊：宅兹中国', up: '如果国宝会说话·第1季', dur: 286, cover: 'images/history/videos/v-he-zun.jpg', note: '「中国」两个字最早出现在这里' },
    { id: 'bianzhong', group: 'guobao', bvid: 'BV1gf4y1p78g', title: '曾侯乙编钟', up: '如果国宝会说话·第2季', dur: 290, cover: 'images/history/videos/v-bianzhong.jpg', note: '两千多年前的青铜音乐会' },
    { id: 'goujian-sword', group: 'guobao', bvid: 'BV1n7uuzNEo3', title: '越王勾践剑：胜者为王', up: '如果国宝会说话·第1季', dur: 285, cover: 'images/history/videos/v-goujian-sword.jpg', note: '卧薪尝胆的王者之剑' },
    { id: 'liye-qinjian', group: 'guobao', bvid: 'BV1cV411n7Uh', title: '里耶秦简', up: '如果国宝会说话·第2季', dur: 291, cover: 'images/history/videos/v-liye-qinjian.jpg', note: '秦朝小官吏的「工作日记」' },
    { id: 'tongchema', group: 'guobao', bvid: 'BV1ei4y1A72m', title: '秦始皇陵铜车马', up: '如果国宝会说话·第2季', dur: 290, cover: 'images/history/videos/v-tongchema.jpg', note: '青铜铸造的「皇帝座驾」' },
    { id: 'changxin-gongdeng', group: 'guobao', bvid: 'BV1HQ4y1Z7WV', title: '长信宫灯', up: '如果国宝会说话·第2季', dur: 290, cover: 'images/history/videos/v-changxin-gongdeng.jpg', note: '会「环保」的汉代宫灯' },
    { id: 'shuochang-yong', group: 'guobao', bvid: 'BV1Gp4y147rG', title: '击鼓说唱俑', up: '如果国宝会说话·第2季', dur: 291, cover: 'images/history/videos/v-shuochang-yong.jpg', note: '东汉「脱口秀演员」的笑脸' },
    { id: 'tongbenma', group: 'guobao', bvid: 'BV1hK4y1o7C7', title: '铜奔马（马踏飞燕）', up: '如果国宝会说话·第2季', dur: 290, cover: 'images/history/videos/v-tongbenma.jpg', note: '中国旅游标志的原型' },
    { id: 'luoshen-futu', group: 'guobao', bvid: 'BV12goHB5EEg', title: '洛神赋图：所谓伊人', up: '如果国宝会说话·第3季', dur: 295, cover: 'images/history/videos/v-luoshen-futu.jpg', note: '顾恺之笔下的神仙画卷' },
    { id: 'qingming-shanghetu', group: 'guobao', bvid: 'BV1Dy4y1z7uG', title: '清明上河图：北宋繁华记忆', up: '央视《中华国宝》', dur: 1800, cover: 'images/history/videos/v-qingming-shanghetu.jpg', note: '30 分钟逛遍北宋汴京' },
    { id: 'tangsancai', group: 'guobao', bvid: 'BV16MhN6cE94', title: '三彩载乐骆驼俑', up: '央视网美学', dur: 96, cover: 'images/history/videos/v-tangsancai.jpg', note: '1 分半看盛唐乐队巡游' },
    /* —— 历史喵 —— */
    { id: 'history-miao-1', group: 'miao', bvid: 'BV1iQbC6tEhc', title: '华夏诞生', up: '如果历史是一群喵', dur: 241, cover: 'images/history/videos/v-history-miao-1.jpg', note: '第 1 回 · 猫咪讲上古' },
    { id: 'history-miao-2', group: 'miao', bvid: 'BV1ad4y1E7AL', title: '大禹建国', up: '如果历史是一群喵', dur: 246, cover: 'images/history/videos/v-history-miao-2.jpg', note: '第 4 回 · 大禹治水建夏' },
    /* —— 朝代故事 —— */
    { id: 'overview', group: 'tongshi', bvid: 'BV1L7TpzREqb', title: '中华道路：五千年总述', up: '央视《中国通史》', dur: 2714, cover: 'images/history/videos/v-overview.jpg', note: '45 分钟纵览中华五千年' },
    { id: 'yuangu-legend', group: 'tongshi', bvid: 'BV1pG4y147HW', title: '中华先祖：从元谋人到炎黄', up: '央视《中国通史》精简版', dur: 855, cover: 'images/history/videos/v-yuangu-legend.jpg', note: '14 分钟讲上古传说时代' },
    { id: 'xia-shang-zhou', group: 'tongshi', bvid: 'BV1yWiuBsE34', title: '武王克商：牧野之战', up: '央视《中国通史》精编版', dur: 1136, cover: 'images/history/videos/v-xia-shang-zhou.jpg', note: '商亡周兴的关键一战' },
    { id: 'chunqiu-zhanguo', group: 'tongshi', bvid: 'BV16ui9BkEqB', title: '诸子百家', up: '央视《中国通史》精编版', dur: 1246, cover: 'images/history/videos/v-chunqiu-zhanguo.jpg', note: '百家争鸣的思想黄金时代' },
    { id: 'qin-han', group: 'tongshi', bvid: 'BV1kT4y1G7YN', title: '从秦始皇到汉武帝', up: '央视大型纪录片', dur: 2995, cover: 'images/history/videos/v-qin-han.jpg', note: '50 分钟看秦汉帝国崛起' },
    { id: 'sanguo', group: 'tongshi', bvid: 'BV1ny4y1a7yx', title: '重走古战场：赤壁之战', up: '央视《重走古战场》', dur: 1293, cover: 'images/history/videos/v-sanguo.jpg', note: '合集 · 播放第 1 集（约 21 分钟）' },
    { id: 'sui-tang', group: 'tongshi', bvid: 'BV1LtcWzLEnf', title: '贞观之治', up: '央视《中国通史》精编版', dur: 1260, cover: 'images/history/videos/v-sui-tang.jpg', note: '唐太宗与盛唐气象' },
    { id: 'song', group: 'tongshi', bvid: 'BV1pTDWBYESM', title: '岳飞故里：待从头收拾旧山河', up: '央视《跟着书本去旅行》', dur: 1139, cover: 'images/history/videos/v-song.jpg', note: '专为小学生拍的研学节目' },
    { id: 'yuan', group: 'tongshi', bvid: 'BV1Wx411M7FM', title: '忽必烈赐名通惠河', up: '央视《国宝档案》', dur: 839, cover: 'images/history/videos/v-yuan.jpg', note: '元大都与运河的故事' },
    /* —— 大道与远航 —— */
    { id: 'silk-road', group: 'jiaoyou', bvid: 'BV1eP4y1x7bW', title: '河西走廊：使者', up: '央视《河西走廊》', dur: 2861, cover: 'images/history/videos/v-silk-road.png', note: '第 1 集 · 张骞凿空西域' },
    { id: 'tang-exchange', group: 'jiaoyou', bvid: 'BV1zp4y117h5', title: '玄奘之路：乱世孤旅', up: '央视《玄奘之路》', dur: 1740, cover: 'images/history/videos/v-tang-exchange.png', note: '合集 · 播放第 1 集（约 29 分钟）' },
    { id: 'zhenghe', group: 'jiaoyou', bvid: 'BV1rW411d7w1', title: '1405 郑和下西洋', up: '央视/江苏广电纪录片', dur: 2820, cover: 'images/history/videos/v-zhenghe.png', note: '合集 · 播放第 1 集（约 47 分钟）' },
    { id: 'ming-qing-palace', group: 'jiaoyou', bvid: 'BV17j411776e', title: '紫禁城：王者', up: '央视《紫禁城》', dur: 3695, cover: 'images/history/videos/v-ming-qing-palace.jpg', note: '第 1 集 · 朱棣建紫禁城' },
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
  window.HISTORY_VIDEOS = HISTORY_VIDEOS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HISTORY_VIDEOS;
}

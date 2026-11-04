/* ============================================================
   乐学堂 · 语文知识点 —— 课文拓展视频（B站公开资源，自用学习）
   ------------------------------------------------------------
   - 只收录与课文/古诗对应的纪录片、动画、朗读与实拍视频
   - 全部 bvid 均已通过 bilibili API 校验（标题/UP主/时长真实）
   - 点击新标签页打开B站播放页（需联网）
   key 与知识卡的 'u单元-课序' / 古诗篇名 对应
   ============================================================ */
'use strict';

const KB_VIDEOS = (function () {
  /* 课文视频（key = 单元id + '-' + 课文id） */
  const LESSONS = {
    'u1-1': [
      { bvid: 'BV1aP4y1Z7QR', title: '看现场！八月涛声吼地来 回头潮水横眼前', up: '央视频', dur: 532, note: '钱塘江大潮现场实拍' },
      { bvid: 'BV1GP4wzkEQV', title: '课前三分钟——钱塘江大潮', up: '羊羊的地理教室', dur: 188, note: '3分钟看懂大潮成因' },
    ],
    'u1-2': [
      { bvid: 'BV1XC4y177gR', title: '朗读《繁星》——董丽娜的声音世界', up: '董丽娜的声音世界', dur: 172, note: '盲人播音员深情朗读' },
    ],
    'u2-4': [
      { bvid: 'BV1pF411d7PK', title: '安徒生童话：一个豆荚里的五粒豆', up: '派蒙爱唱咕咕嘎嘎', dur: 482, note: '完整故事讲述' },
    ],
    'u2-5': [
      { bvid: 'BV1m34y1M72T', title: '蝙蝠的夜间飞行之谜：回声定位', up: 'SN科技', dur: 239, note: '课文原理动画讲解' },
      { bvid: 'BV1D4411r76Y', title: '蝙蝠怎样通过超声波定位', up: 'MENGDE01', dur: 136, note: '真实蝙蝠飞行画面' },
    ],
    'u2-7': [
      { bvid: 'BV1hy4y1S7ZK', title: '中国经典童话故事：田忌赛马', up: '荆天城', dur: 197, note: '动画复现赛马计策' },
    ],
    'u3-8': [
      { bvid: 'BV1y14y1s748', title: '古诗三首：《暮江吟》《题西林壁》《雪梅》', up: '梦夏1979', dur: 442, note: '三首课文古诗串讲' },
    ],
    'u3-9': [
      { bvid: 'BV1Y3411C7KU', title: '《爬山虎的脚》攀爬过程实拍素材', up: '为了年轻', dur: 48, note: '看脚怎样"巴住墙"' },
    ],
    'u3-10': [
      { bvid: 'BV1cq4y1w7Kd', title: '蟋蟀原来是这样建巢的', up: '买糖不花钱', dur: 243, note: '住宅修建全程实拍' },
    ],
    'u4-11': [
      { bvid: 'BV1pZ4y1L7dn', title: '《盘古开天地》课本动画', up: '爱上课本', dur: 126, note: '四年级课文配套动画' },
    ],
    'u4-12': [
      { bvid: 'BV1gxvYeZEyF', title: '中国神话·精卫填海', up: '小口袋演讲视频', dur: 255, note: '神话故事动画讲述' },
    ],
    'u4-13': [
      { bvid: 'BV14v411Y7QK', title: '希腊神话：盗火的普罗米修斯', up: '钱丢丢-', dur: 736, note: '完整讲述盗火与受罚' },
    ],
    'u4-14': [
      { bvid: 'BV1RhNA6jEkZ', title: '女娲补天（上海美术电影制片厂·高清修复）', up: '旭日迎春', dur: 556, note: '经典国产动画' },
    ],
    'u5-15': [
      { bvid: 'BV11C41157Xk', title: '屠格涅夫散文《麻雀》中俄双语朗读', up: '扑棱俄子eee', dur: 132, note: '听原文译本朗读' },
    ],
    'u5-16': [
      { bvid: 'BV1pQ4heXEJ9', title: '黄山天都峰鲫鱼背实拍', up: '鸭在乎人', dur: 98, note: '看看课文里的险峰' },
    ],
    'u6-17': [
      { bvid: 'BV1c8411S7v3', title: '《世界遗产@中国》微纪录片——长城', up: '国家文物局', dur: 230, note: '官方微纪录片' },
    ],
    'u6-18': [
      { bvid: 'BV1WgMy6XEaL', title: '《跟着书本去旅行》打卡颐和园——解码园中园', up: '爱学习的面包妈妈', dur: 1142, note: '央视课本研学节目' },
    ],
    'u6-19': [
      { bvid: 'BV12m4y177oK', title: '《世界遗产@中国》微纪录片——秦兵马俑', up: '国家文物局', dur: 199, note: '官方微纪录片' },
    ],
    'u7-20': [
      { bvid: 'BV1caHTzcE93', title: '牛和鹅', up: '卜心2025', dur: 384, note: '课文故事讲述' },
    ],
    'u7-23': [
      { bvid: 'BV1XuaG6qE4x', title: '《王戎不取道旁李》动画完整版', up: '西瓜闯课本', dur: 127, note: '7岁王戎为什么不摘李子' },
    ],
    'u8-25': [
      { bvid: 'BV1wDxaeJEmE', title: '"为中华之崛起而读书"周总理的故事', up: '百叶大鸾', dur: 386, note: '少年立志故事' },
    ],
    'u8-26': [
      { bvid: 'BV1444y1B7TW', title: '《红色档案》之延安宝塔山', up: '中国警察网', dur: 130, note: '宝塔山的红色记忆' },
    ],
  };

  /* 古诗文视频（key = 篇名） */
  const POEMS = {
    '鹿柴': [
      { bvid: 'BV1Dt411s7ws', title: '婷婷唱古文：王维《鹿柴》', up: '婷婷姐姐唱古诗', dur: 218, note: '唱着学古诗' },
    ],
    '暮江吟': [
      { bvid: 'BV1Su411Q7e5', title: '爱上古诗：《暮江吟》白居易', up: '番茄味的糖果', dur: 315, note: '趣味讲解' },
    ],
    '题西林壁': [
      { bvid: 'BV1CTLczhEuz', title: '爱上古诗：《题西林壁》苏轼', up: '罗罗猫咖啡豆蒙古球', dur: 288, note: '趣味讲解' },
    ],
    '雪梅': [
      { bvid: 'BV1g8411q7Jx', title: '《雪梅》诗文详解', up: 'zhang老师语文小课堂', dur: 403, note: '梅雪争春谁输谁赢' },
    ],
    '别董大': [
      { bvid: 'BV1Jf4y1M7zo', title: '爱上古诗：《别董大》高适', up: '番茄味的糖果', dur: 280, note: '趣味讲解' },
    ],
    '凉州词': [
      { bvid: 'BV1pY8TebEoU', title: '《凉州词》王翰', up: '曦文文呀', dur: 212, note: '朗读与赏析' },
    ],
    '出塞': [
      { bvid: 'BV194411G7pY', title: '语文大师：《出塞》王昌龄', up: '物理大师APP', dur: 356, note: '课文精讲' },
    ],
    '夏日绝句': [
      { bvid: 'BV19J411N7nE', title: '语文大师：《夏日绝句》李清照', up: '物理大师APP', dur: 331, note: '课文精讲' },
    ],
    '精卫填海': [
      { bvid: 'BV1gxvYeZEyF', title: '中国神话·精卫填海', up: '小口袋演讲视频', dur: 255, note: '神话动画' },
    ],
    '王戎不取道旁李': [
      { bvid: 'BV1XuaG6qE4x', title: '《王戎不取道旁李》动画完整版', up: '西瓜闯课本', dur: 127, note: '趣味动画' },
    ],
  };

  const fmt = s => {
    const m = Math.round(s / 60);
    return m >= 1 ? m + '分' + (s % 60 ? (s % 60) + '秒' : '') : s + '秒';
  };
  const link = v => 'https://www.bilibili.com/video/' + v.bvid;

  const api = {
    lessons: LESSONS,
    poems: POEMS,
    byLesson(key) { return LESSONS[key] || null; },
    byPoem(title) { return POEMS[title] || null; },
    count() { return Object.values(LESSONS).reduce((n, a) => n + a.length, 0) + Object.values(POEMS).reduce((n, a) => n + a.length, 0); },
    fmt, link,
  };
  return api;
})();

if (typeof window !== 'undefined') {
  window.KB_VIDEOS = KB_VIDEOS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KB_VIDEOS;
}

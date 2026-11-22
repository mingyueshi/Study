/* 桌面混合实验模拟器数据：试剂、配对现象与安全说明，由 matter-mix.js 渲染。 */
'use strict';
const MATTER_MIX = {
  storeKey: 'matter_mix_records_v1',
  safety: '本台只用厨房可得的材料，观察的是安全反应的简化模型。产生气体的反应要在敞口杯里做、用量要少；固体混合没有现象也算一条观察记录。',
  model: '模拟器把每种液体画成一种颜色、把现象压缩成一次倒液：真实的颜色深浅、气泡大小和温度变化都更细微，反应快慢也不按真实时间。紫甘蓝汁的变色范围是示意色卡；铁钉的反应要几天，这里只提示去向。',
  reagents: [
    {id: 'water', name: '清水', emoji: '💧', color: '#a5d5ee', type: '溶剂', note: '最常用的溶剂'},
    {id: 'vinegar', name: '白醋', emoji: '🍶', color: '#e9e4c2', type: '酸', note: 'pH 约 3 的酸'},
    {id: 'lemon', name: '柠檬汁', emoji: '🍋', color: '#f1e6a4', type: '酸', note: 'pH 约 2 的酸'},
    {id: 'soda', name: '小苏打水', emoji: '🥄', color: '#d7ecf3', type: '碱', note: '小苏打溶进水，弱碱'},
    {id: 'soap', name: '肥皂水', emoji: '🧼', color: '#d6e6f6', type: '碱', note: '碱性，摸起来滑'},
    {id: 'salt', name: '食盐', emoji: '🧂', color: '#f3f6f9', type: '盐', note: '固体会溶进水里'},
    {id: 'sugar', name: '白糖', emoji: '🍬', color: '#f6f2e6', type: '其他', note: '固体会溶进水里'},
    {id: 'oil', name: '食用油', emoji: '🫙', color: '#ecd28a', type: '其他', note: '不溶于水，浮在上层'},
    {id: 'cabbage', name: '紫甘蓝汁', emoji: '🥬', color: '#a67cc8', type: '指示剂', note: '遇酸变红、遇碱变蓝绿'},
    {id: 'nail', name: '铁钉', emoji: '🔩', color: '#b7c0ca', type: '金属', note: '生锈要等几天'},
  ],
  /* kind 决定烧杯里的示意动画：gas 冒泡、dissolve 固体化开、layer 分层、
     emulsify 变乳浊、color-red / color-blue / color-none 指示剂颜色、
     neutral 中和、dry 固体干混、slow 慢反应、none 无明显现象。 */
  pairs: {
    'cabbage+lemon': {kind: 'color-red', text: '紫甘蓝汁变红了', why: '柠檬汁是酸，指示剂遇酸变红。'},
    'cabbage+nail': {kind: 'slow', text: '指示剂颜色不变，铁钉安静地待在杯底', why: '铁和紫甘蓝汁短时间内互不打扰；真正生锈要等几天，现象记到反应观察表。'},
    'cabbage+oil': {kind: 'layer', text: '油浮在上层，紫甘蓝汁沉在下层', why: '食用油和紫甘蓝汁合不来，静置就分层——这不是溶解。'},
    'cabbage+salt': {kind: 'color-none', text: '颜色基本不变', why: '食盐溶液接近中性，指示剂仍显紫色。'},
    'cabbage+soda': {kind: 'color-blue', text: '紫甘蓝汁变蓝绿', why: '小苏打水是弱碱，指示剂遇碱变蓝绿。'},
    'cabbage+soap': {kind: 'color-blue', text: '紫甘蓝汁变蓝绿', why: '肥皂水是碱，指示剂遇碱变蓝绿。'},
    'cabbage+sugar': {kind: 'color-none', text: '保持紫色', why: '糖水接近中性，不改变指示剂颜色。'},
    'cabbage+vinegar': {kind: 'color-red', text: '紫甘蓝汁变红了', why: '白醋是酸，紫甘蓝汁遇酸变红。'},
    'cabbage+water': {kind: 'color-none', text: '保持紫色', why: '清水是中性的，不改变指示剂颜色。'},
    'lemon+nail': {kind: 'slow', text: '铁钉泡在柠檬汁里，变化要慢慢来', why: '柠檬酸会慢慢咬铁钉表面，放几天再看看。'},
    'lemon+oil': {kind: 'layer', text: '油浮在柠檬汁上面', why: '油和柠檬汁不互溶，静置分层。'},
    'lemon+salt': {kind: 'dissolve', text: '盐粒溶进了柠檬汁', why: '柠檬汁里大部分是水，食盐照样溶解。'},
    'lemon+soda': {kind: 'gas', text: '白泡涌起，嘶嘶作响——柠檬酸也和小苏打反应', why: '柠檬酸和小苏打反应放出二氧化碳；酸用完或碱用完，泡就停。'},
    'lemon+soap': {kind: 'neutral', text: '看不出气泡或变色', why: '柠檬汁的酸和肥皂水的碱互相抵消（中和），生成盐和水——悄悄发生，要靠指示剂帮忙判断。'},
    'lemon+sugar': {kind: 'dissolve', text: '白糖溶进了柠檬汁', why: '柠檬汁的主要成分是水，白糖照样溶解。'},
    'lemon+vinegar': {kind: 'none', text: '两种酸混在一起，看不出变化', why: '酸加酸还是酸——没有新物质诞生，这只是物理混合。'},
    'lemon+water': {kind: 'dissolve', text: '柠檬汁和水混成一杯柠檬水', why: '柠檬汁里的柠檬酸等物质溶进水，颜色均匀、没有分层。'},
    'nail+oil': {kind: 'slow', text: '几乎没有变化', why: '油隔开了空气和水，反而像给铁钉涂了防锈油。'},
    'nail+salt': {kind: 'slow', text: '短时间内看不出变化', why: '干盐不咬铁钉；可要是受潮或换成盐水，生锈会快得多——条件一变，结论就变。'},
    'nail+soda': {kind: 'slow', text: '铁钉泡在小苏打水里，一时没有动静', why: '弱碱对铁都太温和；生锈要等几天，用反应观察表记录。'},
    'nail+soap': {kind: 'slow', text: '铁钉泡在肥皂水里，一时没有动静', why: '碱性液体对铁钉的作用也要几天才看得见——观察需要耐心。'},
    'nail+sugar': {kind: 'slow', text: '短时间内看不出变化', why: '白糖和铁互不打扰，没有反应发生。'},
    'nail+vinegar': {kind: 'slow', text: '铁钉安静地泡着，变化要慢慢来', why: '醋会慢慢和铁反应，表面变暗要几个小时到几天——真实验记到反应观察表里对比。'},
    'nail+water': {kind: 'slow', text: '铁钉泡在清水里——生锈的条件凑齐了', why: '铁＋氧气＋水，三个条件都在；真铁钉放几天会长出红棕色锈点，记到反应观察表里比较。'},
    'oil+salt': {kind: 'layer', text: '盐沉在油底，颗粒一点没变小', why: '食盐不溶于油，也不会和油反应——它在油里「住不下来」。'},
    'oil+soda': {kind: 'layer', text: '油浮在小苏打水上面', why: '油和小苏打水不互溶，静置分层。'},
    'oil+soap': {kind: 'emulsify', text: '整杯变成乳白浑浊，看不到清晰的油层', why: '肥皂分子一头亲水一头亲油，把油「拽」成小滴分散开——这叫乳化，不是溶解，放久了还会分回两层。'},
    'oil+sugar': {kind: 'layer', text: '糖沉在油底，颗粒一点没变小', why: '白糖不溶于油——糖只在水这类溶剂里才化开。'},
    'oil+vinegar': {kind: 'layer', text: '油浮在醋上面', why: '油和醋不互溶，静置分层。'},
    'oil+water': {kind: 'layer', text: '油浮在水面上，界线分明', why: '食用油不溶于水，密度比水小，只能浮在上层。'},
    'salt+soda': {kind: 'dissolve', text: '盐粒溶进了小苏打水', why: '两种东西都溶在水里，溶液更「热闹」了，但没有新物质诞生。'},
    'salt+soap': {kind: 'dissolve', text: '盐粒溶进了肥皂水', why: '肥皂水里主要是水，食盐照样溶解。'},
    'salt+sugar': {kind: 'dry', text: '两堆固体拌在一起，看不出变化', why: '没有水当溶剂，盐和糖只是混在一处——既谈不上溶解，也没有反应。'},
    'salt+vinegar': {kind: 'dissolve', text: '盐粒也溶进了醋里', why: '醋里含水，食盐照样能溶解；溶液的味道又咸又酸。'},
    'salt+water': {kind: 'dissolve', text: '盐粒越变越小，最后看不见，整杯水变咸', why: '食盐溶进水，变成均匀的溶液——溶质没有消失，蒸发掉水还能请回来。'},
    'soap+soda': {kind: 'none', text: '两种碱混在一起，看不出变化', why: '碱加碱还是碱，没有新物质诞生，只是物理混合。'},
    'soda+sugar': {kind: 'dissolve', text: '白糖溶进了小苏打水', why: '小苏打水的主要成分是水，白糖照样溶解。'},
    'soda+vinegar': {kind: 'gas', text: '白泡涌起，嘶嘶作响，杯壁微微变凉', why: '醋酸和小苏打反应，放出二氧化碳气体；反应吸热，温度略降。'},
    'soda+water': {kind: 'dissolve', text: '小苏打溶进水，就是一杯小苏打水', why: '小苏打是溶质，水是溶剂，混合后得到弱碱性的溶液。'},
    'soap+sugar': {kind: 'dissolve', text: '白糖溶进了肥皂水', why: '白糖溶进肥皂水，得到均匀的混合液。'},
    'soap+vinegar': {kind: 'neutral', text: '看不出气泡或变色', why: '醋的酸和肥皂水的碱互相抵消（中和）；想看变化，滴一滴紫甘蓝汁当裁判。'},
    'soap+water': {kind: 'dissolve', text: '肥皂水兑水，仍是一杯碱性的肥皂水', why: '肥皂水被稀释，pH 略微靠近 7，但还是碱。'},
    'sugar+vinegar': {kind: 'dissolve', text: '白糖溶进了醋里', why: '醋的主要成分是水，白糖也能溶解在其中。'},
    'sugar+water': {kind: 'dissolve', text: '白糖慢慢化开，水变甜', why: '白糖溶进水，得到均匀的糖水溶液。'},
    'vinegar+water': {kind: 'dissolve', text: '醋被兑稀了，还是酸的', why: '醋和水互溶成均匀的稀醋——稀释不改变酸碱的「身份」。'},
  },
  /* 没登记的配对一律按「无现象」处理，同样是一条观察记录。 */
  fallback: {kind: 'none', text: '观察不到明显变化', why: '这两种物质混在一起，短时间内没有气泡、没有变色，也没有分层。没有现象也是重要的观察结果——如实地记下来。'},
  kinds: {
    gas: '化学反应', dissolve: '溶解', layer: '分层不溶', emulsify: '乳化',
    'color-red': '指示剂变红', 'color-blue': '指示剂变蓝绿', 'color-none': '指示剂原色',
    neutral: '中和', dry: '固体干混', slow: '慢反应', none: '无明显现象',
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MATTER_MIX;
}
if (typeof window !== 'undefined') {
  window.MATTER_MIX = MATTER_MIX;
}

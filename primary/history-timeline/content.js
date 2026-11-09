/* 时代带元数据；双轨事件与同期对照在 timeline-data.js，朝代速览在下方。 */
window.TIMELINE_ERAS = [
  {
    "no": 1,
    "id": "dawn",
    "name": "文明的曙光",
    "span": "约前 5000 年 — 约前 2070 年",
    "accent": "#b07d3a",
    "compare": "长江边种稻、尼罗河筑塔，最初的文明都选择在大河边生长。"
  },
  {
    "no": 2,
    "id": "bronze",
    "name": "青铜与古国",
    "span": "约前 2070 年 — 前 771 年",
    "accent": "#c8892e",
    "compare": "青铜时代：商朝刻甲骨，埃及法老建神庙，汉谟拉比把法典刻上石柱。"
  },
  {
    "no": 3,
    "id": "axial",
    "name": "思想的星空",
    "span": "前 770 年 — 前 221 年",
    "accent": "#b85c38",
    "compare": "公元前 8 到前 3 世纪，东西方同时迎来思想的黄金年代。"
  },
  {
    "no": 4,
    "id": "empire",
    "name": "帝国两相望",
    "span": "前 221 年 — 220 年",
    "accent": "#b03a2e",
    "compare": "秦汉与罗马，当时地球上最强大的两个国家，隔着丝路遥遥相望。"
  },
  {
    "no": 5,
    "id": "migration",
    "name": "分合与迁徙",
    "span": "220 年 — 589 年",
    "accent": "#7a6a9e",
    "compare": "公元 3 到 6 世纪，欧亚大陆的两端都在经历分裂、迁徙与融合。"
  },
  {
    "no": 6,
    "id": "golden",
    "name": "盛世与新星",
    "span": "581 年 — 1368 年",
    "accent": "#2e7d64",
    "compare": "唐朝与阿拉伯帝国两强并立，欧洲在城堡与大学里慢慢生长。"
  },
  {
    "no": 7,
    "id": "voyage",
    "name": "大航海时代",
    "span": "1368 年 — 1644 年",
    "accent": "#1f6f8b",
    "compare": "十五六世纪，人类的舞台从大陆扩展到了大洋。"
  },
  {
    "no": 8,
    "id": "change",
    "name": "变革的浪潮",
    "span": "1644 年 — 1912 年",
    "accent": "#5b6abf",
    "compare": "十八九世纪，西方的机器轰鸣向前，古老中国遇到的挑战越来越大。"
  },
  {
    "no": 9,
    "id": "modern",
    "name": "新的纪元",
    "span": "1912 年 — 今天",
    "accent": "#a5486d",
    "compare": "大战重塑了世界，新中国一路追赶，科技把地球变成一个小村庄。"
  }
];

/* 中国朝代速览：一条线排顺序，点朝名跳到对应时代带。
   sort 为起算年代数字（公元前记负数），note 是分段的补充说明，可省略。 */
window.TIMELINE_DYNASTIES = [
  { "name": "夏", "span": "约前 2070—前 1600", "sort": -2070, "era": "bronze" },
  { "name": "商", "span": "约前 1600—前 1046", "sort": -1600, "era": "bronze" },
  { "name": "西周", "span": "前 1046—前 771", "sort": -1046, "era": "bronze" },
  { "name": "东周", "span": "前 770—前 221", "sort": -770, "era": "axial", "note": "春秋 · 战国" },
  { "name": "秦", "span": "前 221—前 207", "sort": -221, "era": "empire" },
  { "name": "汉", "span": "前 202—220", "sort": -202, "era": "empire", "note": "西汉 · 东汉" },
  { "name": "三国", "span": "220—280", "sort": 220, "era": "migration", "note": "魏 · 蜀 · 吴" },
  { "name": "两晋", "span": "266—420", "sort": 266, "era": "migration", "note": "西晋 · 东晋" },
  { "name": "南北朝", "span": "420—589", "sort": 420, "era": "migration" },
  { "name": "隋", "span": "581—618", "sort": 581, "era": "golden" },
  { "name": "唐", "span": "618—907", "sort": 618, "era": "golden" },
  { "name": "五代十国", "span": "907—979", "sort": 907, "era": "golden" },
  { "name": "宋", "span": "960—1279", "sort": 960, "era": "golden", "note": "北宋 · 南宋" },
  { "name": "元", "span": "1271—1368", "sort": 1271, "era": "golden" },
  { "name": "明", "span": "1368—1644", "sort": 1368, "era": "voyage" },
  { "name": "清", "span": "1644—1912", "sort": 1644, "era": "change" }
];

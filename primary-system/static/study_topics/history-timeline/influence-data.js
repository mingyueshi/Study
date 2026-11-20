/* 有出处的影响线索。links[i] 解释 steps[i] 如何影响 steps[i + 1]。 */
window.TIMELINE_INFLUENCES = [
  {
    id: 'paper',
    title: '从造纸术到文艺复兴书籍',
    steps: ['tc16', 'tw127', 'tw131', 'tw29', 'tw139'],
    links: [
      {kind: 'transfer', source: 'paper-asia', note: '中国改进后的造纸工艺经不同地区传播。中亚和西亚匠人调整原料和工序，做出了适合当地书写需求的纸。'},
      {kind: 'transfer', source: 'paper-west', note: '造纸业向地中海西部扩展。伊比利亚的哈蒂瓦是其中一个能查到的生产地点。'},
      {kind: 'condition', source: 'gutenberg', note: '纸张在欧洲的生产和流通，让印刷商多了一种可批量采购的材料。古登堡《圣经》有纸本，也有羊皮纸本。哈蒂瓦与美因茨之间的箭头概括工艺扩散与材料供应的变化。'},
      {kind: 'condition', source: 'aldine', note: '欧洲活字印刷业发展后，威尼斯出版商能成批制作便携的古典读本。书籍更容易流通，为文艺复兴时期的阅读和讨论提供了条件。'}
    ]
  },
  {
    id: 'qin',
    title: '商鞅变法怎样推动秦统一',
    steps: ['tc11', 'tc13'],
    links: [
      {kind: 'condition', source: 'qin-reforms', note: '秦国的变法调整了地方行政和军功制度，让国君能更集中地调动人力、粮食与军队。此后的战争、外交和各国局势也影响了统一的进程。'}
    ]
  },
  {
    id: 'silk',
    title: '丝绸怎样到达罗马',
    steps: ['tc14', 'tc15', 'tw15'],
    links: [
      {kind: 'condition', source: 'han-west', note: '张骞等使者带回关于西域诸国和道路的信息。后来汉朝在当地的军事活动、外交联系与制度安排共同促成西域都护府的设立。'},
      {kind: 'condition', source: 'han-west', note: '汉朝在西域的驿站、护卫与翻译服务有助于维持交通。丝绸经过西域城邦、安息等多段转手，才进入罗马市场。'}
    ]
  },
  {
    id: 'tikal',
    title: '特奥蒂瓦坎与蒂卡尔的王朝更迭',
    steps: ['tw74', 'tw76'],
    links: [
      {kind: 'condition', source: 'maya-classic', note: '玛雅铭文与具有中部墨西哥特征的物品，让研究者推测特奥蒂瓦坎的势力参与了蒂卡尔的王朝更迭。究竟是军事控制、结盟还是多种关系并存，仍有讨论。'}
    ]
  },
  {
    id: 'mexica',
    title: '从湖中城到三城联盟与围城',
    steps: ['tw88', 'tw89', 'tw92'],
    links: [
      {kind: 'condition', source: 'mexico-late', note: '特诺奇蒂特兰逐步发展成墨西哥盆地的政治力量。它与特斯科科、特拉科潘合力击败当时的强国，重新组织了地区联盟。'},
      {kind: 'condition', source: 'mexico-late', note: '联盟扩张造成一些地方政权与特诺奇蒂特兰长期对立。特拉斯卡拉等势力后来加入围城一方，其参与和疫病、补给等因素一起改变了战局。'}
    ]
  },
  {
    id: 'mali',
    title: '马里帝国与曼萨·穆萨的旅行',
    steps: ['tw105', 'tw108'],
    links: [
      {kind: 'condition', source: 'sahel', note: '马里帝国的贡赋、黄金来源和商路网络为后来的君主提供了动员资源的能力。穆萨经开罗前往麦加，也让其他地区的记载者更了解这个帝国。'}
    ]
  },
  {
    id: 'baghdad',
    title: '巴格达的建城与学术活动',
    steps: ['tw126', 'tw25'],
    links: [
      {kind: 'condition', source: 'abbasid', note: '都城汇集了宫廷财力、书籍和来自不同地方的学者。阿拔斯时期的赞助为翻译和研究创造了条件，智慧宫是理解这一时期知识活动的一个入口。'}
    ]
  },
  {
    id: 'mamluk',
    title: '埃及的政权更替与马穆鲁克崛起',
    steps: ['tw132', 'tw134', 'tw136'],
    links: [
      {kind: 'condition', source: 'ayyubid', note: '阿尤布统治者的军队已有马穆鲁克军人。王朝末期的政治危机给这些掌握军事力量的集团夺取政权的机会。'},
      {kind: 'condition', source: 'mamluk', note: '马穆鲁克政权以埃及为动员基地，派军进入叙利亚南部一带迎战蒙古部队。艾因贾鲁特的战果帮助这一新政权巩固区域地位。'}
    ]
  },
  {
    id: 'un',
    title: '二战怎样推动建立联合国',
    steps: ['tw58', 'tw59'],
    links: [
      {kind: 'response', source: 'un', note: '世界大战的破坏促使盟国在战争期间讨论战后合作机制。多国代表随后共同起草并签署《联合国宪章》，把维护和平写入宗旨。'}
    ]
  }
];

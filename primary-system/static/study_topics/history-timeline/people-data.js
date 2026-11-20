/* 人物资料、图像与关系的单一维护出处。教学案例中的讨论问题为编写者设计，非人物原话。 */
window.HISTORY_PEOPLE = {
  "groups": [
    {
      "id": "statecraft",
      "label": "帝王将相",
      "icon": "印",
      "color": "#b65f38",
      "intro": "从制度、用人与外交，观察权力怎样影响社会。"
    },
    {
      "id": "science",
      "label": "科学家",
      "icon": "研",
      "color": "#217d88",
      "intro": "从观察、计算和实验，追问知识怎样被验证。"
    },
    {
      "id": "literature",
      "label": "文学家",
      "icon": "文",
      "color": "#8155a0",
      "intro": "从文字与作品，看个人经验怎样留下时代的声音。"
    },
    {
      "id": "art",
      "label": "艺术家",
      "icon": "艺",
      "color": "#428162",
      "intro": "从线条、形体和构图，观察艺术家的表达选择。"
    }
  ],
  "relationKinds": [
    {
      "id": "service",
      "label": "君臣与任职",
      "direct": true,
      "note": "有共同任职或委派关系，不等于意见始终一致。"
    },
    {
      "id": "contact",
      "label": "真实交往",
      "direct": true,
      "note": "有交往记载；具体会面细节仍以材料为准。"
    },
    {
      "id": "influence",
      "label": "学术承接",
      "direct": false,
      "note": "研究或方法上的承接，不表示见过面或直接师承。"
    },
    {
      "id": "reception",
      "label": "书写与推重",
      "direct": false,
      "note": "作品记录、追怀或推崇另一位人物，不表示相识。"
    },
    {
      "id": "contemporary",
      "label": "同代背景",
      "direct": false,
      "note": "处于相近时代，方便横向比较，不表示存在交往。"
    },
    {
      "id": "theme",
      "label": "共同问题",
      "direct": false,
      "note": "研究或创作的问题相关，不表示直接合作。"
    }
  ],
  "sources": {
    "qin-edict": {
      "title": "秦始皇、秦二世双诏版",
      "publisher": "中国国家博物馆",
      "url": "https://www.chnmuseum.cn/zp/zpml/csp/202008/t20200826_247416.shtml"
    },
    "han-envoy": {
      "title": "中华史诗美术大展·张骞奉使西域",
      "publisher": "中国国家博物馆",
      "url": "https://en.chnmuseum.cn/Portals/0/web/exhibition/exhibitions/161120Chines-Epic/"
    },
    "tang-advice": {
      "title": "唐太宗·兼听纳谏",
      "publisher": "中国文化研究院",
      "url": "https://chiculture.org.hk/sites/mainsite/files/2021-07/0108_tangtaizong_yuanwen_cn.pdf"
    },
    "wu-biography": {
      "title": "武则天",
      "publisher": "吕梁市人民政府",
      "url": "https://www.lvliang.gov.cn/zjll/mlll/lsmr/200702/t20070201_231958.html"
    },
    "wu-court": {
      "title": "武则天《臣轨》",
      "publisher": "重庆市纪委监委",
      "url": "https://www.dcqjw.gov.cn/ljcq/lsbl/201405/t20140508_477600.html"
    },
    "zhuge-strategy": {
      "title": "诸葛亮·隆中对策",
      "publisher": "中国文化研究院",
      "url": "https://chiculture.org.hk/sites/mainsite/files/2021-11/0104_zhugeliang_pdf_cn.pdf"
    },
    "zhang-seismoscope": {
      "title": "张衡地动仪：史料、功能与复原模型研究",
      "publisher": "中国科学院自然科学史研究所",
      "url": "https://english.ihns.cas.cn/institute/OS/journal/shns/201011/t20101109_61115.html"
    },
    "zu-pi": {
      "title": "圆周率的计算",
      "publisher": "中国数字科技馆",
      "url": "https://www.cdstm.cn/museum/zphc/hxzg2017x/art/2017/art_ab597c13859f46419105c59582a0ea2b.html"
    },
    "shen-book": {
      "title": "《梦溪笔谈》馆藏说明",
      "publisher": "中国国家博物馆",
      "url": "https://www.chnmuseum.cn/zp/zpml/gjwxbt/202203/t20220301_254035.shtml"
    },
    "xu-science": {
      "title": "徐光启与科学著作",
      "publisher": "中国科学院光电技术研究所",
      "url": "https://www.ioe.cas.cn/qtgn/zt/lstk/201311/t20131114_3978564.html"
    },
    "xu-galileo": {
      "title": "伽利略与徐光启的同时代科学背景",
      "publisher": "中国科学院国家天文台",
      "url": "https://nao.cas.cn/news/zh/202203/t20220330_6414746.html"
    },
    "galileo-museum": {
      "title": "Galileo Galilei 生平与望远镜观测",
      "publisher": "伽利略博物馆",
      "url": "https://catalogue.museogalileo.it/biography/GalileoGalilei.html"
    },
    "newton-project": {
      "title": "牛顿生平与著作年表",
      "publisher": "牛津大学 Newton Project",
      "url": "https://newtonproject.ox.ac.uk/his-life-and-work-at-a-glance"
    },
    "sima-bio": {
      "title": "司马迁",
      "publisher": "故宫博物院",
      "url": "https://www.dpm.org.cn/lemmas/240631.html"
    },
    "sima-letter": {
      "title": "《报任安书》条目与原典引文",
      "publisher": "中国哲学书电子化计划",
      "url": "https://ctext.org/dictionary.pl?char=%E5%A0%B1%E4%BB%BB%E5%AE%89%E6%9B%B8&if=gb"
    },
    "li-bio": {
      "title": "李白",
      "publisher": "济南市人民政府",
      "url": "https://www.gsjn.gov.cn/zjjn/cjmr/art/2022/art_c4a08000425a49e8a1d5f9500b2ae453.html"
    },
    "li-du": {
      "title": "李白、杜甫的交往",
      "publisher": "广州市政协",
      "url": "https://gzszx.gov.cn/wstd/wsmb/33750.shtml"
    },
    "du-poem": {
      "title": "《石壕吏》原文",
      "publisher": "维基文库·杜甫作品",
      "url": "https://zh.wikisource.org/wiki/%E7%9F%B3%E5%A3%95%E5%90%8F"
    },
    "du-zhuge": {
      "title": "《蜀相》原文",
      "publisher": "维基文库·杜甫作品",
      "url": "https://zh.wikisource.org/wiki/%E8%9C%80%E7%9B%B8"
    },
    "su-redcliff": {
      "title": "《后赤壁赋》",
      "publisher": "故宫博物院",
      "url": "https://www.dpm.org.cn/lemmas/243403.html"
    },
    "cao-editions": {
      "title": "《红楼梦》的版本与整理",
      "publisher": "清华大学出版社",
      "url": "https://www.tup.tsinghua.edu.cn/booksCenter/bookpreface?id=10488101"
    },
    "cao-reading": {
      "title": "《红楼梦》第四十八回",
      "publisher": "维基文库·原典",
      "url": "https://zh.wikisource.org/wiki/%E7%B4%85%E6%A8%93%E5%A4%A2/%E7%AC%AC048%E5%9B%9E"
    },
    "shakespeare-lease": {
      "title": "1599 年环球剧场用地租约",
      "publisher": "福尔杰莎士比亚图书馆",
      "url": "https://shakespearedocumented.folger.edu/node/796"
    },
    "wang-lanting": {
      "title": "宋拓定武本兰亭与王羲之",
      "publisher": "故宫博物院",
      "url": "https://www.dpm.org.cn/collection/impres/228604.html"
    },
    "gu-painting": {
      "title": "顾恺之与传神论",
      "publisher": "故宫博物院",
      "url": "https://www.dpm.org.cn/lemmas/240503.html"
    },
    "wu-painting": {
      "title": "吴道子",
      "publisher": "故宫博物院",
      "url": "https://www.dpm.org.cn/lemmas/242062.html"
    },
    "zhang-scroll": {
      "title": "《清明上河图》手卷",
      "publisher": "故宫博物院",
      "url": "https://www.dpm.org.cn/journal_detail/239215.html"
    },
    "leonardo-study": {
      "title": "Leonardo da Vinci（1452—1519）",
      "publisher": "大都会艺术博物馆",
      "url": "https://www.metmuseum.org/ko/essays/leonardo-da-vinci-1452-1519"
    },
    "michelangelo-david": {
      "title": "米开朗琪罗《大卫》",
      "publisher": "佛罗伦萨学院美术馆",
      "url": "https://www.galleriaaccademiafirenze.it/en/artworks/david-michelangelo/"
    },
    "florence-artists": {
      "title": "1500 年前后的达·芬奇、米开朗琪罗与拉斐尔",
      "publisher": "英国国家美术馆",
      "url": "https://www.nationalgallery.org.uk/about-us/press-and-media/press-releases-archive/leonardo-michelangelo-raphael-about-1500"
    },
    "shakespeare-life": {
      "title": "William Shakespeare Biography",
      "publisher": "Shakespeare Birthplace Trust",
      "url": "https://www.shakespeare.org.uk/explore-shakespeare/shakespedia/william-shakespeare/william-shakespeare-biography/"
    }
  },
  "people": [
    {
      "id": "qin-shihuang",
      "name": "秦始皇",
      "aliases": [
        "嬴政"
      ],
      "group": "statecraft",
      "era": "empire",
      "born": -259,
      "died": -210,
      "life": "前 259—前 210 年",
      "region": "中国",
      "role": "秦朝皇帝",
      "summary": "统一之后，他面对的问题从打下疆土，变为怎样让不同地区按同一套制度运转。",
      "anchorYear": -221,
      "tags": [
        "统一",
        "度量衡",
        "制度"
      ],
      "eventIds": [
        "tc13",
        "tc41"
      ],
      "facts": [
        {
          "label": "观察线索",
          "text": "青铜诏版保存了统一度量衡的命令。"
        },
        {
          "label": "关键制度",
          "text": "同一标准便于交易和征税，也依赖行政力量执行。"
        }
      ],
      "sources": [
        "qin-edict"
      ],
      "image": {
        "src": "assets/people/qin-shihuang.jpg",
        "width": 330,
        "height": 444,
        "alt": "19 世纪绘制的秦始皇像，属于后世想象。",
        "caption": "19 世纪绘制的秦始皇像，属于后世想象。",
        "credit": "维基共享资源收录 · 公有领域",
        "source": "https://commons.wikimedia.org/wiki/File:QinShiHuang19century.jpg"
      },
      "decisions": [
        {
          "id": "qin-shihuang-choice",
          "title": "统一以后，要不要统一计量标准？",
          "period": "前 221 年",
          "context": "各地量粮食、称货物的标准不同，交换和征税容易产生争议。",
          "action": "颁布统一度量衡的诏令，把秦的标准推行到更广范围。",
          "outcome": "统一标准为跨地区交易和行政管理提供共同尺度。",
          "limits": "标准一致不等于执行公平，也不能单凭这项制度评价整个秦朝。",
          "prompt": "同一种粮食在两地用不同的斗来量，会发生哪些问题？",
          "sources": [
            "qin-edict"
          ]
        }
      ]
    },
    {
      "id": "han-wudi",
      "name": "汉武帝",
      "aliases": [
        "刘彻"
      ],
      "group": "statecraft",
      "era": "empire",
      "born": -156,
      "died": -87,
      "life": "前 156—前 87 年",
      "region": "中国",
      "role": "西汉皇帝",
      "summary": "从张骞出使看汉朝与西域的联系，也追问国家目标怎样影响使者和沿途社会。",
      "anchorYear": -138,
      "tags": [
        "西域",
        "外交",
        "国家目标"
      ],
      "eventIds": [
        "tc14",
        "tc15"
      ],
      "facts": [
        {
          "label": "行动",
          "text": "派张骞向西寻找与大月氏结盟的机会。"
        },
        {
          "label": "结果",
          "text": "原定联盟没有实现，带回的地理与社会信息仍有重要价值。"
        }
      ],
      "sources": [
        "han-envoy"
      ],
      "image": {
        "src": "assets/people/han-wudi.jpg",
        "width": 330,
        "height": 508,
        "alt": "后世刊本中的汉武帝像。",
        "caption": "后世刊本中的汉武帝像。",
        "credit": "维基共享资源收录 · 公有领域",
        "source": "https://commons.wikimedia.org/wiki/File:%E4%B8%89%E6%89%8D%E5%9C%96%E6%9C%83_%E6%BC%A2%E6%AD%A6%E5%B8%9D%E5%8A%89%E5%BE%B9%E7%9B%B8.jpg"
      },
      "decisions": [
        {
          "id": "han-wudi-choice",
          "title": "为什么派使者走向陌生的西方？",
          "period": "前 138 年",
          "context": "汉朝希望寻找大月氏，争取共同对付匈奴的盟友。",
          "action": "派遣张骞及随从出使，尝试通过外交改变力量格局。",
          "outcome": "任务没有按原计划完成，却扩大了汉朝对西域的了解。",
          "limits": "不能把后来全部丝路交流都归于一次出使，沿线各族长期参与其中。",
          "prompt": "没有实现原定目标的行动，还可能带来什么成果？",
          "sources": [
            "han-envoy"
          ]
        }
      ]
    },
    {
      "id": "tang-taizong",
      "name": "唐太宗",
      "aliases": [
        "李世民"
      ],
      "group": "statecraft",
      "era": "golden",
      "born": 598,
      "died": 649,
      "life": "598—649 年",
      "region": "中国",
      "role": "唐朝皇帝",
      "summary": "把纳谏看作信息与权力的问题：统治者怎样听到不顺耳但有用的意见？",
      "anchorYear": 627,
      "tags": [
        "贞观之治",
        "纳谏",
        "用人"
      ],
      "eventIds": [
        "tc22"
      ],
      "facts": [
        {
          "label": "治理线索",
          "text": "魏征等大臣的谏言，是认识贞观政治的一条材料线索。"
        },
        {
          "label": "另一面",
          "text": "他推崇王羲之，帝王收藏与临摹也参与了书法传播。"
        }
      ],
      "sources": [
        "tang-advice",
        "wang-lanting"
      ],
      "image": {
        "src": "assets/people/tang-taizong.jpg",
        "width": 330,
        "height": 462,
        "alt": "后世流传的唐太宗绘像。",
        "caption": "后世流传的唐太宗绘像。",
        "credit": "维基共享资源收录 · 公有领域",
        "source": "https://commons.wikimedia.org/wiki/File:Tang_Emperor_Taizong.jpg"
      },
      "decisions": [
        {
          "id": "tang-taizong-choice",
          "title": "愿不愿意让反对意见进入决策？",
          "period": "贞观年间，627—649 年",
          "context": "国家治理需要判断形势，臣下可能因惧怕惩罚而隐瞒问题。",
          "action": "鼓励进谏，并在多项事务中听取魏征等人的意见。",
          "outcome": "纳谏有助于发现政策问题，成为理解贞观治理的重要线索。",
          "limits": "纳谏仍受皇权约束，不能等同于现代民主制度，也不表示每次都听从。",
          "prompt": "如果大家只告诉负责人好消息，决策会缺少什么？",
          "sources": [
            "tang-advice",
            "wang-lanting"
          ]
        }
      ]
    },
    {
      "id": "wu-zetian",
      "name": "武则天",
      "aliases": [
        "武曌"
      ],
      "group": "statecraft",
      "era": "golden",
      "born": 624,
      "died": 705,
      "life": "624—705 年",
      "region": "中国",
      "role": "武周皇帝",
      "summary": "她从唐代宫廷走向最高权力，人物评价需要同时观察政治制度、人才与权力斗争。",
      "anchorYear": 690,
      "tags": [
        "武周",
        "政治",
        "权力"
      ],
      "eventIds": [
        "tc65"
      ],
      "facts": [
        {
          "label": "身份",
          "text": "690 年称帝，改国号为周。"
        },
        {
          "label": "读材料",
          "text": "历史上的政治行动，应与后世传说、影视情节分开看。"
        }
      ],
      "sources": [
        "wu-biography",
        "wu-court"
      ],
      "image": {
        "src": "assets/people/wu-zetian.png",
        "width": 330,
        "height": 584,
        "alt": "传统武则天绘像，非当时实录。",
        "caption": "传统武则天绘像，非当时实录。",
        "credit": "维基共享资源收录 · 公有领域",
        "source": "https://commons.wikimedia.org/wiki/File:%E5%94%90%E5%90%8E%E8%A1%8C%E5%BE%9E%E5%9C%96_%28%E5%B1%80%E9%83%A8%29_-_%E6%AD%A6%E5%89%87%E5%A4%A9.png"
      },
      "decisions": [
        {
          "id": "wu-zetian-choice",
          "title": "从临朝到称帝，怎样建立新的政治身份？",
          "period": "690 年",
          "context": "武则天已经长期参与政务，权力安排与唐朝皇室之间存在复杂张力。",
          "action": "称帝并改国号为周，以新的名号和制度安排确认统治地位。",
          "outcome": "形成武周政权，也改变了当时政治权力的组织方式。",
          "limits": "登上皇位不是评价政绩的全部；需继续考察用人、政策及权力斗争的代价。",
          "prompt": "判断一位统治者，应只看身份，还是也看制度和治理结果？",
          "sources": [
            "wu-biography",
            "wu-court"
          ]
        }
      ]
    },
    {
      "id": "zhuge-liang",
      "name": "诸葛亮",
      "aliases": [
        "孔明"
      ],
      "group": "statecraft",
      "era": "migration",
      "born": 181,
      "died": 234,
      "life": "181—234 年",
      "region": "中国",
      "role": "蜀汉丞相、政治家",
      "summary": "从地理、联盟和资源理解战略，不把演义中的神机妙算直接当作史实。",
      "anchorYear": 228,
      "tags": [
        "三国",
        "联盟",
        "战略"
      ],
      "eventIds": [
        "tc17"
      ],
      "facts": [
        {
          "label": "战略线索",
          "text": "《三国志》记下了他对荆州、益州与孙权联盟的分析。"
        },
        {
          "label": "史实与小说",
          "text": "史传、文学塑造和后世祭祀各有不同用途。"
        }
      ],
      "sources": [
        "zhuge-strategy"
      ],
      "image": {
        "src": "assets/people/zhuge-liang.jpg",
        "width": 330,
        "height": 669,
        "alt": "后世绘制的诸葛亮像。",
        "caption": "后世绘制的诸葛亮像。",
        "credit": "维基共享资源收录 · 公有领域",
        "source": "https://commons.wikimedia.org/wiki/File:%E6%98%8E%E4%BA%BA%E7%BB%98_%E3%80%8A%E8%AF%B8%E8%91%9B%E4%BA%AE%E5%83%8F%E3%80%8B%EF%BC%88%E5%8D%97%E8%96%B0%E6%AE%BF%E6%9C%AC%EF%BC%89.jpg"
      },
      "decisions": [
        {
          "id": "zhuge-liang-choice",
          "title": "弱势一方怎样安排根据地与盟友？",
          "period": "东汉末年的对策",
          "context": "刘备势力相对弱小，直接与强大对手竞争需要地盘、资源和合作条件。",
          "action": "提出经营荆、益地区、整顿内政、联合孙权等战略设想。",
          "outcome": "这些设想为刘备集团的发展提供了一套长期方向。",
          "limits": "战略依赖联盟与地盘等条件，后来的变化并不完全按设想展开。",
          "prompt": "一个计划需要盟友配合时，哪些变化会使它难以继续？",
          "sources": [
            "zhuge-strategy"
          ]
        }
      ]
    },
    {
      "id": "zhang-qian",
      "name": "张骞",
      "aliases": [],
      "group": "statecraft",
      "era": "empire",
      "born": null,
      "died": -114,
      "life": "西汉，卒于前 114 年（生年不详）",
      "region": "中国",
      "role": "使者、外交活动家",
      "summary": "出使经历既有漫长受阻，也有观察与交流；他的价值不能只用结盟成败衡量。",
      "anchorYear": -138,
      "tags": [
        "出使",
        "西域",
        "地理信息"
      ],
      "eventIds": [
        "tc14"
      ],
      "facts": [
        {
          "label": "第一次出使",
          "text": "原定联络大月氏的目标未能实现。"
        },
        {
          "label": "再次行动",
          "text": "后来再赴西域，并分遣使者联系其他地区。"
        }
      ],
      "sources": [
        "han-envoy"
      ],
      "image": {
        "src": "assets/people/zhang-qian.jpg",
        "width": 330,
        "height": 240,
        "alt": "敦煌壁画中的张骞出使场景，非汉代现场记录。",
        "caption": "敦煌壁画中的张骞出使场景，非汉代现场记录。",
        "credit": "维基共享资源收录 · 公有领域",
        "source": "https://commons.wikimedia.org/wiki/File:ZhangQianTravels.jpg"
      },
      "decisions": [
        {
          "id": "zhang-qian-choice",
          "title": "原定联盟难以实现，还要记录什么？",
          "period": "前 138 年起的出使经历",
          "context": "出使途中被扣留，抵达大月氏后，对方也没有接受原定军事联盟。",
          "action": "继续了解沿途国家的地理和社会情况，返汉报告，并参与后续出使。",
          "outcome": "带回的信息为汉朝认识西域和持续交往提供帮助。",
          "limits": "出使危险且耗时，既不能抹去失败，也不能把长期交流说成一人独力开创。",
          "prompt": "如果无法实现原计划，你会怎样区分失败、发现和新的可能？",
          "sources": [
            "han-envoy"
          ]
        }
      ]
    },
    {
      "id": "zhang-heng",
      "name": "张衡",
      "aliases": [],
      "group": "science",
      "era": "empire",
      "born": 78,
      "died": 139,
      "life": "78—139 年",
      "region": "中国",
      "role": "天文学家、仪器研究者",
      "summary": "把自然现象转化为可观察的信号；同时学习怎样区分古籍记载与现代复原。",
      "anchorYear": 132,
      "tags": [
        "天文",
        "地震",
        "仪器"
      ],
      "eventIds": [
        "tc43"
      ],
      "facts": [
        {
          "label": "史书记载",
          "text": "132 年制作候风地动仪，用于感知地震信息。"
        },
        {
          "label": "证据边界",
          "text": "原器已失传，今天看到的模型属于现代复原。"
        }
      ],
      "sources": [
        "zhang-seismoscope"
      ],
      "image": {
        "src": "assets/people/zhang-heng.jpg",
        "width": 330,
        "height": 495,
        "alt": "张衡墓地的现代纪念塑像。",
        "caption": "张衡墓地的现代纪念塑像。",
        "credit": "Windmemories 摄 · CC BY-SA 4.0",
        "source": "https://commons.wikimedia.org/wiki/File:20251004_Tomb_of_Zhang_Heng_03.jpg"
      },
      "decisions": [
        {
          "id": "zhang-heng-choice",
          "title": "怎样让不易察觉的震动留下信号？",
          "period": "132 年",
          "context": "远方地震的震动未必能被当地人直接察觉，记录自然现象需要工具。",
          "action": "设计地动仪，把感震信息转化为可辨认的机械信号。",
          "outcome": "史书记载为认识古代地震观测提供了重要线索。",
          "limits": "原器与完整技术细节没有保存下来，不同复原方案需要分别验证；它不是预测未来地震的仪器。",
          "prompt": "模型能运转，是否就足以证明古代原器内部一定如此？",
          "sources": [
            "zhang-seismoscope"
          ]
        }
      ]
    },
    {
      "id": "zu-chongzhi",
      "name": "祖冲之",
      "aliases": [],
      "group": "science",
      "era": "migration",
      "born": 429,
      "died": 500,
      "life": "429—500 年",
      "region": "中国",
      "role": "数学家、天文学家",
      "summary": "从圆周率的上下界，认识精确计算与近似数，也保留方法失传带来的不确定性。",
      "anchorYear": 465,
      "tags": [
        "圆周率",
        "近似",
        "历法"
      ],
      "eventIds": [
        "tc19"
      ],
      "facts": [
        {
          "label": "一个比例",
          "text": "π 是圆周长与直径的比。"
        },
        {
          "label": "数值证据",
          "text": "他给出 3.1415926＜π＜3.1415927，并留下密率 355／113。"
        }
      ],
      "sources": [
        "zu-pi"
      ],
      "image": {
        "src": "assets/people/zu-chongzhi.jpg",
        "width": 330,
        "height": 496,
        "alt": "祖冲之的现代纪念雕塑。",
        "caption": "祖冲之的现代纪念雕塑。",
        "credit": "三猎 摄 · CC BY-SA 4.0",
        "source": "https://commons.wikimedia.org/wiki/File:%E7%A5%96%E5%86%B2%E4%B9%8B%E9%93%9C%E5%83%8F.jpg"
      },
      "decisions": [
        {
          "id": "zu-chongzhi-choice",
          "title": "接近一个数，怎样说明到底有多接近？",
          "period": "5 世纪",
          "context": "测量圆形和计算面积需要圆周率，只说一个近似数还不能说明误差大小。",
          "action": "给出圆周率不足与过剩的两个界限，并使用分数近似。",
          "outcome": "上下界让结果的精度变得可以比较，成为古代数学的重要成果。",
          "limits": "《缀术》已失传，现代课堂中的割圆演示不能直接当成他的完整计算记录。",
          "prompt": "只写「大约 3.14」，与同时写明上下界，有什么不同？",
          "sources": [
            "zu-pi"
          ]
        }
      ]
    },
    {
      "id": "shen-kuo",
      "name": "沈括",
      "aliases": [],
      "group": "science",
      "era": "golden",
      "born": 1031,
      "died": 1095,
      "life": "1031—1095 年",
      "region": "中国",
      "role": "科学家、博物学家",
      "summary": "把观察、见闻与技术写进笔记，帮助我们同时认识知识的发现者和记录者。",
      "anchorYear": 1088,
      "tags": [
        "梦溪笔谈",
        "观察",
        "技术记录"
      ],
      "eventIds": [
        "tc24"
      ],
      "facts": [
        {
          "label": "工作领域",
          "text": "研究天文仪器、数学、地磁等问题。"
        },
        {
          "label": "保存技术",
          "text": "《梦溪笔谈》记述毕昇活字，记录者不等于发明者。"
        }
      ],
      "sources": [
        "shen-book"
      ],
      "image": {
        "src": "assets/people/shen-kuo.jpg",
        "width": 330,
        "height": 302,
        "alt": "沈括的现代纪念塑像。",
        "caption": "沈括的现代纪念塑像。",
        "credit": "Hans A. Rosbach 摄 · CC BY-SA 3.0",
        "source": "https://commons.wikimedia.org/wiki/File:Beijing_Ancient_Observatory_20090715-19_%28cropped%29.jpg"
      },
      "decisions": [
        {
          "id": "shen-kuo-choice",
          "title": "为什么要把具体做法写下来？",
          "period": "北宋晚年编写《梦溪笔谈》",
          "context": "工匠经验和个人见闻容易随着人和环境改变而散失。",
          "action": "把长期观察、技术见闻与不同领域的问题整理为文字。",
          "outcome": "后人得以研究北宋技术与知识，其中包括小人物的贡献。",
          "limits": "笔记混合亲见、转述和解释，读者仍要核对每一条材料的证据强弱。",
          "prompt": "一项发明被谁记录、被谁制作、被谁改进，是同一个问题吗？",
          "sources": [
            "shen-book"
          ]
        }
      ]
    },
    {
      "id": "xu-guangqi",
      "name": "徐光启",
      "aliases": [],
      "group": "science",
      "era": "voyage",
      "born": 1562,
      "died": 1633,
      "life": "1562—1633 年",
      "region": "中国",
      "role": "科学家、翻译者、官员",
      "summary": "在农业、数学和历法之间工作，尝试用翻译、比较和实践连接不同知识传统。",
      "anchorYear": 1607,
      "tags": [
        "几何原本",
        "翻译",
        "农业"
      ],
      "eventIds": [
        "tc49",
        "tc71"
      ],
      "facts": [
        {
          "label": "合作翻译",
          "text": "与利玛窦合作翻译《几何原本》前六卷。"
        },
        {
          "label": "研究方法",
          "text": "也重视农作物调查与农业知识整理。"
        }
      ],
      "sources": [
        "xu-science",
        "xu-galileo"
      ],
      "image": {
        "src": "assets/people/xu-guangqi.jpg",
        "width": 330,
        "height": 494,
        "alt": "历史版画：左为利玛窦，右为徐光启。",
        "caption": "历史版画：左为利玛窦，右为徐光启。",
        "credit": "维基共享资源收录 · 公有领域",
        "source": "https://commons.wikimedia.org/wiki/File:Kircher_-_Toonneel_van_China_-_Ricci_and_Guangqi.jpg"
      },
      "decisions": [
        {
          "id": "xu-guangqi-choice",
          "title": "面对新的知识，怎样让更多人理解？",
          "period": "1607 年前后",
          "context": "欧几里得几何使用一套严格证明的方法，翻译还涉及术语和推理的表达。",
          "action": "与利玛窦合作，把《几何原本》前六卷译成中文。",
          "outcome": "中文读者获得了系统认识几何定义、命题与证明的新材料。",
          "limits": "翻译是合作与长期传播的过程；不能把近代数学的变化归于一次出版。",
          "prompt": "翻译一个数学名词，为什么还需要理解它在证明中的作用？",
          "sources": [
            "xu-science",
            "xu-galileo"
          ]
        }
      ]
    },
    {
      "id": "galileo",
      "name": "伽利略",
      "aliases": [
        "Galileo Galilei"
      ],
      "group": "science",
      "era": "voyage",
      "born": 1564,
      "died": 1642,
      "life": "1564—1642 年",
      "region": "意大利",
      "role": "天文学家、物理学研究者",
      "summary": "改进观测工具，把看到的天象变成可比较的记录，推动人们重新检视旧解释。",
      "anchorYear": 1610,
      "tags": [
        "望远镜",
        "木星卫星",
        "观测"
      ],
      "eventIds": [
        "tw54"
      ],
      "facts": [
        {
          "label": "观测工具",
          "text": "1609 年改进望远镜，并用于天文观察。"
        },
        {
          "label": "重要发现",
          "text": "观察月面与木星卫星，推动关于天体的讨论。"
        }
      ],
      "sources": [
        "galileo-museum"
      ],
      "image": {
        "src": "assets/people/galileo.jpg",
        "width": 330,
        "height": 419,
        "alt": "伽利略肖像画。",
        "caption": "伽利略肖像画。",
        "credit": "维基共享资源收录 · 公有领域",
        "source": "https://commons.wikimedia.org/wiki/File:Galileo_Galilei_(1564-1642)_RMG_BHC2700.tiff"
      },
      "decisions": [
        {
          "id": "galileo-choice",
          "title": "新仪器看到的东西，怎样成为证据？",
          "period": "1609—1610 年",
          "context": "望远镜能显示肉眼看不到的细节，但新景象也可能受到仪器和观察条件影响。",
          "action": "连续观测并记录天体，把结果用于检验既有看法。",
          "outcome": "木星卫星等发现使「所有天体都绕地球运行」的看法面临挑战。",
          "limits": "一次观察不能证明所有宇宙模型；仪器误差、重复观测与解释都需要讨论。",
          "prompt": "要让别人相信你看到的现象，应留下哪些记录？",
          "sources": [
            "galileo-museum"
          ]
        }
      ]
    },
    {
      "id": "newton",
      "name": "牛顿",
      "aliases": [
        "Isaac Newton"
      ],
      "group": "science",
      "era": "change",
      "born": 1643,
      "died": 1727,
      "life": "1643—1727 年（按公历）",
      "region": "英国",
      "role": "数学家、物理学家",
      "summary": "把地面运动与天体运动放进同一套数学研究中，也让科学著作的合作过程可见。",
      "anchorYear": 1687,
      "tags": [
        "力学",
        "引力",
        "数学"
      ],
      "eventIds": [
        "tw141"
      ],
      "facts": [
        {
          "label": "核心著作",
          "text": "1687 年出版《自然哲学的数学原理》。"
        },
        {
          "label": "合作背景",
          "text": "哈雷的推动与支持参与了这部著作的出版。"
        }
      ],
      "sources": [
        "newton-project"
      ],
      "image": {
        "src": "assets/people/newton.jpg",
        "width": 330,
        "height": 397,
        "alt": "牛顿肖像画。",
        "caption": "牛顿肖像画。",
        "credit": "维基共享资源收录 · 公有领域",
        "source": "https://commons.wikimedia.org/wiki/File:Portrait_of_Sir_Isaac_Newton%2C_1689_%28brightened%29.jpg"
      },
      "decisions": [
        {
          "id": "newton-choice",
          "title": "能否用共同规律研究地上与天上的运动？",
          "period": "1687 年",
          "context": "物体下落、月球运动与行星轨道，看起来是不同尺度的问题。",
          "action": "在《原理》中以数学方式组织运动与引力研究。",
          "outcome": "形成影响深远的力学框架，使更多现象可以用共同方法比较。",
          "limits": "科学规律有适用范围，成果也依赖此前研究、观测与同行交流，不能只靠天才故事解释。",
          "prompt": "如果一种规律要解释许多现象，你会怎样检验它？",
          "sources": [
            "newton-project"
          ]
        }
      ]
    },
    {
      "id": "sima-qian",
      "name": "司马迁",
      "aliases": [
        "太史公"
      ],
      "group": "literature",
      "era": "empire",
      "born": -145,
      "died": null,
      "life": "约前 145 年出生，卒年不详",
      "region": "中国",
      "role": "史学家、文学家",
      "summary": "把帝王、制度与不同人物放进同一部通史，也让史家的处境成为读史的一部分。",
      "anchorYear": -91,
      "tags": [
        "史记",
        "纪传体",
        "史料"
      ],
      "eventIds": [
        "tc42"
      ],
      "facts": [
        {
          "label": "作品结构",
          "text": "《史记》用本纪、世家、列传等不同部分组织历史。"
        },
        {
          "label": "材料意识",
          "text": "既要读他写了什么，也要问材料从哪里来。"
        }
      ],
      "sources": [
        "sima-bio",
        "sima-letter"
      ],
      "image": {
        "src": "assets/people/sima-qian.jpg",
        "width": 330,
        "height": 337,
        "alt": "后世绘制的司马迁像。",
        "caption": "后世绘制的司马迁像。",
        "credit": "维基共享资源收录 · 公有领域",
        "source": "https://commons.wikimedia.org/wiki/File:Si_maqian.jpg"
      },
      "decisions": [
        {
          "id": "sima-qian-choice",
          "title": "遭受重创之后，是否继续完成史书？",
          "period": "西汉，撰写《史记》期间",
          "context": "司马迁遭受刑罚，在个人处境与著述目标之间承受巨大压力。",
          "action": "继续整理史料、撰写史书，并在《报任安书》中解释自己的选择。",
          "outcome": "《史记》留下跨越久远年代、围绕不同人物展开的历史叙述。",
          "limits": "史家有材料限制与个人视角，不能把一部史书等同于过去的全部事实。",
          "prompt": "读一段传记时，你会怎样区分人物原话、史家判断和后人解释？",
          "sources": [
            "sima-bio",
            "sima-letter"
          ]
        }
      ]
    },
    {
      "id": "li-bai",
      "name": "李白",
      "aliases": [
        "太白",
        "青莲居士"
      ],
      "group": "literature",
      "era": "golden",
      "born": 701,
      "died": 762,
      "life": "701—762 年",
      "region": "中国",
      "role": "诗人",
      "summary": "从长安经历、漫游与诗歌表达，认识理想、仕途和个人声音之间的张力。",
      "anchorYear": 744,
      "tags": [
        "唐诗",
        "漫游",
        "想象"
      ],
      "eventIds": [
        "tc46"
      ],
      "facts": [
        {
          "label": "创作特点",
          "text": "诗歌常以强烈想象、鲜明情感与灵活语言展开。"
        },
        {
          "label": "交往线索",
          "text": "744 年与杜甫相遇，诗作保存了彼此交往的线索。"
        }
      ],
      "sources": [
        "li-bio",
        "li-du"
      ],
      "image": {
        "src": "assets/people/li-bai.jpg",
        "width": 330,
        "height": 546,
        "alt": "后世绘制的李白像。",
        "caption": "后世绘制的李白像。",
        "credit": "维基共享资源收录 · 公有领域",
        "source": "https://commons.wikimedia.org/wiki/File:LiBai.jpg"
      },
      "decisions": [
        {
          "id": "li-bai-choice",
          "title": "离开长安之后，怎样继续表达自己的理想？",
          "period": "744 年以后",
          "context": "供奉翰林的经历没有满足他的政治抱负，随后离开长安。",
          "action": "继续漫游与写作，在诗中表达理想、失意和对生活的感受。",
          "outcome": "政治际遇没有结束他的创作，诗歌成为认识其精神世界的重要材料。",
          "limits": "离开长安并非不受环境制约的自由选择，诗中的自我形象也有艺术加工。",
          "prompt": "一个人的职位和作品，能否分别告诉我们不同的事情？",
          "sources": [
            "li-bio",
            "li-du"
          ]
        }
      ]
    },
    {
      "id": "du-fu",
      "name": "杜甫",
      "aliases": [
        "子美",
        "少陵野老"
      ],
      "group": "literature",
      "era": "golden",
      "born": 712,
      "died": 770,
      "life": "712—770 年",
      "region": "中国",
      "role": "诗人",
      "summary": "把战争与流离写进具体人物的生活，使宏大的时代变化具有可感的细节。",
      "anchorYear": 759,
      "tags": [
        "唐诗",
        "民生",
        "战争"
      ],
      "eventIds": [
        "tc46"
      ],
      "facts": [
        {
          "label": "观察入口",
          "text": "《石壕吏》从一户人家的遭遇呈现战乱压力。"
        },
        {
          "label": "后世书写",
          "text": "《蜀相》追怀诸葛亮，是唐人理解前代人物的一条线索。"
        }
      ],
      "sources": [
        "du-poem",
        "du-zhuge",
        "li-du"
      ],
      "image": {
        "src": "assets/people/du-fu.jpg",
        "width": 330,
        "height": 457,
        "alt": "后世绘制的杜甫像。",
        "caption": "后世绘制的杜甫像。",
        "credit": "维基共享资源收录 · 公有领域",
        "source": "https://commons.wikimedia.org/wiki/File:Dufu.jpg"
      },
      "decisions": [
        {
          "id": "du-fu-choice",
          "title": "写战争，为什么从一户人家写起？",
          "period": "《石壕吏》等诗的创作",
          "context": "战乱不仅改变战场局势，也改变普通家庭的生活。",
          "action": "用人物对话和生活场景，让征役、伤亡与离别进入诗歌。",
          "outcome": "读者能从具体处境理解战争的社会影响。",
          "limits": "诗歌包含叙述选择与艺术加工，不应直接当作完整的逐日实录。",
          "prompt": "如果只记录一场战争的胜负，会漏掉哪些人的经历？",
          "sources": [
            "du-poem",
            "du-zhuge",
            "li-du"
          ]
        }
      ]
    },
    {
      "id": "su-shi",
      "name": "苏轼",
      "aliases": [
        "苏东坡",
        "子瞻"
      ],
      "group": "literature",
      "era": "golden",
      "born": 1037,
      "died": 1101,
      "life": "1037—1101 年",
      "region": "中国",
      "role": "文学家、书画家",
      "summary": "文学、书法与绘画相互贯通；从黄州作品观察个人遭遇怎样转化为表达。",
      "anchorYear": 1082,
      "tags": [
        "宋词",
        "赤壁赋",
        "书画"
      ],
      "eventIds": [
        "tc67"
      ],
      "facts": [
        {
          "label": "文学线索",
          "text": "1082 年在黄州写下前、后《赤壁赋》等作品。"
        },
        {
          "label": "多种身份",
          "text": "既写诗文，也参与书法与绘画实践。"
        }
      ],
      "sources": [
        "su-redcliff"
      ],
      "image": {
        "src": "assets/people/su-shi.jpg",
        "width": 330,
        "height": 777,
        "alt": "后世流传的苏轼绘像。",
        "caption": "后世流传的苏轼绘像。",
        "credit": "维基共享资源收录 · 公有领域",
        "source": "https://commons.wikimedia.org/wiki/File:Su_shi.jpg"
      },
      "decisions": [
        {
          "id": "su-shi-choice",
          "title": "身处逆境，怎样把一次出游写成思考？",
          "period": "1082 年，黄州",
          "context": "被贬黄州后，他面对政治失意，也有新的生活与自然观察。",
          "action": "把赤壁出游的所见、对话与感受组织为文学作品。",
          "outcome": "个人经验与历史想象、自然感受相结合，形成流传深远的篇章。",
          "limits": "作品中的赤壁意象不能简单当作古战场的实地证明，也不能概括他全部的政治态度。",
          "prompt": "同一处风景，为什么会使处境不同的人写出不同的文章？",
          "sources": [
            "su-redcliff"
          ]
        }
      ]
    },
    {
      "id": "cao-xueqin",
      "name": "曹雪芹",
      "aliases": [
        "曹霑"
      ],
      "group": "literature",
      "era": "change",
      "born": null,
      "died": null,
      "life": "清代，18 世纪（生卒年有异说）",
      "region": "中国",
      "role": "小说家",
      "summary": "以人物日常、诗词和家族兴衰组织长篇小说，也把版本问题带进阅读。",
      "anchorYear": 1760,
      "tags": [
        "红楼梦",
        "小说",
        "版本"
      ],
      "eventIds": [
        "tc50"
      ],
      "facts": [
        {
          "label": "作品",
          "text": "与《红楼梦》前八十回的创作、整理密切相关。"
        },
        {
          "label": "版本意识",
          "text": "不同抄本、评语与后四十回的整理问题，需要分别讨论。"
        }
      ],
      "sources": [
        "cao-editions",
        "cao-reading"
      ],
      "image": {
        "src": "assets/people/cao-xueqin.jpg",
        "width": 330,
        "height": 440,
        "alt": "曹雪芹的现代纪念雕塑。",
        "caption": "曹雪芹的现代纪念雕塑。",
        "credit": "Yongxinge 摄 · CC BY-SA 3.0",
        "source": "https://commons.wikimedia.org/wiki/File:Statue_of_Cao_Xueqin.JPG"
      },
      "decisions": [
        {
          "id": "cao-xueqin-choice",
          "title": "怎样用日常生活写出一个复杂的世界？",
          "period": "18 世纪，《红楼梦》的创作与整理",
          "context": "长篇小说要容纳许多人物、家庭关系与不同立场。",
          "action": "通过日常对话、诗词、情节与多个人物的处境组织叙事。",
          "outcome": "读者能从个人生活进入家族与社会，也能比较不同人物的看法。",
          "limits": "这里讨论作品中可观察的写法，不虚构作者私下的决策过程；成书与续作仍有版本争议。",
          "prompt": "小说人物说的话，能不能都直接当成作者本人的观点？",
          "sources": [
            "cao-editions",
            "cao-reading"
          ]
        }
      ]
    },
    {
      "id": "shakespeare",
      "name": "莎士比亚",
      "aliases": [
        "William Shakespeare"
      ],
      "group": "literature",
      "era": "voyage",
      "born": 1564,
      "died": 1616,
      "life": "1564—1616 年",
      "region": "英国",
      "role": "剧作家、演员",
      "summary": "戏剧不仅有作者，也依赖演员、剧场、经营和观众，是协作完成的艺术。",
      "anchorYear": 1599,
      "tags": [
        "戏剧",
        "环球剧场",
        "协作"
      ],
      "eventIds": [
        "tw33"
      ],
      "facts": [
        {
          "label": "多种工作",
          "text": "写剧本、表演，也参与剧团与剧场经营。"
        },
        {
          "label": "文书证据",
          "text": "1599 年环球剧场用地租约记录了相关参与者。"
        }
      ],
      "sources": [
        "shakespeare-lease",
        "shakespeare-life"
      ],
      "image": {
        "src": "assets/people/shakespeare.jpg",
        "width": 330,
        "height": 421,
        "alt": "传统认作莎士比亚的肖像画。",
        "caption": "传统认作莎士比亚的肖像画。",
        "credit": "维基共享资源收录 · 公有领域",
        "source": "https://commons.wikimedia.org/wiki/File:William_Shakespeare_by_John_Taylor%2C_edited.jpg"
      },
      "decisions": [
        {
          "id": "shakespeare-choice",
          "title": "写作者为什么也参与剧场经营？",
          "period": "1599 年",
          "context": "剧团需要稳定的演出场所，建设与经营剧场涉及资金和共同责任。",
          "action": "与剧团成员等共同参与环球剧场的租约与经营安排。",
          "outcome": "创作、演出和经营更紧密地结合在一起。",
          "limits": "租约能说明产权和参与关系，却不能直接证明每个人的全部动机。",
          "prompt": "一部舞台作品成功，除了作者，还需要哪些人的工作？",
          "sources": [
            "shakespeare-lease"
          ]
        }
      ]
    },
    {
      "id": "wang-xizhi",
      "name": "王羲之",
      "aliases": [
        "逸少",
        "王右军"
      ],
      "group": "art",
      "era": "migration",
      "born": null,
      "died": null,
      "life": "东晋，4 世纪（生卒年有异说）",
      "region": "中国",
      "role": "书法家",
      "summary": "从《兰亭序》的书写与后世摹刻，观察作品怎样在原迹失传后继续传播。",
      "anchorYear": 353,
      "tags": [
        "书法",
        "兰亭序",
        "摹本"
      ],
      "eventIds": [
        "tc44"
      ],
      "facts": [
        {
          "label": "创作线索",
          "text": "353 年兰亭雅集后写下序文。"
        },
        {
          "label": "传播线索",
          "text": "今天认识这件作品，离不开后世摹本、刻帖和著录。"
        }
      ],
      "sources": [
        "wang-lanting"
      ],
      "image": {
        "src": "assets/history/lanting.jpg",
        "width": 1093,
        "height": 1600,
        "alt": "《兰亭序》摹本，属于书法作品，非人物肖像。",
        "caption": "《兰亭序》摹本，属于书法作品，非人物肖像。",
        "credit": "传唐冯承素摹 · 故宫博物院藏 · 公有领域",
        "source": "https://commons.wikimedia.org/wiki/File:XingshuLantingxv.jpg"
      },
      "decisions": [
        {
          "id": "wang-xizhi-choice",
          "title": "书写怎样兼顾文字内容与笔势变化？",
          "period": "353 年，《兰亭序》",
          "context": "一篇雅集序文既有叙事与感慨，也需要通过书写形成节奏。",
          "action": "以流动的行书组织字形与笔势，形成后来反复学习的范本。",
          "outcome": "作品在收藏、临摹与刻帖中持续传播，影响后世书法。",
          "limits": "原迹今不存，传世摹刻本各有传承条件，不能把复制品误作当年原稿。",
          "prompt": "看一件摹本时，你最需要知道哪些与原作有关的信息？",
          "sources": [
            "wang-lanting"
          ]
        }
      ]
    },
    {
      "id": "gu-kaizhi",
      "name": "顾恺之",
      "aliases": [
        "长康"
      ],
      "group": "art",
      "era": "migration",
      "born": 345,
      "died": 406,
      "life": "约 345—406 年",
      "region": "中国",
      "role": "画家、绘画理论家",
      "summary": "从形似进入神情：画人的五官，也要思考姿态、眼神和人物气质。",
      "anchorYear": 380,
      "tags": [
        "人物画",
        "传神",
        "绘画理论"
      ],
      "eventIds": [],
      "facts": [
        {
          "label": "核心问题",
          "text": "人物画不只追求外形，还要表现人物精神状态。"
        },
        {
          "label": "证据类型",
          "text": "画论与后世摹本共同帮助我们认识他的艺术。"
        }
      ],
      "sources": [
        "gu-painting"
      ],
      "image": {
        "src": "assets/people/gu-kaizhi.jpg",
        "width": 1258,
        "height": 500,
        "alt": "传顾恺之《洛神赋图》卷的宋代摹本局部，非人物肖像。",
        "caption": "传顾恺之《洛神赋图》卷的宋代摹本局部，非人物肖像。",
        "credit": "故宫博物院藏 · 故宫博物院官网教学图像",
        "source": "https://www.dpm.org.cn/collection/paint/234597.html"
      },
      "decisions": [
        {
          "id": "gu-kaizhi-choice",
          "title": "画得像之外，还要画出什么？",
          "period": "东晋的人物画与画论",
          "context": "画出身体和衣服的轮廓，并不一定能让人物显得有生命。",
          "action": "重视神情与眼神等细节，把人物内在状态纳入绘画讨论。",
          "outcome": "关于形与神的思考成为中国人物画理论的重要线索。",
          "limits": "这是依据画论讨论创作方法，不把后世故事都当作可核实的现场记录。",
          "prompt": "同样的五官，眼神和姿态改变后，人物给你的感觉会怎样变化？",
          "sources": [
            "gu-painting"
          ]
        }
      ]
    },
    {
      "id": "wu-daozi",
      "name": "吴道子",
      "aliases": [
        "吴道玄"
      ],
      "group": "art",
      "era": "golden",
      "born": null,
      "died": null,
      "life": "唐代，7—8 世纪（生卒年不详）",
      "region": "中国",
      "role": "画家",
      "summary": "观察线条怎样带出衣纹和动势，也把对大师的传说与作品归属问题分开。",
      "anchorYear": 740,
      "tags": [
        "线描",
        "人物画",
        "宗教艺术"
      ],
      "eventIds": [],
      "facts": [
        {
          "label": "绘画领域",
          "text": "擅长道释人物，也画山水等题材。"
        },
        {
          "label": "表达线索",
          "text": "线条的轻重、转折与节奏，是理解人物动势的入口。"
        }
      ],
      "sources": [
        "wu-painting"
      ],
      "image": {
        "src": "assets/people/wu-daozi.jpg",
        "width": 350,
        "height": 640,
        "alt": "传吴道子所绘孔子像的后世图像，画中是孔子，非吴道子本人。",
        "caption": "传吴道子所绘孔子像的后世图像，画中是孔子，非吴道子本人。",
        "credit": "维基共享资源收录 · 公有领域",
        "source": "https://commons.wikimedia.org/wiki/File:Confucius_Tang_Dynasty.jpg"
      },
      "decisions": [
        {
          "id": "wu-daozi-choice",
          "title": "怎样用线条表现人物的动势？",
          "period": "唐代的绘画实践",
          "context": "人物画需要在平面上表现身体、衣纹和动作的关系。",
          "action": "在人物造型中重视线条的力度、变化与节奏。",
          "outcome": "相关画法和后世论述成为认识唐代人物画的重要材料。",
          "limits": "具体作品需核查归属与摹本身份，不能仅凭名气或传说认定真迹。",
          "prompt": "同一个衣袖，用细直线与有转折的粗细线描画，感觉会有什么不同？",
          "sources": [
            "wu-painting"
          ]
        }
      ]
    },
    {
      "id": "zhang-zeduan",
      "name": "张择端",
      "aliases": [
        "正道"
      ],
      "group": "art",
      "era": "golden",
      "born": null,
      "died": null,
      "life": "北宋，约 11—12 世纪（生卒年不详）",
      "region": "中国",
      "role": "画家",
      "summary": "在一卷画里沿河入城，观察劳动、交通与商业怎样组成城市生活。",
      "anchorYear": 1100,
      "tags": [
        "清明上河图",
        "城市",
        "长卷"
      ],
      "eventIds": [
        "tc68"
      ],
      "facts": [
        {
          "label": "代表作",
          "text": "《清明上河图》以长卷展示北宋城市与社会生活。"
        },
        {
          "label": "观察方法",
          "text": "沿画卷寻找桥梁、船只、店铺与不同人物的活动。"
        }
      ],
      "sources": [
        "zhang-scroll"
      ],
      "image": {
        "src": "assets/people/zhang-zeduan.jpg",
        "width": 1258,
        "height": 500,
        "alt": "张择端《清明上河图》卷局部，属于作品，非人物肖像。",
        "caption": "张择端《清明上河图》卷局部，属于作品，非人物肖像。",
        "credit": "故宫博物院藏 · 故宫博物院官网教学图像",
        "source": "https://www.dpm.org.cn/collection/paint/228226.html"
      },
      "decisions": [
        {
          "id": "zhang-zeduan-choice",
          "title": "怎样把一座城市放进一卷画？",
          "period": "北宋，《清明上河图》",
          "context": "城市活动分布在不同地点，固定在单一视点很难同时看到全部。",
          "action": "用长卷组织沿途景象，随着观看展开不同地点与人物活动。",
          "outcome": "交通、商业、劳动与生活细节被组织成连续的观看路径。",
          "limits": "画卷是经过选择的艺术表达，不是完整人口调查或所有街道的精确地图。",
          "prompt": "如果给家乡画一幅长卷，你会先决定沿哪条路线观察？",
          "sources": [
            "zhang-scroll"
          ]
        }
      ]
    },
    {
      "id": "leonardo",
      "name": "达·芬奇",
      "aliases": [
        "列奥纳多",
        "Leonardo da Vinci"
      ],
      "group": "art",
      "era": "voyage",
      "born": 1452,
      "died": 1519,
      "life": "1452—1519 年",
      "region": "意大利",
      "role": "画家、自然研究者",
      "summary": "用素描记录自然观察，把艺术表达与对人体、运动和形态的研究相连。",
      "anchorYear": 1503,
      "tags": [
        "素描",
        "自然观察",
        "文艺复兴"
      ],
      "eventIds": [
        "tw31"
      ],
      "facts": [
        {
          "label": "研究工具",
          "text": "绘画和素描也是他记录观察、探索自然的方法。"
        },
        {
          "label": "多种领域",
          "text": "艺术与技术研究相互交织，并非简单地各自分开。"
        }
      ],
      "sources": [
        "leonardo-study"
      ],
      "image": {
        "src": "assets/people/leonardo.png",
        "width": 330,
        "height": 473,
        "alt": "传梅尔齐绘制的达·芬奇肖像。",
        "caption": "传梅尔齐绘制的达·芬奇肖像。",
        "credit": "维基共享资源收录 · 公有领域",
        "source": "https://commons.wikimedia.org/wiki/File:Francesco_Melzi_-_Portrait_of_Leonardo_%28colour_correction%29.png"
      },
      "decisions": [
        {
          "id": "leonardo-choice",
          "title": "素描只能用来完成一幅画吗？",
          "period": "文艺复兴时期的研究与创作",
          "context": "人体、植物、水流等现象形态复杂，记忆难以保存全部细节。",
          "action": "通过观察与反复绘图，记录形态、动作和结构问题。",
          "outcome": "图像成为研究工具，也为艺术创作积累新的表达方法。",
          "limits": "笔记中的设想不等于已经制造成功的机器，观察、假设和实现应分别判断。",
          "prompt": "画一张观察图，与只写一句结论，分别能保留什么信息？",
          "sources": [
            "leonardo-study"
          ]
        }
      ]
    },
    {
      "id": "michelangelo",
      "name": "米开朗琪罗",
      "aliases": [
        "Michelangelo"
      ],
      "group": "art",
      "era": "voyage",
      "born": 1475,
      "died": 1564,
      "life": "1475—1564 年",
      "region": "意大利",
      "role": "雕塑家、画家、建筑师",
      "summary": "从材料条件和城市委托理解艺术创作：作品既是个人实践，也处于社会环境中。",
      "anchorYear": 1504,
      "tags": [
        "雕塑",
        "大卫",
        "材料"
      ],
      "eventIds": [
        "tw140"
      ],
      "facts": [
        {
          "label": "代表作",
          "text": "1501—1504 年完成大理石雕像《大卫》。"
        },
        {
          "label": "材料条件",
          "text": "雕像使用了此前已经被其他雕刻者处理过的石块。"
        }
      ],
      "sources": [
        "michelangelo-david",
        "florence-artists"
      ],
      "image": {
        "src": "assets/people/michelangelo.jpg",
        "width": 330,
        "height": 382,
        "alt": "米开朗琪罗肖像画。",
        "caption": "米开朗琪罗肖像画。",
        "credit": "维基共享资源收录 · 公有领域",
        "source": "https://commons.wikimedia.org/wiki/File:Michelangelo_Daniele_da_Volterra_%28dettaglio%29.jpg"
      },
      "decisions": [
        {
          "id": "michelangelo-choice",
          "title": "接手一块已经被加工过的石材，怎样继续创作？",
          "period": "1501—1504 年",
          "context": "委托提供的是一块此前已有雕刻尝试、后来被搁置的大理石。",
          "action": "接下委托，根据石材条件完成《大卫》的雕刻。",
          "outcome": "作品在佛罗伦萨公开展示，并进入城市公共生活。",
          "limits": "完成作品依赖材料、委托和工匠环境，不能只用不受限制的灵感来解释。",
          "prompt": "已有材料会怎样限制创作，又可能激发哪些新的办法？",
          "sources": [
            "michelangelo-david",
            "florence-artists"
          ]
        }
      ]
    }
  ],
  "relations": [
    {
      "id": "han-zhang",
      "from": "han-wudi",
      "to": "zhang-qian",
      "kind": "service",
      "label": "派遣出使",
      "note": "汉武帝派张骞出使西域。双方角色不同：一方提出国家目标，一方经历具体旅程与交涉。",
      "sources": [
        "han-envoy"
      ]
    },
    {
      "id": "han-sima",
      "from": "han-wudi",
      "to": "sima-qian",
      "kind": "service",
      "label": "同朝任职",
      "note": "司马迁在汉武帝时期任职并著史。任职关系不表示对君主的全部行动都持同一态度。",
      "sources": [
        "sima-bio",
        "sima-letter"
      ]
    },
    {
      "id": "qin-sima",
      "from": "sima-qian",
      "to": "qin-shihuang",
      "kind": "reception",
      "label": "史传书写",
      "note": "《史记》记述秦始皇。司马迁生活得更晚，两人没有见面；这是史家对前代的书写。",
      "sources": [
        "sima-bio"
      ]
    },
    {
      "id": "tang-wu",
      "from": "tang-taizong",
      "to": "wu-zetian",
      "kind": "service",
      "label": "宫廷经历",
      "note": "武则天曾为唐太宗才人，后来在唐高宗时期继续参与政治，最终建立武周。",
      "sources": [
        "wu-court"
      ]
    },
    {
      "id": "tang-wang",
      "from": "tang-taizong",
      "to": "wang-xizhi",
      "kind": "reception",
      "label": "后世推崇",
      "note": "唐太宗推崇王羲之并参与作品收藏与传播。二人相隔数百年，不是君臣或朋友。",
      "sources": [
        "wang-lanting"
      ]
    },
    {
      "id": "li-du",
      "from": "li-bai",
      "to": "du-fu",
      "kind": "contact",
      "label": "诗人交往",
      "note": "李白与杜甫在 744 年相遇，后有交游与诗歌唱和。作品中的表达也带有各自视角。",
      "sources": [
        "li-du"
      ]
    },
    {
      "id": "du-zhuge",
      "from": "du-fu",
      "to": "zhuge-liang",
      "kind": "reception",
      "label": "诗中追怀",
      "note": "杜甫用《蜀相》追怀诸葛亮。这是唐人对三国人物的理解，不是两人的直接交往。",
      "sources": [
        "du-zhuge"
      ]
    },
    {
      "id": "cao-du",
      "from": "cao-xueqin",
      "to": "du-fu",
      "kind": "reception",
      "label": "作品中的阅读线索",
      "note": "《红楼梦》第四十八回借人物谈论杜诗等阅读材料，说明作品中的文学联系，不是两人的师生关系。",
      "sources": [
        "cao-reading"
      ]
    },
    {
      "id": "su-shen",
      "from": "su-shi",
      "to": "shen-kuo",
      "kind": "contemporary",
      "label": "同在北宋",
      "note": "两人的生平都处于北宋，可比较文学表达与知识记录；本线不主张他们曾经会面。",
      "sources": [
        "su-redcliff",
        "shen-book"
      ]
    },
    {
      "id": "li-wu-art",
      "from": "li-bai",
      "to": "wu-daozi",
      "kind": "contemporary",
      "label": "盛唐文艺背景",
      "note": "以盛唐的诗歌和人物画作横向比较。本线只表示时代背景，不表示二人相识。",
      "sources": [
        "li-bio",
        "wu-painting"
      ]
    },
    {
      "id": "wang-gu",
      "from": "wang-xizhi",
      "to": "gu-kaizhi",
      "kind": "contemporary",
      "label": "东晋书画背景",
      "note": "从东晋书法和人物画比较不同艺术语言；生卒信息有不确定处，不据此推定交往。",
      "sources": [
        "wang-lanting",
        "gu-painting"
      ]
    },
    {
      "id": "su-zhang-art",
      "from": "su-shi",
      "to": "zhang-zeduan",
      "kind": "contemporary",
      "label": "北宋生活与艺术",
      "note": "以北宋为共同背景，比较文人的书写和画卷中的城市生活，不把同代等同于相识。",
      "sources": [
        "su-redcliff",
        "zhang-scroll"
      ]
    },
    {
      "id": "zhang-zu",
      "from": "zhang-heng",
      "to": "zu-chongzhi",
      "kind": "theme",
      "label": "天文与计算",
      "note": "两人都把天文与定量研究联系起来，属于共同问题的比较，不是直接师承。",
      "sources": [
        "zhang-seismoscope",
        "zu-pi"
      ]
    },
    {
      "id": "shen-xu",
      "from": "shen-kuo",
      "to": "xu-guangqi",
      "kind": "theme",
      "label": "整理实用知识",
      "note": "比较观察、记录和知识整理的做法。两人相隔多个世纪，没有直接合作。",
      "sources": [
        "shen-book",
        "xu-science"
      ]
    },
    {
      "id": "xu-galileo",
      "from": "xu-guangqi",
      "to": "galileo",
      "kind": "contemporary",
      "label": "同时代的科学探索",
      "note": "徐光启与伽利略生活于同一时代，可以比较几何、历法与观测；不把同代背景当作会面证明。",
      "sources": [
        "xu-galileo"
      ]
    },
    {
      "id": "galileo-newton",
      "from": "galileo",
      "to": "newton",
      "kind": "influence",
      "label": "运动研究的承接",
      "note": "从伽利略的运动与观测研究，继续看牛顿的数学力学框架。二人没有见过面，也不是直接师生。",
      "sources": [
        "galileo-museum",
        "newton-project"
      ]
    },
    {
      "id": "galileo-shakespeare",
      "from": "galileo",
      "to": "shakespeare",
      "kind": "contemporary",
      "label": "同在 1564 年出生",
      "note": "一位探索自然，一位参与剧场：这是文艺复兴晚期的横向比较，不表示二人存在交往。",
      "sources": [
        "galileo-museum",
        "shakespeare-lease",
        "shakespeare-life"
      ]
    },
    {
      "id": "leo-michelangelo",
      "from": "leonardo",
      "to": "michelangelo",
      "kind": "contemporary",
      "label": "佛罗伦萨的艺术竞争",
      "note": "两人同在佛罗伦萨的艺术环境中活动，并参与同一市政大厅相关的创作竞争。此处比较创作环境，不把竞争推写成私人交往细节。",
      "sources": [
        "florence-artists"
      ]
    }
  ]
};

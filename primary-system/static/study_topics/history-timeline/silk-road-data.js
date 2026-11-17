/* 丝路路线、城市、货物、交流与材料出处；代表年代不表示固定航次。 */
window.SILK_ROAD = {
  "sources": {
    "corridor": {
      "publisher": "UNESCO 世界遗产中心",
      "title": "长安—天山廊道的路网",
      "url": "https://whc.unesco.org/en/list/1442/"
    },
    "quanzhou": {
      "publisher": "UNESCO 世界遗产中心",
      "title": "泉州：宋元中国的世界海洋商贸中心",
      "url": "https://whc.unesco.org/en/list/1561/"
    },
    "mogao": {
      "publisher": "UNESCO 世界遗产中心",
      "title": "莫高窟",
      "url": "https://whc.unesco.org/en/list/440/"
    },
    "samarkand": {
      "publisher": "UNESCO 世界遗产中心",
      "title": "撒马尔罕：文化交汇之地",
      "url": "https://whc.unesco.org/en/list/603/"
    },
    "network": {
      "publisher": "UNESCO 丝绸之路项目",
      "title": "丝路的路线、货物与交流",
      "url": "https://www.unesco.org/en/silk-roads/about-silk-roads"
    },
    "documents": {
      "publisher": "UNESCO 丝绸之路项目",
      "title": "从历史文献理解丝路交流",
      "url": "https://en.unesco.org/silkroad/publications/silk-roads-brief-history-documents"
    },
    "ports": {
      "publisher": "澳门文化遗产网",
      "title": "海上丝绸之路的空间网络与港口",
      "url": "https://www.culturalheritage.mo/msricf/2022/en/about/msr/"
    },
    "china-ports": {
      "publisher": "中国提交、UNESCO 预备名单",
      "title": "中国境内丝路与海上港口的申遗资料",
      "url": "https://whc.unesco.org/en/tentativelists/6093/"
    },
    "palembang": {
      "publisher": "UNESCO 丝路研究资料",
      "title": "苏门答腊东岸的考古与贸易线索",
      "url": "https://en.unesco.org/silkroad/sites/default/files/knowledge-bank-article/the_establisment_of_islamic_rule_in_eastern_coast_of_sumatra.pdf"
    },
    "hormuz": {
      "publisher": "国际制图协会研究论文",
      "title": "1375 年加泰罗尼亚地图与约 1300 年的忽鲁谟斯",
      "url": "https://ica-adv.copernicus.org/articles/1/11/2019/"
    },
    "aden": {
      "publisher": "也门提交、UNESCO 预备名单",
      "title": "亚丁古城的地理与港口作用",
      "url": "https://whc.unesco.org/en/tentativelists/6858/"
    },
    "camel": {
      "publisher": "中国国家博物馆",
      "title": "三彩釉陶载乐骆驼",
      "url": "https://www.chnmuseum.cn/zp/zpml/kgfjp/202008/t20200824_247230.shtml"
    },
    "afrasiab": {
      "publisher": "史密森学会",
      "title": "阿弗拉西阿卜壁画与粟特人的世界",
      "url": "https://sogdians.si.edu/afrasiab-mural-paintings/"
    }
  },
  "resources": {
    "lesson": "hu5-3",
    "audio": "../history/assets/audio/silk-road.m4a",
    "transcript": "../history/assets/audio/silk-road.txt"
  },
  "routes": [
    {
      "id": "land",
      "title": "陆上丝路",
      "period": "汉唐以来的代表性路网；重点观察公元前 2 世纪至公元 10 世纪",
      "year": 700,
      "era": "golden",
      "color": "#a86732",
      "question": "为什么商队会围着沙漠、沿着绿洲走？",
      "lead": "从长安、洛阳进入河西走廊，再经敦煌通向天山南北与中亚。支路、关隘和中转城市共同构成网络。",
      "mechanism": "驮运需要水、草料、道路与安全保障。绿洲、驿站和市场把长距离交通拆成可以接力的短段；政治关系和环境变化会改变路径。",
      "limits": "线条概括多时期的代表性通道，不是精确古道或一次旅行记录；所画区域只占整个丝路网络的一部分。",
      "stops": [
        "changan",
        "luoyang",
        "dunhuang",
        "turpan",
        "kashgar",
        "samarkand"
      ],
      "goods": [
        "silk",
        "horses",
        "glass",
        "crops"
      ],
      "exchanges": [
        "languages",
        "beliefs",
        "music",
        "knowledge"
      ],
      "eventIds": [
        "tc14",
        "tc15"
      ],
      "people": [
        "zhang-qian"
      ],
      "sources": [
        "corridor",
        "network",
        "samarkand"
      ],
      "branches": [
        {
          "id": "land-main",
          "title": "河西走廊与绿洲联系",
          "note": "由中原进入河西走廊，经敦煌、吐鲁番与塔里木盆地北缘，通向喀什和中亚。",
          "points": [
            [
              112.45,
              34.62
            ],
            [
              108.94,
              34.26
            ],
            [
              103.8,
              36.1
            ],
            [
              102.64,
              37.93
            ],
            [
              100.45,
              38.93
            ],
            [
              98.5,
              39.7
            ],
            [
              94.66,
              40.14
            ],
            [
              93.5,
              42.8
            ],
            [
              89.19,
              42.95
            ],
            [
              86.2,
              41.75
            ],
            [
              82.96,
              41.72
            ],
            [
              80.3,
              41.1
            ],
            [
              75.99,
              39.47
            ],
            [
              73,
              40.2
            ],
            [
              71.8,
              40.5
            ],
            [
              68,
              40.1
            ],
            [
              66.97,
              39.65
            ]
          ]
        },
        {
          "id": "land-south",
          "title": "塔里木盆地南缘支路",
          "note": "绿洲联系绕过沙漠；图中用概略折线表达南缘支路，不把沙漠画成一条可直接穿越的直道。",
          "points": [
            [
              94.66,
              40.14
            ],
            [
              90.8,
              39
            ],
            [
              87.7,
              38.1
            ],
            [
              85.5,
              37.3
            ],
            [
              82.7,
              37.1
            ],
            [
              79.9,
              37.1
            ],
            [
              77.3,
              38.4
            ],
            [
              75.99,
              39.47
            ]
          ]
        },
        {
          "id": "land-north",
          "title": "天山北侧与中亚支路",
          "note": "部分路线由天山北侧、伊犁河谷及中亚河谷相互连接；各时期选择并不相同。",
          "points": [
            [
              89.19,
              42.95
            ],
            [
              87.6,
              43.8
            ],
            [
              85.5,
              44.3
            ],
            [
              82.7,
              44.2
            ],
            [
              81.3,
              43.9
            ],
            [
              76.8,
              43.3
            ],
            [
              74.6,
              42.9
            ],
            [
              71.4,
              42.9
            ],
            [
              69.2,
              41.3
            ],
            [
              66.97,
              39.65
            ]
          ]
        }
      ]
    },
    {
      "id": "sea",
      "title": "海上丝路",
      "period": "以宋元贸易网络为中心，并联系明代远航；约 10—15 世纪",
      "year": 1300,
      "era": "voyage",
      "color": "#277e97",
      "question": "船装得更多，为什么还需要等风和换港？",
      "lead": "中国沿海港口与东南亚、印度洋、西亚港口相互连接。港口背后还有窑场、河运、仓储和城市市场。",
      "mechanism": "船舶提高了批量运输能力，但海流、季风、补给与港口制度共同影响航行。海路与陆路长期并存，也在河口和市场衔接。",
      "limits": "各支线和城市材料取自不同年代，不表示一支船队依次走完全部节点；浏览城市的顺序也不是固定航次。",
      "stops": [
        "quanzhou",
        "guangzhou",
        "palembang",
        "calicut",
        "hormuz",
        "aden"
      ],
      "goods": [
        "silk",
        "ceramics",
        "spices",
        "glass"
      ],
      "exchanges": [
        "languages",
        "beliefs",
        "knowledge"
      ],
      "eventIds": [
        "tc27"
      ],
      "people": [],
      "sources": [
        "quanzhou",
        "ports",
        "china-ports"
      ],
      "branches": [
        {
          "id": "sea-east",
          "title": "中国港口—东南亚港口",
          "note": "泉州、广州是多个出发与中转节点；此线概括沿海与南海联系。",
          "points": [
            [
              118.67,
              24.88
            ],
            [
              119.6,
              23.5
            ],
            [
              117.6,
              21.8
            ],
            [
              114.8,
              21.5
            ],
            [
              113.26,
              23.13
            ],
            [
              114,
              21.5
            ],
            [
              113,
              18
            ],
            [
              110,
              13
            ],
            [
              108,
              7
            ],
            [
              105,
              2
            ],
            [
              105.5,
              -2
            ],
            [
              104.76,
              -2.99
            ]
          ]
        },
        {
          "id": "sea-india",
          "title": "东南亚—印度洋联系",
          "note": "由东南亚海域经海峡进入印度洋，再接印度西海岸港口；不把各时代全部航线合并成唯一通道。",
          "points": [
            [
              104.76,
              -2.99
            ],
            [
              105.5,
              -2
            ],
            [
              105.6,
              1.2
            ],
            [
              104,
              1.1
            ],
            [
              102,
              2
            ],
            [
              99,
              6
            ],
            [
              94,
              6
            ],
            [
              89,
              5
            ],
            [
              84,
              4.5
            ],
            [
              79,
              5.5
            ],
            [
              76,
              7.5
            ],
            [
              75.78,
              11.26
            ]
          ]
        },
        {
          "id": "sea-gulf",
          "title": "印度西岸—波斯湾支线",
          "note": "通向忽鲁谟斯的海上联系；地图点位采用约 1300 年以后迁往岛上的港城位置。",
          "points": [
            [
              75.78,
              11.26
            ],
            [
              75,
              12
            ],
            [
              69,
              16
            ],
            [
              64,
              20
            ],
            [
              60,
              23
            ],
            [
              58.5,
              24
            ],
            [
              57,
              25.5
            ],
            [
              56.45,
              27.06
            ]
          ]
        },
        {
          "id": "sea-aden",
          "title": "印度洋—亚丁支线",
          "note": "亚丁联系阿拉伯海与红海方向的贸易，船只与货物可能在不同港口换手。",
          "points": [
            [
              75.78,
              11.26
            ],
            [
              70,
              10
            ],
            [
              62,
              11
            ],
            [
              55,
              12
            ],
            [
              50,
              12
            ],
            [
              45.03,
              12.78
            ]
          ]
        }
      ]
    }
  ],
  "cities": [
    {
      "id": "changan",
      "name": "长安",
      "alias": "今西安一带",
      "route": "land",
      "point": [
        108.94,
        34.26
      ],
      "period": "汉唐时期的政治与交流中心",
      "year": 700,
      "role": "集散与组织联系",
      "geography": "位于关中平原，向东联系中原，向西接入河西走廊。地图标出城市的大致位置，古城范围随时代变化。",
      "trade": "货物要经过市场、道路和众多参与者才能流向远方；都城也吸引使者、工匠和求学者。",
      "evidence": {
        "title": "从都城、寺院与关隘看路网",
        "text": "长安—天山廊道遗产包含城市遗址、宫殿、寺院、驿站和道路遗存，说明远程交流依靠一整套设施。",
        "limits": "长安是重要节点之一，不是所有丝路在所有时期唯一的起点。"
      },
      "question": "首都离海很远，为什么也能参与远距离贸易？",
      "answer": "通过陆路、河运和分段转运，它能与其他市场和港口间接相连，不需要每座城市都有海港。",
      "sources": [
        "corridor"
      ],
      "images": [
        "camel"
      ]
    },
    {
      "id": "luoyang",
      "name": "洛阳",
      "alias": "黄河中游的古都",
      "route": "land",
      "point": [
        112.45,
        34.62
      ],
      "period": "汉唐都城与交流节点",
      "year": 650,
      "role": "中原与西行道路的连接点",
      "geography": "位于中原交通联系中，向西可经关中联系更远地区。地图用现代坐标帮助定位，不表示古代行政边界。",
      "trade": "城市市场、政治活动和宗教设施吸引不同地区的人群，贸易与人员往来相互带动。",
      "evidence": {
        "title": "多起点的廊道路网",
        "text": "UNESCO 的长安—天山廊道说明同时提到长安与洛阳；东端本来就有多个相互连接的中心。",
        "limits": "一座城市的兴衰不等于整个丝路同时兴衰，还要看其他节点和支路。"
      },
      "question": "有了长安，为什么还要在图上保留洛阳？",
      "answer": "因为网络可以有多个中心；删去其他节点，会误以为所有交流必须从一个城门开始。",
      "sources": [
        "corridor"
      ],
      "images": []
    },
    {
      "id": "dunhuang",
      "name": "敦煌",
      "alias": "河西走廊西端的绿洲",
      "route": "land",
      "point": [
        94.66,
        40.14
      ],
      "period": "汉唐以来的重要节点；莫高窟材料跨越多个世纪",
      "year": 800,
      "role": "补给、分路与文化交汇",
      "geography": "位于河西走廊通向西域的关键区域。继续向西，绿洲和通道的选择会影响行程。",
      "trade": "商旅、使者、僧侣等在这里经过或停留；补水、食物、信息和道路知识同样重要。",
      "evidence": {
        "title": "莫高窟中的长期交流",
        "text": "莫高窟的洞窟、壁画与文书，为研究宗教、艺术和社会生活提供材料，体现了多种影响在当地交汇。",
        "limits": "今天看到的外立面与保护设施包含后世修建；一幅壁画也不是沿途社会生活的完整照片。"
      },
      "question": "一处宗教遗址，为什么能帮助我们认识贸易道路？",
      "answer": "道路带来人员与物资，也可能带来信仰、艺术和资助。要把遗址材料与其他记录一起比较，不能只凭一幅图推断全部商贸活动。",
      "sources": [
        "mogao",
        "corridor"
      ],
      "images": [
        "mogao"
      ]
    },
    {
      "id": "turpan",
      "name": "吐鲁番",
      "alias": "古代高昌、交河等城址所在区域",
      "route": "land",
      "point": [
        89.19,
        42.95
      ],
      "period": "汉唐及其后多个时期的绿洲联系",
      "year": 700,
      "role": "干旱区的水与聚落节点",
      "geography": "地处干旱盆地，城市生活和农业依靠有效供水。观察位置时，把山地来水、绿洲与道路一起看。",
      "trade": "绿洲可以提供粮食和补给；有水与农业，才有条件长期支持居民、商旅和市场。",
      "evidence": {
        "title": "古城与水利系统",
        "text": "长安—天山廊道资料把高昌、交河及吐鲁番的供水系统联系起来，展示交通与聚落生存条件的关系。",
        "limits": "各城址、渠系及其修建年代应分别核查，不能说今天所有坎儿井都完整保留自汉代。"
      },
      "question": "有路却没有可靠的水源，商队能否长期使用这个节点？",
      "answer": "会很困难。道路只是条件之一，补水、食物和维护能力决定人群能否稳定停留与往来。",
      "sources": [
        "corridor"
      ],
      "images": []
    },
    {
      "id": "kashgar",
      "name": "喀什",
      "alias": "塔里木盆地西缘的绿洲城市",
      "route": "land",
      "point": [
        75.99,
        39.47
      ],
      "period": "古代多条区域道路相接之处",
      "year": 900,
      "role": "盆地道路与山地通道之间的接力点",
      "geography": "位于塔里木盆地西缘，向西要面对山地与关口。盆地南北方向的道路在这一带相互联系。",
      "trade": "跨山路线需要本地向导、牲畜、补给与市场联系；货物转手并不意味着交流停止。",
      "evidence": {
        "title": "把城市放进区域网络",
        "text": "综合丝路研究把中国内地、西域与中亚理解为相互衔接的区域，喀什的位置有助于解释盆地与山地道路怎样接续。",
        "limits": "图线表达概略地理联系，不能当作某个古代商人的实际足迹或现代通关路线。"
      },
      "question": "换了一队商人接着运，还是同一次交流吗？",
      "answer": "货物和消息可以经由多次交易继续流动。网络靠接力运行，不要求每位参与者走完整程。",
      "sources": [
        "network",
        "documents"
      ],
      "images": []
    },
    {
      "id": "samarkand",
      "name": "撒马尔罕",
      "alias": "今乌兹别克斯坦的历史城市",
      "route": "land",
      "point": [
        66.97,
        39.65
      ],
      "period": "古代粟特与中世纪城市；此处重点观察约 7 世纪材料",
      "year": 660,
      "role": "中亚城市、使节与工艺的交汇点",
      "geography": "位于泽拉夫尚河谷绿洲区域，周围道路联系不同方向的聚落与市场。",
      "trade": "粟特商人与其他人群参与跨地区交易。城市既交换货物，也交换语言、图像与交往经验。",
      "evidence": {
        "title": "阿弗拉西阿卜使节壁画",
        "text": "约 7 世纪的壁画表现不同来访者及礼物，能与铭文、考古背景一起研究当时的外交与文化联系。",
        "limits": "壁画是有选择的宫廷表现，不是全部来访者的名录；不能把每个人的身份都当作毫无争议。"
      },
      "question": "衣服、礼物与文字线索，怎样一起帮助辨认人物？",
      "answer": "先分别观察，再与铭文和时代背景对照。单凭一种衣服或一个物品下结论，容易把相似风格当成确定身份。",
      "sources": [
        "samarkand",
        "afrasiab"
      ],
      "images": [
        "afrasiab"
      ]
    },
    {
      "id": "guangzhou",
      "name": "广州",
      "alias": "珠江口的海上贸易节点",
      "route": "sea",
      "point": [
        113.26,
        23.13
      ],
      "period": "唐宋及其后长期参与海外贸易",
      "year": 1000,
      "role": "河流、腹地与海洋的连接点",
      "geography": "位于珠江水系通向海洋的区域，内陆交通可以把物资送到港口，再进入海上网络。",
      "trade": "港口不只是一处停船点，还需要装卸、仓储、市场、船舶服务和相应管理。",
      "evidence": {
        "title": "从港口设施看城市系统",
        "text": "海上丝路的中国申遗资料把广州等港口与生产、码头、仓储和航行设施结合起来理解。",
        "limits": "该资料属于预备名单文本，不等于这些城市的所有相关遗迹都已作为世界遗产列入。"
      },
      "question": "只建一座码头，能不能让一座城市成为贸易中心？",
      "answer": "还需要货物来源、道路与河运、仓储、交易规则、船员和补给；港口连接的是一整套系统。",
      "sources": [
        "china-ports",
        "ports"
      ],
      "images": []
    },
    {
      "id": "quanzhou",
      "name": "泉州",
      "alias": "古称刺桐；宋元海洋商贸中心",
      "route": "sea",
      "point": [
        118.67,
        24.88
      ],
      "period": "宋元，约 10—14 世纪",
      "year": 1250,
      "role": "生产、转运与多元城市生活的枢纽",
      "geography": "沿海港口与内陆河流、道路相接，生产地到码头之间也有一张运输网络。",
      "trade": "陶瓷、铁等产品的生产遗址，与码头、桥梁和管理设施共同说明贸易的组织方式。",
      "evidence": {
        "title": "遗产不是只有一座寺或一个码头",
        "text": "泉州的世界遗产由多处遗产点共同构成，包含生产、交通、贸易管理与宗教建筑等，展示宋元商贸城市的整体联系。",
        "limits": "现代照片能显示建筑现状，具体始建、重建和修缮年代仍需逐处核对。"
      },
      "question": "窑址离码头很远，为什么也属于海洋商贸的证据？",
      "answer": "因为海运货物要先被生产、集中并送到港口。把窑址与运输、管理设施连接起来，才能解释贸易怎样运行。",
      "sources": [
        "quanzhou"
      ],
      "images": [
        "quanzhou"
      ]
    },
    {
      "id": "palembang",
      "name": "巨港",
      "alias": "Palembang；苏门答腊的河港区域",
      "route": "sea",
      "point": [
        104.76,
        -2.99
      ],
      "period": "唐宋贸易与室利佛逝相关材料为重点",
      "year": 1100,
      "role": "群岛物产与远洋船运的中转节点",
      "geography": "位于苏门答腊的河流下游区域。河道把腹地物产带向港口，海路再联系群岛与远方市场。",
      "trade": "转口贸易把不同小港与腹地物产集中起来；在这里买到的货物，未必都在这里生产。",
      "evidence": {
        "title": "陶瓷碎片与港口考古",
        "text": "巨港及周边发现的中国陶瓷遗物跨越多个时期，可与文献一起研究海上联系及其变化。",
        "limits": "发现一片外来陶瓷，不等于每艘船都来自中国，也不能把古代政权范围直接套在现代城市边界上。"
      },
      "question": "在巨港发现中国瓷器，能确定是谁亲自把它运来的吗？",
      "answer": "通常不能仅凭产地确定运输者；货物可能经过多次转运，要结合出土环境、年代和其他证据。",
      "sources": [
        "palembang",
        "ports"
      ],
      "images": []
    },
    {
      "id": "calicut",
      "name": "古里",
      "alias": "Calicut／Kozhikode；今印度西海岸",
      "route": "sea",
      "point": [
        75.78,
        11.26
      ],
      "period": "中世纪后期与明代远航的相关港口",
      "year": 1405,
      "role": "印度洋市场与海上联系节点",
      "geography": "位于印度西海岸，面向阿拉伯海。来自不同方向的船只可以在印度洋港口衔接贸易。",
      "trade": "香料、纺织品等进入区域与远程交易；集散市场的商品既可能来自附近，也可能来自更远地区。",
      "evidence": {
        "title": "从港口网络看古里",
        "text": "海上丝路的港口研究把古里与东南亚、西亚等港口放在同一网络中，帮助理解多中心的贸易联系。",
        "limits": "不把古里描绘成所有船只必经之地，也不把不同年代的航行合并成一趟旅程。"
      },
      "question": "市场上同一种香料，是否一定只来自一个地方？",
      "answer": "需要查具体品种、产区和年代。市场会汇集不同来源的货物，港口名不等于产地名。",
      "sources": [
        "ports",
        "documents"
      ],
      "images": []
    },
    {
      "id": "hormuz",
      "name": "忽鲁谟斯",
      "alias": "Hormuz；霍尔木兹港城",
      "route": "sea",
      "point": [
        56.45,
        27.06
      ],
      "period": "重点观察约 1300 年迁往岛上以后的港城",
      "year": 1350,
      "role": "波斯湾口的海陆衔接节点",
      "geography": "位于波斯湾入口附近。图中采用岛上港城的大致位置，较早的旧城则在大陆一侧。",
      "trade": "海上货物可在港口与区域陆路、市集相接；位置优势仍需补给和贸易组织支持。",
      "evidence": {
        "title": "同名港口，也会换位置",
        "text": "有关约 1300 年地图与文献的研究区分大陆旧城与岛上新城，提醒我们地名有延续，位置却可能改变。",
        "limits": "不能用岛上坐标代表忽鲁谟斯历史上的所有阶段，也不把现代海峡航道等同于古代航线。"
      },
      "question": "古书出现同一个地名，就一定在今天地图上的同一点吗？",
      "answer": "不一定。城市可能迁移，名称也可能沿用；要把地名与记载年代、遗址和地理描述一起核对。",
      "sources": [
        "hormuz",
        "ports"
      ],
      "images": []
    },
    {
      "id": "aden",
      "name": "亚丁",
      "alias": "阿拉伯半岛南部的港口城市",
      "route": "sea",
      "point": [
        45.03,
        12.78
      ],
      "period": "长期参与阿拉伯海与红海方向的贸易",
      "year": 1300,
      "role": "海域交汇处的港口与市场",
      "geography": "靠近阿拉伯海通向红海的方向，山地与天然港湾共同影响城市布局。",
      "trade": "不同方向的海上联系在港口汇合，船只需要补给、市场与地方服务，城市也吸收多种文化影响。",
      "evidence": {
        "title": "地形、港湾与城市遗存",
        "text": "亚丁的申遗预备资料从港湾、城址、防御与储水设施等解释城市和海洋的长期联系。",
        "limits": "预备名单中的叙述需结合其他研究核查；这里不把申报文本当作已列入世界遗产的证明。"
      },
      "question": "港口城市为什么也要研究储水设施？",
      "answer": "船员与居民都需要淡水，贸易活动不能只依赖好港湾。环境条件与城市设施同样决定港口能否运转。",
      "sources": [
        "aden",
        "ports"
      ],
      "images": []
    }
  ],
  "goods": [
    {
      "id": "silk",
      "name": "丝绸与织物",
      "icon": "🧵",
      "routes": [
        "land",
        "sea"
      ],
      "flow": "中国等生产地区的丝织品经多次交易流向其他市场；织造知识与图案也在交流中变化。",
      "logistics": "价值、重量与便携性影响长途贸易选择，运输中还要考虑受潮、磨损和保管。",
      "evidence": "文献、出土织物和图像可以相互核对；图像中的织物并不能单独证明整条运输路线。",
      "boundary": "「丝绸之路」不是只运丝绸；也不是所有丝织品都由同一批人全程运送。",
      "cities": [
        "changan",
        "samarkand",
        "quanzhou"
      ],
      "sources": [
        "documents",
        "corridor"
      ]
    },
    {
      "id": "horses",
      "name": "马匹与畜产",
      "icon": "🐎",
      "routes": [
        "land"
      ],
      "flow": "不同地区通过交易、馈赠等方式交换马匹及其他畜产；这些联系也连接农耕与游牧生活。",
      "logistics": "活体运输需要饲料、水和照料，牲畜的健康与适应条件会限制行程。",
      "evidence": "史籍和相关器物可说明马匹受到重视，具体数量、品种与来源还需逐项查证。",
      "boundary": "交流不是只有商品向西流动；回程货物与人员同样重要。",
      "cities": [
        "kashgar",
        "changan"
      ],
      "sources": [
        "documents",
        "corridor"
      ]
    },
    {
      "id": "glass",
      "name": "玻璃与金属器",
      "icon": "🏺",
      "routes": [
        "land",
        "sea"
      ],
      "flow": "来自不同工艺传统的器物在多地区流动，也会被模仿、修理或重新组合。",
      "logistics": "易碎性、重量和包装条件影响器物怎样运输，以及哪些形式适合远行。",
      "evidence": "器型和纹饰是线索，产地判断还可能需要成分分析与出土背景。",
      "boundary": "风格相似不必然证明产地相同，也不必然证明两地之间有一次直接航行。",
      "cities": [
        "samarkand",
        "guangzhou",
        "hormuz"
      ],
      "sources": [
        "documents"
      ]
    },
    {
      "id": "crops",
      "name": "作物与食物",
      "icon": "🍇",
      "routes": [
        "land"
      ],
      "flow": "作物、食物与栽培经验经过长期接触在不同地区传播，进入新地方后还要适应环境。",
      "logistics": "种子、鲜果与加工食品有不同保存需求；能到达不等于能稳定种植。",
      "evidence": "植物遗存、名称与文献可共同提供线索，传播时间与路径未必都能精确确定。",
      "boundary": "不把所有外来作物都归功于张骞一次出使，也不把贸易接触直接等同于栽培成功。",
      "cities": [
        "turpan",
        "dunhuang",
        "changan"
      ],
      "sources": [
        "network",
        "documents"
      ]
    },
    {
      "id": "ceramics",
      "name": "陶瓷",
      "icon": "🍶",
      "routes": [
        "sea"
      ],
      "flow": "中国窑场等生产地区的陶瓷经港口进入海外市场，消费需求也会影响器物形式。",
      "logistics": "船运适合较大批量运输，但仍需要装箱、固定、防碰撞与装卸条件。",
      "evidence": "窑址、港口和海外发现的瓷片可组成不同层次的贸易证据。",
      "boundary": "看到中国瓷器，不能直接确定船员国籍，也不能假定它未经转手。",
      "cities": [
        "quanzhou",
        "guangzhou",
        "palembang"
      ],
      "sources": [
        "quanzhou",
        "palembang"
      ]
    },
    {
      "id": "spices",
      "name": "香料与香料植物",
      "icon": "🌿",
      "routes": [
        "sea"
      ],
      "flow": "南亚、东南亚及其他产区的不同香料被港口集中并转运，进入饮食、香事和其他生活场景。",
      "logistics": "不同香料的来源、保存和价值差别很大；集散港与实际产地要分别判断。",
      "evidence": "货物清单与文献提供用途和名称，必要时还要核对古今名称是否指同一种材料。",
      "boundary": "不能把「香料」当作单一物品，也不能从一个港口名字推断全部产区。",
      "cities": [
        "palembang",
        "calicut",
        "aden"
      ],
      "sources": [
        "documents",
        "network"
      ]
    }
  ],
  "exchanges": [
    {
      "id": "languages",
      "title": "语言、翻译与交易规则",
      "routes": [
        "land",
        "sea"
      ],
      "mechanism": "参与者需要理解数量、名称、价格与约定。中间人、翻译和共同使用的表达方式，让不同背景的人能够合作。",
      "evidence": "多语言文书、铭文和交易记录，能显示实际往来；语言接触还会带来借词和表达变化。",
      "question": "两位商人语言不同，怎样减少误解？",
      "answer": "可以依靠翻译、中间人、样品、数量记录与约定规则，但仍需要信用和反复核对。",
      "sources": [
        "documents",
        "network"
      ],
      "images": []
    },
    {
      "id": "beliefs",
      "title": "宗教、建筑与地方生活",
      "routes": [
        "land",
        "sea"
      ],
      "mechanism": "僧侣、商人和其他旅行者带着信仰与实践迁徙，新的地方又会形成不同建筑、图像与社群。",
      "evidence": "莫高窟、泉州宗教建筑等材料，显示信仰传播与地方社会之间的长期互动。",
      "question": "建筑中出现外来元素，是否说明当地文化消失了？",
      "answer": "应观察哪些形式被吸收、哪些习惯被保留，以及新环境怎样改变它们；交流往往会产生新的组合。",
      "sources": [
        "mogao",
        "quanzhou"
      ],
      "images": [
        "mogao",
        "quanzhou"
      ]
    },
    {
      "id": "music",
      "title": "音乐、图案与表演",
      "routes": [
        "land"
      ],
      "mechanism": "乐器、曲调、舞蹈与装饰图案随人员往来而传播，也会在新的场景中被重新改编。",
      "evidence": "唐三彩载乐骆驼以艺术形式表现乐舞和不同人物，是观察文化接触的一条线索。",
      "question": "陶俑画出了骆驼上的乐队，能当作真实旅行录像吗？",
      "answer": "不能。作品包含夸张、选择与制作目的，需要结合文献、其他图像和出土背景理解。",
      "sources": [
        "camel",
        "corridor"
      ],
      "images": [
        "camel"
      ]
    },
    {
      "id": "knowledge",
      "title": "技术、纸张与航海知识",
      "routes": [
        "land",
        "sea"
      ],
      "mechanism": "知识依靠工匠、学者、书籍和实践经验传播；传到新地区后，还会继续改进。",
      "evidence": "造纸传播、交通设施和后世保存的航海图，可以分别提供技术和地理知识流动的线索。",
      "question": "知道一种工具的名字，就等于掌握整套技术吗？",
      "answer": "还需要材料、工序、操作经验和使用条件。交流既传递知识，也要求学习和适应。",
      "sources": [
        "network",
        "documents"
      ],
      "images": [
        "chart",
        "ship"
      ]
    }
  ],
  "milestones": [
    {
      "year": -138,
      "label": "前 138 年 · 张骞首次出使",
      "text": "扩大汉朝与西域之间的官方联系；地区之间更早已有往来。",
      "eventId": "tc14"
    },
    {
      "year": 700,
      "label": "隋唐时期 · 多地人群与城市交流",
      "text": "以都城、绿洲和寺院等节点，观察陆路网络中的多种参与者。",
      "eventId": null
    },
    {
      "year": 1200,
      "label": "宋元时期 · 海洋商贸城市",
      "text": "从泉州的生产、运输和管理设施，理解海上贸易与腹地的联系。",
      "eventId": null
    },
    {
      "year": 1405,
      "label": "1405 年起 · 郑和远航",
      "text": "在已有海上网络中展开远航；官员、使节活动与商业贸易不能完全等同。",
      "eventId": "tc27"
    }
  ],
  "images": {
    "chart": {
      "mediaEvent": "tc27"
    },
    "ship": {
      "lessonImage": "zhenghe",
      "width": 1280,
      "height": 853
    },
    "camel": {
      "src": "assets/silk-road/camel.jpg",
      "width": 1400,
      "height": 1675,
      "title": "唐三彩釉陶载乐骆驼",
      "alt": "骆驼陶俑驮着乐舞人物，前方人物抱着琵琶",
      "caption": "国博藏唐三彩载乐骆驼。人物与骆驼的比例经过艺术处理，可观察乐器与人物组合，不当作商队实况照片。",
      "credit": "中国国家博物馆藏 · 国博官网图像",
      "license": "馆方图像，说明见来源",
      "source": "https://www.chnmuseum.cn/zp/zpml/kgfjp/202008/t20200824_247230.shtml"
    },
    "mogao": {
      "src": "assets/silk-road/mogao.jpg",
      "width": 1280,
      "height": 960,
      "title": "敦煌莫高窟外观",
      "alt": "莫高窟崖壁、洞口与前方木构楼阁",
      "caption": "2006 年拍摄的莫高窟外观，含后世修建与保护设施。照片帮助观察遗址所在环境，不能把所有可见建筑都归为同一年代。",
      "credit": "Yaohua2000 / Wikimedia Commons，作者说明见文件页",
      "license": "CC BY-SA 3.0；本地使用站点提供的缩小副本",
      "source": "https://commons.wikimedia.org/wiki/File:Mogao_Caves.jpg"
    },
    "quanzhou": {
      "src": "assets/silk-road/quanzhou.jpg",
      "width": 1280,
      "height": 853,
      "title": "泉州清净寺门楼",
      "alt": "泉州清净寺石砌门楼及其拱形入口",
      "caption": "2012 年拍摄的清净寺建筑现状。宋元泉州的宗教建筑是多元城市生活的一类材料，具体修缮与重建情况需结合遗址说明。",
      "credit": "Zhangzhugang / Wikimedia Commons",
      "license": "CC BY-SA 4.0；本地使用站点提供的缩小副本",
      "source": "https://commons.wikimedia.org/wiki/File:Quanzhou_Qingjing_Si_20120229-01.jpg"
    },
    "afrasiab": {
      "src": "assets/silk-road/afrasiab.jpg",
      "width": 1280,
      "height": 301,
      "title": "阿弗拉西阿卜使节壁画",
      "alt": "约七世纪使节壁画中排列的人物、服饰与所携物品",
      "caption": "约 7 世纪阿弗拉西阿卜壁画西壁的图像记录，保存状况有缺损。可结合服饰、礼物与铭文讨论交往，具体人物身份需依研究判断。",
      "credit": "Thorsten Greve · 经 Wikimedia Commons 收录",
      "license": "PD-Art／公有领域作品的忠实复制；站点缩小副本",
      "source": "https://commons.wikimedia.org/wiki/File:Afrasiab._West_wall_of_the_Hall_of_the_Ambassadors._Mid_7th_century_CE.jpg"
    }
  }
};

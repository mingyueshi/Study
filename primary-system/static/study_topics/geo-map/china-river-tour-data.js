/* 沿河漫游站点与解说；按上游至下游编排，复用原地形档案。 */
window.GM_CHINA_RIVER_TOURS = {
  "centerlinesSHA256": "3f2750f509e8ae539b59e7cfa1cb993ce000a9e83941b7ead83332bd2dfd2158",
  "holdSeconds": 8,
  "travelSeconds": 90,
  "note": "镜头沿真实河道前进，城市站点定位在附近河段。每站停留约 8 秒，可随时暂停阅读；速度只为观察，不代表真实航行。",
  "sources": [
    {
      "id": "yangtze",
      "label": "中国科学院地理资源所 · 长江",
      "url": "https://www.igsnrr.cas.cn/cbkx/kpyd/zgdl/cnszy/202009/t20200910_5692425.html"
    },
    {
      "id": "upper",
      "label": "川渝六江生态廊道规划",
      "url": "https://www.cq.gov.cn/zwgk/zfxxgkml/szfwj/cylhfw/202311/t20231121_12584968.html"
    },
    {
      "id": "plain",
      "label": "中国科学院地理资源所 · 长江中下游平原",
      "url": "https://www.igsnrr.cas.cn/cbkx/kpyd/zgdl/cndm/202009/t20200910_5692359.html"
    },
    {
      "id": "yellow",
      "label": "宁夏水利厅 · 黄河",
      "url": "https://slt.nx.gov.cn/xxgk_281/fdzdgknr/slkp/jhzl/202112/t20211201_3176821.html"
    },
    {
      "id": "lanzhou",
      "label": "生态环境部 · 甘肃黄河上游",
      "url": "https://www.mee.gov.cn/ywdt/dfnews/202009/t20200915_798465.shtml"
    },
    {
      "id": "ningxia",
      "label": "国家林草局 · 黄河与银川平原",
      "url": "https://www.forestry.gov.cn/c/www/kxj/4363.jhtml"
    },
    {
      "id": "lower",
      "label": "山东大学黄河国家战略研究院 · 黄河下游调研",
      "url": "https://www.hhzlyjy.sdu.edu.cn/info/1002/2219.htm"
    },
    {
      "id": "yellow-route",
      "label": "文化和旅游部 · 黄河沿线",
      "url": "https://lyfw.mct.gov.cn/site/special/details?id=1513"
    },
    {
      "id": "junction",
      "label": "重庆市档案馆 · 宜宾三江口",
      "url": "https://jda.cq.gov.cn/web/article/1464346362479931392/web/content_1464346362479931392.html"
    },
    {
      "id": "yushu",
      "label": "长江、黄河和澜沧江的源头",
      "url": "https://www.guinan.gov.cn/lnb/zc1__zwgk/zc/aztfl/mzzj/content_29609300"
    }
  ],
  "routes": [
    {
      "id": "yangtze",
      "river": "f20",
      "name": "长江漫游",
      "stops": [
        {
          "id": "yangtze-source",
          "name": "唐古拉山源区",
          "kind": "source",
          "anchor": [
            91.175,
            33.454167
          ],
          "terrain": "青藏高原",
          "description": "旅程从高高的青藏高原出发。这里的雪山、冰川和降水，为源区河流提供水。",
          "observe": "看看河流两边：源头所在的大片土地，是不是都很高？",
          "related": [
            "f9"
          ],
          "sources": [
            "yangtze"
          ]
        },
        {
          "id": "yushu",
          "name": "玉树附近 · 通天河",
          "kind": "city",
          "anchor": [
            97.02,
            33.02
          ],
          "terrain": "高原河谷",
          "description": "来到青海玉树附近，这一段长江干流叫通天河。河水在高原上汇集，再沿河谷向前。",
          "observe": "找一找蓝线的转弯，河水会直接翻过山脊吗？",
          "related": [
            "f9"
          ],
          "sources": [
            "yushu"
          ]
        },
        {
          "id": "tiger-leaping",
          "name": "金沙江 · 虎跳峡",
          "kind": "landform",
          "anchor": [
            100.1,
            27.2
          ],
          "terrain": "横断山区的高山峡谷",
          "description": "长江上游的这一段叫金沙江。它穿行在高山之间，虎跳峡就是这里著名的峡谷。",
          "observe": "比较河谷和两侧山顶，哪里更低？",
          "related": [
            "f12"
          ],
          "sources": [
            "yangtze"
          ]
        },
        {
          "id": "panzhihua",
          "name": "攀枝花附近",
          "kind": "city",
          "anchor": [
            101.74,
            26.6
          ],
          "terrain": "川滇山地河谷",
          "description": "镜头来到四川攀枝花附近的金沙江。这里仍是起伏明显的山地，城市和河流相依。",
          "observe": "顺着河道看，它怎样在山间拐弯？",
          "related": [
            "f12"
          ],
          "sources": [
            "upper"
          ]
        },
        {
          "id": "yibin",
          "name": "宜宾 · 三江口",
          "kind": "city",
          "anchor": [
            104.63,
            28.77
          ],
          "terrain": "四川盆地南缘",
          "description": "金沙江与岷江在宜宾汇合，从这里往下，干流称为长江。两条水路在城市旁汇成一条大江。",
          "observe": "想一想：支流汇入后，为什么干流通常会带走更多水？",
          "related": [
            "f19"
          ],
          "sources": [
            "junction"
          ]
        },
        {
          "id": "chongqing",
          "name": "重庆",
          "kind": "city",
          "anchor": [
            106.59,
            29.57
          ],
          "terrain": "四川盆地东部的丘陵山地",
          "description": "长江来到重庆，河岸周围仍有山地和丘陵。盆地不是一个处处平坦的大盘子，里面也有高低起伏。",
          "observe": "看看江两岸的起伏，和刚才的深峡谷有什么不同？",
          "related": [
            "f19"
          ],
          "sources": [
            "upper"
          ]
        },
        {
          "id": "three-gorges",
          "name": "长江三峡 · 巫峡附近",
          "kind": "landform",
          "anchor": [
            109.95,
            31.05
          ],
          "terrain": "巫山一带的峡谷",
          "description": "长江继续向东，在山地中穿过三峡。巫峡附近两岸山势高，江水沿着低处的河谷前进。",
          "observe": "蓝线是否沿着两侧山地之间的低处延伸？",
          "related": [
            "f37"
          ],
          "sources": [
            "yangtze",
            "upper"
          ]
        },
        {
          "id": "yichang",
          "name": "宜昌",
          "kind": "city",
          "anchor": [
            111.28,
            30.7
          ],
          "terrain": "山地向平原过渡",
          "description": "经过三峡来到宜昌附近，长江开始走向中下游平原。远处的地面渐渐变得低而开阔。",
          "observe": "从西向东比较，地图上的颜色和起伏怎样变化？",
          "related": [
            "f15"
          ],
          "sources": [
            "plain"
          ]
        },
        {
          "id": "wuhan",
          "name": "武汉",
          "kind": "city",
          "anchor": [
            114.3,
            30.56
          ],
          "terrain": "江汉平原",
          "description": "长江来到湖北武汉。这里位于江汉平原一带，河流、湖泊和城市共同组成沿江景观。",
          "observe": "平原上的河道，是否也会弯弯曲曲？",
          "related": [
            "f15"
          ],
          "sources": [
            "plain"
          ]
        },
        {
          "id": "jiujiang",
          "name": "九江 · 湖口附近",
          "kind": "city",
          "anchor": [
            116.22,
            29.75
          ],
          "terrain": "鄱阳湖平原",
          "description": "来到江西九江的湖口附近，鄱阳湖与长江在这里相通。大江与湖泊连在一起，组成水网。",
          "observe": "想一想：一场大雨之后，湖泊为什么能暂时存住一部分水？",
          "related": [
            "f23",
            "f15"
          ],
          "sources": [
            "plain"
          ]
        },
        {
          "id": "nanjing",
          "name": "南京",
          "kind": "city",
          "anchor": [
            118.73,
            32.1
          ],
          "terrain": "长江下游沿江平原",
          "description": "江水经过南京，继续向东奔向海边。下游沿江平原地势较低，河流两岸分布着许多城市。",
          "observe": "比较南京附近和源区，哪一处的地面更低？",
          "related": [
            "f15"
          ],
          "sources": [
            "plain"
          ]
        },
        {
          "id": "yangtze-mouth",
          "name": "上海附近 · 长江口",
          "kind": "mouth",
          "anchor": [
            122.368469,
            30.993503
          ],
          "terrain": "长江三角洲与东海",
          "description": "我们来到长江口，江水流入东海。河流带来的泥沙在河口一带沉积，是三角洲形成的重要原因。",
          "observe": "回想一路：高原、峡谷、盆地、平原，你能按顺序说出来吗？",
          "related": [
            "f15",
            "f27"
          ],
          "sources": [
            "yangtze",
            "plain"
          ]
        }
      ]
    },
    {
      "id": "yellow",
      "river": "f21",
      "name": "黄河漫游",
      "stops": [
        {
          "id": "yellow-source",
          "name": "巴颜喀拉山源区",
          "kind": "source",
          "anchor": [
            95.941214,
            34.98931
          ],
          "terrain": "青藏高原",
          "description": "黄河从青藏高原巴颜喀拉山源区出发。最初的小河不断汇集来水，开始漫长的旅程。",
          "observe": "源头和海口之间，哪一边的地势更高？",
          "related": [
            "f9"
          ],
          "sources": [
            "yellow"
          ]
        },
        {
          "id": "eling",
          "name": "鄂陵湖附近",
          "kind": "landform",
          "anchor": [
            97.9,
            35.1
          ],
          "terrain": "高原湖泊与宽谷",
          "description": "黄河源区分布着湖泊和湿地。河水穿过湖区后，继续沿高原河谷向下游流。",
          "observe": "注意湖区周围的高原，湖面平静就表示这里海拔低吗？",
          "related": [
            "f9"
          ],
          "sources": [
            "yellow"
          ]
        },
        {
          "id": "longyang",
          "name": "龙羊峡附近",
          "kind": "landform",
          "anchor": [
            100.98,
            36.12
          ],
          "terrain": "高原峡谷",
          "description": "黄河在青海流过龙羊峡一带。高原边缘出现深切的河谷，这里也有利用河流落差的水利工程。",
          "observe": "峡谷两侧的山地，像不像给河水夹出的一条通道？",
          "related": [
            "f9"
          ],
          "sources": [
            "yellow-route"
          ]
        },
        {
          "id": "lanzhou",
          "name": "兰州",
          "kind": "city",
          "anchor": [
            103.82,
            36.06
          ],
          "terrain": "山间河谷盆地",
          "description": "黄河穿过甘肃兰州城区。城市沿着河谷展开，桥梁把两岸连接起来。",
          "observe": "看看河流两边的山地，城市能在什么地方展开？",
          "related": [
            "f11"
          ],
          "sources": [
            "lanzhou"
          ]
        },
        {
          "id": "yinchuan",
          "name": "银川附近",
          "kind": "city",
          "anchor": [
            106.53,
            38.45
          ],
          "terrain": "银川平原",
          "description": "黄河流经银川平原，为这里的灌溉提供水源。河水通过渠道来到农田，帮助庄稼生长。",
          "observe": "同在北方，为什么河流附近也能出现大片农田？",
          "related": [
            "f35"
          ],
          "sources": [
            "ningxia"
          ]
        },
        {
          "id": "baotou",
          "name": "包头附近",
          "kind": "city",
          "anchor": [
            109.85,
            40.52
          ],
          "terrain": "河套平原东部",
          "description": "黄河向北绕过大弯，来到包头附近的河套地区。这里的平原与远处的高原、山地相邻。",
          "observe": "跟着箭头看：这一段黄河是在向东、向南，还是向北？",
          "related": [
            "f10",
            "f34"
          ],
          "sources": [
            "yellow"
          ]
        },
        {
          "id": "hukou",
          "name": "壶口附近",
          "kind": "landform",
          "anchor": [
            110.45,
            36.15
          ],
          "terrain": "黄土高原与晋陕峡谷",
          "description": "黄河转向南，穿过黄土高原，在晋陕峡谷中奔流。壶口瀑布位于这一带，泥沙也让我们注意到水土保持的重要。",
          "observe": "为什么保护山坡上的草木，有助于减少流入河里的泥沙？",
          "related": [
            "f11"
          ],
          "sources": [
            "yellow",
            "yellow-route"
          ]
        },
        {
          "id": "tongguan",
          "name": "潼关附近",
          "kind": "landform",
          "anchor": [
            110.28,
            34.62
          ],
          "terrain": "渭河平原与山地交接处",
          "description": "来到潼关附近，黄河从向南转为向东。河流的走向会受到周围地形影响，并不是一直笔直向东。",
          "observe": "观察这里的大转弯，在地图上用手指顺着河水画一遍。",
          "related": [
            "f7",
            "f11"
          ],
          "sources": [
            "yellow"
          ]
        },
        {
          "id": "sanmenxia",
          "name": "三门峡",
          "kind": "city",
          "anchor": [
            111.19,
            34.8
          ],
          "terrain": "黄河中游峡谷",
          "description": "黄河经过河南三门峡附近，继续在山地河谷中前进。沿途的城市和工程都与这条大河联系紧密。",
          "observe": "向下游望去，山地会一直延伸到海边吗？",
          "related": [
            "f11"
          ],
          "sources": [
            "yellow-route"
          ]
        },
        {
          "id": "zhengzhou",
          "name": "郑州 · 桃花峪附近",
          "kind": "city",
          "anchor": [
            113.5,
            34.96
          ],
          "terrain": "山地向华北平原过渡",
          "description": "桃花峪附近是黄河中游与下游的分界。离开山地后，黄河走上更低、更开阔的华北平原。",
          "observe": "比较这一站前后的起伏，找出山地和平原的变化。",
          "related": [
            "f14"
          ],
          "sources": [
            "lower",
            "yellow"
          ]
        },
        {
          "id": "jinan",
          "name": "济南附近",
          "kind": "city",
          "anchor": [
            116.96,
            36.76
          ],
          "terrain": "黄河下游平原",
          "description": "黄河经过山东济南附近，向东北流去。下游河水带着泥沙，堤防帮助保护河流两岸。",
          "observe": "平原虽然平坦，为什么仍然需要保护堤防、留意洪水？",
          "related": [
            "f14"
          ],
          "sources": [
            "lower"
          ]
        },
        {
          "id": "yellow-mouth",
          "name": "东营 · 黄河口",
          "kind": "mouth",
          "anchor": [
            119.254313,
            37.86789
          ],
          "terrain": "黄河三角洲与渤海",
          "description": "黄河在山东东营附近流入渤海。河口的泥沙沉积形成三角洲，湿地也是许多鸟类的家。",
          "observe": "从源头到海边，哪些站点让你看到了高原、峡谷和平原？",
          "related": [
            "f25",
            "f14"
          ],
          "sources": [
            "lower",
            "yellow"
          ]
        }
      ]
    }
  ]
};

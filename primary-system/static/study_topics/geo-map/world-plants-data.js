/* 点位表示代表分布或栽培地点，不表示完整分布范围。ID 用于植物深链接及同名本地照片。 */
window.GM_WORLD_FLORA = {
  "habitats": [
    {
      "id": "forest",
      "name": "温带森林",
      "color": "#286647"
    },
    {
      "id": "rainforest",
      "name": "热带雨林",
      "color": "#93602a"
    },
    {
      "id": "dryland",
      "name": "荒漠与干旱地带",
      "color": "#8b591b"
    },
    {
      "id": "wetland",
      "name": "淡水湿地",
      "color": "#236c9d"
    },
    {
      "id": "mediterranean",
      "name": "地中海林地",
      "color": "#62751d"
    },
    {
      "id": "alpine",
      "name": "高山草地",
      "color": "#66529b"
    },
    {
      "id": "polar",
      "name": "极地苔原",
      "color": "#526777"
    }
  ],
  "plants": [
    {
      "id": "giant-sequoia",
      "name": "巨杉",
      "scientificName": "Sequoiadendron giganteum",
      "habitat": "forest",
      "place": "北美洲 · 美国内华达山脉",
      "point": [
        -118.75,
        36.56
      ],
      "home": "巨杉的天然林主要分布在美国加利福尼亚州内华达山脉西坡。",
      "adaptation": "厚树皮能抵御一定程度的地表火，但强烈、持续的火灾仍会伤害甚至杀死大树。",
      "clue": "树干非常粗壮，红褐色树皮厚而松软，叶片却很小。",
      "mapPlace": "United States of America",
      "source": "https://powo.science.kew.org/results?q=Sequoiadendron%20giganteum",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Grizzly_Giant_Mariposa_Grove.jpg"
    },
    {
      "id": "coast-redwood",
      "name": "北美红杉",
      "scientificName": "Sequoia sempervirens",
      "habitat": "forest",
      "place": "北美洲 · 美国加州海岸",
      "point": [
        -124.0,
        41.3
      ],
      "home": "北美红杉的天然林主要在北美太平洋沿岸的湿润地带。",
      "adaptation": "海雾能补充水分并减轻干燥，说明海洋也会影响陆地森林的生长。",
      "clue": "高高的树干直入树冠，枝条上常见扁平、两侧排列的小叶。",
      "mapPlace": "United States of America",
      "source": "https://powo.science.kew.org/results?q=Sequoia%20sempervirens",
      "photoSource": "https://commons.wikimedia.org/wiki/File:US_199_Redwood_Highway.jpg"
    },
    {
      "id": "sugar-maple",
      "name": "糖槭",
      "scientificName": "Acer saccharum",
      "habitat": "forest",
      "place": "北美洲 · 加拿大魁北克",
      "point": [
        -71.5,
        46.9
      ],
      "home": "糖槭生长在北美东部的温带森林，魁北克是著名的枫糖产区。",
      "adaptation": "冬季落叶减少寒冷时的失水；春季树液流动与气温变化有关。",
      "clue": "叶片像张开的手掌，常有五个主要裂片，秋天会变黄、橙或红。",
      "mapPlace": "Canada",
      "source": "https://powo.science.kew.org/results?q=Acer%20saccharum",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Acer_saccharum_1-jgreenlee_%285098070608%29.jpg"
    },
    {
      "id": "saguaro",
      "name": "巨人柱",
      "scientificName": "Carnegiea gigantea",
      "habitat": "dryland",
      "place": "北美洲 · 美国索诺兰沙漠",
      "point": [
        -110.9,
        32.2
      ],
      "home": "巨人柱主要生长在美国和墨西哥交界一带的索诺兰沙漠。",
      "adaptation": "粗厚的绿色茎储存水并进行光合作用，褶皱能随含水量变化而伸缩。",
      "clue": "高大的肉质茎像烛台，表面有纵向褶皱和一簇簇刺。",
      "mapPlace": "United States of America",
      "source": "https://powo.science.kew.org/results?q=Carnegiea%20gigantea",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Carnegiea_gigantea_in_Saguaro_National_Park_near_Tucson%2C_Arizona_during_November_%2858%29.jpg"
    },
    {
      "id": "joshua-tree",
      "name": "约书亚树",
      "scientificName": "Yucca brevifolia",
      "habitat": "dryland",
      "place": "北美洲 · 美国莫哈韦沙漠",
      "point": [
        -115.9,
        34.1
      ],
      "home": "约书亚树是美国莫哈韦沙漠的代表植物之一，喜欢较干燥的环境。",
      "adaptation": "坚硬、狭长的叶片适应干燥环境；它与特定的丝兰蛾有密切的传粉关系。",
      "clue": "树枝末端长着一簇簇硬而尖的叶子，它不是仙人掌。",
      "mapPlace": "United States of America",
      "source": "https://powo.science.kew.org/results?q=Yucca%20brevifolia",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Joshua_Tree_01.jpg"
    },
    {
      "id": "venus-flytrap",
      "name": "捕蝇草",
      "scientificName": "Dionaea muscipula",
      "habitat": "wetland",
      "place": "北美洲 · 美国卡罗来纳沿海",
      "point": [
        -78.1,
        34.1
      ],
      "home": "野生捕蝇草的原生范围很小，主要在美国卡罗来纳沿海的湿地。",
      "adaptation": "它仍靠光合作用制造养分，捕捉小动物主要帮助它补充贫瘠土壤中缺少的矿质营养。",
      "clue": "叶片末端像一张带齿的小夹子，里面还有细细的触发毛。",
      "mapPlace": "United States of America",
      "source": "https://powo.science.kew.org/results?q=Dionaea%20muscipula",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Venus_Flytrap_showing_trigger_hairs.jpg"
    },
    {
      "id": "brazil-nut",
      "name": "巴西坚果树",
      "scientificName": "Bertholletia excelsa",
      "habitat": "rainforest",
      "place": "南美洲 · 巴西亚马孙雨林",
      "point": [
        -62.0,
        -4.5
      ],
      "home": "它生长在南美洲亚马孙地区的热带雨林中，巴西是代表分布国之一。",
      "adaptation": "坚硬的果壳限制了取食者；刺豚鼠等动物搬运和埋藏种子，帮助它传播。",
      "clue": "树冠高大，坚硬的圆形果实里装着多颗种子。",
      "mapPlace": "Brazil",
      "source": "https://powo.science.kew.org/results?q=Bertholletia%20excelsa",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Bertholletia_excelsa_compose.jpg"
    },
    {
      "id": "victoria",
      "name": "亚马孙王莲",
      "scientificName": "Victoria amazonica",
      "habitat": "wetland",
      "place": "南美洲 · 巴西亚马孙水域",
      "point": [
        -55.0,
        -3.0
      ],
      "home": "它生长在亚马孙流域温暖、流速较缓的水域，世界各地植物园也有栽培。",
      "adaptation": "叶片展开在水面接收阳光，叶背的支撑结构和通气组织适应水中生活。",
      "clue": "巨大的圆叶边缘翘起，像漂在水上的浅盘，叶背有粗壮的叶脉。",
      "mapPlace": "Brazil",
      "source": "https://powo.science.kew.org/results?q=Victoria%20amazonica",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Victoria_amazonica_edit_1.jpg"
    },
    {
      "id": "cacao",
      "name": "可可",
      "scientificName": "Theobroma cacao",
      "habitat": "rainforest",
      "place": "南美洲 · 厄瓜多尔热带地区",
      "point": [
        -79.0,
        -1.3
      ],
      "home": "可可原产热带美洲，厄瓜多尔等热带地区广泛栽培，它的种子用于制作可可制品。",
      "adaptation": "幼树适应温暖湿润、有遮阴的环境；许多小型昆虫能帮助花朵传粉。",
      "clue": "花朵和果实常直接长在树干或粗枝上，这叫老茎生花。",
      "mapPlace": "Ecuador",
      "source": "https://powo.science.kew.org/results?q=Theobroma%20cacao",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Matadecacao.jpg"
    },
    {
      "id": "monkey-puzzle",
      "name": "智利南洋杉",
      "scientificName": "Araucaria araucana",
      "habitat": "forest",
      "place": "南美洲 · 智利安第斯山",
      "point": [
        -71.6,
        -38.6
      ],
      "home": "它天然分布在智利和阿根廷的部分山地，是南美南部的代表针叶树。",
      "adaptation": "厚实的树皮能提供一定保护，坚硬常绿的叶片适应山地环境。",
      "clue": "三角形的硬叶密密覆盖枝条，看起来像层层叠起的鳞甲。",
      "mapPlace": "Chile",
      "source": "https://powo.science.kew.org/results?q=Araucaria%20araucana",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Araucaria_en_Parque_Nacional_Conguillio.jpg"
    },
    {
      "id": "quiver-tree",
      "name": "二歧芦荟",
      "scientificName": "Aloidendron dichotomum",
      "habitat": "dryland",
      "place": "非洲 · 纳米比亚南部",
      "point": [
        18.1,
        -26.5
      ],
      "home": "它生长在非洲南部的干旱地区，包括纳米比亚南部和南非部分地区。",
      "adaptation": "肥厚的叶片能储存水，表面的保护层能减少干燥空气带来的失水。",
      "clue": "枝条一次次分叉，末端顶着一丛肥厚的叶子。",
      "mapPlace": "Namibia",
      "source": "https://powo.science.kew.org/results?q=Aloidendron%20dichotomum",
      "photoSource": "https://commons.wikimedia.org/wiki/File:QuiverTree-Namibia-2015.JPG"
    },
    {
      "id": "baobab",
      "name": "大猴面包树",
      "scientificName": "Adansonia grandidieri",
      "habitat": "dryland",
      "place": "非洲 · 马达加斯加西部",
      "point": [
        44.42,
        -20.25
      ],
      "home": "这种猴面包树是马达加斯加特有的植物，在岛西部的季节性干旱地区有分布。",
      "adaptation": "树干组织可以储存水分，干季落叶能减少水分散失。",
      "clue": "粗壮的树干像高大的圆柱，枝条集中在树冠顶端。",
      "mapPlace": "Madagascar",
      "source": "https://powo.science.kew.org/results?q=Adansonia%20grandidieri",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Adansonia_grandidieri04.jpg"
    },
    {
      "id": "welwitschia",
      "name": "千岁兰",
      "scientificName": "Welwitschia mirabilis",
      "habitat": "dryland",
      "place": "非洲 · 纳米布沙漠",
      "point": [
        15.0,
        -23.0
      ],
      "home": "千岁兰只天然分布在纳米比亚和安哥拉的纳米布沙漠一带。",
      "adaptation": "缓慢生长、长寿的叶片和发达根系帮助它应对干旱，沿海雾气也是当地重要的水分条件。",
      "clue": "看起来有许多长条，其实主要是两片不断生长、又被撕裂的真叶。",
      "mapPlace": "Namibia",
      "source": "https://powo.science.kew.org/results?q=Welwitschia%20mirabilis",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Welwitschia_mirabilis%282%29.jpg"
    },
    {
      "id": "papyrus",
      "name": "纸莎草",
      "scientificName": "Cyperus papyrus",
      "habitat": "wetland",
      "place": "非洲 · 乌干达湿地",
      "point": [
        32.5,
        0.5
      ],
      "home": "它主要生长在非洲温暖地区的淡水湿地，乌干达的湖滨沼泽是代表地点。",
      "adaptation": "地下根茎能在湿地扩展，茎叶的通气组织有助于在水湿土壤中生活。",
      "clue": "高高的茎顶端散开成一把绿色的伞，茎的横截面呈三角形。",
      "mapPlace": "Uganda",
      "source": "https://powo.science.kew.org/results?q=Cyperus%20papyrus",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Papyrus_%28Cyperus_papyrus%29_%287079191471%29.jpg"
    },
    {
      "id": "olive",
      "name": "油橄榄",
      "scientificName": "Olea europaea",
      "habitat": "mediterranean",
      "place": "欧洲 · 希腊",
      "point": [
        22.0,
        37.0
      ],
      "home": "油橄榄是地中海地区的代表树木，希腊等地有悠久的栽培历史。",
      "adaptation": "坚韧的小叶和叶面保护层有助于减少失水，适应夏季炎热少雨的气候。",
      "clue": "狭长的叶片上面较深、背面银灰，果实成熟时颜色会变化。",
      "mapPlace": "Greece",
      "source": "https://powo.science.kew.org/results?q=Olea%20europaea",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Olea_europaea_cuspidata-africana_Cape_Town.JPG"
    },
    {
      "id": "cork-oak",
      "name": "欧洲栓皮栎",
      "scientificName": "Quercus suber",
      "habitat": "mediterranean",
      "place": "欧洲 · 葡萄牙",
      "point": [
        -8.0,
        39.0
      ],
      "home": "欧洲栓皮栎生长在地中海西部，葡萄牙有大片栓皮栎林。",
      "adaptation": "厚树皮能保护内部组织，也能抵御一定程度的火和水分散失。",
      "clue": "树皮形成厚厚的木栓层，常见的软木塞就与这种材料有关。",
      "mapPlace": "Portugal",
      "source": "https://powo.science.kew.org/results?q=Quercus%20suber",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Cork_oak_%2828864190188%29.jpg"
    },
    {
      "id": "edelweiss",
      "name": "雪绒花",
      "scientificName": "Leontopodium nivale",
      "habitat": "alpine",
      "place": "欧洲 · 阿尔卑斯山",
      "point": [
        8.2,
        46.5
      ],
      "home": "阿尔卑斯山等欧洲高山地区有雪绒花，常见于岩石多的草地和山坡。",
      "adaptation": "植株低矮，密集细毛能帮助应对高山的强光、低温和风。",
      "clue": "星形的白色部分有许多细毛，真正的小花聚在中央的小花序里。",
      "mapPlace": "Switzerland",
      "source": "https://powo.science.kew.org/results?q=Leontopodium%20nivale",
      "photoSource": "https://commons.wikimedia.org/wiki/File:3840px-Alpen_Edelwei%C3%9F%2C_Leontopodium_alpinum_2.JPG"
    },
    {
      "id": "scots-pine",
      "name": "欧洲赤松",
      "scientificName": "Pinus sylvestris",
      "habitat": "forest",
      "place": "欧洲 · 芬兰森林",
      "point": [
        26.0,
        66.0
      ],
      "home": "欧洲赤松横跨欧亚大陆广泛分布，芬兰等北方国家有大片森林。",
      "adaptation": "针形叶片和表面的保护层有助于减少失水，常绿树冠能利用较短的温暖季节。",
      "clue": "针叶通常两针一束，树干上部的树皮常呈橙红色。",
      "mapPlace": "Finland",
      "source": "https://powo.science.kew.org/results?q=Pinus%20sylvestris",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Skuleskogen_pine.jpg"
    },
    {
      "id": "dragon-blood-tree",
      "name": "索科特拉龙血树",
      "scientificName": "Dracaena cinnabari",
      "habitat": "dryland",
      "place": "亚洲 · 也门索科特拉岛",
      "point": [
        54.0,
        12.5
      ],
      "home": "它是也门索科特拉岛的特有植物，生长在岛上的部分高地。",
      "adaptation": "伞状树冠下的阴影能减轻地面暴晒，叶片还能截留部分雾滴。",
      "clue": "树冠像一把撑开的伞，许多分枝托着密集的叶簇。",
      "mapPlace": "Yemen",
      "source": "https://powo.science.kew.org/results?q=Dracaena%20cinnabari",
      "photoSource": "https://commons.wikimedia.org/wiki/File:3840px-Dragonblood_tree_in_Socotra_2.jpg"
    },
    {
      "id": "rafflesia",
      "name": "大王花",
      "scientificName": "Rafflesia arnoldii",
      "habitat": "rainforest",
      "place": "亚洲 · 印度尼西亚苏门答腊",
      "point": [
        101.5,
        -3.5
      ],
      "home": "这种大王花生长在苏门答腊等地的热带雨林中，依赖特定的藤本宿主。",
      "adaptation": "它寄生在宿主组织中，不能像绿叶植物那样进行光合作用，气味可吸引部分蝇类传粉。",
      "clue": "能看到巨大的红褐色花朵，却找不到普通植物那样的绿叶和茎。",
      "mapPlace": "Indonesia",
      "source": "https://powo.science.kew.org/results?q=Rafflesia%20arnoldii",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Rafflesia_arnoldii%2C_Sumatra.jpg"
    },
    {
      "id": "rainbow-eucalyptus",
      "name": "彩虹桉",
      "scientificName": "Eucalyptus deglupta",
      "habitat": "rainforest",
      "place": "亚洲 · 菲律宾棉兰老岛",
      "point": [
        125.1,
        7.1
      ],
      "home": "彩虹桉原产菲律宾、印度尼西亚和新几内亚等湿热地区。",
      "adaptation": "它适合温暖湿润的环境；彩色树干来自树皮更新，并不是树木在发光。",
      "clue": "树皮片状脱落后露出新表面，树干上会出现绿色、橙色等色带。",
      "mapPlace": "Philippines",
      "source": "https://powo.science.kew.org/results?q=Eucalyptus%20deglupta",
      "photoSource": "https://commons.wikimedia.org/wiki/File:EucalyptusDeglupta_TallTree.jpg"
    },
    {
      "id": "mountain-ash",
      "name": "王桉",
      "scientificName": "Eucalyptus regnans",
      "habitat": "forest",
      "place": "大洋洲 · 澳大利亚维多利亚州",
      "point": [
        146.5,
        -37.5
      ],
      "home": "王桉天然分布在澳大利亚东南部的湿润森林，包括维多利亚州和塔斯马尼亚州。",
      "adaptation": "高大的树冠有利于获取阳光；火后能靠种子更新，但幼林需要足够时间长大并结种。",
      "clue": "高大的树干顶部常有光滑树皮，镰刀形的叶片挂在高处的枝条上。",
      "mapPlace": "Australia",
      "source": "https://powo.science.kew.org/results?q=Eucalyptus%20regnans",
      "photoSource": "https://commons.wikimedia.org/wiki/File:MountainAshWithCars.jpg"
    },
    {
      "id": "silver-fern",
      "name": "银蕨",
      "scientificName": "Alsophila dealbata",
      "habitat": "forest",
      "place": "大洋洲 · 新西兰北岛",
      "point": [
        174.0,
        -39.0
      ],
      "home": "银蕨是新西兰的树蕨，常见于当地湿润森林。",
      "adaptation": "蕨类靠孢子繁殖，适合湿润环境；观察叶背，有时能看到与繁殖有关的孢子囊群。",
      "clue": "展开的大叶片像羽毛，成熟叶片的背面常呈银白色。",
      "mapPlace": "New Zealand",
      "source": "https://powo.science.kew.org/results?q=Alsophila%20dealbata",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Alsophila_tricolor_kz03.jpg"
    },
    {
      "id": "antarctic-hair-grass",
      "name": "南极发草",
      "scientificName": "Deschampsia antarctica",
      "habitat": "polar",
      "place": "南极洲 · 南设得兰群岛",
      "point": [
        -58.7,
        -62.2
      ],
      "home": "南极半岛及附近岛屿的部分无冰地带有南极发草，南设得兰群岛是代表地点之一。",
      "adaptation": "低矮丛生能减轻风的影响，它利用短暂的夏季生长，是南极少数原生开花植物之一。",
      "clue": "一丛丛细窄的绿叶紧贴地面，看起来像不起眼的小草垫。",
      "mapPlace": "Antarctica",
      "source": "https://powo.science.kew.org/results?q=Deschampsia%20antarctica",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Deschampsia_antarctica.jpg"
    }
  ]
};

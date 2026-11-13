/* 点位表示代表分布或栽培地点，不表示完整分布范围。ID 用于植物深链接及同名本地照片。 */
window.GM_FLORA = {
  "habitats": [
    {
      "id": "forest",
      "name": "山地森林",
      "color": "#286647"
    },
    {
      "id": "alpine",
      "name": "高寒山地",
      "color": "#66529b"
    },
    {
      "id": "desert",
      "name": "干旱地带",
      "color": "#8b591b"
    },
    {
      "id": "wetland",
      "name": "河湖湿地",
      "color": "#236c9d"
    },
    {
      "id": "coast",
      "name": "滨海红树林",
      "color": "#176f76"
    },
    {
      "id": "tropical",
      "name": "热带林地",
      "color": "#9b472b"
    },
    {
      "id": "farmland",
      "name": "农田与茶园",
      "color": "#64751d"
    }
  ],
  "plants": [
    {
      "id": "ginkgo",
      "name": "银杏",
      "scientificName": "Ginkgo biloba",
      "habitat": "forest",
      "place": "浙江 · 天目山",
      "point": [
        119.45,
        30.34
      ],
      "home": "在天目山等地可以看到古老的银杏。它也被广泛栽种在公园和道路旁。",
      "adaptation": "银杏是落叶树。冬季到来前落叶，可以减少寒冷季节的水分散失。",
      "clue": "扇形叶片，叶脉像细线一样向外分叉。秋天叶片会变成金黄色。",
      "adcode": "330000",
      "source": "https://www.iplant.cn/info/Ginkgo%20biloba",
      "photoSource": "https://commons.wikimedia.org/wiki/File:GINKGOBAUM-2.jpg"
    },
    {
      "id": "metasequoia",
      "name": "水杉",
      "scientificName": "Metasequoia glyptostroboides",
      "habitat": "forest",
      "place": "湖北 · 利川",
      "point": [
        108.57,
        30.3
      ],
      "home": "利川一带的湿润山谷是水杉的原生地之一，许多城市也有栽培。",
      "adaptation": "与许多常绿针叶树不同，水杉秋冬会落叶；它适合湿润的土壤环境。",
      "clue": "细小的叶片在小枝两侧成对排列，整根小枝像一片羽毛。",
      "adcode": "420000",
      "source": "https://www.iplant.cn/info/Metasequoia%20glyptostroboides",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Metasequoia_glyptostroboides_in_Forest_park_of_Aichi_Prefecture.jpg"
    },
    {
      "id": "dove-tree",
      "name": "珙桐",
      "scientificName": "Davidia involucrata",
      "habitat": "forest",
      "place": "四川 · 峨眉山",
      "point": [
        103.33,
        29.55
      ],
      "home": "珙桐生长在我国中西部湿润的山地森林中，峨眉山是代表地点之一。",
      "adaptation": "宽大的白色苞片在绿叶间很显眼，能帮助昆虫找到中间的花序。",
      "clue": "远看像白鸽的两片白色部分是苞片，真正的小花聚成中间的圆球。",
      "adcode": "510000",
      "source": "https://www.iplant.cn/info/Davidia%20involucrata",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Davidia_involucrata_flowering_branch.jpg"
    },
    {
      "id": "cathaya",
      "name": "银杉",
      "scientificName": "Cathaya argyrophylla",
      "habitat": "forest",
      "place": "广西 · 花坪",
      "point": [
        109.98,
        25.57
      ],
      "home": "广西、贵州、湖南和重庆等地的部分山地保存着银杉的小片天然林。",
      "adaptation": "它在湿润、多雾的山地生长，幼苗需要合适的林间光照，不能只靠树多来判断环境好坏。",
      "clue": "细长的叶片背面有两条浅色气孔带，翻看叶片两面就能比较。",
      "adcode": "450000",
      "source": "https://www.iplant.cn/info/Cathaya%20argyrophylla",
      "photoSource": "https://commons.wikimedia.org/wiki/File:C%C3%B4nes_de_Cathaya_argyrophylla_au_jardin_jungle.jpg"
    },
    {
      "id": "taiwania",
      "name": "台湾杉",
      "scientificName": "Taiwania cryptomerioides",
      "habitat": "forest",
      "place": "台湾 · 中央山脉",
      "point": [
        121.22,
        23.55
      ],
      "home": "台湾中央山脉的湿润山地有台湾杉，云南等地也有天然分布。",
      "adaptation": "湿润山地提供水分；高大的树冠让叶片能够接触到更多阳光。",
      "clue": "树干高大笔直，幼树的叶子尖，成年树上的叶片常贴着枝条。",
      "adcode": "710000",
      "source": "https://www.iplant.cn/info/Taiwania%20cryptomerioides",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Taiwania_cryptomerioides_-_Mendocino_Coast_Botanical_Gardens_-_DSC02059.JPG"
    },
    {
      "id": "dahurian-larch",
      "name": "兴安落叶松",
      "scientificName": "Larix gmelinii",
      "habitat": "forest",
      "place": "内蒙古 · 大兴安岭",
      "point": [
        121.3,
        50.3
      ],
      "home": "大兴安岭寒冷的森林里，兴安落叶松是常见的主要树种。",
      "adaptation": "在漫长寒冬前落掉针叶，有助于减少失水，等春天再长出新叶。",
      "clue": "短枝上的针叶常簇生成一小束，秋天针叶变黄并脱落。",
      "adcode": "150000",
      "source": "https://www.iplant.cn/info/Larix%20gmelinii",
      "photoSource": "https://commons.wikimedia.org/wiki/File:3840px-373_%D0%97%D0%B0%D1%85%D0%BE%D0%B4_%D0%B2_%D0%BB%D0%B5%D1%81_%D0%B2%D0%BE%D0%B7%D0%BB%D0%B5_%D0%BF%D0%B5%D1%80%D0%B2%D0%BE%D0%B3%D0%BE_%D0%BE%D0%B7%D0%B5%D1%80%D0%B0.jpg"
    },
    {
      "id": "korean-pine",
      "name": "红松",
      "scientificName": "Pinus koraiensis",
      "habitat": "forest",
      "place": "吉林 · 长白山",
      "point": [
        128.15,
        42.35
      ],
      "home": "红松生长在我国东北的山地针阔混交林中，长白山是代表地点之一。",
      "adaptation": "针形叶片的表面积较小，表面的保护层也有助于减少水分散失。",
      "clue": "针叶通常五针一束。大球果里有种子，松鼠等动物会取食和搬运。",
      "adcode": "220000",
      "source": "https://www.iplant.cn/info/Pinus%20koraiensis",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Pinus_koraiensis%2C_Cheremshany%2C_Sikhote_Alin%2C_Russia.jpg"
    },
    {
      "id": "white-birch",
      "name": "白桦",
      "scientificName": "Betula platyphylla",
      "habitat": "forest",
      "place": "黑龙江 · 伊春",
      "point": [
        128.9,
        47.72
      ],
      "home": "白桦喜光，在我国东北、华北等地都有分布，伊春的林地里也能见到。",
      "adaptation": "森林出现空地后，轻小的种子可以随风传播，白桦常能较早长起来。",
      "clue": "白色树皮上有深色横纹，叶片边缘有锯齿。",
      "adcode": "230000",
      "source": "https://www.iplant.cn/info/Betula%20platyphylla",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Betula_platyphylla_01-10-2005_14.55.52.JPG"
    },
    {
      "id": "huashan-pine",
      "name": "华山松",
      "scientificName": "Pinus armandii",
      "habitat": "forest",
      "place": "陕西 · 华山",
      "point": [
        110.08,
        34.49
      ],
      "home": "华山松分布在我国中部和西南部山地，名字来自陕西华山。",
      "adaptation": "针叶和常绿树冠适应山地生活，但它的分布仍受温度、水分等条件限制。",
      "clue": "针叶五针一束，但球果和种子的样子与红松不同，可以并排比较。",
      "adcode": "610000",
      "source": "https://www.iplant.cn/info/Pinus%20armandii",
      "photoSource": "https://commons.wikimedia.org/wiki/File:3840px-Pinus_armandii_Cangshan.jpg"
    },
    {
      "id": "qilian-juniper",
      "name": "祁连圆柏",
      "scientificName": "Juniperus przewalskii",
      "habitat": "alpine",
      "place": "青海 · 祁连",
      "point": [
        100.4,
        38.1
      ],
      "home": "青藏高原东北部的高山阳坡上，可以找到祁连圆柏组成的疏林。",
      "adaptation": "细小的叶片有助于减少水分散失，使它能在较冷、较干的高山环境中生长。",
      "clue": "树冠常呈尖塔形，细小的鳞状叶紧贴小枝。",
      "adcode": "630000",
      "source": "https://www.iplant.cn/info/Juniperus%20przewalskii",
      "photoSource": "https://www.nativeplants.info/plant/coniferophyta-conifers/cupressaceae/juniperus/juniperus_przewalskii.html"
    },
    {
      "id": "rhododendron",
      "name": "杜鹃",
      "scientificName": "Rhododendron simsii",
      "habitat": "forest",
      "place": "江西 · 井冈山",
      "point": [
        114.17,
        26.57
      ],
      "home": "杜鹃分布于我国南方许多山地，井冈山的春季花景就是代表之一。",
      "adaptation": "鲜艳的花冠能吸引传粉昆虫；它适宜在酸性土壤中生长。",
      "clue": "花朵像小喇叭，花冠上常能找到深色斑点。",
      "adcode": "360000",
      "source": "https://www.iplant.cn/info/Rhododendron%20simsii",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Rhododendron_simsii-bunga_2-Lany_pirna.jpg"
    },
    {
      "id": "lotus",
      "name": "荷花",
      "scientificName": "Nelumbo nucifera",
      "habitat": "wetland",
      "place": "山东 · 微山湖",
      "point": [
        117.12,
        34.65
      ],
      "home": "微山湖等淡水湖泊常有荷花，也有许多专门栽培的荷塘。",
      "adaptation": "根茎扎在水底泥中，叶柄内部的通气组织能帮助空气到达水下部位。",
      "clue": "圆叶像一把伞，叶柄接近叶片中央；莲蓬里藏着种子。",
      "adcode": "370000",
      "source": "https://www.iplant.cn/info/Nelumbo%20nucifera",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Sacred_lotus_Nelumbo_nucifera.jpg"
    },
    {
      "id": "common-reed",
      "name": "芦苇",
      "scientificName": "Phragmites australis",
      "habitat": "wetland",
      "place": "江苏 · 盐城湿地",
      "point": [
        120.55,
        33.6
      ],
      "home": "河岸、湖边和部分滨海湿地都有芦苇，盐城湿地是代表地点之一。",
      "adaptation": "地下根茎能向周围伸展，帮助它形成成片的苇荡，也能在来年重新长出茎叶。",
      "clue": "细长的叶片包着挺直的茎，秋天顶端会出现蓬松的花序。",
      "adcode": "320000",
      "source": "https://www.iplant.cn/info/Phragmites%20australis",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Reed_panicle_at_Brodalen_1.jpg"
    },
    {
      "id": "mangrove",
      "name": "秋茄",
      "scientificName": "Kandelia obovata",
      "habitat": "coast",
      "place": "福建 · 九龙江口",
      "point": [
        117.88,
        24.42
      ],
      "home": "秋茄是红树林植物之一，生长在东南沿海有潮汐的河口和海湾。",
      "adaptation": "种子可在母树上萌发，发育后的胚轴落入泥中或随水漂流，有机会在潮间带扎根。",
      "clue": "树上垂着像长铅笔的胚轴，它与普通树上挂着的果实很不一样。",
      "adcode": "350000",
      "source": "https://www.iplant.cn/info/Kandelia%20obovata",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Kandelia_obovata_at_Ting_Kok_mangrove.JPG"
    },
    {
      "id": "coconut",
      "name": "椰子",
      "scientificName": "Cocos nucifera",
      "habitat": "tropical",
      "place": "海南 · 文昌",
      "point": [
        110.79,
        19.55
      ],
      "home": "海南文昌等热带地区栽培椰子，海边和村庄周围都能看到高高的椰树。",
      "adaptation": "果实外层纤维有助于漂浮，能够随海水传播；温暖环境适合它全年生长。",
      "clue": "大叶片像羽毛，果实外面包着厚厚的纤维层。",
      "adcode": "460000",
      "source": "https://www.iplant.cn/info/Cocos%20nucifera",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Coconut_4.jpg"
    },
    {
      "id": "rubber-tree",
      "name": "橡胶树",
      "scientificName": "Hevea brasiliensis",
      "habitat": "tropical",
      "place": "云南 · 西双版纳",
      "point": [
        100.85,
        21.92
      ],
      "home": "橡胶树原产南美洲，我国在西双版纳等热带地区引种栽培。",
      "adaptation": "它需要温暖、湿润的环境。乳汁是植物组织中的分泌物，并不是树木的血液。",
      "clue": "一片复叶通常有三片小叶，树皮受伤时能流出乳白色的乳汁。",
      "adcode": "530000",
      "source": "https://www.iplant.cn/info/Hevea%20brasiliensis",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Koh_Chang%2C_Thailand%2C_Rubber_tree.jpg"
    },
    {
      "id": "tea",
      "name": "茶树",
      "scientificName": "Camellia sinensis",
      "habitat": "farmland",
      "place": "福建 · 武夷山",
      "point": [
        117.95,
        27.72
      ],
      "home": "武夷山等温暖湿润的丘陵有茶园，茶树常被修剪成便于采叶的矮树。",
      "adaptation": "温暖湿润、排水良好的酸性土壤适合茶树；人们修剪后能促使侧枝生长。",
      "clue": "叶片边缘有细锯齿，花多为白色，黄色雄蕊很显眼。",
      "adcode": "350000",
      "source": "https://www.iplant.cn/info/Camellia%20sinensis",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Csinensis.jpg"
    },
    {
      "id": "rice",
      "name": "水稻",
      "scientificName": "Oryza sativa",
      "habitat": "farmland",
      "place": "湖南 · 洞庭湖平原",
      "point": [
        112.4,
        29.1
      ],
      "home": "洞庭湖平原等地区广泛种植水稻。地图标的是栽培地点，不是野生起源地。",
      "adaptation": "根部的通气组织帮助它适应水田；水稻也有适合不同水分条件的品种。",
      "clue": "细长叶片包着中空的茎，成熟的稻穗上结着一粒粒稻谷。",
      "adcode": "430000",
      "source": "https://www.iplant.cn/info/Oryza%20sativa",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Mature_Rice_%28India%29_by_Augustus_Binu.jpg"
    },
    {
      "id": "rapeseed",
      "name": "油菜",
      "scientificName": "Brassica napus",
      "habitat": "farmland",
      "place": "江西 · 婺源",
      "point": [
        117.85,
        29.25
      ],
      "home": "婺源等地春天常见大片油菜田，人们种植它来收获含油的种子。",
      "adaptation": "花朵可吸引昆虫传粉；农业播种时间会随当地温度和品种而变化。",
      "clue": "黄色花朵通常有四片花瓣，像一个小十字；花后长出细长的角果。",
      "adcode": "360000",
      "source": "https://www.iplant.cn/info/Brassica%20napus",
      "photoSource": "https://commons.wikimedia.org/wiki/File:The_yellow_cloud.jpg"
    },
    {
      "id": "cotton",
      "name": "棉花",
      "scientificName": "Gossypium hirsutum",
      "habitat": "farmland",
      "place": "新疆 · 阿克苏",
      "point": [
        80.3,
        41.17
      ],
      "home": "阿克苏等地有大面积棉田，阳光和灌溉水共同影响棉花生长。",
      "adaptation": "棉花喜欢温暖和充足日照，但它仍需要水，不能把棉田等同于不需浇水的荒漠植物。",
      "clue": "棉铃裂开后露出的白色纤维长在种子表面，不是花瓣。",
      "adcode": "650000",
      "source": "https://www.iplant.cn/info/Gossypium%20hirsutum",
      "photoSource": "https://commons.wikimedia.org/wiki/File:CottonPlant.JPG"
    },
    {
      "id": "desert-poplar",
      "name": "胡杨",
      "scientificName": "Populus euphratica",
      "habitat": "desert",
      "place": "新疆 · 塔里木河",
      "point": [
        84.2,
        41.1
      ],
      "home": "塔里木河沿岸的地下水养育着胡杨林，它并不是离开水也能生活的树。",
      "adaptation": "发达的根系帮助它利用地下水；它还能适应一定程度的盐碱环境。",
      "clue": "同一棵树上有时能找到窄长叶和较宽的叶，叶形会随枝条和树龄变化。",
      "adcode": "650000",
      "source": "https://www.iplant.cn/info/Populus%20euphratica",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Tarim_Desert_Highway_-_Desert_poplars%2C_Xinjiang%2C_China.jpg"
    },
    {
      "id": "saxaul",
      "name": "梭梭",
      "scientificName": "Haloxylon ammodendron",
      "habitat": "desert",
      "place": "内蒙古 · 阿拉善",
      "point": [
        103.0,
        40.7
      ],
      "home": "梭梭生长在我国西北的荒漠地带，阿拉善的沙地上就能见到。",
      "adaptation": "细小的叶片减少失水，绿色枝条承担光合作用；根系帮助它在沙土中获取水分。",
      "clue": "叶片退化得很小，绿色的细枝看起来像一节一节的。",
      "adcode": "150000",
      "source": "https://www.iplant.cn/info/Haloxylon%20ammodendron",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Saxaul-baum.JPG"
    },
    {
      "id": "sea-buckthorn",
      "name": "沙棘",
      "scientificName": "Hippophae rhamnoides",
      "habitat": "desert",
      "place": "山西 · 吕梁",
      "point": [
        111.1,
        37.5
      ],
      "home": "吕梁山区等地的坡地有沙棘，黄土高原也常利用它来恢复植被。",
      "adaptation": "发达的根系有助于固定土壤；根上的根瘤与微生物合作，能利用空气中的氮。",
      "clue": "叶片细长，背面带银白色鳞片；秋天橙黄色小果常挤在枝条上。",
      "adcode": "140000",
      "source": "https://www.iplant.cn/info/Hippophae%20rhamnoides",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Hippophae_rhamnoides-01_%28xndr%29.JPG"
    },
    {
      "id": "qinghai-spruce",
      "name": "青海云杉",
      "scientificName": "Picea crassifolia",
      "habitat": "alpine",
      "place": "甘肃 · 祁连山",
      "point": [
        100.7,
        38.7
      ],
      "home": "祁连山一些较湿润的阴坡有青海云杉林，与阳坡上的疏林、草地形成对照。",
      "adaptation": "针叶有助于减少水分散失，山坡朝向造成的水分和温度差异也影响它的分布。",
      "clue": "树冠像尖塔，针叶一根根长在枝条上，成熟球果向下悬挂。",
      "adcode": "620000",
      "source": "https://www.iplant.cn/info/Picea%20crassifolia",
      "photoSource": "https://commons.wikimedia.org/wiki/File:Picea_crassifolia%2C_Qunjiaxiang%2C_Qinghai%2C_China.jpg"
    }
  ]
};

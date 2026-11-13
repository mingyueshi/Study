/* 世界地图条目数据：图层、大洲与大洋、世界地标、国家中文名与大洲映射、找一找题库。
   国家几何在 world-geo.js（脚本生成）；「中国×世界」对照卡复用 map-data.js 的 GM_WORLD_TEASERS。
   国家映射的键是 world-geo.js 里的英文名（测试会核对两者一一对应）。 */

window.GM_WORLD_LAYERS = [
  {
    "id": "continent",
    "name": "七大洲",
    "icon": "🌍",
    "accent": "#2e7d64",
    "hint": "国家和地区按大洲着色。点一下，看看它在哪个大洲，或是哪片大洋。",
    "blank": "点地图上的国家、地区或大洋，打开它的档案。"
  },
  {
    "id": "extreme",
    "name": "世界地标",
    "icon": "🏆",
    "accent": "#b07d3a",
    "hint": "找找珠穆朗玛峰、尼罗河、撒哈拉沙漠和其他地标。",
    "blank": "点地图上的山峰、大河、沙漠等标记，打开地标档案。"
  },
  {
    "id": "home",
    "name": "中国与世界",
    "icon": "🇨🇳",
    "accent": "#b04a3a",
    "hint": "金色的是中国，点它看中国在世界上站的位置。",
    "blank": "金色那块就是中国。点它，看看中国在世界上的位置。"
  }
];

/* 七大洲：国家按主要部分归入其中之一着色，地跨两洲的国家按习惯划分。 */
window.GM_CONTINENTS = [
  {
    id: 'asia', name: '亚洲', color: '#f0c75e',
    hint: '世界上面积最大的大洲，我们中国就住在亚洲东部。',
    location: '大部分位于北半球，东临太平洋，南临印度洋，北临北冰洋；西边与欧洲连成亚欧大陆。',
    facts: [
      { title: '大洲之最', text: '亚洲的陆地面积最大，人口也最多。中国、印度和日本都在这里。' },
      { title: '高山与平原', text: '中部有青藏高原和喜马拉雅山脉，周围分布着广阔的平原，地势高低差别很大。' },
      { title: '从寒冷到炎热', text: '亚洲从北方冰雪地带一直伸到赤道附近。北部寒冷，南部有热带雨林，东部和南部许多地方受季风影响。' }
    ],
    places: ['China', 'India', 'Japan'],
    observe: '先找到中国，再向西找印度、向东找日本。它们分别靠近哪片海洋？',
    source: 'https://education.nationalgeographic.org/resource/asia/'
  },
  {
    id: 'europe', name: '欧洲', color: '#8fa8d8',
    hint: '位于亚欧大陆西部，海岸曲折，半岛和岛屿很多。',
    location: '全部位于北半球，西临大西洋，北临北冰洋，南面隔着地中海与非洲相望。',
    facts: [
      { title: '半岛与海湾', text: '欧洲面积较小，海岸线却很曲折。意大利伸进地中海，样子像一只靴子。' },
      { title: '平原与山脉', text: '欧洲中部和东部有广阔的平原，南部有阿尔卑斯山脉，北部还有冰川塑造的峡湾。' },
      { title: '海洋的影响', text: '西部许多地方受大西洋影响，冬天较温和、雨水较多；越往内陆，冬夏温差通常越大。' }
    ],
    places: ['France', 'Germany', 'Italy'],
    observe: '在南边找意大利这只「靴子」。它伸进的海叫什么？海对面是哪一个洲？',
    source: 'https://education.nationalgeographic.org/resource/europe-physical-geography/'
  },
  {
    id: 'africa', name: '非洲', color: '#d8875f',
    hint: '赤道从中部穿过，北部有撒哈拉沙漠，东北部有尼罗河。',
    location: '赤道从中部穿过，西临大西洋，东临印度洋，北面隔着地中海与欧洲相望。',
    facts: [
      { title: '炎热的大陆', text: '非洲的大部分陆地位于南北回归线之间，热带范围很广，全年炎热的地方很多。' },
      { title: '沙漠、雨林与草原', text: '北部的撒哈拉是世界最大的热沙漠；赤道附近有刚果盆地雨林，雨林两侧分布着大片热带草原。' },
      { title: '高原与河流', text: '非洲高原分布很广，东部有大裂谷和许多湖泊；东北部的尼罗河向北流入地中海。' }
    ],
    places: ['Egypt', 'Kenya', 'South Africa'],
    observe: '从埃及向南找肯尼亚，再找南非。三个地方在赤道的哪一边？',
    source: 'https://education.nationalgeographic.org/resource/africa-physical-geography/'
  },
  {
    id: 'northamerica', name: '北美洲', color: '#9ec98a',
    hint: '加拿大、美国和墨西哥在这里，还包括中美洲和加勒比海的许多岛屿。',
    location: '全部位于北半球，西临太平洋，东临大西洋，北临北冰洋，南部通过狭窄的陆地连接南美洲。',
    facts: [
      { title: '西高、中平、东部有山地', text: '西部有落基山脉等高山，中部是开阔的平原，东部有阿巴拉契亚山脉。' },
      { title: '大河与大湖', text: '密西西比河流经美国中部，五大湖分布在美国与加拿大交界一带。' },
      { title: '从北极到热带', text: '最北边有冰雪和苔原，南部接近热带。格陵兰岛虽然很大，仍然属于岛屿。' }
    ],
    places: ['Canada', 'United States of America', 'Mexico'],
    observe: '按从北到南的顺序找到加拿大、美国和墨西哥，再看看它们东西两侧的海洋。',
    source: 'https://education.nationalgeographic.org/resource/north-america-physical-geography/'
  },
  {
    id: 'southamerica', name: '南美洲', color: '#b5a0c8',
    hint: '亚马孙河与热带雨林的家园，大部分陆地在南半球。',
    location: '赤道穿过北部，大部分陆地位于南半球，西临太平洋，东临大西洋。',
    facts: [
      { title: '西边的长山脉', text: '安第斯山脉沿大陆西侧南北延伸，像一条长长的脊梁。' },
      { title: '大河与热带雨林', text: '北部的亚马孙河水量很大，流域里有大片热带雨林，最终流入大西洋。' },
      { title: '高原与草原', text: '东部有巴西高原，东南部有潘帕斯草原；从赤道走向南端，能看到很不一样的自然景色。' }
    ],
    places: ['Brazil', 'Peru', 'Argentina'],
    observe: '先找巴西，再找西边的秘鲁和更南边的阿根廷。哪个国家更靠近太平洋？',
    source: 'https://education.nationalgeographic.org/resource/south-america-physical-geography/'
  },
  {
    id: 'oceania', name: '大洋洲', color: '#e8a1a1',
    hint: '面积最小的大洲，包括澳大利亚大陆和太平洋中的许多岛屿。',
    location: '大部分陆地位于南半球，散布在太平洋中，澳大利亚西侧邻着印度洋。',
    facts: [
      { title: '大陆与群岛', text: '澳大利亚大陆占去大部分陆地，新西兰、新几内亚岛和许多太平洋岛屿也在这一带。' },
      { title: '干燥内陆与沿海', text: '澳大利亚内陆有大片沙漠和草原，东部沿海有大分水岭；新西兰则有高山、火山和冰川。' },
      { title: '珊瑚与火山', text: '澳大利亚东北海上有大堡礁。太平洋上的一些岛屿由火山形成，还有一些由珊瑚礁构成。' }
    ],
    places: ['Australia', 'New Zealand', 'Papua New Guinea'],
    observe: '找澳大利亚东南方的新西兰。再看看澳大利亚北边的新几内亚岛，哪些地方被海洋隔开？',
    source: 'https://education.nationalgeographic.org/resource/oceania-physical-geography/'
  },
  {
    id: 'antarctica', name: '南极洲', color: '#d5dde3',
    hint: '围绕南极点的冰雪大陆，有来自不同国家的科考队。',
    location: '位于地球最南端，几乎全部在南极圈内，四周被海洋环绕。',
    facts: [
      { title: '厚厚的冰盖', text: '绝大部分陆地被冰盖覆盖，冰层下面还有山脉和谷地。' },
      { title: '寒冷、干燥、多风', text: '南极洲十分寒冷，内陆降水很少。靠近南极点的地方，一年中会经历很长的白昼和黑夜。' },
      { title: '生命与科考', text: '企鹅、海豹等动物生活在沿岸和周围海域。科考队在这里研究冰雪、气候和海洋。' }
    ],
    places: ['Antarctica'],
    observe: '看看南极洲在地图的哪一边，再找到最北边的北冰洋。南北两极的陆地和海洋有什么不同？',
    source: 'https://www.antarctica.gov.au/about-antarctica/geography-and-geology/'
  }
];

/* 四大洋：按通行口径采用四大洋。point 为标注位置的 [经度, 纬度]。 */
window.GM_OCEANS = [
  { "id": "o1", "name": "太平洋", "where": "亚洲与美洲之间", "point": [-152, 4],
    "note": "世界上面积最大、最深的大洋，约占地球海洋的一半，名字的意思是「平静」。" },
  { "id": "o2", "name": "大西洋", "where": "美洲与欧洲、非洲之间", "point": [-33, 27],
    "note": "世界第二大洋，轮廓像狭长的「S」，隔开美洲与欧洲、非洲。" },
  { "id": "o3", "name": "印度洋", "where": "亚洲以南", "point": [76, -24],
    "note": "世界第三大洋，大部分在赤道以南，北边就是亚洲。" },
  { "id": "o4", "name": "北冰洋", "where": "地球最北端", "point": [-8, 81.5],
    "note": "四大洋中最小、最浅的一个，常年覆盖着海冰，围着地球最北端。" }
];

/* 世界地标标记：point 为 [经度, 纬度]，line 为折线拐点。 */
window.GM_WORLD_FEATURES = [
  { "id": "wf1", "kind": "peak", "name": "珠穆朗玛峰", "where": "中国与尼泊尔边境", "point": [86.9, 27.9],
    "note": "地球上海拔最高的山峰，8848.86 米，耸立在中国和尼泊尔的边境上。" },
  { "id": "wf2", "kind": "river", "name": "尼罗河", "where": "非洲东北部，自南向北流", "line": [[32.9, 0.1], [31.2, 6], [30.9, 11], [31.2, 15.6], [30.8, 24], [31, 27], [32.3, 31]],
    "note": "约 6650 千米，是世界最长的河流之一，一路向北注入地中海。" },
  { "id": "wf3", "kind": "river", "name": "亚马孙河", "where": "南美洲北部", "line": [[-73.5, -4.6], [-70, -3.8], [-66, -3.2], [-62, -3.8], [-58, -3.6], [-54, -3.2], [-50, -0.6]],
    "note": "水量世界第一的大河，流域里藏着世界上最大的热带雨林——「地球之肺」。" },
  { "id": "wf4", "kind": "desert", "name": "撒哈拉沙漠", "where": "非洲北部", "point": [10, 22],
    "note": "世界上面积最大的沙漠，覆盖非洲北部广大地区；不全是黄沙，也有砾石和山脉。" },
  { "id": "wf5", "kind": "plateau", "name": "青藏高原", "where": "亚洲中部", "point": [95, 33.5],
    "note": "世界海拔最高的高原，被称为「世界屋脊」，在中国地图上已经认识过它。" },
  { "id": "wf6", "kind": "trench", "name": "马里亚纳海沟", "where": "西太平洋深处", "point": [142.2, 11.3],
    "note": "地球最深的地方，最深处约 11000 米——把珠穆朗玛峰放进去还差好大一截才露出头。" },
  { "id": "wf7", "kind": "reef", "name": "大堡礁", "where": "澳大利亚东北海上", "point": [147.5, -18.5],
    "note": "世界上最大的珊瑚礁群，躺在澳大利亚东北的海里，从太空中都能看到。" },
  { "id": "wf8", "kind": "island", "name": "格陵兰岛", "where": "北美洲东北海上", "point": [-42, 71.5],
    "note": "世界上最大的岛屿，大部分被厚厚的冰盖覆盖，是丹麦的自治领地。" },
  { "id": "wf9", "kind": "mountain", "name": "阿尔卑斯山脉", "where": "欧洲中部", "line": [[5.5, 44.5], [9, 45.5], [13, 46.5]],
    "note": "欧洲最高大的山脉，最高峰勃朗峰约 4810 米——比珠峰矮了四千多米。" },
  { "id": "wf10", "kind": "river", "name": "苏伊士运河", "where": "非洲东北角", "line": [[32.3, 31.25], [32.4, 30.6], [32.55, 29.95]],
    "note": "人工开凿的运河，连接地中海与红海，亚洲和非洲就在这里分界。" }
];

/* 「中国与世界」图层的重点标注：name 为 world-geo.js 里的英文名，at 为标注位置。 */
window.GM_MAJOR_LABELS = [
  { "name": "China", "at": [103, 35] },
  { "name": "Russia", "at": [95, 60] },
  { "name": "Canada", "at": [-105, 60] },
  { "name": "United States of America", "at": [-100, 39] },
  { "name": "Brazil", "at": [-53, -10] },
  { "name": "Australia", "at": [134, -25] },
  { "name": "India", "at": [78, 22] },
  { "name": "Egypt", "at": [29.5, 26.5] },
  { "name": "Japan", "at": [138.5, 36.5] },
  { "name": "United Kingdom", "at": [-1.5, 52.5] },
  { "name": "France", "at": [2.5, 46.5] },
  { "name": "Indonesia", "at": [114, -1.5] },
  { "name": "Mexico", "at": [-102, 23.5] }
];

/* 「中国与世界」图层里点中国时的档案要点。 */
window.GM_CHINA_CARD = {
  "facts": ["陆地面积约 960 万平方千米，居世界第三位，前面是俄罗斯和加拿大。", "地处亚洲东部、太平洋西岸；北京用的是东八区的时刻（北京时间）。", "有 14 个陆上邻国和 6 个隔海相望的国家——它们都在中国地图系统里见过面。"]
};

/* 国家中文名与大洲映射：键为 world-geo.js 的英文名，值为 [中文名, 大洲 id]。 */
window.GM_COUNTRY_META = {
  "Afghanistan": ["阿富汗", "asia"],
  "Albania": ["阿尔巴尼亚", "europe"],
  "Algeria": ["阿尔及利亚", "africa"],
  "Angola": ["安哥拉", "africa"],
  "Antarctica": ["南极洲", "antarctica"],
  "Argentina": ["阿根廷", "southamerica"],
  "Armenia": ["亚美尼亚", "asia"],
  "Australia": ["澳大利亚", "oceania"],
  "Austria": ["奥地利", "europe"],
  "Azerbaijan": ["阿塞拜疆", "asia"],
  "Bahamas": ["巴哈马", "northamerica"],
  "Bangladesh": ["孟加拉国", "asia"],
  "Belarus": ["白俄罗斯", "europe"],
  "Belgium": ["比利时", "europe"],
  "Belize": ["伯利兹", "northamerica"],
  "Benin": ["贝宁", "africa"],
  "Bhutan": ["不丹", "asia"],
  "Bolivia": ["玻利维亚", "southamerica"],
  "Bosnia and Herz.": ["波黑", "europe"],
  "Botswana": ["博茨瓦纳", "africa"],
  "Brazil": ["巴西", "southamerica"],
  "Brunei": ["文莱", "asia"],
  "Bulgaria": ["保加利亚", "europe"],
  "Burkina Faso": ["布基纳法索", "africa"],
  "Burundi": ["布隆迪", "africa"],
  "Cambodia": ["柬埔寨", "asia"],
  "Cameroon": ["喀麦隆", "africa"],
  "Canada": ["加拿大", "northamerica"],
  "Central African Rep.": ["中非", "africa"],
  "Chad": ["乍得", "africa"],
  "Chile": ["智利", "southamerica"],
  "China": ["中国", "asia"],
  "Colombia": ["哥伦比亚", "southamerica"],
  "Congo": ["刚果（布）", "africa"],
  "Costa Rica": ["哥斯达黎加", "northamerica"],
  "Croatia": ["克罗地亚", "europe"],
  "Cuba": ["古巴", "northamerica"],
  "Cyprus": ["塞浦路斯", "asia"],
  "Czechia": ["捷克", "europe"],
  "Côte d'Ivoire": ["科特迪瓦", "africa"],
  "Dem. Rep. Congo": ["刚果（金）", "africa"],
  "Denmark": ["丹麦", "europe"],
  "Djibouti": ["吉布提", "africa"],
  "Dominican Rep.": ["多米尼加", "northamerica"],
  "Ecuador": ["厄瓜多尔", "southamerica"],
  "Egypt": ["埃及", "africa"],
  "El Salvador": ["萨尔瓦多", "northamerica"],
  "Eq. Guinea": ["赤道几内亚", "africa"],
  "Eritrea": ["厄立特里亚", "africa"],
  "Estonia": ["爱沙尼亚", "europe"],
  "Ethiopia": ["埃塞俄比亚", "africa"],
  "Falkland Is.": ["马尔维纳斯群岛", "southamerica"],
  "Fiji": ["斐济", "oceania"],
  "Finland": ["芬兰", "europe"],
  "Fr. S. Antarctic Lands": ["法属南部领地", "antarctica"],
  "France": ["法国", "europe"],
  "Gabon": ["加蓬", "africa"],
  "Gambia": ["冈比亚", "africa"],
  "Georgia": ["格鲁吉亚", "asia"],
  "Germany": ["德国", "europe"],
  "Ghana": ["加纳", "africa"],
  "Greece": ["希腊", "europe"],
  "Greenland": ["格陵兰（丹麦）", "northamerica"],
  "Guatemala": ["危地马拉", "northamerica"],
  "Guinea": ["几内亚", "africa"],
  "Guinea-Bissau": ["几内亚比绍", "africa"],
  "Guyana": ["圭亚那", "southamerica"],
  "Haiti": ["海地", "northamerica"],
  "Honduras": ["洪都拉斯", "northamerica"],
  "Hungary": ["匈牙利", "europe"],
  "Iceland": ["冰岛", "europe"],
  "India": ["印度", "asia"],
  "Indonesia": ["印度尼西亚", "asia"],
  "Iran": ["伊朗", "asia"],
  "Iraq": ["伊拉克", "asia"],
  "Ireland": ["爱尔兰", "europe"],
  "Israel": ["以色列", "asia"],
  "Italy": ["意大利", "europe"],
  "Jamaica": ["牙买加", "northamerica"],
  "Japan": ["日本", "asia"],
  "Jordan": ["约旦", "asia"],
  "Kazakhstan": ["哈萨克斯坦", "asia"],
  "Kenya": ["肯尼亚", "africa"],
  "Kosovo": ["科索沃", "europe"],
  "Kuwait": ["科威特", "asia"],
  "Kyrgyzstan": ["吉尔吉斯斯坦", "asia"],
  "Laos": ["老挝", "asia"],
  "Latvia": ["拉脱维亚", "europe"],
  "Lebanon": ["黎巴嫩", "asia"],
  "Lesotho": ["莱索托", "africa"],
  "Liberia": ["利比里亚", "africa"],
  "Libya": ["利比亚", "africa"],
  "Lithuania": ["立陶宛", "europe"],
  "Luxembourg": ["卢森堡", "europe"],
  "Macedonia": ["北马其顿", "europe"],
  "Madagascar": ["马达加斯加", "africa"],
  "Malawi": ["马拉维", "africa"],
  "Malaysia": ["马来西亚", "asia"],
  "Mali": ["马里", "africa"],
  "Mauritania": ["毛里塔尼亚", "africa"],
  "Mexico": ["墨西哥", "northamerica"],
  "Moldova": ["摩尔多瓦", "europe"],
  "Mongolia": ["蒙古", "asia"],
  "Montenegro": ["黑山", "europe"],
  "Morocco": ["摩洛哥", "africa"],
  "Mozambique": ["莫桑比克", "africa"],
  "Myanmar": ["缅甸", "asia"],
  "N. Cyprus": ["北塞浦路斯", "asia"],
  "Namibia": ["纳米比亚", "africa"],
  "Nepal": ["尼泊尔", "asia"],
  "Netherlands": ["荷兰", "europe"],
  "New Caledonia": ["新喀里多尼亚（法）", "oceania"],
  "New Zealand": ["新西兰", "oceania"],
  "Nicaragua": ["尼加拉瓜", "northamerica"],
  "Niger": ["尼日尔", "africa"],
  "Nigeria": ["尼日利亚", "africa"],
  "North Korea": ["朝鲜", "asia"],
  "Norway": ["挪威", "europe"],
  "Oman": ["阿曼", "asia"],
  "Pakistan": ["巴基斯坦", "asia"],
  "Palestine": ["巴勒斯坦", "asia"],
  "Panama": ["巴拿马", "northamerica"],
  "Papua New Guinea": ["巴布亚新几内亚", "oceania"],
  "Paraguay": ["巴拉圭", "southamerica"],
  "Peru": ["秘鲁", "southamerica"],
  "Philippines": ["菲律宾", "asia"],
  "Poland": ["波兰", "europe"],
  "Portugal": ["葡萄牙", "europe"],
  "Puerto Rico": ["波多黎各（美）", "northamerica"],
  "Qatar": ["卡塔尔", "asia"],
  "Romania": ["罗马尼亚", "europe"],
  "Russia": ["俄罗斯", "europe"],
  "Rwanda": ["卢旺达", "africa"],
  "S. Sudan": ["南苏丹", "africa"],
  "Saudi Arabia": ["沙特阿拉伯", "asia"],
  "Senegal": ["塞内加尔", "africa"],
  "Serbia": ["塞尔维亚", "europe"],
  "Sierra Leone": ["塞拉利昂", "africa"],
  "Slovakia": ["斯洛伐克", "europe"],
  "Slovenia": ["斯洛文尼亚", "europe"],
  "Solomon Is.": ["所罗门群岛", "oceania"],
  "Somalia": ["索马里", "africa"],
  "Somaliland": ["索马里兰", "africa"],
  "South Africa": ["南非", "africa"],
  "South Korea": ["韩国", "asia"],
  "Spain": ["西班牙", "europe"],
  "Sri Lanka": ["斯里兰卡", "asia"],
  "Sudan": ["苏丹", "africa"],
  "Suriname": ["苏里南", "southamerica"],
  "Sweden": ["瑞典", "europe"],
  "Switzerland": ["瑞士", "europe"],
  "Syria": ["叙利亚", "asia"],
  "Taiwan": ["中国台湾省", "asia"],
  "Tajikistan": ["塔吉克斯坦", "asia"],
  "Tanzania": ["坦桑尼亚", "africa"],
  "Thailand": ["泰国", "asia"],
  "Timor-Leste": ["东帝汶", "asia"],
  "Togo": ["多哥", "africa"],
  "Trinidad and Tobago": ["特立尼达和多巴哥", "northamerica"],
  "Tunisia": ["突尼斯", "africa"],
  "Turkey": ["土耳其", "asia"],
  "Turkmenistan": ["土库曼斯坦", "asia"],
  "Uganda": ["乌干达", "africa"],
  "Ukraine": ["乌克兰", "europe"],
  "United Arab Emirates": ["阿联酋", "asia"],
  "United Kingdom": ["英国", "europe"],
  "United States of America": ["美国", "northamerica"],
  "Uruguay": ["乌拉圭", "southamerica"],
  "Uzbekistan": ["乌兹别克斯坦", "asia"],
  "Vanuatu": ["瓦努阿图", "oceania"],
  "Venezuela": ["委内瑞拉", "southamerica"],
  "Vietnam": ["越南", "asia"],
  "W. Sahara": ["西撒哈拉", "africa"],
  "Yemen": ["也门", "asia"],
  "Zambia": ["赞比亚", "africa"],
  "Zimbabwe": ["津巴布韦", "africa"],
  "eSwatini": ["斯威士兰", "africa"]
};

/* 找一找题库：大洋（o数字）、世界地标（wf数字）与国家英文名混搭，每轮抽 5 题。 */
window.GM_WORLD_POOL = [
  "o1", "o2", "o3", "o4",
  "wf1", "wf2", "wf3", "wf4", "wf5", "wf6", "wf7", "wf8", "wf9", "wf10",
  "China", "Russia", "Canada", "United States of America", "Brazil", "Australia",
  "India", "Egypt", "Japan", "Indonesia", "France", "Mexico"
];

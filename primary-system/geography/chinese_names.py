"""人工整理的常用地名对照；只映射已知译名，未收录城市保留原文。"""

CAPITALS = dict(line.split("|", 1) for line in """Abu Dhabi|阿布扎比
Abuja|阿布贾
Accra|阿克拉
Adamstown|亚当斯敦
Addis Ababa|亚的斯亚贝巴
Algiers|阿尔及尔
Alofi|阿洛菲
Amman|安曼
Amsterdam|阿姆斯特丹
Andorra la Vella|安道尔城
Ankara|安卡拉
Antananarivo|塔那那利佛
Apia|阿皮亚
Ashgabat|阿什哈巴德
Asmara|阿斯马拉
Astana|阿斯塔纳
Asunción|亚松森
Athens|雅典
Avarua|阿瓦鲁阿
Baghdad|巴格达
Baku|巴库
Bamako|巴马科
Bandar Seri Begawan|斯里巴加湾市
Bangkok|曼谷
Bangui|班吉
Banjul|班珠尔
Basse-Terre|巴斯特尔
Basseterre|巴斯特尔
Beijing|北京
Beirut|贝鲁特
Belgrade|贝尔格莱德
Belmopan|贝尔莫潘
Berlin|柏林
Bern|伯尔尼
Bishkek|比什凯克
Bissau|比绍
Bloemfontein|布隆方丹
Bogotá|波哥大
Brasília|巴西利亚
Bratislava|布拉迪斯拉发
Brazzaville|布拉柴维尔
Bridgetown|布里奇敦
Brussels|布鲁塞尔
Bucharest|布加勒斯特
Budapest|布达佩斯
Buenos Aires|布宜诺斯艾利斯
Cairo|开罗
Canberra|堪培拉
Cape Town|开普敦
Caracas|加拉加斯
Castries|卡斯特里
Cayenne|卡宴
Charlotte Amalie|夏洛特阿马利亚
Chișinău|基希讷乌
City of San Marino|圣马力诺市
City of Victoria|维多利亚城
Cockburn Town|科伯恩城
Colombo|科伦坡
Conakry|科纳克里
Copenhagen|哥本哈根
Dakar|达喀尔
Damascus|大马士革
Dhaka|达卡
Diego Garcia|迪戈加西亚
Dili|帝力
Djibouti|吉布提市
Dodoma|多多马
Doha|多哈
Douglas|道格拉斯
Dublin|都柏林
Dushanbe|杜尚别
El Aaiún|阿尤恩
Fakaofo|法考福
Flying Fish Cove|飞鱼湾
Fort-de-France|法兰西堡
Freetown|弗里敦
Funafuti|富纳富提
Gaborone|哈博罗内
George Town|乔治敦
Georgetown|乔治敦
Gibraltar|直布罗陀
Gitega|基特加
Guatemala City|危地马拉城
Gustavia|古斯塔维亚
Hagåtña|阿加尼亚
Hamilton|哈密尔顿
Hanoi|河内
Harare|哈拉雷
Havana|哈瓦那
Helsinki|赫尔辛基
Honiara|霍尼亚拉
Islamabad|伊斯兰堡
Jakarta|雅加达
Jamestown|詹姆斯敦
Jerusalem|耶路撒冷
Juba|朱巴
Kabul|喀布尔
Kampala|坎帕拉
Kathmandu|加德满都
Khartoum|喀土穆
Kigali|基加利
King Edward Point|爱德华国王角
Kingston|金斯敦
Kingstown|金斯敦
Kinshasa|金沙萨
Kralendijk|克拉伦代克
Kuala Lumpur|吉隆坡
Kuwait City|科威特城
Kyiv|基辅
Libreville|利伯维尔
Lilongwe|利隆圭
Lima|利马
Lisbon|里斯本
Ljubljana|卢布尔雅那
Lobamba|洛班巴
Lomé|洛美
London|伦敦
Longyearbyen|朗伊尔城
Luanda|罗安达
Lusaka|卢萨卡
Luxembourg|卢森堡市
Madrid|马德里
Majuro|马朱罗
Malé|马累
Mamoudzou|马穆楚
Managua|马那瓜
Manama|麦纳麦
Manila|马尼拉
Maputo|马普托
Mariehamn|玛丽港
Marigot|马里戈
Maseru|马塞卢
Mata-Utu|马塔乌图
Mexico City|墨西哥城
Minsk|明斯克
Mogadishu|摩加迪沙
Monaco|摩纳哥
Monrovia|蒙罗维亚
Montevideo|蒙得维的亚
Moroni|莫罗尼
Moscow|莫斯科
Muscat|马斯喀特
N'Djamena|恩贾梅纳
Nairobi|内罗毕
Nassau|拿骚
Naypyidaw|内比都
New Delhi|新德里
Ngerulmud|恩吉鲁穆德
Niamey|尼亚美
Nicosia|尼科西亚
Nouakchott|努瓦克肖特
Nouméa|努美阿
Nuku'alofa|努库阿洛法
Nuuk|努克
Oranjestad|奥拉涅斯塔德
Oslo|奥斯陆
Ottawa|渥太华
Ouagadougou|瓦加杜古
Pago Pago|帕果帕果
Palikir|帕利基尔
Panama City|巴拿马城
Papeetē|帕皮提
Paramaribo|帕拉马里博
Paris|巴黎
Philipsburg|菲利普斯堡
Phnom Penh|金边
Plymouth|普利茅斯
Podgorica|波德戈里察
Port Louis|路易港
Port Moresby|莫尔兹比港
Port Vila|维拉港
Port of Spain|西班牙港
Port-au-Prince|太子港
Port-aux-Français|法兰西港
Porto-Novo|波多诺伏
Prague|布拉格
Praia|普拉亚
Pretoria|比勒陀利亚
Pristina|普里什蒂纳
Pyongyang|平壤
Quito|基多
Rabat|拉巴特
Ramallah|拉姆安拉
Reykjavik|雷克雅未克
Riga|里加
Riyadh|利雅得
Road Town|罗德城
Rome|罗马
Roseau|罗索
Saint Helier|圣赫利尔
Saint John's|圣约翰
Saint-Denis|圣但尼
Saint-Pierre|圣皮埃尔
Saipan|塞班
San José|圣何塞
San Juan|圣胡安
San Salvador|圣萨尔瓦多
Sana'a|萨那
Santiago|圣地亚哥
Santo Domingo|圣多明各
Sarajevo|萨拉热窝
Seoul|首尔
Singapore|新加坡
Skopje|斯科普里
Sofia|索非亚
South Tarawa|南塔拉瓦
St. George's|圣乔治
St. Peter Port|圣彼得港
Stanley|斯坦利
Stockholm|斯德哥尔摩
Sucre|苏克雷
Suva|苏瓦
São Tomé|圣多美
Taipei|台北
Tallinn|塔林
Tashkent|塔什干
Tbilisi|第比利斯
Tegucigalpa|特古西加尔巴
Tehran|德黑兰
The Valley|瓦利
Thimphu|廷布
Tirana|地拉那
Tokyo|东京
Tripoli|的黎波里
Tunis|突尼斯市
Tórshavn|托尔斯港
Ulan Bator|乌兰巴托
Vaduz|瓦杜兹
Valletta|瓦莱塔
Vatican City|梵蒂冈城
Victoria|维多利亚
Vienna|维也纳
Vientiane|万象
Vilnius|维尔纽斯
Warsaw|华沙
Washington D.C.|华盛顿哥伦比亚特区
Washington, D.C.|华盛顿哥伦比亚特区
Wellington|惠灵顿
West Island|西岛
Willemstad|威廉斯塔德
Windhoek|温得和克
Yamoussoukro|亚穆苏克罗
Yaoundé|雅温得
Yaren|亚伦
Yerevan|埃里温
Zagreb|萨格勒布""".splitlines())

# 已冻结的 CLDR/人工对照；运行页面不依赖 Node、Babel 或外部资料包。
import json
from pathlib import Path

_NAMES = json.loads(
    Path(__file__).with_name("language_currency_zh.json").read_text(encoding="utf-8")
)
LANGUAGES = _NAMES["languages"]
CURRENCIES = _NAMES["currencies"]

# 中国领事服务网，中外文并列；核验于2026-11-02。
# https://cs.mfa.gov.cn/ljmdd/fz_648564/cdjny_649062/
CAPITALS["Ciudad de la Paz"] = "拉帕斯"


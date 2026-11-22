# 世界地图详情资料

`world-country-data.js` 按 `world-data.js` 的稳定地点 ID 维护卡片，覆盖现有底图的 177 个地点。特产选取代表性的农产、食品、工艺或资源，地标包括建筑、历史遗迹和自然景观。

- 人口来自联合国人口司《世界人口展望 2024》中方案的 `Time=2025`、`TPopulation1July` 列，以 ISO3 对齐，千人换算为人后按数量级取近似值。原始下载文件 SHA-256 见数据文件。科索沃沿用联合国对应统计项；北塞浦路斯、索马里兰在该人口表中未单列。南极洲与法属南部领地注明无常住人口。[联合国 WPP](https://population.un.org/wpp/)、[法国外交部](https://www.diplomatie.gouv.fr/files/files/Documents%20en%20anglais/eng_fiche_terres-australes-et-antarctiques-francaises.pdf)
- 首都以仓库固定的 `geography_countryregion-0001.jsonl.gz` 国家资料及 `geography/chinese_names.py` 对照为基础，多个行政驻地、地区和迁都使用补充说明。赤道几内亚采用 2026 年《第 1/2026 号法令》，印度尼西亚采用 2026 年 6 月外交部资料。法属南部领地的行政机关位于留尼汪圣皮埃尔。[赤道几内亚法令](https://www.guineaecuatorialpress.com/noticias/decreto_ley_por_el_que_se_declara_la_ciudad_de_la_paz_djibloho_capital_de_la_republica_de_guinea_ecuatorial)、[中国外交部国家概况](https://www.mfa.gov.cn/gjhdq_676201/gj_676203/)、[法属南部领地管理机构](https://taaf.fr/)
- 旗帜取自 `country-flags` 固定版本 `c09927e63705529bbf59ca6684cd9b23225dddad` 的 SVG，保留上游比例，按两字母来源代码随页面发布。台湾档案使用中华人民共和国国旗。阿富汗保留其常驻联合国代表团使用的三色旗式样并加注。旗帜栏按地点适用情况展示。[旗帜文件与使用说明](https://github.com/hampusborgos/country-flags/tree/c09927e63705529bbf59ca6684cd9b23225dddad)、[阿富汗常驻联合国代表团](https://afghanmission-un.org/wp-content/uploads/2026/11/Afghansitan_Statement_-UNGA_ICC_Report_2-Nov-2026.pdf)
- 代表物产和景观按地点人工编选。可按国家在联合国粮农组织产量库、世界知识产权组织地理标志资料和联合国教科文组织世界遗产名录继续查证。[FAOSTAT](https://www.fao.org/faostat/en/#data/QCL)、[WIPO 地理标志](https://www.wipo.int/en/web/geographical-indications)、[UNESCO 世界遗产名录](https://whc.unesco.org/en/list/)

更新后运行 `node content_sources/test/test-geo-map.js` 核对地点与素材，再运行 `make study-topics-data` 同步发布目录。

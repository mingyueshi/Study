# 世界文明巡礼资料说明

## 内容与范围

8 座文明站，32 个主题知识站，16 项图像观察材料。每站包含范围与关键年代、建筑、文字、制度、成就、观察问题、讲解参考、材料边界和核查出处。正文维护在 `civilizations-data.js`；筛选和比较逻辑在 `civilizations-shared.js`，两个页面的交互分别由应用脚本负责。

| 文明站 | 选读年代 | 范围说明 |
| --- | --- | --- |
| 古埃及 | 约前 3100—前 30 年 | 以法老时代为主，选读古王国金字塔、新王国与晚期文字材料；各时期制度和艺术都有变化。 |
| 两河流域 | 约前 3500—前 539 年（选读） | 跨苏美尔城邦、古巴比伦等不同国家与时期，重点观察城市、楔形文字和汉谟拉比石碑。 |
| 古希腊 | 约前 8 世纪—前 1 世纪（选读） | 以古风、古典与希腊化时期为主，雅典只是一座城邦，不能代表全部希腊社会。 |
| 古罗马 | 前 509 年—476 年；延伸至 6 世纪 | 区分王政传统、共和国与帝国，主要观察共和国和帝国时期，并延伸到东罗马法典整理。 |
| 玛雅 | 约 250—900 年（古典期重点） | 以古典期城邦与蒂卡尔为入口，同时介绍文字、历法和延续至今的玛雅文化。 |
| 波斯 | 约前 550—前 330 年 | 本次聚焦阿契美尼德时期，不用这两个年份概括全部波斯或伊朗历史。 |
| 阿拉伯—伊斯兰世界 | 7—13 世纪（重点选读） | 从早期哈里发时期到阿拔斯等不同政权，兼看科尔多瓦；并不把整个地区视为一个始终统一的国家。 |
| 古印度 | 约前 2600 年—公元 1 世纪（跨时期选读） | 把印度河城市与后来孔雀王朝、桑吉佛塔分开编排，不把相隔千年的材料混成同一个社会。 |

选读范围不是文明完整年表。古埃及跨多个时期；两河与希腊不视为始终统一的国家；罗马共和国、帝国与东部延续分别说明；玛雅文化延续至今；波斯本次聚焦阿契美尼德时期；阿拉伯—伊斯兰世界包含多族群、多语言与并存政权；古印度范围包括今巴基斯坦和印度等地，印度河遗存与后来孔雀王朝材料分开编排。

## 图像维护

11 张新增图像保存在 `assets/civilizations/`；吉萨金字塔、汉谟拉比石碑、奥林匹亚、罗马斗兽场和蒂卡尔 5 项用 `mediaEvent` 引用 `media-data.js` 的主条目，不复制文件和元数据。图片下载于 2026-11-17，使用馆方或来源站提供的公开副本，没有用生成图代替实物或遗址。

| 文明 | 本地文件 | 内容与出处 |
| --- | --- | --- |
| 古埃及 | 复用 `media-data.js` 的 `tw4` | 图片、署名与来源均由原条目解析。 |
| 古埃及 | [assets/civilizations/met-egypt.jpg](assets/civilizations/met-egypt.jpg) | [僧侣体纸草书信](https://www.metmuseum.org/art/collection/search/544847)：新王国时期纸草书信，约前 1473—前 1458 年。这里是僧侣体手写形式，不是把石刻象形字逐个搬上纸草。 大都会艺术博物馆藏 · 开放图像；CC0。 |
| 两河流域 | 复用 `media-data.js` 的 `tw6` | 图片、署名与来源均由原条目解析。 |
| 两河流域 | [assets/civilizations/meso.jpg](assets/civilizations/meso.jpg) | [早期物资账目泥板](https://www.metmuseum.org/art/collection/search/327385)：约前 3100—前 2900 年的早期行政泥板，记录麦芽与大麦等物资，展示记账与早期书写的联系。 大都会艺术博物馆藏 · 开放图像；CC0。 |
| 古希腊 | 复用 `media-data.js` 的 `tw9` | 图片、署名与来源均由原条目解析。 |
| 古希腊 | [assets/civilizations/greek-decree.jpg](assets/civilizations/greek-decree.jpg) | [阿提卡法令铭文残片](https://www.metmuseum.org/art/collection/search/252475)：约前 4—前 3 世纪的阿提卡法令残片。断裂边缘提醒我们：现存文字不是完整法令。 大都会艺术博物馆藏 · 开放图像；CC0。 |
| 古罗马 | 复用 `media-data.js` 的 `tw18` | 图片、署名与来源均由原条目解析。 |
| 古罗马 | [assets/civilizations/roman-bilingual.jpg](assets/civilizations/roman-bilingual.jpg) | [拉丁文与希腊文双语石碑](https://www.metmuseum.org/art/collection/search/241947)：1 世纪的塞浦路斯罗马时期墓志，上方是拉丁文，下方是希腊文。两组文字遵循各自语言的表达习惯。 大都会艺术博物馆藏 · 开放图像；CC0。 |
| 玛雅 | 复用 `media-data.js` 的 `tw22` | 图片、署名与来源均由原条目解析。 |
| 玛雅 | [assets/civilizations/maya-vessel.jpg](assets/civilizations/maya-vessel.jpg) | [玛雅陶杯背面的斜向铭文](https://www.metmuseum.org/art/collection/search/761272)：约 600—900 年的玛雅陶杯背面。正面另有水鸟形象；这张照片展示斜向排列的铭文，图像和文字需结合不同角度观察。 大都会艺术博物馆藏 · 开放图像；CC0。 |
| 波斯 | [assets/civilizations/persian-relief.jpg](assets/civilizations/persian-relief.jpg) | [波斯波利斯宫殿浮雕残片](https://www.metmuseum.org/art/collection/search/323178)：约前 358—前 338 年，原属波斯波利斯宫殿阶梯装饰。人物带着食物或饮料，现为脱离建筑的馆藏残片。 大都会艺术博物馆藏 · 开放图像；CC0。 |
| 波斯 | [assets/civilizations/persian-bowl.jpg](assets/civilizations/persian-bowl.jpg) | [阿契美尼德金碗](https://www.metmuseum.org/art/collection/search/324289)：约前 6—前 5 世纪的金碗。它提示贵重器物的工艺与使用场合，并不代表所有人的日常生活。 大都会艺术博物馆藏 · 开放图像；CC0。 |
| 阿拉伯—伊斯兰世界 | [assets/civilizations/arab-capital.jpg](assets/civilizations/arab-capital.jpg) | [科尔多瓦相关柱头](https://www.metmuseum.org/art/collection/search/448410)：10 世纪柱头，馆方认为可能出自西班牙科尔多瓦。它是建筑部件，不是完整建筑的现状照片。 大都会艺术博物馆藏 · 开放图像；CC0。 |
| 阿拉伯—伊斯兰世界 | [assets/civilizations/arab-quran.jpg](assets/civilizations/arab-quran.jpg) | [库法体《古兰经》书页](https://www.metmuseum.org/art/collection/search/448369)：约 9 世纪末—10 世纪初的手稿书页，可能制作于叙利亚。字母、行距与点记需要结合当时的书写习惯观察。 大都会艺术博物馆藏 · 开放图像；CC0。 |
| 古印度 | [assets/civilizations/sanchi.jpg](assets/civilizations/sanchi.jpg) | [桑吉大塔的早期照片](https://collections.vam.ac.uk/item/O175835/the-great-stupa-at-sanchi-photograph-waterhouse-james-john/)：James John Waterhouse 于 1861—1862 年拍摄的桑吉大塔。它记录的是后期系统修复之前的状态，并非古代建成时的原貌。 James John Waterhouse 摄 · V&A 藏；馆藏图像，使用说明见来源。 |
| 古印度 | [assets/civilizations/indus-seal.jpg](assets/civilizations/indus-seal.jpg) | [带牛形象的印度河印章](https://www.metmuseum.org/art/collection/search/38287)：馆方断代为前 3000—前 1500 年的印度河文明印章。上方符号尚不能给出获得公认的完整语言释读。 大都会艺术博物馆藏 · 开放图像；CC0。 |

大都会馆方标为公有领域的开放图片保留 CC0 说明；桑吉早期照片保留 V&A 馆藏、摄影者与原图入口，使用条件按馆方说明，不将其另行声称为开放许可。桑吉照片摄于 1861—1862 年，属于历史保存状态证据，不是古代原貌；波斯浮雕和科尔多瓦柱头属于脱离建筑的部件。古代文字的释读与不确定性写在正文和图注，不用现代图像猜测替代文字证据。

## 资料核查与关联

每个知识站的 `sources` 指向资料注册表；具体图像还保留独立出处。基础材料主要来自 UNESCO、博物馆、印度考古调查局和大学数学史资源。讨论题与讲解参考为教学编写，不冒充古人的原话或研究定论。现代制度名词用于比较时注明参与资格、时代与适用范围。

- `egypt-site`：[UNESCO世界遗产中心 · 孟菲斯与金字塔群](https://whc.unesco.org/en/list/86/)
- `egypt-education`：[大都会艺术博物馆 · 古埃及艺术：教师资源](https://resources.metmuseum.org/resources/metpublications/pdf/The_Art_of_Ancient_Egypt_A_Resource_for_Educators.pdf)
- `egypt-writing`：[大英博物馆 · 古埃及：法老的象征与文字](https://www.britishmuseum.org/sites/default/files/2025-05/Ancient-Egypt-Symbols-Visit-Resource-Ages-7-11.pdf)
- `egypt-papyrus`：[大都会艺术博物馆 · Papyrus in Ancient Egypt](https://www.metmuseum.org/essays/papyrus-in-ancient-egypt)
- `meso-writing`：[大都会艺术博物馆 · The Origins of Writing](https://www.metmuseum.org/essays/the-origins-of-writing)
- `meso-site`：[UNESCO世界遗产中心 · 伊拉克南部湿地与美索不达米亚古城](https://whc.unesco.org/en/list/1481/)
- `meso-law`：[卢浮宫 · The Code of Hammurabi](https://www.louvre.fr/en/the-code-of-hammurabi)
- `meso-math`：[圣安德鲁斯大学MacTutor · Babylonian Mathematics](https://mathshistory.st-andrews.ac.uk/HistTopics/Babylonian_mathematics/)
- `greece-art`：[大都会艺术博物馆 · Greek Art in the Archaic Period](https://www.metmuseum.org/essays/greek-art-in-the-archaic-period)
- `greece-education`：[大都会艺术博物馆 · 希腊艺术：从史前到古典时期](https://www.metmuseum.org/-/media/files/learn/for-educators/publications-for-educators/greek.pdf)
- `greece-site`：[UNESCO世界遗产中心 · 雅典卫城](https://whc.unesco.org/en/list/404/)
- `greece-exchange`：[大都会艺术博物馆 · 古希腊殖民、贸易与艺术交流](https://www.metmuseum.org/essays/ancient-greek-colonization-and-trade-and-their-influence-on-greek-art)
- `rome-education`：[大都会艺术博物馆 · Roman Art: A Resource for Educators](https://resources.metmuseum.org/resources/metpublications/pdf/Roman_Art_A_Resource_for_Educators.pdf)
- `rome-writing`：[大都会艺术博物馆 · Roman Inscriptions](https://www.metmuseum.org/essays/roman-inscriptions)
- `rome-theater`：[大都会艺术博物馆 · Theater and Amphitheater in the Roman World](https://www.metmuseum.org/essays/theater-and-amphitheater-in-the-roman-world)
- `rome-republic`：[大都会艺术博物馆 · The Roman Republic](https://www.metmuseum.org/essays/the-roman-republic)
- `maya-world`：[史密森尼美洲印第安人国家博物馆 · The Maya World](https://maya.nmai.si.edu/the-maya/maya-world)
- `maya-calendar`：[史密森尼美洲印第安人国家博物馆 · Calendar](https://maya.nmai.si.edu/calendar)
- `maya-today`：[史密森尼美洲印第安人国家博物馆 · The Maya](https://maya.nmai.si.edu/maya)
- `maya-site`：[UNESCO世界遗产中心 · 蒂卡尔国家公园](https://whc.unesco.org/en/list/64/)
- `persia-site`：[UNESCO世界遗产中心 · 波斯波利斯](https://whc.unesco.org/en/list/114/)
- `persia-empire`：[大都会艺术博物馆 · The Achaemenid Persian Empire (550–330 B.C.)](https://www.metmuseum.org/essays/the-achaemenid-persian-empire-550-330-b-c)
- `persia-archive`：[美国国家人文基金会 · 波斯波利斯档案与文化遗产保护](https://www.neh.gov/divisions/preservation/featured-project/preserving-the-cultural-heritage-the-ancient-near-east-and-t)
- `arab-art`：[大都会艺术博物馆 · The Nature of Islamic Art](https://www.metmuseum.org/essays/the-nature-of-islamic-art)
- `arab-site`：[UNESCO世界遗产中心 · 科尔多瓦历史中心](https://whc.unesco.org/en/list/313/)
- `arab-courts`：[大都会艺术博物馆 · Iraq (Mesopotamia), 500–1000 A.D.](https://www.metmuseum.org/ja/toah/ht/06/wam.html)
- `arab-calligraphy`：[维多利亚与阿尔伯特博物馆 · Calligraphy in Islamic art](https://www.vam.ac.uk/articles/calligraphy-in-islamic-art)
- `arab-maths`：[圣安德鲁斯大学MacTutor · Arabic Mathematics](https://mathshistory.st-andrews.ac.uk/HistTopics/Arabic_mathematics/)
- `arab-khwarizmi`：[圣安德鲁斯大学MacTutor · Al-Khwarizmi](https://mathshistory.st-andrews.ac.uk/Biographies/Al-Khwarizmi/)
- `arab-spain`：[大都会艺术博物馆 · 西班牙倭马亚时期的艺术](https://www.metmuseum.org/essays/the-art-of-the-umayyad-period-in-spain-711-1031)
- `india-city`：[UNESCO世界遗产中心 · 摩亨佐-达罗考古遗址](https://whc.unesco.org/en/list/138/)
- `india-site`：[UNESCO世界遗产中心 · 桑吉佛教古迹](https://whc.unesco.org/en/list/524/)
- `india-stupa`：[印度考古调查局 · Buddhist Monuments at Sanchi](https://asi.nic.in/pages/WorldHeritageBuddhistMonumentsatSanchi)
- `india-edicts`：[印度考古调查局 · 印度铭文学与阿育王诏令](https://asi.nic.in/pages/Epigraphy-Branch/hq)
- `india-script`：[大英博物馆 · 印度河符号与尚未解决的释读问题](https://www.britishmuseum.org/sites/default/files/2020-11/British_Museum_Magazine_Autumn2020_reducedsize.pdf)
- `met-egypt`：[大都会艺术博物馆 · 僧侣体纸草书信](https://www.metmuseum.org/art/collection/search/544847)
- `meso`：[大都会艺术博物馆 · 早期物资账目泥板](https://www.metmuseum.org/art/collection/search/327385)
- `greek-decree`：[大都会艺术博物馆 · 阿提卡法令铭文残片](https://www.metmuseum.org/art/collection/search/252475)
- `roman-bilingual`：[大都会艺术博物馆 · 拉丁文与希腊文双语石碑](https://www.metmuseum.org/art/collection/search/241947)
- `maya-vessel`：[大都会艺术博物馆 · 水鸟与玛雅文字陶器](https://www.metmuseum.org/art/collection/search/761272)
- `persian-relief`：[大都会艺术博物馆 · 波斯波利斯宫殿浮雕残片](https://www.metmuseum.org/art/collection/search/323178)
- `persian-bowl`：[大都会艺术博物馆 · 阿契美尼德金碗](https://www.metmuseum.org/art/collection/search/324289)
- `arab-capital`：[大都会艺术博物馆 · 科尔多瓦相关柱头](https://www.metmuseum.org/art/collection/search/448410)
- `arab-quran`：[大都会艺术博物馆 · 库法体《古兰经》书页](https://www.metmuseum.org/art/collection/search/448369)
- `indus-seal`：[大都会艺术博物馆 · 带牛形象的印度河印章](https://www.metmuseum.org/art/collection/search/38287)
- `india-photo`：[维多利亚与阿尔伯特博物馆 · The Great Stupa at Sanchi, 1861–1862](https://collections.vam.ac.uk/item/O175835/the-great-stupa-at-sanchi-photograph-waterhouse-james-john/)

`eventIds` 连接既有大事，事件页反向读取文明索引；文明页可按代表年份进入前后 500 年的双轨时间轴。此窗口用来观察同期环境，不表示整个文明只存在 1000 年。

新增字段先补 `content_sources/test/test-civilizations.js`。更新后运行目录 README 中的源数据与前端测试、`make study-topics-data` 和生成一致性检查。未改变数据库或学习记录结构。

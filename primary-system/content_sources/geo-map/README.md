# 地理图谱

统一版入口为 `/geography/atlas/china.html`。本目录保存模板、数据和配套素材。改动后运行 `make study-topics-data`。

标题、导航和筛选使用统一侧栏，默认靠右，可切换到左侧并在本浏览器保存。竖屏按地图、档案的顺序阅读。横屏且内容区够宽时，档案放在地图旁边；窄屏上，侧边栏移到内容上方。

| 页面 | 玩法 |
| --- | --- |
| `index.html` | 从地图预览进中国地图，查地名，或挑一个省域站 |
| `china.html` | 切换省级行政区、山河大地和邻居图层。认识 34 个省级行政区、45 处山河湖海和 20 个邻居，翻看 7 张口诀卡 |
| `animals.html?animal=giant-panda` | 在中国地图上认识 30 种代表动物，点位覆盖 27 个省级行政区。可按 6 类栖息地筛选，查看本地照片和关联省域站 |
| `world-animals.html?animal=emperor-penguin` | 在世界地图上认识七大洲和多片海域的 30 种代表动物，按 7 类栖息地筛选，查看本地照片和关联地点 |
| `world.html` | 看七大洲、四大洋、177 个国家和地区、10 处世界地标。在「中国与世界」图层找中国，也可以从对照卡直接定位 |
| `province.html?adcode=110000` | 用同一页查看任意省域站的档案和五条「记一记」。迷你地图高亮本省，点其他省份可换站；省域目录按四大地理区域分组 |
| `places.html` | 查 291 条地点档案，支持地名、简称、省会、英文名和地点类型，选中结果即打开相应地图 |
| `routes.html` | 三条主题路线，分别跟长江走到海边、登上世界屋脊、沿着边界去串门。每站都有观察问题、对应影像和前后站跳转 |
| `gallery.html` | 按主题和类型看实景图册。13 张图片可离线看，3 项央视影片链接需联网。点素材下的地点可回到地图高亮 |

中国与世界动物地图的选取区位于地图下方，以带照片、名称和编号的卡片展示。点照片和点地图标记会同步选中同一只动物，按栖息地筛选时，照片卡与地图一起变化。

中国和世界地图都可以换图层、看图例、点选地点或用下拉框定位。放大后可拖动地图，或在地图获得焦点后按方向键平移。「找一找」每轮随机出 5 题，点错时可读提示，答对再进下一题。

地图用于学习方位。中国省级轮廓由 DataV 边界数据简化而来，世界轮廓来自 Natural Earth 110m，山脉和河道为近似示意。中国图右下的小图显示南海诸岛和十段线。世界图使用等经距画法，靠近两极的陆地形状和面积会变形。

世界地图上方直接列出七大洲按钮，点击后逐洲突出轮廓并显示重点，点「全部大洲」返回全览。洲别选择也可用深链接，例如 `world.html?continent=africa#map`。切换图层或进入「找一找」时收起洲别高亮，回到七大洲自由探索后恢复。

图谱页面保留侧边导航，动物地图保留页头的地图切换入口。各页 hero 按主题配色，地图、档案、观察问题和目录用背景与边框区分。

## 数据与页面

- `content.js`、`map-data.js` 和 `world-data.js` 分别维护图层元数据、中国档案和世界档案。省份 `facts` 每条记录有五个要点。世界国家与地区用地图几何中的英文名作 ID，其余地点继续用现有 ID，例如 `p110000`、`f20`、`n2`、`wf2`、`o1`。
- `world-data.js` 的 `GM_CONTINENTS` 同时维护洲别档案。每洲有 `location`、三条 `facts`（标题与正文）、`observe`、`places`（代表地点 ID）和 `source`。跨洲国家沿用本图既有的大洲映射。
- `atlas.js` 从已有档案生成地点索引，供目录、路线、图层定位、关联档案和练习共用。新增地点时保留原档案的 ID 规则，并在对应 SVG 中用 `data-id` 注册可点选的图形。原 ID 会出现在已有链接里。
- `atlas-data.js` 用地点 ID 组织路线和双向关联。每个路线站点填写一条观察提示。中国的邻居还会按中文名关联到世界地图中的对应记录。中外对照卡在 `map-data.js` 的 `GM_WORLD_TEASERS` 中维护，`places` 依次引用左右两个地点。
- `media-data.js` 用地点 ID 挂接素材，`media.js` 在地图档案、省域站和图册复用渲染。图册支持 `?place=地点ID`，例如 `gallery.html?place=f20`。素材保留来源页、作者和适用的授权链接。图片按原画面等比缩放，转成 JPEG 后保存在 `assets/`，影片只打开央视网。
- `shared.js` 提供投影、SVG 路径、世界底图和省域站卡片。中国与世界地图页各自绘制图层，由 `map-ui.js` 处理定位、图层切换、档案关联、缩放和练习。目录和路线页只加载档案数据。
- `animals-data.js`、`world-animals-data.js` 分别维护中国和世界的动物档案与栖息地图例，交互共用 `animals-app.js`。动物 ID 用于直达链接和 `assets/animals/` 下的同名 JPEG 照片。中国档案用 `adcode` 关联省域站，世界档案用 `mapPlace` 关联国家、地区或大洋。点位只标出代表栖息地。档案里的 `source` 是资料出处，照片来自另一页面时填写 `photoSource`。
- 地图链接用 `?place=地点ID#map`，例如 `china.html?place=f20#map`，自动选中对应地点和图层。需要保留路线时加上 `&route=路线ID`。同一地点也可以在另一可见图层打开，例如 `world.html?place=China&layer=home#map`。

动物照片按原比例缩放并压缩为 JPEG。大熊猫照片由 J. Patrick Fischer 拍摄，采用 [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) 许可。褐马鸡照片由 Somongkol Teng 拍摄，采用 [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) 许可。原图及其他照片的出处见页面档案。

`china-geo.js` 和 `world-geo.js` 由脚本生成。重新生成时可传入本地源文件，省略参数时脚本会尝试联网下载。打开学习页面只读取本目录的文件。

```sh
python3 content_sources/geo-map/scripts/build-geo.py <100000_full.json 路径>
python3 content_sources/geo-map/scripts/build-world.py <countries-110m.json 路径>
node content_sources/test/test-geo-map.js
```

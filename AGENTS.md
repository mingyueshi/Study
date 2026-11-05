# AGENTS.md · AI 编码代理工作约定

面向在本仓库工作的 AI 代理。人类贡献者的介绍见 [README.md](README.md)。

## 仓库定位

多学段学习系统仓库，**每个系统一个顶层目录，互不依赖、可单独拷走使用**。全部界面与内容为简体中文，读者主要是小学生和家长。改动表述、示例、口诀时始终保持「讲给孩子听」的语气；数字用通行约数（如长江约 6300 千米），不引入学术争议细节。

## 目录地图

| 目录 | 是什么 | 技术形态 |
|---|---|---|
| `primary/` | 乐学堂 · 小学离线学习册（12 个学习页面） | 纯 HTML+JS+CSS，双击即开 |
| `primary-system/` | 乐学堂统一系统（多账号、多教材、Nova 后台） | Django 单体，Python 3.12+，SQLite |
| `history-explorer/` | 历史漫游 · 独立多媒体演示 | 纯 HTML+JS+CSS |
| `personal-learning/` | 个人学习系统（英文学习、AI 基础篇） | 纯 HTML+JS+CSS |
| `techlex/` | 旧入口，仅重定向到 personal-learning | 单文件 |

`junior/`、`senior/`、`university/` 为规划中的学段目录，尚不存在。

## 硬性约定

1. **系统之间零依赖**：不要在顶层目录之间新增文件引用、链接或共享代码。系统内复用已有模块（如 `primary/` 的 `speech.js`、`layout.css`、`books.css`），不要复制一份。
2. **离线优先**：静态系统（primary、history-explorer、personal-learning）不引入 CDN、外部字体、构建步骤或运行时网络依赖。明确标为「需联网」的扩展内容（B站视频、实景照片链接）除外，且页面在无网时必须能正常降级打开。
3. **无版权顾虑**：这是自用内部页面，没有版权问题，可以放心引用外部资源（图片、数据、素材等），不必为版权绕开或替换优质素材；但出处标注等「内容准确性」上的好习惯仍保留。
4. **数据与逻辑分离**：内容改动只动 `*-data.js`，不改 `*-app.js`；给数据结构加字段时，必须同步在对应的 `test/` 文件补校验。
5. **中文标点**：数据字符串里用中文标点（「」、，、：），不要英文双引号和裸换行——测试会拦截。
6. **不提交本地产物**：`db.sqlite3`、`.local-secret`、`.venv`、备份文件、`.zcode/`、`output/` 等已在 `.gitignore`，不要往里写东西也不要设法入库。

## 界面设计约定

1. **活泼的界面**：整体风格要明快、有童趣，配色鲜明不沉闷，适度使用圆角、卡片、色块、图标和轻量动效，避免严肃死板的后台式排版。
2. **清晰易读的大字号**：面向小学生和家长，正文字号要偏大、行距要宽松，确保长时间阅读不费力；标题层级要醒目，重点内容（如拼音、读音、答案）应进一步放大或加粗突出。
3. **桌面端优先**：主要适配桌面端宽屏（横屏）和竖屏显示，布局、间距、字号都按桌面端阅读体验设计；移动端只需保证基本可用，不投入过多精力做移动端专门优化。

## 数据测试（改完必须跑）

primary 的测试不依赖浏览器，直接用 node 跑：

```sh
node primary/test/test-geo.js        # 改 geo-data.js / geo-figures.js 后
node primary/test/test-knowledge.js  # 改 knowledge-data.js 后
```

对应关系：`test-knowledge`→语文、`test-math-knowledge`→数学、`test-english`→教材同步单词、`test-words`→场景单词、`test-idioms`→成语本、`test-writing`→作文坊、`test-chain`→成语接龙、`test-geo`/`test-astro`/`test-history`/`test-lit`/`test-sci`→五本探索册。personal-learning 的测试是 `node personal-learning/test/test-structure.js` 与 `test-theme.js`。

改了哪个 data 就跑哪个 test；新增系统或新增数据结构时，先写测试再填数据。

## primary/ 的固定模式

每个学习册一套：入口 `xxx.html` + 数据 `xxx-data.js` + 逻辑 `xxx-app.js` + 样式 `xxx.css`，可选 `xxx-figures.js`（SVG 图示与互动演示）、`xxx-photos.js`、`xxx-videos.js`。要点：

- 知识卡数据字段：`id`、`title`、`fig`、`overview`、`items`、`example`（q/a/steps）、`mistakes`、`recall`；`fig` 必须是对应 figures 文件里注册的 id，否则测试报错。
- 知识点 id 命名：学段前缀 + 站点号 + 序号，如 `gu1-2`（地理）、`au1-2`（天文）、`hu1-3`（历史）、`lu3-2`（文学）、`su2-2`（科学）、`mu1-1`（数学）。
- 照片放 `images/` 对应子目录（`images/history/`、`images/astro/`、`images/lessons/` 等）。
- 新增学习册要在根 README 的「现有系统/快速开始」和 `primary/README.md` 同步登记；修改数据规模（如「8 单元 27 课」）时同步更新两处 README 里的数字。

## primary-system/ 的运行方式

```sh
cd primary-system
python3.12 bootstrap.py                                        # 首次初始化
PRIMARY_DEBUG=1 .venv/bin/python manage.py runserver 127.0.0.1:8012
```

- 已有数据库默认只校验不重置；重置用 `python3.12 bootstrap.py --refresh-data`，含个人记录或人工修订时会拒绝——不要绕过这个保护，先问用户。
- 设计基线在 `primary-system/docs/system-design.md`；区分两条管线：**教材按册次/单元编排**，**学科功能是独立 Django app**（words、idioms、phonetics、writing、poetry 等），不要把学科功能塞回通用阅读器。
- 各 app 的 `data/README.md` 说明数据维护方式，改数据前先读对应文件。
- 端口固定 127.0.0.1:8012，不要改成其他端口。

## Git 习惯

- 提交信息用简短中文（如「功能完善」「优化演示编排」，沿用现有风格）。
- 文档与实现同进退：改了入口、功能范围或数据规模，同一批提交里更新对应 README，不要留过期数字。

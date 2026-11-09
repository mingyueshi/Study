# 数学教材册数据说明

数据是**按册编排**的生成物：册次注册在 `scripts/build_mathbook.cjs` 的 `BOOKS`
映射里（一行一册，册次码对齐 catalog 教材码后缀，如 bnu-math-4a-2026 → `4a`），
每册产出 `static/mathbook/books/<册>.js`（规范化 `const MKB = <JSON>;`）与
`mathbook/data/books/<册>.json`（结构摘要）。重跑无 diff。
**内容源头在 `content_sources/`**——修改知识点、单元、公式、易错、视频都去 `content_sources/` 对应
数据文件改（当前 `content_sources/math-data.js` 即四上），然后：

```sh
node content_sources/test/test-math-knowledge.js   # 源头契约（构建脚本也会先代跑作为审计门）
make mathbook-data                          # 或 node scripts/build_mathbook.cjs
.venv/bin/python manage.py test mathbook   # 生成物契约与页面测试
```

## 产物

- `static/mathbook/books/<册>.js`：规范化为 `const MKB = <JSON>;` 的数据文件，
  浏览器直接加载（页面用来源 sha256 前 8 位作 `?v=` 版本号，内容变了缓存自动
  失效）；Python 端（`mathbook/content.py`）剥壳解析校验。
- `mathbook/data/books/<册>.json`：结构摘要（`book`、`textbook_code`、
  `source_file`、`source_sha256`、单元/知识点计数、`fig_ids`/`banner_ids`/
  `video_ids` 清单），是加载期校验的对照基准。
- `static/mathbook/math-figures.js`：数学专属图示库（由文件源生成）。
- `static/figures/figures.js`、`figures.css`：语文/数学共用图示库（由文件源生成；
  DB 阅读器的图示块同样消费，引用处 `?v=N` 需随内容变化递增）。
- `static/images/math/`：情境照片、单元横幅、视频封面（只增不删）。

## schema 与契约

- 单元 11 个（mu1..mu8 ＋ mcode/mplay/mnav 三个综合实践/好玩板块）、知识点 43 个，
  字段契约与源测试 `content_sources/test/test-math-knowledge.js` 一致：每点必带
  `fig`（图示库已注册）、`overview`、`life`、`items>=2`、`example{q,a,steps}`；
  公式速查 ≥4 组（`[名称, 式子]`）、易错诊所 ≥10 条（unit/wrong/right）；
  视频 `bvid`/封面/分组齐全，知识点引用的 `video` 必须存在。
- 内容纪律：中文标点（禁英文双引号、裸换行、HTML 标签形态；比较符号 <、> 允许）。
- 加载期 `mathbook/content.py::validate()` 对照 manifest 复核（计数、图示/视频
  引用、横幅与封面照片文件在位），坏数据抛 `ImproperlyConfigured` 拒绝上线。

## 与挑战题库的关系

例题自评与易错诊所题由 `scripts/build_questionbank.cjs` 从同一份
`content_sources/math-data.js` 生成批次进题库。四上知识卡按 `math:{知识点ID}:example`
打开对应的自评题，易错诊所按原始条目打开判断练习。自评记录孩子的对照结果，
判断题由服务端判分。题库分别显示自评和客观答对，练完可以返回原知识点或易错诊所。

## 账号进度

- 已读和自评掌握是两个独立标记，按册次和知识点 ID 保存。上次单元按册次和单元 ID 保存。修订内容时保留含义相同的 ID，换成其他知识点时使用新 ID。
- 游客沿用本机浏览器原有存档。登录后可确认导入，每个账号每册一次。导入分别合并已读与自评掌握，优先保留已有的账号续读位置。操作后，浏览器里的游客存档仍可继续使用。

## 新增一册 / 修订流程

1. 改 `content_sources/` 对应数据文件（新增册次：先在 `content_sources/` 建数据文件＋静态版测试）
2. `scripts/build_mathbook.cjs` 的 `BOOKS` 映射加一行（新册），或直接改现有册内容
3. `node content_sources/test/test-math-knowledge.js` 过源头契约（构建脚本也会先代跑）
4. `make mathbook-data` 重跑同步（确定性产出、重跑无 diff；图片只增不删）
5. 静态文件内容有变时升 `templates/mathbook/reader.html` 与
   `templates/learning/item.html` 里的 `?v=N`
6. `manage.py test mathbook` ＋ 打开 `/mathbook/` 目检

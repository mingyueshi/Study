# 语文教材册数据说明

数据是**按册编排**的生成物：册次注册在 `scripts/build_chinesebook.cjs` 的 `BOOKS`
映射里（一行一册，册次码对齐 catalog 教材码后缀，如 pep-chinese-4a-2026 → `4a`），
每册产出 `static/chinesebook/books/<册>.js`（规范化 `const KB = <JSON>;`）与
`chinesebook/data/books/<册>.json`（结构摘要）。重跑无 diff。
**内容源头在静态版**——修改课文、古诗文、字词复习都去 primary 对应数据文件改
（当前 `primary/knowledge-data.js` 即四上），然后：

```sh
node primary/test/test-knowledge.js     # 源头契约（构建脚本也会先代跑作为审计门）
make chinesebook-data                    # 或 node scripts/build_chinesebook.cjs
.venv/bin/python manage.py test chinesebook   # 生成物契约与页面测试
```

## 产物

- `static/chinesebook/books/<册>.js`：规范化为 `const KB = <JSON>;` 的数据文件，
  浏览器直接加载（页面用来源 sha256 前 8 位作 `?v=` 版本号，内容变了缓存自动
  失效）；Python 端（`chinesebook/content.py`）剥壳解析校验。
- `chinesebook/data/books/<册>.json`：结构摘要（`book`、`textbook_code`、
  `source_file`、`source_sha256`、单元/课文/古诗文/日积月累/多音字/形近字计数、
  `fig_ids`/`image_refs` 清单），是加载期校验的对照基准。
- `static/figures/figures.js`、`figures.css`：语文/数学共用图示库（primary 同步；
  DB 阅读器的图示块同样消费，引用处 `?v=N` 需随内容变化递增）。
- `static/images/lessons/`、`static/images/poems/`：课文实景照片与古诗意境图
  （只增不删）。

## schema 与契约

- 单元 8 个（u1–u8）、课文 27 篇（课号 1–27 全集），每单元含习作板块，
  口语交际/习作例文/语文园地/快乐读书吧按需；课文字段：课型（精读/略读）、
  内容梳理 ≥2、主题感悟、写法点睛、考点提示 ≥2，重点词语 `[词, 释义]`、
  多音字 `[字, 拼音1, 词1, 拼音2, 词2]`、近反义词三元组、作者小传、原文金句、
  真实百科、拓展视频 `{bvid,title,up,dur,note}`（B站外链卡）。
- 必背古诗文 ≥9 篇（古诗 9＋文言文 2），意境图/注释/创作背景/诗人小传按需。
- 内容纪律：中文标点，正文不允许任何尖括号、英文双引号与裸换行（比数学更严，
  语文无比较符号需求）。
- 加载期 `chinesebook/content.py::validate()` 对照 manifest 复核（计数、图示
  引用、图片文件在位），坏数据抛 `ImproperlyConfigured` 拒绝上线。

## 与挑战题库的关系

课文多音字「给词选读音」由 `scripts/build_questionbank.cjs` 从同一份
`primary/knowledge-data.js` 生成批次进题库（服务端判分、落记录、进错题本）；
教材册页内「已复习」只存浏览器 localStorage，两边口径独立、不互相同步。

## 新增一册 / 修订流程

1. 改 primary 对应数据文件（新增册次：先在 primary 建数据文件＋静态版测试）
2. `scripts/build_chinesebook.cjs` 的 `BOOKS` 映射加一行（新册），或直接改现有册内容
3. `node primary/test/test-knowledge.js` 过源头契约（构建脚本也会先代跑）
4. `make chinesebook-data` 重跑同步（确定性产出、重跑无 diff；图片只增不删）
5. 静态文件内容有变时升 `templates/chinesebook/reader.html` 里的 `?v=N`
6. `manage.py test chinesebook` ＋ 打开 `/chinesebook/` 目检

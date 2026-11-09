# 作文坊数据维护说明

`topics.json` 是作文坊专题的静态课程数据。**写作专题独立于教材编排**：不使用
catalog 的 ContentItem / 单元 / Placement，也不依赖词库；题目、范文、素材都是本
app 的教学数据，由本文件与 `writing/tests.py` 的数据契约共同守护。

## 结构

- `schema_version`：当前 `1`；改结构必须升版本并同步 `writing/tests.py` 校验。
- `source_code`：固定 `primary-writing`。
- `categories`：题材分类（写人/写家人/写事/写景/写物/想象/应用文），每类 ≥2 题。
- `categories[].topics[]`：每题 `{title, goal, outline[3], words[], sentences[], model, comment, task}`：
  - `outline` 恰 3 步、必须含「开头」「结尾」标签；
  - 每题 ≥3 个好词、≥2 个好句，范文 ≥120 字，点评与小练笔必填；
  - `title` 全库唯一。
- `materials`：素材百宝箱 `{starts, ends, wordGroups, sentences}`（好开头/好结尾/好词分类/比喻拟人句）。

## 修改流程

1. 数据源头在 `primary/writing-data.js`（原型同源）；改完在 primary-system 目录跑
   `node scripts/convert_writing_data.js` 重新生成本 JSON 并提交。
2. `manage.py test writing`：契约校验 + 草稿 API + 页面渲染全过。
3. 打开 `/writing/` 目检新题卡与素材。

## 与草稿的关系

草稿（我的作文本）保存在 `writing.WritingDraft`（登录挂账号、游客挂会话键，与场景
单词/接龙同双轨约定，游客数据不合并进账号）。题目数据只读，草稿通过
`topic_title` 字符串弱引用题目，题目改名不影响已存草稿。

未点击保存的内容在当前浏览器按账号或游客会话暂存。暂存保留原稿编号和保存版本，
刷新后可接着编辑原稿，版本冲突仍由服务端拒绝。切换账号后，旧页面会在读取或保存
草稿时收到刷新提示。早期共用暂存缺少归属，系统保留原数据并停止自动加载。

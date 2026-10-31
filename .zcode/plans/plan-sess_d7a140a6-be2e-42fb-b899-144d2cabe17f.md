# 场景单词玩法 app（words）：legacy 体验移植 + 词典全量驱动

## Context

专题退场后的第一个玩法应用。Legacy `words.html` 体验：46 场景 / 577 词，玩法循环 = 场景浏览（chips 进度）＋单词卡（emoji/en/IPA/zh/拆分 parts 跟读/💡memo/关联词）＋搜索＋标记掌握＋连读（2100ms 步进高亮），无测验模式。用户决策：**词典全量补入**（577 词投影 primary-words 新 release，兑现「从基础数据库选择源」）、**掌握状态双轨**（账号 FK / 游客会话键，GameRound 同模式）。

## 实施步骤

### 1. 词典补全：`words_manifest` 适配器
- `lexicon/adapters.py` 新增 `words_manifest(snapshot_path)`：读 `data/primary.json` 的 words 模块（46 场景 577 词，en 全局唯一），投影 row：`key=en`、`headword=en`、`ipa→pronunciation(ipa)`、`zh→definition(gloss zh)`、`emoji/segments/memo/related→properties`（各带证据路径）。
- `import_lexicon.py` choices 加 `words-data`；导入新 release（同 source `primary-words`，新版本号）→ 激活 → `review_primary_readings` 重跑核对（命令按最新 release 取，验证其覆盖新版本）。
- 预期：primary-words 词典 305→577 条，ScenarioWord 全量挂 entry 零降级。

### 2. 新 app `words`
- `Scenario`（code/name/zh/emoji/color/order，46 个）＋ `ScenarioWord`（en 唯一、entry FK→lexicon.LexicalEntry null=False、scenario FK、emoji、segments JSON、memo、related JSON 原清单）——内容源全在词典（IPA/释义/词性经 entry），教学标注留卡上。
- `WordProgress`：owner 双轨（user FK nullable / guest_key，互斥约束）＋ word FK＋learned＋updated_at，unique(owner, word)。
- `import_scenarios` 管理命令：读 primary.json words 模块建 Scenario/ScenarioWord，entry 按 `headword==en` 匹配 active release 词条（报告匹配数），幂等。

### 3. API 与页面（chain 同形态）
- `/words/` 壳页（state 内联 json_script）＋ `/words/api/state/`（全量：46 场景＋577 词展示数据＋掌握状态＋统计）＋ `/words/api/learn/` POST（双轨 owner，幂等切换）。
- `static/words/words.js`：legacy words-app.js 移植——场景 chips（n/total 进度）、词卡网格、搜索（en/zh/场景名）、连读（2100ms 高亮）、learn 切换改为调 API、SpeechKit 点读；游客与登录同构。
- `static/words/words.css`：legacy books.css 词卡类＋study-theme 主题变量合并为单文件。
- 入口：`seed_platform` MODULES 加回 `('words', '场景单词', ...)`，`module.html` chain 同款特判「进入场景单词」。

### 4. 测试
- 导入命令：46/577、幂等、entry 匹配 100%、related 解析（in-book/out）。
- API：游客与登录双轨 learn（隔离、幂等切换）、state 完整性、CSRF 路径（enforce_csrf_checks 用例）。
- 页面渲染：chips/词卡/搜索标记。
- 既有 120 项不回归。

### 5. 文档
- README（场景单词玩法接入＋词典 577 补全）；VALIDATION.md 验证记录。

## 不做的事
- 测验/拼写模式（legacy 无此玩法）；img 图片字段（legacy 全空）；WORD_ZH 独立表（拓展词 zh 并入 related JSON）；english 教材单词不受影响。

## 验证
- 全量测试通过；导入后 Scenario 46 / ScenarioWord 577 / entry 挂接 100%；`review_primary_readings` 覆盖新 release；`runserver` 打开 `/words/`：场景切换、点读、拆分、关联、标记掌握（游客＋登录）、连读全部可用。

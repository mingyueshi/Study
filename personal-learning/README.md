# 个人学习系统

一个可单独拷走使用的个人学习空间，按学习方向组织内容。以桌面宽屏和竖屏阅读为主，保留窄窗口兼容。

双击 `index.html` 打开总首页。所有页面、样式、数据和脚本都在本目录内，无需安装依赖或连接其他系统。

## 目录与入口

```text
personal-learning/
├── index.html                 学习总首页
├── assets/                    共用主题、导航样式与进度概览
├── english/
│   ├── index.html             英文学习目录
│   └── techlex/               TechLex 计算机英语完整模块
│       ├── index.html
│       ├── progress.js        学习进度管理
│       └── test/
├── ai/
│   └── index.html             AI 基础篇：路线、概念、自检与笔记
└── dev/
    └── index.html             开发命令：速查、搜索、遮住自测与掌握标记
```

| 方向 | 内容 | 状态 |
| --- | --- | --- |
| [英文学习](english/index.html) | [TechLex](english/techlex/index.html)：12 类、205 个术语、24 条双语工作表达 | 可使用 |
| [AI 学习](ai/index.html) | 6 阶段路线、24 个基础概念、24 道自检题、6 个小练习 | 基础篇可学习 |
| [开发命令](dev/index.html) | 6 个工具、151 条常用命令：mac、Linux、git、pyenv、nvm、vi | 可使用 |

总首页、方向目录和 TechLex 都有返回首页、切换英文学习、AI 学习及开发命令的导航。AI 基础篇支持路线与概念检索、参考资料、概念自检、手动学习标记和本机笔记；自检不自动替你标记学会。开发命令支持跨工具搜索、一键复制、遮住自测和逐条掌握标记，详见 [开发命令文档](dev/README.md)。

## 学习进度

- 英文模块继续使用 `techlex_v1`。通过同源网站打开时，总首页与英文目录直接读取同一份档案，不重复保存进度；直接双击本地文件时，首页和目录会引导到 TechLex 查看进度，避免不同文件的存储隔离导致统计误导。
- 进度只保存在当前浏览器。不同浏览器、域名或端口之间不自动同步进度。

AI 模块使用独立的 `personal_ai_v1` 保存已学习标记、自检选项、上次阅读位置与笔记，不修改英文学习档案。详见 [AI 模块文档](ai/README.md)。

开发命令模块使用独立的 `personal_dev_v1` 保存已掌握命令与上次工具，详见 [开发命令文档](dev/README.md)。

## 阅读主题与发音

每个页面右上角都能切换亮色或暗色。第一次打开跟随系统主题，手动选择后以自己的选择为准，使用独立键 `personal_learning_theme_v1` 保存。同源页面共用设置；直接双击本地文件时，系统内部跨页导航会带上主题，避免文件存储隔离使主题突变。

亮色采用暖白底，暗色采用深灰蓝底。正文保留中性高对比度；蓝色区分概念和例句，暖色突出助记与易混淆点，紫色区分关联词与练习。颜色配合文字标题与状态标记使用。

TechLex 搜索栏下的「系统发音」可展开选择英语、中文发音人及语速，并分别试听。发音列表来自当前系统和浏览器，支持延迟加载与手动刷新。设置沿用 `speech_pref_v1`，兼容旧英语发音人名称，新增中文发音人与语速；点读和连读使用同一套选择。没有可选列表时使用浏览器默认发音，不支持语音时保留阅读功能并显示说明。

## 检查

在本目录运行：

```sh
node test/test-structure.js
node test/test-theme.js
node ai/test/test-ai.js
node dev/test/test-dev.js
node english/techlex/test/test-tech.js
node english/techlex/test/test-speech.js
node english/techlex/test/test-progress.js
```

进一步说明见 [TechLex 文档](english/techlex/README.md)。新增学习方向时，在本目录创建子目录及入口页，并更新总首页和各页面的学习系统导航。

# 开发命令

12 个工具、326 条开发与运维常用命令：macOS、Shell 基础、Git、Docker 与容器、Linux 运维、SSH 与远程、pyenv 与 pip、Django、nvm 与 npm、vi 编辑器、nano 编辑器、网络与接口。入口是 [dev/index.html](index.html)，可直接双击打开，搜索、自测和记录都不依赖网络。

## 使用

- 宽屏显示工具侧栏与多列命令，随工作区宽度切换一至四列；竖屏和较窄窗口以工具选择器代替侧栏，保留正文宽度。页头和工作区随窗口一起展开。
- 工具页先显示名称、适用环境和分组目录，再按场景展示命令。命令和示例都可以点击复制，复制后有可见反馈。命令里的文件名、服务名等占位值要替换后再执行。
- 文件名可能带空格、换行、引号或反斜杠。`find` 接 `xargs` 处理路径时，用 `-print0` 与 `-0` 配对，示例只列举普通文件；不要把按行预览的输出直接交给删除命令。单文件删除示例引用完整路径，使用 `rm -i --` 逐项确认；预览也不能防止两次操作之间文件被替换。
- 搜索会匹配工具、分组、命令、说明、示例和提示。多个关键词用空格分隔，如「取消 暂存」；可选择搜索全部工具或当前工具，再按全部、未掌握、已掌握筛选。
- 在非输入区域按 `/` 聚焦搜索，Esc 清空。点击工具目录会退出搜索；没有命中时可以重置筛选。
- 「遮住自测」收起命令、示例及提示，只留说明供回想。点击「揭晓」核对，再点击可复制。揭晓仅在当前会话有效。
- 「标记掌握」逐条保存进度。侧栏显示各工具的计数，顶部显示全部计数；「开始速查」进入第一个工具，「继续」回到上次工具。
- 每个工具页末尾有可展开的官方参考资料，明确标注「需联网」；离线时不影响正文和操作。

新增内容主要覆盖 Git 冲突中止与 worktree、Docker 资源和配置排查、systemd 日志和 Nginx 检查、SSH 跳板与同步预演、Python 虚拟环境、npm 锁文件安装、nano 的保存退出和编辑快捷键，以及 HTTP、DNS 和 TCP 端口检查。工具与系统差异写在适用环境及对应提示里；版本号是示例，实际按项目要求选择。

## Django 命令

新增 35 条 Django 常用命令，覆盖初始化与帮助、启动与交互、模型与迁移、测试与回归、账号与数据、静态文件与发布。入口：[Django 命令速查](index.html#tool=django)。

按 Django 5.2 官方文档核对，与配套课程的版本基线一致；已有项目以实际依赖及命令帮助为准。`manage.py` 命令在项目根目录、对应虚拟环境中运行。应用名、迁移编号、测试路径、配置模块和文件名按自己的项目替换。

迁移区先列出生成预览与执行计划，再提供实际应用；静态收集也提供预演。数据加载、数据库写入和可能输出敏感信息的操作有对应说明。命令页可以直达 [Django 学习路线](../coding/index.html#track=django)，课程也链接回命令速查。

## 深链接

- 工具：`#tool=git`，兼容原有入口。
- 分组：`#tool=git&group=git-stage`，从分组目录跳转。
- 单条：`#tool=git&command=git-restore-staged`，从「定位此条」跳转，可保存或复制浏览器地址，目标卡会突出显示。

分组与单条 ID 必须属于链接中的工具。未知工具回到总览；未知分组或命令显示对应工具。定位时会清空搜索，页面内的分组与单条跳转还会重置掌握筛选，避免目标被隐藏。

## 保存位置

进度保存在浏览器的 `personal_dev_v1` 键下，只存已掌握命令的 ID 和上次工具，兼容已有记录，不与其他学习方向混用。搜索条件和自测状态不持久化。不同浏览器、域名或端口之间不自动同步；直接双击本地文件时，记录由浏览器对该文件的存储策略决定。存储不可用时会提示，本次会话仍可使用。

## 文件与检查

- `dev-data.js`：纯数据。工具字段包括 `id`、`name`、`emoji`、`tagline`、`platform`、`references` 和 `groups`。参考资料为 `{ name, url }`，使用官方 HTTPS 链接。可选 `learning` 为 `{ label, href }`，链接个人学习系统内的对应路线。分组下的命令为 `id`、`cmd`、`desc` 及可选的 `example`、`note`，危险提示用 ⚠️ 开头。
- `dev-state.js`：本机记录的读取与校验，丢弃未知 ID 和无效数据。
- `dev-core.js`：深链接解析、多关键词匹配、工具范围及掌握状态筛选。
- `dev-app.js`：渲染、导航、复制反馈、自测、焦点管理和掌握标记。
- `dev.css`：桌面宽屏与竖屏布局，复用公共明暗主题。
- `test/test-dev.js`：数据结构、存储兼容、深链接归属和组合筛选校验。
- `test/test-command-safety.js`：由 `test-dev.js` 一并运行，在独立临时目录中核对特殊文件名的参数边界、预览不修改文件，以及删除前确认；需要 macOS / Linux 的 Shell、find、xargs 和 rm。

在仓库根目录运行：

```sh
node personal-learning/test/test-structure.js
node personal-learning/test/test-theme.js
node personal-learning/dev/test/test-dev.js
```

添加命令时保留既有 ID，新增字段先补结构校验，说明文字用中文标点，同步更新此文档和个人学习首页、README 中的数量。

命令语义核对参考：[Git restore](https://git-scm.com/docs/git-restore)、[Git worktree](https://git-scm.com/docs/git-worktree)、[Docker Compose](https://docs.docker.com/reference/cli/docker/compose/)、[systemd 日志](https://www.freedesktop.org/software/systemd/man/latest/journalctl.html)、[rsync](https://download.samba.org/pub/rsync/rsync.1)、[Python venv](https://docs.python.org/3/library/venv.html)、[npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/)、[npx](https://docs.npmjs.com/cli/v11/commands/npx/)、[curl](https://curl.se/docs/manpage.html)、[GNU nano](https://www.nano-editor.org/dist/latest/nano.html)、[Django 管理命令](https://docs.djangoproject.com/en/5.2/ref/django-admin/)。

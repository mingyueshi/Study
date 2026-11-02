# 以后接入 primary-system

这里提供可重新导出的模板和资源约定。当前仍是独立静态演示，未向 `primary-system` 添加应用、视图、路由、数据库或入口。

## 1. 导出专题内容

在仓库根目录运行：

```sh
python3 history-explorer/scripts/export_django.py
python3 history-explorer/scripts/export_django.py --check
```

脚本仅使用 Python 标准库，以 HTML 结构提取 `main#main` 内完整的 `.history-topic` 容器，包括对话框，输出 `history-explorer/django/history.html`。它不修改 `index.html`。修改原型结构后重新导出，不直接修改生成模板。

生成模板继承 `base.html`，复用真实的全局导航、账号区域、`.shell` 和页脚，只加载专题的 `styles.css`、`lab.css` 与四个脚本。静态演示中的旧版历史链接会被移除，不带入 `primary/` 运行时依赖。

## 2. 复制到目标项目

以下为将来接入时的目标位置，当前没有执行这些复制：

| 本目录文件 | 目标位置 |
| --- | --- |
| `django/history.html` | `primary-system/templates/history/history.html` |
| `styles.css`、`lab.css` | `primary-system/static/history-explorer/` |
| `content.js`、`media.js`、`app.js`、`lab.js` | `primary-system/static/history-explorer/` |
| `assets/` 完整目录 | `primary-system/static/history-explorer/assets/` |
| `CONTENT-SOURCES.md`、`MEDIA-SOURCES.md` | `primary-system/static/history-explorer/` |

**不复制 `index.html`、`platform-theme.css` 或独立页的全局页头页脚。** `base.html` 已加载项目自己的 `platform.css`，重复加载快照可能覆盖主项目后续更新。

专题样式限制在 `.history-topic` 内；页面宽度、基础字号、按钮和导航等公共样式由主项目提供。`media.js` 根据自身脚本 URL 定位照片、封面、短片，`app.js` 根据自身脚本 URL 定位来源说明，因此页面放在 `/history/` 或更深路径也不需要改媒体相对路径。模板通过 `{% static %}` 加载六个 CSS/JavaScript 资源。

## 3. 最小视图与路由示例

以下是未来独立 `history` 应用中的最小示例，仅用于说明接法；不表示当前项目已经有这些文件或路由：

```python
# history/views.py
from django.shortcuts import render


def home(request):
    return render(request, "history/history.html")
```

```python
# history/urls.py
from django.urls import path
from . import views

app_name = "history"
urlpatterns = [path("", views.home, name="home")]
```

```python
# 项目的 config/urls.py 中，确定接入后增加对应路由。
from django.urls import include, path

# 加到现有 urlpatterns 中，而不是替换项目原有路由：
path("history/", include("history.urls")),
```

静态资源按主项目既有发布方式处理。完成正式接入时，还需要在真实 Django 页面验证全局导航、静态文件路径、手机布局和所有交互。

## 4. 入口与学习数据的边界

遵循 `primary-system/docs/system-design.md` 中的领域约定：历史属于独立学科功能，拥有自己的学习流程和数据，不恢复 `TopicBook`，也不创建假教材。首页模块只负责入口。

目前主项目的入口映射位于 `catalog/views.py` 的 `GAME_ROUTES`，并由首页使用 `module.entry_url`；模板中还存在 `chain`、`words` 特判。正式接入时按主项目届时的代码注册约定提供路由、启用规则、展示信息与学习摘要，不在原型中抢先修改入口。页面显示、直接访问与启用规则应一起核对。

当前八章印章仍使用 `localStorage`，键为 `history-explorer-passport-v1`。它按浏览器与站点保存，不按账号区分，清除浏览器数据会丢失；复制到另一个站点也不会自动迁移。当前没有服务器同步、登录归属或跨设备同步。正式接账号时，需要明确设计“探索/答题/收章”的学习结果，不能直接当作教材 `Progress` 的掌握百分比。

当前内容来自静态数据文件。以后若改为后台维护，再按实际需求增加历史领域模型和来源记录；本模板导出工具不承担数据库迁移或动态页面搭建。

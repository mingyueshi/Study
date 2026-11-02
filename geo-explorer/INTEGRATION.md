# 接入 primary-system 的准备

当前成果是独立静态演示，不代表已接入主项目。专题布局和脚本与独立目录隔离，媒体依据 `media.js` 的 URL 解析，来源说明依据 `app.js` 的 URL 解析，因此支持深层页面路径。

## 导出与复制

编辑 `index.html` 后重新运行：

```sh
python3 geo-explorer/scripts/export_django.py
python3 geo-explorer/scripts/export_django.py --check
```

生成模板位于 `django/explorer.html`，继承 `base.html`，保留一个 `.geography-topic` 容器和四个对话框。独立页中的旧版 `primary/geo.html` 链接不会带入。

| 本目录 | 将来复制到 |
| --- | --- |
| `django/explorer.html` | `primary-system/templates/geography/explorer.html` |
| `styles.css`、`lab.css`、`content.js`、`media.js`、`app.js`、`lab.js` | `primary-system/static/geo-explorer/` |
| `assets/` | `primary-system/static/geo-explorer/assets/` |
| 两份 `*-SOURCES.md` | `primary-system/static/geo-explorer/` |

不复制 `platform-theme.css`、独立 `index.html` 或全局页头页脚。正式页面使用主项目实时的 `platform.css`，避免快照覆盖后续主题改动。

## 与已有地理应用并存

本次查看时，主项目已经有 `geography` 应用及国家地区资料页，不应直接覆盖现有 `index.html`、`detail.html`、模型或导入逻辑。启蒙体验可以作为一个独立视图：

```python
# 示例：在确认正式接入后增加，不替换现有视图。
from django.shortcuts import render


def explore(request):
    return render(request, "geography/explorer.html")
```

在已有 `geography/urls.py` 中增加固定路径时，应排在 `<str:code>/` 动态路径之前：

```python
path("explore/", views.explore, name="geography-explore"),
```

首页入口、功能启用规则与学习摘要按主项目届时的注册约定实现。当前原型不创建教材、不恢复通用专题学习册，也不建立主项目到原型目录的线上依赖。

## 学习记录

演示的印章使用浏览器 `localStorage`，键为 `geo-explorer-passport-v1`，与历史页独立，但不按账号区分。正式接入时要明确“观察、答题、收章”各自的含义和用户归属，不能把八站印章直接当作教材掌握率。

模板导出只准备前端结构与资源路径，不连接数据库、不执行迁移。正式接入后还要在真实 Django 路由上验证静态资源、全局导航、账号归属及手机交互。

# 后台统计图表资源

`chartjs/` 来自 Nova 官方仓库 `dist/vendor/charts/chartjs/`，随本系统保存，运行时无需联网或构建。

- Chart.js：4.6.1，Nova 源码修订 `041cd80772a8ecc9621743463134462809de13e2`。
- 上游：[Nova 图表资源](https://github.com/mingyueshi/django-nova-admin/tree/041cd80772a8ecc9621743463134462809de13e2/dist/vendor/charts/chartjs)。
- 保留 Chart.js 与内含颜色库的许可文本。图表只接收本系统后台按权限聚合的数据，不使用 Nova 静态演示的数据。

更新时整体替换脚本与许可文本，核对版本，并复查后台首页的图表、数据表与无脚本降级。

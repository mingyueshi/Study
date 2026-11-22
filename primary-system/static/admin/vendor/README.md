# 后台统计图表资源

`chartjs/` 来自 Nova 官方仓库 `dist/vendor/charts/chartjs/`，随本系统保存，运行时无需联网或构建。

- Chart.js 4.6.1，已和 Nova 源码修订 `9ed95e48b9bd90f61373f7ad186f32690691bad4` 逐字节核对。 [Nova 图表资源](https://github.com/mingyueshi/django-nova-admin/tree/9ed95e48b9bd90f61373f7ad186f32690691bad4/dist/vendor/charts/chartjs)
- 保留 Chart.js 与内含颜色库的许可文本。图表只接收本系统后台按权限聚合的数据，不使用 Nova 静态演示的数据。

更新时整体替换脚本与许可文本，核对版本，并复查后台首页的图表、数据表与无脚本降级。

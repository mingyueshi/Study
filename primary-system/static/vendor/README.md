# 学习交互资源

固定版本随 primary-system 发布，不需要 npm、构建步骤或运行时外网。

| 目录 | 版本 | 上游发布包 | 许可 |
| --- | --- | --- | --- |
| hanzi-writer | 3.7.3 | https://registry.npmjs.org/hanzi-writer/-/hanzi-writer-3.7.3.tgz | MIT，见目录中的 LICENSE |
| canvas-confetti | 1.9.4 | https://registry.npmjs.org/canvas-confetti/-/canvas-confetti-1.9.4.tgz | ISC，见目录中的 LICENSE |
| tabler-icons | 3.49.0 | [Tabler Icons 源码](https://github.com/tabler/tabler-icons/tree/v3.49.0) | MIT，见目录中的 LICENSE |

原始发行文件 SHA-256：

- `hanzi-writer/hanzi-writer.min.js`：`17b11a1e025b780cb518d49b30faacc770dfa7fbc387aa3876e3e5c1bd31e642`
- `canvas-confetti/confetti.browser.js`：`49f4bcbc56e7ceb5c3d25d13db1d0da965b6cd1c8a54a707bb055be0685b0a95`
- `tabler-icons/arrow-bar-to-up.svg`：`e5ffc15dc5d9f9842fa5aaed281dab4ec4b36ee3749607c61f471c439a9d8a1e`
- `tabler-icons/arrow-badge-up.svg`：`472342399c92214e01c1c53abd3927bf881da41937b90f9c734404e2e015cc1e`
- `tabler-icons/arrow-badge-down.svg`：`682fe0e1cef472e252b8c83e226434b6b40d18ea78c766845eb5e19271922c0c`

Hanzi Writer 只在笔顺页加载，charDataLoader 接收现有 HanziAsset 的 strokes／medians，不使用默认 CDN，也不另存字库。原笔顺数据沿用 Make Me a Hanzi 的来源、版本及字形差异说明。

confetti 由统一动效控制首次庆祝时加载；失败不影响答题和描红结果。升级时整体替换对应发行文件和许可，更新版本、摘要并运行相关前端及浏览器验证。

Tabler Icons 仅收录右侧滚动控件使用的三枚 `icons/outline/` 原始 SVG。前台通过 CSS 遮罩按当前主题着色。

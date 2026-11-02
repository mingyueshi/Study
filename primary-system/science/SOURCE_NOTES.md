# 化学元素来源说明（当前范围）

南非CAPS教材已于2026-11-02按用户要求退役。science应用当前只拥有Element模型和元素查询；无教材、题干、答案、教师权限或图像入口。历史实施和验收见[原实施报告](../docs/reference-library-implementation.md)，退役范围见[退役报告](../docs/reference-library-removal-implementation.md)。

保留119条完整原始元素记录，前台只显示原子序数1—118。原始JSON、未知值、密度原单位与转换值分别保留；氢为0.08988g/L＝0.00008988g/cm³。来源的预测值和含混熔点字段保持标注。

导入仅需六包中02a的元素原始JSON及有效118条投影，不需要教材分包或EPUB。元素就绪状态独立检查periodic-elements；预演和锁后正式导入均核对版本、摘要、计数及119行全部字段。相同版本返回unchanged，不更新现有字段；缺行、孤立记录或来源漂移会拒绝。网页运行只依赖数据库，不读取原输入包或output。

Chinese names: the Chinese Chemical Society's own [Chinese periodic table](https://www.chemsoc.org.cn/library/a2611.html), [release explanation](https://www.chemsoc.org.cn/international/news/a2613.html), visually verified 2026-11-02. Its 2019-01-23 PDF has SHA256 `c0afa086a67e91c1283a780288847718b8acc2a35cc13c6f6edcfceb4173e4a2`, 653327 bytes. Rare glyph shapes at 104–118 were read visually and matched to Unicode characters through original packaged Unihan 17 `kTraditionalVariant`; Unihan also explicitly defines 鿏 as element 109 and 鿔 as element 112. The [official CNCTST announcement](https://www.cnctst.cn/news/mtsm/202308/t20230823_760185.html) corroborates 113/115/117/118. No PDF asset is needed at runtime. Character component hints and symbols help when a font lacks rare glyphs.

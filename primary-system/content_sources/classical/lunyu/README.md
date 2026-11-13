# 《论语》二十篇内容来源

原文底本为本机已收录的 `hanzhaodeng/chinese-ancient-text` 简体《论语》，来源路径 `poetry/simplified/儒家经典/论语.json`，文件 SHA256 为 `c80bfc203b34f6d6fd365a6f318f067a63a1cde185b10f6007ab90c36d636934`。沿用本机版本 `01a1183cd9bbc243bb156967043c32b6685c0d2f+native`，二十篇定位为 `/content/0` 至 `/content/19`。全文随 `lunyu-*.json` 保存，不需要资料库或网络才能读。

本底本共有 513 个分段。《乡党》分为 28 则；其他版本可能合并或拆开一些段落。本馆的「第几则」只表示本底本的阅读顺序，不冒充通行分章号。目录 `collections.parts` 固定各篇分段数与按顺序拼接的汉字序列指纹；标点统一用「」与『』，原文汉字保持底本。

译注参考采用 [ieduer/lunyu 的 data/dialogues.json](https://github.com/ieduer/lunyu/blob/44f039ef8174b219b5f773a156b3d954ee65be25/data/dialogues.json)，固定提交 `44f039ef8174b219b5f773a156b3d954ee65be25`，下载文件 SHA256 为 `8c9ebc18d6c6f0c156cad89aaab89f6a413cab0f9b2fa2fa7b65ac2b0d4400b1`。上游资料收录《论语译注》的译文和注释；上游仓库声明 MIT 许可，[许可原件](https://github.com/ieduer/lunyu/blob/44f039ef8174b219b5f773a156b3d954ee65be25/LICENSE)的本地副本为 [LICENSE.txt](LICENSE.txt)。每篇 `edition` 保留版本及来源，普通章句的 `translation_entry` 保留上游条目 ID。

整理时不照搬上游的 541 条显示清单：

- 排除 `displayAliasOf` 的重复条目，依据本机原文逐则匹配。
- 上游《乡党》一则合并了本馆第 25、26 则；译文拆分后分别对应礼节与菜肴、雷风两个场景，避免两则重复放整段译文。
- 上游《颜渊》第二十则原文中途截断，译文完整；本馆使用本机底本的完整原文。
- 去除注号、排版空白和较长的版本争论，词义保留简短释义；补写原资料未注词语的释义、阅读提示与说话人明确时的指代线索。古代礼制、身份分等和性别偏见另给背景说明，提醒按今天的平等尊重来思考。
- 六则教学正文通过 `reuse` 引用内部保留的 `lunyu.json`，不再提供独立六则页面。它们在全书中分别是学而第 1、4 则，为政第 15、17 则，述而第 22 则，卫灵公第 24 则。旧入口与章句链接由 `catalog.retired_articles` 和复用关系跳转到全书；源文件保留用于维护这些解读，不计入公开规模。

各篇正文、译文、词义、停顿、背诵提示与三道篇后练习，最终维护在上一级的 `lunyu-*.json`。每篇两道选择、一题讲述自查；并非每则都配置了单独题目。修改后运行 `node content_sources/test/test-classical.js` 与 `.venv/bin/python manage.py test classical`。内容不在运行时自动抓取、翻译或联网补全。

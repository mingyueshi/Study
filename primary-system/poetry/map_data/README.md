# 诗词地图数据维护说明

`places.json` 是诗词地图的编排数据：地点、诗文链接与教学标注。**只读专题**——
没有模型、没有学习记录；诗篇运行时按「题名 + 作者（必要时首句）」定位词库的
simplified 层语料，定位不到的如实降级显示，不猜、不换来源。

## 结构

- `schema_version`：当前 `1`；改结构必须升版本并同步 `poetry/test_map.py`。
- `source_code`：固定 `primary-poetry-map`。
- `places[]`：`{id, name, kind, city, province, lat, lng, emoji, blurb}`，坐标为
  WGS84 十进制度（中国域内 15–55°N、70–140°E，校验在 `poetry/map.py::validate`）。
- `links[]`：`{place_id, title, author, first_line?, note, featured}`——
  `title/author` 必须能在语料命中；组诗或重名必须给 `first_line` 消歧（用语料
  实际段落里的字句，不要凭记忆）；**每个地点恰一首 `featured` 代表诗**（测试锁住）。

## 地图底图

`static/poetry/china-map.svg` 由 [scripts/build_china_map_svg.py](../../scripts/build_china_map_svg.py)
从阿里 DataV.GeoAtlas 公开轮廓（`100000_full.json`，含省级边界与九段线，获取于
2026-11-04）经 Albers 等积圆锥投影（中央经线 105°E，标准纬线 25°/47°N）生成；
投影参数在 `map_projection.json`，运行时标记点用同一公式换算（`poetry/map.py`）。
重新生成底图必须连同 `map_projection.json` 一起提交。

## 修改流程

1. 改 `places.json` 前先在语料里核对题名/作者/首句（`manage.py shell` 查
   `PoetryText` simplified 层）；语料没有的诗不要上图。
2. `manage.py test poetry.test_map`：契约 + 解析 + 页面全过。
3. 打开 `/poetry/map/` 目检新地点的标记位置与诗卡。

## 已知语料边界

以下小学常见诗暂不在语料收录范围（千家诗选本差异），2026-11-05 核对时确认：
题西林壁、晓出净慈寺送林子方、泊船瓜洲、夏日绝句、游山西村、钱塘湖春行、
六月二十七日望湖楼醉书、敕勒歌、自题金山画像、咏华山。语料扩容后再上图。

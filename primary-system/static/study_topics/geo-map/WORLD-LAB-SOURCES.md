# 地球仪主题图层的资料与口径

## 城市人口

[联合国人口司 · World Urbanization Prospects 2025](https://population.un.org/wup/downloads/?tab=Cities)，File 21：`WUP2025-F21-DEGURBA-Cities_Pop.xlsx`，城市工作表的 2025 年中人口。原单位为千人，乘 1000 后取整；位置采用同表人口加权中心的经纬度，保留三位小数。选取 18 座城市作教学样本，覆盖亚洲、欧洲、非洲、南北美洲和大洋洲，不是完整排行榜。

原输入：[UN Excel](https://population.un.org/wup/assets/Download/Cities/WUP2025-F21-DEGURBA-Cities_Pop.xlsx)，SHA-256：`3a96030d87aec6c1c50f658d5321067d6345e1ab936c5d2854524f972caa75c0`。采用连续高密度城区的 Degree of Urbanization 口径，不应与行政市人口混用。圆点的屏幕面积与人数成正比，半径为 `26 × sqrt(人口 / 42000000)` 像素，大小不随球面投影变形；它不表示密度或真实城区范围。显示人数按万取约数。

## 板块与古陆

板块轮廓采用 [Bird（2003）PB2002](https://github.com/fraxen/tectonicplates) 的 `GeoJSON/PB2002_plates.json`，输入 SHA-256：`922918f970baf7e645821a4a728b945dbb5eeac1337d71d087fba021bcc79e21`。用 Shapely 2.1.2 的 `simplify(0.32, preserve_topology=True)` 简化。六个教学分组分别使用 EU，AF＋SO，NA＋SA，IN＋AU，PA，AN；小板块留白。保留原 GeoJSON 在日期线处切开的多边形，各环按原经纬坐标投影。相同教学分组的模型内部边界也可能保留，边界不能用来精确定位地震或测量板块移动。

「约 2 亿年前」是作者绘制的联合古陆粗略拼图，参考 [USGS · Before the break-up of Pangaea](https://pubs.usgs.gov/gip/dynamic/Pangaea.html)，仅表达大陆曾相邻、后来分离的概念，不是地质模型反演，也不是精确古海岸或古经纬度。切换时收起现代国界、城市、档案、航线、现代起伏和夜间灯光；返回现代图后恢复原设置。

## 季风、台风与降水

季风是根据 [NOAA · Monsoon Information](https://www.weather.gov/twc/Monsooninfo) 的季节风向概念绘制的亚洲近地面方向示意：南亚夏季大致从西南吹向东北，冬季相反；东亚冬夏箭头也只表达主要方向。路径不表示风速、具体日期或高空急流。台风路径由作者虚构，展示西北太平洋台风可能先偏西、再转向的情形；弯线不是实时预报，也不是某次历史台风记录。

年降水来自 [NASA · IMERG Precipitation Climatology](https://gpm.nasa.gov/data/imerg/precipitation-climatology)，V07B Final Run，2000 年 6 月—2023 年 5 月的多年平均年降水量。原输入：[GeoTIFF ZIP](https://gpm.nasa.gov/sites/default/files/data/climatologies/2024/IMERG-Final.CLIM.200006-202305.V07B.tif.zip)，内部 TIFF 的 SHA-256：`3ead45ac5d59aefa8d0d038d6aaee55514a9038dc3eaa477ce090df15979700b`。原图为 3600×1800、北上南下、0.1°分辨率、毫米／年；以每 50×50 像元合为 5°方格，排除负值与非有限值，有效像元不足一半则记作缺测，否则对有效像元取算术均值并四舍五入到整毫米，得到 72×36 格。该平均用于低分辨率教学显示，没有用于面积或水量统计。

图例阈值为 250、500、1000、2000、3000 毫米／年。湿润和干燥色块表示多年平均气候分布，不代表今天、某个月或某次台风的降水。

## 星空与天球

星空背景为固定种子的 360 个装饰光点，只绘制一次，不冒充星表。四个星座采用主要亮星赤经、赤纬附近的概化坐标连线，赤经角度映射为示意天球的经向角。连线帮助认形，未画星座边界；概念参照 [IAU · The Constellations](https://iauarchive.eso.org/public/themes/constellations/)。天赤道与地球赤道同面，黄道相对它倾斜约 23.44°。天球半径压缩为地球的 1.55 倍，没有根据当前日期、地点和时刻旋转，不表示实际可见天空。通过原「天文探索」入口继续学习。

## 保存、计时与设备

自定义旅行使用 `study_world_trips_v1`，保存名字与 2—20 个坐标站点，最多 8 趟。载入时重新校验并重新计算球面短弧里程，旧数据或手改数据中的额外字段不参与渲染。存储失败会说明只能保留本页。

计时仅在主动开始后记录，本轮只统计前 5 个任务中自己找到的稳定 ID，旧完成记录不直接计入本轮。切换玩法、后台或离开页面时暂停，手动继续后累计；查看本轮任务答案后转为练习，重新开始才恢复计时。

倾斜控制仅由按钮请求 [DeviceOrientationEvent 权限](https://www.w3.org/TR/orientation-event/)，以首次有效姿态校准，适配横竖屏并限制角度。后台、离屏、手动转动、换玩法、换方向及显示中断时关闭，不自动恢复。HTTPS 或浏览器认可的安全来源才可用；局域网 HTTP 下保留手动操作并说明连接要求。桌面通过模拟事件验证，尚不能代替真机手感验证。

## 发布与渲染

`world-3d-pack.json` 是有序输入清单。既有 `make study-topics-data` 自动生成源目录与静态目录中的 `world-3d-pack.js`，并为生成模板附内容指纹；`--check` 同时检查源目录中的合并文件是否过期。合并文件随项目保存，离线打开页面不需要 Node、打包器或联网，不增加额外发布命令。独立脚本仍供维护和单元测试使用。

地球仪专题脚本请求由 27 个降为 3 个（世界几何、Three.js、合并脚本），没有减少全部代码字节或把请求数变化换算为固定提速比例。地表纹理以配色、选中、经纬网、冰盖、重要线和专题图层为内容键，仅内容改变时重画；镜头旋转、缩放、自转、太阳推进和船只移动沿用旧纹理。帧率仍取决于设备和浏览器。

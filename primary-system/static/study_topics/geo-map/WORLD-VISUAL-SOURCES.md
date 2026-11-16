# 地球仪视觉素材

所有素材均随地理图谱发布，页面运行时不访问外网。

- 地形：GMT 提供的 [Scripps SRTM15+ v2.7 半度网格](https://www.generic-mapping-tools.org/remote-datasets/earth-relief.html)，原文件为 `earth_relief_30m_g.grd`，721 × 361 个格点，含陆地与海底。该分辨率经过约 157 千米滤波，不能用来读取峰顶高度或海沟最深处。源文件 SHA-256 为 `62e38aa0008c00d7adbc9fe4bd9816761fad278da209095e417c177a05c43043`。
- 编码：`assets/world-relief.png` 为北向上的灰度图，0—255 对应 −11000—9000 米，每级约 78 米。采样采用双线性插值，东西经接缝共用格点。显示起伏按高度压缩并夸大，上下均不超过半径的 2％；海底未加遮挡地形的海平面外壳。极点与接缝法线作连续处理。关闭起伏后恢复单位球，坐标、测距与昼长始终沿用理想球面计算。
- 夜间灯光：根据 `world-3d-visual-data.js` 中的 61 个代表城市位置生成固定的 Canvas 灯光纹理，并用现有大陆轮廓裁剪；不是卫星数据、亮度排名或实时灯光图。参考 [NASA 夜间灯光地图](https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/)。只在昼夜模式显示，太阳落到地平线下后逐渐亮起。
- 冰盖：南极沿用现有完整大陆轮廓，格陵兰在原国土轮廓内使用简化内陆多边形，以冰蓝到白色渐变表示；不表示精确冰缘、全部永久积雪或季节性海冰。
- 大气与晨昏：边缘光采用观察角度渐变，晨昏采用太阳高度的连续过渡，均为观察示意。参照 [NASA 晨昏观察](https://www.nasa.gov/image-article/earth-twilight/)，不据此推算日出日落时刻。太阳球与直射点位于同一朝外方向，大小、距离与大气厚度不按真实比例。
- 自转：默认暂停，主动播放时约 120 秒一圈，镜头相对地球从东向西转，展示地球从西向东自转。昼夜模式同步推进 UTC，镜头与光照方向以相同角速度改变，使太阳在观察画面中保持方向。原「播放一天」仍为约 24 秒一圈，两种播放互斥。手动操作、换玩法、减少动态、离屏、后台和离页均暂停，回来后不自动恢复。

更新高程素材时，先下载并核对源文件，再运行转换脚本。Python 依赖只用于生成，不属于学习页面运行依赖：

```sh
curl -fL https://oceania.generic-mapping-tools.org/server/earth/earth_relief/earth_relief_30m_g.grd -o /tmp/earth_relief_30m_g.grd
uv run --with netCDF4 --with pillow python scripts/build-world-relief.py /tmp/earth_relief_30m_g.grd
```

脚本在 `content_sources/geo-map/` 下运行。更新后同步 `world-3d-visual-data.js` 中的图像指纹，并运行源数据测试、`make study-topics-data`、`make test-frontend` 与 `manage.py test catalog.test_study_topics`。

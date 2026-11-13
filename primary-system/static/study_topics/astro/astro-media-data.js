/* 外部原始资料整理为中文观察任务；本地媒体随专题发布。 */
'use strict';
const ASTRO_MEDIA = {
  "chapters": [
    {
      "id": "solar",
      "title": "太阳系：我们的宇宙小院",
      "unit": "au1",
      "scale": "地球到太阳约 1.5 亿千米，阳光走来约需 8 分钟。",
      "intro": "太阳像院子里的大灯，八颗行星各走各的轨道。先认顺序，再比较大小和距离，你会发现太空中最常见的其实是空旷。",
      "question": "为什么一张图里，常常无法同时看清行星大小和行星间的距离？",
      "answer": "行星之间隔得太远了。若按真实距离画满一张纸，许多行星会小得看不清。因此，要分开看大小比例图和距离比例图。",
      "watch": "沿着轨道找地球，再找外侧的木星和土星。动画压缩了距离，也放大了行星，不能拿画面上的间隔当真实距离。",
      "credit": "NASA 戈达德太空飞行中心概念影像实验室",
      "images": [
        {
          "id": "solar-orbits",
          "src": "images/astro/roam-solar.jpg",
          "title": "从轨道认识太阳系",
          "caption": "行星沿各自轨道绕太阳运行。轨道间距与天体大小经过调整，这是一幅帮助认位置的示意画面。",
          "kind": "艺术示意图",
          "credit": "NASA 戈达德太空飞行中心概念影像实验室",
          "source": "https://svs.gsfc.nasa.gov/20249/",
          "original": "https://svs.gsfc.nasa.gov/vis/a020000/a020200/a020249/SolarSys_fr00365_print.jpg"
        },
        {
          "id": "solar-worlds",
          "src": "images/astro/roam-planets.jpg",
          "title": "太阳与八颗行星的不同面孔",
          "caption": "从左上到右下依次是太阳、水星、金星，地球、火星、木星，土星、天王星、海王星。图中圆面被排成相近大小，不能据此比较直径；表面影像来自不同探测任务，部分颜色经过处理。",
          "kind": "探测影像与可视化合成",
          "credit": "NASA 与各行星探测任务团队",
          "source": "https://svs.gsfc.nasa.gov/30710/",
          "original": "https://svs.gsfc.nasa.gov/vis/a030000/a030700/a030710/planets3x3_sun_colorMercury_axis_tilt_1080p.00001_print.jpg"
        }
      ],
      "movie": {
        "id": "solar-flight",
        "src": "images/astro/roam-solar.webm",
        "title": "飞过太阳系",
        "caption": "先看太阳，再看周围一圈圈轨道。这里展示太阳系的结构，不代表某一天的真实行星位置。",
        "kind": "概念动画",
        "credit": "NASA 戈达德太空飞行中心概念影像实验室",
        "source": "https://svs.gsfc.nasa.gov/20249/",
        "original": "https://svs.gsfc.nasa.gov/vis/a020000/a020200/a020249/SolarSystem_H264_1080p.webm",
        "poster": "images/astro/roam-solar.jpg"
      },
      "links": [
        {
          "title": "NASA 太阳系百科",
          "note": "认识太阳、行星、卫星和小天体，配有任务照片。英文。",
          "url": "https://science.nasa.gov/solar-system/"
        },
        {
          "title": "NASA Eyes：太阳系三维漫游",
          "note": "在三维场景里寻找行星和探测器。英文，需要联网加载。",
          "url": "https://eyes.nasa.gov/apps/solar-system/"
        }
      ]
    },
    {
      "id": "galaxy",
      "title": "银河系：太阳的星城",
      "unit": "au5",
      "scale": "银河系的恒星圆盘直径约 10 万光年，太阳距中心约 2.6 万光年。",
      "intro": "离开太阳系，把视野拉远：太阳也只是银河系里的一颗恒星。我们住在这座巨大星城里面，夜空中的银河光带就是从城内向外望去的景象。",
      "question": "既然我们住在银河系里面，为什么还能看到银河系的俯视图？",
      "answer": "科学家把恒星、气体等观测线索拼在一起，画出银河系的结构模型。我们还没有飞到银河系外给它拍一张全家福，所以俯视图属于示意图。",
      "watch": "先看正面的旋臂，再看倾斜后的薄圆盘和中央较厚的区域。镜头转动是在帮助观察结构，不是银河系在几十秒内真的转了一圈。",
      "credit": "NASA 戈达德太空飞行中心概念影像实验室",
      "images": [
        {
          "id": "galaxy-map",
          "src": "images/astro/roam-galaxy.jpg",
          "title": "在银河系里找到太阳",
          "caption": "图中的太阳位置在圆盘内、离中心很远的地方。旋臂、中央区域和太阳位置来自观测约束下的结构示意，并不是从银河系外拍摄的照片。",
          "kind": "结构示意图",
          "credit": "NASA、JPL-Caltech、R. Hurt（SSC／Caltech）",
          "source": "https://science.nasa.gov/asset/webb/milky-way-and-our-location/",
          "original": "https://assets.science.nasa.gov/content/dam/science/missions/webb/outreach/migrated/2017/STScI-01H8PJ6083PCF4KJ1AYKVVRX8Q.png/jcr:content/renditions/2000x2000.jpg"
        },
        {
          "id": "galaxy-helio",
          "src": "images/astro/roam-helio.jpg",
          "title": "日球层：太阳风吹出的泡泡",
          "caption": "太阳不断吹出带电粒子，在周围形成日球层，并与星际环境相遇。图中的颜色、边界和形状用于解释结构，不是肉眼看见的透明外壳，也没有按真实比例绘制。",
          "kind": "概念示意图",
          "credit": "NASA 戈达德太空飞行中心概念影像实验室",
          "source": "https://svs.gsfc.nasa.gov/20406/",
          "original": "https://svs.gsfc.nasa.gov/vis/a020000/a020400/a020406/Helio_18x24_Print_nolabels_print.jpg"
        }
      ],
      "movie": {
        "id": "galaxy-flight",
        "src": "images/astro/roam-galaxy.webm",
        "title": "换个角度看银河系",
        "caption": "从不同角度观察银河系模型：它有旋臂，也有扁平的圆盘。画面里的亮点不能一一对应真实恒星。",
        "kind": "概念动画",
        "credit": "NASA 戈达德太空飞行中心概念影像实验室",
        "source": "https://svs.gsfc.nasa.gov/20406/",
        "original": "https://svs.gsfc.nasa.gov/vis/a020000/a020400/a020406/MilkyWayZoom_30fps_proRes_wStars.webm",
        "poster": "images/astro/roam-galaxy-poster.jpg"
      },
      "links": [
        {
          "title": "NASA：星系是什么",
          "note": "从旋涡星系、椭圆星系认识宇宙中的星城。英文。",
          "url": "https://science.nasa.gov/universe/galaxies/"
        },
        {
          "title": "ESA：银河系的俯视图",
          "note": "对照旋臂、银心和太阳位置，读一读图是怎样画出来的。英文。",
          "url": "https://www.esa.int/ESA_Multimedia/Images/2023/12/Top-down_view_of_the_Milky_Way_annotated"
        }
      ]
    },
    {
      "id": "deep",
      "title": "深空：星城之外，还有星城",
      "unit": "au5",
      "scale": "光年是距离单位。看见远方星系，也是在看它过去的样子。",
      "intro": "把望远镜对准一小块看似空空的天空，长时间收集微弱的光，就能看到许多遥远星系。太阳系属于银河系，银河系只是宇宙中众多星系之一。",
      "question": "深空照片里，每一个亮点都是一颗恒星吗？",
      "answer": "不是。许多小光斑是一整个星系，里面可能有大量恒星；也会混入银河系里的前景恒星。要结合形状和观测资料判断，不能只凭亮暗猜远近。",
      "watch": "留意前后分布的星系。动画依据哈勃深空影像和距离估计搭建三维模型，压缩了深度；这是虚拟飞行，不是飞船实拍，也不是按真实速度前进。",
      "credit": "NASA、ESA、F. Summers、Z. Levay、L. Frattare、B. Mobasher、A. Koekemoer 与 HUDF 团队（STScI）",
      "images": [
        {
          "id": "deep-webb",
          "src": "images/astro/roam-webb.jpg",
          "title": "韦布首张深空场：一小片天，许多星系",
          "caption": "这是星系团 SMACS 0723 方向的近红外观测合成图。弯弯的细长光弧与引力透镜有关；颜色把不同波段的信息变成我们可见的画面。",
          "kind": "近红外观测合成图",
          "credit": "NASA、ESA、CSA、STScI",
          "source": "https://science.nasa.gov/asset/webb/webbs-first-deep-field-unveiled-nircam-image/",
          "original": "https://assets.science.nasa.gov/content/dam/science/missions/webb/science/2022/07/STScI-01G8H15R2PGEXQD7TYYBFJ3FT4.png/jcr:content/renditions/1960x2000.png"
        },
        {
          "id": "deep-hubble",
          "src": "images/astro/roam-hubble.jpg",
          "title": "哈勃超深空场：耐心收集星光",
          "caption": "在一小块天区里，哈勃累积多次曝光，看见大量形状不同的遥远星系。它与韦布首张深空场不是同一块天空，不能当作同一地点的前后对比。",
          "kind": "观测合成图",
          "credit": "NASA、ESA 与 HUDF 团队",
          "source": "https://svs.gsfc.nasa.gov/30687/",
          "original": "https://svs.gsfc.nasa.gov/vis/a030000/a030900/a030946/hudf-hst-6200x6200_print.jpg"
        }
      ],
      "movie": {
        "id": "deep-flight",
        "src": "images/astro/roam-deep.webm",
        "title": "飞入哈勃超深空场",
        "caption": "把平面照片里的星系放回估计的远近位置，看看星系如何分布在纵深中。模型中的距离已经压缩。",
        "kind": "观测数据三维可视化",
        "credit": "NASA、ESA、F. Summers、Z. Levay、L. Frattare、B. Mobasher、A. Koekemoer 与 HUDF 团队（STScI）",
        "source": "https://svs.gsfc.nasa.gov/30687/",
        "original": "https://svs.gsfc.nasa.gov/vis/a030000/a030600/a030687/hudf-b-1920x1080p30.webm",
        "poster": "images/astro/roam-deep-poster.jpg"
      },
      "links": [
        {
          "title": "NASA：韦布深空图原始解读",
          "note": "放大寻找光弧与不同形状的星系，并阅读观测说明。英文。",
          "url": "https://science.nasa.gov/asset/webb/webbs-first-deep-field-unveiled-nircam-image/"
        },
        {
          "title": "NASA：宇宙的历史",
          "note": "从早期宇宙到今天，沿时间线认识宇宙。英文。",
          "url": "https://science.nasa.gov/universe/overview/"
        }
      ]
    }
  ],
  "planets": [
    {
      "name": "水星",
      "au": 0.39,
      "period": 0.241,
      "diameter": 4879,
      "color": "#b0aaa0",
      "fact": "离太阳最近，表面有许多撞击坑。"
    },
    {
      "name": "金星",
      "au": 0.72,
      "period": 0.615,
      "diameter": 12104,
      "color": "#e5b66f",
      "fact": "厚厚的大气层让它表面非常炎热。"
    },
    {
      "name": "地球",
      "au": 1,
      "period": 1,
      "diameter": 12742,
      "color": "#51a9e5",
      "fact": "我们的家，表面有大片液态水。"
    },
    {
      "name": "火星",
      "au": 1.52,
      "period": 1.881,
      "diameter": 6779,
      "color": "#df795b",
      "fact": "铁氧化物让表面显出红色。"
    },
    {
      "name": "木星",
      "au": 5.2,
      "period": 11.86,
      "diameter": 139820,
      "color": "#d9b18b",
      "fact": "太阳系最大的行星，拥有醒目的云带。"
    },
    {
      "name": "土星",
      "au": 9.58,
      "period": 29.46,
      "diameter": 116460,
      "color": "#e5cc8e",
      "fact": "宽阔的光环主要由冰粒和碎块组成。"
    },
    {
      "name": "天王星",
      "au": 19.2,
      "period": 84.01,
      "diameter": 50724,
      "color": "#8cd6db",
      "fact": "自转轴倾斜很大，像躺着转。"
    },
    {
      "name": "海王星",
      "au": 30.05,
      "period": 164.8,
      "diameter": 49244,
      "color": "#6c8fe3",
      "fact": "离太阳最远的八大行星，公转一圈约需 165 年。"
    }
  ],
  "planetSource": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/",
  "checked": "2026-11-13",
  "modelNotes": {
    "orbits": "公转示意：轨道间距被压缩、行星被放大；周期比例按数据计算。圆轨道简化了真实的椭圆轨道，起始位置是任意排布。地球在动画中约 12 秒转一圈。",
    "distance": "距离比例：横向位置按平均日距绘制，太阳到海王星约 30 份日地距离。圆点大小和上下错开的标签不表示真实尺寸与轨道位置。",
    "size": "大小比例：八颗行星的圆面直径按同一比例绘制，单位是千米。太阳直径约是木星的 10 倍，这里没有画进来；位置与间距仅用于排版。"
  }
};
if (typeof module !== 'undefined') module.exports = ASTRO_MEDIA;

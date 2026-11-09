/* 地点 ID 来自 GMAtlas。图片路径相对于本目录，影片仅链接原站。 */
window.GM_MEDIA_GROUPS = [
  { id: 'rivers', name: '河流与海岸' },
  { id: 'mountains', name: '高原与雪山' },
  { id: 'neighbors', name: '草原与岛屿' }
];

window.GM_MEDIA = [
  {
    id: 'qutang', group: 'rivers', kind: 'photo', places: ['f20', 'p500000'],
    title: '长江穿过瞿塘峡',
    caption: '重庆奉节，2016 年 10 月。从上游望去，江水夹在两侧的山壁之间。',
    observe: '找找船在哪里。用船当尺子，想象两边的山壁有多高。',
    images: [{ src: 'assets/qutang.jpg', alt: '瞿塘峡的两侧山壁夹着长江，江面上能看到船只' }],
    source: 'https://commons.wikimedia.org/wiki/File:Qutang_Gorge_2016.jpg',
    credit: 'Fredlyfish4 · Wikimedia Commons · CC BY-SA 4.0',
    license: 'https://creativecommons.org/licenses/by-sa/4.0/'
  },
  {
    id: 'three-gorges', group: 'rivers', kind: 'orbit', places: ['f20', 'p420000'],
    title: '从太空找三峡大坝',
    caption: '上图拍于 2006 年 11 月 7 日，大坝在右下角。下图拍于 1987 年 4 月 17 日，当时大坝还没有开工。',
    observe: '在两张图上找同一个河湾。哪一张图里，水伸进支流的地方更多？',
    images: [{ src: 'assets/three-gorges.jpg', alt: '两张上下排列的卫星影像对照三峡大坝开工前后，上方较晚的影像中江面更宽' }],
    source: 'https://science.nasa.gov/earth/earth-observatory/three-gorges-dam-china-7769/',
    credit: 'Jesse Allen · NASA Earth Observatory · Landsat'
  },
  {
    id: 'yangtze-mouth', group: 'rivers', kind: 'orbit', places: ['f27', 'f20', 'p310000'],
    title: '长江把泥沙带进东海',
    caption: '2024 年 2 月 12 日，卫星拍到长江口附近的泥沙向海上铺开。',
    observe: '沿着浅棕色的水往外找。它与更远处的深色海水在哪里相遇？',
    images: [{ src: 'assets/yangtze-mouth.jpg', alt: '长江口外的海面上，浅色泥沙向较深色的海水铺开' }],
    source: 'https://science.nasa.gov/earth/earth-observatory/sediment-fans-out-over-the-yangtze-bank-152478/',
    credit: 'Wanmei Liang · NASA Earth Observatory · VIIRS'
  },
  {
    id: 'nile-day', group: 'rivers', kind: 'orbit', places: ['wf2', 'Egypt'],
    title: '白天的尼罗河三角洲',
    caption: '2006 年 1 月 23 日，即使海上有沙尘，尼罗河入海前铺开的绿色三角形仍然看得见。',
    observe: '从绿色三角形往南找，哪一条窄窄的绿色带连着它？',
    images: [{ src: 'assets/nile-day.jpg', alt: '埃及北部的卫星影像，绿色三角洲夹在浅褐色沙漠与地中海之间' }],
    source: 'https://science.nasa.gov/earth/earth-observatory/dust-storm-off-egypt-15976/',
    credit: 'Jesse Allen · NASA Earth Observatory · MODIS'
  },
  {
    id: 'nile-night', group: 'rivers', kind: 'orbit', places: ['wf2', 'Egypt'],
    title: '夜里的尼罗河三角洲',
    caption: '2010 年 10 月 28 日，国际空间站拍下沿河与三角洲的城镇灯光。可以和白天的影像找相同轮廓。',
    observe: '看看灯光在河边排成什么形状。白天那片绿色三角形，在夜里对应哪里？',
    images: [{ src: 'assets/nile-night.jpg', alt: '夜间俯瞰埃及，灯光沿着尼罗河向三角洲散开' }],
    source: 'https://science.nasa.gov/earth/earth-observatory/nile-river-delta-at-night-46820/',
    credit: 'NASA Johnson Space Center · 国际空间站第 25 远征队'
  },
  {
    id: 'qutang-film', group: 'rivers', kind: 'video', places: ['f20', 'p500000'],
    title: '跟着镜头走进夔门',
    caption: '央视《地理中国》节目《夔门探秘（下）》，从长江水面和山壁两侧观察瞿塘峡。',
    observe: '看船驶入峡谷时，两岸的山壁和前面的江面分别是什么样子？',
    source: 'https://tv.cctv.com/2017/08/12/VIDEx7pgajGCXwGeFtoO0sWe170812.shtml',
    credit: '央视网 · 2017 年 8 月 12 日'
  },
  {
    id: 'plateau-lakes', group: 'mountains', kind: 'orbit', places: ['f9', 'wf5'],
    title: '青藏高原的湖泊，相隔 30 年',
    caption: '两张图拍的是高原北部同一片地区。看湖岸的位置，可以发现有些湖泊变大了。',
    observe: '在两张图里找同一个湖。先认出它旁边的山，再看看湖的哪一侧变化更明显。',
    images: [
      { src: 'assets/plateau-1994.jpg', alt: '1994 年高原湖群影像，蓝色湖面散布在山地之间', label: '1994 年 8 月 1 日' },
      { src: 'assets/plateau-2024.jpg', alt: '2024 年同一区域的影像，部分蓝色湖泊比旧图更宽', label: '2024 年 8 月 11 日' }
    ],
    source: 'https://science.nasa.gov/earth/earth-observatory/a-proliferation-of-lakes-on-the-tibetan-plateau-154011/',
    credit: 'Michala Garrison · NASA Earth Observatory · Landsat 5 与 Landsat 9'
  },
  {
    id: 'himalayas-orbit', group: 'mountains', kind: 'orbit', places: ['f1', 'wf1'],
    title: '宇航员眼里的喜马拉雅',
    caption: '2017 年 12 月 11 日，国际空间站从斜上方拍下珠峰一带。山峰和山谷在照片里有深有浅。',
    observe: '先顺着一条雪白的山脊看，再找它两侧较暗的山谷。你能看出不止一座山峰吗？',
    images: [{ src: 'assets/himalayas-orbit.jpg', alt: '从国际空间站斜看喜马拉雅山脉，雪白山脊与深色山谷交错' }],
    source: 'https://science.nasa.gov/earth/earth-observatory/an-astronauts-view-of-the-himalayas-144355/',
    credit: 'NASA Johnson Space Center · 国际空间站第 53 远征队'
  },
  {
    id: 'everest', group: 'mountains', kind: 'photo', places: ['wf1', 'f1', 'p540000'],
    title: '从地面仰望珠穆朗玛峰',
    caption: '2006 年，从通往珠峰大本营的路上拍摄，照片面对珠峰北坡。',
    observe: '对照宇航员的照片。哪张更容易看出峰顶的轮廓？哪张更容易看到一整条山脉？',
    images: [{ src: 'assets/everest.jpg', alt: '在通往大本营的路上仰望，白雪覆盖的珠峰北坡高耸在山谷后方' }],
    source: 'https://commons.wikimedia.org/wiki/File:Everest_North_Face_toward_Base_Camp_Tibet_Luca_Galuzzi_2006.jpg',
    credit: 'Luca Galuzzi · Wikimedia Commons · CC BY-SA 2.5',
    license: 'https://creativecommons.org/licenses/by-sa/2.5/'
  },
  {
    id: 'plateau-film', group: 'mountains', kind: 'video', places: ['f9', 'wf5'],
    title: '冰川融水去了哪里',
    caption: '央视《地理·中国》跟着冰川融水，来到青藏高原的普莫雍错。',
    observe: '在镜头里找一找冰、流动的水和湖。按水走过的先后顺序说一遍。',
    source: 'https://tv.cctv.com/2025/02/26/VIDEmXAoG8J2ij0SEL3OEItY250226.shtml',
    credit: '央视网 · 2025 年 2 月 26 日'
  },
  {
    id: 'everest-film', group: 'mountains', kind: 'video', places: ['wf1', 'f1'],
    title: '跟科考队走过珠峰冰塔林',
    caption: '央视纪录片《再登地球之巅》第一集，跟拍队员从珠峰大本营前往绒布冰川。',
    observe: '从空中看冰塔林，它和山脊上的雪有什么不同？',
    source: 'https://tv.cctv.com/2023/12/30/VIDEoFAuMpdEPDFkZEIigpia231230.shtml',
    credit: '央视网 · 2023 年 12 月 30 日'
  },
  {
    id: 'mongolia-steppe', group: 'neighbors', kind: 'photo', places: ['n2', 'Mongolia'],
    title: '蒙古中部的草原',
    caption: '2002 年 8 月，在蒙古哈拉和林附近拍摄。这是蒙古中部草原的一处景色。',
    observe: '试着从画面最近的草地一路看到地平线。哪里开阔，哪里能看出高低起伏？',
    images: [{ src: 'assets/mongolia-steppe.jpg', alt: '蒙古中部草原上有弯曲的小河，近处草地比远处更绿' }],
    source: 'https://commons.wikimedia.org/wiki/File:Mongolian_steppe.jpg',
    credit: 'Jyper · Wikimedia Commons · CC BY 3.0',
    license: 'https://creativecommons.org/licenses/by/3.0/'
  },
  {
    id: 'mongolia-orbit', group: 'neighbors', kind: 'orbit', places: ['n2', 'Mongolia'],
    title: '从高空看蒙古的南北',
    caption: '这张 MODIS 影像把蒙古与周围地区放进同一张图。南部大片浅红棕色的地方是戈壁。',
    observe: '先在世界地图找蒙古，再回来看这张影像。南部和北部的颜色有哪些不同？',
    images: [{ src: 'assets/mongolia-orbit.jpg', alt: '蒙古和邻近地区的卫星影像，南部可见浅棕色的戈壁' }],
    source: 'https://science.nasa.gov/earth/earth-observatory/mongolia-1559/',
    credit: 'NASA Earth Observatory · MODIS 科学团队'
  },
  {
    id: 'fuji-lake', group: 'neighbors', kind: 'photo', places: ['n16', 'Japan'],
    title: '从河口湖望向富士山',
    caption: '在日本本州岛的河口湖边，可以望见富士山的雪顶和向两边伸展的山坡。',
    observe: '用手沿着山的外轮廓比划一下。它的样子和照片里的珠峰有什么不同？',
    images: [{ src: 'assets/fuji-lake.jpg', alt: '从河口湖望去，富士山的两侧山坡从雪白峰顶缓缓展开' }],
    source: 'https://commons.wikimedia.org/wiki/File:Mount_Fuji_from_Lake_Kawaguchi.jpg',
    credit: 'Subramaniam K V · Wikimedia Commons · CC BY 3.0',
    license: 'https://creativecommons.org/licenses/by/3.0/'
  },
  {
    id: 'fuji-orbit', group: 'neighbors', kind: 'orbit', places: ['n16', 'Japan'],
    title: '从太空斜看富士山',
    caption: '2009 年 4 月 8 日，国际空间站拍到富士山东南坡。画面中央还能看到宝永火山口。',
    observe: '把这张照片和湖边的照片放在一起看。换一个角度后，你多看到了山坡上的什么？',
    images: [{ src: 'assets/fuji-orbit.jpg', alt: '从国际空间站斜看富士山，雪坡上可见一处凹下去的火山口' }],
    source: 'https://science.nasa.gov/earth/earth-observatory/mount-fuji-japan-39099/',
    credit: 'NASA Johnson Space Center · 国际空间站第 19 远征队'
  }
];

/* 复用科学原知识点的观察实验；数据与渲染分开维护。 */
'use strict';
const SCI_EXPERIMENTS = {
  sound: {
    title: '跟着振动找声音',
    prompt: '先看振动的物体，再看空气中的小点。切换到真空，比较振动能不能传到另一端。',
    media: [
      {id:'air', label:'有空气', note:'物体振动，让附近空气产生疏密变化，并向外传递。盯住橙色小点，它只在原位附近来回运动。'},
      {id:'vacuum', label:'真空', note:'图中的物体仍在振动，但两端之间没有空气等传声介质，声音无法通过这段真空传播。'},
    ],
    model:'小点只代表少量空气微粒，原位附近的左右运动被放大、放慢了，省略了微粒的无规则运动。微粒不会一路从声源跑到耳朵；这里不表示真实声速、尺寸或实验装置，也不模拟其他连接部件传声。',
    sources:[{title:'OpenStax：声音与纵波', url:'https://openstax.org/books/physics/pages/14-1-speed-of-sound-frequency-and-wavelength'}],
  },
  tone: {
    title:'把音调和响度分开看',
    prompt:'每次只改变一个条件：先固定幅度，调快慢；再固定快慢，调幅度。比较同一段时间里的振动次数和起伏大小。',
    frequency:{label:'振动快慢', min:1, max:4, initial:2},
    amplitude:{label:'振动幅度', min:1, max:3, initial:2},
    note:'改变快慢时，幅度保持不变；改变幅度时，振动次数保持不变。其他条件相近时，振动越快音调越高，振幅越大声音越响。',
    model:'图中横轴是示意时间，纵轴是一个振动点偏离中间位置的距离。曲线用来记录振动，不是空气微粒在空间中的行走路线。播放经过放慢，不代表实际可听频率；幅度档位也不是分贝或响度倍数。本图只观察变化，不播放声音。',
    sources:[
      {title:'OpenStax：声音的频率', url:'https://openstax.org/books/physics/pages/14-1-speed-of-sound-frequency-and-wavelength'},
      {title:'OpenStax：振幅与声音强弱', url:'https://openstax.org/books/physics/pages/14-2-sound-intensity-and-sound-level'},
    ],
  },
  machine: {
    title:'简单机械动手比',
    prompt:'改变一个条件，再播放或拖动操作进度。观察重物怎样移动，也比较用力和移动距离。',
    modes:[
      {id:'lever', label:'杠杆', note:'重物在左，手在右。把支点移近重物，手这一边的力臂变长，所需的力就变小；手也要移动更长的距离。'},
      {id:'pulley', label:'滑轮', note:'先选定滑轮，再选动滑轮。同样把重物升高，比较拉绳方向和绳端移动的距离。'},
      {id:'ramp', label:'斜面', note:'保持升高的高度相同，把坡拉长，坡就变缓。沿坡匀速推重物时，所需的力变小，经过的路程变长。'},
    ],
    pulleys:[
      {id:'fixed', label:'定滑轮', note:'轮轴固定，手向下拉绳，重物向上。理想情况下不省力，绳端移动距离与重物上升距离相等。'},
      {id:'moving', label:'动滑轮', note:'轮轴跟着重物上升，两段绳一起承重。这个装法向上拉绳，理想情况下用一半的力，绳端要移动两倍距离。'},
    ],
    fulcrum:{min:20, max:80, initial:30},
    run:{min:100, max:400, initial:200},
    rise:100,
    model:'按缓慢、匀速的理想情况比较，忽略摩擦、绳和机械自身的重量，绳不伸长，杠杆两端的力保持竖直。力与距离数值由几何关系计算；形状、转速与播放时间是示意，不是自由落体或真实器材测试。实际装置还会损耗能量。',
    sources:[{title:'OpenStax：简单机械与机械优势', url:'https://openstax.org/books/physics/pages/9-3-simple-machines'}],
  },
  magnet: {
    title:'磁极相对，向哪边动',
    prompt:'左侧磁铁固定。先看靠近的两个磁极，再翻转右侧磁铁，比较它受到的力和移动方向。',
    poles:[
      {id:'attract',label:'异极相对',note:'相对的是 S 极和 N 极，右侧磁铁受到向左的吸引力，靠近左侧磁铁。'},
      {id:'repel',label:'同极相对',note:'相对的是两个 S 极，右侧磁铁受到向右的排斥力，远离左侧磁铁。两个 N 极相对时也会相斥。'},
    ],
    model:'这是固定一块条形磁铁、让另一块沿直线移动的方向示意。不计算磁力大小、加速度或真实移动距离；箭头表示右侧磁铁受到的磁力方向。红蓝只是区分磁极，两块磁铁始终各有 N、S 两极。',
    sources:[{title:'OpenStax：磁极与磁力',url:'https://openstax.org/books/physics/pages/20-1-magnetic-fields-field-lines-and-force'}],
  },
  electromagnet: {
    title:'电磁铁吸起再放下',
    prompt:'播放一次，观察开关闭合后吸起铁制回形针，再断开放下。也可直接选通电或断电状态，每次只改变一个条件作比较。',
    current:{label:'电流档位',min:1,max:3,initial:2},
    turns:{label:'线圈匝数',min:4,max:12,initial:8},
    ready:'开关断开，回形针停在下方。播放后先通电，再断电。',
    on:'开关闭合，线圈中有电流，铁芯的磁性增强，吸起铁制回形针。其他条件相同时，增大电流或增加匝数可增强磁性。',
    off:'开关断开，线圈中的电流停止，软铁芯的磁性大大减弱，回形针落下。实际铁芯可能保留少量磁性。',
    model:'比较同样铁芯、线圈长度等条件下的趋势，忽略磁饱和、剩磁与电流变化的短暂过程。强弱条只是示意，不是实测磁力或能吸起的数量；不模拟真实吸起阈值和下落速度。这里的电源是低压电池示意，不能接家用插座。',
    sources:[
      {title:'OpenStax：线圈与电磁铁',url:'https://openstax.org/books/physics/pages/20-1-magnetic-fields-field-lines-and-force'},
      {title:'OpenStax：磁性材料与剩磁',url:'https://openstax.org/books/university-physics-volume-2/pages/12-7-magnetism-in-matter'},
    ],
  },
  buoyancy: {
    title:'同样大小，为什么有的浮、有的沉',
    prompt:'三个物块一样大，换一换轻重。它们都先完全浸在水中，再从静止松手。观察位置和两支力的箭头，最后比较浮在水面与悬在水中的区别。',
    blocks:[
      {id:'light',ratio:.6,label:'较轻物块',note:'这个物块比同体积的水轻。完全浸水时浮力大于重力，松手后上浮；露出水面后排开的水减少，最后漂浮稳定，浮力等于重力。'},
      {id:'balanced',ratio:1,label:'与同体积水一样重',note:'物块的重力恰好等于它排开的水的重力。从静止松手后，浮力和重力平衡，物块可以完全浸在水中保持悬浮。'},
      {id:'heavy',ratio:1.6,label:'较重物块',note:'这个物块比同体积的水重。完全浸水时仍然受到向上的浮力，但浮力小于重力，松手后下沉；本次只观察尚未触底的一段。'},
    ],
    states:{rising:'上浮观察：浮力大于重力',floating:'漂浮稳定：浮力等于重力',suspended:'水中悬浮：浮力等于重力',sinking:'下沉观察：浮力小于重力'},
    labels:{water:'水面',block:'物块',forces:'同一物块的力对照',buoyant:'浮力',weight:'重力',scale:'两箭头使用同一比例',tank:'同样大小，比较轻重',displaced:'浸入体积',start:'起点：完全浸水，从静止松手'},
    model:'这是大小相同、不吸水也不变形的均匀物块，平均密度取水的约 0.6、1、1.6 倍，仅用于对照。浮力按排开水的体积计算，宽水槽水面近似不变。移动路线经过简化，不计算真实加速度、振荡或水的阻力；播放时间不是下沉速度。较重物块的演示停在触底前，暂停画面不表示它已受力平衡。忽略空气浮力、表面张力与水流。',
    sources:[{title:'OpenStax：浮力、漂浮与悬浮',url:'https://openstax.org/books/university-physics-volume-1/pages/14-4-archimedes-principle-and-buoyancy'}],
  },
  structure: {
    title:'框架加一根斜杆，会怎样',
    prompt:'底边固定，接头可以转动。先向一侧推，比较左右两框；再拆掉右框的斜杆，看看它会不会像左框一样改变形状。',
    directions:[{id:'right',label:'向右推'},{id:'left',label:'向左推'}],
    braces:[
      {id:'on',label:'右框加斜杆',note:'左框的四条边长度没有变，接头转动就能改变形状。右框加了固定长度的斜杆，分成两个三角形，不能只靠接头转动来变形。'},
      {id:'off',label:'右框拆斜杆',note:'拆掉斜杆，左右两框现在条件相同。接头转动时，四条边仍保持原长，两个框都能改变形状。'},
    ],
    labels:{reference:'左框：不加斜杆',braced:'右框：加斜杆',unbraced:'右框：不加斜杆',joints:'圆点是可转动的接头',base:'底边固定，四条边长度不变',brace:'固定长度的斜杆',changed:'形状改变',fixed:'保持形状',ready:'起点：两个框都摆正'},
    model:'这里只比较平面框架的形状约束：底边固定，杆件不伸缩、不弯曲，接头可以转动，斜杆与框架可靠连接。推动幅度和时间只是演示，不计算用力大小、材料强度或承重极限。真实框架还会受材料、连接与支撑方式影响，并不是用了三角形就永远不会变形或损坏。',
    sources:[{title:'TeachEngineering：三角形与桁架',url:'https://www.teachengineering.org/lessons/cub_trusses_lesson01'}],
  },
};
if (typeof module !== 'undefined') module.exports = SCI_EXPERIMENTS;

/* 分段观察说明，沿用光路、水循环与生命世界的知识点和实验入口。 */
'use strict';
const SCI_PROCESS = {
  light: {
    angle: {min: 0, max: 75, initial: 40},
    indices: {air: 1, water: 1.333},
    prompt: '先拖动入射角，再分段跟着光走。角度都从法线量起，法线垂直于表面。',
    modes: [
      {id: 'mirror', label: '照向镜面',
        note: '把光斜着照向平面镜，反射光在法线另一侧离开。反射角始终等于入射角。',
        straightNote: '垂直照向镜面时，入射角和反射角都是 0°，反射光沿原路返回。',
        steps: [
          {label: '光照到镜面', note: '光沿直线到达镜面。橙色弧线标出的，是入射光与法线之间的角。'},
          {label: '光反射出去', note: '比较两侧的角：改变入射角，反射角也跟着改变，而且始终一样大。'},
        ]},
      {id: 'water', label: '从空气射入水',
        note: '光从空气斜射入水，折射光向法线靠近。水面也会反射一部分光，这里只跟着进入水中的光走。',
        straightNote: '垂直射入水时，光的传播方向不改变，两个角都是 0°；光在水里的传播速度仍会改变。',
        steps: [
          {label: '光到达水面', note: '光先在空气中沿直线传播，来到空气和水的交界处。'},
          {label: '光进入水中', note: '比较入射角和折射角。斜着入水时，折射角更小；垂直入水时，方向不变。'},
        ]},
    ],
    model: '这是平面镜和空气进入水的光路示意。折射角按折射定律计算，折射率取空气约 1、水约 1.333。光点只是引导观察的标记，播放时间、线条粗细和颜色不代表真实光速或亮度。',
    sources: [
      {title: 'OpenStax：光的反射', url: 'https://openstax.org/books/physics/pages/16-1-reflection'},
      {title: 'OpenStax：光的折射', url: 'https://openstax.org/books/physics/pages/16-2-refraction'},
    ],
  },
  water: {
    prompt: '跟着标记看水怎样往返于海洋、天空和陆地。可以逐步查看，也可以播放一轮后回看。',
    steps: [
      {id: 'evaporation', label: '蒸发', note: '太阳提供能量，海洋和陆地上的水可以蒸发成水蒸气。水蒸气本身看不见，水在常温下也会蒸发。'},
      {id: 'condensation', label: '凝结', note: '空气中的水蒸气遇冷，可以凝结成许多小水滴，形成云。云里也可能有小冰晶，云不是一团看得见的水蒸气。'},
      {id: 'precipitation', label: '降水', note: '云里的水滴或冰晶长大，在重力作用下落下来，形成雨、雪等降水。这里画的是落在陆地上的雨。'},
      {id: 'runoff', label: '径流', note: '一部分水沿地面流入溪流、江河，最终汇入海洋；还有一部分会渗入地下。图中只跟着地表水回到海洋。'},
    ],
    model: '这是水循环的一条简化路线，各环节在自然界可以同时发生，不是排队进行。标记帮助我们认路，不是真实水滴或看得见的水蒸气；时间、距离和水量不按真实比例。地下水、植物蒸腾等路线没有展开。',
    sources: [{title: 'USGS：水循环', url: 'https://www.usgs.gov/water-science-school/water-cycle'}],
  },
  photo: {
    title: '绿叶怎样制造养料',
    diagramLabel: '阳光提供能量，水和二氧化碳进入绿叶，形成糖等养料并释放氧气',
    heading: '先找原料与能量，再看产物',
    footer: '植物白天、夜晚都要呼吸',
    prompt: '沿着每条箭头，找一找哪些进入绿叶，哪些由绿叶产生。可逐段暂停，也可直接点选要讲的关系。',
    nodes: [
      {id:'sun', label:'阳光', detail:'提供能量'},
      {id:'water', label:'水', detail:'根吸收、茎运输'},
      {id:'carbon', label:'二氧化碳', detail:'来自空气'},
      {id:'leaf', label:'绿叶', detail:'制造养料'},
      {id:'sugar', label:'糖等养料', detail:'供生长和储存'},
      {id:'oxygen', label:'氧气', detail:'进入空气'},
    ],
    steps: [
      {id:'sunlight', from:'sun', to:'leaf', label:'阳光供能', note:'绿叶利用光的能量制造养料。阳光提供能量，不是植物从土里吸收的一种食物。'},
      {id:'water', from:'water', to:'leaf', label:'根吸水、茎运输', note:'根从土壤中吸收水，水通过茎到达叶。水是光合作用的原料之一，植物吸水还有其他用途。'},
      {id:'carbon', from:'carbon', to:'leaf', label:'二氧化碳进入', note:'空气中的二氧化碳通过叶片的小孔进入。它和水一起，参与制造糖等养料。'},
      {id:'sugar', from:'leaf', to:'sugar', label:'制造、运送养料', note:'光合作用形成糖等养料，供植物生长，也能运到植物其他部位使用或储存。植物的养料并不是全从土里吸来的。'},
      {id:'oxygen', from:'leaf', to:'oxygen', label:'释放氧气', note:'光合作用产生的氧气可以进入空气。植物同时也在呼吸，不能把这张图当成植物全部的气体交换。'},
    ],
    model:'五段是观察顺序，不是反应先后顺序；自然界中这些过程可以同时发生。标记只指方向，不代表同一个分子变成了不同物质，时间和数量不按真实比例。植物白天、夜晚都要呼吸，本图只展开光合作用涉及的主要进出。',
    sources:[{title:'OpenStax：光合作用的原料、能量与产物', url:'https://openstax.org/books/biology-2e/pages/8-1-overview-of-photosynthesis'}],
  },
  foodchain: {
    title:'顺着食物链找方向',
    diagramLabel:'稻谷到蝗虫、蝗虫到青蛙、青蛙到蛇、蛇到鹰，箭头指向取食者',
    heading:'箭头从食物指向取食者',
    footer:'传给下一环的，只是一部分能量',
    prompt:'先说谁被谁吃，再沿箭头查看食物中的能量传向哪里。从稻谷出发，试着逐环讲清方向。',
    nodes:[
      {id:'rice', label:'稻谷', detail:'生产者'},
      {id:'locust', label:'蝗虫', detail:'消费者'},
      {id:'frog', label:'青蛙', detail:'消费者'},
      {id:'snake', label:'蛇', detail:'消费者'},
      {id:'hawk', label:'鹰', detail:'消费者'},
    ],
    steps:[
      {id:'rice-locust', from:'rice', to:'locust', label:'稻谷 → 蝗虫', note:'蝗虫吃稻谷，箭头从稻谷指向蝗虫。稻株通过光合作用制造养料，食物中的一部分能量传给蝗虫。'},
      {id:'locust-frog', from:'locust', to:'frog', label:'蝗虫 → 青蛙', note:'青蛙吃蝗虫，箭头从蝗虫指向青蛙。箭头指的是食物和能量的传递方向，不是青蛙扑向蝗虫的方向。'},
      {id:'frog-snake', from:'frog', to:'snake', label:'青蛙 → 蛇', note:'在这个例子中，蛇吃青蛙。青蛙自己也要活动和生长，能传到下一环的只是其中一部分能量。'},
      {id:'snake-hawk', from:'snake', to:'hawk', label:'蛇 → 鹰', note:'在这个例子中，鹰吃蛇。这里画的是一条简化食物链，真实自然界里多条关系相连，形成食物网。'},
    ],
    model:'亮点用来认方向，不表示同一份能量原封不动传到底。各环节都要使用能量，一部分能量以热的形式散开，能量在这条链中不循环。线长、粗细和播放时间不表示能量数值；分解者和其他取食关系未展开，也不据此预测生物数量。',
    sources:[{title:'OpenStax：食物链与生态系统的能量流动', url:'https://openstax.org/books/biology-2e/pages/46-2-energy-flow-through-ecosystems'}],
  },
  dissolve: {
    title: '溶解分段观察',
    diagramLabel: '食盐从入水沉底，到微粒扩散、搅拌加速，再到整杯水均匀分布的路径',
    prompt: '先看食盐去了哪里，再分段跟着它的小微粒走。可以逐步暂停，也可以播放一轮后回看。',
    steps: [
      {id: 'sink', label: '食盐入水', note: '把食盐倒进清水，颗粒沉到杯底。颗粒看起来还在，但它已经被水包围，溶解从表面开始了。'},
      {id: 'shrink', label: '颗粒变小', note: '水把颗粒表面的食盐微粒一个个拆下来带进水里，颗粒慢慢变小。这些微粒太小，肉眼看不见。'},
      {id: 'stir', label: '搅拌扩散', note: '搅拌让水流动起来，帮微粒更快散开。不搅拌也能溶解，只是要等更久；水温更高、颗粒更细，溶解也会更快。'},
      {id: 'even', label: '均匀分布', note: '微粒散到整杯水里，尝哪里都是咸的——这就是溶液。食盐没有消失，把水蒸发掉还能把它请回来。'},
    ],
    model: '这是溶解过程的放大示意：图中的微粒只表示被水拆散并带走，不是能看到的真实颗粒；颗粒形状、微粒数量、路径和播放时间都不按真实比例。溶解有快慢也有限度——水装不下更多食盐时，杯底会留下不再变小的颗粒。',
    sources: [
      {title: 'OpenStax：溶解过程', url: 'https://openstax.org/books/chemistry-2e/pages/11-1-the-dissolution-process'},
      {title: 'OpenStax：溶解度与饱和溶液', url: 'https://openstax.org/books/chemistry-2e/pages/11-3-solubility'},
    ],
  },
  filter: {
    title: '过滤分段观察',
    diagramLabel: '浑水沿玻璃棒倒入漏斗，滤纸截留泥沙，滤液滴进下方烧杯',
    prompt: '跟着浑水走一遍：哪里能过、哪里被拦。想一想，溶解在水里的食盐会不会也被拦住？',
    steps: [
      {id: 'pour', label: '倒入浊液', note: '把浑水沿玻璃棒缓缓倒入漏斗，液面始终低于滤纸边缘，不让浑水从滤纸和漏斗壁的缝隙溜下去。'},
      {id: 'trap', label: '滤纸拦杂质', note: '滤纸上有许多肉眼看不见的小孔：水能通过，泥沙这样较大的不溶颗粒被拦在纸上。'},
      {id: 'collect', label: '收集滤液', note: '透过滤纸的水变澄清，滴进下面的烧杯。滤液清了也不等于能喝；溶解在水里的食盐、糖这样的微粒很小，过滤拦不住它们。'},
    ],
    model: '这是过滤操作的简化示意：滤纸上的小孔被画得很夸张，实际孔径小得多，图中也不表示过滤的快慢。滤液仍含溶解的杂质和微生物，不是可饮用水；滤纸破损、液面过高导致漏沙的情况没有展开。',
    sources: [
      {title: 'OpenStax：悬浮液与胶体', url: 'https://openstax.org/books/chemistry-2e/pages/11-5-colloids'},
      {title: 'OpenStax：物理性质与物理变化', url: 'https://openstax.org/books/chemistry-2e/pages/1-3-physical-and-chemical-properties'},
    ],
  },
  burn: {
    title: '燃烧条件与灭火',
    diagramLabel: '可燃物、氧气和达到着火点三个条件汇聚成燃烧，移走任一条件火焰熄灭',
    heading: '三个条件同时满足，火焰才出现',
    footer: '灭火就是去掉其中一个条件',
    prompt: '先逐个点亮三个条件，看火焰什么时候出现；再看移走一个条件时，火为什么熄灭。',
    nodes: [
      {id: 'fuel', label: '可燃物', detail: '纸、木柴、蜡烛'},
      {id: 'oxygen', label: '氧气', detail: '空气里的助燃气体'},
      {id: 'heat', label: '着火点', detail: '温度达到才能点燃'},
      {id: 'fire', label: '燃烧', detail: '缺一个都不行'},
      {id: 'out', label: '灭火', detail: '移走任一条件'},
    ],
    steps: [
      {id: 'fuel-step', from: 'fuel', to: 'fire', label: '可燃物到位', note: '石头、玻璃烧不起来，纸和木柴可以——能燃烧的物质叫可燃物。没有可燃物，其他条件都满足也烧不起来。'},
      {id: 'oxygen-step', from: 'oxygen', to: 'fire', label: '氧气来助燃', note: '燃烧需要氧气帮忙。蜡烛罩上玻璃杯很快熄灭，就是杯里的氧气快用完了；盖严锅盖、熄灭酒精灯时盖上灯帽，都是在隔绝氧气。'},
      {id: 'heat-step', from: 'heat', to: 'fire', label: '温度达到着火点', note: '可燃物要被加热到着火点才能烧起来。纸锅烧水时纸不会烧着，就是因为水的温度最高 100℃，把纸的温度压在了着火点以下。'},
      {id: 'out-step', from: 'fire', to: 'out', label: '缺一个就熄灭', note: '水降温、湿布隔绝氧气、把柴火移开——灭火就是想办法去掉三个条件中的任何一个。'},
    ],
    model: '这是燃烧条件与灭火的示意：三个条件同时满足，燃烧才能开始并持续；箭头表示条件参与燃烧，不代表物质移动或分子行为。着火点随物质种类不同，图与说明不给出精确温度；播放时间也不代表真实燃烧快慢。生态和火灾场景中的特殊燃烧（如金属火）不能用水扑灭，这里没有展开。',
    sources: [
      {title: '西北太平洋火灾科学联盟：燃烧三角（PDF）', url: 'https://www.nwfirescience.org/sites/default/files/publications/FIREFACTS_Triangles.pdf'},
      {title: 'OpenStax：物质的性质与变化', url: 'https://openstax.org/books/chemistry-2e/pages/1-3-physical-and-chemical-properties'},
    ],
  },
};
if (typeof module !== 'undefined') module.exports = SCI_PROCESS;

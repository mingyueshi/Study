/* 宇宙漫游进阶：图注、距离、观察问题统一维护在内容源。 */
'use strict';
const ASTRO_DISCOVERY = {
  scales: [
    {id:'earth',name:'地球',address:'我的家 → 地球',image:'images/astro/p-au3-3.jpg',kind:'探测器照片',text:'旅行者号从遥远的地方回望，地球成了一个淡蓝色小点。照片里的小点很小，地球上的生活却很丰富。',link:'?view=au1',linkLabel:'认识地球的邻居'},
    {id:'moon',name:'地月系统',address:'地球 → 地月系统',image:'images/astro/p-au2-1.jpg',kind:'月球照片',text:'月球围绕地球运行，地月平均距离约 38.4 万千米。照片让我们看清月面，但没有同时按比例画出地球与月球的间隔。',link:'?view=au2#lesson-au2-2',linkLabel:'动手探索月相'},
    {id:'solar',name:'太阳系',address:'地月系统 → 太阳系',image:'images/astro/roam-solar.jpg',kind:'艺术示意图',text:'地球和另外七颗行星围绕太阳运行。太阳系还包括卫星、小行星、彗星和更远的天体，海王星轨道不是太阳系的边界。',link:'#roam-solar',linkLabel:'查看太阳系影像'},
    {id:'galaxy',name:'银河系',address:'太阳系 → 银河系',image:'images/astro/roam-galaxy.jpg',kind:'结构示意图',text:'太阳只是银河系里的一颗恒星。我们住在银河系内部，整座星城的俯视图要依靠观测线索来构建。',link:'#roam-galaxy',linkLabel:'查看银河系结构'},
    {id:'universe',name:'更远的宇宙',address:'银河系 → 宇宙中的众多星系',image:'images/astro/roam-webb.jpg',kind:'近红外观测合成图',text:'越过银河系，还有许多星系。这里是韦布望远镜看到的一小块天区，不是整个宇宙的全景，也不是宇宙的边缘。',link:'#roam-deep',linkLabel:'进入深空图册'}
  ],
  targets: [
    {id:'moon',from:'地球',to:'月球',km:384400,note:'采用地月平均距离，实际距离会随月球运行而变化。',source:'https://science.nasa.gov/moon/facts/'},
    {id:'sun',from:'太阳',to:'地球',km:149600000,note:'采用日地平均距离，约 1 个天文单位。阳光走到地球也需要时间。',source:'https://science.nasa.gov/earth/facts/'},
    {id:'neptune',from:'太阳',to:'海王星',km:4495480000,note:'采用海王星约 30.05 个天文单位的平均日距。这是太阳到海王星的距离，不是地球到海王星的实时通信距离。',source:'https://nssdc.gsfc.nasa.gov/planetary/factsheet/'}
  ],
  lightNote:'光和无线电信号在真空中每秒约走 30 万千米。这里用距离除以光速估算，忽略天体运动和处理消息所需的时间；往返表示信号到达后立刻返回。',
  scaleNote:'这是一条从近到远的认识路线，每一站都换了画面尺度。图片大小和按钮间隔不表示真实距离。',
  challenges: [
    {id:'distance',question:'切到「比距离」后，为什么四颗内侧行星挤在太阳附近？',options:['它们彼此紧贴在一起','它们的平均日距比外侧行星小得多','它们的体积都一样'],answer:1,explanation:'同一张距离尺上，外侧行星占去了很长一段。挤在图上不等于在太空中挨着。',link:'#roam-lab'},
    {id:'size',question:'切到「比大小」后，图上圆面的直径表示什么？',options:['行星直径的相同比例','离太阳的远近','公转速度的快慢'],answer:0,explanation:'这一视图只比较直径，圆面之间的间隔是排版需要，不能拿来测量行星之间的距离。',link:'#roam-lab'},
    {id:'light',question:'如果向月球发送信号，对方立刻回信，我们能立刻收到吗？',options:['能，因为无线电不用走路','不能，往返信号都需要传播时间','只需要算去程的时间'],answer:1,explanation:'信号去月球约需 1.3 秒，返回还要约 1.3 秒，理想往返约 2.6 秒。',link:'#roam-light'},
    {id:'galaxy',question:'银河系的整幅俯视图，属于哪一种资料？',options:['从银河系外拍下的照片','没有任何观测根据的猜想','依据观测线索构建的结构示意图'],answer:2,explanation:'我们尚未到银河系外拍摄全景。科学家用恒星、气体等观测线索推断旋臂与圆盘结构。',link:'#roam-galaxy'},
    {id:'deep',question:'深空图里一个小小的光斑，可能是什么？',options:['一整个遥远星系','一定是太阳系里的行星','一定是一颗近处恒星'],answer:0,explanation:'遥远星系在图里也可能很小。图中还会有前景恒星，需要结合形状和观测资料判断。',link:'#roam-deep'},
    {id:'movie',question:'哈勃深空飞行动画让我们看到星系的前后分布，它是怎样制作的？',options:['飞船真的飞过那些星系','每个星系都摆在同一平面','根据观测影像与距离估计制作三维模型'],answer:2,explanation:'这是数据可视化。镜头是虚拟的，模型深度经过压缩，飞行速度也不是真实飞船速度。',link:'#roam-deep'}
  ]
};
if(typeof module !== 'undefined') module.exports=ASTRO_DISCOVERY;

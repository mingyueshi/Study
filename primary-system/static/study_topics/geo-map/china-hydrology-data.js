/* 正文和关联集中维护；几何由 scripts/build-hydrology.py 从公开资料生成。 */
window.GM_CHINA_HYDROLOGY = {
  intro: '雨落到哪里，最后会汇进同一条河？给大地铺上一层颜色，找找河流的集水范围，再顺着支流走向干流。',
  basinNote: '彩色区域是汇水范围，不是洪水淹没范围，也不按省界划分。本图只显示中国模型覆盖的部分，边界经过简化。流域大，能汇集许多支流；河流水量还受降水、蒸发等条件影响。',
  canalNote: '京杭大运河是跨越多个天然流域的人工水路，水闸和泵站会调节水流。它没有像一条天然大河那样的独立流域，这里不为它画一块集水区。',
  lakeNote: '湖面是平整的蓝色半透明面。显示高度根据本地地形资料估算；湖盆适度压低，方便看清水面和四周高地。盆底深度是示意，不表示真实水深、水位或当前岸线；关闭湖泊后恢复原地形。',
  tributaryNote: '深蓝看主要干流，浅蓝看选取的支流或水系支干，湖蓝看湖泊。珠江图中的深蓝主线沿南盘江—红水河—西江；北江和东江也是珠江水系的主要河流。支流轮廓较简略，不补画资料没有接上的河段。',
  colors: {main: '#1264a3', tributary: '#55b6e5', lake: '#269cc8'},
  lakeFloorMeters: 0,
  basins: [
    {feature: 'f20', name: '长江流域', areaKm2: 1800000, areaLabel: '约 180 万平方千米', scope: '长江全流域的通行约数。', text: '长江像一棵横卧的大树，干流是树干，许多支流像树枝。大片土地上的雨水沿着山坡、溪流和支流，一起汇向长江。', observe: '打开支流，找找嘉陵江、汉江和湘江。流域边界会沿着省界走吗？', source: 'https://cjjjd.ndrc.gov.cn/zoujinchangjiang/jingjishehuifazhan/201907/t20190713_941469.htm'},
    {feature: 'f21', name: '黄河流域', areaKm2: 795000, areaLabel: '约 80 万平方千米', scope: '黄河区的通行约数；图层按自然汇水资料简化，统计边缘可能不同。', text: '黄河绕出大大的弯，接纳渭河、汾河等支流。黄土高原上的雨水会带着泥沙，一起汇入河道。', observe: '黄河下游从平原穿过，那里的流域是不是比中游更窄？', source: 'https://huanghejg.mee.gov.cn/xxgk/hhlyjxbzhgk/hhsgnqh/202001/t20200119_760240.html'},
    {feature: 'f41', name: '珠江流域', areaKm2: 454000, areaLabel: '约 45 万平方千米', scope: '全流域约 45 万平方千米，中国境内约 44 万平方千米。', text: '珠江水系由西江、北江、东江和三角洲水网等组成。许多河流来到南方低地，再从多个口门流向南海。', observe: '找找西江、北江和东江，再到珠江口看看，水是不是只从一个口门流出去？', source: 'https://zjhy.mot.gov.cn/hudongjl/requestion/202312/t20231204_3962002.html'},
    {feature: 'f40', name: '黑龙江流域', areaKm2: 1843000, areaLabel: '全流域约 184 万平方千米', scope: '这是跨中国、俄罗斯和蒙古的全流域面积；本图只显示中国模型内的部分。', text: '黑龙江的流域跨越国界。松花江、乌苏里江等河流带来的水汇入干流，最后经过俄罗斯境内流向大海。', observe: '找到松花江与黑龙江汇合的地方。只看中国地图，能看到整个流域吗？', source: 'https://igsnrr.cas.cn/cbkx/kpyd/zgdl/cnszy/202009/t20200910_5692419.html'},
    {feature: 'f42', name: '淮河汇水区', areaKm2: 270000, areaLabel: '淮河全流域约 27 万平方千米', scope: '全流域包含淮河和沂沭泗水系；此层先看汇向洪泽湖的淮河上中游部分。', text: '淮河位于长江和黄河之间。许多支流先汇进淮河，河水来到洪泽湖附近后，还要经过下游通道继续入江、入海。', observe: '洪泽湖是海吗？一条河到达湖泊后，河水还可能流向哪里？', source: 'https://igsnrr.cas.cn/cbkx/kpyd/zgdl/cnszy/202009/t20200910_5692422.html'}
  ],
  tributaries: [
    {id: 'yalong', river: 'f20', name: '雅砻江', neNumbers: [540], relation: '汇入金沙江', text: '雅砻江从高原南下，汇入长江上游的金沙江。'},
    {id: 'min', river: 'f20', name: '岷江', neNumbers: [367], relation: '汇入长江', text: '岷江穿过四川，在宜宾汇入长江。不要把四川的岷江和福建的闽江混在一起。'},
    {id: 'jialing', river: 'f20', name: '嘉陵江', neNumbers: [538], relation: '汇入长江', text: '嘉陵江流经山地和盆地，在重庆汇入长江。'},
    {id: 'wu', river: 'f20', name: '乌江', neNumbers: [456], relation: '汇入长江', text: '乌江从云贵高原奔流而来，在重庆涪陵汇入长江。'},
    {id: 'han', river: 'f20', name: '汉江', neNumbers: [270], relation: '汇入长江', text: '汉江从秦岭一带向东南流，在武汉汇入长江。'},
    {id: 'xiang', river: 'f20', name: '湘江', neNumbers: [457], relation: '经洞庭湖水系汇入长江', text: '湘江经过湖南，汇入洞庭湖水系，再与长江相连。'},
    {id: 'yuan', river: 'f20', name: '沅江', neNumbers: [247], relation: '经洞庭湖水系汇入长江', text: '沅江带着西部山地的来水，流向洞庭湖水系。'},
    {id: 'gan', river: 'f20', name: '赣江', neNumbers: [278], relation: '经鄱阳湖汇入长江', text: '赣江由南向北流，先进入鄱阳湖，再经湖口与长江相连。'},
    {id: 'wei', river: 'f21', name: '渭河', neNumbers: [873], relation: '汇入黄河', text: '渭河流过关中平原，在潼关附近汇入黄河。'},
    {id: 'fen', river: 'f21', name: '汾河', neNumbers: [1070], relation: '汇入黄河', text: '汾河流经山西，从黄河东侧汇入干流。'},
    {id: 'bei', river: 'f41', name: '北江', neNumbers: [552], relation: '珠江水系主要河流', text: '北江从北方山地流向珠江三角洲水网，与西江、东江一起组成珠江水系。'},
    {id: 'dong', river: 'f41', name: '东江', neNumbers: [539], relation: '珠江水系主要河流', text: '东江从东北方向来到珠江三角洲，不是西江干流上的一段。'},
    {id: 'liu', river: 'f41', name: '柳江', neNumbers: [932], relation: '汇入西江水系', text: '柳江从广西山地流来，把支流的水继续送向西江水系。'},
    {id: 'songhua', river: 'f40', name: '松花江', neNumbers: [366,646,967], relation: '汇入黑龙江', text: '松花江穿过东北地区，在同江附近汇入黑龙江。'},
    {id: 'ussuri', river: 'f40', name: '乌苏里江', neNumbers: [553,611], relation: '汇入黑龙江', text: '乌苏里江是中俄界河的一部分，在抚远附近与黑龙江相会。'},
    {id: 'ying', river: 'f42', name: '颍河', neNumbers: [1143], relation: '沙颍河水系，汇入淮河', text: '颍河是沙颍河水系的重要河段，水流继续汇入淮河。'}
  ],
  estuaries: [
    {id: 'yangtze-mouth', river: 'f20', name: '长江三角洲与河口', point: [121.55,31.55], zoom: 7, text: '长江来到海边，江面变宽，河道分汊，泥沙在水流、潮汐和波浪共同作用下搬运、沉积。崇明岛就在长江口。', observe: '找找崇明岛和入海河道。泥沙沉积形成的陆地，是不是一下子就长出来的？', source: 'https://www.shuizhishi.cn/c/2020-04-09/519513.shtml'},
    {id: 'yellow-mouth', river: 'f21', name: '黄河三角洲', point: [119.08,37.76], zoom: 8, text: '黄河带来的泥沙在河口附近沉积，形成伸向海面的三角洲。河口也会受改道、潮流和波浪影响，岸线并非一直向外长。', observe: '河道从平原走向渤海。想一想，如果泥沙变少，海浪仍在搬运沙子，岸线可能怎样变？', source: 'https://igsnrr.cas.cn/cbkx/kpyd/zgdl/cndm/202009/t20200910_5692355.html'},
    {id: 'pearl-mouth', river: 'f41', name: '珠江口与三角洲', point: [113.48,22.55], zoom: 8, text: '西江、北江、东江来到三角洲，河道像一张网，再由多个口门流入南海。放大观察的是河口区域，不把图中的一条主线当成全部出海通道。', observe: '看河口两旁的低地和海湾。三条大河带来的泥沙，为什么会在这里慢慢积下来？', source: 'https://zjhy.mot.gov.cn/zhuhanggk/shuixijj/201909/t20190916_3266853.html'}
  ]
};

/* 沿用 gu4-3 与四季探究入口；正文、位置说明与模型限制。 */
'use strict';
const GEO_EARTH = {
  tilt:23.5,
  latitudes:[{value:40,label:'北纬 40°'},{value:0,label:'赤道 0°'},{value:-40,label:'南纬 40°'}],
  day:{
    label:'昼夜交替',
    lit:'橙点在向阳的一侧，处在白昼中。',
    dark:'橙点在背阳的一侧，处在黑夜中。',
    boundary:'橙点经过明暗分界，正在迎来日出或日落。',
    prompt:'盯住赤道上的橙点。太阳光从左边照来，地球自转让这个地点依次进入白昼和黑夜。',
    stops:[
      {id:'noon',progress:0,label:'正午',note:'这个地点正朝向太阳，处在白昼中。'},
      {id:'sunset',progress:.25,label:'日落附近',note:'这个地点从向阳一侧转入背阳一侧，即将进入黑夜。'},
      {id:'midnight',progress:.5,label:'午夜',note:'这个地点背向太阳，处在黑夜中。'},
      {id:'sunrise',progress:.75,label:'日出附近',note:'这个地点从背阳一侧转回向阳一侧，即将进入白昼。'},
    ],
    model:'从北极上方俯视，地球自西向东自转，在图中是逆时针。橙点代表赤道上的一个地点；按春秋分附近的简化情况观察，忽略公转、地形与大气折射。亮暗范围和转速是示意，时刻只帮助理解约一天的循环，不是当地钟表时间。',
  },
  year:{
    label:'四季与昼长',
    between:'地球正在两个节气位置之间。地轴朝向基本不变，太阳直射纬度和同一地点的昼长逐渐改变。',
    untilt:'这是地轴不倾斜的对照模型：太阳全年直射赤道，各纬度昼夜各约 12 小时。真实地球有倾角，不能用这个对照代替实际季节。',
    prompt:'先在四个位置间比较，再播放地球绕太阳走一圈。注意地轴朝向，切换南北纬度和不倾斜对照，看看白昼长短怎样变化。',
    stops:[
      {id:'june',progress:0,label:'6月夏至',note:'北半球倾向太阳，直射点在北回归线附近。北半球中纬度昼长较长，南半球相反。'},
      {id:'september',progress:.25,label:'9月秋分',note:'太阳直射赤道附近，南北半球昼夜都大致等长。北半球进入秋季，南半球进入春季。'},
      {id:'december',progress:.5,label:'12月冬至',note:'北半球背向太阳，直射点在南回归线附近。北半球中纬度昼长较短，南半球相反。'},
      {id:'march',progress:.75,label:'3月春分',note:'太阳又直射赤道附近，昼夜大致等长。北半球进入春季，南半球进入秋季。'},
    ],
    model:'轨道是圆轨道的斜俯视示意，地轴在空间中的朝向保持不变；投影角度、大小、距离和时间不按真实比例。按球形地球和太阳中心刚好位于地平线计算示意昼长，忽略大气折射、太阳视半径、地形与轨道偏心，不能用来预报日出日落。四季主要由地轴倾斜和公转共同造成，并不是离太阳近就夏天。',
  },
  sources:[
    {title:'NASA：地轴倾斜与四季',url:'https://spaceplace.nasa.gov/seasons/en/'},
    {title:'NOAA：太阳位置与日出日落的计算条件',url:'https://gml.noaa.gov/grad/solcalc/calcdetails.html'},
  ],
};
if (typeof module !== 'undefined') module.exports = GEO_EARTH;

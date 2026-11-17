/* 疆域地图的稳定链接与旧朝代页书签兼容，不改变地图阶段编号。 */
window.TerritoryLinks=(()=>{
  'use strict';
  const mapHref=(id='')=>'territory.html'+(id?'?map='+encodeURIComponent(id):'')+'#territory-maps';
  function legacyHref(search='',hash=''){
    const params=new URLSearchParams(search);
    if(hash!=='#territory-maps'&&(hash||!params.has('map')))return null;
    return 'territory.html'+(params.size?'?'+params.toString():'')+'#territory-maps';
  }
  return {mapHref,legacyHref};
})();

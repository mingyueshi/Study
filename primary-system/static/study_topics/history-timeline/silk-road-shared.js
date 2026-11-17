/* 丝路的索引、经纬度投影与阅读链接。资料和路线在独立内容源中维护。 */
window.SilkRoad=(()=>{
  'use strict';
  const data=window.SILK_ROAD,geo=window.SILK_ROAD_GEO,esc=window.TLShared.esc,assetBase=new URL('.',document.currentScript.src);
  const cityMap=new Map(data.cities.map(c=>[c.id,c])),routeMap=new Map(data.routes.map(r=>[r.id,r]));
  const normalize=value=>String(value).normalize('NFKC').replace(/\s/g,'').toLowerCase();
  const cityHref=(city,anchor='')=>'silk-city.html?city='+city.id+(anchor?'#'+anchor:'');
  const routeHref=(route,city='')=>'silk-road.html?route='+route+(cityMap.has(city)?'&city='+city:'')+'#route-map';
  const lesson=window.HISTORY_LESSONS_DYNASTIES?.find(l=>l.id===data.resources.lesson);
  const lessonHref=id=>(document.querySelector?.('.study-topic-frame')?.dataset.historyLesson||'../history/index.html')+'#lesson-'+id;
  const routesFor=route=>data.routes.filter(r=>route==='all'||r.id===route);
  const citiesFor=route=>routesFor(route).flatMap(r=>r.stops.map(id=>cityMap.get(id)));
  const forEvent=id=>data.routes.filter(r=>r.eventIds.includes(id));
  const forPerson=id=>data.routes.filter(r=>r.people.includes(id));
  function filter(query='',route='all'){const q=normalize(query);return citiesFor(route).filter(c=>normalize([c.name,c.alias,c.role,c.geography,c.trade].join(' ')).includes(q));}
  function readState(params){
    const route=routeMap.has(params.get('route'))?params.get('route'):'all',cities=citiesFor(route),requested=cityMap.get(params.get('city'));
    return {route,city:requested&&cities.includes(requested)?requested.id:cities[0].id,query:params.get('q')||'',focus:params.get('focus')==='city'};
  }
  function selectRoute(state,route){if(route!=='all'&&!routeMap.has(route))return state;const cities=citiesFor(route);return {...state,route,city:cities.some(c=>c.id===state.city)?state.city:cities[0].id,focus:false};}
  function adjacent(state,delta){const cities=citiesFor(state.route),index=cities.findIndex(c=>c.id===state.city);return cities[Math.max(0,Math.min(cities.length-1,index+delta))].id;}
  const project=point=>[50+(point[0]-40)*10.6,40+(49-point[1])*11.66];
  function viewport(state){if(!state.focus)return '0 0 1010 745';const [x,y]=project(cityMap.get(state.city).point);return `${Math.max(0,Math.min(510,x-250))} ${Math.max(0,Math.min(365,y-190))} 500 380`;}
  const path=points=>points.map((p,i)=>(i?'L':'M')+project(p).map(n=>n.toFixed(2)).join(' ')).join(' ');
  function mapHTML(state){
    const city=cityMap.get(state.city),routes=routesFor(state.route),cities=citiesFor(state.route);
    return `<svg class="sr-map" viewBox="${viewport(state)}" role="group" aria-label="丝绸之路自然底图与可选择的城市"><title>陆上与海上丝路的代表性联系</title><desc>北在上、东在右。棕色表示陆路，蓝色虚线表示海路；图线是教学概括，不代表精确古道。编号对应下方城市按钮。</desc><path fill="#e9e0bd" stroke="#bdc4a7" stroke-width=".7" fill-rule="evenodd" d="${geo.land.map(r=>path(r)+'Z').join(' ')}"/><g class="sr-map-labels">${geo.labels.map(l=>{const [x,y]=project(l.point);return `<text x="${x}" y="${y}">${esc(l.text)}</text>`;}).join('')}</g>${routes.map(r=>`<g fill="none" stroke="${r.color}" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round" ${r.id==='sea'?'stroke-dasharray="10 8"':''}>${r.branches.map(b=>`<path d="${path(b.points)}"><title>${esc(b.title)}：${esc(b.note)}</title></path>`).join('')}</g>`).join('')}<g class="sr-map-cities">${cities.map((c,i)=>{const [x,y]=project(c.point),current=c.id===city.id;return `<g transform="translate(${x} ${y})" tabindex="0" role="button" data-map-city="${c.id}" aria-label="在地图上查看${esc(c.name)}" aria-pressed="${current}"><circle r="${current?17:13}" fill="${current?routeMap.get(c.route).color:'#fffdf4'}" stroke="${routeMap.get(c.route).color}" stroke-width="3"/><text class="sr-map-number" y="1" fill="${current?'#fff':'#493b2b'}" aria-hidden="true">${i+1}</text>${current?`<text class="sr-map-current" x="0" y="-25" text-anchor="middle" aria-hidden="true">${esc(c.name)}</text>`:''}</g>`;}).join('')}</g></svg>`;
  }
  function resolveImage(id){const image=data.images[id];if(image.mediaEvent)return window.TIMELINE_MEDIA[image.mediaEvent][0];if(image.lessonImage){const shared=window.HISTORY_MEDIA[image.lessonImage];return {...shared,src:new URL(shared.src,new URL('../history/',assetBase)).href,width:image.width,height:image.height,title:'郑和宝船现代模型',license:'图像署名及许可见来源'};}return image;}
  function imageHTML(id){const i=resolveImage(id),url=esc(new URL(i.src,assetBase).href);return `<figure class="sr-evidence"><a href="${url}" target="_blank" rel="noopener" aria-label="放大查看${esc(i.title)}"><img src="${url}" width="${i.width}" height="${i.height}" alt="${esc(i.alt)}" loading="lazy" decoding="async"></a><figcaption><b>${esc(i.title)}</b><p>${esc(i.caption)}</p><small>${esc(i.credit)} · ${esc(i.license)} · <a href="${esc(i.source)}" target="_blank" rel="noopener noreferrer">原图与说明（需联网）↗</a></small></figcaption></figure>`;}
  function sourcesHTML(ids){return `<ul class="hp-sources">${[...new Set(ids)].map(id=>{const s=data.sources[id];return `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.publisher)} · ${esc(s.title)}（需联网）↗</a></li>`;}).join('')}</ul>`;}
  function cityCard(city){const r=routeMap.get(city.route);return `<article class="sr-city-card" style="--person-color:${r.color}"><p class="hp-category">${esc(r.title)} · ${esc(city.role)}</p><h3><a href="${cityHref(city)}">${esc(city.name)} →</a></h3><p class="sr-alias">${esc(city.alias)}</p><p>${esc(city.geography)}</p><a class="hp-text-link" href="${routeHref(city.route,city.id)}">在路线图上找这座城 →</a></article>`;}
  return {data,geo,assetBase,cityMap,routeMap,normalize,cityHref,routeHref,lesson,lessonHref,routesFor,citiesFor,forEvent,forPerson,filter,readState,selectRoute,adjacent,project,viewport,mapHTML,resolveImage,imageHTML,sourcesHTML,cityCard};
})();

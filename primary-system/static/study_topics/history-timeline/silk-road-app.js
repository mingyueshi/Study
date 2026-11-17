(()=>{
  'use strict';
  const H=window.SilkRoad,{data}=H,{esc,eventHref,bindAnchors}=window.TLShared,root=document.querySelector('.silk-road-topic'),$=id=>document.getElementById(id);
  let state=H.readState(new URLSearchParams(location.search));
  $('silk-stats').innerHTML=[[2,'类路线'],[data.cities.length,'座城市'],[data.goods.length,'类贸易品'],[data.exchanges.length,'组文化交流']].map(([n,t])=>`<span><b>${n}</b>${t}</span>`).join('');
  $('silk-route-filters').innerHTML=[{id:'all',title:'陆海总览'},...data.routes].map(r=>`<button type="button" data-route="${r.id}" aria-pressed="false">${esc(r.title)}</button>`).join('');
  $('silk-resources').innerHTML=`<h2>回到已有精讲与听读</h2><p>${esc(H.lesson.definition)}</p><a class="hp-text-link" href="${H.lessonHref(data.resources.lesson)}">读「${esc(H.lesson.title)}」与原有旅行演示 →</a><div class="sr-audio"><audio controls preload="none" src="${esc(new URL(data.resources.audio,H.assetBase).href)}" aria-label="${esc(H.lesson.title)}讲解"><a href="${esc(new URL(data.resources.audio,H.assetBase).href)}">打开本地讲解录音</a></audio><a href="${esc(new URL(data.resources.transcript,H.assetBase).href)}" target="_blank" rel="noopener">查看录音文字稿 ↗</a></div><p class="sr-note">图上路线、城市与材料来自不同年代。读一个具体故事时，先核对年代，再判断能否放在同一段旅程中。</p><details class="sr-source-fold"><summary>核查专题全部资料出处</summary>${H.sourcesHTML(Object.keys(data.sources))}</details>`;
  $('silk-milestones').innerHTML=data.milestones.map(m=>`<li><b>${esc(m.label)}</b><p>${esc(m.text)}</p>${m.eventId?`<a href="${eventHref(window.TIMELINE_EVENTS.find(e=>e.id===m.eventId))}">读相关大事 →</a>`:`<a href="timeline.html?year=${m.year}&zoom=500">到同期时间轴看看 →</a>`}</li>`).join('');
  function save(){const url=new URL(location.href);for(const [key,value]of Object.entries({route:state.route==='all'?'':state.route,city:state.city,q:state.query,focus:state.focus?'city':''}))if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);history.replaceState(null,'',url);}
  function renderMap(){
    const city=H.cityMap.get(state.city),route=H.routeMap.get(city.route),cities=H.citiesFor(state.route),index=cities.indexOf(city);
    $('silk-map').innerHTML=H.mapHTML(state);
    $('silk-stops').innerHTML=cities.map((c,i)=>`<button type="button" data-city="${c.id}" aria-pressed="${c.id===city.id}">${i+1} · ${esc(c.name)}</button>`).join('');
    $('silk-city-preview').style.setProperty('--person-color',route.color);
    $('silk-city-preview').innerHTML=`<p class="hp-category">${esc(route.title)} · ${esc(city.role)}</p><h3>${esc(city.name)} <small class="sr-alias">${esc(city.alias)}</small></h3><p class="sr-period">${esc(city.period)}</p><p>${esc(city.geography)}</p><a class="hp-text-link" href="${H.cityHref(city)}">进城市档案，看贸易、材料与讨论题 →</a>`;
    $('silk-prev').disabled=index===0;$('silk-next').disabled=index===cities.length-1;
    $('silk-city-position').textContent=`城市 ${index+1} / ${cities.length} · 可任意选择`;
    $('silk-focus').setAttribute('aria-pressed',String(state.focus));$('silk-full').setAttribute('aria-pressed',String(!state.focus));
  }
  function render(saveURL=true){
    const routes=H.routesFor(state.route),cities=H.filter(state.query,state.route);
    root.querySelectorAll('[data-route]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.route===state.route)));
    $('silk-search').value=state.query;$('silk-count').textContent=`找到 ${cities.length} / ${H.citiesFor(state.route).length} 座城市`;
    $('silk-city-cards').innerHTML=cities.map(H.cityCard).join('');$('silk-empty').hidden=cities.length>0;
    $('silk-route-intros').innerHTML=routes.map(r=>`<article class="sr-route-intro" style="--person-color:${r.color}"><p class="hp-category">${esc(r.period)}</p><h3>${esc(r.title)} · ${esc(r.question)}</h3><p>${esc(r.lead)}</p><h4>交通怎样运转？</h4><p>${esc(r.mechanism)}</p><details><summary>展开图中分支与材料边界</summary><ul class="sr-branches">${r.branches.map(b=>`<li><b>${esc(b.title)}</b><p>${esc(b.note)}</p></li>`).join('')}</ul><p class="sr-note">${esc(r.limits)}</p>${H.sourcesHTML(r.sources)}</details></article>`).join('');
    const belongs=item=>state.route==='all'||item.routes.includes(state.route);
    $('silk-goods').innerHTML=data.goods.filter(belongs).map(g=>`<article class="sr-good" id="good-${g.id}" data-tl-anchor tabindex="-1"><h3>${esc(g.icon)} ${esc(g.name)}</h3><p>${esc(g.flow)}</p><h4>运输选择</h4><p>${esc(g.logistics)}</p><details class="sr-source-fold"><summary>读证据与容易混淆的地方</summary><p>${esc(g.evidence)}</p><p class="sr-note">${esc(g.boundary)}</p>${H.sourcesHTML(g.sources)}</details><nav class="tl-related" aria-label="${esc(g.name)}的城市线索">${g.cities.filter(id=>state.route==='all'||H.cityMap.get(id).route===state.route).map(id=>`<a href="${H.cityHref(H.cityMap.get(id))}">${esc(H.cityMap.get(id).name)} →</a>`).join('')}</nav></article>`).join('');
    $('silk-exchanges').innerHTML=data.exchanges.filter(belongs).map(e=>`<article class="sr-exchange" id="exchange-${e.id}" data-tl-anchor tabindex="-1"><h3>${esc(e.title)}</h3><p>${esc(e.mechanism)}</p><p>${esc(e.evidence)}</p>${e.images.map(H.imageHTML).join('')}<div class="hp-prompt"><b>一起想一想</b><p>${esc(e.question)}</p><details><summary>展开讲解参考</summary><p>${esc(e.answer)}</p></details></div><details class="sr-source-fold"><summary>核查这一组资料</summary>${H.sourcesHTML(e.sources)}</details></article>`).join('');
    const people=[...new Set(routes.flatMap(r=>r.people))],events=[...new Set(routes.flatMap(r=>r.eventIds))];
    $('silk-connections').innerHTML=[...events.map(id=>{const e=window.TIMELINE_EVENTS.find(e=>e.id===id);return `<a href="${eventHref(e)}"><small>${esc(e.year)}</small><b>${esc(e.title)} →</b></a>`;}),...people.map(id=>{const p=window.HISTORY_PEOPLE.people.find(p=>p.id===id);return `<a href="person.html?person=${p.id}"><small>人物名片、背景与关键决策</small><b>${esc(p.name)} →</b></a>`;}),'<a href="technology.html?topic=paper"><small>材料与技术传播</small><b>造纸科技档案 →</b></a>','<a href="civilizations.html"><small>建筑、文字、制度与成就</small><b>继续看世界文明巡礼 →</b></a>'].join('');
    renderMap();if(saveURL)save();
  }
  function selectCity(id,fromMap=false){if(!H.citiesFor(state.route).some(c=>c.id===id))return;state.city=id;renderMap();save();root.querySelector(`[data-${fromMap?'map-city':'city'}="${id}"]`)?.focus({preventScroll:true});}
  root.addEventListener('click',event=>{
    const city=event.target.closest('[data-map-city],[data-city]');if(city){selectCity(city.dataset.mapCity||city.dataset.city,city.hasAttribute('data-map-city'));return;}
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.route){state=H.selectRoute(state,b.dataset.route);render();return;}
    if(b.hasAttribute('data-reset')){state={route:'all',city:data.cities[0].id,query:'',focus:false};render();return;}
    if(b.id==='silk-prev'||b.id==='silk-next'){state.city=H.adjacent(state,b.id==='silk-prev'?-1:1);renderMap();save();return;}
    if(b.id==='silk-focus'||b.id==='silk-full'){state.focus=b.id==='silk-focus';renderMap();save();}
  });
  root.addEventListener('keydown',event=>{const marker=event.target.closest('[data-map-city]');if(marker&&['Enter',' '].includes(event.key)){event.preventDefault();selectCity(marker.dataset.mapCity,true);}});
  $('silk-search').addEventListener('input',()=>{state.query=$('silk-search').value;const cities=H.filter(state.query,state.route);$('silk-city-cards').innerHTML=cities.map(H.cityCard).join('');$('silk-count').textContent=`找到 ${cities.length} / ${H.citiesFor(state.route).length} 座城市`;$('silk-empty').hidden=cities.length>0;save();});
  window.addEventListener('popstate',()=>{state=H.readState(new URLSearchParams(location.search));render(false);});
  render(false);bindAnchors(root);
})();

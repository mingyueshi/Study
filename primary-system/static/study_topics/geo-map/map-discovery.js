/* 平面地图的点选标注、有限河流回放与中国邻居探索。 */
window.GMMapDiscovery = (() => {
  'use strict';
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function buildRiver(parts,stops,project) {
    let length=0;
    const tracks=parts.map(part=>{const points=part.map(p=>project(p)),distances=[0];for(let i=1;i<points.length;i++)distances.push(distances.at(-1)+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));const track={points,distances,length:distances.at(-1),start:length};length+=track.length;return track;});
    const located=stops.map((stop,index)=>{
      const anchor=project(stop.anchor);let best=Infinity,at=0,point=anchor;
      for(const t of tracks)for(let i=1;i<t.points.length;i++){const a=t.points[i-1],b=t.points[i],dx=b[0]-a[0],dy=b[1]-a[1],ratio=clamp(((anchor[0]-a[0])*dx+(anchor[1]-a[1])*dy)/(dx*dx+dy*dy||1),0,1),p=[a[0]+ratio*dx,a[1]+ratio*dy],d=Math.hypot(p[0]-anchor[0],p[1]-anchor[1]);if(d<best){best=d;at=t.start+t.distances[i-1]+ratio*(t.distances[i]-t.distances[i-1]);point=p;}}
      if(index===0){at=0;point=tracks[0].points[0];}if(index===stops.length-1){at=length;point=tracks.at(-1).points.at(-1);}
      return {...stop,distance:at,xy:point};
    });
    return {tracks,stops:located,length};
  }
  function atDistance(route,distance){
    const d=clamp(distance,0,route.length),t=route.tracks.find(t=>d<t.start+t.length)||route.tracks.at(-1),local=d-t.start;
    let i=1;while(i<t.points.length-1&&t.distances[i]<local)i++;
    const a=t.points[i-1],b=t.points[i],ratio=clamp((local-t.distances[i-1])/(t.distances[i]-t.distances[i-1]||1),0,1);
    return {xy:[a[0]+(b[0]-a[0])*ratio,a[1]+(b[1]-a[1])*ratio],track:route.tracks.indexOf(t)};
  }
  function createReplay({request,cancel,canPlay,render,changed,duration=24}){
    let progress=0,playing=false,frame=null,previous=null,generation=0;
    const state=()=>({progress,playing});
    function pause(){playing=false;generation++;if(frame!==null)cancel(frame);frame=previous=null;changed(state());}
    function seek(value){pause();progress=clamp(Number(value)||0,0,1);render(state());changed(state());}
    function play(){if(playing||!canPlay())return;if(progress>=1)progress=0;playing=true;previous=null;const token=++generation;render(state());changed(state());
      const tick=now=>{if(token!==generation||!playing)return;frame=null;if(!canPlay()){pause();return;}if(previous!==null)progress=Math.min(1,progress+Math.min(.1,Math.max(0,(now-previous)/1000))/duration);previous=now;render(state());if(progress>=1){pause();return;}frame=request(tick);};frame=request(tick);
    }
    return {state,pause,seek,play,refresh(){if(!canPlay())pause();else changed(state());}};
  }
  function mountChina({root,svg,getUI}){
    const S=window.GMShared,D=window.GM_MAP_DISCOVERY,esc=S.esc,$=id=>root.querySelector('#'+id),NS='http://www.w3.org/2000/svg';
    const pin=document.createElementNS(NS,'g'),riverLayer=document.createElementNS(NS,'g');pin.setAttribute('class','gm-capital-annotation');riverLayer.setAttribute('class','gm-river-play-layer');pin.setAttribute('aria-hidden','true');riverLayer.setAttribute('aria-hidden','true');svg.append(riverLayer,pin);
    let route=null,river='',layer=root.dataset.layer,quiz=false,visible=true,lastCity='';
    const media=matchMedia('(prefers-reduced-motion: reduce)'),fullMotion=()=>!media.matches&&(!window.StudyEffects||window.StudyEffects.motion==='full');
    const controls=$('gm-river-readout');controls.hidden=true;
    $('gm-capital-note').innerHTML=esc(D.capitalNote)+` <a href="${esc(D.source.url)}" target="_blank" rel="noopener">点位出处（需联网）↗</a>`;
    $('gm-river-note').textContent=D.riverNote;
    $('gm-river-choices').innerHTML=D.rivers.map(id=>`<button type="button" data-replay-river="${id}" aria-pressed="false">${esc(window.GM_FEATURES.find(f=>f.id===id).name)}</button>`).join('');
    function changed(state){
      root.dataset.riverPlaying=String(state.playing);
      root.querySelectorAll('[data-river-action="play"]').forEach(b=>{b.textContent=state.playing?'暂停回放':state.progress>=1?'再从源头播放':'播放到入海口';b.disabled=!route||quiz||!fullMotion();b.setAttribute('aria-pressed',String(state.playing));});
      if(route)$('gm-river-state').textContent=!fullMotion()?'已减少动态，仍可拖动进度或直接选一站。':state.progress>=1?'已经到达入海口；可以再从源头看一遍。':state.playing?'水滴沿河道向下游走，沿途城市依次点亮。':'已暂停，可以拖动进度慢慢观察。';
    }
    function render(state){
      if(!route)return;
      const distance=state.progress*route.length,p=atDistance(route,distance);
      riverLayer.querySelectorAll('.gm-river-reveal').forEach((el,i)=>{const t=route.tracks[i];el.style.strokeDashoffset=String(t.length-clamp(distance-t.start,0,t.length));});
      const dot=riverLayer.querySelector('.gm-river-water');dot.setAttribute('cx',p.xy[0]);dot.setAttribute('cy',p.xy[1]);
      riverLayer.querySelectorAll('[data-river-city]').forEach((g,i)=>g.classList.toggle('is-reached',route.stops[i].distance<=distance+1e-6));
      const stop=[...route.stops].reverse().find(s=>s.distance<=distance+1e-6)||route.stops[0];
      if(stop.id!==lastCity){lastCity=stop.id;$('gm-river-city').textContent=`经过：${stop.name}。${stop.description}`;}
      $('gm-river-progress').value=Math.round(state.progress*1000);$('gm-river-percent').textContent=Math.round(state.progress*100)+'％';
      root.dataset.replayProgress=state.progress.toFixed(4);root.dataset.replayCity=stop.id;
    }
    const replay=createReplay({request:requestAnimationFrame,cancel:cancelAnimationFrame,duration:D.durationSeconds,canPlay:()=>Boolean(route)&&layer==='land'&&!quiz&&visible&&!document.hidden&&fullMotion(),render,changed});
    const inView=()=>{const box=svg.getBoundingClientRect();return box.top<innerHeight&&box.bottom>0;};
    function playRiver(){if(!route||quiz||!fullMotion()||document.hidden)return;if(!inView())svg.scrollIntoView({block:'center',behavior:'instant'});visible=inView();replay.play();}
    function leaveRiver(){replay.pause();route=null;river='';riverLayer.innerHTML='';controls.hidden=true;root.classList.remove('gm-river-replaying');svg.querySelectorAll('.gm-replay-river').forEach(el=>el.classList.remove('gm-replay-river'));root.querySelectorAll('[data-replay-river]').forEach(b=>b.setAttribute('aria-pressed','false'));}
    function showProvince(id){
      pin.innerHTML='';$('gm-province-readout').hidden=true;delete root.dataset.annotatedProvince;
      const p=window.GM_PROVINCES.find(p=>p.id===(id==='capital'?'p110000':id));if(!p||layer!=='province'||quiz)return;
      const meta=D.provinces[p.id],[x,y]=S.m(...meta.point),label=p.capital?`${p.type==='自治区'?'首府':'省会'} · ${p.capital}`:`${p.type==='直辖市'?'直辖市':'特区'} · ${S.displayName(p.name)}`;
      const width=Math.max(140,label.length*19+12),left=x+width+18>S.W-20?x-width-18:x+18,top=y<90?y+18:y-38;
      pin.innerHTML=`<path class="gm-capital-leader" d="M${x} ${y}L${left+10} ${top+15}"/><circle cx="${x}" cy="${y}" r="7"/><rect x="${left}" y="${top}" width="${width}" height="30" rx="10"/><text x="${left+width/2}" y="${top+21}" text-anchor="middle">${esc(label)}</text>`;
      const target=svg.querySelector(`[data-g="province"] [data-id="${p.id}"]`);target?.classList.add('is-active');
      $('gm-province-readout').hidden=false;$('gm-province-name').textContent=p.name;$('gm-province-capital').textContent=label;
      $('gm-province-feature').textContent=`${p.where}；${p.facts[meta.climateFact]}`;root.dataset.annotatedProvince=p.id;
    }
    function loadRiver(id){
      replay.pause();if(river===id&&route){controls.hidden=false;return;}
      const config=window.GM_CHINA_RIVER_TOURS.routes.find(r=>r.river===id),raw=window.GM_CHINA_RIVERS.rivers[id];if(!config||!raw)return;
      river=id;route=buildRiver(raw.paths,config.stops.filter(s=>s.kind!=='landform'),p=>S.m(p[0],p[1]));lastCity='';
      const occupied=[];
      riverLayer.innerHTML=route.tracks.map(t=>`<path class="gm-river-reveal" d="${t.points.map((p,i)=>(i?'L':'M')+p.join(' ')).join('')}" style="stroke-dasharray:${t.length};stroke-dashoffset:${t.length}"/>`).join('')+route.stops.map((s,i)=>{
        const [x,y]=s.xy,w=Math.max(64,s.name.length*15+12),h=26;
        let offset=[0,-24];for(const option of [[0,-24],[0,32],[-w/2,-46],[w/2,50],[0,-70],[0,76]]){const b=[x+option[0]-w/2,y+option[1]-h/2,x+option[0]+w/2,y+option[1]+h/2];if(!occupied.some(a=>b[0]<a[2]&&b[2]>a[0]&&b[1]<a[3]&&b[3]>a[1])){offset=option;occupied.push(b);break;}}
        const lx=x+offset[0],ly=y+offset[1];return `<g data-river-city="${s.id}"><path d="M${x} ${y}L${lx} ${ly}"/><circle cx="${x}" cy="${y}" r="5"/><rect x="${lx-w/2}" y="${ly-17}" width="${w}" height="26" rx="6"/><text x="${lx}" y="${ly+2}" text-anchor="middle">${esc(s.name)}</text></g>`;
      }).join('')+'<circle class="gm-river-water" r="8"/>';
      $('gm-river-stops').innerHTML=route.stops.map((s,i)=>`<button type="button" data-replay-stop="${i}">${esc(s.name)}</button>`).join('');
      $('gm-river-title').textContent=window.GM_FEATURES.find(f=>f.id===id).name+' · 从源区到入海口';controls.hidden=false;root.classList.add('gm-river-replaying');
      svg.querySelector(`[data-g="land"] [data-id="${id}"]`)?.classList.add('gm-replay-river');root.querySelectorAll('[data-replay-river]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.replayRiver===id)));
      replay.seek(0);
    }
    root.addEventListener('click',e=>{const r=e.target.closest('[data-replay-river]'),stop=e.target.closest('[data-replay-stop]'),action=e.target.closest('[data-river-action]');
      if(r&&!quiz)getUI()?.choose(r.dataset.replayRiver,{layer:'land'});
      if(stop&&route)replay.seek(route.stops[Number(stop.dataset.replayStop)].distance/route.length);
      if(action&&route){if(action.dataset.riverAction==='restart'){replay.seek(0);playRiver();}else replay.state().playing?replay.pause():playRiver();}
    });
    $('gm-river-progress').addEventListener('input',e=>replay.seek(Number(e.target.value)/1000));
    const refresh=()=>replay.refresh();const observer=new IntersectionObserver(()=>{visible=inView();refresh();});observer.observe(svg);
    document.addEventListener('visibilitychange',refresh);document.addEventListener('study:effects-change',refresh);media.addEventListener('change',refresh);
    window.addEventListener('pagehide',e=>{replay.pause();if(!e.persisted){observer.disconnect();document.removeEventListener('visibilitychange',refresh);document.removeEventListener('study:effects-change',refresh);media.removeEventListener('change',refresh);}});
    return {select(id){showProvince(id);if(D.rivers.includes(id)&&layer==='land'&&!quiz)loadRiver(id);else leaveRiver();},layerChanged(value,isQuiz){layer=value;quiz=isQuiz;showProvince('');leaveRiver();root.querySelectorAll('[data-replay-river]').forEach(b=>{b.disabled=quiz;});}};
  }
  function mountNeighbors({root,svg,getUI}){
    const A = window.GMAtlas;
    const {esc} = window.GMShared;
    const $ = id => root.querySelector('#' + id);
    const initial = new URLSearchParams(location.search);
    const all = window.GM_NEIGHBORS.map(n => ({...n, country: A.related(n.id).find(p => p.category === 'country').id}));
    const byCountry = new Map(all.map(n => [n.country, n]));
    const countries = svg.querySelectorAll('.gm-country');
    const list = $('gm-neighbor-list');
    const scopes = root.querySelectorAll('[data-neighbor-scope]');
    const readout = $('gm-neighbor-readout');
    let active = false, scope = 'land', selected = 'China', quiz = false, renderedScope;
    const choices = () => all.filter(n => n.rel === scope);

    function address() {
      const url = new URL(location.href);
      if (active) {
        url.searchParams.set('neighbors', scope);
        url.searchParams.set('place', selected);
        url.searchParams.set('layer', 'home');
        url.searchParams.delete('continent');
      } else if (url.searchParams.has('neighbors')) {
        for (const key of ['neighbors', 'place', 'layer']) url.searchParams.delete(key);
      }
      if (url.href !== location.href) {
        try { history.replaceState(history.state, '', url); } catch (error) { /* 本地文件仍可继续探索 */ }
      }
    }

    function paint() {
      const showing = active && !quiz;
      const available = choices();
      root.classList.toggle('gm-neighbor-exploring', showing);
      for (const el of countries) {
        const relation = byCountry.get(el.dataset.id)?.rel;
        const home = el.dataset.id === 'China' || el.dataset.id === 'Taiwan';
        el.classList.toggle('is-neighbor-land', showing && scope === 'land' && relation === scope);
        el.classList.toggle('is-neighbor-sea', showing && scope === 'sea' && relation === scope);
        el.classList.toggle('is-neighbor-muted', showing && !home && relation !== scope);
      }
      if (renderedScope !== scope) {
        list.innerHTML = available.map(n => `<button type="button" data-neighbor-country="${esc(n.country)}">${esc(n.name)}</button>`).join('');
        renderedScope = scope;
      }
      for (const button of list.children) button.setAttribute('aria-pressed', String(showing && selected === button.dataset.neighborCountry));
      for (const button of scopes) {
        button.setAttribute('aria-pressed', String(showing && button.dataset.neighborScope === scope));
        button.disabled = quiz;
      }
      readout.hidden = list.hidden = !showing;
      const index = available.findIndex(n => n.country === selected);
      $('gm-neighbor-intro').hidden = index !== -1;
      const relation = scope === 'land' ? '陆上邻国' : '隔海相望';
      $('gm-neighbor-name').textContent = index < 0 ? `${relation} · 从中国出发`
        : `${relation} · ${available[index].name}（${index + 1}／${available.length}）`;
    }

    function stop() {
      active = false;
      paint();
      address();
    }

    function choose(id, options = {}) {
      if (quiz) return;
      active = true;
      getUI()?.choose(id, {layer: 'home', ...options});
    }

    root.addEventListener('click', event => {
      const country = event.target.closest('[data-neighbor-country]');
      const group = event.target.closest('[data-neighbor-scope]');
      const step = event.target.closest('[data-neighbor-step]');
      if (country) choose(country.dataset.neighborCountry);
      if (group) {
        scope = group.dataset.neighborScope;
        choose('China');
      }
      if (step) {
        const available = choices();
        const direction = Number(step.dataset.neighborStep);
        const index = available.findIndex(n => n.country === selected);
        const from = index === -1 && direction < 0 ? 0 : index;
        choose(available[(from + direction + available.length) % available.length].country);
      }
    });
    $('gm-neighbor-end').addEventListener('click', () => {
      stop();
      getUI().setLayer('home');
      root.querySelector('.gm-tools-jump').focus();
    });
    $('gm-neighbor-intro').textContent = window.GM_MAP_DISCOVERY.neighborIntro;
    paint();

    return {
      byCountry,
      select(id) {
        if (!active) return;
        if (id === 'China' || id === 'Taiwan') selected = 'China';
        else if (byCountry.has(id)) {
          selected = id;
          scope = byCountry.get(id).rel;
        } else {
          stop();
          return;
        }
        paint();
        address();
      },
      layerChanged(layer, isQuiz) {
        quiz = isQuiz;
        if (active && !quiz && layer !== 'home') stop();
        else paint();
      },
      restore() {
        if (!initial.has('neighbors')) return;
        scope = initial.get('neighbors') === 'sea' ? 'sea' : 'land';
        const id = initial.get('place');
        $('map-activities').open = true;
        choose(byCountry.has(id) ? id : 'China', {reveal: false});
      }
    };
  }
  return {buildRiver,atDistance,createReplay,mountChina,mountNeighbors};
})();

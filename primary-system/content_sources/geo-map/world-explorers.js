/* 时区、多点行程、物种打卡与大洲辨形；数据始终引用原档案。 */
window.GMWorldExplorers = (() => {
  'use strict';
  const G = () => window.GMWorld3DGeometry;
  function itinerary(points) {
    const legs = points.slice(1).map((p,i) => G().angle(points[i],p)*6371);
    return {legs,total:legs.reduce((sum,n)=>sum+n,0)};
  }
  function zonedTime(date, hour, zone) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(hour) || hour < 0 || hour >= 24) return null;
    const base = new Date(date+'T00:00:00Z');
    if (!Number.isFinite(+base) || base.toISOString().slice(0,10)!==date) return null;
    const instant = new Date(+base + Math.floor(hour*60+1e-7)*60000);
    const values = Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(instant).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
    const day = Math.round((Date.UTC(+values.year,+values.month-1,+values.day)-(+base))/86400000);
    return {...values,day,text:`${values.hour}：${values.minute}`,date:`${values.month}月${values.day}日`};
  }
  function outlinePath(continent) {
    const center = window.GM_WORLD_3D.continentViews[continent.id][0];
    const rings = continent.rings.map(r => r.map(([lon,lat]) => continent.id==='antarctica' ? [Math.cos(lat*Math.PI/180)*Math.sin(lon*Math.PI/180),Math.cos(lat*Math.PI/180)*Math.cos(lon*Math.PI/180)] : [G().wrap(lon-center)*Math.cos((continent.id==='europe'?50:25)*Math.PI/180),-lat]));
    const all=rings.flat(), xs=all.map(p=>p[0]),ys=all.map(p=>p[1]),minX=Math.min(...xs),minY=Math.min(...ys),maxX=Math.max(...xs),maxY=Math.max(...ys);
    const scale=Math.min(452/(maxX-minX||1),272/(maxY-minY||1));
    const dx=250-(minX+maxX)/2*scale,dy=160-(minY+maxY)/2*scale;
    return rings.map(r=>r.map((p,i)=>(i?'L':'M')+(p[0]*scale+dx).toFixed(2)+' '+(p[1]*scale+dy).toFixed(2)).join('')+'Z').join('');
  }
  function mountTime({root,setUTC}) {
    const $=id=>root.querySelector('#gw-zone-'+id),D=window.GM_WORLD_EXPEDITIONS,esc=window.GMShared.esc;
    let hour=8;
    $('date').value='2026-01-15';$('note').textContent=D.timeNote;
    function render() {
      try {
        const values=D.cities.slice(0,8).map(c=>({c,t:zonedTime($('date').value,hour,c.zone)}));
        if(values.some(v=>!v.t)){$('result').textContent='请选择有效的日期。';return;}
        $('result').innerHTML=values.map(({c,t})=>`<div><b>${esc(c.name)}</b><strong>${t.text}</strong><span>${t.date} · ${t.day<0?'前一天':t.day>0?'后一天':'UTC 当天'}</span></div>`).join('');
      } catch { $('result').textContent='当前浏览器缺少时区资料，仍可观察 UTC 昼夜。'; }
    }
    root.addEventListener('gm-world-utc',e=>{hour=e.detail.hour;render();});
    $('date').addEventListener('change',render);
    $('beijing').addEventListener('click',()=>setUTC(0));
    $('winter').addEventListener('click',()=>{$('date').value='2026-01-15';setUTC(0);});
    $('summer').addEventListener('click',()=>{$('date').value='2026-07-15';setUTC(0);});
    render();
  }
  function mountLife({root,focus,activate,render,project}) {
    const $=id=>root.querySelector('#gw-life-'+id),esc=window.GMShared.esc;
    // mount 时 currentScript 可能已结束；资源基址由主脚本传入的页面属性确定。
    const base=new URL(root.dataset.globeAssets || '.',location.href);
    const groups={animal:window.GM_WORLD_WILDLIFE.animals,plant:window.GM_WORLD_FLORA.plants};
    let storage;try{storage=localStorage;}catch{storage=null;}
    const stores=Object.fromEntries(Object.entries(groups).map(([kind,entries])=>[kind,window.GMAnimalLearning.createStore(storage,window.GMAnimalLearning.recordPrefix(kind,'world'),entries.map(a=>a.id))]));
    let active=false,kind='animal',habitat='',selected=null;
    const photo=(k,id)=>new URL(`assets/${k==='plant'?'plants':'animals'}/${id}.jpg`,base).href;
    const markers=[];
    for(const [k,entries]of Object.entries(groups))for(const a of entries){
      const b=document.createElement('button');b.type='button';b.className='gw-life-marker';b.hidden=true;b.setAttribute('aria-label',`观察${a.name}`);
      b.innerHTML=`<img src="${esc(photo(k,a.id))}" alt="" loading="lazy">`;
      b.addEventListener('click',()=>select(k,a.id));root.querySelector('#gw-life-markers').append(b);markers.push({kind:k,animal:a,button:b});
    }
    function visibleEntries(){return groups[kind].filter(a=>!habitat||a.habitat===habitat);}
    function update(){
      const entries=visibleEntries();
      $('list').innerHTML=entries.map(a=>`<button type="button" data-life-id="${a.id}" aria-pressed="${selected?.id===a.id}"><img src="${esc(photo(kind,a.id))}" alt="" loading="lazy"><span>${esc(a.name)}${stores[kind].has(a.id)?' ✓':''}</span></button>`).join('');
      const data=kind==='plant'?window.GM_WORLD_FLORA:window.GM_WORLD_WILDLIFE;
      $('habitats').innerHTML=`<button type="button" data-habitat="" aria-pressed="${!habitat}">全部环境</button>`+data.habitats.map(h=>`<button type="button" data-habitat="${h.id}" aria-pressed="${h.id===habitat}">${esc(h.name)}</button>`).join('');
      $('count').textContent=`已观察 ${stores[kind].count}／${groups[kind].length} · 当前 ${entries.length} 种`;
      $('kind').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lifeKind===kind)));
      if(selected){const a=selected;const page=(root.dataset.lifeBase || '')+(kind==='plant'?'world-plants.html?plant=':'world-animals.html?animal=');
        $('card').innerHTML=`<img src="${esc(photo(kind,a.id))}" alt="${esc(a.name)}"><div><h3>${esc(a.name)}</h3><p>${esc(a.place)}</p><p>${esc(a.home)}</p>${a.adaptation?`<p>${esc(a.adaptation)}</p>`:''}<p>${esc(a.clue)}</p><button type="button" id="gw-life-check" aria-pressed="${stores[kind].has(a.id)}">${stores[kind].has(a.id)?'✓ 已观察，点此取消':'记为已观察'}</button> <a href="${esc(page)}${encodeURIComponent(a.id)}">打开原地图档案 →</a> <a href="${esc(a.source)}" target="_blank" rel="noopener">资料出处（需联网）↗</a></div>`;
        $('check').addEventListener('click',()=>{stores[kind].toggle(a.id);update();});
      }else $('card').innerHTML='<p>点球面照片或下方照片，认识一个新朋友。</p>';
      for(const k of ['animal','plant']) root.querySelector('#gw-record-'+k).textContent=`${stores[k].count}／${groups[k].length}`;
      $('storage').textContent=stores[kind].available?'观察记录与原动植物地图共用。':'记录暂存本页，浏览器未能保存到下次。';
      render();
    }
    function select(k,id){activate('life');kind=k;selected=groups[k].find(a=>a.id===id)||null;if(selected){habitat='';focus(selected.point,selected.name);root.querySelector('#gw-tool-goal').textContent=selected.name;root.querySelector('#gw-tool-result').textContent=selected.place;}update();}
    $('kind').addEventListener('click',e=>{const b=e.target.closest('[data-life-kind]');if(b){kind=b.dataset.lifeKind;selected=null;habitat='';update();}});
    $('habitats').addEventListener('click',e=>{const b=e.target.closest('[data-habitat]');if(b){habitat=b.dataset.habitat;update();}});
    $('list').addEventListener('click',e=>{const b=e.target.closest('[data-life-id]');if(b)select(kind,b.dataset.lifeId);});
    root.querySelectorAll('[data-life-open]').forEach(b=>b.addEventListener('click',()=>{activate('life');kind=b.dataset.lifeOpen;selected=null;habitat='';update();$('panel').scrollIntoView({block:'start'});}));
    function reload(){Object.values(stores).forEach(s=>s.reload());update();}
    window.addEventListener('storage',reload);window.addEventListener('pageshow',reload);window.addEventListener('focus',reload);
    $('note').textContent=window.GM_WORLD_EXPEDITIONS.lifeNote;update();
    return {setActive(value){active=value;$('panel').hidden=!value;if(value){reload();root.querySelector('#gw-tool-goal').textContent='转动地球，看动植物的代表地点';root.querySelector('#gw-tool-result').textContent='点照片了解环境，再记下观察。';}else markers.forEach(m=>{m.button.hidden=true;});},
      position(){const occupied=[];for(const m of markers){const p=project(m.animal.point);m.button.hidden=!active||m.kind!==kind||(habitat&&m.animal.habitat!==habitat)||!p?.visible;if(m.button.hidden)continue;const box=[p.x-20,p.y-20,p.x+20,p.y+20];if(m.animal.id!==selected?.id&&occupied.some(b=>box[0]<b[2]&&box[2]>b[0]&&box[1]<b[3]&&box[3]>b[1])){m.button.hidden=true;continue;}occupied.push(box);m.button.style.left=p.x+'px';m.button.style.top=p.y+'px';}},
      pick(point){const candidates=visibleEntries().map(a=>({a,angle:G().angle(point,a.point)})).sort((a,b)=>a.angle-b.angle);if(candidates[0]?.angle<.12)select(kind,candidates[0].a.id);return true;}
    };
  }
  function mountOutline({root,activate,choose}) {
    const $=id=>root.querySelector('#gw-outline-'+id),O=window.GM_WORLD_OUTLINES,key='study_world_globe_outlines_v1',esc=window.GMShared.esc;
    const missions=O.continents.map(c=>({id:c.id,answer:c.id,hints:[c.hint]}));let saved=new Set();
    try{saved=window.GMWorldLearning.readProgress(localStorage.getItem(key),missions);}catch{}
    const round=window.GMWorldDetective.createRound(missions,saved);let active=false;
    function render(){const s=round.state(),c=O.continents.find(c=>c.id===s.mission.id),name=window.GM_CONTINENTS.find(c=>c.id===s.mission.id).name;
      $('image').innerHTML=`<path d="${outlinePath(c)}" fill-rule="evenodd"/>`;
      $('hint-text').textContent=s.hints?c.hint:'';$('progress').textContent=`已认出 ${s.found.size}／7`;
      $('answers').innerHTML=window.GM_CONTINENTS.map(c=>`<button type="button" data-outline="${c.id}"${s.status!=='asking'?' disabled':''}>${esc(c.name)}</button>`).join('');
      $('reveal').disabled=s.status!=='asking';$('hint').disabled=s.status!=='asking'||s.hints>0;$('learn').disabled=s.status==='asking';
      root.querySelector('#gw-record-outline').textContent=`${s.found.size}／7`;
      if(active){root.querySelector('#gw-tool-goal').textContent='只看轮廓，猜一个大洲';root.querySelector('#gw-tool-result').textContent=s.status==='asking'?'轮廓卡没有国界和地名。':`这是${name}，可以打开大洲档案核对。`;}
    }
    function begin(){const s=round.state();round.select(s.mission.id);$('feedback').textContent='先看形状，再选大洲。';render();}
    $('answers').addEventListener('click',e=>{const b=e.target.closest('[data-outline]');if(!b)return;const result=round.guess(b.dataset.outline);if(result==='correct'){try{localStorage.setItem(key,JSON.stringify([...round.state().found]));}catch{}$('feedback').textContent='认出来啦！可以到地球仪上对照。';}else $('feedback').textContent='再看看海岸的弯曲、突出的半岛和整体形状。';render();});
    $('hint').addEventListener('click',()=>{round.hint();render();});$('retry').addEventListener('click',begin);
    $('next').addEventListener('click',()=>{const s=round.state();round.select(missions[(s.index+1)%missions.length].id);begin();});
    $('reveal').addEventListener('click',()=>{round.reveal();render();$('feedback').textContent='已展示答案，本次不计入认出记录。重新挑战后可自己找一遍。';});
    $('learn').addEventListener('click',()=>choose(round.state().mission.id));
    root.querySelector('[data-outline-open]').addEventListener('click',()=>{activate('outline');$('panel').scrollIntoView({block:'start'});});
    $('note').textContent=O.note;render();
    return {setActive(value){active=value;$('panel').hidden=!value;if(value){round.resume();begin();}}};
  }
  return {itinerary,zonedTime,outlinePath,mountTime,mountLife,mountOutline};
})();

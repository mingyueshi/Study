/* 昼夜与四季：两个明确分开的模型，统一有限播放与手动观察。 */
'use strict';
(() => {
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0)), rad=Math.PI/180;
  function dayModel(progress) {
    const p=clamp(progress,0,1), a=p*2*Math.PI, light=Math.cos(a);
    return {x:320-105*Math.cos(a),y:180+105*Math.sin(a),hours:(12+24*p)%24,
      phase:Math.abs(light)<1e-8?'boundary':light>0?'lit':'dark'};
  }
  function seasonModel(progress,latitude=40,tilt=23.5) {
    const p=clamp(progress,0,1), a=p*2*Math.PI, t=clamp(tilt,0,23.5);
    const declination=Math.asin(Math.sin(t*rad)*Math.cos(a));
    const daylight=24*Math.acos(clamp(-Math.tan(clamp(latitude,-60,60)*rad)*Math.tan(declination),-1,1))/Math.PI;
    return {x:320-220*Math.cos(a),y:180+95*Math.sin(a),declination:declination/rad,daylight,
      axisX:Math.sin(t*rad)*45,axisY:-Math.cos(t*rad)*45};
  }
  if(typeof module!=='undefined')module.exports={dayModel,seasonModel};
  if(typeof document==='undefined')return;
  const data=typeof GEO_EARTH==='undefined'?null:GEO_EARTH, media=window.matchMedia('(prefers-reduced-motion: reduce)');
  let record=null,frame=null,previous=null,generation=0,playing=false;
  const canPlay=()=>!media.matches&&(!window.StudyEffects||window.StudyEffects.motion==='full');
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const write=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
  const button=(action,label,value='')=>`<button type="button" class="fig-btn" data-earth="${action}" data-value="${value}">${esc(label)}</button>`;
  const text=(x,y,s)=>`<text x="${x}" y="${y}" text-anchor="middle">${esc(s)}</text>`;
  const seasonText=(index,x,y,stacked=false)=>{
    const label=data.year.stops[index].label;
    if(!stacked)return text(x,y,label);
    const [month,name]=label.split('月');
    return text(x,y,month+'月')+text(x,y+22,name);
  };
  function html(){
    if(!data)return null;
    return '<section class="sci-process geo-earth" data-earth-observation aria-label="昼夜与四季观察">'+
      '<div class="fig-ctrl">'+button('mode',data.day.label,'day')+button('mode',data.year.label,'year')+'</div><p class="sci-process-prompt" data-earth-prompt></p>'+
      '<div data-earth-settings><div class="fig-ctrl">'+data.latitudes.map(l=>button('latitude',l.label,l.value)).join('')+'</div><div class="fig-ctrl">'+button('tilt','地轴倾斜约 23.5°','23.5')+button('tilt','对照：地轴不倾斜','0')+'</div></div>'+
      '<div class="fig-ctrl"><button type="button" class="fig-btn" data-earth="play" aria-pressed="false" hidden>播放一圈</button>'+button('previous','退四分之一圈')+button('next','进四分之一圈')+button('reset','回到开始')+'</div>'+
      '<div class="sci-demo-stage" tabindex="0" role="region" aria-label="地球图示，可横向滚动"><svg class="fig-svg sci-process-svg" viewBox="0 0 640 350" role="img" data-earth-svg><g data-earth-scene></g></svg></div><p class="sci-scroll-hint">左右滑动图示，看完整个观察场景。</p>'+
      '<p class="sci-process-readout" data-earth-reading></p><div class="fig-ctrl" data-earth-stops></div><p class="sci-observation" data-earth-note role="status"></p>'+
      '<label class="sci-experiment-range">本圈进度 <output data-earth-output></output><input type="range" data-earth-progress min="0" max="100" step="1" value="0" aria-label="本圈进度"></label><p class="sci-process-status" data-earth-status role="status"></p><p class="sci-model-note" data-earth-model></p>'+
      '<details class="sci-demo-sources"><summary>资料出处（需联网）</summary>'+data.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>`).join(' · ')+'</details></section>';
  }
  function build(){
    const r=record,root=r.root;
    root.querySelector('[data-earth-settings]').hidden=r.mode==='day';
    write(root.querySelector('[data-earth-prompt]'),data[r.mode].prompt);
    write(root.querySelector('[data-earth-model]'),data[r.mode].model);
    root.querySelector('[data-earth-stops]').innerHTML=data[r.mode].stops.map(s=>button('stop',s.label,s.progress)).join('');
    root.querySelector('[data-earth-svg]').setAttribute('aria-label',r.mode==='day'?'北极俯视的昼夜模型，日光从左照来，橙点沿逆时针转动':'公转斜俯视模型，地轴朝向保持一致，示意昼长见图下文字');
    root.querySelector('[data-earth-scene]').innerHTML=r.mode==='day'?
      '<rect x="8" y="8" width="624" height="334" rx="16" fill="#f2f7fb"/><circle cx="70" cy="180" r="34" fill="#ffd16b"/>'+text(70,244,'太阳')+
      '<path d="M117 120H197m-10-5 10 5-10 5M117 180H197m-10-5 10 5-10 5M117 240H197m-10-5 10 5-10 5" fill="none" stroke="#c79026" stroke-width="3"/>'+
      '<circle cx="320" cy="180" r="110" fill="#a9d9e9"/><path d="M320 70A110 110 0 0 1 320 290Z" fill="#304d72"/>'+text(267,155,'昼')+'<text x="370" y="155" text-anchor="middle" style="fill:#fff">夜</text>'+
      '<circle cx="320" cy="180" r="5" fill="#fff"/>'+text(320,48,'从北极上方看')+
      '<path d="M228 75A140 140 0 0 0 181 180m-5-10 5 10 7-9" fill="none" stroke="#688b72" stroke-width="3"/>'+text(496,97,'自西向东自转')+
      '<circle data-earth-dot r="9" fill="#cf6827" stroke="#fff" stroke-width="3"/>'+text(320,330,'橙点：赤道上的一个地点'):
      '<rect x="8" y="8" width="624" height="334" rx="16" fill="#f4f8ee"/><ellipse cx="320" cy="180" rx="220" ry="95" fill="none" stroke="#adbea7" stroke-dasharray="6 7" stroke-width="2"/>'+
      '<circle cx="320" cy="180" r="38" fill="#ffd16b"/>'+text(320,186,'太阳')+
      '<g data-earth-globe><circle r="27" fill="#a9d9e9" stroke="#538995"/><path data-earth-equator fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="4 3"/><path data-earth-axis stroke="#94602a" stroke-width="3"/><text data-earth-north>北</text></g>'+
      seasonText(0,38,176,true)+seasonText(1,320,341)+seasonText(2,602,176,true)+seasonText(3,320,24);
    draw();
  }
  function draw(){
    const r=record,root=r.root,p=r.progress,phase=Math.round(p*4)%4,atStop=Math.abs(p*4-Math.round(p*4))<1e-7;
    let reading,note;
    if(r.mode==='day'){
      const m=dayModel(p),dot=root.querySelector('[data-earth-dot]');dot.setAttribute('cx',m.x);dot.setAttribute('cy',m.y);
      const minutes=Math.round(m.hours*60)%1440;
      reading=`赤道地点的示意时刻 ${String(Math.floor(minutes/60)).padStart(2,'0')}：${String(minutes%60).padStart(2,'0')} · ${m.phase==='lit'?'白昼':m.phase==='dark'?'黑夜':'明暗交界'}`;
      note=atStop?data.day.stops[phase].note:data.day[m.phase];
    }else{
      const m=seasonModel(p,r.latitude,r.tilt),globe=root.querySelector('[data-earth-globe]');
      globe.setAttribute('transform',`translate(${m.x} ${m.y})`);
      root.querySelector('[data-earth-equator]').setAttribute('d',`M${m.axisY*.6} ${-m.axisX*.6}L${-m.axisY*.6} ${m.axisX*.6}`);
      root.querySelector('[data-earth-axis]').setAttribute('d',`M${-m.axisX} ${-m.axisY}L${m.axisX} ${m.axisY}`);
      const north=root.querySelector('[data-earth-north]');north.setAttribute('x',m.axisX+5);north.setAttribute('y',m.axisY+10);
      const direct=Math.abs(m.declination)<.05?'赤道附近':`${m.declination>0?'北纬':'南纬'} ${Math.abs(m.declination).toFixed(1)}°`;
      reading=`太阳直射 ${direct} · ${data.latitudes.find(l=>l.value===r.latitude).label}：昼约 ${m.daylight.toFixed(1)} 小时，夜约 ${(24-m.daylight).toFixed(1)} 小时`;
      note=r.tilt===0?data.year.untilt:atStop?data.year.stops[phase].note:data.year.between;
    }
    write(root.querySelector('[data-earth-reading]'),reading);write(root.querySelector('[data-earth-note]'),note);
    root.querySelector('[data-earth-progress]').value=Math.round(p*100);write(root.querySelector('[data-earth-output]'),`${Math.round(p*100)}%`);
    for(const action of ['mode','latitude','tilt'])root.querySelectorAll(`[data-earth="${action}"]`).forEach(b=>b.setAttribute('aria-pressed',String(String(r[action])===b.dataset.value)));
    root.querySelectorAll('[data-earth="stop"]').forEach(b=>b.setAttribute('aria-pressed',String(atStop&&Number(b.dataset.value)===phase/4)));
    sync();
  }
  function sync(){
    if(!record)return;
    const root=record.root,done=record.progress>=1,b=root.querySelector('[data-earth="play"]');
    write(b,playing?'暂停观察':done?'再看一圈':'播放一圈');b.disabled=!canPlay();b.setAttribute('aria-pressed',String(playing));
    root.querySelector('[data-earth="previous"]').disabled=record.progress<=0;root.querySelector('[data-earth="next"]').disabled=done;
    write(root.querySelector('[data-earth-status]'),!canPlay()?'已减少动效，可选位置或拖动进度观察。':playing?'正在播放，可随时暂停。':done?'这一圈结束，可以回看任意位置。':'已暂停，可选择位置或播放一圈。');
  }
  function pause(){generation++;playing=false;if(frame!==null)window.cancelAnimationFrame(frame);frame=previous=null;sync();}
  function play(){
    if(!record||!canPlay()||document.hidden||!record.host.isConnected)return;
    pause();window.SciProcess?.pause();if(record.progress>=1)record.progress=0;playing=true;draw();const token=++generation;
    const tick=now=>{if(token!==generation||!playing)return;if(!canPlay()||document.hidden||!record.host.isConnected){pause();return;}
      if(previous!==null)record.progress=Math.min(1,record.progress+Math.max(0,Math.min(100,now-previous))/12000);
      previous=now;draw();if(record.progress>=1){pause();return;}frame=window.requestAnimationFrame(tick);};
    frame=window.requestAnimationFrame(tick);
  }
  function dispose(){if(!record)return;pause();record.unwatch?.();record.root.removeEventListener('click',record.click);record.root.removeEventListener('input',record.input);record=null;}
  function mount(host){
    if(!data||record?.host===host)return;dispose();const root=host.querySelector('[data-earth-observation]');if(!root)return;
    record={host,root,mode:'year',latitude:40,tilt:data.tilt,progress:0};build();
    record.click=e=>{const b=e.target.closest('[data-earth]');if(!b||b.disabled)return;const a=b.dataset.earth;
      if(a==='play'){if(playing)pause();else play();return;}pause();
      if(a==='mode'){record.mode=b.dataset.value;record.progress=0;build();}
      else if(a==='latitude'||a==='tilt'){record[a]=Number(b.dataset.value);draw();}
      else{record.progress=a==='reset'?0:a==='stop'?Number(b.dataset.value):clamp((a==='next'?Math.floor(record.progress*4+1e-8)+1:Math.ceil(record.progress*4-1e-8)-1)/4,0,1);draw();}};
    record.input=e=>{if(!e.target.matches('[data-earth-progress]'))return;pause();record.progress=clamp(e.target.value,0,100)/100;draw();};
    root.addEventListener('click',record.click);root.addEventListener('input',record.input);
    if(window.StudyEffects?.watch)record.unwatch=window.StudyEffects.watch(host,pause);
    else if(typeof IntersectionObserver==='function'){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>!e.isIntersecting))pause();});observer.observe(host);record.unwatch=()=>observer.disconnect();}
    root.querySelector('[data-earth="play"]').hidden=false;
  }
  const changed=()=>{if(!canPlay())pause();sync();};
  document.addEventListener('study:effects-change',changed);media.addEventListener('change',changed);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('pagehide',pause);
  window.GeoEarth={html,mount,pause,dispose};
})();

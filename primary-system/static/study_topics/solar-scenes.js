/* 三候和地方习俗的有限简笔画；讲解复用节气文件源。 */
(() => {
  'use strict';
  const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
  function timelineFrame(progress,all,index){const p=clamp(progress),n=all?Math.min(3,Math.floor(p*4)):index;return {index:n,position:all?(p===1?1:p*4-n):p};}
  function picture(kind,progress){
    const fading=kind==='rainbow-hide'||kind==='thunder-quiet';if(kind==='rainbow-hide')kind='rainbow';if(kind==='thunder-quiet')kind='thunder';const t=clamp(progress),wave=Math.sin(t*Math.PI*4),rise=1-t;
    const path=(d,fill='none',stroke='#466653',width=3)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const circle=(x,y,r,fill)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
    const bird=(x,y,scale=1)=>`<g transform="translate(${x} ${y}) scale(${scale})">${path(`M-20 ${wave*7}Q-8 -15 0 0Q12 -16 26 ${-wave*7}`)}${circle(1,0,3,'#466653')}</g>`;
    const leaf=(x,y,color='#86ad6e')=>`<g transform="translate(${x} ${y})">${path('M0 0Q-18 -28 -28 -15Q-24 4 0 0Q12 -27 29 -18Q27 5 0 0',color)}</g>`;
    const water=()=>path(`M20 125Q55 ${120+wave*3} 90 125T160 125T230 125T300 125`,'none','#76a4b0',3);
    const fish=(x,y)=>`<g transform="translate(${x} ${y})">${path('M-24 0Q0 -24 25 0Q0 24 -24 0L-39 -14V14Z','#a9ced0')}${circle(13,-3,2,'#304d49')}</g>`;
    const plant=(flower=false,color='#eda2ad')=>`${path(`M160 136Q${150+wave*3} 95 160 ${90-t*45}`)}${leaf(158,112-t*14)}${flower?`<g transform="translate(160 ${90-t*45})">${[0,60,120,180,240,300].map(a=>`<ellipse rx="9" ry="17" fill="${color}" stroke="#8c6670" stroke-width="1.5" transform="rotate(${a}) translate(0 -11) scale(${.45+t*.55})"/>`).join('')}${circle(0,0,7,'#edc877')}</g>`:leaf(160,90-t*45)}`;
    let body='';
    if(['bird','nest'].includes(kind)){body=bird(65+t*155,67,1.2);if(kind==='nest')body+=path('M115 125Q155 161 199 125M119 132L190 139M124 143L181 128','#d5b88b');}
    else if(['fish','otter','pond','spring','drypond','ice','thaw'].includes(kind)){
      body=water();if(kind==='fish'||kind==='otter')body+=fish(70+t*150,111);
      if(kind==='otter')body+=path('M195 119Q185 90 199 84Q216 77 224 101Q237 110 249 105Q244 130 217 127Z','#b6977a');
      if(kind==='pond')for(let i=0;i<5;i++)body+=leaf(65+i*43,123+(i%2)*5,'#9fbb76');
      if(kind==='spring')body+=path(`M140 123Q120 ${85-t*25} 145 85Q165 77 169 115M182 122Q194 93 204 115`,'none','#76a4b0');
      if(kind==='drypond')body+=path(`M40 ${115+t*22}Q160 ${140+t*7} 280 ${115+t*22}`,'#dce8df','#97b6ae');
      if(kind==='ice'||kind==='thaw'){const frozen=kind==='thaw'?1-t:t;body+=path(`M28 118L${28+frozen*265} 118L${22+frozen*265} 125H28Z`,'#d5edf2','#8baebc',2);}
    }
    else if(['sprout','blossom','chrysanthemum','wilt','leaf'].includes(kind)){
      body=plant(kind==='blossom'||kind==='chrysanthemum',kind==='chrysanthemum'?'#eac254':'#eda2ad');
      if(kind==='wilt')body=`<g transform="rotate(${t*35} 160 135)">${plant()}</g>`;
      if(kind==='leaf')body+=`<g transform="translate(${t*40} ${t*68}) rotate(${t*100} 110 65)">${leaf(110,65,'#d3a15f')}</g>`;
    }
    else if(['wheat','seedlings'].includes(kind)){
      for(let i=0;i<6;i++){const x=55+i*40,h=kind==='wheat'?55+t*25:15+t*38;body+=path(`M${x} 138V${138-h}`)+leaf(x,120-h/3);if(kind==='wheat')for(let j=0;j<4;j++)body+=`<ellipse cx="${x+(j%2?6:-6)}" cy="${138-h+j*9}" rx="5" ry="9" fill="#e3bd62" transform="rotate(${j%2?30:-30} ${x} ${138-h+j*9})"/>`;}
    }
    else if(['bug','burrow','worm','cicada','chicken'].includes(kind)){
      if(kind==='worm')body=path(`M60 135Q80 ${108+wave*9} 100 130T145 128T190 132T235 125`,'none','#b9947e',7);
      else if(kind==='chicken')body=`<g transform="translate(${60+t*75} 0)">${path('M60 118Q38 98 55 77Q65 58 82 77Q104 74 106 101Q90 129 60 118Z','#efddae')}${circle(85,77,2,'#466653')}${path('M74 120V137M91 118V135')}</g>`;
      else body=`<g transform="translate(${t*65} 0)">${path('M100 115L83 98M100 126L82 138M129 115L147 99M129 126L148 138')}${circle(110,119,19,'#a1b28b')}${circle(130,115,10,'#b9c89e')}${path(`M110 111Q90 ${80+wave*5} 84 111M115 110Q136 ${80-wave*5} 141 111`,'#d4debd')}</g>`;
    }
    else if(['thunder','lightning','rain','rainbow','winter','frost','wind','dew'].includes(kind)){
      if(kind==='wind')body=path(`M${35+t*28} 75Q120 58 228 75Q256 77 247 58M35 105Q130 88 252 105M70 125H200`,'none','#87a5a5');
      else if(kind==='dew'){body=plant();for(let i=0;i<3;i++)body+=circle(140+i*18,97+i*9,3+t*3,'#8cbfcd');}
      else if(kind==='frost')for(let i=0;i<6;i++){const x=50+i*43;body+=path(`M${x} 114V140M${x-9} 121L${x+9} 133M${x+9} 121L${x-9} 133`,'none','#92b7c4',2);}
      else if(kind==='rainbow')for(let i=0;i<5;i++)body+=`<path d="M${60+i*7} 125A${100-i*7} ${85-i*7} 0 0 1 ${260-i*7} 125" fill="none" stroke="${['#dba69a','#e7bd79','#e4d58f','#a0bb8a','#91b5c7'][i]}" stroke-width="7" opacity="${.35+t*.65}"/>`;
      else {body=path('M86 79Q67 53 96 43Q114 20 139 40Q166 32 177 53Q208 57 191 80Z','#d7e2df','#8fa9a4',2);if(['thunder','lightning'].includes(kind))body+=path(`M145 80L125 ${99+wave*2}H145L130 127L172 91H150L168 79`,'#eac96d','#bb9e4a',2);if(['rain','winter'].includes(kind))for(let i=0;i<9;i++){const y=83+(i*21+t*65)%61,x=87+i*15;body+=kind==='rain'?path(`M${x} ${y}l-5 9`,'none','#7fa9bc',2):circle(x,y,3,'#b4d1d5');}}
    }
    else if(['animal','deer','cow'].includes(kind)){
      body=`<g transform="translate(${t*24} 0)">${path('M86 90Q115 67 166 90L178 68L197 70L205 92L179 101L171 129H161L159 108H109L101 133H91L94 107Z',kind==='cow'?'#b7a189':'#c9b18c')}${path('M100 91L74 75')}${kind==='deer'?`<g transform="translate(${t*14} ${t*26})">${path('M183 68V44M183 54L172 46M183 54L193 42')}</g>`:kind==='cow'?path('M181 68Q168 58 173 52M191 68Q205 57 198 50'):path('M178 69L176 57L187 64M191 64L200 58L199 73')}${circle(194,78,2,'#466653')}</g>`;
    }
    else if(kind==='old-saying')body=path('M65 70Q108 49 158 70Q208 49 253 70V137Q203 116 158 137Q110 116 65 137Z','#f8efd3')+path('M158 70V137')+`<text x="160" y="105" text-anchor="middle" fill="#6f715c" font-size="19">古人的想象</text>`+`<g transform="translate(0 ${-rise*12})">${circle(160,35,19,'#e9dfbf')}<text x="160" y="42" text-anchor="middle" fill="#6f715c" font-size="20">？</text></g>`;
    else if(['boat','fishing','kite','waterwheel','visit','nine','papercut','moon'].includes(kind)){
      if(kind==='boat'||kind==='fishing')body=water()+`<g transform="translate(${t*45} 0)">${path('M68 105H216L192 128H95Z','#c5a171')}${path('M151 105V45L202 95H151','#e5d6ad')}</g>`;
      if(kind==='kite')body=path(`M105 143Q156 110 ${195+wave*7} 60`)+path(`M${195+wave*7} 27l28 24-27 30-28-28Z`,'#e5a48b');
      if(kind==='waterwheel')body=water()+`<g transform="rotate(${t*180} 160 88)"><circle cx="160" cy="88" r="49" fill="none" stroke="#9e855e" stroke-width="6"/>${[0,45,90,135].map(a=>`<path d="M110 88H210" stroke="#9e855e" stroke-width="4" transform="rotate(${a} 160 88)"/>`).join('')}</g>`;
      if(kind==='visit')for(let i=0;i<3;i++)body+=`<g transform="translate(${80+i*73+(i===0?t*20:0)} 0)">${circle(0,66,13,'#dfc4a1')}${path('M0 80V118M-18 100L0 88L19 102M0 118L-14 140M0 118L15 140')}</g>`;
      if(kind==='nine')for(let i=0;i<81;i++)body+=`<circle cx="${85+i%9*18}" cy="${29+Math.floor(i/9)*13}" r="4" fill="${i<Math.ceil(t*81)?'#cf806b':'#efe4d2'}"/>`;
      if(kind==='papercut')body=`<g transform="translate(160 87) rotate(${wave*3})">${path('M0 -57L18 -22L55 -20L28 8L36 46L0 28L-36 46L-28 8L-55 -20L-18 -22Z','#ce7469','#a95954',2)}${circle(0,0,10,'#fff8df')}</g>`;
      if(kind==='moon')body=circle(160,71+rise*24,35,'#edce87')+path('M90 139H233M116 137V113H206V137M129 111V96H193V111','#d3bc92');
    }
    else {
      body=path('M83 122Q160 160 238 122V113H83Z','#e6d4b7','#a18c6a',2);
      if(kind==='tea')body+=path('M107 74H194V116Q149 141 107 115Z','#d4e0c7')+path('M194 85Q231 84 219 109Q211 120 195 112');
      else if(kind==='pear')body+=path('M160 44Q141 38 137 70Q104 110 143 119Q190 130 199 100Q203 79 178 66Q178 39 160 44Z','#e3d28b');
      else if(kind==='egg')body+=`<ellipse cx="160" cy="91" rx="30" ry="39" fill="#eddbaf" stroke="#ad9673" stroke-width="2" transform="rotate(${wave*4} 160 122)"/>`;
      else if(kind==='watermelon')body+=path('M106 69Q159 172 219 69Z','#d5df99')+path('M113 74Q163 150 211 74Z','#d88c83');
      else if(kind==='persimmon')body+=circle(160,92,33,'#de9d64')+leaf(160,62);
      else if(kind==='meat')for(let i=0;i<3;i++)body+=path(`M${110+i*45} 49V71Q${95+i*45} 105 ${111+i*45} 122Q${129+i*45} 116 ${120+i*45} 80Z`,'#c59680','#a67565',2);
      else if(kind==='dumplings')for(let i=0;i<3;i++)body+=path(`M${102+i*39} 113q18 -45 37 0q-18 12 -37 0`,'#eee2c9','#b0a18c',2);
      else if(kind==='noodles')for(let i=0;i<7;i++)body+=path(`M${111+i*13} 112q-12 -12 0 -24t0 -20`,'none','#d6bd8c',3);
      else for(let i=0;i<14;i++)body+=circle(108+i%7*16,109-Math.floor(i/7)*12,5,'#e9e4c5');
      if(['tea','rice','noodles','dumplings'].includes(kind))body+=path(`M131 ${51-rise*10}q-10 -10 0 -23M177 ${48-rise*10}q-10 -9 0 -22`,'none','#b3c5bd',2);
    }
    if(['pear','persimmon','watermelon'].includes(kind))body=`<g transform="translate(0 ${-rise*14})" opacity="${.4+t*.6}">${body}</g>`;
    if(kind==='meat')body=`<g transform="rotate(${wave*4} 160 50)">${body}</g>`;
    if(kind==='frost')body=`<g opacity="${.2+t*.8}">${body}</g>`;
    if(kind==='burrow')body=path('M80 144Q70 91 113 91Q150 95 142 144Z','#8b7d67','#8b7d67')+`<g opacity="${1-t}" transform="translate(${-t*43} 0)">${body}</g>`;
    if(fading)body=`<g opacity="${1-t*.85}">${body}</g>`;
    return `<svg viewBox="0 0 320 170" role="img" aria-label="节气简笔画示意"><path d="M18 144H302" stroke="#b6c7aa" stroke-width="2" stroke-linecap="round"/>${body}</svg>`;
  }
  if(typeof module!=='undefined')module.exports={picture,timelineFrame};
  if(typeof window==='undefined')return;
  function mount({hall,data,config}){
    const records=[],media=matchMedia('(prefers-reduced-motion: reduce)');let active=null,frame=null,previous=null,generation=0;
    const canPlay=()=>!media.matches&&(!window.StudyEffects||window.StudyEffects.motion==='full');
    function sync(r){for(const b of r.root.querySelectorAll('[data-scene-play]')){const on=active===r&&b.dataset.scenePlay===r.mode;b.disabled=!canPlay();b.setAttribute('aria-pressed',String(on));b.textContent=on?'暂停演示':b.dataset.scenePlay==='all'?'连看四幅':'播放这一幅';}r.root.querySelector('[data-scene-status]').textContent=!canPlay()?'已减少动态，仍可点选四幅画。':active===r?'正在播放，可以随时暂停。':r.progress>=1?'这一轮看完了，可以重新播放。':'点一幅画慢慢看，或播放观察变化。';}
    function draw(r,index,t){r.index=index;r.root.dataset.sceneIndex=String(index);const item=r.items[index];r.root.querySelector('[data-scene-picture]').innerHTML=picture(item.scene,t);r.root.querySelector('[data-scene-picture] svg').setAttribute('aria-label',item.name+'：'+item.note);r.root.querySelector('[data-scene-note]').textContent=`${index<3?['初候','二候','三候'][index]+' · ':''}${item.name}：${item.note}`;r.root.querySelectorAll('[data-scene-step]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.sceneStep)===index)));}
    function pause(){if(!active)return;const r=active;active=null;generation++;if(frame!==null)cancelAnimationFrame(frame);frame=previous=null;sync(r);}
    function play(r,mode){
      if(!canPlay()||document.hidden)return;pause();if(r.mode!==mode||r.progress>=1)r.progress=0;r.mode=mode;active=r;sync(r);previous=null;const box=r.root.querySelector('[data-scene-picture]').getBoundingClientRect();if(box.top<0||box.bottom>innerHeight)r.root.querySelector('[data-scene-picture]').scrollIntoView({block:'center',behavior:'instant'});
      const token=++generation;frame=requestAnimationFrame(function tick(now){if(token!==generation||active!==r)return;frame=null;if(!r.root.open||r.root.closest('.solar-card').hidden||document.hidden||!canPlay()){pause();return;}if(previous!==null)r.progress=Math.min(1,r.progress+Math.min(100,now-previous)/(config.seconds*1000*(mode==='all'?4:1)));previous=now;const point=timelineFrame(r.progress,mode==='all',r.index);draw(r,point.index,point.position);if(r.progress>=1){pause();return;}frame=requestAnimationFrame(tick);});
    }
    for(const term of data){
      const root=hall.querySelector('#'+term.id+' [data-scenes]');const r={root,index:0,mode:'single',progress:0,items:[...term.phenology,{name:'地方习俗',note:term.custom,scene:term.custom_scene}]};
      const toggle=()=>{if(!root.open&&active===r)pause();if(root.open&&!r.initialized){draw(r,0,.6);r.initialized=true;sync(r);}};
      const click=e=>{const step=e.target.closest('[data-scene-step]'),b=e.target.closest('[data-scene-play]');if(step){pause();r.progress=0;r.mode='single';draw(r,Number(step.dataset.sceneStep),.6);sync(r);}if(b&&!b.disabled){if(active===r&&r.mode===b.dataset.scenePlay)pause();else play(r,b.dataset.scenePlay);}};
      root.addEventListener('toggle',toggle);root.addEventListener('click',click);r.cleanup=()=>{root.removeEventListener('toggle',toggle);root.removeEventListener('click',click);};
      const offscreen=()=>{if(active===r)pause();};if(window.StudyEffects?.watch)r.unwatch=StudyEffects.watch(root,offscreen);else if(typeof IntersectionObserver==='function'){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>!e.isIntersecting))offscreen();});observer.observe(root);r.unwatch=()=>observer.disconnect();}
      sync(r);records.push(r);
    }
    const preference=()=>{if(!canPlay())pause();records.forEach(sync);},hidden=()=>{if(document.hidden)pause();};
    const filtered=()=>{if(active?.root.closest('.solar-card').hidden)pause();};
    hall.addEventListener('solar:pause',pause);hall.addEventListener('solar:filter',filtered);document.addEventListener('study:effects-change',preference);media.addEventListener('change',preference);document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',pause);
    return {pause,dispose(){pause();for(const r of records){r.cleanup();r.unwatch?.();}hall.removeEventListener('solar:pause',pause);hall.removeEventListener('solar:filter',filtered);document.removeEventListener('study:effects-change',preference);media.removeEventListener('change',preference);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',pause);}};
  }
  window.SolarScenes={mount};
})();

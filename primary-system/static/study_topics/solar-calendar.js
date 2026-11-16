/* 交节时刻按本地天文引擎计算，显示与日期边界固定为北京时间。 */
(() => {
  'use strict';
  const day=86400000;
  const dateKey=value=>new Date(Number(value)+8*3600000).toISOString().slice(0,10);
  function createCalendar(terms,engine){
    const cache=new Map();
    function events(year){
      if(!cache.has(year))cache.set(year,terms.map(term=>{
        const [,month,date]=term.date.match(/^(\d+)月(\d+)日$/);
        const hit=engine.SearchSunLongitude(term.solarLongitude,new Date(Date.UTC(year,Number(month)-1,Number(date)-4)),8);
        if(!hit)throw Error('未找到交节时刻：'+term.id);
        return {term,time:hit.date.getTime()};
      }).sort((a,b)=>a.time-b.time));
      return cache.get(year);
    }
    function at(value){
      const now=new Date(value).getTime();if(!Number.isFinite(now))throw Error('时钟不可用');
      const year=Number(dateKey(now).slice(0,4));if(year<1900||year>2100)throw Error('超出支持年份');
      const sequence=[...events(year-1),...events(year),...events(year+1)];
      const index=sequence.findIndex(e=>e.time>now);
      return {now,current:sequence[index-1],next:sequence[index]};
    }
    return {events,at};
  }
  function countdown(milliseconds){
    const ms=Math.max(0,milliseconds),days=Math.floor(ms/day),hours=Math.floor(ms%day/3600000),minutes=Math.floor(ms%3600000/60000);
    return days?`${days} 天 ${hours} 小时`:hours?`${hours} 小时 ${minutes} 分钟`:ms>=60000?`${Math.ceil(ms/60000)} 分钟`:'不到 1 分钟';
  }
  if(typeof module!=='undefined')module.exports={createCalendar,countdown,dateKey};
  if(typeof window==='undefined')return;
  function mount({hall,terms,data,onCurrent,onObserve}){
    const get=id=>document.getElementById(id),panel=get('solar-current-panel');let current='',timer=null,calendar;
    const format=time=>new Date(time).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false});
    try{if(!window.Astronomy)throw Error();calendar=createCalendar(data,window.Astronomy);}catch{}
    function update(){
      try{
        if(!calendar)throw Error();const state=calendar.at(new Date());current=state.current.term.id;
        panel.dataset.currentTerm=current;get('solar-current-name').textContent=state.current.term.name;
        get('solar-current-date').textContent=`${dateKey(state.now)} · 北京时间`;
        get('solar-current-range').textContent=`${format(state.current.time)}起，至${format(state.next.time)}交节。`;
        get('solar-next-name').textContent=state.next.term.name;get('solar-countdown').textContent=countdown(state.next.time-state.now);
        for(const [id,t]of terms){const active=id===current;t.card.classList.toggle('is-current-term',active);t.card.querySelector('.solar-current-badge').hidden=!active;}
        for(const a of hall.querySelectorAll('.solar-index a[href^="#"]')){if(a.getAttribute('href')==='#'+current)a.setAttribute('aria-current','date');else a.removeAttribute('aria-current');}
        get('solar-current-jump').disabled=get('solar-current-observe').disabled=false;
      }catch{current='';delete panel.dataset.currentTerm;for(const t of terms.values()){t.card.classList.remove('is-current-term');t.card.querySelector('.solar-current-badge').hidden=true;}hall.querySelectorAll('.solar-index [aria-current]').forEach(a=>a.removeAttribute('aria-current'));get('solar-current-name').textContent='暂时无法读取交节时刻';get('solar-current-range').textContent='可以继续查看节气卡和观察日记，请检查设备日期后刷新。';get('solar-next-name').textContent='—';get('solar-countdown').textContent='—';get('solar-current-jump').disabled=get('solar-current-observe').disabled=true;}
    }
    const jump=()=>{if(current)onCurrent(current);},observe=()=>{if(current)onObserve(current);};
    get('solar-current-jump').addEventListener('click',jump);get('solar-current-observe').addEventListener('click',observe);
    const refresh=()=>{if(!document.hidden)update();};
    const start=()=>{refresh();if(timer===null)timer=setInterval(refresh,60000);};
    const stop=()=>{if(timer!==null)clearInterval(timer);timer=null;};
    document.addEventListener('visibilitychange',refresh);window.addEventListener('pagehide',stop);window.addEventListener('pageshow',start);start();
    return {update,dispose(){stop();document.removeEventListener('visibilitychange',refresh);window.removeEventListener('pagehide',stop);window.removeEventListener('pageshow',start);get('solar-current-jump').removeEventListener('click',jump);get('solar-current-observe').removeEventListener('click',observe);}};
  }
  window.SolarCalendar={mount,dateKey};
})();

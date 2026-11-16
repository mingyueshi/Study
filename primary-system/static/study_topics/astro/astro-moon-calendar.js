/* 按日期计算月相；本地 Astronomy Engine 计算，无需天象接口。 */
'use strict';
(() => {
  const day=86400000;
  const beijingKey=date=>new Date(date.getTime()+8*3600000).toISOString().slice(0,10);
  function parseDate(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
    const [y,m,d]=value.split('-').map(Number),date=new Date(Date.UTC(y,m-1,d,12));
    return y>=1900&&y<=2100&&beijingKey(date)===value?date:null;
  }
  function moonAt(value,engine){
    const date=typeof value==='string'?parseDate(value):value;
    if(!(date instanceof Date)||!Number.isFinite(date.getTime())||date.getUTCFullYear()<1900||date.getUTCFullYear()>2100)return null;
    return {phase:engine.MoonPhase(date)/360,fraction:engine.Illumination('Moon',date).phase_fraction,date:beijingKey(date),instant:date.toISOString()};
  }
  if(typeof module!=='undefined')module.exports={parseDate,moonAt,beijingKey};
  if(typeof window==='undefined')return;
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const data=typeof ASTRO_LAB==='undefined'?null:ASTRO_LAB;
  function html(){if(!data||!window.Astronomy)return '';return `<div class="astro-date-tools"><label>选日期看月相<input type="date" data-moon-date min="${data.moon.minYear}-01-01" max="${data.moon.maxYear}-12-31" aria-label="选择月相日期"></label><div class="fig-ctrl"><button type="button" class="fig-btn" data-moon-day="-1">前一天</button><button type="button" class="fig-btn" data-moon-now>看此刻</button><button type="button" class="fig-btn" data-moon-day="1">后一天</button></div><p data-moon-date-status role="status"></p><p class="astro-observe-model">${esc(data.moon.note)}</p></div>`;}
  function mount(root,apply){
    const input=root.querySelector('[data-moon-date]');if(!input||!window.Astronomy)return null;
    const status=root.querySelector('[data-moon-date-status]');let mode='now';
    const update=(value,passive=false)=>{
      const result=moonAt(value,window.Astronomy);
      if(!result){status.textContent=`请选择 ${data.moon.minYear}—${data.moon.maxYear} 年之间的有效日期。`;return;}
      mode=value instanceof Date?'now':'date';input.value=result.date;
      const time=mode==='now'?new Date(result.instant).toLocaleTimeString('zh-CN',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit'}):'20:00';
      result.label=`${result.date} · 北京时间 ${time}${mode==='now'?' · 此刻':' · 当日晚间'}`;
      status.textContent=result.label;root.dataset.moonCalendarDate=result.date;root.dataset.moonMode=mode;
      root.querySelector('[data-moon-day="-1"]').disabled=result.date===`${data.moon.minYear}-01-01`;
      root.querySelector('[data-moon-day="1"]').disabled=result.date===`${data.moon.maxYear}-12-31`;
      apply(result,passive);
    };
    const change=()=>update(input.value);
    const click=e=>{if(e.target.closest('[data-moon-now]'))update(new Date());const b=e.target.closest('[data-moon-day]');if(b&&!b.disabled){const from=parseDate(input.value);if(from)update(beijingKey(new Date(from.getTime()+Number(b.dataset.moonDay)*day)));}};
    const refresh=()=>{if(mode==='now'&&!document.hidden&&root.isConnected)update(new Date(),true);};
    input.addEventListener('change',change);root.addEventListener('click',click);document.addEventListener('visibilitychange',refresh);
    const timer=window.setInterval(refresh,60000);update(new Date(),true);
    return {manual(){mode='manual';root.dataset.moonMode=mode;delete root.dataset.moonCalendarDate;status.textContent=data.moon.manualNote;},dispose(){window.clearInterval(timer);input.removeEventListener('change',change);root.removeEventListener('click',click);document.removeEventListener('visibilitychange',refresh);}};
  }
  window.AstroMoonCalendar={html,mount};
})();

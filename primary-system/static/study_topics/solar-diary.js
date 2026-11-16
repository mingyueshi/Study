/* 家乡日记按独立条目保存；旧版每节气一页仍使用原键，阅读时不迁移或改写。 */
(() => {
  'use strict';
  const prefix='study_solar_diary_v2:',oldPrefix='study_solar_note_v1:',homeKey='study_solar_hometown_v1';
  function validDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value&&value>='1900-01-01'&&value<='2100-12-31';}
  function createStore(storage,termIds,weather){
    const known=new Set(termIds),allowed=new Set(weather);
    const keyFor=id=>id.startsWith('legacy-')&&known.has(id.slice(7))?oldPrefix+id.slice(7):prefix+id;
    function normalize(value){
      if(!known.has(value.term)||!/^[a-z0-9-]{1,80}$/.test(value.id)||!validDate(value.date))throw Error('请填写有效的观察日期。');
      const result={version:2,id:value.id,term:value.term,date:value.date};
      for(const [key,max]of [['hometown',60],['place',60],['weather',20],['plants',300],['animals',300],['text',1200]]){
        result[key]=typeof value[key]==='string'?value[key].trim():'';if(result[key].length>max)throw Error('有一项记录太长，请缩短后再保存。');
      }
      if(!result.hometown)throw Error('先写下家乡的城市或乡镇吧。');
      if(result.weather&&!allowed.has(result.weather))throw Error('请从天气选项中选择，或先不选择。');
      result.temperature=value.temperature===''||value.temperature===null||value.temperature===undefined?null:Number(value.temperature);
      if(result.temperature!==null&&(!Number.isFinite(result.temperature)||result.temperature< -60||result.temperature>60))throw Error('气温请填 −60℃ 至 60℃之间的数字，也可以留空。');
      if(result.temperature===null&&![result.weather,result.plants,result.animals,result.text].some(Boolean))throw Error('记下天气或一种看到的现象，再保存吧。');
      return result;
    }
    function decode(raw,id,legacyTerm){
      const v=JSON.parse(raw);
      if(legacyTerm){if(v?.version!==1||!validDate(v.date)||typeof v.place!=='string'||typeof v.text!=='string')throw Error();return {id,term:legacyTerm,date:v.date,hometown:typeof v.hometown==='string'?v.hometown:'',place:v.place,weather:allowed.has(v.weather)?v.weather:'',temperature:Number.isFinite(v.temperature)?v.temperature:null,plants:typeof v.plants==='string'?v.plants:'',animals:typeof v.animals==='string'?v.animals:'',text:v.text,legacy:true};}
      if(v?.version!==2||v.id!==id)throw Error();return normalize(v);
    }
    function list(){
      const entries=[],issues=[];
      const read=(key,id,term)=>{const raw=storage.getItem(key);if(raw===null)return;try{entries.push({...decode(raw,id,term),raw});}catch{issues.push(key);}};
      for(const term of known)read(oldPrefix+term,'legacy-'+term,term);
      for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith(prefix)){const id=key.slice(prefix.length);if(/^[a-z0-9-]{1,80}$/.test(id)&&!id.startsWith('legacy-'))read(key,id);}}
      return {entries:entries.sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id)),issues};
    }
    function save(value,expected,confirmed){
      const note=normalize(value),key=keyFor(note.id),current=storage.getItem(key);
      if(current!==expected&&current!==confirmed)return {conflict:true,raw:current};
      const legacy=key.startsWith(oldPrefix);
      if(legacy&&note.term!==note.id.slice(7))throw Error('旧观察页与节气不一致。');
      const payload=legacy?{...note,version:1,diaryVersion:2}:note,raw=JSON.stringify(payload);
      storage.setItem(key,raw);return {raw,note};
    }
    function remove(id,expected){const key=keyFor(id);if(storage.getItem(key)!==expected)return false;storage.removeItem(key);return true;}
    return {list,save,remove,normalize,keyFor};
  }
  function selectEntries(entries,{year='all',season='all',home='all'},termSeasons){return entries.filter(e=>(year==='all'||e.date.slice(0,4)===year)&&(home==='all'||(e.hometown||'')===home)&&(season==='all'||termSeasons[e.term]===season));}
  function exportText(entries,terms){return ['我的家乡四季日记',...entries.map(e=>`${e.date} · ${terms[e.term]||e.term}\n家乡：${e.hometown||'未填写'}${e.place?' · '+e.place:''}\n天气：${e.weather||'未记录'}${e.temperature===null||e.temperature===undefined?'':' · '+e.temperature+'℃'}\n植物：${e.plants||'未记录'}\n动物：${e.animals||'未记录'}\n${e.text}`)].join('\n\n');}
  if(typeof module!=='undefined')module.exports={createStore,selectEntries,exportText,validDate};
  if(typeof window==='undefined')return;
  function mount({hall,terms,config}){
    const get=id=>document.getElementById(id),form=get('solar-note-form'),editor=get('solar-note-editor'),book=get('solar-notebook');
    let store;try{store=createStore(window.localStorage,[...terms.keys()],config.weather);}catch{}
    let entries=[],editing=null,loadedRaw=null,confirmed,initial='',filter={year:'all',season:'all',home:'all'};
    const seasons=Object.fromEntries([...terms].map(([id,t])=>[id,t.season]));
    const snapshot=()=>JSON.stringify([...new FormData(form).entries()]);
    const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
    const pause=()=>hall.dispatchEvent(new Event('solar:pause'));
    function storageMessage(text){get('solar-storage-status').textContent=text;get('solar-status').textContent=text;}
    function read(){try{if(!store)throw Error();const result=store.list();entries=result.entries;if(result.issues.length)storageMessage(`有 ${result.issues.length} 条旧内容暂时读不到，原存储未被改写。`);return true;}catch{storageMessage('浏览器暂时无法读取日记。仍可填写，保存前请留意提示。');return false;}}
    function button(label,group,value,selected){const b=el('button',label);b.type='button';b.dataset.diaryFilter=group;b.dataset.value=value;b.setAttribute('aria-pressed',String(selected));return b;}
    function renderBook(){
      const years=[...new Set(entries.map(e=>e.date.slice(0,4)))].sort().reverse(),homes=[...new Set(entries.map(e=>e.hometown||''))].sort();
      if(filter.year!=='all'&&!years.includes(filter.year))filter.year='all';if(filter.home!=='all'&&!homes.includes(filter.home))filter.home='all';
      get('solar-diary-years').replaceChildren(button('全部年份','year','all',filter.year==='all'),...years.map(y=>button(y+' 年','year',y,filter.year===y)));
      get('solar-diary-homes').replaceChildren(button('全部家乡','home','all',filter.home==='all'),...homes.map(h=>button(h||'旧笔记：未填家乡','home',h,filter.home===h)));
      book.querySelectorAll('[data-diary-filter="season"]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value===filter.season)));
      const visible=selectEntries(entries,filter,seasons),list=get('solar-notebook-list');list.replaceChildren();
      get('solar-diary-summary').textContent=`当前 ${visible.length} 条观察 · 春 ${visible.filter(e=>seasons[e.term]==='chun').length} · 夏 ${visible.filter(e=>seasons[e.term]==='xia').length} · 秋 ${visible.filter(e=>seasons[e.term]==='qiu').length} · 冬 ${visible.filter(e=>seasons[e.term]==='dong').length}`;
      for(const note of visible){
        const item=el('article'),title=el('h3',`${note.date} · ${terms.get(note.term).name}`),meta=el('p',`${note.hometown||'家乡未填写'}${note.place?' · '+note.place:''}`,'solar-note');
        item.append(title,meta,el('p',`天气：${note.weather||'未记录'}${note.temperature===null?'':' · '+note.temperature+'℃'}`));
        if(note.plants)item.append(el('p','植物：'+note.plants));if(note.animals)item.append(el('p','动物：'+note.animals));
        if(note.text)item.append(el('p',note.text,'solar-note-text'));
        const actions=el('div',undefined,'solar-actions'),edit=el('button','修改这一条'),add=el('button','同节气再记一条');edit.type=add.type='button';edit.dataset.editNote=note.id;add.dataset.note=note.term;actions.append(edit,add);item.append(actions);list.append(item);
      }
      if(!visible.length)list.append(el('p',entries.length?'这个筛选里还没有记录，可以换年份、季节或家乡看看。':'日记还是空的。挑一个节气，记下家乡的天气、花草或小动物吧。'));
    }
    function refresh(){read();for(const [id,t]of terms)t.card.querySelector('.solar-note-badge').textContent=entries.filter(e=>e.term===id).length+' 条记录';get('solar-note-count').textContent=`${entries.length} 条 · ${new Set(entries.map(e=>e.term)).size} / 24 节气`;get('solar-export').disabled=!entries.length;renderBook();}
    function open(termId,entryId){
      if(!terms.has(termId))return;pause();read();const old=entryId?entries.find(e=>e.id===entryId):null;
      if(entryId&&!old){storageMessage('这条记录已在另一窗口改变，请重新打开日记。');return;}
      editing={id:old?.id||(window.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)),term:termId};loadedRaw=old?.raw??null;confirmed=undefined;
      let hometown='';try{const value=JSON.parse(localStorage.getItem(homeKey)||'null');if(typeof value==='string'&&value.length<=60)hometown=value;}catch{}
      for(const name of ['date','hometown','place','plants','animals','text'])form.elements[name].value=old?.[name]||(name==='date'?window.SolarCalendar.dateKey(Date.now()):name==='hometown'?hometown:'');
      form.elements.temperature.value=old?.temperature??'';form.querySelectorAll('[name="weather"]').forEach(r=>r.checked=r.value===old?.weather);
      get('solar-note-title').textContent=`${terms.get(termId).name} · ${old?'修改家乡观察':'家乡新观察'}`;get('solar-note-prompt').textContent=terms.get(termId).prompt;
      get('solar-save-status').textContent='';get('solar-save').textContent='保存这条观察';get('solar-delete').hidden=!old;initial=snapshot();editor.showModal();
    }
    function close(dialog){if(dialog===editor&&snapshot()!==initial&&!window.confirm('这条观察还没有保存，确定离开吗？'))return;dialog.close();}
    for(const dialog of [book,editor]){dialog.querySelector('[data-close]').addEventListener('click',()=>close(dialog));dialog.addEventListener('cancel',e=>{e.preventDefault();close(dialog);});}
    hall.addEventListener('click',e=>{
      const add=e.target.closest('[data-note]'),edit=e.target.closest('[data-edit-note]'),choice=e.target.closest('[data-diary-filter]');
      if(add)open(add.dataset.note);if(edit){read();const note=entries.find(n=>n.id===edit.dataset.editNote);if(note)open(note.term,note.id);else refresh();}
      if(choice){filter[choice.dataset.diaryFilter]=choice.dataset.value;renderBook();}
    });
    hall.querySelector('[data-action="notebook"]').addEventListener('click',()=>{pause();refresh();book.showModal();});
    form.addEventListener('submit',e=>{
      e.preventDefault();try{
        if(!store)throw Error('浏览器限制了存储，请先复制观察内容留存。');
        const values=Object.fromEntries(new FormData(form).entries()),result=store.save({...editing,...values},loadedRaw,confirmed);
        if(result.conflict){confirmed=result.raw;get('solar-save-status').textContent='另一窗口刚修改过这一条。可关闭后重新查看；再次保存会替换成眼前的内容。';get('solar-save').textContent='仍保存眼前的内容';return;}
        loadedRaw=result.raw;initial=snapshot();confirmed=undefined;get('solar-save').textContent='保存这条观察';get('solar-delete').hidden=false;get('solar-save-status').textContent='已保存，下次打开这个浏览器还在。';
        try{localStorage.setItem(homeKey,JSON.stringify(result.note.hometown));}catch{}refresh();
      }catch(error){get('solar-save-status').textContent=error.name==='QuotaExceededError'||error.name==='SecurityError'?'这次未能保存，浏览器存储可能已满或被限制。请先复制内容留存。':error.message;}
    });
    get('solar-delete').addEventListener('click',()=>{if(!window.confirm('确定删除这一条观察吗？'))return;try{if(!store.remove(editing.id,loadedRaw)){get('solar-save-status').textContent='另一窗口刚修改过这一条，请重新打开后再确认删除。';return;}initial=snapshot();editor.close();refresh();}catch{get('solar-save-status').textContent='暂时无法删除，请稍后再试。';}});
    window.addEventListener('storage',e=>{if(e.key===null||e.key.startsWith(prefix)||e.key.startsWith(oldPrefix))refresh();});
    window.addEventListener('beforeunload',e=>{if(editor.open&&snapshot()!==initial){e.preventDefault();e.returnValue='';}});
    get('solar-export').addEventListener('click',()=>{read();const text=exportText(entries,Object.fromEntries([...terms].map(([id,t])=>[id,t.name]))),url=URL.createObjectURL(new Blob(['\uFEFF'+text],{type:'text/plain;charset=utf-8'}));const link=el('a');link.href=url;link.download='我的家乡四季日记.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
    refresh();return {open,refresh};
  }
  window.SolarDiary={mount};
})();

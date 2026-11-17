(()=>{
  'use strict';
  const H=window.HistoryCivilizations,{data}=H,esc=window.TLShared.esc;
  const root=document.querySelector('.civilizations-topic'),$=id=>document.getElementById(id);
  $('civilization-stats').innerHTML=[[data.civilizations.length,'座文明站'],[data.themes.length,'个主题'],[data.civilizations.flatMap(c=>c.sections).length,'个知识站'],[data.civilizations.flatMap(c=>c.images).length,'项图像材料']].map(([n,label])=>`<span><b>${n}</b>${label}</span>`).join('');
  let state=H.readState(new URLSearchParams(location.search));
  const buttons=(items,attr)=>items.map(t=>`<button type="button" data-${attr}="${t.id}" aria-pressed="false">${esc(t.label||t.name)}</button>`).join('');
  $('civ-themes').innerHTML=buttons([{id:'all',label:'全部主题'},...data.themes],'theme');
  $('civ-directory').innerHTML=data.civilizations.map(c=>`<a href="${H.detailHref(c)}">${esc(c.name)} →</a>`).join('');
  $('civ-choices-left').innerHTML=buttons(data.civilizations,'left');$('civ-choices-right').innerHTML=buttons(data.civilizations,'right');
  function save(){
    const url=new URL(location.href),values={q:state.query,theme:state.theme==='all'?'':state.theme,view:state.view==='catalog'?'':state.view,left:state.view==='compare'?state.left:'',right:state.view==='compare'?state.right:''};
    for(const [key,value] of Object.entries(values))if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);
    history.replaceState(null,'',url);
  }
  function render(persist=true){
    const civs=H.filter(state.query,state.theme),comparing=state.view==='compare';
    $('civ-search').value=state.query;$('civ-count').textContent=comparing?'每次比较两个文明':`找到 ${civs.length} / ${data.civilizations.length} 站`;
    $('civ-results').textContent=comparing?'同一个问题，看看不同文明':'选择一站开始巡礼';
    $('civ-cards').hidden=comparing||!civs.length;$('civ-empty').hidden=comparing||civs.length>0;$('civ-comparison').hidden=!comparing;
    $('civ-search').disabled=comparing;$('civ-search-help').textContent=comparing?'比较视图用下方文明 A、B 选取对象；主题筛选仍可使用。':'可以搜名字、地区、建筑、文字或制度。';
    for(const attr of ['theme','view','left','right'])root.querySelectorAll(`[data-${attr}]`).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset[attr]===state[attr])));
    if(comparing){$('civ-compare-content').innerHTML=H.comparisonHTML(state);$('civ-compare-title').textContent=`${H.civMap.get(state.left).name} × ${H.civMap.get(state.right).name}`;}
    else $('civ-cards').innerHTML=civs.map(c=>H.cardHTML(c,state.theme)).join('');
    if(persist)save();
  }
  root.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.compare){state={...H.choose(state,'left',b.dataset.compare),view:'compare'};render();$('civ-results').scrollIntoView({block:'start',behavior:'instant'});return;}
    if(b.hasAttribute('data-reset')){state={...state,query:'',theme:'all'};render();return;}
    if(b.hasAttribute('data-swap')){state={...state,left:state.right,right:state.left};render();return;}
    for(const side of ['left','right'])if(b.dataset[side]){state=H.choose(state,side,b.dataset[side]);render();return;}
    for(const attr of ['theme','view'])if(b.dataset[attr]){state={...state,[attr]:b.dataset[attr]};render();return;}
  });
  $('civ-search').addEventListener('input',()=>{state.query=$('civ-search').value;render();});
  window.addEventListener('popstate',()=>{state=H.readState(new URLSearchParams(location.search));render(false);});
  render(false);window.TLShared.bindAnchors(root);
})();

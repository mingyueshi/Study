(()=>{
  'use strict';
  const H=window.AncientScience,{data}=H,esc=window.TLShared.esc,root=document.querySelector('.ancient-science-topic'),$=id=>document.getElementById(id);
  let state=H.readState(new URLSearchParams(location.search));
  $('science-stats').innerHTML=[[data.topics.length,'个科技档案'],[data.categories.length,'个领域'],[3,'个原理演示']].map(([n,l])=>`<span><b>${n}</b>${l}</span>`).join('');
  $('science-categories').innerHTML=[{id:'all',label:'全部领域',icon:'🔎'},...data.categories].map(c=>`<button type="button" data-category="${c.id}" aria-pressed="false">${esc(c.icon)} ${esc(c.label)}</button>`).join('');
  $('science-demos').innerHTML=data.topics.filter(t=>t.demo).map(t=>`<a href="${H.detailHref(t,'principle')}">${esc(t.title.split('：')[0])} →</a>`).join('');
  function render(save=true){
    const topics=H.filter(state.query,state.category);$('science-search').value=state.query;
    $('science-count').textContent=`找到 ${topics.length} / ${data.topics.length} 个专题`;$('science-empty').hidden=topics.length>0;$('science-cards').hidden=!topics.length;
    $('science-cards').innerHTML=topics.map(H.cardHTML).join('');
    root.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===state.category)));
    if(save){const url=new URL(location.href);for(const [key,value]of Object.entries({q:state.query,category:state.category==='all'?'':state.category}))if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);history.replaceState(null,'',url);}
  }
  root.addEventListener('click',event=>{const b=event.target.closest('button');if(!b)return;if(b.dataset.category)state.category=b.dataset.category;else if(b.hasAttribute('data-reset'))state={query:'',category:'all'};else return;render();});
  $('science-search').addEventListener('input',()=>{state.query=$('science-search').value;render();});
  window.addEventListener('popstate',()=>{state=H.readState(new URLSearchParams(location.search));render(false);});
  render(false);window.TLShared.bindAnchors(root);
})();

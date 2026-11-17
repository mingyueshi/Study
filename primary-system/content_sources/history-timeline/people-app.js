(() => {
  'use strict';
  const root = document.querySelector('.people-topic'), $ = id => document.getElementById(id);
  const H = window.HistoryPeople, {data, personMap, groupMap, esc} = {...H, esc: window.TLShared.esc};
  const eras = window.TIMELINE_ERAS.filter(era => data.people.some(person => person.era === era.id));
  let state;
  function readURL() {
    const params = new URLSearchParams(location.search);
    state = {query: params.get('q') || '', group: groupMap.has(params.get('group')) ? params.get('group') : 'all',
      era: eras.some(era => era.id === params.get('era')) ? params.get('era') : 'all',
      view: params.get('view') === 'network' ? 'network' : 'cards',
      person: personMap.has(params.get('person')) ? params.get('person') : data.people[0].id,
      kind: H.kindMap.has(params.get('relation')) ? params.get('relation') : 'all'};
    $('people-search').value = state.query;
  }
  function saveURL(push = false) {
    const url = new URL(location.href);
    const values = {q:state.query, group:state.group === 'all' ? '' : state.group, era:state.era === 'all' ? '' : state.era,
      view:state.view === 'cards' ? '' : state.view, person:state.view === 'network' ? state.person : '', relation:state.kind === 'all' || state.view !== 'network' ? '' : state.kind};
    for (const [key,value] of Object.entries(values)) { if (value) url.searchParams.set(key,value); else url.searchParams.delete(key); }
    history[push ? 'pushState' : 'replaceState'](null, '', url);
  }
  const filterButtons = (items, attribute) => [{id:'all',label:'全部'},...items].map(item =>
    `<button type="button" data-${attribute}="${esc(item.id)}" aria-pressed="false">${esc(item.label || item.name)}</button>`).join('');
  $('people-groups').innerHTML = filterButtons(data.groups,'group');
  $('people-eras').innerHTML = filterButtons(eras,'era');
  $('network-kinds').innerHTML = filterButtons(data.relationKinds,'kind');
  $('people-stats').innerHTML = [[data.people.length,'位人物'],[data.groups.length,'类身份'],[data.relations.length,'条关系'],[data.people.reduce((n,p)=>n+p.decisions.length,0),'项决策']]
    .map(([n,label])=>`<span><b>${n}</b>${label}</span>`).join('');
  function render(save = true, push = false) {
    const people = H.filterPeople(state);
    if (!people.some(person => person.id === state.person) && people.length) state.person = people[0].id;
    $('people-count').textContent = `找到 ${people.length} / ${data.people.length} 位人物`;
    $('people-results').textContent = state.view === 'network' ? '沿关系读历史' : '认识人物';
    $('people-empty').hidden = people.length > 0;
    $('people-cards').hidden = state.view !== 'cards' || !people.length;
    $('people-network').hidden = state.view !== 'network' || !people.length;
    for (const attr of ['group','era','view']) root.querySelectorAll(`[data-${attr}]`).forEach(button =>
      button.setAttribute('aria-pressed',String(button.dataset[attr] === state[attr])));
    root.querySelectorAll('[data-kind]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.kind === state.kind)));
    if (state.view === 'cards') $('people-cards').innerHTML = people.map(H.cardHTML).join('');
    else if (people.length) {
      const person = personMap.get(state.person), links = H.relationsFor(person.id,state.kind);
      $('network-title').textContent = `${person.name} · 人物关系网`;
      $('network-picker').innerHTML = people.map(item=>`<button type="button" data-focus="${esc(item.id)}" aria-pressed="${item.id===person.id}">${esc(item.name)}</button>`).join('');
      $('network-graph').innerHTML = H.graphHTML(person.id,state.kind,true);
      $('network-relations').innerHTML = H.relationListHTML(person.id,state.kind);
      $('network-status').textContent = `以${person.name}为中心，显示 ${links.length} 条已收录关系。筛选用于选择中心，关联人物按关系保留。`;
    }
    if (save) saveURL(push);
  }
  function showNetwork(id, focus = false) {
    if (!H.filterPeople(state).some(person => person.id === id)) {
      state.query='';state.group='all';state.era='all';$('people-search').value='';
    }
    state.person=id;state.view='network';render(true,true);
    if (focus) [...$('network-graph').querySelectorAll(`[data-focus="${id}"]`)].find(node=>node.getClientRects().length)?.focus({preventScroll:true});
    else $('people-results').scrollIntoView({block:'start',behavior:'instant'});
  }
  root.addEventListener('click',event=>{
    const target=event.target.closest('button, a[data-focus]');if(!target)return;
    if(target.matches('a')&&(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey))return;
    if(target.hasAttribute('data-focus')){event.preventDefault();showNetwork(target.dataset.focus,true);return;}
    if(target.dataset.network){showNetwork(target.dataset.network);return;}
    if(target.hasAttribute('data-reset')){state={...state,query:'',group:'all',era:'all',kind:'all'};$('people-search').value='';render();return;}
    for(const attr of ['group','era','view','kind'])if(target.hasAttribute('data-'+attr)){
      state[attr]=target.dataset[attr];render();return;
    }
  });
  $('people-search').addEventListener('input',()=>{state.query=$('people-search').value;render();});
  window.addEventListener('popstate',()=>{readURL();render(false);});
  readURL();render(false);
  window.TLShared.bindAnchors(root);
})();

/* 文明索引、筛选与比较状态；资料与素材元数据由独立文件维护。 */
window.HistoryCivilizations=(()=>{
  'use strict';
  const data=window.HISTORY_CIVILIZATIONS, esc=window.TLShared.esc;
  const assetBase=new URL('.',document.currentScript.src);
  const civMap=new Map(data.civilizations.map(c=>[c.id,c]));
  const themeMap=new Map(data.themes.map(t=>[t.id,t]));
  const normalize=value=>String(value).normalize('NFKC').replace(/\s/g,'').toLowerCase();
  const sectionFor=(civ,theme)=>civ.sections.find(s=>s.theme===theme);
  const imagesFor=civ=>civ.images.map(entry=>entry.mediaEvent?{...window.TIMELINE_MEDIA[entry.mediaEvent][0],theme:entry.theme}:entry);
  const detailHref=(civ,theme='all')=>'civilization.html?civilization='+encodeURIComponent(civ.id)+(themeMap.has(theme)?'#station-'+sectionFor(civ,theme).id:'');
  const forEvent=id=>data.civilizations.filter(c=>c.eventIds.includes(id));
  function filter(query='',theme='all'){
    const q=normalize(query);
    return data.civilizations.filter(c=>normalize([c.name,c.region,c.summary,...c.tags,...c.sections.filter(s=>theme==='all'||s.theme===theme).flatMap(s=>[s.title,s.lead,s.example,...s.points])].join(' ')).includes(q));
  }
  function readState(params){
    const left=civMap.has(params.get('left'))?params.get('left'):data.civilizations[0].id;
    const right=civMap.has(params.get('right'))&&params.get('right')!==left?params.get('right'):data.civilizations.find(c=>c.id!==left).id;
    return {query:params.get('q')||'',theme:themeMap.has(params.get('theme'))?params.get('theme'):'all',view:params.get('view')==='compare'?'compare':'catalog',left,right};
  }
  function choose(state,side,id){
    if(!['left','right'].includes(side)||!civMap.has(id))return state;
    const other=side==='left'?'right':'left';
    return {...state,[side]:id,[other]:state[other]===id?state[side]:state[other]};
  }
  function sourcesHTML(ids){
    return `<ul class="hp-sources">${[...new Set(ids)].map(id=>{const s=data.sources[id];return `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.publisher)} · ${esc(s.title)}（需联网）↗</a></li>`;}).join('')}</ul>`;
  }
  function imageHTML(image){
    const url=esc(new URL(image.src,assetBase).href);
    return `<figure class="cv-evidence"><a href="${url}" target="_blank" rel="noopener" aria-label="放大查看${esc(image.title)}"><img src="${url}" width="${image.width}" height="${image.height}" alt="${esc(image.alt)}" loading="lazy" decoding="async"></a><figcaption><b>${esc(image.title)}</b><p>${esc(image.caption)}</p><p class="cv-observe">观察：${esc(image.prompt)}</p><small>${esc(image.credit)} · ${esc(image.license)} · <a href="${esc(image.source)}" target="_blank" rel="noopener noreferrer">原图与说明（需联网）↗</a></small></figcaption></figure>`;
  }
  function cardHTML(civ,theme='all'){
    const image=imagesFor(civ)[0],section=sectionFor(civ,theme);
    return `<article class="hp-card cv-card" style="--person-color:${civ.color}"><figure class="hp-card-figure"><a class="hp-card-image" href="${detailHref(civ)}" tabindex="-1" aria-hidden="true"><img src="${esc(new URL(image.src,assetBase).href)}" width="${image.width}" height="${image.height}" alt="" loading="lazy"></a><figcaption>${esc(image.title)} · 打开档案看图注</figcaption></figure><div class="hp-card-body"><p class="hp-category">${esc(civ.region)}</p><h3><a href="${detailHref(civ)}">${esc(civ.name)}</a></h3><p class="hp-card-life">${esc(civ.period)}</p><p class="hp-role">${esc(section?section.title:civ.subtitle)}</p><p>${esc(section?section.lead:civ.summary)}</p><nav class="cv-topic-links" aria-label="${esc(civ.name)}的四个主题">${data.themes.map(t=>`<a href="${detailHref(civ,t.id)}">${esc(t.label)} →</a>`).join('')}</nav><div class="hp-card-actions"><a href="${detailHref(civ,theme)}">${section?'读这个主题':'进入文明档案'} →</a><button type="button" data-compare="${civ.id}">与另一文明比较</button></div></div></article>`;
  }
  function comparisonHTML(state){
    const civs=[civMap.get(state.left),civMap.get(state.right)], themes=data.themes.filter(t=>state.theme==='all'||t.id===state.theme);
    return `<div class="cv-compare-pair cv-compare-intro">${civs.map((c,i)=>`<article style="--person-color:${c.color}"><p class="hp-category">文明 ${i===0?'A':'B'}</p><h3><a href="${detailHref(c)}">${esc(c.name)} →</a></h3><p>${esc(c.period)}</p><p>${esc(c.scope)}</p></article>`).join('')}</div><p class="cv-comparison-note">按共同问题比较，不给文明排高低。两侧选取的年代可能不同，先看年代与范围，再看相同点和差异。</p>${themes.map(t=>`<section class="cv-compare-row"><header><h3>${esc(t.icon)} ${esc(t.label)}</h3><p>${esc(t.question)}</p></header><div class="cv-compare-pair">${civs.map((c,i)=>{const s=sectionFor(c,t.id);return `<article style="--person-color:${c.color}"><p class="hp-category">${i===0?'A':'B'} · ${esc(c.name)}</p><h4>${esc(s.title)}</h4><p>${esc(s.lead)}</p><ul>${s.points.map(p=>`<li>${esc(p)}</li>`).join('')}</ul><p class="cv-boundary">${esc(s.boundary)}</p><a class="hp-text-link" href="${detailHref(c,t.id)}">看材料、问题与出处 →</a></article>`;}).join('')}</div></section>`).join('')}`;
  }
  return {data,civMap,themeMap,assetBase,sectionFor,imagesFor,detailHref,forEvent,filter,readState,choose,sourcesHTML,imageHTML,cardHTML,comparisonHTML};
})();

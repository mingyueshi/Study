/* 科技索引与教学模型。正文、演示说明和图片来源都由内容源维护。 */
window.AncientScience=(()=>{
  'use strict';
  const data=window.ANCIENT_SCIENCE,esc=window.TLShared.esc,assetBase=new URL('.',document.currentScript.src);
  const topicMap=new Map(data.topics.map(t=>[t.id,t])),categoryMap=new Map(data.categories.map(c=>[c.id,c]));
  const normalize=value=>String(value).normalize('NFKC').replace(/\s/g,'').toLowerCase();
  const detailHref=(topic,anchor='')=>'technology.html?topic='+encodeURIComponent(topic.id)+(anchor?'#'+anchor:'');
  const forEvent=id=>data.topics.filter(t=>t.eventIds.includes(id));
  const forPerson=id=>data.topics.filter(t=>t.people.some(p=>p.id===id));
  function imagesFor(topic){return topic.images.map(entry=>{
    if(entry.imageRef)return data.images[entry.imageRef];
    if(entry.mediaEvent)return window.TIMELINE_MEDIA[entry.mediaEvent][0];
    const person=window.HISTORY_PEOPLE.people.find(p=>p.id===entry.personImage);
    return {...person.image,title:person.name+'相关图像'};
  });}
  function filter(query='',category='all'){
    const q=normalize(query);
    return data.topics.filter(t=>(category==='all'||t.category===category)&&normalize([t.title,t.summary,...t.tags,...t.steps.flatMap(s=>[s.title,s.text]),...t.people.map(p=>window.HISTORY_PEOPLE.people.find(x=>x.id===p.id).name)].join(' ')).includes(q));
  }
  function readState(params){return {query:params.get('q')||'',category:categoryMap.has(params.get('category'))?params.get('category'):'all'};}
  function readDemo(params){
    const sides=Number(params.get('sides')),stage=Number(params.get('stage'));
    return {sides:data.demos.pi.sides.includes(sides)?sides:6,stage:Number.isInteger(stage)&&stage>=0&&stage<data.demos.printing.stages.length?stage:0,mode:params.get('mode')==='block'?'block':'type',changed:params.get('changed')==='1',water:params.get('water')==='high'?'high':'low'};
  }
  function piBounds(sides){
    if(!data.demos.pi.sides.includes(sides))throw new RangeError('请选择演示提供的边数');
    return {lower:sides*Math.sin(Math.PI/sides),upper:sides*Math.tan(Math.PI/sides)};
  }
  function printingState(mode,stage,changed){
    const text=Array.from(data.demos.printing.text);if(changed)text[2]=data.demos.printing.replacement;
    return {text:text.join(''),mode:mode==='block'?'block':'type',stage:Math.max(0,Math.min(3,Number(stage)||0)),changed:!!changed};
  }
  function sourcesHTML(ids){return `<ul class="hp-sources">${[...new Set(ids)].map(id=>{const s=data.sources[id];return `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.publisher)} · ${esc(s.title)}（需联网）↗</a></li>`;}).join('')}</ul>`;}
  function imageHTML(image){const url=esc(new URL(image.src,assetBase).href);return `<figure class="as-evidence"><a href="${url}" target="_blank" rel="noopener" aria-label="放大查看${esc(image.title||image.alt)}"><img src="${url}" width="${image.width}" height="${image.height}" alt="${esc(image.alt)}" loading="lazy" decoding="async"></a><figcaption><b>${esc(image.title||image.alt)}</b><p>${esc(image.caption)}</p>${image.prompt?`<p>观察：${esc(image.prompt)}</p>`:''}<small>${esc(image.credit)} · ${esc(image.license||'图像说明见来源')} · <a href="${esc(image.source)}" target="_blank" rel="noopener noreferrer">原图与说明（需联网）↗</a></small></figcaption></figure>`;}
  function cardHTML(topic){const category=categoryMap.get(topic.category),image=imagesFor(topic)[0];return `<article class="hp-card as-card" style="--person-color:${category.color}"><figure class="hp-card-figure"><a class="hp-card-image" href="${detailHref(topic)}" tabindex="-1" aria-hidden="true"><img src="${esc(new URL(image.src,assetBase).href)}" width="${image.width}" height="${image.height}" alt="" loading="lazy"></a><figcaption>${esc(image.title||image.alt)} · 读档案看图注</figcaption></figure><div class="hp-card-body"><p class="hp-category">${esc(category.icon)} ${esc(category.label)}</p><h3><a href="${detailHref(topic)}">${esc(topic.title)}</a></h3><p class="hp-card-life">${esc(topic.period)}</p><p>${esc(topic.summary)}</p><div class="hp-tags">${topic.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div><div class="hp-card-actions"><a href="${detailHref(topic)}">进入科技档案 →</a>${topic.demo?`<a href="${detailHref(topic,'principle')}">动手看原理 →</a>`:''}</div></div></article>`;}
  return {data,topicMap,categoryMap,assetBase,normalize,detailHref,forEvent,forPerson,imagesFor,filter,readState,readDemo,piBounds,printingState,sourcesHTML,imageHTML,cardHTML};
})();

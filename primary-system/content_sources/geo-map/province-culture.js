/* 省份文化：复用原省份档案、底图、位置与浏览器侧栏规则。 */
(() => {
  'use strict';
  const root = document.querySelector('.culture-topic');
  if (!root) return;
  const $ = id => root.querySelector('#' + id);
  const D = window.GM_PROVINCE_CULTURE, S = window.GMShared, esc = S.esc;
  const atlasBase = esc(root.dataset.atlasBase || '');
  const provinces = window.GM_PROVINCES;
  const cultures = new Map(D.provinces.map(p => [p.adcode, p]));
  const sources = new Map(D.sources.map(s => [s.id, s]));
  const TYPES = ['全部', '省', '自治区', '直辖市', '特别行政区'];
  const params = new URLSearchParams(location.search);
  let query = params.get('q') || '';
  let type = TYPES.includes(params.get('type')) ? params.get('type') : '全部';
  let selected = provinces.find(p => p.adcode === params.get('adcode')) || provinces[0];
  const requested = params.get('adcode');
  const display = p => S.displayName(p.name);
  const center = p => ({label: p.type === '自治区' ? '首府' : p.type === '省' ? '省会' : '行政区中心', name: p.capital || display(p)});
  const normalize = value => String(value).normalize('NFKC').toLowerCase().trim();
  function matches(p) {
    if (type !== '全部' && p.type !== type) return false;
    const c = cultures.get(p.adcode);
    const text = [p.name, p.type, p.capital || '', ...c.shortNames, ...['specialties','customs','landscapes'].flatMap(key => c[key].flatMap(item => [item.name,item.location,item.detail]))].join(' ');
    return normalize(text).includes(normalize(query));
  }
  function writeURL(replace = false) {
    const url = new URL(location.href);
    url.searchParams.set('adcode', selected.adcode);
    for (const [key, value] of [['q',query], ['type',type === '全部' ? '' : type]]) {
      if (value) url.searchParams.set(key,value); else url.searchParams.delete(key);
    }
    if (url.href !== location.href) history[replace ? 'replaceState' : 'pushState'](null,'',url);
  }
  function renderPicker() {
    const found = provinces.filter(matches);
    $('culture-picker').innerHTML = found.map(p => '<button type="button" data-province="' + p.adcode + '" aria-pressed="' + (p === selected) + '"><b>' + esc(display(p)) + '</b><span>' + esc(cultures.get(p.adcode).shortNames.join('／')) + '</span></button>').join('');
    $('culture-result').textContent = found.length ? '找到 ' + found.length + '／34 个省级行政区' + (matches(selected) ? '' : '；当前档案为' + display(selected)) : '没有找到匹配项。可以清空筛选，或直接点击地图。';
    $('culture-types').innerHTML = TYPES.map(t => '<button type="button" data-type="' + t + '" aria-pressed="' + (type===t) + '">' + t + '</button>').join('');
    updateMap();
  }
  const svg = $('culture-map');
  svg.setAttribute('viewBox', `0 0 ${S.W} ${S.H.toFixed(0)}`);
  svg.innerHTML = S.mapPrelude() + S.provincePathsSVG(() => '#e6eee6',{interactive:true}) +
    '<path id="culture-outline" fill="none" stroke="#b95026" stroke-width="3" stroke-linejoin="round" pointer-events="none"/>' +
    '<g id="culture-center" pointer-events="none"></g>' + S.insetSVG() + S.compass();
  function updateMap() {
    const found = new Set(provinces.filter(matches).map(p => p.id));
    svg.querySelectorAll('path[data-id]').forEach(node => {
      const active = node.dataset.id === selected.id;
      node.setAttribute('fill',active ? '#e98750' : found.has(node.dataset.id) ? '#d7e9dc' : '#ebede9');
      node.setAttribute('aria-pressed',String(active));
    });
    $('culture-outline').setAttribute('d',S.provD.get(selected.adcode) || '');
    const point = window.GM_MAP_DISCOVERY.provinces[selected.id].point;
    const [x,y] = S.m(...point);
    $('culture-center').innerHTML = `<circle cx="${x}" cy="${y}" r="7" fill="#a44020" stroke="white" stroke-width="2"/><text x="${x}" y="${y-15}" text-anchor="middle" class="culture-map-label">${esc(center(selected).name)}</text>`;
    $('culture-map-selected').textContent = display(selected) + ' · ' + cultures.get(selected.adcode).shortNames.join('／');
  }
  function renderProfile() {
    const p = selected, c = cultures.get(p.adcode), cap = center(p);
    document.title = display(p) + ' · 中国省份文化 · 乐学堂';
    const referenceIds = [...new Set(['admin','short',...['specialties','customs','landscapes'].flatMap(k=>c[k].flatMap(item=>item.sources))])];
    const sections = [['specialties','物产与手艺','🌾'],['customs','民俗与传统技艺','🥁'],['landscapes','代表景观','🏞️']].map(([key,title,icon]) =>
      '<section class="culture-section culture-section--' + key + '"><h3><span aria-hidden="true">' + icon + '</span> ' + title + '</h3><div class="culture-item-grid">' + c[key].map(item => '<div class="culture-item"><h4>' + esc(item.name) + '</h4><p class="culture-place">' + esc(item.location) + '</p><p>' + esc(item.detail) + '</p></div>').join('') + '</div></section>').join('');
    $('culture-profile').innerHTML = '<header class="culture-profile-head"><p class="culture-kicker">' + esc(p.type) + ' · 文化档案</p><h2>' + esc(p.name) + '</h2><dl><div><dt>简称／常用别称</dt><dd>' + esc(c.shortNames.join('／')) + '</dd></div><div><dt>' + cap.label + '</dt><dd>' + esc(cap.name) + '</dd></div></dl>' +
      (['直辖市','特别行政区'].includes(p.type) ? '<p class="culture-center-note">' + esc(p.type) + '不设省会，这里用本身名称作行政区中心识记。</p>' : '') +
      '<nav aria-label="当前省份关联档案"><a href="' + atlasBase + 'province.html?adcode=' + p.adcode + '">看自然地理档案 →</a><a href="' + atlasBase + 'china.html?place=' + p.id + '#map">回中国地图 →</a></nav></header>' + sections +
      '<details class="culture-question"><summary>想一想：' + esc(c.question) + '</summary><p>' + esc(c.explanation) + '</p></details>' +
      '<details class="culture-references"><summary>资料与延伸阅读（需联网）</summary><ul>' + referenceIds.map(id => {const s=sources.get(id);return '<li><a target="_blank" rel="noopener noreferrer" href="' + esc(s.url) + '">' + esc(s.title) + ' ↗</a><p>' + esc(s.scope) + '</p></li>';}).join('') + '</ul><p>资料核对：2026-11-17。此处是代表性选读，观察问题的提示用于继续查证。</p></details>';
  }
  function choose(code, {push=true,focus=false}={}) {
    const p = provinces.find(item=>item.adcode===code);
    if(!p) return;
    selected=p;
    $('culture-notice').hidden=true;
    renderProfile();renderPicker();
    if(push) writeURL();
    if(focus) {$('culture-profile').focus({preventScroll:true});$('culture-profile').scrollIntoView({behavior:'instant',block:'start'});}
  }
  $('culture-intro').textContent=D.intro;
  $('culture-scope-note').textContent=D.scopeNote;
  $('culture-capital-note').textContent=D.capitalNote;
  $('culture-search').value=query;
  $('culture-open-picker').addEventListener('click',()=>{
    if(root.dataset.slOpen!=='true')root.querySelector('.sl-toggle:not(.sl-collapse)')?.click();
    $('culture-search').focus();
    root.querySelector('.sl-sidebar')?.scrollIntoView({behavior:'instant',block:'start'});
  });
  $('culture-search').addEventListener('input',event=>{query=event.target.value;renderPicker();writeURL(true);});
  $('culture-clear').addEventListener('click',()=>{query='';type='全部';$('culture-search').value='';renderPicker();writeURL(true);});
  $('culture-types').addEventListener('click',event=>{const button=event.target.closest('[data-type]');if(!button)return;type=button.dataset.type;renderPicker();writeURL(true);$('culture-types').querySelector(`[data-type="${type}"]`)?.focus({preventScroll:true});});
  $('culture-picker').addEventListener('click',event=>{const button=event.target.closest('[data-province]');if(button)choose(button.dataset.province,{focus:true});});
  svg.addEventListener('click',event=>{const node=event.target.closest('[data-id]');if(node)choose(node.dataset.id.slice(1));});
  svg.addEventListener('keydown',event=>{if(!['Enter',' '].includes(event.key))return;const node=event.target.closest('[data-id]');if(node){event.preventDefault();choose(node.dataset.id.slice(1));}});
  window.addEventListener('popstate',()=>{const p=new URLSearchParams(location.search);query=p.get('q')||'';type=TYPES.includes(p.get('type'))?p.get('type'):'全部';$('culture-search').value=query;choose(provinces.some(item=>item.adcode===p.get('adcode'))?p.get('adcode'):provinces[0].adcode,{push:false});});
  renderProfile();renderPicker();
  if(requested && requested!==selected.adcode){$('culture-notice').textContent='没有找到这个省级行政区，先展示北京。请从省名按钮或地图重新选择。';$('culture-notice').hidden=false;}
})();

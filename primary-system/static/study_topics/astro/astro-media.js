/* 宇宙漫游：本地影像、行星比例和公转演示。正文与数值见 astro-media-data.js。 */
(() => {
  'use strict';
  const base = new URL('.', document.currentScript.src);
  const data = ASTRO_MEDIA;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const asset = file => esc(new URL(file, base).href);
  const external = (url, label) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
  let frame = 0;
  let dispose = () => {};

  function image(item) {
    return `<figure class="roam-photo"><a href="${asset(item.src)}" target="_blank" rel="noopener" aria-label="放大查看：${esc(item.title)}"><img src="${asset(item.src)}" alt="${esc(item.title)}" loading="lazy" width="1200" height="800"><span>放大看图 ↗</span></a><figcaption><span class="roam-kind">${esc(item.kind)}</span><h3>${esc(item.title)}</h3><p>${esc(item.caption)}</p><small>图源：${esc(item.credit)} · ${external(item.source, '原始资料（需联网）')}</small></figcaption></figure>`;
  }
  function chapter(c) {
    return `<section class="roam-chapter" id="roam-${c.id}" aria-labelledby="roam-title-${c.id}"><header><h2 id="roam-title-${c.id}">${esc(c.title)}</h2><p>${esc(c.intro)}</p><p class="roam-scale">${esc(c.scale)}</p></header><div class="roam-gallery">${c.images.map(image).join('')}</div><div class="roam-cinema"><div><video controls playsinline preload="none" poster="${asset(c.movie.poster)}" aria-label="${esc(c.movie.title)}" src="${asset(c.movie.src)}">当前浏览器无法播放，请通过下方原始资料查看动画。</video><p class="roam-video-error" hidden>这段动画暂时无法播放，可以先看封面和中文导览，或打开下方原始资料。</p></div><div class="roam-cinema-copy"><span class="roam-kind">${esc(c.movie.kind)}</span><h3>${esc(c.movie.title)}</h3><p>${esc(c.watch)}</p><p>${esc(c.movie.caption)}</p><small>来源：${esc(c.movie.credit)} · ${external(c.movie.source, '动画原始资料（需联网）')}</small></div></div><details class="roam-question"><summary>想一想：${esc(c.question)}</summary><p>${esc(c.answer)}</p></details><div class="roam-links"><h3>继续探索 <small>需联网 · 新窗口打开</small></h3><ul>${c.links.map(l => `<li>${external(l.url, l.title)}<p>${esc(l.note)}</p></li>`).join('')}</ul><button type="button" class="play-btn" data-act="unit" data-id="${c.unit}">回到课程：${c.unit === 'au1' ? '太阳系大家庭' : '银河系与宇宙'} →</button></div></section>`;
  }
  function planetLab() {
    return `<section class="roam-lab" aria-labelledby="planet-lab-title"><header><h2 id="planet-lab-title">把太阳系放上实验桌</h2><p>点选行星，比较它们的距离、大小和一年有多长。</p></header><div class="roam-controls" role="group" aria-label="太阳系显示方式"><button type="button" data-roam-mode="orbits" aria-pressed="true">看公转</button><button type="button" data-roam-mode="distance" aria-pressed="false">比距离</button><button type="button" data-roam-mode="size" aria-pressed="false">比大小</button><button type="button" data-roam-play aria-pressed="false">开始公转</button></div><p class="roam-model-note" id="roam-model-note"></p><div class="roam-solar-stage" tabindex="0" aria-label="太阳系模型，窄屏可左右滚动查看"><svg viewBox="0 0 1000 540" role="img" aria-label="太阳系示意图" aria-describedby="roam-model-note"><g data-roam-scene></g></svg></div><div class="roam-planet-picker" role="group" aria-label="选择行星">${data.planets.map((p, i) => `<button type="button" data-roam-planet="${i}" aria-pressed="${i === 2}" style="--planet:${p.color}">${esc(p.name)}</button>`).join('')}</div><div class="roam-planet-info" aria-live="polite"></div><p class="roam-data-source">平均日距以日地平均距离为 1；周期以地球年计，数值取近似值。${external(data.planetSource, 'NASA 行星数据表（需联网）')}</p></section>`;
  }
  function render() {
    return `<div class="astro-roam"><header class="roam-hero"><img src="${asset('images/astro/roam-webb.jpg')}" alt="韦布近红外深空观测中的星系与星光" width="1200" height="800"><div><p class="roam-intro-tag">带着好奇心出发</p><h1>从我们的太阳，<br>走向无数个星系</h1><p>看真实影像，转动视角，找一找我们在宇宙中的位置。</p><nav aria-label="宇宙漫游路线"><a href="#roam-solar">太阳系 ↓</a><a href="#roam-galaxy">银河系 ↓</a><a href="#roam-deep">遥远宇宙 ↓</a></nav></div></header><p class="roam-local-note">图片和 3 段动画已保存在本站，点播放再开始。每幅图都附有中文导览与来源；外部三维漫游和原始资料需联网。</p>${planetLab()}${data.chapters.map(chapter).join('')}</div>`;
  }
  function mount() {
    dispose();
    const root = document.querySelector('.astro-roam');
    if (!root) return;
    const scene = root.querySelector('[data-roam-scene]');
    let mode = 'orbits', selected = 2, running = false, years = 0, previous = 0;
    const control = root.querySelector('[data-roam-play]');
    const NS = 'http://www.w3.org/2000/svg';
    function node(tag, attrs, text) {
      const el = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k, v));
      if (text) el.textContent = text;
      return el;
    }
    let markers = [];
    function position() {
      markers.forEach(({group, index, radius}) => {
        const angle = (years / data.planets[index].period + index / 8) * Math.PI * 2;
        group.setAttribute('transform', `translate(${500 + Math.cos(angle) * radius} ${270 + Math.sin(angle) * radius * .54})`);
      });
    }
    function draw() {
      scene.replaceChildren(); markers = [];
      const note = root.querySelector('#roam-model-note');
      note.textContent = data.modelNotes[mode];
      if (mode !== 'size') {
        scene.append(node('circle',{cx:mode === 'orbits' ? 500 : 50,cy:mode === 'orbits' ? 270 : 245,r:15,fill:'#ffc74e'}));
        if (mode === 'distance') scene.append(node('text',{x:50,y:215,'text-anchor':'middle',fill:'#ffe69b'},'太阳'));
        else scene.append(node('text',{x:30,y:38,fill:'#fff'},'白圈所选：' + data.planets[selected].name));
      }
      if (mode === 'distance') scene.append(node('line',{x1:50,x2:940,y1:245,y2:245,stroke:'#586b8f'}));
      data.planets.forEach((p, i) => {
        const radius = 48 + i * 53;
        let x, y, r;
        if (mode === 'orbits') {
          scene.append(node('ellipse',{cx:500,cy:270,rx:radius,ry:radius * .54,fill:'none',stroke:'#435674','stroke-width':1}));
          x=0; y=0; r=i<4?6:10;
        } else if (mode === 'distance') { x=50+p.au/30.05*870; y=245; r=7; }
        else { x=70+i*122; y=245; r=p.diameter/139820*55; }
        const group=node('g',{'data-planet-marker':i});
        group.append(node('circle',{cx:x,cy:y,r,fill:p.color,stroke:i===selected?'#fff':'transparent','stroke-width':3}));
        if (mode === 'orbits') {
          group.append(node('title', {}, p.name));
          markers.push({group,index:i,radius});
        } else {
          const labelY=mode==='distance'?300+(i%4)*47:340;
          group.append(node('line',{x1:x,x2:x,y1:y+r+5,y2:labelY-23,stroke:'#7585a0'}));
          group.append(node('text',{x,y:labelY,'text-anchor':'middle',fill:'#fff'},p.name));
          group.append(node('text',{x,y:labelY+25,'text-anchor':'middle',fill:'#c6d6ec','font-size':17},mode==='distance'?String(p.au):String(p.diameter)));
        }
        scene.append(group);
      });
      position();
      control.hidden = mode !== 'orbits';
      showInfo();
    }
    function showInfo() {
      const p=data.planets[selected];
      root.querySelector('.roam-planet-info').innerHTML=`<h3>${esc(p.name)}</h3><dl><div><dt>平均日距</dt><dd>${p.au} 倍日地距离</dd></div><div><dt>公转一圈</dt><dd>约 ${p.period} 地球年</dd></div><div><dt>平均直径</dt><dd>约 ${p.diameter.toLocaleString('zh-CN')} 千米</dd></div></dl><p>${esc(p.fact)}</p>`;
    }
    function stop() { running=false; cancelAnimationFrame(frame); control.textContent='开始公转'; control.setAttribute('aria-pressed','false'); }
    function tick(time) {
      if (!running || !root.isConnected) return;
      if (previous) years+=(time-previous)/12000;
      previous=time; position(); frame=requestAnimationFrame(tick);
    }
    function click(e) {
      const choice=e.target.closest('[data-roam-mode]');
      const planet=e.target.closest('[data-roam-planet]');
      if (choice) {
        stop(); mode=choice.dataset.roamMode;
        root.querySelectorAll('[data-roam-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===choice)));
        draw();
      } else if (planet) {
        selected=Number(planet.dataset.roamPlanet);
        root.querySelectorAll('[data-roam-planet]').forEach(b=>b.setAttribute('aria-pressed',String(b===planet)));
        draw();
      } else if (e.target.closest('[data-roam-play]')) {
        if (running) stop();
        else { running=true; previous=0;control.textContent='暂停公转';control.setAttribute('aria-pressed','true');frame=requestAnimationFrame(tick); }
      }
    }
    function visibility() { if (document.hidden) { stop(); root.querySelectorAll('video').forEach(v=>v.pause()); } }
    function play(e) { if(e.target.tagName==='VIDEO') root.querySelectorAll('video').forEach(v=>{ if(v!==e.target)v.pause(); }); }
    function error(e) { if(e.target.tagName==='VIDEO') e.target.nextElementSibling.hidden=false; }
    const observer = new IntersectionObserver(entries => entries.forEach(({target,isIntersecting})=>{ if(!isIntersecting) { if (target.tagName === 'VIDEO') target.pause(); else stop(); } }));
    root.querySelectorAll('video').forEach(v=>observer.observe(v));
    observer.observe(root.querySelector('.roam-solar-stage'));
    root.addEventListener('click',click); root.addEventListener('play',play,true);root.addEventListener('error',error,true);
    document.addEventListener('visibilitychange',visibility);
    draw(); // 动画只在主动播放后运行，也适用于减少动态效果偏好。
    dispose=()=>{stop();observer.disconnect();root.querySelectorAll('video').forEach(v=>v.pause());root.removeEventListener('click',click);root.removeEventListener('play',play,true);root.removeEventListener('error',error,true);document.removeEventListener('visibilitychange',visibility);};
  }
  window.AstroMedia={render,mount,dispose:()=>dispose()};
})();

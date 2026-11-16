/* 球面航线沿分段大圆弧前进，停站控制复用原漫游时钟。 */
window.GMWorldVoyages = (() => {
  'use strict';
  function buildRoute(config) {
    const G = window.GMWorld3DGeometry, points = [], distances = [], nodes = [config.stops[0].point], stops = [];
    let length = 0;
    config.stops.forEach((stop, i) => {
      if (i === 0) { points.push(G.xyz(stop.point)); distances.push(0); }
      else for (const next of stop.via) {
        const previous = nodes.at(-1), arc = G.arc(previous, next, Math.max(2, Math.ceil(G.angle(previous, next) * 180 / Math.PI * 3)));
        const segmentKm = G.angle(previous, next) * 6371;
        for (let k = 1; k < arc.length; k++) { points.push(arc[k]); distances.push(length + segmentKm * k / (arc.length - 1)); }
        length += segmentKm; nodes.push(next);
      }
      stops.push({...stop, distance: length});
    });
    return {...config, points, distances, nodes, stops, length};
  }
  function position(route, distance) {
    const target = Math.max(0, Math.min(route.length, distance));
    let lo = 0, hi = route.distances.length - 1;
    while (lo + 1 < hi) { const mid = (lo + hi) >> 1; if (route.distances[mid] <= target) lo = mid; else hi = mid; }
    const fraction = (target - route.distances[lo]) / (route.distances[hi] - route.distances[lo] || 1);
    const a = route.points[lo], b = route.points[hi], dot = Math.max(-1, Math.min(1, a.reduce((s,x,i) => s+x*b[i],0))), theta = Math.acos(dot);
    const v = theta < 1e-8 ? a : a.map((x,i) => (x*Math.sin((1-fraction)*theta) + b[i]*Math.sin(fraction*theta))/Math.sin(theta));
    return {point:window.GMWorld3DGeometry.lonLat({x:v[0],y:v[1],z:v[2]}), meters:0};
  }
  function mount({root, focus, overlay, ship, activate}) {
    const D = window.GM_WORLD_EXPEDITIONS, esc = window.GMShared.esc, $ = id => root.querySelector('#gw-voyage-' + id);
    let active = false, route = null, controller = null, visible = false, writing = false;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const fullMotion = () => !media.matches && (!window.StudyEffects || window.StudyEffects.motion === 'full');
    const canPlay = () => active && visible && !document.hidden && fullMotion() && root.dataset.renderer === 'webgl';
    $('routes').innerHTML = D.voyages.map(v => `<button type="button" data-voyage="${v.id}">${esc(v.name)}</button>`).join('');
    function address(state) {
      if (writing || !active || !route) return;
      const url = new URL(location.href); url.searchParams.set('voyage', route.id); url.searchParams.set('port', route.stops[state.index].id);
      url.searchParams.delete('tour'); url.searchParams.delete('stop'); history.replaceState(null, '', url);
    }
    function changed(state) {
      if (!route || !active) return;
      const stop = route.stops[state.index];
      $('count').textContent = `${route.name} · 第 ${state.index+1}／${route.stops.length} 站`;
      $('title').textContent = stop.name; $('text').textContent = stop.text; $('observe').textContent = '看一看：' + stop.observe;
      $('history').href = root.dataset.historyEvent + '?id=' + stop.history;
      $('sources').innerHTML = stop.sources.map(id => D.sources.find(s => s.id === id)).map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}（需联网）↗</a>`).join(' · ');
      $('play').textContent = state.playing ? '暂停航行' : state.phase === 'complete' ? '重新航行' : '继续航行'; $('play').disabled = root.dataset.renderer !== 'webgl' || !fullMotion();
      $('toggle').textContent = $('play').textContent; $('toggle').disabled = $('play').disabled;
      $('prev').disabled = state.index === 0 && state.phase !== 'travel'; $('next').disabled = state.index === route.stops.length-1; $('forward').disabled = $('next').disabled;
      $('stops').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.port) === state.index)));
      $('status').textContent = root.dataset.renderer !== 'webgl' ? '3D 不可用，仍可逐站阅读。' : !fullMotion() ? '已减少动态，可以用站点按钮逐站看。' : state.phase === 'complete' ? '到达终点，航程完成！' : state.playing ? (state.phase === 'stop' ? '停站观察约 8 秒，再向下一站前进。' : `正在前往${route.stops[state.index+1].name}。`) : '已暂停，可以转动地球观察，或继续航行。';
      root.querySelector('#gw-tool-goal').textContent = `${route.name} · ${stop.name}`;
      root.querySelector('#gw-tool-result').textContent = $('status').textContent;
      root.dataset.voyage = route.id; root.dataset.voyageStation = stop.id; root.dataset.voyagePlaying = String(state.playing); root.dataset.voyagePhase = state.phase;
      address(state);
    }
    function start(id, play = false, port = '') {
      const config = D.voyages.find(v => v.id === id); if (!config) return;
      writing = true; controller?.dispose(); writing = false;
      route = buildRoute(config); $('speed').textContent='速度：慢慢看'; $('note').textContent = config.note;
      $('stops').innerHTML = route.stops.map((s,i) => `<button type="button" data-port="${i}" aria-pressed="false">${i+1} · ${esc(s.name)}</button>`).join('');
      $('routes').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.voyage === id)));
      overlay(route.stops.map(s => ({point:s.point,color:'#a45220'})),route.nodes);
      controller = window.GMRiverTour.createTour({route, positionAt:position, holdSeconds:8, travelSeconds:150, request:requestAnimationFrame, cancel:cancelAnimationFrame, canPlay, changed,
        moved: (sample,state) => { ship(sample.point); focus(sample.point, state.phase === 'travel' ? '沿航线前进' : route.stops[state.index].name); $('progress').value = state.progress; root.dataset.voyageProgress = state.progress.toFixed(6); }
      });
      controller.jump(Math.max(0, route.stops.findIndex(s => s.id === port)));
      if (play) { root.querySelector('#gw-viewport').scrollIntoView({block:'center'}); visible = true; controller.play(); }
    }
    function setActive(value) {
      if (active === value) return;
      active = value; $('panel').hidden = !active;
      if (!active) {
        controller?.pause(); ship(null); root.dataset.voyagePlaying='false';
        const url = new URL(location.href); url.searchParams.delete('voyage'); url.searchParams.delete('port'); history.replaceState(null,'',url);
      } else if (!route) start(D.voyages[0].id);
      else { overlay(route.stops.map(s => ({point:s.point,color:'#a45220'})),route.nodes); controller.jump(controller.snapshot().index); }
    }
    $('routes').addEventListener('click', e => { const b=e.target.closest('[data-voyage]'); if (b) { activate('voyage'); start(b.dataset.voyage,true); } });
    $('stops').addEventListener('click', e => { const b=e.target.closest('[data-port]'); if(b) controller?.jump(Number(b.dataset.port)); });
    const toggle=()=>{if(controller?.snapshot().playing)controller.pause();else if(controller){root.querySelector('#gw-viewport').scrollIntoView({block:'center'});visible=true;controller.play();}};
    $('play').addEventListener('click',toggle);$('toggle').addEventListener('click',toggle);
    $('forward').addEventListener('click',()=>{if(controller)controller.jump(controller.snapshot().index+1);});
    $('prev').addEventListener('click', () => {if(controller){const s=controller.snapshot();controller.jump(s.phase==='travel'?s.index:s.index-1);}});
    $('next').addEventListener('click', () => controller?.jump(controller.snapshot().index+1));
    $('speed').addEventListener('click', () => { if (!controller) return; const speed=controller.snapshot().speed===1?2:1; controller.setSpeed(speed); $('speed').textContent=speed===1?'速度：慢慢看':'速度：快一点'; });
    const pause = () => controller?.pause();
    root.addEventListener('gm-world-manual-camera',pause);
    root.addEventListener('gm-world-free-view',e=>{if(e.detail?.origin==='camera')pause();});
    const refresh=()=>controller?.refresh();
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;refresh();});observer.observe(root.querySelector('#gw-viewport'));
    document.addEventListener('visibilitychange',refresh);document.addEventListener('study:effects-change',refresh);media.addEventListener('change',refresh);root.addEventListener('gm-world-renderer-change',refresh);
    window.addEventListener('pagehide',e=>{pause();if(e.persisted)return;controller?.dispose();observer.disconnect();document.removeEventListener('visibilitychange',refresh);document.removeEventListener('study:effects-change',refresh);media.removeEventListener('change',refresh);root.removeEventListener('gm-world-renderer-change',refresh);});
    return {setActive, restore() { const p=new URLSearchParams(location.search); if(D.voyages.some(v=>v.id===p.get('voyage'))){activate('voyage');start(p.get('voyage'),false,p.get('port'));} else if(active) activate('browse'); }, pause};
  }
  return {buildRoute, position, mount};
})();

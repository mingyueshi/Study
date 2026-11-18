/* 点选、输入与回退共用同一套球面计算；任务记录只保存稳定 ID。 */
window.GMWorldTools = (() => {
  'use strict';
  const KEY = 'study_world_globe_hunts_v1';
  function judge(point, target, tolerance) {
    const degrees = window.GMWorld3DGeometry.angle(point, target) * 180 / Math.PI;
    return {degrees, found: degrees <= tolerance + 1e-8};
  }
  function mount({root, focus, overlay, currentPoint, repaint, readCoordinates, sun, detective, prepareDetective, extras, replayTrip}) {
    const D = window.GM_WORLD_TOOLS, G = window.GMWorld3DGeometry, esc = window.GMShared.esc;
    const $ = id => root.querySelector(`#${id}`);
    let measureKind = 'pair', itineraryPoints = [];
    const Play=window.GMWorldPlay;
    let trips=[];try{trips=Play.readTrips(localStorage.getItem(Play.TRIPS));}catch{}
    function drawTrips(){
      $('gw-trip-list').innerHTML=trips.map((t,i)=>`<li><b>${esc(t.name)}</b> · ${t.stops.length} 站 <button type="button" data-trip-open="${i}">打开</button> <button type="button" data-trip-delete="${i}" aria-label="删除旅行：${esc(t.name)}">删除</button></li>`).join('')||'<li>还没有保存的旅行，先连起两站吧。</li>';
    }
    function persistTrips(){try{localStorage.setItem(Play.TRIPS,JSON.stringify(trips));return true;}catch{return false;}}
    $('gw-trip-save').addEventListener('click',()=>{const trip=Play.cleanTrip({name:$('gw-trip-name').value,stops:itineraryPoints});if(!trip){$('gw-trip-status').textContent='先起一个名字，再连起至少两处不同位置。';return;}if(trips.length>=8){$('gw-trip-status').textContent='已经存了 8 趟，请先删除一趟再保存。';return;}trips.unshift(trip);const saved=persistTrips();drawTrips();$('gw-trip-status').textContent=saved?'已保存，下次还可以打开这趟环球旅行。':'本页已记下，但浏览器未能保存到下次。';});
    $('gw-trip-list').addEventListener('click',e=>{const open=e.target.closest('[data-trip-open]'),del=e.target.closest('[data-trip-delete]');if(open&&trips[Number(open.dataset.tripOpen)]){const t=trips[Number(open.dataset.tripOpen)];itineraryPoints=t.stops.map(s=>({name:s.name,point:s.point.slice()}));$('gw-trip-name').value=t.name;drawMeasure();focus(itineraryPoints[0].point,t.name);$('gw-trip-status').textContent='已打开，可以接着加站或回放。';}else if(del&&trips[Number(del.dataset.tripDelete)]){trips.splice(Number(del.dataset.tripDelete),1);const saved=persistTrips();drawTrips();$('gw-trip-status').textContent=saved?'这趟旅行已删除。':'本页已移除，浏览器未能保存变更。';}});
    $('gw-trip-replay').addEventListener('click',()=>{const trip=Play.cleanTrip({name:$('gw-trip-name').value.trim()||'我的环球旅行',stops:itineraryPoints});if(trip)replayTrip(trip);else $('gw-trip-status').textContent='先连起至少两处不同位置，再回放行程。';});drawTrips();
    let mode = 'browse', points = [null, null], active = 0, mission = 0, solved = false, revealed = false, found = new Set();
    try { found = window.GMWorldLearning.readProgress(localStorage.getItem(KEY), D.missions); }
    catch { $('gw-hunt-storage').textContent = '浏览器无法保存记录，本次仍可完成寻宝。'; }
    $('gw-distance-note').textContent = D.distanceNote;
    $('gw-hunt-note').textContent = D.huntNote;
    $('gw-measure-example').innerHTML = D.examples.map(e =>
      `<button type="button" value="${e.id}">${esc(e.name)}</button>`).join('');
    $('gw-hunt-mission').innerHTML = D.missions.map((m, i) =>
      `<button type="button" value="${m.id}" aria-pressed="false">第 ${i + 1} 处 · ${esc(m.name)}</button>`).join('');
    function drawItinerary() {
      const result = window.GMWorldExplorers.itinerary(itineraryPoints.map(p => p.point));
      $('gw-itinerary-stops').innerHTML = itineraryPoints.map((p,i) => `<li><b>${i+1} · ${esc(p.name)}</b>${i ? ` · 本段约 ${Math.round(result.legs[i-1])} 千米` : ''} <button type="button" data-remove-stop="${i}" aria-label="移除第 ${i+1} 站">移除</button></li>`).join('');
      $('gw-distance').textContent = `共 ${itineraryPoints.length} 站 · 累计约 ${Math.round(result.total).toLocaleString('zh-CN')} 千米`;
      $('gw-tool-goal').textContent = $('gw-distance').textContent;
      $('gw-tool-result').textContent = '继续点城市或球面添加下一站；也可以移除或撤销。';
      $('gw-point-submit').textContent = '加入行程';
      $('gw-itinerary-undo').disabled = !itineraryPoints.length;
      $('gw-trip-save').disabled=$('gw-trip-replay').disabled=itineraryPoints.length<2;
      overlay(itineraryPoints.map((p,i) => ({point:p.point,color:i?'#1762a5':'#b94a1e'})), itineraryPoints.length>1 ? itineraryPoints.map(p=>p.point) : null);
    }
    function drawMeasure() {
      root.dataset.measureKind = measureKind;
      $('gw-measure-clear').textContent = measureKind === 'route' ? '清空行程' : '清空两点';
      $('gw-itinerary').hidden = measureKind !== 'route';
      $('gw-my-trips').hidden = measureKind !== 'route';
      for (const id of ['gw-measure-points', 'gw-measure-examples', 'gw-locate-a', 'gw-locate-b']) $(id).hidden = measureKind === 'route';
      $('gw-measure-kinds').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.measureKind===measureKind)));
      if (measureKind === 'route') { drawItinerary(); return; }
      points.forEach((p, i) => {
        const label = i ? 'B 终点' : 'A 起点';
        const button = $(i ? 'gw-point-b' : 'gw-point-a');
        button.textContent = label + '：' + (p ? G.coordinates(p) : '待选择');
        button.setAttribute('aria-pressed', String(active === i));
        $(i ? 'gw-locate-b' : 'gw-locate-a').disabled = !p;
      });
      $('gw-distance').textContent = points.every(Boolean) ? `球面距离约 ${Math.round(G.angle(...points) * D.radiusKm).toLocaleString('zh-CN')} 千米` : `请选${active ? '终点 B（蓝色）' : '起点 A（橙色）'}，点球面或输入坐标。`;
      $('gw-tool-goal').textContent = $('gw-distance').textContent;
      $('gw-tool-result').textContent = points.every(Boolean) ? '橙色 A → 蓝色 B。继续点选可替换终点。' : '拖动旋转，轻点球面选位置。';
      $('gw-point-submit').textContent = `设为${active ? '终点 B' : '起点 A'}`;
      overlay(points.filter(Boolean).map((point, i) => ({point, color: points[0] ? (i ? '#1762a5' : '#b94a1e') : '#1762a5'})), points.every(Boolean) ? points : null);
    }
    function progress() { $('gw-hunt-progress').textContent = `已找到 ${found.size} / ${D.missions.length} 处`; }
    function startMission() {
      solved = false; revealed = false;
      const m = D.missions[mission];
      for (const button of $('gw-hunt-mission').children) button.setAttribute('aria-pressed', String(button.value === m.id));
      $('gw-hunt-target').textContent = '目标：' + G.coordinates(m.point);
      $('gw-tool-goal').textContent = $('gw-hunt-target').textContent;
      $('gw-tool-result').textContent = '第 ' + (mission + 1) + ' / ' + D.missions.length + ' 处 · 点球面提交位置';
      $('gw-hunt-hint').textContent = m.hint;
      $('gw-hunt-feedback').textContent = found.has(m.id) ? '你找到过这里，可以再试一次！' : '转动地球，在你认为正确的位置点一下。橙点表示你的选择。';
      $('gw-hunt-reveal').disabled = false; $('gw-point-submit').disabled = false;
      $('gw-hunt-next').disabled = mission === D.missions.length - 1;
      $('gw-point-lon').value = ''; $('gw-point-lat').value = ''; $('gw-point-error').textContent = '';
      overlay([]); progress();
    }
    function setMode(value, announce = true) {
      if (announce) root.dispatchEvent(new CustomEvent('gm-world-free-view', {detail: {origin: 'tools'}}));
      mode = value; root.dataset.tool = mode;
      sun.setActive(mode === 'daylight');
      if (mode === 'detective') prepareDetective();
      detective.setActive(mode === 'detective');
      if (['voyage','life','outline'].includes(mode)) overlay([]);
      extras?.setActive(mode);
      $('gw-tool-modes').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tool === mode)));
      $('gw-tool-panel').hidden = mode === 'browse';
      $('gw-tool-readout').hidden = mode === 'browse';
      $('gw-measure-panel').hidden = mode !== 'measure'; $('gw-hunt-panel').hidden = mode !== 'hunt';
      $('gw-daylight-panel').hidden = mode !== 'daylight';
      $('gw-detective-panel').hidden = mode !== 'detective'; $('gw-point-form').hidden = ['detective','voyage','life','outline'].includes(mode);
      $('gw-point-error').textContent = ''; $('gw-point-submit').disabled = false;
      if (mode === 'measure') drawMeasure();
      else if (mode === 'hunt') {
        $('gw-grid').checked = true; repaint();
        $('gw-point-submit').textContent = '提交寻宝位置'; startMission();
      } else if (mode === 'daylight') $('gw-point-submit').textContent = '设为昼夜观察点';
      else if (!['voyage','life','outline'].includes(mode)) overlay([]);
      root.dispatchEvent(new CustomEvent('gm-world-tool-change',{detail:{mode}}));
    }
    function handlePoint(point, country, label = '') {
      if (mode === 'browse') return false;
      if (mode === 'detective') return detective.guess(country);
      if (['voyage','life','outline'].includes(mode)) return extras?.handlePoint(mode,point,country) || false;
      if (mode === 'daylight') { sun.pick(point); return true; }
      if (mode === 'measure') {
        if (measureKind === 'route') {
          if (itineraryPoints.length >= 20) { $('gw-tool-result').textContent = '最多放 20 站，请先移除一站。'; return true; }
          if (itineraryPoints.length && G.angle(itineraryPoints.at(-1).point, point)*D.radiusKm < 1) { $('gw-tool-result').textContent = '这一站和上一站太近啦，请换一个地方。'; return true; }
          itineraryPoints.push({point:point.slice(),name:label || G.coordinates(point)}); drawMeasure(); return true;
        }
        points[active] = point.slice(); active = points[0] ? 1 : 0;
        $('gw-measure-observe').textContent = '';
        drawMeasure();
      } else if (mode === 'hunt') {
        if (revealed || solved) return true;
        const m = D.missions[mission], result = judge(point, m.point, D.toleranceDegrees);
        overlay([{point, color: '#b94a1e'}, ...(result.found ? [{point: m.point, color: '#39754f'}] : [])]);
        if (result.found) {
          solved = true; found.add(m.id);
          try { localStorage.setItem(KEY, JSON.stringify([...found])); }
          catch { $('gw-hunt-storage').textContent = '本次已记下，浏览器未能保存到下次。'; }
          $('gw-hunt-feedback').textContent = '找到啦！绿色点是目标。' + m.explanation;
          $('gw-tool-result').textContent = '找到啦！绿色点是目标，可以在下方选择下一处。';
          $('gw-point-submit').disabled = true; $('gw-hunt-reveal').disabled = true; progress();
          root.dispatchEvent(new CustomEvent('gm-world-progress', {detail: {kind: 'hunt', ids: [...found]}}));
          root.dispatchEvent(new CustomEvent('gm-world-answer',{detail:{kind:'hunt',id:m.id}}));
        } else {
          const dy = m.point[1] - point[1], dx = G.wrap(m.point[0] - point[0]);
          const directions = [Math.abs(dy) > 4 ? (dy > 0 ? '往北' : '往南') : '', Math.abs(dx) > 4 ? (dx > 0 ? '往东' : '往西') : ''].filter(Boolean).join('，再');
          $('gw-hunt-feedback').textContent = `再试一试！你选的是${G.coordinates(point)}，与目标相隔约 ${Math.round(result.degrees)}°。${directions ? '试着' + directions + '找找。' : '再靠近目标一点试试。'}`;
          $('gw-tool-result').textContent = `相隔约 ${Math.round(result.degrees)}°，${directions ? '试着' + directions + '找找。' : '再靠近一点试试。'}`;
        }
      }
      return true;
    }
    $('gw-itinerary-note').textContent = window.GM_WORLD_EXPEDITIONS.routeNote;
    $('gw-itinerary-cities').innerHTML = window.GM_WORLD_EXPEDITIONS.cities.map(c=>`<button type="button" data-city="${c.id}">${esc(c.name)}</button>`).join('');
    $('gw-itinerary-cities').addEventListener('click',e=>{const b=e.target.closest('[data-city]');if(b){const c=window.GM_WORLD_EXPEDITIONS.cities.find(c=>c.id===b.dataset.city);handlePoint(c.point,null,c.name);focus(c.point,c.name);}});
    $('gw-itinerary-stops').addEventListener('click',e=>{const b=e.target.closest('[data-remove-stop]');if(b){itineraryPoints.splice(Number(b.dataset.removeStop),1);drawMeasure();}});
    $('gw-itinerary-undo').addEventListener('click',()=>{itineraryPoints.pop();drawMeasure();});
    $('gw-measure-kinds').addEventListener('click',e=>{const b=e.target.closest('[data-measure-kind]');if(b){measureKind=b.dataset.measureKind;drawMeasure();}});
    $('gw-tool-modes').addEventListener('click', event => { const b = event.target.closest('[data-tool]'); if (b) setMode(b.dataset.tool); });
    ['a', 'b'].forEach((letter, i) => {
      $(`gw-point-${letter}`).addEventListener('click', () => { active = i; drawMeasure(); });
      $(`gw-locate-${letter}`).addEventListener('click', () => { if (points[i]) focus(points[i], i ? '终点 B · 蓝色' : '起点 A · 橙色'); });
    });
    $('gw-point-current').addEventListener('click', () => { const p = currentPoint(); if (p) handlePoint(p); });
    $('gw-measure-clear').addEventListener('click', () => { itineraryPoints = []; points = [null, null]; active = 0; $('gw-measure-observe').textContent = ''; drawMeasure(); });
    $('gw-measure-example').addEventListener('click', event => {
      const button = event.target.closest('button');
      const e = D.examples.find(example => example.id === button?.value);
      if (!e) return;
      points = [e.from.slice(), e.to.slice()]; active = 1;
      $('gw-measure-observe').textContent = e.observe; drawMeasure();
      const midpoint = G.arc(...points, 2)[1]; focus(G.lonLat({x: midpoint[0], y: midpoint[1], z: midpoint[2]}), e.name);
    });
    $('gw-point-form').addEventListener('submit', event => {
      event.preventDefault();
      const point = G.parsePoint($('gw-point-lon').value, $('gw-point-lat').value);
      if (!point) { $('gw-point-error').textContent = '请填写有效经纬度：经度 −180～180，纬度 −90～90。'; return; }
      $('gw-point-error').textContent = '';
      handlePoint(point); focus(point, '输入的坐标'); readCoordinates(point, '输入坐标');
    });
    $('gw-hunt-mission').addEventListener('click', event => {
      const button = event.target.closest('button[aria-pressed="false"]');
      if (!button) return;
      mission = D.missions.findIndex(m => m.id === button.value);
      startMission();
    });
    $('gw-hunt-next').addEventListener('click', () => { if (mission < D.missions.length - 1) { mission++; startMission(); } });
    $('gw-hunt-retry').addEventListener('click', startMission);
    $('gw-hunt-reveal').addEventListener('click', () => {
      revealed = true; const m = D.missions[mission]; overlay([{point: m.point, color: '#39754f'}]); focus(m.point, '答案位置 · 绿色');
      root.dispatchEvent(new CustomEvent('gm-world-answer',{detail:{kind:'hunt',id:m.id,revealed:true}}));
      $('gw-hunt-feedback').textContent = '一起观察答案：' + m.explanation + '本次查看不计入找到记录，点「重新找这一处」可以再挑战。';
      $('gw-tool-result').textContent = '绿色点是答案位置。本次查看不计入找到记录。';
      $('gw-point-submit').disabled = true; $('gw-hunt-reveal').disabled = true;
    });
    root.addEventListener('gm-world-selection', event => { if (event.detail?.origin === 'address') return; if (mode !== 'browse') setMode('browse', false); });
    root.addEventListener('gm-world-free-view', event => { if (!['tools', 'camera'].includes(event.detail?.origin) && mode !== 'browse') setMode('browse', false); });
    setMode('browse', false);
    return {handlePoint, activate:setMode, startTimed:kind=>{if(kind==='hunt'){mission=0;setMode('hunt');}else{setMode('detective');detective.startTimed();}}, startSun: id => { setMode('daylight'); sun.showStudy(id); }, resume: kind => {
      if (kind === 'hunt') { const first = D.missions.findIndex(m => !found.has(m.id)); mission = first < 0 ? 0 : first; }
      setMode(kind === 'quiz' ? 'browse' : kind);
    }};
  }
  return {judge, mount};
})();

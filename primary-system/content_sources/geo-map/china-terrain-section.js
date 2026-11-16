/* 剖面只读取原始海拔；距离沿地图上的经纬度直线累计，数据缺口保留断线。 */
window.GMTerrainSection = (() => {
  'use strict';
  const radians = value => value * Math.PI / 180;
  function distance(a, b) {
    const h = Math.sin(radians(b[1] - a[1]) / 2) ** 2 + Math.cos(radians(a[1])) * Math.cos(radians(b[1])) * Math.sin(radians(b[0] - a[0]) / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
  }
  function sampleLine(from, to, sample) {
    const count = Math.max(2, Math.min(1200, Math.ceil(distance(from, to) / 4)));
    const points = [];
    let km = 0;
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const point = from.map((value, axis) => value + (to[axis] - value) * t);
      if (i) km += distance(points[i - 1].point, point);
      const value = sample(point);
      points.push({ point, km, meters: Number.isFinite(value) ? value : null });
    }
    const valid = points.filter(p => p.meters !== null);
    return { points, km, min: valid.length ? Math.min(...valid.map(p => p.meters)) : null,
      max: valid.length ? Math.max(...valid.map(p => p.meters)) : null, missing: points.length - valid.length };
  }
  function chartScale(result) {
    const left = 54, right = 382, top = 24, bottom = 225;
    const low = Math.min(0, Math.floor((result.min ?? 0) / 500) * 500);
    const high = Math.max(500, Math.ceil((result.max ?? 0) / 1000) * 1000);
    const x = km => left + km / (result.km || 1) * (right - left);
    const y = meters => bottom - (meters - low) / (high - low) * (bottom - top);
    return {left,right,top,bottom,low,high,x,y};
  }
  function inspect(result,index) {
    const at = Math.max(0,Math.min(result.points.length-1,Math.round(Number(index)||0))), p=result.points[at], scale=chartScale(result);
    return {...p,index:at,x:scale.x(p.km),y:p.meters===null?null:scale.y(p.meters),delta:p.meters===null||result.points[0].meters===null?null:p.meters-result.points[0].meters};
  }
  function indexAt(result,fraction) {
    const km=Math.max(0,Math.min(1,fraction))*result.km;
    let lo=0,hi=result.points.length-1;while(lo+1<hi){const mid=(lo+hi)>>1;if(result.points[mid].km<km)lo=mid;else hi=mid;}
    return Math.abs(result.points[lo].km-km)<Math.abs(result.points[hi].km-km)?lo:hi;
  }
  function chartSVG(result) {
    const {left,right,top,bottom,low,high,x,y}=chartScale(result);
    const paths = []; let part = [];
    const flush = () => { if (part.length) paths.push(part); part = []; };
    for (const p of result.points) {
      if (p.meters === null) flush();
      else part.push([x(p.km), y(p.meters)]);
    }
    flush();
    let svg = '<text x="6" y="15">海拔／米</text>';
    const tick = high > 4000 ? 2000 : high > 1000 ? 1000 : 250;
    const ticks = [0];
    if (low <= -tick) ticks.unshift(low);
    for (let value = tick; value <= high; value += tick) ticks.push(value);
    for (const value of ticks) {
      const py = y(value);
      svg += `<path class="gm3-section-grid" d="M${left} ${py}H${right}"/><text x="47" y="${py + 5}" text-anchor="end">${Math.round(value)}</text>`;
    }
    for (const line of paths) {
      const d = line.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('');
      svg += `<path class="gm3-section-area" d="${d}L${line.at(-1)[0]} ${bottom}L${line[0][0]} ${bottom}Z"/><path class="gm3-section-curve" d="${d}"/>`;
    }
    for (const t of [0, .5, 1]) svg += `<text x="${x(result.km * t)}" y="247" text-anchor="${t === 0 ? 'start' : t === 1 ? 'end' : 'middle'}">${Math.round(result.km * t)}</text>`;
    svg += '<text x="54" y="273">A 起点</text><text x="220" y="273" text-anchor="middle">距离／千米 →</text><text x="382" y="273" text-anchor="end">B 终点</text>';
    if (result.min === null) svg += '<text x="220" y="130" text-anchor="middle">沿线没有地形数据</text>';
    return svg;
  }

  function create({ root, canvas, sample, pick, project, requestDraw, setDrawing, prepare, presetView, sampleReady }) {
    const $ = id => root.querySelector('#gm3-section-' + id);
    const data = window.GM_CHINA_3D.section;
    const esc = window.GMShared.esc;
    let drawing = false, start = null, end = null, gesture = null, frame = 0, current = null, available = true, generation = 0, probeIndex = 0;
    const coords = point => `${point[0].toFixed(2)}°E，${point[1].toFixed(2)}°N`;
    const say = text => { $('status').textContent = text; $('hint').textContent = text; };
    $('intro').textContent = data.intro;
    $('observe').textContent = data.observe;
    $('note').textContent = data.note;
    $('scrub-note').textContent = data.scrubNote;
    $('demo').textContent = data.presetName;
    $('steps').innerHTML = window.GM_STEPS.map(step => `<li style="--step-color:${step.color}"><b>${esc(step.name)}</b><span>${esc(step.altitude)}</span></li>`).join('');
    function mode(on) {
      drawing = on;
      root.dataset.sectionDrawing = String(on);
      $('draw').setAttribute('aria-pressed', String(on));
      $('draw').textContent = on ? '取消拉线（Esc）' : '拉线画剖面';
      setDrawing(on);
    }
    function stopGesture() {
      cancelAnimationFrame(frame); frame = 0;
      const id = gesture?.id; gesture = null;
      if (id !== undefined && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    }
    function cancel() {
      generation++;
      stopGesture(); start = end = null; mode(false); requestDraw();
      say(current ? '保留上次剖面，可重新拉线。' : '选择西向东示范，或在地图上拉一条线。');
    }
    function reveal() {
      if (root.dataset.slCollapsed === 'true') root.querySelector(':scope > .sl-sidebar > .sl-header > .sl-collapse')?.click();
      if (root.dataset.slMode === 'compact' && root.dataset.slOpen !== 'true') root.querySelector(':scope > .sl-sidebar > .sl-header > .sl-toggle:not(.sl-collapse)')?.click();
      const panel = root.querySelector('#gm3-section');
      panel.focus({ preventScroll: true });
      requestAnimationFrame(() => $('chart').scrollIntoView({ block: 'center', behavior: 'instant' }));
    }
    function finish(a,b,demo=false) {
      if(!sampleReady){renderResult(a,b,demo);return;}
      const token=++generation;stopGesture();mode(false);say('正在看清沿线的地形……');
      sampleReady(a,b,()=>{if(token===generation&&available)renderResult(a,b,demo);}).catch(()=>{if(token===generation)say('沿线地形暂时没读到，请稍后重新拉线。');});
    }
    function updateProbe() {
      if(!current)return;
      const p=inspect(current,probeIndex);probeIndex=p.index;$('position').value=probeIndex;
      const elevation=p.meters===null?'这里缺少地形资料，曲线留空。':`海拔约 ${Math.round(p.meters)} 米。`;
      const difference=p.delta===null?'':Math.abs(p.delta)<10?'与 A 点差不多高。':`比 A 点${p.delta>0?'高':'低'}约 ${Math.round(Math.abs(p.delta))} 米。`;
      $('probe-readout').textContent=`从 A 走了约 ${Math.round(p.km)} 千米，${elevation}${difference}`;
      $('position').setAttribute('aria-valuetext',$('probe-readout').textContent);
      let cursor=$('chart').querySelector('#gm3-section-cursor');if(!cursor){cursor=document.createElementNS('http://www.w3.org/2000/svg','g');cursor.id='gm3-section-cursor';cursor.setAttribute('aria-hidden','true');$('chart').append(cursor);}
      cursor.innerHTML=`<path d="M${p.x} 24V225"/>${p.y===null?'':`<circle cx="${p.x}" cy="${p.y}" r="5"/>`}`;
      root.dataset.sectionProbe=String(probeIndex);root.dataset.sectionProbeKm=p.km.toFixed(2);
      if(p.meters===null)delete root.dataset.sectionProbeMeters;else root.dataset.sectionProbeMeters=p.meters.toFixed(2);
      requestDraw();
    }
    $('position').addEventListener('input',e=>{probeIndex=Number(e.target.value);updateProbe();});
    for(const target of ['highest','lowest'])$(target).addEventListener('click',()=>{if(!current)return;const meters=target==='highest'?current.max:current.min;if(meters===null)return;probeIndex=current.points.findIndex(p=>p.meters===meters);updateProbe();});
    function pickChart(e){if(!current)return;const matrix=$('chart').getScreenCTM();if(!matrix)return;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());probeIndex=indexAt(current,(p.x-54)/(382-54));updateProbe();}
    $('chart').addEventListener('pointerdown',e=>{if(!current||e.button!==0||!e.isPrimary)return;e.preventDefault();$('chart').setPointerCapture(e.pointerId);pickChart(e);});
    $('chart').addEventListener('pointermove',e=>{if($('chart').hasPointerCapture(e.pointerId))pickChart(e);});
    for(const event of ['pointerup','pointercancel'])$('chart').addEventListener(event,e=>{if($('chart').hasPointerCapture(e.pointerId))$('chart').releasePointerCapture(e.pointerId);});
    function renderResult(a, b, demo = false) {
      if (distance(a, b) < 1) { say('A、B 太近了，请把 B 放远一点。'); return; }
      const result = sampleLine(a, b, sample);
      current = { ...result, from: a, to: b };
      $('chart').innerHTML = chartSVG(result);
      $('chart').setAttribute('aria-label', `A 到 B 地形剖面，约 ${Math.round(result.km)} 千米，${result.min === null ? '无高程数据' : `海拔约 ${Math.round(result.min)} 至 ${Math.round(result.max)} 米`}`);
      $('summary').textContent = `全长约 ${Math.round(result.km)} 千米` + (result.min === null ? '，沿线没有地形数据。' : ` · 沿线海拔约 ${Math.round(result.min)}—${Math.round(result.max)} 米。`) + (result.missing ? ' 空白段缺少地形数据。' : '');
      $('route').textContent = `A：${coords(a)} → B：${coords(b)}。${demo ? data.presetNote : ''}`;
      $('result').hidden = false; $('clear').disabled = false;
      probeIndex=0;$('position').max=String(result.points.length-1);$('highest').disabled=$('lowest').disabled=result.min===null;updateProbe();
      root.dataset.sectionFrom = a.join(','); root.dataset.sectionTo = b.join(',');
      root.dataset.sectionKm = result.km.toFixed(2);
      start = end = null; stopGesture(); mode(false);
      say('剖面已画好。可以转动地图，或重新拉线比较。');
      requestDraw(); reveal();
    }
    function redraw() {
      const layer = $('layer');
      if (!available) { layer.innerHTML = ''; return; }
      const points = start ? [{ point: start, meters: sample(start) }, ...(end ? [{ point: end, meters: sample(end) }] : [])] : current?.points || [];
      let d = '', pen = false;
      const projected = points.map(p => p.meters === null ? null : project(p));
      for (const p of projected) {
        if (!p?.visible) { pen = false; continue; }
        d += `${pen ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`; pen = true;
      }
      layer.innerHTML = `<path class="gm3-section-trace" d="${d}"/>` + [projected[0], projected.length > 1 ? projected.at(-1) : null].map((p, i) => !p?.visible ? '' : `<g transform="translate(${p.x} ${p.y})"><circle r="12"/><text y="5" text-anchor="middle">${i ? 'B' : 'A'}</text></g>`).join('');
      const probe=!start&&current?projected[probeIndex]:null;
      if(probe?.visible)layer.insertAdjacentHTML('beforeend',`<circle class="gm3-section-probe" cx="${probe.x}" cy="${probe.y}" r="7"/>`);
    }
    $('draw').disabled = $('demo').disabled = false;
    $('draw').addEventListener('click', () => {
      if (drawing) { cancel(); return; }
      prepare(); start = end = null; mode(true);
      say('在地形上从 A 拖到 B，或依次点 A、B。Esc 取消。');
      canvas.scrollIntoView({ block: 'center', behavior: 'instant' }); canvas.focus({ preventScroll: true });
    });
    $('demo').addEventListener('click', () => { cancel(); prepare(); presetView(); finish(data.from, data.to, true); });
    $('clear').addEventListener('click', () => {
      current = null; cancel(); $('result').hidden = true; $('clear').disabled = true;
      delete root.dataset.sectionProbe;delete root.dataset.sectionProbeKm;delete root.dataset.sectionProbeMeters;
      delete root.dataset.sectionFrom; delete root.dataset.sectionTo; delete root.dataset.sectionKm;
    });
    const take = e => { e.preventDefault(); e.stopImmediatePropagation(); };
    canvas.addEventListener('pointerdown', e => {
      if (!drawing) return;
      take(e);
      if (!e.isPrimary || e.button !== 0 || gesture) return;
      const point = pick(e);
      if (!point) { say('请在有地形的陆地上选择 A 或 B。'); return; }
      gesture = { id: e.pointerId, x: e.clientX, y: e.clientY, second: Boolean(start), moved: false };
      if (!start) start = point;
      end = point;
      canvas.setPointerCapture(e.pointerId); requestDraw();
    }, true);
    canvas.addEventListener('pointermove', e => {
      if (!drawing || !gesture || e.pointerId !== gesture.id) return;
      take(e);
      if (Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) > 6) gesture.moved = true;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { frame = 0; end = pick(e); requestDraw(); });
    }, true);
    canvas.addEventListener('pointerup', e => {
      if (!drawing) return;
      take(e);
      if (!gesture || e.pointerId !== gesture.id) return;
      const done = gesture.second || gesture.moved;
      const point = pick(e); stopGesture();
      if (done && point) finish(start, point);
      else { end = null; say(done ? 'B 要落在有地形的陆地上，请再点一次。' : 'A 已标好，再点一个位置作为 B。'); requestDraw(); }
    }, true);
    canvas.addEventListener('pointercancel', () => { if (drawing) cancel(); }, true);
    canvas.addEventListener('lostpointercapture', () => { if (gesture) cancel(); });
    document.addEventListener('keydown', e => { if (drawing && e.key === 'Escape') { e.preventDefault(); cancel(); } });
    document.addEventListener('visibilitychange', () => { if (document.hidden && drawing) cancel(); });
    window.addEventListener('pagehide', () => { if (drawing) cancel(); else stopGesture(); });
    return { redraw, cancel, suspend() { cancel(); available = false; $('draw').disabled = $('demo').disabled = true; $('layer').innerHTML = ''; say('3D 画面不可用，恢复画面后可拉线。已有剖面仍可阅读。'); },
      resume() { available = true; $('draw').disabled = $('demo').disabled = false; say('选择西向东示范，或在地图上拉一条线。'); requestDraw(); } };
  }
  return { distance, sampleLine, chartSVG, inspect, indexAt, create };
})();

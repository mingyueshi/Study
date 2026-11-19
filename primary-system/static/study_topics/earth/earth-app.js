(() => {
  'use strict';
  const mediaBase = new URL('.', document.currentScript.src);
  const root = document.querySelector('.earth-topic');
  if (!root || !window.EARTH_INTERIOR || !window.EarthModel) return;
  const data = window.EARTH_INTERIOR, model = window.EarthModel;
  const page = data.pages.find(p => p.id === root.dataset.earthPage);
  const $ = selector => root.querySelector(selector);
  const params = new URLSearchParams(location.search);
  const valid = (key, items, fallback) => items.some(item => item.id === params.get(key)) ? params.get(key) : fallback;
  function remember(key, value) {
    const url = new URL(location.href); url.searchParams.set(key, value);
    try { history.replaceState(null, '', url); } catch (error) { /* 本地文件仍可继续观察。 */ }
  }
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const media = id => data.media.find(m => m.id === id);
  const picture = (id, lazy = true) => {
    const item = media(id);
    return `<img src="${esc(new URL(item.src, mediaBase).href)}" alt="${esc(item.alt)}"${lazy ? ' loading="lazy"' : ''} decoding="async">`;
  };
  const credit = id => {
    const item = media(id);
    return `<p class="earth-photo-credit">实拍 · ${esc(item.credit)} · ${esc(item.license)} · <a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">素材出处 ↗</a></p>`;
  };
  function pressed(container, attribute, selected) {
    container.querySelectorAll(`[${attribute}]`).forEach(button => button.setAttribute('aria-pressed', String(button.getAttribute(attribute) === String(selected))));
  }
  const eyebrow = $('p#earth-eyebrow');
  if (eyebrow) eyebrow.textContent = page.eyebrow;
  $('#earth-intro').textContent = page.intro;
  const sideQuestion = $('p#earth-side-question');
  if (sideQuestion) sideQuestion.textContent = page.question;
  $('#earth-question-title').textContent = '想一想 · ' + page.question;
  $('#earth-answer').textContent = page.answer;
  $('#earth-explain').innerHTML = page.cards.map(card => `<article class="earth-card"><h3>${esc(card.title)}</h3><p>${esc(card.body)}</p></article>`).join('');
  $('#earth-source-list').innerHTML = page.sources.map(id => data.sources.find(s => s.id === id)).map(source => `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a><p>${esc(source.scope)} 核对：${esc(source.checked)}。</p></li>`).join('');

  function overview() {
    let selected = valid('layer', data.layers, 'mantle'), enlarged = params.get('scale') === 'enlarged';
    const picker = $('#layer-picker');
    picker.innerHTML = data.layers.map(layer => `<button type="button" data-layer="${layer.id}" aria-pressed="false">${esc(layer.title)}</button>`).join('');
    function draw() {
      pressed(picker, 'data-layer', selected);
      pressed($('#scale-picker'), 'data-scale', enlarged ? 'enlarged' : 'real');
      const layers = model.layerRadii(data.radiusKm, data.layers, enlarged), cx = 270, cy = 240, radius = 205;
      const ring = (outer, inner) => {
        const ro = outer * radius, ri = inner * radius;
        return `M${cx-ro},${cy}a${ro},${ro} 0 1,0 ${ro*2},0a${ro},${ro} 0 1,0 ${-ro*2},0` + (ri ? `M${cx-ri},${cy}a${ri},${ri} 0 1,0 ${ri*2},0a${ri},${ri} 0 1,0 ${-ri*2},0` : '');
      };
      $('#earth-cutaway').innerHTML = `<title>地壳、地幔、外核与内核的剖面</title>` + layers.map((layer, i) => {
        const item = data.layers[i], y = 80 + i * 105, mid = (layer.outer + layer.inner) / 2 * radius;
        return `<path d="${ring(layer.outer, layer.inner)}" fill="${item.color}" fill-rule="evenodd" stroke="${selected === item.id ? '#244f56' : '#704b37'}" stroke-width="${selected === item.id ? 3 : .8}" data-diagram-layer="${item.id}" style="cursor:pointer"/><path d="M${cx+mid},${cy}L500,${y}H525" fill="none" stroke="#6c6358" stroke-width="1.5"/><text x="540" y="${y+6}" font-weight="${selected === item.id ? 850 : 500}">${esc(item.title)}</text>`;
      }).join('');
      const layer = data.layers.find(l => l.id === selected);
      $('#layer-detail').innerHTML = `<p class="earth-kicker">所选圈层</p><h3>${esc(layer.title)}</h3><dl><div><dt>物理状态</dt><dd>${esc(layer.state)}</dd></div><div><dt>距地表深度（示例）</dt><dd>${layer.top}—${layer.bottom} 千米</dd></div></dl><p><b>${esc(layer.material)}</b></p><p>${esc(layer.detail)}</p>`;
      $('#earth-scale-note').textContent = enlarged ? '地壳厚度已夸大到半径的 7%，便于点选；其余边界保持半径比例。线条粗细不代表真实厚度。' : '球形截面按平均半径 6371 千米作图，地壳以 35 千米示例，因此只有极薄一圈；线条粗细不代表真实厚度。';
    }
    picker.addEventListener('click', event => { const button = event.target.closest('[data-layer]'); if (button) { selected = button.dataset.layer; remember('layer', selected); draw(); } });
    $('#earth-cutaway').addEventListener('click', event => { const shape = event.target.closest('[data-diagram-layer]'); if (shape) { selected = shape.dataset.diagramLayer; remember('layer', selected); draw(); } });
    $('#scale-picker').addEventListener('click', event => { const button = event.target.closest('[data-scale]'); if (button) { enlarged = button.dataset.scale === 'enlarged'; remember('scale', button.dataset.scale); draw(); } });
    $('#earth-journeys').innerHTML = data.pages.slice(1).map((entry, i) => `<a class="earth-card earth-launch" href="${entry.id}.html"><p class="earth-kicker">${String(i+1).padStart(2,'0')} / 04</p><strong>${esc(entry.title)}</strong><p>${esc(entry.intro)}</p><span>打开观察台 →</span></a>`).join('');
    draw();
  }

  function rocks() {
    const picker = $('#specimen-picker');
    picker.innerHTML = data.specimens.map(item => `<button type="button" data-specimen="${item.id}" aria-pressed="false">${picture(item.media, false)}<b>${esc(item.title)}</b><span>${esc(item.kind)}</span></button>`).join('');
    function choose(id) {
      const item = data.specimens.find(s => s.id === id);
      pressed(picker, 'data-specimen', id);
      $('#specimen-detail').innerHTML = `<p class="earth-kicker">${esc(item.kind)}</p><h3>${esc(item.title)}</h3><p>${esc(item.detail)}</p><p><b>观察线索：</b>${esc(item.observe)}</p>${credit(item.media)}`;
    }
    picker.addEventListener('click', event => { const button = event.target.closest('[data-specimen]'); if (button) { choose(button.dataset.specimen); remember('specimen', button.dataset.specimen); } });
    choose(valid('specimen', data.specimens, 'quartz'));
    let history = [{id:'magma',process:'起点'}];
    $('#rock-states').innerHTML = data.rockStates.map(state => `<button type="button" data-rock="${state.id}" aria-pressed="false">${esc(state.title)}</button>`).join('');
    function draw() {
      const current = data.rockStates.find(state => state.id === history.at(-1).id);
      pressed($('#rock-states'), 'data-rock', current.id);
      $('#rock-current').innerHTML = `<p class="earth-kicker">现在的材料</p><h3>${esc(current.title)}</h3><p>${esc(current.detail)}</p>`;
      $('#rock-options').innerHTML = model.rockOptions(data.rockPaths, current.id).map(edge => `<button type="button" data-rock-to="${edge.to}"><b>${esc(edge.process)} → ${esc(data.rockStates.find(s => s.id === edge.to).title)}</b><span>${esc(edge.detail)}</span></button>`).join('');
      $('#rock-back').disabled = history.length <= 1;
      $('#rock-history').innerHTML = history.map(item => `<li>${esc(item.process)}：${esc(data.rockStates.find(s => s.id === item.id).title)}</li>`).join('');
    }
    $('#rock-states').addEventListener('click', event => { const button = event.target.closest('[data-rock]'); if (button) { history = [{id:button.dataset.rock,process:'新起点'}]; draw(); } });
    $('#rock-options').addEventListener('click', event => {
      const button = event.target.closest('[data-rock-to]'); if (!button) return;
      const edge = model.rockOptions(data.rockPaths, history.at(-1).id).find(e => e.to === button.dataset.rockTo);
      if (!edge) return;
      history.push({id:edge.to,process:edge.process});
      draw(); $('#rock-current').scrollIntoView({block:'nearest'});
    });
    $('#rock-back').addEventListener('click', () => { if (history.length > 1) history.pop(); draw(); });
    $('#rock-reset').addEventListener('click', () => { history = [{id:'magma',process:'起点'}]; draw(); });
    draw();
  }

  const svgDefs = '<defs><marker id="earth-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0L6,3L0,6" fill="none" stroke="#244f56" stroke-width="1.5"/></marker></defs>';
  const arrow = (x1,y1,x2,y2) => `<path d="M${x1},${y1}L${x2},${y2}" stroke="#244f56" stroke-width="4" marker-end="url(#earth-arrow)"/>`;
  function quakes() {
    let distance = 120;
    $('#wave-readout').removeAttribute('aria-live');
    function draw(progress) {
      const times = model.arrivals(distance), horizon = times.s + 5, seconds = progress * horizon;
      const stationX = 120 + distance * 3;
      $('#wave-diagram').innerHTML = `<title>地震波传播：P 波先于 S 波抵达观测站</title><defs><clipPath id="earth-wave-ground"><rect y="95" width="760" height="245"/></clipPath></defs><rect width="760" height="340" fill="#f3e7d3"/><rect width="760" height="95" fill="#dfedf0"/><path d="M0,95H760M78,95L190,320" fill="none" stroke="#897f73" stroke-width="3"/><g clip-path="url(#earth-wave-ground)"><circle cx="120" cy="155" r="${seconds*6*3}" stroke="#30788a" stroke-width="3" fill="none"/><circle cx="120" cy="155" r="${seconds*3.5*3}" stroke="#b85e3d" stroke-width="3" stroke-dasharray="9 6" fill="none"/></g><path d="M120,95V155" stroke="#4b4c51" stroke-dasharray="5 4"/><circle cx="120" cy="155" r="8" fill="#a94228"/><circle cx="120" cy="95" r="6" fill="#30363c"/><path d="M${stationX-15},95L${stationX},68L${stationX+15},95Z" fill="#244f56"/><text x="78" y="58">震中</text><text x="139" y="161">震源</text><text x="18" y="220">深 20 km</text><text x="${Math.min(stationX-45,625)}" y="48">观测站</text><text x="24" y="306" fill="#30788a">实线：P 波</text><text x="240" y="306" fill="#b85e3d">虚线：S 波</text><text x="510" y="306">示意时间 ${seconds.toFixed(1)} 秒</text>`;
      $('#station-value').textContent = `${distance} 千米`;
      // 屏幕阅读器通过播放状态获知变化，不逐帧播报时间。
      $('#wave-readout').innerHTML = `<div><span>P 波约在</span><b>${times.p.toFixed(1)} 秒到达</b><span>${seconds >= times.p ? '● 已到达' : '尚未到达'}</span></div><div><span>S 波约在</span><b>${times.s.toFixed(1)} 秒到达</b><span>${seconds >= times.s ? '● 已到达' : '尚未到达'}</span></div><div><span>到时差</span><b>${(times.s-times.p).toFixed(1)} 秒</b><span>距离越远，本模型时差越大</span></div>`;
    }
    const player = window.EarthMotion($('#wave-lab'), draw);
    $('#station-distance').addEventListener('input', event => { distance = Number(event.target.value); player.set(0); });
    $('#volcano-gallery').innerHTML = data.volcanoes.map(item => `<article class="earth-card earth-volcano">${picture(item.media)}<h3>${esc(item.title)}</h3><p>${esc(item.detail)}</p>${credit(item.media)}</article>`).join('');
  }

  function plates() {
    let selected = valid('boundary', data.boundaries, 'divergent');
    const picker = $('#boundary-picker');
    picker.innerHTML = data.boundaries.map(item => `<button type="button" data-boundary="${item.id}" aria-pressed="false">${esc(item.title)}</button>`).join('');
    function draw(progress) {
      let shapes = '', caption = '', d = progress * 65;
      if (selected === 'divergent') {
        shapes = `<rect x="0" y="130" width="${360-d}" height="65" fill="#8c8071"/><rect x="${400+d}" y="130" width="${360-d}" height="65" fill="#8c8071"/><path d="M${355-d},195L380,110L${405+d},195Z" fill="#df7645"/>${arrow(300-d,103,230-d,103)}${arrow(460+d,103,530+d,103)}${arrow(380,290,380,211)}<text x="293" y="48">两侧分开 · 岩浆上升</text>`;
        caption = '剖面：新洋壳在洋脊附近形成';
      } else if (selected === 'subduction') {
        shapes = `<path d="M0,130H${300+d}L${530+d},300L${495+d},320L${285+d},185H0Z" fill="#73878e"/><path d="M${365+d*.3},120H760V205H${475+d*.3}Z" fill="#a88b69"/><path d="M575,120L610,65L645,120Z" fill="#9b7554"/><path d="M600,160Q550,200 510,245" stroke="#df7645" stroke-width="12" fill="none"/>${arrow(170,105,250,105)}${arrow(430,205,495,252)}<text x="420" y="42">上覆地幔部分熔融 → 火山弧</text>`;
        caption = '剖面：海洋岩石圈俯冲进入地幔';
      } else if (selected === 'collision') {
        const h = 135 - progress * 65;
        shapes = `<path d="M0,135H${300+d}L380,${h}L${460-d},135H760V215H460L380,${240+progress*45}L300,215H0Z" fill="#a88b69"/><path d="M310,150L350,115L380,160L410,115L450,150" stroke="#76604c" stroke-width="4" fill="none"/>${arrow(180,105,260,105)}${arrow(580,105,500,105)}<text x="270" y="42">缩短、增厚 · 山脉隆起</text>`;
        caption = '剖面：大陆碰撞，地壳增厚';
      } else {
        shapes = `<rect width="760" height="340" fill="#e9dfc9"/><rect x="0" y="0" width="380" height="340" fill="#d6dfd1"/><path d="M380,0V340" stroke="#665b4c" stroke-width="5"/><path d="M0,${150-d}H380M380,${150+d}H760" stroke="#678d9b" stroke-width="20"/><path d="M0,${150-d}H380M380,${150+d}H760" stroke="#d9edf0" stroke-width="8"/>${arrow(300,225,300,130)}${arrow(460,115,460,210)}<text x="35" y="45">俯视图 · 地表标志沿断层错开</text><text x="465" y="300">水平滑动</text>`;
        caption = '俯视：板块沿边界擦过，观察蓝色标志的错开';
      }
      $('#plate-diagram').innerHTML = `<title>${esc(caption)}</title>${svgDefs}<rect width="760" height="130" fill="#dfedf0"/><rect y="130" width="760" height="210" fill="#eac6a2"/>${shapes}`;
    }
    const player = window.EarthMotion($('#plate-lab'), draw);
    function choose(id) {
      selected = id; const item = data.boundaries.find(b => b.id === id);
      pressed(picker, 'data-boundary', id);
      $('#boundary-detail').innerHTML = `<p class="earth-kicker">${esc(item.motion)}</p><h3>${esc(item.result)}</h3><p>${esc(item.detail)}</p><p><b>在地图上找：</b>${esc(item.example)}</p>`;
      player.set(0);
    }
    picker.addEventListener('click', event => { const button = event.target.closest('[data-boundary]'); if (button) { choose(button.dataset.boundary); remember('boundary', button.dataset.boundary); } });
    choose(selected);
  }

  function age() {
    $('#halflife-picks').innerHTML = [0,1,2,3,4].map(n => `<button type="button" data-half="${n}" aria-pressed="false">${n} 个半衰期</button>`).join('');
    function decay(n) {
      const state = model.decay(n, data.halfLifeMa);
      $('#halflife').value = String(n); $('#halflife-value').textContent = state.halfLives.toFixed(2);
      pressed($('#halflife-picks'), 'data-half', state.halfLives);
      $('#decay-parent').style.width = state.parent * 100 + '%';
      $('#decay-daughter').style.width = state.daughter * 100 + '%';
      $('#decay-bar').setAttribute('aria-label', `母体剩余 ${(state.parent*100).toFixed(2)}%，子体约 ${(state.daughter*100).toFixed(2)}%`);
      $('#decay-readout').innerHTML = `<div><span>蓝色 · 母体铀—238</span><b>${(state.parent*100).toFixed(2)}%</b></div><div><span>金色 · 生成的子体铅—206</span><b>${(state.daughter*100).toFixed(2)}%</b></div><div><span>模型经过时间</span><b>${(state.ma/100).toFixed(2)} 亿年</b></div>`;
    }
    $('#halflife').addEventListener('input', event => decay(Number(event.target.value)));
    $('#halflife-picks').addEventListener('click', event => { const button = event.target.closest('[data-half]'); if (button) decay(Number(button.dataset.half)); });
    decay(1);
    $('#earth-event-picker').innerHTML = data.events.map(item => `<button type="button" data-event="${item.id}" aria-pressed="false">${esc(item.title)}</button>`).join('');
    $('#earth-day-track').innerHTML = data.events.map(item => `<i data-event-mark="${item.id}" style="left:${model.earthDay(item.ma,data.ageMa)/864}%"></i>`).join('');
    function time(ma, selected) {
      const event = selected || data.events.filter(e => e.ma >= ma).at(-1) || data.events[0];
      $('#earth-clock').textContent = model.clock(model.earthDay(ma, data.ageMa));
      $('#earth-day-age').textContent = ma === 0 ? '来到今天' : `距今约 ${ma >= 100 ? (ma/100).toFixed(2)+' 亿' : (ma*100).toLocaleString('zh-CN',{maximumFractionDigits:1})+' 万'}年`;
      $('#earth-day').value = String(model.earthDay(ma,data.ageMa)/86.4);
      $('#earth-day').setAttribute('aria-valuetext', $('#earth-clock').textContent + '，' + $('#earth-day-age').textContent);
      pressed($('#earth-event-picker'), 'data-event', selected ? event.id : '');
      $('#earth-day-track').querySelectorAll('i').forEach(mark => mark.classList.toggle('active', Boolean(selected && mark.dataset.eventMark === event.id)));
      $('#earth-event-detail').innerHTML = `<p class="earth-kicker">${selected ? '所选事件' : '这一时段之前的参考事件'}</p><h3>${esc(event.title)}</h3><p>${esc(event.detail)}</p>`;
    }
    $('#earth-day').addEventListener('input', event => {
      time((1-Number(event.target.value)/1000)*data.ageMa);
      const url = new URL(location.href); url.searchParams.delete('event');
      try { history.replaceState(null, '', url); } catch (error) { /* 本地文件继续观察。 */ }
    });
    $('#earth-event-picker').addEventListener('click', event => { const button = event.target.closest('[data-event]'); if (button) { const item = data.events.find(e => e.id === button.dataset.event); time(item.ma,item); remember('event', item.id); } });
    const initial = data.events.find(e => e.id === valid('event', data.events, 'formation'));
    time(initial.ma, initial);
  }
  ({index:overview,rocks,quakes,plates,age}[page.id])();
})();

(() => {
  'use strict';
  const root = document.querySelector('.skills-topic');
  if (!root) return;
  const data = window.MapSkillsData;
  const model = window.MapSkillsModel;
  const diagrams = window.MapSkillsDiagrams;
  const page = data.pages.find(p => p.id === root.dataset.skillsPage);
  const mediaBase = new URL('.',document.currentScript.src);
  const param = new URLSearchParams(location.search);
  const $ = selector => root.querySelector(selector);
  const integer = new Intl.NumberFormat('zh-CN',{maximumFractionDigits:0});
  const decimal = new Intl.NumberFormat('zh-CN',{maximumFractionDigits:2});
  const esc = value => String(value).replace(/[&<>"']/g,ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[ch]);
  const canvas = $('#skills-map');
  const source = id => data.sources.find(item => item.id === id);
  const fromParam = (key,items,fallback = items[0]) =>
    items.find(item => item.id === param.get(key)) || fallback;
  const named = id => data.points.find(item => item.id === id);

  function remember(fields) {
    const url = new URL(location.href);
    for (const [key,value] of Object.entries(fields)) {
      if (value === undefined || value === null) url.searchParams.delete(key);
      else url.searchParams.set(key,value);
    }
    try { history.replaceState(history.state,'',url); } catch { /* 文件预览仍可操作。 */ }
  }

  function choices(selector,items,choose) {
    const container = $(selector);
    container.replaceChildren(...items.map(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.choice = item.id;
      button.textContent = item.name || item.title;
      if (item.kind) {
        button.dataset.kind = item.kind;
        button.style.setProperty('--symbol-color',item.color);
      }
      button.addEventListener('click',() => choose(item));
      return button;
    }));
    return id => {
      for (const button of container.children) {
        button.setAttribute('aria-pressed',String(button.dataset.choice === id));
      }
    };
  }

  $('#skills-intro').textContent = page.intro;
  $('#skills-knowledge').innerHTML = page.cards.map(card =>
    `<article class="skills-panel"><h2>${esc(card.title)}</h2><p>${esc(card.text)}</p></article>`
  ).join('');
  $('#skills-references').innerHTML = page.sources.map(source).map(item =>
    `<li><a href="${esc(item.url)}">${esc(item.title)} ↗</a><p>${esc(item.note)}</p></li>`
  ).join('');

  function quiz() {
    const {prompt,options,answer,reveal} = page.quiz;
    const feedback = $('#quiz-feedback');
    $('#quiz-question').textContent = prompt;
    const mark = choices('#quiz-choices',options.map((name,i) => ({id:String(i),name})),choice => {
      mark(choice.id);
      feedback.hidden = false;
      const correct = Number(choice.id) === answer;
      feedback.dataset.correct = String(correct);
      feedback.textContent = (correct ? '答对了。' : '再试试。正确选项是「' + options[answer] + '」。') + reveal;
    });
    mark(null);
  }
  quiz();

  function sample(id) {
    const record = data.samples.find(item => item.id === id);
    $('#sample-map').innerHTML = `<summary>到真实地形图里找线和符号</summary>
      <figure class="skills-sample">
        <img src="${esc(new URL(record.file,mediaBase).href)}" alt="${esc(record.alt)}" loading="lazy" decoding="async">
        <figcaption>${esc(record.note)} USGS 公共领域。<a href="${esc(source(record.source).url)}">查看出处 ↗</a></figcaption>
      </figure>`;
  }

  function overview() {
    diagrams.map(canvas,() => ({}));
    const activities = {
      scale:'点两个地标，换算图上长度和实际距离。',
      direction:'旋转地图，按北箭头判断八方位。',
      legend:'点图例，找地图上的点、线和面。',
      contours:'改变等高距，找山顶、鞍部、山脊和山谷。',
      profile:'画 A→B，让读数点在地图和剖面上一起移动。'
    };
    $('#skills-stations').innerHTML = data.pages.slice(1).map(item =>
      `<a class="skills-link" href="${item.id}.html"><strong>${esc(item.title)} →</strong><span>${activities[item.id]}</span></a>`
    ).join('');
  }

  function mapPair(onChange, direction = false) {
    const defaultA = named('center'), defaultB = named('bridge');
    let a = fromParam('a',data.points,defaultA);
    let b = fromParam('b',data.points,defaultB);
    if (a === b) b = data.points.find(point => point !== a);
    let active = 'b';
    const turn = Number(param.get('turn'));
    let rotation = direction && [0,90,180,270].includes(turn) ? turn : 0;
    const map = diagrams.map(canvas,() => ({rotation,line:[a.at,b.at],arrow:direction}));
    const status = $('#point-feedback');
    const markEnd = choices('#endpoint-choices',[
      {id:'a',name:'设置 A 起点'},{id:'b',name:'设置 B 目标'}
    ],item => {
      active = item.id;
      markEnd(active);
      markPoint(active === 'a' ? a.id : b.id);
      status.textContent = active === 'a' ? '请选择新的 A 起点。' : '请选择新的 B 目标。';
    });
    const markPoint = choices('#point-choices',data.points,choosePoint);

    function update(save = true) {
      markEnd(active);
      markPoint(active === 'a' ? a.id : b.id);
      if (save) remember({a:a.id,b:b.id,turn:direction ? rotation : null});
      onChange(a,b,rotation);
      map.render();
    }

    function choosePoint(item) {
      if (item === (active === 'a' ? b : a)) {
        status.textContent = '请选择两个不同的地标。';
        return;
      }
      if (active === 'a') a = item;
      else b = item;
      status.textContent = `${active.toUpperCase()} 已设置为${item.name}。`;
      update();
    }
    canvas.addEventListener('click',event => {
      const item = map.pointAt(event);
      if (item) choosePoint(item);
    });
    if (direction) {
      $('#rotate-map').addEventListener('click',() => {
        rotation = (rotation + 90) % 360;
        update();
      });
      $('#north-up').addEventListener('click',() => {
        rotation = 0;
        update();
      });
      $('#swap-points').addEventListener('click',() => {
        [a,b] = [b,a];
        status.textContent = 'A、B 已互换。';
        update();
      });
    }
    return {
      update,
      reset() {
        a = defaultA;
        b = defaultB;
        active = 'b';
        rotation = 0;
        status.textContent = '已恢复默认端点。';
        update(false);
      }
    };
  }

  function scale() {
    const ratios = [5000,10000,20000].map(value => ({id:String(value),name:'1∶' + integer.format(value),value}));
    let selected = fromParam('scale',ratios,ratios[1]);
    const paper = $('#paper-cm');
    const knownRoute = data.route.nodes.slice(1).reduce((sum,p,i) =>
      sum + model.distance(data.route.nodes[i],p),0);
    const mark = choices('#scale-choices',ratios,item => {
      selected = item;
      remember({scale:selected.id});
      mark(item.id);
      pair.update(false);
    });
    function convert() {
      const length = paper.valueAsNumber;
      $('#paper-result').textContent = !paper.validity.valid || !Number.isFinite(length)
        ? '输入 0 至 999 厘米之间的图上长度。'
        : `在 ${selected.name} 图上，${decimal.format(length)} 厘米 × ${integer.format(selected.value)} ÷ 100 ＝ ${decimal.format(model.groundMeters(length,selected.value))} 米。`;
    }
    const pair = mapPair((a,b) => {
      const direct = model.distance(a.at,b.at);
      const acrossTrail = data.route.ends.includes(a.id) && data.route.ends.includes(b.id);
      $('#scale-result').innerHTML = `<h3>${esc(a.name)} → ${esc(b.name)}</h3>
        <div class="skills-measures">
          <div><span>实地水平直距</span><b>${decimal.format(direct)} 米</b></div>
          <div><span>${esc(selected.name)} 的图上直距</span><b>${decimal.format(model.paperCm(direct,selected.value))} 厘米</b></div>
          ${acrossTrail ? `<div><span>沿步道各段水平长度</span><b>${decimal.format(knownRoute)} 米</b></div>` : ''}
        </div><p>${acrossTrail ? `沿步道约多走 ${decimal.format(knownRoute-direct)} 米的水平距离。` : '选游客中心和青石桥，可对照绕行步道的距离。'}</p>`;
      convert();
    });
    mark(selected.id);
    pair.update(false);
    paper.addEventListener('input',convert);
    $('#reset-scale').addEventListener('click',() => {
      selected = ratios[1];
      paper.value = paper.defaultValue;
      mark(selected.id);
      remember({a:null,b:null,scale:null});
      pair.reset();
    });
  }

  function direction() {
    const compassPosition = {0:'上',90:'右',180:'下',270:'左'};
    mapPair((a,b,rotation) => {
      const bearing = model.azimuth(a.at,b.at);
      $('#direction-result').innerHTML = `<h3>${esc(b.name)}在${esc(a.name)}的${model.sector(bearing)}方</h3>
        <p>从北顺时针量约 <b>${Math.round(bearing)%360}°</b>。当前地图顺时针转了 ${rotation}°，屏幕向${compassPosition[rotation]}是北。</p>`;
    },true).update(false);
  }

  function legend() {
    const items = [{id:'all',name:'完整地图'},...data.symbols];
    let active = fromParam('symbol',items);
    const map = diagrams.map(canvas,() => ({feature:active.id === 'all' ? null : active.id}));
    const mark = choices('#legend-choices',items,record => show(record));
    const kinds = {line:'线符号',point:'点符号',area:'面符号'};
    function show(record,update = true) {
      active = record;
      mark(record.id);
      if (update) remember({symbol:record.id === 'all' ? null : record.id});
      $('#legend-result').innerHTML = record.kind
        ? `<h3>${esc(record.name)} · ${kinds[record.kind]}</h3><p>${esc(record.text)}</p>`
        : '<p>选择任一图例，观察对应地物的形状和位置。</p>';
      map.render();
    }
    show(active,false);
    sample('layers');
  }

  function contours() {
    const surface = model.createSurface(data.terrain);
    const intervals = [20,40,60].map(value => ({id:String(value),name:value+' 米等高距',value}));
    let selected = fromParam('interval',intervals,intervals[1]);
    let form = fromParam('form',data.forms);
    let probe = form.at;
    const map = diagrams.map(canvas,() => ({interval:selected.value,probe}),surface);
    const markInterval = choices('#interval-choices',intervals,item => {
      selected = item;
      remember({interval:selected.id});
      show();
    });
    const markForm = choices('#form-choices',data.forms,item => {
      form = item;
      probe = item.at;
      remember({form:item.id});
      show();
    });
    function show() {
      markInterval(selected.id);
      markForm(form?.id);
      const levels = surface.contours(selected.value);
      $('#contour-result').innerHTML = `<h3>${form ? esc(form.name) : '选中点'} · 海拔约 ${integer.format(surface.elevation(probe))} 米</h3>
        <p>等高距 ${selected.value} 米 · 图中共有 ${levels.length} 个等高线高度。</p>
        <p>${form ? esc(form.text) : '这是模型在该点的插值。也可以从旁边两条线推断它的大致高程。'}</p>`;
      map.render();
    }
    canvas.addEventListener('click',event => {
      const at = map.position(event);
      if (at) {
        form = null;
        probe = at;
        remember({form:null});
        show();
      }
    });
    $('#reset-contours').addEventListener('click',() => {
      selected = intervals[1];
      form = data.forms[0];
      probe = form.at;
      remember({interval:null,form:null});
      show();
    });
    show();
    sample('relief');
  }

  function profile() {
    const surface = model.createSurface(data.terrain);
    const interval = 40;
    const maxHeight = Math.ceil(surface.max / 80) * 80;
    const chartCanvas = $('#profile-chart');
    const slider = $('#profile-probe');
    const crossings = $('#show-crossings');
    const cancel = $('#cancel-profile');
    const status = $('#profile-status');
    const hint = status.textContent;
    let preset = fromParam('line',data.presets);
    let a = preset.a, b = preset.b;
    if (param.get('reverse') === '1') [a,b] = [b,a];
    let result = surface.profile(a,b,interval);
    let pending = null, draft = null, drag = null;

    const map = diagrams.map(canvas,() => ({
      interval,line:[a,b],crossings:crossings.checked ? result.crossings : [],
      probe:result.points[Number(slider.value)].at,pending,draft
    }),surface);
    const chart = diagrams.profile(chartCanvas,() => ({
      result,index:Number(slider.value),showCrossings:crossings.checked,maxHeight
    }));
    const markPreset = choices('#profile-presets',data.presets,item => {
      preset = item;
      finish(item.a,item.b);
    });

    function read() {
      const p = result.points[Number(slider.value)];
      const at = integer.format(p.t * result.length);
      const height = integer.format(p.height);
      slider.setAttribute('aria-valuetext',`距 A ${at} 米，海拔 ${height} 米`);
      $('#profile-reading').innerHTML = `<div class="skills-measures">
        <div><span>距 A 水平距离</span><b>${at} 米</b></div>
        <div><span>读数点海拔</span><b>${height} 米</b></div>
        <div><span>A→B 总长</span><b>${integer.format(result.length)} 米</b></div>
        <div><span>等高线交点数</span><b>${result.crossings.length} 个</b></div>
      </div>`;
      map.render();
      chart.render();
    }
    function finish(start,end,save = true) {
      if (model.distance(start,end) < 6) {
        status.textContent = '两点太近，试着把 B 点选得更远一些。';
        map.render();
        return;
      }
      a = start;
      b = end;
      result = surface.profile(a,b,interval);
      pending = draft = drag = null;
      cancel.disabled = true;
      status.textContent = '剖面已画好。拖动读数点，观察两张图上的橙色圆点。';
      slider.value = '0';
      markPreset(preset?.id);
      if (save) remember({line:preset?.id,reverse:preset && a === preset.b ? '1' : null});
      read();
    }
    function cancelDraft() {
      pending = draft = drag = null;
      cancel.disabled = true;
      status.textContent = hint;
      map.render();
    }

    // 判定拖动与普通点选。触屏沿纵向滑动时，浏览器可取消指针并继续页面滚动。
    canvas.addEventListener('pointerdown',event => {
      if (!event.isPrimary || event.button !== 0) return;
      const at = map.position(event);
      if (!at) return;
      drag = {id:event.pointerId,at,x:event.clientX,y:event.clientY};
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove',event => {
      if (!drag || drag.id !== event.pointerId) return;
      const at = map.position(event);
      if (at && Math.hypot(event.clientX-drag.x,event.clientY-drag.y) > 7) {
        draft = [drag.at,at];
        map.render();
      }
    });
    canvas.addEventListener('pointerup',event => {
      if (!drag || drag.id !== event.pointerId) return;
      const at = map.position(event);
      const start = drag.at;
      const moved = Boolean(draft) || Math.hypot(event.clientX-drag.x,event.clientY-drag.y) > 7;
      drag = draft = null;
      if (!at) {
        status.textContent = '请把终点留在地图内。';
        map.render();
        return;
      }
      if (moved || pending) {
        const first = moved ? start : pending;
        if (model.distance(first,at) >= 6) preset = null;
        finish(first,at);
      } else {
        pending = at;
        cancel.disabled = false;
        status.textContent = '已标好新的 A。再点一个位置作为 B。';
        map.render();
      }
    });
    canvas.addEventListener('pointercancel',cancelDraft);
    canvas.addEventListener('lostpointercapture',() => { if (drag) cancelDraft(); });
    cancel.addEventListener('click',cancelDraft);
    document.addEventListener('keydown',event => {
      if (event.key === 'Escape' && (pending || drag)) cancelDraft();
    });
    $('#flip-profile').addEventListener('click',() => finish(b,a));
    $('#reset-profile').addEventListener('click',() => {
      preset = data.presets[0];
      crossings.checked = crossings.defaultChecked;
      remember({line:null,reverse:null});
      finish(preset.a,preset.b,false);
    });
    slider.addEventListener('input',read);
    crossings.addEventListener('change',read);
    chartCanvas.addEventListener('click',event => {
      const index = chart.indexAt(event);
      if (index !== null) {
        slider.value = index;
        read();
      }
    });
    markPreset(preset.id);
    read();
  }

  ({index:overview,scale,direction,legend,contours,profile})[page.id]();
})();

(() => {
  'use strict';

  const data = window.OceanData;
  const model = window.OceanModel;
  const mediaBase = new URL('.', document.currentScript.src);
  const root = document.querySelector('.ocean-topic');
  if (!root || !data || !model) return;
  const $ = selector => root.querySelector(selector);
  const params = new URLSearchParams(location.search);
  const page = data.pages.find(item => item.id === root.dataset.oceanPage);
  const number = new Intl.NumberFormat('zh-CN', {maximumFractionDigits:0});
  const safe = value => String(value).replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[char]);
  const source = id => data.sources.find(item => item.id === id);
  const findParam = (key, items) => items.find(item => item.id === params.get(key)) || items[0];

  function remember(key, id) {
    const url = new URL(location.href);
    url.searchParams.set(key, id);
    try { history.replaceState(null, '', url); } catch { /* 本地文件仍可使用交互。 */ }
  }

  function choices(selector, items, select) {
    const group = $(selector);
    group.replaceChildren(...items.map(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = item.title;
      button.dataset.choice = item.id;
      if (item.kind) button.dataset.kind = item.kind;
      button.addEventListener('click', () => select(item));
      return button;
    }));
    return selected => {
      for (const button of group.children) button.setAttribute('aria-pressed', String(button.dataset.choice === selected));
    };
  }

  function photo(id) {
    const item = data.media.find(record => record.id === id);
    const origin = source(item.source);
    return `<figure class="ocean-photo">
      <img src="${safe(new URL(item.file, mediaBase).href)}" alt="${safe(item.alt)}" loading="lazy" decoding="async">
      <figcaption>${safe(item.alt)} · ${safe(item.credit)} · <a href="${safe(origin.url)}">出处 ↗</a></figcaption>
    </figure>`;
  }

  $('#ocean-intro').textContent = page.intro;
  $('#ocean-question').textContent = '想一想 · ' + page.question;
  $('#ocean-answer').textContent = page.answer;
  $('#ocean-knowledge').innerHTML = page.cards.map(item =>
    `<article class="ocean-panel"><h2>${safe(item.title)}</h2><p>${safe(item.text)}</p></article>`
  ).join('');
  $('#ocean-references').innerHTML = page.sources.map(source).map(item =>
    `<li><a href="${safe(item.url)}">${safe(item.title)} ↗</a><p>${safe(item.note)}</p></li>`
  ).join('');

  function drawing(canvas, draw) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => {};
    const render = () => {
      const {clientWidth:width, clientHeight:height} = canvas;
      if (!width || !height) return;
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.round(width * scale);
      const pixelHeight = Math.round(height * scale);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      ctx.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
      ctx.clearRect(0, 0, width, height);
      draw(ctx, width, height);
    };
    const observer = new ResizeObserver(render);
    observer.observe(canvas);
    render();
    return render;
  }

  function line(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function circle(ctx, x, y, radius, fill, stroke) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  function label(ctx, text, x, y, color = '#173a4b', size = 15) {
    ctx.fillStyle = color;
    ctx.font = `650 ${size}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  function map(canvas, overlay = () => {}) {
    const lands = window.GEO_WORLD_GEO?.countries || [];
    const land = new Path2D();
    for (const {rings} of lands) {
      for (const ring of rings) {
        ring.forEach(([lon, lat], i) => land[i ? 'lineTo' : 'moveTo'](lon + 180, 80 - lat));
        land.closePath();
      }
    }
    const basins = [
      ['北冰洋',-5,72], ['太平洋',-149,2], ['太平洋',157,-5],
      ['大西洋',-38,8], ['印度洋',80,-22], ['南大洋',9,-64]
    ];
    return drawing(canvas, (ctx, width, height) => {
      const xScale = width / 360;
      const yScale = height / 150;
      const at = (lon, lat) => [(lon + 180) * xScale, (80 - lat) * yScale];
      ctx.fillStyle = '#bce5ed';
      ctx.fillRect(0, 0, width, height);
      ctx.save();
      ctx.scale(xScale, yScale);
      ctx.fillStyle = '#f3e7ca';
      ctx.fill(land, 'evenodd');
      ctx.restore();
      ctx.strokeStyle = '#678f9a';
      ctx.setLineDash([4,5]);
      line(ctx, 0, 80 * yScale, width, 80 * yScale);
      ctx.setLineDash([]);
      for (const [text, lon, lat] of basins) {
        const [x,y] = at(lon, lat);
        label(ctx, text, x, y, '#244d60', width < 530 ? 11 : 16);
      }
      overlay(ctx, width, height, xScale, yScale);
    });
  }

  function overview() {
    map($('#ocean-map'));
    $('#ocean-stations').innerHTML = data.pages.slice(1).map(item =>
      `<a class="ocean-link-card" href="${item.id}.html"><strong>${safe(item.title)} →</strong><span>${safe(item.intro)}</span></a>`
    ).join('');
  }

  function currents() {
    const canvas = $('#ocean-map');
    const slider = $('#current-position');
    const colors = {warm:'#b43c24', cold:'#0e548c', circumpolar:'#624288'};
    const kinds = {warm:'暖流', cold:'寒流', circumpolar:'绕极流'};
    const routes = new Map(data.currents.map(item => [
      item.id, model.trace(item.points.map(([lon, lat]) => [lon + 180, 80 - lat]))
    ]));
    let active = findParam('current', data.currents);
    const paint = map(canvas, (ctx, width, height, sx, sy) => {
      const currentsByOrder = [...data.currents.filter(item => item !== active), active];
      for (const current of currentsByOrder) {
        const route = routes.get(current.id);
        const color = colors[current.kind];
        const selected = active === current;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (const offset of [-width, 0, width]) {
          ctx.beginPath();
          route.segments.forEach((segment, i) => {
            if (!i) ctx.moveTo(segment.start[0] * sx + offset, segment.start[1] * sy);
            ctx.lineTo((segment.start[0] + segment.dx) * sx + offset, (segment.start[1] + segment.dy) * sy);
          });
          ctx.strokeStyle = '#fff9';
          ctx.lineWidth = selected ? 8 : 5;
          ctx.stroke();
          ctx.strokeStyle = color;
          ctx.lineWidth = selected ? 4 : 2.4;
          ctx.stroke();
          const count = current.kind === 'circumpolar' ? 8 : 2;
          for (let i = 1; i <= count; i++) {
            const point = model.positionAt(route, i / (count + 1));
            ctx.save();
            ctx.translate(point.x * sx + offset, point.y * sy);
            ctx.rotate(Math.atan2(Math.sin(point.angle) * sy, Math.cos(point.angle) * sx));
            ctx.strokeStyle = color;
            ctx.lineWidth = selected ? 3 : 2;
            ctx.beginPath();
            ctx.moveTo(-5, -5);
            ctx.lineTo(1, 0);
            ctx.lineTo(-5, 5);
            ctx.stroke();
            ctx.restore();
          }
          if (selected) {
            const point = model.positionAt(route, Number(slider.value) / 100);
            ctx.lineWidth = 3;
            circle(ctx, point.x * sx + offset, point.y * sy, 6, color, '#fff');
          }
        }
      }
    });
    const mark = choices('#current-choices', data.currents, item => select(item, 0));
    function seek() {
      $('#current-position-value').textContent = slider.value + '%';
      paint();
    }
    function select(item, fraction, update = true) {
      active = item;
      slider.value = Math.round(fraction * 100);
      mark(item.id);
      if (update) remember('current', item.id);
      $('#current-result').innerHTML = `<h3>${safe(item.title)} <small>${kinds[item.kind]}</small></h3>
        <p><strong>${safe(item.direction)}</strong></p><p>${safe(item.text)}</p>`;
      seek();
    }
    canvas.addEventListener('click', event => {
      const box = canvas.getBoundingClientRect();
      const x = (event.clientX - box.left) * 360 / box.width;
      const y = (event.clientY - box.top) * 150 / box.height;
      let closest;
      for (const item of data.currents) {
        for (const shift of [-360, 0, 360]) {
          const hit = model.nearestOnRoute(routes.get(item.id), x + shift, y);
          if (!closest || hit.distance < closest.distance) closest = {...hit, item};
        }
      }
      if (closest.distance * box.width / 360 < 17) select(closest.item, closest.fraction);
    });
    slider.addEventListener('input', seek);
    select(active, 0, false);
  }

  function tides() {
    let active = findParam('phase', data.phases);
    const slider = $('#tide-time');
    const moon = drawing($('#tide-alignment'), (ctx, width, height) => {
      const x = width * .39;
      const y = height * .5;
      const r = Math.min(65, width * .22, height * .29);
      const sun = width * .84;
      const radians = active.angle * Math.PI / 180;
      ctx.fillStyle = '#0d2b45';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#6992ad';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([5,5]);
      ctx.strokeStyle = '#edb260';
      line(ctx, x - r * 1.2, y, sun, y);
      ctx.strokeStyle = '#ccf1f8';
      line(ctx, x - r * Math.cos(radians), y + r * Math.sin(radians),
        x + r * Math.cos(radians), y - r * Math.sin(radians));
      ctx.setLineDash([]);
      circle(ctx, x, y, 17, '#42a6c0');
      circle(ctx, sun, y, 21, '#ffc969');
      const mx = x + r * Math.cos(radians);
      const my = y - r * Math.sin(radians);
      circle(ctx, mx, my, 11, '#dae5ee');
      label(ctx, '地球', x, y + 33, '#dbeef7');
      label(ctx, '太阳', sun, y + 39, '#ffe0a9');
      label(ctx, '月球', mx, my + (my > y ? 23 : -23), '#dbeef7');
    });
    const chart = drawing($('#tide-chart'), (ctx, width, height) => {
      const left = 39, right = width - 19, top = 20, bottom = height - 34;
      const x = minute => left + (right - left) * minute / model.lunarDay;
      const y = level => top + (2 - level) / 4 * (bottom - top);
      ctx.fillStyle = '#eaf6f8';
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#a1bec8';
      for (const level of [-2,-1,0,1,2]) {
        line(ctx, left, y(level), right, y(level));
        label(ctx, level + ' m', 19, y(level), '#254c60', 11);
      }
      for (const [minute, tick] of [[0,'0:00'],[745,'12:25'],[1490,'24:50']]) {
        label(ctx, tick, x(minute), bottom + 17, '#254c60', 11);
      }
      ctx.strokeStyle = '#076d86';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 160; i++) {
        const minute = model.lunarDay * i / 160;
        ctx[i ? 'lineTo' : 'moveTo'](x(minute), y(model.tide(active.angle, minute).height));
      }
      ctx.stroke();
      const minute = Number(slider.value);
      ctx.strokeStyle = '#a53b26';
      ctx.lineWidth = 1;
      line(ctx, x(minute), top, x(minute), bottom);
      circle(ctx, x(minute), y(model.tide(active.angle, minute).height), 6, '#a53b26', '#fff');
    });
    const mark = choices('#phase-choices', data.phases, phase => select(phase));
    function read() {
      const minute = Number(slider.value);
      const {height, range, rising} = model.tide(active.angle, minute);
      const time = `${Math.floor(minute / 60)} 小时 ${minute % 60} 分`;
      const state = Math.abs(Math.abs(height) - range / 2) < .001
        ? (height > 0 ? '高潮附近' : '低潮附近')
        : (rising ? '水位上升' : '水位下降');
      $('#tide-time-value').textContent = time;
      slider.setAttribute('aria-valuetext', time);
      $('#tide-result').textContent = `${state} · 相对潮位 ${height.toFixed(2)} 米 · 本图潮差 ${range.toFixed(2)} 米`;
      chart();
    }
    function select(phase, update = true) {
      active = phase;
      mark(phase.id);
      if (update) remember('phase', phase.id);
      $('#phase-result').innerHTML = `<h3>${safe(phase.title)} · ${phase.angle % 180 ? '小潮情形' : '大潮情形'}</h3><p>${safe(phase.text)}</p>`;
      moon();
      read();
    }
    slider.addEventListener('input', read);
    root.querySelectorAll('[data-minute]').forEach(button => {
      button.addEventListener('click', () => { slider.value = button.dataset.minute; read(); });
    });
    select(active, false);
  }

  function life() {
    const slider = $('#dive-depth');
    let previous;
    const initial = findParam('zone', data.layers);
    slider.value = initial.example;
    const mark = choices('#depth-choices', data.layers, item => {
      slider.value = item.example;
      dive();
    });
    function dive(update = true) {
      const depth = Number(slider.value);
      const layer = model.layerAt(data.layers, depth);
      const meters = number.format(depth) + ' 米';
      $('#dive-depth-value').textContent = meters;
      $('#dive-pressure').textContent = number.format(1 + depth / 10);
      slider.setAttribute('aria-valuetext', meters + '，' + layer.title);
      $('#depth-bar span').style.left = depth / 110 + '%';
      if (layer !== previous) {
        previous = layer;
        mark(layer.id);
        if (update) remember('zone', layer.id);
        $('#life-result').innerHTML = `<div><h3>${safe(layer.title)}</h3><p><strong>${safe(layer.light)}</strong></p><p>${safe(layer.text)}</p></div>
          ${layer.photo ? photo(layer.photo) : ''}`;
      }
    }
    $('#ocean-vent').innerHTML = `<div><h2>${safe(data.vent.title)}</h2><p>${safe(data.vent.text)}</p></div>${photo(data.vent.photo)}`;
    slider.addEventListener('input', () => dive());
    dive(false);
  }

  function seafloor() {
    let active = findParam('profile', data.profiles);
    const canvas = $('#floor-profile');
    const slider = $('#floor-distance');
    let plot;
    const chart = drawing(canvas, (ctx, width, height) => {
      const left = 56, right = width - 20, top = 28, bottom = height - 39;
      const end = active.points.at(-1)[0];
      plot = {left, right, end};
      const x = distance => left + (right - left) * distance / end;
      const y = depth => top + (bottom - top) * depth / 11000;
      ctx.fillStyle = '#eaf6f8';
      ctx.fillRect(0, 0, width, height);
      const water = ctx.createLinearGradient(0, top, 0, bottom);
      water.addColorStop(0, '#bce5ed');
      water.addColorStop(1, '#5b89ab');
      ctx.fillStyle = water;
      ctx.fillRect(left, top, right - left, bottom - top);
      ctx.strokeStyle = '#456f85';
      for (const depth of [0,2000,4000,6000,8000,11000]) {
        line(ctx, left, y(depth), right, y(depth));
        label(ctx, number.format(depth), 28, y(depth), '#244d60', 11);
      }
      label(ctx, '水深 / 米', 35, 12, '#244d60', 12);
      label(ctx, '0', left, bottom + 18, '#244d60', 11);
      label(ctx, number.format(end) + ' 千米', right - 20, bottom + 18, '#244d60', 11);
      ctx.beginPath();
      active.points.forEach(([distance, depth], i) => ctx[i ? 'lineTo' : 'moveTo'](x(distance), y(depth)));
      ctx.lineTo(right, bottom);
      ctx.lineTo(left, bottom);
      ctx.closePath();
      ctx.fillStyle = '#d3af81';
      ctx.fill();
      ctx.beginPath();
      active.points.forEach(([distance, depth], i) => ctx[i ? 'lineTo' : 'moveTo'](x(distance), y(depth)));
      ctx.strokeStyle = '#604122';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      for (const stop of active.stops) {
        circle(ctx, x(stop.km), y(model.depthAt(active.points, stop.km)), 4, '#244d60', '#fff');
      }
      const distance = Number(slider.value);
      const depth = model.depthAt(active.points, distance);
      ctx.strokeStyle = '#a53b26';
      ctx.lineWidth = 1.5;
      line(ctx, x(distance), top, x(distance), bottom);
      circle(ctx, x(distance), y(depth), 6, '#a53b26', '#fff');
    });
    const mark = choices('#profile-choices', data.profiles, profile => select(profile));
    let markStop;
    function read() {
      const km = Number(slider.value);
      const stop = active.stops.find(point => point.km === km);
      const meters = number.format(model.depthAt(active.points, km)) + ' 米';
      const distance = number.format(km) + ' 千米';
      $('#floor-distance-value').textContent = distance;
      slider.setAttribute('aria-valuetext', distance + '，水深约 ' + meters);
      markStop(stop?.id);
      $('#floor-result').innerHTML = `<h3>${stop ? safe(stop.title) + ' · ' : ''}水深约 ${meters}</h3>
        <p>${stop ? safe(stop.text) : '已测到剖面上的当前位置，点击地形名称可跳到对应的观察点。'}</p>`;
      chart();
    }
    function select(profile, update = true) {
      active = profile;
      mark(profile.id);
      if (update) remember('profile', profile.id);
      slider.max = profile.points.at(-1)[0];
      slider.value = profile.stops[0].km;
      markStop = choices('#floor-stops', profile.stops, stop => { slider.value = stop.km; read(); });
      read();
    }
    function measure(event) {
      if (!plot) return;
      const x = event.clientX - canvas.getBoundingClientRect().left;
      const fraction = model.clamp((x - plot.left) / (plot.right - plot.left), 0, 1);
      slider.value = Math.round(fraction * plot.end / 5) * 5;
      read();
    }
    canvas.addEventListener('click', measure);
    canvas.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch' || event.button !== 0) return;
      canvas.setPointerCapture(event.pointerId);
      measure(event);
    });
    canvas.addEventListener('pointermove', event => {
      if (canvas.hasPointerCapture(event.pointerId)) measure(event);
    });
    slider.addEventListener('input', read);
    $('#ridge-map').innerHTML = `<div><h2>洋中脊在世界地图上的位置</h2>
      <p>红色显示新洋壳形成的位置。顺着大西洋中部的红线看，它和其他大洋的洋中脊相连。</p></div>${photo('ridge')}`;
    select(active, false);
  }

  ({index:overview, currents, tides, life, seafloor})[page.id]();
})();

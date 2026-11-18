(() => {
  'use strict';
  const root = document.querySelector('.climate-topic');
  const data = window.ClimateData;
  const model = window.ClimateModel;
  const stations = window.ClimateStations || [];
  if (!root || !data || !model) return;
  const assetBase = new URL('.', document.currentScript.src);
  const $ = selector => root.querySelector(selector);
  const page = data.pages.find(record => record.id === root.dataset.climatePage);
  const param = new URLSearchParams(location.search);
  const fmt = new Intl.NumberFormat('zh-CN', {minimumFractionDigits:1, maximumFractionDigits:1});
  const esc = value => String(value).replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[char]);
  const stationById = id => stations.find(record => record.id === id);
  const sourceById = id => data.sources.find(record => record.id === id);
  const normalLink = station => 'https://www.data.jma.go.jp/tcc/tcc/products/climate/climatview/graph_mkhtml_nrm.php?n=' + station.number;
  const get = (key, records, fallback = records[0]) => records.find(record => record.id === param.get(key)) || fallback;

  function remember(fields) {
    const url = new URL(location.href);
    for (const [key, value] of Object.entries(fields)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    try { history.replaceState(null, '', url); } catch { /* 本地文件仍可使用控件。 */ }
  }

  function buttons(selector, records, select) {
    const container = $(selector);
    container.replaceChildren(...records.map(record => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.choice = record.id;
      button.append(record.title || record.name);
      if (record.color) button.style.setProperty('--chip-color', record.color);
      button.addEventListener('click', () => select(record));
      return button;
    }));
    return id => {
      for (const button of container.children) {
        button.setAttribute('aria-pressed', String(button.dataset.choice === id));
      }
    };
  }

  function photo(id) {
    const picture = data.photos.find(record => record.id === id);
    const source = sourceById(picture.source);
    return `<figure class="climate-photo">
      <img src="${esc(new URL(picture.file, assetBase).href)}" alt="${esc(picture.alt)}" decoding="async">
      <figcaption>${esc(picture.alt)} ${esc(picture.credit)} · <a href="${esc(source.url)}">出处 ↗</a></figcaption>
    </figure>`;
  }

  // 使用 CSS 尺寸绘图，Retina 下调整像素密度。换站后断开旧图表的观察器。
  function drawing(canvas, draw) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return {render() {}, disconnect() {}};
    function render() {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;
      const density = Math.min(2, window.devicePixelRatio || 1);
      const pixelWidth = Math.round(width * density);
      const pixelHeight = Math.round(height * density);
      if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
      if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
      ctx.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
      ctx.clearRect(0, 0, width, height);
      draw(ctx, width, height);
    }
    const observer = new ResizeObserver(render);
    observer.observe(canvas);
    render();
    return {render, disconnect:() => observer.disconnect()};
  }

  function line(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function circle(ctx, x, y, r, fill, stroke) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  function label(ctx, value, x, y, {color = '#183b51', size = 13, align = 'center'} = {}) {
    ctx.font = `650 ${size}px system-ui, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
  }

  $('#climate-intro').textContent = page.intro;
  $('#climate-question').textContent = '想一想 · ' + page.question;
  $('#climate-answer').textContent = page.answer;
  $('#climate-knowledge').innerHTML = page.cards.map(card =>
    `<article class="climate-panel"><h2>${esc(card.title)}</h2><p>${esc(card.text)}</p></article>`
  ).join('');
  $('#climate-sources').innerHTML = page.sources.map(sourceById).map(source =>
    `<li><a href="${esc(source.url)}">${esc(source.title)} ↗</a><p>${esc(source.note)}</p></li>`
  ).join('');

  function overview() {
    const descriptions = {
      weather:'看积雨云、海雾和彩虹的实景，动手把湿空气冷却到露点。',
      types:'用 11 个观测站的常年气温降水图，比较雨季和季节温差。',
      china:'在中国地图上查看实际分类格点，读五种典型气候的代表站。'
    };
    $('#climate-stations').innerHTML = data.pages.slice(1).map(record =>
      `<a class="climate-link" href="${record.id}.html"><strong>${esc(record.title)} →</strong><span>${descriptions[record.id]}</span></a>`
    ).join('');
  }

  function weather() {
    const choose = buttons('#weather-choices', data.weather, record => show(record));
    function show(record, update = true) {
      choose(record.id);
      if (update) remember({phenomenon:record.id});
      $('#weather-case').innerHTML = `<div><h3>${esc(record.name)}</h3><p>${esc(record.detail)}</p>
        <p class="climate-note"><b>观察线索</b> ${esc(record.observe)}</p></div>${record.photo ? photo(record.photo) : ''}`;
    }
    show(get('phenomenon', data.weather), false);

    const dewPoint = 12;
    const slider = $('#dew-temperature');
    const canvas = $('#dew-diagram');
    const display = drawing(canvas, (ctx, width, height) => {
      const value = Number(slider.value);
      const stage = model.condensation(value, dewPoint);
      const left = 30;
      const right = width - 30;
      const y = height - 48;
      const position = temp => left + (temp - 2) * (right - left) / 28;
      ctx.fillStyle = '#eaf4f7';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#c5d9e2';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      line(ctx, left, y, right, y);
      ctx.strokeStyle = '#8ec7d8';
      line(ctx, left, y, position(dewPoint), y);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#435b80';
      line(ctx, position(dewPoint), y - 16, position(dewPoint), y + 16);
      label(ctx, '露点 12℃', position(dewPoint), y + 29, {size:12});
      ctx.lineWidth = 3;
      circle(ctx, position(value), y, 9, '#ad4426', '#fff');
      label(ctx, stage === 'clear' ? '未饱和' : stage === 'saturated' ? '达到初始露点' : '可出现凝结小滴',
        width / 2, 29, {size:16});
      if (stage === 'droplets') {
        for (let i = 0; i < 10; i++) {
          circle(ctx, width * (.23 + (i % 5) * .125), 57 + Math.floor(i / 5) * 16, 3 + i % 3, '#3d98b1');
        }
      }
    });
    const messages = {
      clear:'气温高于初始露点，空气尚未饱和。继续降温，气温会靠近露点。',
      saturated:'气温刚达到初始露点，空气接近饱和。若继续冷却，水汽可在合适条件下凝结。',
      droplets:'气温低于初始露点，冷却过程中可有部分水汽凝结。要形成降雨，水滴或冰晶还要长大。'
    };
    function read() {
      const value = Number(slider.value);
      $('#dew-value').textContent = value + ' ℃';
      slider.setAttribute('aria-valuetext', value + ' 摄氏度');
      $('#dew-result').textContent = messages[model.condensation(value, dewPoint)];
      display.render();
    }
    slider.addEventListener('input', read);
    read();
  }

  function chartPlot(ctx, width, height, station, month) {
    const left = 32;
    const right = width - 36;
    const top = 29;
    const bottom = height - 33;
    const unit = (right - left) / 12;
    const x = index => left + unit * (index + .5);
    const yTemp = value => bottom - (value + 40) / 80 * (bottom - top);
    const yRain = value => bottom - value / 400 * (bottom - top);
    ctx.fillStyle = '#f0f7fa';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#e0eef3';
    ctx.fillRect(left + month * unit, top, unit, bottom - top);
    ctx.strokeStyle = '#b9d0dc';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = yRain(i * 100);
      line(ctx, left, y, right, y);
      label(ctx, String(-40 + i * 20), left - 5, y, {align:'right',size:11,color:'#913b25'});
      label(ctx, String(i * 100), right + 5, y, {align:'left',size:11,color:'#145677'});
    }
    label(ctx, '℃', 16, 13, {color:'#913b25'});
    label(ctx, '毫米', width - 19, 13, {color:'#145677',size:11});
    station.precipitation.forEach((value, index) => {
      ctx.fillStyle = index === month ? '#126386' : '#83b6cf';
      ctx.fillRect(x(index) - unit * .31, yRain(value), unit * .62, bottom - yRain(value));
      label(ctx, String(index + 1), x(index), bottom + 16, {size:11});
    });
    ctx.strokeStyle = '#a34227';
    ctx.lineWidth = 2.7;
    ctx.beginPath();
    station.temperature.forEach((value, index) => {
      ctx[index ? 'lineTo' : 'moveTo'](x(index), yTemp(value));
    });
    ctx.stroke();
    circle(ctx, x(month), yTemp(station.temperature[month]), 4.5, '#a34227', '#fff');
    return {left, right};
  }

  function types() {
    const month = $('#chart-month');
    const output = $('#station-charts');
    const pairs = [{id:'single',title:'单站观察'}, ...data.comparisons];
    let first = get('station', stations, stationById('beijing'));
    let pair = get('compare', pairs);
    let charts = [];
    const chooseStation = buttons('#station-choices', stations, station => select(station, pairs[0]));
    const choosePair = buttons('#compare-choices', pairs, selected =>
      select(selected.first ? stationById(selected.first) : first, selected));

    function select(station, selectedPair, update = true) {
      first = station;
      pair = selectedPair;
      chooseStation(first.id);
      choosePair(pair.id);
      $('#compare-prompt').hidden = !pair.prompt;
      $('#compare-prompt').textContent = pair.prompt || '';
      if (update) remember({station:first.id, compare:pair.second ? pair.id : ''});
      for (const chart of charts) chart.disconnect();
      charts = [];
      const visible = pair.second ? [first, stationById(pair.second)] : [first];
      output.innerHTML = visible.map(record => {
        const stat = model.statistics(record);
        return `<article class="climate-chart">
          <header><h3>${esc(record.name)}</h3><span>${esc(record.type)} · 站点海拔 ${record.elevation} 米</span></header>
          <canvas class="climate-month-chart" role="img" aria-label="${esc(record.name)}站逐月气温降水图。用月份滑块或打开数据表读数。"></canvas>
          <p class="climate-month-reading" aria-live="polite"></p>
          <dl class="climate-stats">
            <div><dt>月均温年较差</dt><dd>${fmt.format(stat.tempRange)} ℃</dd></div>
            <div><dt>各月降水合计</dt><dd>${fmt.format(stat.rain)} 毫米</dd></div>
            <div><dt>雨量最多月份</dt><dd>${stat.wettest + 1} 月</dd></div>
            <div><dt>4–9 月降水占比</dt><dd>${Math.round(stat.warmHalfShare * 100)}%</dd></div>
          </dl>
          <p>${esc(record.note)}</p>
          <details class="climate-details"><summary>逐月数据与站号</summary>
            <table class="climate-table">
              <thead><tr><th scope="col">月份</th><th scope="col">月均温（℃）</th><th scope="col">月降水（毫米）</th></tr></thead>
              <tbody>${record.temperature.map((t, i) => `<tr><th scope="row">${i + 1} 月</th><td>${fmt.format(t)}</td><td>${fmt.format(record.precipitation[i])}</td></tr>`).join('')}</tbody>
            </table>
            <p><a href="${esc(normalLink(record))}">日本气象厅 ClimatView · ${record.number} ↗</a></p>
          </details>
        </article>`;
      }).join('');
      charts = visible.map((record, i) => {
        const card = output.children[i];
        const canvas = card.querySelector('canvas');
        const reading = card.querySelector('.climate-month-reading');
        let bounds;
        const chart = drawing(canvas, (ctx, width, height) => {
          bounds = chartPlot(ctx, width, height, record, Number(month.value) - 1);
        });
        canvas.addEventListener('click', event => {
          if (!bounds) return;
          const point = event.clientX - canvas.getBoundingClientRect().left;
          const index = Math.floor((point - bounds.left) / (bounds.right - bounds.left) * 12);
          if (index >= 0 && index < 12) {
            month.value = index + 1;
            read();
          }
        });
        return {...chart, record, reading};
      });
      read();
    }

    function read() {
      const value = Number(month.value);
      const i = value - 1;
      $('#month-value').textContent = value + ' 月';
      month.setAttribute('aria-valuetext', value + ' 月');
      for (const {record, reading, render} of charts) {
        reading.textContent = `${value} 月 · 月均温 ${fmt.format(record.temperature[i])} ℃ · 降水 ${fmt.format(record.precipitation[i])} 毫米`;
        render();
      }
    }
    month.addEventListener('input', read);
    select(pair.first ? stationById(pair.first) : first, pair, false);
  }

  function china() {
    const geo = window.GEO_CHINA_GEO;
    const grid = window.ChinaClimateGrid;
    const shapes = Object.values(geo.provinces);
    const areas = [{id:'all',name:'显示全部'}, ...data.classes];
    const canvas = $('#china-climate-map');
    let active = get('zone', data.zones, data.zones[2]);
    let filter = get('group', areas);
    let hit = null;
    const markers = data.zones.map(zone => ({zone, station:stationById(zone.station)}));
    const toX = lon => lon - grid.west;
    const toY = lat => grid.north - lat;
    const outlines = new Path2D();
    for (const rings of shapes) {
      for (const points of rings) {
        points.forEach(([lon, lat], i) => outlines[i ? 'lineTo' : 'moveTo'](toX(lon), toY(lat)));
        outlines.closePath();
      }
    }
    const geometry = document.createElement('canvas').getContext('2d');
    const surface = document.createElement('canvas');
    surface.width = grid.rows[0].length;
    surface.height = grid.rows.length;
    const surfaceCtx = surface.getContext('2d');
    const pal = new Map(data.classes.map(record => [record.id, record.color]));
    const figures = data.codes.map(code => code.charAt(0).toLowerCase());
    let plot;
    function raster() {
      surfaceCtx.clearRect(0, 0, surface.width, surface.height);
      grid.rows.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          const key = figures[parseInt(row[x], 32)];
          if (!key) continue;
          surfaceCtx.fillStyle = filter.id === 'all' || filter.id === key ? pal.get(key) : '#e6e9ea';
          surfaceCtx.fillRect(x, y, 1, 1);
        }
      });
    }
    raster();

    const map = drawing(canvas, (ctx, width, height) => {
      const left = 24;
      const top = 12;
      const mapWidth = width - left - 12;
      const mapHeight = height - top - 23;
      const sx = mapWidth / (grid.east - grid.west);
      const sy = mapHeight / (grid.north - grid.south);
      const x = lon => left + toX(lon) * sx;
      const y = lat => top + toY(lat) * sy;
      plot = {left, top, sx, sy, x, y};
      ctx.fillStyle = '#e6f1f6';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#bed4df';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      for (const lon of [80,100,120]) {
        line(ctx, x(lon), top, x(lon), top + mapHeight);
        label(ctx, lon + '°E', x(lon), height - 10, {size:10});
      }
      for (const lat of [20,30,40,50]) {
        line(ctx, left, y(lat), left + mapWidth, y(lat));
        label(ctx, lat + '°', 12, y(lat), {size:10});
      }
      ctx.setLineDash([]);
      ctx.save();
      ctx.translate(left, top);
      ctx.scale(sx, sy);
      ctx.fillStyle = '#dce4e6';
      ctx.fill(outlines, 'evenodd');
      ctx.clip(outlines, 'evenodd');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(surface, 0, 0, grid.east - grid.west, grid.north - grid.south);
      ctx.restore();
      ctx.save();
      ctx.translate(left, top);
      ctx.scale(sx, sy);
      ctx.strokeStyle = '#657d87';
      ctx.lineWidth = .6 / sx;
      ctx.stroke(outlines);
      ctx.restore();
      if (hit) {
        ctx.lineWidth = 2;
        circle(ctx, x(hit.lon), y(hit.lat), 7, '#fff', '#243e55');
      }
      for (const {station, zone} of markers) {
        const selected = active === zone;
        ctx.lineWidth = selected ? 3 : 2;
        circle(ctx, x(station.lon), y(station.lat), selected ? 7 : 4.5,
          selected ? '#85371e' : '#203f59', '#fff');
        label(ctx, station.name, x(station.lon), y(station.lat) - 15,
          {size:width < 520 ? 11 : 14, color:'#112c3d'});
      }
    });
    const markClass = buttons('#class-choices', areas, item => selectClass(item));
    const markZone = buttons('#zone-choices', data.zones, zone => selectZone(zone));
    function describeFilter() {
      $('#class-result').textContent = filter.text
        ? filter.name + ' · ' + filter.text
        : '已显示全部类别。点击图中陆地，读取对应格点的气候亚类代码。';
    }
    function selectZone(zone, update = true) {
      active = zone;
      hit = null;
      markZone(zone.id);
      if (update) remember({zone:zone.id});
      describeFilter();
      const station = stationById(zone.station);
      $('#zone-result').innerHTML = `<h3>${esc(zone.title)}</h3><p><b>代表地区</b> ${esc(zone.region)}</p>
        <p>${esc(zone.text)}</p><p><a href="types.html?station=${station.id}">查看${esc(station.name)}的逐月气温与降水 →</a></p>`;
      map.render();
    }
    function selectClass(item, update = true) {
      filter = item;
      hit = null;
      markClass(item.id);
      if (update) remember({group:item.id === 'all' ? '' : item.id});
      describeFilter();
      raster();
      map.render();
    }
    canvas.addEventListener('click', event => {
      if (!plot) return;
      const box = canvas.getBoundingClientRect();
      const px = event.clientX - box.left;
      const py = event.clientY - box.top;
      const marker = markers.map(record => ({
        ...record,
        distance:Math.hypot(plot.x(record.station.lon) - px, plot.y(record.station.lat) - py)
      })).sort((a, b) => a.distance - b.distance)[0];
      if (marker.distance <= 13) {
        selectZone(marker.zone);
        return;
      }
      const tx = (px - plot.left) / plot.sx;
      const ty = (py - plot.top) / plot.sy;
      const lon = grid.west + tx;
      const lat = grid.north - ty;
      const code = geometry.isPointInPath(outlines, tx, ty, 'evenodd') ? data.codes[model.cellAt(grid, lon, lat)] : '';
      hit = code ? {lon, lat} : null;
      if (code) {
        const group = data.classes.find(record => record.id === code[0].toLowerCase());
        $('#class-result').textContent = `东经 ${lon.toFixed(2)}°、北纬 ${lat.toFixed(2)}°附近 · ${code}（${group.name}）。`;
      } else {
        $('#class-result').textContent = '这里没有可读的陆地格点。试试点图中的着色陆地。';
      }
      map.render();
    });
    selectClass(filter, false);
    selectZone(active, false);
  }

  ({index:overview, weather, types, china})[page.id]();
})();

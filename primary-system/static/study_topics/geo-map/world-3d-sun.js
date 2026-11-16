/* 理想球面光照与一日播放；计算和时钟可独立验证，界面可离开 WebGL 使用。 */
window.GMWorldSun = (() => {
  'use strict';
  const rad = Math.PI / 180;
  const wrapHour = hour => ((hour % 24) + 24) % 24;
  function daylight(latitude, declination) {
    const a = Math.sin(latitude * rad) * Math.sin(declination * rad);
    const b = Math.cos(latitude * rad) * Math.cos(declination * rad);
    if (Math.abs(b) < 1e-10) return Math.abs(a) < 1e-10 ? null : a > 0 ? 24 : 0;
    return 24 / Math.PI * Math.acos(Math.max(-1, Math.min(1, -a / b)));
  }
  function model(point, hour, declination) {
    const G = window.GMWorld3DGeometry;
    const sunPoint = [G.wrap(180 - wrapHour(hour) * 15), declination], normal = G.xyz(sunPoint);
    const dot = G.xyz(point).reduce((sum, x, i) => sum + x * normal[i], 0);
    return {sunPoint, phase: Math.abs(dot) < 1e-8 ? 'boundary' : dot > 0 ? 'day' : 'night', hours: daylight(point[1], declination)};
  }
  function terminator(point, steps = 128) {
    const n = window.GMWorld3DGeometry.xyz(point), axis = Math.abs(n[1]) < .9 ? [0, 1, 0] : [1, 0, 0];
    const dot = axis.reduce((sum, x, i) => sum + x * n[i], 0);
    const u = axis.map((x, i) => x - dot * n[i]), length = Math.hypot(...u);
    u.forEach((x, i) => { u[i] = x / length; });
    const v = [n[1]*u[2]-n[2]*u[1], n[2]*u[0]-n[0]*u[2], n[0]*u[1]-n[1]*u[0]];
    return Array.from({length: steps}, (_, i) => u.map((x, k) => x*Math.cos(i*2*Math.PI/steps) + v[k]*Math.sin(i*2*Math.PI/steps)));
  }
  function createClock({request, cancel, available, render, changed, initialHour = 8}) {
    let hour = initialHour, elapsed = 0, playing = false, frame = 0, previous = null, generation = 0;
    const state = () => ({hour, elapsed, playing});
    function pause() { playing = false; generation++; if (frame) cancel(frame); frame = 0; previous = null; changed(state()); }
    function tick(stamp, token) {
      if (!playing || token !== generation) return;
      frame = 0;
      if (!available()) { pause(); return; }
      if (previous !== null) {
        const advance = Math.min(24 - elapsed, Math.max(0, stamp - previous) / 1000);
        elapsed += advance; hour = wrapHour(hour + advance); render(state());
      }
      previous = stamp;
      if (elapsed >= 24) pause(); else frame = request(time => tick(time, token));
    }
    function play() {
      if (playing || !available()) return;
      if (elapsed >= 24) elapsed = 0;
      playing = true; previous = null; const token = ++generation;
      changed(state()); frame = request(time => tick(time, token));
    }
    function setHour(value) {
      if (!Number.isFinite(value)) return;
      pause(); hour = wrapHour(value); elapsed = 0; render(state()); changed(state());
    }
    return {state, play, pause, setHour, refresh: () => { if (!available()) pause(); else changed(state()); }};
  }
  function mount({root, focus, overlay, illuminate, currentPoint, readCoordinates}) {
    const D = window.GM_WORLD_SUN, G = window.GMWorld3DGeometry, esc = window.GMShared.esc, $ = id => root.querySelector(`#${id}`);
    let active = false, inView = true, season = D.seasons[0], point = currentPoint().slice();
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fullMotion = () => !media.matches && (!window.StudyEffects || window.StudyEffects.motion === 'full');
    const available = () => active && inView && !document.hidden && fullMotion() && root.dataset.renderer === 'webgl';
    const hoursText = hours => hours === null ? '太阳在地平线附近' : hours === 24 ? '约 24 小时 · 极昼' : hours === 0 ? '约 0 小时 · 极夜' : `约 ${hours.toFixed(1)} 小时`;
    const timeText = hour => { const minutes = Math.floor(wrapHour(hour) * 60 + 1e-7) % 1440; return `${String(Math.floor(minutes / 60)).padStart(2, '0')}：${String(minutes % 60).padStart(2, '0')}`; };
    function comparison() {
      $('gw-sun-comparison').innerHTML = D.seasons.map(s => {
        const hours = daylight(point[1], s.declination);
        return `<div><b>${esc(s.name)}</b><span>${hoursText(hours)}</span>${hours === null ? '' : `<meter min="0" max="24" value="${hours}" aria-valuetext="${hoursText(hours)}" aria-label="${esc(s.name)}的白昼时长">${hours}</meter>`}</div>`;
      }).join('');
    }
    function render(state) {
      if (!active) return;
      const result = model(point, state.hour, season.declination);
      illuminate(result);
      root.dispatchEvent(new CustomEvent('gm-world-utc', {detail:{hour:state.hour}}));
      $('gw-sun-time').value = state.hour; $('gw-sun-time-value').textContent = 'UTC ' + timeText(state.hour);
      $('gw-sun-time').setAttribute('aria-valuetext', 'UTC ' + timeText(state.hour));
      const phase = {day: '白天', night: '黑夜', boundary: '晨昏交界'}[result.phase];
      $('gw-sun-phase').textContent = phase; $('gw-sun-length').textContent = hoursText(result.hours);
      $('gw-sun-point').textContent = G.coordinates(point);
      $('gw-sun-noon').disabled = Math.abs(point[1]) === 90;
      $('gw-sun-direct').textContent = G.coordinates(result.sunPoint);
      $('gw-tool-goal').textContent = `${season.name} · UTC ${timeText(state.hour)}`;
      $('gw-tool-result').textContent = `观察点：${phase} · ${result.hours === null ? hoursText(null) : '白昼' + hoursText(result.hours)}`;
    }
    function changed(state) {
      $('gw-sun-play').disabled = !available();
      $('gw-sun-play').textContent = state.playing ? '暂停演示' : state.elapsed >= 24 ? '再看一天' : state.elapsed > 0 ? '继续演示' : '播放一天';
      $('gw-sun-play').setAttribute('aria-pressed', String(state.playing));
      $('gw-sun-play-status').textContent = !fullMotion() ? '已减少动态效果，可拖动时间或点「前进 3 小时」。' : root.dataset.renderer !== 'webgl' ? '当前无法显示 3D，仍可切换时节和时间读取结果。' : state.playing ? '一天压缩为约 24 秒，随时可以暂停。' : state.elapsed >= 24 ? '一天演示完成，停在起始时刻。' : '演示默认暂停；离开地球仪或切到后台会暂停。';
    }
    const clock = createClock({request: fn => requestAnimationFrame(fn), cancel: id => cancelAnimationFrame(id), available, render, changed});
    $('gw-sun-intro').textContent = D.intro; $('gw-sun-note').textContent = D.note;
    $('gw-sun-seasons').innerHTML = D.seasons.map(s => `<button type="button" data-season="${s.id}" aria-pressed="${s.id === season.id}">${esc(s.name)}</button>`).join('');
    $('gw-sun-studies').innerHTML = '<option value="">自由选择观察点</option>' + D.studies.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
    function updateSeason() {
      $('gw-sun-season-text').textContent = season.text;
      $('gw-sun-seasons').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.season === season.id)));
      comparison(); render(clock.state());
    }
    function pick(value, turn = false) {
      clock.pause(); point = value.slice();
      $('gw-sun-studies').value = ''; $('gw-sun-study-text').textContent = '';
      overlay([{point, color: '#e67334'}]); comparison(); render(clock.state());
      readCoordinates(point, '昼夜观察点'); if (turn) focus(point, '昼夜观察点');
    }
    function showStudy(id) {
      const study = D.studies.find(s => s.id === id); if (!study) return;
      season = D.seasons.find(s => s.id === study.season); pick(study.point, true);
      clock.setHour(study.hour); updateSeason();
      $('gw-sun-studies').value = id; $('gw-sun-study-text').textContent = study.text;
    }
    function setActive(value) {
      clock.pause(); active = value; $('gw-sun-inline').hidden = !active;
      if (active) { point = currentPoint().slice(); pick(point); updateSeason(); }
      else illuminate(null);
      changed(clock.state());
    }
    $('gw-sun-seasons').addEventListener('click', event => {
      const button = event.target.closest('[data-season]'); if (!button) return;
      clock.pause(); season = D.seasons.find(s => s.id === button.dataset.season);
      $('gw-sun-studies').value = ''; $('gw-sun-study-text').textContent = ''; updateSeason();
    });
    $('gw-sun-time').addEventListener('input', () => clock.setHour(Number($('gw-sun-time').value)));
    $('gw-sun-play').addEventListener('click', () => clock.state().playing ? clock.pause() : clock.play());
    $('gw-sun-step').addEventListener('click', () => clock.setHour(clock.state().hour + 3));
    $('gw-sun-studies').addEventListener('change', () => showStudy($('gw-sun-studies').value));
    $('gw-sun-current').addEventListener('click', () => pick(currentPoint(), true));
    $('gw-sun-locate').addEventListener('click', () => focus(point, '昼夜观察点'));
    $('gw-sun-noon').addEventListener('click', () => { clock.setHour(12 - point[0] / 15); focus(point, '观察点的太阳正午'); });
    const refresh = () => clock.refresh();
    const observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; refresh(); }); observer.observe($('gw-viewport'));
    document.addEventListener('visibilitychange', refresh); document.addEventListener('study:effects-change', refresh);
    media.addEventListener('change', refresh); root.addEventListener('gm-world-renderer-change', refresh);
    window.addEventListener('pageshow', refresh);
    window.addEventListener('pagehide', event => {
      clock.pause(); if (event.persisted) return;
      observer.disconnect(); media.removeEventListener('change', refresh);
      document.removeEventListener('visibilitychange', refresh); document.removeEventListener('study:effects-change', refresh);
      root.removeEventListener('gm-world-renderer-change', refresh); window.removeEventListener('pageshow', refresh);
    });
    return {setActive, pick, showStudy, setUTC: value => clock.setHour(value)};
  }
  return {daylight, model, terminator, createClock, mount};
})();

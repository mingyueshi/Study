'use strict';
(() => {
  const hour = 3600000;
  const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  // 输入框与日界都固定在 UTC+8，设备时区不参与解释。
  const clock = date => new Date(date.getTime() + 8 * hour).toISOString().slice(0, 16);
  function parseClock(value) {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) || value < '1900' || value >= '2101') return null;
    const date = new Date(value + ':00+08:00');
    return Number.isFinite(date.getTime()) && clock(date) === value ? date : null;
  }
  function solarDay(engine, observer, date) {
    const start = new Date(clock(date).slice(0, 10) + 'T00:00:00+08:00');
    return [1, -1].map(sign => {
      const event = engine.SearchRiseSet('Sun', observer, sign, start, 1);
      return event && clock(event.date).slice(0, 10) === clock(start).slice(0, 10) ? clock(event.date).slice(11) : null;
    });
  }
  function horizontal(engine, body, observer, date, refraction) {
    const equator = engine.Equator(body, date, observer, true, true);
    return engine.Horizon(date, observer, equator.ra, equator.dec, refraction);
  }
  function visibility(body, altitude, sunlight, elongation) {
    if (altitude <= 0) return '地平线下';
    if (sunlight >= 0) return '白昼，天空明亮';
    if (elongation < 15) return '距太阳方向太近';
    if (sunlight >= -6) return '晨昏，天光较亮';
    if (altitude < 10) return '贴近地平线，较难看见';
    if (body === 'Neptune') return '可尝试用望远镜找';
    if (body === 'Uranus') return '可尝试用双筒镜找';
    return '可尝试肉眼观测';
  }
  if (typeof module !== 'undefined') module.exports = {clock, parseClock, solarDay, horizontal, visibility};
  if (typeof document === 'undefined') return;

  const get = key => document.getElementById('sky-' + key);
  const places = {北京:[39.90,116.41], 上海:[31.23,121.47], 广州:[23.13,113.26], 成都:[30.57,104.07], 昆明:[25.04,102.71], 乌鲁木齐:[43.83,87.62], 漠河:[52.97,122.54]};
  const place = get('place'), time = get('time'), lat = get('lat'), lon = get('lon');
  const engine = window.Astronomy;
  let live = true;
  for (const name of [...Object.keys(places), '自定经纬度']) place.add(new Option(name, name));

  function render() {
    if (live) time.value = clock(new Date());
    const date = parseClock(time.value);
    const custom = !places[place.value];
    get('custom').hidden = !custom;
    const [latitude, longitude] = custom ? [lat.valueAsNumber, lon.valueAsNumber] : places[place.value];
    get('coordinates').textContent = custom ? '' : '北纬 ' + latitude + '° · 东经 ' + longitude + '°';
    if (!date || custom && (!lat.validity.valid || !lon.validity.valid)) {
      get('results').hidden = true;
      get('status').textContent = !date ? '请输入 1900—2100 年内的有效时刻。' : '请输入纬度（−90° 至 90°）和经度（−180° 至 180°）。';
      return;
    }
    get('status').textContent = (live ? '跟随此刻，每分钟更新' : '查看所选时刻') + ' · ' + clock(date).replace('T', ' ') + ' 北京时间';
    const observer = new engine.Observer(latitude, longitude, 0);
    const [rise, set] = solarDay(engine, observer, date);
    get('rise').textContent = rise || '当日无日出';
    get('set').textContent = set || '当日无日落';
    const moon = window.AstroMoonCalendar.moonAt(date, engine);
    const phaseIndex = Math.round(moon.phase * 8) % 8;
    get('phase').textContent = ASTRO_OBSERVATION.phases[phaseIndex].label + '附近';
    get('fraction').textContent = '月面亮了约 ' + (moon.fraction * 100).toFixed(1) + '%';
    const sunlight = horizontal(engine, 'Sun', observer, date).altitude;
    get('sun').textContent = '太阳中心高度 ' + sunlight.toFixed(1) + '°。' + (sunlight < -6 ? '此时天光已较暗。' : '可以把时刻调到天黑后，再比较一次。');
    get('planets').replaceChildren();
    for (const planet of ASTRO_MEDIA.planets.filter(p => p.id !== 'earth')) {
      const body = planet.id[0].toUpperCase() + planet.id.slice(1);
      const {altitude, azimuth} = horizontal(engine, body, observer, date, 'normal');
      const status = visibility(body, altitude, sunlight, engine.Elongation(body, date).elongation);
      const item = document.createElement('div');
      const title = document.createElement('h3'), coordinates = document.createElement('p'), label = document.createElement('strong');
      const direction = directions[Math.round(azimuth / 45) % 8];
      title.textContent = planet.name;
      coordinates.textContent = direction + ' ' + azimuth.toFixed(1) + '° · 高度 ' + altitude.toFixed(1) + '°';
      label.textContent = status;
      item.append(title, coordinates, label);
      get('planets').append(item);
    }
    get('results').hidden = false;
  }
  place.onchange = () => {
    if (places[place.value]) [lat.value, lon.value] = places[place.value];
    render();
  };
  lat.oninput = lon.oninput = render;
  time.oninput = () => { live = false; render(); };
  get('now').onclick = () => { live = true; render(); };
  const refresh = () => { if (live && !document.hidden) render(); };
  document.addEventListener('visibilitychange', refresh);
  window.setInterval(refresh, 60000);
  place.onchange();
})();

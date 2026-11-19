/* 中国版点击接管、判题与进度；查看答案不计入完成。 */
window.GMChinaAdventures = (() => {
  'use strict';
  const KEY = 'study_china_3d_missions_v1';
  function readProgress(raw, missions) {
    try { const ids = JSON.parse(raw); return new Set(Array.isArray(ids) ? ids.filter(id => missions.some(m => m.id === id)) : []); } catch { return new Set(); }
  }
  function createRound(missions, initial = new Set()) {
    const found = readProgress(JSON.stringify([...initial]), missions);
    let mission = missions[0], status = 'asking', hints = 0;
    return {
      state: () => ({ mission, status, hints, found: new Set(found) }),
      select(id) { const next = missions.find(m => m.id === id); if (!next) return; mission = next; hints = 0; status = 'asking'; },
      hint() { hints = Math.min(2, hints + 1); },
      reveal() { if (status === 'asking') status = 'revealed'; },
      guess(province, point) {
        if (status !== 'asking') return { result: 'locked' };
        if (mission.kind === 'hunt' && (!Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite) || Math.abs(point[0]) > 180 || Math.abs(point[1]) > 90)) return { result: 'empty' };
        const km = point ? window.GMTerrainSection.distance(point, mission.point) : null;
        const correct = mission.kind === 'detective' ? province === mission.answer : km <= mission.toleranceKm;
        if (correct) { status = 'solved'; found.add(mission.id); }
        return { result: correct ? 'correct' : 'wrong', km };
      },
    };
  }
  function mount({ root, prepare, locate, highlight, mark, changed }) {
    const D = window.GM_CHINA_ADVENTURES, esc = window.GMShared.esc, $ = id => root.querySelector('#gm3-game-' + id);
    let mode = 'browse', saved = new Set();
    try { saved = readProgress(localStorage.getItem(KEY), D.missions); } catch { $('storage').textContent = '记录暂存本页，浏览器无法保存到下次。'; }
    const round = createRound(D.missions, saved);
    const say = text => { $('feedback').textContent = text; };
    function render() {
      const s = round.state(), entries = D.missions.filter(m => m.kind === mode), locked = s.status !== 'asking';
      root.dataset.gameMode = mode; root.dataset.gameStatus = s.status;
      const layer = root.querySelector('#gm3-label-layer');
      layer.inert = mode === 'hunt' || root.dataset.sectionDrawing === 'true';
      root.querySelectorAll('[data-china-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.chinaMode === mode)));
      $('body').hidden = mode === 'browse';
      root.querySelector('#gm3-mission-tools').hidden = mode === 'browse';
      root.querySelector('#gm3-game-map-clue').hidden = mode === 'browse';
      $('progress').textContent = `已完成 ${s.found.size}／${D.missions.length}`;
      if (mode === 'browse') return;
      $('missions').innerHTML = entries.map(m => `<button type="button" data-mission="${m.id}" aria-pressed="${m.id === s.mission.id}">${s.found.has(m.id) ? '✓ ' : ''}${esc(m.title)}</button>`).join('');
      $('clue').textContent = s.mission.clue;
      root.querySelector('#gm3-game-map-clue').textContent = s.mission.clue;
      $('hints').innerHTML = s.mission.hints.slice(0, s.hints).map(h => `<li>${esc(h)}</li>`).join('');
      $('hint').disabled = locked || s.hints === 2; $('reveal').disabled = locked;
      $('answer').hidden = mode !== 'detective'; $('coordinates').hidden = mode !== 'hunt';
      $('submit').disabled = locked;
      $('answers').querySelectorAll('button').forEach(b => { b.disabled = locked; });
      $('goal').textContent = mode === 'hunt' ? `允许误差约 ${s.mission.toleranceKm} 千米。点地形或输入经纬度作答。` : '点地图或省名作答，也可以展开下面的省名按钮。';
    }
    function begin(id) { round.select(id); highlight(''); mark(null); render(); say('对照线索找一找；需要时可以看提示。'); }
    function setMode(next) {
      if (next !== 'browse') prepare();
      mode = next; highlight(''); mark(null);
      if (mode !== 'browse') {
        const s = round.state(), entries = D.missions.filter(m => m.kind === mode);
        begin((entries.find(m => !s.found.has(m.id)) || entries[0]).id);
      } else render();
      changed(mode);
    }
    function guess(province, point) {
      if (mode === 'browse') return false;
      const result = round.guess(province, point), s = round.state();
      if (result.result === 'locked') return true;
      if (mode === 'detective') highlight(province || '');
      else mark(point);
      if (result.result === 'correct') {
        try { localStorage.setItem(KEY, JSON.stringify([...s.found])); } catch { $('storage').textContent = '本次已记下，浏览器未能保存到下次。'; }
        say('找到啦！' + s.mission.explanation);
      } else if (result.result === 'empty') say('请点陆地，或输入有效的经纬度。');
      else if (mode === 'hunt') say(`还相距约 ${Math.round(result.km)} 千米。` + (point[0] < s.mission.point[0] ? '向东' : '向西') + (point[1] < s.mission.point[1] ? '、向北' : '、向南') + '再找找。');
      else say('再看看位置、简称和地形线索，可以点「提示」。');
      render(); return true;
    }
    $('answers').innerHTML = window.GM_PROVINCES.map(p => `<button type="button" data-answer="${p.id}">${esc(p.name)}</button>`).join('');
    root.querySelectorAll('[data-china-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.chinaMode)));
    $('missions').addEventListener('click', e => { const b = e.target.closest('[data-mission]'); if (b) begin(b.dataset.mission); });
    $('answers').addEventListener('click', e => { const b = e.target.closest('[data-answer]'); if (b) guess(b.dataset.answer); });
    $('hint').addEventListener('click', () => { round.hint(); render(); });
    $('reveal').addEventListener('click', () => {
      round.reveal(); const m = round.state().mission; highlight(m.answer || ''); mark(m.point); locate(m.point);
      say(m.explanation + ' 已展示答案，本次不计入完成；可以重新挑战。'); render();
    });
    $('retry').addEventListener('click', () => begin(round.state().mission.id));
    $('next').addEventListener('click', () => { const entries = D.missions.filter(m => m.kind === mode); begin(entries[(entries.findIndex(m => m.id === round.state().mission.id) + 1) % entries.length].id); });
    $('coordinates').addEventListener('submit', e => {
      e.preventDefault();
      const lon = $('lon').value.trim(), lat = $('lat').value.trim();
      if (!lon || !lat) { say('经度和纬度都要填好哦。'); return; }
      const p = [Number(lon), Number(lat)];
      if (p.every(Number.isFinite) && p[0] >= 73 && p[0] <= 136 && p[1] >= 18 && p[1] <= 54) { guess('', p); locate(p); }
      else say('请填中国附近的经纬度：东经 73°—136°、北纬 18°—54°。');
    });
    render();
    return { guess, stop: () => setMode('browse'), get active() { return mode !== 'browse'; }, get mode() { return mode; } };
  }
  return { readProgress, createRound, mount };
})();

/* 所有配音只在用户操作后启用；换站、取消与后台使旧回调失效。 */
window.GMChinaNarrator = (() => {
  function create(root, tourText) {
    const $ = id => root.querySelector('#gm3-voice-' + id);
    let token = 0, active = null, auto = false;
    const supported = Boolean(window.SpeechKit && window.speechSynthesis);
    const section = { button: $('section'), status: $('section-status'), label: '读剖面' };
    const tour = { button: $('tour'), status: $('tour-status'), label: '读这一站' };
    function finish(message) {
      active.button.textContent = active.label;
      active.status.textContent = message;
      active = null;
    }
    function stop() {
      if (!active) return;
      token++;
      finish('');
      window.speechSynthesis.cancel();
    }
    function read(player, text) {
      stop();
      if (!supported || !text) return;
      const current = ++token;
      active = player;
      player.button.textContent = '停止朗读';
      player.status.textContent = '正在朗读…';
      window.SpeechKit.speak(text, { lang: 'zh-CN', rate: .88,
        onend() { if (current === token && active === player) finish('读完啦。'); },
        onerror() { if (current === token && active === player) finish('语音未能播放，请确认设备上有中文语音。'); },
      });
    }
    for (const player of [section, tour]) {
      player.button.disabled = !supported;
      if (!supported) player.status.textContent = '当前浏览器没有语音服务，仍可阅读文字。';
    }
    $('auto').disabled = !supported;
    section.button.addEventListener('click', () => {
      if (active === section) { stop(); return; }
      const summary = root.querySelector('#gm3-section-summary').textContent;
      read(section, [summary, root.querySelector('#gm3-section-route').textContent, window.GM_CHINA_3D.section.observe].join('。'));
    });
    tour.button.addEventListener('click', () => { if (active === tour) stop(); else read(tour, tourText()); });
    $('auto').addEventListener('click', () => {
      auto = !auto;
      $('auto').setAttribute('aria-pressed', String(auto));
      if (auto) read(tour, tourText());
      else if (active === tour) stop();
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    window.addEventListener('pagehide', stop);
    return { stop, station(text) { if (auto) read(tour, text); }, get reading() { return active !== null; } };
  }
  return { create };
})();

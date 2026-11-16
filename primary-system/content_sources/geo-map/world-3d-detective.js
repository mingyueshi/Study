/* 线索挑战与探索记录。看答案和自己找对分开记录，旧题进度沿用稳定 ID。 */
window.GMWorldDetective = (() => {
  'use strict';
  const KEY = 'study_world_globe_detective_v1';
  function createRound(missions, initial = new Set()) {
    const valid = new Set(missions.map(m => m.id));
    let found = new Set([...initial].filter(id => valid.has(id))), index = 0, hints = 0, status = 'asking';
    const state = () => ({mission: missions[index], index, hints, status, found: new Set(found)});
    function select(id) { const next = missions.findIndex(m => m.id === id); if (next < 0) return false; index = next; hints = 0; status = 'asking'; return true; }
    function guess(country) {
      if (status !== 'asking') return 'locked';
      if (!country) return 'ocean';
      if (!(missions[index].accepts || [missions[index].answer]).includes(country)) return 'wrong';
      status = 'solved'; found.add(missions[index].id); return 'correct';
    }
    function hint() { if (status === 'asking') hints = Math.min(hints + 1, missions[index].hints.length); return state(); }
    function reveal() { if (status === 'asking') status = 'revealed'; }
    function resume() { select((missions.find(m => !found.has(m.id)) || missions[0]).id); }
    return {state, select, guess, hint, reveal, resume};
  }
  function mount({root, countries, name, highlight, locate, choose, overlay}) {
    const D = window.GM_WORLD_DETECTIVE, esc = window.GMShared.esc, $ = id => root.querySelector(`#${id}`);
    const hintButtons = [...root.querySelectorAll('#gw-detective-hint, [data-detective-action="hint"]')];
    const nextButtons = [...root.querySelectorAll('#gw-detective-next, [data-detective-action="next"]')];
    let saved = new Set(), active = false;
    try { saved = window.GMWorldLearning.readProgress(localStorage.getItem(KEY), D.missions); }
    catch { $('gw-detective-storage').textContent = '浏览器无法保存记录，本页仍可继续挑战。'; }
    const round = createRound(D.missions, saved);
    $('gw-detective-intro').textContent = D.intro; $('gw-detective-note').textContent = D.note;
    $('gw-detective-task').innerHTML = D.missions.map((m, i) => `<option value="${m.id}">第 ${i + 1} 条 · ${esc(m.title)}</option>`).join('');
    $('gw-detective-answer').innerHTML = '<option value="">选择你找到的国家</option>' + [...countries].sort((a, b) => name(a.name).localeCompare(name(b.name), 'zh-CN')).map(c => `<option value="${esc(c.name)}">${esc(name(c.name))}</option>`).join('');
    function progress() {
      const state = round.state();
      $('gw-detective-progress').textContent = `已找到 ${state.found.size} / ${D.missions.length}`;
      root.dispatchEvent(new CustomEvent('gm-world-progress', {detail: {kind: 'detective', ids: [...state.found]}}));
    }
    function feedback(text, short = text) {
      $('gw-detective-feedback').textContent = text;
      $('gw-tool-result').textContent = short;
    }
    function render() {
      const s = round.state(), locked = s.status !== 'asking';
      $('gw-detective-task').value = s.mission.id;
      $('gw-detective-title').textContent = s.mission.title;
      $('gw-detective-clue').textContent = s.mission.clue;
      $('gw-detective-hints').innerHTML = s.mission.hints.slice(0, s.hints).map((h, i) => `<li>提示 ${i + 1}：${esc(h)}</li>`).join('');
      $('gw-detective-hints').hidden = s.hints === 0;
      hintButtons.forEach(button => { button.disabled = locked || s.hints === s.mission.hints.length; button.textContent = `提示（${s.hints} / ${s.mission.hints.length}）`; });
      $('gw-detective-submit').disabled = locked; $('gw-detective-answer').disabled = locked;
      $('gw-detective-reveal').disabled = locked; $('gw-detective-learn').disabled = !locked;
      nextButtons.forEach(button => { button.textContent = s.index === D.missions.length - 1 ? '回到第一条' : '下一条线索'; });
      $('gw-detective-pending').textContent = s.found.size === D.missions.length ? '全部再练' : '继续未完成';
      $('gw-tool-goal').textContent = `地理侦探 · 第 ${s.index + 1} / ${D.missions.length} 条 · ${s.mission.title}`;
      progress();
    }
    function begin(id) {
      round.select(id); highlight(''); overlay([]); $('gw-detective-answer').value = '';
      render(); feedback(round.state().mission.clue);
    }
    function guess(country, turn = false) {
      if (!active) return false;
      const result = round.guess(country), state = round.state();
      if (result === 'locked') return true;
      highlight(country || ''); if (country && turn) locate(country);
      render();
      if (result === 'correct') {
        try { localStorage.setItem(KEY, JSON.stringify([...state.found])); }
        catch { $('gw-detective-storage').textContent = '本次已记下，浏览器未能保存到下次。'; }
        feedback('找到啦！' + state.mission.explanation + (state.found.size === D.missions.length ? ' 全部线索都完成啦！' : ''), `找到了${name(state.mission.answer)}！下方有解析，也可以继续下一条。`);
        root.dispatchEvent(new CustomEvent('gm-world-answer',{detail:{kind:'detective',id:state.mission.id}}));
      } else if (result === 'ocean') feedback('这里没有点到国家陆地，转一转再找找；小国家也可以用下方列表作答。');
      else feedback(`你选了${name(country)}。再对照线索里的大洲、海洋或形状找找，也可以点「提示」。`, `你选了${name(country)}。再对照线索找找，或点「提示」。`);
      return true;
    }
    $('gw-detective-task').addEventListener('change', () => begin($('gw-detective-task').value));
    $('gw-detective-form').addEventListener('submit', event => {
      event.preventDefault();
      const id = $('gw-detective-answer').value;
      if (!id) { feedback('先从列表选择一个国家，再提交答案。'); return; }
      guess(id, true);
    });
    hintButtons.forEach(button => button.addEventListener('click', () => {
      const s = round.hint(); render(); feedback(s.mission.hints[s.hints - 1] || s.mission.clue);
    }));
    nextButtons.forEach(button => button.addEventListener('click', () => begin(D.missions[(round.state().index + 1) % D.missions.length].id)));
    $('gw-detective-retry').addEventListener('click', () => begin(round.state().mission.id));
    $('gw-detective-pending').addEventListener('click', () => { round.resume(); begin(round.state().mission.id); });
    $('gw-detective-reveal').addEventListener('click', () => {
      round.reveal(); const s = round.state(); highlight(s.mission.answer); locate(s.mission.answer); render();
      root.dispatchEvent(new CustomEvent('gm-world-answer',{detail:{kind:'detective',id:s.mission.id,revealed:true}}));
      feedback(`答案是${name(s.mission.answer)}。${s.mission.explanation}这次查看不计入找到记录，可点「重新挑战」再找一次。`, `答案是${name(s.mission.answer)}。查看不计入完成，可在下方重新挑战。`);
    });
    $('gw-detective-learn').addEventListener('click', () => {
      if (round.state().status === 'asking') return;
      choose(round.state().mission.learnPlace); $('gw-profile').scrollIntoView({block: 'center'});
    });
    function setActive(value) {
      active = value; $('gw-detective-inline').hidden = !value;
      if (value) { round.resume(); begin(round.state().mission.id); }
      else highlight('');
    }
    return {setActive, guess,startTimed:()=>begin(D.missions[0].id)};
  }
  function mountProgress({root, open}) {
    const tracks = [
      {kind: 'quiz', key: 'study_world_globe_mastered_v1', entries: window.GM_WORLD_LEARNING.questions},
      {kind: 'hunt', key: 'study_world_globe_hunts_v1', entries: window.GM_WORLD_TOOLS.missions},
      {kind: 'detective', key: KEY, entries: window.GM_WORLD_DETECTIVE.missions}
    ];
    const progress = new Map();
    for (const track of tracks) {
      let raw = null; try { raw = localStorage.getItem(track.key); } catch { /* 本页事件仍能更新记录。 */ }
      progress.set(track.kind, window.GMWorldLearning.readProgress(raw, track.entries));
    }
    function render() {
      for (const t of tracks) {
        const count = progress.get(t.kind).size;
        root.querySelector(`#gw-record-${t.kind}`).textContent = `${count} / ${t.entries.length}`;
        const bar = root.querySelector(`#gw-record-${t.kind}-bar`); bar.max = t.entries.length; bar.value = count;
        root.querySelector(`[data-record-open="${t.kind}"]`).textContent = count === t.entries.length ? '全部完成，再练一轮 →' : '继续探索 →';
      }
    }
    root.addEventListener('gm-world-progress', event => {
      const track = tracks.find(t => t.kind === event.detail?.kind); if (!track) return;
      progress.set(track.kind, window.GMWorldLearning.readProgress(JSON.stringify(event.detail.ids), track.entries)); render();
    });
    root.querySelector('#gw-records').addEventListener('click', event => { const b = event.target.closest('[data-record-open]'); if (b) open(b.dataset.recordOpen); });
    render();
  }
  return {createRound, mount, mountProgress};
})();

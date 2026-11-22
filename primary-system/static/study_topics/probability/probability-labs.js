/* 概率乐园实验台：掷骰模拟器、调查生成器、蒙特卡洛估 π、反直觉查证台。
   掷骰与撒点按批次动画推进，遵守统一动效偏好；计算函数供 Node 回归测试。 */
'use strict';
(() => {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const data = typeof PROB_LABS !== 'undefined' ? PROB_LABS :
    typeof module !== 'undefined' && typeof require === 'function' ? require('./probability-labs-data.js') : null;

  /* ---------- 纯计算（Node 可测） ---------- */
  function rollDie(rng = Math.random) { return 1 + Math.floor(rng() * 6); }
  function rollSum(rng = Math.random) { return rollDie(rng) + rollDie(rng); }
  function applyRolls(counts, n, mode, rng = Math.random) {
    const roll = mode === 'two' ? rollSum : rollDie;
    const min = mode === 'two' ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const index = roll(rng) - min;
      counts[index] = (counts[index] || 0) + 1;
    }
    return counts;
  }
  function piEstimate(inside, total) { return total ? 4 * inside / total : 0; }
  function cleanProgress(raw, questions) {
    const clean = {};
    if (!raw || typeof raw !== 'object') return clean;
    questions.forEach(q => {
      const r = raw[q.id];
      if (r && [r.first, r.last].every(n => Number.isInteger(n) && n >= 0 && n < q.options.length)) clean[q.id] = {first: r.first, last: r.last};
    });
    return clean;
  }
  if (typeof module !== 'undefined') { module.exports = {rollDie, rollSum, applyRolls, piEstimate, cleanProgress}; return; }

  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canPlay = () => !media.matches && (!window.StudyEffects || window.StudyEffects.motion === 'full');
  const records = new Map();

  function load(key, fallback) {
    try {
      const raw = JSON.parse(localStorage.getItem(key) || 'null');
      return raw || fallback;
    } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  /* ---------- 共用柱状图 ---------- */
  function barChart({labels, counts, total, expected, highlight = -1}) {
    const slot = 640 / labels.length, barW = slot - 14, base = 252, top = 46;
    const maxCount = Math.max(1, ...counts, ...expected);
    const h = n => (base - top) * n / maxCount;
    const bars = labels.map((label, i) => {
      const x = i * slot + 7, bh = h(counts[i] || 0);
      const eh = h(expected[i] || 0);
      const pct = total ? ((counts[i] || 0) / total * 100).toFixed(1) + '%' : '—';
      return `<rect x="${x}" y="${base - bh}" width="${barW}" height="${bh}" rx="6" fill="${i === highlight ? '#157d73' : '#4d96ff'}" opacity="${i === highlight ? .95 : .8}"/>` +
        `<line x1="${x - 3}" y1="${base - eh}" x2="${x + barW + 3}" y2="${base - eh}" stroke="#d97745" stroke-width="2.5" stroke-dasharray="6 4"/>` +
        `<text x="${x + barW / 2}" y="${base - bh - 8}" font-size="11" font-weight="700" text-anchor="middle" fill="#34384d">${pct}</text>` +
        `<text x="${x + barW / 2}" y="${base + 22}" font-size="13" font-weight="700" text-anchor="middle" fill="${i === highlight ? '#157d73' : '#73788b'}">${label}</text>`;
    }).join('');
    const expectedNote = total ? `<text x="628" y="${top - 6}" font-size="12" fill="#d97745" text-anchor="end">— 虚线为理论值</text>` : '';
    return `<svg class="fig-svg" viewBox="0 0 640 292" role="img" aria-label="频率柱状图，虚线为理论值">` +
      `<line x1="8" y1="${base}" x2="632" y2="${base}" stroke="#8497a9" stroke-width="2"/>` + bars + expectedNote + '</svg>';
  }

  /* ---------- 掷骰模拟器 ---------- */
  const diceState = fig => {
    const rec = records.get(fig);
    return rec && rec.kind === 'dice' ? rec : null;
  };
  function diceCounts(mode) {
    const saved = load(data.dice.storeKey, {});
    const size = mode === 'two' ? 11 : 6;
    const list = saved[mode];
    return Array.isArray(list) && list.length === size ? list.map(n => Number(n) || 0) : new Array(size).fill(0);
  }
  function diceTotal(counts) { return counts.reduce((a, b) => a + b, 0); }

  function diceHTML() {
    return `<section class="prob-lab" data-prob-lab="dice" aria-label="模拟掷骰台">` +
      `<p class="prob-lab-note">🎲 ${esc(data.dice.note)}</p>` +
      `<div class="fig-ctrl prob-lab-modes">${data.dice.modes.map(m => `<button type="button" class="fig-btn" data-dice-act="mode" data-mode="${m.id}" aria-pressed="false">${esc(m.name)}</button>`).join('')}</div>` +
      `<div class="fig-ctrl">${data.dice.batches.map(b => `<button type="button" class="fig-btn" data-dice-act="roll" data-batch="${b.id}">${esc(b.name)}</button>`).join('')}` +
      `<button type="button" class="fig-btn" data-dice-act="reset">清零重掷</button></div>` +
      `<div class="prob-lab-stage" data-dice-chart aria-live="polite"></div>` +
      `<p class="prob-lab-status" data-dice-status role="status"></p>` +
      `</section>`;
  }

  function diceDraw(rec) {
    const mode = data.dice.modes.find(m => m.id === rec.mode);
    const faces = mode.faces, counts = rec.counts, total = diceTotal(counts);
    const expected = faces.map(f => mode.theory(f) * total);
    rec.root.querySelector('[data-dice-chart]').innerHTML = barChart({
      labels: faces.map(String), counts, total, expected,
      highlight: rec.mode === 'two' ? faces.indexOf(7) : -1,
    });
    rec.root.querySelectorAll('[data-dice-act="mode"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === rec.mode)));
    const status = rec.root.querySelector('[data-dice-status]');
    if (rec.running) { status.textContent = `正在掷第 ${total + 1} 次左右……（共 ${rec.pending} 次待掷）`; return; }
    if (!total) { status.textContent = '选一种骰子，按「掷 10 次」开始——次数越多，柱形越稳。'; return; }
    const answer = mode.answerNote;
    status.textContent = `已掷 ${total} 次 · ${answer}`;
  }

  function diceRoll(rec, batch) {
    if (rec.running) return;
    rec.pending = batch;
    if (!canPlay() || document.hidden) { finishDice(rec, batch); return; }
    rec.running = true;
    const chunk = Math.max(1, Math.ceil(batch / 32));
    const token = ++rec.token;
    const tick = () => {
      if (token !== rec.token || !rec.fig.isConnected || document.hidden || !canPlay()) {
        if (rec.running) finishDice(rec, rec.pending);
        return;
      }
      const step = Math.min(chunk, rec.pending);
      applyRolls(rec.counts, step, rec.mode);
      rec.pending -= step;
      diceDraw(rec);
      if (rec.pending > 0) rec.frame = window.requestAnimationFrame(tick);
      else { rec.running = false; persistDice(rec); diceDraw(rec); }
    };
    rec.frame = window.requestAnimationFrame(tick);
  }
  function finishDice(rec, batch) {
    applyRolls(rec.counts, batch, rec.mode);
    rec.pending = 0; rec.running = false;
    persistDice(rec);
    diceDraw(rec);
  }
  function persistDice(rec) {
    const saved = load(data.dice.storeKey, {});
    saved[rec.mode] = rec.counts;
    save(data.dice.storeKey, saved);
  }

  /* ---------- 调查生成器 ---------- */
  function surveyState(tplId) {
    const all = load(data.survey.storeKey, {});
    const s = all[tplId] || {};
    const tpl = data.survey.templates.find(t => t.id === tplId) || data.survey.templates[0];
    const tallies = {};
    tpl.options.forEach(o => { tallies[o.id] = Number(s.tallies?.[o.id]) || 0; });
    const history = Array.isArray(s.history) ? s.history.slice(-200) : [];
    return {tallies, history};
  }
  function persistSurvey(tplId, state) {
    const all = load(data.survey.storeKey, {});
    all[tplId] = {tallies: state.tallies, history: state.history.slice(-200)};
    save(data.survey.storeKey, all);
  }

  function surveyHTML() {
    return `<section class="prob-lab" data-prob-lab="survey" aria-label="小调查生成器">` +
      `<p class="prob-lab-note">📋 ${esc(data.survey.note)}</p>` +
      `<div class="fig-ctrl">${data.survey.templates.map((t, i) => `<button type="button" class="fig-btn" data-survey-act="tpl" data-tpl="${t.id}" aria-pressed="${i === 0}">${esc(t.question)}</button>`).join('')}</div>` +
      `<div data-survey-body></div>` +
      `</section>`;
  }

  function surveyDraw(rec) {
    const tpl = data.survey.templates.find(t => t.id === rec.tpl);
    rec.root.querySelectorAll('[data-survey-act="tpl"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tpl === rec.tpl)));
    const body = rec.root.querySelector('[data-survey-body]');
    const counts = tpl.options.map(o => rec.tallies[o.id] || 0);
    const total = counts.reduce((a, b) => a + b, 0);
    const maxIndex = counts.indexOf(Math.max(...counts));
    const labels = tpl.options.map(o => `${o.emoji} ${o.name}`);
    body.innerHTML =
      `<div class="fig-ctrl prob-survey-buttons">${tpl.options.map(o =>
        `<button type="button" class="fig-btn prob-vote" data-survey-act="vote" data-opt="${o.id}">${o.emoji} ${esc(o.name)} ＋1</button>`).join('')}` +
      `<button type="button" class="fig-btn" data-survey-act="undo"${rec.history.length ? '' : ' disabled'}>撤销上一票</button>` +
      `<button type="button" class="fig-btn" data-survey-act="clear"${total ? '' : ' disabled'}>清空本题</button></div>` +
      barChart({labels, counts, total, expected: counts.map(c => c), highlight: total ? maxIndex : -1}) +
      `<p class="prob-lab-status" role="status">${total ? `共 ${total} 票 · 最多的是「${esc(tpl.options[maxIndex].name)}」${counts[maxIndex]} 票（${(counts[maxIndex] / total * 100).toFixed(1)}%）` : '按一次「＋1」记一票——把家人同学的真实回答记进来。'}</p>` +
      `<p class="prob-survey-shares">占比：${total ? tpl.options.map(o => `${esc(o.name)} ${(rec.tallies[o.id] || 0)}/${total}＝${((rec.tallies[o.id] || 0) / total * 100).toFixed(1)}%`).join(' · ') : '还没有票。'}</p>`;
  }

  function surveyAct(rec, button) {
    const act = button.dataset.surveyAct;
    if (act === 'tpl') { rec.tpl = button.dataset.tpl; [rec.tallies, rec.history] = [surveyState(rec.tpl).tallies, surveyState(rec.tpl).history]; }
    else if (act === 'vote') {
      const opt = button.dataset.opt;
      rec.tallies[opt] = (rec.tallies[opt] || 0) + 1;
      rec.history.push(opt);
    } else if (act === 'undo') {
      const last = rec.history.pop();
      if (last) rec.tallies[last] = Math.max(0, (rec.tallies[last] || 0) - 1);
    } else if (act === 'clear') { rec.tallies = {}; rec.history = []; }
    persistSurvey(rec.tpl, rec);
    surveyDraw(rec);
  }

  /* ---------- 蒙特卡洛估 π ---------- */
  function piState() {
    const s = load(data.pi.storeKey, {});
    let dots = Array.isArray(s.dots) ? s.dots.filter(d => Array.isArray(d) && d.length === 2 && [d[0], d[1]].every(n => n >= 0 && n <= 1)) : [];
    dots = dots.slice(-data.pi.drawCap);
    const total = Number(s.total) || 0, inside = Number(s.inside) || 0;
    /* 旧版本可能留下圆内多于总点的坏档：宁可清零重撒，也不展示不可能的占比。 */
    if (inside > total || total < dots.length) return {total: 0, inside: 0, dots: []};
    return {total, inside, dots};
  }
  const persistPi = rec => save(data.pi.storeKey, {total: rec.total, inside: rec.inside, dots: rec.dots.slice(-data.pi.drawCap)});

  function piHTML() {
    return `<section class="prob-lab" data-prob-lab="pi" aria-label="蒙特卡洛估 π 实验台">` +
      `<p class="prob-lab-note">🥧 ${esc(data.pi.note)}</p>` +
      `<div class="fig-ctrl">${data.pi.batches.map(b => `<button type="button" class="fig-btn" data-pi-act="drop" data-batch="${b.id}">${esc(b.name)}</button>`).join('')}` +
      `<button type="button" class="fig-btn" data-pi-act="reset">清零重撒</button></div>` +
      `<div class="prob-pi-stage"><canvas data-pi-canvas width="320" height="320" role="img" aria-label="正方形与四分之一圆，随机撒点示意"></canvas>` +
      `<div class="prob-pi-figures" data-pi-stats aria-live="polite"></div></div>` +
      `<p class="prob-lab-status" data-pi-status role="status"></p>` +
      `</section>`;
  }

  function piDrawCanvas(rec) {
    const canvas = rec.root.querySelector('[data-pi-canvas]');
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#eef7fd';
    ctx.fillRect(0, 0, size, size);
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.arc(0, size, size, Math.PI, Math.PI * 1.5);
    ctx.closePath();
    ctx.fillStyle = 'rgba(21,125,115,.14)';
    ctx.fill();
    ctx.strokeStyle = '#157d73';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    for (const [x, y] of rec.dots) {
      const px = x * size, py = (1 - y) * size;
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = x * x + y * y <= 1 ? '#157d73' : '#d97745';
      ctx.fill();
    }
  }

  function piDraw(rec) {
    piDrawCanvas(rec);
    const est = piEstimate(rec.inside, rec.total);
    rec.root.querySelector('[data-pi-stats]').innerHTML =
      `<p class="prob-pi-line">总点数 <b>${rec.total}</b> · 圆内 <b>${rec.inside}</b> · 占比 <b>${rec.total ? (rec.inside / rec.total * 100).toFixed(1) + '%' : '—'}</b></p>` +
      `<p class="prob-pi-estimate">π ≈ 4 × ${rec.total ? (rec.inside / rec.total).toFixed(4) : '0.785'} ＝ <output>${rec.total ? est.toFixed(4) : '—'}</output></p>` +
      `<p class="prob-pi-truth">真值 3.1416 · 偏差 ${rec.total ? Math.abs(est - Math.PI).toFixed(4) : '—'}</p>`;
    const status = rec.root.querySelector('[data-pi-status]');
    if (rec.running) status.textContent = `正在撒点……还剩 ${rec.pending} 个`;
    else if (!rec.total) status.textContent = '按「撒 10 点」开始——点越多，估计越稳。';
    else status.textContent = rec.total < 100 ? '点还少，估计晃得厉害——继续加大数量。' : '点数上千后，估计稳定在 3.1 附近——这就是频率收敛。';
  }

  function piDrop(rec, batch) {
    if (rec.running) return;
    rec.pending = batch;
    if (!canPlay() || document.hidden) { finishPi(rec, batch); return; }
    rec.running = true;
    const chunk = Math.max(1, Math.ceil(batch / 32));
    const token = ++rec.token;
    const tick = () => {
      if (token !== rec.token || !rec.fig.isConnected || document.hidden || !canPlay()) {
        if (rec.running) finishPi(rec, rec.pending);
        return;
      }
      const step = Math.min(chunk, rec.pending);
      for (let i = 0; i < step; i++) {
        const x = Math.random(), y = Math.random();
        if (x * x + y * y <= 1) rec.inside += 1;
        rec.total += 1;
        rec.dots.push([Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000]);
      }
      if (rec.dots.length > data.pi.drawCap) rec.dots = rec.dots.slice(-data.pi.drawCap);
      rec.pending -= step;
      piDraw(rec);
      if (rec.pending > 0) rec.frame = window.requestAnimationFrame(tick);
      else { rec.running = false; persistPi(rec); piDraw(rec); }
    };
    rec.frame = window.requestAnimationFrame(tick);
  }
  function finishPi(rec, batch) {
    for (let i = 0; i < batch; i++) {
      const x = Math.random(), y = Math.random();
      if (x * x + y * y <= 1) rec.inside += 1;
      rec.total += 1;
      rec.dots.push([Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000]);
    }
    if (rec.dots.length > data.pi.drawCap) rec.dots = rec.dots.slice(-data.pi.drawCap);
    rec.pending = 0; rec.running = false;
    persistPi(rec);
    piDraw(rec);
  }

  /* ---------- 反直觉查证台 ---------- */
  function quizHTML() {
    return `<section class="prob-lab" data-prob-lab="quiz" aria-label="反直觉查证台">` +
      `<p class="prob-lab-note">🌀 ${esc(data.myths.note)}</p>` +
      `<p class="prob-quiz-progress" role="status"></p>` +
      `<div class="prob-quiz-questions">${data.myths.questions.map((q, i) =>
        `<fieldset data-question="${esc(q.id)}"><legend>${i + 1}．${esc(q.question)}</legend>` +
        `<div class="prob-quiz-options">${q.options.map((s, n) => `<button type="button" data-answer="${n}" aria-pressed="false">${esc(s)}</button>`).join('')}</div>` +
        `<p class="prob-quiz-feedback" aria-live="polite"></p>` +
        `<a href="${esc(q.link)}">回课文找线索 ↑</a></fieldset>`).join('')}</div>` +
      `</section>`;
  }

  function quizDraw(rec) {
    const {root, progress} = rec;
    data.myths.questions.forEach(q => {
      const field = root.querySelector(`[data-question="${q.id}"]`);
      const r = progress[q.id];
      field.querySelectorAll('[data-answer]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.answer) === r?.last)));
      field.querySelector('.prob-quiz-feedback').textContent = r ? `${r.last === q.answer ? '答对了。' : '再查证一下。'}${q.explanation}` : '';
      field.dataset.result = r ? (r.last === q.answer ? 'correct' : 'retry') : '';
    });
    const attempted = data.myths.questions.filter(q => progress[q.id]);
    const first = attempted.filter(q => progress[q.id].first === q.answer).length;
    const correct = attempted.filter(q => progress[q.id].last === q.answer).length;
    root.querySelector('.prob-quiz-progress').textContent = `已尝试 ${attempted.length}／${data.myths.questions.length} 题 · 首次答对 ${first} 题 · 当前答对 ${correct} 题。${rec.persist ? '记录仅保存在当前浏览器。' : '浏览器暂时不能保存，当前页面仍可继续练习。'}`;
  }

  /* ---------- 挂载与清理 ---------- */
  function mount(fig) {
    if (!data || records.has(fig)) return;
    const root = fig.matches?.('.prob-lab') ? fig : fig.querySelector('[data-prob-lab]');
    if (!root) return;
    const kind = root.dataset.probLab;
    let rec = null;
    if (kind === 'dice') {
      rec = {kind, fig, root, mode: 'one', counts: diceCounts('one'), pending: 0, running: false, token: 0, frame: null};
    } else if (kind === 'survey') {
      const init = surveyState(data.survey.templates[0].id);
      rec = {kind, fig, root, tpl: data.survey.templates[0].id, tallies: init.tallies, history: init.history};
    } else if (kind === 'pi') {
      rec = {kind, fig, root, ...piState(), pending: 0, running: false, token: 0, frame: null};
    } else if (kind === 'quiz') {
      let progress = {}, persist = true;
      try { progress = cleanProgress(JSON.parse(localStorage.getItem(data.myths.storeKey)), data.myths.questions); } catch (e) { progress = {}; }
      rec = {kind, fig, root, progress, persist};
    } else return;
    records.set(fig, rec);

    rec.click = event => {
      const button = event.target.closest('[data-dice-act],[data-survey-act],[data-pi-act],[data-answer]');
      if (!button || button.disabled) return;
      if (button.dataset.diceAct === 'mode') { stop(rec); rec.mode = button.dataset.mode; rec.counts = diceCounts(rec.mode); diceDraw(rec); }
      else if (button.dataset.diceAct === 'roll') diceRoll(rec, Number(button.dataset.batch));
      else if (button.dataset.diceAct === 'reset') { stop(rec); rec.counts = new Array(rec.counts.length).fill(0); persistDice(rec); diceDraw(rec); }
      else if (button.dataset.surveyAct) surveyAct(rec, button);
      else if (button.dataset.piAct === 'drop') piDrop(rec, Number(button.dataset.batch));
      else if (button.dataset.piAct === 'reset') { stop(rec); rec.total = rec.inside = 0; rec.dots = []; persistPi(rec); piDraw(rec); }
      else if (button.dataset.answer) {
        const q = data.myths.questions.find(q => q.id === button.closest('[data-question]').dataset.question);
        const answer = Number(button.dataset.answer);
        rec.progress[q.id] = {first: rec.progress[q.id]?.first ?? answer, last: answer};
        try { localStorage.setItem(data.myths.storeKey, JSON.stringify(rec.progress)); } catch (e) { rec.persist = false; }
        quizDraw(rec);
      }
    };
    root.addEventListener('click', rec.click);
    if (rec.kind === 'dice') diceDraw(rec);
    else if (rec.kind === 'survey') surveyDraw(rec);
    else if (rec.kind === 'pi') piDraw(rec);
    else quizDraw(rec);
    if (rec.kind === 'dice' || rec.kind === 'pi') {
      if (window.StudyEffects?.watch) rec.unwatch = window.StudyEffects.watch(fig, () => stop(rec));
      else if (typeof IntersectionObserver === 'function') {
        const observer = new IntersectionObserver(entries => { if (entries.some(entry => !entry.isIntersecting)) stop(rec); });
        observer.observe(fig);
        rec.unwatch = () => observer.disconnect();
      }
    }
  }
  function stop(rec) {
    if (!rec || !rec.running) return;
    if (rec.frame !== null) window.cancelAnimationFrame(rec.frame);
    rec.frame = null;
    finishBatch(rec);
  }
  function finishBatch(rec) {
    if (rec.kind === 'dice' && rec.pending > 0) { applyRolls(rec.counts, rec.pending, rec.mode); rec.pending = 0; rec.running = false; persistDice(rec); diceDraw(rec); }
    if (rec.kind === 'pi' && rec.pending > 0) { finishPi(rec, rec.pending); }
  }
  function pause(fig) {
    for (const [target, rec] of records) {
      if (fig && target !== fig) continue;
      stop(rec);
    }
  }
  function remove(fig, rec) {
    stop(rec);
    rec.unwatch?.();
    rec.root.removeEventListener('click', rec.click);
    records.delete(fig);
  }
  const dispose = () => { for (const [fig, rec] of records) remove(fig, rec); };
  const prune = () => { for (const [fig, rec] of records) if (!fig.isConnected) remove(fig, rec); };
  document.addEventListener('study:effects-change', () => records.forEach(rec => stop(rec)));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', () => pause());

  window.ProbabilityLabs = {
    diceHTML, surveyHTML, piHTML, quizHTML, mount, pause, dispose, prune,
    dice: {counts: diceCounts, total: diceTotal},
  };
})();

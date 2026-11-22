/* 计算乐园实验台：二进制开关台、排序实验台、二分查找台、分类器训练台。
   排序与二分按步动画推进，遵守统一动效偏好；纯计算函数供 Node 回归测试。 */
'use strict';
(() => {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const data = typeof COMPUTING_LABS !== 'undefined' ? COMPUTING_LABS :
    typeof module !== 'undefined' && typeof require === 'function' ? require('./computing-labs-data.js') : null;

  /* ---------- 纯计算（Node 可测） ---------- */
  /* bits[0] 是最高位（身价最大的开关）。 */
  function bitsToNumber(bits) {
    return bits.reduce((n, b) => n * 2 + (b ? 1 : 0), 0);
  }
  function numberToBits(n, width = 8) {
    const bits = [];
    for (let i = width - 1; i >= 0; i--) bits.push((n >> i) & 1);
    return bits;
  }
  function bubbleSortSteps(values) {
    const arr = values.slice();
    const steps = [];
    let swapped = true;
    let end = arr.length;
    while (swapped && end > 1) {
      swapped = false;
      for (let i = 0; i < end - 1; i++) {
        steps.push({kind: 'compare', i, j: i + 1, arr: arr.slice()});
        if (arr[i] > arr[i + 1]) {
          [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
          steps.push({kind: 'swap', i, j: i + 1, arr: arr.slice()});
          swapped = true;
        }
      }
      end--;
    }
    steps.push({kind: 'done', arr: arr.slice()});
    return steps;
  }
  function selectionSortSteps(values) {
    const arr = values.slice();
    const steps = [];
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
      let best = i;
      for (let j = i + 1; j < n; j++) {
        steps.push({kind: 'compare', i: best, j, arr: arr.slice()});
        if (arr[j] < arr[best]) best = j;
      }
      if (best !== i) {
        [arr[i], arr[best]] = [arr[best], arr[i]];
        steps.push({kind: 'swap', i, j: best, arr: arr.slice()});
      }
      steps.push({kind: 'fix', i, arr: arr.slice()});
    }
    steps.push({kind: 'done', arr: arr.slice()});
    return steps;
  }
  function binarySearchSteps(target, max = 100) {
    const steps = [];
    let lo = 1;
    let hi = max;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (mid === target) { steps.push({lo, hi, mid, hit: true}); break; }
      steps.push({lo, hi, mid, hit: false});
      if (mid < target) lo = mid + 1;
      else hi = mid - 1;
    }
    return steps;
  }
  function classifyAll(training, threshold) {
    return training.map(item => ({...item, predicted: item.sweet >= threshold ? 'apple' : 'lemon'}));
  }
  function accuracyOf(training, threshold) {
    return classifyAll(training, threshold).filter(item => item.predicted === item.label).length;
  }
  function bestThreshold(training, min = 1, max = 10) {
    let best = {threshold: min, correct: -1};
    for (let t = min; t <= max; t++) {
      const correct = accuracyOf(training, t);
      if (correct > best.correct) best = {threshold: t, correct};
    }
    return best;
  }
  /* 考试果子带一点重叠（苹果 5～10、柠檬 1～7），分界线附近自然会有错判。 */
  function examFruit(label, rng = Math.random) {
    const sweet = label === 'apple' ? 5 + Math.floor(rng() * 6) : 1 + Math.floor(rng() * 7);
    return {sweet, label, y: rng()};
  }
  if (typeof module !== 'undefined') {
    module.exports = {bitsToNumber, numberToBits, bubbleSortSteps, selectionSortSteps,
      binarySearchSteps, classifyAll, accuracyOf, bestThreshold, examFruit};
    return;
  }

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

  /* ---------- 二进制开关台 ---------- */
  function binaryState() {
    const s = load(data.binary.storeKey, {});
    const width = data.binary.width;
    let bits = Array.isArray(s.bits) && s.bits.length === width ? s.bits.map(b => (b ? 1 : 0)) : new Array(width).fill(0);
    const target = Number.isInteger(s.target) && s.target >= 1 && s.target < 2 ** width ? s.target : null;
    const solved = Number.isInteger(s.solved) && s.solved >= 0 ? s.solved : 0;
    return {bits, target, solved};
  }
  const persistBinary = rec => save(data.binary.storeKey, {bits: rec.bits, target: rec.target, solved: rec.solved});

  function binaryHTML() {
    return `<section class="cp-lab" data-cp-lab="binary" aria-label="二进制开关台">` +
      `<p class="cp-lab-note">💡 ${esc(data.binary.note)}</p>` +
      `<div class="cp-bit-row">${Array.from({length: data.binary.width}, (_, i) => {
        const weight = 2 ** (data.binary.width - 1 - i);
        return `<button type="button" class="cp-bit" data-binary-act="toggle" data-index="${i}" aria-pressed="false">` +
          `<span class="cp-bit-weight">${weight}</span><span class="cp-bit-value">0</span></button>`;
      }).join('')}</div>` +
      `<p class="cp-binary-readout">＝ <output data-binary-number aria-live="polite">0</output><span class="cp-binary-unit">（十进制）</span></p>` +
      `<div class="fig-ctrl"><button type="button" class="fig-btn" data-binary-act="challenge">摆数挑战</button>` +
      `<button type="button" class="fig-btn" data-binary-act="clear">全拨到 0</button>` +
      `<span class="cp-binary-goal" data-binary-goal role="status"></span></div>` +
      `<p class="cp-lab-status" data-binary-status role="status"></p>` +
      `</section>`;
  }

  function binaryDraw(rec) {
    const value = bitsToNumber(rec.bits);
    rec.root.querySelectorAll('.cp-bit').forEach((btn, i) => {
      btn.setAttribute('aria-pressed', String(!!rec.bits[i]));
      btn.querySelector('.cp-bit-value').textContent = rec.bits[i];
    });
    rec.root.querySelector('[data-binary-number]').textContent = value;
    const goal = rec.root.querySelector('[data-binary-goal]');
    goal.textContent = rec.target ? `🎯 目标：摆出 ${rec.target}` : (rec.solved ? `已解出 ${rec.solved} 个目标` : '');
    const status = rec.root.querySelector('[data-binary-status]');
    if (rec.flash) status.textContent = `🎉 摆对了！${rec.flash} ＝ ${numberToBits(rec.flash, data.binary.width).join('')}，身价加起来正好。再来一个？`;
    else if (rec.target) status.textContent = `当前是 ${value}，离目标 ${rec.target} 还差 ${Math.abs(rec.target - value)}——先动大身价的开关试试。`;
    else if (value) status.textContent = `${value} 的二进制是 ${numberToBits(value, data.binary.width).join('')}。按「摆数挑战」考考自己。`;
    else status.textContent = '拨拨看：右边的开关身价小，左边的身价大——上面的大数字会跟着变。';
  }

  function binaryAct(rec, button) {
    const act = button.dataset.binaryAct;
    if (act === 'toggle') {
      const i = Number(button.dataset.index);
      rec.bits[i] = rec.bits[i] ? 0 : 1;
      const value = bitsToNumber(rec.bits);
      if (rec.target && value === rec.target) { rec.solved += 1; rec.flash = rec.target; rec.target = null; }
      else rec.flash = false;
    } else if (act === 'challenge') {
      const max = 2 ** data.binary.width - 1;
      let target = 1 + Math.floor(Math.random() * max);
      if (target === bitsToNumber(rec.bits)) target = target % max + 1;
      rec.target = target;
      rec.flash = false;
    } else {
      rec.bits = new Array(data.binary.width).fill(0);
      rec.flash = false;
    }
    persistBinary(rec);
    binaryDraw(rec);
  }

  /* ---------- 排序实验台 ---------- */
  function shuffledBars(count, maxValue) {
    const pool = Array.from({length: maxValue}, (_, i) => i + 1);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  }
  function sortSteps(algo, values) {
    return algo === 'selection' ? selectionSortSteps(values) : bubbleSortSteps(values);
  }

  function sortHTML() {
    return `<section class="cp-lab" data-cp-lab="sort" aria-label="排序实验台">` +
      `<p class="cp-lab-note">📊 ${esc(data.sort.note)}</p>` +
      `<div class="fig-ctrl">${data.sort.algorithms.map((a, i) =>
        `<button type="button" class="fig-btn" data-sort-act="algo" data-algo="${a.id}" aria-pressed="${i === 0}">${esc(a.name)}</button>`).join('')}</div>` +
      `<div class="fig-ctrl"><button type="button" class="fig-btn" data-sort-act="step">走一步</button>` +
      `<button type="button" class="fig-btn" data-sort-act="play">自动播放</button>` +
      `<button type="button" class="fig-btn" data-sort-act="shuffle">打乱重排</button></div>` +
      `<div class="cp-lab-stage" data-sort-stage aria-live="polite"></div>` +
      `<p class="cp-lab-status" data-sort-status role="status"></p>` +
      `</section>`;
  }

  function sortDraw(rec) {
    /* idx 表示已执行的步数：显示最后一步执行后的状态，计数与画面一致。 */
    const applied = rec.idx > 0;
    const step = applied ? rec.steps[rec.idx - 1] : rec.steps[0];
    const arr = (step || {arr: rec.values.slice()}).arr;
    const slot = 640 / arr.length;
    const barW = slot - 16;
    const base = 262;
    const unit = (base - 60) / data.sort.maxValue;
    const active = step && (step.kind === 'compare' || step.kind === 'swap') ? step : null;
    const bars = arr.map((v, i) => {
      const settled = step && step.kind === 'fix' && i <= step.i;
      const color = active && (i === active.i || i === active.j)
        ? (step.kind === 'swap' ? '#e0526d' : '#e6b23c')
        : (settled || (step && step.kind === 'done') ? '#2fbf71' : '#4d96ff');
      const label = settled || (step && step.kind === 'done') ? '✓' : '';
      return `<rect x="${(i * slot + 8).toFixed(1)}" y="${(base - v * unit).toFixed(1)}" width="${barW}" height="${(v * unit).toFixed(1)}" rx="7" fill="${color}" opacity=".88"/>` +
        `<text x="${(i * slot + 8 + barW / 2).toFixed(1)}" y="${(base - v * unit - 8).toFixed(1)}" font-size="14" font-weight="800" text-anchor="middle" fill="#34384d">${v}${label}</text>`;
    }).join('');
    rec.root.querySelector('[data-sort-stage]').innerHTML =
      `<svg class="fig-svg" viewBox="0 0 640 292" role="img" aria-label="排序柱状图，高亮刚比较或交换的两根">` +
      `<line x1="8" y1="${base}" x2="632" y2="${base}" stroke="#8497a9" stroke-width="2"/>` + bars + '</svg>';
    rec.root.querySelectorAll('[data-sort-act="algo"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.algo === rec.algo)));
    const status = rec.root.querySelector('[data-sort-status]');
    const counts = `比较 ${rec.compares} 次 · 交换 ${rec.swaps} 次`;
    const total = rec.steps.length;
    if (!applied) status.textContent = step ? `按「走一步」开始——第一步：比较第 ${step.i + 1} 和第 ${step.j + 1} 根。（比较 0 次 · 交换 0 次）` : '按「走一步」开始。';
    else if (step.kind === 'done') status.textContent = `🎉 排好队了！${counts}——换另一种算法用同样的数字比一比。`;
    else if (step.kind === 'compare') status.textContent = `第 ${rec.idx}／${total} 步：比较第 ${step.i + 1} 和第 ${step.j + 1} 根——${counts}`;
    else if (step.kind === 'swap') status.textContent = `第 ${rec.idx}／${total} 步：交换第 ${step.i + 1} 和第 ${step.j + 1} 根！——${counts}`;
    else if (step.kind === 'fix') status.textContent = `第 ${rec.idx}／${total} 步：第 ${step.i + 1} 位放定了 ✓ ${counts}`;
    else status.textContent = counts;
  }

  function sortFinish(rec) {
    rec.idx = rec.steps.length;
    rec.playing = false;
    if (rec.timer) { window.clearTimeout(rec.timer); rec.timer = null; }
    sortDraw(rec);
  }
  function sortStep(rec) {
    if (rec.idx >= rec.steps.length) { sortFinish(rec); return; }
    const step = rec.steps[rec.idx];
    if (step.kind === 'compare') rec.compares += 1;
    if (step.kind === 'swap') rec.swaps += 1;
    rec.idx += 1;
    sortDraw(rec);
  }
  function sortPlay(rec) {
    if (rec.playing) return;
    if (!canPlay() || document.hidden) { sortFinish(rec); return; }
    rec.playing = true;
    const token = ++rec.token;
    const tick = () => {
      if (token !== rec.token || !rec.fig.isConnected || document.hidden || !canPlay()) { sortFinish(rec); return; }
      if (rec.idx >= rec.steps.length) { rec.playing = false; sortDraw(rec); return; }
      sortStep(rec);
      rec.timer = window.setTimeout(tick, data.sort.stepMs);
    };
    tick();
  }
  function sortReset(rec) {
    if (rec.timer) { window.clearTimeout(rec.timer); rec.timer = null; }
    rec.playing = false;
    rec.token += 1;
    rec.values = shuffledBars(data.sort.bars, data.sort.maxValue);
    rec.steps = sortSteps(rec.algo, rec.values);
    rec.idx = 0;
    rec.compares = 0;
    rec.swaps = 0;
    sortDraw(rec);
  }

  /* ---------- 二分查找台 ---------- */
  function searchState() {
    const s = load(data.search.storeKey, {});
    const target = Number.isInteger(s.target) && s.target >= data.search.min && s.target <= data.search.max ? s.target : 50;
    return {target};
  }
  const persistSearch = rec => save(data.search.storeKey, {target: rec.target});

  function searchHTML() {
    return `<section class="cp-lab" data-cp-lab="search" aria-label="二分查找台">` +
      `<p class="cp-lab-note">🔍 ${esc(data.search.note)}</p>` +
      `<div class="fig-label">目标数：<output data-search-target aria-live="polite">${initialSearchTarget()}</output>（拖动挑选，电脑看不见它）</div>` +
      `<input type="range" class="fig-range" data-search-range min="${data.search.min}" max="${data.search.max}" value="${initialSearchTarget()}" aria-label="选择 1 到 100 之间的目标数">` +
      `<div class="fig-ctrl"><button type="button" class="fig-btn" data-search-act="run">开始找</button>` +
      `<button type="button" class="fig-btn" data-search-act="reset">重置</button></div>` +
      `<div class="cp-lab-stage" data-search-stage aria-live="polite"></div>` +
      `<p class="cp-lab-status" data-search-status role="status"></p>` +
      `</section>`;
  }
  function initialSearchTarget() { return searchState().target; }

  const searchX = value => 8 + (value - 1) / (data.search.max - 1) * 624;
  function searchDraw(rec, steps, idx) {
    const band = (a, b, color, opacity, label) => {
      const x0 = searchX(a), x1 = searchX(b);
      return `<rect x="${x0.toFixed(1)}" y="96" width="${(x1 - x0).toFixed(1)}" height="64" rx="8" fill="${color}" opacity="${opacity}"/>` +
        (label ? `<text x="${((x0 + x1) / 2).toFixed(1)}" y="134" font-size="15" font-weight="800" text-anchor="middle" fill="${color}">${label}</text>` : '');
    };
    const idle = idx < 0 ? band(data.search.min, data.search.max, '#4d96ff', .14, '1～100 待猜') : '';
    const ghosts = idx < 0 ? '' : steps.slice(0, idx + 1).map((s, k) => {
      const c = s.hit ? '#2fbf71' : '#4d96ff';
      return band(s.lo, s.hi, c, 0.14 + 0.05 * k, `第 ${k + 1} 轮 ${s.lo}～${s.hi}`);
    }).join('');
    const current = idx >= 0 ? steps[idx] : null;
    const pins = current ? `<line x1="${searchX(current.mid).toFixed(1)}" y1="88" x2="${searchX(current.mid).toFixed(1)}" y2="168" stroke="#d97745" stroke-width="4"/>` +
      `<circle cx="${searchX(current.mid).toFixed(1)}" cy="88" r="12" fill="#d97745"/>` +
      `<text x="${searchX(current.mid).toFixed(1)}" y="93" font-size="13" font-weight="800" text-anchor="middle" fill="#fff">${current.mid}</text>` : '';
    const ticks = [1, 25, 50, 75, 100].map(v =>
      `<line x1="${searchX(v).toFixed(1)}" y1="164" x2="${searchX(v).toFixed(1)}" y2="172" stroke="#8497a9" stroke-width="2"/>` +
      `<text x="${searchX(v).toFixed(1)}" y="190" font-size="12" font-weight="700" text-anchor="middle" fill="#73788b">${v}</text>`).join('');
    rec.root.querySelector('[data-search-stage]').innerHTML =
      `<svg class="fig-svg" viewBox="0 0 640 208" role="img" aria-label="二分查找：范围逐轮砍半，橙色指针是当前猜的数">` +
      `<line x1="8" y1="166" x2="632" y2="166" stroke="#8497a9" stroke-width="2"/>` + idle + ghosts + ticks + pins + '</svg>';
    const status = rec.root.querySelector('[data-search-status]');
    if (!steps.length) {
      status.textContent = '按「开始找」——电脑会一轮轮猜中间数，把范围砍半。';
      return;
    }
    if (idx < 0) { status.textContent = '已重置。再按「开始找」看一遍。'; return; }
    const s = steps[idx];
    const round = `第 ${idx + 1} 轮：猜 ${s.mid}`;
    if (s.hit) {
      const linear = `从头猜要 ${rec.target} 次（最坏情况），二分只用了 ${idx + 1} 次`;
      status.textContent = `🎯 ${round}，猜中了！${linear}——数据翻倍，二分只多猜一轮。`;
    } else if (idx === steps.length - 1) {
      status.textContent = `${round}——最后一轮范围只有 1 个数，必中。二分共 ${steps.length} 次。`;
    } else {
      status.textContent = `${round}——${s.mid < rec.target ? '猜小了，扔掉左半边' : '猜大了，扔掉右半边'}，剩下 ${s.lo}～${s.hi}。`;
    }
  }
  function searchFinish(rec) {
    if (rec.timer) { window.clearTimeout(rec.timer); rec.timer = null; }
    rec.running = false;
    searchDraw(rec, rec.steps, rec.steps.length - 1);
  }
  function searchRun(rec) {
    rec.steps = binarySearchSteps(rec.target, data.search.max);
    if (!rec.steps.length) return;
    if (!canPlay() || document.hidden || rec.steps.length === 1) { searchFinish(rec); return; }
    rec.running = true;
    let idx = 0;
    const token = ++rec.token;
    const tick = () => {
      if (token !== rec.token || !rec.fig.isConnected || document.hidden || !canPlay()) { searchFinish(rec); return; }
      searchDraw(rec, rec.steps, idx);
      if (idx >= rec.steps.length - 1) { rec.running = false; return; }
      idx += 1;
      rec.timer = window.setTimeout(tick, data.search.roundMs);
    };
    tick();
  }

  /* ---------- 分类器训练台 ---------- */
  function classifyState() {
    const s = load(data.classify.storeKey, {});
    let threshold = Number(s.threshold);
    if (!(threshold >= data.classify.thresholdMin && threshold <= data.classify.thresholdMax)) threshold = 6;
    const examTotal = Number.isInteger(s.examTotal) && s.examTotal >= 0 ? s.examTotal : 0;
    const examCorrect = Number.isInteger(s.examCorrect) && s.examCorrect >= 0 && s.examCorrect <= examTotal ? s.examCorrect : 0;
    return {threshold, examTotal, examCorrect};
  }
  const persistClassify = rec => save(data.classify.storeKey, {threshold: rec.threshold, examTotal: rec.examTotal, examCorrect: rec.examCorrect});

  function classifyHTML() {
    return `<section class="cp-lab" data-cp-lab="classify" aria-label="分类器训练台">` +
      `<p class="cp-lab-note">🍎 ${esc(data.classify.note)}</p>` +
      `<div class="cp-classify-stage"><canvas data-classify-canvas width="320" height="320" role="img" aria-label="果子按甜度摆开，分界线左边判柠檬、右边判苹果"></canvas>` +
      `<div class="cp-classify-figures" data-classify-stats aria-live="polite"></div></div>` +
      `<div class="fig-label">分界线（甜度阈值）：<output data-classify-threshold>${classifyState().threshold}</output>　左边判 🍋 · 右边判 🍎</div>` +
      `<input type="range" class="fig-range" data-classify-range min="${data.classify.thresholdMin}" max="${data.classify.thresholdMax}" value="${classifyState().threshold}" aria-label="调整甜度阈值">` +
      `<div class="fig-ctrl"><button type="button" class="fig-btn" data-classify-act="exam">考试：来 ${data.classify.examCount} 个新果子</button>` +
      `<button type="button" class="fig-btn" data-classify-act="reset">清空考试</button></div>` +
      `<p class="cp-lab-status" data-classify-status role="status"></p>` +
      `</section>`;
  }

  function classifyDrawCanvas(rec) {
    const canvas = rec.root.querySelector('[data-classify-canvas]');
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const xOf = sweet => 30 + (sweet - 1) / (data.classify.thresholdMax - 1) * (size - 60);
    const yOf = y => 30 + y * (size - 60);
    ctx.clearRect(0, 0, size, size);
    /* 阈值两侧的「判断区」底色 */
    const tx = xOf(rec.threshold);
    ctx.fillStyle = 'rgba(230,178,60,.14)';
    ctx.fillRect(0, 0, tx, size);
    ctx.fillStyle = 'rgba(226,85,99,.12)';
    ctx.fillRect(tx, 0, size - tx, size);
    ctx.strokeStyle = '#8b65c9';
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(tx, 0);
    ctx.lineTo(tx, size);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#73788b';
    ctx.font = '600 12px sans-serif';
    ctx.fillText('酸 ← 甜度 → 甜', size / 2 - 46, size - 6);
    /* 训练果子与考试果子 */
    const drawFruit = (fruit, wrong) => {
      const x = xOf(fruit.sweet), y = yOf(fruit.y);
      if (fruit.ring) {
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.strokeStyle = wrong ? '#e0526d' : '#2fbf71';
        ctx.lineWidth = 3.5;
        ctx.stroke();
      }
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fruit.label === 'apple' ? '🍎' : '🍋', x, y);
    };
    rec.training.forEach(f => drawFruit(f));
    rec.exam.forEach(f => drawFruit(f, f.predicted !== f.label));
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }

  function classifyDraw(rec) {
    classifyDrawCanvas(rec);
    const correct = accuracyOf(rec.training, rec.threshold);
    const stats = rec.root.querySelector('[data-classify-stats]');
    stats.innerHTML =
      `<p class="cp-classify-line">训练 12 个 · 分对 <b>${correct}</b>／12${correct === 12 ? ' 🎉 全对！' : '——再挪挪分界线'}</p>` +
      `<p class="cp-classify-line">规则：甜度 ≥ ${rec.threshold} 判苹果 🍎，否则判柠檬 🍋</p>` +
      `<p class="cp-classify-line">考试累计：答对 <b>${rec.examCorrect}</b>／${rec.examTotal}${rec.examTotal ? '' : '（还没考过）'}</p>`;
    rec.root.querySelector('[data-classify-threshold]').textContent = rec.threshold;
    const range = rec.root.querySelector('[data-classify-range]');
    if (Number(range.value) !== rec.threshold) range.value = rec.threshold;
    const status = rec.root.querySelector('[data-classify-status]');
    if (rec.exam.length && !rec.examDrawn) status.textContent = '新果子来了：带绿圈的猜对了，红圈猜错了——看看它们是不是都长在分界线附近？';
    else if (correct === 12) status.textContent = '训练全对！按「考试」来 5 个新果子——注意甜度 5～7 一带，规则最容易犹豫。';
    else status.textContent = '移动分界线，让 12 个训练果子全部分对——这就是「训练」：从例子里找到最好的规则。';
  }

  function classifyExam(rec) {
    const rng = Math.random;
    rec.exam = Array.from({length: data.classify.examCount}, () =>
      examFruit(rng() < 0.5 ? 'apple' : 'lemon', rng)).map(f => ({...f, predicted: f.sweet >= rec.threshold ? 'apple' : 'lemon'}));
    const correct = rec.exam.filter(f => f.predicted === f.label).length;
    rec.examTotal += data.classify.examCount;
    rec.examCorrect += correct;
    rec.examDrawn = true;
    persistClassify(rec);
    classifyDraw(rec);
    const status = rec.root.querySelector('[data-classify-status]');
    status.textContent = `考试结果：猜对 ${correct}／${data.classify.examCount}。${correct === data.classify.examCount ? '全对！再考一轮试试运气。' : '错的多在分界线附近——单看甜度，总有些果子说不清。'}`;
  }

  function classifyAct(rec, button) {
    const act = button.dataset.classifyAct;
    if (act === 'exam') classifyExam(rec);
    else {
      rec.exam = [];
      rec.examDrawn = false;
      persistClassify(rec);
      classifyDraw(rec);
    }
  }

  /* ---------- 挂载与清理 ---------- */
  function mount(fig) {
    if (!data || records.has(fig)) return;
    const root = fig.matches?.('[data-cp-lab]') ? fig : fig.querySelector('[data-cp-lab]');
    if (!root) return;
    const kind = root.dataset.cpLab;
    let rec = null;
    if (kind === 'binary') {
      rec = {kind, fig, root, ...binaryState(), flash: false};
    } else if (kind === 'sort') {
      rec = {kind, fig, root, algo: 'bubble', values: [], steps: [], idx: 0, compares: 0, swaps: 0, playing: false, token: 0, timer: null};
    } else if (kind === 'search') {
      rec = {kind, fig, root, ...searchState(), steps: [], running: false, token: 0, timer: null};
    } else if (kind === 'classify') {
      rec = {kind, fig, root, ...classifyState(), training: data.classify.training, exam: [], examDrawn: false};
    } else return;
    records.set(fig, rec);

    rec.click = event => {
      const button = event.target.closest('[data-binary-act],[data-sort-act],[data-search-act],[data-classify-act]');
      if (!button || button.disabled) return;
      if (button.dataset.binaryAct) binaryAct(rec, button);
      else if (button.dataset.sortAct === 'algo') {
        if (rec.timer) { window.clearTimeout(rec.timer); rec.timer = null; }
        rec.playing = false;
        rec.token += 1;
        rec.algo = button.dataset.algo;
        rec.steps = sortSteps(rec.algo, rec.values);
        rec.idx = 0;
        rec.compares = 0;
        rec.swaps = 0;
        sortDraw(rec);
      } else if (button.dataset.sortAct === 'step') sortStep(rec);
      else if (button.dataset.sortAct === 'play') sortPlay(rec);
      else if (button.dataset.sortAct === 'shuffle') sortReset(rec);
      else if (button.dataset.searchAct === 'run') { if (!rec.running) searchRun(rec); }
      else if (button.dataset.searchAct === 'reset') {
        if (rec.timer) { window.clearTimeout(rec.timer); rec.timer = null; }
        rec.running = false;
        rec.token += 1;
        rec.steps = [];
        searchDraw(rec, rec.steps, -1);
      } else if (button.dataset.classifyAct) classifyAct(rec, button);
    };
    rec.input = event => {
      if (event.target === rec.root.querySelector('[data-classify-range]')) {
        rec.threshold = Number(event.target.value);
        rec.examDrawn = false;
        persistClassify(rec);
        classifyDraw(rec);
      } else if (event.target === rec.root.querySelector('[data-search-range]')) {
        rec.target = Number(event.target.value);
        rec.root.querySelector('[data-search-target]').textContent = rec.target;
        persistSearch(rec);
        if (!rec.running) searchDraw(rec, [], -1);
      }
    };
    root.addEventListener('click', rec.click);
    root.addEventListener('input', rec.input);

    if (kind === 'binary') binaryDraw(rec);
    else if (kind === 'sort') sortReset(rec);
    else if (kind === 'search') searchDraw(rec, [], -1);
    else classifyDraw(rec);

    if (rec.kind === 'sort' || rec.kind === 'search') {
      if (window.StudyEffects?.watch) rec.unwatch = window.StudyEffects.watch(fig, () => stop(rec));
      else if (typeof IntersectionObserver === 'function') {
        const observer = new IntersectionObserver(entries => { if (entries.some(entry => !entry.isIntersecting)) stop(rec); });
        observer.observe(fig);
        rec.unwatch = () => observer.disconnect();
      }
    }
  }
  function stop(rec) {
    if (!rec) return;
    if (rec.kind === 'sort') {
      if (rec.timer) { window.clearTimeout(rec.timer); rec.timer = null; }
      if (rec.playing) sortFinish(rec);
    } else if (rec.kind === 'search' && rec.running) {
      searchFinish(rec);
    }
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
    rec.root.removeEventListener('input', rec.input);
    records.delete(fig);
  }
  const dispose = () => { for (const [fig, rec] of records) remove(fig, rec); };
  const prune = () => { for (const [fig, rec] of records) if (!fig.isConnected) remove(fig, rec); };
  document.addEventListener('study:effects-change', () => records.forEach(rec => stop(rec)));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', () => pause());

  window.ComputingLabs = {
    binaryHTML, sortHTML, searchHTML, classifyHTML, mount, pause, dispose, prune,
    binary: {bitsToNumber, numberToBits},
    sort: {shuffledBars, sortSteps},
    search: {steps: binarySearchSteps},
    classify: {accuracyOf, bestThreshold, examFruit},
  };
})();

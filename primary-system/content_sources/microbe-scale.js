/* 尺度缩放台：从头发丝向水分子逐级放大，镜像天文探索「五级宇宙地址」。
   挑战题沿用首次作答与订正分开记录的口径；渲染与计算供 Node 校验复用。 */
'use strict';
(() => {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

  /* ---------- 与画面无关的计算（Node 可测） ---------- */
  function levelRatios(levels) {
    const widths = {hair: 70, cell: 30, bacteria: 1.5, virus: 0.1, molecule: 0.0003};
    const ratios = [];
    for (let i = 1; i < levels.length; i++) {
      const before = widths[levels[i - 1].id], after = widths[levels[i].id];
      if (!before || !after) throw new Error('缺少级宽基准: ' + levels[i].id);
      ratios.push(Math.round(before / after));
    }
    return ratios;
  }
  function cleanProgress(raw, questions) {
    const clean = {};
    if (!raw || typeof raw !== 'object') return clean;
    questions.forEach(q => {
      const r = raw[q.id];
      if (r && [r.first, r.last].every(n => Number.isInteger(n) && n >= 0 && n < q.options.length)) clean[q.id] = {first: r.first, last: r.last};
    });
    return clean;
  }
  if (typeof module !== 'undefined') { module.exports = {levelRatios, cleanProgress}; return; }

  const data = MICROBE_SCALE, base = new URL('.', document.currentScript.src);
  const key = 'microbe_scale_v1';

  /* ---------- 每一级的示意场景 ---------- */
  const INK = '#34384d', MUT = '#73788b', LINE = '#dfe5f0';
  const bar = (w, label) => `<g><line x1="320" y1="322" x2="${320 + w}" y2="322" stroke="${INK}" stroke-width="3"/><line x1="320" y1="314" x2="320" y2="330" stroke="${INK}" stroke-width="3"/><line x1="${320 + w}" y1="314" x2="${320 + w}" y2="330" stroke="${INK}" stroke-width="3"/>` +
    `<text x="${320 + w / 2}" y="346" text-anchor="middle" fill="${MUT}" font-size="15" font-weight="700">${esc(label)}</text></g>`;
  const scenes = {
    hair() {
      return `<rect x="0" y="0" width="640" height="300" fill="#fbf7f2"/>` +
        `<rect x="260" y="30" width="120" height="240" rx="60" fill="#8a6a4f"/><rect x="272" y="30" width="96" height="240" rx="48" fill="#a98363" opacity=".55"/>` +
        `<text x="432" y="120" fill="${INK}" font-size="16" font-weight="700">发丝横切面</text>` +
        `<text x="432" y="146" fill="${MUT}" font-size="13">裸眼刚好看得清轮廓</text>` +
        `<circle cx="180" cy="90" r="56" fill="#b98d6b"/><circle cx="180" cy="90" r="22" fill="#8a6a4f"/>` +
        `<text x="180" y="196" fill="${MUT}" font-size="13">髓质与毛鳞片只是示意</text>` + bar(120, '≈ 70 微米');
    },
    cell() {
      return `<rect x="0" y="0" width="640" height="300" fill="#f3f7fb"/>` +
        `<polygon points="150,150 205,95 295,88 360,140 345,215 250,245 170,215" fill="#dbe9f6" stroke="#8fa9c4" stroke-width="4"/>` +
        `<circle cx="250" cy="160" r="34" fill="#b48ad0" opacity=".8"/><circle cx="250" cy="160" r="16" fill="#7e4fa8"/>` +
        `<polygon points="395,200 445,160 510,175 525,235 455,260 405,240" fill="#e7f1fa" stroke="#a9bfd6" stroke-width="3"/>` +
        `<text x="250" y="105" fill="${INK}" font-size="16" font-weight="700">皮肤细胞（示意）</text>` +
        `<text x="465" y="215" fill="${MUT}" font-size="12">边缘不规则，像拼图砖</text>` + bar(90, '≈ 30 微米');
    },
    bacteria() {
      return `<rect x="0" y="0" width="640" height="300" fill="#eef8f2"/>` +
        `<rect x="170" y="110" width="220" height="86" rx="43" fill="#9fd8b4" stroke="#3e8f63" stroke-width="4"/>` +
        `<circle cx="215" cy="140" r="9" fill="#2c6e4b"/><circle cx="245" cy="165" r="7" fill="#2c6e4b"/><circle cx="285" cy="132" r="8" fill="#2c6e4b"/><circle cx="320" cy="160" r="6" fill="#2c6e4b"/>` +
        `<path d="M390 153q26 -18 44 0t44 0" fill="none" stroke="#3e8f63" stroke-width="4" stroke-linecap="round"/>` +
        `<circle cx="480" cy="215" r="34" fill="#bfe6cd" stroke="#3e8f63" stroke-width="3"/>` +
        `<text x="280" y="80" fill="${INK}" font-size="16" font-weight="700">杆菌与球菌</text>` +
        `<text x="480" y="272" fill="${MUT}" font-size="12">鞭毛简化成一条波浪线</text>` + bar(60, '≈ 2 微米');
    },
    virus() {
      return `<rect x="0" y="0" width="640" height="300" fill="#f2f0fb"/>` +
        `<circle cx="300" cy="150" r="96" fill="#c9bef0" stroke="#6a52b8" stroke-width="4"/>` +
        Array.from({length: 14}, (_, i) => {
          const a = i / 14 * Math.PI * 2, x = 300 + Math.cos(a) * 96, y = 150 + Math.sin(a) * 96;
          return `<line x1="${x}" y1="${y}" x2="${x + Math.cos(a) * 22}" y2="${y + Math.sin(a) * 22}" stroke="#6a52b8" stroke-width="5" stroke-linecap="round"/><circle cx="${x + Math.cos(a) * 22}" cy="${y + Math.sin(a) * 22}" r="7" fill="#8b65c9"/>`;
        }).join('') +
        `<circle cx="300" cy="150" r="34" fill="#a67cc8"/>` +
        `<text x="470" y="120" fill="${INK}" font-size="16" font-weight="700">带刺的蛋白外壳</text>` +
        `<text x="470" y="146" fill="${MUT}" font-size="13">核酸藏在核心里</text>` +
        `<text x="470" y="170" fill="${MUT}" font-size="13">形状只是示意，不是实拍</text>` + bar(40, '≈ 0.1 微米');
    },
    molecule() {
      return `<rect x="0" y="0" width="640" height="300" fill="#e8f4fb"/>` +
        [[140, 120], [330, 90], [470, 170], [230, 210], [420, 240]].map(([x, y]) =>
          `<circle cx="${x}" cy="${y}" r="26" fill="#e25563" opacity=".9"/><circle cx="${x - 24}" cy="${y - 20}" r="13" fill="#fff" stroke="#8497a9" stroke-width="2.5"/><circle cx="${x + 24}" cy="${y - 20}" r="13" fill="#fff" stroke="#8497a9" stroke-width="2.5"/>`).join('') +
        `<text x="320" y="70" fill="${INK}" font-size="16" font-weight="700">H₂O：一个大氧原子带两个小氢原子</text>` +
        `<text x="320" y="278" fill="${MUT}" font-size="13">这一级已经没有显微镜能直接「看」，靠仪器和推断</text>` + bar(24, '≈ 0.3 纳米');
    },
  };

  /* ---------- 界面 ---------- */
  function render() {
    return `<section class="mscale-section" id="scale-address" aria-labelledby="scale-title"><h2 id="scale-title">尺度缩放台</h2><p>${esc(data.scaleNote)}</p>` +
      `<div class="mscale-stops" role="group" aria-label="选择缩放级别">${data.levels.map((l, i) => `<button type="button" data-level="${i}" aria-pressed="${i === 0}">${esc(l.name)}</button>`).join('')}</div>` +
      `<div class="mscale-address"><div class="mscale-stage" data-scale-stage aria-live="polite"></div><div data-scale-info></div></div>` +
      `<label class="mscale-slider">把画面放大 <input type="range" min="0" max="${data.levels.length - 1}" step="1" value="0" aria-label="缩放级别" data-scale-slider></label></section>` +
      `<section class="mscale-section" id="scale-challenges" aria-labelledby="scale-challenge-title"><h2 id="scale-challenge-title">尺度观察挑战</h2><p>先缩放、再回答，可以回去看图修改；首次答对和订正后的结果分开记录。</p><p class="mscale-progress" role="status"></p><div class="mscale-questions">${data.challenges.map((q, i) => `<fieldset data-question="${esc(q.id)}"><legend>${i + 1}．${esc(q.question)}</legend><div class="mscale-options">${q.options.map((s, n) => `<button type="button" data-answer="${n}" aria-pressed="false">${esc(s)}</button>`).join('')}</div><p class="mscale-feedback" aria-live="polite"></p><a href="${esc(q.link)}">回到课文找线索 ↑</a></fieldset>`).join('')}</div></section>`;
  }

  const records = new Map();
  function mount(fig) {
    if (!data || records.has(fig)) return;
    const root = fig.matches?.('.fig') ? fig : fig.querySelector('.fig[data-microbe-scale]') || fig;
    if (!root.querySelector('[data-scale-stage]')) return;
    let progress = {}, persist = true;
    try { progress = cleanProgress(JSON.parse(localStorage.getItem(data.storeKey)), data.challenges); } catch (e) { /* 损坏或被禁用的存储不妨碍练习。 */ }
    const stage = root.querySelector('[data-scale-stage]');
    const info = root.querySelector('[data-scale-info]');

    function level(index) {
      const l = data.levels[index];
      stage.innerHTML = `<svg class="fig-svg" viewBox="0 0 640 356" role="img" aria-label="${esc(l.name)}示意，${esc(l.sizeLabel)}">${scenes[l.id]()}</svg>`;
      info.innerHTML = `<p class="mscale-address-path">${esc(l.address)}</p><h3>${esc(l.name)}</h3>` +
        `<p class="mscale-size">${esc(l.sizeLabel)} · ${esc(l.tool)}</p><p>${esc(l.text)}</p>` +
        `<p class="mscale-compare">${esc(l.compare)}</p><a href="${esc(l.link)}">${esc(l.linkLabel)} →</a>`;
      root.querySelectorAll('[data-level]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.level) === index)));
      const slider = root.querySelector('[data-scale-slider]');
      slider.value = index;
      slider.setAttribute('aria-valuetext', l.name);
    }

    function updateQuestion(q) {
      const field = root.querySelector(`[data-question="${q.id}"]`), r = progress[q.id];
      field.querySelectorAll('[data-answer]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.answer) === r?.last)));
      field.querySelector('.mscale-feedback').textContent = r ? `${r.last === q.answer ? '答对了。' : '再观察一下。'}${q.explanation}` : '';
      field.dataset.result = r ? (r.last === q.answer ? 'correct' : 'retry') : '';
    }
    function summary() {
      const attempted = data.challenges.filter(q => progress[q.id]);
      const first = attempted.filter(q => progress[q.id].first === q.answer).length;
      const correct = attempted.filter(q => progress[q.id].last === q.answer).length;
      root.querySelector('.mscale-progress').textContent = `已尝试 ${attempted.length}／${data.challenges.length} 题 · 首次答对 ${first} 题 · 当前答对 ${correct} 题。${persist ? '记录仅保存在当前浏览器。' : '浏览器暂时不能保存，当前页面仍可继续练习。'}`;
    }
    function click(e) {
      const stop = e.target.closest('[data-level]');
      if (stop) level(Number(stop.dataset.level));
      const button = e.target.closest('[data-answer]');
      if (button) {
        const q = data.challenges.find(q => q.id === button.closest('[data-question]').dataset.question);
        const answer = Number(button.dataset.answer);
        progress[q.id] = {first: progress[q.id]?.first ?? answer, last: answer};
        try { localStorage.setItem(data.storeKey, JSON.stringify(progress)); } catch (err) { persist = false; }
        updateQuestion(q); summary();
      }
    }
    function input(e) { if (e.target.matches('[data-scale-slider]')) level(Number(e.target.value)); }
    root.addEventListener('click', click);
    root.addEventListener('input', input);
    level(0);
    data.challenges.forEach(updateQuestion);
    summary();
    records.set(fig, () => {
      root.removeEventListener('click', click);
      root.removeEventListener('input', input);
      records.delete(fig);
    });
  }
  function remove(fig, record) {
    record.unwatch?.();
    record();
  }
  const dispose = () => { for (const [fig, record] of records) remove(fig, record); };
  const prune = () => { for (const [fig, record] of records) if (!fig.isConnected) remove(fig, record); };

  window.MicrobeScale = {render, mount, dispose, prune};
})();

/* 桌面混合实验模拟器：选试剂 → 倒液混合 → 揭示现象 → 自动记录到观察表。 */
'use strict';
(() => {
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const pairKey = (a, b) => [a, b].sort().join('+');
  const data = typeof MATTER_MIX !== 'undefined' ? MATTER_MIX :
    typeof module !== 'undefined' && typeof require === 'function' ? require('./matter-mix-data.js') : null;
  function pairOf(a, b) {
    if (!data) return null;
    return data.pairs[pairKey(a, b)] || data.fallback;
  }
  if (typeof module !== 'undefined') module.exports = {pairKey, pairOf};
  if (typeof document === 'undefined') return;

  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canPlay = () => !media.matches && (!window.StudyEffects || window.StudyEffects.motion === 'full');
  const TOTAL_PAIRS = data.reagents.length * (data.reagents.length - 1) / 2;
  const RECORD_LIMIT = 40;
  const records = new Map();

  /* ---------- 观察记录（本机保存，不入库） ---------- */
  function loadRecords() {
    try {
      const list = JSON.parse(localStorage.getItem(data.storeKey) || '[]');
      return Array.isArray(list) ? list.filter(item => item && item.a && item.b && item.text) : [];
    } catch (e) { return []; }
  }
  function saveRecords(list) {
    try { localStorage.setItem(data.storeKey, JSON.stringify(list.slice(0, RECORD_LIMIT))); } catch (e) {}
  }

  const reagent = id => data.reagents.find(item => item.id === id);
  function blend(a, b) {
    const part = (value, i) => parseInt(value.slice(i, i + 2), 16);
    const mix = (x, y) => Math.round((x + y) / 2).toString(16).padStart(2, '0');
    return '#' + [1, 3, 5].map(i => mix(part(a, i), part(b, i))).join('');
  }
  const RESULT_COLORS = {'color-red': '#d3626b', 'color-blue': '#4fae9e', 'color-none': '#a67cc8', emulsify: '#e8e0d3'};

  function liquidColor(rec) {
    const pair = rec.result;
    if (pair && RESULT_COLORS[pair.kind]) return RESULT_COLORS[pair.kind];
    if (rec.a && rec.b) return blend(reagent(rec.a).color, reagent(rec.b).color);
    return '#cfe6f2';
  }

  /* ---------- 烧杯示意 ---------- */
  function bubbles() {
    return '<g class="mt-bubbles" aria-hidden="true">' +
      [126, 148, 168, 190, 212, 138, 200].map((cx, i) =>
        `<circle class="mt-bubble" style="animation-delay:${(i * .31).toFixed(2)}s" cx="${cx}" cy="200" r="${4 + i % 3 * 1.6}"/>`).join('') +
      '</g>';
  }
  function stageSVG(rec) {
    const hasNail = rec.phase !== 'select' && [rec.a, rec.b].filter(Boolean).some(id => id === 'nail');
    const nail = hasNail ? '<rect x="148" y="202" width="38" height="7" rx="3.5" fill="#8a939e"/><rect x="144" y="201" width="8" height="9" rx="2" fill="#6f7883"/>' : '';
    const frame = '<path d="M96 34V218H244V34" fill="none" stroke="#7d93a8" stroke-width="5"/>' +
      '<path d="M96 34q-9 -9 4 -13" fill="none" stroke="#7d93a8" stroke-width="4"/>';
    const dryPiles = '<circle cx="132" cy="206" r="5" fill="#f3f6f9" stroke="#9fb0c0"/><circle cx="146" cy="208" r="4.5" fill="#f6f2e6" stroke="#b0a279"/>' +
      '<circle cx="160" cy="207" r="5" fill="#f3f6f9" stroke="#9fb0c0"/><circle cx="188" cy="206" r="5" fill="#f6f2e6" stroke="#b0a279"/>' +
      '<circle cx="203" cy="208" r="4.5" fill="#f3f6f9" stroke="#9fb0c0"/>';
    let inner = '';
    if (rec.phase === 'select') {
      inner = '<text x="170" y="120" text-anchor="middle" class="mt-stage-hint">空烧杯待命</text>' +
        '<text x="170" y="146" text-anchor="middle" class="mt-stage-hint">先选两种试剂</text>';
    } else if (rec.phase === 'pouring') {
      const color = liquidColor(rec);
      inner = '<g class="mt-liquid mt-rising"><rect x="100" y="132" width="140" height="82" fill="' + color + '"/>' +
        '<ellipse cx="170" cy="132" rx="70" ry="8" fill="' + color + '"/></g>' +
        '<rect class="mt-pour" x="164" y="16" width="12" height="118" fill="' + color + '"/>' +
        '<ellipse cx="170" cy="20" rx="26" ry="7" fill="none" stroke="#7d93a8" stroke-width="3"/>' +
        '<text x="170" y="242" text-anchor="middle" class="mt-stage-hint">正在倒入……</text>';
    } else {
      const pair = rec.result;
      const color = liquidColor(rec);
      const parts = [];
      if (pair.kind === 'dry') {
        parts.push(dryPiles);
      } else if (pair.kind === 'layer') {
        const other = reagent(rec.a).id === 'oil' ? reagent(rec.b) : reagent(rec.a);
        const bottom = other.id === 'cabbage' ? '#a67cc8' : other.color;
        parts.push('<rect x="100" y="132" width="140" height="82" fill="' + bottom + '"/>' +
          '<rect x="100" y="106" width="140" height="26" fill="#ecd28a"/>' +
          '<line x1="100" y1="132" x2="240" y2="132" stroke="#fff" stroke-width="3" stroke-opacity=".8"/>');
      } else {
        parts.push('<rect x="100" y="132" width="140" height="82" fill="' + color + '"/>' +
          '<ellipse cx="170" cy="132" rx="70" ry="8" fill="' + color + '"/>');
      }
      if (pair.kind === 'gas') parts.push(bubbles());
      if (pair.kind === 'emulsify') parts.push('<g fill="#fff" fill-opacity=".55" aria-hidden="true">' +
        '<circle cx="128" cy="176" r="6"/><circle cx="156" cy="196" r="8"/><circle cx="186" cy="170" r="7"/><circle cx="210" cy="192" r="6"/></g>');
      if (pair.kind === 'dissolve') parts.push('<g class="mt-dissolving" aria-hidden="true">' +
        '<circle cx="146" cy="206" r="5"/><circle cx="168" cy="209" r="4"/><circle cx="192" cy="205" r="5"/></g>');
      parts.push(nail);
      const tag = `<text x="170" y="242" text-anchor="middle" class="mt-stage-hint">${esc(data.kinds[pair.kind] || '混合完成')}</text>`;
      inner = parts.join('') + tag;
    }
    return `<svg class="fig-svg" viewBox="0 0 340 252" role="img" aria-label="混合实验烧杯示意">${frame}${inner}</svg>`;
  }

  /* ---------- 界面 ---------- */
  function recordsTable(rec) {
    const rows = rec.list.map((item, i) => {
      const pair = pairOf(item.a, item.b);
      const tag = data.kinds[pair.kind] || '混合完成';
      return `<tr><td>${i + 1}</td><td>${esc(reagent(item.a).name)} + ${esc(reagent(item.b).name)}</td>` +
        `<td>${esc(item.text)}</td><td><span class="mt-rec-kind" data-kind="${esc(pair.kind)}">${esc(tag)}</span></td></tr>`;
    }).join('');
    const seen = new Set(rec.list.map(item => pairKey(item.a, item.b))).size;
    return `<table class="mt-rec-table"><thead><tr><th>编号</th><th>混合了什么</th><th>看到的现象</th><th>类型</th></tr></thead>` +
      `<tbody>${rows || '<tr><td colspan="4" class="mt-rec-empty">还没有记录：选两种试剂混合一次，现象会自动记到这里。</td></tr>'}</tbody></table>` +
      `<p class="mt-rec-count" role="status">已观察 ${seen} / ${TOTAL_PAIRS} 组配对</p>`;
  }

  function observeHTML(rec) {
    const pair = rec.result;
    if (!pair) return '';
    return `<span class="mt-rec-kind" data-kind="${esc(pair.kind)}">${esc(data.kinds[pair.kind] || '混合完成')}</span>` +
      `<p class="mt-mix-text">${esc(pair.text)}</p><p class="mt-mix-why">${esc(pair.why)}</p>`;
  }

  function html() {
    if (!data) return null;
    const palette = data.reagents.map(item =>
      `<button type="button" class="mt-reagent" data-mix-pick="${item.id}" aria-pressed="false">` +
      `<span class="mt-reagent-emoji" aria-hidden="true">${item.emoji}</span>` +
      `<span class="mt-reagent-name">${esc(item.name)}</span>` +
      `<span class="mt-reagent-note">${esc(item.type)} · ${esc(item.note)}</span></button>`).join('');
    return `<section class="mt-mix" data-matter-mix aria-label="桌面混合实验模拟器">` +
      `<p class="mt-mix-safety">🔒 ${esc(data.safety)}</p>` +
      `<div class="mt-mix-palette" role="group" aria-label="选择两种试剂">${palette}</div>` +
      `<div class="mt-mix-slots"><span class="mt-slot" data-mix-slot="a">A 槽：未选</span>` +
      `<span class="mt-slot" data-mix-slot="b">B 槽：未选</span>` +
      `<button type="button" class="fig-btn" data-mix-reset>重新选</button>` +
      `<button type="button" class="fig-btn" data-mix-wipe>清空记录</button></div>` +
      `<div class="sci-demo-stage mt-mix-stage" tabindex="0" role="region" aria-label="混合实验烧杯，可横向滚动"></div>` +
      `<p class="mt-mix-status" role="status"></p>` +
      `<div class="mt-mix-observe" data-mix-observe hidden></div>` +
      `<p class="sci-model-note">${esc(data.model)}</p>` +
      `<div class="mt-mix-records"><h4>观察记录表</h4><div data-mix-records></div></div>` +
      `</section>`;
  }

  /* ---------- 状态与渲染 ---------- */
  function draw(rec) {
    const root = rec.root;
    root.querySelectorAll('[data-mix-pick]').forEach(button => {
      const on = button.dataset.mixPick === rec.a || button.dataset.mixPick === rec.b;
      button.setAttribute('aria-pressed', String(on));
    });
    const slotText = id => id ? `${reagent(id).emoji} ${reagent(id).name}` : '未选';
    write(root.querySelector('[data-mix-slot="a"]'), 'A 槽：' + slotText(rec.a));
    write(root.querySelector('[data-mix-slot="b"]'), 'B 槽：' + slotText(rec.b));
    root.querySelector('.mt-mix-stage').innerHTML = stageSVG(rec);
    const status = root.querySelector('.mt-mix-status');
    write(status, rec.phase === 'select' ? '各选一种试剂，选满两种自动开始混合。' :
      rec.phase === 'pouring' ? '正在倒入烧杯……' : '现象已记录。换个配对继续，或点「重新选」。');
    const observe = root.querySelector('[data-mix-observe]');
    observe.hidden = rec.phase !== 'done';
    observe.innerHTML = rec.phase === 'done' ? observeHTML(rec) : '';
    root.querySelector('[data-mix-records]').innerHTML = recordsTable(rec);
    root.querySelector('[data-mix-wipe]').disabled = !rec.list.length;
  }
  const write = (node, text) => { if (node) node.textContent = text; };

  function startMix(rec) {
    rec.phase = 'pouring';
    rec.result = null;
    draw(rec);
    const delay = canPlay() ? 1150 : 0;
    rec.timer = window.setTimeout(() => {
      rec.phase = 'done';
      rec.result = pairOf(rec.a, rec.b);
      rec.list = [{a: rec.a, b: rec.b, text: rec.result.text, at: Date.now()}, ...rec.list];
      saveRecords(rec.list);
      draw(rec);
    }, delay);
  }

  function pick(rec, id) {
    if (rec.phase === 'pouring') return;
    if (!rec.a) { rec.a = id; rec.phase = 'select'; draw(rec); return; }
    if (id === rec.a && !rec.b) { write(rec.root.querySelector('.mt-mix-status'), '同一杯不用和自己混合，再选另一种试剂。'); return; }
    if (!rec.b) { rec.b = id; startMix(rec); return; }
    rec.a = id; rec.b = null; rec.phase = 'select'; rec.result = null; draw(rec);
  }

  /* ---------- 挂载与清理 ---------- */
  function mount(fig) {
    if (!data || records.has(fig)) return;
    const root = fig.matches?.('[data-matter-mix]') ? fig : fig.querySelector('[data-matter-mix]');
    if (!root) return;
    const rec = {fig, root, a: null, b: null, phase: 'select', result: null, list: loadRecords(), timer: null};
    records.set(fig, rec);
    rec.click = event => {
      const button = event.target.closest('[data-mix-pick],[data-mix-reset],[data-mix-wipe]');
      if (!button || button.disabled) return;
      if (rec.timer) { window.clearTimeout(rec.timer); rec.timer = null; }
      if (button.dataset.mixPick) pick(rec, button.dataset.mixPick);
      else if (button.hasAttribute('data-mix-reset')) {
        rec.a = rec.b = null; rec.phase = 'select'; rec.result = null; draw(rec);
      } else { rec.list = []; saveRecords(rec.list); draw(rec); }
    };
    root.addEventListener('click', rec.click);
    if (window.StudyEffects?.watch) rec.unwatch = window.StudyEffects.watch(fig, () => pause(fig));
    else if (typeof IntersectionObserver === 'function') {
      const observer = new IntersectionObserver(entries => { if (entries.some(entry => !entry.isIntersecting)) pause(fig); });
      observer.observe(fig); rec.unwatch = () => observer.disconnect();
    }
    draw(rec);
  }
  function pause(fig) {
    for (const [target, rec] of records) {
      if (fig && target !== fig) continue;
      if (rec.timer) { window.clearTimeout(rec.timer); rec.timer = null; }
      if (rec.phase === 'pouring') { rec.phase = 'select'; rec.result = null; draw(rec); }
    }
  }
  function remove(fig, record) {
    pause(fig);
    record.unwatch?.();
    record.root.removeEventListener('click', record.click);
    records.delete(fig);
  }
  const dispose = () => { for (const [fig, record] of records) remove(fig, record); };
  const prune = () => { for (const [fig, record] of records) if (!fig.isConnected) remove(fig, record); };
  const changed = () => records.forEach(() => {});
  document.addEventListener('study:effects-change', changed);
  media.addEventListener?.('change', changed);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', () => pause());

  window.MatterMix = {html, mount, pause, dispose, prune, pairOf, records: loadRecords};
})();

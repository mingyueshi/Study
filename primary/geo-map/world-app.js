/* 世界地图页：投影、三层渲染（七大洲 / 世界之最 / 中国与世界）、档案卡与找一找。
   国家几何来自 world-geo.js（脚本生成）；条目与国家映射来自 world-data.js；
   esc 工具复用 shared.js。 */
(() => {
  'use strict';
  const root = document.querySelector('.world-topic');
  if (!root) return;
  const $ = (id) => root.querySelector(`#${id}`);
  const S = window.GMShared;
  const esc = S.esc;

  const GEO = window.GEO_WORLD_GEO;
  const LAYERS = window.GM_WORLD_LAYERS || [];
  const CONTINENTS = window.GM_CONTINENTS || [];
  const OCEANS = window.GM_OCEANS || [];
  const FEATURES = window.GM_WORLD_FEATURES || [];
  const META = window.GM_COUNTRY_META || {};
  const MAJOR = window.GM_MAJOR_LABELS || [];
  const CHINA_CARD = window.GM_CHINA_CARD || { facts: [] };
  const POOL = window.GM_WORLD_POOL || [];
  const TEASERS = window.GM_WORLD_TEASERS || [];

  const svg = $('gm-svg');
  if (!svg || !GEO || !GEO.countries || !LAYERS.length) {
    const target = $('gm-map-note');
    if (target) target.textContent = '数据文件尚未完整加载。请确认已保存整个目录，并重新打开页面。';
    return;
  }

  /* ---------- 投影：等经距（plate carrée），南极洲截至南纬 63° ---------- */
  const LNG0 = -180, LAT_TOP = 87, LAT_BOT = -73;
  const K = 1280 / 360;
  const W = 1280, H = (LAT_TOP - LAT_BOT) * K;
  const WX = (lng) => (lng - LNG0) * K;
  const WY = (lat) => (LAT_TOP - lat) * K;
  const mp = (lng, lat) => [WX(lng), WY(lat)];

  const ringPath = (ring) => {
    let d = '';
    ring.forEach((pt, i) => { const p = mp(pt[0], pt[1]); d += (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); });
    return d + 'Z';
  };
  const lineD = (line) => {
    let d = '';
    line.forEach((pt, i) => { const p = mp(pt[0], pt[1]); d += (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); });
    return d;
  };

  const countries = GEO.countries;
  const byName = new Map(countries.map((c) => [c.name, c]));
  const continentColor = Object.fromEntries(CONTINENTS.map((r) => [r.id, r.color]));
  const continentName = Object.fromEntries(CONTINENTS.map((r) => [r.id, r.name]));
  const continentHint = Object.fromEntries(CONTINENTS.map((r) => [r.id, r.hint]));
  const zhOf = (name) => (META[name] || [])[0] || name;
  const continentOf = (name) => (META[name] || [])[1];
  const KIND_CN = { mountain: '山脉', peak: '山峰', river: '大河', desert: '沙漠', plateau: '高原', trench: '海沟', reef: '珊瑚礁', island: '岛屿' };
  const KIND_ICON = { mountain: '⛰️', peak: '🗻', river: '🛶', desert: '🏜️', plateau: '🌄', trench: '🕳️', reef: '🐠', island: '🏝️' };
  const KIND_COLOR = { mountain: '#7c5a40', peak: '#8a6fae', river: '#3b82c4', desert: '#c98a4b', plateau: '#5f8f45', trench: '#2e5f8e', reef: '#3aaf9f', island: '#3a8f7a' };

  /* ---------- 渲染 ---------- */
  const gridSVG = () => {
    let out = '';
    for (let lng = -150; lng <= 180; lng += 30) {
      out += `<line x1="${WX(lng).toFixed(1)}" y1="${WY(LAT_TOP).toFixed(1)}" x2="${WX(lng).toFixed(1)}" y2="${WY(LAT_BOT).toFixed(1)}"/>`;
      if (lng !== -180 && lng !== 180) {
        out += `<text class="gm-grid-label" x="${WX(lng).toFixed(1)}" y="${(H - 6).toFixed(1)}" text-anchor="middle">${Math.abs(lng)}°${lng < 0 ? 'W' : 'E'}</text>`;
      }
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      out += `<line x1="0" y1="${WY(lat).toFixed(1)}" x2="${W.toFixed(1)}" y2="${WY(lat).toFixed(1)}"/>`;
      if (lat !== 0) {
        out += `<text class="gm-grid-label" x="6" y="${(WY(lat) - 5).toFixed(1)}">${Math.abs(lat)}°${lat < 0 ? 'S' : 'N'}</text>`;
      } else {
        out += `<line class="gm-equator" x1="0" y1="${WY(0).toFixed(1)}" x2="${W.toFixed(1)}" y2="${WY(0).toFixed(1)}"/>`;
        out += `<text class="gm-equator-label" x="${(WX(90)).toFixed(1)}" y="${(WY(0) - 6).toFixed(1)}" text-anchor="middle">赤道 0°</text>`;
      }
    }
    return `<g class="gm-grid">${out}</g>`;
  };

  const oceanSVG = () => OCEANS.map((o) => {
    const p = mp(o.point[0], o.point[1]);
    return `<g data-id="${o.id}" tabindex="0" role="button" aria-label="${esc(o.name)}">` +
      `<circle class="gm-hit" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="26"/>` +
      `<text class="gm-ocean-label" x="${p[0].toFixed(1)}" y="${p[1].toFixed(1)}" text-anchor="middle">${esc(o.name)}</text></g>`;
  }).join('');

  const countryPaths = (fillFor, { interactive = true } = {}) => countries.map((c) => {
    const hit = interactive
      ? ' tabindex="0" role="button" aria-label="' + esc(zhOf(c.name)) + '"'
      : ' aria-label="' + esc(zhOf(c.name)) + '"';
    return `<path class="gm-country" data-name="${esc(c.name)}"${hit} fill="${fillFor(c)}" fill-rule="evenodd" d="${c.rings.map(ringPath).join('')}"/>`;
  }).join('');

  const MAJOR_AT = Object.fromEntries(MAJOR.map((m) => [m.name, m.at]));
  const majorLabels = (homeMode = false) => MAJOR.map((m) => {
    const at = mp(m.at[0], m.at[1]);
    const isChina = m.name === 'China';
    const cls = isChina ? ' gm-cn-label' : '';
    return `<text class="gm-major-label${cls}" x="${at[0].toFixed(1)}" y="${at[1].toFixed(1)}" text-anchor="middle">${esc(zhOf(m.name))}</text>`;
  }).join('');

  const featureSVG = () => FEATURES.map((f) => {
    const color = KIND_COLOR[f.kind] || '#666';
    if (f.line) {
      const d = lineD(f.line);
      const at = f.line[Math.floor((f.line.length - 1) / 2)];
      const lp = mp(at[0], at[1]);
      return `<g data-id="${f.id}" tabindex="0" role="button" aria-label="${esc(f.name)}">` +
        `<path class="gm-river-hit" d="${d}"/>` +
        `<path class="gm-river" d="${d}" stroke="${color}"/>` +
        `<text class="gm-mark-label" x="${lp[0].toFixed(1)}" y="${(lp[1] - 9).toFixed(1)}" text-anchor="middle" fill="${color}">${esc(f.name)}</text></g>`;
    }
    const p = mp(f.point[0], f.point[1]);
    return `<g data-id="${f.id}" tabindex="0" role="button" aria-label="${esc(f.name)}">` +
      `<circle class="gm-hit" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="16"/>` +
      `<circle class="gm-mark" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="9" stroke="${color}"/>` +
      `<text class="gm-mark-icon" x="${p[0].toFixed(1)}" y="${(p[1] + 3.8).toFixed(1)}" text-anchor="middle">${KIND_ICON[f.kind] || '📍'}</text>` +
      `<text class="gm-mark-label" x="${p[0].toFixed(1)}" y="${(p[1] + 22).toFixed(1)}" text-anchor="middle" fill="${color}">${esc(f.name)}</text></g>`;
  }).join('');

  const chinaOutline = () => {
    const china = byName.get('China');
    const taiwan = byName.get('Taiwan');
    let out = '';
    [china, taiwan].forEach((c) => {
      if (c) out += `<path d="${c.rings.map(ringPath).join('')}" fill="none" stroke="#b04a3a" stroke-width="2.6" stroke-linejoin="round"/>`;
    });
    return out;
  };

  svg.setAttribute('viewBox', `0 0 ${W} ${H.toFixed(0)}`);
  svg.innerHTML =
    `<rect x="0" y="0" width="${W.toFixed(0)}" height="${H.toFixed(0)}" class="gm-sea"/>` +
    gridSVG() +
    `<g data-g="continent">${countryPaths((c) => continentColor[continentOf(c.name)] || '#d9d2b8')}${majorLabels()}</g>` +
    `<g data-g="extreme">${countryPaths(() => '#eae3cf')}${featureSVG()}</g>` +
    `<g data-g="home">${countryPaths((c) => (c.name === 'China' || c.name === 'Taiwan' ? '#e2a13c' : '#eae3cf'))}${chinaOutline()}${majorLabels(true)}</g>` +
    oceanSVG() + compassSVG();

  function compassSVG() {
    return `<g class="gm-compass" transform="translate(1240 44)">` +
      `<path d="M 0 12 L 0 -12 M -7 -4 L 0 -14 L 7 -4" fill="none"/>` +
      `<text x="0" y="30" text-anchor="middle">北</text></g>`;
  }

  /* ---------- 状态条 ---------- */
  let statusTimer;
  const status = (msg) => {
    const el = $('gm-status');
    el.textContent = msg;
    el.classList.add('visible');
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => el.classList.remove('visible'), 4200);
  };

  /* ---------- 档案卡 ---------- */
  const badge = (text, color) => `<span class="gm-badge" style="--badge:${esc(color)}">${esc(text)}</span>`;
  const row = (label, value) => `<div class="gm-row"><span class="gm-row-label">${esc(label)}</span><span class="gm-row-value">${esc(value)}</span></div>`;
  const list = (items) => items.map((f) => `<p class="gm-card-text">${esc(f)}</p>`).join('');

  function openCard(kind, id) {
    const card = $('gm-card');
    if (kind === 'o') {
      const o = OCEANS.find((x) => x.id === id);
      if (!o) return;
      card.innerHTML =
        `<p class="gm-card-eyebrow">大洋</p>` +
        `<h3 class="gm-card-title"><span aria-hidden="true">🌊</span>${esc(o.name)}</h3>` +
        `<div class="gm-chips">${badge('大洋', '#2e6f9e')}</div>` +
        row('在哪里', o.where) +
        `<p class="gm-card-text">${esc(o.note)}</p>` +
        `<p class="gm-card-foot">通行口径讲四大洋：太平洋、大西洋、印度洋、北冰洋。</p>`;
    } else if (kind === 'wf') {
      const f = FEATURES.find((x) => x.id === id);
      if (!f) return;
      card.innerHTML =
        `<p class="gm-card-eyebrow">世界之最 · ${esc(KIND_CN[f.kind] || '')}</p>` +
        `<h3 class="gm-card-title"><span aria-hidden="true">${KIND_ICON[f.kind] || '📍'}</span>${esc(f.name)}</h3>` +
        `<div class="gm-chips">${badge(KIND_CN[f.kind] || '', KIND_COLOR[f.kind])}</div>` +
        row('在哪里', f.where) +
        `<p class="gm-card-text">${esc(f.note)}</p>`;
    } else if (kind === 'country') {
      const name = id;
      const zh = zhOf(name);
      const cont = continentOf(name);
      const isChinaHome = root.dataset.layer === 'home' && (name === 'China' || name === 'Taiwan');
      if (isChinaHome) {
        card.innerHTML =
          `<p class="gm-card-eyebrow">中国与世界</p>` +
          `<h3 class="gm-card-title"><span aria-hidden="true">🇨🇳</span>中国</h3>` +
          `<div class="gm-chips">${badge('亚洲东部', '#f0c75e')}${badge('面积世界第三', '#b04a3a')}</div>` +
          list(CHINA_CARD.facts) +
          `<p class="gm-card-foot">认识它的山河与邻居，回到第一站「中国地图」就能办到。</p>`;
      } else {
        card.innerHTML =
          `<p class="gm-card-eyebrow">国家与地区</p>` +
          `<h3 class="gm-card-title">${esc(zh)}</h3>` +
          `<div class="gm-chips">${badge(esc(name), '#8a7a55')}${badge(continentName[cont] || '', continentColor[cont])}</div>` +
          row('属于', continentName[cont] || '') +
          (continentHint[cont] ? `<p class="gm-card-text">${esc(continentHint[cont])}</p>` : '') +
          `<p class="gm-card-foot">英文名「${esc(name)}」就是它在世界地图集里的通行写法。</p>`;
      }
    }
    card.classList.remove('gm-card--blank');
  }

  /* ---------- 图层切换 ---------- */
  function setLayer(id, announce = true) {
    root.dataset.layer = id;
    const layer = LAYERS.find((l) => l.id === id) || LAYERS[0];
    root.querySelectorAll('.gm-filters button').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.layer === id)));
    $('gm-layer-hint').textContent = layer.hint || '';
    const card = $('gm-card');
    card.classList.add('gm-card--blank');
    card.style.setProperty('--accent', layer.accent);
    card.innerHTML =
      `<p class="gm-card-blank-icon" aria-hidden="true">${layer.icon}</p>` +
      `<p class="gm-card-blank">${esc(layer.blank || '点地图上的元素试试。')}</p>`;
    if (announce) status(`已切换到「${layer.name}」图层。`);
  }
  $('gm-filters').innerHTML = LAYERS.map((l) =>
    `<button type="button" data-layer="${esc(l.id)}" aria-pressed="false">${esc(l.icon)} ${esc(l.name)}</button>`).join('');
  root.querySelectorAll('.gm-filters button').forEach((b) =>
    b.addEventListener('click', () => { if (!quiz.on) setLayer(b.dataset.layer); }));

  /* ---------- 找一找 ---------- */
  const quiz = { on: false, queue: [], idx: 0, score: 0 };
  const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
  const findName = (id) => {
    if (id[0] === 'o') { const o = OCEANS.find((x) => x.id === id); return o ? o.name : id; }
    if (id.startsWith('wf')) { const f = FEATURES.find((x) => x.id === id); return f ? f.name : id; }
    return zhOf(id);
  };
  const findHint = (id) => {
    if (id[0] === 'o') { const o = OCEANS.find((x) => x.id === id); return o ? `它在${o.where}` : ''; }
    if (id.startsWith('wf')) { const f = FEATURES.find((x) => x.id === id); return f ? `它${f.where}` : ''; }
    const cont = continentOf(id);
    return cont ? `它在${continentName[cont] || ''}` : '';
  };
  const dots = () => quiz.queue.map((_, i) => `<span class="${i < quiz.score ? 'ok' : i === quiz.idx ? 'now' : ''}" aria-hidden="true">●</span>`).join('');

  function renderQuizBanner() {
    const banner = $('gm-quiz');
    if (quiz.idx >= quiz.queue.length) {
      banner.innerHTML =
        `<div class="gm-quiz-result">` +
        `<b>${'⭐'.repeat(quiz.score)}${'☆'.repeat(quiz.queue.length - quiz.score)}</b>` +
        `<p>一轮找完，答对 ${quiz.score} 题（共 ${quiz.queue.length} 题）。${quiz.score === quiz.queue.length ? '眼睛真亮，全找对啦！' : '没找对的再翻翻地图，下一轮肯定更棒。'}</p>` +
        `<button type="button" class="gm-btn" data-quiz-act="again">再来一轮</button>` +
        `<button type="button" class="gm-btn gm-btn--ghost" data-quiz-act="exit">退出找一找</button></div>`;
      return;
    }
    const target = quiz.queue[quiz.idx];
    banner.innerHTML =
      `<div class="gm-quiz-head"><b>找一找</b><span>第 ${quiz.idx + 1}／${quiz.queue.length} 题</span>` +
      `<span class="gm-quiz-dots">${dots()}</span>` +
      `<button type="button" class="gm-quiz-exit" data-quiz-act="exit" aria-label="退出找一找">✕</button></div>` +
      `<p class="gm-quiz-target">请点一点：<span class="gm-quiz-name">${esc(findName(target))}</span></p>`;
  }
  const layerOf = (id) => (id.startsWith('wf') ? 'extreme' : 'continent');
  function startQuiz() {
    quiz.on = true;
    quiz.queue = shuffle(POOL.filter((id) => findName(id) !== id)).slice(0, 5);
    quiz.idx = 0;
    quiz.score = 0;
    root.dataset.quiz = 'on';
    $('gm-quiz').hidden = false;
    root.querySelectorAll('.gm-filters button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    nextQuestion();
    status('找一找开始啦！按提示在世界地图上点出正确的地方。');
  }
  function nextQuestion() {
    const target = quiz.queue[quiz.idx];
    if (!target) { renderQuizBanner(); return; }
    setLayer(layerOf(target), false);
    renderQuizBanner();
  }
  function stopQuiz() {
    quiz.on = false;
    delete root.dataset.quiz;
    $('gm-quiz').hidden = true;
    svg.querySelectorAll('.is-found').forEach((el) => el.classList.remove('is-found'));
    setLayer(root.dataset.layer || 'continent', false);
    status('已退出找一找，继续自由探索地图吧。');
  }
  function handleQuizClick(id) {
    const target = quiz.queue[quiz.idx];
    if (!target) return;
    if (id === target) {
      quiz.score++;
      const el = id[0] === 'o' || id.startsWith('wf') ? svg.querySelector(`[data-id="${id}"]`) : svg.querySelector(`[data-name="${CSS.escape(id)}"]`);
      if (el) el.classList.add('is-found');
      status(`答对啦！${findName(target)}就在这里。`);
      quiz.idx++;
      renderQuizBanner();
      if (quiz.idx < quiz.queue.length) setTimeout(nextQuestion, 900);
    } else {
      status(`再想想：${findHint(target)}。`);
    }
  }

  /* ---------- 事件 ---------- */
  function activate(id, el) {
    if (quiz.on) { handleQuizClick(id); return; }
    svg.querySelectorAll('.is-active').forEach((n) => n.classList.remove('is-active'));
    if (el) el.classList.add('is-active');
    openCard(id[0] === 'o' ? 'o' : id.startsWith('wf') ? 'wf' : 'country', id);
  }
  svg.addEventListener('click', (e) => {
    const named = e.target.closest('[data-name]');
    if (named) { activate(named.dataset.name, named); return; }
    const el = e.target.closest('[data-id]');
    if (el) activate(el.dataset.id, el);
  });
  svg.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const named = e.target.closest('[data-name]');
    if (named) { e.preventDefault(); activate(named.dataset.name, named); return; }
    const el = e.target.closest('[data-id]');
    if (el) { e.preventDefault(); activate(el.dataset.id, el); }
  });
  root.addEventListener('click', (e) => {
    const act = e.target.closest('[data-quiz-act]');
    if (!act) return;
    if (act.dataset.quizAct === 'exit') stopQuiz();
    else { quiz.idx = 0; quiz.score = 0; svg.querySelectorAll('.is-found').forEach((el) => el.classList.remove('is-found')); nextQuestion(); }
  });
  $('gm-quiz-start').addEventListener('click', () => startQuiz());

  /* ---------- 静态区块 ---------- */
  $('stat-continents').textContent = CONTINENTS.length;
  $('stat-oceans').textContent = OCEANS.length;
  $('stat-worlds').textContent = FEATURES.length;
  $('stat-countries').textContent = countries.length;

  $('gm-teasers').innerHTML = TEASERS.map((t) =>
    `<article class="gm-teaser">` +
    `<div class="gm-teaser-cols"><span class="gm-teaser-china">${esc(t.chinaLabel)}</span><span aria-hidden="true" class="gm-teaser-vs">VS</span><span class="gm-teaser-world">${esc(t.worldLabel)}</span></div>` +
    `<p>${esc(t.note)}</p></article>`).join('');

  setLayer('continent', false);
})();

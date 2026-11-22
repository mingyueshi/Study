/* 食物的旅行实验台：溯源台、作物传播时间线地图、一餐营养搭配模拟器。
   溯源与传播按步推进，遵守统一动效偏好；纯计算函数供 Node 回归测试。 */
'use strict';
(() => {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const data = typeof FOOD_LABS !== 'undefined' ? FOOD_LABS :
    typeof module !== 'undefined' && typeof require === 'function' ? require('./food-labs-data.js') : null;

  /* ---------- 纯计算（Node 可测） ---------- */
  function mealById(id) {
    return data.origin.meals.find(m => m.id === id) || null;
  }
  function farthestIngredient(meal) {
    return meal.ingredients.reduce((best, ing) => (ing.distance > best.distance ? ing : best), meal.ingredients[0]);
  }
  function nearestIngredient(meal) {
    return meal.ingredients.reduce((best, ing) => (ing.distance < best.distance ? ing : best), meal.ingredients[0]);
  }
  function activeEvents(crop, year) {
    return crop.events.filter(ev => ev.year <= year);
  }
  function stopYear(index) {
    return data.spread.stops[Math.max(0, Math.min(index, data.spread.stops.length - 1))];
  }
  function dishById(id) {
    return data.meal.dishes.find(d => d.id === id) || null;
  }
  function dishOfCat(dishes, selection, cat) {
    return dishes.filter(d => d.cat === cat && selection[cat] === d.id);
  }
  function mealEnergy(dishes, selection) {
    return data.meal.cats.reduce((sum, cat) => {
      const picked = dishOfCat(dishes, selection, cat.id);
      return sum + (picked.length ? picked[0].energy : 0);
    }, 0);
  }
  /* 五档检查：主食/蛋白/蔬菜/水果或奶/少糖，外加能量区间与粗粮加星。 */
  function evaluateMeal(dishes, selection, cfg = data.meal) {
    const picked = {};
    cfg.cats.forEach(cat => {
      const got = dishOfCat(dishes, selection, cat.id);
      picked[cat.id] = got.length ? got[0] : null;
    });
    const energy = mealEnergy(dishes, selection);
    const hits = [];
    const tips = [];
    const pass = id => hits.includes(id);
    const push = (id, ok, tip) => { if (ok) hits.push(id); else if (tip) tips.push(tip); };

    push('staple', !!picked.staple, tipOf(cfg, 'staple'));
    push('protein', !!picked.protein, tipOf(cfg, 'protein'));
    push('veg', !!picked.veg, tipOf(cfg, 'veg'));
    const fruitOk = !!picked.fruit || (picked.drink && picked.drink.dairy);
    push('fruit-dairy', fruitOk, tipOf(cfg, 'fruit-dairy'));
    const drinkOk = picked.drink && !picked.drink.sugar;
    push('light-drink', drinkOk, tipOf(cfg, 'light-drink'));
    const energyOk = energy >= cfg.energyMin && energy <= cfg.energyMax;
    push('energy-ok', energyOk, tipOf(cfg, 'energy-ok'));
    /* 粗粮与水果是加分项：达到基本盘后多亮一颗星。 */
    const wholeOk = picked.staple && picked.staple.whole;
    push('whole-grain', wholeOk, tipOf(cfg, 'whole-grain'));
    /* 星级 = 基础五档（主食/蛋白/蔬菜/少糖饮品/能量）各 1 星，
       水果或奶、粗粮是加分项：每达成一项加半星，四舍五入封顶 5 星。 */
    const base = ['staple', 'protein', 'veg', 'light-drink', 'energy-ok'].filter(pass).length;
    const bonus = (hits.includes('fruit-dairy') ? 1 : 0) + (hits.includes('whole-grain') ? 1 : 0);
    return {energy, hits, tips, base, bonus, stars: Math.min(5, Math.round(base + bonus * 0.5))};
  }
  function tipOf(cfg, checkId) {
    const check = cfg.checks.find(c => c.id === checkId);
    return check ? check.tip : '';
  }

  if (typeof module !== 'undefined') {
    module.exports = {mealById, farthestIngredient, nearestIngredient, activeEvents, stopYear,
      dishById, dishOfCat, mealEnergy, evaluateMeal};
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

  /* ================= 溯源台 ================= */
  function originHTML() {
    return `<section class="food-lab" data-food-lab="origin" aria-label="这餐从哪来溯源台">` +
      `<p class="food-lab-note">🧾 ${esc(data.origin.note)}</p>` +
      `<div class="food-meal-picker" data-origin-picker></div>` +
      `<div data-origin-body></div>` +
      `</section>`;
  }
  function originState(rec) {
    const s = load(data.origin.storeKey, {meal: 'dinner', ing: 'rice', stage: 0});
    return {
      meal: mealById(s.meal) ? s.meal : 'dinner',
      ing: s.ing,
      stage: Math.max(0, s.stage | 0),
    };
  }
  function originDraw(rec) {
    const meal = mealById(rec.meal);
    if (!meal.ingredients.find(i => i.id === rec.ing)) rec.ing = meal.ingredients[0].id;
    const ing = meal.ingredients.find(i => i.id === rec.ing);
    const stage = Math.min(rec.stage, ing.chain.length);

    rec.root.querySelector('[data-origin-picker]').innerHTML =
      `<div class="food-meal-chips">` + data.origin.meals.map(m =>
        `<button type="button" class="food-meal-chip${m.id === rec.meal ? ' on' : ''}" data-origin-act="meal" data-id="${m.id}"` +
        `${m.id === rec.meal ? ' aria-pressed="true"' : ''}>${m.emoji} ${esc(m.name)}</button>`).join('') + `</div>`;

    const chain = ing.chain.map((seg, i) =>
      `<li class="food-chain-step${i < stage ? ' done' : ''}">` +
      `<span class="food-chain-dot">${i < stage ? '✓' : i + 1}</span>` +
      `<span class="food-chain-place">${esc(seg.place)}</span>` +
      `<span class="food-chain-step-text">${esc(seg.step)}</span></li>`).join('');

    const status = stage >= ing.chain.length
      ? `🎉 ${esc(ing.name)}的旅行走完了：全程 ${ing.chain.length} 站、约 ${ing.distance} 公里。换一样食材继续，再答答下面的小问题。`
      : `已走 ${stage} / ${ing.chain.length} 站——按「走一站」看它下一站去哪儿。`;

    rec.root.querySelector('[data-origin-body]').innerHTML =
      `<div class="food-ing-chips">` + meal.ingredients.map(i =>
        `<button type="button" class="food-ing-chip${i.id === rec.ing ? ' on' : ''}" data-origin-act="ing" data-id="${i.id}">` +
        `${i.emoji} ${esc(i.name)}<span class="food-ing-dist">约${i.distance}km</span></button>`).join('') + `</div>` +
      `<div class="food-chain" aria-live="polite"><p class="food-chain-title">${ing.emoji} ${esc(ing.name)}的旅行路线</p>` +
      `<ol class="food-chain-list">${chain}</ol>` +
      `<div class="fig-ctrl"><button type="button" class="fig-btn" data-origin-act="step">走一站</button>` +
      `<button type="button" class="fig-btn" data-origin-act="all">一站到底</button>` +
      `<button type="button" class="fig-btn" data-origin-act="reset">从头走</button></div>` +
      `<p class="food-lab-status">${status}</p></div>` +
      `<div class="food-quiz"><p class="food-quiz-q">💡 ${esc(meal.quiz.q)}</p>` +
      `<div class="food-quiz-opts">` + meal.quiz.options.map((opt, i) =>
        `<button type="button" class="fig-btn" data-origin-act="quiz" data-index="${i}">${esc(opt)}</button>`).join('') +
      `</div><p class="food-lab-status" data-origin-quiz-status>${rec.quizIndex == null ? '' :
        (rec.quizIndex === meal.quiz.answer ? '✅ 答对了！' : '再想想——比一比每样食材的概略距离。')}</p></div>`;

    save(data.origin.storeKey, {meal: rec.meal, ing: rec.ing, stage});
  }
  function originAct(rec, button) {
    const act = button.dataset.originAct;
    const meal = mealById(rec.meal);
    if (act === 'meal') {
      if (rec.meal !== button.dataset.id) { rec.meal = button.dataset.id; rec.ing = mealById(rec.meal).ingredients[0].id; rec.stage = 0; rec.quizIndex = null; }
    } else if (act === 'ing') {
      rec.ing = button.dataset.id;
      rec.stage = 0;
      rec.quizIndex = null;
    } else if (act === 'step') {
      const ing = meal.ingredients.find(i => i.id === rec.ing);
      rec.stage = Math.min(ing.chain.length, rec.stage + 1);
    } else if (act === 'all') {
      rec.stage = 99;
    } else if (act === 'reset') {
      rec.stage = 0;
      rec.quizIndex = null;
    } else if (act === 'quiz') {
      rec.quizIndex = Number(button.dataset.index);
    }
    originDraw(rec);
  }

  /* ================= 作物传播时间线地图 ================= */
  /* 简化世界底图（示意，不表示真实海岸线与国界）。 */
  const WORLD_BLOBS = [
    {name: '北美洲', d: 'M42,88 L74,52 L128,40 L176,52 L196,84 L184,112 L156,130 L112,126 L76,116 Z', cx: 118, cy: 86},
    {name: '南美洲', d: 'M146,150 L176,142 L198,162 L204,196 L192,232 L172,258 L158,252 L148,220 L138,186 Z', cx: 174, cy: 200},
    {name: '欧洲', d: 'M282,66 L318,48 L348,54 L358,76 L344,96 L312,102 L290,92 Z', cx: 318, cy: 76},
    {name: '非洲', d: 'M288,112 L332,104 L362,124 L372,160 L356,204 L332,228 L310,212 L296,172 L284,142 Z', cx: 328, cy: 168},
    {name: '亚洲', d: 'M356,44 L420,32 L492,44 L540,68 L552,96 L520,116 L478,124 L436,116 L396,104 L362,96 L348,68 Z', cx: 452, cy: 80},
    {name: '大洋洲', d: 'M496,208 L544,200 L572,220 L564,248 L528,258 L502,240 Z', cx: 534, cy: 228},
  ];
  function worldMapBase(color = '#b8c4d4') {
    return WORLD_BLOBS.map(b =>
      `<path d="${b.d}" fill="${color}" opacity=".55" stroke="${color}" stroke-width="1.5"/>` +
      `<text x="${b.cx}" y="${b.cy}" fill="#5d6577" font-size="12.5" font-weight="700" text-anchor="middle">${b.name}</text>`
    ).join('');
  }
  function spreadHTML() {
    return `<section class="food-lab" data-food-lab="spread" aria-label="作物传播时间线地图">` +
      `<p class="food-lab-note">🗺️ ${esc(data.spread.note)}</p>` +
      `<div class="food-crop-chips" data-spread-crops></div>` +
      `<div class="food-spread-stage" data-spread-map aria-live="polite"></div>` +
      `<div class="food-spread-ctrl">` +
      `<label class="food-year-label" for="food-year">年代</label>` +
      `<input id="food-year" class="fig-range" type="range" min="0" max="${data.spread.stops.length - 1}" step="1" value="0" data-spread-range>` +
      `<output class="food-year-output" data-spread-year></output>` +
      `<button type="button" class="fig-btn" data-spread-act="play">▶ 自动播放</button>` +
      `<button type="button" class="fig-btn" data-spread-act="end">拖到最后</button>` +
      `</div>` +
      `<p class="food-lab-status" data-spread-status role="status"></p>` +
      `</section>`;
  }
  function spreadState(rec) {
    return {crop: rec.crop || 'wheat', stop: rec.stop || 0, playing: false, timer: null};
  }
  function spreadDraw(rec) {
    const crop = data.spread.crops.find(c => c.id === rec.crop) || data.spread.crops[0];
    const year = stopYear(rec.stop);
    const shown = activeEvents(crop, year);
    const mapW = 640, mapH = 300;

    rec.root.querySelector('[data-spread-crops]').innerHTML =
      data.spread.crops.map(c =>
        `<button type="button" class="food-crop-chip${c.id === rec.crop ? ' on' : ''}" style="--c:${c.color}" data-spread-act="crop" data-id="${c.id}"` +
        `${c.id === rec.crop ? ' aria-pressed="true"' : ''}>${c.emoji} ${esc(c.name)}</button>`).join('');

    const arrows = crop.events.filter(ev => ev.to).map(ev => {
      const on = ev.year <= year;
      const to = ev.to;
      const dx = to.x - crop.origin.x, dy = to.y - crop.origin.y;
      const bend = {x: (crop.origin.x + to.x) / 2 + dy * 0.12, y: (crop.origin.y + to.y) / 2 - dx * 0.12};
      return `<g class="food-spread-route${on ? ' on' : ''}" opacity="${on ? 1 : 0}">` +
        `<path d="M${crop.origin.x},${crop.origin.y} Q${bend.x},${bend.y} ${to.x},${to.y}" fill="none"` +
        ` stroke="${crop.color}" stroke-width="${on ? 3.2 : 2}" stroke-dasharray="7 5" marker-end="url(#food-arrow)"/>` +
        `<circle cx="${to.x}" cy="${to.y}" r="${on ? 5.5 : 3}" fill="${on ? crop.color : '#c4cad6'}" stroke="#fff" stroke-width="1.5"/>` +
        `</g>`;
    }).join('');

    rec.root.querySelector('[data-spread-map]').innerHTML =
      `<svg class="fig-svg" viewBox="0 0 ${mapW} ${mapH + 36}" role="img" aria-label="${esc(crop.name)}传播地图">` +
      `<defs><marker id="food-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">` +
      `<path d="M0,0 L10,5 L0,10 z" fill="${crop.color}"/></marker></defs>` +
      worldMapBase('#cfd8e4') +
      arrows +
      `<circle cx="${crop.origin.x}" cy="${crop.origin.y}" r="7" fill="${crop.color}" stroke="#fff" stroke-width="2" class="food-origin-pulse"/>` +
      `<text x="${crop.origin.x}" y="${crop.origin.y + 22}" fill="#34384d" font-size="12.5" font-weight="800" text-anchor="middle">📍 ${esc(crop.origin.label)}</text>` +
      `<text x="${mapW - 8}" y="${mapH + 24}" fill="#8a92a5" font-size="10.5" text-anchor="end">示意底图 · 不表示真实海岸线</text>` +
      `</svg>`;

    rec.root.querySelector('[data-spread-year]').textContent = year < 0 ? `公元前${-year}年` : `公元${year}年`;
    rec.root.querySelector('[data-spread-range]').value = rec.stop;
    const eventLines = shown.length
      ? shown.map(ev => `<li>${ev.year < 0 ? '公元前' + (-ev.year) + '年' : '公元' + ev.year + '年'}：${esc(ev.text)}</li>`).join('')
      : '<li>还在起点——往后拖动滑块，看它出发。</li>';
    rec.root.querySelector('[data-spread-status]').innerHTML =
      `<b>${crop.emoji} ${esc(crop.name)}</b> · ${crop.origin.label} 起步，已点亮 ${shown.length} / ${crop.events.length} 站：` +
      `<ul class="food-spread-events">${eventLines}</ul>`;
  }
  function spreadStopPlay(rec) {
    if (rec.timer) { clearInterval(rec.timer); rec.timer = null; }
    rec.playing = false;
    const btn = rec.root.querySelector('[data-spread-act="play"]');
    if (btn) btn.textContent = '▶ 自动播放';
  }
  function spreadAct(rec, button, el) {
    const act = button.dataset.spreadAct;
    if (act === 'crop') {
      rec.crop = button.dataset.id;
      rec.stop = 0;
      spreadStopPlay(rec);
    } else if (act === 'end') {
      rec.stop = data.spread.stops.length - 1;
      spreadStopPlay(rec);
    } else if (act === 'play') {
      if (rec.playing) { spreadStopPlay(rec); spreadDraw(rec); return; }
      if (!canPlay()) { rec.stop = data.spread.stops.length - 1; spreadDraw(rec); return; }
      rec.playing = true;
      button.textContent = '⏸ 暂停';
      if (rec.stop >= data.spread.stops.length - 1) rec.stop = 0;
      rec.timer = setInterval(() => {
        rec.stop += 1;
        if (rec.stop >= data.spread.stops.length - 1) spreadStopPlay(rec);
        spreadDraw(rec);
      }, 850);
    }
    spreadDraw(rec);
  }

  /* ================= 一餐营养搭配模拟器 ================= */
  function mealHTML() {
    return `<section class="food-lab" data-food-lab="meal" aria-label="一餐营养搭配模拟器">` +
      `<p class="food-lab-note">🥗 ${esc(data.meal.note)}</p>` +
      `<div data-meal-tray></div>` +
      `<div class="fig-ctrl"><button type="button" class="fig-btn food-eval-btn" data-meal-act="eval">评价这餐</button>` +
      `<button type="button" class="fig-btn" data-meal-act="reset">清空餐盘</button></div>` +
      `<div data-meal-result aria-live="polite"></div>` +
      `</section>`;
  }
  function mealState(rec) {
    const s = load(data.meal.storeKey, {});
    return {sel: {...s.sel}, shown: false};
  }
  function dishChip(d, sel) {
    const on = sel[d.cat] === d.id;
    return `<button type="button" class="food-dish${on ? ' on' : ''}" data-meal-act="dish" data-id="${d.id}"` +
      `${on ? ' aria-pressed="true"' : ''}>` +
      `<span class="food-dish-emoji">${d.emoji}</span>` +
      `<span class="food-dish-name">${esc(d.name)}</span>` +
      `<span class="food-dish-energy">${d.energy}kcal</span></button>`;
  }
  function mealDraw(rec) {
    const tray = rec.root.querySelector('[data-meal-tray]');
    tray.innerHTML = data.meal.cats.map(cat => {
      const picked = rec.sel[cat.id] ? dishById(rec.sel[cat.id]) : null;
      const dishes = data.meal.dishes.filter(d => d.cat === cat.id);
      return `<div class="food-cat"><p class="food-cat-title">${cat.emoji} ${esc(cat.name)}` +
        `${cat.must ? '<i class="food-cat-must">必选</i>' : '<i class="food-cat-opt">可选</i>'}` +
        `${picked ? `<span class="food-cat-picked">已选：${picked.emoji} ${esc(picked.name)}</span>` : ''}</p>` +
        `<div class="food-dishes">${dishes.map(d => dishChip(d, rec.sel)).join('')}</div></div>`;
    }).join('');
    const energy = mealEnergy(data.meal.dishes, rec.sel);
    tray.insertAdjacentHTML('beforeend',
      `<p class="food-energy-line">当前餐盘能量合计：<output>${energy}</output> 千卡（参考 ${data.meal.energyMin}～${data.meal.energyMax} 千卡）</p>`);

    const box = rec.root.querySelector('[data-meal-result]');
    if (!rec.shown) { box.innerHTML = ''; return; }
    const result = evaluateMeal(data.meal.dishes, rec.sel);
    const starTxt = '★★★★★'.slice(0, result.stars) + '☆☆☆☆☆'.slice(0, 5 - result.stars);
    const checks = data.meal.checks.map(c =>
      `<li class="food-check${result.hits.includes(c.id) ? ' ok' : ''}">` +
      `<span class="food-check-mark">${result.hits.includes(c.id) ? '✓' : '·'}</span>${esc(c.label)}</li>`).join('');
    const tips = result.tips.length
      ? `<ul class="food-tips">${result.tips.map(t => `<li>👉 ${esc(t)}</li>`).join('')}</ul>`
      : '<p class="food-tips-done">🎉 各类都搭齐了，这餐很棒！下一餐试试换换花样。</p>';
    box.innerHTML =
      `<div class="food-result"><p class="food-stars" aria-label="星级 ${result.stars} 星">` +
      `<b>${starTxt}</b><span>${result.stars} 星</span></p>` +
      `<ul class="food-checks">${checks}</ul>` +
      `<p class="food-energy-verdict">能量合计 ${result.energy} 千卡，` +
      `${result.energy < data.meal.energyMin ? '偏低——加一份主食或蛋白质' :
        result.energy > data.meal.energyMax ? '偏多——减一点主食或肉' : '正好在一餐的参考区间里'}。</p>` +
      tips + `</div>`;
    save(data.meal.storeKey, {sel: rec.sel});
  }
  function mealAct(rec, button) {
    const act = button.dataset.mealAct;
    if (act === 'dish') {
      const dish = dishById(button.dataset.id);
      if (!dish) return;
      if (rec.sel[dish.cat] === dish.id) delete rec.sel[dish.cat];
      else rec.sel[dish.cat] = dish.id;
      rec.shown = false;
    } else if (act === 'eval') {
      rec.shown = true;
    } else if (act === 'reset') {
      rec.sel = {};
      rec.shown = false;
    }
    mealDraw(rec);
  }

  /* ---------- 挂载 ---------- */
  function mount(fig) {
    const root = fig.querySelector('[data-food-lab]');
    if (!root || records.has(fig)) return;
    const kind = root.dataset.foodLab;
    const rec = {root, kind};
    if (kind === 'origin') { Object.assign(rec, originState(rec)); originDraw(rec); }
    else if (kind === 'spread') { Object.assign(rec, spreadState(rec)); spreadDraw(rec); }
    else if (kind === 'meal') { Object.assign(rec, mealState(rec)); mealDraw(rec); }
    rec.click = e => {
      const button = e.target.closest('[data-origin-act], [data-spread-act], [data-meal-act]');
      if (!button || !root.contains(button)) return;
      if (button.dataset.originAct) originAct(rec, button);
      else if (button.dataset.spreadAct) spreadAct(rec, button);
      else if (button.dataset.mealAct) mealAct(rec, button);
    };
    rec.input = e => {
      if (e.target !== root.querySelector('[data-spread-range]')) return;
      spreadStopPlay(rec);
      rec.stop = Number(e.target.value);
      spreadDraw(rec);
    };
    root.addEventListener('click', rec.click);
    root.addEventListener('input', rec.input);
    records.set(fig, rec);
  }

  function pause() { records.forEach(rec => { if (rec.kind === 'spread') spreadStopPlay(rec); }); }
  function remove(fig, rec) {
    pause();
    rec.root.removeEventListener('click', rec.click);
    rec.root.removeEventListener('input', rec.input);
    records.delete(fig);
  }
  const dispose = () => { for (const [fig, rec] of records) remove(fig, rec); };
  const prune = () => { for (const [fig, rec] of records) if (!fig.isConnected) remove(fig, rec); };
  document.addEventListener('study:effects-change', () => records.forEach(rec => { if (rec.kind === 'spread') spreadStopPlay(rec); }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', () => pause());

  window.FoodLabs = {
    originHTML, spreadHTML, mealHTML, mount, pause, dispose, prune,
    origin: {mealById, farthestIngredient, nearestIngredient},
    spread: {activeEvents, stopYear},
    meal: {dishById, dishOfCat, mealEnergy, evaluateMeal},
  };
})();

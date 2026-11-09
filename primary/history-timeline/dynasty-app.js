/* 朝代更替子页：渲染公元纪年小课堂（数轴、规则、练一练）与竖版朝代更替时间轴。
   主题色复用 content.js 里时代带的 accent。 */
(() => {
  'use strict';
  const root = document.querySelector('.dynasty-topic');
  if (!root) return;
  const $ = id => root.querySelector(`#${id}`);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const intro = window.CALENDAR_INTRO || '';
  const axis = window.CALENDAR_AXIS || [];
  const rules = window.CALENDAR_RULES || [];
  const quiz = window.CALENDAR_QUIZ || [];
  const bands = window.DYNASTY_BANDS || [];
  const bridges = window.DYNASTY_TRANSITIONS || [];
  if (!bands.length) {
    $('dyn-flow').innerHTML = '<p class="tl-notice">数据文件尚未完整加载。请确认已保存整个目录，并重新打开页面。</p>';
    return;
  }

  /* 朝代 → 时代带 accent（复用主页配色，缺省给青铜色）。 */
  const eraMap = new Map((window.TIMELINE_ERAS || []).map(e => [e.id, e]));
  const nameEra = new Map((window.TIMELINE_DYNASTIES || []).map(d => [d.name, d.era]));
  const accentOf = name => {
    const era = eraMap.get(nameEra.get(name));
    return era ? era.accent : '#b07d3a';
  };
  const zoneOf = band => {
    if (band.startYear < 0 && band.endYear < 0) return { label: '公元前', cls: 'bce' };
    if (band.startYear < 0) return { label: '跨公元前后', cls: 'cross' };
    return { label: '公元后', cls: 'ce' };
  };

  function renderCalendar() {
    $('cal-intro').textContent = intro;
    const yearNow = new Date().getFullYear();
    $('cal-axis').innerHTML = axis.map(t => {
      const isNow = t.label === '今年';
      const cls = isNow ? 'now' : t.label.startsWith('前') ? 'bce' : 'ce';
      const label = isNow ? yearNow + ' 年' : t.label;
      return `<div class="cal-tick ${cls}"><span class="cal-dot" aria-hidden="true"></span><b>${esc(label)}</b><small>${esc(t.note)}</small></div>`;
    }).join('');
    $('cal-rules').innerHTML = rules.map((r, i) =>
      `<article class="cal-rule"><span class="cal-rule-no" aria-hidden="true">${i + 1}</span>` +
      `<h3>${esc(r.title)}</h3><p>${esc(r.text)}</p><p class="cal-rule-example">${esc(r.example)}</p></article>`).join('');
    $('cal-quiz').innerHTML = quiz.map((q, i) =>
      `<details class="cal-quiz-item"><summary>第 ${i + 1} 题 · ${esc(q.question)}</summary>` +
      `<p><b>答案：</b>${esc(q.answer)}</p></details>`).join('');
  }

  function bandHTML(band) {
    const zone = zoneOf(band);
    const accent = accentOf(band.name);
    return `<li class="dyn-band" id="dyn-${esc(band.id)}" style="--band-accent:${esc(accent)}">` +
      `<div class="dyn-band-head"><h3>${esc(band.name)}</h3>` +
      `<span class="dyn-duration">${esc(band.duration)}</span>` +
      `<span class="dyn-zone ${zone.cls}">${zone.label}</span>` +
      `<span class="dyn-span">${esc(band.span)}</span></div>` +
      `<p class="dyn-line rise"><span>建立</span>${esc(band.rise)}</p>` +
      `<p class="dyn-line fall"><span>灭亡</span>${esc(band.fall)}</p>` +
      `<p class="dyn-capital">🏛️ 都城：${esc(band.capital)}</p>` +
      `${band.note ? `<p class="dyn-note">ℹ️ ${esc(band.note)}</p>` : ''}</li>`;
  }

  function bridgeHTML(t) {
    return `<li class="dyn-bridge"><span class="dyn-bridge-mark" aria-hidden="true">⇣ 更替</span>` +
      `<b>${esc(t.label)}</b><small>${esc(t.year)}</small></li>`;
  }

  function renderFlow() {
    const byId = new Map(bands.map(b => [b.id, b]));
    let html = '<li class="dyn-cap" aria-hidden="true">⬇ 从上往下看：越往下，朝代越接近现在</li>';
    bands.forEach((band, i) => {
      html += bandHTML(band);
      const bridge = bridges[i];
      if (bridge && byId.get(bridge.from) === band && byId.get(bridge.to) === bands[i + 1]) {
        html += bridgeHTML(bridge);
      }
    });
    html += '<li class="dyn-cap dyn-end">1912 年 · 两千多年帝制落幕，历史翻开新的一页</li>';
    $('dyn-flow').innerHTML = html;
  }

  renderCalendar();
  renderFlow();
})();

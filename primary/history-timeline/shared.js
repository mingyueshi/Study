/* 双轨事件卡渲染与同期对照工具，供 timeline-app.js 与 era-app.js 复用。 */
window.TLShared = (() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳㉑㉒㉓㉔㉕㉖㉗㉘㉙㉚㉛㉜㉝㉞㉟㊱㊲㊳㊴㊵㊶㊷㊸㊹㊺㊻㊼㊽㊾㊿';
  const circled = n => CIRCLED[n] || String(n + 1);

  function makeContext(events, pairs) {
    const eventMap = new Map(events.map(e => [e.id, e]));
    const pairMap = new Map(pairs.map(p => [p.id, p]));
    const pairIndexOf = new Map(pairs.map((p, i) => [p.id, i]));
    const pairNo = id => circled(pairIndexOf.get(id) ?? 0);
    const pairOfEvent = id => pairs.find(p => p.china === id || p.world === id) || null;

    function cardHTML(ev) {
      const pair = pairOfEvent(ev.id);
      const paired = Boolean(pair);
      const other = paired ? (pair.china === ev.id ? pair.world : pair.china) : null;
      const sideClass = ev.track === 'china' ? 'china' : 'world';
      const pairBtn = paired
        ? `<button class="tl-pair-btn" data-pair="${esc(pair.id)}" data-from="${esc(ev.id)}" aria-label="跳到同一时期的对照事件">` +
          (ev.track === 'china' ? '看看同一时期的世界 →' : '← 看看同一时期的中国') + '</button>'
        : '';
      const pairBadge = paired
        ? `<span class="tl-pair-badge" title="同期对照第 ${pairIndexOf.get(pair.id) + 1} 组">对照 ${pairNo(pair.id)}</span>`
        : '';
      return `<article class="tl-card ${sideClass}${paired ? ' paired' : ''}" id="card-${esc(ev.id)}" data-event="${esc(ev.id)}">` +
        `<div class="tl-card-top"><span class="tl-year">${esc(ev.year)}</span><span class="tl-tag">${esc(ev.tag)}</span>${pairBadge}</div>` +
        `<h3 class="tl-card-title"><span class="tl-icon" aria-hidden="true">${esc(ev.icon || '•')}</span>${esc(ev.title)}</h3>` +
        `<p class="tl-card-text">${esc(ev.text)}</p>${pairBtn}</article>`;
    }

    return { eventMap, pairMap, pairIndexOf, pairNo, pairOfEvent, cardHTML, circled };
  }

  return { esc, circled, makeContext };
})();

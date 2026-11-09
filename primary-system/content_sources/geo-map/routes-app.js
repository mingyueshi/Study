/* 路线总览与地图上的站点条使用同一套路线数据。 */
(() => {
  'use strict';
  const A = window.GMAtlas;
  const { esc } = window.GMShared;

  document.getElementById('route-nav').innerHTML = '<h2 class="gm-side-title">挑一条路线</h2>' +
    A.routes.map(route => `<a href="#${esc(route.id)}">${esc(route.icon)} ${esc(route.title)}</a>`).join('');

  document.getElementById('route-list').innerHTML = A.routes.map(route => `
    <article class="gm-route" id="${esc(route.id)}" aria-labelledby="${esc(route.id)}-title">
      <header class="gm-route-head">
        <div>
          <p class="gm-kicker">${esc(route.icon)} ${route.steps.length} 站 · 地图观察</p>
          <h2 id="${esc(route.id)}-title">${esc(route.title)}</h2>
          <p>${esc(route.intro)}</p>
        </div>
        <a class="gm-card-link" href="${esc(A.stepHref(route, 0))}">从第一站出发 →</a>
      </header>
      <ol class="gm-route-track">
        ${route.steps.map((step, i) => {
          const p = A.get(step.place);
          return `<li><a href="${esc(A.stepHref(route, i))}">` +
            `<small>第 ${i + 1} 站 · ${A.mapLabel(p)}</small><b>${esc(p.name)}</b><span>${esc(step.observe)}</span></a></li>`;
        }).join('')}
      </ol>
      <p class="gm-route-question"><b>走完想一想</b> ${esc(route.question)}</p>
    </article>`).join('');

  // 离线直达路线锚点时，站点列表可能在浏览器首次定位之后才生成。
  const route = A.routes.find(r => '#' + r.id === location.hash);
  if (route) document.getElementById(route.id).scrollIntoView();
})();

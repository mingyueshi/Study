(() => {
  'use strict';
  const slot = document.getElementById('person-page'), root = document.querySelector('.person-topic');
  const H = window.HistoryPeople, {esc, eventHref, eraHref, bindAnchors} = window.TLShared;
  const person = H.personMap.get(new URLSearchParams(location.search).get('person'));
  if (!person) {
    slot.innerHTML='<section class="tl-hero"><p class="tl-eyebrow">历史人物馆</p><h1>先选一位人物</h1><p>人物编号没有对应的名片。回人物馆，可以按身份、时代或关键词查找。</p><a class="tl-primary-action" href="people.html">打开历史人物馆 →</a></section>';
    return;
  }
  const group=H.groupMap.get(person.group), era=window.TIMELINE_ERAS.find(era=>era.id===person.era);
  const image=person.image, links=H.relationsFor(person.id);
  const technologies=window.AncientScience.forPerson(person.id);
  const events=person.eventIds.map(id=>window.TIMELINE_EVENTS.find(event=>event.id===id));
  const imageURL=new URL(image.src,H.assetBase).href;
  document.title=person.name+' · 历史人物馆';document.getElementById('person-crumb').textContent=person.name;
  slot.innerHTML=`<div class="hp-profile-workspace" style="--person-color:${group.color}" data-sidebar-layout=".hp-profile-sidebar" data-sidebar-width="clamp(230px, 22vw, 285px)" data-sidebar-breakpoint="760" data-sidebar-label="人物目录" data-sidebar-fixed=".hp-side-title">
    <article class="hp-profile-main">
      <header class="hp-person-hero" id="profile" data-tl-anchor tabindex="-1">
        <div><p class="hp-category">${esc(group.label)} · ${esc(person.region)}</p><h1>${esc(person.name)}</h1><p class="hp-life">${esc(person.life)}</p><p class="hp-person-role">${esc(person.role)}</p><p class="hp-person-summary">${esc(person.summary)}</p>
          <div class="hp-tags">${person.tags.map(tag=>`<span>${esc(tag)}</span>`).join('')}</div>
          <nav class="tl-related"><a href="#decisions">看关键决策 ↓</a><a href="#relationships">沿人物关系继续读 ↓</a></nav>
        </div>
        <figure class="hp-person-image"><a href="${esc(imageURL)}" target="_blank" rel="noopener" aria-label="查看${esc(person.name)}的相关图像"><img src="${esc(imageURL)}" alt="${esc(image.alt)}" width="${image.width}" height="${image.height}"></a><figcaption>${esc(image.caption)}<br>${esc(image.credit)} · <a href="${esc(image.source)}" target="_blank" rel="noopener noreferrer">原图与说明（需联网）↗</a></figcaption></figure>
      </header>
      <section class="hp-profile-section" id="person-facts" data-tl-anchor tabindex="-1"><p class="tl-eyebrow">先抓住两条线索</p><h2>这个人做了什么？</h2><div class="hp-fact-grid">${person.facts.map(f=>`<div><h3>${esc(f.label)}</h3><p>${esc(f.text)}</p></div>`).join('')}</div></section>
      <section class="hp-profile-section" id="decisions" data-tl-anchor tabindex="-1"><p class="tl-eyebrow">放回当时的处境</p><h2>关键决策与创作选择</h2><p class="hp-section-intro">先读背景，说说还需要知道什么；再展开实际做法，比较影响与局限。</p>
        ${person.decisions.map(decision=>`<article class="hp-decision" id="decision-${esc(decision.id)}" data-tl-anchor tabindex="-1"><p class="hp-decision-period">${esc(decision.period)}</p><h3>${esc(decision.title)}</h3><h4>当时的问题</h4><p>${esc(decision.context)}</p><div class="hp-prompt"><b>先想一想</b><p>${esc(decision.prompt)}</p></div><details class="hp-decision-answer"><summary>展开史实、影响与局限</summary><div class="hp-decision-step"><h4>实际做法 · 依据材料</h4><p>${esc(decision.action)}</p></div><div class="hp-decision-step"><h4>影响 · 从后来看</h4><p>${esc(decision.outcome)}</p></div><div class="hp-decision-limit"><h4>读材料的边界</h4><p>${esc(decision.limits)}</p></div>${H.sourcesHTML(decision.sources)}</details></article>`).join('')}
      </section>
      <section class="hp-profile-section" id="relationships" data-tl-anchor tabindex="-1"><p class="tl-eyebrow">一个人连着许多人</p><h2>人物关系网</h2><p class="hp-section-intro">实线表示任职或交往，虚线表示学术承接、书写推重或比较背景。点人物打开名片，下方可核查关系依据。</p>${H.graphHTML(person.id)}${H.relationListHTML(person.id)}<a class="hp-text-link" href="people.html?view=network&person=${esc(person.id)}">到关系网里逐人展开 →</a></section>
      <section class="hp-profile-section" id="person-events" data-tl-anchor tabindex="-1"><p class="tl-eyebrow">人物放回时间轴</p><h2>相关大事与时代</h2><nav class="hp-event-links">${events.map(event=>`<a href="${eventHref(event)}"><small>${esc(event.year)}</small><b>${esc(event.title)} →</b></a>`).join('')}<a href="timeline.html?year=${person.anchorYear}&zoom=100"><small>前后 100 年</small><b>到 ${person.anchorYear<0?'公元前 '+(-person.anchorYear):person.anchorYear} 年前后看中外大事 →</b></a><a href="${eraHref(era)}"><small>${esc(era.span)}</small><b>进入${esc(era.name)}时代站 →</b></a></nav></section>
      ${technologies.length?`<section class="hp-profile-section" id="person-science" data-tl-anchor tabindex="-1"><h2>从人物走进科技</h2><nav class="hp-event-links">${technologies.map(t=>`<a href="${window.AncientScience.detailHref(t)}"><small>${esc(t.people.find(p=>p.id===person.id).role)}</small><b>${esc(t.title)} →</b></a>`).join('')}</nav></section>`:''}
      <section class="hp-profile-section" id="person-sources" data-tl-anchor tabindex="-1"><h2>资料出处</h2><p>事实依据与讲解分开看；延伸核查需要联网，基础内容与图像已保存在本地。</p>${H.sourcesHTML(person.sources)}</section>
    </article>
    <aside class="hp-profile-sidebar"><div class="hp-side-title"><h2>${esc(person.name)}</h2><p>${esc(group.label)} · ${esc(person.role)}</p></div><nav class="hp-profile-nav" aria-label="人物档案目录"><a href="#profile">人物名片</a><a href="#person-facts">主要事迹</a><a href="#decisions">关键决策</a><a href="#relationships">人物关系网 · ${links.length} 条</a><a href="#person-events">相关大事</a>${technologies.length?'<a href="#person-science">相关科技</a>':''}<a href="#person-sources">核查出处</a></nav><a class="hp-text-link" href="people.html?group=${esc(person.group)}">回到${esc(group.label)}名片 →</a></aside>
  </div>`;
  bindAnchors(root);
})();

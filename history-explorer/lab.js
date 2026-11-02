/* A dependency-free set of small historical experiments. All drawings are explanatory. */
(() => {
  'use strict';
  const host = document.getElementById('history-lab');
  if (!host) return;
  // East is on the right, so each westward stop has a smaller x coordinate.
  const stops = [
    ['长安', '把丝绸装上行囊', '汉代的长安是丝路东端的重要起点。商人带上丝绸，向西出发。', 737, 201],
    ['河西走廊', '沿着山与沙漠之间走', '这条狭长的通道连接中原与西域。路上的绿洲能让旅人补给。', 575, 145],
    ['敦煌', '在绿洲歇歇脚', '敦煌是丝路上的重要城镇。往西走，人们会遇见不同的语言和风俗。', 423, 187],
    ['西域', '货物与想法相遇', '古人所说的西域范围随时代变化。商队把不同地方的物产与文化连起来。', 261, 110],
    ['更远的地方', '路很长，交流没有停', '丝绸之路是许多道路组成的交通网络。货物常由不同商人一程程接力运送。', 99, 161],
  ];
  const glyphs = [
    { word: '日', title: '一个圆圈，像什么？', detail: '太阳的轮廓渐渐变得方正。观察古文字的形状，能找到今天汉字的线索。', path: '<ellipse cx="90" cy="80" rx="48" ry="44"/><path d="M72 80h36"/>' },
    { word: '月', title: '弯弯的轮廓，像什么？', detail: '一弯月亮的形状，被古人画进了文字里。后来笔画逐渐发生变化。', path: '<path d="M61 30Q139 80 61 130Q93 80 61 30Z"/><path d="M82 65h19M82 91h19"/>' },
    { word: '山', title: '三个高高低低的尖，像什么？', detail: '高低起伏的山峰，被简化成容易书写的线条。象形字常能让人联想到事物的外形。', path: '<path d="M33 120V69L63 96V35L92 69L123 47V120Z"/>' },
  ];
  const paperSteps = [
    ['准备原料', '树皮、麻等植物纤维，是古代造纸的重要原料。', '<path d="M78 57l33 17-29 89-27-12zM119 60l21 14-20 91-24-10zM158 58l17 13-12 97-24-12z"/><path d="M69 93l32 12M110 107l20 6M146 110l20 4"/>'],
    ['捣成纸浆', '原料经过处理、捣碎，再和水混合，形成纸浆。', '<path d="M45 117q75 70 150 0l-17 59H62Z"/><path d="M48 117q72-28 144 0M122 43l20 11-28 83-19-8Z"/><path class="lab-bubbles" d="M66 101l-7-8M161 99l8-9M88 89v-9"/>'],
    ['抄起薄层', '用帘子从纸浆中抄起一层，让水慢慢漏下去。', '<path d="M39 86l112-31 58 51-114 32Z"/><path d="M56 89l94-25 41 39-94 25Z"/><path d="M76 90l78-21M87 103l80-22M99 116l80-22"/><path class="lab-drips" d="M80 147v15M120 153v18M158 137v16"/>'],
    ['晾干成纸', '把薄层压平、晾干，就能得到可以书写的纸。', '<path d="M57 51l132 6-12 128-131-9Z"/><path d="M77 79l84 4M74 98l84 4M72 117l64 4"/><path class="lab-rays" d="M207 53v-12M217 64h12M202 82l8 9M186 40l-7-9"/>'],
  ];
  let stop = 0, glyph = 0, paper = 0, timer = null;
  host.innerHTML = `
    <div class="lab-tabs" role="tablist" aria-label="选择互动实验">
      <button type="button" class="lab-tab" id="lab-tab-route" role="tab" aria-controls="lab-panel-route" aria-selected="true" tabindex="0">01 <span>丝路旅行</span></button>
      <button type="button" class="lab-tab" id="lab-tab-glyph" role="tab" aria-controls="lab-panel-glyph" aria-selected="false" tabindex="-1">02 <span>汉字变身</span></button>
      <button type="button" class="lab-tab" id="lab-tab-paper" role="tab" aria-controls="lab-panel-paper" aria-selected="false" tabindex="-1">03 <span>造纸工坊</span></button>
    </div>
    <div class="lab-panel" id="lab-panel-route" role="tabpanel" aria-labelledby="lab-tab-route">
      <div class="lab-panel-top"><div><p class="lab-eyebrow">跟着商队，向西出发</p><h3>一条路，连接很多种生活。</h3></div><span class="lab-note">路线示意 · 不代表真实距离</span></div>
      <div class="lab-map-wrap"><svg class="lab-map" viewBox="0 0 840 270" role="img" aria-label="丝绸之路示意，东在右、西在左，从右侧长安向左经过河西走廊、敦煌和西域通向更远的地方">
        <defs><pattern id="lab-sand" width="36" height="28" patternUnits="userSpaceOnUse"><path d="M7 13h4M23 22h3" stroke="#b9aa8e" stroke-opacity=".35"/></pattern></defs>
        <rect width="840" height="270" fill="url(#lab-sand)"/>
        <g fill="#d9cfb5" stroke="#c6b99a" stroke-width="1.5"><path d="M144 105l48-56 36 47 24-32 40 54zM299 76l35-49 43 51 25-34 40 57zM498 67l40-41 38 50 20-25 29 30z"/></g>
        <g fill="none" stroke="#f7f0dc" stroke-width="3"><path d="M179 64l13-15 11 15M324 40l10-13 14 17M527 37l11-11 10 13"/></g>
        <g fill="none" stroke="#a99a76" stroke-width="1.2" opacity=".65"><path d="M13 234q56-27 106-8t107 10M327 240q56-27 112-1t111-8M662 223q59-23 137 12"/></g>
        <path d="M737 201C680 201 638 127 575 145S479 202 423 187S319 93 261 110S160 188 99 161" fill="none" stroke="#d2b58d" stroke-width="16" stroke-linecap="round"/>
        <path d="M737 201C680 201 638 127 575 145S479 202 423 187S319 93 261 110S160 188 99 161" fill="none" stroke="#9c7245" stroke-width="2" stroke-dasharray="5 6"/>
        <g fill="#737a56" opacity=".65"><path d="M430 228v-27m0 7q-14-17-24-8 8 10 24 8m0 0q13-18 24-7-12 9-24 7M611 175v-23m0 6q-14-17-24-8 8 10 24 8m0 0q13-18 24-7-12 9-24 7"/></g>
        ${stops.map((s, i) => `<g class="lab-stop-marker" data-stop="${i}"><circle cx="${s[3]}" cy="${s[4]}" r="7"/><text x="${s[3]}" y="${s[4]+29}" text-anchor="middle">${s[0]}</text></g>`).join('')}
        <g id="lab-caravan" class="lab-caravan"><ellipse cx="0" cy="9" rx="22" ry="5" fill="#4b3826" opacity=".12"/><g transform="translate(-20,-24)" fill="#70462b"><path d="M4 15Q1 2 8 1q5-1 8 10Q20-4 27 2l5 12 6-1 1-12 7-4 3 5-5 4-1 17-7 1-2 12h-4V21H14L11 34H7l1-13Z"/><path d="M1 13l5 3-2 4-5-4Z"/></g><path d="M-5-14h13v10H-5z" fill="#bd643a" stroke="#f4dbab" stroke-width="2"/></g>
      </svg><p class="lab-map-direction">西 ← 向西旅行 ← 东</p></div>
      <div class="lab-route-bottom"><div class="lab-story" aria-live="polite"><span id="lab-stop-number" class="lab-step-number"></span><div><h4 id="lab-stop-title"></h4><p id="lab-stop-copy"></p></div></div><div class="lab-controls"><button type="button" id="lab-prev" aria-label="上一站">←</button><button type="button" id="lab-play" class="lab-play">开始旅行 <span aria-hidden="true">▷</span></button><button type="button" id="lab-next" aria-label="下一站">→</button></div></div>
    </div>
    <div class="lab-panel" id="lab-panel-glyph" role="tabpanel" aria-labelledby="lab-tab-glyph" hidden>
      <div class="lab-panel-top"><div><p class="lab-eyebrow">当图画，慢慢成为文字</p><h3>三千年前的字，你能猜出来吗？</h3></div><span class="lab-note">象形示意，并非甲骨拓片</span></div>
      <div class="lab-glyph-content"><div class="lab-glyph-art"><svg viewBox="0 0 180 160" id="lab-glyph-svg" role="img" aria-label="象形字示意"></svg><span>看形状，找线索</span></div><div class="lab-glyph-arrow" aria-hidden="true">⟶</div><div class="lab-glyph-answer"><span class="lab-modern-word" id="lab-modern-word" aria-live="polite">?</span><button type="button" id="lab-reveal">揭开答案</button></div><div class="lab-glyph-explain"><h4 id="lab-glyph-title"></h4><p id="lab-glyph-detail">先猜一猜，再点“揭开答案”。</p></div></div>
      <div class="lab-choice-row" aria-label="选择象形字">${glyphs.map((g, i) => `<button type="button" data-glyph="${i}" aria-pressed="${i===0}">观察 ${i+1}</button>`).join('')}<span>文字是许多人长期创造、改进的。</span></div>
    </div>
    <div class="lab-panel" id="lab-panel-paper" role="tabpanel" aria-labelledby="lab-tab-paper" hidden>
      <div class="lab-panel-top"><div><p class="lab-eyebrow">让知识，变得轻一点</p><h3>从植物到一张纸，中间发生了什么？</h3></div><span class="lab-note">古法造纸的简化示意</span></div>
      <div class="lab-paper-content"><div class="lab-paper-art"><svg id="lab-paper-svg" viewBox="0 0 240 210" role="img" aria-label="古法造纸步骤示意"></svg></div><div class="lab-paper-copy" aria-live="polite"><p class="lab-eyebrow" id="lab-paper-number"></p><h4 id="lab-paper-title"></h4><p id="lab-paper-detail"></p><p class="lab-paper-fact">记住：东汉蔡伦改进了造纸术。<br>在他之前，人们已经会造纸。</p></div></div>
      <div class="lab-paper-steps" aria-label="造纸步骤">${paperSteps.map((s, i) => `<button type="button" data-paper="${i}" aria-pressed="${i===0}"><span>0${i+1}</span>${s[0]}</button>`).join('')}</div>
    </div>`;
  const $ = selector => host.querySelector(selector);
  const $$ = selector => [...host.querySelectorAll(selector)];
  const endTrip = () => {
    clearInterval(timer);
    timer = null;
    $('#lab-play').innerHTML = '开始旅行 <span aria-hidden="true">▷</span>';
    $('#lab-play').setAttribute('aria-pressed', 'false');
  };
  const showStop = () => {
    const s = stops[stop];
    $('#lab-stop-number').textContent = `0${stop+1}`;
    $('#lab-stop-title').textContent = `${s[0]} · ${s[1]}`;
    $('#lab-stop-copy').textContent = s[2];
    $('#lab-caravan').style.transform = `translate(${s[3]}px, ${s[4]-13}px) scaleX(-1)`;
    $$('.lab-stop-marker').forEach((el, i) => el.classList.toggle('lab-is-current', i === stop));
    $('#lab-prev').disabled = stop === 0;
    $('#lab-next').disabled = stop === stops.length-1;
  };
  const tabs = $$('.lab-tab');
  const selectTab = index => {
    endTrip();
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      host.querySelector(`#${tab.getAttribute('aria-controls')}`).hidden = i !== index;
    });
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index+1)%tabs.length;
      if (event.key === 'ArrowLeft') next = (index+tabs.length-1)%tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length-1;
      if (next === undefined) return;
      event.preventDefault(); selectTab(next); tabs[next].focus();
    });
  });
  $('#lab-prev').addEventListener('click', () => { endTrip(); stop = Math.max(0, stop-1); showStop(); });
  $('#lab-next').addEventListener('click', () => { endTrip(); stop = Math.min(stops.length-1, stop+1); showStop(); });
  $('#lab-play').addEventListener('click', () => {
    if (timer) { endTrip(); return; }
    if (stop === stops.length-1) stop = 0;
    showStop();
    $('#lab-play').innerHTML = '暂停旅行 <span aria-hidden="true">Ⅱ</span>';
    $('#lab-play').setAttribute('aria-pressed', 'true');
    timer = setInterval(() => {
      stop += 1; showStop();
      if (stop === stops.length-1) endTrip();
    }, 3600);
  });
  const showGlyph = () => {
    const g = glyphs[glyph];
    $('#lab-glyph-svg').innerHTML = g.path;
    $('#lab-glyph-svg').setAttribute('aria-label', `第 ${glyph+1} 个象形字示意`);
    $('#lab-glyph-title').textContent = g.title;
    $('#lab-glyph-detail').textContent = '先猜一猜，再点“揭开答案”。';
    $('#lab-modern-word').textContent = '?';
    $('#lab-reveal').disabled = false;
    $('#lab-reveal').textContent = '揭开答案';
    $$('[data-glyph]').forEach((el, i) => el.setAttribute('aria-pressed', String(i === glyph)));
  };
  $$('[data-glyph]').forEach(el => el.addEventListener('click', () => { glyph = Number(el.dataset.glyph); showGlyph(); }));
  $('#lab-reveal').addEventListener('click', () => {
    $('#lab-modern-word').textContent = glyphs[glyph].word;
    $('#lab-glyph-detail').textContent = glyphs[glyph].detail;
    $('#lab-reveal').textContent = '猜到了吗？';
    $('#lab-reveal').disabled = true;
  });
  const showPaper = () => {
    const s = paperSteps[paper];
    $('#lab-paper-svg').innerHTML = s[2];
    $('#lab-paper-svg').setAttribute('aria-label', `古法造纸第 ${paper+1} 步：${s[0]}`);
    $('#lab-paper-number').textContent = `第 ${paper+1} 步 / 共 4 步`;
    $('#lab-paper-title').textContent = s[0];
    $('#lab-paper-detail').textContent = s[1];
    $$('[data-paper]').forEach((el, i) => el.setAttribute('aria-pressed', String(i === paper)));
  };
  $$('[data-paper]').forEach(el => el.addEventListener('click', () => { paper = Number(el.dataset.paper); showPaper(); }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) endTrip(); });
  showStop(); showGlyph(); showPaper();
})();

/*
 * Geography experiments, independent of the rest of the page.
 * Principles checked against:
 * https://www.noaa.gov/education/resource-collections/freshwater/water-cycle
 * https://www.noaa.gov/office-education/outreach-communication/hands-on-science-activities/cloud-in-bottle
 * https://spaceplace.nasa.gov/seasons/en/
 * The diagrams are instructional models, never maps or measurements of real places.
 */
(() => {
  'use strict';
  const host = document.getElementById('geo-lab');
  if (!host) return;
  const places = [
    { id: 'library', name: '图书馆', direction: '东', screenIndex: 0, x: 475, y: 300, color: '#e6d9bd', art: '<path d="M-31 11V-20L0-34l31 14v31Z" fill="#dfc58f"/><path d="M-23-14v26M-7-14v26M9-14v26M25-14v26M-34 16h68"/><path d="M-13-23H13"/>' },
    { id: 'playground', name: '操场', direction: '北', screenIndex: 3, x: 300, y: 125, color: '#dbe6cd', art: '<rect x="-35" y="-23" width="70" height="47" rx="21" fill="#d6b08e"/><rect x="-24" y="-15" width="48" height="31" rx="14" fill="#bad096"/><path d="M0-15V16"/><circle cy="1" r="9"/>' },
    { id: 'park', name: '公园', direction: '南', screenIndex: 1, x: 300, y: 475, color: '#d4e8d1', art: '<path d="M-17 26V-16M19 26V-10"/><path d="M-37 7l20-36L4 7ZM3 9l16-31L37 9Z" fill="#7ca574"/><path d="M-28 27H30"/>' },
    { id: 'station', name: '车站', direction: '西', screenIndex: 2, x: 125, y: 300, color: '#dbe8eb', art: '<rect x="-34" y="-23" width="68" height="42" rx="9" fill="#93b7ba"/><path d="M-27-15H27V1H-27ZM-10-15V1M10-15V1" fill="#f5faf6"/><circle cx="-19" cy="23" r="6" fill="#586b62"/><circle cx="19" cy="23" r="6" fill="#586b62"/><path d="M-26 10h7M19 10h7"/>' },
  ];
  const waterSteps = [
    { title: '蒸发：从水面出发', short: '蒸发', copy: '阳光为水循环提供能量。海洋、湖泊等水面上的一部分水变成看不见的水蒸气，进入空气。', tip: '图中的小点用来表示水蒸气，真实的水蒸气看不见。', x: 250, y: 204 },
    { title: '凝结：在空中相遇', short: '凝结', copy: '潮湿空气上升、冷却，水蒸气可以凝结成小水滴。云是许许多多的小水滴或小冰晶，不是一团水蒸气。', tip: '把云想成“很多小水滴、小冰晶的集合”，更准确。', x: 465, y: 111 },
    { title: '降水：回到地面', short: '降水', copy: '云中的小水滴或冰晶长大，达到一定条件后落下来，形成雨、雪等降水。水又回到陆地和水面。', tip: '不是所有的云都会下雨，降水还需要合适的条件。', x: 614, y: 202 },
    { title: '汇流：河流奔向大海', short: '汇流', copy: '落到地面的水，一部分沿地表流入河流、湖泊和海洋；一部分渗入地下。水可以再次蒸发，继续旅行。', tip: '这是简化的水循环。真实旅途中，还有地下水、植物蒸腾等过程。', x: 449, y: 344 },
  ];
  const seasons = [
    { name: '夏至', month: '6月', north: '地轴北端倾向太阳，太阳直射北回归线。北半球中纬度地区白昼较长。', south: '南半球：冬季', direct: '北回归线', day: '北半球中纬度：白昼较长', x: 175, y: 250 },
    { name: '秋分', month: '9月', north: '太阳直射赤道，南北半球获得的日照较均衡。各地昼夜大致等长，北半球进入秋季。', south: '南半球：春季', direct: '赤道', day: '各地昼夜大致等长', x: 460, y: 410 },
    { name: '冬至', month: '12月', north: '地轴北端背离太阳，太阳直射南回归线。北半球中纬度地区白昼较短。', south: '南半球：夏季', direct: '南回归线', day: '北半球中纬度：白昼较短', x: 745, y: 250 },
    { name: '春分', month: '3月', north: '太阳又直射赤道，各地昼夜大致等长。北半球进入春季，新一年的季节变化继续。', south: '南半球：秋季', direct: '赤道', day: '各地昼夜大致等长', x: 460, y: 90 },
  ];
  const screenDirections = ['右边', '下方', '左边', '上方'];
  let turns = 0, selectedPlace = 0, waterStep = 0, season = 0;
  host.innerHTML = `
    <div class="geo-lab-tabs" role="tablist" aria-label="选择地理互动实验">
      <button type="button" id="geo-tab-map" class="geo-lab-tab" role="tab" aria-selected="true" aria-controls="geo-panel-map" tabindex="0"><span class="geo-lab-tab-number">01</span>地图小侦探</button>
      <button type="button" id="geo-tab-water" class="geo-lab-tab" role="tab" aria-selected="false" aria-controls="geo-panel-water" tabindex="-1"><span class="geo-lab-tab-number">02</span>水滴旅行</button>
      <button type="button" id="geo-tab-seasons" class="geo-lab-tab" role="tab" aria-selected="false" aria-controls="geo-panel-seasons" tabindex="-1"><span class="geo-lab-tab-number">03</span>四季探究</button>
    </div>
    <section id="geo-panel-map" class="geo-lab-panel" role="tabpanel" aria-labelledby="geo-tab-map">
      <div class="geo-lab-heading"><div><p class="geo-lab-eyebrow">先找北，再找路</p><h3>地图转了，方向会跟着变吗？</h3></div><span class="geo-lab-note">教学示意 · 并非真实地图</span></div>
      <div class="geo-lab-map-layout">
        <div class="geo-lab-campus-wrap"><svg class="geo-lab-campus" viewBox="0 0 600 600" role="group" aria-label="可旋转的校园示意图，以学校为中心，点击四周地标了解方位">
          <defs><pattern id="geo-map-grass" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="7" cy="9" r="1.1" fill="#bdcfae"/><path d="M21 22v-4" stroke="#c4d5b7"/></pattern></defs>
          <rect x="12" y="12" width="576" height="576" rx="40" fill="#edf4e6"/>
          <rect x="12" y="12" width="576" height="576" rx="40" fill="url(#geo-map-grass)"/>
          <g id="geo-map-rotator" class="geo-lab-map-rotator">
            <path d="M300 55V545M55 300H545" fill="none" stroke="#fffefa" stroke-width="45"/>
            <path d="M300 55V545M55 300H545" fill="none" stroke="#d5dccd" stroke-width="2" stroke-dasharray="9 10"/>
            <rect x="230" y="230" width="140" height="140" rx="25" fill="#e8d8b8" stroke="#c6b38f" stroke-width="2"/>
            <g transform="translate(300 300)"><g class="geo-lab-map-face">
              <path d="M-44 9V-27L0-48 44-27V9Z" fill="#c98b5f" stroke="#986332" stroke-width="2"/>
              <path d="M-33-22H33V20H-33Z" fill="#fff4da" stroke="#986332" stroke-width="2"/>
              <path d="M-7 20V-1H7V20M-23-14H-16V-5H-23ZM16-14H23V-5H16Z" fill="#89a7a3" stroke="#986332" stroke-width="2"/>
              <text y="49" text-anchor="middle" class="geo-lab-school-label">学校</text>
            </g></g>
            ${places.map((place, index) => `<g id="geo-place-${place.id}" class="geo-lab-landmark" data-geo-place="${index}" transform="translate(${place.x} ${place.y})" role="button" tabindex="0" aria-label="${place.name}：查看它相对学校的方向" aria-pressed="${index === 0}"><g class="geo-lab-map-face"><circle r="49" fill="${place.color}"/><g class="geo-lab-map-art">${place.art}</g><text y="76" text-anchor="middle">${place.name}</text></g></g>`).join('')}
            <g transform="translate(490 110)"><path d="M0 30V-30M0-39l-12 22L0-23 12-17Z" fill="#22634c" stroke="#22634c" stroke-width="4" stroke-linejoin="round"/><text id="geo-map-north-letter" y="-52" text-anchor="middle" class="geo-lab-north-letter">北 N</text></g>
          </g>
        </svg></div>
        <div class="geo-lab-map-side"><div class="geo-lab-answer" aria-live="polite" aria-atomic="true"><span id="geo-map-direction" class="geo-lab-direction">东</span><h4 id="geo-map-answer-title"></h4><p id="geo-map-answer-copy"></p></div><p id="geo-map-rotation" class="geo-lab-rotation" aria-live="polite"></p><div class="geo-lab-controls geo-lab-map-controls"><button type="button" id="geo-map-rotate" class="geo-lab-primary">旋转地图 90° <span aria-hidden="true">↻</span></button><button type="button" id="geo-map-reset">转回原位</button></div><p class="geo-lab-tip">点一点地标，再转一转地图。<br>看指向标，不能总把画面上方当作北。</p></div>
      </div>
    </section>
    <section id="geo-panel-water" class="geo-lab-panel" role="tabpanel" aria-labelledby="geo-tab-water" hidden>
      <div class="geo-lab-heading"><div><p class="geo-lab-eyebrow">从海洋出发，再回到大海</p><h3>一滴水，可以去过多少地方？</h3></div><span class="geo-lab-note">水循环的简化示意</span></div>
      <div class="geo-lab-water-wrap"><svg id="geo-water-scene" class="geo-lab-water-scene" viewBox="0 0 900 420" role="img" aria-label="水循环示意图，包括蒸发、凝结、降水和汇流">
        <defs><linearGradient id="geo-water-sky" x2="0" y2="1"><stop stop-color="#e4f0f3"/><stop offset="1" stop-color="#f2f7ef"/></linearGradient><pattern id="geo-water-waves" width="50" height="21" patternUnits="userSpaceOnUse"><path d="M0 10q12-9 25 0t25 0" fill="none" stroke="#7faeb5" stroke-width="2"/></pattern></defs>
        <rect width="900" height="420" rx="26" fill="url(#geo-water-sky)"/>
        <g transform="translate(112 85)"><circle r="34" fill="#f5ce71"/><path d="M0-51v-10M0 51v10M-51 0h-10M51 0h10M-36-36l-7-7M36-36l7-7M-36 36l-7 7M36 36l7 7" stroke="#d7a746" stroke-width="4" stroke-linecap="round"/></g>
        <path d="M363 304L550 147l124 96 77-71 149 136v112H363Z" fill="#adbf9c"/>
        <path d="M487 200l63-53 57 44-32-5-25 18-26-13Z" fill="#fffefa"/>
        <path d="M461 320l195-78 115 47 129-21v152H390Z" fill="#c8d7b4"/>
        <path d="M0 300q100-19 203 3t202-1q56 10 73 118H0Z" fill="#9dc5cf"/>
        <path d="M0 300q100-19 203 3t202-1q56 10 73 118H0Z" fill="url(#geo-water-waves)"/>
        <path d="M658 253q-129 25-105 54t-105 29-58 69" fill="none" stroke="#79aab7" stroke-width="18" stroke-linecap="round"/>
        <path d="M658 253q-129 25-105 54t-105 29-58 69" fill="none" stroke="#c2e0e4" stroke-width="4" stroke-dasharray="9 15"/>
        <g fill="#fafdfa" stroke="#c7dce0" stroke-width="2"><path d="M382 124q-35-6-23-33 6-15 28-13 12-34 45-20 26-15 45 10 30-4 35 24 5 31-32 32Z"/><path d="M524 109q-27-3-21-25 5-16 24-15 11-27 36-17 23-9 33 12 23-2 28 22 1 23-25 23Z"/></g>
        <g class="geo-lab-water-phase geo-lab-vapor" data-geo-water-phase="0" fill="none" stroke="#759a9f" stroke-width="4" stroke-linecap="round"><path d="M170 267q-16-32 2-64t2-59M215 266q-15-32 2-64t2-59M260 267q-13-32 2-64t2-59" stroke-dasharray="6 11"/><path d="M163 155l11-15 9 16M207 154l11-15 9 16M251 155l11-15 9 16" stroke-width="3"/></g>
        <g class="geo-lab-water-phase" data-geo-water-phase="1" fill="#91b9c2"><circle cx="395" cy="95" r="5"/><circle cx="419" cy="87" r="4"/><circle cx="444" cy="103" r="5"/><circle cx="470" cy="92" r="4"/><circle cx="548" cy="85" r="4"/><path d="M573 76v15M566 80l14 7M566 87l14-7" stroke="#709ca9" stroke-width="2"/></g>
        <g class="geo-lab-water-phase geo-lab-rain" data-geo-water-phase="2" fill="none" stroke="#6e9eaf" stroke-width="4" stroke-linecap="round"><path d="M408 146l-9 18M451 145l-9 18M495 145l-9 18M544 134l-9 18M586 133l-9 18M426 186l-9 18M470 186l-9 18M520 176l-9 18M566 174l-9 18"/></g>
        <g class="geo-lab-water-phase" data-geo-water-phase="3" fill="none" stroke="#4e859a" stroke-width="4" stroke-linecap="round"><path d="M629 280l-18 6 9-13M513 328l-18 3 12-12M416 368l-10 15-1-16"/></g>
        <g fill="#45666b" class="geo-lab-water-label"><text x="128" y="354">海洋</text><text x="211" y="139">水蒸气</text><text x="456" y="47" text-anchor="middle">小水滴 · 小冰晶</text><text x="721" y="345">陆地</text></g>
        <g id="geo-water-traveler" class="geo-lab-water-traveler"></g>
      </svg></div>
      <div class="geo-lab-water-steps" aria-label="选择水循环步骤">${waterSteps.map((step, index) => `<button type="button" id="geo-water-step-${index}" data-geo-water-step="${index}" aria-pressed="${index === 0}"><span>0${index + 1}</span>${step.short}</button>`).join('')}</div>
      <div class="geo-lab-water-bottom"><div class="geo-lab-story" aria-live="polite" aria-atomic="true"><h4 id="geo-water-title"></h4><p id="geo-water-copy"></p><p id="geo-water-tip" class="geo-lab-small-tip"></p></div><div class="geo-lab-controls"><button type="button" id="geo-water-prev" aria-label="水循环上一步">←</button><button type="button" id="geo-water-play" class="geo-lab-primary" aria-pressed="false">播放旅程 <span aria-hidden="true">▷</span></button><button type="button" id="geo-water-next" aria-label="水循环下一步">→</button></div></div>
      <p class="geo-lab-caution">记住：水会循环，不代表河水、雨水可以直接喝。饮用水需要符合安全要求。</p>
    </section>
    <section id="geo-panel-seasons" class="geo-lab-panel" role="tabpanel" aria-labelledby="geo-tab-seasons" hidden>
      <div class="geo-lab-heading"><div><p class="geo-lab-eyebrow">地轴倾斜，地球绕太阳旅行</p><h3>同一颗地球，为什么有不同的季节？</h3></div><span class="geo-lab-note">轨道斜俯视示意 · 大小、距离不按比例</span></div>
      <div class="geo-lab-seasons-layout"><div class="geo-lab-orbit-wrap"><svg class="geo-lab-orbit" viewBox="0 0 920 520" role="img" aria-label="地球公转和四季示意。四个位置的地轴始终互相平行，朝向同一方向。图示采用斜俯视角，不用于测量角度和距离。">
        <defs>${seasons.map((_, index) => `<clipPath id="geo-earth-clip-${index}"><circle r="39"/></clipPath>`).join('')}</defs>
        <ellipse cx="460" cy="250" rx="285" ry="160" fill="none" stroke="#d4dfcd" stroke-width="3" stroke-dasharray="7 10"/>
        <g transform="translate(460 250)"><circle r="59" fill="#f8d57f"/><circle r="73" fill="none" stroke="#f2d795" stroke-width="2"/><path d="M0-90v-12M0 90v12M-90 0h-12M90 0h12M-64-64l-9-9M64-64l9-9M-64 64l-9 9M64 64l9 9" stroke="#e2ba62" stroke-width="4" stroke-linecap="round"/><text y="8" text-anchor="middle" class="geo-lab-sun-label">太阳</text></g>
        ${seasons.map((item, index) => `<g id="geo-orbit-earth-${index}" class="geo-lab-earth-position" data-geo-earth="${index}" transform="translate(${item.x} ${item.y})"><circle class="geo-lab-earth-halo" r="52" fill="none" stroke="#22634c" stroke-width="3"/><circle r="39" fill="#a2c6d1" stroke="#648e9a" stroke-width="2"/><g clip-path="url(#geo-earth-clip-${index})"><path d="M-35-28l23-4 14 15-8 12 15 11-12 13-5 23-18-9 4-25-16-12ZM18-35l21 10 7 22-16 3-11-16Z" fill="#81a878"/><path d="M-37-16L37 16" fill="none" stroke="#fffefa" stroke-width="2" stroke-dasharray="4 4"/></g><path class="geo-lab-earth-axis" d="M-23 53L23-53" fill="none" stroke="#986332" stroke-width="3"/><text x="28" y="-58" class="geo-lab-pole-label">北</text></g>`).join('')}
        <g class="geo-lab-season-labels"><text x="80" y="335">夏至</text><text x="460" y="501" text-anchor="middle">秋分</text><text x="800" y="335">冬至</text><text x="554" y="75">春分</text></g>
        <g transform="translate(74 43)" class="geo-lab-axis-legend"><path d="M0 34L15 0M35 34L50 0M70 34L85 0" stroke="#986332" stroke-width="3"/><text x="111" y="26">地轴朝向保持平行</text></g>
      </svg><p class="geo-lab-diagram-note">轨道画成椭圆是为了表现观察角度；图中倾斜角不能直接量。</p></div><div class="geo-lab-season-side"><p class="geo-lab-eyebrow">现在观察 · 北半球</p><div class="geo-lab-season-story" aria-live="polite" aria-atomic="true"><h4 id="geo-season-title"></h4><p id="geo-season-copy"></p><dl><div><dt>太阳直射</dt><dd id="geo-season-direct"></dd></div><div><dt>昼夜特点</dt><dd id="geo-season-day"></dd></div></dl><span id="geo-season-south" class="geo-lab-season-south"></span></div></div></div>
      <div class="geo-lab-season-choices" aria-label="选择季节位置">${seasons.map((item, index) => `<button type="button" id="geo-season-${index}" data-geo-season="${index}" aria-pressed="${index === 0}"><span>${item.month}</span>${item.name}</button>`).join('')}</div>
      <div class="geo-lab-season-facts"><p><strong>先记住原因</strong>地轴相对轨道面的垂线倾斜约23.5°。在一年中，它的空间朝向基本不变；地球公转，让不同半球的受光情况发生变化。</p><p><strong>再避开误解</strong>四季主要不是由地球离太阳的远近造成的。南北半球季节相反；近赤道地区，白昼长短变化较小，季节的表现也不同。</p></div>
    </section>
  `;

  const $ = selector => host.querySelector(selector);
  const $$ = selector => [...host.querySelectorAll(selector)];
  const waterPanel = $('#geo-panel-water');
  const waterProcess = window.SciProcess?.html('water');
  if (waterProcess) {
    waterPanel.innerHTML = '<div class="geo-lab-heading"><div><p class="geo-lab-eyebrow">跟着水走一圈</p><h3>水怎样回到海洋？</h3></div></div>' + waterProcess;
    window.SciProcess.mount(waterPanel);
  }
  const stopWater = () => {
    window.SciProcess?.pause(waterPanel);
    window.GeoEarth?.pause();
  };
  const seasonPanel = $('#geo-panel-seasons');
  const earthObservation = window.GeoEarth?.html();
  if (earthObservation) {
    seasonPanel.innerHTML = earthObservation;
    window.GeoEarth.mount(seasonPanel);
  }
  host.closest('dialog')?.addEventListener('close', stopWater);
  const tabs = $$('.geo-lab-tab');
  const selectTab = index => {
    stopWater();
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
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault(); selectTab(next); tabs[next].focus();
    });
  });
  const showMap = () => {
    const degrees = turns * 90;
    const place = places[selectedPlace];
    const northScreen = screenDirections[(3 + turns) % 4];
    $('#geo-map-rotator').setAttribute('transform', `rotate(${degrees} 300 300)`);
    $$('.geo-lab-map-face').forEach(face => face.setAttribute('transform', `rotate(${-degrees})`));
    $('#geo-map-north-letter').setAttribute('transform', `rotate(${-degrees} 0 -52)`);
    $('#geo-map-direction').textContent = place.direction;
    $('#geo-map-answer-title').textContent = `${place.name}在学校的${place.direction}边。`;
    $('#geo-map-answer-copy').textContent = `现在它出现在学校的${screenDirections[(place.screenIndex + turns) % 4]}。地图旋转改变了画面位置，没有改变真实方位。`;
    $('#geo-map-rotation').textContent = `已旋转 ${degrees}° · 北箭头现在朝${northScreen}。`;
    $('#geo-map-reset').disabled = turns === 0;
    $$('[data-geo-place]').forEach((element, index) => element.setAttribute('aria-pressed', String(index === selectedPlace)));
  };
  $$('[data-geo-place]').forEach(element => {
    const choose = () => { selectedPlace = Number(element.dataset.geoPlace); showMap(); };
    element.addEventListener('click', choose);
    element.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault(); choose();
    });
  });
  $('#geo-map-rotate').addEventListener('click', () => { turns = (turns + 1) % 4; showMap(); });
  $('#geo-map-reset').addEventListener('click', () => { turns = 0; showMap(); });
  const showWater = () => {
    if (waterProcess) return;
    const step = waterSteps[waterStep];
    $('#geo-water-title').textContent = step.title;
    $('#geo-water-copy').textContent = step.copy;
    $('#geo-water-tip').textContent = step.tip;
    $('#geo-water-prev').disabled = waterStep === 0;
    $('#geo-water-next').disabled = waterStep === waterSteps.length - 1;
    $$('[data-geo-water-step]').forEach((button, index) => button.setAttribute('aria-pressed', String(index === waterStep)));
    $$('[data-geo-water-phase]').forEach(element => element.classList.toggle('geo-is-active', Number(element.dataset.geoWaterPhase) === waterStep));
    const traveler = $('#geo-water-traveler');
    traveler.style.transform = `translate(${step.x}px, ${step.y}px)`;
    traveler.innerHTML = waterStep === 0
      ? '<circle r="19" fill="#fffefa" stroke="#518695" stroke-width="2" stroke-dasharray="3 4"/><path d="M-7 6q-5-6 0-12M1 6q-5-6 0-12M8 6q-5-6 0-12" fill="none" stroke="#518695" stroke-width="2"/>'
      : waterStep === 1
        ? '<circle r="20" fill="#fffefa" stroke="#518695" stroke-width="2"/><g fill="#78aebb"><circle cx="-7" cy="-2" r="4"/><circle cx="5" cy="5" r="4"/><circle cx="6" cy="-7" r="3"/></g>'
        : '<path d="M0-24C-7-11-20 0-20 10a20 20 0 0 0 40 0C20 0 7-11 0-24Z" fill="#5597aa" stroke="#fffefa" stroke-width="3"/><path d="M-11 10q0 9 8 11" fill="none" stroke="#d7f0f1" stroke-width="3" stroke-linecap="round"/>';
    $('#geo-water-scene').setAttribute('aria-label', `水循环示意，当前步骤：${step.title}。${step.tip}`);
  };
  $$('[data-geo-water-step]').forEach(button => button.addEventListener('click', () => { stopWater(); waterStep = Number(button.dataset.geoWaterStep); showWater(); }));
  $('#geo-water-prev')?.addEventListener('click', () => { stopWater(); waterStep = Math.max(0, waterStep - 1); showWater(); });
  $('#geo-water-next')?.addEventListener('click', () => { stopWater(); waterStep = Math.min(waterSteps.length - 1, waterStep + 1); showWater(); });
  // 动效模块或说明数据失效时，保留原图的四步观察，不运行旧的无限循环。
  if (!waterProcess) $('#geo-water-play').hidden = true;
  const showSeason = () => {
    if (earthObservation) return;
    const current = seasons[season];
    $('#geo-season-title').textContent = `${current.name} · ${current.month}`;
    $('#geo-season-copy').textContent = current.north;
    $('#geo-season-direct').textContent = current.direct;
    $('#geo-season-day').textContent = current.day;
    $('#geo-season-south').textContent = current.south;
    $$('[data-geo-season]').forEach((button, index) => button.setAttribute('aria-pressed', String(index === season)));
    $$('[data-geo-earth]').forEach((earth, index) => earth.classList.toggle('geo-is-selected', index === season));
  };
  $$('[data-geo-season]').forEach(button => button.addEventListener('click', () => { season = Number(button.dataset.geoSeason); showSeason(); }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopWater(); });
  showMap(); showWater(); showSeason();
})();

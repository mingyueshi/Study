/* 科学观察：独立变量、可重复观察的理想模型。 */
'use strict';
(() => {
  const clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n) || 0));
  function soundOffset(x, time, air = true) {
    const elapsed = time - (x - 120) / 180;
    return !air || elapsed < 0 ? 0 : 7 * Math.sin(4 * Math.PI * elapsed);
  }
  function toneOffset(time, frequency, amplitude) {
    return 15 * clamp(amplitude, 1, 3) * Math.sin(2 * Math.PI * clamp(frequency, 1, 4) * time);
  }
  function machineModel(mode, value, progress, moving = false) {
    const p = clamp(progress, 0, 1);
    if (mode === 'lever') {
      const left = clamp(value, 20, 80) * 3.6, right = 360 - left, angle = p * Math.PI / 15;
      const pivot = 140 + left;
      return {effort:left / right, loadDistance:left * Math.sin(angle), handDistance:right * Math.sin(angle), pivot,
        left:{x:pivot - left * Math.cos(angle), y:190 - left * Math.sin(angle)},
        right:{x:pivot + right * Math.cos(angle), y:190 + right * Math.sin(angle)}};
    }
    if (mode === 'pulley') return {effort:moving ? .5 : 1, loadDistance:50 * p, handDistance:(moving ? 100 : 50) * p,
      wheelY:moving ? 230 - 50 * p : 70, loadY:(moving ? 275 : 245) - 50 * p,
      handY:moving ? 180 - 100 * p : 120 + 50 * p};
    const run = clamp(value, 100, 400), rise = 100, length = Math.hypot(run, rise);
    return {effort:rise / length, loadDistance:rise * p, handDistance:length * p, length, run,
      point:{x:100 + run * p, y:265 - rise * p}, angle:-Math.atan2(rise, run) * 180 / Math.PI};
  }
  function magnetModel(poles, progress) {
    const p = clamp(progress, 0, 1), attract = poles !== 'repel';
    return {attract, center:440 + (attract ? -100 : 80) * p, direction:attract ? -1 : 1};
  }
  function electromagnetModel(progress, current, turns) {
    const p = clamp(progress, 0, 1), on = p > 0 && p <= .5;
    return {on, lift:50 * (p <= .5 ? 2 * p : 2 * (1 - p)),
      strength:on ? clamp(current,1,3) * clamp(turns,4,12) / 36 : 0};
  }
  function buoyancyModel(ratio, progress) {
    const density = clamp(ratio,.2,2), p = clamp(progress,0,1);
    const surface = 90, size = 60, start = 170;
    const end = density < 1 ? surface + size * density - size / 2 : density > 1 ? 220 : start;
    const center = start + (end - start) * p;
    const submerged = clamp((center + size / 2 - surface) / size,0,1);
    return {center,submerged,buoyant:submerged,weight:density,
      state:density < 1 ? (p === 1 ? 'floating' : 'rising') : density > 1 ? 'sinking' : 'suspended'};
  }
  function structureModel(progress, direction = 'right', braced = false) {
    const shift = braced ? 0 : (direction === 'left' ? -1 : 1) * 55 * clamp(progress,0,1);
    const height = Math.sqrt(140 * 140 - shift * shift), top = 250 - height;
    return {shift,top,points:[{x:0,y:250},{x:140,y:250},{x:140+shift,y:top},{x:shift,y:top}]};
  }
  if (typeof module !== 'undefined') module.exports = {soundOffset, toneOffset, machineModel, magnetModel, electromagnetModel, buoyancyModel, structureModel};
  if (typeof document === 'undefined') return;
  const data = typeof SCI_EXPERIMENTS === 'undefined' ? null : SCI_EXPERIMENTS;
  const records = new Map(), media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = null, frame = null, previous = null, generation = 0;
  const canPlay = () => !media.matches && (!window.StudyEffects || window.StudyEffects.motion === 'full');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const write = (node, value) => { if (node.textContent !== value) node.textContent = value; };
  const button = (action, text, value = '') => `<button type="button" class="fig-btn" data-experiment-action="${action}" data-value="${value}">${esc(text)}</button>`;
  const slider = (key, label, limits, suffix = '') => `<label class="sci-experiment-range" data-range-label="${key}">${esc(label)} <output data-experiment-output="${key}"></output><input type="range" min="${limits.min}" max="${limits.max}" step="1" value="${limits.initial}" data-experiment-input="${key}" aria-label="${esc(label)}">${suffix}</label>`;
  const line = (key, color = '#486078') => `<line data-exp="${key}" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`;
  const text = (x, y, value) => `<text x="${x}" y="${y}" text-anchor="middle">${value}</text>`;
  const arrow = '<path d="M0 -24V-3M-6 -10 0 -3 6 -10" fill="none" stroke="#b6551b" stroke-width="3"/>';

  function html(kind) {
    if (!data?.[kind]) return null;
    const entry = data[kind];
    let controls = '';
    if (kind === 'sound') controls = '<div class="fig-ctrl">' + entry.media.map(m => button('medium', m.label, m.id)).join('') + '</div>';
    if (kind === 'tone') controls = slider('frequency', entry.frequency.label, entry.frequency) + slider('amplitude', entry.amplitude.label, entry.amplitude);
    if (kind === 'magnet') controls = '<div class="fig-ctrl">' + entry.poles.map(m => button('poles', m.label, m.id)).join('') + '</div>';
    if (kind === 'buoyancy') controls = '<div class="fig-ctrl">' + entry.blocks.map(b => button('objectType', b.label, b.id)).join('') + '</div>';
    if (kind === 'structure') controls = '<div class="fig-ctrl">' + entry.directions.map(d => button('direction',d.label,d.id)).join('') + '</div><div class="fig-ctrl">' + entry.braces.map(b => button('brace',b.label,b.id)).join('') + '</div>';
    if (kind === 'electromagnet') controls = slider('current', entry.current.label, entry.current) + slider('turns', entry.turns.label, entry.turns) +
      '<div class="fig-ctrl">' + button('phase','看通电吸起','.5') + button('phase','看断电放下','1') + '</div>';
    if (kind === 'machine') controls = '<div class="fig-ctrl">' + entry.modes.map(m => button('mode', m.label, m.id)).join('') + '</div>' +
      slider('fulcrum', '支点位置（从重物一端算起）', entry.fulcrum) +
      '<div class="fig-ctrl" data-pulley-options hidden>' + entry.pulleys.map(m => button('pulley', m.label, m.id)).join('') + '</div>' +
      slider('run', '坡脚到坡顶的水平距离', entry.run);
    return `<section class="sci-process sci-experiment" data-experiment="${kind}" aria-label="${esc(entry.title)}"><p class="sci-process-prompt">${esc(entry.prompt)}</p>` + controls +
      '<div class="fig-ctrl"><button type="button" class="fig-btn" data-experiment-action="play" aria-pressed="false" hidden>播放一次</button>' + button('previous', '退一步') + button('next', '进一步') + button('reset', '回到开始') + '</div>' +
      `<div class="sci-demo-stage" tabindex="0" role="region" aria-label="${esc(entry.title)}图示，可横向滚动"><svg class="fig-svg sci-process-svg" viewBox="0 0 640 320" role="img" aria-label="${esc(entry.title)}，变化说明见图下文字"><g data-experiment-scene></g></svg></div>` +
      '<p class="sci-scroll-hint">左右滑动图示，看完整个观察场景。</p>' +
      '<p class="sci-process-readout" data-experiment-reading></p><p class="sci-observation" data-experiment-note role="status"></p>' +
      slider('progress', '操作进度', {min:0,max:100,initial:0}) + '<p class="sci-process-status" data-experiment-status role="status"></p>' +
      `<p class="sci-model-note">${esc(entry.model)}</p><details class="sci-demo-sources"><summary>资料出处（需联网）</summary>` + entry.sources.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>`).join(' · ') + '</details></section>';
  }

  function build(record) {
    const root = record.root, kind = record.kind;
    let svg;
    if (kind === 'sound') {
      svg = '<rect x="120" y="65" width="450" height="148" rx="16" fill="#edf7fc"/>' +
        '<g data-air-guide><path d="M122 44H560m-10-6 10 6-10 6" fill="none" stroke="#428baa" stroke-width="2"/>' + text(340, 28, '疏密变化向外传播') + '</g>' +
        '<rect data-exp="source" x="72" y="92" width="15" height="90" rx="6" fill="#cf8c3e"/>' + text(78, 246, '振动物体') + text(600, 246, '观察端') +
        '<g data-air-dots>' + Array.from({length:84}, (_, i) => { const x = 140 + i % 21 * 20, y = 94 + Math.floor(i / 21) * 28;
          return `<circle data-air-x="${x}" cx="${x}" cy="${y}" r="${i === 29 ? 5 : 3}" fill="${i === 29 ? '#bd5c1c' : '#4789b1'}"/>`; }).join('') + '</g>' +
        '<path data-exp="receiver" d="M590 105Q610 135 590 165" fill="none" stroke="#4789b1" stroke-width="5"/><text data-exp="sound-caption" x="320" y="291" text-anchor="middle"></text>';
    } else if (kind === 'tone') {
      let d = '';
      for (let i = 0; i <= 240; i++) d += `${i ? 'L' : 'M'}${80 + i / 240 * 500} ${150 - toneOffset(i / 240, record.frequency, record.amplitude)}`;
      svg = '<path d="M80 55V240M80 150H590m-9-5 9 5-9 5" fill="none" stroke="#8fa4b5" stroke-width="2"/>' +
        text(80, 32, '偏离位置') + text(337, 276, '同一段示意时间 →') +
        `<path d="${d}" fill="none" stroke="#3281ae" stroke-width="3"/>` +
        '<line data-exp="cursor" y1="65" y2="235" stroke="#c16c27" stroke-dasharray="4 4"/>' +
        '<circle data-exp="tone-dot" r="7" fill="#c16c27"/>' + text(52, 155, '0');
    } else if (kind === 'buoyancy') {
      const labels=data.buoyancy.labels;
      svg = '<rect x="32" y="90" width="320" height="180" fill="#dff3fb"/><path d="M32 55V270H352V55" fill="none" stroke="#6b92a5" stroke-width="3"/>' +
        '<path d="M32 90H352" stroke="#469bbd" stroke-width="2"/>' + text(310,78,esc(labels.water)) +
        '<rect data-exp="block" x="162" width="60" height="60" rx="3" fill="#e8bb70" stroke="#9c742d" stroke-width="2"/>' +
        '<rect data-exp="wet-block" x="163" width="58" fill="#4a9ab9" opacity=".32"/>' +
        '<text data-exp="block-label" x="192" text-anchor="middle">'+esc(labels.block)+'</text>' +
        text(192,35,esc(labels.tank)) + text(192,306,esc(labels.displaced)+'：') + '<text data-exp="submerged" x="285" y="306" text-anchor="middle"></text>' +
        text(490,38,esc(labels.forces)) + '<circle cx="490" cy="155" r="6" fill="#657b84"/>' +
        '<path data-exp="buoyant-arrow" fill="none" stroke="#218b78" stroke-width="5"/><path data-exp="weight-arrow" fill="none" stroke="#c56c32" stroke-width="5"/>' +
        text(428,90,esc(labels.buoyant)+' ↑') + text(552,248,esc(labels.weight)+' ↓') + text(490,291,esc(labels.scale));
    } else if (kind === 'structure') {
      const labels=data.structure.labels;
      svg = text(170,28,esc(labels.reference)) + '<text data-exp="frame-title" x="470" y="28" text-anchor="middle"></text>' +
        text(320,58,esc(labels.joints)) +
        [100,400].map((x,i)=>`<g transform="translate(${x} 0)"><path d="M0 250V110H140V250Z" fill="none" stroke="#cbd5d7" stroke-dasharray="5 5"/><path data-exp="frame-${i}" fill="${i?'#edf5dc':'#fcf0e4'}" stroke="${i?'#55936c':'#ba8656'}" stroke-width="5"/>${i?'<path data-exp="brace-line" stroke="#338598" stroke-width="5"/>':''}${[0,1,2,3].map(n=>`<circle data-exp="joint-${i}-${n}" r="6" fill="#fff" stroke="#566d73" stroke-width="2"/>`).join('')}<path data-exp="push-${i}" d="M-25 0H25m-8-6 8 6-8 6" fill="none" stroke="#b6551b" stroke-width="3"/></g>`).join('') +
        '<path d="M85 258H255M385 258H555" stroke="#879c97" stroke-width="4"/>' +
        '<text data-exp="brace-label" x="470" y="287" text-anchor="middle"></text>' + text(320,315,esc(labels.base));
    } else if (kind === 'magnet') {
      const bar = (key, left, right) => `<g data-exp="${key}"><rect x="-70" y="125" width="70" height="55" rx="5" fill="${left === 'N' ? '#be5750' : '#36789c'}"/><rect x="0" y="125" width="70" height="55" rx="5" fill="${right === 'N' ? '#be5750' : '#36789c'}"/><text x="-35" y="160" text-anchor="middle" style="fill:#fff">${left}</text><text x="35" y="160" text-anchor="middle" style="fill:#fff">${right}</text></g>`;
      svg = '<path d="M80 206H606" stroke="#bacbcf" stroke-width="4"/>' + bar('fixed','N','S') +
        bar('moving',record.poles === 'attract' ? 'N' : 'S',record.poles === 'attract' ? 'S' : 'N') +
        '<path d="M132 181v25m38-25v25m38-25v25" stroke="#7b857e" stroke-width="4"/>' +
        '<path data-exp="force" d="M-30 0H30m-8-6 8 6-8 6" fill="none" stroke="#b6551b" stroke-width="4"/>' +
        text(170,245,'固定的磁铁') + '<text data-exp="moving-label" y="245" text-anchor="middle">可移动的磁铁</text>' + text(320,45,'箭头表示右侧磁铁受到的磁力方向');
    } else if (kind === 'electromagnet') {
      let coil = 'M215 130';
      for (let i=0;i<record.turns;i++) { const x=215+i*220/record.turns, end=215+(i+1)*220/record.turns; coil += `C${x-12} 130 ${x-12} 80 ${x} 80S${x+12} 130 ${end} 130`; }
      svg = '<rect data-exp="aura" x="169" y="78" width="302" height="65" rx="25" fill="#46a4d0"/>' +
        '<rect x="180" y="90" width="280" height="40" rx="8" fill="#bac5ce" stroke="#6c7b86" stroke-width="2"/>' +
        `<path d="M215 130H160V235H280M310 235H390M435 235H490V130H435" fill="none" stroke="#6d7882" stroke-width="3"/><path d="${coil}" fill="none" stroke="#b77730" stroke-width="3"/>` +
        '<path d="M280 214V256M310 222V248" stroke="#53656b" stroke-width="5"/><circle cx="390" cy="235" r="4" fill="#53656b"/><circle cx="435" cy="235" r="4" fill="#53656b"/>' +
        '<path data-exp="switch" stroke="#53656b" stroke-width="4"/>' +
        '<g data-exp="clip"><path d="M-4 12V-8a7 7 0 0 1 14 0V13a11 11 0 0 1-22 0V-7" fill="none" stroke="#667784" stroke-width="3"/></g>' +
        text(320,40,'线圈绕在软铁芯外面') + text(295,282,'低压电池示意') + text(417,282,'开关') +
        text(105,315,'磁性强弱示意') + '<rect x="205" y="302" width="260" height="15" rx="7" fill="#e5edf2"/><rect data-exp="strength" x="205" y="302" height="15" rx="7" fill="#278aaf"/>';
    } else if (record.mode === 'lever') {
      svg = line('beam') + '<path data-exp="fulcrum" fill="#edc15b" stroke="#ab7b24" stroke-width="2"/>' +
        '<rect data-exp="load" width="36" height="30" rx="5" fill="#d76a58"/><g data-exp="hand">' + arrow + '</g>' +
        text(140, 78, '重物') + text(500, 78, '手向下压') + text(320, 295, '支点两边的距离，会影响所需的力');
    } else if (record.mode === 'pulley') {
      svg = '<path d="M260 36H380" stroke="#667586" stroke-width="7"/>' +
        '<path data-exp="rope" fill="none" stroke="#a77d35" stroke-width="3"/>' + line('hook') +
        '<g data-exp="wheel"><circle r="28" fill="#e3f1f5" stroke="#426984" stroke-width="3"/><path d="M-25 0H25M0-25V25" stroke="#426984" stroke-width="2"/><circle r="4" fill="#426984"/></g>' +
        '<rect data-exp="load" width="36" height="30" rx="5" fill="#d76a58"/><g data-exp="hand">' + arrow + '</g>' +
        text(470, 105, record.pulley === 'moving' ? '向上拉绳 ↑' : '向下拉绳 ↓') + text(320, 313, record.pulley === 'moving' ? '轮轴随重物移动，两段绳承重' : '轮轴固定，改变用力方向');
    } else {
      const run = record.run;
      svg = `<path d="M100 265H${100 + run}V165Z" fill="#e2f1dc" stroke="#689b68" stroke-width="3"/>` +
        `<path d="M${130 + run} 165V265m-5-95 5-5 5 5m-10 90 5 5 5-5" fill="none" stroke="#638172" stroke-width="2"/>` +
        text(143 + run, 120, '升高 1 米') +
        '<g data-exp="load"><rect x="-16" y="-29" width="32" height="28" rx="4" fill="#d76a58"/><path d="M-51 -14H-23m-7-5 7 5-7 5" fill="none" stroke="#b6551b" stroke-width="3"/></g>' +
        text(320, 62, '高度不变，比较坡长和推力') + text(320, 310, '沿坡缓慢、匀速向上推');
    }
    root.querySelector('[data-experiment-scene]').innerHTML = svg;
    record.dots = Array.from(root.querySelectorAll('[data-air-x]'));
    if (kind === 'machine') {
      root.querySelector('[data-range-label="fulcrum"]').hidden = record.mode !== 'lever';
      root.querySelector('[data-range-label="run"]').hidden = record.mode !== 'ramp';
      root.querySelector('[data-pulley-options]').hidden = record.mode !== 'pulley';
    }
    draw(record);
  }
  function draw(record) {
    const root = record.root, p = record.progress, get = key => root.querySelector(`[data-exp="${key}"]`);
    let reading, note;
    if (record.kind === 'sound') {
      const air = record.medium === 'air', time = p * 3.7;
      get('source').setAttribute('x', 72 + 7 * Math.sin(4 * Math.PI * time));
      root.querySelector('[data-air-dots]').style.visibility = air ? 'visible' : 'hidden';
      root.querySelector('[data-air-guide]').style.visibility = air ? 'visible' : 'hidden';
      write(get('sound-caption'), air ? '小点在原位附近来回，变化传向远处' : '没有介质，振动不能通过这段真空传递');
      record.dots.forEach(dot => dot.setAttribute('cx', Number(dot.dataset.airX) + soundOffset(Number(dot.dataset.airX), time, air)));
      get('receiver').setAttribute('transform', `translate(${soundOffset(590, time, air)} 0)`);
      reading = air ? '有空气：观察疏密变化怎样向远处传递。' : '真空：物体仍振动，两端之间没有传声介质。';
      note = data.sound.media.find(m => m.id === record.medium).note;
    } else if (record.kind === 'tone') {
      const x = 80 + p * 500;
      get('cursor').setAttribute('x1', x); get('cursor').setAttribute('x2', x);
      get('tone-dot').setAttribute('cx', x); get('tone-dot').setAttribute('cy', 150 - toneOffset(p, record.frequency, record.amplitude));
      reading = `同一段示意时间：振动 ${record.frequency} 次 · 幅度 ${record.amplitude} 档`;
      note = data.tone.note;
    } else if (record.kind === 'buoyancy') {
      const entry=data.buoyancy, block=entry.blocks.find(b=>b.id===record.objectType), m=buoyancyModel(block.ratio,p);
      get('block').setAttribute('y',m.center-30);
      get('wet-block').setAttribute('y',Math.max(90,m.center-30));get('wet-block').setAttribute('height',60*m.submerged);
      get('block-label').setAttribute('y',m.center+6);
      const up=155-50*m.buoyant,down=155+50*m.weight;
      get('buoyant-arrow').setAttribute('d',`M480 155V${up}m-6 9 6-9 6 9`);
      get('weight-arrow').setAttribute('d',`M500 155V${down}m-6-9 6 9 6-9`);
      write(get('submerged'),`${Math.round(m.submerged*100)}%`);
      reading=block.label+' · '+entry.states[m.state];
      note=(p===0?entry.labels.start+'。':'')+block.note;
    } else if (record.kind === 'structure') {
      const entry=data.structure,braced=record.brace==='on';
      [false,braced].forEach((fixed,i)=>{
        const m=structureModel(p,record.direction,fixed);
        get(`frame-${i}`).setAttribute('d',m.points.map((point,n)=>`${n?'L':'M'}${point.x} ${point.y}`).join('')+'Z');
        m.points.forEach((point,n)=>{get(`joint-${i}-${n}`).setAttribute('cx',point.x);get(`joint-${i}-${n}`).setAttribute('cy',point.y);});
        get(`push-${i}`).setAttribute('transform',`translate(${70+m.shift} 87) rotate(${record.direction==='left'?180:0})`);
        if(i){get('brace-line').setAttribute('d',braced?'M0 250L140 110':'');}
      });
      write(get('frame-title'),braced?entry.labels.braced:entry.labels.unbraced);
      write(get('brace-label'),braced?entry.labels.brace:'');
      reading=p===0?entry.labels.ready:`${entry.labels.reference}，${entry.labels.changed}；${braced?entry.labels.braced+'，'+entry.labels.fixed:entry.labels.unbraced+'，'+entry.labels.changed}`;
      note=entry.braces.find(b=>b.id===record.brace).note;
    } else if (record.kind === 'magnet') {
      const m = magnetModel(record.poles,p);
      get('fixed').setAttribute('transform','translate(170 0)');
      get('moving').setAttribute('transform',`translate(${m.center} 0)`);
      get('moving-label').setAttribute('x',m.center);
      get('force').setAttribute('transform',`translate(${m.center} 90) rotate(${m.attract ? 180 : 0})`);
      reading = m.attract ? 'S 极与 N 极相对：相互吸引' : 'S 极与 S 极相对：相互排斥';
      note = data.magnet.poles.find(m=>m.id===record.poles).note;
    } else if (record.kind === 'electromagnet') {
      const m = electromagnetModel(p,record.current,record.turns);
      get('clip').setAttribute('transform',`translate(190 ${190-m.lift})`);
      get('switch').setAttribute('d',m.on ? 'M390 235H435' : 'M390 235L427 210');
      get('aura').setAttribute('opacity',m.on ? .2 + m.strength * .6 : 0);
      get('strength').setAttribute('width',260 * m.strength);
      reading = `${m.on ? '开关闭合 · 通电吸起' : '开关断开'} · 电流设置 ${record.current} 档 · ${record.turns} 匝线圈`;
      note = p === 0 ? data.electromagnet.ready : m.on ? data.electromagnet.on : data.electromagnet.off;
      root.querySelectorAll('[data-experiment-action="phase"]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.value)===p)));
    } else {
      const m = machineModel(record.mode, record.mode === 'lever' ? record.fulcrum : record.run, p, record.pulley === 'moving');
      reading = `理想条件下，所需的力约为重物重力的 ${Math.round(m.effort * 100)}%`;
      note = data.machine.modes.find(mode => mode.id === record.mode).note;
      if (record.mode === 'lever') {
        for (const [key, value] of Object.entries({x1:m.left.x,y1:m.left.y,x2:m.right.x,y2:m.right.y})) get('beam').setAttribute(key, value);
        get('fulcrum').setAttribute('d', `M${m.pivot} 190l-15 28h30Z`);
        get('load').setAttribute('x', m.left.x - 18); get('load').setAttribute('y', m.left.y - 32);
        get('hand').setAttribute('transform', `translate(${m.right.x} ${m.right.y})`);
        reading += ` · 重物端 ${record.fulcrum / 10} 格，手端 ${(100 - record.fulcrum) / 10} 格`;
      } else if (record.mode === 'pulley') {
        const moving = record.pulley === 'moving';
        get('wheel').setAttribute('transform', `translate(320 ${m.wheelY}) rotate(${p * (moving ? -100 : 100)})`);
        get('rope').setAttribute('d', moving ? `M292 36V${m.wheelY}A28 28 0 0 0 348 ${m.wheelY}V${m.handY}` : `M292 ${m.loadY}V70A28 28 0 0 1 348 70V${m.handY}`);
        get('load').setAttribute('x', moving ? 302 : 274); get('load').setAttribute('y', m.loadY);
        for (const [key,value] of Object.entries({x1:320,x2:320,y1:moving ? m.wheelY + 28 : 36,y2:moving ? m.loadY : m.wheelY})) get('hook').setAttribute(key,value);
        get('hand').setAttribute('transform', `translate(348 ${m.handY}) rotate(${moving ? 180 : 0})`);
        note = data.machine.pulleys.find(mode => mode.id === record.pulley).note;
        reading += ` · 重物上升 ${Math.round(m.loadDistance)} 厘米，绳端移动 ${Math.round(m.handDistance)} 厘米`;
      } else {
        get('load').setAttribute('transform', `translate(${m.point.x} ${m.point.y}) rotate(${m.angle})`);
        reading += ` · 升高 1 米，沿坡走约 ${(m.length / 100).toFixed(2)} 米`;
      }
    }
    write(root.querySelector('[data-experiment-reading]'), reading);
    write(root.querySelector('[data-experiment-note]'), note);
    root.querySelectorAll('[data-experiment-input]').forEach(input => {
      const key = input.dataset.experimentInput, value = key === 'progress' ? Math.round(p * 100) : record[key];
      input.value = value;
      write(root.querySelector(`[data-experiment-output="${key}"]`), key === 'run' ? `${(value / 100).toFixed(1)} 米` : `${value}${key === 'progress' || key === 'fulcrum' ? '%' : key === 'turns' ? ' 匝' : ' 档'}`);
    });
    for (const action of ['mode','medium','pulley','poles','objectType','direction','brace']) root.querySelectorAll(`[data-experiment-action="${action}"]`).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.value === record[action])));
    sync(record);
  }
  function sync(record) {
    const root = record.root, playing = record === active, done = record.progress >= 1;
    const play = root.querySelector('[data-experiment-action="play"]');
    write(play, playing ? '暂停观察' : done ? '再看一次' : '播放一次');
    play.disabled = !canPlay(); play.setAttribute('aria-pressed', String(playing));
    root.querySelector('[data-experiment-action="previous"]').disabled = record.progress <= 0;
    root.querySelector('[data-experiment-action="next"]').disabled = done;
    write(root.querySelector('[data-experiment-status]'), !canPlay() ? '已减少动效，可拖动进度或逐步观察。' : playing ? '正在演示，可随时暂停。' : done ? '这次观察完成，可以改变条件再比较。' : '已暂停，改变条件后从头观察。');
  }
  function pause(fig) {
    if (!active || (fig && active.fig !== fig)) return;
    const record = active; active = null; generation++;
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = previous = null; sync(record);
  }
  function play(record) {
    if (!canPlay() || document.hidden || !record.fig.isConnected) return;
    pause(); window.SciProcess?.pause(); window.SciDemoMotion?.pause();
    if (record.progress >= 1) record.progress = 0;
    active = record; draw(record); const token = ++generation;
    const tick = now => {
      if (token !== generation || active !== record) return;
      if (document.hidden || !canPlay() || !record.fig.isConnected) { pause(); return; }
      if (previous !== null) record.progress = Math.min(1, record.progress + Math.max(0, Math.min(now - previous, 100)) / 6000);
      previous = now; draw(record);
      if (record.progress >= 1) { pause(); return; }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
  }
  function mount(fig) {
    if (!data || records.has(fig)) return;
    const root = fig.querySelector('[data-experiment]'); if (!root) return;
    const record = {fig,root,kind:root.dataset.experiment,progress:0,medium:'air',mode:'lever',pulley:'fixed',
      frequency:data.tone.frequency.initial,amplitude:data.tone.amplitude.initial,fulcrum:data.machine.fulcrum.initial,run:data.machine.run.initial,
      poles:'attract',current:data.electromagnet?.current.initial ?? 2,turns:data.electromagnet?.turns.initial ?? 8,
      objectType:'light',direction:'right',brace:'on'};
    records.set(fig, record); build(record);
    record.click = event => {
      const b = event.target.closest('[data-experiment-action]'); if (!b || b.disabled) return;
      const action = b.dataset.experimentAction;
      if (action === 'play') { if (active === record) pause(); else play(record); return; }
      pause(fig);
      if (['mode','medium','pulley','poles','objectType','direction','brace'].includes(action)) { record[action] = b.dataset.value; record.progress = 0; build(record); }
      else if (action === 'phase') { record.progress = clamp(b.dataset.value,0,1); draw(record); }
      else { record.progress = action === 'reset' ? 0 : clamp((action === 'next' ? Math.floor(record.progress * 4 + 1e-8) + 1 : Math.ceil(record.progress * 4 - 1e-8) - 1) / 4, 0, 1); draw(record); }
    };
    record.input = event => {
      const input = event.target, key = input.dataset.experimentInput; if (!key) return;
      pause(fig);
      if (key === 'progress') { record.progress = clamp(input.value, 0, 100) / 100; draw(record); }
      else { const limits = key === 'frequency' || key === 'amplitude' ? data.tone[key] : data[record.kind][key];
        record[key] = clamp(input.value, limits.min, limits.max); record.progress = 0; build(record); }
    };
    root.addEventListener('click', record.click); root.addEventListener('input', record.input);
    if (window.StudyEffects?.watch) record.unwatch = window.StudyEffects.watch(fig, () => pause(fig));
    else if (typeof IntersectionObserver === 'function') { const observer = new IntersectionObserver(entries => { if (entries.some(e => !e.isIntersecting)) pause(fig); }); observer.observe(fig); record.unwatch = () => observer.disconnect(); }
    root.querySelector('[data-experiment-action="play"]').hidden = false;
  }
  function remove(fig, record) { pause(fig); record.unwatch?.(); record.root.removeEventListener('click', record.click); record.root.removeEventListener('input', record.input); records.delete(fig); }
  const dispose = () => { for (const [fig, record] of records) remove(fig, record); };
  const prune = () => { for (const [fig, record] of records) if (!fig.isConnected) remove(fig, record); };
  const changed = () => { if (!canPlay()) pause(); records.forEach(sync); };
  document.addEventListener('study:effects-change', changed); media.addEventListener('change', changed);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', () => pause());
  window.SciExperiments = {html,mount,pause,dispose,prune};
})();

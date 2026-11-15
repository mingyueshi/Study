(() => {
  'use strict';

  const lab = document.getElementById('geometry-lab');
  const get = (name) => document.getElementById('geometry-' + name);
  const data = JSON.parse(get('lessons').textContent);
  const lessons = data.modes;
  const modes = [...lab.querySelectorAll('[data-mode]')];
  const panels = [...lab.querySelectorAll('[data-only]')];
  const axes = [...lab.querySelectorAll('[data-axis]')];
  const board = get('board');
  const piece = get('piece');
  const origin = get('origin');
  const guide = get('guide');
  const trace = get('trace');
  const from = get('from');
  const to = get('to');
  const handle = get('handle');
  const reading = get('reading');
  const feedback = get('feedback');
  const angleSlider = get('angle');
  const foldSlider = get('fold');
  const playButton = get('play');
  const demoStatus = get('demo-status');
  const shapeChoice = get('shape-choice');
  const showOrigin = get('show-origin');
  const motionMedia = matchMedia('(prefers-reduced-motion: reduce)');
  const canAnimate = () => !motionMedia.matches && (!window.StudyEffects || window.StudyEffects.motion === 'full');
  const progressKey = 'geometry_lab_challenges_v1';
  const challengeIds = new Set(Object.values(lessons).flatMap(lesson => lesson.challenges.map(item => item.id)));
  const challengeIndex = { translation: 0, rotation: 0, reflection: 0 };
  const assisted = { translation: false, rotation: false, reflection: false };
  let completed = readCompleted();
  let steps = [];
  let stepIndex = 0;
  let timer = null;
  const grid = 30;
  const tip = 60;
  const center = [300, 180];
  const start = [150, 150];
  const orbit = 120;
  const initial = { translation: [0, 0], rotation: 0, reflection: { axis: 'vertical', fold: 0 } };
  const state = { ...initial };
  let mode;
  let drag;

  const radians = (degrees) => degrees * Math.PI / 180;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const position = (x, y) => `translate(${x} ${y})`;
  const place = (node, x, y) => node.setAttribute('transform', position(x, y));

  function drawPoints(ax, ay, bx, by, changed) {
    place(from, ax, ay);
    place(to, bx, by);
    const label = to.querySelector('text');
    label.textContent = changed ? 'A′' : 'A';
    const close = changed && Math.hypot(ax - bx, ay - by) < 28;
    label.setAttribute('y', close ? 24 : -11);
    origin.toggleAttribute('hidden', !changed || !showOrigin.checked);
    from.toggleAttribute('hidden', !changed || !showOrigin.checked);
  }

  function drawTranslation() {
    const [dx, dy] = state.translation;
    const [x, y] = start;
    const tx = x + dx * grid;
    const ty = y + dy * grid;
    place(origin, x, y);
    place(piece, tx, ty);
    drawPoints(x + tip, y, tx + tip, ty, dx !== 0 || dy !== 0);
    guide.setAttribute('d', '');
    trace.setAttribute('d', `M${x + tip} ${y} H${tx + tip} V${ty}`);
    const moves = [];
    if (dx) moves.push(`向${dx > 0 ? '右' : '左'} ${Math.abs(dx)} 格`);
    if (dy) moves.push(`向${dy > 0 ? '下' : '上'} ${Math.abs(dy)} 格`);
    return moves.join('，') || '图形在起点';
  }

  function drawRotation() {
    const angle = state.rotation;
    const [x, y] = center;
    const cos = Math.cos(radians(angle));
    const sin = Math.sin(radians(angle));
    place(origin, x, y);
    piece.setAttribute('transform', `${position(x, y)} rotate(${angle})`);
    place(handle, x + orbit * cos, y + orbit * sin);
    drawPoints(x + tip, y, x + tip * cos, y + tip * sin, angle !== 0);
    const radius = 83;
    guide.setAttribute('d', angle === 0 ? '' : `M${x + radius} ${y} H${x} L${x + radius * cos} ${y + radius * sin}`);
    const sweep = angle > 0 ? 1 : 0;
    const fullCircle = Math.abs(angle) === 360;
    const arc = fullCircle
      ? `M${x + radius} ${y} a${radius} ${radius} 0 1 ${sweep} ${-2 * radius} 0 a${radius} ${radius} 0 1 ${sweep} ${2 * radius} 0`
      : `M${x + radius} ${y} A${radius} ${radius} 0 ${Math.abs(angle) > 180 ? 1 : 0} ${sweep} ${x + radius * cos} ${y + radius * sin}`;
    trace.setAttribute('d', angle === 0 ? '' : arc);
    const direction = angle < 0 ? '逆时针' : '顺时针';
    const label = angle === 0 ? '起点 · 0°' : `${direction} ${Math.abs(angle)}°`;
    angleSlider.value = angle;
    angleSlider.setAttribute('aria-valuetext', label);
    return label;
  }

  function drawReflection() {
    const { axis, fold } = state.reflection;
    const vertical = axis === 'vertical';
    const [cx, cy] = center;
    const [x, y] = vertical ? [150, cy] : [cx, 90];
    const ax = x + tip;
    const scale = Math.cos(Math.PI * fold / 100);
    const bx = vertical ? cx + (ax - cx) * scale : ax;
    const by = vertical ? y : cy + (y - cy) * scale;
    place(origin, x, y);
    const transform = vertical ? `scale(${scale} 1)` : `scale(1 ${scale})`;
    piece.setAttribute('transform', `${position(cx, cy)} ${transform} ${position(x - cx, y - cy)}`);
    guide.setAttribute('d', vertical ? `M${cx} 15 V345` : `M15 ${cy} H585`);
    drawPoints(ax, y, bx, by, fold > 0);
    if (fold === 50) {
      trace.setAttribute('d', vertical ? `M${cx} ${y - 60} v120` : `M${x - 60} ${cy} h120`);
    } else if (fold === 100) {
      const corner = vertical ? `M${cx - 10} ${y} v-10 h10` : `M${ax} ${cy - 10} h10 v10`;
      trace.setAttribute('d', `M${ax} ${y} L${bx} ${by} ${corner}`);
    }
    axes.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.axis === axis)));
    foldSlider.value = fold;
    const label = fold === 100 ? '完全翻开' : `翻折 ${fold}%`;
    foldSlider.setAttribute('aria-valuetext', label);
    const distance = vertical ? Math.abs(cx - ax) : Math.abs(cy - y);
    return fold === 100 ? `${label} · 两点各离折痕 ${distance / grid} 格` : label;
  }

  const draw = { translation: drawTranslation, rotation: drawRotation, reflection: drawReflection };

  function render() {
    trace.setAttribute('d', '');
    reading.textContent = draw[mode]();
  }

  function update(value) {
    pauseDemo();
    steps = [];
    stepIndex = 0;
    state[mode] = value;
    feedback.textContent = '';
    render();
    renderDemo();
  }

  function selectMode() {
    const requested = location.hash.slice(1);
    if (requested === 'main' && mode) return;
    pauseDemo();
    steps = [];
    stepIndex = 0;
    mode = Object.hasOwn(lessons, requested) ? requested : 'translation';
    lab.dataset.experiment = mode;
    modes.forEach((link) => {
      if (link.dataset.mode === mode) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    panels.forEach((panel) => panel.toggleAttribute('hidden', panel.dataset.only !== mode));
    feedback.textContent = '';
    render();
    renderMission();
    renderDemo();
  }

  function shift(dx, dy) {
    update([clamp(dx, -2, 12), clamp(dy, -2, 4)]);
  }

  function turn(angle) {
    update(clamp(angle, -360, 360));
  }

  lab.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.shift) {
      const [x, y] = state.translation;
      const [dx, dy] = button.dataset.shift.split(',').map(Number);
      shift(x + dx, y + dy);
    } else if (button.dataset.turn) {
      turn(state.rotation + Number(button.dataset.turn));
    } else if (button.dataset.axis && button.dataset.axis !== state.reflection.axis) {
      update({ axis: button.dataset.axis, fold: 0 });
    }
  });

  angleSlider.addEventListener('input', () => update(Number(angleSlider.value)));
  foldSlider.addEventListener('input', () => update({ ...state.reflection, fold: Number(foldSlider.value) }));
  get('reset').addEventListener('click', reset);
  get('practice').addEventListener('click', reset);
  get('previous').addEventListener('click', () => changeChallenge(-1));
  get('next').addEventListener('click', () => changeChallenge(1));
  shapeChoice.addEventListener('change', () => {
    const shape = data.shapes.find(item => item.id === shapeChoice.value);
    get('shape').setAttribute('points', shape.points.map(point => point.join(',')).join(' '));
    reset();
  });
  showOrigin.addEventListener('change', render);
  get('check').addEventListener('click', () => {
    const challenge = currentChallenge();
    if (assisted[mode]) {
      feedback.textContent = '已经看过演示啦！点「自己试试」，从起点独立完成一次吧。';
      return;
    }
    const { target } = challenge;
    const [dx, dy] = state.translation;
    const { axis, fold } = state.reflection;
    const solved = {
      translation: () => dx === target[0] && dy === target[1],
      rotation: () => state.rotation === target,
      reflection: () => axis === target && fold === 100,
    };
    const correct = solved[mode]();
    feedback.textContent = correct ? challenge.success : challenge.hint;
    if (correct) {
      completed = new Set([...readCompleted(), ...completed, challenge.id]);
      try {
        localStorage.setItem(progressKey, JSON.stringify([...completed]));
      } catch (error) {
        get('save-note').textContent = '浏览器暂时无法保存，完成记录只在本次打开时保留。';
      }
      renderMission();
    }
  });

  function readCompleted() {
    try {
      const saved = JSON.parse(localStorage.getItem(progressKey) || '[]');
      return new Set(Array.isArray(saved) ? saved.filter(id => challengeIds.has(id)) : []);
    } catch (error) {
      return new Set();
    }
  }

  function currentChallenge() {
    return lessons[mode].challenges[challengeIndex[mode]];
  }

  function renderMission() {
    const index = challengeIndex[mode];
    const challenges = lessons[mode].challenges;
    const challenge = currentChallenge();
    const mark = completed.has(challenge.id) ? ' · 已完成 ✓' : '';
    get('challenge-number').textContent = `${lessons[mode].label} · 第 ${index + 1} / ${challenges.length} 题${mark}`;
    get('task').textContent = challenge.task;
    get('previous').disabled = index === 0;
    get('next').disabled = index === challenges.length - 1;
    get('progress').textContent = `已独立完成 ${completed.size} / ${challengeIds.size} 道挑战`;
  }

  function changeChallenge(delta) {
    challengeIndex[mode] = clamp(challengeIndex[mode] + delta, 0, lessons[mode].challenges.length - 1);
    reset();
    renderMission();
  }

  function reset() {
    pauseDemo();
    if (drag && board.hasPointerCapture(drag.id)) board.releasePointerCapture(drag.id);
    steps = [];
    stepIndex = 0;
    assisted[mode] = false;
    state[mode] = initial[mode];
    feedback.textContent = '';
    render();
    renderDemo();
  }

  function buildSteps() {
    const { target } = currentChallenge();
    if (mode === 'translation') {
      const [dx, dy] = target;
      for (let x = 1; x <= Math.abs(dx); x++) steps.push([x * Math.sign(dx), 0]);
      for (let y = 1; y <= Math.abs(dy); y++) steps.push([dx, y * Math.sign(dy)]);
    } else if (mode === 'rotation') {
      for (let angle = 15; angle <= Math.abs(target); angle += 15) steps.push(angle * Math.sign(target));
    } else {
      for (let fold = 10; fold <= 100; fold += 10) steps.push({ axis: target, fold });
    }
  }

  function prepareDemo() {
    if (steps.length && stepIndex < steps.length) return;
    steps = [];
    stepIndex = 0;
    state[mode] = mode === 'reflection' ? { axis: currentChallenge().target, fold: 0 } : initial[mode];
    buildSteps();
    assisted[mode] = true;
    feedback.textContent = '';
    render();
  }

  function renderDemo() {
    let label = '▶ 看本题演示';
    if (stepIndex > 0 && stepIndex < steps.length) label = '▶ 继续演示';
    if (!canAnimate()) label = '逐步看演示';
    if (timer !== null) label = 'Ⅱ 暂停演示';
    playButton.textContent = label;
    if (stepIndex && stepIndex === steps.length) {
      demoStatus.textContent = '演示完成！点「自己试试」，从起点独立完成挑战。';
    } else if (stepIndex) {
      demoStatus.textContent = `${timer !== null ? '正在演示' : '已暂停'} · 第 ${stepIndex} / ${steps.length} 步`;
    } else {
      demoStatus.textContent = canAnimate() ? '演示会从起点开始，每一步都可以停下来看。'
        : '已减少动态效果。每点一次，就向前演示一步。';
    }
  }

  function pauseDemo() {
    clearTimeout(timer);
    timer = null;
    renderDemo();
  }

  function advanceDemo() {
    state[mode] = steps[stepIndex++];
    render();
    renderDemo();
  }

  function playTick() {
    advanceDemo();
    if (stepIndex < steps.length) timer = setTimeout(playTick, 240);
    else pauseDemo();
  }

  playButton.addEventListener('click', () => {
    if (timer !== null) {
      pauseDemo();
      return;
    }
    prepareDemo();
    if (!canAnimate()) {
      advanceDemo();
      return;
    }
    timer = setTimeout(playTick, 240);
    renderDemo();
  });
  get('step').addEventListener('click', () => {
    pauseDemo();
    prepareDemo();
    advanceDemo();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseDemo();
  });
  window.addEventListener('pagehide', pauseDemo);
  document.addEventListener('study:effects-change', pauseDemo);
  motionMedia.addEventListener('change', pauseDemo);
  window.addEventListener('storage', (event) => {
    if (event.key === progressKey || event.key === null) {
      completed = readCompleted();
      renderMission();
    }
  });

  function boardPoint(event) {
    const point = new DOMPoint(event.clientX, event.clientY);
    return point.matrixTransform(board.getScreenCTM().inverse());
  }

  board.addEventListener('pointerdown', (event) => {
    if (drag || !event.isPrimary || event.button !== 0) return;
    const moving = mode === 'translation' && event.target === piece;
    const turning = mode === 'rotation' && handle.contains(event.target);
    if (!moving && !turning) return;
    const { x, y } = boardPoint(event);
    pauseDemo();
    drag = {
      id: event.pointerId, mode, x, y, shift: state.translation,
      angle: state.rotation, bearing: Math.atan2(y - center[1], x - center[0]) * 180 / Math.PI,
    };
    board.setPointerCapture(event.pointerId);
    lab.dataset.dragging = '';
  });

  board.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== event.pointerId || drag.mode !== mode) return;
    const { x, y } = boardPoint(event);
    if (mode === 'translation') {
      const [dx, dy] = drag.shift;
      shift(dx + Math.round((x - drag.x) / grid), dy + Math.round((y - drag.y) / grid));
    } else {
      const [cx, cy] = center;
      const bearing = Math.atan2(y - cy, x - cx) * 180 / Math.PI;
      // 跨过正左方时也连续累计，保留顺逆方向和整圈读数。
      const delta = ((bearing - drag.bearing + 540) % 360) - 180;
      drag.angle = clamp(drag.angle + delta, -360, 360);
      drag.bearing = bearing;
      turn(Math.round(drag.angle));
    }
  });

  board.addEventListener('lostpointercapture', (event) => {
    if (drag?.id !== event.pointerId) return;
    drag = null;
    delete lab.dataset.dragging;
  });

  window.addEventListener('hashchange', selectMode);
  selectMode();
})();

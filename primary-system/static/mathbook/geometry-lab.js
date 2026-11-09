(() => {
  'use strict';

  const lab = document.getElementById('geometry-lab');
  const get = (name) => document.getElementById('geometry-' + name);
  const lessons = JSON.parse(get('lessons').textContent);
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
    from.toggleAttribute('hidden', !changed);
    const label = to.querySelector('text');
    label.textContent = changed ? 'A′' : 'A';
    const close = changed && Math.hypot(ax - bx, ay - by) < 28;
    label.setAttribute('y', close ? 24 : -11);
    origin.toggleAttribute('hidden', !changed);
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
    return moves.join('，') || '箭头在起点';
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
    trace.setAttribute('d', angle === 0 ? '' :
      `M${x + radius} ${y} A${radius} ${radius} 0 0 ${angle > 0 ? 1 : 0} ${x + radius * cos} ${y + radius * sin}`);
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
    state[mode] = value;
    feedback.textContent = '';
    render();
  }

  function selectMode() {
    const requested = location.hash.slice(1);
    if (requested === 'main' && mode) return;
    mode = Object.hasOwn(lessons, requested) ? requested : 'translation';
    lab.dataset.experiment = mode;
    modes.forEach((link) => {
      if (link.dataset.mode === mode) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    panels.forEach((panel) => panel.toggleAttribute('hidden', panel.dataset.only !== mode));
    feedback.textContent = '';
    render();
  }

  function shift(dx, dy) {
    update([clamp(dx, -2, 12), clamp(dy, -2, 4)]);
  }

  function turn(angle) {
    if (angle > 180) angle -= 360;
    if (angle < -180) angle += 360;
    update(angle);
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
  get('reset').addEventListener('click', () => update(initial[mode]));
  get('check').addEventListener('click', () => {
    const lesson = lessons[mode];
    const { target } = lesson;
    const [dx, dy] = state.translation;
    const { axis, fold } = state.reflection;
    const solved = {
      translation: () => dx === target[0] && dy === target[1],
      rotation: () => (state.rotation - target) % 360 === 0,
      reflection: () => axis === target && fold === 100,
    };
    feedback.textContent = solved[mode]() ? lesson.success : lesson.hint;
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
    drag = { id: event.pointerId, mode, x, y, shift: state.translation };
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
      turn(Math.round(Math.atan2(y - cy, x - cx) * 180 / Math.PI));
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

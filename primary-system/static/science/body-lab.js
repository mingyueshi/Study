(() => {
  'use strict';
  const root = document.querySelector('[data-expedition]');
  if (!root) return;
  const content = JSON.parse(document.getElementById('body-expedition-data').textContent);
  const get = selector => root.querySelector(selector);
  const pins = [...root.querySelectorAll('[data-map-organ]')];
  const shapes = [...root.querySelectorAll('[data-organ-shape]')];
  const dialog = document.querySelector('[data-organ-dialog]');
  const anatomyPanel = get('[data-anatomy-panel]');
  let dialogTrigger = null;
  const modes = [...root.querySelectorAll('[data-mission-mode]')];
  const sceneButtons = [...root.querySelectorAll('[data-scene]')];
  const steps = get('[data-scene-steps]');
  const play = get('[data-scene-play]');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let scene = content.scenarios[0];
  let step = 0;
  let mode = anatomyPanel ? 'anatomy' : 'explore';
  let playing = null;
  let generation = 0;
  let question = 0;
  let answered = false;
  let finished = false;
  const canPlay = () => !media.matches && (!window.StudyEffects || window.StudyEffects.motion === 'full');
  function syncPlayback() {
    play.disabled = !canPlay();
    play.textContent = playing === null ? '播放这条路线' : '暂停播放';
    play.setAttribute('aria-pressed', String(playing !== null));
    get('[data-scene-status]').textContent = !canPlay() ? '已减少动态效果，可以用上一步、下一步慢慢看。' : playing !== null ? '正在播放，可随时暂停。' : '已暂停。点数字步骤，也能直接跳到那里。';
  }
  function stop() {
    generation++;
    clearInterval(playing);
    playing = null;
    get('[data-scene-note]').setAttribute('aria-live', 'polite');
    syncPlayback();
  }
  function light(organId, showFile = true) {
    root.querySelectorAll('[data-map-art]').forEach(art => { art.dataset.active = organId ? String(art.dataset.mapArt === organId) : ''; });
    pins.forEach(pin => pin.setAttribute('aria-pressed', String(pin.dataset.mapOrgan === organId)));
    get('[data-organ-file]').hidden = !showFile;
    if (!showFile) return;
    const organ = content.organs.find(item => item.id === organId);
    get('[data-organ-name]').textContent = organ.name;
    get('[data-organ-description]').textContent = organ.description;
    get('[data-organ-link]').href = pins.find(pin => pin.dataset.mapOrgan === organId).dataset.lessonUrl;
  }
  function openOrgan(organId, trigger) {
    stop();
    light(organId);
    const organ = content.organs.find(item => item.id === organId);
    if (typeof dialog?.showModal !== 'function') {
      get('[data-organ-file]').scrollIntoView({ block: 'nearest' });
      return;
    }
    dialog.querySelector('[data-dialog-name]').textContent = organ.name;
    dialog.querySelector('[data-dialog-location]').textContent = organ.location;
    dialog.querySelector('[data-dialog-description]').textContent = organ.description;
    dialog.querySelector('[data-dialog-link]').href = get('[data-organ-link]').href;
    dialogTrigger = trigger;
    dialog.showModal();
  }
  dialog?.addEventListener('close', () => {
    dialogTrigger?.focus({ preventScroll: true });
    dialogTrigger = null;
  });
  function showStep(index) {
    step = index;
    const item = scene.steps[index];
    [...steps.children].forEach((li, i) => li.firstChild.setAttribute('aria-pressed', String(i === index)));
    get('[data-step-count]').textContent = `合作步骤 ${index + 1}／${scene.steps.length}`;
    get('[data-step-title]').textContent = item.title;
    get('[data-step-body]').textContent = item.body;
    get('[data-scene-prev]').disabled = index === 0;
    get('[data-scene-next]').disabled = index === scene.steps.length - 1;
    light(item.organ);
  }
  function showScene(id) {
    stop();
    scene = content.scenarios.find(item => item.id === id);
    sceneButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scene === id)));
    get('[data-scene-question]').textContent = scene.question;
    get('[data-scene-summary]').textContent = scene.summary;
    steps.replaceChildren();
    scene.steps.forEach((item, i) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      const number = document.createElement('span');
      number.textContent = i + 1;
      button.append(number, document.createTextNode(item.title));
      button.addEventListener('click', () => { stop(); showStep(i); });
      li.append(button);
      steps.append(li);
    });
    showStep(0);
  }
  function showQuestion() {
    answered = false;
    finished = false;
    light('', false);
    pins.forEach(pin => { pin.disabled = false; });
    root.dataset.revealed = 'false';
    const item = content.challenges[question];
    get('[data-challenge-count]').textContent = `器官定位 ${question + 1}／${content.challenges.length}`;
    get('[data-challenge-prompt]').textContent = item.prompt;
    const hint = get('[data-challenge-hint]');
    hint.hidden = false;
    hint.open = false;
    hint.querySelector('p').textContent = item.hint;
    get('[data-challenge-feedback]').textContent = '';
    get('[data-challenge-next]').disabled = true;
    get('[data-challenge-next]').textContent = question === content.challenges.length - 1 ? '查看挑战成果' : '下一题 →';
  }
  function switchMode(next) {
    stop();
    mode = next;
    root.dataset.mode = mode;
    modes.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.missionMode === mode)));
    if (anatomyPanel) anatomyPanel.hidden = mode !== 'anatomy';
    get('[data-scene-panel]').hidden = mode !== 'explore';
    get('[data-challenge-panel]').hidden = mode !== 'challenge';
    pins.forEach((pin, i) => {
      pin.disabled = false;
      pin.setAttribute('aria-label', mode === 'challenge' ? `位置 ${i + 1}` : content.organs[i].name);
      if (mode === 'challenge' || typeof dialog?.showModal !== 'function') {
        pin.removeAttribute('aria-haspopup');
        pin.removeAttribute('aria-controls');
      } else {
        pin.setAttribute('aria-haspopup', 'dialog');
        pin.setAttribute('aria-controls', dialog.id);
      }
    });
    shapes.forEach(shape => {
      const enabled = mode !== 'challenge';
      shape.setAttribute('tabindex', enabled ? '0' : '-1');
      shape.setAttribute('role', enabled ? 'button' : 'presentation');
      if (enabled) {
        shape.setAttribute('aria-label', content.organs.find(organ => organ.id === shape.dataset.organShape).name);
        shape.setAttribute('aria-haspopup', 'dialog');
        shape.setAttribute('aria-controls', dialog.id);
      } else {
        shape.removeAttribute('aria-label');
        shape.removeAttribute('aria-haspopup');
        shape.removeAttribute('aria-controls');
      }
    });
    if (mode === 'explore') showStep(step);
    else if (mode === 'challenge') showQuestion();
    else light('', false);
  }
  modes.forEach(button => button.addEventListener('click', () => switchMode(button.dataset.missionMode)));
  sceneButtons.forEach(button => button.addEventListener('click', () => showScene(button.dataset.scene)));
  pins.forEach(pin => pin.addEventListener('click', () => {
    const organ = pin.dataset.mapOrgan;
    if (mode !== 'challenge') { openOrgan(organ, pin); return; }
    if (answered || finished) return;
    const item = content.challenges[question];
    const correct = organ === item.organ;
    const feedback = get('[data-challenge-feedback]');
    feedback.dataset.correct = String(correct);
    feedback.textContent = correct ? `找到了！${item.explanation}` : `这里是${content.organs.find(part => part.id === organ).name}。再观察一下。${item.hint}`;
    if (correct) {
      answered = true;
      root.dataset.revealed = 'true';
      pins.forEach(button => { button.disabled = true; });
      light(organ);
      get('[data-challenge-next]').disabled = false;
      window.BodyStudy?.locate(item.id);
      get('[data-challenge-next]').focus({ preventScroll: true });
    }
  }));
  shapes.forEach(shape => {
    const activate = () => { if (mode !== 'challenge') openOrgan(shape.dataset.organShape, shape); };
    shape.addEventListener('click', activate);
    shape.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
      }
    });
  });
  get('[data-challenge-next]').addEventListener('click', () => {
    if (!answered) return;
    if (question < content.challenges.length - 1) { question++; showQuestion(); pins[0].focus({ preventScroll: true }); }
    else {
      finished = true;
      get('[data-challenge-count]').textContent = '七位身体伙伴，全部找到了！';
      get('[data-challenge-prompt]').textContent = '你已经完成这一轮定位挑战。';
      get('[data-challenge-feedback]').textContent = '试着向家人介绍其中一个器官：它在哪里？它能帮我们做什么？';
      get('[data-challenge-next]').disabled = true;
      get('[data-challenge-hint]').hidden = true;
    }
  });
  get('[data-challenge-restart]').addEventListener('click', () => { question = 0; showQuestion(); });
  get('[data-scene-prev]').addEventListener('click', () => { stop(); if (step > 0) showStep(step - 1); });
  get('[data-scene-next]').addEventListener('click', () => { stop(); if (step < scene.steps.length - 1) showStep(step + 1); });
  play.addEventListener('click', () => {
    if (playing !== null) { stop(); return; }
    if (!canPlay() || document.hidden) return;
    if (step === scene.steps.length - 1) showStep(0);
    get('[data-scene-note]').setAttribute('aria-live', 'off');
    const token = ++generation;
    playing = setInterval(() => {
      if (token !== generation) return;
      if (!canPlay() || document.hidden || step === scene.steps.length - 1) { stop(); return; }
      showStep(step + 1);
      if (step === scene.steps.length - 1) stop();
    }, 4500);
    syncPlayback();
  });
  const effectsChanged = () => { if (!canPlay()) stop(); syncPlayback(); };
  media.addEventListener('change', effectsChanged);
  document.addEventListener('study:effects-change', effectsChanged);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);
  if (window.StudyEffects?.watch) window.StudyEffects.watch(root, stop);
  else if (typeof IntersectionObserver === 'function') new IntersectionObserver(entries => { if (entries.some(entry => !entry.isIntersecting)) stop(); }).observe(root);
  showScene(scene.id);
  switchMode(anatomyPanel ? 'anatomy' : 'explore');
  root.hidden = false;
})();

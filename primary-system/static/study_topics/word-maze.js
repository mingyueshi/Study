(() => {
  'use strict';
  const root = document.querySelector('[data-word-maze]');
  if (!root) return;

  const gates = [...root.querySelectorAll('[data-maze-gate]')];
  const stops = [...root.querySelectorAll('[data-maze-stop]')];
  const progress = root.querySelector('[data-maze-progress]');
  const storageNote = root.querySelector('[data-maze-storage]');
  const finish = root.querySelector('[data-maze-finish]');
  const exit = root.querySelector('[data-maze-exit]');
  const keys = gates.map(gate => `word-maze:v1:${root.dataset.storageScope}:${gate.dataset.id}:${gate.dataset.revision}`);
  const statuses = ['', 'seen', 'guided', 'independent'];
  const states = gates.map(() => '');
  let current = 0;

  function storageUnavailable() {
    storageNote.textContent = '浏览器暂时不能保存进度，仍可继续闯关。本页刷新后会重新开始。';
  }

  function refreshState(index) {
    try {
      const stored = localStorage.getItem(keys[index]);
      if (statuses.indexOf(stored) > statuses.indexOf(states[index])) states[index] = stored;
    } catch {
      storageUnavailable();
    }
  }

  function saveState(index, status) {
    refreshState(index);
    if (statuses.indexOf(status) <= statuses.indexOf(states[index])) return;
    states[index] = status;
    try { localStorage.setItem(keys[index], status); } catch { storageUnavailable(); }
  }

  function cleared(status) {
    return status === 'guided' || status === 'independent';
  }

  function nextUncleared() {
    const index = states.findIndex(status => !cleared(status));
    return index < 0 ? gates.length : index;
  }

  function updateMap() {
    const next = nextUncleared();
    const solved = states.filter(cleared).length;
    const independent = states.filter(status => status === 'independent').length;
    progress.textContent = `已走过 ${solved} / ${gates.length} 关 · 自己答对 ${independent} 关`;
    finish.querySelector('[data-maze-finish-count]').textContent =
      `自己答对 ${independent} 关，看答案后练会 ${solved - independent} 关。可以回看任何一关。`;
    stops.forEach((button, i) => {
      const state = cleared(states[i]) ? '已通过' : (i <= next ? '待闯关' : '未到达');
      button.querySelector('[data-stop-state]').textContent = state;
      button.dataset.stopState = cleared(states[i]) ? 'cleared' : 'pending';
      button.disabled = i > next && !cleared(states[i]);
      if (i === current) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    exit.disabled = next !== gates.length;
    if (current === gates.length) exit.setAttribute('aria-current', 'step');
    else exit.removeAttribute('aria-current');
  }

  function showGate(index, focus = false) {
    current = index;
    gates.forEach((gate, i) => { gate.hidden = i !== current; });
    finish.hidden = current !== gates.length;
    updateMap();
    if (focus) (gates[current] || finish).querySelector('h3').focus();
  }

  const resetGates = gates.map((gate, index) => {
    const doors = gate.querySelector('[data-maze-doors]');
    const clue = gate.querySelector('[data-maze-clue]');
    const reason = gate.querySelector('[data-maze-reason]');
    const feedback = gate.querySelector('[data-maze-feedback]');
    const next = gate.querySelector('[data-maze-next]');
    const hint = gate.querySelector('[data-maze-hint]');
    const reveal = gate.querySelector('[data-maze-reveal]');
    const choices = [...doors.querySelectorAll('[data-maze-choice]')];

    function toggleReason(open) {
      reason.hidden = !open;
      reason.open = open;
      reveal.setAttribute('aria-expanded', String(open));
      reveal.textContent = open ? '收起参考答案' : '看参考答案';
    }

    function resetGate() {
      delete feedback.dataset.result;
      feedback.textContent = '';
      clue.hidden = true;
      hint.setAttribute('aria-expanded', 'false');
      toggleReason(false);
      next.hidden = true;
      choices.forEach(choice => {
        delete choice.dataset.result;
        choice.removeAttribute('aria-disabled');
      });
    }

    choices.forEach(choice => choice.addEventListener('click', () => {
      if (!next.hidden) return;
      const correct = choice.dataset.mazeChoice === gate.dataset.answer;
      choices.forEach(button => { delete button.dataset.result; });
      choice.dataset.result = correct ? 'correct' : 'retry';
      feedback.dataset.result = choice.dataset.result;
      feedback.textContent = correct ? choice.dataset.feedback : `这条路走不通。${choice.dataset.feedback}可以再选一次。`;
      if (!correct) return;

      refreshState(index);
      const guided = states[index] === 'seen' || states[index] === 'guided';
      saveState(index, guided ? 'guided' : 'independent');
      choices.forEach(button => button.setAttribute('aria-disabled', 'true'));
      toggleReason(true);
      next.hidden = false;
      updateMap();
    }));

    hint.addEventListener('click', () => {
      clue.hidden = !clue.hidden;
      hint.setAttribute('aria-expanded', String(!clue.hidden));
    });
    reveal.addEventListener('click', () => {
      if (reason.hidden) saveState(index, 'seen');
      toggleReason(reason.hidden);
    });
    next.addEventListener('click', () => showGate(Math.min(index + 1, nextUncleared()), true));
    stops[index].addEventListener('click', () => {
      if (current !== index) resetGate();
      showGate(index, true);
    });
    reason.classList.add('maze-reason-enhanced');
    toggleReason(false);
    doors.hidden = false;
    gate.querySelector('[data-maze-actions]').hidden = false;
    return resetGate;
  });

  exit.addEventListener('click', () => showGate(gates.length, true));
  root.querySelector('[data-maze-replay]').addEventListener('click', () => {
    resetGates.forEach(resetGate => resetGate());
    showGate(0, true);
  });
  window.addEventListener('storage', event => {
    if (event.key === null) return;
    const index = keys.indexOf(event.key);
    if (index < 0) return;
    refreshState(index);
    updateMap();
  });

  keys.forEach((_, index) => refreshState(index));
  root.querySelector('[data-maze-map]').hidden = false;
  storageNote.hidden = false;
  progress.hidden = false;
  showGate(nextUncleared());
})();

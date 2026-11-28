'use strict';

(() => {
  const root = document.querySelector('[data-english-comparison]');
  if (!root) return;

  const scenes = JSON.parse(document.getElementById('english-comparison-scenes').textContent);
  const form = root.querySelector('.ec-controls');
  const inputs = Array.from(form.querySelectorAll('input[type="checkbox"][name="item"]'));
  const boards = root.querySelectorAll('[data-ec-board]');
  const result = root.querySelector('[data-ec-result]');
  const selection = root.querySelector('[data-ec-selection]');
  const families = root.querySelectorAll('[data-ec-family]');
  let picked = form.dataset.picked.split(',').filter(Boolean);
  let playback = 0;

  form.querySelector('[data-ec-apply]').hidden = true;
  form.addEventListener('change', (event) => {
    const state = new FormData(form);
    const count = Number(state.get('count'));
    const input = event.target;

    if (inputs.includes(input)) {
      if (input.checked && picked.length === count) {
        input.checked = false;
        selection.textContent = `已经选满 ${count} 样。先拿下其中一样，再换上新物品。`;
        return;
      }
      if (input.checked) picked.push(input.value);
      else picked = picked.filter(id => id !== input.value);
    }
    picked = picked.slice(0, count);
    inputs.forEach((item) => { item.checked = picked.includes(item.value); });

    const scene = scenes[state.get('scene')];
    const direction = scene.directions[state.get('direction')];
    const active = picked.length === count ? direction.results[picked.slice().sort().join(',')] : null;
    playback += 1;
    window.TTS?.stopSequence();

    for (const board of boards) {
      board.hidden = board.dataset.ecBoard !== scene.id;
      if (board.hidden) continue;
      board.dataset.count = count;
      board.querySelector('[data-ec-empty]').hidden = picked.length !== 0;
      for (const row of board.querySelectorAll('[data-item-id]')) {
        row.hidden = !picked.includes(row.dataset.itemId);
        row.toggleAttribute('data-highlight', active?.winner === row.dataset.itemId);
      }
    }
    root.querySelectorAll('[data-choice-direction]').forEach((label) => {
      const choice = scene.directions[label.dataset.choiceDirection];
      label.textContent = count === 3 ? choice.super_label : choice.label;
    });
    scene.items.forEach((item, index) => {
      inputs[index].closest('label').querySelector('[data-item-name]').textContent = item.name;
    });
    families.forEach((family) => { family.hidden = family.dataset.ecFamily !== direction.family; });
    selection.textContent = active
      ? `已选 ${count} 样。点一下已选物品，就能拿下它。`
      : `已选 ${picked.length}／${count} 样，选满就会显示例句。`;
    result.hidden = !active;
    if (active) {
      result.querySelectorAll('[data-ec-field]').forEach((node) => {
        node.textContent = active[node.dataset.ecField];
      });
      const speaker = result.querySelector('[data-ec-say]');
      speaker.dataset.ecSay = active.en;
      speaker.setAttribute('aria-label', '听整句 ' + active.en);
    }
    root.querySelectorAll('[data-ec-status]').forEach((status) => { status.textContent = ''; });

    const url = new URL(window.location.href);
    for (const key of ['scene', 'count', 'direction']) url.searchParams.set(key, state.get(key));
    url.searchParams.delete('item');
    for (const id of picked.length ? picked : ['']) url.searchParams.append('item', id);
    window.history.replaceState(window.history.state, '', url);
  });

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-ec-say]');
    if (button) {
      const status = button.closest('[data-ec-audio-group]').querySelector('[data-ec-status]');
      const id = ++playback;
      const failure = '暂时无法点读，请检查设备是否有可用的英语语音。';
      status.textContent = '';
      if (!window.TTS) {
        status.textContent = failure;
        return;
      }
      window.TTS.stopSequence();
      window.TTS.speak(button.dataset.ecSay, {
        lang: 'en-US',
        rate: 0.82,
        onerror: ({error}) => {
          if (id === playback && !['canceled', 'interrupted'].includes(error)) status.textContent = failure;
        },
      });
      return;
    }

    const option = event.target.closest('[data-ec-option]');
    if (!option) return;
    const question = option.closest('[data-ec-question]');
    const correct = option.textContent === question.dataset.answer;
    for (const choice of question.querySelectorAll('[data-ec-option]')) {
      choice.setAttribute('aria-pressed', String(choice === option));
    }
    question.dataset.result = correct ? 'correct' : 'retry';
    question.querySelector('[data-ec-feedback]').textContent = correct ? '答对了！' : '再试一次。';
    question.querySelector('[data-ec-answer]').hidden = !correct;
  });
})();

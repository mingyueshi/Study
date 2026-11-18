/* 动物与植物共用观察记录和识别练习，直接使用各自档案的照片、线索和地点。 */
(() => {
  'use strict';

  function recordPrefix(life, map) {
    return `primary.${life === 'plant' ? 'plants' : 'animals'}.observed.v1.${map === 'world' ? 'world' : 'china'}.`;
  }

  function createStore(storage, prefix, ids) {
    const seen = new Set();
    let available = Boolean(storage);
    function reload() {
      if (!available) return;
      try {
        for (const id of ids) {
          if (storage.getItem(prefix + id) === '1') seen.add(id);
          else seen.delete(id);
        }
      } catch (_) { available = false; }
    }
    reload();
    return {
      has: id => seen.has(id),
      get count() { return seen.size; },
      get available() { return available; },
      reload,
      toggle(id) {
        if (!ids.includes(id)) return;
        if (seen.has(id)) seen.delete(id); else seen.add(id);
        try { storage.setItem(prefix + id, seen.has(id) ? '1' : '0'); }
        catch (_) { available = false; }
      },
    };
  }

  function shuffle(items, random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function createRound(pool, animals, random = Math.random) {
    const unique = [...new Map(pool.map(animal => [animal.id, animal])).values()];
    const questions = shuffle(unique, random).slice(0, 5).map(animal => ({
      animal,
      options: shuffle([animal, ...shuffle(animals.filter(item => item.id !== animal.id), random).slice(0, 3)], random),
    }));
    let index = 0;
    const answers = [];
    return {
      questions, answers,
      get index() { return index; },
      get current() { return questions[index]; },
      get finished() { return index >= questions.length; },
      get score() { return answers.filter((id, i) => id === questions[i].animal.id).length; },
      get missed() { return questions.filter((q, i) => answers[i] && answers[i] !== q.animal.id).map(q => q.animal); },
      answer(id) {
        if (answers[index] || !questions[index]?.options.some(item => item.id === id)) return false;
        answers[index] = id;
        return true;
      },
      next() { if (answers[index]) index++; },
    };
  }

  function mount({root, animals, habitats, assets, esc, getVisible, getSelected, onFilter, onReset, onChoose}) {
    const flora = root.dataset.life === 'plant';
    const noun = flora ? '植物' : '动物';
    const find = selector => root.querySelector(selector);
    const search = find('#gm-animal-search');
    const recordFilter = find('#gm-animal-record-filter');
    const progress = find('#gm-animal-progress');
    const progressLabel = find('#gm-animal-progress-label');
    const notice = find('#gm-animal-storage-note');
    const randomButton = find('[data-animal-random]');
    const empty = find('#gm-animal-empty');
    const status = find('#gm-animal-search-status');
    const quiz = find('#gm-animal-quiz');
    const quizBody = find('#gm-animal-quiz-body');
    const mode = find('#gm-animal-quiz-mode');
    const start = find('[data-quiz-start]');
    const prefix = recordPrefix(root.dataset.life, root.dataset.map);
    let storage;
    try { storage = window.localStorage; } catch (_) { /* 仍可在当前页面观察 */ }
    const store = createStore(storage, prefix, animals.map(animal => animal.id));
    const byId = new Map(animals.map(animal => [animal.id, animal]));
    const habitatNames = new Map(habitats.map(habitat => [habitat.id, habitat.name]));
    let round = null;
    let roundMode = 'photo';

    function reset() {
      search.value = '';
      recordFilter.value = 'all';
      window.StudyChoices?.sync(recordFilter);
      onReset();
    }

    function refresh(total) {
      progress.max = animals.length;
      progress.value = store.count;
      progressLabel.textContent = `已观察 ${store.count}／${animals.length} 种`;
      notice.textContent = store.available ? '记录保存在当前浏览器，中国和世界分开记录。' : '浏览器暂时无法保存，记录仅在本次打开时有效。';
      status.textContent = total ? `找到 ${total} 种${noun}` : '没有找到，试试更短的词或清除筛选。';
      randomButton.disabled = !total;
      start.disabled = !total || Boolean(round && !round.finished);
      empty.hidden = total > 0;
      for (const item of root.querySelectorAll('[data-animal]')) {
        const observed = store.has(item.dataset.animal);
        item.dataset.observed = String(observed);
        const name = byId.get(item.dataset.animal);
        item.setAttribute('aria-label', `${name.name}，${name.place}${observed ? '，已观察' : ''}`);
      }
    }

    function cardTools(animal) {
      const visible = getVisible();
      const index = visible.indexOf(animal);
      return `<div class="gm-animal-record-tools">
        <button type="button" data-observe="${animal.id}" aria-pressed="${store.has(animal.id)}">${store.has(animal.id) ? '✓ 已观察，再点可取消' : '我观察过了'}</button>
        <div class="gm-animal-browse"><button type="button" data-animal-step="-1" ${index <= 0 ? 'disabled' : ''}>← 上一个</button>
        <span>${index + 1}／${visible.length}</span><button type="button" data-animal-step="1" ${index >= visible.length - 1 ? 'disabled' : ''}>下一个 →</button></div>
      </div>`;
    }

    function renderQuestion() {
      if (round.finished) {
        const missed = round.missed;
        quizBody.innerHTML = `<h3 tabindex="-1" class="gm-quiz-heading">本轮答对 ${round.score}／${round.questions.length} 题</h3>
          <p>${missed.length ? '这些朋友还需要再认识一下，点名字可以看地图档案。' : '这一轮都认出来了！去地图上继续观察吧。'}</p>
          <div class="gm-quiz-review">${missed.map(animal => `<button type="button" data-quiz-reveal="${animal.id}">${esc(animal.name)} ↗</button>`).join('')}</div>
          ${missed.length ? '<button type="button" data-quiz-retry>再练本轮错题</button>' : ''}`;
        mode.disabled = false;
        start.textContent = '再来一轮';
        refresh(getVisible().length);
      } else {
        const {animal, options} = round.current;
        quizBody.innerHTML = `<h3 tabindex="-1" class="gm-quiz-heading">第 ${round.index + 1}／${round.questions.length} 题 · ${roundMode === 'photo' ? '照片里是谁？' : '线索说的是谁？'}</h3>
          <div class="gm-quiz-question">
            ${roundMode === 'photo' ? `<img class="gm-quiz-photo" src="${esc(new URL(animal.id + '.jpg', assets).href)}" alt="待辨认的${noun}"><p class="gm-quiz-photo-fallback" hidden>照片暂时没打开，读这条线索试试：${esc(animal.clue)}</p>` : `<p class="gm-quiz-clue">${esc(animal.clue)}</p>`}
            <div><div class="gm-quiz-options">${options.map(option => `<button type="button" data-quiz-answer="${option.id}">${esc(option.name)}</button>`).join('')}</div>
              <details class="gm-quiz-hint"><summary>给我一点提示</summary><p>它的${flora ? '生长环境' : '代表栖息地'}属于「${esc(habitatNames.get(animal.habitat))}」。</p></details>
            </div>
          </div>
          <p class="gm-quiz-feedback" role="status"></p>
          <div class="gm-quiz-actions" hidden><button type="button" data-quiz-reveal="${animal.id}">在地图上看它 ↗</button><button type="button" data-quiz-next>${round.index === round.questions.length - 1 ? '看看本轮结果' : '下一题 →'}</button></div>`;
        const photo = quizBody.querySelector('.gm-quiz-photo');
        photo?.addEventListener('error', () => {
          photo.hidden = true;
          quizBody.querySelector('.gm-quiz-photo-fallback').hidden = false;
        }, {once: true});
      }
      quizBody.querySelector('.gm-quiz-heading')?.focus({preventScroll: true});
      quizBody.scrollIntoView({block: 'start', behavior: 'instant'});
    }

    function startRound(pool) {
      if (!pool.length) return;
      round = createRound(pool, animals);
      roundMode = mode.value;
      mode.disabled = true;
      start.disabled = true;
      quiz.open = true;
      find('[data-quiz-stop]').hidden = false;
      renderQuestion();
    }

    search.addEventListener('input', onFilter);
    recordFilter.addEventListener('change', onFilter);
    find('[href="#gm-animal-quiz"]').addEventListener('click', () => { quiz.open = true; });
    root.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button || button.disabled) return;
      if (button.hasAttribute('data-animal-reset')) {
        reset();
        if (!button.isConnected) search.focus({preventScroll: true});
      }
      if (button.hasAttribute('data-animal-random')) {
        const visible = getVisible();
        const unseen = visible.filter(animal => !store.has(animal.id));
        const pool = unseen.length ? unseen : visible;
        const alternatives = pool.filter(animal => animal !== getSelected());
        const choices = alternatives.length ? alternatives : pool;
        if (choices.length) onChoose(choices[Math.floor(Math.random() * choices.length)]);
      }
      if (button.dataset.observe) {
        store.toggle(button.dataset.observe);
        onFilter();
        (find('[data-observe]') || find('#gm-animal-card [data-animal-reset]'))?.focus({preventScroll: true});
      }
      if (button.dataset.animalStep) {
        const visible = getVisible();
        const animal = visible[visible.indexOf(getSelected()) + Number(button.dataset.animalStep)];
        if (animal) {
          onChoose(animal);
          const next = find(`[data-animal-step="${button.dataset.animalStep}"]`);
          (next?.disabled ? find('[data-observe]') : next)?.focus({preventScroll: true});
        }
      }
      if (button.hasAttribute('data-quiz-start')) startRound(getVisible());
      if (button.hasAttribute('data-quiz-retry') && round?.finished) startRound(round.missed);
      if (button.hasAttribute('data-quiz-stop')) {
        round = null;
        quizBody.innerHTML = '<p>练习已结束，可以换一种方式再试试。</p>';
        mode.disabled = false;
        button.hidden = true;
        refresh(getVisible().length);
        start.focus({preventScroll: true});
      }
      if (button.dataset.quizAnswer && round?.answer(button.dataset.quizAnswer)) {
        const animal = round.current.animal;
        for (const option of quizBody.querySelectorAll('[data-quiz-answer]')) {
          option.disabled = true;
          option.dataset.result = option.dataset.quizAnswer === animal.id ? 'correct' : option === button ? 'wrong' : '';
        }
        const correct = button.dataset.quizAnswer === animal.id;
        quizBody.querySelector('.gm-quiz-feedback').textContent = `${correct ? '答对了！' : '再认识一下：'}这是${animal.name}。代表地点：${animal.place}。${animal.clue}`;
        quizBody.querySelector('.gm-quiz-actions').hidden = false;
        quizBody.querySelector('[data-quiz-next]').focus();
      }
      if (button.hasAttribute('data-quiz-next') && round) {
        round.next();
        renderQuestion();
        if (round.finished) find('[data-quiz-stop]').hidden = true;
      }
      if (button.dataset.quizReveal) {
        const animal = byId.get(button.dataset.quizReveal);
        if (!getVisible().includes(animal)) reset();
        onChoose(animal);
      }
    });
    window.addEventListener('storage', event => {
      if (event.key === null || event.key.startsWith(prefix)) { store.reload(); onFilter(); }
    });
    return {
      cardTools, refresh,
      matches(animal) {
        const words = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
        const haystack = [animal.name, animal.scientificName, animal.place, animal.home, animal.adaptation, animal.clue, habitatNames.get(animal.habitat)].join(' ').toLocaleLowerCase();
        return words.every(word => haystack.includes(word))
          && (recordFilter.value === 'all' || store.has(animal.id) === (recordFilter.value === 'seen'));
      },
    };
  }

  const api = {recordPrefix, createStore, createRound, mount};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.GMAnimalLearning = api;
})();

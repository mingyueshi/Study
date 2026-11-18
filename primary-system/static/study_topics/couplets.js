(() => {
  'use strict';

  const root = document.querySelector('.couplets-workshop');
  const course = JSON.parse(document.getElementById('couplets-data').textContent);
  const examples = new Map(course.examples.map(example => [example.id, example]));
  const prefix = `couplets_v1:${root.dataset.storageScope}:`;
  const progress = root.querySelector('[data-progress]');
  const forms = [...root.querySelectorAll('[data-quiz]')];
  const answers = new Map();
  let progressStored = true;

  function readLocal(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }

  function updateProgress() {
    const values = [...answers.values()];
    const independent = values.filter(value => value === 'independent').length;
    const assisted = values.filter(value => value === 'assisted').length;
    progress.textContent = `共 ${forms.length} 题 · 自己答对 ${independent} 题 · 看答案后练会 ${assisted} 题`;
    if (!progressStored) progress.textContent += '。浏览器暂时不能保存，当前页面仍可练习。';
  }

  forms.forEach(form => {
    const question = form.closest('[data-question]');
    const feedback = form.querySelector('[role="status"]');
    const hint = question.querySelector('[data-hint]').textContent;
    const explanation = question.querySelector('[data-explanation]').textContent;
    const key = `${prefix}quiz:${form.dataset.questionId}:${form.dataset.revision}`;
    const stored = readLocal(key);
    if (['independent', 'assisted', 'seen'].includes(stored)) answers.set(key, stored);
    let revealed = ['assisted', 'seen'].includes(stored);
    if (stored === 'independent') feedback.textContent = '上次已经自己答对，今天可以再试一遍。';
    if (stored === 'assisted') feedback.textContent = '上次看答案后练会，今天可以再读一遍。';

    function record(value) {
      if (answers.get(key) === 'independent' || readLocal(key) === 'independent') {
        answers.set(key, 'independent');
        updateProgress();
        return;
      }
      answers.set(key, value);
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { progressStored = false; }
      updateProgress();
    }

    question.querySelector('[data-reveal]').addEventListener('toggle', event => {
      if (!event.target.open) return;
      revealed = true;
      if (!answers.has(key)) record('seen');
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const choice = new FormData(form).get('choice');
      const correct = choice === form.dataset.answer;
      feedback.dataset.result = correct ? 'correct' : 'retry';
      feedback.textContent = correct ? `对啦！${explanation}` : `再试一次。${hint}`;
      if (correct) record(revealed ? 'assisted' : 'independent');
    });
    form.addEventListener('change', () => {
      feedback.textContent = '';
      delete feedback.dataset.result;
    });
    form.hidden = false;
  });
  progress.hidden = false;
  updateProgress();

  const category = root.querySelector('[data-category]');
  const search = root.querySelector('[data-search]');
  const cards = [...root.querySelectorAll('[data-example]')];
  function filterExamples() {
    const query = search.value.trim();
    let count = 0;
    cards.forEach(card => {
      const example = examples.get(card.dataset.example);
      card.hidden = Boolean((category.value && example.category !== category.value) || !card.textContent.includes(query));
      if (!card.hidden) count += 1;
    });
    root.querySelector('[data-example-count]').textContent = count ? `找到 ${count} 副例联` : '还没有找到，换个词试试。';
  }
  category.addEventListener('change', filterExamples);
  search.addEventListener('input', filterExamples);
  root.querySelector('[data-example-tools]').hidden = false;
  root.querySelectorAll('[data-example-actions]').forEach(actions => { actions.hidden = false; });
  function revealExampleLink() {
    const card = cards.find(item => '#' + item.id === location.hash);
    if (!card) return;
    category.value = '';
    window.StudyChoices?.sync(category);
    search.value = '';
    filterExamples();
    card.scrollIntoView({block: 'start'});
  }
  window.addEventListener('hashchange', revealExampleLink);
  filterExamples();
  revealExampleLink();

  let activeRead = null;
  let readingSequence = 0;
  function stopReading() {
    readingSequence += 1;
    window.speechSynthesis?.cancel();
    if (activeRead) activeRead.textContent = '听一听';
    activeRead = null;
  }
  root.querySelectorAll('[data-read]').forEach(button => {
    button.disabled = !('speechSynthesis' in window);
    if (button.disabled) button.textContent = '浏览器暂不支持朗读';
    button.addEventListener('click', () => {
      const stopping = activeRead === button;
      stopReading();
      if (stopping) return;
      const example = examples.get(button.dataset.read);
      const sequence = readingSequence;
      activeRead = button;
      button.textContent = '停止朗读';
      const finished = () => {
        if (sequence !== readingSequence || activeRead !== button) return;
        button.textContent = '听一听';
        activeRead = null;
      };
      window.SpeechKit.speak(`${example.upper_text}。${example.lower_text}。`, {
        lang: 'zh-CN', rate: 0.75, onend: finished,
        onerror: () => {
          if (sequence !== readingSequence) return;
          finished();
          button.textContent = '朗读未成功，点此重试';
        },
      });
    });
  });
  window.addEventListener('pagehide', stopReading);

  const puzzle = root.querySelector('[data-puzzle]');
  const puzzleSelect = puzzle.querySelector('[data-puzzle-select]');
  const bank = puzzle.querySelector('[data-puzzle-bank]');
  const answer = puzzle.querySelector('[data-puzzle-answer]');
  const puzzleFeedback = puzzle.querySelector('[data-puzzle-feedback]');
  let tokens = [], selected = [], shuffled = [];

  function renderPuzzle() {
    bank.replaceChildren();
    answer.replaceChildren();
    shuffled.forEach(index => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'couplets-plain';
      button.textContent = tokens[index];
      button.disabled = selected.includes(index);
      button.addEventListener('click', () => {
        selected.push(index);
        renderPuzzle();
        const next = bank.querySelector('button:enabled') || puzzle.querySelector('[data-puzzle-check]');
        next.focus();
      });
      bank.append(button);
    });
    selected.forEach((index, position) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'couplets-button';
      button.textContent = tokens[index];
      button.setAttribute('aria-label', `拿回第 ${position + 1} 个词语${tokens[index]}`);
      button.addEventListener('click', () => {
        selected.splice(position, 1);
        renderPuzzle();
        bank.querySelector('button:enabled').focus();
      });
      answer.append(button);
    });
    if (!selected.length) answer.textContent = '下联等你来拼……';
    puzzleFeedback.textContent = `已放好 ${selected.length} / ${tokens.length} 个词语`;
  }
  function startPuzzle() {
    const example = examples.get(puzzleSelect.value);
    tokens = example.lower;
    selected = [];
    shuffled = tokens.map((_, index) => index);
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    if (shuffled.every((value, index) => value === index)) shuffled.push(shuffled.shift());
    puzzle.querySelector('[data-puzzle-upper]').textContent = `上联 · ${example.upper.join('／')}`;
    renderPuzzle();
  }
  puzzleSelect.addEventListener('change', startPuzzle);
  puzzle.querySelector('[data-puzzle-reset]').addEventListener('click', startPuzzle);
  puzzle.querySelector('[data-puzzle-check]').addEventListener('click', () => {
    const correct = selected.map(index => tokens[index]).join('') === tokens.join('');
    puzzleFeedback.textContent = correct ? `拼好啦！${examples.get(puzzleSelect.value).note}` : '再对照上联读一读，看看每个词语该和谁站在一起。';
  });
  puzzle.hidden = false;
  startPuzzle();

  const editor = root.querySelector('[data-editor]');
  const door = root.querySelector('[data-door-preview]');
  const inputs = Object.fromEntries([...editor.querySelectorAll('[data-ink]')].map(input => [input.dataset.ink, input]));
  const counts = editor.querySelector('[data-counts]');
  const draftStatus = editor.querySelector('[data-draft-status]');
  const saveStatus = editor.querySelector('[data-save-status]');
  const clear = editor.querySelector('[data-clear]');
  const works = root.querySelector('[data-works]');
  const workPrefix = prefix + 'work:';
  const draftKey = prefix + 'draft';
  const han = text => text.match(/[\p{Unified_Ideograph}〇]/gu) || [];

  function currentDraft() {
    return {...Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, input.value])),
      direction: editor.querySelector('[name="direction"]:checked').value};
  }
  function validDraft(value) {
    return value && ['upper', 'lower', 'banner'].every(key => typeof value[key] === 'string' && value[key].length <= 80)
      && ['right', 'left'].includes(value.direction);
  }
  function displayDraft(value) {
    Object.entries(inputs).forEach(([key, input]) => { input.value = value[key]; });
    editor.querySelector(`[name="direction"][value="${value.direction}"]`).checked = true;
    updatePaper();
  }
  function saveDraft() {
    try { sessionStorage.setItem(draftKey, JSON.stringify(currentDraft())); }
    catch { draftStatus.textContent = '浏览器暂时不能保存草稿。离开前请先抄下联文。'; }
  }
  function updatePaper() {
    const draft = currentDraft();
    const upper = han(draft.upper), lower = han(draft.lower), banner = han(draft.banner);
    door.querySelector('[data-paper="upper"]').textContent = upper.slice(0, 12).join('') || '等你来写';
    door.querySelector('[data-paper="lower"]').textContent = lower.slice(0, 12).join('') || '等你来写';
    door.querySelector('[data-paper="banner"]').replaceChildren(...banner.slice(0, 6).map(character => {
      const tile = document.createElement('span');
      tile.textContent = character;
      return tile;
    }));
    let note = '';
    if (upper.length > 12 || lower.length > 12 || banner.length > 6) note = '。多出的字暂时没有排上红纸。';
    else if (upper.length && lower.length) note = upper.length === lower.length ? '。两边字数对齐了！再读读词语和句尾。' : '。两边字数还没对齐。';
    counts.textContent = `上联 ${upper.length} 字 · 下联 ${lower.length} 字${note}`;
    clear.disabled = !draft.upper && !draft.lower && !draft.banner;
    door.dataset.direction = draft.direction;
    door.querySelector('[data-door-caption]').textContent = draft.direction === 'right' ? '面对门看 · 横批从右往左读' : '面对门看 · 横批从左往右读';
    saveStatus.textContent = '';
  }
  function replaceDraft(value) {
    const draft = currentDraft();
    if ((draft.upper || draft.lower || draft.banner) && !window.confirm('要替换正在写的草稿吗？想保留它，可以先取消并收藏这副作品。')) return;
    displayDraft(value);
    saveDraft();
    location.hash = 'studio';
    inputs.upper.focus({preventScroll: true});
  }
  editor.addEventListener('input', event => {
    if (!event.target.hasAttribute('data-ink')) return;
    updatePaper();
    saveDraft();
  });
  editor.addEventListener('change', event => {
    if (event.target.name !== 'direction') return;
    updatePaper();
    saveDraft();
  });
  clear.addEventListener('click', () => replaceDraft({upper: '', lower: '', banner: '', direction: currentDraft().direction}));
  root.querySelectorAll('[data-use]').forEach(button => button.addEventListener('click', () => {
    const example = examples.get(button.dataset.use);
    replaceDraft({upper: example.upper_text, lower: example.lower_text, banner: example.banner, direction: currentDraft().direction});
  }));

  function finishedDraft() {
    const draft = currentDraft();
    const cleaned = {...draft};
    for (const key of ['upper', 'lower', 'banner']) {
      cleaned[key] = han(draft[key]).join('');
      if (/[^\p{Unified_Ideograph}〇\p{P}\s]/u.test(draft[key])) {
        saveStatus.textContent = '联文请用汉字来写，标点和空格会在红纸上自动略去。';
        return null;
      }
    }
    const size = [...cleaned.upper].length;
    if (!size || size !== [...cleaned.lower].length || size > 12 || [...cleaned.banner].length > 6) {
      saveStatus.textContent = '先把上下联写完整，两边字数一样多、各不超过 12 字，横批不超过 6 字，再收藏或打印。';
      return null;
    }
    return cleaned;
  }
  function renderWorks() {
    works.replaceChildren();
    let saved;
    try {
      saved = Object.keys(localStorage).filter(key => key.startsWith(workPrefix))
        .map(key => ({key, value: readLocal(key)}))
        .filter(({value}) => validDraft(value) && Number.isFinite(value.created))
        .sort((a, b) => b.value.created - a.value.created);
    } catch {
      works.textContent = '浏览器暂时不能读取作品集，仍然可以写作和打印。';
      return;
    }
    root.querySelector('[data-work-count]').textContent = `（${saved.length} 副）`;
    if (!saved.length) works.textContent = '第一副作品，等你来收藏。';
    saved.forEach(({key, value}) => {
      const article = document.createElement('article');
      article.className = 'couplet-example';
      const title = document.createElement('h4');
      title.textContent = value.banner || '我的对联';
      const upper = document.createElement('p');
      upper.textContent = `上联 · ${value.upper}`;
      const lower = document.createElement('p');
      lower.textContent = `下联 · ${value.lower}`;
      const date = document.createElement('p');
      date.textContent = new Date(value.created).toLocaleString('zh-CN');
      const actions = document.createElement('div');
      actions.className = 'couplets-actions';
      const open = document.createElement('button');
      open.type = 'button'; open.className = 'couplets-plain'; open.textContent = '打开修改';
      open.addEventListener('click', () => replaceDraft(value));
      const remove = document.createElement('button');
      remove.type = 'button'; remove.className = 'couplets-plain'; remove.textContent = '删除';
      remove.addEventListener('click', () => {
        if (!window.confirm(`要删除「${value.banner || value.upper}」这副收藏吗？`)) return;
        try { localStorage.removeItem(key); renderWorks(); }
        catch { saveStatus.textContent = '删除没有成功，请稍后再试。'; }
      });
      actions.append(open, remove);
      article.append(title, upper, lower, date, actions);
      works.append(article);
    });
  }
  editor.querySelector('[data-save]').addEventListener('click', () => {
    const value = finishedDraft();
    if (!value) return;
    try {
      const id = window.crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(workPrefix + id, JSON.stringify({...value, created: Date.now()}));
      saveStatus.textContent = '作品已收藏，可以在下面打开继续修改。';
      renderWorks();
    } catch { saveStatus.textContent = '收藏没有成功，浏览器空间可能已满。联文还在，可以先打印或抄下来。'; }
  });
  editor.querySelector('[data-print]').addEventListener('click', () => {
    if (finishedDraft()) window.print();
  });
  window.addEventListener('storage', event => {
    if (event.key === null || event.key.startsWith(workPrefix)) renderWorks();
    forms.forEach(form => {
      const key = `${prefix}quiz:${form.dataset.questionId}:${form.dataset.revision}`;
      if (event.key !== null && event.key !== key) return;
      const value = readLocal(key);
      if (['independent', 'assisted', 'seen'].includes(value)) answers.set(key, value);
      else answers.delete(key);
    });
    updateProgress();
  });
  try {
    const draft = JSON.parse(sessionStorage.getItem(draftKey));
    if (validDraft(draft)) displayDraft(draft);
  } catch { /* 草稿不可用时从当前示例开始。 */ }
  editor.hidden = false;
  root.querySelector('[data-library]').hidden = false;
  updatePaper();
  renderWorks();
})();

/* 节气筛选与五题小挑战，接入交节时钟、简笔画和家乡日记。正文由 Django 渲染。 */
(() => {
  'use strict';
  const hall = document.querySelector('.solar-hall');
  if (!hall) return;
  const get = id => document.getElementById(id);
  const cards = Array.from(hall.querySelectorAll('.solar-card'));
  const terms = new Map(cards.map(card => [card.id, {
    card,
    name: card.querySelector('h3').textContent,
    season: card.closest('.solar-season').id,
    search: card.textContent.toLocaleLowerCase(),
    prompt: card.querySelector('.solar-observation p')?.textContent ?? '',
  }]));
  const search = get('solar-search');
  const seasonButtons = hall.querySelectorAll('[data-season]');
  let season = 'all';

  function filterCards(writeURL = true) {
    const query = search.value.trim().toLocaleLowerCase();
    let count = 0;
    for (const term of terms.values()) {
      term.card.hidden = (season !== 'all' && season !== term.season) || !term.search.includes(query);
      if (!term.card.hidden) count += 1;
    }
    hall.querySelectorAll('.solar-season').forEach(section => {
      section.hidden = !section.querySelector('.solar-card:not([hidden])');
    });
    seasonButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.season === season)));
    get('solar-filter-status').textContent = `找到 ${count} / 24 张节气卡`;
    get('solar-empty').hidden = count !== 0;
    hall.dispatchEvent(new Event('solar:filter'));
    if (writeURL) {
      const url = new URL(location.href);
      url.hash = '';
      url.searchParams.delete('season');
      url.searchParams.delete('q');
      if (season !== 'all') url.searchParams.set('season', season);
      if (query) url.searchParams.set('q', search.value.trim());
      history.replaceState(null, '', url);
    }
  }

  function resetFilter() {
    season = 'all';
    search.value = '';
    filterCards();
  }

  function revealHash() {
    const target = get(location.hash.slice(1));
    if (!target || (!target.matches('.solar-card, .solar-season'))) return;
    if (target.hidden || target.closest('.solar-season').hidden) {
      season = 'all';
      search.value = '';
      filterCards(false);
      const url = new URL(location.href);
      url.searchParams.delete('season');
      url.searchParams.delete('q');
      history.replaceState(null, '', url);
    }
    target.scrollIntoView({block: 'start'});
    target.focus({preventScroll: true});
  }

  function restoreURL() {
    const params = new URLSearchParams(location.search);
    season = ['chun', 'xia', 'qiu', 'dong'].includes(params.get('season')) ? params.get('season') : 'all';
    search.value = (params.get('q') || '').slice(0, 80);
    filterCards(false);
    revealHash();
  }

  search.addEventListener('input', () => filterCards());
  seasonButtons.forEach(button => button.addEventListener('click', () => {
    season = button.dataset.season;
    filterCards();
  }));
  window.addEventListener('hashchange', revealHash);
  window.addEventListener('popstate', restoreURL);
  hall.querySelector('[data-action="reset"]').addEventListener('click', resetFilter);

  const experience = JSON.parse(get('solar-experience').textContent);
  const termData = JSON.parse(get('solar-term-experience').textContent);
  const diary = window.SolarDiary.mount({hall,terms,config:experience.diary});
  window.SolarScenes.mount({hall,data:termData,config:experience.scenes});
  window.SolarCalendar.mount({hall,terms,data:termData,onCurrent(id) {
    resetFilter();
    location.hash = id;
    revealHash();
  },onObserve:id => diary.open(id)});

  const challenges = JSON.parse(get('solar-challenges').textContent);
  const quiz = get('solar-challenge');
  quiz.querySelector('[data-close]').addEventListener('click', () => quiz.close());
  let round = [];
  let questionIndex = 0;
  let wrong = [];
  let answered = false;

  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const other = Math.floor(Math.random() * (i + 1));
      [result[i], result[other]] = [result[other], result[i]];
    }
    return result;
  }

  function showQuestion() {
    answered = false;
    const question = round[questionIndex];
    get('solar-quiz-progress').textContent = `第 ${questionIndex + 1} / ${round.length} 题`;
    get('solar-quiz-question').textContent = question.question;
    get('solar-quiz-feedback').textContent = '';
    get('solar-quiz-next').hidden = true;
    get('solar-quiz-reference').hidden = true;
    get('solar-quiz-next').textContent = questionIndex === round.length - 1 ? '看本轮结果 →' : '下一题 →';
    const options = get('solar-quiz-options');
    options.replaceChildren();
    shuffle(question.options.map((text, index) => ({text, index}))).forEach(option => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.answer = option.index;
      button.textContent = option.text;
      options.append(button);
    });
    get('solar-quiz-question').focus();
  }

  function startRound(pool) {
    round = shuffle(pool).slice(0, 5);
    questionIndex = 0;
    wrong = [];
    get('solar-quiz-round').hidden = false;
    get('solar-quiz-result').hidden = true;
    showQuestion();
  }

  hall.querySelector('[data-action="challenge"]').addEventListener('click', () => {
    hall.dispatchEvent(new Event('solar:pause'));
    quiz.showModal();
    if (!round.length) startRound(challenges);
  });
  get('solar-quiz-options').addEventListener('click', event => {
    const selected = event.target.closest('button[data-answer]');
    if (!selected || answered) return;
    answered = true;
    const question = round[questionIndex];
    const correct = Number(selected.dataset.answer) === question.answer;
    if (!correct) wrong.push(question);
    get('solar-quiz-options').querySelectorAll('button').forEach(button => {
      button.disabled = true;
      if (Number(button.dataset.answer) === question.answer) {
        button.classList.add('is-correct');
        button.textContent += ' ✓ 正确答案';
      } else if (button === selected) {
        button.classList.add('is-incorrect');
        button.textContent += ' · 再想一想';
      }
    });
    get('solar-quiz-feedback').textContent = (correct ? '答对了！' : '一起看看线索。') + question.explanation;
    const reference = get('solar-quiz-reference');
    reference.href = '#' + question.term;
    reference.textContent = `回${terms.get(question.term).name}卡看看 →`;
    reference.hidden = false;
    get('solar-quiz-next').hidden = false;
  });
  get('solar-quiz-reference').addEventListener('click', () => quiz.close());
  get('solar-quiz-next').addEventListener('click', () => {
    if (!answered) return;
    questionIndex += 1;
    if (questionIndex < round.length) {
      showQuestion();
      return;
    }
    get('solar-quiz-round').hidden = true;
    get('solar-quiz-result').hidden = false;
    get('solar-quiz-score').textContent = `这一轮答对 ${round.length - wrong.length} / ${round.length} 题`;
    get('solar-quiz-review').replaceChildren();
    wrong.forEach(question => {
      const item = document.createElement('li');
      item.textContent = `${question.question} ${question.explanation}`;
      get('solar-quiz-review').append(item);
    });
    get('solar-quiz-retry').hidden = wrong.length === 0;
    get('solar-quiz-score').focus();
  });
  get('solar-quiz-restart').addEventListener('click', () => startRound(challenges));
  get('solar-quiz-retry').addEventListener('click', () => startRound(wrong));

  let speaking = null;
  let speechRun = 0;
  function stopReading() {
    speechRun += 1;
    if (speaking) {
      speaking.textContent = '听诗句';
      speaking.setAttribute('aria-pressed', 'false');
      window.speechSynthesis?.cancel();
      speaking = null;
    }
  }
  hall.querySelectorAll('[data-read]').forEach(button => button.addEventListener('click', () => {
    const wasSpeaking = speaking === button;
    stopReading();
    if (wasSpeaking) return;
    const line = terms.get(button.dataset.read).card.querySelector('blockquote').textContent;
    speaking = button;
    const run = speechRun;
    button.textContent = '停止朗读';
    button.setAttribute('aria-pressed', 'true');
    if (!window.SpeechKit) {
      stopReading();
      button.textContent = '朗读暂不可用';
      return;
    }
    window.SpeechKit.speak(line, {
      lang: 'zh-CN', rate: 0.8,
      onend: () => { if (run === speechRun) stopReading(); },
      onerror: () => {
        if (run !== speechRun) return;
        stopReading();
        button.textContent = '朗读暂不可用';
      },
    });
  }));
  window.addEventListener('pagehide', stopReading);
  hall.querySelectorAll('.solar-interactive').forEach(element => { element.hidden = false; });
  restoreURL();
})();

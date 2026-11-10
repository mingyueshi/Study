'use strict';

(() => {
  const page = document.querySelector('[data-poly-page]');
  if (!page) return;

  const detail = page.querySelector('[data-poly-detail]');
  const detailStatus = page.querySelector('[data-poly-detail-status]');
  const search = page.querySelector('[data-poly-search]');
  const reset = page.querySelector('[data-poly-reset]');
  const directory = page.querySelector('[data-poly-groups]');
  const groups = Array.from(directory.querySelectorAll('[data-poly-initial]'));
  const letters = new Map(Array.from(page.querySelectorAll('[data-poly-letter]'), (link) => [link.dataset.polyLetter, link]));
  const buckets = Array.from(page.querySelectorAll('[data-poly-bucket]'));
  const normalize = (text) => text.normalize('NFC').toLowerCase().replace(/u:|v/g, 'ü');
  const withoutTone = (text) => text.normalize('NFD').replace(/[\u0300\u0301\u0304\u030c]/g, '').normalize('NFC');
  const entries = groups.map((group) => Array.from(group.querySelectorAll('.poly-chip'), (chip) => ({
    chip,
    readings: chip.dataset.readings.split(' · '),
    plain: withoutTone(chip.dataset.readings).split(' · '),
  })));

  let bucket = 'all';
  function filter() {
    const query = normalize(search.value.trim());
    const hasTone = query !== withoutTone(query);
    let total = 0;
    groups.forEach((group, index) => {
      let count = 0;
      for (const { chip, readings, plain } of entries[index]) {
        const matches = chip.dataset.polyChar.includes(query) || chip.dataset.words.includes(query)
          || (hasTone ? readings : plain).some((reading) => reading.startsWith(query));
        chip.hidden = !matches || (bucket !== 'all' && chip.dataset.bucket !== bucket);
        if (!chip.hidden) count += 1;
      }
      group.hidden = !count;
      letters.get(group.dataset.polyInitial).hidden = !count;
      group.querySelector('.poly-group-head span').textContent = count;
      total += count;
    });
    page.querySelector('[data-poly-visible]').textContent = total;
    page.querySelector('[data-poly-empty]').hidden = total > 0;
    reset.hidden = !query && bucket === 'all';
    directory.scrollTop = 0;
  }

  function setBucket(value) {
    bucket = value;
    buckets.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.polyBucket === bucket)));
    filter();
  }

  search.addEventListener('input', filter);
  buckets.forEach((button) => button.addEventListener('click', () => setBucket(button.dataset.polyBucket)));
  reset.addEventListener('click', () => {
    search.value = '';
    setBucket('all');
    search.focus();
  });

  const practice = page.querySelector('#practice');
  const question = practice.querySelector('[data-poly-question]');
  const practiceStatus = practice.querySelector('[data-poly-practice-status]');
  const storageKey = 'hanzi_polyphone_stats_v1';
  let stats = { streak: 0, correct: 0, asked: 0 };
  try { stats = { ...stats, ...JSON.parse(localStorage.getItem(storageKey) || '{}') }; } catch { /* 继续用本页计数 */ }
  function renderStats() {
    for (const key of ['streak', 'correct', 'asked']) {
      practice.querySelector(`[data-poly-${key}]`).textContent = stats[key];
    }
  }

  function report(round, chosen) {
    const token = document.cookie.match(/(?:^|;\s*)primary_csrftoken=([^;]*)/)?.[1] || '';
    fetch(practice.dataset.reportUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': decodeURIComponent(token) },
      keepalive: true,
      body: JSON.stringify({ char: round.char, word: round.word, chosen, answer: round.answer }),
    }).then((response) => (response.ok ? response.json() : null))
      .then((data) => { if (data?.rewards) window.rewardToast?.(data.rewards); })
      .catch(() => {});
  }

  function answer(option) {
    const round = option.closest('[data-poly-round]');
    if (round.dataset.answered || question.hasAttribute('aria-busy')) return;
    round.dataset.answered = 'true';
    const chosen = option.dataset.polyOption;
    const { char, word, answer: correct } = round.dataset;
    const ok = chosen === correct;
    for (const button of round.querySelectorAll('[data-poly-option]')) {
      button.setAttribute('aria-disabled', 'true');
      if (button.dataset.polyOption === correct) button.classList.add('ok');
    }
    if (!ok) option.classList.add('bad');
    round.querySelector('[data-poly-mask]').textContent = correct;
    round.querySelector('[data-poly-review]').hidden = false;
    round.querySelector('[data-poly-feedback]').textContent = ok
      ? `答对啦！「${word}」的「${char}」读 ${correct}。`
      : `再读一读：「${word}」的「${char}」读 ${correct}。`;
    stats.asked += 1;
    stats.correct += Number(ok);
    stats.streak = ok ? stats.streak + 1 : 0;
    try { localStorage.setItem(storageKey, JSON.stringify(stats)); } catch { /* 继续用本页计数 */ }
    renderStats();
    report(round.dataset, chosen);
  }

  async function loadPart(url, name, selector, signal) {
    url.searchParams.set('part', name);
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error('无法加载内容');
    const fragment = new DOMParser().parseFromString(await response.text(), 'text/html');
    if (!fragment.body.querySelector(selector)) throw new Error('返回内容有误');
    return fragment.body.childNodes;
  }

  function updateCharLinks(char) {
    page.querySelectorAll('.poly-starter-list a, .poly-chip').forEach((link) => {
      if (link.dataset.polyChar === char) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    for (const link of question.querySelectorAll('[data-poly-next]')) {
      const url = new URL(link.href);
      url.searchParams.set('char', char);
      link.href = url;
    }
  }

  let detailRequest;
  let activeChar = detail.querySelector('strong').textContent;
  function focusDetail(scroll) {
    const heading = detail.querySelector('#poly-detail-heading');
    const { top, bottom } = heading.getBoundingClientRect();
    heading.focus({ preventScroll: true });
    if (scroll || top < 0 || bottom > window.innerHeight) {
      detail.closest('section').scrollIntoView({ block: 'start' });
    }
  }

  async function selectChar(link) {
    detailRequest?.abort();
    const request = new AbortController();
    detailRequest = request;
    const char = link.dataset.polyChar;
    detailStatus.textContent = '';
    detail.setAttribute('aria-busy', 'true');
    try {
      if (char !== activeChar) {
        const nodes = await loadPart(new URL(link.href), 'detail', ':scope > .poly-card-heading #poly-detail-heading', request.signal);
        if (request.signal.aborted) return;
        detail.replaceChildren(...nodes);
        activeChar = char;
        updateCharLinks(char);
        const url = new URL(location.href);
        url.searchParams.set('char', char);
        history.replaceState(null, '', url);
      }
      focusDetail(link.closest('[data-poly-review]') !== null);
    } catch {
      if (!request.signal.aborted) detailStatus.textContent = '这个字暂时加载不了，请再点一次。';
    } finally {
      if (detailRequest === request) detail.removeAttribute('aria-busy');
    }
  }

  async function nextQuestion(link) {
    if (question.hasAttribute('aria-busy')) return;
    question.setAttribute('aria-busy', 'true');
    const actions = question.querySelectorAll('[data-poly-next]');
    actions.forEach((action) => action.setAttribute('aria-disabled', 'true'));
    practiceStatus.textContent = '';
    const url = new URL(link.href);
    try {
      const nodes = await loadPart(url, 'practice', ':scope > [data-poly-round]');
      window.TTS?.stopSequence();
      question.replaceChildren(...nodes);
      updateCharLinks(activeChar);
      const currentUrl = new URL(location.href);
      for (const key of ['mode', 'avoid', 'q_seed']) {
        if (url.searchParams.get(key)) currentUrl.searchParams.set(key, url.searchParams.get(key));
        else currentUrl.searchParams.delete(key);
      }
      history.replaceState(null, '', currentUrl);
      question.querySelector('[data-poly-option]').focus({ preventScroll: true });
    } catch {
      practiceStatus.textContent = '下一题暂时加载不了，请再试一次。';
    } finally {
      question.removeAttribute('aria-busy');
      actions.forEach((action) => action.removeAttribute('aria-disabled'));
    }
  }

  page.addEventListener('click', (event) => {
    const option = event.target.closest('[data-poly-option]');
    if (option) {
      answer(option);
      return;
    }
    const link = event.target.closest('a');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.hasAttribute('data-poly-char')) {
      event.preventDefault();
      selectChar(link);
    } else if (link.hasAttribute('data-poly-next')) {
      event.preventDefault();
      nextQuestion(link);
    }
  });

  filter();
  renderStats();
})();

/* polyphones: inline char switching, grid filter, reading-choice scoring. */
'use strict';

(() => {
  const dataNode = document.getElementById('poly-data');
  const detailBody = document.querySelector('[data-poly-detail-body]');
  const grid = document.querySelector('[data-poly-grid]');
  const search = document.querySelector('[data-poly-search]');
  const emptyHint = document.querySelector('[data-poly-empty]');
  const dictUrl = document.querySelector('[data-dict-url]')?.dataset.dictUrl || '';
  const chips = grid ? Array.from(grid.querySelectorAll('.poly-chip')) : [];
  const index = new Map();
  if (dataNode) {
    JSON.parse(dataNode.textContent).forEach((item) => index.set(item.char, item));
  }

  const markOn = (char) => {
    chips.forEach((chip) => chip.classList.toggle('on', chip.dataset.char === char));
  };

  /* ---- char detail: server renders the first char; JS re-renders inline. ---- */
  const renderDetail = (item) => {
    if (!detailBody || !item) return;
    const head = document.createElement('p');
    head.className = 'poly-detail-head';
    head.innerHTML = `<b class="poly-detail-char"></b><span class="poly-detail-sub"></span>`;
    head.querySelector('b').textContent = item.char;
    head.querySelector('span').textContent = `${item.readings.length} 个读音`;
    const frag = document.createDocumentFragment();
    frag.append(head);
    item.readings.forEach((reading) => {
      const box = document.createElement('div');
      box.className = 'poly-reading';
      const title = document.createElement('p');
      title.className = 'poly-reading-pinyin';
      title.append(reading.pinyin);
      if (reading.tone === 5) {
        const badge = document.createElement('i');
        badge.className = 'poly-tone-badge';
        badge.textContent = '轻';
        title.append(badge);
      }
      const words = document.createElement('div');
      words.className = 'poly-words';
      reading.words.forEach((word) => {
        const chip = document.createElement('a');
        chip.className = 'poly-word-chip';
        chip.href = dictUrl ? `${dictUrl}?q=${encodeURIComponent(word.word)}` : '#';
        const name = document.createElement('b');
        name.textContent = word.word.slice(0, word.position);
        const target = document.createElement('u');
        target.textContent = word.word[word.position];
        name.append(target, word.word.slice(word.position + 1));
        const pinyin = document.createElement('i');
        pinyin.textContent = word.pinyin;
        chip.append(name, pinyin);
        words.append(chip);
      });
      box.append(title, words);
      frag.append(box);
    });
    detailBody.replaceChildren(frag);
  };

  const select = (char, chip) => {
    const item = index.get(char);
    if (!item) return;
    renderDetail(item);
    markOn(char);
    history.replaceState(null, '', `?char=${encodeURIComponent(char)}`);
    if (window.innerWidth < 960) {
      document.getElementById('char-detail')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  };

  grid?.addEventListener('click', (event) => {
    const chip = event.target.closest('.poly-chip');
    if (chip) {
      event.preventDefault();
      select(chip.dataset.char, chip);
    }
  });

  /* ---- grid filter (by char or readings). ---- */
  if (search) {
    const countEl = document.querySelector('[data-poly-visible]');
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      let visible = 0;
      chips.forEach((chip) => {
        const hay = (chip.dataset.char + ' ' + chip.dataset.readings).toLowerCase();
        const show = !q || hay.includes(q);
        chip.hidden = !show;
        if (show) visible += 1;
      });
      if (countEl) countEl.textContent = visible;
      if (emptyHint) emptyHint.hidden = visible !== 0;
    });
  }

  /* ---- reading-choice practice scoring. ---- */
  const round = document.querySelector('[data-poly-round]');
  if (!round) return;
  const STORE_KEY = 'hanzi_polyphone_stats_v1';
  let stats = { streak: 0, correct: 0, asked: 0 };
  try { stats = { ...stats, ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}') }; } catch (e) { /* ignore */ }

  const node = (name) => round.querySelector(name);
  const render = () => {
    const streak = node('[data-poly-streak]');
    const correct = node('[data-poly-correct]');
    const asked = node('[data-poly-asked]');
    if (streak) streak.textContent = stats.streak;
    if (correct) correct.textContent = stats.correct;
    if (asked) asked.textContent = stats.asked;
  };
  const save = () => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(stats)); } catch (e) { /* ignore */ }
  };

  let counted = false;
  round.querySelectorAll('[data-poly-option]').forEach((option) => {
    option.addEventListener('click', () => {
      if (counted) return;
      counted = true;
      const ok = option.dataset.pinyin === round.dataset.answer;
      stats.asked += 1;
      if (ok) {
        stats.correct += 1;
        stats.streak += 1;
        option.classList.add('ok');
      } else {
        stats.streak = 0;
        option.classList.add('bad');
        round.querySelectorAll('[data-poly-option]').forEach((other) => {
          if (other.dataset.pinyin === round.dataset.answer) other.classList.add('ok');
        });
      }
      save();
      render();
      /* 答完把详情切到这道题的字，顺势看它的全部读音。 */
      select(round.dataset.char, null);
    });
  });

  render();
})();

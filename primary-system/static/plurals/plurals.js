/* 不规则复数：网格筛选 + 「给单数选复数」判分上报。
   前端判分只做即时展示；每题只答一次，答错即揭示正确答案并锁定，
   上报一次由服务端按词表确定性选项集复核后落学习记录（对错都记），
   失败不打扰练习。键盘：数字 1~4 作答，答完 Enter 换一题。 */
'use strict';

(() => {
  /* 变身游戏只揭晓词形，不作为答题上报。题池复用页面的核心词卡。 */
  const transform = document.querySelector('[data-plural-transform]');
  if (transform) {
    const pool = Array.from(document.querySelectorAll('[data-plural-card][data-tier="core"]'))
      .map(card => ({
        ...card.dataset,
        note: card.querySelector('.plural-note')?.textContent || '',
        examples: Object.fromEntries(Array.from(card.querySelectorAll('[data-plural-example]'), example => [
          example.dataset.pluralExample,
          {en: example.querySelector('[data-say]').dataset.say, cn: example.querySelector('.plural-example-cn').textContent},
        ])),
      }));
    if (pool.length) {
      transform.parentElement.hidden = false;
      const get = name => transform.querySelector(`[data-transform-${name}]`);
      const flip = get('flip');
      const seen = new Set();
      let deck = [], index = 0, revealed = false;
      const render = () => {
        const card = deck[index];
        flip.classList.toggle('is-transformed', revealed);
        flip.setAttribute('aria-pressed', String(revealed));
        flip.setAttribute('aria-label', revealed ? `${card.singular} 的复数是 ${card.plural}，点击变回单数` : `${card.singular}，点击变成复数`);
        get('word').textContent = revealed ? card.plural : card.singular;
        get('ipa').textContent = revealed ? card.pluralIpa : card.singularIpa;
        get('count').textContent = revealed ? '多个 · 复数' : '一个 · 单数';
        get('emoji').textContent = (card.emoji || '🔤').repeat(revealed ? 3 : 1);
        get('zh').textContent = card.zh;
        get('cue').textContent = revealed ? '↶ 点一下变回单数' : '🪄 点一下，变身！';
        get('say').dataset.say = revealed ? card.plural : card.singular;
        get('say').setAttribute('aria-label', `朗读 ${get('say').dataset.say}`);
        const example = card.examples[revealed ? 'plural' : 'singular'];
        const label = revealed ? '复数' : '单数';
        get('example-label').textContent = `${label}例句`;
        get('example-en').textContent = example.en;
        get('example-cn').textContent = example.cn;
        const exampleSay = get('example-say');
        exampleSay.dataset.say = example.en;
        exampleSay.setAttribute('aria-label', `听${label}整句`);
        get('result').textContent = revealed
          ? `${card.singular} → ${card.plural}。${card.singular === card.plural ? '数量变多，单词的样子不变！' : card.note || '把单数和复数连起来读一读。'}`
          : '先想一想：它的复数是什么？';
        get('progress').textContent = `第 ${index + 1}／${deck.length} 个 · 已变身 ${seen.size}／${deck.length}${seen.size === deck.length ? '，全都看过啦！' : ''}`;
        get('next').disabled = index === deck.length - 1;
        get('restart').hidden = index !== deck.length - 1;
      };
      const restart = () => {
        const lastWord = deck[index]?.singular;
        deck = [...pool];
        for (let i = deck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        if (deck.length > 1 && deck[0].singular === lastWord) [deck[0], deck[1]] = [deck[1], deck[0]];
        index = 0;
        revealed = false;
        seen.clear();
        render();
      };
      flip.addEventListener('click', () => {
        revealed = !revealed;
        if (revealed) seen.add(deck[index].singular);
        render();
      });
      get('next').addEventListener('click', () => {
        if (index >= deck.length - 1) return;
        index += 1;
        revealed = false;
        render();
      });
      get('restart').addEventListener('click', () => { restart(); flip.focus(); });
      restart();
    }
  }

  /* ── 练习：判分 + 上报 + 计分 ─────────────────────────────────────── */
  const round = document.querySelector('[data-plural-round]');
  if (round) {
    const options = Array.from(round.querySelectorAll('[data-plural-option]'));
    const feedback = round.querySelector('[data-plural-feedback]');
    const examples = round.querySelector('[data-plural-practice-examples]');
    const nextLink = round.querySelector('.plural-actions a');
    const STORE_KEY = 'plurals_stats_v1';
    let stats = { streak: 0, correct: 0, asked: 0 };
    let answered = false;
    try {
      stats = { ...stats, ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}') };
    } catch (e) { /* 使用默认 */ }

    const csrf = () => decodeURIComponent((document.cookie.match(/(?:^|;\s*)primary_csrftoken=([^;]*)/) || [])[1] || '');
    const render = () => {
      round.querySelector('[data-plural-streak]').textContent = stats.streak;
      round.querySelector('[data-plural-correct]').textContent = stats.correct;
      round.querySelector('[data-plural-asked]').textContent = stats.asked;
    };
    const save = () => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(stats));
      } catch (e) { /* 无痕模式静默降级 */ }
    };
    render();

    const report = (chosen) => {
      fetch(round.dataset.reportUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf() },
        body: JSON.stringify({
          singular: round.dataset.singular,
          chosen,
          answer: round.dataset.answer,
        }),
      }).then((response) => (response.ok ? response.json() : null))
        .then((data) => { if (window.rewardToast && data && data.rewards) window.rewardToast(data.rewards); })
        .catch(() => {});
    };

    const choose = (option) => {
      if (answered) return;
      answered = true;
      const ok = option.dataset.form === round.dataset.answer;
      const solution = `${round.dataset.answer} ${round.dataset.answerIpa}`;
      stats.asked += 1;
      if (ok) {
        stats.correct += 1;
        stats.streak += 1;
        option.classList.add('right');
        feedback.textContent = `🎉 答对啦！复数是 ${solution}。`;
        feedback.classList.add('ok');
      } else {
        stats.streak = 0;
        option.classList.add('wrong');
        options.forEach((button) => {
          if (button.dataset.form === round.dataset.answer) button.classList.add('right');
        });
        feedback.textContent = `正确答案是 ${solution}。`;
        feedback.classList.add('bad');
      }
      options.forEach((button) => { button.disabled = true; });
      examples.hidden = false;
      round.classList.add('done');
      save();
      render();
      requestAnimationFrame(() => examples.scrollIntoView({block: 'nearest'}));
      report(option.dataset.form);
    };

    options.forEach((option) => {
      option.addEventListener('click', () => choose(option));
    });

    /* 键盘：输入框里不抢按键；数字 1~4 作答，答完 Enter 换一题。 */
    document.addEventListener('keydown', (event) => {
      if (!round.parentElement.open || !round.getClientRects().length
          || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target.closest?.('input, textarea, select, button, a, [contenteditable="true"]')) return;
      if (event.key === 'Enter') {
        if (answered && nextLink) {
          event.preventDefault();
          nextLink.click();
        }
        return;
      }
      if (answered) return;
      const index = ['1', '2', '3', '4'].indexOf(event.key);
      if (index < 0 || index >= options.length) return;
      event.preventDefault();
      choose(options[index]);
    });
  }

  const openLinkedTool = () => {
    const tool = document.getElementById(window.location.hash.slice(1));
    if (tool?.classList.contains('plural-tool')) tool.open = true;
  };
  openLinkedTool();
  window.addEventListener('hashchange', openLinkedTool);

  /* ── 浏览：分组筛选 + 搜索 ────────────────────────────────────────── */
  const bucketBar = document.querySelector('[data-plural-buckets]');
  const search = document.querySelector('[data-plural-search]');
  if (bucketBar && search) {
    const cards = Array.from(document.querySelectorAll('[data-plural-card]'));
    const groups = Array.from(document.querySelectorAll('.plural-group'));
    const applyFilter = () => {
      const active = bucketBar.querySelector('.on');
      const bucket = active ? active.dataset.bucket : 'all';
      const query = search.value.trim().toLowerCase();
      cards.forEach((card) => {
        const matchBucket = bucket === 'all' || card.dataset.group === bucket;
        const matchQuery = !query || card.dataset.singular.toLowerCase().includes(query)
          || (card.dataset.plural || '').toLowerCase().includes(query) || (card.dataset.zh || '').includes(query);
        card.hidden = !(matchBucket && matchQuery);
      });
      groups.forEach((group) => {
        group.hidden = !group.querySelector('[data-plural-card]:not([hidden])');
      });
    };
    bucketBar.addEventListener('click', (event) => {
      const bucket = event.target.closest('[data-bucket]');
      if (!bucket) return;
      bucketBar.querySelectorAll('[data-bucket]').forEach((button) => button.classList.remove('on'));
      bucket.classList.add('on');
      applyFilter();
    });
    search.addEventListener('input', applyFilter);
  }
})();

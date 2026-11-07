/* 不规则复数：网格筛选 + 「给单数选复数」判分上报。
   前端判分只做即时展示；每题只答一次，答错即揭示正确答案并锁定，
   上报一次由服务端按词表确定性选项集复核后落学习记录（对错都记），
   失败不打扰练习。键盘：数字 1~4 作答，答完 Enter 换一题。 */
'use strict';

(() => {
  /* ── 练习：判分 + 上报 + 计分 ─────────────────────────────────────── */
  const round = document.querySelector('[data-plural-round]');
  if (round) {
    const options = Array.from(round.querySelectorAll('[data-plural-option]'));
    const feedback = round.querySelector('[data-plural-feedback]');
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
      }).catch(() => {});
    };

    const choose = (option) => {
      if (answered) return;
      answered = true;
      const ok = option.dataset.form === round.dataset.answer;
      stats.asked += 1;
      if (ok) {
        stats.correct += 1;
        stats.streak += 1;
        option.classList.add('right');
        feedback.textContent = '🎉 答对啦！就是这么变。';
        feedback.classList.add('ok');
      } else {
        stats.streak = 0;
        option.classList.add('wrong');
        options.forEach((button) => {
          if (button.dataset.form === round.dataset.answer) button.classList.add('right');
        });
        feedback.textContent = `正确答案是 ${round.dataset.answer}，记住它。`;
        feedback.classList.add('bad');
      }
      options.forEach((button) => { button.disabled = true; });
      round.classList.add('done');
      save();
      render();
      report(option.dataset.form);
    };

    options.forEach((option) => {
      option.addEventListener('click', () => choose(option));
    });

    /* 键盘：输入框里不抢按键；数字 1~4 作答，答完 Enter 换一题。 */
    document.addEventListener('keydown', (event) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target.closest?.('input, textarea, select')) return;
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
          || (card.dataset.zh || '').includes(query);
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

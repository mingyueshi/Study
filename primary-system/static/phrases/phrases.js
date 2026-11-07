/* 日常用语：句式/话题双视图渲染、筛选搜索 + 「看中文选英文」判分上报。
   前端判分只做即时展示；每题只答一次，答错即揭示正确答案并锁定，上报一次
   由服务端按确定性选项集复核后落学习记录（对错都记），失败不打扰练习。
   键盘：数字 1~4 作答，答完 Enter 换一题。 */
'use strict';

(() => {
  const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
  const sayChip = (text, label) => `<button class="say-chip" type="button" data-say="${escapeHtml(text)}" aria-label="朗读 ${escapeHtml(label || text)}">🔊</button>`;

  /* ── 练习：判分 + 上报 + 计分 ─────────────────────────────────────── */
  const round = document.querySelector('[data-phrases-round]');
  if (round) {
    const options = Array.from(round.querySelectorAll('[data-phrases-option]'));
    const feedback = round.querySelector('[data-phrases-feedback]');
    const nextLink = round.querySelector('.phrase-actions a');
    const STORE_KEY = 'phrases_stats_v1';
    let stats = { streak: 0, correct: 0, asked: 0 };
    let answered = false;
    try {
      stats = { ...stats, ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}') };
    } catch (e) { /* 使用默认 */ }

    const csrf = () => decodeURIComponent((document.cookie.match(/(?:^|;\s*)primary_csrftoken=([^;]*)/) || [])[1] || '');
    const render = () => {
      round.querySelector('[data-phrases-streak]').textContent = stats.streak;
      round.querySelector('[data-phrases-correct]').textContent = stats.correct;
      round.querySelector('[data-phrases-asked]').textContent = stats.asked;
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
        body: JSON.stringify({ id: round.dataset.id, chosen, answer: round.dataset.answer }),
      }).catch(() => {});
    };

    const choose = (option) => {
      if (answered) return;
      answered = true;
      const ok = option.dataset.en === round.dataset.answer;
      stats.asked += 1;
      if (ok) {
        stats.correct += 1;
        stats.streak += 1;
        option.classList.add('right');
        feedback.innerHTML = `🎉 答对啦！跟读一遍：${sayChip(round.dataset.answer)}`;
        feedback.classList.add('ok');
      } else {
        stats.streak = 0;
        option.classList.add('wrong');
        options.forEach((button) => {
          if (button.dataset.en === round.dataset.answer) button.classList.add('right');
        });
        feedback.innerHTML = `正确答案是 ${sayChip(round.dataset.answer)}，跟读记住它。`;
        feedback.classList.add('bad');
      }
      options.forEach((button) => { button.disabled = true; });
      round.classList.add('done');
      save();
      render();
      report(option.dataset.en);
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

  /* ── 浏览：双视图渲染 + 分组筛选 + 搜索 ───────────────────────────── */
  const groupsRoot = document.querySelector('[data-phrase-groups]');
  if (!groupsRoot) return;
  const items = JSON.parse(document.getElementById('phrase-items').textContent || '[]');
  const patterns = JSON.parse(document.getElementById('phrase-patterns').textContent || '[]');
  const scenarios = JSON.parse(document.getElementById('phrase-scenarios').textContent || '[]');
  const wordsUrl = groupsRoot.dataset.wordsUrl;
  const visibleNode = document.querySelector('[data-phrases-visible]');
  let view = 'pattern';
  let activeChip = null;

  const card = (item) => `<article class="phrase-card${item.tier === 'extended' ? ' collocation' : ''}">
    ${item.tier === 'extended' ? '<span class="phrase-tier">搭配</span>' : ''}
    <p class="phrase-en">${escapeHtml(item.en)}${sayChip(item.en)}</p>
    <p class="phrase-zh">${escapeHtml(item.zh)}</p>
  </article>`;

  const renderGroups = (rows) => {
    const html = rows.map((group) => {
      const link = group.wordsUrl
        ? `<a class="phrase-words-link" href="${escapeHtml(group.wordsUrl)}">去场景单词学词 →</a>` : '';
      return `<section class="phrase-group">
        <div class="section-heading"><div><h2>${escapeHtml(group.title)}</h2><p>${escapeHtml(group.formula)}</p></div>${link}</div>
        <div class="phrase-grid">${group.items.map(card).join('')}</div>
      </section>`;
    }).join('');
    groupsRoot.innerHTML = html || '<p class="phrase-empty">这个筛选下没有短语，换一个试试。</p>';
  };

  const countVisible = () => {
    if (visibleNode) visibleNode.textContent = groupsRoot.querySelectorAll('.phrase-card').length;
  };

  const applyFilter = () => {
    const chip = document.querySelector(`.phrase-chip.on[data-chip-row="${view}"]`) ||
      document.querySelector(`[data-chip-row="${view}"] .phrase-chip`);
    const active = chip ? chip.dataset.chip : null;
    const query = (document.querySelector('[data-phrases-search]')?.value || '').trim().toLowerCase();
    const pool = items.filter((item) => {
      if (view === 'pattern' && !item.pattern) return false;
      if (active && active !== 'all' && item[view] !== active) return false;
      if (query && !item.en.toLowerCase().includes(query) && !item.zh.includes(query)) return false;
      return true;
    });
    const definitions = view === 'pattern' ? patterns : scenarios;
    const groups = definitions
      .map((definition) => {
        const groupItems = pool.filter((item) => item[view] === definition.code);
        // 场景单词页的深链是 ?word=<词头>：取该组第一条短语的词头作为入口词。
        const head = (groupItems[0] || {}).head;
        return {
          title: view === 'pattern' ? definition.name : definition.zh,
          formula: view === 'pattern' ? definition.formula
            : (view === 'scenario' ? '这个话题里的常用表达，点喇叭跟读。' : ''),
          code: definition.code,
          wordsUrl: view === 'scenario' && head
            ? `${wordsUrl}?word=${encodeURIComponent(head)}` : '',
          items: groupItems,
        };
      })
      .filter((group) => group.items.length);
    renderGroups(groups);
    countVisible();
  };

  document.querySelector('[data-phrases-views]').addEventListener('click', (event) => {
    const button = event.target.closest('[data-phrases-view]');
    if (!button) return;
    view = button.dataset.phrasesView;
    document.querySelectorAll('[data-phrases-view]').forEach((node) => node.classList.toggle('on', node === button));
    document.querySelectorAll('[data-chip-row]').forEach((row) => { row.hidden = row.dataset.chipRow !== view; });
    activeChip = null;
    applyFilter();
  });

  document.querySelectorAll('[data-chip-row]').forEach((row) => {
    row.addEventListener('click', (event) => {
      const chip = event.target.closest('[data-chip]');
      if (!chip) return;
      const isOn = chip.classList.contains('on');
      row.querySelectorAll('.phrase-chip').forEach((node) => node.classList.remove('on'));
      if (!isOn) chip.classList.add('on');
      applyFilter();
    });
  });

  document.querySelector('[data-phrases-search]').addEventListener('input', applyFilter);

  applyFilter();
})();

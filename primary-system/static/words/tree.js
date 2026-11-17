/* 词以类聚：枝干一点直达词墙，点词出卡，全程不刷新页面。
   服务端把整棵树（含每个词的中文/音标 data-*）渲染进 DOM，这里只做面板渲染与状态同步；
   无 JS 时树仍可用原生 details 折叠浏览，?word= / ?branch= 深链由服务端展开路径。 */
'use strict';

(() => {
  const shell = document.querySelector('.tree-shell');
  const board = document.querySelector('.tree-board');
  const panel = document.getElementById('tree-panel');
  if (!shell || !board || !panel) return;

  const rootKey = shell.dataset.rootKey || '';
  const rootZh = shell.dataset.rootZh || '';
  const rootEmoji = shell.dataset.rootEmoji || '';
  const sceneUrl = shell.dataset.sceneUrl;
  const dictUrl = shell.dataset.dictUrl || '/dictionary/';
  const outline = board.querySelector('[data-tree-outline]') || board;

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== '') node.textContent = text;
    return node;
  };

  /* —— 展开状态记忆：按枝干 id 存（key v2，与旧版文本键不兼容）—— */
  const STORE_KEY = 'words_tree_expand_v2';
  let saved = {};
  try {
    const value = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    if (value && typeof value === 'object' && !Array.isArray(value)) saved = value;
  } catch (e) { /* 忽略 */ }
  const save = () => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(saved)); } catch (e) { /* 忽略 */ }
  };
  document.querySelectorAll('.tree-branch details').forEach((details) => {
    const id = details.closest('.tree-branch')?.id;
    if (!id) return;
    if (id in saved && !details.hasAttribute('data-path-open')) details.open = saved[id];
    else if (rootKey !== 'spelling' && !location.search.includes('branch=')
      && !location.search.includes('word=') && details.closest('.tree-branch').parentElement.parentElement === outline) details.open = true;
    details.addEventListener('toggle', () => { saved[id] = details.open; save(); });
  });

  /* —— 树信息收集 —— */
  const chipData = (chip) => ({
    en: chip.dataset.en || chip.textContent.trim(),
    zh: chip.dataset.zh || '',
    ipa: chip.dataset.ipa || '',
    emoji: chip.dataset.emoji || '',
    scene: chip.dataset.scene || '',
    status: chip.dataset.status || '',
    ending: chip.dataset.ending || '',
  });

  const addSpelling = (node, { en, ending }) => {
    node.lang = 'en';
    if (ending) node.append(en.slice(0, -ending.length), el('span', 'tree-word-ending', ending));
    else node.textContent = en;
  };

  const sayButton = (en, className = 'say-chip') => {
    const button = el('button', className, '🔊');
    button.type = 'button';
    button.dataset.say = en;
    button.setAttribute('aria-label', `朗读 ${en}`);
    return button;
  };

  // 一个 details 的直属词（:scope > 避开嵌套枝干）
  const ownChips = (details) =>
    Array.from(details.querySelectorAll(':scope > .tree-node-words .tree-word'));
  const rootOwnChips = () =>
    Array.from(outline.querySelectorAll(':scope > .tree-root-words .tree-word'));

  // 枝干子树全部词：直属 + 子枝递归
  const subtreeChips = (details) => {
    const rows = [...ownChips(details)];
    details
      .querySelectorAll(':scope > ul.tree-nodes > li.tree-branch > details')
      .forEach((child) => rows.push(...subtreeChips(child)));
    return rows;
  };

  // 词 chip 所在枝干（li.tree-branch）；根直属词返回 null
  const containingBranch = (chip) => chip.closest('.tree-branch');

  const markOn = (en) => {
    const low = en.toLowerCase();
    board.querySelectorAll('.tree-word').forEach((chip) => {
      chip.classList.toggle('on', (chip.dataset.en || '').toLowerCase() === low);
    });
  };

  const setUrl = (query) => history.replaceState(null, '', `?${query}`);

  /* —— 词墙 —— */
  let wallBranch = null; // 当前词墙对应枝干 li；null = 根

  const crumbOf = (branchLi) => {
    const names = [];
    let li = branchLi;
    while (li) {
      names.unshift(li.querySelector('summary')?.dataset.branchZh || '');
      li = li.parentElement.closest('.tree-branch');
    }
    return [`${rootEmoji || ''} ${rootZh}`.trim(), ...names];
  };

  const groupsOf = (branchLi) => {
    const groups = [];
    const own = branchLi ? ownChips(branchLi.querySelector('details')) : rootOwnChips();
    const active = branchLi?.querySelector('summary')?.dataset;
    if (own.length) groups.push({ title: active?.branchIpa ? active.branchZh : '本级', ipa: active?.branchIpa, chips: own });
    const lis = branchLi
      ? branchLi.querySelectorAll(':scope > details > ul.tree-nodes > li.tree-branch')
      : outline.querySelectorAll(':scope > .tree-nodes > li.tree-branch');
    lis.forEach((li) => {
      const chips = subtreeChips(li.querySelector('details'));
      if (chips.length) {
        const { branchZh, branchIpa } = li.querySelector('summary').dataset;
        groups.push({ title: branchZh, ipa: branchIpa, chips });
      }
    });
    return groups;
  };

  const wallEntry = (source) => {
    const data = chipData(source);
    const chip = el('a', 'tree-word');
    chip.href = source.getAttribute('href');
    Object.assign(chip.dataset, data);
    const word = el('b');
    addSpelling(word, data);
    chip.append(word);
    if (data.ending) chip.append(el('span', 'tree-wall-ipa', data.ipa));
    if (data.zh) chip.append(el('i', '', data.zh));
    if (!data.ending) return chip;

    const entry = el('div', 'tree-wall-entry');
    entry.append(chip, sayButton(data.en, 'say-chip tree-wall-say'));
    return entry;
  };

  const renderWall = (branchLi, scroll = true) => {
    wallBranch = branchLi;
    setUrl(branchLi
      ? `root=${encodeURIComponent(rootKey)}&branch=${encodeURIComponent(branchLi.id)}`
      : `root=${encodeURIComponent(rootKey)}`);
    const wall = el('div', 'tree-wall');
    const crumb = el('p', 'tree-crumb');
    const names = crumbOf(branchLi);
    names.forEach((name, index) => {
      if (index) crumb.append(el('span', 'tree-crumb-sep', '›'));
      crumb.append(el('span', index === names.length - 1 ? 'tree-crumb-here' : '', name));
    });
    const filter = el('input', 'tree-filter');
    filter.type = 'search';
    filter.placeholder = '筛选：英文或中文';
    filter.setAttribute('aria-label', '筛选本枝单词');
    const wrap = el('div', 'tree-wall-groups');
    groupsOf(branchLi).forEach((group) => {
      const box = el('div', 'tree-wall-group');
      const head = el('p', 'tree-wall-group-title');
      head.append(el('span', '', group.title));
      if (group.ipa) head.append(el('i', 'tree-family-sound', group.ipa));
      head.append(el('i', '', `${group.chips.length} 词`));
      const chips = el('div', 'tree-wall-words');
      group.chips.forEach((source) => chips.append(wallEntry(source)));
      box.append(head, chips);
      wrap.append(box);
    });
    wall.append(crumb, filter, wrap);
    panel.replaceChildren(wall);
    filter.addEventListener('input', () => {
      const q = filter.value.trim().toLowerCase();
      wrap.querySelectorAll('.tree-wall-group').forEach((box) => {
        let visible = 0;
        box.querySelectorAll('.tree-word').forEach((chip) => {
          const hay = `${chip.dataset.en} ${chip.dataset.zh}`.toLowerCase();
          const show = !q || hay.includes(q);
          const entry = chip.closest('.tree-wall-entry') || chip;
          entry.hidden = !show;
          if (show) visible += 1;
        });
        box.hidden = visible === 0;
      });
    });
    if (scroll) panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  /* —— 词卡 —— */
  const renderCard = (data) => {
    const card = el('article', 'tree-word-card');
    card.append(el('p', 'tree-word-emoji', data.emoji || '🔤'));
    const headline = el('p', 'tree-word-headline');
    const word = el('b');
    addSpelling(word, data);
    headline.append(word, sayButton(data.en));
    card.append(headline);
    if (data.ipa) card.append(el('p', 'tree-word-ipa', data.ipa));
    if (data.zh) card.append(el('p', 'tree-word-zh', data.zh));
    if (data.scene) card.append(el('p', 'tree-word-scene', `场景：${data.scene}`));
    if (data.status && data.status !== '来源一致') {
      card.append(el('p', 'tree-word-status', data.status));
    }
    const actions = el('div', 'tree-word-actions');
    if (sceneUrl) {
      const scene = el('a', 'button small', '去场景页学会它 →');
      scene.href = `${sceneUrl}?word=${encodeURIComponent(data.en)}`;
      actions.append(scene);
    }
    const dict = el('a', 'button small ghost', '查词典 →');
    dict.href = `${dictUrl}?q=${encodeURIComponent(data.en)}`;
    const back = el('button', 'button small ghost tree-back', '← 返回词墙');
    back.type = 'button';
    actions.append(dict, back);
    card.append(actions);
    panel.replaceChildren(card);
    markOn(data.en);
    setUrl(`root=${encodeURIComponent(rootKey)}&word=${encodeURIComponent(data.en)}`);
    back.addEventListener('click', () => renderWall(wallBranch));
    panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  /* —— 事件：点枝干选词墙，点词出卡 —— */
  document.addEventListener('click', (event) => {
    const summary = event.target.closest('.tree-branch summary');
    if (summary) {
      const li = summary.closest('.tree-branch');
      if (li) renderWall(li);
      return;
    }
    const chip = event.target.closest('.tree-word');
    if (chip) {
      event.preventDefault();
      if (board.contains(chip)) wallBranch = containingBranch(chip);
      renderCard(chipData(chip));
    }
  });

  /* —— 展开全部 / 全部收起 —— */
  document.querySelectorAll('[data-tree-expand], [data-tree-collapse]').forEach((button) => {
    button.addEventListener('click', () => {
      const open = button.hasAttribute('data-tree-expand');
      document.querySelectorAll('.tree-branch details').forEach((details) => {
        details.open = open;
      });
    });
  });

  /* —— 载入：深链词出卡并记住词墙；否则默认根词墙 —— */
  const params = new URLSearchParams(location.search);
  const onChip = board.querySelector('.tree-word.on');
  if (onChip) {
    onChip.scrollIntoView({ block: 'center' });
    wallBranch = containingBranch(onChip);
    const back = panel.querySelector('.tree-back');
    if (back) {
      back.hidden = false;
      back.addEventListener('click', () => renderWall(wallBranch));
    }
  } else {
    const branchLi = params.get('branch')
      ? document.getElementById(params.get('branch'))
      : null;
    renderWall(branchLi?.classList.contains('tree-branch') ? branchLi : null, false);
  }

  /* 拼写家族：复用目录中的例词，不另存释义或读音。 */
  const memory = board.querySelector('[data-family-memory]');
  if (!memory) return;
  const views = board.querySelector('[data-family-views]');
  const select = memory.querySelector('[data-family-select]');
  const deck = memory.querySelector('[data-family-deck]');
  const progress = memory.querySelector('[data-family-progress]');
  const previous = memory.querySelector('[data-family-prev]');
  const next = memory.querySelector('[data-family-next]');
  const families = Array.from(outline.querySelectorAll(':scope > .tree-nodes > .tree-branch'));
  const viewed = new Set();
  let flips = [];
  const updateProgress = () => {
    progress.textContent = `这一家族已翻看 ${viewed.size}／${flips.length} 张${viewed.size === flips.length ? '，试着把它们连起来读一读！' : '，先猜一猜，再翻卡。'}`;
  };
  const renderMemory = (family) => {
    select.value = family.id;
    viewed.clear();
    flips = [];
    deck.replaceChildren();
    ownChips(family.querySelector('details')).forEach((source) => {
      const data = chipData(source);
      const card = el('article', 'family-memory-card');
      const flip = el('button', 'family-memory-flip');
      flip.type = 'button';
      const front = el('span', 'family-memory-face family-memory-front');
      const word = el('b');
      addSpelling(word, data);
      front.append(el('small', '', '读单词，猜意思'), word, el('span', 'family-memory-hint', '点一下翻卡 ↻'));
      const back = el('span', 'family-memory-face family-memory-back');
      const backWord = el('b');
      addSpelling(backWord, data);
      back.append(backWord, el('span', 'family-memory-ipa', data.ipa), el('strong', '', data.zh), el('small', '', '再点一下回正面'));
      front.setAttribute('aria-hidden', 'true');
      back.setAttribute('aria-hidden', 'true');
      flip.append(front, back);
      const setFlipped = (on) => {
        flip.classList.toggle('is-flipped', on);
        flip.setAttribute('aria-pressed', String(on));
        flip.setAttribute('aria-label', on ? `${data.en}，${data.ipa}，${data.zh}。翻回单词正面` : `${data.en}，翻卡看意思和读音`);
      };
      setFlipped(false);
      flip.addEventListener('click', () => {
        const on = flip.getAttribute('aria-pressed') !== 'true';
        setFlipped(on);
        if (on) viewed.add(data.en);
        updateProgress();
      });
      flips.push(setFlipped);
      const actions = el('div', 'family-memory-actions');
      const detail = el('a', 'family-memory-detail', '看词卡 →');
      detail.href = source.href;
      detail.addEventListener('click', (event) => {
        event.preventDefault();
        wallBranch = family;
        renderCard(data);
      });
      actions.append(sayButton(data.en), detail);
      card.append(flip, actions);
      deck.append(card);
    });
    const index = families.indexOf(family);
    previous.disabled = index === 0;
    next.disabled = index === families.length - 1;
    updateProgress();
  };
  const renderMemoryGuide = (family) => {
    const guide = el('section', 'tree-wall tree-memory-guide');
    const data = family.querySelector('summary').dataset;
    guide.append(el('h3', '', `${data.branchZh} 家族`), el('p', 'tree-word-ipa', data.branchIpa),
      el('p', 'tree-family-tip', '保留彩色词尾，换个开头读一读。先猜意思，再翻卡核对。'));
    const words = ownChips(family.querySelector('details')).map(chip => chipData(chip).en);
    const say = sayButton(words.join(', '));
    say.textContent = '🔊 听这一家';
    say.classList.add('family-memory-listen');
    say.setAttribute('aria-label', `朗读 ${data.branchZh} 家族的单词`);
    guide.append(say, el('p', 'tree-family-tip', '翻完后点「全部翻回」，看看这次能不能自己说出每个词的意思。'));
    panel.replaceChildren(guide);
  };
  const chooseFamily = (family) => {
    renderMemory(family);
    wallBranch = family;
    setUrl(`root=${encodeURIComponent(rootKey)}&branch=${encodeURIComponent(family.id)}`);
    renderMemoryGuide(family);
  };
  select.addEventListener('change', () => chooseFamily(families.find(family => family.id === select.value)));
  previous.addEventListener('click', () => {
    const index = families.findIndex(family => family.id === select.value);
    if (index > 0) chooseFamily(families[index - 1]);
  });
  next.addEventListener('click', () => {
    const index = families.findIndex(family => family.id === select.value);
    if (index < families.length - 1) chooseFamily(families[index + 1]);
  });
  memory.querySelector('[data-family-reset]').addEventListener('click', () => {
    flips.forEach(setFlipped => setFlipped(false));
    viewed.clear();
    updateProgress();
  });
  const viewKey = 'words_family_view_v1';
  const showView = (view) => {
    const isMemory = view !== 'outline';
    memory.hidden = !isMemory;
    outline.hidden = isMemory;
    board.querySelector('[data-tree-outline-tools]').hidden = isMemory;
    views.querySelectorAll('[data-family-view]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.familyView === (isMemory ? 'memory' : 'outline')));
    });
    if (isMemory) {
      const family = wallBranch || families[0];
      renderMemory(family);
      if (!panel.querySelector('.tree-word-card')) renderMemoryGuide(family);
    } else renderWall(wallBranch, false);
  };
  views.hidden = false;
  renderMemory(wallBranch || families[0]);
  let initialView = 'memory';
  try { initialView = localStorage.getItem(viewKey) || 'memory'; } catch (e) { /* 默认翻卡 */ }
  showView(initialView);
  views.addEventListener('click', (event) => {
    const button = event.target.closest('[data-family-view]');
    if (!button) return;
    showView(button.dataset.familyView);
    try { localStorage.setItem(viewKey, button.dataset.familyView); } catch (e) { /* 本页仍可切换 */ }
  });
})();

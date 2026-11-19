/* 词以类聚：枝干一点直达词墙，点词出卡，全程不刷新页面。
   服务端把整棵树（含每个词的中文/音标 data-*）渲染进 DOM，这里只做面板渲染与状态同步；
   无 JS 时树仍可用原生 details 折叠浏览，?word= / ?branch= 深链由服务端展开路径。 */
'use strict';

(() => {
  const shell = document.querySelector('.tree-shell');
  const board = document.querySelector('.tree-board');
  const panel = document.getElementById('tree-panel');
  const sidebar = document.querySelector('.tree-sidebar');
  if (!shell || !board || !panel || !sidebar) return;

  const rootKey = shell.dataset.rootKey || '';
  const rootZh = shell.dataset.rootZh || '';
  const rootEmoji = shell.dataset.rootEmoji || '';
  const sceneUrl = shell.dataset.sceneUrl;
  const dictUrl = shell.dataset.dictUrl || '/dictionary/';
  const outline = board.querySelector('[data-tree-outline]') || board;
  const params = new URLSearchParams(location.search);
  const searchBranch = sidebar.querySelector('[name="branch"]');
  const searchScope = sidebar.querySelector('[name="within"]');
  const clearSearch = document.querySelector('[data-tree-clear-search]');
  const morphPayload = document.getElementById('word-morphology-data');
  const morphology = morphPayload ? JSON.parse(morphPayload.textContent) : {entries: [], families: []};
  const morphEntries = new Map(morphology.entries.map(word => [word.morph_id, word]));

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
    else if (rootKey !== 'spelling' && !['branch', 'word', 'entry'].some(key => params.get(key))
      && details.closest('.tree-branch').parentElement.parentElement === outline) details.open = true;
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
    morphId: chip.dataset.morphId || '',
    nodeId: chip.dataset.nodeId || '',
  });

  const addSpelling = (node, { en, ending, morphId }) => {
    node.lang = 'en';
    const word = morphEntries.get(morphId);
    if (word) word.parts.forEach(part => {
      const segment = el('span', `morph-part morph-part-${part.kind}${part.focus ? ' morph-part-focus' : ''}`, part.text);
      segment.title = part.meaning;
      node.append(segment);
    });
    else if (ending) node.append(en.slice(0, -ending.length), el('span', 'tree-word-ending', ending));
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

  const markOn = (word) => {
    shell.querySelectorAll('.tree-word').forEach((chip) => {
      const selected = word && chip.dataset.en === word.en && chip.dataset.nodeId === word.nodeId;
      chip.classList.toggle('on', Boolean(selected));
      if (selected) chip.setAttribute('aria-current', 'true');
      else chip.removeAttribute('aria-current');
    });
  };

  const setUrl = (selection) => {
    const url = new URL(location.href);
    for (const key of ['branch', 'word', 'entry']) url.searchParams.delete(key);
    url.searchParams.set('root', rootKey);
    for (const [key, value] of Object.entries(selection)) if (value) url.searchParams.set(key, value);
    url.hash = '';
    history.replaceState(history.state, '', url);
    if (clearSearch) {
      url.searchParams.delete('q');
      url.searchParams.delete('within');
      url.hash = selection.word || selection.entry ? 'tree-panel' : 'tree-workspace';
      clearSearch.href = url;
    }
  };

  const openPath = (branch) => {
    for (let node = branch; node; node = node.parentElement.closest('.tree-branch')) {
      node.querySelector(':scope > details').open = true;
    }
  };

  const syncBranch = (branch, updateScope = true) => {
    const id = branch?.id || '';
    board.querySelector('[data-branch-id][aria-current]')?.removeAttribute('aria-current');
    branch?.querySelector('summary')?.setAttribute('aria-current', 'true');
    sidebar.querySelectorAll('[data-tree-branch-link]').forEach(link => {
      if (link.dataset.treeBranchLink === id) {
        link.setAttribute('aria-current', 'true');
        const group = link.closest('.tree-side-families');
        if (group) group.open = true;
      } else link.removeAttribute('aria-current');
    });
    searchBranch.value = id;
    if (updateScope) {
      if (searchScope.value !== id) searchScope.checked = false;
      searchScope.value = id;
      searchScope.disabled = !id;
      searchScope.parentElement.hidden = !id;
    }
  };

  const showPanel = () => {
    panel.focus({preventScroll: true});
    panel.scrollIntoView({block: 'nearest'});
  };

  const primaryClick = event => event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;

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
    if (own.length) groups.push({ title: active?.branchIpa || active?.branchMeaning ? active.branchZh : '本级', ipa: active?.branchIpa, meaning: active?.branchMeaning, chips: own });
    const lis = branchLi
      ? branchLi.querySelectorAll(':scope > details > ul.tree-nodes > li.tree-branch')
      : outline.querySelectorAll(':scope > .tree-nodes > li.tree-branch');
    lis.forEach((li) => {
      const chips = subtreeChips(li.querySelector('details'));
      if (chips.length) {
        const { branchZh, branchIpa, branchMeaning } = li.querySelector('summary').dataset;
        groups.push({ title: branchZh, ipa: branchIpa, meaning: branchMeaning, chips });
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

  const renderWall = (branchLi, scroll = true, update = true) => {
    wallBranch = branchLi;
    if (update) setUrl({branch: branchLi?.id});
    syncBranch(branchLi, update);
    markOn();
    window.TTS?.stopSequence();
    const wall = el('div', 'tree-wall');
    const crumb = el('p', 'tree-crumb');
    const names = crumbOf(branchLi);
    names.forEach((name, index) => {
      if (index) crumb.append(el('span', 'tree-crumb-sep', '›'));
      crumb.append(el('span', index === names.length - 1 ? 'tree-crumb-here' : '', name));
    });
    const wrap = el('div', 'tree-wall-groups');
    groupsOf(branchLi).forEach((group) => {
      const box = el('div', 'tree-wall-group');
      const head = el('p', 'tree-wall-group-title');
      head.append(el('span', '', group.title));
      if (group.ipa) head.append(el('i', 'tree-family-sound', group.ipa));
      if (group.meaning) head.append(el('span', 'morph-wall-meaning', group.meaning));
      head.append(el('i', '', `${group.chips.length} 词`));
      const chips = el('div', 'tree-wall-words');
      group.chips.forEach((source) => chips.append(wallEntry(source)));
      box.append(head, chips);
      wrap.append(box);
    });
    wall.append(crumb, wrap);
    panel.replaceChildren(wall);
    if (scroll) showPanel();
  };

  /* —— 词卡 —— */
  const morphLink = (label, query) => {
    const link = el('a', 'morph-related-link', label);
    link.href = `?root=morphology&${query}`;
    return link;
  };
  const renderMorphology = (word) => {
    const section = el('section', 'morph-analysis');
    section.setAttribute('aria-label', '构词解析');
    const family = el('p', 'morph-family-label', `${word.family_form} · ${word.family_meaning}`);
    family.append(el('span', '', word.pos));
    const build = el('p', 'morph-build', word.build);
    build.lang = 'en';
    const parts = el('dl', 'morph-parts-list');
    word.parts.forEach(part => {
      const row = el('div');
      const term = el('dt', `morph-part-${part.kind}`, part.text);
      term.lang = 'en';
      row.append(term, el('dd', '', part.meaning));
      parts.append(row);
    });
    const example = el('blockquote', 'morph-example');
    const sentence = el('p', '', word.example.en);
    sentence.lang = 'en';
    const say = sayButton(word.example.en, 'say-chip morph-example-say');
    say.textContent = '🔊 读例句';
    say.setAttribute('aria-label', '朗读例句');
    example.append(sentence, el('p', '', word.example.zh), say);
    const siblings = el('nav', 'morph-related');
    siblings.setAttribute('aria-label', '同一家族的派生词');
    siblings.append(el('b', '', '这一家族'));
    morphology.entries.filter(entry => entry.family_id === word.family_id && entry.morph_id !== word.morph_id)
      .forEach(entry => siblings.append(morphLink(entry.en, `entry=${encodeURIComponent(entry.morph_id)}`)));
    const related = morphology.families.filter(family => family.id !== word.family_id
      && word.parts.some(part => part.kind === family.kind && family.forms.includes(part.text)));
    section.append(family, build, parts, el('p', 'morph-word-note', word.note), example, siblings);
    if (related.length) {
      const links = el('nav', 'morph-related');
      links.setAttribute('aria-label', '关联构词成分');
      links.append(el('b', '', '继续看这些成分'));
      related.forEach(family => links.append(morphLink(`${family.form} · ${family.meaning}`, `branch=${encodeURIComponent(family.id)}`)));
      section.append(links);
    }
    const sources = el('details', 'morph-word-sources');
    sources.append(el('summary', '', '本家族参考资料（需联网）'));
    const list = el('ul');
    word.sources.forEach(source => {
      const item = el('li');
      const link = el('a', '', `${source.title} ↗`);
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      item.append(link);
      list.append(item);
    });
    sources.append(list);
    section.append(sources);
    return section;
  };
  const findBranch = (id) => {
    const node = document.getElementById(id);
    return node?.classList.contains('tree-branch') && outline.contains(node) ? node : null;
  };

  const renderCard = (data, update = true) => {
    window.TTS?.stopSequence();
    const card = el('article', 'tree-word-card');
    card.id = 'tree-word-card';
    card.append(el('p', 'tree-word-emoji', data.emoji || '🔤'));
    const headline = el('p', 'tree-word-headline');
    const word = el('b');
    addSpelling(word, data);
    headline.append(word, sayButton(data.en));
    card.append(headline);
    if (data.ipa) card.append(el('p', 'tree-word-ipa', data.ipa));
    if (data.zh) card.append(el('p', 'tree-word-zh', data.zh));
    const morphWord = morphEntries.get(data.morphId);
    if (morphWord) card.append(renderMorphology(morphWord));
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
    const locate = el('button', 'button small ghost', '定位到树上 ↑');
    locate.type = 'button';
    locate.addEventListener('click', () => {
      if (outline.hidden) board.querySelector('[data-family-view="outline"]')?.click();
      const chip = outline.querySelector('.tree-word.on');
      openPath(findBranch(data.nodeId));
      chip?.focus({preventScroll: true});
      chip?.scrollIntoView({block: 'nearest'});
    });
    const back = el('button', 'button small ghost tree-back', '← 返回词墙');
    back.type = 'button';
    actions.append(dict, locate, back);
    card.append(actions);
    panel.replaceChildren(card);
    const branch = findBranch(data.nodeId);
    openPath(branch);
    syncBranch(branch, update);
    markOn(data);
    back.addEventListener('click', () => renderWall(wallBranch));
    if (update) {
      setUrl(data.morphId ? {entry: data.morphId} : {word: data.en, branch: data.nodeId});
      showPanel();
    }
  };

  /* —— 事件：点枝干选词墙，点词出卡 —— */
  shell.addEventListener('click', (event) => {
    const summary = event.target.closest('.tree-branch summary');
    if (summary) {
      const li = summary.closest('.tree-branch');
      if (li) renderWall(li, false);
      return;
    }
    const chip = event.target.closest('.tree-word');
    if (chip && primaryClick(event)) {
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
  const onChip = board.querySelector('.tree-word.on');
  if (onChip) {
    wallBranch = containingBranch(onChip);
    renderCard(chipData(onChip), false);
    if (!location.hash) requestAnimationFrame(() => panel.scrollIntoView({block: 'nearest'}));
  } else renderWall(findBranch(params.get('branch')), false, false);

  const closeCompactSidebar = () => {
    sidebar.closest('.tree-layout[data-sl-mode="compact"][data-sl-open="true"]')
      ?.querySelector('.sl-toggle:not(.sl-collapse)')?.click();
  };
  const connectFamilyLinks = (choose) => {
    sidebar.addEventListener('click', event => {
      const link = event.target.closest('[data-tree-branch-link]');
      if (!link || !primaryClick(event)) return;
      event.preventDefault();
      closeCompactSidebar();
      choose(findBranch(link.dataset.treeBranchLink));
    });
  };

  /* 拼写家族：复用目录中的例词，不另存释义或读音。 */
  const memory = board.querySelector('[data-family-memory]');
  if (!memory) {
    connectFamilyLinks(branch => {
      openPath(branch);
      renderWall(branch);
    });
    return;
  }
  const views = board.querySelector('[data-family-views]');
  const deck = memory.querySelector('[data-family-deck]');
  const progress = memory.querySelector('[data-family-progress]');
  const previous = memory.querySelector('[data-family-prev]');
  const next = memory.querySelector('[data-family-next]');
  const families = Array.from(outline.querySelectorAll(':scope > .tree-nodes > .tree-branch'));
  const viewed = new Set();
  let flips = [];
  let activeFamily;
  const updateProgress = () => {
    progress.textContent = `这一家族已翻看 ${viewed.size}／${flips.length} 张${viewed.size === flips.length ? '，试着把它们连起来读一读！' : '，先猜一猜，再翻卡。'}`;
  };
  const renderMemory = (family) => {
    activeFamily = family;
    memory.querySelector('[data-family-title]').textContent = `${family.querySelector('summary').dataset.branchZh} 家族记忆卡`;
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
        if (!primaryClick(event)) return;
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
    openPath(family);
    if (activeFamily !== family) renderMemory(family);
    if (memory.hidden) renderWall(family);
    else {
      wallBranch = family;
      syncBranch(family);
      markOn();
      window.TTS?.stopSequence();
      setUrl({branch: family.id});
      renderMemoryGuide(family);
    }
  };
  connectFamilyLinks(family => {
    if (!family) return;
    chooseFamily(family);
    if (!memory.hidden) {
      const title = memory.querySelector('[data-family-title]');
      title.tabIndex = -1;
      title.focus({preventScroll: true});
      title.scrollIntoView({block: 'nearest'});
    }
  });
  previous.addEventListener('click', () => {
    const index = families.indexOf(activeFamily);
    if (index > 0) chooseFamily(families[index - 1]);
  });
  next.addEventListener('click', () => {
    const index = families.indexOf(activeFamily);
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
    const family = wallBranch || families[0];
    if (isMemory) {
      if (family !== activeFamily) renderMemory(family);
      if (!params.has('within')) syncBranch(family);
      if (!panel.querySelector('.tree-word-card')) renderMemoryGuide(family);
    } else if (!panel.querySelector('.tree-word-card')) renderWall(wallBranch, false, false);
  };
  views.hidden = false;
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

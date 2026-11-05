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
  const sceneUrl = shell.dataset.sceneUrl || '/words/';
  const dictUrl = shell.dataset.dictUrl || '/dictionary/';

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== '') node.textContent = text;
    return node;
  };

  /* —— 展开状态记忆：按枝干 id 存（key v2，与旧版文本键不兼容）—— */
  const STORE_KEY = 'words_tree_expand_v2';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch (e) { /* 忽略 */ }
  const save = () => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(saved)); } catch (e) { /* 忽略 */ }
  };
  document.querySelectorAll('.tree-branch details').forEach((details) => {
    const id = details.closest('.tree-branch')?.id;
    if (!id) return;
    if (id in saved) details.open = saved[id];
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
  });

  // 一个 details 的直属词（:scope > 避开嵌套枝干和末尾 leaves 的重复渲染）
  const ownChips = (details) =>
    Array.from(details.querySelectorAll(':scope > .tree-node-words .tree-word'));
  const rootOwnChips = () =>
    Array.from(board.querySelectorAll(':scope > .tree-root-words .tree-word'));

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
    if (own.length) groups.push({ title: '本级', chips: own });
    const lis = branchLi
      ? branchLi.querySelectorAll(':scope > details > ul.tree-nodes > li.tree-branch')
      : board.querySelectorAll(':scope > .tree-nodes > li.tree-branch');
    lis.forEach((li) => {
      const chips = subtreeChips(li.querySelector('details'));
      if (chips.length) {
        groups.push({ title: li.querySelector('summary')?.dataset.branchZh || '', chips });
      }
    });
    return groups;
  };

  const wallChip = (data) => {
    const chip = el('a', 'tree-word');
    chip.href = '#';
    chip.dataset.en = data.en;
    chip.dataset.zh = data.zh;
    chip.append(el('b', '', data.en));
    if (data.zh) chip.append(el('i', '', data.zh));
    return chip;
  };

  const renderWall = (branchLi) => {
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
      head.append(el('span', '', group.title), el('i', '', String(group.chips.length)));
      const chips = el('div', 'tree-wall-words');
      group.chips.forEach((source) => chips.append(wallChip(chipData(source))));
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
          chip.hidden = !show;
          if (show) visible += 1;
        });
        box.hidden = visible === 0;
      });
    });
    panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  /* —— 词卡 —— */
  const renderCard = (data) => {
    const card = el('article', 'tree-word-card');
    card.append(el('p', 'tree-word-emoji', data.emoji || '🔤'));
    const headline = el('p', 'tree-word-headline');
    headline.append(el('b', '', data.en));
    const say = el('button', 'say-chip', '🔊');
    say.type = 'button';
    say.dataset.say = data.en;
    say.setAttribute('aria-label', `朗读 ${data.en}`);
    headline.append(say);
    card.append(headline);
    if (data.ipa) card.append(el('p', 'tree-word-ipa', data.ipa));
    if (data.zh) card.append(el('p', 'tree-word-zh', data.zh));
    if (data.scene) card.append(el('p', 'tree-word-scene', `场景：${data.scene}`));
    if (data.status && data.status !== '来源一致') {
      card.append(el('p', 'tree-word-status', data.status));
    }
    const actions = el('div', 'tree-word-actions');
    const scene = el('a', 'button small', '去场景页学会它 →');
    scene.href = `${sceneUrl}?word=${encodeURIComponent(data.en)}`;
    const dict = el('a', 'button small ghost', '查词典 →');
    dict.href = `${dictUrl}?q=${encodeURIComponent(data.en)}`;
    const back = el('button', 'button small ghost tree-back', '← 返回词墙');
    back.type = 'button';
    actions.append(scene, dict, back);
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
    if (branchLi) {
      renderWall(branchLi);
    } else {
      renderWall(null);
    }
  }
})();

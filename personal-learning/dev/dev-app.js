/* 开发命令应用：读取 DEV_TOOLS 渲染速查与自测，掌握标记保存在本机。 */
(function () {
  'use strict';
  const data = DEV_TOOLS;
  const tools = data.tools;
  const byTool = new Map(tools.map(tool => [tool.id, tool]));
  const searchInput = document.getElementById('commandSearch');
  const clearSearch = document.getElementById('clearSearch');
  const quizButton = document.getElementById('quizButton');
  const resumeButton = document.getElementById('resumeButton');
  const content = document.getElementById('devContent');
  const toolNav = document.getElementById('toolNav');
  const progressLabel = document.getElementById('progressLabel');
  const progressBar = document.getElementById('devProgress');
  const statsBox = document.getElementById('devStats');
  const storageNotice = document.getElementById('storageNotice');
  const viewStatus = document.getElementById('viewStatus');

  function readRaw() {
    try { return JSON.parse(localStorage.getItem(DevState.key) || 'null'); } catch (error) { return null; }
  }
  let state = DevState.normalize(readRaw(), data);
  let quizMode = false;
  let query = '';
  const revealed = new Set();

  function save() {
    try { localStorage.setItem(DevState.key, JSON.stringify(state)); storageNotice.hidden = true; }
    catch (error) { storageNotice.hidden = false; }
  }
  function say(message) { viewStatus.textContent = message; }
  function esc(text) {
    return String(text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[ch]));
  }
  function commandsOf(tool) {
    return tool.groups.flatMap(group => group.commands.map(command => ({ command, group })));
  }
  function masteredOf(tool) {
    return commandsOf(tool).filter(entry => state.mastered[entry.command.id] === true).length;
  }

  function currentTool() {
    const match = window.location.hash.match(/^#tool=([a-z0-9-]+)$/);
    return match ? byTool.get(match[1]) || null : null;
  }
  function matches(command, text) {
    const key = text.trim().toLowerCase();
    if (!key) return true;
    return [command.cmd, command.desc, command.example || '', command.note || ''].some(part => part.toLowerCase().includes(key));
  }

  function commandCard(command) {
    const mastered = state.mastered[command.id] === true;
    const hidden = quizMode && !revealed.has(command.id);
    return `<article class="command-card${mastered ? ' is-mastered' : ''}" data-command="${esc(command.id)}">
<div class="command-top">
<button class="command-cmd${hidden ? ' quiz-hide' : ''}" type="button" data-dev-act="copy" data-copy="${esc(command.cmd)}" data-id="${esc(command.id)}" title="${hidden ? '先看描述猜一猜，点击揭晓' : '点击复制命令'}"><code>${esc(command.cmd)}</code></button>
<button class="copy-button" type="button" data-dev-act="copy" data-copy="${esc(command.cmd)}" data-id="${esc(command.id)}" title="复制命令">复制</button>
<button class="master-button${mastered ? ' on' : ''}" type="button" data-dev-act="toggle" data-id="${esc(command.id)}" aria-pressed="${mastered}">${mastered ? '已掌握' : '标记掌握'}</button>
</div>
<p class="command-desc">${esc(command.desc)}</p>
${command.example ? `<button class="command-example" type="button" data-dev-act="copy" data-copy="${esc(command.example)}" data-id="${esc(command.id)}" title="点击复制示例"><span class="example-label">示例</span><code>${esc(command.example)}</code></button>` : ''}
${command.note ? `<p class="command-note">${esc(command.note)}</p>` : ''}
</article>`;
  }
  function groupSection(tool, group) {
    const done = group.commands.filter(command => state.mastered[command.id] === true).length;
    return `<section class="command-group" aria-label="${esc(tool.name)}·${esc(group.name)}">
<h3 class="group-name">${esc(group.name)}<small>${done} / ${group.commands.length} 已掌握</small></h3>
<div class="command-grid">${group.commands.map(commandCard).join('')}</div>
</section>`;
  }
  function renderTool(tool) {
    return tool.groups.map(group => groupSection(tool, group)).join('');
  }
  function renderSearch(text) {
    const sections = tools.map(tool => ({ tool, hits: commandsOf(tool).filter(entry => matches(entry.command, text)) })).filter(section => section.hits.length);
    if (!sections.length) return `<p class="empty-result">没有找到与「${esc(text)}」相关的命令，换个关键词试试。</p>`;
    return sections.map(section => `<section class="command-group" aria-label="搜索结果·${esc(section.tool.name)}">
<h3 class="group-name">${section.tool.emoji} ${esc(section.tool.name)}<small>${section.hits.length} 条结果</small></h3>
<div class="command-grid">${section.hits.map(entry => commandCard(entry.command)).join('')}</div>
</section>`).join('');
  }
  function renderOverview() {
    return `<p class="overview-lead">挑一个工具进入速查；也可以直接在上面的搜索框找命令，或在任何页面输入 <kbd>/</kbd> 开搜。</p>
<section class="tool-grid" aria-label="全部工具">${tools.map(tool => {
  const total = commandsOf(tool).length;
  const done = masteredOf(tool);
  return `<a class="tool-card" href="#tool=${esc(tool.id)}" data-tool="${esc(tool.id)}">
<span class="tool-emoji" aria-hidden="true">${tool.emoji}</span>
<h3>${esc(tool.name)}</h3>
<p>${esc(tool.tagline)}</p>
<div class="tool-card-foot"><span class="tool-count">${done} / ${total} 已掌握</span><span class="tool-enter">进入速查 <span aria-hidden="true">→</span></span></div>
<progress max="${total}" value="${done}" aria-label="${esc(tool.name)}掌握进度"></progress>
</a>`;
}).join('')}</section>`;
  }

  function renderSidebar(tool) {
    toolNav.innerHTML = tools.map(entry => {
      const total = commandsOf(entry).length;
      const done = masteredOf(entry);
      return `<a href="#tool=${esc(entry.id)}"${tool && entry.id === tool.id ? ' aria-current="page"' : ''}><span class="tool-link-name"><span aria-hidden="true">${entry.emoji}</span> ${esc(entry.name)}</span><small>${done}/${total}</small></a>`;
    }).join('');
    const total = tools.reduce((sum, entry) => sum + commandsOf(entry).length, 0);
    const done = tools.reduce((sum, entry) => sum + masteredOf(entry), 0);
    progressLabel.textContent = done + ' / ' + total;
    progressBar.max = total;
    progressBar.value = done;
    if (statsBox) {
      statsBox.innerHTML = `<span><strong>${tools.length}</strong>常用工具</span><span><strong>${total}</strong>常用命令</span><span><strong>${done}</strong>已掌握</span>`;
    }
  }
  function render() {
    const tool = currentTool();
    renderSidebar(tool);
    if (query.trim()) {
      content.innerHTML = renderSearch(query);
    } else if (tool) {
      content.innerHTML = renderTool(tool);
      if (state.lastTool !== tool.id) { state.lastTool = tool.id; save(); }
    } else {
      content.innerHTML = renderOverview();
    }
    resumeButton.innerHTML = state.lastTool ? `继续：${esc(byTool.get(state.lastTool).name)} <span aria-hidden="true">→</span>` : '开始速查 <span aria-hidden="true">→</span>';
    clearSearch.hidden = !query;
  }

  function copyText(text, button, label) {
    const done = () => {
      say('已复制：' + text);
      if (!button || !button.classList.contains('copy-button')) return;
      if (!button.dataset.label) button.dataset.label = button.textContent;
      button.classList.add('done');
      button.textContent = '已复制';
      window.clearTimeout(copyText.timer);
      copyText.timer = window.setTimeout(() => { button.classList.remove('done'); button.textContent = button.dataset.label; }, 1200);
    };
    const fallback = () => {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try { document.execCommand('copy'); done(); } catch (error) { say('复制失败，请手动选择文本复制。'); }
      area.remove();
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
    if (label) say(label);
  }

  document.addEventListener('click', event => {
    const target = event.target.closest('[data-dev-act]');
    if (!target) return;
    const action = target.dataset.devAct;
    if (action === 'copy') {
      const id = target.dataset.id;
      if (quizMode && id && target.classList.contains('command-cmd') && !revealed.has(id)) {
        revealed.add(id);
        target.classList.remove('quiz-hide');
        target.title = '点击复制命令';
        say('已揭晓：' + target.dataset.copy);
        return;
      }
      copyText(target.dataset.copy, target);
    } else if (action === 'toggle') {
      const id = target.dataset.id;
      const command = tools.flatMap(tool => tool.groups).flatMap(group => group.commands).find(item => item.id === id);
      if (!command) return;
      const mastered = state.mastered[id] !== true;
      if (mastered) state.mastered[id] = true; else delete state.mastered[id];
      save();
      say((mastered ? '已把「' : '已取消「') + command.cmd + (mastered ? '」标为已掌握。' : '」的掌握标记。'));
      render();
    } else if (action === 'resume') {
      window.location.hash = '#tool=' + state.lastTool;
      if (!state.lastTool) render();
    } else if (action === 'quiz') {
      quizMode = !quizMode;
      if (!quizMode) revealed.clear();
      quizButton.setAttribute('aria-pressed', String(quizMode));
      quizButton.textContent = quizMode ? '退出自测' : '遮住自测';
      say(quizMode ? '自测模式：命令已遮住，先看描述猜一猜，再点击揭晓。' : '已退出自测模式。');
      render();
    } else if (action === 'clear-search') {
      query = '';
      searchInput.value = '';
      clearSearch.hidden = true;
      render();
      searchInput.focus();
    }
  });
  searchInput.addEventListener('input', () => {
    query = searchInput.value;
    render();
  });
  searchInput.addEventListener('keydown', event => {
    if (event.key === 'Escape' && searchInput.value) {
      query = '';
      searchInput.value = '';
      clearSearch.hidden = true;
      render();
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
    if (document.activeElement === searchInput) return;
    event.preventDefault();
    searchInput.focus();
  });
  window.addEventListener('hashchange', render);
  window.addEventListener('pageshow', render);

  render();
  window.DevLearning = {
    get state() { return state; },
    data, tools
  };
})();

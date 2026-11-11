/* 开发命令速查：本地渲染、筛选、复制、自测与掌握记录。 */
(function () {
  'use strict';
  const data = DEV_TOOLS;
  const tools = data.tools;
  const byTool = new Map(tools.map(tool => [tool.id, tool]));
  const allCommands = tools.flatMap(tool => tool.groups.flatMap(group => group.commands));
  const byCommand = new Map(allCommands.map(command => [command.id, command]));
  const el = id => document.getElementById(id);
  const searchInput = el('commandSearch');
  const clearSearch = el('clearSearch');
  const quizButton = el('quizButton');
  const resumeButton = el('resumeButton');
  const content = el('devContent');
  const toolNav = el('toolNav');
  const toolSelect = el('toolSelect');
  const scopeSelect = el('searchScope');
  const masterySelect = el('masteryFilter');
  const storageNotice = el('storageNotice');
  const viewStatus = el('viewStatus');
  const copyStatus = el('copyStatus');
  let storageFailed = false;
  function readRaw() {
    let raw;
    try { raw = localStorage.getItem(DevState.key); }
    catch (error) { storageFailed = true; return null; }
    try { return JSON.parse(raw || 'null'); }
    catch (error) { return null; }
  }
  let state = DevState.normalize(readRaw(), data);
  let quizMode = false;
  let query = '';
  let renderedHash = window.location.hash;
  const revealed = new Set();
  let toastTimer;

  function save() {
    try { localStorage.setItem(DevState.key, JSON.stringify(state)); storageFailed = false; }
    catch (error) { storageFailed = true; }
    storageNotice.hidden = !storageFailed;
  }
  function say(message) { viewStatus.textContent = message; }
  function toast(message) {
    copyStatus.textContent = message;
    copyStatus.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { copyStatus.hidden = true; }, 2200);
  }
  function esc(text) {
    return String(text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }
  function commandsOf(tool) { return tool.groups.flatMap(group => group.commands); }
  function masteredOf(tool) { return commandsOf(tool).filter(command => state.mastered[command.id] === true).length; }
  function route() { return DevCore.route(window.location.hash, data); }
  function href(tool, suffix = '') { return '#tool=' + tool.id + suffix; }
  function resetSearch() { query = ''; searchInput.value = ''; }
  function navigate(hash) {
    resetSearch();
    window.location.hash = hash;
    render();
    scrollToRoute(true);
  }

  function commandCard(tool, command) {
    const mastered = state.mastered[command.id] === true;
    const hidden = quizMode && !revealed.has(command.id);
    return `<article class="command-card${mastered ? ' is-mastered' : ''}${route().command?.id === command.id ? ' is-located' : ''}" id="cmd-${esc(command.id)}" data-command="${esc(command.id)}" tabindex="-1">
<div class="command-top">
<button class="command-cmd${hidden ? ' quiz-hide' : ''}" type="button" data-dev-act="copy" data-copy="${hidden ? '' : esc(command.cmd)}" data-id="${esc(command.id)}" aria-label="${hidden ? '揭晓命令：' + esc(command.desc) : '复制命令：' + esc(command.cmd)}">${hidden ? '<span class="reveal-label">想好了吗？点击揭晓</span>' : '<code>' + esc(command.cmd) + '</code>'}</button>
<button class="copy-button" type="button" data-dev-act="copy" data-copy="${hidden ? '' : esc(command.cmd)}" data-id="${esc(command.id)}" aria-label="${hidden ? '揭晓命令' : '复制：' + esc(command.cmd)}">${hidden ? '揭晓' : '复制'}</button>
</div>
<p class="command-desc">${esc(command.desc)}</p>
${!hidden && command.example ? `<button class="command-example" type="button" data-dev-act="copy" data-copy="${esc(command.example)}" data-id="${esc(command.id)}" aria-label="复制示例：${esc(command.example)}"><span class="example-label">示例</span><code>${esc(command.example)}</code></button>` : ''}
${!hidden && command.note ? `<p class="command-note${command.note.startsWith('⚠️') ? ' is-warning' : ''}">${esc(command.note)}</p>` : ''}
<div class="command-foot"><a class="command-link" href="${href(tool, '&command=' + command.id)}" aria-label="定位此条命令：${esc(command.desc)}">定位此条</a><button class="master-button${mastered ? ' on' : ''}" type="button" data-dev-act="toggle" data-id="${esc(command.id)}" aria-pressed="${mastered}">${mastered ? '✓ 已掌握' : '标记掌握'}</button></div>
</article>`;
  }
  function groupSection(tool, group, searching) {
    const done = group.commands.filter(command => state.mastered[command.id] === true).length;
    return `<section class="command-group" id="group-${esc(group.id)}" aria-labelledby="heading-${esc(group.id)}" data-tool="${esc(tool.id)}">
<h3 class="group-name" id="heading-${esc(group.id)}">${searching ? esc(tool.name) + ' · ' : ''}${esc(group.name)}<small>${group.commands.length} 条 · ${done} 已掌握</small></h3>
<div class="command-grid">${group.commands.map(command => commandCard(tool, command)).join('')}</div></section>`;
  }
  function renderOverview() {
    return `<div class="workspace-heading"><div><h2>今天要查什么？</h2><p>选一个工具按场景查阅，或直接搜索遇到的问题。</p></div><span class="workspace-meta">内容更新：${esc(data.updatedAt)}</span></div>
<section class="tool-grid" aria-label="全部工具">${tools.map(tool => {
      const total = commandsOf(tool).length;
      const done = masteredOf(tool);
      return `<a class="tool-card" href="${href(tool)}" data-tool="${esc(tool.id)}"><div class="tool-card-title"><span class="tool-emoji" aria-hidden="true">${tool.emoji}</span><h3>${esc(tool.name)}</h3><span class="tool-arrow" aria-hidden="true">↗</span></div><p>${esc(tool.tagline)}</p><div class="tool-card-foot"><span class="tool-count">${total} 条命令</span><span class="tool-enter">${done} 条已掌握</span></div><progress max="${total}" value="${done}" aria-label="${esc(tool.name)}掌握进度"></progress></a>`;
    }).join('')}</section><p class="overview-lead">命令中的「文件名」「服务名」「网址」等要换成自己的值。先看适用环境和提示，再执行。</p>`;
  }
  function toolHeading(tool, count) {
    return `<div class="workspace-heading"><div><a class="back-link" href="#">全部工具</a><h2><span aria-hidden="true">${tool.emoji}</span> ${esc(tool.name)}</h2><p>${esc(tool.tagline)}</p></div><span class="workspace-meta">显示 ${count} / ${commandsOf(tool).length} 条</span></div><p class="platform-note">适用环境：${esc(tool.platform)}</p>${tool.learning ? `<p class="tool-learning"><a href="${esc(tool.learning.href)}">${esc(tool.learning.label)} →</a></p>` : ''}`;
  }
  function referenceLinks(tool) {
    return `<details class="tool-references"><summary>官方参考资料 <span>（需联网）</span></summary><div>${tool.references.map(reference => `<a href="${esc(reference.url)}" target="_blank" rel="noopener noreferrer">${esc(reference.name)} ↗</a>`).join('')}</div></details>`;
  }
  function renderCommands(tool) {
    const searching = Boolean(query.trim());
    const sections = DevCore.select(data, { toolId: tool && tool.id, query, scope: scopeSelect.value, mastery: masterySelect.value, mastered: state.mastered });
    const count = sections.reduce((sum, section) => sum + section.groups.reduce((n, group) => n + group.commands.length, 0), 0);
    let heading;
    if (searching) {
      heading = `<div class="workspace-heading"><div><h2>搜索「${esc(query.trim())}」</h2><p>${scopeSelect.value === 'current' && tool ? esc(tool.name) : '全部工具'} · ${count} 条结果${masterySelect.value === 'all' ? '' : ' · ' + (masterySelect.value === 'mastered' ? '已掌握' : '未掌握')}</p></div><button class="text-button" type="button" data-dev-act="clear-search">退出搜索</button></div>`;
    } else if (tool) heading = toolHeading(tool, count);
    else heading = `<div class="workspace-heading"><div><h2>${masterySelect.value === 'mastered' ? '已掌握的命令' : '还未掌握的命令'}</h2><p>全部工具 · ${count} 条</p></div><button class="text-button" type="button" data-dev-act="reset-filters">返回工具总览</button></div>`;
    const groups = sections.flatMap(section => section.groups.map(group => ({ tool: section.tool, group })));
    const nav = !searching && tool && groups.length ? `<nav class="group-nav" aria-label="当前工具分组">${groups.map(entry => `<a href="${href(tool, '&group=' + entry.group.id)}"${route().group?.id === entry.group.id ? ' aria-current="location"' : ''}>${esc(entry.group.name)}<small>${entry.group.commands.length}</small></a>`).join('')}</nav>` : '';
    const empty = `<div class="empty-result"><h3>当前条件下没有命令</h3><p>试试更短的关键词，或重置搜索和掌握筛选。</p><button class="quiz-button" type="button" data-dev-act="reset-filters">重置筛选</button></div>`;
    say('显示 ' + count + ' 条命令。');
    return heading + nav + (count ? groups.map(entry => groupSection(entry.tool, entry.group, searching && sections.length > 1)).join('') : empty) + (tool && !searching ? referenceLinks(tool) : '');
  }

  function renderSidebar(tool, searching) {
    toolNav.innerHTML = `<a href="#"${!tool && !searching ? ' aria-current="page"' : ''}><span class="tool-link-name">全部工具</span><small>${tools.length} 类</small></a>` + tools.map(entry => `<a href="${href(entry)}"${tool && entry.id === tool.id && !searching ? ' aria-current="page"' : ''}><span class="tool-link-name"><span aria-hidden="true">${entry.emoji}</span> ${esc(entry.name)}</span><small>${masteredOf(entry)}/${commandsOf(entry).length}</small></a>`).join('');
    toolSelect.value = tool ? tool.id : '';
    const done = tools.reduce((sum, entry) => sum + masteredOf(entry), 0);
    el('progressLabel').textContent = done + ' / ' + allCommands.length;
    el('devProgress').max = allCommands.length;
    el('devProgress').value = done;
    el('devStats').innerHTML = `<span><strong>${tools.length}</strong>工具分类</span><span><strong>${allCommands.length}</strong>常用命令</span><span><strong>${done}</strong>已掌握</span>`;
  }
  function render() {
    renderedHash = window.location.hash;
    const { tool } = route();
    const searching = Boolean(query.trim());
    renderSidebar(tool, searching);
    scopeSelect.querySelector('[value="current"]').disabled = !tool;
    if (!tool) scopeSelect.value = 'all';
    if (tool && state.lastTool !== tool.id) { state.lastTool = tool.id; save(); }
    content.innerHTML = !searching && !tool && masterySelect.value === 'all' ? renderOverview() : renderCommands(tool);
    resumeButton.innerHTML = state.lastTool ? `继续：${esc(byTool.get(state.lastTool).name)} <span aria-hidden="true">→</span>` : '开始速查 <span aria-hidden="true">→</span>';
    clearSearch.hidden = !query;
    storageNotice.hidden = !storageFailed;
    document.title = (searching ? '搜索结果' : tool ? tool.name : '工具总览') + ' · 开发命令 · 个人学习';
  }
  function scrollToRoute(focus) {
    const current = route();
    const target = current.command ? el('cmd-' + current.command.id) : current.group ? el('group-' + current.group.id) : content;
    if (!target) return;
    if (focus) (current.command ? target : content).focus({ preventScroll: true });
    // 普通工具切换保留工具栏；分组和单条链接定位到对应内容。
    const toolbar = el('commandSearch').closest('.reader-tools');
    const inset = (getComputedStyle(toolbar).position === 'sticky' ? toolbar.getBoundingClientRect().height : 0) + 18;
    const top = target.getBoundingClientRect().top + window.scrollY - inset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
  }
  function restoreFocus(id, action) {
    const card = el('cmd-' + id);
    const target = card && card.querySelector('[data-dev-act="' + action + '"]');
    if (target) target.focus({ preventScroll: true });
  }
  async function copyText(text) {
    const done = () => toast('已复制：' + text);
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(text); done(); return; } catch (error) { /* 本地回退 */ }
    }
    const active = document.activeElement;
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(area);
    area.select();
    try {
      if (document.execCommand('copy')) done();
      else toast('复制失败，请手动选择命令文本复制。');
    } catch (error) { toast('复制失败，请手动选择命令文本复制。'); }
    area.remove();
    if (active && active.isConnected) active.focus({ preventScroll: true });
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && (link.getAttribute('href') === '#' || link.getAttribute('href').startsWith('#tool='))) {
      event.preventDefault();
      // 定位链接必须让目标在筛选后仍可见。
      if (link.hash.includes('&command=') || link.hash.includes('&group=')) masterySelect.value = 'all';
      navigate(link.getAttribute('href'));
      return;
    }
    const target = event.target.closest('[data-dev-act]');
    if (!target) return;
    const action = target.dataset.devAct;
    const id = target.dataset.id;
    if (action === 'copy') {
      if (quizMode && id && !revealed.has(id)) {
        revealed.add(id); render(); restoreFocus(id, 'copy');
        say('已揭晓：' + byCommand.get(id).cmd);
      } else copyText(target.dataset.copy);
    } else if (action === 'toggle') {
      const command = byCommand.get(id);
      if (!command) return;
      if (state.mastered[id]) delete state.mastered[id]; else state.mastered[id] = true;
      save(); render();
      if (el('cmd-' + id)) restoreFocus(id, 'toggle'); else masterySelect.focus({ preventScroll: true });
      say('已' + (state.mastered[id] ? '标记掌握：' : '取消掌握：') + command.cmd);
    } else if (action === 'resume') {
      masterySelect.value = 'all';
      navigate(href(byTool.get(state.lastTool) || tools[0]));
    } else if (action === 'quiz') {
      quizMode = !quizMode;
      if (!quizMode) revealed.clear();
      quizButton.setAttribute('aria-pressed', String(quizMode));
      quizButton.textContent = quizMode ? '退出自测' : '遮住自测';
      render();
      say(quizMode ? '自测模式：先看说明猜命令，点击揭晓后可复制；示例和提示也会暂时收起。' : '已退出自测模式。');
    } else if (action === 'clear-search' || action === 'reset-filters') {
      resetSearch();
      if (action === 'reset-filters') { masterySelect.value = 'all'; scopeSelect.value = 'all'; }
      render(); searchInput.focus();
    }
  });
  searchInput.addEventListener('input', () => { query = searchInput.value; render(); });
  searchInput.addEventListener('keydown', event => {
    if (event.key === 'Escape') { resetSearch(); render(); }
  });
  scopeSelect.addEventListener('change', render);
  masterySelect.addEventListener('change', render);
  toolSelect.innerHTML = '<option value="">全部工具</option>' + tools.map(tool => `<option value="${tool.id}">${esc(tool.name)}</option>`).join('');
  toolSelect.addEventListener('change', () => navigate(toolSelect.value ? href(byTool.get(toolSelect.value)) : '#'));
  document.addEventListener('keydown', event => {
    if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    event.preventDefault(); searchInput.focus();
  });
  window.addEventListener('hashchange', () => {
    if (window.location.hash === renderedHash) return;
    resetSearch(); render(); scrollToRoute(true);
  });
  window.addEventListener('pageshow', () => { render(); if (route().command || route().group) scrollToRoute(false); });
  render();
  window.DevLearning = { get state() { return state; }, data, tools };
})();

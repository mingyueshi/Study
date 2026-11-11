/* 实操与选型视图：本地保存、复制和下载，不调用外部模型。 */
(function (root) {
  'use strict';
  const guide = AI_PRACTICE;
  const core = AIPracticeCore;
  const el = id => document.getElementById(id);
  const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const byTool = new Map(guide.tools.map(item => [item.id, item]));
  const byModel = new Map(guide.models.map(item => [item.id, item]));
  const byLab = new Map(guide.labs.map(item => [item.id, item]));
  let blocked = false;
  let raw = null;
  try { raw = localStorage.getItem(core.key); } catch (error) { blocked = true; }
  try { raw = JSON.parse(raw || 'null'); } catch (error) { raw = null; }
  let state = core.normalize(raw, guide);
  const filters = { practice: 'all', models: 'all', tools: 'all' };
  let toastTimer;
  function save() {
    try { localStorage.setItem(core.key, JSON.stringify(state)); blocked = false; }
    catch (error) { blocked = true; }
    const notice = el('practiceStorageNotice');
    if (notice) notice.hidden = !blocked;
  }
  function announce(text) { el('viewStatus').textContent = text; }
  function toast(text) {
    const box = el('aiCopyStatus');
    box.textContent = text; box.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { box.hidden = true; }, 2400);
  }
  async function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(text); toast('已复制，可粘贴到你选择的工具。'); return; } catch (error) { /* 本地文件回退 */ }
    }
    const active = document.activeElement;
    const area = document.createElement('textarea'); area.value = text; area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;opacity:0;'; document.body.appendChild(area); area.select();
    try { toast(document.execCommand('copy') ? '已复制，可粘贴到你选择的工具。' : '复制未成功，请选中文本后手动复制。'); }
    catch (error) { toast('复制未成功，请选中文本后手动复制。'); }
    area.remove(); if (active && active.isConnected) active.focus({ preventScroll: true });
  }
  function refs(item) {
    return '<div class="guide-sources"><span>官方资料 · 需联网 · 核对于 ' + guide.checkedAt + '</span>' + item.sources.map(id => '<a target="_blank" rel="noopener noreferrer" href="' + esc(guide.sources[id].url) + '">' + esc(guide.sources[id].title) + ' ↗</a>').join('') + '</div>';
  }
  function title(name, summary, meta = '') {
    return '<div class="view-heading"><div><h2 id="viewTitle">' + esc(name) + '</h2></div><span>' + esc(meta) + '</span></div><p class="view-lead">' + esc(summary) + '</p>';
  }
  function chips(items, type, lookup) {
    return '<div class="guide-links">' + items.map(id => '<a href="#' + type + '=' + esc(id) + '">' + esc(lookup.get(id).name || lookup.get(id).title) + ' ↗</a>').join('') + '</div>';
  }
  function filterBar(view, values) {
    return '<div class="catalog-filters guide-filters" role="group" aria-label="' + ({ practice: '实操分类', models: '模型使用方式', tools: '工具分类' })[view] + '">' + values.map(([id, name]) => '<button type="button" data-guide-act="filter" data-view="' + view + '" data-value="' + id + '" aria-pressed="' + (filters[view] === id) + '">' + esc(name) + '</button>').join('') + '</div>';
  }
  function empty() { return '<div class="empty-concepts"><h3>没有匹配的内容</h3><p>试试更短的关键词，或重置分类与搜索。</p><button type="button" data-guide-act="reset-search">重置筛选</button></div>'; }
  function labCards(labs) {
    return '<div class="lab-grid">' + labs.map((lab, index) => '<a class="lab-card" href="#lab=' + lab.id + '"><div class="lab-card-meta"><span>' + esc(lab.category) + '</span><span>' + (state.completed[lab.id] ? '✓ 已完成' : esc(lab.duration)) + '</span></div><h3>' + esc(lab.title) + '</h3><p>' + esc(lab.summary) + '</p><span class="lab-card-result">留下：' + esc(lab.deliverable) + '</span><span class="read-link">准备材料，开始动手 →</span></a>').join('') + '</div>';
  }
  function practice(query) {
    const labs = guide.labs.filter(item => core.matches(item, query) && (filters.practice === 'all' || item.category === filters.practice));
    const fold = !query && filters.practice === 'all';
    const primary = fold ? labs.filter(item => item.category !== '本地与工作流') : labs;
    const optional = fold ? labs.filter(item => item.category === '本地与工作流') : [];
    return title('材料实操', '用现成的示例材料练一次，观察模型回答，再核对结果与验收标准。', labs.length + ' 个任务 · ' + Object.keys(state.completed).length + ' 已完成') +
      '<p class="guide-note">有自己的开发任务，可直接使用<a href="#prompts">开发提示词</a>。这里提供练习材料、可编辑提示词和检查表；联网工具与首次模型下载已在任务中说明。</p>' + filterBar('practice', [['all', '全部任务'], ...[...new Set(guide.labs.map(item => item.category))].map(name => [name, name])]) + (labs.length ? labCards(primary) + (optional.length ? '<details class="optional-guide"><summary>进阶选学：本地模型与工作流 · ' + optional.length + ' 项</summary>' + labCards(optional) + '</details>' : '') : empty());
  }
  function models(query) {
    const models = guide.models.filter(item => core.matches(item, query) && (filters.models === 'all' || item.access.includes(filters.models)));
    return title('大模型入门地图', '先认识模型家族，再按自己的任务、材料类型与使用条件选择具体版本。', guide.checkedAt + ' 核对 · ' + models.length + ' 个家族') +
      '<div class="model-tool-explainer">' + guide.modelBasics.map(item => '<p><b>' + esc(item.term) + '</b> ' + esc(item.description) + '</p>').join('') + '</div><details class="model-glossary"><summary>读懂开放权重、量化与 API</summary><dl>' + guide.modelGlossary.map(item => '<dt>' + esc(item.term) + '</dt><dd>' + esc(item.description) + '<span>' + item.sources.map(id => '<a target="_blank" rel="noopener noreferrer" href="' + esc(guide.sources[id].url) + '">' + esc(guide.sources[id].title) + '（需联网）↗</a>').join('') + '</span></dd>').join('') + '</dl></details>' + filterBar('models', [['all', '全部家族'], ['hosted', '有托管服务入口'], ['weights', '含开放权重版本']]) +
      (models.length ? '<div class="model-table" role="region" aria-label="模型家族对照"><table><thead><tr><th>模型家族</th><th>可以先试的任务</th><th>如何使用</th><th>选择时留意</th></tr></thead><tbody>' + models.map(model => '<tr><th scope="row"><a href="#model=' + model.id + '">' + esc(model.name) + ' ↗</a><span>' + esc(model.provider) + '</span></th><td>' + esc(model.useCases.join('；')) + '</td><td>' + esc(model.accessNote) + '</td><td>' + esc(model.choose) + '</td></tr>').join('') + '</tbody></table></div><p class="guide-note">这里按用途介绍，不做固定性能排名；用「同题比较两个模型」实操，留下自己任务上的选择依据。</p><a class="guide-inline-action" href="#lab=model-comparison">用同一份题目试两个模型 →</a>' : empty());
  }
  function tools(query) {
    const items = guide.tools.filter(item => core.matches(item, query) && (filters.tools === 'all' || item.category === filters.tools));
    const groups = guide.categories.map(category => ({ category, tools: items.filter(tool => tool.category === category.id) })).filter(group => group.tools.length);
    return title('工具使用指南', '按你要完成的任务选入口：先做一次小练习，再决定是否需要更复杂的工具。', guide.checkedAt + ' 核对 · ' + items.length + ' 个工具') + filterBar('tools', [['all', '全部工具'], ...guide.categories.map(item => [item.id, item.name])]) +
      (items.length ? groups.map(group => {
        const fold = group.category.id === 'workflow' && !query && filters.tools === 'all';
        return (fold ? '<details class="optional-guide"><summary>进阶选学 · 工作流工具</summary>' : '') + '<section class="tool-guide-group"><h3>' + esc(group.category.name) + '</h3><div class="tool-guide-list">' + group.tools.map(tool => '<a class="tool-guide-row" href="#tool=' + tool.id + '"><div><h4>' + esc(tool.name) + '</h4><span>查看怎么上手 ↗</span></div><p>' + esc(tool.summary) + '</p><p class="tool-first-task">第一次试：' + esc(tool.firstTask) + '</p><small>' + esc(tool.environment) + '</small></a>').join('') + '</div></section>' + (fold ? '</details>' : '');
      }).join('') : empty());
  }
  function profile(view) {
    const item = view.item;
    const model = view.view === 'model';
    const applicable = model ? guide.labs.filter(lab => lab.toolIds.some(id => item.toolIds.includes(id))) : guide.labs.filter(lab => lab.toolIds.includes(item.id));
    return '<a class="guide-back" href="#' + (model ? 'models' : 'tools') + '">← 返回' + (model ? '大模型地图' : '工具指南') + '</a>' + title(item.name, item.summary, model ? item.provider : guide.categories.find(category => category.id === item.category).name) +
      '<div class="guide-profile-layout"><article class="guide-profile-body"><h3>' + (model ? '怎样使用' : '使用环境') + '</h3><p>' + esc(model ? item.accessNote : item.environment) + '</p>' +
      (model ? '<h3>可以先试什么</h3><ul>' + item.useCases.map(text => '<li>' + esc(text) + '</li>').join('') + '</ul><h3>怎么做选择</h3><p>' + esc(item.choose) + '</p>' : '<h3>第一次试什么</h3><p>' + esc(item.firstTask) + '</p><h3>跟着做一遍</h3><ol>' + item.steps.map(text => '<li>' + esc(text) + '</li>').join('') + '</ol><a class="guide-inline-action" href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer">打开官方入口（需联网）↗</a>') +
      '<h3>使用时留意</h3><p>' + esc(item.caution) + '</p>' + refs(item) + '</article><aside class="guide-profile-aside"><h3>' + (model ? '相关使用工具' : '相关模型家族') + '</h3>' + (model ? chips(item.toolIds, 'tool', byTool) : item.modelIds.length ? chips(item.modelIds, 'model', byModel) : '<p>可用模型由工具入口、账号和配置决定，请在实际界面确认。</p>') + '<h3>选一个实操开始</h3>' + (applicable.length ? '<ul class="profile-labs">' + applicable.map(lab => '<li><a href="#lab=' + lab.id + '">' + esc(lab.title) + ' →</a></li>').join('') + '</ul>' : '<p>先完成一次同题比较，确认结果是否满足自己的检查标准。</p><a href="#lab=model-comparison">开始模型对照 →</a>') + '</aside></div>';
  }
  function labHTML(lab) {
    if (state.lastLab !== lab.id) { state.lastLab = lab.id; save(); }
    const prompt = state.prompts[lab.id] === undefined ? core.prompt(lab) : state.prompts[lab.id];
    return '<a class="guide-back" href="#practice">← 返回实操工坊</a>' + title(lab.title, lab.summary, lab.category + ' · ' + lab.duration) +
      '<p class="lab-environment">使用环境：' + esc(lab.environment) + '</p><div class="lab-tool-links"><span>可选工具</span>' + chips(lab.toolIds, 'tool', byTool) + '<button type="button" class="guide-secondary" data-guide-act="focus-prompt">跳到提示词 ↓</button></div>' +
      '<div class="lab-layout"><div class="lab-instructions"><section><h3>跟着做</h3><ol class="lab-steps">' + lab.steps.map(step => '<li>' + esc(step) + '</li>').join('') + '</ol><p class="lab-deliverable"><b>留下什么</b> ' + esc(lab.deliverable) + '</p></section><section><h3>练习材料</h3>' + lab.materials.map((material, index) => '<div class="lab-material"><div class="material-heading"><h4>' + esc(material.title) + '</h4><button type="button" class="guide-secondary" data-guide-act="download" data-material="' + index + '">下载 ' + esc(material.filename) + '</button></div><pre><code>' + esc(material.lines.join('\n')) + '</code></pre></div>').join('') + '</section><details class="lab-reference"><summary>查看参考思路</summary><ul>' + lab.reference.map(text => '<li>' + esc(text) + '</li>').join('') + '</ul>' + (lab.validation ? '<pre><code>' + esc(JSON.stringify(lab.validation.rows, null, 2)) + '</code></pre>' : '') + '</details><section><h3>连回基础概念</h3><div class="guide-links">' + lab.lessonIds.map(id => '<a href="#lesson=' + id + '">' + esc(AI_COURSE.stages.flatMap(stage => stage.lessons).find(lesson => lesson.id === id).title) + ' ↗</a>').join('') + '</div></section>' + refs(lab) + '</div>' +
      '<aside class="lab-workbench" aria-label="提示词与实操记录"><section class="prompt-workbench"><div class="material-heading"><h3><label for="labPrompt">改一改，再拿去试</label></h3><button type="button" class="guide-secondary" data-guide-act="reset-prompt">恢复原稿</button></div><p class="workbench-help">提示词已包含练习材料。可直接修改，保存在当前浏览器；本页不会把内容发送给模型。</p><textarea id="labPrompt" rows="12" maxlength="12000" spellcheck="false">' + esc(prompt) + '</textarea><button type="button" class="guide-primary" data-guide-act="copy-prompt">复制完整提示词</button></section>' +
      (lab.validation ? '<section class="lab-validator"><h3><label for="labOutput">贴入回答，检查这个练习</label></h3><p class="workbench-help">这里只检查固定工单的 JSON、编号、分类与原文证据，不调用模型，也不会执行粘贴的内容。</p><textarea id="labOutput" rows="8" maxlength="16000" spellcheck="false" placeholder="粘贴模型返回的 JSON 数组">' + esc(state.outputs[lab.id] || '') + '</textarea><button class="guide-secondary" type="button" data-guide-act="validate">检查结构与材料</button><div id="labValidation" class="validation-result" role="status" aria-live="polite"></div></section>' : '') +
      '<section class="lab-record"><h3>做完逐项核对</h3><div class="lab-checks">' + lab.checks.map((text, index) => '<label><input type="checkbox" data-lab-check="' + index + '"' + (state.checks[lab.id]?.[index] ? ' checked' : '') + '><span>' + esc(text) + '</span></label>').join('') + '</div><label for="labNote" class="lab-note-label">留下操作结果与疑问</label><textarea id="labNote" rows="5" maxlength="4000" placeholder="使用了什么工具？实际得到什么结果？哪些地方还需要改？">' + esc(state.notes[lab.id] || '') + '</textarea><button type="button" class="complete-button" data-guide-act="complete" aria-pressed="' + !!state.completed[lab.id] + '">' + (state.completed[lab.id] ? '✓ 已完成 · 可取消标记' : '标记这项实操已完成') + '</button><p class="workbench-help">按自己的实际操作记录。勾选检查表或检查器通过，不会自动标记完成。</p></section></aside></div>';
  }
  function render(view, query = '') {
    const container = el('learningContent');
    let html;
    if (view.view === 'lab') html = labHTML(view.item);
    else if (view.view === 'model' || view.view === 'tool') html = profile(view);
    else if (view.view === 'practice') html = practice(query);
    else if (view.view === 'models') html = models(query);
    else html = tools(query);
    container.innerHTML = '<section class="guide-view" aria-labelledby="viewTitle"><p id="practiceStorageNotice" class="storage-notice" role="status"' + (blocked ? '' : ' hidden') + '>浏览器暂时无法保存实操记录，本次会话仍可继续使用。</p>' + html + '</section>';
    announce(el('viewTitle').textContent);
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-guide-act]');
    if (!button) return;
    const view = core.route(location.hash, guide);
    const lab = view && view.view === 'lab' ? view.item : null;
    const act = button.dataset.guideAct;
    if (act === 'filter') {
      filters[button.dataset.view] = button.dataset.value;
      render(view, el('conceptSearch').value.trim());
      el('learningContent').querySelector('[data-value="' + button.dataset.value + '"]')?.focus({ preventScroll: true });
    } else if (act === 'reset-search') {
      filters[core.catalog(view.view)] = 'all';
      document.dispatchEvent(new CustomEvent('ai-search-reset'));
    } else if (!lab) return;
    else if (act === 'focus-prompt') {
      el('labPrompt').closest('section').scrollIntoView({ block: 'start' });
      el('labPrompt').focus({ preventScroll: true });
    } else if (act === 'copy-prompt') copy(el('labPrompt').value);
    else if (act === 'reset-prompt') {
      delete state.prompts[lab.id]; el('labPrompt').value = core.prompt(lab); save(); toast('已恢复这项练习的原始提示词。');
    } else if (act === 'download') {
      const material = lab.materials[Number(button.dataset.material)]; if (!material) return;
      const text = (material.language === 'csv' ? '\uFEFF' : '') + material.lines.join('\n') + '\n';
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = material.filename; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000); toast('已准备下载：' + material.filename);
    } else if (act === 'validate') {
      const result = core.validate(lab, el('labOutput').value);
      el('labValidation').innerHTML = '<strong>' + (result.ok ? '本练习检查通过' : '还有内容需要核对') + '</strong><ul>' + result.messages.map(text => '<li>' + esc(text) + '</li>').join('') + '</ul>';
      el('labValidation').dataset.ok = String(result.ok);
    } else if (act === 'complete') {
      if (state.completed[lab.id]) delete state.completed[lab.id]; else state.completed[lab.id] = true;
      save(); button.setAttribute('aria-pressed', String(!!state.completed[lab.id]));
      button.textContent = state.completed[lab.id] ? '✓ 已完成 · 可取消标记' : '标记这项实操已完成';
      announce(lab.title + (state.completed[lab.id] ? '已标记完成' : '已取消完成标记'));
      document.dispatchEvent(new CustomEvent('ai-practice-change'));
    }
  });
  document.addEventListener('input', event => {
    const field = ({ labPrompt: 'prompts', labOutput: 'outputs', labNote: 'notes' })[event.target.id];
    if (!field) return;
    const view = core.route(location.hash, guide); if (!view || view.view !== 'lab') return;
    state[field][view.item.id] = event.target.value; save();
    if (field === 'outputs' && el('labValidation')) el('labValidation').textContent = '';
  });
  document.addEventListener('change', event => {
    if (!event.target.matches('[data-lab-check]')) return;
    const view = core.route(location.hash, guide); if (!view || view.view !== 'lab') return;
    const checks = state.checks[view.item.id] || view.item.checks.map(() => false);
    checks[Number(event.target.dataset.labCheck)] = event.target.checked;
    state.checks[view.item.id] = checks; save();
  });
  root.AIPracticeUI = {
    render, current: hash => core.route(hash, guide), catalog: core.catalog,
    resumePath: () => '#lab=' + (state.lastLab && !state.completed[state.lastLab] ? state.lastLab : guide.labs.find(lab => !state.completed[lab.id])?.id || guide.labs[0].id),
    get completed() { return Object.keys(state.completed).length; },
    get state() { return state; }
  };
})(window);

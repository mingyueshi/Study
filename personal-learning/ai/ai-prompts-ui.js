/* 开发提示词：分类查找、填写、编辑、复制与收藏。 */
(function (root) {
  'use strict';
  const data = AI_PROMPTS, core = AIPromptsCore;
  const el = id => document.getElementById(id);
  const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const categories = new Map(data.categories.map(item => [item.id, item]));
  let blocked = false, raw = null, favoritesOnly = false, toastTimer;
  try { raw = JSON.parse(localStorage.getItem(core.key) || 'null'); } catch (error) { blocked = true; }
  const state = core.normalize(raw, data);
  function save() {
    try { localStorage.setItem(core.key, JSON.stringify(state)); blocked = false; } catch (error) { blocked = true; }
    if (el('promptStorageNotice')) el('promptStorageNotice').hidden = !blocked;
  }
  function toast(text) {
    const box = el('aiCopyStatus'); box.textContent = text; box.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { box.hidden = true; }, 2600);
  }
  async function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(text); toast('已复制提示词，可粘贴到你使用的 AI 工具。'); return; } catch (error) { /* 本地文件回退 */ }
    }
    const active = document.activeElement, area = document.createElement('textarea');
    area.value = text; area.style.cssText = 'position:fixed;opacity:0;'; area.setAttribute('readonly', ''); document.body.appendChild(area); area.select();
    try { toast(document.execCommand('copy') ? '已复制提示词，可粘贴到你使用的 AI 工具。' : '复制未成功，请选中提示词后手动复制。'); }
    catch (error) { toast('复制未成功，请选中提示词后手动复制。'); }
    area.remove(); if (active?.isConnected) active.focus({ preventScroll: true });
  }
  function draft(item) { return state.drafts[item.id] || { values: {}, rules: true, custom: null }; }
  function ensureDraft(item) {
    if (!state.drafts[item.id]) state.drafts[item.id] = { values: {}, rules: true, custom: null };
    return state.drafts[item.id];
  }
  function favorite(item) {
    return '<button type="button" class="prompt-favorite" data-prompt-act="favorite" data-id="' + item.id + '" aria-pressed="' + !!state.favorites[item.id] + '" aria-label="' + (state.favorites[item.id] ? '取消收藏：' : '收藏：') + esc(item.title) + '">' + (state.favorites[item.id] ? '★ 已收藏' : '☆ 收藏') + '</button>';
  }
  function catalog(view, query) {
    const items = data.prompts.filter(item => (view.category === 'all' || view.category === item.category) && (!favoritesOnly || state.favorites[item.id]) && core.matches(item, query));
    return '<div class="view-heading"><h2 id="viewTitle">开发常用提示词</h2><span>' + items.length + ' 个模板</span></div><p class="view-lead">选一个当前任务，补上项目背景和材料，就能拿去使用。模板也可以直接复制，边用边改。</p>' +
      '<div class="prompt-catalog-tools"><nav class="prompt-category-tabs" aria-label="提示词分类"><a href="#prompts"' + (view.category === 'all' ? ' aria-current="page"' : '') + '>全部场景</a>' + data.categories.map(category => '<a href="#category=' + category.id + '"' + (view.category === category.id ? ' aria-current="page"' : '') + '>' + esc(category.name) + '</a>').join('') + '</nav><button type="button" class="guide-secondary" data-prompt-act="favorites" aria-pressed="' + favoritesOnly + '">' + (favoritesOnly ? '★ 只看收藏' : '☆ 我的收藏') + '</button></div>' +
      (items.length ? '<div class="prompt-groups">' + data.categories.map(category => {
        const group = items.filter(item => item.category === category.id);
        if (!group.length) return '';
        return '<section class="prompt-group"><div class="prompt-group-heading"><h3>' + esc(category.name) + '</h3><span>' + group.length + ' 个</span></div><p>' + esc(category.description) + '</p><div class="prompt-list">' + group.map(item => '<article class="prompt-row"><a href="#prompt=' + item.id + '"><h4>' + esc(item.title) + '</h4><p>' + esc(item.summary) + '</p><span>填写使用 →</span></a><div class="prompt-row-actions">' + favorite(item) + '<button type="button" class="guide-secondary" data-prompt-act="copy-template" data-id="' + item.id + '">复制模板</button></div></article>').join('') + '</div></section>';
      }).join('') + '</div>' : '<div class="empty-concepts"><h3>' + (favoritesOnly ? '还没有符合条件的收藏' : '没有找到这个任务') + '</h3><p>可以缩短关键词、切换分类，或先收藏常用的模板。</p><button type="button" data-prompt-act="reset-search">查看全部模板</button></div>') +
      '<details class="prompt-guide"><summary>第一次使用：材料怎么给，结果怎么看</summary><ol><li>写清当前任务、项目技术栈和文件位置。可贴相关片段，或让有项目访问能力的编码助手先读取文件。</li><li>把提示词复制到所用工具，再按实际情况补充材料。输入框中的示例只作提示，不会当作项目事实填入。</li><li>结合模板的验收提示检查结果，继续追问并记录实际验证。页面会在当前浏览器保存填写内容和收藏。</li></ol><div class="guide-links"><a href="#tools">查阅工具入口 →</a><a href="#models">了解模型用途 →</a><a href="#practice">拿示例材料练一次 →</a></div></details>';
  }
  function detail(item) {
    if (state.lastPrompt !== item.id) { state.lastPrompt = item.id; save(); }
    const value = draft(item), category = categories.get(item.category);
    const output = value.custom === null ? core.build(item, value.values, value.rules, data) : value.custom;
    return '<a class="guide-back" href="#category=' + category.id + '">← ' + esc(category.name) + '</a><div class="view-heading"><h2 id="viewTitle">' + esc(item.title) + '</h2>' + favorite(item) + '</div><p class="view-lead">' + esc(item.summary) + '　交付：' + esc(item.deliverable) + '。</p>' +
      '<div class="prompt-layout"><div class="prompt-context-column"><details class="prompt-context"' + (window.innerWidth > 1100 ? ' open' : '') + '><summary>填写项目背景 <span>可选 · 本机保存</span></summary><div class="prompt-fields">' + item.fields.map(field => '<label for="prompt-field-' + field.id + '">' + esc(field.label) + '<textarea id="prompt-field-' + field.id + '" data-prompt-field="' + field.id + '" rows="3" maxlength="4000" placeholder="' + esc(field.example) + '">' + esc(value.values[field.id] || '') + '</textarea></label>').join('') + '</div><label class="prompt-rules"><input id="promptRules" type="checkbox"' + (value.rules ? ' checked' : '') + '>附带通用协作约定</label><p class="workbench-help">填写项会自动应用到模板。直接编辑正文后，可点击「更新提示词」按填写项重新生成。</p><button type="button" class="guide-secondary" data-prompt-act="generate">更新提示词</button></details>' +
      '<details class="prompt-checks"><summary>拿到结果后，检查什么</summary><ul>' + item.checks.map(line => '<li>' + esc(line) + '</li>').join('') + '</ul></details><details class="prompt-followups"><summary>需要继续推进时，可以这样追问</summary>' + item.followups.map((line, index) => '<div><p>' + esc(line) + '</p><button type="button" class="guide-secondary" data-prompt-act="copy-followup" data-index="' + index + '">复制追问</button></div>').join('') + '</details></div>' +
      '<section class="prompt-editor" aria-label="可编辑的完整提示词"><div class="prompt-editor-toolbar"><label for="promptOutput">完整提示词</label><button type="button" class="guide-primary" data-prompt-act="copy-output">复制提示词</button></div><p id="promptDraftHint" class="workbench-help" role="status">' + (value.custom === null ? '正文由模板和填写项生成，也可在下面直接编辑。' : '已恢复你编辑过的正文。修改填写项后，可点击「更新提示词」重新生成。') + '</p><textarea id="promptOutput" rows="25" maxlength="28000" spellcheck="false" aria-describedby="promptDraftHint">' + esc(output) + '</textarea><div class="prompt-editor-footer"><button type="button" class="guide-secondary" data-prompt-act="reset-body">恢复模板正文</button><span>填写项、正文与收藏保存在当前浏览器</span></div></section></div>';
  }
  function render(view, query = '') {
    el('learningContent').innerHTML = '<section class="prompt-view" aria-labelledby="viewTitle"><p id="promptStorageNotice" class="storage-notice" role="status"' + (blocked ? '' : ' hidden') + '>浏览器暂时无法保存填写内容，本次会话仍可编辑和复制。</p>' + (view.view === 'prompt' ? detail(view.item) : catalog(view, query)) + '</section>';
    el('viewStatus').textContent = el('viewTitle').textContent;
  }
  function updateHint(text) { if (el('promptDraftHint')) el('promptDraftHint').textContent = text; }
  function generate(item) {
    const value = ensureDraft(item); value.custom = null;
    el('promptOutput').value = core.build(item, value.values, value.rules, data); save();
    updateHint('已按当前填写项更新。可以直接编辑或复制完整提示词。');
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-prompt-act]'); if (!button) return;
    const act = button.dataset.promptAct;
    const view = core.route(location.hash, data) || { view: 'prompts', category: 'all' };
    const item = view?.view === 'prompt' ? view.item : data.prompts.find(entry => entry.id === button.dataset.id);
    if (act === 'favorite' && item) {
      if (state.favorites[item.id]) delete state.favorites[item.id]; else state.favorites[item.id] = true;
      save(); button.setAttribute('aria-pressed', String(!!state.favorites[item.id]));
      button.setAttribute('aria-label', (state.favorites[item.id] ? '取消收藏：' : '收藏：') + item.title);
      button.textContent = state.favorites[item.id] ? '★ 已收藏' : '☆ 收藏';
      if (favoritesOnly && view.view === 'prompts') render(view, el('conceptSearch').value.trim());
      document.dispatchEvent(new CustomEvent('ai-prompts-change'));
    } else if (act === 'favorites') {
      favoritesOnly = !favoritesOnly; render(view, el('conceptSearch').value.trim());
      el('learningContent').querySelector('[data-prompt-act="favorites"]').focus({ preventScroll: true });
    } else if (act === 'reset-search') {
      favoritesOnly = false; document.dispatchEvent(new CustomEvent('ai-prompts-reset'));
    } else if (act === 'copy-template' && item) copy(core.build(item, {}, true, data));
    else if (act === 'copy-output' && item) copy(el('promptOutput').value);
    else if (act === 'copy-followup' && item) copy(item.followups[Number(button.dataset.index)]);
    else if ((act === 'generate' || act === 'reset-body') && item) generate(item);
  });
  document.addEventListener('input', event => {
    const field = event.target.dataset.promptField;
    if (!field && event.target.id !== 'promptOutput') return;
    const view = core.route(location.hash, data); if (view?.view !== 'prompt') return;
    const value = ensureDraft(view.item);
    if (field) {
      value.values[field] = event.target.value;
      if (value.custom === null) {
        el('promptOutput').value = core.build(view.item, value.values, value.rules, data);
        updateHint('已按填写项更新提示词，也可直接编辑正文。');
      } else updateHint('填写项已保存；当前正文保留你的编辑，点击「更新提示词」可重新生成。');
    } else { value.custom = event.target.value; updateHint('正文已在本机保存，可继续编辑或复制。'); }
    save();
  });
  document.addEventListener('change', event => {
    if (event.target.id !== 'promptRules') return;
    const view = core.route(location.hash, data); if (view?.view !== 'prompt') return;
    const value = ensureDraft(view.item); value.rules = event.target.checked; save();
    if (value.custom === null) {
      el('promptOutput').value = core.build(view.item, value.values, value.rules, data);
      updateHint('已更新协作约定，可继续编辑或复制。');
    } else updateHint('协作约定选项已保存，点击「更新提示词」应用到正文。');
  });
  root.AIPromptsUI = {
    render, current: hash => core.route(hash, data),
    resumePath: () => '#prompt=' + (state.lastPrompt || data.prompts[0].id),
    get lastPrompt() { return state.lastPrompt; }, get favoriteCount() { return Object.keys(state.favorites).length; },
    get state() { return state; }
  };
})(window);

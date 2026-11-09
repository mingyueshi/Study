/* 作文坊前端：题目与素材由服务端渲染，这里只做交互层。
   - 搜索过滤题目卡 / 🎲灵感抽签 / 「去写」预填作文本
   - 作文本实时统计与教练提示（阈值与原型作文坊一致）
   - 草稿走 /writing/api/drafts/（游客挂会话、登录挂账号）；localStorage 只做崩溃暂存 */
'use strict';

(() => {
  const $ = (id) => document.getElementById(id);
  const searchEl = $('wr-search'), lotteryEl = $('wr-lottery'), gotoEl = $('wr-goto-notebook'),
        titleEl = $('wr-title'), contentEl = $('wr-content'), statsEl = $('wr-stats'),
        hintsEl = $('wr-hints'), feedbackEl = $('wr-feedback'), saveEl = $('wr-save'),
        clearEl = $('wr-clear'), readEl = $('wr-read'), listEl = $('wr-draft-list'),
        countEl = $('wr-draft-count'), notebookEl = $('notebook');
  if (!contentEl) return;

  const AUTOSAVE_PREFIX = 'writing_autosave_v2:';
  let autosaveScope = notebookEl.dataset.autosaveScope;
  let autosaveSnapshot = null;
  let dirty = false;
  let saving = false;
  let ownerChanged = false;
  let pendingLoad = null;
  let drafts = [];
  let currentDraftId = null;
  let currentRevision = 0;
  let goodWords = [];

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (ch) => (
    {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[ch]));
  const csrf = () => decodeURIComponent((document.cookie.match(/(?:^|;\s*)primary_csrftoken=([^;]*)/) || [])[1] || '');

  function showFeedback(message, failed = false) {
    feedbackEl.textContent = message;
    feedbackEl.classList.toggle('error', failed);
  }

  /* ---------- 题目卡：搜索 / 抽签 / 去写 ---------- */

  function filterCards() {
    const query = searchEl.value.trim().toLowerCase();
    document.querySelectorAll('.wr-card').forEach((card) => {
      const hit = !query || card.dataset.title.toLowerCase().includes(query) ||
                  card.dataset.goal.toLowerCase().includes(query);
      card.hidden = !hit;
    });
    document.querySelectorAll('.wr-grid').forEach((grid) => {
      grid.hidden = !Array.from(grid.querySelectorAll('.wr-card')).some((card) => !card.hidden);
    });
  }

  function openInEditor(topicTitle, goal) {
    if (saving || ownerChanged || !canReplaceEditor()) return;
    clearAutosave();
    const card = Array.from(document.querySelectorAll('.wr-card'))
      .find((el) => el.dataset.title === topicTitle);
    goodWords = card ? Array.from(card.querySelectorAll('.wr-chip')).map((el) => el.textContent.trim()) : [];
    currentDraftId = null;
    currentRevision = 0;
    titleEl.value = topicTitle || '';
    if (goal) titleEl.setAttribute('title', goal);
    contentEl.value = '';
    contentEl.dataset.topic = topicTitle || '';
    editorChanged();
    notebookEl.scrollIntoView({behavior: 'smooth', block: 'start'});
    titleEl.focus();
  }

  lotteryEl?.addEventListener('click', () => {
    const cards = Array.from(document.querySelectorAll('.wr-card'));
    if (!cards.length) return;
    const card = cards[Math.floor(Math.random() * cards.length)];
    const title = card.dataset.title;
    showFeedback('');
    if (confirm(`就写它：《${title}》！\n\n${card.dataset.goal}\n\n打开作文本开始写？`)) {
      openInEditor(title, card.dataset.goal);
    }
  });

  gotoEl?.addEventListener('click', () => openInEditor('', ''));
  document.addEventListener('click', (event) => {
    const write = event.target.closest('.wr-write');
    if (!write) return;
    openInEditor(write.dataset.topic, write.dataset.goal);
  });

  /* ---------- 作文本：统计 / 教练提示 / 暂存 ---------- */

  function countWordsUsed(text) {
    if (!text || !goodWords.length) return 0;
    return goodWords.filter((word) => word && text.includes(word)).length;
  }

  function updateStats() {
    const text = contentEl.value;
    const chars = text.replace(/\s/g, '').length;
    const paragraphs = text.split(/\n+/).map((p) => p.trim()).filter(Boolean).length;
    const used = countWordsUsed(text);
    statsEl.textContent = `字数 ${chars} · 段落 ${paragraphs} · 用到好词 ${used}`;
    const hints = [];
    if (chars > 0 && chars < 60) hints.push('再写具体一点：加上看到的、听到的、想到的。');
    if (chars >= 60 && paragraphs < 3) hints.push('试着分成 3 段：开头、中间、结尾。');
    if (chars >= 150 && paragraphs >= 3 && used >= 2) hints.push('🎉 已经很像一篇像样的作文，读给家人听一听！');
    hintsEl.textContent = hints.join(' ');
  }

  function canReplaceEditor() {
    return !dirty || confirm('当前作文还有没保存的内容，要换一篇吗？');
  }

  function editorChanged() {
    dirty = true;
    updateStats();
    stashAutosave();
  }

  function stashAutosave() {
    if (!autosaveScope || ownerChanged) return;
    const snapshot = JSON.stringify({
      draftId: currentDraftId, revision: currentRevision,
      topic: contentEl.dataset.topic || '', title: titleEl.value, content: contentEl.value,
    });
    try {
      localStorage.setItem(AUTOSAVE_PREFIX + autosaveScope, snapshot);
      autosaveSnapshot = snapshot;
    } catch (e) { /* 存储不可用时仍可手动保存 */ }
  }

  function clearAutosave() {
    if (!autosaveScope || autosaveSnapshot === null) return;
    try {
      const key = AUTOSAVE_PREFIX + autosaveScope;
      if (localStorage.getItem(key) === autosaveSnapshot) localStorage.removeItem(key);
    } catch (e) { /* 忽略 */ }
    autosaveSnapshot = null;
  }

  function restoreAutosave() {
    if (!autosaveScope) return;
    try {
      const raw = localStorage.getItem(AUTOSAVE_PREFIX + autosaveScope);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved && (saved.draftId || saved.title || saved.content)) {
        currentDraftId = saved.draftId || null;
        currentRevision = saved.revision || 0;
        autosaveSnapshot = raw;
        dirty = true;
        titleEl.value = saved.title || '';
        contentEl.value = saved.content || '';
        contentEl.dataset.topic = saved.topic || '';
        const card = Array.from(document.querySelectorAll('.wr-card'))
          .find((el) => el.dataset.title === saved.topic);
        goodWords = card ? Array.from(card.querySelectorAll('.wr-chip')).map((el) => el.textContent.trim()) : [];
        showFeedback('已恢复上次没保存的内容。');
      }
    } catch (e) { /* 存储不可用则忽略 */ }
  }

  /* ---------- 草稿 API ---------- */

  function handleOwnerChange(data) {
    if (data?.code !== 'owner_changed') return false;
    ownerChanged = true;
    titleEl.value = '';
    contentEl.value = '';
    contentEl.dataset.topic = '';
    goodWords = [];
    drafts = [];
    countEl.textContent = '';
    listEl.innerHTML = '';
    titleEl.disabled = contentEl.disabled = saveEl.disabled = true;
    updateStats();
    showFeedback(data.error, true);
    return true;
  }

  function loadDrafts() {
    if (!pendingLoad) pendingLoad = fetchDrafts().finally(() => { pendingLoad = null; });
    return pendingLoad;
  }

  async function fetchDrafts() {
    if (ownerChanged) return;
    try {
      const response = await fetch('/writing/api/drafts/', {
        headers: {Accept: 'application/json', 'X-Writing-Scope': autosaveScope || 'guest'},
      });
      const data = await response.json().catch(() => ({}));
      if (ownerChanged || handleOwnerChange(data)) return;
      if (!response.ok || !Array.isArray(data?.drafts) || !data.autosave_scope) {
        showFeedback('草稿列表暂时读不出来，稍后刷新再试。', true);
        return;
      }
      if (!autosaveScope) {
        autosaveScope = data.autosave_scope;
        if (dirty) stashAutosave();
        else restoreAutosave();
        updateStats();
      }
      drafts = data.drafts;
      renderDrafts();
    } catch (error) {
      showFeedback('网络不给力，草稿列表暂时读不出来。', true);
    }
  }

  function renderDrafts() {
    countEl.textContent = `${drafts.length} 篇`;
    if (!drafts.length) {
      listEl.innerHTML = '<div class="wr-empty">作文本还是空的，写一篇试试吧！</div>';
      return;
    }
    listEl.innerHTML = drafts.map((draft) => `
      <div class="wr-draft" data-id="${escapeHtml(draft.id)}">
        <b>${escapeHtml(draft.title || '未命名')}${draft.topic_title ? ` · ${escapeHtml(draft.topic_title)}` : ''}</b>
        <span class="wr-draft-meta">${escapeHtml(draft.updated_at)} · ${draft.content.replace(/\s/g, '').length} 字</span>
        <p class="wr-draft-preview">${escapeHtml(draft.content.split('\n').find((line) => line.trim()) || '')}</p>
        <div class="wr-draft-actions">
          <button type="button" data-open="1">打开</button>
          <button type="button" data-read="1">🔊 读</button>
          <button type="button" data-del="1" class="wr-draft-delete">删除</button>
        </div>
      </div>`).join('');
  }

  function openDraft(draft) {
    if (saving || ownerChanged || !canReplaceEditor()) return;
    clearAutosave();
    dirty = false;
    const card = Array.from(document.querySelectorAll('.wr-card'))
      .find((el) => el.dataset.title === draft.topic_title);
    goodWords = card ? Array.from(card.querySelectorAll('.wr-chip')).map((el) => el.textContent.trim()) : [];
    currentDraftId = draft.id;
    currentRevision = draft.revision;
    titleEl.value = draft.title;
    contentEl.value = draft.content;
    contentEl.dataset.topic = draft.topic_title || '';
    updateStats();
    showFeedback('');
    notebookEl.scrollIntoView({behavior: 'smooth', block: 'start'});
  }

  async function openLinkedDraft() {
    const requested = new URLSearchParams(location.search).get('draft');
    if (!requested || !autosaveScope || ownerChanged) return;
    const id = requested.toLowerCase();
    if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(id)) {
      showFeedback('找不到这篇草稿，可以在作文本里看看。', true);
      return;
    }
    if (id === currentDraftId) {
      notebookEl.scrollIntoView({behavior: 'smooth', block: 'start'});
      return;
    }
    const listed = drafts.find((draft) => draft.id === id);
    if (listed) {
      openDraft(listed);
      return;
    }
    const previousDraftId = currentDraftId;
    try {
      // 列表只显示最近的草稿，仍可从链接直接打开更早的稿件。
      const response = await fetch(`/writing/api/drafts/${id}/`, {
        headers: {Accept: 'application/json', 'X-Writing-Scope': autosaveScope},
      });
      const data = await response.json().catch(() => ({}));
      if (ownerChanged || handleOwnerChange(data) || previousDraftId !== currentDraftId) return;
      if (response.ok && data.id === id) openDraft(data);
      else if (response.status === 404) showFeedback('找不到这篇草稿，可以在作文本里看看。', true);
      else showFeedback('这篇草稿暂时读不出来，稍后再试。', true);
    } catch (error) {
      showFeedback('网络不给力，这篇草稿暂时读不出来。', true);
    }
  }

  listEl?.addEventListener('click', async (event) => {
    if (saving || ownerChanged) return;
    const button = event.target.closest('button');
    if (!button) return;
    const item = button.closest('.wr-draft');
    const draft = drafts.find((d) => d.id === item?.dataset.id);
    if (!draft) return;
    if (button.dataset.open) {
      openDraft(draft);
    } else if (button.dataset.read) {
      if (window.SpeechKit) SpeechKit.speak(`${draft.title || '未命名作文'}。${draft.content}`);
    } else if (button.dataset.del) {
      if (!confirm(`删除《${draft.title || '未命名'}》？删了就找不回来了。`)) return;
      const response = await fetch(`/writing/api/drafts/${draft.id}/`, {
        method: 'DELETE', headers: {'X-CSRFToken': csrf(), 'X-Writing-Scope': autosaveScope},
      });
      if (ownerChanged) return;
      if (response.ok) {
        drafts = drafts.filter((d) => d.id !== draft.id);
        if (currentDraftId === draft.id) {
          currentDraftId = null;
          currentRevision = 0;
          if (dirty) stashAutosave();
        }
        renderDrafts();
        showFeedback('已删除。');
      } else {
        const data = await response.json().catch(() => ({}));
        if (!handleOwnerChange(data)) showFeedback('删除没成功，请刷新后再试。', true);
      }
    }
  });

  saveEl?.addEventListener('click', async () => {
    if (saving || ownerChanged) return;
    const title = titleEl.value.trim();
    const content = contentEl.value;
    if (!title && !content.trim()) { showFeedback('先写点什么再保存吧。', true); return; }
    saveEl.disabled = true;
    saving = true;
    showFeedback('正在保存……');
    const body = {title, content, topic_title: contentEl.dataset.topic || ''};
    const url = currentDraftId ? `/writing/api/drafts/${currentDraftId}/` : '/writing/api/drafts/';
    const method = currentDraftId ? 'PATCH' : 'POST';
    if (currentDraftId) body.revision = currentRevision;
    try {
      if (!autosaveScope) {
        await loadDrafts();
        if (ownerChanged || !autosaveScope) return;
      }
      const response = await fetch(url, {
        method, headers: {'Content-Type': 'application/json', 'X-CSRFToken': csrf(),
                          'X-Writing-Scope': autosaveScope},
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (ownerChanged || handleOwnerChange(data)) return;
      if (!response.ok || !data?.id) {
        const message = response.status === 409 ? '这篇草稿已在别处保存。暂存还在，请先核对最新稿。'
          : data?.error || '保存没成功，请稍后再试。';
        showFeedback(message, true);
        return;
      }
      currentDraftId = data.id;
      currentRevision = data.revision;
      if (window.rewardToast && data.rewards) window.rewardToast(data.rewards);
      dirty = titleEl.value.trim() !== title || contentEl.value !== content;
      if (dirty) stashAutosave();
      else clearAutosave();
      showFeedback(dirty ? '已保存上一版，你刚写的内容已暂存。' : `已保存《${data.title || '未命名'}》到作文本。`);
      const index = drafts.findIndex((d) => d.id === data.id);
      if (index >= 0) drafts[index] = data; else drafts.unshift(data);
      renderDrafts();
    } catch (error) {
      showFeedback('网络中断，还没确认是否保存；请刷新页面核对后再试。', true);
    } finally {
      saving = false;
      saveEl.disabled = ownerChanged;
    }
  });

  clearEl?.addEventListener('click', () => {
    if (saving || ownerChanged) return;
    if (!confirm('清空当前编辑内容？（已保存到作文本的不受影响）')) return;
    currentDraftId = null;
    currentRevision = 0;
    titleEl.value = '';
    contentEl.value = '';
    contentEl.dataset.topic = '';
    goodWords = [];
    dirty = false;
    updateStats();
    showFeedback('');
    clearAutosave();
  });

  readEl?.addEventListener('click', () => {
    if (window.SpeechKit) {
      SpeechKit.speak(`${titleEl.value || '未命名作文'}。${contentEl.value || '还没有内容。'}`);
    }
  });

  searchEl?.addEventListener('input', filterCards);
  titleEl.addEventListener('input', editorChanged);
  contentEl.addEventListener('input', editorChanged);
  document.addEventListener('visibilitychange', async () => {
    if (document.hidden) return;
    await pendingLoad;
    if (!document.hidden) loadDrafts();
  });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) window.location.reload();
  });

  restoreAutosave();
  updateStats();
  loadDrafts().then(openLinkedDraft);
})();

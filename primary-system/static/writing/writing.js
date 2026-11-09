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

  const AUTOSAVE_KEY = 'writing_autosave_v1';
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
    if (contentEl.value.trim() && !confirm('作文本里有没保存的内容，覆盖吗？')) return;
    const card = Array.from(document.querySelectorAll('.wr-card'))
      .find((el) => el.dataset.title === topicTitle);
    goodWords = card ? Array.from(card.querySelectorAll('.wr-chip')).map((el) => el.textContent.trim()) : [];
    currentDraftId = null;
    currentRevision = 0;
    titleEl.value = topicTitle || '';
    if (goal) titleEl.setAttribute('title', goal);
    contentEl.value = '';
    contentEl.dataset.topic = topicTitle || '';
    updateStats();
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(
      {topic: topicTitle || '', title: titleEl.value, content: contentEl.value}));
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
    try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(
      {topic: contentEl.dataset.topic || '', title: titleEl.value, content: text})); } catch (e) { /* 忽略 */ }
  }

  function restoreAutosave() {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved && (saved.title || saved.content)) {
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

  async function loadDrafts() {
    try {
      const response = await fetch('/writing/api/drafts/', {headers: {Accept: 'application/json'}});
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(data?.drafts)) {
        showFeedback('草稿列表暂时读不出来，稍后刷新再试。', true);
        return;
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

  listEl?.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const item = button.closest('.wr-draft');
    const draft = drafts.find((d) => d.id === item?.dataset.id);
    if (!draft) return;
    if (button.dataset.open) {
      const card = Array.from(document.querySelectorAll('.wr-card'))
        .find((el) => el.dataset.title === draft.topic_title);
      goodWords = card ? Array.from(card.querySelectorAll('.wr-chip')).map((el) => el.textContent.trim()) : [];
      currentDraftId = draft.id;
      currentRevision = draft.revision;
      titleEl.value = draft.title;
      contentEl.value = draft.content;
      contentEl.dataset.topic = draft.topic_title || '';
      updateStats();
      notebookEl.scrollIntoView({behavior: 'smooth', block: 'start'});
    } else if (button.dataset.read) {
      if (window.SpeechKit) SpeechKit.speak(`${draft.title || '未命名作文'}。${draft.content}`);
    } else if (button.dataset.del) {
      if (!confirm(`删除《${draft.title || '未命名'}》？删了就找不回来了。`)) return;
      const response = await fetch(`/writing/api/drafts/${draft.id}/`, {
        method: 'DELETE', headers: {'X-CSRFToken': csrf()},
      });
      if (response.ok) {
        drafts = drafts.filter((d) => d.id !== draft.id);
        if (currentDraftId === draft.id) { currentDraftId = null; currentRevision = 0; }
        renderDrafts();
        showFeedback('已删除。');
      } else {
        showFeedback('删除没成功，请刷新后再试。', true);
      }
    }
  });

  saveEl?.addEventListener('click', async () => {
    const title = titleEl.value.trim();
    const content = contentEl.value;
    if (!title && !content.trim()) { showFeedback('先写点什么再保存吧。', true); return; }
    saveEl.disabled = true;
    showFeedback('正在保存……');
    const body = {title, content, topic_title: contentEl.dataset.topic || ''};
    const url = currentDraftId ? `/writing/api/drafts/${currentDraftId}/` : '/writing/api/drafts/';
    const method = currentDraftId ? 'PATCH' : 'POST';
    if (currentDraftId) body.revision = currentRevision;
    try {
      const response = await fetch(url, {
        method, headers: {'Content-Type': 'application/json', 'X-CSRFToken': csrf()},
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.id) {
        showFeedback(data?.error || '保存没成功，请稍后再试。', true);
        return;
      }
      currentDraftId = data.id;
      currentRevision = data.revision;
      if (window.rewardToast && data.rewards) window.rewardToast(data.rewards);
      showFeedback(`已保存《${data.title || '未命名'}》到作文本。`);
      const index = drafts.findIndex((d) => d.id === data.id);
      if (index >= 0) drafts[index] = data; else drafts.unshift(data);
      renderDrafts();
      try { localStorage.removeItem(AUTOSAVE_KEY); } catch (e) { /* 忽略 */ }
    } catch (error) {
      showFeedback('网络中断，还没确认是否保存；请刷新页面核对后再试。', true);
    } finally {
      saveEl.disabled = false;
    }
  });

  clearEl?.addEventListener('click', () => {
    if (!confirm('清空当前编辑内容？（已保存到作文本的不受影响）')) return;
    currentDraftId = null;
    currentRevision = 0;
    titleEl.value = '';
    contentEl.value = '';
    contentEl.dataset.topic = '';
    goodWords = [];
    updateStats();
    showFeedback('');
    try { localStorage.removeItem(AUTOSAVE_KEY); } catch (e) { /* 忽略 */ }
  });

  readEl?.addEventListener('click', () => {
    if (window.SpeechKit) {
      SpeechKit.speak(`${titleEl.value || '未命名作文'}。${contentEl.value || '还没有内容。'}`);
    }
  });

  searchEl?.addEventListener('input', filterCards);
  titleEl.addEventListener('input', updateStats);
  contentEl.addEventListener('input', updateStats);

  restoreAutosave();
  updateStats();
  loadDrafts();
})();

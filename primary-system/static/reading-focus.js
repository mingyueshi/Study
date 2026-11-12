/* 教材与场景词卡共用手动阅读焦点：沿用原生按钮，选择不写入学习记录。 */
(() => {
  'use strict';
  const root = document.getElementById('english-cards') || document.getElementById('english-dialogues') || document.getElementById('words-cards') || document.getElementById('idiom-cards');
  if (!root) return;
  const play = document.getElementById('tts-unit-play') || document.getElementById('words-play-btn');
  const stop = document.getElementById('tts-sequence-stop');
  let selected = null, detail = null, selectedAction = null;

  function clearSelection() {
    if (selected) {
      selected.classList.remove('reading-selected');
      selectedAction?.setAttribute('aria-pressed', 'false');
    }
    detail?.classList.remove('reading-selected-detail');
    selected = null; detail = null; selectedAction = null;
    root.classList.remove('has-reading-selection');
    if (stop && !play?.classList.contains('tts-active')) stop.disabled = true;
  }

  root.addEventListener('click', event => {
    const item = event.target.closest('[data-say-seq]');
    if (!item || !root.contains(item) || event.target.closest('a, input, textarea, select, summary')) return;
    const button = event.target.closest('button');
    if (button && !button.matches('[data-say], [data-reading-select]')) return;
    if (window.getSelection()?.type === 'Range') return;
    const detailTarget = event.target.closest('[data-reading-target]');
    const nextDetail = detailTarget ? item.querySelector(detailTarget.dataset.readingTarget)
      : event.target.closest('[data-reading-detail], .part, .phrase, .rel');
    const nextAction = nextDetail?.matches('[data-reading-select]') ? nextDetail
      : event.target.closest('[data-reading-select]') || (item.matches('[data-reading-select]') ? item : item.querySelector('[data-reading-select]'));
    const deselect = selected === item && detail === nextDetail && !event.target.closest('[data-say]');
    window.TTS?.resetSequence(deselect ? '已取消选中，可以自由浏览。' : '已选中这里，可以慢慢读一读。');
    clearSelection();
    if (deselect) return;
    selected = item;
    selected.classList.add('reading-selected');
    selectedAction = nextAction;
    selectedAction?.setAttribute('aria-pressed', 'true');
    detail = nextDetail;
    detail?.classList.add('reading-selected-detail');
    root.classList.add('has-reading-selection');
    if (stop) stop.disabled = !('speechSynthesis' in window);
  });
  root.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !selected) return;
    event.preventDefault();
    window.TTS?.resetSequence('已退出选中，可以自由浏览。');
    clearSelection();
  });
  // 搜索、换场景和掌握操作重绘词卡前，也清除手动选中。
  document.addEventListener('tts:reset', clearSelection);
  play?.addEventListener('click', () => { if (!play.classList.contains('tts-active')) clearSelection(); });
  stop?.addEventListener('click', clearSelection);
  document.getElementById('tts-sequence-restart')?.addEventListener('click', clearSelection);
  document.getElementById('tts-text-scope')?.addEventListener('change', clearSelection);
  document.getElementById('tts-voice')?.addEventListener('change', clearSelection);
})();

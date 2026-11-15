(() => {
  'use strict';
  const root = document.querySelector('[data-mystery-case]');
  if (!root || !window.MysteryNotebook) return;
  const config = JSON.parse(document.getElementById('mystery-notebook-data').textContent);
  const store = MysteryNotebook.createStore({
    getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value),
  }, config.slugs);
  const fields = [...root.querySelectorAll('[data-notebook] textarea')];
  const notice = root.querySelector('[data-note-status]');
  const save = root.querySelector('[data-save-case]'), complete = root.querySelector('[data-complete-case]');
  function renderFlags() {
    const state = store.read(config.slug);
    save.textContent = state.saved ? '★ 已加入稍后读' : '☆ 稍后读';
    save.setAttribute('aria-pressed', String(state.saved));
    complete.textContent = state.completed ? '✓ 已读完，点此撤销' : '标记为已读完';
    complete.setAttribute('aria-pressed', String(state.completed));
    root.querySelector('[data-reading-status]').textContent = store.available
      ? '阅读标记和笔记仅保存在当前浏览器。读完也可以继续带着问题回来。'
      : '浏览器暂时不能保存，当前记录只在本页保留；离开前请导出笔记。';
  }
  function restoreNotes() {
    const record = store.read(config.slug);
    fields.forEach(field => { field.value = record.notes[field.name]; });
  }
  function reportSaved() {
    notice.textContent = store.available ? '笔记已保存到当前浏览器。每栏最多 2000 字。' : '笔记暂时只在本页保留，请先导出再离开。';
  }
  save.addEventListener('click', () => { store.toggle(config.slug, 'saved'); renderFlags(); });
  complete.addEventListener('click', () => { store.toggle(config.slug, 'completed'); renderFlags(); });
  fields.forEach(field => field.addEventListener('input', () => {
    store.saveNote(config.slug, field.name, field.value); renderFlags(); reportSaved();
  }));
  root.querySelector('[data-export-note]').addEventListener('click', () => {
    const titles = { observation: '我看到的线索', hypothesis: '我的猜想', next: '下一步想查什么' };
    const lines = [config.title, '我的调查手记', '', ...fields.flatMap(field => [titles[field.name], field.value.trim() || '（还没有记录）', ''])];
    const url = URL.createObjectURL(new Blob(['\ufeff' + lines.join('\n')], {type: 'text/plain;charset=utf-8'}));
    const link = document.createElement('a'); link.href = url; link.download = `${config.slug}-调查笔记.txt`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  window.addEventListener('storage', event => {
    if (!store.acceptsEvent(event.key)) return;
    renderFlags();
    // Never replace text under the reader's cursor when another tab updates the same case.
    const record = store.read(config.slug);
    fields.filter(field => field !== document.activeElement).forEach(field => { field.value = record.notes[field.name]; });
  });
  window.addEventListener('pageshow', () => { restoreNotes(); renderFlags(); });
  restoreNotes(); store.visit(config.slug); renderFlags();
  if (!store.available) reportSaved();
  root.querySelector('[data-notebook-tools]').hidden = false;
  root.querySelector('[data-notebook]').hidden = false;
  function openNotebook() {
    const notebook = root.querySelector('[data-notebook]');
    notebook.scrollIntoView({behavior: 'instant'});
    // Resolve image heights above the newly revealed anchor before the final jump.
    const images = [...root.querySelectorAll('img')];
    images.forEach(image => { image.loading = 'eager'; });
    Promise.allSettled(images.map(image => image.decode())).then(() => {
      if (location.hash === '#my-notebook' && !fields.includes(document.activeElement)) {
        notebook.scrollIntoView({behavior: 'instant'});
      }
    });
  }
  root.querySelector('a[href="#my-notebook"]').addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (location.hash !== '#my-notebook') history.pushState(null, '', '#my-notebook');
    openNotebook();
    root.querySelector('[data-notebook]').focus({preventScroll: true});
  });
  if (location.hash === '#my-notebook') openNotebook();
})();

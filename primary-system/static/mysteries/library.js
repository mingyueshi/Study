(() => {
  'use strict';
  const root = document.querySelector('[data-mystery-library]');
  if (!root || !window.MysteryNotebook) return;
  const cases = JSON.parse(document.getElementById('mystery-directory-data').textContent);
  const bySlug = new Map(cases.map(item => [item.slug, item]));
  const cards = new Map([...root.querySelectorAll('[data-case-slug]')].map(card => [card.dataset.caseSlug, card]));
  const store = MysteryNotebook.createStore({
    getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value),
  }, [...bySlug.keys()]);
  const form = root.querySelector('.mystery-filter-form');
  const dialog = root.querySelector('[data-compare-dialog]');
  const message = root.querySelector('[data-library-message]');
  let selected = [], visible = [];
  function filters() { return Object.fromEntries(['q', 'category', 'kind', 'status'].map(name => [name, form.elements[name].value])); }
  function updateURL() {
    const url = new URL(location.href);
    Object.entries(filters()).forEach(([key, value]) => { if (value) url.searchParams.set(key, value); else url.searchParams.delete(key); });
    if (selected.length) url.searchParams.set('compare', selected.join(',')); else url.searchParams.delete('compare');
    history.replaceState(null, '', url);
  }
  function restoreURL() {
    const params = new URL(location.href).searchParams;
    ['q', 'category', 'kind', 'status'].forEach(key => {
      const field = form.elements[key], value = (params.get(key) || '').slice(0, 120);
      field.value = key === 'q' || [...field.options].some(option => option.value === value) ? value : '';
    });
    selected = MysteryNotebook.comparisonIds(params.get('compare'), [...bySlug.keys()]);
  }
  function render() {
    const current = filters();
    let saved = 0, completed = 0;
    visible = [];
    cases.forEach(item => {
      const record = store.read(item.slug), card = cards.get(item.slug);
      saved += Number(record.saved); completed += Number(record.completed);
      card.hidden = !MysteryNotebook.matchesCase(item, current, record);
      if (!card.hidden) visible.push(item);
      const save = card.querySelector('[data-save-case]');
      save.setAttribute('aria-pressed', String(record.saved));
      save.textContent = record.saved ? '★ 已加入稍后读' : '☆ 稍后读';
      save.setAttribute('aria-label', `${record.saved ? '移出稍后读' : '稍后读'}：${item.title}`);
      const compare = card.querySelector('[data-compare-case]'), included = selected.includes(item.slug);
      compare.setAttribute('aria-pressed', String(included));
      compare.textContent = included ? '✓ 已加入对照' : '＋ 加入对照';
      compare.setAttribute('aria-label', `${included ? '移出对照' : '加入对照'}：${item.title}`);
      card.querySelector('[data-card-status]').textContent = [record.completed ? '已读完' : '', Object.values(record.notes).some(note => note.trim()) ? '有我的笔记' : ''].filter(Boolean).join(' · ');
    });
    root.querySelectorAll('[data-case-group]').forEach(group => {
      group.hidden = ![...group.querySelectorAll('[data-case-slug]')].some(card => !card.hidden);
      root.querySelector(`.mystery-jumps a[href="#${group.id}"]`).hidden = group.hidden;
    });
    root.querySelector('[data-filter-count]').textContent = `找到 ${visible.length}／${cases.length} 份案卷`;
    root.querySelector('[data-library-progress]').textContent = `已读完 ${completed} 份 · 稍后读 ${saved} 份`;
    root.querySelector('[data-empty-results]').hidden = visible.length > 0;
    root.querySelector('[data-random-case]').disabled = visible.length === 0;
    const last = bySlug.get(store.last()), resume = root.querySelector('[data-continue]');
    resume.hidden = !last;
    if (last) { resume.href = last.url; resume.textContent = `接着看：${last.title}`; }
    root.querySelector('[data-compare-tray]').hidden = !selected.length;
    root.classList.toggle('has-comparison', selected.length > 0);
    root.querySelector('[data-compare-selection]').textContent = selected.length === 1
      ? `已选「${bySlug.get(selected[0]).title}」，再挑一份就能对照。`
      : selected.map(slug => bySlug.get(slug).title).join(' ／ ');
    root.querySelector('[data-open-compare]').disabled = selected.length !== 2;
    if (!store.available) root.querySelector('[data-storage-notice]').textContent = '浏览器暂时不能保存记录，本页操作仍可继续；离开前请导出重要笔记。';
  }
  function changed() { render(); updateURL(); message.textContent = ''; }
  form.addEventListener('submit', event => { event.preventDefault(); changed(); });
  form.addEventListener('input', changed);
  form.addEventListener('change', changed);
  root.querySelectorAll('[data-clear-filters]').forEach(button => button.addEventListener('click', () => { form.reset(); changed(); form.elements.q.focus(); }));
  cards.forEach((card, slug) => {
    card.querySelector('[data-save-case]').addEventListener('click', () => { store.toggle(slug, 'saved'); render(); });
    card.querySelector('[data-compare-case]').addEventListener('click', () => {
      if (selected.includes(slug)) selected = selected.filter(id => id !== slug);
      else if (selected.length < 2) selected.push(slug);
      else {
        const notice = '对照台已有两份案卷，请先移出一份再添加。';
        card.querySelector('[data-card-status]').textContent = notice;
        message.textContent = notice;
        return;
      }
      changed();
    });
  });
  root.querySelector('[data-random-case]').addEventListener('click', () => {
    const alternatives = visible.filter(item => item.slug !== store.last());
    const pool = alternatives.length ? alternatives : visible;
    if (pool.length) location.assign(pool[Math.floor(Math.random() * pool.length)].url);
  });
  root.querySelector('[data-clear-compare]').addEventListener('click', () => { selected = []; changed(); });
  root.querySelector('[data-open-compare]').addEventListener('click', () => {
    if (selected.length !== 2) return;
    const container = root.querySelector('[data-comparison]');
    container.replaceChildren();
    selected.forEach(slug => {
      const item = bySlug.get(slug), fragment = document.getElementById('mystery-comparison-card').content.cloneNode(true);
      const image = fragment.querySelector('img'); image.src = item.image; image.alt = item.alt;
      fragment.querySelector('h3').textContent = item.title;
      item.questions.forEach(question => { const li = document.createElement('li'); li.textContent = question; fragment.querySelector('ul').append(li); });
      fragment.querySelector('[data-compare-known]').textContent = item.known;
      fragment.querySelector('[data-compare-unresolved]').textContent = item.unresolved;
      fragment.querySelector('[data-compare-next]').textContent = item.next_step;
      fragment.querySelector('[data-compare-link]').href = item.url + '#evidence';
      container.append(fragment);
    });
    dialog.showModal();
  });
  root.querySelector('[data-close-compare]').addEventListener('click', () => dialog.close());
  window.addEventListener('popstate', () => { restoreURL(); render(); });
  window.addEventListener('pageshow', render);
  window.addEventListener('storage', event => { if (store.acceptsEvent(event.key)) render(); });
  restoreURL(); render();
  root.querySelector('[data-library-tools]').hidden = false;
  root.querySelector('[data-library-summary]').hidden = false;
  root.querySelectorAll('[data-card-tools]').forEach(element => { element.hidden = false; });
})();

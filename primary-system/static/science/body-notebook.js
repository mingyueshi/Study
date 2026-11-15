(() => {
  'use strict';
  const root = document.querySelector('[data-body-notebook]');
  if (!root) return;
  const copy = JSON.parse(document.getElementById('body-notebook-data').textContent);
  const key = 'study.body.pulse.v1';
  const status = root.querySelector('[data-notebook-status]');
  const inputs = [document.querySelector('[data-pulse-rest]'), document.querySelector('[data-pulse-active]'), root.querySelector('[data-pulse-recovery]')];
  const note = root.querySelector('[data-pulse-note]');
  const list = root.querySelector('[data-notebook-list]');
  const exportButton = root.querySelector('[data-notebook-export]');
  const ratio = 60 / Number(document.querySelector('[data-pulse-timer]').dataset.seconds);
  let records = [];
  let persistent = true;
  let savedDraft = '';
  const validCount = n => Number.isInteger(n) && n > 0 && n <= 999;
  function read() {
    let raw;
    try { raw = localStorage.getItem(key); }
    catch { persistent = false; return; }
    try {
      const stored = JSON.parse(raw);
      records = stored?.version === 1 && Array.isArray(stored.records) ? stored.records.filter(item =>
        item && typeof item.id === 'string' && /^[a-zA-Z0-9-]+$/.test(item.id) &&
        typeof item.date === 'string' && Number.isFinite(Date.parse(item.date)) &&
        validCount(item.rest) && validCount(item.active) && (item.recovery === null || validCount(item.recovery)) &&
        typeof item.note === 'string' && item.note.length <= 120
      ).slice(0, 20) : [];
    } catch { records = []; }
  }
  function save() {
    try { localStorage.setItem(key, JSON.stringify({ version: 1, records })); }
    catch { persistent = false; }
  }
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function render() {
    list.replaceChildren();
    records.forEach(record => {
      const article = element('article', undefined, 'body-record');
      const heading = element('div', undefined, 'body-record-heading');
      const date = element('time', new Date(record.date).toLocaleString('zh-CN', { hour12: false }));
      date.dateTime = record.date;
      const remove = element('button', '删除', 'body-text-button');
      remove.type = 'button';
      remove.setAttribute('aria-label', `删除 ${date.textContent} 的观察`);
      remove.addEventListener('click', () => {
        if (persistent) read();
        records = records.filter(item => item.id !== record.id);
        save(); render();
        status.textContent = '已删除这一组观察。';
      });
      heading.append(date, remove);
      article.append(heading);
      const values = element('div', undefined, 'body-record-values');
      copy.stages.forEach(stage => values.append(element('span', `${stage.label}：${record[stage.id] === null ? '未记录' : `约 ${record[stage.id] * ratio} 次／分`}`)));
      article.append(values);
      if (record.note) article.append(element('p', record.note));
      list.append(article);
    });
    root.querySelector('[data-record-count]').textContent = records.length;
    root.querySelector('[data-notebook-empty]').hidden = records.length > 0;
    exportButton.disabled = !records.length;
    if (!persistent) root.querySelector('[data-notebook-storage]').textContent = '浏览器未能保存，记录仅在本页暂存。离开前可以导出表格保留。';
  }
  function draw() {
    const chart = root.querySelector('[data-pulse-bars]');
    chart.replaceChildren();
    const values = inputs.map(input => input.value && input.validity.valid ? input.valueAsNumber * ratio : null);
    const maximum = Math.max(1, ...values.filter(value => value !== null));
    copy.stages.forEach((stage, index) => {
      const row = element('div', undefined, 'body-pulse-bar-row');
      const heading = element('div');
      heading.append(element('span', stage.label), element('strong', values[index] === null ? '待填写' : `${values[index]} 次／分`));
      const track = element('div', undefined, 'body-pulse-bar-track');
      const bar = element('span');
      bar.style.width = `${values[index] === null ? 0 : values[index] / maximum * 100}%`;
      track.setAttribute('aria-hidden', 'true');
      track.append(bar);
      row.append(heading, track);
      chart.append(row);
    });
  }
  const draftSignature = () => JSON.stringify([...inputs.map(input => input.value), note.value]);
  [...inputs, note].forEach(input => input.addEventListener('input', () => {
    draw();
    if (savedDraft !== draftSignature()) status.textContent = '';
  }));
  root.querySelector('[data-notebook-form]').addEventListener('submit', event => {
    event.preventDefault();
    for (const input of inputs) {
      if (!input.validity.valid) {
        status.textContent = '请先填写静坐时和活动后的正整数次数，休息后可以不填。';
        input.reportValidity();
        input.focus();
        return;
      }
    }
    if (draftSignature() === savedDraft) { status.textContent = '这组观察已经保存。完成新一轮观察后，可以修改输入再保存。'; return; }
    if (persistent) read();
    records.unshift({ id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      date: new Date().toISOString(), rest: inputs[0].valueAsNumber, active: inputs[1].valueAsNumber,
      recovery: inputs[2].value ? inputs[2].valueAsNumber : null, note: note.value.trim() });
    records = records.slice(0, 20);
    save(); render();
    savedDraft = draftSignature();
    status.textContent = persistent ? '已保存这组观察，下次打开还能看到。' : '已在本页暂存，可以导出表格保留。';
  });
  exportButton.addEventListener('click', () => {
    const escape = value => {
      let text = String(value ?? '');
      // Keep notes as text when opened in spreadsheet applications.
      if (/^[\s]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    };
    const rows = [['记录时间', '静坐时（三十秒次数）', '活动后（三十秒次数）', '休息后（三十秒次数）', '静坐时（估算次／分）', '活动后（估算次／分）', '休息后（估算次／分）', '观察备注'],
      ...records.map(record => [record.date, record.rest, record.active, record.recovery, record.rest * ratio, record.active * ratio, record.recovery === null ? '' : record.recovery * ratio, record.note])];
    const blob = new Blob(['\uFEFF' + rows.map(row => row.map(escape).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = element('a');
    link.href = url;
    link.download = '我的脉搏观察.csv';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = '已生成观察表格。';
  });
  window.addEventListener('storage', event => { if (event.key === key || event.key === null) { read(); render(); } });
  read(); render(); draw();
  root.hidden = false;
})();

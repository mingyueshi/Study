(() => {
  'use strict';

  function electricityResult(before, after, hours, days) {
    const original = before * hours * days / 1000;
    const changed = after * hours * days / 1000;
    return { original, changed, saved: (before - after) * hours * days / 1000 };
  }

  function carbonResult(baseline, reduced, removed) {
    const remaining = baseline - reduced;
    return { remaining, net: remaining - removed };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { electricityResult, carbonResult };
  if (typeof document === 'undefined') return;

  function mount(id, resultText) {
    const panel = document.getElementById(id);
    const fields = [...panel.querySelectorAll('input')];
    const output = panel.querySelector('output');
    function update() {
      output.textContent = fields.every(field => field.validity.valid)
        ? resultText(fields.map(field => field.valueAsNumber), panel.dataset)
        : '请按输入框的范围和步长填入有效数值。';
    }
    panel.addEventListener('input', update);
    update();
    panel.hidden = false;
  }

  const degree = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 5 });
  mount('energy-electricity', ([before, after, hours, days]) => {
    const { original, changed, saved } = electricityResult(before, after, hours, days);
    let difference = '两种方案用电量相同。';
    if (saved > 0) difference = `少用 ${degree.format(saved)} 度电。`;
    if (saved < 0) difference = `多用 ${degree.format(-saved)} 度电。`;
    return `原方案 ${degree.format(original)} 度，新方案 ${degree.format(changed)} 度。${difference}`;
  });

  mount('energy-carbon', ([reduced, removed], { baseline }) => {
    const { remaining, net } = carbonResult(Number(baseline), reduced, removed);
    let balance = '净排放为零，达到了本账本的净零。';
    if (net > 0) balance = `净排放 ${net} 千克，还未达到净零。`;
    if (net < 0) balance = `净排放为负，移除比排放多 ${-net} 千克。`;
    return `减排后仍排放 ${remaining} 千克，移除 ${removed} 千克。${balance}`;
  });
})();

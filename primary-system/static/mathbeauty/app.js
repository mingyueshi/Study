/* 数学之美交互：只响应主动操作，没有自动播放，也不写作答或个人记录。 */
(() => {
  'use strict';
  const source = document.getElementById('mb-topic');
  const M = window.MathBeautyModels;
  if (!source || !M) return;
  const topic = JSON.parse(source.textContent);
  const fmt = (value, digits = 4) => Number(value.toFixed(digits)).toLocaleString('zh-CN', {maximumFractionDigits: digits});
  const renderers = {
    golden: c => M.goldenSVG(c.split), fibonacci: c => M.fibonacciSVG(c.terms),
    sunflower: c => M.sunflowerSVG(c.seeds, c.angle), symmetry: c => M.symmetrySVG(c.sides, c.turn, c.axes),
    fractal: c => M.fractalSVG(c.level), mobius: c => M.bandSVG(c.band === 'mobius', c.travel, c.view),
    topology: c => M.topologySVG(c.shape, c.deform), euler: c => M.eulerSVG(c.solid),
  };
  for (const definition of topic.labs) {
    const root = document.querySelector(`[data-mb-lab="${definition.id}"]`);
    if (!root) continue;
    const controls = Object.fromEntries(definition.controls.map(control => [control.id, root.querySelector(`[data-mb-control="${control.id}"]`)]));
    const values = () => Object.fromEntries(definition.controls.map(control => [control.id, control.type === 'checkbox' ? controls[control.id].checked : control.type === 'range' ? Number(controls[control.id].value) : controls[control.id].value]));
    const set = (id, value) => { controls[id].value = String(value); };
    const output = (id, value) => { root.querySelector(`[data-mb-output="${id}"]`).textContent = value; };
    const render = () => {
      const c = values(), status = root.querySelector('[data-mb-status]');
      root.querySelector('[data-mb-live]').innerHTML = renderers[definition.kind](c);
      for (const control of definition.controls) {
        const current = root.querySelector(`[data-mb-control-value="${control.id}"]`);
        if (current && control.type === 'range') current.textContent = fmt(c[control.id], 3);
      }
      if (definition.kind === 'golden') {
        const g = M.golden(c.split);
        output('long', fmt(g.a, 3)); output('short', fmt(g.b, 3)); output('whole', fmt(g.whole, 6)); output('parts', fmt(g.parts, 6));
        output('gap', g.gap < .000001 ? g.gap.toExponential(2) : fmt(g.gap, 6));
        status.textContent = g.gap < .001 ? definition.messages.close : definition.messages.apart;
      } else if (definition.kind === 'fibonacci') {
        const f = M.fibonacci(c.terms), ratio = f.at(-1) / f.at(-2);
        output('sequence', f.join('、')); output('addition', `${f.at(-3)}＋${f.at(-2)}＝${f.at(-1)}`);
        output('ratio', `${f.at(-1)}÷${f.at(-2)}≈${fmt(ratio, 6)}`); output('error', fmt(Math.abs(ratio - M.PHI), 6));
        const rows = [];
        for (let i = Math.max(1, f.length - 5); i < f.length; i++) rows.push(`<tr><td>${i}</td><td>${f[i]} ÷ ${f[i - 1]}</td><td>${fmt(f[i] / f[i - 1], 6)}</td><td>${fmt(Math.abs(f[i] / f[i - 1] - M.PHI), 6)}</td></tr>`);
        root.querySelector('[data-mb-ratio-table]').innerHTML = rows.join('');
      } else if (definition.kind === 'sunflower') {
        output('angle', `${fmt(c.angle, 2)}°`); output('golden', `${fmt(360 / M.PHI ** 2, 6)}°`); output('count', c.seeds);
      } else if (definition.kind === 'symmetry') {
        const s = M.symmetry(c.sides, c.turn);
        output('angle', `${fmt(s.step, 4)}°`); output('axes', s.sides); output('overlap', s.overlaps ? definition.messages.yes : definition.messages.no);
      } else if (definition.kind === 'fractal') {
        const f = M.sierpinski(c.level);
        output('level', f.depth); output('pieces', f.count); output('scale', `1／${f.scale}`); output('area', `${f.count}／${4 ** f.depth} ≈ ${fmt(f.area * 100, 3)}%`);
      } else if (definition.kind === 'mobius') {
        const twisted = c.band === 'mobius';
        output('laps', fmt(c.travel / 100, 2)); output('sides', twisted ? definition.messages.one : definition.messages.two); output('boundaries', twisted ? 1 : 2);
        output('orientation', c.travel === 0 ? definition.messages.start : c.travel % 100 ? definition.messages.moving : twisted && c.travel === 100 ? definition.messages.flipped : definition.messages.same);
      } else if (definition.kind === 'topology') {
        const r = M.rubber(c.shape, c.deform);
        output('components', r.components); output('holes', r.holes); output('boundaries', r.boundaries);
      } else if (definition.kind === 'euler') {
        const p = M.polyhedron(c.solid);
        output('vertices', p.V); output('edges', p.E); output('faces', p.F); output('chi', `${p.V}－${p.E}＋${p.F}＝${p.chi}`);
      }
      status.hidden = !status.textContent;
      const next = root.querySelector('[data-mb-action="next"]');
      if (next) next.disabled = definition.kind === 'fibonacci' ? c.terms >= 12 : definition.kind === 'fractal' ? c.level >= 6 : definition.kind === 'mobius' ? c.travel >= 200 : definition.kind === 'topology' ? c.deform >= 100 : false;
    };
    for (const control of definition.controls) controls[control.id].addEventListener(control.type === 'range' ? 'input' : 'change', render);
    root.querySelectorAll('[data-mb-action]').forEach(button => button.addEventListener('click', () => {
      const action = button.dataset.mbAction, c = values();
      if (action === 'reset') for (const control of definition.controls) {
        if (control.type === 'checkbox') controls[control.id].checked = control.value;
        else set(control.id, control.value);
      }
      if (action === 'reset' && definition.kind === 'fractal') set('level', 0);
      if (action === 'snap') {
        if (definition.kind === 'golden') set('split', 100 / M.PHI);
        if (definition.kind === 'sunflower') set('angle', 360 / M.PHI ** 2);
      }
      if (action === 'next') {
        if (definition.kind === 'fibonacci') set('terms', Math.min(12, c.terms + 1));
        if (definition.kind === 'fractal') set('level', Math.min(6, c.level + 1));
        if (definition.kind === 'symmetry') { const step = 360 / c.sides; set('turn', ((Math.round(c.turn / step) + 1) * step) % 360); }
        if (definition.kind === 'mobius') set('travel', Math.min(200, c.travel + 25));
        if (definition.kind === 'topology') set('deform', Math.min(100, c.deform + 25));
      }
      render();
    }));
    render();
    root.querySelectorAll('[data-mb-enhanced]').forEach(element => { element.hidden = false; });
    root.querySelectorAll('[data-mb-fallback]').forEach(element => { element.hidden = true; });
  }
  for (const question of topic.quiz) {
    const root = document.querySelector(`[data-mb-question="${question.id}"]`);
    if (!root) continue;
    const buttons = root.querySelectorAll('[data-mb-answer]');
    buttons.forEach(button => {
      button.hidden = false;
      button.addEventListener('click', () => {
        buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
        const correct = Number(button.dataset.mbAnswer) === question.answer;
        const feedback = root.querySelector('[data-mb-feedback]');
        feedback.textContent = `${correct ? '判断正确。' : '再比较一下。'}${question.explanation}`;
        feedback.dataset.correct = String(correct); feedback.hidden = false;
      });
    });
  }
})();

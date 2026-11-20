(() => {
  'use strict';

  const game = document.querySelector('[data-bridge-game]');
  if (!game) return;

  const start = game.querySelector('[data-start]');
  const bridges = [...game.querySelectorAll('[data-cross]')];
  const status = game.querySelector('[data-bridge-status]');
  const route = game.querySelector('[data-walk]');
  const undo = game.querySelector('[data-undo]');
  const reset = game.querySelector('[data-reset]');
  const placeNames = new Map([...start.options].map(option => [option.value, option.text]));
  const walk = [];

  function currentPlace() {
    return walk.at(-1)?.place ?? start.value;
  }

  function render() {
    const current = currentPlace();
    const crossed = new Set(walk.map(step => step.bridge));
    let available = 0;

    for (const bridge of bridges) {
      const used = crossed.has(bridge);
      const canCross = !used && (current === bridge.dataset.from || current === bridge.dataset.to);
      bridge.toggleAttribute('data-crossed', used);
      bridge.setAttribute('aria-disabled', String(!canCross));
      if (canCross) available += 1;
    }

    const progress = `在${placeNames.get(current)}，已过 ${walk.length} / ${bridges.length} 座桥。`;
    status.textContent = available ? `${progress} 这里还有 ${available} 座桥可走。` : `${progress} 这里没有未走过的桥了。`;
    route.hidden = !walk.length;
    route.textContent = [start.value, ...walk.map(step => step.place)].map(place => placeNames.get(place)).join(' → ');
    undo.setAttribute('aria-disabled', String(!walk.length));
  }

  function restart() {
    walk.length = 0;
    render();
  }

  for (const bridge of bridges) {
    bridge.addEventListener('click', () => {
      if (bridge.getAttribute('aria-disabled') === 'true') return;
      const {from, to} = bridge.dataset;
      walk.push({bridge, place: currentPlace() === from ? to : from});
      render();
    });
  }
  undo.addEventListener('click', () => {
    if (!walk.length) return;
    walk.pop();
    render();
  });
  reset.addEventListener('click', restart);
  start.addEventListener('change', restart);
  render();
  game.hidden = false;
})();

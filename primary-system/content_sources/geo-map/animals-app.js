/* 中国与世界的动物、植物地图共用筛选、标记和照片档案。 */
(() => {
  'use strict';
  const root = document.querySelector('.gm-wildlife');
  if (!root) return;

  const S = window.GMShared;
  const esc = S.esc;
  const world = root.dataset.map === 'world';
  const flora = root.dataset.life === 'plant';
  const noun = flora ? '植物' : '动物';
  const queryKey = flora ? 'plant' : 'animal';
  const projection = world ? S.worldMap() : S;
  const data = flora ? (world ? window.GM_WORLD_FLORA : window.GM_FLORA)
    : (world ? window.GM_WORLD_WILDLIFE : window.GM_WILDLIFE);
  const { habitats } = data;
  const animals = flora ? data.plants : data.animals;
  const habitatById = new Map(habitats.map(habitat => [habitat.id, habitat]));
  const animalById = new Map(animals.map(animal => [animal.id, animal]));
  const provinceByCode = new Map((window.GM_PROVINCES || []).map(province => [province.adcode, province]));
  const assets = new URL(flora ? 'assets/plants/' : 'assets/animals/', document.currentScript.src);
  const map = root.querySelector('#gm-animal-map');
  const filters = root.querySelector('.gm-habitat-filters');
  const picker = root.querySelector('#gm-animal-picker');
  const card = root.querySelector('#gm-animal-card');
  const count = root.querySelector('#gm-animal-count');
  const params = new URL(location.href);
  let selected = animalById.get(params.searchParams.get(queryKey)) || animals[0];
  const labelPositions = {
    left: [-28, 1, 'end'],
    top: [0, -37, 'middle'],
    'top-right': [28, -37, 'start'],
    bottom: [0, 31, 'middle'],
    right: [28, 1, 'start'],
  };
  const placed = [];

  function plantPin(x, y) {
    // 密集地点把编号稍微错开，用引线保留真实位置。
    for (let radius = 0; radius <= 224; radius += 56) {
      for (let step = 0; step < (radius ? 12 : 1); step++) {
        const angle = step * Math.PI / 6;
        const candidate = [Math.round(x + radius * Math.cos(angle)), Math.round(y + radius * Math.sin(angle))];
        if (candidate[0] < 26 || candidate[0] > projection.W - 26 || candidate[1] < 26 || candidate[1] > projection.H - 26) continue;
        if (placed.every(point => Math.hypot(point[0] - candidate[0], point[1] - candidate[1]) >= 52)) {
          placed.push(candidate);
          return candidate;
        }
      }
    }
    return [x, y];
  }

  function marker(animal, index) {
    const { id, name, place, habitat, point, labelSide } = animal;
    const [x, y] = projection.m(...point).map(Math.round);
    const [pinX, pinY] = flora ? plantPin(x, y) : [x, y];
    const dx = pinX - x, dy = pinY - y;
    const [labelX, labelY, anchor] = labelPositions[labelSide || (flora && pinX > projection.W - 200 ? 'left' : 'right')];
    return `<g class="gm-animal-marker" role="button" tabindex="0" aria-pressed="false"
               aria-label="${esc(name)}，${esc(place)}" data-animal="${id}"
               style="--animal-color:${habitatById.get(habitat).color}" transform="translate(${x} ${y})">
      ${dx || dy ? `<path class="gm-plant-leader" d="M0 0L${dx} ${dy}"/><circle class="gm-plant-anchor" r="3"/>` : ''}
      <g transform="translate(${dx} ${dy})">
      <circle class="gm-animal-hit" r="22"/>
      <circle class="gm-animal-ring" r="21"/>
      <circle class="gm-animal-dot" r="17"/>
      <text class="gm-animal-number" text-anchor="middle" y="1" dominant-baseline="central" aria-hidden="true">${index + 1}</text>
      <text class="gm-animal-label" x="${labelX}" y="${labelY}" dominant-baseline="central"
            text-anchor="${anchor}" aria-hidden="true">${esc(name)}</text>
      </g>
    </g>`;
  }

  const baseMap = world
    ? projection.gridSVG() + [...projection.paths.values()].map(path =>
      `<path class="gm-neutral" fill="var(--animal-land)" fill-rule="evenodd" d="${path}"/>`).join('')
    : S.mapPrelude() + S.provincePathsSVG(() => 'var(--animal-land)') + S.insetSVG();
  map.setAttribute('viewBox', world
    ? `-12 0 ${projection.W + 24} ${Math.ceil(projection.H) + 12}`
    : `90 0 ${S.W - 100} ${Math.ceil(S.H) + 20}`);
  map.innerHTML = '<g aria-hidden="true">' + baseMap + S.compass() + '</g>' + animals.map(marker).join('');
  const markers = [...map.querySelectorAll('[data-animal]')];
  const numbers = new Map(animals.map((animal, index) => [animal.id, index + 1]));
  picker.innerHTML = animals.map(animal =>
    `<button type="button" class="gm-animal-choice" data-animal="${esc(animal.id)}" aria-pressed="false"
             style="--animal-color:${habitatById.get(animal.habitat).color}">
      <img src="${esc(new URL(animal.id + '.jpg', assets).href)}" alt="" loading="lazy" decoding="async">
      <span class="gm-animal-choice-caption">
        <span class="gm-animal-choice-name"><span>${numbers.get(animal.id)}</span><b>${esc(animal.name)}</b></span>
        <small>${esc(animal.place)}</small>
      </span>
    </button>`).join('');
  const targets = [...markers, ...picker.querySelectorAll('[data-animal]')];

  filters.innerHTML = [{ id: '', name: '全部', color: '' }, ...habitats].map(({ id, name, color }) =>
    `<button type="button" data-habitat="${id}" aria-pressed="false">
      ${color ? `<span class="gm-habitat-key" style="--animal-color:${color}" aria-hidden="true"></span>` : ''}
      ${esc(name)}</button>`).join('');

  function select(animal) {
    selected = animal;
    const habitat = habitatById.get(animal.habitat);
    const province = provinceByCode.get(animal.adcode);
    const placeLink = world
      ? `<a class="gm-animal-station" href="world.html?place=${encodeURIComponent(animal.mapPlace)}#map">在世界地图上看 →</a>`
      : `<a class="gm-animal-station" href="province.html?adcode=${province.adcode}">看${esc(S.displayName(province.name))}省域站 →</a>`;
    for (const target of targets) target.setAttribute('aria-pressed', String(target.dataset.animal === animal.id));
    card.style.setProperty('--animal-color', habitat.color);
    card.innerHTML = `
      <img class="gm-animal-photo" src="${esc(new URL(animal.id + '.jpg', assets).href)}" alt="${esc(animal.name)}">
      <div class="gm-animal-info">
        <p class="gm-animal-kicker"><span>${numbers.get(animal.id)}</span> ${esc(habitat.name)}</p>
        <h2 id="gm-animal-name">${esc(animal.name)}</h2>
        ${flora ? `<p class="gm-plant-scientific" lang="la">${esc(animal.scientificName)}</p>` : ''}
        <p class="gm-animal-place">${esc(animal.place)}</p>
        <dl>
          <dt>${flora ? '它长在哪里？' : '它住在哪里？'}</dt><dd>${esc(animal.home)}</dd>
          ${flora ? `<dt>怎样适应环境？</dt><dd>${esc(animal.adaptation)}</dd>` : ''}
          <dt>观察线索</dt><dd>${esc(animal.clue)}</dd>
        </dl>
        ${placeLink}
        <p class="gm-animal-sources">
          <a href="${esc(animal.source)}" target="_blank" rel="noopener">${animal.photoSource ? '资料出处' : '资料与照片出处'} ↗</a>
          ${animal.photoSource ? `<a href="${esc(animal.photoSource)}" target="_blank" rel="noopener">照片出处 ↗</a>` : ''}
        </p>
      </div>`;
  }

  function rememberSelection() {
    if (location.protocol === 'file:') return;
    params.searchParams.set(queryKey, selected.id);
    history.replaceState(null, '', params);
  }

  function filter(habitat) {
    const visible = animals.filter(animal => !habitat || animal.habitat === habitat);
    const visibleIds = new Set(visible.map(animal => animal.id));
    for (const button of filters.querySelectorAll('button')) {
      button.setAttribute('aria-pressed', String(button.dataset.habitat === habitat));
    }
    for (const target of targets) target.toggleAttribute('hidden', !visibleIds.has(target.dataset.animal));
    count.textContent = `地图上有 ${visible.length} 种${noun}。`;
    select(visibleIds.has(selected.id) ? selected : visible[0]);
  }

  function chooseAnimal(event) {
    const pin = event.target.closest('[data-animal]');
    if (!pin) return;
    select(animalById.get(pin.dataset.animal));
    rememberSelection();
    // 竖屏里植物档案会收进辅助栏，选择后展开，方便立即阅读。
    const workspace = root.querySelector('.gm-wildlife-workspace');
    if (flora && workspace.dataset.slMode === 'compact') {
      if (workspace.dataset.slOpen !== 'true') workspace.querySelector('.sl-toggle').click();
      card.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }

  filters.addEventListener('click', event => {
    const button = event.target.closest('[data-habitat]');
    if (!button) return;
    filter(button.dataset.habitat);
    rememberSelection();
  });
  picker.addEventListener('click', chooseAnimal);
  map.addEventListener('click', chooseAnimal);
  map.addEventListener('keydown', event => {
    if (!event.target.matches('[data-animal]') || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    if (!event.repeat) chooseAnimal(event);
  });

  filter('');
  root.querySelector('.gm-wildlife-tools').hidden = false;
  root.querySelector('.gm-wildlife-workspace').hidden = false;
})();

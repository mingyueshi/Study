/* 海拔柱只作读数标记；数字来自原采样器，场景对象随倍率和省份位置更新。 */
window.GMChinaLearningVisual = (() => {
  'use strict';
  function pinHeight(meters, gain, metersPerUnit) {
    return Math.max(0.06, (Math.abs(meters) / metersPerUnit) * gain);
  }
  function viewportPoint(x, y, width, height, compare) {
    if (
      ![x, y, width, height].every(Number.isFinite) ||
      width <= 0 ||
      height <= 0 ||
      x < 0 ||
      x > width ||
      y < 0 ||
      y > height
    )
      return null;
    const panel = compare && x >= width / 2 ? 1 : 0,
      panelWidth = compare ? width / 2 : width;
    return {
      panel,
      x: ((x - panel * panelWidth) / panelWidth) * 2 - 1,
      y: 1 - (y / height) * 2,
      gain: compare ? (panel ? 50 : 1) : null,
    };
  }
  function cube(T) {
    const g = new T.BufferGeometry();
    g.setAttribute(
      'position',
      new T.Float32BufferAttribute(
        [
          -0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0, -0.5, -0.5, 1, 0.5, -0.5, 1, 0.5, 0.5, 1,
          -0.5, 0.5, 1,
        ],
        3,
      ),
    );
    g.setIndex([
      0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4,
      7,
    ]);
    return g;
  }
  function mount({ root, available, requestDraw, prepare, emptied }) {
    const $ = (id) => root.querySelector('#gm3-' + id),
      esc = window.GMShared.esc;
    let last = null,
      seq = 0,
      context = null;
    const pins = [];
    const number = (meters) => Math.round(meters / 10) * 10;
    const caption = (p) =>
      number(p.meters) < 0
        ? `低于海平面约 ${Math.abs(number(p.meters))} 米`
        : `海拔约 ${number(p.meters)} 米`;
    $('pin-note').textContent = window.GM_CHINA_LEARNING.pinNote;
    function render() {
      $('pin-last').textContent = last ? `刚才的位置：${caption(last)}` : '先在地形上点一个位置。';
      $('pin-add').disabled = !last || !available() || pins.length >= 6;
      $('pin-clear').hidden = $('pin-clear').disabled = pins.length === 0;
      $('pin-view').hidden = pins.length === 0;
      $('pin-note').hidden = pins.length === 0;
      $('pin-count').textContent = pins.length ? `已钉 ${pins.length}／6 根` : '';
      $('pin-list').innerHTML = pins
        .map(
          (p) =>
            `<li><span>${esc(caption(p))}</span><button type="button" data-remove-pin="${p.id}" aria-label="拔掉${esc(caption(p))}的柱子">拔掉</button></li>`,
        )
        .join('');
      root.dataset.pinCount = String(pins.length);
      if (!available()) for (const p of pins) if (p.label) p.label.hidden = true;
      requestDraw();
    }
    function build(p) {
      if (!context) return;
      const { T, scene } = context;
      const mesh = new T.Mesh(
        cube(T),
        new T.MeshBasicMaterial({
          color: p.meters < 0 ? '#a18dd4' : '#f8b634',
          transparent: true,
          opacity: 0.65,
          depthWrite: false,
        }),
      );
      scene.add(mesh);
      p.mesh = mesh;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'gm3-altitude-pin';
      button.dataset.removePin = p.id;
      button.textContent = caption(p) + ' ×';
      button.setAttribute('aria-label', '拔掉' + caption(p) + '的柱子');
      $('pin-labels').append(button);
      p.label = button;
    }
    function remove(id) {
      const index = pins.findIndex((p) => p.id === id);
      if (index < 0) return;
      const [p] = pins.splice(index, 1);
      if (p.mesh) {
        context.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
      }
      p.label?.remove();
      render();
      if (!pins.length) emptied();
    }
    function add() {
      if (!last || !available() || pins.length >= 6) return;
      prepare();
      const p = { id: 'pin-' + ++seq, point: last.point.slice(), meters: last.meters };
      pins.push(p);
      build(p);
      render();
    }
    function update(gain, offset) {
      if (!context) return;
      const { G, camera, viewport } = context;
      const px = (camera.right - camera.left) / camera.zoom / Math.max(1, viewport.clientWidth),
        thickness = Math.max(0.025, px * 7);
      for (const p of pins) {
        if (!p.mesh) continue;
        p.mesh.visible = root.dataset.compare !== 'true';
        const [x, y] = G.xy(p.point),
          owner = context.owner(p.point);
        p.mesh.position.set(x, y, G.heightToZ(p.meters, gain) + offset(owner) + 0.005);
        p.mesh.scale.set(thickness, thickness, pinHeight(p.meters, gain, G.metersPerUnit));
      }
    }
    function layout(compare) {
      if (!context) return;
      const { T, camera, viewport } = context;
      for (const p of pins) {
        if (!p.label || !p.mesh) continue;
        const point = new T.Vector3(
          p.mesh.position.x,
          p.mesh.position.y,
          p.mesh.position.z + p.mesh.scale.z,
        ).project(camera);
        const x = ((point.x + 1) * viewport.clientWidth) / 2,
          y = ((1 - point.y) * viewport.clientHeight) / 2;
        p.label.hidden =
          compare ||
          point.z < -1 ||
          point.z > 1 ||
          x < 20 ||
          x > viewport.clientWidth - 20 ||
          y < 25 ||
          y > viewport.clientHeight - 20;
        p.label.style.left = x + 'px';
        p.label.style.top = y + 'px';
      }
    }
    $('pin-add').addEventListener('click', add);
    $('pin-clear').addEventListener('click', () => {
      const hadFocus = document.activeElement === $('pin-clear');
      for (const p of [...pins]) remove(p.id);
      if (hadFocus && !$('pin-add').disabled) $('pin-add').focus({ preventScroll: true });
    });
    for (const node of [$('pin-list'), $('pin-labels')])
      node.addEventListener('click', (event) => {
        const b = event.target.closest('[data-remove-pin]');
        if (b) remove(b.dataset.removePin);
      });
    render();
    return {
      setLast(point, meters) {
        if (Array.isArray(point) && point.every(Number.isFinite) && Number.isFinite(meters)) {
          last = { point: point.slice(), meters };
          render();
        }
      },
      attach(options) {
        context = options;
        for (const p of pins) build(p);
        render();
      },
      update,
      layout,
      refresh: render,
    };
  }
  return { pinHeight, viewportPoint, mount };
})();

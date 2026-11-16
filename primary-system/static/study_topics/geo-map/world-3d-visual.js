/* 静止时按需绘制；纹理、地形和材质全部使用本地资料。 */
window.GMWorldVisual = (() => {
  'use strict';
  function sampler(pixels, width, height, min, max) {
    return ([lon, lat]) => {
      const x = ((lon + 180) % 360 + 360) % 360 / 360 * (width - 1);
      const y = (90 - Math.max(-90, Math.min(90, lat))) / 180 * (height - 1);
      const a = Math.floor(x), b = Math.floor(y), dx = x - a, dy = y - b;
      const value = (col, row) => pixels[(Math.min(row, height - 1) * width + col) * 4];
      return min + ((1 - dy) * ((1 - dx) * value(a, b) + dx * value(a + 1, b)) + dy * ((1 - dx) * value(a, b + 1) + dx * value(a + 1, b + 1))) / 255 * (max - min);
    };
  }
  function offset(height, limit) {
    return Math.sign(height) * Math.min(1, Math.abs(height) / 9000) ** .7 * limit;
  }
  function createRotation({request, cancel, available, advance, changed}) {
    let running = false, frame = 0, previous = null, generation = 0;
    function pause() {
      running = false; previous = null; generation++;
      if (frame) cancel(frame); frame = 0; changed(false);
    }
    function tick(time, token) {
      if (!running || token !== generation) return;
      frame = 0;
      if (!available()) { pause(); return; }
      if (previous !== null) advance(Math.min(.1, Math.max(0, time - previous) / 1000));
      previous = time; frame = request(stamp => tick(stamp, token));
    }
    function play() {
      if (running || !available()) return;
      running = true; previous = null; const token = ++generation;
      changed(true); frame = request(time => tick(time, token));
    }
    return {play, pause, running: () => running, refresh: () => { if (!available()) pause(); }};
  }
  const vertexShader = `
    varying vec2 vMapUV;
    varying vec3 vSurfaceNormal;
    varying vec3 vRadial;
    void main() {
      vMapUV = uv;
      vSurfaceNormal = normalize(mat3(modelMatrix) * normal);
      vRadial = normalize((modelMatrix * vec4(position, 1.0)).xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`;
  const fragmentShader = `
    uniform sampler2D surfaceMap;
    uniform sampler2D nightMap;
    uniform vec3 sunDirection;
    uniform vec3 viewLight;
    uniform float daylightMode;
    uniform float lightsEnabled;
    varying vec2 vMapUV;
    varying vec3 vSurfaceNormal;
    varying vec3 vRadial;
    void main() {
      vec3 base = texture2D(surfaceMap, vMapUV).rgb;
      vec3 n = normalize(mix(normalize(vRadial), normalize(vSurfaceNormal), 2.2));
      float sunHeight = dot(normalize(vRadial), sunDirection);
      float day = smoothstep(-0.09, 0.12, sunHeight);
      float diffuse = max(0.0, dot(n, mix(viewLight, sunDirection, daylightMode)));
      float brightness = mix(0.68 + 0.42 * diffuse, mix(0.055, 0.58 + 0.5 * diffuse, day), daylightMode);
      vec4 lights = texture2D(nightMap, vMapUV);
      float night = (1.0 - smoothstep(-0.18, 0.025, sunHeight)) * daylightMode * lightsEnabled;
      gl_FragColor = vec4(base * brightness + lights.rgb * lights.a * night * 1.5, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;
  function create({T, G, scene, texture, landMask, assets, root, render, terrainChanged}) {
    const D = window.GM_WORLD_VISUAL, $ = id => root.querySelector('#' + id);
    let elevation = () => 0, terrain = true, ancient = false, disposed = false, sunPoint = null;
    const nightCanvas = document.createElement('canvas'); nightCanvas.width = 2048; nightCanvas.height = 1024;
    const ctx = nightCanvas.getContext('2d');
    if (ctx) {
      for (const [index, city] of D.cities.entries()) {
        const x = (city.point[0] + 180) / 360 * nightCanvas.width, y = (90 - city.point[1]) / 180 * nightCanvas.height;
        for (let j = 0; j < 16; j++) {
          const angle = j * 2.39996 + index, spread = j ? Math.sqrt(j) * city.size * 1.2 : 0;
          const cx = x + Math.cos(angle) * spread, cy = y + Math.sin(angle) * spread * .55, r = j ? .85 : city.size * 1.8;
          const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2);
          glow.addColorStop(0, '#fff2ae'); glow.addColorStop(.22, '#ffca64bf'); glow.addColorStop(1, '#ffab2500');
          ctx.fillStyle = glow; ctx.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
        }
      }
      // 灯点只留在陆地上，不在海里随机撒点。
      ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(landMask, 0, 0, nightCanvas.width, nightCanvas.height);
    }
    const nightTexture = new T.CanvasTexture(nightCanvas); nightTexture.colorSpace = T.SRGBColorSpace;
    const uniforms = {
      surfaceMap: {value: texture}, nightMap: {value: nightTexture}, sunDirection: {value: new T.Vector3(0, 0, 1)},
      viewLight: {value: new T.Vector3(0, 1, 1).normalize()}, daylightMode: {value: 0}, lightsEnabled: {value: 1}
    };
    const material = new T.ShaderMaterial({uniforms, vertexShader, fragmentShader});
    const geometry = G.sphere(T, 360, 180);
    function radius(point, clearance = 0) { return 1 + (terrain ? offset(elevation(point), D.relief.maxOffset) : 0) + clearance; }
    function applyTerrain() {
      const positions = geometry.getAttribute('position'), uv = geometry.getAttribute('uv');
      for (let i = 0; i < positions.count; i++) {
        const point = [uv.getX(i) * 360 - 180, uv.getY(i) * 180 - 90];
        positions.setXYZ(i, ...G.xyz(point, radius(point)));
      }
      positions.needsUpdate = true; geometry.computeVertexNormals();
      // 接缝两侧共享法线，极点保持径向，避免出现亮缝和黑色针尖。
      const normals = geometry.getAttribute('normal');
      for (let row = 0; row <= 180; row++) {
        const a = row * 361, b = a + 360;
        if (row === 0 || row === 180) for (let col = 0; col <= 360; col++) normals.setXYZ(a + col, 0, row === 0 ? 1 : -1, 0);
        else {
          const n = new T.Vector3().fromBufferAttribute(normals, a).add(new T.Vector3().fromBufferAttribute(normals, b)).normalize();
          normals.setXYZ(a, n.x, n.y, n.z); normals.setXYZ(b, n.x, n.y, n.z);
        }
      }
      normals.needsUpdate = true; geometry.computeBoundingSphere(); terrainChanged(); render();
    }
    const atmosphere = new T.Mesh(G.sphere(T, 144, 72), new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.BackSide, blending: T.AdditiveBlending,
      uniforms: {sunDirection: uniforms.sunDirection, daylightMode: uniforms.daylightMode},
      vertexShader: `varying vec3 vNormalWorld; varying vec3 vPositionWorld;
        void main() { vNormalWorld = normalize(mat3(modelMatrix) * normal); vPositionWorld = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform vec3 sunDirection; uniform float daylightMode; varying vec3 vNormalWorld; varying vec3 vPositionWorld;
        void main() { vec3 n = normalize(vNormalWorld); float edge = 1.0 - abs(dot(n, normalize(cameraPosition - vPositionWorld)));
          float rim = pow(edge, 3.0) * (1.0 - smoothstep(0.78, 1.0, edge));
          float day = mix(1.0, 0.24 + 0.76 * smoothstep(-0.2, 0.5, dot(n, sunDirection)), daylightMode);
          gl_FragColor = vec4(0.19, 0.57, 1.0, rim * 0.62 * day);
          #include <colorspace_fragment>
        }`
    }));
    atmosphere.scale.setScalar(1.055); scene.add(atmosphere);
    const sun = new T.Mesh(G.sphere(T, 32, 16), new T.MeshBasicMaterial({color: '#ffe7a0', toneMapped: false}));
    sun.scale.setScalar(.11); sun.visible = false; scene.add(sun);
    const corona = new T.Mesh(G.sphere(T, 32, 16), new T.MeshBasicMaterial({color: '#ffbf52', transparent: true, opacity: .16, depthWrite: false}));
    corona.scale.setScalar(1.6); sun.add(corona);
    const image = new Image();
    image.onload = () => {
      if (disposed) return;
      const map = document.createElement('canvas'); map.width = D.relief.width; map.height = D.relief.height;
      try {
        const c = map.getContext('2d'); c.drawImage(image, 0, 0);
        elevation = sampler(c.getImageData(0, 0, map.width, map.height).data, map.width, map.height, D.relief.min, D.relief.max);
        applyTerrain(); root.dataset.relief = 'ready';
      } catch { noRelief(); }
    };
    function noRelief() { root.dataset.relief = 'unavailable'; $('gw-relief').checked = false; $('gw-relief').disabled = true; $('gw-visual-status').textContent = '地形资料暂时无法读取，仍可在平滑地球上探索。'; }
    image.onerror = noRelief; image.src = new URL(D.relief.file, assets).href;
    $('gw-relief').addEventListener('change', () => { terrain = $('gw-relief').checked && !ancient; applyTerrain(); });
    $('gw-atmosphere').addEventListener('change', () => { atmosphere.visible = $('gw-atmosphere').checked; render(); });
    $('gw-lights').addEventListener('change', () => { uniforms.lightsEnabled.value = Number($('gw-lights').checked && !ancient); render(); });
    function illuminate(model) {
      sunPoint = model?.sunPoint || null; uniforms.daylightMode.value = Number(Boolean(model)); sun.visible = Boolean(model);
      root.dataset.lighting = model ? 'daylight' : 'studio'; $('gw-sun-direction').hidden = !model;
      if (model) { uniforms.sunDirection.value.set(...G.xyz(sunPoint)); sun.position.copy(uniforms.sunDirection.value).multiplyScalar(2.3); }
    }
    function update(camera) {
      uniforms.viewLight.value.copy(camera.position).normalize().add(new T.Vector3(-.2, .45, .1)).normalize();
      if (!sunPoint) return;
      const projection = sun.position.clone().project(camera), w = $('gw-viewport').clientWidth, h = $('gw-viewport').clientHeight;
      const behind = sun.position.dot(camera.position) < 0;
      const label = $('gw-sun-direction');
      label.textContent = behind ? '☀ 太阳在地球后方' : '☀ 阳光从这里照来';
      label.style.left = Math.max(95, Math.min(w - 95, (projection.x + 1) / 2 * w)) + 'px';
      label.style.top = Math.max(20, Math.min(h - 70, (1 - projection.y) / 2 * h - 65)) + 'px';
      const hud = $('gw-tool-readout').getBoundingClientRect(), badge = label.getBoundingClientRect();
      if (badge.left < hud.right && badge.right > hud.left && badge.top < hud.bottom && badge.bottom > hud.top) {
        label.style.top = Math.min(h - 65, hud.bottom - $('gw-viewport').getBoundingClientRect().top + 14) + 'px';
      }
    }
    function dispose() {
      disposed = true; image.onload = image.onerror = null;
      for (const mesh of [atmosphere, sun, corona]) { mesh.geometry.dispose(); mesh.material.dispose(); }
      nightTexture.dispose(); scene.remove(atmosphere, sun);
    }
    return {geometry, material, radius, illuminate, update, dispose,setAncient(on){ancient=on;terrain=$('gw-relief').checked&&!ancient;uniforms.lightsEnabled.value=Number($('gw-lights').checked&&!ancient);applyTerrain();}};
  }
  return {sampler, offset, createRotation, create};
})();

/* 按原三角网画等高线；光照、雪线和透明度只改变显示。 */
window.GMChinaTerrainVisual = (() => {
  "use strict";
  function contours(mesh, interval = 500, liftMeters = 2) {
    if (!Number.isFinite(interval) || interval <= 0)
      throw new Error("等高距必须大于零");
    const G = window.GMChina3DGeometry,
      p = mesh.positions,
      h = mesh.elevations,
      ids = mesh.indices,
      out = [],
      seen = new Set();
    for (let i = 0; i < ids.length; i += 3) {
      const v = [ids[i], ids[i + 1], ids[i + 2]],
        values = v.map((k) => h[k]);
      const low = Math.min(...values),
        high = Math.max(...values);
      if (low === high) continue;
      for (
        let level = Math.ceil(low / interval) * interval;
        level <= high;
        level += interval
      ) {
        const hits = [];
        for (let edge = 0; edge < 3; edge++) {
          const a = v[edge],
            b = v[(edge + 1) % 3],
            ha = h[a],
            hb = h[b];
          if (!((ha < level && hb >= level) || (hb < level && ha >= level)))
            continue;
          const t = (level - ha) / (hb - ha),
            x = p[a * 3] + (p[b * 3] - p[a * 3]) * t,
            y = p[a * 3 + 1] + (p[b * 3 + 1] - p[a * 3 + 1]) * t;
          hits.push([x, y, (level + liftMeters) / G.metersPerUnit]);
        }
        if (
          hits.length !== 2 ||
          Math.hypot(hits[0][0] - hits[1][0], hits[0][1] - hits[1][1]) < 1e-8
        )
          continue;
        const endpoints = hits
          .map((a) =>
            a
              .slice(0, 2)
              .map((n) => Math.round(n * 1e6))
              .join(","),
          )
          .sort();
        const key = level + ":" + endpoints.join(":");
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(...hits[0], ...hits[1]);
      }
    }
    return new Float32Array(out);
  }
  function lightVector(azimuth, elevation, distance = 80) {
    const a = (azimuth * Math.PI) / 180,
      e = (elevation * Math.PI) / 180;
    return [
      Math.sin(a) * distance,
      Math.cos(a) * distance,
      Math.tan(e) * distance,
    ];
  }
  function describe(root) {
    const D = window.GM_CHINA_TERRAIN_VISUAL,
      $ = (id) => root.querySelector("#gm3-" + id);
    for (const [key, content] of [
      ["contour-note", D.contours.note],
      ["light-note", D.light.note],
      ["snow-note", D.snow.note],
      ["opacity-note", D.opacity.note],
    ])
      $(key).textContent = content;
    $("light-presets").innerHTML = D.light.presets
      .map(
        (p) =>
          `<button type="button" data-light="${p.id}" aria-pressed="false">${window.GMShared.esc(p.name)}</button>`,
      )
      .join("");
    for (const [key, value] of Object.entries({
      min: D.snow.min,
      max: D.snow.max,
      step: D.snow.step,
      value: D.snow.initial,
    }))
      $("snow-altitude")[key] = value;
    $("snow-altitude-output").value = D.snow.initial + " 米";
    $("light-azimuth").value = D.light.azimuth;
    $("terrain-opacity").value = D.opacity.initial;
    $("terrain-opacity-output").value = D.opacity.initial + "％";
  }
  function create({ root, models, sun, requestDraw, parts }) {
    const T = window.GMThree,
      G = window.GMChina3DGeometry,
      D = window.GM_CHINA_TERRAIN_VISUAL,
      $ = (id) => root.querySelector("#gm3-" + id);
    let enabled = false,
      available = true,
      disposed = false,
      frame = 0,
      paused = false,
      segmentCount = 0;
    const lines = new Map(),
      pending = new Set(),
      cache = new WeakMap();
    const uniforms = {
      gmSnowEnabled: { value: 0 },
      gmSnowMeters: { value: D.snow.initial },
      gmSnowColor: { value: new T.Color("#f4fcff") },
    };
    function snowAttribute(model) {
      model.geometry.top.setAttribute(
        "gmTerrainMeters",
        new T.Float32BufferAttribute(model.geometry.elevations, 1),
      );
    }
    for (const model of models.values()) {
      snowAttribute(model);
      model.top.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, uniforms);
        shader.vertexShader =
          "attribute float gmTerrainMeters; varying float gmAltitude;\n" +
          shader.vertexShader.replace(
            "#include <begin_vertex>",
            "#include <begin_vertex>\ngmAltitude = gmTerrainMeters;",
          );
        shader.fragmentShader =
          "uniform float gmSnowEnabled; uniform float gmSnowMeters; uniform vec3 gmSnowColor; varying float gmAltitude;\n" +
          shader.fragmentShader.replace(
            "#include <color_fragment>",
            "#include <color_fragment>\nif (gmSnowEnabled > 0.5 && gmAltitude >= gmSnowMeters) diffuseColor.rgb = gmSnowColor;",
          );
      };
      model.top.customProgramCacheKey = () => "china-altitude-snow-v1";
      model.top.needsUpdate = true;
      // 半透明地形绘制后，省界仍保持清晰。
      for (const m of [model.edge, model.halo]) {
        m.transparent = true;
        m.needsUpdate = true;
      }
    }
    function status() {
      root.dataset.contours = String(enabled);
      root.dataset.contourSegments = String(segmentCount);
      root.dataset.contourPending = String(enabled ? pending.size : 0);
      const message = !available
        ? "3D 画面暂不可用，仍可阅读观察提示。"
        : !enabled
          ? "等高线默认关闭，可以随时打开。"
          : pending.size
            ? "正在沿山坡画等高线……"
            : `已叠加每 ${D.contours.interval} 米一档的等高线。`;
      if ($("terrain-visual-status").textContent !== message)
        $("terrain-visual-status").textContent = message;
    }
    function removeLine(id) {
      const line = lines.get(id);
      if (!line) return;
      segmentCount -= line.geometry.getAttribute("position").count / 2;
      line.removeFromParent();
      line.geometry.dispose();
      line.material.dispose();
      lines.delete(id);
    }
    function buildLine(id) {
      const model = models.get(id);
      if (!model) return;
      const arrays = (parts ? parts(id) : [model.geometry]).map((record) => {
        if (!cache.has(record))
          cache.set(record, contours(record, D.contours.interval));
        return cache.get(record);
      });
      const geometry = new T.BufferGeometry().setAttribute(
        "position",
        new T.Float32BufferAttribute(G.mergeFloats(arrays), 3),
      );
      const line = new T.LineSegments(
        geometry,
        new T.LineBasicMaterial({
          color: D.contours.color,
          transparent: true,
          opacity: D.contours.opacity,
          depthWrite: false,
        }),
      );
      line.name = "terrain-contours";
      line.renderOrder = 0.6;
      model.group.add(line);
      lines.set(id, line);
      segmentCount += geometry.getAttribute("position").count / 2;
    }
    function pump() {
      if (
        frame ||
        !enabled ||
        !available ||
        disposed ||
        paused ||
        !pending.size
      )
        return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!enabled || !available || disposed || paused) return;
        const id = pending.values().next().value;
        pending.delete(id);
        removeLine(id);
        buildLine(id);
        status();
        requestDraw();
        pump();
      });
    }
    function refreshTerrain(ids) {
      for (const id of ids) {
        const model = models.get(id);
        if (!model) continue;
        snowAttribute(model);
        removeLine(id);
        pending.add(id);
      }
      status();
      pump();
    }
    $("contours").addEventListener("click", () => {
      if (!available) return;
      enabled = !enabled;
      $("contours").setAttribute("aria-pressed", String(enabled));
      for (const line of lines.values()) line.visible = enabled;
      if (enabled) {
        for (const id of models.keys()) if (!lines.has(id)) pending.add(id);
      }
      if (!enabled && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      status();
      pump();
      requestDraw();
    });
    function snow(on) {
      uniforms.gmSnowEnabled.value = Number(on);
      root.dataset.snow = String(on);
      root.dataset.snowMeters = String(uniforms.gmSnowMeters.value);
      $("snow").setAttribute("aria-pressed", String(on));
      requestDraw();
    }
    $("snow").addEventListener("click", () => {
      if (available) snow(!uniforms.gmSnowEnabled.value);
    });
    $("snow-altitude").addEventListener("input", () => {
      const n = Number($("snow-altitude").value);
      uniforms.gmSnowMeters.value = Math.max(
        D.snow.min,
        Math.min(D.snow.max, Number.isFinite(n) ? n : D.snow.initial),
      );
      $("snow-altitude-output").value = uniforms.gmSnowMeters.value + " 米";
      snow(true);
    });
    snow(false);
    function light(value) {
      const number = Number(value),
        angle = Number.isFinite(number)
          ? ((number % 360) + 360) % 360
          : D.light.azimuth;
      sun.position.set(...lightVector(angle, D.light.elevation));
      $("light-azimuth").value = angle;
      $("light-azimuth-output").value = `光从 ${Math.round(angle)}° 方向来`;
      root.dataset.lightAzimuth = String(angle);
      root.dataset.lightVector = sun.position
        .toArray()
        .map((n) => n.toFixed(3))
        .join(",");
      $("light-presets")
        .querySelectorAll("button")
        .forEach((b) =>
          b.setAttribute(
            "aria-pressed",
            String(
              D.light.presets.find((p) => p.id === b.dataset.light)?.azimuth ===
                angle,
            ),
          ),
        );
      const a = (angle * Math.PI) / 180,
        s = Math.sin(a),
        c = Math.cos(a),
        arrow = $("light-compass").querySelector("line");
      arrow.setAttribute("x1", 65 + s * 42);
      arrow.setAttribute("y1", 65 - c * 42);
      arrow.setAttribute("x2", 65 + s * 13);
      arrow.setAttribute("y2", 65 - c * 13);
      requestDraw();
    }
    $("light-azimuth").addEventListener("input", () =>
      light($("light-azimuth").value),
    );
    $("light-presets").addEventListener("click", (e) => {
      const p = D.light.presets.find(
        (p) => p.id === e.target.closest("[data-light]")?.dataset.light,
      );
      if (p) light(p.azimuth);
    });
    light(D.light.azimuth);
    function opacity() {
      const n = Number($("terrain-opacity").value),
        percent = Math.max(0, Math.min(100, Number.isFinite(n) ? n : 100)),
        alpha = percent / 100;
      for (const model of models.values())
        for (const m of [
          model.top,
          model.group.children.find((o) => o.isMesh && o !== model.mesh)
            ?.material,
        ].filter(Boolean)) {
          const transparent = alpha < 1;
          if (m.transparent !== transparent) {
            m.transparent = transparent;
            m.needsUpdate = true;
          }
          m.opacity = alpha;
          m.depthWrite = alpha === 1;
        }
      $("terrain-opacity-output").value = percent + "％";
      root.dataset.terrainOpacity = String(percent);
      requestDraw();
    }
    $("terrain-opacity").addEventListener("input", opacity);
    opacity();
    status();
    return {
      refreshTerrain,
      setAvailable(on) {
        available = on;
        root
          .querySelectorAll(
            ".gm3-visual-controls button,.gm3-visual-controls input",
          )
          .forEach((n) => (n.disabled = !on));
        if (!on && frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
        status();
        pump();
      },
      pause() {
        paused = true;
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
      },
      resume() {
        paused = false;
        pump();
      },
      dispose() {
        disposed = true;
        if (frame) cancelAnimationFrame(frame);
        for (const id of [...lines.keys()]) removeLine(id);
        pending.clear();
      },
    };
  }
  return { contours, lightVector, describe, create };
})();

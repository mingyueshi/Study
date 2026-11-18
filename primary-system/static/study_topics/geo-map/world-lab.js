/* 专题叠加只在内容变化时画纹理；城市和天球标签随镜头投影。 */
window.GMWorldLab = (() => {
  "use strict";
  const rainColor = (mm) =>
    mm === null
      ? "#d9e0e2"
      : mm < 250
        ? "#ddbd7d"
        : mm < 500
          ? "#e6da78"
          : mm < 1000
            ? "#9bca8b"
            : mm < 2000
              ? "#4faebb"
              : mm < 3000
                ? "#507cc0"
                : "#9668bd";
  const populationRadius = (people) => 26 * Math.sqrt(people / 42000000);
  function mount({
    root,
    focus,
    render,
    repaint,
    prepare,
    ancientChanged,
    project,
    attachSky,
  }) {
    const D = window.GM_WORLD_LAB,
      G = window.GMWorld3DGeometry,
      esc = window.GMShared.esc,
      $ = (id) => root.querySelector("#gw-lab-" + id);
    const modes = [
      "none",
      "population",
      "plates",
      "pangaea",
      "summer",
      "winter",
      "typhoon",
      "rain",
      "sky",
    ];
    let mode = "none";
    const relatedLinks = root.querySelectorAll("[data-lab-modes]");
    const markers = root.querySelector("#gw-population-markers"),
      stars = root.querySelector("#gw-stars");
    const dots = D.population.cities.map((city) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "gw-population-dot";
      b.hidden = true;
      b.style.width = b.style.height = populationRadius(city.people) * 2 + "px";
      b.setAttribute(
        "aria-label",
        `${city.name}，约 ${Math.round(city.people / 10000)} 万人`,
      );
      b.title = b.getAttribute("aria-label");
      b.addEventListener("click", () => cityInfo(city));
      markers.append(b);
      return { city, b };
    });
    const c = document.createElement("canvas");
    c.width = 1200;
    c.height = 800;
    const cx = c.getContext("2d");
    let seed = 521;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    if (cx) {
      for (let i = 0; i < 360; i++) {
        const x = random() * 1200,
          y = random() * 800,
          r = 0.4 + random() * 1.3;
        cx.beginPath();
        cx.arc(x, y, r, 0, 2 * Math.PI);
        cx.fillStyle = `rgba(224,239,255,${0.35 + random() * 0.6})`;
        cx.fill();
      }
      stars.style.backgroundImage = `url(${c.toDataURL()})`;
    }
    const labels = [];
    for (const item of D.sky.constellations) {
      const b = document.createElement("span");
      b.className = "gw-sky-label";
      b.textContent = item.name;
      b.hidden = true;
      root.querySelector("#gw-sky-labels").append(b);
      labels.push({ item, b });
    }
    const ancientLabels = D.pangaea.map((item) => {
      const b = document.createElement("span");
      b.className = "gw-sky-label gw-ancient-label";
      b.textContent = item.name;
      b.hidden = true;
      root.querySelector("#gw-sky-labels").append(b);
      return { item, b };
    });
    $("cities").innerHTML = D.population.cities
      .map(
        (city) =>
          `<button type="button" data-pop-city="${city.id}">${esc(city.name)}</button>`,
      )
      .join("");
    $("cities").addEventListener("click", (e) => {
      const city = D.population.cities.find(
        (c) => c.id === e.target.closest("[data-pop-city]")?.dataset.popCity,
      );
      if (city) cityInfo(city);
    });
    $("sources").innerHTML = D.sources
      .map(
        (s) =>
          `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}（需联网）↗</a>`,
      )
      .join(" · ");
    $("rain-legend").innerHTML = [
      ["少于 250", "#ddbd7d"],
      ["250—500", "#e6da78"],
      ["500—1000", "#9bca8b"],
      ["1000—2000", "#4faebb"],
      ["2000—3000", "#507cc0"],
      ["3000 以上", "#9668bd"],
      ["缺测", "#d9e0e2"],
    ]
      .map(
        ([label, color]) =>
          `<span><i style="background:${color}"></i>${label}</span>`,
      )
      .join("");
    $("plates").innerHTML = D.plates
      .map(
        (p) =>
          `<button type="button" data-plate="${p.id}" style="--plate-color:${p.color}">${esc(p.name)}</button>`,
      )
      .join("");
    $("plates").addEventListener("click", (e) => {
      const p = D.plates.find(
        (p) => p.id === e.target.closest("[data-plate]")?.dataset.plate,
      );
      if (p) {
        prepare();
        focus(p.point, p.name);
        $("detail").textContent = p.note;
      }
    });
    function cityInfo(city) {
      prepare();
      focus(city.point, city.name);
      $("detail").textContent =
        `${city.name}：2025 年城区估计约 ${Math.round(city.people / 10000).toLocaleString("zh-CN")} 万人。`;
    }
    function setMode(next, write = true, prep = true) {
      if (!modes.includes(next)) next = "none";
      if (prep) prepare();
      const old = mode;
      mode = next;
      root.dataset.lab = mode;
      $("layer").value = mode;
      for (const link of relatedLinks)
        link.hidden = !link.dataset.labModes.split(" ").includes(mode);
      $("cities").hidden = mode !== "population";
      $("plates").hidden = mode !== "plates";
      $("rain-legend").hidden = mode !== "rain";
      $("rain-unit").hidden = mode !== "rain";
      $("note").textContent =
        mode === "population"
          ? D.population.note
          : mode === "plates"
            ? D.plateNote
            : mode === "pangaea"
              ? D.ancientNote
              : mode === "rain"
                ? D.rain.note
                : mode === "sky"
                  ? D.sky.note
                  : ["summer", "winter", "typhoon"].includes(mode)
                    ? D.weather.note
                    : "选一个图层，带着新问题看地球。";
      $("detail").textContent =
        mode === "rain"
          ? `多年平均时段：${D.rain.period}。`
          : mode === "sky"
            ? "金色是黄道，浅蓝色是天赤道。"
            : "";
      if ((old === "pangaea") !== (mode === "pangaea"))
        ancientChanged(mode === "pangaea");
      attachSky(mode === "sky");
      repaint();
      render();
      if (mode === "pangaea") focus([10, 5], "联合古陆粗略拼图");
      if (write) {
        const url = new URL(location.href);
        if (mode === "none") url.searchParams.delete("lab");
        else url.searchParams.set("lab", mode);
        try {
          history.replaceState(null, "", url);
        } catch {}
      }
    }
    $("layer").addEventListener("change", () => setMode($("layer").value));
    $("ancient").addEventListener("click", () =>
      setMode(mode === "pangaea" ? "plates" : "pangaea"),
    );
    root.querySelector("#gw-stars-toggle").addEventListener("change", () => {
      root.dataset.stars = String(
        root.querySelector("#gw-stars-toggle").checked,
      );
    });
    root.dataset.stars = "true";
    function path(ctx, ring, px) {
      ctx.beginPath();
      ring.forEach((p, i) => {
        const [x, y] = px(p);
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      });
      ctx.closePath();
    }
    function arrow(ctx, points, px, color, dashed) {
      const p = points.map(px);
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 9;
      ctx.setLineDash(dashed ? [22, 13] : []);
      ctx.beginPath();
      p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
      ctx.setLineDash([]);
      for (let i = 1; i < p.length; i++) {
        const [x, y] = p[i],
          [a, b] = p[i - 1],
          angle = Math.atan2(y - b, x - a);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
          x - 24 * Math.cos(angle - 0.55),
          y - 24 * Math.sin(angle - 0.55),
        );
        ctx.lineTo(
          x - 24 * Math.cos(angle + 0.55),
          y - 24 * Math.sin(angle + 0.55),
        );
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    function paint(ctx, px) {
      const width = ctx.canvas.width,
        height = ctx.canvas.height;
      if (mode === "pangaea") {
        ctx.fillStyle = "#357b9b";
        ctx.fillRect(0, 0, width, height);
        for (const p of D.pangaea) {
          path(ctx, p.ring, px);
          ctx.fillStyle = p.color;
          ctx.fill();
          ctx.strokeStyle = "#fff5d6";
          ctx.lineWidth = 4;
          ctx.stroke();
        }
      } else if (mode === "plates") {
        for (const p of D.plates)
          for (const ring of p.rings) {
            path(ctx, ring, px);
            ctx.save();
            ctx.globalAlpha = 0.42;
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.restore();
            ctx.strokeStyle = "#7d3a38";
            ctx.lineWidth = 4;
            ctx.stroke();
          }
      } else if (mode === "rain") {
        ctx.save();
        ctx.globalAlpha = 0.85;
        for (let y = 0; y < D.rain.height; y++)
          for (let x = 0; x < D.rain.width; x++) {
            ctx.fillStyle = rainColor(D.rain.mm[y * D.rain.width + x]);
            ctx.fillRect(
              (x * width) / 72,
              (y * height) / 36,
              width / 72 + 0.5,
              height / 36 + 0.5,
            );
          }
        ctx.restore();
      } else if (mode === "summer" || mode === "winter")
        for (const a of D.weather.monsoons.filter((a) => a.season === mode))
          arrow(
            ctx,
            a.points,
            px,
            mode === "summer" ? "#a33c22" : "#6740a0",
            true,
          );
      else if (mode === "typhoon")
        arrow(ctx, D.weather.typhoon.points, px, "#b02c65", false);
    }
    function position() {
      for (const { city, b } of dots) {
        const p = mode === "population" ? project(city.point) : null;
        b.hidden = !p?.visible;
        if (p?.visible) {
          b.style.left = p.x + "px";
          b.style.top = p.y + "px";
        }
      }
      for (const { item, b } of labels) {
        const p = mode === "sky" ? project(item.point, 1.55) : null;
        b.hidden = !p?.visible;
        if (p?.visible) {
          b.style.left = p.x + "px";
          b.style.top = p.y + "px";
        }
      }
      for (const { item, b } of ancientLabels) {
        const p = mode === "pangaea" ? project(item.point, 1.025) : null;
        b.hidden = !p?.visible;
        if (p?.visible) {
          b.style.left = p.x + "px";
          b.style.top = p.y + "px";
        }
      }
    }
    root.addEventListener("gm-world-tool-change", () => {
      if (mode === "pangaea" && root.dataset.tool !== "browse")
        setMode("plates", true, false);
    });
    const restore = () =>
      setMode(
        new URLSearchParams(location.search).get("lab") || "none",
        false,
        false,
      );
    window.addEventListener("popstate", restore);
    restore();
    return {
      paint,
      position,
      get mode() {
        return mode;
      },
      get ancient() {
        return mode === "pangaea";
      },
      modern() {
        if (mode === "pangaea") setMode("plates", true, false);
      },
    };
  }
  return { populationRadius, rainColor, mount };
})();

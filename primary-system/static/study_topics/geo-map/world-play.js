/* 旅行保存、主动计时和倾斜控制；不在未操作时请求设备权限。 */
window.GMWorldPlay = (() => {
  "use strict";
  const TRIPS = "study_world_trips_v1";
  function cleanTrip(value) {
    const G = window.GMWorld3DGeometry;
    if (
      !value ||
      typeof value.name !== "string" ||
      !value.name.trim() ||
      value.name.length > 30 ||
      !Array.isArray(value.stops) ||
      value.stops.length < 2 ||
      value.stops.length > 20
    )
      return null;
    const stops = [];
    for (const s of value.stops) {
      if (
        !s ||
        typeof s.name !== "string" ||
        !s.name.trim() ||
        s.name.length > 100 ||
        !Array.isArray(s.point) ||
        s.point.length !== 2 ||
        !s.point.every((n) => typeof n === "number" && Number.isFinite(n))
      )
        return null;
      const point = G.parsePoint(...s.point);
      if (!point) return null;
      if (stops.length && G.angle(stops.at(-1).point, point) * 6371 < 1)
        return null;
      stops.push({ name: s.name, point });
    }
    return { name: value.name.trim(), stops };
  }
  function readTrips(raw) {
    try {
      const rows = JSON.parse(raw);
      return Array.isArray(rows)
        ? rows.slice(0, 8).map(cleanTrip).filter(Boolean)
        : [];
    } catch {
      return [];
    }
  }
  function formatTime(ms) {
    const seconds = Math.floor(Math.max(0, ms) / 1000);
    return `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒`;
  }
  function createTimer(now = () => performance.now()) {
    let ids = [],
      found = new Set(),
      elapsed = 0,
      since = null,
      invalid = false;
    const snapshot = () => ({
      ids: ids.slice(),
      count: found.size,
      elapsed: elapsed + (since === null ? 0 : Math.max(0, now() - since)),
      running: since !== null,
      complete: ids.length > 0 && found.size === ids.length,
      invalid,
    });
    const pause = () => {
      if (since !== null) {
        elapsed += Math.max(0, now() - since);
        since = null;
      }
    };
    return {
      snapshot,
      pause,
      start(targets) {
        ids = [...new Set(targets)];
        found.clear();
        elapsed = 0;
        invalid = false;
        since = ids.length ? now() : null;
      },
      resume() {
        const s = snapshot();
        if (ids.length && !s.complete && !invalid && since === null)
          since = now();
      },
      answer(id, revealed = false) {
        if (!ids.includes(id) || snapshot().complete || invalid) return;
        if (revealed) {
          pause();
          invalid = true;
          return;
        }
        if (since === null) return;
        found.add(id);
        if (found.size === ids.length) pause();
      },
    };
  }
  function mountTimer({ root, start }) {
    const $ = (id) => root.querySelector("#gw-timer-" + id),
      timer = createTimer();
    let kind = "",
      interval = 0;
    const available = () => !document.hidden && root.dataset.tool === kind;
    function render() {
      const s = timer.snapshot(),
        current = root.dataset.tool;
      $("panel").hidden = !["hunt", "detective"].includes(current);
      const same = kind === current;
      $("start").textContent =
        kind && same ? "重新开始 5 处计时" : "开始 5 处计时";
      $("value").textContent = formatTime(same ? s.elapsed : 0);
      $("count").textContent =
        kind && same
          ? `本轮自己找到 ${s.count}／${s.ids.length} 处`
          : "挑战本玩法的前 5 处";
      const message =
        !kind || !same
          ? "点击开始才计时，旧记录不计入本轮。"
          : s.invalid
            ? "这一轮看过答案，已转为练习。准备好后重新开始计时。"
            : s.complete
              ? `完成啦！你用了 ${formatTime(s.elapsed)}找到这 ${s.ids.length} 处！`
              : s.running
                ? "正在计时，找对后选择下一处。"
                : "计时已暂停，回到地图后可以继续。";
      if ($("status").textContent !== message)
        $("status").textContent = message;
      $("pause").disabled =
        !kind || s.complete || s.invalid || current !== kind || !available();
      $("pause").textContent = s.running ? "暂停计时" : "继续计时";
      clearInterval(interval);
      interval = s.running ? setInterval(render, 500) : 0;
    }
    $("start").addEventListener("click", () => {
      kind = root.dataset.tool;
      const data =
        kind === "hunt"
          ? window.GM_WORLD_TOOLS.missions
          : window.GM_WORLD_DETECTIVE.missions;
      start(kind);
      timer.start(data.slice(0, 5).map((m) => m.id));
      if (!available()) timer.pause();
      render();
    });
    $("pause").addEventListener("click", () => {
      if (timer.snapshot().running) timer.pause();
      else if (available()) timer.resume();
      render();
    });
    root.addEventListener("gm-world-answer", (e) => {
      if (e.detail?.kind === kind) {
        timer.answer(e.detail.id, e.detail.revealed);
        render();
      }
    });
    const refresh = () => {
      if (!available()) timer.pause();
      render();
    };
    root.addEventListener("gm-world-tool-change", refresh);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("pagehide", (e) => {
      timer.pause();
      clearInterval(interval);
      if (!e.persisted) {
        document.removeEventListener("visibilitychange", refresh);
      }
    });
    window.addEventListener("pageshow", render);
    render();
    return { snapshot: timer.snapshot };
  }
  function tiltDelta(beta, gamma, base, angle = 0) {
    if (
      ![beta, gamma, ...base, angle].every(
        (n) => typeof n === "number" && Number.isFinite(n),
      )
    )
      return null;
    const x = Math.max(-35, Math.min(35, gamma - base[1])),
      y = Math.max(-35, Math.min(35, beta - base[0])),
      a = (angle * Math.PI) / 180;
    return [
      x * Math.cos(a) + y * Math.sin(a),
      y * Math.cos(a) - x * Math.sin(a),
    ];
  }
  function mountGyro({ root, move, prepare }) {
    const button = root.querySelector("#gw-gyro"),
      status = root.querySelector("#gw-gyro-status");
    let enabled = false,
      pending = false,
      base = null,
      frame = 0,
      latest = null,
      origin = null,
      epoch = 0,
      timeout = 0,
      inView = true;
    const usable = () =>
      root.dataset.renderer === "webgl" && !document.hidden && inView;
    function stop(message = "倾斜控制已关闭。") {
      epoch++;
      enabled = pending = false;
      base = null;
      latest = null;
      clearTimeout(timeout);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      window.removeEventListener("deviceorientation", onTilt);
      button.setAttribute("aria-pressed", "false");
      button.textContent = "📱 倾斜手机转地球";
      status.textContent = message;
    }
    function onTilt(event) {
      if (!enabled || !usable()) {
        stop();
        return;
      }
      if (
        typeof event.beta !== "number" ||
        typeof event.gamma !== "number" ||
        !Number.isFinite(event.beta) ||
        !Number.isFinite(event.gamma)
      )
        return;
      if (!base) {
        base = [event.beta, event.gamma];
        clearTimeout(timeout);
        status.textContent = "已校准，轻轻倾斜手机；再点按钮可关闭。";
      }
      latest = tiltDelta(
        event.beta,
        event.gamma,
        base,
        window.screen?.orientation?.angle || 0,
      );
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          if (enabled && latest) move(latest, origin);
        });
    }
    button.addEventListener("click", async () => {
      if (enabled) {
        stop();
        return;
      }
      if (!window.isSecureContext) {
        stop("当前连接不支持倾斜控制，请使用 HTTPS；仍可拖动地球。");
        return;
      }
      root
        .querySelector("#gw-viewport")
        .scrollIntoView({ block: "center", behavior: "instant" });
      inView = true;
      if (!window.DeviceOrientationEvent || !usable()) {
        stop("当前设备暂不能使用倾斜控制，仍可拖动地球。");
        return;
      }
      const token = ++epoch;
      pending = true;
      button.disabled = true;
      try {
        const permission =
          typeof DeviceOrientationEvent.requestPermission === "function"
            ? await DeviceOrientationEvent.requestPermission()
            : "granted";
        if (token !== epoch || !usable()) return;
        if (permission !== "granted") {
          stop("没有获得倾斜权限，仍可拖动地球。");
          return;
        }
        pending = false;
        origin = prepare();
        enabled = true;
        base = null;
        button.setAttribute("aria-pressed", "true");
        button.textContent = "关闭倾斜控制";
        status.textContent = "请稳稳拿住手机，等待校准。";
        window.addEventListener("deviceorientation", onTilt);
        timeout = setTimeout(() => {
          if (enabled && !base) stop("没有收到倾斜数据，仍可拖动地球。");
        }, 5000);
      } catch {
        stop("倾斜权限未能开启，仍可拖动地球。");
      } finally {
        pending = false;
        button.disabled = false;
      }
    });
    const refresh = () => {
      if (!usable()) stop();
    };
    document.addEventListener("visibilitychange", refresh);
    root.addEventListener("gm-world-renderer-change", refresh);
    for (const e of [
      "gm-world-manual-camera",
      "gm-world-free-view",
      "gm-world-selection",
      "gm-world-tool-change",
    ])
      root.addEventListener(e, () => {
        if (enabled || pending) stop();
      });
    window.screen?.orientation?.addEventListener("change", () =>
      stop("屏幕方向改变，请重新开启校准。"),
    );
    window.addEventListener("pagehide", (e) => {
      stop();
      if (!e.persisted) {
        document.removeEventListener("visibilitychange", refresh);
      }
    });
    return { stop };
  }
  return {
    TRIPS,
    cleanTrip,
    readTrips,
    formatTime,
    createTimer,
    mountTimer,
    tiltDelta,
    mountGyro,
  };
})();

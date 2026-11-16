/* 本地详细地形按视口读取；缓存、任务去重和精确采样独立于 WebGL。 */
window.GMChinaTerrainStream = (() => {
  "use strict";
  const pendingScripts = new Map();
  const scriptBase =
    typeof document === "undefined"
      ? null
      : new URL(".", document.currentScript.src);
  function receive(id, payload) {
    pendingScripts.get(id)?.resolve(payload);
  }
  function loadScript(id, item, signal) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      let received = false,
        settled = false,
        timer;
      const entry = { resolve: (data) => finish(null, data) };
      const abort = () => finish(new Error("地形读取已取消"));
      const finish = (error, data) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        script.remove();
        signal?.removeEventListener("abort", abort);
        if (pendingScripts.get(id) === entry) pendingScripts.delete(id);
        if (error) reject(error);
        else {
          received = true;
          resolve(data);
        }
      };
      if (signal?.aborted) {
        abort();
        return;
      }
      pendingScripts.set(id, entry);
      signal?.addEventListener("abort", abort, { once: true });
      timer = setTimeout(() => finish(new Error("地形读取超时")), 15000);
      script.src = new URL(
        item.file + "?v=" + item.sha256.slice(0, 12),
        scriptBase,
      ).href;
      script.onerror = () => finish(new Error("地形暂时无法读取"));
      script.onload = () => {
        if (!received) finish(new Error("地形内容不完整"));
      };
      document.head.append(script);
    });
  }
  function create({
    index,
    load = loadScript,
    changed = () => {},
    status = () => {},
    validate = () => {},
    maxCache = 24,
    concurrency = 3,
  }) {
    const cache = new Map(),
      jobs = new Map(),
      pinned = new Map(),
      failed = new Set(),
      waiters = new Set();
    let visible = new Set(),
      active = new Set(),
      disposed = false,
      timer = 0,
      stamp = 0;
    const report = () =>
      status({
        cached: cache.size,
        active: active.size,
        pending: jobs.size,
        failed: failed.size,
      });
    function flush() {
      if (disposed) return;
      clearTimeout(timer);
      timer = 0;
      const next = new Set(
        [...visible, ...pinned.keys()].filter((id) => cache.has(id)),
      );
      const delta = [...new Set([...active, ...next])].filter(
        (id) => active.has(id) !== next.has(id),
      );
      active = next;
      if (delta.length)
        changed(
          new Set(delta.flatMap((id) => Object.keys(index.tiles[id].coarse))),
        );
      const free = [...cache]
        .filter(([id]) => !active.has(id) && !pinned.has(id))
        .sort((a, b) => a[1].used - b[1].used);
      while (cache.size > maxCache && free.length)
        cache.delete(free.shift()[0]);
      report();
    }
    const schedule = () => {
      if (disposed) return;
      clearTimeout(timer);
      timer = setTimeout(flush, 100);
    };
    function notify() {
      for (const waiter of [...waiters]) {
        const bad = waiter.ids.find((id) => failed.has(id));
        if (bad) {
          waiters.delete(waiter);
          waiter.reject(new Error("这里的地形暂时没读到"));
        } else if (waiter.ids.every((id) => cache.has(id))) {
          waiters.delete(waiter);
          waiter.resolve();
        }
      }
    }
    function pump() {
      if (disposed) return;
      const wanted = [...new Set([...pinned.keys(), ...visible])];
      for (const id of wanted) {
        if (jobs.size >= concurrency) break;
        if (cache.has(id) || jobs.has(id) || failed.has(id)) continue;
        const controller = new AbortController(),
          entry = { controller };
        const job = Promise.resolve().then(() =>
          load(id, index.tiles[id], controller.signal),
        );
        jobs.set(id, entry);
        job
          .then((payload) => {
            if (disposed || controller.signal.aborted) return;
            if (
              payload.key !== id ||
              payload.version !== 1 ||
              payload.sourceSha256 !== index.sourceSha256 ||
              Object.keys(payload.provinces).sort().join() !==
                Object.keys(index.tiles[id].coarse).sort().join()
            )
              throw new Error("地形版本不匹配");
            validate(payload);
            cache.set(id, { payload, used: ++stamp });
          })
          .catch(() => {
            if (!disposed && !controller.signal.aborted) failed.add(id);
          })
          .finally(() => {
            if (jobs.get(id) === entry) jobs.delete(id);
            if (disposed) return;
            notify();
            schedule();
            pump();
            report();
          });
      }
      report();
    }
    function keysFor(points) {
      return Object.keys(index.tiles).filter((id) => {
        const [w, s, e, n] = index.tiles[id].bounds;
        return points.some(
          (p) =>
            p[0] >= w - 1e-7 &&
            p[0] <= e + 1e-7 &&
            p[1] >= s - 1e-7 &&
            p[1] <= n + 1e-7,
        );
      });
    }
    async function withPoints(points, action) {
      if (disposed) throw new Error("地形读取已结束");
      const ids = keysFor(points);
      for (const id of ids) {
        pinned.set(id, (pinned.get(id) || 0) + 1);
        failed.delete(id);
        if (cache.has(id)) cache.get(id).used = ++stamp;
      }
      try {
        if (!ids.every((id) => cache.has(id)))
          await new Promise((resolve, reject) => {
            waiters.add({ ids, resolve, reject });
            pump();
          });
        flush();
        return await action();
      } finally {
        for (const id of ids) {
          const count = pinned.get(id) - 1;
          if (count) pinned.set(id, count);
          else pinned.delete(id);
        }
        schedule();
        pump();
      }
    }
    function records(code) {
      return Object.entries(index.tiles).flatMap(([id, item]) => {
        const record = (
          active.has(id) ? cache.get(id)?.payload.provinces : item.coarse
        )?.[code];
        return record ? [record] : [];
      });
    }
    return {
      records,
      parts: () =>
        Object.keys(index.tiles).flatMap((id) =>
          Object.entries(
            active.has(id)
              ? cache.get(id).payload.provinces
              : index.tiles[id].coarse,
          ).map(([code, record]) => ({ code, record })),
        ),
      setVisible(ids) {
        visible = new Set(ids.filter((id) => index.tiles[id]));
        for (const [id, job] of jobs)
          if (!visible.has(id) && !pinned.has(id)) job.controller.abort();
        for (const id of visible)
          if (cache.has(id)) cache.get(id).used = ++stamp;
        schedule();
        pump();
      },
      withPoints,
      withLine(a, b, action) {
        const count = Math.max(
          1,
          Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.2),
        );
        return withPoints(
          Array.from({ length: count + 1 }, (_, i) =>
            a.map((n, j) => n + ((b[j] - n) * i) / count),
          ),
          action,
        );
      },
      retry() {
        failed.clear();
        pump();
      },
      snapshot: () => ({
        cached: [...cache.keys()],
        active: [...active],
        pending: [...jobs.keys()],
        failed: [...failed],
      }),
      dispose() {
        disposed = true;
        clearTimeout(timer);
        for (const job of jobs.values()) job.controller.abort();
        for (const w of waiters) w.reject(new Error("地形读取已结束"));
        waiters.clear();
        cache.clear();
      },
    };
  }
  function visibleTiles(index, project, width, height, limit = 12) {
    const rows = [];
    for (const [id, tile] of Object.entries(index.tiles)) {
      const [w, s, e, n] = tile.bounds,
        flat = [
          [w, s],
          [w, n],
          [e, s],
          [e, n],
        ].map((p) => project(p, 0));
      const corners = [
        ...flat,
        ...[
          [w, s],
          [w, n],
          [e, s],
          [e, n],
        ].map((p) => project(p, 9000)),
      ];
      const xs = corners.map((p) => p.x),
        ys = corners.map((p) => p.y);
      if (
        Math.max(...xs) < -1.1 ||
        Math.min(...xs) > 1.1 ||
        Math.max(...ys) < -1.1 ||
        Math.min(...ys) > 1.1
      )
        continue;
      const fw = flat.map((p) => p.x),
        fh = flat.map((p) => p.y);
      const pixels = Math.max(
        ((Math.max(...fw) - Math.min(...fw)) * width) / 2,
        ((Math.max(...fh) - Math.min(...fh)) * height) / 2,
      );
      if (pixels < 110) continue;
      rows.push({
        id,
        distance:
          ((Math.max(...xs) + Math.min(...xs)) / 2) ** 2 +
          ((Math.max(...ys) + Math.min(...ys)) / 2) ** 2,
      });
    }
    return rows
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)
      .map((r) => r.id);
  }
  return { create, receive, visibleTiles };
})();

/* 地图教学：纯判题与本机进度可独立测试，界面不依赖持续动画。 */
window.GMChinaLearning = (() => {
  'use strict';
  const KEY = 'study_china_3d_learning_v1';
  function inside(point, ring) {
    let yes = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [x, y] = ring[i],
        [a, b] = ring[j];
      if (y > point[1] !== b > point[1] && point[0] < ((a - x) * (point[1] - y)) / (b - y) + x) yes = !yes;
    }
    return yes;
  }
  function lineDistance(point, line) {
    const kx = 111.32 * Math.cos((point[1] * Math.PI) / 180),
      ky = 111.32;
    let closest = Infinity;
    for (let i = 1; i < line.length; i++) {
      const a = [(line[i - 1][0] - point[0]) * kx, (line[i - 1][1] - point[1]) * ky],
        b = [(line[i][0] - point[0]) * kx, (line[i][1] - point[1]) * ky];
      const dx = b[0] - a[0],
        dy = b[1] - a[1],
        t = Math.max(0, Math.min(1, -(a[0] * dx + a[1] * dy) / (dx * dx + dy * dy || 1)));
      closest = Math.min(closest, Math.hypot(a[0] + t * dx, a[1] + t * dy));
    }
    return closest;
  }
  function classifyStep(point, meters, data = window.GM_CHINA_LEARNING) {
    if (
      !Array.isArray(point) ||
      point.length !== 2 ||
      !point.every(Number.isFinite) ||
      point[0] < 73 ||
      point[0] > 136 ||
      point[1] < 18 ||
      point[1] > 54 ||
      !Number.isFinite(meters)
    )
      return null;
    if (
      Math.min(lineDistance(point, data.boundary12), lineDistance(point, data.boundary23)) < data.transitionKm
    )
      return 0;
    if (inside(point, data.firstStep)) return 1;
    const line = data.boundary23;
    for (let i = 1; i < line.length; i++)
      if (point[1] <= line[i - 1][1] && point[1] >= line[i][1]) {
        const t = (point[1] - line[i][1]) / (line[i - 1][1] - line[i][1]);
        return point[0] < line[i][0] + t * (line[i - 1][0] - line[i][0]) ? 2 : 3;
      }
    return 3;
  }
  function readProgress(raw, data = window.GM_CHINA_LEARNING) {
    let value = {};
    try {
      value = JSON.parse(raw) || {};
    } catch {}
    const clean = (key, valid) =>
      new Set(Array.isArray(value[key]) ? value[key].filter((v) => valid.includes(v)) : []);
    return {
      steps: clean('steps', [1, 2, 3]),
      questions: clean(
        'questions',
        data.questions.map((q) => q.id),
      ),
      puzzle: value.puzzle === true,
    };
  }
  function createSteps(initial = new Set(), data = window.GM_CHINA_LEARNING) {
    const found = new Set([...initial].filter((n) => [1, 2, 3].includes(n))),
      revealed = new Set();
    let active = 1;
    return {
      state: () => ({ active, found: new Set(found), revealed: revealed.has(active) }),
      select: (no) => {
        if ([1, 2, 3].includes(no)) active = no;
      },
      reveal: () => revealed.add(active),
      retry: () => revealed.delete(active),
      guess(point, meters) {
        if (revealed.has(active)) return { result: 'revealed' };
        const step = classifyStep(point, meters, data);
        if (step === null) return { result: 'empty' };
        if (step === 0) return { result: 'transition' };
        if (step === active) {
          found.add(active);
          return { result: 'correct', step };
        }
        return { result: 'wrong', step };
      },
    };
  }
  function createPuzzle(data = window.GM_CHINA_LEARNING.puzzle) {
    const statuses = new Map(data.pieces.map((p) => [p.id, 'asking']));
    const state = () => ({
      statuses: new Map(statuses),
      placed: [...statuses.values()].filter((s) => s === 'placed').length,
      complete: [...statuses.values()].every((s) => s === 'placed'),
    });
    function place(id, correct) {
      if (statuses.get(id) !== 'asking') return 'locked';
      if (correct) {
        statuses.set(id, 'placed');
        return 'correct';
      }
      return 'wrong';
    }
    return {
      state,
      drop: (id, dx, dy) =>
        place(id, Number.isFinite(dx) && Number.isFinite(dy) && Math.hypot(dx, dy) <= data.snapPixels),
      slot: (id, target) => place(id, id === target),
      reveal() {
        for (const id of statuses.keys()) if (statuses.get(id) !== 'placed') statuses.set(id, 'revealed');
      },
      restart() {
        for (const id of statuses.keys()) statuses.set(id, 'asking');
      },
    };
  }
  function createQuestions(initial = new Set(), data = window.GM_CHINA_LEARNING.questions) {
    const found = new Set([...initial].filter((id) => data.some((q) => q.id === id))),
      revealed = new Set();
    let current = data[0],
      hints = 0,
      solved = false;
    return {
      state: () => ({ current, hints, solved, revealed: revealed.has(current.id), found: new Set(found) }),
      select(id) {
        const q = data.find((q) => q.id === id);
        if (q) {
          current = q;
          hints = 0;
          solved = false;
        }
      },
      hint() {
        hints = Math.min(2, hints + 1);
      },
      reveal() {
        revealed.add(current.id);
      },
      retry() {
        revealed.delete(current.id);
        hints = 0;
        solved = false;
      },
      answer(index) {
        if (solved || revealed.has(current.id)) return 'locked';
        if (!Number.isInteger(index) || index < 0 || index >= current.options.length) return 'empty';
        if (index === current.answer) {
          solved = true;
          found.add(current.id);
          return 'correct';
        }
        return 'wrong';
      },
    };
  }
  function mount({ root, prepare, observe, sample, available, changed, puzzleMissing, puzzleComplete }) {
    const D = window.GM_CHINA_LEARNING,
      esc = window.GMShared.esc,
      $ = (id) => root.querySelector('#gm3-' + id);
    let saved;
    try {
      saved = readProgress(localStorage.getItem(KEY));
    } catch {
      saved = readProgress(null);
      $('learn-storage').textContent = '记录暂存本页，浏览器无法保存到下次。';
    }
    const steps = createSteps(saved.steps),
      puzzle = createPuzzle(),
      questions = createQuestions(saved.questions);
    let sampleVersion = 0;
    let mode = 'browse',
      selectedPiece = D.puzzle.pieces[0].id,
      drag = null;
    const projection = (p) => [50 + ((p[0] - 90) / 34) * 880, 45 + ((36 - p[1]) / 13) * 280];
    const pathFor = (paths) =>
      paths
        .map((path) =>
          path
            .map((p, i) => {
              const [x, y] = projection(p);
              return (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1);
            })
            .join(' '),
        )
        .join(' ');
    const shapes = new Map(
      D.puzzle.pieces.map((p, index) => {
        const paths = window.GM_CHINA_HYDROLOGY_GEO.tributaries[p.branch].paths,
          points = paths.flat().map(projection),
          xs = points.map((p) => p[0]),
          ys = points.map((p) => p[1]);
        const minX = Math.min(...xs),
          maxX = Math.max(...xs),
          minY = Math.min(...ys),
          maxY = Math.max(...ys),
          cx = (minX + maxX) / 2,
          cy = (minY + maxY) / 2;
        return [
          p.id,
          {
            path: pathFor(paths),
            cx,
            cy,
            minX,
            maxX,
            minY,
            maxY,
            dx: 130 + index * 235 - cx,
            dy: 475 - cy,
            letter: 'ABCD'[index],
          },
        ];
      }),
    );
    function persist() {
      try {
        localStorage.setItem(
          KEY,
          JSON.stringify({ steps: [...saved.steps], questions: [...saved.questions], puzzle: saved.puzzle }),
        );
      } catch {
        $('learn-storage').textContent = '本次已记下，浏览器未能保存到下次。';
      }
    }
    function progress() {
      $('learn-progress').textContent =
        `阶梯 ${saved.steps.size}／3 · 拼图 ${saved.puzzle ? '已拼好过' : '待挑战'} · 观察题 ${saved.questions.size}／${D.questions.length}`;
    }
    function renderSteps() {
      const state = steps.state();
      $('step-lights').innerHTML = D.steps
        .map(
          (s) =>
            `<button type="button" data-step="${s.no}" aria-pressed="${state.active === s.no}" class="${state.found.has(s.no) ? 'is-found' : ''}">${state.found.has(s.no) ? '💡' : '○'} ${esc(s.name)}</button>`,
        )
        .join('');
      $('step-goal').textContent =
        '请在地形上点出' + D.steps.find((s) => s.no === state.active).name + '的一处位置。';
      $('learn-map-clue').textContent = $('step-goal').textContent;
      $('step-inline').innerHTML = $('step-lights').innerHTML;
      $('step-reveal').disabled = state.revealed;
    }
    function renderPuzzle() {
      const state = puzzle.state(),
        svg = $('puzzle-board');
      const main = pathFor(window.GM_CHINA_RIVERS.rivers.f20.paths);
      svg.innerHTML =
        `<rect x="0" y="0" width="980" height="620" rx="18" fill="#eef9fc"/><text x="32" y="28" class="puzzle-heading">长江水系 · 把支流移回虚线位置</text><path d="${main}" class="puzzle-main"/><path d="M20 350H960" class="puzzle-divider"/><text x="30" y="380" class="puzzle-caption">待拼区</text>` +
        D.puzzle.pieces
          .map((p) => {
            const s = shapes.get(p.id);
            return `<g data-slot="${p.id}" class="puzzle-slot"><path d="${s.path}"/><circle cx="${s.cx}" cy="${s.cy}" r="14"/><text x="${s.cx}" y="${s.cy + 5}">${s.letter}</text></g>`;
          })
          .join('') +
        D.puzzle.pieces
          .map((p) => {
            const s = shapes.get(p.id),
              status = state.statuses.get(p.id),
              on = status !== 'asking';
            return `<g data-piece="${p.id}" class="puzzle-piece ${status}" transform="translate(${on ? 0 : s.dx} ${on ? 0 : s.dy})"><rect x="${s.minX - 12}" y="${s.minY - 28}" width="${s.maxX - s.minX + 24}" height="${s.maxY - s.minY + 44}" rx="10"/><path d="${s.path}"/><text x="${s.cx}" y="${s.minY - 8}">${esc(p.name)}${status === 'placed' ? ' ✓' : status === 'revealed' ? '（参考）' : ''}</text></g>`;
          })
          .join('');
      $('puzzle-choice').innerHTML = D.puzzle.pieces
        .map(
          (p) =>
            `<button type="button" data-piece-choice="${p.id}" aria-pressed="${selectedPiece === p.id}" ${state.statuses.get(p.id) !== 'asking' ? 'disabled' : ''}>${esc(p.name)}</button>`,
        )
        .join('');
      $('puzzle-slots').innerHTML = D.puzzle.pieces
        .map(
          (p) => `<button type="button" data-slot-choice="${p.id}">位置 ${shapes.get(p.id).letter}</button>`,
        )
        .join('');
      $('puzzle-count').textContent =
        `已独立拼上 ${state.placed}／4${saved.puzzle ? ' · 你以前拼好过这幅水系' : ''}`;
      root.dataset.puzzlePlaced = String(state.placed);
      root.dataset.puzzleComplete = String(state.complete);
      $('puzzle-reveal').disabled = ![...state.statuses.values()].includes('asking');
      if (mode === 'puzzle') {
        puzzleMissing(
          D.puzzle.pieces.filter((p) => state.statuses.get(p.id) !== 'placed').map((p) => p.branch),
        );
        puzzleComplete(state.complete);
      }
    }
    function renderQuestions() {
      const s = questions.state();
      $('relation-list').innerHTML = D.questions
        .map(
          (q) =>
            `<button type="button" data-relation="${q.id}" aria-pressed="${q.id === s.current.id}">${saved.questions.has(q.id) ? '✓ ' : ''}${esc(q.title)}</button>`,
        )
        .join('');
      $('relation-title').textContent = s.current.title;
      $('relation-prompt').textContent = s.current.prompt;
      $('learn-map-clue').textContent = s.current.prompt;
      $('relation-options').innerHTML = s.current.options
        .map(
          (o, i) =>
            `<button type="button" data-relation-answer="${i}" ${s.solved || s.revealed ? 'disabled' : ''}>${esc(o)}</button>`,
        )
        .join('');
      $('relation-hints').innerHTML = s.current.hints
        .slice(0, s.hints)
        .map((h) => `<li>${esc(h)}</li>`)
        .join('');
      $('relation-hint').disabled = s.hints >= 2 || s.solved || s.revealed;
      $('relation-reveal').disabled = s.solved || s.revealed;
      $('relation-sources').innerHTML = s.current.sources
        .map((url) => `<a href="${esc(url)}" target="_blank" rel="noopener">资料出处（需联网）↗</a>`)
        .join(' · ');
    }
    function render() {
      root.dataset.learningMode = mode;
      root
        .querySelectorAll('[data-learning-mode]')
        .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.learningMode === mode)));
      $('step-panel').hidden = mode !== 'steps';
      $('puzzle-panel').hidden = mode !== 'puzzle';
      $('relation-panel').hidden = mode !== 'questions';
      $('learn-hud').hidden = !['steps', 'questions'].includes(mode);
      $('step-inline').hidden = mode !== 'steps';
      $('learn-back').href = mode === 'questions' ? '#gm3-relation-options' : '#gm3-step-panel';
      $('learn-back').textContent = mode === 'questions' ? '观察好了，去选解释 ↓' : '提示与说明 ↓';
      if (mode === 'steps') renderSteps();
      if (mode === 'puzzle') renderPuzzle();
      if (mode === 'questions') renderQuestions();
      progress();
      changed();
    }
    function setMode(next) {
      if (!['browse', 'steps', 'puzzle', 'questions'].includes(next)) return;
      sampleVersion++;
      drag = null;
      if (next !== 'browse') prepare();
      mode = next;
      puzzleMissing([]);
      puzzleComplete(false);
      render();
      if (mode === 'puzzle') observe({ point: [107, 30.5], zoom: 1.5, river: 'f20' });
      if (mode === 'puzzle') $('puzzle-board').scrollIntoView({ block: 'center', behavior: 'instant' });
      if (mode === 'questions') observe(questions.state().current);
      if (mode === 'steps') observe({ point: [104, 35], zoom: 1 });
      const url = new URL(location.href);
      if (mode === 'browse') url.searchParams.delete('learn');
      else url.searchParams.set('learn', mode);
      try {
        history.replaceState(null, '', url);
      } catch {}
    }
    function inspect(point, meters) {
      if (mode !== 'steps') return false;
      const result = steps.guess(point, meters),
        s = steps.state();
      const text = {
        empty: '请点陆地，或填写有地形资料的位置。',
        transition: '这里靠近阶梯示意分界，是过渡地带。这次不判对错，换个更明确的位置试试。',
        revealed: '你刚看过参考位置，本次不计完成；点「重新挑战这一阶」再试。',
      };
      if (result.result === 'correct') {
        saved.steps = s.found;
        persist();
        $('step-feedback').textContent =
          `亮灯啦！这里的网格海拔约 ${Math.round(meters / 10) * 10} 米，按位置大致属于${D.steps.find((s) => s.no === result.step).name}。`;
      } else if (result.result === 'wrong')
        $('step-feedback').textContent =
          `这里的网格海拔约 ${Math.round(meters / 10) * 10} 米，按位置大致属于${D.steps.find((s) => s.no === result.step).name}。阶梯看大片区域，不能只看一个海拔数字。`;
      else $('step-feedback').textContent = text[result.result];
      renderSteps();
      $('learn-map-clue').textContent = $('step-goal').textContent + ' ' + $('step-feedback').textContent;
      progress();
      return true;
    }
    function finishDrop(id, result) {
      if (result === 'correct') {
        $('puzzle-feedback').textContent = '接上啦！' + D.puzzle.pieces.find((p) => p.id === id).text;
        if (puzzle.state().complete) {
          saved.puzzle = true;
          persist();
          $('puzzle-feedback').textContent = '四条支流都归位啦！主图中的长江已经高亮。';
        }
      } else if (result === 'wrong')
        $('puzzle-feedback').textContent = '还没对齐，比较一下轮廓，以及它在主干哪一侧。';
      renderPuzzle();
      progress();
    }
    $('puzzle-board').addEventListener('pointerdown', (event) => {
      const node = event.target.closest('[data-piece]');
      if (!node || puzzle.state().statuses.get(node.dataset.piece) !== 'asking') return;
      event.preventDefault();
      const start = new DOMPoint(event.clientX, event.clientY).matrixTransform(
        $('puzzle-board').getScreenCTM().inverse(),
      );
      drag = {
        id: node.dataset.piece,
        node,
        pointer: event.pointerId,
        start,
        dx: shapes.get(node.dataset.piece).dx,
        dy: shapes.get(node.dataset.piece).dy,
      };
      node.setPointerCapture(event.pointerId);
    });
    $('puzzle-board').addEventListener('pointermove', (event) => {
      if (!drag || drag.pointer !== event.pointerId) return;
      const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(
        $('puzzle-board').getScreenCTM().inverse(),
      );
      drag.x = drag.dx + p.x - drag.start.x;
      drag.y = drag.dy + p.y - drag.start.y;
      drag.node.setAttribute('transform', `translate(${drag.x} ${drag.y})`);
    });
    $('puzzle-board').addEventListener('pointerup', (event) => {
      if (!drag || drag.pointer !== event.pointerId) return;
      const d = drag;
      drag = null;
      d.node.releasePointerCapture(event.pointerId);
      finishDrop(d.id, puzzle.drop(d.id, d.x ?? d.dx, d.y ?? d.dy));
    });
    $('puzzle-board').addEventListener('pointercancel', () => {
      drag = null;
      renderPuzzle();
    });
    $('puzzle-choice').addEventListener('click', (e) => {
      const b = e.target.closest('[data-piece-choice]');
      if (b) {
        selectedPiece = b.dataset.pieceChoice;
        renderPuzzle();
      }
    });
    $('puzzle-slots').addEventListener('click', (e) => {
      const b = e.target.closest('[data-slot-choice]');
      if (b) finishDrop(selectedPiece, puzzle.slot(selectedPiece, b.dataset.slotChoice));
    });
    $('puzzle-reveal').addEventListener('click', () => {
      puzzle.reveal();
      $('puzzle-feedback').textContent = '已展示参考位置，这次不计完成。点「重新拼」后再自己挑战。';
      renderPuzzle();
    });
    $('puzzle-restart').addEventListener('click', () => {
      puzzle.restart();
      $('puzzle-feedback').textContent = '四条支流又回到待拼区，试试自己把它们接好。';
      renderPuzzle();
    });
    $('puzzle-map').addEventListener('click', () => observe({ point: [107, 30.5], zoom: 1.5, river: 'f20' }));
    root
      .querySelectorAll('[data-learning-mode]')
      .forEach((b) => b.addEventListener('click', () => setMode(b.dataset.learningMode)));
    for (const node of [$('step-lights'), $('step-inline')])
      node.addEventListener('click', (e) => {
        const b = e.target.closest('[data-step]');
        if (b) {
          sampleVersion++;
          steps.select(Number(b.dataset.step));
          $('step-feedback').textContent = '找一处你认为合适的位置，点地形提交。';
          renderSteps();
        }
      });
    $('step-hint').addEventListener('click', () => {
      $('step-feedback').textContent = D.steps.find((s) => s.no === steps.state().active).hint;
    });
    $('step-reveal').addEventListener('click', () => {
      sampleVersion++;
      steps.reveal();
      const step = D.steps.find((s) => s.no === steps.state().active);
      observe({ point: step.example, zoom: 2 });
      $('step-feedback').textContent = '已定位一处参考区域，不计入完成；重新挑战后再自己找。';
      renderSteps();
    });
    $('step-retry').addEventListener('click', () => {
      sampleVersion++;
      steps.retry();
      $('step-feedback').textContent = '再找一处这个阶梯里的位置吧。';
      renderSteps();
    });
    $('step-coordinates').addEventListener('submit', async (e) => {
      e.preventDefault();
      const lon = $('step-lon').value.trim(),
        lat = $('step-lat').value.trim();
      if (!lon || !lat) {
        $('step-feedback').textContent = '经度和纬度都要填好哦。';
        return;
      }
      const p = [Number(lon), Number(lat)], token=++sampleVersion;
      $('step-feedback').textContent='正在看清这里的地形……';
      try {
        const meters=p.every(Number.isFinite)?await sample(p):null;
        if(token===sampleVersion)inspect(p,meters);
      } catch {if(token===sampleVersion)$('step-feedback').textContent='这里的地形暂时没读到，请稍后再提交一次。';}
    });
    $('relation-list').addEventListener('click', (e) => {
      const b = e.target.closest('[data-relation]');
      if (b) {
        questions.select(b.dataset.relation);
        $('relation-feedback').textContent = '先观察地图，再选一个解释。';
        renderQuestions();
        observe(questions.state().current);
      }
    });
    $('relation-options').addEventListener('click', (e) => {
      const b = e.target.closest('[data-relation-answer]');
      if (!b) return;
      const result = questions.answer(Number(b.dataset.relationAnswer)),
        s = questions.state();
      if (result === 'correct') {
        saved.questions = s.found;
        persist();
        $('relation-feedback').textContent = '判断对啦！' + s.current.explanation;
      } else if (result === 'wrong')
        $('relation-feedback').textContent = '再对照河道、高低和省界，试试提示。';
      renderQuestions();
      progress();
    });
    $('relation-hint').addEventListener('click', () => {
      questions.hint();
      renderQuestions();
    });
    $('relation-reveal').addEventListener('click', () => {
      questions.reveal();
      $('relation-feedback').textContent =
        questions.state().current.explanation + ' 已展示答案，本次不计入完成。';
      renderQuestions();
    });
    $('relation-retry').addEventListener('click', () => {
      questions.retry();
      $('relation-feedback').textContent = '重新观察，再自己选一选。';
      renderQuestions();
    });
    $('step-note').textContent = D.stepNote;
    $('puzzle-note').textContent = D.puzzleNote;
    render();
    return {
      open: setMode,
      stop: () => setMode('browse'),
      handlePoint: (point, meters) => (mode === 'steps' ? inspect(point, meters) : mode === 'puzzle'),
      get active() {
        return mode !== 'browse';
      },
      get mode() {
        return mode;
      },
      refresh: render,
    };
  }
  return {
    inside,
    lineDistance,
    classifyStep,
    readProgress,
    createSteps,
    createPuzzle,
    createQuestions,
    mount,
  };
})();

/* 沿用来源笔画，静态图始终可用；描红只保留本页状态。 */
(() => {
  'use strict';
  const root = document.querySelector('[data-hanzi-writing]');
  if (!root) return;
  const get = id => document.getElementById(id);
  const fallback = get('stroke-board'), target = get('hanzi-writer'), status = get('stroke-status');
  const paths = [...fallback.querySelectorAll('[data-stroke]')];
  const animate = get('stroke-animate'), practice = get('stroke-practice'), pause = get('stroke-pause');
  let writer, data, count = 0, mode = 'view', paused = false, revision = 0, round = 0;
  const fullMotion = () => !window.StudyEffects || window.StudyEffects.motion === 'full';
  const message = text => { status.textContent = text; };

  function controls() {
    animate.hidden = !writer;
    animate.disabled = !fullMotion();
    animate.title = fullMotion() ? '' : '已减少动态效果，请用逐笔显示看笔顺';
    practice.hidden = !writer;
    practice.textContent = mode === 'practice' || mode === 'complete' ? '再描一次' : '开始描红';
    pause.hidden = !['animate', 'practice'].includes(mode);
    pause.textContent = paused ? '继续' : '暂停';
    pause.setAttribute('aria-pressed', String(paused));
    target.dataset.paused = String(paused);
  }

  function resetView() {
    revision += 1;
    window.StudyEffects?.stop();
    writer?.cancelQuiz();
    writer?.pauseAnimation();
    mode = 'view'; paused = false;
    target.hidden = true; fallback.removeAttribute('hidden');
    controls();
  }

  get('stroke-next').addEventListener('click', () => {
    resetView();
    count = count >= paths.length ? 1 : count + 1;
    paths.forEach((path, index) => path.setAttribute('fill', index < count ? '#226c59' : '#e3e9e4'));
    message(`第 ${count}／${paths.length} 笔，沿着深色笔画看一看。`);
  });
  get('stroke-reset').addEventListener('click', () => {
    resetView(); count = 0;
    paths.forEach(path => path.setAttribute('fill', '#b8c4c3'));
    message(`显示全部 ${paths.length} 笔，准备好再开始。`);
  });

  function setPaused(value) {
    if (!['animate', 'practice'].includes(mode) || paused === value) return;
    paused = value;
    if (paused) writer.pauseAnimation(); else writer.resumeAnimation();
    controls();
    message(paused ? '已暂停，准备好后点「继续」。' : mode === 'practice'
      ? `接着描第 ${count + 1}／${paths.length} 笔。` : '跟着笔画慢慢看。');
  }
  pause.addEventListener('click', () => setPaused(!paused));

  async function start(kind) {
    if (!writer || kind === 'animate' && !fullMotion()) return;
    resetView();
    const token = revision;
    count = 0; mode = kind;
    target.hidden = false; fallback.setAttribute('hidden', '');
    controls();
    try {
      // 取消上一轮的绘制任务，仍使用内嵌的同一份数据。
      await writer.setCharacter(data.character);
      if (token !== revision) return;
      if (kind === 'animate') {
        message('跟着笔画慢慢看，也可以随时暂停。');
        const animation = writer.animateCharacter();
        if (paused) writer.pauseAnimation();
        await animation;
        if (token === revision) { mode = 'view'; message('笔顺看完啦，试着自己描一遍吧。'); controls(); }
      } else {
        round += 1;
        message(`从第 1／${paths.length} 笔开始，沿浅色字形描一描。`);
        writer.quiz({
          showHintAfterMisses: false,
          onCorrectStroke(event) {
            if (token !== revision) return;
            count = event.strokeNum + 1;
            message(event.strokesRemaining ? `这一笔写好了！接着描第 ${count + 1}／${paths.length} 笔。` : '每一笔都描好啦！');
          },
          onMistake() {
            if (token === revision) message(`再试试第 ${count + 1} 笔，留意起笔位置和方向。`);
          },
          onComplete() {
            if (token !== revision) return;
            mode = 'complete'; paused = false; controls();
            message(`「${data.character}」描完啦！可以再写一次，也可以看下一个字。`);
            window.StudyEffects?.celebrate({key: `hanzi-${round}`, target: root});
          },
        });
        if (paused) writer.pauseAnimation();
      }
    } catch (error) {
      if (token !== revision) return;
      resetView(); message('描红暂时没准备好，先用逐笔显示看一看。');
    }
  }
  animate.addEventListener('click', () => start('animate'));
  practice.addEventListener('click', () => start('practice'));
  document.addEventListener('study:effects-change', () => {
    if (mode === 'animate' && !fullMotion()) { resetView(); message('已减少动态效果，可以逐笔查看或自己描红。'); }
    controls();
  });
  window.StudyEffects?.watch(target.parentElement, () => setPaused(true));

  const source = get('hanzi-stroke-data');
  if (!source || !window.HanziWriter) return;
  try {
    data = JSON.parse(source.textContent);
    const size = target.parentElement.clientWidth;
    writer = window.HanziWriter.create(target, data.character, {
      width: size, height: size, padding: 28,
      strokeColor: '#226c59', outlineColor: '#e3e9e4', drawingColor: '#e76b49', highlightColor: '#f0ad48',
      strokeAnimationSpeed: 1, delayBetweenStrokes: 320,
      drawingWidth: 14, showCharacter: false, showOutline: true,
      highlightOnComplete: false, strokeFadeDuration: 0, drawingFadeDuration: 0,
      charDataLoader: () => data,
    });
    if (typeof ResizeObserver === 'function') new ResizeObserver(() => {
      const width = target.parentElement.clientWidth;
      writer.updateDimensions({width, height: width, padding: 28});
    }).observe(target.parentElement);
    controls();
  } catch (error) { message('描红暂时没准备好，先用逐笔显示看一看。'); }
})();

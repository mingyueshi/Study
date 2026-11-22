window.GMWorldTimePractice = (() => {
  'use strict';
  const dayName = day => ({'-1': '前一天', 0: '同一天', 1: '后一天'})[day];

  function mount(root, locate) {
    const {convert, offsetLabel} = window.GMTimeOffsets;
    const {cities, timePractice: {offsets, questions}} = window.GM_WORLD_EXPEDITIONS;
    const cityById = new Map(cities.map(city => [city.id, city]));
    const $ = id => root.querySelector('#gw-time-' + id);
    const form = $('form');
    const {clock, day} = form.elements;
    const story = $('story');
    if (root.dataset.timeStoryUrl) {
      story.href = root.dataset.timeStoryUrl;
      story.hidden = false;
    }
    let index = 0;

    function render() {
      const {from, to, clock: given} = questions[index];
      $('question').textContent = `${cityById.get(from).name}（${offsetLabel(offsets[from])}）是 ${given}，同一时刻，${cityById.get(to).name}（${offsetLabel(offsets[to])}）是几点？`;
      $('count').textContent = `第 ${index + 1} 题／共 ${questions.length} 题`;
      for (const [id, city] of [['origin', from], ['destination', to]]) {
        $(id).textContent = cityById.get(city).name;
        $(id).dataset.city = city;
      }
      form.reset();
      clock.disabled = false;
      day.disabled = false;
      $('feedback').textContent = '';
      $('check').disabled = false;
      $('solution').disabled = false;
      $('hint').hidden = true;
      $('hint-toggle').setAttribute('aria-expanded', 'false');
    }

    function finish(revealed) {
      const {from, to, clock: given} = questions[index];
      const via = convert(given, offsets[from], 0);
      const result = convert(given, offsets[from], offsets[to]);
      const correctClock = clock.value === result.clock;
      const correctDay = Number(day.value) === result.day;
      if (!revealed && (!correctClock || !correctDay)) {
        $('feedback').textContent = correctClock ? '钟面算对了。再看看相对出发地有没有跨日。'
          : '再算一次。先换到 UTC，再换到目的地，记得把跨过的午夜算进去。';
        return;
      }
      clock.value = result.clock;
      day.value = String(result.day);
      clock.disabled = true;
      day.disabled = true;
      $('feedback').textContent = `${revealed ? '参考答案' : '答对了'} · ${cityById.get(to).name}是${dayName(result.day)} ${result.clock}。先减去 ${cityById.get(from).name}的 UTC 偏移，得到 UTC ${dayName(via.day)} ${via.clock}，再加上目的地的 UTC 偏移。`;
      $('check').disabled = true;
      $('solution').disabled = true;
    }

    form.addEventListener('submit', event => {
      event.preventDefault();
      finish(false);
    });
    $('solution').addEventListener('click', () => finish(true));
    $('hint-toggle').addEventListener('click', () => {
      $('hint').hidden = !$('hint').hidden;
      $('hint-toggle').setAttribute('aria-expanded', String(!$('hint').hidden));
    });
    $('next').addEventListener('click', () => {
      index = (index + 1) % questions.length;
      render();
      $('question').focus();
    });
    for (const id of ['origin', 'destination']) {
      $(id).addEventListener('click', () => locate(cityById.get($(id).dataset.city)));
    }
    render();
  }
  return {mount};
})();

/* 以星群中心为切点作球极投影。径向取同一比例，跨赤经零点和天极时仍保留形状。 */
'use strict';
(() => {
  const atlas = JSON.parse(document.getElementById('field-atlas').textContent);
  const codes = Object.keys(atlas);
  const get = suffix => document.getElementById('pattern-' + suffix);
  const chart = get('chart');
  const select = get('code');
  const catalogue = get('catalog').href;
  let round = [], index = 0, score = 0;

  function projected(stars) {
    const rad = Math.PI / 180;
    const vectors = stars.map(([lon, lat]) => {
      const cos = Math.cos(lat * rad);
      return [cos * Math.cos(lon * rad), cos * Math.sin(lon * rad), Math.sin(lat * rad)];
    });
    const [x, y, z] = vectors.reduce((sum, v) => sum.map((n, i) => n + v[i]), [0, 0, 0]);
    const lon = Math.atan2(y, x), lat = Math.atan2(z, Math.hypot(x, y));
    const local = vectors.map(([a, b, c]) => {
      const meridian = a * Math.cos(lon) + b * Math.sin(lon);
      const divisor = 1 + meridian * Math.cos(lat) + c * Math.sin(lat);
      return [(a * Math.sin(lon) - b * Math.cos(lon)) / divisor,
        (meridian * Math.sin(lat) - c * Math.cos(lat)) / divisor];
    });
    const xs = local.map(p => p[0]), ys = local.map(p => p[1]);
    const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);
    const scale = Math.min(520 / (right - left), 248 / (bottom - top));
    const points = local.map(([dx, dy]) => [
      320 + (dx - (left + right) / 2) * scale,
      180 + (dy - (top + bottom) / 2) * scale
    ]);
    const degree = [30, 15, 10, 5, 2, 1, .5].find(n => scale * Math.tan(n * rad / 2) <= 100) || .5;
    return {points, degree, barWidth: scale * Math.tan(degree * rad / 2)};
  }

  function draw(code) {
    const {stars, paths, name, latin, tip, anchor} = atlas[code];
    const {points, degree, barWidth} = projected(stars);
    const lines = paths.map(path => '<polyline points="' + path.map(i => points[i].join(',')).join(' ') + '"/>').join('');
    const bright = stars.reduce((best, star, i) => star[2] < stars[best][2] ? i : best, 0);
    const dots = points.map(([x, y], i) => {
      const radius = Math.max(2.3, 7 - stars[i][2] * .8);
      return '<circle cx="' + x + '" cy="' + y + '" r="' + radius + '"/>';
    }).join('');
    const scaleBar = '<path fill="none" stroke="#cbdfec" d="M20 327v8h' + barWidth + 'v-8"/><text x="' + (28 + barWidth) + '" y="338">约 ' + degree + '°</text>';
    chart.innerHTML = scaleBar + '<text x="20" y="32">↑ 北　← 东</text><g class="pattern-links">' + lines + '</g><g class="pattern-points">' + dots + '</g>';
    chart.querySelector('.pattern-links').style.display = get('lines').checked ? '' : 'none';
    chart.setAttribute('aria-label', (round.length ? '待辨认的星图' : name) + '，含 ' + stars.length + ' 个星点');
    get('title').textContent = name + ' · ' + latin + '（' + code + '）';
    const [x, y] = points[bright];
    get('anchor').textContent = '定位亮星 · ' + anchor.label + '（HIP ' + anchor.hip + '），图中约 ' + stars[bright][2].toFixed(1) + ' 等。';
    const where = (x < 270 ? '左' : x > 370 ? '右' : '') + (y < 145 ? '上' : y > 215 ? '下' : '');
    get('tip').textContent = tip || '先找到图中' + (where ? '偏' + where : '居中') + '最大的星点（约 ' + stars[bright][2].toFixed(1) + ' 等）。沿连线走到相邻星点，记住间距和转折，再隐藏连线重走一遍。';
    get('catalog').href = catalogue + '?con=' + code;
  }

  function shuffle(values) {
    const items = [...values];
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  function showStudy() {
    round = [];
    const anchor = location.hash.slice(1);
    select.value = Object.hasOwn(atlas, anchor) ? anchor : 'Ori';
    get('picker').hidden = get('lesson').hidden = false;
    get('quiz').hidden = true;
    get('mode').textContent = '开始识别练习';
    draw(select.value);
  }

  function question() {
    const code = round[index];
    draw(code);
    get('question').textContent = '第 ' + (index + 1) + ' / ' + round.length + ' 题 · 这是哪个星座？';
    get('options').replaceChildren();
    get('feedback').textContent = '';
    get('next').hidden = true;
    const alternatives = shuffle(codes.filter(other => other !== code)).slice(0, 3);
    for (const option of shuffle([code, ...alternatives])) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = atlas[option].name;
      button.onclick = () => {
        const correct = option === code;
        if (correct) score++;
        for (const b of get('options').children) b.disabled = true;
        const last = index + 1 === round.length;
        get('feedback').textContent = (correct ? '答对了！' : '这张图是' + atlas[code].name + '。') +
          get('tip').textContent + (last ? ' 本轮认对 ' + score + ' / ' + round.length + ' 张。' : '');
        get('next').textContent = last ? '结束本轮' : '下一题';
        get('next').hidden = false;
        get('next').focus();
      };
      get('options').append(button);
    }
    get('question').focus();
  }

  get('mode').onclick = () => {
    if (round.length) return showStudy();
    round = shuffle(codes).slice(0, 5);
    index = score = 0;
    get('picker').hidden = get('lesson').hidden = true;
    get('quiz').hidden = false;
    get('mode').textContent = '返回星图';
    question();
  };
  get('next').onclick = () => {
    if (++index < round.length) question();
    else { showStudy(); get('mode').focus(); }
  };
  get('lines').onchange = () => draw(round.length ? round[index] : select.value);
  select.onchange = () => { location.hash = select.value; };
  window.addEventListener('hashchange', showStudy);
  showStudy();
})();

/* 在共同外壳恢复偏好，并把旧专题的固定字号、界面色接入同一套变量。
 * 只改 CSS 声明，不读写正文；保留选择器、媒体条件、优先级和默认外观。
 * 不处理图片、canvas、SVG 的 fill/stroke，也不反色整个页面。
 */
(() => {
  'use strict';
  const KEY = 'study_reading_v1';
  const root = document.documentElement;
  const themes = {light: '浅色', dark: '深色', warm: '暖色护眼'};
  const sizes = {small: '小', medium: '中', large: '大'};
  const clean = value => ({
    theme: Object.hasOwn(themes, value?.theme) ? value.theme : 'light',
    size: Object.hasOwn(sizes, value?.size) ? value.size : 'medium',
  });
  let prefs;
  let canSave = true;
  try { prefs = clean(JSON.parse(localStorage.getItem(KEY))); }
  catch (error) { prefs = clean(); }

  function sync() {
    root.dataset.readingTheme = prefs.theme;
    root.dataset.readingSize = prefs.size;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',
      {light: '#f7faf5', dark: '#17201d', warm: '#f4ead6'}[prefs.theme]);
    document.querySelectorAll('[data-reading-theme]').forEach(button => {
      if (button.tagName === 'BUTTON') button.setAttribute('aria-pressed', String(button.dataset.readingTheme === prefs.theme));
    });
    document.querySelectorAll('[data-reading-size]').forEach(button => {
      if (button.tagName === 'BUTTON') button.setAttribute('aria-pressed', String(button.dataset.readingSize === prefs.size));
    });
    const current = document.getElementById('reading-current');
    if (current) current.textContent = `${themes[prefs.theme]} · ${sizes[prefs.size]}字`;
    const note = document.getElementById('reading-note');
    if (note) note.textContent = canSave ? '所有专题一起调整，设置保存在这个浏览器。'
      : '本页已调整；浏览器暂时不能保存设置。';
  }

  function change(value, save = true) {
    prefs = clean(value);
    if (save) {
      try { localStorage.setItem(KEY, JSON.stringify(prefs)); canSave = true; }
      catch (error) { canSave = false; }
    }
    sync();
    document.dispatchEvent(new CustomEvent('study:reading-change', {detail: {...prefs}}));
  }
  sync(); // 在首屏绘制前恢复，跨页不用重新切换。
  window.StudyReading = {setPreferences: value => change({...prefs, ...value}),
    get preferences() { return {...prefs}; }};
  window.addEventListener('storage', event => {
    if (event.key !== KEY && event.key !== null) return;
    let value;
    try { value = JSON.parse(event.newValue); } catch (error) { /* 损坏的存储恢复默认 */ }
    change(value, false);
  });

  // CSSOM 适配同时覆盖外链、媒体规则、内联样式及动态插入的卡片。
  // 同一个颜色共用一个变量；浅色与打印不定义替代值，直接使用原来的颜色。
  const palette = new Map();
  const done = new WeakSet();
  const colorPattern = /url\((?:"[^"]*"|'[^']*'|[^)]*)\)|#[\da-f]{8}\b|#[\da-f]{6}\b|#[\da-f]{4}\b|#[\da-f]{3}\b|rgba?\([^()]*\)|(?<![\w-])(?:white|black|whitesmoke|ivory|beige|navy|teal|red|green|blue|orange|purple|gray|grey)\b/gi;
  const paletteStyle = document.createElement('style');
  paletteStyle.dataset.readingPalette = '';
  document.head.append(paletteStyle);
  let palettePending = false;

  function rgb(token) {
    const named = {white: '#ffffff', black: '#000000', whitesmoke: '#f5f5f5', ivory: '#fffff0', beige: '#f5f5dc',
      navy: '#000080', teal: '#008080', red: '#ff0000', green: '#008000', blue: '#0000ff', orange: '#ffa500',
      purple: '#800080', gray: '#808080', grey: '#808080'};
    let value = named[token.toLowerCase()] || token;
    if (value[0] === '#') {
      value = value.slice(1);
      if (value.length < 5) value = [...value].map(c => c + c).join('');
      return [0, 2, 4].map(i => parseInt(value.slice(i, i + 2), 16)).concat(value.length === 8 ? parseInt(value.slice(6), 16) / 255 : 1);
    }
    const parts = value.slice(value.indexOf('(') + 1, -1).trim().split(/\s*[,/]\s*|\s+/);
    if (parts.length < 3 || parts.length > 4 || parts.some(part => !/^\d*\.?\d+%?$/.test(part))) return null;
    return parts.map((part, i) => parseFloat(part) * (part.endsWith('%') ? (i < 3 ? 2.55 : .01) : 1)).concat(parts.length === 3 ? [1] : []);
  }

  function colors(channels) {
    const [r, g, b, alpha] = channels;
    const paperColors = {
      '247,250,245': ['#17201d', '#f4ead6'], '255,254,250': ['#222d29', '#fff7e6'],
      '35,62,55': ['#e2ede8', '#493c2d'], '88,107,98': ['#afc1b7', '#71614d'],
      '220,230,217': ['#3a4d43', '#d9c9ac'], '232,241,223': ['#293b31', '#e9ddc3'],
    };
    const paper = alpha === 1 && paperColors[[r, g, b].join(',')];
    if (paper) return {dark: paper[0], warm: paper[1]};
    const max = Math.max(r, g, b) / 255, min = Math.min(r, g, b) / 255;
    const light = (max + min) / 2, delta = max - min;
    let hue = 0;
    if (delta) {
      if (max === r / 255) hue = ((g - b) / 255 / delta + 6) % 6;
      else if (max === g / 255) hue = (b - r) / 255 / delta + 2;
      else hue = (r - g) / 255 / delta + 4;
    }
    const saturation = delta ? delta / (1 - Math.abs(2 * light - 1)) : 0;
    // 明暗关系反转但保留色相，正确／错误等颜色仍可辨认。
    const darkSaturation = Math.min(saturation * .65, delta * 1.5 + .04);
    const dark = `hsla(${(hue * 60).toFixed(2)}, ${(darkSaturation * 100).toFixed(2)}%, ${((.1 + .8 * (1 - light)) * 100).toFixed(2)}%, ${alpha})`;
    const mix = Math.max(0, (light - .55) / .45) * .4;
    const warm = `rgba(${[r, g, b].map((v, i) => Math.round(v * (1 - mix) + [244, 222, 180][i] * mix)).join(', ')}, ${alpha})`;
    return {dark, warm};
  }

  function flushPalette() {
    palettePending = false;
    paletteStyle.textContent = '@media screen {' + ['dark', 'warm'].map(theme =>
      `html[data-reading-theme="${theme}"] {${[...palette.values()].map(entry => `${entry.name}: ${entry[theme]};`).join('')}}`
    ).join('') + '}';
  }

  function colorValue(value) {
    if (value.includes('--reading-color-')) return value;
    return value.replace(colorPattern, token => {
      if (/^url\(/i.test(token)) return token;
      const channels = rgb(token);
      if (!channels) return token;
      const key = channels.join(',');
      if (!palette.has(key)) {
        palette.set(key, {name: `--reading-color-${palette.size}`, ...colors(channels)});
        if (!palettePending) { palettePending = true; queueMicrotask(flushPalette); }
      }
      return `var(${palette.get(key).name}, ${token})`;
    });
  }

  function adaptStyle(style, isRoot = false) {
    // 含 var() 的简写在 CSSOM 中枚举为值为空的长写，需先读取简写本身。
    const shorthands = ['background', 'border', 'border-top', 'border-right', 'border-bottom', 'border-left', 'outline', 'column-rule'];
    for (const property of [...shorthands, ...style]) {
      const original = style.getPropertyValue(property);
      let value = original;
      if (property === 'font-size' && !isRoot && !original.includes('--reading-scale')
          && /\b(?:px|rem|vw|vh|pt)\b/.test(original.replace(/[\d.]+/g, ' '))) {
        value = `calc((${original}) * var(--reading-scale, 1))`;
      } else if (property.startsWith('--') || /^(?:color|background(?:-color|-image)?|border(?:-(?:top|right|bottom|left))?(?:-color)?|outline(?:-color)?|text-decoration-color|column-rule(?:-color)?)$/.test(property)) {
        if (!property.startsWith('--reading-')) value = colorValue(original);
      }
      if (value !== original) style.setProperty(property, value, style.getPropertyPriority(property));
    }
  }

  function adaptRules(rules) {
    for (const rule of rules) {
      if (rule.media && /\bprint\b/.test(rule.media.mediaText)) continue;
      if (rule.style && rule.selectorText) adaptStyle(rule.style, /^(?::root|html)$/.test(rule.selectorText));
      if (rule.cssRules) adaptRules(rule.cssRules);
    }
  }

  function adaptSheet(sheet) {
    if (!sheet || done.has(sheet) || sheet.ownerNode === paletteStyle) return;
    if (sheet.href && new URL(sheet.href, location.href).origin !== location.origin) return;
    if (sheet.href?.includes('/reading-preferences.css')) return;
    try { adaptRules(sheet.cssRules); done.add(sheet); }
    catch (error) { /* 不可访问的可选样式不影响正文与偏好 */ }
  }

  function adaptElement(element) {
    if (element.nodeType !== 1 || element === paletteStyle || element.closest('svg, [data-reading-preserve]')) return;
    if (element.matches('style, link[rel="stylesheet"]')) adaptSheet(element.sheet);
    if (element.hasAttribute('style')) adaptStyle(element.style, element === root);
  }

  document.addEventListener('load', event => {
    if (event.target.tagName === 'LINK') adaptSheet(event.target.sheet);
  }, true);
  document.addEventListener('DOMContentLoaded', () => {
    [...document.styleSheets].forEach(adaptSheet);
    document.querySelectorAll('[style]').forEach(adaptElement);
    document.querySelectorAll('[data-reading-theme], [data-reading-size]').forEach(button => {
      if (button.tagName !== 'BUTTON') return;
      button.addEventListener('click', () => change({...prefs,
        ...(button.dataset.readingTheme ? {theme: button.dataset.readingTheme} : {size: button.dataset.readingSize})}));
    });
    const settings = document.getElementById('reading-settings');
    if (settings) {
      settings.hidden = false;
      document.addEventListener('click', event => {
        if (!settings.contains(event.target)) settings.open = false;
      });
      settings.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        const select = event.target.closest?.('select');
        if (select && window.CSS?.supports('selector(select:open)') && select.matches(':open')) {
          event.stopPropagation(); // 第一次 Escape 交给原生下拉菜单，保留外层设置。
          return;
        }
        settings.open = false;
        settings.querySelector('summary').focus();
      });
    }
    sync();
    new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'attributes') adaptElement(record.target);
        if (record.type === 'childList' && record.target.tagName === 'STYLE') adaptElement(record.target);
        for (const node of record.addedNodes || []) {
          adaptElement(node);
          node.querySelectorAll?.('[style], style, link[rel="stylesheet"]').forEach(adaptElement);
        }
      }
    }).observe(root, {subtree: true, childList: true, attributes: true, attributeFilter: ['style']});
  });
})();

/* 校验数据库中全部 v2 图示块的 fig id 在对应图示库里真实存在。 */
'use strict';
const path = require('path');

const LIBS = {
  Figures: require('../static/figures/figures.js'),
  SciFigures: require('../static/figures/sci-figures.js'),
  LitFigures: require('../static/figures/lit-figures.js'),
  GeoFigures: require('../static/figures/geo-figures.js'),
  AstroFigures: require('../static/figures/astro-figures.js'),
  HistoryFigures: require('../static/figures/history-figures.js'),
};
const MODULE_LIB = {
  knowledge: 'Figures', math: 'Figures', sci: 'SciFigures', geo: 'GeoFigures',
  astro: 'AstroFigures', history: 'HistoryFigures', lit: 'LitFigures',
};

const snapshot = process.argv[2];
if (!snapshot) { console.error('用法：node verify_figure_refs.cjs data/primary.json'); process.exit(2); }
const data = require(path.resolve(snapshot));
const libDir = path.resolve(__dirname, '..');

let checked = 0, missing = [];
for (const mod of data.modules) {
  const libName = MODULE_LIB[mod.code];
  const lib = LIBS[libName];
  if (!lib) continue;
  const scan = (records) => {
    for (const record of records) {
      if (record && typeof record.fig === 'string' && record.fig) {
        checked += 1;
        if (!lib.has(record.fig)) missing.push(`${mod.code}: ${record.fig} (${libName})`);
      }
    }
  };
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (Array.isArray(node.points)) scan(node.points);
    if (Array.isArray(node.lessons)) scan(node.lessons);
    if (Array.isArray(node.words)) scan(node.words);
    if (Array.isArray(node.units)) node.units.forEach(walk);
    if (Array.isArray(node.topics)) node.topics.forEach(walk);
  };
  walk(mod.data);
}
console.log(JSON.stringify({ checked, missing, ok: missing.length === 0 }));
if (missing.length) process.exit(1);

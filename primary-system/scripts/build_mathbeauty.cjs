/* 从同一数学模型生成无需脚本的本地图示：node scripts/build_mathbeauty.cjs [--check] */
const fs = require('node:fs');
const path = require('node:path');
const models = require('../static/mathbeauty/models.js');
const project = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(project, 'mathbeauty/data/topics.json'), 'utf8'));
const renderers = {
  golden: c => models.goldenSVG(c.split),
  fibonacci: c => models.fibonacciSVG(c.terms),
  sunflower: c => models.sunflowerSVG(c.seeds, c.angle),
  symmetry: c => models.symmetrySVG(c.sides, c.turn, c.axes),
  fractal: c => models.fractalSVG(c.level),
  mobius: c => models.bandSVG(c.band === 'mobius', c.travel, c.view),
  topology: c => models.topologySVG(c.shape, c.deform),
  euler: c => models.eulerSVG(c.solid),
};
let count = 0;
for (const topic of data.topics) for (const lab of topic.labs) {
  const values = Object.fromEntries(lab.controls.map(control => [control.id, control.value]));
  const content = renderers[lab.kind](values) + '\n';
  const file = path.join(project, 'static', lab.figure);
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content) throw Error('图示需要同步：' + lab.figure);
  } else {
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, content);
  }
  count++;
}
console.log(`${process.argv.includes('--check') ? '核对' : '生成'}数学之美本地图示 ${count} 张。`);

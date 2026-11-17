'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../content_sources/earth/earth-model.js');
const data = require('../content_sources/earth/earth-data.js');

test('真实比例的圈层相接，放大地壳时明确保持其余边界', () => {
  for (const enlarged of [false, true]) {
    const layers = model.layerRadii(data.radiusKm, data.layers, enlarged);
    assert.equal(layers[0].outer, 1);
    assert.equal(layers.at(-1).inner, 0);
    layers.slice(1).forEach((layer, i) => assert.equal(layer.outer, layers[i].inner));
    assert.ok(layers.every(l => l.outer > l.inner));
  }
  assert.ok(model.layerRadii(data.radiusKm, data.layers)[0].inner > .99);
  assert.equal(model.layerRadii(data.radiusKm, data.layers, true)[0].inner, .93);
});
test('到时使用震源距离；P先于S，远站的到时差更大', () => {
  const near = model.arrivals(40), far = model.arrivals(200);
  assert.equal(model.arrivals(0, 0).p, 0);
  assert.equal(model.arrivals(0, 20).pathKm, 20);
  assert.ok(near.pathKm > 40 && near.p < near.s);
  assert.ok(far.s - far.p > near.s - near.p);
  assert.ok(Math.abs(model.arrivals(120).p - Math.hypot(120,20)/6) < 1e-10);
});
test('半衰期连续减半，质量比例守恒，时间单位为百万年', () => {
  [0, 1, 2, 3, 4, .25, 1.3].forEach(n => {
    const state = model.decay(n, data.halfLifeMa);
    assert.equal(state.parent + state.daughter, 1);
    assert.equal(state.parent, 2 ** -n);
    assert.equal(state.ma, n * 4470);
  });
  assert.equal(model.decay(2).parent, .25);
  assert.equal(model.decay(-1).parent, 1);
});
test('地球一天保留午夜前几秒的精度，结束显示24点', () => {
  assert.equal(model.earthDay(4540), 0);
  assert.equal(model.earthDay(0), 86400);
  assert.equal(model.clock(86400), '24:00:00.0');
  assert.equal(model.clock(0), '00:00:00.0');
  assert.equal(model.clock(model.earthDay(.3)), '23:59:54.3');
  assert.ok(Math.abs(86400-model.earthDay(.3) - 5.70925) < .0001);
  const positions = data.events.map(e => model.earthDay(e.ma));
  positions.slice(1).forEach((position, i) => assert.ok(position > positions[i]));
});
test('岩石有多条路径，变质过程不必经过岩浆', () => {
  const paths = model.rockOptions(data.rockPaths, 'sedimentary');
  assert.deepEqual(new Set(paths.map(p => p.to)), new Set(['sediment','metamorphic','magma']));
  assert.equal(model.rockOptions(data.rockPaths, 'magma').length, 1);
  assert.equal(model.rockOptions(data.rockPaths, 'magma')[0].to, 'igneous');
  assert.equal(model.rockOptions(data.rockPaths, 'unknown').length, 0);
});

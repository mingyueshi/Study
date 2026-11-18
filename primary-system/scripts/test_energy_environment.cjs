const assert = require('node:assert/strict');
const test = require('node:test');
const { electricityResult, carbonResult } = require('../static/study_topics/energy-environment.js');
const { electricity, carbon } = require('../content_sources/energy-environment.json');

test('节电量比较同一使用时长，保留功率增加、停用和短时使用结果', () => {
  const { before, after, hours, days } = electricity;
  assert.deepEqual(electricityResult(before, after, hours, days), { original: 7.2, changed: 1.2, saved: 6 });
  assert.deepEqual(electricityResult(after, before, hours, days), { original: 1.2, changed: 7.2, saved: -6 });
  assert.deepEqual(electricityResult(before, after, 0, days), { original: 0, changed: 0, saved: 0 });
  assert.equal(electricityResult(1, 0, .25, 1).saved, .00025);
});

test('碳账本从减排后的剩余量扣除移除，区分正、零和负排放', () => {
  assert.deepEqual(carbonResult(carbon.baseline, carbon.reduced, carbon.removed), { remaining: 30, net: 10 });
  assert.deepEqual(carbonResult(100, 70, 30), { remaining: 30, net: 0 });
  assert.deepEqual(carbonResult(100, 70, 50), { remaining: 30, net: -20 });
  assert.deepEqual(carbonResult(100, 100, 0), { remaining: 0, net: 0 });
});

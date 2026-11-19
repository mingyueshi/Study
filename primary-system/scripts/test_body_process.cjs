const {test} = require('node:test');
const assert = require('node:assert/strict');
const {frameAt, createPlayer, smooth, armAngleAt, armTimeAtAngle} = require('../static/science/body-process.js');
const content = require('../content_sources/human-body.json');

function harness(duration = 2000) {
  const frames = new Map();
  let next = 0, now = 0, allowed = true, last;
  const player = createPlayer({duration, render: state => { last = {...state}; }, allowed: () => allowed,
    request: fn => { frames.set(++next, fn); return next; }, cancel: id => frames.delete(id)});
  function tick(ms = 100) { now += ms; const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(now)); }
  return {player, frames, tick, last: () => last, allow: value => { allowed = value; }};
}

test('六课九种演示的时间边界与最后一帧都能准确定位', () => {
  let modes = 0;
  for (const lesson of content.lessons) for (const mode of lesson.animation.modes) {
    modes++;
    let start = 0;
    mode.phases.forEach((phase, i) => {
      assert.equal(frameAt(mode.phases, start).phase.id, phase.id);
      assert.equal(frameAt(mode.phases, start + phase.duration / 2).fraction, .5);
      assert.equal(frameAt(mode.phases, start + phase.duration - .01).index, i);
      start += phase.duration;
    });
    assert.equal(frameAt(mode.phases, start).index, mode.phases.length - 1);
    assert.equal(frameAt(mode.phases, start).fraction, 1);
    assert.equal(frameAt(mode.phases, start * 2).fraction, 1);
    assert.equal(frameAt(mode.phases, -100).fraction, 0);
    assert.equal(frameAt(mode.phases, NaN).index, 0);
  }
  assert.equal(modes, 9);
});

test('暂停保留画面与进度，过期帧不会继续移动，继续播放从原位开始', () => {
  const h = harness();
  h.player.seek(300); h.player.play(); h.tick(); h.tick();
  assert.equal(h.player.state().time, 400);
  const stale = [...h.frames.values()][0];
  h.player.pause(); stale(9000);
  assert.equal(h.player.state().time, 400);
  assert.equal(h.frames.size, 0);
  h.player.play(); h.tick(); h.tick();
  assert.equal(h.player.state().time, 500);
  h.player.seek(1200); h.tick();
  assert.equal(h.player.state().time, 1200);
  assert.equal(h.player.state().playing, false);
});

test('慢速与快速只改变推进量；到末帧停止，再播放从头开始', () => {
  const h = harness();
  h.player.setSpeed(.5); h.player.play(); h.tick(); h.tick();
  assert.equal(h.player.state().time, 50);
  h.player.setSpeed(1.5); h.tick();
  assert.equal(h.player.state().time, 200);
  h.player.setSpeed(Infinity); assert.equal(h.player.state().speed, 1.5);
  h.player.seek(1950); h.player.play(); h.tick(); h.tick();
  assert.equal(h.player.state().time, 2000);
  assert.equal(h.last().time, 2000);
  assert.equal(h.player.state().playing, false);
  assert.equal(h.frames.size, 0);
  h.player.play(); assert.equal(h.player.state().time, 0);
});

test('减少动效、后台或移除页面时拒绝播放，仍允许手动观察', () => {
  const h = harness();
  h.allow(false); h.player.play(); assert.equal(h.frames.size, 0);
  h.player.seek(900); assert.equal(h.last().time, 900);
  h.allow(true); h.player.play(); h.tick();
  h.allow(false); h.tick();
  assert.equal(h.frames.size, 0);
  assert.equal(h.player.state().playing, false);
  h.allow(true); h.tick(); assert.equal(h.frames.size, 0);
});

test('重置和切换过程使旧动画失效；平滑形变在两端连续', () => {
  const h = harness(); h.player.play(); h.tick(); h.tick();
  const stale = [...h.frames.values()][0];
  h.player.seek(0); stale(4000);
  assert.equal(h.player.state().time, 0);
  assert.equal(h.frames.size, 0);
  assert.equal(smooth(0), 0); assert.equal(smooth(1), 1);
  assert.equal(smooth(.5), .5);
  assert.ok(smooth(.001) < .00001);
});

test('屈伸滑块在两个方向都能定位相同角度，并与时间轴的端点对齐', () => {
  const phases = content.lessons.find(lesson => lesson.slug === 'movement').animation.modes[0].phases;
  const turningPoint = phases[0].duration;
  const end = turningPoint + phases[1].duration;
  for (let angle = 1; angle < 110; angle++) {
    for (const extending of [false, true]) {
      const frame = frameAt(phases, armTimeAtAngle(phases, angle, extending));
      assert.equal(frame.phase.id, extending ? 'extend' : 'bend');
      assert.ok(Math.abs(armAngleAt(frame) - angle) < .00001);
    }
  }
  assert.equal(armTimeAtAngle(phases, 0, false), 0);
  assert.equal(armTimeAtAngle(phases, 110, false), turningPoint);
  assert.equal(armTimeAtAngle(phases, 110, true), turningPoint);
  assert.equal(armTimeAtAngle(phases, 0, true), end);
  assert.equal(armAngleAt(frameAt(phases, turningPoint)), 110);
  assert.equal(armAngleAt(frameAt(phases, end)), 0);
});

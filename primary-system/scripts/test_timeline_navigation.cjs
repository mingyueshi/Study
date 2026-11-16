'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
global.window = {};
require('../content_sources/history-timeline/timeline-data.js');
require('../content_sources/history-timeline/dynasty-data.js');
require('../content_sources/history-timeline/reading-data.js');
require('../content_sources/history-timeline/navigation.js');
const N = window.TLNavigation, events = window.TIMELINE_EVENTS, bands = window.DYNASTY_BANDS;

test('year jump accepts Chinese eras, signed full-width years and dynasty names without accepting year zero', () => {
  for (const value of ['公元前 221 年', '前221', '-221', '−２２１']) assert.equal(N.parseTarget(value, bands).year, -221);
  for (const value of ['公元 618 年', '618']) assert.equal(N.parseTarget(value, bands).year, 618);
  assert.equal(N.parseTarget('唐朝', bands).band.id, 'tang');
  assert.equal(N.parseTarget('两晋', bands).band.id, 'liangjin');
  for (const value of ['0', '公元前0年', '-0', '', '唐朝以后', '221.5', '1e3', '<script>']) assert.equal(N.parseTarget(value, bands), null);
});

test('chronological range and slider cross directly from 1 BCE to 1 CE', () => {
  assert.equal(N.calendar(N.ordinal(-1) + 1), 1);
  assert.equal(N.calendar(N.ordinal(1) - 1), -1);
  assert.deepEqual(N.yearRange(1, 1), [-1, 2]);
  assert.deepEqual(N.yearRange(-1, 1), [-2, 1]);
  assert.deepEqual(N.yearRange(-221, 100), [-321, -121]);
  const tang = bands.find(b => b.id === 'tang');
  assert.deepEqual(N.yearRange(627, 'all', tang), [618, 907]);
  assert.equal(N.yearRange(627, 'all'), null);
});

test('nearest recorded event uses representative year and breaks ties in chronological order', () => {
  assert.equal(N.nearest(events, -221).id, 'tc13');
  assert.equal(N.nearest(events, 618).id, 'tw23');
  assert.equal(N.nearest([{id:'late', sort:1}, {id:'early',sort:-1}], -1).id, 'early');
  assert.equal(N.nearest([], 618), null);
});

test('a comparison remains a whole pair when either side falls within the selected range', () => {
  const china = events.find(e => e.id === 'tc13'), world = events.find(e => e.id === 'tw14');
  assert.ok(N.pairInRange(china, world, [-221, -221]));
  assert.ok(N.pairInRange(china, world, [-205, -205]));
  assert.equal(N.pairInRange(china, world, [1, 100]), false);
  assert.ok(N.inRange(china, null));
});

test('dynasty ribbon highlights overlapping bands and leaves prehistory and modern years unassigned', () => {
  assert.deepEqual(N.bandsAt(bands, 270).map(b => b.id), ['sanguo','liangjin']);
  assert.deepEqual(N.bandsAt(bands, 627).map(b => b.id), ['tang']);
  assert.deepEqual(N.bandsAt(bands, -3000), []);
  assert.deepEqual(N.bandsAt(bands, 2022), []);
});

test('curated reading chains cross eras and tracks while all fallback steps move forward', () => {
  const next = id => N.nextReading(events.find(e => e.id === id), events, window.TIMELINE_READING_LINKS);
  assert.equal(next('tc11').event.id, 'tc13');
  assert.equal(next('tc24').event.id, 'tw29');
  assert.equal(next('tc11').curated, true);
  assert.equal(next('tc35').curated, false);
  for (const event of events) {
    const result = next(event.id);
    if (result) assert.ok(result.event.sort > event.sort, event.id + ' must not loop');
  }
  assert.equal(next('tw65'), null);
});

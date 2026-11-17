'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
global.window = {};
global.document = {currentScript:{src:'https://study.local/static/study_topics/history-timeline/people-shared.js'}};
require('../content_sources/history-timeline/people-data.js');
require('../content_sources/history-timeline/shared.js');
require('../content_sources/history-timeline/people-shared.js');
const H = window.HistoryPeople;

test('search combines identity, era, aliases and work keywords', () => {
  assert.equal(H.filterPeople().length, 24);
  for (const group of H.data.groups) assert.equal(H.filterPeople({group:group.id}).length, 6);
  assert.deepEqual(H.filterPeople({query:'李 白'}).map(p=>p.id), ['li-bai']);
  assert.ok(H.filterPeople({query:'几何'}).some(p=>p.id==='xu-guangqi'));
  assert.equal(H.filterPeople({query:'李白',group:'science'}).length, 0);
  const li = H.personMap.get('li-bai');
  assert.ok(H.filterPeople({era:li.era}).every(p=>p.era===li.era));
  assert.equal(H.filterPeople({query:'<script>'}).length, 0);
});

test('relations are bidirectional and preserve type and historical boundaries', () => {
  const relation = H.relationsFor('li-bai','contact').find(r=>r.id==='li-du');
  assert.equal(H.otherPerson(relation,'li-bai').id,'du-fu');
  assert.equal(H.otherPerson(relation,'du-fu').id,'li-bai');
  assert.ok(H.relationsFor('du-fu','contact').some(r=>r.id==='li-du'));
  assert.ok(H.graphHTML('li-bai').includes('is-direct'));
  assert.ok(!H.graphHTML('sima-qian','reception').includes('is-direct'));
  assert.ok(H.graphHTML('li-bai','all',true).includes('data-focus="du-fu"'));
  assert.ok(H.graphHTML('li-bai').includes('person.html?person=du-fu'));
  assert.ok(H.relationListHTML('newton','service').includes('暂未收录'));
});

test('event connections and image captions lead to stable local profiles', () => {
  assert.deepEqual(H.peopleForEvent('tc46').map(p=>p.id), ['li-bai','du-fu']);
  assert.deepEqual(H.peopleForEvent('unknown'), []);
  const person = H.personMap.get('wu-daozi');
  assert.ok(H.cardHTML(person).includes(person.image.caption));
  assert.ok(H.cardHTML(person).includes('https://study.local/static/study_topics/history-timeline/assets/people/'));
  assert.equal(H.personHref(person),'person.html?person=wu-daozi');
  assert.ok(H.sourcesHTML(person.sources).includes('noopener noreferrer'));
});

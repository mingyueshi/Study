/* 门户用同一套时代与事件数据生成路线图。 */
(() => {
  'use strict';
  const { makeContext, stationsHTML } = window.TLShared;
  const eras = window.TIMELINE_ERAS;
  const events = window.TIMELINE_EVENTS;
  const pairs = window.TIMELINE_PAIRS;
  const ctx = makeContext(eras, events, pairs);
  const $ = id => document.getElementById(id);

  $('stat-eras').textContent = eras.length;
  $('stat-events').textContent = events.length;
  $('stat-pairs').textContent = pairs.length;
  $('stat-dynasties').textContent = window.DYNASTY_BANDS.length;
  $('station-grid').innerHTML = stationsHTML(eras, ctx);
})();

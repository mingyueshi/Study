/* 年代定位和阅读链的纯逻辑，复用稳定事件编号。公元纪年没有零年。 */
window.TLNavigation = (() => {
  'use strict';
  const ordinal = year => year < 0 ? year : year - 1;
  const calendar = value => value < 0 ? value : value + 1;
  const formatYear = year => year < 0 ? `公元前 ${-year} 年` : `${year} 年`;
  const normalize = value => String(value).normalize('NFKC').replace(/−/g, '-').replace(/\s/g, '').toLowerCase();
  function parseTarget(value, bands) {
    const text = normalize(value);
    const band = bands.find(item => text === item.id || text === item.name || text === item.name + '朝');
    if (band) return {year: band.startYear, band};
    const match = /^(公元前|前|-|公元)?(\d{1,6})年?$/.exec(text);
    if (!match || Number(match[2]) === 0) return null;
    return {year: Number(match[2]) * (['公元前', '前', '-'].includes(match[1]) ? -1 : 1), band: null};
  }
  function yearRange(year, radius, band = null) {
    if (band) return [band.startYear, band.endYear];
    return radius === 'all' ? null : [calendar(ordinal(year) - Number(radius)), calendar(ordinal(year) + Number(radius))];
  }
  const inRange = (event, range) => !range || (event.sort >= range[0] && event.sort <= range[1]);
  const pairInRange = (china, world, range) => inRange(china, range) || inRange(world, range);
  const nearest = (events, year) => [...events].sort((a, b) =>
    Math.abs(ordinal(a.sort) - ordinal(year)) - Math.abs(ordinal(b.sort) - ordinal(year)) || a.sort - b.sort)[0] || null;
  const bandsAt = (bands, year) => bands.filter(band => year >= band.startYear && year <= band.endYear);
  function nextReading(event, events, links) {
    const link = links.find(item => item.from === event.id);
    const target = link && events.find(item => item.id === link.to && item.sort > event.sort);
    if (target) return {event: target, reason: link.reason, curated: true};
    const later = events.filter(item => item.sort > event.sort).sort((a, b) => a.sort - b.sort);
    const next = later.find(item => item.track === event.track) || later[0];
    return next ? {event: next, reason: next.track === event.track ? '沿着这条历史线，接着读后面的年代。' : '再到另一条历史线，看看更晚发生的大事。', curated: false} : null;
  }
  return {ordinal, calendar, formatYear, normalize, parseTarget, yearRange, inRange, pairInRange, nearest, bandsAt, nextReading};
})();

/* 固定 UTC 偏移换算。跨日量以出发地当天为基准。 */
(() => {
  'use strict';
  const dayMinutes = 24 * 60;
  const clockPattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  const formatClock = (minutes) => [Math.floor(minutes / 60), minutes % 60]
    .map(part => String(part).padStart(2, '0')).join(':');

  function convert(clock, origin, destination) {
    if (typeof clock !== 'string' || !clockPattern.test(clock) || !Number.isInteger(origin) || !Number.isInteger(destination)) return null;
    const [hours, minutes] = clock.split(':').map(Number);
    const difference = destination - origin;
    const total = hours * 60 + minutes + difference;
    const day = Math.floor(total / dayMinutes);
    return {clock: formatClock(total - day * dayMinutes), day, difference};
  }

  const offsetLabel = minutes => `UTC${minutes < 0 ? '−' : '+'}${formatClock(Math.abs(minutes))}`;
  const offsets = {convert, offsetLabel};
  if (typeof module !== 'undefined' && module.exports) module.exports = offsets;
  if (typeof window !== 'undefined') window.GMTimeOffsets = offsets;
})();

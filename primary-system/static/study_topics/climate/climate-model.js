(function () {
  'use strict';
  function condensation(temperature, initialDewPoint) {
    if (temperature > initialDewPoint) return 'clear';
    return temperature === initialDewPoint ? 'saturated' : 'droplets';
  }

  function statistics(station) {
    const {temperature, precipitation} = station;
    const rain = precipitation.reduce((sum, value) => sum + value, 0);
    const warmHalf = precipitation.slice(3, 9).reduce((sum, value) => sum + value, 0);
    return {
      tempRange: Math.max(...temperature) - Math.min(...temperature),
      wettest: precipitation.indexOf(Math.max(...precipitation)),
      rain,
      warmHalfShare: rain ? warmHalf / rain : 0
    };
  }

  function cellAt(grid, lon, lat) {
    if (lon < grid.west || lon >= grid.east || lat <= grid.south || lat > grid.north) return 0;
    const row = Math.floor((grid.north - lat) / grid.step);
    const col = Math.floor((lon - grid.west) / grid.step);
    return parseInt(grid.rows[row][col], 32);
  }

  const model = {condensation, statistics, cellAt};
  if (typeof module === 'object' && module.exports) module.exports = model;
  else window.ClimateModel = model;
})();

/* 球面坐标与日期变更线处理，供渲染和无浏览器回归共用。 */
window.GMWorld3DGeometry = (() => {
  'use strict';
  const rad = Math.PI / 180;
  const wrap = lon => ((lon + 180) % 360 + 360) % 360 - 180;
  function xyz([lon, lat], radius = 1) {
    return [radius * Math.cos(lat * rad) * Math.sin(lon * rad), radius * Math.sin(lat * rad), radius * Math.cos(lat * rad) * Math.cos(lon * rad)];
  }
  function lonLat({x, y, z}) {
    return [wrap(Math.atan2(x, z) / rad), Math.asin(Math.max(-1, Math.min(1, y / Math.hypot(x, y, z)))) / rad];
  }
  function unwrap(ring) {
    let previous = ring[0][0];
    return ring.map(([lon, lat]) => {
      previous = lon + 360 * Math.round((previous - lon) / 360);
      return [previous, lat];
    });
  }
  function center(country) {
    if (country.name === 'Antarctica') return [0, -89.9];
    const rings = country.rings.map(unwrap);
    const box = ring => {
      const xs = ring.map(p => p[0]), ys = ring.map(p => p[1]);
      return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    };
    const boxes = rings.map(box).sort((a, b) => (b[2] - b[0]) * (b[3] - b[1]) - (a[2] - a[0]) * (a[3] - a[1]));
    const b = boxes[0];
    return [wrap((b[0] + b[2]) / 2), (b[1] + b[3]) / 2];
  }
  function sphere(THREE, cols = 180, rows = 90) {
    const positions = [], uvs = [], indices = [];
    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= cols; col++) {
        positions.push(...xyz([col / cols * 360 - 180, 90 - row / rows * 180]));
        uvs.push(col / cols, 1 - row / rows);
        if (row < rows && col < cols) {
          const a = row * (cols + 1) + col, b = a + 1, c = a + cols + 1, d = c + 1;
          if (row > 0) indices.push(a, c, b);
          if (row < rows - 1) indices.push(b, c, d);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    return geometry;
  }
  function zoneAt(lat, zones) {
    return zones.find((z, i) => lat >= z.min && (lat < z.max || (i === zones.length - 1 && lat <= z.max)));
  }
  function coordinates([lon, lat]) {
    const roundedLon = Math.round(lon * 10) / 10, roundedLat = Math.round(lat * 10) / 10;
    const latitude = roundedLat === 0 ? '赤道 0°' : `${roundedLat > 0 ? '北纬' : '南纬'} ${Math.abs(roundedLat).toFixed(1)}°`;
    const longitude = roundedLon === 0 ? '经度 0°' : `${roundedLon > 0 ? '东经' : '西经'} ${Math.abs(roundedLon).toFixed(1)}°`;
    return `${latitude}，${longitude}`;
  }
  return {xyz, lonLat, wrap, unwrap, center, sphere, zoneAt, coordinates};
})();

(function () {
  'use strict';
  const clamp = (v, l, h) => Math.max(l, Math.min(h, v));
  const distance = (a,b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const paperCm = (meters, denominator) => meters * 100 / denominator;
  const groundMeters = (centimeters, denominator) => centimeters * denominator / 100;
  const lerp = (a,b,t) => [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t];
  function azimuth(a,b) {
    if (!distance(a,b)) return null;
    return (Math.atan2(b[0] - a[0], b[1] - a[1]) * 180 / Math.PI + 360) % 360;
  }

  function sector(degrees) {
    return ['北','东北','东','东南','南','西南','西','西北'][Math.round(degrees / 45) % 8];
  }

  function view(terrain, width, height, rotation = 0) {
    const radians = rotation * Math.PI / 180;
    const cos = Math.cos(radians), sin = Math.sin(radians);
    const {width:east, height:north} = terrain;
    const rotatedWidth = Math.abs(cos)*east + Math.abs(sin)*north;
    const rotatedHeight = Math.abs(sin)*east + Math.abs(cos)*north;
    const padding = width < 430 ? 18 : 24;
    const scale = Math.min((width - 2*padding) / rotatedWidth, (height - 2*padding) / rotatedHeight);
    return {
      scale,
      project([x,y]) {
        const dx = x - east / 2;
        const dy = north / 2 - y;
        return [width / 2 + scale*(dx*cos - dy*sin), height / 2 + scale*(dx*sin + dy*cos)];
      },
      unproject([x,y]) {
        const dx = (x - width / 2) / scale;
        const dy = (y - height / 2) / scale;
        return [east / 2 + dx*cos + dy*sin, north / 2 - (dy*cos - dx*sin)];
      }
    };
  }

  function riverEast(terrain, y) {
    const valley = terrain.valley;
    return valley.east + valley.amplitude * Math.sin(y / valley.wavelength);
  }

  function heightAtNode(terrain, x, y) {
    const hills = terrain.hills.reduce((sum, h) =>
      sum + h.rise * Math.exp(-.5 * (((x - h.x)/h.sx)**2 + ((y - h.y)/h.sy)**2)), 0);
    const valley = terrain.valley;
    const cut = valley.cut * Math.exp(-.5 * ((x - riverEast(terrain,y))/valley.width)**2);
    return terrain.base + terrain.northRise*y + hills - cut;
  }

  // 使用与地形插值相同的两个三角形。边上等高点按半开区间判断。
  function contourSegment(triangle, height) {
    const ends = [];
    for (let i = 0; i < 3; i++) {
      const a = triangle[i], b = triangle[(i + 1) % 3];
      if ((a[2] < height) === (b[2] < height)) continue;
      ends.push(lerp(a, b, (height-a[2])/(b[2]-a[2])));
    }
    return ends.length === 2 && distance(...ends) > 1e-8 ? ends : null;
  }

  function crossing(a,b,p,q) {
    const ab = [b[0]-a[0], b[1]-a[1]], pq = [q[0]-p[0],q[1]-p[1]];
    const ap = [p[0]-a[0],p[1]-a[1]];
    const cross = (u,v) => u[0]*v[1]-u[1]*v[0];
    const det = cross(ab,pq);
    if (Math.abs(det) < 1e-9) return null;
    const t = cross(ap,pq)/det, u = cross(ap,ab)/det;
    return t >= -1e-9 && t <= 1 + 1e-9 && u >= -1e-9 && u <= 1 + 1e-9 ? clamp(t,0,1) : null;
  }

  function createSurface(terrain) {
    const {width,height,step} = terrain;
    const cols = width/step, rows = height/step;
    const grid = Array.from({length:rows+1}, (_, y) =>
      Array.from({length:cols+1}, (_, x) => [x*step,y*step,heightAtNode(terrain,x*step,y*step)]));
    const values = grid.flat().map(p => p[2]);
    const min = Math.min(...values), max = Math.max(...values);
    const cache = new Map();

    function elevation([x,y]) {
      const gx = clamp(x,0,width)/step, gy = clamp(y,0,height)/step;
      const c = Math.min(cols-1, Math.floor(gx)), r = Math.min(rows-1, Math.floor(gy));
      const u = gx-c, v = gy-r;
      const a = grid[r][c][2], b = grid[r][c+1][2];
      const d = grid[r+1][c][2], e = grid[r+1][c+1][2];
      return u >= v ? a*(1-u) + b*(u-v) + e*v : a*(1-v) + e*u + d*(v-u);
    }

    function contours(interval) {
      if (cache.has(interval)) return cache.get(interval);
      const groups = [];
      for (let h = Math.ceil(min/interval)*interval; h <= max; h += interval) {
        const lines = [];
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const a = grid[y][x], b = grid[y][x+1], d = grid[y+1][x], e = grid[y+1][x+1];
            for (const triangle of [[a,b,e],[a,e,d]]) {
              const line = contourSegment(triangle,h);
              if (line) lines.push(line);
            }
          }
        }
        if (lines.length) groups.push({height:h,lines});
      }
      cache.set(interval,groups);
      return groups;
    }

    function profile(a,b,interval) {
      const length = distance(a,b);
      const points = Array.from({length:121}, (_, i) => {
        const t = i/120, at = lerp(a,b,t);
        return {t,at,height:elevation(at)};
      });
      const hits = [];
      if (length) {
        for (const group of contours(interval)) {
          for (const [p,q] of group.lines) {
            const t = crossing(a,b,p,q);
            if (t !== null) hits.push({t,at:lerp(a,b,t),height:group.height});
          }
        }
      }
      hits.sort((a,b) => a.t-b.t);
      // 线经过网格边或顶点时，同一交点可能被邻接三角形报告两次。
      const crossings = hits.filter((p,i) => i === 0 || p.t-hits[i-1].t > 1e-8);
      return {length,points,crossings};
    }

    return {elevation,contours,profile,min,max};
  }

  const model = {clamp,distance,paperCm,groundMeters,lerp,azimuth,sector,view,riverEast,contourSegment,createSurface};
  if (typeof module === 'object' && module.exports) module.exports = model;
  else window.MapSkillsModel = model;
})();

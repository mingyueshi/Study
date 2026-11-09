/* 地点索引只用档案数据。检索、关系与路线不需要加载地图几何。 */
window.GMAtlas = (() => {
  'use strict';

  const categories = [
    ['province', '省级行政区'], ['china-feature', '中国山河'], ['neighbor', '中国的邻居'],
    ['country', '世界国家和地区'], ['ocean', '大洋'], ['world-feature', '世界地标']
  ];
  const regions = new Map(window.GM_REGIONS.map(r => [r.id, r.name]));
  const continents = new Map(window.GM_CONTINENTS.map(c => [c.id, c.name]));
  const featureKinds = {
    mountain: '山脉', peak: '山峰', river: '河流', plateau: '高原', plain: '平原', basin: '盆地',
    lake: '湖泊', sea: '海域', island: '岛屿', desert: '沙漠', trench: '海沟', reef: '珊瑚礁'
  };

  const places = [
    ...window.GM_PROVINCES.map(p => ({
      ...p, map: 'china', layer: 'province', category: 'province',
      context: regions.get(p.region), aliases: [p.short, p.capital, p.adcode].filter(Boolean)
    })),
    {
      id: 'capital', name: '首都北京', map: 'china', layer: 'province', category: 'province',
      context: '首都星标', aliases: ['北京', '京'], note: window.GM_CAPITAL.text
    },
    ...window.GM_FEATURES.map(f => ({
      ...f, map: 'china', layer: 'land', category: 'china-feature', context: featureKinds[f.kind]
    })),
    ...window.GM_NEIGHBORS.map(n => ({
      ...n, map: 'china', layer: 'neighbor', category: 'neighbor',
      context: n.rel === 'sea' ? '隔海相望' : '陆上接壤'
    })),
    ...Object.entries(window.GM_COUNTRY_META).map(([id, [name, continent]]) => ({
      id, name, map: 'world', layer: 'continent', category: 'country', context: continents.get(continent), aliases: [id]
    })),
    ...window.GM_OCEANS.map(o => ({
      ...o, map: 'world', layer: 'continent', category: 'ocean', context: '大洋'
    })),
    ...window.GM_WORLD_FEATURES.map(f => ({
      ...f, map: 'world', layer: 'extreme', category: 'world-feature', context: featureKinds[f.kind]
    }))
  ];
  const byId = new Map(places.map(p => [p.id, p]));
  const get = (id) => byId.get(id);

  const normalize = (value) => value.normalize('NFKC').toLowerCase().trim();
  const search = (query, category = '') => {
    const q = normalize(query);
    const matches = places
      .filter(p => !category || p.category === category)
      .map(p => {
        if (!q) return { p, rank: 0 };
        const names = [p.name, ...(p.aliases || [])].map(normalize);
        if (names.includes(q)) return { p, rank: 0 };
        if (names.some(n => n.includes(q))) return { p, rank: 1 };
        const text = [p.context, p.where].filter(Boolean).join(' ');
        return { p, rank: normalize(text).includes(q) ? 2 : -1 };
      })
      .filter(match => match.rank >= 0);
    return matches.sort((a, b) => a.rank - b.rank).map(match => match.p);
  };

  const countriesByName = new Map(places.filter(p => p.category === 'country').map(p => [p.name, p.id]));
  const relations = new Map();
  const connect = (from, to) => {
    const ids = relations.get(from) || new Set();
    ids.add(to);
    relations.set(from, ids);
  };
  const neighborPairs = window.GM_NEIGHBORS.map(n => [n.id, countriesByName.get(n.name)]).filter(pair => pair[1]);
  for (const [a, b] of [...window.GM_ATLAS_RELATIONS, ...neighborPairs]) {
    connect(a, b);
    connect(b, a);
  }
  const related = (id) => [...(relations.get(id) || [])].map(get).filter(Boolean);

  const mapLabel = (p) => p.map === 'china' ? '中国地图' : '世界地图';
  const mapHref = (p, options = {}) => p.map + '.html?' + new URLSearchParams({ place: p.id, ...options }) + '#map';
  const routes = window.GM_ATLAS_ROUTES;
  const stepHref = (route, index) => mapHref(get(route.steps[index].place), { route: route.id });
  function routeStop(params) {
    const route = routes.find(r => r.id === params.get('route'));
    if (!route) return null;
    const index = route.steps.findIndex(step => step.place === params.get('place'));
    return index >= 0 ? { route, index, step: route.steps[index] } : null;
  }

  return { places, categories, routes, get, search, related, mapLabel, mapHref, stepHref, routeStop };
})();

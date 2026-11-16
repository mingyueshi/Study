const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = path.join(__dirname, '../static/study_topics/geo-map');
const ctx = vm.createContext({console, atob, performance, AbortController}); ctx.window = ctx;
for (const name of ['assets/vendor/three-map','china-3d-data','china-terrain-data','china-3d-geometry','china-adventures-data','china-hydrology-data','china-hydrology-geo','china-hydrology','china-terrain-play']) vm.runInContext(fs.readFileSync(path.join(base,name+'.js'),'utf8'), ctx);
const G = ctx.GMChina3DGeometry, H = ctx.GMChinaHydrology, P = ctx.GMChinaTerrainPlay, data = ctx.GM_CHINA_HYDROLOGY_GEO;
const meshes = Object.entries(ctx.GM_CHINA_TERRAIN.provinces).map(([id,record]) => ({...G.decode(record), province:'p'+id}));
const sample = G.createSurfaceSampler(meshes);
test('五个流域掩膜只引用对应地形三角形，计数与源网格一致，损坏数据拒绝加载', () => {
  for (const basin of Object.values(data.basins)) {
    let count = 0;
    for (const [id,record] of Object.entries(basin.provinceMasks)) {
      const mesh = meshes.find(m => m.province === id), selected = H.maskIndices(record, mesh.indices);
      assert.equal(selected.length, record.selectedCount*3); assert.ok(selected.every(i => i < mesh.elevations.length)); count += selected.length/3;
    }
    assert.ok(count > 1000 && count < 843942);
  }
  assert.throws(() => H.maskIndices({triangleCount:1,selectedCount:1,bits:'AA=='}, new Uint16Array([0,1,2])));
});
test('长江流域包含四川盆地与武汉，不把北京和淮河上中游算入长江', () => {
  const contains = point => data.basins.f20.polygons.some(polygon => P.inside(point,polygon));
  assert.equal(contains([104.1,30.7]),true); assert.equal(contains([114.3,30.6]),true);
  assert.equal(contains([116.4,39.9]),false); assert.equal(contains([116.5,33]),false);
  assert.equal(data.basins.f43,undefined);
});
test('湖面参考当地 DEM 与地表湖海拔下限，青海湖高于平原湖，没有资料时不编造水位', () => {
  const lakes=ctx.GM_CHINA_ADVENTURES.lakes;
  const levels = Object.fromEntries(lakes.map(l => [l.feature,P.lakeLevel(l.rings,sample,ctx.GM_CHINA_HYDROLOGY.lakeFloorMeters)]));
  const qinghai=lakes.find(l=>l.rings.flat().some(p=>p[0]<101));
  assert.ok(levels[qinghai.feature]>3000 && levels[qinghai.feature]<3400);
  for(const l of lakes.filter(l=>l.rings.flat().every(p=>p[0]>110))) assert.ok(levels[l.feature]>=-10 && levels[l.feature]<100);
  assert.equal(P.lakeLevel(lakes[0].rings,()=>null),null);
});
test('平整湖面共享水位，示意湖盆只改显示顶点，关闭湖泊完全恢复且原始海拔始终不变', () => {
  const T=ctx.GMThree, geometry=G.buildTerrain(ctx.GM_CHINA_TERRAIN.provinces['630000']);
  const raw=Array.from(geometry.positions), heights=Array.from(geometry.elevations), group=new T.Group(); group.position.z=G.datum;
  const models=new Map([['p630000',{group,geometry}]]), scene=new T.Scene(), buttons=new Map();
  const button=id=>{if(!buttons.has(id))buttons.set(id,{textContent:'',innerHTML:'',attrs:{},handlers:{},addEventListener(n,f){this.handlers[n]=f;},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];}});return buttons.get(id);};
  ctx.GMShared={esc:s=>s};
  const root={dataset:{},querySelector:button};
  const controller=P.create({root,models,rivers:new Map(),scene,sample,locate:sample.locate,requestDraw(){},fullMotion:()=>false,canAnimate:()=>true,gain:()=>50});
  const displayed=geometry.top.getAttribute('position').array;
  assert.ok(displayed.some((v,i)=>i%3===2 && v<raw[i]));
  assert.deepEqual(Array.from(geometry.positions),raw); assert.deepEqual(Array.from(geometry.elevations),heights);
  const allWater=scene.children[0].children;
  for(const mesh of allWater){const p=mesh.geometry.getAttribute('position');for(let i=1;i<p.count;i++)assert.equal(p.getZ(i),p.getZ(0));}
  button('#gm3-lakes').handlers.click({currentTarget:button('#gm3-lakes')});
  assert.deepEqual(Array.from(displayed),raw); assert.equal(root.dataset.lakesVisible,'false');
  controller.settle(); assert.deepEqual(Array.from(geometry.elevations),heights);
});

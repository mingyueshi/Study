(() => {
  'use strict';
  const {terrain,points,land,route,symbols} = window.MapSkillsData;
  const model = window.MapSkillsModel;
  const colors = new Map(symbols.map(item => [item.id,item.color]));
  const pickColor = '#a13c2b';
  const probeColor = '#b55b15';
  const ink = '#263b38';

  function drawCanvas(canvas, draw) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => {};
    function render() {
      const width = canvas.clientWidth, height = canvas.clientHeight;
      if (!width || !height) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const pw = Math.round(width*dpr), ph = Math.round(height*dpr);
      if (canvas.width !== pw) canvas.width = pw;
      if (canvas.height !== ph) canvas.height = ph;
      ctx.setTransform(pw/width,0,0,ph/height,0,0);
      ctx.clearRect(0,0,width,height);
      draw(ctx,width,height);
    }
    const observer = new ResizeObserver(render);
    observer.observe(canvas);
    render();
    return render;
  }

  function text(ctx, value, x, y, options = {}) {
    const {color=ink, size=13, align='center', halo=false} = options;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.font = `650 ${size}px system-ui, sans-serif`;
    if (halo) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#fbfaf0';
      ctx.strokeText(value,x,y);
    }
    ctx.fillStyle = color;
    ctx.fillText(value,x,y);
  }

  function path(ctx, coordinates, close = false) {
    ctx.beginPath();
    coordinates.forEach(([x,y], i) => ctx[i ? 'lineTo' : 'moveTo'](x,y));
    if (close) ctx.closePath();
  }

  function circle(ctx, [x,y], size, color, border) {
    ctx.beginPath();
    ctx.arc(x,y,size,0,2*Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    if (border) {
      ctx.strokeStyle = border;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function marker(ctx, at, name, color = pickColor) {
    circle(ctx,at,6,color,'#fff');
    if (name) text(ctx,name,at[0]+9,at[1]-11,{align:'left',halo:true,color});
  }

  function arrow(ctx, a, b, color, width = 2) {
    const angle = Math.atan2(b[1]-a[1], b[0]-a[0]);
    const head = 9;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    path(ctx,[a,b]);
    ctx.stroke();
    const tips = [-.5,.5].map(offset =>
      [b[0] - head*Math.cos(angle+offset), b[1] - head*Math.sin(angle+offset)]);
    ctx.fillStyle = color;
    path(ctx,[b,...tips],true);
    ctx.fill();
  }

  function relief(surface) {
    const raster = document.createElement('canvas');
    raster.width = 120;
    raster.height = 90;
    const ctx = raster.getContext('2d');
    const ramp = ['#f6f0d7','#eee3be','#e7d4ac','#dbc29a','#cda67b','#bc906b'];
    for (let y=0; y<raster.height; y++) {
      for (let x=0; x<raster.width; x++) {
        const height = surface.elevation([x*5+2.5,terrain.height-y*5-2.5]);
        ctx.fillStyle = ramp[Math.min(ramp.length-1,Math.floor(height/55))];
        ctx.fillRect(x,y,1,1);
      }
    }
    return raster;
  }

  const river = Array.from({length:terrain.valley.head/terrain.step+1},(_,i) => {
    const y = i*terrain.step;
    return [model.riverEast(terrain,y),y];
  });
  const lake = Array.from({length:50},(_,i) => {
    const angle = i/50*2*Math.PI;
    return [land.lake.at[0]+land.lake.rx*Math.cos(angle),land.lake.at[1]+land.lake.ry*Math.sin(angle)];
  });

  function paintBase(ctx, project, state, surfaceImage) {
    const {width,height} = terrain;
    const box = [[0,0],[width,0],[width,height],[0,height]].map(project);
    ctx.save();
    path(ctx,box,true);
    ctx.fillStyle = '#faf5e5';
    ctx.fill();
    ctx.clip();
    if (surfaceImage) {
      const [left,top] = project([0,height]), [right,bottom] = project([width,0]);
      ctx.drawImage(surfaceImage,left,top,right-left,bottom-top);
    } else {
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#cfd5bc';
      ctx.setLineDash([3,4]);
      for (let x=0; x<=width; x+=100) {
        path(ctx,[[x,0],[x,height]].map(project));
        ctx.stroke();
      }
      for (let y=0; y<=height; y+=100) {
        path(ctx,[[0,y],[width,y]].map(project));
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    function feature(id, draw) {
      ctx.save();
      ctx.globalAlpha = state.feature && state.feature !== id ? .2 : 1;
      draw();
      ctx.restore();
    }
    if (!surfaceImage) {
      feature('woods',() => {
        path(ctx,land.woods.map(project),true);
        ctx.fillStyle = colors.get('woods');
        ctx.fill();
      });
    }
    feature('river',() => {
      path(ctx,river.map(project));
      ctx.strokeStyle = colors.get('river');
      ctx.lineWidth = state.feature === 'river' ? 4 : 2.2;
      ctx.stroke();
    });
    if (!surfaceImage) {
      feature('lake',() => {
        path(ctx,lake.map(project),true);
        ctx.fillStyle = colors.get('lake');
        ctx.fill();
        ctx.strokeStyle = colors.get('river');
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });
      feature('trail',() => {
        path(ctx,route.nodes.map(project));
        ctx.setLineDash([6,4]);
        ctx.strokeStyle = colors.get('trail');
        ctx.lineWidth = state.feature === 'trail' ? 4 : 2.6;
        ctx.stroke();
      });
    }
    ctx.restore();
    path(ctx,box,true);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#87917e';
    ctx.stroke();
    if (!surfaceImage) {
      for (const item of points) {
        feature(item.symbol,() => {
          const at = project(item.at);
          if (item.symbol === 'bridge') {
            ctx.fillStyle = colors.get('bridge');
            ctx.fillRect(at[0]-4,at[1]-4,8,8);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(at[0]-4,at[1]-4,8,8);
          } else {
            circle(ctx,at,4,colors.get('place'),'#fff');
          }
          text(ctx,item.name,at[0],at[1]+15,{halo:true,size:12});
        });
      }
    }
  }

  function paintContours(ctx, surface, interval, project, viewWidth) {
    const labels = [];
    const groups = surface.contours(interval);
    for (const {height,lines} of groups) {
      ctx.beginPath();
      for (const segment of lines) {
        const [a,b] = segment.map(project);
        ctx.moveTo(...a);
        ctx.lineTo(...b);
      }
      ctx.strokeStyle = height % (interval*2) === 0 ? '#805638' : '#996c4a';
      ctx.lineWidth = height % (interval*2) === 0 ? 1.35 : .85;
      ctx.stroke();
      if (viewWidth < 540 && height % (interval*2) !== 0) continue;
      const midpoints = lines.map(line => model.lerp(...line,.5));
      const candidates = midpoints.filter(([x,y]) => x>35 && x<565 && y>30 && y<428)
        .map(project)
        .filter(p => labels.every(q => model.distance(p,q) > 31));
      if (!candidates.length) continue;
      const target = project([200 + (height/interval % 3)*105,terrain.height*.64]);
      const best = candidates.reduce((a,b) => model.distance(a,target) <= model.distance(b,target) ? a : b);
      labels.push(best);
      text(ctx,height,...best,{halo:true,size:11,color:'#6a412b'});
    }
  }

  function compass(ctx, width, rotation) {
    const origin = [width-48,43];
    const angle = rotation*Math.PI/180;
    const tip = r => [origin[0]+r*Math.sin(angle),origin[1]-r*Math.cos(angle)];
    circle(ctx,origin,25,'#fdfcf2','#c3cbb9');
    arrow(ctx,tip(-11),tip(15),ink,2);
    text(ctx,'北',...tip(20),{halo:true,size:10});
  }

  function scaleBar(ctx, view, height) {
    const x = 18, y = height-15;
    const length = view.scale*100;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    path(ctx,[[x,y-4],[x,y],[x+length,y],[x+length,y-4]]);
    ctx.stroke();
    text(ctx,'100 米',x+length+6,y-1,{align:'left',halo:true,size:11});
  }

  function map(canvas, getState, surface) {
    let currentView;
    const surfaceImage = surface ? relief(surface) : null;
    const render = drawCanvas(canvas,(ctx,width,height) => {
      const state = getState();
      currentView = model.view(terrain,width,height,state.rotation || 0);
      const {project} = currentView;
      ctx.fillStyle = '#eff3e7';
      ctx.fillRect(0,0,width,height);
      paintBase(ctx,project,state,surfaceImage);
      if (surface) paintContours(ctx,surface,state.interval,project,width);
      if (state.line) {
        const [a,b] = state.line.map(project);
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = pickColor;
        path(ctx,[a,b]);
        ctx.stroke();
        if (state.arrow) {
          const end = model.lerp(a,b,Math.max(.52,1-12/model.distance(a,b)));
          arrow(ctx,a,end,pickColor,2.4);
        }
        marker(ctx,a,'A');
        marker(ctx,b,'B');
      }
      for (const crossing of state.crossings || []) circle(ctx,project(crossing.at),2.8,'#2e6e73','#fff');
      if (state.probe) marker(ctx,project(state.probe),'',probeColor);
      if (state.pending) marker(ctx,project(state.pending),'新 A','#4e4779');
      if (state.draft) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#4e4779';
        ctx.setLineDash([4,4]);
        path(ctx,state.draft.map(project));
        ctx.stroke();
        ctx.setLineDash([]);
      }
      compass(ctx,width,state.rotation || 0);
      scaleBar(ctx,currentView,height);
    });
    function position(event) {
      if (!currentView) return null;
      const rect = canvas.getBoundingClientRect();
      const point = currentView.unproject([event.clientX-rect.left,event.clientY-rect.top]);
      if (point[0]<0 || point[0]>terrain.width || point[1]<0 || point[1]>terrain.height) return null;
      return point;
    }
    function pointAt(event) {
      if (!currentView) return null;
      const rect = canvas.getBoundingClientRect();
      const at = [event.clientX-rect.left,event.clientY-rect.top];
      return points.find(item => model.distance(currentView.project(item.at),at) < 17);
    }
    return {render,position,pointAt};
  }

  function profile(canvas, getState) {
    let axis;
    const render = drawCanvas(canvas,(ctx,width,height) => {
      const {result,index,showCrossings,maxHeight} = getState();
      const left=39, right=width-18, top=27, bottom=height-36;
      axis={left,right};
      const x = t => left+(right-left)*t;
      const y = h => bottom-(bottom-top)*h/maxHeight;
      ctx.fillStyle = '#f1f5ea';
      ctx.fillRect(0,0,width,height);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#c3d1c2';
      for (let h=0; h<=maxHeight; h+=80) {
        path(ctx,[[left,y(h)],[right,y(h)]]);
        ctx.stroke();
        text(ctx,h,left-5,y(h),{align:'right',size:11});
      }
      text(ctx,'海拔 / 米',left,12,{size:11});
      for (const t of [0,.5,1]) {
        text(ctx,Math.round(result.length*t),x(t),bottom+14,{size:11});
      }
      text(ctx,'距 A 的水平距离 / 米',(left+right)/2,height-7,{size:11});
      const elevations = [...result.points,...result.crossings].sort((a,b)=>a.t-b.t);
      const line = elevations.map(p=>[x(p.t),y(p.height)]);
      path(ctx,[...line,[right,bottom],[left,bottom]],true);
      ctx.fillStyle = '#b4cc9b';
      ctx.fill();
      path(ctx,line);
      ctx.strokeStyle = '#466443';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (showCrossings) {
        for (const p of result.crossings) circle(ctx,[x(p.t),y(p.height)],2.7,'#2e6e73','#fff');
      }
      const selected = result.points[index];
      ctx.strokeStyle = probeColor;
      ctx.lineWidth = 1.6;
      path(ctx,[[x(selected.t),top],[x(selected.t),bottom]]);
      ctx.stroke();
      circle(ctx,[x(selected.t),y(selected.height)],5.5,probeColor,'#fff');
      text(ctx,'A',x(0),bottom-10,{halo:true,size:12});
      text(ctx,'B',x(1)-2,bottom-10,{halo:true,size:12});
    });
    function indexAt(event) {
      if (!axis) return null;
      const x = event.clientX-canvas.getBoundingClientRect().left;
      return Math.round(120*model.clamp((x-axis.left)/(axis.right-axis.left),0,1));
    }
    return {render,indexAt};
  }

  window.MapSkillsDiagrams = {map,profile};
})();

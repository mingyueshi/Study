(() => {
  'use strict';

  const radians = degrees => degrees * Math.PI / 180;
  const hubHeight = 2.4;

  function rotorPoint(distance, offset, angle, axis) {
    return [
      axis,
      hubHeight + distance * Math.cos(angle) - offset * Math.sin(angle),
      distance * Math.sin(angle) + offset * Math.cos(angle),
    ];
  }

  function projection(view, width, height) {
    const angle = radians(view);
    const scale = Math.min(width / 6.1, height / 4.65);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return ([axis, height3d, lateral]) => {
      const depth = axis * cos - lateral * sin;
      return {
        x: width / 2 + scale * (axis * sin + lateral * cos),
        y: height * .87 - scale * (height3d * .98 + depth * .2),
        depth: depth * .98 - height3d * .2,
      };
    };
  }

  function ringFaces(faces, first, last, color) {
    for (let index = 0; index < first.length; index += 1) {
      const next = (index + 1) % first.length;
      faces.push({
        points: [first[index], first[next], last[next], last[index]],
        color: Array.isArray(color) ? color[index % color.length] : color,
      });
    }
  }

  function rotorRing(axis, radius, phase = 0) {
    return Array.from({ length: 16 }, (_, index) =>
      rotorPoint(radius, 0, phase + index * Math.PI / 8, axis));
  }

  function draw(canvas, context, view, turn) {
    const project = projection(view, canvas.width, canvas.height);
    const phase = radians(turn);
    const towerRing = (level, radius) => Array.from({ length: 12 }, (_, index) => {
      const angle = index * Math.PI / 6;
      return [.94 + radius * Math.cos(angle), level, radius * Math.sin(angle)];
    });
    const faces = [];
    ringFaces(faces, towerRing(0, .22), towerRing(hubHeight - .22, .13),
      ['#697e86', '#81979f', '#9bb1b8', '#a8bbc1', '#9bb1b8', '#81979f', '#697e86', '#677980', '#65777d', '#64757c', '#65777d', '#677980']);

    const casingFront = rotorRing(.66, .32);
    const casingBack = rotorRing(1.5, .32);
    for (let index = 4; index < 12; index += 1) {
      faces.push({
        points: [casingFront[index], casingFront[index + 1], casingBack[index + 1], casingBack[index]],
        color: index % 2 ? '#40708a' : '#56849b',
      });
    }

    const shaftFront = rotorRing(-.2, .055, phase);
    const shaftBack = rotorRing(1.35, .055, phase);
    ringFaces(faces, shaftFront, shaftBack, ['#ab572b', '#e79a4d']);
    const generatorFront = rotorRing(.78, .17, phase);
    const generatorBack = rotorRing(1.36, .17, phase);
    ringFaces(faces, generatorFront, generatorBack, ['#c6602c', '#efb859', '#dc8036', '#dc8036']);
    faces.push({ points: generatorFront, color: '#f4bc63' });

    const bladeProfile = [[.13, -.07], [.5, -.1], [1.07, -.053], [1.4, .02], [1.38, .09], [.62, .27], [.19, .11]];
    for (let index = 0; index < 3; index += 1) {
      const angle = phase + index * 2 * Math.PI / 3;
      const front = bladeProfile.map(([distance, offset]) => rotorPoint(distance, offset, angle, -.25));
      const back = bladeProfile.map(([distance, offset]) => rotorPoint(distance, offset, angle, -.14));
      ringFaces(faces, front, back, '#267879');
      faces.push({ points: front, color: '#56adab' }, { points: back, color: '#418d90' });
    }
    const hubFront = rotorRing(-.34, .14, phase);
    const hubBack = rotorRing(-.13, .15, phase);
    ringFaces(faces, hubFront, hubBack, ['#ae5b2c', '#e4984a']);
    faces.push({ points: hubFront, color: '#edb35e' });

    const drawFace = (points, color) => {
      context.beginPath();
      points.forEach((point, index) => {
        if (index === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      });
      context.closePath();
      context.fillStyle = color;
      context.fill();
    };

    context.clearRect(0, 0, canvas.width, canvas.height);
    drawFace([[-2.1, 0, -1.45], [2.1, 0, -1.45], [2.1, 0, 1.45], [-2.1, 0, 1.45]].map(project), '#dce9e8');
    const projected = faces.map(face => {
      const points = face.points.map(project);
      const depth = points.reduce((total, point) => total + point.depth, 0) / points.length;
      return { points, depth, color: face.color };
    });
    projected.sort((first, last) => last.depth - first.depth);
    for (const face of projected) drawFace(face.points, face.color);

    const cabin = [casingFront[0], casingBack[0], casingBack[4], casingFront[4]].map(project);
    context.beginPath();
    context.moveTo(cabin[3].x, cabin[3].y);
    for (const point of cabin) context.lineTo(point.x, point.y);
    context.strokeStyle = '#427185';
    context.lineWidth = 2;
    context.setLineDash([7, 5]);
    context.stroke();
    context.setLineDash([]);
  }

  const panel = document.getElementById('energy-turbine');
  const canvas = panel.querySelector('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;
  const view = panel.querySelector('[name="view"]');
  const turn = panel.querySelector('[name="turn"]');

  function update() {
    view.setAttribute('aria-valuetext', `${view.value} 度${view.value === '0' ? '，正面' : view.value === '90' ? '，侧面' : ''}`);
    turn.setAttribute('aria-valuetext', `${turn.value} 度`);
    draw(canvas, context, view.valueAsNumber, turn.valueAsNumber);
  }

  panel.addEventListener('input', update);
  update();
  panel.hidden = false;
})();

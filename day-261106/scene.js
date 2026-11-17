export const rnd = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;
export const FAMS = [
  { name: '노랑', ink: '#f2c94a', sp: [[1, '#efc543', '#b88a1f', .8], [1, '#f3d466', '#c79a2a', .8], [0, '#ebbd38', '#b07f1c', 1.25]] },
  { name: '빨강', ink: '#e0452c', sp: [[0, '#c9341f', '#7f1a10', 1.2], [2, '#bf2a1e', '#781610', 1], [0, '#d8462a', '#8c2414', 1.1]] },
  { name: '주황', ink: '#f08a32', sp: [[0, '#dd7a2a', '#93441a', 1.2], [2, '#d8892f', '#8a4e1c', 1]] },
  { name: '갈색', ink: '#c08c5c', sp: [[2, '#a8774d', '#6e4628', 1], [2, '#bfa07c', '#82664a', .95], [0, '#9b6438', '#5f3a1e', 1.15]] },
  { name: '진갈색', ink: '#7a4a32', sp: [[2, '#5a3020', '#2e160c', .95], [2, '#4a2a1d', '#25130a', 1]] },
  { name: '초록', ink: '#9bbd4a', sp: [[2, '#86a23c', '#4f6a1f', 1], [2, '#a7b84a', '#6b7e25', .95], [1, '#a9b94c', '#6f7e26', .8]] },
];

export function leafPath(ctx, kind, s) {
  ctx.beginPath();
  if (kind === 0) {
    for (let i = 0; i <= 140; i++) {
      const t = i / 140 * TAU - Math.PI / 2;
      const lobe = Math.pow(Math.abs(Math.cos(2.5 * (t + Math.PI / 2))), 1.3), saw = .06 * Math.pow(Math.abs(Math.sin(t * 15)), 3);
      const r = s * (.56 + .44 * lobe + saw) * (1 - .5 * Math.pow(Math.max(0, Math.sin(t)), 6));
      i ? ctx.lineTo(Math.cos(t) * r, Math.sin(t) * r) : ctx.moveTo(Math.cos(t) * r, Math.sin(t) * r);
    }
    ctx.closePath();
  } else if (kind === 1) {
    ctx.moveTo(0, .42 * s);
    ctx.quadraticCurveTo(-.18 * s, .12 * s, -.82 * s, -.32 * s);
    ctx.quadraticCurveTo(-.45 * s, -.92 * s, -.04 * s, -.62 * s);
    ctx.lineTo(0, -.44 * s); ctx.lineTo(.04 * s, -.62 * s);
    ctx.quadraticCurveTo(.45 * s, -.92 * s, .82 * s, -.32 * s);
    ctx.quadraticCurveTo(.18 * s, .12 * s, 0, .42 * s);
    ctx.closePath();
  } else {
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(.58 * s, -.62 * s, .5 * s, .5 * s, 0, .78 * s);
    ctx.bezierCurveTo(-.5 * s, .5 * s, -.58 * s, -.62 * s, 0, -s);
    ctx.closePath();
  }
}

export function makeSprites() {
  const S = 32, P = 2, size = S * 2 * P + 16;
  return FAMS.map(f => f.sp.map(([kind, a, b, sc]) => {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const x = c.getContext('2d'); x.translate(size / 2, size / 2); x.scale(P, P);
    x.save(); x.shadowColor = 'rgba(25,15,6,.5)'; x.shadowBlur = 4 * P; x.shadowOffsetY = 1.2 * P;
    leafPath(x, kind, S * .5); const g = x.createLinearGradient(-S * .4, -S * .5, S * .4, S * .5);
    g.addColorStop(0, a); g.addColorStop(1, b); x.fillStyle = g; x.fill(); x.restore();
    x.save(); leafPath(x, kind, S * .5); x.clip();
    for (let k = 0; k < 7; k++) { x.fillStyle = `rgba(${k % 2 ? '255,236,190' : '45,22,8'},${rnd(.06, .16)})`; x.beginPath(); x.arc(rnd(-S * .4, S * .4), rnd(-S * .4, S * .4), rnd(2, 7), 0, TAU); x.fill(); }
    x.strokeStyle = 'rgba(50,26,10,.4)'; x.lineWidth = .9; x.beginPath();
    if (kind === 0) for (let k = 0; k < 5; k++) { const t = -Math.PI / 2 + k * TAU / 5; x.moveTo(0, S * .1); x.lineTo(Math.cos(t) * S * .42, Math.sin(t) * S * .42); }
    else if (kind === 1) for (let k = -3; k <= 3; k++) { x.moveTo(0, S * .2); x.lineTo(k * S * .11, -S * .36); }
    else { x.moveTo(0, -S * .48); x.lineTo(0, S * .38); for (let k = 1; k < 5; k++) { const y = -S * .4 + k * S * .15; x.moveTo(0, y + S * .05); x.lineTo(S * .2, y - S * .05); x.moveTo(0, y + S * .05); x.lineTo(-S * .2, y - S * .05); } }
    x.stroke(); x.restore();
    x.strokeStyle = b; x.lineWidth = 1.3; x.lineCap = 'round'; x.beginPath();
    const st = kind === 1 ? S * .2 : kind === 0 ? S * .08 : S * .38; x.moveTo(0, st); x.quadraticCurveTo(S * .04, st + S * .14, S * .02, st + S * .26); x.stroke();
    return { c, size, sc };
  }));
}

export function makeGround(W, H, DPR) {
  const c = document.createElement('canvas'); c.width = W * DPR; c.height = H * DPR;
  const x = c.getContext('2d'); x.scale(DPR, DPR);
  x.fillStyle = '#4f514f'; x.fillRect(0, 0, W, H);
  const U = 46, J = 2.5;
  const brick = (X, Y, w, h) => {
    const v = rnd(-9, 9); x.fillStyle = `rgb(${118 + v},${119 + v},${117 + v})`; x.fillRect(X + J, Y + J, w - J * 2, h - J * 2);
    x.fillStyle = 'rgba(255,255,255,.07)'; x.fillRect(X + J, Y + J, w - J * 2, 1.2);
    x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(X + J, Y + h - J - 1.5, w - J * 2, 1.5);
  };
  for (let j = -1; j * U * 2 < H + U * 2; j++) for (let i = -1; i * U * 2 < W + U * 2; i++) {
    const X = i * U * 2, Y = j * U * 2, hor = (i + j) % 2 === 0;
    if (hor) { brick(X, Y, U * 2, U); brick(X, Y + U, U * 2, U); } else { brick(X, Y, U, U * 2); brick(X + U, Y, U, U * 2); }
  }
  for (let k = 0; k < 220; k++) {
    const vert = Math.random() < .5, X = Math.round(rnd(0, W) / U) * U, Y = Math.round(rnd(0, H) / U) * U;
    x.fillStyle = `rgba(${rnd(70, 100)},${rnd(110, 140)},${rnd(40, 60)},${rnd(.3, .6)})`;
    vert ? x.fillRect(X - 1.5, Y + rnd(0, U), 3, rnd(6, 30)) : x.fillRect(X + rnd(0, U), Y - 1.5, rnd(6, 30), 3);
  }
  const id = x.getImageData(0, 0, c.width, c.height), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - .5) * 30 + (Math.random() < .015 ? 40 : 0); d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  x.putImageData(id, 0, 0);
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, 'rgba(255,210,150,.14)'); g.addColorStop(1, 'rgba(40,50,70,.16)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  return c;
}

export function makeShade(W, H, DPR) {
  const M = 60, c = document.createElement('canvas'); c.width = (W + M * 2) * DPR; c.height = (H + M * 2) * DPR;
  const x = c.getContext('2d'); x.scale(DPR, DPR); x.translate(M, M);
  x.filter = 'blur(8px)';
  [[-W * .08, -H * .1], [W * 1.08, -H * .05], [W * 1.05, H * 1.05], [-W * .06, H * 1.08]].forEach(([tx, ty]) => {
    const R = Math.max(W, H) * rnd(.2, .26);
    for (let k = 0; k < 220; k++) {
      const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * R;
      x.fillStyle = `rgba(20,26,48,${rnd(.05, .11)})`; x.beginPath(); x.arc(tx + Math.cos(a) * r, ty + Math.sin(a) * r, rnd(8, 34), 0, TAU); x.fill();
    }
  });
  x.filter = 'none'; x.globalCompositeOperation = 'destination-out';
  for (let k = 0; k < 120; k++) { x.fillStyle = `rgba(0,0,0,${rnd(.3, .8)})`; x.beginPath(); x.ellipse(rnd(-M, W + M), rnd(-M, H + M), rnd(3, 12), rnd(2, 8), rnd(0, 3), 0, TAU); x.fill(); }
  return { c, M };
}

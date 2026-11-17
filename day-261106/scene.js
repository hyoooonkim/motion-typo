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

const D2R = Math.PI / 180;
function maplePts(s) {
  const tips = [[-148, .82], [-90, 1], [-32, .82], [28, .52], [152, .52]].map(([a, l]) => [(a + rnd(-7, 7)) * D2R, l * rnd(.9, 1.08)]);
  const seq = [...tips.slice(0, 4), [Math.PI / 2, .12, 1], tips[4]], pts = [];
  for (let i = 0; i < seq.length; i++) {
    const [a, la, sa] = seq[i], nx = seq[(i + 1) % seq.length], lb = nx[1], stem = sa || nx[2];
    let b = nx[0]; if (b <= a) b += TAU;
    const rs = stem ? .18 : rnd(.44, .54), n = 16;
    for (let k = 0; k < n; k++) {
      const t = k / n, ang = a + (b - a) * t;
      let r = t < .5 ? la + (rs - la) * Math.pow(t * 2, 2.4) : rs + (lb - rs) * (1 - Math.pow(1 - (t - .5) * 2, 2.4));
      if (k % 2 && !stem) r *= 1 + rnd(.05, .11) * Math.min(1, Math.abs(t - .5) * 3);
      pts.push([Math.cos(ang) * r * s, Math.sin(ang) * r * s]);
    }
  }
  return { pts, veins: tips.map(([a, l]) => [Math.cos(a) * l * s * .92, Math.sin(a) * l * s * .92]), base: [0, 0], stem: [0, s * .12] };
}
function ginkgoPts(s) {
  const pts = [], cy = s * .42, notch = rnd(.1, .3), A0 = -142 * D2R, A1 = -38 * D2R, ph = rnd(0, 9);
  pts.push([0, cy]);
  for (let k = 1; k < 8; k++) { const t = k / 8, ex = Math.cos(A0) * s * 1.15, ey = cy + Math.sin(A0) * s * 1.15; pts.push([ex * t * (1 - .12 * Math.sin(t * Math.PI)), cy + (ey - cy) * t]); }
  for (let k = 0; k <= 48; k++) {
    const a = A0 + (A1 - A0) * k / 48, d = (a + Math.PI / 2) / .07;
    const r = s * 1.15 * (.97 + .035 * Math.sin(a * 30 + ph)) * (1 - notch * Math.exp(-d * d));
    pts.push([Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  for (let k = 7; k > 0; k--) { const t = k / 8, ex = Math.cos(A1) * s * 1.15, ey = cy + Math.sin(A1) * s * 1.15; pts.push([ex * t * (1 - .12 * Math.sin(t * Math.PI)), cy + (ey - cy) * t]); }
  const veins = []; for (let k = 0; k <= 12; k++) { const a = A0 + (A1 - A0) * (k + .5) / 13; veins.push([Math.cos(a) * s * 1.05, cy + Math.sin(a) * s * 1.05]); }
  return { pts, veins, base: [0, cy], stem: [0, cy], fan: 1 };
}
function ovalPts(s) {
  const pts = [], w = s * rnd(.42, .55), h = s, N = 80, teeth = Math.round(rnd(22, 34)), sk = rnd(-.06, .06);
  for (let k = 0; k < N; k++) {
    const u = k / N * TAU, saw = 1 + .045 * ((k * teeth / N) % 1);
    const x = w * Math.sin(u) * (1 - .55 * Math.pow(Math.cos(u / 2), 8)) * (Math.sin(u) > 0 ? 1 + sk : 1 - sk) * saw, y = -h * Math.cos(u) * (Math.cos(u) < 0 ? .82 : 1) * saw;
    pts.push([x, y]);
  }
  const veins = []; for (let k = 1; k < 7; k++) { const y = -h * .8 + k * h * .24; veins.push([w * .8, y - h * .2], [-w * .8, y - h * .2], [0, y]); }
  return { pts, veins, base: [0, h * .8], stem: [0, h * .8], mid: [[0, h * .8], [0, -h * .92]], w };
}
const tracePts = pts => { const p = new Path2D(); pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); return p; };
const shift = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = c => Math.max(0, Math.min(255, Math.round(c * k))); return `rgb(${f(n >> 16)},${f(n >> 8 & 255)},${f(n & 255)})`; };

function drawLeaf(x, kind, s, ca, cb, dry) {
  const L = kind === 0 ? maplePts(s) : kind === 1 ? ginkgoPts(s) : ovalPts(s), path = tracePts(L.pts);
  x.strokeStyle = shift(cb, .8); x.lineWidth = s * .05; x.lineCap = 'round';
  x.beginPath(); x.moveTo(...L.stem); const sl = s * rnd(.35, .6), bend = rnd(-.2, .2) * s; x.quadraticCurveTo(L.stem[0] + bend, L.stem[1] + sl * .6, L.stem[0] + bend * .6, L.stem[1] + sl); x.stroke();
  x.save(); x.shadowColor = 'rgba(25,14,5,.55)'; x.shadowBlur = s * .22; x.shadowOffsetX = s * .05; x.shadowOffsetY = s * .09;
  const k = rnd(.88, 1.12), g = x.createRadialGradient(rnd(-.2, .2) * s, -s * .2, s * .1, 0, 0, s * 1.1);
  g.addColorStop(0, shift(ca, k * 1.08)); g.addColorStop(.6, shift(ca, k)); g.addColorStop(1, shift(cb, k));
  x.fillStyle = g; x.fill(path); x.restore();
  x.save(); x.clip(path);
  for (let i = 0; i < 10; i++) { x.fillStyle = `rgba(${Math.random() < .5 ? '255,240,200' : '60,28,8'},${rnd(.04, .12)})`; x.beginPath(); x.ellipse(rnd(-s, s), rnd(-s, s), rnd(.08, .3) * s, rnd(.06, .2) * s, rnd(0, 3), 0, TAU); x.fill(); }
  if (dry || Math.random() < .5) for (let i = 0; i < (dry ? 9 : 4); i++) { x.fillStyle = `rgba(55,28,10,${rnd(.15, .45)})`; x.beginPath(); x.arc(rnd(-s * .7, s * .7), rnd(-s * .8, s * .6), rnd(.015, .06) * s, 0, TAU); x.fill(); }
  x.lineJoin = 'round'; x.strokeStyle = `rgba(70,34,10,${dry ? .55 : rnd(.2, .38)})`; x.lineWidth = s * rnd(.14, .26); x.filter = `blur(${(s * .05).toFixed(1)}px)`; x.stroke(path); x.filter = 'none';
  x.fillStyle = Math.random() < .5 ? 'rgba(0,0,0,.1)' : 'rgba(255,245,220,.08)'; x.fillRect(L.fan ? -s : 0, -s * 1.2, s * (L.fan ? 1 : 1.2), s * 2.4);
  const vc = kind === 1 ? 'rgba(120,80,20,.28)' : `rgba(${dry ? '60,30,10' : '255,225,170'},${rnd(.14, .26)})`;
  x.strokeStyle = vc; x.lineCap = 'round';
  if (L.mid) { x.lineWidth = s * .045; x.beginPath(); x.moveTo(...L.mid[0]); x.lineTo(...L.mid[1]); x.stroke(); x.lineWidth = s * .02; for (let i = 0; i < L.veins.length; i += 3) { const [, , [, y]] = [L.veins[i], L.veins[i + 1], L.veins[i + 2]]; x.beginPath(); x.moveTo(0, y); x.quadraticCurveTo(L.w * .4, y - s * .06, ...L.veins[i]); x.moveTo(0, y); x.quadraticCurveTo(-L.w * .4, y - s * .06, ...L.veins[i + 1]); x.stroke(); } }
  else { L.veins.forEach(([vx, vy], i) => { x.lineWidth = s * (kind === 1 ? .012 : i === 1 ? .045 : .035); x.beginPath(); x.moveTo(...L.base); x.lineTo(vx, vy); x.stroke(); if (kind === 0) { x.lineWidth = s * .015; for (let t = .3; t < .9; t += .2) { const px = vx * t, py = vy * t, a = Math.atan2(vy, vx); x.moveTo(px, py); x.lineTo(px + Math.cos(a + .7) * s * .15, py + Math.sin(a + .7) * s * .15); x.moveTo(px, py); x.lineTo(px + Math.cos(a - .7) * s * .15, py + Math.sin(a - .7) * s * .15); } x.stroke(); } }); }
  x.restore();
}

export function makeSprites() {
  const S = 34, P = 2.5, size = Math.ceil(S * 1.7 * P);
  return FAMS.map(f => {
    const out = [];
    for (let v = 0; v < 7; v++) {
      const [kind, a, b, sc] = f.sp[v % f.sp.length], c = document.createElement('canvas'); c.width = c.height = size;
      const x = c.getContext('2d'); x.translate(size / 2, size / 2); x.scale(P, P);
      const curl = Math.random() < .3; if (curl) x.scale(rnd(.68, .85), 1);
      drawLeaf(x, kind, S * .5, a, b, f.name === '갈색' || f.name === '진갈색' ? Math.random() < .6 : Math.random() < .15);
      out.push({ c, size, sc, P });
    }
    return out;
  });
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

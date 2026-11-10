const rnd = (a, b) => a + Math.random() * (b - a), clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;
function seeded(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

let cv, ctx, W = 1, H = 1, DPR = 1, S = 1, T = 0;
let bolts = [], dust = [], strokes = [], order = [], full = 0;

const C = [[[.92, .14], [.55, 0], [.12, .2]], [[.12, .2], [.04, .72]], [[.04, .72], [.42, 1], [.92, .86]]];
const G = [[[.92, .14], [.55, 0], [.12, .2]], [[.12, .2], [.04, .72]], [[.04, .72], [.42, 1], [.9, .84], [.92, .56]], [[.92, .56], [.48, .56]]];
const GLYPH = {
  C, G,
  H: [[[.1, 0], [.1, 1]], [[.9, 0], [.9, 1]], [[.1, .5], [.9, .5]]],
  A: [[[.5, 0], [.04, 1]], [[.5, 0], [.96, 1]], [[.22, .64], [.78, .64]]],
  R: [[[.1, 0], [.1, 1]], [[.1, 0], [.72, .04], [.86, .26], [.62, .48], [.1, .5]], [[.44, .5], [.94, 1]]],
  I: [[[.5, 0], [.5, 1]], [[.18, 0], [.82, 0]], [[.18, 1], [.82, 1]]],
  N: [[[.1, 1], [.1, 0]], [[.1, 0], [.9, 1]], [[.9, 1], [.9, 0]]],
};
const WORD = 'CHARGING';

function jagStroke(pts, rng) {
  const out = [];
  for (let k = 0; k < pts.length - 1; k++) {
    const [ax, ay] = pts[k], [bx, by] = pts[k + 1], len = Math.hypot(bx - ax, by - ay), n = Math.max(2, Math.round(len / .11));
    const nx = -(by - ay) / len, ny = (bx - ax) / len;
    for (let i = k ? 1 : 0; i <= n; i++) {
      const t = i / n, side = i % 2 ? 1 : -1, edge = i === 0 && k === 0 || i === n && k === pts.length - 2;
      const o = edge ? 0 : side * (.025 + rng() * .035);
      out.push({ x: lerp(ax, bx, t) + nx * o, y: lerp(ay, by, t) + ny * o, w: edge ? .25 : .7 + rng() * .6, spike: !edge && rng() < .28 ? (rng() < .5 ? -1 : 1) * (.06 + rng() * .09) : 0 });
    }
  }
  const tipEnd = (a, b) => { const dx = a.x - b.x, dy = a.y - b.y, l = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy, dx) + (rng() - .5) * .9, L = .07 + rng() * .09; return { x: a.x + Math.cos(ang) * L, y: a.y + Math.sin(ang) * L, w: 0, spike: 0 }; };
  out.unshift(tipEnd(out[0], out[1])); out.push(tipEnd(out[out.length - 1], out[out.length - 2]));
  return out;
}
function buildText() {
  const rng = seeded(261110);
  strokes = [];
  [...WORD].forEach((ch, li) => GLYPH[ch].forEach(p => strokes.push({ li, pts: jagStroke(p, rng), r: 0, at: Infinity, glow: 0 })));
  order = strokes.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
}
buildText();

let box = [];
function layoutText() {
  const portrait = W < H * .9, per = portrait ? 4 : 8, lw = W * .86 / per * .74, gap = W * .86 / per * .26, lh = lw * 1.32;
  box = [...WORD].map((_, i) => {
    const row = portrait ? Math.floor(i / 4) : 0, col = portrait ? i % 4 : i;
    return { x: W * .07 + gap / 2 + col * (lw + gap), y: H * (portrait ? .075 : .085) + row * (lh + lw * .35), w: lw, h: lh };
  });
}
const sp = (s, p) => { const b = box[s.li]; return [b.x + p.x * b.w, b.y + p.y * b.h]; };

export function setupFx(canvas) { cv = canvas; ctx = cv.getContext('2d'); }
export function resizeFx(w, h) { W = w; H = h; DPR = Math.min(2, devicePixelRatio || 1); cv.width = W * DPR; cv.height = H * DPR; S = Math.min(W, H) / 800; layoutText(); }
export function resetFx() { strokes.forEach(s => { s.r = 0; s.at = Infinity; s.glow = 0; }); full = 0; bolts = []; dust = []; }
export function setFull(v) { full = v; }

const groupOf = k => order.slice(Math.floor(k * order.length / 6), Math.floor((k + 1) * order.length / 6));
function strokeMid(s) { const p = s.pts[Math.floor(s.pts.length / 2)]; return sp(s, p); }
export function textPoint(k) {
  const g = k == null ? [order[Math.floor(Math.random() * order.length)]] : groupOf(k);
  let best = null;
  g.forEach(i => strokes[i].pts.forEach(p => { const q = sp(strokes[i], p); if (!best || q[1] > best[1]) best = q; }));
  return best;
}
export function strikeText(k) {
  const g = groupOf(k);
  g.forEach((i, j) => {
    const s = strokes[i], m = strokeMid(s);
    s.at = T + .05 + j * .07;
    const x0 = m[0] + rnd(-.12, .12) * W;
    bolt(() => [x0, -20], () => strokeMid(s), { color: '#8fc4ff', power: .75, width: 4.5, delay: j * .07, splash: false });
  });
  return textPoint(k);
}

function mainPath(gens, rough) {
  let p = [{ t: 0, o: 0, w: 1 }, { t: 1, o: 0, w: 1 }];
  for (let g = 0; g < gens; g++) {
    const n = [];
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1], d = b.t - a.t;
      n.push(a, { t: (a.t + b.t) / 2 + rnd(-.18, .18) * d, o: (a.o + b.o) / 2 + rnd(-1, 1) * d * rough, w: rnd(.55, 1.35) });
    }
    n.push(p[p.length - 1]); p = n;
  }
  return p;
}
export function bolt(from, to, o = {}) {
  const b = { from, to, age: -(o.delay || 0), color: o.color || '#5aa0ff', power: o.power ?? 1, width: o.width || 7, splash: o.splash ?? true, back: !!o.back,
    path: mainPath(o.gens || 6, o.rough || .32), branches: [], claws: [],
    pulses: [0, rnd(.06, .11), rnd(.16, .26)].slice(0, (o.power ?? 1) > .7 ? 3 : 2) };
  const nb = Math.round(rnd(2, 5) * (o.branchy ?? 1));
  for (let k = 0; k < nb; k++) b.branches.push({ at: rnd(.15, .8), ang: rnd(.35, .95) * (Math.random() < .5 ? -1 : 1), len: rnd(.1, .3), path: mainPath(4, .45) });
  const nc = Math.round(rnd(6, 10));
  for (let k = 0; k < nc; k++) b.claws.push({ a: -Math.PI / 2 + rnd(-1, 1) * 1.35, l: rnd(.5, 1.2), curl: rnd(-.6, .6), path: mainPath(3, .5) });
  bolts.push(b);
  return b;
}

function project(P, A, B) {
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  return P.map(p => ({ x: A[0] + dx * p.t + nx * p.o * L, y: A[1] + dy * p.t + ny * p.o * L, w: p.w }));
}
function ribbon(P, w0, w1, mul = 1) {
  if (P.length < 2) return;
  const Lp = [], Rp = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
    const w = lerp(w0, w1, i / (P.length - 1)) * (P[i].w ?? 1) * mul / 2;
    Lp.push([P[i].x - dy / l * w, P[i].y + dx / l * w]); Rp.push([P[i].x + dy / l * w, P[i].y - dx / l * w]);
  }
  ctx.beginPath(); ctx.moveTo(Lp[0][0], Lp[0][1]);
  Lp.forEach(q => ctx.lineTo(q[0], q[1])); for (let i = Rp.length - 1; i >= 0; i--) ctx.lineTo(Rp[i][0], Rp[i][1]);
  ctx.closePath(); ctx.fill();
}
function glowRibbon(P, w0, w1, color, I) {
  ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 26 * S;
  ctx.globalAlpha = clamp(.55 * I); ctx.fillStyle = color; ribbon(P, w0, w1, 2.6);
  ctx.shadowBlur = 10 * S; ctx.globalAlpha = clamp(.9 * I); ribbon(P, w0, w1, 1.5);
  ctx.restore();
  ctx.globalAlpha = clamp(I); ctx.fillStyle = '#ffffff'; ribbon(P, w0, w1, .62); ctx.globalAlpha = 1;
}
const boltI = b => b.pulses.reduce((s, p) => s + (b.age >= p ? Math.exp(-(b.age - p) * 12) : 0), 0) + (b.age < 1 ? .18 * (1 - b.age) : 0);

function drawBolt(b) {
  if (b.age < 0) return;
  const A = b.from(), B = b.to(), I = boltI(b) * b.power, prog = clamp(b.age / .07), w = b.width * S + 1;
  if (I < .02) return;
  const P = project(b.path, A, B).filter((_, i, arr) => i / (arr.length - 1) <= prog + .001);
  glowRibbon(P, w * .55, w, b.color, I);
  const L = Math.hypot(B[0] - A[0], B[1] - A[1]), dir = Math.atan2(B[1] - A[1], B[0] - A[0]);
  b.branches.forEach(br => {
    if (br.at > prog) return;
    const s = project([{ t: br.at, o: 0 }], A, B)[0], i = Math.round(br.at * (P.length - 1)), base = P[Math.min(i, P.length - 1)] || s;
    const ang = dir + br.ang, e = [base.x + Math.cos(ang) * L * br.len, base.y + Math.sin(ang) * L * br.len];
    glowRibbon(project(br.path, [base.x, base.y], e), w * .5, 0, b.color, I * .75);
  });
  if (b.splash && prog >= 1) {
    const grow = clamp((b.age - .07) / .12), R = 70 * S * b.power;
    b.claws.forEach(c => {
      const e = [B[0] + Math.cos(c.a) * R * c.l * grow, B[1] + Math.sin(c.a) * R * c.l * grow * .8];
      const Pc = project(c.path, B, e).map((p, i, arr) => { const t = i / (arr.length - 1); return { x: p.x + Math.cos(c.a + Math.PI / 2) * c.curl * R * t * t * grow, y: p.y + Math.sin(c.a + Math.PI / 2) * c.curl * R * t * t * grow, w: p.w }; });
      glowRibbon(Pc, w * .9, 0, b.color, I * .9);
    });
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(B[0], B[1]); ctx.scale(1, .32);
    const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.3);
    rg.addColorStop(0, `rgba(255,255,255,${clamp(I) * .9})`); rg.addColorStop(.25, b.color); rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = clamp(I); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, R * 1.3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    if (b.age < .1) for (let k = 0; k < 3; k++) dust.push({ x: B[0], y: B[1], vx: rnd(-1, 1) * 260 * S, vy: -rnd(80, 380) * S, life: rnd(.4, .9), c: b.color });
  }
}

function strokePoly(P, wgt, mul) {
  ribbon(P, wgt, wgt, mul);
  P.forEach((p, i) => {
    if (!p.spike || i === 0 || i === P.length - 1) return;
    const a = P[i - 1], b = P[i + 1], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, tx = dx / l, ty = dy / l, k = wgt * .45 * mul;
    ctx.beginPath(); ctx.moveTo(p.x - tx * k, p.y - ty * k); ctx.lineTo(p.x + tx * k, p.y + ty * k);
    ctx.lineTo(p.x - ty * p.spike - tx * k * .2, p.y + tx * p.spike + ty * k * .2); ctx.closePath(); ctx.fill();
  });
}
function drawText(dt, flash) {
  const pulse = full ? .5 + .5 * Math.sin(T * 3.2) : 0, glowC = full ? '#ffc861' : '#7cc8ff';
  strokes.forEach(s => {
    const b = box[s.li], wgt = b.w * .15, P = s.pts.map(p => { const [x, y] = sp(s, p); return { x, y, w: p.w, spike: p.spike * b.w }; });
    if (T >= s.at && s.r < 1) { if (s.r === 0) s.glow = 1; s.r = Math.min(1, s.r + dt * 4.5); }
    s.glow = Math.max(0, s.glow - dt * 1.2);
    if (s.r < 1 && flash > .05) { ctx.globalAlpha = clamp(flash * .2); ctx.fillStyle = '#c9d8ff'; strokePoly(P, wgt, 1); ctx.globalAlpha = 1; }
    if (s.r <= 0) return;
    const Q = P.slice(0, Math.max(2, Math.ceil(P.length * s.r)));
    ctx.fillStyle = 'rgba(0,0,0,.9)'; strokePoly(Q, wgt, 1.45);
    ctx.save(); ctx.shadowColor = glowC; ctx.shadowBlur = (10 + s.glow * 40 + pulse * 18) * S;
    ctx.fillStyle = s.glow > .02 ? `rgb(255,255,255)` : full ? `rgb(255,${244 + pulse * 11},${220 + pulse * 35})` : '#eef3ff';
    ctx.globalAlpha = clamp(.82 + .18 * Math.sin(T * 13 + s.li * 3) * (Math.random() < .2 ? 1 : 0) + s.glow);
    strokePoly(Q, wgt, 1); ctx.restore();
    if (s.r >= 1 && Math.random() < dt * (full ? 4 : 1.4)) {
      const i = Math.floor(rnd(1, P.length - 2)), p = P[i], q = P[Math.min(P.length - 1, i + 2)];
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = glowC; ctx.lineWidth = 1.4 * S + .4; ctx.shadowColor = glowC; ctx.shadowBlur = 12 * S;
      ctx.beginPath(); ctx.moveTo(p.x, p.y);
      for (let k = 1; k <= 4; k++) ctx.lineTo(lerp(p.x, q.x, k / 4) + rnd(-1, 1) * wgt * 1.4, lerp(p.y, q.y, k / 4) + rnd(-1, 1) * wgt * 1.4);
      ctx.stroke(); ctx.restore();
    }
  });
}

export function renderFx(dt, flash) {
  T += dt;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
  let I = 0;
  bolts = bolts.filter(b => { b.age += dt; if (b.age >= 0) I = Math.max(I, boltI(b) * b.power); return b.age < 1.1; });
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; bolts.filter(b => b.back).forEach(drawBolt); ctx.restore();
  drawText(dt, Math.max(flash, I));
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; bolts.filter(b => !b.back).forEach(drawBolt);
  dust = dust.filter(d => {
    d.vy += 900 * S * dt; d.x += d.vx * dt; d.y += d.vy * dt;
    ctx.globalAlpha = clamp(d.life); ctx.fillStyle = d.c; ctx.fillRect(d.x - 1.2 * S, d.y - 1.2 * S, 2.4 * S + .5, 2.4 * S + .5);
    return (d.life -= dt * 1.8) > 0;
  });
  ctx.restore();
  return I;
}

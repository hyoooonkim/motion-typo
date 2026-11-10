const rnd = (a, b) => a + Math.random() * (b - a), clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;

let cv, ctx, W = 1, H = 1, DPR = 1, S = 1, T = 0;
let bolts = [], dust = [];

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

export function renderFx(dt, flash) {
  T += dt;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
  let I = 0;
  bolts = bolts.filter(b => { b.age += dt; if (b.age >= 0) I = Math.max(I, boltI(b) * b.power); return b.age < 1.1; });
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; bolts.filter(b => b.back).forEach(drawBolt); ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; bolts.filter(b => !b.back).forEach(drawBolt);
  dust = dust.filter(d => {
    d.vy += 900 * S * dt; d.x += d.vx * dt; d.y += d.vy * dt;
    ctx.globalAlpha = clamp(d.life); ctx.fillStyle = d.c; ctx.fillRect(d.x - 1.2 * S, d.y - 1.2 * S, 2.4 * S + .5, 2.4 * S + .5);
    return (d.life -= dt * 1.8) > 0;
  });
  ctx.restore();
  drawPops(dt);
  return I;
}

let pops = [];
export function setupFx(canvas) { cv = canvas; ctx = cv.getContext('2d'); }
export function resizeFx(w, h) { W = w; H = h; DPR = Math.min(2, devicePixelRatio || 1); cv.width = W * DPR; cv.height = H * DPR; S = Math.min(W, H) / 800; }
export function resetFx() { bolts = []; dust = []; pops = []; }
export function popup(x, y, text, color = '#ffffff', size = 22) { pops.push({ x, y, text, color, size, age: 0 }); }
function drawPops(dt) {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  pops = pops.filter(p => {
    p.age += dt;
    const k = clamp(p.age / .15), a = clamp(1 - (p.age - .7) / .5), sz = p.size * S * (1.4 - .4 * k) + 4;
    ctx.font = `700 ${sz}px 'IBM Plex Mono', monospace`;
    ctx.globalAlpha = a; ctx.lineWidth = 4 * S + 1; ctx.strokeStyle = 'rgba(0,0,0,.7)';
    ctx.strokeText(p.text, p.x, p.y - p.age * 60 * S); ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y - p.age * 60 * S);
    return p.age < 1.2;
  });
  ctx.globalAlpha = 1;
}

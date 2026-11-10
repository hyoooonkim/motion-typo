const rnd = (a, b) => a + Math.random() * (b - a), clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;
function seeded(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

let cv, ctx, W = 1, H = 1, DPR = 1, S = 1, T = 0;
let bolts = [], dust = [], full = 0;

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

const FONT_URL = 'https://cdn.jsdelivr.net/npm/@fontsource/anton@5.0.8/files/anton-latin-400-normal.woff';
const WORD = 'CHARGING';
const probe = document.createElement('canvas').getContext('2d');
let font = null, letters = [], hitAt = new Array(WORD.length).fill(Infinity), revealed = 0;
const groups = (() => { const r = seeded(1110), idx = [...WORD].map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; } let k = 0; return [2, 1, 1, 2, 1, 1].map(n => idx.slice(k, k += n)); })();
fetch(FONT_URL).then(r => r.arrayBuffer()).then(b => { font = window.opentype.parse(b); buildLetters(); }).catch(e => console.warn('font', e));

export function setupFx(canvas) { cv = canvas; ctx = cv.getContext('2d'); }
export function resizeFx(w, h) { W = w; H = h; DPR = Math.min(2, devicePixelRatio || 1); cv.width = W * DPR; cv.height = H * DPR; S = Math.min(W, H) / 800; if (font) buildLetters(); }
export function resetFx() { hitAt.fill(Infinity); revealed = 0; letters.forEach(L => { L.veins = null; }); full = 0; bolts = []; dust = []; }
export function setFull(v) { full = v; }

function flatten(cmds) {
  const out = []; let cur = null, px = 0, py = 0;
  cmds.forEach(c => {
    if (c.type === 'M') { cur = [[c.x, c.y]]; out.push(cur); }
    else if (c.type === 'L') cur.push([c.x, c.y]);
    else if (c.type === 'Q') for (let i = 1; i <= 6; i++) { const t = i / 6, u = 1 - t; cur.push([u * u * px + 2 * u * t * c.x1 + t * t * c.x, u * u * py + 2 * u * t * c.y1 + t * t * c.y]); }
    else if (c.type === 'C') for (let i = 1; i <= 8; i++) { const t = i / 8, u = 1 - t; cur.push([u * u * u * px + 3 * u * u * t * c.x1 + 3 * u * t * t * c.x2 + t * t * t * c.x, u * u * u * py + 3 * u * u * t * c.y1 + 3 * u * t * t * c.y2 + t * t * t * c.y]); }
    if (c.type !== 'Z') { px = c.x; py = c.y; }
  });
  return out.map(c => { const a = c[0], b = c[c.length - 1]; if (Math.hypot(a[0] - b[0], a[1] - b[1]) < .01) c.pop(); return c; }).filter(c => c.length > 2);
}
const toPath = cs => { const p = new Path2D(); cs.forEach(c => { p.moveTo(c[0][0], c[0][1]); c.forEach(q => p.lineTo(q[0], q[1])); p.closePath(); }); return p; };

function bolted(contours, sz, rng) {
  const base = toPath(contours), inside = (x, y) => probe.isPointInPath(base, x, y, 'nonzero');
  return contours.map(c => {
    const n = c.length, out = [];
    for (let i = 0; i < n; i++) {
      const a = c[i], b = c[(i + 1) % n], pv = c[(i - 1 + n) % n];
      let t1x = a[0] - pv[0], t1y = a[1] - pv[1], l1 = Math.hypot(t1x, t1y) || 1; t1x /= l1; t1y /= l1;
      let t2x = b[0] - a[0], t2y = b[1] - a[1], len = Math.hypot(t2x, t2y) || 1; t2x /= len; t2y /= len;
      if (Math.acos(clamp(t1x * t2x + t1y * t2y, -1, 1)) > .6) {
        let bx = t1x - t2x, by = t1y - t2y, bl = Math.hypot(bx, by) || 1; bx /= bl; by /= bl;
        const L = sz * (.05 + rng() * .14) * (Math.abs(by) > .6 ? 1.6 : 1), tip = [a[0] + bx * L, a[1] + by * L];
        if (!inside(tip[0], tip[1]) && !inside(a[0] + bx * L * .35, a[1] + by * L * .35)) {
          const k = sz * .014; out.push([a[0] - t1x * k, a[1] - t1y * k], [a[0] + bx * L * .55 + t1x * k * .8, a[1] + by * L * .55 + t1y * k * .8], tip, [a[0] + t2x * k, a[1] + t2y * k]);
        } else out.push(a);
      } else out.push(a);
      if (len < sz * .02) continue;
      let nx = t2y, ny = -t2x;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if (inside(mx + nx * 1.5, my + ny * 1.5)) { nx = -nx; ny = -ny; }
      const steps = Math.max(1, Math.floor(len / (sz * .028)));
      for (let k = 1; k < steps; k++) {
        const t = k / steps, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
        const z = (k % 2 ? 1 : -1) * sz * (.004 + rng() * .009);
        out.push([x + nx * z, y + ny * z]);
        if (len > sz * .1 && k > 1 && k < steps - 1 && rng() < (Math.abs(ny) > .7 ? .12 : .03)) {
          const Lt = sz * (.12 + rng() * .26) * (ny > .7 ? 1.5 : .9), w = sz * (.016 + rng() * .02);
          if (inside(x + nx * Lt, y + ny * Lt) || inside(x + nx * Lt * .5, y + ny * Lt * .5)) continue;
          const side = [];
          for (let j = 1; j <= 3; j++) { const f = j / 4, off = (j % 2 ? 1 : -1) * w * (1.4 + rng() * 1.6); side.push([x + nx * Lt * f + t2x * off, y + ny * Lt * f + t2y * off, 1 - f]); }
          out.push([x - t2x * w, y - t2y * w]);
          side.forEach(([px, py, ww]) => out.push([px - t2x * w * ww * .7, py - t2y * w * ww * .7]));
          out.push([x + nx * Lt, y + ny * Lt]);
          for (let j = side.length - 1; j >= 0; j--) { const [px, py, ww] = side[j]; out.push([px + t2x * w * ww * .7, py + t2y * w * ww * .7]); }
          out.push([x + t2x * w, y + t2y * w]);
        }
      }
    }
    return out;
  });
}

function lichten(ox, oy, sz, bb, roots, rnd01 = Math.random) {
  const segs = [], stack = roots.map(a => ({ x: ox, y: oy, a, w: 1, d: 0, life: 70 }));
  while (stack.length && segs.length < 900) {
    let { x, y, a, w, d, life } = stack.pop();
    while (life-- > 0) {
      a += (rnd01() - .5) * 1.1; a = lerp(a, Math.PI / 2, .04);
      const l = sz * (.014 + rnd01() * .018), nx = x + Math.cos(a) * l, ny = y + Math.sin(a) * l;
      if (nx < bb[0] - 4 || nx > bb[2] + 4 || ny < bb[1] - 4 || ny > bb[3] + 4) break;
      segs.push([x, y, nx, ny, w, d]); d += l; x = nx; y = ny;
      if (rnd01() < .17 && w > .2) stack.push({ x, y, a: a + (.5 + rnd01() * .7) * (rnd01() < .5 ? -1 : 1), w: w * .66, d, life: life * .75 | 0 });
    }
  }
  segs.maxD = segs.reduce((m, s) => Math.max(m, s[5]), 1);
  return segs;
}

function makeLetter(cmds, sz, i) {
  const rng = seeded(4000 + i * 97), cs = bolted(flatten(cmds), sz, rng), path = toPath(cs);
  const all = cs.flat(), bb = [Math.min(...all.map(p => p[0])), Math.min(...all.map(p => p[1])), Math.max(...all.map(p => p[0])), Math.max(...all.map(p => p[1]))];
  const pad = sz * .22, ox = bb[0] - pad, oy = bb[1] - pad, cw = bb[2] - bb[0] + pad * 2, ch = bb[3] - bb[1] + pad * 2;
  const mk = () => { const c = document.createElement('canvas'); c.width = Math.ceil(cw * DPR); c.height = Math.ceil(ch * DPR); const g = c.getContext('2d'); g.scale(DPR, DPR); g.translate(-ox, -oy); return [c, g]; };
  const [glow, gg] = mk();
  gg.fillStyle = '#2f7dff'; gg.shadowColor = '#2f7dff'; gg.shadowBlur = sz * .16 * DPR; gg.fill(path); gg.fill(path);
  gg.shadowColor = '#a6e3ff'; gg.shadowBlur = sz * .04 * DPR; gg.fillStyle = '#a6e3ff'; gg.fill(path);
  const [img, g] = mk();
  g.save(); g.translate(sz * .028, sz * .034); g.fillStyle = '#000'; g.fill(path); g.lineJoin = 'miter'; g.miterLimit = 12; g.lineWidth = sz * .03; g.strokeStyle = '#000'; g.stroke(path); g.restore();
  g.lineJoin = 'miter'; g.miterLimit = 12; g.lineWidth = sz * .042; g.strokeStyle = '#000'; g.stroke(path);
  const gr = g.createLinearGradient(0, bb[1], 0, bb[3]);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(.55, '#eef8ff'); gr.addColorStop(1, '#a9dcff');
  g.fillStyle = gr; g.fill(path);
  g.save(); g.clip(path); g.lineCap = 'round';
  const tex = lichten((bb[0] + bb[2]) / 2, bb[1], sz, bb, [Math.PI / 2, Math.PI / 2 - .9, Math.PI / 2 + .9], rng);
  tex.forEach(s => { g.strokeStyle = `rgba(50,130,255,${.25 + s[4] * .4})`; g.lineWidth = .6 + s[4] * 1.6; g.beginPath(); g.moveTo(s[0], s[1]); g.lineTo(s[2], s[3]); g.stroke(); });
  g.restore();
  const [ghost, hg] = mk();
  hg.strokeStyle = '#b8ceff'; hg.lineWidth = Math.max(1, sz * .008); hg.stroke(path);
  const top = all.reduce((m, p) => p[1] < m[1] ? p : m), bottom = all.reduce((m, p) => p[1] > m[1] ? p : m);
  const edge = cs.flatMap(c => c.filter((_, k) => k % 3 === 0));
  return { i, sz, path, bb, ox, oy, cw, ch, glow, img, ghost, top, bottom, edge, veins: null };
}

function buildLetters() {
  const portrait = W < H * .9, lines = portrait ? ['CHAR', 'GING'] : [WORD];
  const upm = font.unitsPerEm, cap = (font.tables.os2 && font.tables.os2.sCapHeight || upm * .72) / upm, track = .03;
  const adv = Math.max(...lines.map(l => font.getAdvanceWidth(l, 1) + track * (l.length - 1)));
  const sz = Math.min(W * .82 / adv, H * (portrait ? .13 : .23) / cap), gap = sz * cap * 1.5, top = H * (portrait ? .1 : .11);
  letters = []; let idx = 0;
  lines.forEach((line, li) => {
    let x = (W - (font.getAdvanceWidth(line, sz) + track * sz * (line.length - 1))) / 2;
    const y = top + sz * cap + li * gap;
    [...line].forEach(chr => { const gl = font.charToGlyph(chr); letters.push(makeLetter(gl.getPath(x, y, sz).commands, sz, idx++)); x += gl.advanceWidth * sz / upm + track * sz; });
  });
  groups.slice(0, revealed).flat().forEach(i => { if (hitAt[i] === Infinity) hitAt[i] = -10; });
}

export function strikeText(k) {
  revealed = Math.max(revealed, k + 1);
  if (!letters.length) { groups[k].forEach(i => { hitAt[i] = -10; }); return [W / 2, H * .25]; }
  let low = null;
  groups[k].forEach((i, j) => {
    const L = letters[i], at = [L.top[0], L.top[1]];
    hitAt[i] = T + .1 + j * .08;
    L.veins = lichten(at[0], at[1], L.sz, L.bb, [Math.PI / 2, Math.PI / 2 - .7, Math.PI / 2 + .7, Math.PI / 2 + rnd(-.3, .3)]);
    const x0 = at[0] + rnd(-.08, .08) * W;
    bolt(() => [x0, -20], () => at, { color: '#8fc4ff', power: .85, width: 5, delay: j * .08, splash: true });
    if (!low || L.bottom[1] > low[1]) low = L.bottom;
  });
  return low;
}
export function textPoint() {
  if (!letters.length) return [W / 2, H * .25];
  return letters[Math.floor(Math.random() * letters.length)].bottom;
}

function drawText(dt, flash) {
  const pulse = full ? .5 + .5 * Math.sin(T * 3.2) : 0;
  letters.forEach(L => {
    const age = T - hitAt[L.i], v = clamp(age / .42), f = clamp((age - .32) / .3);
    if (f < 1 && flash > .04) { ctx.globalAlpha = clamp(flash * .5); ctx.drawImage(L.ghost, L.ox, L.oy, L.cw, L.ch); }
    if (v > 0 && L.veins && age < 1.8) {
      const fade = clamp(1 - (age - .7) / 1.1), lim = v * L.veins.maxD;
      ctx.save(); ctx.clip(L.path); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      [['rgba(70,160,255,', 4.5, .55], ['rgba(255,255,255,', 1.4, 1]].forEach(([c, w, a]) => {
        L.veins.forEach(s => { if (s[5] > lim) return; const front = clamp(1 - (lim - s[5]) / (L.sz * .25)); ctx.strokeStyle = c + clamp((a + front * .5) * fade) + ')'; ctx.lineWidth = (w * s[4] + .4) * S * 1.4; ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(s[2], s[3]); ctx.stroke(); });
      });
      ctx.restore();
    }
    if (f <= 0) return;
    const fl = .8 + .2 * Math.sin(T * 11 + L.i * 2.3) * (Math.random() < .2 ? 1 : .3), wf = Math.exp(-Math.max(0, age - .32) * 3.5);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = clamp(f * (.5 * fl + pulse * .35 + flash * .35 + wf * .8)); ctx.drawImage(L.glow, L.ox, L.oy, L.cw, L.ch);
    ctx.restore();
    ctx.globalAlpha = f; ctx.drawImage(L.img, L.ox, L.oy, L.cw, L.ch);
    if (wf > .03) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = wf * .9; ctx.drawImage(L.img, L.ox, L.oy, L.cw, L.ch); ctx.restore(); }
    ctx.globalAlpha = 1;
    if (f >= 1 && Math.random() < dt * (full ? 6 : 1.8)) {
      const k = Math.floor(Math.random() * (L.edge.length - 3)), p = L.edge[k], q = L.edge[k + 3];
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#9fdcff'; ctx.lineWidth = 1.5 * S + .5; ctx.shadowColor = '#4fa8ff'; ctx.shadowBlur = 14 * S;
      ctx.beginPath(); ctx.moveTo(p[0], p[1]);
      for (let j = 1; j <= 5; j++) ctx.lineTo(lerp(p[0], q[0], j / 5) + rnd(-1, 1) * L.sz * .05, lerp(p[1], q[1], j / 5) + rnd(-1, 1) * L.sz * .05);
      ctx.stroke(); ctx.restore();
    }
  });
}

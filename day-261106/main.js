import { rnd, FAMS, makeSprites, makeGround, makeShade } from './scene.js';
import { SHAPES, buildMask, drawGuide, areaByFam } from './shapes.js';

const cv = document.getElementById('c'), ctx = cv.getContext('2d'), $ = id => document.getElementById(id);
const TAU = Math.PI * 2, CELL = 12, CAP = 9, MIX = [.3, .2, .12, .18, .1, .1];
const sprites = makeSprites(), areaCache = {};
let W = 1, H = 1, DPR = 1, gw = 1, gh = 1, LS = 1, ground, shade, counts, fcount, keys;
let leaves = [], order = [], zones = [], T = 0, frame = 0;
let tool = 'broom', shapeName = '', mask = null, maskCells = [], guide = null, done = false, fillPct = 0, gust = { x: 0, y: 0, t: 0 }, touched = 0;
const P = { x: -999, y: -999, lx: 0, ly: 0, vx: 0, vy: 0, down: false, over: false, ang: 0 };

const gauss = () => Math.sqrt(-2 * Math.log(Math.random() || 1e-6)) * Math.cos(TAU * Math.random());
const radius = () => tool === 'broom' ? 46 * LS : tool === 'blower' ? 130 * LS : 30 * LS;

function makeLeaf(f, x, y) {
  const list = sprites[f], spr = list[Math.floor(Math.random() * list.length)];
  return { x, y, vx: 0, vy: 0, a: rnd(0, TAU), va: 0, z: rnd(40, 260), vz: 0, f, spr, s: spr.sc * rnd(.82, 1.15), ph: rnd(0, TAU), k: Math.random(), t: 0, held: false, hx: 0, hy: 0, ci: -1 };
}
function scatter() {
  const N = Math.round(Math.max(900, Math.min(2600, W * H / 520))), sig = Math.min(W, H) * .13;
  leaves = [];
  for (let i = 0; i < N; i++) {
    let r = Math.random(), f = 0; while (f < 5 && r > MIX[f]) r -= MIX[f++];
    const [zx, zy] = zones[f], uni = Math.random() < .1;
    const x = uni ? rnd(0, W) : zx + gauss() * sig, y = uni ? rnd(0, H) : zy + gauss() * sig * .9;
    leaves.push(makeLeaf(f, Math.max(6, Math.min(W - 6, x)), Math.max(6, Math.min(H - 6, y))));
  }
  order = leaves.map((_, i) => i); keys = new Float32Array(N);
}

function resize() {
  const ow = W, oh = H;
  W = innerWidth || 1; H = innerHeight || 1; DPR = Math.min(2, devicePixelRatio || 1);
  cv.width = W * DPR; cv.height = H * DPR;
  gw = Math.ceil(W / CELL) + 2; gh = Math.ceil(H / CELL) + 2;
  counts = new Uint16Array(gw * gh); fcount = new Uint16Array(gw * gh * 6);
  LS = Math.max(.8, Math.min(1.2, Math.min(W, H) / 700));
  ground = makeGround(W, H, DPR); shade = makeShade(W, H, DPR);
  zones = FAMS.map((_, f) => { const a = -2.5 + f * TAU / 6; return [W / 2 + Math.cos(a) * W * .37, H / 2 + Math.sin(a) * H * .35]; });
  if (!leaves.length) scatter(); else leaves.forEach(l => { l.x *= W / ow; l.y *= H / oh; });
  setShape(shapeName);
}

function setShape(name) {
  shapeName = name; done = false; mask = null; guide = null;
  $('score').className = name ? '' : 'hide';
  $('hint').textContent = name ? `점선 안을 같은 색 낙엽으로 채워 보세요 · ${SHAPES[name].name}` : '색깔별로 모인 낙엽을 쓸고 옮겨서 그림을 만들어 보세요';
  if (!name) return;
  const area = areaCache[name] || (areaCache[name] = areaByFam(name)), avail = [0, 0, 0, 0, 0, 0];
  leaves.forEach(l => avail[l.f]++);
  const cover = Math.pow(32 * LS, 2) * (SHAPES[name].easy ? .2 : .3);
  const barH = $('bar').getBoundingClientRect().height + 24;
  let S = Math.min(W * .42, (H - barH - 60) * .48);
  area.forEach((a, f) => { if (a) S = Math.min(S, 100 * Math.sqrt(avail[f] * .8 * cover / a)); });
  const cx = W / 2, cy = 50 + (H - barH - 50) / 2;
  mask = buildMask(name, S, cx, cy, gw, gh, CELL);
  maskCells = []; mask.forEach((v, i) => { if (v !== -2) maskCells.push(i); });
  guide = document.createElement('canvas'); guide.width = W * DPR; guide.height = H * DPR;
  const g = guide.getContext('2d'); g.scale(DPR, DPR); drawGuide(g, name, S, cx, cy, FAMS.map(f => f.ink));
}

function score() {
  let ok = 0;
  for (const i of maskCells) {
    const v = mask[i];
    if (v === -1) { if (!counts[i]) ok++; continue; }
    let good = 0, bad = 0;
    for (const n of [i, i - 1, i + 1, i - gw, i + gw]) for (let f = 0; f < 6; f++) { const c = fcount[n * 6 + f]; f === v ? good += c : bad += c; }
    if (good && good >= bad) ok++;
  }
  fillPct = ok / maskCells.length;
  $('fill').textContent = Math.round(fillPct * 100);
  if (!done && fillPct >= (SHAPES[shapeName].easy ? .7 : .75)) { done = true; $('score').className = 'done'; $('hint').textContent = '완성! 사진으로 남겨 보세요'; chime(); }
}

function grab() {
  const R = radius(), near = [];
  leaves.forEach((l, i) => { const d = Math.hypot(l.x - P.x, l.y - P.y); if (d < R && l.z < 20) near.push([keys[i] || 0, l]); });
  near.sort((a, b) => b[0] - a[0]).slice(0, 45).forEach(([, l]) => { l.held = true; l.hx = (l.x - P.x) * .6; l.hy = (l.y - P.y) * .6; });
}
function release() {
  leaves.forEach(l => { if (l.held) { l.held = false; l.t = .5; l.vz = rnd(0, 20); l.vx = P.vx * .25 + rnd(-30, 30); l.vy = P.vy * .25 + rnd(-30, 30); l.va = rnd(-3, 3); } });
}

function step(dt) {
  T += dt; frame++;
  if (dt > 0) { P.vx += ((P.x - P.lx) / dt - P.vx) * Math.min(1, dt * 20); P.vy += ((P.y - P.ly) / dt - P.vy) * Math.min(1, dt * 20); }
  P.lx = P.x; P.ly = P.y;
  const sp = Math.hypot(P.vx, P.vy);
  if (sp > 12) { const t = Math.atan2(P.vy, P.vx); let d = t - P.ang; d = Math.atan2(Math.sin(d), Math.cos(d)); P.ang += d * Math.min(1, dt * 10); }
  counts.fill(0); fcount.fill(0);
  for (const l of leaves) {
    if (l.held || l.z > 3) { l.ci = -1; continue; }
    l.ci = (Math.floor(l.y / CELL) + 1) * gw + Math.floor(l.x / CELL) + 1; counts[l.ci]++; fcount[l.ci * 6 + l.f]++;
  }
  const R = radius(), R2 = R * R; touched = 0;
  if (gust.t > 0) gust.t -= dt;
  for (const l of leaves) {
    if (l.held) { l.x += (P.x + l.hx - l.x) * Math.min(1, dt * 18); l.y += (P.y + l.hy - l.y) * Math.min(1, dt * 18); l.z = 14; l.vz = 0; l.vx = l.vy = 0; continue; }
    if (P.down) {
      const dx = l.x - P.x, dy = l.y - P.y, d2 = dx * dx + dy * dy;
      if (d2 < R2) {
        const d = Math.sqrt(d2) || 1, w = 1 - d / R;
        if (tool === 'broom' && l.z < 20) {
          l.t = .5;
          const k = Math.min(1, w * dt * 16); l.vx += (P.vx * 1.06 - l.vx) * k; l.vy += (P.vy * 1.06 - l.vy) * k;
          if (sp > 30) { l.va += rnd(-1, 1) * w * sp * dt * .06; touched++; }
        } else if (tool === 'blower') {
          l.t = .5;
          const f = w * w * 2400 * dt; l.vx += dx / d * f + P.vx * w * dt * 2; l.vy += dy / d * f + P.vy * w * dt * 2;
          if (w > .4 && Math.random() < dt * 5) l.vz = Math.max(l.vz, rnd(30, 100) * w);
          l.va += rnd(-1, 1) * w * 24 * dt; touched++;
        }
      }
    }
    if (gust.t > 0) { l.t = .5; const g = Math.min(1, gust.t) * (.4 + l.k); l.vx += gust.x * g * dt; l.vy += gust.y * g * dt; if (Math.random() < dt * .8 * g) l.vz = Math.max(l.vz, rnd(20, 80)); l.va += rnd(-1, 1) * g * 10 * dt; }
    if (l.ci >= 0) {
      const c = counts[l.ci];
      if (c > CAP && (l.t > 0 || c > CAP * 3)) {
        const push = (c - CAP) * dt * 6;
        l.vx -= (counts[l.ci + 1] - counts[l.ci - 1]) * push + rnd(-1, 1) * push;
        l.vy -= (counts[l.ci + gw] - counts[l.ci - gw]) * push + rnd(-1, 1) * push;
      }
    }
    if (l.t > 0) l.t -= dt;
    let fr = 7;
    if (l.z > 0 || l.vz > 0) {
      l.vz = Math.max(-70, l.vz - 120 * dt); l.z += l.vz * dt; l.vx += Math.sin(T * 2.6 + l.ph) * 40 * dt; fr = 1.2;
      if (l.z <= 0) { l.z = 0; l.vz = 0; }
    }
    const e = Math.exp(-fr * dt); l.vx *= e; l.vy *= e;
    if (!l.z && l.vx * l.vx + l.vy * l.vy < 4) l.vx = l.vy = 0;
    l.x += l.vx * dt; l.y += l.vy * dt; l.a += l.va * dt; l.va *= Math.exp(-4 * dt);
    if (l.x < 4) { l.x = 4; l.vx = Math.abs(l.vx) * .3; } else if (l.x > W - 4) { l.x = W - 4; l.vx = -Math.abs(l.vx) * .3; }
    if (l.y < 4) { l.y = 4; l.vy = Math.abs(l.vy) * .3; } else if (l.y > H - 4) { l.y = H - 4; l.vy = -Math.abs(l.vy) * .3; }
  }
  if (frame % 8 === 0) {
    leaves.forEach((l, i) => { keys[i] = l.held || l.z > 1 ? 1e5 + l.z : (l.ci >= 0 ? counts[l.ci] : 0) * 4 + l.k * 3; });
    order.sort((a, b) => keys[a] - keys[b]);
  }
  if (mask && frame % 12 === 0) score();
  sound(sp);
}

function drawTool() {
  if (!(P.over || P.down) || P.x < -100) return;
  const R = radius();
  ctx.save(); ctx.translate(P.x, P.y); ctx.rotate(P.ang);
  if (tool === 'broom') {
    ctx.fillStyle = 'rgba(20,12,4,.22)'; ctx.beginPath(); ctx.ellipse(-60, 14, 140, 18, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7a4f2a'; ctx.fillRect(-210, -4, 190, 8); ctx.fillStyle = '#a0703f'; ctx.fillRect(-210, -4, 190, 2.5);
    ctx.fillStyle = '#b3402a'; ctx.fillRect(-26, -9, 10, 18);
    const g = ctx.createLinearGradient(-18, 0, R * .3, 0); g.addColorStop(0, '#9b7b3c'); g.addColorStop(1, '#d9bc74');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-18, -10); ctx.lineTo(R * .25, -R * .95); ctx.quadraticCurveTo(R * .42, 0, R * .25, R * .95); ctx.lineTo(-18, 10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(90,60,20,.55)'; ctx.lineWidth = 1;
    for (let k = -6; k <= 6; k++) { ctx.beginPath(); ctx.moveTo(-14, k * 1.4); ctx.lineTo(R * .3, k / 6 * R * .9); ctx.stroke(); }
  } else if (tool === 'blower') {
    if (P.down) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.2; for (let k = 0; k < 7; k++) { const y = rnd(-R * .4, R * .4), x0 = rnd(0, R * .4); ctx.beginPath(); ctx.moveTo(x0, y * .4); ctx.lineTo(x0 + rnd(20, 60), y); ctx.stroke(); } }
    ctx.fillStyle = 'rgba(20,12,4,.22)'; ctx.beginPath(); ctx.ellipse(-90, 16, 120, 16, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3d3f42'; ctx.beginPath(); ctx.roundRect(-200, -8, 196, 16, 8); ctx.fill();
    ctx.fillStyle = '#56595d'; ctx.fillRect(-200, -8, 196, 4);
    ctx.fillStyle = '#e06a1e'; ctx.beginPath(); ctx.roundRect(-250, -24, 64, 48, 12); ctx.fill();
  } else {
    const held = leaves.some(l => l.held);
    ctx.rotate(-P.ang); ctx.fillStyle = 'rgba(255,250,240,.28)'; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, held ? R * .55 : R * .8, 0, TAU); ctx.fill(); ctx.stroke();
    if (!held) for (let k = 0; k < 4; k++) { const a = -2.1 + k * .42; ctx.beginPath(); ctx.ellipse(Math.cos(a) * R * 1.05, Math.sin(a) * R * 1.05, R * .17, R * .32, a + Math.PI / 2, 0, TAU); ctx.fill(); ctx.stroke(); }
  }
  ctx.restore();
}

function render(cursor = true) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.globalAlpha = 1;
  ctx.drawImage(ground, 0, 0, W, H);
  if (guide) { ctx.globalAlpha = done ? .25 : .9; ctx.drawImage(guide, 0, 0, W, H); ctx.globalAlpha = 1; }
  for (const i of order) {
    const l = leaves[i];
    if (l.z > 1) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.globalAlpha = .2; ctx.fillStyle = '#1a120a'; ctx.beginPath(); ctx.ellipse(l.x + l.z * .35, l.y + l.z * .45, 9 * l.s * LS, 6 * l.s * LS, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    const fl = l.z > 1 ? .45 + .55 * Math.abs(Math.cos(T * 4 + l.ph)) : 1, sc = l.s * LS * (1 + l.z / 300) / l.spr.P, c = Math.cos(l.a) * sc, s = Math.sin(l.a) * sc;
    ctx.setTransform(c * DPR, s * DPR, -s * fl * DPR, c * fl * DPR, l.x * DPR, l.y * DPR);
    ctx.drawImage(l.spr.c, -l.spr.size / 2, -l.spr.size / 2);
  }
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.drawImage(shade.c, -shade.M + Math.sin(T * .4) * 5, -shade.M + Math.cos(T * .33) * 4, W + shade.M * 2, H + shade.M * 2);
  if (cursor) drawTool();
}

let AC, master, gBroom, gBlow, gMotor, mute = false;
function audioInit() {
  if (AC) return;
  AC = new (window.AudioContext || window.webkitAudioContext)();
  const buf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  master = AC.createGain(); master.gain.value = mute ? 0 : 1; master.connect(AC.destination);
  const mk = (type, f, q) => { const s = AC.createBufferSource(); s.buffer = buf; s.loop = true; const fl = AC.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = AC.createGain(); g.gain.value = 0; s.connect(fl).connect(g).connect(master); s.start(); return g; };
  gBroom = mk('bandpass', 2600, .7); gBlow = mk('lowpass', 900, .5);
  const o = AC.createOscillator(), lp = AC.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = 96; lp.frequency.value = 380;
  gMotor = AC.createGain(); gMotor.gain.value = 0; o.connect(lp).connect(gMotor).connect(master); o.start();
}
function sound(sp) {
  if (!AC) return;
  const t = AC.currentTime, on = P.down;
  gBroom.gain.setTargetAtTime(tool === 'broom' && on ? Math.min(.35, sp / 2400) * Math.min(1, .15 + touched / 40) : 0, t, .04);
  gBlow.gain.setTargetAtTime((tool === 'blower' && on ? .22 : 0) + (gust.t > 0 ? Math.min(1, gust.t) * .18 : 0), t, .1);
  gMotor.gain.setTargetAtTime(tool === 'blower' && on ? .05 : 0, t, .1);
}
function chime() {
  if (!AC) return;
  [659, 784, 988, 1319].forEach((f, i) => {
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + i * .11;
    o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + 1.2);
    o.connect(g).connect(master); o.start(t); o.stop(t + 1.3);
  });
}

const pos = e => { P.x = e.clientX; P.y = e.clientY; };
cv.addEventListener('pointerdown', e => { audioInit(); cv.setPointerCapture(e.pointerId); pos(e); P.lx = P.x; P.ly = P.y; P.vx = P.vy = 0; P.down = true; P.over = e.pointerType === 'mouse'; if (tool === 'hand') grab(); });
cv.addEventListener('pointermove', e => { pos(e); if (e.pointerType === 'mouse') P.over = true; });
const up = () => { if (tool === 'hand') release(); P.down = false; };
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
cv.addEventListener('pointerleave', e => { if (!P.down) P.over = false; });

const pick = (grp, attr, fn) => grp.querySelectorAll('button').forEach(b => b.onclick = () => { grp.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); fn(b.dataset[attr]); });
pick($('tools'), 'tool', v => { release(); tool = v; });
const sb = document.querySelectorAll('[data-shape]');
sb.forEach(b => b.onclick = () => { sb.forEach(x => x.classList.toggle('on', x === b)); setShape(b.dataset.shape); });
$('wind').onclick = () => { audioInit(); const a = rnd(0, TAU); gust = { x: Math.cos(a) * 420, y: Math.sin(a) * 420, t: 1.6 }; };
$('snd').onclick = () => { mute = !mute; $('snd').textContent = mute ? '소리 켜기' : '소리 끄기'; if (master) master.gain.value = mute ? 0 : 1; };
$('shot').onclick = () => {
  render(false);
  cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `낙엽-${shapeName || '자유'}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
  const f = $('flash'); f.style.transition = 'none'; f.style.opacity = .85; requestAnimationFrame(() => { f.style.transition = 'opacity .5s'; f.style.opacity = 0; });
};

addEventListener('resize', resize);
resize();
let last = 0;
function loop(ts) {
  const dt = Math.max(0, Math.min(.05, (ts - last) / 1000)); last = Math.max(last, ts);
  step(dt); render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

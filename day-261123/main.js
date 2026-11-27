const $ = s => document.querySelector(s);
const cv = document.createElement('canvas'); document.body.prepend(cv);
const cx = cv.getContext('2d');
const DW = 1600, DH = 893, FW = 640, FH = 358, FS = DW / FW;
let W = 0, H = 0, DPR = 1, S = 1, OX = 0, OY = 0;
const rnd = (a, b) => a + Math.random() * (b - a);

const bg = new Image(); bg.src = 'sauna.jpg';
const BB = document.createElement('canvas'); BB.width = 800; BB.height = 447;
const FD = document.createElement('canvas'); FD.width = FW; FD.height = FH;
const TM = document.createElement('canvas'); TM.width = 800; TM.height = 447;
const fd = FD.getContext('2d'), fimg = fd.createImageData(FW, FH);
const F = new Float32Array(FW * FH), G = new Float32Array(FW * FH), U = new Float32Array(FW * FH);
let hum = .4, temp = 78, ready = false, wiped = 0;

function buildBlur() {
  const b = BB.getContext('2d');
  b.filter = 'blur(10px) brightness(1.08) saturate(.85)'; b.drawImage(bg, -16, -16, 832, 479); b.filter = 'none';
  b.fillStyle = 'rgba(255,236,214,.46)'; b.fillRect(0, 0, 800, 447);
  const g = b.createLinearGradient(0, 0, 0, 447); g.addColorStop(0, 'rgba(255,240,225,.18)'); g.addColorStop(1, 'rgba(255,240,225,0)'); b.fillStyle = g; b.fillRect(0, 0, 800, 447);
}
function buildGhost() {
  const c = document.createElement('canvas'); c.width = FW; c.height = FH; const x = c.getContext('2d');
  x.scale(1 / FS, 1 / FS); x.strokeStyle = x.fillStyle = '#000'; x.lineCap = x.lineJoin = 'round';
  x.font = `250px 'Nanum Pen Script', cursive`; x.textBaseline = 'middle'; x.textAlign = 'center';
  x.save(); x.translate(640, 430); x.rotate(-.06); x.lineWidth = 9; x.strokeText('따뜻하다', 0, 0); x.fillText('따뜻하다', 0, 0); x.restore();
  x.lineWidth = 12; x.beginPath(); x.moveTo(1020, 330); x.bezierCurveTo(985, 280, 930, 320, 1020, 395); x.bezierCurveTo(1110, 320, 1055, 280, 1020, 330); x.stroke();
  x.font = `90px 'Nanum Pen Script', cursive`; x.save(); x.translate(760, 590); x.rotate(-.04); x.lineWidth = 5; x.strokeText('조금만 더 있다 가자', 0, 0); x.fillText('조금만 더 있다 가자', 0, 0); x.restore();
  const d = x.getImageData(0, 0, FW, FH).data;
  for (let i = 0; i < G.length; i++) G[i] = d[i * 4 + 3] / 255;
}
const target = (i, y) => { const base = .5 + .5 * hum, top = 1.1 - .25 * (y / FH); return Math.max(0, Math.min(1, base * top * (1 - .5 * Math.max(G[i], U[i] * .85)))); };

function brush(x, y, r, amt, mark) {
  const fx = x / FS, fy = y / FS, R = r / FS, x0 = Math.max(0, fx - R | 0), x1 = Math.min(FW - 1, fx + R + 1 | 0), y0 = Math.max(0, fy - R | 0), y1 = Math.min(FH - 1, fy + R + 1 | 0);
  for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
    const d = Math.hypot(xx - fx, yy - fy) / R; if (d > 1) continue;
    const k = (1 - d * d) * amt, i = yy * FW + xx; F[i] = Math.max(0, F[i] - k); if (mark) U[i] = Math.min(1, U[i] + k * .8);
  }
}
const fogAt = (x, y) => { const xx = Math.max(0, Math.min(FW - 1, x / FS | 0)), yy = Math.max(0, Math.min(FH - 1, y / FS | 0)); return F[yy * FW + xx]; };

const drops = [];
function spawnDrop(x, y, r) { drops.push({ x, y, r, vy: 0, slide: false, seed: Math.random() }); }
function stepDrops(dt) {
  if (drops.length < 220) for (let i = 0; i < 6; i++) { const x = rnd(0, DW), y = rnd(0, DH * .95); if (fogAt(x, y) > .55 && Math.random() < hum) spawnDrop(x, y, rnd(1.2, 2.6)); }
  for (const d of drops) {
    const f = fogAt(d.x, d.y);
    if (!d.slide) { d.r += dt * f * hum * rnd(.05, .5); if (d.r > 6.5 + d.seed * 3) d.slide = true; }
    else {
      d.vy = Math.min(220, d.vy + dt * 260); d.y += d.vy * dt; d.x += Math.sin(d.y * .05 + d.seed * 9) * .25;
      brush(d.x, d.y - d.r, d.r * 1.15, .9, false); d.r -= dt * .6;
      for (const o of drops) if (o !== d && !o.dead && Math.abs(o.x - d.x) < d.r + o.r && Math.abs(o.y - d.y) < d.r + o.r) { o.dead = true; d.r = Math.min(10, Math.sqrt(d.r * d.r + o.r * o.r)); }
    }
    if (d.y > DH + 20 || d.r < .8) d.dead = true;
    if (!d.slide && f < .18) d.dead = true;
  }
  for (let i = drops.length - 1; i >= 0; i--) if (drops[i].dead) drops.splice(i, 1);
}
function drawDrops() {
  for (const d of drops) {
    const r = d.r, x = d.x, y = d.y;
    cx.save(); cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.clip(); cx.globalAlpha = .8;
    if (bg.complete) cx.drawImage(bg, (x - r * 2.6) / DW * bg.width, (y - r * 2.6) / DH * bg.height, r * 5.2 / DW * bg.width, r * 5.2 / DH * bg.height, x - r, y - r, r * 2, r * 2);
    cx.restore();
    cx.strokeStyle = 'rgba(70,40,15,.16)'; cx.lineWidth = Math.max(.5, r * .16); cx.beginPath(); cx.arc(x, y, r * .94, 0, 7); cx.stroke();
    cx.strokeStyle = 'rgba(255,245,230,.45)'; cx.lineWidth = Math.max(.5, r * .18); cx.beginPath(); cx.arc(x, y, r * .72, .2, 1.4); cx.stroke();
    cx.fillStyle = 'rgba(255,252,245,.92)'; cx.beginPath(); cx.arc(x - r * .38, y - r * .4, Math.max(.45, r * .2), 0, 7); cx.fill();
  }
}

const puff = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  for (let i = 0; i < 26; i++) { const px = 64 + rnd(-22, 22), py = 64 + rnd(-22, 22), r = rnd(20, 40), g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, 'rgba(255,248,238,.09)'); g.addColorStop(1, 'rgba(255,248,238,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }
  return c;
})();
const steam = [];
const STOVE = [1262, 560];
function emit(x, y, n, burst) {
  for (let i = 0; i < n; i++) steam.push({ x: x + rnd(-110, 110) * (burst ? 1 : .5), y: y + rnd(-10, 30), vx: rnd(-30, 30) * (burst ? 1 : .4), vy: -rnd(burst ? 40 : 18, burst ? 120 : 40), s: rnd(.9, 1.7) * (burst ? 1.5 : 1), a: rnd(.4, 1) * (burst ? .2 : .5), life: 0, max: rnd(3, 6), rot: rnd(0, 6), ph: rnd(0, 6) });
}
function stepSteam(dt) {
  if (Math.random() < dt * (1.5 + hum * 4)) emit(STOVE[0], STOVE[1], 1, false);
  if (Math.random() < dt * hum * 2) emit(rnd(200, 1400), DH + 40, 1, false);
  for (const p of steam) { p.life += dt; p.x += (p.vx + Math.sin(p.life * 1.3 + p.ph) * 18) * dt; p.y += p.vy * dt; p.vy *= Math.exp(-.25 * dt); p.s += dt * .55; p.rot += dt * .15; }
  for (let i = steam.length - 1; i >= 0; i--) if (steam[i].life > steam[i].max) steam.splice(i, 1);
}
function drawSteam(m) {
  cx.globalCompositeOperation = 'screen';
  for (const p of steam) { const k = p.life / p.max, a = p.a * Math.sin(Math.min(1, k) * Math.PI) * m, z = 160 * p.s; cx.globalAlpha = a; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.drawImage(puff, -z / 2, -z / 2, z, z); cx.restore(); }
  cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
}

let actx = null;
function audio() { if (!actx) try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch {} }
function hiss() {
  audio(); if (!actx) return;
  const t = actx.currentTime, len = 2.2, b = actx.createBuffer(1, actx.sampleRate * len, actx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) { const k = i / d.length; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - k, 1.6) * (Math.random() < .004 ? 4 : 1); }
  const s = actx.createBufferSource(); s.buffer = b; const f = actx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1800;
  const g = actx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.45, t + .06); g.gain.exponentialRampToValueAtTime(.0001, t + len);
  s.connect(f).connect(g).connect(actx.destination); s.start(t);
}
let rubG = null;
function rubSound(v) {
  audio(); if (!actx) return;
  if (!rubG) { const len = actx.sampleRate, b = actx.createBuffer(1, len, actx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; const s = actx.createBufferSource(); s.buffer = b; s.loop = true; const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = 1.4; rubG = actx.createGain(); rubG.gain.value = 0; s.connect(f).connect(rubG).connect(actx.destination); s.start(); }
  rubG.gain.setTargetAtTime(v, actx.currentTime, .05);
}
$('#pour').onclick = () => { hum = Math.min(1, hum + .28); temp = Math.min(98, temp + 4); emit(STOVE[0], STOVE[1] - 10, 46, true); hiss(); };

const world = e => ({ x: (e.clientX - OX) / S, y: (e.clientY - OY) / S });
let last = null;
cv.addEventListener('pointerdown', e => { audio(); last = world(e); try { cv.setPointerCapture(e.pointerId); } catch {} brush(last.x, last.y, 34, .7, true); });
cv.addEventListener('pointermove', e => {
  if (!last) return;
  const p = world(e), d = Math.hypot(p.x - last.x, p.y - last.y), n = Math.max(1, Math.ceil(d / 6));
  for (let i = 1; i <= n; i++) { const x = last.x + (p.x - last.x) * i / n, y = last.y + (p.y - last.y) * i / n; brush(x, y, 30, .55, true); if (Math.random() < .12) { const a = rnd(0, 6.3); spawnDrop(x + Math.cos(a) * 32, y + Math.sin(a) * 32, rnd(1.5, 3.2)); } }
  wiped += d; rubSound(Math.min(.12, d / 300)); last = p;
});
addEventListener('pointerup', () => { if (last && Math.random() < .7) spawnDrop(last.x + rnd(-8, 8), last.y + 26, rnd(6, 8)); last = null; rubSound(0); });

let prev = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - prev) / 1000); prev = now;
  if (ready) {
    hum = Math.max(.25, hum - dt * .012); temp = Math.max(72, temp - dt * .25);
    for (let y = 0, i = 0; y < FH; y++) for (let x = 0; x < FW; x++, i++) { const t = target(i, y), f = F[i]; F[i] = f + (t - f) * Math.min(1, dt * (t > f ? .32 + hum * .5 : .12)); }
    for (let i = 0; i < F.length; i++) fimg.data[i * 4 + 3] = F[i] * 255;
    fd.putImageData(fimg, 0, 0);
    stepDrops(dt); stepSteam(dt);
    render();
    $('#tc').textContent = `${Math.round(temp)}°`; $('#hm').textContent = `${Math.round(hum * 100)}%`;
  }
  requestAnimationFrame(frame);
}
function render() {
  cx.setTransform(DPR * S, 0, 0, DPR * S, DPR * OX, DPR * OY);
  cx.drawImage(bg, 0, 0, DW, DH);
  drawSteam(.8);
  const t = TM.getContext('2d'); t.globalCompositeOperation = 'copy'; t.drawImage(BB, 0, 0); t.globalCompositeOperation = 'destination-in'; t.imageSmoothingEnabled = true; t.drawImage(FD, 0, 0, 800, 447); t.globalCompositeOperation = 'source-over';
  cx.drawImage(TM, 0, 0, DW, DH);
  drawSteam(.45);
  const gl = cx.createLinearGradient(0, 0, DW, DH); gl.addColorStop(0, 'rgba(255,255,255,.06)'); gl.addColorStop(.35, 'rgba(255,255,255,0)'); gl.addColorStop(.6, 'rgba(255,255,255,.03)'); gl.addColorStop(1, 'rgba(0,0,0,.12)');
  cx.fillStyle = gl; cx.fillRect(0, 0, DW, DH);
  drawDrops();
  const v = cx.createRadialGradient(DW / 2, DH / 2, DH * .4, DW / 2, DH / 2, DW * .7); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(20,8,0,.45)'); cx.fillStyle = v; cx.fillRect(0, 0, DW, DH);
}
function resize() {
  DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR;
  S = Math.max(W / DW, H / DH); OX = (W - DW * S) / 2; OY = (H - DH * S) / 2;
}
addEventListener('resize', resize);
Promise.all([new Promise(r => bg.complete ? r() : (bg.onload = r)), document.fonts.load("250px 'Nanum Pen Script'")]).then(() => {
  resize(); buildBlur(); buildGhost();
  for (let y = 0, i = 0; y < FH; y++) for (let x = 0; x < FW; x++, i++) F[i] = target(i, y) * 1.05;
  for (let i = 0; i < 160; i++) { const x = rnd(0, DW), y = rnd(0, DH); spawnDrop(x, y, rnd(1, 5)); }
  ready = true;
});
requestAnimationFrame(frame);

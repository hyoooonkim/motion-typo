import { unlock, play as sound, now } from './audio.js';

const NOTES = [
  { k: '쿵', n: 'HB', f: 0, type: 'thump' },
  { k: '두', n: 'G4', f: 392 },
  { k: '근', n: 'C5', f: 523.25 },
  { k: '띠', n: 'E5', f: 659.25 },
  { k: '링', n: 'A5', f: 880 },
  { k: '딩', n: 'C6', f: 1046.5 },
  { k: '톡', n: 'D6', f: 1174.7, type: 'tok' },
  { k: '뽕', n: 'FX', f: 900, type: 'pop' },
];
const SLOTS = 5, STEP = .38;
const GOLD = '#e7c36a', SILK = '#e8eef4';
const MONO = '"Share Tech Mono", monospace', KR = '"Noto Sans KR", sans-serif';

const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const img = new Image(); img.src = 'board.jpg?v=1';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

let W = 0, H = 0, DPR = 1, L = null, last = performance.now(), T = 0, idle = 0;
let chips = [1, 2], beat = 0, hover = -1, run = null, name = '', nameT = 0;
const padLit = new Array(NOTES.length).fill(0), chipLit = new Array(SLOTS).fill(0);
let pulses = [], stamps = [];

function layout() {
  const strip = W < 640 ? 150 : 132, top = 44, ah = H - strip - top;
  const IW = img.naturalWidth || 2100, IH = img.naturalHeight || 1409;
  const k = Math.min(ah / IH, Math.max(W / IW, (W - 90) / (.872 * IH))), bw = IW * k, bh = IH * k, bx = (W - bw) / 2, by = top + (ah - bh) / 2;
  const cx = bx + bw * .5, cy = by + bh * .504, R = bh * .436;
  const pads = NOTES.map((_, i) => { const a = -Math.PI / 2 + (i + .5) / NOTES.length * Math.PI * 2; return { a, x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R }; });
  const x0 = W < 640 ? 22 : 40, x1 = W - (W < 640 ? 22 : 230), sy = H - strip, ly = sy + 50;
  const socks = Array.from({ length: SLOTS }, (_, i) => ({ x: x0 + (i + .5) / SLOTS * (x1 - x0), y: ly + 34 }));
  L = { strip, bx, by, bw, bh, cx, cy, R, pads, x0, x1, sy, ly, socks, pr: clamp(R * .07, 9, 15) };
}

function resize() {
  DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  cv.width = W * DPR; cv.height = H * DPR; layout();
}

function fire(ni, si) {
  const n = NOTES[ni];
  beat = Math.max(beat, n.type === 'thump' ? 1.3 : .85);
  padLit[ni] = 1; if (si >= 0) chipLit[si] = 1;
  pulses.push({ p: ni, t: 0 }); stamps.push({ ch: n.k, t: 0 });
}

function addChip(ni) {
  unlock(); sound(NOTES[ni]); fire(ni, -1);
  if (chips.length < SLOTS) { chips.push(ni); name = ''; } else chipLit.fill(.6);
}

function startRun() {
  if (!chips.length) return;
  unlock();
  const t0 = now() + .06, dur = SLOTS * STEP;
  chips.forEach((ni, i) => sound(NOTES[ni], t0 + (i + .5) * STEP));
  run = { t: -.06, dur, fired: new Set() };
  name = ''; stamps = [];
}

function wave(x) {
  let y = 0;
  chips.forEach((ni, i) => {
    const n = NOTES[ni], d = x - L.socks[i].x, h = n.type === 'thump' ? 1.15 : .35 + .55 * Math.min(1, n.f / 1200);
    y += .12 * Math.exp(-(((d + 30) / 7) ** 2)) - .16 * Math.exp(-(((d + 8) / 3) ** 2))
      + h * Math.exp(-((d / 3.2) ** 2)) - .32 * Math.exp(-(((d - 7) / 3) ** 2)) + .2 * Math.exp(-(((d - 28) / 9) ** 2));
  });
  return y;
}

function drawWave(xa, xb, style, lw) {
  const A = L.strip * .2, y0 = L.ly;
  ctx.beginPath();
  for (let x = xa; x <= xb; x += 1.5) { const y = y0 - wave(x) * A; x === xa ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
  ctx.strokeStyle = style; ctx.lineWidth = lw; ctx.stroke();
}

function padPath(p) {
  const a = L.pads[p].a, mx = L.cx + Math.cos(a) * L.R * .58, my = L.cy + Math.sin(a) * L.R * .58;
  return [[L.pads[p].x, L.pads[p].y], [mx, my], [L.cx + Math.cos(a) * L.R * .2, L.cy + Math.sin(a) * L.R * .2]];
}

function along(path, u) {
  const segs = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1])), tot = segs.reduce((a, b) => a + b, 0);
  let d = u * tot;
  for (let i = 0; i < segs.length; i++) { if (d <= segs[i]) { const f = d / segs[i]; return [path[i][0] + (path[i + 1][0] - path[i][0]) * f, path[i][1] + (path[i + 1][1] - path[i][1]) * f]; } d -= segs[i]; }
  return path[path.length - 1];
}

function partName() {
  const code = chips.reduce((a, ni, i) => (a * 7 + ni * 13 + i * 3) % 9973, 17);
  return `${chips.map(ni => NOTES[ni].k).join('-')} · HB-${String(code).padStart(4, '0')}`;
}

function frame(t) {
  const dt = Math.min(.05, (t - last) / 1000); last = t; T += dt;
  requestAnimationFrame(frame);
  if (!L) return;
  if (run) {
    run.t += dt;
    const u = run.t / run.dur;
    chips.forEach((ni, i) => { if (!run.fired.has(i) && run.t >= (i + .5) * STEP) { run.fired.add(i); fire(ni, i); } });
    if (u >= 1.08) { run = null; name = partName(); nameT = 0; }
  } else if ((idle += dt) > 1.1) { idle = 0; beat = Math.max(beat, .22); }
  beat *= Math.exp(-4.5 * dt);
  for (let i = 0; i < padLit.length; i++) padLit[i] *= Math.exp(-3 * dt);
  for (let i = 0; i < SLOTS; i++) chipLit[i] *= Math.exp(-3 * dt);
  pulses.forEach(p => p.t += dt); pulses = pulses.filter(p => p.t < .6);
  stamps.forEach(s => s.t += dt); stamps = stamps.filter(s => s.t < .9);
  nameT += dt;

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#03162f'; ctx.fillRect(0, 0, W, H);
  if (img.complete && img.naturalWidth) {
    ctx.drawImage(img, L.bx, L.by, L.bw, L.bh);
    if (beat > .01) {
      ctx.save();
      ctx.beginPath(); ctx.arc(L.cx, L.cy, L.R * .9, 0, Math.PI * 2); ctx.clip();
      ctx.translate(L.cx, L.cy); ctx.scale(1 + .045 * beat, 1 + .045 * beat); ctx.translate(-L.cx, -L.cy);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, .42 * beat);
      ctx.drawImage(img, L.bx, L.by, L.bw, L.bh);
      ctx.restore();
    }
  }

  for (const p of pulses) {
    const path = padPath(p.p), u = ease(p.t / .4), a = 1 - clamp((p.t - .3) / .3, 0, 1);
    ctx.beginPath(); path.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.strokeStyle = `rgba(231,195,106,${.35 * a})`; ctx.lineWidth = 2; ctx.stroke();
    const [hx, hy] = along(path, u);
    ctx.fillStyle = `rgba(255,236,170,${a})`; ctx.shadowColor = GOLD; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(hx, hy, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  }

  for (const s of stamps) {
    const a = s.t < .08 ? s.t / .08 : 1 - clamp((s.t - .2) / .7, 0, 1), sc = 1 + .18 * (1 - ease(s.t / .25));
    ctx.save(); ctx.translate(L.cx, L.cy); ctx.scale(sc, sc);
    ctx.font = `900 ${L.R * .62}px ${KR}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(232,238,244,${.88 * a})`; ctx.fillText(s.ch, 0, L.R * .04);
    ctx.restore();
  }

  NOTES.forEach((n, i) => {
    const p = L.pads[i], lit = Math.max(padLit[i], hover === i ? .35 : 0), r = L.pr;
    ctx.shadowColor = GOLD; ctx.shadowBlur = 18 * lit;
    ctx.fillStyle = lit > .05 ? `rgb(${231 + 24 * lit},${195 + 50 * lit},${106 + 100 * lit})` : GOLD;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#071c38'; ctx.beginPath(); ctx.arc(p.x, p.y, r * .42, 0, Math.PI * 2); ctx.fill();
    const lx = L.cx + Math.cos(p.a) * (L.R + r + 22), lyy = L.cy + Math.sin(p.a) * (L.R + r + 22);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = SILK; ctx.font = `700 ${clamp(L.R * .075, 13, 19)}px ${KR}`; ctx.fillText(n.k, lx, lyy - 6);
    ctx.globalAlpha = .55; ctx.font = `${clamp(L.R * .042, 9, 11)}px ${MONO}`; ctx.fillText(`U${i + 1} ${n.n}`, lx, lyy + 10); ctx.globalAlpha = 1;
  });

  ctx.fillStyle = 'rgba(2,13,30,.88)'; ctx.fillRect(0, L.sy, W, L.strip);
  ctx.strokeStyle = 'rgba(232,238,244,.28)'; ctx.lineWidth = 1; ctx.strokeRect(10.5, L.sy + 8.5, W - 21, L.strip - 17);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = 'rgba(232,238,244,.55)'; ctx.font = `11px ${MONO}`;
  ctx.fillText('J1 · ECG BUS · 5CH', 20, L.sy + 14);
  drawWave(L.x0, L.x1, 'rgba(231,195,106,.45)', 1.4);
  if (run) {
    const cx = L.x0 + clamp(run.t / run.dur, 0, 1) * (L.x1 - L.x0);
    ctx.shadowColor = GOLD; ctx.shadowBlur = 10; drawWave(L.x0, cx, '#ffe7a6', 2.2); ctx.shadowBlur = 0;
    const y = L.ly - wave(cx) * L.strip * .2;
    ctx.fillStyle = '#fff6d8'; ctx.beginPath(); ctx.arc(cx, y, 4, 0, Math.PI * 2); ctx.fill();
  }
  L.socks.forEach((s, i) => {
    const w = 46, h = 30, x = s.x - w / 2, y = s.y - h / 2, ni = chips[i];
    if (ni === undefined) {
      ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(232,238,244,.35)'; ctx.strokeRect(x + .5, y + .5, w, h); ctx.setLineDash([]);
    } else {
      ctx.fillStyle = GOLD; for (let k = 0; k < 4; k++) { ctx.fillRect(x + 7 + k * 10, y - 4, 4, 4); ctx.fillRect(x + 7 + k * 10, y + h, 4, 4); }
      ctx.shadowColor = GOLD; ctx.shadowBlur = 16 * chipLit[i];
      ctx.fillStyle = `rgb(${20 + 60 * chipLit[i]},${22 + 50 * chipLit[i]},${28 + 20 * chipLit[i]})`; ctx.fillRect(x, y, w, h); ctx.shadowBlur = 0;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = SILK;
      ctx.font = `700 15px ${KR}`; ctx.fillText(NOTES[ni].k, s.x - 7, s.y + 1);
      ctx.globalAlpha = .6; ctx.font = `9px ${MONO}`; ctx.fillText(NOTES[ni].n, s.x + 12, s.y + 2); ctx.globalAlpha = 1;
    }
    ctx.fillStyle = 'rgba(232,238,244,.4)'; ctx.font = `9px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(`S${i + 1}`, s.x, s.y + 20);
  });
  if (name) {
    ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillStyle = '#f3d98f';
    const full = `PART NO. ${name}`, n = Math.floor(clamp(nameT / .9, 0, 1) * [...full].length);
    ctx.font = `700 12px ${KR}`; ctx.textBaseline = 'top'; ctx.fillText([...full].slice(0, n).join(''), W < 640 ? 20 : 170, W < 640 ? L.sy - 22 : L.sy + 13);
  }
}

function pick(x, y) {
  for (let i = 0; i < NOTES.length; i++) if (Math.hypot(x - L.pads[i].x, y - L.pads[i].y) < L.pr + 12) return { pad: i };
  for (let i = 0; i < SLOTS; i++) { const s = L.socks[i]; if (Math.abs(x - s.x) < 26 && Math.abs(y - s.y) < 20) return { sock: i }; }
  return null;
}

cv.addEventListener('pointerdown', e => {
  const h = pick(e.clientX, e.clientY);
  if (!h) return;
  if (h.pad !== undefined) addChip(h.pad);
  else if (chips[h.sock] !== undefined && !run) { chips.splice(h.sock, 1); name = ''; }
});
cv.addEventListener('pointermove', e => {
  const h = pick(e.clientX, e.clientY);
  hover = h && h.pad !== undefined ? h.pad : -1;
  cv.style.cursor = h && (h.pad !== undefined || chips[h.sock] !== undefined) ? 'pointer' : 'default';
});
document.getElementById('play').onclick = startRun;
document.getElementById('clear').onclick = () => { if (!run) { chips = []; name = ''; } };
addEventListener('keydown', e => {
  if (e.key === ' ') { e.preventDefault(); startRun(); }
  else if (e.key === 'Backspace' && !run) { chips.pop(); name = ''; }
  else if (e.key >= '1' && e.key <= '8') addChip(+e.key - 1);
});
addEventListener('resize', resize);
img.onload = layout;
document.fonts.load(`700 16px ${KR}`, '쿵두근띠링딩톡뽕').finally(() => { resize(); });
requestAnimationFrame(frame);

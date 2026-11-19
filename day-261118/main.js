import { unlock, play as sound, now } from './audio.js';
import { buildCircuit, paintCircuit } from './circuit.js?v=12';

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
const SLOTS = 5, LEAD = .6, TAP = .28;
const CASES = [
  { t: '심쿵', d: '길에서 댕냥이를 만났다', chips: [3, 0, 7, 4], step: .3, idle: .9, col: [255, 196, 214] },
  { t: '이상형', d: '천년의 이상형을 만났다', chips: [0, 0, 1, 2, 5], step: .19, idle: .45, col: [255, 150, 130] },
  { t: '힐링', d: '요가 매트 위, 느긋한 오후', chips: [1, 4, 2], step: .72, idle: 1.7, col: [170, 236, 205] },
  { t: '이슈', d: '큰일났다, 이슈가 터졌다', chips: [6, 0, 6, 0, 6], step: .15, idle: .38, col: [255, 96, 84] },
  { t: '찌릿', d: '심장이 찌릿, 아련한 밤', chips: [5, 3, 1], step: .55, idle: 1.3, col: [160, 200, 255] },
];
let cs = 0, STEP = CASES[0].step;
const GOLD = '#e7c36a', SILK = '#e8eef4';
const MONO = '"Share Tech Mono", monospace', KR = '"Noto Sans KR", sans-serif';

const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const img = new Image(); img.src = 'board.jpg?v=5';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

let W = 0, H = 0, DPR = 1, L = null, last = performance.now(), T = 0, idle = 0;
let chips = CASES[0].chips.slice(), beat = 0, hover = -1, run = null, name = '', nameT = 0;
const padLit = new Array(NOTES.length).fill(0), chipLit = new Array(SLOTS).fill(0);
let waves = [], queue = [], C = null;

function layout() {
  const strip = W < 640 ? 150 : 132, top = W < 640 ? 118 : 64, ah = H - strip - top;
  const IW = img.naturalWidth || 2100, IH = img.naturalHeight || 1409;
  const k = Math.min(ah / IH, Math.max(W / IW, (W - 90) / (.872 * IH))), bw = IW * k, bh = IH * k, bx = (W - bw) / 2, by = top + (ah - bh) / 2;
  const cx = bx + bw * .5, cy = by + bh * .504, R = bh * .436;
  const pads = C ? C.pads.map(p => ({ a: p.a, d: p.d, x: bx + p.u * bw, y: by + p.v * bh })) : [];
  const x0 = W < 640 ? 22 : 40, x1 = W - (W < 640 ? 22 : 230), sy = H - strip, ly = sy + 50;
  const socks = Array.from({ length: SLOTS }, (_, i) => ({ x: x0 + (i + .5) / SLOTS * (x1 - x0), y: ly + 34 }));
  L = { strip, bx, by, bw, bh, cx, cy, R, pads, x0, x1, sy, ly, socks, pr: clamp(R * .05, 7, 11) };
  if (C) { const taken = []; pads.forEach(p => { [p.lx, p.ly] = labelSpot(p, taken); }); }
}

function labelSpot(p, taken) {
  const { busy, MW, MH } = C, fs = clamp(L.R * .07, 12, 16), bwid = fs * 2.9, bht = fs * 2.2;
  const cover = (x, y) => {
    let n = 0;
    for (let j = 0; j <= 10; j++) for (let i = 0; i <= 12; i++) {
      const sx = x - bwid / 2 + bwid * i / 12, sy = y - bht / 2 + bht * j / 10;
      const u = Math.floor((sx - L.bx) / L.bw * MW), v = Math.floor((sy - L.by) / L.bh * MH);
      if (u < 1 || v < 1 || u >= MW - 1 || v >= MH - 1) { n += 3; continue; }
      if (busy[v * MW + u] || busy[v * MW + u + 1] || busy[v * MW + u - 1] || busy[(v + 1) * MW + u] || busy[(v - 1) * MW + u]) n++;
    }
    for (const [tx, ty] of taken) if (Math.abs(tx - x) < bwid && Math.abs(ty - y) < bht) n += 50;
    for (const q of L.pads) if (Math.abs(q.x - x) < bwid / 2 + L.pr + 2 && Math.abs(q.y - y) < bht / 2 + L.pr + 2) n += 50;
    return n;
  };
  let best = null, bs = 1e9;
  for (let ring = 0; ring < 3; ring++) for (let k = 0; k < 48; k++) {
    const a = k / 32 * Math.PI * 2, rr = L.pr + fs * (1.35 + ring * .45), x = p.x + Math.cos(a) * rr, y = p.y + Math.sin(a) * rr * .85;
    const sc = cover(x, y) * 10 + ring * 3;
    if (sc < bs) { bs = sc; best = [x, y]; }
  }
  taken.push(best);
  return best;
}

function resize() {
  DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  cv.width = W * DPR; cv.height = H * DPR; layout();
}

function fire(ni, si) {
  const n = NOTES[ni];
  beat = Math.max(beat, n.type === 'thump' ? 1.3 : .85);
  padLit[ni] = 1; if (si >= 0) chipLit[si] = 1;
}

function travel(kind, ni, dur, delay = 0) { const p = L.pads[ni]; waves.push({ kind, t: -delay, dur, ang: p.a, to: p.d, gain: 1.6 }); }
function route(prev, ni, tt) {
  if (prev < 0) travel('outp', ni, tt);
  else { travel('in', prev, tt / 2); travel('outp', ni, tt / 2, tt / 2); }
}

function addChip(ni) {
  unlock(); sound(NOTES[ni], now() + TAP); travel('outp', ni, TAP); queue.push({ at: T + TAP, ni, si: -1 });
  if (chips.length < SLOTS) { chips.push(ni); name = ''; } else chipLit.fill(.6);
}

function startRun() {
  if (!chips.length) return;
  unlock();
  const t0 = now() + LEAD, dur = SLOTS * STEP;
  chips.forEach((ni, i) => sound(NOTES[ni], t0 + (i + .5) * STEP));
  run = { t: -LEAD, dur, started: new Set(), fired: new Set() };
  name = '';
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

function setCase(i) {
  cs = i; STEP = CASES[i].step; chips = CASES[i].chips.slice(); name = ''; run = null; queue = [];
  document.querySelectorAll('#cases button').forEach((b, j) => b.classList.toggle('on', j === i));
  document.getElementById('cdesc').textContent = `CASE 0${i + 1} — ${CASES[i].d}`;
  startRun();
}

function partName() {
  const code = chips.reduce((a, ni, i) => (a * 7 + ni * 13 + i * 3) % 9973, 17);
  return `${chips.map(ni => NOTES[ni].k).join('-')} · HB-${String(code).padStart(4, '0')}`;
}

function frame(t) {
  const dt = Math.min(.05, (t - last) / 1000); last = t; T += dt;
  requestAnimationFrame(frame);
  if (!L || !L.pads.length) return;
  if (run) {
    run.t += dt;
    const u = run.t / run.dur;
    chips.forEach((ni, i) => {
      const tt = Math.min(.6, STEP * .92);
      if (!run.started.has(i) && run.t >= (i + .5) * STEP - tt) { run.started.add(i); route(i ? chips[i - 1] : -1, ni, tt); }
      if (!run.fired.has(i) && run.t >= (i + .5) * STEP) { run.fired.add(i); fire(ni, i); }
    });
    if (u >= 1.08) { run = null; name = partName(); nameT = 0; }
  } else if ((idle += dt) > CASES[cs].idle) { idle = 0; beat = Math.max(beat, .22); }
  queue = queue.filter(q => { if (T >= q.at) { fire(q.ni, q.si); return false; } return true; });
  beat *= Math.exp(-4.5 * dt);
  for (let i = 0; i < padLit.length; i++) padLit[i] *= Math.exp(-3 * dt);
  for (let i = 0; i < SLOTS; i++) chipLit[i] *= Math.exp(-3 * dt);
  waves.forEach(w => w.t += dt); waves = waves.filter(w => w.t < w.dur);
  nameT += dt;

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#03162f'; ctx.fillRect(0, 0, W, H);
  if (img.complete && img.naturalWidth) {
    ctx.drawImage(img, L.bx, L.by, L.bw, L.bh);
  }

  if (C && (waves.length || beat > .01)) {
    paintCircuit(C, waves, CASES[cs].col, beat);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(C.oc, L.bx, L.by, L.bw, L.bh);
    ctx.globalAlpha = .5; ctx.drawImage(C.oc, L.bx - 1, L.by - 1, L.bw + 2, L.bh + 2);
    ctx.restore();
  }

  NOTES.forEach((n, i) => {
    const p = L.pads[i], lit = Math.max(padLit[i], hover === i ? .35 : 0), r = L.pr;
    ctx.shadowColor = GOLD; ctx.shadowBlur = 18 * lit;
    ctx.fillStyle = lit > .05 ? `rgb(${231 + 24 * lit},${195 + 50 * lit},${106 + 100 * lit})` : GOLD;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    const sg = ctx.createRadialGradient(p.x - r * .28, p.y - r * .32, r * .05, p.x, p.y, r * .8);
    sg.addColorStop(0, '#ffffff'); sg.addColorStop(.35, lit > .05 ? '#fff4d6' : '#d5dbe1'); sg.addColorStop(1, '#6f7884');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(p.x, p.y, r * .74, 0, Math.PI * 2); ctx.fill();
    const fs = clamp(L.R * .07, 12, 16), lx = p.lx ?? p.x, lyy = p.ly ?? p.y;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `500 ${fs}px ${KR}`;
    ctx.fillStyle = 'rgba(226,230,228,.22)'; ctx.fillText(n.k, lx + .6, lyy - fs * .35 + .6);
    ctx.fillStyle = 'rgba(226,230,228,.86)'; ctx.fillText(n.k, lx, lyy - fs * .35);
    ctx.font = `${Math.round(fs * .62)}px ${MONO}`; ctx.fillStyle = 'rgba(226,230,228,.7)'; ctx.fillText(`U${i + 1}·${n.n}`, lx, lyy + fs * .55);
  });

  ctx.fillStyle = 'rgba(2,13,30,.88)'; ctx.fillRect(0, L.sy, W, L.strip);
  ctx.strokeStyle = 'rgba(232,238,244,.28)'; ctx.lineWidth = 1; ctx.strokeRect(10.5, L.sy + 8.5, W - 21, L.strip - 17);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = 'rgba(232,238,244,.55)'; ctx.font = `11px ${MONO}`;
  ctx.fillText('J1 · ECG BUS · 5CH', 20, L.sy + 14);
  drawWave(L.x0, L.x1, 'rgba(231,195,106,.45)', 1.4);
  if (run) {
    const cx = L.x0 + clamp(run.t / run.dur, 0, 1) * (L.x1 - L.x0);
    const cc = `rgb(${CASES[cs].col.join(',')})`; ctx.shadowColor = cc; ctx.shadowBlur = 10; drawWave(L.x0, cx, cc, 2.2); ctx.shadowBlur = 0;
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
CASES.forEach((c, i) => { const b = document.createElement('button'); b.textContent = `0${i + 1} ${c.t}`; b.onclick = () => setCase(i); document.getElementById('cases').append(b); });
document.querySelectorAll('#cases button')[0].classList.add('on');
document.getElementById('cdesc').textContent = `CASE 01 — ${CASES[0].d}`;
document.getElementById('clear').onclick = () => { if (!run) { chips = []; name = ''; } };
addEventListener('keydown', e => {
  if (e.key === ' ') { e.preventDefault(); startRun(); }
  else if (e.key === 'Backspace' && !run) { chips.pop(); name = ''; }
  else if (e.key >= '1' && e.key <= '8') addChip(+e.key - 1);
});
addEventListener('resize', resize);
img.onload = () => { C = buildCircuit(img); layout(); };
if (img.complete && img.naturalWidth) { C = buildCircuit(img); layout(); }
document.fonts.load(`700 16px ${KR}`, '쿵두근띠링딩톡뽕').finally(() => { resize(); });
requestAnimationFrame(frame);

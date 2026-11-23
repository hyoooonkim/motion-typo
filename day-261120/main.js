const WORDS = ['오차', '사람', '완벽'];
const LINES = [[0, '완벽하다. 아무도 쓰지 않았다.'], [.35, '조금 흔들린다. 기계가 망설인다.'], [1.2, '손이 지나간 자국이 남는다.'], [2.2, '누군가, 분명히 이걸 썼다.']];
const C = { paper: '#efeadf', grid: 'rgba(40,80,160,', ink: '#1b2a44', ideal: '#2f7dd8', fluo: [255, 43, 214], red: '#e2412f' };

const cv = document.createElement('canvas'); document.body.prepend(cv);
const ctx = cv.getContext('2d');
let W = 0, H = 0, dpr = 1, L = null, word = 0, tol = 1.2, seed = 1, loops = [], anim = 0, t0 = 0, drawing = false;

const hash = n => { const s = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453; return s - Math.floor(s); };
const vn = x => { const i = Math.floor(x), f = x - i, s = f * f * (3 - 2 * f); return (hash(i) * (1 - s) + hash(i + 1) * s) * 2 - 1; };
const fbm = x => vn(x) * .6 + vn(x * 2.1 + 7) * .28 + vn(x * 4.3 + 19) * .12;
const S = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function layout() {
  dpr = Math.min(2, devicePixelRatio); W = innerWidth; H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const narrow = W < 640, top = narrow ? 110 : 80, bottom = narrow ? 150 : 170;
  ctx.font = `900 100px 'Noto Sans KR'`;
  const w100 = ctx.measureText(WORDS[word]).width, fs = Math.min(W * (narrow ? .86 : .74) / w100 * 100, (H - top - bottom) * .82);
  L = { narrow, top, bottom, fs, pxmm: fs / 90, cx: W / 2, cy: top + (H - top - bottom) / 2 + fs * .04 };
}

function outline(text) {
  const fs = L.fs, c = document.createElement('canvas'), g = c.getContext('2d', { willReadFrequently: true });
  g.font = `900 ${fs}px 'Noto Sans KR'`;
  const tw = Math.ceil(g.measureText(text).width), pad = 20, cw = tw + pad * 2, ch = Math.ceil(fs * 1.35) + pad * 2;
  c.width = cw; c.height = ch; g.font = `900 ${fs}px 'Noto Sans KR'`; g.textBaseline = 'middle'; g.fillStyle = '#000'; g.fillText(text, pad, ch / 2);
  const a = g.getImageData(0, 0, cw, ch).data, v = (x, y) => (x < 0 || y < 0 || x >= cw || y >= ch) ? 0 : a[(y * cw + x) * 4 + 3] / 255;
  const ox = L.cx - cw / 2, oy = L.cy - ch / 2, iso = .5, pts = new Map(), adj = new Map();
  const ep = (k, x0, y0, x1, y1, a0, a1) => { if (!pts.has(k)) { const t = (iso - a0) / (a1 - a0 || 1e-6); pts.set(k, [ox + x0 + (x1 - x0) * t, oy + y0 + (y1 - y0) * t]); } return k; };
  const link = (p, q) => { (adj.get(p) || adj.set(p, []).get(p)).push(q); (adj.get(q) || adj.set(q, []).get(q)).push(p); };
  for (let y = -1; y < ch; y++) for (let x = -1; x < cw; x++) {
    const tl = v(x, y), tr = v(x + 1, y), br = v(x + 1, y + 1), bl = v(x, y + 1);
    const idx = (tl > iso ? 8 : 0) | (tr > iso ? 4 : 0) | (br > iso ? 2 : 0) | (bl > iso ? 1 : 0);
    if (!idx || idx === 15) continue;
    const T = () => ep(`h${x},${y}`, x, y, x + 1, y, tl, tr), R = () => ep(`v${x + 1},${y}`, x + 1, y, x + 1, y + 1, tr, br);
    const B = () => ep(`h${x},${y + 1}`, x, y + 1, x + 1, y + 1, bl, br), Lf = () => ep(`v${x},${y}`, x, y, x, y + 1, tl, bl);
    const mid = (tl + tr + br + bl) / 4 > iso;
    switch (idx) {
      case 1: case 14: link(Lf(), B()); break;
      case 2: case 13: link(B(), R()); break;
      case 3: case 12: link(Lf(), R()); break;
      case 4: case 11: link(T(), R()); break;
      case 6: case 9: link(T(), B()); break;
      case 7: case 8: link(Lf(), T()); break;
      case 5: if (mid) { link(Lf(), T()); link(B(), R()); } else { link(Lf(), B()); link(T(), R()); } break;
      case 10: if (mid) { link(T(), R()); link(Lf(), B()); } else { link(Lf(), T()); link(B(), R()); } break;
    }
  }
  const seen = new Set(), out = [];
  for (const start of adj.keys()) {
    if (seen.has(start)) continue;
    const loop = []; let prev = null, cur = start;
    while (cur && !seen.has(cur)) { seen.add(cur); loop.push(pts.get(cur)); const nb = adj.get(cur).find(n => n !== prev && !seen.has(n)); prev = cur; cur = nb; }
    if (loop.length > 12) out.push(resample(smooth(loop), Math.max(1.6, L.fs / 160)));
  }
  return out;
}
function smooth(p) {
  const o = [];
  for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; o.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); }
  return o;
}
function resample(p, ds) {
  const o = [p[0]]; let acc = 0;
  for (let i = 1; i <= p.length; i++) {
    let a = p[i - 1], b = p[i % p.length], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    while (acc + d >= ds) { const t = (ds - acc) / d; a = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; o.push(a); d = Math.hypot(b[0] - a[0], b[1] - a[1]); acc = 0; }
    acc += d;
  }
  return o;
}

function simulate(ideal, k) {
  const tt = Math.min(1, tol / 3), amp = tol * L.pxmm, n = ideal.length, ds = Math.max(1.6, L.fs / 160), sd = k * 17.3;
  const nrm = ideal.map((p, i) => { const a = ideal[(i - 1 + n) % n], b = ideal[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dy / l, -dx / l]; });
  const over = Math.round(tt * 14), act = [], wid = [];
  const ang = hash(sd) * 6.28;
  let x = ideal[0][0] + Math.cos(ang) * amp * .7, y = ideal[0][1] + Math.sin(ang) * amp * .7, px = x, py = y;
  const a = 1 - .78 * tt, b = .62 * tt;
  for (let j = 0; j < n + over; j++) {
    const i = j % n, s = j * ds, w = fbm(s * .006 + sd) * amp + vn(s * .05 + sd * 3) * amp * .22 + (hash(j + sd) - .5) * amp * .06;
    const tx = ideal[i][0] + nrm[i][0] * w, ty = ideal[i][1] + nrm[i][1] * w;
    const vx = x - px, vy = y - py; px = x; py = y;
    x += (tx - x) * a + vx * b; y += (ty - y) * a + vy * b;
    if (j === 0) { px = x; py = y; }
    act.push([x, y]);
    const sp = Math.hypot(x - px, y - py) / ds;
    wid.push(1.05 + tt * (1.5 + 1.1 * fbm(s * .004 + sd + 40) - .9 * Math.min(1.4, sp - .6)));
  }
  const err = act.map((p, j) => { const q = ideal[j % n]; return Math.hypot(p[0] - q[0], p[1] - q[1]) / L.pxmm; });
  return { ideal, act, wid, err };
}

function build(play) {
  layout();
  loops = outline(WORDS[word]).map((p, k) => simulate(p, k));
  const total = loops.reduce((s, l) => s + l.act.length, 0);
  anim = { total, dur: Math.min(5.5, Math.max(2.4, total / 1400)), start: performance.now(), play };
  stats();
}
function resim() { loops = loops.map((l, k) => simulate(l.ideal, k)); stats(); }
function stats() {
  let mx = 0, sum = 0, n = 0;
  for (const l of loops) for (const e of l.err) { mx = Math.max(mx, e); sum += e; n++; }
  L.max = mx; L.mean = n ? sum / n : 0;
}

function paper() {
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 10) { ctx.fillStyle = C.grid + (x % 50 ? .06 : .13) + ')'; ctx.fillRect(x, 0, 1, H); }
  for (let y = 0; y < H; y += 10) { ctx.fillStyle = C.grid + (y % 50 ? .06 : .13) + ')'; ctx.fillRect(0, y, W, 1); }
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4; ctx.strokeRect(10.5, 34.5, W - 21, H - 45); ctx.lineWidth = .6; ctx.strokeRect(14.5, 38.5, W - 29, H - 53);
}

function arrow(x0, y0, x1, y1, s) {
  const a = Math.atan2(y1 - y0, x1 - x0);
  for (const [x, y, d] of [[x0, y0, a + Math.PI], [x1, y1, a]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - Math.cos(d - .35) * s, y - Math.sin(d - .35) * s); ctx.lineTo(x - Math.cos(d + .35) * s, y - Math.sin(d + .35) * s); ctx.closePath(); ctx.fill(); }
}

function callouts(alpha) {
  const cand = [];
  loops.forEach(l => l.err.forEach((e, j) => cand.push([e, l, j])));
  cand.sort((a, b) => b[0] - a[0]);
  const picked = [], minD = L.fs * .42;
  for (const c of cand) {
    const p = c[1].act[c[2]];
    if (picked.every(q => Math.hypot(q[1].act[q[2]][0] - p[0], q[1].act[q[2]][1] - p[1]) > minD)) picked.push(c);
    if (picked.length >= (L.narrow ? 3 : 5)) break;
  }
  ctx.globalAlpha = alpha;
  for (const [e, l, j] of picked) {
    const p = l.act[j], q = l.ideal[j % l.ideal.length], dx = p[0] - L.cx, dy = (p[1] - L.cy) * 1.6, dl = Math.hypot(dx, dy) || 1, side = dx < 0 ? -1 : 1;
    const lx = Math.min(W - 110, Math.max(110, p[0] + dx / dl * L.fs * .34)), ly = Math.min(H - 190, Math.max(80, p[1] + dy / dl * L.fs * .26)), shelf = L.narrow ? 54 : 72;
    ctx.strokeStyle = ctx.fillStyle = C.red; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(q[0], q[1], 3, 0, 6.29); ctx.stroke();
    if (Math.hypot(p[0] - q[0], p[1] - q[1]) > 4) { ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); arrow(q[0], q[1], p[0], p[1], 5); }
    ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(lx, ly); ctx.lineTo(lx + side * shelf, ly); ctx.stroke();
    ctx.font = `600 ${L.narrow ? 11 : 13}px 'IBM Plex Mono'`; ctx.textAlign = side < 0 ? 'right' : 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText(`Δ ${e.toFixed(2)}`, lx + side * 2, ly - 3);
    ctx.font = `400 ${L.narrow ? 9 : 10}px 'IBM Plex Mono'`; ctx.textBaseline = 'top'; ctx.fillText(e > tol ? 'OUT OF TOL.' : 'mm', lx + side * 2, ly + 3);
  }
  ctx.globalAlpha = 1;
}

function drawWord(p, gapA) {
  const tt = Math.min(1, tol / 3), k = Math.floor(p * anim.total);
  ctx.setLineDash([5, 4]); ctx.strokeStyle = C.ideal; ctx.lineWidth = .9; ctx.globalAlpha = .85;
  for (const l of loops) { ctx.beginPath(); l.ideal.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.stroke(); }
  ctx.setLineDash([]); ctx.globalAlpha = 1;
  let left = k, tip = null;
  const [fr, fg, fb] = C.fluo;
  for (const l of loops) {
    const m = Math.min(l.act.length, left); left -= m; if (m < 2) { if (m === 1) tip = l.act[0]; continue; }
    if (gapA > 0) for (let j = 0; j < m - 1; j++) {
      const n = l.ideal.length, a = l.ideal[j % n], b = l.ideal[(j + 1) % n], c = l.act[j + 1], d = l.act[j];
      ctx.fillStyle = `rgba(${fr},${fg},${fb},${gapA * Math.min(.8, .3 + l.err[j] * .45)})`;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); ctx.fill();
    }
    const ink = tt < .02 ? '#4a4f57' : C.ink;
    ctx.strokeStyle = ink; ctx.lineCap = ctx.lineJoin = 'round';
    for (let j = 1; j < m; j++) {
      ctx.globalAlpha = .82 + .18 * (1 - tt) + tt * .12 * Math.sin(j * .07);
      ctx.lineWidth = Math.max(.7, l.wid[j]); ctx.beginPath(); ctx.moveTo(l.act[j - 1][0], l.act[j - 1][1]); ctx.lineTo(l.act[j][0], l.act[j][1]); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (m < l.act.length) tip = l.act[m - 1];
  }
  return tip;
}

function carriage(tip) {
  ctx.strokeStyle = 'rgba(27,42,68,.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(tip[0], 40); ctx.lineTo(tip[0], H - 16); ctx.moveTo(16, tip[1]); ctx.lineTo(W - 16, tip[1]); ctx.stroke();
  ctx.fillStyle = C.ink; ctx.fillRect(tip[0] - 9, tip[1] - 9, 18, 3); ctx.beginPath(); ctx.arc(tip[0], tip[1], 4, 0, 6.29); ctx.stroke();
  ctx.font = `500 10px 'IBM Plex Mono'`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(`X ${(tip[0] / L.pxmm).toFixed(2)}  Y ${(tip[1] / L.pxmm).toFixed(2)}`, tip[0] + 10, tip[1] + 8);
}

function panel() {
  const tt = Math.min(1, tol / 3), hum = Math.round(100 * (1 - Math.exp(-tt * 2.2)) / (1 - Math.exp(-2.2)));
  const x = 28, y = L.narrow ? 100 : 58, rows = [['TOL.', `±${tol.toFixed(2)} mm`], ['MAX Δ', `${L.max.toFixed(2)} mm`], ['MEAN Δ', `${L.mean.toFixed(2)} mm`], ['HUMANITY', `${hum}%`]];
  ctx.fillStyle = C.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  rows.forEach(([k, v], i) => { ctx.font = `400 10px 'IBM Plex Mono'`; ctx.globalAlpha = .6; ctx.fillText(k, x, y + i * (L.narrow ? 15 : 18)); ctx.globalAlpha = 1; ctx.font = `600 ${L.narrow ? 11 : 13}px 'IBM Plex Mono'`; ctx.fillText(v, x + 76, y + i * (L.narrow ? 15 : 18) - 1); });
  if (!L.narrow) {
    const bw = 250, bh = 96, bx = W - 28 - bw, by = H - 24 - bh, rr = [['TITLE', '손과 기계의 오차'], ['WORD', WORDS[word]], ['DWG NO.', `261120-${String(word + 1).padStart(2, '0')}`], ['TOL.', `±${tol.toFixed(2)}  SCALE 1:1`], ['DRAWN BY', tt < .02 ? 'MACHINE' : tt < .5 ? 'MACHINE / HAND' : 'HAND']];
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(bx + .5, by + .5, bw, bh);
    rr.forEach(([k, v], i) => {
      const ry = by + i * bh / rr.length; if (i) { ctx.beginPath(); ctx.moveTo(bx, ry + .5); ctx.lineTo(bx + bw, ry + .5); ctx.stroke(); }
      ctx.font = `400 9px 'IBM Plex Mono'`; ctx.globalAlpha = .6; ctx.fillText(k, bx + 6, ry + 5); ctx.globalAlpha = 1;
      ctx.font = `500 11px 'IBM Plex Mono', 'Noto Sans KR'`; ctx.fillText(v, bx + 76, ry + 4);
    });
    ctx.beginPath(); ctx.moveTo(bx + 70.5, by); ctx.lineTo(bx + 70.5, by + bh); ctx.stroke();
  }
}

const RULE = { x: 0, y: 0, w: 0 };
function rule() {
  const w = Math.min(560, W - 64), x = L.narrow ? (W - w) / 2 : Math.min((W - w) / 2, W - 28 - 250 - 30 - w), y = H - (L.narrow ? 70 : 64);
  Object.assign(RULE, { x, y, w });
  ctx.fillStyle = 'rgba(239,234,223,.9)'; ctx.fillRect(x - 10, y - 30, w + 20, 62);
  ctx.strokeStyle = ctx.fillStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, w, 16);
  for (let i = 0; i <= 30; i++) {
    const tx = Math.round(x + w * i / 30) + .5, big = i % 5 === 0;
    ctx.beginPath(); ctx.moveTo(tx, y); ctx.lineTo(tx, y + (big ? 10 : i % 1 === 0 ? 5 : 3)); ctx.stroke();
    if (big) { ctx.font = `400 9px 'IBM Plex Mono'`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText((i / 10).toFixed(1), tx, y + 19); }
  }
  ctx.font = `600 10px 'IBM Plex Mono'`; ctx.textBaseline = 'bottom'; ctx.textAlign = 'left'; ctx.fillText('MACHINE', x, y - 6); ctx.textAlign = 'right'; ctx.fillText('HAND', x + w, y - 6);
  const px = x + w * tol / 3;
  ctx.fillStyle = C.red; ctx.beginPath(); ctx.moveTo(px, y + 15); ctx.lineTo(px - 7, y - 3); ctx.lineTo(px + 7, y - 3); ctx.closePath(); ctx.fill();
  ctx.fillRect(px - .5, y, 1, 17);
  const line = LINES.filter(l => tol >= l[0]).pop()[1];
  ctx.fillStyle = C.ink; ctx.font = `500 ${L.narrow ? 12 : 14}px 'Noto Sans KR'`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(line, x + w / 2, y - 8);
}

let ac = null, osc = null, og = null;
function sound(on, speed = 0) {
  if (!ac) return;
  if (!osc) { osc = ac.createOscillator(); const f = ac.createBiquadFilter(); og = ac.createGain(); osc.type = 'sawtooth'; f.type = 'lowpass'; f.frequency.value = 900; og.gain.value = 0; osc.connect(f); f.connect(og); og.connect(ac.destination); osc.start(); }
  og.gain.setTargetAtTime(on ? .035 : 0, ac.currentTime, .05); osc.frequency.setTargetAtTime(90 + speed * 160, ac.currentTime, .03);
}

const ui = document.getElementById('words');
WORDS.forEach((w, i) => { const b = document.createElement('button'); b.textContent = w; b.onclick = () => { word = i; seed = 1 + i * 7; [...ui.children].forEach((x, j) => x.classList.toggle('on', j === i)); build(true); }; ui.append(b); });
ui.children[0].classList.add('on');
document.getElementById('redraw').onclick = () => { seed += 1; resim(); anim.start = performance.now(); anim.play = true; };

let dragging = false;
const onRule = e => e.clientY > RULE.y - 34 && e.clientY < RULE.y + 36 && e.clientX > RULE.x - 20 && e.clientX < RULE.x + RULE.w + 20;
const setTol = e => { tol = Math.round(Math.min(3, Math.max(0, (e.clientX - RULE.x) / RULE.w * 3)) * 100) / 100; resim(); anim.play = false; };
cv.addEventListener('pointerdown', e => {
  if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
  if (onRule(e)) { dragging = true; cv.setPointerCapture(e.pointerId); setTol(e); }
});
cv.addEventListener('pointermove', e => { if (dragging) setTol(e); cv.style.cursor = onRule(e) ? 'ew-resize' : 'default'; });
addEventListener("pointerup", () => { dragging = false; });
addEventListener('resize', () => build(false));

function frame(now) {
  if (!anim) return requestAnimationFrame(frame);
  const el = (now - anim.start) / 1000, p = anim.play ? Math.min(1, el / anim.dur) : 1, after = anim.play ? el - anim.dur : 9;
  paper();
  const tip = drawWord(p, S(0, .7, after));
  if (p < 1 && tip) carriage(tip);
  callouts(S(.5, 1.2, after));
  panel(); rule();
  sound(anim.play && p < 1, Math.min(1, tol / 3));
  requestAnimationFrame(frame);
}
document.fonts.load(`900 100px 'Noto Sans KR'`, WORDS.join('')).then(() => Promise.all([document.fonts.load(`500 14px 'Noto Sans KR'`, LINES.map(l => l[1]).join('') + '손과기계의오차'), document.fonts.load(`600 13px 'IBM Plex Mono'`, 'Δ0123')])).then(() => { build(true); requestAnimationFrame(frame); });

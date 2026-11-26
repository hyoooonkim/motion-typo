const $ = s => document.querySelector(s);
const cv = document.createElement('canvas'); document.body.prepend(cv);
const cx = cv.getContext('2d');
const mk = () => document.createElement('canvas');
const P = mk(), Rl = mk(), D = mk(), M = mk(), T = mk();
let W = 0, H = 0, DPR = 1, S = 1, OX = 0, OY = 0, DW = 1600, DH = 1000, dirty = true, sent = 0;
const SENTENCES = [
  ['남은 건 잔돈뿐이지만', '아직 여기 있다'],
  ['거슬러 받은 건', '동전만이 아니었다'],
  ['주머니 속 잔돈처럼', '오늘도 짤랑거렸다'],
  ['작은 것들이 모여', '소리가 된다'],
];
const COINS = { 10: { r: 54, pic: 'tower' }, 50: { r: 65, pic: 'rice' }, 100: { r: 72, pic: 'sun' }, 500: { r: 80, pic: 'crane' } };
const g = v => `rgb(${v * 255 | 0},${v * 255 | 0},${v * 255 | 0})`;

function arcText(c, txt, r, mid, size, v, down) {
  c.save(); c.fillStyle = g(v); c.font = `700 ${size}px 'Noto Sans KR', sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const chars = [...txt], ws = chars.map(ch => c.measureText(ch).width + size * .12), tot = ws.reduce((a, b) => a + b, 0) / r;
  let a = mid + (down ? tot / 2 : -tot / 2);
  chars.forEach((ch, i) => {
    const d = ws[i] / r; a += down ? -d / 2 : d / 2;
    c.save(); c.translate(Math.cos(a) * r, Math.sin(a) * r); c.rotate(a + (down ? -Math.PI / 2 : Math.PI / 2)); c.fillText(ch, 0, 0); c.restore();
    a += down ? -d / 2 : d / 2;
  });
  c.restore();
}
function motif(c, kind, r, v) {
  c.save(); c.fillStyle = c.strokeStyle = g(v); c.lineCap = 'round'; c.lineJoin = 'round';
  const u = r / 100;
  if (kind === 'tower') {
    c.fillRect(-26 * u, 30 * u, 52 * u, 10 * u);
    [[0, 40, 20], [1, 30, 12], [2, 22, 4], [3, 15, -4]].forEach(([i, hw, y]) => {
      const yy = (20 - i * 15) * u;
      c.beginPath(); c.moveTo(-hw * u, yy); c.lineTo(hw * u, yy); c.lineTo((hw - 8) * u, yy - 6 * u); c.lineTo(-(hw - 8) * u, yy - 6 * u); c.closePath(); c.fill();
      c.fillRect(-(hw - 14) * u, yy, (hw - 14) * 2 * u, 9 * u);
    });
    c.lineWidth = 3 * u; c.beginPath(); c.moveTo(0, -40 * u); c.lineTo(0, -62 * u); c.stroke();
    [-48, -55].forEach(y => { c.beginPath(); c.arc(0, y * u, 3 * u, 0, 7); c.fill(); });
  } else if (kind === 'rice') {
    c.lineWidth = 3 * u; c.beginPath(); c.moveTo(-8 * u, 45 * u); c.quadraticCurveTo(-4 * u, -10 * u, 30 * u, -45 * u); c.stroke();
    for (let i = 0; i < 11; i++) {
      const t = .25 + i * .065, x = -8 + (30 + 8) * t * t * 1.1, y = 45 - 90 * t;
      [-1, 1].forEach(sd => { c.save(); c.translate((x + sd * 7) * u, (y + 2) * u); c.rotate(.5 * sd - .6); c.beginPath(); c.ellipse(0, 0, 4 * u, 7.5 * u, 0, 0, 7); c.fill(); c.restore(); });
    }
    c.beginPath(); c.moveTo(-6 * u, 30 * u); c.quadraticCurveTo(-35 * u, 5 * u, -40 * u, -20 * u); c.quadraticCurveTo(-20 * u, 0, -4 * u, 18 * u); c.fill();
  } else if (kind === 'sun') {
    c.beginPath(); c.arc(18 * u, -22 * u, 16 * u, 0, 7); c.fill();
    c.beginPath(); c.moveTo(-55 * u, 30 * u); c.lineTo(-18 * u, -18 * u); c.lineTo(5 * u, 8 * u); c.lineTo(22 * u, -6 * u); c.lineTo(55 * u, 30 * u); c.closePath(); c.fill();
    c.lineWidth = 2.5 * u; [40, 49].forEach(y => { c.beginPath(); for (let x = -50; x <= 50; x += 2) c.lineTo(x * u, (y + Math.sin(x * .25) * 2.2) * u); c.stroke(); });
  } else {
    c.beginPath(); c.ellipse(0, 8 * u, 22 * u, 9 * u, -.15, 0, 7); c.fill();
    c.lineWidth = 4 * u; c.beginPath(); c.moveTo(18 * u, 4 * u); c.quadraticCurveTo(40 * u, -10 * u, 36 * u, -34 * u); c.stroke();
    c.beginPath(); c.arc(36 * u, -36 * u, 4.5 * u, 0, 7); c.fill();
    c.beginPath(); c.moveTo(40 * u, -36 * u); c.lineTo(52 * u, -32 * u); c.lineTo(40 * u, -33 * u); c.fill();
    c.beginPath(); c.moveTo(-6 * u, 2 * u); c.quadraticCurveTo(-30 * u, -40 * u, -2 * u, -58 * u); c.quadraticCurveTo(-10 * u, -30 * u, 8 * u, 0); c.fill();
    c.beginPath(); c.moveTo(-10 * u, 6 * u); c.quadraticCurveTo(-52 * u, -18 * u, -58 * u, -44 * u); c.quadraticCurveTo(-36 * u, -26 * u, 0, 4 * u); c.fill();
    c.lineWidth = 2.5 * u; c.beginPath(); c.moveTo(-18 * u, 14 * u); c.lineTo(-44 * u, 30 * u); c.moveTo(-14 * u, 15 * u); c.lineTo(-38 * u, 36 * u); c.stroke();
  }
  c.restore();
}
function coin(c, x, y, denom, side, rot) {
  const { r, pic } = COINS[denom];
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = g(.56); c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
  if (denom >= 100) { c.strokeStyle = g(.82); c.lineWidth = 1.4; for (let i = 0; i < 140; i++) { const a = i / 140 * Math.PI * 2; c.beginPath(); c.moveTo(Math.cos(a) * r * .965, Math.sin(a) * r * .965); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); c.stroke(); } }
  c.strokeStyle = g(.98); c.lineWidth = r * .07; c.beginPath(); c.arc(0, 0, r * .9, 0, 7); c.stroke();
  c.fillStyle = g(.44); c.beginPath(); c.arc(0, 0, r * .86, 0, 7); c.fill();
  if (side === 'num') {
    c.fillStyle = g(1); c.font = `900 ${r * (denom >= 100 ? .62 : .78)}px 'Noto Sans KR', sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(String(denom), 0, -r * .04);
    arcText(c, '잔돈은행', r * .7, -Math.PI / 2, r * .15, .95);
    arcText(c, '2026', r * .7, Math.PI / 2, r * .14, .95, true);
  } else {
    motif(c, pic, r * 1.08, .97);
    arcText(c, '잔돈은행', r * .7, -Math.PI / 2, r * .15, .95);
    arcText(c, `${denom}원 · 2026`, r * .7, Math.PI / 2, r * .13, .95, true);
  }
  c.restore();
}

function layoutCoins(textBox) {
  const list = [500, 500, 100, 100, 100, 50, 50, 10, 10].sort(() => Math.random() - .5), out = [];
  for (const d of list) {
    const r = COINS[d].r;
    for (let k = 0; k < 400; k++) {
      const x = r + 40 + Math.random() * (DW - 2 * r - 80), y = r + 40 + Math.random() * (DH - 2 * r - 80);
      if (x + r > textBox[0] - 20 && x - r < textBox[2] + 20 && y + r > textBox[1] - 20 && y - r < textBox[3] + 20) continue;
      if (out.some(o => Math.hypot(o.x - x, o.y - y) < o.r + r + 26)) continue;
      out.push({ x, y, r, d, side: Math.random() < .5 ? 'num' : 'pic', rot: (Math.random() - .5) * 1.4 }); break;
    }
  }
  return out;
}
function build() {
  DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  const portrait = W < H;
  DW = portrait ? 1000 : 1600; DH = portrait ? 1600 : 1000;
  S = Math.min(W / DW, H / DH) * .96; OX = (W - DW * S) / 2; OY = (H - DH * S) / 2;
  for (const c of [cv, P, Rl, D, M, T]) { c.width = W * DPR; c.height = H * DPR; }
  const pw = cv.width, ph = cv.height;
  const p = P.getContext('2d'); p.fillStyle = '#efe9dc'; p.fillRect(0, 0, pw, ph);
  const pd = p.getImageData(0, 0, pw, ph);
  for (let i = 0; i < pd.data.length; i += 4) { const n = (Math.random() - .5) * 7; pd.data[i] += n; pd.data[i + 1] += n; pd.data[i + 2] += n; }
  p.putImageData(pd, 0, 0);
  const r = Rl.getContext('2d'); r.setTransform(1, 0, 0, 1, 0, 0); r.fillStyle = g(.08); r.fillRect(0, 0, pw, ph);
  r.setTransform(S * DPR, 0, 0, S * DPR, OX * DPR, OY * DPR);
  const lines = SENTENCES[sent % SENTENCES.length];
  r.font = `900 100px 'Noto Serif KR', serif`;
  const fs = Math.min(132, 100 * DW * .82 / Math.max(...lines.map(l => r.measureText(l).width)));
  r.font = `900 ${fs}px 'Noto Serif KR', serif`; r.textAlign = 'center'; r.textBaseline = 'middle'; r.fillStyle = g(.92);
  const lh = fs * 1.3, y0 = DH / 2 - lh * (lines.length - 1) / 2;
  lines.forEach((l, i) => r.fillText(l, DW / 2, y0 + i * lh));
  const tw = Math.max(...lines.map(l => r.measureText(l).width));
  const box = [DW / 2 - tw / 2, y0 - fs * .6, DW / 2 + tw / 2, y0 + lh * (lines.length - 1) + fs * .6];
  layoutCoins(box).forEach(o => coin(r, o.x, o.y, o.d, o.side, o.rot));
  const rd = r.getImageData(0, 0, pw, ph), dd = D.getContext('2d').createImageData(pw, ph);
  for (let i = 0; i < rd.data.length; i += 4) {
    const rel = rd.data[i] / 255, tooth = .62 + Math.random() * .38;
    dd.data[i] = 38; dd.data[i + 1] = 38; dd.data[i + 2] = 44;
    dd.data[i + 3] = Math.min(255, (.08 + .92 * Math.pow(rel, 1.5)) * tooth * 250);
  }
  D.getContext('2d').putImageData(dd, 0, 0);
  M.getContext('2d').clearRect(0, 0, pw, ph);
  dirty = true;
}

const streak = (() => {
  const N = 256, c = mk(); c.width = c.height = N; const x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.07)'; x.fillRect(0, 0, N, N);
  for (let i = 0; i < 900; i++) {
    const px = Math.random() * N, py = Math.random() * N, len = 14 + Math.random() * 46, a = (Math.random() - .5) * .35;
    x.strokeStyle = `rgba(0,0,0,${.1 + Math.random() * .7})`; x.lineWidth = .4 + Math.random() * 1.3;
    for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) { x.beginPath(); x.moveTo(px + ox, py + oy); x.lineTo(px + ox + Math.cos(a) * len, py + oy + Math.sin(a) * len); x.stroke(); }
  }
  return c;
})();
let pat = null, last = null, rubbed = 0;
function rub(x0, y0, x1, y1, speed) {
  const m = M.getContext('2d');
  if (!pat) pat = m.createPattern(streak, 'repeat');
  m.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (pat.setTransform) pat.setTransform(new DOMMatrix().translateSelf(Math.random() * 256, Math.random() * 256).rotateSelf(Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI + (Math.random() - .5) * 30));
  m.strokeStyle = pat; m.lineCap = 'round'; m.lineWidth = Math.max(26, 54 * S * 1.6);
  m.globalAlpha = Math.min(.5, .16 + speed * .0009);
  m.beginPath(); m.moveTo(x0, y0); m.lineTo(x1, y1); m.stroke();
  m.globalAlpha = 1;
  rubbed += Math.hypot(x1 - x0, y1 - y0); dirty = true;
  if (rubbed > 2500) $('#hint').textContent = '숨은 동전과 문장이 떠올라요';
}

let actx = null, src = null, gain = null;
function audio() {
  if (actx) return;
  try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
  const len = actx.sampleRate * 2, buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (.6 + .4 * Math.sin(i / 90));
  src = actx.createBufferSource(); src.buffer = buf; src.loop = true;
  const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = .7;
  gain = actx.createGain(); gain.gain.value = 0;
  src.connect(f).connect(gain).connect(actx.destination); src.start();
}
const vol = v => { if (gain) gain.gain.setTargetAtTime(v, actx.currentTime, .04); };

cv.addEventListener('pointerdown', e => { audio(); last = { x: e.clientX, y: e.clientY, t: performance.now() }; try { cv.setPointerCapture(e.pointerId); } catch {} });
cv.addEventListener('pointermove', e => {
  if (!last) return;
  const now = performance.now(), dist = Math.hypot(e.clientX - last.x, e.clientY - last.y), sp = dist / Math.max(1, now - last.t) * 1000;
  rub(last.x, last.y, e.clientX, e.clientY, sp); vol(Math.min(.32, sp / 4000));
  last = { x: e.clientX, y: e.clientY, t: now };
});
addEventListener('pointerup', () => { last = null; vol(0); });

function composite(c) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.drawImage(P, 0, 0);
  const t = T.getContext('2d'); t.globalCompositeOperation = 'copy'; t.drawImage(D, 0, 0);
  t.globalCompositeOperation = 'destination-in'; t.drawImage(M, 0, 0); t.globalCompositeOperation = 'source-over';
  c.drawImage(T, 0, 0);
}
function loop() { if (dirty) { composite(cx); dirty = false; } requestAnimationFrame(loop); }

$('#fresh').onclick = () => { sent++; rubbed = 0; $('#hint').textContent = '종이를 문질러 보세요'; build(); };
$('#save').onclick = () => cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = '잔돈-탁본.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
let rt = null;
addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });
Promise.all([document.fonts.load("900 100px 'Noto Serif KR'"), document.fonts.load("900 100px 'Noto Sans KR'"), document.fonts.load("700 20px 'Noto Sans KR'")]).then(() => { sent = Math.floor(Math.random() * SENTENCES.length); build(); requestAnimationFrame(loop); });

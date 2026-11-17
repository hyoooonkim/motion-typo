import { A, spr } from './scenes1.js';
import { B } from './scenes2.js';

const WORDS = [...A, ...B];
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const P = { x: -9999, y: -9999, speed: 0, down: false, inside: false, still: 9 };
const E = { ctx, P, W: 0, H: 0, DPR: 1, top: 60, SH: 300, L: [], size: 0, tw: 0, st: {}, S: null, t: 0, layout, drawL, spr };
let cur = 0, want = 0, fade = 0, fdir = 1, ready = false, last = performance.now();

function layout(text, o = {}, font = E.S.font) {
  const chars = [...text];
  ctx.font = font(100);
  const ws = chars.map(c => ctx.measureText(c).width), tw = ws.reduce((a, b) => a + b, 0);
  const size = Math.min(E.SH * (o.maxH ?? .5), E.W * (o.maxW ?? .84) * 100 / tw), k = size / 100;
  let x = E.W / 2 - tw * k / 2;
  const y = E.top + E.SH * (o.cy ?? .5);
  const L = chars.map((ch, i) => {
    const w = ws[i] * k, l = { ch, i, w, hx: x + w / 2, hy: y, x: x + w / 2, y, vx: 0, vy: 0, r: 0, sx: 1, sy: 1, a: 1 };
    x += w; return l;
  });
  return { size, L, tw: tw * k };
}

function drawL(color, L = E.L, font = E.S.font, size = E.size, c = ctx) {
  c.font = font(size); c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const l of L) {
    if (l.a <= .003) continue;
    c.save(); c.globalAlpha = Math.min(1, l.a); c.fillStyle = l.c || color;
    c.translate(l.x, l.y); if (l.r) c.rotate(l.r); if (l.sx !== 1 || l.sy !== 1) c.scale(l.sx, l.sy);
    c.fillText(l.ch, 0, 0); c.restore();
  }
}

function enter(i, quiet) {
  cur = (i + WORDS.length) % WORDS.length;
  const S = E.S = WORDS[cur];
  E.st = {}; E.t = 0;
  const r = layout(S.word, S.lay); E.L = r.L; E.size = r.size; E.tw = r.tw;
  S.init?.(E);
  if (quiet) return;
  document.documentElement.style.setProperty('--bg', S.bg);
  document.documentElement.style.setProperty('--ink', S.ink);
  $('idx').textContent = `${String(cur + 1).padStart(2, '0')} / ${String(WORDS.length).padStart(2, '0')}`;
  $('roman').textContent = S.roman; $('lang').textContent = S.lang; $('hint').textContent = S.hint;
  [...$('dots').children].forEach((b, j) => b.classList.toggle('on', j === cur));
  history.replaceState(null, '', '#' + (cur + 1));
  typeBar(S);
}

function go(i) { if (fdir || i === cur) return; want = i; fdir = -1; }

let tok = 0;
const wait = ms => new Promise(r => setTimeout(r, ms));
async function typeBar(S) {
  const my = ++tok, cand = $('cand'), gloss = $('gloss'), cnt = $('cnt'), en = S.to === 'English';
  $('lang2').textContent = `${S.lang} → ${en ? '영어' : '한국어'}`;
  cand.textContent = ''; gloss.textContent = ''; cnt.textContent = ''; cnt.className = ''; cand.className = 'cur'; gloss.className = '';
  await wait(550);
  for (const ch of S.cand) { if (my !== tok) return; cand.textContent += ch; await wait(120); }
  await wait(800); if (my !== tok) return;
  cand.className = 'no';
  await wait(500); gloss.className = 'cur';
  for (const ch of S.gloss) { if (my !== tok) return; gloss.textContent += ch; await wait(en ? 26 : 38); }
  if (my !== tok) return;
  const n = S.gloss.split(/\s+/).length;
  cnt.textContent = en ? `1단어 → ${n} words` : `1단어 → ${n}단어`; cnt.className = 'on';
}

function resize() {
  E.DPR = Math.min(2, devicePixelRatio || 1); E.W = innerWidth; E.H = innerHeight;
  cv.width = E.W * E.DPR; cv.height = E.H * E.DPR;
  E.top = E.W < 640 ? 96 : 64;
  E.SH = Math.max(160, $('dock').getBoundingClientRect().top - E.top - 16);
  if (E.S) enter(cur, true);
}

function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  P.speed *= Math.exp(-5 * dt); P.still += dt;
  if (ready) {
    if (fdir) {
      fade = clamp(fade + fdir * dt / .28, 0, 1);
      if (fade === 0 && fdir < 0) { enter(want); fdir = 1; } else if (fade === 1) fdir = 0;
    }
    E.t += dt; E.S.step?.(E, dt);
    ctx.setTransform(E.DPR, 0, 0, E.DPR, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.shadowBlur = 0;
    ctx.fillStyle = E.S.bg; ctx.fillRect(0, 0, E.W, E.H);
    E.S.draw(E);
    ctx.setTransform(E.DPR, 0, 0, E.DPR, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.shadowBlur = 0;
    if (fade < 1) { ctx.globalAlpha = 1 - fade; ctx.fillStyle = E.S.bg; ctx.fillRect(0, 0, E.W, E.H); ctx.globalAlpha = 1; }
  }
  requestAnimationFrame(frame);
}

let sx = 0, sy = 0, st0 = 0, lastMove = 0;
function move(e) {
  const now = performance.now(), dtm = Math.max(1, now - lastMove) / 1000, d = Math.hypot(e.clientX - P.x, e.clientY - P.y);
  if (P.inside && d < 400) P.speed = P.speed * .5 + (d / dtm) * .5;
  if (d > 1.5) P.still = 0;
  P.x = e.clientX; P.y = e.clientY; P.inside = true; lastMove = now;
}
cv.addEventListener('pointermove', move);
cv.addEventListener('pointerdown', e => {
  move(e); P.down = true; sx = e.clientX; sy = e.clientY; st0 = performance.now();
  cv.setPointerCapture(e.pointerId); E.S.down?.(E);
});
const up = e => {
  if (!P.down) return;
  P.down = false; E.S.up?.(E);
  const dx = e.clientX - sx;
  if (e.pointerType === 'touch') {
    if (Math.abs(dx) > 80 && Math.abs(e.clientY - sy) < 70 && performance.now() - st0 < 400) go(cur + (dx < 0 ? 1 : -1));
    P.inside = false;
  }
};
cv.addEventListener('pointerup', up);
cv.addEventListener('pointercancel', up);
cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') P.inside = false; });
$('prev').onclick = () => go(cur - 1);
$('next').onclick = () => go(cur + 1);
addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(cur + 1); if (e.key === 'ArrowLeft') go(cur - 1); });
WORDS.forEach((w, i) => { const b = document.createElement('button'); b.setAttribute('aria-label', w.word); b.onclick = () => go(i); $('dots').append(b); });
addEventListener('resize', resize);

const fonts = [['700 40px "Noto Serif JP"', '木漏れ日積ん読'], ['300 40px Fraunces', 'Sa'], ['900 40px Fraunces', 'Ku'], ['700 40px Fredoka', 'Gi'], ['900 40px "Noto Serif KR"', '눈치']];
Promise.race([Promise.all(fonts.map(([f, t]) => document.fonts.load(f, t))), wait(3500)]).catch(() => {}).then(() => {
  resize();
  ready = true;
  enter(clamp((parseInt(location.hash.slice(1)) || 1) - 1, 0, WORDS.length - 1));
  fade = 0; fdir = 1;
  resize();
});
requestAnimationFrame(frame);

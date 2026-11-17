import { rnd, SUN } from './scene.js';
const TAU = Math.PI * 2;
let broom = null, puffs = [];

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

function makeBroom(R) {
  const P = 2, L = R * 1.55, Wf = R * 2.1, w = Math.ceil((L + 30) * P), h = Math.ceil((Wf + 30) * P), oy = h / 2;
  const head = canvas(w, h), x = head.getContext('2d'); x.scale(P, P); x.translate(14, oy / P);
  const twigs = [];
  for (let i = 0; i < 150; i++) {
    const t = rnd(-1, 1), len = L * (.82 + .18 * Math.cos(t * 1.25)) * rnd(.9, 1.06);
    twigs.push({ y0: t * 5 + rnd(-2, 2), x1: len, y1: t * Wf / 2 * rnd(.92, 1.02), bend: rnd(-6, 6), w: rnd(.5, 1.5), c: ['#7d5f34', '#9c7c4a', '#5e4526', '#b39560', '#4c381f', '#8b7046'][i % 6], fork: Math.random() < .3 });
  }
  x.fillStyle = 'rgba(70,50,25,.35)'; x.beginPath(); x.moveTo(0, -7); x.lineTo(L * .95, -Wf / 2); x.quadraticCurveTo(L * 1.08, 0, L * .95, Wf / 2); x.lineTo(0, 7); x.closePath(); x.fill();
  x.lineCap = 'round';
  twigs.forEach(t => {
    x.strokeStyle = t.c; x.lineWidth = t.w; x.beginPath(); x.moveTo(0, t.y0); x.quadraticCurveTo(t.x1 * .5, (t.y0 + t.y1) / 2 + t.bend, t.x1, t.y1); x.stroke();
    if (t.fork) { const a = Math.atan2(t.y1 - t.y0, t.x1), fx = t.x1 * .8, fy = t.y0 + (t.y1 - t.y0) * .8; x.lineWidth = t.w * .6; x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx + Math.cos(a + .5) * 10, fy + Math.sin(a + .5) * 10); x.stroke(); }
  });
  const g = x.createLinearGradient(0, 0, L, 0); g.addColorStop(0, 'rgba(30,18,6,.45)'); g.addColorStop(.35, 'rgba(30,18,6,0)'); g.addColorStop(1, 'rgba(255,240,200,.08)');
  x.globalCompositeOperation = 'source-atop'; x.fillStyle = g; x.fillRect(-14, -oy, L + 30, h); x.globalCompositeOperation = 'source-over';
  for (let k = 0; k < 4; k++) { x.fillStyle = k % 2 ? '#7b2f1e' : '#9b4128'; x.fillRect(-12 + k * 3.2, -7.5, 3.2, 15); }
  x.fillStyle = 'rgba(255,220,180,.25)'; x.fillRect(-12, -7.5, 12.8, 2);
  const sh = canvas(w, h), sx = sh.getContext('2d'); sx.shadowColor = '#000'; sx.shadowBlur = 5 * P; sx.shadowOffsetX = w; sx.drawImage(head, -w, 0);
  return { head, sh, P, ox: 14, oy, R };
}

const wp = (x, y, c, s, lx, ly) => [x + c * lx - s * ly, y + s * lx + c * ly];

function softLine(ctx, ax, ay, bx, by, w0, w1, alpha, blur) {
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  shadow(ctx, alpha, blur, () => { ctx.moveTo(ax + nx * w0, ay + ny * w0); ctx.lineTo(bx + nx * w1, by + ny * w1); ctx.lineTo(bx - nx * w1, by - ny * w1); ctx.lineTo(ax - nx * w0, ay - ny * w0); ctx.closePath(); });
}
function shadow(ctx, alpha, blur, path) {
  const D = ctx.getTransform().a, F = 10000;
  ctx.save(); ctx.shadowColor = `rgba(16,10,4,${alpha})`; ctx.shadowBlur = blur * D; ctx.shadowOffsetX = F * D; ctx.translate(-F, 0);
  ctx.fillStyle = '#000'; ctx.beginPath(); path(); ctx.fill(); ctx.restore();
}

export function drawBroom(ctx, X, Y, ang, speed, down, R) {
  if (!broom || broom.R !== R) broom = makeBroom(R);
  const c = Math.cos(ang), s = Math.sin(ang), lift = down ? 3 : 22, squash = 1 - Math.min(.14, speed / 3500), splay = 1 + Math.min(.12, speed / 4000);
  const HL = 190, hEnd = 150;
  const [sx, sy] = wp(X, Y, c, s, -14, 0), [ex, ey] = wp(X, Y, c, s, -14 - HL, 0);
  softLine(ctx, sx + SUN[0] * (lift + 6), sy + SUN[1] * (lift + 6), ex + SUN[0] * hEnd, ey + SUN[1] * hEnd, 3.5, 6, .5, 5);
  const draw = (img, alpha, ox, oy) => {
    ctx.save(); ctx.translate(X + ox, Y + oy); ctx.rotate(ang); ctx.scale(squash * (down ? 1 : 1.04), splay * (down ? 1 : 1.04)); ctx.globalAlpha = alpha;
    ctx.drawImage(img, -broom.ox, -broom.oy / broom.P, img.width / broom.P, img.height / broom.P); ctx.restore();
  };
  draw(broom.sh, down ? .75 : .45, SUN[0] * lift, SUN[1] * lift);
  draw(broom.head, 1, 0, 0);
  const px = (ex - X) * .06, py = (ey - Y) * .06, tx = ex + px, ty = ey + py;
  const dx = tx - sx, dy = ty - sy, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  const g = ctx.createLinearGradient(sx + nx * 6, sy + ny * 6, sx - nx * 6, sy - ny * 6);
  g.addColorStop(0, '#5a3a1e'); g.addColorStop(.45, '#b58653'); g.addColorStop(.6, '#c99a64'); g.addColorStop(1, '#4e3218');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx + nx * 3.4, sy + ny * 3.4); ctx.lineTo(tx + nx * 6, ty + ny * 6); ctx.lineTo(tx - nx * 6, ty - ny * 6); ctx.lineTo(sx - nx * 3.4, sy - ny * 3.4); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(tx, ty, 6, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(60,35,15,.35)'; ctx.lineWidth = .7;
  for (let k = 0; k < 3; k++) { const o = (k - 1) * 1.6, t0 = .1 + k * .25; ctx.beginPath(); ctx.moveTo(sx + dx * t0 + nx * o, sy + dy * t0 + ny * o); ctx.lineTo(sx + dx * (t0 + .3) + nx * o * 1.4, sy + dy * (t0 + .3) + ny * o * 1.4); ctx.stroke(); }
}

export function drawBlower(ctx, X, Y, ang, down, dt) {
  const c = Math.cos(ang), s = Math.sin(ang), hT = down ? 12 : 26, hB = 70, TL = 175;
  const [bx, by] = wp(X, Y, c, s, -TL, 0), [cx, cy] = wp(X, Y, c, s, -TL - 36, 6);
  if (down) for (let k = 0; k < 3; k++) puffs.push({ x: X + c * 6, y: Y + s * 6, vx: c * rnd(260, 520) + rnd(-80, 80), vy: s * rnd(260, 520) + rnd(-80, 80), life: rnd(.18, .4), r: rnd(1, 2.4) });
  shadow(ctx, .42, 14, () => ctx.ellipse(cx + SUN[0] * (hB + 10), cy + SUN[1] * (hB + 10), 44, 34, ang, 0, TAU));
  softLine(ctx, X + SUN[0] * hT, Y + SUN[1] * hT, bx + SUN[0] * hB, by + SUN[1] * hB, 6, 9, .45, 3 + (down ? 0 : 3));
  if (down) { ctx.save(); ctx.translate(X, Y); ctx.rotate(ang); ctx.lineCap = 'round';
    for (let k = 0; k < 10; k++) { const d0 = rnd(8, 120), len = rnd(18, 55), sp = (d0 * .5 + 8) * rnd(-1, 1); ctx.strokeStyle = `rgba(240,235,222,${rnd(.08, .22) * (1 - d0 / 160)})`; ctx.lineWidth = rnd(1, 2.5); ctx.beginPath(); ctx.moveTo(d0, sp * .8); ctx.lineTo(d0 + len, sp * (1 + len / 120)); ctx.stroke(); }
    ctx.restore(); }
  puffs = puffs.filter(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .92; p.vy *= .92; p.life -= dt; ctx.fillStyle = `rgba(235,225,205,${Math.max(0, p.life) * .7})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); return p.life > 0; });
  const nx = -s, ny = c, wT = 7, wB = 9.5;
  const g = ctx.createLinearGradient(X + nx * wT, Y + ny * wT, X - nx * wT, Y - ny * wT);
  g.addColorStop(0, '#202225'); g.addColorStop(.35, '#5d6168'); g.addColorStop(.5, '#7a7f87'); g.addColorStop(1, '#1b1c1f');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(X + nx * wT, Y + ny * wT); ctx.lineTo(bx + nx * wB, by + ny * wB); ctx.lineTo(bx - nx * wB, by - ny * wB); ctx.lineTo(X - nx * wT, Y - ny * wT); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.2;
  for (let d = 34; d < TL - 10; d += 11) { const w = wT + (wB - wT) * d / TL, px = X - c * d, py = Y - s * d; ctx.beginPath(); ctx.moveTo(px + nx * w, py + ny * w); ctx.lineTo(px - nx * w, py - ny * w); ctx.stroke(); }
  ctx.save(); ctx.translate(X, Y); ctx.rotate(ang);
  ctx.fillStyle = '#2b2d31'; ctx.beginPath(); ctx.ellipse(0, 0, 3.5, wT + 1.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#0c0c0d'; ctx.beginPath(); ctx.ellipse(1, 0, 2, wT - 1.5, 0, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang); ctx.scale(1.08, 1.08);
  const og = ctx.createLinearGradient(0, -30, 0, 30); og.addColorStop(0, '#ff9a3c'); og.addColorStop(.5, '#e9701c'); og.addColorStop(1, '#a6480d');
  ctx.fillStyle = og; ctx.beginPath(); ctx.roundRect(-38, -28, 76, 56, 16); ctx.fill();
  const hg = ctx.createRadialGradient(-20, -18, 2, -10, -8, 50); hg.addColorStop(0, 'rgba(255,230,190,.45)'); hg.addColorStop(1, 'rgba(255,230,190,0)'); ctx.fillStyle = hg; ctx.fill();
  ctx.strokeStyle = 'rgba(90,35,5,.5)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#c45a14'; ctx.beginPath(); ctx.arc(24, 14, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.arc(24, 14, 3.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#26282b'; ctx.beginPath(); ctx.arc(-6, 2, 17, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#3c3f44'; ctx.lineWidth = 2; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(-18, 2 + k * 5); ctx.lineTo(6, 2 + k * 5); ctx.stroke(); }
  ctx.strokeStyle = '#1d1e21'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-26, -24); ctx.quadraticCurveTo(0, -44, 26, -24); ctx.stroke();
  ctx.fillStyle = '#f4f1ea'; ctx.fillRect(14, -22, 18, 5); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-32, -26, 60, 3);
  ctx.restore();
}

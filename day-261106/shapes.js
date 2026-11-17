const TAU = Math.PI * 2;
const Y = 0, R = 1, O = 2, B = 3, D = 4, G = 5, EMPTY = -1;
const circle = (x, y, r) => c => c.arc(x, y, r, 0, TAU);
const oval = (x, y, rx, ry, a = 0) => c => c.ellipse(x, y, rx, ry, a, 0, TAU);
const poly = (...p) => c => { p.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); };
const heart = (s, dx = 0, dy = 0) => c => {
  c.moveTo(dx, dy + .95 * s); c.bezierCurveTo(dx - .35 * s, dy + .62 * s, dx - 1.02 * s, dy + .22 * s, dx - s, dy - .32 * s);
  c.bezierCurveTo(dx - .98 * s, dy - .86 * s, dx - .3 * s, dy - 1.02 * s, dx, dy - .5 * s); c.bezierCurveTo(dx + .3 * s, dy - 1.02 * s, dx + .98 * s, dy - .86 * s, dx + s, dy - .32 * s);
  c.bezierCurveTo(dx + 1.02 * s, dy + .22 * s, dx + .35 * s, dy + .62 * s, dx, dy + .95 * s); c.closePath();
};
const band = (x, y, r, w, a0, a1) => c => { c.arc(x, y, r + w, a0, a1); c.arc(x, y, r - w, a1, a0, true); c.closePath(); };
const spiral = (x, y, r0, r1, turns, w) => c => {
  const n = 160, pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n, a = t * turns * TAU, r = r0 + (r1 - r0) * t; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r, a]); }
  pts.forEach(([px, py, a], i) => { const qx = px + Math.cos(a) * w, qy = py + Math.sin(a) * w; i ? c.lineTo(qx, qy) : c.moveTo(qx, qy); });
  for (let i = n; i >= 0; i--) { const [px, py, a] = pts[i]; c.lineTo(px - Math.cos(a) * w, py - Math.sin(a) * w); }
  c.closePath();
};

export const SHAPES = {
  heart: { name: '하트', easy: true, parts: [[R, heart(1)]] },
  star: { name: '별', easy: true, parts: [[O, c => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .5 : 1; c.lineTo(Math.cos(a) * r, Math.sin(a) * r + .1); } c.closePath(); }]] },
  smile: { name: '웃는 얼굴', easy: true, parts: [[Y, circle(0, 0, 1)], [D, circle(-.36, -.28, .15)], [D, circle(.36, -.28, .15)], [D, band(0, .05, .5, .11, .35, Math.PI - .35)]] },
  tree: { name: '나무', easy: true, parts: [[B, poly([-.16, .1], [.16, .1], [.22, 1], [-.22, 1])], [Y, circle(0, -.3, .72)]] },
  bear: { name: '곰', parts: [
    [G, poly([-.78, .62], [.78, .62], [.86, 1], [-.86, 1])],
    [Y, circle(-.62, -.66, .26)], [Y, circle(.62, -.66, .26)],
    [B, circle(-.62, -.66, .12)], [B, circle(.62, -.66, .12)],
    [Y, oval(0, 0, .86, .74)],
    [D, circle(-.32, -.16, .085)], [D, circle(.32, -.16, .085)],
    [D, oval(0, .1, .16, .11)], [D, band(0, .06, .4, .055, .45, Math.PI - .45)],
  ] },
  bird: { name: '새', parts: [
    [R, circle(0, 0, 1)],
    [Y, poly([-.38, .3], [-.98, .62], [-.86, .84], [-.22, .5])],
    [Y, oval(-.04, .12, .56, .36, -.45)], [Y, circle(.4, -.26, .25)],
    [G, oval(-.18, -.02, .4, .17, -.55)],
    [O, poly([.56, -.42], [.98, -.24], [.56, -.1])],
    [D, circle(.44, -.32, .09)],
  ] },
  person: { name: '사람', parts: [
    [Y, poly([-.3, .08], [.3, .08], [.9, .62], [-.9, .62])],
    [B, poly([-.24, .6], [-.13, .6], [-.13, .9], [-.24, .9])], [B, poly([.13, .6], [.24, .6], [.24, .9], [.13, .9])],
    [R, oval(-.24, .93, .13, .07)], [R, oval(.24, .93, .13, .07)],
    [G, poly([-.22, -.4], [.22, -.4], [.28, .12], [-.28, .12])],
    [R, poly([-.22, -.38], [-.7, -.06], [-.64, .04], [-.2, -.2])], [G, poly([.22, -.38], [.7, -.06], [.64, .04], [.2, -.2])],
    [O, circle(0, -.62, .2)], [Y, oval(0, -.78, .3, .16)],
  ] },
  rose: { name: '장미', parts: [
    [G, poly([-.05, -.05], [.05, -.05], [.05, 1], [-.05, 1])],
    [G, oval(-.28, .56, .26, .1, -.5)], [G, oval(.28, .42, .26, .1, .5)],
    [Y, circle(0, -.42, .56)],
    [EMPTY, spiral(0, -.42, .04, .46, 2.4, .045)],
  ] },
};

export function buildMask(name, S, cx, cy, gw, gh, CELL) {
  const shp = SHAPES[name], m = new Int8Array(gw * gh).fill(-2);
  const c = document.createElement('canvas'); c.width = gw; c.height = gh;
  const x = c.getContext('2d', { willReadFrequently: true });
  shp.parts.forEach(([f, path]) => {
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, gw, gh);
    x.setTransform(S / CELL, 0, 0, S / CELL, cx / CELL, cy / CELL); x.beginPath(); path(x); x.fillStyle = '#000'; x.fill();
    const d = x.getImageData(0, 0, gw, gh).data;
    for (let i = 0; i < gw * gh; i++) if (d[i * 4 + 3] > 110) m[i] = f;
  });
  return m;
}

export function drawGuide(ctx, name, S, cx, cy, inks) {
  const shp = SHAPES[name];
  ctx.save(); ctx.translate(cx, cy); ctx.scale(S, S); ctx.lineJoin = 'round';
  shp.parts.forEach(([f, path]) => {
    ctx.beginPath(); path(ctx);
    if (f === EMPTY) { ctx.fillStyle = 'rgba(40,40,40,.25)'; ctx.fill(); return; }
    ctx.fillStyle = inks[f] + '22'; ctx.fill();
  });
  shp.parts.forEach(([f, path]) => {
    ctx.beginPath(); path(ctx);
    ctx.setLineDash([6 / S, 5 / S]); ctx.lineWidth = 2.2 / S; ctx.strokeStyle = f === EMPTY ? 'rgba(255,255,255,.5)' : inks[f]; ctx.stroke();
  });
  ctx.restore();
}

export function areaByFam(name) {
  const m = buildMask(name, 100, 120, 120, 240, 240, 1), a = [0, 0, 0, 0, 0, 0];
  for (const v of m) if (v >= 0) a[v]++;
  return a;
}

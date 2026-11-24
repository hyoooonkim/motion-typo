import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as CANNON from 'cannon-es';

const $ = s => document.querySelector(s);
const rngOf = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
let R = Math.random;
const pick = a => a[Math.floor(R() * a.length)];
const ri = (a, b) => a + Math.floor(R() * (b - a + 1));

const PALS = [
  { k: '원색', c: ['#e8261c', '#1d3fd6', '#f5c518', '#11a04a', '#111111', '#f7a8c8'] },
  { k: '형광', c: ['#00f060', '#ff1f6b', '#0040ff', '#ffe500', '#8a1cff', '#00e1ff'] },
  { k: '흙빛', c: ['#ff3a6e', '#b8860b', '#57528f', '#0d0c1f', '#e66f8f', '#c97845', '#3d6b24'] },
  { k: '파스텔', c: ['#ff8fb5', '#b9a2ff', '#8ff0c8', '#fff4b0', '#6f7dff', '#ff5e6a'] },
  { k: '흑백+빨강', c: ['#111111', '#f4f2ee', '#e3261b', '#9a9a9a', '#111111', '#e3261b'] },
  { k: '바다', c: ['#0a2a8a', '#2f7fff', '#9fd8ff', '#ffffff', '#00c2b8', '#ffcf3f'] },
];
const MOTIFS = [
  { k: '도형', m: ['tri', 'half', 'sq', 'solid', 'tri'] },
  { k: '눈', m: ['eye', 'eye', 'tri', 'half'] },
  { k: '과녁', m: ['ring', 'ring', 'glow'] },
  { k: '줄무늬', m: ['vstripe', 'vstripe', 'check', 'solid'] },
  { k: '점', m: ['dots', 'check', 'grid', 'dots'] },
  { k: '타원', m: ['ellipse'] },
];
const GRIDS = [16, 20, 24, 28, 32, 40];

function ell(c, x, y, rx, ry) { c.beginPath(); c.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, 7); c.fill(); }
const SHAPES = [
  { k: '새', d(c, w, h) {
    const lean = (R() - .5) * .08;
    ell(c, w * .5, h * .62, w * .3, h * .17);
    c.fillRect(w * (.43 + lean), h * .13, w * .14, h * .44);
    ell(c, w * (.5 + lean), h * .12, w * .1, h * .06);
    c.fillRect(w * (.56 + lean), h * .1, w * .1, h * .03);
    c.fillRect(w * .36, h * .74, w * .06, h * .24); c.fillRect(w * .58, h * .74, w * .06, h * .2);
    c.fillRect(w * .3, h * .96, w * .14, h * .03);
  } },
  { k: '앉은 사람', d(c, w, h) {
    ell(c, w * .5, h * .2, w * .11, h * .085);
    c.beginPath(); c.moveTo(w * .42, h * .14); c.lineTo(w * .5, h * .06); c.lineTo(w * .58, h * .14); c.fill();
    c.fillRect(w * .45, h * .27, w * .1, h * .06);
    c.beginPath(); c.moveTo(w * .32, h * .33); c.lineTo(w * .68, h * .33); c.lineTo(w * .74, h * .68); c.lineTo(w * .26, h * .68); c.fill();
    ell(c, w * .5, h * .74, w * .4, h * .09);
    c.fillRect(w * .12, h * .78, w * .76, h * .1);
  } },
  { k: '탈', d: null },
  { k: '꽃병', d(c, w, h) {
    c.beginPath();
    for (let i = 0; i <= 60; i++) { const t = i / 60, y = h * (.06 + t * .9); const r = w * (.12 + .09 * Math.sin(t * 9 + 1) * (t < .45 ? 1 : 0) + .3 * Math.sin(Math.min(1, Math.max(0, (t - .3) / .7)) * Math.PI)); c.lineTo(w * .5 + r, y); }
    for (let i = 60; i >= 0; i--) { const t = i / 60, y = h * (.06 + t * .9); const r = w * (.12 + .09 * Math.sin(t * 9 + 1) * (t < .45 ? 1 : 0) + .3 * Math.sin(Math.min(1, Math.max(0, (t - .3) / .7)) * Math.PI)); c.lineTo(w * .5 - r, y); }
    c.fill();
  } },
  { k: '고양이', d(c, w, h) {
    ell(c, w * .5, h * .66, w * .3, h * .27);
    ell(c, w * .5, h * .3, w * .2, h * .13);
    c.beginPath(); c.moveTo(w * .31, h * .27); c.lineTo(w * .33, h * .1); c.lineTo(w * .45, h * .2); c.fill();
    c.beginPath(); c.moveTo(w * .69, h * .27); c.lineTo(w * .67, h * .1); c.lineTo(w * .55, h * .2); c.fill();
    c.lineWidth = w * .08; c.lineCap = 'round'; c.beginPath(); c.moveTo(w * .76, h * .88); c.quadraticCurveTo(w * .97, h * .8, w * .9, h * .52); c.stroke();
    c.fillRect(w * .24, h * .9, w * .52, h * .06);
  } },
  { k: '나무', d(c, w, h) {
    for (let i = 0; i < 4; i++) { const y0 = h * (.04 + i * .19), y1 = y0 + h * .27, hw = w * (.18 + i * .1); c.beginPath(); c.moveTo(w * .5, y0); c.lineTo(w * .5 + hw, y1); c.lineTo(w * .5 - hw, y1); c.fill(); }
    c.fillRect(w * .42, h * .84, w * .16, h * .14);
  } },
];
function silhouette(si, cols, rows) {
  const cv = document.createElement('canvas'); cv.width = cols; cv.height = rows;
  const c = cv.getContext('2d'); c.fillStyle = c.strokeStyle = '#000';
  const g = [];
  if (SHAPES[si].d) {
    SHAPES[si].d(c, cols, rows);
    const d = c.getImageData(0, 0, cols, rows).data;
    for (let y = 0; y < rows; y++) { g.push([]); for (let x = 0; x < cols; x++) g[y].push(d[(y * cols + x) * 4 + 3] > 110); }
  } else {
    const hc = Math.ceil(cols / 2);
    for (let y = 0; y < rows; y++) {
      g.push(new Array(cols).fill(false));
      for (let x = 0; x < hc; x++) {
        const dx = (x - cols / 2 + .5) / (cols / 2), dy = (y - rows * .45) / (rows * .5);
        const r = Math.hypot(dx * .9, dy);
        const on = R() < 1.25 - r * 1.15 || (r < .55 && R() < .9);
        g[y][x] = g[y][cols - 1 - x] = on;
      }
    }
    const hole = (fx, fy, fw, fh) => { for (let y = Math.round(rows * fy); y < Math.round(rows * (fy + fh)); y++) for (let x = Math.round(cols * fx); x < Math.round(cols * (fx + fw)); x++) { if (g[y]) { g[y][x] = false; g[y][cols - 1 - x] = false; } } };
    hole(.28, .34, .12, .07); hole(.42, .62, .08, .1); hole(.36, .78, .1, .04);
  }
  return g;
}


const MERGES = ['한 칸씩', '가로로', '세로로', '덩어리', '가로세로', '크게'];
const SYMS = ['그대로', '좌우 대칭', '뒤집기', '기울임', '눕힘', '계단'];
const REPS = [
  { k: '하나', c: [[0, 0, 1, 1]] },
  { k: '둘', c: [[0, .08, .5, .84], [.5, .08, .5, .84]] },
  { k: '셋', c: [[0, .15, 1 / 3, .7], [1 / 3, .15, 1 / 3, .7], [2 / 3, .15, 1 / 3, .7]] },
  { k: '2×2', c: [[0, 0, .5, .5], [.5, 0, .5, .5], [0, .5, .5, .5], [.5, .5, .5, .5]] },
  { k: '큰+작은', c: [[0, 0, .74, 1], [.72, .6, .28, .4]] },
  { k: '아홉', c: [0, 1, 2].flatMap(j => [0, 1, 2].map(i => [i / 3, j / 3, 1 / 3, 1 / 3])) },
];
const BGS = ['종이', '검정', '팔레트색', '모눈', '줄', '하양'];
const NOISES = ['없음', '구멍', '줄 밀림', '흩날림', '녹아내림', '그림자'];
const ALLM = ['tri', 'half', 'sq', 'eye', 'ring', 'glow', 'vstripe', 'check', 'dots', 'grid', 'ellipse', 'solid'];

function tile(c, m, x, y, s, a, b, k, w = 1, h = 1) {
  c.save(); c.translate(x, y); c.scale(w, h);
  const cx = s / 2, cy = s / 2;
  c.fillStyle = a; c.fillRect(0, 0, s + .5 / w, s + .5 / h);
  c.fillStyle = b;
  switch (m) {
    case 'tri': c.beginPath(); c.moveTo(cx, s * .1); c.lineTo(s * .95, s * .96); c.lineTo(s * .05, s * .96); c.fill(); break;
    case 'half': c.beginPath(); c.arc(cx, s * .55, s * .48, Math.PI, 0); c.fill(); c.fillStyle = k; c.beginPath(); c.arc(cx, s, s * .48, Math.PI, 0); c.fill(); break;
    case 'sq': c.fillRect(s * .06, s * .06, s * .88, s * .88); c.strokeStyle = '#111'; c.lineWidth = Math.max(1, s * .07); c.strokeRect(s * .06, s * .06, s * .88, s * .88); break;
    case 'eye':
      c.fillStyle = '#e8261c'; ell(c, cx, cy, s * .48, s * .34);
      c.fillStyle = '#fff'; ell(c, cx, cy, s * .36, s * .22);
      c.fillStyle = b; ell(c, cx, cy, s * .18, s * .18);
      c.fillStyle = '#111'; ell(c, cx, cy + s * .02, s * .08, s * .1); break;
    case 'ring': { const n = 2 + (k.charCodeAt(2) % 3); for (let i = n; i > 0; i--) { c.fillStyle = i % 2 ? b : (i === 1 ? k : a); c.beginPath(); c.arc(cx, cy, s * .47 * i / n, 0, 7); c.fill(); } c.fillStyle = k; c.beginPath(); c.arc(cx, cy, s * .09, 0, 7); c.fill(); break; }
    case 'glow': { const g = c.createRadialGradient(cx, cy, 0, cx, cy, s * .55); g.addColorStop(0, k); g.addColorStop(.45, b); g.addColorStop(1, a); c.fillStyle = g; c.fillRect(0, 0, s, s); break; }
    case 'vstripe': for (let i = 0; i < 3; i++) { c.fillStyle = [a, b, k][i]; c.fillRect(s * i / 3, 0, s / 3 + .5, s); } break;
    case 'check': for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2) c.fillRect(s * i / 2, s * j / 2, s / 2 + .5, s / 2 + .5); break;
    case 'dots': c.fillStyle = k; c.beginPath(); c.arc(cx, cy, s * .3, 0, 7); c.fill(); break;
    case 'grid': c.strokeStyle = '#111'; c.lineWidth = Math.max(1, s * .06); c.strokeRect(.5, .5, s - 1, s - 1); c.beginPath(); c.moveTo(0, cy); c.lineTo(s, cy); c.stroke(); break;
    case 'ellipse': ell(c, cx, cy, s * .48, s * .44); break;
    case 'digit': c.font = `700 ${s * .9}px 'IBM Plex Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(k, cx, cy + s * .04); break;
  }
  c.restore();
}

function blockSize(mode, isEll) {
  if (mode === 0) return isEll ? [ri(1, 4), 1] : [1, 1];
  if (mode === 1) return [ri(1, 6), 1];
  if (mode === 2) return [1, ri(1, 7)];
  if (mode === 3) { const n = ri(1, 3); return [n, n]; }
  if (mode === 4) return R() < .5 ? [ri(1, 6), 1] : [1, ri(1, 6)];
  return R() < .45 ? [ri(2, 5), ri(2, 5)] : [1, 1];
}
function figure(seed, v) {
  R = rngOf(seed);
  let cols = GRIDS[v.grid], rows = Math.round(cols * 1.3);
  let g = silhouette(v.shape, cols, rows);
  if (v.sym === 4) { const ng = []; for (let y = 0; y < cols; y++) { ng.push([]); for (let x = 0; x < rows; x++) ng[y].push(g[rows - 1 - x][y]); } g = ng; [cols, rows] = [rows, cols]; }
  if (v.sym === 2) g.reverse();
  if (v.sym === 1) g.forEach(r => { for (let x = Math.ceil(cols / 2); x < cols; x++) r[x] = r[cols - 1 - x]; });
  const pal = v.pal === null ? ['#d9d5cc'] : PALS[v.pal].c, mot = v.motif === null ? ['solid'] : MOTIFS[v.motif].m;
  const band = () => { const a = pick(pal); let b = pick(pal), n = 0; while (b === a && pal.length > 1 && n++ < 9) b = pick(pal); return { m: R() < .05 && v.noise !== null ? pick(ALLM) : pick(mot), a, b, k: pick(pal) }; };
  const cell = [];
  let y = 0;
  while (y < rows) {
    const bh = ri(1, Math.max(2, Math.round(rows / 9)));
    const main = band(), side = band(), split = R() < .35 ? ri(Math.floor(cols * .25), Math.floor(cols * .42)) : -1;
    for (let yy = y; yy < Math.min(rows, y + bh); yy++) {
      cell.push([]);
      for (let x = 0; x < cols; x++) cell[yy].push(g[yy][x] ? (R() < .14 ? band() : split >= 0 && (x < split || x >= cols - split) ? side : main) : null);
    }
    y += bh;
  }
  if (v.sym === 1) cell.forEach(r => { for (let x = Math.ceil(cols / 2); x < cols; x++) r[x] = r[cols - 1 - x]; });
  const used = cell.map(r => r.map(() => false)), blocks = [];
  for (let yy = 0; yy < rows; yy++) for (let x = 0; x < cols; x++) {
    if (!cell[yy][x] || used[yy][x]) continue;
    let [bw, bh] = blockSize(v.merge ?? 0, cell[yy][x].m === 'ellipse');
    const ok = (w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (yy + j >= rows || x + i >= cols || !cell[yy + j][x + i] || used[yy + j][x + i]) return false; return true; };
    while (!ok(bw, bh)) { if (bw >= bh && bw > 1) bw--; else if (bh > 1) bh--; else break; }
    for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) used[yy + j][x + i] = true;
    blocks.push({ x, y: yy, w: bw, h: bh, ...cell[yy][x] });
  }
  if (v.sym === 3) blocks.forEach(b => b.x += Math.round((rows - 1 - b.y) * .45));
  if (v.sym === 5) { const st = Math.max(2, Math.round(rows / 7)); blocks.forEach(b => b.x += (Math.floor(b.y / st) % 3) * 2); }
  const nz = v.noise ?? -1;
  let out = blocks;
  if (nz === 1) out = out.filter(() => R() > .13);
  if (nz === 2) { const sh = {}; for (let yy = 0; yy < rows; yy++) if (R() < .14) sh[yy] = ri(-4, 4) || 2; out.forEach(b => { if (sh[b.y]) b.x += sh[b.y]; }); }
  const extra = [];
  const strayN = nz === 3 ? .09 : nz === -1 ? 0 : .025;
  for (let i = 0; i < Math.round(out.length * strayN); i++) {
    const t = pick(out), far = nz === 3 ? 7 : 3;
    extra.push({ x: t.x + ri(-far, far), y: t.y + ri(-far, nz === 3 ? 1 : far), w: 1, h: 1, m: nz === 3 ? t.m : 'solid', a: nz === 3 ? t.a : '#111', b: t.b, k: t.k, stray: true });
  }
  if (nz === 4) {
    const bottom = {};
    out.forEach(b => { for (let i = 0; i < b.w; i++) { const X = b.x + i, Y = b.y + b.h - 1; if (!bottom[X] || bottom[X].Y < Y) bottom[X] = { Y, b }; } });
    Object.entries(bottom).forEach(([X, { Y, b }]) => { if (R() < .3) { const L = ri(2, 9); for (let j = 1; j <= L; j++) extra.push({ x: +X, y: Y + j, w: 1, h: 1, m: 'solid', a: b.a, b: b.a, k: b.a, drip: j }); } });
  }
  out = out.concat(extra);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  out.forEach(b => { x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x + b.w); y0 = Math.min(y0, b.y); y1 = Math.max(y1, b.y + b.h); });
  out.forEach(b => { b.x -= x0; b.y -= y0; });
  return { cols: x1 - x0, rows: y1 - y0, blocks: out, shadow: nz === 5, n: blocks.length };
}

const PW = 900, PH = 1200, AREA = { x: 54, y: 150, w: 792, h: 940 };
const lum = c => { const n = parseInt(c.slice(1), 16); return ((n >> 16) * .3 + ((n >> 8) & 255) * .59 + (n & 255) * .11) / 255; };
function bgOf(seed, v) {
  R = rngOf(seed ^ 0x5bd1e995);
  const pal = v.pal === null ? ['#d9d5cc'] : PALS[v.pal].c;
  const c = ['#f1f0ec', '#141414', pick(pal), '#f1f0ec', '#ece8de', '#ffffff'][v.bg ?? 0];
  return { c, grid: v.bg === 3, lines: v.bg === 4, dark: lum(c) < .42 };
}
function compose(seed, v) {
  const rep = REPS[v.rep ?? 0], many = rep.c.length > 1;
  return rep.c.map((r, i) => {
    const F = figure(seed + i * 7919, v), cw = r[2] * AREA.w, ch = r[3] * AREA.h;
    const s = Math.max(2, Math.floor(Math.min(cw / F.cols, ch / F.rows) * (many ? .9 : 1)));
    return { F, s, ox: Math.round(AREA.x + r[0] * AREA.w + (cw - F.cols * s) / 2), oy: Math.round(AREA.y + r[1] * AREA.h + (ch - F.rows * s) / 2) };
  });
}
function drawBg(c, B) {
  c.fillStyle = B.c; c.fillRect(0, 0, PW, PH);
  c.strokeStyle = B.dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.1)'; c.lineWidth = 1;
  if (B.grid) { c.beginPath(); for (let x = 54; x <= 846; x += 24) { c.moveTo(x + .5, 150); c.lineTo(x + .5, 1090); } for (let y = 150; y <= 1090; y += 24) { c.moveTo(54, y + .5); c.lineTo(846, y + .5); } c.stroke(); }
  if (B.lines) { c.beginPath(); for (let y = 150; y <= 1090; y += 14) { c.moveTo(0, y + .5); c.lineTo(PW, y + .5); } c.stroke(); }
}
function drawText(c, B, info) {
  const ink = B.dark ? '#f1f0ec' : '#151515', sub = B.dark ? 'rgba(241,240,236,.6)' : '#77736b';
  c.fillStyle = ink; c.textBaseline = 'alphabetic';
  c.font = `900 64px 'Noto Sans KR', sans-serif`; c.textAlign = 'left'; c.fillText('우연', 54, 112);
  c.font = `600 26px 'IBM Plex Mono', monospace`; c.textAlign = 'right'; c.fillText(`No.${pad(info.no)}`, 846, 108);
  c.fillRect(54, 130, 792, 2); c.fillRect(54, 1104, 792, 2);
  c.font = `500 16px 'IBM Plex Mono', 'Noto Sans KR', monospace`; c.textAlign = 'left';
  c.fillText(info.l1, 54, 1134);
  c.fillStyle = sub; c.fillText(info.l2, 54, 1158);
  c.textAlign = 'right'; c.fillText(info.l3, 846, 1182);
}
function drawBlock(c, p, b) { tile(c, b.m, p.ox + b.x * p.s, p.oy + b.y * p.s, p.s, b.a, b.b, b.k, b.w, b.h); }
function drawShadow(c, p, B) {
  c.fillStyle = B.dark ? 'rgba(0,0,0,.55)' : '#151515';
  const o = Math.max(2, p.s * .45);
  p.F.blocks.forEach(b => { if (!b.stray) c.fillRect(p.ox + b.x * p.s + o, p.oy + b.y * p.s + o, b.w * p.s, b.h * p.s); });
}

const DIE_BG = '#f6f3ec';
function face(draw) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'); x.fillStyle = DIE_BG; x.fillRect(0, 0, 256, 256);
  draw(x); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.userData.redraw = () => { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.fillStyle = DIE_BG; x.fillRect(0, 0, 256, 256); draw(x); t.needsUpdate = true; };
  return t;
}
const label = (x, s) => { x.fillStyle = '#5a564e'; x.font = `500 22px 'Noto Sans KR', sans-serif`; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillText(s, 128, 234); };
const ICON_V = { shape: 4, pal: 0, motif: null, grid: 0, merge: 0, sym: 0, rep: 0, bg: 0, noise: null };
function miniFigure(x, v, box = [36, 16, 184, 190], ink) {
  const F = figure(99, { ...ICON_V, ...v });
  const s = Math.min(box[2] / F.cols, box[3] / F.rows), ox = box[0] + (box[2] - F.cols * s) / 2, oy = box[1] + (box[3] - F.rows * s) / 2;
  if (F.shadow) { x.fillStyle = '#b8b2a6'; F.blocks.forEach(b => x.fillRect(ox + b.x * s + s * .5, oy + b.y * s + s * .5, b.w * s, b.h * s)); }
  F.blocks.forEach(b => { if (ink) { x.fillStyle = ink; x.fillRect(ox + b.x * s + .4, oy + b.y * s + .4, b.w * s - .8, b.h * s - .8); } else tile(x, b.m, ox + b.x * s, oy + b.y * s, s, b.a, b.b, b.k, b.w, b.h); });
}
const FACES = [
  { k: '형태', key: 'shape', names: SHAPES.map(s => s.k), draw: (x, i) => {
    R = rngOf(i + 7); const g = silhouette(i, 20, 26), s = 6.2;
    x.fillStyle = '#151515';
    g.forEach((r, yy) => r.forEach((on, xx) => on && x.fillRect(66 + xx * s, 22 + yy * s, s - .6, s - .6)));
  } },
  { k: '팔레트', key: 'pal', names: PALS.map(p => p.k), draw: (x, i) => {
    const c = PALS[i].c;
    [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([a, b], j) => { x.fillStyle = c[j]; x.fillRect(48 + a * 82, 28 + b * 82, 78, 78); });
  } },
  { k: '무늬', key: 'motif', names: MOTIFS.map(m => m.k), draw: (x, i) => {
    const m = MOTIFS[i].m, c = PALS[0].c;
    if (m[0] === 'ellipse') { tile(x, 'ellipse', 48, 28, 80, c[2], c[0], c[4], 2, 1); tile(x, 'ellipse', 48, 108, 80, c[3], c[1], c[5], 1, 1); tile(x, 'ellipse', 128, 108, 80, c[4], c[2], c[0], 1, 1); return; }
    [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([a, b], j) => tile(x, m[j % m.length], 48 + a * 80, 28 + b * 80, 80, c[(j + 2) % 6], c[j % 6], c[(j + 4) % 6]));
  } },
  { k: '격자', key: 'grid', names: GRIDS.map(g => `${g}칸`), draw: (x, i) => {
    x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = 1;
    const n = GRIDS[i] / 4; for (let j = 0; j <= n; j++) { const p = 38 + j * 180 / n; x.beginPath(); x.moveTo(p, 22); x.lineTo(p, 202); x.moveTo(38, 22 + j * 180 / n); x.lineTo(218, 22 + j * 180 / n); x.stroke(); }
    x.fillStyle = '#151515'; x.font = `600 92px 'IBM Plex Mono', monospace`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(GRIDS[i], 128, 112);
  } },
  { k: '병합', key: 'merge', names: MERGES, draw: (x, i) => {
    R = rngOf(31 + i); const c = PALS[0].c, N = 6, s = 176 / N, used = Array.from({ length: N }, () => Array(N).fill(false));
    for (let y = 0; y < N; y++) for (let xx = 0; xx < N; xx++) {
      if (used[y][xx]) continue;
      let [w, h] = blockSize(i, false); w = Math.min(w, N - xx); h = Math.min(h, N - y);
      while ([...Array(h).keys()].some(j => [...Array(w).keys()].some(q => used[y + j][xx + q]))) { if (w > 1) w--; else h--; }
      for (let j = 0; j < h; j++) for (let q = 0; q < w; q++) used[y + j][xx + q] = true;
      tile(x, pick(['tri', 'half', 'ellipse', 'eye', 'solid']), 40 + xx * s, 22 + y * s, s, pick(c), pick(c), pick(c), w, h);
    }
  } },
  { k: '대칭', key: 'sym', names: SYMS, draw: (x, i) => miniFigure(x, { shape: 4, grid: 0, sym: i }, [40, 18, 176, 186], '#151515') },
  { k: '반복', key: 'rep', names: REPS.map(r => r.k), draw: (x, i) => {
    x.fillStyle = '#151515';
    REPS[i].c.forEach(([a, b, w, h]) => { const X = 46 + a * 164, Y = 24 + b * 176, W = w * 164, H = h * 176, r = Math.min(W, H) * .36; x.fillRect(X + W / 2 - r * .7, Y + H / 2 - r, r * 1.4, r * 2); });
  } },
  { k: '배경', key: 'bg', names: BGS, draw: (x, i) => {
    const B = bgOf(3, { pal: 0, bg: i });
    x.save(); x.beginPath(); x.rect(48, 24, 160, 176); x.clip(); x.translate(48, 24); x.scale(160 / 900, 176 / 1200); drawBg(x, B); x.restore();
    x.strokeStyle = 'rgba(0,0,0,.25)'; x.strokeRect(48.5, 24.5, 160, 176);
    x.fillStyle = B.dark ? '#f1f0ec' : '#151515'; x.fillRect(100, 70, 56, 84);
  } },
  { k: '흐트러짐', key: 'noise', names: NOISES, draw: (x, i) => miniFigure(x, { shape: 3, grid: 0, noise: i }, [44, 16, 168, 190], '#151515') },
];
FACES.forEach(f => { const d = f.draw; f.draw = (x, i) => { d(x, i); label(x, f.names[i]); }; });
const table = $('#table');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
table.prepend(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
scene.add(new THREE.HemisphereLight('#ffffff', '#b9b2a4', 1.6));
const sun = new THREE.DirectionalLight('#ffffff', 2.4);
sun.position.set(-4, 12, 5); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 30 }); sun.shadow.radius = 5; sun.shadow.bias = -.0006;
scene.add(sun);
const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: .22 }));
floorMesh.rotation.x = -Math.PI / 2; floorMesh.receiveShadow = true; scene.add(floorMesh);

const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -32, 0) });
world.allowSleep = true;
const mFloor = new CANNON.Material(), mDie = new CANNON.Material();
world.addContactMaterial(new CANNON.ContactMaterial(mFloor, mDie, { friction: .32, restitution: .32 }));
world.addContactMaterial(new CANNON.ContactMaterial(mDie, mDie, { friction: .2, restitution: .4 }));
const floorBody = new CANNON.Body({ mass: 0, material: mFloor, shape: new CANNON.Plane() });
floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); world.addBody(floorBody);
const walls = [0, 1, 2, 3].map(i => { const b = new CANNON.Body({ mass: 0, material: mFloor, shape: new CANNON.Plane() }); world.addBody(b); return b; });
let HX = 5, HZ = 3.2;
function placeWalls() {
  const set = (b, x, z, ry) => { b.position.set(x, 0, z); b.quaternion.setFromEuler(0, ry, 0); };
  set(walls[0], -HX, 0, Math.PI / 2); set(walls[1], HX, 0, -Math.PI / 2); set(walls[2], 0, -HZ, 0); set(walls[3], 0, HZ, Math.PI);
}

const SIZE = 1.15, NORMALS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map(v => new CANNON.Vec3(...v));
const geo = new RoundedBoxGeometry(SIZE, SIZE, SIZE, 5, .13);
const dice = FACES.map((f, di) => {
  const order = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - .5);
  const mats = order.map(v => new THREE.MeshStandardMaterial({ map: face(x => f.draw(x, v)), roughness: .42, metalness: 0 }));
  const mesh = new THREE.Mesh(geo, mats); mesh.castShadow = true; scene.add(mesh);
  const body = new CANNON.Body({ mass: 1, material: mDie, shape: new CANNON.Box(new CANNON.Vec3(SIZE / 2, SIZE / 2, SIZE / 2)), sleepSpeedLimit: .12, sleepTimeLimit: .25 });
  body.linearDamping = .08; body.angularDamping = .12;
  body.position.set(-1.8 + di * 1.2, SIZE / 2, 0); world.addBody(body);
  return { f, mesh, body, order, value: null };
});

let actx = null, lastClick = 0;
function click(v, hi) {
  if (!actx || v < 1.2) return;
  const now = actx.currentTime; if (now - lastClick < .025) return; lastClick = now;
  const len = .07, buf = actx.createBuffer(1, actx.sampleRate * len, actx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 6);
  const src = actx.createBufferSource(); src.buffer = buf;
  const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = (hi ? 2600 : 1400) + Math.random() * 900; f.Q.value = 2.2;
  const g = actx.createGain(); g.gain.value = Math.min(.9, v / 14);
  src.connect(f).connect(g).connect(actx.destination); src.start();
}
dice.forEach(d => d.body.addEventListener('collide', e => click(Math.abs(e.contact.getImpactVelocityAlongNormal()), e.body.material === mDie)));
let rolling = false, still = 0, rollNo = 0, settleT = 0, next = 0, roundSeed = 0;
let phase = 'idle', pt = 0, slot = null, canLift = false, rattleT = 0;
const cup = new THREE.Group();
{
  const prof = [[1.08, 0], [1.1, .08], [1.02, .2], [.9, 1.75], [.88, 1.9], [0, 1.94]].map(([r, y]) => new THREE.Vector2(r, y));
  const leather = new THREE.MeshStandardMaterial({ color: '#4a2f22', roughness: .62, metalness: 0, side: THREE.DoubleSide });
  const m = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), leather); m.castShadow = true; cup.add(m);
  const band = new THREE.Mesh(new THREE.TorusGeometry(1.06, .045, 10, 64), new THREE.MeshStandardMaterial({ color: '#c8a46a', roughness: .35, metalness: .6 }));
  band.rotation.x = Math.PI / 2; band.position.y = .22; cup.add(band);
  const band2 = band.clone(); band2.scale.setScalar(.85); band2.position.y = 1.72; cup.add(band2);
}
cup.visible = false; scene.add(cup);
const ring = Array.from({ length: 12 }, () => { const b = new CANNON.Body({ mass: 0, material: mFloor, shape: new CANNON.Box(new CANNON.Vec3(.3, 1.1, .06)) }); b.collisionResponse = false; b.position.set(0, -20, 0); world.addBody(b); return b; });
function ringAt(x, z, on) {
  ring.forEach((b, i) => { const a = i / ring.length * Math.PI * 2; b.position.set(on ? x + Math.cos(a) * 1.0 : 0, on ? 1.1 : -20, on ? z + Math.sin(a) * 1.0 : 0); b.quaternion.setFromEuler(0, Math.PI / 2 - a, 0); b.collisionResponse = on; });
}
function freeSpot() {
  const taken = dice.filter(d => d.value !== null).map(d => d.body.position);
  let best = null, bd = -1;
  for (let i = 0; i < 160; i++) {
    const p = { x: (Math.random() * 2 - 1) * (HX - 1.15), z: (Math.random() * 2 - 1) * (HZ - 1.15) };
    const d = taken.reduce((m, q) => Math.min(m, Math.hypot(q.x - p.x, q.z - p.z)), 9);
    if (d > 2.25) return p;
    if (d > bd) { bd = d; best = p; }
  }
  return best;
}
function park() {
  dice.forEach(d => {
    if (world.bodies.includes(d.body)) world.removeBody(d.body);
    d.mesh.visible = false; d.value = null;
  });
}
function rollLabel() {
  const b = $('#roll'), h = $('#hint');
  if (phase === 'covered') { b.textContent = canLift ? '컵 들어 올리기' : '굴러가는 중…'; b.disabled = !canLift; h.textContent = canLift ? '컵을 클릭하거나 위로 끌어 올려도 돼요' : '컵 안에서 주사위가 멈추길 기다려요'; return; }
  if (phase !== 'idle') { b.disabled = true; if (phase === 'shake') { b.textContent = '흔드는 중…'; h.textContent = '딸그락딸그락'; } return; }
  b.disabled = !!anim;
  b.textContent = next === 0 && rollNo ? '새 포스터 · 형태부터' : `${FACES[next].k} 주사위 흔들기 · ${next + 1}/${FACES.length}`;
  h.textContent = '주사위를 컵에 넣고 흔들어 엎어요';
}
function throwDice(dir, user) {
  if (phase !== 'idle' || anim) return;
  if (user && !actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch {} }
  if (next === 0) { park(); roundSeed = Math.floor(Math.random() * 2 ** 31); $('#labels').innerHTML = ''; dice.forEach(d => d.tag = null); }
  const d = dice[next];
  world.removeBody(d.body); d.mesh.visible = false;
  if (d.tag) { d.tag.remove(); d.tag = null; }
  slot = freeSpot();
  cup.visible = true; cup.position.set(0, 2.3, .4); cup.rotation.set(0, 0, 0);
  phase = 'shake'; pt = 0; rattleT = 0; rollLabel();
}
function lift() {
  if (phase !== 'covered' || !canLift) return;
  const d = dice[next];
  d.value = d.order[topFace(d).idx];
  phase = 'lift'; pt = 0; ringAt(0, 0, false);
  next++;
  showLabels();
  if (next === FACES.length) { next = 0; make(); } else preview(next);
  rollLabel();
}
function topFace(d) {
  let best = -2, idx = 0;
  NORMALS.forEach((n, i) => { const w = d.body.quaternion.vmult(n); if (w.y > best) { best = w.y; idx = i; } });
  return { idx, dot: best };
}
const ease = t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
function checkSettle(dt) {
  pt += dt;
  if (phase === 'shake') {
    const k = Math.min(1, pt / 1.1);
    cup.position.set(Math.sin(pt * 26) * .4 * (1 - k * .3), 2.3 + Math.abs(Math.sin(pt * 13)) * .35, .4 + Math.cos(pt * 19) * .2);
    cup.rotation.set(Math.cos(pt * 19) * .12, 0, Math.sin(pt * 26) * .2);
    rattleT -= dt; if (rattleT <= 0) { rattleT = .045 + Math.random() * .06; click(3 + Math.random() * 7, true); }
    if (pt > 1.1) { phase = 'slam'; pt = 0; }
  } else if (phase === 'slam') {
    const k = Math.min(1, pt / .26), e = k * k;
    cup.position.set(slot.x * e, 2.3 - 2.3 * e, .4 + (slot.z - .4) * e); cup.rotation.set(0, 0, 0);
    if (k >= 1) {
      thump();
      const d = dice[next], b = d.body;
      world.addBody(b); b.wakeUp(); d.mesh.visible = true;
      b.position.set(slot.x + (Math.random() - .5) * .3, 1.05, slot.z + (Math.random() - .5) * .3);
      b.quaternion.setFromEuler(Math.random() * 6.3, Math.random() * 6.3, Math.random() * 6.3);
      b.velocity.set((Math.random() - .5) * 4, -2, (Math.random() - .5) * 4);
      b.angularVelocity.set((Math.random() - .5) * 26, (Math.random() - .5) * 26, (Math.random() - .5) * 26);
      ringAt(slot.x, slot.z, true);
      phase = 'covered'; pt = 0; canLift = false; still = 0; rollLabel();
    }
  } else if (phase === 'covered' && !canLift) {
    const d = dice[next], b = d.body;
    const calm = b.velocity.length() < .08 && b.angularVelocity.length() < .12;
    still = calm ? still + dt : 0;
    if (still > .3 || pt > 5) {
      if (topFace(d).dot < .94 && pt < 5) { b.wakeUp(); b.velocity.set(0, 3, 0); b.angularVelocity.set(Math.random() * 8, 0, Math.random() * 8); still = 0; }
      else { canLift = true; rollLabel(); }
    }
  } else if (phase === 'lift') {
    const k = Math.min(1, pt / .7), e = ease(k);
    cup.position.set(slot.x + e * 1.6, e * 5, slot.z - e * .8); cup.rotation.set(-e * .35, 0, -e * .6);
    if (k >= 1) { cup.visible = false; phase = 'idle'; rollLabel(); }
  }
}
function thump() {
  if (!actx) return;
  const len = .25, buf = actx.createBuffer(1, actx.sampleRate * len, actx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 4);
  const src = actx.createBufferSource(); src.buffer = buf;
  const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260;
  const g = actx.createGain(); g.gain.value = 1.4;
  src.connect(f).connect(g).connect(actx.destination); src.start();
}
function showLabels() {
  dice.forEach(d => {
    if (d.value === null || d.tag) return;
    const s = document.createElement('span');
    const v = d.value, f = d.f;
    const name = f.names[v];
    s.innerHTML = `${f.k}<b>${name}</b>` + (f.k === '팔레트' ? PALS[v].c.slice(0, 4).map(c => `<i style="background:${c}"></i>`).join('') : '');
    $('#labels').append(s); d.tag = s;
  });
}
const tmpV = new THREE.Vector3();
function placeLabels() {
  dice.forEach(d => {
    if (!d.tag) return;
    tmpV.set(d.mesh.position.x, d.mesh.position.y + SIZE * .75, d.mesh.position.z).project(camera);
    d.tag.style.left = `${(tmpV.x * .5 + .5) * table.clientWidth}px`;
    d.tag.style.top = `${(-tmpV.y * .5 + .5) * table.clientHeight}px`;
  });
}

let drag = null;
table.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; drag = { x: e.clientX, y: e.clientY }; });
addEventListener('pointerup', e => {
  if (!drag) return;
  drag = null;
  if (phase === 'covered') lift(); else throwDice(null, true);
});
$('#roll').onclick = () => phase === 'covered' ? lift() : throwDice(null, true);
addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); phase === 'covered' ? lift() : throwDice(null, true); } });

function resize() {
  const w = table.clientWidth, h = table.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  HX = Math.max(2.9, Math.min(6.5, 3.7 * camera.aspect)); HZ = Math.max(3.7, Math.min(5, HX / camera.aspect));
  const dist = Math.max(HZ * 4, HX * 3.4 / camera.aspect + 3);
  camera.position.set(0, dist * .92, dist * .5); camera.lookAt(0, 0, .35);
  camera.updateProjectionMatrix(); placeWalls();
}
addEventListener('resize', resize);
let last = performance.now();
function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  world.step(1 / 120, dt, 6);
  dice.forEach(d => { d.mesh.position.copy(d.body.position); d.mesh.quaternion.copy(d.body.quaternion); });
  checkSettle(dt);
  placeLabels();
  posterTick(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}


const pc = $('#poster'), px = pc.getContext('2d');
const pad = n => String(n).padStart(4, '0');
let anim = null, wall = [], shown = -1;
function stamp() { const d = new Date(); return `2026.11.24 ${[d.getHours(), d.getMinutes(), d.getSeconds()].map(v => String(v).padStart(2, '0')).join(':')}`; }
function values(stage) {
  const v = { shape: 0, pal: null, motif: null, grid: 2, merge: 0, sym: 0, rep: 0, bg: 0, noise: null };
  dice.slice(0, stage).forEach(d => { if (d.value !== null) v[d.f.key] = d.value; });
  return v;
}
function lines(v, n, time) {
  const nm = k => { const f = FACES.find(f => f.key === k); return v[k] === null || v[k] === undefined ? '—' : f.names[v[k]]; };
  return {
    l1: `${nm('shape')} · ${nm('pal')} · ${nm('motif')} · ${nm('grid')} · ${nm('merge')}`,
    l2: `${nm('sym')} · ${nm('rep')} · ${nm('bg')} · ${nm('noise')} · ${n} tiles`,
    l3: `${time} · COINCIDENCE / DICE POSTER`,
  };
}
function preview(stage) {
  const v = values(stage), B = bgOf(roundSeed, v), parts = compose(roundSeed, v);
  drawBg(px, B);
  drawText(px, B, { no: rollNo + 1, ...lines(v, '—', `남은 주사위 ${FACES.length - stage}개`) });
  px.globalAlpha = stage >= 3 ? .62 : 1;
  parts.forEach(p => { if (p.F.shadow) drawShadow(px, p, B); p.F.blocks.forEach(b => drawBlock(px, p, b)); });
  px.globalAlpha = 1;
  const got = dice.slice(0, stage).map(d => d.f.names[d.value]).join(' · ');
  $('#meta').innerHTML = `<span class="k">No.${pad(rollNo + 1)}</span> · ${got}<br><span class="k">남은 주사위 · ${FACES.slice(stage).map(f => f.k).join(' · ')}</span>`;
}
function make() {
  rollNo++;
  const v = values(FACES.length), B = bgOf(roundSeed, v), parts = compose(roundSeed, v);
  R = rngOf(roundSeed + 1);
  const main = parts[0].F.blocks.filter(b => !b.stray && !b.drip && b.w === 1 && b.h === 1);
  String(rollNo).split('').slice(-2).forEach(dg => { const t = pick(main); if (t) Object.assign(t, { m: 'digit', a: B.dark ? '#f1f0ec' : '#111', b: pick(PALS[v.pal].c), k: dg }); });
  const items = [];
  parts.forEach((p, pi) => p.F.blocks.forEach(b => items.push({ p, b, at: b.stray ? 1.6 + R() * .4 : b.drip ? 1.5 + b.drip * .06 : (1 - (b.y + b.h) / p.F.rows) * 1.3 + R() * .3 + pi * .05 })));
  items.sort((a, b) => a.at - b.at);
  const n = parts.reduce((s, p) => s + p.F.n, 0), time = stamp();
  drawBg(px, B);
  drawText(px, B, { no: rollNo, ...lines(v, n, time) });
  parts.forEach(p => { if (p.F.shadow) drawShadow(px, p, B); });
  anim = { items, t: 0, i: 0, info: { no: rollNo, v, n, time } };
  $('#meta').innerHTML = `<span class="k">No.${pad(rollNo)}</span> · 칸이 찍히는 중…`;
}
function metaOf(info) {
  const got = FACES.map(f => f.names[info.v[f.key]]).join(' · ');
  return `<span class="k">No.${pad(info.no)}</span> · ${got}<br><span class="k">${info.n}칸 · ${info.time}</span>`;
}
function posterTick(dt) {
  if (!anim) return;
  anim.t += dt;
  while (anim.i < anim.items.length && anim.items[anim.i].at <= anim.t) { const it = anim.items[anim.i++]; drawBlock(px, it.p, it.b); }
  if (anim.i >= anim.items.length) {
    const info = anim.info; anim = null;
    $('#meta').innerHTML = metaOf(info);
    const snap = document.createElement('canvas'); snap.width = PW; snap.height = PH; snap.getContext('2d').drawImage(pc, 0, 0);
    wall.unshift({ snap, info, meta: metaOf(info) }); wall = wall.slice(0, 12); shown = 0;
    renderWall(); rollLabel();
  }
}
function renderWall() {
  const el = $('#wall'); el.innerHTML = '';
  wall.forEach((w, i) => {
    const c = document.createElement('canvas'); c.width = 180; c.height = 240; c.getContext('2d').drawImage(w.snap, 0, 0, 180, 240);
    c.classList.toggle('on', i === shown); c.title = `No.${pad(w.info.no)}`;
    c.onclick = () => { if (anim) return; shown = i; px.drawImage(w.snap, 0, 0); $('#meta').innerHTML = w.meta; renderWall(); };
    el.append(c);
  });
}
$('#save').onclick = () => {
  const w = wall[shown]; if (!w) return;
  w.snap.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `우연-No${pad(w.info.no)}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
};

document.fonts.ready.then(() => {
  dice.forEach(d => d.mesh.material.forEach(m => m.map.userData.redraw()));
  resize(); park(); rollLabel(); requestAnimationFrame(loop);
  px.fillStyle = '#f1f0ec'; px.fillRect(0, 0, PW, PH);
  px.fillStyle = '#9a958b'; px.font = `500 26px 'Noto Sans KR', sans-serif`; px.textAlign = 'center'; px.fillText('주사위 아홉 개를 하나씩 컵에 넣어 흔들어요', PW / 2, PH / 2);
  $('#meta').innerHTML = `<span class="k">컵을 들어 올리기 전까지는 무엇이 나왔는지 몰라요</span>`;
});

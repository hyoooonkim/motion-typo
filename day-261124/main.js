
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

const PW = 900, PH = 1200, AREA = { x: 60, y: 70, w: 780, h: 1060 };
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
  if (B.grid) { c.beginPath(); for (let x = 0; x <= PW; x += 24) { c.moveTo(x + .5, 0); c.lineTo(x + .5, PH); } for (let y = 0; y <= PH; y += 24) { c.moveTo(0, y + .5); c.lineTo(PW, y + .5); } c.stroke(); }
  if (B.lines) { c.beginPath(); for (let y = 0; y <= PH; y += 14) { c.moveTo(0, y + .5); c.lineTo(PW, y + .5); } c.stroke(); }
}
function drawBlock(c, p, b) { tile(c, b.m, p.ox + b.x * p.s, p.oy + b.y * p.s, p.s, b.a, b.b, b.k, b.w, b.h); }
function drawShadow(c, p, B) {
  c.fillStyle = B.dark ? 'rgba(0,0,0,.55)' : '#151515';
  const o = Math.max(2, p.s * .45);
  p.F.blocks.forEach(b => { if (!b.stray) c.fillRect(p.ox + b.x * p.s + o, p.oy + b.y * p.s + o, b.w * p.s, b.h * p.s); });
}

const RINGS = [
  { k: '형태', key: 'shape', names: SHAPES.map(s => s.k) },
  { k: '팔레트', key: 'pal', names: PALS.map(p => p.k) },
  { k: '무늬', key: 'motif', names: MOTIFS.map(m => m.k) },
  { k: '격자', key: 'grid', names: GRIDS.map(g => `${g}칸`) },
  { k: '병합', key: 'merge', names: MERGES },
  { k: '대칭', key: 'sym', names: SYMS },
  { k: '배경', key: 'bg', names: BGS },
  { k: '흐트러짐', key: 'noise', names: NOISES },
].map(r => {
  const cells = [];
  for (let rep = 0; rep < 4; rep++) { const o = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - .5); if (cells.length && o[0] === cells[cells.length - 1]) o.push(o.shift()); cells.push(...o); }
  return { ...r, cells, a: Math.random() * Math.PI * 2, w: 0, fr: 1, value: null, snap: null };
});
const N = 24, SPAN = Math.PI * 2 / N, TAU = Math.PI * 2;

const wc = $('#wheel'), wx = wc.getContext('2d');
let W = 0, H = 0, DPR = 1, C = { x: 0, y: 0 }, RAD = 300, R0 = 60, RW = 20, WIN = -Math.PI / 2, HW = .2, drive = 0;
const COVER = '#5b41d8', RIM = '#f3c63a', CELL = '#f7f1dc', CELL2 = '#efe6c8';
const mobile = () => W < 760;
function layout() {
  DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  wc.width = W * DPR; wc.height = H * DPR;
  if (mobile()) {
    RAD = Math.min(W * .82, H * .4); C = { x: W / 2, y: H + RAD * .04 }; WIN = -Math.PI / 2; HW = .22;
  } else {
    RAD = Math.min(W * .34, H * .56); C = { x: W + RAD * .03, y: H / 2 }; WIN = Math.PI; HW = .2;
  }
  R0 = RAD * .3; RW = (RAD * .9 - R0) / RINGS.length;
  const pc = $('#poster');
  let ph = mobile() ? Math.min(H * .58, (W - 40) * 4 / 3) : Math.min(H * .78, W * .34 * 4 / 3);
  const top = mobile() ? 44 : (H - ph) / 2, left = mobile() ? (W - ph * .75) / 2 : Math.max(290, (W - RAD * .55 - ph * .75) / 2);
  Object.assign(pc.style, { height: `${ph}px`, width: `${ph * .75}px`, left: `${left}px`, top: `${Math.max(40, top)}px` });
}
const ringR = i => [RAD * .9 - (i + 1) * RW, RAD * .9 - i * RW];
const under = r => { const t = ((WIN - r.a) % TAU + TAU) % TAU; return Math.floor(t / SPAN) % N; };

function sector(c, r0, r1, a0, a1, keep) { if (!keep) c.beginPath(); c.moveTo(C.x + Math.cos(a0) * r1, C.y + Math.sin(a0) * r1); c.arc(C.x, C.y, r1, a0, a1); c.arc(C.x, C.y, r0, a1, a0, true); c.closePath(); }
function fitSize(c, txt, size, maxW, weight) {
  c.font = `${weight} ${size}px 'Noto Sans KR', sans-serif`;
  const w = c.measureText(txt).width;
  return w > maxW ? size * maxW / w : size;
}
function radialText(c, txt, r, ang, size, color, weight = 500, font = "'Noto Sans KR', sans-serif", maxW = Infinity) {
  if (maxW < Infinity) size = fitSize(c, txt, size, maxW, weight);
  c.save(); c.translate(C.x + Math.cos(ang) * r, C.y + Math.sin(ang) * r); c.rotate(ang + Math.PI / 2);
  c.fillStyle = color; c.font = `${weight} ${size}px ${font}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, 0, 0); c.restore();
}
function drawWheel() {
  const c = wx; c.setTransform(DPR, 0, 0, DPR, 0, 0);
  c.clearRect(0, 0, W, H);
  c.fillStyle = '#e7dcc4'; c.beginPath(); c.arc(C.x, C.y, RAD * 1.035, 0, TAU); c.fill();
  c.strokeStyle = '#8b7f68'; c.lineWidth = 1;
  for (let i = 0; i < 180; i++) { const a = drive + i / 180 * TAU, l = i % 5 ? RAD * .012 : RAD * .024; c.beginPath(); c.moveTo(C.x + Math.cos(a) * RAD * 1.033, C.y + Math.sin(a) * RAD * 1.033); c.lineTo(C.x + Math.cos(a) * (RAD * 1.033 - l), C.y + Math.sin(a) * (RAD * 1.033 - l)); c.stroke(); }
  c.save(); sector(c, R0, RAD * .9, WIN - HW, WIN + HW); c.clip();
  RINGS.forEach((rg, i) => {
    const [r0, r1] = ringR(i);
    for (let k = 0; k < N; k++) {
      const a0 = rg.a + k * SPAN, a1 = a0 + SPAN, mid = a0 + SPAN / 2;
      const dd = Math.abs(((mid - WIN) % TAU + TAU * 1.5) % TAU - Math.PI);
      if (dd > HW + SPAN) continue;
      sector(c, r0 + .5, r1 - .5, a0, a1); c.fillStyle = k % 2 ? CELL : CELL2; c.fill();
      c.strokeStyle = 'rgba(40,30,20,.25)'; c.lineWidth = 1; c.stroke();
      const al = Math.max(0, Math.min(1, 1 - (dd - SPAN * .3) / (SPAN * .35)));
      if (al > 0) { c.globalAlpha = al; radialText(c, rg.names[rg.cells[k]], (r0 + r1) / 2, mid, Math.min(15, RW * .42), '#231f1a', 600, undefined, SPAN * (r0 + r1) / 2 * .8); c.globalAlpha = 1; }
    }
  });
  c.restore();
  c.save();
  c.beginPath(); c.arc(C.x, C.y, RAD, 0, TAU); c.closePath(); sector(c, R0, RAD * .9, WIN - HW, WIN + HW, true);
  c.fillStyle = COVER; c.fill('evenodd');
  c.restore();
  c.strokeStyle = RIM; c.lineWidth = RAD * .055; c.beginPath(); c.arc(C.x, C.y, RAD * .955, 0, TAU); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.2; sector(c, R0, RAD * .9, WIN - HW, WIN + HW); c.stroke();
  RINGS.forEach((rg, i) => {
    const [r0, r1] = ringR(i), m = (r0 + r1) / 2;
    const ls = Math.min(13, RW * .34); c.font = `700 ${ls}px 'Noto Sans KR', sans-serif`;
    radialText(c, rg.k, m, WIN - HW - (c.measureText(rg.k).width / 2 + 10) / m, ls, 'rgba(255,255,255,.9)', 700);
    if (i < RINGS.length - 1) { c.strokeStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.arc(C.x, C.y, r0, WIN - HW - Math.min(.5, 90 / r0), WIN - HW - .01); c.stroke(); }
    if (rg.value === null && !rg.spinning) {
      sector(c, r0 + 1.5, r1 - 1.5, WIN - HW + .004, WIN + HW - .004); c.fillStyle = i === active ? '#7458ee' : '#4c34bd'; c.fill();
      radialText(c, i === active ? '돌려요' : '?', m, WIN, Math.min(14, RW * .4), i === active ? RIM : 'rgba(255,255,255,.55)', 700, undefined, HW * 2 * m * .8);
    }
    if (i === active) { c.strokeStyle = RIM; c.lineWidth = 2; sector(c, r0 + 1, r1 - 1, WIN - HW, WIN + HW); c.stroke(); }
  });
  const g = c.createRadialGradient(C.x - R0 * .1, C.y - R0 * .1, 1, C.x, C.y, R0 * .32);
  g.addColorStop(0, '#fff3c4'); g.addColorStop(.5, '#c9a24a'); g.addColorStop(1, '#6b5220');
  c.fillStyle = g; c.beginPath(); c.arc(C.x, C.y, R0 * .3, 0, TAU); c.fill();
  c.fillStyle = '#2a2117'; c.beginPath(); c.arc(C.x, C.y, R0 * .1, 0, TAU); c.fill();
}

let active = 0, rollNo = 0, roundSeed = Math.floor(Math.random() * 2 ** 31), drag = null, actx = null, lastTick = 0;
function tick(v) {
  if (!actx) return;
  const now = actx.currentTime; if (now - lastTick < .018) return; lastTick = now;
  const o = actx.createOscillator(), g = actx.createGain(), f = actx.createBiquadFilter();
  o.type = 'square'; o.frequency.value = 1700 + Math.random() * 500; f.type = 'highpass'; f.frequency.value = 900;
  g.gain.setValueAtTime(Math.min(.22, .05 + v * .01), now); g.gain.exponentialRampToValueAtTime(.0001, now + .025);
  o.connect(f).connect(g).connect(actx.destination); o.start(now); o.stop(now + .03);
}
function chime() {
  if (!actx) return;
  const now = actx.currentTime;
  [880, 1320].forEach((fr, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = 'triangle'; o.frequency.value = fr; g.gain.setValueAtTime(.0001, now + i * .06); g.gain.exponentialRampToValueAtTime(.12, now + i * .06 + .01); g.gain.exponentialRampToValueAtTime(.0001, now + i * .06 + .5); o.connect(g).connect(actx.destination); o.start(now + i * .06); o.stop(now + i * .06 + .55); });
}
const audio = () => { if (!actx) try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch {} };
function newRound() {
  RINGS.forEach(r => { r.value = null; r.spinning = false; r.snap = null; });
  active = 0; roundSeed = Math.floor(Math.random() * 2 ** 31);
}
function spin(w) {
  if (anim) return;
  if (active >= RINGS.length) newRound();
  const rg = RINGS[active]; if (rg.spinning) return;
  audio();
  rg.w = w; rg.fr = .45 + Math.random() * .45; rg.spinning = true; rg.snap = null;
  label();
}
function label() {
  const b = $('#spin'), rg = RINGS[active];
  if (anim) { b.disabled = true; b.textContent = '찍히는 중…'; return; }
  if (active >= RINGS.length) { b.disabled = false; b.textContent = '새 포스터'; return; }
  b.disabled = !!rg.spinning; b.textContent = rg.spinning ? '도는 중…' : `${rg.k} 돌리기 · ${active + 1}/${RINGS.length}`;
}
function update(dt) {
  const rg = RINGS[active];
  if (!rg || !rg.spinning) return;
  const before = under(rg);
  if (rg.snap === null) {
    rg.a += rg.w * dt; drive += rg.w * dt * .35;
    rg.w -= (rg.w * rg.fr + Math.sign(rg.w) * 1.1) * dt;
    if (Math.abs(rg.w) < .45) { const k = under(rg); let t = WIN - (k + .5) * SPAN; t += Math.round((rg.a - t) / TAU) * TAU; rg.snap = t; }
  } else {
    const d = rg.snap - rg.a; rg.a += d * Math.min(1, dt * 9); drive += d * Math.min(1, dt * 9) * .35;
    if (Math.abs(d) < .0015) {
      rg.a = rg.snap; rg.spinning = false; rg.value = rg.cells[under(rg)];
      chime(); active++;
      if (active >= RINGS.length) make(); else preview(active);
      label();
    }
  }
  if (under(rg) !== before) tick(Math.abs(rg.w));
}
const angOf = e => Math.atan2(e.clientY - C.y, e.clientX - C.x);
wc.addEventListener('pointerdown', e => {
  if (Math.hypot(e.clientX - C.x, e.clientY - C.y) > RAD * 1.04 || anim) return;
  if (active >= RINGS.length) newRound();
  const rg = RINGS[active]; if (rg.spinning) return;
  audio(); wc.setPointerCapture(e.pointerId);
  drag = { a: angOf(e), t: performance.now(), w: 0, moved: 0 };
});
wc.addEventListener('pointermove', e => {
  if (!drag) return;
  const rg = RINGS[active], a = angOf(e), now = performance.now();
  let d = a - drag.a; d = (d + Math.PI * 3) % TAU - Math.PI;
  const before = under(rg);
  rg.a += d; drive += d * .35; drag.moved += Math.abs(d);
  const dt = Math.max(1, now - drag.t) / 1000; drag.w = drag.w * .6 + (d / dt) * .4;
  drag.a = a; drag.t = now;
  if (under(rg) !== before) tick(4);
});
addEventListener('pointerup', () => {
  if (!drag) return;
  const w = drag.w, moved = drag.moved; drag = null;
  const sgn = Math.sign(w) || 1;
  spin(moved < .05 ? 9 + Math.random() * 12 : sgn * Math.min(32, Math.max(5, Math.abs(w)) + Math.random() * 3));
});
$('#spin').onclick = () => spin(9 + Math.random() * 12);
addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); spin(9 + Math.random() * 12); } });

const pc = $('#poster'), px = pc.getContext('2d');
const pad = n => String(n).padStart(4, '0');
let anim = null, wall = [], shown = -1;
function stamp() { const d = new Date(); return `2026.11.24 ${[d.getHours(), d.getMinutes(), d.getSeconds()].map(v => String(v).padStart(2, '0')).join(':')}`; }
function values(stage) {
  const v = { shape: 0, pal: null, motif: null, grid: 2, merge: 0, sym: 0, rep: 0, bg: 0, noise: null };
  RINGS.slice(0, stage).forEach(r => { if (r.value !== null) v[r.key] = r.value; });
  return v;
}
function metaHTML(no, stage, tail) {
  const got = RINGS.slice(0, stage).map(r => `${r.k} <b>${r.names[r.value]}</b>`).join('<br>');
  return `<span class="k">No.${pad(no)}</span><br>${got}${tail ? `<br><span class="k">${tail}</span>` : ''}`;
}
function preview(stage) {
  const v = values(stage), B = bgOf(roundSeed, v), parts = compose(roundSeed, v);
  drawBg(px, B);
  px.globalAlpha = stage >= 3 ? .62 : 1;
  parts.forEach(p => { if (p.F.shadow) drawShadow(px, p, B); p.F.blocks.forEach(b => drawBlock(px, p, b)); });
  px.globalAlpha = 1;
  $('#meta').innerHTML = metaHTML(rollNo + 1, stage, `남은 칸 · ${RINGS.slice(stage).map(r => r.k).join(' · ')}`);
}
function make() {
  rollNo++;
  const v = values(RINGS.length), B = bgOf(roundSeed, v), parts = compose(roundSeed, v);
  R = rngOf(roundSeed + 1);
  const main = parts[0].F.blocks.filter(b => !b.stray && !b.drip && b.w === 1 && b.h === 1);
  String(rollNo).split('').slice(-2).forEach(dg => { const t = pick(main); if (t) Object.assign(t, { m: 'digit', a: B.dark ? '#f1f0ec' : '#111', b: pick(PALS[v.pal].c), k: dg }); });
  const items = [];
  parts.forEach((p, pi) => p.F.blocks.forEach(b => items.push({ p, b, at: b.stray ? 1.6 + R() * .4 : b.drip ? 1.5 + b.drip * .06 : (1 - (b.y + b.h) / p.F.rows) * 1.3 + R() * .3 + pi * .05 })));
  items.sort((a, b) => a.at - b.at);
  const n = parts.reduce((s, p) => s + p.F.n, 0), time = stamp();
  drawBg(px, B);
  parts.forEach(p => { if (p.F.shadow) drawShadow(px, p, B); });
  anim = { items, t: 0, i: 0, info: { no: rollNo, n, time, meta: metaHTML(rollNo, RINGS.length, `${n}칸 · ${time}`) } };
  $('#meta').innerHTML = metaHTML(rollNo, RINGS.length, '칸이 찍히는 중…');
}
function posterTick(dt) {
  if (!anim) return;
  anim.t += dt;
  while (anim.i < anim.items.length && anim.items[anim.i].at <= anim.t) { const it = anim.items[anim.i++]; drawBlock(px, it.p, it.b); }
  if (anim.i >= anim.items.length) {
    const info = anim.info; anim = null;
    $('#meta').innerHTML = info.meta;
    const snap = document.createElement('canvas'); snap.width = PW; snap.height = PH; snap.getContext('2d').drawImage(pc, 0, 0);
    wall.unshift({ snap, info }); wall = wall.slice(0, 12); shown = 0;
    renderWall(); label();
  }
}
function renderWall() {
  const el = $('#wall'); el.innerHTML = '';
  wall.forEach((w, i) => {
    const c = document.createElement('canvas'); c.width = 108; c.height = 144; c.getContext('2d').drawImage(w.snap, 0, 0, 108, 144);
    c.classList.toggle('on', i === shown); c.title = `No.${pad(w.info.no)}`;
    c.onclick = () => { if (anim) return; shown = i; px.drawImage(w.snap, 0, 0); $('#meta').innerHTML = w.info.meta; renderWall(); };
    el.append(c);
  });
}
$('#save').onclick = () => {
  const w = wall[shown]; if (!w) return;
  w.snap.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `우연-No${pad(w.info.no)}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
};

let last = performance.now();
function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  update(dt); posterTick(dt); drawWheel();
  requestAnimationFrame(loop);
}
addEventListener('resize', layout);
document.fonts.ready.then(() => {
  layout(); label();
  px.fillStyle = '#f1f0ec'; px.fillRect(0, 0, PW, PH);
  $('#meta').innerHTML = `<span class="k">창으로는 한 칸만 보여요.<br>돌리기 전까지는 무엇이 나올지 몰라요.</span>`;
  requestAnimationFrame(loop);
});

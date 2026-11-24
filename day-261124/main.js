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

function tile(c, m, x, y, s, a, b, k, w = 1) {
  const W = s * w, cx = x + W / 2, cy = y + s / 2;
  c.fillStyle = a; c.fillRect(x, y, W + .5, s + .5);
  c.fillStyle = b;
  switch (m) {
    case 'tri': c.beginPath(); c.moveTo(cx, y + s * .1); c.lineTo(x + s * .95, y + s * .96); c.lineTo(x + s * .05, y + s * .96); c.fill(); break;
    case 'half': c.beginPath(); c.arc(cx, y + s * .55, s * .48, Math.PI, 0); c.fill(); c.fillStyle = k; c.beginPath(); c.arc(cx, y + s, s * .48, Math.PI, 0); c.fill(); break;
    case 'sq': c.fillRect(x + s * .06, y + s * .06, s * .88, s * .88); c.strokeStyle = '#111'; c.lineWidth = Math.max(1, s * .07); c.strokeRect(x + s * .06, y + s * .06, s * .88, s * .88); break;
    case 'eye':
      c.fillStyle = '#e8261c'; ell(c, cx, cy, s * .48, s * .34);
      c.fillStyle = '#fff'; ell(c, cx, cy, s * .36, s * .22);
      c.fillStyle = b; ell(c, cx, cy, s * .18, s * .18);
      c.fillStyle = '#111'; ell(c, cx, cy + s * .02, s * .08, s * .1); break;
    case 'ring': { const n = 2 + Math.floor((x * 7 + y * 13) % 3); for (let i = n; i > 0; i--) { c.fillStyle = i % 2 ? b : (i === 1 ? k : a); c.beginPath(); c.arc(cx, cy, s * .47 * i / n, 0, 7); c.fill(); } c.fillStyle = k; c.beginPath(); c.arc(cx, cy, s * .09, 0, 7); c.fill(); break; }
    case 'glow': { const g = c.createRadialGradient(cx, cy, 0, cx, cy, s * .55); g.addColorStop(0, k); g.addColorStop(.45, b); g.addColorStop(1, a); c.fillStyle = g; c.fillRect(x, y, s, s); break; }
    case 'vstripe': { const n = 3; for (let i = 0; i < n; i++) { c.fillStyle = [a, b, k][(i + Math.floor(x / s)) % 3]; c.fillRect(x + s * i / n, y, s / n + .5, s); } break; }
    case 'check': { const n = 2; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if ((i + j) % 2) c.fillRect(x + s * i / n, y + s * j / n, s / n + .5, s / n + .5); break; }
    case 'dots': c.fillStyle = k; c.beginPath(); c.arc(cx, cy, s * .3, 0, 7); c.fill(); break;
    case 'grid': c.fillStyle = b; c.fillRect(x, y, s, s); c.strokeStyle = '#111'; c.lineWidth = Math.max(1, s * .06); c.strokeRect(x + .5, y + .5, s - 1, s - 1); c.beginPath(); c.moveTo(x, cy); c.lineTo(x + s, cy); c.stroke(); break;
    case 'ellipse': ell(c, cx, cy, W * .48, s * .44); break;
    case 'digit': c.fillStyle = b; c.font = `700 ${s * .9}px 'IBM Plex Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(k, cx, cy + s * .04); break;
  }
}

function plan(seed, si, pi, mi, gi) {
  R = rngOf(seed);
  const cols = GRIDS[gi], rows = Math.round(cols * 1.3);
  const g = silhouette(si, cols, rows);
  const pal = PALS[pi].c, mot = MOTIFS[mi].m;
  const tiles = [];
  let y = 0;
  while (y < rows) {
    const bh = ri(1, Math.max(2, Math.round(rows / 9)));
    const band = () => { const a = pick(pal); let b = pick(pal); while (b === a) b = pick(pal); let k = pick(pal); return { m: pick(mot), a, b, k }; };
    const main = band(), side = band(), split = R() < .35 ? ri(Math.floor(cols * .25), Math.floor(cols * .42)) : -1;
    for (let yy = y; yy < Math.min(rows, y + bh); yy++) {
      let x = 0;
      while (x < cols) {
        if (!g[yy][x]) { x++; continue; }
        let st = split >= 0 && (x < split || x >= cols - split) ? side : main;
        if (R() < .14) st = band();
        let w = 1;
        if (st.m === 'ellipse') { w = ri(1, 4); while (w > 1 && !g[yy].slice(x, x + w).every(Boolean)) w--; }
        tiles.push({ x, y: yy, w, ...st });
        x += w;
      }
    }
    y += bh;
  }
  const filled = tiles.length;
  for (let i = 0; i < Math.round(filled * .025); i++) {
    const t = pick(tiles), dx = ri(-3, 3), dy = ri(-3, 3), nx = t.x + dx, ny = t.y + dy;
    if (ny >= 0 && ny < rows && nx >= 0 && nx < cols && !g[ny][nx]) tiles.push({ x: nx, y: ny, w: 1, m: 'solid', a: '#111', b: '#111', k: '#111', stray: true });
  }
  return { cols, rows, tiles, g };
}

const DIE_BG = '#f6f3ec';
function face(draw) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'); x.fillStyle = DIE_BG; x.fillRect(0, 0, 256, 256);
  draw(x); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.userData.redraw = () => { x.fillStyle = DIE_BG; x.fillRect(0, 0, 256, 256); draw(x); t.needsUpdate = true; };
  return t;
}
const label = (x, s) => { x.fillStyle = '#5a564e'; x.font = `500 22px 'Noto Sans KR', sans-serif`; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillText(s, 128, 232); };
const FACES = [
  { k: '형태', n: SHAPES.length, draw: (x, i) => {
    R = rngOf(i + 7); const g = silhouette(i, 20, 26), s = 6.2;
    x.fillStyle = '#151515';
    g.forEach((r, yy) => r.forEach((on, xx) => on && x.fillRect(66 + xx * s, 22 + yy * s, s - .6, s - .6)));
    label(x, SHAPES[i].k);
  } },
  { k: '팔레트', n: PALS.length, draw: (x, i) => {
    const c = PALS[i].c;
    [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([a, b], j) => { x.fillStyle = c[j]; x.fillRect(48 + a * 82, 28 + b * 82, 78, 78); });
    label(x, PALS[i].k);
  } },
  { k: '무늬', n: MOTIFS.length, draw: (x, i) => {
    const m = MOTIFS[i].m, c = PALS[0].c;
    [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([a, b], j) => tile(x, m[j % m.length], 48 + a * 80, 28 + b * 80, 80, c[(j + 2) % 6], c[j % 6], c[(j + 4) % 6], m[0] === 'ellipse' && j % 2 === 0 ? 2 : 1));
    if (m[0] === 'ellipse') { x.fillStyle = DIE_BG; x.fillRect(208, 0, 48, 200); }
    label(x, MOTIFS[i].k);
  } },
  { k: '격자', n: GRIDS.length, draw: (x, i) => {
    x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = 1;
    const n = GRIDS[i] / 4; for (let j = 0; j <= n; j++) { const p = 38 + j * 180 / n; x.beginPath(); x.moveTo(p, 22); x.lineTo(p, 202); x.moveTo(38, 22 + j * 180 / n); x.lineTo(218, 22 + j * 180 / n); x.stroke(); }
    x.fillStyle = '#151515'; x.font = `600 92px 'IBM Plex Mono', monospace`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(GRIDS[i], 128, 112);
    label(x, `${GRIDS[i]}칸`);
  } },
];

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
function park() {
  dice.forEach((d, i) => {
    const b = d.body; b.wakeUp();
    b.position.set(-HX + 1 + i * 1.5, SIZE / 2, -HZ + .95);
    b.quaternion.setFromEuler(0, (Math.random() - .5) * .6, 0);
    b.velocity.set(0, 0, 0); b.angularVelocity.set(0, 0, 0); d.value = null;
  });
}
function rollLabel() {
  $('#roll').textContent = next === 0 && rollNo ? '새 포스터 · 형태부터' : `${FACES[next].k} 주사위 던지기 · ${next + 1}/4`;
}
function throwDice(dir, user) {
  if (user && !actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch {} }
  if (next === 0) { park(); roundSeed = Math.floor(Math.random() * 2 ** 31); $('#labels').innerHTML = ''; dice.forEach(d => d.tag = null); }
  rolling = true; still = 0; settleT = 0;
  $('#roll').disabled = true;
  const a = dir ?? { x: .55 + Math.random() * .3, z: -(.5 + Math.random() * .4) };
  const len = Math.hypot(a.x, a.z) || 1, ux = a.x / len, uz = a.z / len;
  const d = dice[next], b = d.body; b.wakeUp();
  b.position.set(-ux * (HX - 1.1), 2.4, -uz * (HZ - 1.1));
  b.quaternion.setFromEuler(Math.random() * 6.3, Math.random() * 6.3, Math.random() * 6.3);
  const sp = 12 + Math.random() * 5;
  b.velocity.set(ux * sp, 2 + Math.random() * 3, uz * sp);
  b.angularVelocity.set((Math.random() - .5) * 30, (Math.random() - .5) * 30, (Math.random() - .5) * 30);
  if (d.tag) { d.tag.remove(); d.tag = null; }
  next++;
}
function topFace(d) {
  let best = -2, idx = 0;
  NORMALS.forEach((n, i) => { const w = d.body.quaternion.vmult(n); if (w.y > best) { best = w.y; idx = i; } });
  return { idx, dot: best };
}
function checkSettle(dt) {
  if (!rolling) return;
  settleT += dt;
  const calm = dice.every(d => d.body.velocity.length() < .08 && d.body.angularVelocity.length() < .12);
  still = calm ? still + dt : 0;
  if (still < .35 && settleT < 7) return;
  const tilted = dice.filter(d => topFace(d).dot < .94);
  if (tilted.length && settleT < 7) { tilted.forEach(d => { d.body.wakeUp(); d.body.velocity.set((Math.random() - .5) * 2, 3, (Math.random() - .5) * 2); d.body.angularVelocity.set(Math.random() * 6, 0, Math.random() * 6); }); still = 0; return; }
  rolling = false;
  dice.slice(0, next).forEach(d => { d.value = d.order[topFace(d).idx]; });
  showLabels();
  if (next === 4) { next = 0; make(); }
  else { preview(next); $('#roll').disabled = false; }
  rollLabel();
}
function showLabels() {
  dice.slice(0, next || 4).forEach(d => {
    if (d.value === null) return;
    const s = d.tag || document.createElement('span');
    const v = d.value, f = d.f;
    const name = f.k === '형태' ? SHAPES[v].k : f.k === '팔레트' ? PALS[v].k : f.k === '무늬' ? MOTIFS[v].k : `${GRIDS[v]}칸`;
    s.innerHTML = `${f.k}<b>${name}</b>` + (f.k === '팔레트' ? PALS[v].c.slice(0, 4).map(c => `<i style="background:${c}"></i>`).join('') : '');
    if (!d.tag) { $('#labels').append(s); d.tag = s; }
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
table.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; drag = { x: e.clientX, y: e.clientY, t: performance.now() }; });
addEventListener('pointerup', e => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag = null;
  if (rolling) return;
  if (Math.hypot(dx, dy) > 30) throwDice({ x: dx, z: dy }, true); else throwDice(null, true);
});
$('#roll').onclick = () => !rolling && throwDice(null, true);
addEventListener('keydown', e => { if (e.code === 'Space' && !rolling) { e.preventDefault(); throwDice(null, true); } });

function resize() {
  const w = table.clientWidth, h = table.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  HX = Math.max(2.4, Math.min(6, 3.3 * camera.aspect)); HZ = 3.2;
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
const PW = 900, PH = 1200, PBG = '#f1f0ec', PINK = '#151515';
const pad = n => String(n).padStart(4, '0');
let anim = null, wall = [], shown = -1;
function stamp() { const d = new Date(); return `2026.11.24 ${[d.getHours(), d.getMinutes(), d.getSeconds()].map(v => String(v).padStart(2, '0')).join(':')}`; }
function frame(info) {
  px.fillStyle = PBG; px.fillRect(0, 0, PW, PH);
  px.fillStyle = PINK; px.textBaseline = 'alphabetic';
  px.font = `900 64px 'Noto Sans KR', sans-serif`; px.textAlign = 'left'; px.fillText('우연', 54, 112);
  px.font = `600 26px 'IBM Plex Mono', monospace`; px.textAlign = 'right'; px.fillText(`No.${pad(info.no)}`, 846, 108);
  px.fillRect(54, 130, 792, 2); px.fillRect(54, 1104, 792, 2);
  px.font = `500 17px 'IBM Plex Mono', 'Noto Sans KR', monospace`; px.textAlign = 'left';
  px.fillText(`형태 ${info.shape} · 팔레트 ${info.pal} · 무늬 ${info.motif} · ${info.cols}×${info.rows}`, 54, 1136);
  px.fillStyle = '#77736b'; px.fillText(`${info.n} tiles · seed ${info.seed.toString(16)} · ${info.time}`, 54, 1162);
  px.textAlign = 'right'; px.fillText('COINCIDENCE / DICE POSTER', 846, 1162);
}
function preview(stage) {
  const v = dice.map(d => d.value);
  const P = plan(roundSeed, v[0], stage >= 2 ? v[1] : 0, stage >= 3 ? v[2] : 0, 2);
  const s = Math.floor(Math.min(792 / P.cols, 940 / P.rows)), ox = Math.round((PW - P.cols * s) / 2), oy = Math.round(150 + (940 - P.rows * s) / 2);
  const info = { no: rollNo + 1, seed: roundSeed, shape: SHAPES[v[0]].k, pal: stage >= 2 ? PALS[v[1]].k : '—', motif: stage >= 3 ? MOTIFS[v[2]].k : '—', cols: '—', rows: '—', n: '—', time: '격자 주사위를 기다리는 중' };
  frame(info);
  px.globalAlpha = stage === 3 ? .5 : 1;
  for (const t of P.tiles) {
    if (t.stray) continue;
    const X = ox + t.x * s, Y = oy + t.y * s;
    if (stage === 1) { px.fillStyle = '#d9d5cc'; px.fillRect(X + 1, Y + 1, s * t.w - 2, s - 2); }
    else if (stage === 2) { px.fillStyle = t.a; px.fillRect(X, Y, s * t.w + .5, s + .5); }
    else tile(px, t.m, X, Y, s, t.a, t.b, t.k, t.w);
  }
  px.globalAlpha = 1;
  const left = FACES.slice(stage).map(f => f.k).join(' · ');
  $('#meta').innerHTML = `<span class="k">No.${pad(rollNo + 1)}</span> · ${info.shape}${stage >= 2 ? ' · ' + info.pal : ''}${stage >= 3 ? ' · ' + info.motif : ''}<br><span class="k">남은 주사위 · ${left}</span>`;
}
function make() {
  rollNo++;
  const v = Object.fromEntries(dice.map(d => [d.f.k, d.value]));
  const seed = roundSeed;
  const P = plan(seed, v['형태'], v['팔레트'], v['무늬'], v['격자']);
  const body = P.tiles.filter(t => !t.stray);
  const digits = String(rollNo).split('');
  for (let i = 0; i < Math.min(2, digits.length + 1); i++) { const t = pick(body); Object.assign(t, { m: 'digit', a: '#111', b: pick(PALS[v['팔레트']].c.filter(c => c !== '#111111')) || '#e8261c', k: digits[i % digits.length], w: 1 }); }
  const s = Math.floor(Math.min(792 / P.cols, 940 / P.rows)), ox = Math.round((PW - P.cols * s) / 2), oy = Math.round(150 + (940 - P.rows * s) / 2);
  P.tiles.forEach(t => { t.at = t.stray ? 1.55 + R() * .3 : (1 - t.y / P.rows) * 1.25 + R() * .3; });
  P.tiles.sort((a, b) => a.at - b.at);
  const info = { no: rollNo, seed, shape: SHAPES[v['형태']].k, pal: PALS[v['팔레트']].k, motif: MOTIFS[v['무늬']].k, cols: P.cols, rows: P.rows, n: body.length, time: stamp() };
  frame(info);
  anim = { P, s, ox, oy, t: 0, i: 0, info };
  $('#meta').innerHTML = `<span class="k">No.${pad(rollNo)}</span> · ${info.shape} · ${info.pal} · ${info.motif} · ${info.cols}칸<br><span class="k">칸이 찍히는 중…</span>`;
}
function posterTick(dt) {
  if (!anim) return;
  anim.t += dt;
  const { P, s, ox, oy } = anim;
  while (anim.i < P.tiles.length && P.tiles[anim.i].at <= anim.t) {
    const t = P.tiles[anim.i++];
    tile(px, t.m, ox + t.x * s, oy + t.y * s, s, t.a, t.b, t.k, t.w);
  }
  if (anim.i >= P.tiles.length) {
    const info = anim.info; anim = null;
    $('#meta').innerHTML = `<span class="k">No.${pad(info.no)}</span> · ${info.shape} · ${info.pal} · ${info.motif} · ${info.cols}칸<br><span class="k">${info.n}칸 · ${info.time}</span>`;
    const snap = document.createElement('canvas'); snap.width = PW; snap.height = PH; snap.getContext('2d').drawImage(pc, 0, 0);
    wall.unshift({ snap, info, meta: $('#meta').innerHTML }); wall = wall.slice(0, 12); shown = 0;
    renderWall();
    $('#roll').disabled = false;
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
  px.fillStyle = PBG; px.fillRect(0, 0, PW, PH);
  resize(); park(); rollLabel(); requestAnimationFrame(loop);
  px.fillStyle = '#9a958b'; px.font = `500 26px 'Noto Sans KR', sans-serif`; px.textAlign = 'center'; px.fillText('주사위를 하나씩 던지면 형태가 생겨요', PW / 2, PH / 2);
  $('#meta').innerHTML = `<span class="k">형태 → 팔레트 → 무늬 → 격자 순서로 던져요</span>`;
});

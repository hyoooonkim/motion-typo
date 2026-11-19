import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { PROFILE } from './bust.js?v=1';

const VER = 16;
const PEOPLE = [
  { k: 'kr', who: '준호 · 서울', mat: 'gold', words: ['승진', '인정', '연봉', '더빨리', '증명'], core: '성공', en: 'SUCCESS' },
  { k: 'wa', who: '코피 · 아크라', mat: 'stone', words: ['이름', '약속', '가문', '부끄럼없이', '지킨다'], core: '명예', en: 'HONOR' },
  { k: 'la', who: '루시아 · 보고타', mat: 'wax', words: ['그리움', '편지', '너', '다시', '안아줘'], core: '사랑', en: 'LOVE' },
  { k: 'no', who: '잉리드 · 오슬로', mat: 'glass', words: ['고요', '숲', '혼자', '멀리', '바람'], core: '자유', en: 'FREEDOM' },
  { k: 'in', who: '라젠드라 · 자이푸르', mat: 'wood', words: ['손주', '밥상', '집', '함께', '돌아와'], core: '가족', en: 'FAMILY' },
];
const MATS = {
  stone: { rough: .95, metal: 0, radius: .34, jag: .09, bump: 4, ink: 'rgba(18,18,18,.8)' },
  gold: { rough: .28, metal: 1, radius: .07, jag: 0, bump: 2, ink: 'rgba(70,40,0,.75)' },
  wood: { rough: .72, metal: 0, radius: .09, jag: 0, bump: 3, ink: 'rgba(60,28,8,.8)' },
  wax: { rough: .5, metal: 0, radius: .24, jag: .02, bump: 2.5, ink: 'rgba(130,20,45,.65)' },
  glass: { rough: .22, metal: 0, radius: .15, jag: 0, bump: 1.5, ink: 'rgba(255,255,255,.85)', glass: true },
};


const cv = document.createElement('canvas'); document.body.prepend(cv);
const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
scene.environmentIntensity = .55;
const camera = new THREE.PerspectiveCamera(28, 1, .1, 50);
const key = new THREE.DirectionalLight(0xfff2e0, 2.2); key.position.set(-3, 4, 5); scene.add(key);
const rim = new THREE.DirectionalLight(0x9fb6ff, 1.2); rim.position.set(4, 1, -3); scene.add(rim);
scene.add(new THREE.AmbientLight(0xffffff, .25));



function crinkle() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) {
    let x = Math.random() * 512, y = Math.random() * 512, a = Math.random() * 6.3;
    g.strokeStyle = Math.random() < .5 ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.18)'; g.lineWidth = .6 + Math.random() * 1.6;
    g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 5; s++) { a += (Math.random() - .5) * .9; x += Math.cos(a) * 40; y += Math.sin(a) * 40; g.lineTo(x, y); }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 3); return t;
}
const CRINKLE = crinkle();

function paperMat(map, opts = {}) {
  const m = new THREE.MeshPhysicalMaterial({
    map, side: THREE.DoubleSide, flatShading: true, roughness: .34, metalness: .05,
    clearcoat: .9, clearcoatRoughness: .22, iridescence: .35, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 520],
    bumpMap: CRINKLE, bumpScale: 1.2, ...opts,
  });
  m.onBeforeCompile = s => {
    s.fragmentShader = s.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      if (!gl_FrontFacing) diffuseColor.rgb = mix(vec3(.9, .88, .84), diffuseColor.rgb, .12);`);
  };
  return m;
}


let ac = null, noiseBuf = null, lastSnd = 0;
function rustle(gain = .5) {
  const now = performance.now(); if (now - lastSnd < 45) return; lastSnd = now;
  if (!ac) { ac = new (window.AudioContext || window.webkitAudioContext)(); noiseBuf = ac.createBuffer(1, ac.sampleRate * .3, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (Math.random() < .3 ? 1 : .35); }
  if (ac.state === 'suspended') ac.resume();
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), t = ac.currentTime;
  s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = 2200 + Math.random() * 2600; f.Q.value = .9;
  g.gain.setValueAtTime(gain * .5, t); g.gain.exponentialRampToValueAtTime(.001, t + .07 + Math.random() * .08);
  s.connect(f); f.connect(g); g.connect(ac.destination); s.start(t, Math.random() * .2, .18);
}

const S = THREE.MathUtils.smoothstep, clamp = THREE.MathUtils.clamp, V = (x, y, z) => new THREE.Vector3(x, y, z);
const HT = 3.6, WD = HT * 672 / 900, C = .43;

const NSEG = [2, 4, 4, 4, 2], MID = 8, NC = 17, TR = [0, .25, .5, .75, 1, 1.25, 1.5];
function netPath(s) {
  const h = s / 2, P = [[0, h], [h, h], [h, -h], [-h, -h], [-h, h], [0, h]], F = [0, 1, 2, 3, 0];
  const pts = [], face = [];
  NSEG.forEach((n, i) => {
    const [x0, z0] = P[i], [x1, z1] = P[i + 1];
    for (let k = 0; k < n; k++) { const a = k / n; pts.push(new THREE.Vector2(x0 + (x1 - x0) * a, z0 + (z1 - z0) * a)); face.push(F[i]); }
  });
  pts.push(new THREE.Vector2(0, h));
  const nrm = pts.map((p, j) => {
    const a = pts[Math.max(0, j - 1)], b = pts[Math.min(NC - 1, j + 1)], t = b.clone().sub(a).normalize();
    return new THREE.Vector2(-t.y, t.x);
  });
  nrm[0].set(0, 1); nrm[NC - 1].set(0, 1);
  return { pts, face, nrm };
}

function buildNet(cube, mat) {
  const s = cube.s, h = s / 2, { pts, face, nrm } = netPath(s), kS = .55;
  const rest = (j, r) => {
    const t = TR[r] * s, p = pts[j], n = nrm[j];
    if (TR[r] <= 1) return V(p.x + n.x * .004, t - h, p.y + n.y * .004);
    const q = t - s, lf = face[Math.min(j, NC - 2)] % 2 ? .006 : .011;
    return V(p.x - n.x * q, h + lf, p.y - n.y * q);
  };
  const uvOf = (v, f) => {
    let ix, iy;
    if (f === 0) { ix = v.x; iy = v.y; }
    else if (f === 1) { ix = h + (h - v.z) * kS; iy = v.y; }
    else if (f === 2) { ix = -v.x; iy = v.y; }
    else if (f === 3) { ix = -h - (h - v.z) * kS; iy = v.y; }
    else { ix = v.x; iy = h + (h - v.z) * kS; }
    return [(cube.ix + ix) / WD + .5, (cube.iy + iy) / HT + .5];
  };
  const pos = [], uv = [], keys = [], side = [];
  for (let r = 0; r < TR.length - 1; r++) for (let j = 0; j < NC - 1; j++) {
    const f = TR[r] >= 1 ? 4 : face[j], q = [[j, r], [j + 1, r], [j + 1, r + 1], [j, r + 1]];
    for (const tri of [[0, 1, 2], [0, 2, 3]]) for (const i of tri) {
      const [a, b] = q[i], v = rest(a, b); pos.push(v.x, v.y, v.z); uv.push(...uvOf(v, f)); keys.push(b * NC + a);
    }
    side.push(j < MID ? 0 : 1, j < MID ? 0 : 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const mesh = new THREE.Mesh(g, mat);
  Object.assign(cube, { mesh, keys, side, pts, nrm, face, p: [0, 0], pd: [0, 0], ph: Math.random() * 6, cur: Array.from({ length: TR.length * NC }, () => V(0, 0, 0)) });
  return mesh;
}

const ang = (a, b) => Math.atan2(a.x * b.y - a.y * b.x, a.x * b.x + a.y * b.y);
function chain(cube, p, s, lift, time, out) {
  const { pts, nrm } = cube, step = s ? 1 : -1, end = s ? NC - 1 : 0;
  const O = k => new THREE.Vector2(pts[k].x + nrm[k].x * lift, pts[k].y + nrm[k].y * lift);
  const fu = k => { const df = s ? NC - 1 - k : k, u = clamp((p * (MID + 3) - df) / 3, 0, 1); return u * u * (3 - 2 * u); };
  let prev = O(MID).sub(O(MID - step)), acc = 0;
  out[MID] = O(MID);
  const sgn = Math.sign(ang(prev, O(MID + step).sub(O(MID)))) || 1;
  for (let k = MID; k !== end; k += step) {
    const e = O(k + step).sub(O(k)), u = fu(k);
    acc += ang(prev, e) * u * .78 + sgn * u * u * e.length() * 1.4 + .02 * Math.sin(time * 1.3 + k + cube.ph) * u;
    prev = e;
    const c = Math.cos(-acc), sn = Math.sin(-acc);
    out[k + step] = new THREE.Vector2(out[k].x + e.x * c - e.y * sn, out[k].y + e.x * sn + e.y * c);
  }
}
function shapeNet(cube, time) {
  const { pd, cur, keys, s } = cube, h = s / 2, f = S(Math.max(pd[0], pd[1]), 0, .22), ring = new Array(NC);
  for (let r = 0; r < TR.length; r++) {
    const t = TR[r], top = t >= 1;
    for (let sd = 0; sd < 2; sd++) {
      const pu = clamp((pd[sd] - .08) / .92, 0, 1), pr = clamp(pu * 1.35 - .35 * (1 - Math.min(t, 1)), 0, 1);
      chain(cube, top ? clamp(pu * 1.35, 0, 1) : pr, sd, .004, time, ring);
    }
    for (let j = 0; j < NC; j++) {
      const R = ring[j];
      if (!top) { cur[r * NC + j].set(R.x, t * s - h, R.y); continue; }
      const a = ring[Math.max(0, j - 1)], b = ring[Math.min(NC - 1, j + 1)], tx = b.x - a.x, tz = b.y - a.y, L = Math.hypot(tx, tz) || 1;
      const nx = -tz / L, nz = tx / L, q = (t - 1) * s, A = f * Math.PI / 2, lf = (1 - f) * (cube.face[Math.min(j, NC - 2)] % 2 ? .006 : .011);
      cur[r * NC + j].set(R.x - nx * q * Math.cos(A), h + lf + q * Math.sin(A), R.y - nz * q * Math.cos(A));
    }
  }
  const arr = cube.mesh.geometry.attributes.position.array;
  for (let i = 0; i < keys.length; i++) { const v = cur[keys[i]]; arr[i * 3] = v.x; arr[i * 3 + 1] = v.y; arr[i * 3 + 2] = v.z; }
  cube.mesh.geometry.attributes.position.needsUpdate = true; cube.mesh.geometry.computeBoundingSphere();
}

const loader = new THREE.TextureLoader();
const loadImg = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = `${src}?v=${VER}`; });

function atlas(P, base, n) {
  const M = MATS[P.mat], G = 8, cs = 128, c = document.createElement('canvas'), b = document.createElement('canvas');
  c.width = c.height = b.width = b.height = G * cs;
  const g = c.getContext('2d'), gb = b.getContext('2d');
  gb.fillStyle = '#808080'; gb.fillRect(0, 0, b.width, b.height);
  const glyphs = [...(P.core + P.en + P.words.join('') + P.core)].filter(ch => ch.trim());
  for (let i = 0; i < G * G; i++) {
    const x = (i % G) * cs, y = Math.floor(i / G) * cs, sx = Math.random() * (base.width - 256), sy = Math.random() * (base.height - 256);
    g.drawImage(base, sx, sy, 256, 256, x, y, cs, cs);
    if (i === 0 || i > n) continue;
    const ch = glyphs[(i - 1) % glyphs.length], fs = /[가-힣]/.test(ch) ? 82 : 92;
    const font = `900 ${fs}px 'Noto Sans KR'`; g.font = gb.font = font; g.textAlign = gb.textAlign = 'center'; g.textBaseline = gb.textBaseline = 'middle';
    const cx = x + cs / 2, cy = y + cs / 2 + 4;
    g.fillStyle = M.glass ? 'rgba(0,40,40,.25)' : 'rgba(255,255,255,.22)'; g.fillText(ch, cx + 1.5, cy + 2);
    g.fillStyle = M.ink; g.fillText(ch, cx, cy);
    gb.filter = 'blur(1.5px)'; gb.fillStyle = M.glass ? '#bbb' : '#000'; gb.fillText(ch, cx, cy); gb.filter = 'none';
  }
  const t = new THREE.CanvasTexture(c), tb = new THREE.CanvasTexture(b); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = new THREE.MeshPhysicalMaterial({ map: t, bumpMap: tb, bumpScale: M.bump, roughness: M.rough, metalness: M.metal, ...(M.glass ? { transmission: .45, thickness: .4, ior: 1.45 } : {}) });
  return { m, G };
}

let seed = 1;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const noise3 = (x, y, z) => Math.sin(x * 3.1 + y * 1.7) * Math.cos(y * 2.3 - z * 1.9) + .5 * Math.sin(z * 4.7 + x * 2.9);

function buildBlock(cube, P, A, cell) {
  const M = MATS[P.mat], sz = cube.s * .9, g = new RoundedBoxGeometry(sz, sz, sz, 4, sz * M.radius);
  const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv, off = rnd() * 9;
  const sq = M.jag ? V(1 + (rnd() - .5) * .16, .86 + rnd() * .12, .9 + rnd() * .1) : V(1, 1, 1);
  const cu = c => [(c % A.G) / A.G, 1 - (Math.floor(c / A.G) + 1) / A.G];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), nz = nor.getZ(i);
    const [u0, v0] = cu(nz > .55 ? cell : 0), fx = nz > .55 ? x : Math.abs(nor.getX(i)) > .5 ? z : x, fy = Math.abs(nor.getY(i)) > .5 ? z : y;
    uv.setXY(i, u0 + clamp(fx / sz + .5, .02, .98) / A.G, v0 + clamp(fy / sz + .5, .02, .98) / A.G);
    const d = M.jag * sz * noise3(x / sz * 2.2 + off, y / sz * 2.2, z / sz * 2.2 - off);
    pos.setXYZ(i, (x + nor.getX(i) * d) * sq.x, (y + nor.getY(i) * d) * sq.y, (z + nor.getZ(i) * d) * sq.z);
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, A.m); m.rotation.set((rnd() - .5) * .08, (rnd() - .5) * .1, (rnd() - .5) * .08); return m;
}

function buildPerson(P, img, base) {
  const grp = new THREE.Group(), prof = PROFILE[P.k], cubes = [];
  const at = yn => { let r = prof[0]; for (const q of prof) if (q[0] <= yn) r = q; return r; };
  const inside = (x, y) => { const yn = .5 - y / HT; if (yn < prof[0][0] || yn > prof[prof.length - 1][0] + .01) return false; const [, cx, hw] = at(yn); return Math.abs(x / WD + .5 - cx) < hw; };
  const cols = Math.ceil(WD / C / 2) + 1, rows = Math.ceil(HT / C);
  for (let r = 0; r < rows; r++) for (let i = -cols; i < cols; i++) {
    const x = (i + .5) * C, y = HT / 2 - (r + .5) * C;
    let n = 0; for (let a = 0; a < 5; a++) for (let b = 0; b < 5; b++) n += inside(x + (a / 4 - .5) * C * .9, y + (b / 4 - .5) * C * .9);
    if (n / 25 > .42) cubes.push({ ix: x, iy: y, r, i, s: C * (.93 + rnd() * .06) });
  }
  const tex = new THREE.Texture(img); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.needsUpdate = true;
  const pm = paperMat(tex), A = atlas(P, base, cubes.length);
  cubes.forEach((cb, k) => {
    const node = new THREE.Group();
    node.position.set(cb.ix + (rnd() - .5) * .07, cb.iy + (rnd() - .5) * .03, (rnd() - .5) * .3 + (Math.abs(cb.i + .5) < 1 ? .1 : 0));
    node.rotation.set((rnd() - .5) * .08, (rnd() - .5) * .45, (rnd() - .5) * .1);
    node.add(buildNet(cb, pm), buildBlock(cb, P, A, k + 1));
    cb.node = node; grp.add(node);
  });
  const lc = document.createElement('canvas'); lc.width = 512; lc.height = 64; const lg = lc.getContext('2d');
  lg.fillStyle = 'rgba(236,232,225,.75)'; lg.font = `500 30px 'IBM Plex Mono', 'Noto Sans KR'`; lg.textAlign = 'center'; lg.textBaseline = 'middle'; lg.fillText(P.who, 256, 32);
  const lt = new THREE.CanvasTexture(lc); lt.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: lt, transparent: true, depthWrite: false })); label.scale.set(2.4, .3, 1);
  label.position.y = Math.min(...cubes.map(c => c.iy)) - C * .5 - .32; grp.add(label);
  return { P, grp, cubes, pm, ending: 0, yaw0: 0 };
}

const world = new THREE.Group(); scene.add(world);
let people = [], baseDist = 20, yaw = 0, pitch = .06;
const clock = new THREE.Clock();
function layout() {
  const w = innerWidth, h = innerHeight, t = Math.tan(14 * Math.PI / 180), tall = w / h < .9;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  people.forEach((p, i) => tall ? p.grp.position.set(i < 3 ? (i - 1) * 3.05 : (i - 3.5) * 3.05, i < 3 ? 2.15 : -2.3, 0) : p.grp.position.set((i - 2) * 3.0, .1, 0));
  const [hw, hh] = tall ? [4.75, 4.7] : [7.6, 2.3];
  baseDist = Math.max(hh / t, hw / (t * camera.aspect)) + 1.5;
  camera.position.set(0, 0, baseDist); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
}
addEventListener('resize', layout);

function dispose(o) { o.traverse(m => { if (m.geometry) m.geometry.dispose(); if (m.material) { m.material.map?.dispose(); m.material.bumpMap?.dispose(); m.material.dispose(); } }); }
async function build() {
  await Promise.all([document.fonts.load(`900 80px 'Noto Sans KR'`, PEOPLE.map(P => P.core + P.words.join('') + P.en).join('')), document.fonts.load(`500 30px 'IBM Plex Mono'`, 'abc')]);
  const imgs = await Promise.all(PEOPLE.map(P => loadImg(`bust-${P.k}.jpg`))), bases = await Promise.all(PEOPLE.map(P => loadImg(`mat-${P.mat}.jpg`)));
  people.forEach(p => { world.remove(p.grp); dispose(p.grp); });
  seed = 7;
  people = PEOPLE.map((P, i) => buildPerson(P, imgs[i], bases[i]));
  people.forEach(p => world.add(p.grp));
  layout();
}
document.getElementById('again').onclick = build;
document.getElementById('people').remove();
document.getElementById('cap').remove();

const peeled = p => p.cubes.reduce((a, c) => a + c.p[0] + c.p[1], 0) / (p.cubes.length * 2);
function finale(p) {
  p.ending = clock.elapsedTime; p.cubes.forEach(c => c.p[0] = c.p[1] = 1);
  p.pm.transparent = true; p.pm.depthWrite = false; p.pm.needsUpdate = true;
}
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(e) {
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const meshes = people.flatMap(p => p.ending ? [] : p.cubes.map(c => c.mesh)), h = ray.intersectObjects(meshes, false)[0];
  if (!h) return null;
  for (const p of people) { const c = p.cubes.find(c => c.mesh === h.object); if (c) return { p, c, s: c.side[h.faceIndex] }; }
  return null;
}
function rub({ p, c, s }) {
  c.p[s] = Math.min(1, c.p[s] + .1); c.p[1 - s] = Math.min(1, c.p[1 - s] + .03);
  for (const o of p.cubes) if (o !== c) { const d = Math.hypot(o.ix - c.ix, o.iy - c.iy) / C; if (d < 2.3) { o.p[0] = Math.min(1, o.p[0] + .04 / d); o.p[1] = Math.min(1, o.p[1] + .04 / d); } }
  rustle(.3);
  if (!p.ending && peeled(p) > .32) finale(p);
}

let mode = null, lx = 0, ly = 0, idle = 0, lastRub = 0;
cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId); lx = e.clientX; ly = e.clientY; idle = 0;
  const h = pick(e); mode = h ? 'peel' : 'turn'; if (h) rub(h);
});
cv.addEventListener('pointermove', e => {
  if (!mode) return;
  if (mode === 'turn') { yaw += (e.clientX - lx) * .006; pitch = clamp(pitch + (e.clientY - ly) * .004, -.35, .45); }
  else if (performance.now() - lastRub > 28) { lastRub = performance.now(); const h = pick(e); if (h) rub(h); }
  lx = e.clientX; ly = e.clientY;
});
addEventListener('pointerup', () => { mode = null; });

renderer.setAnimationLoop(() => {
  const dt = Math.min(.05, clock.getDelta()), time = clock.elapsedTime, k = 1 - Math.exp(-dt * 3); idle += dt;
  if (!mode && idle > 2) yaw *= .99;
  people.forEach((p, i) => {
    p.grp.rotation.set(pitch, yaw + Math.sin(time * .3 + i * 1.3) * .22, 0);
    const t = p.ending ? time - p.ending : -1, fade = S(t, 1.2, 2.8);
    for (const c of p.cubes) {
      const moving = Math.abs(c.p[0] - c.pd[0]) + Math.abs(c.p[1] - c.pd[1]) > 1e-4;
      c.pd[0] += (c.p[0] - c.pd[0]) * k; c.pd[1] += (c.p[1] - c.pd[1]) * k;
      if ((moving || c.pd[0] + c.pd[1] > .002) && c.mesh.visible) shapeNet(c, time);
      if (p.ending) { c.mesh.position.y = -.3 * fade * fade; c.mesh.visible = fade < 1; }
    }
    if (p.ending) p.pm.opacity = 1 - fade;
  });
  renderer.render(scene, camera);
});

build();

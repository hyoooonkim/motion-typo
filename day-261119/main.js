import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { PROFILE } from './bust.js?v=1';

const VER = 17;
const PEOPLE = [
  { k: 'kr', who: '준호 · 서울', mat: 'gold', words: ['승진', '인정', '연봉', '더빨리', '증명'], core: '성공', en: 'SUCCESS' },
  { k: 'wa', who: '코피 · 아크라', mat: 'stone', words: ['이름', '약속', '가문', '부끄럼없이', '지킨다'], core: '명예', en: 'HONOR' },
  { k: 'la', who: '루시아 · 보고타', mat: 'wax', words: ['그리움', '편지', '너', '다시', '안아줘'], core: '사랑', en: 'LOVE' },
  { k: 'no', who: '잉리드 · 오슬로', mat: 'glass', words: ['고요', '숲', '혼자', '멀리', '바람'], core: '자유', en: 'FREEDOM' },
  { k: 'in', who: '라젠드라 · 자이푸르', mat: 'wood', words: ['손주', '밥상', '집', '함께', '돌아와'], core: '가족', en: 'FAMILY' },
];
const MATS = {
  stone: { rough: .93, metal: 0, radius: .36, jag: .1, tint: .78, seg: 7, nrm: 2.2, ao: .55, inRough: .98 },
  gold: { rough: .2, metal: 1, radius: .05, jag: 0, seg: 4, nrm: 1.4, ao: .4, inRough: .55 },
  wood: { rough: .62, metal: 0, radius: .05, jag: .004, seg: 4, nrm: 1.6, ao: .5, inRough: .8 },
  wax: { rough: .48, metal: 0, radius: .2, jag: .012, seg: 6, nrm: 1.2, ao: .3, inRough: .62, phys: { transmission: .18, thickness: 1.2, attenuationColor: new THREE.Color('#e88a9c'), attenuationDistance: .6, sheen: .4, sheenColor: new THREE.Color('#ffd0d8') } },
  glass: { rough: .16, metal: 0, radius: .12, jag: 0, seg: 5, nrm: .9, ao: -.35, inRough: .85, phys: { transmission: .9, thickness: .9, ior: 1.5, attenuationColor: new THREE.Color('#8fd6cf'), attenuationDistance: 1.4 } },
};


const cv = document.createElement('canvas'); document.body.prepend(cv);
const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
scene.environmentIntensity = .55;
const camera = new THREE.PerspectiveCamera(28, 1, .1, 50);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const key = new THREE.DirectionalLight(0xfff2e0, 2.6); key.position.set(-3, 4.5, 5); scene.add(key);
key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0004; key.shadow.normalBias = .02; key.shadow.radius = 4;
Object.assign(key.shadow.camera, { left: -2.6, right: 2.6, top: 2.6, bottom: -2.6, near: 1, far: 15 });
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
const HT = 3.6, WD = HT * 672 / 900, U = .24;

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

const loadImg = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = `${src}?v=${VER}`; });
let seed = 1;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const noise3 = (x, y, z) => Math.sin(x * 3.1 + y * 1.7) * Math.cos(y * 2.3 - z * 1.9) + .5 * Math.sin(z * 4.7 + x * 2.9) + .12 * Math.sin(x * 7.3 - z * 6.1 + y * 5.3);

const G = 8, CS = 256, AW = G * CS;
function canvas2() { const c = document.createElement('canvas'); c.width = c.height = AW; return [c, c.getContext('2d', { willReadFrequently: true })]; }
function atlas(P, base, glyphs) {
  const M = MATS[P.mat], [cc, g] = canvas2(), [mc, gm] = canvas2(), [sc, gs] = canvas2(), [lc, gl] = canvas2();
  gm.fillStyle = '#000'; gm.fillRect(0, 0, AW, AW);
  for (let i = 0; i < G * G; i++) {
    const x = (i % G) * CS, y = Math.floor(i / G) * CS, sz = 380 + rnd() * 120;
    g.drawImage(base, rnd() * (base.width - sz), rnd() * (base.height - sz), sz, sz, x, y, CS, CS);
    const ch = glyphs[i - 1];
    if (!ch) continue;
    const fs = /[가-힣]/.test(ch) ? 150 : 170, jx = (rnd() - .5) * 6, jy = (rnd() - .5) * 6;
    gm.save(); gm.translate(x + CS / 2 + jx, y + CS / 2 + 8 + jy); gm.rotate((rnd() - .5) * .05);
    gm.font = `900 ${fs}px 'Noto Sans KR'`; gm.textAlign = 'center'; gm.textBaseline = 'middle'; gm.fillStyle = '#fff'; gm.fillText(ch, 0, 0); gm.restore();
  }
  gs.filter = `blur(${P.mat === 'stone' ? 2.2 : 1.6}px)`; gs.drawImage(mc, 0, 0); gl.filter = 'blur(7px)'; gl.drawImage(mc, 0, 0);
  const col = g.getImageData(0, 0, AW, AW), m = gs.getImageData(0, 0, AW, AW).data, ml = gl.getImageData(0, 0, AW, AW).data, cd = col.data;
  const H = new Float32Array(AW * AW);
  for (let i = 0, n = AW * AW; i < n; i++) {
    const lum = (cd[i * 4] * .3 + cd[i * 4 + 1] * .59 + cd[i * 4 + 2] * .11) / 255;
    let mk = m[i * 4] / 255;
    if (P.mat === 'stone' && mk > .05 && mk < .95) mk = clamp(mk + (Math.random() - .5) * .35, 0, 1);
    H[i] = lum * .25 - mk * .9;
  }
  const [nc, gn] = canvas2(), nd = gn.createImageData(AW, AW), [rc, gr] = canvas2(), rd = gr.createImageData(AW, AW);
  for (let y = 0; y < AW; y++) for (let x = 0; x < AW; x++) {
    const i = y * AW + x, l = H[y * AW + Math.max(0, x - 1)], r = H[y * AW + Math.min(AW - 1, x + 1)], u = H[Math.max(0, y - 1) * AW + x], d = H[Math.min(AW - 1, y + 1) * AW + x];
    let nx = (l - r) * M.nrm * 6, ny = (d - u) * M.nrm * 6, nz = 1; const L = Math.hypot(nx, ny, nz); nx /= L; ny /= L; nz /= L;
    nd.data[i * 4] = (nx * .5 + .5) * 255; nd.data[i * 4 + 1] = (ny * .5 + .5) * 255; nd.data[i * 4 + 2] = (nz * .5 + .5) * 255; nd.data[i * 4 + 3] = 255;
    const mk = m[i * 4] / 255, ao = ml[i * 4] / 255 * .6 + mk * .4, lum = (cd[i * 4] + cd[i * 4 + 1] + cd[i * 4 + 2]) / 765;
    const k = (M.ao >= 0 ? 1 - M.ao * ao : 1) * (M.tint || 1), add = M.ao < 0 ? -M.ao * mk * 255 : 0;
    cd[i * 4] = cd[i * 4] * k + add; cd[i * 4 + 1] = cd[i * 4 + 1] * k + add; cd[i * 4 + 2] = cd[i * 4 + 2] * k + add;
    const rv = THREE.MathUtils.lerp(M.rough * (.85 + .3 * lum), M.inRough, mk);
    rd.data[i * 4] = rd.data[i * 4 + 1] = rd.data[i * 4 + 2] = rv * 255; rd.data[i * 4 + 3] = 255;
  }
  g.putImageData(col, 0, 0); gn.putImageData(nd, 0, 0); gr.putImageData(rd, 0, 0);
  const T = (c, srgb) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const mat = new THREE.MeshPhysicalMaterial({ map: T(cc, true), normalMap: T(nc), normalScale: new THREE.Vector2(1, 1), roughnessMap: T(rc), roughness: 1, metalness: M.metal, envMapIntensity: M.metal ? 1.4 : 1, ...(M.phys || {}) });
  return mat;
}

function buildBlock(cube, P, mat, cell) {
  const M = MATS[P.mat], sz = cube.s * .92, g = new RoundedBoxGeometry(sz, sz, sz, M.seg, sz * M.radius);
  const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv, off = rnd() * 9;
  const sq = M.jag > .03 ? V(1 + (rnd() - .5) * .14, .84 + rnd() * .14, .88 + rnd() * .1) : V(1, 1, 1);
  const cu = c => [(c % G) / G, 1 - (Math.floor(c / G) + 1) / G];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), nz = nor.getZ(i), front = nz > .5;
    const [u0, v0] = cu(front ? cell : 0), fx = front ? x : Math.abs(nor.getX(i)) > .5 ? z : x, fy = Math.abs(nor.getY(i)) > .5 ? z : y;
    uv.setXY(i, u0 + clamp(fx / sz + .5, .015, .985) / G, v0 + clamp(fy / sz + .5, .015, .985) / G);
    const fq = M.jag > .03 ? 1.5 : 2.4, d = M.jag * sz * noise3(x / sz * fq + off, y / sz * fq, z / sz * fq - off) * (front ? .45 : 1);
    pos.setXYZ(i, (x + nor.getX(i) * d) * sq.x, (y + nor.getY(i) * d) * sq.y, (z + nor.getZ(i) * d) * sq.z);
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true;
  m.rotation.set((rnd() - .5) * .06, (rnd() - .5) * .08, (rnd() - .5) * .06); return m;
}

function packCubes(prof) {
  const at = yn => { let r = prof[0]; for (const q of prof) if (q[0] <= yn) r = q; return r; };
  const inside = (x, y) => { const yn = .5 - y / HT; if (yn < prof[0][0] || yn > prof[prof.length - 1][0] + .01) return 0; const [, cx, hw] = at(yn); return Math.abs(x / WD + .5 - cx) < hw ? 1 : 0; };
  const NX = Math.ceil(WD / U), NY = Math.ceil(HT / U), x0 = -NX * U / 2, y0 = HT / 2;
  const cov = [], used = [];
  for (let r = 0; r < NY; r++) { cov.push([]); used.push([]); for (let c = 0; c < NX; c++) { let n = 0; for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) n += inside(x0 + (c + (a + .5) / 4) * U, y0 - (r + (b + .5) / 4) * U); cov[r].push(n / 16); used[r].push(false); } }
  const fits = (r, c, n) => {
    if (r + n > NY || c + n > NX) return false; let s = 0;
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) { if (used[r + a][c + b] || cov[r + a][c + b] < .15) return false; s += cov[r + a][c + b]; }
    return s / (n * n) > .62;
  };
  const cubes = [];
  for (let r = 0; r < NY; r++) for (let c = 0; c < NX; c++) {
    if (used[r][c] || cov[r][c] < .5) continue;
    const q = rnd(), want = q < .12 ? 4 : q < .42 ? 3 : q < .8 ? 2 : 1;
    let n = want; while (n > 1 && !fits(r, c, n)) n--;
    if (!fits(r, c, n)) continue;
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) used[r + a][c + b] = true;
    cubes.push({ ix: x0 + (c + n / 2) * U, iy: y0 - (r + n / 2) * U, n, s: n * U * (.95 + rnd() * .04) });
  }
  return cubes;
}

function buildPerson(P, img, base) {
  const grp = new THREE.Group(), cubes = packCubes(PROFILE[P.k]);
  cubes.sort((a, b) => b.iy + b.n * U / 2 - (a.iy + a.n * U / 2) || a.ix - b.ix);
  const glyphs = [...(P.core + P.en + P.words.join('') + P.core + P.en)].filter(ch => ch.trim());
  const tex = new THREE.Texture(img); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.needsUpdate = true;
  const pm = paperMat(tex), bm = atlas(P, base, glyphs.slice(0, Math.min(cubes.length, G * G - 1)));
  cubes.forEach((cb, k) => {
    const node = new THREE.Group();
    node.position.set(cb.ix + (rnd() - .5) * .03, cb.iy + (rnd() - .5) * .02, -cb.s / 2 + (rnd() - .5) * .14 + (cb.n === 1 ? .05 : 0));
    node.rotation.set((rnd() - .5) * .05, (rnd() - .5) * .22, (rnd() - .5) * .06);
    const net = buildNet(cb, pm); net.castShadow = net.receiveShadow = true;
    node.add(net, buildBlock(cb, P, bm, k < G * G - 1 ? k + 1 : 0));
    cb.node = node; grp.add(node);
  });
  return { P, grp, cubes, pm, ending: 0 };
}

const world = new THREE.Group(); scene.add(world);
let person = null, cur = 0, baseDist = 10, yaw = -.25, pitch = .06;
const clock = new THREE.Clock();
function layout() {
  const w = innerWidth, h = innerHeight, t = Math.tan(14 * Math.PI / 180);
  renderer.setSize(w, h, false); camera.aspect = w / h;
  baseDist = Math.max(2.25 / t, 1.75 / (t * camera.aspect));
  camera.position.set(0, 0, baseDist); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
}
addEventListener('resize', layout); layout();

const ui = { people: document.getElementById('people'), who: document.getElementById('who') };
function dispose(o) { o.traverse(m => { if (m.geometry) m.geometry.dispose(); if (m.material) { ['map', 'normalMap', 'roughnessMap'].forEach(k => m.material[k]?.dispose()); m.material.dispose(); } }); }
async function load(i) {
  cur = i; const P = PEOPLE[i];
  [...ui.people.children].forEach((b, j) => b.classList.toggle('on', j === i)); ui.who.textContent = P.who;
  await document.fonts.load(`900 150px 'Noto Sans KR'`, P.core + P.words.join('') + P.en);
  const [img, base] = await Promise.all([loadImg(`bust-${P.k}.jpg`), loadImg(`mat-${P.mat}.jpg`)]);
  if (person) { world.remove(person.grp); dispose(person.grp); }
  seed = 11 + i * 31;
  person = buildPerson(P, img, base); world.add(person.grp);
}
PEOPLE.forEach((P, i) => { const b = document.createElement('button'); b.textContent = P.who.split(' · ')[1]; b.onclick = () => load(i); ui.people.append(b); });
document.getElementById('again').onclick = () => load(cur);

const peeled = p => p.cubes.reduce((a, c) => a + c.p[0] + c.p[1], 0) / (p.cubes.length * 2);
function finale(p) {
  p.ending = clock.elapsedTime; p.cubes.forEach(c => c.p[0] = c.p[1] = 1);
  p.pm.transparent = true; p.pm.depthWrite = false; p.pm.needsUpdate = true;
}
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(e) {
  if (!person || person.ending) return null;
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const h = ray.intersectObjects(person.cubes.map(c => c.mesh), false)[0];
  if (!h) return null;
  const c = person.cubes.find(c => c.mesh === h.object); return { p: person, c, s: c.side[h.faceIndex] };
}
function rub({ p, c, s }) {
  c.p[s] = Math.min(1, c.p[s] + .1); c.p[1 - s] = Math.min(1, c.p[1 - s] + .035);
  for (const o of p.cubes) if (o !== c) { const d = Math.hypot(o.ix - c.ix, o.iy - c.iy) / ((o.s + c.s) * .5); if (d < 1.8) { const a = .035 / Math.max(.6, d); o.p[0] = Math.min(1, o.p[0] + a); o.p[1] = Math.min(1, o.p[1] + a); } }
  rustle(.3);
  if (!p.ending && peeled(p) > .4) finale(p);
}

let mode = null, lx = 0, ly = 0, idle = 0, lastRub = 0;
cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId); lx = e.clientX; ly = e.clientY; idle = 0;
  const h = pick(e); mode = h ? 'peel' : 'turn'; if (h) rub(h);
});
cv.addEventListener('pointermove', e => {
  if (!mode) return;
  if (mode === 'turn') { yaw += (e.clientX - lx) * .007; pitch = clamp(pitch + (e.clientY - ly) * .004, -.35, .45); }
  else if (performance.now() - lastRub > 28) { lastRub = performance.now(); const h = pick(e); if (h) rub(h); }
  lx = e.clientX; ly = e.clientY;
});
addEventListener('pointerup', () => { mode = null; });

renderer.setAnimationLoop(() => {
  const dt = Math.min(.05, clock.getDelta()), time = clock.elapsedTime, k = 1 - Math.exp(-dt * 3); idle += dt;
  if (!mode && idle > 2) yaw += (Math.sin(time * .25) * .35 - .1 - yaw) * .008;
  world.rotation.set(pitch, yaw, 0);
  const p = person;
  if (p) {
    const t = p.ending ? time - p.ending : -1, fade = S(t, 1.2, 2.8);
    for (const c of p.cubes) {
      const moving = Math.abs(c.p[0] - c.pd[0]) + Math.abs(c.p[1] - c.pd[1]) > 1e-4;
      c.pd[0] += (c.p[0] - c.pd[0]) * k; c.pd[1] += (c.p[1] - c.pd[1]) * k;
      if ((moving || c.pd[0] + c.pd[1] > .002) && c.mesh.visible) shapeNet(c, time);
      if (p.ending) { c.mesh.position.y = -.3 * fade * fade; c.mesh.visible = fade < 1; c.mesh.castShadow = fade < .5; }
    }
    if (p.ending) p.pm.opacity = 1 - fade;
  }
  renderer.render(scene, camera);
});

load(0);

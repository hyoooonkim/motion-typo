import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { PROFILE } from './bust.js?v=1';

const VER = 9;
const PEOPLE = [
  { k: 'kr', who: '준호 · 32 · 서울', tint: '#1d2a44', ink: '#d9b765', words: ['승진', '인정', '연봉', '더 빨리', '증명'], core: '성공', en: 'SUCCESS' },
  { k: 'wa', who: '코피 · 64 · 아크라', tint: '#4a1a17', ink: '#e8c28a', words: ['이름', '약속', '가문', '부끄럼 없이', '지킨다'], core: '명예', en: 'HONOR' },
  { k: 'la', who: '루시아 · 26 · 보고타', tint: '#5a1e33', ink: '#f2b8c6', words: ['그리움', '편지', '너', '다시', '안아줘'], core: '사랑', en: 'LOVE' },
  { k: 'no', who: '잉리드 · 43 · 오슬로', tint: '#1c3a3a', ink: '#bfe0d6', words: ['고요', '숲', '혼자', '멀리', '바람'], core: '자유', en: 'FREEDOM' },
  { k: 'in', who: '라젠드라 · 71 · 자이푸르', tint: '#5a3510', ink: '#f4cf7e', words: ['손주', '밥상', '집', '함께', '돌아와'], core: '가족', en: 'FAMILY' },
];

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
const glow = new THREE.PointLight(0xffd9a0, 0, 4, 1.5); scene.add(glow);
const head = new THREE.Group(); scene.add(head);
glow.position.set(0, -.9, .05); head.add(glow);

let baseDist = 8;
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false);
  camera.aspect = w / h; const t = Math.tan(14 * Math.PI / 180); baseDist = Math.max(2.15 / t, 1.55 / (t * camera.aspect)); camera.position.set(0, 0, baseDist); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

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

const HT = 3.6, WD = HT * 672 / 900, SEG = 20;
function buildLayer(prof, inset, map, opts, isFace) {
  const N = prof.length;
  let neck = Infinity, neckI = 0;
  for (let i = Math.floor(N * .2); i < Math.floor(N * .7); i++) if (prof[i][2] < neck) { neck = prof[i][2]; neckI = i; }
  const top = prof[0][0], chin = prof[neckI][0], S = THREE.MathUtils.smoothstep;
  const Y = yv => (HT / 2 - yv * HT) * (inset < 1 ? .955 : 1) - (inset < 1 ? .03 : 0);
  const ring = prof.map(([yv, cx, hw], i) => {
    const w0 = Math.max(.03, hw * WD), f = THREE.MathUtils.lerp(1.12, .42, S(hw, neck * 1.3, neck * 2.6));
    return { y: Y(yv), c: (cx - .5) * WD, w0, w: w0 * inset, d: w0 * f * inset, v: 1 - yv, ht: i < neckI ? (yv - top) / (chin - top) : -1 };
  });
  const vert = (r, j) => {
    const R = ring[r], ph = j / SEG * Math.PI * 2, sn = Math.sin(ph), cs = Math.cos(ph);
    let z = R.d * cs;
    if (R.ht > 0) z += .17 * inset * Math.exp(-(((R.ht - .6) / .1) ** 2)) * Math.max(0, cs) ** 30;
    const p = new THREE.Vector3(R.c + R.w * sn, R.y, z);
    let u = .5 + (R.c + R.w0 * sn) / WD, v = R.v;
    if (isFace && R.ht >= 0) { const k = S(-cs, .05, .6); u = THREE.MathUtils.lerp(u, .5 + ring[0].c / WD, k); v = THREE.MathUtils.lerp(v, ring[0].v - .025, k); }
    return [p, u, v, [r, j]];
  };
  const raw = [];
  const tri = (A, B, C, hint, m) => raw.push([A, B, C, hint, m]);
  for (let r = 0; r < N - 1; r++) for (let j = 0; j < SEG; j++) {
    const a = vert(r, j), b = vert(r, j + 1), c = vert(r + 1, j + 1), d = vert(r + 1, j), ph = (j + .5) / SEG * Math.PI * 2, h = new THREE.Vector3(Math.sin(ph), 0, Math.cos(ph));
    const m = { kind: 'side', r, j }; if ((r + j) % 2) { tri(a, d, b, h, m); tri(b, d, c, h, m); } else { tri(a, d, c, h, m); tri(a, c, b, h, m); }
  }
  const T0 = ring[0], TN = ring[N - 1];
  const pole = [new THREE.Vector3(T0.c, T0.y + .03, 0), .5 + T0.c / WD, Math.min(.995, T0.v + .01), 'P'];
  const base = [new THREE.Vector3(TN.c, TN.y, 0), .5 + TN.c / WD, TN.v, 'B'];
  for (let j = 0; j < SEG; j++) { tri(pole, vert(0, j), vert(0, j + 1), new THREE.Vector3(0, 1, 0), { kind: 'pole', r: 0, j }); tri(base, vert(N - 1, j + 1), vert(N - 1, j), new THREE.Vector3(0, -1, 0), { kind: 'cap', r: N - 2, j }); }
  const n = raw.length * 3, pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), hints = [], keys = [];
  raw.forEach(([A, B, C, h], t) => {
    const nr = B[0].clone().sub(A[0]).cross(C[0].clone().sub(A[0]));
    if (nr.dot(h) < 0) [B, C] = [C, B];
    [A, B, C].forEach((q, j) => { pos.set([q[0].x, q[0].y, q[0].z], (t * 3 + j) * 3); uv.set([q[1], q[2]], (t * 3 + j) * 2); });
    hints.push(h); keys.push([A[3], B[3], C[3]]);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const mesh = new THREE.Mesh(g, paperMat(map, opts)), scale = inset;
  const S2 = SEG / 2;
  const orig = ring.map((_, r) => Array.from({ length: SEG + 1 }, (_, j) => vert(r, j)[0]));
  const tris = raw.map(([, , , , m], t) => ({ idx: t, ...m, side: m.j >= S2 ? 0 : 1, keys: keys[t], u: 0 }));
  const cur = orig.map(row => row.map(p => p.clone()));
  const uv2 = orig.map(() => new Float32Array(SEG + 1));
  const P = Array.from({ length: N }, () => [0, 0]), Pd = Array.from({ length: N }, () => [0, 0]);
  return { mesh, tris, pos, P, Pd, N, S2, orig, cur, uv2, pole: pole[0].clone(), base: base[0].clone(), curl: 1.35, curlGoal: 1.35, late: 0, ph: Math.random() * 6 };
}

function wordSheet(P) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 1640; const g = c.getContext('2d');
  g.fillStyle = P.tint; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = P.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
  let y = 30, r = 0;
  while (y < c.height) {
    const w = P.words[r % P.words.length], big = r % 3 === 1, fs = big ? 150 : 62;
    g.font = `${big ? 900 : 700} ${fs}px 'Noto Sans KR'`;
    g.globalAlpha = big ? .95 : .55;
    const line = big ? w : Array(8).fill(w).join('  ·  ');
    g.fillText(line, c.width / 2 + (big ? 0 : (r % 2 ? -60 : 60)), y + fs / 2);
    y += fs * 1.22; r++;
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function coreSprite(P) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 600; const g = c.getContext('2d');
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = 'rgba(255,250,240,.9)'; g.shadowBlur = 40;
  g.fillStyle = P.tint; g.font = `900 330px 'Noto Serif KR'`; g.fillText(P.core, 512, 260);
  g.shadowBlur = 12; g.font = `500 46px 'IBM Plex Mono'`; g.fillStyle = P.tint;
  g.fillText(P.en.split('').join(' '), 512, 500);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, opacity: .25, depthWrite: false }));
  s.scale.set(1.5, .88, 1); s.position.set(0, -.95, .02); return s;
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

let L = [], core = null, cur = null, ending = 0;
const clock = new THREE.Clock();

const ang = (a, b) => Math.atan2(a.x * b.z - a.z * b.x, a.x * b.x + a.z * b.z);
function unroll(layer, r, s, time) {
  const { orig, cur, uv2, Pd, S2 } = layer, O = orig[r], C = cur[r], U = uv2[r], p = Pd[r][s];
  const step = s ? -1 : 1, end = s ? 0 : SEG;
  const fu = k => { const df = s ? k : SEG - k; const u = THREE.MathUtils.clamp(p * (S2 + 1.5) - df, 0, 1); return u * u * (3 - 2 * u); };
  let prev = O[S2].clone().sub(O[S2 - step]), acc = 0;
  C[S2].copy(O[S2]);
  for (let k = S2; k !== end; k += step) {
    const e = O[k + step].clone().sub(O[k]), u = fu(k);
    acc += ang(prev, e) * u * layer.curl * (k === S2 ? .5 : 1) + .015 * Math.sin(time * 1.2 + k * .7 + r * .3 + layer.ph) * u;
    prev = e;
    const c = Math.cos(-acc), sn = Math.sin(-acc);
    C[k + step].set(C[k].x + e.x * c - e.z * sn, O[k + step].y, C[k].z + e.x * sn + e.z * c);
    U[k + step] = fu(k + step);
  }
  U[S2] = 0;
}
function updateSheets(dt, time) {
  const k = 1 - Math.exp(-dt * 2.4);
  for (const layer of L) {
    const { P, Pd, N, cur } = layer;
    if (layer.late && time > layer.late) { P.forEach((p, r) => { if (r < N - 1) p[0] = p[1] = 1; }); layer.curlGoal = 1; layer.late = 0; }
    layer.curl += (layer.curlGoal - layer.curl) * k * .6;
    for (let r = 0; r < N - 1; r++) for (let s = 0; s < 2; s++) {
      const nb = ((P[r - 1] || P[r])[s] + P[r + 1][s]) * .5;
      P[r][s] = Math.max(P[r][s], nb * .985);
      Pd[r][s] += (P[r][s] - Pd[r][s]) * k;
    }
    for (let r = 0; r < N; r++) { unroll(layer, r, 0, time); unroll(layer, r, 1, time); }
    const top = new THREE.Vector3(); cur[0].forEach(p => top.add(p)); top.divideScalar(SEG + 1); top.y = layer.pole.y;
    for (const tr of layer.tris) {
      let um = 0;
      tr.keys.forEach((kk, j) => {
        const q = kk === 'P' ? top : kk === 'B' ? layer.base : cur[kk[0]][kk[1]];
        if (kk !== 'P' && kk !== 'B') um = Math.max(um, layer.uv2[kk[0]][kk[1]]);
        layer.pos.set([q.x, q.y, q.z], tr.idx * 9 + j * 3);
      });
      tr.u = um;
    }
    layer.mesh.geometry.attributes.position.needsUpdate = true;
    layer.mesh.geometry.computeBoundingSphere();
  }
}

const ui = { people: document.getElementById('people'), who: document.getElementById('who'), cap: document.getElementById('cap') };
const loader = new THREE.TextureLoader();

async function load(i) {
  const P = PEOPLE[i]; cur = P; ending = 0;
  [...ui.people.children].forEach((b, j) => b.classList.toggle('on', j === i));
  ui.who.textContent = P.who; ui.cap.classList.remove('end');
  await document.fonts.load(`900 100px 'Noto Serif KR'`, P.core); await document.fonts.load(`700 60px 'Noto Sans KR'`, P.words.join(''));
  const face = await loader.loadAsync(`bust-${P.k}.jpg?v=${VER}`); face.colorSpace = THREE.SRGBColorSpace; face.anisotropy = 8;
  for (const l of L) { head.remove(l.mesh); l.mesh.geometry.dispose(); l.mesh.material.map?.dispose(); l.mesh.material.dispose(); }
  if (core) { head.remove(core); core.material.map.dispose(); core.material.dispose(); }
  L = [buildLayer(PROFILE[P.k], 1, face, {}, true), buildLayer(PROFILE[P.k], .84, wordSheet(P), { iridescence: .55, roughness: .3 }, false)];
  L.forEach(l => head.add(l.mesh));
  core = coreSprite(P); head.add(core); glow.intensity = 0;
}

PEOPLE.forEach((P, i) => {
  const b = document.createElement('button'); b.textContent = P.who.split(' · ')[2]; b.onclick = () => load(i); ui.people.append(b);
});
document.getElementById('again').onclick = () => load(PEOPLE.indexOf(cur));

function finale() {
  ending = clock.elapsedTime; ui.cap.classList.add('end');
  L[0].late = ending + .05; L[1].late = ending + .9;
}

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(e) {
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  for (const h of ray.intersectObjects(L.map(l => l.mesh), false)) {
    const l = L.find(l => l.mesh === h.object), tr = l.tris[h.faceIndex];
    if (tr.kind !== 'cap' && tr.u < .3) return { l, tr };
  }
  return null;
}
function rub(hit) {
  const { P, N } = hit.l, r0 = hit.tr.r, s = hit.tr.side;
  for (let r = Math.max(0, r0 - 5); r <= Math.min(N - 2, r0 + 5); r++) P[r][s] = Math.min(1, P[r][s] + .09 * (1 - Math.abs(r - r0) / 6));
  rustle(.35);
  const L1 = L[1].P, m = L1.reduce((a, p) => a + p[0] + p[1], 0) / (L1.length * 2);
  if (!ending && m > .24) finale();
}

let mode = null, lx = 0, ly = 0, yaw = 0, pitch = 0, idle = 0, lastRub = 0;
cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId); lx = e.clientX; ly = e.clientY; idle = 0;
  const h = pick(e); mode = h ? 'peel' : 'turn'; if (h) rub(h);
});
cv.addEventListener('pointermove', e => {
  if (!mode) return;
  if (mode === 'turn') { yaw += (e.clientX - lx) * .008; pitch = THREE.MathUtils.clamp(pitch + (e.clientY - ly) * .005, -.5, .5); }
  else if (performance.now() - lastRub > 28) { lastRub = performance.now(); const h = pick(e); if (h) rub(h); }
  lx = e.clientX; ly = e.clientY;
});
addEventListener('pointerup', () => { mode = null; });

renderer.setAnimationLoop(() => {
  const dt = clock.getDelta(), time = clock.elapsedTime; idle += dt;
  if (!mode && idle > 1.5) yaw += (Math.sin(time * .35) * .45 - yaw) * .01;
  head.rotation.set(pitch, yaw, 0);
  head.position.y = Math.sin(time * .8) * .03;
  updateSheets(dt, time);
  if (core) {
    const k = ending ? Math.min(1, (time - ending) / 2.2) : 0, z = ending ? THREE.MathUtils.smoothstep(time - ending, .3, 3.5) : 0;
    camera.position.z = baseDist * (1 + .6 * z);
    core.material.opacity = .25 + .75 * k; core.scale.set(1.5 * (1 + .12 * k), .88 * (1 + .12 * k), 1);
    glow.intensity = 1.4 * k * (1 + .08 * Math.sin(time * 2.2));
  }
  renderer.render(scene, camera);
});

load(0);

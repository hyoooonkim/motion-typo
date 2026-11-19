import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { PROFILE } from './bust.js?v=1';

const VER = 10;
const PEOPLE = [
  { k: 'kr', glow: '#3f86ff', who: '준호 · 32 · 서울', words: ['승진', '인정', '연봉', '더 빨리', '증명'], core: '성공', en: 'SUCCESS' },
  { k: 'wa', glow: '#ff5a2a', who: '코피 · 64 · 아크라', words: ['이름', '약속', '가문', '부끄럼 없이', '지킨다'], core: '명예', en: 'HONOR' },
  { k: 'la', glow: '#ff4f9a', who: '루시아 · 26 · 보고타', words: ['그리움', '편지', '너', '다시', '안아줘'], core: '사랑', en: 'LOVE' },
  { k: 'no', glow: '#2fd655', who: '잉리드 · 43 · 오슬로', words: ['고요', '숲', '혼자', '멀리', '바람'], core: '자유', en: 'FREEDOM' },
  { k: 'in', glow: '#ffad1f', who: '라젠드라 · 71 · 자이푸르', words: ['손주', '밥상', '집', '함께', '돌아와'], core: '가족', en: 'FAMILY' },
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

const HT = 3.6, WD = HT * 672 / 900, SEG = 28;
const S = THREE.MathUtils.smoothstep;
function shape(prof, inset) {
  const N = prof.length;
  let neck = Infinity, neckI = 0;
  for (let i = Math.floor(N * .2); i < Math.floor(N * .7); i++) if (prof[i][2] < neck) { neck = prof[i][2]; neckI = i; }
  const top = prof[0][0], chin = prof[neckI][0];
  const Y = yv => (HT / 2 - yv * HT) * (inset < 1 ? .955 : 1) - (inset < 1 ? .03 : 0);
  const ring = prof.map(([yv, cx, hw], i) => {
    const w0 = Math.max(.03, hw * WD), f = THREE.MathUtils.lerp(1.12, .42, S(hw, neck * 1.3, neck * 2.6));
    return { y: Y(yv), c: (cx - .5) * WD, w0, w: w0 * inset, d: w0 * f * inset, v: 1 - yv, ht: i < neckI ? (yv - top) / (chin - top) : -1 };
  });
  const at = (r, ph) => {
    const R = ring[r], sn = Math.sin(ph), cs = Math.cos(ph);
    let z = R.d * cs;
    if (R.ht > 0) z += .17 * inset * Math.exp(-(((R.ht - .6) / .1) ** 2)) * Math.max(0, cs) ** 30;
    return [new THREE.Vector3(R.c + R.w * sn, R.y, z), sn, cs];
  };
  return { N, ring, at };
}

function buildLayer(prof, map) {
  const { N, ring, at } = shape(prof, 1);
  const vert = (r, j) => {
    const R = ring[r], [p, sn, cs] = at(r, j / SEG * Math.PI * 2);
    let u = .5 + (R.c + R.w0 * sn) / WD, v = R.v;
    if (R.ht >= 0) { const k = S(-cs, .05, .6); u = THREE.MathUtils.lerp(u, .5 + ring[0].c / WD, k); v = THREE.MathUtils.lerp(v, ring[0].v - .025, k); }
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
  const mesh = new THREE.Mesh(g, paperMat(map));
  const S2 = SEG / 2;
  const orig = ring.map((_, r) => Array.from({ length: SEG + 1 }, (_, j) => vert(r, j)[0]));
  const tris = raw.map(([, , , , m], t) => ({ idx: t, ...m, side: m.j >= S2 ? 0 : 1, keys: keys[t], u: 0 }));
  const cur = orig.map(row => row.map(p => p.clone()));
  const uv2 = orig.map(() => new Float32Array(SEG + 1));
  const P = Array.from({ length: N }, () => [0, 0]), Pd = Array.from({ length: N }, () => [0, 0]), Ps = Array.from({ length: N }, () => [0, 0]);
  return { mesh, tris, pos, P, Pd, Ps, N, S2, orig, cur, uv2, pole: pole[0].clone(), base: base[0].clone(), curl: .72, curlGoal: .72, roll: .5, rollGoal: .5, late: 0, ph: Math.random() * 6 };
}

const ROWS = 6, RH = .17, TW = 2048 / 160 * RH;
function textTex(lines, serif) {
  const c = document.createElement('canvas'); c.width = 2048; c.height = ROWS * 160; const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#fff'; g.textBaseline = 'middle';
  for (let r = 0; r < ROWS; r++) {
    const big = r % 3 === 1, txt = lines(r);
    g.font = `${serif ? 900 : big ? 900 : 400} ${big ? 118 : 84}px ${serif ? "'Noto Serif KR'" : "'Noto Sans KR'"}`;
    const w = g.measureText(txt).width, n = Math.max(1, Math.round(c.width / w)), sx = c.width / (w * n);
    g.filter = 'blur(1.5px)'; g.save(); g.translate(0, r * 160 + 80); g.scale(sx, 1);
    for (let i = 0; i < n; i++) g.fillText(txt, i * w, 0);
    g.restore();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}

const FIG_VS = `uniform float uGrow; varying vec3 vN, vV; varying vec2 vUv; varying float vY;
void main() { vec4 mv = modelViewMatrix * vec4(position + normal * uGrow, 1.); vN = normalize(normalMatrix * normal); vV = -mv.xyz; vUv = uv; vY = position.y; gl_Position = projectionMatrix * mv; }`;
const FIG_FS = `uniform sampler2D uTex, uCore; uniform vec3 uCol, uDeep, uHi; uniform float uTime, uFlow, uEnd, uBottom, uShell, uAlpha, uReveal;
varying vec3 vN, vV; varying vec2 vUv; varying float vY;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  float ndv = abs(dot(normalize(vN), normalize(vV))), fr = 1. - ndv, grain = hash(gl_FragCoord.xy + fract(uTime * 7.) * 91.) - .5;
  float fade = smoothstep(uBottom, uBottom + 1.1, vY);
  if (uShell > .5) { gl_FragColor = vec4(mix(uCol, uHi, .35) + grain * .08, pow(ndv, 1.7) * uAlpha * uReveal * fade); return; }
  vec3 n = normalize(vN); float lit = .55 + .55 * max(dot(n, normalize(vec3(-.4, .8, .5))), 0.);
  vec3 col = mix(uDeep, uCol, smoothstep(.0, .8, fr) * .8 + .2 * lit) * (.7 + .5 * lit);
  col = mix(col, uHi, smoothstep(.65, 1., fr) * .6);
  float row = floor(vUv.y / ${RH.toFixed(4)}), dir = mod(row, 2.) * 2. - 1., sp = .7 + .6 * fract(sin(row * 37.1) * 917.3);
  vec2 tuv = vec2(vUv.x / ${TW.toFixed(4)} + uFlow * dir * sp, vUv.y / ${(RH * ROWS).toFixed(4)});
  float txt = mix(texture2D(uTex, tuv).r, texture2D(uCore, tuv).r, uEnd) * smoothstep(.12, .55, ndv);
  col = mix(col, uHi * 1.15, txt * (.38 + .3 * uEnd));
  gl_FragColor = vec4(col + grain * .11, (1. - smoothstep(.45, 1., fr)) * fade);
}`;

function buildFigure(prof, P) {
  const { N, ring, at } = shape(prof, .84), FS = 72, W = FS + 1;
  const pos = [], uv = [], idx = [];
  for (let r = 0; r < N; r++) {
    const row = Array.from({ length: W }, (_, c) => at(r, Math.PI + c / FS * Math.PI * 2)[0]);
    const cum = [0]; for (let c = 1; c < W; c++) cum.push(cum[c - 1] + row[c].distanceTo(row[c - 1]));
    row.forEach((p, c) => { pos.push(p.x, p.y, p.z); uv.push(cum[c] - cum[FS] / 2, p.y); });
  }
  for (let r = 0; r < N - 1; r++) for (let c = 0; c < FS; c++) { const a = r * W + c, b = a + 1, d = a + W, e = d + 1; idx.push(a, d, b, b, d, e); }
  const top = N * W; pos.push(ring[0].c, ring[0].y + .02, 0); uv.push(0, ring[0].y);
  for (let c = 0; c < FS; c++) idx.push(top, c, c + 1);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const col = new THREE.Color(P.glow), u = {
    uTex: { value: textTex(r => (r % 3 === 1 ? P.words[r % P.words.length] : P.words.slice(r % 2).join('   ·   ')) + '      ') },
    uCore: { value: textTex(r => `${P.core}   ${P.en}   `, true) },
    uCol: { value: col }, uDeep: { value: col.clone().multiplyScalar(.16) }, uHi: { value: col.clone().lerp(new THREE.Color('#fffbe8'), .55) },
    uTime: { value: 0 }, uFlow: { value: 0 }, uEnd: { value: 0 }, uBottom: { value: ring[N - 1].y }, uShell: { value: 0 }, uGrow: { value: 0 }, uAlpha: { value: 1 }, uReveal: { value: 0 },
  };
  const grp = new THREE.Group();
  const body = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: u, vertexShader: FIG_VS, fragmentShader: FIG_FS, transparent: true }));
  body.renderOrder = 1; grp.add(body);
  [[.04, .45], [.1, .3], [.18, .2], [.3, .12], [.45, .07]].forEach(([grow, a], i) => {
    const su = { ...u, uShell: { value: 1 }, uGrow: { value: grow }, uAlpha: { value: a } };
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: su, vertexShader: FIG_VS, fragmentShader: FIG_FS, transparent: true, depthWrite: false, side: THREE.BackSide }));
    m.renderOrder = 2 + i; grp.add(m);
  });
  return { grp, body, u, flow: 0, boost: 0 };
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

let L = [], fig = null, cur = null, ending = 0;
const clock = new THREE.Clock();

const ang = (a, b) => Math.atan2(a.x * b.z - a.z * b.x, a.x * b.x + a.z * b.z);
function unroll(layer, r, s, time) {
  const { orig, cur, uv2, Ps, S2 } = layer, O = orig[r], C = cur[r], U = uv2[r], p = Ps[r][s];
  const step = s ? -1 : 1, end = s ? 0 : SEG;
  const fu = k => { const df = s ? k : SEG - k; const u = THREE.MathUtils.clamp((p * (S2 + 4) - df) / 4, 0, 1); return u * u * (3 - 2 * u); };
  let prev = O[S2].clone().sub(O[S2 - step]), acc = 0;
  const sgn = Math.sign(ang(prev, O[S2 + step].clone().sub(O[S2]))) || 1;
  C[S2].copy(O[S2]);
  for (let k = S2; k !== end; k += step) {
    const e = O[k + step].clone().sub(O[k]), u = fu(k);
    acc += ang(prev, e) * u * layer.curl * (k === S2 ? .5 : 1) + sgn * u * u * e.length() * layer.roll + .012 * Math.sin(time * 1.2 + k * .7 + r * .3 + layer.ph) * u;
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
    if (layer.late && time > layer.late) { P.forEach((p, r) => { if (r < N - 1) p[0] = p[1] = 1; }); layer.curlGoal = 1; layer.rollGoal = 0; layer.late = 0; }
    layer.curl += (layer.curlGoal - layer.curl) * k * .6; layer.roll += (layer.rollGoal - layer.roll) * k * .6;
    for (let r = 0; r < N - 1; r++) for (let s = 0; s < 2; s++) {
      const nb = ((P[r - 1] || P[r])[s] + P[r + 1][s]) * .5;
      P[r][s] = Math.max(P[r][s], nb * .985);
      Pd[r][s] += (P[r][s] - Pd[r][s]) * k * .7;
    }
    for (let r = 0; r < N; r++) for (let s = 0; s < 2; s++) { let a = 0, w = 0; for (let d = -3; d <= 3; d++) { const q = Pd[r + d]; if (q) { const ww = 4 - Math.abs(d); a += q[s] * ww; w += ww; } } layer.Ps[r][s] = a / w; }
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
  await document.fonts.load(`900 100px 'Noto Serif KR'`, P.core); await document.fonts.load(`900 60px 'Noto Sans KR'`, P.words.join('')); await document.fonts.load(`400 60px 'Noto Sans KR'`, P.words.join(''));
  const face = await loader.loadAsync(`bust-${P.k}.jpg?v=${VER}`); face.colorSpace = THREE.SRGBColorSpace; face.anisotropy = 8;
  for (const l of L) { head.remove(l.mesh); l.mesh.geometry.dispose(); l.mesh.material.map?.dispose(); l.mesh.material.dispose(); }
  if (fig) { head.remove(fig.grp); fig.body.geometry.dispose(); fig.u.uTex.value.dispose(); fig.u.uCore.value.dispose(); fig.grp.children.forEach(m => m.material.dispose()); }
  L = [buildLayer(PROFILE[P.k], face)]; head.add(L[0].mesh);
  fig = buildFigure(PROFILE[P.k], P); head.add(fig.grp);
  glow.color.set(P.glow); glow.intensity = 0;
}

PEOPLE.forEach((P, i) => {
  const b = document.createElement('button'); b.textContent = P.who.split(' · ')[2]; b.onclick = () => load(i); ui.people.append(b);
});
document.getElementById('again').onclick = () => load(PEOPLE.indexOf(cur));

const peeled = () => { const p = L[0].P; return p.reduce((a, q) => a + q[0] + q[1], 0) / (p.length * 2); };
function finale() {
  ending = clock.elapsedTime; ui.cap.classList.add('end');
  L[0].late = ending + .05;
}

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(e) {
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  for (const h of ray.intersectObjects([L[0].mesh, fig.body], false)) {
    if (h.object === fig.body) {
      const q = head.worldToLocal(h.point.clone()), O = L[0].orig;
      let r = 0; O.forEach((row, i) => { if (i < O.length - 1 && Math.abs(row[0].y - q.y) < Math.abs(O[r][0].y - q.y)) r = i; });
      return { stir: true, l: L[0], tr: { r, side: q.x > O[r][L[0].S2].x ? 1 : 0 } };
    }
    const l = L[0], tr = l.tris[h.faceIndex];
    if (tr.kind !== 'cap' && tr.u < .3) return { l, tr };
  }
  return null;
}
function rub(hit) {
  if (hit.stir) fig.boost = Math.min(1.6, fig.boost + .12);
  const { P, N } = hit.l, r0 = hit.tr.r, s = hit.tr.side, amt = hit.stir ? .04 : .09;
  for (let r = Math.max(0, r0 - 5); r <= Math.min(N - 2, r0 + 5); r++) P[r][s] = Math.min(1, P[r][s] + amt * (1 - Math.abs(r - r0) / 6));
  rustle(.35);
  if (!ending && peeled() > .42) finale();
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
  if (fig) {
    const k = ending ? S(time - ending, .4, 2.6) : 0, z = ending ? S(time - ending, .3, 3.5) : 0;
    camera.position.z = baseDist * (1 + .35 * z);
    fig.boost *= Math.exp(-dt * 1.5); fig.flow += dt * (.01 + .06 * fig.boost);
    fig.u.uFlow.value = fig.flow; fig.u.uTime.value = time; fig.u.uEnd.value = k; fig.u.uReveal.value = Math.max(k, S(peeled(), .1, .55));
    glow.intensity = (.6 * peeled() + 1.2 * k) * (1 + .08 * Math.sin(time * 2.2));
  }
  renderer.render(scene, camera);
});

load(0);

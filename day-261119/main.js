import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { PROFILE } from './bust.js?v=1';

const VER = 13;
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

const HT = 3.6, WD = HT * 672 / 900;
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
  return { N, ring, at, neckI };
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
  [[.04, .45], [.1, .3], [.18, .2]].forEach(([grow, a], i) => {
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

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const BW = 1.7, BH = 1.05, BD = 1.45, FIG_S = .5;

function kraftTex(P) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 768; const g = c.getContext('2d');
  g.fillStyle = '#b68a5c'; g.fillRect(0, 0, 1024, 768);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '80,52,28' : '230,200,160'},${.05 + Math.random() * .08})`; g.fillRect(Math.random() * 1024, Math.random() * 768, 1 + Math.random() * 30, 1); }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const stamp = (txt, x, y, sz, rot, col) => {
    g.save(); g.translate(x, y); g.rotate(rot); g.font = `900 ${sz}px 'Noto Sans KR'`; g.globalAlpha = .78; g.fillStyle = col; g.fillText(txt, 0, 0);
    const w = g.measureText(txt).width; g.strokeStyle = col; g.lineWidth = sz * .07; g.strokeRect(-w / 2 - sz * .3, -sz * .75, w + sz * .6, sz * 1.5); g.restore();
  };
  stamp(`${P.words[0]} · 취급주의`, 512, 230, 88, -.04, '#7a1f12');
  stamp(`↑ ${P.words[1]} ↑`, 300, 500, 70, .05, '#2b1d12');
  stamp(P.words[3], 760, 540, 62, -.08, '#7a1f12');
  g.globalAlpha = .6; g.font = `500 28px 'IBM Plex Mono', 'Noto Sans KR'`; g.fillStyle = '#2b1d12';
  g.fillText(`CONTENTS: ${P.en} · HANDLE WITH CARE · THIS SIDE UP`, 512, 690);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function kraftMat(map) {
  const m = new THREE.MeshStandardMaterial({ map, roughness: .92, side: THREE.DoubleSide, bumpMap: CRINKLE, bumpScale: .25 });
  m.onBeforeCompile = s => { s.fragmentShader = s.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
    if (!gl_FrontFacing) diffuseColor.rgb *= .35;`); };
  return m;
}

function buildBody(prof, map) {
  const { N, ring, at, neckI } = shape(prof, 1), FS = 48, W = FS + 1, pos = [], uv = [], idx = [];
  let sh = neckI; while (sh < N - 1 && prof[sh][2] < prof[neckI][2] * 1.5) sh++;
  const r0 = Math.max(0, sh - 3);
  for (let r = r0; r < N; r++) for (let c = 0; c < W; c++) {
    const R = ring[r], [p, sn] = at(r, c / FS * Math.PI * 2); pos.push(p.x, p.y, p.z); uv.push(.5 + (R.c + R.w0 * sn) / WD, R.v);
  }
  for (let r = 0; r < N - r0 - 1; r++) for (let c = 0; c < FS; c++) { const a = r * W + c; idx.push(a, a + W, a + 1, a + 1, a + W, a + W + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return { mesh: new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map, roughness: .78 })), neckY: ring[sh].y, neckC: ring[sh].c };
}

function buildPanel(map, O, A, Dv, Nv, Wa, Lp, o = {}) {
  const GA = 20, GD = 16, ad = [], uv = [], idx = [];
  const [v0, v1] = o.vr || [0, 1];
  for (let i = 0; i <= GD; i++) for (let j = 0; j <= GA; j++) {
    ad.push([(j / GA - .5) * Wa, i / GD * Lp]);
    const v = o.flipV ? 1 - i / GD : i / GD;
    uv.push(o.mirror ? 1 - j / GA : j / GA, v0 + (v1 - v0) * v);
  }
  const flip = A.clone().cross(Dv).dot(Nv) < 0;
  for (let i = 0; i < GD; i++) for (let j = 0; j < GA; j++) {
    const a = i * (GA + 1) + j, b = a + 1, c = a + GA + 1, d = c + 1;
    if (flip) idx.push(a, d, b, a, c, d); else idx.push(a, b, d, a, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ad.length * 3), 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const pn = { mesh: new THREE.Mesh(g, paperMat(map)), ad, O, A, Dv, Nv, Wa, Lp, lift: o.lift || .006, rmax: o.rmax, p: 0, pd: 0, tilt: (Math.random() - .5) * .7, ph: Math.random() * 6 };
  shapePanel(pn, 0); return pn;
}
function shapePanel(pn, time) {
  const { ad, O, A, Dv, Nv, Wa, Lp, pd } = pn, arr = pn.mesh.geometry.attributes.position.array, R = .05 + (pn.rmax || .2) * pd;
  for (let k = 0; k < ad.length; k++) {
    const [a, d] = ad[k], d0 = Lp * (1 - pd * (1.4 + pn.tilt * 2 * a / Wa));
    let x = d, y = pn.lift;
    if (d > d0) {
      const r = R * (1 + .15 * Math.sin(a * 3 + pn.ph + time * .8)), s = d - d0, th = s / r;
      if (th <= Math.PI) { x = d0 + r * Math.sin(th); y += r * (1 - Math.cos(th)); } else { x = d0 - (s - Math.PI * r); y += 2 * r; }
    }
    arr[k * 3] = O.x + A.x * a + Dv.x * x + Nv.x * y;
    arr[k * 3 + 1] = O.y + A.y * a + Dv.y * x + Nv.y * y;
    arr[k * 3 + 2] = O.z + A.z * a + Dv.z * x + Nv.z * y;
  }
  pn.mesh.geometry.attributes.position.needsUpdate = true; pn.mesh.geometry.computeBoundingSphere();
}

const BEAM_FS = `uniform vec3 uCol; uniform float uA; varying vec2 vUv; varying vec3 vN, vV; void main() { float f = pow(abs(dot(normalize(vN), normalize(vV))), 2.); gl_FragColor = vec4(uCol, pow(1. - vUv.y, 2.2) * uA * f); }`;
const BEAM_VS = `varying vec2 vUv; varying vec3 vN, vV; void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalMatrix * normal; vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`;

function buildBox(P, tex) {
  const grp = new THREE.Group(), km = kraftMat(kraftTex(P)), plain = kraftMat(null);
  plain.color.set('#b68a5c');
  const wall = (w, pos, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, BH), km); m.position.copy(pos); m.rotation.y = ry; grp.add(m); };
  wall(BW, V(0, BH / 2, BD / 2), 0); wall(BW, V(0, BH / 2, -BD / 2), Math.PI); wall(BD, V(BW / 2, BH / 2, 0), Math.PI / 2); wall(BD, V(-BW / 2, BH / 2, 0), -Math.PI / 2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(BW, BD), plain); floor.rotation.x = -Math.PI / 2; floor.position.y = .01; grp.add(floor);
  const flaps = [];
  const flap = (hinge, w, d, off, axis, sign, dy, delay) => {
    const piv = new THREE.Group(); piv.position.copy(hinge); grp.add(piv);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, .012, d), plain); m.position.copy(off).setY(dy); piv.add(m);
    flaps.push({ piv, axis, sign, a: 0, delay });
  };
  flap(V(0, BH, BD / 2), BW, BD / 2, V(0, 0, -BD / 4), 'x', 1, -.004, 0);
  flap(V(0, BH, -BD / 2), BW, BD / 2, V(0, 0, BD / 4), 'x', -1, -.004, .15);
  flap(V(BW / 2, BH, 0), BW * .45, BD, V(-BW * .225, 0, 0), 'z', -1, -.018, .45);
  flap(V(-BW / 2, BH, 0), BW * .45, BD, V(BW * .225, 0, 0), 'z', 1, -.018, .6);
  const T = tex, X = V(1, 0, 0), Y = V(0, 1, 0), Z = V(0, 0, 1);
  const panels = [
    buildPanel(T.front, V(0, 0, BD / 2), X, Y, Z, BW + .02, BH + .01),
    buildPanel(T.side, V(BW / 2, 0, 0), Z.clone().negate(), Y, X, BD + .02, BH + .01),
    buildPanel(T.side, V(-BW / 2, 0, 0), Z, Y, X.clone().negate(), BD + .02, BH + .01, { mirror: true }),
    buildPanel(T.top, V(0, 0, -BD / 2), X.clone().negate(), Y, Z.clone().negate(), BW + .02, BH + .01, { vr: [.45, 1] }),
    buildPanel(T.top, V(0, BH, -BD / 2), X, Z, Y, BW + .02, BD + .02, { flipV: true, lift: .012, rmax: .1 }),
  ];
  panels.forEach(pn => grp.add(pn.mesh));
  const beamU = { uCol: { value: new THREE.Color(P.glow) }, uA: { value: 0 } };
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.05, .62, 2.6, 40, 1, true), new THREE.ShaderMaterial({ uniforms: beamU, vertexShader: BEAM_VS, fragmentShader: BEAM_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  beam.position.y = BH + 1.3; beam.renderOrder = 6; grp.add(beam);
  return { grp, flaps, panels, beamU };
}

let world = null, box = null, fig = null, cur = null, ending = 0;
const clock = new THREE.Clock();
const ui = { people: document.getElementById('people'), who: document.getElementById('who'), cap: document.getElementById('cap') };
const loader = new THREE.TextureLoader();
const tex = async url => { const t = await loader.loadAsync(`${url}?v=${VER}`); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

function disposeAll(o) {
  o.traverse(m => { if (!m.isMesh) return; m.geometry.dispose(); const ms = [m.material].flat(); ms.forEach(x => { x.map?.dispose(); Object.values(x.uniforms || {}).forEach(u => u.value?.isTexture && u.value.dispose()); x.dispose(); }); });
}

async function load(i) {
  const P = PEOPLE[i]; cur = P; ending = 0;
  [...ui.people.children].forEach((b, j) => b.classList.toggle('on', j === i));
  ui.who.textContent = P.who; ui.cap.classList.remove('end');
  await Promise.all([document.fonts.load(`900 100px 'Noto Serif KR'`, P.core), document.fonts.load(`900 60px 'Noto Sans KR'`, P.words.join('') + '취급주의↑'), document.fonts.load(`400 60px 'Noto Sans KR'`, P.words.join(''))]);
  const [bust, front, side, top] = await Promise.all([tex(`bust-${P.k}.jpg`), tex(`box-${P.k}-front.jpg`), tex(`box-${P.k}-side.jpg`), tex(`box-${P.k}-top.jpg`)]);
  if (world) { head.remove(world); disposeAll(world); }
  world = new THREE.Group(); head.add(world);
  const body = buildBody(PROFILE[P.k], bust); world.add(body.mesh);
  box = buildBox(P, { front, side, top }); box.grp.position.set(body.neckC, body.neckY - .03, 0); world.add(box.grp);
  fig = buildFigure(PROFILE[P.k], P); fig.grp.scale.setScalar(FIG_S); fig.y0 = BH - .12 - (HT / 2 * .955 - .03) * FIG_S; fig.grp.position.y = fig.y0; fig.grp.visible = false; box.grp.add(fig.grp);
  glow.color.set(P.glow); glow.intensity = 0; glow.position.set(0, BH * .55, 0); box.grp.add(glow);
}

PEOPLE.forEach((P, i) => {
  const b = document.createElement('button'); b.textContent = P.who.split(' · ')[2]; b.onclick = () => load(i); ui.people.append(b);
});
document.getElementById('again').onclick = () => load(PEOPLE.indexOf(cur));

const peeled = () => box.panels.reduce((a, pn, i) => a + (i === 3 ? 0 : pn.p), 0) / (box.panels.length - 1);
function finale() {
  ending = clock.elapsedTime; ui.cap.classList.add('end');
  box.panels.forEach(pn => pn.p = 1);
}

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(e) {
  if (!box) return null;
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const objs = box.panels.map(pn => pn.mesh); if (fig.grp.visible) objs.push(fig.body);
  const h = ray.intersectObjects(objs, false)[0];
  if (!h) return null;
  return h.object === fig.body ? { stir: true } : { pn: box.panels.find(pn => pn.mesh === h.object) };
}
function rub(hit) {
  if (hit.stir) { fig.boost = Math.min(1.6, fig.boost + .12); return; }
  box.panels.forEach(pn => pn.p = Math.min(1, pn.p + (pn === hit.pn ? .035 : .01))); rustle(.35);
  if (!ending && peeled() > .62) finale();
}

let mode = null, lx = 0, ly = 0, yaw = -.35, pitch = .12, idle = 0, lastRub = 0;
cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId); lx = e.clientX; ly = e.clientY; idle = 0;
  const h = pick(e); mode = h ? 'peel' : 'turn'; if (h) rub(h);
});
cv.addEventListener('pointermove', e => {
  if (!mode) return;
  if (mode === 'turn') { yaw += (e.clientX - lx) * .008; pitch = THREE.MathUtils.clamp(pitch + (e.clientY - ly) * .005, -.4, .6); }
  else if (performance.now() - lastRub > 28) { lastRub = performance.now(); const h = pick(e); if (h) rub(h); }
  lx = e.clientX; ly = e.clientY;
});
addEventListener('pointerup', () => { mode = null; });

renderer.setAnimationLoop(() => {
  const dt = Math.min(.05, clock.getDelta()), time = clock.elapsedTime; idle += dt;
  if (!mode && idle > 1.5) yaw += (Math.sin(time * .3) * .5 - .2 - yaw) * .01;
  head.rotation.set(pitch, yaw, 0);
  head.position.y = Math.sin(time * .8) * .02;
  if (box) {
    const k = 1 - Math.exp(-dt * 3);
    for (const pn of box.panels) { pn.pd += (pn.p - pn.pd) * k * (ending ? .7 : 1); if (pn.pd > .001) shapePanel(pn, time); }
    const t = ending ? time - ending : -1, z = S(t, .6, 4.5), e = S(t, 2.2, 4.2);
    for (const f of box.flaps) { f.a += ((ending ? S(t, 1 + f.delay, 2 + f.delay) * 2.05 : 0) - f.a) * k * 1.5; f.piv.rotation[f.axis] = f.sign * f.a; }
    fig.grp.visible = t > 1.4;
    fig.grp.position.y = fig.y0 + 2.1 * S(t, 1.5, 5) + .03 * Math.sin(time * 1.3) * z;
    fig.boost *= Math.exp(-dt * 1.5); fig.flow += dt * (.01 + .06 * fig.boost);
    fig.u.uFlow.value = fig.flow; fig.u.uTime.value = time; fig.u.uEnd.value = e; fig.u.uReveal.value = S(t, 1.6, 3);
    box.beamU.uA.value = .5 * S(t, 1.2, 2.6) * (1 + .1 * Math.sin(time * 2.1));
    glow.intensity = 3 * S(t, .9, 2.4) * (1 + .08 * Math.sin(time * 2.2));
    camera.position.set(0, .9 * z, baseDist * (1 + .3 * z)); camera.lookAt(0, -.1 + 1 * z, 0);
  }
  renderer.render(scene, camera);
});

load(0);

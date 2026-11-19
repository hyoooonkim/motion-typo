import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { PROFILE } from './bust.js?v=1';

const VER = 14;
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


const S = THREE.MathUtils.smoothstep;
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

const HB = { w: 1.7, h: 1.05, d: 1.45 }, BB = { w: 2.5, h: 1.5, d: 1.55 }, BASE = -1.4;

function crop(img, x0, y0, x1, y1, mirror) {
  const c = document.createElement('canvas'); c.width = 768; c.height = Math.round(768 * (y1 - y0) / (x1 - x0) * img.height / img.width) || 512; const g = c.getContext('2d');
  if (mirror) { g.translate(c.width, 0); g.scale(-1, 1); }
  g.drawImage(img, x0 * img.width, y0 * img.height, (x1 - x0) * img.width, (y1 - y0) * img.height, 0, 0, c.width, c.height);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function bodyTex(img, prof) {
  const N = prof.length; let neck = Math.floor(N * .2);
  for (let i = neck; i < Math.floor(N * .7); i++) if (prof[i][2] < prof[neck][2]) neck = i;
  let sh = neck; while (sh < N - 1 && prof[sh][2] < prof[neck][2] * 1.5) sh++;
  const [yb, cx, hb] = prof[N - 1], ys = prof[sh][0];
  return {
    front: crop(img, cx - hb * .9, ys + .03, cx + hb * .9, yb),
    side: crop(img, cx + hb * .55, ys + .1, cx + hb * .92, yb),
    sideL: crop(img, cx - hb * .92, ys + .1, cx - hb * .55, yb, true),
    back: crop(img, cx - hb * .5, ys + .2, cx + hb * .5, yb),
    top: crop(img, cx - hb * .9, ys - .02, cx + hb * .9, ys + .16),
  };
}

function wrap(B, T, o = {}) {
  const { w, h, d } = B, X = V(1, 0, 0), Y = V(0, 1, 0), Z = V(0, 0, 1), n = v => v.clone().negate();
  const ps = [
    buildPanel(T.front, V(0, 0, d / 2), X, Y, Z, w + .02, h + .01),
    buildPanel(T.side, V(w / 2, 0, 0), n(Z), Y, X, d + .02, h + .01),
    buildPanel(T.sideL || T.side, V(-w / 2, 0, 0), Z, Y, n(X), d + .02, h + .01, { mirror: !T.sideL }),
    buildPanel(T.back, V(0, 0, -d / 2), n(X), Y, n(Z), w + .02, h + .01, T.backVr ? { vr: T.backVr } : {}),
    buildPanel(T.top, V(0, h, -d / 2), X, Z, Y, w + .02, d + .02, { flipV: true, lift: .012, rmax: .1 }),
  ];
  ps[3].back = true;
  if (o.fixedTop) ps[4].fixed = true;
  return ps;
}

function lightBox(B, P, texs) {
  const g = new RoundedBoxGeometry(B.w - .06, B.h - .06, B.d - .06, 5, .16), pos = g.attributes.position, uv = g.attributes.uv;
  const per = 2 * (B.w + B.d);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    uv.setXY(i, Math.atan2(x / B.w, z / B.d) / (Math.PI * 2) * per, y);
  }
  g.translate(0, B.h / 2, 0);
  const col = new THREE.Color(P.glow), u = {
    uTex: { value: texs.words }, uCore: { value: texs.core },
    uCol: { value: col }, uDeep: { value: col.clone().multiplyScalar(.16) }, uHi: { value: col.clone().lerp(new THREE.Color('#fffbe8'), .55) },
    uTime: { value: 0 }, uFlow: { value: 0 }, uEnd: { value: 0 }, uBottom: { value: -100 }, uShell: { value: 0 }, uGrow: { value: 0 }, uAlpha: { value: 1 }, uReveal: { value: 0 },
  };
  const grp = new THREE.Group();
  const body = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: u, vertexShader: FIG_VS, fragmentShader: FIG_FS, transparent: true }));
  body.renderOrder = 1; grp.add(body);
  [[.04, .45], [.1, .3], [.2, .18]].forEach(([grow, a], i) => {
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...u, uShell: { value: 1 }, uGrow: { value: grow }, uAlpha: { value: a } }, vertexShader: FIG_VS, fragmentShader: FIG_FS, transparent: true, depthWrite: false, side: THREE.BackSide }));
    m.renderOrder = 2 + i; grp.add(m);
  });
  const lamp = new THREE.PointLight(col, 0, 5, 1.5); lamp.position.y = B.h / 2; grp.add(lamp);
  return { grp, body, u, lamp };
}

function wordSprite(P) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 560; const g = c.getContext('2d');
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = P.glow; g.shadowBlur = 60; g.fillStyle = '#fffaf0';
  g.font = `900 300px 'Noto Serif KR'`; g.fillText(P.core, 512, 240); g.fillText(P.core, 512, 240);
  g.shadowBlur = 24; g.font = `500 52px 'IBM Plex Mono'`; g.fillText(P.en.split('').join(' '), 512, 480);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  s.renderOrder = 8; return s;
}

let world = null, boxes = [], panels = [], word = null, cur = null, ending = 0, flow = 0, boost = 0;
const clock = new THREE.Clock();
const ui = { people: document.getElementById('people'), who: document.getElementById('who'), cap: document.getElementById('cap') };
const loader = new THREE.TextureLoader();
const tex = async url => { const t = await loader.loadAsync(`${url}?v=${VER}`); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

function disposeAll(o) {
  o.traverse(m => { if (!m.isMesh && !m.isSprite) return; m.geometry.dispose(); [m.material].flat().forEach(x => { x.map?.dispose(); x.dispose(); }); });
}

async function load(i) {
  const P = PEOPLE[i]; cur = P; ending = 0;
  [...ui.people.children].forEach((b, j) => b.classList.toggle('on', j === i));
  ui.who.textContent = P.who; ui.cap.classList.remove('end');
  await Promise.all([document.fonts.load(`900 100px 'Noto Serif KR'`, P.core), document.fonts.load(`900 60px 'Noto Sans KR'`, P.words.join('')), document.fonts.load(`400 60px 'Noto Sans KR'`, P.words.join(''))]);
  const [bust, front, side, top] = await Promise.all([tex(`bust-${P.k}.jpg`), tex(`box-${P.k}-front.jpg`), tex(`box-${P.k}-side.jpg`), tex(`box-${P.k}-top.jpg`)]);
  if (world) { head.remove(world); disposeAll(world); }
  world = new THREE.Group(); world.position.y = BASE; head.add(world);
  const texs = {
    words: textTex(r => (r % 3 === 1 ? P.words[r % P.words.length] : P.words.slice(r % 2).join('   ·   ')) + '      '),
    core: textTex(() => `${P.core}   ${P.en}   `, true),
  };
  const body = new THREE.Group(), hd = new THREE.Group();
  hd.position.set(0, BB.h + .012, -.04); hd.rotation.y = .09;
  world.add(body, hd);
  const bp = wrap(BB, bodyTex(bust.image, PROFILE[P.k]), { fixedTop: true }), hp = wrap(HB, { front, side, top, back: top, backVr: [.45, 1] });
  boxes = [{ grp: body, ps: bp, L: lightBox(BB, P, texs) }, { grp: hd, ps: hp, L: lightBox(HB, P, texs) }];
  for (const b of boxes) { b.ps.forEach(pn => { pn.box = b; b.grp.add(pn.mesh); }); b.grp.add(b.L.grp); b.rev = 0; }
  panels = [...bp, ...hp];
  word = wordSprite(P); word.position.set(0, HB.h * .5, 0); hd.add(word);
  flow = 0; boost = 0;
}

PEOPLE.forEach((P, i) => {
  const b = document.createElement('button'); b.textContent = P.who.split(' · ')[2]; b.onclick = () => load(i); ui.people.append(b);
});
document.getElementById('again').onclick = () => load(PEOPLE.indexOf(cur));

const live = () => panels.filter(pn => !pn.fixed && !pn.back);
const peeled = () => { const l = live(); return l.reduce((a, pn) => a + pn.p, 0) / l.length; };
function finale() {
  ending = clock.elapsedTime; ui.cap.classList.add('end');
  panels.forEach(pn => { pn.p = 1; pn.mesh.material.transparent = true; pn.mesh.material.depthWrite = false; pn.mesh.material.needsUpdate = true; });
}

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(e) {
  if (!panels.length) return null;
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const h = ray.intersectObjects([...panels.map(pn => pn.mesh), ...boxes.map(b => b.L.body)], false)[0];
  if (!h) return null;
  const pn = panels.find(q => q.mesh === h.object);
  return pn && !pn.fixed ? { pn } : { stir: true };
}
function rub(hit) {
  if (hit.stir) { boost = Math.min(1.6, boost + .12); return; }
  panels.forEach(pn => { if (!pn.fixed) pn.p = Math.min(1, pn.p + (pn === hit.pn ? .035 : pn.box === hit.pn.box ? .012 : .004)); });
  rustle(.35);
  if (!ending && peeled() > .6) finale();
}

let mode = null, lx = 0, ly = 0, yaw = -.35, pitch = .1, idle = 0, lastRub = 0;
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
  if (word) {
    const k = 1 - Math.exp(-dt * 3), t = ending ? time - ending : -1, z = S(t, .5, 4), e = S(t, 1.2, 3.2), wv = S(t, 1.6, 4.2);
    for (const pn of panels) { pn.pd += (pn.p - pn.pd) * k * (ending ? .7 : 1); if (pn.pd > .001) shapePanel(pn, time); if (ending) { const f = S(t, pn.fixed ? .5 : 1.1, pn.fixed ? 1.8 : 2.8); pn.mesh.material.opacity = 1 - f; pn.mesh.position.y = -.35 * f * f; pn.mesh.visible = f < 1; } }
    boost *= Math.exp(-dt * 1.5); flow += dt * (.01 + .06 * boost);
    for (const b of boxes) {
      const l = b.ps.filter(pn => !pn.fixed), m = l.reduce((a, pn) => a + pn.pd, 0) / l.length, u = b.L.u;
      b.rev = Math.max(S(m, .05, .7), S(t, .3, 2));
      u.uFlow.value = flow; u.uTime.value = time; u.uEnd.value = e; u.uReveal.value = b.rev;
      b.L.lamp.intensity = (1.2 * b.rev + 2 * S(t, .5, 2.5)) * (1 + .08 * Math.sin(time * 2.2 + b.grp.position.y));
    }
    word.material.opacity = wv; word.position.y = HB.h * .5 + 1.35 * S(t, 1.4, 4.6) + .04 * Math.sin(time * 1.4) * wv;
    const sc = 1 + .25 * wv; word.scale.set(1.9 * sc, 1.04 * sc, 1);
    camera.position.set(0, .2 * z, baseDist * (1 + .5 * z)); camera.lookAt(0, -.12 + .4 * z, 0);
  }
  renderer.render(scene, camera);
});

load(0);

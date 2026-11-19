import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const VER = 3;
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
glow.position.set(0, 0, .1); head.add(glow);

function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.position.set(0, .05, w / h < .8 ? 8.2 : 5.3); camera.lookAt(0, -.02, 0); camera.updateProjectionMatrix();
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

function shape(d) {
  let x = d.x * .74, y = d.y, z = d.z * .86;
  if (y < -.3) { const k = Math.min(1, (-y - .3) / .7); x *= 1 - k * .34; z *= 1 - k * .12; }
  if (z > 0) {
    const f = Math.min(1, z / .5);
    z *= .93;
    z += .2 * Math.exp(-(x * x) / .02 - ((y + .22) ** 2) / .05) * f;
    z -= .07 * Math.exp(-((Math.abs(x) - .26) ** 2) / .012 - ((y + .02) ** 2) / .01) * f;
    z += .05 * Math.exp(-(x * x) / .04 - ((y + .86) ** 2) / .02) * f;
  }
  return new THREE.Vector3(x, y, z);
}

function buildLayer(scale, detail, map, opts) {
  const ico = new THREE.IcosahedronGeometry(1, detail).toNonIndexed();
  const P = ico.attributes.position, n = P.count, pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(P, i).normalize();
    const p = shape(v).multiplyScalar(scale);
    pos.set([p.x, p.y, p.z], i * 3);
    const q = p.clone().divideScalar(scale), back = THREE.MathUtils.smoothstep(-q.z, -.1, .45);
    uv.set([.5 + q.x / 1.7, THREE.MathUtils.lerp(.52 + q.y * .465, .965, back)], i * 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const mesh = new THREE.Mesh(g, paperMat(map, opts));
  const T = n / 3, tris = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let t = 0; t < T; t++) {
    a.fromArray(pos, t * 9); b.fromArray(pos, t * 9 + 3); c.fromArray(pos, t * 9 + 6);
    const cen = a.clone().add(b).add(c).divideScalar(3), nrm = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
    if (nrm.dot(cen) < 0) nrm.negate();
    tris.push({ idx: t, cen, nrm, orig: pos.slice(t * 9, t * 9 + 9), t0: -1 });
  }
  return { mesh, tris, pos, scale, peeled: 0 };
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
  s.scale.set(1.3, .76, 1); s.position.set(0, -.05, .12); return s;
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

let L = [], core = null, cur = null, ending = 0, frontL1 = 1;
const clock = new THREE.Clock(), q = new THREE.Quaternion(), tmp = new THREE.Vector3();

function peel(layer, t, from, delay = 0, fall = false) {
  const tr = layer.tris[t]; if (tr.t0 >= 0) return false;
  const o = tr.orig, V = [0, 1, 2].map(i => new THREE.Vector3(o[i * 3], o[i * 3 + 1], o[i * 3 + 2]));
  let fi = 0, bd = Infinity;
  V.forEach((p, i) => { const d = p.distanceTo(from); if (d < bd) { bd = d; fi = i; } });
  const h0 = V[(fi + 1) % 3], h1 = V[(fi + 2) % 3], e = h1.clone().sub(h0).normalize();
  if (e.clone().cross(V[fi].clone().sub(h0)).dot(tr.nrm) < 0) e.negate();
  Object.assign(tr, { fi, h0, e, free: V[fi].clone().sub(h0), ang: 1.9 + Math.random() * .7, ph: Math.random() * 6.3, t0: clock.elapsedTime + delay, fall: fall ? clock.elapsedTime + delay + .55 + Math.random() * .35 : 0, spin: (Math.random() - .5) * 4 });
  layer.peeled++;
  return true;
}

function updateFlaps(time) {
  for (const layer of L) {
    let dirty = false;
    for (const tr of layer.tris) {
      if (tr.t0 < 0) continue;
      const u = Math.min(1, Math.max(0, (time - tr.t0) / .75));
      const k = u - 1, ease = 1 + 2.4 * k * k * k + 1.4 * k * k;
      const a = tr.ang * ease + (u > 0 ? .05 * Math.sin(time * 1.6 + tr.ph) * u : 0);
      q.setFromAxisAngle(tr.e, a); tmp.copy(tr.free).applyQuaternion(q).add(tr.h0);
      if (tr.fall && time > tr.fall) {
        const s = time - tr.fall; if (s > 3) continue;
        const o = tr.orig, c = tr.cen;
        q.setFromAxisAngle(tr.e, tr.spin * s);
        for (let j = 0; j < 3; j++) {
          const p = j === tr.fi ? tmp.clone() : new THREE.Vector3(o[j * 3], o[j * 3 + 1], o[j * 3 + 2]);
          p.sub(c).applyQuaternion(q).add(c).addScaledVector(tr.nrm, 1.1 * s); p.y -= 2.6 * s * s;
          layer.pos.set([p.x, p.y, p.z], tr.idx * 9 + j * 3);
        }
      } else layer.pos.set([tmp.x, tmp.y, tmp.z], tr.idx * 9 + tr.fi * 3);
      dirty = true;
    }
    if (dirty) layer.mesh.geometry.attributes.position.needsUpdate = true;
  }
}

const ui = { people: document.getElementById('people'), who: document.getElementById('who'), cap: document.getElementById('cap') };
const loader = new THREE.TextureLoader();

async function load(i) {
  const P = PEOPLE[i]; cur = P; ending = 0;
  [...ui.people.children].forEach((b, j) => b.classList.toggle('on', j === i));
  ui.who.textContent = P.who; ui.cap.classList.remove('end');
  await document.fonts.load(`900 100px 'Noto Serif KR'`, P.core); await document.fonts.load(`700 60px 'Noto Sans KR'`, P.words.join(''));
  const face = await loader.loadAsync(`face-${P.k}.jpg?v=${VER}`); face.colorSpace = THREE.SRGBColorSpace; face.anisotropy = 8;
  for (const l of L) { head.remove(l.mesh); l.mesh.geometry.dispose(); l.mesh.material.map?.dispose(); l.mesh.material.dispose(); }
  if (core) { head.remove(core); core.material.map.dispose(); core.material.dispose(); }
  L = [buildLayer(1, 2, face), buildLayer(.84, 2, wordSheet(P), { iridescence: .55, roughness: .3 })];
  L.forEach(l => head.add(l.mesh));
  frontL1 = L[1].tris.filter(t => t.cen.z > 0).length;
  core = coreSprite(P); head.add(core); glow.intensity = 0;
}

PEOPLE.forEach((P, i) => {
  const b = document.createElement('button'); b.textContent = P.who.split(' · ')[2]; b.onclick = () => load(i); ui.people.append(b);
});
document.getElementById('again').onclick = () => load(PEOPLE.indexOf(cur));

function finale() {
  ending = clock.elapsedTime; ui.cap.classList.add('end');
  const front = new THREE.Vector3(0, 0, 3);
  for (const l of L) l.tris.forEach((tr, t) => { if (tr.cen.z > -.12 * l.scale && tr.t0 < 0) peel(l, t, front, .15 + Math.hypot(tr.cen.x, tr.cen.y + .1) * .9 + (l === L[1] ? .5 : 0), true); else if (tr.cen.z > -.12 * l.scale && !tr.fall) tr.fall = clock.elapsedTime + Math.random() * .5; });
}

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(e) {
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  for (const h of ray.intersectObjects(L.map(l => l.mesh), false)) {
    const l = L.find(l => l.mesh === h.object);
    if (l.tris[h.faceIndex].t0 < 0) return { l, t: h.faceIndex, p: head.worldToLocal(h.point.clone()) };
  }
  return null;
}
function rub(hit) {
  let n = 0;
  hit.l.tris.forEach((tr, t) => { if (tr.cen.distanceTo(hit.p) < .17 * hit.l.scale && peel(hit.l, t, hit.p, Math.random() * .08)) n++; });
  if (n) rustle(.4 + Math.min(.4, n * .08));
  if (!ending && L[1].tris.filter(t => t.t0 >= 0 && t.cen.z > 0).length / frontL1 > .38) finale();
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
  updateFlaps(time);
  if (core) {
    const k = ending ? Math.min(1, (time - ending) / 2.2) : 0;
    core.material.opacity = .25 + .75 * k; core.scale.set(1.3 * (1 + .12 * k), .76 * (1 + .12 * k), 1);
    glow.intensity = 1.4 * k * (1 + .08 * Math.sin(time * 2.2));
  }
  renderer.render(scene, camera);
});

load(0);

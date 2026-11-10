import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import * as fx from './fx.js';

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k, rnd = (a, b) => a + Math.random() * (b - a);
const CELLS = 6, TIP = new THREE.Vector3(0, 4.45, 0);

fx.setupFx(document.getElementById('fx'));
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#070910');
scene.fog = new THREE.FogExp2('#070910', .016);
const camera = new THREE.PerspectiveCamera(42, 1, .1, 600);
const CAM = new THREE.Vector3(0, 6, 32), LOOK = new THREE.Vector3(0, 4.6, 0);

const hemi = new THREE.HemisphereLight('#34406a', '#040509', .5); scene.add(hemi);
const flashLight = new THREE.PointLight('#c4d0ff', 0, 0, 1); scene.add(flashLight);
const hitLight = new THREE.PointLight('#a8dcff', 0, 40, 1.4); scene.add(hitLight);
const cellLight = new THREE.PointLight('#5fe6ff', 0, 22, 1.4); cellLight.position.set(0, 2, 1.2); scene.add(cellLight);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: '#08090d', roughness: .28, metalness: .55 }));
ground.rotation.x = -Math.PI / 2; scene.add(ground);
const plaza = new THREE.Mesh(new THREE.PlaneGeometry(19, 6), new THREE.MeshStandardMaterial({ color: '#12141b', roughness: .18, metalness: .4 }));
plaza.rotation.x = -Math.PI / 2; plaza.position.y = .01; scene.add(plaza);
const railMat = new THREE.MeshStandardMaterial({ color: '#4a5266', roughness: .25, metalness: 1 });
[-.7, .7].forEach(z => { const r = new THREE.Mesh(new THREE.BoxGeometry(17, .06, .08), railMat); r.position.set(0, .04, z); scene.add(r); });
for (let x = -8; x <= 8; x += 1) { const s = new THREE.Mesh(new THREE.BoxGeometry(.18, .03, 1.8), railMat); s.position.set(x, .02, 0); scene.add(s); }
const RAIL = 6.8;

const blds = [];
for (let gx = -16; gx <= 16; gx++) for (let gz = -22; gz <= 3; gz++) {
  const x = gx * 4.4 + rnd(-.4, .4), z = gz * 4.4 + rnd(-.4, .4), r = Math.hypot(x, z);
  if (r < 9.5 || Math.abs(x) > 64 || (Math.abs(x) < 12 && Math.abs(z) < 5.5)) continue;
  if (z > 0 && Math.abs(x) < 14) continue;
  if (Math.random() < .12) continue;
  const far = clamp(r / 70), h = rnd(2.5, 7) + far * rnd(4, 22) + (Math.random() < .08 ? rnd(8, 16) : 0);
  blds.push({ x, z, w: rnd(2.4, 3.7), d: rnd(2.4, 3.7), h, th: clamp((r - 9) / 70) * .85 + Math.random() * .15 });
}
const bGeo = new THREE.BoxGeometry(1, 1, 1); bGeo.translate(0, .5, 0);
const aLit = new Float32Array(blds.length), aSeed = new Float32Array(blds.length).map(() => Math.random() * 100);
bGeo.setAttribute('aLit', new THREE.InstancedBufferAttribute(aLit, 1));
bGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 1));
const bMat = new THREE.MeshStandardMaterial({ color: '#141722', roughness: .7, metalness: .2 });
bMat.onBeforeCompile = sh => {
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', '#include <common>\nattribute float aLit; attribute float aSeed; varying vec3 vWP; varying vec3 vWN; varying float vLit; varying float vSeed;')
    .replace('#include <project_vertex>', '#include <project_vertex>\nmat4 bIM = modelMatrix * instanceMatrix; vWP = (bIM * vec4(transformed, 1.)).xyz; vWN = normalize(mat3(bIM) * objectNormal); vLit = aLit; vSeed = aSeed;');
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN; varying float vLit; varying float vSeed;\nfloat h3(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }')
    .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      if (abs(vWN.y) < .5 && vWP.y > .7) {
        float u = abs(vWN.x) > .5 ? vWP.z : vWP.x;
        vec2 g = vec2(u / .7, vWP.y / .9), f = fract(g), c = floor(g);
        float win = step(.22, f.x) * step(f.x, .78) * step(.25, f.y) * step(f.y, .78);
        float r = h3(vec3(c, vSeed)), on = step(1. - vLit * .55, r);
        vec3 wc = mix(vec3(1., .72, .38), vec3(.65, .85, 1.), step(.82, h3(vec3(c.yx, vSeed + 3.))));
        totalEmissiveRadiance += wc * win * on * (.55 + .45 * h3(vec3(c, vSeed + 9.)));
        totalEmissiveRadiance += vec3(.02, .025, .04) * win;
      }`);
};
const city = new THREE.InstancedMesh(bGeo, bMat, blds.length);
const m4 = new THREE.Matrix4();
blds.forEach((b, i) => { m4.compose(new THREE.Vector3(b.x, 0, b.z), new THREE.Quaternion(), new THREE.Vector3(b.w, b.h, b.d)); city.setMatrixAt(i, m4); });
scene.add(city);

const tall = blds.map((b, i) => i).sort((a, b) => blds[b].h - blds[a].h).slice(0, 18);
const redMat = new THREE.MeshBasicMaterial({ color: '#ff3b30' });
const reds = new THREE.InstancedMesh(new THREE.SphereGeometry(.12, 8, 6), redMat, tall.length);
tall.forEach((i, k) => { m4.makeTranslation(blds[i].x, blds[i].h + .15, blds[i].z); reds.setMatrixAt(k, m4); });
scene.add(reds);

const metal = new THREE.MeshStandardMaterial({ color: '#2a2f3c', roughness: .3, metalness: .9 });
const battery = new THREE.Group(); scene.add(battery);
const add = (geo, mat, y) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; battery.add(m); return m; };
add(new THREE.CylinderGeometry(1.15, 1.3, .4, 48), metal, .2);
add(new THREE.CylinderGeometry(.58, .58, .18, 48), metal, .49);
add(new THREE.CylinderGeometry(.58, .58, .14, 48), metal, 2.75);
add(new THREE.CylinderGeometry(.22, .26, .22, 32), metal, 2.93);
add(new THREE.CylinderGeometry(.035, .05, 1.4, 12), new THREE.MeshStandardMaterial({ color: '#9aa3b8', roughness: .25, metalness: 1 }), 3.74);
const tipMat = new THREE.MeshStandardMaterial({ color: '#dfe6f5', emissive: '#7f9cff', emissiveIntensity: .4, roughness: .2, metalness: 1 });
add(new THREE.SphereGeometry(.09, 16, 12), tipMat, TIP.y);
add(new THREE.CylinderGeometry(.6, .6, 2.12, 48, 1, true), new THREE.MeshPhysicalMaterial({ color: '#9fb4d8', roughness: .05, metalness: 0, transparent: true, opacity: .18, side: THREE.DoubleSide, depthWrite: false }), 1.62);
const cells = [];
for (let k = 0; k < CELLS; k++) {
  const mat = new THREE.MeshStandardMaterial({ color: '#0b0e16', emissive: '#36d8ff', emissiveIntensity: 0, roughness: .4 });
  const c = add(new THREE.CylinderGeometry(.5, .5, .3, 40), mat, .72 + k * .345);
  cells.push(c);
}

const cloudMats = [];
[[21, 1, 0], [25, 1.6, 7], [30, 2.3, 19]].forEach(([y, sp, off]) => {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uFlash: { value: 0 }, uFP: { value: new THREE.Vector3() }, uWarm: { value: 0 }, uSp: { value: sp }, uOff: { value: off } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uTime, uFlash, uWarm, uSp, uOff; uniform vec3 uFP; varying vec3 vW;
      float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float ns(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(hs(i), hs(i + vec2(1, 0)), f.x), mix(hs(i + vec2(0, 1)), hs(i + vec2(1, 1)), f.x), f.y); }
      float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += a * ns(p); p = p * 2.03 + 17.1; a *= .5; } return s; }
      void main(){
        vec2 p = vW.xz * .04 + vec2(uTime * .012 * uSp + uOff, uTime * .005);
        float f = fbm(p + fbm(p * 1.6 + uTime * .01) * .7);
        float d = smoothstep(.3, .75, f);
        float lit = uFlash * exp(-length(vW - uFP) / 26.);
        vec3 col = mix(vec3(.03, .035, .06), vec3(.08, .09, .14), f);
        col += lit * vec3(.75, .8, 1.) * (.4 + f * 1.2) + uFlash * .05 * vec3(.6, .7, 1.);
        col += uWarm * vec3(1., .6, .25) * .5 * exp(-length(vW.xz) / 30.) * f;
        float fade = 1. - smoothstep(70., 200., length(vW.xz - cameraPosition.xz));
        gl_FragColor = vec4(col, d * fade * .96);
      }`,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), mat); m.rotation.x = Math.PI / 2; m.position.y = y; scene.add(m);
  cloudMats.push(mat);
});

const RN = 5000, rPos = new Float32Array(RN * 6), rEnd = new Float32Array(RN * 2);
for (let i = 0; i < RN; i++) {
  const x = rnd(-35, 35), y = rnd(0, 24), z = rnd(-40, 30);
  rPos.set([x, y, z, x, y, z], i * 6); rEnd[i * 2 + 1] = 1;
}
const rGeo = new THREE.BufferGeometry();
rGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3));
rGeo.setAttribute('aEnd', new THREE.BufferAttribute(rEnd, 1));
const rainMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uTime: { value: 0 }, uFlash: { value: 0 } },
  vertexShader: `attribute float aEnd; uniform float uTime; varying float vA;
    void main(){ vec3 p = position; p.y = mod(p.y - uTime * 24., 24.); p.x = mod(p.x + 35. - uTime * 2.5, 70.) - 35.;
      p.y += aEnd * .55; p.x += aEnd * .06; vA = aEnd; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`,
  fragmentShader: 'uniform float uFlash; varying float vA; void main(){ gl_FragColor = vec4(vec3(.55, .62, .8) * (.12 + uFlash * .5), 1.) * vA; }',
});
scene.add(new THREE.LineSegments(rGeo, rainMat));

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .8, .5, .4);
composer.addPass(bloom); composer.addPass(new OutputPass());
let W = 1, H = 1, PX = 1;
const RES = new THREE.Vector2(1, 1);
function resize() {
  W = innerWidth || 1; H = innerHeight || 1; PX = Math.min(W, H) / 800;
  renderer.setSize(W, H); composer.setSize(W, H); RES.set(W, H);
  camera.aspect = W / H;
  camera.fov = Math.max(42, 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(17)) / camera.aspect) * 180 / Math.PI);
  camera.updateProjectionMatrix(); fx.resizeFx(W, H);
}
addEventListener('resize', resize); resize();

let flash = 0, hit = 0, target = 0, charge = 0, full = 0, crawl = 0, nextAmb = 3, T = 0, ph = 0, shake = 0;
const FP = new THREE.Vector3();
const lineMat = (color, width, op) => new LineMaterial({ color, linewidth: width, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, resolution: RES });
const tmp2 = new THREE.Vector3(), scr = v => { tmp2.copy(v).project(camera); return [(tmp2.x + 1) / 2 * W, (1 - tmp2.y) / 2 * H]; };

const SPN = 500, spPos = new Float32Array(SPN * 3).fill(-999), spVel = new Float32Array(SPN * 3), spLife = new Float32Array(SPN);
const spGeo = new THREE.BufferGeometry(); spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
const sparks = new THREE.Points(spGeo, new THREE.PointsMaterial({ color: '#d7e6ff', size: .09, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
sparks.frustumCulled = false; scene.add(sparks);
let spI = 0;
function burst(p, n, sp = 5) {
  for (let k = 0; k < n; k++) {
    const i = spI++ % SPN, a = rnd(0, Math.PI * 2), u = rnd(-.2, 1);
    spPos.set([p.x, p.y, p.z], i * 3);
    spVel.set([Math.cos(a) * sp * rnd(.3, 1), u * sp, Math.sin(a) * sp * rnd(.3, 1)], i * 3); spLife[i] = rnd(.5, 1.1);
  }
}

const crawlMat = lineMat('#bff3ff', 1.6, 1), crawlGeo = new LineSegmentsGeometry();
const crawlLine = new LineSegments2(crawlGeo, crawlMat); crawlLine.frustumCulled = false; crawlLine.visible = false; scene.add(crawlLine);
function crawlPath() {
  const out = [], bx = battery.position.x, k = Math.max(0, target - 1), cy = .72 + k * .345;
  for (let s = 0; s < 3; s++) {
    const a0 = rnd(0, Math.PI * 2), pts = [[0, TIP.y], [.05, 3.0], [.62, 2.75], [.62, cy]];
    let prev = null;
    pts.forEach(([r, y], j) => {
      if (!j) { prev = new THREE.Vector3(bx, y, 0); return; }
      const [r0, y0] = pts[j - 1];
      for (let n = 1; n <= 6; n++) {
        const t = n / 6, rr = lerp(r0, r, t), ang = a0 + (j === 3 ? t * 2.5 : 0);
        const q = new THREE.Vector3(bx + Math.cos(ang) * rr + rnd(-.06, .06), lerp(y0, y, t) + rnd(-.05, .05), Math.sin(ang) * rr + rnd(-.06, .06));
        out.push(prev.x, prev.y, prev.z, q.x, q.y, q.z); prev = q;
      }
    });
  }
  return out;
}

const beam = new THREE.Mesh(new THREE.CylinderGeometry(.18, .5, 17, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#ffc56e', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
beam.position.y = TIP.y + 8.5; scene.add(beam);
const ring = new THREE.Mesh(new THREE.RingGeometry(.9, 1, 96), new THREE.MeshBasicMaterial({ color: '#ffcf8a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
ring.rotation.x = -Math.PI / 2; ring.position.y = .05; scene.add(ring);

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), tmp = new THREE.Vector3();
const cloudPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 21);
function strike(cx, cy) {
  ndc.set(cx / W * 2 - 1, -(cy / H) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const [sx, sy] = scr(TIP);
  const onBattery = Math.hypot(cx - sx, cy - sy) < Math.max(22, 34 * PX) || ray.intersectObject(battery, true).length > 0;
  if (onBattery) {
    const from = target < CELLS ? fx.strikeText(target) : fx.textPoint();
    fx.bolt(() => from, () => scr(TIP), { color: '#3fe6ff', power: 1, width: 8.5, delay: .14 });
    FP.set(TIP.x, 14, 0); flash = 1.2;
    setTimeout(() => { hit = 1; hitLight.position.copy(TIP).add(new THREE.Vector3(0, .3, .6)); shake = .5; burst(TIP, 70, 6); }, 140);
    if (target < CELLS) target++; else for (let k = 0; k < 4; k++) burst(new THREE.Vector3(TIP.x + rnd(-.6, .6), rnd(.6, 2.6), rnd(-.6, .6)), 30, 4);
    crawl = 1.1; thunder(1, camera.position.distanceTo(TIP)); zap(target);
    if (target === CELLS && !full) { full = .001; setTimeout(fullChord, 520); }
    document.getElementById('hint').style.opacity = 0;
    return;
  }
  const hits = ray.intersectObjects([city, ground], false);
  if (hits.length) {
    const p = hits[0].point.clone(), x0 = scr(p)[0] + rnd(-.15, .15) * W;
    fx.bolt(() => [x0, -20], () => scr(p), { color: '#4f86ff', power: .85, width: 6.5 });
    FP.copy(p).add(new THREE.Vector3(0, 10, 0)); flash = 1; hit = .7; hitLight.position.copy(p).add(new THREE.Vector3(0, .5, 0)); shake = .25;
    burst(p, 40, 4); thunder(.85, camera.position.distanceTo(p));
  } else {
    const x0 = cx + rnd(-90, 90) * PX;
    fx.bolt(() => [x0, -20], () => [cx, cy], { color: '#86a8ff', power: .55, width: 4, splash: false, branchy: 1.5 });
    if (ray.ray.intersectPlane(cloudPlane, tmp)) FP.copy(tmp); flash = .7; rumble(.5, .3);
  }
}
function ambient() {
  const p = new THREE.Vector3(rnd(-70, 70), rnd(22, 26), rnd(-110, -15)), [x, y] = [rnd(.05, .95) * W, rnd(.02, .3) * H];
  if (Math.random() < .6) fx.bolt(() => [x, y], () => [x + rnd(-.3, .3) * W, y + rnd(.02, .14) * H], { color: '#6f8cff', power: .4, width: 3, splash: false, back: true, gens: 5 });
  FP.copy(p); flash = Math.max(flash, rnd(.35, .6));
  rumble(rnd(.25, .45), camera.position.distanceTo(p) * .012);
}

let AC = null, master = null, noiseBuf = null, soundOn = true;
function audioInit() {
  if (AC) { if (soundOn && AC.state === 'suspended') AC.resume(); return; }
  AC = new (window.AudioContext || window.webkitAudioContext)();
  master = AC.createGain(); master.gain.value = soundOn ? .9 : 0; master.connect(AC.destination);
  noiseBuf = AC.createBuffer(1, AC.sampleRate * 3, AC.sampleRate);
  const d = noiseBuf.getChannelData(0); let b = 0;
  for (let k = 0; k < d.length; k++) { b = b * .6 + (Math.random() * 2 - 1) * .4; d[k] = b * 1.4; }
  const rain = AC.createBufferSource(), bp = AC.createBiquadFilter(), rg = AC.createGain();
  rain.buffer = noiseBuf; rain.loop = true; bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = .4; rg.gain.value = .05;
  rain.connect(bp).connect(rg).connect(master); rain.start();
}
const now = () => AC ? AC.currentTime : 0;
function env(g, t0, a, peak, dec) { g.gain.setValueAtTime(.0001, t0); g.gain.linearRampToValueAtTime(peak, t0 + a); g.gain.exponentialRampToValueAtTime(.0001, t0 + a + dec); }
function noise(t0, a, dec, peak, type, freq, q = .7) {
  if (!AC) return;
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf; s.playbackRate.value = rnd(.6, 1.1); f.type = type; f.frequency.value = freq; f.Q.value = q;
  env(g, t0, a, peak, dec); s.connect(f).connect(g).connect(master); s.start(t0, rnd(0, 1)); s.stop(t0 + a + dec + .1);
}
function tone(f, t0, a, dec, peak, type = 'sine', f2) {
  if (!AC) return;
  const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + a + dec);
  env(g, t0, a, peak, dec); o.connect(g).connect(master); o.start(t0); o.stop(t0 + a + dec + .1);
}
function rumble(p, delay) { const t = now() + delay; for (let k = 0; k < 4; k++) noise(t + k * rnd(.12, .3), rnd(.05, .3), rnd(1.4, 3), .55 * p, 'lowpass', rnd(90, 200), 1); }
function thunder(p, dist) {
  const t = now(), far = clamp(dist / 80);
  noise(t, .002, .22, .7 * p * (1 - far * .7), 'highpass', 1200);
  noise(t, .002, .5, .5 * p, 'lowpass', 600);
  rumble(p, dist * .012);
}
const SCALE = [0, 3, 5, 7, 10, 12];
function zap(n) {
  const t = now(), f = 261.6 * Math.pow(2, SCALE[clamp(n - 1, 0, 5)] / 12);
  tone(70, t, .01, .5, .12, 'sawtooth', 40); noise(t + .05, .01, .45, .16, 'bandpass', 3000, 4);
  tone(f, t + .38, .02, 1.1, .12, 'triangle'); tone(f * 2, t + .4, .02, .8, .04, 'sine');
}
function fullChord() { const t = now(); [261.6, 329.6, 392, 523.3, 659.3].forEach((f, k) => tone(f, t + k * .06, .4, 3.2, .06, 'sine')); }

const mouse = new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown', e => { audioInit(); strike(e.clientX, e.clientY); });
addEventListener('pointermove', e => mouse.set(e.clientX / W - .5, e.clientY / H - .5));
document.getElementById('snd').onclick = e => {
  soundOn = !soundOn; audioInit();
  master.gain.setTargetAtTime(soundOn ? .9 : 0, now(), .05);
  if (soundOn) AC.resume();
  e.target.textContent = soundOn ? '소리 끄기' : '소리 켜기';
};
document.getElementById('reset').onclick = () => {
  target = charge = full = crawl = 0; aLit.fill(0); fx.resetFx();
  document.getElementById('hint').style.opacity = 1;
};

const warm = new THREE.Color('#ffb347'), cyan = new THREE.Color('#36d8ff');
function step(dt) {
  T += dt;
  ph += dt * (.42 + charge * .09);
  battery.position.x = RAIL * Math.sin(ph + .9 * Math.sin(ph * .61));
  TIP.x = battery.position.x; cellLight.position.x = TIP.x; beam.position.x = TIP.x; ring.position.x = TIP.x;
  if (crawl > 0) crawl = Math.max(0, crawl - dt * 1.5);
  if (crawl < .55) charge = Math.min(target, charge + dt * 2.2);
  if (full > 0) full += dt;
  flash *= Math.exp(-dt * 6); hit *= Math.exp(-dt * 7); shake *= Math.exp(-dt * 5);
  if ((nextAmb -= dt) < 0) { ambient(); nextAmb = rnd(4, 9); }
  flashLight.position.copy(FP); flashLight.intensity = flash * 90;
  hitLight.intensity = hit * 70;
  const fr = charge / CELLS, pulse = full ? .6 + .4 * Math.sin(T * 3) : 0;
  cells.forEach((c, k) => {
    const f = clamp(charge - k);
    c.material.emissive.copy(full ? warm : cyan);
    c.material.emissiveIntensity = f * (2.2 + pulse * 1.5 + (Math.random() < .08 ? .8 : 0));
  });
  cellLight.color.copy(full ? warm : cyan); cellLight.intensity = fr * 7 + pulse * 4;
  tipMat.emissiveIntensity = target < CELLS ? .5 + .4 * Math.sin(T * 2.5) : 1.5 + pulse;
  crawlLine.visible = crawl > .05;
  if (crawlLine.visible) { crawlGeo.setPositions(crawlPath()); crawlMat.opacity = crawl; crawlMat.resolution = RES; }
  const L = full ? Math.min(1.2, fr * .75 + full * .3) : fr * .75;
  blds.forEach((b, i) => {
    const want = clamp((L - b.th) * 5);
    aLit[i] = want > aLit[i] ? Math.min(want, aLit[i] + dt * rnd(.3, 2.5)) : Math.max(want, aLit[i] - dt * 2);
  });
  bGeo.attributes.aLit.needsUpdate = true;
  redMat.color.setRGB(Math.sin(T * 3) > .4 && L > .02 ? 1 : .12, .1, .08);
  beam.material.opacity = full ? clamp(full * .8) * (.25 + pulse * .15) : 0;
  ring.scale.setScalar(1 + full * 22); ring.material.opacity = full > 0 && full < 3 ? (1 - full / 3) * .7 : 0;
  for (let i = 0; i < SPN; i++) {
    if (spLife[i] <= 0) continue;
    spLife[i] -= dt * 1.5; spVel[i * 3 + 1] -= 12 * dt;
    for (let a = 0; a < 3; a++) spPos[i * 3 + a] += spVel[i * 3 + a] * dt;
    if (spLife[i] <= 0 || spPos[i * 3 + 1] < 0) { spLife[i] = 0; spPos[i * 3 + 1] = -999; }
  }
  spGeo.attributes.position.needsUpdate = true;
  cloudMats.forEach(m => { m.uniforms.uTime.value = T; m.uniforms.uFlash.value = flash; m.uniforms.uFP.value.copy(FP); m.uniforms.uWarm.value = full ? clamp(full * .5) : 0; });
  rainMat.uniforms.uTime.value = T; rainMat.uniforms.uFlash.value = flash;
  camera.position.set(CAM.x + Math.sin(T * .13) * 1.2 + mouse.x * 2.5 + rnd(-1, 1) * shake * .4, CAM.y + mouse.y * -1.2 + rnd(-1, 1) * shake * .3, CAM.z);
  camera.lookAt(LOOK.x + TIP.x * .12, LOOK.y, LOOK.z);
  composer.render(dt);
  fx.setFull(full); flash = Math.max(flash, fx.renderFx(dt, flash) * .9);
}

let last = performance.now();
function frame(ts) {
  const dt = clamp((ts - last) / 1000, 0, .05); last = Math.max(last, ts);
  step(dt); requestAnimationFrame(frame);
}
requestAnimationFrame(t => { last = t; frame(t); });

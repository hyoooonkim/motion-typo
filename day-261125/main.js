import * as THREE from 'three';

const $ = s => document.querySelector(s);
const STORIES = [
  { band: [.43, .565], lines: [['나는 너를', '친구로서', '사랑해', 10], ['우리', '셋이서', '영원히']] },
  { band: [.415, .585], lines: [['나는 너', '의 친한 친구', '를 좋아해', 4], ['우리', '셋이 같이', '또 오자']] },
  { band: [.41, .57], lines: [['이 아이는 제', '동생 부부의', '아들입니다'], ['다들', '제 동생을', '닮았대요']] },
  { band: [.335, .745], lines: [['우리 집 서열 1위는', '아빠, 2위는 엄마, 꼴찌는', '강아지']] },
];
let cur = 0;
const TW = 2048, BX = 64, BY = 64, PWP = TW - BX * 2, PHP = Math.round(PWP * 1207 / 1800), CAP = 330, TH = BY + PHP + CAP;
const uOf = f => (BX + f * PWP) / TW;
let BU = [uOf(STORIES[0].band[0]), uOf(STORIES[0].band[1])];
const CW = 4, CH = CW * TH / TW, FOLD = Math.PI - .045;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.setClearColor('#101011');
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, .1, 100);
scene.add(new THREE.HemisphereLight('#fffaf0', '#2a2520', 1.25));
const sun = new THREE.DirectionalLight('#fff6e8', 2.1);
sun.position.set(-3, 4, 7); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 20 }); sun.shadow.radius = 12; sun.shadow.bias = -.0008;
scene.add(sun);
const table = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: .32 }));
table.position.z = -.18; table.receiveShadow = true; scene.add(table);

const tc = document.createElement('canvas'); tc.width = TW; tc.height = TH;
const tx = tc.getContext('2d');
const texture = new THREE.CanvasTexture(tc); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
function paint(img) {
  tx.fillStyle = '#f2eee4'; tx.fillRect(0, 0, TW, TH);
  const d = tx.getImageData(0, 0, TW, TH);
  for (let i = 0; i < d.data.length; i += 4) { const n = (Math.random() - .5) * 8; d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n; }
  tx.putImageData(d, 0, 0);
  if (img) { tx.drawImage(img, BX, BY, PWP, PHP); tx.fillStyle = 'rgba(255,214,160,.07)'; tx.fillRect(BX, BY, PWP, PHP); }
  tx.fillStyle = '#26324a'; tx.textBaseline = 'alphabetic';
  const st = STORIES[cur], a = BU[0] * TW, b = BU[1] * TW, n = st.lines.length;
  st.lines.forEach(([l, m, r, g = 18], j) => {
    const y = BY + PHP + (n === 1 ? 190 : 128 + j * 128), fs = 108;
    tx.font = `${fs}px 'Nanum Pen Script', cursive`;
    tx.textAlign = 'right'; tx.fillText(l, a - g, y);
    tx.textAlign = 'left'; tx.fillText(r, b + g, y);
    const chars = [...m], x0 = a + g, avail = b - g - x0;
    const nat = tx.measureText(m).width, fsm = fs * Math.max(.55, Math.min(1.22, avail / nat));
    tx.font = `${fsm}px 'Nanum Pen Script', cursive`;
    const ws = chars.map(ch => tx.measureText(ch).width), tot = ws.reduce((s, w) => s + w, 0), left = Math.max(0, avail - tot);
    const sp = chars.filter(ch => ch === ' ').length, slots = sp || Math.max(1, chars.length - 1);
    let x = chars.length > 1 ? x0 : x0 + left / 2;
    tx.textAlign = 'left';
    chars.forEach((ch, i) => { tx.fillText(ch, x, y); x += ws[i] + ((sp ? ch === ' ' : i < chars.length - 1) ? left / slots : 0); });
  });
  texture.needsUpdate = true;
}

const front = new THREE.MeshStandardMaterial({ map: texture, roughness: .5, metalness: 0 });
const back = new THREE.MeshStandardMaterial({ color: '#ebe6da', roughness: .9, side: THREE.BackSide });
const holder = new THREE.Group(); scene.add(holder);
let root = null, pivots = [], fronts = [];
const pleats = [];
function seg(u0, u1) {
  const w = (u1 - u0) * CW, g = new THREE.PlaneGeometry(w, CH, Math.max(1, Math.ceil(w * 12)), 1);
  g.translate(w / 2, 0, 0);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, u0 + uv.getX(i) * (u1 - u0));
  const grp = new THREE.Group(), f = new THREE.Mesh(g, front), bk = new THREE.Mesh(g, back);
  f.castShadow = bk.castShadow = true; grp.add(f, bk); fronts.push(f);
  return { grp, w };
}
function rebuild() {
  if (root) holder.remove(root);
  root = new THREE.Group(); holder.add(root); pivots = []; fronts = [];
  const cr = pleats.flatMap(p => [{ u: p.a, s: 1, p }, { u: (p.a + p.b) / 2, s: -1, p }]).sort((x, y) => x.u - y.u);
  const bounds = [0, ...cr.map(c => c.u), 1];
  let prev = null;
  for (let i = 0; i < bounds.length - 1; i++) {
    const s = seg(bounds[i], bounds[i + 1]);
    if (!prev) root.add(s.grp);
    else { const pv = new THREE.Group(); pv.position.x = prev.w; pv.userData.c = cr[i - 1]; prev.grp.add(pv); pv.add(s.grp); pivots.push(pv); }
    prev = s;
  }
}
const ease = k => k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
function pose() {
  pivots.forEach(pv => { const c = pv.userData.c, t = ease(c.p.k); pv.rotation.y = c.s * t * FOLD; pv.position.z = -.0025 * t; });
  const hidden = pleats.reduce((s, p) => s + (p.b - p.a) * ease(p.k), 0);
  root.position.set(-CW * (1 - hidden) / 2, 0, 0);
}

let actx = null;
function crease(delay = 0) {
  if (!actx) return;
  const t0 = actx.currentTime + delay, len = .18, buf = actx.createBuffer(1, actx.sampleRate * len, actx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3) * (Math.random() < .3 ? 1 : .35);
  const src = actx.createBufferSource(); src.buffer = buf;
  const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500 + Math.random() * 1200; f.Q.value = .8;
  const g = actx.createGain(); g.gain.value = .5;
  src.connect(f).connect(g).connect(actx.destination); src.start(t0);
}

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h); camera.aspect = w / h;
  const fit = Math.max(CW * (camera.aspect < 1 ? 1.04 : 1.18) / (2 * Math.tan(THREE.MathUtils.degToRad(15)) * camera.aspect), CH * 1.35 / (2 * Math.tan(THREE.MathUtils.degToRad(15))));
  camera.position.set(0, -.25, fit); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
  ov.width = w * devicePixelRatio; ov.height = h * devicePixelRatio;
}
const ov = $('#ov'), oc = ov.getContext('2d');
addEventListener('resize', resize);

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function uAt(e) {
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(fronts, false)[0];
  return hit ? { u: hit.uv.x, x: e.clientX } : null;
}
function screenY() {
  const v = new THREE.Vector3(), out = [];
  [CH / 2, -CH / 2].forEach(y => { v.set(0, y, 0); holder.localToWorld(v); v.project(camera); out.push((-v.y * .5 + .5) * innerHeight); });
  return out;
}
let drag = null;
renderer.domElement.addEventListener('pointerdown', e => {
  if (!actx) try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
  const h = uAt(e); if (!h || busy()) return;
  drag = { a: h, b: h }; try { renderer.domElement.setPointerCapture(e.pointerId); } catch {}
});
renderer.domElement.addEventListener('pointermove', e => { if (!drag) return; const h = uAt(e); drag.b = h ? h : { u: drag.b.u, x: e.clientX }; });
addEventListener('pointerup', () => {
  if (!drag) return;
  let a = Math.min(drag.a.u, drag.b.u), b = Math.max(drag.a.u, drag.b.u); drag = null;
  if (b - a < .025) return;
  if (Math.abs(a - BU[0]) < .035 && Math.abs(b - BU[1]) < .035) { a = BU[0]; b = BU[1]; }
  a = Math.max(.004, a); b = Math.min(.996, b);
  if (pleats.some(p => a < p.b && b > p.a)) return;
  pleats.push({ a, b, k: 0, dir: 1 }); rebuild(); pose();
  crease(); crease(.28);
  $('#open').disabled = false;
  $('#hint').textContent = pleats.length > 1 ? '접을수록 다른 이야기가 돼요' : '다른 곳도 접어 보세요';
});
const busy = () => pleats.some(p => p.dir !== 0);
$('#open').onclick = () => { if (busy()) return; pleats.forEach(p => p.dir = -1); crease(); };

function overlay() {
  oc.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); oc.clearRect(0, 0, innerWidth, innerHeight);
  if (!drag) return;
  const [y0, y1] = screenY(), x0 = Math.min(drag.a.x, drag.b.x), x1 = Math.max(drag.a.x, drag.b.x);
  oc.fillStyle = 'rgba(255,255,255,.1)'; oc.fillRect(x0, y0, x1 - x0, y1 - y0);
  oc.strokeStyle = 'rgba(255,255,255,.85)'; oc.setLineDash([6, 5]); oc.lineWidth = 1.2;
  [x0, (x0 + x1) / 2, x1].forEach((x, i) => { if (i === 2) return; oc.beginPath(); oc.moveTo(x, y0 - 10); oc.lineTo(x, y1 + 10); oc.stroke(); });
  oc.setLineDash([]);
}

let last = performance.now(), T = 0;
function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now; T += dt;
  let changed = false;
  for (const p of pleats) if (p.dir) { p.k = Math.min(1, Math.max(0, p.k + p.dir * dt / .95)); changed = true; if (p.k === 1 || p.k === 0) p.dir = 0; }
  if (pleats.length && pleats.every(p => p.k === 0 && p.dir === 0)) { pleats.length = 0; rebuild(); $('#open').disabled = true; $('#hint').textContent = '사진을 가로로 끌어서 접어 보세요'; }
  if (changed || true) pose();
  holder.rotation.set(-.1 + Math.sin(T * .5) * .012, Math.sin(T * .37) * .04, Math.sin(T * .3) * .008);
  overlay();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

paint(null); rebuild(); resize();
const imgs = STORIES.map((_, i) => { const im = new Image(); im.src = `photo-${i + 1}.jpg`; return im; });
const ready = document.fonts.load("108px 'Nanum Pen Script'");
function show(i) {
  cur = i; BU = [uOf(STORIES[i].band[0]), uOf(STORIES[i].band[1])];
  pleats.length = 0; rebuild(); pose();
  $('#open').disabled = true; $('#hint').textContent = '사진을 가로로 끌어서 접어 보세요';
  document.querySelectorAll('#stories button').forEach((b, j) => b.classList.toggle('on', j === i));
  const im = imgs[i];
  const go = () => ready.then(() => { if (cur === i) paint(im); });
  if (im.complete && im.naturalWidth) go(); else { paint(null); im.onload = go; }
}
const nav = $('#stories');
STORIES.forEach((_, i) => { const b = document.createElement('button'); b.textContent = String(i + 1).padStart(2, '0'); b.onclick = () => !busy() && show(i); nav.append(b); });
show(0);
requestAnimationFrame(loop);

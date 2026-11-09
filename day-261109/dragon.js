// 지구본을 휘감고 미끄러지는 용 한 마리 (three.js). 지구본은 2D 캔버스에 그려지고, 여기서는 같은 화면 좌표로 겹쳐 그린다.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('dragon');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 20000);
camera.position.set(0, 0, 8000);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
const sun = new THREE.DirectionalLight(0xfff0d0, 2.8); sun.position.set(-1, 1.1, 1.3); scene.add(sun);
const rim = new THREE.DirectionalLight(0xffc070, 1.2); rim.position.set(1.2, -.4, -1); scene.add(rim);
scene.add(new THREE.HemisphereLight(0xfff3dd, 0x2a1a0a, .5));

// 지구 자리: 색은 안 칠하고 깊이만 막아서 뒤로 돌아간 몸이 가려지게 한다
const occluder = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), new THREE.MeshBasicMaterial({ colorWrite: false }));
occluder.renderOrder = -1; scene.add(occluder);

// 비늘 무늬: 위쪽 띠는 겹친 비늘, 가운데 띠(배)는 가로 비늘판
function scaleTexture() {
  const W = 512, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#7d6a3f'; g.fillRect(0, 0, W, H);
  const sw = W / 8, sh = H / 16;
  for (let row = -1; row < 18; row++) for (let col = -1; col < 9; col++) {
    const v = row * sh, x = col * sw + (row % 2 ? sw / 2 : 0);
    if (v > H * .38 && v < H * .62) continue;
    const gr = g.createRadialGradient(x, v + sh * .2, sw * .05, x, v + sh * .5, sw * .62);
    gr.addColorStop(0, '#f2dc9c'); gr.addColorStop(.6, '#b5944f'); gr.addColorStop(1, '#4a3a1c');
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, v + sh * .55, sw * .56, sh * 1.05, 0, 0, Math.PI); g.lineTo(x - sw * .56, v); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(40,28,10,.7)'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, v + sh * .55, sw * .56, sh * 1.05, 0, 0, Math.PI); g.stroke();
  }
  for (let k = 0; k < 8; k++) {
    const x0 = k * sw, gr = g.createLinearGradient(x0, 0, x0 + sw, 0);
    gr.addColorStop(0, '#5a4722'); gr.addColorStop(.25, '#d9bd78'); gr.addColorStop(.8, '#a8884a'); gr.addColorStop(1, '#4a3a1c');
    g.fillStyle = gr; g.fillRect(x0 + 2, H * .38, sw - 4, H * .24);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  const b = new THREE.CanvasTexture(c); b.wrapS = b.wrapT = THREE.RepeatWrapping;
  return [t, b];
}
const [SCALE, BUMP] = scaleTexture();
const gold = new THREE.MeshStandardMaterial({ color: 0xd2ae66, map: SCALE, bumpMap: BUMP, bumpScale: 4, metalness: .62, roughness: .34 });
const goldPlain = new THREE.MeshStandardMaterial({ color: 0xc9a258, metalness: .65, roughness: .35 });
const horn = new THREE.MeshStandardMaterial({ color: 0xe9d6a6, metalness: .3, roughness: .45 });
const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffb347, emissive: 0xff7a1a, emissiveIntensity: 1.4, roughness: .2 });

// 지구를 비스듬히 두 번 오르내리며 감는 닫힌 길. 반지름 1 기준(지구 반지름 1)
const TILT = new THREE.Matrix4().makeRotationX(.42).multiply(new THREE.Matrix4().makeRotationZ(-.28));
function pathAt(th, out) {
  const lat = .5 * Math.sin(2 * th + .4) + .12 * Math.sin(5 * th);
  const r = 1.2 + .035 * Math.sin(3 * th);
  out.set(r * Math.cos(lat) * Math.cos(th), r * Math.sin(lat), r * Math.cos(lat) * Math.sin(th));
  return out.applyMatrix4(TILT);
}

// 몸통: 고리(RAD 칸) × 마디(SEG 칸) 관. 매 프레임 꼭짓점을 다시 놓는다
const SEG = 320, RAD = 24, LEN = 7.4;
const body = new THREE.BufferGeometry();
const bpos = new Float32Array((SEG + 1) * (RAD + 1) * 3), buv = new Float32Array((SEG + 1) * (RAD + 1) * 2), bidx = [];
for (let i = 0; i <= SEG; i++) for (let j = 0; j <= RAD; j++) {
  const k = i * (RAD + 1) + j; buv[k * 2] = i / SEG * 64; buv[k * 2 + 1] = j / RAD;
  if (i < SEG && j < RAD) { const a = k, b = k + RAD + 1; bidx.push(a, b, a + 1, b, b + 1, a + 1); }
}
body.setAttribute('position', new THREE.BufferAttribute(bpos, 3));
body.setAttribute('uv', new THREE.BufferAttribute(buv, 2));
body.setIndex(bidx);
const bodyMesh = new THREE.Mesh(body, gold); scene.add(bodyMesh);
// 몸 굵기: 목에서 굵어지고 꼬리로 가늘어진다
const thick = s => s < .05 ? .62 + .38 * s / .05 : s < .45 ? 1 : 1 - .8 * Math.pow((s - .45) / .55, 1.4);

const SP = Array.from({ length: SEG + 1 }, () => ({ p: new THREE.Vector3(), t: new THREE.Vector3(), n: new THREE.Vector3(), b: new THREE.Vector3(), r: 0 }));
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
function layBody(head, t, Rw) {
  for (let i = 0; i <= SEG; i++) {
    const s = i / SEG, th = head - s * LEN, q = SP[i];
    pathAt(th, q.p); pathAt(th - .002, tmp); q.t.subVectors(tmp, q.p).normalize();
    // 바깥(지구 반대) 방향을 등으로 삼는다
    q.n.copy(q.p).addScaledVector(q.t, -q.p.dot(q.t)).normalize();
    q.b.crossVectors(q.t, q.n).normalize();
    const wave = Math.sin(s * 22 - t * 2.2) * .022 * (.3 + s);
    q.p.addScaledVector(q.b, wave).addScaledVector(q.n, Math.sin(s * 17 - t * 1.9) * .01);
    q.r = .112 * thick(s);
  }
  for (let i = 0; i <= SEG; i++) {
    const q = SP[i];
    for (let j = 0; j <= RAD; j++) {
      const a = j / RAD * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), belly = ca < 0 ? .82 : 1;
      const k = (i * (RAD + 1) + j) * 3;
      tmp2.copy(q.p).addScaledVector(q.n, ca * q.r * belly).addScaledVector(q.b, sa * q.r * 1.05).multiplyScalar(Rw);
      bpos[k] = tmp2.x; bpos[k + 1] = tmp2.y; bpos[k + 2] = tmp2.z;
    }
  }
  body.attributes.position.needsUpdate = true;
  body.computeVertexNormals();
}

// 등지느러미 가시와 옆구리 지느러미
const coneG = new THREE.ConeGeometry(1, 1, 6); coneG.translate(0, .5, 0);
const FINS = 96, FRILLS = 72;
const fins = new THREE.InstancedMesh(coneG, goldPlain, FINS), frills = new THREE.InstancedMesh(coneG, goldPlain, FRILLS);
scene.add(fins, frills);
const UP = new THREE.Vector3(0, 1, 0), dummy = new THREE.Object3D(), dir = new THREE.Vector3();
function spike(mesh, idx, base, d, h, w) {
  dummy.position.copy(base); dummy.quaternion.setFromUnitVectors(UP, dir.copy(d).normalize()); dummy.scale.set(w, h, w);
  dummy.updateMatrix(); mesh.setMatrixAt(idx, dummy.matrix);
}
const at = s => SP[Math.min(SEG, Math.round(s * SEG))];

// 다리 네 개: 윗다리·아랫다리 원기둥과 발톱 네 개씩
const cylG = new THREE.CylinderGeometry(1, .8, 1, 10); cylG.translate(0, .5, 0);
const legs = Array.from({ length: 8 }, () => { const m = new THREE.Mesh(cylG, gold); scene.add(m); return m; });
const claws = new THREE.InstancedMesh(coneG, horn, 16); scene.add(claws);
const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
function limb(m, a, b, w) {
  m.position.copy(a); m.quaternion.setFromUnitVectors(UP, dir.subVectors(b, a).normalize());
  m.scale.set(w, a.distanceTo(b), w);
}

// 머리: 두개골·주둥이·여닫는 턱·이빨·뿔·수염·갈기·눈 (단위: 머리 크기 1)
const head = new THREE.Group(); scene.add(head);
const ball = (mat, sx, sy, sz, x, y, z, parent = head) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); parent.add(m); return m; };
ball(gold, 1, .78, 1.25, 0, .15, -.1);
for (const sx of [-1, 1]) {
  ball(goldPlain, .36, .24, .62, sx * .46, .56, .38);
  ball(goldPlain, .18, .16, .2, sx * .25, .38, 2.5);
  ball(eyeMat, .17, .15, .17, sx * .6, .44, .58);
}
ball(gold, .62, .38, 1.38, 0, .1, 1.45);
const jaw = new THREE.Group(); jaw.position.set(0, -.12, .15); head.add(jaw);
ball(gold, .55, .22, 1.25, 0, -.16, 1.1, jaw);
const toothG = new THREE.ConeGeometry(.06, .3, 5);
for (const sx of [-1, 1]) for (let k = 0; k < 7; k++) {
  const z = .75 + k * .26, up = new THREE.Mesh(toothG, horn); up.position.set(sx * (.44 - k * .03), -.2, z); up.rotation.x = Math.PI; head.add(up);
  const lo = new THREE.Mesh(toothG, horn); lo.position.set(sx * (.38 - k * .03), .04, z - .05); jaw.add(lo);
}
const tube = (pts, r, mat) => { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 40, r, 8), mat); head.add(m); return m; };
for (const sx of [-1, 1]) {
  tube([[sx * .45, .6, -.2], [sx * .78, .98, -1.1], [sx * .9, 1.05, -2.2], [sx * .72, .82, -3.1]], .12, horn);
  tube([[sx * .4, .05, 2.35], [sx * 1.4, -.25, 2.0], [sx * 2.3, -.8, .6], [sx * 2.6, -1.5, -1.2], [sx * 2.2, -2.2, -2.6]], .045, horn);
}
const maneG = new THREE.ConeGeometry(.14, 1.1, 5); maneG.translate(0, .55, 0);
for (let k = 0; k < 16; k++) {
  const a = k / 16 * Math.PI * 2, m = new THREE.Mesh(maneG, goldPlain);
  m.position.set(Math.cos(a) * .7, Math.sin(a) * .62 + .05, -.75);
  m.quaternion.setFromUnitVectors(UP, new THREE.Vector3(Math.cos(a) * .8, Math.sin(a) * .8, -1).normalize());
  head.add(m);
}
for (let k = 0; k < 7; k++) { const m = new THREE.Mesh(maneG, goldPlain); m.position.set((k - 3) * .13, -.35, 1.3 - k * .1); m.quaternion.setFromUnitVectors(UP, new THREE.Vector3((k - 3) * .1, -1, -.7).normalize()); jaw.add(m); }

const basis = new THREE.Matrix4(), X = new THREE.Vector3(), F = new THREE.Vector3(), U = new THREE.Vector3();
let size = '';
function render() {
  const G = window.GLOBE; if (!G) return;
  const key = `${G.W}x${G.H}@${G.DPR}`;
  if (key !== size) {
    size = key; renderer.setPixelRatio(G.DPR); renderer.setSize(G.W, G.H, false);
    Object.assign(camera, { left: -G.W / 2, right: G.W / 2, top: G.H / 2, bottom: -G.H / 2 }); camera.updateProjectionMatrix();
  }
  const R = G.R, t = G.t;
  occluder.scale.setScalar(R * .995);
  layBody(t * .1, t, R);

  for (let k = 0; k < FINS; k++) {
    const s = .05 + k / FINS * .87, q = at(s), h = q.r * (1.05 + .45 * Math.sin(k * 1.7)) * R;
    spike(fins, k, A.copy(q.p).addScaledVector(q.n, q.r * .8).multiplyScalar(R), B.copy(q.n).addScaledVector(q.t, .9), h, q.r * .2 * R);
  }
  for (let k = 0; k < FRILLS; k++) {
    const side = k % 2 ? 1 : -1, s = .07 + (k >> 1) / (FRILLS / 2) * .7, q = at(s);
    spike(frills, k, A.copy(q.p).addScaledVector(q.b, side * q.r * .9).multiplyScalar(R), B.copy(q.b).multiplyScalar(side).addScaledVector(q.t, 1.2).addScaledVector(q.n, -.2), q.r * .9 * R, q.r * .12 * R);
  }
  fins.instanceMatrix.needsUpdate = frills.instanceMatrix.needsUpdate = true;

  [.16, .5].forEach((s, pair) => [-1, 1].forEach((side, j) => {
    const q = at(s + j * .015), r = q.r * R, step = Math.sin(t * 2.2 + pair * 2 + j * Math.PI) * .35;
    A.copy(q.p).multiplyScalar(R).addScaledVector(q.b, side * r * .75).addScaledVector(q.n, -r * .15);
    B.copy(A).addScaledVector(q.b, side * r * 1.5).addScaledVector(q.n, -r * 1.1).addScaledVector(q.t, -r * (.4 + step));
    C.copy(B).addScaledVector(q.n, -r * 1.5).addScaledVector(q.b, side * r * .3).addScaledVector(q.t, r * (.5 - step));
    const i = pair * 2 + j;
    limb(legs[i * 2], A, B, r * .34); limb(legs[i * 2 + 1], B, C, r * .26);
    for (let c = 0; c < 4; c++) spike(claws, i * 4 + c, C, F.copy(q.t).multiplyScalar(-1 + c * .2).addScaledVector(q.b, side * (c - 1.5) * .5).addScaledVector(q.n, -.9), r * .75, r * .1);
  }));
  claws.instanceMatrix.needsUpdate = true;

  const q0 = SP[0], hs = q0.r * R * 1.45;
  F.copy(q0.t).multiplyScalar(-1); U.copy(q0.n).addScaledVector(F, -q0.n.dot(F)).normalize(); X.crossVectors(U, F);
  basis.makeBasis(X, U, F); head.quaternion.setFromRotationMatrix(basis);
  head.position.copy(q0.p).multiplyScalar(R).addScaledVector(F, hs * .9).addScaledVector(U, hs * .15);
  head.scale.setScalar(hs);
  jaw.rotation.x = .3 + .18 * Math.sin(t * 1.3);
  renderer.render(scene, camera);
}
function loop() { requestAnimationFrame(loop); render(); }
loop();

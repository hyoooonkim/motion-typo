// 지구본을 휘감고 미끄러지는 용 한 마리 (three.js). 지구본은 2D 캔버스에 그려지고, 여기서는 같은 화면 좌표로 겹쳐 그린다.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('dragon');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 20000);
camera.position.set(0, 0, 8000);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
const key = new THREE.DirectionalLight(0xfff0d6, 3.2); key.position.set(-1, 1.2, 1.4); scene.add(key);
const rim = new THREE.DirectionalLight(0xffb060, 2.2); rim.position.set(1.4, -.3, -1.2); scene.add(rim);
const top = new THREE.DirectionalLight(0xcfe0ff, .8); top.position.set(.3, 1, -.4); scene.add(top);
scene.add(new THREE.HemisphereLight(0xfff3dd, 0x1e140a, .45));

// 지구 자리: 색은 안 칠하고 깊이만 막아서 뒤로 돌아간 몸이 가려지게 한다
const occluder = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), new THREE.MeshBasicMaterial({ colorWrite: false }));
occluder.renderOrder = -1; scene.add(occluder);

// 비늘: 꼬리 쪽으로 겹쳐 내려가는 둥근 비늘의 높이를 계산해 색·노멀·거칠기 지도를 만든다. 가운데 띠(v .4~.6)는 배 비늘판
function scaleMaps() {
  const S = 512, h = new Float32Array(S * S), cols = 8, rows = 16, rx = S / cols * .72, ry = S / rows * .78;
  for (let c = cols; c >= -1; c--) for (let r = -1; r <= rows; r++) {
    const cx = c * S / cols + (r & 1) * S / cols / 2, cy = r * S / rows;
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx * .55); x <= cx + rx; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry, e = dx * dx + dy * dy;
      if (e >= 1 || dx < -.55) continue;
      const v = Math.sqrt(1 - e) * (.55 + .45 * (dx + .55) / 1.55) + .12 * (1 - Math.abs(dy));
      h[((y % S + S) % S) * S + ((x % S + S) % S)] = v;
    }
  }
  for (let y = S * .4 | 0; y < S * .6; y++) for (let x = 0; x < S; x++) {
    const f = (x % (S / 12)) / (S / 12), side = Math.abs((y / S - .5) / .1);
    h[y * S + x] = Math.pow(Math.sin(Math.PI * f), .4) * (1 - side * side * .5);
  }
  const col = document.createElement('canvas'), nrm = document.createElement('canvas'), rough = document.createElement('canvas');
  [col, nrm, rough].forEach(c => { c.width = c.height = S; });
  const C = col.getContext('2d').createImageData(S, S), N = nrm.getContext('2d').createImageData(S, S), Rg = rough.getContext('2d').createImageData(S, S);
  const H = (x, y) => h[((y + S) % S) * S + ((x + S) % S)];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = (y * S + x) * 4, v = H(x, y), gx = (H(x - 1, y) - H(x + 1, y)) * 9, gy = (H(x, y - 1) - H(x, y + 1)) * 9, l = Math.hypot(gx, gy, 1);
    N.data[i] = (gx / l * .5 + .5) * 255; N.data[i + 1] = (gy / l * .5 + .5) * 255; N.data[i + 2] = (1 / l * .5 + .5) * 255; N.data[i + 3] = 255;
    const k = Math.pow(clamp01(v), .7), pat = (1 - k) * .55;
    C.data[i] = 60 + 160 * k - 10 * pat; C.data[i + 1] = 42 + 125 * k + 18 * pat; C.data[i + 2] = 20 + 58 * k + 10 * pat; C.data[i + 3] = 255;
    Rg.data[i] = Rg.data[i + 1] = Rg.data[i + 2] = (.28 + (1 - k) * .5) * 255; Rg.data[i + 3] = 255;
  }
  col.getContext('2d').putImageData(C, 0, 0); nrm.getContext('2d').putImageData(N, 0, 0); rough.getContext('2d').putImageData(Rg, 0, 0);
  return [col, nrm, rough].map((c, i) => {
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
    if (i === 0) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
}
function clamp01(v) { return Math.max(0, Math.min(1, v)); }
const [MAP, NRM, RGH] = scaleMaps();
const bronze = new THREE.MeshStandardMaterial({ map: MAP, normalMap: NRM, normalScale: new THREE.Vector2(1.6, 1.6), roughnessMap: RGH, metalness: .72, roughness: 1, envMapIntensity: 1.1 });
const goldFin = new THREE.MeshStandardMaterial({ color: 0xd9b46a, metalness: .8, roughness: .3, side: THREE.DoubleSide });
const darkGold = new THREE.MeshStandardMaterial({ color: 0x9c7a3c, metalness: .75, roughness: .4, side: THREE.DoubleSide });
const ivory = new THREE.MeshStandardMaterial({ color: 0xeadbb4, metalness: .25, roughness: .4 });
const skin = new THREE.MeshStandardMaterial({ color: 0xb8924e, metalness: .7, roughness: .38 });
const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffb347, emissive: 0xff6a10, emissiveIntensity: 1.6, roughness: .15 });
const tongueMat = new THREE.MeshStandardMaterial({ color: 0x9a2e22, roughness: .5, metalness: .1 });

// 굵기가 점점 줄어드는 관(뿔·수염·갈기·꼬리 술)
function taper(pts, r0, r1, segs = 28, rad = 7, uRep = 0) {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => p.isVector3 ? p : new THREE.Vector3(...p)));
  const fr = curve.computeFrenetFrames(segs, false), pos = [], uv = [], idx = [], P = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    const u = i / segs, r = typeof r0 === 'function' ? r0(u) : r0 + (r1 - r0) * Math.pow(u, .8); curve.getPointAt(u, P);
    for (let j = 0; j <= rad; j++) {
      const a = j / rad * Math.PI * 2, n = fr.normals[i], b = fr.binormals[i];
      uv.push(u * uRep, j / rad);
      pos.push(P.x + (n.x * Math.cos(a) + b.x * Math.sin(a)) * r, P.y + (n.y * Math.cos(a) + b.y * Math.sin(a)) * r, P.z + (n.z * Math.cos(a) + b.z * Math.sin(a)) * r);
      if (i < segs && j < rad) { const k = i * (rad + 1) + j; idx.push(k, k + rad + 1, k + 1, k + rad + 1, k + rad + 2, k + 1); }
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// 뒤로 휘는 칼날 지느러미: 밑변이 x(꼬리 방향), 높이가 y
function bladeGeo() {
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.quadraticCurveTo(.02, .55, .3, 1); s.quadraticCurveTo(.26, .45, .5, 0); s.lineTo(0, 0);
  const g = new THREE.ShapeGeometry(s, 10), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setX(i, p.getX(i) + y * y * .45); p.setZ(i, Math.sin(y * 3) * .03); }
  g.computeVertexNormals();
  return g;
}
const BLADE = bladeGeo();

// 지구를 비스듬히 두 번 오르내리며 감는 닫힌 길. 반지름 1 기준(지구 반지름 1)
const TILT = new THREE.Matrix4().makeRotationX(.42).multiply(new THREE.Matrix4().makeRotationZ(-.28));
function pathAt(th, out) {
  const lat = .5 * Math.sin(2 * th + .4) + .12 * Math.sin(5 * th);
  const r = 1.2 + .035 * Math.sin(3 * th);
  out.set(r * Math.cos(lat) * Math.cos(th), r * Math.sin(lat), r * Math.cos(lat) * Math.sin(th));
  return out.applyMatrix4(TILT);
}

// 몸통: 고리(RAD 칸) × 마디(SEG 칸) 관. 매 프레임 꼭짓점을 다시 놓는다
const SEG = 320, RAD = 28, LEN = 7.4;
const body = new THREE.BufferGeometry();
const bpos = new Float32Array((SEG + 1) * (RAD + 1) * 3), buv = new Float32Array((SEG + 1) * (RAD + 1) * 2), bidx = [];
for (let i = 0; i <= SEG; i++) for (let j = 0; j <= RAD; j++) {
  const k = i * (RAD + 1) + j; buv[k * 2] = i / SEG * 26; buv[k * 2 + 1] = j / RAD;
  if (i < SEG && j < RAD) { const a = k, b = k + RAD + 1; bidx.push(a, b, a + 1, b, b + 1, a + 1); }
}
body.setAttribute('position', new THREE.BufferAttribute(bpos, 3));
body.setAttribute('uv', new THREE.BufferAttribute(buv, 2));
body.setIndex(bidx);
scene.add(new THREE.Mesh(body, bronze));
const thick = s => s < .05 ? .62 + .38 * s / .05 : s < .45 ? 1 : 1 - .8 * Math.pow((s - .45) / .55, 1.4);
const SP = Array.from({ length: SEG + 1 }, () => ({ p: new THREE.Vector3(), t: new THREE.Vector3(), n: new THREE.Vector3(), b: new THREE.Vector3(), r: 0 }));
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
function layBody(head, t, Rw) {
  for (let i = 0; i <= SEG; i++) {
    const s = i / SEG, th = head - s * LEN, q = SP[i];
    pathAt(th, q.p); pathAt(th - .002, tmp); q.t.subVectors(tmp, q.p).normalize();
    q.n.copy(q.p).addScaledVector(q.t, -q.p.dot(q.t)).normalize();
    q.b.crossVectors(q.t, q.n).normalize();
    q.p.addScaledVector(q.b, Math.sin(s * 22 - t * 2.2) * .022 * (.3 + s)).addScaledVector(q.n, Math.sin(s * 17 - t * 1.9) * .01);
    q.r = .112 * thick(s);
  }
  for (let i = 0; i <= SEG; i++) {
    const q = SP[i];
    for (let j = 0; j <= RAD; j++) {
      const a = j / RAD * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), belly = ca < 0 ? .82 : 1, k = (i * (RAD + 1) + j) * 3;
      tmp2.copy(q.p).addScaledVector(q.n, ca * q.r * belly).addScaledVector(q.b, sa * q.r * 1.05).multiplyScalar(Rw);
      bpos[k] = tmp2.x; bpos[k + 1] = tmp2.y; bpos[k + 2] = tmp2.z;
    }
  }
  body.attributes.position.needsUpdate = true;
  body.computeVertexNormals();
}
const at = s => SP[Math.min(SEG, Math.round(s * SEG))];

// 칼날 지느러미 묶음: 등줄기(목은 크게), 옆구리, 팔꿈치
const FINS = 110, FRILLS = 80, TUFTS = 24;
const fins = new THREE.InstancedMesh(BLADE, goldFin, FINS), frills = new THREE.InstancedMesh(BLADE, darkGold, FRILLS), tufts = new THREE.InstancedMesh(BLADE, goldFin, TUFTS);
scene.add(fins, frills, tufts);
const M = new THREE.Matrix4(), SC = new THREE.Matrix4(), bx = new THREE.Vector3(), by = new THREE.Vector3(), bz = new THREE.Vector3();
// 밑변 방향 x, 솟는 방향 y 로 칼날 하나를 놓는다
function blade(mesh, idx, pos, x, y, len, hgt) {
  bx.copy(x).normalize(); by.copy(y).addScaledVector(bx, -y.dot(bx)).normalize(); bz.crossVectors(bx, by);
  M.makeBasis(bx, by, bz).multiply(SC.makeScale(len, hgt, len)).setPosition(pos);
  mesh.setMatrixAt(idx, M);
}

// 다리: 관절마다 그룹을 두고 각도만 바꾼다 (단위: 다리 크기 1, 아래 -y, 앞 +z)
const A = new THREE.Vector3(), B = new THREE.Vector3(), F = new THREE.Vector3(), U = new THREE.Vector3(), X = new THREE.Vector3();
const sph = (mat, sx, sy, sz, x, y, z, parent) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); parent.add(m); return m; };
function makeLeg() {
  const root = new THREE.Group(); scene.add(root);
  sph(bronze, .5, .46, .56, 0, -.05, 0, root);
  root.add(new THREE.Mesh(taper([[0, 0, 0], [.1, -.55, .2], [.05, -1.0, .24], [0, -1.32, .2]], u => .46 - .16 * u + .07 * Math.sin(Math.PI * u), 0, 24, 14, 3), bronze));
  const elbow = new THREE.Group(); elbow.position.set(0, -1.32, .2); root.add(elbow);
  sph(skin, .3, .3, .32, 0, 0, 0, elbow);
  elbow.add(new THREE.Mesh(taper([[0, 0, 0], [0, -.5, -.08], [0, -1.08, -.1]], u => .3 - .13 * u + .05 * Math.sin(Math.PI * u * 1.3), 0, 20, 12, 2.5), bronze));
  const wrist = new THREE.Group(); wrist.position.set(0, -1.08, -.1); elbow.add(wrist);
  sph(skin, .2, .19, .22, 0, 0, 0, wrist);
  sph(bronze, .36, .15, .42, 0, -.1, .2, wrist);
  const toes = [];
  for (const x of [-.22, 0, .22]) {
    const k = new THREE.Group(); k.position.set(x, -.12, .45); wrist.add(k); toes.push(k);
    k.add(new THREE.Mesh(taper([[0, 0, 0], [x * .3, -.02, .22], [x * .4, -.07, .42]], .09, .065, 12, 8), skin));
    sph(skin, .075, .07, .08, x * .4, -.07, .42, k);
    k.add(new THREE.Mesh(taper([[x * .4, -.07, .42], [x * .46, -.06, .6], [x * .46, -.2, .78], [x * .42, -.38, .8]], .065, .004, 16, 7), ivory));
  }
  const back = new THREE.Group(); back.position.set(0, -.1, -.08); wrist.add(back);
  back.add(new THREE.Mesh(taper([[0, 0, 0], [0, -.04, -.22], [0, -.08, -.32]], .08, .06, 10, 8), skin));
  back.add(new THREE.Mesh(taper([[0, -.08, -.32], [0, -.12, -.48], [0, -.28, -.55]], .06, .004, 12, 7), ivory));
  return { root, elbow, wrist, toes };
}
const LEGS = [0, 1, 2, 3].map(makeLeg);
const qa = new THREE.Quaternion(), eul = new THREE.Euler(), basis = new THREE.Matrix4();

// 꼬리 끝 불꽃 술 (단위: 꼬리 술 길이 1, 꼬리 방향 +z)
const tail = new THREE.Group(); scene.add(tail);
for (let k = 0; k < 16; k++) {
  const a = k / 16 * Math.PI * 2, sp = .25 + (k % 3) * .12, L = .7 + (k % 4) * .15;
  tail.add(new THREE.Mesh(taper([[0, 0, 0], [Math.cos(a) * sp * .5, Math.sin(a) * sp * .5 + .1, L * .4], [Math.cos(a) * sp, Math.sin(a) * sp + .3, L * .8], [Math.cos(a) * sp * .6, Math.sin(a) * sp * .8 + .6, L]], .09, .004, 20, 6), goldFin));
}

// 머리 (단위: 머리 크기 1, 앞 +z, 위 +y)
const head = new THREE.Group(); scene.add(head);
const ball = (mat, sx, sy, sz, x, y, z, parent = head, rx = 0) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); m.rotation.x = rx; parent.add(m); return m; };
const tube = (pts, r0, r1, mat, parent = head) => { const m = new THREE.Mesh(taper(pts, r0, r1), mat); parent.add(m); return m; };
ball(bronze, 1, .8, 1.25, 0, .15, -.1);
ball(bronze, .64, .4, 1.4, 0, .12, 1.45);
for (const sx of [-1, 1]) {
  ball(skin, .38, .26, .7, sx * .48, .58, .4, head, -.2);           // 눈썹뼈
  ball(skin, .22, .2, .26, sx * .26, .4, 2.55);                     // 콧방울
  ball(skin, .3, .22, .5, sx * .62, -.05, .2);                      // 광대
  ball(eyeMat, .17, .15, .18, sx * .62, .45, .66);
  // 갈라진 사슴뿔
  tube([[sx * .42, .66, -.1], [sx * .72, 1.15, -.9], [sx * .92, 1.55, -1.9], [sx * 1.02, 1.8, -2.9]], .17, .03, ivory);
  tube([[sx * .78, 1.25, -1.15], [sx * .95, 1.9, -1.0], [sx * .9, 2.35, -.65]], .1, .015, ivory);
  tube([[sx * .96, 1.65, -2.3], [sx * 1.35, 2.25, -2.3], [sx * 1.45, 2.65, -2.0]], .085, .012, ivory);
  // 길게 말린 수염
  tube([[sx * .38, .02, 2.45], [sx * 1.5, -.3, 2.3], [sx * 2.6, -1.0, 1.1], [sx * 3.0, -2.0, -.9], [sx * 2.5, -2.9, -2.7], [sx * 1.7, -3.2, -3.9]], .07, .008, ivory);
  tube([[sx * .5, .55, 1.9], [sx * 1.2, 1.1, 1.6], [sx * 1.8, 1.3, .6], [sx * 2.1, 1.0, -.6]], .045, .006, ivory);
}
// 불꽃처럼 뒤로 흐르는 갈기
for (let k = 0; k < 26; k++) {
  const a = (k / 25 - .5) * Math.PI * 1.5 + Math.PI / 2, sx = Math.cos(a), sy = Math.sin(a), L = 2.6 + (k % 5) * .45, w = (k % 3 - 1) * .3;
  tube([[sx * .62, sy * .55 + .15, -.6], [sx * 1.0, sy * .9 + .45, -1.4], [sx * 1.25 + w, sy * 1.1 + .9, -L * .7], [sx * 1.1 - w, sy * 1.2 + 1.5, -L]], .13, .006, k % 2 ? goldFin : darkGold);
}
const jaw = new THREE.Group(); jaw.position.set(0, -.12, .15); head.add(jaw);
ball(bronze, .56, .22, 1.28, 0, -.16, 1.1, jaw);
ball(tongueMat, .26, .08, .95, 0, -.02, 1.3, jaw);
for (let k = 0; k < 9; k++) tube([[(k - 4) * .12, -.32, 1.6 - Math.abs(k - 4) * .12], [(k - 4) * .16, -.9, 1.1], [(k - 4) * .2, -1.5, .3]], .07, .005, darkGold, jaw); // 턱수염
const tooth = (h) => { const g = new THREE.ConeGeometry(.06, h, 6); g.translate(0, -h / 2, 0); return g; };
for (const sx of [-1, 1]) for (let k = 0; k < 8; k++) {
  const fang = k === 6, z = .7 + k * .24, up = new THREE.Mesh(tooth(fang ? .55 : .26), ivory);
  up.position.set(sx * (.46 - k * .03), -.18, z); head.add(up);
  const lo = new THREE.Mesh(tooth(fang ? .45 : .22), ivory); lo.rotation.x = Math.PI; lo.position.set(sx * (.4 - k * .03), .02, z - .1); jaw.add(lo);
}

let size = '';
function render() {
  const G = window.GLOBE; if (!G) return;
  const sz = `${G.W}x${G.H}@${G.DPR}`;
  if (sz !== size) {
    size = sz; renderer.setPixelRatio(G.DPR); renderer.setSize(G.W, G.H, false);
    Object.assign(camera, { left: -G.W / 2, right: G.W / 2, top: G.H / 2, bottom: -G.H / 2 }); camera.updateProjectionMatrix();
  }
  const R = G.R, t = G.t;
  occluder.scale.setScalar(R * .995);
  layBody(t * .1, t, R);

  for (let k = 0; k < FINS; k++) {
    const s = .045 + k / FINS * .9, q = at(s), neck = s < .16 ? 1.8 - s * 5 : 1, r = q.r * R;
    blade(fins, k, A.copy(q.p).multiplyScalar(R).addScaledVector(q.n, r * .78), q.t, q.n, r * 1.1 * neck, r * (1.2 + .6 * Math.sin(k * 1.9)) * neck);
  }
  for (let k = 0; k < FRILLS; k++) {
    const side = k % 2 ? 1 : -1, s = .06 + (k >> 1) / (FRILLS / 2) * .82, q = at(s), r = q.r * R;
    blade(frills, k, A.copy(q.p).multiplyScalar(R).addScaledVector(q.b, side * r * .92), q.t, B.copy(q.b).multiplyScalar(side).addScaledVector(q.n, .35), r * .8, r * .85);
  }
  fins.instanceMatrix.needsUpdate = frills.instanceMatrix.needsUpdate = true;

  [.15, .5].forEach((s, pair) => [-1, 1].forEach((side, j) => {
    const q = at(s + j * .015), r = q.r * R, i = pair * 2 + j, L = LEGS[i], ph = t * 2.2 + pair * 2 + j * Math.PI;
    A.copy(q.p).multiplyScalar(R).addScaledVector(q.b, side * r * .72).addScaledVector(q.n, -r * .2);
    // 다리가 뻗는 방향: 지구 쪽으로 내려가며 옆으로 벌어진다. 앞(+z)은 머리 쪽
    U.copy(q.n).multiplyScalar(.7).addScaledVector(q.b, -side * .7).normalize();
    F.copy(q.t).multiplyScalar(-1).addScaledVector(U, q.t.dot(U)).normalize(); X.crossVectors(U, F);
    basis.makeBasis(X, U, F); L.root.quaternion.setFromRotationMatrix(basis).multiply(qa.setFromEuler(eul.set(Math.sin(ph) * .5, 0, side * .15)));
    L.root.position.copy(A); L.root.scale.setScalar(r * 1.05);
    L.elbow.rotation.x = -.7 - .4 * Math.sin(ph + 1.2);
    L.wrist.rotation.x = .75 + .3 * Math.sin(ph + 2);
    L.toes.forEach((k, c) => { k.rotation.x = .2 + .35 * Math.max(0, Math.sin(ph + 2.6)); k.rotation.y = (c - 1) * .25; });
    L.root.updateMatrixWorld(true); L.elbow.getWorldPosition(B);
    for (let c = 0; c < 6; c++) blade(tufts, i * 6 + c, B, q.t, U.copy(q.b).multiplyScalar(side).addScaledVector(q.n, (c - 2.5) * .35), r * .45, r * (.9 + c % 3 * .25));
  }));
  tufts.instanceMatrix.needsUpdate = true;

  const qe = SP[SEG];
  basis.makeBasis(X.crossVectors(qe.n, qe.t), qe.n, qe.t); tail.quaternion.setFromRotationMatrix(basis);
  tail.position.copy(qe.p).multiplyScalar(R); tail.scale.setScalar(.2 * R);

  const q0 = SP[0], hs = q0.r * R * 1.45;
  F.copy(q0.t).multiplyScalar(-1); U.copy(q0.n).addScaledVector(F, -q0.n.dot(F)).normalize(); X.crossVectors(U, F);
  basis.makeBasis(X, U, F); head.quaternion.setFromRotationMatrix(basis);
  head.position.copy(q0.p).multiplyScalar(R).addScaledVector(F, hs * .9).addScaledVector(U, hs * .15);
  head.scale.setScalar(hs);
  jaw.rotation.x = .32 + .2 * Math.sin(t * 1.3);
  renderer.render(scene, camera);
}
function loop() { requestAnimationFrame(loop); render(); }
loop();

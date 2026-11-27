const $ = s => document.querySelector(s);
const cv = document.createElement('canvas'); document.body.prepend(cv);
const gl = cv.getContext('webgl2', { antialias: false });
const rnd = (a, b) => a + Math.random() * (b - a);
const SCENES = [
  { k: 'cat', g: .95, n: '잠든 고양이', t: 38.6, line: '동그랗게 말린 배 한가운데가 제일 따뜻하다.', hot: [.491, .47] },
  { k: 'bung', g: .9, n: '갓 구운 붕어빵', t: 64.0, line: '팥이 든 배 쪽부터 식는다. 그래서 머리부터 먹는다.', hot: [.5, .52], fish: [[.185, .346], [.509, .324], [.822, .337]] },
  { k: 'candle', g: .98, n: '촛불 하나', t: 91.0, line: '작은 불꽃 하나가 방의 온도를 바꾼다.', hot: [.493, .26] },
  { k: 'hug', g: .8, n: '포옹', t: 37.2, line: '맞닿은 자리가 가장 뜨겁다.', hot: [.507, .568] },
];
const PALS = {
  aura: [[0, 7, 4, 26], [.18, 42, 13, 122], [.34, 107, 31, 214], [.5, 255, 47, 174], [.64, 255, 90, 60], [.78, 255, 177, 59], [.9, 255, 242, 122], [1, 255, 255, 255]],
  jelly: [[0, 27, 11, 77], [.18, 47, 107, 255], [.32, 70, 210, 255], [.46, 92, 255, 138], [.6, 255, 225, 74], [.74, 255, 106, 42], [.88, 255, 47, 174], [1, 255, 209, 240]],
};
let cur = 0, mode = 'aura', W = 0, H = 0, DPR = 1, box = [0, 0, 1, 1];
const heats = SCENES.map(s => { const im = new Image(); im.src = `heat-${s.k}.png`; return im; });
const HD = SCENES.map(() => null);
const DN = 384, DYN = document.createElement('canvas'); DYN.width = DYN.height = DN; const dx = DYN.getContext('2d');

const VS = `#version 300 es
in vec2 p; out vec2 v; void main(){ v = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;
const FS = `#version 300 es
precision highp float;
in vec2 v; out vec4 o;
uniform sampler2D uH, uD, uP; uniform vec2 uR; uniform vec4 uB; uniform float uT, uBr, uGloss, uGrain;
float hash(vec2 q){ return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }
float heat(vec2 s){
  vec2 q = (s - uB.xy) / uB.zw;
  float inb = step(0., q.x) * step(q.x, 1.) * step(0., q.y) * step(q.y, 1.);
  float b = inb > 0. ? texture(uH, q).r * uBr + texture(uD, q).r : 0.;
  return b;
}
void main(){
  vec2 s = vec2(v.x, 1. - v.y) * uR;
  float h = heat(s);
  float e = 3.;
  float hx = heat(s + vec2(e, 0.)) - heat(s - vec2(e, 0.)), hy = heat(s + vec2(0., e)) - heat(s - vec2(0., e));
  vec2 c = (s - uR * .5) / uR.y;
  float amb = .06 + .05 * (1. - length(c * vec2(.8, 1.)));
  float t = max(amb, h);
  t += (hash(s * .7 + uT) - .5) * uGrain;
  t = clamp(t, 0., 1.);
  vec3 col = texture(uP, vec2(t, .5)).rgb;
  vec3 n = normalize(vec3(-hx * 7., -hy * 7., 1.));
  float lit = max(dot(n, normalize(vec3(-.5, -.6, .65))), 0.);
  float sp = pow(lit, 18.) * smoothstep(.25, .55, h);
  col = col * (1. - uGloss * .25 + uGloss * .35 * lit) + vec3(1.) * sp * uGloss * .85;
  col *= .9 + .1 * smoothstep(1.2, .2, length(c));
  o = vec4(col, 1.);
}`;
function sh(t, s) { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(x); return x; }
const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
const U = n => gl.getUniformLocation(pr, n);
function tex(unit) { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v); return t; }
const tH = tex(0), tD = tex(1), tP = tex(2);
gl.uniform1i(U('uH'), 0); gl.uniform1i(U('uD'), 1); gl.uniform1i(U('uP'), 2);
const up = (unit, t, src) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); };
function palCanvas(P) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 1; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 256, 0);
  P.forEach(([o, r, gg, b]) => g.addColorStop(o, `rgb(${r},${gg},${b})`)); x.fillStyle = g; x.fillRect(0, 0, 256, 1); return c;
}
function setMode(m) {
  mode = m; up(2, tP, palCanvas(PALS[m]));
  gl.uniform1f(U('uGloss'), m === 'jelly' ? 1 : .15); gl.uniform1f(U('uGrain'), m === 'jelly' ? .006 : .045);
  const P = PALS[m]; $('#bar').style.background = `linear-gradient(to top, ${P.map(([o, r, g, b]) => `rgb(${r},${g},${b}) ${o * 100}%`).join(',')})`;
  document.querySelectorAll('#ctl .m').forEach(b => b.classList.toggle('on', b.dataset.m === m));
}

function glow(x, y, r, a) { const g = dx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)'); dx.fillStyle = g; dx.fillRect(x - r, y - r, r * 2, r * 2); }
const steam = [];
let warm = 0, hb = 0, actx = null;
function audio() { if (!actx) try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch {} }
function beat(v) { if (!actx) return; const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain(); o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(40, t + .15); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .2); o.connect(g).connect(actx.destination); o.start(t); o.stop(t + .22); }
function animate(t, dt) {
  dx.globalCompositeOperation = 'source-over'; dx.fillStyle = `rgba(0,0,0,${Math.min(1, dt * 1.1)})`; dx.fillRect(0, 0, DN, DN);
  dx.globalCompositeOperation = 'lighter';
  const s = SCENES[cur];
  let br = 1;
  if (s.k === 'cat') br = 1 + .045 * Math.sin(t * 1.5);
  if (s.k === 'candle') {
    const f = .5 * Math.sin(t * 9) + .3 * Math.sin(t * 23 + 1) + .2 * Math.sin(t * 41);
    br = 1 + .035 * f;
    const [hx, hy] = s.hot, sw = Math.sin(t * 1.7) * .006 + f * .003;
    for (let i = 0; i < 4; i++) glow((hx + sw * (1 + i)) * DN, (hy - .03 - i * .03) * DN, DN * (.05 - i * .008), .22 * dt * 1.2);
  }
  if (s.k === 'bung') {
    if (Math.random() < dt * 9) { const [fx, fy] = s.fish[Math.random() * 3 | 0]; steam.push({ x: fx + rnd(-.02, .02), y: fy - .05, a: rnd(.22, .34), r: rnd(.03, .05), life: 0, ph: rnd(0, 6) }); }
  }
  for (const p of steam) { p.life += dt; p.y -= dt * .055; p.x += Math.sin(p.life * 2 + p.ph) * dt * .02; p.r += dt * .012; glow(p.x * DN, p.y * DN, p.r * DN, p.a * dt * 1.2 * Math.max(0, 1 - p.life / 3.2)); }
  for (let i = steam.length - 1; i >= 0; i--) if (steam[i].life > 3.2 || s.k !== 'bung') steam.splice(i, 1);
  if (s.k === 'hug') {
    const ph = (t % .95) / .95, k1 = Math.exp(-(((ph - .05) / .05) ** 2)), k2 = Math.exp(-(((ph - .25) / .05) ** 2)), k = k1 + k2 * .7;
    const [hx, hy] = s.hot; glow(hx * DN, (hy - .08) * DN, DN * (.13 + .05 * k), .3 * k * dt * 1.2);
    const nb = ph < .05 ? 1 : ph < .25 ? 2 : 0; if (nb && nb !== hb) beat(nb === 1 ? .35 : .22); hb = nb;
  }
  warm = Math.min(1, warm + dt / .9);
  return s.g * br * (.15 + .85 * (1 - Math.pow(1 - warm, 3)));
}
let ptr = null, down = false;
const toImg = (x, y) => [(x - box[0]) / box[2], (y - box[1]) / box[3]];
function readT(x, y) {
  const s = SCENES[cur], d = HD[cur]; if (!d) return 18;
  const [u, w] = toImg(x, y); if (u < 0 || w < 0 || u > 1 || w > 1) return 18 + .06 * (s.t - 18);
  const b = d.data[((w * d.h | 0) * d.w + (u * d.w | 0)) * 4] / 255, dd = dx.getImageData(u * DN | 0, w * DN | 0, 1, 1).data[0] / 255;
  return 18 + Math.max(.06, Math.min(1, b + dd)) * (s.t - 18);
}
cv.addEventListener('pointermove', e => { ptr = [e.clientX, e.clientY]; $('#cur').style.display = 'block'; $('#cur').style.left = `${e.clientX}px`; $('#cur').style.top = `${e.clientY}px`; });
cv.addEventListener('pointerdown', e => { audio(); down = true; ptr = [e.clientX, e.clientY]; });
addEventListener('pointerup', () => { down = false; });
cv.addEventListener('pointerleave', () => { $('#cur').style.display = 'none'; ptr = null; });
function handHeat(dt) {
  if (!ptr) return;
  const [u, w] = toImg(...ptr); if (u < -.1 || w < -.1 || u > 1.1 || w > 1.1) return;
  glow(u * DN, w * DN, DN * (down ? .09 : .05), dt * (down ? 2.2 : .5));
  if (down) for (let i = 0; i < 4; i++) { const a = -2.2 + i * .45; glow((u + Math.cos(a) * .075) * DN, (w + Math.sin(a) * .085) * DN, DN * .028, dt * 1.6); }
}
function layout() {
  DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR;
  const sz = Math.min(H * .86, W * .62); box = [(W - sz) / 2, (H - sz) / 2 + H * .03, sz, sz];
  gl.viewport(0, 0, cv.width, cv.height); gl.uniform2f(U('uR'), W, H); gl.uniform4f(U('uB'), ...box);
}
function setScene(i) {
  cur = i; warm = 0; dx.globalCompositeOperation = 'source-over'; dx.fillStyle = '#000'; dx.fillRect(0, 0, DN, DN);
  const s = SCENES[i], im = heats[i];
  const go = () => {
    up(0, tH, im);
    if (!HD[i]) { const c = document.createElement('canvas'); c.width = c.height = 192; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 192, 192); HD[i] = { w: 192, h: 192, data: x.getImageData(0, 0, 192, 192).data }; }
  };
  im.complete && im.naturalWidth ? go() : (im.onload = go);
  $('#nm').textContent = s.n; $('#ln').textContent = s.line;
  $('#ticks').innerHTML = [1, .75, .5, .25, 0].map(k => `<span>${(18 + k * (s.t - 18)).toFixed(0)}°</span>`).join('');
  document.querySelectorAll('#ctl .s').forEach((b, j) => b.classList.toggle('on', j === i));
}
const ctl = $('#ctl');
SCENES.forEach((s, i) => { const b = document.createElement('button'); b.className = 's'; b.textContent = s.n; b.onclick = () => setScene(i); ctl.append(b); });
ctl.append(Object.assign(document.createElement('i'), { className: 'sep' }));
[['aura', '오라'], ['jelly', '젤리']].forEach(([m, n]) => { const b = document.createElement('button'); b.className = 'm'; b.dataset.m = m; b.textContent = n; b.onclick = () => setMode(m); ctl.append(b); });
let prev = performance.now(), shown = 0;
function frame(now) {
  const dt = Math.min(.05, (now - prev) / 1000), t = now / 1000; prev = now;
  const br = animate(t, dt); handHeat(dt);
  up(1, tD, DYN);
  gl.uniform1f(U('uT'), t % 100); gl.uniform1f(U('uBr'), br);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  const s = SCENES[cur], target = ptr ? readT(...ptr) : 18 + (s.t - 18) * (warm ** 2);
  shown += (target - shown) * Math.min(1, dt * 6);
  $('#tp').textContent = `${shown.toFixed(1)}°`; if (ptr) $('#ct').textContent = `${readT(...ptr).toFixed(1)}°C`;
  requestAnimationFrame(frame);
}
addEventListener('resize', layout);
layout(); setMode('aura'); setScene(0); requestAnimationFrame(frame);

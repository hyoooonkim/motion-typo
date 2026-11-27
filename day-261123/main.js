const $ = s => document.querySelector(s);
const cv = document.createElement('canvas'); document.body.prepend(cv);
const gl = cv.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
const rnd = (a, b) => a + Math.random() * (b - a);
let W = 0, H = 0, DPR = 1, GW = 0, GH = 0, hum = .72, temp = 31, scene = 0;

const DROP = document.createElement('canvas'), FOG = document.createElement('canvas');
let dc, fc;
const scenes = ['scene-1.jpg', 'scene-2.jpg'].map(s => { const im = new Image(); im.src = s; return im; });

const VS = `#version 300 es
in vec2 p; out vec2 v; void main(){ v = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;
const FS = `#version 300 es
precision highp float;
in vec2 v; out vec4 o;
uniform sampler2D uS, uD, uF; uniform vec2 uR, uSR, uTx; uniform float uHum, uT;
float h(vec2 q){ return texture(uD, q).r; }
float hash(vec2 q){ return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }
vec2 cover(vec2 q){ float a = uR.x / uR.y, b = uSR.x / uSR.y; vec2 s = a > b ? vec2(1., b / a) : vec2(a / b, 1.); return (q - .5) * s + .5; }
vec3 sc(vec2 q, float l){ return textureLod(uS, cover(clamp(q, .001, .999)), l).rgb; }
void main(){
  vec2 q = vec2(v.x, 1. - v.y);
  float c = h(q), dx = h(q + vec2(uTx.x, 0.)) - h(q - vec2(uTx.x, 0.)), dy = h(q + vec2(0., uTx.y)) - h(q - vec2(0., uTx.y));
  vec3 n = normalize(vec3(-dx * 2.4, -dy * 2.4, .5));
  float fog = texture(uF, q).r * (.55 + .45 * uHum);
  float grain = hash(floor(gl_FragCoord.xy / 1.6)) ;
  float micro = smoothstep(.55, 1., grain) * fog;
  vec3 clear = sc(q, 1.);
  vec3 blur = sc(q + vec2(0., .01), 6.2);
  vec3 fogc = mix(blur, vec3(1., .97, .96), .36 + .12 * uHum) * (1.04 + .06 * micro);
  fogc += (grain - .5) * .05 * fog;
  vec3 col = mix(clear * 1.06, fogc, smoothstep(0., .9, fog));
  float fx = texture(uF, q + vec2(uTx.x * 2., 0.)).r - texture(uF, q - vec2(uTx.x * 2., 0.)).r, fy = texture(uF, q + vec2(0., uTx.y * 2.)).r - texture(uF, q - vec2(0., uTx.y * 2.)).r;
  float fe = clamp(length(vec2(fx, fy)) * 2.2, 0., 1.);
  col = mix(col, col * .85, fe * .35); col += vec3(1.) * max(0., -fy) * .15;
  float inDrop = smoothstep(.04, .14, c);
  vec2 ofs = n.xy * (.012 + .03 * c);
  vec3 dcol = sc(q - ofs * 1.6 + vec2(0., .004), 1.8) * 1.08;
  col = mix(col, dcol, inDrop);
  float edge = clamp(length(vec2(dx, dy)) * 3., 0., 1.) * inDrop * (1. - smoothstep(.2, .6, c));
  col *= 1. - edge * .45;
  vec3 L = normalize(vec3(-.45, .55, .7));
  float sp = pow(max(dot(n, L), 0.), 60.) * inDrop;
  float sp2 = pow(max(dot(n, normalize(vec3(.4, -.5, .75))), 0.), 14.) * inDrop;
  col += vec3(1., .98, .95) * sp * 1.3 + vec3(1.) * sp2 * .12;
  float vg = smoothstep(1.25, .35, length(v - .5) * 1.4);
  col *= .82 + .18 * vg;
  o = vec4(col, 1.);
}`;
function sh(t, s) { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(x); return x; }
const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
const U = n => gl.getUniformLocation(pr, n);
function tex(unit, mip) {
  const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t;
}
const tS = tex(0, true), tD = tex(1), tF = tex(2);
gl.uniform1i(U('uS'), 0); gl.uniform1i(U('uD'), 1); gl.uniform1i(U('uF'), 2);
function upload(unit, t, src, mip) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); if (mip) gl.generateMipmap(gl.TEXTURE_2D); }
function setScene(i) { scene = i; const im = scenes[i]; const go = () => { upload(0, tS, im, true); gl.uniform2f(U('uSR'), im.naturalWidth, im.naturalHeight); }; im.complete && im.naturalWidth ? go() : (im.onload = go); }

const SPH = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  for (let i = 0; i <= 20; i++) { const t = i / 20, v = Math.sqrt(Math.max(0, 1 - t * t)); g.addColorStop(t * .97, `rgb(${Math.round(40 + 215 * v)},0,0)`); } g.addColorStop(1, 'rgb(0,0,0)');
  x.fillStyle = g; x.beginPath(); x.arc(32, 32, 32, 0, 7); x.fill(); return c; })();
const drop = (x, y, r) => { dc.drawImage(SPH, x - r, y - r, r * 2, r * 2); };
const CS = 10; let grid = new Map();
const key = (i, j) => i * 100003 + j;
function free(x, y, r) {
  const i0 = Math.floor((x - r - 12) / CS), i1 = Math.floor((x + r + 12) / CS), j0 = Math.floor((y - r - 12) / CS), j1 = Math.floor((y + r + 12) / CS);
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const c = grid.get(key(i, j)); if (c) for (const d of c) if (!d.gone && Math.hypot(d.x - x, d.y - y) < d.r + r + .8) return false; }
  return true;
}
let TM = null; const inText = (x, y) => { if (!TM) return false; const i = (y / 4 | 0) * TM.w + (x / 4 | 0); return TM.d[i * 4 + 3] > 20; };
function addDrop(x, y, r) { if (x < -5 || y < -5 || x > GW + 5 || y > GH + 5 || inText(x, y) || !free(x, y, r)) return false; const d = { x, y, r }; const k = key(Math.floor(x / CS), Math.floor(y / CS)); (grid.get(k) || grid.set(k, []).get(k)).push(d); drop(x, y, r); return true; }
function clearArea(x, y, R) {
  const i0 = Math.floor((x - R - 20) / CS), i1 = Math.floor((x + R + 20) / CS), j0 = Math.floor((y - R - 20) / CS), j1 = Math.floor((y + R + 20) / CS);
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const c = grid.get(key(i, j)); if (c) for (const d of c) if (Math.hypot(d.x - x, d.y - y) < R + d.r * .5) d.gone = true; }
}
const dsize = () => Math.random() < .55 ? rnd(.8, 2.2) : 1.5 + Math.pow(Math.random(), 2.4) * GW * .012;
const drips = [];
let TXT = null;
function layout() {
  DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR;
  GW = Math.round(W * .7); GH = Math.round(H * .7);
  for (const c of [DROP, FOG]) { c.width = GW; c.height = GH; }
  dc = DROP.getContext('2d'); fc = FOG.getContext('2d');
  fc.fillStyle = '#fff'; fc.fillRect(0, 0, GW, GH);
  dc.fillStyle = '#000'; dc.fillRect(0, 0, GW, GH); dc.globalCompositeOperation = 'lighten';
  const fs = Math.min(GH * .46, GW * .27);
  TXT = { fs, x: GW * .5, y: GH * .46 };
  { const c = document.createElement('canvas'); c.width = Math.ceil(GW / 4); c.height = Math.ceil(GH / 4); const x = c.getContext('2d'); x.scale(.25, .25); x.fillStyle = '#000'; x.strokeStyle = '#000'; text(x, 1, 6); TM = { w: c.width, d: x.getImageData(0, 0, c.width, c.height).data }; }
  grid = new Map();
  const n = Math.round(GW * GH / 14);
  for (let i = 0; i < n; i++) addDrop(rnd(0, GW), rnd(0, GH), dsize());
  fc.save(); fc.globalCompositeOperation = 'source-over'; fc.fillStyle = '#000'; text(fc, 1); fc.restore();
  dc.save(); dc.globalCompositeOperation = 'source-over'; dc.fillStyle = '#000'; text(dc, 1); dc.restore();
  for (let i = 0; i < 2; i++) { dc.save(); dc.globalCompositeOperation = 'source-over'; dc.fillStyle = '#000'; text(dc, 1); dc.restore(); }
  { const w = TM.w, hgt = Math.floor(TM.d.length / 4 / w); for (let j = 1; j < hgt - 1; j++) for (let i = 1; i < w - 1; i++) { const k = (j * w + i) * 4 + 3; if (TM.d[k] > 20) continue; if (TM.d[k + 4] > 20 || TM.d[k - 4] > 20 || TM.d[k + w * 4] > 20 || TM.d[k - w * 4] > 20) if (Math.random() < .22) addDrop(i * 4 + rnd(-1, 1), j * 4 + rnd(-1, 1), rnd(1.4, 3) * GW / 1000 * 1.3); } }
  drips.length = 0; seedDrips();
  gl.viewport(0, 0, cv.width, cv.height); gl.uniform2f(U('uR'), cv.width, cv.height); gl.uniform2f(U('uTx'), 1.5 / GW, 1.5 / GH);
}
function text(c, a, grow = 0) {
  c.save(); c.globalAlpha = a; c.lineWidth = grow * 2; c.lineJoin = 'round'; c.font = `${TXT.fs}px 'Nanum Brush Script', cursive`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.translate(TXT.x, TXT.y); c.rotate(-.05); c.fillText('따뜻해', 0, 0); if (grow) c.strokeText('따뜻해', 0, 0);
  c.font = `${TXT.fs * .3}px 'Nanum Brush Script', cursive`; c.fillText('조금만 더 있다 가자 ♡', TXT.fs * .55, TXT.fs * .62); if (grow) c.strokeText('조금만 더 있다 가자 ♡', TXT.fs * .55, TXT.fs * .62);
  c.restore();
}
function seedDrips() {
  const xs = [-.62, -.33, -.05, .22, .5, .66].map(k => TXT.x + k * TXT.fs * 1.4);
  xs.forEach((x, i) => drips.push({ x: x + rnd(-8, 8), y: TXT.y + TXT.fs * rnd(.12, .32), r: rnd(3, 5) * GW / 1000, vy: rnd(8, 18), slow: true, ph: rnd(0, 6), seed: i }));
}
function spawnDrip(x, y, r, slow) { if (drips.length < 40) drips.push({ x, y, r, vy: slow ? rnd(6, 14) : rnd(30, 70), slow, ph: rnd(0, 6) }); }
function stepDrips(dt) {
  dc.globalCompositeOperation = 'source-over';
  for (const d of drips) {
    const y0 = d.y; d.vy = Math.min(d.slow ? 60 : 260, d.vy + dt * (d.slow ? 6 : 140) * (Math.random() < .03 ? -4 : 1)); d.vy = Math.max(2, d.vy);
    d.y += d.vy * dt; const x = d.x + Math.sin(d.y * .03 + d.ph) * 1.2;
    dc.strokeStyle = '#000'; dc.lineCap = 'round'; dc.lineWidth = d.r * 3; dc.beginPath(); dc.moveTo(d.px ?? x, y0); dc.lineTo(x, d.y); dc.stroke();
    fc.strokeStyle = 'rgba(0,0,0,.9)'; fc.lineCap = 'round'; fc.lineWidth = d.r * 2.4; fc.beginPath(); fc.moveTo(d.px ?? x, y0); fc.lineTo(x, d.y); fc.stroke();
    clearArea(x, d.y, d.r * 1.2); d.px = x; d.r -= dt * (d.slow ? .02 : .25);
    if (d.y > GH + 10 || d.r < .8) d.dead = true;
  }
  dc.globalCompositeOperation = 'lighten';
  for (const d of drips) if (!d.dead) drop(d.px, d.y, d.r * 1.35);
  for (let i = drips.length - 1; i >= 0; i--) if (drips[i].dead) { const d = drips[i]; drips.splice(i, 1); if (d.seed !== undefined) spawnDrip(TXT.x + [-.62, -.33, -.05, .22, .5, .66][d.seed] * TXT.fs * 1.4, TXT.y + TXT.fs * .25, rnd(3, 5) * GW / 1000, true), drips[drips.length - 1].seed = d.seed; }
}
function condense(dt) {
  fc.globalCompositeOperation = 'source-over'; fc.fillStyle = `rgba(255,255,255,${dt * (.05 + .22 * hum)})`; fc.fillRect(0, 0, GW, GH);
  dc.globalCompositeOperation = 'lighten';
  const n = Math.round(GW * GH * dt * (.0015 + .006 * hum));
  for (let i = 0; i < n; i++) addDrop(rnd(0, GW), rnd(0, GH), dsize() * .7);
  fc.fillStyle = '#000'; text(fc, .5);
  dc.globalCompositeOperation = 'source-over'; dc.fillStyle = '#000'; text(dc, 1); dc.globalCompositeOperation = 'lighten';
  if (Math.random() < dt * .25 * hum) spawnDrip(rnd(0, GW), rnd(0, GH * .4), rnd(2.5, 5) * GW / 1000, false);
}
function wipe(x0, y0, x1, y1, w) {
  for (const [c, col] of [[dc, '#000'], [fc, 'rgba(0,0,0,.92)']]) { c.save(); c.globalCompositeOperation = 'source-over'; c.strokeStyle = col; c.lineCap = c.lineJoin = 'round'; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.restore(); }
  const L = Math.hypot(x1 - x0, y1 - y0), st = Math.max(1, Math.ceil(L / 6)); for (let i = 0; i <= st; i++) clearArea(x0 + (x1 - x0) * i / st, y0 + (y1 - y0) * i / st, w / 2);
  dc.globalCompositeOperation = 'lighten';
  const a = Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2, s = Math.random() < .5 ? 1 : -1;
  for (let i = 0; i < 2; i++) addDrop(x1 + Math.cos(a) * s * w * rnd(.5, .62), y1 + Math.sin(a) * s * w * rnd(.5, .62), rnd(1.2, 3.2) * GW / 1000);
}

let actx = null, rubG = null;
function audio() { if (!actx) try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch {} }
function rub(v) {
  audio(); if (!actx) return;
  if (!rubG) { const b = actx.createBuffer(1, actx.sampleRate, actx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = actx.createBufferSource(); s.buffer = b; s.loop = true; const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3200; f.Q.value = 2; rubG = actx.createGain(); rubG.gain.value = 0; s.connect(f).connect(rubG).connect(actx.destination); s.start(); }
  rubG.gain.setTargetAtTime(v, actx.currentTime, .04);
}
function breathSound() {
  audio(); if (!actx) return;
  const t = actx.currentTime, b = actx.createBuffer(1, actx.sampleRate * 1.6, actx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) { const k = i / d.length; d[i] = (Math.random() * 2 - 1) * Math.sin(k * Math.PI) ** 1.5; }
  const s = actx.createBufferSource(); s.buffer = b; const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; const g = actx.createGain(); g.gain.value = .5;
  s.connect(f).connect(g).connect(actx.destination); s.start(t);
}
let breath = null;
$('#breath').onclick = () => { breath = { x: GW * rnd(.3, .7), y: GH * rnd(.35, .65), t: 0 }; hum = Math.min(1, hum + .2); temp = Math.min(38, temp + 1.2); breathSound(); };
$('#scene').onclick = () => setScene((scene + 1) % scenes.length);
const gp = e => ({ x: e.clientX / W * GW, y: e.clientY / H * GH });
let last = null;
cv.addEventListener('pointerdown', e => { audio(); last = gp(e); try { cv.setPointerCapture(e.pointerId); } catch {} wipe(last.x, last.y, last.x + .1, last.y, GW * .045); });
cv.addEventListener('pointermove', e => {
  if (!last) return; const p = gp(e), d = Math.hypot(p.x - last.x, p.y - last.y);
  wipe(last.x, last.y, p.x, p.y, GW * .045); rub(Math.min(.1, d / 60));
  if (Math.random() < .04) spawnDrip(p.x + rnd(-6, 6), p.y + GW * .02, rnd(2.5, 4.5) * GW / 1000, false);
  last = p;
});
addEventListener('pointerup', () => { if (last) { spawnDrip(last.x, last.y + GW * .02, rnd(3, 5) * GW / 1000, false); } last = null; rub(0); });

let prev = performance.now(), ready = false;
function frame(now) {
  const dt = Math.min(.05, (now - prev) / 1000); prev = now;
  if (ready) {
    hum = Math.max(.45, hum - dt * .008); temp = Math.max(29, temp - dt * .04);
    condense(dt);
    if (breath) {
      breath.t += dt; const k = Math.min(1, breath.t / 1.2), R = GW * (.18 + .2 * k);
      const g = fc.createRadialGradient(breath.x, breath.y, 0, breath.x, breath.y, R); g.addColorStop(0, `rgba(255,255,255,${dt * 3})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      fc.globalCompositeOperation = 'source-over'; fc.fillStyle = g; fc.fillRect(0, 0, GW, GH);
      dc.globalCompositeOperation = 'lighten'; for (let i = 0; i < 90; i++) { const a = rnd(0, 6.3), r = Math.sqrt(Math.random()) * R; addDrop(breath.x + Math.cos(a) * r, breath.y + Math.sin(a) * r, dsize() * .8); }
      if (breath.t > 1.6) breath = null;
    }
    stepDrips(dt);
    upload(1, tD, DROP); upload(2, tF, FOG);
    gl.uniform1f(U('uHum'), hum); gl.uniform1f(U('uT'), now / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    $('#hm').textContent = `${Math.round(hum * 100)}%`; $('#tc').textContent = temp.toFixed(1);
  }
  requestAnimationFrame(frame);
}
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 200); });
document.fonts.load("200px 'Nanum Brush Script'", '따뜻해 조금만 더 있다 가자 ♡').then(() => { setScene(0); layout(); ready = true; });
requestAnimationFrame(frame);

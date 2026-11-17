const SCENES = [
  { key: 'siwon', word: '시원하다', pron: 'si·won·ha·da', pos: 'adj.', hole: '국밥 위로 오르는 뜨거운 김', en: ['cool', 'refreshing', 'relieved', 'satisfying', 'clear'], ex: '뜨거운 국물을 들이켜고, “아, 시원하다.”' },
  { key: 'jeong', word: '정', pron: 'jeong', pos: 'n.', hole: '기대앉은 두 사람 사이', en: ['affection', 'attachment', 'bond', 'warmth', 'love'], ex: '미운 정도 정이다.' },
  { key: 'nunchi', word: '눈치', pron: 'nun·chi', pos: 'n.', hole: '상 위로 오가는 시선', en: ['tact', 'sense', 'awareness', 'social cue', 'reading the room'], ex: '말 안 해도 눈치로 알지.' },
  { key: 'dapdap', word: '답답하다', pron: 'dap·dap·a·da', pos: 'adj.', hole: '손을 얹은 가슴', en: ['stuffy', 'frustrated', 'suffocating', 'stifled', 'heavy'], ex: '말이 안 통해서 답답해.' },
  { key: 'aswip', word: '아쉽다', pron: 'a·swip·da', pos: 'adj.', hole: '떠나며 흔드는 손', en: ['pity', 'regret', 'miss', 'too bad', 'wish'], ex: '벌써 가? 아쉽다.' },
];

const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const MONO = '"IBM Plex Mono", monospace', KR = '"Noto Sans KR", sans-serif';
const HOT = '#ff6a3d';

let W = 0, H = 0, DPR = 1, cur = 0, G = null, t = 0, last = performance.now();
let fade = 0, fdir = 1, want = 0;
const press = { on: false, x: 0, y: 0, R: 0, max: 0 };
const maps = {};

const beat = t => { const p = t % 1.15; return Math.exp(-(((p - .1) / .055) ** 2)) + .6 * Math.exp(-(((p - .32) / .055) ** 2)); };
const WARP = {
  siwon: (x, y, t, w, m) => {
    const up = clamp((m.hb.y1 - y) / (m.hb.y1 - m.hb.y0 + 1), 0, 1);
    return [x + Math.sin(y * .032 + t * 3.2) * 15 * w * (.35 + up), y + Math.sin(t * 1.7 + x * .01) * 5 * w];
  },
  jeong: (x, y, t, w, m) => {
    const lean = (Math.sin(t * 1.1) * .5 + .5) * 13 * clamp((m.h * .75 - y) / (m.h * .75), 0, 1);
    const s = x < m.hc[0] ? 1 : -1, b = 1 + Math.sin(t * 1.6) * .007;
    return [x - s * lean, m.h * .95 + (y - m.h * .95) / b];
  },
  nunchi: (x, y, t) => [x, y + Math.sin(t * 2.2 + Math.floor(x / 150) * 1.7) * 4],
  dapdap: (x, y, t, w, m) => {
    const k = 1 + .38 * beat(t) * w, sq = 1 + .014 * (Math.sin(t * .9) * .5 + .5);
    const cx = m.w / 2 + (x - m.w / 2) * sq;
    return [m.hc[0] + (cx - m.hc[0]) / k, m.hc[1] + (y - m.hc[1]) / k];
  },
  aswip: (x, y, t, w, m) => {
    const px = m.hb.x0 + (m.hb.x1 - m.hb.x0) * .12, py = m.hb.y1 - (m.hb.y1 - m.hb.y0) * .08;
    const a = -.3 * Math.sin(t * 3.4) * w, c = Math.cos(a), s = Math.sin(a), dx = x - px, dy = y - py;
    return [px + dx * c - dy * s, py + dx * s + dy * c];
  },
};
const HOLE_ON = { nunchi: (x, y, t) => ((x * .016 - t * .9) % 1 + 1) % 1 < .62 };

function load(key) {
  return new Promise(res => {
    const im = new Image();
    im.onload = () => {
      const w = im.width, h = im.height, c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0);
      const d = x.getImageData(0, 0, w, h).data;
      const LW = 120, LH = Math.round(h / w * LW), f = new Float32Array(LW * LH);
      let x0 = w, y0 = h, x1 = 0, y1 = 0, sx = 0, sy = 0, n = 0;
      for (let j = 0; j < h; j += 2) for (let i = 0; i < w; i += 2) if (d[(j * w + i) * 4 + 1] > 110) {
        x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j); sx += i; sy += j; n++;
        f[Math.floor(j / h * LH) * LW + Math.floor(i / w * LW)] = 1;
      }
      const tmp = new Float32Array(f.length), R = 4;
      for (let pass = 0; pass < 2; pass++) {
        for (let j = 0; j < LH; j++) for (let i = 0; i < LW; i++) { let a = 0; for (let k = -R; k <= R; k++) a += f[j * LW + clamp(i + k, 0, LW - 1)]; tmp[j * LW + i] = a / (2 * R + 1); }
        for (let j = 0; j < LH; j++) for (let i = 0; i < LW; i++) { let a = 0; for (let k = -R; k <= R; k++) a += tmp[clamp(j + k, 0, LH - 1) * LW + i]; f[j * LW + i] = a / (2 * R + 1); }
      }
      for (let i = 0; i < f.length; i++) f[i] = Math.min(1, f[i] * 2.2);
      maps[key] = { w, h, d, f, LW, LH, hb: { x0, y0, x1, y1 }, hc: [sx / n, sy / n] };
      res();
    };
    im.src = `map-${key}.png`;
  });
}

function build() {
  const S = SCENES[cur], m = maps[S.key];
  const capTop = $('cap').getBoundingClientRect().top;
  const top = 52, bot = capTop - 14, aw = W - 24, ah = Math.max(120, bot - top);
  const k = Math.min(aw / m.w, ah / m.h), iw = m.w * k, ih = m.h * k;
  const ch = clamp(Math.max(ih, iw * .55) / 78, W < 640 ? 5 : 7, 11), cw = ch * .6;
  const cols = Math.floor(iw / cw), rows = Math.floor(ih / ch);
  const ox = (W - cols * cw) / 2, oy = top + (ah - rows * ch) / 2;
  const holes = [];
  let hx = 0, hy = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c += 2) {
    const px = Math.floor((c + .5) / cols * m.w), py = Math.floor((r + .5) / rows * m.h);
    if (m.d[(py * m.w + px) * 4 + 1] > 110) { const p = [ox + (c + 1) * cw, oy + r * ch]; holes.push(p); hx += p[0]; hy += p[1]; }
  }
  const n = holes.length || 1;
  G = { m, S, ch, cw, cols, rows, ox, oy, holes, hc: [hx / n, hy / n], D: new Float32Array(cols * rows), stream: S.en.join('  ·  ') + '  ·  ', kr: S.word + ' ' };
}

function enter(i) {
  cur = (i + SCENES.length) % SCENES.length;
  const S = SCENES[cur];
  $('word').textContent = S.word; $('pron').textContent = S.pron; $('pos').textContent = S.pos;
  $('en').textContent = S.en.join('; '); $('hole').textContent = S.hole; $('ex').textContent = S.ex; $('ex').classList.remove('on');
  $('idx').textContent = `${cur + 1} / ${SCENES.length}`;
  history.replaceState(null, '', '#' + (cur + 1));
  press.R = 0; t = 0;
  build();
}

function go(i) { if (!fdir) { want = i; fdir = -1; } }

function resize() {
  DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  cv.width = W * DPR; cv.height = H * DPR;
  if (maps[SCENES[cur].key]) build();
}

function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  requestAnimationFrame(frame);
  if (!G) return;
  t += dt;
  if (fdir) {
    fade = clamp(fade + fdir * dt / .3, 0, 1);
    if (fade === 0 && fdir < 0) { enter(want); fdir = 1; } else if (fade === 1) fdir = 0;
  }
  press.R = press.on ? Math.min(press.max, press.R + dt * (G.ch * 34 + press.R * 1.4)) : Math.max(0, press.R - dt * Math.max(press.max, 1) * 2.5);

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#161616'; ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'top'; ctx.textAlign = 'center';

  const { m, cols, rows, ox, oy, cw, ch, D, stream, kr } = G, L = stream.length, intro = t / 1.6, flow = Math.floor(t * 4), tick = Math.floor(t * 10);
  const warp = WARP[G.S.key], holeOn = HOLE_ON[G.S.key];
  const hot = [], blank = [];
  let shown = 0, nh = 0;
  ctx.font = `400 ${ch * 1.02}px ${MONO}`; ctx.fillStyle = '#ecebe6';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const s = intro * rows - r - c / cols * 6;
    if (s <= 0) continue;
    const x = (c + .5) / cols * m.w, y = (r + .5) / rows * m.h;
    const w = m.f[Math.floor(y / m.h * m.LH) * m.LW + Math.floor(x / m.w * m.LW)];
    const [sx, sy] = warp(x, y, t, w, m);
    const px = Math.floor(sx), py = Math.floor(sy);
    if (px < 0 || py < 0 || px >= m.w || py >= m.h) continue;
    const i = (py * m.w + px) * 4, lum = m.d[i], idx = r * cols + c;
    if (m.d[i + 1] > 110) {
      if (holeOn && !holeOn(x, y, t)) continue;
      if ((c & 1) === 0) {
        const X = ox + (c + 1) * cw, Y = oy + r * ch, v = smooth((press.R - Math.hypot(X - press.x, Y - press.y)) / (ch * 6));
        D[idx] += (v - D[idx]) * (1 - Math.exp(-10 * dt));
        nh++; shown += D[idx];
        if (D[idx] > .02) hot.push(X, Y, D[idx], kr[(r * 3 + (c >> 1)) % kr.length]);
        if (D[idx] < .98) blank.push(X - cw / 2, Y, X + cw / 2, Y, (1 - D[idx]) * smooth(s));
      }
      continue;
    }
    if (lum <= 46) continue;
    const k = idx, hsh = Math.sin(k * 12.9898 + tick * 78.233) * 43758.5453 % 1;
    let chr = stream[(k + flow) % L];
    if (Math.abs(hsh) < .015) chr = 'abcdefghijklmnopqrstuvwxyz·'[Math.floor(Math.abs(hsh) * 1800) % 27];
    if (chr === ' ') continue;
    ctx.globalAlpha = (.3 + .7 * Math.pow(lum / 255, 1.3)) * smooth(s);
    ctx.fillText(chr, ox + c * cw + cw / 2, oy + r * ch);
  }
  for (let i = 0; i < D.length; i++) if (D[i] > 0 && press.R === 0) D[i] *= Math.exp(-6 * dt);
  ctx.fillStyle = HOT;
  for (let i = 0; i < blank.length; i += 5) {
    ctx.globalAlpha = .55 * blank[i + 4];
    ctx.fillText('_', blank[i], blank[i + 1]); ctx.fillText('_', blank[i + 2], blank[i + 3]);
  }
  ctx.font = `700 ${ch * 1.08}px ${KR}`;
  for (let i = 0; i < hot.length; i += 4) { ctx.globalAlpha = hot[i + 2]; ctx.fillText(hot[i + 3], hot[i], hot[i + 1] + (1 - hot[i + 2]) * ch * .6); }
  ctx.globalAlpha = 1;
  $('ex').classList.toggle('on', shown / Math.max(1, nh) > .55);

  if (fade < 1) { ctx.globalAlpha = 1 - fade; ctx.fillStyle = '#161616'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}

function reach() {
  let m = 0;
  for (const [x, y] of G.holes) m = Math.max(m, Math.hypot(x - press.x, y - press.y));
  return m + G.ch * 12;
}

function nearestHole(x, y) {
  let best = null, bd = Infinity;
  for (const p of G.holes) { const d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; best = p; } }
  return best ? [best[0], best[1]] : [x, y];
}

cv.addEventListener('pointerdown', e => {
  if (!G) return;
  cv.setPointerCapture(e.pointerId);
  [press.x, press.y] = nearestHole(e.clientX, e.clientY);
  press.max = reach(); press.on = true;
  press.sx = e.clientX; press.st = performance.now();
});
const up = e => {
  if (!press.on) return;
  press.on = false;
  const dx = e.clientX - press.sx;
  if (e.pointerType === 'touch' && Math.abs(dx) > 80 && performance.now() - press.st < 400) go(cur + (dx < 0 ? 1 : -1));
};
cv.addEventListener('pointerup', up);
cv.addEventListener('pointercancel', up);
$('prev').onclick = () => go(cur - 1);
$('next').onclick = () => go(cur + 1);
addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') go(cur + 1);
  if (e.key === 'ArrowLeft') go(cur - 1);
  if (e.key === ' ' && !press.on && G) { [press.x, press.y] = G.hc; press.max = reach(); press.on = true; e.preventDefault(); }
});
addEventListener('keyup', e => { if (e.key === ' ') press.on = false; });
addEventListener('resize', resize);

const fonts = Promise.all([document.fonts.load(`400 12px ${MONO}`, 'a'), document.fonts.load(`700 12px ${KR}`, '시원하다정눈치답아쉽')]);
Promise.all([...SCENES.map(s => load(s.key)), Promise.race([fonts, new Promise(r => setTimeout(r, 3000))])]).then(() => {
  resize();
  enter(clamp((parseInt(location.hash.slice(1)) || 1) - 1, 0, SCENES.length - 1));
  fade = 0; fdir = 1;
});
requestAnimationFrame(frame);

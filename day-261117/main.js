const VER = 8;
const SCENES = [
  { key: 'siwon', word: '시원하다', pron: 'si·won·ha·da', pos: 'adj.', hole: '국밥 위로 오르는 뜨거운 김', en: ['cool', 'refreshing', 'relieved', 'satisfying', 'clear'], ex: '뜨거운 국물을 들이켜고, “아, 시원하다.”' },
  { key: 'jeong', word: '정', pron: 'jeong', pos: 'n.', hole: '그릇 위로 수북이 더 퍼 준 밥', en: ['affection', 'attachment', 'bond', 'warmth', 'love'], ex: '“더 먹어, 더.”' },
  { key: 'nunchi', word: '눈치', pron: 'nun·chi', pos: 'n.', hole: '상 위로 오가는 시선', en: ['tact', 'sense', 'awareness', 'social cue', 'reading the room'], ex: '말 안 해도 눈치로 알지.' },
  { key: 'dapdap', fill: true, word: '답답하다', pron: 'dap·dap·a·da', pos: 'adj.', hole: '손을 얹은 가슴', en: ['stuffy', 'frustrated', 'suffocating', 'stifled', 'heavy'], ex: '말이 안 통해서 답답해.' },
  { key: 'jjan', word: '짠하다', pron: 'jjan·ha·da', pos: 'adj.', hole: '막차 창가에 꾸벅 떨군 머리', en: ['pitiful', 'touching', 'poignant', 'sorry for', 'heartrending'], ex: '얼마나 피곤했으면… 짠하다.' },
  { key: 'meong', word: '멍때리다', pron: 'meong·ttae·ri·da', pos: 'v.', hole: '불 앞에 앉은 사람의 머릿속', en: ['zone out', 'space out', 'daydream', 'stare blankly', 'blank'], ex: '아무 생각 없이 불만 봤어.' },
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
    const { k, lift } = gob(t), H0 = m.hb.y1 - m.hb.y0;
    const sh = -(H0 * (k - 1) + lift) * clamp((640 - x) / 340, 0, 1);
    if (y < 320 && x > 240) { const qy = y - sh; if (isArm(m, x, qy)) return [x, qy]; }
    let sy = y;
    if (x > m.hb.x0 - 20 && x < m.hb.x1 + 20 && y < m.hb.y1) sy = m.hb.y1 + (y - m.hb.y1) / k;
    if (isArm(m, x, sy)) sy += 45;
    return [x, sy];
  },
  nunchi: (x, y, t) => [x, y + Math.sin(t * 2.2 + Math.floor(x / 150) * 1.7) * 4],
  dapdap: (x, y, t, w, m) => {
    const k = 1 + .38 * beat(t) * w, sq = 1 + .014 * (Math.sin(t * .9) * .5 + .5);
    const cx = m.w / 2 + (x - m.w / 2) * sq;
    return [m.hc[0] + (cx - m.hc[0]) / k, m.hc[1] + (y - m.hc[1]) / k];
  },
  jjan: (x, y, t, w, m) => {
    const px = m.hb.x0 + (m.hb.x1 - m.hb.x0) * .65, py = m.hb.y1, p = t % 3.6;
    const nod = p < 2.8 ? smooth(p / 2.8) : 1 - smooth((p - 2.8) / .25);
    const a = -.35 * nod * w, c = Math.cos(a), s = Math.sin(a), dx = x - px, dy = y - py;
    return [px + dx * c - dy * s, py + dx * s + dy * c];
  },
  meong: (x, y, t, w, m) => {
    const px = (m.hb.x0 + m.hb.x1) / 2, py = m.hb.y1, a = Math.sin(t * .7) * .06 * w, c = Math.cos(a), s = Math.sin(a), dx = x - px, dy = y - py;
    let X = px + dx * c - dy * s, Y = py + dx * s + dy * c;
    if (x > m.w * .66 && y > m.h * .38 && y < m.h * .93) {
      const up = clamp((m.h * .93 - y) / (m.h * .5), 0, 1);
      X += Math.sin(y * .06 + t * 9) * 7 * up + Math.sin(y * .13 - t * 13) * 3 * up;
      Y += (Math.sin(t * 11 + x * .05) * .5 + .5) * 9 * up;
    }
    return [X, Y];
  },
};
const gob = t => {
  const s = t % 6.8;
  if (s < 5.6) { const i = Math.floor(s / 1.4), f = (s % 1.4) / 1.4; return { k: 1 + .085 * (i + smooth((f - .45) / .25)), lift: Math.sin(f * Math.PI) * 30 }; }
  const f = (s - 5.6) / 1.2;
  return { k: 1 + .34 * (1 - smooth(f)), lift: -Math.sin(f * Math.PI) * 10 };
};
const isArm = (m, x, y) => {
  if (y >= 320 || x <= 240 || x >= m.w || y < 0) return false;
  const i = (Math.floor(y) * m.w + Math.floor(x)) * 4;
  return m.d[i] > 46 && m.d[i + 1] <= 110;
};
const segD = (x, y, a, b) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], u = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy), 0, 1);
  return Math.hypot(x - a[0] - dx * u, y - a[1] - dy * u);
};
const SPOON = { a: [572, 205], b: [692, 84] };
const lift = t => { const p = t % 5.2; return p < 1.4 ? 0 : p < 2.4 ? smooth(p - 1.4) : p < 3.3 ? 1 : p < 4.3 ? 1 - smooth(p - 3.3) : 0; };
const OVER = {
  siwon: (x, y, t, m) => {
    const L = lift(t);
    if (L < .01) return -1;
    const { a, b } = SPOON, len = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / len, uy = (b[1] - a[1]) / len;
    const a2 = [a[0] + 16 * L, a[1] - 62 * L], b2 = [b[0] + 16 * L, b[1] - 62 * L];
    if (segD(x, y, a2, b2) < 5) return 225;
    const hx = a2[0] - ux * 24, hy = a2[1] - uy * 24, al = (x - hx) * ux + (y - hy) * uy, pe = (x - hx) * -uy + (y - hy) * ux;
    const e = (al / 30) ** 2 + (pe / 19) ** 2;
    if (e < 1) return e < .5 ? 255 : 215;
    if (L > .6) for (let k = 0; k < 3; k++) {
      const ph = (t * 1.4 + k / 3) % 1, dx = x - (hx + (k - 1) * 9), dy = y - (hy + 14 + ph * 55 * L);
      if (dx * dx + dy * dy < 20) return 235;
    }
    if (segD(x, y, a, b) < 8) {
      const qx = Math.floor(x - uy * 16), qy = Math.floor(y + ux * 16);
      return qx >= 0 && qy >= 0 && qx < m.w && qy < m.h ? m.d[(qy * m.w + qx) * 4] : 0;
    }
    return -1;
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
    im.src = `map-${key}.png?v=${VER}`;
  });
}

function build() {
  const S = SCENES[cur], m = maps[S.key];
  const capTop = $('cap').getBoundingClientRect().top;
  const top = 52, bot = capTop - 14, aw = W - 24, ah = Math.max(120, bot - top);
  const k = Math.min(aw / m.w, ah / m.h) * (S.fill ? .7 : 1), iw = m.w * k, ih = m.h * k;
  const ch = clamp(Math.max(ih, iw * .55) / 78, W < 640 ? 5 : 7, 11), cw = ch * .6;
  const ix = (W - iw) / 2, iy = top + (ah - ih) / 2;
  const cols = Math.floor((S.fill ? aw : iw) / cw), rows = Math.floor((S.fill ? ah : ih) / ch);
  const ox = (W - cols * cw) / 2, oy = top + ((S.fill ? ah : ih) - rows * ch) / 2 + (S.fill ? 0 : iy - top);
  const holes = [];
  let hx = 0, hy = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c += 2) {
    const px = Math.floor((ox + (c + .5) * cw - ix) / k), py = Math.floor((oy + (r + .5) * ch - iy) / k);
    if (px >= 0 && py >= 0 && px < m.w && py < m.h && m.d[(py * m.w + px) * 4 + 1] > 110) { const p = [ox + (c + 1) * cw, oy + r * ch]; holes.push(p); hx += p[0]; hy += p[1]; }
  }
  const n = holes.length || 1;
  G = { m, S, ch, cw, cols, rows, ox, oy, ix, iy, k, iw, ih, st: [12, top, W - 12, top + ah], holes, hc: [hx / n, hy / n], D: new Float32Array(cols * rows), stream: S.en.join('  ·  ') + '  ·  ', kr: S.word + ' ' };
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

  const { m, cols, rows, ox, oy, ix, iy, k: K, cw, ch, D, stream, kr } = G, fill = G.S.fill, L = stream.length, intro = t / 1.6, flow = Math.floor(t * 4), tick = Math.floor(t * 10);
  const warp = WARP[G.S.key], holeOn = HOLE_ON[G.S.key], over = OVER[G.S.key];
  const hot = [], blank = [];
  let shown = 0, nh = 0;
  ctx.font = `400 ${ch * 1.02}px ${MONO}`; ctx.fillStyle = '#ecebe6';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const s = intro * rows - r - c / cols * 6;
    if (s <= 0) continue;
    const x = (ox + (c + .5) * cw - ix) / K, y = (oy + (r + .5) * ch - iy) / K;
    const inside = x >= 0 && y >= 0 && x < m.w && y < m.h;
    const w = inside ? m.f[Math.floor(y / m.h * m.LH) * m.LW + Math.floor(x / m.w * m.LW)] : 0;
    const ov = over ? over(x, y, t, m) : -1;
    const [sx, sy] = ov >= 0 ? [x, y] : warp(x, y, t, w, m);
    const px = Math.floor(sx), py = Math.floor(sy), idx = r * cols + c;
    const out = px < 0 || py < 0 || px >= m.w || py >= m.h;
    if (out && !fill && ov < 0) continue;
    const i = (py * m.w + px) * 4, edge = fill && !out && m.d[i] <= 46 && (px < m.w * .1 || px > m.w * .9 || py < m.h * .08 || py > m.h * .9);
    const lum = ov >= 0 ? ov : out || edge ? persp(ox + (c + .5) * cw, oy + (r + .5) * ch) : m.d[i];
    if (ov < 0 && !out && m.d[i + 1] > 110) {
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
    if (chr === ' ' || chr === '·') { if (ov < 0) { if (chr === ' ') continue; } else chr = 'o'; }
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

function persp(X, Y) {
  const { ix, iy, iw, ih, st } = G, cx = ix + iw / 2, cy = iy + ih / 2, dx = X - cx, dy = Y - cy;
  const tx = (Math.abs(dx) - iw / 2) / ((dx < 0 ? cx - st[0] : st[2] - cx) - iw / 2);
  const ty = (Math.abs(dy) - ih / 2) / ((dy < 0 ? cy - st[1] : st[3] - cy) - ih / 2);
  const side = tx > ty, tt = Math.max(tx, ty);
  const base = side ? 160 : dy < 0 ? 240 : 85;
  return base * (.3 + .7 * clamp(tt, 0, 1));
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

const fonts = Promise.all([document.fonts.load(`400 12px ${MONO}`, 'a'), document.fonts.load(`700 12px ${KR}`, '시원하다정눈치답짠멍때리')]);
Promise.all([...SCENES.map(s => load(s.key)), Promise.race([fonts, new Promise(r => setTimeout(r, 3000))])]).then(() => {
  resize();
  enter(clamp((parseInt(location.hash.slice(1)) || 1) - 1, 0, SCENES.length - 1));
  fade = 0; fdir = 1;
});
requestAnimationFrame(frame);

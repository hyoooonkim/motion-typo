const SCENES = [
  { key: 'siwon', word: '시원하다', roman: 'siwonhada · adj.', en: ['cool', 'refreshing', 'relieved', 'satisfying', 'clear'], note: '영어 다섯 단어로 다 그려도, 뜨거운 김은 비어 있어요.', ex: '뜨거운 국물을 들이켜고, “아, 시원하다.”' },
  { key: 'jeong', word: '정', roman: 'jeong · n.', en: ['affection', 'attachment', 'bond', 'warmth', 'love'], note: '두 사람은 그려지는데, 둘 사이는 채워지지 않아요.', ex: '미운 정도 정이다.' },
  { key: 'nunchi', word: '눈치', roman: 'nunchi · n.', en: ['tact', 'sense', 'awareness', 'social cue', 'reading the room'], note: '사람도 상도 그려지는데, 오가는 시선은 비어 있어요.', ex: '말 안 해도 눈치로 알지.' },
  { key: 'dapdap', word: '답답하다', roman: 'dapdapada · adj.', en: ['stuffy', 'frustrated', 'suffocating', 'stifled', 'heavy'], note: '좁은 방은 그려지는데, 가슴은 비어 있어요.', ex: '말이 안 통해서 답답해.' },
  { key: 'aswip', word: '아쉽다', roman: 'aswipda · adj.', en: ['pity', 'regret', 'miss', 'too bad', 'wish'], note: '떠나는 뒷모습은 그려지는데, 흔드는 손은 비어 있어요.', ex: '벌써 가? 아쉽다.' },
];

const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const MONO = '"IBM Plex Mono", monospace', KR = '"Noto Sans KR", sans-serif';
const HOT = '#ff6a3d';

let W = 0, H = 0, DPR = 1, cur = 0, G = null, t = 0, last = performance.now();
let fade = 0, fdir = 1, want = 0;
const press = { on: false, x: 0, y: 0, R: 0 };
const maps = {};

function load(key) {
  return new Promise(res => {
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0);
      maps[key] = { w: im.width, h: im.height, d: x.getImageData(0, 0, im.width, im.height).data };
      res();
    };
    im.src = `map-${key}.png`;
  });
}

function build() {
  const S = SCENES[cur], m = maps[S.key];
  const capTop = $('cap').getBoundingClientRect().top;
  const top = 44, bot = capTop - 14, aw = W - 24, ah = Math.max(120, bot - top);
  const k = Math.min(aw / m.w, ah / m.h), iw = m.w * k, ih = m.h * k;
  const ch = clamp(Math.max(ih, iw * .55) / 78, W < 640 ? 5 : 7, 11), cw = ch * .6;
  const cols = Math.floor(iw / cw), rows = Math.floor(ih / ch);
  const ox = (W - cols * cw) / 2, oy = top + (ah - rows * ch) / 2;
  const stream = (S.en.join('  ·  ') + '  ·  ');
  const kr = S.word + ' ';
  const en = [], hole = [];
  let ei = 0, ki = 0, hx = 0, hy = 0;
  for (let r = 0; r < rows; r++) {
    let run = 0;
    for (let c = 0; c < cols; c++) {
      const px = Math.floor((c + .5) / cols * m.w), py = Math.floor((r + .5) / rows * m.h), i = (py * m.w + px) * 4;
      const lum = m.d[i], hl = m.d[i + 1];
      const x = ox + c * cw, y = oy + r * ch;
      if (hl > 110) {
        if (run % 2 === 0) { hole.push({ x: x + cw, y, ch: kr[ki % kr.length], r, c }); ki++; hx += x; hy += y; }
        run++;
        continue;
      }
      run = 0;
      if (lum > 46) { en.push({ x: x + cw / 2, y, k: ei++, a: .3 + .7 * Math.pow(lum / 255, 1.3), r, c }); }
      else ei++;
    }
    if (run) ki = Math.ceil(ki / kr.length) * kr.length;
  }
  const n = hole.length || 1;
  G = { ch, cw, en, hole, stream, rows, cols, hc: [hx / n, hy / n], maxR: Math.hypot(W, H) * .5 };
  for (const h of hole) h.d = 0;
}

function enter(i) {
  cur = (i + SCENES.length) % SCENES.length;
  const S = SCENES[cur];
  $('word').textContent = S.word; $('roman').textContent = S.roman;
  $('en').textContent = S.en.join(' · '); $('note').textContent = S.note; $('ex').textContent = S.ex; $('ex').classList.remove('on');
  $('idx').textContent = `${String(cur + 1).padStart(2, '0')} / ${String(SCENES.length).padStart(2, '0')}`;
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
  press.R = press.on ? press.R + dt * (G.ch * 34 + press.R * 1.4) : Math.max(0, press.R - dt * G.maxR * 1.2);

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#161616'; ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'top'; ctx.textAlign = 'center';

  const intro = t / 1.6, total = G.rows, flow = Math.floor(t * 4), L = G.stream.length;
  ctx.font = `400 ${G.ch * 1.02}px ${MONO}`; ctx.fillStyle = '#ecebe6';
  for (const e of G.en) {
    const s = intro * total - e.r - e.c / G.cols * 6;
    if (s <= 0) continue;
    const chr = G.stream[(e.k + flow) % L];
    if (chr === ' ') continue;
    ctx.globalAlpha = e.a * smooth(s);
    ctx.fillText(chr, e.x, e.y);
  }

  let shown = 0;
  ctx.font = `700 ${G.ch * 1.08}px ${KR}`; ctx.fillStyle = HOT;
  for (const h of G.hole) {
    const d = Math.hypot(h.x - press.x, h.y - press.y), v = smooth((press.R - d) / (G.ch * 6));
    h.d += (v - h.d) * (1 - Math.exp(-10 * dt));
    if (h.d < .02) continue;
    shown += h.d;
    ctx.globalAlpha = h.d;
    ctx.fillText(h.ch, h.x, h.y + (1 - h.d) * G.ch * .6);
  }
  ctx.globalAlpha = 1;
  $('ex').classList.toggle('on', shown / Math.max(1, G.hole.length) > .55);

  if (fade < 1) { ctx.globalAlpha = 1 - fade; ctx.fillStyle = '#161616'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}

function nearestHole(x, y) {
  let best = null, bd = Infinity;
  for (const h of G.hole) { const d = Math.hypot(h.x - x, h.y - y); if (d < bd) { bd = d; best = h; } }
  return best ? [best.x, best.y] : [x, y];
}

cv.addEventListener('pointerdown', e => {
  if (!G) return;
  cv.setPointerCapture(e.pointerId);
  [press.x, press.y] = nearestHole(e.clientX, e.clientY);
  press.on = true; press.R = Math.max(press.R, 0);
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
  if (e.key === ' ' && !press.on && G) { [press.x, press.y] = G.hc; press.on = true; e.preventDefault(); }
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

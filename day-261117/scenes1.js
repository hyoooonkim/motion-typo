export const TAU = Math.PI * 2;
export const rnd = (a, b) => a + Math.random() * (b - a);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const FR = w => s => `${w} ${s}px Fraunces, Georgia, serif`;
export function spr(l, tx, ty, k, d, dt) {
  l.vx += (tx - l.x) * k * dt; l.vy += (ty - l.y) * k * dt;
  const f = Math.exp(-d * dt); l.vx *= f; l.vy *= f; l.x += l.vx * dt; l.y += l.vy * dt;
}
const JP = s => `700 ${s}px "Noto Serif JP", "Noto Serif KR", serif`;

const komorebi = {
  word: '木漏れ日', roman: 'komorebi', lang: '일본어', cand: '햇살', gloss: '나뭇잎 사이로 새어 들어와 흔들리는 햇살', hint: '움직이면 바람이 불어요',
  bg: '#15211a', ink: '#ead9a6', font: JP, lay: { maxH: .5, maxW: .78 },
  init(E) {
    const { W, H, st, L, size } = E;
    st.wind = 0; st.tm = 0;
    st.spots = Array.from({ length: 70 }, (_, i) => ({
      x: rnd(-.05, 1.05) * W, y: i < 40 ? L[0].hy + rnd(-.6, .6) * size : rnd(0, H),
      r: rnd(.05, .17) * size + 8, ph: rnd(0, TAU), sp: rnd(.5, 1.4), ax: rnd(14, 44), e: rnd(.6, 1),
    }));
    const mk = () => { const c = document.createElement('canvas'); c.width = W * E.DPR; c.height = H * E.DPR; return c; };
    st.lc = mk(); st.lx = st.lc.getContext('2d'); st.mc = mk(); st.mx = st.mc.getContext('2d');
  },
  step(E, dt) {
    const { st, P } = E;
    st.wind = lerp(st.wind, clamp(P.speed / 700, 0, 3), 1 - Math.exp(-3 * dt));
    st.tm += dt * (.35 + st.wind * 1.4);
    E.L.forEach((l, i) => { l.r = Math.sin(E.t * 1.1 + i * 1.7) * .012 * (1 + st.wind * 2); });
  },
  draw(E) {
    const { ctx, st, W, H } = E;
    const pos = s => [s.x + Math.sin(st.tm * s.sp + s.ph) * s.ax * (1 + st.wind * .6), s.y + Math.cos(st.tm * s.sp * .7 + s.ph) * s.ax * .5];
    const spot = (c, s, k, a) => {
      const [x, y] = pos(s), r = s.r * k * (1 + .18 * Math.sin(st.tm * 2.2 + s.ph));
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255,222,140,${a * s.e})`); g.addColorStop(.55, `rgba(255,222,140,${a * s.e * .6})`); g.addColorStop(1, 'rgba(255,222,140,0)');
      c.fillStyle = g; c.beginPath(); c.ellipse(x, y, r * 1.2, r, s.ph, 0, TAU); c.fill();
    };
    for (const s of st.spots) spot(ctx, s, 1.5, .11);
    E.drawL('#2b3d2a');
    const { lx, mx } = st;
    mx.setTransform(E.DPR, 0, 0, E.DPR, 0, 0); mx.clearRect(0, 0, W, H);
    for (const s of st.spots) spot(mx, s, 1.1, 1);
    lx.setTransform(E.DPR, 0, 0, E.DPR, 0, 0); lx.globalCompositeOperation = 'source-over'; lx.clearRect(0, 0, W, H);
    E.drawL('#ffe6a8', E.L, E.S.font, E.size, lx);
    lx.setTransform(1, 0, 0, 1, 0, 0); lx.globalCompositeOperation = 'destination-in'; lx.drawImage(st.mc, 0, 0);
    ctx.drawImage(st.lc, 0, 0, W, H);
  },
};

const BOOK = ['#c4572e', '#2f5d7c', '#d9a441', '#4f7a4a', '#7b3f5e', '#e8dcc6', '#3b3b48', '#b98b5a', '#8fb3b8'];
const tsundoku = {
  word: '積ん読', roman: 'tsundoku', lang: '일본어', cand: '독서', gloss: '책을 사 놓고 읽지 않은 채 쌓아 두는 일', hint: '탭하면 책을 또 사요',
  bg: '#efe6d6', ink: '#2a221b', font: JP, lay: { maxH: .26, maxW: .5, cy: .2 },
  init(E) {
    const { st } = E;
    st.floor = E.top + E.SH - 26; st.lean = 0; st.lv = 0; st.fall = 0; st.books = []; st.bought = 0;
    st.max = st.floor - E.top - E.size * 1.2;
    for (let i = 0; i < 4; i++) this.add(E, false);
    E.L.forEach(l => { l.x = l.hx; l.y = -E.size * (1 + l.i * .6); l.vx = l.vy = 0; l.r = 0; });
  },
  height(E) { return E.st.books.reduce((a, b) => a + b.h, 0); },
  add(E, drop) {
    const { st } = E, tb = this.height(E), h = rnd(.1, .16) * E.size;
    st.books.push({ h, w: E.tw * rnd(.72, 1.05), off: rnd(-.07, .07) * E.tw, col: BOOK[Math.floor(rnd(0, BOOK.length))], tb, yb: drop ? tb + E.H : tb, vy: 0, band: rnd(.08, .16) });
    st.bought++;
  },
  down(E) { if (!E.st.fall) this.add(E, true); },
  step(E, dt) {
    const { st, P, W, size } = E;
    if (st.fall > 0) {
      st.fall -= dt;
      for (const o of [...st.books, ...E.L]) {
        o.vy += 2200 * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.r += o.vr * dt;
        const g = st.floor - (o.h ? o.h / 2 : size * .4);
        if (o.y > g) { o.y = g; o.vy *= -.25; o.vx *= .7; o.vr *= .6; }
      }
      if (st.fall <= 0) { st.books = []; st.bought = 0; this.init(E); }
      return;
    }
    const lt = P.inside ? clamp((P.x - W / 2) / W, -.5, .5) * .16 : 0;
    st.lv += (lt - st.lean) * 30 * dt; st.lv *= Math.exp(-2.5 * dt); st.lean += st.lv * dt;
    let landed = true;
    for (const b of st.books) {
      if (b.yb > b.tb || b.vy > 0) {
        landed = false; b.vy -= 3200 * dt; b.yb += b.vy * dt;
        if (b.yb <= b.tb) { b.yb = b.tb; if (b.vy < -350) { b.vy = -b.vy * .18; st.lv += rnd(-1, 1) * .5; } else b.vy = 0; }
      }
    }
    const sh = this.height(E);
    E.L.forEach(l => {
      const ty = st.floor - sh - size * .56, tx = l.hx + (sh + size * .5) * st.lean;
      spr(l, tx, ty, 140, 12, dt); l.r = st.lean;
    });
    if (landed && sh > st.max) {
      st.fall = 2;
      const dir = Math.sign(st.lean) || 1;
      for (const b of st.books) {
        b.x = W / 2 + b.off + (b.yb + b.h / 2) * st.lean; b.y = st.floor - b.yb - b.h / 2; b.r = st.lean;
        b.vx = dir * rnd(60, 420) * (.3 + b.yb / sh); b.vy = rnd(-300, -40); b.vr = dir * rnd(.5, 3);
      }
      E.L.forEach(l => { l.vx = dir * rnd(200, 600); l.vy = rnd(-500, -200); l.vr = dir * rnd(2, 6); });
    }
  },
  draw(E) {
    const { ctx, st, W, size } = E;
    ctx.fillStyle = 'rgba(60,40,20,.12)';
    ctx.beginPath(); ctx.ellipse(W / 2, st.floor + 3, E.tw * .62, 7, 0, 0, TAU); ctx.fill();
    for (const b of st.books) {
      ctx.save();
      if (st.fall > 0) { ctx.translate(b.x, b.y); ctx.rotate(b.r); }
      else { ctx.translate(W / 2 + b.off + (b.yb + b.h / 2) * st.lean, st.floor - b.yb - b.h / 2); ctx.rotate(st.lean); }
      const w = b.w, h = b.h;
      ctx.fillStyle = b.col; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 3); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(-w / 2, h / 2 - 2.5, w, 2.5);
      ctx.fillStyle = 'rgba(255,255,255,.32)';
      ctx.fillRect(-w / 2 + w * b.band, -h / 2, 2.5, h); ctx.fillRect(w / 2 - w * b.band, -h / 2, 2.5, h);
      ctx.fillStyle = 'rgba(255,250,235,.55)'; ctx.fillRect(-w * .16, -h * .2, w * .32, h * .4);
      ctx.restore();
    }
    E.drawL(E.S.ink);
    ctx.fillStyle = 'rgba(42,34,27,.5)'; ctx.font = '12px "Noto Serif KR", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(st.fall > 0 ? '와르르…' : `쌓인 책 ${st.books.length}권 · 읽은 책 0권`, W / 2, st.floor + 14);
  },
};

const wald = {
  word: 'Waldeinsamkeit', roman: '발트아인잠카이트', lang: '독일어', cand: '고독', gloss: '숲속에 홀로 있을 때 느끼는 고요하고 평온한 외로움', hint: '움직이면 나무들이 길을 비켜 줘요',
  bg: '#dde3d8', ink: '#22332a', font: FR(500), lay: { maxW: .9, maxH: .15, cy: .5 },
  init(E) {
    const { st, W, L } = E;
    st.px = W / 2;
    st.trees = Array.from({ length: 90 }, () => ({ ch: L[Math.floor(rnd(0, L.length))].ch, x: rnd(-.1, 1.1) * W, d: rnd(.1, 1), ph: rnd(0, TAU) })).sort((a, b) => a.d - b.d);
    L.forEach(l => { l.sy = 2.4; });
  },
  step(E, dt) {
    const { st, P, size, W } = E;
    st.px = lerp(st.px, P.inside ? P.x : W / 2, 1 - Math.exp(-2 * dt));
    const R = Math.max(size * 5, W * .3), G = Math.min(size * 1.6, R * .26);
    E.L.forEach(l => {
      const dx = l.hx - P.x, near = P.inside && Math.abs(P.y - l.hy) < size * 2.4;
      const push = near ? Math.sign(dx || 1) * G * Math.exp(-Math.abs(dx) / R) : 0;
      spr(l, l.hx + push, l.hy, 80, 10, dt);
      l.r = (l.x - l.hx) / R * .1 + Math.sin(E.t * .7 + l.i) * .01;
    });
  },
  draw(E) {
    const { ctx, st, W, H, size, L, P } = E, base = L[0].hy, ground = base + size * .86;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#eef1ea'); g.addColorStop(.6, '#d6ddd2'); g.addColorStop(1, '#c9d1c4');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    for (const t of st.trees) {
      const s = size * (.25 + t.d * .5), x = t.x + (W / 2 - st.px) * t.d * .08, y = ground - (1 - t.d) * size * .9;
      ctx.font = FR(400)(s); ctx.fillStyle = `rgba(34,51,42,${.03 + t.d * .08})`;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(E.t * .5 + t.ph) * .008); ctx.scale(1, 2.6); ctx.fillText(t.ch, 0, 0); ctx.restore();
    }
    const f = ctx.createLinearGradient(0, ground - size * 2, 0, ground + 30);
    f.addColorStop(0, 'rgba(221,227,216,0)'); f.addColorStop(1, 'rgba(221,227,216,.7)');
    ctx.fillStyle = f; ctx.fillRect(0, ground - size * 2, W, size * 2 + 30);
    E.drawL(E.S.ink);
    ctx.fillStyle = 'rgba(34,51,42,.25)'; ctx.fillRect(0, ground, W, 1);
    if (P.inside) {
      const x = P.x, y = ground;
      ctx.fillStyle = '#22332a';
      ctx.beginPath(); ctx.arc(x, y - 17, 3.6, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.roundRect(x - 2.6, y - 12.5, 5.2, 12.5, 2.5); ctx.fill();
      ctx.fillStyle = 'rgba(34,51,42,.15)'; ctx.beginPath(); ctx.ellipse(x, y + 1, 8, 2, 0, 0, TAU); ctx.fill();
    }
  },
};

const saudade = {
  word: 'Saudade', roman: '사우다지', lang: '포르투갈어', cand: '그리움', gloss: '다시 오지 않을 걸 알면서도 떠나간 것을 그리워하는 아련한 마음', hint: '꾹 누르고 있으면 조금 돌아와요',
  bg: '#1b2136', ink: '#f0dcc0', font: FR(300), lay: { maxW: .66, maxH: .4 },
  init(E) {
    E.L.forEach(l => { l.d = 0; });
    E.st.ghost = E.L.map(l => ({ ...l, a: .07 }));
  },
  step(E, dt) {
    const { L, P, W, size } = E, n = L.length;
    for (const l of L) {
      if (P.down) l.d = Math.max(.06 + (n - l.i) * .012, l.d - dt * .5);
      else if (E.t > 1.6) l.d = Math.min(1.2, l.d + dt * (.03 + (l.i / n) * .05) * (1 + l.d * 1.6));
      const e = Math.pow(l.d, 1.5);
      l.x = l.hx + e * W * .7; l.y = l.hy - l.d * size * .3 + Math.sin(E.t * .8 + l.i) * 3;
      l.a = clamp(1 - l.d * 1.05, 0, 1); l.sx = l.sy = 1 - l.d * .25;
    }
  },
  draw(E) {
    const { ctx, W, H, L, size, st } = E, hz = L[0].hy + size * .75;
    const g = ctx.createRadialGradient(W * .95, hz, 0, W * .95, hz, W * .6);
    g.addColorStop(0, 'rgba(240,190,150,.16)'); g.addColorStop(1, 'rgba(240,190,150,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(240,220,192,.12)'; ctx.fillRect(0, hz, W, 1);
    E.drawL(E.S.ink, st.ghost);
    for (let k = 3; k >= 1; k--) {
      const tr = L.map(l => ({ ...l, x: l.x - k * 10 * l.d, a: l.a * .12 / k }));
      E.drawL(E.S.ink, tr);
    }
    E.drawL(E.S.ink);
  },
};

const mami = {
  word: 'Mamihlapinatapai', roman: '마밀라피나타파이', lang: '야간어', cand: '눈빛', gloss: '서로 바라는 게 같지만 누구도 먼저 나서지 못한 채 주고받는 눈빛', hint: '꾹 누르면 조금씩 다가가요',
  bg: '#f3e4dc', ink: '#3b2531', font: FR(600), lay: { maxW: .62, maxH: .22 },
  init(E) { Object.assign(E.st, { gap: E.W * .3, gv: 0, push: 0, meet: 0, lock: false, split: 9 }); },
  up(E) { E.st.lock = false; },
  step(E, dt) {
    const { st, P, W, size, L } = E;
    const auto = W * .09 + (Math.sin(E.t * .8) * .5 + .5) * W * .1;
    st.push = P.down && !st.lock ? st.push + dt : 0;
    const p = Math.min(1, st.push / 2.4);
    let tgt = lerp(auto, -size * .04, p) + Math.sin(E.t * 6.5) * size * .12 * p * (1 - p) * 4;
    if (st.meet > 0) { st.meet -= dt; tgt = -size * .04; if (st.meet <= 0) { st.lock = true; st.gv += W * 1.6; } }
    else if (p >= 1 && st.gap < size * .1) st.meet = 1.3;
    st.gv += (tgt - st.gap) * (P.down ? 7 : 3) * dt; st.gv *= Math.exp(-3 * dt); st.gap += st.gv * dt;
    const c = 1 - clamp(st.gap / (W * .22), 0, 1), hop = st.meet > 0 ? Math.sin((1.3 - st.meet) / 1.3 * Math.PI) : 0;
    for (const l of L) {
      const left = l.i < st.split, s = left ? -1 : 1;
      l.x = l.hx + s * st.gap / 2;
      l.y = l.hy - hop * size * .18 * (1 - Math.abs(l.i - st.split + .5) / L.length) + Math.sin(E.t * 2 + l.i) * 1.5;
      l.r = -s * .07 * c;
      l.c = hop > 0 ? '#d2486b' : null;
    }
  },
  draw(E) {
    const { ctx, st, L, size } = E;
    const a = L[st.split - 1], b = L[st.split];
    const c = 1 - clamp(st.gap / (E.W * .22), 0, 1);
    if (st.gap > size * .3) {
      ctx.strokeStyle = `rgba(210,72,107,${.15 + .4 * c})`; ctx.lineWidth = 1.2; ctx.setLineDash([3, 6]);
      ctx.beginPath(); ctx.moveTo(a.x + a.w * .7, a.y - size * .12); ctx.lineTo(b.x - b.w * .7, b.y - size * .12); ctx.stroke(); ctx.setLineDash([]);
    }
    E.drawL(E.S.ink);
  },
};

export const A = [komorebi, tsundoku, wald, saudade, mami];

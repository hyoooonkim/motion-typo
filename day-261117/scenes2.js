import { TAU, rnd, clamp, lerp, FR, spr } from './scenes1.js';

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`; };
const heart = (c, x, y, s) => {
  c.beginPath(); c.moveTo(x, y + s * .9);
  c.bezierCurveTo(x - s * 1.2, y + s * .1, x - s * .9, y - s * .9, x, y - s * .3);
  c.bezierCurveTo(x + s * .9, y - s * .9, x + s * 1.2, y + s * .1, x, y + s * .9); c.fill();
};

const gigil = {
  word: 'Gigil', roman: '기길', lang: '타갈로그어', cand: '귀여움', gloss: '너무 귀여운 걸 보면 꽉 쥐고 깨물고 싶어지는 참을 수 없는 충동', hint: '꾹 눌러 꽉 쥐어 보세요',
  bg: '#ffe7ee', ink: '#ff5a8c', font: s => `700 ${s}px Fredoka, sans-serif`, lay: { maxW: .56, maxH: .5 },
  init(E) { E.L.forEach(l => { l.q = 0; l.qv = 0; }); E.st.sq = 0; E.st.hearts = []; },
  up(E) {
    const { st, L, size } = E, n = Math.round(6 + Math.min(st.sq, 2) * 8);
    for (let i = 0; i < n; i++) {
      const l = L[Math.floor(rnd(0, L.length))];
      st.hearts.push({ x: l.x + rnd(-.3, .3) * size, y: l.y - size * .3, vx: rnd(-80, 80), vy: rnd(-260, -120), s: rnd(5, 11), life: rnd(1, 1.6), t: 0 });
    }
  },
  step(E, dt) {
    const { st, P, L, size } = E;
    st.sq = P.down ? st.sq + dt : Math.max(0, st.sq - dt * 3);
    const grip = P.down ? Math.min(1, st.sq * 2.5) : 0;
    for (const l of L) {
      const d = Math.hypot(P.x - l.hx, (P.y - l.hy) * 1.4);
      const f = grip * clamp(1.3 - d / (size * 1.6), .35, 1);
      l.qv += (f - l.q) * 130 * dt; l.qv *= Math.exp(-6 * dt); l.q += l.qv * dt;
      const bob = 1 + Math.sin(E.t * 3 + l.i) * .025;
      l.sx = (1 + l.q * .5) / bob; l.sy = (1 - l.q * .42) * bob;
      const shake = P.down ? l.q * (1.5 + Math.min(st.sq, 2) * 2.5) : 0;
      l.x = l.hx + (P.down ? (P.x - l.hx) * l.q * .18 : 0) + rnd(-1, 1) * shake;
      l.y = l.hy + (1 - l.sy) * size * .34 + rnd(-1, 1) * shake;
      l.c = mix('#ff5a8c', '#e02467', clamp(l.q, 0, 1));
    }
    for (const h of st.hearts) { h.t += dt; h.vy += 160 * dt; h.x += h.vx * dt; h.y += h.vy * dt; }
    st.hearts = st.hearts.filter(h => h.t < h.life);
  },
  draw(E) {
    const { ctx, st, L, size } = E;
    ctx.fillStyle = 'rgba(255,90,140,.13)';
    for (const l of L) { ctx.beginPath(); ctx.ellipse(l.x, l.hy + size * .4, l.w * .42 * l.sx, size * .045, 0, 0, TAU); ctx.fill(); }
    E.drawL(E.S.ink);
    for (const h of st.hearts) { ctx.globalAlpha = 1 - h.t / h.life; ctx.fillStyle = '#ff5a8c'; heart(ctx, h.x, h.y, h.s); }
    ctx.globalAlpha = 1;
  },
};

const hygge = {
  word: 'Hygge', roman: '휘게', lang: '덴마크어', cand: '아늑함', gloss: '가까운 사람들과 소박하게 누리는 아늑하고 따뜻한 시간', hint: '가까이 다가가면 따뜻해져요',
  bg: '#140d09', ink: '#ffd59a', font: FR(400), lay: { maxW: .56, maxH: .46 },
  init(E) { Object.assign(E.st, { warm: .15, em: [], acc: 0 }); },
  step(E, dt) {
    const { st, P, L, W, size } = E, cx = W / 2, cy = L[0].hy;
    const d = P.inside ? Math.hypot(P.x - cx, (P.y - cy) * 1.3) : 1e9;
    st.warm = lerp(st.warm, clamp(1.15 - d / (W * .32), .15, 1), 1 - Math.exp(-1.6 * dt));
    st.fl = .86 + .14 * (Math.sin(E.t * 13) * .4 + Math.sin(E.t * 7.3 + 1) * .35 + Math.sin(E.t * 23 + 2) * .25);
    st.acc += dt * st.warm * 30;
    while (st.acc > 1) {
      st.acc--;
      const l = L[Math.floor(rnd(0, L.length))];
      st.em.push({ x: l.x + rnd(-.3, .3) * l.w, y: l.y - size * .25, vy: rnd(-70, -28), ph: rnd(0, TAU), r: rnd(.8, 2.2), life: rnd(1.4, 2.8), t: 0 });
    }
    for (const e of st.em) { e.t += dt; e.y += e.vy * dt; e.x += Math.sin(E.t * 2 + e.ph) * 12 * dt; }
    st.em = st.em.filter(e => e.t < e.life);
    L.forEach(l => { l.y = l.hy + Math.sin(E.t * 1.2 + l.i * .7) * size * .015; });
  },
  draw(E) {
    const { ctx, st, P, W, H, L, size } = E, cx = W / 2, cy = L[0].hy, w = st.warm;
    const lx = cx + (P.inside ? (P.x - cx) * .2 * w : 0);
    const g = ctx.createRadialGradient(lx, cy, 0, lx, cy, W * (.3 + .25 * w));
    g.addColorStop(0, `rgba(255,150,70,${(.08 + .22 * w) * st.fl})`); g.addColorStop(1, 'rgba(255,150,70,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.shadowColor = 'rgba(255,155,60,.9)'; ctx.shadowBlur = size * (.1 + .32 * w) * st.fl;
    E.drawL(mix('#8a6040', '#ffe2ae', .25 + .75 * w));
    ctx.shadowBlur = 0;
    for (const e of st.em) {
      ctx.fillStyle = `rgba(255,196,120,${(1 - e.t / e.life) * .9})`;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, TAU); ctx.fill();
    }
  },
};

const kummer = {
  word: 'Kummerspeck', roman: '쿠머슈페크', lang: '독일어', cand: '살', gloss: '슬픔을 달래려고 자꾸 먹다가 찐 살, 직역하면 ‘슬픔 베이컨’', hint: '탭할 때마다 한 입씩 먹어요',
  bg: '#f4e2cb', ink: '#7a3a2a', font: FR(900), lay: { maxW: .82, maxH: .3 },
  init(E) { Object.assign(E.st, { wt: 150, bounce: 0, idle: 0, crumbs: [] }); },
  wf(E) { const w = Math.round(E.st.wt); return s => `${w} ${s}px Fraunces, Georgia, serif`; },
  down(E) {
    const { st, P } = E;
    st.wt = Math.min(900, st.wt + 85); st.bounce = 1; st.idle = 0;
    for (let i = 0; i < 9; i++) st.crumbs.push({ x: P.x, y: P.y, vx: rnd(-160, 160), vy: rnd(-260, -60), r: rnd(1.5, 3.5), t: 0 });
  },
  step(E, dt) {
    const { st, ctx, L, W, size } = E;
    st.idle += dt; if (st.idle > 2.5) st.wt = Math.max(150, st.wt - dt * 35);
    st.bounce *= Math.exp(-2.5 * dt);
    ctx.font = this.wf(E)(size);
    const ws = L.map(l => ctx.measureText(l.ch).width), tw = ws.reduce((a, b) => a + b, 0);
    let x = W / 2 - tw / 2;
    const heavy = clamp((st.wt - 600) / 300, 0, 1), jig = Math.sin(E.t * 16) * .07 * st.bounce;
    L.forEach((l, i) => {
      l.w = ws[i];
      spr(l, x + ws[i] / 2, l.hy + Math.sin(E.t * 2 + i * .5) * size * .03 * heavy, 170, 13, dt);
      l.sy = 1 + jig; l.sx = 1 - jig * .6; l.r = Math.sin(E.t * 1.6 + i * .4) * .025 * heavy;
      x += ws[i];
    });
    for (const c of st.crumbs) { c.t += dt; c.vy += 1200 * dt; c.x += c.vx * dt; c.y += c.vy * dt; }
    st.crumbs = st.crumbs.filter(c => c.t < 1.2);
  },
  draw(E) {
    const { ctx, st, W, L, size } = E;
    E.drawL(E.S.ink, L, this.wf(E));
    ctx.fillStyle = '#b07a4a';
    for (const c of st.crumbs) { ctx.globalAlpha = 1 - c.t / 1.2; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
    const y = L[0].hy + size * .62, bw = Math.min(220, W * .5), p = (st.wt - 100) / 800;
    ctx.fillStyle = 'rgba(122,58,42,.15)'; ctx.fillRect(W / 2 - bw / 2, y, bw, 3);
    ctx.fillStyle = '#7a3a2a'; ctx.fillRect(W / 2 - bw / 2, y, bw * p, 3);
    ctx.font = 'italic 400 13px Fraunces, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = 'rgba(122,58,42,.7)';
    ctx.fillText(`wght ${Math.round(st.wt)}`, W / 2, y + 10);
  },
};

const nunchi = {
  word: '눈치', roman: 'nunchi', lang: '한국어', to: 'English', cand: 'sense', gloss: 'the quiet knack of reading the room and sensing what others think and feel without a word', hint: '가만히 있으면 쳐다보고, 움직이면 딴청 피워요',
  bg: '#efede6', ink: '#1e1e24', font: s => `900 ${s}px "Noto Serif KR", serif`, lay: { maxW: .56, maxH: .52 },
  init(E) {
    const { W, H, L, size, tw, top, SH } = E, cy = L[0].hy, eyes = [];
    for (let k = 0; k < 600 && eyes.length < 30; k++) {
      const s = rnd(8, 15), x = rnd(30, W - 30), y = rnd(top + 10, top + SH - 10);
      if (Math.abs(x - W / 2) < tw / 2 + 30 && Math.abs(y - cy) < size * .62) continue;
      if (eyes.some(e => Math.hypot(e.x - x, e.y - y) < (e.s + s) * 3)) continue;
      const a = rnd(0, TAU);
      eyes.push({ x, y, s, a, ta: a, away: a, bl: rnd(.5, 5), bt: 0, delay: rnd(0, .6), caught: false });
    }
    E.st.eyes = eyes;
  },
  step(E, dt) {
    const { st, P, L, W, size } = E, cx = W / 2, cy = L[0].hy, fast = P.inside && P.speed > 240;
    for (const e of st.eyes) {
      const tx = P.inside ? P.x : cx, ty = P.inside ? P.y : cy, to = Math.atan2(ty - e.y, tx - e.x);
      if (fast && !e.caught) { e.caught = true; e.away = to + Math.PI + rnd(-1.1, 1.1); }
      if (!fast && P.still > .5 + e.delay) e.caught = false;
      const tgt = e.caught ? e.away : to, k = e.caught ? 16 : 2.5;
      let d = tgt - e.a; d = Math.atan2(Math.sin(d), Math.cos(d));
      e.a += d * (1 - Math.exp(-k * dt));
      e.bl -= dt; if (e.bl < 0) { e.bt = .15; e.bl = rnd(2, 6); }
      e.bt = Math.max(0, e.bt - dt);
    }
    for (const l of L) {
      const dx = l.hx - P.x, dy = l.hy - P.y, d = Math.hypot(dx, dy) || 1;
      const push = P.inside ? clamp(1 - d / (size * 1.4), 0, 1) * size * .14 : 0;
      spr(l, l.hx + dx / d * push, l.hy + dy / d * push, 60, 9, dt);
      l.r = (l.x - l.hx) / size * .5;
    }
  },
  draw(E) {
    const { ctx, st } = E;
    for (const e of st.eyes) {
      for (const side of [-1, 1]) {
        const x = e.x + side * e.s * 1.25, y = e.y, rx = e.s * .95, ry = e.s * .62;
        ctx.strokeStyle = '#1e1e24'; ctx.lineWidth = 1.4;
        if (e.bt > 0) { ctx.beginPath(); ctx.moveTo(x - rx, y); ctx.quadraticCurveTo(x, y + ry * .5, x + rx, y); ctx.stroke(); continue; }
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.save(); ctx.clip();
        ctx.fillStyle = '#1e1e24'; ctx.beginPath(); ctx.arc(x + Math.cos(e.a) * rx * .5, y + Math.sin(e.a) * ry * .45, e.s * .36, 0, TAU); ctx.fill();
        ctx.restore();
      }
    }
    E.drawL(E.S.ink);
  },
};

export const B = [gigil, hygge, kummer, nunchi];

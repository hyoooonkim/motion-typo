const $ = s => document.querySelector(s);
const cv = document.createElement('canvas');
document.body.prepend(cv);
let cx = cv.getContext('2d');
const main = cx;
let W = 0, H = 0, DPR = 1;

const PLACES = [
  { k: '같은 동네', A: 1.2, f: .6 },
  { k: '같은 구', A: 8, f: .35 },
  { k: '같은 도시', A: 90, f: .2 },
  { k: '다른 도시', A: 90, f: .004 },
];
const MPP = 0.23666, OX = 1050, OY = 1115, TX0 = 447065, TY0 = 203029, NT = 6, EX = 2.8;
const toW = (px, py) => ({ x: (px - OX) * MPP, y: (py - OY) * MPP });
const POLY = [[820, 850], [1230, 850], [1262, 1000], [1290, 1300], [1240, 1380], [900, 1380], [840, 1250], [810, 1000]].map(([a, b]) => toW(a, b));
const PW = (1290 - 810) * MPP, PH = (1380 - 850) * MPP;
function inside(x, y) {
  let c = false;
  for (let i = 0, j = POLY.length - 1; i < POLY.length; j = i++) {
    const a = POLY[i], b = POLY[j];
    if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}
function randIn(m = 0) { for (;;) { const x = (Math.random() - .5) * PW, y = (Math.random() - .5) * PH; if (inside(x, y) && (!m || [0, 1, 2, 3].every(i => inside(x + Math.cos(i * 1.57) * m, y + Math.sin(i * 1.57) * m)))) return { x, y }; } }
const HAUNTS = [{ k: '없음', m: 1 }, { k: '한두 곳', m: 1.6 }, { k: '많음', m: 2.6 }];
const V = 5.7, WALK = 1.35, WIN = 60, DT = .5, PLAY = 11, STREET = .4, LIFE = 50;
const KEY = 'day261124-routine';
const st = { place: 1, haunt: 1, r: 5, me: [8, 12, 18, 19, 20], him: [8, 9, 13, 19, 21, 22], nmMe: '나', nmHim: '그' };
try { Object.assign(st, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch {} };

const shared = () => st.me.filter(h => st.him.includes(h));
const overlapT = () => shared().length * STREET;
const fEff = () => Math.min(.95, PLACES[st.place].f * HAUNTS[st.haunt].m);
const lam = () => 2 * (st.r / 1000) * V * overlapT() * fEff() / PLACES[st.place].A;
const comma = n => Math.round(n).toLocaleString('en-US');
const nmMe = () => st.nmMe.trim() || '나', nmHim = () => st.nmHim.trim() || '그';

function pct(p) {
  if (p <= 0) return '0%';
  const v = p * 100;
  if (v >= 99.995) return '99.99%';
  if (v >= 10) return v.toFixed(1) + '%';
  return v.toFixed(Math.max(2, -Math.floor(Math.log10(v)) + 1)) + '%';
}
function span(days) {
  if (!isFinite(days)) return '겹치는 외출 시간이 없어요. 영원히 못 만나요';
  if (days < 45) return `평균 ${Math.max(1, Math.round(days))}일에 한 번`;
  if (days < 730) return `평균 ${Math.round(days / 30.4)}개월에 한 번`;
  const y = days / 365;
  return `평균 ${y < 10 ? y.toFixed(1) : comma(y)}년에 한 번`;
}
function elapsed(n) {
  if (n < 45) return `${n}일째`;
  const y = Math.floor(n / 365), m = Math.floor((n % 365) / 30.4);
  return y ? `${comma(y)}년 ${m}개월째` : `${m}개월째`;
}
const fmtD = d => d < 1000 ? `${d < 10 ? d.toFixed(1) : Math.round(d)}m` : `${(d / 1000).toFixed(d < 10000 ? 1 : 0)}km`;
const clock = s => { s = ((Math.floor(s) % 86400) + 86400) % 86400; return [s / 3600, (s % 3600) / 60, s % 60].map(v => String(Math.floor(v)).padStart(2, '0')).join(':'); };
const BASE = new Date(2026, 10, 24);
const dateOf = n => { const d = new Date(BASE); d.setDate(d.getDate() + n - 1); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; };
const pick = a => a[Math.floor(Math.random() * a.length)];

function previewText() {
  const L = lam(), s = shared();
  return `겹치는 외출 시간 ${s.length}시간${s.length ? ` (${s.map(h => h + '시').join(' · ')})` : ''}<br>오늘 마주칠 확률 <b>${pct(1 - Math.exp(-L))}</b> · ${span(1 / L)}`;
}
function updateCalc() {
  const L = lam(), p = PLACES[st.place];
  $('#pday').textContent = pct(1 - Math.exp(-L));
  $('#every').textContent = span(1 / L);
  $('#life').textContent = `남은 ${LIFE}년 안에 한 번이라도 · ${pct(1 - Math.exp(-L * 365 * LIFE))}`;
  $('#formula').innerHTML = `λ = 2r · v · T · f ÷ A<br>= 2 × ${st.r}m × ${V}km/h × ${overlapT().toFixed(1)}h × ${fEff().toFixed(2)} ÷ ${p.A}km²<br>= 하루 ${L ? L.toPrecision(2) : 0}회 · 기체 분자 충돌 모형으로 단순화함`;
  $('#rV').textContent = `${st.r}m`;
  $('#sum').innerHTML = `${nmMe()} ${st.me.length}시간 · ${nmHim()} ${st.him.length}시간 · 겹침 ${shared().length}시간<br>${p.k} · 단골 ${HAUNTS[st.haunt].k}`;
  $('#until').disabled = mode === 'ff' || L === 0;
  $('#mprev').innerHTML = previewText();
}

function walker(x, y, h, sp, bound) { return { x, y, h: h ?? Math.random() * Math.PI * 2, tv: (Math.random() - .5) * .2, sp: sp ?? WALK, bound }; }
function step(w, dt) {
  w.tv += (Math.random() - .5) * .5 * dt;
  w.tv = Math.max(-.3, Math.min(.3, w.tv * Math.pow(.97, dt * 10)));
  w.h += w.tv * dt;
  if (w.bound && !inside(w.x + Math.cos(w.h) * 5, w.y + Math.sin(w.h) * 5)) {
    const d = ((Math.atan2(-w.y, -w.x) - w.h) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    w.h += Math.sign(d) * Math.min(Math.abs(d), 1.4 * dt); w.tv *= .6;
  }
  w.x += Math.cos(w.h) * w.sp * dt; w.y += Math.sin(w.h) * w.sp * dt;
}
function trace(w, secs) {
  const out = [{ x: w.x, y: w.y, h: w.h }];
  for (let t = 0; t < secs - 1e-9; t += DT) { step(w, DT); out.push({ x: w.x, y: w.y, h: w.h }); }
  return out;
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function closest(me, him) {
  let best = Infinity, k = 0;
  for (let i = 0; i < me.length; i++) { const d = dist(me[i], him[i]); if (d < best) { best = d; k = i; } }
  return { d: best, k };
}
function himPath(me, k, P, h) {
  const b = inside(P.x, P.y);
  const back = trace(walker(P.x, P.y, h + Math.PI, WALK, b), k * DT).reverse().map(p => ({ ...p, h: p.h + Math.PI }));
  const fwd = trace(walker(P.x, P.y, h, WALK, b), (me.length - 1 - k) * DT);
  return back.concat(fwd.slice(1));
}
function sampleD(L) {
  const E = -Math.log(1 - Math.random());
  const p = PLACES[st.place];
  const far = st.place === 3 ? 120000 + Math.random() * 280000 : Math.sqrt(p.A) * 1000 * (.12 + Math.random() * .7);
  return E < L ? { meet: true, d: st.r * (.25 + .6 * Math.random()) } : { meet: false, d: Math.max(st.r * 1.05, Math.min(L ? st.r * E / L : Infinity, far)) };
}
function noteFor(d, meet) {
  if (meet) return '우연';
  if (d < st.r * 3) return pick(['그는 휴대폰을 보고 있었다.', '나란히 몇 걸음 걸었다.', '모자를 눌러쓰고 있었다.', '내가 먼저 방향을 틀었다.', '이어폰 때문에 못 들었다.']);
  if (d < 60) return pick(['같은 광장 건너편에 있었다.', '같은 횡단보도, 다른 신호.', '같은 정류장 반대편.']);
  if (d < 400) return pick(['같은 블록에 있었다.', '같은 노래가 들리는 거리.', '같은 편의점 앞을 10분 차이로.']);
  if (d < 100000) return '아무 일도 없었다.';
  return '다른 하늘 아래.';
}
const ENDINGS = ['둘 다 못 본 척했다.', '눈이 마주쳤다. 3초.', '그가 먼저 고개를 돌렸다.', '“어… 안녕.”', '아무 말도 하지 않았다.', '나는 머리를 안 감은 날이었다.'];

function makeDay(n, force) {
  const s = force ? { meet: true, d: st.r * (.25 + .6 * Math.random()) } : sampleD(lam());
  const s0 = randIn(18), me = trace(walker(s0.x, s0.y, undefined, WALK, true), WIN);
  let k = Math.round((WIN / 2 + (Math.random() - .5) * 16) / DT);
  const a = me[k], hm = Math.atan2(me[k + 1].y - a.y, me[k + 1].x - a.x);
  let him = null, d = s.d;
  const ang = Math.random() * Math.PI * 2;
  if (s.meet) him = himPath(me, k, { x: a.x + Math.cos(hm) * d, y: a.y + Math.sin(hm) * d }, hm + Math.PI);
  else if (d <= 1500) {
    let best = null;
    for (let i = 0; i < 24; i++) {
      let h;
      if (d < st.r * 3) { const sg = Math.random() < .5 ? -1 : 1; h = himPath(me, k, { x: a.x - Math.sin(hm) * d * sg, y: a.y + Math.cos(hm) * d * sg }, hm); }
      else h = himPath(me, k, { x: a.x + d * Math.cos(ang + i), y: a.y + d * Math.sin(ang + i) }, Math.random() * Math.PI * 2);
      const c = closest(me, h);
      if (c.d < st.r) continue;
      const score = Math.abs(Math.log(c.d / d));
      if (!best || score < best.score) best = { h, c, score };
      if (score < .15) break;
    }
    if (best) { him = best.h; d = best.c.d; k = best.c.k; }
  }
  const hrs = shared().length ? shared() : st.me;
  const t0 = pick(hrs) * 3600 + Math.random() * 3500 - k * DT;
  return { n, meet: s.meet, d, k, me, him, ang, t0, note: noteFor(d, s.meet), end: pick(ENDINGS) };
}

let mode = 'idle', day = null, simT = 0, finT = 0, dayN = 0, ff = null, groups = [], frameNo = 227000, blobId = 0;
const cam = { x: 0, y: 0, s: 1, base: 1 };
const mobile = () => W < 640;
const baseScale = () => Math.min(W / (PW * (mobile() ? 1.02 : 1.55)), H / (PH * 1.04));
const viewHalf = () => ({ hw: W / 2 / cam.base + 14, hh: H / 2 / cam.base + 14 });
const COLS = ['#d8d3ca', '#4b5d7e', '#b4433a', '#ecebe6', '#5b6470', '#7d93b0', '#cdb68c', '#6c7d58', '#b9587a', '#2f6f8f', '#e0a64b'];
function spawnGroup(outside) {
  const { x, y } = randIn(2);
  const n = Math.random() < .68 ? 1 : Math.random() < .75 ? 2 : 3;
  const mem = Array.from({ length: n }, (_, i) => ({ id: blobId++ % 40, col: pick(COLS), tr: Math.random() < .42, lb: Math.random() < .22, off: (i - (n - 1) / 2) * 1.5, ph: Math.random() * 6, spr: pick(CROWD_SPR) }));
  const w = walker(x, y, undefined, 1 + Math.random() * .6, true);
  if (Math.random() < .12) w.sp = 0;
  return { w, mem };
}
function spawnCrowd() { groups = Array.from({ length: mobile() ? 120 : 150 }, () => spawnGroup(false)); }
function moveCrowd(dts) {
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    for (let t = dts; t > 0; t -= .5) step(g.w, Math.min(.5, t));
    if (Math.abs(g.w.x) > PW || Math.abs(g.w.y) > PH) groups[i] = spawnGroup(true);
  }
}

function startDay(d) {
  day = d; simT = 0; finT = 0; mode = 'play';
  cam.x = 0; cam.y = 0; cam.s = cam.base;
  spawnCrowd();
  $('#walk').disabled = false; updateCalc();
}
function walkOne() { dayN++; startDay(makeDay(dayN)); }
function startFF() {
  const L = lam(); if (!L) return;
  const N = Math.max(1, Math.ceil(-Math.log(1 - Math.random()) / L));
  ff = { start: dayN, N, t: 0, dur: Math.min(9, 2.4 + Math.log10(N) * 1.3), last: dayN, logT: 0, life: dayN > 365 * LIFE };
  mode = 'ff'; day = null;
  $('#walk').disabled = true; updateCalc();
}

const logEl = $('#days');
function addLog(n, d, note, cls) {
  const li = document.createElement('li');
  if (cls) li.className = cls;
  if (cls === 'sep') li.textContent = note;
  else li.innerHTML = `<span>D+${comma(n)}</span><span class="d">${fmtD(d)}</span><span class="t"></span>`, li.lastChild.textContent = note;
  logEl.prepend(li);
  while (logEl.children.length > 11) logEl.lastChild.remove();
}

const INK = '#e8ecea', HIM = '#ff6a3d', CY = '#5ff2e6';
const S = p => ({ x: (p.x - cam.x) * cam.s + W / 2, y: (p.y - cam.y) * cam.s + H / 2 });
const lerpP = (arr, t) => { const f = Math.min(arr.length - 1, t / DT), i = Math.floor(f), j = Math.min(arr.length - 1, i + 1), u = f - i; return { x: arr[i].x + (arr[j].x - arr[i].x) * u, y: arr[i].y + (arr[j].y - arr[i].y) * u, h: Math.atan2(arr[j].y - arr[i].y, arr[j].x - arr[i].x) || arr[i].h }; };
const inView = p => p.x > 20 && p.x < W - 20 && p.y > 20 && p.y < H - 20;

function floor() {
  cx.fillStyle = '#0b0e0f'; cx.fillRect(0, 0, W, H);
  if (ground.ok) { cx.globalAlpha = .2; drawGround(); cx.globalAlpha = 1; cx.fillStyle = 'rgba(10,40,42,.25)'; cx.fillRect(0, 0, W, H); }
  const x0 = cam.x - W / 2 / cam.s, y0 = cam.y - H / 2 / cam.s;
  const grid = (g, a) => {
    if (g * cam.s < 9) return;
    cx.strokeStyle = `rgba(232,236,234,${a})`; cx.lineWidth = 1; cx.beginPath();
    for (let x = Math.floor(x0 / g) * g; x < x0 + W / cam.s + g; x += g) { const sx = Math.round(S({ x, y: 0 }).x) + .5; cx.moveTo(sx, 0); cx.lineTo(sx, H); }
    for (let y = Math.floor(y0 / g) * g; y < y0 + H / cam.s + g; y += g) { const sy = Math.round(S({ x: 0, y }).y) + .5; cx.moveTo(0, sy); cx.lineTo(W, sy); }
    cx.stroke();
  };
  grid(1.5, .028); grid(9, .06);
}
function person(p, h, col, ph, moving) {
  const s = cam.s * EX, q = S(p);
  cx.save(); cx.translate(q.x, q.y);
  cx.fillStyle = 'rgba(0,0,0,.55)'; cx.beginPath(); cx.ellipse(.2 * s, .26 * s, .28 * s, .17 * s, h + Math.PI / 2, 0, 7); cx.fill();
  cx.rotate(h);
  const sw = moving ? Math.sin(ph) * .17 * s : 0;
  cx.fillStyle = '#26292b';
  cx.beginPath(); cx.arc(sw, -.09 * s, .06 * s, 0, 7); cx.arc(-sw, .09 * s, .06 * s, 0, 7); cx.fill();
  cx.fillStyle = col; cx.beginPath(); cx.ellipse(0, 0, .13 * s, .25 * s, 0, 0, 7); cx.fill();
  cx.fillStyle = '#3b342f'; cx.beginPath(); cx.arc(.02 * s, 0, .1 * s, 0, 7); cx.fill();
  cx.restore();
}
function box(p, side, col, alpha, lw, label) {
  const q = S(p), b = Math.max(9, side * cam.s * EX * .75);
  cx.globalAlpha = alpha; cx.strokeStyle = col; cx.lineWidth = lw;
  cx.strokeRect(Math.round(q.x - b / 2) + .5, Math.round(q.y - b / 2) + .5, Math.round(b), Math.round(b));
  if (label) { cx.fillStyle = col; cx.font = `${lw > 1 ? 500 : 400} ${lw > 1 ? 11 : 8.5}px 'IBM Plex Mono', 'Noto Sans KR', monospace`; cx.textAlign = 'left'; cx.textBaseline = 'bottom'; cx.fillText(label, q.x - b / 2, q.y - b / 2 - 2); }
  cx.globalAlpha = 1;
}

let clockT = 0;
function crowdPts() {
  const out = [];
  for (const g of groups) {
    const { w } = g, px = -Math.sin(w.h), py = Math.cos(w.h);
    for (const m of g.mem) out.push({ x: w.x + px * m.off, y: w.y + py * m.off, h: w.h, m, moving: w.sp > 0 });
  }
  return out;
}
function network(pts, alpha) {
  const seen = new Set();
  cx.strokeStyle = `rgba(232,236,234,${.3 * alpha})`; cx.lineWidth = .8; cx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], near = [];
    for (let j = 0; j < pts.length; j++) {
      if (i === j) continue;
      const d = (a.x - pts[j].x) ** 2 + (a.y - pts[j].y) ** 2;
      if (d < 400 && d > .5) near.push([d, j]);
    }
    near.sort((p, q) => p[0] - q[0]);
    for (const [, j] of near.slice(0, 3)) {
      const key = i < j ? i * 4096 + j : j * 4096 + i;
      if (seen.has(key)) continue; seen.add(key);
      const p = S(a), q = S(pts[j]); cx.moveTo(p.x, p.y); cx.lineTo(q.x, q.y);
    }
  }
  cx.stroke();
}
function drawCrowd(alpha) {
  const pts = crowdPts();
  network(pts, alpha);
  cx.globalAlpha = alpha;
  for (const p of pts) { const q = S(p); if (q.x > -20 && q.x < W + 20 && q.y > -20 && q.y < H + 20) person(p, p.h, p.m.col, clockT * 5.5 + p.m.ph, p.moving); }
  cx.globalAlpha = 1;
  for (const p of pts) if (p.m.tr) box(p, 1.15, CY, .62 * alpha, 1, p.m.lb ? `['blob${p.m.id}:id'] ${frameNo + p.m.id * 13}.0` : '');
}
function trail(arr, t, col) {
  const n = Math.min(arr.length - 1, Math.floor(t / DT));
  cx.strokeStyle = col; cx.lineWidth = 1.2; cx.globalAlpha = .45; cx.beginPath();
  for (let i = 0; i <= n; i++) { const p = S(arr[i]); i ? cx.lineTo(p.x, p.y) : cx.moveTo(p.x, p.y); }
  const e = S(lerpP(arr, t)); cx.lineTo(e.x, e.y); cx.stroke(); cx.globalAlpha = 1;
}
function ringArrow(from, ang, label) {
  const dx = Math.cos(ang), dy = Math.sin(ang), R = Math.min(W, H) * (mobile() ? .3 : .26), x = from.x + dx * R, y = from.y + dy * R;
  cx.save(); cx.translate(x, y); cx.rotate(ang); cx.fillStyle = HIM;
  cx.beginPath(); cx.moveTo(9, 0); cx.lineTo(-6, -6); cx.lineTo(-6, 6); cx.closePath(); cx.fill(); cx.restore();
  cx.setLineDash([2, 5]); cx.strokeStyle = HIM; cx.globalAlpha = .6; cx.lineWidth = 1;
  cx.beginPath(); cx.moveTo(from.x, from.y); cx.lineTo(x - dx * 12, y - dy * 12); cx.stroke(); cx.setLineDash([]); cx.globalAlpha = 1;
  cx.fillStyle = HIM; cx.font = `500 11px 'IBM Plex Mono', 'Noto Sans KR', monospace`;
  cx.textAlign = dx > .3 ? 'left' : dx < -.3 ? 'right' : 'center'; cx.textBaseline = dy > .3 ? 'top' : dy < -.3 ? 'bottom' : 'middle';
  cx.fillText(label, x + dx * 14, y + dy * 14);
}

function drawDay() {
  const t = mode === 'final' ? day.k * DT : simT;
  const fz = mode === 'final' ? Math.min(1, finT / 1.6) : 0, ez = fz * fz * (3 - 2 * fz);
  floor();
  drawCrowd(1 - ez * .7);
  const me = lerpP(day.me, t), sm = S(me), past = t >= day.k * DT, moving = mode !== 'final';
  let cur, hp = null;
  if (day.him) { trail(day.him, t, HIM); hp = lerpP(day.him, t); cur = dist(me, hp); }
  else cur = day.d;
  trail(day.me, t, INK);
  if (hp) {
    const sh = S(hp);
    if (inView(sh)) {
      if (mode !== 'final') {
        cx.strokeStyle = INK; cx.globalAlpha = .7; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(sm.x, sm.y); cx.lineTo(sh.x, sh.y); cx.stroke(); cx.globalAlpha = 1;
        if (dist(sm, sh) > 60) { cx.fillStyle = INK; cx.font = `500 11px 'IBM Plex Mono', monospace`; cx.textAlign = 'center'; cx.textBaseline = 'bottom'; cx.fillText(fmtD(cur), (sm.x + sh.x) / 2, (sm.y + sh.y) / 2 - 4); }
      }
      person(hp, hp.h, HIM, clockT * 5.5 + 1, moving);
      if (mode !== 'final' || finT < 1.2) box(hp, 1.6, HIM, 1, 1.5, `['${nmHim()}:id'] ${fmtD(cur)}`);
    } else ringArrow(sm, Math.atan2(sh.y - sm.y, sh.x - sm.x), `['${nmHim()}:id'] ${fmtD(cur)}`);
    if (past && !day.meet) {
      const a = S(day.me[day.k]), b = S(day.him[day.k]);
      if (inView(b)) {
      cx.strokeStyle = HIM; cx.lineWidth = 1; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke(); cx.setLineDash([]);
      [a, b].forEach(p => { cx.beginPath(); cx.arc(p.x, p.y, 5, 0, 7); cx.stroke(); });
      cx.fillStyle = HIM; cx.font = `500 11px 'IBM Plex Mono', monospace`; cx.textAlign = 'left'; cx.textBaseline = 'top';
      cx.fillText(`MIN ${fmtD(day.d)} · ${clock(day.t0 + day.k * DT)}`, Math.max(a.x, b.x) + 10, Math.max(a.y, b.y) + 6);
      }
    }
  } else ringArrow(sm, day.ang, `['${nmHim()}:id'] ${fmtD(day.d)}`);
  person(me, me.h, '#f4f6f5', clockT * 5.5, moving);
  if (mode !== 'final' || finT < 1.2) box(me, 1.6, INK, 1, 1.5, `['${nmMe()}:id'] ${frameNo}.0`);
  $('#hud').innerHTML = `<b>D+${comma(day.n)}</b> · ${dateOf(day.n)} · ${clock(day.t0 + t)}<br>지금 거리 ${fmtD(cur)} · 최단 ${past ? fmtD(day.d) : '—'}`;
  if (mode === 'final') drawFinal(me, hp);
}
function drawFinal(me, hp) {
  const a0 = S(me), b0 = S(hp), pad = 1.1 * cam.s;
  const x0 = Math.min(a0.x, b0.x) - pad, y0 = Math.min(a0.y, b0.y) - pad, x1 = Math.max(a0.x, b0.x) + pad, y1 = Math.max(a0.y, b0.y) + pad;
  if (finT > 1.2) {
    const k = Math.min(1, (finT - 1.2) / .5);
    cx.globalAlpha = k; cx.strokeStyle = CY; cx.lineWidth = 1.5; cx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    cx.fillStyle = CY; cx.font = `500 12px 'IBM Plex Mono', 'Noto Sans KR', monospace`; cx.textAlign = 'left'; cx.textBaseline = 'bottom';
    cx.fillText(`['${nmMe()}+${nmHim()}:id'] ${day.d.toFixed(1)}m`, x0, y0 - 3); cx.globalAlpha = 1;
  }
  const a = Math.max(0, Math.min(1, (finT - 1.5) / 1.2)), b = Math.max(0, Math.min(1, (finT - 2.5) / 1));
  if (!a) return;
  const fs = Math.min(W * .3, H * .24);
  cx.save(); cx.globalAlpha = a; cx.fillStyle = INK; cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
  cx.font = `900 ${fs}px 'Noto Sans KR', sans-serif`;
  cx.translate(W / 2, y0 - 44); cx.scale(1 + (1 - a) * .04, 1 + (1 - a) * .04); cx.fillText('우연', 0, 0); cx.restore();
  cx.globalAlpha = b; cx.fillStyle = INK; cx.textAlign = 'center'; cx.textBaseline = 'top';
  const y = y1 + 22;
  cx.font = `500 ${mobile() ? 11 : 13}px 'IBM Plex Mono', 'Noto Sans KR', monospace`;
  cx.fillText(`${comma(day.n)}일째 · ${dateOf(day.n)} ${clock(day.t0 + day.k * DT)} · ${day.d.toFixed(1)}m`, W / 2, y);
  cx.font = `500 ${mobile() ? 13 : 15}px 'Noto Sans KR', sans-serif`; cx.fillStyle = HIM;
  cx.fillText(day.end, W / 2, y + 24);
  cx.globalAlpha = 1;
}
function drawFF() {
  floor(); drawCrowd(.5);
  cx.fillStyle = 'rgba(10,12,13,.55)'; cx.fillRect(0, 0, W, H);
  const n = ff.cur ?? ff.start;
  cx.fillStyle = CY; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.font = `600 ${mobile() ? 40 : 72}px 'IBM Plex Mono', monospace`;
  cx.fillText(`D+${comma(n)}`, W / 2, H / 2 - 10);
  cx.font = `500 ${mobile() ? 13 : 16}px 'Noto Sans KR', sans-serif`; cx.fillStyle = '#9aa39f';
  cx.fillText(`${elapsed(n)} · 아직 못 만났다`, W / 2, H / 2 + (mobile() ? 26 : 44));
  $('#hud').innerHTML = `<b>D+${comma(n)}</b> · ${dateOf(Math.max(1, n))}<br>빨리 감는 중`;
}
function quietDay() { let s; do s = sampleD(lam()); while (s.meet); return s; }

const SPR = [[0,49],[51,45],[98,47],[147,45],[194,61],[257,50],[309,48],[359,51],[412,54],[468,48],[518,51],[571,49],[622,51],[675,45],[722,50],[774,51],[827,43],[872,44],[918,48],[968,44],[1014,49],[1065,51],[1118,51],[1171,50],[1223,48],[1273,47],[1322,49],[1373,47],[1422,48],[1472,48],[1522,51],[1575,50],[1627,45],[1674,38],[1714,47],[1763,42],[1807,47],[1856,51],[1909,45],[1956,41],[1999,41],[2042,41],[2085,49],[2136,45],[2183,41],[2226,49],[2277,46],[2325,45]];
const ME_SPR = 35, HIM_SPR = 34, CROWD_SPR = SPR.map((_, i) => i).filter(i => i !== ME_SPR && i !== HIM_SPR);
const SPR_H = 96, SPR_M = 3.6, SDX = -.5, SDY = -.58;
const atlas = new Image(), dark = document.createElement('canvas');
atlas.onload = () => { dark.width = atlas.width; dark.height = atlas.height; const d = dark.getContext('2d'); d.drawImage(atlas, 0, 0); d.globalCompositeOperation = 'source-in'; d.fillStyle = '#000'; d.fillRect(0, 0, dark.width, dark.height); atlas.ok = true; };
atlas.src = 'people.webp';

const ground = { c: document.createElement('canvas'), ok: false, lum: null, n: 192 };
ground.c.width = ground.c.height = 256 * NT;
{
  const g = ground.c.getContext('2d');
  let left = NT * NT;
  const done = () => {
    if (--left) return;
    ground.ok = true;
    try { const s = document.createElement('canvas'); s.width = s.height = ground.n; const sc = s.getContext('2d'); sc.drawImage(ground.c, 0, 0, ground.n, ground.n); const d = sc.getImageData(0, 0, ground.n, ground.n).data; ground.lum = new Float32Array(ground.n * ground.n); for (let i = 0; i < ground.lum.length; i++) ground.lum[i] = (d[i * 4] * .3 + d[i * 4 + 1] * .59 + d[i * 4 + 2] * .11) / 255; } catch {}
  };
  for (let j = 0; j < NT; j++) for (let i = 0; i < NT; i++) {
    const im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = () => { g.drawImage(im, i * 256, j * 256); done(); };
    im.onerror = done;
    im.src = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/19/${TY0 + j}/${TX0 + i}`;
  }
}
function drawGround() {
  const p = S(toW(0, 0)), sz = 256 * NT * MPP * cam.s;
  cx.drawImage(ground.c, p.x, p.y, sz, sz);
}
function lumAt(p) {
  if (!ground.lum) return .5;
  const gx = Math.floor((p.x / MPP + OX) / (256 * NT) * ground.n), gy = Math.floor((p.y / MPP + OY) / (256 * NT) * ground.n);
  return gx < 0 || gy < 0 || gx >= ground.n || gy >= ground.n ? .5 : ground.lum[gy * ground.n + gx];
}
function sprite(i, p, h, ph, moving) {
  const r = SPR[i], dh = SPR_M * cam.s, dw = dh * r[1] / SPR_H, q = S(p);
  if (q.x < -dh || q.x > W + dh || q.y < -dh || q.y > H + dh) return;
  const sh = Math.max(0, Math.min(.32, (.3 - lumAt(p)) / .25));
  cx.save(); cx.translate(q.x + SDX * dh * .32, q.y + SDY * dh * .32); cx.rotate(h + Math.PI / 2);
  cx.globalAlpha = .4 * (1 - sh * 1.5); if (cx.globalAlpha > 0) cx.drawImage(dark, r[0], 0, r[1], SPR_H, -dw / 2, -dh * .42, dw, dh * 1.1);
  cx.restore();
  cx.save(); cx.translate(q.x, q.y); cx.rotate(h + Math.PI / 2);
  if (moving) cx.scale(1, 1 + Math.sin(ph) * .035);
  cx.globalAlpha = 1; cx.drawImage(atlas, r[0], 0, r[1], SPR_H, -dw / 2, -dh * .42, dw, dh);
  if (sh > 0) { cx.globalAlpha = sh; cx.drawImage(dark, r[0], 0, r[1], SPR_H, -dw / 2, -dh * .42, dw, dh); }
  cx.restore(); cx.globalAlpha = 1;
}
function dayPos() {
  if (!day) return {};
  const t = mode === 'final' ? day.k * DT : simT;
  const me = lerpP(day.me, t), hp = day.him ? lerpP(day.him, t) : null;
  return { t, me, hp, cur: hp ? dist(me, hp) : day.d, past: t >= day.k * DT };
}
function drawPhoto() {
  cx.fillStyle = '#2b2e2d'; cx.fillRect(0, 0, W, H);
  if (ground.ok) drawGround();
  if (!atlas.ok) return;
  const pts = crowdPts();
  for (const p of pts) sprite(p.m.spr, p, p.h, clockT * 5.5 + p.m.ph, p.moving);
  const { me, hp } = dayPos();
  if (hp) sprite(HIM_SPR, hp, hp.h, clockT * 5.5 + 1, mode !== 'final');
  if (me) sprite(ME_SPR, me, me.h, clockT * 5.5, mode !== 'final');
  const g = cx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
  const c = day ? clock(day.t0 + dayPos().t) : '--:--:--';
  cx.font = `500 ${mobile() ? 10 : 11}px 'IBM Plex Mono', 'Noto Sans KR', monospace`; cx.textAlign = 'center'; cx.textBaseline = 'bottom';
  cx.fillStyle = 'rgba(0,0,0,.5)'; const txt = `REC  CAM-03 · 서울광장 · 37.5663°N 126.9779°E · ${c}`;
  const y = mobile() ? H - 188 : H - 26;
  cx.fillText(txt, W / 2 + 1, y + 1); cx.fillStyle = '#f2f2ee'; cx.fillText(txt, W / 2, y);
  if (Math.floor(clockT * 1.5) % 2 === 0) { cx.fillStyle = '#ff3b30'; cx.beginPath(); cx.arc(W / 2 - cx.measureText(txt).width / 2 - 9, y - 6, 3.5, 0, 7); cx.fill(); }
}
function hudOnly() {
  if (!day) return;
  const { t, cur, past } = dayPos();
  $('#hud').innerHTML = `<b>D+${comma(day.n)}</b> · ${dateOf(day.n)} · ${clock(day.t0 + t)}<br>지금 거리 ${fmtD(cur)} · 최단 ${past ? fmtD(day.d) : '—'}`;
}

const bufA = document.createElement('canvas'), bufB = document.createElement('canvas'), tmp1 = document.createElement('canvas'), tmp2 = document.createElement('canvas');
const actx = bufA.getContext('2d'), bctx = bufB.getContext('2d'), t1 = tmp1.getContext('2d'), t2 = tmp2.getContext('2d');
const noiseC = document.createElement('canvas'); noiseC.width = 160; noiseC.height = 100;
const nctx = noiseC.getContext('2d'), nimg = nctx.createImageData(160, 100);
const scanC = document.createElement('canvas'); scanC.width = 1; scanC.height = 3;
{ const s = scanC.getContext('2d'); s.fillStyle = 'rgba(0,0,0,.55)'; s.fillRect(0, 2, 1, 1); }
const scanPat = main.createPattern(scanC, 'repeat');
function scan(a) { main.globalAlpha = a; main.fillStyle = scanPat; main.fillRect(0, 0, cv.width, cv.height); main.globalAlpha = 1; }
function glitch(src, dst, g) {
  const C = cv.width, Hh = cv.height, k = Math.sin(g * Math.PI);
  main.drawImage(Math.random() < g ? dst : src, 0, 0);
  const n = 5 + Math.floor(k * 18);
  for (let i = 0; i < n; i++) {
    const y = Math.random() * Hh, h = (2 + Math.random() * 70) * DPR, off = (Math.random() - .5) * k * 180 * DPR;
    main.drawImage(Math.random() < g ? dst : src, 0, y, C, h, off, y, C, h);
  }
  if (k > .15) {
    for (const [t, col] of [[t1, '#f00'], [t2, '#0ff']]) { t.globalCompositeOperation = 'copy'; t.drawImage(cv, 0, 0); t.globalCompositeOperation = 'multiply'; t.fillStyle = col; t.fillRect(0, 0, C, Hh); t.globalCompositeOperation = 'source-over'; }
    const dx = k * 12 * DPR * (.5 + Math.random());
    main.fillStyle = '#000'; main.fillRect(0, 0, C, Hh);
    main.globalCompositeOperation = 'lighter'; main.drawImage(tmp1, dx, 0); main.drawImage(tmp2, -dx, 0); main.globalCompositeOperation = 'source-over';
  }
  const d = nimg.data;
  for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  nctx.putImageData(nimg, 0, 0);
  main.globalAlpha = .26 * k; main.imageSmoothingEnabled = false; main.drawImage(noiseC, 0, 0, C, Hh); main.imageSmoothingEnabled = true;
  main.globalAlpha = 1;
  for (let i = 0; i < 3; i++) { main.fillStyle = `rgba(${Math.random() < .5 ? '95,242,230' : '255,255,255'},${.5 * k})`; main.fillRect(0, Math.random() * Hh, C, (1 + Math.random() * 3) * DPR); }
  scan(.35 * k);
}
const vis = { cur: 'photo', t: 0, g: -1, to: 'digital' };
const startG = to => { vis.g = 0; vis.to = to; };
function render(dt) {
  const force = mode === 'ff' || mode === 'final';
  vis.t += dt;
  if (vis.g >= 0) { vis.g += dt / .65; if (vis.g >= 1) { vis.cur = vis.to; vis.g = -1; vis.t = 0; } }
  else if (force) { if (vis.cur === 'photo') startG('digital'); }
  else if (vis.cur === 'photo' && vis.t > 5.5) startG('digital');
  else if (vis.cur === 'digital' && vis.t > 3.4) startG('photo');
  const gl = vis.g >= 0, needA = gl || vis.cur === 'photo', needB = gl || vis.cur === 'digital';
  if (needA) { cx = actx; cx.setTransform(DPR, 0, 0, DPR, 0, 0); drawPhoto(); }
  if (needB) { cx = bctx; cx.setTransform(DPR, 0, 0, DPR, 0, 0); if (mode === 'ff') drawFF(); else if (day) drawDay(); else { floor(); drawCrowd(1); } }
  cx = main; cx.setTransform(1, 0, 0, 1, 0, 0);
  if (!gl) { cx.drawImage(vis.cur === 'photo' ? bufA : bufB, 0, 0); if (vis.cur === 'digital') scan(.12); }
  else glitch(vis.to === 'digital' ? bufA : bufB, vis.to === 'digital' ? bufB : bufA, vis.g);
  if (!needB) hudOnly();
}

let last = performance.now(), camFrom = null;
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  frameNo++;
  if (mode === 'ff') {
    ff.t += dt; clockT += dt * 3;
    const p = Math.min(1, ff.t / ff.dur), e = p * p * (3 - 2 * p);
    ff.cur = ff.start + Math.max(1, Math.round(e * ff.N));
    moveCrowd(dt * 8);
    ff.logT += dt;
    if (ff.logT > .09 && ff.cur - 1 > ff.last && p < 1) {
      ff.logT = 0;
      const n = ff.last + 1 + Math.floor(Math.random() * (ff.cur - 1 - ff.last));
      const s = quietDay(); addLog(n, s.d, noteFor(s.d, false)); ff.last = n;
    }
    if (!ff.life && ff.cur > 365 * LIFE) { ff.life = true; addLog(0, 0, `— 남은 ${LIFE}년이 지났다 —`, 'sep'); }
    if (p >= 1) { dayN = ff.start + ff.N; startDay(makeDay(dayN, true)); }
  } else if (mode === 'play') {
    const prev = simT, sd = dt * WIN / PLAY;
    simT = Math.min(WIN, simT + sd); clockT += sd;
    moveCrowd(sd);
    const tk = day.k * DT;
    if (day.meet && simT >= tk) { mode = 'final'; finT = 0; camFrom = { x: cam.x, y: cam.y, s: cam.s }; addLog(day.n, day.d, day.end, 'meet'); }
    else if (!day.meet && prev < tk && simT >= tk) addLog(day.n, day.d, day.note);
    if (simT >= WIN) mode = 'idle';
  } else if (mode === 'final') {
    finT += dt; clockT += dt * .4;
    moveCrowd(dt * .4);
    const z = Math.min(1, finT / 1.6), e = z * z * (3 - 2 * z);
    const m = day.me[day.k], h = day.him[day.k], tx = (m.x + h.x) / 2, ty = (m.y + h.y) / 2;
    const ts = Math.min(cam.base * 2.2, H * .16 / Math.max(.5, Math.abs(m.y - h.y)), W * .4 / Math.max(.5, Math.abs(m.x - h.x)));
    cam.s = camFrom.s + (ts - camFrom.s) * e;
    cam.x = camFrom.x + (tx - camFrom.x) * e; cam.y = camFrom.y + (ty - H * .07 / ts - camFrom.y) * e;
  } else { moveCrowd(dt); clockT += dt; }
  render(dt);
  requestAnimationFrame(frame);
}

function resize() {
  DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  for (const c of [cv, bufA, bufB, tmp1, tmp2]) { c.width = W * DPR; c.height = H * DPR; }
  const k = cam.s / cam.base || 1; cam.base = baseScale(); cam.s = cam.base * k;
}
addEventListener('resize', resize);

function seg(el, items, key) {
  el.innerHTML = '';
  items.forEach((it, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = it.k;
    b.classList.toggle('on', i === st[key]);
    b.onclick = () => { st[key] = i; [...el.children].forEach((c, j) => c.classList.toggle('on', j === i)); updateCalc(); };
    el.append(b);
  });
}
const cells = {};
let paint = null;
function hours(id, key) {
  const el = $('#' + id), tk = $('#t' + id.slice(1));
  el.innerHTML = ''; tk.innerHTML = '';
  cells[key] = [];
  for (let h = 0; h < 24; h++) {
    const c = document.createElement('div'); c.dataset.h = h; c.dataset.k = key; c.title = `${h}시`;
    el.append(c); cells[key].push(c);
    const s = document.createElement('span'); s.textContent = h; tk.append(s);
  }
  el.addEventListener('pointerdown', e => {
    const c = e.target.closest('[data-h]'); if (!c) return;
    paint = { key, on: !st[key].includes(+c.dataset.h) }; apply(c); e.preventDefault();
  });
}
function apply(c) {
  if (!paint || c.dataset.k !== paint.key) return;
  const h = +c.dataset.h, arr = st[paint.key];
  const i = arr.indexOf(h);
  if (paint.on && i < 0) arr.push(h); else if (!paint.on && i >= 0) arr.splice(i, 1);
  arr.sort((a, b) => a - b);
  refreshCells();
}
addEventListener('pointermove', e => { if (!paint) return; const c = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('[data-h]'); if (c) apply(c); });
addEventListener('pointerup', () => { paint = null; });
function refreshCells() {
  const sh = shared();
  for (const key of ['me', 'him']) cells[key].forEach((c, h) => { c.classList.toggle('on', st[key].includes(h)); c.classList.toggle('both', sh.includes(h)); });
  $('#cMe').textContent = `${st.me.length}시간`; $('#cHim').textContent = `${st.him.length}시간`;
  updateCalc();
}
function openModal() { $('#nmMe').value = st.nmMe; $('#nmHim').value = st.nmHim; seg($('#mPlace'), PLACES, 'place'); seg($('#mHaunt'), HAUNTS, 'haunt'); refreshCells(); $('#modal').classList.remove('hide'); }
$('#nmMe').oninput = e => { st.nmMe = e.target.value; updateCalc(); };
$('#nmHim').oninput = e => { st.nmHim = e.target.value; updateCalc(); };
$('#go').onclick = () => {
  save(); $('#modal').classList.add('hide');
  dayN = 0; logEl.innerHTML = ''; walkOne();
};
$('#edit').onclick = openModal;
$('#r').value = st.r;
$('#r').oninput = e => { st.r = +e.target.value; save(); updateCalc(); };
$('#walk').onclick = walkOne;
$('#until').onclick = startFF;

hours('hMe', 'me'); hours('hHim', 'him');
resize(); openModal();
document.fonts.ready.then(() => { spawnCrowd(); requestAnimationFrame(frame); });

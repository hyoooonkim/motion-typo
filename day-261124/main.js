const $ = s => document.querySelector(s);
const cv = document.createElement('canvas');
document.body.prepend(cv);
const cx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;

const PLACES = [
  { k: '같은 동네', A: 1.2, f: .6 },
  { k: '같은 구', A: 8, f: .35 },
  { k: '같은 도시', A: 90, f: .2 },
  { k: '다른 도시', A: 90, f: .004 },
];
const V = 5.7, WALK = 1.35, WIN = 180, DT = .5, PLAY = 12;
const st = { place: 1, hours: 2, r: 5 };
const LIFE = 50;

const overlapT = () => Math.min(st.hours, st.hours * st.hours / 14);
const lam = () => { const p = PLACES[st.place]; return 2 * (st.r / 1000) * V * overlapT() * p.f / p.A; };
const comma = n => Math.round(n).toLocaleString('en-US');

function pct(p) {
  const v = p * 100;
  if (v >= 99.995) return '99.99%';
  if (v >= 10) return v.toFixed(1) + '%';
  const dg = Math.max(2, -Math.floor(Math.log10(v)) + 1);
  return v.toFixed(dg) + '%';
}
function span(days) {
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
const clock = s => { s = Math.floor(s) % 86400; return [s / 3600, (s % 3600) / 60, s % 60].map(v => String(Math.floor(v)).padStart(2, '0')).join(':'); };
const BASE = new Date(2026, 10, 24);
const dateOf = n => { const d = new Date(BASE); d.setDate(d.getDate() + n - 1); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; };
const pick = a => a[Math.floor(Math.random() * a.length)];

function updateCalc() {
  const L = lam(), p = PLACES[st.place];
  $('#pday').textContent = pct(1 - Math.exp(-L));
  $('#every').textContent = span(1 / L);
  $('#life').textContent = `남은 ${LIFE}년 안에 한 번이라도 · ${pct(1 - Math.exp(-L * 365 * LIFE))}`;
  $('#formula').innerHTML = `λ = 2r · v · T · f ÷ A<br>= 2 × ${st.r}m × ${V}km/h × ${overlapT().toFixed(2)}h × ${p.f} ÷ ${p.A}km²<br>= 하루 ${L.toPrecision(2)}회 · 기체 분자 충돌 모형으로 단순화함`;
  $('#hoursV').textContent = `${st.hours}시간`;
  $('#rV').textContent = `${st.r}m`;
}

function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = rng(1124);
function lines() { const a = []; let v = -4000; while (v < 4000) { a.push({ v, major: R() < .14 }); v += 42 + R() * 78; } return a; }
const XL = lines(), YL = lines();
const XS = XL.map(l => l.v), YS = YL.map(l => l.v);

function nextLine(arr, c, dir) {
  if (dir > 0) { for (let i = 0; i < arr.length; i++) if (arr[i] > c + 1e-6) return arr[i]; }
  else { for (let i = arr.length - 1; i >= 0; i--) if (arr[i] < c - 1e-6) return arr[i]; }
  return null;
}
function step(w, d) {
  let guard = 0;
  while (d > 1e-9 && guard++ < 50) {
    const arr = w.ax === 0 ? XS : YS, c = w.ax === 0 ? w.x : w.y;
    const nx = nextLine(arr, c, w.dir);
    if (nx === null) { w.dir *= -1; continue; }
    const gap = Math.abs(nx - c);
    if (gap > d) { if (w.ax === 0) w.x += w.dir * d; else w.y += w.dir * d; return; }
    if (w.ax === 0) w.x = nx; else w.y = nx;
    d -= gap;
    if (Math.random() < (w.turn ?? .3)) { w.ax ^= 1; w.dir = Math.random() < .5 ? -1 : 1; }
  }
}
const near = (arr, v) => arr.reduce((b, a) => Math.abs(a - v) < Math.abs(b - v) ? a : b, arr[0]);
function walker(x, y, ax, sp) {
  ax ??= Math.random() < .5 ? 0 : 1;
  if (ax === 0) y = near(YS, y); else x = near(XS, x);
  return { x, y, ax, dir: Math.random() < .5 ? -1 : 1, sp: sp ?? WALK, turn: .3 };
}
function trace(w, secs) {
  const out = [{ x: w.x, y: w.y }];
  for (let t = 0; t < secs - 1e-9; t += DT) { step(w, w.sp * DT); out.push({ x: w.x, y: w.y }); }
  return out;
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function closest(me, him) {
  let best = Infinity, k = 0;
  for (let i = 0; i < me.length; i++) { const d = dist(me[i], him[i]); if (d < best) { best = d; k = i; } }
  return { d: best, k };
}

function himPath(me, k, P, ax, fdir) {
  const back = trace({ x: P.x, y: P.y, ax, dir: -fdir, sp: WALK, turn: .3 }, k * DT).reverse();
  const fwd = trace({ x: P.x, y: P.y, ax, dir: fdir, sp: WALK, turn: .3 }, (me.length - 1 - k) * DT);
  return back.concat(fwd.slice(1));
}
function sampleD(L) {
  const E = -Math.log(1 - Math.random());
  const p = PLACES[st.place];
  const far = st.place === 3 ? 120000 + Math.random() * 280000 : Math.sqrt(p.A) * 1000 * (.12 + Math.random() * .7);
  return E < L ? { meet: true, d: st.r * (.25 + .6 * Math.random()) } : { meet: false, d: Math.max(st.r * 1.05, Math.min(st.r * E / L, far)) };
}
function noteFor(d, meet) {
  if (meet) return '우연';
  if (d < st.r * 3) return pick(['그는 휴대폰을 보고 있었다.', '같은 방향, 몇 걸음 뒤.', '모자를 눌러쓰고 있었다.', '내가 먼저 골목으로 꺾었다.', '이어폰 때문에 못 들었다.']);
  if (d < 60) return pick(['길 건너편에 있었다.', '같은 횡단보도, 다른 신호.', '같은 정류장 반대편.']);
  if (d < 400) return pick(['같은 블록에 있었다.', '같은 노래가 들리는 거리.', '같은 편의점 앞을 10분 차이로.']);
  if (d < 100000) return '아무 일도 없었다.';
  return '다른 하늘 아래.';
}

const ENDINGS = ['둘 다 못 본 척했다.', '눈이 마주쳤다. 3초.', '그가 먼저 고개를 돌렸다.', '“어… 안녕.”', '아무 말도 하지 않았다.', '나는 머리를 안 감은 날이었다.'];
function axisAt(me, k) {
  const a = me[k], b = me[Math.min(k + 1, me.length - 1)];
  const onY = YS.some(v => Math.abs(v - a.y) < 1e-6), onX = XS.some(v => Math.abs(v - a.x) < 1e-6);
  const dx = b.x - a.x, dy = b.y - a.y;
  if (onY && (Math.abs(dx) >= Math.abs(dy) || !onX)) return { ax: 0, dir: Math.sign(dx) || 1 };
  return { ax: 1, dir: Math.sign(dy) || 1 };
}
function makeDay(n, force) {
  const s = force ? { meet: true, d: st.r * (.25 + .6 * Math.random()) } : sampleD(lam());
  const me = trace(walker((Math.random() - .5) * 400, (Math.random() - .5) * 400), WIN);
  let k = Math.round((WIN / 2 + (Math.random() - .5) * 50) / DT);
  const a = me[k], m = axisAt(me, k);
  let him = null, d = s.d, ang = Math.random() * Math.PI * 2;
  const along = sg => m.ax === 0 ? { x: a.x + sg * d, y: a.y } : { x: a.x, y: a.y + sg * d };
  if (s.meet) {
    him = himPath(me, k, along(m.dir), m.ax, -m.dir);
  } else if (d <= 1500) {
    let best = null;
    for (let i = 0; i < 24; i++) {
      let h;
      if (d < st.r * 3) { const sg = Math.random() < .5 ? -1 : 1; h = himPath(me, k, along(sg), m.ax, m.dir); }
      else {
        const P = { x: a.x + d * Math.cos(ang + i), y: a.y + d * Math.sin(ang + i) };
        const nx = near(XS, P.x), ny = near(YS, P.y);
        const ax = Math.abs(nx - P.x) < Math.abs(ny - P.y) ? 1 : 0;
        if (ax === 1) P.x = nx; else P.y = ny;
        h = himPath(me, k, P, ax, Math.random() < .5 ? -1 : 1);
      }
      const c = closest(me, h);
      if (c.d < st.r) continue;
      const score = Math.abs(Math.log(c.d / d));
      if (!best || score < best.score) best = { h, c, score };
      if (score < .15) break;
    }
    if (best) { him = best.h; d = best.c.d; k = best.c.k; }
  }
  return { n, meet: s.meet, d, k, me, him, ang, t0: (8 + Math.random() * 14) * 3600 - k * DT, note: noteFor(d, s.meet), end: pick(ENDINGS) };
}

let mode = 'idle', day = null, simT = 0, finT = 0, dayN = 0, ff = null, crowd = [];
const cam = { x: 0, y: 0, s: 1, base: 1 };
const mobile = () => W < 640;
function baseScale() { return Math.min(W, H * 1.1) / (mobile() ? 420 : 640); }
function viewHalf() { return { hw: W / 2 / cam.base + 160, hh: H / 2 / cam.base + 160 }; }
function spawnOne(outside) {
  const { hw, hh } = viewHalf();
  for (let i = 0; i < 12; i++) {
    const x = cam.x + (Math.random() * 2 - 1) * hw, y = cam.y + (Math.random() * 2 - 1) * hh;
    if (outside && Math.abs(x - cam.x) < hw - 160 && Math.abs(y - cam.y) < hh - 160) continue;
    const w = walker(x, y, undefined, 1.05 + Math.random() * .55);
    w.turn = .25 + Math.random() * .2;
    return w;
  }
  return walker(cam.x + hw, cam.y, 1);
}
function spawnCrowd() { crowd = Array.from({ length: mobile() ? 170 : 300 }, () => spawnOne(false)); }
function moveCrowd(dts) {
  const { hw, hh } = viewHalf();
  for (let i = 0; i < crowd.length; i++) {
    const w = crowd[i];
    step(w, w.sp * dts);
    if (Math.abs(w.x - cam.x) > hw || Math.abs(w.y - cam.y) > hh) crowd[i] = spawnOne(true);
  }
}

function startDay(d) {
  day = d; simT = 0; finT = 0; mode = 'play';
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of d.me) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
  cam.x = (x0 + x1) / 2; cam.y = (y0 + y1) / 2; cam.s = cam.base;
  spawnCrowd();
  $('#walk').disabled = $('#until').disabled = false;
}
function walkOne() { dayN++; startDay(makeDay(dayN)); }
function startFF() {
  const L = lam();
  const N = Math.max(1, Math.ceil(-Math.log(1 - Math.random()) / L));
  ff = { start: dayN, N, t: 0, dur: Math.min(9, 2.4 + Math.log10(N) * 1.3), last: dayN, logT: 0, life: dayN > 365 * LIFE };
  mode = 'ff'; day = null;
  $('#walk').disabled = $('#until').disabled = true;
}

const logEl = $('#days');
function addLog(n, d, note, cls) {
  const li = document.createElement('li');
  if (cls) li.className = cls;
  if (cls === 'sep') li.textContent = note;
  else li.innerHTML = `<span>D+${comma(n)}</span><span class="d">${fmtD(d)}</span><span class="t">${note}</span>`;
  logEl.prepend(li);
  while (logEl.children.length > 11) logEl.lastChild.remove();
}

const INK = '#1c1c1c', HIM = '#e2552f';
const S = p => ({ x: (p.x - cam.x) * cam.s + W / 2, y: (p.y - cam.y) * cam.s + H / 2 });
const lerpP = (arr, t) => { const f = Math.min(arr.length - 1, t / DT), i = Math.floor(f), j = Math.min(arr.length - 1, i + 1), u = f - i; return { x: arr[i].x + (arr[j].x - arr[i].x) * u, y: arr[i].y + (arr[j].y - arr[i].y) * u }; };

function drawMap(alpha) {
  cx.fillStyle = '#e6e4dc'; cx.fillRect(0, 0, W, H);
  cx.fillStyle = '#f6f5f1';
  const x0 = cam.x - W / 2 / cam.s, x1 = cam.x + W / 2 / cam.s, y0 = cam.y - H / 2 / cam.s, y1 = cam.y + H / 2 / cam.s;
  for (const l of XL) if (l.v > x0 - 20 && l.v < x1 + 20) { const w = (l.major ? 15 : 8) * cam.s; cx.fillRect(S({ x: l.v, y: 0 }).x - w / 2, 0, w, H); }
  for (const l of YL) if (l.v > y0 - 20 && l.v < y1 + 20) { const w = (l.major ? 15 : 8) * cam.s; cx.fillRect(0, S({ x: 0, y: l.v }).y - w / 2, W, w); }
  cx.globalAlpha = alpha; cx.fillStyle = '#a19e95';
  const r = Math.max(1.4, Math.min(3.2, 1.3 * cam.s));
  for (const w of crowd) { const p = S(w); if (p.x > -5 && p.x < W + 5 && p.y > -5 && p.y < H + 5) { cx.beginPath(); cx.arc(p.x, p.y, r, 0, 7); cx.fill(); } }
  cx.globalAlpha = 1;
}
function trail(arr, t, col) {
  const n = Math.min(arr.length - 1, Math.floor(t / DT));
  cx.strokeStyle = col; cx.lineWidth = 1.4; cx.globalAlpha = .5; cx.beginPath();
  for (let i = 0; i <= n; i++) { const p = S(arr[i]); i ? cx.lineTo(p.x, p.y) : cx.moveTo(p.x, p.y); }
  const e = S(lerpP(arr, t)); cx.lineTo(e.x, e.y); cx.stroke(); cx.globalAlpha = 1;
}
function dot(p, col, label, big, left) {
  cx.fillStyle = col; cx.beginPath(); cx.arc(p.x, p.y, big ? 6 : 4.5, 0, 7); cx.fill();
  cx.strokeStyle = '#f6f5f1'; cx.lineWidth = 1.5; cx.stroke();
  cx.font = `500 ${big ? 15 : 12}px 'Noto Sans KR', sans-serif`; cx.textAlign = left ? 'right' : 'left'; cx.textBaseline = 'middle';
  cx.fillText(label, p.x + (left ? -1 : 1) * (big ? 11 : 8), p.y - (big ? 11 : 8));
}
function edgeArrow(from, ang, label) {
  const dx = Math.cos(ang), dy = Math.sin(ang), Rr = Math.min(W, H) * (mobile() ? .3 : .26);
  const x = from.x + dx * Rr, y = from.y + dy * Rr;
  cx.save(); cx.translate(x, y); cx.rotate(ang); cx.fillStyle = HIM;
  cx.beginPath(); cx.moveTo(9, 0); cx.lineTo(-6, -6); cx.lineTo(-6, 6); cx.closePath(); cx.fill(); cx.restore();
  cx.setLineDash([2, 5]); cx.strokeStyle = HIM; cx.globalAlpha = .5; cx.lineWidth = 1;
  cx.beginPath(); cx.moveTo(from.x, from.y); cx.lineTo(x - dx * 14, y - dy * 14); cx.stroke(); cx.setLineDash([]); cx.globalAlpha = 1;
  cx.fillStyle = HIM; cx.font = `500 12px 'IBM Plex Mono', 'Noto Sans KR', monospace`;
  cx.textAlign = dx > .3 ? 'left' : dx < -.3 ? 'right' : 'center'; cx.textBaseline = dy > .3 ? 'top' : dy < -.3 ? 'bottom' : 'middle';
  cx.fillText(label, x + dx * 14, y + dy * 14);
}
function connector(a, b, d) {
  cx.setLineDash([3, 4]); cx.strokeStyle = INK; cx.globalAlpha = .45; cx.lineWidth = 1;
  cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke(); cx.setLineDash([]); cx.globalAlpha = 1;
  if (dist(a, b) > 50) { cx.fillStyle = INK; cx.font = `500 11px 'IBM Plex Mono', monospace`; cx.textAlign = 'center'; cx.textBaseline = 'bottom'; cx.fillText(fmtD(d), (a.x + b.x) / 2, (a.y + b.y) / 2 - 4); }
}
const inView = p => p.x > 20 && p.x < W - 20 && p.y > 20 && p.y < H - 20;

function drawDay() {
  const t = mode === 'final' ? day.k * DT : simT;
  const fz = mode === 'final' ? Math.min(1, finT / 1.6) : 0, ez = fz * fz * (3 - 2 * fz);
  drawMap(1 - ez * .75);
  const me = lerpP(day.me, t), sm = S(me);
  if (day.him) trail(day.him, t, HIM);
  trail(day.me, t, INK);
  const past = t >= day.k * DT;
  let cur;
  if (day.him) {
    const hp = lerpP(day.him, t), sh = S(hp); cur = dist(me, hp);
    if (inView(sh)) { if (mode !== 'final') connector(sm, sh, cur); dot(sh, HIM, '그', mode === 'final', true); }
    else edgeArrow(sm, Math.atan2(sh.y - sm.y, sh.x - sm.x), `그 · ${fmtD(cur)}`);
    if (past && !day.meet) {
      const a = S(day.me[day.k]), b = S(day.him[day.k]);
      cx.strokeStyle = HIM; cx.lineWidth = 1; [a, b].forEach(p => { cx.beginPath(); cx.arc(p.x, p.y, 7, 0, 7); cx.stroke(); });
      cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke();
      cx.fillStyle = HIM; cx.font = `500 11px 'IBM Plex Mono', 'Noto Sans KR', monospace`; cx.textAlign = 'left'; cx.textBaseline = 'top';
      cx.fillText(`최단 ${fmtD(day.d)} · ${clock(day.t0 + day.k * DT)}`, Math.max(a.x, b.x) + 11, Math.max(a.y, b.y) + 6);
    }
  } else { cur = day.d; edgeArrow(sm, day.ang, `그 · ${fmtD(day.d)}`); }
  dot(sm, INK, '나', mode === 'final');
  $('#hud').innerHTML = `<b>D+${comma(day.n)}</b> · ${dateOf(day.n)} · ${clock(day.t0 + t)}<br>지금 거리 ${fmtD(cur)} · 최단 ${past ? fmtD(day.d) : '—'}`;
  if (mode === 'final') drawFinal(ez);
}
function drawFinal(ez) {
  const a = Math.max(0, Math.min(1, (finT - 1.3) / 1.2)), b = Math.max(0, Math.min(1, (finT - 2.3) / 1));
  if (!a) return;
  const fs = Math.min(W * .3, H * .24);
  cx.save(); cx.globalAlpha = a; cx.fillStyle = INK; cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
  cx.font = `900 ${fs}px 'Noto Sans KR', sans-serif`;
  cx.translate(W / 2, H / 2 - 34); cx.scale(1 + (1 - a) * .04, 1 + (1 - a) * .04); cx.fillText('우연', 0, 0); cx.restore();
  cx.globalAlpha = b; cx.fillStyle = INK; cx.textAlign = 'center'; cx.textBaseline = 'top';
  const y = H / 2 + 34;
  cx.font = `500 ${mobile() ? 11 : 13}px 'IBM Plex Mono', 'Noto Sans KR', monospace`;
  cx.fillText(`${comma(day.n)}일째 · ${dateOf(day.n)} ${clock(day.t0 + day.k * DT)} · ${day.d.toFixed(1)}m`, W / 2, y);
  cx.font = `500 ${mobile() ? 13 : 15}px 'Noto Sans KR', sans-serif`; cx.fillStyle = HIM;
  cx.fillText(day.end, W / 2, y + 24);
  cx.globalAlpha = 1;
}

function drawFF() {
  drawMap(.55);
  cx.fillStyle = 'rgba(241,240,235,.5)'; cx.fillRect(0, 0, W, H);
  const n = ff.cur ?? ff.start;
  cx.fillStyle = INK; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.font = `600 ${mobile() ? 40 : 72}px 'IBM Plex Mono', monospace`;
  cx.fillText(`D+${comma(n)}`, W / 2, H / 2 - 10);
  cx.font = `500 ${mobile() ? 13 : 16}px 'Noto Sans KR', sans-serif`; cx.fillStyle = '#6d6a62';
  cx.fillText(`${elapsed(n)} · 아직 못 만났다`, W / 2, H / 2 + (mobile() ? 26 : 44));
  $('#hud').innerHTML = `<b>D+${comma(n)}</b> · ${dateOf(Math.max(1, n))}<br>빨리 감는 중`;
}
function quietDay() { let s; do s = sampleD(lam()); while (s.meet); return s; }

let last = performance.now(), camFrom = null;
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (mode === 'ff') {
    ff.t += dt;
    const p = Math.min(1, ff.t / ff.dur), e = p * p * (3 - 2 * p);
    ff.cur = ff.start + Math.max(1, Math.round(e * ff.N));
    moveCrowd(dt * 60);
    ff.logT += dt;
    if (ff.logT > .09 && ff.cur - 1 > ff.last && p < 1) {
      ff.logT = 0;
      const n = ff.last + 1 + Math.floor(Math.random() * (ff.cur - 1 - ff.last));
      const s = quietDay(); addLog(n, s.d, noteFor(s.d, false)); ff.last = n;
    }
    if (!ff.life && ff.cur > 365 * LIFE) { ff.life = true; addLog(0, 0, `— 남은 ${LIFE}년이 지났다 —`, 'sep'); }
    if (p >= 1) { dayN = ff.start + ff.N; startDay(makeDay(dayN, true)); }
  } else if (mode === 'play') {
    const prev = simT;
    simT = Math.min(WIN, simT + dt * WIN / PLAY);
    moveCrowd(dt * WIN / PLAY);
    const tk = day.k * DT;
    if (day.meet && simT >= tk) { mode = 'final'; finT = 0; camFrom = { x: cam.x, y: cam.y, s: cam.s }; addLog(day.n, day.d, day.end, 'meet'); }
    else if (!day.meet && prev < tk && simT >= tk) addLog(day.n, day.d, day.note);
    if (simT >= WIN) mode = 'idle';
  } else if (mode === 'final') {
    finT += dt;
    moveCrowd(dt * .6);
    const z = Math.min(1, finT / 1.6), e = z * z * (3 - 2 * z);
    const m = day.me[day.k], h = day.him[day.k], tx = (m.x + h.x) / 2, ty = (m.y + h.y) / 2;
    cam.x = camFrom.x + (tx - camFrom.x) * e; cam.y = camFrom.y + (ty - camFrom.y) * e;
    cam.s = camFrom.s + (cam.base * (mobile() ? 4 : 4.5) - camFrom.s) * e;
  } else moveCrowd(dt);
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (mode === 'ff') drawFF(); else if (day) drawDay(); else drawMap(1);
  requestAnimationFrame(frame);
}

function resize() {
  DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  cv.width = W * DPR; cv.height = H * DPR;
  const k = cam.s / cam.base || 1; cam.base = baseScale(); cam.s = cam.base * k;
}
addEventListener('resize', resize);

const seg = $('#place');
PLACES.forEach((p, i) => {
  const b = document.createElement('button'); b.textContent = p.k;
  b.onclick = () => { st.place = i; [...seg.children].forEach((c, j) => c.classList.toggle('on', j === i)); updateCalc(); };
  seg.append(b);
});
seg.children[st.place].classList.add('on');
$('#hours').oninput = e => { st.hours = +e.target.value; updateCalc(); };
$('#r').oninput = e => { st.r = +e.target.value; updateCalc(); };
$('#walk').onclick = walkOne;
$('#until').onclick = startFF;

resize(); updateCalc();
document.fonts.ready.then(() => { walkOne(); requestAnimationFrame(frame); });

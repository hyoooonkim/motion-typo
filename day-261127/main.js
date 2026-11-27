const $ = s => document.querySelector(s);
const cv = document.createElement('canvas'); document.body.prepend(cv);
const cx = cv.getContext('2d');
const TIME = 50;
let W = 0, H = 0, DPR = 1, DW = 1600, DH = 1000, S = 1, OX = 0, OY = 0, port = false;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

const LINES = [
  ['이번 분기 프로젝트는 예정보다'],
  [['늣게', '늦게'], ' 시작되었으나 모든 팀의'],
  ['협조로 ', ['무사이', '무사히'], ' 마무리되었다.'],
  ['특히 사용자 ', ['검중', '검증'], ' 단계에서'],
  ['많은 개선점을 발견하였다.'],
  ['다음 분기에는 일정 관리를'],
  [['철쩌히', '철저히'], ' 하여 마감 직전에'],
  ['몰아서 일하는 일이 없도록'],
  [['하겟다', '하겠다'], '.'],
];
const NOTES = [['메일 회신', '#ffe066'], ['회의록 정리', '#ffb3c7'], ['견적서!!', '#a8e6cf'], ['전화 걸기', '#9ad0ff'], ['백업 꼭', '#ffd19a']];
const TASKS = [
  { k: 'coffee', t: '엎지른 커피 닦기' },
  { k: 'typo', t: '문서 오타 고치기' },
  { k: 'crumb', t: '지우개 가루 털기' },
  { k: 'stamp', t: '결재 서류 도장 찍기' },
  { k: 'note', t: '포스트잇 다 버리기' },
];

const L = {
  land: { DW: 1600, DH: 1000, memo: [40, 70, 300, 350, -.03], doc: [380, 100, 470, 640, -.025], sketch: [930, 110, 430, 320, .05],
    forms: [[880, 500, 200, 270, -.07], [1095, 520, 200, 270, .04], [1310, 480, 200, 270, -.03]], coffee: [600, 820, 125], mug: [820, 900], bin: [1470, 880, 82],
    notes: [60, 470, 1380, 960], clock: [800, 52] },
  port: { DW: 1000, DH: 1600, memo: [30, 110, 280, 330, -.03], doc: [480, 120, 470, 640, .02], sketch: [40, 800, 430, 320, -.04],
    forms: [[50, 1170, 200, 270, -.06], [330, 1190, 200, 270, .04], [610, 1160, 200, 270, -.03]], coffee: [720, 900, 120], mug: [880, 1050], bin: [880, 1500, 82],
    notes: [40, 480, 900, 1480], clock: [500, 60] },
};
let LY = L.land;

const paper = (a, extra = {}) => ({ x: a[0], y: a[1], w: a[2], h: a[3], rot: a[4], ...extra });
function toLocal(p, px, py) {
  const cxp = p.x + p.w / 2, cyp = p.y + p.h / 2, c = Math.cos(-p.rot), s = Math.sin(-p.rot), dx = px - cxp, dy = py - cyp;
  return { x: dx * c - dy * s + p.w / 2, y: dx * s + dy * c + p.h / 2 };
}
const inside = (p, px, py) => { const l = toLocal(p, px, py); return l.x >= 0 && l.y >= 0 && l.x <= p.w && l.y <= p.h; };
function withPaper(p, f) { cx.save(); cx.translate(p.x + p.w / 2, p.y + p.h / 2); cx.rotate(p.rot); cx.translate(-p.w / 2, -p.h / 2); f(); cx.restore(); }
function sheet(p, col = '#fbf8f1', lift = 1) {
  withPaper(p, () => {
    cx.shadowColor = 'rgba(30,15,5,.45)'; cx.shadowBlur = 14 * lift; cx.shadowOffsetX = 4 * lift; cx.shadowOffsetY = 7 * lift;
    cx.fillStyle = col; cx.fillRect(0, 0, p.w, p.h); cx.shadowColor = 'transparent';
  });
}

let st, M, mctx, mask0 = 1, maskLeft = 1;
function blob(c, x, y, r, n = 14, j = .32) {
  c.beginPath();
  const pts = Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return [x + Math.cos(a) * r * (1 + rnd(-j, j)), y + Math.sin(a) * r * (1 + rnd(-j, j))]; });
  pts.forEach((p, i) => { const q = pts[(i + 1) % n], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; i ? c.quadraticCurveTo(p[0], p[1], mx, my) : c.moveTo(mx, my); });
  const p = pts[0], q = pts[1]; c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); c.closePath();
}
function countMask() {
  const d = mctx.getImageData(0, 0, M.width, M.height).data; let n = 0;
  for (let i = 3; i < d.length; i += 16) n += d[i];
  return n;
}
function newRound() {
  port = innerWidth < innerHeight; LY = port ? L.port : L.land; DW = LY.DW; DH = LY.DH;
  const memo = paper(LY.memo), doc = paper(LY.doc), sketch = paper(LY.sketch);
  const forms = LY.forms.map(f => paper(f, { done: 0, t: 0 }));
  const [cxo, cyo, cr] = LY.coffee;
  M = document.createElement('canvas'); M.width = DW / 2; M.height = DH / 2; mctx = M.getContext('2d');
  mctx.fillStyle = 'rgba(92,52,22,.88)'; blob(mctx, cxo / 2, cyo / 2, cr / 2, 16, .38); mctx.fill();
  for (let i = 0; i < 6; i++) { const a = rnd(0, 6.3), d = rnd(1.05, 1.5) * cr; blob(mctx, (cxo + Math.cos(a) * d) / 2, (cyo + Math.sin(a) * d) / 2, rnd(5, 16) / 2, 9, .3); mctx.fill(); }
  mctx.strokeStyle = 'rgba(60,30,10,.6)'; mctx.lineWidth = 2; blob(mctx, cxo / 2, cyo / 2, cr / 2 * .9, 16, .3); mctx.stroke();
  mask0 = countMask(); maskLeft = 1;
  const typos = []; const crumbs = [];
  for (let i = 0; i < 34; i++) {
    const l = { x: rnd(30, sketch.w - 30), y: rnd(30, sketch.h - 30) }, c = Math.cos(sketch.rot), s = Math.sin(sketch.rot), dx = l.x - sketch.w / 2, dy = l.y - sketch.h / 2;
    crumbs.push({ x: sketch.x + sketch.w / 2 + dx * c - dy * s, y: sketch.y + sketch.h / 2 + dx * s + dy * c, vx: 0, vy: 0, a: rnd(0, 6.3), len: rnd(6, 15), off: 0 });
  }
  const [nx0, ny0, nx1, ny1] = LY.notes, bin = LY.bin, notes = [];
  NOTES.forEach(([t, c]) => {
    let x, y, k = 0;
    do { x = rnd(nx0, nx1 - 130); y = rnd(ny0, ny1 - 130); k++; } while (k < 60 && (Math.hypot(x + 65 - bin[0], y + 65 - bin[1]) < bin[2] + 120 || notes.some(n => Math.hypot(n.x - x, n.y - y) < 150)));
    notes.push({ x, y, w: 130, h: 130, rot: rnd(-.25, .25), t, c, binned: 0, k: 0 });
  });
  st = { mode: 'ready', t: TIME, memo, doc, sketch, forms, typos, crumbs, notes, bin, done: {}, doneAt: {}, fx: [], drag: null, shake: 0, result: 0 };
  resize();
}

let deskPat = null;
function desk() {
  if (!deskPat) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 512; const x = c.getContext('2d');
    x.fillStyle = '#6b4a31'; x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 120; i++) { const y = Math.random() * 512, h = rnd(1, 6); x.fillStyle = `rgba(${Math.random() < .5 ? '40,22,10' : '150,105,70'},${rnd(.05, .18)})`; x.beginPath(); x.moveTo(0, y); for (let X = 0; X <= 512; X += 32) x.lineTo(X, y + Math.sin(X * .02 + i) * 3); x.lineTo(512, y + h); x.lineTo(0, y + h); x.fill(); }
    const d = x.getImageData(0, 0, 512, 512); for (let i = 0; i < d.data.length; i += 4) { const n = (Math.random() - .5) * 10; d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n; } x.putImageData(d, 0, 0);
    deskPat = cx.createPattern(c, 'repeat');
  }
  cx.fillStyle = deskPat; cx.fillRect(-OX / S, -OY / S, W / S, H / S);
}
const PEN = "'Nanum Pen Script', cursive";
function drawMemo() {
  const p = st.memo; sheet(p, '#fffbea');
  withPaper(p, () => {
    cx.fillStyle = 'rgba(200,60,60,.75)'; cx.beginPath(); cx.arc(p.w / 2, 16, 9, 0, 7); cx.fill();
    cx.fillStyle = '#2b2b33'; cx.font = `44px ${PEN}`; cx.textBaseline = 'alphabetic'; cx.textAlign = 'left'; cx.fillText('오늘 마감 전에!', 26, 70);
    cx.strokeStyle = 'rgba(80,120,200,.25)'; cx.lineWidth = 1; for (let y = 96; y < p.h - 10; y += 50) { cx.beginPath(); cx.moveTo(18, y + 26); cx.lineTo(p.w - 18, y + 26); cx.stroke(); }
    TASKS.forEach((tk, i) => {
      const y = 112 + i * 50, done = st.done[tk.k], k = done ? Math.min(1, (now - st.doneAt[tk.k]) / 350) : 0;
      cx.strokeStyle = '#2b2b33'; cx.lineWidth = 2; cx.strokeRect(24, y - 4, 20, 20);
      cx.fillStyle = done ? 'rgba(43,43,51,.45)' : '#2b2b33'; cx.font = `30px ${PEN}`; cx.fillText(tk.t + prog(tk.k), 56, y + 16);
      if (done) {
        cx.strokeStyle = '#d4362c'; cx.lineWidth = 3.5; cx.lineCap = 'round';
        cx.beginPath(); cx.moveTo(26, y + 6); cx.lineTo(33, y + 14); cx.lineTo(33 + 16 * k, y - 8 - 2 * k); cx.stroke();
        const tw = cx.measureText(tk.t + prog(tk.k)).width; cx.lineWidth = 2.5; cx.beginPath(); cx.moveTo(52, y + 6); cx.lineTo(52 + (tw + 8) * k, y + 3); cx.stroke();
      }
    });
  });
}
function prog(k) {
  if (k === 'typo') return ` ${st.typos.filter(t => t.fixed).length}/5`;
  if (k === 'stamp') return ` ${st.forms.filter(f => f.done).length}/3`;
  if (k === 'note') return ` ${st.notes.filter(n => n.binned).length}/5`;
  if (k === 'coffee') return ` ${Math.round((1 - maskLeft) * 100)}%`;
  if (k === 'crumb') { const n = st.crumbs.filter(c => !c.off).length; return n ? ` ${n}개` : ''; }
  return '';
}
function drawDoc() {
  const p = st.doc; sheet(p);
  withPaper(p, () => {
    cx.fillStyle = '#1d1d22'; cx.font = `900 30px 'Noto Serif KR', serif`; cx.textAlign = 'left'; cx.textBaseline = 'alphabetic';
    cx.fillText('하반기 결산 보고서', 40, 74);
    cx.fillStyle = '#8a8578'; cx.font = `500 15px 'Noto Sans KR', sans-serif`; cx.fillText('작성 2026.11.27 · 제출 기한 오늘 24:00', 40, 104);
    cx.fillStyle = '#1d1d22'; cx.fillRect(40, 120, p.w - 80, 2);
    let ti = 0; const first = !st.typos.length;
    LINES.forEach((ln, li) => {
      let x = 40; const y = 172 + li * 46; cx.font = `500 22px 'Noto Serif KR', serif`;
      ln.forEach(tok => {
        if (typeof tok === 'string') { cx.fillStyle = '#26262c'; cx.fillText(tok, x, y); x += cx.measureText(tok).width; return; }
        if (first) st.typos.push({ wrong: tok[0], right: tok[1], fixed: 0, at: 0 });
        const t = st.typos[ti++], txt = t.fixed ? t.right : t.wrong, w = cx.measureText(txt).width;
        t.box = [x - 4, y - 26, w + 8, 36];
        if (!t.fixed) {
          cx.fillStyle = '#26262c'; cx.fillText(txt, x, y);
          cx.strokeStyle = '#e0362c'; cx.lineWidth = 2; cx.beginPath(); for (let X = 0; X <= w; X += 3) cx.lineTo(x + X, y + 6 + Math.sin(X * .7) * 2); cx.stroke();
        } else {
          const k = Math.min(1, (now - t.at) / 300); cx.globalAlpha = k; cx.fillStyle = '#1f4fa8'; cx.fillText(txt, x, y); cx.globalAlpha = 1;
        }
        x += w;
      });
    });
    cx.fillStyle = '#b5afa1'; cx.font = `500 14px 'Noto Sans KR', sans-serif`; cx.fillText('— 1 —', p.w / 2 - 20, p.h - 30);
  });
}
function drawSketch() {
  const p = st.sketch; sheet(p, '#f7f3ea');
  withPaper(p, () => {
    cx.strokeStyle = 'rgba(70,70,80,.55)'; cx.lineWidth = 1.6; cx.lineCap = 'round';
    cx.beginPath(); cx.rect(60, 60, 150, 110); cx.moveTo(250, 70); cx.lineTo(370, 70); cx.moveTo(250, 100); cx.lineTo(350, 100); cx.moveTo(250, 130); cx.lineTo(330, 130); cx.stroke();
    cx.beginPath(); cx.moveTo(60, 230); cx.bezierCurveTo(140, 190, 220, 280, 370, 220); cx.stroke();
    cx.fillStyle = 'rgba(70,70,80,.5)'; cx.font = `30px ${PEN}`; cx.fillText('시안 B — 이거로?', 70, 290);
    cx.fillStyle = 'rgba(70,70,80,.12)'; for (let i = 0; i < 5; i++) { cx.save(); cx.translate(rnd0(i) * p.w, 30 + rnd0(i + 9) * (p.h - 60)); cx.rotate(rnd0(i + 3) * 3); cx.fillRect(-26, -8, 52, 16); cx.restore(); }
  });
}
const rnd0 = i => { const v = Math.sin(i * 91.7 + 13.1) * 43758.5; return v - Math.floor(v); };
function drawForms() {
  st.forms.forEach((f, i) => {
    sheet(f, '#fdfcf8', .8);
    withPaper(f, () => {
      cx.fillStyle = '#1d1d22'; cx.font = `900 24px 'Noto Serif KR', serif`; cx.textAlign = 'center'; cx.textBaseline = 'alphabetic'; cx.fillText('결 재', f.w / 2, 46);
      cx.font = `500 13px 'Noto Sans KR', sans-serif`; cx.fillStyle = '#5b574f'; cx.fillText(['예산 집행 요청', '외주 계약 연장', '연차 사용 신청'][i], f.w / 2, 70);
      const cw = (f.w - 40) / 3; cx.strokeStyle = '#3d3a35'; cx.lineWidth = 1.2;
      ['담당', '팀장', '대표'].forEach((t, j) => { cx.strokeRect(20 + j * cw, 90, cw, 24); cx.strokeRect(20 + j * cw, 114, cw, 56); cx.fillStyle = '#3d3a35'; cx.fillText(t, 20 + j * cw + cw / 2, 107); });
      cx.fillStyle = 'rgba(60,60,70,.35)'; for (let k = 0; k < 6; k++) cx.fillRect(22, 192 + k * 12, (f.w - 44) * (.5 + rnd0(i * 7 + k) * .5), 4);
      if (f.done) {
        const k = Math.min(1, (now - f.at) / 180), sc = 1 + (1 - k) * .8;
        cx.save(); cx.translate(20 + cw * 2 + cw / 2, 142); cx.rotate(f.sr); cx.scale(sc, sc); cx.globalAlpha = .85 * k;
        cx.strokeStyle = '#d2251f'; cx.fillStyle = '#d2251f'; cx.lineWidth = 3; cx.beginPath(); cx.arc(0, 0, 24, 0, 7); cx.stroke();
        cx.font = `900 17px 'Noto Serif KR', serif`; cx.textBaseline = 'middle'; cx.fillText('승인', 0, 1); cx.restore();
      }
    });
  });
}

function drawCoffee() { cx.drawImage(M, 0, 0, DW, DH); }
function drawMug() {
  const [x, y] = LY.mug;
  cx.save(); cx.translate(x, y); cx.rotate(-.55);
  cx.shadowColor = 'rgba(20,10,0,.5)'; cx.shadowBlur = 16; cx.shadowOffsetX = 5; cx.shadowOffsetY = 8;
  cx.fillStyle = '#f2efe8'; cx.beginPath(); cx.roundRect(-70, -42, 140, 84, 14); cx.fill(); cx.shadowColor = 'transparent';
  cx.strokeStyle = '#f2efe8'; cx.lineWidth = 12; cx.beginPath(); cx.arc(8, -46, 22, Math.PI, 0); cx.stroke();
  cx.fillStyle = '#e4dfd4'; cx.beginPath(); cx.ellipse(-70, 0, 12, 42, 0, 0, 7); cx.fill();
  cx.fillStyle = '#4a2a12'; cx.beginPath(); cx.ellipse(-71, 0, 8, 34, 0, 0, 7); cx.fill();
  cx.fillStyle = '#d4362c'; cx.font = `900 20px 'Noto Sans KR', sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('야근 중', 10, 4);
  cx.restore();
}
function drawBin() {
  const [x, y, r] = st.bin;
  cx.save(); cx.shadowColor = 'rgba(20,10,0,.55)'; cx.shadowBlur = 18; cx.shadowOffsetY = 8;
  cx.fillStyle = '#2f3136'; cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.fill(); cx.restore();
  const g = cx.createRadialGradient(x, y, r * .2, x, y, r * .92); g.addColorStop(0, '#101114'); g.addColorStop(1, '#25272c');
  cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, r * .88, 0, 7); cx.fill();
  st.notes.filter(n => n.binned && n.k >= 1).forEach((n, i) => { cx.save(); cx.translate(x + Math.cos(i * 2.3) * r * .35, y + Math.sin(i * 2.3) * r * .3); cx.rotate(i * 1.7); cx.fillStyle = n.c; cx.beginPath(); blob(cx, 0, 0, 20, 9, .35); cx.fill(); cx.restore(); });
  cx.strokeStyle = 'rgba(255,255,255,.08)'; cx.lineWidth = 3; cx.beginPath(); cx.arc(x, y, r * .94, 0, 7); cx.stroke();
}
function drawNote(n) {
  const k = n.binned ? Math.min(1, n.k) : 0;
  if (k >= 1) return;
  const [bx, by] = st.bin, cxn = n.x + n.w / 2, cyn = n.y + n.h / 2;
  const px = cxn + (bx - cxn) * k, py = cyn + (by - cyn) * k, s = 1 - .8 * k;
  const lifted = st.drag && st.drag.note === n;
  cx.save(); cx.translate(px, py); cx.rotate(n.rot + k * 3); cx.scale(s * (lifted ? 1.06 : 1), s * (lifted ? 1.06 : 1));
  cx.shadowColor = 'rgba(30,15,5,.4)'; cx.shadowBlur = lifted ? 22 : 8; cx.shadowOffsetX = lifted ? 8 : 3; cx.shadowOffsetY = lifted ? 14 : 5;
  cx.fillStyle = n.c; cx.fillRect(-n.w / 2, -n.h / 2, n.w, n.h); cx.shadowColor = 'transparent';
  cx.fillStyle = 'rgba(0,0,0,.06)'; cx.fillRect(-n.w / 2, -n.h / 2, n.w, 22);
  cx.fillStyle = '#2b2b33'; cx.font = `38px ${PEN}`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(n.t, 0, 8);
  cx.restore();
}
function drawCrumbs() {
  cx.lineCap = 'round';
  st.crumbs.forEach(c => {
    if (c.off >= 1) return;
    cx.globalAlpha = 1 - c.off; cx.strokeStyle = '#9b9690'; cx.lineWidth = 4.5;
    cx.beginPath(); cx.moveTo(c.x - Math.cos(c.a) * c.len / 2, c.y - Math.sin(c.a) * c.len / 2); cx.lineTo(c.x + Math.cos(c.a) * c.len / 2, c.y + Math.sin(c.a) * c.len / 2); cx.stroke();
    cx.strokeStyle = '#c7c2bb'; cx.lineWidth = 1.5; cx.stroke();
  });
  cx.globalAlpha = 1;
}
function drawClock() {
  const [x, y] = LY.clock, t = Math.max(0, st.t), sec = Math.ceil(t), hot = st.mode === 'play' && t < 10;
  const label = st.mode === 'lose' || t <= 0 ? '00:00:00' : `23:59:${String(60 - sec).padStart(2, '0')}`;
  cx.save(); cx.translate(x, y); if (hot) cx.scale(1 + Math.max(0, .06 - (t % 1) * .06), 1 + Math.max(0, .06 - (t % 1) * .06));
  cx.fillStyle = 'rgba(15,12,10,.78)'; cx.beginPath(); cx.roundRect(-150, -34, 300, 68, 10); cx.fill();
  cx.fillStyle = hot ? '#ff4b3e' : '#ff8a3d'; cx.font = `700 44px 'IBM Plex Mono', monospace`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.shadowColor = cx.fillStyle; cx.shadowBlur = 14; cx.fillText(label, 0, 2); cx.shadowBlur = 0;
  cx.restore();
}
function drawFx(dt) {
  st.fx = st.fx.filter(f => (f.t += dt) < f.d);
  st.fx.forEach(f => {
    const k = f.t / f.d; cx.globalAlpha = 1 - k;
    if (f.kind === 'pop') { cx.strokeStyle = f.c; cx.lineWidth = 3; cx.beginPath(); cx.arc(f.x, f.y, 10 + k * 40, 0, 7); cx.stroke(); }
    if (f.kind === 'txt') { cx.fillStyle = f.c; cx.font = `700 22px 'Noto Sans KR', sans-serif`; cx.textAlign = 'center'; cx.fillText(f.s, f.x, f.y - k * 40); }
    cx.globalAlpha = 1;
  });
}
function drawResult() {
  if (st.mode !== 'win' && st.mode !== 'lose') return;
  const k = Math.min(1, (now - st.result) / 260), sc = 1 + (1 - k) * 1.6, win = st.mode === 'win';
  cx.fillStyle = `rgba(20,12,8,${.45 * k})`; cx.fillRect(-OX / S, -OY / S, W / S, H / S);
  cx.save(); cx.translate(DW / 2, DH * .45); cx.rotate(-.12); cx.scale(sc, sc); cx.globalAlpha = k;
  const col = win ? '#e0302a' : '#f3efe6';
  cx.strokeStyle = col; cx.lineWidth = 10; cx.beginPath(); cx.roundRect(-300, -100, 600, 200, 24); cx.stroke();
  cx.lineWidth = 3; cx.beginPath(); cx.roundRect(-282, -82, 564, 164, 16); cx.stroke();
  cx.fillStyle = col; cx.font = `900 96px 'Noto Serif KR', serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.fillText(win ? '제출 완료' : '마감 실패', 0, -8);
  cx.font = `700 22px 'IBM Plex Mono', 'Noto Sans KR', monospace`;
  cx.fillText(win ? `23:59:${String(60 - Math.ceil(st.t)).padStart(2, '0')} 제출 · ${st.t.toFixed(1)}초 남김` : `남은 일 ${TASKS.filter(t => !st.done[t.k]).length}개`, 0, 62);
  cx.restore();
}

let actx = null, scrubG = null;
function audio() {
  if (actx) return;
  try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
  const len = actx.sampleRate * 2, b = actx.createBuffer(1, len, actx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const s = actx.createBufferSource(); s.buffer = b; s.loop = true;
  const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = .6;
  scrubG = actx.createGain(); scrubG.gain.value = 0; s.connect(f).connect(scrubG).connect(actx.destination); s.start();
}
function tone(fr, dur = .12, type = 'sine', vol = .18, at = 0) {
  if (!actx) return;
  const t = actx.currentTime + at, o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.value = fr;
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + .02);
}
function thud() { if (!actx) return; tone(90, .2, 'sine', .5); tone(180, .08, 'triangle', .2); }
const ding = () => { tone(1046, .25, 'triangle', .14); tone(1568, .35, 'triangle', .1, .07); };

function world(e) { return { x: (e.clientX - OX) / S, y: (e.clientY - OY) / S }; }
function complete(k) {
  if (st.done[k]) return;
  st.done[k] = 1; st.doneAt[k] = now; ding();
  if (TASKS.every(t => st.done[t.k])) { st.mode = 'win'; st.result = now; [523, 659, 784, 1046].forEach((f, i) => tone(f, .35, 'triangle', .16, i * .09)); thud(); showOv('다시 하기', `${st.t.toFixed(1)}초 남기고 제출했어요`); }
}
let last = null;
cv.addEventListener('pointerdown', e => {
  if (st.mode !== 'play') return;
  audio(); try { cv.setPointerCapture(e.pointerId); } catch {}
  const p = world(e); last = { ...p, t: performance.now() };
  for (let i = st.notes.length - 1; i >= 0; i--) {
    const n = st.notes[i]; if (n.binned) continue;
    const c = Math.cos(-n.rot), s = Math.sin(-n.rot), dx = p.x - n.x - n.w / 2, dy = p.y - n.y - n.h / 2;
    if (Math.abs(dx * c - dy * s) < n.w / 2 && Math.abs(dx * s + dy * c) < n.h / 2) { st.notes.splice(i, 1); st.notes.push(n); st.drag = { note: n, dx: p.x - n.x, dy: p.y - n.y }; tone(700, .05, 'square', .05); return; }
  }
  for (const f of st.forms) if (!f.done && inside(f, p.x, p.y)) {
    f.done = 1; f.at = now; f.sr = rnd(-.4, .2); thud(); st.shake = .25;
    if (st.forms.every(f => f.done)) complete('stamp'); return;
  }
  if (inside(st.doc, p.x, p.y)) {
    const l = toLocal(st.doc, p.x, p.y);
    for (const t of st.typos) if (!t.fixed && l.x > t.box[0] && l.x < t.box[0] + t.box[2] && l.y > t.box[1] && l.y < t.box[1] + t.box[3]) {
      t.fixed = 1; t.at = now; tone(1320, .08, 'triangle', .12); st.fx.push({ kind: 'pop', x: p.x, y: p.y, c: '#1f4fa8', t: 0, d: .4 });
      if (st.typos.every(t => t.fixed)) complete('typo'); return;
    }
  }
  st.drag = { brush: 1 };
});
cv.addEventListener('pointermove', e => {
  if (!st) return;
  const p = world(e);
  if (st.mode === 'play' && !st.drag) {
    const overNote = st.notes.some(n => !n.binned && Math.hypot(p.x - n.x - n.w / 2, p.y - n.y - n.h / 2) < 70);
    const overTypo = inside(st.doc, p.x, p.y) && st.typos.some(t => { if (t.fixed || !t.box) return 0; const l = toLocal(st.doc, p.x, p.y); return l.x > t.box[0] && l.x < t.box[0] + t.box[2] && l.y > t.box[1] && l.y < t.box[1] + t.box[3]; });
    const overForm = st.forms.some(f => !f.done && inside(f, p.x, p.y));
    cv.style.cursor = overNote ? 'grab' : overTypo || overForm ? 'pointer' : 'crosshair';
  }
  if (!st.drag || !last || st.mode !== 'play') return;
  const t = performance.now(), dt = Math.max(1, t - last.t) / 1000, vx = (p.x - last.x) / dt, vy = (p.y - last.y) / dt;
  if (st.drag.note) { const n = st.drag.note; n.x = p.x - st.drag.dx; n.y = p.y - st.drag.dy; cv.style.cursor = 'grabbing'; }
  else {
    mctx.save(); mctx.globalCompositeOperation = 'destination-out'; mctx.globalAlpha = .14; mctx.lineCap = 'round'; mctx.lineWidth = 72 / 2;
    mctx.beginPath(); mctx.moveTo(last.x / 2, last.y / 2); mctx.lineTo(p.x / 2, p.y / 2); mctx.stroke(); mctx.restore();
    st.wiped = (st.wiped || 0) + Math.hypot(p.x - last.x, p.y - last.y);
    const sp = Math.hypot(vx, vy);
    st.crumbs.forEach(c => {
      if (c.off) return;
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (d < 60 && sp > 150) { const f = (1 - d / 60) * .55; c.vx += vx * f; c.vy += vy * f; }
    });
    if (scrubG) scrubG.gain.setTargetAtTime(Math.min(.22, sp / 9000), actx.currentTime, .03);
  }
  last = { ...p, t };
});
addEventListener('pointerup', () => {
  if (!st) return;
  if (st.drag && st.drag.note) {
    const n = st.drag.note, [bx, by, br] = st.bin;
    if (Math.hypot(n.x + n.w / 2 - bx, n.y + n.h / 2 - by) < br + 30) {
      n.binned = 1; n.k = 0; tone(220, .15, 'sawtooth', .06); tone(160, .2, 'triangle', .1, .05);
      if (st.notes.every(n => n.binned)) complete('note');
    }
  }
  st.drag = null; last = null; if (scrubG) scrubG.gain.setTargetAtTime(0, actx.currentTime, .05);
});

const papers = () => [st.doc, st.sketch, st.memo, ...st.forms];
let now = performance.now(), prev = now, nextTick = 0, maskT = 0;
function step(dt) {
  if (st.mode === 'play') {
    st.t -= dt;
    if (st.t <= 0) { st.t = 0; st.mode = 'lose'; st.result = now; tone(196, .6, 'sawtooth', .12); tone(147, .8, 'sawtooth', .12, .25); showOv('다시 하기', `남은 일 ${TASKS.filter(t => !st.done[t.k]).length}개 · 다음엔 꼭`); }
    const sec = Math.ceil(st.t);
    if (sec !== nextTick) { nextTick = sec; if (sec <= 10) { tone(1760, .05, 'square', .07); } else tone(900, .03, 'square', .035); }
    if (st.t < 10 && Math.ceil(st.t * 2) !== st.half) { st.half = Math.ceil(st.t * 2); if (st.t < 5) tone(1760, .04, 'square', .05); }
  }
  st.crumbs.forEach(c => {
    c.x += c.vx * dt; c.y += c.vy * dt; const fr = Math.exp(-5 * dt); c.vx *= fr; c.vy *= fr;
    if (Math.abs(c.vx) + Math.abs(c.vy) > 20) c.a += dt * 6;
    if (!c.gone && Math.abs(c.vx) + Math.abs(c.vy) < 40 && !papers().some(p => inside(p, c.x, c.y))) c.gone = 1;
    if (c.gone) c.off = Math.min(1, c.off + dt * 1.5);
  });
  if (st.mode === 'play' && st.crumbs.every(c => c.gone)) complete('crumb');
  st.notes.forEach(n => { if (n.binned) n.k += dt * 3.2; });
  maskT -= dt;
  if (st.mode === 'play' && maskT <= 0 && st.wiped) { maskT = .25; maskLeft = countMask() / mask0; if (maskLeft < .05) { mctx.clearRect(0, 0, M.width, M.height); maskLeft = 0; complete('coffee'); } }
  st.shake = Math.max(0, st.shake - dt);
}
function render(dt) {
  cx.setTransform(DPR * S, 0, 0, DPR * S, DPR * OX, DPR * OY);
  if (st.shake || (st.mode === 'play' && st.t < 5)) { const a = st.shake * 14 + (st.mode === 'play' && st.t < 5 ? 1.8 : 0); cx.translate(rnd(-a, a), rnd(-a, a)); }
  desk();
  drawSketch(); drawDoc(); drawForms(); drawCoffee(); drawMug(); drawMemo(); drawBin(); drawCrumbs();
  st.notes.forEach(drawNote); drawFx(dt); drawClock();
  if (st.mode === 'play' && st.t < 10) {
    const a = (.18 + .14 * Math.sin(now / 120)) * (1 - st.t / 10);
    const g = cx.createRadialGradient(DW / 2, DH / 2, Math.min(DW, DH) * .35, DW / 2, DH / 2, Math.max(DW, DH) * .75);
    g.addColorStop(0, 'rgba(255,0,0,0)'); g.addColorStop(1, `rgba(220,20,10,${a})`); cx.fillStyle = g; cx.fillRect(-OX / S, -OY / S, W / S, H / S);
  }
  drawResult();
}
function loop(t) { now = t; const dt = Math.min(.05, (t - prev) / 1000); prev = t; step(dt); render(dt); requestAnimationFrame(loop); }

function resize() {
  DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR;
  S = Math.min(W / DW, H / DH); OX = (W - DW * S) / 2; OY = (H - DH * S) / 2;
}
addEventListener('resize', () => { const p = innerWidth < innerHeight; if (p !== port && st.mode !== 'play') newRound(); else resize(); });
function showOv(btn, sub) { $('#go').textContent = btn; $('.sub').textContent = sub; $('#ov').classList.remove('hide'); }
$('#go').onclick = () => {
  audio();
  if (st.mode !== 'ready') newRound();
  st.mode = 'play'; st.t = TIME; nextTick = TIME + 1; $('#ov').classList.add('hide');
};
document.fonts.load(`40px 'Nanum Pen Script'`).then(() => Promise.all([document.fonts.load("900 30px 'Noto Serif KR'"), document.fonts.load("500 22px 'Noto Serif KR'"), document.fonts.load("700 44px 'IBM Plex Mono'")])).then(() => { newRound(); requestAnimationFrame(loop); });

